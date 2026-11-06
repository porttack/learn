// TurtleLab: the score on the garbage can, and poking the can.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A little game with the shark. Each time it eats something (a stack of blocks you throw in the can, or a fish or a boat you click so that it swims
// out and eats it) the can gets a point, shown on a sticker on the can. Each time a harpoon from the fishing boat hits the can it loses one, and
// when that takes it to zero or less the sticker comes off. Poke the can (click it) as many times as its score (once if it has none) and a
// visitor comes: a fish, or the boat with its harpoon. This file is only the counting; trash.js shows it and main.js sends the visitor.
// Nothing here is stored: the score starts again at nothing every time the page opens.

/** How long a pause between two pokes, in milliseconds, starts the count again from nothing. */
export const POKE_GAP_MS = 1500;

export class CanScore {
  constructor() {
    this.points = 0;
  }

  /** The shark ate something. Returns the score. */
  ate() {
    this.points += 1;
    return this.points;
  }

  /** A harpoon hit the can. A score that gets to zero or less is taken away (it is nothing again). Returns the score. */
  harpooned() {
    this.points = this.points > 1 ? this.points - 1 : 0;
    return this.points;
  }

  /** Start at this score (for trying it out): a whole number of one or more, anything else is no score. */
  set(points) {
    const n = Math.floor(Number(points));
    this.points = Number.isFinite(n) && n > 0 ? n : 0;
    return this.points;
  }

  /** Is there a score to show? (Nothing, zero or less, is no sticker.) */
  get visible() {
    return this.points > 0;
  }
}

/** How many pokes it takes to call a visitor: as many as the score, or one if there is none. */
export function pokesNeeded(points) {
  return points >= 1 ? Math.floor(points) : 1;
}

/** Counts the pokes. A poke that comes too long after the one before starts the count again. */
export class Pokes {
  constructor(gapMs = POKE_GAP_MS) {
    this.gapMs = gapMs;
    this.count = 0;
    this.last = null;
  }

  /**
   * The can was poked at time `now` (milliseconds), and has this score.
   * @returns {{ count: number, needed: number, left: number, summon: boolean }} how many pokes so far in this run of them, how many it takes,
   *   how many more, and whether this is the one that calls a visitor (the count then starts again).
   */
  poke(now, points) {
    if (this.last === null || now - this.last > this.gapMs) this.count = 0;
    this.last = now;
    this.count += 1;
    const needed = pokesNeeded(points);
    if (this.count >= needed) {
      this.count = 0;
      return { count: needed, needed, left: 0, summon: true };
    }
    return { count: this.count, needed, left: needed - this.count, summon: false };
  }

  /** Forget the pokes so far (the score changed, or a visitor came). */
  reset() {
    this.count = 0;
    this.last = null;
  }
}
