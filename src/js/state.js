// =============================================================
// STATE
// Everything the player changes is saved in the browser
// (localStorage). It loads again next time, and it syncs live
// between tabs, so the site can stay open on a second monitor.
//
// Items work like the game's storage: one shared count per item,
// and the player sets some of it aside for a station level. The
// same Steel can never count for two stations at once.
//
// Shape (v: 2):
//   built:    { 'laboratory/heat-source': 2 }              levels built
//   storage:  { Steel: 7 }                                  items owned
//   assigned: { 'laboratory/heat-source|2|Steel': 3 }       set aside for a level
//   used:     { 'laboratory/heat-source|1': { Steel: 4 } }  what a build took
//   need:     { 'laboratory/heat-source|1|Steel': 5 }       user fixes to the recipe
// Rule: for every item, the assigned amounts add up to no more than storage.
// =============================================================
import { STATIONS } from './data.js';

const KEY = 'buyaka-gzw-hideout:v1';
const listeners = new Set();

const empty = () => ({ v: 2, built: {}, storage: {}, assigned: {}, used: {}, need: {}, savedAt: null });

const clampInt = (value, max = 9999) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));

export const itemKey = (stationId, levelIndex, item) => `${stationId}|${levelIndex}|${item}`;
const itemOf = (key) => key.slice(key.lastIndexOf('|') + 1);
const needFor = (s, key, base) => s.need[key] ?? base;

// Old saves (v1) counted items per level, so the same Steel could be
// typed into several stations. Convert: storage = the highest count
// typed for an item, then set it aside level by level, in station
// order, without going over storage.
function migrate(old) {
  const s = { ...empty(), built: old.built ?? {}, need: old.need ?? {}, savedAt: old.savedAt ?? null };
  const have = old.have ?? {};
  for (const [key, n] of Object.entries(have)) {
    const item = itemOf(key);
    s.storage[item] = Math.max(s.storage[item] ?? 0, clampInt(n));
  }
  const left = { ...s.storage };
  for (const st of STATIONS) {
    const b = s.built[st.id] ?? 0;
    st.levels.forEach((lvl, i) => {
      if (i < b) return;
      for (const it of lvl.items) {
        const key = itemKey(st.id, i, it.item);
        const want = Math.min(clampInt(have[key]), needFor(s, key, it.qty), left[it.item] ?? 0);
        if (want > 0) {
          s.assigned[key] = want;
          left[it.item] -= want;
        }
      }
    });
  }
  return s;
}

function normalize(data) {
  if (!data || typeof data !== 'object') return empty();
  if (data.v === 2) return { ...empty(), ...data };
  return migrate(data);
}

let state = load();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && typeof parsed === 'object') return normalize(parsed);
  } catch {
    /* storage blocked or broken data: start fresh */
  }
  return empty();
}

let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      state.savedAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode or full storage: keep working in memory */
    }
  }, 150);
}

function emit(reason) {
  listeners.forEach((fn) => fn(state, reason));
}

function totalAssigned(item) {
  let n = 0;
  for (const [key, v] of Object.entries(state.assigned)) if (itemOf(key) === item) n += v;
  return n;
}

function setAssignedRaw(key, n) {
  if (n > 0) state.assigned[key] = n;
  else delete state.assigned[key];
}

// Keep the rule: if storage drops, take back the newest set-asides first
function fitToStorage(item) {
  let over = totalAssigned(item) - (state.storage[item] ?? 0);
  if (over <= 0) return;
  const keys = Object.keys(state.assigned).filter((k) => itemOf(k) === item).reverse();
  for (const key of keys) {
    if (over <= 0) break;
    const take = Math.min(over, state.assigned[key]);
    setAssignedRaw(key, state.assigned[key] - take);
    over -= take;
  }
}

