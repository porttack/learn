// Turtle Draw: the turtle's state and geometry.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// This file knows nothing about the screen. The turtle keeps track of where
// it is and which way it faces, and every time it draws something it writes
// a small "drawing op" (a plain object) describing it. Whoever is listening
// (the canvas on screen, or a test) turns those ops into pixels. The same
// list of ops is later used to export an SVG for a laser cutter.
//
// Coordinates: the paper is 700 wide and 560 tall. (0, 0) is the center,
// x grows to the right, y grows UP. Heading 0 points up and the heading
// grows clockwise, in degrees, so 90 points right.

import { makeColor } from './color.js';

export const PAPER_W = 700;
export const PAPER_H = 560;

/** The most drawing ops we keep for SVG export. See Turtle#record. */
export const MAX_OPS = 200000;

/** Round to 10 decimal places so 0.1 + 0.2 style noise never shows up. */
export function round10(n) {
  const r = Math.round(n * 1e10) / 1e10;
  return r === 0 ? 0 : r; // turn -0 into 0
}

/** Keep a heading in the range 0 up to (not including) 360. */
export function normalizeHeading(h) {
  const n = ((h % 360) + 360) % 360;
  return n;
}

// Sine and cosine of an angle in degrees. Turning exactly 90 degrees should
// give exactly 0 and 1, not 6.1e-17, or a square would not quite close.
export function sinDeg(d) {
  const n = normalizeHeading(d);
  if (n === 0 || n === 180) return 0;
  if (n === 90) return 1;
  if (n === 270) return -1;
  return Math.sin((n * Math.PI) / 180);
}
export function cosDeg(d) {
  const n = normalizeHeading(d);
  if (n === 90 || n === 270) return 0;
  if (n === 0) return 1;
  if (n === 180) return -1;
  return Math.cos((n * Math.PI) / 180);
}

/**
 * Where an arc op starts and ends, as the angles a canvas wants.
 *
 * Angles here are the usual maths ones: measured from the +x direction,
 * counterclockwise as you look at the paper, with y pointing up. A turtle
 * curving to its right goes clockwise, so its angle goes DOWN, and the
 * canvas calls that "anticlockwise" because it counts the other way round
 * from how a clock does. Hence ccw is true when the sweep is positive.
 */
export function arcAngles(op) {
  const start = Math.atan2(op.y1 - op.cy, op.x1 - op.cx);
  const end = start - (op.sweep * Math.PI) / 180;
  return { start, end, ccw: op.sweep > 0 };
}

export const DEFAULTS = Object.freeze({
  x: 0,
  y: 0,
  heading: 0,
  penDown: true,
  penSize: 5,
  color: [255, 0, 0],
});

/**
 * One turtle and the picture it has drawn.
 *
 * Drawing ops written to `onOp` and to `ops`:
 *   { type: 'clear' }
 *   { type: 'fillScreen', color }
 *   { type: 'line', x1, y1, x2, y2, color, size }
 *   { type: 'arc', cx, cy, r, x1, y1, x2, y2, sweep, color, size }
 *       sweep is in degrees, positive means the turtle curved to its right
 *   { type: 'fill', color, segments }   (see endFill)
 */
export class Turtle {
  /**
   * @param {object} [options]
   * @param {(op: object) => void} [options.onOp] called for every op, right away
   * @param {number} [options.maxOps] how many ops to remember for SVG export
   */
  constructor({ onOp = null, maxOps = MAX_OPS } = {}) {
    this.onOp = onOp;
    this.maxOps = maxOps;
    this.ops = [];
    /** True once old ops were thrown away to save memory. */
    this.truncated = false;
    this.fill = null; // the segments being collected, or null
    this.fillColor = null;
    this.resetState();
  }

  /** Put the turtle back to its starting state without touching the picture. */
  resetState() {
    this.x = DEFAULTS.x;
    this.y = DEFAULTS.y;
    this.heading = DEFAULTS.heading;
    this.penDown = DEFAULTS.penDown;
    this.penSize = DEFAULTS.penSize;
    this.color = DEFAULTS.color.slice();
    this.fill = null;
    this.fillColor = null;
  }

  /** Remember an op for SVG export and tell whoever is watching. */
  record(op) {
    this.ops.push(op);
    if (this.ops.length > this.maxOps) {
      // A forever loop could otherwise eat all the memory. The pixels are
      // already on the canvas, so only the SVG export loses the oldest part.
      this.ops.splice(0, this.ops.length >> 1);
      this.truncated = true;
    }
    if (this.onOp) this.onOp(op);
  }

  // ---- Turtle palette --------------------------------------------------

  /** Erase the picture and send the turtle home with the default pen. */
  clean() {
    this.resetState();
    // Nothing before a clear matters any more, so forget it.
    this.ops.length = 0;
    this.truncated = false;
    this.record({ type: 'clear' });
  }

