// =============================================================
// SCENE DUST
// Floating dust specks for the animated room scenes. Seeded, so
// the dust is the same on every load. Animated by .scene-dust in
// effects/_scenes.scss.
//   zones: [[x, y, w, h, count], ...] in image pixels
// =============================================================

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

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
