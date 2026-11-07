// TurtleLab: letters drawn with the pen, for the write block.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Single-stroke fonts (see lettering-data.js): every letter is a few lines drawn by one pen, so a
// plotter or an embroidery machine can follow it. There are seven to choose from (LETTER_FONTS). This
// file turns some words into lines on the page. It never touches the screen.
//
// Words are drawn left to right along a baseline, in "steps" (the turtle's own unit). A letter
// is `size` steps tall (the top of a capital letter to the bottom of it, not counting tails
// like the one on a g).

import { FONT_DATA } from './lettering-data.js';

/**
 * The fonts a write block can use, in the order the dropdown lists them. `id` is what a block keeps
 * (and what the Logo word after the size is), `label` is what the dropdown shows, and `tip` says what it
 * looks like and how it stitches. The first is the one a block has until you choose another.
 * Every font has the same 95 letters, and every capital letter is as tall as `size`.
 */
export const LETTER_FONTS = [
  { id: 'script', label: 'script', tip: 'joined up handwriting. Few lines, so it stitches well.' },
  { id: 'fancy', label: 'fancy', tip: 'formal joined up writing with loops. More lines than script, so use a bigger size.' },
  { id: 'sans', label: 'sans', tip: 'thin print letters, one line each. Few lines, so it stitches well.' },
  { id: 'bold', label: 'bold', tip: 'print letters drawn as double lines, so they stitch thick. More lines, so use a bigger size.' },
  { id: 'serif', label: 'serif', tip: 'print letters with feet. More lines, so use a bigger size.' },
  { id: 'blocky', label: 'blocky', tip: 'wide letters with square, cut off corners, like a robot sign. Few lines, so it stitches well, but it is wider than the others, so words take more room.' },
  { id: 'pixel', label: 'pixel', tip: 'video game letters made of square pixels, drawn as the outline of the pixels. A thick pen or a small size fills them in. About as few lines as script, but wider.' },
];

/** The most the writing can be bent: all the way round a circle, either way. (Degrees.) */
export const MAX_CURVE = 360;
/** A bend smaller than this is straight (a radius that big is not worth working out). (Degrees.) */
export const MIN_CURVE = 0.01;

/** The font a write block has until you choose another. */
export const DEFAULT_FONT = LETTER_FONTS[0].id;

/** Is this the id of a font? (Not "toString", not a made-up name, not a number.) */
export function isFont(id) {
  return typeof id === 'string' && LETTER_FONTS.some((font) => font.id === id);
}

/** A font id a block may keep: the one given if it is a real font, otherwise the default. */
export function cleanFont(id) {
  return isFont(id) ? id : DEFAULT_FONT;
}

const glyphsOf = (font) => FONT_DATA[cleanFont(font)].glyphs;
const capOf = (font) => FONT_DATA[cleanFont(font)].cap;

/** The most letters a write block holds. */
export const LETTERING_MAX_CHARS = 40;

/** The size a write block starts with, and the smallest and biggest it will draw. */
export const DEFAULT_LETTER_SIZE = 60;
export const MIN_LETTER_SIZE = 1;
export const MAX_LETTER_SIZE = 600;

/** Can this letter be drawn? (Space, and the printable keys on an English keyboard.) */
export function canWrite(ch) {
  return Object.hasOwn(FONT_DATA[DEFAULT_FONT].glyphs, ch); // every font has the same letters
}

/**
 * Words as a write block keeps them: only letters that can be drawn (anything else, like a
 * tab, a new line or an accented letter, is dropped), and at most LETTERING_MAX_CHARS of them (or `max`, for a block that asks for more: the ask block's question).
 */
export function cleanLetteringText(text, max = LETTERING_MAX_CHARS) {
  if (typeof text !== 'string') return '';
  return [...text].filter(canWrite).slice(0, max).join('');
}

/** How far along the line the words reach, in steps, in this font (the default one if none is given). */
export function letteringWidth(text, size, font = DEFAULT_FONT) {
  const glyphs = glyphsOf(font);
  const scale = size / capOf(font);
  let advance = 0;
  for (const ch of cleanLetteringText(text)) advance += glyphs[ch][0];
  return advance * scale;
}

/**
 * The words one letter at a time, each as its own lines, in the order they are written. A letter is a list of strokes,
 * and a stroke is a list of [along, up] points, in steps, measured from where the words start: `along` counts forward
 * along the baseline and `up` counts up from it. A letter that draws nothing (a space) is left out, but still takes
 * its room, so the letters after it are where they should be. This is what the write block steps through, one letter
 * for each step of the program, so the words appear at the speed the program is set to.
 *
 * @returns {number[][][][]}
 */
export function letteringLetters(text, size, font = DEFAULT_FONT) {
  const glyphs = glyphsOf(font);
  const scale = size / capOf(font);
  const letters = [];
  let at = 0;
  for (const ch of cleanLetteringText(text)) {
    const [advance, glyphStrokes] = glyphs[ch];
    if (glyphStrokes.length > 0) {
      letters.push(glyphStrokes.map((flat) => {
        const stroke = [];
        for (let i = 0; i < flat.length; i += 2) stroke.push([(at + flat[i]) * scale, flat[i + 1] * scale]);
        return stroke;
      }));
    }
    at += advance;
  }
  return letters;
}

/** All the words as lines at once (the same strokes as letteringLetters, run together). @returns {number[][][]} */
export function letteringStrokes(text, size, font = DEFAULT_FONT) {
  return letteringLetters(text, size, font).flat();
}

/**
 * Where a point of the words lands once they are bent. `u` is how far along the line the point is and `v` how far up from it
 * (both in steps, as letteringLetters gives them), `width` is how long the words are, and `curve` is how many degrees the
 * baseline bends over its whole length: 0 is straight, a positive number arches like a rainbow with the letters outside the
 * circle, and a negative number is a bowl like a smile with the letters inside it. Bent words are centered on the turtle (the
 * top of the arch, or the bottom of the bowl, is where the turtle is). Straight words start at the turtle, as always.
 * The answer is measured from the turtle with the words upright (the turtle facing up), in steps, x to the right and y up.
 *
 * @returns {[number, number]}
 */
export function curvePoint(u, v, width, curve) {
  if (!(Math.abs(curve) >= MIN_CURVE) || !(width > 0)) return [u, v];
  const radius = width / ((Math.min(Math.abs(curve), MAX_CURVE) * Math.PI) / 180); // the baseline is `width` long, round this circle
  const turned = (u - width / 2) / radius; // how far round the circle, in radians, from the middle of the words
  if (curve > 0) {
    const out = radius + v; // letters stand outward, away from the middle of the circle
    return [out * Math.sin(turned), out * Math.cos(turned) - radius];
  }
  const out = radius - v; // letters stand inward, toward the middle of the circle
  return [out * Math.sin(turned), radius - out * Math.cos(turned)];
}
