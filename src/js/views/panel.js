// =============================================================
// STATION PANEL
// Opens when you click a station. Shows each level, every item,
// how many you have and how many you need.
// =============================================================
import { STATION_BY_ID, ROOM_BY_ID } from '../data.js';
import { levelProgress, levelState, power, hasPower, missingFor, missingLabel, missingFix, requiresText, otherNeeds } from '../calc.js';
import { store } from '../state.js';
import { icon, esc, money } from '../icons.js';

const panel = {
  el: null,
  scrim: null,
  stationId: null,
  levelIndex: 0,
  editing: new Set(),
  lastFocus: null,
};

export function initPanel(el, scrim) {
  panel.el = el;
  panel.scrim = scrim;
}

export const isOpen = () => !!panel.stationId;
export const currentStation = () => panel.stationId;

export function openPanel(stationId, levelIndex) {
  const station = STATION_BY_ID[stationId];
  if (!station) return;
  const wasOpen = isOpen();
  panel.lastFocus = wasOpen ? panel.lastFocus : document.activeElement;
  panel.stationId = stationId;
  panel.editing.clear();
  const built = store.builtCount(stationId);
  panel.levelIndex = levelIndex ?? Math.min(built, station.levels.length - 1);

  panel.el.dataset.room = station.roomId;
  panel.el.classList.remove('is-static');
  render('');
  panel.el.hidden = false;
  panel.scrim.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    panel.el.classList.add('is-open');
    panel.scrim.classList.add('is-open');
    if (!wasOpen) panel.el.querySelector('.panel__close')?.focus({ preventScroll: true });
  });
}

export function closePanel() {
  if (!isOpen()) return;
  panel.stationId = null;
  panel.el.classList.remove('is-open');
  panel.scrim.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (panel.stationId) return; // reopened in the meantime
    panel.el.hidden = true;
    panel.scrim.hidden = true;
    panel.lastFocus?.focus?.({ preventScroll: true });
  }, 400);
}

export function showLevel(index) {
  if (index === panel.levelIndex) return;
  const dir = index > panel.levelIndex ? 'flip-next' : 'flip-prev';
  panel.levelIndex = index;
  panel.editing.clear();
  panel.el.classList.remove('is-static');
  render(dir);
}

export function toggleEdit(key) {
  if (panel.editing.has(key)) panel.editing.delete(key);
  else panel.editing.add(key);
  panel.el.classList.add('is-static');
  render('');
  const item = key.startsWith('store:') ? key.slice(6) : null;
  const sel = item ? `[data-store-item="${CSS.escape(item)}"]` : `[data-need-key="${CSS.escape(key)}"]`;
  panel.el.querySelector(sel)?.select();
}

export const panelLevel = () => panel.levelIndex;

// Redraw after a save. Keeps focus and scroll where they were.
export function refreshPanel() {
  if (!isOpen()) return;
  const body = panel.el.querySelector('.panel__body');
  const scroll = body?.scrollTop ?? 0;
  const active = document.activeElement;
  const focusKey = active?.dataset?.key || active?.dataset?.needKey;
  const focusAction = active?.dataset?.action;
  const isField = active?.tagName === 'INPUT';

  // No entry animations on a simple redraw
  panel.el.classList.add('is-static');
  render('');

  const nb = panel.el.querySelector('.panel__body');
  if (nb) nb.scrollTop = scroll;
  if (focusKey) {
    const sel = isField
      ? `input[data-key="${CSS.escape(focusKey)}"], input[data-need-key="${CSS.escape(focusKey)}"]`
      : `[data-action="${focusAction}"][data-key="${CSS.escape(focusKey)}"]`;
    panel.el.querySelector(sel)?.focus({ preventScroll: true });
  }
}

