// Tests for the scheduler, using a fake clock so nothing really waits.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Scheduler, SPEEDS } from '../js/core/scheduler.js';
import { RunError } from '../js/core/interpreter.js';

/** A clock the test controls. */
function fakeTime({ tickPerNow = 0 } = {}) {
  let t = 0;
  const timers = [];
  const frames = [];
  return {
    timers,
    frames,
    now: () => {
      t += tickPerNow;
      return t;
    },
    setTimer: (fn, ms) => {
      timers.push({ fn, ms, live: true });
      return timers.length - 1;
    },
    clearTimer: (id) => {
      timers[id].live = false;
    },
    nextFrame: () => new Promise((resolve) => frames.push(resolve)),
    /** Fire the oldest timer that is still waiting. */
    fire() {
      const timer = timers.find((entry) => entry.live);
      timer.live = false;
      timer.fn();
    },
  };
}

// Let promise callbacks run.
const flush = () => new Promise((resolve) => setImmediate(resolve));

function* steps(count) {
  for (let i = 0; i < count; i++) yield `step ${i}`;
}

function* forever() {
  while (true) yield 'step';
}

test('speeds: slow is slower than fast, and instant does not wait', () => {
  assert.ok(SPEEDS.slow > SPEEDS.medium);
  assert.ok(SPEEDS.medium > SPEEDS.fast);
  assert.ok(SPEEDS.fast > SPEEDS.instant);
  assert.equal(SPEEDS.instant, 0);
});

test('instant mode runs a short program straight through without waiting', async () => {
  const time = fakeTime();
  const seen = [];
  const sched = new Scheduler({ ...time, speed: 'instant', onStep: (s) => seen.push(s) });
  const result = await sched.start(steps(3));
  assert.deepEqual(result, { status: 'done' });
  assert.equal(seen.length, 3);
  assert.equal(time.frames.length, 0);
  assert.equal(time.timers.length, 0);
});

test('instant mode hands the browser a frame after each time slice, so forever cannot freeze it', async () => {
  const time = fakeTime({ tickPerNow: 1 }); // every look at the clock costs 1 ms
  const seen = [];
  const finished = [];
  const sched = new Scheduler({
    ...time,
    speed: 'instant',
    onStep: (s) => seen.push(s),
    onFinish: (r) => finished.push(r.status),
  });
  const done = sched.start(forever());

  // It ran for about one slice and then asked for a frame instead of looping on.
  assert.equal(time.frames.length, 1);
  assert.ok(seen.length > 0 && seen.length < 100, `ran ${seen.length} steps in one slice`);

  sched.stop();
  time.frames.shift()();
  assert.deepEqual(await done, { status: 'stopped' });
  assert.deepEqual(finished, ['stopped']);
});

test('slower speeds wait after every step', async () => {
  const time = fakeTime();
  const seen = [];
  const sched = new Scheduler({ ...time, speed: 'fast', onStep: (s) => seen.push(s) });
  const done = sched.start(steps(2));

  assert.equal(seen.length, 1);
  assert.equal(time.timers.length, 1);
  assert.equal(time.timers[0].ms, SPEEDS.fast);

  time.fire();
  await flush();
  assert.equal(seen.length, 2);

  time.fire();
  await flush();
  assert.deepEqual(await done, { status: 'done' });
});

test('changing the speed mid-run takes effect on the next step', async () => {
  const time = fakeTime();
  const sched = new Scheduler({ ...time, speed: 'slow' });
  const done = sched.start(steps(3));
  assert.equal(time.timers[0].ms, SPEEDS.slow);
  sched.speed = 'fast';
  time.fire();
  await flush();
  assert.equal(time.timers[1].ms, SPEEDS.fast);
  sched.stop();
  await done;
});

test('stop cuts a sleep short and ends the run', async () => {
  const time = fakeTime();
  const finished = [];
  const sched = new Scheduler({ ...time, speed: 'slow', onFinish: (r) => finished.push(r.status) });
  const done = sched.start(forever());
  assert.equal(sched.running, true);

  sched.stop();
  assert.equal(sched.running, false);
  assert.equal(time.timers[0].live, false, 'the pending timer was cancelled');
  assert.deepEqual(await done, { status: 'stopped' });
  assert.deepEqual(finished, ['stopped']);
});

test('stop with nothing running does nothing', () => {
  const finished = [];
  const sched = new Scheduler({ ...fakeTime(), onFinish: (r) => finished.push(r) });
  sched.stop();
  assert.deepEqual(finished, []);
});

test('starting a program while another runs stops the old one first', async () => {
  const time = fakeTime();
  const events = [];
  const sched = new Scheduler({
    ...time,
    speed: 'instant',
    onStart: () => events.push('start'),
    onFinish: (r) => events.push(r.status),
  });
  // The first program waits forever for a frame, the second finishes at once.
  const slow = fakeTime({ tickPerNow: 1 });
  const first = new Scheduler({ ...slow, speed: 'instant' }).start(forever());
  first.catch(() => {});

  sched.speed = 'fast';
  const a = sched.start(forever());
  const b = sched.start(steps(1));
  assert.deepEqual(await a, { status: 'stopped' });
  time.fire();
  await flush();
  assert.deepEqual(await b, { status: 'done' });
  assert.deepEqual(events, ['start', 'stopped', 'start', 'done']);
});

test('an error from the program ends the run and is passed on', async () => {
  const time = fakeTime();
  const finished = [];
  const sched = new Scheduler({ ...time, speed: 'instant', onFinish: (r) => finished.push(r) });
  const oops = new RunError('oops');
  function* broken() {
    yield 'one';
    throw oops;
  }
  const result = await sched.start(broken());
  assert.equal(result.status, 'error');
  assert.equal(result.error, oops);
  assert.equal(finished.length, 1);
  assert.equal(sched.running, false);
});

test('a finished program leaves the scheduler ready to run another', async () => {
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant' });
  assert.deepEqual(await sched.start(steps(1)), { status: 'done' });
  assert.deepEqual(await sched.start(steps(2)), { status: 'done' });
});
