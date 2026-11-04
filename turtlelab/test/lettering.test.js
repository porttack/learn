// Tests for js/core/lettering.js: the script letters of the write block.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAP_HEIGHT, GLYPHS } from '../js/core/lettering-data.js';
import {
  LETTERING_MAX_CHARS, canWrite, cleanLetteringText, letteringStrokes, letteringWidth,
} from '../js/core/lettering.js';

const printable = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

test('every printable key on an English keyboard has a letter, and nothing else does', () => {
  for (const ch of printable) assert.ok(canWrite(ch), `"${ch}"`);
  for (const ch of ['\t', '\n', 'é', '€', '\x7f', '😀', 'toString', '__proto__', 'constructor', '']) assert.ok(!canWrite(ch), JSON.stringify(ch));
  assert.equal(Object.keys(GLYPHS).length, 95);
});

test('the letter data is whole numbers, with sensible strokes and room between letters', () => {
  assert.equal(CAP_HEIGHT, 21, 'a capital H is 21 units tall in this font');
  for (const [ch, [advance, strokes]] of Object.entries(GLYPHS)) {
    assert.ok(Number.isInteger(advance) && advance > 0, `"${ch}" advance ${advance}`);
    for (const flat of strokes) {
      assert.ok(flat.length >= 4 && flat.length % 2 === 0, `"${ch}" a stroke has at least two points`);
      assert.ok(flat.every(Number.isInteger), `"${ch}" has whole numbers`);
      for (let i = 0; i < flat.length; i += 2) {
        assert.ok(flat[i] >= -10 && flat[i] <= advance + 10, `"${ch}" x ${flat[i]} is near its own letter`);
        assert.ok(flat[i + 1] >= -14 && flat[i + 1] <= 28, `"${ch}" y ${flat[i + 1]} is not far off`);
      }
    }
  }
  assert.deepEqual(GLYPHS[' '][1], [], 'a space draws nothing');
  // The font's own capital letters rise to the cap height, and a g hangs below the line.
  for (const ch of 'CHLSV') assert.equal(Math.max(...GLYPHS[ch][1].flatMap((flat) => flat.filter((_, i) => i % 2 === 1))), CAP_HEIGHT, ch);
  assert.ok(Math.min(...GLYPHS.g[1].flatMap((flat) => flat.filter((_, i) => i % 2 === 1))) < 0, 'g has a tail');
});

test('cleanLetteringText keeps what can be written, cuts the rest, and stops at the longest', () => {
  assert.equal(cleanLetteringText('Cougars'), 'Cougars');
  assert.equal(cleanLetteringText('Go, Cougars! (2026)'), 'Go, Cougars! (2026)');
  assert.equal(cleanLetteringText('Hi\tthere\nfriend é€😀'), 'Hitherefriend ');
  assert.equal(cleanLetteringText(''), '');
  for (const odd of [undefined, null, 12, {}, ['a'], true]) assert.equal(cleanLetteringText(odd), '', String(odd));
  const long = 'abcdefghij'.repeat(10);
  assert.equal(cleanLetteringText(long).length, LETTERING_MAX_CHARS);
  assert.equal(cleanLetteringText(long), long.slice(0, LETTERING_MAX_CHARS));
});

test('letteringStrokes scales with size, starts at the left edge and the baseline, and is as wide as it says', () => {
  const small = letteringStrokes('Cougars', 50);
  const big = letteringStrokes('Cougars', 100);
  assert.equal(small.length, 10, 'Cougars is ten strokes in this font');
  assert.equal(big.length, small.length);
  small.forEach((stroke, i) => stroke.forEach(([along, up], k) => {
    assert.ok(Math.abs(big[i][k][0] - 2 * along) < 1e-9 && Math.abs(big[i][k][1] - 2 * up) < 1e-9, 'twice the size, twice everything');
  }));
  const all = big.flat();
  assert.ok(Math.min(...all.map((p) => p[0])) >= -4 && Math.max(...all.map((p) => p[0])) <= letteringWidth('Cougars', 100) + 8, 'inside its width, give or take a stroke end');
  assert.ok(Math.abs(letteringWidth('Cougars', 100) - 495) < 1, `${letteringWidth('Cougars', 100)}`);
  // A capital letter is `size` tall: the top of the C is at 100.
  assert.equal(Math.max(...letteringStrokes('C', 100).flat().map((p) => p[1])), 100);
  // Widths add up, so the words after a space start where they should.
  assert.ok(Math.abs(letteringWidth('ab cd', 40) - (letteringWidth('ab', 40) + letteringWidth(' ', 40) + letteringWidth('cd', 40))) < 1e-9);
  assert.deepEqual(letteringStrokes('', 60), []);
  assert.deepEqual(letteringStrokes('   ', 60), []);
  assert.deepEqual(letteringStrokes('é€', 60), []);
});
