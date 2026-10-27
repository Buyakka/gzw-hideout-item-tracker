// =============================================================
// CALC
// Turns saved progress into numbers the views can show.
// =============================================================
import { STATIONS, TOTAL_LEVELS } from './data.js';
import { store, itemKey } from './state.js';

// Items for one level, with need / have / done for each
export function levelItems(station, levelIndex) {
  const level = station.levels[levelIndex];
  return level.items.map((it) => {
    const key = itemKey(station.id, levelIndex, it.item);
    const need = store.need(key, it.qty);
    const have = store.have(key);
    return {
      key,
      name: it.item,
      base: it.qty,
      need,
      have,
      edited: store.isEdited(key),
      done: have >= need,
    };
  });
}

export function levelProgress(station, levelIndex) {
  const items = levelItems(station, levelIndex);
  const need = items.reduce((n, i) => n + i.need, 0);
  const have = items.reduce((n, i) => n + Math.min(i.have, i.need), 0);
  return {
    items,
    need,
    have,
    ratio: need ? have / need : 1,
    allDone: items.every((i) => i.done),
  };
}

// 'built' | 'ready' | 'progress' | 'locked'
export function levelState(station, levelIndex) {
  const built = store.builtCount(station.id);
  if (levelIndex < built) return 'built';
  if (levelIndex > built) return 'locked';
  return levelProgress(station, levelIndex).allDone ? 'ready' : 'progress';
}

export function stationSummary(station) {
  const built = store.builtCount(station.id);
  const total = station.levels.length;
  const next = built < total ? station.levels[built] : null;
  const prog = next ? levelProgress(station, built) : null;
  return {
    built,
    total,
    maxed: built >= total,
    next,
    ratio: prog ? prog.ratio : 1,
    ready: prog ? prog.allDone : false,
    have: prog?.have ?? 0,
    need: prog?.need ?? 0,
  };
}

export function overall(stations = STATIONS) {
  let built = 0;
  let total = 0;
  let cash = 0;
  let itemsNeed = 0;
  let itemsHave = 0;

  for (const s of stations) {
    const b = store.builtCount(s.id);
    built += Math.min(b, s.levels.length);
    total += s.levels.length;
    s.levels.forEach((lvl, i) => {
      if (i < b) return;
      cash += lvl.cash || 0;
      for (const it of levelItems(s, i)) {
        itemsNeed += it.need;
        itemsHave += Math.min(it.have, it.need);
      }
    });
  }

  return {
    built,
    total,
    cash,
    itemsNeed,
    itemsHave,
    levelRatio: total ? built / total : 0,
    itemRatio: itemsNeed ? itemsHave / itemsNeed : 1,
  };
}

export const ALL_LEVELS = TOTAL_LEVELS;

// Power works like the game: built generator levels give kW, and
// every built level that needs kW uses it up for good. Checked
// against the game: generator at max (18 kW) with 8 kW of built
// levels shows "Available Power 10 kW".
//   total = kW from built generator levels
//   used  = kW of all built levels that need power
//   free  = total - used (what is shown as available)
//   max   = kW with the generator fully built
export function power() {
  let total = 0;
  let used = 0;
  let max = 0;
  for (const s of STATIONS) {
    const b = store.builtCount(s.id);
    s.levels.forEach((lvl, i) => {
      if (lvl.powerKw) max += lvl.powerKw;
      if (i >= b) return;
      total += lvl.powerKw || 0;
      used += lvl.kw || 0;
    });
  }
  return { total, used, free: total - used, max };
}

// Is there enough free power to build this level?
export const hasPower = (level, free = power().free) => !level.kw || free >= level.kw;

// Every material still needed across all levels not yet built
export function shoppingList() {
  const map = new Map();
  for (const s of STATIONS) {
    const b = store.builtCount(s.id);
    s.levels.forEach((lvl, i) => {
      if (i < b) return;
      for (const it of levelItems(s, i)) {
        if (!map.has(it.name)) map.set(it.name, { name: it.name, need: 0, have: 0, uses: [] });
        const row = map.get(it.name);
        row.need += it.need;
        row.have += Math.min(it.have, it.need);
        row.uses.push({
          stationId: s.id,
          roomId: s.roomId,
          station: s.name,
          step: lvl.step,
          label: `${s.name} L${lvl.step}`,
          qty: it.need,
        });
      }
    });
  }
  return [...map.values()]
    .map((r) => ({ ...r, left: Math.max(0, r.need - r.have) }))
    .sort((a, b) => b.left - a.left || a.name.localeCompare(b.name));
}
