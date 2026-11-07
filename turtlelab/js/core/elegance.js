// TurtleLab: how elegant a program is: said with as little as it needs, with nothing copied or left over.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Elegance is a number from 0.0 to 1.0 worked out from the blocks alone (nothing has to be run). It starts at 1.0 and goes down for things that
// make a program longer or messier than it needs to be, so a small, tidy program can be 1.0 (it is not about how much the program does: that is
// complexity, core/complexity.js). What it looks for:
//
//   copy and paste   blocks that repeat one after another (a repeat block would do it), and the same few blocks in two or more places
//                    (a block of your own would do it once). The blocks you could save, as a share of all of them, is what counts.
//   the same number  a number typed four or more times (not 0 or 1): a variable or an input could hold it in one place.
//   left over        a block you made and never use, a stack that does not start with a start block (Run does not run it), blocks after a stop,
//                    a repeat or an if with nothing inside.
//   deep nesting     loops and ifs more than four deep.
//
// It also says what is good (a block of your own that is used a lot, a loop doing the repeating, variables), without changing the number.
// The reasons are plain sentences for the person who wrote the program. Nothing here stores or sends anything.

import { BODY_KEYS, specOf } from './blocks-spec.js';
import { nameKey } from './names.js';

/** Fewer blocks than this and there is nothing to judge yet. */
export const MIN_BLOCKS = 3;

/** How much each kind of mess costs, and the most it can cost in all. (A test pins the proportions that matter.) */
export const COSTS = Object.freeze({
  copiedShare: 1.5, copiedMost: 0.6, // the share of blocks that could be saved, times this
  sameNumber: 0.03, sameNumberMore: 0.01, sameNumberEach: 0.1, sameNumberMost: 0.2, // for each number typed too often, and each time more than the fourth
  unusedBlock: 0.05, unusedMost: 0.15,
  looseStack: 0.05, looseMost: 0.1,
  afterStop: 0.05,
  emptyClamp: 0.03, emptyMost: 0.09,
  deep: 0.05, deepMost: 0.15, deepFrom: 4, // for each level of nesting past this many
});

const HATS = new Set(['start', 'to', 'onclick']); // (a click handler is a stack of its own, not a stray one)
const LOOPS = new Set(['repeat', 'forever']);
const MAX_UNIT = 6; // the longest run of blocks looked for as a copy
const SAME_NUMBER_AT = 4; // a number typed this many times is too many

const isBlock = (x) => x !== null && typeof x === 'object';

/** A text that is the same for blocks that are the same: what they are, what is in their sockets and mouths, and (for a call) which block of yours. */
function keyOf(block) {
  if (!isBlock(block)) return String(block);
  const args = (block.args ?? []).map(keyOf).join(',');
  const bodies = BODY_KEYS.map((key) => (Array.isArray(block[key]) ? `[${block[key].map(keyOf).join(';')}]` : '')).join('');
  let extra = '';
  if (block.op === 'call' || block.op === 'input') extra = `:${nameKey(block.name ?? '')}`;
  else if (block.op === 'write') extra = `:${block.text ?? ''}`;
  else if (block.op === 'setfont') extra = `:${block.font ?? ''}`;
  return `${block.op}${extra}(${args})${bodies}`;
}

/** Every block in a block, itself included: the blocks plugged into it and the ones in its mouths. */
function everyBlock(block, visit) {
  visit(block);
  for (const arg of block.args ?? []) if (isBlock(arg)) everyBlock(arg, visit);
  for (const key of BODY_KEYS) if (Array.isArray(block[key])) for (const inner of block[key]) if (isBlock(inner)) everyBlock(inner, visit);
}

/** How many blocks a block is, counting what is plugged into it and inside it. */
function weight(block) {
  let n = 0;
  everyBlock(block, (b) => { if (b.op !== 'note') n += 1; });
  return n;
}

/** What a block says, in a few words: its name and the numbers in it ("forward 100", "set color 255 0 0"). */
function describe(block) {
  const spec = specOf(block);
  const label = spec?.label ?? block.op;
  const numbers = (block.args ?? []).filter((a) => typeof a === 'number').join(' ');
  return numbers ? `${label} ${numbers}` : label;
}

/** A few blocks in a few words: "forward 100, right 90". */
function describeAll(blocks) {
  const shown = blocks.slice(0, 3).map(describe).join(', ');
  return blocks.length > 3 ? `${shown}, ...` : shown;
}

/** What the program is made of: every list of blocks a person could repeat (the lists under start or a hat, and the ones inside mouths). */
function listsOf(stacks) {
  const lists = [];
  const addList = (blocks) => {
    const list = blocks.filter((b) => isBlock(b) && b.op !== 'note');
    lists.push(list);
    for (const block of list) for (const key of BODY_KEYS) if (Array.isArray(block[key])) addList(block[key]);
  };
  for (const stack of stacks) {
    const blocks = Array.isArray(stack?.blocks) ? stack.blocks : [];
    addList(HATS.has(blocks[0]?.op) ? blocks.slice(1) : blocks);
  }
  return lists;
}

