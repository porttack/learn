// TurtleLab: the list of blocks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// This file is the one place that says what blocks exist. The palette reads
// it to know what to show, the project loader reads it to know which blocks
// are real, and the help tips come from here too. The interpreter (which
// actually runs the blocks) lives in interpreter.js.
//
// Each block has:
//   palette  which of the five palettes it lives in
//   kind     'command'   snaps above and below other blocks
//            'clamp'     a command with a C-shaped hole for blocks inside
//            'hat'       a command with a cap on top: blocks snap below it,
//                        but nothing can snap above it. It starts a stack.
//            'reporter'  plugs into a socket and hands back a number
//            'note'      a sticky note with text on it. It floats on the page,
//                        connects to nothing, and never changes what runs.
//   label    the word(s) written on the block
//   lines    optional: the label split over two or more lines, centered, for a
//            block that reads better stacked ('store in' over 'box1'). Only
//            commands with a socket use it. `label` is still the plain text.
//   args     the sockets, in order. `label` is a small word shown in front
//            of the socket (like "x"), and `default` is what the socket
//            holds when the block comes out of the palette. `type` is
//            'number' (the usual round socket) or 'boolean' (a pointed
//            socket that takes only a yes-or-no block, like the one in `if`).
//   returns  for a reporter: 'number' (the usual) or 'boolean'. A reporter
//            only fits a socket of the same type.
//   layout   for a reporter with sockets: how it reads. 'infix' puts the
//            label between its two sockets, like a sum: [ a ] + [ b ].
//            'prefix' puts the label first: random [ a ] [ b ]. 'wrap' puts
//            text on both sides of one socket, like ( [ a ] ), using
//            `label` before it and `endLabel` after. Either way
//            the sockets sit side by side inside the block, so an expression
//            reads left to right. (Blocks without a layout stack their
//            sockets down the right edge.)
//   endsStack  true for a block with nothing below it (like stop)
//   mouths   for a clamp: how many C-shaped holes it has (1 if not given).
//            if else has 2. The blocks in each live in the block's `body`
//            and `elseBody` (see BODY_KEYS).
//   mouthLabels  for a clamp with a yes-or-no socket: the little word beside
//            each mouth ('' for none), like the 'else' of if else.
//   textSlot for a command that has words typed on it, like write: { hint } is what its empty
//            box says, `default` the words a new block starts with (Hello if none), `max` how many letters it may hold
//            (40 if none) and `shows` how many of them the box on the block shows before it ends in dots (16 if none). The words are kept in the block's `text` (see project.js), apart from its sockets.
//   endLabel for a block with a textSlot: a little word written after the box, like the 'into box1' of ask.
//   fontSlot true for a block that is a dropdown of fonts (set font). The choice is kept in the
//            block's `font` (see project.js), apart from its sockets.
//   colorSlot true for a block that has a color box on it (set color, fill screen): it shows the color of the three numbers and its hex, and pressing it
//            opens the color picker, which changes the three numbers. It keeps nothing of its own: the color is the three sockets.
//   help     the one-line tip shown when you press and hold the block

export const PALETTES = [
  { id: 'turtle', label: 'Turtle' },
  { id: 'pen', label: 'Pen' },
  { id: 'math', label: 'Math' },
  { id: 'flow', label: 'Flow' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'myblocks', label: 'My Blocks' },
  { id: 'notes', label: 'Notes' },
];

/** Where the blocks inside a clamp's mouths are kept in a block, mouth by mouth. */
export const BODY_KEYS = ['body', 'elseBody'];

/** How many mouths a block has (0 if it is not a clamp). */
export function mouthCount(spec) {
  return spec.kind === 'clamp' ? spec.mouths ?? 1 : 0;
}

/**
 * The speeds a `speed` block can pick, slowest first: 1 is slow, 4 is instant.
 * They are the same names the scheduler uses (a test keeps the two in step).
 */
export const SPEED_NAMES = Object.freeze(['slow', 'medium', 'fast', 'instant']);

/** The speed a program starts at every time it runs. */
export const DEFAULT_SPEED = 'fast';

/** The most characters a sticky note can hold. */
export const NOTE_MAX_CHARS = 300;

