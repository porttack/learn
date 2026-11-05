// TurtleLab: how efficient a run was: how much work for the picture it made.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Efficiency is a number from 0.0 to 1.0 worked out from what a program did when it ran (so there is none until it has run). It starts at 1.0 and
// goes down for work that did not need doing:
//
//   drawn over again   lines drawn on top of lines that were already there (going back along a line, a line drawn twice). Lines that only cross
//                      do not count, and neither do the corners where one line meets the next.
//   walking, pen up    the share of the turtle's walking that drew nothing. (A little is normal: a picture of several parts has to get to each.)
//   tiny lines         hundreds of lines a few steps long, where an arc block draws a curve in one block.
//   steps run          how many blocks ran. A program that runs tens of thousands of steps to draw something small is slow.
//
// It counts steps and distances, not time, so a wait block does not hurt. Words (the write block) are drawn as many short lines, some of them
// doubled on purpose, so with a write block in the program the lines are not looked at, only the walking and the steps.
// `drawingStats` reads what the turtle did (the ops of core/turtle.js), `efficiencyOf` turns that into the number and the reasons.
// Nothing here stores or sends anything.

/** The limits and costs. (A test pins the proportions that matter.) */
export const LIMITS = Object.freeze({
  minDrawn: 20, // less than this much drawn and there is nothing to judge
  overdrawFree: 0.05, overdrawTimes: 0.8, overdrawMost: 0.4, // the share drawn over again that is let off, then times this
  travelFree: 0.1, travelTimes: 0.5, travelMost: 0.25, // the pen-up share of walking that is let off, then times this
  tinyLength: 4, tinyShare: 0.6, tinyFrom: 80, tinyBase: 0.1, tinyPer: 1 / 4000, tinyMost: 0.25, // lines shorter than this, enough of them, and how much that costs
  stepsFree: 3000, stepsTimes: 0.25, stepsMost: 0.3, // steps run that are let off, then the cost for each ten times more
  samples: 120000, // the most points looked at when checking for lines drawn over again (longer pictures are looked at less finely)
  cell: 2, // how close two lines must be (in steps) to count as one drawn over the other
  endTrim: 3, // the steps at each end of a line that are not looked at (where it meets the line before and after)
});

/** How long a line or an arc op is, in steps. */
function lengthOf(op) {
  if (op.type === 'line') return Math.hypot(op.x2 - op.x1, op.y2 - op.y1);
  return (op.r * Math.abs(op.sweep) * Math.PI) / 180;
}

/** The point `t` (0 to 1) of the way along a line or an arc op. */
function pointAt(op, t) {
  if (op.type === 'line') return { x: op.x1 + (op.x2 - op.x1) * t, y: op.y1 + (op.y2 - op.y1) * t };
  const start = Math.atan2(op.y1 - op.cy, op.x1 - op.cx);
  const angle = start - (op.sweep * Math.PI * t) / 180;
  return { x: op.cx + op.r * Math.cos(angle), y: op.cy + op.r * Math.sin(angle) };
}

/**
 * What a run did, as numbers.
 * @param {object} run
 * @param {object[]} run.ops the turtle's ops (core/turtle.js) since the picture was last cleared
 * @param {{ up: number, down: number }} run.walked how far the turtle walked with the pen up and down (Turtle.walked)
 * @param {number} run.steps how many blocks ran
 * @param {boolean} [run.hasWrite] the program writes words
 * @param {boolean} [run.truncated] the turtle forgot the oldest lines to save memory, so the lines are not all there
 */
