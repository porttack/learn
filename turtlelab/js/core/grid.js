// TurtleLab: where the grid lines go.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The grid shows the turtle's x and y over the picture, so you can read off the numbers to
// type into set xy. This file works out which lines to draw for a view of the paper (see
// fit.js): not too many when zoomed out, not too few when zoomed in, always at "nice"
// numbers like 10, 20, 50, 100. It knows nothing about the screen.
//
// There are several kinds of grid (GRID_TYPES): squares with x and y numbers, plain squares, dots, circles
// and angles (polar). Each has its own function here that says what to draw, in the
// turtle's own units; js/ui/grid-paint.js draws it.

import { PAPER_W, PAPER_H } from './turtle.js';

/** The closest two lines may be, in paper units on the screen (about a fingertip). */
export const MIN_LINE_GAP = 50;

/** The smallest of 1, 2, 5, 10, 20, 50, 100 ... that is at least `least`. */
export function niceStep(least) {
  if (!(least > 0) || !Number.isFinite(least)) return 1;
  const power = 10 ** Math.floor(Math.log10(least));
  for (const factor of [1, 2, 5, 10]) {
    if (factor * power >= least * (1 - 1e-12)) return factor * power;
  }
  return 10 * power;
}

/** A number written for a label: whole numbers as they are, others without noise. */
export function labelFor(value) {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded === 0 ? 0 : rounded);
}

/**
 * The kinds of grid, in the order the menu lists them. `numbers` is the one the grid button has always shown. The words are for the menu,
 * so they are for a person using TurtleLab, and say what the grid is good for.
 */
export const GRID_TYPES = [
  { id: 'numbers', label: 'Squares with x and y numbers', hint: 'The numbers you type into set xy' },
  { id: 'squares', label: 'Squares', hint: 'The same lines, without the numbers' },
  { id: 'dots', label: 'Dots', hint: 'A dot wherever the lines would cross' },
  { id: 'polar', label: 'Circles and angles', hint: 'How far from the middle, and which way: the numbers for forward and set heading' },
];

/** The grid a new page starts with when the button is pressed. */
export const DEFAULT_GRID = 'numbers';

/** The kind of grid with this id, or null if there is none. */
export function gridTypeById(id) {
  return GRID_TYPES.find((type) => type.id === id) ?? null;
}

/** The multiples of `step` from `low` to `high`, written so 0.1 + 0.2 style noise never shows. */
export function multiples(low, high, step) {
  const values = [];
  const first = Math.ceil(low / step - 1e-9);
  const last = Math.floor(high / step + 1e-9);
  for (let k = first; k <= last && values.length < 400; k += 1) {
    const value = Math.round(k * step * 1e6) / 1e6;
    values.push(value === 0 ? 0 : value);
  }
  return values;
}

/**
 * The grid lines to draw for a view: `step` is the gap between lines, and `xs` and `ys` are the
 * x values of the vertical lines and the y values of the horizontal ones that are on the paper.
 * Zero is always one of them when it is on the paper (those are the axes).
 */
export function gridLines(view, { width = PAPER_W, height = PAPER_H, minGap = MIN_LINE_GAP } = {}) {
  const step = niceStep(minGap / view.zoom);
  const halfWidth = width / 2 / view.zoom;
  const halfHeight = height / 2 / view.zoom;
  return {
    step,
    xs: multiples(view.cx - halfWidth, view.cx + halfWidth, step),
    ys: multiples(view.cy - halfHeight, view.cy + halfHeight, step),
  };
}

/** The corners of what a view shows of the paper, in the turtle's units, and the sides. */
function visible(view, { width, height }) {
  const halfWidth = width / 2 / view.zoom;
  const halfHeight = height / 2 / view.zoom;
  const left = view.cx - halfWidth;
  const right = view.cx + halfWidth;
  const bottom = view.cy - halfHeight;
  const top = view.cy + halfHeight;
  return { left, right, bottom, top, corners: [[left, bottom], [left, top], [right, bottom], [right, top]] };
}

/**
 * The circles and angles grid for a view: rings around the origin, `step` apart (the same spacing rule as the squares, so they are never too close),
 * and a spoke every 30 degrees. Headings are the turtle's own: 0 is up and they grow clockwise, so 90 is to the right, the way right and set heading
 * count. `reach` is how far from the origin the farthest visible corner is, which is how long the spokes need to be.
 */
export function polarGrid(view, { width = PAPER_W, height = PAPER_H, minGap = MIN_LINE_GAP, maxRings = 60 } = {}) {
  const step = niceStep(minGap / view.zoom);
  const { left, right, bottom, top, corners } = visible(view, { width, height });
  // The nearest and farthest the visible paper gets from the origin, so only the rings that cross it are listed.
  const nearest = Math.hypot(Math.min(Math.max(0, left), right), Math.min(Math.max(0, bottom), top));
  const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x, y)));
  const rings = [];
  for (let m = Math.max(1, Math.ceil(nearest / step - 1e-9)); m * step <= reach + 1e-9 && rings.length < maxRings; m += 1) {
    rings.push(Math.round(m * step * 1e6) / 1e6);
  }
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  return { step, rings, spokes, reach };
}
