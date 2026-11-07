// TurtleLab: Logo text turned into blocks, so it can be run.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Logo is the language the turtle was invented for. This reads a program written in a small, friendly
// Logo and turns it into the very same block trees the editor makes, so the blocks' own interpreter runs it:
// the speeds, Stop, wait, print and recursion all work exactly as they do for blocks, and a program written
// out by logo.js comes back as the same drawing. It never touches the screen.
//
// The Logo it understands (case does not matter, and ; starts a comment):
//   moving      forward fd, back bk, left lt, right rt, setxy x y, setx, sety, setheading seth, home, arc angle radius
//   pen         penup pu, pendown pd, setpensize n, setpencolor [r g b] (setpc), setscreencolor [r g b] (setsc),
//               clearscreen cs (the same as the clean block), startfill, endfill
//   other       print n (pr), wait n (in 60ths of a second, like real Logo), setspeed 1 to 4, stop,
//               write |some words| size (the write block)
//               ask |a question| (the ask block: it shows the question, waits for a number, and puts it in box1)
//   clicks      onclick [ ... ] on a line of its own: runs those commands each time the paper is clicked, and mousex and mousey say where
//               (a program with an onclick keeps listening after its last command, until Stop)
//   repeating   repeat n [ ... ], forever [ ... ], if test [ ... ], ifelse test [ ... ] [ ... ]
//   variables   make "name value, then :name. There are four (they are the four boxes), box1 to box4 or any names
//   your own    to name :input1 :input2 ... end, then name 10 20
//   numbers     + - * / % (the remainder), < > =, parentheses, xcor ycor heading pensize,
//               (random low high), random n, oneof a b
// Colors run from 0 to 255 (not 0 to 99 as in some Logos) and arc moves the turtle along the curve (a positive
// angle curves right), like the blocks. Anything else that real Logo has gets a polite "not yet".

import { ASK_MAX_CHARS, BOX_COUNT } from './blocks-spec.js';
import { cleanLetteringText, DEFAULT_LETTER_SIZE, LETTERING_MAX_CHARS, LETTER_FONTS, isFont } from './lettering.js';

/** A problem in the Logo, with the line it is on (counting from 1). */
export class LogoError extends Error {
  constructor(message, line) {
    super(message);
    this.name = 'LogoError';
    this.line = line;
  }
}

// ---- What the words mean ------------------------------------------------------------------------------

/** Commands that are one block with the sockets in order. `short` is the abbreviation the generator writes. */
const SIMPLE = [
  { op: 'forward', names: ['forward', 'fd'], short: 'fd', argc: 1 },
  { op: 'back', names: ['back', 'bk', 'backward'], short: 'bk', argc: 1 },
  { op: 'left', names: ['left', 'lt'], short: 'lt', argc: 1 },
  { op: 'right', names: ['right', 'rt'], short: 'rt', argc: 1 },
  { op: 'arc', names: ['arc'], argc: 2 },
  { op: 'setxy', names: ['setxy'], argc: 2 },
  { op: 'setheading', names: ['setheading', 'seth'], short: 'seth', argc: 1 },
  { op: 'penup', names: ['penup', 'pu'], short: 'pu', argc: 0 },
  { op: 'pendown', names: ['pendown', 'pd'], short: 'pd', argc: 0 },
  { op: 'setpensize', names: ['setpensize', 'setpw', 'setwidth'], argc: 1 },
  { op: 'clean', names: ['clearscreen', 'cs', 'clean'], short: 'cs', argc: 0 },
  { op: 'startfill', names: ['startfill'], argc: 0 },
  { op: 'endfill', names: ['endfill'], argc: 0 },
  { op: 'print', names: ['print', 'pr'], short: 'pr', argc: 1 },
  { op: 'speed', names: ['setspeed'], argc: 1 },
  { op: 'setcurve', names: ['setcurve'], argc: 1 },
  { op: 'stop', names: ['stop'], argc: 0 },
];

