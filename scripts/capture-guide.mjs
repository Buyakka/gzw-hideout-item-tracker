// =============================================================
// CAPTURE GUIDE SCREENSHOTS
// Takes the screenshots for the Guide page from the running dev
// server, with demo progress (never the player's own save).
//
//   1. npm run dev            (site on http://localhost:5174)
//   2. node scripts/capture-guide.mjs
//
// Uses Edge or Chrome already on the computer, in headless mode,
// through the DevTools protocol. Images go to public/guide/.
// Run it again after a design change so the guide stays current.
// =============================================================
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = process.env.SITE ?? 'http://localhost:5174/';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'guide');
const PORT = 9333;
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

// Demo progress: generator maxed, Heat Source L1 built, most of L2 set aside
const DEMO = {
  v: 2,
  built: { 'utility/generator': 2, 'laboratory/heat-source': 1 },
  storage: {
    Steel: 12, 'Plumbing Parts': 2, 'Construction Material': 3, 'Electrical Parts': 4,
    Glass: 2, Wood: 2, Copper: 1, Plastics: 2,
  },
  assigned: {
    'laboratory/heat-source|1|Steel': 4,
    'laboratory/heat-source|1|Plumbing Parts': 2,
    'laboratory/heat-source|1|Construction Material': 3,
  },
  used: {},
  need: {},
  savedAt: null,
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const exe = BROWSERS.find((p) => existsSync(p));
  if (!exe) throw new Error('No Edge or Chrome found');
  const profile = join(tmpdir(), `guide-shots-${Date.now()}`);
  const browser = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank',
  ]);

  let page;
  for (let i = 0; i < 40 && !page; i++) {
    await wait(250);
    try {
      page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page');
    } catch {
      /* browser still starting */
    }
  }
  if (!page) throw new Error('Browser did not start');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const run = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

  const size = (width, height, mobile = false) =>
    send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1.5, mobile });

  // No slide-in animations, so every shot is sharp and complete
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await size(1366, 768);
  await send('Page.enable');
  await send('Page.navigate', { url: SITE });
  await wait(1500);
  await run(`localStorage.setItem('buyaka-gzw-hideout:v1', ${JSON.stringify(JSON.stringify(DEMO))});
             localStorage.setItem('buyaka-gzw-hideout:last-room', 'laboratory'); true`);

  const go = async (hash, ms = 1200) => {
    await run(`location.hash = '${hash}'; true`);
    await wait(ms);
  };
  const reload = async (hash) => {
    await run(`location.hash = '${hash}'; location.reload(); true`);
    await wait(2500);
  };

  // Area of one or more elements (union), with a little padding
  const rect = (selectors, pad = 0) =>
    run(`(() => {
      const els = ${JSON.stringify(selectors)}.flatMap((s) => [...document.querySelectorAll(s)].slice(0, 1));
      if (!els.length) return null;
      const rs = els.map((e) => e.getBoundingClientRect());
      const x = Math.max(0, Math.min(...rs.map((r) => r.left)) - ${pad});
      const y = Math.max(0, Math.min(...rs.map((r) => r.top)) - ${pad}) + scrollY;
      const right = Math.min(innerWidth, Math.max(...rs.map((r) => r.right)) + ${pad});
      const bottom = Math.max(...rs.map((r) => r.bottom)) + ${pad} + scrollY;
      return { x, y, width: right - x, height: bottom - y, scale: 1 };
    })()`);

  mkdirSync(OUT, { recursive: true });
  const shot = async (name, clip) => {
    const res = await send('Page.captureScreenshot', {
      format: 'webp',
      quality: 82,
      captureBeyondViewport: false,
      ...(clip ? { clip } : {}),
    });
    writeFileSync(join(OUT, `${name}.webp`), Buffer.from(res.data, 'base64'));
    console.log('saved', name);
  };

  // 1. Landing page
  await reload('#home');
  await shot('home');

  // 2. A room, with the header and tabs
  await go('#laboratory', 1500);
  await shot('room');

  // 3. The header stats and buttons
  await shot('header', await rect(['.hud']));

  // 4. A finished station (green)
  await go('#utility', 1500);
  await shot('maxed', await rect(['.station-card'], 8));

  // 5. Station panel, one item row and the bottom buttons
  await size(1366, 900);
  await go('#laboratory/heat-source', 1500);
  await shot('panel', await rect(['#panel']));
  await shot('item', await rect(['.panel .item'], 6));
  await shot('panel-foot', await rect(['.panel__foot']));

  // 6. The Yes / No box before a reset
  await run(`document.querySelector('.panel__foot [data-action="reset-station"]').click(); true`);
  await wait(500);
  await shot('confirm', await rect(['.confirm__box'], 10));
  await run(`document.querySelector('.confirm__no').click(); true`);

  // 7. Shopping List: tools, groups and the first rows. A tall window,
  // so nothing has to scroll under the sticky header.
  await size(1366, 1100);
  await go('#shopping', 1500);
  await shot('shopping', await rect(['.shop-tools', '.shop tbody tr:nth-child(3)', '.shop thead'], 10));

  // 8. Shopping List with "Next upgrades only" ticked
  await run(`const c = document.querySelector('[data-action="shop-next"]'); c.checked = true;
             c.dispatchEvent(new Event('change', { bubbles: true })); true`);
  await wait(600);
  await shot('shopping-next', await rect(['.shop-tools', '.shop tbody tr:nth-child(3)', '.shop thead'], 10));
  await run(`const c = document.querySelector('[data-action="shop-next"]'); c.checked = false;
             c.dispatchEvent(new Event('change', { bubbles: true })); true`);

  // 9. Next Upgrades page
  await size(1366, 768);
  await go('#build', 1500);
  await shot('next');

  // 10. Find an item
  await run(`document.querySelector('.hud [data-action="lookup"]').click(); true`);
  await wait(500);
  await run(`const i = document.querySelector('.lookup__input'); i.value = 'steel';
             i.dispatchEvent(new Event('input', { bubbles: true })); true`);
  await wait(500);
  await shot('find', await rect(['.lookup__box'], 10));
  await run(`document.querySelector('[data-lookup-close]').click(); true`);

  // 11. Disassembly
  await go('#disassembly', 1500);
  await shot('disassembly');

  // 12. A Shopping List card on a phone
  // (a fresh load, so the Shopping List filters are back to normal)
  await size(390, 1500, true);
  await reload('#shopping');
  await shot('phone-card', await rect(['.shop tbody tr'], 8));

  ws.close();
  browser.kill();
  await wait(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* the browser may still hold a file for a moment */
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