export const store = {
  get: () => state,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  builtCount: (stationId) => state.built[stationId] ?? 0,

  // ---- items ----
  storage: (item) => state.storage[item] ?? 0,
  assigned: (key) => state.assigned[key] ?? 0,
  free: (item) => Math.max(0, (state.storage[item] ?? 0) - totalAssigned(item)),

  // The recipe amount, or the player's fix if they edited it
  need: (key, base) => state.need[key] ?? base,
  isEdited: (key) => key in state.need,

  // Set how many of an item you own
  setStorage(item, value) {
    const n = clampInt(value);
    if (n > 0) state.storage[item] = n;
    else delete state.storage[item];
    fitToStorage(item);
    persist();
    emit('storage');
  },

  // Set how many are set aside for one level. Only free storage can be
  // used, unless grow is true: then extra means "I found more", and
  // storage goes up too. Returns how many were added to storage.
  setAssigned(key, value, { grow = false } = {}) {
    const item = itemOf(key);
    const cur = state.assigned[key] ?? 0;
    let n = clampInt(value);
    const free = store.free(item);
    let added = 0;
    if (n - cur > free) {
      if (grow) {
        added = n - cur - free;
        state.storage[item] = (state.storage[item] ?? 0) + added;
      } else {
        n = cur + free;
      }
    }
    setAssignedRaw(key, n);
    persist();
    emit('assigned');
    return added;
  },

  // Set aside many at once from free storage (one save, one redraw)
  assignMany(entries) {
    for (const [key, value] of entries) {
      const cur = state.assigned[key] ?? 0;
      setAssignedRaw(key, Math.min(clampInt(value), cur + store.free(itemOf(key))));
    }
    persist();
    emit('assigned');
  },

  setNeed(key, value, base) {
    const n = clampInt(value);
    if (n === base) delete state.need[key];
    else state.need[key] = n;
    // Never keep more set aside than the level needs
    if ((state.assigned[key] ?? 0) > n) setAssignedRaw(key, n);
    persist();
    emit('need');
  },

  // ---- building ----
  // Build the next level: what was set aside for it leaves storage
  // (like the game uses the items). Remembered so undo can return it.
  build(stationId, levelIndex, items) {
    const took = {};
    for (const it of items) {
      const n = Math.min(state.assigned[it.key] ?? 0, it.need);
      if (n > 0) {
        took[it.name] = n;
        state.storage[it.name] = Math.max(0, (state.storage[it.name] ?? 0) - n);
        if (!state.storage[it.name]) delete state.storage[it.name];
      }
      delete state.assigned[it.key];
      fitToStorage(it.name);
    }
    if (Object.keys(took).length) state.used[`${stationId}|${levelIndex}`] = took;
    state.built[stationId] = levelIndex + 1;
    persist();
    emit('built');
    return took;
  },

  // Undo the last build: its items go back to storage and stay set aside
  unbuild(stationId) {
    const b = state.built[stationId] ?? 0;
    if (b <= 0) return;
    const index = b - 1;
    const took = state.used[`${stationId}|${index}`] ?? {};
    for (const [item, n] of Object.entries(took)) {
      state.storage[item] = (state.storage[item] ?? 0) + n;
      state.assigned[itemKey(stationId, index, item)] = n;
    }
    delete state.used[`${stationId}|${index}`];
    if (index <= 0) delete state.built[stationId];
    else state.built[stationId] = index;
    persist();
    emit('built');
  },

  reset() {
    state = empty();
    persist();
    emit('reset');
  },

  export() {
    return JSON.stringify({ app: 'buyaka-gzw-hideout', ...state }, null, 2);
  },

  // Older backup files (v1) are converted the same way as old saves
  import(text) {
    const data = JSON.parse(text);
    if (data?.app !== 'buyaka-gzw-hideout') throw new Error('Not a hideout backup file');
    const { app, ...rest } = data;
    state = normalize(rest);
    persist();
    emit('import');
  },
};

// Another tab or window changed the save: load it and redraw
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  state = load();
  emit('sync');
});
