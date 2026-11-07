// TurtleLab: sample programs for students.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Open the app with ?sample=square (any id below) to see one: it loads into the
// workspace with a sticky note that explains it, and runs by itself. The
// Samples page (samples.html) links to every one of them. The page and its
// thumbnails are made from this list by dev/make-samples-page.mjs and
// dev/make-sample-thumbs.mjs, so the words only live here.
//
// These are different from the developer demos in demos.js, which exist for
// the automated checks. Everything here is written for a student to read:
// short words, no dashes, and a note that says WHY, not just what.
//
// Opening a sample never saves anything and never reads what is saved (see
// main.js), so it cannot touch a student's own work.

import { zoomToFit } from '../core/view.js';

// The smallest the page zooms out to (zoomToFit's own limit in core/view.js).
const MIN_SAMPLE_ZOOM = 0.6;

const b = (op, ...args) => ({ op, args });
const rep = (count, ...body) => ({ op: 'repeat', args: [count], body });
const ifElse = (condition, body, elseBody) => ({ op: 'ifelse', args: [condition], body, elseBody });
const sum = (a, c) => b('add', a, c);
const minus = (a, c) => b('subtract', a, c);
const box1 = { op: 'box1' };
const box2 = { op: 'box2' };
const box3 = { op: 'box3' };
const box4 = { op: 'box4' };
const mouseX = { op: 'mousex' };
const mouseY = { op: 'mousey' };
const input = (name) => ({ op: 'input', name });
const call = (name, params, ...args) => ({ op: 'call', name, params, args });

// The school's cougar paw and SLV letters, traced from the school's own picture and turned into
// turtle numbers (the paper is 700 by 560 and the whole logo is about 370 by 450). They are shared
// by the paw samples near the end of the list. A `place` block lifts the pen, moves, and puts it
// down again, so every shape in the main program is two blocks: place, then draw.
const RED = [196, 30, 45];
const place = (x, y) => call('place', ['x', 'y'], x, y);
const PLACE = { name: 'place', params: ['x', 'y'], body: [b('penup'), b('setxy', input('x'), input('y')), b('pendown')] };
// A toe is a rounded shape made of four quarter circles, two small and two big, so it is longer than it is wide.
// It first turns the turtle to face the way it is told, which is what turns the whole toe.
const TOE = { name: 'toe', params: ['direction'], body: [b('setheading', input('direction')), rep(2, b('arc', 90, 30), b('arc', 90, 75))] };
const PAD = {
  name: 'pad',
  params: [],
  body: [b('setheading', 52), b('arc', -13, 408), b('arc', 121, 45), b('arc', -35, 123), b('arc', 104, 31), b('arc', 42, 146), b('arc', 50, 128), b('arc', 91, 31)],
};
/** A letter is a closed shape drawn from corner to corner. */
const letter = (name, corners) => ({
  name: `letter ${name}`,
  params: [],
  body: [b('penup'), b('setxy', ...corners[0]), b('pendown'), ...corners.slice(1).map((corner) => b('setxy', ...corner)), b('setxy', ...corners[0])],
});
// The S is two halves that are exactly alike (turn the page upside down and it looks the same), so
// one half is drawn twice: a big curve out, a small curve in, and a flat cut across the end of the stroke.
const LETTER_S = {
  name: 'letter S',
  params: [],
  body: [
    b('penup'), b('setxy', -87, 196), b('setheading', 330), b('pendown'),
    rep(2, b('arc', -240, 50), b('arc', 240, 10), b('left', 90), b('forward', 40), b('left', 90)),
  ],
};
const LETTER_L = letter('L', [[-67, 225], [10, 226], [3, 145], [58, 150], [60, 101], [-70, 100]]);
// The V has a thin slit down the middle of its top, which is its second, third and fourth corners.
const LETTER_V = letter('V', [[45, 226], [118, 225], [121, 160], [124, 223], [182, 221], [135, 72], [92, 91]]);
/** The four toes and the pad, lifted `up` so the paw alone sits in the middle of the paper. */
const pawBlocks = (up) => [
  place(-125, -12 + up), call('toe', ['direction'], 55),
  place(-17, -44 + up), call('toe', ['direction'], 223),
  place(41, 66 + up), call('toe', ['direction'], 59),
  place(118, -128 + up), call('toe', ['direction'], 241),
  place(-97, -135 + up), call('pad', []),
];

// The letters A, B and C for the two initials samples, drawn piece by piece (never by the write block). Each
// letter is a block of its own that draws from wherever the turtle is, so it can be used anywhere (and by anyone's
// initials): it starts at its bottom left corner, facing up, with the pen down. A `place` block moves the turtle
// there without drawing. The letters are 120 tall. In every B the top part is a little smaller than the bottom part,
// which is how you can tell which is which. The same A is in both samples.
const INITIALS_BLUE = [30, 80, 200];
const PLACE_FACING_UP = {
  name: 'place',
  params: ['x', 'y'],
  body: [b('penup'), b('setxy', input('x'), input('y')), b('setheading', 0), b('pendown')],
};
const letterBlock = (name, ...body) => ({ name: `letter ${name}`, params: [], body });
// Two slanted legs, then the bar across, found by walking back up the right leg with the pen up.
const LETTER_A_BLOCK = letterBlock(
  'A',
  b('right', 25), b('forward', 132), b('right', 130), b('forward', 132),
  b('penup'), b('back', 55), b('right', 115), b('pendown'), b('forward', 65),
);
// B in straight lines: up the spine, round the smaller top box and along the middle, then down and round the bigger bottom box.
const STRAIGHT_B = letterBlock(
  'B',
  b('forward', 120), b('right', 90), b('forward', 51), b('right', 90), b('forward', 52), b('right', 90), b('forward', 51),
  b('left', 90), b('forward', 68), b('left', 90), b('forward', 64), b('left', 90), b('forward', 68), b('left', 90), b('forward', 13),
);
// C starts at the bottom left like the others, so it hops to its bottom right end (pen up) and draws back along the bottom.
const HOP_TO_BOTTOM_RIGHT = [b('penup'), b('right', 90), b('forward', 90), b('right', 180), b('pendown')];
const STRAIGHT_C = letterBlock('C', ...HOP_TO_BOTTOM_RIGHT, b('forward', 90), b('right', 90), b('forward', 120), b('right', 90), b('forward', 90));
// B with arcs: up the spine, then a top bowl (radius 26) and a bigger bottom bowl (radius 34).
const CURVED_B = letterBlock(
  'B',
  b('forward', 120), b('right', 90), b('forward', 25), b('arc', 180, 26), b('forward', 25),
  b('right', 180), b('forward', 30), b('arc', 180, 34), b('forward', 30),
);
const CURVED_C = letterBlock('C', ...HOP_TO_BOTTOM_RIGHT, b('forward', 30), b('arc', 180, 60), b('forward', 30));
const initialsProgram = () => [
  b('start'), b('clean'), b('setcolor', ...INITIALS_BLUE), b('setpensize', 6),
  call('place', ['x', 'y'], -160, -60), call('letter A', []),
  call('place', ['x', 'y'], -18, -60), call('letter B', []),
  call('place', ['x', 'y'], 76, -60), call('letter C', []),
];

