// Tests for the Python version of the blocks.
//
// Some check the text that comes out. The important ones RUN the Python (against a
// stand-in for the turtle module, test/python-runner.py) and the blocks (with
// TurtleLab's own interpreter) and check the turtle ends up in the same place, has
// drawn as far, and has printed the same. They are skipped if python3 is not installed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { toPython } from '../js/core/python.js';
import { findRunStack, handlersOf } from '../js/core/project.js';
import { definitionsOf } from '../js/core/definitions.js';
import { runBlocks, createContext, Ask } from '../js/core/interpreter.js';
import { Turtle } from '../js/core/turtle.js';
import { cleanKey, keyOf } from '../js/core/keys.js';
import { formatNumber } from '../js/core/format.js';
import { SAMPLES, sampleStacks, handlerCount } from '../js/ui/samples.js';

const RUNNER = fileURLToPath(new URL('./python-runner.py', import.meta.url));
const hasPython = spawnSync('python3', ['--version']).status === 0;
const needsPython = { skip: hasPython ? false : 'python3 is not installed' };

// ---- Small ways to build programs ----------------------------------------------------------------

const b = (op, ...args) => ({ op, args });
const rep = (n, ...body) => ({ op: 'repeat', args: [n], body });
const ifBlock = (cond, ...body) => ({ op: 'if', args: [cond], body });
const ifElse = (cond, body, elseBody) => ({ op: 'ifelse', args: [cond], body, elseBody });
const input = (name) => ({ op: 'input', name });
const call = (name, params, ...args) => ({ op: 'call', name, params, args });
const hat = (name, params, ...body) => ({ x: 0, y: 0, blocks: [{ op: 'to', name, params }, ...body] });
const program = (...blocks) => ({ x: 300, y: 0, blocks: [b('start'), ...blocks] });
const projectOf = (...stacks) => ({ stacks });

/** The lines of Python between the start of the program and the `try: done()` that ends it. */
function mainLines(project) {
  const lines = toPython(project).split('\n');
  const from = lines.indexOf('# Your program starts here');
  return lines.slice(from + 1, lines.lastIndexOf('try:'));
}

// ---- Running both and comparing ---------------------------------------------------------------------

function runPython(source, mode = 'run', answers = [], clicks = undefined, { keys = undefined, ticks = 0 } = {}) {
  // (keys are given as ids, and the stand-in turtle is pressed with Python's names for them)
  const pressed = keys?.map((id) => keyOf(id).python);
  const result = spawnSync('python3', ['-I', RUNNER], { input: JSON.stringify({ source, mode, answers, clicks, keys: pressed, ticks }), encoding: 'utf8' });
  assert.equal(result.status, 0, `python3 failed:\n${result.stderr}\n--- program ---\n${source}`);
  return JSON.parse(result.stdout);
}

/** Run the blocks in TurtleLab's interpreter. Heading is given the way Python counts it. */
function runBlocksHere(project, answers = [], clicks = [], { keys = [], ticks = 0 } = {}) {
  const turtle = new Turtle();
  const printed = [];
  const { map } = definitionsOf(project);
  const { stack } = findRunStack(project);
  const context = createContext({ turtle, definitions: map, print: (line) => printed.push(line), random: () => 0.5 });
  // Run some blocks, answering each ask block from `answers`, in order (as the page does when a person types).
  const drive = (blocks) => {
    const steps = runBlocks(blocks, context);
    let reply; // what an ask block is told
    for (;;) {
      const { value, done } = steps.next(reply);
      reply = value instanceof Ask ? Number(answers.shift()) : undefined;
      if (done) break;
    }
  };
  drive(stack ? stack.blocks : []);
  // then the clicks, as the page runs them: where the click was is set, and every handler runs, top to bottom
  for (const click of clicks) {
    context.mouse = { x: click[0], y: click[1] };
    for (const handler of handlersOf(project)) if (handler.op === 'onclick') drive(handler.blocks);
  }
  // then the keys (every handler for that key runs, in order), then each timer as many times as it goes off
  for (const key of keys) for (const handler of handlersOf(project)) if (handler.op === 'onkey' && cleanKey(handler.hat.key) === key) drive(handler.blocks);
  for (let tick = 0; tick < ticks; tick += 1) for (const handler of handlersOf(project)) if (handler.op === 'onstep') drive(handler.blocks);
  let length = 0;
  for (const op of turtle.ops) {
    if (op.type === 'line') length += Math.hypot(op.x2 - op.x1, op.y2 - op.y1);
    if (op.type === 'arc') length += op.r * Math.abs(op.sweep) * (Math.PI / 180);
  }
  return { x: turtle.x, y: turtle.y, heading: (((90 - turtle.heading) % 360) + 360) % 360, length, printed, color: [...turtle.color], size: turtle.penSize };
}

const turnBetween = (a, b2) => Math.abs((((a - b2) % 360) + 540) % 360 - 180);

/** Check that Python and the blocks agree about where the turtle ended up and how far it drew. */
function assertSame(project, label, { length = true, answers = [], clicks = undefined, keys = undefined, ticks = 0 } = {}) {
  const source = toPython(project);
  const python = runPython(source, 'run', answers, clicks, { keys, ticks });
  const here = runBlocksHere(project, [...answers], clicks ?? [], { keys: keys ?? [], ticks });
  const near = (p, q, tolerance = 1e-6) => Math.abs(p - q) <= tolerance;
  assert.ok(near(python.x, here.x), `${label}: x is ${python.x} in Python and ${here.x} in the blocks\n${source}`);
  assert.ok(near(python.y, here.y), `${label}: y is ${python.y} in Python and ${here.y} in the blocks\n${source}`);
  assert.ok(turnBetween(python.heading, here.heading) < 1e-6, `${label}: heading is ${python.heading} in Python and ${here.heading} in the blocks\n${source}`);
  if (length) assert.ok(near(python.length, here.length, 0.005 * here.length + 1e-6), `${label}: drew ${python.length} in Python and ${here.length} in the blocks`);
  assert.deepEqual(python.printed, here.printed.map(String), `${label}: printed`);
  // The pen too. (A program that picks colors by chance cannot be compared: its chance is not ours.)
  assert.equal(python.size, here.size, `${label}: pen size`);
  if (!source.includes('random.')) assert.deepEqual(python.color, here.color, `${label}: pen color`);
}

// ---- What comes out, block by block -------------------------------------------------------------------

