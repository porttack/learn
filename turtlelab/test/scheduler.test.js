// Tests for the scheduler, using a fake clock so nothing really waits.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Scheduler, SPEEDS } from '../js/core/scheduler.js';
import { RunError, Wait, Pace, runBlocks, createContext } from '../js/core/interpreter.js';
import { Turtle } from '../js/core/turtle.js';

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

test('a wait is a real pause even at instant speed, and the block is reported', async () => {
  const time = fakeTime();
  const seen = [];
  const block = { op: 'wait' };
  function* program() {
    yield new Wait(block, 500);
    yield 'after';
  }
  const sched = new Scheduler({ ...time, speed: 'instant', onStep: (b) => seen.push(b) });
  const done = sched.start(program());
  assert.equal(time.timers.length, 1);
  assert.equal(time.timers[0].ms, 500);
  assert.deepEqual(seen, [block]);
  time.fire();
  await flush();
  assert.deepEqual(await done, { status: 'done' });
  assert.deepEqual(seen, [block, 'after']);
});

test('stop cuts a wait short', async () => {
  const time = fakeTime();
  function* program() {
    yield new Wait({ op: 'wait' }, 60000);
  }
  const sched = new Scheduler({ ...time, speed: 'instant' });
  const done = sched.start(program());
  sched.stop();
  assert.equal(time.timers[0].live, false);
  assert.deepEqual(await done, { status: 'stopped' });
});

// ---- A speed block in a real program, driving a real scheduler ------------------------------

const move = () => ({ op: 'forward', args: [1] });

test('a speed block changes how long the scheduler waits after it, and only from then on', async () => {
  const time = fakeTime();
  const sched = new Scheduler({ ...time, speed: 'slow' });
  const context = createContext({ turtle: new Turtle(), setSpeed: (name) => (sched.speed = name) });
  const done = sched.start(runBlocks([move(), { op: 'speed', args: [4] }, move(), move()], context));
  assert.equal(time.timers[0].ms, SPEEDS.slow, 'the first block ran at the speed the run began with');
  time.fire();
  await flush();
  assert.deepEqual(await done, { status: 'done' });
  assert.equal(time.timers.length, 1, 'after the speed block there was nothing left to wait for');
});

test('a speed block can slow a run down as well as speed it up', async () => {
  const time = fakeTime();
  const sched = new Scheduler({ ...time, speed: 'instant' });
  const context = createContext({ turtle: new Turtle(), setSpeed: (name) => (sched.speed = name) });
  const done = sched.start(runBlocks([move(), { op: 'speed', args: [2] }, move()], context));
  await flush();
  assert.equal(time.timers[0].ms, SPEEDS.medium, 'the block after it waits at medium');
  sched.stop();
  await done;
});

test('a write block is drawn a short line at a time, and a letter takes one step of waiting in all', async () => {
  const letters = 'GoCougars'.length; // the space draws nothing, so it takes no time
  for (const speed of ['slow', 'medium', 'fast']) {
    const time = fakeTime();
    const turtle = new Turtle();
    const ink = [];
    const sched = new Scheduler({ ...time, speed, onStep: () => ink.push(turtle.ops.length) });
    const done = sched.start(runBlocks([{ op: 'write', args: [60], text: 'Go Cougars' }, { op: 'forward', args: [10] }], createContext({ turtle })));
    const waits = [];
    for (let guard = 0; guard < 2000; guard += 1) {
      await flush();
      const live = time.timers.find((entry) => entry.live);
      if (!live) break;
      waits.push(live.ms);
      time.fire();
    }
    assert.deepEqual(await done, { status: 'done' });
    const total = waits.reduce((sum, ms) => sum + ms, 0);
    assert.ok(Math.abs(total - (letters + 1) * SPEEDS[speed]) < 1e-6, `${speed}: ${letters} letters and a forward take ${letters + 1} steps of waiting (${total} ms)`);
    assert.ok(waits.every((ms) => ms >= 16 - 1e-9), `${speed}: no wait is shorter than a frame, the short ones are saved up`);
    assert.ok(ink[0] < ink[ink.length - 1] / 2, `${speed}: after the first step only a little is on the paper (${ink[0]} of ${ink[ink.length - 1]} lines)`);
    if (speed === 'slow') assert.ok(waits.length > letters * 3, `slow: the letters are drawn in many small waits, not one wait a letter (${waits.length})`);
    if (speed === 'fast') assert.ok(waits.length <= letters * 1.5 + 2 && waits.length >= letters / 2, `fast: a letter is about a frame, so about a wait a letter (${waits.length})`);
  }
  // At instant it runs straight through with nothing to wait for.
  const time = fakeTime();
  const sched = new Scheduler({ ...time, speed: 'instant' });
  const result = await sched.start(runBlocks([{ op: 'write', args: [60], text: 'Go Cougars' }], createContext({ turtle: new Turtle() })));
  assert.deepEqual(result, { status: 'done' });
  assert.equal(time.timers.length, 0);
});

test('a Pace step reports its block to onStep, like a Wait does', async () => {
  const seen = [];
  const block = { op: 'write' };
  const time = fakeTime();
  const sched = new Scheduler({ ...time, speed: 'instant', onStep: (b) => seen.push(b) });
  await sched.start((function* () { yield new Pace(block, 0.5); yield new Pace(block, 0.5); })());
  assert.deepEqual(seen, [block, block]);
});

test('a wait block tells onWait how long it will wait, after onStep, and no other block does', async () => {
  const log = [];
  const time = fakeTime();
  const block = { op: 'wait' };
  const sched = new Scheduler({ ...time, speed: 'instant', onStep: (b) => log.push(['step', b.op]), onWait: (ms, b) => log.push(['wait', ms, b.op]) });
  const done = sched.start((function* () { yield { op: 'forward' }; yield new Wait(block, 1500); yield { op: 'right' }; })());
  await flush();
  time.fire();
  await done;
  assert.deepEqual(log, [['step', 'forward'], ['step', 'wait'], ['wait', 1500, 'wait'], ['step', 'right']]);
});
