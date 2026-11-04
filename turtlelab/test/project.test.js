// Tests for project validation and finding the main stack.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  emptyProject,
  validateProject,
  findRunStack,
  usesBoxes,
  walkBlocks,
  FORMAT_ID,
  FORMAT_VERSION,
} from '../js/core/project.js';

const square = () => ({
  app: FORMAT_ID,
  version: FORMAT_VERSION,
  stacks: [
    {
      x: 40,
      y: 60,
      blocks: [
        { op: 'clean' },
        {
          op: 'repeat',
          args: [4],
          body: [
            { op: 'forward', args: [100] },
            { op: 'right', args: [{ op: 'heading' }] },
          ],
        },
      ],
    },
  ],
});

const error = (data) => {
  const result = validateProject(data);
  assert.equal(result.ok, false);
  return result.error;
};

test('an empty project is valid', () => {
  const result = validateProject(emptyProject());
  assert.equal(result.ok, true);
  assert.deepEqual(result.project.stacks, []);
});

test('a good project comes back equal but as a separate copy', () => {
  const original = square();
  const result = validateProject(original);
  assert.equal(result.ok, true);
  assert.deepEqual(result.project, original);
  result.project.stacks[0].blocks[0].op = 'back';
  assert.equal(original.stacks[0].blocks[0].op, 'clean');
});

test('a file from some other app is refused', () => {
  assert.match(error({ app: 'something-else', version: 1, stacks: [] }), /not made by this app/);
  assert.match(error(null), /not made by this app/);
  assert.match(error('hello'), /not made by this app/);
});

test('a file from a newer version says so in plain words', () => {
  const data = square();
  data.version = FORMAT_VERSION + 1;
  assert.match(error(data), /newer version/);
});

test('a missing or bad version is refused', () => {
  const data = square();
  delete data.version;
  assert.match(error(data), /version/);
  data.version = 0;
  assert.match(error(data), /version/);
  data.version = 1.5;
  assert.match(error(data), /version/);
});

test('missing stacks are refused', () => {
  assert.match(error({ app: FORMAT_ID, version: 1 }), /stacks/);
});

test('damaged stacks and blocks are refused', () => {
  const noBlocks = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [] }] };
  assert.match(error(noBlocks), /damaged/);
  const noPosition = { app: FORMAT_ID, version: 1, stacks: [{ blocks: [{ op: 'clean' }] }] };
  assert.match(error(noPosition), /damaged/);
  const notABlock = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [42] }] };
  assert.match(error(notABlock), /damaged/);
  const badArgs = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'forward', args: 'ten' }] }] };
  assert.match(error(badArgs), /damaged/);
  const badArg = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'forward', args: ['ten'] }] }] };
  assert.match(error(badArg), /damaged/);
  const badBody = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'repeat', args: [2], body: 5 }] }] };
  assert.match(error(badBody), /damaged/);
});

test('a block this app does not have is named in the error', () => {
  const data = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'teleport' }] }] };
  assert.match(error(data), /teleport/);
});

test('an inherited name like "toString" is not a real block', () => {
  const data = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'toString' }] }] };
  assert.match(error(data), /toString/);
});

test('blocks nested absurdly deep are refused instead of crashing', () => {
  let block = { op: 'clean' };
  for (let i = 0; i < 500; i++) block = { op: 'repeat', args: [1], body: [block] };
  const data = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [block] }] };
  assert.match(error(data), /nested too deeply/);
});

test('only known fields survive validation', () => {
  const data = JSON.parse(
    '{"app":"porttack-turtle","version":1,"extra":1,"stacks":[{"x":1,"y":2,"note":"hi","blocks":[{"op":"clean","evil":true,"__proto__":{"polluted":1}}]}]}',
  );
  const result = validateProject(data);
  assert.equal(result.ok, true);
  assert.deepEqual(result.project, {
    app: FORMAT_ID,
    version: 1,
    stacks: [{ x: 1, y: 2, blocks: [{ op: 'clean' }] }],
  });
  assert.equal({}.polluted, undefined);
});

const stackAt = (x, y, ...ops) => ({ x, y, blocks: ops.map((op) => ({ op, args: [] })) });

