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

import { parseAnswer } from '../js/core/format.js';

test('parseAnswer takes plain numbers and nothing else', () => {
  for (const [typed, number] of [['12', 12], ['  7 ', 7], ['-3.5', -3.5], ['+4', 4], ['.5', 0.5], ['5.', 5], ['0', 0], ['-0.25', -0.25], ['007', 7]]) assert.equal(parseAnswer(typed), number, typed);
  for (const typed of ['', '   ', 'abc', '1e3', '0x10', 'Infinity', 'NaN', '1,5', '1 2', '--3', '3-', '.', '-', '5 sides', null, undefined]) assert.equal(parseAnswer(typed), null, String(typed));
  assert.equal(parseAnswer('9'.repeat(400)), null, 'a number too big to hold is not an answer');
});
