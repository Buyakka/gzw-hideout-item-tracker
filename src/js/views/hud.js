// =============================================================
// HUD + TABS
// Top stats and the room tab bar.
// =============================================================
import { ROOMS } from '../data.js';
import { overall, power } from '../calc.js';
import { store } from '../state.js';
import { icon, money } from '../icons.js';

export function renderStats(el) {
  const o = overall();
  const p = power();
  el.innerHTML = `
    <div class="stat" style="--p:${o.levelRatio}">
      <span class="stat__label">Levels built</span>
      <span class="stat__value">${o.built}<small> / ${o.total}</small></span>
      <span class="stat__bar"></span>
    </div>
    <div class="stat" style="--p:${o.itemRatio}">
      <span class="stat__label">Items found</span>
      <span class="stat__value">${o.itemsHave}<small> / ${o.itemsNeed}</small></span>
      <span class="stat__bar"></span>
    </div>
    <div class="stat" style="--p:${o.cash ? 0 : 1}">
      <span class="stat__label">Cash left</span>
      <span class="stat__value">${money(o.cash)}</span>
      <span class="stat__bar"></span>
    </div>
    <a class="stat stat--power ${p.available ? '' : 'is-off'}" href="#utility/generator" style="--p:${p.max ? p.available / p.max : 0}"
       title="Power from your built generator levels">
      <span class="stat__label">Power</span>
      <span class="stat__value">${p.available}<small> / ${p.max} kW</small></span>
      <span class="stat__bar"></span>
    </a>`;
}

export function renderTabs(el, active) {
  const tabs = ROOMS.map((r) => {
    const built = r.stations.reduce((n, s) => n + Math.min(store.builtCount(s.id), s.levels.length), 0);
    const total = r.stations.reduce((n, s) => n + s.levels.length, 0);
    return { id: r.id, label: r.short, icon: r.icon, count: `${built}/${total}` };
  });
  tabs.push({ id: 'shopping', label: 'Shopping List', icon: 'list', count: '' });
  tabs.push({ id: 'disassembly', label: 'Disassembly', icon: 'split', count: '' });

  el.innerHTML = tabs
    .map(
      (t) => `
      <a class="room-tab u-room-${t.id}" href="#${t.id}" role="tab"
         aria-selected="${t.id === active}" data-room="${t.id}">
        ${icon(t.icon)}
        <span>${t.label}</span>
        ${t.count ? `<span class="room-tab__count">${t.count}</span>` : ''}
      </a>`
    )
    .join('');
}
