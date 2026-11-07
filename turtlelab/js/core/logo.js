// TurtleLab: your blocks, written as Logo.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The text the Logo box shows. It is the same program as the blocks, in the language the turtle was made
// for (and nothing else: no heading, and the sticky notes stay on the page), and logo-compile.js reads it back (so you can change it and press Run Logo). A test writes the
// blocks out, reads them in again and checks the drawing is exactly the same.
//
// `short: true` writes the abbreviations (fd, rt, pu) and `short: false` the whole words (forward, right,
// penup). Both are read the same way.
//
// `jslogo: true` writes the same program for JSLogo (the real Logo copy on this site, /logo/) instead, which
// differs from TurtleLab's Logo in a few places: colors, arc, clean, fills, % and oneof (see the jslogo
// functions below). It is what the Logo box's "Open in real Logo" button sends.
//
// Never touches the screen.

import { definitionsOf } from './definitions.js';
import { findRunStack, handlersOf, walkBlocks } from './project.js';
import { DEFAULTS } from './turtle.js';
import { clampChannel } from './color.js';
import { JSLOGO_WORDS } from './logo-jslogo-words.js';
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
function logoName(name, taken, { builtin = true, reserved = null } = {}) {
  let base = tidyName(name).replace(/ /g, '_').replace(/[^A-Za-z0-9_]/g, '');
  if (base === '' || /^[0-9]/.test(base)) base = `b${base}`;
  if (builtin && (BUILTIN_WORDS.has(base.toLowerCase()) || reserved?.has(base.toLowerCase()) || /^box\d+$/i.test(base))) base = `${base}_`;
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

/** The Logo word for box n: the name the student gave the variable when this came from typed Logo, else box1 to box4. */
const boxName = (ctx, n) => ctx.boxNames?.[n - 1] ?? `box${n}`;

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
  if (ctx.jslogo) {
    const made = jslogoExpr(arg, ctx, a, wrapped);
    if (made) return made;
  }
  switch (arg.op) {
    case 'x': return atom('xcor');
    case 'y': return atom('ycor');
    case 'heading': return atom('heading');
    case 'pensize': return atom('pensize');
    case 'penred': return atom('penred');
    case 'pengreen': return atom('pengreen');
    case 'penblue': return atom('penblue');
    case 'mousex': return atom('mousex');
    case 'mousey': return atom('mousey');
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
      if (box) return atom(`:${boxName(ctx, Number(box[1]))}`);
      return atom('0');
    }
  }
}

/** Expressions that JSLogo spells differently. Returns null for the ones that are written the same. */
function jslogoExpr(arg, ctx, a, wrapped) {
  switch (arg.op) {
    case 'pensize': return atom('(first pensize)'); // JSLogo's pensize is a list of two numbers
    case 'penred': case 'pengreen': case 'penblue':
      ctx.state.dropped.add(arg.op);
      return atom('0');
    case 'mousex': case 'mousey':
      ctx.state.dropped.add('mousex and mousey (shown as 0)'); // JSLogo has no mouse clicks
      return atom('0');
    case 'mod':
      // JSLogo's own modulo gives 1 for -7 mod 3 (the blocks, and Python, give 2), so tlmod does it properly.
      ctx.state.usesMod = true;
      return atom(`(tlmod ${wrapped(a(0))} ${wrapped(a(1))})`);
    case 'oneof': return atom(`(item (1 + random 2) (list ${wrapped(a(0))} ${wrapped(a(1))}))`);
    default: return null;
  }
}

/** The text of a socket for use right after a command word. Nothing needs brackets: the whole line is one input. */
const input = (arg, ctx) => expr(arg, ctx).text;

// ---- Commands ------------------------------------------------------------------------------------------

/** Logo for a list of blocks, as lines at this depth. */
function lines(blocks, depth, ctx) {
  const out = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    // JSLogo fills with `filled color [ ... ]` around what is drawn, where TurtleLab has a start and an end block.
    if (ctx.jslogo && block.op === 'startfill') {
      const end = blocks.findIndex((other, k) => k > i && other.op === 'endfill');
      if (end !== -1) {
        out.push(pad(depth, 'filled pencolor ['), ...lines(blocks.slice(i + 1, end), depth + 1, ctx), pad(depth, ']'));
        i = end;
        continue;
      }
    }
    out.push(...statement(block, depth, ctx));
  }
  return out;
}

const pad = (depth, text) => INDENT.repeat(depth) + text;

/** The lines for the blocks inside a [ ] list: open the bracket on the end of `head`, indent the blocks, close it. */
function listed(head, blocks, depth, ctx, tail = '') {
  if (!blocks || blocks.length === 0) return [pad(depth, `${head} []${tail}`)];
  return [pad(depth, `${head} [`), ...lines(blocks, depth + 1, ctx), pad(depth, `]${tail}`)];
}

/** A color as JSLogo likes it: a CSS color word like "#1e50c8 (so the numbers from 0 to 255 stay exactly as they are). */
const hex = (r, g, b) => `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, '0')).join('')}`;

