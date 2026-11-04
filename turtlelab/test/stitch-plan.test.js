// Tests for js/core/stitch-plan.js: turning the turtle's drawing into stitches.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Turtle } from '../js/core/turtle.js';
import { planStitches, pathsOfOps, simplify, opsSinceClear, DEFAULTS } from '../js/core/stitch-plan.js';

const stitchesOf = (plan) => plan.commands.filter((c) => c.cmd === 'stitch');
const hop = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Draw with a real turtle and keep its ops. */
function draw(program) {
  const t = new Turtle();
  t.clean();
  program(t);
  return t.ops;
}

const square = (t, size = 100) => {
  for (let i = 0; i < 4; i += 1) {
    t.forward(size);
    t.right(90);
  }
};

test('nothing drawn, only pen up moves, and only dots all give no plan', () => {
  assert.equal(planStitches([]), null);
  assert.equal(planStitches(draw((t) => { t.setPenUp(); t.forward(100); })), null);
  assert.equal(planStitches(draw((t) => { t.forward(0); })), null);
});

test('a square becomes about 3 mm stitches, with a stitch exactly on each corner', () => {
  const plan = planStitches(draw((t) => square(t)));
  const spots = stitchesOf(plan);
  // The longer side of the design is 90 mm = 900 tenths, centered on the middle.
  const xs = spots.map((c) => c.x);
  const ys = spots.map((c) => c.y);
  assert.equal(Math.max(...xs) - Math.min(...xs), 900);
  assert.equal(Math.max(...ys) - Math.min(...ys), 900);
  assert.equal(Math.max(...xs) + Math.min(...xs), 0, 'centered across');
  assert.equal(Math.max(...ys) + Math.min(...ys), 0, 'centered up and down');
  for (const corner of [[-450, -450], [450, -450], [450, 450], [-450, 450]]) {
    assert.ok(spots.some((c) => Math.abs(c.x) === Math.abs(corner[0]) && Math.abs(c.y) === Math.abs(corner[1])), `a stitch on the corner ${corner}`);
  }
  // Stitches are between 0.4 and 3 mm (4 and 30 tenths), except the one at the start that stays put.
  for (let i = 2; i < spots.length; i += 1) {
    const length = hop(spots[i - 1], spots[i]);
    assert.ok(length >= 4 && length <= 30 + 1, `stitch ${i} is ${length} tenths`);
  }
  assert.equal(plan.threads.length, 1);
  assert.equal(plan.commands.at(-1).cmd, 'end');
  assert.equal(plan.commands[0].cmd, 'jump', 'the needle hops to where the first line starts');
  assert.equal(plan.widthMm, 90);
});

test('a closed shape ends exactly where it began, with no hop and no cut in the middle', () => {
  const plan = planStitches(draw((t) => square(t)));
  const kinds = plan.commands.map((c) => c.cmd);
  assert.deepEqual(kinds.filter((k) => k !== 'stitch'), ['jump', 'end']);
  const spots = stitchesOf(plan);
  assert.deepEqual([spots[0].x, spots[0].y], [spots.at(-1).x, spots.at(-1).y]);
});

test('the design is scaled so its longer side is the size asked for, and a wide drawing keeps its shape', () => {
  const plan = planStitches(draw((t) => { t.setHeading(90); t.forward(200); t.left(90); t.forward(100); }), { sizeMm: 60 });
  assert.equal(plan.widthMm, 60);
  assert.equal(plan.heightMm, 30);
  const spots = stitchesOf(plan);
  assert.equal(Math.max(...spots.map((c) => c.x)) - Math.min(...spots.map((c) => c.x)), 600);
});

test('a curve is followed closely: every stitch spot is within a fifth of a millimeter of the circle', () => {
  const plan = planStitches(draw((t) => t.arc(360, 100)), { sizeMm: 90 });
  const spots = stitchesOf(plan);
  const radius = 450; // 100 units across the 200 unit circle, scaled to 900 tenths across
  let worst = 0;
  for (const s of spots) worst = Math.max(worst, Math.abs(Math.hypot(s.x, s.y) - radius));
  // The stitches themselves sit on the circle or just inside it where a stitch cuts across.
  assert.ok(worst <= 2.5, `worst spot is ${worst} tenths off the circle`);
  // And the straight stitch between two spots never cuts further than the tolerance inside it.
  for (let i = 1; i < spots.length; i += 1) {
    const mid = { x: (spots[i - 1].x + spots[i].x) / 2, y: (spots[i - 1].y + spots[i].y) / 2 };
    assert.ok(radius - Math.hypot(mid.x, mid.y) <= DEFAULTS.toleranceMm * 10 + 2.5);
  }
  assert.ok(spots.length >= 40 && spots.length <= 140, `${spots.length} stitches round a 90 mm circle`);
});

test('a half circle, a quarter turn and a curve to the left each go the way they were drawn', () => {
  const left = planStitches(draw((t) => t.arc(-90, 100)));
  const right = planStitches(draw((t) => t.arc(90, 100)));
  const a = stitchesOf(left);
  const b = stitchesOf(right);
  // The turtle starts at the origin facing up. Curving right ends up to the right and above; left, to the left.
  assert.ok(a.at(-1).x < a[0].x, 'left curve ends to the left of where it started');
  assert.ok(b.at(-1).x > b[0].x, 'right curve ends to the right of where it started');
  assert.ok(a.at(-1).y > a[0].y && b.at(-1).y > b[0].y, 'both go up');
});

