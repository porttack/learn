// TurtleLab: little things that happen when nobody is doing anything. After half a minute with no clicking, typing or touching, the turtle
// might dance, scratch its head, yawn or blow bubbles, and the shark might fall asleep and dream, or be sick. Any click or key stops it at once.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// This file only decides WHEN and WHICH (so it can be tested without a browser): the watching for activity, the minute of waiting,
// the dice, and the "not now" rules. What each antic looks like is in antics.js. Nothing here stores anything or touches a project.

/** 30 seconds with no activity (it was 45: the user asked for it a bit more often), then, while it stays quiet, a pause of this many milliseconds [shortest, longest] between one antic and the next (it was 30 to 80 seconds). */
export const IDLE_MS = 30000;
export const GAP_MS = [20000, 50000];
/** If the minute is up at a bad moment (a program is running, the tab is hidden), look again after this long. */
export const RETRY_MS = 10000;
/** The quiet time before the turtle starts to breathe (its color slowly fades and comes back), well before the first antic. (It was 30 seconds; the user found it not distracting and asked for 5.) */
export const BREATH_AFTER_MS = 5000;

/** A number between `low` and `high` from random() (0 up to just under 1). */
export function between([low, high], random) {
  return low + random() * (high - low);
}

/**
 * Choose one antic, the luckier ones more often. `available` is the list to choose from (each has a `weight`).
 * @param {{ weight: number }[]} available
 * @param {() => number} random
 * @returns the chosen one, or null if there is nothing to choose from
 */
export function pickAntic(available, random) {
  const total = available.reduce((sum, antic) => sum + antic.weight, 0);
  if (available.length === 0 || !(total > 0)) return null;
  let roll = random() * total;
  for (const antic of available) {
    roll -= antic.weight;
    if (roll < 0) return antic;
  }
  return available[available.length - 1];
}

export class Idle {
  /**
   * @param {object} options
   * @param {{ name: string, weight: number, can?: () => boolean, play: () => ({ stop: () => void, ms: number }) }[]} options.antics
   *        what can happen. `can` says whether this one is possible right now, and `play` starts it and gives back how long it lasts and how to stop it.
   * @param {() => boolean} options.busy true when it is not a good moment (a program is running, the blocks are hidden...)
   * @param {{ name: string, afterMs: number, start: () => void, stop: () => void }[]} [options.ambient]
   *        things that go on quietly for as long as it stays quiet (the turtle's breathing): each starts `afterMs` after the last activity, at the same good
   *        moments as an antic, and stops the moment anyone does anything. They are not antics: one can be going while an antic plays.
   * @param {() => boolean} [options.calm] true when the computer asked for less motion: then nothing ever happens
   * The rest are for tests: `random`, `setTimer`, `clearTimer`, `visible`, `idleMs`, `gapMs`, `retryMs`.
   */
  constructor({ antics, busy, ambient = [], calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, random = Math.random,
    setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (id) => clearTimeout(id), visible = () => document.visibilityState !== 'hidden',
    idleMs = IDLE_MS, gapMs = GAP_MS, retryMs = RETRY_MS }) {
    Object.assign(this, { antics, busy, ambient, calm, random, setTimer, clearTimer, visible, idleMs, gapMs, retryMs });
    this.timer = null;
    this.ambientTimers = []; // one for each ambient thing waiting to start
    this.ambientOn = []; // the ones going now
    this.playing = null; // the antic being played: { name, stop }
    this.stopped = true;
  }

  /** Begin watching: the first antic is a minute of quiet away (never, if calm was asked for). */
  start() {
    this.stopped = false;
    if (this.calm()) return;
    this.arm(this.idleMs);
    this.armAmbient();
  }

  /** Stop for good: whatever is happening ends, and nothing more will. */
  stop() {
    this.stopped = true;
    this.clearTimer(this.timer);
    this.timer = null;
    this.end();
    this.endAmbient();
  }

  /** Somebody did something (clicked, typed, touched, scrolled): whatever is happening ends right away, and the minute starts over. */
  poke() {
    if (this.stopped) return;
    this.end();
    this.endAmbient();
    if (!this.calm()) {
      this.arm(this.idleMs);
      this.armAmbient();
    }
  }

  /** Each ambient thing starts after its own quiet time (if it is a good moment, otherwise it looks again soon). */
  armAmbient() {
    for (const id of this.ambientTimers) this.clearTimer(id);
    this.ambientTimers = this.ambient.map((thing) => this.waitFor(thing, thing.afterMs));
  }

  waitFor(thing, ms) {
    return this.setTimer(() => {
      if (this.stopped) return;
      if (this.calm() || !this.visible() || this.busy()) {
        this.ambientTimers.push(this.waitFor(thing, this.retryMs));
        return;
      }
      this.ambientOn.push(thing);
      thing.start();
    }, ms);
  }

  /** Whatever ambient things are going stop, and the ones still waiting to start are told to wait no more. */
  endAmbient() {
    for (const id of this.ambientTimers) this.clearTimer(id);
    this.ambientTimers = [];
    const going = this.ambientOn;
    this.ambientOn = [];
    for (const thing of going) thing.stop();
  }

  arm(ms) {
    this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.fire();
    }, ms);
  }

  /** The quiet time is up: if it is a good moment, play one antic, otherwise try again soon. */
  fire() {
    if (this.stopped) return;
    if (this.calm() || !this.visible() || this.busy()) {
      this.arm(this.retryMs);
      return;
    }
    const antic = pickAntic(this.antics.filter((candidate) => candidate.can?.() ?? true), this.random);
    if (!antic) {
      this.arm(this.retryMs);
      return;
    }
    this.begin(antic);
  }

  /** Start this antic, and plan for it to end (and for the next one a while after that, if it is still quiet). */
  begin(antic) {
    const { stop, ms } = antic.play();
    this.playing = { name: antic.name, stop };
    this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.end();
      this.arm(between(this.gapMs, this.random));
    }, ms);
  }

  /**
   * Play the antic with this name right now, for trying them out (the address ?antic=dance does this). Gives back false if there is no
   * such antic, or the computer asked for calm. It ends like any other, or the moment anyone clicks.
   */
  playNow(name) {
    if (this.calm() || this.stopped) return false;
    const thing = this.ambient.find((candidate) => candidate.name === name);
    if (thing) {
      if (!this.ambientOn.includes(thing)) {
        this.ambientOn.push(thing);
        thing.start();
      }
      return true;
    }
    const antic = this.antics.find((candidate) => candidate.name === name);
    if (!antic) return false;
    this.end();
    this.begin(antic);
    return true;
  }

  /** Whatever antic is playing stops, now. */
  end() {
    if (!this.playing) return;
    const { stop } = this.playing;
    this.playing = null;
    stop();
  }
}
