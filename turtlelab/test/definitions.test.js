// Tests for blocks you make yourself: names, finding definitions, and keeping
// every call in step when a definition changes.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cleanName, nameKey, nameProblem, tidyName, uniqueName, NAME_MAX, INPUT_MAX } from '../js/core/names.js';
import {
  definitionsOf,
  definitionHats,
  isDefinition,
  newCall,
  newDefinition,
  newInput,
  renameDefinition,
  setInput,
  uniquifyDefinition,
} from '../js/core/definitions.js';
import { specOf } from '../js/core/blocks-spec.js';

const hat = (name, params = []) => ({ op: 'to', name, params });
const call = (name, params = [], args = params.map(() => 100)) => ({ op: 'call', name, params, args });
const stack = (...blocks) => ({ x: 0, y: 0, blocks });
const project = (...stacks) => ({ stacks });

// ---- Names ---------------------------------------------------------------------------------------

test('names are tidied: no spaces at the ends, one space between words', () => {
  assert.equal(tidyName('  draw   a  house '), 'draw a house');
  assert.equal(tidyName(42), '', 'anything but text is nothing');
  assert.equal(nameKey('  Square '), 'square', 'capitals do not make a different name');
});

test('a good name uses letters, numbers, underscores and single spaces, and fits', () => {
  for (const good of ['square', 'My Block 2', 'big_house', 'café', 'x']) assert.equal(nameProblem(good, NAME_MAX), null, good);
  assert.match(nameProblem('', NAME_MAX), /at least one/);
  assert.match(nameProblem('   ', NAME_MAX), /at least one/);
  assert.match(nameProblem('a'.repeat(NAME_MAX + 1), NAME_MAX), /too long/);
  for (const bad of ['no-dashes', 'a+b', '<b>', 'say "hi"', 'x.y', '100%']) assert.match(nameProblem(bad, NAME_MAX), /letters, numbers/, bad);
  assert.match(nameProblem('abcdefghijk', INPUT_MAX), /too long/, 'inputs get a shorter limit than blocks');
});

test('cleanName makes anything into a good name for reading a file', () => {
  assert.equal(cleanName('  Sq<b>uare!! ', NAME_MAX, 'x'), 'Sqbuare');
  assert.equal(cleanName('a'.repeat(40), NAME_MAX, 'x'), 'a'.repeat(NAME_MAX));
  assert.equal(cleanName('!!!', NAME_MAX, 'fallback'), 'fallback');
  assert.equal(cleanName(null, NAME_MAX, 'fallback'), 'fallback');
  assert.equal(cleanName({ evil: true }, NAME_MAX, 'fallback'), 'fallback');
  assert.equal(cleanName('square', NAME_MAX, 'x'), 'square', 'a good name is left alone');
});

test('uniqueName counts up until the name is free, and stays short enough', () => {
  const taken = new Set(['myblock', 'myblock2']);
  assert.equal(uniqueName('myblock', taken), 'myblock3');
  assert.equal(uniqueName('other', taken), 'other');
  assert.equal(uniqueName('MyBlock', taken), 'MyBlock3', 'capitals do not make it free');
  const long = 'a'.repeat(NAME_MAX);
  const free = uniqueName(long, new Set([long]));
  assert.ok(free.length <= NAME_MAX && free !== long, free);
});

// ---- Finding definitions -------------------------------------------------------------------------

test('a stack that starts with a to block is a definition, and its body is what is under it', () => {
  const body = { op: 'forward', args: [{ op: 'input', name: 'size' }] };
  const p = project(stack(hat('square', ['size']), body), stack({ op: 'start' }, call('square', ['size'])));
  assert.equal(isDefinition(p.stacks[0]), true);
  assert.equal(isDefinition(p.stacks[1]), false);
  const { map, duplicate } = definitionsOf(p);
  assert.equal(duplicate, null);
  assert.deepEqual([...map.keys()], ['square']);
  assert.deepEqual(map.get('square').params, ['size']);
  assert.deepEqual(map.get('square').body, [body]);
  assert.equal(map.get('square').hat, p.stacks[0].blocks[0]);
});

