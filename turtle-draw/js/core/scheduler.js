// Turtle Draw: the scheduler. It drives the interpreter at a watchable pace.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The interpreter (interpreter.js) is a generator: each time we ask it for
// the next step, it runs one block and pauses. The scheduler's job is to keep
// asking, and to decide what to do between steps:
//
//   slow, medium, fast  wait a little after every block so you can watch.
//   instant             don't wait. Run for about 12 milliseconds, then let
//                       the browser draw a frame, then carry on. That way
//                       even `forever` never locks up the page.
//
// Stop simply stops asking. Nothing else is needed.
//
// Time comes in through options (now, setTimer, ...) so tests can use a fake
// clock and run in an instant.

import { Wait } from './interpreter.js';

/** Milliseconds to wait after each block at each speed. */
export const SPEEDS = Object.freeze({
  slow: 500,
  medium: 100,
  fast: 20,
  instant: 0,
});

const browserDefaults = {
  now: () => performance.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id),
  // Wait for the browser to draw a frame. requestAnimationFrame is paused in
  // background tabs, which is fine: a hidden program just waits.
  nextFrame: () =>
    new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    }),
};

export class Scheduler {
  /**
   * @param {object} [options]
   * @param {(block: object) => void} [options.onStep] after every block runs
   * @param {() => void} [options.onStart] when a program starts
   * @param {(result: {status: string, error?: Error}) => void} [options.onFinish]
   *        when it ends: status is 'done', 'stopped' or 'error'
   * @param {string} [options.speed] one of the keys of SPEEDS
   * @param {number} [options.sliceMs] how long instant mode runs before a frame
   * plus now, setTimer, clearTimer and nextFrame, for tests.
   */
  constructor(options = {}) {
    const merged = { ...browserDefaults, ...options };
    this._now = merged.now;
    this._setTimer = merged.setTimer;
    this._clearTimer = merged.clearTimer;
    this._nextFrame = merged.nextFrame;
    this.onStep = options.onStep ?? null;
    this.onStart = options.onStart ?? null;
    this.onFinish = options.onFinish ?? null;
    this.speed = options.speed ?? 'medium';
    this.sliceMs = options.sliceMs ?? 12;

    this._running = false;
    this._token = 0; // bumped on every start and stop, so old loops notice
    this._wake = null; // cuts the current sleep short
  }

  get running() {
    return this._running;
  }

  /**
   * Run a generator from the interpreter. Only one program runs at a time:
   * starting a new one stops the old one first.
   * Returns a promise for the final { status, error? }.
   */
  start(generator) {
    this.stop();
    this._running = true;
    const token = ++this._token;
    if (this.onStart) this.onStart();
    return this._run(generator, token);
  }

  /** Stop the running program, if there is one, right now. */
  stop() {
    if (!this._running) return;
    this._running = false;
    this._token++;
    if (this._wake) this._wake();
    if (this.onFinish) this.onFinish({ status: 'stopped' });
  }

  async _run(generator, token) {
    let sliceStart = this._now();
    while (true) {
      // stop() or a newer start() already told everyone, so just leave.
      if (token !== this._token) return { status: 'stopped' };

      let step;
      try {
        step = generator.next();
      } catch (error) {
        return this._finish(token, { status: 'error', error });
      }
      if (step.done) return this._finish(token, { status: 'done' });

      // A wait block asks for a real pause, whatever the speed. Stop can cut it short.
      if (step.value instanceof Wait) {
        if (this.onStep) this.onStep(step.value.block);
        await this._sleep(step.value.ms);
        sliceStart = this._now();
        continue;
      }

      if (this.onStep) this.onStep(step.value);

      const delay = SPEEDS[this.speed] ?? SPEEDS.medium;
      if (delay > 0) {
        await this._sleep(delay);
        sliceStart = this._now();
      } else if (this._now() - sliceStart >= this.sliceMs) {
        await this._nextFrame();
        sliceStart = this._now();
      }
    }
  }

  _finish(token, result) {
    if (token === this._token) {
      this._running = false;
      if (this.onFinish) this.onFinish(result);
    }
    return result;
  }

  // A sleep that stop() can cut short.
  _sleep(ms) {
    return new Promise((resolve) => {
      const id = this._setTimer(() => {
        this._wake = null;
        resolve();
      }, ms);
      this._wake = () => {
        this._clearTimer(id);
        this._wake = null;
        resolve();
      };
    });
  }
}
