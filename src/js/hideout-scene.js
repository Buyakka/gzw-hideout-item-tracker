// =============================================================
// HIDEOUT SCENE
// Main background (landing page, Shopping List, Disassembly):
// src/assets/hideout-bg.webp (1672 x 941), a mix of all 3 rooms.
//   - wall fan spins
//   - cigarette in the ashtray on the front table smokes
//   - fridge light flickers (like the lab)
//   - the small green screen flickers and scans (like the workshop)
//   - the two hanging lamps give whiter light (static tint)
//   - dust floats in the lamp light
// Fills the screen ("cover") and moves with the mouse (parallax
// comes from .bg-fx__photo in effects/_background.scss).
// Same API as the other scenes: setPaused() · destroy()
// =============================================================
import { dustMarkup, smokeMarkup, Flicker } from './scene-parts.js';

const W = 1672;
const H = 941;

// Spots in image pixels
const FAN = { hub: [913, 185], ring: [908, 183, 42, 45] };
const SMOKE = [1223, 538];
const FRIDGE = 'M1572,300 L1664,300 L1664,488 L1572,486Z';
const SCREEN = 'M1487,497 L1535,499 L1535,546 L1487,539Z';
const LAMPS = [
  { x: 1087, y: 162, w: 38 }, // big hanging lamp
  { x: 1262, y: 227, w: 26 }, // small hanging lamp
];

const DUST = [
  [980, 170, 230, 300, 14], // under the big lamp
  [1190, 230, 170, 230, 8], // under the small lamp
  [520, 190, 160, 260, 8], // light at the vault door
  [0, 60, W, H - 120, 16], // a little everywhere
];

let count = 0;

export class HideoutScene {
  constructor(root, options = {}) {
    if (!root?.classList.contains('scene')) throw new TypeError('Pass an element with class scene.');
    if (root.querySelector('.scene__effects')) throw new Error('Already mounted. Call destroy() first.');
    this.root = root;
    this.image = root.querySelector('.scene__image');
    if (!this.image) throw new Error('Put the static image inside the scene first.');

    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = Boolean(options.paused);
    this.destroyed = false;

    const id = `hd-${++count}`;
    const [hx, hy] = FAN.hub;
    const [rx, ry, rw, rh] = FAN.ring;
    // "cover" fills the screen; the SVG layers must crop the same way
    const fit = 'xMidYMid slice';
    const blade = 'M-4,-5 C-30,-21 -23,-46 -10,-40 C4,-36 14,-18 5,-4Z';

    root.insertAdjacentHTML(
      'beforeend',
      `<svg class="scene__tint" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <!-- Takes the orange out of the hanging lamps' light (blended as "saturation") -->
        <defs>
          <radialGradient id="${id}-white">
            <stop offset="0" stop-color="#fff" stop-opacity=".85"/>
            <stop offset=".6" stop-color="#fff" stop-opacity=".4"/>
            <stop offset="1" stop-color="#fff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        ${LAMPS.map((l) => `<ellipse cx="${l.x}" cy="${l.y + 12}" rx="${l.w * 2.4}" ry="${l.w * 1.9}" fill="url(#${id}-white)"/>`).join('')}
      </svg>
      <svg class="scene__effects" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${id}-blade" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1.4"/></filter>
          <filter id="${id}-edge" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
          <filter id="${id}-bloom" x="-60%" y="-200%" width="220%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
          <clipPath id="${id}-fan"><ellipse cx="${rx}" cy="${ry}" rx="${rw}" ry="${rh}"/></clipPath>
          <clipPath id="${id}-screen"><path d="${SCREEN}"/></clipPath>
        </defs>

        ${dustMarkup(DUST, 21)}

        <!-- Hanging lamps: a soft white glow at each shade -->
        ${LAMPS.map((l) => `<ellipse cx="${l.x}" cy="${l.y + 2}" rx="${l.w}" ry="${l.w / 4.5}" fill="#f2f6ff" opacity=".45" filter="url(#${id}-bloom)"/>`).join('')}

        <!-- Fan: blurred blades spinning inside the guard -->
        <g clip-path="url(#${id}-fan)">
          <g transform="translate(${hx} ${hy})">
            <g class="hd__rotor" fill="#0b0906" opacity=".55" filter="url(#${id}-blade)">
              ${[0, 72, 144, 216, 288].map((a) => `<path d="${blade}" transform="rotate(${a}) scale(.95)"/>`).join('')}
            </g>
          </g>
          <circle cx="${hx}" cy="${hy}" r="6" fill="#3a2d1c"/>
        </g>

        <!-- Fridge: a dark layer the flicker shows -->
        <path class="hd__fridge-dim" d="${FRIDGE}" fill="#02080c" filter="url(#${id}-edge)"/>

        <!-- Green screen: scan line, and a dark layer for the flicker -->
        <g clip-path="url(#${id}-screen)">
          <rect class="screen-scan screen-scan--green" x="1485" y="494" width="54" height="3" fill="#9dffd0"/>
          <path class="hd__screen-dim" d="${SCREEN}" fill="#010604"/>
        </g>

        ${smokeMarkup(id, ...SMOKE)}
      </svg>`
    );

    this.effects = root.querySelector('.scene__effects');
    this.tint = root.querySelector('.scene__tint');
    const fridge = root.querySelector('.hd__fridge-dim');
    const screen = root.querySelector('.hd__screen-dim');
    this.flickers = [
      new Flicker((level) => (fridge.style.opacity = String(level)), { wait: [1200, 3600], depth: [0.34, 0.22] }),
      new Flicker((level) => (screen.style.opacity = String(level)), { wait: [900, 3400], depth: [0.45, 0.35] }),
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
    this.tint.remove();
    this.root.dataset.running = 'false';
  }
}
