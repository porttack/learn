// Tests for the Logo that TurtleLab sends to JSLogo (core/logo.js with `jslogo: true`). JSLogo's own interpreter (the copy in
// ../../logo) runs the Logo, with a turtle that records what it is told, and what it draws is compared with what
// TurtleLab's blocks draw. Skipped if the copy of JSLogo is not there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { SAMPLES, sampleStacks } from '../js/ui/samples.js';
import { toLogo, jsLogoAddress } from '../js/core/logo.js';
import { compileLogo } from '../js/core/logo-compile.js';
import { JSLOGO_WORDS } from '../js/core/logo-jslogo-words.js';
import { definitionsOf } from '../js/core/definitions.js';
import { findRunStack, walkBlocks } from '../js/core/project.js';
import { runBlocks, createContext, Ask } from '../js/core/interpreter.js';
import { Turtle } from '../js/core/turtle.js';
import { boundsOfOps, visibleOps } from '../js/core/fit.js';
import { runJsLogo, jsLogoPrimitives, hasJsLogo } from './jslogo-harness.mjs';

const needsJsLogo = { skip: hasJsLogo ? false : 'the copy of JSLogo in ../logo is not there' };
const b = (op, ...args) => ({ op, args });
const rep = (count, ...body) => ({ op: 'repeat', args: [count], body });
const call = (name, params, ...args) => ({ op: 'call', name, params, args });

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

/** Run a project's blocks in TurtleLab. */
function runHere(project, answers = []) {
  const turtle = new Turtle();
  const printed = [];
  const { stack } = findRunStack(project);
  const steps = runBlocks(stack.blocks, createContext({ turtle, random: seeded(3), print: (line) => printed.push(line), definitions: definitionsOf(project).map }));
  let reply; // what an ask block is told (a question is answered from `answers`, in order)
  for (;;) {
    const { value, done } = steps.next(reply);
    reply = value instanceof Ask ? answers.shift() : undefined;
    if (done) break;
  }
  return { turtle, printed };
}