/**
 * The samples, easiest first. Fields:
 *   id        the name in ?sample=... (lowercase letters and dashes)
 *   title     what the Samples page calls it
 *   summary   one sentence for the Samples page
 *   look      what the picture looks like, for the picture's alt text
 *   concepts  the ideas it shows, as little tags on the Samples page
 *   note      the sticky note (300 characters at most)
 *   program   the blocks, starting with a Start block
 *   defines   optional: blocks the sample makes, each { name, params, body }
 *   handlers  optional: click handlers, each a list of the blocks under a `when paper clicked` hat. They go with the blocks it makes (down the left), and a sample with one
 *             waits for clicks after its last block, until Stop.
 *   allLeft   optional, true to put the note, the program and the blocks it makes all down the left (note first, then the program, then the rest) and leave the right edge empty. For a
 *             sample that prints, since the Output box sits at the top right edge and would cover blocks there, and for one the student clicks on, so the whole paper is clear
 *   answers   optional, for the tests and the browser checks only: what to type when an ask block asks, in order (a sample that asks waits for a person, so the checks need to be one)
 *   clicks    optional, the same: where to click the paper, as [x, y] in the turtle's steps, once the program is listening. They must be on clear paper, where no block of the sample sits,
 *             even in a lesson frame that is only 700 wide
 *   hideBlocks optional, `true` for a demo whose program is too big to sit beside the paper in a lesson's frame (about 700 wide): inside the frame, and only there, it starts with the blocks hidden
 *             (the frame has no button to bring them back, so the lesson page shows the program as an outline). Open full size is the whole app, with the blocks.
 *   listed    optional, `false` for a demo that only a lesson page frames (see "Embedding in lessons" in CLAUDE.md): it opens with ?sample=... like any
 *             other, but it is not on the Samples page and has no thumbnail. Everything else about it is held to the same tests.

 *   clearWidth  optional: how wide the drawing is, in turtle steps (the paper is 700). Blocks you make may use the
 *             empty sides of the paper. Without it, the whole paper is kept clear.
 *   maxHops   optional, for a sample made for an embroidery machine: how many separate lines it may have
 *             (the machine stops and cuts the thread between them). Without it, at most 2.
 */
