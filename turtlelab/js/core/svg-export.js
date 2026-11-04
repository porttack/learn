// TurtleLab: a drawing as an SVG file.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// An SVG is a picture made of lines and curves instead of dots, so it stays sharp at any size
// and other programs (a drawing program, a laser cutter, a pen plotter) can use the lines
// themselves. It is made from the same list of drawing ops (see turtle.js) the screen is painted
// from, so it holds everything that was drawn, even what ran off the edge of the paper.
//
// Two kinds:
//   'picture'  what you see: colors, pen thicknesses, filled shapes and a colored paper,
//              with everything in view.
//   'cut'      only the lines the pen drew, as hairlines in one color, sized so that 100 turtle
//              steps are exactly 1 inch. That is what a laser cutter or a pen plotter wants.
//
// The turtle's y grows UP and an SVG's grows DOWN, so every y is turned over here.

import { boundsOfOps, visibleOps } from './fit.js';
import { toCss } from './color.js';

/** Numbers without long tails: three decimal places is far finer than any machine or screen. */
const n = (value) => String(Math.round(value * 1000) / 1000 || 0);
const SAME_SPOT = 1e-9;

/** The commands to draw an arc from where it is to its end, in SVG form (y turned over). */
function arcCommands(seg) {
  const flag = seg.sweep > 0 ? 1 : 0; // curving right is clockwise, which is what 1 means on a y-down page
  const r = n(seg.r);
  if (Math.abs(seg.sweep) >= 360 - 1e-9) {
    // One arc cannot go all the way round (its end is its start), so it goes round in two halves.
    const mx = 2 * seg.cx - seg.x1;
    const my = 2 * seg.cy - seg.y1;
    return [`A ${r} ${r} 0 0 ${flag} ${n(mx)} ${n(-my)}`, `A ${r} ${r} 0 0 ${flag} ${n(seg.x2)} ${n(-seg.y2)}`];
  }
  return [`A ${r} ${r} 0 ${Math.abs(seg.sweep) > 180 ? 1 : 0} ${flag} ${n(seg.x2)} ${n(-seg.y2)}`];
}

/** The path data for one line or arc, starting with its own move to its start. */
function segmentPath(seg) {
  const start = `M ${n(seg.x1)} ${n(-seg.y1)}`;
  return seg.type === 'line' ? `${start} L ${n(seg.x2)} ${n(-seg.y2)}` : `${start} ${arcCommands(seg).join(' ')}`;
}

/** Add one line or arc onto a path that is already at its start. */
function continuePath(seg) {
  return seg.type === 'line' ? `L ${n(seg.x2)} ${n(-seg.y2)}` : arcCommands(seg).join(' ');
}

const sameColor = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Lines and arcs that follow one another (each starts where the one before ended) in one style
 * become one path, so a square is one shape and not four loose lines. `sameStyle` says which
 * neighbors may join.
 */
function runsOf(segments, sameStyle) {
  const runs = [];
  for (const seg of segments) {
    const run = runs[runs.length - 1];
    const last = run?.segments[run.segments.length - 1];
    if (run && sameStyle(run.segments[0], seg) && Math.hypot(last.x2 - seg.x1, last.y2 - seg.y1) < SAME_SPOT) run.segments.push(seg);
    else runs.push({ segments: [seg] });
  }
  return runs.map((run) => ({ first: run.segments[0], d: `${segmentPath(run.segments[0])} ${run.segments.slice(1).map(continuePath).join(' ')}`.trim() }));
}

const usable = (seg) => (seg.type === 'line' || seg.type === 'arc') && seg.size > 0;

/** The outline of a filled shape as one closed path. */
function fillPath(op) {
  const parts = [`M ${n(op.segments[0].x1)} ${n(-op.segments[0].y1)}`];
  for (const seg of op.segments) parts.push(continuePath(seg));
  return `${parts.join(' ')} Z`;
}

/**
 * The drawing as SVG text, or null if the pen drew nothing.
 *
 * @param {object[]} ops the turtle's drawing ops
 * @param {object} [options]
 * @param {'picture'|'cut'} [options.mode]
 * @param {{minX: number, minY: number, maxX: number, maxY: number}} [options.box] the part of the world to
 *        show, in the turtle's own numbers. Normally it is worked out so everything is in view; the tests
 *        pass the paper so the picture can be laid over the one on the screen.
 * @returns {null | {svg: string, width: number, height: number, count: number}}
 */
