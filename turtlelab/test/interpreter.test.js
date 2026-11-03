// Tests for the interpreter: running blocks and evaluating reporters.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runBlocks, createContext, RunError, Wait, MAX_CALL_DEPTH } from '../js/core/interpreter.js';
import { definitionsOf } from '../js/core/definitions.js';
import { Turtle } from '../js/core/turtle.js';
import { BLOCKS } from '../js/core/blocks-spec.js';

/** Run blocks to the end. Returns the turtle and how many steps it took. */
function run(blocks, turtle = new Turtle()) {
  const steps = [...runBlocks(blocks, createContext({ turtle }))];
  return { turtle, steps };
}

const block = (op, ...args) => ({ op, args });
const repeat = (n, ...body) => ({ op: 'repeat', args: [n], body });

test('commands run in order and each one takes one step', () => {
  const { turtle, steps } = run([block('forward', 100), block('right', 90), block('forward', 50)]);
  assert.deepEqual([turtle.x, turtle.y], [50, 100]);
  assert.equal(steps.length, 3);
});

test('each step hands back the block that just ran, for highlighting', () => {
  const a = block('forward', 10);
  const b = block('left', 10);
  const { steps } = run([a, b]);
  assert.equal(steps[0], a);
  assert.equal(steps[1], b);
});

test('repeat 4 [forward 100, right 90] draws a square and ends where it began', () => {
  const { turtle, steps } = run([repeat(4, block('forward', 100), block('right', 90))]);
  assert.equal(turtle.reportedX, 0);
  assert.equal(turtle.reportedY, 0);
  assert.equal(turtle.reportedHeading, 0);
  assert.equal(turtle.ops.filter((op) => op.type === 'line').length, 4);
  assert.equal(steps.length, 8);
});

test('repeats nest', () => {
  const { turtle } = run([repeat(3, repeat(2, block('forward', 10)))]);
  assert.equal(turtle.y, 60);
});

test('repeat with zero, negative or fractional counts', () => {
  assert.equal(run([repeat(0, block('forward', 10))]).turtle.y, 0);
  assert.equal(run([repeat(-3, block('forward', 10))]).turtle.y, 0);
  assert.equal(run([repeat(2.9, block('forward', 10))]).turtle.y, 20);
});

test('a start block does nothing itself, then the blocks under it run', () => {
  const start = { op: 'start', args: [] };
  const { turtle, steps } = run([start, block('forward', 40)]);
  assert.equal(turtle.y, 40);
  assert.equal(steps[0], start, 'start still takes a step, so it can be highlighted');
  assert.equal(steps.length, 2);
});

test('an empty repeat still pauses every lap, so a huge empty loop cannot freeze the tab', () => {
  const { steps } = run([repeat(5)]);
  assert.equal(steps.length, 5);
});

test('a reporter can sit in a socket', () => {
  const { turtle } = run([block('right', 90), block('forward', { op: 'heading' })]);
  assert.equal(turtle.x, 90);
});

test('the x, y and pensize reporters read the turtle', () => {
  const turtle = new Turtle();
  turtle.setXY(7, 9);
  turtle.setPenSize(3);
  run([block('setxy', { op: 'y' }, { op: 'x' })], turtle);
  assert.deepEqual([turtle.x, turtle.y], [9, 7]);
  run([block('setpensize', { op: 'pensize' }), block('forward', { op: 'pensize' })], turtle);
  assert.equal(turtle.penSize, 3);
});

test('turtle and pen blocks all reach the turtle', () => {
  const { turtle } = run([
    block('clean'),
    block('setcolor', 0, 128, 255),
    block('setpensize', 9),
    block('penup'),
    block('setxy', -50, 20),
    block('pendown'),
    block('setheading', 90),
    block('forward', 10),
    block('back', 5),
    block('left', 90),
    block('arc', 90, 10),
    block('fillscreen', 1, 2, 3),
    block('startfill'),
    block('endfill'),
  ]);
  assert.deepEqual(turtle.color, [0, 128, 255]);
  assert.equal(turtle.penSize, 9);
  // forward and back both draw (pen down), the pen-up setxy does not.
  assert.deepEqual(
    turtle.ops.map((op) => op.type),
    ['clear', 'line', 'line', 'arc', 'fillScreen'],
  );
});

