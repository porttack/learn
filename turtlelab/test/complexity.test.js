// Tests for js/core/complexity.js: the program complexity score, which rewards loops, conditionals and above all variables.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POINTS, LEVELS, levelOf, inspect, scoreProject } from '../js/core/complexity.js';

const b = (op, ...args) => ({ op, args });
const withBody = (op, args, body, elseBody) => ({ op, args, body, ...(elseBody ? { elseBody } : {}) });
const project = (...stacks) => ({ stacks: stacks.map((blocks, i) => ({ x: 20, y: 20 + i * 200, blocks })) });
const part = (result, id) => result.parts.find((p) => p.id === id);

// A few programs of different kinds, used throughout.
const square = project([b('start'), b('clean'), withBody('repeat', [4], [b('forward', 100), b('right', 90)])]);
const straight = project([b('start'), ...Array.from({ length: 40 }, () => b('forward', 10))]);
const oneVariable = project([b('start'), b('store1', 5), b('forward', b('box1'))]);
const counter = project([b('start'), b('store1', 0), withBody('repeat', [10], [b('store1', b('add', b('box1'), 1)), b('forward', b('box1'))])]);
const oneIf = project([b('start'), withBody('if', [b('less', 1, 2)], [b('forward', 100)])]);
const ownBlock = project(
  [b('to'), b('forward', { op: 'input', args: [], name: 'size' }), b('right', 90)],
  [b('start'), { op: 'call', name: 'square', params: ['size'], args: [50] }],
);
ownBlock.stacks[0].blocks[0] = { op: 'to', args: [], name: 'square', params: ['size'] };

test('an empty page scores nothing, a program with only a start block too, and the first blocks make it start', () => {
  assert.equal(scoreProject(project()).score, 0);
  assert.equal(scoreProject(project([b('start')])).score, 0);
  assert.equal(scoreProject(project([b('start')])).level.label, 'Blank page');
  assert.ok(scoreProject(project([b('start'), b('forward', 10)])).score > 0);
  assert.match(scoreProject(project()).tip, /Put some blocks in/);
});

test('a square with a loop: its blocks, the loop, and the bonus for using a big idea', () => {
  const r = scoreProject(square);
  assert.equal(part(r, 'blocks').points, 4, 'clean, repeat, forward, right');
  assert.equal(part(r, 'loops').points, POINTS.loop);
  assert.equal(part(r, 'bonus').points, POINTS.idea, 'one of the four big ideas');
  assert.equal(r.score, 4 + POINTS.loop + POINTS.idea);
  assert.deepEqual(r.ideas, { loops: true, conditionals: false, variables: false, ownBlocks: false });
});

test('piling on plain blocks stops paying: forty forwards are worth no more than twenty, and far less than a program with ideas in it', () => {
  const r = scoreProject(straight);
  assert.equal(part(r, 'blocks').points, POINTS.blockCap);
  assert.equal(r.score, POINTS.blockCap);
  assert.ok(scoreProject(project([b('start'), ...Array.from({ length: 60 }, () => b('forward', 10))])).score === r.score);
  assert.ok(scoreProject(counter).score > r.score * 2);
});

test('variables pay the most: a program with one variable beats one with a conditional, which beats one with a loop', () => {
  const variable = scoreProject(oneVariable).score;
  const conditional = scoreProject(oneIf).score;
  const loop = scoreProject(project([b('start'), withBody('repeat', [4], [b('forward', 100)])])).score;
  assert.ok(variable > conditional && conditional > loop, JSON.stringify({ variable, conditional, loop }));
  assert.ok(variable >= conditional * 2, 'by a lot, not a little');
  assert.ok(POINTS.box + POINTS.firstVariable > POINTS.loop + POINTS.conditional, 'one variable is worth more than a loop and an if together');
});

test('a box counts when a number is stored in it and then used; one nothing was stored in earns nothing', () => {
  const r = scoreProject(oneVariable);
  assert.equal(part(r, 'variables').points, POINTS.box + POINTS.boxStore + POINTS.boxRead + POINTS.firstVariable);
  assert.equal(part(r, 'variables').count, 1);
  assert.equal(r.ideas.variables, true);
  const readOnly = scoreProject(project([b('start'), b('forward', b('box2'))]));
  assert.equal(part(readOnly, 'variables').points, 0, 'a box that was never stored in is worth nothing');
  assert.equal(readOnly.ideas.variables, false);
  const storedOnly = scoreProject(project([b('start'), b('store3', 7)]));
  assert.equal(part(storedOnly, 'variables').points, POINTS.box + POINTS.boxStore, 'storing is a start: partial credit, but no first-variable bonus and no idea bonus until it is used');
  assert.equal(storedOnly.ideas.variables, false);
  assert.match(storedOnly.tip, /You stored a number in a box. Use it/);
});

