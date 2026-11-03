// Turtle Draw: color helpers.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Colors are three numbers, red, green and blue, each from 0 to 255.
// Black is (0, 0, 0), white is (255, 255, 255), and any color with the
// three numbers equal is a gray.

/**
 * Turn any value into a whole number from 0 to 255.
 * Numbers outside the range are pulled back to the nearest end instead of
 * causing an error, because a loop that adds 10 to red every time should
 * simply stay at full red once it gets there.
 */
export function clampChannel(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(255, Math.max(0, n));
}

/** Make a clean [r, g, b] array of whole numbers from 0 to 255. */
export function makeColor(r, g, b) {
  return [clampChannel(r), clampChannel(g), clampChannel(b)];
}

/** "rgb(255, 0, 0)", the form the canvas understands. */
export function toCss([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

/** "#ff0000". */
export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
