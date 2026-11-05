// TurtleLab: an occasional fish. Every few minutes a little fish swims past above the trash can, and the shark peeks up over the
// rim and watches it go.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// It is only for fun. It never touches a project, stores nothing and fetches nothing (the art is drawn here, from simple shapes, and
// is TurtleLab's own). It stays away when the person asked their computer for calm (prefers-reduced-motion), while the tab is
// hidden, while the blocks are hidden, and while the shark is busy eating. The fish is on a layer that ignores clicks, so it
// can never get in the way. The timing and the path are small plain functions at the top, so they can be tested without a browser.

const NS = 'http://www.w3.org/2000/svg';

// The fish faces right. Its tail is its own group so the stylesheet can wag it.
const PICTURE = `
<svg xmlns="${NS}" class="fish-svg" viewBox="0 0 44 28" focusable="false">
  <g class="fish-tail"><path d="M10 14 L0 4 Q4 14 0 24 Z" fill="#e8641c"/></g>
  <path d="M15 6 Q22 -2 29 6 Z" fill="#e8641c"/>
  <ellipse cx="23" cy="14" rx="18" ry="10.5" fill="#ff8a3d"/>
  <path d="M8 17 Q23 28 38 17 Q23 22 8 17 Z" fill="#ffc58a"/>
  <path d="M26 4.5 Q22 14 26 23.5" stroke="#fff3e0" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <circle cx="33" cy="11.5" r="3.6" fill="#ffffff"/>
  <circle cx="34" cy="11.8" r="1.7" fill="#1d2630"/>
  <path d="M39 16.5 Q37.5 18 36 17.4" stroke="#8a3a10" stroke-width="1.1" fill="none" stroke-linecap="round"/>
</svg>`;

/** Milliseconds to wait before the first fish after the page opens, and between one fish and the next: [shortest, longest]. */
export const FIRST_FISH_MS = [30000, 90000];
export const NEXT_FISH_MS = [90000, 240000];
/** How long a fish takes to cross, and how soon to try again if it was not a good moment. */
export const SWIM_MS = 7000;
export const TRY_AGAIN_MS = 10000;
/** How close the fish gets before the shark looks up (pixels to the side of the can's middle). */
export const PEEK_DISTANCE = 190;

/** A number between `low` and `high` from random() (which gives 0 up to just under 1). */
export function between([low, high], random) {
  return low + random() * (high - low);
}

/** Is this a good moment for a fish? Not if calm was asked for, the tab is hidden, the blocks are hidden or the shark is busy. */
export function canSwim({ calm, visible, blocksHidden, sharkBusy }) {
  return !calm && visible && !blocksHidden && !sharkBusy;
}

/**
 * Where one swim goes, in pixels from the top left of the page the can sits in. The fish crosses the strip just above the can's
 * lid, going left to right or right to left (`direction` 1 or -1), starting and ending off the edge of the side.
 * @param {object} options
 * @param {number} options.canTop the top of the can's picture (the shark's room is above its lid)
 * @param {number} options.canHeight how tall the picture is
 * @param {() => number} options.random
 */
export function swimPath({ canTop, canHeight, random }) {
  const direction = random() < 0.5 ? 1 : -1;
  const y = Math.max(70, canTop + canHeight * between([0.08, 0.3], random));
  return { from: direction === 1 ? -70 : 230, to: direction === 1 ? 230 : -70, y, direction, bob: 5 + random() * 3, waves: 2 + Math.floor(random() * 3) };
}

/** Where the fish is `t` (0 to 1) of the way through its swim: along the path, bobbing a little up and down. */
export function fishAt(path, t) {
  return { x: path.from + (path.to - path.from) * t, y: path.y + Math.sin(t * path.waves * 2 * Math.PI) * path.bob, direction: path.direction };
}

