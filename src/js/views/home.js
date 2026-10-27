// =============================================================
// HOME (landing page)
// First screen, styled like the game's main menu: logo, a note,
// the rooms to pick from, a big yellow button and the tools.
// =============================================================
import { ROOMS, ROOM_BY_ID } from '../data.js';
import { overall, power } from '../calc.js';
import { store } from '../state.js';
import { icon, esc } from '../icons.js';
import { logo, LETTER_VIEW } from '../logo.js';

const LAST_KEY = 'buyaka-gzw-hideout:last-room';

// Remember the last room so the big button can take you back
export function rememberRoom(id) {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    /* storage blocked: the button just says Start */
  }
}

function lastRoom() {
  try {
    const id = localStorage.getItem(LAST_KEY);
    return ROOM_BY_ID[id] || id === 'shopping' || id === 'disassembly' ? id : null;
  } catch {
    return null;
  }
}

const TOOL_NAMES = { shopping: 'Shopping List', disassembly: 'Disassembly' };

export function renderHome(el) {
  const o = overall();
  const p = power();
  const last = lastRoom();
  const play = last
    ? { href: `#${last}`, text: 'Continue', sub: ROOM_BY_ID[last]?.tab ?? TOOL_NAMES[last] }
    : { href: '#utility/generator', text: 'Start', sub: 'Build the generator first' };

  let i = 0;
  const step = () => `style="--i:${i++}"`;

  const rooms = ROOMS.map((r) => {
    const ro = overall(r.stations);
    return `
      <a class="home-room u-room-${r.id}" href="#${r.id}" ${step()}>
        <span class="home-room__icon">${icon(r.icon)}</span>
        <span class="home-room__name">${esc(r.tab)}</span>
        <span class="home-room__count">${ro.built} / ${ro.total} built</span>
        <span class="bar" style="--p:${ro.levelRatio}"><span class="bar__fill"></span></span>
      </a>`;
  }).join('');

  el.innerHTML = `
    <section class="home">
      <div class="home__menu">
        <header class="home__brand" ${step()}>
          <!-- The logo's B (with its crown) is the first letter of the name -->
          <h1 class="home__title" aria-label="Buyaka">
            <span class="home__b" aria-hidden="true">${logo('logo--intro', LETTER_VIEW)}</span><span aria-hidden="true">uyaka</span>
          </h1>
          <p class="home__sub">Hideout Item Tracker</p>
        </header>

        <p class="home__note" ${step()}>
          ${icon('warn')}
          <span>See every item a hideout upgrade needs, before you build it.
          <b>Your progress is saved in this browser.</b></span>
        </p>

        <p class="home__label" ${step()}>Select room</p>
        <nav class="home__rooms" aria-label="Rooms">
          ${rooms}
          <span class="home-room is-locked" ${step()} aria-disabled="true" title="Locked in the game for now">
            <span class="home-room__icon">${icon('lock')}</span>
            <span class="home-room__name">Personal</span>
            <span class="home-room__count">Locked</span>
          </span>
        </nav>

        <a class="home__play" href="${play.href}" ${step()}>
          <span>${play.text}<small>${esc(play.sub)}</small></span>
          ${icon('play')}
        </a>

        <p class="home__label" ${step()}>Tools</p>
        <div class="home__tools">
          <a class="home__tool" href="#shopping" ${step()}>${icon('list')}<span>Shopping List</span>${icon('chevron')}</a>
          <a class="home__tool" href="#disassembly" ${step()}>${icon('split')}<span>Disassembly</span>${icon('chevron')}</a>
        </div>

        <dl class="home__stats" ${step()}>
          <div><dt>Levels built</dt><dd>${o.built} / ${o.total}</dd></div>
          <div><dt>Items found</dt><dd>${o.itemsHave} / ${o.itemsNeed}</dd></div>
          <div><dt>Power</dt><dd>${p.available} / ${p.max} kW</dd></div>
        </dl>
      </div>
    </section>`;
}
