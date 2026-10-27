// =============================================================
// DATA
// Loads hideout.json and adds ids, icons and room info.
// To fix a recipe for everyone, edit src/data/hideout.json.
// =============================================================
import raw from '../data/hideout.json';

const ROOM_INFO = {
  'Utility Room': {
    id: 'utility',
    short: 'Utility',
    icon: 'bolt',
    desc: 'Power for the whole hideout. Build the generator first. Most other stations need kW to run.',
  },
  Laboratory: {
    id: 'laboratory',
    short: 'Lab',
    icon: 'flask',
    desc: 'Turns raw chemicals into medical products and contraband. Your main money maker.',
  },
  'Electronics Workshop': {
    id: 'workshop',
    short: 'Workshop',
    icon: 'chip',
    desc: 'Strips and rebuilds military electronics. Makes hacking tools and tracking tags.',
  },
};

const STATION_ICONS = {
  Generator: 'bolt',
  'Heat Source': 'flame',
  'Extraction Vessel': 'drop',
  'Reaction Vessel': 'beaker',
  Filtration: 'filter',
  Analysis: 'scope',
  Glassware: 'flask',
  'Storage Equipment': 'box',
  'Ventilation System': 'fan',
  Hardware: 'server',
  Software: 'code',
  'Micro Electronics': 'chip',
  'Machine Tools': 'gear',
  'RF Sensors': 'signal',
};

export const slug = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const ROOMS = raw.rooms.map((r) => {
  const info = ROOM_INFO[r.room];
  return {
    ...info,
    name: r.room,
    stations: r.stations.map((s) => ({
      id: `${info.id}/${slug(s.station)}`,
      name: s.station,
      icon: STATION_ICONS[s.station] ?? 'box',
      roomId: info.id,
      levels: s.levels.map((l, index) => ({
        ...l,
        index,
        // Some stations skip a level number in the game data,
        // so we show the step (1, 2, 3) and keep the real number too.
        step: index + 1,
      })),
    })),
  };
});

export const STATIONS = ROOMS.flatMap((r) => r.stations);
export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
export const TOTAL_LEVELS = STATIONS.reduce((n, s) => n + s.levels.length, 0);
export const META = {
  game: raw.game,
  version: raw.version,
  checked: raw.checked,
  sources: raw.sources,
};
