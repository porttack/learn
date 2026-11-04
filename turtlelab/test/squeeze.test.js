// Tests for closing up the empty space between stacks, which is how the PDF's picture of the
// blocks keeps the arrangement on the screen while using less paper.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { squeezeGaps } from '../js/core/squeeze.js';

const box = (id, x, y, width, height) => ({ id, x, y, width, height });
const apart = (a, b) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;

function placed(boxes, options) {
  const { places, width, height } = squeezeGaps(boxes, options);
  return { width, height, boxes: boxes.map((b) => ({ ...b, ...places.get(b.id) })) };
}

test('nothing to squeeze is nothing', () => {
  assert.deepEqual(squeezeGaps([]), { places: new Map(), width: 0, height: 0 });
});

test('one box goes to the corner and is the size of the whole', () => {
  const { places, width, height } = squeezeGaps([box('a', 500, 700, 120, 80)]);
  assert.deepEqual(places.get('a'), { x: 0, y: 0 });
  assert.deepEqual([width, height], [120, 80]);
});

test('a page that is already close together is left exactly as it is, apart from starting at the corner', () => {
  const boxes = [box('a', 100, 50, 200, 300), box('b', 330, 50, 150, 100), box('c', 330, 170, 150, 200)];
  const { boxes: after, width, height } = placed(boxes);
  for (const [before, now] of boxes.map((b, i) => [b, after[i]])) {
    assert.deepEqual([now.x, now.y], [before.x - 100, before.y - 50], now.id);
  }
  assert.deepEqual([width, height], [380, 320]);
});

test('a wide empty band is narrowed to the gap, and what lay beyond it moves up to meet it', () => {
  // the way the tree sample is laid out: a block on the left, and the note and program far to the right
  const boxes = [box('block', 90, 16, 330, 490), box('note', 1100, 16, 200, 180), box('program', 1100, 220, 250, 330)];
  const { boxes: after, width } = placed(boxes, { gap: 40 });
  const [block, note, program] = after;
  assert.equal(note.x, block.x + block.width + 40, 'the band between them is now 40');
  assert.equal(program.x, note.x, 'the note and program still line up');
  assert.equal(note.y, 0);
  assert.equal(program.y - (note.y + 180), 220 - (16 + 180), 'and the note is still above the program, the same distance');
  assert.equal(width, 330 + 40 + 250);
});

test('the arrangement is kept: left stays left, above stays above, and what lined up still does', () => {
  const boxes = [
    box('tl', 0, 0, 100, 100), box('tr', 900, 0, 100, 100), box('bl', 0, 700, 100, 100), box('br', 900, 700, 100, 100),
    box('mid', 450, 350, 100, 100),
  ];
  const { boxes: after } = placed(boxes, { gap: 30 });
  const by = Object.fromEntries(after.map((b) => [b.id, b]));
  assert.ok(by.tl.x < by.mid.x && by.mid.x < by.tr.x, 'left to right');
  assert.ok(by.tl.y < by.mid.y && by.mid.y < by.bl.y, 'top to bottom');
  assert.equal(by.tl.x, by.bl.x);
  assert.equal(by.tr.x, by.br.x);
  assert.equal(by.tl.y, by.tr.y);
  assert.equal(by.bl.y, by.br.y);
});

test('boxes that overlap in a direction keep exactly their offset from each other', () => {
  const boxes = [box('a', 0, 0, 100, 400), box('b', 60, 150, 100, 100), box('far', 2000, 0, 50, 50)];
  const { boxes: after } = placed(boxes, { gap: 20 });
  const [a, b] = after;
  assert.deepEqual([b.x - a.x, b.y - a.y], [60, 150]);
});

test('squeezing never makes boxes touch or overlap that did not before', () => {
  let seed = 7;
  const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let round = 0; round < 40; round += 1) {
    const boxes = [];
    for (let i = 0; i < 10; i += 1) {
      const candidate = box(i, Math.floor(random() * 2500), Math.floor(random() * 1800), 40 + Math.floor(random() * 250), 30 + Math.floor(random() * 300));
      if (boxes.every((other) => apart(candidate, other))) boxes.push(candidate);
    }
    const { boxes: after, width, height } = placed(boxes, { gap: 36 });
    for (const p of after) for (const q of after) if (p !== q) assert.ok(apart(p, q), `round ${round}: ${p.id} and ${q.id}`);
    assert.ok(after.every((b) => b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height), 'everything is inside the whole');
  }
});

test('squeezing only ever makes things smaller, and a smaller gap makes them smaller still', () => {
  const boxes = [box('a', 0, 0, 100, 100), box('b', 800, 0, 100, 100), box('c', 0, 900, 100, 100)];
  const wide = squeezeGaps(boxes, { gap: 200 });
  const narrow = squeezeGaps(boxes, { gap: 20 });
  assert.ok(narrow.width < wide.width && wide.width < 900);
  assert.ok(narrow.height < wide.height && wide.height < 1000);
});
