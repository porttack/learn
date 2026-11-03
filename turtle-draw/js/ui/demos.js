// Turtle Draw: example programs.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Open the app with ?demo=flower in the address (any name below) to start
// with that program already in the workspace. Add &autorun=1 to run it
// straight away and &speed=instant to skip the animation. This is mostly
// for trying things out and for the automated browser checks.

const b = (op, ...args) => ({ op, args });
const repeat = (n, ...body) => ({ op: 'repeat', args: [n], body });

export const DEMOS = {
  square: [b('start'), b('clean'), repeat(4, b('forward', 150), b('right', 90))],
  flower: [
    b('start'),
    b('clean'),
    b('fillscreen', 25, 25, 70),
    b('setcolor', 255, 120, 200),
    b('setpensize', 4),
    repeat(12, repeat(2, b('arc', 60, 140), b('right', 120)), b('right', 30)),
  ],
  arcs: [
    b('start'),
    b('clean'),
    b('setcolor', 220, 0, 0),
    b('arc', 90, 120),
    b('penup'),
    b('setxy', 0, 0),
    b('setheading', 0),
    b('pendown'),
    b('setcolor', 0, 0, 220),
    b('arc', -90, 120),
  ],
  star: [
    b('start'),
    b('clean'),
    b('penup'),
    b('setxy', -110, -100),
    b('pendown'),
    b('setcolor', 255, 200, 0),
    b('startfill'),
    b('setcolor', 120, 60, 0),
    b('setpensize', 6),
    repeat(5, b('forward', 220), b('right', 144)),
    b('endfill'),
  ],
  // Runs until you press Stop: a good test that the page never freezes.
  forever: [
    b('start'),
    b('clean'),
    b('setpensize', 2),
    repeat(1e9, b('forward', 3), b('right', 7)),
  ],
};
