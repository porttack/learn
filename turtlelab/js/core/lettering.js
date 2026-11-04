// TurtleLab: letters drawn with the pen, for the write block.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A single-stroke script font (see lettering-data.js): every letter is a few lines drawn by one
// pen, joined up like handwriting, so a plotter or an embroidery machine can follow it. This
// file turns some words into lines on the page. It never touches the screen.
//
// Words are drawn left to right along a baseline, in "steps" (the turtle's own unit). A letter
// is `size` steps tall (the top of a capital letter to the bottom of it, not counting tails
// like the one on a g).

import { CAP_HEIGHT, GLYPHS } from './lettering-data.js';

/** The most letters a write block holds. */
export const LETTERING_MAX_CHARS = 40;

/** The size a write block starts with, and the smallest and biggest it will draw. */
export const DEFAULT_LETTER_SIZE = 60;
export const MIN_LETTER_SIZE = 1;
export const MAX_LETTER_SIZE = 600;

/** Can this letter be drawn? (Space, and the printable keys on an English keyboard.) */
export function canWrite(ch) {
  return Object.hasOwn(GLYPHS, ch);
}

/**
 * Words as a write block keeps them: only letters that can be drawn (anything else, like a
 * tab, a new line or an accented letter, is dropped), and at most LETTERING_MAX_CHARS of them.
 */
export function cleanLetteringText(text) {
  if (typeof text !== 'string') return '';
  return [...text].filter(canWrite).slice(0, LETTERING_MAX_CHARS).join('');
}

/** How far along the line the words reach, in steps. */
export function letteringWidth(text, size) {
  const scale = size / CAP_HEIGHT;
  let advance = 0;
  for (const ch of cleanLetteringText(text)) advance += GLYPHS[ch][0];
  return advance * scale;
}

/**
 * The words as lines. Each stroke is a list of [along, up] points, in steps, measured from where the
 * words start: `along` counts forward along the baseline and `up` counts up from it.
 *
 * @returns {number[][][]}
 */
export function letteringStrokes(text, size) {
  const scale = size / CAP_HEIGHT;
  const strokes = [];
  let at = 0;
  for (const ch of cleanLetteringText(text)) {
    const [advance, glyphStrokes] = GLYPHS[ch];
    for (const flat of glyphStrokes) {
      const stroke = [];
      for (let i = 0; i < flat.length; i += 2) stroke.push([(at + flat[i]) * scale, flat[i + 1] * scale]);
      strokes.push(stroke);
    }
    at += advance;
  }
  return strokes;
}
