// Turtle Draw: the list of blocks.
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
//   label    the word(s) written on the block
//   args     the sockets, in order. `label` is a small word shown in front
//            of the socket (like "x"), and `default` is what the socket
//            holds when the block comes out of the palette.
//   help     the one-line tip shown when you press and hold the block

export const PALETTES = [
  { id: 'turtle', label: 'Turtle' },
  { id: 'pen', label: 'Pen' },
  { id: 'math', label: 'Math' },
  { id: 'flow', label: 'Flow' },
  { id: 'myblocks', label: 'My Blocks' },
];

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
  pensize: {
    palette: 'pen',
    kind: 'reporter',
    label: 'pen size',
    args: [],
    help: 'Reports how thick the lines are right now.',
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

/** True if `op` names a real block. */
export function isKnownOp(op) {
  return Object.prototype.hasOwnProperty.call(BLOCKS, op);
}