// Under each item: the shared storage count (click to change it),
// how many are still free, and which other levels want the same item
function storeLine(it) {
  const editing = panel.editing.has(`store:${it.name}`);
  const count = editing
    ? `<input class="item__store-input" type="number" min="0" inputmode="numeric" value="${it.storage}"
              data-store-item="${esc(it.name)}" aria-label="How many ${esc(it.name)} you have in storage">`
    : `<button class="item__store-btn" type="button" data-action="edit-storage" data-item="${esc(it.name)}"
               title="Change how many you have in storage" aria-label="${esc(it.name)} in storage: ${it.storage}. Change">${it.storage}${icon('edit')}</button>`;
  const others = otherNeeds(it.name, it.key);
  const list = others.map((o) => `${o.station.name} L${o.step}${o.have ? ` (${o.have} set aside)` : ''}`);
  const also = others.length
    ? `<span class="item__also" title="${esc(list.join(', '))}">Also needed by ${esc(list.slice(0, 2).join(', '))}${list.length > 2 ? ` +${list.length - 2} more` : ''}</span>`
    : '';
  return `
    <p class="item__store">
      <span>Storage ${count}</span>
      <span class="${it.free ? 'item__free' : 'item__free is-none'}">${it.free} available</span>
      ${also}
    </p>`;
}

