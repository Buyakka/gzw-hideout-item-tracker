// =============================================================
// CALC
// Turns saved progress into numbers the views can show.
// =============================================================
import { STATIONS, TOTAL_LEVELS } from './data.js';
import { store, itemKey } from './state.js';

// Items for one level, with need / have / done for each.
// "have" is what is set aside for this level from the shared storage.
export function levelItems(station, levelIndex) {
  const level = station.levels[levelIndex];
  return level.items.map((it) => {
    const key = itemKey(station.id, levelIndex, it.item);
    const need = store.need(key, it.qty);
    const have = Math.min(store.assigned(key), need);
    return {
      key,
      name: it.item,
      base: it.qty,
      need,
      have,
      storage: store.storage(it.item),
      free: store.free(it.item),
      edited: store.isEdited(key),
      done: have >= need,
    };
  });
}

// Other levels not built yet that also need this item, with what is
// set aside for each (so the player sees the competition)
export function otherNeeds(item, exceptKey) {
  const out = [];
  for (const s of STATIONS) {
    const b = store.builtCount(s.id);
    s.levels.forEach((lvl, i) => {
      if (i < b) return;
      const it = lvl.items.find((x) => x.item === item);
      if (!it) return;
      const key = itemKey(s.id, i, item);
      if (key === exceptKey) return;
      out.push({ station: s, step: lvl.step, need: store.need(key, it.qty), have: store.assigned(key) });
    });
  }
  return out;
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
  const needByItem = {};

  for (const s of stations) {
    const b = store.builtCount(s.id);
    built += Math.min(b, s.levels.length);
    total += s.levels.length;
    s.levels.forEach((lvl, i) => {
      if (i < b) return;
      cash += lvl.cash || 0;
      for (const it of levelItems(s, i)) {
        itemsNeed += it.need;
        itemsHave += it.have;
        needByItem[it.name] = (needByItem[it.name] || 0) + it.need;
      }
    });
  }

  // Whole hideout: count what is in storage (each item once), so items
  // not set aside yet still count. A single room counts what is set
  // aside for its own levels.
  if (stations === STATIONS) {
    itemsHave = Object.entries(needByItem).reduce((n, [item, need]) => n + Math.min(store.storage(item), need), 0);
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

// Is there enough available power to build this level?
export const hasPower = (level, free = power().free) => !level.kw || free >= level.kw;

// Every material in the hideout, against the shared storage:
//   total  all levels together
//   used   what built levels already took (those items are gone)
//   need   still needed = total - used (levels not built yet)
//   have   what is in storage, counted up to "need"
//   left   still to find = need - storage
//   extra  more than the whole hideout still needs = storage - need,
//          safe to sell (only once every level that uses it is covered)
// "uses" lists every level that needs the item, built ones too
// (marked built), so the player always sees what it is for.
export function shoppingList() {
  const map = new Map();
  const row = (name) => {
    if (!map.has(name)) map.set(name, { name, total: 0, used: 0, need: 0, assigned: 0, uses: [] });
    return map.get(name);
  };
  for (const s of STATIONS) {
    const b = store.builtCount(s.id);
    s.levels.forEach((lvl, i) => {
      for (const it of levelItems(s, i)) {
        const r = row(it.name);
        const built = i < b;
        r.total += it.need;
        if (built) {
          r.used += it.need;
        } else {
          r.need += it.need;
          r.assigned += it.have;
        }
        r.uses.push({
          built,
          stationId: s.id,
          have: it.have,
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
    .map((r) => {
      const storage = store.storage(r.name);
      return {
        ...r,
        storage,
        have: Math.min(storage, r.need),
        left: Math.max(0, r.need - storage),
        extra: Math.max(0, storage - r.need),
      };
    })
    // A to Z, so items are quick to find. The order never changes
    // when the player sets storage, so rows do not jump away from
    // the − / + they are clicking.
    .sort((x, y) => x.name.localeCompare(y.name));
}

// ---------- Requirements ----------
// A level's "requires" text mixes 3 kinds of needs:
//   "Heat Source Lv 1"  previous level (the site already unlocks levels in order)
//   "Heat Control 2"    a capability: the sum of what built levels in the same room give
//   "2 kW"              available power
// Notes in brackets, like "(no Lv 2 exists)", are not requirements.

const CAP_RE = /^\+(\d+)\s+(.+)$/; // "+2 Extraction & Reaction"

// Capability totals for a room from its built levels, e.g. { 'Heat Control': 2 }
export function capabilities(roomId) {
  const caps = {};
  for (const s of STATIONS) {
    if (s.roomId !== roomId) continue;
    const b = store.builtCount(s.id);
    s.levels.forEach((lvl, i) => {
      if (i >= b) return;
      const m = CAP_RE.exec(lvl.provides);
      if (m && !/kW/.test(m[2])) caps[m[2]] = (caps[m[2]] || 0) + Number(m[1]);
    });
  }
  return caps;
}

// Stations in a room that give a capability (for "build X" hints)
function providers(roomId, cap, exceptId) {
  return STATIONS.filter(
    (s) => s.roomId === roomId && s.id !== exceptId && s.levels.some((l) => CAP_RE.exec(l.provides)?.[2] === cap)
  ).map((s) => s.name);
}

// Requirement text without notes in brackets, for showing on screen
export const requiresText = (level) => level.requires.replace(/\s*\([^)]*\)/g, '');

// What is still missing before this level can be built.
// Returns [] when it is ready, otherwise items like
//   { kind: 'cap', name: 'Heat Control', need: 1, have: 0, from: ['Heat Source'] }
//   { kind: 'power', need: 2, free: 0 }
export function missingFor(station, levelIndex, free = power().free) {
  const level = station.levels[levelIndex];
  const caps = capabilities(station.roomId);
  const missing = [];
  for (const raw of requiresText(level).split(',')) {
    const part = raw.trim();
    if (!part || part === 'None' || /\bLv\s*\d+$/.test(part)) continue;
    if (/^\d+\s*kW$/.test(part)) continue; // power is checked below from level.kw
    const m = /^(.+?)\s+(\d+)$/.exec(part);
    if (!m) continue;
    const [, name, n] = m;
    const have = caps[name] || 0;
    if (have < Number(n)) {
      missing.push({ kind: 'cap', name, need: Number(n), have, from: providers(station.roomId, name, station.id) });
    }
  }
  if (!hasPower(level, free)) missing.push({ kind: 'power', need: level.kw, free });
  return missing;
}

// Short words for a missing item: "Heat Control 1" / "1 kW"
export const missingLabel = (m) => (m.kind === 'power' ? `${m.need} kW` : `${m.name} ${m.need}`);

// What to build to fix it: "Heat Source" / "generator"
export const missingFix = (m) => (m.kind === 'power' ? 'the generator' : m.from.join(' or ') || 'more levels');

// ---------- Build now ----------
// The next level of every station whose requirements are met:
//   ready     all items found, can be built right away
//   startable requirements met, still collecting (fewest left first)
export function buildNow() {
  const free = power().free;
  const ready = [];
  const startable = [];
  for (const s of STATIONS) {
    const b = store.builtCount(s.id);
    if (b >= s.levels.length || missingFor(s, b, free).length) continue;
    const p = levelProgress(s, b);
    // Free storage would cover the rest: only setting aside is left to do
    const coverable = p.items.every((i) => i.have + i.free >= i.need);
    const entry = { station: s, index: b, level: s.levels[b], left: p.need - p.have, need: p.need, ratio: p.ratio, coverable };
    (p.allDone ? ready : startable).push(entry);
  }
  startable.sort((a, b) => a.left - b.left || b.ratio - a.ratio);
  return { ready, startable };
}
