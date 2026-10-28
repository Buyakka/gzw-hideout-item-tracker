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

  // Callouts, like a printed manual: a pink ring around each part,
  // a numbered badge next to it and an arrow from the badge to the
  // part. The guide text lists the same numbers. Each mark is
  // { sel, nth, side: top|bottom|left|right, gap, dx, dy }.
  const mark = (marks) =>
    run(`(() => {
      document.querySelectorAll('.gmark, .gmark-svg').forEach((e) => e.remove());
      const PINK = '#ff2d78';
      const R = 15;
      const doc = document.documentElement;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'gmark-svg');
      svg.setAttribute('width', doc.scrollWidth);
      svg.setAttribute('height', doc.scrollHeight);
      Object.assign(svg.style, { position: 'absolute', left: 0, top: 0, zIndex: 2147483646, pointerEvents: 'none', overflow: 'visible' });
      svg.innerHTML = '<defs><marker id="gm-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="' + PINK + '"/></marker></defs>';
      document.body.appendChild(svg);
      const add = (cls, css, text = '') => {
        const d = document.createElement('div');
        d.className = 'gmark ' + cls;
        d.textContent = text;
        Object.assign(d.style, { position: 'absolute', zIndex: 2147483647, pointerEvents: 'none', boxSizing: 'border-box' }, css);
        document.body.appendChild(d);
      };
      ${JSON.stringify(marks)}.forEach((m, i) => {
        const el = document.querySelectorAll(m.sel)[m.nth ?? 0];
        if (!el) return console.warn('no element for', m.sel);
        const r = el.getBoundingClientRect();
        const pad = 4;
        const L = r.left + scrollX - pad, T = r.top + scrollY - pad;
        const W = r.width + pad * 2, H = r.height + pad * 2;
        add('gmark__ring', {
          left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px',
          border: '3px solid ' + PINK, borderRadius: '8px',
          boxShadow: '0 0 0 2px rgb(0 0 0 / 0.85), 0 0 14px 2px rgb(255 45 120 / 0.55)',
        });
        // Badge centre, beside the part
        const side = m.side ?? 'top';
        const gap = m.gap ?? 34;
        const cx = L + W / 2 + (m.dx ?? 0), cy = T + H / 2 + (m.dy ?? 0);
        const bx = side === 'left' ? L - gap - R : side === 'right' ? L + W + gap + R : cx;
        const by = side === 'top' ? T - gap - R : side === 'bottom' ? T + H + gap + R : cy;
        // Arrow from the badge edge to the nearest point of the ring
        const tx = Math.min(Math.max(bx, L), L + W), ty = Math.min(Math.max(by, T), T + H);
        const len = Math.hypot(tx - bx, ty - by) || 1;
        const sx = bx + ((tx - bx) / len) * (R + 2), sy = by + ((ty - by) / len) * (R + 2);
        const ex = tx - ((tx - bx) / len) * 5, ey = ty - ((ty - by) / len) * 5;
        svg.insertAdjacentHTML('beforeend',
          '<line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="#000" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round"/>' +
          '<line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="' + PINK + '" stroke-width="3.5" stroke-linecap="round" marker-end="url(#gm-head)"/>');
        add('gmark__badge', {
          left: bx - R + 'px', top: by - R + 'px', width: R * 2 + 'px', height: R * 2 + 'px',
          display: 'grid', placeItems: 'center', borderRadius: '50%',
          font: '800 16px/1 system-ui, sans-serif', color: '#fff', background: '#d10a5a',
          border: '2px solid #fff', boxShadow: '0 0 0 2px rgb(0 0 0 / 0.85), 0 3px 8px rgb(0 0 0 / 0.6)',
        }, String(i + 1));
      });
      return true;
    })()`);
  const unmark = () => run(`document.querySelectorAll('.gmark, .gmark-svg').forEach((e) => e.remove()); true`);

  // Area of one or more elements (union), with a little padding.
  // Callout badges and rings count too, so none get cut off.
  const rect = (selectors, pad = 0) =>
    run(`(() => {
      const els = ${JSON.stringify(selectors)}.flatMap((s) => [...document.querySelectorAll(s)].slice(0, 1))
        .concat([...document.querySelectorAll('.gmark')]);
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
  await mark([
    { sel: '.home__rooms', side: 'left', gap: 22 },
    { sel: '.home__play', side: 'left', gap: 22 },
    { sel: '.home__tools', side: 'right', gap: 30, dy: -100 },
    { sel: '.home__tool[data-action="text-size"]', side: 'right', gap: 30 },
  ]);
  await shot('home');
  await unmark();

  // 2. A room, with the header and tabs
  await go('#laboratory', 1500);
  await mark([
    { sel: '.room-tabs', side: 'bottom', gap: 26, dx: 200 },
    { sel: '.station-card__level', side: 'right', gap: 60 },
    { sel: '.station-card__next', side: 'right', gap: 40 },
    { sel: '.station-card .pips', side: 'top', gap: 16, dx: 120 },
    { sel: '.station-card__foot .station-card__progress-row', side: 'bottom', gap: 24, dx: 120 },
  ]);
  await shot('room');
  await unmark();

  // 3. The header stats and buttons
  await mark([
    { sel: '.hud__stats .stat', nth: 0, side: 'bottom', gap: 22 },
    { sel: '.hud__stats .stat', nth: 1, side: 'bottom', gap: 22 },
    { sel: '.hud__stats .stat', nth: 2, side: 'bottom', gap: 22 },
    { sel: '.hud__stats .stat', nth: 3, side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="text-size"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="lookup"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="export"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="import"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="reset"]', side: 'bottom', gap: 22 },
  ]);
  await shot('header', await rect(['.hud'], 6));
  await unmark();

  // 3b. Available power in the top bar
  await mark([{ sel: '.hud .stat--power', side: 'bottom', gap: 22 }]);
  await shot('power', await rect(['.hud__stats'], 8));
  await unmark();

  // 3c. Backup, Load and Reset all
  await mark([
    { sel: '.hud__actions [data-action="export"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="import"]', side: 'bottom', gap: 22 },
    { sel: '.hud__actions [data-action="reset"]', side: 'bottom', gap: 22 },
  ]);
  await shot('saving', await rect(['.hud__stats .stat:last-child', '.hud__actions'], 8));
  await unmark();

  // 3d. The Yes / No box before Reset all (answered No)
  await run(`document.querySelector('.hud__actions [data-action="reset"]').click(); true`);
  await wait(500);
  await mark([
    { sel: '.confirm__no', side: 'bottom', gap: 22 },
    { sel: '.confirm__yes', side: 'bottom', gap: 22 },
  ]);
  await shot('reset-all', await rect(['.confirm__box'], 10));
  await unmark();
  await run(`document.querySelector('.confirm__no').click(); true`);
  await wait(300);

  // 4. A finished station (green)
  await go('#utility', 1500);
  await mark([
    { sel: '.station-card .station-card__done', side: 'bottom', gap: 18 },
    { sel: '.station-card .pips', side: 'top', gap: 14, dx: 80 },
  ]);
  await shot('maxed', await rect(['.station-card'], 8));
  await unmark();

  // 5. Station panel, one item row and the bottom buttons
  await size(1366, 900);
  await go('#laboratory/heat-source', 1500);
  await mark([
    { sel: '#panel .panel__levels', side: 'left', gap: 30 },
    { sel: '#panel .level__badge', side: 'left', gap: 30 },
    { sel: '#panel .level__fact', nth: 0, side: 'left', gap: 30 },
    { sel: '#panel .level__fact', nth: 1, side: 'top', gap: 10 },
    { sel: '#panel .level__fact', nth: 2, side: 'bottom', gap: 10 },
    { sel: '#panel .level__fact', nth: 3, side: 'left', gap: 30 },
    { sel: '#panel .level__warn', side: 'left', gap: 30 },
    { sel: '#panel .level__progress', side: 'left', gap: 30 },
    { sel: '#panel .item', side: 'left', gap: 30 },
  ]);
  await shot('panel', await rect(['#panel']));
  await unmark();
  await mark([
    { sel: '.panel .item .stepper', side: 'top', gap: 20 },
    { sel: '.panel .item .item__store-btn', side: 'bottom', gap: 20 },
    { sel: '.panel .item .item__need button', side: 'top', gap: 20 },
  ]);
  await shot('item', await rect(['.panel .item'], 6));
  await unmark();
  await mark([
    { sel: '.panel__foot [data-action="fill-level"]', side: 'top', gap: 22 },
    { sel: '.panel__foot [data-action="clear-level"]', side: 'top', gap: 22 },
    { sel: '.panel__foot [data-action="reset-station"]', side: 'top', gap: 22 },
    { sel: '.panel__foot [data-action="build"]', side: 'top', gap: 22 },
  ]);
  await shot('panel-foot', await rect(['.panel__foot'], 4));
  await unmark();

  // 6. The Yes / No box before a reset
  await run(`document.querySelector('.panel__foot [data-action="reset-station"]').click(); true`);
  await wait(500);
  await mark([
    { sel: '.confirm__no', side: 'bottom', gap: 22 },
    { sel: '.confirm__yes', side: 'bottom', gap: 22 },
  ]);
  await shot('confirm', await rect(['.confirm__box'], 10));
  await unmark();
  await run(`document.querySelector('.confirm__no').click(); true`);
  await wait(300);

  // 6b. Undo build, on the level built last (Heat Source L1)
  await run(`document.querySelector('#panel .level-tab[data-index="0"]').click(); true`);
  await wait(500);
  await mark([{ sel: '.panel__foot [data-action="unbuild"]', side: 'top', gap: 22 }]);
  await shot('undo', await rect(['.panel__foot'], 4));
  await unmark();

  // 6c. What the generator gives (kW), on its first level
  await go('#utility/generator', 1500);
  await run(`document.querySelector('#panel .level-tab[data-index="0"]').click(); true`);
  await wait(500);
  await mark([
    { sel: '#panel .level__fact', nth: 2, side: 'bottom', gap: 22 },
    { sel: '#panel .level__fact', nth: 3, side: 'bottom', gap: 22 },
  ]);
  await shot('power-gen', await rect(['#panel .panel__head', '#panel .level__facts'], 8));
  await unmark();

  // 7. Shopping List: tools, groups and the first rows. A tall window,
  // so nothing has to scroll under the sticky header.
  await size(1366, 1100);
  await go('#shopping', 1500);
  await mark([
    { sel: '.shop-tools .search', side: 'top', gap: 14, dx: -420 },
    { sel: '[data-action="shop-latch"][data-k="next"]', side: 'top', gap: 14 },
    { sel: '[data-action="shop-latch"][data-k="sell"]', side: 'top', gap: 14 },
    { sel: '[data-action="shop-latch"][data-k="hide"]', side: 'top', gap: 14 },
    { sel: '.shop-group', nth: 1, side: 'bottom', gap: 18 },
    { sel: '.shop tbody tr:first-child .stepper', side: 'left', gap: 14, dy: -30 },
    { sel: '.shop tbody tr:first-child .shop__tag', side: 'right', gap: 30 },
  ]);
  await shot('shopping', await rect(['.shop-tools', '.shop tbody tr:nth-child(3)', '.shop thead'], 10));
  await unmark();

  // 7b. Every column title, one number each
  await run(`document.querySelector('.shop-groups').style.visibility = 'hidden'; true`);
  await mark([0, 1, 2, 3, 4, 5, 6].map((n) => ({ sel: '.shop thead th', nth: n, side: 'top', gap: 16 })));
  await shot('columns', await rect(['.shop thead', '.shop tbody tr:nth-child(2)'], 10));
  await unmark();
  await run(`document.querySelector('.shop-groups').style.visibility = ''; true`);

  // 8. Shopping List with the Next upgrades button pushed in
  await run(`document.querySelector('[data-action="shop-latch"][data-k="next"]').click(); true`);
  await wait(600);
  await mark([
    { sel: '[data-action="shop-latch"][data-k="next"]', side: 'top', gap: 14 },
    { sel: '.shop__next', side: 'right', gap: 40 },
    { sel: '.shop__lvl.is-next', side: 'top', gap: 22 },
  ]);
  await shot('shopping-next', await rect(['.shop-tools', '.shop tbody tr:nth-child(3)', '.shop thead'], 10));
  await unmark();
  await run(`document.querySelector('[data-action="shop-latch"][data-k="next"]').click(); true`);

  // 8b. Safe to sell, with a bigger stash so some items are extra.
  // The demo save goes back afterwards for the other shots.
  await run(`localStorage.setItem('buyaka-gzw-hideout:v1', ${JSON.stringify(
    JSON.stringify({ ...DEMO, storage: { ...DEMO.storage, Copper: 20, Wood: 9, Glass: 15 }, assigned: {} })
  )}); true`);
  await reload('#shopping');
  await run(`document.querySelector('[data-action="shop-latch"][data-k="sell"]').click(); true`);
  await wait(600);
  await mark([
    { sel: '[data-action="shop-latch"][data-k="sell"]', side: 'top', gap: 14 },
    { sel: '.shop__extra', nth: 2, side: 'bottom', gap: 22 },
    { sel: '.shop__keep', nth: 0, side: 'top', gap: 22 },
    { sel: '.shop__sold', nth: 1, side: 'right', gap: 30 },
  ]);
  await shot('shopping-sell', await rect(['.shop-tools', '.shop tbody tr:last-child', '.shop thead'], 10));
  await unmark();

  // 8c. Every Safe to sell column title, one number each
  await run(`document.querySelector('.shop-groups').style.visibility = 'hidden'; true`);
  await mark([0, 1, 2, 3, 4, 5, 6].map((n) => ({ sel: '.shop thead th', nth: n, side: 'top', gap: 16 })));
  await shot('sell-columns', await rect(['.shop thead', '.shop tbody tr:first-child'], 10));
  await unmark();
  await run(`document.querySelector('.shop-groups').style.visibility = ''; true`);
  await run(`localStorage.setItem('buyaka-gzw-hideout:v1', ${JSON.stringify(JSON.stringify(DEMO))}); true`);
  await reload('#shopping');

  // 9. Next Upgrades page
  await size(1366, 768);
  await go('#build', 1500);
  await mark([
    { sel: '.bn', side: 'top', gap: 12, dx: 250 },
    { sel: '.bn__state', side: 'bottom', gap: 26 },
  ]);
  await shot('next');
  await unmark();

  // 10. Find an item: first the empty box ("Find these next")
  await run(`document.querySelector('.hud [data-action="lookup"]').click(); true`);
  await wait(500);
  await mark([
    { sel: '.lookup__results .lookup__label', side: 'right', gap: 30 },
    { sel: '.lookup__next', side: 'right', gap: 20 },
    { sel: '.lookup__item .shop__lvl.is-next', side: 'bottom', gap: 16 },
  ]);
  await shot('find-next', await rect(['.lookup__box'], 10));
  await unmark();
  // then a search
  await run(`const i = document.querySelector('.lookup__input'); i.value = 'steel';
             i.dispatchEvent(new Event('input', { bubbles: true })); true`);
  await wait(500);
  await mark([
    { sel: '.lookup__input', side: 'right', gap: 26 },
    { sel: '.lookup__nums > div', nth: 0, side: 'left', gap: 2 },
    { sel: '.lookup__nums > div', nth: 1, side: 'top', gap: 8, dx: 30 },
    { sel: '.lookup__nums > div', nth: 2, side: 'right', gap: 30 },
    { sel: '.lookup .shop__used', side: 'right', gap: 26 },
  ]);
  await shot('find', await rect(['.lookup__box'], 10));
  await unmark();
  await run(`document.querySelector('[data-lookup-close]').click(); true`);

  // 11. Disassembly
  await go('#disassembly', 1500);
  await mark([
    { sel: '.view .search', side: 'top', gap: 12, dx: 250 },
    { sel: '.dis', side: 'left', gap: 8 },
  ]);
  await shot('disassembly');
  await unmark();

  // 12. A Shopping List card on a phone
  // (a fresh load, so the Shopping List filters are back to normal)
  await size(390, 1500, true);
  await reload('#shopping');
  await mark([{ sel: '.shop tbody tr .stepper', side: 'top', gap: 18, dx: -60 }]);
  await shot('phone-card', await rect(['.shop tbody tr'], 8));
  await unmark();

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
