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
import { dustMarkup, smokeMarkup, Flicker } from './scene-parts.js';

const W = 1759;
const H = 894;

// Spots in image pixels
const TUBE = { from: [635, 197], to: [810, 215] };
const SMOKE = [1286, 578];
const SCREEN = 'M1372,532 L1425,533 L1425,573 L1372,574Z';

// Light pools get more dust: [x, y, w, h, count]
const DUST = [
  [600, 200, 260, 260, 16], // under the left ceiling light
  [1060, 90, 260, 300, 8], // under the right ceiling light
  [1230, 230, 160, 220, 5], // orange lamp
  [0, 80, W, H - 160, 14], // a little everywhere
];

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

    const id = `ws-${++count}`;
    const [x1, y1] = TUBE.from;
    const [x2, y2] = TUBE.to;

    root.insertAdjacentHTML(
      'beforeend',
      `<svg class="scene__effects" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
            aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
          <filter id="${id}-glow" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
          <clipPath id="${id}-screen"><path d="${SCREEN}"/></clipPath>
        </defs>

        ${dustMarkup(DUST)}

        <!-- Ceiling light: soft white bloom, and a dark layer that the flicker shows -->
        <path class="ws__tube-bloom" d="M${x1},${y1} L${x2},${y2}" stroke="#eef5ff" stroke-opacity=".22" stroke-width="9" stroke-linecap="round" filter="url(#${id}-glow)"/>
        <g class="ws__tube-dim" fill="#040506">
          <path d="M612,192 L834,207 L842,335 L604,322Z" filter="url(#${id}-soft)"/>
          <path d="M${x1},${y1} L${x2},${y2}" stroke="#1a1d1f" stroke-width="5" stroke-linecap="round"/>
        </g>

        <!-- Device screen: a slow scan line, and a dark layer for the flicker -->
        <g clip-path="url(#${id}-screen)">
          <rect class="screen-scan" x="1370" y="528" width="58" height="3" fill="#bfeaff"/>
          <path class="ws__screen-dim" d="${SCREEN}" fill="#01060a"/>
        </g>

        ${smokeMarkup(id, ...SMOKE)}
      </svg>`
    );

    this.effects = root.querySelector('.scene__effects');
    const tubeDim = root.querySelector('.ws__tube-dim');
    const bloom = root.querySelector('.ws__tube-bloom');
    const screenDim = root.querySelector('.ws__screen-dim');

    this.flickers = [
      new Flicker(
        (level) => {
          tubeDim.style.opacity = String(level);
          bloom.style.opacity = String(1 - level * 1.6);
        },
        { wait: [1600, 4800], depth: [0.35, 0.25] }
      ),
      new Flicker((level) => (screenDim.style.opacity = String(level)), { wait: [900, 3400], depth: [0.45, 0.35] }),
    ];

    this.sync = this.sync.bind(this);
    this.media.addEventListener('change', this.sync);
    document.addEventListener('visibilitychange', this.sync);
    this.image.addEventListener('load', this.sync);
    this.image.addEventListener('error', this.sync);
    this.sync();
  }

  sync() {
    if (this.destroyed) return;
    this.running =
      !this.paused && !this.media.matches && !document.hidden && this.image.complete && this.image.naturalWidth > 0;
    this.root.dataset.running = String(this.running);
    this.flickers.forEach((f) => (this.running ? f.start() : f.stop()));
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
    this.flickers.forEach((f) => f.stop());
    this.media.removeEventListener('change', this.sync);
    document.removeEventListener('visibilitychange', this.sync);
    this.image.removeEventListener('load', this.sync);
    this.image.removeEventListener('error', this.sync);
    this.effects.remove();
    this.root.dataset.running = 'false';
  }
}