const hexOf = ([r, g, b2]) => `#${[r, g, b2].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

/** What TurtleLab drew, as { style runs, length, box, fills }, from what is still visible on the paper. */
function summaryHere(turtle) {
  const seen = visibleOps(turtle.ops).ops;
  const drawn = seen.filter((op) => (op.type === 'line' || op.type === 'arc') && op.size > 0);
  const length = drawn.reduce((sum, op) => sum + (op.type === 'line' ? Math.hypot(op.x2 - op.x1, op.y2 - op.y1) : op.r * Math.abs(op.sweep) * (Math.PI / 180)), 0);
  return {
    styles: runsOf(drawn.map((op) => `${hexOf(op.color)} ${op.size}`)),
    length,
    box: boundsOfOps(drawn.map((op) => ({ ...op, size: 0 }))),
    fills: seen.filter((op) => op.type === 'fill').length,
  };
}

/** The same, from what the recording turtle was told. */
function summaryThere(turtle) {
  const drawn = turtle.segments.filter((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > 1e-9);
  const xs = drawn.flatMap((s) => [s.x1, s.x2]);
  const ys = drawn.flatMap((s) => [s.y1, s.y2]);
  return {
    styles: runsOf(drawn.map((s) => `${s.color} ${s.width}`)),
    length: drawn.reduce((sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0),
    box: drawn.length ? { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) } : null,
    fills: turtle.fills.length,
  };
}

/** Consecutive repeats squeezed into one: [a a b b a] becomes [a b a]. */
const runsOf = (list) => list.filter((item, i) => i === 0 || item !== list[i - 1]);

const near = (a, c, tolerance, message) => assert.ok(Math.abs(a - c) <= tolerance, `${message}: ${a} and ${c} differ by more than ${tolerance}`);
/** Does any color block get its numbers worked out (so JSLogo's 0 to 99 scale makes them a little different)? */
const hasWorkedOutColor = (stacks) => {
  let found = false;
  for (const stack of stacks) walkBlocks(stack.blocks, (block) => { if ((block.op === 'setcolor' || block.op === 'fillscreen') && block.args.some((arg) => typeof arg === 'object' && arg !== null)) found = true; });
  return found;
};
const usesChance = (sample) => /random|oneof/.test(JSON.stringify(sample.program) + JSON.stringify(sample.defines ?? []));
/** The write block's script letters are lines in TurtleLab but only text in JSLogo (label), so the pictures differ on purpose. */
const usesWrite = (sample) => JSON.stringify([sample.program, sample.defines ?? []]).includes('"op":"write"'); // (a block of the sample's own can write too)

// ---- The list of JSLogo's words ---------------------------------------------------------------------------

test('the list of words JSLogo already has is the list its interpreter really has', needsJsLogo, () => {
  const real = jsLogoPrimitives().filter((name) => /^[a-z][a-z0-9_.?]*$/.test(name));
  assert.deepEqual([...JSLOGO_WORDS].sort(), real, 'JSLogo changed: make js/core/logo-jslogo-words.js again (see its header)');
});

// ---- Same drawing --------------------------------------------------------------------------------------------

test('every sample, written for JSLogo and run there, draws what TurtleLab draws (long and short words)', needsJsLogo, async () => {
  for (const sample of SAMPLES) {
    const project = { stacks: sampleStacks(sample) };
    const here = runHere(project, [...(sample.answers ?? [])]); // (a sample that asks is given its answer, here and in JSLogo's own question box)
    for (const short of [false, true]) {
      const code = toLogo(project, { jslogo: true, short });
      const label = `${sample.id} ${short ? 'short' : 'long'}`;
      const there = await runJsLogo(code, { answers: (sample.answers ?? []).map(String) });
      assert.equal(there.error, null, `${label}: JSLogo said "${there.error}" for\n${code}`);
      assert.equal(there.turtle.arcs.length, 0, `${label}: the arc command is never sent, since JSLogo's draws something else`);
      if (usesChance(sample) || usesWrite(sample) || (sample.handlers ?? []).length > 0) continue; // chance is different in the two, script letters are text in JSLogo, and JSLogo has no mouse clicks (the handlers are left out): only "it ran" can be asked
      // Where the turtle ended.
      near(there.turtle.x, here.turtle.x, 1e-6, `${label}: x`);
      near(there.turtle.y, here.turtle.y, 1e-6, `${label}: y`);
      near(((there.turtle.heading - here.turtle.heading + 540) % 360) - 180, 0, 1e-6, `${label}: heading`);
      assert.equal(there.turtle.pendown, here.turtle.penDown, `${label}: pen up or down`);
      // What was drawn: the same colors and thicknesses in the same order, as far, in the same place, with the same fills.
      const a = summaryHere(here.turtle);
      const c = summaryThere(there.turtle);
      if (hasWorkedOutColor(project.stacks)) {
        // Colors that are worked out come through a scale of 0 to 99, so they are a little different: the thicknesses must still agree.
        assert.deepEqual(runsOf(c.styles.map((s) => s.split(' ').pop())), runsOf(a.styles.map((s) => s.split(' ').pop())), `${label}: thicknesses in order`);
      } else {
        assert.deepEqual(c.styles, a.styles, `${label}: colors and thicknesses in order`);
      }
      assert.equal(c.fills, a.fills, `${label}: filled shapes`);
      near(c.length, a.length, 0.002 * a.length + 1e-6, `${label}: how far it drew`);
      for (const side of ['minX', 'maxX', 'minY', 'maxY']) near(c.box[side], a.box[side], 0.002 * Math.max(...[a.box.maxX - a.box.minX, a.box.maxY - a.box.minY]) + 0.5, `${label}: ${side}`);
      // What was printed.
      assert.deepEqual(there.printed.map(Number), here.printed.map(Number), `${label}: printed`);
    }
  }
});

