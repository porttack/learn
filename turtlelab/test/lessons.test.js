// Tests for the TurtleLab Lessons pages (_turtlelessons/): the rules for what a student page may say, that every demo a page frames exists, that the steps
// run 1, 2, 3 ... without gaps, that the slow variable demo does what the page says, and that the numbers the pages and the answer key state are what the
// real programs give. The pages are outside this folder (the lessons are CC content, TurtleLab is AGPL) and are only read here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { SAMPLES, sampleById, sampleStacks } from '../js/ui/samples.js';
import { walkBlocks, findRunStack, FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';
import { definitionsOf } from '../js/core/definitions.js';
import { compileLogo } from '../js/core/logo-compile.js';
import { runBlocks, createContext } from '../js/core/interpreter.js';
import { Turtle } from '../js/core/turtle.js';
import { channelBinary, channelHex, toHexUpper } from '../js/core/color.js';

const dir = new URL('../../_turtlelessons/', import.meta.url);
const pages = readdirSync(dir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const text = readFileSync(new URL(file, dir), 'utf8');
    const [, front, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const meta = Object.fromEntries(front.split('\n').map((line) => line.match(/^([a-z_]+):\s*"?(.*?)"?\s*(?:#.*)?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
    return { file, text, body, meta };
  });
// The landing page is a student page too (it is not in the collection, so it is read here), apart from its one "For teachers" link.
pages.push({ file: '../turtle-lessons/index.md', text: readFileSync(new URL('../../turtle-lessons/index.md', import.meta.url), 'utf8'), body: readFileSync(new URL('../../turtle-lessons/index.md', import.meta.url), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').replace(/## For teachers[\s\S]*$/, ''), meta: { companion: 'true' } });
const steps = pages.filter((page) => page.meta.companion !== 'true').sort((a, b) => Number(a.meta.order) - Number(b.meta.order));
const key = readFileSync(new URL('../../turtle-lessons/answer-key.md', import.meta.url), 'utf8');
const notes = readFileSync(new URL('../../turtle-lessons/teacher-notes.md', import.meta.url), 'utf8');
const index = readFileSync(new URL('../../turtle-lessons/index.md', import.meta.url), 'utf8');
const carrier = JSON.parse(readFileSync(new URL('../../_standards/carriers/turtlelessons.json', import.meta.url), 'utf8'));

test('the steps are numbered 1, 2, 3 ... with none missing, each a lesson of this pathway written for the page, with a title', () => {
  assert.deepEqual(steps.map((page) => Number(page.meta.order)), steps.map((_, i) => i + 1));
  for (const page of steps) {
    assert.equal(page.meta.layout, 'lesson', page.file);
    assert.equal(page.meta.pathway, 'turtlelessons', page.file);
    assert.equal(page.meta.source, 'original', `${page.file}: written for this site, never adapted`);
    assert.ok(page.meta.title.length >= 4, page.file);
    assert.match(page.file, new RegExp(`^step-${page.meta.order}-[a-z0-9-]+\\.md$`), `${page.file}: named step-N-title, with the same N as its order`);
  }
});

test('a student page never says what a teacher would: no class, grading, points, timing, turn it in or learning site', () => {
  const banned = /\b(teachers?|class(room)?|substitutes?|grad(e|es|ed|ing)|points|minutes?|hours?|homework|due|LMS|Schoology|Classroom)\b|turn (it|them|this|that) in|hand (it |them )?in/i;
  for (const page of pages) {
    // what a reader sees: the words, with the tags of the page taken away (a class="..." is not a word to say), and of an include only its title
    const words = page.body.replace(/\{%[\s\S]*?%\}/g, (tag) => (tag.match(/title="([^"]*)"/)?.[1] ?? '')).replace(/<[^>]+>/g, ' ');
    const found = words.match(banned);
    assert.ok(!found, `${page.file}: says "${found?.[0]}"`);
  }
});

test('a student page has no em dashes or en dashes, and no "Challenge" box (extras go under "Done early?")', () => {
  for (const page of pages) {
    assert.ok(!/[–—]/.test(page.text), `${page.file}: a dash`);
    assert.ok(!/class="callout challenge"/.test(page.body) && !/\*\*Challenge/i.test(page.body), `${page.file}: a Challenge box`);
  }
});

test('every demo a page frames is a real sample, no page frames more than four (each is a whole copy of the app), and every lesson-only demo is used', () => {
  const used = new Set();
  for (const page of pages) {
    const frames = [...page.body.matchAll(/\{%\s*include turtlelab-embed\.html\s+([^%]*?)%\}/g)].map((m) => m[1]);
    assert.ok(frames.length <= 4, `${page.file}: ${frames.length} frames`);
    for (const attributes of frames) {
      const sample = attributes.match(/sample="([^"]+)"/)?.[1];
      assert.ok(sample && sampleById(sample), `${page.file}: no sample called ${sample}`);
      assert.match(attributes.match(/title="([^"]*)"/)?.[1] ?? '', /\S+ \S+ \S+/, `${page.file}: a frame needs a title of a few words, for a screen reader`);
      used.add(sample);
    }
    // a link that opens a sample in a tab must name one that exists too
    for (const [, sample] of page.body.matchAll(/turtlelab\/\?sample=([a-z0-9-]+)/g)) assert.ok(sampleById(sample), `${page.file}: link to a sample called ${sample}`);
  }
  for (const sample of SAMPLES.filter((s) => s.id.startsWith('lesson-'))) assert.ok(used.has(sample.id), `${sample.id} is made for a lesson but no lesson uses it`);
});

test('Step 6: the house uses box1 in exactly three forward blocks, and one number sizes the whole house', () => {
  const stacks = sampleStacks(sampleById('lesson-box-house')).slice(1);
  let uses = 0;
  for (const stack of stacks) walkBlocks(stack.blocks, (block) => { if (block.op === 'forward' && block.args[0]?.op === 'box1') uses += 1; });
  assert.equal(uses, 3, 'the page says three');
  const stores = [];
  for (const stack of stacks) walkBlocks(stack.blocks, (block) => { if (block.op === 'store1') stores.push(block.args[0]); });
  assert.deepEqual(stores, [80], 'and the one number is 80');
  assert.match(readFileSync(new URL('../../_turtlelessons/step-6-boxes.md', import.meta.url), 'utf8'), /1\. 80\.\n2\. Three/, 'the page agrees');
});

// ---- The numbers the pages and the answer key state, worked out by running the real programs ------------------------------------------------------

const b = (op, ...args) => ({ op, args });
const rep = (count, ...body) => ({ op: 'repeat', args: [count], body });
const box1 = { op: 'box1' };

/** A repeatable stand-in for Math.random. */
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

/** Run a project (a list of stacks) from its Start block, and say what happened. */
function run(stacks, seed = 1) {
  const project = { app: FORMAT_ID, version: FORMAT_VERSION, stacks };
  const turtle = new Turtle();
  const printed = [];
  const context = createContext({ turtle, random: seeded(seed), print: (line) => printed.push(line), definitions: definitionsOf(project).map });
  for (const step of runBlocks(findRunStack(project).stack.blocks, context)) void step;
  const lines = turtle.ops.filter((op) => op.type === 'line' && op.size > 0);
  const arcs = turtle.ops.filter((op) => op.type === 'arc');
  const heading = ((turtle.heading % 360) + 360) % 360;
  const home = Math.hypot(turtle.x, turtle.y) < 1e-6 && Math.min(heading, 360 - heading) < 1e-6;
  return { turtle, printed, boxes: context.boxes, lines, arcs, home };
}
/** The stacks of a sample as copies that can be changed: the note, the program, then the blocks it makes. */
const copyOf = (id) => structuredClone(sampleStacks(sampleById(id)));
const mainOf = (stacks) => stacks[1].blocks;
const project = (...blocks) => [{ x: 0, y: 0, blocks }];

test('Step 7: what the counting box prints, with the changes the page asks for', () => {
  assert.deepEqual(run(copyOf('lesson-box-trace')).printed, ['10', '20', '30', '40', '50', '60', '70', '80'], 'the first lap prints 10 and the last 80');
  const five = copyOf('lesson-box-trace');
  mainOf(five)[4].body[0].args[0].args[1] = 5;
  assert.equal(run(five).printed.at(-1), '40', 'with 5 the last lap prints 40');
  const twelve = copyOf('lesson-box-trace');
  mainOf(twelve)[4].args[0] = 12;
  assert.equal(run(twelve).printed.at(-1), '120', 'with 12 laps of 10 the last is 120');
  assert.deepEqual(run(project(b('start'), b('store1', 2), rep(3, b('store1', b('multiply', box1, 2)), b('print', box1)))).printed, ['4', '8', '16'], 'the doubling box');
  assert.deepEqual(run(project(b('start'), b('store1', 2), rep(5, b('store1', b('multiply', box1, 2)), b('print', box1)))).printed, ['4', '8', '16', '32', '64'], 'and five laps end at 64');
});

test('Step 7: the countdown ends with 0 in the box, and the start number and the laps are separate numbers', () => {
  const countdown = run(copyOf('countdown'));
  assert.deepEqual(countdown.printed, ['3', '2', '1']);
  assert.equal(countdown.boxes[0], 0, 'the box holds 0 when the circle starts');
  const five = copyOf('countdown');
  mainOf(five)[2].args[0] = 5;
  const short = run(five);
  assert.deepEqual(short.printed, ['5', '4', '3'], 'start 5 with 3 laps prints 5, 4 and 3');
  assert.equal(short.boxes[0], 2);
  mainOf(five)[3].args[0] = 5;
  assert.deepEqual(run(five).printed, ['5', '4', '3', '2', '1'], 'with 5 laps as well it prints 5 down to 1');
});

test('Step 8: the three squares are 40, 80 and 120 and 12 lines; the flower is 8 petals that close only with the right turn; changing the word changes every petal', () => {
  const squares = copyOf('own-block');
  assert.deepEqual(mainOf(squares).filter((block) => block.op === 'call').map((block) => block.args[0]), [40, 80, 120]);
  assert.equal(run(squares).lines.length, 12, 'three squares of four sides');
  const flower = copyOf('lesson-own-flower');
  assert.equal(mainOf(flower)[4].args[0], 8, 'eight petals');
  assert.equal(run(flower).arcs.length, 16, 'each petal is two arcs');
  assert.ok(run(flower).home, '8 times 45 is 360, so it ends where it began');
  const six = copyOf('lesson-own-flower');
  mainOf(six)[4].args[0] = 6;
  assert.ok(!run(six).home, 'six petals with a turn of 45 do not close');
  mainOf(six)[4].body[1].args[0] = 60;
  assert.ok(run(six).home, 'six petals close with a turn of 60');
  const changed = copyOf('lesson-own-flower');
  changed[2].blocks[1].body[1].args[0] = 90; // the 120 inside the petal
  const before = run(flower).arcs;
  const after = run(changed).arcs;
  assert.ok(before.filter((arc, i) => JSON.stringify(arc) !== JSON.stringify(after[i])).length >= 8, 'every petal changed');
});

test('Step 9: twelve squares are 48 forward blocks and close; the other rings the page names close or do not as it says; the hexagon flower is 36 lines; 20 by 20 is 400', () => {
  const squares = run(copyOf('lesson-nested-count'));
  assert.equal(squares.lines.length, 48);
  assert.ok(squares.home, '12 times 30 is 360');
  const ring = (count, turn) => {
    const stacks = copyOf('lesson-nested-count');
    mainOf(stacks)[4].args[0] = count;
    mainOf(stacks)[4].body[1].args[0] = turn;
    return run(stacks);
  };
  assert.ok(ring(6, 60).home, '6 squares with a turn of 60 close');
  assert.ok(ring(36, 10).home, '36 squares with a turn of 10 close');
  assert.ok(!ring(12, 20).home, '12 squares with a turn of 20 do not: 240 is only two thirds of a circle');
  assert.equal(run(copyOf('hexagon-flower')).lines.length, 36);
  const pentagons = copyOf('hexagon-flower');
  mainOf(pentagons)[4].args[0] = 5;
  mainOf(pentagons)[4].body[0].args[0] = 5;
  mainOf(pentagons)[4].body[0].body[1].args[0] = 72;
  mainOf(pentagons)[4].body[1].args[0] = 72;
  const flower = run(pentagons);
  assert.ok(flower.home && flower.lines.length === 25, 'five pentagons: outside 5 and 72');
  assert.equal(run(project(b('start'), rep(20, rep(20, b('forward', 5), b('right', 18)), b('right', 18)))).lines.length, 400);
});

test('Step 10: the binary, hex and color numbers on the page are the picker\'s own', () => {
  const binary = (n) => channelBinary(n).replace(/(.{4})(.{4})/, '$1 $2');
  assert.equal(binary(255), '1111 1111');
  assert.equal(binary(128), '1000 0000');
  assert.equal(binary(10), '0000 1010');
  assert.equal(binary(64), '0100 0000');
  assert.equal([128, 64, 32, 16, 8, 4, 2, 1].reduce((a, c) => a + c, 0), 255, 'all eight switches on');
  assert.equal(channelHex(255), 'FF');
  assert.equal(toHexUpper([255, 255, 0]), '#FFFF00');
  assert.equal(toHexUpper([0, 255, 0]), '#00FF00');
  assert.equal(2 ** 8, 256);
  assert.equal(256 * 256 * 256, 16777216);
  assert.equal(2 ** 24, 16777216, '24 bits');
  const bar = mainOf(copyOf('lesson-color-mix')).find((block) => block.op === 'setcolor');
  assert.deepEqual(bar.args, [255, 0, 0], 'the bar starts red');
  const squares = run(copyOf('spinning-squares')).lines;
  assert.deepEqual(squares[0].color, [7, 60, 248], 'the first square');
  assert.deepEqual(squares.at(-1).color, [252, 60, 3], 'the last square');
});

test('Step 11: every bug is a bug, and the change in the answer fixes it', () => {
  const find = (stacks, op) => { const found = []; for (const stack of stacks.slice(1)) walkBlocks(stack.blocks, (block) => { if (block.op === op) found.push(block); }); return found; };
  // 1. the triangle: a turn of 100 does not close, 120 does
  const triangle = copyOf('lesson-bug-triangle');
  assert.ok(!run(triangle).home);
  find(triangle, 'right')[0].args[0] = 120;
  assert.ok(run(triangle).home);
  // 2. the box: box1 holds 100 but the sides are 50, until box1 is plugged into the forward
  const box = copyOf('lesson-bug-box');
  const broken = run(box);
  assert.equal(broken.boxes[0], 100);
  assert.ok(broken.lines.every((line) => Math.abs(Math.hypot(line.x2 - line.x1, line.y2 - line.y1) - 50) < 1e-6), 'the sides are 50');
  find(box, 'forward')[0].args[0] = box1;
  assert.ok(run(box).lines.every((line) => Math.abs(Math.hypot(line.x2 - line.x1, line.y2 - line.y1) - 100) < 1e-6), 'and 100 once the box is used');
  // 3. the coin flip: random 1 2 = 3 is never true, so it only ever turns left; = 1 (or 2) lets it choose
  const turns = (stacks, seed) => { const t = []; const project = { app: FORMAT_ID, version: FORMAT_VERSION, stacks }; const turtle = new Turtle(); const context = createContext({ turtle, random: seeded(seed), definitions: new Map() }); let last = 0; for (const step of runBlocks(findRunStack(project).stack.blocks, context)) { void step; const h = turtle.heading; if (h !== last) { t.push(((h - last + 540) % 360) - 180); last = h; } } return t; };
  const coin = copyOf('lesson-bug-if');
  for (let seed = 1; seed <= 5; seed += 1) assert.ok(turns(coin, seed).every((turn) => turn === -90), `seed ${seed}: it only ever turns left`);
  assert.ok(run(coin).home && run(coin, 2).home, 'it traces the same small square every time');
  find(coin, 'equal')[0].args[1] = 1;
  const wander = turns(coin, 3);
  assert.ok(wander.includes(90) && wander.includes(-90), 'with = 1 it turns both ways');
  // 4. the house: without a pen down the roof is not drawn
  const house = copyOf('lesson-bug-pen');
  assert.equal(run(house).lines.length, 4, 'a square and no roof');
  mainOf(house).splice(6, 0, b('pendown'));
  assert.equal(run(house).lines.length, 7, 'a pen down before the roof draws its three sides');
});

test('Step 1: the L ends where the page says, and the two Bs are counted and turned the way the page says', () => {
  const page = readFileSync(new URL('../../_turtlelessons/step-1-your-initials.md', import.meta.url), 'utf8');
  // the L: the frame holds the blocks the page lists (and a speed block, which the page says to leave out), and ends at (-90, -60) facing right
  const l = copyOf('lesson-l');
  assert.deepEqual(mainOf(l).map((block) => block.op).filter((op) => op !== 'speed'), ['start', 'clean', 'penup', 'setxy', 'setheading', 'pendown', 'forward', 'left', 'forward']);
  const ended = run(l).turtle;
  assert.deepEqual([Math.round(ended.x), Math.round(ended.y), Math.round(ended.heading)], [-90, -60, 90]);
  assert.match(page, /ends at \(-90, -60\), facing right/);
  // the Bs: 15 blocks and 9, and the same four blocks to travel to each
  const stacks = copyOf('lesson-b-two-ways');
  const { map } = definitionsOf({ stacks });
  assert.deepEqual([map.get('straight b').body.length, map.get('curved b').body.length], [15, 9]);
  assert.match(page, /straight B has 15 blocks and the curved B has 9/);
  const main = mainOf(stacks);
  const travel = (from) => main.slice(from, from + 4).map((block) => block.op);
  assert.deepEqual([travel(3), travel(8)], [['penup', 'setxy', 'setheading', 'pendown'], ['penup', 'setxy', 'setheading', 'pendown']]);
  // the turtle ends the straight B facing left, so a second B with no set heading would come out turned
  assert.equal(Math.round(run(structuredClone(stacks).map((stack, i) => (i === 1 ? { ...stack, blocks: stack.blocks.slice(0, 8) } : stack))).turtle.heading) % 360, 270);
  assert.match(page, /ends the first B facing left/);
  // the page's third question: heading 90 above the curved B lays its spine along the paper
  assert.equal(main[10].op, 'setheading');
  main[10].args[0] = 90;
  const turned = run(stacks).lines.find((line) => Math.abs(line.x1 - 16) < 1e-6 && Math.abs(line.y1 + 60) < 1e-6);
  assert.deepEqual([Math.round(turned.x2), Math.round(turned.y2)], [136, -60], 'the spine runs to the right instead of up');

  // the third way is the teacher's own E and B: their Logo, read by TurtleLab's own Logo reader, draws exactly what the frame draws
  const theirLogo = 'clearscreen\nsetspeed 1\nforward 80\nright 90\nforward 30\nback 25\nleft 90\nback 40\nright 90\nforward 25\nback 25\nleft 90\nback 40\nright 90\nforward 30\npenup\nforward 20\nleft 90\npendown\nforward 80\nright 135\nforward 30\nright 90\nforward 30\nleft 90\nforward 30\nright 90\nforward 30\npenup\nforward 100\n';
  const theirs = compileLogo(theirLogo);
  assert.ok(theirs.ok, 'their Logo reads');
  const shape = (result) => ({
    lines: result.lines.map((line) => [line.x1, line.y1, line.x2, line.y2, line.size, ...line.color].map((v) => Math.round(v * 1000) / 1000)),
    end: [result.turtle.x, result.turtle.y, result.turtle.heading].map((v) => Math.round(v * 1000) / 1000),
  });
  const frame = copyOf('lesson-b-diagonal');
  // (the frame first moves the turtle 40 left and 40 down, so the letters sit in the middle of the paper; theirs is drawn from the middle itself)
  const centered = project(b('clean'), b('penup'), b('setxy', -40, -40), b('pendown'), ...theirs.main.slice(1));
  assert.equal(theirs.main[0].op, 'clean');
  assert.deepEqual(shape(run(frame)), shape(run(centered)), 'the frame draws the same E and B, line for line, and parks the turtle in the same place');
  // the page: the E ends facing right, and the four blocks after it leave the turtle 20 further on, facing up, where the B starts
  const walk = (count) => run(structuredClone(frame).map((stack, i) => (i === 1 ? { ...stack, blocks: stack.blocks.slice(0, count) } : stack))).turtle;
  assert.deepEqual([walk(7).x, walk(7).y, walk(7).heading].map(Math.round), [-5, -40, 90], 'the E ends facing right, at its foot');
  assert.deepEqual([walk(11).x, walk(11).y, walk(11).heading].map(Math.round), [15, -40, 0], 'the walk leaves the turtle 20 on, facing up, where the B starts');
  assert.deepEqual(mainOf(frame).slice(7, 11).map((block) => [block.op, block.args[0]]), [['penup', undefined], ['forward', 20], ['left', 90], ['pendown', undefined]]);
  assert.match(page, /`pen up`, `forward 20`, `left 90` and `pen down`/);
});

test('everything that lists the steps knows every step: the contents page, the teacher notes, the answer key and the standards file', () => {
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
  assert.match(index, new RegExp(`${words[steps.length]} steps with`), `the contents page says how many steps there are (${steps.length})`);
  assert.match(index, new RegExp(`Print all ${words[steps.length].toLowerCase()} steps`), 'and the print link');
  const slugs = steps.map((page) => page.file.replace(/\.md$/, ''));
  for (const [i, slug] of slugs.entries()) {
    assert.ok(notes.includes(`/turtle-lessons/${slug}/`), `${slug}: the teacher notes link to it`);
    assert.ok(new RegExp(`\\*\\*Step ${i + 1}\\.\\*\\*`).test(key), `${slug}: the answer key has an entry for Step ${i + 1}`);
    assert.ok(slug in carrier.meta.locator_titles, `${slug}: the standards file names it`);
  }
  // every locator the standards file uses is a real step, and every step is used somewhere
  const used = new Set();
  for (const codes of Object.values(carrier.coverage)) for (const entry of Object.values(codes)) {
    for (const locator of entry.locators) { assert.ok(slugs.includes(locator), `standards locator ${locator} is not a step`); used.add(locator); }
    for (const locator of Object.keys(entry.locator_notes)) assert.ok(entry.locators.includes(locator), `a note for ${locator} that is not one of the locators`);
  }
  for (const slug of slugs) assert.ok(used.has(slug), `${slug} is not in any standard`);
  assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(carrier)), 'no dashes in what the standards widget shows on student pages');
  assert.ok(!/\b(teachers?|class(room)?|grad(e|es|ing)|points|minutes?|homework)\b/i.test(JSON.stringify(carrier.coverage)), 'and none of the words a student page may not say');
});

test('the printable planning sheet is a companion that sorts after every step, so the steps\' next and previous links never lead to it in the middle', () => {
  const sheet = pages.find((page) => page.file === 'planning-sheet.md');
  assert.equal(sheet.meta.companion, 'true');
  assert.ok(Number(sheet.meta.order) > steps.length, `its order ${sheet.meta.order} is after step ${steps.length}`);
  assert.equal(sheet.meta.label, 'Step 5', 'it still says which step it is for');
});

test('Step 6: the slow program shows what the page says, block by block: 40, then 50 and 60, prints that change nothing, 100 replaces 60, and the line is 100 long', () => {
  const stacks = copyOf('lesson-box-steps');
  const blocks = mainOf(stacks);
  assert.equal(blocks.find((block) => block.op === 'speed').args[0], 1, 'it is slow, so every block can be seen');
  const project = { app: FORMAT_ID, version: FORMAT_VERSION, stacks };
  const turtle = new Turtle();
  const printed = [];
  const context = createContext({ turtle, print: (line) => printed.push(line), definitions: new Map() });
  const trace = [];
  let at = 0;
  for (const step of runBlocks(findRunStack(project).stack.blocks, context)) {
    void step;
    trace.push([blocks[at].op, context.boxes[0]]);
    at += 1;
  }
  assert.deepEqual(trace.filter(([op]) => op === 'store1').map(([, value]) => value), [40, 50, 60, 100], 'what the box holds after each store: 40, then 50, then 60, then 100');
  assert.deepEqual(trace.filter(([op]) => op === 'print').map(([, value]) => value), [60, 60, 100], 'printing does not change it');
  assert.deepEqual(printed, ['60', '60', '100'], 'and the Output box shows 60, 60 and 100');
  const line = turtle.ops.find((op) => op.type === 'line');
  assert.equal(Math.hypot(line.x2 - line.x1, line.y2 - line.y1), 100, 'forward box1 is 100 long');
  const page = readFileSync(new URL('../../_turtlelessons/step-6-boxes.md', import.meta.url), 'utf8');
  assert.match(page, /1\. 40\.\n2\. 60\./, 'the page gives 40 and then 60');
  assert.match(page, /Each prints 60/);
  assert.match(page, /\*\*variable\*\*/, 'and says the word');
  assert.ok((page.match(/variable/gi) ?? []).length >= 12, 'and uses it throughout');
  assert.ok(!/store box1 \+ 1|look at box1|store 5 in box1/.test(page), 'and never names a block that the app does not have');
});
