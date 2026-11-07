// Tests for the Logo: blocks written out as Logo (core/logo.js), Logo read in as blocks (core/logo-compile.js),
// and the two together: write the blocks out, read them in again, run both, and the drawing is the same.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SAMPLES, sampleStacks } from '../js/ui/samples.js';
import { toLogo } from '../js/core/logo.js';
import { compileLogo, tokenize, LOGO_NAMES, BUILTIN_WORDS } from '../js/core/logo-compile.js';
import { definitionsOf } from '../js/core/definitions.js';
import { findRunStack, handlersOf } from '../js/core/project.js';
import { runBlocks, createContext, RunError, Wait, Ask } from '../js/core/interpreter.js';
import { Turtle } from '../js/core/turtle.js';
import { BLOCKS, BOX_COUNT } from '../js/core/blocks-spec.js';

/** A repeatable stand-in for Math.random, so a program with chance in it can be run twice. */
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

/** Run some blocks (with the blocks you made in `stacks`) and say what they drew and printed. */
function run(blocks, stacks = []) {
  const turtle = new Turtle();
  const printed = [];
  const waits = [];
  const context = createContext({ turtle, random: seeded(7), print: (line) => printed.push(line), definitions: definitionsOf({ stacks }).map });
  for (const step of runBlocks(blocks, context)) if (step instanceof Wait) waits.push(step.ms);
  const state = { x: turtle.x, y: turtle.y, heading: turtle.heading, penDown: turtle.penDown, size: turtle.penSize, color: turtle.color };
  return { ops: JSON.parse(JSON.stringify(turtle.ops)), state, printed, waits, boxes: context.boxes };
}

/** Run Logo text. Fails the test if it does not compile. */
function runLogo(text) {
  const result = compileLogo(text);
  assert.equal(result.ok, true, result.error);
  return run(result.main, result.stacks);
}

const printedBy = (text) => runLogo(text).printed;
const errorOf = (text) => {
  const result = compileLogo(text);
  assert.equal(result.ok, false, `expected an error for: ${text}`);
  return result;
};
const b = (op, ...args) => ({ op, args });
const rep = (count, ...body) => ({ op: 'repeat', args: [count], body });

// ---- Writing and reading the same words ---------------------------------------------------------------

test('fd and forward are the same command, and so are all the long and short words', () => {
  const same = (a, c) => assert.deepEqual(JSON.parse(JSON.stringify(compileLogo(a).main)), JSON.parse(JSON.stringify(compileLogo(c).main)), `${a} and ${c}`);
  same('fd 100', 'forward 100');
  same('bk 5 lt 10 rt 20', 'back 5 left 10 right 20');
  same('backward 5', 'bk 5');
  same('pu pd', 'penup pendown');
  same('seth 90', 'setheading 90');
  same('cs', 'clearscreen');
  same('pr 5', 'print 5');
  same('setpc [1 2 3]', 'setpencolor [1 2 3]');
  same('setsc [1 2 3]', 'setscreencolor [1 2 3]');
  same('FD 100 Rt 90', 'forward 100 right 90');
  assert.deepEqual(JSON.parse(JSON.stringify(compileLogo('fd 100').main)), [{ op: 'forward', args: [100] }]);
});

test('every simple command can be written both ways, and the generator writes words the compiler reads', () => {
  for (const [op, names] of Object.entries(LOGO_NAMES)) {
    assert.ok(BLOCKS[op], `${op} is a real block`);
    for (const style of [names.long, names.short]) {
      const argc = BLOCKS[op].args.length;
      const text = `${style} ${Array.from({ length: argc }, (_, i) => i + 1).join(' ')}`;
      const result = compileLogo(text);
      assert.equal(result.ok, true, `${text}: ${result.error}`);
      assert.equal(result.main[0].op, op, text);
    }
  }
  assert.ok(Object.values(LOGO_NAMES).some((n) => n.long !== n.short), 'some have abbreviations');
});

test('toLogo writes the long words or the short ones, as asked', () => {
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('clean'), b('penup'), b('setxy', 5, -5), b('setheading', 90), b('pendown'), rep(4, b('forward', 100), b('right', 90), b('left', 1), b('back', 2))] }] };
  assert.equal(toLogo(project), `clearscreen
penup
setxy 5 -5
setheading 90
pendown
repeat 4 [
  forward 100
  right 90
  left 1
  back 2
]
`);
  assert.equal(toLogo(project, { short: true }), `cs
pu
setxy 5 -5
seth 90
pd
repeat 4 [
  fd 100
  rt 90
  lt 1
  bk 2
]
`);
});

// ---- Reading Logo ------------------------------------------------------------------------------------------

test('numbers: a minus sign with a space before it and none after it is a negative number, not a subtraction', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(compileLogo('setxy 10 -20').main)), [{ op: 'setxy', args: [10, -20] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(compileLogo('fd -50').main)), [{ op: 'forward', args: [-50] }]);
  assert.deepEqual(printedBy('print 10 - 5 print 10-5 print 3 * -2 print -2 * 3 print 3 - -2'), ['5', '5', '-6', '-6', '5']);
  assert.deepEqual(printedBy('setxy 10 -20 print xcor print ycor'), ['10', '-20']);
});

