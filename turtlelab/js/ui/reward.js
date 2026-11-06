// TurtleLab: little treats for doing work. When somebody has been building and running a program, the turtle might dance, blow happy bubbles, or a
// fish or a fishing boat might come by for the shark to eat. (What happens when nobody is doing anything is idle.js and antics.js.)
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Work earns points: each change to the blocks that is real (a block added, a number changed, blocks rearranged: not moving a stack around, not deleting
// one, not Undo) earns 1, and a program that runs to the end after the blocks were changed earns 3 (running the same blocks again earns nothing, so
// pressing Run over and over gets nothing). When the points of the last few minutes reach the goal, one treat plays, the points start over, and there is
// a rest before the next. Everything is in memory: nothing is stored, and nothing here touches a project.
//
// This file only decides WHEN and WHICH (so it can be tested without a browser). What each treat looks like is in antics.js, fish.js and boat.js.

import { pickAntic } from './idle.js';

/** Points: for a real change to the blocks, and for a run that finished after the blocks changed. */
export const EDIT_POINTS = 1;
export const RUN_POINTS = 3;
/** The points needed for a treat (about a square's worth of building, then running it), how far back points count, and the rest after a treat (ms). */
export const GOAL = 8;
export const WINDOW_MS = 240000;
export const COOLDOWN_MS = 75000;
/** A finished program waves for a moment first; a treat for it waits this long (ms) so the two do not pile up. */
export const AFTER_RUN_MS = 1700;

/** How many blocks there are, counting the ones inside other blocks (the arms of a repeat, the arguments of a block). */
export function countBlocks(value) {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countBlocks(item), 0);
  if (value && typeof value === 'object') {
    let sum = typeof value.op === 'string' ? 1 : 0;
    for (const key of Object.keys(value)) sum += countBlocks(value[key]);
    return sum;
  }
  return 0;
}

/**
 * What the blocks are, for telling whether they changed in a way that is work: the number of blocks, and a description of them with the places of the
 * stacks on the page left out (so that dragging a stack somewhere else is not a change).
 * @param {{ x: number, y: number, blocks: object[] }[]} stacks
 */
export function workMark(stacks) {
  return { count: countBlocks(stacks), sig: JSON.stringify(stacks.map((stack) => stack.blocks)) };
}

/** Was the change from `before` to `after` work? A change to the blocks themselves that did not take blocks away. */
export function earnedWork(before, after) {
  return after.sig !== before.sig && after.count >= before.count;
}

export class Reward {
  /**
   * @param {object} options
   * @param {{ name: string, weight: number, can?: () => boolean, play: () => (false | { ms?: number, stop?: () => void } | true) }[]} options.rewards
   *        the treats. `play` starts one and gives back false if it is not possible just now (a fish cannot swim while a boat is here), or true (it
   *        looks after itself: a fish), or how long it lasts and how to stop it (the turtle dancing).
   * @param {{ name: string, weight: number, can?: () => boolean, play: () => (false | { ms?: number, stop?: () => void } | true) }[]} [options.surprises]
   *        what can happen on a whim (`surprise`): the same kind of thing as a treat, but any of the antics, not only the treats
   * @param {() => boolean} options.busy true when it is not a good moment (a program is running, the blocks are hidden...)
   * @param {() => boolean} [options.calm] true when the computer asked for less motion: then nothing ever happens
   * The rest are for tests: `random`, `now`, `setTimer`, `clearTimer`, `visible`, `goal`, `windowMs`, `cooldownMs`, `afterRunMs`.
   */
  constructor({ rewards, surprises = [], busy, calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, random = Math.random,
    now = () => performance.now(), setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (id) => clearTimeout(id),
    visible = () => document.visibilityState !== 'hidden', goal = GOAL, windowMs = WINDOW_MS, cooldownMs = COOLDOWN_MS, afterRunMs = AFTER_RUN_MS }) {
    Object.assign(this, { rewards, surprises, busy, calm, random, now, setTimer, clearTimer, visible, goal, windowMs, cooldownMs, afterRunMs });
    this.events = []; // the points earned lately: { at, points }
    this.changedSinceRun = false;
    this.lastAt = null; // when the last treat began
    this.lastName = null;
    this.lastSurprise = null; // (its own, so a surprise never uses up the rest before the next treat, or takes the points)
    this.playing = null; // the treat going now that needs stopping: { stop, timer }
    this.checkTimer = null;
    this.stopped = false;
  }

