// Tests for the scheduler, using a fake clock so nothing really waits.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Scheduler, SPEEDS, MAX_QUEUED_EVENTS } from '../js/core/scheduler.js';
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

// ---- The ask block: the scheduler waits for a person -----------------------------------------------------------------------------------------------

/** A stand-in for the page's question box: remembers what was asked and lets the test answer, give up or see it cancelled. */
function fakeAsker() {
  const asked = [];
  const asker = {
    asked,
    cancelled: 0,
    onAsk: (question, block) => {
      let settle;
      const request = { answered: new Promise((resolve) => { settle = resolve; }), cancel: () => { asker.cancelled += 1; } };
      asked.push({ question, block, answer: settle });
      return request;
    },
  };
  return asker;
}
const askBlock = { op: 'ask', text: 'How many?' };

test('an ask block waits for the answer, then the program carries on with it in box1', async () => {
  const asker = fakeAsker();
  const log = [];
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onAsk: asker.onAsk, onStep: (b) => log.push(b.op) });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([{ op: 'forward', args: [10] }, askBlock, { op: 'print', args: [{ op: 'box1' }] }], context));
  await flush();
  assert.equal(asker.asked.length, 1);
  assert.equal(asker.asked[0].question, 'How many?');
  assert.equal(asker.asked[0].block, askBlock);
  assert.deepEqual(log, ['forward', 'ask'], 'it has stopped at the ask block, which was reported as the running block');
  assert.ok(sched.running);
  asker.asked[0].answer(7);
  assert.deepEqual(await done, { status: 'done' });
  assert.equal(context.boxes[0], 7);
  assert.deepEqual(log, ['forward', 'ask', 'ask', 'print'], 'the ask block takes a second step once answered, so the strip can show box1');
});

test('Stop while a question is showing takes the question away and ends the run as stopped', async () => {
  const asker = fakeAsker();
  const finishes = [];
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onAsk: asker.onAsk, onFinish: (r) => finishes.push(r.status) });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([askBlock, { op: 'forward', args: [10] }], context));
  await flush();
  sched.stop();
  assert.deepEqual(await done, { status: 'stopped' });
  assert.equal(asker.cancelled, 1, 'the question was taken away');
  assert.deepEqual(finishes, ['stopped'], 'one finish, and it says stopped');
  assert.equal(context.turtle.ops.length, 0, 'nothing after the ask ran');
  asker.asked[0].answer(5); // a late answer to a question that is gone does nothing
  await flush();
  assert.equal(context.boxes[0], 0);
});

test('giving up (the person cancels the question) is the same as Stop', async () => {
  const asker = fakeAsker();
  const finishes = [];
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onAsk: asker.onAsk, onFinish: (r) => finishes.push(r.status) });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([askBlock, { op: 'forward', args: [10] }], context));
  await flush();
  asker.asked[0].answer(null);
  assert.deepEqual(await done, { status: 'stopped' });
  assert.deepEqual(finishes, ['stopped']);
  assert.equal(sched.running, false);
  assert.equal(context.turtle.ops.length, 0);
});

test('with no way to ask, an ask block answers 0 and the program goes straight on', async () => {
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant' });
  const context = createContext({ turtle: new Turtle(), boxes: [9, 0, 0, 0] });
  assert.deepEqual(await sched.start(runBlocks([askBlock, { op: 'forward', args: [{ op: 'box1' }] }], context)), { status: 'done' });
  assert.equal(context.boxes[0], 0);
  // (and a run that is driven by hand, as the tests of the other files do, gets 0 too)
  const hand = createContext({ turtle: new Turtle(), boxes: [9, 0, 0, 0] });
  for (const step of runBlocks([askBlock], hand)) void step;
  assert.equal(hand.boxes[0], 0);
});

test('a question, an answer, a question: each is asked on its own, in order, and keeps decimals and negatives', async () => {
  const asker = fakeAsker();
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onAsk: asker.onAsk });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([{ op: 'ask', text: 'First?' }, { op: 'store2', args: [{ op: 'box1' }] }, { op: 'ask', text: 'Second?' }], context));
  await flush();
  asker.asked[0].answer(-2.5);
  await flush();
  assert.equal(asker.asked.length, 2);
  assert.equal(asker.asked[1].question, 'Second?');
  asker.asked[1].answer(40);
  await done;
  assert.deepEqual(context.boxes, [40, -2.5, 0, 0]);
});

// ---- Click handlers: the scheduler listens ------------------------------------------------------------------------------------------------------

/** A handler's blocks, run the way the page does: the click's place is set when the handler starts. */
const clickAt = (context, x, y, ...blocks) => () => {
  context.mouse = { x, y };
  return runBlocks(blocks, context);
};

test('a program that listens does not end after its last block: it says so, waits, and runs a handler for each click', async () => {
  const finishes = [];
  let listens = 0;
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onFinish: (r) => finishes.push(r.status), onListen: () => { listens += 1; } });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([{ op: 'forward', args: [10] }], context), { listen: true });
  await flush();
  assert.equal(listens, 1, 'it began to listen once its last block had run');
  assert.ok(sched.running && sched.listening, 'and it is still running');
  assert.deepEqual(finishes, []);
  assert.equal(sched.queueEvent(clickAt(context, 30, -40, { op: 'print', args: [{ op: 'mousex' }] }, { op: 'forward', args: [{ op: 'mousey' }] })), true);
  await flush();
  assert.deepEqual([context.mouse.x, context.mouse.y], [30, -40], 'the handler saw where the click was');
  assert.equal(context.turtle.y, 10 + -40, 'and drew with it');
  assert.ok(sched.listening, 'then it listens again');
  sched.stop();
  assert.deepEqual(await done, { status: 'stopped' });
  assert.deepEqual(finishes, ['stopped'], 'only Stop ends it');
});

