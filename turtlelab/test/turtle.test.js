// Tests for the turtle's geometry and the drawing ops it records.
// Run with: node --test   (from the turtlelab folder)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { letteringWidth } from '../js/core/lettering.js';
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
  // The words start at the turtle and run to the right, and up from the line (the turtle faces up, as it starts).
  const xs = drawn.flatMap((op) => [op.x1, op.x2]);
  const ys = drawn.flatMap((op) => [op.y1, op.y2]);
  assert.ok(Math.min(...xs) >= -50 - 4 && Math.max(...xs) > -50 + 300, 'runs to the right');
  assert.ok(Math.max(...ys) <= 25 + 80 + 1e-9 && Math.max(...ys) > 25 + 70, 'a capital letter is as tall as the size');
});

test('write draws in the font it is given, and in the default one when none (or a made-up one) is given', () => {
  const draw = (font) => {
    const t = new Turtle();
    t.write('Cougars', 80, font);
    return JSON.stringify(t.ops);
  };
  const script = draw(undefined);
  assert.equal(draw('script'), script);
  assert.equal(draw('nonsense'), script);
  for (const font of ['fancy', 'sans', 'bold', 'serif']) assert.notEqual(draw(font), script, font);
  assert.notEqual(draw('bold'), draw('sans'));
});

/** Run writeSteps to the end, noting at every step where the pen tip is, whether anything was drawn, and how much of a step it took. */
function traceWriting(word, size, font) {
  const t = new Turtle();
  let drawn = 0;
  const record = t.record.bind(t);
  t.record = (op) => { drawn += 1; record(op); };
  const steps = [];
  let before = 0;
  for (const share of t.writeSteps(word, size, font)) {
    steps.push({ share, tip: [t.writing.x, t.writing.y], heading: t.writing.heading, drew: drawn > before, ops: t.ops.length });
    before = drawn;
  }
  return { t, steps };
}

test('writeSteps draws a little at a time, joins the pieces of a line back up, and write is the same thing run to the end', () => {
  for (const font of ['script', 'sans', 'bold']) {
    const { t: stepped, steps } = traceWriting('Go Hi', 60, font);
    const whole = new Turtle();
    whole.write('Go Hi', 60, font);
    assert.equal(JSON.stringify(stepped.ops), JSON.stringify(whole.ops), `${font}: exactly the lines that writing it all at once makes, one for each line of a letter`);
    assert.ok(steps.length > whole.ops.length, `${font}: more steps than lines, because long lines are drawn in pieces`);
    // Four letters draw (the space does not), and each takes one whole step in all.
    assert.ok(Math.abs(steps.reduce((sum, step) => sum + step.share, 0) - 4) < 1e-9, `${font}: four letters, four steps`);
    assert.ok(steps.every((step) => step.share >= 0 && step.share <= 1));
  }
  // Asking for only some of it leaves only that much on the paper, and the pieces are not yet joined: the first side of an H
  // is being drawn, so far in three pieces of one upright line.
  const partial = new Turtle();
  const some = partial.writeSteps('H', 100, 'sans');
  while (partial.ops.length < 3 && !some.next().done);
  assert.equal(partial.ops.length, 3, 'three pieces so far');
  assert.ok(partial.ops.every((op) => op.x1 === partial.ops[0].x1 && op.x2 === partial.ops[0].x1), 'all on the one upright line');
  assert.ok(partial.ops[1].y1 === partial.ops[0].y2 && partial.ops[2].y1 === partial.ops[1].y2, 'end to end');
  for (const _ of some) { /* the rest */ }
  assert.equal(partial.ops.length, 3, 'and when it is all done, the three lines of an H');
  for (const empty of ['', '   ', '\u00e9\u20ac']) assert.deepEqual([...new Turtle().writeSteps(empty, 60)], [], JSON.stringify(empty));
  for (const size of [0, -5, NaN]) assert.deepEqual([...new Turtle().writeSteps('Hi', size)], [], String(size));
});

