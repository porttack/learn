// Tests for js/core/score-report.js: the score as plain words and numbers for the PDF.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreReport } from '../js/core/score-report.js';
import { assess, tenths } from '../js/core/quality.js';
import { SAMPLES } from '../js/ui/samples.js';
import { FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';

const projectOf = (blocks) => ({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 0, y: 0, blocks }] });
const SQUARE = [{ op: 'start' }, { op: 'clean' }, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }] }];
const RUN = { segments: 4, drawn: 400, filled: false, tiny: 0, walkedUp: 0, walkedDown: 400, steps: 12, hasWrite: false, truncated: false, overdrawn: 0, looked: 100 };

test('the strip has the four things the badge shows, in the badge\'s order, with the same numbers', () => {
  const result = assess({ project: projectOf(SQUARE), run: RUN });
  const { scores } = scoreReport(result);
  assert.deepEqual(scores.map((s) => s.label), ['Blocks', 'Complexity', 'Elegance', 'Efficiency']);
  assert.equal(scores[0].text, String(result.blocks));
  assert.equal(scores[1].text, tenths(result.complexity.value));
  assert.equal(scores[2].text, tenths(result.elegance.value));
  assert.equal(scores[3].text, tenths(result.efficiency.value));
  assert.deepEqual(scores.map((s) => s.fraction), [null, result.complexity.value, result.elegance.value, result.efficiency.value], 'blocks has no bar; the others fill as far as their number');
});

test('what there is not yet is said in words, with no bar: elegance needs a few blocks and efficiency needs a run', () => {
  const { scores } = scoreReport(assess({ project: projectOf([{ op: 'clean' }]) }));
  assert.equal(scores[2].text, 'not yet');
  assert.equal(scores[2].fraction, null);
  assert.equal(scores[3].text, 'not run');
  assert.equal(scores[3].fraction, null);
  const report = scoreReport(assess({ project: { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [] } }));
  assert.equal(report.scores[0].text, '0');
  assert.equal(report.scores[1].text, '0.0');
});

test('there is a section of reasons for each of complexity, elegance and efficiency, each starting with what it means', () => {
  const { sections } = scoreReport(assess({ project: projectOf(SQUARE), run: RUN }));
  assert.deepEqual(sections.map((s) => s.heading.split(':')[0]), ['Complexity', 'Elegance', 'Efficiency']);
  for (const section of sections) assert.equal(section.lines[0].kind, 'what', section.heading);
  const [complexity, elegance, efficiency] = sections;
  assert.ok(complexity.lines.some((l) => l.kind === 'note' && /points, level/.test(l.text)), 'the points and the level');
  assert.ok(complexity.lines.filter((l) => l.kind === 'part').length >= 7, 'every row of the points table, the ones that are 0 too, and the total');
  assert.ok(complexity.lines.some((l) => l.kind === 'part' && l.points === '0'));
  assert.ok(complexity.lines.some((l) => l.kind === 'part' && /^[1-9]\d*$/.test(l.points)), 'points are plain numbers, with no plus sign');
  assert.equal(complexity.lines.at(-1).kind, 'tip', 'and the one thing to try next');
  assert.ok(elegance.lines.slice(1).every((l) => l.kind === 'good' || l.kind === 'tip') && elegance.lines.length > 1);
  assert.ok(efficiency.lines.slice(1).every((l) => l.kind === 'good' || l.kind === 'tip') && efficiency.lines.length > 1);
});

test('the reasons are the badge\'s own, word for word', () => {
  const result = assess({ project: projectOf([...SQUARE, ...SQUARE.slice(2), ...SQUARE.slice(2), ...SQUARE.slice(2)]), run: RUN });
  const { sections } = scoreReport(result);
  assert.deepEqual(sections[1].lines.slice(1).map((l) => l.text), result.elegance.reasons.map((r) => r.text));
  assert.deepEqual(sections[2].lines.slice(1).map((l) => l.text), result.efficiency.reasons.map((r) => r.text));
});

test('every word in the report for every sample is plain ASCII with no dashes, so the PDF shows it all and it matches the program\'s own style', () => {
  for (const sample of SAMPLES) {
    const stacks = [{ x: 0, y: 0, blocks: sample.program }, ...(sample.defines ?? []).map((blocks, i) => ({ x: 0, y: 400 * (i + 1), blocks }))];
    const result = assess({ project: { app: FORMAT_ID, version: FORMAT_VERSION, stacks }, run: RUN });
    const report = scoreReport(result);
    const words = [...report.scores.flatMap((s) => [s.label, s.text]), ...report.sections.flatMap((s) => [s.heading, ...s.lines.flatMap((l) => [l.text, l.points ?? ''])])];
    for (const word of words) assert.ok(/^[\x20-\x7e]*$/.test(word) && !/\s-\s/.test(word), `${sample.id}: ${word}`);
  }
});

test('the complexity table is named for the blocks it counts, with nothing in brackets, a count and points for every row, and a total that adds up', () => {
  const result = assess({ project: projectOf(SQUARE), run: RUN });
  const rows = scoreReport(result).sections[0].lines.filter((l) => l.kind === 'part');
  assert.deepEqual(rows.map((r) => r.text), ['Variables', 'repeat / forever', 'if / if else', 'Blocks you made', 'ask / when paper clicked / when key pressed / every', 'Math and random', 'Blocks', 'Big ideas used', 'Total']);
  for (const row of rows) assert.ok(!/[()]/.test(row.text) && !/try/i.test(row.text), row.text);
  for (const row of rows.slice(0, -1)) assert.ok(/^\d+$/.test(row.count) && /^\d+$/.test(row.points), JSON.stringify(row));
  const loops = rows.find((r) => r.text === 'repeat / forever');
  assert.equal(loops.count, '1', 'the square has one repeat');
  assert.equal(Number(loops.points) > 0, true);
  const total = rows.at(-1);
  assert.equal(total.total, true);
  assert.equal(total.count, '');
  assert.equal(Number(total.points), result.complexity.points);
  assert.equal(rows.slice(0, -1).reduce((n, r) => n + Number(r.points), 0), Number(total.points), 'the rows above add up to the total');
});

test('the same holds for every sample: the rows add up to the total and none has brackets', () => {
  for (const sample of SAMPLES) {
    const stacks = [{ x: 0, y: 0, blocks: sample.program }, ...(sample.defines ?? []).map((blocks, i) => ({ x: 0, y: 400 * (i + 1), blocks }))];
    const rows = scoreReport(assess({ project: { app: FORMAT_ID, version: FORMAT_VERSION, stacks } })).sections[0].lines.filter((l) => l.kind === 'part');
    assert.equal(rows.slice(0, -1).reduce((n, r) => n + Number(r.points), 0), Number(rows.at(-1).points), sample.id);
    for (const row of rows) assert.ok(!/[()]/.test(row.text), `${sample.id}: ${row.text}`);
  }
});
