// TurtleLab: drawing the grid, whichever kind it is.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// js/core/grid.js says what lines a kind of grid has, in the turtle's own units; this draws them onto a canvas the size of the paper:
// light lines, darker axes, and numbers where the kind has them. `point(x, y)` says where a spot of the turtle's world is on the canvas
// (CanvasView.canvasPoint), so the grid always lines up with what is drawn. The colors are for dark ink on white paper, or (`dark`) light ink on
// a dark paper, or (`strong`) heavier for a picture that will be shrunk onto a page (the PDF), where the faint lines of the screen would nearly vanish.
// On a hand drawn paper (the whiteboard and chalkboard) `warp` bends every line and dot the way the drawing is bent (js/core/hand.js), so a grid line and a
// line drawn along it still wander together; the numbers are left straight so they can be read.

import { gridLines, labelFor, polarGrid } from '../core/grid.js';

const clamp = (n, low, high) => Math.min(Math.max(n, low), high);

const COLORS = {
  light: { line: 'rgba(0, 0, 0, 0.16)', axis: 'rgba(0, 0, 0, 0.5)', dot: 'rgba(0, 0, 0, 0.4)', text: '#333', halo: 'rgba(255, 255, 255, 0.9)' },
  strong: { line: 'rgba(0, 0, 0, 0.3)', axis: 'rgba(0, 0, 0, 0.65)', dot: 'rgba(0, 0, 0, 0.6)', text: '#333', halo: 'rgba(255, 255, 255, 0.9)' },
  dark: { line: 'rgba(255, 255, 255, 0.22)', axis: 'rgba(255, 255, 255, 0.62)', dot: 'rgba(255, 255, 255, 0.55)', text: '#f4f4f4', halo: 'rgba(0, 0, 0, 0.6)' },
};

/** The colors for a grid on this kind of paper (and for the PDF, which is always `strong`, on white). */
export function gridColors({ strong = false, dark = false } = {}) {
  return strong ? COLORS.strong : dark ? COLORS.dark : COLORS.light;
}

/** How thick a line is: the axes are bolder, and everything is heavier for the PDF. */
const thickness = (axis, strong) => (axis ? (strong ? 5 : 3) : strong ? 2.5 : 1.5);

/**
 * Paint a grid onto a canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width the canvas's width in its own pixels
 * @param {number} height
 * @param {object} options
 * @param {string} [options.type] one of the ids in GRID_TYPES (numbers, squares, dots, polar)
 * @param {{ zoom: number, cx: number, cy: number }} options.view how the paper is zoomed and slid
 * @param {(x: number, y: number) => { x: number, y: number }} options.point the turtle's world to canvas pixels
 * @param {number} options.size how tall the numbers are, in the canvas's own pixels
 * @param {boolean} [options.strong] heavier lines (the PDF)
 * @param {boolean} [options.dark] a dark paper, so light lines
 * @param {((x: number, y: number) => { x: number, y: number }) | null} [options.warp] a canvas spot to where a hand would draw it (hand drawn papers); none draws straight
 */
export function paintGrid(ctx, width, height, { type = 'numbers', view, point, size, strong = false, dark = false, warp = null }) {
  const tools = { ctx, width, height, view, point, size, strong, warp, colors: gridColors({ strong, dark }) };
  if (type === 'polar') paintPolar(tools);
  else if (type === 'dots') paintDots(tools);
  else paintSquares(tools, { numbers: type !== 'squares' });
}

/** How far apart the points of a bent line are, in the canvas's pixels. */
const WARP_STEP = 16;

/** Add a straight line from (ax, ay) to (bx, by) to the path, or (with a `warp`) a line of short pieces bent by it. */
function addLine(ctx, ax, ay, bx, by, warp) {
  if (!warp) {
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    return;
  }
  const count = clamp(Math.ceil(Math.hypot(bx - ax, by - ay) / WARP_STEP), 1, 300);
  for (let i = 0; i <= count; i += 1) {
    const at = warp(ax + ((bx - ax) * i) / count, ay + ((by - ay) * i) / count);
    if (i === 0) ctx.moveTo(at.x, at.y);
    else ctx.lineTo(at.x, at.y);
  }
}

