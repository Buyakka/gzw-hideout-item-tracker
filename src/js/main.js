// =============================================================
// MAIN
// Wires the pages, the panel, saving and the effects together.
// Address bar decides what is shown:
//   (empty) or #home            landing page
//   #laboratory                 room view
//   #laboratory/heat-source     room view + station panel
//   #build                      levels you can work on now
//   #shopping                   shopping list
//   #disassembly                disassembly recipes
// =============================================================
import '../styles/main.scss';

import { ROOM_BY_ID, STATION_BY_ID } from './data.js';
import { levelItems } from './calc.js';
import { store } from './state.js';
import { renderStats, renderTabs } from './views/hud.js';
import { renderRoom } from './views/room.js';
import { renderShopping, refreshShoppingBody, setShopQuery, setShopHide } from './views/shopping.js';
import { renderDisassembly, refreshDisassemblyBody, setDisQuery } from './views/disassembly.js';
import { renderHome, rememberRoom } from './views/home.js';
import { renderBuildNow } from './views/build-now.js';
import { initLookup, openLookup } from './lookup.js';
import { mountLogos } from './logo.js';
import { initScenes, showScene } from './scenes.js';
import {
  initPanel, openPanel, closePanel, showLevel, toggleEdit,
  refreshPanel, isOpen, currentStation, panelLevel,
} from './views/panel.js';
import { initTilt, initParallax, toast } from './fx.js';
import { initToTop, setToTopPage } from './to-top.js';
import { cycleTextSize, syncTextSizeButtons } from './text-size.js';

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

let room = 'home';
const itemName = (key) => key.slice(key.lastIndexOf('|') + 1);
const PAGES = ['home', 'build', 'shopping', 'disassembly'];