test('arithmetic follows the usual order, and the brackets, the remainder and the comparisons work', () => {
  assert.deepEqual(printedBy('print 2 + 3 * 4 print (2 + 3) * 4 print 10 - 2 - 3 print 20 / 4 / 5'), ['14', '20', '5', '1']);
  assert.deepEqual(printedBy('print 7 % 3 print -1 % 5 print 2 + 3 % 2 * 4'), ['1', '4', '6']);
  assert.deepEqual(printedBy('print sum 1 2 print difference 5 2 print product 3 4 print quotient 8 2 print modulo -1 5'), ['3', '3', '12', '4', '4']);
  assert.deepEqual(printedBy('ifelse 3 < 5 [print 1] [print 0] ifelse 3 > 5 [print 1] [print 0] ifelse 2 + 1 = 3 [print 1] [print 0]'), ['1', '0', '1']);
  assert.deepEqual(printedBy('print 0.1 + 0.2 ifelse 0.1 + 0.2 = 0.3 [print 1] [print 0]'), ['0.3', '1']);
});

test('repeat, if, ifelse and forever, with lists inside lists, on one line or many', () => {
  assert.deepEqual(printedBy('repeat 2 [repeat 3 [print 1] print 2]'), ['1', '1', '1', '2', '1', '1', '1', '2']);
  assert.deepEqual(printedBy('repeat 3 [\n  if 1 < 2 [\n    print 7\n  ]\n  if 2 < 1 [ print 8 ]\n]'), ['7', '7', '7']);
  assert.deepEqual(printedBy('make "n 0 forever [ make "n :n + 1 print :n if :n = 3 [ stop ] ]'), ['1', '2', '3']);
  assert.deepEqual(printedBy('repeat 2.9 [print 1]'), ['1', '1']);
});

test('variables made with make can have any name, up to four, and boxes are the same thing', () => {
  assert.deepEqual(printedBy('make "size 50 make "angle 90 make "a 1 make "b 2 print :size print :angle print :a + :b'), ['50', '90', '3']);
  assert.deepEqual(printedBy('make "box2 7 print :box2 print :box1'), ['7', '0']);
  assert.deepEqual(printedBy('make "Size 5 print :SIZE'), ['5']);
  assert.equal(runLogo('make "box3 9').boxes[2], 9, 'a variable called box3 is box 3');
  const five = errorOf('make "a 1 make "b 2 make "c 3 make "d 4 make "e 5');
  assert.match(five.error, new RegExp(`room for ${BOX_COUNT} variables`));
  assert.equal(five.line, 1);
});

test('blocks of your own: any number of inputs, recursion, and a call that comes before the definition', () => {
  assert.deepEqual(printedBy('to down :n\n  if :n < 1 [ stop ]\n  print :n\n  down :n - 1\nend\ndown 3'), ['3', '2', '1']);
  assert.deepEqual(printedBy('show 1 2 3\nto show :a :b :c\n  print :a print :b print :c\nend'), ['1', '2', '3']);
  const drawn = runLogo('to square :size\n  repeat 4 [ fd :size rt 90 ]\nend\nsquare 50\nsquare 100');
  assert.equal(drawn.ops.length, 8);
  assert.deepEqual(drawn.state.heading % 360, 0);
  assert.deepEqual(printedBy('to f :X\n print :x\nend\nf 4'), ['4'], 'inputs ignore capitals');
});

test('color, screen, pen size, fill, speed, home, setx and sety', () => {
  const a = runLogo('setpc [10 20 30] setpensize 7 pu setxy 5 6 home');
  assert.deepEqual([a.state.color, a.state.size, a.state.x, a.state.y, a.state.heading], [[10, 20, 30], 7, 0, 0, 0]);
  assert.deepEqual(runLogo('setpc "red').state.color, [255, 0, 0]);
  assert.deepEqual(runLogo('make "g 99 setpc 1 :g 3').state.color, [1, 99, 3]);
  assert.equal(runLogo('setsc [1 2 3]').ops[0].type, 'fillScreen');
  assert.deepEqual([runLogo('pu setx 40').state.x, runLogo('pu setxy 3 4 sety 9').state.y, runLogo('pu setxy 3 4 sety 9').state.x], [40, 9, 3]);
  assert.ok(runLogo('startfill repeat 3 [fd 50 rt 120] endfill').ops.some((op) => op.type === 'fill'));
  assert.deepEqual(runLogo('ht st fd 10').ops.length, 1, 'hideturtle and showturtle are accepted and do nothing');
});

test('wait counts 60ths of a second, like real Logo', () => {
  assert.deepEqual(runLogo('wait 60').waits, [1000]);
  assert.deepEqual(runLogo('wait 6 wait 30').waits, [100, 500]);
  assert.deepEqual(runLogo('make "t 12 wait :t * 5').waits, [1000]);
});

test('random: (random low high) and random n, with the same chance as the blocks', () => {
  const values = printedBy('repeat 40 [ print (random 1 6) ]').map(Number);
  assert.ok(values.every((n) => Number.isInteger(n) && n >= 1 && n <= 6) && new Set(values).size > 3);
  const fromZero = printedBy('repeat 40 [ print random 4 ]').map(Number);
  assert.ok(fromZero.every((n) => Number.isInteger(n) && n >= 0 && n <= 3) && fromZero.includes(0) && fromZero.includes(3));
  assert.deepEqual(printedBy('repeat 20 [ print (oneof 3 4) ]').filter((x) => x !== '3' && x !== '4'), []);
});

