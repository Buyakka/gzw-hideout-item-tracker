// =============================================================
// LOGO
// Original Buyaka emblem: a worn diamond plate with two rank
// chevrons and brush streaks. Drawn in SVG so it stays sharp
// and can animate. Use: logo('logo--lg')
// =============================================================

export function logo(cls = '') {
  return `
    <svg class="logo ${cls}" viewBox="0 0 64 64" fill="none" stroke-linecap="square" aria-hidden="true">
      <g class="logo__streaks">
        <path d="M45 9 59 1M50 15 63 7M54 22 63 16" />
      </g>
      <path class="logo__plate" pathLength="1" d="M32 4 60 32 32 60 4 32Z" />
      <path class="logo__chev logo__chev--top" d="M19 23 32 35 45 23" />
      <path class="logo__chev logo__chev--low" d="M23 34 32 42 41 34" />
    </svg>`;
}

// Fill every [data-logo] placeholder in the page shell
export function mountLogos(root = document) {
  root.querySelectorAll('[data-logo]').forEach((el) => {
    el.innerHTML = logo(el.dataset.logo);
  });
}