/** Run at most `limit` steps, so a block that never ends (forever) can be tried safely. */
function runSome(blocks, limit = 20) {
  const turtle = new Turtle();
  const steps = runBlocks(blocks, createContext({ turtle }));
  for (let i = 0; i < limit; i += 1) {
    if (steps.next().done) break;
  }
  return turtle;
}

test('every block in the spec runs with the values it comes with', () => {
  // A yes-or-no socket cannot be left empty, so give those a real condition.
  const condition = { op: 'equal', args: [0, 0] };
  for (const [op, spec] of Object.entries(BLOCKS)) {
    if (spec.dynamic) continue; // call and input mean nothing without a definition; the function tests below cover them
    const args = spec.args.map((arg) => (arg.type === 'boolean' ? condition : arg.default));
    if (spec.kind === 'reporter') {
      // A yes-or-no reporter goes in an if, a number reporter in a forward.
      const user = spec.returns === 'boolean' ? { op: 'if', args: [{ op, args }], body: [] } : block('forward', { op, args });
      assert.doesNotThrow(() => runSome([user]), `reporter ${op}`);
    } else {
      assert.doesNotThrow(() => runSome([{ op, args, body: [] }]), `block ${op}`);
    }
  }
});

test('a number stored in a box can be read back and used', () => {
  const { turtle } = run([block('store1', 40), block('forward', { op: 'box1' })]);
  assert.equal(turtle.y, 40);
});

test('boxes start at 0', () => {
  const { turtle } = run([block('forward', { op: 'box2' })]);
  assert.equal(turtle.y, 0);
  assert.deepEqual(createContext({ turtle: new Turtle() }).boxes, [0, 0, 0, 0], 'four boxes');
});

test('the four boxes are separate', () => {
  const { turtle } = run([
    block('store1', 10),
    block('store2', 20),
    block('store3', 30),
    block('store4', 40),
    block('forward', { op: 'box1' }),
    block('forward', { op: 'box2' }),
    block('forward', { op: 'box3' }),
    block('forward', { op: 'box4' }),
  ]);
  assert.equal(turtle.y, 100);
});

test('there is no fifth box', () => {
  assert.throws(() => run([block('store5', 1)]), (e) => e instanceof RunError && /store5/.test(e.message));
});

test('a box can hold a value reported by another block', () => {
  const { turtle } = run([block('forward', 10), block('store2', { op: 'y' }), block('back', { op: 'box2' })]);
  assert.equal(turtle.y, 0);
});

test('a box keeps its value through every lap of a loop', () => {
  const { turtle } = run([block('store1', 5), repeat(3, block('forward', { op: 'box1' }))]);
  assert.equal(turtle.y, 15);
});

test('storing again replaces what was in the box', () => {
  const { turtle } = run([block('store1', 5), block('store1', 8), block('forward', { op: 'box1' })]);
  assert.equal(turtle.y, 8);
});

test('a fresh run starts with empty boxes, but a context can be given values to read', () => {
  const turtle = new Turtle();
  const first = createContext({ turtle });
  [...runBlocks([block('store1', 99)], first)];
  assert.equal(first.boxes[0], 99);
  assert.equal(createContext({ turtle }).boxes[0], 0);
  const copy = createContext({ turtle, boxes: first.boxes.slice() });
  assert.equal(copy.boxes[0], 99);
});

test('a store block with an empty socket is an error', () => {
  const bad = block('store1', null);
  assert.throws(() => run([bad]), (error) => error instanceof RunError && error.block === bad);
});

test('an empty socket is an error that names the block', () => {
  const bad = block('forward', null);
  assert.throws(
    () => run([bad]),
    (error) => error instanceof RunError && error.block === bad && /empty box/.test(error.message),
  );
});

