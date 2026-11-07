// Tests for js/core/elegance.js, efficiency.js and quality.js: elegance, efficiency and complexity from 0.0 to 1.0, and the reasons for them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Turtle } from '../js/core/turtle.js';
import { eleganceOf, COSTS, MIN_BLOCKS } from '../js/core/elegance.js';
import { drawingStats, efficiencyOf, LIMITS } from '../js/core/efficiency.js';
import { assess, complexity01, scaleLine, tenths, COMPLEXITY_SCALE } from '../js/core/quality.js';
import { scoreProject } from '../js/core/complexity.js';

const b = (op, ...args) => ({ op, args });
const rep = (n, body) => ({ op: 'repeat', args: [n], body });
const call = (name) => ({ op: 'call', name, params: [], args: [] });
const hat = (name) => ({ op: 'to', args: [], name, params: [] });
const project = (...stacks) => ({ stacks: stacks.map((blocks, i) => ({ x: 20, y: 20 + i * 200, blocks })) });
const texts = (result) => result.reasons.map((r) => r.text);

// ---- Elegance -------------------------------------------------------------------------------------------------

test('a tidy square is 1.0, the same square with every side written out is much less, and the reasons say why', () => {
  const tidy = eleganceOf(project([b('start'), b('clean'), rep(4, [b('forward', 100), b('right', 90)])]));
  assert.equal(tidy.value, 1);
  assert.ok(texts(tidy).includes('A loop does the repeating.'));
  const sides = [b('forward', 100), b('right', 90)];
  const unrolled = eleganceOf(project([b('start'), b('clean'), ...sides, ...sides.map((x) => ({ ...x })), ...sides.map((x) => ({ ...x })), ...sides.map((x) => ({ ...x }))]));
  assert.ok(unrolled.value < 0.5, `${unrolled.value}`);
  assert.match(texts(unrolled)[0], /forward 100, right 90 comes 4 times in a row\. A repeat block could do it, and save 6 blocks\./);
  assert.equal(unrolled.saved, 6);
});

test('one block three or more times in a row is a copy, twice is not (two sides of a path can be two blocks)', () => {
  assert.ok(eleganceOf(project([b('start'), b('forward', 10), b('forward', 10), b('left', 30), b('back', 5)])).value === 1);
  const three = eleganceOf(project([b('start'), b('forward', 10), b('forward', 10), b('forward', 10), b('left', 30)]));
  assert.ok(three.value < 1);
  assert.match(texts(three)[0], /forward 10 comes 3 times in a row/);
});

test('the same few blocks in different places are copies too, and a block of your own is the advice', () => {
  const copies = eleganceOf(project([b('start'), b('forward', 50), b('right', 90), b('forward', 50), b('left', 30), b('back', 20), b('forward', 50), b('right', 90), b('forward', 50), b('left', 60)]));
  assert.ok(copies.value < 1, `${copies.value}`);
  assert.ok(texts(copies).some((t) => /is on the page 2 times\. A block of your own \(to\) could do it once/.test(t)), texts(copies).join(' | '));
});

test('using a block of your own for a repeated part is good, and says so', () => {
  const r = eleganceOf(project([hat('side'), b('forward', 50), b('right', 90), b('forward', 50)], [b('start'), call('side'), b('left', 30), call('side'), b('left', 60), call('side')]));
  assert.ok(texts(r).includes('Your block side is used 3 times, so it is written once.'), texts(r).join(' | '));
});

test('a number typed over and over (not 0 or 1) is a tip to use a variable, but a number that is in copied blocks is not counted twice', () => {
  const r = eleganceOf(project([b('start'), b('forward', 37), b('left', 11), b('forward', 37), b('right', 12), b('forward', 37), b('left', 13), b('forward', 37), b('back', 5)]));
  assert.ok(r.value < 1);
  assert.ok(texts(r).includes('The number 37 is typed 4 times. A variable (a box) or an input could hold it in one place.'), texts(r).join(' | '));
  // 0 and 1 are never "typed too often".
  const zeros = eleganceOf(project([b('start'), b('forward', 0), b('left', 11), b('forward', 0), b('right', 12), b('forward', 0), b('left', 13), b('forward', 0), b('back', 5)]));
  assert.ok(!texts(zeros).some((t) => /is typed/.test(t)));
});

