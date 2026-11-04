// TurtleLab: packing stacks of blocks close together.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// On the page, stacks can be anywhere, with lots of empty space between them. For a
// printout that wastes the paper: the picture is squeezed to fit, and the writing
// gets tiny. So for the PDF the stacks are packed into columns with a small gap, in
// the order they sit left to right (and top to bottom), which keeps the story in the
// order the student built it. No drawing code here: it only works with sizes.

/**
 * Pack boxes into columns that fill a space of about this shape.
 *
 * @param {{id: any, x: number, y: number, width: number, height: number}[]} boxes
 *        where each sits on the page now, and how big it is
 * @param {object} [options]
 * @param {number} [options.aspect] the shape to aim for: width divided by height
 * @param {number} [options.gap] the space left between boxes
 * @returns {{ places: Map<any, {x: number, y: number}>, width: number, height: number }}
 *          the new top-left corner of every box (the first column starts at 0, 0)
 *          and how big the whole thing is
 */
export function packInColumns(boxes, { aspect = 1.6, gap = 24 } = {}) {
  const places = new Map();
  if (boxes.length === 0) return { places, width: 0, height: 0 };

  // Left to right, then top to bottom, as they sit on the page now.
  const ordered = [...boxes].sort((a, b) => a.x - b.x || a.y - b.y);
  const area = ordered.reduce((sum, box) => sum + (box.width + gap) * (box.height + gap), 0);
  const tallest = Math.max(...ordered.map((box) => box.height));
  // How tall a column may grow before the next box starts a new one.
  const limit = Math.max(tallest, Math.sqrt(area / aspect));

  let columnX = 0;
  let columnWidth = 0;
  let y = 0;
  let height = 0;
  for (const box of ordered) {
    if (y > 0 && y + box.height > limit) {
      columnX += columnWidth + gap;
      columnWidth = 0;
      y = 0;
    }
    places.set(box.id, { x: columnX, y });
    columnWidth = Math.max(columnWidth, box.width);
    y += box.height + gap;
    height = Math.max(height, y - gap);
  }
  return { places, width: columnX + columnWidth, height };
}

/** How much a picture of this size is scaled to fit a box, never past its own size. Bigger is more readable. */
export function readableScale(width, height, boxWidth, boxHeight) {
  return Math.min(boxWidth / width, boxHeight / height, 1);
}