test('a missing argument is the same as an empty socket', () => {
  assert.throws(() => run([{ op: 'forward' }]), RunError);
  assert.throws(() => run([block('arc', 90)]), RunError);
});

test('an unknown block is an error that names the block', () => {
  const bad = { op: 'teleport' };
  assert.throws(
    () => run([bad]),
    (error) => error instanceof RunError && error.block === bad && /teleport/.test(error.message),
  );
});

test('an unknown reporter in a socket is an error', () => {
  assert.throws(() => run([block('forward', { op: 'teleport' })]), RunError);
});

test('a number that is too big is an error, not a silent broken picture', () => {
  assert.throws(() => run([block('forward', Infinity)]), RunError);
  assert.throws(() => run([block('forward', NaN)]), RunError);
});

test('an error stops the program at that block, keeping what was already drawn', () => {
  const turtle = new Turtle();
  assert.throws(() => run([block('forward', 10), block('forward', null), block('forward', 10)], turtle));
  assert.equal(turtle.y, 10);
});

// ---- Math, yes-or-no blocks, if, forever, wait, stop, print ----------------------------

/** Run with extra context (a fixed random, a print collector) and return everything. */
function runWith(blocks, extra = {}) {
  const turtle = new Turtle();
  const context = createContext({ turtle, ...extra });
  const steps = [...runBlocks(blocks, context)];
  return { turtle, steps, context };
}

const op = (name, ...args) => ({ op: name, args });
const ifBlock = (condition, ...body) => ({ op: 'if', args: [condition], body });
const forever = (...body) => ({ op: 'forever', args: [], body });
const forwardBy = (value) => block('forward', value);

test('the four operations, and blocks plugged into blocks', () => {
  assert.equal(runWith([forwardBy(op('add', 3, 4))]).turtle.y, 7);
  assert.equal(runWith([forwardBy(op('subtract', 10, 4))]).turtle.y, 6);
  assert.equal(runWith([forwardBy(op('multiply', 6, 7))]).turtle.y, 42);
  assert.equal(runWith([forwardBy(op('divide', 20, 8))]).turtle.y, 2.5);
});

test('nesting decides the order: the inner block is worked out first', () => {
  // (2 + 3) x 4 is 20, and 2 + (3 x 4) is 14.
  assert.equal(runWith([forwardBy(op('multiply', op('add', 2, 3), 4))]).turtle.y, 20);
  assert.equal(runWith([forwardBy(op('add', 2, op('multiply', 3, 4)))]).turtle.y, 14);
});

test('a block with a reporter in either socket still gets the right numbers', () => {
  const { turtle } = runWith([block('store1', 6), block('store2', 4), forwardBy(op('subtract', { op: 'box1' }, { op: 'box2' }))]);
  assert.equal(turtle.y, 2);
});

test('dividing by zero is a friendly error that names the divide block', () => {
  const bad = op('divide', 5, 0);
  assert.throws(() => runWith([forwardBy(bad)]), (e) => e instanceof RunError && e.block === bad && /divide by zero/.test(e.message));
});

test('mod gives the remainder, never negative for a positive divisor, and rejects zero', () => {
  assert.equal(runWith([forwardBy(op('mod', 10, 3))]).turtle.y, 1);
  assert.equal(runWith([forwardBy(op('mod', -1, 5))]).turtle.y, 4);
  assert.throws(() => runWith([forwardBy(op('mod', 5, 0))]), RunError);
});

test('random gives whole numbers for whole ends, and both ends can come up', () => {
  const pick = (r) => runWith([forwardBy(op('random', 1, 6))], { random: () => r }).turtle.y;
  assert.equal(pick(0), 1);
  assert.equal(pick(0.9999999), 6);
  assert.equal(pick(0.5), 4);
});