export const SAMPLES = [
  {
    id: 'square',
    title: 'A square',
    summary: 'Four sides and four turns, written once and repeated.',
    look: 'A blue square with thick sides',
    concepts: ['repeat'],
    note: 'A square is four sides and four turns. Repeat does the same blocks again and again, so you only write them once. Try changing the 4 to 3. What do you get?',
    program: [b('start'), b('clean'), b('setcolor', 0, 90, 220), b('setpensize', 6), rep(4, b('forward', 100), b('right', 90))],
  },
  {
    id: 'dotted-circle',
    title: 'A dotted circle',
    summary: 'Lift the pen between dashes to draw a ring of dots.',
    look: 'A ring of short dashes forming a circle',
    concepts: ['repeat', 'pen up and down'],
    note: 'Pen up lifts the pen, so the turtle moves without drawing. Pen down puts it back. Together they make dashes. 36 turns of 10 degrees add up to a full circle, 360.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 6),
      rep(36, b('pendown'), b('forward', 8), b('penup'), b('forward', 8), b('right', 10)),
    ],
  },
  {
    id: 'hexagon-flower',
    title: 'Hexagon flower',
    summary: 'A repeat inside a repeat: the inside draws a hexagon, the outside spins it.',
    look: 'Six green hexagons overlapping in a flower shape',
    concepts: ['repeat inside repeat'],
    note: 'The inside repeat draws one hexagon: 6 sides, turning 60 degrees each time. The outside repeat turns the turtle 60 degrees and does it again. Six hexagons make a flower.',
    program: [
      b('start'),
      b('clean'),
      b('setcolor', 0, 160, 90),
      b('setpensize', 3),
      rep(6, rep(6, b('forward', 60), b('right', 60)), b('right', 60)),
    ],
  },
  {
    id: 'flower',
    title: 'Flower',
    summary: 'Curved petals on a dark blue sky.',
    look: 'A pink flower with twelve petals on a dark blue background',
    concepts: ['arc', 'fill screen'],
    note: 'Each petal is two arcs. An arc curves as it goes, instead of going straight. Twelve petals, each turned 30 degrees, makes 360. Fill screen paints the whole paper first.',
    program: [
      b('start'),
      b('clean'),
      b('fillscreen', 25, 25, 70),
      b('setcolor', 255, 120, 200),
      b('setpensize', 4),
      rep(12, rep(2, b('arc', 60, 140), b('right', 120)), b('right', 30)),
    ],
  },
  {
    id: 'star',
    title: 'A filled star',
    summary: 'Five lines and a lot of turning, filled with yellow.',
    look: 'A yellow five pointed star',
    concepts: ['start fill', 'pen up and down'],
    note: 'Everything drawn between start fill and end fill is colored in. Pen up and set xy carry the turtle to the top point without drawing a line. Each turn is 144 degrees.',
    program: [
      b('start'),
      b('clean'),
      b('penup'),
      b('setxy', 0, 136),
      b('pendown'),
      b('setheading', 162),
      b('setcolor', 255, 200, 0),
      b('startfill'),
      rep(5, b('forward', 160), b('right', 144)),
      b('endfill'),
    ],
  },
  {
    id: 'polygon',
    title: 'Any polygon',
    summary: 'One box holds the number of sides. Change it to change the shape.',
    look: 'A red pentagon',
    concepts: ['boxes', 'divide'],
    note: 'Box1 holds the number of sides. Change the 5 in store in box1 to 3, 6 or 12 and press Run. The turtle always turns 360 degrees in all, so each turn is 360 divided by the sides.',
    program: [
      b('start'),
      b('clean'),
      b('store1', 5),
      b('setpensize', 5),
      { op: 'repeat', args: [box1], body: [b('forward', 100), b('right', b('divide', 360, box1))] },
    ],
  },
  {
    id: 'spiral',
    title: 'Square spiral',
    summary: 'Each side is a little longer than the last.',
    look: 'A square spiral winding outward',
    concepts: ['boxes', 'add'],
    note: 'A box remembers a number between laps. Each lap draws a side as long as box1, then makes box1 bigger by 6. That is why the sides keep growing and it spirals out.',
    program: [
      b('start'),
      b('clean'),
      b('store1', 5),
      b('setpensize', 3),
      rep(40, b('forward', box1), b('right', 90), b('store1', sum(box1, 6))),
    ],
  },
  {
    id: 'nested-squares',
    title: 'Nested squares',
    summary: 'Print shows the size of every square as it is drawn.',
    look: 'Eight squares of growing size sharing one corner',
    concepts: ['print', 'boxes', 'repeat inside repeat'],
    note: 'Print writes a number in the Output box at the top right of the drawing. Here it tells you the size of each square. The boxes make each square 25 bigger than the one before.',
    program: [
      b('start'),
      b('clean'),
      b('store1', 0),
      rep(8, b('store1', sum(box1, 25)), b('print', box1), rep(4, b('forward', box1), b('right', 90))),
    ],
  },
  {
    id: 'spinning-squares',
    title: 'Spinning squares',
    summary: 'Squares turned a little each time, with colors made from a box.',
    look: 'Thirty six squares rotated around one corner, fading from purple to blue and red',
    concepts: ['boxes', 'color'],
    note: 'A color is three numbers: red, green and blue, from 0 to 255. Box1 grows each lap, so red climbs while blue falls (255 minus box1). Every square is turned 10 degrees.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 3),
      b('store1', 0),
      rep(
        36,
        b('store1', sum(box1, 7)),
        b('setcolor', box1, 60, minus(255, box1)),
        rep(4, b('forward', 120), b('right', 90)),
        b('right', 10),
      ),
    ],
  },
  {
    id: 'color-burst',
    title: 'Color burst',
    summary: 'Fifty rays, each in a color picked by chance.',
    look: 'Fifty colorful lines spreading out from the middle like a firework',
    concepts: ['random', 'color'],
    note: 'Random picks a number each time it is used, so every ray gets a new color and every run looks different. 360 divided by 50 rays is 7.2 degrees. Numbers do not have to be whole.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 4),
      rep(50, b('setcolor', b('random', 0, 255), b('random', 0, 255), b('random', 0, 255)), b('forward', 200), b('back', 200), b('right', 7.2)),
    ],
  },
  {
    id: 'countdown',
    title: 'Countdown',
    summary: 'Counts 3, 2, 1 and then draws a circle.',
    look: 'An orange circle',
    concepts: ['wait', 'print', 'boxes'],
    note: 'Wait pauses for tenths of a second, so wait 10 is one second. Each lap prints box1, waits, then takes 1 away. Arc 360 goes all the way around, which makes a circle.',
    program: [
      b('start'),
      b('clean'),
      b('store1', 3),
      rep(3, b('print', box1), b('wait', 10), b('store1', minus(box1, 1))),
      b('setcolor', 255, 120, 0),
      b('setpensize', 8),
      b('arc', 360, 100),
    ],
  },
  {
    id: 'red-and-blue',
    title: 'Red and blue',
    summary: 'If else picks red or blue, depending on whether a number is even.',
    look: 'A column of five alternating blue and red beads going up from the middle',
    concepts: ['if else', 'remainder (%)', 'boxes'],
    note: 'Remainder (%) is what is left after dividing. Box1 % 2 is 0 for even numbers and 1 for odd ones. If it is 0, the bead is red. Else, it is blue. The pen is fat, so each short line looks like a bead.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 40),
      b('store1', 0),
      rep(
        5,
        b('store1', sum(box1, 1)),
        ifElse(b('equal', b('mod', box1, 2), 0), [b('setcolor', 220, 0, 0)], [b('setcolor', 0, 60, 220)]),
        b('forward', 45),
      ),
    ],
  },
  {
    id: 'wandering-turtle',
    title: 'Wandering turtle',
    summary: 'A coin flip decides left or right, again and again.',
    look: 'A path of right angle turns wandering around the paper',
    concepts: ['if else', 'random'],
    note: 'If else does one thing or the other. Random 1 or 2 is like a coin flip: if it is 1 the turtle turns right, else it turns left. Run it again and the walk is different every time.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 3),
      rep(
        120,
        ifElse(b('equal', b('random', 1, 2), 1), [b('right', 90)], [b('left', 90)]),
        b('forward', 15),
      ),
    ],
  },
  {
    id: 'own-block',
    title: 'A block of your own',
    summary: 'Teach the turtle a new trick once, then use it again and again.',
    look: 'Three squares of growing size sharing one corner',
    concepts: ['my own block', 'input'],
    note: 'To makes a block of your own. This one is called square and has one input, size. The size block inside forward is whatever number you give it when you use it. Now one block draws a square of any size.',
    defines: [{ name: 'square', params: ['size'], body: [rep(4, b('forward', input('size')), b('right', 90))] }],
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 3),
      call('square', ['size'], 40),
      call('square', ['size'], 80),
      call('square', ['size'], 120),
    ],
  },
  {
    id: 'initials-lines',
    title: 'Initials with straight lines',
    summary: 'The letters A, B and C built piece by piece, from straight lines.',
    look: 'The letters A, B and C drawn in blue from straight lines',
    concepts: ['forward and turn', 'pen up and down', 'my own block'],
    note: 'Each letter block draws from wherever the turtle is, starting at its bottom left corner. Place moves the turtle there without drawing, so a letter can go anywhere. Look at the B: its top is a little smaller than its bottom.',
    clearWidth: 340,
    defines: [PLACE_FACING_UP, LETTER_A_BLOCK, STRAIGHT_B, STRAIGHT_C],
    program: initialsProgram(),
  },
  {
    id: 'initials-curves',
    title: 'Initials with curves',
    summary: 'The same A, with a B and a C that use the arc block.',
    look: 'The letters A, B and C drawn in blue, with a rounded B and C',
    concepts: ['arc', 'pen up and down', 'my own block'],
    note: 'The A is the same, but B and C use arc. A bowl is forward, then an arc, then forward again. The top bowl of the B has a smaller radius (26) than the bottom bowl (34). Try changing a radius.',
    clearWidth: 340,
    defines: [PLACE_FACING_UP, LETTER_A_BLOCK, CURVED_B, CURVED_C],
    program: initialsProgram(),
  },
  {
    id: 'calls-itself',
    title: 'A block that calls itself',
    summary: 'Each call draws a side, then calls the block again a little bigger, until it is time to stop.',
    look: 'A square spiral winding outward',
    concepts: ['my own block', 'input', 'calls itself'],
    note: 'A block can use itself. Each time, size grows by 5. The if is the way to stop: once size is 150 or more, nothing else happens and the calls finish one by one. With no way to stop, it would go on forever.',
    defines: [
      {
        name: 'spiral',
        params: ['size'],
        body: [
          {
            op: 'if',
            args: [b('less', input('size'), 150)],
            body: [b('forward', input('size')), b('right', 90), call('spiral', ['size'], sum(input('size'), 5))],
          },
        ],
      },
    ],
    program: [b('start'), b('clean'), b('setpensize', 3), call('spiral', ['size'], 5)],
  },
  {
    id: 'tree',
    title: 'A tree',
    summary: 'A block that calls itself twice draws branches that split into smaller branches.',
    look: 'A green tree whose branches split again and again into smaller ones',
    concepts: ['my own block', 'input', 'calls itself', 'speed'],
    note: 'The tree block draws a branch, then two smaller trees on the end of it, then walks back. Each branch is 70 percent as long as the last, and it stops when a branch is too short. Speed 4 draws it all at once.',
    defines: [
      {
        name: 'tree',
        params: ['size'],
        body: [
          {
            op: 'if',
            args: [b('greater', input('size'), 10)],
            body: [
              b('forward', input('size')),
              b('left', 30),
              call('tree', ['size'], b('multiply', input('size'), 0.7)),
              b('right', 60),
              call('tree', ['size'], b('multiply', input('size'), 0.7)),
              b('left', 30),
              b('back', input('size')),
            ],
          },
        ],
      },
    ],
    program: [b('start'), b('clean'), b('speed', 4), b('setcolor', 20, 120, 40), b('setpensize', 2), call('tree', ['size'], 70)],
  },
  {
    id: 'text-fonts',
    title: 'Words in seven fonts',
    summary: 'The set font block picks the font for every write block after it.',
    look: 'The word Cougars written seven times, in script, fancy, sans, bold, serif, blocky and pixel, one under another',
    concepts: ['write', 'set font', 'my own block', 'input'],
    note: 'Set font is a setting, like color and pen size: every write block after it uses it. The show block writes the same word each time, so you can compare the fonts, top to bottom: script, fancy, sans, bold, serif, blocky, pixel.',
    defines: [{ name: 'show', params: ['y'], body: [b('penup'), b('setxy', -150, input('y')), { op: 'write', args: [44], text: 'Cougars' }] }],
    program: [
      b('start'), b('clean'), b('setcolor', 20, 70, 170), b('setpensize', 3),
      { op: 'setfont', args: [], font: 'script' }, call('show', ['y'], 200),
      { op: 'setfont', args: [], font: 'fancy' }, call('show', ['y'], 133),
      { op: 'setfont', args: [], font: 'sans' }, call('show', ['y'], 66),
      { op: 'setfont', args: [], font: 'bold' }, call('show', ['y'], 0),
      { op: 'setfont', args: [], font: 'serif' }, call('show', ['y'], -66),
      { op: 'setfont', args: [], font: 'blocky' }, call('show', ['y'], -133),
      { op: 'setfont', args: [], font: 'pixel' }, call('show', ['y'], -200),
    ],
  },
  {
    id: 'words-around',
    title: 'Words every which way',
    summary: 'Turn the turtle and the words turn with it. Set curve bends them into an arch or a bowl.',
    look: 'The word RAINBOW arched over the top, SMILE curved like a bowl below, and SIDEWAYS running down the right side',
    concepts: ['write', 'set curve', 'turning'],
    note: 'The tops of the letters point the way the turtle faces, so turning the turtle turns the words. Set curve bends them: positive arches like a rainbow, negative is a bowl. Bent words are centered on the turtle.',
    program: [
      b('start'), b('clean'), b('setcolor', 200, 40, 90), b('setpensize', 3), b('penup'),
      b('setxy', 0, 190), b('setcurve', 120), { op: 'write', args: [50], text: 'RAINBOW' },
      b('setxy', 0, -210), b('setcurve', -120), { op: 'write', args: [50], text: 'SMILE' },
      b('setcurve', 0), b('setxy', 280, 230), b('setheading', 90), { op: 'write', args: [36], text: 'SIDEWAYS' },
    ],
  },
  // These three are made for a stitching (embroidery) machine: only lines, no filled shapes, as few
  // separate lines as possible, and no more than two colors. Right-click Save and choose PES or DST.
  {
    id: 'stitch-heart',
    title: 'A heart to stitch',
    summary: 'One unbroken line, which is what an embroidery machine likes best.',
    look: 'A red heart drawn as a single thin line',
    concepts: ['arc', 'for an embroidery machine'],
    note: 'A heart is a square standing on its corner with a half circle on two sides. It is one unbroken line, which a stitching machine likes. Right-click Save and choose PES or DST to stitch it.',
    program: [
      b('start'),
      b('clean'),
      b('setcolor', 200, 30, 60),
      b('setpensize', 3),
      b('penup'),
      b('setxy', 0, -100),
      b('setheading', 45),
      b('pendown'),
      b('forward', 140),
      b('arc', -180, 70),
      b('right', 90),
      b('arc', -180, 70),
      b('forward', 140),
    ],
  },
  {
    id: 'stitch-star',
    title: 'A star in a ring',
    summary: 'Two colors means two threads, so the machine stops once for a thread change.',
    look: 'A red star inside a blue ring, both drawn as thin lines',
    concepts: ['repeat', 'arc', 'for an embroidery machine'],
    note: 'Two colors mean two threads: the machine stops once so you can change thread. The star is five lines and five turns of 144. Right-click Save and choose PES or DST.',
    program: [
      b('start'),
      b('clean'),
      b('setcolor', 10, 85, 163),
      b('arc', 360, 100),
      b('penup'),
      b('setxy', 100, 79),
      b('setheading', 162),
      b('pendown'),
      b('setcolor', 237, 23, 31),
      rep(5, b('forward', 150), b('right', 144)),
    ],
  },
  {
    id: 'stitch-flower',
    title: 'A flower to stitch',
    summary: 'Eight petals made of two curves each, and a yellow middle for a second thread.',
    look: 'A pink flower of eight thin petals with a small yellow ring in the middle',
    concepts: ['repeat inside repeat', 'arc', 'for an embroidery machine'],
    note: 'A petal is two curves, so all eight join into one line with no jumps. Then the machine changes to yellow for the ring. Right-click Save and choose PES or DST.',
    program: [
      b('start'),
      b('clean'),
      b('setcolor', 232, 70, 140),
      rep(8, rep(2, b('arc', 60, 100), b('right', 120)), b('right', 45)),
      b('penup'),
      b('setxy', 0, 15),
      b('setheading', 90),
      b('pendown'),
      b('setcolor', 255, 200, 0),
      b('arc', 360, 15),
    ],
  },
  // The school's mascot, for the embroidery machine. One red thread, several separate shapes.
  {
    id: 'stitch-paw',
    title: 'A cougar paw to stitch',
    summary: 'Four toes and a pad. One toe block is used four times.',
    look: 'A red outline of a cougar paw print: four toes above a large pad',
    concepts: ['blocks you make', 'arc', 'for an embroidery machine'],
    note: 'Every toe is the same toe block, turned and moved. The pad is seven curves. Each shape is a separate line, so the machine stops and cuts the thread between them. Right-click Save and choose PES or DST.',
    clearWidth: 370,
    maxHops: 5,
    defines: [PLACE, TOE, PAD],
    program: [b('start'), b('clean'), b('setcolor', ...RED), b('setpensize', 3), ...pawBlocks(78)],
  },
  {
    id: 'stitch-paw-slv',
    title: 'The SLV cougar to stitch',
    summary: 'The paw with SLV above it, in one red thread.',
    look: 'A red outline of a cougar paw print with the letters SLV above it',
    concepts: ['blocks you make', 'for an embroidery machine'],
    note: 'The paw is the paw sample, and each letter is a block made of straight lines from corner to corner. One red thread stitches all of it. Right-click Save and choose PES or DST.',
    clearWidth: 380,
    maxHops: 8,
    defines: [PLACE, TOE, PAD, LETTER_S, LETTER_L, LETTER_V],
    program: [b('start'), b('clean'), b('setcolor', ...RED), b('setpensize', 3), ...pawBlocks(0), call('letter S', []), call('letter L', []), call('letter V', [])],
  },
  {
    id: 'stitch-cougars',
    title: 'Cougars in script to stitch',
    summary: 'The write block draws script letters with the pen, so a word becomes a line a machine can stitch.',
    look: 'The word Cougars written in red cursive script as one thin line',
    concepts: ['write', 'for an embroidery machine'],
    note: 'The write block draws script letters with the pen, in its color and thickness. Pen up first so the turtle does not draw a line to the start. Change the words, the font, the size or the color. Right-click Save and choose PES or DST.',
    maxHops: 7,
    program: [b('start'), b('clean'), b('setcolor', ...RED), b('setpensize', 3), b('penup'), b('setxy', -247, -30), { op: 'write', args: [110], text: 'Cougars' }],
  },  {
    id: 'stitch-badge',
    title: 'A badge with curved words to stitch',
    summary: 'Two rings, with words curved round the top and the bottom of the badge.',
    look: 'A round badge: two circles, SLV COUGARS arched along the top and GO TEAM curved along the bottom, in blue script',
    concepts: ['write', 'set curve', 'my own block', 'input', 'for an embroidery machine'],
    note: 'Curved words are centered on the turtle, so the turtle stands at the top of the arch and the bottom of the bowl. The curve is how many degrees the words bend. Right-click Save and choose PES or DST.',
    maxHops: 22,
    defines: [
      {
        name: 'ring',
        params: ['radius'],
        body: [b('penup'), b('setxy', 0, input('radius')), b('setheading', 90), b('pendown'), b('arc', 360, input('radius')), b('penup'), b('setheading', 0)],
      },
    ],
    program: [
      b('start'), b('clean'), b('setcolor', ...RED), b('setpensize', 3),
      call('ring', ['radius'], 180), call('ring', ['radius'], 100), b('setcolor', 20, 70, 170),
      b('setxy', 0, 118), b('setcurve', 192), { op: 'write', args: [36], text: 'SLV COUGARS' },
      b('setxy', 0, -161), b('setcurve', -93), { op: 'write', args: [36], text: 'GO TEAM' },
    ],
  },

  // ---- Demos for the lessons (listed: false) ----------------------------------------------------------------------------------------------------------
  // A lesson page shows each of these in a frame (_includes/turtlelab-embed.html, ?sample=...&embed=1), so they are short: they have to fit a frame about 700
  // by 520. They are not on the Samples page and have no thumbnail. The four "bug" ones are broken on purpose: the note says what the program is FOR, never
  // what is wrong with it (the lesson, Step 11, has the hints and the answers).
  {
    id: 'lesson-l',
    listed: false,
    title: 'Draw an L',
    summary: 'Nine blocks draw an L, slowly, on a grid.',
    look: 'A red letter L: a long line down and a short line to the right',
    concepts: ['forward and turn', 'pen up and down', 'speed'],
    note: 'Read the blocks from the top. The turtle starts at (-150, 60) facing down. Pen up lets it walk to the start without drawing. Before you press Run, say where it will end up and which way it will face.',
    program: [
      b('start'),
      b('clean'),
      b('speed', 1),
      b('penup'),
      b('setxy', -150, 60),
      b('setheading', 180),
      b('pendown'),
      b('forward', 120),
      b('left', 90),
      b('forward', 60),
    ],
  },
  {
    id: 'lesson-b-two-ways',
    listed: false,
    title: 'A B two ways, and how to travel',
    summary: 'A B from straight lines and a B with arcs, with the blocks that walk the turtle between them.',
    look: 'Two red letter Bs side by side, the left one with square corners and the right one with round bowls',
    concepts: ['forward and turn', 'arc', 'pen up and down', 'my own block'],
    note: 'Each B is a block of its own that draws from where the turtle stands. Between them, pen up, set xy, set heading and pen down walk the turtle to the next place. Watch the turtle between the letters.',
    clearWidth: 260,
    defines: [{ name: 'straight B', params: [], body: STRAIGHT_B.body }, { name: 'curved B', params: [], body: CURVED_B.body }],
    program: [
      b('start'),
      b('clean'),
      b('speed', 2),
      b('penup'),
      b('setxy', -120, -60),
      b('setheading', 0),
      b('pendown'),
      call('straight B', []),
      b('penup'),
      b('setxy', 16, -60),
      b('setheading', 0),
      b('pendown'),
      call('curved B', []),
    ],
  },
  {
    // The teacher's own E and B (their Logo, word for word, in the block shape the other letters use: each letter a block of its own). The B is a spine and then
    // four angled lines, and the turtle walks from the E to the B (pen up, forward 20, left 90, pen down) with no set xy. Their program starts at the middle of the
    // paper and draws up and to the right, so this one first moves the turtle 40 left and 40 down (pen up, set xy, pen down) to put the letters in the middle, where
    // the sample layout keeps the drawing clear. test/lessons.test.js runs their Logo and this and requires the same drawing (moved by that), so do not "tidy" the
    // numbers (the last angled line ends about 5 steps below the spine's foot, as theirs does).
    id: 'lesson-b-diagonal',
    listed: false,
    title: 'An E and a B, and walking between them',
    summary: 'An E, then a B made of angled lines, with the turtle walking from one letter to the next.',
    look: 'The letters E and B in red, the B made of a straight spine and two angled bowls',
    concepts: ['forward and turn', 'pen up and down', 'my own block'],
    note: 'To get from the E to the B, the turtle lifts the pen, walks forward 20, turns left to face up and puts the pen down. The B is a spine and then angled lines, with turns of 135 and 90.',
    clearWidth: 120,
    defines: [
      {
        name: 'letter E',
        params: [],
        body: [
          b('forward', 80), b('right', 90), b('forward', 30), b('back', 25), b('left', 90), b('back', 40), b('right', 90),
          b('forward', 25), b('back', 25), b('left', 90), b('back', 40), b('right', 90), b('forward', 30),
        ],
      },
      {
        name: 'diagonal B',
        params: [],
        body: [b('forward', 80), b('right', 135), b('forward', 30), b('right', 90), b('forward', 30), b('left', 90), b('forward', 30), b('right', 90), b('forward', 30)],
      },
    ],
    program: [
      b('start'),
      b('clean'),
      b('speed', 2),
      b('penup'),
      b('setxy', -40, -40),
      b('pendown'),
      call('letter E', []),
      b('penup'),
      b('forward', 20),
      b('left', 90),
      b('pendown'),
      call('diagonal B', []),
      b('penup'),
      b('forward', 100),
    ],
  },
  {
    id: 'lesson-box-steps',
    listed: false,
    title: 'Watch a variable change',
    summary: 'A slow program stores in box1 and prints it, so you can watch the yellow strip.',
    look: 'A short red line pointing up',
    concepts: ['boxes', 'print', 'speed', 'add'],
    note: 'Watch each block light up as it runs. The yellow strip at the bottom right shows what is in box1, and the Output box at the top right shows what print says. Store puts a number in and replaces the old one. Print only looks.',
    program: [
      b('start'),
      b('clean'),
      b('speed', 1),
      b('store1', 40),
      b('store1', sum(box1, 10)),
      b('store1', sum(box1, 10)),
      b('print', box1),
      b('print', box1),
      b('store1', 100),
      b('print', box1),
      b('forward', box1),
    ],
  },
  {
    id: 'lesson-box-house',
    listed: false,
    title: 'A house from one number',
    summary: 'One box holds the size, and every wall and every roof side uses it.',
    look: 'A red house: a square with a triangle roof',
    concepts: ['boxes', 'repeat'],
    note: 'Box1 keeps one number: the size of the house. Every wall and every roof side uses box1. Change the 80 in store in box1 to 50 or 110 and press Run. One number changed, and the whole house changed.',
    program: [
      b('start'),
      b('clean'),
      b('store1', 80),
      b('setpensize', 5),
      rep(4, b('forward', box1), b('right', 90)),
      b('forward', box1),
      b('right', 30),
      rep(3, b('forward', box1), b('right', 120)),
    ],
  },
  {
    id: 'lesson-box-trace',
    listed: false,
    title: 'Watch a box count',
    summary: 'Box1 grows by 10 each lap, and print shows it.',
    look: 'A square spiral winding outward, eight sides growing longer',
    concepts: ['boxes', 'print', 'add'],
    note: 'Each lap, box1 gets 10 bigger, print shows it in the Output box at the top right, and the turtle draws a side that long. Watch the numbers go up, then check them against the spiral. Try 5 instead of 10.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 4),
      b('store1', 0),
      rep(8, b('store1', sum(box1, 10)), b('print', box1), b('forward', box1), b('right', 90)),
    ],
  },
  {
    id: 'lesson-own-flower',
    listed: false,
    title: 'A flower from one petal',
    summary: 'Your own block draws a petal. The main program uses it eight times.',
    look: 'A pink flower with eight pointed petals',
    concepts: ['my own block', 'input', 'repeat'],
    note: 'Petal is a block of your own. It draws one petal as big as its size input. The main program uses it 8 times and turns 45 between petals. Change the 60 to make a bigger or smaller flower.',
    defines: [{ name: 'petal', params: ['size'], body: [rep(2, b('arc', 60, input('size')), b('right', 120))] }],
    program: [
      b('start'),
      b('clean'),
      b('setcolor', 220, 60, 120),
      b('setpensize', 3),
      rep(8, call('petal', ['size'], 60), b('right', 45)),
    ],
  },
  {
    id: 'lesson-nested-count',
    listed: false,
    title: 'Twelve squares',
    summary: 'The inside repeat draws a square, and the outside repeat turns and does it again.',
    look: 'Twelve blue squares turned around one shared corner',
    concepts: ['repeat inside repeat'],
    note: 'The inside repeat draws one square: 4 sides and 4 turns. The outside repeat turns 30 and draws another, 12 times in all. Count the forward blocks that run. Then try 6 squares with a turn of 60.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 3),
      b('setcolor', 0, 110, 200),
      rep(12, rep(4, b('forward', 70), b('right', 90)), b('right', 30)),
    ],
  },
  {
    id: 'lesson-color-mix',
    listed: false,
    title: 'A bar of color',
    summary: 'A color is three numbers: red, green and blue.',
    look: 'A thick red bar across a black screen',
    concepts: ['color'],
    note: 'The bar is the color of set color: red, green and blue, each 0 to 255. Change the three numbers and press Run, or press the colored box under set color to pick a color. Try 255 255 0 and 128 128 128.',
    program: [
      b('start'),
      b('clean'),
      b('fillscreen', 0, 0, 0),
      b('setpensize', 90),
      b('penup'),
      b('setxy', -200, 0),
      b('setheading', 90),
      b('pendown'),
      b('setcolor', 255, 0, 0),
      b('forward', 400),
    ],
  },
  {
    id: 'lesson-bug-triangle',
    listed: false,
    title: 'Bug: the triangle',
    summary: 'This should draw a triangle.',
    look: 'Three long sides that do not close into a triangle',
    concepts: ['repeat'],
    note: 'This program is meant to draw a triangle. Run it. Does the shape close up? Find the mistake, fix it, and press Run again. Start over puts it back the way it was.',
    program: [b('start'), b('clean'), b('setpensize', 5), rep(3, b('forward', 100), b('right', 100))],
  },
  {
    id: 'lesson-bug-box',
    listed: false,
    title: 'Bug: the box',
    summary: 'This should draw a square 100 long, with the size kept in a box.',
    look: 'A small red square',
    concepts: ['boxes', 'repeat'],
    note: 'This program is meant to draw a square 100 long, with the size kept in box1. Run it. Is the square 100 long? Find the mistake, fix it, and press Run again. Start over puts it back the way it was.',
    program: [b('start'), b('clean'), b('store1', 100), b('setpensize', 5), rep(4, b('forward', 50), b('right', 90))],
  },
  {
    id: 'lesson-bug-if',
    listed: false,
    title: 'Bug: the coin flip',
    summary: 'This should wander left and right by chance.',
    look: 'A small square drawn over and over',
    concepts: ['if else'],
    note: 'This program is meant to wander: a coin flip picks a turn to the right or to the left, 60 times. Run it. Does it wander? Find the mistake, fix it, and press Run again. Start over puts it back the way it was.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 3),
      rep(60, ifElse(b('equal', b('random', 1, 2), 3), [b('right', 90)], [b('left', 90)]), b('forward', 15)),
    ],
  },
  {
    id: 'lesson-bug-pen',
    listed: false,
    title: 'Bug: the house',
    summary: 'This should draw a house: a square with a triangle roof.',
    look: 'A red square with no roof',
    concepts: ['pen up and down', 'repeat'],
    note: 'This program is meant to draw a house: a square with a triangle roof. Run it. What is missing? Find the mistake, fix it, and press Run again. Start over puts it back the way it was.',
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 5),
      rep(4, b('forward', 80), b('right', 90)),
      b('penup'),
      b('forward', 80),
      b('right', 30),
      rep(3, b('forward', 80), b('right', 120)),
    ],
  },
  // Two demos that wait for a person. The sample checks need to be that person, so each says what to type (answers) or where to click (clicks).
  {
    id: 'lesson-ask-sides',
    listed: false,
    title: 'Ask how many sides',
    summary: 'The program asks for a number, puts it in box1, and draws a shape with that many sides.',
    look: 'A red shape with as many sides as the number that was typed',
    concepts: ['ask', 'boxes', 'repeat'],
    note: 'Type a number and press Enter. It goes into box1, which the repeat and the turn both use. Try 3, 5 and 12, then 0. Press Run to be asked again.',
    answers: [5],
    program: [
      b('start'),
      b('clean'),
      b('setpensize', 4),
      { op: 'ask', args: [], text: 'How many sides?' },
      rep(box1, b('forward', 70), b('right', b('divide', 360, box1))),
    ],
  },
  {
    id: 'lesson-click-stamp',
    listed: false,
    title: 'Click to stamp a square',
    summary: 'The program waits for clicks. Each click stamps a square where you clicked.',
    look: 'The paper starts empty, and each click draws a small red square where it was',
    concepts: ['when paper clicked', 'mouseX and mouseY', 'repeat'],
    note: 'Click the paper. The blocks under when paper clicked run every time, and mouseX and mouseY say where you clicked (look at the Output box). Press Stop when you are done.',
    clicks: [[-60, -60], [90, 80]],
    allLeft: true, // (it prints, and the Output box at the top right would cover blocks there; and every click needs clear paper)
    handlers: [
      [
        b('print', mouseX),
        b('print', mouseY),
        b('penup'),
        b('setxy', mouseX, mouseY),
        b('pendown'),
        rep(4, b('forward', 30), b('right', 90)),
      ],
    ],
    program: [b('start'), b('clean')], // (just these two: a wider block here would sit under the Output box at the right edge)
  },
  {
    id: 'lesson-click-and',
    listed: false,
    title: 'Is the click inside the stripe?',
    summary: 'A red stripe, and a program that asks if each click is more than 100 and less than 220. It prints the click\'s x, then 1 for yes and 0 for no.',
    look: 'A tall red stripe on the right half of the paper',
    concepts: ['when paper clicked', 'and', 'if else', 'print'],
    note: 'Click in the stripe, then outside it. The Output box prints your x, then 1 for inside and 0 for outside. Inside is more than 100 AND less than 220.',
    clicks: [[160, 20], [300, -100]],
    allLeft: true,
    handlers: [[b('print', mouseX), ifElse(b('and', b('greater', mouseX, 100), b('less', mouseX, 220)), [b('print', 1)], [b('print', 0)])]],
    program: [b('start'), b('clean'), b('penup'), b('setxy', 160, -250), b('pendown'), b('setpensize', 120), b('forward', 500)],
  },
  {
    id: 'lesson-click-or',
    listed: false,
    title: 'Is the click outside the stripe?',
    summary: 'The same stripe, asked the other way round with or: a click is outside if it is less than 100 or more than 220. It prints the click\'s x, then 1 for yes.',
    look: 'A tall red stripe on the right half of the paper',
    concepts: ['when paper clicked', 'or', 'if else', 'print'],
    note: 'Click in the stripe, then outside it. The Output box prints your x, then 1 for outside and 0 for inside. Outside is less than 100 OR more than 220.',
    clicks: [[160, 20], [300, -100]],
    allLeft: true,
    handlers: [[b('print', mouseX), ifElse(b('or', b('less', mouseX, 100), b('greater', mouseX, 220)), [b('print', 1)], [b('print', 0)])]],
    program: [b('start'), b('clean'), b('penup'), b('setxy', 160, -250), b('pendown'), b('setpensize', 120), b('forward', 500)],
  },
  {
    id: 'lesson-click-game',
    listed: false,
    hideBlocks: true, // (in a lesson's frame: the program is too big to sit beside the paper, and the page shows it as an outline)
    title: 'Catch the square',
    summary: 'A red square sits at a random place. Click inside it to score a point, and it jumps somewhere else.',
    look: 'A small red square on an empty paper',
    concepts: ['when paper clicked', 'and', 'if', 'boxes', 'random', 'my own block', 'start fill'],
    note: 'Click inside the red square. Each hit adds 1 to box1, your score, and the square jumps to a new place. box2 and box3 are where the square is, and box4 works out how far the click is from its corner.',
    clicks: [[330, -260]], // (a click that always misses, so a check can tell the handler ran without knowing where the square is)
    defines: [
      {
        name: 'target',
        params: [],
        body: [
          b('clean'),
          b('store2', b('random', -300, 240)),
          b('store3', b('random', -220, 130)),
          b('penup'),
          b('setxy', box2, box3),
          b('pendown'),
          b('startfill'),
          rep(4, b('forward', 60), b('right', 90)),
          b('endfill'),
        ],
      },
    ],
    handlers: [
      [
        b('store4', minus(mouseX, box2)),
        { op: 'if', args: [b('and', b('greater', box4, 0), b('less', box4, 60))], body: [
          b('store4', minus(mouseY, box3)),
          { op: 'if', args: [b('and', b('greater', box4, 0), b('less', box4, 60))], body: [b('store1', sum(box1, 1)), call('target', [])] },
        ] },
      ],
    ],
    program: [b('start'), b('clean'), b('store1', 0), call('target', [])],
  },
];

