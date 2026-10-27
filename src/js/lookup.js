// =============================================================
// FIND AN ITEM
// A search box that opens over any page (header button, landing
// page button, or the "/" key). Type an item and see how many you
// still need, which stations use it, and where disassembly gives it.
// =============================================================
import { STATIONS, DISASSEMBLY } from './data.js';
import { shoppingList } from './calc.js';
import { usedTags } from './views/shopping.js';
import { icon, esc } from './icons.js';

// Every item name the site knows: recipes plus disassembly
const ALL_ITEMS = [
  ...new Set([
    ...STATIONS.flatMap((s) => s.levels.flatMap((l) => l.items.map((it) => it.item))),
    ...DISASSEMBLY.flatMap((r) => [r.item, ...r.outputs]),
  ]),
].sort((a, b) => a.localeCompare(b));

const ui = { el: null, input: null, results: null, lastFocus: null };

export const isLookupOpen = () => !!ui.el && !ui.el.hidden;

export function initLookup() {
  const el = document.createElement('div');
  el.className = 'lookup';
  el.hidden = true;
  el.innerHTML = `
    <div class="lookup__scrim" data-lookup-close></div>
    <section class="lookup__box" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
      <header class="lookup__head">
        <h2 class="lookup__title" id="lookup-title">${icon('search')}Find an item</h2>
        <button class="btn btn--icon btn--sm" type="button" data-lookup-close aria-label="Close">${icon('close')}</button>
      </header>
      <input class="search lookup__input" type="search" placeholder="Type an item, for example Steel"
             aria-label="Item name" autocomplete="off" spellcheck="false">
      <p class="lookup__hint">Tip: press <kbd>/</kbd> on any page to open this.</p>
      <div class="lookup__results" aria-live="polite"></div>
    </section>`;
  document.body.appendChild(el);
  ui.el = el;
  ui.input = el.querySelector('.lookup__input');
  ui.results = el.querySelector('.lookup__results');

  ui.input.addEventListener('input', render);
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-lookup-close]')) closeLookup();
    // Following a station link closes the search
    else if (e.target.closest('a[href^="#"]')) closeLookup(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isLookupOpen()) {
      e.stopPropagation();
      closeLookup();
      return;
    }
    // "/" opens the search unless the player is typing somewhere
    const typing = e.target.closest?.('input, textarea, [contenteditable="true"]');
    if (e.key === '/' && !typing && !isLookupOpen()) {
      e.preventDefault();
      openLookup();
    }
  }, true);
}

export function openLookup() {
  if (!ui.el) return;
  ui.lastFocus = document.activeElement;
  ui.el.hidden = false;
  document.body.classList.add('is-looking');
  render();
  requestAnimationFrame(() => {
    ui.el.classList.add('is-open');
    ui.input.focus();
    ui.input.select();
  });
}

export function closeLookup(restoreFocus = true) {
  if (!isLookupOpen()) return;
  ui.el.classList.remove('is-open');
  ui.el.hidden = true;
  document.body.classList.remove('is-looking');
  if (restoreFocus) ui.lastFocus?.focus?.({ preventScroll: true });
}

function card(name, rows) {
  const row = rows.get(name);
  const breaksInto = DISASSEMBLY.filter((r) => r.outputs.includes(name));
  const breaksDown = DISASSEMBLY.find((r) => r.item === name);

  const need = row?.need
    ? `<dl class="lookup__nums">
         <div><dt>Still need</dt><dd>${row.need}</dd></div>
         <div><dt>In storage</dt><dd>${row.storage}</dd></div>
         <div><dt>Left</dt><dd class="${row.left ? 'is-left' : 'is-done'}">${row.left || '✓'}</dd></div>
       </dl>
       <div class="shop__used">${usedTags(row.uses)}</div>`
    : `<p class="lookup__none">No level you still have to build needs this.</p>`;

  const dis = [
    ...breaksInto.map((r) => `${icon('split')}<span>Get it by disassembling <b>${esc(r.item)}</b> (${r.hours} h)</span>`),
    breaksDown ? `${icon('split')}<span>Disassembles into <b>${breaksDown.outputs.map(esc).join(', ')}</b> (${breaksDown.hours} h)</span>` : '',
  ].filter(Boolean);

  return `
    <article class="lookup__item">
      <h3 class="lookup__name">${esc(name)}</h3>
      ${need}
      ${dis.length ? `<a class="lookup__dis" href="#disassembly">${dis.join('</a><a class="lookup__dis" href="#disassembly">')}</a>` : ''}
    </article>`;
}

function render() {
  const q = ui.input.value.trim().toLowerCase();
  const rows = new Map(shoppingList().map((r) => [r.name, r]));

  if (!q) {
    // Nothing typed yet: show the items still needed most
    const top = [...rows.values()].filter((r) => r.left > 0).slice(0, 4);
    ui.results.innerHTML = top.length
      ? `<p class="lookup__label">Most needed right now</p>${top.map((r) => card(r.name, rows)).join('')}`
      : `<p class="lookup__none">You have everything for every level. Nice work.</p>`;
    return;
  }

  // Names that start with the text come before names that contain it
  const hits = ALL_ITEMS.filter((n) => n.toLowerCase().includes(q)).sort(
    (a, b) => a.toLowerCase().startsWith(q) * -1 - b.toLowerCase().startsWith(q) * -1
  );
  ui.results.innerHTML = hits.length
    ? `<p class="lookup__label">${hits.length} item${hits.length === 1 ? '' : 's'} found</p>${hits.slice(0, 8).map((n) => card(n, rows)).join('')}`
    : `<p class="lookup__none">No item called "${esc(ui.input.value.trim())}". Try a shorter word.</p>`;
}
