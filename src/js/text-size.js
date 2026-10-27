// =============================================================
// TEXT SIZE
// A / A+ / A++ button for people who want bigger text. It scales
// the root font size, so everything sized in rem grows with it.
// The choice is remembered in this browser (index.html applies it
// before the page paints, so there is no jump on load).
// =============================================================

const KEY = 'buyaka-gzw-hideout:text';

const SIZES = [
  { id: 'md', label: 'A', name: 'Normal' },
  { id: 'lg', label: 'A+', name: 'Large' },
  { id: 'xl', label: 'A++', name: 'Extra large' },
];

function current() {
  const id = document.documentElement.dataset.text;
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

// Update every text-size button on the page to show the current size
export function syncTextSizeButtons(root = document) {
  const now = current();
  const next = SIZES[(SIZES.indexOf(now) + 1) % SIZES.length];
  root.querySelectorAll('[data-action="text-size"]').forEach((btn) => {
    btn.querySelector('[data-text-label]').textContent = now.label;
    btn.setAttribute('aria-label', `Text size: ${now.name}. Change to ${next.name.toLowerCase()}`);
    btn.title = `Text size: ${now.name} (click for ${next.name.toLowerCase()})`;
  });
}

// Go to the next size: Normal -> Large -> Extra large -> Normal
export function cycleTextSize() {
  const next = SIZES[(SIZES.indexOf(current()) + 1) % SIZES.length];
  if (next.id === 'md') delete document.documentElement.dataset.text;
  else document.documentElement.dataset.text = next.id;
  try {
    if (next.id === 'md') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next.id);
  } catch {
    /* storage blocked: the size still changes for this visit */
  }
  syncTextSizeButtons();
  return next;
}
