// =============================================================
// GUIDE VIEW (#guide)
// A plain-language walk through the whole site, with real
// screenshots. Screenshots live in public/guide/ and are made by
// scripts/capture-guide.mjs (run it again after a design change).
// The list of topics jumps inside the page with data-jump, since
// the address bar hash is used for pages.
// =============================================================
import { icon } from '../icons.js';

// Width and height of each screenshot, so the page does not jump
// while images load
const SHOTS = {
  home: [2049, 1152],
  header: [2049, 133],
  room: [2049, 1152],
  maxed: [494, 339],
  panel: [900, 1350],
  item: [845, 205],
  'panel-foot': [899, 248],
  confirm: [750, 496],
  shopping: [1983, 565],
  'shopping-next': [1983, 657],
  'phone-card': [561, 363],
  next: [2049, 1152],
  find: [960, 1044],
  disassembly: [2049, 1152],
};

const shot = (name, alt, caption, size = '') => {
  const [w, h] = SHOTS[name];
  return `
    <figure class="guide__shot ${size ? `guide__shot--${size}` : ''}">
      <img src="guide/${name}.webp" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async">
      <figcaption>${caption}</figcaption>
    </figure>`;
};

const tip = (text) => `<p class="guide__tip">${icon('warn')}<span>${text}</span></p>`;

const TOPICS = [
  ['start', 'The first screen'],
  ['getting-around', 'Getting around'],
  ['rooms', 'Rooms and stations'],
  ['station', 'Inside a station'],
  ['items', 'Adding your items'],
  ['building', 'Building a level'],
  ['shopping', 'The Shopping List'],
  ['next', 'What to farm next'],
  ['find', 'Find an item'],
  ['disassembly', 'Disassembly'],
  ['power', 'Power'],
  ['saving', 'Saving and starting over'],
];

