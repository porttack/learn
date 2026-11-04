// Tests for js/core/embroidery.js: the .dst and .pes files.
//
// Most of these need nothing but Node. The ones marked "oracle" compare TurtleLab's bytes with another
// program's (pyembroidery) and are skipped when it is not installed. See test/embroidery-oracle.py.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Turtle } from '../js/core/turtle.js';
import { planStitches } from '../js/core/stitch-plan.js';
import { SAMPLES, sampleStacks } from '../js/ui/samples.js';
import { validateProject, findRunStack, FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';
import { definitionsOf } from '../js/core/definitions.js';
import { runBlocks, createContext } from '../js/core/interpreter.js';
import {
  dstRecord, dstDecode, encodeDst, encodePes, splitMove, brotherColorsFor, colorDistance, planBounds,
  PEC_PALETTE, MAX_DST_MOVE,
} from '../js/core/embroidery.js';

const ORACLE = fileURLToPath(new URL('./embroidery-oracle.py', import.meta.url));
const PYTHON = process.env.EMBROIDERY_PYTHON ?? 'python3';

/** Ask the oracle something. Returns null if pyembroidery is not there. */
function oracle(request) {
  const result = spawnSync(PYTHON, ['-I', ORACLE], { input: JSON.stringify(request), encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  const answer = JSON.parse(result.stdout);
  return answer.missing ? null : answer;
}
const haveOracle = oracle({ mode: 'read' }) !== null;
const oracleTest = (name, fn) => test(`oracle: ${name}`, { skip: haveOracle ? false : 'pyembroidery is not installed' }, fn);

const stitch = (x, y) => ({ cmd: 'stitch', x, y });
const text = (bytes, from, to) => Buffer.from(bytes.subarray(from, to)).toString('latin1');

/** A plan from a real drawing: a circle in blue, then a star in red. */
function drawnPlan() {
  const t = new Turtle();
  t.clean();
  t.setColor(10, 85, 163);
  t.place(0, 100);
  t.setHeading(90);
  t.arc(360, 100);
  t.setPenUp();
  t.setXY(0, 79);
  t.setHeading(162);
  t.setPenDown();
  t.setColor(237, 23, 31);
  for (let i = 0; i < 5; i += 1) {
    t.forward(150);
    t.right(144);
  }
  return planStitches(t.ops, { name: 'Badge' });
}

/** A small plan with every kind of command, and moves that need no splitting. */
function handPlan() {
  return {
    name: 'Square',
    threads: [[237, 23, 31], [10, 85, 163]],
    commands: [
      { cmd: 'jump', x: -200, y: -200 }, stitch(-200, -200), stitch(-100, -200), stitch(0, -200), stitch(100, -200), stitch(200, -200),
      stitch(200, -100), stitch(200, 0), stitch(200, 100), stitch(200, 200), stitch(100, 200), stitch(0, 200), stitch(-100, 200),
      stitch(-200, 200), stitch(-200, 100), stitch(-200, 0), stitch(-200, -100), stitch(-200, -200),
      { cmd: 'color', x: -200, y: -200 },
      { cmd: 'trim', x: -200, y: -200 }, { cmd: 'jump', x: 0, y: 0 }, stitch(0, 0), stitch(30, 40), stitch(60, 0), stitch(30, -40), stitch(0, 0),
      { cmd: 'trim', x: 0, y: 0 }, { cmd: 'jump', x: 100, y: 100 }, stitch(100, 100), stitch(110, 100),
      { cmd: 'end', x: 110, y: 100 },
    ],
  };
}

// ---- .dst records ------------------------------------------------------------------------------------

test('every move a .dst record can hold (-121 to 121 in each direction) is written and read back exactly', () => {
  for (let dx = -MAX_DST_MOVE; dx <= MAX_DST_MOVE; dx += 1) {
    for (let dy = -MAX_DST_MOVE; dy <= MAX_DST_MOVE; dy += 1) {
      const back = dstDecode(dstRecord(dx, dy, 'stitch'));
      assert.ok(back.dx === dx && back.dy === dy && back.kind === 'stitch', `${dx},${dy} came back as ${back.dx},${back.dy}`);
    }
  }
  assert.equal(dstDecode(dstRecord(5, -7, 'jump')).kind, 'jump');
  assert.equal(dstDecode(dstRecord(0, 0, 'color')).kind, 'color');
  assert.equal(dstDecode(dstRecord(0, 0, 'end')).kind, 'end');
});

test('a .dst record that is too big is refused, not written wrong', () => {
  assert.throws(() => dstRecord(122, 0), RangeError);
  assert.throws(() => dstRecord(0, -122), RangeError);
});

test('a long move is cut into pieces that add up exactly, none bigger than the limit', () => {
  for (const [dx, dy] of [[500, 0], [-333, 247], [121, 121], [122, 0], [0, 0], [1, -1], [-1000, 999]]) {
    const pieces = splitMove(dx, dy, 121);
    assert.deepEqual([pieces.reduce((n, p) => n + p[0], 0), pieces.reduce((n, p) => n + p[1], 0)], [dx, dy]);
    assert.ok(pieces.every(([x, y]) => Math.abs(x) <= 121 && Math.abs(y) <= 121));
  }
});

// ---- .dst files --------------------------------------------------------------------------------------

test('a .dst file has the 512 byte text header, then three bytes for each command, ending with the end record', () => {
  const plan = handPlan();
  const bytes = encodeDst(plan);
  assert.equal(text(bytes, 0, 3), 'LA:');
  assert.equal(bytes[511], 0x20);
  assert.ok(text(bytes, 0, 512).includes('\x1a'), 'the end-of-header mark');
  assert.equal((bytes.length - 512) % 3, 0);
  assert.deepEqual([...bytes.subarray(bytes.length - 3)], [0, 0, 0b11110011]);
  const header = text(bytes, 0, 512);
  assert.match(header, /CO:  1\r/);
  assert.match(header, /\+X:  200\r-X:  200\r\+Y:  200\r-Y:  200\r/);
});

test('every .dst record is a stitch, jump, color change or end that adds up to the plan: the needle ends where the plan says', () => {
  const plan = drawnPlan();
  const bytes = encodeDst(plan);
  let x = 0;
  let y = 0;
  const stitches = [];
  for (let i = 512; i + 2 < bytes.length; i += 3) {
    const r = dstDecode([bytes[i], bytes[i + 1], bytes[i + 2]]);
    x += r.dx;
    y += r.dy;
    if (r.kind === 'stitch') stitches.push([x, y]);
  }
  const wanted = plan.commands.filter((c) => c.cmd === 'stitch').map((c) => [c.x, c.y]);
  assert.deepEqual(stitches, wanted, 'the stitches land on exactly the planned spots');
  assert.deepEqual([x, y], [plan.commands.at(-1).x, plan.commands.at(-1).y]);
});

test('a stitch longer than a record can hold is cut into stitches (the thread keeps going), not into jumps', () => {
  const plan = { name: 'Long', threads: [[0, 0, 0]], commands: [stitch(0, 0), stitch(300, 0), { cmd: 'end', x: 300, y: 0 }] };
  const bytes = encodeDst(plan);
  const kinds = [];
  for (let i = 512; i + 2 < bytes.length; i += 3) kinds.push(dstDecode([bytes[i], bytes[i + 1], bytes[i + 2]]).kind);
  assert.deepEqual(kinds, ['stitch', 'stitch', 'stitch', 'stitch', 'end']);
});

test('a name that is not plain letters and digits cannot break the header', () => {
  const plan = { ...handPlan(), name: 'My\r\nstar: é中*? and a very long name indeed' };
  const bytes = encodeDst(plan);
  const header = text(bytes, 0, 512);
  assert.match(header, /^LA:[A-Za-z0-9 _.-]{16}\rST:/);
});

// ---- .pes files --------------------------------------------------------------------------------------

test('a .pes file starts #PES0001, points at its machine part, and that part has the 512 byte header and ends its stitches with 0xFF', () => {
  const plan = handPlan();
  const bytes = encodePes(plan);
  assert.equal(text(bytes, 0, 8), '#PES0001');
  const pec = bytes[8] | (bytes[9] << 8) | (bytes[10] << 16) | (bytes[11] << 24);
  assert.ok(pec > 12 && pec < bytes.length);
  assert.equal(text(bytes, pec, pec + 3), 'LA:');
  assert.equal(bytes[pec + 34], 6, 'icon width in bytes');
  assert.equal(bytes[pec + 35], 38, 'icon height');
  // The 512 byte header, then the length of the stitch block.
  const block = pec + 512;
  const length = bytes[block + 2] | (bytes[block + 3] << 8) | (bytes[block + 4] << 16);
  assert.equal(bytes[block + length - 1], 0xff, 'the stitches end with 0xFF');
  // After the stitches: one picture of the whole design and one for each color, 228 bytes each.
  assert.equal(bytes.length - (block + length), 228 * (1 + plan.threads.length));
});

test('the .pes header names the Brother colors, one for each thread, all different', () => {
  const plan = drawnPlan();
  const bytes = encodePes(plan);
  const pec = bytes[8] | (bytes[9] << 8);
  const count = bytes[pec + 48] + 1;
  assert.equal(count, plan.threads.length);
  const numbers = [...bytes.subarray(pec + 49, pec + 49 + count)];
  assert.equal(new Set(numbers).size, count);
  assert.ok(numbers.every((n) => n >= 1 && n <= 64));
  assert.deepEqual(numbers, brotherColorsFor(plan.threads));
});

test('thread colors are matched to the nearest Brother color, and two threads never share one', () => {
  assert.equal(PEC_PALETTE[brotherColorsFor([[237, 23, 31]])[0]][0], 'Red');
  assert.equal(PEC_PALETTE[brotherColorsFor([[0, 0, 0]])[0]][0], 'Black');
  assert.equal(PEC_PALETTE[brotherColorsFor([[255, 255, 0]])[0]][0], 'Yellow');
  const two = brotherColorsFor([[237, 23, 31], [236, 22, 30]]);
  assert.notEqual(two[0], two[1]);
  // More threads than Brother has colors is fine: the extras just reuse the nearest.
  const many = brotherColorsFor(Array.from({ length: 70 }, (_, i) => [i * 3, 255 - i * 3, i]));
  assert.equal(many.length, 70);
  assert.ok(many.every((n) => n >= 1 && n <= 64));
  assert.equal(colorDistance([1, 2, 3], [1, 2, 3]), 0);
});

test('an empty plan still makes a file each format can hold', () => {
  const empty = { name: 'Nothing', threads: [], commands: [] };
  assert.equal(text(encodeDst(empty), 0, 3), 'LA:');
  assert.equal(text(encodePes(empty), 0, 8), '#PES0001');
  assert.deepEqual(planBounds([]), { minX: 0, minY: 0, maxX: 0, maxY: 0 });
});

// ---- Against another program ----------------------------------------------------------------------------

// A design that is not the same height above the middle as below it (a design TurtleLab centers can still be
// a tenth of a millimeter out when its height is odd). The header's +Y and -Y must not be swapped.
function lopsidedPlan() {
  return {
    name: 'Lopsided',
    threads: [[196, 30, 45]],
    commands: [
      { cmd: 'jump', x: -40, y: -61 }, stitch(-40, -61), stitch(0, 0), stitch(40, 60), stitch(-40, -61),
      { cmd: 'end', x: -40, y: -61 },
    ],
  };
}

for (const [label, make] of [['a hand made two color plan with jumps and trims', handPlan], ['a plan from a drawn circle and star', drawnPlan], ['a plan higher above the middle than below it', lopsidedPlan]]) {
  oracle_test(label, make);
}

function oracle_test(label, make) {
  oracleTest(`${label}: the .dst bytes are exactly what pyembroidery writes for the same stitches`, () => {
    const plan = make();
    const theirs = oracle({ mode: 'write', plan });
    assert.ok(Buffer.from(encodeDst(plan)).equals(Buffer.from(theirs.dst, 'base64')));
  });

  oracleTest(`${label}: the .pes bytes are exactly what pyembroidery writes for the same stitches`, () => {
    const plan = make();
    const theirs = oracle({ mode: 'write', plan });
    const mine = Buffer.from(encodePes(plan));
    const reference = Buffer.from(theirs.pes, 'base64');
    assert.equal(mine.length, reference.length, 'same length');
    assert.ok(mine.equals(reference), 'same bytes');
  });

  oracleTest(`${label}: pyembroidery reads both of TurtleLab's files and finds every planned stitch`, () => {
    const plan = make();
    const answer = oracle({ mode: 'read', dst: Buffer.from(encodeDst(plan)).toString('base64'), pes: Buffer.from(encodePes(plan)).toString('base64') });
    const wanted = new Set(plan.commands.filter((c) => c.cmd === 'stitch').map((c) => `${c.x},${c.y}`));
    for (const format of ['dst', 'pes']) {
      const found = new Set(answer[format].stitches.filter((s) => s.cmd === 'stitch').map((s) => `${Math.round(s.x)},${Math.round(s.y)}`));
      assert.deepEqual([...found].sort(), [...wanted].sort(), `${format}: the stitches it read are the planned ones`);
      assert.equal(answer[format].stitches.filter((s) => s.cmd === 'color').length, plan.threads.length - 1, `${format}: color changes`);
    }
  });
}

// The embroidery samples, stitched, are what pyembroidery would write for those very stitches.
function planOfSample(sample) {
  const turtle = new Turtle();
  const project = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: sampleStacks(sample) }).project;
  const { stack } = findRunStack(project);
  [...runBlocks(stack.blocks, createContext({ turtle, definitions: definitionsOf(project).map, print() {}, random: () => 0.5 }))];
  return planStitches(turtle.ops, { name: 'TurtleLab' });
}
for (const sample of SAMPLES.filter((s) => s.concepts.includes('for an embroidery machine'))) {
  oracle_test(`the ${sample.id} sample`, () => planOfSample(sample));
}

test('a long move is cut the way pyembroidery cuts it: the even share is added on from where the move starts', () => {
  // A move of (-725, -7) starting at (-137, 17) in six pieces. Working each piece out by multiplying instead gives
  // [-120, -2] third and [-121, -1] fourth, a tenth of a millimeter different. These are pyembroidery's pieces.
  assert.deepEqual(splitMove(-725, -7, 121, -137, 17), [[-121, -1], [-121, -1], [-120, -1], [-121, -2], [-121, -1], [-121, -1]]);
  // From the very start of a design the answer does not change, and a move that fits in one record stays whole.
  assert.deepEqual(splitMove(100, -50, 121), [[100, -50]]);
  for (const [dx, dy, x, y] of [[-725, -7, -137, 17], [1000, 333, 0, 0], [-4000, 4000, 25, -25], [121, -121, 5, 5], [122, 0, 0, 0]]) {
    const pieces = splitMove(dx, dy, 121, x, y);
    assert.deepEqual(pieces.reduce(([a, c], [sx, sy]) => [a + sx, c + sy], [0, 0]), [dx, dy], 'the pieces add up to the move');
    assert.ok(pieces.every(([sx, sy]) => Math.abs(sx) <= 121 && Math.abs(sy) <= 121), 'and none is too big');
  }
});