export const BLOCKS = {
  // ---- Turtle ----------------------------------------------------------
  clean: {
    palette: 'turtle',
    kind: 'command',
    label: 'clean',
    args: [],
    help: 'Wipes the drawing and puts the turtle back in the middle, facing up.',
  },
  forward: {
    palette: 'turtle',
    kind: 'command',
    label: 'forward',
    args: [{ default: 100 }],
    help: 'Moves the turtle forward. If the pen is down, it draws a line.',
  },
  back: {
    palette: 'turtle',
    kind: 'command',
    label: 'back',
    args: [{ default: 100 }],
    help: 'Moves the turtle backward without turning around.',
  },
  left: {
    palette: 'turtle',
    kind: 'command',
    label: 'left',
    args: [{ default: 90 }],
    help: 'Turns the turtle to its left by this many degrees. A full turn is 360.',
  },
  right: {
    palette: 'turtle',
    kind: 'command',
    label: 'right',
    args: [{ default: 90 }],
    help: 'Turns the turtle to its right by this many degrees. A full turn is 360.',
  },
  arc: {
    palette: 'turtle',
    kind: 'command',
    label: 'arc',
    args: [
      { label: 'angle', default: 90 },
      { label: 'radius', default: 100 },
    ],
    help: 'Curves along a circle. A positive angle curves right, a negative angle curves left.',
  },
  setxy: {
    palette: 'turtle',
    kind: 'command',
    label: 'set xy',
    args: [
      { label: 'x', default: 0 },
      { label: 'y', default: 0 },
    ],
    help: 'Moves the turtle to a spot on the paper. The middle is 0, 0. It draws a line if the pen is down.',
  },
  setheading: {
    palette: 'turtle',
    kind: 'command',
    label: 'set heading',
    args: [{ default: 0 }],
    help: 'Points the turtle in a direction. 0 is up, 90 is right, 180 is down and 270 is left.',
  },
  x: {
    palette: 'turtle',
    kind: 'reporter',
    label: 'x',
    args: [],
    help: 'Reports how far right of the middle the turtle is. It is negative on the left side.',
  },
  y: {
    palette: 'turtle',
    kind: 'reporter',
    label: 'y',
    args: [],
    help: 'Reports how far up from the middle the turtle is. It is negative below the middle.',
  },
  heading: {
    palette: 'turtle',
    kind: 'reporter',
    label: 'heading',
    args: [],
    help: 'Reports the direction the turtle is facing, in degrees.',
  },

  // ---- Pen -------------------------------------------------------------
  penup: {
    palette: 'pen',
    kind: 'command',
    label: 'pen up',
    args: [],
    help: 'Lifts the pen so the turtle can move without drawing.',
  },
  pendown: {
    palette: 'pen',
    kind: 'command',
    label: 'pen down',
    args: [],
    help: 'Puts the pen down so the turtle draws as it moves.',
  },
  setpensize: {
    palette: 'pen',
    kind: 'command',
    label: 'set pen size',
    args: [{ default: 5 }],
    help: 'Sets how thick the lines are.',
  },
  setcolor: {
    palette: 'pen',
    kind: 'command',
    label: 'set color',
    colorSlot: true,
    args: [
      { label: 'red', default: 255 },
      { label: 'green', default: 0 },
      { label: 'blue', default: 0 },
    ],
    help: 'Sets the pen color from amounts of red, green and blue, each from 0 to 255. 0, 0, 0 is black and 255, 255, 255 is white. Tap the color box to pick a color, and see it as hex and binary too.',
  },
  fillscreen: {
    palette: 'pen',
    kind: 'command',
    label: 'fill screen',
    colorSlot: true,
    args: [
      { label: 'red', default: 255 },
      { label: 'green', default: 255 },
      { label: 'blue', default: 255 },
    ],
    help: 'Paints the whole paper one color, using red, green and blue from 0 to 255. Tap the color box to pick a color, and see it as hex and binary too.',
  },
  startfill: {
    palette: 'pen',
    kind: 'command',
    label: 'start fill',
    args: [],
    help: 'Starts remembering the path the turtle walks so the shape can be filled in.',
  },
  endfill: {
    palette: 'pen',
    kind: 'command',
    label: 'end fill',
    args: [],
    help: 'Fills in the shape the turtle walked since start fill, using the pen color from when it started.',
  },
  pensize: {
    palette: 'pen',
    kind: 'reporter',
    label: 'pen size',
    args: [],
    help: 'Reports how thick the lines are right now.',
  },
  penred: {
    palette: 'pen',
    kind: 'reporter',
    label: 'pen red',
    args: [],
    help: 'Reports how much red is in the pen color right now, from 0 to 255.',
  },
  pengreen: {
    palette: 'pen',
    kind: 'reporter',
    label: 'pen green',
    args: [],
    help: 'Reports how much green is in the pen color right now, from 0 to 255.',
  },
  penblue: {
    palette: 'pen',
    kind: 'reporter',
    label: 'pen blue',
    args: [],
    help: 'Reports how much blue is in the pen color right now, from 0 to 255.',
  },

  // ---- Flow ------------------------------------------------------------
  start: {
    palette: 'flow',
    kind: 'hat',
    label: 'start',
    args: [],
    help: 'The Run button starts here. Snap the blocks you want to run under this one.',
  },
  // An event handler: a hat that Run never starts from. While a program is running (or has finished and is listening, see Scheduler), each
  // click on the paper runs the blocks under it, with mouseX and mouseY (just under it) saying where the click was.
  onclick: {
    palette: 'flow',
    kind: 'hat',
    label: 'when paper clicked',
    args: [],
    help: 'Runs the blocks under it every time you click the paper while your program is running. mouseX and mouseY (just under this block) tell you where you clicked. If your program has one of these, it keeps listening for clicks after the last block, until you press Stop.',
  },
  // mouseX and mouseY are built in variables, like the boxes but set by the program's surroundings: where the paper was last clicked (0 and 0 until it is).
  // They are global, so they work anywhere (in the main program, in a block you made, in a click handler), and they hold their place until the next click.
  // They sit in the Flow palette right under the hat, so the event and the numbers it gives you are together.
  mousex: {
    palette: 'flow',
    kind: 'reporter',
    label: 'mouseX',
    args: [],
    help: 'Reports how far right of the middle the paper was last clicked (negative on the left). It is 0 until you click, and it stays the same until the next click.',
  },
  mousey: {
    palette: 'flow',
    kind: 'reporter',
    label: 'mouseY',
    args: [],
    help: 'Reports how far above the middle the paper was last clicked (negative below). It is 0 until you click, and it stays the same until the next click.',
  },
  repeat: {
    palette: 'flow',
    kind: 'clamp',
    label: 'repeat',
    args: [{ default: 4 }],
    help: 'Runs the blocks inside again and again, this many times.',
  },
  forever: {
    palette: 'flow',
    kind: 'clamp',
    label: 'forever',
    args: [],
    help: 'Runs the blocks inside again and again until you press Stop.',
  },
  if: {
    palette: 'flow',
    kind: 'clamp',
    label: 'if',
    args: [{ type: 'boolean' }],
    help: 'Runs the blocks inside only if the yes-or-no block plugged into it is true. Plug a less than, greater than or equals block into it.',
  },
  ifelse: {
    palette: 'flow',
    kind: 'clamp',
    mouths: 2,
    label: 'if',
    mouthLabels: ['', 'else'],
    args: [{ type: 'boolean' }],
    help: 'Runs the blocks in the top mouth if the yes-or-no block is true, and the blocks under else if it is false. It always does one or the other.',
  },
  wait: {
    palette: 'flow',
    kind: 'command',
    label: 'wait',
    args: [{ default: 10 }],
    help: 'Pauses for this many tenths of a second. 10 is one second. Waiting always takes real time, even at Instant speed.',
  },
  speed: {
    palette: 'flow',
    kind: 'command',
    label: 'speed',
    args: [{ default: 1 }],
    help: 'Sets how fast the program runs from here on, so you can watch it draw. 1 is slow, 2 is medium, 3 is fast and 4 is instant. Every time you press Run it starts at 3.',
  },
  stop: {
    palette: 'flow',
    kind: 'command',
    endsStack: true,
    label: 'stop',
    args: [],
    help: 'Stops the program right here. Nothing can go below it.',
  },

  // ---- Math ------------------------------------------------------------
  // These plug into the sockets of other blocks. Plug one into another to
  // build a longer sum: the block inside is worked out first.
  add: {
    palette: 'math',
    kind: 'reporter',
    layout: 'infix',
    label: '+',
    args: [{ default: 1 }, { default: 1 }],
    help: 'Adds two numbers.',
  },
  subtract: {
    palette: 'math',
    kind: 'reporter',
    layout: 'infix',
    label: '-',
    args: [{ default: 5 }, { default: 1 }],
    help: 'Subtracts the second number from the first.',
  },
  multiply: {
    palette: 'math',
    kind: 'reporter',
    layout: 'infix',
    label: '\u00d7',
    args: [{ default: 2 }, { default: 2 }],
    help: 'Multiplies two numbers.',
  },
  divide: {
    palette: 'math',
    kind: 'reporter',
    layout: 'infix',
    label: '\u00f7',
    args: [{ default: 10 }, { default: 2 }],
    help: 'Divides the first number by the second. You cannot divide by zero.',
  },
  mod: {
    palette: 'math',
    kind: 'reporter',
    layout: 'infix',
    label: '%',
    args: [{ default: 10 }, { default: 3 }],
    help: 'Modulo: the remainder left over when the first number is divided by the second. 10 % 3 is 1.',
  },
  paren: {
    palette: 'math',
    kind: 'reporter',
    layout: 'wrap',
    label: '(',
    endLabel: ')',
    args: [{ default: 0 }],
    help: 'Parentheses. They give back whatever is inside them. Putting a block inside another block already decides what is worked out first, so these are for reading: ( 3 + 4 ) \u00d7 2.',
  },
  random: {
    palette: 'math',
    kind: 'reporter',
    layout: 'prefix',
    label: 'random',
    args: [
      { label: 'low', default: 1 },
      { label: 'high', default: 10 },
    ],
    help: 'Picks a random number from low to high. Whole numbers in, whole number out.',
  },
  oneof: {
    palette: 'math',
    kind: 'reporter',
    layout: 'prefix',
    label: 'one of',
    args: [
      { label: 'a', default: 0 },
      { label: 'b', default: 1 },
    ],
    help: 'Picks one of the two numbers at random.',
  },
  less: {
    palette: 'math',
    kind: 'reporter',
    returns: 'boolean',
    layout: 'infix',
    label: '<',
    args: [{ default: 0 }, { default: 0 }],
    help: 'True if the first number is less than the second. Plug it into an if block.',
  },
  greater: {
    palette: 'math',
    kind: 'reporter',
    returns: 'boolean',
    layout: 'infix',
    label: '>',
    args: [{ default: 0 }, { default: 0 }],
    help: 'True if the first number is greater than the second. Plug it into an if block.',
  },
  equal: {
    palette: 'math',
    kind: 'reporter',
    returns: 'boolean',
    layout: 'infix',
    label: '=',
    args: [{ default: 0 }, { default: 0 }],
    help: 'True if the two numbers are the same. Plug it into an if block.',
  },
  print: {
    palette: 'math',
    kind: 'command',
    label: 'print',
    args: [{ default: 0 }],
    help: 'Shows a number in the box at the top right, so you can see what is going on. It is not drawn on the paper.',
  },
};