/** What TurtleLab's `write` block says, made safe to put in a JSLogo list (no brackets, no bars). */
const labelWords = (text) => String(text ?? '').replace(/[[\]|]/g, '');

/**
 * Commands JSLogo spells differently, or does differently. Returns null for the ones that are written the same.
 *   clean     JSLogo's clearscreen leaves the pen alone, so the pen is put back the way TurtleLab's clean leaves it
 *   arc       JSLogo's arc draws a circle around the turtle and the turtle stays put, so tlarc (see toLogo) does it
 *             by short straight steps, 3 degrees at a time
 *   colors    JSLogo's lists are 0 to 99, so a color goes in as a CSS word, or (worked out) as a scaled list
 *   fill      see lines()
 *   write     there is no script lettering, so the words are shown with label
 *   speed     there is no such thing, so it is left out
 *   stop      at the top of a program it is `bye`; inside one of your blocks it stays `stop`
 */
function jslogoStatement(block, depth, ctx) {
  const one = (text) => [pad(depth, text)];
  const arg = (i) => input(block.args?.[i], ctx);
  switch (block.op) {
    case 'clean':
      return [
        pad(depth, 'clearscreen'),
        pad(depth, 'pendown'),
        pad(depth, `setpensize ${DEFAULTS.penSize}`),
        pad(depth, `${ctx.short ? 'setpc' : 'setpencolor'} "${hex(...DEFAULTS.color)}`),
      ];
    case 'arc':
      ctx.state.usesArc = true;
      return one(`tlarc ${arg(0)} ${arg(1)}`);
    case 'setcolor':
    case 'fillscreen': {
      const command = block.op === 'setcolor' ? (ctx.short ? 'setpc' : 'setpencolor') : ctx.short ? 'setsc' : 'setscreencolor';
      const channels = [0, 1, 2].map((i) => block.args?.[i]);
      if (channels.every((c) => typeof c === 'number')) return one(`${command} "${hex(...channels)}`);
      return one(`${command} (list ${channels.map((c) => `((${input(c, ctx)}) * 99 / 255)`).join(' ')})`);
    }
    case 'speed':
      ctx.state.dropped.add('setspeed');
      return [];
    case 'ask':
      // JSLogo's readword asks with a box of its own and gives back what was typed as a word, so `sum 0` makes it a number.
      return one(`make "${boxName(ctx, 1)} sum 0 (readword [${labelWords(block.text).trim() || 'Type a number'}])`);
    case 'setfont':
    case 'setcurve':
      ctx.state.dropped.add(block.op); // JSLogo's label has one font and always runs straight
      return [];
    case 'write': {
      const words = labelWords(block.text).trim();
      ctx.state.dropped.add('write (shown with label)');
      if (words === '') return [];
      const size = block.args?.[0];
      return [pad(depth, `setlabelheight ${typeof size === 'number' ? num(Math.round(size / 0.7)) : `(${input(size, ctx)}) / 0.7`}`), pad(depth, `label [${words}]`)];
    }
    case 'stop':
      return one(ctx.inDefinition ? 'stop' : 'bye');
    case 'startfill':
    case 'endfill':
      // Only reached by one that has no partner in the same list (see lines()).
      ctx.state.dropped.add('a startfill or endfill without its partner');
      return [];
    default:
      return null;
  }
}

function statement(block, depth, ctx) {
  if (ctx.jslogo) {
    const made = jslogoStatement(block, depth, ctx);
    if (made) return made;
  }
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
    case 'forward': case 'back': case 'left': case 'right': case 'setheading': case 'setpensize': case 'print': case 'speed': case 'setcurve':
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
    case 'ask':
      return one(`ask |${(block.text ?? '').replace(/\|/g, '')}|`);
    case 'setfont':
      return one(`setfont "${block.font ?? 'script'}`);
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
      if (store) return one(`make "${boxName(ctx, Number(store[1]))} ${args(0)}`);
      return [];
    }
  }
}

// ---- The program -----------------------------------------------------------------------------------------

/** The helper JSLogo needs for TurtleLab's arc: the same curve, in short straight steps (3 degrees each). */
const TLARC = `to tlarc :angle :radius
  if or (:angle = 0) (:radius = 0) [ stop ]
  localmake "steps 1 + int ((abs :angle) / 3)
  localmake "turn :angle / :steps
  localmake "chord 2 * (abs :radius) * sin ((abs :turn) / 2)
  right :turn / 2
  repeat :steps [ forward :chord right :turn ]
  left :turn / 2
end`;

/** The helper for TurtleLab's mod: the remainder that is never negative when the second number is positive. */
const TLMOD = `to tlmod :a :b
  output remainder ((remainder :a :b) + :b) :b
end`;

/**
 * The Logo for a project, as a string that always ends in a newline (or a short comment if the page has nothing to
 * translate).
 *
 * @param {object} project
 * @param {object} [options]
 * @param {boolean} [options.short] write fd, rt, pu and the like instead of forward, right and penup
 * @param {string[]} [options.boxNames] the names typed Logo gave its variables, by box (compileLogo's boxNames), so they come out
 *        as `:size` and not `:box1`
 * @param {boolean} [options.jslogo] write it for JSLogo (the real Logo on this site) instead of for TurtleLab's own
 *        Logo: see jslogoStatement and jslogoExpr. It starts the program the way TurtleLab's turtle starts (no
 *        wrapping round the edges, a red pen of size 5, the boxes at 0), and says in one comment what had to be left out.
 */