  forward(distance) {
    const d = Number(distance);
    this.moveTo(
      this.x + d * sinDeg(this.heading),
      this.y + d * cosDeg(this.heading),
    );
  }

  back(distance) {
    this.forward(-Number(distance));
  }

  left(angle) {
    this.heading = normalizeHeading(this.heading - Number(angle));
  }

  right(angle) {
    this.heading = normalizeHeading(this.heading + Number(angle));
  }

  setHeading(angle) {
    this.heading = normalizeHeading(Number(angle));
  }

  /** Go to (x, y), drawing a line on the way if the pen is down. */
  setXY(x, y) {
    this.moveTo(Number(x), Number(y));
  }

  /**
   * Move along a circle. A positive angle curves to the right, a negative
   * angle curves to the left. The turtle ends up facing `angle` degrees
   * further around, like a car steering through a corner.
   */
  arc(angle, radius) {
    const sweep = Number(angle);
    const r = Math.abs(Number(radius));
    if (sweep === 0 || r === 0) return;

    // The circle's center is a distance r to the turtle's right (positive
    // sweep) or to its left (negative sweep).
    const side = sweep > 0 ? 1 : -1;
    const rightX = cosDeg(this.heading);
    const rightY = -sinDeg(this.heading);
    const cx = this.x + side * r * rightX;
    const cy = this.y + side * r * rightY;

    // Turn the turtle's offset from the center by the sweep. A clockwise
    // turn of t degrees turns a vector (vx, vy) into
    // (vx cos t + vy sin t, -vx sin t + vy cos t).
    const vx = this.x - cx;
    const vy = this.y - cy;
    const c = cosDeg(sweep);
    const s = sinDeg(sweep);
    const x2 = cx + vx * c + vy * s;
    const y2 = cy - vx * s + vy * c;

    if (this.penDown) {
      this.record({
        type: 'arc',
        cx, cy, r,
        x1: this.x, y1: this.y, x2, y2,
        sweep,
        color: this.color.slice(),
        size: this.penSize,
      });
    }
    if (this.fill) {
      this.fill.push({
        type: 'arc', cx, cy, r,
        x1: this.x, y1: this.y, x2, y2, sweep,
        pen: this.penDown, color: this.color.slice(), size: this.penSize,
      });
    }
    this.x = x2;
    this.y = y2;
    this.heading = normalizeHeading(this.heading + sweep);
  }

  /**
   * Put the turtle somewhere without drawing. This is what dragging the
   * turtle with the mouse does. It is not a block.
   */
  place(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }

  // ---- Pen palette -----------------------------------------------------

  setPenUp() {
    this.penDown = false;
  }

  setPenDown() {
    this.penDown = true;
  }

  setPenSize(size) {
    const n = Number(size);
    this.penSize = Number.isFinite(n) ? Math.min(500, Math.max(0, n)) : 0;
  }

  setColor(r, g, b) {
    this.color = makeColor(r, g, b);
  }

  /** Cover the whole paper with one color. The turtle and pen don't change. */
  fillScreen(r, g, b) {
    this.record({ type: 'fillScreen', color: makeColor(r, g, b) });
  }

  /**
   * Start remembering the path the turtle walks. The shape is filled in
   * when endFill runs, using the pen color the turtle has right now.
   * Moves with the pen up count too: the fill follows the turtle's whole
   * walk, the same way Python's turtle module does.
   */
  startFill() {
    if (this.fill) this.endFill(); // finish the shape we were already making
    this.fill = [];
    this.fillColor = this.color.slice();
  }

  /**
   * Fill the shape the turtle walked since startFill. The fill goes on top
   * of the picture, and the outline the turtle drew is painted over it
   * again, so the edge stays crisp.
   */
  endFill() {
    const segments = this.fill;
    const color = this.fillColor;
    this.fill = null;
    this.fillColor = null;
    if (!segments || segments.length === 0) return;
    this.record({ type: 'fill', color, segments });
  }

  // ---- Helpers ---------------------------------------------------------

  /** Walk in a straight line to (x2, y2). */
  moveTo(x2, y2) {
    const { x, y } = this;
    if (this.penDown) {
      this.record({
        type: 'line',
        x1: x, y1: y, x2, y2,
        color: this.color.slice(),
        size: this.penSize,
      });
    }
    if (this.fill) {
      this.fill.push({
        type: 'line',
        x1: x, y1: y, x2, y2,
        pen: this.penDown, color: this.color.slice(), size: this.penSize,
      });
    }
    this.x = x2;
    this.y = y2;
  }

  /** What the x, y and heading blocks report: tidy numbers. */
  get reportedX() { return round10(this.x); }
  get reportedY() { return round10(this.y); }
  get reportedHeading() { return round10(this.heading) % 360; }
}
