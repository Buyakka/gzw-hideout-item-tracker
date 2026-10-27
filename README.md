# Buyaka // GZW Hideout Item Tracker

An interactive tracker for the **Gray Zone Warfare** hideout (Update 0.5 Rogue Ops).

Pick any station and level, see every item it needs, and count what you have found.
Progress saves in your browser, so it is still there next time. Keep it open on a
second monitor while you play. Two open tabs stay in sync.

## Features

- Landing page like the game's main menu: pick a room, or Continue where you left off
- Room tabs in the game's order (Laboratory, Workshop, Utility Room, locked Personal)
- Buyaka "B" logo with a gold crown (SVG): builds itself on the landing page,
  glints in the header, and is the browser tab icon
- Animated room backgrounds: Laboratory (fan, smoke, fridge flicker),
  Workshop (light and screen flicker, smoke, dust) and Utility Room (blinking lamp,
  running generator, exhaust, dust)
- Animated main hideout background on the landing page, Shopping List and Disassembly
  (fan, smoke, fridge and screen flicker, whiter hanging lamps, dust), moves with the mouse
- All 3 rooms, 15 stations and 36 upgrade levels
- Have / need counter for every item, with + and − buttons
- Shopping list that adds up everything still needed
- Power meter like the game: available kW = generator kW minus what built stations use,
  and a warning on levels that need more than is free
- Disassembly page: all 15 recipes (12 hours each) with search
- Edit button to fix a recipe amount if the game shows a different number
- Backup and load your progress as a file
- 3D tilt cards, 3D level flips, radar and HUD effects
- Works on phones, tablets and wide screens
- Respects "reduce motion" in your system settings

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build in /dist
npm run preview   # preview the build
```

## Project layout

```
index.html
src/
  data/hideout.json      every station, level and item (edit here to fix a recipe)
  js/
    main.js              routing, events, start up
    data.js              loads the JSON, adds ids and icons
    state.js             saved progress (localStorage) + tab sync + backup
    calc.js              progress math and shopping list
    fx.js                3D tilt, parallax, toasts
    icons.js             SVG icons and small helpers
    logo.js              the Buyaka B logo (SVG)
    scenes.js            runs the animated background of the open room
    workshop-scene.js    Workshop background effects
    utility-scene.js     Utility Room background effects
    hideout-scene.js     main hideout background effects
    scene-parts.js       dust, smoke and flicker shared by the scenes
    views/               home, hud, room, panel, shopping, disassembly
  assets/                room and hideout images (fade the main one with --photo-opacity)
  styles/                Sass (see below)
public/favicon.svg
```

## Styles: Sass + design tokens + cascade layers

```
src/styles/
  main.scss              sets the layer order and loads everything
  abstracts/             no CSS output
    _tokens.scss         every color, font, size, timing and breakpoint
    _functions.scss      color('accent'), space('4'), fs('lg') ...
    _mixins.scss         up('md'), hover, motion, notch, brackets ...
  base/                  root variables, reset, typography
  layout/                page shell, header
  components/            one file per UI piece
  effects/               background, keyframes, motion
```

- **Change a color or size once** in `_tokens.scss`. It becomes a CSS variable
  (`--c-accent`) and updates everywhere.
- **Room colors** come from one variable, `--room`, set by `data-room` on a parent.
- **Cascade layers** (`base → layout → components → effects → utilities`) decide which
  style wins, so you do not fight selector weight.
- **Mobile first.** Use `@include up('md') { ... }` for bigger screens.

## Data

Recipes come from [gzwhideout.com](http://gzwhideout.com/), checked against the
[Fandom wiki](https://gray-zone-warfare.fandom.com/wiki/Hideout) and
[grayzonewarfaregame.wiki](https://grayzonewarfaregame.wiki/hideout/hideout-guide/).
Where they disagree, the level has a `sourceConflict` note in the JSON (not shown on the site).

Power: each level's `kw` is the power it uses once built, and it adds up. This matches the
game: a maxed generator (18 kW) with 8 kW of built levels shows "Available Power 10 kW".

Disassembly recipes come from the Fandom wiki. It does not list how many of each part you get.

Fan made. Not made by or linked to MADFINGER Games.
