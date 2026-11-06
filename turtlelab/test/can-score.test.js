// Tests for js/core/can-score.js: the score on the garbage can, and how many pokes call a visitor.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CanScore, Pokes, pokesNeeded, POKE_GAP_MS } from '../js/core/can-score.js';

test('the can starts with no score, each thing the shark eats is a point, and the score is shown from the first point', () => {
  const score = new CanScore();
  assert.equal(score.points, 0);
  assert.equal(score.visible, false);
  assert.equal(score.ate(), 1);
  assert.equal(score.visible, true);
  assert.equal(score.ate(), 2);
  assert.equal(score.ate(), 3);
  assert.equal(score.points, 3);
});

test('a harpoon takes a point off, and getting to zero takes the score away, so the next meal starts it again at one', () => {
  const score = new CanScore();
  score.set(3);
  assert.equal(score.harpooned(), 2);
  assert.equal(score.harpooned(), 1);
  assert.equal(score.visible, true);
  assert.equal(score.harpooned(), 0, 'one point less than one is nothing');
  assert.equal(score.visible, false, 'and then there is no sticker');
  assert.equal(score.harpooned(), 0, 'a harpoon with no score does not make it go below nothing');
  assert.equal(score.points, 0);
  assert.equal(score.ate(), 1, 'the next meal starts at one, not at minus something');
});

test('a score can be set to start with (to try it out): whole numbers of one or more, anything else is no score', () => {
  const score = new CanScore();
  assert.equal(score.set(5), 5);
  assert.equal(score.set('7'), 7);
  assert.equal(score.set(2.9), 2);
  for (const bad of [0, -3, 'x', NaN, undefined, null, Infinity]) assert.equal(score.set(bad), 0, String(bad));
});

test('it takes as many pokes as the score, and one poke if there is no score', () => {
  assert.equal(pokesNeeded(0), 1);
  assert.equal(pokesNeeded(-4), 1);
  assert.equal(pokesNeeded(1), 1);
  assert.equal(pokesNeeded(2), 2);
  assert.equal(pokesNeeded(7), 7);
  assert.equal(pokesNeeded(3.9), 3);
});

test('poking: with a score of 3 the third quick poke calls a visitor, and the first two say how many are left', () => {
  const pokes = new Pokes();
  assert.deepEqual(pokes.poke(0, 3), { count: 1, needed: 3, left: 2, summon: false });
  assert.deepEqual(pokes.poke(300, 3), { count: 2, needed: 3, left: 1, summon: false });
  assert.deepEqual(pokes.poke(600, 3), { count: 3, needed: 3, left: 0, summon: true });
  assert.deepEqual(pokes.poke(900, 3), { count: 1, needed: 3, left: 2, summon: false }, 'after a visitor the count starts again');
});

test('with no score one poke calls a visitor, every time', () => {
  const pokes = new Pokes();
  for (const at of [0, 100, 5000, 5100]) assert.equal(pokes.poke(at, 0).summon, true);
});

test('a pause of more than a second and a half starts the pokes again from nothing, and a pause of less does not', () => {
  const pokes = new Pokes();
  pokes.poke(0, 3);
  pokes.poke(POKE_GAP_MS, 3); // exactly the gap is still in time
  assert.equal(pokes.count, 2);
  assert.equal(pokes.poke(POKE_GAP_MS + POKE_GAP_MS + 1, 3).count, 1, 'too long: the third poke is the first of a new run');
  const slow = new Pokes(200);
  slow.poke(0, 2);
  assert.equal(slow.poke(500, 2).summon, false, 'with a short gap allowed, 500 ms is too long');
});

test('when the score changes while pokes are being counted, the count is kept and judged against the new score, and reset forgets it', () => {
  const pokes = new Pokes();
  pokes.poke(0, 4);
  pokes.poke(100, 4);
  assert.equal(pokes.poke(200, 3).summon, true, 'two pokes, then the score fell to 3: the third poke is enough');
  pokes.poke(300, 5);
  pokes.reset();
  assert.equal(pokes.count, 0);
  assert.equal(pokes.poke(400, 2).count, 1);
});
