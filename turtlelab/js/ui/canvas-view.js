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
//
// The paper can be zoomed and slid to show a different part of the world (see core/fit.js).
// That is a change of view only: the turtle's x and y mean the same thing, and the picture is
// painted again from the turtle's list of ops. A picture opened from a file lies under those
// ops as one image.

import { PAPER_W, PAPER_H, arcAngles } from '../core/turtle.js';
import { toCss } from '../core/color.js';
import { DEFAULT_DRAW_VIEW, drawingBounds, fitView, isDefaultView, paperToWorld, sameView, visibleOps } from '../core/fit.js';
import { gridLines, labelFor } from '../core/grid.js';
import { turtleSvg } from './artwork.js';

/** Canvas pixels per paper unit. */
export const PIXEL_RATIO = 2;

// How big the turtle is on the PDF's drawing, in paper units. A little bigger than the sprite on
// the screen (about 52 on an ordinary window), because the drawing is printed small and the
// reader needs to see at a glance which way the nose points.
export const PDF_TURTLE_SIZE = 70;

/** How tall the grid's numbers are on the PDF's picture, in the paper canvas's own pixels (about 10 points on the page). */
const PDF_GRID_TEXT = 30;

// ---- Painting ops onto a canvas ----------------------------------------

/**
 * Switch the canvas to the turtle's coordinates: x to the right, y UP. (A canvas normally
 * has y pointing down, so we flip it.) In the default view (0, 0) is the middle of the paper
 * and a unit is two canvas pixels; a zoomed view slides and scales that.
 */
function usePaperCoordinates(ctx, view = DEFAULT_DRAW_VIEW) {
  const scale = PIXEL_RATIO * view.zoom;
  ctx.setTransform(
    scale, 0,
    0, -scale,
    (PAPER_W / 2 - view.cx * view.zoom) * PIXEL_RATIO,
    (PAPER_H / 2 + view.cy * view.zoom) * PIXEL_RATIO,
  );
}

/** Cover the whole canvas with one color, whatever the view is. */
function coverCanvas(ctx, color) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

