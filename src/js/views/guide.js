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
  header: [2049, 206],
  room: [2049, 1152],
  maxed: [494, 339],
  panel: [959, 1350],
  item: [845, 291],
  'panel-foot': [905, 324],
  confirm: [750, 543],
  shopping: [1995, 730],
  'shopping-next': [1983, 750],
  'shopping-sell': [1983, 611],
  'phone-card': [561, 363],
  power: [1053, 209],
  'power-gen': [911, 663],
  saving: [731, 180],
  'reset-all': [750, 540],
  undo: [905, 252],
  next: [2049, 1152],
  find: [1022, 1044],
  disassembly: [2049, 1152],
};

// Numbered list under a screenshot. Number 1 matches the pink
// badge 1 on the picture, and so on.
const marks = (items) => `
  <ol class="guide__marks" aria-label="What the numbers on the picture point to">
    ${items.map((text, i) => `<li><span class="guide__mark-n" aria-hidden="true">${i + 1}</span><span><span class="sr-only">Number ${i + 1}: </span>${text}</span></li>`).join('')}
  </ol>`;

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
  ['sell', 'Selling extras'],
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
            <p>Every picture below has <b>pink numbers</b> pointing at the buttons that matter. The list under each picture tells you what each number does, so you always know where to click.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="start">
            <h2>${icon('play')}The first screen</h2>
            <p>This is where you land. Pick a room on the left, or hit the big yellow button. On your very first visit it says <b>Start</b> and takes you to the generator, because that is where every hideout begins. After that it turns into <b>Continue</b> and drops you back in the last room you had open.</p>
            ${shot('home', 'The landing page with the room list, the yellow Continue button and the tools menu', 'Rooms on the left, tools on the right, and your overall progress at the bottom.')}
            ${marks([
              '<b>The rooms.</b> Click one to open it. A green check means every station in it is maxed.',
              '<b>Start / Continue.</b> The quickest way in. Takes you to the generator first, then back to your last room.',
              '<b>Tools.</b> The Shopping List, Next Upgrades, Disassembly, Find an item and this guide.',
              '<b>Text size.</b> Tap it to switch between normal, bigger and biggest.',
            ])}
          </section>

          <section class="guide__part" tabindex="-1" id="getting-around">
            <h2>${icon('arrow')}Getting around</h2>
            <p>Once you are inside, the bar at the top stays with you on every page. It is your scoreboard.</p>
            ${shot('header', 'The top bar showing levels built, items found, cash left and free power, plus five small buttons', 'Your four main numbers, always in view.')}
            ${marks([
              '<b>Your numbers.</b> Levels built, items found, cash the remaining levels cost, and free power (how much kW your generator has to spare).',
              '<b>Text size.</b> Makes all the text bigger or smaller.',
              '<b>Find an item.</b> Search any item by name. The <kbd>/</kbd> key does the same.',
              '<b>Backup.</b> Saves your progress to a small file.',
              '<b>Load.</b> Brings a backup file back in.',
              '<b>Reset all.</b> Starts every station over. It always asks first.',
            ])}
            <p>Under the bar you get the room tabs and the tool pages. A green check next to a room means every station in it is maxed.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="rooms">
            <h2>${icon('box')}Rooms and stations</h2>
            <p>Each room shows its stations as cards. A card tells you a lot at a glance, so it is worth learning how to read one.</p>
            ${shot('room', 'The Laboratory room with eight station cards in a grid', 'The Laboratory. Yellow cards are ready to start, grey ones are waiting on something.')}
            ${marks([
              '<b>Room tabs.</b> Jump between rooms and tool pages from anywhere.',
              '<b>Status line.</b> What the next level needs, or what is blocking it.',
              '<b>Level bars.</b> One bar per level. Filled bars are built.',
            ])}
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
            ${marks([
              '<b>Level tabs.</b> Click one to see that level. Green check means built.',
              '<b>The facts.</b> Cost, what it needs, what it gives and the power it uses.',
              '<b>What is blocking it.</b> Only shows up when something is missing, and says how to fix it.',
              '<b>The items.</b> One row for each item this level needs. More on that below.',
            ])}
            <p>Right under the name you get the facts for that level: what it costs, what it needs, what it gives you and how much power it uses. If something is missing, a yellow box spells it out in plain words, like <i>Build Ventilation System to get more.</i> No guessing.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="items">
            <h2>${icon('fill')}Adding your items</h2>
            <p>Here is the one idea that makes everything click. Your <b>storage</b> is shared. If you own 12 Steel, that is 12 Steel for the whole hideout, not 12 for every station.</p>
            <p>So when you want to use some for a level, you <b>set it aside</b> for that level. Whatever is not set aside yet shows as <b>available</b>.</p>
            ${shot('item', 'One item row: Steel, 4 of 4 set aside, 12 in storage, 8 available', 'Four Steel set aside for this level. Twelve in storage, so eight are still free for other stations.')}
            ${marks([
              '<b>Set aside.</b> Press <b>+</b> to set one more aside. If none are available, the site figures you just found one and adds it to your storage too. Press <b>−</b> to put one back in storage. Prefer typing? Click the number, type it and press Enter.',
              '<b>Storage.</b> Click this number to fix how many you own in total.',
              '<b>Recipe amount.</b> The pencil next to <b>/ 4</b> changes how many the level needs, in case the game shows a different number after an update.',
            ])}
            ${tip('<b>Also needed by</b> shows which other stations want the same item. Handy before you spend your last few.')}
          </section>

          <section class="guide__part" tabindex="-1" id="building">
            <h2>${icon('check')}Building a level</h2>
            <p>The buttons at the bottom of the panel never scroll away, so they are always one click from where you are.</p>
            ${shot('panel-foot', 'The bottom buttons: Have all, Clear, Reset station and Mark L2 built', 'Everything you need to finish a level.')}
            ${marks([
              '<b>Have all.</b> Sets aside everything this level needs, as far as your storage allows. If you are short on something, it tells you what.',
              '<b>Clear.</b> Puts this level\'s items back into storage.',
              '<b>Reset station.</b> Shows up once a station has any progress. Starts this one station over and leaves the rest alone.',
              '<b>Mark built.</b> The big one. Press it after you build the level in game. The items you set aside get used up, just like in the game.',
            ])}
            <p>Clicked <b>Mark built</b> by accident? No problem. Click the level tab you just built and an <b>Undo build</b> button shows up at the bottom.</p>
            ${shot('undo', 'The bottom of a station panel with the Undo build button marked', 'Undo build only shows on the level you built last.')}
            ${marks(['<b>Undo build.</b> Takes the level back to not built and returns its items to what you set aside.'])}
            <p>Anything that erases progress asks first. <b>No, keep it</b> is selected by default, and Esc also counts as no, so a stray Enter will never wipe your work.</p>
            ${shot('confirm', 'A warning box asking Reset Heat Source? with No, keep it and Yes, reset station buttons', 'You always get a second chance before a reset.', 'small')}
            ${marks([
              '<b>No, keep it.</b> Selected by default. Nothing changes.',
              '<b>Yes.</b> Goes ahead with the reset.',
            ])}
          </section>

          <section class="guide__part" tabindex="-1" id="shopping">
            <h2>${icon('list')}The Shopping List</h2>
            <p>This is the page most players live on. Every item in the hideout, in A to Z order, with all your numbers in one place.</p>
            ${shot('shopping', 'The Shopping List with a search box, filter buttons and three item rows', 'Search, filters and the full item list.', 'wide')}
            ${marks([
              '<b>Search.</b> Type part of a name to find an item fast.',
              '<b>Next upgrades</b> (yellow). Shows only what the levels you can work on now need.',
              '<b>Safe to sell</b> (green). Shows only the extras you can sell.',
              '<b>Hide done</b> (blue). Hides items you already have enough of.',
              '<b>Item types.</b> Construction, Electronics, Mechanical and so on. <b>All</b> shows everything.',
              '<b>Have.</b> How many you own. Change it with − and + or type a number.',
              '<b>Used by.</b> Which stations want this item, and how many each level takes. Click a tag to open that station.',
            ])}
            <p>Here is what each column means:</p>
            <dl class="guide__terms">
              <div><dt>Total</dt><dd>How many the whole hideout needs, all levels together.</dd></div>
              <div><dt>Used</dt><dd>How many your built levels already used up.</dd></div>
              <div><dt>Still need</dt><dd>What is left for levels you have not built yet.</dd></div>
              <div><dt>Have</dt><dd>What you own right now. Change it with − and + or type a number.</dd></div>
              <div><dt>Left</dt><dd>What you still have to find. A check means you have enough.</dd></div>
            </dl>
            <p>Coming back from a raid with a full bag? This is the fastest place to log it. Find the item, type what you have, done. The rows never move while you click, so you will not hit the wrong one.</p>
            <p>The three push buttons (2, 3 and 4) work like real latching buttons. Press one and it lights up in its color and sinks in, so you always know a filter is on. Press it again and it pops back out. The number on a button tells you how many items it will show before you press it. The yellow and green ones get their own sections below.</p>
            <p>Search, the push buttons and the item types all work together. In the <b>Used by</b> tags, levels you already built stay in green, so you never lose track of where your Steel went.</p>
            ${tip('On a phone each item turns into its own card. Same numbers, same buttons, just stacked so they fit.')}
            ${shot('phone-card', 'One Shopping List item shown as a card on a phone', 'A Shopping List item on a phone.', 'small')}
            ${marks(['<b>Have.</b> Same − and + buttons as on a computer, sized for your thumb.'])}
          </section>

          <section class="guide__part" tabindex="-1" id="next">
            <h2>${icon('arrow')}What to farm next</h2>
            <p>The full list is long, and early on most of it does not matter yet. Push the yellow <b>Next upgrades</b> button and the list shrinks to just the items for levels you can build or start today. The number on the button tells you how many items that is before you even press it.</p>
            ${shot('shopping-next', 'The Shopping List with the yellow Next upgrades button pushed in, showing Next: 1 under each item and highlighted level tags', 'Only what matters right now. The highlighted tags are the levels you can work on.', 'wide')}
            ${marks([
              '<b>Next upgrades, pushed in.</b> Lit up yellow means the filter is on. Press it again to see everything.',
              '<b>Next.</b> How many of this item the levels you can work on now need in total. The short version of your shopping trip.',
              '<b>Highlighted level.</b> A solid yellow tag is a level you can work on right now.',
            ])}
            <p>Want the same thing grouped by station instead? The <b>Next Upgrades</b> page lists every level you can work on right now. Levels with all their items ready sit at the top, and the rest are sorted by how close they are.</p>
            ${shot('next', 'The Next Upgrades page listing unlocked levels with how many items each has left', 'Every unlocked level, closest to done first.')}
            ${marks([
              '<b>A level you can work on.</b> Click it to open that station.',
              '<b>Items left.</b> How many items this level still needs.',
            ])}
          </section>

          <section class="guide__part" tabindex="-1" id="sell">
            <h2>${icon('check')}Selling extras</h2>
            <p>Stash getting crowded? The green <b>Safe to sell</b> button shows every item you have more of than the hideout will ever need, and exactly how many you can let go.</p>
            ${shot('shopping-sell', 'The Shopping List with the green Safe to sell button pushed in, showing one short row per item: total, used, still need, have, how many to sell, and a Mark as sold button', 'Steel: 100 in storage, 86 still needed, so 14 can go.', 'wide')}
            ${marks([
              '<b>Safe to sell, pushed in.</b> Lit up green means you are looking at extras only. The number on it says how many items have extras.',
              '<b>Sell.</b> How many of this item you can sell. Big and green so you cannot miss it.',
              '<b>Mark as sold.</b> Press it after you sell them in game.',
            ])}
            <p>This view is kept short on purpose. You get just the numbers that matter for selling: <b>Total</b>, <b>Used</b>, <b>Still need</b>, what you <b>Have</b> and how many to <b>Sell</b>. The station tags and the − / + buttons are hidden here, and the rows take turns light and dark so your eye stays on the right line. On a computer the list sits in the middle of the page, so the item name and its button are close together.</p>
            <p>The math is simple. We take what you have, subtract what every station you have not built yet still needs, and whatever is left over shows as <b>Sell</b>. An item only shows up here once every level that uses it is covered, across all three rooms. If even one level still wants it, it stays off the list.</p>
            <p>Sold it in game? Hit <b>Mark as sold</b>. Your storage drops to exactly what the hideout still needs, a short message confirms it, and the item leaves the list. No retyping. Sold only part of it? Pop the green button back out and type the new amount in <b>Have</b>.</p>
            ${tip('This only counts the hideout. If you also need an item for something else in the game, hold on to it.')}
            <p>The yellow and green buttons pop each other out, since one means "I still need this" and the other means "I don't". <b>Hide done</b> works with either.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="find">
            <h2>${icon('search')}Find an item</h2>
            <p>Picked something up and not sure if it is worth keeping? Press <kbd>/</kbd> on any page, or use the search button, and type its name.</p>
            ${shot('find', 'The Find an item box showing results for steel: still need 86, in storage 12, left 74', 'Your numbers for that item, plus every station that wants it.', 'small')}
            ${marks([
              '<b>Type here.</b> Part of a name is enough.',
              '<b>Your numbers.</b> Still need, in storage, and how many are left to find.',
              '<b>Who wants it.</b> Every station and level that uses this item. Click one to open it.',
            ])}
            <p>You will see how many you still need, how many you have and which stations use it. Got more than the hideout needs? It says so in green, with how many are safe to sell. If you can get the item by breaking something down, that shows up here too. Press Esc to close it.</p>
          </section>

          <section class="guide__part" tabindex="-1" id="disassembly">
            <h2>${icon('split')}Disassembly</h2>
            <p>Some parts are easier to get by taking other things apart. This page lists what you can break down and what comes out. Use the search box to check a specific item.</p>
            ${shot('disassembly', 'The Disassembly page with a list of devices and the parts they break into', 'What breaks down into what.')}
            ${marks([
              '<b>Search.</b> Type a device or a part to find it.',
              '<b>One recipe.</b> The device on the left, how long it takes, and the parts you get on the right.',
            ])}
          </section>

          <section class="guide__part" tabindex="-1" id="power">
            <h2>${icon('bolt')}Power</h2>
            <p>Most stations need electricity, and it all comes from the generator in the Utility Room. That is why the site sends new players there first.</p>
            <p>Every generator level adds kW. Every station level that needs power uses some of it up for good, just like the game does.</p>
            ${shot('power', 'The top bar with the Free power box marked', 'Your free power, always at the top of the page.')}
            ${marks(['<b>Free power.</b> How much kW you have left to spare. The small number after the slash is your total. Click the box to open the generator.'])}
            <p>Want to see where the kW come from? Open the <b>Generator</b> in the Utility Room. Each level shows how much power it adds.</p>
            ${shot('power-gen', 'The Generator panel, level 1, with the Gives and Power boxes marked', 'Generator level 1 adds 9 kW.')}
            ${marks([
              '<b>Gives.</b> What this level adds. For the generator, that is kW.',
              '<b>Power.</b> A plus means the level adds power. On other stations it shows how much the level uses up.',
            ])}
            ${tip('If a level needs more power than you have free, its panel tells you in a yellow box to build or upgrade the generator first.')}
          </section>

          <section class="guide__part" tabindex="-1" id="saving">
            <h2>${icon('download')}Saving and starting over</h2>
            <p>There is nothing to save by hand. Every click is stored in your browser right away, and it is still there tomorrow. Got the site open in two tabs? They stay in sync.</p>
            <p>The catch is that it lives in <i>this</i> browser on <i>this</i> device. Switching computers, or about to clear your browser data? Make a backup. All three buttons sit at the top right of every page.</p>
            ${shot('saving', 'The top right buttons with Backup, Load and Reset all marked', 'Backup, Load and Reset all, top right.')}
            ${marks([
              '<b>Backup.</b> Saves a small file with all your progress to your Downloads folder.',
              '<b>Load.</b> Pick a backup file and everything comes back, just as it was.',
              '<b>Reset all.</b> Wipes every station and your storage for a fresh start.',
            ])}
            <p>To move to another computer, step by step:</p>
            <ol class="guide__steps">
              <li>On the old computer, press <b>Backup</b> (1). A file named like <b>buyaka-hideout-backup-2026-10-28.json</b> lands in your Downloads.</li>
              <li>Send that file to the new computer, for example by email or a USB stick.</li>
              <li>On the new computer, open the site and press <b>Load</b> (2).</li>
              <li>Pick the file. Done, your progress is back.</li>
            </ol>
            <p>New game update and want a fresh start? Press <b>Reset all</b> (3). A box pops up and asks first.</p>
            ${shot('reset-all', 'The Reset all progress box with No, keep it and Yes, reset all marked', 'Reset all always asks before it does anything.', 'small')}
            ${marks([
              '<b>No, keep it.</b> Selected by default. Nothing changes. Esc does the same.',
              '<b>Yes, reset all.</b> Wipes everything. This cannot be undone.',
            ])}
            <p>Only want to redo one station? Open it and use <b>Reset station</b> at the bottom of its panel instead (see <a href="#guide" data-action="guide-jump" data-jump="building">Building a level</a>). The rest of your hideout stays as it is.</p>
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