test('a program that does not listen ends as before, and refuses clicks', async () => {
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant' });
  const context = createContext({ turtle: new Turtle() });
  assert.equal(sched.queueEvent(() => runBlocks([], context)), false, 'nothing is running yet');
  const done = sched.start(runBlocks([{ op: 'forward', args: [10] }], context));
  assert.equal(sched.queueEvent(() => runBlocks([], context)), false, 'it is not listening');
  assert.deepEqual(await done, { status: 'done' });
  assert.equal(sched.listening, false);
});

test('a stop block in the main program ends the whole program, listening too', async () => {
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant' });
  const context = createContext({ turtle: new Turtle() });
  assert.deepEqual(await sched.start(runBlocks([{ op: 'forward', args: [1] }, { op: 'stop', args: [] }, { op: 'forward', args: [99] }], context), { listen: true }), { status: 'done' });
  assert.equal(context.turtle.y, 1);
});

test('a click while the program is in the middle of something waits for the block that is running, runs its handler whole, then the program goes on', async () => {
  const time = fakeTime();
  const log = [];
  const sched = new Scheduler({ ...time, speed: 'slow', onStep: (b) => log.push(b.op + (b.tag ? `:${b.tag}` : '')) });
  const main = (function* () { yield { op: 'a' }; yield { op: 'b' }; yield { op: 'c' }; })();
  const done = sched.start(main, { listen: true }); // the first block has run and the program is sleeping before the second
  assert.deepEqual(log, ['a']);
  assert.equal(sched.queueEvent(() => (function* () { yield { op: 'h', tag: '1' }; yield { op: 'h', tag: '2' }; })()), true);
  for (let i = 0; i < 20 && log.length < 5; i += 1) {
    await flush();
    if (time.timers.some((timer) => timer.live)) time.fire();
  }
  assert.deepEqual(log, ['a', 'h:1', 'h:2', 'b', 'c'], 'the block that was running finished, then the whole handler ran, then the program went on');
  sched.stop();
  await done;
});

test('clicks run one at a time, in order; a handler that stops only ends itself; Stop throws away clicks still waiting', async () => {
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant' });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([], context), { listen: true });
  await flush();
  assert.ok(sched.listening);
  const prints = [];
  const printing = (label, ...blocks) => () => (function* () { prints.push(label); yield* runBlocks(blocks, context); prints.push(`${label} over`); })();
  sched.queueEvent(printing('one', { op: 'forward', args: [1] }, { op: 'stop', args: [] }, { op: 'forward', args: [100] }));
  sched.queueEvent(printing('two', { op: 'forward', args: [2] }));
  await flush();
  assert.deepEqual(prints, ['one', 'one over', 'two', 'two over']);
  assert.equal(context.turtle.y, 3, 'the stop in the first handler ended that handler only: the second still ran, and the program still listens');
  assert.ok(sched.listening);
  // clicks beyond the limit are refused, so a pile never builds up behind a slow handler
  const slow = new Scheduler({ ...fakeTime(), speed: 'slow' });
  const slowContext = createContext({ turtle: new Turtle() });
  const slowDone = slow.start(runBlocks([], slowContext), { listen: true });
  await flush();
  const accepted = Array.from({ length: MAX_QUEUED_EVENTS + 5 }, () => slow.queueEvent(() => runBlocks([{ op: 'forward', args: [1] }], slowContext)));
  assert.equal(accepted.filter(Boolean).length, MAX_QUEUED_EVENTS, 'only so many clicks wait, the rest are refused');
  slow.stop();
  await slowDone;
  sched.stop();
  assert.deepEqual(await done, { status: 'stopped' });
  assert.equal(sched.queueEvent(() => runBlocks([], context)), false, 'a stopped program takes no more clicks');
});

test('a mistake inside a handler ends the program with that mistake, like one in the main program', async () => {
  const results = [];
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onFinish: (r) => results.push(r) });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([], context), { listen: true });
  await flush();
  const block = { op: 'forward', args: [{ op: 'divide', args: [1, 0] }] };
  sched.queueEvent(() => runBlocks([block], context));
  const result = await done;
  assert.equal(result.status, 'error');
  assert.equal(result.error.block.op, 'divide');
  assert.equal(sched.running, false);
});

test('an ask block inside a handler asks, and the click waits behind a question that is already open', async () => {
  const asker = fakeAsker();
  const sched = new Scheduler({ ...fakeTime(), speed: 'instant', onAsk: asker.onAsk });
  const context = createContext({ turtle: new Turtle() });
  const done = sched.start(runBlocks([{ op: 'ask', text: 'Main?' }], context), { listen: true });
  await flush();
  sched.queueEvent(() => runBlocks([{ op: 'ask', text: 'Handler?' }, { op: 'forward', args: [{ op: 'box1' }] }], context));
  await flush();
  assert.deepEqual(asker.asked.map((a) => a.question), ['Main?'], 'the click waits: the question that is open comes first');
  asker.asked[0].answer(5);
  await flush();
  assert.deepEqual(asker.asked.map((a) => a.question), ['Main?', 'Handler?']);
  asker.asked[1].answer(40);
  await flush();
  assert.equal(context.turtle.y, 40);
  assert.ok(sched.listening);
  sched.stop();
  await done;
});
