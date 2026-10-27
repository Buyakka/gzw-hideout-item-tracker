// =============================================================
// CONFIRM
// A warning box over the page with Yes and No, used before
// anything that erases progress. No has the focus first, so
// pressing Enter by mistake never erases anything. Esc or a
// click outside means No.
// Use: if (await askConfirm({ title, text, yes })) { ... }
// =============================================================
import { icon, esc } from './icons.js';

export function askConfirm({ title, text, yes = 'Yes, reset', no = 'No, keep it' }) {
  return new Promise((resolve) => {
    const lastFocus = document.activeElement;
    const el = document.createElement('div');
    el.className = 'confirm';
    el.innerHTML = `
      <div class="confirm__scrim" data-answer="no"></div>
      <section class="confirm__box" role="alertdialog" aria-modal="true"
               aria-labelledby="confirm-title" aria-describedby="confirm-text">
        <h2 class="confirm__title" id="confirm-title">${icon('warn')}${esc(title)}</h2>
        <p class="confirm__text" id="confirm-text">${esc(text)}</p>
        <p class="confirm__ask">Do you want to continue?</p>
        <div class="confirm__btns">
          <button class="btn confirm__no" type="button" data-answer="no">${esc(no)}</button>
          <button class="btn btn--danger confirm__yes" type="button" data-answer="yes">${icon('reset')}<span>${esc(yes)}</span></button>
        </div>
      </section>`;
    document.body.appendChild(el);
    const buttons = [...el.querySelectorAll('button')];

    const done = (answer) => {
      document.removeEventListener('keydown', onKey, true);
      el.remove();
      lastFocus?.focus?.({ preventScroll: true });
      resolve(answer);
    };

    // Esc means No. Tab stays inside the box.
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        done(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const i = buttons.indexOf(document.activeElement);
        buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    };

    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-answer]');
      if (a) done(a.dataset.answer === 'yes');
    });
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => el.querySelector('.confirm__no').focus());
  });
}
