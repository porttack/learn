// Tests for the interpreter: running blocks and evaluating reporters.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runBlocks, createContext, RunError } from '../js/core/interpreter.js';
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

test('every block in the spec runs with the values it comes with', () => {
  for (const [op, spec] of Object.entries(BLOCKS)) {
    const args = spec.args.map((arg) => arg.default);
    if (spec.kind === 'reporter') {
      assert.doesNotThrow(() => run([block('forward', { op, args })]), `reporter ${op}`);
    } else {
      assert.doesNotThrow(() => run([{ op, args, body: [] }]), `block ${op}`);
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