test('an empty page gives a friendly comment, not a program', () => {
  assert.match(toPython({ stacks: [] }), /^# Drag some blocks onto the page/);
});

test('the turtle blocks become the turtle module\'s calls', () => {
  const lines = mainLines(
    projectOf(
      program(
        b('clean'), b('forward', 100), b('back', 20), b('left', 90), b('right', 45),
        b('setxy', 10, -20), b('penup'), b('pendown'), b('setpensize', 3),
        b('setcolor', 10, 20, 30), b('fillscreen', 1, 2, 3), b('startfill'), b('endfill'),
      ),
    ),
  );
  assert.deepEqual(lines, [
    'clean()', 'forward(100)', 'backward(20)', 'left(90)', 'right(45)', 'goto(10, -20)', 'penup()', 'pendown()',
    'pensize(3)', 'color(rgb(10, 20, 30))', 'bgcolor(rgb(1, 2, 3))', 'begin_fill()', 'end_fill()',
  ]);
});

test('clean becomes a small function, defined once at the top, and colors are made by a small helper', () => {
  const text = toPython(projectOf(program(b('clean'), b('clean'))));
  assert.equal(text.match(/def clean\(\):/g).length, 1);
  assert.match(text, /def rgb\(red, green, blue\):\n    return "#%02x%02x%02x" % \(channel\(red\), channel\(green\), channel\(blue\)\)/);
  assert.match(text, /def channel\(value\):\n    return max\(0, min\(255, int\(round\(value\)\)\)\)/);
  assert.doesNotMatch(text, /colormode|Screen/, 'EduBlocks has no colormode, and its Screen has none either');
  assert.match(text, /def clean\(\):\n    clear\(\)\n    penup\(\)\n    home\(\)\n    setheading\(90\)\n    pendown\(\)\n    color\(rgb\(255, 0, 0\)\)\n    pensize\(5\)/);
});

test('a program that does not start with clean is given TurtleLab\'s start: facing up, red pen, size 5', () => {
  const text = toPython(projectOf(program(b('forward', 10))));
  assert.match(text, /^def rgb\(red, green, blue\):$/m);
  assert.deepEqual(mainLines(projectOf(program(b('forward', 10)))), ['setheading(90)', 'color(rgb(255, 0, 0))', 'pensize(5)', 'forward(10)']);
});

test('colors are plain hex strings, and a program with no color in it has no color helper', () => {
  assert.doesNotMatch(toPython(projectOf(program(b('forward', 10), b('clean')))).replace(/def clean[\s\S]*?pensize\(5\)/, ''), /\bcolormode\b/);
  const none = projectOf(program(b('penup')));
  // a program that never starts with clean still gets the red start, so it does have the helper
  assert.match(toPython(none), /def rgb/);
});

test('a program that reads the pen color or size keeps track of them itself, because EduBlocks cannot be asked', () => {
  const reads = projectOf(program(b('clean'), b('setcolor', 1, 2, 3), b('setpensize', 4), b('forward', { op: 'penred' }), b('forward', { op: 'pensize' })));
  const text = toPython(reads);
  assert.match(text, /^pen_color = \[255, 0, 0\]$/m);
  assert.match(text, /def set_color\(red, green, blue\):\n    pen_color\[0\] = channel\(red\)\n    pen_color\[1\] = channel\(green\)\n    pen_color\[2\] = channel\(blue\)\n    color\(rgb\(red, green, blue\)\)/);
  assert.match(text, /^pen_size = 5$/m);
  assert.match(text, /def set_pensize\(size\):\n    global pen_size\n    pen_size = size\n    pensize\(size\)/);
  assert.deepEqual(mainLines(reads).slice(1), ['set_color(1, 2, 3)', 'set_pensize(4)', 'forward(pen_color[0])', 'forward(pen_size)']);
  assert.match(text, /def clean\(\):[\s\S]*    set_color\(255, 0, 0\)\n    set_pensize\(5\)/, 'clean goes through them too');
  const plain = toPython(projectOf(program(b('clean'), b('setcolor', 1, 2, 3), b('setpensize', 4))));
  assert.doesNotMatch(plain, /pen_color|pen_size|set_color|set_pensize/, 'and a program that does not read them has none of it');
  assert.doesNotMatch(plain, /pencolor|pensize\(\)/, 'the Python never asks the turtle for its pen');
});

test('the program ends by keeping the window open, unless done() does not exist, which is allowed', () => {
  const text = toPython(projectOf(program(b('clean'), b('forward', 1))));
  assert.match(text, /\ntry:\n    done\(\)  # keeps the turtle window open when this is run as a file\nexcept NameError:\n    pass  # EduBlocks has no done\(\), and does not need one\n$/);
});

test('headings are turned around: TurtleLab counts clockwise from up, Python counter-clockwise from east', () => {
  assert.deepEqual(mainLines(projectOf(program(b('clean'), b('setheading', 30)))), ['clean()', 'setheading(60)']);
  const lines = mainLines(projectOf(program(b('clean'), b('setheading', op('add', 10, 20)), b('store1', { op: 'heading' }))));
  assert.deepEqual(lines.slice(1), ['setheading(90 - (10 + 20))', 'box1 = (90 - heading()) % 360']);
});

function op(name, ...args) {
  return { op: name, args };
}

test('arcs: a positive angle curves right, which is a negative radius in Python', () => {
  assert.deepEqual(mainLines(projectOf(program(b('clean'), b('arc', 90, 100), b('arc', -45, 30)))).slice(1), ['circle(-100, 90)', 'circle(30, 45)']);
  const lines = mainLines(projectOf(program(b('clean'), b('arc', { op: 'box1' }, op('add', 10, 20)))));
  assert.equal(lines[1], 'circle(-(10 + 20) if box1 >= 0 else 10 + 20, abs(box1))');
});

test('the readers and the math blocks become expressions, with parentheses only where they are needed', () => {
  const show = (arg) => mainLines(projectOf(program(b('clean'), b('forward', arg))))[1];
  assert.equal(show(op('multiply', op('add', 2, 3), 4)), 'forward((2 + 3) * 4)');
  assert.equal(show(op('add', 2, op('multiply', 3, 4))), 'forward(2 + 3 * 4)');
  assert.equal(show(op('subtract', 10, op('subtract', 3, 2))), 'forward(10 - (3 - 2))');
  assert.equal(show(op('subtract', op('subtract', 10, 3), 2)), 'forward(10 - 3 - 2)');
  assert.equal(show(op('divide', 100, op('multiply', 5, 2))), 'forward(100 / (5 * 2))');
  assert.equal(show(op('multiply', 2, op('divide', 10, 4))), 'forward(2 * (10 / 4))');
  assert.equal(show(op('mod', op('add', 7, 1), 3)), 'forward((7 + 1) % 3)');
  assert.equal(show(op('add', 5, -2)), 'forward(5 + (-2))');
  assert.equal(show(op('multiply', -3, 2)), 'forward(-3 * 2)');
  assert.equal(show(op('paren', op('add', 1, 2))), 'forward((1 + 2))', 'a paren block the student wrote stays');
  assert.equal(show({ op: 'x' }), 'forward(xcor())');
  assert.equal(show({ op: 'heading' }), 'forward((90 - heading()) % 360)');
  assert.equal(show({ op: 'penred' }), 'forward(pen_color[0])');
  assert.equal(show({ op: 'pensize' }), 'forward(pen_size)');
  assert.equal(show(op('random', 1, 6)), 'forward(random.randint(1, 6))');
  assert.equal(show(op('random', 1, 2.5)), 'forward(random.uniform(1, 2.5))');
  assert.equal(show(op('oneof', 3, 4)), 'forward(random.choice([3, 4]))');
  assert.match(toPython(projectOf(program(b('forward', op('random', 1, 6))))), /^import random$/m);
});

test('yes-or-no blocks become comparisons, and if and if else become if and else', () => {
  const lines = mainLines(
    projectOf(program(b('clean'), ifElse(op('less', { op: 'box1' }, 5), [b('forward', 1)], [b('back', 1)]), ifBlock(op('equal', 1, 1), b('stop')))),
  );
  assert.deepEqual(lines.slice(1), ['if box1 < 5:', '    forward(1)', 'else:', '    backward(1)', 'if 1 == 1:', '    raise SystemExit']);
});

test('loops: repeat is for/range, floors a number, and forever is while True', () => {
  assert.deepEqual(mainLines(projectOf(program(b('clean'), rep(4, b('forward', 1))))).slice(1), ['for _ in range(4):', '    forward(1)']);
  assert.deepEqual(mainLines(projectOf(program(b('clean'), rep(2.9, b('forward', 1))))).slice(1), ['for _ in range(2):', '    forward(1)'], 'TurtleLab uses the whole laps');
  assert.deepEqual(mainLines(projectOf(program(b('clean'), rep({ op: 'box1' }, b('forward', 1))))).slice(1), ['for _ in range(int(box1)):', '    forward(1)']);
  assert.deepEqual(mainLines(projectOf(program(b('clean'), { op: 'forever', args: [], body: [] })))[1], 'while True:');
  assert.deepEqual(mainLines(projectOf(program(b('clean'), rep(3))))[2], '    pass', 'an empty loop is pass');
});

test('boxes are variables, set to 0 first, and a block of your own that changes one says global', () => {
  const text = toPython(
    projectOf(hat('bump', [], b('store2', op('add', { op: 'box2' }, 1))), program(b('clean'), b('store1', 5), call('bump', []))),
  );
  assert.match(text, /^box1 = 0\nbox2 = 0$/m, 'only the boxes that are used');
  assert.doesNotMatch(text, /box3/);
  assert.match(text, /def bump\(\):\n    global box2\n    box2 = box2 \+ 1/);
});

test('wait is time.sleep in seconds, and speed becomes Python\'s speed', () => {
  const text = toPython(projectOf(program(b('clean'), b('wait', 10), b('wait', 5), b('speed', 1), b('speed', 4), b('speed', 99), b('speed', op('add', 1, 1)))));
  assert.match(text, /^import time$/m);
  assert.deepEqual(mainLines(projectOf(program(b('clean'), b('wait', 10), b('wait', 5), b('speed', 1), b('speed', 4), b('speed', 99), b('speed', op('add', 1, 1))))).slice(1), [
    'time.sleep(1)', 'time.sleep(0.5)', 'speed(1)  # slow', 'speed(0)  # instant', 'speed(0)  # instant', '# speed block: 1 + 1 (1 is slow, 4 is instant)',
  ]);
});

test('blocks you make are functions, inputs are parameters, and stop leaves the function with return', () => {
  const text = toPython(
    projectOf(
      hat('square', ['size'], rep(4, b('forward', input('size')), b('right', 90)), { op: 'stop', args: [] }),
      program(b('clean'), call('square', ['size'], 50)),
    ),
  );
  assert.match(text, /def square\(size\):\n    for _ in range\(4\):\n        forward\(size\)\n        right\(90\)\n    return\n/);
  assert.match(text, /^square\(50\)$/m);
  assert.match(text, /^try:\n    done\(\)/m);
});

test('names are made safe for Python: spaces, digits, Python\'s own words and the program\'s own names', () => {
  const names = ['my block', 'my_block', '2fast', 'class', 'forward', 'Square', 'café'];
  const text = toPython(projectOf(...names.map((name) => hat(name, [])), program(b('clean'), ...names.map((name) => call(name, [])))));
  for (const expected of ['def my_block():', 'def my_block2():', 'def _2fast():', 'def class_():', 'def forward_():', 'def Square():', 'def café():']) {
    assert.ok(text.includes(expected), `${expected}\n${text}`);
  }
  assert.match(text, /^forward_\(\)$/m, 'and the call uses the new name');
});

test('inputs that are named like boxes or functions get a different name inside', () => {
  const text = toPython(projectOf(hat('go', ['box1', 'go']), program(b('clean'), call('go', ['box1', 'go'], 1, 2))));
  assert.match(text, /def go\(box1_, go2\):/);
});

test('a call to a block that is not there is kept, with a note saying so', () => {
  assert.match(toPython(projectOf(program(b('clean'), call('ghost', [])))), /^ghost\(\)  # there is no block called ghost$/m);
});

test('an input used outside its block, and an empty socket, are kept so Python fails the way the blocks do', () => {
  assert.deepEqual(mainLines(projectOf(program(b('clean'), b('forward', input('size')), { op: 'forward', args: [null] }))).slice(1), ['forward(size)', 'forward(None)']);
});

test('sticky notes come first as comments, and stacks not connected to Start are counted', () => {
  const text = toPython(
    projectOf(
      { x: 0, y: 0, blocks: [{ op: 'note', text: 'Draws a square with four sides.' }] },
      program(b('clean'), b('forward', 1)),
      { x: 0, y: 500, blocks: [b('forward', 99)] },
      { x: 0, y: 600, blocks: [b('back', 99)] },
    ),
  );
  assert.match(text, /^# Draws a square with four sides\.$/m);
  assert.match(text, /# 2 other stacks of blocks are not connected to Start, so Run does not use them\./);
});

test('blocks with no Start still run the way Run would: the topmost loose stack is the program', () => {
  const text = toPython(projectOf({ x: 0, y: 0, blocks: [b('clean'), b('forward', 7)] }));
  assert.match(text, /^forward\(7\)$/m);
});

test('only blocks of your own: the functions are written, and a comment says what is missing', () => {
  const text = toPython(projectOf(hat('go', [], b('forward', 1))));
  assert.match(text, /def go\(\):\n    forward\(1\)/);
  assert.match(text, /# Nothing runs yet: add a Start block/);
  assert.doesNotMatch(text, /done\(\)/, 'no program, so no done()');
});

test('numbers are written the way the blocks show them, with no rounding noise', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.deepEqual(mainLines(projectOf(program(b('clean'), b('forward', 0.1 + 0.2), b('left', 7.2)))).slice(1), ['forward(0.3)', 'left(7.2)']);
});

// ---- The Python and the blocks do the same thing ------------------------------------------------------

test('it is valid Python for every sample', needsPython, () => {
  for (const sample of SAMPLES) {
    assert.doesNotThrow(() => runPython(toPython(projectOf(...sampleStacks(sample))), 'check'), sample.id);
  }
});

test('every sample ends in the same place, having drawn as far, in Python and in the blocks', needsPython, () => {
  for (const sample of SAMPLES) {
    // The wandering turtle turns by chance, and the games' squares are put down by chance, and Python's chance is not ours. They are only checked to be valid.
    if (sample.id === 'wandering-turtle' || sample.id === 'lesson-confetti-start' /* it ends at a random dot, so Python's chance and the blocks' cannot agree */ || (handlerCount(sample) > 0 && sample.concepts.includes('random'))) continue;
    // A write block draws letters that Python's turtle has no way to draw (see the test for it), so only where it ends is compared.
    // (a sample that waits for a person is given its answers and clicks, the same ones for Python and for the blocks)
    assertSame(projectOf(...sampleStacks(sample)), sample.id, { length: !sample.concepts.includes('write'), answers: sample.answers ?? [], clicks: sample.clicks, keys: sample.keys, ticks: sample.ticks ?? 0 });
  }
});

test('headings, arcs and the math agree', needsPython, () => {
  assertSame(projectOf(program(b('clean'), b('setheading', 30), b('forward', 100), b('store1', { op: 'heading' }), b('forward', { op: 'box1' }))), 'heading');
  assertSame(projectOf(program(b('clean'), b('arc', 90, 100), b('arc', -90, 50), b('arc', 270, 30), b('forward', 10))), 'arcs');
  assertSame(projectOf(program(b('clean'), b('store1', 70), b('arc', { op: 'box1' }, 40), b('store1', -70), b('arc', { op: 'box1' }, 40))), 'arcs by expression');
  assertSame(projectOf(program(b('clean'), b('forward', op('mod', -1, 5)), b('forward', op('mod', 17, 5)))), 'mod');
  assertSame(projectOf(program(b('clean'), b('forward', op('multiply', op('add', 2, 3), 4)), b('forward', op('subtract', 10, op('subtract', 3, 2))), b('forward', op('divide', 100, op('multiply', 5, 2))), b('forward', op('multiply', 2, op('divide', 10, 4))))), 'precedence');
  assertSame(projectOf(program(b('clean'), b('setxy', 30, 40), b('penup'), b('setxy', -10, 5), b('pendown'), b('setxy', 0, 0))), 'setxy');
  assertSame(projectOf(program(b('forward', 10), b('left', 45), b('forward', 10))), 'a program with no clean');
  assertSame(projectOf(program(b('forward', 50), b('clean'), b('forward', 10))), 'clean in the middle');
});

test('loops, ifs, boxes and stop agree', needsPython, () => {
  assertSame(projectOf(program(b('clean'), rep(2.9, b('forward', 10)), b('store1', 2.9), rep({ op: 'box1' }, b('forward', 1)))), 'repeat');
  assertSame(projectOf(program(b('clean'), b('store1', 0), rep(10, b('store1', op('add', { op: 'box1' }, 1)), ifElse(op('equal', op('mod', { op: 'box1' }, 2), 0), [b('forward', 3)], [b('right', 20), b('forward', 1)])))), 'if else and mod');
  assertSame(projectOf(program(b('clean'), b('forward', 5), { op: 'stop', args: [] }, b('forward', 500))), 'stop at the top');
  assertSame(projectOf(program(b('clean'), b('store1', 1), ifBlock(op('greater', { op: 'box1' }, 0), b('forward', 30)), ifBlock(op('less', { op: 'box1' }, 0), b('forward', 900)))), 'if');
  assertSame(projectOf(program(b('clean'), b('forward', op('random', 5, 5)), b('forward', op('oneof', 7, 7)), b('wait', 10), b('speed', 3), b('print', 42), b('print', op('add', 0.5, 0.25)))), 'random, wait, speed, print');
});

test('and, or and not agree, including the guard that keeps a divide from running, and read as Python', needsPython, () => {
  const guard = op('greater', op('divide', 10, { op: 'box2' }), 2); // a mistake when box2 is 0, which and and or must never reach
  const inside = op('and', op('greater', { op: 'box1' }, -50), op('less', { op: 'box1' }, 50));
  const project = projectOf(program(
    b('clean'), b('store1', 7),
    ifBlock(inside, b('forward', 10)),
    ifBlock(op('and', op('greater', { op: 'box1' }, 9), op('less', { op: 'box1' }, 10)), b('forward', 900)),
    ifBlock(op('or', op('less', { op: 'box1' }, 0), op('equal', { op: 'box1' }, 7)), b('right', 90), b('forward', 20)),
    ifBlock(op('not', op('equal', { op: 'box1' }, 7)), b('forward', 900)),
    ifBlock(op('not', op('or', op('less', { op: 'box1' }, 0), op('greater', { op: 'box1' }, 9))), b('forward', 5)),
    ifBlock(op('and', op('greater', { op: 'box2' }, 0), guard), b('forward', 900)),
    ifBlock(op('or', op('equal', { op: 'box2' }, 0), guard), b('forward', 3)),
  ));
  assertSame(project, 'and, or, not');
  const code = toPython(project);
  assert.match(code, /if box1 > -50 and box1 < 50:/);
  assert.match(code, /if box1 < 0 or box1 == 7:/);
  assert.match(code, /if not \(box1 == 7\):/);
  assert.match(code, /if not \(box1 < 0 or box1 > 9\):/);
  // an and inside an or (or the other way round) is written with brackets, so nobody has to remember which comes first
  const mixed = toPython(projectOf(program(b('clean'), ifBlock(op('or', op('and', op('less', 1, 2), op('less', 2, 3)), op('greater', 1, 5)), b('forward', 1)))));
  assert.match(mixed, /if \(1 < 2 and 2 < 3\) or 1 > 5:/);
});

test('blocks of your own agree: inputs, boxes, stop, calls inside calls, and recursion', needsPython, () => {
  const bump = hat('bump', [], b('store1', op('add', { op: 'box1' }, 10)));
  assertSame(projectOf(bump, program(b('clean'), call('bump', []), call('bump', []), b('forward', { op: 'box1' }))), 'a block that changes a box');
  const quit = hat('quit', [], b('forward', 1), rep(5, { op: 'stop', args: [] }, b('forward', 1000)), b('forward', 1000));
  assertSame(projectOf(quit, program(b('clean'), call('quit', []), b('forward', 10))), 'stop only leaves the block');
  const two = hat('go', ['d', 'turn'], b('forward', input('d')), b('right', input('turn')));
  const outer = hat('outer', ['n'], call('go', ['d', 'turn'], op('add', input('n'), 1), 30), call('go', ['d', 'turn'], input('n'), 60));
  assertSame(projectOf(two, outer, program(b('clean'), call('outer', ['n'], 10), call('go', ['d', 'turn'], 5, 5))), 'calls inside calls');
  const sum = hat('sum', ['n'], ifBlock(op('greater', input('n'), 0), b('forward', input('n')), call('sum', ['n'], op('subtract', input('n'), 1))));
  assertSame(projectOf(sum, program(b('clean'), call('sum', ['n'], 20))), 'recursion');
});

// ---- It runs in EduBlocks too --------------------------------------------------------------------
//
// edublocks.org runs Python with PyScript, and its turtle module is a small file of its own
// (https://app.edublocks.org/pyscript/turtle/turtle.py), with far less in it than Python's. It has no
// colormode (hence `AttributeError: 'Screen' object has no attribute 'colormode'`, the first thing a
// student saw), no done(), a color that must be one string or three WHOLE numbers, and no way to read the
// pen's color or size back. test/python-runner.py stands in for it, and is also where the list of its names
// lives. So the program is both RUN against it (every sample, and a program with every block in it) and
// checked name by name.

const BUILTINS_USED = new Set(['range', 'print', 'int', 'abs', 'round', 'max', 'min', 'SystemExit', 'NameError', 'input', 'float', 'ValueError', 'OverflowError']);
// Functions of modules the program imports. (Pyodide, which PyScript uses, is ordinary Python.)
const MODULE_FUNCTIONS = new Set(['random.randint', 'random.uniform', 'random.choice', 'time.sleep']);
const edublocksNames = () => new Set(runPython('', 'edublocks-names').names);

/** A program that uses every block there is, so every kind of line the generator writes is checked. */
function everything() {
  const cond = op('less', { op: 'box1' }, 5);
  return projectOf(
    hat('spin', ['n', 'm'], b('forward', input('n')), b('left', input('m')), { op: 'stop', args: [] }),
    { x: 600, y: 0, blocks: [b('onclick'), b('penup'), b('setxy', { op: 'mousex' }, { op: 'mousey' }), b('pendown'), b('forward', { op: 'mousey' })] },
    program(
      b('clean'), b('forward', 1), b('back', 1), b('left', 1), b('right', 1), b('arc', 90, 10), b('arc', { op: 'box1' }, 10), b('arc', -5, 5),
      b('setxy', 1, 2), b('setheading', 30), b('setheading', { op: 'box1' }), b('penup'), b('pendown'), b('setpensize', 2), b('setcolor', 1, 2, 3),
      b('fillscreen', 1, 2, 3), b('startfill'), b('endfill'),
      b('forward', { op: 'x' }), b('forward', { op: 'y' }), b('forward', { op: 'heading' }), b('forward', { op: 'pensize' }),
      b('forward', { op: 'penred' }), b('forward', { op: 'pengreen' }), b('forward', { op: 'penblue' }),
      b('forward', op('paren', op('add', op('subtract', 5, 1), op('multiply', 2, op('divide', 8, op('mod', 7, 3)))))),
      b('forward', op('random', 1, 6)), b('forward', op('random', 1, 2.5)), b('forward', op('oneof', 1, 2)),
      b('store1', 3), b('store2', 4), b('store3', 5), b('store4', 6), b('print', { op: 'box4' }), { op: 'ask', args: [], text: 'How many?' },
      rep(3, b('forward', 1)), rep({ op: 'box1' }, b('forward', 1)),
      ifBlock(cond, b('forward', 1)), ifElse(op('equal', 1, 1), [b('forward', 1)], [ifBlock(op('greater', 2, 1), b('back', 1))]),
      ifBlock(op('or', op('and', op('less', 1, 2), op('not', op('equal', { op: 'box1' }, 99))), op('greater', 1, 5)), b('forward', 2)),
      ifBlock(op('and', op('greater', { op: 'box2' }, 0), op('greater', op('divide', 10, { op: 'box2' }), 2)), b('forward', 3)),
      b('wait', 5), b('speed', 2), b('speed', 4), { op: 'setfont', args: [], font: 'bold' }, b('setcurve', 90), b('setcurve', { op: 'box1' }), call('spin', ['n', 'm'], 10, 20),
      { op: 'forever', args: [], body: [{ op: 'stop', args: [] }] },
    ),
  );
}

function namesUsedBy(project) {
  return runPython(toPython(project), 'names');
}

test('the Python never uses a name EduBlocks does not have: that is how colormode got through, twice', needsPython, () => {
  const names = edublocksNames();
  const projects = [everything(), ...SAMPLES.map((sample) => projectOf(...sampleStacks(sample)))];
  for (const project of projects) {
    const { free, attributes } = namesUsedBy(project);
    const unknown = free.filter((name) => !names.has(name) && !BUILTINS_USED.has(name));
    assert.deepEqual(unknown, [], `names EduBlocks does not provide: ${unknown.join(', ')}`);
    const badAttributes = attributes.filter((attribute) => !MODULE_FUNCTIONS.has(attribute));
    assert.deepEqual(badAttributes, [], `module functions that may not exist: ${badAttributes.join(', ')}`);
  }
});

test('that check is not blind: it catches colormode, done, exit and anything Python-only, but allows what is guarded', needsPython, () => {
  const names = edublocksNames();
  const unknownIn = (source) => runPython(source, 'names').free.filter((name) => !names.has(name) && !BUILTINS_USED.has(name));
  assert.deepEqual(unknownIn('from turtle import *\ncolormode(255)\nexit()\nforward(1)\nshowpoly()\ndone()'), ['colormode', 'done', 'exit', 'showpoly']);
  assert.deepEqual(unknownIn('from turtle import *\ntry:\n    done()\nexcept NameError:\n    pass\nforward(1)'), [], 'a guarded name is fine');
  assert.ok(unknownIn('from turtle import *\ntry:\n    done()\nexcept ValueError:\n    pass').includes('done'), 'but only if it is guarded against NameError');
  assert.ok(!names.has('colormode') && !names.has('done') && !names.has('mainloop'), 'the list really lacks them');
});

test('the stand-in really is as strict as EduBlocks: the old mistakes fail when run', needsPython, () => {
  const fails = (source) => spawnSync('python3', ['-I', RUNNER], { input: JSON.stringify({ source: `from turtle import *\n${source}`, mode: 'run' }), encoding: 'utf8' });
  assert.match(fails('colormode(255)').stderr, /NameError: name 'colormode' is not defined/);
  assert.match(fails('Screen().colormode(255)').stderr, /Error/, 'and so does Screen().colormode');
  assert.match(fails('done()').stderr, /NameError: name 'done'/);
  assert.match(fails('print(pencolor())').stderr, /IndexError/, 'the pen color cannot be read back');
  assert.match(fails('pensize()').stderr, /TypeError/, 'neither can the size');
  assert.match(fails('color(1.5, 2, 3)').stderr, /TypeError/, 'a color from numbers needs whole numbers');
  assert.equal(fails('color("#ff8000")\npensize(3)\nforward(1)').status, 0, 'and a hex color is fine');
});

test('the program that uses every block is valid, and RUNS against EduBlocks\' turtle without an error', needsPython, () => {
  assert.doesNotThrow(() => runPython(toPython(everything()), 'check'));
  const result = runPython(toPython(everything()), 'run', ['3']);
  assert.deepEqual(result.asked, ['How many? '], 'it asked its question once');
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
  assert.ok(result.printed.length >= 1, 'it printed');
  assert.deepEqual(result.speeds, [3, 0], 'speed 2 is Python\'s 3, and speed 4 is 0');
});

test('the pen color and size agree, even when they are asked for, clamped, or fractions', needsPython, () => {
  assertSame(projectOf(program(b('clean'), b('setcolor', 10, 20, 30), b('forward', { op: 'penred' }), b('forward', { op: 'pengreen' }), b('forward', { op: 'penblue' }))), 'reading the pen color');
  assertSame(projectOf(program(b('clean'), b('setpensize', 7), b('forward', { op: 'pensize' }))), 'reading the pen size');
  assertSame(projectOf(program(b('forward', { op: 'penred' }), b('forward', { op: 'pensize' }))), 'reading it when nothing has been set');
  assertSame(projectOf(program(b('clean'), b('setcolor', 300, -5, 20.6), b('forward', { op: 'penred' }), b('forward', { op: 'pengreen' }), b('forward', { op: 'penblue' }))), 'colors past the ends, and fractions');
  assertSame(projectOf(program(b('clean'), b('store1', 7.4), b('setcolor', { op: 'box1' }, op('multiply', { op: 'box1' }, 3), 255), b('forward', { op: 'pengreen' }))), 'colors from a calculation');
  assertSame(projectOf(hat('tint', ['n'], b('setcolor', input('n'), 0, 0), b('forward', { op: 'penred' })), program(b('clean'), call('tint', ['n'], 99.6))), 'inside a block of your own');
});

test('the names it uses really are the ones Python\'s own turtle module has too', needsPython, () => {
  const result = spawnSync('python3', ['-I', '-c', `
import json, sys
names = json.loads(sys.stdin.read())
try:
    import turtle
except Exception as error:   # no tkinter on this machine: nothing to check against
    print(json.dumps({"skipped": str(error)})); sys.exit(0)
print(json.dumps({"missing": [n for n in names if not hasattr(turtle, n)]}))
`], { input: JSON.stringify([...namesUsedBy(everything()).free].filter((name) => edublocksNames().has(name))), encoding: 'utf8' });
  const outcome = JSON.parse(result.stdout);
  if (outcome.skipped) return; // this Python has no turtle module (no tkinter)
  assert.deepEqual(outcome.missing, [], 'every turtle name the program uses is in real Python\'s turtle too');
});

test('set font and set curve are notes to the reader too, and make a valid body on their own in a loop', needsPython, () => {
  const lines = mainLines(projectOf(program(b('clean'), rep(2, { op: 'setfont', args: [], font: 'fancy' }, b('setcurve', 90)))));
  assert.deepEqual(lines.slice(1), ['for _ in range(2):', '    # set font fancy: the letters of the write blocks after this are drawn in this font, which Python\'s turtle cannot do', '    pass', '    # set curve 90: the words of the write blocks after this are bent, which Python\'s turtle cannot do', '    pass']);
  const alone = projectOf(program(b('clean'), rep(3, b('setcurve', 45))));
  assert.doesNotThrow(() => runPython(toPython(alone), 'check'));
});

test('a write block is left as a comment and a pass: Python\'s turtle cannot draw TurtleLab\'s letters', needsPython, () => {
  const write = { op: 'write', args: [60], text: 'Hi there' };
  const lines = mainLines(projectOf(program(b('clean'), rep(2, write, b('forward', 10)))));
  assert.deepEqual(lines.slice(1), ['for _ in range(2):', '    # write "Hi there": TurtleLab draws these words as lines that Python\'s turtle has no way to draw', '    pass', '    forward(10)']);
  // On its own in a loop it still makes a valid body, and the program still ends in the same place.
  const alone = projectOf(program(b('clean'), rep(3, write)));
  assert.doesNotThrow(() => runPython(toPython(alone), 'check'));
  assertSame(projectOf(program(b('clean'), write, b('forward', 40), write, b('right', 30))), 'a write block', { length: false });
  // Nothing about it needs a name EduBlocks does not have.
  assert.ok(!toPython(alone).includes('write('), 'no call to a write function');
});

test('ask: Python asks with input(), keeps asking until it gets a number, and the answer goes in box1 like the block does', needsPython, () => {
  const sides = projectOf(program(b('clean'), { op: 'ask', args: [], text: 'How many sides?' }, rep({ op: 'box1' }, b('forward', 40), b('right', op('divide', 360, { op: 'box1' }))), b('print', { op: 'box1' })));
  for (const answer of ['3', '5', '6', '4.5', '-2', '0']) assertSame(sides, `ask ${answer}`, { answers: [answer] });
  const source = toPython(sides);
  assert.match(source, /^def ask\(question\):$/m);
  assert.match(source, /^box1 = ask\("How many sides\?"\)$/m);
  // words and rubbish are asked about again (the helper prints a note), then the number is taken
  const again = runPython(source, 'run', ['five', '', 'nan', 'inf', '1e999', '4']);
  assert.deepEqual(again.asked, Array(6).fill('How many sides? '));
  assert.equal(again.printed.filter((word) => word === 'Please').length, 5, 'five answers that were not numbers');
  assert.equal(again.length, 160, 'and then 4 sides of 40');
  // the answer is whole when it was typed whole, and a decimal when it was typed as one
  assert.deepEqual(runPython(toPython(projectOf(program({ op: 'ask', args: [], text: 'x' }, b('print', { op: 'box1' })))), 'run', ['7']).printed, ['7']);
  assert.deepEqual(runPython(toPython(projectOf(program({ op: 'ask', args: [], text: 'x' }, b('print', { op: 'box1' })))), 'run', ['7.0']).printed, ['7']);
  assert.deepEqual(runPython(toPython(projectOf(program({ op: 'ask', args: [], text: 'x' }, b('print', { op: 'box1' })))), 'run', ['7.25']).printed, ['7.25']);
});

test('ask inside a block of your own writes the global box1, and a question with quotes stays one string', needsPython, () => {
  const project = projectOf(hat('size', [], { op: 'ask', args: [], text: 'Say "go": ' }), program(b('clean'), call('size', []), b('forward', { op: 'box1' })));
  const source = toPython(project);
  assert.match(source, /def size\(\):\n    global box1\n    box1 = ask\("Say \\"go\\": "\)/);
  assertSame(project, 'ask in a block of my own', { answers: ['25'] });
  assert.deepEqual(runPython(source, 'run', ['25']).asked, ['Say "go":  ']);
});

test('click handlers: a click calls on_click with where it was, and the Python draws what the blocks draw (one handler, several, and a stop in one)', needsPython, () => {
  const square = [b('penup'), b('setxy', { op: 'mousex' }, { op: 'mousey' }), b('pendown'), rep(4, b('forward', 20), b('right', 90))];
  const handler = (...blocks) => ({ x: 600, y: 0, blocks: [b('onclick'), ...blocks] });
  const one = projectOf(program(b('clean')), handler(...square));
  for (const clicks of [[], [[40, -30]], [[40, -30], [-100, 60], [0, 0]]]) assertSame(one, `${clicks.length} clicks`, { clicks });
  const source = toPython(one);
  assert.match(source, /^def on_click\(x, y\):\n    global mouseX, mouseY\n    mouseX = x\n    mouseY = y\n/m);
  assert.match(source, /try:\n    onscreenclick\(on_click\).*\nexcept NameError:\n    pass/);
  assert.match(source, /^mouseX = 0.*\nmouseY = 0$/m);
  // the mouse variables work anywhere, and hold the last click: a block of your own reads them, and so does a second click
  const reading = projectOf(hat('go', [], b('forward', { op: 'mousex' }), b('right', 90), b('forward', { op: 'mousey' })), program(b('clean')), handler(call('go', [])));
  assertSame(reading, 'a block of my own reads mouseX and mouseY', { clicks: [[30, 40], [10, 20]] });
  // several handlers all run, in order, and each is its own function; a stop only ends the handler it is in
  const several = projectOf(program(b('clean')), { x: 600, y: 0, blocks: [b('onclick'), b('forward', 10), { op: 'stop', args: [] }, b('forward', 999)] }, { x: 600, y: 50, blocks: [b('onclick'), b('right', 90), b('forward', { op: 'mousex' })] });
  assertSame(several, 'two handlers, a stop in the first', { clicks: [[7, 0], [5, 0]] });
  assert.match(toPython(several), /def when_clicked_1\(\):[\s\S]*def when_clicked_2\(\):[\s\S]*def on_click\(x, y\):[\s\S]*when_clicked_1\(\)\n    when_clicked_2\(\)/);
  // boxes stored in a handler are the global ones, and ask works there too
  const boxes = projectOf(program(b('clean'), b('store1', 5)), handler(b('store2', op('add', { op: 'box1' }, { op: 'mousex' })), b('forward', { op: 'box2' })));
  assertSame(boxes, 'a box set in a handler', { clicks: [[10, 0], [20, 0]] });
  assert.match(toPython(boxes), /def on_click\(x, y\):\n    global mouseX, mouseY, box2\n/);
  assertSame(projectOf(program(b('clean')), handler({ op: 'ask', args: [], text: 'How far?' }, b('forward', { op: 'box1' }))), 'ask in a handler', { clicks: [[1, 1]], answers: ['25'] });
  // a page with only a click handler is a whole program too
  const only = projectOf(handler(b('forward', { op: 'mousey' })));
  assert.doesNotThrow(() => runPython(toPython(only), 'check'));
  assert.match(toPython(only), /# Your program starts here\nsetheading\(90\)\n[^\n]*\n[^\n]*\ntry:\n    onscreenclick\(on_click\)/, 'it starts the way TurtleLab does (facing up), then listens');
  assert.ok(!/Nothing runs yet/.test(toPython(only)));
  assertSame(only, 'only a handler', { clicks: [[0, 30]] });
});

test('key handlers: a key press calls its function, several for one key run in order, and the Python draws what the blocks draw', needsPython, () => {
  const key = (id, ...blocks) => ({ x: 600, y: 0, blocks: [{ op: 'onkey', args: [], key: id }, ...blocks] });
  const steer = projectOf(program(b('clean'), b('store1', 0)), key('right', b('right', 90)), key('left', b('left', 90)), key('up', b('forward', 25), b('store1', op('add', { op: 'box1' }, 1))));
  for (const keys of [[], ['up'], ['right', 'up', 'up', 'left', 'left', 'up'], ['a', 'space', 'up']]) assertSame(steer, `${keys.join(' ')}`, { keys });
  const source = toPython(steer);
  assert.match(source, /^def on_key_right\(\):\n    right\(90\)/m);
  assert.match(source, /^def on_key_up\(\):\n    global box1\n/m);
  assert.match(source, /try:\n    onkeypress\(on_key_right, "Right"\).*\n    onkeypress\(on_key_left, "Left"\).*\n    onkeypress\(on_key_up, "Up"\).*\n    listen\(\).*\nexcept NameError:\n    pass/);
  // two handlers for one key each are their own function, a stop only ends the one it is in, and the key runs them in order
  const twice = projectOf(program(b('clean')), key('space', b('forward', 10), { op: 'stop', args: [] }, b('forward', 999)), key('space', b('right', 90), b('forward', 5)));
  assertSame(twice, 'two handlers for space, a stop in the first', { keys: ['space', 'space'] });
  assert.match(toPython(twice), /def on_key_space_1\(\):[\s\S]*def on_key_space_2\(\):[\s\S]*def on_key_space\(\):\n    on_key_space_1\(\)\n    on_key_space_2\(\)/);
  // a letter, a digit and enter have their own names, and a page with only a key handler is a whole program (facing up first)
  const names = projectOf(key('a', b('forward', 1)), key('7', b('forward', 2)), key('enter', b('forward', 4)));
  assert.doesNotThrow(() => runPython(toPython(names), 'check'));
  assert.match(toPython(names), /onkeypress\(on_key_a, "a"\)[\s\S]*onkeypress\(on_key_7, "7"\)[\s\S]*onkeypress\(on_key_enter, "Return"\)/);
  assertSame(names, 'a letter, a digit and enter', { keys: ['a', '7', 'enter', 'enter'] });
  assert.ok(!/Nothing runs yet/.test(toPython(names)));
  // a key handler can read a box set by the program, and ask inside one works
  assertSame(projectOf(program(b('clean'), b('store1', 12)), key('up', b('forward', { op: 'box1' }))), 'a key reads a box', { keys: ['up'] });
});

test('timers: an every block sets up its next time first and then does its blocks, and the Python draws what the blocks draw', needsPython, () => {
  const every = (tenths, ...blocks) => ({ x: 600, y: 0, blocks: [{ op: 'onstep', args: [tenths] }, ...blocks] });
  const walk = projectOf(program(b('clean'), b('store1', 0)), every(2, b('forward', 10), b('right', 15), b('store1', op('add', { op: 'box1' }, 1))));
  for (const ticks of [0, 1, 5]) assertSame(walk, `${ticks} ticks`, { ticks });
  const source = toPython(walk);
  assert.match(source, /^def on_timer\(\):\n    global box1\n    try:\n        ontimer\(on_timer, 200\).*\n    except NameError:\n        pass.*\n    forward\(10\)/m);
  assert.match(source, /try:\n    ontimer\(on_timer, 200\).*\nexcept NameError:\n    pass/);
  // the time can be a box read when the program starts listening, and several timers each have their own function; a stop only ends that tick
  const slower = projectOf(program(b('clean'), b('store2', 5)), every({ op: 'box2' }, b('forward', 3), { op: 'stop', args: [] }, b('forward', 999)), every(10, b('back', 1)));
  assertSame(slower, 'two timers, a stop in the first', { ticks: 4 });
  assert.match(toPython(slower), /def on_timer_1\(\):[\s\S]*ontimer\(on_timer_1, int\(box2 \* 100\)\)[\s\S]*def on_timer_2\(\):[\s\S]*ontimer\(on_timer_2, 1000\)/);
  // keys and timers together (a snake in miniature), and a page with only a timer starts facing up
  const both = projectOf(program(b('clean')), every(1, b('forward', 5)), { x: 600, y: 80, blocks: [{ op: 'onkey', args: [], key: 'left' }, b('left', 90)] });
  assertSame(both, 'a timer and a key', { keys: ['left', 'left'], ticks: 3 });
  const only = projectOf(every(5, b('forward', 2)));
  assert.doesNotThrow(() => runPython(toPython(only), 'check'));
  assertSame(only, 'only a timer', { ticks: 2 });
});

test('in EduBlocks, which has no onkeypress or ontimer, a program with a key handler and an every block still runs: the calls are guarded and nothing happens', needsPython, () => {
  const project = projectOf(program(b('clean'), b('forward', 10)), { x: 600, y: 0, blocks: [{ op: 'onkey', args: [], key: 'up' }, b('forward', 99)] }, { x: 600, y: 90, blocks: [{ op: 'onstep', args: [3] }, b('forward', 99)] });
  const result = runPython(toPython(project), 'run'); // (no keys, no ticks: no onkeypress, no ontimer, as in EduBlocks)
  assert.equal(result.y, 10, 'the program ran and the handlers did not');
  const { free } = namesUsedBy(project);
  for (const name of ['onkeypress', 'listen', 'ontimer']) assert.ok(!free.includes(name), `${name} is only used where its absence is caught`);
});

test('in EduBlocks, which has no onscreenclick, a program with a click handler still runs: the call is guarded and nothing happens', needsPython, () => {
  const project = projectOf(program(b('clean'), b('forward', 10)), { x: 600, y: 0, blocks: [b('onclick'), b('forward', 99)] });
  const result = runPython(toPython(project), 'run'); // (no clicks key: no onscreenclick here, as in EduBlocks)
  assert.equal(result.y, 10, 'the program ran and the handler did not');
  const { free } = namesUsedBy(project);
  assert.ok(!free.includes('onscreenclick'), 'a name that is only used where its absence is caught is not a name EduBlocks must have');
});
