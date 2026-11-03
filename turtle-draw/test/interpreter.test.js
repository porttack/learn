// Tests for the interpreter: running blocks and evaluating reporters.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runBlocks, createContext, RunError, Wait } from '../js/core/interpreter.js';
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
  assert.deepEqual(createContext({ turtle: new Turtle() }).boxes, [0, 0, 0]);
});

test('the three boxes are separate', () => {
  const { turtle } = run([
    block('store1', 10),
    block('store2', 20),
    block('store3', 30),
    block('forward', { op: 'box1' }),
    block('forward', { op: 'box2' }),
    block('forward', { op: 'box3' }),
  ]);
  assert.equal(turtle.y, 60);
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
  assert.deepEqual(context.boxes, [10, 20, 30]);
});

test('the pen color readers start at the default red pen', () => {
  const { context } = runWith([block('store1', { op: 'penred' }), block('store2', { op: 'pengreen' }), block('store3', { op: 'penblue' })]);
  assert.deepEqual(context.boxes, [255, 0, 0]);
});

test('a color made with the readers can be used to make a darker one', () => {
  const { turtle } = runWith([
    block('setcolor', 200, 100, 50),
    block('setcolor', op('subtract', { op: 'penred' }, 100), op('subtract', { op: 'pengreen' }, 100), { op: 'penblue' }),
  ]);
  assert.deepEqual(turtle.color, [100, 0, 50]);
});