export function drawingStats({ ops, walked, steps, hasWrite = false, truncated = false }) {
  const segments = ops.filter((op) => (op.type === 'line' || op.type === 'arc') && op.size > 0);
  const lengths = segments.map(lengthOf);
  const drawn = lengths.reduce((a, b) => a + b, 0);
  const filled = ops.some((op) => op.type === 'fill');
  const stats = {
    segments: segments.length,
    drawn,
    filled,
    tiny: lengths.filter((n) => n < LIMITS.tinyLength).length,
    walkedUp: walked?.up ?? 0,
    walkedDown: walked?.down ?? 0,
    steps,
    hasWrite,
    truncated,
    overdrawn: 0,
    looked: 0,
  };
  if (hasWrite || truncated || drawn < LIMITS.minDrawn) return stats;

  // Lines drawn over again: walk along each line, and see how much of it is in squares (2 steps wide) that earlier lines already went through.
  const spacing = Math.max(1, drawn / LIMITS.samples);
  const seen = new Set();
  const cellOf = (p) => `${Math.floor(p.x / LIMITS.cell)},${Math.floor(p.y / LIMITS.cell)}`;
  segments.forEach((op, index) => {
    const length = lengths[index];
    const count = Math.max(1, Math.ceil(length / spacing));
    const mine = [];
    for (let i = 0; i <= count; i += 1) {
      const at = (i / count) * length;
      const key = cellOf(pointAt(op, i / count));
      mine.push(key);
      if (at < LIMITS.endTrim || at > length - LIMITS.endTrim) continue; // the corners are shared with the lines either side
      stats.looked += 1;
      if (seen.has(key)) stats.overdrawn += 1;
    }
    for (const key of mine) seen.add(key);
  });
  return stats;
}

/**
 * How efficient a run was.
 * @param {ReturnType<typeof drawingStats> | null} stats what the last run did, or null if it has not run
 * @returns {{ value: number | null, reasons: { kind: 'good' | 'tip', text: string }[] }}
 *   `value` is 0.0 to 1.0, or null if there is nothing to say yet.
 */
export function efficiencyOf(stats) {
  if (!stats) return { value: null, reasons: [{ kind: 'tip', text: 'Run your program and this says how little work it took to make the picture.' }] };
  if (stats.drawn < LIMITS.minDrawn && !stats.filled) {
    return { value: null, reasons: [{ kind: 'tip', text: stats.segments === 0 ? 'The program did not draw anything, so there is nothing to measure.' : 'There is hardly anything drawn yet to measure.' }] };
  }
  const tips = [];
  const goods = [];
  let cost = 0;
  const pct = (share) => `${Math.round(share * 100)}%`;

  // Drawn over again.
  if (stats.looked > 0) {
    const share = stats.overdrawn / stats.looked;
    cost += Math.min(LIMITS.overdrawMost, Math.max(0, share - LIMITS.overdrawFree) * LIMITS.overdrawTimes);
    if (share > LIMITS.overdrawFree) tips.push({ kind: 'tip', text: `${pct(share)} of the lines are drawn on top of lines that were already there. Going back over a line does the same job twice.` });
    else goods.push({ kind: 'good', text: 'No line is drawn over another one.' });
  }

  // Walking with the pen up.
  const walkedAll = stats.walkedUp + stats.walkedDown;
  if (walkedAll > 0) {
    const share = stats.walkedUp / walkedAll;
    cost += Math.min(LIMITS.travelMost, Math.max(0, share - LIMITS.travelFree) * LIMITS.travelTimes);
    if (share > LIMITS.travelFree) tips.push({ kind: 'tip', text: `The turtle walked ${Math.round(stats.walkedUp)} steps with the pen up, ${pct(share)} of all its walking, and drew nothing on the way.` });
    else goods.push({ kind: 'good', text: 'The pen is down for nearly all of the walking.' });
  }

  // Tiny lines.
  if (!stats.hasWrite && !stats.truncated && stats.segments >= LIMITS.tinyFrom && stats.tiny / stats.segments > LIMITS.tinyShare) {
    cost += Math.min(LIMITS.tinyMost, LIMITS.tinyBase + stats.segments * LIMITS.tinyPer);
    tips.push({ kind: 'tip', text: `${stats.segments} lines, most of them under ${LIMITS.tinyLength} steps long. An arc block draws a curve in one block.` });
  }

  // Steps run.
  if (stats.steps > LIMITS.stepsFree) {
    cost += Math.min(LIMITS.stepsMost, Math.log10(stats.steps / LIMITS.stepsFree) * LIMITS.stepsTimes);
    tips.push({ kind: 'tip', text: `The program ran ${stats.steps.toLocaleString('en-US')} steps. Fewer steps means a faster program.` });
  } else if (stats.steps > 0) {
    goods.push({ kind: 'good', text: `It took ${stats.steps.toLocaleString('en-US')} ${stats.steps === 1 ? 'step' : 'steps'} to make the picture.` });
  }

  if (stats.hasWrite) goods.push({ kind: 'good', text: 'Words are drawn as many short lines, so only the walking and the steps are counted.' });
  return { value: Math.max(0, Math.min(1, 1 - cost)), reasons: [...tips, ...goods] };
}
