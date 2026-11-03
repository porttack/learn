// TurtleLab: the names of blocks you make yourself, and of their inputs.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A name is typed by a student and ends up on a block, in an error message,
// and in a saved file, so the rules are small and strict: letters, numbers,
// underscores and single spaces, and not too long. Two names are "the same"
// if they differ only in capital letters, so Square and square cannot both exist.

/** The longest name for a block you make. It has to fit on a block. */
export const NAME_MAX = 16;

/** The longest name for an input. Shorter, because it sits in a small box. */
export const INPUT_MAX = 10;

/** How many inputs a block you make can have. */
export const MAX_INPUTS = 2;

const GOOD = /^[\p{L}\p{N}_]+( [\p{L}\p{N}_]+)*$/u;

/** Typed text with no spaces at the ends and one space between words. Anything but text becomes ''. */
export function tidyName(text) {
  return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
}

/** What two names are compared by: the same letters, whatever the capitals. */
export function nameKey(name) {
  return tidyName(name).toLowerCase();
}

/** Null if `text` is a fine name of at most `max` characters. Otherwise a sentence saying what is wrong. */
export function nameProblem(text, max) {
  const name = tidyName(text);
  if (name === '') return 'A name needs at least one letter or number.';
  if (name.length > max) return `That name is too long. Use ${max} characters or fewer.`;
  if (!GOOD.test(name)) return 'A name can only use letters, numbers, spaces and underscores.';
  return null;
}

/**
 * Make any value into a good name no longer than `max`, for reading a file:
 * odd characters are dropped, long names are cut, and if nothing is left the
 * `fallback` is used. A name that is already good comes back unchanged.
 */
export function cleanName(value, max, fallback) {
  const kept = tidyName(typeof value === 'string' ? value.replace(/[^\p{L}\p{N}_ ]/gu, '') : '').slice(0, max);
  return tidyName(kept) || fallback;
}

/**
 * A name like `base` that is not in `taken` (a Set of nameKeys): `base`
 * itself if it is free, otherwise `base2`, `base3` and so on.
 */
export function uniqueName(base, taken, max = NAME_MAX) {
  let name = tidyName(base).slice(0, max);
  for (let n = 2; taken.has(nameKey(name)); n += 1) {
    const suffix = String(n);
    name = tidyName(base).slice(0, max - suffix.length) + suffix;
  }
  return name;
}
