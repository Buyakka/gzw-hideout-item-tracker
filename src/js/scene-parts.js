// =============================================================
// SCENE PARTS
// Pieces shared by our animated room scenes:
//   dustMarkup()   floating dust specks (seeded, same every load)
//   smokeMarkup()  cigarette tip glow + rising smoke
//   Flicker        a light that dips once or twice, then rests
// Styles live in effects/_scenes.scss.
// =============================================================

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// zones: [[x, y, w, h, count], ...] in image pixels
export function dustMarkup(zones, seed = 7) {
  const rand = seeded(seed);
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
  return `<g class="scene-dust" fill="#e9eef0">${out}</g>`;
}

// Thin smoke thread and 3 wisps rising from (x, y). id keeps the
// filter and gradient names unique per scene.
export function smokeMarkup(id, x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <defs>
        <filter id="${id}-smoke" filterUnits="userSpaceOnUse" x="-50" y="-170" width="100" height="180"><feGaussianBlur stdDeviation=".8"/></filter>
        <linearGradient id="${id}-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-120">
          <stop offset="0" stop-color="#d8dde0" stop-opacity=".85"/>
          <stop offset=".35" stop-color="#cfd5d8" stop-opacity=".7"/>
          <stop offset="1" stop-color="#cfd5d8" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <circle class="smoke__ember" r="1.6" fill="#ff8a45"/>
      <g fill="none" stroke="url(#${id}-fade)" stroke-linecap="round" filter="url(#${id}-smoke)">
        <path class="smoke__thread" stroke-width="1.4" d="M0,0 C-2,-8 2,-15 0,-24 S-6,-38 -1,-50 S7,-66 1,-81 S-9,-101 -1,-124"/>
        <path class="smoke__wisp" stroke-width="3.2" d="M0,-12 C-4,-24 6,-32 1,-45 S-11,-60 -4,-76 S9,-98 0,-120"/>
        <path class="smoke__wisp smoke__wisp--2" stroke-width="4.4" d="M0,-16 C5,-28 -4,-37 1,-50 S13,-66 4,-83 S-6,-103 3,-124"/>
        <path class="smoke__wisp smoke__wisp--3" stroke-width="3.6" d="M0,-14 C-2,-29 8,-38 3,-54 S-8,-72 -1,-88 S9,-107 2,-127"/>
      </g>
    </g>`;
}

// A light that rests, then dips once or twice (like a bad fridge
// light or an old tube). apply(level) draws it: 0 = normal.
//   wait:  [min ms, extra random ms] between dips
//   depth: [min level, extra random level] for each dip
export class Flicker {
  constructor(apply, { wait = [1200, 3600], depth = [0.35, 0.25] } = {}) {
    this.apply = apply;
    this.wait = wait;
    this.depth = depth;
    this.timer = null;
    this.on = false;
  }

  start() {
    this.stop();
    this.on = true;
    this.rest();
  }

  stop() {
    this.on = false;
    window.clearTimeout(this.timer);
    this.timer = null;
    this.apply(0);
  }

  rest() {
    const [min, span] = this.wait;
    this.timer = window.setTimeout(() => this.dip(Math.random() < 0.5 ? 2 : 1), min + Math.random() * span);
  }

  dip(remaining) {
    if (!this.on) return;
    const [min, span] = this.depth;
    this.apply(min + Math.random() * span);
    this.timer = window.setTimeout(() => {
      this.apply(0);
      if (remaining > 1) {
        this.timer = window.setTimeout(() => this.dip(remaining - 1), 120 + Math.random() * 160);
      } else {
        this.rest();
      }
    }, 70 + Math.random() * 120);
  }
}
