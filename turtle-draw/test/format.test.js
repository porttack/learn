// Tests for how numbers and answers are written for people.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatNumber, formatValue } from '../js/core/format.js';

test('numbers are written without rounding noise', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.equal(formatNumber(100), '100');
  assert.equal(formatNumber(-2.5), '-2.5');
  assert.equal(formatNumber(1 / 3), '0.3333333333');
});

test('an empty socket is written as nothing', () => {
  assert.equal(formatNumber(null), '');
  assert.equal(formatNumber(undefined), '');
});

test('answers can be numbers or true and false', () => {
  assert.equal(formatValue(5), '5');
  assert.equal(formatValue(true), 'true');
  assert.equal(formatValue(false), 'false');
});