/** For the generator: the long and the short way to write each simple command. */
export const LOGO_NAMES = Object.freeze(Object.fromEntries(SIMPLE.map((s) => [s.op, { long: s.names[0], short: s.short ?? s.names[0] }])));

const COMMAND_BY_NAME = new Map();
for (const command of SIMPLE) for (const name of command.names) COMMAND_BY_NAME.set(name, command);

/** Words that mean something to the turtle but nothing to us: skipped, so a Logo program from elsewhere still runs. */
const IGNORED = new Set(['hideturtle', 'ht', 'showturtle', 'st']);

/** Reporters with no inputs, and reporters with two, and what block each one is. */
const NO_INPUTS = { xcor: 'x', ycor: 'y', heading: 'heading', pensize: 'pensize', penred: 'penred', pengreen: 'pengreen', penblue: 'penblue', mousex: 'mousex', mousey: 'mousey' };
const TWO_INPUTS = { sum: 'add', difference: 'subtract', product: 'multiply', quotient: 'divide', modulo: 'mod', mod: 'mod', oneof: 'oneof' };

const SPECIAL_COMMANDS = ['repeat', 'forever', 'if', 'ifelse', 'make', 'write', 'ask', 'onclick', 'setfont', 'setpencolor', 'setpc', 'setscreencolor', 'setsc', 'home', 'setx', 'sety', 'wait', 'to', 'end'];
const REAL_LOGO_NOT_HERE = ['sqrt', 'abs', 'int', 'round', 'sin', 'cos', 'tan', 'arctan', 'and', 'or', 'not', 'word', 'list', 'first', 'last', 'butfirst', 'butlast', 'count', 'item', 'output', 'op', 'local', 'localmake', 'run', 'label', 'pick', 'power', 'exp', 'ln', 'log10', 'thing', 'foreach', 'for', 'while', 'until', 'do', 'test', 'iftrue', 'iffalse', 'cleartext', 'ct', 'pos', 'towards', 'distance', 'fill', 'bye', 'rerandom', 'remainder'];

/** Every word the generator must not use as the name of one of your own blocks. */
export const BUILTIN_WORDS = new Set([
  ...COMMAND_BY_NAME.keys(), ...IGNORED, ...SPECIAL_COMMANDS, ...Object.keys(NO_INPUTS), ...Object.keys(TWO_INPUTS), 'random', ...REAL_LOGO_NOT_HERE,
]);

/** A few color names, for setpc "red. (Colors are 0 to 255.) */
const COLOR_NAMES = {
  black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], green: [0, 160, 0], blue: [0, 0, 255], yellow: [255, 255, 0],
  orange: [255, 140, 0], purple: [150, 0, 200], pink: [255, 120, 200], brown: [140, 80, 30], gray: [128, 128, 128], grey: [128, 128, 128],
  cyan: [0, 200, 255], magenta: [255, 0, 255],
};

// ---- Tokens -------------------------------------------------------------------------------------------

const NUMBER = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
const WORD = /^[A-Za-z_][A-Za-z0-9_.?]*/;
const NAME_CHARS = /^[A-Za-z0-9_.?]+/;

/**
 * Cut the text into tokens: { type, text, value, line, before, after }. `before` and `after` say whether
 * there was a space on that side, which is how `setxy 10 -20` (a minus sign for the number) is told from
 * `10 - 20` (a subtraction).
 */
