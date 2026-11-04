// TurtleLab: where the grid lines go.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The grid shows the turtle's x and y over the picture, so you can read off the numbers to
// type into set xy. This file works out which lines to draw for a view of the paper (see
// fit.js): not too many when zoomed out, not too few when zoomed in, always at "nice"
// numbers like 10, 20, 50, 100. It knows nothing about the screen.

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

/** The multiples of `step` from `low` to `high`, written so 0.1 + 0.2 style noise never shows. */
function multiples(low, high, step) {
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