test('setfont and setcurve are Logo too: a font name in quotes, and a number of degrees', () => {
  const result = compileLogo('setfont "fancy setcurve 120 write |Go| 50 setfont "SANS setcurve -45 write |Hi| 30 setcurve 0');
  assert.deepEqual(JSON.parse(JSON.stringify(result.main)), [
    { op: 'setfont', args: [], font: 'fancy' },
    { op: 'setcurve', args: [120] },
    { op: 'write', args: [50], text: 'Go' },
    { op: 'setfont', args: [], font: 'sans' },
    { op: 'setcurve', args: [-45] },
    { op: 'write', args: [30], text: 'Hi' },
    { op: 'setcurve', args: [0] },
  ]);
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), { op: 'setfont', args: [], font: 'bold' }, b('setcurve', { op: 'box1' }), { op: 'write', args: [50], text: 'Go' }, { op: 'setfont', args: [] }] }] };
  const code = toLogo(project);
  assert.match(code, /setfont "bold\n/);
  assert.match(code, /setcurve :box1\n/);
  assert.match(code, /setfont "script$/m, 'a set font block with no font is script');
  assert.ok(!/write \|Go\| 50 "/.test(code), 'the write command has no font of its own');
  assert.deepEqual(JSON.parse(JSON.stringify(compileLogo(code).main.filter((x) => x.op === 'setfont' || x.op === 'setcurve'))), [
    { op: 'setfont', args: [], font: 'bold' }, { op: 'setcurve', args: [{ op: 'box1', args: [] }] }, { op: 'setfont', args: [], font: 'script' },
  ]);
  const turned = runLogo('setfont "bold setcurve 90 write |Go| 40');
  const plain = runLogo('write |Go| 40');
  assert.notEqual(JSON.stringify(turned.ops), JSON.stringify(plain.ops), 'they change what is drawn');
});

test('setfont with a font TurtleLab does not have, or none, says which it has', () => {
  const unknown = compileLogo('setfont "gothic');
  assert.equal(unknown.ok, false);
  assert.match(unknown.error, /"gothic is not a font TurtleLab has\. The fonts are script, fancy, sans, bold, serif, blocky, pixel/);
  assert.equal(unknown.line, 1);
  for (const bare of ['setfont', 'setfont 5', 'setfont "']) {
    const result = compileLogo(bare);
    assert.equal(result.ok, false, bare);
    assert.match(result.error, /setfont needs the name of a font in quotes/, bare);
  }
  // Both words are Logo words now, so a block of your own cannot be called that.
  assert.match(compileLogo('to setfont forward 1 end').error ?? '', /already a Logo word/);
  assert.match(compileLogo('to setcurve forward 1 end').error ?? '', /already a Logo word/);
});

test('write, with words in bars or in quotes', () => {
  const result = compileLogo('write |Go Cougars| 50 write "Hi 30');
  assert.deepEqual(JSON.parse(JSON.stringify(result.main)), [{ op: 'write', args: [50], text: 'Go Cougars' }, { op: 'write', args: [30], text: 'Hi' }]);
  assert.ok(runLogo('write |Hi| 40').ops.length > 5);
});

test('comments, blank lines and any spacing are fine, and an empty program does nothing', () => {
  assert.equal(runLogo('; just a comment\n\n   \n').ops.length, 0);
  assert.equal(compileLogo('').ok, true);
  assert.deepEqual(compileLogo('').main, []);
  assert.equal(runLogo('fd 10 ; this goes up\n   rt 90\nfd 10').ops.length, 2);
  assert.equal(runLogo('repeat 2[fd 10 rt 90]').ops.length, 2);
  assert.equal(runLogo('fd(10)').ops.length, 1);
});

// ---- Complaints, with the line they are on ------------------------------------------------------------------

test('a mistake says what it is, in plain words, on the right line', () => {
  const cases = [
    ['fd 10\nfdd 20', 2, /do not know how to fdd.*Did you mean fd\?/],
    ['fd', 1, /fd needs a number after it/],
    ['fd 10\nsetxy 5', 2, /setxy needs 2 numbers after it, and I only found 1/],
    ['fd rt 90', 1, /fd needs a number after it/],
    ['repeat 4 fd 10', 1, /repeat needs a list of commands in \[ square brackets \] after it/],
    ['repeat 4 [fd 10', 1, /could not find the \] that closes the \[ on line 1/],
    ['fd 10 ]', 1, /\] with no \[/],
    ['fd 10\n\nrepeat 2 [\n fd 10 ]\n]', 5, /\] with no \[/],
    ['to square :s\n fd :s', 1, /never ends/],
    ['end', 1, /end with no to/],
    ['to a\nto b\nend\nend', 2, /another to/],
    ['fd :size', 1, /do not know :size.*make "size/],
    ['fd 5 <= 6', 1, /<= is not in TurtleLab Logo yet/],
    ['sqrt 4', 1, /sqrt is real Logo, but it is not in TurtleLab Logo yet/],
    ['print "hello', 1, /need a number here.*"hello is a word/],
    ['to forward :n\nend', 1, /already a Logo word/],
    ['to a\nend\nto a\nend', 3, /already made a block called a on line 1/],
    ['to f :n\n make "n 5\nend', 2, /cannot change the input :n/],
    ['make size 5', 1, /make needs a name in quotes/],
    ['setpc [1 2]', 1, /three numbers from 0 to 255.*has 2/],
    ['setpc "chartreuse', 1, /do not know a color called chartreuse/],
    ['fd 10 ~', 1, /do not understand the character ~/],
    ['write |never closes 5', 1, /\| that never closes/],
    ['x = 5', 1, /do not know how to x/],
    ['5', 1, /number 5 where a command should be/],
    ['to f\n fd 10\nend\nprint f', 4, /f is a block of yours that draws/],
    ['print fd', 1, /print needs a number after it|fd is a command/],
  ];
  for (const [text, line, message] of cases) {
    const result = errorOf(text);
    assert.match(result.error, message, text);
    assert.equal(result.line, line, `${JSON.stringify(text)} says line ${result.line}`);
  }
});

test('a mistake while the program runs also knows its line', () => {
  const result = compileLogo('fd 10\nprint 1 / 0\nfd 5');
  assert.equal(result.ok, true);
  assert.throws(() => run(result.main, result.stacks), (error) => error instanceof RunError && error.block.logoLine === 2 && /divide by zero/.test(error.message));
  const deep = compileLogo('to loop\n loop\nend\nloop');
  assert.throws(() => run(deep.main, deep.stacks), (error) => error instanceof RunError && /more than \d+ times/.test(error.message) && error.block.logoLine === 2);
});

test('Logo nested far too deeply is refused politely instead of crashing', () => {
  for (const text of [`${'['.repeat(30000)}`, `fd ${'('.repeat(30000)}1${')'.repeat(30000)}`, `repeat 2 ${'[ repeat 2 '.repeat(20000)}`]) {
    const result = compileLogo(text);
    assert.equal(result.ok, false);
    assert.equal(typeof result.error, 'string');
  }
});

test('tokens know their line and whether there was a space on each side', () => {
  const tokens = tokenize('fd 10 -5\n  rt :x-1 ;gone\n|a b|');
  assert.deepEqual(tokens.map((t) => [t.type, t.line]), [['word', 1], ['number', 1], ['op', 1], ['number', 1], ['word', 2], ['var', 2], ['op', 2], ['number', 2], ['bar', 3]]);
  assert.deepEqual([tokens[2].before, tokens[2].after, tokens[6].before, tokens[6].after], [true, false, false, false]);
});

// ---- Writing the blocks as Logo ---------------------------------------------------------------------------

test('names you gave your own blocks and inputs become Logo words, never Logo words that already mean something', () => {
  const definition = (name, params, ...body) => ({ x: 0, y: 0, blocks: [{ op: 'to', name, params }, ...body] });
  const call = (name, params, ...args) => ({ op: 'call', name, params, args });
  const project = {
    stacks: [
      definition('forward', ['size'], b('forward', { op: 'input', name: 'size' })),
      definition('my block', ['a b', 'repeat'], b('forward', { op: 'input', name: 'a b' }), b('right', { op: 'input', name: 'repeat' })),
      definition('my_block', [], b('left', 5)),
      definition('box1', [], b('left', 6)),
      { x: 0, y: 5, blocks: [b('start'), call('forward', ['size'], 10), call('my block', ['a b', 'repeat'], 1, 2), call('my_block', []), call('box1', [])] },
    ],
  };
  const text = toLogo(project);
  assert.match(text, /^to forward_ :size$/m);
  assert.match(text, /^to my_block :a_b :repeat$/m);
  assert.match(text, /^to my_block2$/m);
  assert.match(text, /^to box1_$/m);
  assert.match(text, /^forward_ 10$/m);
  assert.match(text, /^my_block 1 2$/m);
  assert.match(text, /^my_block2$/m);
  const result = compileLogo(text);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(run(result.main, result.stacks).ops, run(project.stacks[4].blocks, project.stacks).ops);
});

test('brackets go only where the sum needs them, and a minus keeps its meaning', () => {
  const sum = (a, c) => b('add', a, c);
  const minus = (a, c) => b('subtract', a, c);
  const times = (a, c) => b('multiply', a, c);
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('forward', times(sum(2, 3), 4)), b('forward', sum(2, times(3, 4))), b('forward', minus(10, minus(3, 2))), b('forward', minus(minus(10, 3), 2)), b('forward', b('divide', 8, b('divide', 4, 2))), b('forward', times(-2, -3)), b('forward', { op: 'paren', args: [sum(1, 1)] }), b('forward', b('mod', sum(7, 1), 3)), b('forward', b('random', sum(1, 2), 9)), b('forward', b('oneof', 4, times(2, 3)))] }] };
  const lines = toLogo(project).split('\n').filter((line) => line.startsWith('forward'));
  assert.deepEqual(lines, [
    'forward (2 + 3) * 4', 'forward 2 + 3 * 4', 'forward 10 - (3 - 2)', 'forward 10 - 3 - 2', 'forward 8 / (4 / 2)',
    'forward -2 * -3', 'forward (1 + 1)', 'forward (7 + 1) % 3', 'forward (random (1 + 2) 9)', 'forward (oneof 4 (2 * 3))',
  ]);
  const result = compileLogo(toLogo(project));
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(run(result.main, result.stacks).ops, run(project.stacks[0].blocks).ops);
});

