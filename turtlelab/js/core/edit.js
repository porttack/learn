// TurtleLab: changing a project by dragging blocks around.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// These functions are the editor's "what happens when you let go of a block"
// rules, with no drawing code in them. The editor works out WHICH blocks
// the user meant (from where they dropped them) and calls these to change
// the project. Keeping them here means they can be tested without a browser.
//
// A project is { stacks: [ { x, y, blocks: [...] } ] }. A block is
// { op, args?, body? }. See project.js for the full format.

import { BLOCKS } from './blocks-spec.js';

/** A copy of a block, and everything inside it, that shares nothing with it. */
export function cloneBlock(block) {
  return JSON.parse(JSON.stringify(block));
}

/** A fresh block the way it comes out of the palette: sockets hold their defaults. */
export function newBlock(op) {
  const spec = BLOCKS[op];
  const block = { op, args: spec.args.map((arg) => arg.default ?? null) };
  if (spec.kind === 'clamp') block.body = [];
  if (spec.kind === 'note') block.text = '';
  return block;
}

/** Take a stack out of the project. */
export function removeStack(project, stack) {
  const at = project.stacks.indexOf(stack);
  if (at !== -1) project.stacks.splice(at, 1);
}

/**
 * Pick up a command block and every block under it.
 *
 * `list` is the array the block sits in (a stack's `blocks`, or a clamp's
 * `body`) and `index` is where. `stack` is the top-level stack that owns the
 * list. Returns the stack that is now being carried, positioned at (x, y).
 * If the block was the top of its stack, that same stack is carried.
 * Otherwise the blocks from there down are split off into a new stack.
 */
export function detachCommands(project, stack, list, index, x, y) {
  if (list === stack.blocks && index === 0) {
    stack.x = x;
    stack.y = y;
    return stack;
  }
  const carried = { x, y, blocks: list.splice(index) };
  project.stacks.push(carried);
  return carried;
}

/**
 * Pick up a reporter that is plugged into a socket. The socket goes back to
 * the number it started with. Returns a stack holding just the reporter.
 */
export function detachReporter(project, parentBlock, argIndex, x, y) {
  const reporter = parentBlock.args[argIndex];
  parentBlock.args[argIndex] = BLOCKS[parentBlock.op].args[argIndex].default ?? null;
  const carried = { x, y, blocks: [reporter] };
  project.stacks.push(carried);
  return carried;
}

/** Snap a carried stack in after block number `index` of `list`. */
export function attachAfter(project, carried, list, index) {
  removeStack(project, carried);
  list.splice(index + 1, 0, ...carried.blocks);
}

/** Snap a carried stack into the mouth of a clamp block (like repeat), at the top. */
export function attachInside(project, carried, clampBlock) {
  removeStack(project, carried);
  clampBlock.body ??= [];
  clampBlock.body.unshift(...carried.blocks);
}

/**
 * Snap a carried stack on top of another stack, so the carried blocks run
 * first. The merged stack keeps the carried stack's position.
 */
export function attachAbove(project, carried, target) {
  removeStack(project, carried);
  target.blocks.unshift(...carried.blocks);
  target.x = carried.x;
  target.y = carried.y;
}

/**
 * Plug a carried reporter into a socket. If there was already a reporter
 * there, it is knocked out and left lying beside its old home; the number it
 * replaces (if it was just a number) is simply gone. Returns the knocked out
 * stack, or null.
 */
export function attachReporter(project, carried, parentBlock, argIndex, bumpX, bumpY) {
  if (!canPlug(parentBlock, argIndex, carried.blocks[0])) {
    throw new Error('That block does not fit in that socket.');
  }
  removeStack(project, carried);
  const old = parentBlock.args[argIndex];
  parentBlock.args[argIndex] = carried.blocks[0];
  if (old !== null && typeof old === 'object') {
    const bumped = { x: bumpX, y: bumpY, blocks: [old] };
    project.stacks.push(bumped);
    return bumped;
  }
  return null;
}

/** What a socket takes: 'number' (round) or 'boolean' (pointed, for yes-or-no blocks). */
export function socketType(parentBlock, index) {
  return BLOCKS[parentBlock.op].args[index].type ?? 'number';
}

/** What a reporter hands back: 'number' or 'boolean'. */
export function reporterType(block) {
  return BLOCKS[block.op].returns ?? 'number';
}

/** A reporter only fits a socket of the same type: a yes-or-no block cannot go in a number box. */
export function canPlug(parentBlock, index, reporterBlock) {
  return socketType(parentBlock, index) === reporterType(reporterBlock);
}

/** True if the stack is just one block that reports a value (like x). */
export function isReporterStack(stack) {
  return stack.blocks.length === 1 && BLOCKS[stack.blocks[0].op].kind === 'reporter';
}
