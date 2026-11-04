// TurtleLab: the drawing on screen, and the turtle you can drag around.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Two layers sit on top of each other inside one box:
//
//   the paper   a <canvas> where the turtle's lines are drawn. It has a fixed
//               size (1400 x 1120 pixels, twice the 700 x 560 paper) no matter
//               how big the window is, so a saved picture is always the same.
//               CSS scales it to fit the window.
//   the turtle  a little SVG picture floating above the paper. It is NOT part
//               of the canvas, so it never ends up in a saved image.
//
// The turtle's drawing ops (see core/turtle.js) arrive through applyOp().

import { PAPER_W, PAPER_H, arcAngles } from '../core/turtle.js';
import { toCss } from '../core/color.js';
import { turtleSvg } from './artwork.js';

/** Canvas pixels per paper unit. */
export const PIXEL_RATIO = 2;

// How big the turtle is on the PDF's drawing, in paper units. A little bigger than the sprite on
// the screen (about 52 on an ordinary window), because the drawing is printed small and the
// reader needs to see at a glance which way the nose points.
export const PDF_TURTLE_SIZE = 70;

// ---- Painting ops onto a canvas ----------------------------------------

/**
 * Switch the canvas to paper coordinates: (0, 0) in the middle, x to the
 * right, y UP. (A canvas normally has y pointing down, so we flip it.)
 */
function usePaperCoordinates(ctx) {
  ctx.setTransform(
    PIXEL_RATIO, 0,
    0, -PIXEL_RATIO,
    (PAPER_W / 2) * PIXEL_RATIO,
    (PAPER_H / 2) * PIXEL_RATIO,
  );
}

function strokeSegment(ctx, seg) {
  // A line width of 0 would be ignored by the canvas (it keeps the old
  // width), so a pen size of 0 has to be skipped here.
  if (seg.size <= 0) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = seg.size;
  ctx.strokeStyle = toCss(seg.color);
  ctx.beginPath();
  addSegment(ctx, seg);
  ctx.stroke();
}

/** Add one line or arc to the path being built (works on ctx or a Path2D). */
function addSegment(path, seg) {
  if (seg.type === 'line') {
    path.moveTo(seg.x1, seg.y1);
    path.lineTo(seg.x2, seg.y2);
  } else {
    const { start, end, ccw } = arcAngles(seg);
    path.moveTo(seg.x1, seg.y1);
    path.arc(seg.cx, seg.cy, seg.r, start, end, ccw);
  }
}

/** Draw one op from the turtle onto the paper canvas. */
export function paintOp(ctx, op) {
  usePaperCoordinates(ctx);
  switch (op.type) {
    case 'clear':
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-PAPER_W / 2, -PAPER_H / 2, PAPER_W, PAPER_H);
      break;
    case 'fillScreen':
      ctx.fillStyle = toCss(op.color);
      ctx.fillRect(-PAPER_W / 2, -PAPER_H / 2, PAPER_W, PAPER_H);
      break;
    case 'line':
    case 'arc':
      strokeSegment(ctx, op);
      break;
    case 'fill':
      paintFill(ctx, op);
      break;
    default:
      break; // an op from a newer version: ignore it
  }
}

function paintFill(ctx, op) {
  const path = new Path2D();
  path.moveTo(op.segments[0].x1, op.segments[0].y1);
  for (const seg of op.segments) {
    if (seg.type === 'line') {
      path.lineTo(seg.x2, seg.y2);
    } else {
      const { start, end, ccw } = arcAngles(seg);
      path.arc(seg.cx, seg.cy, seg.r, start, end, ccw);
    }
  }
  path.closePath();
  ctx.fillStyle = toCss(op.color);
  ctx.fill(path);
  // The fill covers the inside half of the outline the turtle drew, so draw
  // the outline again on top.
  for (const seg of op.segments) {
    if (seg.pen) strokeSegment(ctx, seg);
  }
}

// ---- The view -----------------------------------------------------------

export class CanvasView {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the area the paper should fit inside
   * @param {import('../core/turtle.js').Turtle} options.turtle
   * @param {() => boolean} [options.isLocked] true while a program is running
   *        (the turtle can't be dragged then)
   */
  constructor({ stage, turtle, isLocked = () => false }) {
    this.stage = stage;
    this.turtle = turtle;
    this.isLocked = isLocked;
    this.scale = 1; // screen pixels per paper unit
    this.spriteSize = 64;
    this.syncQueued = false;

    this.box = document.createElement('div');
    this.box.className = 'paper-box';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'paper';
    this.canvas.width = PAPER_W * PIXEL_RATIO;
    this.canvas.height = PAPER_H * PIXEL_RATIO;
    this.ctx = this.canvas.getContext('2d');

    this.sprite = document.createElement('div');
    this.sprite.className = 'turtle-sprite';
    this.sprite.innerHTML = turtleSvg();

    this.box.append(this.canvas, this.sprite);
    stage.append(this.box);

    paintOp(this.ctx, { type: 'clear' });
    this.layout();
    new ResizeObserver(() => this.layout()).observe(stage);
    this.listenForDrags();
  }

  /** Put a picture on the paper, replacing what is there. (Used when a saved picture is opened.) */
  paintImage(image) {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
  }

  /** Draw an op the turtle just made. */
  applyOp(op) {
    paintOp(this.ctx, op);
  }

  /**
   * A copy of the paper with the turtle drawn on it, where it is now and facing the way it
   * faces now, for the PDF (a teacher grading a drawing wants to see which way the turtle
   * would go next). The paper itself is left alone, so a saved PNG never has a turtle in it.
   * `size` is how big to draw it, in paper units (a test makes it big to see which way it points).
   * Resolves to a new canvas the same size as the paper.
   */
  async paperWithTurtle(size = PDF_TURTLE_SIZE) {
    const copy = document.createElement('canvas');
    copy.width = this.canvas.width;
    copy.height = this.canvas.height;
    const context = copy.getContext('2d', { willReadFrequently: true });
    context.drawImage(this.canvas, 0, 0);

    const url = URL.createObjectURL(new Blob([turtleSvg()], { type: 'image/svg+xml' }));
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      const { x, y, heading } = this.turtle;
      const pixels = size * PIXEL_RATIO;
      // The same spot the sprite sits on the screen, in the paper's own pixels; the picture
      // faces up, so turning it clockwise by the heading points it the right way.
      context.translate((x + PAPER_W / 2) * PIXEL_RATIO, (PAPER_H / 2 - y) * PIXEL_RATIO);
      context.rotate((heading * Math.PI) / 180);
      context.drawImage(picture, -pixels / 2, -pixels / 2, pixels, pixels);
    } finally {
      URL.revokeObjectURL(url);
    }
    return copy;
  }