/** Which way the shark's eyes look to follow a fish: x and y each from -1 (left, up) to 1 (right, down), from where the two are. */
export function gaze(fish, eyes) {
  const clamp = (n) => Math.max(-1, Math.min(1, n));
  return { x: clamp((fish.x - eyes.x) / 120), y: clamp((fish.y - eyes.y) / 60) };
}

/** Is the fish close enough for the shark to look up? */
export function isNear(fish, can) {
  return Math.abs(fish.x - can.x) < PEEK_DISTANCE;
}

export class Fish {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the page the can sits in
   * @param {import('./trash.js').Trash} options.trash the can with the shark (it is asked to peek and to look)
   * @param {Node} [options.before] the layer the fish goes under, the way the can does
   * The rest are for tests: `random`, `now`, `setTimer`, `clearTimer`, `nextFrame`, `calm`, `visible`.
   */
  constructor({ stage, trash, before = null, random = Math.random, now = () => performance.now(), setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (id) => clearTimeout(id), nextFrame = (fn) => requestAnimationFrame(fn),
    calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    visible = () => document.visibilityState !== 'hidden' }) {
    Object.assign(this, { stage, trash, before, random, now, setTimer, clearTimer, nextFrame, calm, visible });
    this.timer = null;
    this.el = null;
    this.stopped = false;
  }

  /** Begin: the first fish comes some time after the page opens (never, if calm was asked for). */
  start() {
    this.stopped = false;
    if (this.calm()) return;
    this.later(between(FIRST_FISH_MS, this.random));
  }

  /** Stop for good: no more fish, and the one swimming goes. */
  stop() {
    this.stopped = true;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    this.finish(false);
  }

  later(ms) {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      if (this.stopped) return;
      if (!this.swim()) this.later(TRY_AGAIN_MS);
    }, ms);
  }

  /**
   * Send a fish across now, if this is a good moment. Gives back false if it is not (and does nothing).
   * @returns {boolean}
   */
  swim() {
    const can = this.trash.el.getBoundingClientRect();
    const ok = canSwim({
      calm: this.calm(),
      visible: this.visible(),
      blocksHidden: this.stage.classList.contains('blocks-hidden') || (can.width === 0 && can.height === 0),
      sharkBusy: this.trash.el.classList.contains('hungry') || this.trash.el.classList.contains('eating'),
    });
    if (!ok || this.el) return false;

    const page = this.stage.getBoundingClientRect();
    const path = swimPath({ canTop: can.top - page.top, canHeight: can.height, random: this.random });
    this.el = document.createElement('div');
    this.el.className = 'fish';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = PICTURE;
    this.stage.insertBefore(this.el, this.before);
    const half = { x: this.el.offsetWidth / 2, y: this.el.offsetHeight / 2 };
    const canMiddle = { x: can.left - page.left + can.width / 2 };
    const eyes = { x: canMiddle.x, y: can.top - page.top + can.height * (116 / 224) }; // the shark's eyes, from its picture
    const started = this.now();

    const step = () => {
      if (!this.el) return;
      const t = (this.now() - started) / SWIM_MS;
      if (t >= 1) {
        this.finish(true);
        return;
      }
      const spot = fishAt(path, t);
      this.el.style.transform = `translate(${spot.x}px, ${spot.y}px) scaleX(${spot.direction})`;
      const middle = { x: spot.x + half.x, y: spot.y + half.y };
      this.trash.setPeek(isNear(middle, canMiddle));
      this.trash.look(gaze(middle, eyes));
      this.nextFrame(step);
    };
    this.el.style.transform = `translate(${path.from}px, ${path.y}px) scaleX(${path.direction})`;
    this.nextFrame(step);
    return true;
  }

  /** The fish has gone (or was sent away): take it off the page, let the shark go back down, and wait for the next one. */
  finish(again) {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    this.trash.setPeek(false);
    this.trash.look(null);
    if (again && !this.stopped) this.later(between(NEXT_FISH_MS, this.random));
  }
}
