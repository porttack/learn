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

const b = (op, ...args) => ({ op, args });
const rep = (count, ...body) => ({ op: 'repeat', args: [count], body });
const ifElse = (condition, body, elseBody) => ({ op: 'ifelse', args: [condition], body, elseBody });
const sum = (a, c) => b('add', a, c);
const minus = (a, c) => b('subtract', a, c);
const box1 = { op: 'box1' };
const input = (name) => ({ op: 'input', name });
const call = (name, params, ...args) => ({ op: 'call', name, params, args });

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
];

export const SAMPLE_IDS = SAMPLES.map((sample) => sample.id);

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

/**
 * The stacks for a sample, in this order: its note, its program, then any blocks
 * it makes. Without blocks of its own, the note and the program go down the left
 * edge. With them, those go down the left edge and the note and program move to
 * the right edge, so the middle of the page, where the drawing is, stays clear.
 *
 * In the app, `measure` gives the real sizes (block-view.js has them) and the
 * width of the page: { noteHeight(text), stackSize(stack) -> { width, height },
 * stageWidth }. The defaults are estimates that work without a page, for tests.
 */
export function sampleStacks(sample, measure = {}) {
  const noteHigh = (measure.noteHeight ?? noteHeight)(sample.note);
  const sizeOf = measure.stackSize ?? (() => ({ width: 300, height: 320 }));
  const stageWidth = measure.stageWidth ?? 1366;

  let y = TOP;
  const made = (sample.defines ?? []).map((definition) => {
    const stack = { x: LEFT, y, blocks: [{ op: 'to', name: definition.name, params: [...definition.params] }, ...structuredClone(definition.body)] };
    y += sizeOf(stack).height + GAP;
    return stack;
  });

  const program = { x: LEFT, y: TOP + noteHigh + GAP, blocks: structuredClone(sample.program) };
  const note = { x: LEFT, y: TOP, blocks: [{ op: 'note', text: sample.note }] };
  if (made.length > 0) {
    const widest = Math.max(NOTE_WIDTH, sizeOf(program).width);
    note.x = program.x = Math.max(LEFT, stageWidth - widest - SIDE);
  }
  return [note, program, ...made];
}