function render(flip) {
  const station = STATION_BY_ID[panel.stationId];
  const room = ROOM_BY_ID[station.roomId];
  const i = panel.levelIndex;
  const level = station.levels[i];
  const built = store.builtCount(station.id);
  const st = levelState(station, i);
  const prog = levelProgress(station, i);

  const tabs = station.levels
    .map((l, n) => {
      const s = levelState(station, n);
      const label = { built: 'Built', ready: 'Ready', progress: 'In progress', locked: 'Locked' }[s];
      return `
        <button class="level-tab ${s === 'built' ? 'is-built' : ''} ${s === 'locked' ? 'is-locked' : ''}"
                role="tab" aria-selected="${n === i}" data-action="level" data-index="${n}">
          <span class="level-tab__num">L${l.step}</span>
          <span class="level-tab__state">${s === 'built' ? '✓ ' : ''}${label}</span>
        </button>`;
    })
    .join('');

  const badge = {
    built: ['built', 'Built'],
    ready: ['ready', 'Ready to build'],
    progress: ['progress', `${Math.round(prog.ratio * 100)}% set aside`],
    locked: ['locked', `Build L${station.levels[Math.max(0, i - 1)].step} first`],
  }[st];

  const readOnly = st === 'built';
  const pw = power();
  const kw = pw.free;
  const powerFact = level.powerKw
    ? `+${level.powerKw} kW`
    : level.kw
      ? readOnly
        ? `Uses ${level.kw} kW`
        : `Uses ${level.kw} kW · ${kw} kW available`
      : 'Not needed';
  const noPower = !readOnly && !hasPower(level, kw);
  // Capabilities this level still needs (power has its own message)
  const missingCaps = readOnly ? [] : missingFor(station, i, kw).filter((m) => m.kind === 'cap');
  const fixPower = !pw.total
    ? `<a href="#utility/generator">Build the generator</a> first.`
    : pw.total < pw.max
      ? `<a href="#utility/generator">Upgrade the generator</a> for more power.`
      : 'Your generator is at max, so free some power first.';

  const rows = prog.items
    .map((it, n) => {
      const p = it.need ? Math.min(1, it.have / it.need) : 1;
      const done = readOnly || it.done;
      const needCell = panel.editing.has(it.key)
        ? `<input class="item__need-input" type="number" min="0" inputmode="numeric"
                  value="${it.need}" data-need-key="${esc(it.key)}" data-base="${it.base}"
                  aria-label="Fix how many ${esc(it.name)} this level needs">`
        : `<span>/ ${it.need}</span>`;
      return `
        <li class="item ${done ? 'is-done' : ''}" style="--i:${n};--p:${readOnly ? 1 : p}">
          <div class="item__name">
            <span class="item__check">${icon('check')}</span>
            <span>${esc(it.name)}</span>
            ${it.edited ? `<span class="item__edited" title="Wiki says ${it.base}">EDITED</span>` : ''}
          </div>
          ${readOnly ? '' : storeLine(it)}
          <div class="stepper">
            <button class="stepper__btn" data-action="dec" data-key="${esc(it.key)}" ${readOnly || !it.have ? 'disabled' : ''} aria-label="Set aside one less ${esc(it.name)}">−</button>
            <input class="stepper__input" type="number" min="0" inputmode="numeric"
                   value="${readOnly ? it.need : it.have}" data-key="${esc(it.key)}" ${readOnly ? 'disabled' : ''}
                   aria-label="How many ${esc(it.name)} are set aside for this level">
            <button class="stepper__btn" data-action="inc" data-key="${esc(it.key)}" ${readOnly ? 'disabled' : ''}
                    aria-label="Set aside one more ${esc(it.name)}" title="${it.free ? 'Take one from storage' : 'None available in storage: adds one you found'}">+</button>
          </div>
          <div class="item__need">
            ${needCell}
            ${
              readOnly
                ? ''
                : `<button class="btn btn--ghost btn--icon btn--sm" data-action="edit-need" data-key="${esc(it.key)}"
                     title="Fix the amount if the game shows a different number" aria-label="Edit needed amount">${icon('edit')}</button>`
            }
          </div>
        </li>`;
    })
    .join('');

  const canBuild = i === built;
  const canUndo = i === built - 1;

  panel.el.innerHTML = `
    <header class="panel__head">
      <div>
        <p class="panel__eyebrow">${esc(room.name)} // Station</p>
        <h2 class="panel__title" id="panel-title">${esc(station.name)}</h2>
      </div>
      <button class="btn btn--icon panel__close" data-action="close" aria-label="Close">${icon('close')}</button>
      <nav class="panel__levels" role="tablist" aria-label="Levels">${tabs}</nav>
    </header>

    <div class="panel__body">
      <article class="level ${flip}">
        <div class="level__top">
          <h3 class="level__device">${esc(level.device)}</h3>
          <span class="level__badge level__badge--${badge[0]}">${badge[1]}</span>
        </div>

        <dl class="level__facts">
          <div class="level__fact"><dt>Cash</dt><dd>${money(level.cash)}</dd></div>
          <div class="level__fact ${missingCaps.length ? 'is-short' : ''}"><dt>Requires</dt><dd>${esc(requiresText(level))}</dd></div>
          <div class="level__fact"><dt>Gives</dt><dd>${esc(level.provides)}</dd></div>
          <div class="level__fact ${noPower ? 'is-short' : ''}"><dt>Power</dt><dd>${powerFact}</dd></div>
        </dl>

        ${missingCaps
          .map(
            (m) =>
              `<p class="level__warn">${icon('lock')}<span><b>Needs ${esc(missingLabel(m))}.</b> This room has ${m.have}. Build ${esc(missingFix(m))} to get more.</span></p>`
          )
          .join('')}

        ${
          noPower
            ? `<p class="level__warn">${icon('bolt')}<span><b>Not enough power.</b> This level uses ${level.kw} kW and you have ${kw} kW available. ${fixPower}</span></p>`
            : ''
        }

        ${
          readOnly
            ? ''
            : `<div class="level__progress">
                 <div class="station-card__progress-row"><span class="label">Set aside for this level</span><span class="mono">${prog.have} / ${prog.need}</span></div>
                 <div class="bar ${prog.allDone ? 'is-done' : ''}" style="--p:${prog.ratio}"><span class="bar__fill"></span></div>
                 <p class="level__help">Your storage is shared by every station. Set items aside here so they are not counted twice. Building uses them up.</p>
               </div>`
        }

        <ul class="items">${rows}</ul>
      </article>
    </div>

    <footer class="panel__foot">
      ${
        readOnly
          ? ''
          : `<button class="btn btn--sm" data-action="fill-level">${icon('fill')}<span>Have all</span></button>
             <button class="btn btn--sm" data-action="clear-level">${icon('reset')}<span>Clear</span></button>`
      }
      ${canUndo ? `<button class="btn btn--sm btn--danger" data-action="unbuild">${icon('reset')}<span>Undo build</span></button>` : ''}
      ${
        // Shows up as soon as the station has any progress, always in view
        store.hasProgress(station.id)
          ? `<button class="btn btn--sm btn--danger" type="button" data-action="reset-station"
                     title="Start this station over, for example after a game update">${icon('reset')}<span>Reset station</span></button>`
          : ''
      }
      ${
        canBuild
          ? `<button class="btn btn--primary" data-action="build">${icon('check')}<span>Mark L${level.step} built</span></button>`
          : st === 'locked'
            ? `<button class="btn btn--primary" disabled>${icon('lock')}<span>Locked</span></button>`
            : ''
      }
    </footer>`;

  panel.el.setAttribute('aria-labelledby', 'panel-title');
}
