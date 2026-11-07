// TurtleLab: how numbers and answers are written for people to read.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.

/** A number as shown in a number box or printed: no tiny rounding noise. */
export function formatNumber(value) {
  if (value === null || value === undefined) return '';
  return String(Number(Number(value).toPrecision(10)));
}

/** Any value a block can report: a number, or true or false. */
export function formatValue(value) {
  return typeof value === 'boolean' ? String(value) : formatNumber(value);
}

/**
 * What a person typed into an ask box, as a number, or null if it is not one. Plain numbers only: 12, -3.5, .5, 7. (Not 1e3, 0x10, a word,
 * an empty box or Infinity, which a student typing quickly never means.) Spaces round it are fine.
 */
export function parseAnswer(text) {
  const typed = String(text ?? '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(typed)) return null;
  const value = Number(typed);
  return Number.isFinite(value) ? value : null;
}