/** Add a full circle to the path, or (with a `warp`) a ring of short pieces bent by it. */
function addRing(ctx, cx, cy, radius, warp) {
  if (!warp) {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    return;
  }
  const count = clamp(Math.ceil((Math.PI * 2 * radius) / WARP_STEP), 12, 400);
  for (let i = 0; i <= count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const at = warp(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    if (i === 0) ctx.moveTo(at.x, at.y);
    else ctx.lineTo(at.x, at.y);
  }
  ctx.closePath();
}

/** Write a number or word with a halo, so it can be read over lines and drawing alike. */
function writer(ctx, colors) {
  ctx.lineJoin = 'round';
  return (text, x, y, align) => {
    ctx.lineWidth = 5;
    ctx.textAlign = align;
    ctx.strokeStyle = colors.halo;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colors.text;
    ctx.fillText(text, x, y);
  };
}

/**
 * Squares: light lines and darker axes, and (with `numbers`) the numbers beside the axes. The numbers sit just beside the axes, or against the edge of
 * the paper when an axis is off the paper.
 */
function paintSquares({ ctx, width, height, view, point, size, strong, warp, colors }, { numbers }) {
  const { xs, ys } = gridLines(view);
  const origin = point(0, 0);

  ctx.lineCap = 'butt';
  for (const x of xs) {
    const at = point(x, 0).x;
    ctx.lineWidth = thickness(x === 0, strong);
    ctx.strokeStyle = x === 0 ? colors.axis : colors.line;
    ctx.beginPath();
    addLine(ctx, at, 0, at, height, warp);
    ctx.stroke();
  }
  for (const y of ys) {
    const at = point(0, y).y;
    ctx.lineWidth = thickness(y === 0, strong);
    ctx.strokeStyle = y === 0 ? colors.axis : colors.line;
    ctx.beginPath();
    addLine(ctx, 0, at, width, at, warp);
    ctx.stroke();
  }
  if (!numbers) return;

  ctx.font = `${size}px Roboto, Arial, sans-serif`;
  const write = writer(ctx, colors);
  const rowY = clamp(origin.y + size + 6, size + 6, height - 8);
  for (const x of xs) {
    const at = point(x, 0).x;
    const half = ctx.measureText(labelFor(x)).width / 2;
    if (at - half < 4 || at + half > width - 4) continue;
    write(labelFor(x), at, rowY, 'center');
  }
  for (const y of ys) {
    if (y === 0) continue; // the 0 is already written along the x axis
    const text = labelFor(y);
    const left = clamp(origin.x + 8, 8, width - 8 - ctx.measureText(text).width);
    write(text, left, point(0, y).y - 6, 'left');
  }
  ctx.font = `bold ${size + 4}px Roboto, Arial, sans-serif`;
  if (origin.y >= 0 && origin.y <= height) write('x', width - 22, origin.y - 8, 'center');
  if (origin.x >= 0 && origin.x <= width) write('y', origin.x + 16, size + 12, 'center');
}

/** Dots: a dot wherever the lines of the squares would cross, bigger on the axes. */
function paintDots({ ctx, view, point, strong, warp, colors }) {
  const { xs, ys } = gridLines(view);
  const radius = strong ? 3.6 : 2.6;
  ctx.fillStyle = colors.dot;
  for (const x of xs) {
    for (const y of ys) {
      const here = point(x, y);
      const at = warp ? warp(here.x, here.y) : here;
      ctx.beginPath();
      ctx.arc(at.x, at.y, x === 0 || y === 0 ? radius * 1.7 : radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Where a ray from `origin` in direction `d` (a unit vector, y down) is inside a canvas of this size: the two distances along it, or null if it never
 * is. (Where the heading numbers go: just inside the edge, wherever the middle is, even off the paper.)
 */
export function rayInside(origin, d, width, height) {
  let from = 0;
  let to = Infinity;
  for (const [position, direction, limit] of [[origin.x, d.x, width], [origin.y, d.y, height]]) {
    if (Math.abs(direction) < 1e-12) {
      if (position < 0 || position > limit) return null;
      continue;
    }
    let a = (0 - position) / direction;
    let b = (limit - position) / direction;
    if (a > b) [a, b] = [b, a];
    from = Math.max(from, a);
    to = Math.min(to, b);
  }
  return from <= to ? [from, to] : null;
}

/**
 * Circles and angles: rings around the middle (how far, the numbers for forward) and a spoke every 30 degrees (which way, the numbers for set
 * heading: 0 is up and they grow clockwise). The headings are written just inside the edge of the paper, the distances up along the 0 spoke.
 */
function paintPolar({ ctx, width, height, view, point, size, strong, warp, colors }) {
  const { rings, spokes, reach } = polarGrid(view);
  const origin = point(0, 0);
  const perUnit = point(1, 0).x - origin.x;

  ctx.lineCap = 'butt';
  ctx.lineWidth = thickness(false, strong);
  ctx.strokeStyle = colors.line;
  for (const radius of rings) {
    ctx.beginPath();
    addRing(ctx, origin.x, origin.y, radius * perUnit, warp);
    ctx.stroke();
  }
  const rays = spokes.map((heading) => ({ heading, dx: Math.sin((heading * Math.PI) / 180), dy: -Math.cos((heading * Math.PI) / 180) }));
  for (const ray of rays) {
    const axis = ray.heading % 90 === 0;
    ctx.lineWidth = thickness(axis, strong);
    ctx.strokeStyle = axis ? colors.axis : colors.line;
    ctx.beginPath();
    addLine(ctx, origin.x, origin.y, origin.x + ray.dx * reach * perUnit, origin.y + ray.dy * reach * perUnit, warp);
    ctx.stroke();
  }

  ctx.font = `${size}px Roboto, Arial, sans-serif`;
  const write = writer(ctx, colors);
  let topLabelY = null;
  for (const ray of rays) {
    const span = rayInside(origin, { x: ray.dx, y: ray.dy }, width, height);
    if (!span || span[1] - span[0] < size * 2.5) continue;
    const along = span[1] - size * 1.6;
    const x = origin.x + ray.dx * along;
    const y = origin.y + ray.dy * along;
    write(`${ray.heading}°`, x, y + size * 0.35, 'center');
    if (ray.heading === 0) topLabelY = y;
  }
  if (origin.x < 0 || origin.x > width) return;
  for (const radius of rings) {
    const y = origin.y - radius * perUnit - 6;
    if (y < size || y > height - 4) continue;
    if (topLabelY !== null && Math.abs(y - topLabelY) < size * 1.5) continue; // not on top of the 0 at the edge
    write(labelFor(radius), origin.x + 8, y, 'left');
  }
}
