// TurtleLab: turning a drawing into stitches for an embroidery machine.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A machine cannot draw a line. It pokes a needle through the cloth at a list of spots, and the
// thread lies between them. So a line the turtle drew has to become a row of stitches, a
// "running stitch", each about 3 millimeters long. This file does that, and also decides
//   * how big the design is (the drawing is scaled so its longer side is `sizeMm`),
//   * which spots are needed (a corner needs a stitch exactly on it; a long straight run does not
//     need a stitch every fraction of a millimeter),
//   * where the needle has to hop between separate lines (a jump, with the thread cut if it is far),
//   * and the order of the threads (all the stitches of one color together, so there is one thread
//     change for each color instead of one every time the turtle changes pen).
//
// Only what the turtle drew with the pen is stitched. A filled shape is stitched round its edge
// only, because covering an area takes a different kind of stitch. The pen's thickness is ignored.
//
// The result is a plan for embroidery.js: { name, threads, commands, ... } with positions in
// tenths of a millimeter, y UP, measured from the middle of the design.

const TENTH = 10; // tenths of a millimeter in a millimeter

export const DEFAULTS = Object.freeze({
  sizeMm: 90, // the longer side of the design: fits a 4 inch (100 mm) hoop with room to spare
  stitchMm: 3, // the longest stitch
  minStitchMm: 0.4, // stitches shorter than this just bunch up the thread
  toleranceMm: 0.15, // how far a straight stitch may cut across a curve
  trimMm: 3, // a hop longer than this gets the thread cut first
  arcStepDegrees: 3, // how finely a curve is followed before it is simplified
});

/** The ops since the last clear (a clear wipes everything before it). Fill screen is not stitched. */
export function opsSinceClear(ops) {
  let start = 0;
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    if (ops[i].type === 'clear') {
      start = i + 1;
      break;
    }
  }
  return ops.slice(start);
}

/** The points of a pen-down line or arc, in the turtle's own units, from where it began to where it ended. */
export function pointsOfOp(op, stepDegrees = DEFAULTS.arcStepDegrees) {
  if (op.type === 'line') return [[op.x1, op.y1], [op.x2, op.y2]];
  const steps = Math.max(2, Math.ceil(Math.abs(op.sweep) / stepDegrees));
  const start = Math.atan2(op.y1 - op.cy, op.x1 - op.cx);
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = start - ((op.sweep * Math.PI) / 180) * (i / steps);
    points.push([op.cx + op.r * Math.cos(angle), op.cy + op.r * Math.sin(angle)]);
  }
  // End exactly where the turtle ended, not where the arithmetic says.
  points[0] = [op.x1, op.y1];
  points[points.length - 1] = [op.x2, op.y2];
  return points;
}

const sameColor = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * The turtle's pen-down lines and arcs as paths: runs of points in one color, where each line starts
 * where the one before it ended. A line that starts somewhere else begins a new path.
 */
export function pathsOfOps(ops, stepDegrees = DEFAULTS.arcStepDegrees) {
  const paths = [];
  let current = null;
  let skippedFills = 0;
  for (const op of opsSinceClear(ops)) {
    if (op.type === 'fill') skippedFills += 1;
    if (op.type !== 'line' && op.type !== 'arc') continue;
    if (!(op.size > 0)) continue; // a pen of size 0 leaves no mark, so no thread either
    const points = pointsOfOp(op, stepDegrees);
    if (!points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) continue;
    const color = op.color.map((c) => Math.round(c));
    const end = current ? current.points[current.points.length - 1] : null;
    if (current && sameColor(current.color, color) && distance(end, points[0]) < 1e-6) {
      current.points.push(...points.slice(1));
    } else {
      current = { color, points };
      paths.push(current);
    }
  }
  return { paths, skippedFills };
}