export const SAMPLE_IDS = SAMPLES.map((sample) => sample.id);

/** The samples the Samples page shows (all of them, except the demos only a lesson page uses). */
export const LISTED_SAMPLES = SAMPLES.filter((sample) => sample.listed !== false);

/** The sample with this id, or null. Only a plain id matches, never anything inherited. */
export function sampleById(id) {
  return SAMPLES.find((sample) => sample.id === id) ?? null;
}

// Where the blocks go on the page. Down the left edge, a note on top and the
// program below it: the drawing is in the middle of the page, so the blocks
// stay out of its way. A note's height is worked out from its words (about 17
// letters to a line, rounded up to be safe), so the program never lands on it.
export const LEFT = 90;
export const TOP = 16;
const NOTE_LINE_CHARS = 17;
const GAP = 12;
const NOTE_WIDTH = 200; // how wide a sticky note is drawn (block-view.js)

/** How tall the note will be drawn. Matches the note layout in block-view.js, with room to spare. */
export function noteHeight(text) {
  const lines = Math.max(3, Math.ceil(text.length / NOTE_LINE_CHARS));
  return 16 + lines * 18 + 10;
}

const SIDE = 24; // room left at the right edge of the page
const COLUMN_GAP = 24; // between two columns of blocks you make
const PAPER_WIDTH = 700; // turtle steps across the paper (core/turtle.js), in the middle of the page
const PAPER_HEIGHT = 560;