// ---------- Routing ----------
function parseHash() {
  const [r, s] = location.hash.replace(/^#/, '').split('/');
  const roomId = ROOM_BY_ID[r] || PAGES.includes(r) ? r : 'home';
  const stationId = s ? `${roomId}/${s}` : null;
  return { roomId, stationId: STATION_BY_ID[stationId] ? stationId : null };
}

function route() {
  const { roomId, stationId } = parseHash();
  const roomChanged = roomId !== room;
  room = roomId;
  if (room !== 'home') rememberRoom(room);
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
  document.body.classList.toggle('is-home', room === 'home');
  setToTopPage(room);
  els.bg.dataset.room = room;
  showScene(room);
  renderStats(els.stats);
  renderTabs(els.tabs, room);
  // On phones the tab bar scrolls, so bring the active tab into view
  els.tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  // Keep the search box focus on the shopping list
  const search = document.activeElement?.matches?.('.search') ? document.activeElement : null;
  const caret = search?.selectionStart;
  // Keep focus on a Shopping List stepper button after it redraws
  const active = document.activeElement;
  const stepFocus = active?.dataset?.item && active.dataset.action ? [active.dataset.action, active.dataset.item] : null;

  if (room === 'home') {
    renderHome(els.main);
    syncTextSizeButtons(els.main);
  }
  else if (room === 'shopping') renderShopping(els.main);
  else if (room === 'disassembly') renderDisassembly(els.main);
  else if (room === 'build') renderBuildNow(els.main);
  else renderRoom(els.main, room);

  const view = els.main.firstElementChild;
  if (isStatic) view?.classList.add('is-static');

  if (search) {
    const s = els.main.querySelector('.search');
    s?.focus({ preventScroll: true });
    s?.setSelectionRange(caret, caret);
  }
  if (stepFocus) {
    const [action, item] = stepFocus;
    els.main.querySelector(`[data-action="${action}"][data-item="${CSS.escape(item)}"]`)?.focus({ preventScroll: true });
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
  // + takes one from free storage; if none is free it means "I found
  // one more", so it is added to storage too
  inc(el) {
    const key = el.dataset.key;
    const added = store.setAssigned(key, store.assigned(key) + 1, { grow: true });
    if (added) toast(`Added ${added} ${itemName(key)} to storage`);
  },
  // − puts one back into free storage (it is not thrown away)
  dec(el) {
    store.setAssigned(el.dataset.key, store.assigned(el.dataset.key) - 1);
  },
  // Shopping List storage stepper
  'store-inc'(el) {
    store.setStorage(el.dataset.item, store.storage(el.dataset.item) + 1);
  },
  'store-dec'(el) {
    store.setStorage(el.dataset.item, store.storage(el.dataset.item) - 1);
  },
  'edit-storage'(el) {
    toggleEdit(`store:${el.dataset.item}`);
  },
  'edit-need'(el) {
    toggleEdit(el.dataset.key);
  },
  // Set aside everything this level needs, as far as free storage allows
  'fill-level'() {
    const s = STATION_BY_ID[currentStation()];
    store.assignMany(levelItems(s, panelLevel()).map((i) => [i.key, i.need]));
    const short = levelItems(s, panelLevel()).filter((i) => !i.done);
    if (short.length) {
      toast(`Set aside what you have. Still short: ${short.map((i) => `${i.name} ${i.need - i.have}`).join(', ')}`, 'warn');
    } else {
      toast('Everything for this level is set aside');
    }
  },
  // Put this level's items back into free storage
  'clear-level'() {
    const s = STATION_BY_ID[currentStation()];
    store.assignMany(levelItems(s, panelLevel()).map((i) => [i.key, 0]));
    toast('Items put back into storage', 'warn');
  },
  build() {
    const s = STATION_BY_ID[currentStation()];
    const built = store.builtCount(s.id);
    const lvl = s.levels[built];
    // Building uses up what was set aside for this level
    const took = store.build(s.id, built, levelItems(s, built));
    const used = Object.values(took).reduce((n, v) => n + v, 0);
    toast(`${s.name} L${lvl.step} built: ${lvl.device}${used ? ` · ${used} items used from storage` : ''}`);
    // Jump to the next level if there is one
    if (built + 1 < s.levels.length) showLevel(built + 1);
    els.panel.classList.add('just-built');
    setTimeout(() => els.panel.classList.remove('just-built'), 800);
  },
  unbuild() {
    const s = STATION_BY_ID[currentStation()];
    store.unbuild(s.id);
    toast(`${s.name} level undone · its items are back in storage`, 'warn');
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
  lookup() {
    openLookup();
  },
  'text-size'() {
    const size = cycleTextSize();
    toast(`Text size: ${size.name}`);
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
  if (t.matches('.stepper__input')) {
    const added = store.setAssigned(t.dataset.key, t.value, { grow: true });
    if (added) toast(`Added ${added} ${itemName(t.dataset.key)} to storage`);
  }
  if (t.matches('.item__store-input')) {
    store.setStorage(t.dataset.storeItem, t.value);
    toggleEdit(`store:${t.dataset.storeItem}`);
  }
  if (t.matches('.shop__have-input')) store.setStorage(t.dataset.item, t.value);
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
  if (e.key === 'Enter' && e.target.matches('.stepper__input, .item__need-input, .item__store-input, .shop__have-input')) e.target.blur();
  if (e.key === 'Escape' && isOpen()) closeAndClearHash();
});

// Pick all text when clicking into a number, so typing replaces it
document.addEventListener('focusin', (e) => {
  if (e.target.matches('.stepper__input, .item__need-input, .item__store-input, .shop__have-input')) e.target.select();
});

document.addEventListener('input', (e) => {
  if (e.target.matches('[data-action="shop-search"]')) {
    setShopQuery(e.target.value);
    refreshShoppingBody(els.main);
  }
  if (e.target.matches('[data-action="dis-search"]')) {
    setDisQuery(e.target.value);
    refreshDisassemblyBody(els.main);
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
mountLogos();
syncTextSizeButtons();
initScenes(els.bg);
initPanel(els.panel, els.scrim);
initTilt(els.main);
initParallax(els.bg);
initToTop($('.to-top'), $('.footer'));
initLookup();
window.addEventListener('hashchange', route);
route();
