// Tests for js/core/fit.js: finding everything that was drawn, and the zoom that fits it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Turtle, PAPER_W, PAPER_H } from '../js/core/turtle.js';
import {
  DEFAULT_DRAW_VIEW, FIT_MARGIN, MAX_DRAW_ZOOM, MIN_DRAW_ZOOM,
  visibleOps, boundsOfOps, drawingBounds, fitView, worldToPaper, paperToWorld, isDefaultView, sameView,
} from '../js/core/fit.js';

const near = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
const line = (x1, y1, x2, y2, size = 0) => ({ type: 'line', x1, y1, x2, y2, color: [0, 0, 0], size });

test('a clear or a fill screen hides everything before it', () => {
  const ops = [line(0, 0, 1, 1), { type: 'clear' }, line(0, 0, 5, 5), { type: 'fillScreen', color: [1, 2, 3] }, line(2, 2, 3, 3)];
  const seen = visibleOps(ops);
  assert.equal(seen.ops.length, 1);
  assert.equal(seen.ops[0].x2, 3);
  assert.equal(seen.covers, true);
  assert.equal(visibleOps([line(0, 0, 1, 1)]).covers, false);
  assert.equal(visibleOps([]).ops.length, 0);
});

test('a line is as fat as its pen, so the box grows by half the pen size', () => {
  const box = boundsOfOps([line(-10, 5, 30, -20, 6)]);
  assert.deepEqual(box, { minX: -13, maxX: 33, minY: -23, maxY: 8 });
});

test('nothing drawn gives no box, and moves with the pen up add nothing', () => {
  assert.equal(boundsOfOps([]), null);
  const t = new Turtle();
  t.clean();
  t.setPenUp();
  t.forward(500);
  assert.equal(drawingBounds(t.ops), null);
});

test('a drawing off the edge of the paper still counts', () => {
  const t = new Turtle();
  t.clean();
  t.setPenSize(0);
  t.setXY(900, 700);
  t.setXY(-900, -700);
  const box = drawingBounds(t.ops);
  assert.deepEqual(box, { minX: -900, maxX: 900, minY: -700, maxY: 700 });
});

test('an arc box holds the bulge of the arc, not just its ends (checked against the real turtle and brute force)', () => {
  // Every arc here has a pen size of 0 so the box is exactly the curve.
  for (const heading of [0, 30, 90, 137, 200, 270, 315]) {
    for (const sweep of [20, 90, 135, 180, 250, 359, 360, -45, -90, -180, -300]) {
      const t = new Turtle();
      t.clean();
      t.setPenSize(0);
      t.setHeading(heading);
      t.place(10, -20);
      t.arc(sweep, 70);
      const op = t.ops.find((o) => o.type === 'arc');
      const box = boundsOfOps([op]);
      // Walk along the arc and keep the extremes.
      const start = Math.atan2(op.y1 - op.cy, op.x1 - op.cx);
      let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
      const steps = 20000;
      for (let i = 0; i <= steps; i += 1) {
        const angle = start - ((sweep * Math.PI) / 180) * (i / steps);
        const x = op.cx + op.r * Math.cos(angle);
        const y = op.cy + op.r * Math.sin(angle);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      const label = `heading ${heading}, sweep ${sweep}`;
      assert.ok(near(box.minX, minX, 0.05) && near(box.maxX, maxX, 0.05) && near(box.minY, minY, 0.05) && near(box.maxY, maxY, 0.05),
        `${label}: box ${JSON.stringify(box)} vs ${JSON.stringify({ minX, maxX, minY, maxY })}`);
    }
  }
});

test('a fill counts the whole walk, including the parts with the pen up', () => {
  const t = new Turtle();
  t.clean();
  t.setPenSize(0);
  t.startFill();
  t.setPenUp();
  t.setXY(100, 0);
  t.setPenDown();
  t.setXY(100, 200);
  t.setXY(0, 0);
  t.endFill();
  const box = boundsOfOps(t.ops.filter((o) => o.type === 'fill'));
  assert.deepEqual(box, { minX: 0, maxX: 100, minY: 0, maxY: 200 });
});

test('a picture opened from a file counts as the whole paper once something is drawn on it, until something covers it', () => {
  // On its own it needs no zoom at all.
  assert.equal(drawingBounds([], { hasPicture: true, extraPoints: [{ x: 0, y: 0 }] }), null);
  const withBig = drawingBounds([line(0, 0, 2000, 0)], { hasPicture: true });
  assert.equal(withBig.maxX, 2000);
  assert.equal(withBig.minX, -PAPER_W / 2);
  const covered = drawingBounds([{ type: 'fillScreen', color: [0, 0, 0] }, line(0, 0, 40, 40)], { hasPicture: true });
  assert.deepEqual(covered, { minX: 0, maxX: 40, minY: 0, maxY: 40 });
});

test('the turtle is kept in view, but only when there is a drawing to keep it with', () => {
  assert.equal(drawingBounds([], { extraPoints: [{ x: 300, y: 300 }] }), null);
  const box = drawingBounds([line(0, 0, 10, 10)], { extraPoints: [{ x: 300, y: -200 }] });
  assert.deepEqual(box, { minX: 0, maxX: 300, minY: -200, maxY: 10 });
});

test('a point that is not a number is ignored, so one bad op cannot spoil the zoom', () => {
  const box = boundsOfOps([line(0, 0, 10, 10), line(NaN, 5, Infinity, 5)]);
  assert.deepEqual(box, { minX: 0, maxX: 10, minY: 0, maxY: 10 });
});

test('fitView zooms IN on a small drawing until it fills the paper (less the margin)', () => {
  const view = fitView({ minX: -50, maxX: 50, minY: -50, maxY: 50 });
  // Height is the tighter side: (560 - 80) / 100.
  assert.ok(near(view.zoom, (PAPER_H - 2 * FIT_MARGIN) / 100));
  assert.deepEqual([view.cx, view.cy], [0, 0]);
});

test('fitView zooms OUT on a big drawing, and centers it', () => {
  const view = fitView({ minX: 1000, maxX: 4000, minY: 0, maxY: 600 });
  assert.ok(near(view.zoom, (PAPER_W - 2 * FIT_MARGIN) / 3000));
  assert.ok(view.zoom < 1);
  assert.deepEqual([view.cx, view.cy], [2500, 300]);
});

test('fitView: everything lands inside the paper, with the margin, for random boxes', () => {
  let seed = 12345;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 300; i += 1) {
    const w = 10 ** (random() * 4 - 1); // 0.1 to 1000
    const h = 10 ** (random() * 4 - 1);
    const x = (random() - 0.5) * 8000;
    const y = (random() - 0.5) * 8000;
    const box = { minX: x, maxX: x + w, minY: y, maxY: y + h };
    const view = fitView(box);
    assert.ok(view.zoom >= MIN_DRAW_ZOOM && view.zoom <= MAX_DRAW_ZOOM);
    for (const [bx, by] of [[box.minX, box.minY], [box.maxX, box.maxY], [box.minX, box.maxY], [box.maxX, box.minY]]) {
      const p = worldToPaper(view, bx, by);
      assert.ok(p.x >= FIT_MARGIN - 1e-6 && p.x <= PAPER_W - FIT_MARGIN + 1e-6 && p.y >= FIT_MARGIN - 1e-6 && p.y <= PAPER_H - FIT_MARGIN + 1e-6,
        `box ${JSON.stringify(box)} zoom ${view.zoom} lands at ${p.x},${p.y}`);
    }
    // And it fills the room: one side touches the margin (unless the zoom hit its limit).
    if (view.zoom < MAX_DRAW_ZOOM && view.zoom > MIN_DRAW_ZOOM) {
      const a = worldToPaper(view, box.minX, box.minY);
      const b = worldToPaper(view, box.maxX, box.maxY);
      const filledX = near(b.x - a.x, PAPER_W - 2 * FIT_MARGIN, 1e-6);
      const filledY = near(a.y - b.y, PAPER_H - 2 * FIT_MARGIN, 1e-6);
      assert.ok(filledX || filledY, `box ${JSON.stringify(box)} does not fill either way`);
    }
  }
});

