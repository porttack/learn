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
        // (relative to the font's own cap height, which is 21 in the Hershey fonts, 118 in blocky and 84 in pixel)
        for (let i = 0; i < flat.length; i += 2) assert.ok(flat[i + 1] >= -0.8 * cap && flat[i + 1] <= 1.6 * cap, `${id} "${ch}" y ${flat[i + 1]} is not far off`);
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
  assert.equal(new Set(shapes).size, LETTER_FONTS.length, 'a different drawing from each font');
  assert.equal(JSON.stringify(letteringStrokes('Cougars', 60)), shapes[0]);
  assert.equal(JSON.stringify(letteringStrokes('Cougars', 60, 'nonsense')), shapes[0], 'an unknown font is the default, not an error');
  assert.equal(letteringWidth('Cougars', 60), letteringWidth('Cougars', 60, DEFAULT_FONT));
  const widths = new Set(LETTER_FONTS.map((f) => Math.round(letteringWidth('Cougars', 60, f.id))));
  assert.ok(widths.size > 1, 'widths differ from font to font');
});

test('each font stitches: few separate lines for the thin ones, and the thick ones stay in a sensible range', () => {
  // The "Cougars" the embroidery samples write is 10 lines in script. These are the line counts per font.
  const counts = Object.fromEntries(LETTER_FONTS.map((f) => [f.id, letteringStrokes('Cougars', 110, f.id).length]));
  assert.ok(counts.script <= 12 && counts.sans <= 12 && counts.blocky <= 12, JSON.stringify(counts));
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

// ---- The blocky font (EMS Osmotron, a single line Orbitron) ------------------------------------------------------

test('blocky is the sixth font (the seventh is pixel), with a tip that says it is wide and that it stitches in few lines', () => {
  assert.deepEqual(LETTER_FONTS.map((f) => f.id), ['script', 'fancy', 'sans', 'bold', 'serif', 'blocky', 'pixel']);
  const tip = LETTER_FONTS.find((f) => f.id === 'blocky').tip;
  assert.match(tip, /square/);
  assert.match(tip, /wider/);
  assert.match(tip, /stitches well/);
  assert.equal(DEFAULT_FONT, 'script', 'adding a font does not change the one a block starts with');
});

test('blocky letters are trimmed to one baseline and one capital height, so size means what it says', () => {
  const { cap, glyphs } = FONT_DATA.blocky;
  const ys = (ch) => glyphs[ch][1].flatMap((flat) => flat.filter((_, i) => i % 2 === 1));
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    assert.ok(Math.max(...ys(ch)) <= cap, `${ch} does not rise past the capital height (${Math.max(...ys(ch))} against ${cap})`);
    assert.ok(Math.min(...ys(ch)) >= 0, `${ch} does not sink below the baseline (${Math.min(...ys(ch))})`);
  }
  // The flat topped letters all reach it exactly: a capital letter is as tall as asked.
  for (const ch of 'EDOHILKUVWXYZ') assert.equal(Math.max(...ys(ch)), cap, ch);
  // Small letters with no tail stand on the baseline, and the ones with a tail go below it.
  for (const ch of 'abcdefhiklmnorstuvwxz') assert.ok(Math.min(...ys(ch)) >= 0, `${ch} stands on the baseline`);
  for (const ch of 'gjpqy') assert.ok(Math.min(...ys(ch)) < -20, `${ch} has a tail`);
  // Small letters with no stem above them are as tall as an o is.
  const xHeight = Math.max(...ys('o'));
  for (const ch of 'acemnorsuvwxz') assert.ok(Math.max(...ys(ch)) <= xHeight, `${ch} is no taller than an o`);
  for (const ch of 'bdhklt') assert.ok(Math.max(...ys(ch)) > cap, `${ch} has an ascender`);
});

test('every blocky letter sits in the middle of its own box, with room on both sides', () => {
  for (const [ch, [advance, strokes]] of Object.entries(FONT_DATA.blocky.glyphs)) {
    if (strokes.length === 0) continue;
    const xs = strokes.flatMap((flat) => flat.filter((_, i) => i % 2 === 0));
    const left = Math.min(...xs);
    const right = advance - Math.max(...xs);
    if (!/[A-Za-z0-9]/.test(ch)) continue; // marks like a slash lean out of their boxes a little, as in the font
    assert.ok(left >= 7 && right >= 7, `"${ch}" has room on both sides (${left} left, ${right} right)`);
    assert.ok(Math.abs(left - right) <= 2, `"${ch}" is centered (${left} left, ${right} right)`);
  }
});

test('blocky letters are made of straight lines with square corners: nothing but horizontal, vertical and a few slanting lines', () => {
  let flatOrUpright = 0;
  let slanted = 0;
  for (const ch of 'EFHILTUZ') {
    for (const flat of FONT_DATA.blocky.glyphs[ch][1]) {
      for (let i = 0; i + 3 < flat.length; i += 2) {
        if (flat[i] === flat[i + 2] || flat[i + 1] === flat[i + 3]) flatOrUpright += 1;
        else slanted += 1;
      }
    }
  }
  assert.ok(flatOrUpright >= 20, `${flatOrUpright} horizontal or upright lines in E F H I L T U Z`);
  assert.ok(slanted <= 4, `only the Z has a slanting line (${slanted})`);
  assert.equal(FONT_DATA.blocky.glyphs[' '][0] > 0, true);
});

test('blocky words are wide: it is the widest font, and a word still stitches in few lines', () => {
  const widths = Object.fromEntries(LETTER_FONTS.map((f) => [f.id, letteringWidth('Cougars', 60, f.id)]));
  assert.ok(widths.blocky > Math.max(...Object.entries(widths).filter(([id]) => id !== 'blocky').map(([, w]) => w)), JSON.stringify(widths));
  assert.ok(widths.blocky < 60 * 12, 'not absurdly wide: a seven letter word is under twelve letter heights');
  assert.ok(letteringStrokes('Cougars', 110, 'blocky').length <= 8, 'about the same few lines as script');
});

test('trimming the blocky letters never takes a bar away: the letters with a top bar or a bottom bar still have a long flat one at the cap line or the baseline', () => {
  const { cap, glyphs } = FONT_DATA.blocky;
  /** The longest horizontal line of this letter that lies at height `y` (give or take 1: the round letters sit half a unit off the flat ones). */
  const barAt = (ch, y) => {
    let longest = 0;
    for (const flat of glyphs[ch][1]) {
      for (let i = 0; i + 3 < flat.length; i += 2) {
        if (Math.abs(flat[i + 1] - y) <= 1 && flat[i + 1] === flat[i + 3]) longest = Math.max(longest, Math.abs(flat[i + 2] - flat[i]));
      }
    }
    return longest;
  };
  for (const ch of 'CEFGSTZ25') assert.ok(barAt(ch, cap) >= 60, `${ch} has a bar along the top (${barAt(ch, cap)} long, a letter is about 120 wide)`);
  for (const ch of 'CEGLSUZ25J') assert.ok(barAt(ch, 0) >= 60, `${ch} has a bar along the bottom (${barAt(ch, 0)} long)`);
  // And every letter keeps enough line to be a letter: at least its own height (an I is exactly that, one upright stem; the rest have more).
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const total = glyphs[ch][1].reduce((sum, flat) => { let t = 0; for (let i = 0; i + 3 < flat.length; i += 2) t += Math.hypot(flat[i + 2] - flat[i], flat[i + 3] - flat[i + 1]); return sum + t; }, 0);
    assert.ok(total >= 0.9 * cap, `${ch} has ${Math.round(total)} of line, at least a letter height (${cap})`);
    if (ch !== 'I') assert.ok(total > 1.8 * cap, `${ch} has more than one stem's worth of line (${Math.round(total)})`);
  }
});

