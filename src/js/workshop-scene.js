// =============================================================
// WORKSHOP SCENE
// Animated layer over src/assets/workshop.webp (1759 x 894):
//   - ceiling light over the left bench flickers (white, dim)
//   - cigarette in the ashtray beside the book smokes
//   - the small blue device screen flickers and scans
//   - dust floats in the air, more of it in the light
// Same idea and API as the lab scene (vendor/lab-background):
//   new WorkshopScene(root, { paused }) · setPaused() · destroy()
// Motion stops for reduced motion, hidden tabs and while paused.
// =============================================================

const W = 1759;
const H = 894;

// Spots in image pixels
const TUBE = { from: [635, 197], to: [810, 215] };
const SMOKE = [1286, 578];
const SCREEN = 'M1372,532 L1425,533 L1425,573 L1372,574Z';

// Small seeded random so the dust looks the same on every load
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function dustMarkup() {
  const rand = seeded(7);
  // Light pools get more dust: [x, y, w, h, count]
  const zones = [
    [600, 200, 260, 260, 16], // under the left ceiling light
    [1060, 90, 260, 300, 8], // under the right ceiling light
    [1230, 230, 160, 220, 5], // orange lamp
    [0, 80, W, H - 160, 14], // a little everywhere
  ];
  let out = '';
  for (const [x, y, w, h, n] of zones) {
    for (let i = 0; i < n; i++) {
      const cx = (x + rand() * w).toFixed(1);
      const cy = (y + rand() * h).toFixed(1);
      const r = (0.6 + rand() * 1.3).toFixed(2);
      const style = [
        `--dx:${(-14 + rand() * 28).toFixed(1)}px`,
        `--dy:${(-30 - rand() * 40).toFixed(1)}px`,
        `--o:${(0.25 + rand() * 0.45).toFixed(2)}`,
        `--dur:${(9 + rand() * 10).toFixed(1)}s`,
        `--delay:${(-rand() * 18).toFixed(1)}s`,
      ].join(';');
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" style="${style}"/>`;
    }
  }
  return out;
}

let count = 0;

export class WorkshopScene {
  constructor(root, options = {}) {
    if (!root?.classList.contains('scene')) throw new TypeError('Pass an element with class scene.');
    if (root.querySelector('.scene__effects')) throw new Error('Already mounted. Call destroy() first.');
    this.root = root;
    this.image = root.querySelector('.scene__image');
    if (!this.image) throw new Error('Put the static image inside the scene first.');

    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = Boolean(options.paused);
    this.destroyed = false;
    this.timers = { tube: null, screen: null };

    const id = `ws-${++count}`;
    const [x1, y1] = TUBE.from;
    const [x2, y2] = TUBE.to;
    const [sx, sy] = SMOKE;

    root.insertAdjacentHTML(
      'beforeend',
      `<svg class="scene__effects" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
            aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
          <filter id="${id}-glow" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="${id}-smoke" filterUnits="userSpaceOnUse" x="-50" y="-170" width="100" height="180"><feGaussianBlur stdDeviation=".8"/></filter>
          <linearGradient id="${id}-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-120">
            <stop offset="0" stop-color="#d8dde0" stop-opacity=".85"/>
            <stop offset=".35" stop-color="#cfd5d8" stop-opacity=".7"/>
            <stop offset="1" stop-color="#cfd5d8" stop-opacity="0"/>
          </linearGradient>
          <clipPath id="${id}-screen"><path d="${SCREEN}"/></clipPath>
        </defs>

        <g class="ws__dust" fill="#e9eef0">${dustMarkup()}</g>

        <!-- Ceiling light: soft white bloom, and a dark layer that the flicker shows -->
        <path class="ws__tube-bloom" d="M${x1},${y1} L${x2},${y2}" stroke="#eef5ff" stroke-opacity=".22" stroke-width="9" stroke-linecap="round" filter="url(#${id}-glow)"/>
        <g class="ws__tube-dim" fill="#040506">
          <path d="M612,192 L834,207 L842,335 L604,322Z" filter="url(#${id}-soft)"/>
          <path d="M${x1},${y1} L${x2},${y2}" stroke="#1a1d1f" stroke-width="5" stroke-linecap="round"/>
        </g>

        <!-- Device screen: a slow scan line, and a dark layer for the flicker -->
        <g clip-path="url(#${id}-screen)">
          <rect class="ws__scan" x="1370" y="528" width="58" height="3" fill="#bfeaff"/>
          <path class="ws__screen-dim" d="${SCREEN}" fill="#01060a"/>
        </g>

        <!-- Cigarette: glowing tip and rising smoke -->
        <g transform="translate(${sx} ${sy})">
          <circle class="ws__ember" r="1.6" fill="#ff8a45"/>
          <g class="ws__smoke" fill="none" stroke="url(#${id}-fade)" stroke-linecap="round" filter="url(#${id}-smoke)">
            <path class="ws__smoke-thread" stroke-width="1.4" d="M0,0 C-2,-8 2,-15 0,-24 S-6,-38 -1,-50 S7,-66 1,-81 S-9,-101 -1,-124"/>
            <path class="ws__wisp" stroke-width="3.2" d="M0,-12 C-4,-24 6,-32 1,-45 S-11,-60 -4,-76 S9,-98 0,-120"/>
            <path class="ws__wisp ws__wisp--2" stroke-width="4.4" d="M0,-16 C5,-28 -4,-37 1,-50 S13,-66 4,-83 S-6,-103 3,-124"/>
            <path class="ws__wisp ws__wisp--3" stroke-width="3.6" d="M0,-14 C-2,-29 8,-38 3,-54 S-8,-72 -1,-88 S9,-107 2,-127"/>
          </g>
        </g>
      </svg>`
    );

    this.effects = root.querySelector('.scene__effects');
    this.tubeDim = root.querySelector('.ws__tube-dim');
    this.bloom = root.querySelector('.ws__tube-bloom');
    this.screenDim = root.querySelector('.ws__screen-dim');

    this.sync = this.sync.bind(this);
    this.media.addEventListener('change', this.sync);
    document.addEventListener('visibilitychange', this.sync);
    this.image.addEventListener('load', this.sync);
    this.image.addEventListener('error', this.sync);
    this.sync();
  }

