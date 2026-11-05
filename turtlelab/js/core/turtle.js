// TurtleLab: the turtle's state and geometry.
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

import { letteringLetters, letteringWidth, curvePoint, cleanFont, DEFAULT_FONT, MIN_LETTER_SIZE, MAX_LETTER_SIZE, MIN_CURVE, MAX_CURVE } from './lettering.js';

/** How much a step of walking between strokes counts for, against drawing the same distance (a hand moves faster when it is not writing). */
const WALK_COST = 0.35;

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
    this.writing = null;
    this.font = DEFAULT_FONT; // what the write block writes in
    this.curve = 0; // how many degrees the written words bend (0 is straight)
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

  /**
   * Start over without touching the picture. Used when a saved picture has just
   * been painted onto the paper: the turtle did not draw it, so it forgets any
   * earlier drawing (and the ops kept for SVG export) but nothing is cleared.
   */
  forget() {
    this.resetState();
    this.ops.length = 0;
    this.truncated = false;
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

  /** Choose the font the write block writes in from now on (an id from lettering.js; anything else is the default font). */
  setFont(id) {
    this.font = cleanFont(id);
  }

  /** Choose how many degrees the words a write block writes bend: 0 is straight, positive arches like a rainbow, negative is a bowl. */
  setCurve(degrees) {
    const n = Number(degrees);
    this.curve = Number.isFinite(n) ? Math.max(-MAX_CURVE, Math.min(MAX_CURVE, n)) : 0;
  }

  /**
   * Write words with the pen's color and thickness, in the turtle's font (`font` here only if you want another), with
   * the start of the line (its baseline) where the turtle is. `size` is how tall a capital letter is, in steps. The words stand
   * on the turtle's nose: the turtle facing up writes them upright, and turning it turns them with it. If the turtle has a
   * curve (setCurve) they bend that many degrees and are centered on the turtle instead (see curvePoint). The turtle does not
   * move, and neither does the pen being up: this is the turtle writing, not walking. Letters that cannot be drawn are skipped.
   *
   * This writes it all at once. The write block uses writeSteps instead, a piece of a line at a time.
   */
  write(text, size, font = this.font) {
    for (const _ of this.writeSteps(text, size, font)) { /* run it to the end */ }
  }

  /**
   * The same writing, but a little at a time (it is a generator), so the turtle can be watched doing it the way a hand would:
   * the pen is put down at the start of a stroke and drawn along it, lifted, walked to the start of the next stroke
   * (a letter like H has three), put down, and drawn again. Each time you ask for the next, the pen tip (`writing`: where the
   * picture of the turtle is shown while it writes, and which way it faces) moves a little further, drawing as it goes when
   * the pen is down. A long line is cut into pieces so it can be seen growing; when a straight line is finished the pieces are
   * joined back into the one line, so what is left is exactly what writing it all at once makes. (Bent words are made of the
   * little pieces, because a curve is not a straight line.)
   *
   * It gives back how much of a step that piece took: its share of its letter, so the pieces of one letter add up to 1 and
   * a letter takes the time of one step however it is drawn. (The pen walking between strokes counts for less than drawing,
   * as a hand moves faster when it is not writing.) Spaces draw nothing and take no time. When it is done, or is dropped
   * (stopWriting), the turtle is shown where it really is, which is where it started: writing never moves it.
   */
  *writeSteps(text, size, font = this.font) {
    if (!(size > 0)) return;
    const height = Math.min(MAX_LETTER_SIZE, Math.max(MIN_LETTER_SIZE, size));
    const letters = letteringLetters(text, height, font);
    const width = letteringWidth(text, height, font);
    const bent = Math.abs(this.curve) >= MIN_CURVE;
    const sin = sinDeg(this.heading);
    const cos = cosDeg(this.heading);
    // Where a point of the words lands, measured from the turtle: bend the words, then turn them the way the turtle is facing.
    const place = ([u, v]) => {
      const [x, y] = curvePoint(u, v, width, this.curve);
      return [x * cos + y * sin, -x * sin + y * cos];
    };
    const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    const longest = Math.max(0.5, height / 16); // the longest piece of a line shown in one go, in steps
    let tip = [0, 0]; // where the pen is, measured from the turtle (on the paper, after the bend and the turn)
    try {
      for (const strokes of letters) {
        // Each stroke as a walk (pen up) to where it starts, then pieces of it drawn. Drawn pieces are cut from the stroke as it
        // is in the letter and then placed, so a bent line follows the curve; a walk is a straight way across the paper.
        const pieces = [];
        for (const stroke of strokes) {
          const start = place(stroke[0]);
          const gap = Math.hypot(start[0] - tip[0], start[1] - tip[1]);
          if (gap > 1e-9) {
            const count = Math.max(1, Math.ceil(gap / longest));
            for (let j = 1; j <= count; j += 1) {
              const a = lerp(tip, start, (j - 1) / count);
              const b = lerp(tip, start, j / count);
              pieces.push({ draw: false, a, b, first: j === 1, last: j === count, count, cost: (WALK_COST * gap) / count });
            }
          }
          for (let i = 1; i < stroke.length; i += 1) {
            const from = stroke[i - 1];
            const to = stroke[i];
            const count = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / longest));
            for (let j = 1; j <= count; j += 1) {
              const a = place(lerp(from, to, (j - 1) / count));
              const b = place(lerp(from, to, j / count));
              pieces.push({ draw: true, a, b, first: j === 1, last: j === count, count, whole: [place(from), place(to)], cost: Math.hypot(b[0] - a[0], b[1] - a[1]) });
            }
          }
          tip = place(stroke[stroke.length - 1]);
        }
        const total = pieces.reduce((sum, piece) => sum + piece.cost, 0);
        let given = 0;
        let base = 0; // how many ops there were when the line being drawn was begun
        for (let k = 0; k < pieces.length; k += 1) {
          const { draw, a, b, first, last, count, whole } = pieces[k];
          if (first) base = this.ops.length;
          if (draw) {
            this.record({
              type: 'line',
              x1: this.x + a[0], y1: this.y + a[1], x2: this.x + b[0], y2: this.y + b[1],
              color: this.color.slice(),
              size: this.penSize,
            });
          }
          // The turtle faces the way the pen is going (0 is up, and turning right counts up).
          const still = a[0] === b[0] && a[1] === b[1];
          const facing = still ? this.writing?.heading ?? this.heading : normalizeHeading((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
          this.writing = { x: this.x + b[0], y: this.y + b[1], heading: facing };
          const share = k === pieces.length - 1 ? 1 - given : total > 0 ? pieces[k].cost / total : 1 / pieces.length;
          given += share;
          yield share;
          // A straight line is done: join its pieces back into the one line they were cut from (unless the oldest ops were
          // just thrown away to save memory, in which case they are not all there to join).
          if (last && draw && !bent && count > 1 && this.ops.length === base + count) {
            this.ops.splice(base, count, {
              type: 'line',
              x1: this.x + whole[0][0], y1: this.y + whole[0][1], x2: this.x + whole[1][0], y2: this.y + whole[1][1],
              color: this.color.slice(),
              size: this.penSize,
            });
          }
        }
      }
    } finally {
      this.writing = null;
    }
  }

  /** Show the turtle where it really is again (the write block was stopped part way, or has finished). */
  stopWriting() {
    this.writing = null;
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
