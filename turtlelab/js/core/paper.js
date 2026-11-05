// TurtleLab: the kinds of paper, and the lines printed on them.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The paper is only how the page LOOKS on the screen: white, a whiteboard, graph paper, a chalkboard or a blueprint. It is never in a
// saved picture, a PDF or any other file (they keep the white paper the turtle really draws on), and it is not kept
// from one visit to the next. A dark paper shows what is drawn on it the way chalk or a blueprint would: the picture is
// turned light-on-dark by the stylesheet (see .paper-chalkboard in app.css), so a black line is white and a red one is
// still red. The whiteboard and the chalkboard are also HAND DRAWN: every line wobbles a little (core/hand.js), the chalk is grainy, and the board
// has smudges where it was wiped (`wipes` and `specks` below say where). This file knows the kinds, works out which lines are printed on graph and
// blueprint paper for a view, and where the smudges go (js/ui/canvas-view.js draws them). It knows nothing about the screen.

import { PAPER_W, PAPER_H } from './turtle.js';
import { niceStep, multiples } from './grid.js';

/**
 * The kinds of paper, in the order the menu lists them. `dark` papers are light-on-dark, and make the grid draw in light colors.
 * `board` is the color the paper is, for the ones that are not white; `lines` says what is printed on it. `hand` is for the hand drawn ones, and says
 * what with: `'marker'` (smooth wobbly lines) or `'chalk'` (wobbly, grainy, with a little dust round each line). `wipes` is how the board looks wiped:
 * the color of the smudges (red, green, blue), how many swipes of the cloth there are, how strong, and how many specks of dust.
 */
export const PAPERS = [
  { id: 'white', label: 'White', hint: 'Plain white paper', dark: false, board: null, lines: null, hand: null, wipes: null },
  { id: 'whiteboard', label: 'Whiteboard', hint: 'Marker lines that wobble a little, on a board that was not wiped quite clean', dark: false, board: null, lines: null, hand: 'marker',
    wipes: { color: '110, 125, 140', count: 6, strength: 1.6, dust: 0 } },
  { id: 'graph', label: 'Graph paper', hint: 'Faint blue squares, like paper from a pad', dark: false, board: null, hand: null, wipes: null,
    lines: { minor: 'rgba(60, 140, 210, 0.30)', major: 'rgba(40, 120, 200, 0.50)' } },
  { id: 'chalkboard', label: 'Chalkboard', hint: 'Dark green, and what you draw is wobbly, grainy chalk, over the dust of an eraser', dark: true, board: '#2f4a3b', lines: null, hand: 'chalk',
    wipes: { color: '225, 238, 228', count: 7, strength: 1.4, dust: 380 } },
  { id: 'blueprint', label: 'Blueprint', hint: 'Pale lines on blue paper', dark: true, board: '#1c4f9c', hand: null, wipes: null,
    lines: { minor: 'rgba(255, 255, 255, 0.11)', major: 'rgba(255, 255, 255, 0.22)' } },
];

/** The paper a page starts with. */
export const DEFAULT_PAPER = 'white';

/** The kind of paper with this id, or null if there is none. */
export function paperById(id) {
  return PAPERS.find((paper) => paper.id === id) ?? null;
}

/**
 * What a plain press of the grid button does (a right-click, or press and hold, opens the menu instead). Always the squares with x and y numbers:
 * with the grid off it turns on, on whatever paper there is; with it on, each press goes on to the next paper in PAPERS; after the last paper the
 * blank screen comes back (no grid, white paper).
 * Returns what to show next: { gridVisible, gridType, paperId }.
 */
export function afterGridPress({ gridVisible, paperId }) {
  const at = PAPERS.findIndex((paper) => paper.id === paperId);
  if (!gridVisible) return { gridVisible: true, gridType: 'numbers', paperId: at < 0 ? DEFAULT_PAPER : paperId };
  if (at < 0 || at === PAPERS.length - 1) return { gridVisible: false, gridType: 'numbers', paperId: DEFAULT_PAPER };
  return { gridVisible: true, gridType: 'numbers', paperId: PAPERS[at + 1].id };
}

/** The finest the printed squares get, in the turtle's units, however far in you zoom. */
export const FINEST_SQUARE = 10;
/** The closest two printed lines may be on the screen (in paper units on the screen). */
export const PRINTED_MIN_GAP = 8;