test('a counter (a box changed using its own number) is worth a lot more than a box that is only set', () => {
  const r = scoreProject(counter);
  assert.equal(inspect(counter).counters, 1);
  assert.equal(part(r, 'variables').points, POINTS.box + POINTS.boxStore * 2 + POINTS.boxRead * 2 + POINTS.counter + POINTS.firstVariable);
  assert.ok(part(r, 'variables').points > part(scoreProject(oneVariable), 'variables').points + POINTS.counter - 1);
  assert.match(part(r, 'variables').detail, /1 box, 0 inputs, 1 counter/);
  // Different boxes do not make a counter: box2 is not box1.
  assert.equal(inspect(project([b('start'), b('store1', b('add', b('box2'), 1))])).counters, 0);
});

test('the inputs of a block you made are variables too, worth something for each and for each use', () => {
  const r = scoreProject(ownBlock);
  assert.equal(part(r, 'variables').points, POINTS.input + POINTS.inputUse + POINTS.firstVariable);
  assert.equal(part(r, 'variables').count, 1);
  assert.equal(r.ideas.variables, true);
  assert.equal(inspect(ownBlock).inputUses, 1);
  // An input that is never used is worth its own points but not the first-variable bonus.
  const unused = project([{ op: 'to', args: [], name: 'go', params: ['far'] }, b('forward', 10)]);
  assert.equal(part(scoreProject(unused), 'variables').points, POINTS.input);
  assert.equal(scoreProject(unused).ideas.variables, false);
  // An input block outside its own block does not count as a use.
  assert.equal(inspect(project([b('start'), b('forward', { op: 'input', args: [], name: 'far' })])).inputUses, 0);
});

test('own blocks: one that is used is worth more than one that is only made, each use adds a little up to a limit, and one that uses itself earns more', () => {
  const r = scoreProject(ownBlock);
  assert.equal(part(r, 'ownBlocks').points, POINTS.ownBlock + POINTS.call);
  assert.equal(r.ideas.ownBlocks, true);
  const made = scoreProject(project([{ op: 'to', args: [], name: 'go', params: [] }, b('forward', 10)]));
  assert.equal(part(made, 'ownBlocks').points, POINTS.ownBlockUnused);
  assert.equal(made.ideas.ownBlocks, false, 'made but never used is not using the idea');
  const many = project([{ op: 'to', args: [], name: 'go', params: [] }, b('forward', 10)], [b('start'), ...Array.from({ length: 12 }, () => ({ op: 'call', name: 'go', params: [], args: [] }))]);
  assert.equal(part(scoreProject(many), 'ownBlocks').points, POINTS.ownBlock + POINTS.callCap, 'twelve uses stop at the limit');
  const recursive = project([{ op: 'to', args: [], name: 'spiral', params: [] }, b('forward', 10), { op: 'call', name: 'spiral', params: [], args: [] }], [b('start'), { op: 'call', name: 'spiral', params: [], args: [] }]);
  assert.equal(part(scoreProject(recursive), 'ownBlocks').points, POINTS.ownBlock + POINTS.call * 2 + POINTS.recursion);
  // Names are matched the way the editor matches them: capitals do not matter.
  assert.equal(scoreProject(project([{ op: 'to', args: [], name: 'Spin', params: [] }, b('left', 5)], [b('start'), { op: 'call', name: 'spin', params: [], args: [] }])).ideas.ownBlocks, true);
});

test('loops and conditionals: nesting and else are worth more', () => {
  const nested = project([b('start'), withBody('repeat', [3], [withBody('repeat', [4], [b('forward', 10)])])]);
  assert.equal(part(scoreProject(nested), 'loops').points, POINTS.loop * 2 + POINTS.nestedLoop);
  assert.match(part(scoreProject(nested), 'loops').detail, /1 inside another/);
  const twoIfs = project([b('start'), withBody('if', [b('less', 1, 2)], [b('forward', 10)]), withBody('ifelse', [b('less', 1, 2)], [b('forward', 10)], [b('back', 10)])]);
  assert.equal(part(scoreProject(twoIfs), 'conditionals').points, POINTS.conditional * 2 + POINTS.elseWay);
  const inLoop = project([b('start'), withBody('forever', [], [withBody('if', [b('less', 1, 2)], [b('forward', 10)])])]);
  assert.equal(part(scoreProject(inLoop), 'conditionals').points, POINTS.conditional + POINTS.conditionalInLoop);
  // A loop in a mouth of an if else is found too.
  assert.equal(inspect(project([b('start'), withBody('ifelse', [b('less', 1, 2)], [], [withBody('repeat', [2], [b('left', 5)])])])).loops, 1);
});

test('math and chance count a little, up to a limit', () => {
  const sums = project([b('start'), b('forward', b('add', 1, b('multiply', 2, b('random', 1, 5))))]);
  assert.equal(part(scoreProject(sums), 'math').points, POINTS.operator * 2 + POINTS.chance);
  const lots = project([b('start'), ...Array.from({ length: 20 }, () => b('forward', b('add', 1, 2)))]);
  assert.equal(part(scoreProject(lots), 'math').points, POINTS.mathCap);
});

