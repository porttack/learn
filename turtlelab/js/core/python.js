// TurtleLab: the blocks, written as Python.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// toPython(project) turns what is on the page into a Python program that uses the
// turtle module that comes with Python, so a student who is learning Python can
// read the same program in both languages (and paste it into IDLE or Thonny).
//
// The two do not agree about everything, so some blocks need translating:
//   heading     TurtleLab 0 is up and turns clockwise; Python's 0 is east and turns
//               counterclockwise, so a heading becomes 90 - heading.
//   arc         a positive angle curves right: circle(-radius, angle) in Python,
//               where a negative radius puts the circle's center on the right.
//   color       one color for the pen and for filling, which is Python's color().
//   clean       becomes a small function at the top (it needs several turtle calls).
//   boxes       plain variables, with `global` where a block of your own changes one.
// Blocks you make are Python functions, and inputs are their parameters.
//
// This only writes text. A test runs the Python it makes (against a stand-in for the
// turtle module) and checks it ends up where TurtleLab's own interpreter does.

import { findRunStack, walkBlocks } from './project.js';
import { definitionsOf, isDefinition } from './definitions.js';
import { nameKey, tidyName } from './names.js';
import { formatNumber } from './format.js';
import { SPEED_NAMES } from './blocks-spec.js';

const INDENT = '    ';

// Names a block, an input or a box must not be called in Python, or the program would
// change meaning: Python's own words, and every name the program itself uses.
const PYTHON_WORDS = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case type'.split(' '),
);
const USED_BY_PROGRAM = new Set(
  'forward backward left right goto setheading circle penup pendown pensize pencolor color begin_fill end_fill clear home xcor ycor heading speed bgcolor colormode done clean random time print range int abs exit'.split(' '),
);

/** A Python speed (0 is fastest) for each TurtleLab speed: slow, medium, fast, instant. */
const PYTHON_SPEEDS = { slow: 1, medium: 3, fast: 6, instant: 0 };

// How tightly an expression holds together, so parentheses only go where they are needed.
const COMPARE = 1;
const SUM = 2;
const PRODUCT = 3;
const NEGATIVE = 4;
const ATOM = 5;

const atom = (text) => ({ text, prec: ATOM });
const fmt = (value) => formatNumber(value);

/** Write a Python identifier for `name`, different from everything in `taken` (which grows). */
function identifier(name, taken) {
  let base = tidyName(name).replace(/ /g, '_').replace(/[^\p{L}\p{N}_]/gu, '');
  if (base === '' || /^\p{N}/u.test(base)) base = `_${base}`;
  if (PYTHON_WORDS.has(base) || USED_BY_PROGRAM.has(base) || /^box\d+$/.test(base)) base = `${base}_`;
  let candidate = base;
  for (let n = 2; taken.has(candidate); n += 1) candidate = `${base}${n}`;
  taken.add(candidate);
  return candidate;
}

/** Which boxes, turtle features and modules a list of blocks uses. */
function survey(stacks) {
  const found = { boxes: new Set(), colors: false, random: false, time: false, clean: false };
  for (const blocks of stacks) {
    walkBlocks(blocks, (block) => {
      const box = /^(?:store|box)(\d+)$/.exec(block.op);
      if (box) found.boxes.add(Number(box[1]));
      if (['setcolor', 'fillscreen', 'penred', 'pengreen', 'penblue'].includes(block.op)) found.colors = true;
      if (block.op === 'random' || block.op === 'oneof') found.random = true;
      if (block.op === 'wait') found.time = true;
      if (block.op === 'clean') found.clean = found.colors = true;
    });
  }
  return found;
}

/**
 * The Python for a project. Returns the program as a string (always ending in a
 * newline), or a short comment if there is nothing on the page to translate.
 */
