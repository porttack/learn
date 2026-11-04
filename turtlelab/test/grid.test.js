// Tests for js/core/grid.js: which grid lines are drawn for a view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { niceStep, labelFor, gridLines, MIN_LINE_GAP } from '../js/core/grid.js';
import { DEFAULT_DRAW_VIEW, worldToPaper } from '../js/core/fit.js';
import { PAPER_W, PAPER_H } from '../js/core/turtle.js';

test('niceStep picks the next of 1, 2, 5, 10, 20, 50 ...', () => {
  const cases = [[0.3, 0.5], [0.7, 1], [1, 1], [1.1, 2], [2, 2], [3, 5], [5, 5], [5.1, 10], [10, 10], [11, 20], [49, 50], [50, 50], [51, 100], [4999, 5000], [123456, 200000]];
  for (const [least, step] of cases) assert.equal(niceStep(least), step, `at least ${least}`);
  assert.equal(niceStep(0), 1);
  assert.equal(niceStep(NaN), 1);
});

test('at the default view the lines are 50 apart, and the axes are among them', () => {
  const grid = gridLines(DEFAULT_DRAW_VIEW);
  assert.equal(grid.step, 50);
  assert.deepEqual(grid.xs, [-350, -300, -250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250, 300, 350]);
  assert.deepEqual(grid.ys, [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250]);
});

test('zooming in gives finer lines, zooming out gives coarser ones, never closer than the minimum gap on the screen', () => {
  for (const zoom of [0.001, 0.02, 0.1, 0.5, 1, 1.7, 3, 4.8, 10]) {
    const view = { zoom, cx: 123, cy: -45 };
    const { step, xs, ys } = gridLines(view);
    assert.ok(step * zoom >= MIN_LINE_GAP * (1 - 1e-9), `zoom ${zoom}: step ${step} is too close`);
    assert.ok(step * zoom < MIN_LINE_GAP * 2.6, `zoom ${zoom}: step ${step} is much too far apart`);
    // Every line is on the paper, and every multiple of the step that is on the paper is there.
    for (const x of xs) {
      const p = worldToPaper(view, x, 0);
      assert.ok(p.x >= -1e-6 && p.x <= PAPER_W + 1e-6);
      assert.ok(Math.abs(x / step - Math.round(x / step)) < 1e-9);
    }
    for (const y of ys) {
      const p = worldToPaper(view, 0, y);
      assert.ok(p.y >= -1e-6 && p.y <= PAPER_H + 1e-6);
    }
    const expectedXs = Math.floor((view.cx + PAPER_W / 2 / zoom) / step) - Math.ceil((view.cx - PAPER_W / 2 / zoom) / step) + 1;
    assert.equal(xs.length, expectedXs);
  }
});

test('lines of a zoomed-in view sit at nice numbers, and there are never very many', () => {
  const { step, xs, ys } = gridLines({ zoom: 10, cx: 1000, cy: 1000 });
  assert.equal(step, 5);
  assert.ok(xs.every((x) => x % 5 === 0));
  assert.ok(xs.length <= 20 && ys.length <= 20);
});

test('labels are tidy numbers', () => {
  assert.equal(labelFor(50), '50');
  assert.equal(labelFor(-0), '0');
  assert.equal(labelFor(0.1 + 0.2), '0.3');
  assert.equal(labelFor(-250), '-250');
});
