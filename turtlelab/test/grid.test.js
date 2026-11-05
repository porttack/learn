// Tests for js/core/grid.js: which grid lines are drawn for a view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  niceStep, labelFor, gridLines, MIN_LINE_GAP, GRID_TYPES, DEFAULT_GRID, gridTypeById, polarGrid,
} from '../js/core/grid.js';
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

// ---- The kinds of grid ----------------------------------------------------------------------------------------

test('there are four kinds of grid, the numbered squares first (the one the button always showed), each with words for the menu and no dashes in them', () => {
  assert.deepEqual(GRID_TYPES.map((t) => t.id), ['numbers', 'squares', 'dots', 'polar']);
  assert.equal(DEFAULT_GRID, 'numbers');
  assert.equal(new Set(GRID_TYPES.map((t) => t.id)).size, GRID_TYPES.length);
  for (const type of GRID_TYPES) {
    assert.ok(type.label.length > 2 && type.hint.length > 5, type.id);
    assert.ok(!/[\u2013\u2014]/.test(type.label + type.hint), `${type.id}: no em or en dashes`);
    assert.ok(!/teacher|class|student|grade/i.test(type.label + type.hint), `${type.id}: words for whoever is drawing`);
  }
  assert.equal(gridTypeById('polar').label, 'Circles and angles');
  assert.equal(gridTypeById('nope'), null);
});

test('the rings of the circles and angles grid are a nice step apart, and reach exactly as far as the paper does', () => {
  const grid = polarGrid(DEFAULT_DRAW_VIEW);
  assert.equal(grid.step, 50);
  assert.deepEqual(grid.rings, [50, 100, 150, 200, 250, 300, 350, 400]);
  assert.ok(Math.abs(grid.reach - Math.hypot(350, 280)) < 1e-9, 'the far corner of the paper');
  assert.deepEqual(grid.spokes, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], 'a spoke every 30 degrees, 0 up, growing clockwise');
});

test('zoomed in, the rings keep a fingertip apart; panned away from the middle, only the rings that cross what is shown are listed; and there are never very many', () => {
  const zoomed = polarGrid({ zoom: 5, cx: 0, cy: 0 });
  assert.ok(zoomed.step * 5 >= MIN_LINE_GAP - 1e-9);
  const away = polarGrid({ zoom: 1, cx: 2000, cy: 0 });
  assert.ok(away.rings[0] >= 1600 && away.rings.at(-1) <= 2000 + 450, JSON.stringify([away.rings[0], away.rings.at(-1)]));
  assert.ok(away.rings.every((r) => r > 1600 - away.step), 'none that miss the paper altogether');
  for (const view of [{ zoom: 0.05, cx: 0, cy: 0 }, { zoom: 0.01, cx: 99999, cy: -99999 }, { zoom: 40, cx: 5, cy: 5 }]) {
    assert.ok(polarGrid(view).rings.length <= 60, JSON.stringify(view));
  }
});