test('two definitions with the same name: the first counts and the second is reported', () => {
  const first = hat('Square');
  const second = hat('square');
  const { map, duplicate } = definitionsOf(project(stack(first), stack(second)));
  assert.equal(map.size, 1);
  assert.equal(map.get('square').hat, first);
  assert.equal(duplicate, second);
});

test('a to block in the middle of a stack is not a definition', () => {
  const p = project(stack({ op: 'start' }, hat('oops')));
  assert.equal(definitionsOf(p).map.size, 0);
  assert.equal(definitionHats(p).length, 0);
});

// ---- Blocks as they come out of the palette -------------------------------------------------------

test('a new definition gets a name nobody has, and no inputs', () => {
  assert.deepEqual(newDefinition(project()), { op: 'to', name: 'myblock', params: [] });
  const p = project(stack(hat('myblock')), stack(hat('MYBLOCK2')));
  assert.equal(newDefinition(p).name, 'myblock3');
});

test('a call comes with a socket for each input, holding 100, and shares nothing with the definition', () => {
  const definition = hat('square', ['size', 'turns']);
  const made = newCall(definition);
  assert.deepEqual(made, { op: 'call', name: 'square', params: ['size', 'turns'], args: [100, 100] });
  made.params.push('x');
  assert.deepEqual(definition.params, ['size', 'turns']);
  assert.deepEqual(newInput('size'), { op: 'input', name: 'size' });
});

test('specOf draws a call from its own names: a label, and a labelled socket for each input', () => {
  const spec = specOf(call('square', ['size', 'turns']));
  assert.equal(spec.label, 'square');
  assert.equal(spec.kind, 'command');
  assert.deepEqual(spec.args.map((a) => a.label), ['size', 'turns']);
  assert.ok(spec.args.every((a) => a.default === 100));
  assert.equal(specOf({ op: 'input', name: 'size' }).label, 'size');
  assert.equal(specOf({ op: 'input', name: 'size' }).kind, 'reporter');
  assert.equal(specOf({ op: 'forward', args: [1] }).label, 'forward', 'the others come from the table');
});

// ---- Renaming ---------------------------------------------------------------------------------------

test('renaming a definition renames every call to it, wherever the call is', () => {
  const inner = call('square', ['size']);
  const p = project(
    stack(hat('square', ['size'])),
    stack({ op: 'start' }, call('square', ['size']), { op: 'repeat', args: [3], body: [inner] }),
    stack(call('other')),
  );
  assert.deepEqual(renameDefinition(p, p.stacks[0].blocks[0], 'box'), { ok: true });
  assert.equal(p.stacks[0].blocks[0].name, 'box');
  assert.equal(p.stacks[1].blocks[1].name, 'box');
  assert.equal(inner.name, 'box', 'even inside a loop');
  assert.equal(p.stacks[2].blocks[0].name, 'other', 'calls to other blocks are left alone');
});

test('a rename keeps the numbers already typed into the calls', () => {
  const p = project(stack(hat('square', ['size'])), stack(call('square', ['size'], [42])));
  renameDefinition(p, p.stacks[0].blocks[0], 'box');
  assert.deepEqual(p.stacks[1].blocks[0].args, [42]);
});

test('a rename that does not work says why and changes nothing', () => {
  const p = project(stack(hat('square')), stack(hat('box')), stack(call('square')));
  const first = p.stacks[0].blocks[0];
  for (const [text, pattern] of [['', /at least one/], ['no-way', /letters, numbers/], ['x'.repeat(30), /too long/], ['Box', /already have a block called box/]]) {
    const result = renameDefinition(p, first, text);
    assert.equal(result.ok, false, text);
    assert.match(result.error, pattern, text);
  }
  assert.equal(first.name, 'square');
  assert.equal(p.stacks[2].blocks[0].name, 'square');
});

test('changing only the capitals of a name is allowed (it does not clash with itself)', () => {
  const p = project(stack(hat('square')), stack(call('square')));
  assert.deepEqual(renameDefinition(p, p.stacks[0].blocks[0], 'Square'), { ok: true });
  assert.equal(p.stacks[1].blocks[0].name, 'Square');
});

// ---- Inputs --------------------------------------------------------------------------------------------

