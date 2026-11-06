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

import { turtleSvg } from './artwork.js';
import { CanScore, Pokes } from '../core/can-score.js';
import { sky, FLOAT_SPEED, riseDistance, riseTime } from './sky.js';

const NS = 'http://www.w3.org/2000/svg';

// The shark's head, on its own so that the can and the swimming copy of it (when it goes out to eat a fish or a boat) are the very same picture.
const SHARK = `
<g class="shark">
  <path d="M58 26 L70 -10 L86 26 Z" fill="#4b6c89"/>
  <path d="M26 86 C26 38 46 24 70 24 C94 24 114 38 114 86 Z" fill="#7096b6"/>
  <path d="M30 70 H110 V92 C100 100 40 100 30 92 Z" fill="#8b2433"/>
  <circle class="eye" cx="51" cy="48" r="8.5" fill="#ffffff"/>
  <circle class="eye" cx="89" cy="48" r="8.5" fill="#ffffff"/>
  <circle class="pupil" cx="53" cy="49" r="3.8" fill="#1d2630"/>
  <circle class="pupil" cx="87" cy="49" r="3.8" fill="#1d2630"/>
  <path class="eyes-shut" d="M43 48 Q51 56 59 48 M81 48 Q89 56 97 48" stroke="#1d2630" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <path d="M41 38 L60 43 M99 38 L80 43" stroke="#33506b" stroke-width="3.5" stroke-linecap="round"/>
  <path class="teeth-top" d="M38 64 L45 76 L52 64 L59 76 L66 64 L73 76 L80 64 L87 76 L94 64 L101 76 L108 64 Z" fill="#ffffff"/>
  <g class="jaw">
    <path d="M28 76 C34 112 106 112 112 76 Z" fill="#5a7c9b"/>
    <path d="M41 78 L48 66 L55 78 L62 66 L69 78 L76 66 L83 78 L90 66 L97 78 L104 66 L108 78 Z" fill="#ffffff"/>
  </g>
  <ellipse class="mouth" cx="70" cy="80" rx="12" ry="8" fill="none"/>
</g>`;

// The shark's head is drawn at its full height; it sits behind the can, and sinking
// down behind the can's front is what hides it. The clip keeps its sides tidy.
const PICTURE = `
<svg xmlns="${NS}" class="trash-svg" viewBox="0 -66 140 224" focusable="false">
  <defs>
    <clipPath id="trash-clip"><rect x="0" y="-66" width="140" height="148"/></clipPath>
  </defs>
  <ellipse cx="70" cy="77" rx="44" ry="8" fill="#39424a"/>
  <g clip-path="url(#trash-clip)">
    ${SHARK}
  </g>
  <path d="M33 78 H107 L99 154 H41 Z" fill="#a9b2ba" stroke="#78838c" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M52 86 L55 148 M70 86 V148 M88 86 L85 148" stroke="#8a949d" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="27" y="72" width="86" height="10" rx="5" fill="#c6cdd3" stroke="#78838c" stroke-width="2.5"/>
  <g class="lid">
    <rect x="24" y="60" width="92" height="13" rx="6" fill="#8e99a2" stroke="#68727a" stroke-width="2.5"/>
    <rect x="60" y="51" width="20" height="10" rx="4" fill="#68727a"/>
  </g>
  <g class="can-score">
    <circle cx="70" cy="118" r="21" fill="#fff3b0" stroke="#b58900" stroke-width="2.5"/>
    <text class="can-score-text" x="70" y="127" text-anchor="middle" font-size="26" font-weight="800" fill="#4a3a00">0</text>
  </g>
</svg>`;

// The copy of the shark that swims out of the can (see Trash.hunt): just the head, with no can and no clip, in a box the size of the can's picture.
const SWIMMER = `<svg xmlns="${NS}" class="trash-svg" viewBox="0 -66 140 224" focusable="false">${SHARK}</svg>`;