// ---- Blocks you make yourself ----------------------------------------------
// A stack that starts with a `to` block is the DEFINITION of a block: its name and
// inputs are typed on the hat, and the blocks under it are what it does. Using
// it is a `call` block, and an `input` block hands back the number that was
// given. These three are not fixed like the others: a call's label and sockets
// come from the names stored in the block itself (see specOf), and the call and
// input blocks are shown in the palette once a definition exists.
BLOCKS.to = {
  palette: 'myblocks',
  kind: 'hat',
  label: 'to',
  args: [],
  defines: true,
  help: 'Makes a block of your own. Type its name, and add up to two inputs. Put blocks under it for what it does, then find your new block in this palette.',
};
BLOCKS.call = {
  palette: 'myblocks',
  kind: 'command',
  label: 'call',
  args: [],
  dynamic: true,
  help: 'Runs a block you made.',
};
BLOCKS.input = {
  palette: 'myblocks',
  kind: 'reporter',
  label: 'input',
  args: [],
  dynamic: true,
  help: 'The number this input was given. It only works inside the block that has it.',
};

/**
 * The spec that goes with a block. For most blocks that is just BLOCKS[op].
 * A block you made yourself is drawn from the names stored in it: a call is
 * labelled with the name and has a socket for each input, and an input is
 * labelled with its name.
 */
