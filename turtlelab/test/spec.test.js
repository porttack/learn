// Tests that look over the whole list of blocks for mistakes.
// They keep the spec, the layout code and the project's writing rules honest
// as blocks are added.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BLOCKS, PALETTES, NOTE_MAX_CHARS, BODY_KEYS, mouthCount, SPEED_NAMES, DEFAULT_SPEED, BOX_COUNT } from '../js/core/blocks-spec.js';
import { PALETTE_COLORS } from '../js/ui/palette-colors.js';
import { existsSync } from 'node:fs';
import { SPEEDS } from '../js/core/scheduler.js';

const entries = Object.entries(BLOCKS);

test('every block belongs to a real palette and has a known kind', () => {
  const palettes = new Set(PALETTES.map((p) => p.id));
  const kinds = new Set(['command', 'clamp', 'hat', 'reporter', 'note']);
  for (const [op, spec] of entries) {
    assert.ok(palettes.has(spec.palette), `${op}: unknown palette ${spec.palette}`);
    assert.ok(kinds.has(spec.kind), `${op}: unknown kind ${spec.kind}`);
  }
});

test('block names are plain lowercase words (the project code matches some by pattern)', () => {
  for (const [op] of entries) assert.match(op, /^[a-z]+\d*$/, op);
});

test('every block has a label and a one-line tip', () => {
  for (const [op, spec] of entries) {
    assert.ok(spec.label.length > 0, `${op}: no label`);
    assert.ok(spec.help.length > 10 && !spec.help.includes('\n'), `${op}: needs a one-line tip`);
  }
});

test('a reporter with sockets says how it is laid out, and the layout fits its sockets', () => {
  for (const [op, spec] of entries) {
    if (spec.layout) {
      assert.equal(spec.kind, 'reporter', `${op}: only reporters have a layout`);
      assert.ok(['infix', 'prefix', 'wrap'].includes(spec.layout), `${op}: unknown layout ${spec.layout}`);
      assert.equal(spec.args.length, spec.layout === 'wrap' ? 1 : 2, `${op}: wrong number of sockets for ${spec.layout}`);
      assert.equal(typeof spec.endLabel === 'string', spec.layout === 'wrap', `${op}: endLabel is for wrap blocks only`);
    } else if (spec.kind === 'reporter') {
      assert.equal(spec.args.length, 0, `${op}: a reporter with sockets needs a layout`);
    }
  }
});

test('yes-or-no sockets are only on clamps, and only yes-or-no blocks are pills', () => {
  for (const [op, spec] of entries) {
    for (const socket of spec.args) {
      if (socket.type === 'boolean') assert.equal(spec.kind, 'clamp', `${op}: a pointed socket needs the clamp's header shape`);
    }
    if (spec.returns === 'boolean') assert.equal(spec.layout, 'infix', `${op}: yes-or-no blocks are infix pills`);
  }
});

test('a socket that is not yes-or-no starts with a number', () => {
  for (const [op, spec] of entries) {
    for (const socket of spec.args) {
      if (socket.type !== 'boolean') assert.equal(typeof socket.default, 'number', `${op}: needs a default number`);
    }
  }
});

test('student-facing text has no em dashes or en dashes', () => {
  const dashes = /[\u2013\u2014]/;
  for (const [op, spec] of entries) {
    const text = [spec.label, spec.endLabel ?? '', spec.help, ...spec.args.map((arg) => arg.label ?? '')].join(' ');
    assert.ok(!dashes.test(text), `${op}: has a dash`);
  }
  for (const palette of PALETTES) assert.ok(!dashes.test(palette.label), palette.id);
});

test('every palette that has blocks shows in the palette column, and the Math and Pen palettes have what they should', () => {
  const inPalette = (id) => entries.filter(([, spec]) => spec.palette === id).map(([op]) => op);
  assert.ok(inPalette('math').includes('paren'));
  assert.ok(inPalette('math').includes('mod'));
  assert.equal(BLOCKS.mod.label, '%');
  for (const op of ['penup', 'pendown', 'setpensize', 'pensize', 'setcolor', 'penred', 'pengreen', 'penblue', 'fillscreen', 'startfill', 'endfill']) {
    assert.ok(inPalette('pen').includes(op), `Pen palette is missing ${op}`);
  }
});

test('there is a Notes palette with a sticky note in it, and a note has no sockets', () => {
  assert.ok(PALETTES.some((p) => p.id === 'notes'));
  assert.equal(BLOCKS.note.palette, 'notes');
  assert.equal(BLOCKS.note.kind, 'note');
  assert.deepEqual(BLOCKS.note.args, []);
  assert.equal(NOTE_MAX_CHARS, 300);
});

test('clamps have one or two mouths, and the labels beside mouths fit', () => {
  for (const [op, spec] of entries) {
    if (spec.kind !== 'clamp') {
      assert.equal(spec.mouths, undefined, `${op}: only clamps have mouths`);
      assert.equal(spec.mouthLabels, undefined, `${op}: only clamps have mouth labels`);
      continue;
    }
    const mouths = spec.mouths ?? 1;
    assert.ok([1, 2].includes(mouths), `${op}: ${mouths} mouths`);
    assert.ok(BODY_KEYS.length >= mouths, `${op}: a place to keep each mouth's blocks`);
    if (spec.mouthLabels) {
      assert.equal(spec.args[0]?.type, 'boolean', `${op}: mouth labels go with the yes-or-no clamp shape`);
      assert.equal(spec.mouthLabels.length, mouths, `${op}: one label per mouth`);
    }
  }
  assert.equal(BLOCKS.ifelse.mouths, 2);
  assert.deepEqual(BLOCKS.ifelse.mouthLabels, ['', 'else']);
  assert.equal(mouthCount(BLOCKS.ifelse), 2);
  assert.equal(mouthCount(BLOCKS.repeat), 1);
  assert.equal(mouthCount(BLOCKS.forward), 0);
});