// What the shark dreams of: turtle stew. A thought bubble with a pot of stew seen from above and a little turtle swimming in it (the
// turtle is the same picture as the one on the paper, made small). The shapes are drawn here.
const STEW_TURTLE = turtleSvg().replace(' id="svg2"', '').replace('width="55" height="55"', 'x="67" y="37" width="30" height="30"');
const CLOUD = [[52, 52, 22], [62, 32, 22], [88, 26, 24], [115, 36, 22], [126, 56, 20], [112, 78, 22], [84, 84, 24], [56, 76, 20]];
const DREAM = `
<svg xmlns="${NS}" class="dream-svg" viewBox="0 0 150 112" focusable="false">
  <circle cx="14" cy="104" r="4" fill="#fff" stroke="#9db7d1" stroke-width="1.8"/>
  <circle cx="26" cy="93" r="6.5" fill="#fff" stroke="#9db7d1" stroke-width="1.8"/>
  <g fill="#fff" stroke="#9db7d1" stroke-width="2.2">${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
  <g fill="#fff">${CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.4}"/>`).join('')}</g>
  <rect x="52" y="48" width="11" height="8" rx="3.5" fill="#59616b"/>
  <rect x="101" y="48" width="11" height="8" rx="3.5" fill="#59616b"/>
  <circle cx="82" cy="52" r="23" fill="#6b7480" stroke="#4b525b" stroke-width="2"/>
  <circle cx="82" cy="52" r="18.5" fill="#c97b2a"/>
  <circle cx="72" cy="63" r="2.6" fill="#f08a24"/><circle cx="94" cy="62" r="2.6" fill="#f08a24"/><circle cx="76" cy="41" r="2.2" fill="#f08a24"/>
  <circle cx="92" cy="41" r="2.2" fill="#6cc600"/><circle cx="70" cy="53" r="2.2" fill="#6cc600"/><circle cx="96" cy="52" r="2.2" fill="#6cc600"/>
  ${STEW_TURTLE}
  <path class="steam steam-1" d="M72 28 q-4 -4 0 -8 q4 -4 0 -8" stroke="#b9c7d6" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path class="steam steam-2" d="M84 26 q-4 -4 0 -8 q4 -4 0 -8" stroke="#b9c7d6" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path class="steam steam-3" d="M96 28 q-4 -4 0 -8 q4 -4 0 -8" stroke="#b9c7d6" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <text x="84" y="99" text-anchor="middle" font-size="12" font-weight="700" fill="#4f7099">turtle soup</text>
