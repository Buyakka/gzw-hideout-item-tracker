// =============================================================
// STATE
// Everything the player changes is saved in the browser
// (localStorage). It loads again next time, and it syncs live
// between tabs, so the site can stay open on a second monitor.
//
// Shape:
//   built: { 'laboratory/heat-source': 2 }       levels built
//   have:  { 'laboratory/heat-source|1|Steel': 3 } items found
//   need:  { 'laboratory/heat-source|1|Steel': 5 } user fixes to the recipe
// =============================================================

const KEY = 'buyaka-gzw-hideout:v1';
const listeners = new Set();

const empty = () => ({ built: {}, have: {}, need: {}, savedAt: null });

let state = load();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && typeof parsed === 'object') return { ...empty(), ...parsed };
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

export const itemKey = (stationId, levelIndex, item) => `${stationId}|${levelIndex}|${item}`;

export const store = {
  get: () => state,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  builtCount: (stationId) => state.built[stationId] ?? 0,

  have: (key) => state.have[key] ?? 0,

  // The recipe amount, or the player's fix if they edited it
  need: (key, base) => state.need[key] ?? base,

  isEdited: (key) => key in state.need,

  setHave(key, value) {
    const n = Math.max(0, Math.min(9999, Math.floor(Number(value) || 0)));
    if (n === 0) delete state.have[key];
    else state.have[key] = n;
    persist();
    emit('have');
  },

  // Set many items at once (one save, one redraw)
  setHaveMany(entries) {
    for (const [key, value] of entries) {
      const n = Math.max(0, Math.floor(Number(value) || 0));
      if (n === 0) delete state.have[key];
      else state.have[key] = n;
    }
    persist();
    emit('have');
  },

  setNeed(key, value, base) {
    const n = Math.max(0, Math.min(9999, Math.floor(Number(value) || 0)));
    if (n === base) delete state.need[key];
    else state.need[key] = n;
    persist();
    emit('need');
  },

  setBuilt(stationId, count) {
    if (count <= 0) delete state.built[stationId];
    else state.built[stationId] = count;
    persist();
    emit('built');
  },

  reset() {
    state = empty();
    persist();
    emit('reset');
  },

  export() {
    return JSON.stringify({ app: 'buyaka-gzw-hideout', v: 1, ...state }, null, 2);
  },

  import(text) {
    const data = JSON.parse(text);
    if (data?.app !== 'buyaka-gzw-hideout') throw new Error('Not a hideout backup file');
    state = {
      built: data.built ?? {},
      have: data.have ?? {},
      need: data.need ?? {},
      savedAt: data.savedAt ?? null,
    };
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
