// Tests for packing stacks of blocks close together for the PDF.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { packInColumns, readableScale } from '../js/core/pack.js';

const box = (id, x, y, width, height) => ({ id, x, y, width, height });
const overlap = (a, b, places) => {
  const [p, q] = [places.get(a.id), places.get(b.id)];
  return p.x < q.x + b.width && q.x < p.x + a.width && p.y < q.y + b.height && q.y < p.y + a.height;
};

test('nothing to pack is nothing', () => {
  assert.deepEqual(packInColumns([]), { places: new Map(), width: 0, height: 0 });
});

test('one box goes to the corner, and is the size of the whole', () => {
  const { places, width, height } = packInColumns([box('a', 500, 700, 120, 80)]);
  assert.deepEqual(places.get('a'), { x: 0, y: 0 });
  assert.deepEqual([width, height], [120, 80]);
});

test('boxes that are far apart on the page end up close together', () => {
  const boxes = [box('left', 90, 16, 330, 490), box('note', 1100, 16, 200, 180), box('program', 1100, 220, 250, 330)];
  const { width, height } = packInColumns(boxes, { aspect: 540 / 337 });
  assert.ok(width < 1000, `was about 1300 wide, now ${width}`);
  assert.ok(height <= 560);
  const before = readableScale(1260, 534, 540, 337);
  assert.ok(readableScale(width, height, 540, 337) > before * 1.3, 'the writing comes out at least a third bigger');
});

test('no two boxes overlap, and every box is placed', () => {
  const boxes = [];
  for (let i = 0; i < 12; i += 1) boxes.push(box(i, (i * 137) % 900, (i * 71) % 700, 100 + ((i * 29) % 150), 50 + ((i * 53) % 200)));
  const { places } = packInColumns(boxes, { gap: 10 });
  assert.equal(places.size, boxes.length);
  for (const a of boxes) for (const b of boxes) if (a !== b) assert.equal(overlap(a, b, places), false, `${a.id} and ${b.id}`);
});

test('the gap is kept between boxes, down a column and across columns', () => {
  const boxes = [box('a', 0, 0, 100, 100), box('b', 0, 200, 100, 100), box('c', 300, 0, 60, 60)];
  const { places } = packInColumns(boxes, { aspect: 3, gap: 20 });
  const a = places.get('a');
  const b = places.get('b');
  if (a.x === b.x) assert.ok(b.y - (a.y + 100) >= 20, 'one above the other');
  else assert.ok(Math.abs(b.x - a.x) >= 120, 'side by side');
});

test('the order stays the one on the page: left to right, and top to bottom within a column', () => {
  const boxes = [box('right', 900, 0, 100, 100), box('lower', 0, 500, 100, 100), box('upper', 0, 0, 100, 100)];
  const { places } = packInColumns(boxes, { aspect: 5 });
  const upper = places.get('upper');
  const lower = places.get('lower');
  const right = places.get('right');
  assert.ok(upper.x <= right.x && lower.x <= right.x, 'what was on the left stays to the left');
  if (upper.x === lower.x) assert.ok(upper.y < lower.y, 'and above stays above');
});

test('a box taller than the limit still goes in, alone in its column', () => {
  const { places, height } = packInColumns([box('tall', 0, 0, 100, 900), box('short', 200, 0, 100, 50)], { aspect: 5 });
  assert.equal(places.get('tall').y, 0);
  assert.equal(height, 900);
});

test('readableScale is how much a picture shrinks to fit, and never grows', () => {
  assert.equal(readableScale(1000, 500, 500, 500), 0.5);
  assert.equal(readableScale(100, 100, 500, 500), 1);
});
