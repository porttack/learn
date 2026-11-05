// TurtleLab: the interpreter. It runs a stack of blocks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// How it works, in plain words:
//
// A program is a list of blocks. We walk the list and do what each block
// says. The trick is that the walker is a *generator* (the `function*`
// syntax). A generator can pause itself with `yield` and be woken up later.
// Every block that runs yields once when it is done (the write block, a little
// at a time, once for each short line it draws), so whoever is driving us (see
// scheduler.js) gets a chance to redraw the screen, wait a moment so you can
// watch the turtle, or stop the program.
//
// That is also why a `forever` loop cannot freeze the browser: it yields
// all the time, and the scheduler can always step in.
//
// Reporter blocks (the ones that hand back a number, like x) do not draw
// anything, so they are ordinary functions that return a value right away.

import { BLOCKS, BOX_COUNT, SPEED_NAMES, specOf } from './blocks-spec.js';
import { nameKey } from './names.js';
import { round10 } from './turtle.js';
import { formatNumber } from './format.js';

/** An error with a friendly message and the block that caused it. */
export class RunError extends Error {
  constructor(message, block = null) {
    super(message);
    this.name = 'RunError';
    this.block = block;
  }
}

/** Returned by a block to say "stop running this block or program now". */
export const STOP = Symbol('stop');

/**
 * Yielded by the wait block: "pause for this many milliseconds". The
 * scheduler does the actual waiting (and Stop can cut it short).
 */
export class Wait {
  constructor(block, ms) {
    this.block = block;
    this.ms = ms;
  }
}

/**
 * Yielded by a block that takes only part of a step, like each short line of a letter the write block draws:
 * `share` (0 to 1) of the wait a whole step would have at the speed the program has. The shares of one letter add up to
 * 1, so a letter takes the time of one step however it is drawn, and the scheduler can show it a line at a time.
 */
export class Pace {
  constructor(block, share) {
    this.block = block;
    this.share = share;
  }
}

// The longest pause a timer can really do. (A longer one would fire at once.)
const LONGEST_WAIT_MS = 2 ** 31 - 1;

/**
 * Make the object that carries the program's state while it runs: the
 * turtle, and the boxes (variables). Boxes start at 0 unless told otherwise.
 * `random` gives numbers from 0 up to (not including) 1, `print` receives
 * each line a print block shows, and `setSpeed` is told the name of the speed
 * a speed block picks (the app hands it on to the scheduler). Tests replace
 * them to get fixed answers. `definitions` is what the blocks the student made
 * do (see definitionsOf), and `frames` is the stack of calls being run right
 * now, each holding the numbers its inputs were given.
 */
export function createContext({
  turtle,
  boxes = null,
  random = Math.random,
  print = () => {},
  setSpeed = () => {},
  definitions = new Map(),
}) {
  return { turtle, boxes: boxes ?? new Array(BOX_COUNT).fill(0), random, print, setSpeed, definitions, frames: [] };
}

/**
 * How many calls can be inside each other at once. A block that calls itself
 * with no way to stop would otherwise run until the page ran out of room.
 * Blocks inside blocks are generators inside generators, and the browser only
 * has room for a few thousand of those, so a call plus the blocks around it
 * costs a handful. 500 calls fit with room to spare even when each call is
 * inside a few loops and ifs (a test checks that). Past what fits, the app
 * still gives a friendly message instead of crashing (main.js).
 */
export const MAX_CALL_DEPTH = 500;

/**
 * Run a list of blocks, one after another.
 * Use it as `yield* runBlocks(blocks, ctx)` inside another generator, or hand
 * `runBlocks(blocks, ctx)` straight to the scheduler.
 */
export function* runBlocks(blocks, ctx) {
  for (const block of blocks) {
    if (block === null || typeof block !== 'object') {
      throw new RunError('Something in the program is not a block.', null);
    }
    const flow = FLOW[block.op];
    if (flow) {
      // Go straight to the flow block. Blocks inside blocks make generators inside
      // generators, and the browser only has so much stack for that, so a block
      // costs one layer here (and a command none) to let a block call itself deep.
      if ((yield* flow(block, ctx)) === STOP) return STOP;
    } else {
      runCommand(block, ctx);
      yield block;
    }
  }
  return undefined;
}

// ---- Commands ---------------------------------------------------------

