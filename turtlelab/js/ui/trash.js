// TurtleLab: the trash can, and the shark in it.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Deleting a block is dragging it to the left side of the page. A trash can sits
// at the bottom of that side so you can see where things go. While a block is
// held over the side, the lid flips off and a shark pops up with its jaw open.
// Let go, and the block shrinks into its mouth, the shark chomps, and it sinks
// back down. The art is drawn here, from simple shapes, and is all TurtleLab's own.
//
// The picture is one inline SVG, and a class on the wrapper decides which state it
// is in (the stylesheet does the moving):
//   hungry   a block is being held over the left side: the shark is up, mouth open
//   eating   a block was just dropped: the shark stays up and chews, then sinks
// Nothing here changes a project. The workspace deletes the blocks; this only plays.

const NS = 'http://www.w3.org/2000/svg';

// The shark's head is drawn at its full height; it sits behind the can, and sinking
// down behind the can's front is what hides it. The clip keeps its sides tidy.
const PICTURE = `
<svg xmlns="${NS}" class="trash-svg" viewBox="0 -66 140 224" focusable="false">
  <defs>
    <clipPath id="trash-clip"><rect x="0" y="-66" width="140" height="148"/></clipPath>
  </defs>
  <ellipse cx="70" cy="77" rx="44" ry="8" fill="#39424a"/>
  <g clip-path="url(#trash-clip)">
    <g class="shark">
      <path d="M58 26 L70 -10 L86 26 Z" fill="#4b6c89"/>
      <path d="M26 86 C26 38 46 24 70 24 C94 24 114 38 114 86 Z" fill="#7096b6"/>
      <path d="M30 70 H110 V92 C100 100 40 100 30 92 Z" fill="#8b2433"/>
      <circle cx="51" cy="48" r="8.5" fill="#ffffff"/>
      <circle cx="89" cy="48" r="8.5" fill="#ffffff"/>
      <circle class="pupil" cx="53" cy="49" r="3.8" fill="#1d2630"/>
      <circle class="pupil" cx="87" cy="49" r="3.8" fill="#1d2630"/>
      <path d="M41 38 L60 43 M99 38 L80 43" stroke="#33506b" stroke-width="3.5" stroke-linecap="round"/>
      <path class="teeth-top" d="M38 64 L45 76 L52 64 L59 76 L66 64 L73 76 L80 64 L87 76 L94 64 L101 76 L108 64 Z" fill="#ffffff"/>
      <g class="jaw">
        <path d="M28 76 C34 112 106 112 112 76 Z" fill="#5a7c9b"/>
        <path d="M41 78 L48 66 L55 78 L62 66 L69 78 L76 66 L83 78 L90 66 L97 78 L104 66 L108 78 Z" fill="#ffffff"/>
      </g>
      <ellipse class="mouth" cx="70" cy="80" rx="12" ry="8" fill="none"/>
    </g>
  </g>
  <path d="M33 78 H107 L99 154 H41 Z" fill="#a9b2ba" stroke="#78838c" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M52 86 L55 148 M70 86 V148 M88 86 L85 148" stroke="#8a949d" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="27" y="72" width="86" height="10" rx="5" fill="#c6cdd3" stroke="#78838c" stroke-width="2.5"/>
  <g class="lid">
    <rect x="24" y="60" width="92" height="13" rx="6" fill="#8e99a2" stroke="#68727a" stroke-width="2.5"/>
    <rect x="60" y="51" width="20" height="10" rx="4" fill="#68727a"/>
  </g>
</svg>`;

/** How long a dropped block takes to reach the shark, and how long the chewing lasts after that. */
const ARRIVE_MS = 340;
const CHEW_MS = 800;

/** How often a shark that has eaten a block burps a bubble, and how long the bubble floats. */
export const BURP_CHANCE = 0.3;
const BURP_MS = 1700;

/** How far the shark's mouth moves between sunk down and up, in the picture's own units (its translateY, 84 and -40, in trash.css). */
const SHARK_RISE = 124;
const PICTURE_WIDTH = 140;

