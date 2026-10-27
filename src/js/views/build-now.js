// =============================================================
// NEXT UPGRADES VIEW (#build)
// Every level the player can work on right now (its requirements
// are met). Levels with all items found come first, then the ones
// still collecting, closest to done first.
// =============================================================
import { buildNow } from '../calc.js';
import { ROOM_BY_ID } from '../data.js';
import { icon, esc, money } from '../icons.js';

function row(e, i) {
  const room = ROOM_BY_ID[e.station.roomId];
  const done = e.left === 0;
  return `
    <li>
      <a class="bn" href="#${e.station.id}" style="--i:${i}">
        <span class="bn__icon">${icon(e.station.icon)}</span>
        <span class="bn__main">
          <span class="bn__room">${esc(room.tab)}</span>
          <span class="bn__name">${esc(e.station.name)} <span class="bn__lvl">L${e.level.step}</span></span>
          <span class="bn__device">${esc(e.level.device)}${e.level.cash ? ` · ${money(e.level.cash)}` : ''}</span>
        </span>
        <span class="bn__state ${done ? 'is-done' : ''}">
          <span class="bn__msg">${
            done
              ? `${icon('check')}All items set aside`
              : e.coverable
                ? `${icon('box')}Enough in storage, set it aside`
                : `${e.left} item${e.left === 1 ? '' : 's'} left`
          }</span>
          <span class="bar ${done ? 'is-done' : ''}" style="--p:${e.ratio}"><span class="bar__fill"></span></span>
        </span>
        ${icon('chevron', 'bn__go')}
      </a>
    </li>`;
}

export function renderBuildNow(el) {
  const { ready, startable } = buildNow();
  let i = 0;
  const list = (entries) => `<ul class="bn-list">${entries.map((e) => row(e, i++)).join('')}</ul>`;

  el.innerHTML = `
    <section class="view" data-room="build">
      <header class="room-banner">
        <div>
          <p class="room-banner__eyebrow">// Next moves</p>
          <h1 class="room-banner__title">Next Upgrades</h1>
          <p class="room-banner__desc">The next level of each station that is unlocked: the stations and power it needs are already built. You still need its items. Levels with every item set aside are at the top.</p>
        </div>
        <div class="room-banner__meta">
          <span class="chip">Ready <b>${ready.length}</b></span>
          <span class="chip">Unlocked <b>${startable.length}</b></span>
        </div>
      </header>

      <h2 class="bn-head">${icon('check')}Ready to build</h2>
      ${
        ready.length
          ? list(ready)
          : `<p class="empty">Nothing has all its items yet. Keep collecting, the closest ones are below.</p>`
      }

      <h2 class="bn-head">${icon('list')}Collect items for</h2>
      ${
        startable.length
          ? list(startable)
          : `<p class="empty">${ready.length ? 'Build the ready ones above to unlock more.' : 'Everything is built or still waiting on requirements.'}</p>`
      }
    </section>`;
}