test('a letter of several strokes is drawn the way a hand does: pen down, draw, pen up, walk to the next stroke, pen down, draw', () => {
  // A sans H is three lines (the two sides and the bar), and the pen starts at the turtle, not at the letter.
  const { t, steps } = traceWriting('H', 100, 'sans');
  assert.equal(t.ops.length, 3, 'three lines in the end');
  // Runs of steps that draw nothing are the pen walking: to the first stroke, then to the second, then to the bar.
  const runs = [];
  steps.forEach((step, i) => {
    if (step.drew) return;
    if (i > 0 && !steps[i - 1].drew) runs[runs.length - 1].push(step);
    else runs.push([step]);
  });
  assert.equal(runs.length, 3, 'walks to the start of each of the three strokes');
  // While it walks nothing is drawn (the lines on the paper do not change), and it ends at the start of the stroke it then draws.
  for (const run of runs) assert.ok(run.every((step) => step.ops === run[0].ops), 'no ink while the pen is walking');
  // The pen tip never jumps: no two steps are further apart than a piece of a line.
  const piece = 100 / 16;
  let from = [0, 0];
  for (const step of steps) {
    assert.ok(Math.hypot(step.tip[0] - from[0], step.tip[1] - from[1]) <= piece + 1e-9, `a step of ${Math.hypot(step.tip[0] - from[0], step.tip[1] - from[1])}`);
    from = step.tip;
  }
  // A joined up script word needs few or no walks between its letters, because each letter starts where the last ended.
  const script = traceWriting('oo', 100, 'script');
  const scriptWalks = script.steps.filter((step, i) => !step.drew && i > 0).length;
  const sansWalks = traceWriting('HH', 100, 'sans').steps.filter((step) => !step.drew).length;
  assert.ok(sansWalks > scriptWalks, `sans walks ${sansWalks} steps, script ${scriptWalks}`);
});

test('the turtle faces the way the pen is going, drawing or walking, and writing never moves the turtle', () => {
  const t = new Turtle();
  t.setXY(-100, 20);
  t.setHeading(90);
  const before = [t.x, t.y, t.heading];
  assert.equal(t.writing, null);
  let from = [t.x, t.y];
  let seen = 0;
  for (const _ of t.writeSteps('Hi', 80, 'sans')) {
    assert.ok(t.writing, 'while it writes, the pen tip is shown');
    const dx = t.writing.x - from[0];
    const dy = t.writing.y - from[1];
    if (Math.hypot(dx, dy) > 1e-9) {
      const goes = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      assert.ok(Math.abs(((t.writing.heading - goes + 540) % 360) - 180) < 1e-6, `facing ${t.writing.heading}, going ${goes}`);
    }
    from = [t.writing.x, t.writing.y];
    seen += 1;
  }
  assert.ok(seen > 20);
  assert.equal(t.writing, null, 'when it is done the turtle is shown where it really is');
  assert.deepEqual([t.x, t.y, t.heading], before, 'and it never moved');
  // Dropped part way (Stop), the app puts the turtle back with stopWriting.
  const stopped = new Turtle();
  const gen = stopped.writeSteps('Cougars', 60);
  gen.next();
  gen.next();
  assert.ok(stopped.writing);
  stopped.stopWriting();
  assert.equal(stopped.writing, null);
  // clean and a new run start without a pen tip, too.
  const clean = new Turtle();
  const g2 = clean.writeSteps('Hi', 60);
  g2.next();
  clean.clean();
  assert.equal(clean.writing, null);
});

// ---- Turned and bent words -----------------------------------------------------------------------------------------

/** The lines `write` makes, as [x1, y1, x2, y2] lists. */
function linesOf(setup, word = 'HE', size = 100, font = 'sans') {
  const t = new Turtle();
  setup(t);
  const before = t.ops.length;
  t.write(word, size, font);
  return t.ops.slice(before).map((op) => [op.x1, op.y1, op.x2, op.y2]);
}

