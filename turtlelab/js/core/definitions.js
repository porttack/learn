// TurtleLab: blocks you make yourself.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A stack that starts with a `to` block is the definition of a block of your
// own. Its name and inputs are typed on the hat and the blocks under the hat
// are what it does:
//
//   { op: 'to', name: 'square', params: ['size'] }
//
// Using it is a `call` block, and the call keeps its own copy of the name and
// the input names (so it can be drawn, and so it still makes sense if the
// definition is deleted). `input` blocks hand back what a call was given:
//
//   { op: 'call', name: 'square', params: ['size'], args: [100] }
//   { op: 'input', name: 'size' }
//
// Because calls hold copies, changing a definition has to change every call
// too. That is what the functions here are for. No drawing code in this file.

import { walkBlocks } from './project.js';
import { INPUT_MAX, MAX_INPUTS, NAME_MAX, nameKey, nameProblem, tidyName, uniqueName } from './names.js';

/** What a new call gives a new input until it is typed over. */
export const DEFAULT_INPUT_VALUE = 100;

/** Does this stack define a block (does it start with a `to`)? */
export const isDefinition = (stack) => stack.blocks[0]?.op === 'to';

/** The `to` blocks of a project, in the order of its stacks. */
export function definitionHats(project) {
  return project.stacks.filter(isDefinition).map((stack) => stack.blocks[0]);
}

/** The nameKeys already used by definitions, for picking a name that is free. */
export function takenNames(project, except = null) {
  return new Set(definitionHats(project).filter((hat) => hat !== except).map((hat) => nameKey(hat.name)));
}

/**
 * What every definition in a project does, ready for a run.
 * Returns { map, duplicate }. `map` goes from a name's key (see nameKey) to
 * { name, params, body, hat }. If two definitions share a name the first one
 * is kept, and `duplicate` is the hat of the second, so the editor can say so.
 */
export function definitionsOf(project) {
  const map = new Map();
  let duplicate = null;
  for (const stack of project.stacks) {
    if (!isDefinition(stack)) continue;
    const hat = stack.blocks[0];
    const key = nameKey(hat.name);
    if (map.has(key)) {
      duplicate ??= hat;
      continue;
    }
    map.set(key, { name: hat.name, params: hat.params ?? [], body: stack.blocks.slice(1), hat });
  }
  return { map, duplicate };
}

// ---- Making blocks, the way they come out of the palette ---------------------------------

/** A new `to` block with a name no other definition has. */
export function newDefinition(project) {
  return { op: 'to', name: uniqueName('myblock', takenNames(project)), params: [] };
}

/** A call to a definition (the `to` block works too: all it needs is a name and params). */
export function newCall(definition) {
  const params = [...(definition.params ?? [])];
  return { op: 'call', name: definition.name, params, args: params.map(() => DEFAULT_INPUT_VALUE) };
}

/** An input block for the input called `name`. */
export function newInput(name) {
  return { op: 'input', name };
}

// ---- Changing a definition, and every call with it ----------------------------------------

/** Every call block in the project to the block with this name. */
function callsTo(project, name) {
  const key = nameKey(name);
  const found = [];
  for (const stack of project.stacks) {
    walkBlocks(stack.blocks, (block) => {
      if (block.op === 'call' && nameKey(block.name) === key) found.push(block);
    });
  }
  return found;
}

/** Make every call to this definition show its current name and inputs, keeping the numbers already typed. */
function syncCalls(project, hat) {
  const params = hat.params ?? [];
  for (const call of callsTo(project, hat.name)) {
    const args = Array.isArray(call.args) ? call.args : [];
    call.name = hat.name;
    call.params = [...params];
    call.args = params.map((_, i) => (i < args.length ? args[i] : DEFAULT_INPUT_VALUE));
  }
}

/**
 * Give a definition a new name, and every call to it too. Returns
 * { ok: true } or { ok: false, error } with a sentence for the student, in
 * which case nothing changed.
 */
export function renameDefinition(project, hat, text) {
  const problem = nameProblem(text, NAME_MAX);
  if (problem) return { ok: false, error: problem };
  const name = tidyName(text);
  const clash = definitionHats(project).find((other) => other !== hat && nameKey(other.name) === nameKey(name));
  if (clash) return { ok: false, error: `You already have a block called ${clash.name}. Pick a different name.` };
  const calls = callsTo(project, hat.name);
  hat.name = name;
  for (const call of calls) call.name = name;
  syncCalls(project, hat);
  return { ok: true };
}

/**
 * Set input number `index` (0 or 1) of a definition to `text`.
 *   an empty `text` takes that input away (the calls lose their socket for it)
 *   an index one past the last input adds a new one
 *   otherwise the input is renamed, along with the input blocks that use it
 *   inside this definition
 * Returns { ok: true } or { ok: false, error }, in which case nothing changed.
 */
export function setInput(project, hat, index, text) {
  hat.params ??= [];
  const params = hat.params;
  const typed = tidyName(text);

  if (typed === '') {
    if (index >= params.length) return { ok: true };
    for (const call of callsTo(project, hat.name)) {
      call.params?.splice(index, 1);
      call.args?.splice(index, 1);
    }
    params.splice(index, 1);
    syncCalls(project, hat);
    return { ok: true };
  }

  const problem = nameProblem(typed, INPUT_MAX);
  if (problem) return { ok: false, error: problem };
  if (index > params.length || index >= MAX_INPUTS) return { ok: false, error: `A block can have ${MAX_INPUTS} inputs.` };
  if (params.some((other, i) => i !== index && nameKey(other) === nameKey(typed))) {
    return { ok: false, error: `This block already has an input called ${typed}.` };
  }

  if (index === params.length) {
    params.push(typed);
  } else {
    const old = params[index];
    params[index] = typed;
    // The input blocks inside this definition follow the new name.
    const stack = project.stacks.find((candidate) => candidate.blocks[0] === hat);
    walkBlocks(stack ? stack.blocks.slice(1) : [], (block) => {
      if (block.op === 'input' && nameKey(block.name) === nameKey(old)) block.name = typed;
    });
  }
  syncCalls(project, hat);
  return { ok: true };
}

/**
 * After a stack has been copied, give a copied definition a name of its own
 * (square becomes square2) so the project never holds two with the same name.
 * Calls stay with the original.
 */
export function uniquifyDefinition(project, stack) {
  const hat = stack.blocks[0];
  if (hat?.op !== 'to') return;
  const taken = takenNames(project, hat);
  if (taken.has(nameKey(hat.name))) hat.name = uniqueName(hat.name, taken);
}