test('arc: the same curve, to the same end point and heading, for angles both ways, over a full turn, and for odd radii', needsJsLogo, async () => {
  for (const [angle, radius, heading] of [[90, 50, 0], [-90, 50, 30], [180, 26, 270], [-180, 60, 45], [37.5, 33.3, 100], [360, 40, 10], [450, 20, 0], [720, 15, 0], [1, 100, 0], [0, 50, 0], [90, 0, 0], [90, -50, 0], [-45, 200, 315]]) {
    const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('clean'), b('penup'), b('setxy', 10, 20), b('setheading', heading), b('pendown'), b('arc', angle, radius), b('forward', 10)] }] };
    const here = runHere(project);
    const code = toLogo(project, { jslogo: true });
    const there = await runJsLogo(code);
    const label = `arc ${angle} ${radius} from heading ${heading}`;
    assert.equal(there.error, null, `${label}: ${there.error}`);
    near(there.turtle.x, here.turtle.x, 1e-6, `${label}: x`);
    near(there.turtle.y, here.turtle.y, 1e-6, `${label}: y`);
    near(((there.turtle.heading - here.turtle.heading + 540) % 360) - 180, 0, 1e-6, `${label}: heading`);
    // The corners of the steps lie on the circle the arc is on (the middle of it is where the turtle turns).
    const turtleArc = here.turtle.ops.find((op) => op.type === 'arc');
    if (turtleArc && Math.abs(angle) >= 1) {
      const onIt = there.turtle.segments.slice(0, -1).filter((s) => Math.hypot(s.x1 - 10, s.y1 - 20) > 1e-6 || true);
      for (const s of onIt) near(Math.hypot(s.x2 - turtleArc.cx, s.y2 - turtleArc.cy), Math.abs(radius), 1e-6, `${label}: a corner of a step is on the circle`);
    }
  }
});

test('colors keep their exact numbers, and clean puts the pen back the way TurtleLab leaves it', needsJsLogo, async () => {
  const code = (blocks) => toLogo({ stacks: [{ x: 0, y: 0, blocks: [b('start'), ...blocks] }] }, { jslogo: true });
  let there = await runJsLogo(code([b('setcolor', 30, 80, 200), b('forward', 10), b('setcolor', 0, 0, 0), b('forward', 10), b('setcolor', 255, 128, 1), b('forward', 10), b('setcolor', 300, -5, 20.6), b('forward', 10)]));
  assert.equal(there.error, null);
  assert.deepEqual(there.turtle.segments.map((s) => s.color), ['#1e50c8', '#000000', '#ff8001', '#ff0015'], 'rounded and clamped, like the blocks');
  there = await runJsLogo(code([b('setcolor', 1, 2, 3), b('setpensize', 9), b('penup'), b('clean'), b('forward', 10)]));
  assert.deepEqual([there.error, there.turtle.pendown, there.turtle.penwidth, there.turtle.color, there.turtle.segments.length], [null, true, 5, '#ff0000', 1], 'clean: pen down, size 5, red, and it draws');
  there = await runJsLogo(code([b('forward', 10)]));
  assert.deepEqual([there.turtle.penwidth, there.turtle.color, there.turtle.segments[0].width], [5, '#ff0000', 5], 'a program that does not start with clean still starts with TurtleLab\'s pen');
  assert.equal(there.turtle.turtlemode, 'window', 'and does not wrap round the edges');
  there = await runJsLogo(code([b('fillscreen', 10, 20, 30), b('forward', 10)]));
  assert.equal(there.turtle.bgcolor, '#0a141e');
  // A color worked out comes through as a list scaled to JSLogo's 0 to 99, so it is close (within 3 of 255).
  there = await runJsLogo(code([b('store1', 100), b('setcolor', { op: 'box1' }, { op: 'multiply', args: [{ op: 'box1' }, 2] }, 250), b('forward', 10)]));
  assert.equal(there.error, null, there.error);
  const [r, g, bl] = [1, 3, 5].map((i) => parseInt(there.turtle.segments[0].color.slice(i, i + 2), 16));
  assert.ok(Math.abs(r - 100) <= 3 && Math.abs(g - 200) <= 3 && Math.abs(bl - 250) <= 3, `${r} ${g} ${bl}`);
});

