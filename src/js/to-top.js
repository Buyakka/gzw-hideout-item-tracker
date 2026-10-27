// =============================================================
// BACK TO TOP
// Small button in the bottom-right corner on the long pages
// (Shopping List, Disassembly). It shows once you have scrolled
// halfway down the page, and scrolls back up when clicked.
// When the footer scrolls into view the button rises with it, so
// it never covers the footer text.
// =============================================================

const PAGES = ['shopping', 'disassembly'];

const state = { btn: null, page: '', footer: null };

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function update() {
  const { btn, page } = state;
  if (!btn) return;
  const room = PAGES.includes(page);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const show = room && scrollable > 0 && window.scrollY >= scrollable / 2;
  btn.classList.toggle('is-shown', show);
  // How far the footer reaches into the screen = how far to lift
  const top = state.footer ? state.footer.getBoundingClientRect().top : Infinity;
  btn.style.setProperty('--lift', `${Math.max(0, Math.round(window.innerHeight - top))}px`);
  // Hidden buttons stay out of the keyboard tab order
  btn.tabIndex = show ? 0 : -1;
  btn.setAttribute('aria-hidden', String(!show));
}

export function initToTop(btn, footer) {
  state.btn = btn;
  state.footer = footer;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
  });
  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

// Call after each page change (the page height changes too)
export function setToTopPage(page) {
  state.page = page;
  requestAnimationFrame(update);
}