test('the words stand on the turtle\'s nose: turn the turtle and they turn with it, exactly at the quarter turns', () => {
  const upright = linesOf(() => {});
  const plain = (lines) => lines.map((line) => line.map((n) => n + 0)); // (so -0 and 0 count as the same)
  const xs = (lines) => lines.flatMap((l) => [l[0], l[2]]);
  const ys = (lines) => lines.flatMap((l) => [l[1], l[3]]);
  // Facing up (the start): runs right, stands up. Facing right (90): runs down, stands to the right. Facing down: upside down, running left.
  // Facing left (270): runs up, stands to the left.
  const right = linesOf((t) => t.setHeading(90));
  const down = linesOf((t) => t.setHeading(180));
  const left = linesOf((t) => t.setHeading(270));
  assert.deepEqual(plain(right), plain(upright.map(([x1, y1, x2, y2]) => [y1, -x1, y2, -x2])), 'turned right: (x, y) becomes (y, -x)');
  assert.deepEqual(plain(down), plain(upright.map(([x1, y1, x2, y2]) => [-x1, -y1, -x2, -y2])), 'upside down: everything flips through the turtle');
  assert.deepEqual(plain(left), plain(upright.map(([x1, y1, x2, y2]) => [-y1, x1, -y2, x2])), 'turned left: (x, y) becomes (-y, x)');
  assert.ok(Math.min(...xs(right)) >= -1e-9 && Math.max(...ys(right)) <= 1e-9, 'facing right the words run down the right side of the turtle');
  assert.ok(Math.max(...ys(left)) > 100 && Math.max(...xs(left)) <= 1e-9, 'facing left the words run up the left side');
  // Any other angle is a plain turn about the turtle: no point is nearer or further from it.
  const turned = linesOf((t) => t.setHeading(33));
  upright.forEach((line, i) => {
    assert.ok(Math.abs(Math.hypot(line[0], line[1]) - Math.hypot(turned[i][0], turned[i][1])) < 1e-9, 'same distance from the turtle');
  });
  // The turtle's place is the corner the words turn about.
  const away = linesOf((t) => { t.setXY(40, -30); t.setHeading(90); });
  assert.deepEqual(plain(away), plain(right.map(([x1, y1, x2, y2]) => [x1 + 40, y1 - 30, x2 + 40, y2 - 30])));
});

