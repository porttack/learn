// Tests for js/core/paper.js: the kinds of paper, and the lines printed on graph and blueprint paper for a view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAPERS, DEFAULT_PAPER, paperById, afterGridPress, majorGap, printedLines, FINEST_SQUARE, PRINTED_MIN_GAP, seeded, wipes, specks, WIPE_SEED,
} from '../js/core/paper.js';
import { DEFAULT_DRAW_VIEW } from '../js/core/fit.js';

test('there are five papers, white first, each with words for the menu and no dashes in them', () => {
  assert.deepEqual(PAPERS.map((p) => p.id), ['white', 'whiteboard', 'graph', 'chalkboard', 'blueprint']);
  assert.equal(DEFAULT_PAPER, 'white');
  for (const paper of PAPERS) {
    assert.ok(paper.label.length > 2 && paper.hint.length > 5, paper.id);
    assert.ok(!/[\u2013\u2014]/.test(paper.label + paper.hint), `${paper.id}: no em or en dashes`);
    assert.ok(!/teacher|class|student|grade/i.test(paper.label + paper.hint), `${paper.id}: words for whoever is drawing`);
  }
  assert.equal(paperById('blueprint').label, 'Blueprint');
  assert.equal(paperById('nope'), null);
});

test('the dark papers are the two with a board color, and the light ones have none (they are the white of the page)', () => {
  for (const paper of PAPERS) {
    assert.equal(paper.dark, paper.board !== null, paper.id);
    if (paper.board) assert.match(paper.board, /^#[0-9a-f]{6}$/);
  }
  assert.deepEqual(PAPERS.filter((p) => p.dark).map((p) => p.id), ['chalkboard', 'blueprint']);
  assert.equal(paperById('white').lines, null, 'nothing printed on plain paper');
  assert.equal(paperById('chalkboard').lines, null);
  assert.ok(paperById('graph').lines.minor && paperById('graph').lines.major && paperById('blueprint').lines.minor && paperById('blueprint').lines.major);
});

test('the bold lines are always at nice numbers', () => {
  assert.equal(majorGap(10), 50);
  assert.equal(majorGap(20), 100);
  assert.equal(majorGap(50), 100);
  assert.equal(majorGap(100), 500);
  assert.equal(majorGap(200), 1000);
  assert.equal(majorGap(500), 1000);
});

test('at the starting view the squares are 10 across with a bold line every 50, and the middle is a bold line', () => {
  const lines = printedLines(DEFAULT_DRAW_VIEW);
  assert.equal(lines.minor, 10);
  assert.equal(lines.major, 50);
  assert.deepEqual(lines.xs.slice(0, 3).map((l) => l.at), [-350, -340, -330]);
  assert.equal(lines.xs.length, 71, 'from -350 to 350');
  assert.equal(lines.ys.length, 57, 'from -280 to 280');
  assert.ok(lines.xs.find((l) => l.at === 0).bold && lines.ys.find((l) => l.at === 0).bold);
  assert.deepEqual(lines.xs.filter((l) => l.bold).map((l) => l.at), [-350, -300, -250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250, 300, 350]);
});

test('the printed squares stay the same size on the paper, so they zoom with the drawing, until they would be a smear and then get bigger', () => {
  const zoomedIn = printedLines({ zoom: 8, cx: 0, cy: 0 });
  assert.equal(zoomedIn.minor, FINEST_SQUARE, 'never finer than 10, however far in');
  const zoomedOut = printedLines({ zoom: 0.1, cx: 0, cy: 0 });
  assert.ok(zoomedOut.minor * 0.1 >= PRINTED_MIN_GAP - 1e-9, `${zoomedOut.minor} units are ${zoomedOut.minor * 0.1} pixels`);
  assert.ok(zoomedOut.minor > 10);
  for (const zoom of [0.02, 0.05, 0.3, 1, 3, 20]) {
    const l = printedLines({ zoom, cx: 123, cy: -77 });
    assert.ok(l.xs.length <= 400 && l.ys.length <= 400, `${zoom}`);
    assert.ok(l.minor * zoom >= PRINTED_MIN_GAP - 1e-9 || l.minor === FINEST_SQUARE);
  }
});

test('the whiteboard and the chalkboard are the hand drawn papers, and have smudges; no other paper does', () => {
  assert.deepEqual(PAPERS.filter((p) => p.hand).map((p) => p.id), ['whiteboard', 'chalkboard']);
  assert.equal(paperById('whiteboard').hand, 'marker');
  assert.equal(paperById('chalkboard').hand, 'chalk');
  for (const paper of PAPERS) assert.equal(paper.wipes !== null, Boolean(paper.hand), `${paper.id}: smudges go with the hand drawn look`);
  const whiteboard = paperById('whiteboard');
  assert.equal(whiteboard.dark, false, 'a whiteboard is light, so the grid stays dark on it');
  assert.equal(whiteboard.board, null);
  assert.equal(whiteboard.lines, null);
  assert.equal(whiteboard.wipes.dust, 0, 'a cloth leaves streaks, not dust');
  const chalkboard = paperById('chalkboard');
  assert.ok(chalkboard.wipes.dust > 100, 'chalk leaves dust');
  for (const { wipes: w } of PAPERS.filter((p) => p.hand)) {
    assert.match(w.color, /^\d{1,3}, \d{1,3}, \d{1,3}$/);
    assert.ok(w.color.split(', ').every((n) => n <= 255));
    assert.ok(w.count >= 3 && w.count <= 12);
    assert.ok(w.strength >= 0.5 && w.strength <= 3, 'smudges you can see, but never paint');
  }
});

test('the same seed gives the same numbers, a different seed does not, and all of them are in [0, 1)', () => {
  const first = seeded(7);
  const again = seeded(7);
  const other = seeded(8);
  const a = Array.from({ length: 50 }, first);
  assert.deepEqual(a, Array.from({ length: 50 }, again));
  assert.notDeepEqual(a, Array.from({ length: 50 }, other));
  assert.ok(a.every((n) => n >= 0 && n < 1));
  assert.ok(new Set(a).size > 45, 'not stuck repeating');
});

test('the smudges are always the same ones, a cloth\'s swipes that stay on the paper and are made of fine streaks', () => {
  assert.deepEqual(wipes(7), wipes(7));
  assert.notDeepEqual(wipes(7), wipes(7, WIPE_SEED + 5));
  assert.equal(wipes(7).length, 7);
  assert.equal(wipes(0).length, 0);
  assert.deepEqual(wipes(4), wipes(7).slice(0, 4), 'a board with fewer swipes has the first of the same ones');
  for (const swipe of wipes(12)) {
    for (const end of [swipe.from, swipe.to]) assert.ok(end.x >= 0 && end.x <= 1 && end.y >= 0 && end.y <= 1, JSON.stringify(end));
    assert.ok(Math.abs(swipe.bend) <= 0.07 + 1e-9);
    assert.ok(swipe.thickness >= 0.07 && swipe.thickness <= 0.15);
    assert.ok(swipe.streaks.length >= 22 && swipe.streaks.length <= 34);
    for (const streak of swipe.streaks) {
      assert.ok(Math.abs(streak.offset) <= swipe.thickness / 2 + 1e-9, 'streaks stay inside the swipe');
      assert.ok(streak.width > 0 && streak.width < swipe.thickness, 'each is thinner than the swipe');
      assert.ok(streak.alpha >= 0.02 && streak.alpha <= 0.055, 'faint: a board is smudged, not painted');
      assert.ok(streak.start >= 0 && streak.start <= 0.16 && streak.end >= 0.84 && streak.end <= 1, 'ragged ends, but most of the swipe');
    }
  }
});

test('the dust is always the same specks, spread over the paper, small and faint', () => {
  assert.deepEqual(specks(380), specks(380));
  assert.equal(specks(380).length, 380);
  assert.equal(specks(0).length, 0);
  const dust = specks(380);
  assert.ok(dust.every((d) => d.x >= 0 && d.x < 1 && d.y >= 0 && d.y < 1));
  assert.ok(dust.every((d) => d.size > 0 && d.size < 0.004), 'tiny');
  assert.ok(dust.every((d) => d.alpha >= 0.05 && d.alpha <= 0.18), 'faint');
  assert.ok(dust.some((d) => d.x < 0.2) && dust.some((d) => d.x > 0.8) && dust.some((d) => d.y < 0.2) && dust.some((d) => d.y > 0.8), 'all over');
});

test('pressing the grid button turns the grid on, then goes through the papers one at a time, then puts the blank screen back', () => {
  let state = { gridVisible: false, paperId: 'white' };
  const seen = [];
  for (let i = 0; i < 6; i += 1) {
    const next = afterGridPress(state);
    seen.push(`${next.gridVisible ? next.gridType : 'off'}/${next.paperId}`);
    state = { gridVisible: next.gridVisible, paperId: next.paperId };
  }
  assert.deepEqual(seen, ['numbers/white', 'numbers/whiteboard', 'numbers/graph', 'numbers/chalkboard', 'numbers/blueprint', 'off/white'], 'it comes round again');
  assert.deepEqual(afterGridPress(state), { gridVisible: true, gridType: 'numbers', paperId: 'white' }, 'and the next press starts over');
});

test('whatever was chosen from the menu, a press goes to the squares with numbers, keeps the paper when it only turns the grid on, and ends at blank', () => {
  assert.deepEqual(afterGridPress({ gridVisible: false, paperId: 'chalkboard' }), { gridVisible: true, gridType: 'numbers', paperId: 'chalkboard' }, 'grid off on a chalkboard: just turn it on');
  assert.deepEqual(afterGridPress({ gridVisible: true, paperId: 'chalkboard' }), { gridVisible: true, gridType: 'numbers', paperId: 'blueprint' });
  assert.deepEqual(afterGridPress({ gridVisible: true, paperId: 'blueprint' }), { gridVisible: false, gridType: 'numbers', paperId: 'white' });
  assert.deepEqual(afterGridPress({ gridVisible: true, paperId: 'nonsense' }), { gridVisible: false, gridType: 'numbers', paperId: 'white' }, 'a paper it does not know is the blank screen');
  assert.deepEqual(afterGridPress({ gridVisible: false, paperId: 'nonsense' }), { gridVisible: true, gridType: 'numbers', paperId: 'white' });
  // Every paper in the list is visited, in the order of the menu.
  let state = { gridVisible: true, paperId: PAPERS[0].id };
  for (let i = 1; i < PAPERS.length; i += 1) {
    state = afterGridPress(state);
    assert.equal(state.paperId, PAPERS[i].id);
  }
});