/** Douglas-Peucker: drop the points a straight line already passes within `tolerance` of. */
export function simplify(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [from, to] = stack.pop();
    let worst = -1;
    let worstDistance = tolerance;
    const [ax, ay] = points[from];
    const [bx, by] = points[to];
    const length = Math.hypot(bx - ax, by - ay);
    for (let i = from + 1; i < to; i += 1) {
      const [px, py] = points[i];
      // How far this point is from the straight line (or from its end if the ends are one place).
      const d = length === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
      if (d > worstDistance) {
        worstDistance = d;
        worst = i;
      }
    }
    if (worst !== -1) {
      keep[worst] = true;
      stack.push([from, worst], [worst, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Cut every step longer than `longest` into equal pieces. */
function subdivide(points, longest) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const pieces = Math.max(1, Math.ceil(distance(points[i - 1], points[i]) / longest));
    for (let k = 1; k <= pieces; k += 1) out.push([ax + ((bx - ax) * k) / pieces, ay + ((by - ay) * k) / pieces]);
  }
  return out;
}

/**
 * Drop points that are closer than `shortest` to the last one kept. The last point is always kept:
 * a run has to end where the line ended.
 */
function dropCrowded(points, shortest) {
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    if (distance(points[i], out[out.length - 1]) >= shortest) out.push(points[i]);
  }
  const last = points[points.length - 1];
  if (out.length > 1 && distance(last, out[out.length - 1]) < shortest) out[out.length - 1] = last;
  else out.push(last);
  return out;
}

/**
 * The stitches for a drawing, or null if nothing was drawn with the pen.
 *
 * @param {object[]} ops the turtle's drawing ops
 * @param {object} [options] see DEFAULTS, and `name`
 * @returns {null | {
 *   name: string, threads: number[][], commands: {cmd: string, x: number, y: number}[],
 *   widthMm: number, heightMm: number, stitches: number, jumps: number, trims: number,
 *   skippedFills: number
 * }}
 */
export function planStitches(ops, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const { paths, skippedFills } = pathsOfOps(ops, settings.arcStepDegrees);
  if (paths.length === 0) return null;

  // The size: the longer side of everything the pen visited becomes sizeMm.
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const { points } of paths) {
    for (const [x, y] of points) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  const longest = Math.max(maxX - minX, maxY - minY);
  if (!(longest > 0)) return null; // only dots
  const scale = (settings.sizeMm * TENTH) / longest; // tenths of a millimeter for each turtle unit
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Each path as stitch spots in tenths of a millimeter, centered on the middle of the design.
  const stitchPaths = [];
  for (const path of paths) {
    const scaled = path.points.map(([x, y]) => [(x - cx) * scale, (y - cy) * scale]);
    let spots = simplify(scaled, settings.toleranceMm * TENTH);
    spots = subdivide(spots, settings.stitchMm * TENTH);
    spots = dropCrowded(spots, settings.minStitchMm * TENTH).map(([x, y]) => [Math.round(x) || 0, Math.round(y) || 0]); // (|| 0: no negative zero)
    // Rounding can make neighbors the same spot; a spot is only worth stitching once in a row.
    spots = spots.filter((spot, i) => i === 0 || spot[0] !== spots[i - 1][0] || spot[1] !== spots[i - 1][1]);
    if (spots.length >= 2) stitchPaths.push({ color: path.color, spots });
  }
  if (stitchPaths.length === 0) return null;

  // One thread for each color, in the order the colors first appear.
  const threads = [];
  for (const { color } of stitchPaths) {
    if (!threads.some((t) => sameColor(t, color))) threads.push(color);
  }

  const commands = [];
  let at = [0, 0];
  let jumps = 0;
  let trims = 0;
  let stitches = 0;
  threads.forEach((thread, threadIndex) => {
    if (threadIndex > 0) commands.push({ cmd: 'color', x: at[0], y: at[1] });
    let firstOfThread = true;
    for (const path of stitchPaths.filter((p) => sameColor(p.color, thread))) {
      const [sx, sy] = path.spots[0];
      const hop = distance(at, [sx, sy]);
      if (hop > 0) {
        // A color change already cuts the thread, so only cut it for a long hop within one color.
        if (hop >= settings.trimMm * TENTH && !firstOfThread && commands.length > 0) {
          commands.push({ cmd: 'trim', x: at[0], y: at[1] });
          trims += 1;
        }
        commands.push({ cmd: 'jump', x: sx, y: sy });
        jumps += 1;
      }
      firstOfThread = false;
      for (const [x, y] of path.spots) {
        commands.push({ cmd: 'stitch', x, y });
        stitches += 1;
      }
      at = path.spots[path.spots.length - 1];
    }
  });
  commands.push({ cmd: 'end', x: at[0], y: at[1] });

  return {
    name: options.name ?? 'TurtleLab',
    threads,
    commands,
    widthMm: Math.round(((maxX - minX) * scale) / TENTH * 10) / 10,
    heightMm: Math.round(((maxY - minY) * scale) / TENTH * 10) / 10,
    stitches,
    jumps,
    trims,
    skippedFills,
  };
}