test('random with a decimal end gives a decimal, and low and high can be either way round', () => {
  assert.equal(runWith([forwardBy(op('random', 0, 1.5))], { random: () => 0.5 }).turtle.y, 0.75);
  assert.equal(runWith([forwardBy(op('random', 10, 1))], { random: () => 0 }).turtle.y, 1);
});

test('one of picks either number', () => {
  assert.equal(runWith([forwardBy(op('oneof', 7, 9))], { random: () => 0.2 }).turtle.y, 7);
  assert.equal(runWith([forwardBy(op('oneof', 7, 9))], { random: () => 0.8 }).turtle.y, 9);
});

test('less than, greater than and equals', () => {
  const answer = (condition) => runWith([ifBlock(condition, forwardBy(1))]).turtle.y === 1;
  assert.equal(answer(op('less', 1, 2)), true);
  assert.equal(answer(op('less', 2, 2)), false);
  assert.equal(answer(op('greater', 3, 2)), true);
  assert.equal(answer(op('greater', 2, 3)), false);
  assert.equal(answer(op('equal', 4, 4)), true);
  assert.equal(answer(op('equal', 4, 5)), false);
});

test('equals ignores tiny rounding errors: 0.1 + 0.2 equals 0.3', () => {
  const same = runWith([ifBlock(op('equal', op('add', 0.1, 0.2), 0.3), forwardBy(1))]).turtle.y;
  assert.equal(same, 1);
});

test('if runs its blocks only when the condition is true, and always takes a step', () => {
  const yes = runWith([ifBlock(op('less', 1, 2), forwardBy(5))]);
  const no = runWith([ifBlock(op('less', 2, 1), forwardBy(5))]);
  assert.equal(yes.turtle.y, 5);
  assert.equal(no.turtle.y, 0);
  assert.equal(no.steps.length, 1, 'a false if still takes one step');
});

test('an if with nothing plugged into it is an error that names the if', () => {
  const bad = { op: 'if', args: [null], body: [] };
  assert.throws(() => runWith([bad]), (e) => e instanceof RunError && e.block === bad && /yes or no/.test(e.message));
});

test('a number where a yes or no is needed, and the other way round, are errors', () => {
  assert.throws(() => runWith([ifBlock(op('add', 1, 1))]), (e) => e instanceof RunError && /yes or no/.test(e.message));
  assert.throws(() => runWith([forwardBy(op('less', 1, 2))]), (e) => e instanceof RunError && /number/.test(e.message));
});

test('forever keeps going, one lap after another, until the program stops it', () => {
  const steps = runBlocks([forever(forwardBy(1))], createContext({ turtle: new Turtle() }));
  for (let i = 0; i < 1000; i += 1) assert.equal(steps.next().done, false);
});

test('forever with nothing inside still pauses every lap, so it cannot freeze the tab', () => {
  const steps = runBlocks([forever()], createContext({ turtle: new Turtle() }));
  for (let i = 0; i < 100; i += 1) assert.equal(steps.next().done, false);
});

test('stop ends a forever, and so ends the whole program', () => {
  const { turtle } = runWith([
    block('store1', 0),
    forever(block('store1', op('add', { op: 'box1' }, 1)), forwardBy(10), ifBlock(op('equal', { op: 'box1' }, 5), { op: 'stop', args: [] })),
    forwardBy(1000),
  ]);
  assert.equal(turtle.y, 50, 'five laps, then stop skips everything after the forever');
});

test('stop inside a repeat and an if ends the whole program, not just the loop', () => {
  const { turtle } = runWith([
    { op: 'repeat', args: [10], body: [forwardBy(1), ifBlock(op('equal', { op: 'y' }, 3), { op: 'stop', args: [] })] },
    forwardBy(100),
  ]);
  assert.equal(turtle.y, 3);
});

test('wait asks for a pause: tenths of a second become milliseconds', () => {
  const waits = runWith([block('wait', 10), block('wait', 2.5)]).steps.filter((x) => x instanceof Wait);
  assert.deepEqual(waits.map((w) => w.ms), [1000, 250]);
});