/**
 * Blocks that are copies. First blocks that repeat one after another (one block three or more times in a row, or a few blocks twice or more), and
 * then the same few blocks in different places (two to six blocks, in two or more places). `covered` is every block counted, so none is counted twice.
 */
function findCopies(lists) {
  const covered = new Set();
  const cover = (block) => everyBlock(block, (b) => covered.add(b));
  const findings = [];

  // One after another.
  for (const list of lists) {
    let i = 0;
    while (i < list.length) {
      if (covered.has(list[i])) {
        i += 1;
        continue;
      }
      let found = null;
      for (let size = 1; size <= MAX_UNIT && !found; size += 1) {
        if (i + size > list.length) break;
        const unit = list.slice(i, i + size).map(keyOf).join('|');
        let times = 1;
        while (i + (times + 1) * size <= list.length && list.slice(i + times * size, i + (times + 1) * size).map(keyOf).join('|') === unit) times += 1;
        if (times >= (size === 1 ? 3 : 2)) found = { size, times };
      }
      if (found) {
        const all = list.slice(i, i + found.size * found.times);
        const unit = all.slice(0, found.size);
        all.forEach(cover);
        findings.push({ type: 'run', unit, times: found.times, saved: unit.reduce((n, b) => n + weight(b), 0) * (found.times - 1) });
        i += found.size * found.times;
      } else {
        i += 1;
      }
    }
  }

  // The same blocks in different places, the longest first.
  for (let size = MAX_UNIT; size >= 2; size -= 1) {
    const seen = new Map();
    for (const list of lists) {
      for (let i = 0; i + size <= list.length; i += 1) {
        const unit = list.slice(i, i + size);
        if (unit.some((b) => covered.has(b))) continue;
        const key = unit.map(keyOf).join('|');
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key).push(unit);
      }
    }
    for (const places of seen.values()) {
      const used = new Set();
      const taken = [];
      for (const unit of places) {
        if (unit.some((b) => used.has(b) || covered.has(b))) continue;
        taken.push(unit);
        unit.forEach((b) => used.add(b));
      }
      if (taken.length >= 2) {
        taken.forEach((unit) => unit.forEach(cover));
        findings.push({ type: 'copies', unit: taken[0], times: taken.length, saved: taken[0].reduce((n, b) => n + weight(b), 0) * (taken.length - 1) });
      }
    }
  }
  return { findings, covered };
}

/**
 * How elegant a program is.
 * @returns {{ value: number | null, reasons: { kind: 'good' | 'tip', text: string }[], blocks: number, saved: number }}
 *   `value` is 0.0 to 1.0, or null if there are too few blocks to say. `reasons` has each thing it noticed, the things to fix first.
 */
