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
//   help     the one-line tip shown when you press and hold the block

export const PALETTES = [
  { id: 'turtle', label: 'Turtle' },
  { id: 'pen', label: 'Pen' },
  { id: 'math', label: 'Math' },
  { id: 'flow', label: 'Flow' },
  { id: 'myblocks', label: 'My Blocks' },
  { id: 'notes', label: 'Notes' },
];

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
    args: [
      { label: 'red', default: 255 },
      { label: 'green', default: 0 },
      { label: 'blue', default: 0 },
    ],
    help: 'Sets the pen color from amounts of red, green and blue, each from 0 to 255. 0, 0, 0 is black and 255, 255, 255 is white.',
  },
  fillscreen: {
    palette: 'pen',
    kind: 'command',
    label: 'fill screen',
    args: [
      { label: 'red', default: 255 },
      { label: 'green', default: 255 },
      { label: 'blue', default: 255 },
    ],
    help: 'Paints the whole paper one color, using red, green and blue from 0 to 255.',
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
  wait: {
    palette: 'flow',
    kind: 'command',
    label: 'wait tenths',
    args: [{ default: 10 }],
    help: 'Pauses for this many tenths of a second. 10 is one second. Waiting always takes real time, even at Instant speed.',
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

// ---- My Blocks: boxes ---------------------------------------------------
// A box holds one number so you can use it later. It is a variable. There are
// three of them, each with a block that stores a number in it (store1, store2,
// store3) and a block that reports what is in it (box1, box2, box3). They are
// six separate blocks, not one block with a menu, so nothing needs typing.
// A box starts at 0 each time a program runs.
export const BOX_COUNT = 3;

for (let n = 1; n <= BOX_COUNT; n += 1) {
  BLOCKS[`store${n}`] = {
    palette: 'myblocks',
    kind: 'command',
    label: `store in box${n}`,
    args: [{ default: 0 }],
    help: `Puts a number in box${n} so you can use it later. A box starts at 0 each time you run.`,
  };
  BLOCKS[`box${n}`] = {
    palette: 'myblocks',
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

/** True if `op` names a real block. */
export function isKnownOp(op) {
  return Object.prototype.hasOwnProperty.call(BLOCKS, op);
}