// ---- The pixel font (drawn for TurtleLab: video game letters made of square pixels) -----------------------------------

const PIXEL = 12; // the size of one pixel in the font's own units: a capital is seven of them
const pixelGlyphs = FONT_DATA.pixel.glyphs;
const ys = (strokes) => strokes.flatMap((flat) => flat.filter((_, i) => i % 2 === 1));
const xs = (strokes) => strokes.flatMap((flat) => flat.filter((_, i) => i % 2 === 0));

test('pixel is the seventh font, and its tip says it is made of square pixels and that a thick pen fills them in', () => {
  assert.equal(LETTER_FONTS.length, 7);
  assert.equal(LETTER_FONTS[6].id, 'pixel');
  assert.equal(LETTER_FONTS[6].label, 'pixel');
  const { tip } = LETTER_FONTS[6];
  assert.match(tip, /pixels/);
  assert.match(tip, /thick pen|small size/);
  assert.ok(!/[\u2013\u2014]/.test(tip), 'no em or en dashes');
  assert.ok(!/minecraft|mojang/i.test(tip), 'no game named in the app');
  assert.equal(FONT_DATA.pixel.cap, 7 * PIXEL);
});

test('every pixel letter is the outline of square pixels: closed, straight across or straight up and down, and on the pixel grid', () => {
  for (const [ch, [advance, strokes]] of Object.entries(pixelGlyphs)) {
    assert.equal(advance % PIXEL, 0, `"${ch}" advance is whole pixels`);
    for (const flat of strokes) {
      assert.deepEqual(flat.slice(0, 2), flat.slice(-2), `"${ch}" a stroke is closed: it ends where it began`);
      assert.ok(flat.every((n) => n % PIXEL === 0), `"${ch}" every corner is on the pixel grid`);
      for (let i = 2; i < flat.length; i += 2) {
        const across = flat[i] - flat[i - 2];
        const up = flat[i + 1] - flat[i - 1];
        assert.ok((across === 0) !== (up === 0), `"${ch}" each side is straight across or straight up, never slanting and never nothing`);
      }
    }
  }
});

