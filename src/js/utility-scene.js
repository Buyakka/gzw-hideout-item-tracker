// =============================================================
// UTILITY ROOM SCENE
// Animated layer over src/assets/utility.webp (1672 x 941).
// The BUYAKA graffiti is painted into the image itself.
//   - caged lamp over the double door blinks in a loose routine:
//     quick blinks, slow dims, or a short outage, then steady
//   - the diesel generator motor shakes like it is running
//   - exhaust puffs rise from the back of the generator
//   - dust floats, more of it in the window light and lamp light
// Same API as the other scenes: setPaused() · destroy()
// =============================================================
import { dustMarkup } from './scene-dust.js';

const W = 1672;
const H = 941;

// Spots in image pixels
const LAMP = [725, 223];
const MOTOR = 'M895,500 L1170,496 L1175,660 L896,662Z';
const EXHAUST = [840, 488];

const DUST = [
  [220, 230, 420, 490, 18], // window light on the left
  [600, 140, 280, 280, 10], // around the lamp
  [800, 400, 400, 320, 12], // over the generator
  [0, 60, W, H - 120, 14], // a little everywhere
];

// Lamp routines: [darkness 0-1, fade ms, hold ms]
const ROUTINES = {
  blink: () => [[0.85, 30, 90], [0, 30, 120], [0.85, 30, 70], [0, 40, 0]],
  slow: () => [[0.6, 700, 250], [0, 800, 0]],
  outage: () => [
    [0.85, 30, 80], [0, 30, 90],
    [0.92, 60, 1500 + Math.random() * 1600],
    [0.4, 30, 70], [0.9, 30, 120], [0, 60, 0],
  ],
};

let count = 0;

export class UtilityScene {
  constructor(root, options = {}) {
    if (!root?.classList.contains('scene')) throw new TypeError('Pass an element with class scene.');
    if (root.querySelector('.scene__effects')) throw new Error('Already mounted. Call destroy() first.');
    this.root = root;
    this.image = root.querySelector('.scene__image');
    if (!this.image) throw new Error('Put the static image inside the scene first.');

    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = Boolean(options.paused);
    this.destroyed = false;
    this.timer = null;

    const id = `ut-${++count}`;
    const [lx, ly] = LAMP;
    const [ex, ey] = EXHAUST;
    const src = this.image.currentSrc || this.image.src;

    const puffs = [0, 0.7, 1.4, 2.1, 2.8]
      .map((d, i) => `<ellipse class="ut__puff" cx="${(i % 2) * 6 - 3}" cy="0" rx="16" ry="12" style="--delay:-${d}s"/>`)
      .join('');

    root.insertAdjacentHTML(
      'beforeend',
      `<svg class="scene__effects" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
           aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
          <filter id="${id}-edge" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.5"/></filter>
          <radialGradient id="${id}-pool">
            <stop offset="0" stop-color="#000" stop-opacity=".8"/>
            <stop offset=".55" stop-color="#000" stop-opacity=".45"/>
            <stop offset="1" stop-color="#000" stop-opacity="0"/>
          </radialGradient>
          <mask id="${id}-motor"><path d="${MOTOR}" fill="#fff" filter="url(#${id}-edge)"/></mask>
        </defs>

        <!-- Generator: a masked copy of the motor that shakes -->
        <g class="ut__shake">
          <image href="${src}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" mask="url(#${id}-motor)"/>
        </g>

        <!-- Exhaust from the back of the generator -->
        <g transform="translate(${ex} ${ey})" fill="#a6a096" filter="url(#${id}-soft)">${puffs}</g>

        ${dustMarkup(DUST, 11)}

        <!-- Lamp: warm bloom while on, darkness over the bulb and its light when off -->
        <ellipse class="ut__bloom" cx="${lx}" cy="${ly}" rx="22" ry="30" fill="#ffc77a" opacity=".22" filter="url(#${id}-soft)"/>
        <g class="ut__lamp-dim">
          <ellipse cx="${lx}" cy="${ly + 12}" rx="270" ry="200" fill="url(#${id}-pool)"/>
          <ellipse cx="${lx}" cy="${ly}" rx="10" ry="18" fill="#1c140b" opacity=".9"/>
        </g>
      </svg>`
    );

    this.effects = root.querySelector('.scene__effects');
    this.dim = root.querySelector('.ut__lamp-dim');
    this.bloom = root.querySelector('.ut__bloom');

    this.sync = this.sync.bind(this);
    this.media.addEventListener('change', this.sync);
    document.addEventListener('visibilitychange', this.sync);
    this.image.addEventListener('load', this.sync);
    this.image.addEventListener('error', this.sync);
    this.sync();
  }

  sync() {
    if (this.destroyed) return;
    window.clearTimeout(this.timer);
    this.timer = null;
    this.setLamp(0, 0);
    this.running =
      !this.paused && !this.media.matches && !document.hidden && this.image.complete && this.image.naturalWidth > 0;
    this.root.dataset.running = String(this.running);
    if (this.running) this.schedule();
  }

  // Darkness 0 = lamp on, 1 = fully off. Fade in ms.
  setLamp(level, fade) {
    const t = `opacity ${fade}ms ease-in-out`;
    this.dim.style.transition = t;
    this.bloom.style.transition = t;
    this.dim.style.opacity = String(level);
    this.bloom.style.opacity = String(Math.max(0, 1 - level * 1.2));
  }

  // Steady light, then one routine picked at random
  schedule() {
    this.timer = window.setTimeout(() => {
      const r = Math.random();
      const pick = r < 0.45 ? 'blink' : r < 0.75 ? 'slow' : 'outage';
      this.play(ROUTINES[pick](), 0);
    }, 2500 + Math.random() * 3500);
  }

  play(steps, i) {
    if (this.destroyed || !this.running) return;
    if (i >= steps.length) return this.schedule();
    const [level, fade, hold] = steps[i];
    this.setLamp(level, fade);
    this.timer = window.setTimeout(() => this.play(steps, i + 1), fade + hold);
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
    window.clearTimeout(this.timer);
    this.media.removeEventListener('change', this.sync);
    document.removeEventListener('visibilitychange', this.sync);
    this.image.removeEventListener('load', this.sync);
    this.image.removeEventListener('error', this.sync);
    this.effects.remove();
    this.root.dataset.running = 'false';
  }
}
