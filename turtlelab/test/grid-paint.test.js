// Tests for js/ui/grid-paint.js: that each kind of grid draws what it should. The canvas is a stand-in that notes what it is asked to
// draw, so no browser is needed (a real one is used in dev/editor-checks.mjs and view-checks.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paintGrid, rayInside, gridColors } from '../js/ui/grid-paint.js';
import { GRID_TYPES } from '../js/core/grid.js';

/** A canvas that records the text, the lines, the circles and the dots drawn on it, and the colors used. */
function recorder() {
  const log = { text: [], lines: 0, arcs: [], fills: 0, strokes: [], fillStyles: [] };
  const state = { font: '', lineWidth: 1, strokeStyle: '', fillStyle: '' };
  const ctx = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        if (key === 'fillText') { log.text.push({ text: args[0], x: args[1], y: args[2] }); log.fillStyles.push(target.fillStyle); }
        else if (key === 'lineTo') log.lines += 1;
        else if (key === 'arc') log.arcs.push(args);
        else if (key === 'fill') log.fills += 1;
        else if (key === 'stroke') log.strokes.push(target.strokeStyle);
        else if (key === 'measureText') return { width: String(args[0]).length * 8 };
        return undefined;
      };
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  return { ctx, log };
}

const view = { zoom: 1, cx: 0, cy: 0 };
const point = (x, y) => ({ x: (350 + x) * 2, y: (280 - y) * 2 }); // the paper's own 1400 by 1120 canvas
const paint = (type, extra = {}) => {
  const { ctx, log } = recorder();
  paintGrid(ctx, 1400, 1120, { type, view, point, size: 24, ...extra });
  return log;
};

test('every kind of grid draws something, and does not fail', () => {
  for (const { id } of GRID_TYPES) {
    const log = paint(id);
    assert.ok(log.lines + log.arcs.length > 10, `${id} draws lines, rings or dots`);
  }
});

test('squares with numbers write the x and y numbers and the axis names; squares do not write anything', () => {
  const numbers = paint('numbers').text.map((t) => t.text);
  for (const wanted of ['0', '50', '-50', '100', 'x', 'y']) assert.ok(numbers.includes(wanted), wanted);
  assert.deepEqual(paint('squares').text, []);
  assert.deepEqual(paint('dots').text, []);
});

test('dots draw a dot at every crossing, and bigger ones on the axes', () => {
  const log = paint('dots');
  assert.equal(log.arcs.length, 15 * 11, 'the 15 by 11 crossings of the lines 50 apart');
  const radii = log.arcs.map((a) => a[2]);
  assert.ok(Math.max(...radii) > Math.min(...radii), 'the axes are marked');
  assert.equal(radii.filter((r) => r === Math.max(...radii)).length, 15 + 11 - 1, 'a row and a column of them, sharing the middle');
});

test('circles and angles draw the rings around the middle, and write the headings round the edge and the distances up the 0 heading', () => {
  const log = paint('polar');
  assert.equal(log.arcs.length, 8, 'eight rings');
  for (const arc of log.arcs) {
    assert.equal(arc[0], 700, 'around the middle of the paper');
    assert.equal(arc[1], 560);
  }
  assert.deepEqual(log.arcs.map((a) => a[2]), [100, 200, 300, 400, 500, 600, 700, 800], 'ring radii in canvas pixels: 50 turtle steps are 100 of them');
  const words = log.text.map((t) => t.text);
  for (const heading of [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]) assert.ok(words.includes(`${heading}\u00b0`), `${heading} degrees is written`);
  for (const distance of ['50', '100', '150', '200']) assert.ok(words.includes(distance), `the ring at ${distance} is numbered`);
  // Each heading is inside the canvas, on its own spoke: 90 is to the right of the middle, 270 to the left, 0 above, 180 below.
  const at = (heading) => log.text.find((t) => t.text === `${heading}\u00b0`);
  assert.ok(at(90).x > 700 && Math.abs(at(90).y - 560) < 20);
  assert.ok(at(270).x < 700 && Math.abs(at(270).y - 560) < 20);
  assert.ok(at(0).y < 560 && Math.abs(at(0).x - 700) < 1);
  assert.ok(at(180).y > 560 && Math.abs(at(180).x - 700) < 1);
  for (const t of log.text) assert.ok(t.x > 0 && t.x < 1400 && t.y > 0 && t.y < 1120, `${t.text} is on the paper`);
});