test('a negative wait is no wait, and a huge wait stays within what a timer can do', () => {
  const [short, long] = runWith([block('wait', -5), block('wait', 1e15)]).steps;
  assert.equal(short.ms, 0);
  assert.equal(long.ms, 2 ** 31 - 1);
});

test('the wait step remembers its block, so it can be highlighted', () => {
  const wait = block('wait', 3);
  assert.equal(runWith([wait]).steps[0].block, wait);
});

test('print sends each value, tidied up, to the context', () => {
  const lines = [];
  runWith([block('print', 7), block('print', op('add', 0.1, 0.2)), block('print', { op: 'heading' })], { print: (line) => lines.push(line) });
  assert.deepEqual(lines, ['7', '0.3', '0']);
});

test('print works when nobody is listening', () => {
  assert.doesNotThrow(() => runWith([block('print', 1)]));
});

// ---- Parentheses and the pen color readers --------------------------------------------------

test('parentheses give back what is inside them', () => {
  assert.equal(runWith([forwardBy(op('paren', 7))]).turtle.y, 7);
  assert.equal(runWith([forwardBy(op('paren', op('add', 3, 4)))]).turtle.y, 7);
});

test('parentheses change nothing: the block inside is still worked out first', () => {
  // (2 + 3) x 4 written with a paren block, and without one, give the same answer.
  const withParens = runWith([forwardBy(op('multiply', op('paren', op('add', 2, 3)), 4))]).turtle.y;
  const without = runWith([forwardBy(op('multiply', op('add', 2, 3), 4))]).turtle.y;
  assert.equal(withParens, 20);
  assert.equal(without, 20);
});

test('parentheses with nothing valid inside are an error, like any socket', () => {
  assert.throws(() => runWith([forwardBy({ op: 'paren', args: [null] })]), RunError);
});

test('% is the remainder (modulo), the same as the old mod block', () => {
  assert.equal(runWith([forwardBy(op('mod', 17, 5))]).turtle.y, 2);
  assert.equal(runWith([forwardBy(op('mod', -1, 5))]).turtle.y, 4);
});

test('the pen color readers report the red, green and blue of the pen', () => {
  const { turtle } = runWith([
    block('setcolor', 10, 20, 30),
    block('store1', { op: 'penred' }),
    block('store2', { op: 'pengreen' }),
    block('store3', { op: 'penblue' }),
  ]);
  assert.deepEqual(turtle.color, [10, 20, 30]);
  const { context } = runWith([block('setcolor', 10, 20, 30), block('store1', { op: 'penred' }), block('store2', { op: 'pengreen' }), block('store3', { op: 'penblue' })]);
  assert.deepEqual(context.boxes.slice(0, 3), [10, 20, 30]);
  assert.equal(context.boxes[3], 0, 'the fourth box was not touched');
});

test('the pen color readers start at the default red pen', () => {
  const { context } = runWith([block('store1', { op: 'penred' }), block('store2', { op: 'pengreen' }), block('store3', { op: 'penblue' })]);
  assert.deepEqual(context.boxes.slice(0, 3), [255, 0, 0]);
});

test('a color made with the readers can be used to make a darker one', () => {
  const { turtle } = runWith([
    block('setcolor', 200, 100, 50),
    block('setcolor', op('subtract', { op: 'penred' }, 100), op('subtract', { op: 'pengreen' }, 100), { op: 'penblue' }),
  ]);
  assert.deepEqual(turtle.color, [100, 0, 50]);
});

test('a note does nothing when it is run, but still takes a step', () => {
  const note = { op: 'note', args: [], text: 'hello' };
  const { turtle, steps } = runWith([note, forwardBy(5)]);
  assert.equal(turtle.y, 5);
  assert.equal(steps[0], note);
});

// ---- if else -------------------------------------------------------------------------------------

const ifElse = (condition, thenBlocks, elseBlocks) => ({ op: 'ifelse', args: [condition], body: thenBlocks, elseBody: elseBlocks });