/** Draw one op from the turtle onto the paper canvas, as seen through `view`. */
export function paintOp(ctx, op, view = DEFAULT_DRAW_VIEW) {
  switch (op.type) {
    case 'clear':
      coverCanvas(ctx, '#ffffff');
      return;
    case 'fillScreen':
      coverCanvas(ctx, toCss(op.color));
      return;
    default:
      break;
  }
  usePaperCoordinates(ctx, view);
  switch (op.type) {
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
    this.drawView = { ...DEFAULT_DRAW_VIEW }; // how the paper is zoomed and slid (see core/fit.js)
    this.picture = null; // an image opened from a file, lying under everything the turtle draws
    this.gridVisible = false; // the grid lives on its own canvas, so it is never in a saved picture

    this.box = document.createElement('div');
    this.box.className = 'paper-box';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'paper';
    this.canvas.width = PAPER_W * PIXEL_RATIO;
    this.canvas.height = PAPER_H * PIXEL_RATIO;
    this.ctx = this.canvas.getContext('2d');

    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.className = 'paper-grid';
    this.gridCanvas.width = PAPER_W * PIXEL_RATIO;
    this.gridCanvas.height = PAPER_H * PIXEL_RATIO;
    this.gridCanvas.hidden = true;
    this.gridCtx = this.gridCanvas.getContext('2d');

    this.sprite = document.createElement('div');
    this.sprite.className = 'turtle-sprite';
    this.sprite.innerHTML = turtleSvg();

    this.box.append(this.canvas, this.gridCanvas, this.sprite);
    stage.append(this.box);

    paintOp(this.ctx, { type: 'clear' });
    this.layout();
    new ResizeObserver(() => this.layout()).observe(stage);
    this.listenForDrags();
  }

  /**
   * Put a picture on the paper, replacing what is there, at the default view. (Used when a saved
   * picture is opened.) The turtle forgets its own drawing then, and what it draws next goes on top.
   */
  paintImage(image) {
    this.dropPicture();
    this.picture = image;
    this.drawView = { ...DEFAULT_DRAW_VIEW };
    this.repaint();
    this.viewChanged();
  }

  /** Draw an op the turtle just made. */
  applyOp(op) {
    if (op.type === 'clear') this.dropPicture();
    paintOp(this.ctx, op, this.drawView);
  }

  /** Let go of the opened picture (an ImageBitmap is memory the page has to give back). */
  dropPicture() {
    if (this.picture && typeof this.picture.close === 'function') this.picture.close();
    this.picture = null;
  }

  /**
   * Draw the whole picture again through the current view: the opened picture (if any), then
   * the turtle's ops. A clear or a fill screen covers all before it, so those are skipped.
   */
  repaint() {
    const { ops, start } = visibleOps(this.turtle.ops);
    coverCanvas(this.ctx, '#ffffff');
    if (start < 0 && this.picture) this.drawPicture();
    for (let i = Math.max(0, start); i < this.turtle.ops.length; i += 1) paintOp(this.ctx, this.turtle.ops[i], this.drawView);
    return ops.length;
  }

  /** The opened picture, in the place the paper would be if it were drawn in the turtle's world. */
  drawPicture() {
    const { zoom, cx, cy } = this.drawView;
    const left = (PAPER_W / 2 + (-PAPER_W / 2 - cx) * zoom) * PIXEL_RATIO;
    const top = (PAPER_H / 2 - (PAPER_H / 2 - cy) * zoom) * PIXEL_RATIO;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.picture, left, top, PAPER_W * zoom * PIXEL_RATIO, PAPER_H * zoom * PIXEL_RATIO);
  }

  /** Where a spot of the turtle's world is on the canvas, in canvas pixels. */
  canvasPoint(x, y) {
    const { zoom, cx, cy } = this.drawView;
    return { x: (PAPER_W / 2 + (x - cx) * zoom) * PIXEL_RATIO, y: (PAPER_H / 2 - (y - cy) * zoom) * PIXEL_RATIO };
  }

  /**
   * Zoom and slide the paper so everything drawn fits on it, including what was drawn off the
   * edge, and where the turtle is. Nothing drawn gives the default view.
   *
   * With `toggle`, a press that would change nothing (the paper is already fitted) goes back to
   * the default view instead, so the button can be pressed to zoom in and pressed again to
   * zoom back out. The PDF does not ask for that: it only ever wants the fitted picture.
   *
   * Returns { ok: true, zoom, back } or { ok: false, reason } if the picture cannot be redrawn.
   * `back` is true when it went back to the default view.
   */
  fit({ toggle = false } = {}) {
    // Only some of the lines were kept (a loop ran for ages), so drawing again would lose the rest.
    if (this.turtle.truncated) return { ok: false, reason: 'too-long' };
    const box = drawingBounds(this.turtle.ops, {
      hasPicture: this.picture !== null,
      extraPoints: [{ x: this.turtle.x, y: this.turtle.y }],
    });
    const target = fitView(box);
    if (toggle && !isDefaultView(target) && sameView(target, this.drawView)) {
      return { ...this.resetDrawView(), back: true };
    }
    return { ...this.showView(target), back: false };
  }

  /** Back to the default view: the paper as it was when you started. */
  resetDrawView({ force = false } = {}) {
    return this.showView({ ...DEFAULT_DRAW_VIEW }, { force });
  }

  /**
   * Show the paper through a view, painting it again if the view changed. If only some of the
   * lines were kept, painting again would lose the rest, so that is refused unless `force` says
   * the old picture is about to be thrown away anyway (a new run).
   */
  showView(next, { force = false } = {}) {
    const same = next.zoom === this.drawView.zoom && next.cx === this.drawView.cx && next.cy === this.drawView.cy;
    if (!same) {
      if (this.turtle.truncated && !force) return { ok: false, reason: 'too-long' };
      this.drawView = { zoom: next.zoom, cx: next.cx, cy: next.cy };
      this.repaint();
      this.viewChanged();
    }
    return { ok: true, zoom: this.drawView.zoom };
  }

  viewChanged() {
    this.sync();
    this.drawGrid();
  }

  // ---- The grid ------------------------------------------------------------

  /** Show or hide the grid of x and y numbers. It is drawn on its own canvas, above the paper. */
  setGridVisible(visible) {
    this.gridVisible = visible;
    this.gridCanvas.hidden = !visible;
    this.drawGrid();
  }

  /** Draw the grid for the current view on its own canvas, above the paper (see paintGrid). */
  drawGrid() {
    if (!this.gridVisible) return;
    const ctx = this.gridCtx;
    const { width, height } = this.gridCanvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Numbers about 12 screen pixels tall whatever the window size.
    this.paintGrid(ctx, width, height, { size: clamp(24 / this.scale, 18, 34) });
  }

  /**
   * Paint the grid for the current view onto a canvas of the paper's size: light lines, darker axes, and
   * numbers along the axes. The numbers sit just beside the axes, or against the edge of the paper when an
   * axis is off the paper. `size` is how tall the numbers are, in the canvas's own pixels. `strong` makes the
   * lines darker and thicker, for a picture that will be shrunk onto a page (the PDF), where the thin faint
   * lines of the screen would nearly vanish.
   */
  paintGrid(ctx, width, height, { size, strong = false }) {
    const { xs, ys } = gridLines(this.drawView);
    const origin = this.canvasPoint(0, 0);
    const line = strong ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.16)';
    const axis = strong ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.5)';

    ctx.lineCap = 'butt';
    for (const x of xs) {
      const at = this.canvasPoint(x, 0).x;
      ctx.lineWidth = x === 0 ? (strong ? 5 : 3) : strong ? 2.5 : 1.5;
      ctx.strokeStyle = x === 0 ? axis : line;
      ctx.beginPath();
      ctx.moveTo(at, 0);
      ctx.lineTo(at, height);
      ctx.stroke();
    }
    for (const y of ys) {
      const at = this.canvasPoint(0, y).y;
      ctx.lineWidth = y === 0 ? (strong ? 5 : 3) : strong ? 2.5 : 1.5;
      ctx.strokeStyle = y === 0 ? axis : line;
      ctx.beginPath();
      ctx.moveTo(0, at);
      ctx.lineTo(width, at);
      ctx.stroke();
    }

    ctx.font = `${size}px Roboto, Arial, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    const write = (text, x, y, align) => {
      ctx.textAlign = align;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = '#333';
      ctx.fillText(text, x, y);
    };
    const rowY = clamp(origin.y + size + 6, size + 6, height - 8);
    for (const x of xs) {
      const at = this.canvasPoint(x, 0).x;
      const half = ctx.measureText(labelFor(x)).width / 2;
      if (at - half < 4 || at + half > width - 4) continue;
      write(labelFor(x), at, rowY, 'center');
    }
    for (const y of ys) {
      if (y === 0) continue; // the 0 is already written along the x axis
      const text = labelFor(y);
      const left = clamp(origin.x + 8, 8, width - 8 - ctx.measureText(text).width);
      write(text, left, this.canvasPoint(0, y).y - 6, 'left');
    }
    ctx.font = `bold ${size + 4}px Roboto, Arial, sans-serif`;
    if (origin.y >= 0 && origin.y <= height) write('x', width - 22, origin.y - 8, 'center');
    if (origin.x >= 0 && origin.x <= width) write('y', origin.x + 16, size + 12, 'center');
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
    // The grid goes on this copy always, whether or not it is showing on the screen, so whoever reads the PDF
    // can read off x and y. (The numbers are a bit bigger than on the screen: the picture is shrunk onto a page.)
    this.paintGrid(context, copy.width, copy.height, { size: PDF_GRID_TEXT, strong: true });

    const url = URL.createObjectURL(new Blob([turtleSvg()], { type: 'image/svg+xml' }));
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      const { x, y, heading } = this.turtle;
      const pixels = size * PIXEL_RATIO;
      // The same spot the sprite sits on the screen, in the paper's own pixels; the picture
      // faces up, so turning it clockwise by the heading points it the right way.
      const at = this.canvasPoint(x, y);
      context.translate(at.x, at.y);
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
    this.drawGrid();
  }

  /** Put the turtle picture where the turtle is. */
  sync() {
    // While a write block is tracing letters, the turtle is shown at the tip of its pen, facing the way it is drawing.
    const shown = this.turtle.writing ?? this.turtle;
    const { heading } = shown;
    const at = this.canvasPoint(shown.x, shown.y);
    const px = (at.x / PIXEL_RATIO) * this.scale;
    const py = (at.y / PIXEL_RATIO) * this.scale;
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
        // The paper is what you see: dragging stays on it, whatever the zoom is.
        const world = paperToWorld(this.drawView, clamp(px / this.scale, 0, PAPER_W), clamp(py / this.scale, 0, PAPER_H));
        this.turtle.place(Math.round(world.x), Math.round(world.y));
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
    const at = this.canvasPoint(this.turtle.x, this.turtle.y);
    return {
      x: rect.left + (at.x / PIXEL_RATIO) * this.scale,
      y: rect.top + (at.y / PIXEL_RATIO) * this.scale,
    };
  }
}

function clamp(n, low, high) {
  return Math.min(high, Math.max(low, n));
}