  /** The points of the last few minutes. */
  score() {
    const cutoff = this.now() - this.windowMs;
    this.events = this.events.filter((event) => event.at > cutoff);
    return this.events.reduce((sum, event) => sum + event.points, 0);
  }

  /** The blocks changed in a way that is work. */
  edited() {
    if (this.stopped || this.calm()) return;
    this.events.push({ at: this.now(), points: EDIT_POINTS });
    this.changedSinceRun = true;
    this.check();
  }

  /** A program ran to the end. It is worth something only if the blocks changed since the last time one did. */
  ran() {
    if (this.stopped || this.calm() || !this.changedSinceRun) return;
    this.changedSinceRun = false;
    this.events.push({ at: this.now(), points: RUN_POINTS });
    // The turtle waves first, then the treat.
    if (this.checkTimer !== null) this.clearTimer(this.checkTimer);
    this.checkTimer = this.setTimer(() => {
      this.checkTimer = null;
      this.check();
    }, this.afterRunMs);
  }

  /** Is it time for a treat? If so, play one. Gives back whether one began. */
  check() {
    if (this.stopped || this.calm() || !this.visible() || this.busy()) return false;
    if (this.lastAt !== null && this.now() - this.lastAt < this.cooldownMs) return false;
    if (this.score() < this.goal) return false;
    return this.give();
  }

  /** Play one treat, chosen by weight, but not the one that was last (unless it is the only one). */
  give() {
    let options = this.rewards.filter((reward) => reward.can?.() ?? true);
    const fresh = options.filter((reward) => reward.name !== this.lastName);
    if (fresh.length > 0) options = fresh;
    while (options.length > 0) {
      const pick = pickAntic(options, this.random);
      const started = pick.play();
      if (started !== false) {
        this.began(pick, started);
        return true;
      }
      options = options.filter((reward) => reward !== pick);
    }
    return false;
  }

  began(reward, started) {
    this.end();
    this.lastName = reward.name;
    this.lastAt = this.now();
    this.events = [];
    if (started && typeof started.stop === 'function') {
      const stop = started.stop;
      this.playing = { stop, timer: this.setTimer(() => this.end(), started.ms ?? 0) };
    }
  }

  /**
   * Play the treat with this name right now, whatever the points (for trying them out: the address ?antic=dance does this). Gives back false if there is no
   * such treat, it is not possible, or the computer asked for calm.
   */
  playNow(name) {
    if (this.stopped || this.calm()) return false;
    const reward = this.rewards.find((candidate) => candidate.name === name);
    if (!reward) return false;
    const started = reward.play();
    if (started === false) return false;
    this.began(reward, started);
    return true;
  }

  /**
   * Something happens on a whim, whatever the points and whatever is going on (the grid button: every change of grid or paper plays one). It is chosen by
   * weight from the surprises that are possible now, not the one that was last if another will do; one that says no is skipped for the next. It does not
   * earn or use up points, and does not start the rest before the next treat. Whatever treat or surprise was playing ends first, and this one is not ended by activity.
   * Gives back the name of the one that began, or false (nothing happens when the computer asked for calm, or the tab is hidden).
   * @param {string} [name] play this one (if it is possible) instead of choosing, for trying them out (the address ?surprise=spew)
   */
  surprise(name) {
    if (this.stopped || this.calm() || !this.visible()) return false;
    this.end();
    let options = this.surprises.filter((candidate) => candidate.can?.() ?? true);
    if (name) options = options.filter((candidate) => candidate.name === name);
    const fresh = options.filter((candidate) => candidate.name !== this.lastSurprise);
    if (fresh.length > 0 && !name) options = fresh;
    while (options.length > 0) {
      const pick = pickAntic(options, this.random);
      const started = pick.play();
      if (started !== false) {
        this.lastSurprise = pick.name;
        if (started && typeof started.stop === 'function') this.playing = { stop: started.stop, timer: this.setTimer(() => this.end(), started.ms ?? 0) };
        return pick.name;
      }
      options = options.filter((candidate) => candidate !== pick);
    }
    return false;
  }

  /** The treat that is playing (if it needs stopping) stops, now. */
  end() {
    if (!this.playing) return;
    const { stop, timer } = this.playing;
    this.playing = null;
    this.clearTimer(timer);
    stop();
  }

  /** Stop for good: no more treats, and the one playing ends. */
  stop() {
    this.stopped = true;
    if (this.checkTimer !== null) this.clearTimer(this.checkTimer);
    this.checkTimer = null;
    this.end();
  }
}