export function toLogo(project, { short = false, jslogo = false, boxNames = [] } = {}) {
  const { map: definitions } = definitionsOf(project);
  const { stack: main } = findRunStack(project);
  const handlers = handlersOf(project);
  const defined = [...definitions.values()];
  if (!main && defined.length === 0 && handlers.length === 0) return '; Drag some blocks onto the page and the Logo for them shows up here.\n';

  // Logo names for the blocks you made, and (inside each) for their inputs. JSLogo has more words of its own.
  const taken = new Set(jslogo ? ['tlarc', 'tlmod'] : []);
  const procedures = new Map();
  for (const found of defined) procedures.set(nameKey(found.name), logoName(found.name, taken, { reserved: jslogo ? JSLOGO_WORDS : null }));

  // What the whole program shares: what had to be left out, whether tlarc is needed, which boxes are used.
  const state = { dropped: new Set(), usesArc: false, usesMod: false };
  const text = (blocks) => lines(blocks, 0, { short, procedures, params: null, jslogo, state, inDefinition: false, boxNames });

  const definitionLines = [];
  for (const found of defined) {
    const params = new Map();
    const usedParams = new Set();
    for (const param of found.params) params.set(nameKey(param), logoName(param, usedParams, { builtin: false }));
    const ctx = { short, procedures, params, jslogo, state, inDefinition: true, boxNames };
    definitionLines.push(`to ${[procedures.get(nameKey(found.name)), ...[...params.values()].map((p) => `:${p}`)].join(' ')}`);
    definitionLines.push(...lines(found.body, 1, ctx));
    definitionLines.push('end', '');
  }

  const mainLines = main ? text(main.blocks) : handlers.length > 0 ? [] : ['; Nothing runs yet: add a Start block, and under it a call to your block.'];
  // Each click handler is an onclick [ ... ] after the program. JSLogo has no mouse clicks, so there they are left out, and the program does not wait for them.
  const handlerLines = [];
  for (const handler of handlers) {
    if (jslogo) {
      state.dropped.add('onclick (JSLogo has no mouse clicks)');
      continue;
    }
    handlerLines.push('onclick [', ...lines(handler.blocks, 1, { short, procedures, params: null, jslogo, state, inDefinition: false, boxNames }), ']');
  }

  const out = [];
  const add = (line = '') => out.push(line);

  if (jslogo) {
    if (state.dropped.size > 0) add(`; Left out here, or shown another way: ${[...state.dropped].join(', ')}.`);
    if (state.usesArc) {
      add(TLARC);
      add();
    }
    if (state.usesMod) {
      add(TLMOD);
      add();
    }
  }
  for (const line of definitionLines) add(line);

  if (jslogo && main) {
    // TurtleLab's turtle never wraps round the edge, starts with a red pen of size 5, and every box starts at 0.
    add('window');
    if (main.blocks.find((block) => block.op !== 'start')?.op !== 'clean') {
      add(`setpensize ${DEFAULTS.penSize}`);
      add(`${short ? 'setpc' : 'setpencolor'} "${hex(...DEFAULTS.color)}`);
    }
    const boxes = new Set();
    for (const blocks of [main.blocks, ...defined.map((found) => found.body)]) {
      walkBlocks(blocks, (block) => {
        const box = /^(?:store|box)(\d+)$/.exec(block.op);
        if (box) boxes.add(Number(box[1]));
        if (block.op === 'ask') boxes.add(1); // (the answer goes in box1)
      });
    }
    for (const number of [...boxes].sort((a, b) => a - b)) add(`make "${boxName({ boxNames }, number)} 0`);
  }
  for (const line of mainLines) add(line);
  if (handlerLines.length > 0) {
    if (mainLines.length > 0) add();
    for (const line of handlerLines) add(line);
  }

  const loose = project.stacks.filter((stack) => {
    const op = stack.blocks[0]?.op;
    return stack !== main && op !== 'note' && op !== 'to' && op !== 'onclick' && stack.blocks.length > 0;
  }).length;
  if (loose > 0) {
    add();
    add(`; ${loose === 1 ? 'One other stack of blocks is' : `${loose} other stacks of blocks are`} not connected to Start, so Run does not use ${loose === 1 ? 'it' : 'them'}.`);
  }

  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  return `${joined}\n`;
}

/**
 * The address that opens JSLogo with this program in it and runs it. The program goes after the # (which a browser
 * never sends anywhere). JSLogo turns every underscore in the address into a space, so those are written as %5F.
 * `base` is where JSLogo is, from the page this is called on.
 */
export function jsLogoAddress(code, base = '../logo/') {
  return `${base}#${encodeURIComponent(code).replace(/_/g, '%5F')}`;
}
