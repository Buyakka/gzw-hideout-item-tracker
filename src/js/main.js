// =============================================================
// MAIN
// Wires the pages, the panel, saving and the effects together.
// Address bar decides what is shown:
//   #laboratory                 room view
//   #laboratory/heat-source     room view + station panel
//   #shopping                   shopping list
// =============================================================
import '../styles/main.scss';

import { ROOM_BY_ID, STATION_BY_ID } from './data.js';
import { levelItems } from './calc.js';
import { store } from './state.js';
import { renderStats, renderTabs } from './views/hud.js';
import { renderRoom } from './views/room.js';
import { renderShopping, refreshShoppingBody, setShopQuery, setShopHide } from './views/shopping.js';
import {
  initPanel, openPanel, closePanel, showLevel, toggleEdit,
  refreshPanel, isOpen, currentStation, panelLevel,
} from './views/panel.js';
import { initTilt, initParallax, toast } from './fx.js';

const $ = (s) => document.querySelector(s);
const els = {
  hud: $('.hud'),
  stats: $('[data-stats]'),
  tabs: $('.room-tabs'),
  main: $('#view'),
  bg: $('.bg-fx'),
  panel: $('#panel'),
  scrim: $('.scrim'),
  file: $('#import-file'),
};

let room = 'utility';

// ---------- Routing ----------
function parseHash() {
  const [r, s] = location.hash.replace(/^#/, '').split('/');
  const roomId = ROOM_BY_ID[r] || r === 'shopping' ? r : 'utility';
  const stationId = s ? `${roomId}/${s}` : null;
  return { roomId, stationId: STATION_BY_ID[stationId] ? stationId : null };
}

function route() {
  const { roomId, stationId } = parseHash();
  const roomChanged = roomId !== room;
  room = roomId;
  renderAll(!roomChanged && els.main.childElementCount > 0);
  if (stationId) {
    if (currentStation() !== stationId) openPanel(stationId);
  } else {
    closePanel();
  }
}

// ---------- Drawing ----------
function renderAll(isStatic = false) {
  document.body.dataset.room = room;
  els.bg.dataset.room = room;
  renderStats(els.stats);
  renderTabs(els.tabs, room);
  // On phones the tab bar scrolls, so bring the active tab into view
  els.tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  // Keep the search box focus on the shopping list
  const search = document.activeElement?.matches?.('.search') ? document.activeElement : null;
  const caret = search?.selectionStart;

  if (room === 'shopping') renderShopping(els.main);
  else renderRoom(els.main, room);

  const view = els.main.firstElementChild;
  if (isStatic) view?.classList.add('is-static');

  if (search) {
    const s = els.main.querySelector('.search');
    s?.focus({ preventScroll: true });
    s?.setSelectionRange(caret, caret);
  }
}

store.subscribe((_, reason) => {
  renderAll(true);
  refreshPanel();
  if (reason === 'sync') toast('Synced from another tab');
});

// ---------- Actions ----------
const actions = {
  open(el) {
    location.hash = el.dataset.station;
  },
  close() {
    closeAndClearHash();
  },
  level(el) {
    showLevel(Number(el.dataset.index));
  },
  inc(el) {
    store.setHave(el.dataset.key, store.have(el.dataset.key) + 1);
  },
  dec(el) {
    store.setHave(el.dataset.key, store.have(el.dataset.key) - 1);
  },
  'edit-need'(el) {
    toggleEdit(el.dataset.key);
  },
  'fill-level'() {
    const s = STATION_BY_ID[currentStation()];
    store.setHaveMany(levelItems(s, panelLevel()).map((i) => [i.key, i.need]));
    toast('Marked every item as found');
  },
  'clear-level'() {
    const s = STATION_BY_ID[currentStation()];
    store.setHaveMany(levelItems(s, panelLevel()).map((i) => [i.key, 0]));
    toast('Cleared this level', 'warn');
  },
  build() {
    const s = STATION_BY_ID[currentStation()];
    const built = store.builtCount(s.id);
    const lvl = s.levels[built];
    store.setBuilt(s.id, built + 1);
    toast(`${s.name} L${lvl.step} built: ${lvl.device}`);
    // Jump to the next level if there is one
    if (built + 1 < s.levels.length) showLevel(built + 1);
    els.panel.classList.add('just-built');
    setTimeout(() => els.panel.classList.remove('just-built'), 800);
  },
  unbuild() {
    const s = STATION_BY_ID[currentStation()];
    store.setBuilt(s.id, store.builtCount(s.id) - 1);
    toast(`${s.name} level undone`, 'warn');
  },
  export() {
    const blob = new Blob([store.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `buyaka-hideout-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup file saved');
  },
  import() {
    els.file.click();
  },
  reset() {
    if (confirm('Erase all your hideout progress? Save a backup first if you are not sure.')) {
      store.reset();
      toast('Progress erased', 'warn');
    }
  },
};

function closeAndClearHash() {
  closePanel();
  history.replaceState(null, '', `#${room}`);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT') return;
  const fn = actions[el.dataset.action];
  if (fn) {
    e.preventDefault();
    fn(el);
  }
});

// Typed numbers save when you press Enter or leave the box
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('.stepper__input')) store.setHave(t.dataset.key, t.value);
  if (t.matches('.item__need-input')) {
    store.setNeed(t.dataset.needKey, t.value, Number(t.dataset.base));
    toggleEdit(t.dataset.needKey);
  }
  if (t.matches('[data-action="shop-hide"]')) {
    setShopHide(t.checked);
    refreshShoppingBody(els.main);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.stepper__input, .item__need-input')) e.target.blur();
  if (e.key === 'Escape' && isOpen()) closeAndClearHash();
});

// Pick all text when clicking into a number, so typing replaces it
document.addEventListener('focusin', (e) => {
  if (e.target.matches('.stepper__input, .item__need-input')) e.target.select();
});

document.addEventListener('input', (e) => {
  if (e.target.matches('[data-action="shop-search"]')) {
    setShopQuery(e.target.value);
    refreshShoppingBody(els.main);
  }
});

els.scrim.addEventListener('click', closeAndClearHash);

els.file.addEventListener('change', async () => {
  const f = els.file.files[0];
  if (!f) return;
  try {
    store.import(await f.text());
    toast('Backup loaded');
  } catch (err) {
    toast(`Could not load that file: ${err.message}`, 'warn');
  }
  els.file.value = '';
});

// Keep the tab bar right under the header on every screen size
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-h', `${els.hud.offsetHeight}px`);
}).observe(els.hud);

// ---------- Start ----------
initPanel(els.panel, els.scrim);
initTilt(els.main);
initParallax(els.bg);
window.addEventListener('hashchange', route);
route();
