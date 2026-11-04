// Tests for the turtle's geometry and the drawing ops it records.
// Run with: node --test   (from the turtlelab folder)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Turtle, round10, normalizeHeading, sinDeg, cosDeg, arcAngles } from '../js/core/turtle.js';
import { makeColor, clampChannel, toCss, toHex } from '../js/core/color.js';

const near = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, message ?? `${actual} is not close to ${expected}`);

test('a new turtle sits in the middle, facing up, pen down, red, size 5', () => {
  const t = new Turtle();
  assert.deepEqual([t.x, t.y, t.heading], [0, 0, 0]);
  assert.equal(t.penDown, true);
  assert.equal(t.penSize, 5);
  assert.deepEqual(t.color, [255, 0, 0]);
});

test('turning exactly 90 degrees gives exact sine and cosine', () => {
  assert.equal(sinDeg(90), 1);
  assert.equal(cosDeg(90), 0);
  assert.equal(sinDeg(180), 0);
  assert.equal(cosDeg(180), -1);
  assert.equal(sinDeg(270), -1);
  assert.equal(cosDeg(-90), 0);
});

test('forward goes up at heading 0 and right at heading 90', () => {
  const t = new Turtle();
  t.forward(100);
  assert.deepEqual([t.x, t.y], [0, 100]);
  t.right(90);
  t.forward(50);
  assert.deepEqual([t.x, t.y], [50, 100]);
  t.right(90);
  t.forward(100);
  assert.deepEqual([t.x, t.y], [50, 0]);
  t.right(90);
  t.forward(50);
  assert.deepEqual([t.x, t.y], [0, 0]);
});

test('four forward-and-turn steps make a square that closes exactly', () => {
  const t = new Turtle();
  for (let i = 0; i < 4; i++) {
    t.forward(100);
    t.right(90);
  }
  assert.equal(t.x, 0);
  assert.equal(t.y, 0);
  assert.equal(t.heading, 0);
});

test('back moves opposite to the heading without turning', () => {
  const t = new Turtle();
  t.back(30);
  assert.deepEqual([t.x, t.y, t.heading], [0, -30, 0]);
});

test('headings wrap around to 0 up to 360', () => {
  const t = new Turtle();
  t.right(450);
  assert.equal(t.heading, 90);
  t.left(180);
  assert.equal(t.heading, 270);
  t.setHeading(-45);
  assert.equal(t.heading, 315);
  assert.equal(normalizeHeading(360), 0);
});

test('forward at 45 degrees moves equally right and up', () => {
  const t = new Turtle();
  t.setHeading(45);
  t.forward(100);
  near(t.x, 70.71067811865476);
  near(t.y, 70.71067811865476);
});

test('setXY draws a line from the old spot to the new one', () => {
  const t = new Turtle();
  t.setXY(30, -40);
  assert.deepEqual([t.x, t.y], [30, -40]);
  assert.equal(t.ops.length, 1);
  const op = t.ops[0];
  assert.equal(op.type, 'line');
  assert.deepEqual([op.x1, op.y1, op.x2, op.y2], [0, 0, 30, -40]);
  assert.deepEqual(op.color, [255, 0, 0]);
  assert.equal(op.size, 5);
});

test('with the pen up the turtle moves but records no drawing', () => {
  const t = new Turtle();
  t.setPenUp();
  t.forward(100);
  assert.equal(t.y, 100);
  assert.equal(t.ops.length, 0);
  t.setPenDown();
  t.forward(10);
  assert.equal(t.ops.length, 1);
});

test('place moves the turtle without drawing, even with the pen down', () => {
  const t = new Turtle();
  t.place(10, 20);
  assert.deepEqual([t.x, t.y], [10, 20]);
  assert.equal(t.ops.length, 0);
});

test('an arc to the right ends up right and ahead, turned by the sweep', () => {
  const t = new Turtle();
  t.arc(90, 50);
  near(t.x, 50);
  near(t.y, 50);
  assert.equal(t.heading, 90);
  const op = t.ops[0];
  assert.equal(op.type, 'arc');
  near(op.cx, 50);
  near(op.cy, 0);
  assert.equal(op.r, 50);
  assert.equal(op.sweep, 90);
});

test('arcAngles describes the same circle walk the turtle took', () => {
  for (const [sweep, radius, heading] of [[90, 50, 0], [-90, 50, 0], [200, 30, 45], [-270, 80, 300], [360, 10, 10]]) {
    const t = new Turtle();
    t.setXY(5, -7);
    t.setHeading(heading);
    t.arc(sweep, radius);
    const op = t.ops.at(-1);
    const { start, end, ccw } = arcAngles(op);
    // Both ends of the angle range sit on the circle, at the op's endpoints.
    near(op.cx + op.r * Math.cos(start), op.x1);
    near(op.cy + op.r * Math.sin(start), op.y1);
    near(op.cx + op.r * Math.cos(end), op.x2);
    near(op.cy + op.r * Math.sin(end), op.y2);
    assert.equal(ccw, sweep > 0);
    near(Math.abs(end - start), (Math.abs(sweep) * Math.PI) / 180);
  }
});