</svg>`;

/** The pieces of the shark's resting look that other states take over from: while any of these is on, it is not a good time to doze. */
const NOT_RESTING = ['hungry', 'eating', 'spitting', 'peek', 'dreaming', 'hunting'];

/** How long a dropped block takes to reach the shark, and how long the chewing lasts after that. */
const ARRIVE_MS = 340;
const CHEW_MS = 800;

/** How often a shark that has eaten a block burps a bubble, and how long the bubble floats. */
export const BURP_CHANCE = 0.3;
const BURP_MS = 1700;

/** How long the can rings after a harpoon hits it, and how long the shark snaps at the boat that threw it. */
const CLANG_MS = 900;
const SNAP_MS = 1000;

/** How far the shark's mouth moves between sunk down and up, in the picture's own units (its translateY, 84 and -40, in trash.css). */
const SHARK_RISE = 124;
/** How far the shark has come up when it is only peeking or dozing (its translateY is 12 instead of 84, so 72 of the 124). */
const PEEK_RISE = 72;
const PICTURE_WIDTH = 140;
/** Where the mouth is in the picture once the shark is all the way up, in the picture's own units (x across, y down from the top of the box). */
const MOUTH_UP = { x: 70, y: 106 };

/**
 * The shark swims out of the can to eat something that was clicked (a fish or the boat): how fast it swims (pixels a second), the shortest and longest
 * a swim takes, how long after it arrives its jaws first close, how long it chomps, and how long it holds its burp before it sinks again.
 */
export const HUNT = { RISE_MS: 240, SPEED: 800, MIN_MS: 450, MAX_MS: 1300, BITE_AT_MS: 170, CHOMP_MS: 800, BURP_HOLD_MS: 380 };

/** How long a swim of this many pixels takes (milliseconds): a steady speed, but never a blink and never a long wait. */
export function swimTime(distance) {
  return Math.round(Math.min(HUNT.MAX_MS, Math.max(HUNT.MIN_MS, (distance / HUNT.SPEED) * 1000)));
}

/** Where the swimming shark's picture goes (its top left corner, on the screen) so that its mouth is at `mouth`, for a picture `scale` times its drawn size. */
export function swimmerCorner(mouth, scale) {
  return { x: mouth.x - MOUTH_UP.x * scale, y: mouth.y - MOUTH_UP.y * scale };
}

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
    this.dream = null;
    this.zzz = null;
    this.clangTimer = null;
    this.clangWord = null;
    this.trip = null; // while the shark is out of the can eating something: { swimmer, timers, onDone }
    stage.insertBefore(this.el, before);

    // The score: a point for each thing the shark eats, one off for each harpoon that hits the can (core/can-score.js). It is on a sticker on the can.
    this.score = new CanScore();
    this.pokes = new Pokes();
    this.sticker = this.el.querySelector('.can-score');
    this.scoreText = this.el.querySelector('.can-score-text');
    this.stickerTimer = null;
    this.now = () => performance.now();
    /** Called when enough pokes have come: it should send a visitor (a fish or the boat) and say whether one came. Set by whoever has the visitors. */
    this.onSummon = null;
    this.leftLabel = null;
    this.leftTimer = null;
    this.jiggleTimer = null;
    // Poking the can: its body (not the shark above it) can be clicked. The can itself ignores the mouse, so that a stack carried over it is the one that gets it.
    this.hit = document.createElement('div');
    this.hit.className = 'trash-hit';
    this.el.append(this.hit);
    this.hit.addEventListener('click', () => this.poke());
    this.showScore();
  }

  // ---- The score, and poking the can ----------------------------------------------------------------------

  /** Put the score on the sticker, or take the sticker off when there is none. */
  showScore() {
    this.el.classList.toggle('has-score', this.score.visible);
    const text = String(this.score.points);
    this.scoreText.textContent = text;
    this.scoreText.setAttribute('font-size', text.length >= 3 ? '17' : text.length === 2 ? '22' : '26');
  }

  /** The sticker bounces (a point won) or flashes (a point lost). */
  flashSticker(kind) {
    clearTimeout(this.stickerTimer);
    this.sticker.classList.remove('bump', 'ouch');
    void this.sticker.getBoundingClientRect(); // so that it starts again even if it was going
    this.sticker.classList.add(kind);
    this.stickerTimer = setTimeout(() => this.sticker.classList.remove('bump', 'ouch'), 600);
  }

  /** The shark ate something: one point. */
  ate() {
    this.score.ate();
    this.pokes.reset();
    this.showScore();
    this.flashSticker('bump');
  }

  /** A harpoon hit the can: one point off, and with none left the sticker comes off. */
  harpooned() {
    const had = this.score.visible;
    this.score.harpooned();
    this.pokes.reset();
    this.showScore();
    if (had && this.score.visible) this.flashSticker('ouch');
  }

  /** Start with this score (?canscore=5, for trying it out). */
  setScore(points) {
    this.score.set(points);
    this.pokes.reset();
    this.showScore();
  }

  /** The score now (0 when there is no sticker). */
  get points() {
    return this.score.points;
  }

  /**
   * The can was poked (clicked). The can jiggles, and says how many pokes are left; the last poke calls a visitor (as many pokes as the score, or one if
   * there is none: see core/can-score.js). On a computer that asked for calm nothing happens, like the other things the shark and the turtle do.
   */
  poke() {
    if (calm()) return;
    const result = this.pokes.poke(this.now(), this.score.points);
    this.jiggle();
    this.showLeft(null);
    if (!result.summon) {
      this.showLeft(`${result.left} more`);
      return;
    }
    const came = this.onSummon ? this.onSummon() : false;
    if (!came) this.showLeft('not now');
  }

  /** The can squashes a little, as if it was poked. */
  jiggle() {
    clearTimeout(this.jiggleTimer);
    this.el.classList.remove('poked');
    void this.el.offsetWidth;
    this.el.classList.add('poked');
    this.jiggleTimer = setTimeout(() => this.el.classList.remove('poked'), 320);
  }

  /** A little bubble by the can ("3 more"), for a moment. `null` takes it away. */
  showLeft(text) {
    clearTimeout(this.leftTimer);
    this.leftLabel?.remove();
    this.leftLabel = null;
    if (text === null) return;
    this.leftLabel = document.createElement('div');
    this.leftLabel.className = 'poke-left';
    this.leftLabel.setAttribute('aria-hidden', 'true');
    this.leftLabel.textContent = text;
    this.el.append(this.leftLabel);
    this.leftTimer = setTimeout(() => {
      this.leftLabel?.remove();
      this.leftLabel = null;
    }, 1400);
  }

  /** The shark comes up with its mouth open (a block is held over the left side), or goes back down. */
  setHungry(hungry) {
    if (hungry) {
      this.setDreaming(false);
      this.endHunt(); // a block to eat: the shark comes home at once
    }
    this.el.classList.toggle('hungry', hungry);
  }

  /** Is the can showing with the shark just resting, so that it could doze off? */
  canDream() {
    const box = this.el.getBoundingClientRect();
    return (box.width > 0 || box.height > 0) && !NOT_RESTING.some((name) => this.el.classList.contains(name));
  }

  /**
   * The shark dozes off over the rim, its eyes shut, and dreams of turtle soup in a thought bubble, with a few z's floating up from it all
   * the way off the top of the window (or it wakes up, and the bubble and the z's go). Waking is always safe to ask for. Gives back how many
   * seconds until the last z has floated away, which is how long the dream should last at the least.
   */
  setDreaming(dreaming) {
    this.el.classList.toggle('dreaming', dreaming);
    this.dream?.remove();
    this.dream = null;
    this.zzz?.remove();
    this.zzz = null;
    if (!dreaming) return 0;
    this.dream = document.createElement('div');
    this.dream.className = 'dream';
    this.dream.setAttribute('aria-hidden', 'true');
    this.dream.innerHTML = DREAM;
    this.el.append(this.dream);
    // The z's start by the shark's head and rise to just off the top of the window, one after another.
    const box = this.el.getBoundingClientRect();
    const x = box.left + box.width * 0.66;
    const y = box.top + box.height * 0.3;
    const distance = riseDistance(y);
    const seconds = riseTime(distance, FLOAT_SPEED.zzz);
    this.zzz = document.createElement('div');
    this.zzz.className = 'turtle-zzz';
    this.zzz.setAttribute('aria-hidden', 'true');
    this.zzz.innerHTML = '<span>z</span><span>z</span><span>Z</span>';
    this.zzz.style.setProperty('--rise', `${distance}px`);
    this.zzz.style.setProperty('--rise-time', `${seconds}s`);
    this.zzz.style.setProperty('--times', '1');
    this.zzz.style.transform = `translate(${x}px, ${y}px)`;
    sky().append(this.zzz);
    return seconds * 1.56;
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
    // How far the shark still has to come up: all of it from resting, a little from peeking or dozing, none if it is up already.
    const has = (names) => names.some((name) => this.el.classList.contains(name));
    const still = has(['hungry', 'eating', 'spitting', 'hunting']) ? 0 : has(['peek', 'dreaming']) ? SHARK_RISE - PEEK_RISE : SHARK_RISE;
    const lift = raised ? still * (this.el.getBoundingClientRect().width / PICTURE_WIDTH) : 0;
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 - lift };
  }

  /**
   * A block has been dropped on the left side. The shark stays up while it flies in,
   * chomps, and then sinks back down. Feeding it again while it chews starts over.
   */
  feed() {
    this.ate(); // a stack of blocks was thrown in: the shark ate something
    this.endHunt();
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
  burp(chance = this.burpChance) {
    if (!shouldBurp(this.random, chance, calm())) return;
    const bubble = document.createElement('div');
    bubble.className = 'burp';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.innerHTML = '<span class="burp-dot burp-dot-1"></span><span class="burp-dot burp-dot-2"></span><span class="burp-word">burp</span>';
    this.el.append(bubble);
    setTimeout(() => bubble.remove(), BURP_MS);
  }

  /**
   * A harpoon hits the can (the boat in boat.js): it rings and shakes for a moment, and a "clang!" pops up where it hit.
   */
  clang() {
    this.harpooned(); // it hit the can: a point off
    clearTimeout(this.clangTimer);
    this.el.classList.remove('clang');
    this.clangWord?.remove();
    void this.el.offsetWidth; // so that being hit again starts the shake over
    this.el.classList.add('clang');
    this.clangWord = document.createElement('div');
    this.clangWord.className = 'clang-word';
    this.clangWord.setAttribute('aria-hidden', 'true');
    this.clangWord.textContent = 'clang!';
    this.el.append(this.clangWord);
    this.clangTimer = setTimeout(() => {
      this.el.classList.remove('clang');
      this.clangWord?.remove();
      this.clangWord = null;
    }, CLANG_MS);
  }

  /**
   * The shark pops up and snaps its jaws (at a boat that tried to harpoon it), then sinks. Nothing was eaten, so there is no burp.
   */
  snap() {
    this.endHunt();
    for (const id of this.timers) clearTimeout(id);
    this.el.classList.remove('peek', 'chomp');
    void this.el.offsetWidth;
    this.el.classList.add('eating', 'chomp');
    this.timers = [setTimeout(() => this.settle(), SNAP_MS)];
  }

  /**
   * A stack is being spat back out (an Undo brought it back): the shark comes up with its mouth open for `ms`, then sinks.
   * Eating it again, or settle(), puts it back right away.
   */
  spit(ms) {
    this.endHunt();
    for (const id of this.timers) clearTimeout(id);
    this.el.classList.remove('chomp', 'eating');
    this.el.classList.add('spitting');
    this.timers = [setTimeout(() => this.settle(), ms)];
  }

  /**
   * The shark swims out of the can to eat something on the screen (a fish or the boat that was clicked), and comes back. The lid flips off and
   * the shark comes up; then a copy of its head, in the layer above everything (sky.js), swims to `target` ({ x, y }, the middle of the
   * thing), chomps, and swims home, and the real shark takes its place, burps, and sinks. `onBite` is called when the jaws first close on it and
   * `onDone` once the shark is home (or at once, if something else needs the shark, like a block dropped on the can). Gives back false, and
   * does nothing, if the can is not showing or the shark is already out.
   * @param {{ x: number, y: number }} target
   * @param {{ onBite?: () => void, onDone?: () => void }} [calls]
   * @returns {boolean}
   */
  hunt(target, { onBite = () => {}, onDone = () => {} } = {}) {
    if (this.trip) return false;
    const home = this.mouthPoint({ raised: true });
    if (!home) return false;
    const scale = this.el.getBoundingClientRect().width / PICTURE_WIDTH;
    this.setDreaming(false);
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
    this.el.classList.remove('peek', 'chomp', 'eating', 'spitting', 'hungry');
    this.el.classList.add('hunting');

    const swimmer = document.createElement('div');
    swimmer.className = 'shark-swimmer';
    swimmer.setAttribute('aria-hidden', 'true');
    swimmer.innerHTML = SWIMMER;
    swimmer.style.width = `${this.el.getBoundingClientRect().width}px`;
    const place = (mouth) => {
      const corner = swimmerCorner(mouth, scale);
      return `translate(${corner.x}px, ${corner.y}px)`;
    };
    const face = (dx) => swimmer.style.setProperty('--look-x', `${Math.sign(dx) * 2.8}px`);
    swimmer.style.transform = place(home);
    const hunt = { swimmer, timers: [], onDone };
    this.trip = hunt;
    const at = (ms, fn) => hunt.timers.push(setTimeout(fn, ms));
    const ms = swimTime(Math.hypot(target.x - home.x, target.y - home.y));

    at(HUNT.RISE_MS, () => {
      this.el.classList.add('swimming-out'); // the real shark hides: the copy is in exactly its place
      sky().append(swimmer);
      void swimmer.offsetWidth; // so that the swim starts from here
      face(target.x - home.x);
      swimmer.classList.add('swimming');
      swimmer.style.transition = `transform ${ms}ms cubic-bezier(0.55, 0, 0.35, 1)`;
      swimmer.style.transform = place(target);
    });
    at(HUNT.RISE_MS + ms, () => {
      swimmer.classList.remove('swimming');
      swimmer.classList.add('chomp');
    });
    at(HUNT.RISE_MS + ms + HUNT.BITE_AT_MS, () => {
      onBite();
      this.ate(); // a fish or a boat that was clicked: the shark ate it
    });
    at(HUNT.RISE_MS + ms + HUNT.CHOMP_MS, () => {
      face(home.x - target.x);
      swimmer.classList.remove('chomp');
      swimmer.classList.add('swimming');
      swimmer.style.transform = place(home);
    });
    at(HUNT.RISE_MS + 2 * ms + HUNT.CHOMP_MS, () => {
      this.el.classList.remove('swimming-out'); // home: the real shark is there, up, with a full stomach
      swimmer.remove();
      this.burp(1);
    });
    at(HUNT.RISE_MS + 2 * ms + HUNT.CHOMP_MS + HUNT.BURP_HOLD_MS, () => this.endHunt());
    return true;
  }

  /** The hunt is over (or something cut it short): the copy of the shark goes, the real one sinks, and whoever sent it out is told. Safe at any time. */
  endHunt() {
    const hunt = this.trip;
    if (!hunt) return;
    this.trip = null;
    for (const id of hunt.timers) clearTimeout(id);
    hunt.swimmer.remove();
    this.el.classList.remove('hunting', 'swimming-out');
    hunt.onDone();
  }

  /** Back to resting: lid on, shark down. Always safe to call. */
  settle() {
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
    this.el.classList.remove('eating', 'chomp', 'hungry', 'spitting');
    this.setDreaming(false);
  }
}
