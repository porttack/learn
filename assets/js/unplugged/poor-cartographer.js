// Random country maps for the Poor Cartographer: rectangular countries
// built by recursive guillotine cuts (graphs.js's subdivideRect), kept only
// if the minimum number of colors it needs matches the requested target.
// Geometry only -- the coloring itself is always computed fresh from
// graphs.js (minColoring), never stored, so a frozen worksheet and its
// hidden answer key can never drift apart.
import { subdivideRect, rectAdjacencyEdges, minColoring } from "./graphs.js";

export const TARGETS = {
  2: { label: "Needs 2 colors", count: 4, w: 260, h: 190 },
  3: { label: "Needs 3 colors", count: 6, w: 320, h: 220 },
  4: { label: "Needs 4 colors", count: 8, w: 380, h: 260 },
};

export function generateMap(rng, target = 3, attempts = 150) {
  const size = TARGETS[target] || TARGETS[3];
  let best = null;
  for (let i = 0; i < attempts; i++) {
    const rects = subdivideRect(rng.fork(i + 1), { x: 0, y: 0, w: size.w, h: size.h }, size.count, 40);
    if (rects.length < size.count) continue;
    const edges = rectAdjacencyEdges(rects);
    const { k } = minColoring(rects.length, edges);
    if (k === Number(target)) return { rects };
    if (!best || Math.abs(k - target) < Math.abs(best.k - target)) best = { rects, k };
  }
  return { rects: best.rects };
}