test('if else runs the first mouth when the condition is true, and only that one', () => {
  const { turtle } = runWith([ifElse(op('less', 1, 2), [forwardBy(10)], [forwardBy(1000)])]);
  assert.equal(turtle.y, 10);
});

test('if else runs the else mouth when the condition is false, and only that one', () => {
  const { turtle } = runWith([ifElse(op('less', 2, 1), [forwardBy(1000)], [block('back', 10)])]);
  assert.equal(turtle.y, -10);
});

test('if else always does one or the other, even with an empty mouth', () => {
  assert.equal(runWith([ifElse(op('less', 2, 1), [forwardBy(5)], [])]).turtle.y, 0);
  assert.equal(runWith([ifElse(op('less', 1, 2), [], [forwardBy(5)])]).turtle.y, 0);
  const noElse = { op: 'ifelse', args: [op('less', 2, 1)], body: [forwardBy(5)] };
  assert.equal(runWith([noElse]).turtle.y, 0, 'a missing else list is the same as an empty one');
});

test('if else takes a step of its own, so it can be seen', () => {
  const block = ifElse(op('less', 1, 2), [], []);
  assert.equal(runWith([block]).steps[0], block);
});

test('an if else with nothing plugged in is an error that names it', () => {
  const bad = { op: 'ifelse', args: [null], body: [], elseBody: [] };
  assert.throws(() => runWith([bad]), (e) => e instanceof RunError && e.block === bad && /yes or no/.test(e.message));
});

test('stop inside the else mouth ends the whole program', () => {
  const { turtle } = runWith([ifElse(op('less', 2, 1), [], [forwardBy(3), { op: 'stop', args: [] }, forwardBy(100)]), forwardBy(1000)]);
  assert.equal(turtle.y, 3);
});

test('if else blocks nest, and a box decides which way each one goes', () => {
  // Counting 1 to 6: even numbers go forward 10, odd numbers go back 1.
  const { turtle } = runWith([
    block('store1', 0),
    {
      op: 'repeat',
      args: [6],
      body: [
        block('store1', op('add', { op: 'box1' }, 1)),
        ifElse(op('equal', op('mod', { op: 'box1' }, 2), 0), [forwardBy(10)], [block('back', 1)]),
      ],
    },
  ]);
  assert.equal(turtle.y, 3 * 10 - 3 * 1);
});

// ---- speed ---------------------------------------------------------------------------------------

/** Run blocks and collect the names a speed block asked for. */
function speedsAsked(blocks) {
  const asked = [];
  runWith(blocks, { setSpeed: (name) => asked.push(name) });
  return asked;
}

test('a speed block picks slow, medium, fast or instant for 1, 2, 3 and 4', () => {
  assert.deepEqual(speedsAsked([block('speed', 1), block('speed', 2), block('speed', 3), block('speed', 4)]), ['slow', 'medium', 'fast', 'instant']);
});

test('a speed off the ends is pulled back to the nearest one, and a fraction is rounded', () => {
  assert.deepEqual(speedsAsked([block('speed', 0), block('speed', -7), block('speed', 99), block('speed', 2.6), block('speed', 2.4)]), ['slow', 'slow', 'instant', 'fast', 'medium']);
});

test('the speed can come from a calculation or a box, and it takes one step like any block', () => {
  const asked = [];
  const run = runWith([block('store1', 3), block('speed', op('add', { op: 'box1' }, 1))], { setSpeed: (name) => asked.push(name) });
  assert.deepEqual(asked, ['instant']);
  assert.equal(run.steps.length, 2);
});

test('a speed block with nothing plugged in says so, and without a listener it does nothing', () => {
  assert.throws(() => runWith([{ op: 'speed', args: [null] }]), (e) => e instanceof RunError);
  assert.doesNotThrow(() => runWith([block('speed', 4)]), 'tests and tools that give no setSpeed are fine');
});

// ---- Blocks you make yourself ----------------------------------------------------------------------

