// =============================================================
// SHOPPING LIST VIEW
// Everything still needed for levels you have not built yet.
// =============================================================
import { shoppingList, overall, buildNow, levelItems } from '../calc.js';
import { esc, money, icon } from '../icons.js';
import { STATIONS, ROOM_BY_ID } from '../data.js';
import { GROUPS, groupOf } from '../item-groups.js';

// Station names used in more than one room (Storage Equipment)
// get the room added, so the tags are never ambiguous
const SHARED = new Set(
  STATIONS.map((s) => s.name).filter((n, i, all) => all.indexOf(n) !== i)
);
const stationLabel = (u) => (SHARED.has(u.station) ? `${u.station} (${ROOM_BY_ID[u.roomId].short})` : u.station);

// mode: 'all', 'next' (Next upgrades) or 'sell' (Safe to sell)
const ui = { query: '', hideDone: false, group: 'all', mode: 'all' };

// Items for the levels you can work on right now (the same levels as
// the Next Upgrades page): how many those levels need of each item,
// and which levels they are, so their tags can be marked.
export function nextNeeds() {
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
      </div>
      <div class="latches" role="group" aria-label="Show">
        <span class="latches__label" aria-hidden="true">Show</span>
        ${latchButtons()}
      </div>
      <div class="shop-groups" role="group" aria-label="Show item group">${groupButtons()}</div>
      <div data-shop-body>${body()}</div>
    </section>`;
}

// Redraw the list, and the counts on the push buttons, since the
// search box and the item types change what each button would show
export function refreshShoppingBody(root) {
  const b = root.querySelector('[data-shop-body]');
  if (b) b.innerHTML = body();
  for (const [k, n] of Object.entries(latchCounts())) {
    const el = root.querySelector(`.latch[data-k="${k}"] .latch__n`);
    if (el) el.textContent = n;
  }
}

// The rows the list shows for a mode ('all', 'next' or 'sell'), with
// the search box, the item type and Hide done applied. The push
// button counts use this too, so a count always matches its list.
// Hide done is skipped for Safe to sell: every extra is "done".
function visibleRows(mode, rows = shoppingList(), next = mode === 'next' ? nextNeeds() : null) {
  const q = ui.query.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (mode === 'sell' || !ui.hideDone || r.left > 0) &&
      (ui.group === 'all' || groupOf(r.name) === ui.group) &&
      (mode !== 'next' || next.need.has(r.name)) &&
      (mode !== 'sell' || r.extra > 0)
  );
}

function latchCounts() {
  const rows = shoppingList();
  return { next: visibleRows('next', rows).length, sell: visibleRows('sell', rows).length };
}

export function setShopQuery(q) {
  ui.query = q;
}

// The three push buttons. Next upgrades and Safe to sell pop each
// other out (one means "I need it", the other "I don't"). Hide done
// works with either one.
function latchButtons() {
  const counts = latchCounts();
  const btn = (k, pressed, label, n, title) => `
    <button class="latch latch--${k}" type="button" data-action="shop-latch" data-k="${k}"
            aria-pressed="${pressed}" title="${title}">
      <span class="latch__lamp" aria-hidden="true"></span>${label}${n === null ? '' : `<span class="latch__n">${n}</span>`}
    </button>`;
  return [
    btn('next', ui.mode === 'next', 'Next upgrades', counts.next, 'Only items for levels you can build or start now'),
    btn('sell', ui.mode === 'sell', 'Safe to sell', counts.sell, 'Items you have more of than the whole hideout still needs'),
    btn('hide', ui.hideDone, 'Hide done', null, 'Hide items you already have enough of'),
  ].join('');
}

// Push or pop one button, then redraw the list
export function toggleShopLatch(root, k) {
  if (k === 'hide') ui.hideDone = !ui.hideDone;
  else ui.mode = ui.mode === k ? 'all' : k;
  root.querySelectorAll('.latch').forEach((b) => {
    const on = b.dataset.k === 'hide' ? ui.hideDone : ui.mode === b.dataset.k;
    b.setAttribute('aria-pressed', on);
  });
  refreshShoppingBody(root);
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
  const next = ui.mode === 'next' ? nextNeeds() : null;
  const sell = ui.mode === 'sell';
  const rows = visibleRows(ui.mode, shoppingList(), next);

  if (!rows.length) {
    const msg = q
      ? 'No items match your search.'
      : sell
        ? 'Nothing extra yet. Everything you have is still needed for the hideout.'
        : next
        ? 'None of the levels you can work on now need items from here.'
        : ui.group !== 'all'
          ? 'Nothing left to find in this group.'
          : 'Nothing left to find. Every level is built or stocked.';
    return `<p class="empty">${msg}</p>`;
  }

  return `
    <table class="shop${sell ? ' shop--sell' : ''}">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num" title="All levels together">Total</th>
          <th class="num" title="Already used by levels you built">Used</th>
          <th class="num" title="How many the levels you have not built yet need in total">Needed</th>
          <th class="num" title="What you have in storage">Have</th>
          ${sell
            ? `<th class="num" title="The extra you can sell">Sell</th>
               <th title="What to keep, and which level not built yet needs it">Keep for</th>
               <th><span class="sr-only">Mark as sold</span></th>`
            : `<th class="num" title="How many you are still missing and have to go find">To find</th>
               <th>Used by</th>`}
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => row(r, i, next, sell)).join('')}
      </tbody>
    </table>`;
}

// One item: the 5 numbers, a storage stepper, and the stations.
// With Next upgrades pushed, the name also says how many the levels
// you can work on now need ("Next: 4"). With Safe to sell pushed it
// shows a short row instead (see sellRow).
function row(r, i, next, sell) {
  if (sell) return sellRow(r, i);
  const name = esc(r.name);
  const n = next?.need.get(r.name);
  const nextLine = next
    ? `<span class="shop__next" title="The levels you can work on now need ${n}">Next: ${n}</span>`
    : '';
  return `
    <tr class="${r.left === 0 ? 'is-done' : ''}" style="--i:${i}">
      <td class="shop__name">${name}${nextLine}</td>
      <td class="num shop__total" data-label="Total">${r.total}</td>
      <td class="num shop__usedn" data-label="Used">${r.used}</td>
      <td class="num shop__need" data-label="Needed">${r.need}</td>
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
      <td class="num shop__left" data-label="To find">${r.left === 0 ? '✓' : r.left}</td>
      <td class="shop__used-cell">
        <div class="shop__used">${usedTags(r.uses, next?.levels)}</div>
      </td>
    </tr>`;
}

// What to keep and why: one line per level not built yet, e.g.
// "1 for Glassware L1". Built levels are left out (their items are
// already used up). Says when the items are already set aside.
function keepList(r) {
  const open = r.uses.filter((u) => !u.built);
  if (!open.length) return '<p class="shop__keep-none"><span class="shop__keep-head">Keep <b class="shop__keep-n">none</b></span> Every level that uses it is built.</p>';
  const lines = open
    .map((u) => {
      const ready =
        u.have >= u.qty
          ? `<span class="shop__keep-set">${icon('check')}set aside</span>`
          : u.have > 0
            ? `<span class="shop__keep-set is-part">${u.have} of ${u.qty} set aside</span>`
            : '';
      return `<li><a class="shop__keep-line u-room-${u.roomId}" href="#${u.stationId}" title="Open ${esc(stationLabel(u))}">
                <b>${u.qty}</b> for <span class="shop__keep-st">${esc(stationLabel(u))} L${u.step}</span></a>${ready}</li>`;
    })
    .join('');
  return `<p class="shop__keep-head">Keep <b class="shop__keep-n">${r.need}</b></p><ul class="shop__keep-list">${lines}</ul>`;
}

// Safe to sell: only the numbers that matter for selling, read only.
// Total, used, needed, what you have, how many you can sell,
// what to keep and for which level, then "Mark as sold".
function sellRow(r, i) {
  const name = esc(r.name);
  return `
    <tr class="shop__sellrow" style="--i:${i}">
      <td class="shop__name">${name}</td>
      <td class="num shop__total" data-label="Total">${r.total}</td>
      <td class="num shop__usedn" data-label="Used">${r.used}</td>
      <td class="num shop__need" data-label="Needed">${r.need}</td>
      <td class="num shop__havn" data-label="Have">${r.storage}</td>
      <td class="num shop__extra" data-label="Sell">${r.extra}</td>
      <td class="shop__keep">${keepList(r)}</td>
      <td class="shop__act">
        <button class="shop__sold" type="button" data-action="store-sold" data-item="${name}"
                title="I sold the extra: keep only what the hideout still needs (${r.need})">${icon('check')}<span>Mark as sold</span></button>
      </td>
    </tr>`;
}
