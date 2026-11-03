// Turtle Draw: the project file format.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A project is plain JSON, the same shape the editor keeps in memory. It is
// what gets autosaved, what undo remembers, and what is tucked inside a
// saved PNG. It looks like this:
//
//   { "app": "porttack-turtle", "version": 1,
//     "stacks": [
//       { "x": 40, "y": 60, "blocks": [
//           { "op": "clean" },
//           { "op": "repeat", "args": [4], "body": [
//               { "op": "forward", "args": [100] },
//               { "op": "right", "args": [90] } ] } ] } ] }
//
// A block is { op, args?, body? }. Each entry in `args` is a number, null
// (an empty socket), or another block that reports a value. `body` holds the
// blocks inside a clamp block such as repeat.
//
// The "app" name is the file format's name. It stays the same even if the
// app is renamed, so old saved pictures keep opening.

import { BLOCKS, isKnownOp } from './blocks-spec.js';

export const FORMAT_ID = 'porttack-turtle';
export const FORMAT_VERSION = 1;

/** Blocks nested deeper than this are refused, so a bad file can't crash us. */
const MAX_DEPTH = 100;

export function emptyProject() {
  return { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [] };
}

/**
 * Check a parsed JSON value and return a clean copy of it.
 * Returns { ok: true, project } or { ok: false, error } where `error` is a
 * sentence a student can read.
 */
export function validateProject(data) {
  try {
    if (data === null || typeof data !== 'object' || data.app !== FORMAT_ID) {
      return fail('This file was not made by this app.');
    }
    if (!Number.isInteger(data.version) || data.version < 1) {
      return fail('This file does not say which version made it.');
    }
    if (data.version > FORMAT_VERSION) {
      return fail(
        'This was made with a newer version of the app. Reload the page to get the newest version.',
      );
    }
    if (!Array.isArray(data.stacks)) {
      return fail('This project is missing its list of block stacks.');
    }
    const stacks = data.stacks.map((stack) => cleanStack(stack));
    return { ok: true, project: { app: FORMAT_ID, version: FORMAT_VERSION, stacks } };
  } catch (error) {
    if (error instanceof ProjectError) return fail(error.message);
    throw error;
  }
}

/**
 * What the Run button should run.
 *
 * Run starts at a `start` block: the topmost stack that begins with one.
 * ("Topmost" means the smallest y, and the smallest x breaks a tie.) If
 * there is no start block anywhere, it runs the topmost stack of commands
 * instead, so pressing Run always does something sensible with what is on
 * the page. A lone reporter (like x) is not a program, so it never counts.
 *
 * Returns { stack, startCount }. `stack` is null when there is nothing to
 * run, and `startCount` is how many start blocks there are, so the editor
 * can say so when there is more than one.
 */
export function findRunStack(project) {
  const higher = (a, b) => b === null || a.y < b.y || (a.y === b.y && a.x < b.x);
  let topStart = null;
  let topCommands = null;
  let startCount = 0;
  for (const stack of project.stacks) {
    const first = stack.blocks[0];
    if (!first) continue;
    if (first.op === 'start') {
      startCount += 1;
      if (higher(stack, topStart)) topStart = stack;
    } else if (BLOCKS[first.op].kind !== 'reporter' && higher(stack, topCommands)) {
      topCommands = stack;
    }
  }
  return { stack: topStart ?? topCommands, startCount };
}

/** Call `visit` for every block in a list, including blocks plugged into sockets and inside clamps. */
export function walkBlocks(blocks, visit) {
  for (const block of blocks) {
    visit(block);
    for (const arg of block.args ?? []) {
      if (arg !== null && typeof arg === 'object') walkBlocks([arg], visit);
    }
    if (block.body) walkBlocks(block.body, visit);
  }
}

/** True if any block in the project stores to or reads from a box. */
export function usesBoxes(project) {
  let found = false;
  for (const stack of project.stacks) {
    walkBlocks(stack.blocks, (block) => {
      if (/^(store|box)\d+$/.test(block.op)) found = true;
    });
  }
  return found;
}

// ---- Internals --------------------------------------------------------

class ProjectError extends Error {}

function fail(error) {
  return { ok: false, error };
}

function cleanStack(stack) {
  if (stack === null || typeof stack !== 'object') {
    throw new ProjectError('A block stack in this file is damaged.');
  }
  const { x, y, blocks } = stack;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Array.isArray(blocks) || blocks.length === 0) {
    throw new ProjectError('A block stack in this file is damaged.');
  }
  return { x, y, blocks: blocks.map((block) => cleanBlock(block, 1)) };
}

function cleanBlock(block, depth) {
  if (depth > MAX_DEPTH) {
    throw new ProjectError('The blocks in this file are nested too deeply.');
  }
  if (block === null || typeof block !== 'object' || typeof block.op !== 'string') {
    throw new ProjectError('A block in this file is damaged.');
  }
  if (!isKnownOp(block.op)) {
    throw new ProjectError(`This file uses a block this app does not have: "${block.op}".`);
  }
  const clean = { op: block.op };
  if (block.args !== undefined) {
    if (!Array.isArray(block.args)) throw new ProjectError('A block in this file is damaged.');
    clean.args = block.args.map((arg) => cleanArg(arg, depth + 1));
  }
  if (block.body !== undefined) {
    if (!Array.isArray(block.body)) throw new ProjectError('A block in this file is damaged.');
    clean.body = block.body.map((inner) => cleanBlock(inner, depth + 1));
  }
  return clean;
}

function cleanArg(arg, depth) {
  if (arg === null) return null;
  if (typeof arg === 'number' && Number.isFinite(arg)) return arg;
  return cleanBlock(arg, depth);
}
