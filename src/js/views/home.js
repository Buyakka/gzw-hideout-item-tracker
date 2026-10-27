// =============================================================
// HOME (landing page)
// First screen, styled like the game's main menu: logo, a note,
// the rooms to pick from, a big yellow button and the tools.
// Everything fits on one screen: two columns from tablets up.
// =============================================================
import { ROOMS, ROOM_BY_ID } from '../data.js';
import { overall, power } from '../calc.js';
import { store } from '../state.js';
import { icon, esc } from '../icons.js';

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

// Our mark between GRAY and ZONE: a plain thick hollow triangle
// pointing down, in yellow. Drawn here, not traced.
const MARK = `<svg class="home__mark" viewBox="0 0 40 40" aria-hidden="true">
  <path d="M1.5 5H38.5L20 37ZM11.5 10H28.5L20 24.5Z" fill="currentColor" fill-rule="evenodd"/>
</svg>`;

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
    // Whole room built: green, with a check (no room colour class,
    // because utility classes would win over the green)
    const done = ro.built >= ro.total;
    return `
      <a class="home-room ${done ? 'is-done' : `u-room-${r.id}`}" href="#${r.id}" ${step()}>
        <span class="home-room__icon">${icon(r.icon)}</span>
        <span class="home-room__name">${esc(r.tab)}</span>
        <span class="home-room__count">${done ? `${icon('check')}Maxed · ${ro.built} / ${ro.total}` : `${ro.built} / ${ro.total} built`}</span>
        <span class="bar" style="--p:${ro.levelRatio}"><span class="bar__fill"></span></span>
      </a>`;
  }).join('');

  el.innerHTML = `
    <section class="home">
      <div class="home__menu">
        <div class="home__col">
        <header class="home__brand" ${step()}>
          <!-- The game name in our own style, so a new player knows what the
               site is for. The mark between the words is our own plain
               yellow triangle, drawn here. -->
          <h1 class="home__title" aria-label="Gray Zone Warfare hideout item tracker">
            <span class="home__game" aria-hidden="true">
              <span>Gray</span>${MARK}<span>Zone</span>
            </span>
            <span class="home__warfare" aria-hidden="true">Warfare</span>
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
        </div>

        <div class="home__col">
        <p class="home__label" ${step()}>Tools</p>
        <div class="home__tools">
          <a class="home__tool" href="#shopping" ${step()}>${icon('list')}<span>Shopping List</span>${icon('chevron')}</a>
          <a class="home__tool" href="#build" ${step()}>${icon('arrow')}<span>Next Upgrades</span>${icon('chevron')}</a>
          <a class="home__tool" href="#disassembly" ${step()}>${icon('split')}<span>Disassembly</span>${icon('chevron')}</a>
          <button class="home__tool" type="button" data-action="lookup" ${step()}>
            ${icon('search')}<span>Find an item</span><kbd class="home__tool-value">/</kbd>
          </button>
          <a class="home__tool" href="#guide" ${step()}>${icon('book')}<span>How it works</span>${icon('chevron')}</a>
          <button class="home__tool" type="button" data-action="text-size" ${step()}>
            ${icon('text')}<span>Text size</span><span class="home__tool-value" data-text-label>A</span>
          </button>
        </div>

        <dl class="home__stats" ${step()}>
          <div><dt>Levels built</dt><dd>${o.built} / ${o.total}</dd></div>
          <div><dt>Items found</dt><dd>${o.itemsHave} / ${o.itemsNeed}</dd></div>
          <div><dt>Available power</dt><dd>${p.total ? `${p.free} of ${p.total} kW` : 'Build the generator'}</dd></div>
        </dl>
        </div>
      </div>
    </section>`;
}
