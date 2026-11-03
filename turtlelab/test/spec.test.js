// Tests that look over the whole list of blocks for mistakes.
// They keep the spec, the layout code and the project's writing rules honest
// as blocks are added.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BLOCKS, PALETTES, NOTE_MAX_CHARS, BODY_KEYS, mouthCount, SPEED_NAMES, DEFAULT_SPEED } from '../js/core/blocks-spec.js';
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
