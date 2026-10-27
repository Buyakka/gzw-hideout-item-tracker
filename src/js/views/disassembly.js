// =============================================================
// DISASSEMBLY VIEW
// Items you can break down in the Electronics Workshop,
// and what each one gives you.
// =============================================================
import { DISASSEMBLY, DISASSEMBLY_NOTE } from '../data.js';
import { icon, esc } from '../icons.js';

const ui = { query: '' };

export function renderDisassembly(el) {
  el.innerHTML = `
    <section class="view" data-room="disassembly">
      <header class="room-banner">
        <div>
          <p class="room-banner__eyebrow">// Electronics Workshop</p>
          <h1 class="room-banner__title">Disassembly</h1>
          <p class="room-banner__desc">Break military devices down into parts. Put the item in the disassembly grid. It keeps running while you are offline. Moving the item resets the timer.</p>
        </div>
        <div class="room-banner__meta">
          <span class="chip">Recipes <b>${DISASSEMBLY.length}</b></span>
          <span class="chip">Time <b>12 h each</b></span>
        </div>
      </header>
      <div class="shop-tools">
        <input class="search" type="search" placeholder="Search items or parts..." value="${esc(ui.query)}"
               data-action="dis-search" aria-label="Search disassembly recipes">
      </div>
      <div data-dis-body>${body()}</div>
      <p class="dis-note">${esc(DISASSEMBLY_NOTE)}</p>
    </section>`;
}

export function refreshDisassemblyBody(root) {
  const b = root.querySelector('[data-dis-body]');
  if (b) b.innerHTML = body();
}

export function setDisQuery(q) {
  ui.query = q;
}

function body() {
  const q = ui.query.trim().toLowerCase();
  const rows = DISASSEMBLY.filter(
    (r) => !q || [r.item, ...r.outputs].some((s) => s.toLowerCase().includes(q))
  );

  if (!rows.length) return `<p class="empty">No recipes match your search.</p>`;

  return `
    <ul class="dis-grid">
      ${rows
        .map(
          (r, i) => `
        <li class="dis" style="--i:${i}">
          <div class="dis__in">
            <span class="dis__label">Break down</span>
            <span class="dis__item">${esc(r.item)}</span>
          </div>
          <div class="dis__time">${icon('clock')}<span>${r.hours} h</span>${icon('arrow')}</div>
          <ul class="dis__out" aria-label="You get">
            ${r.outputs.map((o) => `<li>${esc(o)}</li>`).join('')}
          </ul>
        </li>`
        )
        .join('')}
    </ul>`;
}