test('empty branches, notes, stacks that are not connected, and an empty page', () => {
  const project = { stacks: [
    { x: 0, y: 0, blocks: [{ op: 'note', text: 'Draws a thing.' }] },
    { x: 0, y: 9, blocks: [b('start'), { op: 'ifelse', args: [{ op: 'less', args: [1, 2] }], body: [], elseBody: [b('forward', 1)] }, { op: 'ifelse', args: [{ op: 'less', args: [1, 2] }], body: [b('forward', 2)], elseBody: [] }, { op: 'ifelse', args: [{ op: 'less', args: [1, 2] }], body: [], elseBody: [] }, rep(2)] },
    { x: 300, y: 300, blocks: [b('forward', 5)] },
  ] };
  const text = toLogo(project);
  assert.ok(!text.includes('Draws a thing'), 'a sticky note is on the page, not written into the Logo');
  assert.match(text, /^ifelse 1 < 2 \[\] \[\n  forward 1\n\]$/m);
  assert.match(text, /^ifelse 1 < 2 \[\n  forward 2\n\] \[\]$/m);
  assert.match(text, /^ifelse 1 < 2 \[\] \[\]$/m);
  assert.match(text, /^repeat 2 \[\]$/m);
  assert.match(text, /One other stack of blocks is not connected to Start/);
  assert.equal(compileLogo(text).ok, true);
  assert.match(toLogo({ stacks: [] }), /^; Drag some blocks onto the page/);
});