test('an arc to the left ends up left and ahead, turned the other way', () => {
  const t = new Turtle();
  t.arc(-90, 50);
  near(t.x, -50);
  near(t.y, 50);
  assert.equal(t.heading, 270);
  near(t.ops[0].cx, -50);
});

test('a full 360 degree arc brings the turtle back to where it started', () => {
  const t = new Turtle();
  t.setXY(10, 20);
  t.right(30);
  t.arc(360, 40);
  near(t.x, 10);
  near(t.y, 20);
  assert.equal(t.heading, 30);
});

test('an arc follows the heading: facing right, a right arc dips down', () => {
  const t = new Turtle();
  t.setHeading(90);
  t.arc(90, 50);
  near(t.x, 50);
  near(t.y, -50);
  assert.equal(t.heading, 180);
});

test('an arc with zero angle or zero radius does nothing', () => {
  const t = new Turtle();
  t.arc(0, 50);
  t.arc(90, 0);
  assert.deepEqual([t.x, t.y, t.heading], [0, 0, 0]);
  assert.equal(t.ops.length, 0);
});

test('a negative radius is treated like a positive one', () => {
  const t = new Turtle();
  t.arc(90, -50);
  near(t.x, 50);
  near(t.y, 50);
});

test('set color rounds and clamps each channel into 0 to 255', () => {
  const t = new Turtle();
  t.setColor(300, -20, 127.6);
  assert.deepEqual(t.color, [255, 0, 128]);
  t.setColor(0, 0, 0);
  assert.deepEqual(t.color, [0, 0, 0]);
});

test('set pen size stays between 0 and 500', () => {
  const t = new Turtle();
  t.setPenSize(-3);
  assert.equal(t.penSize, 0);
  t.setPenSize(9999);
  assert.equal(t.penSize, 500);
  t.setPenSize(12);
  assert.equal(t.penSize, 12);
});

test('fill screen records an op and leaves the turtle and pen alone', () => {
  const t = new Turtle();
  t.fillScreen(0, 0, 128);
  assert.deepEqual(t.ops, [{ type: 'fillScreen', color: [0, 0, 128] }]);
  assert.deepEqual(t.color, [255, 0, 0]);
});

test('fill records the lines, then one fill op with the walked path', () => {
  const t = new Turtle();
  t.setColor(0, 0, 255);
  t.startFill();
  for (let i = 0; i < 4; i++) {
    t.forward(100);
    t.right(90);
  }
  t.setColor(0, 255, 0); // the fill keeps the color from when it started
  t.endFill();

  assert.deepEqual(t.ops.map((op) => op.type), ['line', 'line', 'line', 'line', 'fill']);
  const fill = t.ops[4];
  assert.deepEqual(fill.color, [0, 0, 255]);
  assert.equal(fill.segments.length, 4);
  assert.ok(fill.segments.every((s) => s.pen === true));
});

test('moves with the pen up still count as part of the filled shape', () => {
  const t = new Turtle();
  t.startFill();
  t.forward(10);
  t.setPenUp();
  t.forward(10);
  t.endFill();
  const fill = t.ops.at(-1);
  assert.equal(fill.type, 'fill');
  assert.deepEqual(fill.segments.map((s) => s.pen), [true, false]);
  assert.equal(t.ops.filter((op) => op.type === 'line').length, 1);
});

test('end fill with nothing walked, or without a start fill, does nothing', () => {
  const t = new Turtle();
  t.endFill();
  t.startFill();
  t.endFill();
  assert.equal(t.ops.length, 0);
});

test('starting a new fill finishes the one in progress', () => {
  const t = new Turtle();
  t.startFill();
  t.forward(10);
  t.startFill();
  t.forward(10);
  t.endFill();
  assert.equal(t.ops.filter((op) => op.type === 'fill').length, 2);
});

test('clean forgets the picture, resets the turtle and cancels a fill', () => {
  const t = new Turtle();
  t.setColor(1, 2, 3);
  t.setPenSize(20);
  t.setPenUp();
  t.startFill();
  t.forward(10);
  t.clean();
  assert.deepEqual(t.ops, [{ type: 'clear' }]);
  assert.deepEqual([t.x, t.y, t.heading], [0, 0, 0]);
  assert.equal(t.penDown, true);
  assert.equal(t.penSize, 5);
  assert.deepEqual(t.color, [255, 0, 0]);
  t.endFill();
  assert.equal(t.ops.length, 1);
});