export function specOf(block) {
  if (block.op === 'call') {
    const params = Array.isArray(block.params) ? block.params : [];
    return {
      ...BLOCKS.call,
      label: block.name ?? '',
      args: params.map((label) => ({ label, default: 100 })),
      help: `Runs your block ${block.name ?? ''}. ${params.length > 0 ? 'Type a number for each input.' : ''}`.trim(),
    };
  }
  if (block.op === 'input') {
    return { ...BLOCKS.input, label: block.name ?? '', help: `The number given to the input ${block.name ?? ''}. It only works inside the block that has it.` };
  }
  return BLOCKS[block.op];
}

// ---- Boxes -------------------------------------------------------------
// A box holds one number so you can use it later. It is a variable. There are
// four of them, each with a block that stores a number in it (store1 to store4)
// and a block that reports what is in it (box1 to box4). They are eight separate
// blocks, not one block with a menu, so nothing needs typing. A box starts at 0
// each time a program runs. (More boxes only means changing this number: every
// list, test and readout is made from it. A project that used fewer boxes still opens.)
export const BOX_COUNT = 4;

// The ask block is how a person gives a program a number while it runs. It lives with the boxes because the answer goes in a box:
// always box1 (simple first: a program that needs box1 for something else stores the answer in another box straight away).
// The question is typed on the block like the words of a write block. `ask` is a command, not a reporter, because a reporter is
// worked out at once and this has to wait for a person (see Ask in interpreter.js).
export const ASK_MAX_CHARS = 60;
BLOCKS.ask = {
  palette: 'boxes',
  kind: 'command',
  label: 'ask',
  endLabel: 'into box1',
  args: [],
  textSlot: { hint: 'question', default: 'How many?', max: ASK_MAX_CHARS, shows: 30 },
  help: 'Asks a question and waits. Type a number, press Enter, and the number goes into box1, ready to use. Tap the words to change the question. Press Stop if you do not want to answer.',
};

