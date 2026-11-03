// Tests for undo/redo history and for pan and zoom maths.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { History } from '../js/core/history.js';
import { zoomAbout, panBy, clampZoom, zoomToFit, MIN_ZOOM, MAX_ZOOM, HOME_VIEW } from '../js/core/view.js';

const project = (...ops) => ({ stacks: [{ x: 0, y: 0, blocks: ops.map((op) => ({ op })) }] });

test('a new history has nothing to undo or redo', () => {
  const history = new History(project());
  assert.equal(history.canUndo, false);
  assert.equal(history.canRedo, false);
  assert.equal(history.undo(), null);
  assert.equal(history.redo(), null);
});

test('undo goes back one change at a time, and redo goes forward again', () => {
  const history = new History(project());
  history.record(project('a'));
  history.record(project('a', 'b'));
  assert.deepEqual(history.undo(), project('a'));
  assert.deepEqual(history.undo(), project());
  assert.equal(history.canUndo, false);
  assert.deepEqual(history.redo(), project('a'));
  assert.deepEqual(history.redo(), project('a', 'b'));
  assert.equal(history.canRedo, false);
});

test('recording a project that has not changed does nothing', () => {
  const history = new History(project('a'));
  assert.equal(history.record(project('a')), false);
  assert.equal(history.canUndo, false);
  assert.equal(history.record(project('b')), true);
});

test('a new change after undoing throws away the redo steps', () => {
  const history = new History(project());
  history.record(project('a'));
  history.record(project('a', 'b'));
  history.undo();
  history.record(project('c'));
  assert.equal(history.canRedo, false);
  assert.deepEqual(history.undo(), project('a'), 'one step back from c is a, not the old b');
  assert.deepEqual(history.redo(), project('c'));
});

test('undo hands back a separate copy each time', () => {
  const history = new History(project());
  history.record(project('a'));
  const back = history.undo();
  back.stacks.push('junk');
  history.redo();
  assert.deepEqual(history.undo(), project());
});

test('only the most recent steps are kept', () => {
  const history = new History(project(), 3);
  for (const op of ['a', 'b', 'c', 'd', 'e']) history.record(project(op));
  let steps = 0;
  while (history.undo()) steps += 1;
  assert.equal(steps, 3);
});

test('zooming keeps the point under the pointer where it is', () => {
  const view = { x: 40, y: -25, zoom: 1.3 };
  const [px, py] = [310, 205];
  // The workspace point under the pointer before and after.
  const under = (v) => [(px - v.x) / v.zoom, (py - v.y) / v.zoom];
  const before = under(view);
  const after = under(zoomAbout(view, 1.5, px, py));
  assert.ok(Math.abs(before[0] - after[0]) < 1e-9);
  assert.ok(Math.abs(before[1] - after[1]) < 1e-9);
});

test('zoom has limits, and hitting a limit does not move the view', () => {
  assert.equal(clampZoom(100), MAX_ZOOM);
  assert.equal(clampZoom(0.001), MIN_ZOOM);
  const atMax = { x: 10, y: 20, zoom: MAX_ZOOM };
  assert.deepEqual(zoomAbout(atMax, 2, 100, 100), atMax);
});

test('panning slides the view and leaves the zoom alone', () => {
  assert.deepEqual(panBy({ x: 5, y: 6, zoom: 2 }, 10, -4), { x: 15, y: 2, zoom: 2 });
});

test('the home view is unzoomed and unmoved', () => {
  assert.deepEqual({ ...HOME_VIEW }, { x: 0, y: 0, zoom: 1 });
});

test('zoomToFit leaves blocks alone when they already fit, and never zooms in', () => {
  assert.equal(zoomToFit({ contentBottom: 300, anchorY: 16, height: 600 }), 1);
  assert.equal(zoomToFit({ contentBottom: 588, anchorY: 16, height: 600 }), 1, 'just fits, with the margin');
  assert.equal(zoomToFit({ contentBottom: 0, anchorY: 16, height: 600 }), 1, 'nothing to fit');
});

test('zoomToFit zooms out just enough that the bottom lands one margin above the window edge', () => {
  const zoom = zoomToFit({ contentBottom: 800, anchorY: 16, height: 600, margin: 12 });
  assert.ok(zoom < 1 && zoom > MIN_ZOOM);
  const bottomOnScreen = zoomAbout(HOME_VIEW, zoom, 90, 16).y + 800 * zoom;
  assert.ok(Math.abs(bottomOnScreen - (600 - 12)) < 0.001, `the bottom is at ${bottomOnScreen}`);
});

test('zoomToFit stops at the smallest readable size, even if the blocks still do not fit', () => {
  assert.equal(zoomToFit({ contentBottom: 5000, anchorY: 16, height: 600 }), 0.6);
  assert.equal(zoomToFit({ contentBottom: 5000, anchorY: 16, height: 600, minZoom: 0.5 }), 0.5);
  assert.ok(zoomToFit({ contentBottom: 5000, anchorY: 16, height: 600 }) >= MIN_ZOOM);
});