test('the things written another way: mod, oneof, pensize, boxes that start at 0, wait, a stop at the top', needsJsLogo, async () => {
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('print', { op: 'mod', args: [-7, 3] }), b('print', { op: 'mod', args: [7, 3] }), b('setpensize', 7), b('print', { op: 'pensize' }), b('print', { op: 'box2' }), b('store3', 4), b('print', { op: 'box3' }), b('print', { op: 'oneof', args: [5, 5] }), b('print', { op: 'add', args: [{ op: 'random', args: [2, 2] }, 1] }), b('wait', 0.1), b('stop'), b('print', 99)] }] };
  const code = toLogo(project, { jslogo: true });
  assert.match(code, /^make "box2 0$/m);
  assert.match(code, /^make "box3 0$/m);
  assert.doesNotMatch(code, /^make "box1/m, 'only the boxes that are used');
  assert.match(code, /^bye$/m);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, there.error);
  assert.deepEqual(there.printed, ['2', '1', '7', '0', '4', '5', '3'], 'the blocks give 2, 1, 7, 0, 4, 5, 3 and then the stop ends it before 99');
  assert.match(code, /^to tlmod :a :b$/m);
  assert.deepEqual(there.printed, runHere(project).printed.map(String), 'and so do the blocks');
});

test('stop leaves only your own block, but at the top of a program it ends the program', needsJsLogo, async () => {
  const project = { stacks: [
    { x: 0, y: 0, blocks: [{ op: 'to', name: 'half', params: [] }, b('print', 1), b('stop'), b('print', 2)] },
    { x: 0, y: 1, blocks: [b('start'), call('half', []), b('print', 3), rep(5, b('print', 4), b('stop'))] },
  ] };
  const there = await runJsLogo(toLogo(project, { jslogo: true }));
  assert.deepEqual([there.error, there.printed], [null, ['1', '3', '4']]);
  assert.deepEqual(runHere(project).printed, ['1', '3', '4'], 'and that is what the blocks do');
});

test('fills: filled around what is drawn, in the color the pen had when the fill started; a start with no end is left out and says so', needsJsLogo, async () => {
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('setcolor', 10, 20, 30), b('startfill'), rep(3, b('forward', 50), b('right', 120)), b('endfill'), b('startfill'), b('forward', 5)] }] };
  const code = toLogo(project, { jslogo: true });
  assert.match(code, /^filled pencolor \[\n {2}repeat 3 \[\n {4}forward 50\n {4}right 120\n {2}\]\n\]$/m);
  assert.match(code, /Left out here, or shown another way: a startfill or endfill without its partner\./);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, there.error);
  assert.equal(there.turtle.fills.length, 1);
  assert.equal(there.turtle.fills[0].color, '#0a141e');
});

test('things JSLogo cannot do are left out or shown another way, and the program says which, in one comment', needsJsLogo, async () => {
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('speed', 4), { op: 'write', args: [40], text: 'Go [Cougars] |now|' }, b('print', { op: 'penred' })] }] };
  const code = toLogo(project, { jslogo: true });
  assert.match(code, /^; Left out here, or shown another way: setspeed, write \(shown with label\), penred\.$/m);
  assert.match(code, /^setlabelheight 57$/m);
  assert.match(code, /^label \[Go Cougars now\]$/m);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, there.error);
  assert.deepEqual(there.turtle.labels.map((l) => l.text), ['Go Cougars now']);
  // A program that needs none of that says nothing.
  assert.doesNotMatch(toLogo({ stacks: [{ x: 0, y: 0, blocks: [b('start'), b('forward', 5)] }] }, { jslogo: true }), /Left out/);
});

test('names of your own blocks never clash with JSLogo\'s words, and your own tlarc is not confused with the arc helper', needsJsLogo, async () => {
  const hat = (name, params, ...body) => ({ x: 0, y: 0, blocks: [{ op: 'to', name, params }, ...body] });
  const project = { stacks: [
    hat('item', [], b('forward', 7)),
    hat('pick', ['count'], b('forward', { op: 'input', name: 'count' })),
    hat('tlarc', [], b('arc', 90, 30)),
    hat('first', [], b('left', 10)),
    { x: 0, y: 9, blocks: [b('start'), call('item', []), call('pick', ['count'], 5), call('tlarc', []), call('first', [])] },
  ] };
  const code = toLogo(project, { jslogo: true });
  for (const name of ['item_', 'pick_', 'first_', 'tlarc2']) assert.match(code, new RegExp(`^to ${name}\\b`, 'm'), name);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, there.error);
  const here = runHere(project);
  near(there.turtle.x, here.turtle.x, 1e-6, 'x');
  near(there.turtle.y, here.turtle.y, 1e-6, 'y');
});