test('each big idea used earns a bonus, the variable most of all, and using all four earns another', () => {
  const all = project(
    [{ op: 'to', args: [], name: 'go', params: [] }, b('forward', 10)],
    [b('start'), b('store1', 0), withBody('repeat', [3], [withBody('if', [b('less', b('box1'), 5)], [b('store1', b('add', b('box1'), 1)), { op: 'call', name: 'go', params: [], args: [] }])])],
  );
  const r = scoreProject(all);
  assert.deepEqual(r.ideas, { loops: true, conditionals: true, variables: true, ownBlocks: true });
  assert.equal(part(r, 'bonus').points, POINTS.idea * 3 + POINTS.variableIdea + POINTS.allIdeas);
  assert.equal(part(r, 'bonus').detail, 'all four');
  assert.ok(POINTS.variableIdea > POINTS.idea);
  assert.ok(r.score > 100, `${r.score}`);
  assert.match(r.tip, /nested|all the big ideas|loop inside/i);
});

test('adding a better idea never lowers the score', () => {
  const steps = [
    project([b('start'), b('forward', 50)]),
    project([b('start'), withBody('repeat', [4], [b('forward', 50), b('right', 90)])]),
    project([b('start'), withBody('repeat', [4], [b('forward', 50), b('right', 90), withBody('if', [b('less', 1, 2)], [b('left', 10)])])]),
    project([b('start'), b('store1', 0), withBody('repeat', [4], [b('forward', b('box1')), b('right', 90), b('store1', b('add', b('box1'), 10))])]),
  ];
  const scores = steps.map((p) => scoreProject(p).score);
  for (let i = 1; i < scores.length; i += 1) assert.ok(scores[i] > scores[i - 1], JSON.stringify(scores));
});

test('notes and the hats that start a stack are not counted as blocks', () => {
  const r = scoreProject(project([b('start'), { op: 'note', args: [], text: 'hello' }, b('forward', 10)]));
  assert.equal(part(r, 'blocks').count, 1);
});

test('the levels start at the numbers they say, in order, and a score is in the highest one it reaches', () => {
  assert.deepEqual(LEVELS.map((l) => l.min), [...LEVELS.map((l) => l.min)].sort((a, c) => a - c));
  assert.equal(LEVELS[0].min, 0);
  assert.equal(levelOf(0).label, 'Blank page');
  assert.equal(levelOf(1).label, 'Just starting');
  assert.equal(levelOf(14).label, 'Just starting');
  assert.equal(levelOf(15).label, 'Getting going');
  assert.equal(levelOf(39).label, 'Getting going');
  assert.equal(levelOf(40).label, 'Building');
  assert.equal(levelOf(140).label, 'Expert');
  assert.equal(levelOf(9999).next, null, 'nothing above the top');
  assert.equal(levelOf(20).next.label, 'Building');
  // The programs above land where you would expect.
  assert.equal(scoreProject(square).level.label, 'Getting going');
  assert.ok(['Building', 'Clever'].includes(scoreProject(counter).level.label), scoreProject(counter).level.label);
});

test('it never throws, whatever it is given, and a project it cannot read is a blank page', () => {
  for (const junk of [null, undefined, 5, 'x', {}, { stacks: 5 }, { stacks: [null, 3, { blocks: 'no' }, { blocks: [null, 4, { op: 'repeat', body: 'no' }] }] }]) {
    const r = scoreProject(junk);
    assert.ok(Number.isInteger(r.score) && r.score >= 0, JSON.stringify(junk));
  }
  assert.equal(scoreProject(null).score, 0);
});

test('the words it shows are plain: no dashes, and nothing about a teacher or a grade', () => {
  const programs = [project(), square, straight, oneVariable, counter, oneIf, ownBlock];
  for (const p of programs) {
    const r = scoreProject(p);
    const words = [r.tip, ...r.parts.flatMap((x) => [x.label, x.detail]), r.level.label].join(' ');
    assert.ok(!/[–—]/.test(words), words);
    assert.ok(!/teacher|class|grade|student/i.test(words), words);
  }
  assert.ok(!/[–—]/.test(LEVELS.map((l) => l.label).join(' ')));
});

test('the score is always a whole number and a bigger program with more ideas is never worth less than a smaller one it contains', () => {
  for (const p of [square, counter, oneIf, ownBlock]) assert.ok(Number.isInteger(scoreProject(p).score));
  assert.ok(scoreProject(counter).score > scoreProject(oneVariable).score - 1);
});

test('a row with nothing in it says nothing: no "try repeat" style hint, in an empty program or one that uses none of the ideas (the tip underneath is the one nudge)', () => {
  const plain = { app: 'turtlelab', version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'forward', args: [100] }, { op: 'right', args: [90] }] }] };
  for (const project of [{ app: 'turtlelab', version: 1, stacks: [] }, plain]) {
    const r = scoreProject(project);
    for (const x of r.parts) {
      if (x.count === 0 && x.id !== 'bonus') assert.equal(x.detail, '', `${x.id} with a count of 0 has nothing to say`); // ("0 of 4" on the big ideas row is a fact, not a hint)
      assert.ok(!/\btry\b/i.test(x.detail) && !/then use it/.test(x.detail), `${x.id}: ${x.detail}`);
    }
    assert.ok(r.tip.length > 0, 'the one thing to try is still said, once, as the tip');
  }
});
