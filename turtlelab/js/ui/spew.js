// TurtleLab: the shark brings up everything it has eaten.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The shark remembers what it has eaten (the stacks of blocks you threw in the can, the fish and the boat you clicked), and now and then it is sick
// and brings all of it back up: each thing flies out of its mouth in an arc, lands somewhere near the can, lies there a moment, and fades to nothing.
// This file is only the arithmetic (where each thing lands and when, how big it is drawn), so it can be tested without a browser. The pictures and
// the shark's heaving are in trash.js and the stylesheet; which antic it is and when it happens is antics.js. Nothing here is stored: the shark
// forgets everything it ate when the page closes, and everything it brings up is gone again in a few seconds.

/** The shark remembers this many of the latest things it ate (a long day of feeding it does not make a mountain). */
export const MEALS_KEPT = 30;
/** The most things that come up in one go (the latest ones, if it had more). */
export const PIECES_MAX = 14;
/** How big a thing is when it lands, along its longer side, in pixels. */
export const PIECE_PX = 46;

/**
 * The timing, in milliseconds: how long the shark heaves before the first thing comes up, the gap between one thing and the next, how long a thing
 * is in the air [shortest, longest], how long it lies where it landed [shortest, longest], and how long it takes to fade to nothing (its opacity).
 */
export const SPEW = { HEAVE_MS: 520, STAGGER_MS: 140, FLY_MS: [620, 900], SIT_MS: [1100, 1900], FADE_MS: 1800, WORD_MS: 1100 };

/** A number between `low` and `high` from random() (0 up to just under 1). */
const between = ([low, high], random) => low + random() * (high - low);
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

/** How big a picture of this size is drawn so its longer side is `longest` (a small thing is not made bigger than `longest` either). */
export function fitPicture(width, height, longest = PIECE_PX) {
  if (!(width > 0) || !(height > 0)) return { width: longest, height: longest };
  const scale = longest / Math.max(width, height);
  return { width: width * scale, height: height * scale };
}

/**
 * Where each thing lands, and when it all happens.
 * @param {number} count how many things come up (at most PIECES_MAX are planned)
 * @param {{ x: number, y: number }} mouth where they come out (the window's pixels)
 * @param {{ width: number, height: number }} room the window, so nothing lands off its edge
 * @param {() => number} [random]
 * @returns {{ from: {x: number, y: number}, to: {x: number, y: number}, apex: number, turn: number, scale: number,
 *   delay: number, fly: number, sit: number, fade: number }[]} for each thing: where it starts and lands (the middle of it), how high above the
 *   straight line between them it flies, how far it spins (degrees), its size, and the times: `delay` (from the start) until it leaves the mouth,
 *   then `fly`, `sit` and `fade`. The lands are spread round the can: mostly out to the right and below the mouth, some to the left.
 */
export function spewPlan(count, mouth, room, random = Math.random) {
  const edge = 30;
  const things = Math.max(0, Math.min(PIECES_MAX, Math.floor(count)));
  return Array.from({ length: things }, (_, index) => ({
    from: { x: mouth.x, y: mouth.y },
    to: {
      x: clamp(mouth.x + between([-70, 340], random), edge, Math.max(edge, room.width - edge)),
      y: clamp(mouth.y + between([10, 150], random), edge, Math.max(edge, room.height - edge)),
    },
    apex: between([60, 150], random),
    turn: between([-220, 220], random),
    scale: between([0.85, 1.15], random),
    delay: SPEW.HEAVE_MS + index * SPEW.STAGGER_MS,
    fly: Math.round(between(SPEW.FLY_MS, random)),
    sit: Math.round(between(SPEW.SIT_MS, random)),
    fade: SPEW.FADE_MS,
  }));
}

/**
 * The path of one thing through the air, as points along an arc: it leaves the mouth small, grows to its size as it goes up, turns over, comes
 * down at `to` and lies there. `offset` runs from 0 (leaving) to 1 (landed), evenly, which is how the animation is timed.
 * @param {{ from: {x: number, y: number}, to: {x: number, y: number}, apex: number, turn: number, scale: number }} piece one entry of spewPlan
 * @returns {{ x: number, y: number, rotate: number, scale: number, offset: number }[]} where the MIDDLE of the thing is, at each point
 */
export function arcPath(piece, steps = 10) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      x: piece.from.x + (piece.to.x - piece.from.x) * t,
      y: piece.from.y + (piece.to.y - piece.from.y) * t - 4 * piece.apex * t * (1 - t), // up and over: the top of the arc is `apex` above the straight line
      rotate: piece.turn * t,
      scale: 0.3 + (piece.scale - 0.3) * Math.min(1, t / 0.25),
      offset: t,
    };
  });
}

/** How long it all takes, from the first heave to the last thing gone (milliseconds). A shark with nothing to bring up still heaves once. */
export function spewDuration(plan) {
  if (plan.length === 0) return SPEW.HEAVE_MS + SPEW.WORD_MS;
  return Math.max(...plan.map((piece) => piece.delay + piece.fly + piece.sit + piece.fade));
}

/**
 * The shark's memory of what it ate: the latest MEALS_KEPT, oldest first. A meal is whatever picture there is of it (or null: a plain chip is drawn).
 */
export class Meals {
  constructor(kept = MEALS_KEPT) {
    this.kept = kept;
    this.list = [];
  }

  get count() {
    return this.list.length;
  }

  /** The shark ate something. */
  add(meal) {
    this.list.push(meal ?? null);
    if (this.list.length > this.kept) this.list.shift();
  }

  /** The latest thing it ate is given back (an Undo brought the stack back, so the shark no longer has it). Gives back whether there was one. */
  giveBack() {
    if (this.list.length === 0) return false;
    this.list.pop();
    return true;
  }

  /** Everything it has, for bringing up: the latest PIECES_MAX of them. The shark is empty after. */
  takeAll() {
    const all = this.list;
    this.list = [];
    return all.slice(-PIECES_MAX);
  }
}
