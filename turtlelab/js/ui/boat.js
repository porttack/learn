// TurtleLab: a fishing boat. Every so often, a little boat sails in along the water above the trash can, stops, and tries to harpoon the shark.
// The harpoon clangs off the can, the shark pops up and snaps at the boat, and the boat sails away again.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// It is only for fun, like the fish (fish.js, which it is a cousin of): click the boat and the shark swims out and eats it. It never touches a project, stores nothing and fetches nothing,
// the art is drawn here from simple shapes and is TurtleLab's own, and it stays away when the computer asked for calm, while the tab is
// hidden, while the blocks are hidden, and while the shark is busy or a fish is swimming past. It floats in the layer above everything
// (sky.js); only the boat itself can be clicked, nothing else in the layer. Rarer than the fish, and longer.
//
// A scene is a fixed timeline (PHASES, in seconds). The boat's place and the harpoon's are plain functions of the time since it began, so they
// can be tested without a browser; the Boat class draws them every frame and tells the shark what to do at each moment.

import { sky } from './sky.js';
import { eatVisitor } from './visitors.js';

const NS = 'http://www.w3.org/2000/svg';

// A fishing boat facing left (its bow is on the left), with a fisherman at the bow, ready to throw. The shapes are drawn here.
const PICTURE = `
<svg xmlns="${NS}" class="boat-svg" viewBox="0 0 120 76" focusable="false">
  <path d="M6 66 q8 6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t12 0" stroke="#8fb6d9" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M8 42 L112 42 L98 63 Q60 71 24 63 Z" fill="#b5412f" stroke="#7a2a1d" stroke-width="2" stroke-linejoin="round"/>
  <path d="M10 48 L109 48" stroke="#f4efe6" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="62" y="20" width="30" height="22" rx="2" fill="#f4efe6" stroke="#8a8f96" stroke-width="2"/>
  <rect x="58" y="15" width="38" height="7" rx="2" fill="#b5412f" stroke="#7a2a1d" stroke-width="1.6"/>
  <rect x="68" y="26" width="9" height="9" rx="1.5" fill="#8fc3ea" stroke="#5d7f9b" stroke-width="1.4"/>
  <rect x="81" y="26" width="7" height="16" fill="#9a6b3a"/>
  <path d="M77 15 V2 L92 7 L77 11" fill="#e8a317" stroke="#a8730d" stroke-width="1.4" stroke-linejoin="round"/>
  <g class="fisherman">
    <rect x="23" y="26" width="13" height="17" rx="4" fill="#f2c200" stroke="#a68600" stroke-width="1.6"/>
    <circle cx="29.5" cy="21" r="6" fill="#f3c9a0" stroke="#a87d54" stroke-width="1.4"/>
    <path d="M22 19 Q29.5 9 37 19 Z" fill="#f2c200" stroke="#a68600" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M24 32 L14 28" stroke="#a68600" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="27" cy="21" r="0.9" fill="#222"/><path d="M26 24 Q29 26 32 24" stroke="#6b3f2a" stroke-width="1" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

// The harpoon: a spear that points right (the stylesheet draws nothing, the code moves and turns it), with a rope behind it.
const SPEAR = `
<g class="spear">
  <line x1="-26" y1="0" x2="10" y2="0" stroke="#7b5a2e" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M8 -5.5 L22 0 L8 5.5 L11 0 Z" fill="#b4bec8" stroke="#6d7782" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M-26 0 l-5 -4 M-26 0 l-5 4" stroke="#c0392b" stroke-width="2.6" stroke-linecap="round"/>
