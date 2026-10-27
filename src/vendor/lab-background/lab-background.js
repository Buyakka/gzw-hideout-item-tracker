(function (global) {
  "use strict";
  let instanceCount = 0;
  class LabBackground {
    constructor(root, options = {}) {
      if (!root || !root.classList.contains("lab-background")) throw new TypeError("Pass an element with class lab-background.");
      if (root.querySelector(".lab-background__effects")) throw new Error("Already mounted. Call destroy() before remounting.");
      this.root = root;
      this.image = root.querySelector(".lab-background__image");
      if (!this.image) throw new Error("Include the static image inside the background first.");
      this.media = global.matchMedia("(prefers-reduced-motion: reduce)");
      this.paused = Boolean(options.paused);
      this.destroyed = false;
      this.timer = null;
      this.running = false;
      this.features = { fan: true, smoke: true, fridge: true, ...options.features };
      const prefix = `lab-${++instanceCount}`;
      const markup = `<svg class="lab-background__effects" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${prefix}-blade" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1.3"/></filter>
          <filter id="${prefix}-smoke" filterUnits="userSpaceOnUse" x="-60" y="-240" width="120" height="250"><feGaussianBlur stdDeviation=".85"/></filter>
          <filter id="${prefix}-edge" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
          <linearGradient id="${prefix}-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-155"><stop offset="0" stop-color="#e8e5da" stop-opacity=".9"/><stop offset=".28" stop-color="#deded7"/><stop offset=".65" stop-color="#d2d4d0" stop-opacity=".65"/><stop offset="1" stop-color="#d2d4d0" stop-opacity="0"/></linearGradient>
          <clipPath id="${prefix}-fan"><ellipse cx="484" cy="117" rx="36" ry="43"/></clipPath>
        </defs>
        <g class="lab-background__fan" clip-path="url(#${prefix}-fan)">
          <g transform="translate(484 117) rotate(8) scale(.81 1)">
            <g class="lab-background__rotor" fill="#090906" opacity=".55" filter="url(#${prefix}-blade)">
              <path d="M-4,-5 C-30,-21 -23,-46 -10,-40 C4,-36 14,-18 5,-4Z"/>
              <path d="M-4,-5 C-30,-21 -23,-46 -10,-40 C4,-36 14,-18 5,-4Z" transform="rotate(120)"/>
              <path d="M-4,-5 C-30,-21 -23,-46 -10,-40 C4,-36 14,-18 5,-4Z" transform="rotate(240)"/>
            </g>
          </g>
          <g transform="translate(484 117) scale(.81 1)" fill="none" stroke="#928061" stroke-opacity=".14" stroke-width=".65">
            <circle r="16"/><circle r="23"/><circle r="30"/><circle r="38"/>
            <path d="M-39,0 H39 M0,-42 V42 M-28,-28 L28,28 M-28,28 L28,-28"/>
          </g>
          <ellipse cx="484" cy="117" rx="7" ry="9" fill="#433724"/><ellipse cx="483" cy="116" rx="3" ry="4" fill="#756143" opacity=".5"/>
        </g>
        <g class="lab-background__smoke" transform="translate(791 646)" stroke-linecap="round">
          <path d="M0,1 L16,-3" stroke="#211b15" stroke-width="3.7"/>
          <path d="M0,0 L16,-4" stroke="#c9c2ac" stroke-width="2.1"/>
          <path d="M12,-3 L16,-4" stroke="#96704b" stroke-width="2.2"/>
          <path d="M0,0 L2,-.5" stroke="#806c61" stroke-width="2.2"/>
          <circle r=".7" fill="#b97138"/>
        </g>
        <g class="lab-background__smoke" transform="translate(791 646)" fill="none" stroke="url(#${prefix}-fade)" stroke-linecap="round" filter="url(#${prefix}-smoke)">
          <path class="lab-background__smoke-thread" stroke-width="1.8" d="M0,0 C-2,-9 3,-18 1,-29 S-7,-46 -2,-61 S8,-80 1,-98 S-11,-122 -2,-151"/>
          <path class="lab-background__wisp" stroke-width="4" d="M1,-15 C-5,-29 8,-39 2,-54 S-14,-72 -5,-92 S11,-119 0,-145"/>
          <path class="lab-background__wisp lab-background__wisp--second" stroke-width="5.5" d="M0,-20 C7,-34 -5,-45 1,-61 S17,-80 5,-101 S-8,-125 4,-151"/>
          <path class="lab-background__wisp lab-background__wisp--third" stroke-width="4.5" d="M0,-18 C-3,-35 10,-46 4,-65 S-10,-87 -1,-107 S11,-130 2,-155"/>
        </g>
        <g class="lab-background__fridge" fill="#030c11">
          <path d="M1443,353 L1645,363 L1635,648 L1439,614Z" filter="url(#${prefix}-edge)"/>
          <path d="M1544,355 L1632,357 L1633,365 L1544,362Z" fill="#061217"/>
          <path d="M1431,715 L1555,744 L1625,842 L1529,880 L1432,827Z" opacity=".15" filter="url(#${prefix}-edge)"/>
        </g>
      </svg>`;
      root.insertAdjacentHTML("beforeend", markup);
      this.effects = root.querySelector(".lab-background__effects");
      this.fridge = root.querySelector(".lab-background__fridge");
      this.sync = this.sync.bind(this);
      this.media.addEventListener("change", this.sync);
      document.addEventListener("visibilitychange", this.sync);
      this.image.addEventListener("load", this.sync);
      this.image.addEventListener("error", this.sync);
      this.setFit(options.fit || root.dataset.fit || "contain");
      for (const feature of ["fan", "smoke", "fridge"]) root.dataset[feature] = String(Boolean(this.features[feature]));
      this.sync();
    }
    sync() {
      if (this.destroyed) return;
      global.clearTimeout(this.timer);
      this.timer = null;
      this.fridge.style.opacity = "0";
      this.running = !this.paused && !this.media.matches && !document.hidden && this.image.complete && this.image.naturalWidth > 0;
      this.root.dataset.running = String(this.running);
      this.root.dataset.reducedMotion = String(this.media.matches);
      if (this.running && this.features.fridge) this.scheduleFlicker();
      this.root.dispatchEvent(new CustomEvent("labstatechange", { detail: this.getState() }));
    }
    scheduleFlicker() {
      this.timer = global.setTimeout(() => {
        this.flickerPulse(Math.random() < .55 ? 2 : 1);
      }, 1200 + Math.random() * 3600);
    }
    flickerPulse(remaining) {
      if (this.destroyed || !this.running || !this.features.fridge) return;
      this.fridge.style.opacity = String(.34 + Math.random() * .22);
      this.timer = global.setTimeout(() => {
        this.fridge.style.opacity = "0";
        if (remaining > 1) {
          this.timer = global.setTimeout(() => this.flickerPulse(remaining - 1), 180 + Math.random() * 140);
        } else {
          this.scheduleFlicker();
        }
      }, 140 + Math.random() * 100);
    }
    setPaused(paused) {
      if (this.destroyed) return;
      this.paused = Boolean(paused);
      this.sync();
    }
    setFeature(feature, enabled) {
      if (!["fan", "smoke", "fridge"].includes(feature)) throw new TypeError("Unknown effect.");
      if (this.destroyed) return;
      this.features[feature] = Boolean(enabled);
      this.root.dataset[feature] = String(Boolean(enabled));
      this.sync();
    }
    setFit(fit) {
      if (!["contain", "cover"].includes(fit)) throw new TypeError("Fit must be contain or cover.");
      if (this.destroyed) return;
      this.root.dataset.fit = fit;
      this.effects.setAttribute("preserveAspectRatio", fit === "cover" ? "xMidYMid slice" : "xMidYMid meet");
    }
    getState() {
      return { running: this.running, paused: this.paused, reducedMotion: this.media.matches, features: { ...this.features }, fit: this.root.dataset.fit, destroyed: this.destroyed };
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.running = false;
      global.clearTimeout(this.timer);
      this.timer = null;
      this.media.removeEventListener("change", this.sync);
      document.removeEventListener("visibilitychange", this.sync);
      this.image.removeEventListener("load", this.sync);
      this.image.removeEventListener("error", this.sync);
      this.effects.remove();
      this.root.dataset.running = "false";
    }
  }
  global.LabBackground = LabBackground;
})(window);
