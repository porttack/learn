// Tests for js/core/lettering.js: the script letters of the write block.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_DATA } from '../js/core/lettering-data.js';
import {
  LETTERING_MAX_CHARS, LETTER_FONTS, DEFAULT_FONT, canWrite, cleanFont, cleanLetteringText, isFont, letteringLetters, letteringStrokes, letteringWidth,
} from '../js/core/lettering.js';

// The first font is the one a block has until you choose another, and the one these older tests are about.
const { cap: CAP_HEIGHT, glyphs: GLYPHS } = FONT_DATA[DEFAULT_FONT];

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

// ---- The fonts to choose from ------------------------------------------------------------------------------

test('the fonts offered are the fonts that have data, in order, with the default first', () => {
  assert.deepEqual(LETTER_FONTS.map((f) => f.id), Object.keys(FONT_DATA));
  assert.equal(DEFAULT_FONT, 'script');
  assert.equal(LETTER_FONTS[0].id, DEFAULT_FONT);
  for (const font of LETTER_FONTS) {
    assert.ok(/^[a-z]+$/.test(font.id) && font.label === font.id, `${font.id}: the id is one lowercase word, and it is also the label`);
    assert.ok(font.tip.length > 10 && !/[\u2013\u2014]/.test(font.tip), `${font.id} has a tip with no dashes`);
  }
});

test('isFont and cleanFont only believe real font ids', () => {
  for (const font of LETTER_FONTS) {
    assert.ok(isFont(font.id), font.id);
    assert.equal(cleanFont(font.id), font.id);
  }
  for (const odd of ['', 'Script', 'toString', '__proto__', 'constructor', 'gothic', undefined, null, 5, {}, ['sans'], true]) {
    assert.ok(!isFont(odd), String(odd));
    assert.equal(cleanFont(odd), DEFAULT_FONT, String(odd));
  }
});

test('every font has exactly the letters the default one has, with whole numbers and a capital letter that is its cap height', () => {
  const keys = Object.keys(FONT_DATA[DEFAULT_FONT].glyphs);
  assert.equal(keys.length, 95);
  for (const [id, { cap, glyphs }] of Object.entries(FONT_DATA)) {
    assert.deepEqual(Object.keys(glyphs), keys, `${id} has the same 95 keys`);
    assert.ok(Number.isInteger(cap) && cap > 0, `${id} cap ${cap}`);
    for (const [ch, [advance, strokes]] of Object.entries(glyphs)) {
      assert.ok(Number.isInteger(advance) && advance >= 0, `${id} "${ch}" advance ${advance}`);
      for (const flat of strokes) {
        assert.ok(flat.length >= 4 && flat.length % 2 === 0 && flat.every(Number.isInteger), `${id} "${ch}" is whole numbers, at least two points`);
        for (let i = 0; i < flat.length; i += 2) assert.ok(flat[i + 1] >= -16 && flat[i + 1] <= 30, `${id} "${ch}" y ${flat[i + 1]} is not far off`);
      }
    }
    assert.deepEqual(glyphs[' '][1], [], `${id}: a space draws nothing`);
    assert.equal(Math.max(...glyphs.H[1].flatMap((flat) => flat.filter((_, i) => i % 2 === 1))), cap, `${id}: a capital H reaches the cap height`);
    assert.ok(Math.min(...glyphs.g[1].flatMap((flat) => flat.filter((_, i) => i % 2 === 1))) < 0, `${id}: a g has a tail`);
  }
});

test('size means the same in every font: a capital letter is as tall as asked', () => {
  for (const { id } of LETTER_FONTS) {
    for (const letter of 'HEL') assert.equal(Math.max(...letteringStrokes(letter, 80, id).flat().map((p) => p[1])), 80, `${id} ${letter}`);
  }
});

test('the fonts really are different from each other, and no font means the default one', () => {
  const shapes = LETTER_FONTS.map((f) => JSON.stringify(letteringStrokes('Cougars', 60, f.id)));
  assert.equal(new Set(shapes).size, LETTER_FONTS.length, 'five different drawings');
  assert.equal(JSON.stringify(letteringStrokes('Cougars', 60)), shapes[0]);
  assert.equal(JSON.stringify(letteringStrokes('Cougars', 60, 'nonsense')), shapes[0], 'an unknown font is the default, not an error');
  assert.equal(letteringWidth('Cougars', 60), letteringWidth('Cougars', 60, DEFAULT_FONT));
  const widths = new Set(LETTER_FONTS.map((f) => Math.round(letteringWidth('Cougars', 60, f.id))));
  assert.ok(widths.size > 1, 'widths differ from font to font');
});

test('each font stitches: few separate lines for the thin ones, and the thick ones stay in a sensible range', () => {
  // The "Cougars" the embroidery samples write is 10 lines in script. These are the line counts per font.
  const counts = Object.fromEntries(LETTER_FONTS.map((f) => [f.id, letteringStrokes('Cougars', 110, f.id).length]));
  assert.ok(counts.script <= 12 && counts.sans <= 12, JSON.stringify(counts));
  assert.ok(counts.fancy <= 40 && counts.bold <= 40 && counts.serif <= 40, JSON.stringify(counts));
  assert.ok(counts.fancy > counts.script && counts.bold > counts.sans && counts.serif > counts.sans, 'the looped, double line and footed fonts have more lines, as the tips say');
});

// ---- A letter at a time ------------------------------------------------------------------------------------

test('letteringLetters gives one entry for each letter that draws, and together they are exactly letteringStrokes', () => {
  for (const { id } of LETTER_FONTS) {
    const letters = letteringLetters('Go, Cougars! 2026', 70, id);
    assert.equal(letters.length, 'Go,Cougars!2026'.length, `${id}: the two spaces draw nothing and are left out`);
    assert.deepEqual(letters.flat(), letteringStrokes('Go, Cougars! 2026', 70, id), id);
  }
  assert.deepEqual(letteringLetters('', 60), []);
  assert.deepEqual(letteringLetters('   ', 60), []);
});

test('a space still takes its room: the letters after it are where they would have been', () => {
  const firstOfB = (text) => letteringLetters(text, 60)[1][0][0][0];
  assert.ok(firstOfB('a b') > firstOfB('ab'));
  assert.ok(Math.abs(firstOfB('a b') - (firstOfB('ab') + letteringWidth(' ', 60))) < 1e-9);
});
