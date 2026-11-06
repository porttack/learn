// Tests for js/ui/spew.js: where the things the shark brings up land and when, how big they are drawn, and what the shark remembers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEALS_KEPT, PIECES_MAX, PIECE_PX, SPEW, fitPicture, spewPlan, spewDuration, Meals } from '../js/ui/spew.js';

/** A random() that gives the same list of numbers over and over. */
const loop = (...numbers) => { let i = 0; return () => numbers[i++ % numbers.length]; };
const ROOM = { width: 1366, height: 700 };
const MOUTH = { x: 70, y: 600 };

test('a picture is drawn so its longer side is the same size whatever the thing, and keeps its shape', () => {
  assert.deepEqual(fitPicture(100, 50, 46), { width: 46, height: 23 });
  assert.deepEqual(fitPicture(50, 200, 40), { width: 10, height: 40 });
  assert.deepEqual(fitPicture(10, 10, 46), { width: 46, height: 46 }, 'a tiny thing is drawn at the same size too');
  assert.deepEqual(fitPicture(0, 0, 46), { width: 46, height: 46 }, 'and one with no size is a square');
  assert.equal(PIECE_PX, 46);
});

test('there is a plan for each thing the shark brings up, and never more than the most', () => {
  assert.equal(spewPlan(0, MOUTH, ROOM).length, 0);
  assert.equal(spewPlan(5, MOUTH, ROOM).length, 5);
  assert.equal(spewPlan(500, MOUTH, ROOM).length, PIECES_MAX);
  assert.equal(spewPlan(-3, MOUTH, ROOM).length, 0);
  assert.equal(spewPlan(2.9, MOUTH, ROOM).length, 2);
});

test('every thing starts at the mouth and lands inside the window, near the can: out to the right and below the mouth, or a little to the left', () => {
  for (const random of [() => 0, () => 0.999, loop(0.1, 0.9, 0.5, 0.3), Math.random]) {
    for (const piece of spewPlan(PIECES_MAX, MOUTH, ROOM, random)) {
      assert.deepEqual(piece.from, MOUTH);
      assert.ok(piece.to.x >= 30 && piece.to.x <= ROOM.width - 30, `x ${piece.to.x}`);
      assert.ok(piece.to.y >= 30 && piece.to.y <= ROOM.height - 30, `y ${piece.to.y}`);
      assert.ok(piece.to.x >= MOUTH.x - 70 && piece.to.x <= MOUTH.x + 340, 'within a few hundred pixels of the can');
      assert.ok(piece.apex >= 60 && piece.apex <= 150, 'it goes up before it comes down');
      assert.ok(Math.abs(piece.turn) <= 220);
      assert.ok(piece.scale >= 0.85 && piece.scale <= 1.15);
    }
  }
});

test('in a small window nothing is sent off its edge, even from a mouth close to the corner', () => {
  const tiny = { width: 200, height: 120 };
  for (const piece of spewPlan(PIECES_MAX, { x: 190, y: 110 }, tiny, loop(0, 1, 0.5))) {
    assert.ok(piece.to.x >= 30 && piece.to.x <= 170 && piece.to.y >= 30 && piece.to.y <= 90, JSON.stringify(piece.to));
  }
});

test('the things come up one after another, after the shark has heaved, then fly, lie there and fade', () => {
  const plan = spewPlan(6, MOUTH, ROOM, loop(0.2, 0.7, 0.4));
  assert.equal(plan[0].delay, SPEW.HEAVE_MS);
  for (let i = 1; i < plan.length; i += 1) assert.equal(plan[i].delay - plan[i - 1].delay, SPEW.STAGGER_MS, 'evenly');
  for (const piece of plan) {
    assert.ok(piece.fly >= SPEW.FLY_MS[0] && piece.fly <= SPEW.FLY_MS[1]);
    assert.ok(piece.sit >= SPEW.SIT_MS[0] && piece.sit <= SPEW.SIT_MS[1]);
    assert.equal(piece.fade, SPEW.FADE_MS);
  }
});

test('the whole thing takes as long as its last thing does, and a shark with nothing still heaves once', () => {
  const plan = spewPlan(4, MOUTH, ROOM, loop(0.5));
  const last = plan.at(-1);
  assert.equal(spewDuration(plan), last.delay + last.fly + last.sit + last.fade);
  assert.equal(spewDuration([]), SPEW.HEAVE_MS + SPEW.WORD_MS);
  assert.ok(spewDuration(spewPlan(PIECES_MAX, MOUTH, ROOM)) < 12000, 'a whole belly full is still over in about ten seconds');
});

test('the same dice give the same plan, and different dice a different one', () => {
  assert.deepEqual(spewPlan(5, MOUTH, ROOM, loop(0.3, 0.6)), spewPlan(5, MOUTH, ROOM, loop(0.3, 0.6)));
  assert.notDeepEqual(spewPlan(5, MOUTH, ROOM, loop(0.3, 0.6)), spewPlan(5, MOUTH, ROOM, loop(0.8, 0.1)));
});

test('the shark remembers what it ate, a thing at a time, oldest first, and has nothing once it has brought it all up', () => {
  const meals = new Meals();
  assert.equal(meals.count, 0);
  meals.add('a');
  meals.add(null);
  meals.add('c');
  assert.equal(meals.count, 3);
  assert.deepEqual(meals.takeAll(), ['a', null, 'c']);
  assert.equal(meals.count, 0);
  assert.deepEqual(meals.takeAll(), [], 'an empty shark has nothing to bring up');
});

test('only the latest things are kept, and only the latest few come up', () => {
  const meals = new Meals(5);
  for (let i = 1; i <= 8; i += 1) meals.add(i);
  assert.equal(meals.count, 5);
  assert.deepEqual(meals.takeAll(), [4, 5, 6, 7, 8]);
  const many = new Meals();
  for (let i = 0; i < MEALS_KEPT + 10; i += 1) many.add(i);
  assert.equal(many.count, MEALS_KEPT);
  assert.equal(many.takeAll().length, PIECES_MAX, 'a full belly brings up the latest of it');
});

test('an Undo gives the latest thing back to the page, so the shark no longer has it', () => {
  const meals = new Meals();
  assert.equal(meals.giveBack(), false);
  meals.add('x');
  meals.add('y');
  assert.equal(meals.giveBack(), true);
  assert.deepEqual(meals.takeAll(), ['x']);
});