// ---- The two together -----------------------------------------------------------------------------------------

/** Every block, with all the kinds of socket, so the round trip covers the lot. */
function everything() {
  const call = (name, params, ...args) => ({ op: 'call', name, params, args });
  return {
    stacks: [
      { x: 0, y: 0, blocks: [{ op: 'to', name: 'petal', params: ['size', 'turn'] }, b('arc', { op: 'input', name: 'size' }, 50), b('right', { op: 'input', name: 'turn' })] },
      { x: 0, y: 1, blocks: [{ op: 'to', name: 'stopper', params: [] }, b('forward', 1), b('stop'), b('forward', 999)] },
      { x: 0, y: 2, blocks: [
        b('start'), b('clean'), b('speed', 4), { op: 'ask', args: [], text: 'How many sides?' }, b('setpensize', { op: 'add', args: [2, 1] }), b('setcolor', 10, { op: 'multiply', args: [{ op: 'box1' }, 5] }, 250), b('fillscreen', 250, 250, 240),
        b('penup'), b('setxy', -100, { op: 'subtract', args: [0, 50] }), b('setheading', 45), b('pendown'), b('store1', 3), b('store3', { op: 'x' }), b('store4', { op: 'random', args: [1, 9] }),
        b('startfill'), rep({ op: 'box1' }, b('forward', 30), b('left', 120)), b('endfill'),
        call('petal', ['size', 'turn'], 90, { op: 'add', args: [{ op: 'box1' }, 10] }), call('stopper', []),
        { op: 'ifelse', args: [{ op: 'greater', args: [{ op: 'box4' }, 4] }], body: [b('forward', { op: 'oneof', args: [10, 20] })], elseBody: [b('back', { op: 'random', args: [1, 3.5] })] },
        { op: 'if', args: [{ op: 'equal', args: [{ op: 'heading' }, 45] }], body: [b('print', { op: 'pensize' }), b('print', { op: 'penred' }), b('print', { op: 'pengreen' }), b('print', { op: 'penblue' }), b('print', { op: 'y' })] },
        // and, or and not: nested, with a guard so the second half of the and (a divide by box2, which is 0) must never run.
        { op: 'if', args: [{ op: 'or', args: [{ op: 'and', args: [{ op: 'less', args: [1, 2] }, { op: 'not', args: [{ op: 'equal', args: [{ op: 'box1' }, 99] }] }] }, { op: 'greater', args: [1, 5] }] }], body: [b('print', 777)] },
        { op: 'if', args: [{ op: 'and', args: [{ op: 'greater', args: [{ op: 'box2' }, 0] }, { op: 'greater', args: [{ op: 'divide', args: [10, { op: 'box2' }] }, 2] }] }], body: [b('print', 888)] },
        b('print', { op: 'mod', args: [-7, 3] }), b('print', { op: 'divide', args: [1, 3] }), b('print', { op: 'paren', args: [{ op: 'add', args: [0.1, 0.2] }] }),
        b('wait', 0.5), b('wait', { op: 'box1' }), { op: 'write', args: [40], text: 'Go' }, { op: 'setfont', args: [], font: 'fancy' }, b('setcurve', 90), { op: 'write', args: [30], text: 'Cougars' }, b('setcurve', { op: 'box1' }), { op: 'setfont', args: [], font: 'serif' }, { op: 'write', args: [{ op: 'box1' }], text: 'Hi' }, b('right', 90), b('setcurve', -45), { op: 'forever', args: [], body: [b('forward', 1), { op: 'if', args: [{ op: 'less', args: [-50, { op: 'x' }] }], body: [b('stop')] }] },
        b('forward', { op: 'box3' }), b('forward', { op: 'penred' }), b('forward', 12345), b('print', { op: 'mousex' }), b('print', { op: 'add', args: [{ op: 'mousey' }, 1] }),
      ] },
      { x: 400, y: 0, blocks: [{ op: 'onclick', args: [] }, b('penup'), b('setxy', { op: 'mousex' }, { op: 'mousey' }), b('pendown'), rep(4, b('forward', 20), b('right', 90))] },
    ],
  };
}