export function tokenize(text) {
  const tokens = [];
  let line = 1;
  let i = 0;
  let spaced = true; // was the last thing a space (or the start of the text)?
  const push = (token) => {
    token.line ??= line;
    token.before = spaced;
    token.after = i >= text.length || /\s/.test(text[i]);
    tokens.push(token);
    spaced = false;
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\n') {
      line += 1;
      i += 1;
      spaced = true;
      continue;
    }
    if (/\s/.test(ch)) {
      i += 1;
      spaced = true;
      continue;
    }
    if (ch === ';') {
      while (i < text.length && text[i] !== '\n') i += 1;
      continue;
    }
    const rest = text.slice(i);
    if (ch === '[' || ch === ']' || ch === '(' || ch === ')') {
      i += 1;
      push({ type: ch, text: ch });
      continue;
    }
    if (ch === '|') {
      const end = text.indexOf('|', i + 1);
      const newline = text.indexOf('\n', i + 1);
      if (end === -1 || (newline !== -1 && newline < end)) throw new LogoError('I found a | that never closes. Words with spaces go between two | bars, like |Go Cougars|.', line);
      const value = text.slice(i + 1, end);
      i = end + 1;
      push({ type: 'bar', text: `|${value}|`, value });
      continue;
    }
    if (ch === '"') {
      const match = /^"[^\s[\]()]*/.exec(rest);
      i += match[0].length;
      push({ type: 'quoted', text: match[0], value: match[0].slice(1) });
      continue;
    }
    if (ch === ':') {
      const name = NAME_CHARS.exec(rest.slice(1));
      if (!name) throw new LogoError('There is a : with no name after it. A variable is written like :size.', line);
      i += 1 + name[0].length;
      push({ type: 'var', text: `:${name[0]}`, value: name[0].toLowerCase(), name: name[0] });
      continue;
    }
    const number = NUMBER.exec(rest);
    if (number) {
      i += number[0].length;
      push({ type: 'number', text: number[0], value: Number(number[0]) });
      continue;
    }
    const word = WORD.exec(rest);
    if (word) {
      i += word[0].length;
      push({ type: 'word', text: word[0], value: word[0].toLowerCase() });
      continue;
    }
    const two = rest.slice(0, 2);
    if (two === '<=' || two === '>=' || two === '<>') {
      i += 2;
      push({ type: 'op', text: two, value: two });
      continue;
    }
    if ('+-*/%=<>'.includes(ch)) {
      i += 1;
      push({ type: 'op', text: ch, value: ch });
      continue;
    }
    throw new LogoError(`I do not understand the character ${ch}.`, line);
  }
  return tokens;
}

// ---- Helping words ------------------------------------------------------------------------------------

/** How different two short words are (how many letters to add, take away or change). */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, k) => k);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ---- The compiler -------------------------------------------------------------------------------------

