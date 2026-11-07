// TurtleLab: the scheduler. It drives the interpreter at a watchable pace.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The interpreter (interpreter.js) is a generator: each time we ask it for
// the next step, it runs one block and pauses. The scheduler's job is to keep
// asking, and to decide what to do between steps:
//
//   slow, medium, fast  wait a little after every block so you can watch. (The
//                       write block is drawn a short line at a time, each a part of
//                       a step, so a letter takes one step's wait in all.)
//   instant             don't wait. Run for about 12 milliseconds, then let
//                       the browser draw a frame, then carry on. That way
//                       even `forever` never locks up the page.
//
// Stop simply stops asking. Nothing else is needed.
//
// A program that has click handlers is started with { listen: true }: when its last block has run it does not end, it listens, and each click the
// page hands over (queueEvent) runs a handler, until Stop. A click waits for the block that is running to finish, then its handler runs from start
// to end (a wait or a question inside it takes its time as usual) before the program carries on, so two things never draw at once.
//
// Time comes in through options (now, setTimer, ...) so tests can use a fake
// clock and run in an instant.

import { Ask, Pace, STOP, Wait } from './interpreter.js';

/**
 * A part of a step shorter than this is not worth stopping for: the browser draws about once in this long, so the wait
 * is saved up until it adds up to a frame (see Pace), and nothing is lost. (Milliseconds.)
 */
const FRAME_MS = 16;