test('Run starts at the topmost stack that begins with a start block', () => {
  const lower = stackAt(0, 300, 'start', 'clean');
  const top = stackAt(300, 50, 'start', 'forward');
  const plainAbove = stackAt(0, 10, 'forward');
  const result = findRunStack({ stacks: [lower, plainAbove, top] });
  assert.equal(result.stack, top);
  assert.equal(result.startCount, 2);
});

test('a start stack beats a plain stack that is higher up the page', () => {
  const plain = stackAt(0, 10, 'forward');
  const started = stackAt(0, 200, 'start');
  assert.equal(findRunStack({ stacks: [plain, started] }).stack, started);
});

test('when two start stacks are level, the leftmost wins', () => {
  const left = stackAt(10, 50, 'start');
  const right = stackAt(90, 50, 'start');
  assert.equal(findRunStack({ stacks: [right, left] }).stack, left);
});

test('with no start block, Run falls back to the topmost stack of commands', () => {
  const lower = stackAt(0, 200, 'back');
  const top = stackAt(40, 20, 'forward');
  const result = findRunStack({ stacks: [lower, top] });
  assert.equal(result.stack, top);
  assert.equal(result.startCount, 0);
});

test('a lone reporter is not a program, so Run ignores it', () => {
  const reporter = stackAt(0, 0, 'x');
  const commands = stackAt(0, 100, 'forward');
  assert.equal(findRunStack({ stacks: [reporter, commands] }).stack, commands);
  assert.equal(findRunStack({ stacks: [reporter] }).stack, null);
});

test('nothing to run on an empty page', () => {
  assert.deepEqual(findRunStack({ stacks: [] }), { stack: null, startCount: 0 });
});

test('a start block is a valid block in a project file', () => {
  const data = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'start' }, { op: 'clean' }] }] };
  assert.equal(validateProject(data).ok, true);
});

test('usesBoxes sees a box block anywhere, including plugged in and inside a clamp', () => {
  const stack = (...blocks) => ({ stacks: [{ x: 0, y: 0, blocks }] });
  assert.equal(usesBoxes({ stacks: [] }), false);
  assert.equal(usesBoxes(stack({ op: 'forward', args: [100] })), false);
  assert.equal(usesBoxes(stack({ op: 'store2', args: [5] })), true);
  assert.equal(usesBoxes(stack({ op: 'forward', args: [{ op: 'box3' }] })), true);
  assert.equal(usesBoxes(stack({ op: 'forward', args: [{ op: 'box4' }] })), true, 'the fourth box counts too');
  assert.equal(usesBoxes(stack({ op: 'repeat', args: [2], body: [{ op: 'forward', args: [{ op: 'box1' }] }] })), true);
});

test('walkBlocks visits blocks in sockets and bodies', () => {
  const seen = [];
  walkBlocks(
    [{ op: 'repeat', args: [2], body: [{ op: 'forward', args: [{ op: 'box1' }] }] }, { op: 'right', args: [90] }],
    (block) => seen.push(block.op),
  );
  assert.deepEqual(seen, ['repeat', 'forward', 'box1', 'right']);
});

test('box blocks are valid in a project file', () => {
  const data = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'store1', args: [3] }, { op: 'forward', args: [{ op: 'box1' }] }] }] };
  assert.equal(validateProject(data).ok, true);
});

test('the Flow and Math blocks are valid in a project file, with an empty if socket and a plugged one', () => {
  const stack = (condition) => ({ x: 0, y: 0, blocks: [{ op: 'start' }, { op: 'forever', body: [{ op: 'if', args: [condition], body: [{ op: 'stop' }] }, { op: 'wait', args: [5] }] }] });
  for (const condition of [null, { op: 'less', args: [{ op: 'add', args: [1, { op: 'box1' }] }, 5] }]) {
    assert.equal(validateProject({ app: FORMAT_ID, version: 1, stacks: [stack(condition)] }).ok, true);
  }
});

// ---- Sticky notes ----------------------------------------------------------------------------

const noteProject = (text) => ({ app: FORMAT_ID, version: 1, stacks: [{ x: 5, y: 6, blocks: [{ op: 'note', text }] }] });
const noteText = (result) => result.project.stacks[0].blocks[0].text;

test('a note keeps its words through validation', () => {
  const result = validateProject(noteProject('Draws a square.\nThe turtle turns 90 degrees.'));
  assert.equal(result.ok, true);
  assert.equal(noteText(result), 'Draws a square.\nThe turtle turns 90 degrees.');
});