/**
 * The stacks for a sample, in this order: its note, its program, then any blocks
 * it makes. Without blocks of its own, the note and the program go down the left
 * edge. With them, the page is used like this, so the drawing in the middle stays clear:
 *   - the program goes down the right edge (the note above it, or beside it if there is no room),
 *   - the blocks it makes go down the left edge, in as many columns as it takes so none runs off
 *     the bottom, and when the room left of the paper is used up, the next columns go in the room
 *     right of the paper, next to the program.
 *
 * The page zooms out (never below 0.6) until the tallest column fits, keeping its top left corner
 * where it is, so everything is placed in two steps: work out the zoom, then place each column
 * where it will be seen once zoomed.
 *
 * In the app, `measure` gives the real sizes (block-view.js has them) and the
 * size of the page: { noteHeight(text), stackSize(stack) -> { width, height },
 * stageWidth, stageHeight }. The defaults are estimates that work without a page, for tests.
 */
export function sampleStacks(sample, measure = {}) {
  const noteHigh = (measure.noteHeight ?? noteHeight)(sample.note);
  const sizeOf = measure.stackSize ?? (() => ({ width: 300, height: 320 }));
  const stageWidth = measure.stageWidth ?? 1366;
  const stageHeight = measure.stageHeight ?? 613;
  const program = { x: LEFT, y: TOP, blocks: structuredClone(sample.program) };
  const note = { x: LEFT, y: TOP, blocks: [{ op: 'note', text: sample.note }] };
  const programSize = sizeOf(program);

  if (!sample.defines?.length && !sample.handlers?.length) {
    program.y = TOP + noteHigh + GAP;
    return [note, program];
  }

  // A column of blocks may be as tall as fits at the smallest zoom (just inside the bottom of the page).
  const tallest = (stageHeight - 4 - TOP) / MIN_SAMPLE_ZOOM;

  // The note sits above the program if both fit in one column. If not, it is packed in with the blocks you make.
  const allLeft = sample.allLeft === true;
  const noteBeside = allLeft || noteHigh + GAP + programSize.height > tallest;
  program.y = noteBeside ? TOP : TOP + noteHigh + GAP;
  // The blocks it makes and its click handlers are packed the same way: each is a stack with a hat on it (to, or when paper clicked).
  const hatted = [
    ...(sample.defines ?? []).map((definition) => [{ op: 'to', name: definition.name, params: [...definition.params] }, ...structuredClone(definition.body)]),
    ...(sample.handlers ?? []).map((body) => [{ op: 'onclick', args: [] }, ...structuredClone(body)]),
  ];
  const items = hatted.map((blocks) => {
    const stack = { x: LEFT, y: TOP, blocks };
    return { stack, ...sizeOf(stack) };
  });
  if (noteBeside) items.push({ stack: note, width: NOTE_WIDTH, height: noteHigh });
  // allLeft: the note comes first and the program second, above the blocks it makes, and the right edge is left empty
  if (allLeft) {
    items.unshift({ stack: program, width: programSize.width, height: programSize.height });
    items.unshift(items.splice(items.findIndex((item) => item.stack === note), 1)[0]);
  }
  items.forEach((item, index) => { item.index = index; });

  // Pack them into as few columns as possible: tallest first, each into the first column with room.
  const columns = [];
  for (const item of [...items].sort((one, two) => two.height - one.height || one.index - two.index)) {
    let column = columns.find((candidate) => candidate.height + GAP + item.height <= tallest);
    if (!column) {
      column = { items: [], height: -GAP, width: 0 };
      columns.push(column);
    }
    column.items.push(item);
    column.height += GAP + item.height;
    column.width = Math.max(column.width, item.width);
  }
  // Inside a column, in the order they were listed; the columns left to right by what they hold first.
  for (const column of columns) {
    column.items.sort((one, two) => one.index - two.index);
    let y = TOP;
    for (const item of column.items) {
      item.stack.y = y;
      y += item.height + GAP;
    }
  }
  columns.sort((one, two) => one.items[0].index - two.items[0].index);

  const zoom = zoomToFit({ contentBottom: Math.max(program.y + programSize.height, ...columns.map((column) => TOP + column.height)), anchorY: TOP, height: stageHeight });

  // Zooming out pulls everything toward the top left corner (LEFT, TOP), so a spot that should be at
  // screen x once zoomed has to be placed at toWork(x) before it.
  const toWork = (screenX) => LEFT + (screenX - LEFT) / zoom;
  const wide = (width) => (width + COLUMN_GAP) * zoom;
  // How far from the middle of the page the drawing reaches on the screen. The paper is scaled to fit the page.
  const scale = Math.min(stageWidth / PAPER_WIDTH, stageHeight / PAPER_HEIGHT);
  const clearLeft = stageWidth / 2 - ((sample.clearWidth ?? PAPER_WIDTH) / 2) * scale;

  // The right edge: the program (with the note above it, if it fits there). Nothing, if everything is down the left.
  let edge = stageWidth - SIDE;
  if (!allLeft) {
    edge -= (noteBeside ? programSize.width : Math.max(NOTE_WIDTH, programSize.width)) * zoom;
    program.x = toWork(edge);
    if (!noteBeside) {
      note.x = program.x;
      note.y = TOP;
    }
    edge -= COLUMN_GAP * zoom;
  }

  // The left of the paper gets columns while they fit, the rest go right of the paper, nearest the program last.
  let cursor = LEFT;
  let leftColumns = 0;
  for (const column of columns) {
    if (leftColumns > 0 && cursor + column.width * zoom > clearLeft - 8) break;
    for (const item of column.items) item.stack.x = toWork(cursor);
    cursor += wide(column.width);
    leftColumns += 1;
  }
  for (const column of columns.slice(leftColumns).reverse()) {
    edge -= column.width * zoom;
    for (const item of column.items) item.stack.x = toWork(edge);
    edge -= COLUMN_GAP * zoom;
  }
  // If even that is not enough room, the columns still never overlap each other (they just cover some of the paper).
  return [note, program, ...items.filter((item) => item.stack !== note && item.stack !== program).map((item) => item.stack)];
}