</g>`;

/** The scene, one part after another, in seconds. */
export const PHASES = [
  ['arrive', 4.5], // sails in from off the right edge and slows to a stop
  ['watch', 0.9], // sits there, bobbing, while the shark peeks up and looks at it
  ['throw', 0.5], // the harpoon flies at the shark
  ['stuck', 0.8], // it hits the can with a clang
  ['reel', 0.9], // the boat hauls it back in by its rope
  ['snap', 1.2], // the shark pops up and snaps at the boat
  ['leave', 3.5], // the boat sails off the way it came, faster
];
/** How long the whole scene takes, in seconds. */
export const TOTAL = PHASES.reduce((sum, [, seconds]) => sum + seconds, 0);

/** Milliseconds before the first boat after the page opens, and between one boat and the next: [shortest, longest]. Boats are rarer than fish. */
export const FIRST_BOAT_MS = [60000, 120000];
export const NEXT_BOAT_MS = [120000, 300000];
/** If it is not a good moment, look again after this long. */
export const TRY_AGAIN_MS = 15000;

/** A number between `low` and `high` from random() (0 up to just under 1). */
export function between([low, high], random) {
  return low + random() * (high - low);
}

/** Is this a good moment for a boat? Not if calm was asked for, the tab is hidden, the blocks are hidden or the shark is busy. */
export function canSail({ calm, visible, blocksHidden, sharkBusy }) {
  return !calm && visible && !blocksHidden && !sharkBusy;
}

/**
 * Which part of the scene it is `t` seconds in, and how far through that part (0 to 1). After the end it is 'done'.
 * @returns {{ name: string, u: number, start: number }}
 */
export function phaseAt(t) {
  let start = 0;
  for (const [name, seconds] of PHASES) {
    if (t < start + seconds) return { name, u: Math.max(0, (t - start) / seconds), start };
    start += seconds;
  }
  return { name: 'done', u: 1, start: TOTAL };
}

const easeOut = (u) => 1 - (1 - u) ** 3;
const easeIn = (u) => u ** 2;

/**
 * Where the middle of the boat is along the water `t` seconds in, and which way it faces (1: facing left, the way it sails in, -1: facing right,
 * sailing off). It slows to a stop in front of the shark, bobs there, then turns and speeds off the way it came.
 * @param {number} t
 * @param {{ from: number, stop: number }} course x to start from (off the right edge), and where it stops
 */
export function boatAt(t, { from, stop }) {
  const { name, u } = phaseAt(t);
  const bob = Math.sin(t * 2.4) * 2.2; // up and down a little, all the time
  if (name === 'arrive') return { x: from + (stop - from) * easeOut(u), bob, facing: 1 };
  if (name === 'leave') return { x: stop + (from - stop) * easeIn(u), bob, facing: -1 };
  if (name === 'done') return { x: from, bob: 0, facing: -1 };
  return { x: stop, bob, facing: name === 'snap' ? -1 : 1 }; // it spins round in fright when the shark snaps
}

/**
 * Where the harpoon is `t` seconds in: on the boat (not shown) until it is thrown, then flying in an arc to `target`, stuck there for a
 * moment, then hauled back to `hand`. `rope` is true while it is out (the rope runs from the hand to the spear). `angle` is the way it points, in degrees
 * (0 is to the right, 90 is down).
 * @param {number} t
 * @param {{ x: number, y: number }} hand where the fisherman holds it
 * @param {{ x: number, y: number }} target where it is thrown at
 * @param {number} [arc] how high it arches on the way (pixels)
 */
export function spearAt(t, hand, target, arc = 46) {
  const { name, u } = phaseAt(t);
  const fly = (p) => {
    const x = hand.x + (target.x - hand.x) * p;
    const y = hand.y + (target.y - hand.y) * p - Math.sin(Math.PI * p) * arc;
    const dx = target.x - hand.x;
    const dy = target.y - hand.y - Math.PI * Math.cos(Math.PI * p) * arc;
    return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  };
  if (name === 'throw') return { ...fly(easeOut(u)), visible: true, rope: true };
  if (name === 'stuck') return { ...fly(1), angle: fly(1).angle + Math.sin(u * 40) * 4 * (1 - u), visible: true, rope: true };
  if (name === 'reel') {
    const p = 1 - easeIn(u);
    const straight = Math.atan2(target.y - hand.y, target.x - hand.x);
    return { x: hand.x + (target.x - hand.x) * p, y: hand.y + (target.y - hand.y) * p, angle: (straight * 180) / Math.PI, visible: true, rope: true };
  }
  return { x: hand.x, y: hand.y, angle: 0, visible: false, rope: false };
}

export class Boat {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the page the can sits in
   * @param {import('./trash.js').Trash} options.trash the can with the shark (it is asked to peek, look, clang and snap)
   * @param {{ el: object | null }[]} [options.others] other things that need the shark (the fish): no boat while one of them is showing
   * @param {boolean} [options.auto] true (the way it began) for boats that come by themselves every few minutes; false for a boat that only sails when
   *        `sail()` is asked for (it is a reward for working: see reward.js)
   * The rest are for tests: `random`, `now`, `setTimer`, `clearTimer`, `nextFrame`, `calm`, `visible`, `windowSize`.
   */
  constructor({ stage, trash, others = [], auto = true, random = Math.random, now = () => performance.now(), setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (id) => clearTimeout(id), nextFrame = (fn) => requestAnimationFrame(fn),
    calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    visible = () => document.visibilityState !== 'hidden', windowSize = () => ({ w: window.innerWidth, h: window.innerHeight }) }) {
    Object.assign(this, { stage, trash, others, auto, random, now, setTimer, clearTimer, nextFrame, calm, visible, windowSize });
    this.timer = null;
    this.el = null; // the boat's picture, while there is a scene
    this.eaten = false; // clicked, and being eaten
    this.stopped = false;
  }

  /** Begin: the first boat comes some minutes after the page opens (never, if calm was asked for). */
  start() {
    this.stopped = false;
    if (!this.auto || this.calm()) return;
    this.later(between(FIRST_BOAT_MS, this.random));
  }

  /** Stop for good: no more boats, and the one sailing goes. */
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
      if (!this.sail()) this.later(TRY_AGAIN_MS);
    }, ms);
  }

  /**
   * Send a boat now, if this is a good moment. Gives back false if it is not (and does nothing).
   * @returns {boolean}
   */
  sail() {
    const can = this.trash.el.getBoundingClientRect();
    const ok = canSail({
      calm: this.calm(),
      visible: this.visible(),
      blocksHidden: this.stage.classList.contains('blocks-hidden') || (can.width === 0 && can.height === 0),
      sharkBusy: ['hungry', 'eating', 'spitting', 'peek', 'dreaming', 'hunting'].some((name) => this.trash.el.classList.contains(name)) || this.others.some((other) => other.el),
    });
    if (!ok || this.el) return false;

    const { w } = this.windowSize();
    const canMiddle = { x: can.left + can.width / 2 };
    const surface = can.top - 4; // the water, just above the can's lid and the shark's head
    const course = { from: w + 100, stop: Math.min(w - 110, canMiddle.x + 215) };
    const target = { x: can.left + can.width * 0.5, y: can.top + can.height * 0.52 }; // the lid and the top of the shark's head

    this.el = document.createElement('div');
    this.el.className = 'boat';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = PICTURE;
    // Click the boat and the shark eats it.
    this.el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.getEaten();
    });
    this.lines = document.createElementNS(NS, 'svg');
    this.lines.setAttribute('class', 'boat-lines');
    this.lines.innerHTML = `<line class="rope" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/>${SPEAR}`;
    this.rope = this.lines.querySelector('.rope');
    this.spear = this.lines.querySelector('.spear');
    this.spear.setAttribute('visibility', 'hidden');
    sky().append(this.el, this.lines);
    const size = { w: this.el.offsetWidth, h: this.el.offsetHeight };
    const started = this.now();
    let before = 'arrive';

    const step = () => {
      if (!this.el || this.eaten) return;
      const t = (this.now() - started) / 1000;
      const { name } = phaseAt(t);
      if (name === 'done') {
        this.finish(true);
        return;
      }
      const boat = boatAt(t, course);
      const left = boat.x - size.w / 2;
      const top = surface - size.h * 0.86 + boat.bob;
      this.el.style.transform = `translate(${left}px, ${top}px) scaleX(${boat.facing})`;
      // The fisherman stands at the bow, which is on the boat's left while it faces left.
      const hand = { x: boat.x - size.w * 0.4, y: top + size.h * 0.4 };
      const spear = spearAt(t, hand, target);
      this.spear.setAttribute('visibility', spear.visible ? 'visible' : 'hidden');
      this.rope.setAttribute('visibility', spear.rope ? 'visible' : 'hidden');
      if (spear.visible) {
        this.spear.setAttribute('transform', `translate(${spear.x.toFixed(1)} ${spear.y.toFixed(1)}) rotate(${spear.angle.toFixed(1)})`);
        const tail = { x: spear.x - Math.cos((spear.angle * Math.PI) / 180) * 31, y: spear.y - Math.sin((spear.angle * Math.PI) / 180) * 31 };
        this.rope.setAttribute('x1', hand.x.toFixed(1));
        this.rope.setAttribute('y1', hand.y.toFixed(1));
        this.rope.setAttribute('x2', tail.x.toFixed(1));
        this.rope.setAttribute('y2', tail.y.toFixed(1));
      }
      // The shark's part: it looks up when the boat comes near, jumps at the clang, and snaps when the harpoon comes back.
      const eyes = { x: Math.max(-1, Math.min(1, (boat.x - canMiddle.x) / 160)), y: -0.6 };
      if (name !== 'arrive' && name !== 'leave' && name !== 'snap') {
        this.trash.setPeek(true);
        this.trash.look(eyes);
      }
      if (name !== before) {
        if (name === 'stuck') this.trash.clang();
        if (name === 'snap') {
          this.trash.setPeek(false);
          this.trash.look(null);
          this.trash.snap();
        }
        before = name;
      }
      this.nextFrame(step);
    };
    step();
    return true;
  }

  /**
   * The boat was clicked: it stops where it is (the harpoon and rope go), and the shark swims out of the can to eat it (see visitors.js). Once the shark
   * is home the boat is gone and the next is waited for.
   */
  getEaten() {
    if (!this.el || this.eaten) return;
    this.eaten = true;
    this.lines?.remove();
    eatVisitor({ el: this.el, trash: this.trash, setTimer: this.setTimer, onDone: () => this.finish(true) });
  }

  /** The boat has gone (or was sent away): take it off the page, let the shark settle, and wait for the next one. */
  finish(again) {
    if (!this.el) return;
    this.el.remove();
    this.lines?.remove();
    this.el = null;
    this.lines = null;
    this.eaten = false;
    this.trash.setPeek(false);
    this.trash.look(null);
    if (again && this.auto && !this.stopped) this.later(between(NEXT_BOAT_MS, this.random));
  }
}
