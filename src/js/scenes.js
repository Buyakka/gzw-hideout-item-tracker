// =============================================================
// SCENES
// Animated room backgrounds. Each one is a [data-scene] element
// inside .bg-fx (see index.html). Only the open room's scene runs;
// the others are paused so no timers run off screen.
//
// To add a room: drop its image in src/assets, add a
// [data-scene="<room id>"] block in index.html, add the room id
// to the @each list in effects/_background.scss, and give it a
// controller below if it has motion.
// =============================================================
import '../vendor/lab-background/lab-background.js'; // sets window.LabBackground
import '../vendor/lab-background/lab-background.css';
import { WorkshopScene } from './workshop-scene.js';

const CONTROLLERS = {
  laboratory: (el) => new window.LabBackground(el, { paused: true }),
  workshop: (el) => new WorkshopScene(el, { paused: true }),
};

const scenes = new Map();

export function initScenes(bg) {
  bg.querySelectorAll('[data-scene]').forEach((el) => {
    const make = CONTROLLERS[el.dataset.scene];
    if (make && !scenes.has(el.dataset.scene)) scenes.set(el.dataset.scene, make(el));
  });
}

// Run the scene for this room, pause all the others
export function showScene(roomId) {
  scenes.forEach((scene, id) => scene.setPaused(id !== roomId));
}

// Dev server reloads: clean up so scenes are not mounted twice
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    scenes.forEach((scene) => scene.destroy());
    scenes.clear();
  });
}