export function toPython(project) {
  const { map: definitions } = definitionsOf(project);
  const { stack: main } = findRunStack(project);
  const notes = project.stacks.filter((stack) => stack.blocks[0]?.op === 'note').sort((a, b) => a.y - b.y || a.x - b.x);
  const defined = [...definitions.values()];
  if (!main && defined.length === 0) {
    return '# Drag some blocks onto the page and the Python for them shows up here.\n';
  }

  // Python names for the blocks you made, and (inside each) for their inputs.
  const taken = new Set();
  const functionNames = new Map();
  for (const found of defined) functionNames.set(nameKey(found.name), identifier(found.name, taken));
  const parameterNames = new Map();
  for (const found of defined) {
    const names = new Map();
    for (const param of found.params) names.set(nameKey(param), identifier(param, new Set([...taken, ...names.values()])));
    parameterNames.set(nameKey(found.name), names);
  }

  const mainBlocks = main ? main.blocks : [];
  const uses = survey([mainBlocks, ...defined.map((found) => found.body)]);
  // TurtleLab's turtle starts facing up with a red pen and Python's faces east with a
  // black one, so a program that does not begin with `clean` is given that start.
  const needsStart = Boolean(main) && mainBlocks.find((block) => block.op !== 'start')?.op !== 'clean';
  if (needsStart) uses.colors = true;
  const lines = [];
  const add = (text = '') => lines.push(text);

  add('# Python version of your blocks, using the turtle module.');
  add('# It is written to do what the blocks do, but the two are not identical.');
  if (notes.length > 0) {
    add('#');
    for (const note of notes) {
      for (const text of wrap(note.blocks[0].text ?? '', 62)) add(`# ${text}`.trimEnd());
    }
  }
  add();
  add('from turtle import *');
  if (uses.random) add('import random');
  if (uses.time) add('import time');
  add();
  if (uses.colors) add('colormode(255)');

  if (uses.clean) {
    add();
    add();
    add('def clean():');
    add(`${INDENT}clear()`);
    add(`${INDENT}penup()`);
    add(`${INDENT}home()`);
    add(`${INDENT}setheading(90)`);
    add(`${INDENT}pendown()`);
    add(`${INDENT}color(255, 0, 0)`);
    add(`${INDENT}pensize(5)`);
  }
  const boxes = [...uses.boxes].sort((a, b) => a - b);
  if (boxes.length > 0) {
    add();
    for (const n of boxes) add(`box${n} = 0`);
  }

  for (const found of defined) {
    const key = nameKey(found.name);
    const context = { functionNames, parameters: parameterNames.get(key), inFunction: true, taken };
    const params = found.params.map((param) => parameterNames.get(key).get(nameKey(param))).join(', ');
    add();
    add();
    add(`def ${functionNames.get(key)}(${params}):`);
    const assigned = new Set();
    walkBlocks(found.body, (block) => {
      const box = /^store(\d+)$/.exec(block.op);
      if (box) assigned.add(Number(box[1]));
    });
    if (assigned.size > 0) add(`${INDENT}global ${[...assigned].sort((a, b) => a - b).map((n) => `box${n}`).join(', ')}`);
    body(found.body, 1, context).forEach((line) => add(line));
  }

  if (main) {
    const context = { functionNames, parameters: new Map(), inFunction: false, taken };
    add();
    add();
    add('# Your program starts here');
    if (needsStart) {
      add('setheading(90)');
      add('color(255, 0, 0)');
      add('pensize(5)');
    }
    body(mainBlocks, 0, context).forEach((line) => add(line));
    add('done()');
  } else {
    add();
    add('# Nothing runs yet: add a Start block, and under it a call to your block.');
  }

  const loose = project.stacks.filter((stack) => {
    const op = stack.blocks[0]?.op;
    return stack !== main && op !== 'note' && op !== 'to' && stack.blocks.length > 0;
  }).length;
  if (loose > 0) {
    add();
    add(`# ${loose === 1 ? 'One other stack of blocks is' : `${loose} other stacks of blocks are`} not connected to Start, so Run does not use ${loose === 1 ? 'it' : 'them'}.`);
  }

  // Tidy: never more than two blank lines in a row, and one newline at the end.
  const text = lines.join('\n').replace(/\n{4,}/g, '\n\n\n').replace(/\s+$/, '');
  return `${text}\n`;
}

