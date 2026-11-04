// TurtleLab: your blocks, written as Logo.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The text the Logo box shows. It is the same program as the blocks, in the language the turtle was made
// for (and nothing else: no heading, and the sticky notes stay on the page), and logo-compile.js reads it back (so you can change it and press Run Logo). A test writes the
// blocks out, reads them in again and checks the drawing is exactly the same.
//
// `short: true` writes the abbreviations (fd, rt, pu) and `short: false` the whole words (forward, right,
// penup). Both are read the same way. Never touches the screen.

import { definitionsOf } from './definitions.js';
import { findRunStack } from './project.js';
import { nameKey, tidyName } from './names.js';
import { formatNumber } from './format.js';
import { BUILTIN_WORDS, LOGO_NAMES } from './logo-compile.js';

// How tightly each kind of expression holds together, so brackets only go where they are needed.
const COMPARE = 1;
const SUM = 2;
const PRODUCT = 3;
const ATOM = 4;
const atom = (text) => ({ text, prec: ATOM });

const INDENT = '  ';

/** A Logo word for a name: letters, numbers and underscores, not a Logo word already, and different from the rest in `taken`. */
function logoName(name, taken, { builtin = true } = {}) {
  let base = tidyName(name).replace(/ /g, '_').replace(/[^A-Za-z0-9_]/g, '');
  if (base === '' || /^[0-9]/.test(base)) base = `b${base}`;
  if (builtin && (BUILTIN_WORDS.has(base.toLowerCase()) || /^box\d+$/i.test(base))) base = `${base}_`;
  let candidate = base;
  for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) candidate = `${base}${n}`;
  taken.add(candidate.toLowerCase());
  return candidate;
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

const num = (value) => formatNumber(value);

// ---- Numbers -------------------------------------------------------------------------------------------

/** A socket's contents: { text, prec }. */
function expr(arg, ctx) {
  if (arg === null || arg === undefined) return atom('0'); // an empty box (running the blocks would complain)
  if (typeof arg === 'number') return atom(num(arg));
  const a = (i) => expr(arg.args?.[i], ctx);
  const wrapped = (made) => (made.prec < ATOM ? `(${made.text})` : made.text);
  const infix = (symbol, prec, left, right) => {
    const l = left.prec < prec ? `(${left.text})` : left.text;
    // The right side is wrapped when it is just as tight, so a - (b - c) keeps its brackets.
    const r = right.prec <= prec ? `(${right.text})` : right.text;
    return { text: `${l} ${symbol} ${r}`, prec };
  };
  switch (arg.op) {
    case 'x': return atom('xcor');
    case 'y': return atom('ycor');
    case 'heading': return atom('heading');
    case 'pensize': return atom('pensize');
    case 'penred': return atom('penred');
    case 'pengreen': return atom('pengreen');
    case 'penblue': return atom('penblue');
    case 'paren': return atom(`(${a(0).text})`);
    case 'add': return infix('+', SUM, a(0), a(1));
    case 'subtract': return infix('-', SUM, a(0), a(1));
    case 'multiply': return infix('*', PRODUCT, a(0), a(1));
    case 'divide': return infix('/', PRODUCT, a(0), a(1));
    case 'mod': return infix('%', PRODUCT, a(0), a(1));
    case 'less': return infix('<', COMPARE, a(0), a(1));
    case 'greater': return infix('>', COMPARE, a(0), a(1));
    case 'equal': return infix('=', COMPARE, a(0), a(1));
    case 'random': return atom(`(random ${wrapped(a(0))} ${wrapped(a(1))})`);
    case 'oneof': return atom(`(oneof ${wrapped(a(0))} ${wrapped(a(1))})`);
    case 'input': return atom(`:${ctx.params?.get(nameKey(arg.name ?? '')) ?? logoName(arg.name ?? 'input', new Set(), { builtin: false })}`);
    default: {
      const box = /^box(\d+)$/.exec(arg.op);
      if (box) return atom(`:box${box[1]}`);
      return atom('0');
    }
  }
}

/** The text of a socket for use right after a command word. Nothing needs brackets: the whole line is one input. */
const input = (arg, ctx) => expr(arg, ctx).text;

// ---- Commands ------------------------------------------------------------------------------------------

/** Logo for a list of blocks, as lines at this depth. */
function lines(blocks, depth, ctx) {
  const out = [];
  for (const block of blocks) out.push(...statement(block, depth, ctx));
  return out;
}

const pad = (depth, text) => INDENT.repeat(depth) + text;

/** The lines for the blocks inside a [ ] list: open the bracket on the end of `head`, indent the blocks, close it. */
function listed(head, blocks, depth, ctx, tail = '') {
  if (!blocks || blocks.length === 0) return [pad(depth, `${head} []${tail}`)];
  return [pad(depth, `${head} [`), ...lines(blocks, depth + 1, ctx), pad(depth, `]${tail}`)];
}

