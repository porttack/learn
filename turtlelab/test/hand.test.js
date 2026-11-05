// Tests for js/core/hand.js: the wobble of a hand drawn line, and the grain of chalk.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HAND_WOBBLE, HAND_STEP, MAX_PIECES, GRAIN_SIZE, newHandLook, wobbleAt, handPoint, handLine, handArc, handSegment, handOutline, chalkGrain,
} from '../js/core/hand.js';
import { seeded } from '../js/core/paper.js';

test('a point never moves more than the wobble, in either direction, anywhere', () => {
  for (let x = -900; x <= 900; x += 37) {
    for (let y = -700; y <= 700; y += 41) {
      const { dx, dy } = wobbleAt(x + 0.5, y - 0.25);
      assert.ok(Math.abs(dx) <= HAND_WOBBLE && Math.abs(dy) <= HAND_WOBBLE, `${x}, ${y}: ${dx}, ${dy}`);
    }
  }
  const { dx, dy } = wobbleAt(10, 10, { amount: 1 });
  assert.ok(Math.abs(dx) <= 1 && Math.abs(dy) <= 1, 'a smaller amount is a smaller wobble');
});

test('the wobble is the same every time, for the same place, and is not the same everywhere', () => {
  assert.deepEqual(wobbleAt(123.4, -56.7), wobbleAt(123.4, -56.7));
  const seen = new Set();
  for (let x = 0; x < 600; x += 10) seen.add(wobbleAt(x, 40).dx.toFixed(3));
  assert.ok(seen.size > 40, 'it wanders');
  let low = Infinity;
  let high = -Infinity;
  for (let x = 0; x < 2000; x += 3) {
    const { dx } = wobbleAt(x, 40);
    low = Math.min(low, dx);
    high = Math.max(high, dx);
  }
  assert.ok(low < -HAND_WOBBLE * 0.5 && high > HAND_WOBBLE * 0.5, `it uses most of its range: ${low} to ${high}`);
});

test('the wobble is smooth: a step of one unit never moves a point much differently, so a line bends and does not zigzag', () => {
  let worst = 0;
  for (let x = -400; x < 400; x += 0.5) {
    const a = wobbleAt(x, 25);
    const b = wobbleAt(x + 1, 25);
    worst = Math.max(worst, Math.abs(a.dx - b.dx), Math.abs(a.dy - b.dy));
  }
  assert.ok(worst < 0.4, `the most it changes in one unit is ${worst}`);
});

test('a point that is not a number does not move', () => {
  assert.deepEqual(wobbleAt(NaN, 5), { dx: 0, dy: 0 });
  assert.deepEqual(wobbleAt(5, Infinity), { dx: 0, dy: 0 });
});

test('a line is cut into short pieces and wobbled, and runs from where a corner there would be to where one at the other end would be', () => {
  const seg = { x1: -100, y1: 20, x2: 140, y2: -60 };
  const points = handLine(seg);
  assert.ok(points.length >= Math.hypot(240, 80) / HAND_STEP, 'short pieces');
  assert.deepEqual(points[0], handPoint(-100, 20));
  assert.deepEqual(points.at(-1), handPoint(140, -60));
  const length = (list) => list.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - list[i].x, p.y - list[i].y), 0);
  assert.ok(length(points) > Math.hypot(240, 80), 'it wanders, so it is longer than straight');
  assert.ok(length(points) < Math.hypot(240, 80) * 1.15, 'but not much');
  // No point is far from the straight line it started as.
  for (const p of points) {
    const across = Math.abs((seg.x2 - seg.x1) * (seg.y1 - p.y) - (seg.x1 - p.x) * (seg.y2 - seg.y1)) / Math.hypot(240, 80);
    assert.ok(across <= HAND_WOBBLE * Math.SQRT2 + 1e-9, `${across}`);
  }
});

test('lines that meet at a corner are moved the same way there, so a drawn shape stays closed', () => {
  const square = [
    { x1: 0, y1: 0, x2: 100, y2: 0 },
    { x1: 100, y1: 0, x2: 100, y2: -100 },
    { x1: 100, y1: -100, x2: 0, y2: -100 },
    { x1: 0, y1: -100, x2: 0, y2: 0 },
  ].map((seg) => handLine(seg));
  for (let i = 0; i < 4; i += 1) assert.deepEqual(square[i].at(-1), square[(i + 1) % 4][0], `corner ${i}`);
});