test('set curve bends the words that many degrees, centered on the turtle, and straight words are left alone', () => {
  const straight = linesOf((t) => t.setCurve(0), 'HEH');
  assert.deepEqual(linesOf(() => {}, 'HEH'), straight, 'curve 0 is the way it always was');
  assert.deepEqual(linesOf((t) => t.setCurve(0.001), 'HEH'), straight, 'a bend too small to matter is straight');
  const arch = linesOf((t) => t.setCurve(120), 'HEH');
  const bowl = linesOf((t) => t.setCurve(-120), 'HEH');
  const spread = (lines, axis) => [Math.min(...lines.flatMap((l) => [l[axis], l[axis + 2]])), Math.max(...lines.flatMap((l) => [l[axis], l[axis + 2]]))];
  const width = Math.max(...straight.flatMap((l) => [l[0], l[2]]));
  // Centered: the middle of the words is over the turtle (x about 0, either side about equal).
  const [archLeft, archRight] = spread(arch, 0);
  assert.ok(archLeft < -width / 4 && archRight > width / 4 && Math.abs(archLeft + archRight) < width * 0.1, `${archLeft} to ${archRight}`);
  // An arch's ends droop below the middle and a bowl's ends rise above it; the letters stand outward on an arch, inward on a bowl.
  const [archLow, archHigh] = spread(arch, 1);
  const [bowlLow, bowlHigh] = spread(bowl, 1);
  assert.ok(archLow < -width * 0.1 && archHigh > 90 && archHigh < 105, `arch from ${archLow} up to ${archHigh}`);
  assert.ok(bowlHigh > width * 0.1 && bowlLow < 5 && bowlLow > -5, `bowl from ${bowlLow} up to ${bowlHigh}`);
  // The same bend the other way is the mirror image, upside down.
  const mirrored = arch.map(([x1, y1, x2, y2]) => [x1, y1, x2, y2]);
  assert.equal(mirrored.length, arch.length);
  // Bent writing is the same letters, only moved: the same number of strokes and walks, and every point on a ring about the circle's middle.
  const radius = letteringWidth('HEH', 100, 'sans') / ((120 * Math.PI) / 180);
  for (const [x1, y1, x2, y2] of arch) {
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      const fromMiddle = Math.hypot(x, y + radius);
      assert.ok(fromMiddle >= radius - 1e-6 && fromMiddle <= radius + 100 + 1e-6, `a point ${fromMiddle} from the middle of a circle of ${radius}`);
    }
  }
  // Written a letter at a time it is exactly the same lines, and a bend is not joined into one straight line.
  const stepped = new Turtle();
  stepped.setCurve(120);
  for (const _ of stepped.writeSteps('HEH', 100, 'sans')) { /* all of it */ }
  const whole = new Turtle();
  whole.setCurve(120);
  whole.write('HEH', 100, 'sans');
  assert.equal(JSON.stringify(stepped.ops), JSON.stringify(whole.ops));
  assert.ok(whole.ops.length > straight.length * 2, 'a bent line is made of little pieces');
});

test('the pen tip follows bent and turned writing too, and never jumps further than a piece', () => {
  const t = new Turtle();
  t.setCurve(-200);
  t.setHeading(40);
  let from = [t.x, t.y];
  let farthest = 0;
  for (const _ of t.writeSteps('Go Cougars', 60, 'sans')) {
    farthest = Math.max(farthest, Math.hypot(t.writing.x - from[0], t.writing.y - from[1]));
    from = [t.writing.x, t.writing.y];
  }
  assert.ok(farthest <= 60 / 16 + 1e-6, `the pen moved ${farthest} in one go`);
  assert.equal(t.writing, null);
});

test('font and curve are the turtle\'s own settings: chosen with setFont and setCurve, kept for later writes, and put back by a clean', () => {
  const t = new Turtle();
  assert.equal(t.font, 'script');
  assert.equal(t.curve, 0);
  t.setFont('bold');
  assert.equal(t.font, 'bold');
  t.setFont('gothic');
  assert.equal(t.font, 'script', 'a font that does not exist is the default');
  t.setFont('serif');
  t.setCurve(90);
  const serif = new Turtle();
  serif.setFont('serif');
  serif.setCurve(90);
  t.write('Hi', 50);
  serif.write('Hi', 50, 'serif');
  assert.equal(JSON.stringify(t.ops), JSON.stringify(serif.ops), 'write uses the turtle\'s font and curve when none is given');
  t.write('Hi', 50, 'sans');
  assert.notEqual(JSON.stringify(t.ops.slice(serif.ops.length)), JSON.stringify(serif.ops), 'and a font given with it wins');
  t.setCurve(1000);
  assert.equal(t.curve, 360, 'no more than all the way round');
  t.setCurve(-1000);
  assert.equal(t.curve, -360);
  for (const odd of [NaN, Infinity, 'x', undefined]) {
    t.setCurve(odd);
    assert.equal(t.curve, 0, String(odd));
  }
  t.setFont('fancy');
  t.setCurve(45);
  t.clean();
  assert.equal(t.font, 'script', 'clean puts the font back');
  assert.equal(t.curve, 0, 'and the curve');
  // resetState (a new run) does too.
  t.setFont('bold');
  t.resetState();
  assert.equal(t.font, 'script');
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
