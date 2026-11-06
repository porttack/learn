// TurtleLab: complexity, elegance and efficiency of a program, and how many blocks it has.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Three numbers from 0.0 to 1.0, each with its reasons, shown in the badge in the corner of the window:
//
//   complexity   how many of the big ideas the program uses, variables most of all (core/complexity.js works out points, which are put on a
//                curve here so that 1.0 is hard to reach: it measures how ambitious the program is, not how good it is)
//   elegance     said with as little as it needs: no copy and paste, no number typed over and over, nothing left over (core/elegance.js)
//   efficiency   how little work a run took for the picture it made, so it needs a run (core/efficiency.js)
//
// Complexity and elegance come from the blocks and change as the blocks do. Efficiency is about the last run, so it is shown as not there
// until a program has run, and goes away again when the blocks change. The blocks are counted too (every block, not the start or to hats
// and not notes). Nothing here stores or sends anything.

import { inspect, scoreProject } from './complexity.js';
import { eleganceOf } from './elegance.js';
import { efficiencyOf } from './efficiency.js';

/** How many points of complexity make about 0.63 (1 less 1/e): 80 points is a program that uses most of the big ideas. */
export const COMPLEXITY_SCALE = 80;

/** Complexity points as a number from 0.0 up towards 1.0 (never quite 1.0): the more points, the more slowly it grows. */
export function complexity01(points) {
  return 1 - Math.exp(-Math.max(0, points) / COMPLEXITY_SCALE);
}

/** The three numbers, in the order they are shown, with what each is in a few words (the badge's panel and the PDF both say it). */
export const METRICS = [
  { id: 'complexity', label: 'Complexity', what: 'How many of the big ideas the program uses. Variables count the most, then loops, ifs and blocks you made.' },
  { id: 'elegance', label: 'Elegance', what: 'Said with as little as it needs: nothing copied and pasted, no number typed over and over, nothing left over.' },
  { id: 'efficiency', label: 'Efficiency', what: 'How little work the last run took to make its picture: no lines drawn twice, little walking with the pen up, few steps.' },
];

/** What the complexity points come to, in words: "82 points, level Building. 18 more points to reach Clever". */
export function levelLine(complexity) {
  const next = complexity.level.next ? `${complexity.level.next.min - complexity.points} more points to reach ${complexity.level.next.label}` : 'The top level';
  return `${complexity.points} points, level ${complexity.level.label}. ${next}`;
}

/** A value from 0.0 to 1.0 as it is shown, to one decimal place: "0.7". (Nothing, null, is "?".) */
export function tenths(value) {
  return value === null || value === undefined ? '?' : (Math.round(value * 10) / 10).toFixed(1);
}

/**
 * Everything the badge shows, for a program and (if it has run) what the last run did.
 * @param {{ project: object, run?: object | null }} input `run` is what `drawingStats` (core/efficiency.js) gave for the last run
 * @returns {{ blocks: number,
 *   complexity: { value: number, points: number, level: object, parts: object[], tip: string, ideas: object },
 *   elegance: { value: number | null, reasons: object[] },
 *   efficiency: { value: number | null, reasons: object[] } }}
 */
export function assess({ project, run = null }) {
  const points = scoreProject(project);
  const elegance = eleganceOf(project);
  const efficiency = efficiencyOf(run);
  return {
    blocks: inspect(project).blocks,
    complexity: { value: complexity01(points.score), points: points.score, level: points.level, parts: points.parts, tip: points.tip, ideas: points.ideas },
    elegance: { value: elegance.value, reasons: elegance.reasons },
    efficiency: { value: efficiency.value, reasons: efficiency.reasons },
  };
}