test('pixel capitals and digits are seven pixels tall on the baseline, small letters five, tall small letters seven, and tails hang two below', () => {
  const extent = (ch) => [Math.min(...ys(pixelGlyphs[ch][1])) / PIXEL, Math.max(...ys(pixelGlyphs[ch][1])) / PIXEL];
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') assert.deepEqual(extent(ch), [0, 7], ch);
  for (const ch of 'acemnorsuvwxz') assert.deepEqual(extent(ch), [0, 5], `${ch} is as tall as the middle of a b`);
  for (const ch of 'bdhkl') assert.deepEqual(extent(ch), [0, 7], ch);
  assert.deepEqual(extent('t'), [0, 6], 't is a little shorter than the tall ones');
  for (const ch of 'gpqy') assert.deepEqual(extent(ch), [-2, 5], `${ch} has a two pixel tail`);
  assert.deepEqual(extent('j'), [-2, 7]);
  assert.deepEqual(extent('i'), [0, 7], 'the dot of the i is as high as a capital');
  assert.deepEqual(extent('_'), [-1, 0], 'an underscore hangs just under the baseline');
});

test('pixel letters are as wide as their pixels, with one empty pixel after: an i is narrow, an m is wide, and a space is wide enough to see', () => {
  const pixels = (ch) => pixelGlyphs[ch][0] / PIXEL;
  assert.equal(pixels('i'), 2);
  assert.equal(pixels('l'), 4);
  assert.equal(pixels('I'), 4);
  assert.equal(pixels('m'), 6);
  assert.equal(pixels('H'), 6);
  assert.equal(pixels(' '), 4);
  assert.equal(pixels('.'), 2);
  assert.ok(pixels('i') < pixels('m'));
  for (const ch of 'ABCDEFGHJKLMNOPQRSTUVWXYZ') assert.equal(pixels(ch), 6, `${ch} is five pixels wide`);
  // Nothing sticks out of its own box on the right: the last pixel is one short of the advance, leaving the gap.
  for (const [ch, [advance, strokes]] of Object.entries(pixelGlyphs)) if (strokes.length > 0) assert.ok(Math.max(...xs(strokes)) <= advance - PIXEL, `"${ch}" leaves its gap`);
});

test('a dot is one pixel, a dash a bar of five at the middle, and a letter with a hole has a stroke round it as well as one round the hole', () => {
  assert.deepEqual(pixelGlyphs['.'][1], [[0, 0, 12, 0, 12, 12, 0, 12, 0, 0]]);
  assert.deepEqual(pixelGlyphs['-'][1], [[0, 36, 60, 36, 60, 48, 0, 48, 0, 36]]);
  assert.equal(pixelGlyphs.o[1].length, 2, 'o: outside, and the hole');
  assert.equal(pixelGlyphs.O[1].length, 2);
  assert.equal(pixelGlyphs.l[1].length, 1);
  assert.equal(pixelGlyphs.H[1].length, 1, 'H is one shape');
  assert.equal(pixelGlyphs[' '][1].length, 0);
  // The hole is smaller than the outside, and inside it.
  const [outside, hole] = pixelGlyphs.o[1];
  assert.ok(Math.min(...xs([hole])) > Math.min(...xs([outside])) && Math.max(...xs([hole])) < Math.max(...xs([outside])));
});

test('pixels that touch only at a corner are joined into one outline, so a letter does not fall into loose single pixels', () => {
  // The lone pixel at the left of the a's bowl touches the rest only at corners.
  assert.equal(pixelGlyphs.a[1].length, 2, 'a: outside (including that pixel) and the hole');
  assert.equal(pixelGlyphs.i[1].length, 2, 'i: the dot and the stem are apart (a gap between them)');
  for (const ch of 'CEFGHKLMNPQRSTUVWXYZ') assert.ok(pixelGlyphs[ch][1].length <= 2, `${ch} is one shape (two with a hole)`);
});

test('pixel words stitch in a handful of lines, and sit between the thin fonts and blocky in width', () => {
  assert.ok(letteringStrokes('Cougars', 110, 'pixel').length <= 12, 'about as many lines as script');
  const widths = Object.fromEntries(LETTER_FONTS.map((f) => [f.id, letteringWidth('Cougars', 60, f.id)]));
  assert.ok(widths.pixel > widths.script && widths.pixel < widths.blocky, JSON.stringify(widths));
  assert.equal(Math.round(widths.pixel), Math.round(41 * 60 / 7), 'Cougars is 41 pixels wide, seven pixels being the size');
});

test('the pixel font draws every key, and a capital H is exactly as tall as the size', () => {
  for (const ch of printable) assert.ok(Object.hasOwn(pixelGlyphs, ch), `"${ch}"`);
  for (const size of [7, 21, 60, 100]) assert.equal(Math.max(...letteringStrokes('H', size, 'pixel').flat().map((p) => p[1])), size);
});