function statement(block, depth, ctx) {
  const word = (op) => (ctx.short ? LOGO_NAMES[op].short : LOGO_NAMES[op].long);
  const one = (text) => [pad(depth, text)];
  const args = (i) => input(block.args?.[i], ctx);
  switch (block.op) {
    case 'start':
      return [];
    case 'note':
      return wrap(block.text ?? '', 70).map((text) => pad(depth, `; ${text}`.trimEnd()));
    case 'to':
      return [];
    case 'forward': case 'back': case 'left': case 'right': case 'setheading': case 'setpensize': case 'print': case 'speed':
      return one(`${word(block.op)} ${args(0)}`);
    case 'arc': case 'setxy':
      return one(`${word(block.op)} ${args(0)} ${args(1)}`);
    case 'penup': case 'pendown': case 'clean': case 'startfill': case 'endfill': case 'stop':
      return one(word(block.op));
    case 'setcolor':
    case 'fillscreen': {
      const command = block.op === 'setcolor' ? (ctx.short ? 'setpc' : 'setpencolor') : ctx.short ? 'setsc' : 'setscreencolor';
      const channels = [0, 1, 2].map((i) => block.args?.[i]);
      // Three plain numbers go in a list, like [255 0 0]. Anything worked out goes in as three inputs.
      return one(channels.every((c) => typeof c === 'number') ? `${command} [${channels.map(num).join(' ')}]` : `${command} ${channels.map((c) => input(c, ctx)).join(' ')}`);
    }
    case 'wait': {
      // Real Logo counts a wait in 60ths of a second. The block counts tenths.
      const tenths = block.args?.[0];
      return one(`wait ${typeof tenths === 'number' ? num(tenths * 6) : `(${input(tenths, ctx)}) * 6`}`);
    }
    case 'write':
      return one(`write |${(block.text ?? '').replace(/\|/g, '')}| ${args(0)}`);
    case 'repeat':
      return listed(`repeat ${args(0)}`, block.body, depth, ctx);
    case 'forever':
      return listed('forever', block.body, depth, ctx);
    case 'if':
      return listed(`if ${args(0)}`, block.body, depth, ctx);
    case 'ifelse': {
      // ifelse test [ ... ] [ ... ]: the second list starts on the line where the first one closes.
      const head = `ifelse ${args(0)}`;
      const thenLines = lines(block.body ?? [], depth + 1, ctx);
      const elseLines = lines(block.elseBody ?? [], depth + 1, ctx);
      const out = thenLines.length > 0 ? [pad(depth, `${head} [`), ...thenLines, pad(depth, '] [')] : [pad(depth, `${head} [] [`)];
      if (elseLines.length > 0) return [...out, ...elseLines, pad(depth, ']')];
      out[out.length - 1] += ']';
      return out;
    }
    case 'call': {
      const name = ctx.procedures.get(nameKey(block.name ?? '')) ?? logoName(block.name ?? 'block', new Set());
      return one([name, ...(block.args ?? []).map((arg) => input(arg, ctx))].join(' '));
    }
    default: {
      const store = /^store(\d+)$/.exec(block.op);
      if (store) return one(`make "box${store[1]} ${args(0)}`);
      return [];
    }
  }
}

// ---- The program -----------------------------------------------------------------------------------------

/**
 * The Logo for a project, as a string that always ends in a newline (or a short comment if the page has nothing to
 * translate).
 *
 * @param {object} project
 * @param {object} [options]
 * @param {boolean} [options.short] write fd, rt, pu and the like instead of forward, right and penup
 */
export function toLogo(project, { short = false } = {}) {
  const { map: definitions } = definitionsOf(project);
  const { stack: main } = findRunStack(project);
  const defined = [...definitions.values()];
  if (!main && defined.length === 0) return '; Drag some blocks onto the page and the Logo for them shows up here.\n';

  // Logo names for the blocks you made, and (inside each) for their inputs.
  const taken = new Set();
  const procedures = new Map();
  for (const found of defined) procedures.set(nameKey(found.name), logoName(found.name, taken));

  const out = [];
  const add = (text = '') => out.push(text);

  for (const found of defined) {
    const params = new Map();
    const usedParams = new Set();
    for (const param of found.params) params.set(nameKey(param), logoName(param, usedParams, { builtin: false }));
    const ctx = { short, procedures, params };
    add(`to ${[procedures.get(nameKey(found.name)), ...[...params.values()].map((p) => `:${p}`)].join(' ')}`);
    for (const text of lines(found.body, 1, ctx)) add(text);
    add('end');
    add();
  }

  if (main) {
    const ctx = { short, procedures, params: null };
    for (const text of lines(main.blocks, 0, ctx)) add(text);
  } else {
    add('; Nothing runs yet: add a Start block, and under it a call to your block.');
  }

  const loose = project.stacks.filter((stack) => {
    const op = stack.blocks[0]?.op;
    return stack !== main && op !== 'note' && op !== 'to' && stack.blocks.length > 0;
  }).length;
  if (loose > 0) {
    add();
    add(`; ${loose === 1 ? 'One other stack of blocks is' : `${loose} other stacks of blocks are`} not connected to Start, so Run does not use ${loose === 1 ? 'it' : 'them'}.`);
  }

  const text = out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  return `${text}\n`;
}