/** How many clicks can be waiting for their turn. More than that (a slow handler and a fast hand) are dropped, so a pile never builds up. */
export const MAX_QUEUED_EVENTS = 10;

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
   * @param {() => void} [options.onListen] when a program that listens for clicks has run its last block and now waits for them
   * @param {(ms: number, block: object) => void} [options.onWait] when a wait block starts to wait, and for how long
   * @param {(question: string, block: object) => {answered: Promise<number|null>, cancel: () => void}} [options.onAsk]
   *        when an ask block needs a number: show the question; `answered` settles with the number, or with null if the person
   *        gave up (which stops the program), and `cancel` is called if the program is stopped while the question is showing.
   *        Without it nobody is asked and the answer is 0.
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
    this.onListen = options.onListen ?? null;
    this.onWait = options.onWait ?? null;
    this.onAsk = options.onAsk ?? null;
    this.onFinish = options.onFinish ?? null;
    this.speed = options.speed ?? 'medium';
    this.sliceMs = options.sliceMs ?? 12;

    this._running = false;
    this._token = 0; // bumped on every start and stop, so old loops notice
    this._wake = null; // cuts the current sleep short
    this._listen = false; // does the program that is running wait for clicks when it is done
    this._listening = false; // ... and has it got to that
    this._queue = []; // clicks waiting for their turn: each is a function that makes the generator for its handler
    this._eventWaiter = null; // wakes the program when it is listening and a click arrives
  }

  get running() {
    return this._running;
  }

  /** True once a program that listens for clicks has run its last block, and is waiting for them. */
  get listening() {
    return this._running && this._listening;
  }

  /**
   * Run a generator from the interpreter. Only one program runs at a time:
   * starting a new one stops the old one first.
   * With `listen: true` the program does not end after its last block: it waits for clicks (see queueEvent) until Stop.
   * Returns a promise for the final { status, error? }.
   */
  start(generator, { listen = false } = {}) {
    this.stop();
    this._running = true;
    this._listen = listen;
    this._listening = false;
    this._queue = [];
    const token = ++this._token;
    if (this.onStart) this.onStart();
    return this._run(generator, token);
  }

  /**
   * A click on the paper: run a handler. `makeGenerator` is called when the handler is about to start (so what it needs to know, like where
   * the click was, can be set then) and gives the generator to run. Returns false when the click is not wanted: no program is running, the
   * program does not listen, or too many clicks are already waiting.
   */
  queueEvent(makeGenerator) {
    if (!this._running || !this._listen || this._queue.length >= MAX_QUEUED_EVENTS) return false;
    this._queue.push(makeGenerator);
    this._eventWaiter?.();
    return true;
  }

  /** Stop the running program, if there is one, right now. */
  stop() {
    if (!this._running) return;
    this._running = false;
    this._listening = false;
    this._queue = [];
    this._token++;
    if (this._wake) this._wake();
    if (this.onFinish) this.onFinish({ status: 'stopped' });
  }

  async _run(generator, token) {
    let sliceStart = this._now();
    let owed = 0; // waiting saved up from parts of a step, not yet done
    let reply; // what an ask block was told, handed to the generator with its next step
    let handler = null; // the generator of the click being run right now, if there is one
    let mainDone = false;
    while (true) {
      // stop() or a newer start() already told everyone, so just leave.
      if (token !== this._token) return { status: 'stopped' };

      // A click waits for the block that is running to finish, then its handler runs to the end before the program goes on.
      let thread;
      try {
        if (handler === null && this._queue.length > 0) handler = this._queue.shift()();
        thread = handler ?? (mainDone ? null : generator);
      } catch (error) {
        return this._finish(token, { status: 'error', error });
      }
      if (thread === null) {
        await this._waitForEvent(); // the program is done and listening: nothing to do until a click (or Stop)
        sliceStart = this._now();
        continue;
      }

      let step;
      try {
        step = thread.next(reply);
        reply = undefined;
      } catch (error) {
        return this._finish(token, { status: 'error', error });
      }
      if (step.done) {
        if (thread === handler) {
          handler = null; // (a stop block in a handler only ends that handler)
          continue;
        }
        mainDone = true;
        if (step.value === STOP || !this._listen) return this._finish(token, { status: 'done' });
        this._listening = true;
        if (this.onListen) this.onListen();
        continue;
      }

      // An ask block needs a number from a person. The block lights up while the question shows, and Stop (or giving up) ends the program.
      if (step.value instanceof Ask) {
        if (this.onStep) this.onStep(step.value.block);
        const answer = await this._ask(step.value);
        if (token !== this._token) return { status: 'stopped' };
        if (answer === null) {
          this.stop(); // the person gave up: the same as pressing Stop
          return { status: 'stopped' };
        }
        reply = answer;
        sliceStart = this._now();
        continue;
      }

      // A wait block asks for a real pause, whatever the speed. Stop can cut it short.
      if (step.value instanceof Wait) {
        if (this.onStep) this.onStep(step.value.block);
        if (this.onWait) this.onWait(step.value.ms, step.value.block);
        await this._sleep(step.value.ms);
        sliceStart = this._now();
        continue;
      }

      const delay = SPEEDS[this.speed] ?? SPEEDS.medium;

      // A part of a step (a short line of a letter being written): its share of the wait, saved up until it is worth a frame.
      if (step.value instanceof Pace) {
        if (this.onStep) this.onStep(step.value.block);
        if (delay > 0) {
          owed += delay * step.value.share;
          if (owed >= FRAME_MS) {
            const wait = owed;
            owed = 0;
            await this._sleep(wait);
            sliceStart = this._now();
          }
        } else if (this._now() - sliceStart >= this.sliceMs) {
          await this._nextFrame();
          sliceStart = this._now();
        }
        continue;
      }

      if (this.onStep) this.onStep(step.value);

      if (delay > 0) {
        const wait = delay + owed; // any waiting still saved up is done now, so a letter never takes less than its time
        owed = 0;
        await this._sleep(wait);
        sliceStart = this._now();
      } else if (this._now() - sliceStart >= this.sliceMs) {
        await this._nextFrame();
        sliceStart = this._now();
      }
    }
  }

  // Sleep until a click arrives or the program is stopped.
  _waitForEvent() {
    return new Promise((resolve) => {
      const wake = () => {
        this._eventWaiter = null;
        this._wake = null;
        resolve();
      };
      this._eventWaiter = wake;
      this._wake = wake;
    });
  }

  // Show a question and wait for the number. Stop cuts it short (and takes the question away). With no way to ask, the answer is 0.
  _ask(step) {
    if (!this.onAsk) return Promise.resolve(0);
    return new Promise((resolve) => {
      const request = this.onAsk(step.text, step.block);
      this._wake = () => {
        this._wake = null;
        request.cancel?.();
        resolve(null);
      };
      request.answered.then((answer) => {
        if (this._wake === null) return; // stopped already
        this._wake = null;
        resolve(answer);
      });
    });
  }

  _finish(token, result) {
    if (token === this._token) {
      this._running = false;
      this._listening = false;
      this._queue = [];
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
