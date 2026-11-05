// TurtleLab: color helpers.
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

// ---- Showing a color in other ways: hex and binary (for the color picker) ---------------------------------------
// A color is three numbers from 0 to 255. Each number is one byte, so it is also 2 digits of hex or 8 digits of binary (bits).
// These turn colors and numbers into those forms and back, for the picker on the set color and fill screen blocks.

/** "#FF8000": the hex of a color in capitals, as the color box on a block and the picker show it. */
export function toHexUpper(color) {
  return toHex(color).toUpperCase();
}

/** One number as two hex digits in capitals: 255 is "FF" and 5 is "05". */
export function channelHex(n) {
  return clampChannel(n).toString(16).toUpperCase().padStart(2, '0');
}

/** One number as eight binary digits: 5 is "00000101" and 255 is "11111111". */
export function channelBinary(n) {
  return clampChannel(n).toString(2).padStart(8, '0');
}

/** The three numbers as 24 bits, a group of 8 for each: "11111111 10000000 00000000". */
export function colorBits(color) {
  return color.map(channelBinary).join(' ');
}

/**
 * Read hex typed by a person: "#ff8000", "FF8000", "#f80" (each digit doubled, so #f80 is #ff8800), with or without the #, in any case, with spaces
 * round it. Returns [r, g, b], or null if it is not a whole color yet.
 */
export function parseHex(text) {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(text).trim());
  if (!match) return null;
  let digits = match[1];
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join('');
  return [0, 2, 4].map((at) => parseInt(digits.slice(at, at + 2), 16));
}

/** One or two hex digits as a number from 0 to 255 ("f" is 15, "ff" is 255), or null if it is anything else. */
export function parseChannelHex(text) {
  const clean = String(text).trim();
  return /^[0-9a-f]{1,2}$/i.test(clean) ? parseInt(clean, 16) : null;
}

/** One to eight binary digits (spaces are ignored) as a number from 0 to 255 ("101" is 5), or null if it is anything else. */
export function parseBinary(text) {
  const clean = String(text).replace(/\s+/g, '');
  return /^[01]{1,8}$/.test(clean) ? parseInt(clean, 2) : null;
}

/**
 * The color a set color or fill screen block has, if all three of its sockets hold plain numbers: [r, g, b] pulled into 0 to 255 (a
 * socket with nothing in it counts as its `defaults`). Returns null if any socket has another block plugged into it, because then the
 * color is not one color.
 */
export function colorOfArgs(args, defaults = [0, 0, 0]) {
  const color = [];
  for (let i = 0; i < 3; i += 1) {
    const value = args?.[i];
    if (value !== null && typeof value === 'object') return null;
    color.push(clampChannel(value === undefined || value === null ? defaults[i] ?? 0 : value));
  }
  return color;
}
