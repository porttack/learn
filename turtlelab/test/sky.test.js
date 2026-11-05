// Tests for js/ui/sky.js: how far and how long things float up or fall, worked out from where they start.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLOAT_SPEED, riseDistance, riseTime, fallDistance, fallTime } from '../js/ui/sky.js';

test('a rise goes from where it starts to just off the top of the window, never very short', () => {
  assert.equal(riseDistance(300), 370);
  assert.equal(riseDistance(0), 80);
  assert.equal(riseDistance(-50), 80);
  assert.ok(riseDistance(600) > riseDistance(300), 'lower down is further to go');
});

test('things float at a steady speed, so a longer rise takes longer, within limits', () => {
  const speed = FLOAT_SPEED.bubbles;
  assert.ok(Math.abs(riseTime(400, speed) - 4) < 1e-9);
  assert.ok(Math.abs(riseTime(800, speed) - 8) < 1e-9, 'twice as far, twice as long');
  assert.equal(riseTime(10, speed), 2.2, 'never a blink');
  assert.equal(riseTime(100000, speed), 16, 'and never forever');
  assert.ok(FLOAT_SPEED.zzz < FLOAT_SPEED.bubbles, 'the z\'s drift more lazily than bubbles');
});

test('a fall goes from where it starts to just off the bottom, and speeds up the way a dropped thing does, but slowly enough to watch', () => {
  assert.equal(fallDistance(300, 700), 470);
  assert.equal(fallDistance(690, 700), 80);
  assert.equal(fallDistance(900, 700), 60, 'already below: still a little way');
  const near = fallTime(200);
  const far = fallTime(800);
  assert.ok(far > near && far < near * 4, 'four times as far takes less than four times as long (about twice)');
  assert.ok(Math.abs(far / near - 2) < 0.2);
  assert.equal(fallTime(1), 1.2, 'never a blink');
  // From the middle of a typical window it takes a few seconds, not a fraction of one.
  const middle = fallTime(fallDistance(330, 613));
  assert.ok(middle >= 2.4 && middle <= 4, `${middle} s from the middle of a 613 pixel window`);
}
);
