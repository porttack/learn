// TurtleLab: closing up the empty space between stacks of blocks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// On the page, stacks can be anywhere, with wide empty bands between them. For a printout
// that wastes the paper: the picture is squeezed to fit, and the writing gets tiny. So for
// the PDF the empty bands are narrowed. NOTHING ELSE MOVES: stacks that were side by side stay
// side by side, one above another stays above, and stacks that line up still line up, so the
// picture looks like the screen with the gaps closed. (An earlier version rearranged the
// stacks into neat columns, which made the PDF look nothing like the page.)
//
// It works one direction at a time. Look along the page: wherever no stack covers a stretch
// wider than `gap`, that stretch is cut down to `gap`. A stack sits wholly inside one covered
// stretch, so it moves as one piece. No work for drawing code here: it only uses sizes.

/**
 * For stretches along one direction: how far each start moves back. Returns a function from
 * where something starts to where it starts afterwards, and the total length after squeezing.
 * @param {[number, number][]} intervals [start, end] of everything along this direction
 */
function squeezeAxis(intervals, gap) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  // Merge the stretches that touch or overlap into covered runs.
  const runs = [];
  for (const [start, end] of sorted) {
    const last = runs.at(-1);
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else runs.push({ start, end, shift: 0 });
  }
  // Each run is moved back by everything cut out before it.
  let cut = 0;
  for (let i = 1; i < runs.length; i += 1) {
    const empty = runs[i].start - runs[i - 1].end;
    if (empty > gap) cut += empty - gap;
    runs[i].shift = cut;
  }
  const origin = runs[0].start;
  const mapped = (position) => {
    const run = [...runs].reverse().find((candidate) => candidate.start <= position);
    return position - origin - run.shift;
  };
  const last = runs.at(-1);
  return { mapped, length: last.end - origin - last.shift };
}

/**
 * Close up the wide empty bands between boxes.
 *
 * @param {{id: any, x: number, y: number, width: number, height: number}[]} boxes where each box
 *        sits on the page now, and how big it is
 * @param {object} [options]
 * @param {number} [options.gap] the widest empty band left between boxes
 * @returns {{ places: Map<any, {x: number, y: number}>, width: number, height: number }} the new
 *          top-left corner of every box (the whole thing starts at 0, 0), and how big it is
 */
export function squeezeGaps(boxes, { gap = 40 } = {}) {
  const places = new Map();
  if (boxes.length === 0) return { places, width: 0, height: 0 };
  const across = squeezeAxis(boxes.map((box) => [box.x, box.x + box.width]), gap);
  const down = squeezeAxis(boxes.map((box) => [box.y, box.y + box.height]), gap);
  for (const box of boxes) places.set(box.id, { x: across.mapped(box.x), y: down.mapped(box.y) });
  return { places, width: across.length, height: down.length };
}
