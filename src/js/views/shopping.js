// =============================================================
// SHOPPING LIST VIEW
// Everything still needed for levels you have not built yet.
// =============================================================
import { shoppingList, overall, buildNow, levelItems } from '../calc.js';
import { esc, money } from '../icons.js';
import { STATIONS, ROOM_BY_ID } from '../data.js';
import { GROUPS, groupOf } from '../item-groups.js';

// Station names used in more than one room (Storage Equipment)
// get the room added, so the tags are never ambiguous
const SHARED = new Set(
  STATIONS.map((s) => s.name).filter((n, i, all) => all.indexOf(n) !== i)
);
const stationLabel = (u) => (SHARED.has(u.station) ? `${u.station} (${ROOM_BY_ID[u.roomId].short})` : u.station);

const ui = { query: '', hideDone: false, group: 'all', next: false };

// Items for the levels you can work on right now (the same levels as
// the Next Upgrades page): how many those levels need of each item,
// and which levels they are, so their tags can be marked.
function nextNeeds() {
  const { ready, startable } = buildNow();
  const need = new Map();
  const levels = new Set();
  for (const e of [...ready, ...startable]) {
    levels.add(`${e.station.id}|${e.level.step}`);
    for (const it of levelItems(e.station, e.index)) need.set(it.name, (need.get(it.name) || 0) + it.need);
  }
  return { need, levels };
}

// Filter buttons: All, then each group with how many items it has.
// "Other" only shows up if a game update adds an item we have not
// sorted yet.
function groupButtons() {
  const names = shoppingList().map((r) => r.name);
  const count = (id) => names.filter((n) => groupOf(n) === id).length;
  const list = [{ id: 'all', label: 'All', n: names.length }, ...GROUPS.map((g) => ({ ...g, n: count(g.id) }))];
  if (count('other')) list.push({ id: 'other', label: 'Other', n: count('other') });
  return list
    .map(
      (g) => `<button class="shop-group" type="button" data-action="shop-group" data-group="${g.id}"
                aria-pressed="${ui.group === g.id}">${esc(g.label)}<span class="shop-group__n">${g.n}</span></button>`
    )
    .join('');
}

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
        <label class="toggle toggle--next" title="Only items for levels you can build or start now">
          <input type="checkbox" data-action="shop-next" ${ui.next ? 'checked' : ''}>
          Next upgrades only <span class="toggle__n">${nextNeeds().need.size}</span>
        </label>
      </div>
      <div class="shop-groups" role="group" aria-label="Show item group">${groupButtons()}</div>
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

export function setShopNext(v) {
  ui.next = v;
}

// Pick a group and mark its button as pressed
export function setShopGroup(root, id) {
  ui.group = id;
  root.querySelectorAll('.shop-group').forEach((b) => b.setAttribute('aria-pressed', b.dataset.group === id));
  refreshShoppingBody(root);
}

// One tag per station, with each level that needs the item inside,
// e.g. "Heat Source · L1 ×3 · L2 ×4", so long rows stay readable.
// Levels already built stay in the tag, in green with a check.
export function usedTags(uses, nextLevels = null) {
  const byStation = new Map();
  for (const u of uses) {
    if (!byStation.has(u.stationId)) byStation.set(u.stationId, { ...u, levels: [] });
    byStation.get(u.stationId).levels.push(u);
  }
  return [...byStation.values()]
    .map((s) => {
      const parts = s.levels
        .map((l) =>
          l.built
            ? `<span class="shop__lvl is-built">✓ L${l.step} ×${l.qty}</span>`
            : nextLevels?.has(`${l.stationId}|${l.step}`)
              ? `<span class="shop__lvl is-next" title="You can work on this level now">L${l.step} ×${l.qty}</span>`
              : `<span class="shop__lvl">L${l.step} ×${l.qty}</span>`
        )
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
  const next = ui.next ? nextNeeds() : null;
  const rows = shoppingList().filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (!ui.hideDone || r.left > 0) &&
      (ui.group === 'all' || groupOf(r.name) === ui.group) &&
      (!next || next.need.has(r.name))
  );

  if (!rows.length) {
    const msg = q
      ? 'No items match your search.'
      : next
        ? 'None of the levels you can work on now need items from here.'
        : ui.group !== 'all'
          ? 'Nothing left to find in this group.'
          : 'Nothing left to find. Every level is built or stocked.';
    return `<p class="empty">${msg}</p>`;
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
        ${rows.map((r, i) => row(r, i, next)).join('')}
      </tbody>
    </table>`;
}

// One item: the 5 numbers, a storage stepper, and the stations.
// With "Next upgrades only" on, the name also says how many the
// levels you can work on now need ("Next: 4").
function row(r, i, next) {
  const name = esc(r.name);
  const n = next?.need.get(r.name);
  const nextLine = next ? `<span class="shop__next" title="The levels you can work on now need ${n}">Next: ${n}</span>` : '';
  return `
    <tr class="${r.left === 0 ? 'is-done' : ''}" style="--i:${i}">
      <td class="shop__name">${name}${nextLine}</td>
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
        <div class="shop__used">${usedTags(r.uses, next?.levels)}</div>
      </td>
    </tr>`;
}