test('things left over cost a little each: a block never used, a stack that does not start with start, blocks after stop, an empty repeat', () => {
  const base = [b('start'), b('forward', 10), b('left', 20), b('back', 5)];
  assert.equal(eleganceOf(project(base)).value, 1);
  const unused = eleganceOf(project(base, [hat('lonely'), b('forward', 3)]));
  assert.ok(Math.abs(unused.value - (1 - COSTS.unusedBlock)) < 1e-9, `${unused.value}`);
  assert.ok(texts(unused).includes('Your block lonely is never used. Use it, or take it away.'));
  const loose = eleganceOf(project(base, [b('forward', 30), b('left', 5)]));
  assert.ok(Math.abs(loose.value - (1 - COSTS.looseStack)) < 1e-9);
  assert.ok(texts(loose).some((t) => /does not start with a start block, so Run does not run it/.test(t)));
  const stop = eleganceOf(project([b('start'), b('forward', 10), b('stop'), b('left', 20), b('back', 5)]));
  assert.ok(Math.abs(stop.value - (1 - COSTS.afterStop * 2)) < 1e-9, `${stop.value}`);
  assert.ok(texts(stop).some((t) => /2 blocks come after a stop/.test(t)));
  const empty = eleganceOf(project([b('start'), b('forward', 10), b('left', 20), rep(3, [])]));
  assert.ok(Math.abs(empty.value - (1 - COSTS.emptyClamp)) < 1e-9);
  assert.ok(texts(empty).includes('repeat has nothing inside it.'));
});

test('nesting more than four deep costs, four is fine', () => {
  const nest = (depth) => { let inner = [b('forward', 5)]; for (let i = 0; i < depth; i += 1) inner = [rep(i + 2, inner)]; return project([b('start'), b('left', 13), b('back', 21), ...inner]); };
  assert.equal(eleganceOf(nest(4)).value, 1);
  const deep = eleganceOf(nest(6));
  assert.ok(Math.abs(deep.value - (1 - COSTS.deep * 2)) < 1e-9, `${deep.value}`);
  assert.ok(texts(deep).some((t) => /go 6 deep/.test(t)));
});

test('with too few blocks there is nothing to judge: the value is nothing, and the reason says what to do', () => {
  for (const p of [project(), project([b('start')]), project([b('start'), b('forward', 10), b('left', 5)].slice(0, 2))]) {
    const r = eleganceOf(p);
    assert.equal(r.value, null);
    assert.match(texts(r)[0], /Put a few blocks in/);
  }
  assert.equal(MIN_BLOCKS, 3);
  assert.notEqual(eleganceOf(project([b('start'), b('forward', 10), b('left', 5), b('back', 2)])).value, null);
  for (const junk of [null, undefined, 5, {}, { stacks: 5 }, { stacks: [null, { blocks: 'no' }, { blocks: [null, 3, { op: 'repeat', body: 'x' }] }] }]) assert.doesNotThrow(() => eleganceOf(junk));
});

test('elegance is always between 0 and 1, notes do not count, and the worst mess is still above 0', () => {
  const messy = project([b('start'), ...Array.from({ length: 40 }, () => b('forward', 7)), { op: 'note', args: [], text: 'hi' }], [hat('x'), b('left', 9)], [b('forward', 3), b('left', 2)], [b('start'), rep(2, [])]);
  const r = eleganceOf(messy);
  assert.ok(r.value >= 0 && r.value <= 1);
  assert.ok(r.value < 0.3, `${r.value}`);
  assert.equal(eleganceOf(project([b('start'), { op: 'note', args: [], text: 'hello' }, b('forward', 10), b('left', 5), b('back', 2)])).blocks, 3);
});

