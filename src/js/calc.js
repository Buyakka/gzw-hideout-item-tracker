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

// ---------- Requirements ----------
// A level's "requires" text mixes 3 kinds of needs:
//   "Heat Source Lv 1"  previous level (the site already unlocks levels in order)
//   "Heat Control 2"    a capability: the sum of what built levels in the same room give
//   "2 kW"              free power
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
    const entry = { station: s, index: b, level: s.levels[b], left: p.need - p.have, need: p.need, ratio: p.ratio };
    (p.allDone ? ready : startable).push(entry);
  }
  startable.sort((a, b) => a.left - b.left || b.ratio - a.ratio);
  return { ready, startable };
}
