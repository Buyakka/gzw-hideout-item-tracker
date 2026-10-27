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
    <a class="stat stat--power ${p.free > 0 ? '' : 'is-off'}" href="#utility/generator" style="--p:${p.total ? p.used / p.total : 0}"
       title="Available power: ${p.free} kW. Generator gives ${p.total} kW, built stations use ${p.used} kW.">
      <span class="stat__label">Free power</span>
      <span class="stat__value">${p.free} kW<small> / ${p.total}</small></span>
      <span class="stat__bar"></span>
    </a>`;
}

export function renderTabs(el, active) {
  const tabs = ROOMS.map((r) => {
    const built = r.stations.reduce((n, s) => n + Math.min(store.builtCount(s.id), s.levels.length), 0);
    const total = r.stations.reduce((n, s) => n + s.levels.length, 0);
    return { id: r.id, label: r.tab, count: `${built}/${total}` };
  });
  const tools = [
    { id: 'shopping', label: 'Shopping List', icon: 'list' },
    { id: 'disassembly', label: 'Disassembly', icon: 'split' },
  ];

  const tab = (t) => `
      <a class="room-tab u-room-${t.id}" href="#${t.id}" role="tab"
         aria-selected="${t.id === active}" data-room="${t.id}">
        ${t.icon ? icon(t.icon) : ''}
        <span>${t.label}</span>
        ${t.count ? `<span class="room-tab__count">${t.count}</span>` : ''}
      </a>`;

  // Room tabs match the game, including the locked Personal room
  el.innerHTML = `
    ${tabs.map(tab).join('')}
    <span class="room-tab is-locked" role="tab" aria-disabled="true" title="Locked in the game for now">
      ${icon('lock')}<span>Personal</span>
    </span>
    <span class="room-tabs__sep" aria-hidden="true"></span>
    ${tools.map(tab).join('')}`;
}
