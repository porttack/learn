// Turtle Draw: the interpreter. It runs a stack of blocks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// How it works, in plain words:
//
// A program is a list of blocks. We walk the list and do what each block
// says. The trick is that the walker is a *generator* (the `function*`
// syntax). A generator can pause itself with `yield` and be woken up later.
// Every block that runs yields once when it is done, so whoever is driving
// us (see scheduler.js) gets a chance to redraw the screen, wait a moment
// so you can watch the turtle, or stop the program.
//
// That is also why a `forever` loop cannot freeze the browser: it yields
// all the time, and the scheduler can always step in.
//
// Reporter blocks (the ones that hand back a number, like x) do not draw
// anything, so they are ordinary functions that return a value right away.

import { BLOCKS } from './blocks-spec.js';

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

/** Make the object that carries the program's state while it runs. */
export function createContext({ turtle }) {
  return { turtle };
}

/**
 * Run a list of blocks, one after another.
 * Use it as `yield* runBlocks(blocks, ctx)` inside another generator, or hand
 * `runBlocks(blocks, ctx)` straight to the scheduler.
 */
export function* runBlocks(blocks, ctx) {
  for (const block of blocks) {
    const signal = yield* runBlock(block, ctx);
    if (signal === STOP) return STOP;
  }
  return undefined;
}

// ---- Commands ---------------------------------------------------------

// Simple commands run to completion in one go. Each one gets the turtle and
// its arguments, already worked out into plain numbers.
const COMMANDS = {
  // start only marks where a stack begins. When it runs it does nothing.
  start: () => {},
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
};

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
};

function* runBlock(block, ctx) {
  if (block === null || typeof block !== 'object') {
    throw new RunError('Something in the program is not a block.', null);
  }
  const flow = FLOW[block.op];
  if (flow) return yield* flow(block, ctx);

  const command = COMMANDS[block.op];
  if (!command) {
    throw new RunError(`I don't know a block called "${block.op}".`, block);
  }
  // Go by the sockets the block is supposed to have, so a block that is
  // missing an argument reports an empty box instead of running with NaN.
  const args = BLOCKS[block.op].args.map((_, i) => evalNumber(block.args?.[i], ctx, block));
  command(ctx.turtle, args);
  yield block;
  return undefined;
}

// ---- Reporters --------------------------------------------------------

// Reporters hand back a number. They get the context, the already evaluated
// arguments, and their own block.
const REPORTERS = {
  x: (ctx) => ctx.turtle.reportedX,
  y: (ctx) => ctx.turtle.reportedY,
  heading: (ctx) => ctx.turtle.reportedHeading,
  pensize: (ctx) => ctx.turtle.penSize,
};

/**
 * Work out what goes in a socket: a plain number stays as it is, and a
 * reporter block gets run to find its value.
 */
export function evalArg(arg, ctx, block) {
  if (arg === null || arg === undefined) {
    throw new RunError('This block has an empty box. Put a number in it.', block);
  }
  if (typeof arg === 'number') return arg;
  if (typeof arg === 'object') {
    const reporter = REPORTERS[arg.op];
    if (!reporter) {
      throw new RunError(`"${arg.op}" is not a block that reports a number.`, arg);
    }
    const sockets = BLOCKS[arg.op]?.args ?? [];
    const values = sockets.map((_, i) => evalArg(arg.args?.[i], ctx, arg));
    return reporter(ctx, values, arg);
  }
  throw new RunError('Something unexpected is in this box.', block);
}

/** Like evalArg, but the answer has to be a real, finite number. */
export function evalNumber(arg, ctx, block) {
  const value = evalArg(arg, ctx, block);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RunError('This block got a number that is too big or is not a number.', block);
  }
  return value;
}