const to = (name, params, ...body) => ({ x: 0, y: 0, blocks: [{ op: 'to', name, params }, ...body] });
const callTo = (name, params, ...args) => ({ op: 'call', name, params, args });
const input = (name) => ({ op: 'input', name });

/** Run `main` in a project that also holds these definition stacks. */
function runWithBlocks(definitions, main, extra = {}) {
  const turtle = new Turtle();
  const { map } = definitionsOf({ stacks: definitions });
  const context = createContext({ turtle, definitions: map, ...extra });
  const steps = [...runBlocks(main, context)];
  return { turtle, steps, context };
}

test('a call runs the blocks under the to block, and the to block itself does nothing', () => {
  const { turtle, steps } = runWithBlocks([to('square', [], repeat(4, forwardBy(100), block('right', 90)))], [callTo('square', [])]);
  assert.equal(turtle.reportedX, 0);
  assert.equal(turtle.reportedY, 0);
  assert.equal(turtle.ops.filter((o) => o.type === 'line').length, 4);
  assert.equal(steps[0].op, 'call', 'the call takes a step of its own, so it can be seen');
});

test('a block with no blocks under it is allowed and does nothing', () => {
  assert.equal(runWithBlocks([to('empty', [])], [callTo('empty', []), forwardBy(5)]).turtle.y, 5);
});

test('the numbers given to a call arrive in the input blocks', () => {
  const defs = [to('go', ['distance', 'turn'], forwardBy(input('distance')), block('right', input('turn')))];
  const { turtle } = runWithBlocks(defs, [callTo('go', ['distance', 'turn'], 60, 90), callTo('go', ['distance', 'turn'], 10, 0)]);
  assert.equal(turtle.reportedHeading, 90);
  assert.equal(turtle.reportedX, 10);
  assert.equal(turtle.reportedY, 60);
});

test('a call can be given a calculation or a box, worked out where the call is', () => {
  const defs = [to('go', ['d'], forwardBy(input('d')))];
  assert.equal(runWithBlocks(defs, [callTo('go', ['d'], op('add', 10, 5))]).turtle.y, 15);
  assert.equal(runWithBlocks(defs, [block('store1', 30), callTo('go', ['d'], { op: 'box1' })]).turtle.y, 30);
});

test('inside a block, an input belongs to that block: a call from inside passes its own on', () => {
  const defs = [
    to('inner', ['m'], forwardBy(input('m'))),
    to('outer', ['n'], callTo('inner', ['m'], op('add', input('n'), 1))),
  ];
  assert.equal(runWithBlocks(defs, [callTo('outer', ['n'], 10)]).turtle.y, 11);
});

test('each call has its own inputs, even when the block calls itself', () => {
  // triangle numbers: forward n, then the same for n - 1, down to 1
  const defs = [to('sum', ['n'], ifBlock(op('greater', input('n'), 0), forwardBy(input('n')), callTo('sum', ['n'], op('subtract', input('n'), 1))))];
  assert.equal(runWithBlocks(defs, [callTo('sum', ['n'], 10)]).turtle.y, 55);
});

test('input names do not care about capital letters, and neither do block names', () => {
  const defs = [to('Square', ['Size'], forwardBy(input('size')))];
  assert.equal(runWithBlocks(defs, [callTo('SQUARE', ['Size'], 7)]).turtle.y, 7);
});

test('an input used outside the block it belongs to says so, and names the block', () => {
  const stray = input('size');
  const error = (() => {
    try {
      runWithBlocks([], [forwardBy(stray)]);
    } catch (e) {
      return e;
    }
  })();
  assert.ok(error instanceof RunError);
  assert.equal(error.block, stray);
  assert.match(error.message, /input size only works inside the block that has it/);
});

test('an input that belongs to a different block than the one running is the same mistake', () => {
  const stray = input('size');
  const defs = [to('a', ['size'], forwardBy(1)), to('b', [], forwardBy(stray))];
  assert.throws(() => runWithBlocks(defs, [callTo('b', [])]), (e) => e instanceof RunError && e.block === stray);
});