test('a note with no words, or words that are not text, ends up with empty text', () => {
  assert.equal(noteText(validateProject({ ...noteProject(''), })), '');
  assert.equal(noteText(validateProject(noteProject(42))), '');
  assert.equal(noteText(validateProject(noteProject(null))), '');
  const missing = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'note' }] }] };
  assert.equal(noteText(validateProject(missing)), '');
});

test('a note is cut to the length limit, and control characters are removed', () => {
  assert.equal(noteText(validateProject(noteProject('x'.repeat(5000)))).length, 300);
  assert.equal(noteText(validateProject(noteProject('a\u0000b\u0007c\td'))), 'abcd');
  assert.equal(noteText(validateProject(noteProject('line one\nline two'))), 'line one\nline two', 'new lines are kept');
});

test('other blocks never get a text field, even if a file tries to give them one', () => {
  const sneaky = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'clean', text: 'hello' }] }] };
  assert.deepEqual(validateProject(sneaky).project.stacks[0].blocks[0], { op: 'clean' });
});

test('Run ignores a stack that is only a note, and starts elsewhere', () => {
  const note = { x: 0, y: 0, blocks: [{ op: 'note', text: 'hi' }] };
  const program = { x: 0, y: 300, blocks: [{ op: 'forward', args: [10] }] };
  assert.equal(findRunStack({ stacks: [note, program] }).stack, program, 'a note higher up the page does not count');
  assert.deepEqual(findRunStack({ stacks: [note] }), { stack: null, startCount: 0 });
});

// ---- if else in project files -----------------------------------------------------------------------

const ifElseProject = (block) => ({ app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [block] }] });

test('an if else keeps both of its lists through validation', () => {
  const block = { op: 'ifelse', args: [null], body: [{ op: 'forward', args: [1] }], elseBody: [{ op: 'back', args: [1] }] };
  const result = validateProject(ifElseProject(block));
  assert.equal(result.ok, true);
  assert.deepEqual(result.project.stacks[0].blocks[0], block);
});

test('an else list on a block that has no else is quietly dropped', () => {
  const sneaky = { op: 'repeat', args: [2], body: [], elseBody: [{ op: 'forward', args: [1] }] };
  assert.deepEqual(validateProject(ifElseProject(sneaky)).project.stacks[0].blocks[0], { op: 'repeat', args: [2], body: [] });
  const plainIf = { op: 'if', args: [null], elseBody: [{ op: 'forward', args: [1] }] };
  assert.equal('elseBody' in validateProject(ifElseProject(plainIf)).project.stacks[0].blocks[0], false);
});

test('a damaged else list is refused, and unknown blocks inside it are refused too', () => {
  assert.equal(validateProject(ifElseProject({ op: 'ifelse', args: [null], elseBody: 'oops' })).ok, false);
  const result = validateProject(ifElseProject({ op: 'ifelse', args: [null], elseBody: [{ op: 'launchRockets' }] }));
  assert.equal(result.ok, false);
  assert.match(result.error, /launchRockets/);
});

test('blocks inside the else mouth are found by walkBlocks and usesBoxes', () => {
  const block = { op: 'ifelse', args: [null], body: [], elseBody: [{ op: 'store2', args: [3] }] };
  const seen = [];
  walkBlocks([block], (b) => seen.push(b.op));
  assert.deepEqual(seen, ['ifelse', 'store2']);
  assert.equal(usesBoxes({ stacks: [{ x: 0, y: 0, blocks: [block] }] }), true);
});

// ---- Blocks you make yourself in project files ---------------------------------------------------------

const madeProject = (...stacks) => ({ app: FORMAT_ID, version: 1, stacks });
const madeStack = (...blocks) => ({ x: 0, y: 0, blocks });

test('definitions, calls and inputs survive validation exactly', () => {
  const data = madeProject(
    madeStack({ op: 'to', name: 'square', params: ['size'] }, { op: 'forward', args: [{ op: 'input', name: 'size' }] }),
    madeStack({ op: 'start' }, { op: 'call', name: 'square', params: ['size'], args: [60] }),
  );
  const result = validateProject(data);
  assert.equal(result.ok, true);
  assert.deepEqual(result.project.stacks, data.stacks);
});