test('the ring numbers keep out of the way of the 0 at the top', () => {
  const log = paint('polar');
  const top = log.text.find((t) => t.text === '0\u00b0');
  for (const t of log.text.filter((x) => /^\d+$/.test(x.text))) assert.ok(Math.abs(t.y - top.y) >= 24 * 1.5 - 1e-9, `${t.text} is clear of the 0`);
});

test('a dark paper gets light lines and light numbers, the PDF gets heavy dark ones, and plain paper the faint dark ones', () => {
  const light = gridColors();
  const dark = gridColors({ dark: true });
  const strong = gridColors({ strong: true });
  assert.match(light.line, /rgba\(0, 0, 0/);
  assert.match(dark.line, /rgba\(255, 255, 255/);
  assert.match(strong.line, /rgba\(0, 0, 0/);
  assert.notEqual(light.line, strong.line);
  assert.equal(gridColors({ strong: true, dark: true }).line, strong.line, 'the PDF is on white even if the screen is on a blackboard');
  const darkLog = paint('numbers', { dark: true });
  assert.ok(darkLog.fillStyles.every((c) => c === dark.text), 'the numbers are light');
  assert.ok(darkLog.strokes.every((c) => /255, 255, 255|0, 0, 0/.test(c)), 'and so are the lines (the halos are dark)');
});

test('a ray from the middle: where it is inside the canvas, even from outside it, and never when it misses', () => {
  assert.deepEqual(rayInside({ x: 700, y: 560 }, { x: 0, y: -1 }, 1400, 1120), [0, 560]);
  assert.deepEqual(rayInside({ x: 700, y: 560 }, { x: 1, y: 0 }, 1400, 1120), [0, 700]);
  const aside = rayInside({ x: -300, y: 560 }, { x: 1, y: 0 }, 1400, 1120);
  assert.deepEqual(aside, [300, 1700], 'a middle off the left edge: the ray is only inside from the edge on');
  assert.equal(rayInside({ x: -300, y: 560 }, { x: -1, y: 0 }, 1400, 1120), null, 'pointing away');
  assert.equal(rayInside({ x: -300, y: 560 }, { x: 0, y: -1 }, 1400, 1120), null, 'straight up from outside the canvas');
});

// ---- Hand drawn papers: the grid bends with the drawing ---------------------------------------------------------

test('with a warp, the grid lines are made of short pieces whose points all went through the warp, and the numbers stay straight', () => {
  const plain = paint('numbers');
  const seen = [];
  const warp = (x, y) => { seen.push([x, y]); return { x: x + 3, y: y - 2 }; };
  const bent = paint('numbers', { warp });
  assert.ok(bent.lines > plain.lines * 5, `many more pieces: ${bent.lines} against ${plain.lines}`);
  assert.ok(seen.length >= bent.lines, 'every point of a line was warped');
  assert.deepEqual(bent.text, plain.text, 'the numbers are in the same places: not warped');
});

test('a warp that does nothing draws the same grid, line for line, and the rings and the dots go through it too', () => {
  const identity = (x, y) => ({ x, y });
  for (const type of ['numbers', 'squares', 'dots', 'polar']) {
    const plain = paint(type);
    const warped = paint(type, { warp: identity });
    assert.deepEqual(warped.text, plain.text, type);
    assert.equal(warped.strokes.length, plain.strokes.length, `${type}: the same number of lines to stroke`);
  }
  let rings = 0;
  paint('polar', { warp: (x, y) => { rings += 1; return { x, y }; } });
  assert.ok(rings > 100, 'rings and spokes are walked round');
  const dotsAt = [];
  paint('dots', { warp: (x, y) => { dotsAt.push([x, y]); return { x, y }; } });
  assert.equal(dotsAt.length, 15 * 11, 'each dot is moved');
});
