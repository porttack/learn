// TurtleLab: how complex a program is, as a score.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The score is a reward for using the big ideas of programming, not a count of how many blocks there are: a long program of
// forward and right blocks scores little, because the number of plain blocks only counts up to a limit, while the ideas keep paying.
// What pays, most of all first:
//
//   variables   a box that has a number stored in it and is used (box1 to box4), and an input of a block you made, are the best.
//               A box counts for itself, for each place it is stored and used, and a counter (a box that is changed using its own
//               number, like box1 + 1) is worth a lot. The first variable that is really used earns a bonus.
//   loops       repeat and forever. A loop inside a loop is worth more.
//   conditionals  if and if else. An if else (two ways to go) and an if inside a loop are worth more.
//   own blocks  a block you made with `to` and then used. A block that uses itself earns more.
//   math        sums, comparisons and chance (random).
//   user input  an ask block (and more when the answer it puts in box1 is used), and a `when paper clicked` handler that has blocks in it (and each place it
//               reads mouseX or mouseY). An ask block also counts as storing a number in box1, so using the answer earns the variable points too.
//
// There is a bonus for each of the big ideas used (loops, conditionals, variables, own blocks, and user input), a bigger one for the variable, and one more for
// all of the first four (that bonus was there before input was, so a program's score does not drop because input was added).
// Everything is worked out from the project's blocks (see project.js), as the editor shows them; nothing is stored or sent. It only
// reads the project. The words in `parts` and `tip` are for the person writing the program.

import { nameKey } from './names.js';
import { BOX_COUNT } from './blocks-spec.js';

/** How many points each thing is worth. Change them here (a test checks the proportions that matter, like variables paying most). */
export const POINTS = Object.freeze({
  block: 1, blockCap: 20, // each plain block, up to a limit
  loop: 6, nestedLoop: 4, // a repeat or forever, and extra for a loop inside a loop
  conditional: 7, elseWay: 2, conditionalInLoop: 3, // an if or if else, extra for the second way, extra for one inside a loop
  operator: 2, chance: 3, mathCap: 16, // a sum or comparison, random or one of, and the most all of them are worth
  box: 12, boxStore: 3, boxRead: 4, counter: 8, // a box that is used, each place it is stored in, each place it is read, each change of a box using itself
  input: 6, inputUse: 3, // an input of a block you made, and each place it is used
  ownBlock: 8, ownBlockUnused: 2, call: 2, callCap: 10, recursion: 10, // a block you made and use (or only made), each use of it, and one that uses itself
  firstVariable: 15, // the first variable that is stored and then used
  idea: 6, variableIdea: 10, allIdeas: 10, // for using each big idea, the variable one is worth more, and for using all of loops, conditionals, variables and own blocks
  ask: 6, askUsed: 6, // an ask block, and extra when the answer it puts in box1 is used somewhere
  handler: 8, mouseRead: 3, mouseCap: 12, // a click handler that has blocks in it, each place mouseX or mouseY is read (in a program with such a handler), and the most those are worth
});

/** The levels, by the least score that reaches them. */
export const LEVELS = Object.freeze([
  { min: 0, label: 'Blank page' },
  { min: 1, label: 'Just starting' },
  { min: 15, label: 'Getting going' },
  { min: 40, label: 'Building' },
  { min: 80, label: 'Clever' },
  { min: 140, label: 'Expert' },
]);

const OPERATORS = new Set(['add', 'subtract', 'multiply', 'divide', 'mod', 'paren', 'less', 'greater', 'equal', 'and', 'or', 'not']);
const CHANCE = new Set(['random', 'oneof']);
const LOOPS = new Set(['repeat', 'forever']);
const CONDITIONALS = new Set(['if', 'ifelse']);
/** Blocks that are not "plain blocks" to count: the hats that start a stack, and notes. */
const HANDLER_KINDS = ['onclick', 'onkey', 'onstep'];
const NOT_COUNTED = new Set(['start', 'to', 'onclick', 'onkey', 'onstep', 'note']);

const boxNumber = (op, prefix) => {
  const m = new RegExp(`^${prefix}([1-9][0-9]*)$`).exec(op);
  return m && Number(m[1]) <= BOX_COUNT ? Number(m[1]) : 0;
};

/** The level a score is in: { label, min, next } where `next` is the next level (or null at the top). */
export function levelOf(score) {
  let at = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (score >= LEVELS[i].min) at = i;
  return { ...LEVELS[at], next: LEVELS[at + 1] ?? null };
}

