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
