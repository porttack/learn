// Tests for the sample programs: every one must be a good project, must run
// without an error, must draw something, and must be written for a student.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { SAMPLES, SAMPLE_IDS, sampleById, sampleStacks, noteHeight } from '../js/ui/samples.js';
import { validateProject, findRunStack, walkBlocks, FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';
import { definitionsOf } from '../js/core/definitions.js';
import { runBlocks, createContext, Wait } from '../js/core/interpreter.js';
import { Turtle, PAPER_W, PAPER_H } from '../js/core/turtle.js';
import { NOTE_MAX_CHARS } from '../js/core/blocks-spec.js';
import { planStitches } from '../js/core/stitch-plan.js';
import { renderSamplesPage } from '../dev/make-samples-page.mjs';

const projectOf = (sample) => ({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: sampleStacks(sample) });

/** A repeatable stand-in for Math.random, so a test with chance in it can be run again. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runSample(sample, seed = 1) {
  const turtle = new Turtle();
  const printed = [];
  const project = projectOf(sample);
  const context = createContext({ turtle, random: seeded(seed), print: (line) => printed.push(line), definitions: definitionsOf(project).map });
  const { stack } = findRunStack(project);
  let waits = 0;
  for (const step of runBlocks(stack.blocks, context)) if (step instanceof Wait) waits += 1;
  return { turtle, printed, waits };
}

const words = (sample) => [sample.title, sample.summary, sample.look, sample.note, ...sample.concepts];

test('there are at least ten samples, with unique plain ids', () => {
  assert.ok(SAMPLES.length >= 10, `${SAMPLES.length} samples`);
  assert.equal(new Set(SAMPLE_IDS).size, SAMPLE_IDS.length, 'ids are unique');
  for (const id of SAMPLE_IDS) assert.match(id, /^[a-z]+(-[a-z]+)*$/, id);
  assert.equal(new Set(SAMPLES.map((s) => s.title)).size, SAMPLES.length, 'titles are unique');
});

test('sampleById finds a sample by its id and nothing else', () => {
  assert.equal(sampleById('square').title, 'A square');
  for (const odd of ['', 'nope', 'toString', '__proto__', 'constructor', 'SQUARE', ' square']) assert.equal(sampleById(odd), null, odd);
});

test('every sample is a project the app accepts, so Open and autosave would accept it too', () => {
  for (const sample of SAMPLES) {
    const checked = validateProject(projectOf(sample));
    assert.equal(checked.ok, true, `${sample.id}: ${checked.error}`);
  }
});

test('every sample has a sticky note on top and one program, which begins at a Start block, then the blocks it makes', () => {
  for (const sample of SAMPLES) {
    const [note, program, ...made] = sampleStacks(sample);
    assert.equal(made.length, (sample.defines ?? []).length, `${sample.id}: one stack for each block it makes`);
    for (const stack of made) assert.equal(stack.blocks[0].op, 'to', `${sample.id}: a block it makes starts with to`);
    assert.deepEqual(note.blocks.map((b) => b.op), ['note'], `${sample.id}: first stack is the note`);
    assert.equal(program.blocks[0].op, 'start', `${sample.id}: the program starts with Start`);
    assert.equal(program.blocks[1].op, 'clean', `${sample.id}: and cleans, so it draws the same each time`);
    const found = findRunStack(projectOf(sample));
    assert.equal(found.startCount, 1, sample.id);
    assert.equal(found.stack.blocks[0].op, 'start', `${sample.id}: Run picks the program, not the note`);
  }
});

test('the note sits above the program with room to spare, both inside the left edge of the page', () => {
  for (const sample of SAMPLES) {
    const [note, program] = sampleStacks(sample);
    assert.equal(note.x, program.x, sample.id);
    assert.ok(note.x >= 80, `${sample.id}: clear of the palette buttons`);
    assert.ok(program.y >= note.y + noteHeight(sample.note), `${sample.id}: program starts below the note`);
  }
});

test('a sample with blocks of its own puts them down the left, and the note and program at the right edge, clear of the drawing', () => {
  const withBlocks = SAMPLES.filter((s) => s.defines);
  assert.ok(withBlocks.length >= 3, 'there are samples with blocks of their own');
  for (const sample of withBlocks) {
    const [note, program, ...made] = sampleStacks(sample, { stageWidth: 1366 });
    assert.ok(made.every((stack) => stack.x < 100), `${sample.id}: its blocks are on the left`);
    assert.ok(note.x > 700 && note.x === program.x, `${sample.id}: the note and program are right of the middle of a 1366 page (${note.x})`);
    assert.ok(note.x + 200 <= 1366, `${sample.id}: and still on the page`);
    const [two, ...others] = made;
    if (others.length > 0) assert.ok(others[0].y > two.y, `${sample.id}: blocks stack down the left`);
  }
  const plain = sampleStacks(sampleById('square'));
  assert.equal(plain[0].x, 90, 'a sample with none stays on the left');
});

test('every sample explains itself in a note that fits on a sticky note', () => {
  for (const sample of SAMPLES) {
    assert.ok(sample.note.length >= 60, `${sample.id}: the note says something`);
    assert.ok(sample.note.length <= NOTE_MAX_CHARS, `${sample.id}: ${sample.note.length} characters`);
    // The note is drawn 16 lines tall at most, about 21 letters a line; leave room for ragged ends.
    assert.ok(sample.note.length <= 250, `${sample.id}: ${sample.note.length} characters would be cut off on the sticky note`);
  }
});

test('student wording has no em dashes or en dashes, and shows no grade level', () => {
  for (const sample of SAMPLES) {
    for (const text of words(sample)) {
      assert.ok(!/[–—]/.test(text), `${sample.id}: a dash in "${text}"`);
      assert.ok(!/\bgrade\b|\bage\b/i.test(text), `${sample.id}: mentions a level in "${text}"`);
    }
    assert.ok(sample.concepts.length >= 1, sample.id);
    assert.ok(sample.look.length >= 10, `${sample.id}: has words for the picture's alt text`);
  }
});

test('every sample runs without an error and draws something', () => {
  for (const sample of SAMPLES) {
    const { turtle } = runSample(sample);
    const drawn = turtle.ops.filter((op) => op.type === 'line' || op.type === 'arc');
    // A whole circle is one arc, so one mark is enough to count.
    assert.ok(drawn.length >= 1, `${sample.id}: drew ${drawn.length} lines`);
  }
});

test('samples that name print, wait or fill really use them', () => {
  // Look at everything the sample draws on the page, except its note.
  const uses = (sample, op) => {
    let found = false;
    for (const stack of sampleStacks(sample).slice(1)) {
      walkBlocks(stack.blocks, (block) => {
        if (block.op === op) found = true;
      });
    }
    return found;
  };
  for (const sample of SAMPLES) {
    const { printed, waits, turtle } = runSample(sample);
    if (sample.concepts.includes('print')) assert.ok(printed.length > 0, `${sample.id}: prints`);
    if (sample.concepts.includes('wait')) assert.ok(waits > 0, `${sample.id}: waits`);
    if (sample.concepts.includes('start fill')) assert.ok(turtle.ops.some((op) => op.type === 'fill'), `${sample.id}: fills`);
    if (sample.concepts.includes('if else')) assert.ok(uses(sample, 'ifelse'), `${sample.id}: has an if else`);
    if (sample.concepts.includes('random')) assert.ok(uses(sample, 'random'), `${sample.id}: has a random`);
    if (sample.concepts.includes('boxes')) assert.ok(uses(sample, 'store1'), `${sample.id}: stores in a box`);
    if (sample.concepts.includes('speed')) assert.ok(uses(sample, 'speed'), `${sample.id}: has a speed block`);
    if (sample.concepts.includes('my own block')) assert.ok(uses(sample, 'to') && uses(sample, 'call'), `${sample.id}: makes a block and calls it`);
    if (sample.concepts.includes('input')) assert.ok(uses(sample, 'input'), `${sample.id}: uses an input block`);
    if (sample.concepts.includes('calls itself')) {
      // some definition's own body has a call to that same name
      const calls = sampleStacks(sample).slice(2).some((stack) => {
        let self = false;
        walkBlocks(stack.blocks.slice(1), (block) => {
          if (block.op === 'call' && block.name === stack.blocks[0].name) self = true;
        });
        return self;
      });
      assert.ok(calls, `${sample.id}: a block calls itself`);
    }
  }
});

test('nothing is drawn off the paper, except by a random walk that sometimes wanders there', () => {
  const insidePaper = (turtle) =>
    turtle.ops
      .filter((op) => op.type === 'line')
      .every((op) => [[op.x1, op.y1], [op.x2, op.y2]].every(([x, y]) => Math.abs(x) <= PAPER_W / 2 && Math.abs(y) <= PAPER_H / 2));
  for (const sample of SAMPLES) {
    if (sample.id === 'wandering-turtle') continue; // see below
    assert.ok(insidePaper(runSample(sample).turtle), `${sample.id} goes off the paper`);
  }
  let stayed = 0;
  for (let seed = 1; seed <= 100; seed += 1) if (insidePaper(runSample(sampleById('wandering-turtle'), seed).turtle)) stayed += 1;
  assert.ok(stayed >= 85, `the wandering turtle stayed on the paper in ${stayed} of 100 runs`);
});

test('the chance samples really do differ from run to run, and the others do not', () => {
  const picture = (sample, seed) => JSON.stringify(runSample(sample, seed).turtle.ops);
  for (const sample of SAMPLES) {
    const same = picture(sample, 1) === picture(sample, 2);
    const usesChance = sample.concepts.includes('random');
    assert.equal(same, !usesChance, `${sample.id}: ${usesChance ? 'should differ' : 'should be the same'} each run`);
  }
});

test('the polygon sample gets its turn right: every shape from 3 sides up closes', () => {
  const polygon = sampleById('polygon');
  for (const sides of [3, 4, 5, 6, 8, 12]) {
    const program = structuredClone(polygon.program);
    program[2] = { op: 'store1', args: [sides] };
    const turtle = new Turtle();
    [...runBlocks(program, createContext({ turtle }))];
    assert.ok(Math.abs(turtle.reportedX) < 0.01 && Math.abs(turtle.reportedY) < 0.01, `${sides} sides: back at the start`);
  }
});

test('the beads are red and blue in turn, five of them', () => {
  const { turtle } = runSample(sampleById('red-and-blue'));
  const colors = turtle.ops.filter((op) => op.type === 'line' && op.size === 40).map((op) => op.color.join(','));
  assert.equal(colors.length, 5);
  assert.deepEqual(colors, ['0,60,220', '220,0,0', '0,60,220', '220,0,0', '0,60,220']);
});

test('the countdown prints 3, 2, 1 and waits between them', () => {
  const { printed, waits } = runSample(sampleById('countdown'));
  assert.deepEqual(printed.map(String), ['3', '2', '1']);
  assert.equal(waits, 3);
});

test('opening a sample does not need the saved project: the app never asks storage for one', () => {
  // main.js reads the saved project only when there is no sample. This keeps that true.
  const main = readFileSync(new URL('../js/ui/main.js', import.meta.url), 'utf8');
  assert.match(main, /if \(!sample && !\(demo/, 'the saved project is only read when there is no sample');
  assert.match(main, /if \(sample\) autosave\.pause\(\)/, 'a sample pauses autosave');
  const storage = readFileSync(new URL('../js/ui/storage.js', import.meta.url), 'utf8');
  assert.match(storage, /schedule\(\) \{\n\s+if \(this\.paused\) return;/);
  assert.match(storage, /flush\(\) \{\n\s+if \(this\.paused\) return;/);
});

test('every sample has a thumbnail picture for the Samples page, the same size as the others', () => {
  for (const sample of SAMPLES) {
    const file = new URL(`../images/samples/${sample.id}.png`, import.meta.url);
    assert.ok(existsSync(file), `${sample.id}: images/samples/${sample.id}.png (run dev/make-sample-thumbs.mjs)`);
    const png = readFileSync(file);
    assert.deepEqual([...png.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], sample.id);
    assert.equal(png.readUInt32BE(16), 350, `${sample.id}: width`);
    assert.equal(png.readUInt32BE(20), 280, `${sample.id}: height`);
    assert.ok(png.length < 80 * 1024, `${sample.id}: ${png.length} bytes is a lot for a thumbnail`);
  }
});

test('the Samples page lists every sample once, with a link that opens it and a thumbnail', () => {
  const html = readFileSync(new URL('../samples.html', import.meta.url), 'utf8');
  for (const sample of SAMPLES) {
    const links = html.match(new RegExp(`href="\\./\\?sample=${sample.id}"`, 'g')) ?? [];
    assert.ok(links.length >= 1, `${sample.id}: has a link`);
    assert.ok(html.includes(`src="images/samples/${sample.id}.png"`), `${sample.id}: has its picture`);
    assert.ok(html.includes(`alt="${sample.look}"`), `${sample.id}: the picture has alt text`);
    assert.ok(html.includes(sample.summary), `${sample.id}: has its summary`);
  }
  const listed = [...html.matchAll(/href="\.\/\?sample=([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(listed)], SAMPLE_IDS, 'in the same order as samples.js, and none that is not a sample');
});

test('samples.html is exactly what dev/make-samples-page.mjs makes from samples.js', () => {
  const onDisk = readFileSync(new URL('../samples.html', import.meta.url), 'utf8');
  assert.equal(onDisk, renderSamplesPage(), 'run: node turtlelab/dev/make-samples-page.mjs');
});

test('the embroidery samples are good to stitch: lines only, one or two threads, few hops, short stitches, and each is a real drawing', () => {
  const forMachine = SAMPLES.filter((sample) => sample.concepts.includes('for an embroidery machine'));
  assert.ok(forMachine.length >= 3, 'there are at least three samples for an embroidery machine');
  for (const sample of forMachine) {
    const { turtle } = runSample(sample);
    assert.ok(!turtle.ops.some((op) => op.type === 'fill' || op.type === 'fillScreen'), `${sample.id}: no filled shapes (a machine would need a different stitch for them)`);
    const plan = planStitches(turtle.ops, { name: sample.id });
    assert.ok(plan, `${sample.id}: has something to stitch`);
    assert.ok(plan.threads.length <= 2, `${sample.id}: ${plan.threads.length} threads`);
    assert.ok(plan.jumps <= 2 && plan.trims === 0, `${sample.id}: ${plan.jumps} hops and ${plan.trims} cuts`);
    assert.ok(plan.stitches >= 80 && plan.stitches <= 600, `${sample.id}: ${plan.stitches} stitches`);
    assert.ok(Math.max(plan.widthMm, plan.heightMm) === 90, `${sample.id}: sized to fit a 4 inch hoop`);
    assert.equal(plan.skippedFills, 0);
    // A stitch is the step from one stitch to the next (a hop between lines is not a stitch).
    plan.commands.forEach((command, i) => {
      const before = plan.commands[i - 1];
      if (command.cmd !== 'stitch' || before?.cmd !== 'stitch') return;
      const length = Math.hypot(command.x - before.x, command.y - before.y);
      assert.ok(length <= 31, `${sample.id}: a stitch ${length / 10} mm long`);
    });
    assert.ok(/PES or DST/.test(sample.note), `${sample.id}: the note says how to get the file`);
  }
});