test('a label split over lines reads the same as the plain label, and only a command with a socket has one', () => {
  for (const [op, spec] of entries) {
    if (!spec.lines) continue;
    assert.equal(spec.kind, 'command', `${op}: only commands are drawn over several lines`);
    assert.ok(spec.args.length > 0, `${op}: the extra height comes from its first socket`);
    assert.ok(spec.lines.length >= 2 && spec.lines.length <= 3, `${op}: two or three lines`);
    assert.equal(spec.lines.join(' '), spec.label, `${op}: the lines are the label`);
  }
  assert.deepEqual(BLOCKS.store1.lines, ['store in', 'box1']);
  assert.equal(BLOCKS.wait.label, 'wait', 'the unit is explained by the help tip, not written on the block');
  assert.match(BLOCKS.wait.help, /tenths of a second/);
});

test('the speed block uses the scheduler\'s own speeds, slowest first, and a run starts at fast', () => {
  assert.deepEqual([...SPEED_NAMES], Object.keys(SPEEDS), 'the same names, in the same order');
  const waits = SPEED_NAMES.map((name) => SPEEDS[name]);
  assert.deepEqual(waits, [...waits].sort((a, b) => b - a), 'each one is quicker than the one before');
  assert.equal(DEFAULT_SPEED, 'fast');
  assert.ok(SPEED_NAMES.includes(DEFAULT_SPEED));
  assert.equal(BLOCKS.speed.palette, 'flow');
  assert.match(BLOCKS.speed.help, /1 is slow.*4 is instant/);
});

test('boxes and the blocks you make have palettes of their own, in that order, each with a color and an icon', () => {
  const inPalette = (id) => entries.filter(([, spec]) => spec.palette === id).map(([op]) => op);
  assert.deepEqual(PALETTES.map((p) => p.id), ['turtle', 'pen', 'math', 'flow', 'boxes', 'myblocks', 'notes']);
  assert.equal(BOX_COUNT, 4);
  const boxOps = Array.from({ length: BOX_COUNT }, (_, i) => [`store${i + 1}`, `box${i + 1}`]).flat();
  assert.deepEqual(inPalette('boxes').sort(), boxOps.sort(), 'Boxes holds the four store blocks and the four box blocks, and only those');
  assert.deepEqual(inPalette('myblocks').sort(), ['call', 'input', 'to'], 'My Blocks holds only what makes your own blocks');
  assert.equal(BLOCKS.store5, undefined);
  for (const palette of PALETTES) {
    assert.ok(PALETTE_COLORS[palette.id], `${palette.id} has a color`);
    assert.ok(existsSync(new URL(`../images/palette-${palette.id}.svg`, import.meta.url)), `${palette.id} has an icon`);
  }
  assert.notEqual(PALETTE_COLORS.boxes.fill, PALETTE_COLORS.myblocks.fill, 'the two do not look alike');
});

test('set font and set curve are Notes blocks beside write: a font dropdown, and one number in degrees', () => {
  assert.equal(BLOCKS.setfont.palette, 'notes');
  assert.equal(BLOCKS.setfont.kind, 'command');
  assert.deepEqual(BLOCKS.setfont.args, []);
  assert.equal(BLOCKS.setfont.fontSlot, true);
  assert.equal(BLOCKS.setcurve.palette, 'notes');
  assert.deepEqual(BLOCKS.setcurve.args.map((arg) => arg.default), [120]);
  assert.deepEqual(entries.filter(([, spec]) => spec.fontSlot).map(([op]) => op), ['setfont']);
  assert.deepEqual(entries.filter(([, spec]) => spec.palette === 'notes').map(([op]) => op), ['note', 'write', 'setfont', 'setcurve'], 'the Notes palette lists them in this order');
  for (const op of ['setfont', 'setcurve']) assert.ok(!/[\u2013\u2014]/.test(BLOCKS[op].help), `no dashes in the tip of ${op}`);
});

test('the write block is a command in the Notes palette, with words on it and one socket for the size', () => {
  assert.equal(BLOCKS.write.palette, 'notes');
  assert.equal(BLOCKS.write.kind, 'command');
  assert.deepEqual(BLOCKS.write.args.map((arg) => [arg.label, arg.default]), [['size', 60]]);
  assert.equal(typeof BLOCKS.write.textSlot.hint, 'string');
  assert.equal(BLOCKS.write.fontSlot, undefined, 'the font is chosen by a block of its own, not on the write block');
  // It is the only block with words on it besides the sticky note.
  assert.deepEqual(entries.filter(([, spec]) => spec.textSlot).map(([op]) => op), ['write']);
  assert.ok(!/[–—]/.test(BLOCKS.write.help), 'no dashes in the tip');
});