/** Does this block, or anything plugged into it, satisfy `test`? (Reporters are in sockets; bodies are not looked into.) */
function inSockets(block, test) {
  for (const arg of block.args ?? []) {
    if (arg !== null && typeof arg === 'object' && (test(arg) || inSockets(arg, test))) return true;
  }
  return false;
}

/**
 * Count what a project has in it, ready for scoring: the plain blocks, the loops (and nested ones), the conditionals, the boxes stored and read, the
 * inputs of blocks that were made and where they are used, the blocks made and where they are called, the operators and chance.
 */
export function inspect(project) {
  const stacks = Array.isArray(project?.stacks) ? project.stacks : [];
  const found = {
    blocks: 0, loops: 0, nestedLoops: 0, conditionals: 0, elseWays: 0, conditionalsInLoops: 0, operators: 0, chance: 0,
    stores: new Array(BOX_COUNT + 1).fill(0), reads: new Array(BOX_COUNT + 1).fill(0), counters: 0,
    inputs: 0, inputUses: 0, definitions: new Map(), calls: new Map(), recursive: new Set(),
    asks: 0, handlers: 0, handlersWithBlocks: 0, mouseReads: 0, // user input: ask blocks, event handlers (and those with blocks in them), and reads of mouseX and mouseY
    handlerKinds: { onclick: 0, onkey: 0, onstep: 0 }, // ... of each kind: a click on the paper, a key, a timer
    emptyHandler: null, // the kind of the first handler with nothing under it, for the tip
  };

  /** `loops` is how many loops this block is inside; `own` is the key of the block being defined (or null). */
  function walk(blocks, loops, own, params) {
    for (const block of Array.isArray(blocks) ? blocks : []) {
      if (block === null || typeof block !== 'object') continue;
      const op = block.op;
      if (!NOT_COUNTED.has(op)) found.blocks += 1;
      if (LOOPS.has(op)) {
        found.loops += 1;
        if (loops > 0) found.nestedLoops += 1;
      }
      if (CONDITIONALS.has(op)) {
        found.conditionals += 1;
        if (op === 'ifelse') found.elseWays += 1;
        if (loops > 0) found.conditionalsInLoops += 1;
      }
      if (OPERATORS.has(op)) found.operators += 1;
      if (CHANCE.has(op)) found.chance += 1;
      const stored = boxNumber(op, 'store');
      if (stored) {
        found.stores[stored] += 1;
        if (inSockets(block, (inner) => boxNumber(inner.op, 'box') === stored)) found.counters += 1; // box1 = box1 + 1
      }
      const read = boxNumber(op, 'box');
      if (read) found.reads[read] += 1;
      if (op === 'ask') {
        found.asks += 1;
        found.stores[1] += 1; // the answer goes in box1, which is storing a number in it
      }
      if (op === 'mousex' || op === 'mousey') found.mouseReads += 1;
      if (op === 'input' && params.has(nameKey(block.name ?? ''))) found.inputUses += 1;
      if (op === 'call' && typeof block.name === 'string') {
        const key = nameKey(block.name);
        found.calls.set(key, (found.calls.get(key) ?? 0) + 1);
        if (own === key) found.recursive.add(key);
      }
      // What is plugged into the sockets, then what is inside the mouths.
      for (const arg of block.args ?? []) if (arg !== null && typeof arg === 'object') walk([arg], loops, own, params);
      const inside = LOOPS.has(op) ? loops + 1 : loops;
      for (const key of ['body', 'elseBody']) if (block[key]) walk(block[key], inside, own, params);
    }
  }

  for (const stack of stacks) {
    const blocks = Array.isArray(stack?.blocks) ? stack.blocks : [];
    if (blocks[0]?.op === 'to') {
      const hat = blocks[0];
      const key = nameKey(hat.name ?? '');
      const params = new Set((Array.isArray(hat.params) ? hat.params : []).map((name) => nameKey(name)));
      if (!found.definitions.has(key)) found.definitions.set(key, { name: hat.name ?? '', inputs: params.size });
      found.inputs += params.size;
      walk(blocks.slice(1), 0, key, params);
    } else {
      if (HANDLER_KINDS.includes(blocks[0]?.op)) {
        found.handlers += 1;
        found.handlerKinds[blocks[0].op] += 1;
        if (blocks.length > 1) found.handlersWithBlocks += 1; // an empty one earns nothing
        else found.emptyHandler ??= blocks[0].op;
      }
      walk(blocks, 0, null, new Set());
    }
  }
  return found;
}