test('names read from a file are cleaned: odd characters dropped, long names cut, empty ones given a name', () => {
  const result = validateProject(
    madeProject(madeStack({ op: 'to', name: '  <b>Sq uare</b>!! ', params: ['size', 'SIZE', 'x'.repeat(40), '', 7, 'third'] }, { op: 'forward', args: [{ op: 'input', name: '' }] }, { op: 'call', name: 42, params: 'nope' })),
  );
  const [hat, forward, call] = result.project.stacks[0].blocks;
  assert.equal(hat.name, 'bSq uareb', 'tags lose their brackets and slash, not their letters');
  assert.deepEqual(hat.params, ['size', 'x'.repeat(10)], 'two inputs at most, no repeats, none empty');
  assert.equal(forward.args[0].name, 'input');
  assert.deepEqual(call, { op: 'call', name: 'myblock', params: [], args: [] });
});

test('a call has exactly one socket for each input, however the file says it', () => {
  const messy = (args) => validateProject(madeProject(madeStack({ op: 'call', name: 'go', params: ['a', 'b'], args }))).project.stacks[0].blocks[0].args;
  assert.deepEqual(messy([1]), [1, null], 'too few: the rest are empty');
  assert.deepEqual(messy([1, 2, 3, 4]), [1, 2], 'too many: the extras go');
  assert.deepEqual(messy(undefined), [null, null]);
  assert.deepEqual(messy([{ op: 'input', name: 'a' }, 2]), [{ op: 'input', name: 'a' }, 2], 'a block can be plugged in');
});

test('a to block and an input have no sockets, whatever the file says', () => {
  const result = validateProject(madeProject(madeStack({ op: 'to', name: 'a', params: [], args: [1] }, { op: 'forward', args: [{ op: 'input', name: 'q', args: [3] }] })));
  const [hat, forward] = result.project.stacks[0].blocks;
  assert.equal('args' in hat, false);
  assert.equal('args' in forward.args[0], false);
});

test('Run never runs a definition: it runs the Start block, and falls back to loose commands, not to a to block', () => {
  const def = { x: 0, y: 0, blocks: [{ op: 'to', name: 'square', params: [] }, { op: 'forward', args: [10] }] };
  const start = { x: 0, y: 200, blocks: [{ op: 'start' }, { op: 'call', name: 'square', params: [], args: [] }] };
  const loose = { x: 0, y: 100, blocks: [{ op: 'forward', args: [5] }] };
  assert.equal(findRunStack({ stacks: [def, start] }).stack, start, 'a definition higher on the page does not win');
  assert.equal(findRunStack({ stacks: [def, loose] }).stack, loose, 'no Start: the topmost loose commands, not the definition');
  assert.equal(findRunStack({ stacks: [def] }).stack, null, 'only definitions: nothing to run');
  assert.equal(findRunStack({ stacks: [def, start] }).startCount, 1);
});

test('walkBlocks and usesBoxes look inside calls and definitions too', () => {
  const stackWith = madeStack({ op: 'to', name: 'a', params: ['n'] }, { op: 'store1', args: [{ op: 'input', name: 'n' }] });
  const seen = [];
  walkBlocks(stackWith.blocks, (b) => seen.push(b.op));
  assert.deepEqual(seen, ['to', 'store1', 'input']);
  assert.equal(usesBoxes({ stacks: [stackWith] }), true);
});

test('the words on a write block are kept, but only letters that can be drawn, and no more than the most', () => {
  const stacks = (text) => ({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 0, y: 0, blocks: [{ op: 'write', args: [60], text }] }] });
  const textOf = (result) => result.project.stacks[0].blocks[0].text;
  assert.equal(textOf(validateProject(stacks('Go, Cougars!'))), 'Go, Cougars!');
  assert.equal(textOf(validateProject(stacks('tab\there é€'))), 'tabhere ');
  assert.equal(textOf(validateProject(stacks('x'.repeat(100)))).length, 40);
  for (const odd of [undefined, null, 5, { a: 1 }]) assert.equal(textOf(validateProject(stacks(odd))), '', String(odd));
  // Only a write block carries words this way: another block's text is not kept.
  const other = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 0, y: 0, blocks: [{ op: 'forward', args: [10], text: 'sneaky' }] }] });
  assert.equal(other.project.stacks[0].blocks[0].text, undefined);
});