// Simple commands run to completion in one go. Each one gets the turtle, its
// arguments (already worked out into plain numbers), and the context.
// The store-in-box commands are added below the table.
const COMMANDS = {
  // start only marks where a stack begins. When it runs it does nothing.
  start: () => {},
  // a note is words for people, so running one does nothing
  note: () => {},
  // The `to` block only names a definition. It is never run: calling the block
  // runs the blocks under it, not the hat.
  to: () => {},
  clean: (t) => t.clean(),
  forward: (t, [steps]) => t.forward(steps),
  back: (t, [steps]) => t.back(steps),
  left: (t, [degrees]) => t.left(degrees),
  right: (t, [degrees]) => t.right(degrees),
  arc: (t, [angle, radius]) => t.arc(angle, radius),
  setxy: (t, [x, y]) => t.setXY(x, y),
  setheading: (t, [degrees]) => t.setHeading(degrees),
  penup: (t) => t.setPenUp(),
  pendown: (t) => t.setPenDown(),
  setpensize: (t, [size]) => t.setPenSize(size),
  setcolor: (t, [r, g, b]) => t.setColor(r, g, b),
  fillscreen: (t, [r, g, b]) => t.fillScreen(r, g, b),
  startfill: (t) => t.startFill(),
  endfill: (t) => t.endFill(),
  print: (t, [value], ctx) => ctx.print(formatNumber(value)),
  // The write block's settings are the turtle's, like the pen's. (write itself is not here: it is drawn a little at a time, so it is one of
  // the flow blocks below.) The font is on the block; the curve is a number in its socket.
  setfont: (t, args, ctx, block) => t.setFont(block.font),
  setcurve: (t, [degrees]) => t.setCurve(degrees),
  // 1 is slow and 4 is instant. Like a color, a number off the end is
  // pulled back to the nearest speed, and 2.6 counts as 3.
  speed: (t, [number], ctx) => {
    const pick = Math.min(SPEED_NAMES.length, Math.max(1, Math.round(number)));
    ctx.setSpeed(SPEED_NAMES[pick - 1]);
  },
};

// Box n lives at ctx.boxes[n - 1]. store1 puts a number there, box1 reads it.
for (let n = 1; n <= BOX_COUNT; n += 1) {
  COMMANDS[`store${n}`] = (turtle, [value], ctx) => {
    ctx.boxes[n - 1] = value;
  };
}

// Flow commands decide what to run next, so they are generators too.
const FLOW = {
  *repeat(block, ctx) {
    const times = Math.floor(evalNumber(block.args?.[0], ctx, block));
    const body = block.body ?? [];
    for (let lap = 0; lap < times; lap++) {
      const signal = yield* runBlocks(body, ctx);
      if (signal === STOP) return STOP;
      // Blocks inside the loop each yield when they run. An empty loop has
      // nothing to yield, so it pauses here, or it could freeze the tab.
      if (body.length === 0) yield block;
    }
    return undefined;
  },

  *forever(block, ctx) {
    const body = block.body ?? [];
    while (true) {
      const signal = yield* runBlocks(body, ctx);
      if (signal === STOP) return STOP;
      // Every block yields when it runs, so a loop with anything in it is safe.
      // An empty one has to pause here, or it would freeze the tab.
      if (body.length === 0) yield block;
    }
  },

  *if(block, ctx) {
    const condition = evalBoolean(block.args?.[0], ctx, block);
    yield block; // so a false `if` still takes a step, and can be seen
    if (!condition) return undefined;
    return yield* runBlocks(block.body ?? [], ctx);
  },

  *ifelse(block, ctx) {
    const condition = evalBoolean(block.args?.[0], ctx, block);
    yield block;
    // One mouth or the other, never both and never neither.
    return yield* runBlocks((condition ? block.body : block.elseBody) ?? [], ctx);
  },

  // The words are on the block itself, not in a socket; the socket is how big the letters are. The turtle traces the letters
  // one short line at a time, and each line is a part of a step (a Pace), so the pen can be watched moving along every
  // letter, and a letter takes the time of one step at the speed the program has (all at once at instant). A block with
  // nothing to draw still takes one whole step, like any block, so a loop of them cannot freeze the page.
  *write(block, ctx) {
    const size = evalNumber(block.args?.[0], ctx, block);
    let pieces = 0;
    for (const share of ctx.turtle.writeSteps(block.text ?? '', size)) {
      pieces += 1;
      yield new Pace(block, share);
    }
    if (pieces === 0) yield block;
    return undefined;
  },

  *wait(block, ctx) {
    const tenths = evalNumber(block.args?.[0], ctx, block);
    yield new Wait(block, Math.min(LONGEST_WAIT_MS, Math.max(0, tenths) * 100));
    return undefined;
  },

  // Run a block the student made. The numbers for its inputs are worked out
  // first, in the caller's own frame, and then the blocks under its `to` run
  // with a new frame holding them. `stop` in there only leaves this block.
  *call(block, ctx) {
    const found = ctx.definitions.get(nameKey(block.name ?? ''));
    if (!found) {
      throw new RunError(`There is no block called ${block.name}. Did you delete it or change its name?`, block);
    }
    const values = new Map();
    found.params.forEach((param, i) => values.set(nameKey(param), evalNumber(block.args?.[i], ctx, block)));
    if (ctx.frames.length >= MAX_CALL_DEPTH) {
      throw new RunError(`Your block ${found.name} called itself more than ${MAX_CALL_DEPTH} times. Does it have a way to stop?`, block);
    }
    yield block; // so the call can be seen, the way an if can
    ctx.frames.push({ name: found.name, values });
    try {
      yield* runBlocks(found.body, ctx);
    } finally {
      ctx.frames.pop();
    }
    return undefined;
  },

  *stop(block) {
    yield block;
    return STOP;
  },
};

