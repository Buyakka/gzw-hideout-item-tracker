// =============================================================
// ROOM VIEW
// A banner plus a grid of 3D station cards.
// =============================================================
import { ROOM_BY_ID } from '../data.js';
import { stationSummary, overall, power, missingFor, missingLabel, missingFix } from '../calc.js';
import { icon, esc, money } from '../icons.js';

export function renderRoom(el, roomId) {
  const room = ROOM_BY_ID[roomId];
  const o = overall(room.stations);
  const kw = power().free;

  el.innerHTML = `
    <section class="view" data-room="${room.id}">
      <header class="room-banner">
        <div>
          <p class="room-banner__eyebrow">// Sector ${esc(room.short)}</p>
          <h1 class="room-banner__title">${esc(room.name)}</h1>
          <p class="room-banner__desc">${esc(room.desc)}</p>
        </div>
        <div class="room-banner__meta">
          <span class="chip">Stations <b>${room.stations.length}</b></span>
          <span class="chip">Built <b>${o.built}/${o.total}</b></span>
          <span class="chip">Items <b>${o.itemsHave}/${o.itemsNeed}</b></span>
          <span class="chip">Cash <b>${money(o.cash)}</b></span>
        </div>
      </header>
      <div class="station-grid">
        ${room.stations.map((s, i) => card(s, i, kw)).join('')}
      </div>
    </section>`;
}

function card(station, i, kw) {
  const sum = stationSummary(station);
  // What the next level still needs (capabilities, power)
  const missing = sum.maxed ? [] : missingFor(station, sum.built, kw);
  const waiting = missing.length > 0;
  const pips = station.levels
    .map((_, n) => `<span class="pips__pip ${n < sum.built ? 'is-on' : ''}"></span>`)
    .join('');

  // Status line: tells the player where they can start right now
  let nextLabel;
  if (sum.maxed) nextLabel = 'Fully upgraded';
  else if (waiting) nextLabel = `Level ${sum.next.step} · needs ${missing.map(missingLabel).join(', ')}`;
  else if (sum.ready) nextLabel = `Ready to build L${sum.next.step}`;
  else nextLabel = `Level ${sum.next.step} · ready to start`;
  const status = sum.maxed ? '' : waiting ? 'is-waiting' : 'is-startable';

  const device = sum.maxed ? station.levels.at(-1).device : sum.next.device;

  return `
    <button class="station-card ${status} ${sum.maxed ? 'is-maxed' : ''} ${sum.ready && !waiting ? 'is-ready' : ''}"
            style="--i:${i}" data-action="open" data-station="${station.id}"
            aria-label="${esc(station.name)}, level ${sum.built} of ${sum.total}">
      <div class="station-card__head">
        <span class="station-card__icon">${icon(station.icon)}</span>
        <div>
          <h2 class="station-card__name">${esc(station.name)}</h2>
          <span class="station-card__level">LV ${sum.built} / ${sum.total}</span>
        </div>
      </div>
      <div class="station-card__body">
        <p class="station-card__next">${waiting ? icon('lock') : ''}${esc(nextLabel)}</p>
        <p class="station-card__device">${esc(device)}</p>
        ${
          waiting
            ? `<p class="station-card__power">${icon('arrow')}Build ${esc([...new Set(missing.map(missingFix))].join(' and '))} first</p>`
            : ''
        }
      </div>
      <div class="station-card__foot">
        <div class="pips">${pips}</div>
        ${
          sum.maxed
            ? ''
            : `<div class="station-card__progress-row"><span>Items</span><span>${sum.have} / ${sum.need}</span></div>
               <div class="bar ${sum.ready ? 'is-done' : ''}" style="--p:${sum.ratio}"><span class="bar__fill"></span></div>`
        }
      </div>
    </button>`;
}