export function opsToSvg(ops, { mode = 'picture', box = null } = {}) {
  if (mode === 'cut') return cutSvg(ops, box);
  return pictureSvg(ops, box);
}

function pictureSvg(ops, boxOverride) {
  const seen = visibleOps(ops);
  const cover = seen.covers ? ops[seen.start] : null;
  const drawn = seen.ops;
  let box = boxOverride ?? boundsOfOps(drawn);
  if (!box) return null;
  if (!boxOverride) {
    const margin = Math.max(5, 0.04 * Math.max(box.maxX - box.minX, box.maxY - box.minY));
    box = { minX: box.minX - margin, minY: box.minY - margin, maxX: box.maxX + margin, maxY: box.maxY + margin };
  }
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  const shown = 800 / Math.max(width, height);

  const body = [];
  let count = 0;
  const paper = cover && cover.type === 'fillScreen' ? toCss(cover.color) : '#ffffff';
  body.push(`<rect x="${n(box.minX)}" y="${n(-box.maxY)}" width="${n(width)}" height="${n(height)}" fill="${paper}"/>`);

  // Group what follows into style runs, keeping the order: a fill sits between the lines around it.
  let pending = [];
  const flush = () => {
    for (const run of runsOf(pending, (a, b) => a.size === b.size && sameColor(a.color, b.color))) {
      body.push(`<path d="${run.d}" fill="none" stroke="${toCss(run.first.color)}" stroke-width="${n(run.first.size)}" stroke-linecap="round" stroke-linejoin="round"/>`);
      count += 1;
    }
    pending = [];
  };
  for (const op of drawn) {
    if (usable(op)) {
      pending.push(op);
    } else if (op.type === 'fill' && op.segments.length > 0) {
      flush();
      body.push(`<path d="${fillPath(op)}" fill="${toCss(op.color)}" stroke="none"/>`);
      count += 1;
      // The fill covers half of the outline the turtle drew, so the outline goes on again, as on the screen.
      for (const seg of op.segments) {
        if (seg.pen && usable(seg)) {
          body.push(`<path d="${segmentPath(seg)}" fill="none" stroke="${toCss(seg.color)}" stroke-width="${n(seg.size)}" stroke-linecap="round" stroke-linejoin="round"/>`);
          count += 1;
        }
      }
    }
  }
  flush();

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width * shown)}" height="${n(height * shown)}" viewBox="${n(box.minX)} ${n(-box.maxY)} ${n(width)} ${n(height)}">`,
    ...body,
    '</svg>',
    '',
  ].join('\n');
  return { svg, width: width * shown, height: height * shown, count };
}

function cutSvg(ops, boxOverride) {
  // Everything since the last clear counts, even under a fill screen: the cutter does not see paper color.
  let start = 0;
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    if (ops[i].type === 'clear') {
      start = i + 1;
      break;
    }
  }
  const segments = ops.slice(start).filter(usable);
  if (segments.length === 0) return null;
  let box = boxOverride ?? boundsOfOps(segments.map((seg) => ({ ...seg, size: 0 })));
  if (!box) return null;
  if (!boxOverride) box = { minX: box.minX - 5, minY: box.minY - 5, maxX: box.maxX + 5, maxY: box.maxY + 5 };
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  // A hairline is one color whatever the turtle's pen was, so any lines that join make one path.
  const runs = runsOf(segments, () => true);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width * 0.01)}in" height="${n(height * 0.01)}in" viewBox="${n(box.minX)} ${n(-box.maxY)} ${n(width)} ${n(height)}">`,
    '<!-- 100 turtle steps are 1 inch. Every line is a hairline (0.001 inch) in red. -->',
    `<g fill="none" stroke="#ff0000" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round">`,
    ...runs.map((run) => `<path d="${run.d}"/>`),
    '</g>',
    '</svg>',
    '',
  ].join('\n');
  return { svg, width: width * 0.01, height: height * 0.01, count: runs.length };
}