function runCommand(block, ctx) {
  const command = COMMANDS[block.op];
  if (!command) {
    throw new RunError(`I don't know a block called "${block.op}".`, block);
  }
  // Go by the sockets the block is supposed to have, so a block that is
  // missing an argument reports an empty box instead of running with NaN.
  const args = specOf(block).args.map((socket, i) => evalSocket(block.args?.[i], ctx, block, socket));
  command(ctx.turtle, args, ctx, block);
}

// ---- Reporters --------------------------------------------------------

// Reporters hand back a number (or true or false). They get the context, the
// already evaluated sockets, and their own block.
const REPORTERS = {
  x: (ctx) => ctx.turtle.reportedX,
  y: (ctx) => ctx.turtle.reportedY,
  heading: (ctx) => ctx.turtle.reportedHeading,
  pensize: (ctx) => ctx.turtle.penSize,
  penred: (ctx) => ctx.turtle.color[0],
  pengreen: (ctx) => ctx.turtle.color[1],
  penblue: (ctx) => ctx.turtle.color[2],

  // Parentheses give back what is inside. (Which part of a sum is worked out
  // first is already decided by which block is inside which.)
  paren: (ctx, [value]) => value,

  add: (ctx, [a, b]) => a + b,
  subtract: (ctx, [a, b]) => a - b,
  multiply: (ctx, [a, b]) => a * b,
  divide: (ctx, [a, b], block) => {
    if (b === 0) throw new RunError('You cannot divide by zero.', block);
    return a / b;
  },
  // mod is the remainder after dividing, and is never negative when the
  // second number is positive (the same as Python): -1 mod 5 is 4.
  mod: (ctx, [a, b], block) => {
    if (b === 0) throw new RunError('Mod divides, and you cannot divide by zero.', block);
    return ((a % b) + b) % b;
  },
  random: (ctx, [a, b]) => {
    const [low, high] = a <= b ? [a, b] : [b, a];
    // Whole numbers in give a whole number out, and both ends can come up.
    if (Number.isInteger(low) && Number.isInteger(high)) {
      return low + Math.floor(ctx.random() * (high - low + 1));
    }
    return low + ctx.random() * (high - low);
  },
  oneof: (ctx, [a, b]) => (ctx.random() < 0.5 ? a : b),

  // Compare after rounding away tiny errors, so 0.1 + 0.2 equals 0.3.
  less: (ctx, [a, b]) => round10(a) < round10(b),
  greater: (ctx, [a, b]) => round10(a) > round10(b),
  equal: (ctx, [a, b]) => round10(a) === round10(b),
};
for (let n = 1; n <= BOX_COUNT; n += 1) {
  REPORTERS[`box${n}`] = (ctx) => ctx.boxes[n - 1];
}
// An input is the number the block it belongs to was called with.
REPORTERS.input = (ctx, values, block) => {
  const frame = ctx.frames.at(-1);
  const key = nameKey(block.name ?? '');
  if (!frame || !frame.values.has(key)) {
    throw new RunError(`The input ${block.name} only works inside the block that has it.`, block);
  }
  return frame.values.get(key);
};

/**
 * Work out what goes in a socket, whatever it is: a plain number stays as
 * it is, and a reporter block gets run to find its value (a number, or true
 * or false).
 */
export function evalArg(arg, ctx, block) {
  if (arg === null || arg === undefined) {
    throw new RunError('This block has an empty box. Put a number in it.', block);
  }
  if (typeof arg === 'number') return arg;
  if (typeof arg === 'object') {
    const reporter = REPORTERS[arg.op];
    if (!reporter) {
      throw new RunError(`"${arg.op}" is not a block that reports a value.`, arg);
    }
    const sockets = specOf(arg)?.args ?? [];
    const values = sockets.map((socket, i) => evalSocket(arg.args?.[i], ctx, arg, socket));
    return reporter(ctx, values, arg);
  }
  throw new RunError('Something unexpected is in this box.', block);
}

/** Like evalArg, but the answer has to be a real, finite number. */
export function evalNumber(arg, ctx, block) {
  const value = evalArg(arg, ctx, block);
  if (typeof value === 'boolean') {
    throw new RunError('This block needs a number, but it got a yes or no answer.', block);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RunError('This block got a number that is too big or is not a number.', block);
  }
  return value;
}

/** Like evalArg, but the answer has to be true or false. */
export function evalBoolean(arg, ctx, block) {
  if (arg === null || arg === undefined) {
    throw new RunError('This block needs a yes or no block plugged into it, like a less than, greater than or equals block.', block);
  }
  const value = evalArg(arg, ctx, block);
  if (typeof value !== 'boolean') {
    throw new RunError('This block needs a yes or no answer, like the one a less than, greater than or equals block gives.', block);
  }
  return value;
}

/** Work out a socket the way its type says: a round socket wants a number, a pointed one a yes or no. */
function evalSocket(arg, ctx, block, socket) {
  return socket.type === 'boolean' ? evalBoolean(arg, ctx, block) : evalNumber(arg, ctx, block);
}