/** Break words into lines no longer than `width` letters. */
function wrap(text, width) {
  const out = [];
  for (const paragraph of String(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && line.length + 1 + word.length > width) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    out.push(line);
  }
  return out;
}

// ---- Statements ------------------------------------------------------------------------------

/** Python for a list of blocks, as lines at this indent. An empty list is `pass`. */
function body(blocks, depth, context) {
  const lines = [];
  for (const block of blocks) lines.push(...statement(block, depth, context));
  return lines.length > 0 ? lines : [pad(depth, 'pass')];
}

const pad = (depth, text) => INDENT.repeat(depth) + text;

function statement(block, depth, context) {
  const line = (text) => [pad(depth, text)];
  const a = (i) => expr(block.args?.[i], context).text;
  switch (block.op) {
    case 'start':
    case 'note':
    case 'to':
      return [];
    case 'clean':
      return line('clean()');
    case 'forward':
      return line(`forward(${a(0)})`);
    case 'back':
      return line(`backward(${a(0)})`);
    case 'left':
      return line(`left(${a(0)})`);
    case 'right':
      return line(`right(${a(0)})`);
    case 'arc': {
      const [angle, radius] = [block.args?.[0], block.args?.[1]];
      if (typeof angle === 'number') {
        // A positive angle curves right: Python wants a negative radius for that.
        return line(angle >= 0 ? `circle(${negated(radius, context)}, ${fmt(angle)})` : `circle(${a(1)}, ${fmt(-angle)})`);
      }
      const angleText = expr(angle, context, COMPARE + 1).text;
      return line(`circle(${negated(radius, context)} if ${angleText} >= 0 else ${a(1)}, abs(${a(0)}))`);
    }
    case 'setxy':
      return line(`goto(${a(0)}, ${a(1)})`);
    case 'setheading': {
      const d = block.args?.[0];
      return line(`setheading(${typeof d === 'number' ? fmt(90 - d) : `90 - ${expr(d, context, PRODUCT).text}`})`);
    }
    case 'penup':
      return line('penup()');
    case 'pendown':
      return line('pendown()');
    case 'setpensize':
      return line(`pensize(${a(0)})`);
    case 'setcolor':
      return line(`color(${a(0)}, ${a(1)}, ${a(2)})`);
    case 'fillscreen':
      return line(`bgcolor(${a(0)}, ${a(1)}, ${a(2)})`);
    case 'startfill':
      return line('begin_fill()');
    case 'endfill':
      return line('end_fill()');
    case 'print':
      return line(`print(${a(0)})`);
    case 'wait': {
      const tenths = block.args?.[0];
      return line(`time.sleep(${typeof tenths === 'number' ? fmt(tenths / 10) : `${expr(tenths, context, PRODUCT).text} / 10`})`);
    }
    case 'speed': {
      const n = block.args?.[0];
      if (typeof n !== 'number') return line(`# speed block: ${a(0)} (1 is slow, 4 is instant)`);
      const name = SPEED_NAMES[Math.min(SPEED_NAMES.length, Math.max(1, Math.round(n))) - 1];
      return line(`speed(${PYTHON_SPEEDS[name]})  # ${name}`);
    }
    case 'stop':
      return line(context.inFunction ? 'return' : 'exit()');
    case 'repeat': {
      const n = block.args?.[0];
      const count = typeof n === 'number' ? fmt(Math.floor(n)) : `int(${expr(n, context).text})`;
      return [pad(depth, `for _ in range(${count}):`), ...body(block.body ?? [], depth + 1, context)];
    }
    case 'forever':
      return [pad(depth, 'while True:'), ...body(block.body ?? [], depth + 1, context)];
    case 'if':
      return [pad(depth, `if ${a(0)}:`), ...body(block.body ?? [], depth + 1, context)];
    case 'ifelse':
      return [
        pad(depth, `if ${a(0)}:`),
        ...body(block.body ?? [], depth + 1, context),
        pad(depth, 'else:'),
        ...body(block.elseBody ?? [], depth + 1, context),
      ];
    case 'call': {
      const key = nameKey(block.name ?? '');
      const known = context.functionNames.get(key);
      const name = known ?? identifier(block.name ?? '', new Set(context.taken));
      const args = (block.args ?? []).map((arg) => expr(arg, context).text).join(', ');
      return line(`${name}(${args})${known ? '' : `  # there is no block called ${block.name}`}`);
    }
    default: {
      const box = /^store(\d+)$/.exec(block.op);
      if (box) return line(`box${box[1]} = ${a(0)}`);
      return line(`# ${block.op} has no Python version`);
    }
  }
}

// ---- Expressions -----------------------------------------------------------------------------

/** The text for something that is negated: -radius, with a number turned over instead. */
function negated(arg, context) {
  if (typeof arg === 'number') return fmt(-arg);
  return `-${expr(arg, context, NEGATIVE + 1).text}`;
}

/**
 * Python for one socket's content: a number, an empty socket (None), or a reporter.
 * With `need`, an expression that holds together less tightly than that is put in parentheses.
 * Returns { text, prec, symbol }.
 */
function expr(arg, context, need = 0) {
  const made = build(arg, context);
  return made.prec < need ? { text: `(${made.text})`, prec: ATOM } : made;
}

function binary(symbol, level, left, right, context) {
  const l = expr(left, context, level);
  let r = expr(right, context);
  const sameAndSafe = r.prec === level && r.symbol === symbol && (symbol === '+' || symbol === '*');
  if (r.prec < level || (r.prec === level && !sameAndSafe) || (typeof right === 'number' && right < 0)) r = { text: `(${r.text})`, prec: ATOM };
  return { text: `${l.text} ${symbol} ${r.text}`, prec: level, symbol };
}

function build(arg, context) {
  if (arg === null || arg === undefined) return atom('None'); // an empty socket: it fails the same way the blocks do
  if (typeof arg === 'number') return { text: fmt(arg), prec: arg < 0 ? NEGATIVE : ATOM };
  const [first, second] = arg.args ?? [];
  switch (arg.op) {
    case 'x':
      return atom('xcor()');
    case 'y':
      return atom('ycor()');
    case 'heading':
      return atom('(90 - heading()) % 360');
    case 'pensize':
      return atom('pensize()');
    case 'penred':
      return atom('pencolor()[0]');
    case 'pengreen':
      return atom('pencolor()[1]');
    case 'penblue':
      return atom('pencolor()[2]');
    case 'paren':
      return atom(`(${expr(first, context).text})`);
    case 'add':
      return binary('+', SUM, first, second, context);
    case 'subtract':
      return binary('-', SUM, first, second, context);
    case 'multiply':
      return binary('*', PRODUCT, first, second, context);
    case 'divide':
      return binary('/', PRODUCT, first, second, context);
    case 'mod':
      return binary('%', PRODUCT, first, second, context);
    case 'less':
      return compare('<', first, second, context);
    case 'greater':
      return compare('>', first, second, context);
    case 'equal':
      return compare('==', first, second, context);
    case 'random': {
      const whole = Number.isInteger(first) && Number.isInteger(second);
      return atom(`random.${whole ? 'randint' : 'uniform'}(${expr(first, context).text}, ${expr(second, context).text})`);
    }
    case 'oneof':
      return atom(`random.choice([${expr(first, context).text}, ${expr(second, context).text}])`);
    case 'input': {
      const known = context.parameters.get(nameKey(arg.name ?? ''));
      return atom(known ?? identifier(arg.name ?? '', new Set(context.taken)));
    }
    default: {
      const box = /^box(\d+)$/.exec(arg.op);
      if (box) return atom(`box${box[1]}`);
      return atom('None');
    }
  }
}

function compare(symbol, left, right, context) {
  const l = expr(left, context, COMPARE + 1);
  const r = expr(right, context, COMPARE + 1);
  return { text: `${l.text} ${symbol} ${r.text}`, prec: COMPARE, symbol };
}
