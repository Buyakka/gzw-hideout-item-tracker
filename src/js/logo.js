// =============================================================
// LOGO
// The Buyaka "B": an angular worn-white B with a gold crown on
// top and a gold chevron at the foot. Redrawn in SVG from the
// user's logo image, so it stays sharp and can animate.
// Use: logo('logo--idle') in the header (plain, glints), or
// logo('logo--intro', LETTER_VIEW) as the first letter of BUYAKA on
// the landing page (texture, shadow, builds itself).
// public/favicon.svg is a flat copy of the same shapes.
// =============================================================

// Shapes in the original image's pixels; the viewBox crops to them
const VIEW = '75 55 330 330';
// Tight crop for using the B as a letter: the B fills y 149-377
// (its cap height) and the crown sticks up above it
export const LETTER_VIEW = '140 60 200 320';
const B = 'M143,149 L293,149 L328,184 L328,212 L291,242 L289,248 L306,248 L337,279 L337,326 L284,373 L215,373 L257,332 L271,328 L294,305 L271,280 L220,280 L219,249 L280,201 L283,195 L273,185 L175,185 Z';
const STEM = 'M146,192 L180,193 L194,208 L194,300 L178,313 L150,287 L150,200 Z';
const CROWN = 'M238,64 L260,110 L271,117 L309,96 L297,122 L289,136 L238,126 L187,136 L179,122 L167,96 L205,117 L216,110 Z';
const CHEV = 'M155,305 L175,321 L187,313 L237,313 L166,377 L155,366 Z';

let count = 0;

export function logo(cls = '', view = VIEW) {
  const id = `logo-${++count}`;
  // Texture and shadow only where the logo is big enough to show them
  const rich = cls.includes('logo--intro');
  return `
    <svg class="logo ${cls}" viewBox="${view}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f1ee"/><stop offset="1" stop-color="#b9b9b5"/></linearGradient>
        <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc23a"/><stop offset="1" stop-color="#d48a0c"/></linearGradient>
        ${
          rich
            ? `<filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".7"/></filter>
               <filter id="${id}-grime" x="0" y="0" width="100%" height="100%">
                 <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="9"/>
                 <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 1.75"/>
                 <feComposite in2="SourceGraphic" operator="in"/>
               </filter>`
            : ''
        }
      </defs>
      <g ${rich ? `filter="url(#${id}-shadow)"` : ''}>
        <path class="logo__stem" d="${STEM}" fill="url(#${id}-w)"/>
        <path class="logo__b" d="${B}" fill="url(#${id}-w)"/>
        <path class="logo__chev" d="${CHEV}" fill="url(#${id}-g)"/>
        <path class="logo__crown" d="${CROWN}" fill="url(#${id}-g)"/>
      </g>
      ${rich ? `<g class="logo__grime" filter="url(#${id}-grime)" fill="#3a3a38" opacity=".28"><path d="${B}"/><path d="${STEM}"/><path d="${CROWN}"/><path d="${CHEV}"/></g>` : ''}
    </svg>`;
}

// Fill every [data-logo] placeholder in the page shell
export function mountLogos(root = document) {
  root.querySelectorAll('[data-logo]').forEach((el) => {
    el.innerHTML = logo(el.dataset.logo);
  });
}