test('an arc and a line that meet are moved the same way where they meet, and an arc ends where its op says it does', () => {
  const op = { type: 'arc', cx: 0, cy: -50, r: 50, x1: 0, y1: 0, x2: 50, y2: -50, sweep: 90 };
  const points = handArc(op);
  const first = handPoint(0, 0);
  assert.ok(Math.hypot(points[0].x - first.x, points[0].y - first.y) < 1e-9, 'starts where the turtle was');
  const end = handPoint(50, -50);
  assert.ok(Math.hypot(points.at(-1).x - end.x, points.at(-1).y - end.y) < 1e-9, 'ends where the turtle ends up');
  const lineAfter = handLine({ x1: 50, y1: -50, x2: 50, y2: -150 });
  assert.ok(Math.hypot(points.at(-1).x - lineAfter[0].x, points.at(-1).y - lineAfter[0].y) < 1e-9, 'joins the line after it');
  // Every point is about as far from the middle as the radius says.
  for (const p of points) assert.ok(Math.abs(Math.hypot(p.x - 0, p.y + 50) - 50) <= HAND_WOBBLE * Math.SQRT2 + 1e-9);
});

test('a positive sweep curves to the right and a negative one to the left, going up from the middle, the way the arc block does', () => {
  const right = handArc({ type: 'arc', cx: 50, cy: 0, r: 50, x1: 0, y1: 0, sweep: 90 });
  const left = handArc({ type: 'arc', cx: -50, cy: 0, r: 50, x1: 0, y1: 0, sweep: -90 });
  assert.ok(right.at(-1).x > 40 && right.at(-1).y > 40, `right ends up and to the right: ${JSON.stringify(right.at(-1))}`);
  assert.ok(left.at(-1).x < -40 && left.at(-1).y > 40, `left ends up and to the left: ${JSON.stringify(left.at(-1))}`);
  assert.ok(right[Math.floor(right.length / 2)].x > 10 && right[Math.floor(right.length / 2)].y > 10, 'and it goes round the long way: through the middle of the curve');
});

test('a full circle (or more) is drawn all the way round, and a very long line does not take more than the most pieces', () => {
  const circle = handArc({ type: 'arc', cx: 0, cy: -100, r: 100, x1: 0, y1: 0, sweep: 360 });
  const xs = circle.map((p) => p.x);
  assert.ok(Math.min(...xs) < -90 && Math.max(...xs) > 90);
  const far = handLine({ x1: 0, y1: 0, x2: 5e6, y2: 0 });
  assert.equal(far.length, MAX_PIECES + 1);
  assert.equal(handLine({ x1: 5, y1: 5, x2: 5, y2: 5 }).length, 2, 'a dot is still two points, the same one');
  assert.equal(handArc({ type: 'arc', cx: 0, cy: -0.001, r: 0.001, x1: 0, y1: 0, sweep: 5 }).length, 2);
});

test('a segment is handled as a line or an arc by its type, and an outline joins them end to end without repeating the corners', () => {
  assert.deepEqual(handSegment({ type: 'line', x1: 0, y1: 0, x2: 30, y2: 0 }), handLine({ x1: 0, y1: 0, x2: 30, y2: 0 }));
  const arc = { type: 'arc', cx: 0, cy: -50, r: 50, x1: 0, y1: 0, x2: 50, y2: -50, sweep: 90 };
  assert.deepEqual(handSegment(arc), handArc(arc));
  const line = { type: 'line', x1: 50, y1: -50, x2: 50, y2: -90 };
  const outline = handOutline([arc, line]);
  assert.equal(outline.length, handArc(arc).length + handLine(line).length - 1);
  assert.deepEqual(outline.slice(0, 3), handArc(arc).slice(0, 3));
  assert.deepEqual(outline.at(-1), handLine(line).at(-1));
  assert.deepEqual(handOutline([]), []);
});

test('the chalk grain is a tile of see-through specks: always the same, about a quarter missing, some gone and some solid', () => {
  const grain = chalkGrain();
  assert.equal(grain.length, GRAIN_SIZE * GRAIN_SIZE);
  assert.deepEqual(chalkGrain(), grain);
  const mean = grain.reduce((sum, a) => sum + a, 0) / grain.length / 255;
  assert.ok(mean > 0.65 && mean < 0.85, `most of it is there: ${mean}`);
  const clear = grain.filter((a) => a === 0).length / grain.length;
  const solid = grain.filter((a) => a === 255).length / grain.length;
  assert.ok(clear > 0.05 && clear < 0.3, `some specks are gone: ${clear}`);
  assert.ok(solid > 0.4, `much is solid: ${solid}`);
});