test('fitView of one dot, a vertical line, and nothing', () => {
  assert.equal(fitView({ minX: 5, maxX: 5, minY: 7, maxY: 7 }).zoom, 1);
  const tall = fitView({ minX: 0, maxX: 0, minY: 0, maxY: 240 });
  assert.ok(near(tall.zoom, (PAPER_H - 2 * FIT_MARGIN) / 240));
  assert.ok(isDefaultView(fitView(null)));
  assert.deepEqual(fitView(null), DEFAULT_DRAW_VIEW);
});

test('the zoom never goes past its limits', () => {
  assert.equal(fitView({ minX: 0, maxX: 0.5, minY: 0, maxY: 0.5 }).zoom, MAX_DRAW_ZOOM);
  assert.equal(fitView({ minX: 0, maxX: 1e12, minY: 0, maxY: 1 }).zoom, MIN_DRAW_ZOOM);
});

test('world and paper positions convert both ways, and the default view changes nothing', () => {
  for (const view of [DEFAULT_DRAW_VIEW, { zoom: 3.5, cx: -120, cy: 40 }, { zoom: 0.02, cx: 9000, cy: -4000 }]) {
    for (const [x, y] of [[0, 0], [100, -50], [-333, 271]]) {
      const p = worldToPaper(view, x, y);
      const back = paperToWorld(view, p.x, p.y);
      assert.ok(near(back.x, x, 1e-6) && near(back.y, y, 1e-6));
    }
  }
  assert.deepEqual(worldToPaper(DEFAULT_DRAW_VIEW, 0, 0), { x: PAPER_W / 2, y: PAPER_H / 2 });
  assert.deepEqual(worldToPaper(DEFAULT_DRAW_VIEW, 100, 100), { x: PAPER_W / 2 + 100, y: PAPER_H / 2 - 100 });
});

test('sameView: the view a Fit just made is the same as itself, and a slightly different one is not', () => {
  const fitted = fitView({ minX: -300, maxX: 500, minY: -100, maxY: 400 });
  assert.ok(sameView(fitted, { ...fitted }));
  // A tiny wobble in the numbers (under half a pixel, or a fifth of a percent) is not a different view.
  assert.ok(sameView(fitted, { zoom: fitted.zoom * 1.001, cx: fitted.cx + 0.2 / fitted.zoom, cy: fitted.cy - 0.2 / fitted.zoom }));
  // Anything a person could see is.
  assert.ok(!sameView(fitted, { ...fitted, zoom: fitted.zoom * 1.01 }));
  assert.ok(!sameView(fitted, { ...fitted, cx: fitted.cx + 2 / fitted.zoom }));
  assert.ok(!sameView(fitted, { ...fitted, cy: fitted.cy - 2 / fitted.zoom }));
  assert.ok(!sameView(fitted, DEFAULT_DRAW_VIEW));
  assert.ok(sameView(DEFAULT_DRAW_VIEW, { zoom: 1, cx: 0, cy: 0 }));
});
