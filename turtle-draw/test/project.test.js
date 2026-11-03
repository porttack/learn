// Tests for project validation and finding the main stack.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  emptyProject,
  validateProject,
  findMainStack,
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

test('the main stack is the topmost one that starts with clean or fill screen', () => {
  const stack = (x, y, op) => ({ x, y, blocks: [{ op }] });
  const lower = stack(0, 200, 'clean');
  const top = stack(300, 50, 'fillscreen');
  const project = { stacks: [lower, stack(0, 10, 'forward'), top] };
  assert.equal(findMainStack(project), top);
});

test('when two main stacks are level, the leftmost wins', () => {
  const left = { x: 10, y: 50, blocks: [{ op: 'clean' }] };
  const right = { x: 90, y: 50, blocks: [{ op: 'clean' }] };
  assert.equal(findMainStack({ stacks: [right, left] }), left);
});

test('no main stack when nothing starts with clean or fill screen', () => {
  assert.equal(findMainStack({ stacks: [] }), null);
  assert.equal(findMainStack({ stacks: [{ x: 0, y: 0, blocks: [{ op: 'forward' }] }] }), null);
});
