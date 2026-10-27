// =============================================================
// STATION PANEL
// Opens when you click a station. Shows each level, every item,
// how many you have and how many you need.
// =============================================================
import { STATION_BY_ID, ROOM_BY_ID } from '../data.js';
import { levelProgress, levelState, power, hasPower } from '../calc.js';
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
  panel.el.querySelector(`[data-need-key="${CSS.escape(key)}"]`)?.select();
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
    progress: ['progress', `${Math.round(prog.ratio * 100)}% stocked`],
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
        : `Uses ${level.kw} kW · ${kw} kW free`
      : 'Not needed';
  const noPower = !readOnly && !hasPower(level, kw);
  const fixPower =
    pw.total < pw.max
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
          <div class="stepper">
            <button class="stepper__btn" data-action="dec" data-key="${esc(it.key)}" ${readOnly ? 'disabled' : ''} aria-label="One less ${esc(it.name)}">−</button>
            <input class="stepper__input" type="number" min="0" inputmode="numeric"
                   value="${readOnly ? it.need : it.have}" data-key="${esc(it.key)}" ${readOnly ? 'disabled' : ''}
                   aria-label="How many ${esc(it.name)} you have">
            <button class="stepper__btn" data-action="inc" data-key="${esc(it.key)}" ${readOnly ? 'disabled' : ''} aria-label="One more ${esc(it.name)}">+</button>
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
          <div class="level__fact"><dt>Requires</dt><dd>${esc(level.requires)}</dd></div>
          <div class="level__fact"><dt>Gives</dt><dd>${esc(level.provides)}</dd></div>
          <div class="level__fact ${noPower ? 'is-short' : ''}"><dt>Power</dt><dd>${powerFact}</dd></div>
        </dl>

        ${
          noPower
            ? `<p class="level__warn">${icon('bolt')}<span><b>Not enough power.</b> This level uses ${level.kw} kW and you have ${kw} kW free. ${fixPower}</span></p>`
            : ''
        }

        ${
          readOnly
            ? ''
            : `<div class="level__progress">
                 <div class="station-card__progress-row"><span class="label">Items stocked</span><span class="mono">${prog.have} / ${prog.need}</span></div>
                 <div class="bar ${prog.allDone ? 'is-done' : ''}" style="--p:${prog.ratio}"><span class="bar__fill"></span></div>
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
        canBuild
          ? `<button class="btn btn--primary" data-action="build">${icon('check')}<span>Mark L${level.step} built</span></button>`
          : st === 'locked'
            ? `<button class="btn btn--primary" disabled>${icon('lock')}<span>Locked</span></button>`
            : ''
      }
    </footer>`;

  panel.el.setAttribute('aria-labelledby', 'panel-title');
}