export function eleganceOf(project) {
  const stacks = Array.isArray(project?.stacks) ? project.stacks.filter((s) => s && Array.isArray(s.blocks) && s.blocks.length > 0) : [];
  const lists = listsOf(stacks);
  let blocks = 0;
  for (const stack of stacks) for (const block of stack.blocks) if (isBlock(block) && !HATS.has(block.op) && block.op !== 'note') blocks += weight(block);
  if (blocks < MIN_BLOCKS) {
    return { value: null, reasons: [{ kind: 'tip', text: 'Put a few blocks in and this says how neatly they are put together.' }], blocks, saved: 0 };
  }

  const tips = [];
  const goods = [];
  let cost = 0;

  // Copy and paste.
  const { findings, covered } = findCopies(lists);
  const saved = findings.reduce((n, f) => n + f.saved, 0);
  cost += Math.min(COSTS.copiedMost, (saved / blocks) * COSTS.copiedShare);
  for (const f of findings.sort((a, b) => b.saved - a.saved).slice(0, 3)) {
    tips.push({ kind: 'tip', text: f.type === 'run'
      ? `${describeAll(f.unit)} comes ${f.times} times in a row. A repeat block could do it, and save ${f.saved} ${f.saved === 1 ? 'block' : 'blocks'}.`
      : `${describeAll(f.unit)} is on the page ${f.times} times. A block of your own (to) could do it once, and save ${f.saved} blocks.` });
  }

  // The same number, typed over and over (not the ones that were copies already).
  const counts = new Map();
  for (const stack of stacks) {
    for (const block of stack.blocks) {
      if (!isBlock(block) || block.op === 'note') continue;
      everyBlock(block, (b) => {
        if (covered.has(b) || HATS.has(b.op)) return;
        for (const arg of b.args ?? []) if (typeof arg === 'number' && Number.isFinite(arg) && ![0, 1, -1].includes(arg)) counts.set(arg, (counts.get(arg) ?? 0) + 1);
      });
    }
  }
  let numberCost = 0;
  for (const [value, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    if (n < SAME_NUMBER_AT) continue;
    numberCost += Math.min(COSTS.sameNumberEach, COSTS.sameNumber + COSTS.sameNumberMore * (n - SAME_NUMBER_AT));
    if (tips.filter((t) => /is typed/.test(t.text)).length < 2) tips.push({ kind: 'tip', text: `The number ${value} is typed ${n} times. A variable (a box) or an input could hold it in one place.` });
  }
  cost += Math.min(COSTS.sameNumberMost, numberCost);

  // Left over.
  const defined = new Map();
  const called = new Map();
  let loose = 0;
  let afterStop = 0;
  let empties = 0;
  let deepest = 0;
  const emptyNames = [];
  const walk = (list, depth) => {
    let stopped = false;
    for (const block of list) {
      if (!isBlock(block) || block.op === 'note') continue;
      if (stopped) afterStop += 1;
      if (block.op === 'stop') stopped = true;
      if (block.op === 'call' && typeof block.name === 'string') called.set(nameKey(block.name), (called.get(nameKey(block.name)) ?? 0) + 1);
      const clamp = BODY_KEYS.some((key) => Array.isArray(block[key]));
      if (clamp) {
        const inside = depth + 1;
        deepest = Math.max(deepest, inside);
        if (BODY_KEYS.every((key) => !Array.isArray(block[key]) || block[key].filter((b) => isBlock(b) && b.op !== 'note').length === 0)) {
          empties += 1;
          emptyNames.push(specOf(block)?.label ?? block.op);
        }
        for (const key of BODY_KEYS) if (Array.isArray(block[key])) walk(block[key], inside);
      }
    }
  };
  for (const stack of stacks) {
    const first = stack.blocks[0];
    if (first?.op === 'to') {
      const key = nameKey(first.name ?? '');
      if (!defined.has(key)) defined.set(key, first.name ?? '');
    }
    const body = HATS.has(first?.op) ? stack.blocks.slice(1) : stack.blocks;
    if (!HATS.has(first?.op) && isBlock(first) && ['command', 'clamp'].includes(specOf(first)?.kind)) loose += 1;
    walk(body, 0);
  }
  const unused = [...defined].filter(([key]) => !called.has(key));
  cost += Math.min(COSTS.unusedMost, unused.length * COSTS.unusedBlock);
  for (const [, name] of unused.slice(0, 2)) tips.push({ kind: 'tip', text: `Your block ${name || '(no name yet)'} is never used. Use it, or take it away.` });
  cost += Math.min(COSTS.looseMost, loose * COSTS.looseStack);
  if (loose > 0) tips.push({ kind: 'tip', text: `${loose === 1 ? 'A stack does' : `${loose} stacks do`} not start with a start block, so Run does not run ${loose === 1 ? 'it' : 'them'}.` });
  cost += afterStop * COSTS.afterStop;
  if (afterStop > 0) tips.push({ kind: 'tip', text: `${afterStop === 1 ? 'A block comes' : `${afterStop} blocks come`} after a stop, so ${afterStop === 1 ? 'it' : 'they'} never run${afterStop === 1 ? 's' : ''}.` });
  cost += Math.min(COSTS.emptyMost, empties * COSTS.emptyClamp);
  if (empties > 0) tips.push({ kind: 'tip', text: `${emptyNames[0]} has nothing inside it.` });
  if (deepest > COSTS.deepFrom) {
    cost += Math.min(COSTS.deepMost, (deepest - COSTS.deepFrom) * COSTS.deep);
    tips.push({ kind: 'tip', text: `Loops and ifs go ${deepest} deep. A block of your own could hold the inside.` });
  }

  // What is good, said, but not counted: it is the absence of the mess above.
  const usedMost = [...called].filter(([key, n]) => defined.has(key) && n >= 2).sort((a, b) => b[1] - a[1])[0];
  if (usedMost) goods.push({ kind: 'good', text: `Your block ${defined.get(usedMost[0])} is used ${usedMost[1]} times, so it is written once.` });
  let loops = 0;
  let reads = 0;
  let stores = 0;
  for (const stack of stacks) {
    for (const block of stack.blocks) {
      if (!isBlock(block)) continue;
      everyBlock(block, (b) => {
        if (LOOPS.has(b.op)) loops += 1;
        if (/^store\d+$/.test(b.op)) stores += 1;
        if (/^box\d+$/.test(b.op)) reads += 1;
      });
    }
  }
  if (loops > 0 && !findings.some((f) => f.type === 'run')) goods.push({ kind: 'good', text: 'A loop does the repeating.' });
  if (stores > 0 && reads > 0) goods.push({ kind: 'good', text: 'A variable keeps a number in one place.' });
  if (tips.length === 0 && findings.length === 0) goods.push({ kind: 'good', text: 'Nothing is copied or left over.' });

  const value = Math.max(0, Math.min(1, 1 - cost));
  return { value, reasons: [...tips, ...goods], blocks, saved };
}