const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Does a shark that has just eaten burp this time? Never when the computer asked for calm. */
export function shouldBurp(random, chance = BURP_CHANCE, quiet = false) {
  return !quiet && random() < chance;
}

export class Trash {
  /**
   * @param {HTMLElement} stage the page the can sits in, at the bottom of the left side
   * @param {Node} [before] the blocks' layer: the can goes just under it, so a stack being
   *        carried over the can is drawn on top of the shark until it is let go
   */
  constructor(stage, before = null, { burpChance = BURP_CHANCE, random = Math.random } = {}) {
    this.burpChance = burpChance;
    this.random = random;
    this.el = document.createElement('div');
    this.el.className = 'trash-can';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = PICTURE;
    this.mouth = this.el.querySelector('.mouth');
    this.timers = [];
    stage.insertBefore(this.el, before);
  }

  /** The shark comes up with its mouth open (a block is held over the left side), or goes back down. */
  setHungry(hungry) {
    this.el.classList.toggle('hungry', hungry);
  }

  /** The shark looks up over the rim (a fish is swimming by), or goes back down. Being hungry or eating wins over this. */
  setPeek(peeking) {
    this.el.classList.toggle('peek', peeking);
  }

  /** Where the shark's eyes look: { x, y }, each from -1 (left, up) to 1 (right, down), or null to look straight ahead. */
  look(at) {
    if (!at) {
      this.el.style.removeProperty('--look-x');
      this.el.style.removeProperty('--look-y');
      return;
    }
    this.el.style.setProperty('--look-x', `${(at.x * 2.8).toFixed(2)}px`);
    this.el.style.setProperty('--look-y', `${(at.y * 2).toFixed(2)}px`);
  }

  /**
   * Where the shark's mouth is on the screen, as { x, y }, or null if the can is not showing. With `raised`, where it is once the shark
   * is up (which is where things are spat from), even if it is still sunk down now.
   */
  mouthPoint({ raised = false } = {}) {
    const box = this.mouth.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) return null;
    const up = ['hungry', 'eating', 'spitting'].some((name) => this.el.classList.contains(name));
    const lift = raised && !up ? SHARK_RISE * (this.el.getBoundingClientRect().width / PICTURE_WIDTH) : 0;
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 - lift };
  }

  /**
   * A block has been dropped on the left side. The shark stays up while it flies in,
   * chomps, and then sinks back down. Feeding it again while it chews starts over.
   */
  feed() {
    for (const id of this.timers) clearTimeout(id);
    this.el.classList.remove('chomp');
    this.el.classList.add('eating');
    this.timers = [
      setTimeout(() => this.el.classList.add('chomp'), ARRIVE_MS),
      setTimeout(() => this.burp(), ARRIVE_MS + CHEW_MS - 420), // while it is still up, after the last big bite
      setTimeout(() => this.settle(), ARRIVE_MS + CHEW_MS),
    ];
  }

  /**
   * Now and then, after a meal, a bubble comes up out of the shark's mouth, with a little "burp" in it. It floats up and goes.
   * (A shark that is not fed does not burp, and neither does one on a computer that asked for calm.)
   */
  burp() {
    if (!shouldBurp(this.random, this.burpChance, calm())) return;
    const bubble = document.createElement('div');
    bubble.className = 'burp';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.innerHTML = '<span class="burp-dot burp-dot-1"></span><span class="burp-dot burp-dot-2"></span><span class="burp-word">burp</span>';
    this.el.append(bubble);
    setTimeout(() => bubble.remove(), BURP_MS);
  }

  /**
   * A stack is being spat back out (an Undo brought it back): the shark comes up with its mouth open for `ms`, then sinks.
   * Eating it again, or settle(), puts it back right away.
   */
  spit(ms) {
    for (const id of this.timers) clearTimeout(id);
    this.el.classList.remove('chomp', 'eating');
    this.el.classList.add('spitting');
    this.timers = [setTimeout(() => this.settle(), ms)];
  }

  /** Back to resting: lid on, shark down. Always safe to call. */
  settle() {
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
    this.el.classList.remove('eating', 'chomp', 'hungry', 'spitting');
  }
}
