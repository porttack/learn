// Tests that look over the whole list of blocks for mistakes.
// They keep the spec, the layout code and the project's writing rules honest
// as blocks are added.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BLOCKS, PALETTES } from '../js/core/blocks-spec.js';

const entries = Object.entries(BLOCKS);

test('every block belongs to a real palette and has a known kind', () => {
  const palettes = new Set(PALETTES.map((p) => p.id));
  const kinds = new Set(['command', 'clamp', 'hat', 'reporter']);
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