// ---- Efficiency -----------------------------------------------------------------------------------------------

function runOf(draw, steps, extra = {}) {
  const t = new Turtle();
  t.resetWalked();
  draw(t);
  return drawingStats({ ops: t.ops, walked: t.walked, steps, ...extra });
}

test('the turtle counts how far it walks with the pen down and with it up', () => {
  const t = new Turtle();
  t.forward(100);
  t.setPenUp();
  t.forward(50);
  t.arc(90, 40);
  t.setPenDown();
  t.arc(180, 10);
  assert.ok(Math.abs(t.walked.down - (100 + Math.PI * 10)) < 1e-6, `${t.walked.down}`);
  assert.ok(Math.abs(t.walked.up - (50 + (Math.PI / 2) * 40)) < 1e-6, `${t.walked.up}`);
  t.resetWalked();
  assert.deepEqual(t.walked, { up: 0, down: 0 });
  t.place(500, 500);
  assert.deepEqual(t.walked, { up: 0, down: 0 }, 'dragging the turtle is not walking');
});

test('a neat square is 1.0 for efficiency, and says that nothing was drawn over and the pen was down', () => {
  const r = efficiencyOf(runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(100); t.right(90); } }, 9));
  assert.equal(r.value, 1);
  assert.ok(r.reasons.every((x) => x.kind === 'good'));
  assert.ok(r.reasons.map((x) => x.text).includes('No line is drawn over another one.'));
  const star = efficiencyOf(runOf((t) => { for (let i = 0; i < 5; i += 1) { t.forward(150); t.right(144); } }, 11));
  assert.equal(star.value, 1, 'lines that cross are not lines drawn over each other');
});

test('going back over a line costs: half the lines drawn over again is about 0.64, and the reason says how much', () => {
  const r = efficiencyOf(runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(100); t.back(100); t.right(90); } }, 16));
  assert.ok(r.value > 0.55 && r.value < 0.7, `${r.value}`);
  assert.match(r.reasons[0].text, /^\d+% of the lines are drawn on top of lines that were already there/);
  assert.equal(r.reasons[0].kind, 'tip');
});

test('a circle in 360 tiny steps is less efficient than one arc block, and the reason names the arc block', () => {
  const tiny = efficiencyOf(runOf((t) => { for (let i = 0; i < 360; i += 1) { t.forward(1); t.right(1); } }, 721));
  const arc = efficiencyOf(runOf((t) => t.arc(360, 60), 2));
  assert.equal(arc.value, 1);
  assert.ok(tiny.value < 0.9 && tiny.value > 0.6, `${tiny.value}`);
  assert.ok(tiny.reasons.some((x) => /An arc block draws a curve in one block/.test(x.text)));
});

test('walking with the pen up is let off a little and then costs, and the reason says how far', () => {
  const near = efficiencyOf(runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(100); t.right(90); } t.setPenUp(); t.forward(20); }, 12));
  assert.equal(near.value, 1, 'a short hop is fine');
  const far = efficiencyOf(runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(40); t.right(90); } t.setPenUp(); t.forward(400); t.setPenDown(); for (let i = 0; i < 4; i += 1) { t.forward(40); t.right(90); } }, 20));
  assert.ok(far.value < 0.85 && far.value > 0.7, `${far.value}`);
  assert.ok(far.reasons[0].text.startsWith('The turtle walked 400 steps with the pen up'));
});

test('running tens of thousands of steps costs, and a few thousand do not', () => {
  const draw = (t) => { for (let i = 0; i < 40; i += 1) { t.forward(5); t.right(9); } };
  assert.equal(efficiencyOf(runOf(draw, LIMITS.stepsFree)).value, 1);
  const many = efficiencyOf(runOf(draw, 50000));
  assert.ok(many.value < 0.8 && many.value > 0.6, `${many.value}`);
  assert.ok(many.reasons[0].text.includes('50,000 steps'));
  assert.ok(efficiencyOf(runOf(draw, 10 ** 9)).value >= 1 - LIMITS.stepsMost - 1e-9, 'the cost has a limit');
});