/** "1 click handler, 2 key handlers, 1 timer": the event handlers of each kind, in words. */
function handlerWordsOf(kinds) {
  const many = (count, one, more) => (count === 0 ? '' : `${count} ${count === 1 ? one : more}`);
  return [many(kinds.onclick, 'click handler', 'click handlers'), many(kinds.onkey, 'key handler', 'key handlers'), many(kinds.onstep, 'timer', 'timers')].filter(Boolean).join(', ');
}

/**
 * The score of a project, and how it was worked out.
 * @returns {{ score: number, level: { label: string, min: number, next: object | null },
 *   parts: { id: string, label: string, count: number, points: number, detail: string }[],
 *   ideas: { loops: boolean, conditionals: boolean, variables: boolean, ownBlocks: boolean, userInput: boolean }, tip: string }}
 */
export function scoreProject(project) {
  const found = inspect(project);
  const sum = (list) => list.reduce((a, b) => a + b, 0);

  // Blocks: each counts a little, up to a limit.
  const blockPoints = Math.min(found.blocks * POINTS.block, POINTS.blockCap);
  const loopPoints = found.loops * POINTS.loop + found.nestedLoops * POINTS.nestedLoop;
  const conditionalPoints = found.conditionals * POINTS.conditional + found.elseWays * POINTS.elseWay + found.conditionalsInLoops * POINTS.conditionalInLoop;
  const mathPoints = Math.min(found.operators * POINTS.operator + found.chance * POINTS.chance, POINTS.mathCap);

  // Variables: a box counts when a number is stored in it. Reading one that nothing was stored in earns nothing.
  let boxesUsed = 0;
  let boxPoints = 0;
  let boxReadsCounted = 0;
  for (let n = 1; n <= BOX_COUNT; n += 1) {
    if (found.stores[n] === 0) continue;
    boxesUsed += 1;
    boxPoints += POINTS.box + found.stores[n] * POINTS.boxStore + found.reads[n] * POINTS.boxRead;
    boxReadsCounted += found.reads[n];
  }
  boxPoints += found.counters * POINTS.counter;
  const inputPoints = found.inputs * POINTS.input + found.inputUses * POINTS.inputUse;
  const variablesUsed = (boxReadsCounted > 0) || found.inputUses > 0; // really used: stored and then read, or an input that is used
  const variablePoints = boxPoints + inputPoints + (variablesUsed ? POINTS.firstVariable : 0);
  const variableCount = boxesUsed + found.inputs;

  // Blocks you made: one that is used is worth the most, and one that uses itself more again.
  let ownCalled = 0;
  let ownUnused = 0;
  let callsCounted = 0;
  for (const key of found.definitions.keys()) {
    const calls = found.calls.get(key) ?? 0;
    if (calls > 0) {
      ownCalled += 1;
      callsCounted += calls;
    } else {
      ownUnused += 1;
    }
  }
  const ownPoints = ownCalled * POINTS.ownBlock + ownUnused * POINTS.ownBlockUnused + Math.min(callsCounted * POINTS.call, POINTS.callCap)
    + [...found.recursive].filter((key) => found.definitions.has(key)).length * POINTS.recursion;
  const ownBlocksUsed = ownCalled > 0;

  // User input: an ask block is worth something, and more when its answer (box1) is read somewhere; a click handler is worth something when it has blocks in
  // it, and reading where the click was (mouseX, mouseY) is worth a little more, up to a limit. The idea counts as used when an answer is really used or a handler really does something.
  const askUsed = found.asks > 0 && found.reads[1] > 0;
  const userInputPoints = found.asks * POINTS.ask + (askUsed ? POINTS.askUsed : 0) + found.handlersWithBlocks * POINTS.handler
    + (found.handlersWithBlocks > 0 ? Math.min(found.mouseReads * POINTS.mouseRead, POINTS.mouseCap) : 0);
  const userInputUsed = askUsed || found.handlersWithBlocks > 0;

  const ideas = { loops: found.loops > 0, conditionals: found.conditionals > 0, variables: variablesUsed, ownBlocks: ownBlocksUsed, userInput: userInputUsed };
  const ideaCount = Object.values(ideas).filter(Boolean).length;
  const firstFour = ideas.loops && ideas.conditionals && ideas.variables && ideas.ownBlocks;
  const bonusPoints = (ideas.loops ? POINTS.idea : 0) + (ideas.conditionals ? POINTS.idea : 0) + (ideas.ownBlocks ? POINTS.idea : 0) + (ideas.userInput ? POINTS.idea : 0)
    + (ideas.variables ? POINTS.variableIdea : 0) + (firstFour ? POINTS.allIdeas : 0);
  const askWords = found.asks === 0 ? '' : `${found.asks} ${found.asks === 1 ? 'ask' : 'asks'}`;
  const handlerWords = handlerWordsOf(found.handlerKinds);

  const parts = [
    { id: 'variables', label: 'Variables', count: variableCount, points: variablePoints, detail: variableCount === 0 ? '' : `${boxesUsed} ${boxesUsed === 1 ? 'box' : 'boxes'}, ${found.inputs} ${found.inputs === 1 ? 'input' : 'inputs'}${found.counters > 0 ? `, ${found.counters} ${found.counters === 1 ? 'counter' : 'counters'}` : ''}` },
    { id: 'loops', label: 'Loops', count: found.loops, points: loopPoints, detail: found.loops === 0 ? '' : found.nestedLoops > 0 ? `${found.nestedLoops} inside another` : '' },
    { id: 'conditionals', label: 'Conditionals', count: found.conditionals, points: conditionalPoints, detail: found.conditionals === 0 ? '' : found.elseWays > 0 ? `${found.elseWays} with an else` : '' },
    { id: 'ownBlocks', label: 'Blocks you made', count: found.definitions.size, points: ownPoints, detail: found.definitions.size === 0 ? '' : `${ownCalled} used${found.recursive.size > 0 ? ', one uses itself' : ''}` },
    { id: 'userInput', label: 'User input', count: found.asks + found.handlers, points: userInputPoints, detail: [askWords, handlerWords].filter(Boolean).join(', ') },
    { id: 'math', label: 'Math and chance', count: found.operators + found.chance, points: mathPoints, detail: '' },
    { id: 'blocks', label: 'Blocks', count: found.blocks, points: blockPoints, detail: found.blocks * POINTS.block > POINTS.blockCap ? 'the first 20 count' : '' },
    { id: 'bonus', label: 'Using the big ideas', count: ideaCount, points: bonusPoints, detail: ideaCount === 5 ? 'all five' : `${ideaCount} of 5` },
  ];
  const score = sum(parts.map((part) => part.points));
  return { score, level: levelOf(score), parts, ideas, tip: tipFor(ideas, found) };
}

