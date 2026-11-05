// TurtleLab: the wobble of a hand drawn line, and the grain of chalk.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The whiteboard and chalkboard papers (core/paper.js) show the drawing as if a hand had made it: every point of a line is moved a little, by a smooth
// repeatable wobble, so a straight line gently wanders. The wobble is a function of WHERE a point is in the turtle's world, not of which line it
// belongs to, so two lines that meet at a corner are moved the same way there and still meet, a closed shape stays closed, the same drawing wobbles the
// same way every time it is painted (zoomed, slid, painted again), and the grid, which uses the same function, still lines up with the drawing.
//
// Each time a hand drawn paper is chosen it gets a new `look` (newHandLook): a new random seed for the wobble (so the lines wander in different
// places), a little more or less wobble, and a little more or less dirt on the board. The look is kept only while the page is open.
//
// This only changes how the drawing is SHOWN. The paper the turtle really draws on, and everything saved from it, never wobbles. (js/ui/canvas-view.js
// does the showing.) Everything here is in the turtle's own units and knows nothing about the screen.

import { arcAngles } from './turtle.js';

/** The farthest a point moves, in the turtle's units (about that many pixels on an ordinary window). */
export const HAND_WOBBLE = 3;

/** How far apart the bumps of the wobble are: a long slow wander, and a shorter, smaller one on top of it. */
const LONG_WAVE = 64;
const SHORT_WAVE = 27;

/** A line is cut into pieces no longer than this before its points are moved, so the wobble can bend it. */
export const HAND_STEP = 6;

/** The most pieces one line is cut into, so a line a million units long cannot take all day (it just wobbles less finely). */
export const MAX_PIECES = 400;