test('with words in the program the lines are not judged (they are many short lines, some doubled on purpose), only the walking and the steps', () => {
  const words = (t) => { for (let i = 0; i < 200; i += 1) { t.forward(1); t.back(1); } };
  assert.ok(efficiencyOf(runOf(words, 400)).value < 1);
  const withWords = efficiencyOf(runOf(words, 400, { hasWrite: true }));
  assert.equal(withWords.value, 1);
  assert.ok(withWords.reasons.some((x) => /Words are drawn as many short lines/.test(x.text)));
});

test('a run that drew nothing, or has not happened, has no efficiency, and says why', () => {
  const none = efficiencyOf(runOf((t) => t.right(90), 1));
  assert.equal(none.value, null);
  assert.match(none.reasons[0].text, /did not draw anything/);
  const before = efficiencyOf(null);
  assert.equal(before.value, null);
  assert.match(before.reasons[0].text, /Run your program/);
  assert.equal(efficiencyOf(runOf((t) => t.forward(5), 1)).value, null, 'hardly anything drawn');
  // A fill counts as something drawn.
  assert.notEqual(efficiencyOf({ ...runOf((t) => t.forward(5), 1), filled: true }).value, null);
});

test('a very long picture is looked at less finely but still finishes quickly, and a truncated one is not judged for overlap', () => {
  const started = Date.now();
  const big = runOf((t) => { for (let i = 0; i < 4000; i += 1) { t.forward(300); t.right(91); } }, 8001);
  assert.ok(Date.now() - started < 3000, `${Date.now() - started} ms`);
  assert.ok(efficiencyOf(big).value !== null);
  const cut = runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(100); t.back(100); t.right(90); } }, 16, { truncated: true });
  assert.equal(efficiencyOf(cut).value, 1, 'some lines are missing, so what is left is not compared');
});

// ---- All three ------------------------------------------------------------------------------------------------

test('complexity on a curve: more points is more, never quite 1.0, and 80 points is about 0.63', () => {
  assert.equal(complexity01(0), 0);
  assert.equal(complexity01(-5), 0);
  assert.ok(Math.abs(complexity01(COMPLEXITY_SCALE) - (1 - 1 / Math.E)) < 1e-12);
  let last = -1;
  for (const points of [0, 5, 15, 40, 80, 140, 300, 1000]) {
    const v = complexity01(points);
    assert.ok(v > last && v < 1 + 1e-12, `${points}: ${v}`);
    last = v;
  }
  assert.ok(complexity01(44) > 0.4 && complexity01(44) < 0.45, 'a program of 44 points is about 0.4');
});

test('values are shown to one decimal place, and nothing is a question mark', () => {
  assert.equal(tenths(0), '0.0');
  assert.equal(tenths(1), '1.0');
  assert.equal(tenths(0.734), '0.7');
  assert.equal(tenths(0.75), '0.8');
  assert.equal(tenths(0.04), '0.0');
  assert.equal(tenths(null), '?');
  assert.equal(tenths(undefined), '?');
});

test('assess gives the block count, all three values and their reasons, and efficiency waits for a run', () => {
  const p = project([b('start'), b('clean'), b('store1', 0), rep(10, [b('store1', b('add', b('box1'), 6)), b('forward', b('box1')), b('right', 60)])]);
  const before = assess({ project: p });
  assert.equal(before.blocks, scoreProject(p).parts.find((x) => x.id === 'blocks').count);
  assert.ok(before.blocks >= 8);
  assert.ok(before.complexity.value > 0.5, `${before.complexity.value}`);
  assert.equal(before.complexity.points, scoreProject(p).score);
  assert.equal(before.complexity.parts.length, 8);
  assert.ok(before.elegance.value !== null && before.elegance.value > 0.9);
  assert.equal(before.efficiency.value, null);
  const after = assess({ project: p, run: runOf((t) => { for (let i = 0; i < 10; i += 1) { t.forward(6 * (i + 1)); t.right(60); } }, 60) });
  assert.ok(after.efficiency.value !== null && after.efficiency.value > 0.9, `${after.efficiency.value}`);
  assert.equal(assess({ project: project() }).blocks, 0);
  assert.equal(assess({ project: project() }).complexity.value, 0);
  assert.equal(assess({ project: null }).blocks, 0);
});