test('a call to a block that is not there says what to check', () => {
  const lost = callTo('ghost', []);
  assert.throws(() => runWithBlocks([], [lost]), (e) => e instanceof RunError && e.block === lost && /no block called ghost.*delete.*name/.test(e.message));
});

test('a call with an empty socket is an empty box error, like any other block', () => {
  const defs = [to('go', ['d'], forwardBy(input('d')))];
  const empty = { op: 'call', name: 'go', params: ['d'], args: [null] };
  assert.throws(() => runWithBlocks(defs, [empty]), (e) => e instanceof RunError && e.block === empty && /empty box/.test(e.message));
});

test('stop inside a block only leaves that block, even from inside a loop', () => {
  const defs = [to('quit', [], forwardBy(1), repeat(5, { op: 'stop', args: [] }, forwardBy(1000)), forwardBy(1000))];
  assert.equal(runWithBlocks(defs, [callTo('quit', []), forwardBy(10)]).turtle.y, 11);
});

test('stop outside every block still ends the whole program', () => {
  assert.equal(runWithBlocks([], [forwardBy(3), { op: 'stop', args: [] }, forwardBy(100)]).turtle.y, 3);
});

test('a block that calls itself works, as long as it has a way to stop', () => {
  // a circle by going forward and turning 1 degree, 360 times, written as a block that calls itself
  const defs = [to('circle', ['n'], ifBlock(op('greater', input('n'), 0), forwardBy(1), block('right', 1), callTo('circle', ['n'], op('subtract', input('n'), 1))))];
  const { turtle, context } = runWithBlocks(defs, [callTo('circle', ['n'], MAX_CALL_DEPTH - 1)]);
  assert.equal(turtle.ops.filter((o) => o.type === 'line').length, MAX_CALL_DEPTH - 1);
  assert.equal(context.frames.length, 0, 'every call has finished');
});

test('calls nest as deep as the limit allows even inside loops and ifs, without running out of room', () => {
  // each call sits inside an if and a repeat: the worst a student is likely to write
  const defs = [to('down', ['n'], ifBlock(op('greater', input('n'), 0), repeat(1, callTo('down', ['n'], op('subtract', input('n'), 1)))))];
  assert.doesNotThrow(() => runWithBlocks(defs, [callTo('down', ['n'], MAX_CALL_DEPTH - 1)]));
});

test('a block that calls itself forever stops with a friendly message that names the block and the limit', () => {
  const again = callTo('forever', []);
  const { context } = (() => {
    const turtle = new Turtle();
    const { map } = definitionsOf({ stacks: [to('forever', [], forwardBy(1), again)] });
    const ctx = createContext({ turtle, definitions: map });
    try {
      [...runBlocks([callTo('forever', [])], ctx)];
      assert.fail('it should not finish');
    } catch (e) {
      assert.ok(e instanceof RunError);
      assert.equal(e.block, again, 'the call that went too far is outlined');
      assert.match(e.message, new RegExp(`Your block forever called itself more than ${MAX_CALL_DEPTH} times\\. Does it have a way to stop\\?`));
    }
    return { context: ctx };
  })();
  assert.equal(context.frames.length, 0, 'the calls are unwound, so a new run starts clean');
});

test('the same block can be called many times in a row without the depth building up', () => {
  const defs = [to('dot', [], forwardBy(1))];
  const { turtle } = runWithBlocks(defs, [repeat(2000, callTo('dot', []))]);
  assert.equal(turtle.y, 2000);
});

test('definitions can call each other, and blocks defined later work too', () => {
  const defs = [to('first', [], callTo('second', [])), to('second', [], forwardBy(9))];
  assert.equal(runWithBlocks(defs, [callTo('first', [])]).turtle.y, 9);
});

test('a speed block inside a block you made still reaches the scheduler', () => {
  const asked = [];
  runWithBlocks([to('slow', [], block('speed', 1))], [callTo('slow', [])], { setSpeed: (name) => asked.push(name) });
  assert.deepEqual(asked, ['slow']);
});