test('the grain tile joins up with itself, so copies side by side show no seam', () => {
  const size = 64;
  const grain = chalkGrain(size);
  const at = (x, y) => grain[((y + size) % size) * size + ((x + size) % size)];
  // The step across the seam is no worse than the steps inside the tile (the per-pixel speck makes both rough, so compare the average).
  let inside = 0;
  let across = 0;
  for (let i = 0; i < size; i += 1) {
    inside += Math.abs(at(31, i) - at(32, i)) + Math.abs(at(i, 31) - at(i, 32));
    across += Math.abs(at(size - 1, i) - at(0, i)) + Math.abs(at(i, size - 1) - at(i, 0));
  }
  assert.ok(across < inside * 1.25, `${across} across the seam against ${inside} inside`);
});

// ---- A new look each time ---------------------------------------------------------------------------------


test('a different seed wobbles the lines in different places, the same seed always the same, and no seed is the plain wobble', () => {
  assert.deepEqual(wobbleAt(40, 70, { seed: 5 }), wobbleAt(40, 70, { seed: 5 }));
  assert.deepEqual(wobbleAt(40, 70, { seed: 0 }), wobbleAt(40, 70), 'seed 0 is the plain look every test above used');
  let different = 0;
  let total = 0;
  for (let x = -300; x <= 300; x += 20) {
    for (let y = -200; y <= 200; y += 20) {
      const a = wobbleAt(x, y, { seed: 11 });
      const b = wobbleAt(x, y, { seed: 12 });
      total += 1;
      if (Math.abs(a.dx - b.dx) > 0.3 || Math.abs(a.dy - b.dy) > 0.3) different += 1;
    }
  }
  assert.ok(different / total > 0.6, `most places move differently with another seed: ${different} of ${total}`);
  // A line drawn with another seed is not the same line.
  const seg = { x1: -100, y1: 0, x2: 100, y2: 0 };
  assert.notDeepEqual(handLine(seg, { seed: 1 }), handLine(seg, { seed: 2 }));
  assert.deepEqual(handLine(seg, { seed: 1 }), handLine(seg, { seed: 1 }));
});

test('every seed keeps the wobble in bounds and smooth, and corners still meet', () => {
  for (const seed of [1, 2, 99, 123456, 2147483646]) {
    const look = { seed, amount: 4 };
    let worst = 0;
    let prev = null;
    for (let x = -400; x < 400; x += 0.5) {
      const d = wobbleAt(x, 25, look);
      assert.ok(Math.abs(d.dx) <= 4 && Math.abs(d.dy) <= 4, `seed ${seed}`);
      if (prev) worst = Math.max(worst, Math.abs(d.dx - prev.dx), Math.abs(d.dy - prev.dy));
      prev = d;
    }
    assert.ok(worst < 0.4 * (4 / HAND_WOBBLE), `seed ${seed}: smooth (${worst})`);
    const first = handLine({ x1: 0, y1: 0, x2: 100, y2: 0 }, look);
    const second = handLine({ x1: 100, y1: 0, x2: 100, y2: -100 }, look);
    assert.deepEqual(first.at(-1), second[0], `seed ${seed}: the corner is moved the same way by both lines`);
  }
});

test('a new look is a new seed, a little more or less wobble, a little more or less dirt, and some extra swipes, all within limits', () => {
  assert.deepEqual(newHandLook(seeded(1)), newHandLook(seeded(1)), 'the same chance gives the same look');
  assert.notDeepEqual(newHandLook(seeded(1)), newHandLook(seeded(2)));
  const random = seeded(2026);
  const seen = { seeds: new Set(), amounts: [], dirts: [], swipes: new Set() };
  for (let i = 0; i < 400; i += 1) {
    const look = newHandLook(random);
    assert.ok(Number.isInteger(look.seed) && look.seed >= 0 && look.seed < 2147483647);
    assert.ok(look.amount >= HAND_WOBBLE * 0.75 && look.amount <= HAND_WOBBLE * 1.5 + 1e-9, `${look.amount}`);
    assert.ok(look.dirt >= 0.7 && look.dirt <= 1.5 + 1e-9, `${look.dirt}`);
    assert.ok(Number.isInteger(look.swipes) && look.swipes >= 0 && look.swipes <= 3);
    seen.seeds.add(look.seed);
    seen.amounts.push(look.amount);
    seen.dirts.push(look.dirt);
    seen.swipes.add(look.swipes);
  }
  assert.equal(seen.seeds.size, 400, 'a different seed every time');
  assert.ok(Math.max(...seen.amounts) - Math.min(...seen.amounts) > HAND_WOBBLE * 0.6, 'the wobble really varies');
  assert.ok(Math.max(...seen.dirts) - Math.min(...seen.dirts) > 0.6, 'and so does the dirt');
  assert.deepEqual([...seen.swipes].sort(), [0, 1, 2, 3]);
  // With Math.random (what the page uses), two looks in a row are not the same.
  assert.notDeepEqual(newHandLook(), newHandLook());
});