test('two colors give two threads in the order they first appear, one color change, and the colors grouped', () => {
  const plan = planStitches(draw((t) => {
    t.setColor(255, 0, 0); t.forward(100);
    t.setPenUp(); t.setXY(200, 0); t.setPenDown();
    t.setColor(0, 0, 255); t.forward(100);
    t.setPenUp(); t.setXY(400, 0); t.setPenDown();
    t.setColor(255, 0, 0); t.forward(100);
  }));
  assert.deepEqual(plan.threads, [[255, 0, 0], [0, 0, 255]]);
  const kinds = plan.commands.map((c) => c.cmd);
  assert.equal(kinds.filter((k) => k === 'color').length, 1, 'both red lines are stitched together, so only one change');
  const colorAt = kinds.indexOf('color');
  assert.ok(colorAt > 0 && colorAt < kinds.lastIndexOf('jump'));
});

test('a hop between two lines is a jump, and a long hop within one color cuts the thread first', () => {
  const plan = planStitches(draw((t) => {
    t.forward(100);
    t.setPenUp(); t.setXY(300, 0); t.setPenDown();
    t.forward(100);
    t.setPenUp(); t.setXY(310, 300); t.setPenDown();
    t.forward(10);
  }));
  const kinds = plan.commands.map((c) => c.cmd).filter((k) => k !== 'stitch');
  assert.deepEqual(kinds, ['jump', 'trim', 'jump', 'trim', 'jump', 'end']);
});

test('a short hop is just a jump, with no cut', () => {
  const plan = planStitches(draw((t) => {
    t.forward(100);
    t.setPenUp(); t.setXY(10, 100); t.setPenDown();
    t.setXY(10, 200);
  }), { sizeMm: 90 });
  // The gap between the two lines is 10 units of a 200 unit drawing: 4.5 mm at 90 mm. That is over 3 mm, so cut.
  assert.ok(plan.commands.some((c) => c.cmd === 'trim'));
  const small = planStitches(draw((t) => {
    t.forward(300);
    t.setPenUp(); t.setXY(4, 300); t.setPenDown();
    t.setXY(4, 600);
  }));
  // 4 units of 600 is 0.6 mm: a hop, not a cut.
  assert.deepEqual(small.commands.map((c) => c.cmd).filter((k) => k !== 'stitch'), ['jump', 'jump', 'end']);
});

test('stitching starts after the last clear, and fill screen is not stitched', () => {
  const t = new Turtle();
  t.clean();
  t.forward(500);
  t.clean();
  t.fillScreen(10, 20, 30);
  t.forward(100);
  const plan = planStitches(t.ops);
  assert.equal(plan.widthMm, 0);
  assert.equal(plan.heightMm, 90);
  assert.equal(opsSinceClear(t.ops).length, 2);
});

test('a filled shape is stitched round its edge only, and the plan says how many fills were skipped', () => {
  const plan = planStitches(draw((t) => { t.startFill(); square(t); t.endFill(); }));
  assert.equal(plan.skippedFills, 1);
  assert.ok(plan.stitches > 100);
});

test('a pen of size 0 and a pen up walk leave no thread', () => {
  const none = planStitches(draw((t) => { t.setPenSize(0); square(t); }));
  assert.equal(none, null);
});

test('simplify keeps corners and drops points a straight line already passes through', () => {
  const line = [[0, 0], [10, 0.01], [20, 0], [30, -0.02], [40, 0]];
  assert.deepEqual(simplify(line, 0.15), [[0, 0], [40, 0]]);
  const corner = [[0, 0], [20, 0], [20, 20]];
  assert.deepEqual(simplify(corner, 0.15), corner);
});

test('connected lines of one color are one path, and a different color or a gap starts another', () => {
  const ops = draw((t) => {
    t.forward(10); t.right(90); t.forward(10);
    t.setColor(0, 255, 0); t.forward(10);
    t.setPenUp(); t.forward(10); t.setPenDown(); t.forward(10);
  });
  const { paths } = pathsOfOps(ops);
  assert.equal(paths.length, 3);
  assert.equal(paths[0].points.length, 3);
});

test('the same drawing always gives exactly the same plan', () => {
  const ops = draw((t) => { t.setColor(10, 200, 30); t.arc(250, 60); t.right(40); square(t, 70); });
  assert.deepEqual(planStitches(ops), planStitches(ops));
});

test('every plan stays inside what a machine can sew: nothing is further than the design size from the middle', () => {
  for (const size of [20, 60, 90, 130]) {
    const plan = planStitches(draw((t) => { t.arc(300, 80); t.setPenUp(); t.setXY(500, 400); t.setPenDown(); square(t, 150); }), { sizeMm: size });
    for (const c of plan.commands) {
      assert.ok(Math.abs(c.x) <= size * 5 + 1 && Math.abs(c.y) <= size * 5 + 1, `${size} mm: ${c.x},${c.y}`);
      assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
    }
  }
});