const sameDrawing = (a, c, label) => {
  assert.deepEqual(a.ops, c.ops, `${label}: the drawing`);
  assert.deepEqual(a.state, c.state, `${label}: where the turtle ended`);
  assert.deepEqual(a.printed, c.printed, `${label}: what was printed`);
  assert.deepEqual(a.waits, c.waits, `${label}: the waits`);
  assert.deepEqual(a.boxes, c.boxes, `${label}: the boxes`);
};

test('a program that uses every block comes back from Logo as the same drawing, in both styles', () => {
  const project = everything();
  const used = new Set();
  const visit = (blocks) => blocks.forEach((block) => {
    used.add(block.op);
    (block.args ?? []).forEach((arg) => arg && typeof arg === 'object' && visit([arg]));
    visit(block.body ?? []);
    visit(block.elseBody ?? []);
  });
  project.stacks.forEach((stack) => visit(stack.blocks));
  // Everything a student can drag out (not a note, which says nothing) is in the program, so nothing was forgotten.
  const missing = Object.keys(BLOCKS).filter((op) => BLOCKS[op].kind !== 'note' && !used.has(op) && !/^(store|box)[124]$/.test(op));
  assert.deepEqual(missing, [], 'blocks missing from the everything program');

  const { stack: main } = findRunStack(project);
  const wanted = run(main.blocks, project.stacks);
  for (const short of [false, true]) {
    const text = toLogo(project, { short });
    const result = compileLogo(text);
    assert.equal(result.ok, true, `${result.error}\n${text}`);
    sameDrawing(run(result.main, result.stacks), wanted, short ? 'short words' : 'long words');
  }
});

test('every sample comes back from Logo as the very same drawing, in both styles (a longer test, but the one that matters)', () => {
  for (const sample of SAMPLES) {
    const project = { stacks: sampleStacks(sample) };
    const { stack: main } = findRunStack(project);
    const wanted = run(main.blocks, project.stacks);
    for (const short of [false, true]) {
      const text = toLogo(project, { short });
      const result = compileLogo(text);
      assert.equal(result.ok, true, `${sample.id}: ${result.error} (line ${result.line})\n${text}`);
      sameDrawing(run(result.main, result.stacks), wanted, `${sample.id} ${short ? 'short' : 'long'}`);
    }
  }
});

test('changing the Logo changes the drawing: that is the point', () => {
  const sample = SAMPLES.find((s) => s.id === 'square');
  const project = { stacks: sampleStacks(sample) };
  const { stack: main } = findRunStack(project);
  const text = toLogo(project).replace('repeat 4 [', 'repeat 3 [').replace('right 90', 'right 120');
  const changed = run(compileLogo(text).main);
  assert.equal(changed.ops.filter((op) => op.type === 'line').length, 3);
  assert.notDeepEqual(changed.ops, run(main.blocks).ops);
  assert.ok(Math.abs(changed.state.x) < 1e-9 && Math.abs(changed.state.y) < 1e-9, 'three sides of 120 degrees make a triangle that closes');
});

test('the words the generator will not use for your blocks are the ones the compiler already knows', () => {
  for (const word of ['forward', 'fd', 'repeat', 'xcor', 'random', 'sqrt', 'make', 'to', 'end', 'wait', 'write']) assert.ok(BUILTIN_WORDS.has(word), word);
  assert.ok(!BUILTIN_WORDS.has('square'));
});

test('the Logo starts with the program itself: no heading and no comments from sticky notes', () => {
  for (const sample of SAMPLES) {
    const text = toLogo({ stacks: sampleStacks(sample) });
    assert.ok(!/^\s*;/m.test(text), `${sample.id} has a comment line:\n${text.split('\n').slice(0, 3).join('\n')}`);
    assert.ok(!text.includes(sample.note.slice(0, 30)), `${sample.id}: the note is not in the Logo`);
    assert.ok(!text.startsWith('\n') && text.endsWith('\n') && !text.endsWith('\n\n'), `${sample.id}: starts and ends tidily`);
  }
  assert.match(toLogo({ stacks: sampleStacks(SAMPLES.find((s) => s.id === 'square')) }), /^clearscreen\nsetpencolor/);
  assert.match(toLogo({ stacks: sampleStacks(SAMPLES.find((s) => s.id === 'own-block')) }), /^to square :size\n/);
});