export function renderGuide(el) {
  el.innerHTML = `
    <section class="view guide" data-room="guide">
      <header class="room-banner">
        <div>
          <p class="room-banner__eyebrow">// Field manual</p>
          <h1 class="room-banner__title">How it works</h1>
          <p class="room-banner__desc">A quick tour of the tracker, from your first click to a maxed-out hideout. Read it top to bottom, or jump to the part you need.</p>
        </div>
      </header>

      <div class="guide__layout">
        <nav class="guide__toc" aria-label="Guide topics">
          <p class="guide__toc-title">On this page</p>
          <ol>
            ${TOPICS.map(([id, label]) => `<li><a href="#guide" data-action="guide-jump" data-jump="${id}">${label}</a></li>`).join('')}
          </ol>
        </nav>

        <div class="guide__body">
          <section class="guide__part guide__intro">
            <p>Upgrading the hideout in Gray Zone Warfare takes a lot of stuff. Steel, wiring, lab glass, a hard drive or two. Keeping all of that in your head gets old fast, so we built this.</p>
            <p>You tell the site what you have. It tells you what is still missing, which station wants it, and what you can build right now. No account, no sign-up. Everything stays in your browser.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="start">
            <h2>${icon('play')}The first screen</h2>
            <p>This is where you land. Pick a room on the left, or hit the big yellow button. On your very first visit it says <b>Start</b> and takes you to the generator, because that is where every hideout begins. After that it turns into <b>Continue</b> and drops you back in the last room you had open.</p>
            ${shot('home', 'The landing page with the room list, the yellow Continue button and the tools menu', 'Rooms on the left, tools on the right, and your overall progress at the bottom.')}
            <p>The tools on the right open the bigger helpers: the Shopping List, Next Upgrades, Disassembly and the item search. Text size lives here too. Tap it to cycle between normal, bigger and biggest.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="getting-around">
            <h2>${icon('arrow')}Getting around</h2>
            <p>Once you are inside, the bar at the top stays with you on every page. It is your scoreboard.</p>
            ${shot('header', 'The top bar showing levels built, items found, cash left and free power, plus five small buttons', 'Your four main numbers, always in view.')}
            <ul class="guide__list">
              <li><b>Levels built</b> counts every upgrade you have finished.</li>
              <li><b>Items found</b> compares what you own with everything the hideout still asks for.</li>
              <li><b>Cash left</b> adds up the money the remaining levels cost.</li>
              <li><b>Free power</b> is how much kW your generator has left to spare.</li>
            </ul>
            <p>The small buttons on the right do, in order: text size, find an item, save a backup, load a backup and reset all. Under the bar you get the room tabs and the tool pages. A green check next to a room means every station in it is maxed.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="rooms">
            <h2>${icon('box')}Rooms and stations</h2>
            <p>Each room shows its stations as cards. A card tells you a lot at a glance, so it is worth learning how to read one.</p>
            ${shot('room', 'The Laboratory room with eight station cards in a grid', 'The Laboratory. Yellow cards are ready to start, grey ones are waiting on something.')}
            <p>Under the name you will see the level, like <b>LV 1 / 3</b>. The line below that is the important part:</p>
            <ul class="guide__list">
              <li><b>Ready to start</b> in yellow means nothing is blocking you. Go collect the items.</li>
              <li><b>Needs Safety 1</b> (or a similar name) with a lock means another station has to be built first. The card tells you which one.</li>
              <li><b>Ready to build</b> in green means every item is set aside. Open it and build.</li>
            </ul>
            <p>The little bars at the bottom are your levels, and the line under them fills up as you set items aside. Finish every level and the whole card turns green with a <b>Maxed</b> badge.</p>
            ${shot('maxed', 'A green station card for the Generator with a Maxed badge', 'All done. Green means fully upgraded.', 'small')}
          </section>

          <section class="guide__part" tabindex="-1" id="station">
            <h2>${icon('gear')}Inside a station</h2>
            <p>Click any card and a panel slides in from the side. Up top are the level tabs. Built levels show a green check, the one you are working on is highlighted, and the rest stay locked until you get there.</p>
            ${shot('panel', 'The Heat Source panel showing level tabs, cost, requirements, a warning and the item list', 'Heat Source, level 2. The yellow box explains what is still blocking it.', 'tall')}
            <p>Right under the name you get the facts for that level: what it costs, what it needs, what it gives you and how much power it uses. If something is missing, a yellow box spells it out in plain words, like <i>Build Ventilation System to get more.</i> No guessing.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="items">
            <h2>${icon('fill')}Adding your items</h2>
            <p>Here is the one idea that makes everything click. Your <b>storage</b> is shared. If you own 12 Steel, that is 12 Steel for the whole hideout, not 12 for every station.</p>
            <p>So when you want to use some for a level, you <b>set it aside</b> for that level. Whatever is not set aside yet shows as <b>available</b>.</p>
            ${shot('item', 'One item row: Steel, 4 of 4 set aside, 12 in storage, 8 available', 'Four Steel set aside for this level. Twelve in storage, so eight are still free for other stations.')}
            <ul class="guide__list">
              <li>Press <b>+</b> to set one more aside. If none are available, the site figures you just found one and adds it to your storage too.</li>
              <li>Press <b>−</b> to put one back. It goes back into storage, nothing is lost.</li>
              <li>Prefer typing? Click the number, type it in and press Enter.</li>
              <li>Click the storage number (the one with the pencil) to fix how many you own in total.</li>
              <li>The little pencil next to <b>/ 4</b> lets you change the recipe amount, in case the game shows a different number after an update.</li>
            </ul>
            ${tip('<b>Also needed by</b> shows which other stations want the same item. Handy before you spend your last few.')}
          </section>

          <section class="guide__part" tabindex="-1" id="building">
            <h2>${icon('check')}Building a level</h2>
            <p>The buttons at the bottom of the panel never scroll away, so they are always one click from where you are.</p>
            ${shot('panel-foot', 'The bottom buttons: Have all, Clear, Reset station and Mark L2 built', 'Everything you need to finish a level.')}
            <ul class="guide__list">
              <li><b>Have all</b> sets aside everything this level needs, as far as your storage allows. If you are short on something, it tells you what.</li>
              <li><b>Clear</b> puts this level's items back into storage.</li>
              <li><b>Mark built</b> is the big one. Use it after you build the level in game. The items you set aside get used up, just like in the game.</li>
              <li><b>Undo build</b> shows up on the level you just built. Clicked it by accident? This brings the items back.</li>
              <li><b>Reset station</b> appears once a station has any progress. It starts that one station over and leaves the rest alone.</li>
            </ul>
            <p>Anything that erases progress asks first. <b>No, keep it</b> is selected by default, and Esc also counts as no, so a stray Enter will never wipe your work.</p>
            ${shot('confirm', 'A warning box asking Reset Heat Source? with No, keep it and Yes, reset station buttons', 'You always get a second chance before a reset.', 'small')}
          </section>

          <section class="guide__part" tabindex="-1" id="shopping">
            <h2>${icon('list')}The Shopping List</h2>
            <p>This is the page most players live on. Every item in the hideout, in A to Z order, with all your numbers in one place.</p>
            ${shot('shopping', 'The Shopping List with a search box, filter buttons and three item rows', 'Search, filters and the full item list.', 'wide')}
            <p>Here is what each column means:</p>
            <dl class="guide__terms">
              <div><dt>Total</dt><dd>How many the whole hideout needs, all levels together.</dd></div>
              <div><dt>Used</dt><dd>How many your built levels already used up.</dd></div>
              <div><dt>Still need</dt><dd>What is left for levels you have not built yet.</dd></div>
              <div><dt>Have</dt><dd>What you own right now. Change it with − and + or type a number.</dd></div>
              <div><dt>Left</dt><dd>What you still have to find. A check means you have enough.</dd></div>
            </dl>
            <p>Coming back from a raid with a full bag? This is the fastest place to log it. Find the item, type what you have, done. The rows never move while you click, so you will not hit the wrong one.</p>
            <p>The buttons above the list narrow it down. <b>Construction</b> shows only building materials, <b>Electronics</b> only electronics, and so on. Search works on top of that, and <b>Hide done</b> clears out anything you already have enough of.</p>
            <p>The <b>Used by</b> tags show which stations want the item and how many each level takes. Levels you already built stay in the tag in green, so you never lose track of where your Steel went. Click a tag to jump straight to that station.</p>
            ${tip('On a phone each item turns into its own card. Same numbers, same buttons, just stacked so they fit.')}
            ${shot('phone-card', 'One Shopping List item shown as a card on a phone', 'A Shopping List item on a phone.', 'small')}
          </section>

          <section class="guide__part" tabindex="-1" id="next">
            <h2>${icon('arrow')}What to farm next</h2>
            <p>The full list is long, and early on most of it does not matter yet. Tick <b>Next upgrades only</b> and the list shrinks to just the items for levels you can build or start today.</p>
            ${shot('shopping-next', 'The Shopping List with Next upgrades only ticked, showing Next: 1 under each item and highlighted level tags', 'Only what matters right now. The highlighted tags are the levels you can work on.', 'wide')}
            <p>Each item also gets a small <b>Next</b> number. That is how many those levels need in total. It is the short version of your shopping trip.</p>
            <p>Want the same thing grouped by station instead? The <b>Next Upgrades</b> page lists every level you can work on right now. Levels with all their items ready sit at the top, and the rest are sorted by how close they are.</p>
            ${shot('next', 'The Next Upgrades page listing unlocked levels with how many items each has left', 'Every unlocked level, closest to done first.')}
          </section>

          <section class="guide__part" tabindex="-1" id="find">
            <h2>${icon('search')}Find an item</h2>
            <p>Picked something up and not sure if it is worth keeping? Press <kbd>/</kbd> on any page, or use the search button, and type its name.</p>
            ${shot('find', 'The Find an item box showing results for steel: still need 86, in storage 12, left 74', 'Your numbers for that item, plus every station that wants it.', 'small')}
            <p>You will see how many you still need, how many you have and which stations use it. If you can get it by breaking something down, that shows up here too. Press Esc to close it.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="disassembly">
            <h2>${icon('split')}Disassembly</h2>
            <p>Some parts are easier to get by taking other things apart. This page lists what you can break down and what comes out. Use the search box to check a specific item.</p>
            ${shot('disassembly', 'The Disassembly page with a list of devices and the parts they break into', 'What breaks down into what.')}
          </section>

          <section class="guide__part" tabindex="-1" id="power">
            <h2>${icon('bolt')}Power</h2>
            <p>Most stations need electricity, and it all comes from the generator in the Utility Room. That is why the site sends new players there first.</p>
            <p>Every generator level adds kW. Every station level that needs power uses some of it up for good, just like the game does. The <b>Free power</b> number at the top is what you have left. If a level needs more than that, its panel tells you to build or upgrade the generator first.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="saving">
            <h2>${icon('download')}Saving and starting over</h2>
            <p>There is nothing to save by hand. Every click is stored in your browser right away, and it is still there tomorrow. Got the site open in two tabs? They stay in sync.</p>
            <p>The catch is that it lives in <i>this</i> browser on <i>this</i> device. Switching computers, or about to clear your browser data? Use <b>Backup</b> in the top bar to save a small file, then <b>Load</b> on the other device to bring everything back.</p>
            <p>New game update and want a fresh start? <b>Reset all</b> wipes every station and your storage. If you only want to redo one station, open it and use <b>Reset station</b> instead. Both ask before they do anything.</p>
            ${tip('Save a backup before a big reset. It takes two seconds and you can always load it back.')}
          </section>

          <section class="guide__part guide__outro">
            <h2>${icon('check')}That's it</h2>
            <p>You are ready. Start with the generator, keep the Shopping List open after raids, and check Next Upgrades when you are not sure what to chase. Good luck out there.</p>
            <a class="btn btn--primary" href="#utility/generator">${icon('play')}<span>Go to the generator</span></a>
          </section>
        </div>
      </div>
    </section>`;
}
