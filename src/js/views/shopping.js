// =============================================================
// SHOPPING LIST VIEW
// Everything still needed for levels you have not built yet.
// =============================================================
import { shoppingList, overall } from '../calc.js';
import { esc, money } from '../icons.js';
import { STATIONS, ROOM_BY_ID } from '../data.js';

// Station names used in more than one room (Storage Equipment)
// get the room added, so the tags are never ambiguous
const SHARED = new Set(
  STATIONS.map((s) => s.name).filter((n, i, all) => all.indexOf(n) !== i)
);
const stationLabel = (u) => (SHARED.has(u.station) ? `${u.station} (${ROOM_BY_ID[u.roomId].short})` : u.station);

const ui = { query: '', hideDone: false };

export function renderShopping(el) {
  const o = overall();
  el.innerHTML = `
    <section class="view" data-room="shopping">
      <header class="room-banner">
        <div>
          <p class="room-banner__eyebrow">// Supply run</p>
          <h1 class="room-banner__title">Shopping List</h1>
          <p class="room-banner__desc">Every item in the hideout. Levels you built already used their items, so they come off the total. Set how many you have in storage with − and +. Each item is counted once, for all stations.</p>
        </div>
        <div class="room-banner__meta">
          <span class="chip">Left to find <b>${o.itemsNeed - o.itemsHave}</b></span>
          <span class="chip">Cash left <b>${money(o.cash)}</b></span>
        </div>
      </header>
      <div class="shop-tools">
        <input class="search" type="search" placeholder="Search items..." value="${esc(ui.query)}"
               data-action="shop-search" aria-label="Search items">
        <label class="toggle">
          <input type="checkbox" data-action="shop-hide" ${ui.hideDone ? 'checked' : ''}>
          Hide done
        </label>
      </div>
      <div data-shop-body>${body()}</div>
    </section>`;
}

export function refreshShoppingBody(root) {
  const b = root.querySelector('[data-shop-body]');
  if (b) b.innerHTML = body();
}

export function setShopQuery(q) {
  ui.query = q;
}

export function setShopHide(v) {
  ui.hideDone = v;
}

// One tag per station, with each level that needs the item inside,
// e.g. "Heat Source · L1 ×3 · L2 ×4", so long rows stay readable.
// Levels already built stay in the tag, in green with a check.
export function usedTags(uses) {
  const byStation = new Map();
  for (const u of uses) {
    if (!byStation.has(u.stationId)) byStation.set(u.stationId, { ...u, levels: [] });
    byStation.get(u.stationId).levels.push(u);
  }
  return [...byStation.values()]
    .map((s) => {
      const parts = s.levels
        .map((l) => (l.built ? `<span class="shop__lvl is-built">✓ L${l.step} ×${l.qty}</span>` : `<span class="shop__lvl">L${l.step} ×${l.qty}</span>`))
        .join('');
      const name = stationLabel(s);
      const title = s.levels.map((l) => `level ${l.step}: ${l.qty}${l.built ? ' (built)' : ''}`).join(', ');
      return `<a class="shop__tag u-room-${s.roomId}" href="#${s.stationId}" title="${esc(name)} needs ${title}">
                <span class="shop__station">${esc(name)}</span>${parts}
              </a>`;
    })
    .join('');
}

function body() {
  const q = ui.query.trim().toLowerCase();
  const rows = shoppingList().filter(
    (r) => (!q || r.name.toLowerCase().includes(q)) && (!ui.hideDone || r.left > 0)
  );

  if (!rows.length) {
    return `<p class="empty">${q ? 'No items match your search.' : 'Nothing left to find. Every level is built or stocked.'}</p>`;
  }

  return `
    <table class="shop">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num" title="All levels together">Total</th>
          <th class="num" title="Already used by levels you built">Used</th>
          <th class="num" title="Total minus used: for levels not built yet">Still need</th>
          <th class="num" title="What you have in storage">Have</th>
          <th class="num" title="Still need minus what you have">Left</th>
          <th>Used by</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row).join('')}
      </tbody>
    </table>`;
}

// One item: the 5 numbers, a storage stepper, and the stations
function row(r, i) {
  const name = esc(r.name);
  return `
    <tr class="${r.left === 0 ? 'is-done' : ''}" style="--i:${i}">
      <td class="shop__name">${name}</td>
      <td class="num shop__total" data-label="Total">${r.total}</td>
      <td class="num shop__usedn" data-label="Used">${r.used}</td>
      <td class="num shop__need" data-label="Still need">${r.need}</td>
      <td class="num shop__have" data-label="Have">
        <div class="stepper stepper--sm">
          <button class="stepper__btn" type="button" data-action="store-dec" data-item="${name}"
                  ${r.storage ? '' : 'disabled'} aria-label="One less ${name} in storage">−</button>
          <input class="stepper__input shop__have-input" type="number" min="0" inputmode="numeric"
                 value="${r.storage}" data-item="${name}" aria-label="How many ${name} you have in storage">
          <button class="stepper__btn" type="button" data-action="store-inc" data-item="${name}"
                  aria-label="One more ${name} in storage">+</button>
        </div>
      </td>
      <td class="num shop__left" data-label="Left">${r.left === 0 ? '✓' : r.left}</td>
      <td class="shop__used-cell">
        <div class="shop__used">${usedTags(r.uses)}</div>
      </td>
    </tr>`;
}