/**
 * The gap between the bold lines for a gap between the faint ones: every 5th for 1 and 2 (10 gives 50, 20 gives 100), every 2nd for 5 (50 gives
 * 100), so the bold lines are always at nice numbers.
 */
export function majorGap(minor) {
  const power = 10 ** Math.floor(Math.log10(minor));
  return minor * (Math.round(minor / power) === 5 ? 2 : 5);
}

/**
 * The lines printed on graph or blueprint paper for a view: faint squares, and a bolder line every 5th one. They are fixed to the paper, like real
 * graph paper, so they zoom and slide with the drawing. Zoomed far out they would be a gray smear, so then the squares get bigger, in nice steps.
 * Returns the gap between faint lines (`minor`), and for each of `xs` and `ys` a list of { at, bold }.
 */
export function printedLines(view, { width = PAPER_W, height = PAPER_H } = {}) {
  const minor = Math.max(FINEST_SQUARE, niceStep(PRINTED_MIN_GAP / view.zoom));
  const major = majorGap(minor);
  const halfWidth = width / 2 / view.zoom;
  const halfHeight = height / 2 / view.zoom;
  const list = (low, high) => multiples(low, high, minor).map((at) => ({ at, bold: Math.abs(at / major - Math.round(at / major)) < 1e-9 }));
  return { minor, major, xs: list(view.cx - halfWidth, view.cx + halfWidth), ys: list(view.cy - halfHeight, view.cy + halfHeight) };
}

// ---- The smudges on a board ---------------------------------------------------------------------------------

/**
 * A repeatable stream of numbers from 0 up to (not including) 1 for a seed (the mulberry32 recipe). The smudges on a board come from it, so a board
 * always has the same ones: they are part of how the board looks, not something that changes every time it is drawn.
 */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which smudges a board has (change it and every board has different ones). */
export const WIPE_SEED = 20261105;

/**
 * Where a cloth or an eraser went over the board: `count` broad, gently curved swipes, mostly sideways, each made of `streaks` thin lines side by side,
 * which is how a wiped board looks. Every number is a fraction of the paper's width (x) or height (everything else), 0 to 1, so it fits any size. A
 * swipe runs `from` to `to` and bows out sideways by `bend`; each streak is shifted across it by `offset`, drawn `width` thick with `alpha` for how
 * strong (before the paper's own `strength`), and runs only from `start` to `end` of the way along it (0 to 1), so the ends of a swipe are ragged, not square.
 */
export function wipes(count, seed = WIPE_SEED) {
  const random = seeded(seed);
  const between = (low, high) => low + (high - low) * random();
  const swipes = [];
  for (let i = 0; i < count; i += 1) {
    const length = between(0.28, 0.62);
    const turn = between(-0.4, 0.4); // radians off sideways
    const from = { x: between(0.02, 0.98 - length * Math.cos(turn)), y: between(0.12, 0.88) };
    const to = { x: from.x + length * Math.cos(turn), y: Math.min(0.97, Math.max(0.03, from.y + length * Math.sin(turn) * 0.8)) };
    const thickness = between(0.07, 0.15);
    const streakCount = 22 + Math.floor(random() * 13);
    const streaks = [];
    for (let k = 0; k < streakCount; k += 1) {
      streaks.push({
        offset: ((k + random()) / streakCount - 0.5) * thickness,
        width: (thickness / streakCount) * between(0.5, 1.7),
        alpha: between(0.02, 0.055),
        start: between(0, 0.16),
        end: between(0.84, 1),
      });
    }
    swipes.push({ from, to, bend: between(-0.07, 0.07), thickness, streaks });
  }
  return swipes;
}

/** `count` specks of dust, each `{ x, y, size, alpha }`: where as fractions of the width and height, how big as a fraction of the width, how strong. */
export function specks(count, seed = WIPE_SEED + 1) {
  const random = seeded(seed);
  const dust = [];
  for (let i = 0; i < count; i += 1) {
    dust.push({ x: random(), y: random(), size: 0.0006 + random() * random() * 0.0024, alpha: 0.05 + random() * 0.13 });
  }
  return dust;
}