test('every sentence is plain: no dashes, and nothing about a teacher, class or grade', () => {
  const programs = [project(), project([b('start'), b('clean'), rep(4, [b('forward', 100), b('right', 90)])]),
    project([b('start'), ...Array.from({ length: 6 }, () => b('forward', 12))], [hat('lonely'), b('left', 3)], [b('forward', 3), b('left', 2)])];
  const runs = [null, runOf((t) => { for (let i = 0; i < 4; i += 1) { t.forward(100); t.back(100); t.right(90); } }, 9000), runOf((t) => t.right(1), 1)];
  for (const p of programs) {
    for (const run of runs) {
      const r = assess({ project: p, run });
      const words = [...r.elegance.reasons, ...r.efficiency.reasons, ...r.complexity.parts.map((x) => ({ text: `${x.label} ${x.detail}` })), { text: r.complexity.tip }].map((x) => x.text).join(' ');
      assert.ok(!/[–—]/.test(words), words);
      assert.ok(!/teacher|class|grade|student/i.test(words), words);
    }
  }
});

test('the sentence about the scale is worked out from the curve: it names this program\'s points and number, then what 80, 130 and 200 points come to, and that 1.0 is out of reach', () => {
  const r = assess({ project: { app: 'turtlelab', version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }] }] }] } });
  const line = scaleLine(r.complexity);
  assert.equal(line, `${r.complexity.points} points is ${tenths(r.complexity.value)}. On this scale 80 points is 0.6, 130 is 0.8 and 200 is 0.9. It never quite gets to 1.0.`);
  assert.ok(!/[\u2013\u2014]/.test(line));
  // The example numbers are the curve's own, not typed in by hand.
  assert.equal(tenths(complexity01(80)), '0.6');
  assert.equal(tenths(complexity01(130)), '0.8');
  assert.equal(tenths(complexity01(200)), '0.9');
});

// ---- Click handlers ---------------------------------------------------------------------------------------------

test('a click handler is a stack of its own, not a stray one, and its hat is not a plain block', () => {
  const body = [b('penup'), b('setxy', { op: 'mousex', args: [] }, { op: 'mousey', args: [] }), b('pendown'), rep(4, [b('forward', 20), b('right', 90)])];
  const without = project([b('start'), b('clean')]);
  const withHandler = project([b('start'), b('clean')], [b('onclick'), ...body]);
  // not left over: a command stack with no Start above it is a tip, but a click handler is meant to be there
  const stray = eleganceOf(project([b('start'), b('clean'), b('forward', 5)], [b('forward', 9), b('right', 90)]));
  const handled = eleganceOf(project([b('start'), b('clean'), b('forward', 5)], [b('onclick'), b('forward', 9), b('right', 90)]));
  assert.ok(stray.value < 1 && texts(stray).some((t) => /not under a Start|Start block/i.test(t)), `a loose stack is a tip: ${texts(stray)}`);
  assert.equal(handled.value, 1, `a handler is not: ${texts(handled)}`);
  // the hat is not counted: the handler is worth exactly the blocks inside it, as if they had no hat
  const blocksIn = (page) => scoreProject(page).parts.find((part) => part.id === 'blocks').count;
  assert.equal(blocksIn(withHandler), blocksIn(project([b('start'), b('clean')], body)), 'the hat adds nothing to the count of blocks');
  assert.ok(blocksIn(withHandler) > blocksIn(without), 'but what is inside it does');
});