  /** Fit the paper inside the stage, keeping its shape, and center it. */
  layout() {
    const { clientWidth: w, clientHeight: h } = this.stage;
    if (w === 0 || h === 0) return;
    this.scale = Math.min(w / PAPER_W, h / PAPER_H);
    this.box.style.width = `${PAPER_W * this.scale}px`;
    this.box.style.height = `${PAPER_H * this.scale}px`;
    this.spriteSize = Math.round(Math.min(90, Math.max(44, 52 * this.scale)));
    this.sprite.style.width = `${this.spriteSize}px`;
    this.sprite.style.height = `${this.spriteSize}px`;
    this.sync();
  }

  /** Put the turtle picture where the turtle is. */
  sync() {
    const { x, y, heading } = this.turtle;
    const px = (x + PAPER_W / 2) * this.scale;
    const py = (PAPER_H / 2 - y) * this.scale;
    const half = this.spriteSize / 2;
    this.sprite.style.transform = `translate(${px - half}px, ${py - half}px) rotate(${heading}deg)`;
  }

  /**
   * Like sync(), but at most once per frame. A program running at full speed
   * moves the turtle thousands of times a second, and the screen only needs
   * to hear about the last one.
   */
  requestSync() {
    if (this.syncQueued) return;
    this.syncQueued = true;
    requestAnimationFrame(() => {
      this.syncQueued = false;
      this.sync();
    });
  }

  // ---- Dragging the turtle ---------------------------------------------

  // Grab the turtle by its shell to move it, or by its head to turn it.
  listenForDrags() {
    let drag = null;

    this.sprite.addEventListener('pointerdown', (event) => {
      if (this.isLocked() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const center = this.spriteCenter();
      const dx = event.clientX - center.x;
      const dy = event.clientY - center.y;

      // Undo the sprite's rotation to see where we touched, as if the turtle
      // were facing straight up. Then the head is just "up from the middle".
      const turn = (this.turtle.heading * Math.PI) / 180;
      const localX = dx * Math.cos(turn) + dy * Math.sin(turn);
      const localY = -dx * Math.sin(turn) + dy * Math.cos(turn);
      const size = this.spriteSize;
      const onHead = Math.hypot(localX, localY + 0.32 * size) < 0.2 * size;

      drag = { mode: onHead ? 'turn' : 'move', grabX: dx, grabY: dy };
      this.sprite.setPointerCapture(event.pointerId);
      this.sprite.classList.add('dragging');
      event.preventDefault();
    });

    this.sprite.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const rect = this.box.getBoundingClientRect();
      if (drag.mode === 'move') {
        const px = event.clientX - drag.grabX - rect.left;
        const py = event.clientY - drag.grabY - rect.top;
        const x = clamp(Math.round(px / this.scale - PAPER_W / 2), -PAPER_W / 2, PAPER_W / 2);
        const y = clamp(Math.round(PAPER_H / 2 - py / this.scale), -PAPER_H / 2, PAPER_H / 2);
        this.turtle.place(x, y);
      } else {
        const center = this.spriteCenter();
        const dx = event.clientX - center.x;
        const dy = event.clientY - center.y;
        let degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
        degrees = event.shiftKey ? Math.round(degrees / 15) * 15 : Math.round(degrees);
        this.turtle.setHeading(degrees);
      }
      this.sync();
    });

    const finish = () => {
      drag = null;
      this.sprite.classList.remove('dragging');
    };
    this.sprite.addEventListener('pointerup', finish);
    this.sprite.addEventListener('pointercancel', finish);
  }

  /** Where the middle of the turtle is on the screen. */
  spriteCenter() {
    const rect = this.box.getBoundingClientRect();
    return {
      x: rect.left + (this.turtle.x + PAPER_W / 2) * this.scale,
      y: rect.top + (PAPER_H / 2 - this.turtle.y) * this.scale,
    };
  }
}

function clamp(n, low, high) {
  return Math.min(high, Math.max(low, n));
}