test('adding an input gives every call a new socket, holding 100', () => {
  const p = project(stack(hat('square')), stack(call('square')), stack(call('square')));
  const h = p.stacks[0].blocks[0];
  assert.deepEqual(setInput(p, h, 0, 'size'), { ok: true });
  assert.deepEqual(h.params, ['size']);
  assert.deepEqual(p.stacks[1].blocks[0], { op: 'call', name: 'square', params: ['size'], args: [100] });
  assert.deepEqual(p.stacks[2].blocks[0].params, ['size']);
  assert.deepEqual(setInput(p, h, 1, 'turns'), { ok: true });
  assert.deepEqual(p.stacks[1].blocks[0].args, [100, 100], 'the first socket keeps its number');
});

test('renaming an input renames the input blocks inside the definition, and the calls label', () => {
  const use = { op: 'input', name: 'size' };
  const other = { op: 'input', name: 'turns' };
  const p = project(stack(hat('square', ['size', 'turns']), { op: 'forward', args: [use] }, { op: 'right', args: [other] }), stack(call('square', ['size', 'turns'], [7, 8])));
  assert.deepEqual(setInput(p, p.stacks[0].blocks[0], 0, 'side'), { ok: true });
  assert.equal(use.name, 'side');
  assert.equal(other.name, 'turns', 'the other input is untouched');
  assert.deepEqual(p.stacks[1].blocks[0].params, ['side', 'turns']);
  assert.deepEqual(p.stacks[1].blocks[0].args, [7, 8], 'the numbers stay where they were');
});

test('clearing an input takes it away, and the calls lose that socket and its number', () => {
  const p = project(stack(hat('square', ['size', 'turns'])), stack(call('square', ['size', 'turns'], [7, 8])));
  assert.deepEqual(setInput(p, p.stacks[0].blocks[0], 0, '  '), { ok: true });
  assert.deepEqual(p.stacks[0].blocks[0].params, ['turns']);
  assert.deepEqual(p.stacks[1].blocks[0], { op: 'call', name: 'square', params: ['turns'], args: [8] });
  assert.deepEqual(setInput(p, p.stacks[0].blocks[0], 5, ''), { ok: true }, 'clearing an input that is not there is nothing');
});

test('an input that does not work says why and changes nothing', () => {
  const p = project(stack(hat('square', ['size'])), stack(call('square', ['size'])));
  const h = p.stacks[0].blocks[0];
  assert.match(setInput(p, h, 1, 'size').error, /already has an input called size/);
  assert.match(setInput(p, h, 1, 'SIZE').error, /already has an input/);
  assert.match(setInput(p, h, 1, 'way too long a name').error, /too long/);
  assert.match(setInput(p, h, 1, 'a-b').error, /letters, numbers/);
  setInput(p, h, 1, 'turns');
  assert.match(setInput(p, h, 2, 'more').error, /2 inputs/);
  assert.deepEqual(h.params, ['size', 'turns']);
});

test('after a block is deleted and another is renamed to its name, calls follow the new inputs', () => {
  const orphan = call('jump', ['a'], [5]);
  const p = project(stack(hat('hop')), stack(orphan));
  renameDefinition(p, p.stacks[0].blocks[0], 'jump');
  assert.deepEqual(orphan, { op: 'call', name: 'jump', params: [], args: [] }, 'the orphan now matches the block it found');
});

// ---- Copies ----------------------------------------------------------------------------------------------

test('a copied definition gets a name of its own, and calls stay with the original', () => {
  const original = stack(hat('square'));
  const copy = stack(hat('square'));
  const p = project(original, copy, stack(call('square')));
  uniquifyDefinition(p, copy);
  assert.equal(copy.blocks[0].name, 'square2');
  assert.equal(original.blocks[0].name, 'square');
  assert.equal(p.stacks[2].blocks[0].name, 'square');
  uniquifyDefinition(p, original);
  assert.equal(original.blocks[0].name, 'square', 'a name nobody else has is left alone');
  const plain = stack({ op: 'forward', args: [1] });
  assert.doesNotThrow(() => uniquifyDefinition(project(plain), plain), 'a stack that is not a definition is fine');
});