test('forget sends the turtle home and drops the recorded ops, but paints nothing', () => {
  const seen = [];
  const t = new Turtle({ onOp: (op) => seen.push(op) });
  t.setColor(1, 2, 3);
  t.forward(50);
  const painted = seen.length;
  t.forget();
  assert.deepEqual([t.x, t.y, t.heading], [0, 0, 0]);
  assert.deepEqual(t.color, [255, 0, 0]);
  assert.deepEqual(t.ops, []);
  assert.equal(seen.length, painted, 'no clear op was sent, so the picture stays');
});

test('every op reaches onOp, even when old ops are dropped to save memory', () => {
  const seen = [];
  const t = new Turtle({ maxOps: 10, onOp: (op) => seen.push(op) });
  for (let i = 0; i < 11; i++) t.forward(1);
  assert.equal(seen.length, 11);
  assert.ok(t.ops.length <= 10);
  assert.equal(t.truncated, true);
});

test('reported numbers are tidy: no tiny rounding noise, no negative zero', () => {
  assert.equal(round10(0.1 + 0.2), 0.3);
  assert.ok(Object.is(round10(-1e-15), 0));
  const t = new Turtle();
  t.setHeading(30);
  t.forward(100);
  t.back(100);
  assert.equal(t.reportedX, 0);
  assert.equal(t.reportedY, 0);
  t.setHeading(359.99999999999);
  assert.equal(t.reportedHeading, 0);
});

test('colors: clamping, css and hex forms', () => {
  assert.equal(clampChannel('12.4'), 12);
  assert.equal(clampChannel(NaN), 0);
  assert.equal(clampChannel(Infinity), 0);
  assert.deepEqual(makeColor(256, -1, 0.5), [255, 0, 1]);
  assert.equal(toCss([1, 2, 3]), 'rgb(1, 2, 3)');
  assert.equal(toHex([255, 0, 16]), '#ff0010');
});

// ---- write: words with the pen ----------------------------------------------------------------------

test('write draws lines in the pen color and thickness, and leaves the turtle where it was', () => {
  const t = new Turtle();
  t.setColor(10, 20, 30);
  t.setPenSize(7);
  t.setXY(-50, 25);
  t.setHeading(33);
  const before = [t.x, t.y, t.heading];
  const opsBefore = t.ops.length;
  t.write('Cougars', 80);
  assert.deepEqual([t.x, t.y, t.heading], before, 'the turtle did not move or turn');
  const drawn = t.ops.slice(opsBefore);
  assert.ok(drawn.length > 100, `${drawn.length} lines`);
  for (const op of drawn) {
    assert.equal(op.type, 'line');
    assert.deepEqual(op.color, [10, 20, 30]);
    assert.equal(op.size, 7);
  }
  // The words start at the turtle and run to the right, whichever way it faces, and up from the line.
  const xs = drawn.flatMap((op) => [op.x1, op.x2]);
  const ys = drawn.flatMap((op) => [op.y1, op.y2]);
  assert.ok(Math.min(...xs) >= -50 - 4 && Math.max(...xs) > -50 + 300, 'runs to the right');
  assert.ok(Math.max(...ys) <= 25 + 80 + 1e-9 && Math.max(...ys) > 25 + 70, 'a capital letter is as tall as the size');
});

test('write does not care whether the pen is up, and a size of nothing writes nothing', () => {
  const t = new Turtle();
  t.setPenUp();
  t.write('Hi', 40);
  assert.ok(t.ops.length > 5, 'pen up still writes');
  const count = t.ops.length;
  for (const size of [0, -5, NaN]) t.write('Hi', size);
  t.write('', 40);
  t.write('é€', 40);
  assert.equal(t.ops.length, count);
});

test('write keeps the size between 1 and 600, and does not disturb a fill that is being collected', () => {
  const tiny = new Turtle();
  tiny.write('H', 0.001);
  const huge = new Turtle();
  huge.write('H', 1e9);
  const height = (t) => Math.max(...t.ops.flatMap((op) => [op.y1, op.y2]));
  assert.ok(Math.abs(height(tiny) - 1) < 1e-9 && Math.abs(height(huge) - 600) < 1e-9);
  const t = new Turtle();
  t.startFill();
  t.forward(10);
  t.write('Hi', 30);
  t.right(90);
  t.forward(10);
  t.endFill();
  const fill = t.ops.find((op) => op.type === 'fill');
  assert.equal(fill.segments.length, 2, 'only the two walks are in the fill, not the letters');
});
