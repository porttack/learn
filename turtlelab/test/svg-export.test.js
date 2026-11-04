// Tests for js/core/svg-export.js: a drawing as an SVG. (dev/export-checks.mjs also lays the SVG over the
// picture the screen paints, in real Chrome, and compares them.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Turtle } from '../js/core/turtle.js';
import { opsToSvg } from '../js/core/svg-export.js';

function draw(program) {
  const t = new Turtle();
  t.clean();
  program(t);
  return t.ops;
}
const square = (t, size = 100) => {
  for (let i = 0; i < 4; i += 1) {
    t.forward(size);
    t.right(90);
  }
};
const count = (text, pattern) => (text.match(pattern) ?? []).length;

test('nothing drawn gives no SVG, in either kind', () => {
  assert.equal(opsToSvg([]), null);
  assert.equal(opsToSvg(draw(() => {})), null);
  assert.equal(opsToSvg(draw((t) => { t.setPenUp(); t.forward(50); })), null);
  assert.equal(opsToSvg(draw(() => {}), { mode: 'cut' }), null);
});

test('a square is one shape (one path with four lines), in the pen color and thickness', () => {
  const { svg, count: shapes } = opsToSvg(draw((t) => { t.setColor(10, 20, 30); t.setPenSize(8); square(t); }));
  assert.equal(shapes, 1);
  assert.equal(count(svg, /<path /g), 1);
  assert.match(svg, /stroke="rgb\(10, 20, 30\)"/);
  assert.match(svg, /stroke-width="8"/);
  assert.equal(count(svg, / L /g), 4, 'four lines, one after the other, in the one path');
  assert.equal(count(svg, / M /g) + count(svg, /d="M /g), 1, 'and only one move to a start');
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.trimEnd().endsWith('</svg>'));
  assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
});

test('the page is turned over: up on the turtle\'s paper is up in the picture', () => {
  const { svg } = opsToSvg(draw((t) => { t.forward(100); }), { box: { minX: -50, maxX: 50, minY: -50, maxY: 150 } });
  // The turtle goes from (0, 0) up to (0, 100); an SVG counts y downwards, so that is 0 to -100.
  assert.match(svg, /M 0 0 L 0 -100/);
  assert.match(svg, /viewBox="-50 -150 100 200"/);
});

test('lines of different colors or thicknesses are separate paths, and a gap in the line starts a new one', () => {
  const ops = draw((t) => {
    t.setColor(255, 0, 0); t.forward(50);
    t.setColor(0, 0, 255); t.forward(50);
    t.setPenUp(); t.forward(20); t.setPenDown();
    t.forward(20);
  });
  assert.equal(opsToSvg(ops).count, 3);
});

test('an arc uses a real SVG arc with the right direction and size flags', () => {
  const right = opsToSvg(draw((t) => t.arc(90, 50))).svg;
  const left = opsToSvg(draw((t) => t.arc(-90, 50))).svg;
  const big = opsToSvg(draw((t) => t.arc(270, 50))).svg;
  assert.match(right, /A 50 50 0 0 1 /, 'curving right: small arc, clockwise');
  assert.match(left, /A 50 50 0 0 0 /, 'curving left: small arc, anticlockwise');
  assert.match(big, /A 50 50 0 1 1 /, 'more than half way round: the large arc flag');
});

test('a whole circle is written as two halves, because one arc cannot end where it began', () => {
  const { svg } = opsToSvg(draw((t) => t.arc(360, 40)));
  assert.equal(count(svg, / A /g), 2);
  assert.match(svg, /A 40 40 0 0 1 /);
  // The first half ends on the opposite side of the circle: the turtle starts at (0, 0) facing up, so the center is (40, 0).
  assert.match(svg, /A 40 40 0 0 1 80 0 A 40 40 0 0 1 0 0/);
});

test('a filled shape is a fill and then its edge again on top, like the screen', () => {
  const { svg } = opsToSvg(draw((t) => { t.setColor(255, 200, 0); t.startFill(); square(t); t.endFill(); }));
  const paths = svg.split('\n').filter((line) => line.startsWith('<path'));
  const fillAt = paths.findIndex((line) => line.includes('fill="rgb(255, 200, 0)"'));
  assert.ok(fillAt >= 0, 'there is a filled path');
  assert.ok(paths[fillAt].includes(' Z"'), 'it is closed');
  assert.ok(paths.slice(fillAt + 1).some((line) => line.includes('stroke="rgb(255, 200, 0)"')), 'the outline is drawn after it');
});

test('fill screen colors the paper, and what was drawn before it is gone', () => {
  const ops = draw((t) => { t.forward(300); t.fillScreen(10, 20, 30); t.setColor(255, 255, 255); t.arc(180, 30); });
  const { svg } = opsToSvg(ops);
  assert.match(svg, /<rect [^>]*fill="rgb\(10, 20, 30\)"/);
  assert.equal(count(svg, / L /g), 0, 'the 300 unit line was covered up, so it is not in the picture');
  assert.equal(count(svg, / A /g), 1);
});

test('everything that was drawn is in the picture, even far off the paper, and the page is sized to it', () => {
  const { svg, width, height } = opsToSvg(draw((t) => { t.setPenSize(2); t.setXY(2000, 0); t.setXY(2000, 1000); }));
  const view = svg.match(/viewBox="([-\d. ]+)"/)[1].split(' ').map(Number);
  assert.ok(view[0] <= 0 && view[0] + view[2] >= 2000, 'it spans x from 0 to 2000');
  assert.ok(Math.max(width, height) === 800 || Math.abs(Math.max(width, height) - 800) < 1e-9, 'the larger side is 800');
});

test('the cutter version is hairlines in red, in inches, with one path for lines that join, and no fills or colors', () => {
  const ops = draw((t) => {
    t.setColor(0, 255, 0); t.setPenSize(30);
    t.startFill(); square(t, 100); t.endFill();
    t.fillScreen(1, 2, 3);
    t.setPenUp(); t.setXY(300, 300); t.setPenDown(); t.arc(360, 20);
  });
  const result = opsToSvg(ops, { mode: 'cut' });
  const { svg } = result;
  assert.match(svg, /stroke="#ff0000"/);
  assert.match(svg, /stroke-width="0.1"/);
  assert.doesNotMatch(svg, /rgb\(/);
  assert.doesNotMatch(svg, /fill="[^n]/, 'no fill anywhere');
  assert.equal(result.count, 2, 'the square is one path, the circle another');
  // 100 steps are an inch. The drawing runs from x = 0 to 340 and y = 0 to 320 (the circle), plus 5 steps all round.
  assert.match(svg, /width="3\.5in" height="3\.3in"/);
  assert.match(svg, /viewBox="-5 -325 350 330"/);
});

test('the same drawing always gives exactly the same SVG', () => {
  const ops = draw((t) => { t.setColor(9, 9, 9); t.arc(200, 70); t.startFill(); square(t, 33); t.endFill(); });
  assert.equal(opsToSvg(ops).svg, opsToSvg(ops).svg);
  assert.equal(opsToSvg(ops, { mode: 'cut' }).svg, opsToSvg(ops, { mode: 'cut' }).svg);
});