test('compileLogo remembers what each variable was called, and toLogo can write the program out with those words', () => {
  const typed = 'make "size 40 make "Angle 90 make "box3 7\nrepeat 4 [ fd :size rt :angle ]\nprint :box3';
  const compiled = compileLogo(typed);
  assert.equal(compiled.ok, true, compiled.error);
  assert.deepEqual(compiled.boxNames, ['size', 'angle', 'box3'], 'box 1 is size, box 2 is angle, box 3 is called box3');
  const text = toLogo({ stacks: compiled.stacks }, { boxNames: compiled.boxNames });
  assert.match(text, /^make "size 40$/m);
  assert.match(text, /^make "angle 90$/m);
  assert.match(text, /^make "box3 7$/m);
  assert.match(text, /^ {2}forward :size$/m);
  assert.match(text, /^ {2}right :angle$/m);
  // Without the names (the blocks on the page), a variable is just its box.
  assert.match(toLogo({ stacks: compiled.stacks }), /^make "box1 40$/m);
});

// ---- The ask block ---------------------------------------------------------------------------------------------------------------------------------

/** Run blocks the way the page does, answering each question from `answers` in turn. */
function runAnswering(blocks, answers, stacks = []) {
  const turtle = new Turtle();
  const asked = [];
  const context = createContext({ turtle, random: seeded(7), definitions: definitionsOf({ stacks }).map });
  const steps = runBlocks(blocks, context);
  let reply;
  for (;;) {
    const { value, done } = steps.next(reply);
    reply = undefined;
    if (done) break;
    if (value instanceof Ask) {
      asked.push(value.text);
      reply = answers.shift();
    }
  }
  return { turtle, asked, boxes: context.boxes, ops: JSON.parse(JSON.stringify(turtle.ops)) };
}

test('ask: written as `ask |question|`, read back as the same block, and the answer goes in box1', () => {
  const blocks = [b('start'), { op: 'ask', args: [], text: 'How many sides?' }, rep({ op: 'box1' }, b('forward', 40), b('right', { op: 'divide', args: [360, { op: 'box1' }] }))];
  const text = toLogo({ stacks: [{ x: 0, y: 0, blocks: blocks }] });
  assert.match(text, /^ask \|How many sides\?\|$/m);
  assert.ok(!/make "box1/.test(text), 'TurtleLab Logo keeps its boxes by itself (only the JSLogo version makes them first)');
  const back = compileLogo(text);
  assert.equal(back.ok, true, back.error);
  assert.deepEqual(back.main.filter((block) => block.op === 'ask').map((block) => block.text), ['How many sides?']);
  // the same question and the same drawing, for three answers (a whole one, a decimal one and a bad one)
  for (const answer of [5, 3, 4.5, 0]) {
    const here = runAnswering(blocks.slice(1), [answer]);
    const there = runAnswering(back.main, [answer], back.stacks);
    assert.deepEqual(there.asked, ['How many sides?']);
    assert.deepEqual(there.ops, here.ops, `answer ${answer}`);
    assert.equal(there.boxes[0], answer);
  }
  assert.equal(runAnswering(blocks.slice(1), [5]).ops.filter((op) => op.type === 'line').length, 5, 'ask 5 draws five sides');
});

test('ask: a name of your own never takes box1, since the answer is in box1', () => {
  const result = compileLogo('ask |Sides?|\nmake "size :box1\nrepeat :size [ forward 10 right 360 / :size ]');
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(result.main.map((block) => block.op), ['ask', 'store2', 'repeat'], 'size is box2, so asking does not overwrite it');
  assert.equal(result.boxNames[1], 'size');
  // without ask, the first name still gets box1
  assert.equal(compileLogo('make "size 5\nforward :size').main[0].op, 'store1');
});

test('ask: the Logo says what is wrong when the question is missing or too long', () => {
  assert.match(errorOf('ask').error, /needs the question/);
  assert.match(errorOf('ask 5').error, /needs the question/);
  assert.match(errorOf(`ask |${'x'.repeat(61)}|`).error, /at most 60 letters/);
  assert.equal(compileLogo(`ask |${'x'.repeat(60)}|`).ok, true);
  assert.match(toLogo({ stacks: [{ x: 0, y: 0, blocks: [b('start'), { op: 'ask', args: [], text: 'a|b' }] }] }), /^ask \|ab\|$/m, 'a bar in the question cannot break the Logo');
});

// ---- Click handlers: onclick [ ... ], mousex and mousey ---------------------------------------------------------------------------------------

/** Run a click handler's blocks as the page does: the click's place is set first. */
function runClick(blocks, at, stacks = []) {
  const turtle = new Turtle();
  const context = createContext({ turtle, definitions: definitionsOf({ stacks }).map });
  context.mouse = at;
  for (const step of runBlocks(blocks, context)) void step;
  return { ops: JSON.parse(JSON.stringify(turtle.ops)), state: { x: turtle.x, y: turtle.y, heading: turtle.heading } };
}

test('onclick: written as onclick [ ... ] after the program, read back as a handler, and a click draws the same either way', () => {
  const handler = [b('penup'), b('setxy', { op: 'mousex', args: [] }, { op: 'mousey', args: [] }), b('pendown'), rep(4, b('forward', 20), b('right', 90))];
  const project = { stacks: [{ x: 0, y: 0, blocks: [b('start'), b('clean')] }, { x: 300, y: 0, blocks: [{ op: 'onclick', args: [] }, ...handler] }] };
  const text = toLogo(project);
  assert.match(text, /^onclick \[\n  penup\n  setxy mousex mousey\n  pendown\n  repeat 4 \[\n    forward 20\n    right 90\n  \]\n\]$/m);
  assert.ok(text.indexOf('clearscreen') < text.indexOf('onclick'), 'the handler comes after the program');
  assert.ok(!/not connected to Start/.test(text), 'a handler is not a stray stack');
  const back = compileLogo(text);
  assert.equal(back.ok, true, back.error);
  const handlers = handlersOf({ stacks: back.stacks });
  assert.equal(handlers.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(handlers[0].blocks)), handler, 'the same blocks come back');
  for (const at of [{ x: 40, y: -30 }, { x: -200, y: 150 }, { x: 0, y: 0 }]) assert.deepEqual(runClick(handlers[0].blocks, at), runClick(handler, at), `a click at ${at.x}, ${at.y}`);
  assert.equal(runClick(handler, { x: 40, y: -30 }).ops.filter((op) => op.type === 'line').length, 4, 'a click draws a square');
});

test('onclick: several handlers, a page with only a handler, and the places it may not go', () => {
  const two = compileLogo('forward 5\nonclick [ forward 1 ]\nonclick [ back 2 ]\nright 90');
  assert.equal(two.ok, true, two.error);
  assert.deepEqual(two.main.map((block) => block.op), ['forward', 'right'], 'handlers are not part of the program');
  assert.deepEqual(handlersOf({ stacks: two.stacks }).map((handler) => handler.blocks[0].op), ['forward', 'back'], 'in the order written');
  const only = compileLogo('onclick [ setxy mousex mousey ]');
  assert.equal(only.ok, true, only.error);
  assert.deepEqual(only.main, []);
  assert.equal(handlersOf({ stacks: only.stacks }).length, 1);
  assert.match(errorOf('repeat 3 [ onclick [ forward 1 ] ]').error, /onclick goes on a line of its own/);
  assert.match(errorOf('to dot\n onclick [ forward 1 ]\nend').error, /onclick goes on a line of its own/);
  assert.match(errorOf('onclick forward 1').error, /needs a list of commands in \[ square brackets \]/);
  assert.equal(compileLogo('forward mousex').ok, true, 'mousex and mousey work anywhere');
  assert.equal(toLogo({ stacks: [{ x: 0, y: 0, blocks: [{ op: 'onclick', args: [] }, b('forward', 3)] }] }).trim(), 'onclick [\n  forward 3\n]', 'a page with only a handler is written too');
});

// ---- and, or and not ------------------------------------------------------------------------------------------

test('and, or and not: typed the way real Logo has them, with the tests as they are, in brackets or not', () => {
  const inside = (x) => `make "box1 ${x}\nif and :box1 > -50 :box1 < 50 [ print 1 ]\nifelse and (:box1 > -50) (:box1 < 50) [ print 2 ] [ print 3 ]`;
  assert.deepEqual(printedBy(inside(0)), ['1', '2']);
  assert.deepEqual(printedBy(inside(70)), ['3']);
  assert.deepEqual(printedBy('make "a 5\nif or :a < 0 :a > 3 [ print 1 ]\nif not :a > 3 [ print 2 ]\nif not (or :a < 0 :a > 9) [ print 3 ]'), ['1', '3']);
  // more than two, in brackets, are an and inside an and
  assert.deepEqual(printedBy('make "a 5\nif (and :a > 1 :a < 9 :a = 5) [ print 1 ]\nif (and :a > 1 :a < 9 :a = 6) [ print 2 ]\nif (or :a = 1 :a = 2 :a = 5) [ print 3 ]'), ['1', '3']);
  // a test in brackets is the test itself, not a ( ) block (which only holds numbers)
  const found = compileLogo('make "a 1\nif (:a < 2) [ print 1 ]');
  assert.equal(found.main[1].args[0].op, 'less');
  // a block named and is no longer an and: the generator gives your block another word
  assert.ok(BUILTIN_WORDS.has('and') && BUILTIN_WORDS.has('or') && BUILTIN_WORDS.has('not'));
});

test('and, or and not: written out as brackets round every test, and read back as the same blocks', () => {
  const inside = b('and', b('greater', b('mousex'), -50), b('less', b('mousex'), 50));
  const blocks = [b('start'), { op: 'if', args: [b('or', b('not', inside), b('equal', 1, 2))], body: [b('print', 1)] }];
  const text = toLogo({ stacks: [{ x: 0, y: 0, blocks }] });
  assert.match(text, /^if \(or \(not \(and \(mousex > -50\) \(mousex < 50\)\)\) \(1 = 2\)\) \[$/m);
  const back = compileLogo(text);
  assert.equal(back.ok, true, back.error);
  assert.deepEqual(JSON.parse(JSON.stringify(back.main[0].args)), JSON.parse(JSON.stringify(blocks[1].args)), 'the very same tests');
});

test('and, or and not: a missing test is a plain complaint, and so is the wrong kind', () => {
  assert.match(errorOf('if and :box1 > 0 [ print 1 ]').error, /and needs 2 tests after it, and I only found 1/);
  assert.match(errorOf('if not [ print 1 ]').error, /not needs a test, like :size > 10, after it/);
  // a number is not a test: the blocks say so when they run, on the line
  const result = compileLogo('if and 1 2 [ print 1 ]');
  assert.equal(result.ok, true);
  assert.throws(() => run(result.main, result.stacks), (e) => e instanceof RunError && /yes or no/.test(e.message));
});