/** One thing to try next, the biggest idea not used yet (variables first). */
function tipFor(ideas, found) {
  if (found.blocks === 0) return 'Put some blocks in and your score starts.';
  if (!ideas.variables) {
    return found.stores.some((n) => n > 0)
      ? 'You stored a number in a box. Use it: put that box block into a socket, like the number of a forward block.'
      : 'Try a variable: store a number in a box, then use that box in another block. A counter that adds 1 each time is worth the most.';
  }
  if (!ideas.loops) return 'Try a loop: repeat does the same thing again and again.';
  if (!ideas.conditionals) return 'Try an if: it only does something when the answer is yes.';
  if (!ideas.ownBlocks) return 'Try making a block of your own with to, then use it.';
  if (found.counters === 0) return 'A counter is worth a lot: store in a box the same box plus 1, inside a loop.';
  if (found.nestedLoops === 0) return 'A loop inside a loop is worth more.';
  if (found.handlers > 0 && found.handlersWithBlocks === 0) {
    if (found.emptyHandler === 'onkey') return 'Put blocks under when key pressed, and they run every time you press the key.';
    if (found.emptyHandler === 'onstep') return 'Put blocks under every, and they run again and again.';
    return 'Put blocks under when paper clicked, and they run every time you click the paper.';
  }
  if (!ideas.userInput) {
    return found.asks > 0
      ? 'The ask block puts its answer in box1. Use it: plug box1 into a block, like the number of a repeat.'
      : 'Try input: the ask block asks for a number, and when paper clicked or when a key is pressed runs blocks every time.';
  }
  return 'You are using all the big ideas. Keep going: a block that uses itself earns more.';
}
