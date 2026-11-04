// Tests for the editing rules: picking blocks up and snapping them down.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  newBlock,
  cloneBlock,
  detachCommands,
  detachReporter,
  attachAfter,
  attachInside,
  attachAbove,
  attachReporter,
  removeStack,
  isReporterStack,
  canPlug,
  socketType,
  reporterType,
} from '../js/core/edit.js';
import { validateProject, FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';

const ops = (blocks) => blocks.map((b) => b.op);

function projectWith(...stacks) {
  return { app: FORMAT_ID, version: FORMAT_VERSION, stacks };
}

test('a new block comes with the numbers from the spec', () => {
  assert.deepEqual(newBlock('forward'), { op: 'forward', args: [100] });
  assert.deepEqual(newBlock('setcolor'), { op: 'setcolor', args: [255, 0, 0] });
  assert.deepEqual(newBlock('clean'), { op: 'clean', args: [] });
});

test('a new start block has no sockets', () => {
  assert.deepEqual(newBlock('start'), { op: 'start', args: [] });
});

test('a new clamp block has an empty body', () => {
  assert.deepEqual(newBlock('repeat'), { op: 'repeat', args: [4], body: [] });
});

test('every block in the spec makes a valid project block', () => {
  for (const op of ['clean', 'forward', 'repeat', 'x', 'setcolor', 'arc']) {
    const result = validateProject(projectWith({ x: 0, y: 0, blocks: [newBlock(op)] }));
    assert.equal(result.ok, true, op);
  }
});

test('cloning shares nothing with the original', () => {
  const original = { op: 'repeat', args: [4], body: [newBlock('forward')] };
  const copy = cloneBlock(original);
  copy.body[0].args[0] = 5;
  assert.equal(original.body[0].args[0], 100);
});

test('picking up the top block carries the whole stack, same object', () => {
  const stack = { x: 10, y: 20, blocks: [newBlock('clean'), newBlock('forward')] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, stack.blocks, 0, 50, 60);
  assert.equal(carried, stack);
  assert.deepEqual([carried.x, carried.y], [50, 60]);
  assert.equal(project.stacks.length, 1);
});

test('picking up a middle block splits off it and everything below', () => {
  const stack = { x: 0, y: 0, blocks: [newBlock('clean'), newBlock('forward'), newBlock('left'), newBlock('right')] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, stack.blocks, 1, 30, 40);
  assert.deepEqual(ops(stack.blocks), ['clean']);
  assert.deepEqual(ops(carried.blocks), ['forward', 'left', 'right']);
  assert.deepEqual([carried.x, carried.y], [30, 40]);
  assert.equal(project.stacks.length, 2);
});

test('picking up a block inside a clamp takes only the rest of that clamp body', () => {
  const clamp = { op: 'repeat', args: [4], body: [newBlock('forward'), newBlock('right')] };
  const stack = { x: 0, y: 0, blocks: [clamp, newBlock('back')] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, clamp.body, 1, 0, 0);
  assert.deepEqual(ops(clamp.body), ['forward']);
  assert.deepEqual(ops(carried.blocks), ['right']);
  assert.deepEqual(ops(stack.blocks), ['repeat', 'back'], 'blocks after the clamp stay put');
});

test('picking up the first block of a clamp body leaves an empty body', () => {
  const clamp = { op: 'repeat', args: [4], body: [newBlock('forward')] };
  const stack = { x: 0, y: 0, blocks: [clamp] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, clamp.body, 0, 0, 0);
  assert.deepEqual(clamp.body, []);
  assert.deepEqual(ops(carried.blocks), ['forward']);
});

test('snapping after a block inserts the carried stack in the middle', () => {
  const stack = { x: 0, y: 0, blocks: [newBlock('clean'), newBlock('back')] };
  const carried = { x: 0, y: 0, blocks: [newBlock('forward'), newBlock('left')] };
  const project = projectWith(stack, carried);
  attachAfter(project, carried, stack.blocks, 0);
  assert.deepEqual(ops(stack.blocks), ['clean', 'forward', 'left', 'back']);
  assert.deepEqual(project.stacks, [stack]);
});

test('snapping inside a clamp puts the blocks at the top of its body', () => {
  const clamp = { op: 'repeat', args: [4], body: [newBlock('back')] };
  const stack = { x: 0, y: 0, blocks: [clamp] };
  const carried = { x: 0, y: 0, blocks: [newBlock('forward')] };
  const project = projectWith(stack, carried);
  attachInside(project, carried, clamp);
  assert.deepEqual(ops(clamp.body), ['forward', 'back']);
  assert.deepEqual(project.stacks, [stack]);
});

test('snapping inside a clamp with no body yet creates one', () => {
  const clamp = { op: 'repeat', args: [4] };
  const stack = { x: 0, y: 0, blocks: [clamp] };
  const carried = { x: 0, y: 0, blocks: [newBlock('forward')] };
  attachInside(projectWith(stack, carried), carried, clamp);
  assert.deepEqual(ops(clamp.body), ['forward']);
});

test('snapping on top of a stack runs the carried blocks first and keeps their place', () => {
  const target = { x: 100, y: 100, blocks: [newBlock('forward')] };
  const carried = { x: 40, y: 50, blocks: [newBlock('clean')] };
  const project = projectWith(target, carried);
  attachAbove(project, carried, target);
  assert.deepEqual(ops(target.blocks), ['clean', 'forward']);
  assert.deepEqual([target.x, target.y], [40, 50]);
  assert.deepEqual(project.stacks, [target]);
});

test('picking up a plugged-in reporter puts the default number back', () => {
  const block = { op: 'forward', args: [{ op: 'x' }] };
  const project = projectWith({ x: 0, y: 0, blocks: [block] });
  const carried = detachReporter(project, block, 0, 5, 6);
  assert.deepEqual(block.args, [100]);
  assert.deepEqual(carried.blocks, [{ op: 'x' }]);
  assert.deepEqual([carried.x, carried.y], [5, 6]);
  assert.equal(project.stacks.length, 2);
});

test('plugging a reporter into a socket replaces the number', () => {
  const block = newBlock('forward');
  const carried = { x: 0, y: 0, blocks: [{ op: 'heading' }] };
  const project = projectWith({ x: 0, y: 0, blocks: [block] }, carried);
  const bumped = attachReporter(project, carried, block, 0, 9, 9);
  assert.equal(bumped, null);
  assert.deepEqual(block.args, [{ op: 'heading' }]);
  assert.equal(project.stacks.length, 1);
});

test('plugging a reporter over another reporter knocks the old one out', () => {
  const block = { op: 'forward', args: [{ op: 'x' }] };
  const carried = { x: 0, y: 0, blocks: [{ op: 'y' }] };
  const project = projectWith({ x: 0, y: 0, blocks: [block] }, carried);
  const bumped = attachReporter(project, carried, block, 0, 70, 80);
  assert.deepEqual(block.args, [{ op: 'y' }]);
  assert.deepEqual(bumped, { x: 70, y: 80, blocks: [{ op: 'x' }] });
  assert.equal(project.stacks.length, 2);
  assert.ok(project.stacks.includes(bumped));
});

test('removeStack deletes a stack and ignores one that is not there', () => {
  const a = { x: 0, y: 0, blocks: [newBlock('clean')] };
  const b = { x: 0, y: 0, blocks: [newBlock('back')] };
  const project = projectWith(a, b);
  removeStack(project, a);
  removeStack(project, a);
  assert.deepEqual(project.stacks, [b]);
});

test('a lone reporter is a reporter stack, anything else is not', () => {
  assert.equal(isReporterStack({ blocks: [{ op: 'x' }] }), true);
  assert.equal(isReporterStack({ blocks: [{ op: 'forward', args: [1] }] }), false);
  assert.equal(isReporterStack({ blocks: [{ op: 'x' }, { op: 'y' }] }), false);
});

test('number sockets take number blocks, and pointed sockets take yes-or-no blocks', () => {
  const forward = newBlock('forward');
  const ifBlock = newBlock('if');
  assert.equal(socketType(forward, 0), 'number');
  assert.equal(socketType(ifBlock, 0), 'boolean');
  assert.equal(reporterType({ op: 'heading' }), 'number');
  assert.equal(reporterType({ op: 'less' }), 'boolean');
  assert.equal(canPlug(forward, 0, { op: 'heading' }), true);
  assert.equal(canPlug(forward, 0, { op: 'add', args: [1, 1] }), true);
  assert.equal(canPlug(forward, 0, { op: 'less', args: [0, 0] }), false);
  assert.equal(canPlug(ifBlock, 0, { op: 'less', args: [0, 0] }), true);
  assert.equal(canPlug(ifBlock, 0, { op: 'heading' }), false);
});

test('a new if block has an empty yes-or-no socket and an empty body', () => {
  assert.deepEqual(newBlock('if'), { op: 'if', args: [null], body: [] });
});

test('plugging the wrong kind of block in is refused', () => {
  const forward = newBlock('forward');
  const carried = { x: 0, y: 0, blocks: [{ op: 'less', args: [0, 0] }] };
  const project = projectWith({ x: 0, y: 0, blocks: [forward] }, carried);
  assert.throws(() => attachReporter(project, carried, forward, 0, 0, 0), /does not fit/);
  assert.deepEqual(forward.args, [100]);
});

test('pulling a block out of an if leaves its socket empty, not a number', () => {
  const ifBlock = { op: 'if', args: [{ op: 'less', args: [1, 2] }], body: [] };
  const project = projectWith({ x: 0, y: 0, blocks: [ifBlock] });
  const carried = detachReporter(project, ifBlock, 0, 0, 0);
  assert.deepEqual(ifBlock.args, [null]);
  assert.equal(carried.blocks[0].op, 'less');
});

test('a new note is empty, and a note is not a reporter', () => {
  assert.deepEqual(newBlock('note'), { op: 'note', args: [], text: '' });
  assert.equal(isReporterStack({ blocks: [{ op: 'note', args: [], text: '' }] }), false);
});

test('a note can be picked up, copied and put back like any stack', () => {
  const note = { op: 'note', args: [], text: 'explains the square' };
  const stack = { x: 10, y: 20, blocks: [note] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, stack.blocks, 0, 50, 60);
  assert.equal(carried, stack);
  assert.deepEqual(cloneBlock(note), note);
  assert.notEqual(cloneBlock(note), note);
});

test('a new if else has a yes-or-no socket and two empty mouths', () => {
  assert.deepEqual(newBlock('ifelse'), { op: 'ifelse', args: [null], body: [], elseBody: [] });
  assert.deepEqual(newBlock('repeat'), { op: 'repeat', args: [4], body: [] }, 'a clamp with one mouth has no else list');
});

test('snapping into the second mouth of an if else goes into the else list, at the top', () => {
  const ifelse = { op: 'ifelse', args: [null], body: [newBlock('forward')], elseBody: [newBlock('back')] };
  const stack = { x: 0, y: 0, blocks: [ifelse] };
  const carried = { x: 0, y: 0, blocks: [newBlock('left')] };
  const project = projectWith(stack, carried);
  attachInside(project, carried, ifelse, 1);
  assert.deepEqual(ops(ifelse.body), ['forward'], 'the first mouth is untouched');
  assert.deepEqual(ops(ifelse.elseBody), ['left', 'back']);
  assert.deepEqual(project.stacks, [stack]);
});

test('the first mouth is the default, and a missing else list is made when needed', () => {
  const ifelse = { op: 'ifelse', args: [null] };
  const carried = { x: 0, y: 0, blocks: [newBlock('left')] };
  attachInside(projectWith({ x: 0, y: 0, blocks: [ifelse] }, carried), carried, ifelse);
  assert.deepEqual(ops(ifelse.body), ['left']);
  const other = { op: 'ifelse', args: [null] };
  const carried2 = { x: 0, y: 0, blocks: [newBlock('right')] };
  attachInside(projectWith({ x: 0, y: 0, blocks: [other] }, carried2), carried2, other, 1);
  assert.deepEqual(ops(other.elseBody), ['right']);
});

test('picking up a block from the else mouth takes the rest of that mouth only', () => {
  const ifelse = { op: 'ifelse', args: [null], body: [newBlock('forward')], elseBody: [newBlock('back'), newBlock('left'), newBlock('right')] };
  const stack = { x: 0, y: 0, blocks: [ifelse] };
  const project = projectWith(stack);
  const carried = detachCommands(project, stack, ifelse.elseBody, 1, 5, 5);
  assert.deepEqual(ops(ifelse.elseBody), ['back']);
  assert.deepEqual(ops(carried.blocks), ['left', 'right']);
  assert.deepEqual(ops(ifelse.body), ['forward']);
});

// ---- Blocks you make yourself, in the editing rules -----------------------------------------------------

test('a call socket knocked back to its default holds 100, and a number input plugs into it', () => {
  const call = { op: 'call', name: 'go', params: ['d'], args: [{ op: 'input', name: 'd' }] };
  const project = { stacks: [{ x: 0, y: 0, blocks: [call] }] };
  const carried = detachReporter(project, call, 0, 5, 5);
  assert.equal(call.args[0], 100);
  assert.equal(carried.blocks[0].op, 'input');
  assert.equal(canPlug(call, 0, carried.blocks[0]), true, 'an input is a number block, so it fits a number socket');
  assert.equal(canPlug({ op: 'if', args: [null] }, 0, carried.blocks[0]), false, 'but not the yes-or-no socket of an if');
  assert.equal(isReporterStack({ blocks: [carried.blocks[0]] }), true);
});

test('newBlock still makes the fixed blocks, and refuses the ones that need a name', () => {
  assert.deepEqual(newBlock('forward'), { op: 'forward', args: [100] });
  assert.throws(() => newBlock('call'), /made from a definition/);
  assert.throws(() => newBlock('input'), /made from a definition/);
});

test('a write block comes out of the palette with some words and a size, and snaps like any command', () => {
  const block = newBlock('write');
  assert.deepEqual(block, { op: 'write', args: [60], text: 'Hello' });
  const stack = { x: 0, y: 0, blocks: [newBlock('clean')] };
  const carried = { x: 0, y: 0, blocks: [block] };
  const project = projectWith(stack, carried);
  attachAfter(project, carried, stack.blocks, 0);
  assert.deepEqual(ops(stack.blocks), ['clean', 'write']);
  // The words are copied with the block, and a copy is its own.
  const copy = cloneBlock(block);
  copy.text = 'Cougars';
  assert.equal(block.text, 'Hello');
});