/** A repeatable number from -1 to 1 for a whole-number spot on a grid. `salt` makes a different set of numbers. */
function lattice(ix, iy, salt) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(salt | 0, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Smooth noise from -1 to 1: the lattice numbers at the corners of a square `wave` wide, blended between. */
function smooth(x, y, wave, salt, lookup = lattice) {
  const gx = x / wave;
  const gy = y / wave;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = fade(gx - ix);
  const fy = fade(gy - iy);
  const top = lookup(ix, iy, salt) * (1 - fx) + lookup(ix + 1, iy, salt) * fx;
  const bottom = lookup(ix, iy + 1, salt) * (1 - fx) + lookup(ix + 1, iy + 1, salt) * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * The look of a hand drawn paper: `seed` decides where the lines wander (a different seed is a different wobble), `amount` is the most a point
 * moves, `dirt` says how smudged the board is (1 is as it was made, less is cleaner, more is dirtier), and `swipes` is how many more swipes of the
 * cloth than the paper's own number. Without one, the plain look: seed 0 and the usual amount.
 * @typedef {{ seed?: number, amount?: number, dirt?: number, swipes?: number }} HandLook
 */

/** The same wobble from the same seed: the salt of a layer of noise, moved along by the seed. */
const saltFor = (layer, seed) => layer + Math.imul(seed | 0, 40503);

/**
 * A new look, by chance: a new seed, between three quarters and one and a half times the usual wobble, between 0.7 and 1.5 times the dirt, and
 * 0 to 3 more swipes of the cloth. `random` is anything that gives numbers from 0 up to (not including) 1, so a test can give it a fixed one.
 * @returns {{ seed: number, amount: number, dirt: number, swipes: number }}
 */
export function newHandLook(random = Math.random) {
  return {
    seed: Math.floor(random() * 2147483647),
    amount: HAND_WOBBLE * (0.75 + random() * 0.75),
    dirt: 0.7 + random() * 0.8,
    swipes: Math.floor(random() * 4),
  };
}

/**
 * How far a hand moves the point (x, y): { dx, dy }, each between -amount and amount, changing smoothly from place to place (nearby points move almost
 * the same way). Anything that is not a number does not move.
 * @param {HandLook} [look]
 */
export function wobbleAt(x, y, { amount = HAND_WOBBLE, seed = 0 } = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { dx: 0, dy: 0 };
  const dx = 0.7 * smooth(x, y, LONG_WAVE, saltFor(1, seed)) + 0.3 * smooth(x, y, SHORT_WAVE, saltFor(2, seed));
  const dy = 0.7 * smooth(x, y, LONG_WAVE, saltFor(3, seed)) + 0.3 * smooth(x, y, SHORT_WAVE, saltFor(4, seed));
  return { dx: dx * amount, dy: dy * amount };
}

/** A point, moved by the wobble. @param {HandLook} [look] */
export function handPoint(x, y, look = {}) {
  const { dx, dy } = wobbleAt(x, y, look);
  return { x: x + dx, y: y + dy };
}

/** How many pieces to cut a line `length` long into. */
function pieces(length) {
  return Math.min(MAX_PIECES, Math.max(1, Math.ceil(length / HAND_STEP)));
}

/** The points of a line from (x1, y1) to (x2, y2), cut into short pieces and wobbled: the first and last are exactly where a corner there would be. @param {HandLook} [look] */
export function handLine({ x1, y1, x2, y2 }, look = {}) {
  const count = pieces(Math.hypot(x2 - x1, y2 - y1));
  const points = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    points.push(handPoint(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, look));
  }
  return points;
}

/**
 * The points of an arc op ({ cx, cy, r, x1, y1, sweep }, the turtle's own), cut into short pieces and wobbled. The angle runs the way the turtle
 * turned: arcAngles says where it starts, and `sweep` degrees (positive curves left, negative right) is how far it goes.
 * @param {HandLook} [look]
 */
export function handArc(op, look = {}) {
  const { start } = arcAngles(op);
  const turned = (op.sweep * Math.PI) / 180;
  const count = pieces(Math.abs(turned) * op.r);
  const points = [];
  for (let i = 0; i <= count; i += 1) {
    const angle = start - (turned * i) / count;
    points.push(handPoint(op.cx + op.r * Math.cos(angle), op.cy + op.r * Math.sin(angle), look));
  }
  return points;
}

/** The points of one line or arc segment of a drawing. @param {HandLook} [look] */
export function handSegment(seg, look = {}) {
  return seg.type === 'line' ? handLine(seg, look) : handArc(seg, look);
}

/** The outline of a fill (a list of segments that join end to end) as one run of points, wobbled the way each segment's own line is. @param {HandLook} [look] */
export function handOutline(segments, look = {}) {
  const points = [];
  for (const seg of segments) {
    const part = handSegment(seg, look);
    points.push(...(points.length > 0 ? part.slice(1) : part));
  }
  return points;
}

// ---- The grain of chalk ------------------------------------------------------------------------------------

/** How wide and tall the tile of chalk grain is, in pixels. It repeats, and its edges meet, so the repeating cannot be seen. */
export const GRAIN_SIZE = 256;

/** The little squares the soft part of the grain is made of, in pixels. */
const GRAIN_CELL = 4;

/**
 * A tile of chalk grain for a mask: an alpha number (0 to 255) for each pixel, row by row, `size` by `size`. Chalk does not cover a rough board evenly,
 * it skips: about a quarter of the tile is see-through, in specks and little clumps. Laid over a drawing as a mask, it makes the lines look like chalk.
 * It always comes out the same, and wraps round, so copies of it placed side by side join up.
 */
export function chalkGrain(size = GRAIN_SIZE) {
  const cells = Math.max(1, Math.floor(size / GRAIN_CELL));
  const wrapped = (ix, iy, salt) => lattice(((ix % cells) + cells) % cells, ((iy % cells) + cells) % cells, salt);
  const alpha = new Uint8ClampedArray(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const clump = (smooth(x / GRAIN_CELL, y / GRAIN_CELL, 1, 7, wrapped) + 1) / 2; // soft, in little clumps
      const fine = (lattice(x, y, 11) + 1) / 2; // and a speck here and there
      const covered = 0.55 * clump + 0.45 * fine;
      alpha[y * size + x] = Math.round(Math.min(1, Math.max(0, (covered - 0.3) / 0.14)) * 255);
    }
  }
  return alpha;
}
