// Tests for js/ui/trash.js: the pieces of the shark's behavior that can be tried without a browser (the burp).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldBurp, BURP_CHANCE } from '../js/ui/trash.js';

test('a shark burps now and then after a meal, not every time', () => {
  assert.ok(BURP_CHANCE > 0.1 && BURP_CHANCE < 0.5, `${BURP_CHANCE}`);
  assert.equal(shouldBurp(() => 0), true, 'the luckiest roll');
  assert.equal(shouldBurp(() => BURP_CHANCE - 0.001), true);
  assert.equal(shouldBurp(() => BURP_CHANCE), false);
  assert.equal(shouldBurp(() => 0.999), false);
  // About the right share of meals, over many.
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let burps = 0;
  for (let i = 0; i < 4000; i += 1) if (shouldBurp(random)) burps += 1;
  assert.ok(Math.abs(burps / 4000 - BURP_CHANCE) < 0.04, `${burps} burps in 4000 meals`);
});

test('a chance of 1 always burps and 0 never does (the address ?burp=always uses 1), and calm never does', () => {
  for (const roll of [0, 0.3, 0.9999]) {
    assert.equal(shouldBurp(() => roll, 1), true);
    assert.equal(shouldBurp(() => roll, 0), false);
  }
  assert.equal(shouldBurp(() => 0, 1, true), false, 'not when the computer asked for calm');
});