  sync() {
    if (this.destroyed) return;
    this.stopTimers();
    this.setDim('tube', 0);
    this.setDim('screen', 0);
    this.running =
      !this.paused && !this.media.matches && !document.hidden && this.image.complete && this.image.naturalWidth > 0;
    this.root.dataset.running = String(this.running);
    if (this.running) {
      this.schedule('tube');
      this.schedule('screen');
    }
  }

  // Dim one light. Level 0 = normal, higher = darker.
  setDim(which, level) {
    if (which === 'tube') {
      this.tubeDim.style.opacity = String(level);
      this.bloom.style.opacity = String(1 - level * 1.6);
    } else {
      this.screenDim.style.opacity = String(level);
    }
  }

  // Like the lab fridge: one or two quick dips, then a steady pause
  schedule(which) {
    const [min, span] = which === 'tube' ? [1600, 4800] : [900, 3400];
    this.timers[which] = window.setTimeout(() => this.pulse(which, Math.random() < 0.5 ? 2 : 1), min + Math.random() * span);
  }

  pulse(which, remaining) {
    if (this.destroyed || !this.running) return;
    const level = which === 'tube' ? 0.35 + Math.random() * 0.25 : 0.45 + Math.random() * 0.35;
    this.setDim(which, level);
    this.timers[which] = window.setTimeout(() => {
      this.setDim(which, 0);
      if (remaining > 1) {
        this.timers[which] = window.setTimeout(() => this.pulse(which, remaining - 1), 120 + Math.random() * 160);
      } else {
        this.schedule(which);
      }
    }, 70 + Math.random() * 120);
  }

  stopTimers() {
    window.clearTimeout(this.timers.tube);
    window.clearTimeout(this.timers.screen);
    this.timers = { tube: null, screen: null };
  }

  setPaused(paused) {
    if (this.destroyed) return;
    this.paused = Boolean(paused);
    this.sync();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.running = false;
    this.stopTimers();
    this.media.removeEventListener('change', this.sync);
    document.removeEventListener('visibilitychange', this.sync);
    this.image.removeEventListener('load', this.sync);
    this.image.removeEventListener('error', this.sync);
    this.effects.remove();
    this.root.dataset.running = 'false';
  }
}
