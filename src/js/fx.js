// =============================================================
// FX
// 3D card tilt, background parallax and toast messages.
// All motion is skipped if the user prefers reduced motion.
// =============================================================

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- 3D tilt on station cards ----------
export function initTilt(root) {
  let active = null;
  let frame = 0;

  const reset = (card) => {
    card.classList.remove('is-tilting');
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  };

  root.addEventListener('pointermove', (e) => {
    if (reduced() || !finePointer()) return;
    const card = e.target.closest('.station-card');
    if (active && active !== card) reset(active);
    active = card;
    if (!card) return;

    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
  });

  root.addEventListener('pointerleave', () => {
    if (active) reset(active);
    active = null;
  });
}

// ---------- Background parallax ----------
export function initParallax(bg) {
  let frame = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (reduced() || !finePointer()) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        bg.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
        bg.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    },
    { passive: true }
  );
}

// ---------- Toasts ----------
let zone;
export function toast(message, type = 'ok') {
  zone ??= document.querySelector('.toasts');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.setAttribute('role', 'status');
  t.textContent = message;
  zone.append(t);
  setTimeout(() => {
    t.classList.add('is-leaving');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}