for (let n = 1; n <= BOX_COUNT; n += 1) {
  BLOCKS[`store${n}`] = {
    palette: 'boxes',
    kind: 'command',
    label: `store in box${n}`,
    lines: ['store in', `box${n}`],
    args: [{ default: 0 }],
    help: `Puts a number in box${n} so you can use it later. A box starts at 0 each time you run.`,
  };
  BLOCKS[`box${n}`] = {
    palette: 'boxes',
    kind: 'reporter',
    label: `box${n}`,
    args: [],
    help: `Reports the number stored in box${n}. It is 0 until you store something in it.`,
  };
}

// ---- Notes -------------------------------------------------------------
// A sticky note is for explaining your program to yourself and to others. Its
// words are kept in the block's `text` (see project.js), not in a socket.
BLOCKS.note = {
  palette: 'notes',
  kind: 'note',
  label: 'note',
  args: [],
  help: 'A sticky note. Tap it to write what your program does. Notes never change how your program runs.',
};

// ---- Writing ------------------------------------------------------------
// The one block with words typed on it, apart from a sticky note. It lives with the notes: it is
// not a way to draw, it is words on a drawing (and a student learning to draw letters with the
// turtle, as in the lessons, should not reach for it).
BLOCKS.write = {
  palette: 'notes',
  kind: 'command',
  label: 'write',
  args: [{ label: 'size', default: 60 }],
  textSlot: { hint: 'words' },
  help: 'Writes words with the pen: its color and thickness, in the font and curve you set, starting where the turtle is. The tops of the letters point the way the turtle faces. Tap the words to change them. Size is how tall a capital letter is. The turtle traces each letter, lifting the pen between strokes, at the speed your program has. The turtle does not move.',
};

// The settings the write block uses, kept by the turtle like the pen's color and thickness (and put back by clean).
BLOCKS.setfont = {
  palette: 'notes',
  kind: 'command',
  label: 'set font',
  args: [],
  fontSlot: true,
  help: 'Chooses the font the write blocks after it use. Tap the font to pick another: each one shows the words in it. It starts as script, and clean puts it back.',
};
BLOCKS.setcurve = {
  palette: 'notes',
  kind: 'command',
  label: 'set curve',
  args: [{ default: 120 }],
  help: 'Bends the words the write blocks after it write, this many degrees over the whole word. A positive number arches like a rainbow, a negative number is a bowl like a smile, 360 goes right round a circle, and 0 is straight. Bent words are centered on the turtle. Clean puts it back to 0.',
};

/** True if `op` names a real block. */
export function isKnownOp(op) {
  return Object.prototype.hasOwnProperty.call(BLOCKS, op);
}