class Compiler {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
    this.procedures = new Map(); // name -> { name, params: [as typed], line }
    this.globals = new Map(); // variable name -> box number (0 to BOX_COUNT - 1)
    this.params = null; // while inside a definition: lowercase name -> name as typed
    this.names = [...COMMAND_BY_NAME.keys(), ...SPECIAL_COMMANDS, ...Object.keys(NO_INPUTS), ...Object.keys(TWO_INPUTS), 'random'];
    this.scan();
  }

  // -- Looking ahead --

  /** Find every `to`, so a call can come before the definition, and give every variable a box. */
  scan() {
    const { tokens } = this;
    const reserved = new Set(); // box numbers taken by variables named box1 to box4
    const made = [];
    for (let k = 0; k < tokens.length; k += 1) {
      const token = tokens[k];
      if ((token.type === 'var' || token.type === 'quoted') && /^box[1-9]\d*$/.test(token.value)) {
        const number = Number(token.value.slice(3));
        if (number <= BOX_COUNT) reserved.add(number - 1);
      }
      if (token.type === 'word' && token.value === 'to' && tokens[k + 1]?.type === 'word') {
        const name = tokens[k + 1];
        const params = [];
        for (let m = k + 2; tokens[m]?.type === 'var' && tokens[m].line === name.line; m += 1) params.push(tokens[m].name);
        if (!this.procedures.has(name.value)) this.procedures.set(name.value, { name: name.text, params, line: token.line });
      }
      if (token.type === 'word' && token.value === 'make' && tokens[k + 1]?.type === 'quoted') made.push(tokens[k + 1]);
      if (token.type === 'word' && token.value === 'ask') reserved.add(0); // ask puts its answer in box1, so no name of yours is given box1
    }
    for (const token of made) {
      const key = token.value.toLowerCase();
      if (this.globals.has(key)) continue;
      const fixed = /^box([1-9]\d*)$/.exec(key);
      if (fixed && Number(fixed[1]) <= BOX_COUNT) {
        this.globals.set(key, Number(fixed[1]) - 1);
        continue;
      }
      let free = 0;
      while ((reserved.has(free) || [...this.globals.values()].includes(free)) && free < BOX_COUNT) free += 1;
      if (free >= BOX_COUNT) {
        throw new LogoError(`TurtleLab Logo has room for ${BOX_COUNT} variables (they are the four boxes), and make "${token.value} would be one too many.`, token.line);
      }
      this.globals.set(key, free);
    }
  }

  peek() {
    return this.tokens[this.i];
  }

  next() {
    return this.tokens[this.i++];
  }

  get lastLine() {
    return this.tokens.at(-1)?.line ?? 1;
  }

  /** A block with the line it came from, so an error can say where. */
  block(op, args, token, extra = {}) {
    const made = { op, ...(args ? { args } : {}), ...extra };
    Object.defineProperty(made, 'logoLine', { value: token?.line ?? this.lastLine, enumerable: false });
    return made;
  }

  // -- The program --

  program() {
    const main = [];
    const definitions = [];
    const handlers = []; // the blocks of each onclick [ ... ]
    while (this.i < this.tokens.length) {
      const token = this.peek();
      if (token.type === 'word' && token.value === 'to') {
        definitions.push(this.definition());
      } else if (token.type === 'word' && token.value === 'onclick') {
        this.next();
        handlers.push(this.list(token));
      } else if (token.type === ']') {
        throw new LogoError('There is a ] with no [ before it.', token.line);
      } else {
        main.push(...this.statement());
      }
    }
    const stacks = definitions.map((found, k) => ({ x: 0, y: k, blocks: [{ op: 'to', name: found.name, params: found.params }, ...found.body] }));
    stacks.push({ x: 0, y: definitions.length, blocks: [{ op: 'start' }, ...main] });
    handlers.forEach((blocks, k) => stacks.push({ x: 0, y: definitions.length + 1 + k, blocks: [{ op: 'onclick', args: [] }, ...blocks] }));
    // The names the variables had, by box: box 1 is boxNames[0]. (Blocks only know box1 to box4, so these are kept to write the program
    // out again with the same words. A box that no make named has no entry.)
    const boxNames = [];
    for (const [key, index] of this.globals) boxNames[index] = key;
    return { main, definitions, stacks, boxNames };
  }

  definition() {
    const to = this.next();
    const name = this.next();
    if (!name || name.type !== 'word') throw new LogoError('to needs a name after it, like: to square :size', to.line);
    if (BUILTIN_WORDS.has(name.value)) throw new LogoError(`${name.text} is already a Logo word, so a block of yours cannot be called that. Try another name.`, name.line);
    const found = this.procedures.get(name.value);
    if (found.line !== to.line) throw new LogoError(`You already made a block called ${name.text} on line ${found.line}.`, to.line);
    const params = new Map();
    for (const param of found.params) {
      if (params.has(param.toLowerCase())) throw new LogoError(`The input :${param} is in this to line twice.`, to.line);
      params.set(param.toLowerCase(), param);
    }
    while (this.peek()?.type === 'var' && this.peek().line === name.line) this.next();
    this.params = params;
    const body = [];
    while (true) {
      const token = this.peek();
      if (!token) throw new LogoError(`The to ${name.text} on line ${to.line} never ends. Put end on a line of its own after it.`, to.line);
      if (token.type === 'word' && token.value === 'end') {
        this.next();
        break;
      }
      if (token.type === 'word' && token.value === 'to') throw new LogoError(`I found another to on line ${token.line} before the end of to ${name.text}. Every to needs an end.`, token.line);
      if (token.type === ']') throw new LogoError('There is a ] with no [ before it.', token.line);
      body.push(...this.statement());
    }
    this.params = null;
    return { name: found.name, params: found.params, body };
  }

  /** Blocks for a list of commands in [ square brackets ]. */
  list(after) {
    const open = this.next();
    if (!open || open.type !== '[') throw new LogoError(`${after.text} needs a list of commands in [ square brackets ] after it.`, after.line);
    const out = [];
    while (true) {
      const token = this.peek();
      if (!token) throw new LogoError(`I could not find the ] that closes the [ on line ${open.line}.`, open.line);
      if (token.type === ']') {
        this.next();
        return out;
      }
      out.push(...this.statement());
    }
  }

  // -- Commands --

  /** The blocks for one command and its inputs (a few commands make two blocks, a few make none). */
  statement() {
    const token = this.next();
    if (token.type !== 'word') this.notACommand(token);
    const word = token.value;

    const simple = COMMAND_BY_NAME.get(word);
    if (simple) {
      const args = [];
      for (let k = 0; k < simple.argc; k += 1) args.push(this.input(token, simple.argc, k));
      return [this.block(simple.op, simple.argc > 0 ? args : [], token)];
    }
    if (IGNORED.has(word)) return [];

    switch (word) {
      case 'repeat': {
        const count = this.input(token, 1, 0);
        return [this.block('repeat', [count], token, { body: this.list(token) })];
      }
      case 'forever':
        return [this.block('forever', [], token, { body: this.list(token) })];
      case 'if': {
        const test = this.input(token, 1, 0, 'a test, like :size > 10,');
        return [this.block('if', [test], token, { body: this.list(token) })];
      }
      case 'ifelse': {
        const test = this.input(token, 1, 0, 'a test, like :size > 10,');
        const body = this.list(token);
        return [this.block('ifelse', [test], token, { body, elseBody: this.list(token) })];
      }
      case 'wait': {
        // Real Logo counts a wait in 60ths of a second. The block counts tenths of a second.
        const sixtieths = this.input(token, 1, 0);
        return [this.block('wait', [typeof sixtieths === 'number' ? sixtieths / 6 : this.block('divide', [sixtieths, 6], token)], token)];
      }
      case 'make':
        return [this.make(token)];
      case 'write':
        return [this.write(token)];
      case 'ask':
        return [this.ask(token)];
      case 'onclick':
        throw new LogoError('onclick goes on a line of its own, not inside a repeat, an if or a block you made. Like this: onclick [ setxy mousex mousey ]', token.line);
      case 'setfont':
        return [this.setFont(token)];
      case 'setpencolor':
      case 'setpc':
        return [this.block('setcolor', this.color(token), token)];
      case 'setscreencolor':
      case 'setsc':
        return [this.block('fillscreen', this.color(token), token)];
      case 'home':
        return [this.block('setxy', [0, 0], token), this.block('setheading', [0], token)];
      case 'setx':
        return [this.block('setxy', [this.input(token, 1, 0), this.block('y', [], token)], token)];
      case 'sety':
        return [this.block('setxy', [this.block('x', [], token), this.input(token, 1, 0)], token)];
      case 'end':
        throw new LogoError('There is an end with no to before it.', token.line);
      case 'to':
        throw new LogoError('A to has to start a line of its own, outside any [ ] list.', token.line);
      default:
    }

    const made = this.procedures.get(word);
    if (made) {
      const args = made.params.map((_, k) => this.input(token, made.params.length, k));
      return [this.block('call', args, token, { name: made.name, params: [...made.params] })];
    }
    this.unknownWord(token);
    return [];
  }

  make(token) {
    const target = this.next();
    if (!target || target.type !== 'quoted' || target.value === '') {
      throw new LogoError('make needs a name in quotes, then a number, like: make "size 50', token.line);
    }
    const key = target.value.toLowerCase();
    if (this.params?.has(key)) throw new LogoError(`make cannot change the input :${this.params.get(key)} yet. Make a new variable with another name.`, target.line);
    const value = this.input(token, 2, 1);
    return this.block(`store${this.globals.get(key) + 1}`, [value], token);
  }

  write(token) {
    const words = this.next();
    if (!words || (words.type !== 'bar' && words.type !== 'quoted')) {
      throw new LogoError('write needs the words, then the size of the letters, like: write |Go Cougars| 60', token.line);
    }
    const text = cleanLetteringText(words.value);
    if ([...words.value].length > LETTERING_MAX_CHARS) throw new LogoError(`write holds at most ${LETTERING_MAX_CHARS} letters.`, words.line);
    const size = this.argumentStarts() ? this.expression() : DEFAULT_LETTER_SIZE;
    return this.block('write', [size], token, { text });
  }

  /** ask |How many sides?|: the question, in bars or quotes. The number typed goes in box1. */
  ask(token) {
    const words = this.next();
    if (!words || (words.type !== 'bar' && words.type !== 'quoted')) {
      throw new LogoError('ask needs the question, like: ask |How many sides?|. The number you type goes in box1.', token.line);
    }
    if ([...words.value].length > ASK_MAX_CHARS) throw new LogoError(`The question can have at most ${ASK_MAX_CHARS} letters.`, words.line);
    return this.block('ask', [], token, { text: cleanLetteringText(words.value, ASK_MAX_CHARS) });
  }

  /** setfont "fancy: the font the write commands after it use, one of the names in lettering.js. */
  setFont(token) {
    const name = this.next();
    if (!name || name.type !== 'quoted' || name.value === '') {
      throw new LogoError(`setfont needs the name of a font in quotes, like: setfont "fancy. The fonts are ${LETTER_FONTS.map((f) => f.id).join(', ')}.`, token.line);
    }
    const font = name.value.toLowerCase();
    if (!isFont(font)) {
      throw new LogoError(`${name.text} is not a font TurtleLab has. The fonts are ${LETTER_FONTS.map((f) => f.id).join(', ')}, like: setfont "fancy`, name.line);
    }
    return this.block('setfont', [], token, { font });
  }

  /** The three numbers of a color: a list like [255 0 0], a color name like "red, or three numbers. */
  color(token) {
    const first = this.peek();
    if (first?.type === '[') {
      this.next();
      const numbers = [];
      while (this.peek() && this.peek().type !== ']') {
        const negative = this.peek().type === 'op' && this.peek().value === '-';
        if (negative) this.next();
        const number = this.next();
        if (number.type !== 'number') throw new LogoError(`A color is three numbers from 0 to 255, like [255 0 0]. I found ${number.text}.`, number.line);
        numbers.push(negative ? -number.value : number.value);
      }
      if (!this.peek()) throw new LogoError(`I could not find the ] that closes the [ on line ${first.line}.`, first.line);
      this.next();
      if (numbers.length !== 3) throw new LogoError(`A color is three numbers from 0 to 255, like [255 0 0]. This one has ${numbers.length}.`, first.line);
      return numbers;
    }
    if (first?.type === 'quoted') {
      this.next();
      const found = COLOR_NAMES[first.value.toLowerCase()];
      if (!found) throw new LogoError(`I do not know a color called ${first.value}. Try ${Object.keys(COLOR_NAMES).slice(0, 8).join(', ')}, or three numbers like [255 0 0].`, first.line);
      return [...found];
    }
    return [this.input(token, 3, 0), this.input(token, 3, 1), this.input(token, 3, 2)];
  }

  // -- Numbers --

  /** Is there something here that a number could start with? */
  argumentStarts() {
    const token = this.peek();
    if (!token) return false;
    if (token.type === 'number' || token.type === 'var' || token.type === '(') return true;
    if (token.type === 'op' && token.value === '-') return true;
    if (token.type === 'word') return this.isReporter(token.value);
    return false;
  }

  isReporter(word) {
    return word in NO_INPUTS || word in TWO_INPUTS || word === 'random';
  }

  /**
   * One input for the command `token`, which has `of` of them (this is number `k`, counting from 0). `what`
   * says what is wanted, for the message when it is missing.
   */
  input(token, of, k, what = 'a number') {
    const here = this.peek();
    const missing = !here || here.type === ']' || here.type === ')' || (here.type === 'word' && !this.isReporter(here.value) && this.commandWord(here.value));
    if (here?.type === 'word' && this.procedures.has(here.value) && !this.isReporter(here.value)) {
      throw new LogoError(`${here.text} is a block of yours that draws. It does not give back a number, so it cannot go here.`, here.line);
    }
    if (missing) {
      const needs = of === 1 ? what : plural(of, 'number');
      throw new LogoError(`${token.text} needs ${needs} after it${of > 1 && k > 0 ? `, and I only found ${k}` : ''}.`, token.line);
    }
    return this.expression();
  }

  commandWord(word) {
    return COMMAND_BY_NAME.has(word) || SPECIAL_COMMANDS.includes(word) || IGNORED.has(word) || this.procedures.has(word);
  }

  /** A test or a sum: comparisons come last. */
  expression() {
    let left = this.sum();
    while (this.peek()?.type === 'op' && ['<', '>', '='].includes(this.peek().value)) {
      const op = this.next();
      const right = this.sum();
      left = this.block({ '<': 'less', '>': 'greater', '=': 'equal' }[op.value], [left, right], op);
    }
    const odd = this.peek();
    if (odd?.type === 'op' && ['<=', '>=', '<>'].includes(odd.value)) {
      throw new LogoError(`${odd.text} is not in TurtleLab Logo yet. It has < (less than), > (greater than) and = (equals).`, odd.line);
    }
    return left;
  }

  sum() {
    let left = this.product();
    while (this.peek()?.type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.peek();
      // 10 -5 (a space before the minus and none after) is the number -5 starting the next input, not 10 minus 5.
      if (op.value === '-' && op.before && !op.after) break;
      this.next();
      const right = this.product();
      left = this.block(op.value === '+' ? 'add' : 'subtract', [left, right], op);
    }
    return left;
  }

  product() {
    let left = this.unary();
    while (this.peek()?.type === 'op' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.next();
      const right = this.unary();
      left = this.block({ '*': 'multiply', '/': 'divide', '%': 'mod' }[op.value], [left, right], op);
    }
    return left;
  }

  unary() {
    const token = this.peek();
    if (token?.type === 'op' && token.value === '-') {
      this.next();
      const operand = this.unary();
      return typeof operand === 'number' ? -operand : this.block('subtract', [0, operand], token);
    }
    return this.primary();
  }

  primary() {
    const token = this.next();
    if (!token) throw new LogoError('I need a number at the end of the program, and there is nothing there.', this.lastLine);
    switch (token.type) {
      case 'number':
        return token.value;
      case 'var':
        return this.variable(token);
      case '(':
        return this.parenthesized(token);
      case 'word':
        return this.reporter(token, false);
      case 'quoted':
      case 'bar':
        throw new LogoError(`I need a number here, and ${token.text} is a word. (print and the other commands only work with numbers for now.)`, token.line);
      case '[':
        throw new LogoError('A [ list ] can only go after repeat, forever, if, ifelse or a color command. I need a number here.', token.line);
      default:
        throw new LogoError(`I need a number here, and I found ${token.text}.`, token.line);
    }
  }

  variable(token) {
    if (this.params?.has(token.value)) return this.block('input', undefined, token, { name: this.params.get(token.value) });
    if (this.globals.has(token.value)) return this.block(`box${this.globals.get(token.value) + 1}`, [], token);
    const fixed = /^box([1-9]\d*)$/.exec(token.value);
    if (fixed && Number(fixed[1]) <= BOX_COUNT) return this.block(`box${fixed[1]}`, [], token);
    throw new LogoError(`I do not know ${token.text}. A variable has to be made first, like: make "${token.value} 10`, token.line);
  }

  /** ( 1 + 2 ), or a reporter with its inputs inside the brackets, like (random 1 10). */
  parenthesized(open) {
    const first = this.peek();
    if (first?.type === 'word' && this.isReporter(first.value)) {
      this.next();
      const found = this.reporter(first, true);
      const close = this.next();
      if (!close || close.type !== ')') throw new LogoError(`I could not find the ) that closes the ( on line ${open.line}.`, open.line);
      return found;
    }
    const inside = this.expression();
    const close = this.next();
    if (!close || close.type !== ')') throw new LogoError(`I could not find the ) that closes the ( on line ${open.line}.`, open.line);
    return this.block('paren', [inside], open);
  }

  /** A word that reports a number. `inBrackets` lets random take a low and a high. */
  reporter(token, inBrackets) {
    const word = token.value;
    if (word in NO_INPUTS) return this.block(NO_INPUTS[word], [], token);
    if (word in TWO_INPUTS) {
      const a = this.input(token, 2, 0);
      return this.block(TWO_INPUTS[word], [a, this.input(token, 2, 1)], token);
    }
    if (word === 'random') {
      const low = this.input(token, inBrackets ? 2 : 1, 0);
      if (inBrackets && this.argumentStarts()) return this.block('random', [low, this.expression()], token);
      // Real Logo: random 10 is a whole number from 0 up to 9.
      return this.block('random', [0, typeof low === 'number' ? low - 1 : this.block('subtract', [low, 1], token)], token);
    }
    if (this.procedures.has(word)) throw new LogoError(`${token.text} is a block of yours that draws. It does not give back a number, so it cannot go here.`, token.line);
    if (this.commandWord(word)) throw new LogoError(`${token.text} is a command. It does not give back a number, so it cannot go here.`, token.line);
    return this.unknownWord(token);
  }

  // -- Complaints --

  notACommand(token) {
    const what = token.type === 'number' ? `the number ${token.text}` : token.type === 'var' ? `the variable ${token.text}` : token.type === 'quoted' || token.type === 'bar' ? `the word ${token.text}` : `${token.text}`;
    if (token.type === ')') throw new LogoError('There is a ) with no ( before it.', token.line);
    if (token.type === ']') throw new LogoError('There is a ] with no [ before it.', token.line);
    throw new LogoError(`I found ${what} where a command should be. Did you leave out a command in front of it? (Something like forward 100 or turn right 90.)`, token.line);
  }

  unknownWord(token) {
    if (REAL_LOGO_NOT_HERE.includes(token.value)) {
      throw new LogoError(`${token.text} is real Logo, but it is not in TurtleLab Logo yet.`, token.line);
    }
    const near = [...this.names, ...this.procedures.keys()]
      .map((name) => ({ name, d: distance(token.value, name) }))
      .filter(({ d, name }) => d <= (name.length <= 3 ? 1 : 2))
      .sort((a, b) => a.d - b.d)[0];
    throw new LogoError(`I do not know how to ${token.text}.${near ? ` Did you mean ${near.name}?` : ''}`, token.line);
  }
}

/**
 * Turn Logo text into blocks.
 *
 * @param {string} text
 * @returns {{ok: true, main: object[], definitions: object[], stacks: object[], boxNames: string[]} | {ok: false, error: string, line: number}}
 *   `stacks` is a project's stacks (a `to` stack for each of your blocks, then the program under a start block);
 *   `main` is the program's blocks on their own. Every block knows its line (`logoLine`) for error messages.
 */
export function compileLogo(text) {
  try {
    return { ok: true, ...new Compiler(tokenize(String(text ?? ''))).program() };
  } catch (error) {
    if (error instanceof LogoError) return { ok: false, error: error.message, line: error.line };
    // Lists inside lists inside lists, more than the page can keep track of.
    if (error instanceof RangeError) return { ok: false, error: 'That Logo has [ lists ] or ( brackets ) inside each other too deeply for me to read.', line: 1 };
    throw error;
  }
}
