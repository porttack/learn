// TurtleLab: the score as plain words and numbers, for the PDF.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The badge in the corner shows the number of blocks and the program's complexity, elegance and efficiency, and its panel gives the reasons
// (core/quality.js works all of it out). A PDF is what gets handed in, so it carries the same thing: the four numbers in a strip at the top of
// page 1, and the reasons on a page after the drawing, which makes the work easier to mark. This file only turns what `assess` gave into the
// shape the PDF writer prints (core/pdf.js), so that file knows nothing about scores. Nothing here stores or sends anything.
//
//   scores    the strip: { label, text, fraction } for Blocks, Complexity, Elegance, Efficiency (`fraction` 0 to 1 is how far a bar fills, or null for none)
//   sections  the reasons page: { heading, lines } where each line is { kind, text } and `kind` is
//               'what'   the metric in a few words
//               'note'   a plain line
//               'part'   a row of the complexity table: `text` (the block names it counts), `count` (how many) and `points` (what it earned);
//                        the last row is `total: true`. Nothing in brackets, and no hints: a label names the blocks it counts
//               'good'   something the program does well
//               'tip'    something to try

import { METRICS, levelLine, scaleLine, tenths } from './quality.js';

/** What each row of the complexity table is called on paper: the blocks it counts, in plain words. (The badge's panel says Loops, Conditionals ...) */
export const TABLE_LABELS = Object.freeze({
  variables: 'Variables',
  loops: 'repeat / forever',
  conditionals: 'if / if else',
  ownBlocks: 'Blocks you made',
  math: 'Math and random',
  blocks: 'Blocks',
  bonus: 'Big ideas used',
});

/**
 * @param {ReturnType<import('./quality.js').assess>} result what the badge shows
 * @returns {{ scores: { label: string, text: string, fraction: number | null }[],
 *   sections: { heading: string, lines: { kind: string, text: string, count?: string, points?: string, total?: boolean }[] }[] }}
 */
export function scoreReport(result) {
  const { blocks, complexity, elegance, efficiency } = result;
  // What a number says when there is none yet: elegance needs a few blocks, efficiency needs a run.
  const said = { complexity: tenths(complexity.value), elegance: elegance.value === null ? 'not yet' : tenths(elegance.value), efficiency: efficiency.value === null ? 'not run' : tenths(efficiency.value) };
  const values = { complexity: complexity.value, elegance: elegance.value, efficiency: efficiency.value };
  const scores = [
    { label: 'Blocks', text: String(blocks), fraction: null },
    ...METRICS.map(({ id, label }) => ({ label, text: said[id], fraction: values[id] })),
  ];

  const parts = [
    ...complexity.parts.map((part) => ({ kind: 'part', text: TABLE_LABELS[part.id] ?? part.label, count: String(part.count), points: String(part.points) })),
    { kind: 'part', text: 'Total', count: '', points: String(complexity.points), total: true },
  ];
  const body = {
    complexity: [{ kind: 'note', text: levelLine(complexity) }, { kind: 'note', text: scaleLine(complexity) }, ...parts, { kind: 'tip', text: complexity.tip }],
    elegance: elegance.reasons.map(({ kind, text }) => ({ kind, text })),
    efficiency: efficiency.reasons.map(({ kind, text }) => ({ kind, text })),
  };
  const sections = METRICS.map(({ id, label, what }) => ({
    heading: `${label}: ${said[id]}`,
    lines: [{ kind: 'what', text: what }, ...body[id]],
  }));
  return { scores, sections };
}
