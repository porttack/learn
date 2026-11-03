// TurtleLab: example programs.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Open the app with ?demo=flower in the address (any name below) to start
// with that program already in the workspace. Add &autorun=1 to run it
// straight away and &speed=instant to skip the animation. This is mostly
// for trying things out and for the automated browser checks.

const b = (op, ...args) => ({ op, args });
const repeat = (n, ...body) => ({ op: 'repeat', args: [n], body });

// A demo is a list of blocks (one stack), or { stacks: [...] } for several: a block
// you make is a stack of its own, and so is the program that calls it.
const to = (name, params, ...body) => ({ x: 90, y: 70, blocks: [{ op: 'to', name, params }, ...body] });
const program = (...blocks) => ({ x: 420, y: 70, blocks: [b('start'), b('clean'), ...blocks] });
const call = (name, params, ...args) => ({ op: 'call', name, params, args });
const input = (name) => ({ op: 'input', name });

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
  // The square's size comes from a box.
  boxes: [
    b('start'),
    b('clean'),
    b('store1', 120),
    repeat(4, b('forward', { op: 'box1' }), b('right', 90)),
  ],
  // Counts laps in a box, draws a step each lap, and stops when box1 reaches 5.
  counting: [
    b('start'),
    b('clean'),
    b('store1', 0),
    { op: 'forever', args: [], body: [
      b('store1', { op: 'add', args: [{ op: 'box1' }, 1] }),
      b('forward', 10),
      { op: 'if', args: [{ op: 'equal', args: [{ op: 'box1' }, 5] }], body: [b('stop')] },
    ] },
  ],
  // Waits most of a second, then moves. (Checks that waiting is real time.)
  waiting: [b('start'), b('clean'), b('wait', 8), b('forward', 50)],
  // The program shown on the home page banner (made by dev/make-banner.mjs): a growing spiral.
  banner: [
    b('start'),
    b('setcolor', 20, 110, 255),
    repeat(75, b('forward', { op: 'box1' }), b('right', 89), b('store1', { op: 'add', args: [{ op: 'box1' }, 3] })),
  ],
  // ( 2 + 3 ) x 4 with parentheses: the turtle goes up 20.
  parens: [
    b('start'),
    b('clean'),
    b('forward', { op: 'multiply', args: [{ op: 'paren', args: [{ op: 'add', args: [2, 3] }] }, 4] }),
  ],
  // Reads the pen color back into boxes 1 to 3.
  pencolor: [
    b('start'),
    b('setcolor', 10, 20, 30),
    b('store1', { op: 'penred' }),
    b('store2', { op: 'pengreen' }),
    b('store3', { op: 'penblue' }),
  ],
  // Waits a minute (so Stop has to cut the wait short).
  longwait: [b('start'), b('clean'), b('wait', 600), b('forward', 50)],
  // An if with nothing plugged into it: Run must explain, and mark the if.
  emptyif: [b('start'), { op: 'if', args: [null], body: [b('forward', 10)] }],
  // An if else with a true condition: only the first mouth runs, so the turtle
  // ends 100 steps up. The false one runs only the else mouth, 100 steps down.
  ifelseyes: [b('start'), b('clean'), { op: 'ifelse', args: [{ op: 'less', args: [1, 2] }], body: [b('forward', 100)], elseBody: [b('back', 100)] }],
  ifelseno: [b('start'), b('clean'), { op: 'ifelse', args: [{ op: 'less', args: [2, 1] }], body: [b('forward', 100)], elseBody: [b('back', 100)] }],
  // A speed block slows the run to a crawl (the same program without it is over at once).
  slowdown: [b('start'), b('clean'), b('speed', 1), b('forward', 30), b('forward', 30), b('forward', 30), b('forward', 30)],
  // Slow, then instant: fifty slow steps would take 25 seconds, so finishing quickly proves the switch.
  speedup: [b('start'), b('clean'), b('speed', 1), b('forward', 30), b('speed', 4), repeat(50, b('forward', 2))],
  // A block of your own with an input: a square of any size, used twice. Ends 120 up and 50 to the right.
  squarefn: {
    stacks: [
      to('square', ['size'], repeat(4, b('forward', input('size')), b('right', 90))),
      program(call('square', ['size'], 70), call('square', ['size'], 50)),
    ],
  },
  // A block that calls itself, with a way to stop: a circle made 360 times over (depth 360).
  circlefn: {
    stacks: [
      to('circle', ['n'], { op: 'if', args: [b('greater', input('n'), 0)], body: [b('forward', 1), b('right', 1), call('circle', ['n'], b('subtract', input('n'), 1))] }),
      program(call('circle', ['n'], 360)),
    ],
  },
  // A block that calls itself with no way to stop: the run ends with a friendly message.
  forevercall: { stacks: [to('again', [], b('forward', 1), call('again', [])), program(call('again', []))] },
  // A call to a block that is not there.
  ghostcall: { stacks: [program(call('ghost', []))] },
  // Two blocks with the same name.
  twinblocks: { stacks: [to('twin', [], b('forward', 10)), { ...to('Twin', [], b('forward', 20)), y: 250 }, program(call('twin', []))] },
  // Stop inside a block of your own only leaves that block.
  stopinside: { stacks: [to('quit', [], b('forward', 10), { op: 'stop', args: [] }, b('forward', 1000)), program(call('quit', []), b('forward', 5))] },
  // Prints a calculation.
  printing: [
    b('start'),
    b('store1', 7),
    b('print', { op: 'multiply', args: [{ op: 'box1' }, 3] }),
    b('print', 0.1),
  ],
  // Reads box1 BEFORE storing in it. Every run must see 0 first, so the turtle
  // never moves. (If boxes survived from one run to the next, the second run
  // would move it.) Used by the automated checks.
  boxorder: [
    b('start'),
    b('clean'),
    b('forward', { op: 'box1' }),
    b('store1', 50),
  ],
  // Runs until you press Stop: a good test that the page never freezes.
  forever: [
    b('start'),
    b('clean'),
    b('setpensize', 2),
    repeat(1e9, b('forward', 3), b('right', 7)),
  ],
};
