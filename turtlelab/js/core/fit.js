// TurtleLab: working out how to zoom the drawing so all of it fits.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// This file knows nothing about the screen. It reads the turtle's list of drawing ops
// (see turtle.js), finds the smallest box that holds everything that can still be seen,
// and says how to zoom and slide the paper so that box fills it. Things drawn off the
// edge of the paper count: that is the point.
//
// A "drawing view" is { zoom, cx, cy }: the paper shows the part of the world that is
// 700 / zoom wide and 560 / zoom tall, centered on the point (cx, cy). The default view
// is { zoom: 1, cx: 0, cy: 0 }, which is the paper as it has always been.

import { PAPER_W, PAPER_H } from './turtle.js';

export const DEFAULT_DRAW_VIEW = Object.freeze({ zoom: 1, cx: 0, cy: 0 });

/** Empty space left round the drawing, in paper units (the turtle fits in it too). */
export const FIT_MARGIN = 40;

/** How far we will zoom. (A single dot would otherwise zoom without end.) */
export const MIN_DRAW_ZOOM = 0.001;
export const MAX_DRAW_ZOOM = 10;

/** The paper as a box, for a picture that was opened from a file. */
const PAPER_BOX = Object.freeze({ minX: -PAPER_W / 2, minY: -PAPER_H / 2, maxX: PAPER_W / 2, maxY: PAPER_H / 2 });

const TWO_PI = Math.PI * 2;

/** Is this view the default one? */
export function isDefaultView(view) {
  return view.zoom === 1 && view.cx === 0 && view.cy === 0;
}

/**
 * The ops that can still be seen: a clear or a fill screen covers everything before it,
 * so only the last one and what follows count. `covers` says whether there was one (a
 * picture that was opened from a file is covered too, then).
 */
export function visibleOps(ops) {
  let start = -1;
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    if (ops[i].type === 'clear' || ops[i].type === 'fillScreen') {
      start = i;
      break;
    }
  }
  return { ops: start < 0 ? ops : ops.slice(start + 1), covers: start >= 0, start };
}

/** A box with nothing in it yet. */
function emptyBox() {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

function addPoint(box, x, y, pad = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  box.minX = Math.min(box.minX, x - pad);
  box.maxX = Math.max(box.maxX, x + pad);
  box.minY = Math.min(box.minY, y - pad);
  box.maxY = Math.max(box.maxY, y + pad);
}

/** Add every part of an arc: its ends, and any top, bottom, left or right of the circle it passes through. */
function addArc(box, seg, pad) {
  addPoint(box, seg.x1, seg.y1, pad);
  addPoint(box, seg.x2, seg.y2, pad);
  const { cx, cy, r, sweep } = seg;
  if (![cx, cy, r, sweep].every(Number.isFinite)) return;
  const sweepRadians = Math.abs(sweep) * (Math.PI / 180);
  if (sweepRadians >= TWO_PI) {
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) addPoint(box, cx + dx * r, cy + dy * r, pad);
    return;
  }
  // A positive sweep goes clockwise on the paper, so the angle (measured the usual maths way) goes down.
  const startAngle = Math.atan2(seg.y1 - cy, seg.x1 - cx);
  for (let k = 0; k < 4; k += 1) {
    const angle = (k * Math.PI) / 2;
    const travelled = sweep > 0 ? startAngle - angle : angle - startAngle;
    const along = ((travelled % TWO_PI) + TWO_PI) % TWO_PI;
    if (along <= sweepRadians) addPoint(box, cx + r * Math.cos(angle), cy + r * Math.sin(angle), pad);
  }
}

/**
 * The smallest box holding all these ops, or null if they draw nothing. A line is as fat as
 * its pen, so the box grows by half the pen size. A fill counts everywhere the turtle walked
 * while it was collecting the shape, including with the pen up.
 */
export function boundsOfOps(ops) {
  const box = emptyBox();
  for (const op of ops) {
    if (op.type === 'line') {
      const pad = Math.max(0, op.size) / 2;
      addPoint(box, op.x1, op.y1, pad);
      addPoint(box, op.x2, op.y2, pad);
    } else if (op.type === 'arc') {
      addArc(box, op, Math.max(0, op.size) / 2);
    } else if (op.type === 'fill') {
      for (const seg of op.segments) {
        const pad = seg.pen ? Math.max(0, seg.size) / 2 : 0;
        if (seg.type === 'line') {
          addPoint(box, seg.x1, seg.y1, pad);
          addPoint(box, seg.x2, seg.y2, pad);
        } else {
          addArc(box, seg, pad);
        }
      }
    }
  }
  return box.minX <= box.maxX ? box : null;
}

/**
 * Everything that has been drawn, as one box (or null if nothing has).
 *
 * @param {object[]} ops the turtle's ops since its picture was last cleaned
 * @param {object} [options]
 * @param {boolean} [options.hasPicture] a picture opened from a file lies under the ops (it counts as the
 *        whole paper, but only when something has been drawn on it)
 * @param {{x: number, y: number}[]} [options.extraPoints] spots that must stay in view
 *        (the turtle). They only count when something else has been drawn.
 */
export function drawingBounds(ops, { hasPicture = false, extraPoints = [] } = {}) {
  const seen = visibleOps(ops);
  let box = boundsOfOps(seen.ops);
  // A picture opened from a file, with nothing drawn on it, is already as it should be: nothing to fit.
  if (hasPicture && !seen.covers && box) {
    box = { minX: Math.min(box.minX, PAPER_BOX.minX), minY: Math.min(box.minY, PAPER_BOX.minY), maxX: Math.max(box.maxX, PAPER_BOX.maxX), maxY: Math.max(box.maxY, PAPER_BOX.maxY) };
  }
  if (!box) return null;
  for (const point of extraPoints) addPoint(box, point.x, point.y);
  return box;
}

/**
 * The view that makes a box fill the paper, with a little space round it. It zooms IN for a
 * small drawing and OUT for a big one. Nothing drawn (null) gives the default view.
 *
 * @returns {{zoom: number, cx: number, cy: number}}
 */
export function fitView(box, { width = PAPER_W, height = PAPER_H, margin = FIT_MARGIN } = {}) {
  if (!box) return { ...DEFAULT_DRAW_VIEW };
  const boxWidth = box.maxX - box.minX;
  const boxHeight = box.maxY - box.minY;
  const roomWidth = Math.max(1, width - 2 * margin);
  const roomHeight = Math.max(1, height - 2 * margin);
  let zoom = Math.min(boxWidth > 1e-9 ? roomWidth / boxWidth : Infinity, boxHeight > 1e-9 ? roomHeight / boxHeight : Infinity);
  if (!Number.isFinite(zoom)) zoom = 1; // a single dot: leave the size alone
  zoom = Math.min(MAX_DRAW_ZOOM, Math.max(MIN_DRAW_ZOOM, zoom));
  return { zoom, cx: (box.minX + box.maxX) / 2, cy: (box.minY + box.maxY) / 2 };
}

/** Where a spot of the world lands on the paper, in paper units from its top left corner. */
export function worldToPaper(view, x, y) {
  return { x: PAPER_W / 2 + (x - view.cx) * view.zoom, y: PAPER_H / 2 - (y - view.cy) * view.zoom };
}

/** The other way round: a spot of the paper (from its top left corner) to the world. */
export function paperToWorld(view, px, py) {
  return { x: view.cx + (px - PAPER_W / 2) / view.zoom, y: view.cy + (PAPER_H / 2 - py) / view.zoom };
}