test('Logo you changed in the box (TurtleLab\'s own Logo) goes through the blocks and comes out as Logo JSLogo runs', needsJsLogo, async () => {
  // What the button does with a box that has been typed in: read it, then write it again for JSLogo.
  const typed = 'cs\nsetpc [200 30 45]\nto flower :size\n  repeat 6 [ arc 60 :size rt 60 ]\nend\nmake "n 3\nrepeat :n [ flower 40 rt 120 ]\nprint :n % 2\nsetxy 10 -5 ; not a subtraction';
  const compiled = compileLogo(typed);
  assert.equal(compiled.ok, true, compiled.error);
  const code = toLogo({ stacks: compiled.stacks }, { jslogo: true, boxNames: compiled.boxNames });
  assert.deepEqual(compiled.boxNames, ['n'], 'the variable keeps its name');
  assert.match(code, /^make "n 0$/m);
  assert.match(code, /^make "n 3$/m);
  assert.match(code, /^repeat :n \[$/m);
  assert.doesNotMatch(code, /box1/);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, `${there.error}\n${code}`);
  const here = runHere({ stacks: compiled.stacks });
  near(there.turtle.x, here.turtle.x, 1e-6, 'x');
  near(there.turtle.y, here.turtle.y, 1e-6, 'y');
  assert.deepEqual(there.printed.map(Number), here.printed.map(Number));
  assert.deepEqual(summaryThere(there.turtle).styles, summaryHere(here.turtle).styles);
});

// ---- The address -----------------------------------------------------------------------------------------------

test('the address carries the program after the # exactly, underscores and all, the way JSLogo reads it', () => {
  // JSLogo's own reading, from its index.js: the text after the # with every underscore made a space, then decoded.
  const asJsLogoReadsIt = (address) => decodeURIComponent(address.slice(address.indexOf('#') + 1).replace(/_/g, ' '));
  for (const code of ['fd 100', 'to letter_A\n  fd 5\nend\nletter_A\n', 'setpc "#1e50c8\nprint "hello world', 'a_b__c % 100 & ? = \' " < > [x] (y)\n\n  indented', 'café → 100%', '#hash # in # it']) {
    const address = jsLogoAddress(code);
    assert.ok(address.startsWith('../logo/#'), address);
    assert.ok(!address.includes('_') && !address.slice(address.indexOf('#') + 1).includes(' '), 'no underscore or space is left as it is');
    assert.equal(asJsLogoReadsIt(address), code);
  }
  assert.equal(jsLogoAddress('fd 1', 'https://example.org/logo/'), 'https://example.org/logo/#fd%201');
});

// ---- The copy has to reach the published site ------------------------------------------------------------------

test('every file the JSLogo pages load from this site is there, and git does not ignore it (so a push publishes it)', needsJsLogo, (t) => {
  // This once failed in real life: the repo's .gitignore says `vendor/` (for Bundler), which quietly left out the editor
  // (logo/vendor/codemirror) from every commit, so the published page had no editor while it worked from the disk.
  // (--no-index: judge by the rules alone, not by whether the file happens to be in the index already.)
  const folder = new URL('../../logo/', import.meta.url);
  const probe = spawnSync('git', ['check-ignore', '-q', 'logo/index.html'], { cwd: new URL('../..', import.meta.url).pathname });
  if (probe.error || probe.status === 128) return t.skip('not inside a git checkout');
  for (const page of ['index.html', 'language.html', 'about-this-copy.html']) {
    const html = readFileSync(new URL(page, folder), 'utf8');
    const wanted = [...html.matchAll(/(?:src|href)=["']?([^"'\s>]+)/g)].map((m) => m[1]).filter((u) => !/^(?:[a-z]+:|\/\/|#|\.\.|\/)/i.test(u) && !u.startsWith('./'));
    for (const file of wanted.map((u) => u.split(/[?#]/)[0]).filter(Boolean)) {
      if (file.endsWith('/')) continue;
      assert.ok(existsSync(new URL(file, folder)), `${page} loads ${file}, which is missing`);
      const ignored = spawnSync('git', ['check-ignore', '--no-index', '-q', `logo/${file}`], { cwd: new URL('../..', import.meta.url).pathname });
      assert.equal(ignored.status, 1, `${page} loads ${file}, but git ignores it, so it would never be published`);
    }
  }
});

test('ask: written for JSLogo it is readword, and the number typed there draws what the blocks draw', needsJsLogo, async () => {
  const blocks = [b('start'), b('clean'), { op: 'ask', args: [], text: 'How many sides?' }, { op: 'repeat', args: [{ op: 'box1' }], body: [b('forward', 40), b('right', { op: 'divide', args: [360, { op: 'box1' }] })] }];
  const project = { stacks: [{ x: 0, y: 0, blocks }] };
  const code = toLogo(project, { jslogo: true });
  assert.match(code, /^make "box1 0$/m, 'box1 is made first');
  assert.match(code, /^make "box1 sum 0 \(readword \[How many sides\?\]\)$/m);
  for (const answer of [3, 5, 6]) {
    const there = await runJsLogo(code, { answers: [String(answer)] });
    assert.equal(there.error, null, `JSLogo said "${there.error}" for\n${code}`);
    assert.equal(there.turtle.segments.filter((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > 1e-9).length, answer, `an answer of ${answer} draws ${answer} sides there too`);
    const here = runHere(project, [answer]);
    near(there.turtle.x, here.turtle.x, 1e-6, `${answer}: x`);
    near(there.turtle.y, here.turtle.y, 1e-6, `${answer}: y`);
  }
});

test('click handlers: JSLogo has no mouse, so the handler is left out with a note, mouseX and mouseY are 0, and the rest runs', needsJsLogo, async () => {
  const project = { stacks: [
    { x: 0, y: 0, blocks: [b('start'), b('clean'), b('forward', { op: 'add', args: [40, { op: 'mousex' }] })] },
    { x: 300, y: 0, blocks: [{ op: 'onclick', args: [] }, b('forward', 99)] },
  ] };
  const code = toLogo(project, { jslogo: true });
  assert.ok(!/onclick/.test(code.split('\n').filter((line) => !line.startsWith(';')).join('\n')), 'no onclick in what is run');
  assert.match(code, /^; Left out here, or shown another way: .*onclick \(JSLogo has no mouse clicks\)/m);
  assert.match(code, /mousex and mousey \(shown as 0\)/);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, `JSLogo said "${there.error}" for\n${code}`);
  assert.equal(Math.round(there.turtle.segments.reduce((sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0)), 40, 'the program ran with mouseX as 0, and the handler did not');
});

test('and, or and not: written as (and a b), they join tests the way the blocks do, and the second half is skipped when the first settles it', needsJsLogo, async () => {
  const guard = b('greater', b('divide', 10, { op: 'box2' }), 2); // would be a divide by zero when box2 is 0
  const blocks = [
    b('start'), b('store1', 7),
    { op: 'if', args: [b('and', b('greater', { op: 'box1' }, 0), b('less', { op: 'box1' }, 10))], body: [b('print', 1)] },
    { op: 'if', args: [b('and', b('greater', { op: 'box1' }, 9), b('less', { op: 'box1' }, 10))], body: [b('print', 2)] },
    { op: 'if', args: [b('or', b('less', { op: 'box1' }, 0), b('equal', { op: 'box1' }, 7))], body: [b('print', 3)] },
    { op: 'if', args: [b('not', b('equal', { op: 'box1' }, 7))], body: [b('print', 4)] },
    { op: 'if', args: [b('not', b('or', b('less', { op: 'box1' }, 0), b('greater', { op: 'box1' }, 9)))], body: [b('print', 5)] },
    { op: 'if', args: [b('and', b('greater', { op: 'box2' }, 0), guard)], body: [b('print', 6)] },
    { op: 'if', args: [b('or', b('equal', { op: 'box2' }, 0), guard)], body: [b('print', 7)] },
  ];
  const project = { stacks: [{ x: 0, y: 0, blocks }] };
  const code = toLogo(project, { jslogo: true });
  assert.match(code, /\(and \(:box1 > 0\) \(:box1 < 10\)\)/);
  const there = await runJsLogo(code);
  assert.equal(there.error, null, `JSLogo said "${there.error}" for\n${code}`);
  assert.deepEqual(there.printed, ['1', '3', '5', '7'], 'what JSLogo prints');
  assert.deepEqual(there.printed, runHere(project).printed.map(String), 'and the blocks print the same');
});
