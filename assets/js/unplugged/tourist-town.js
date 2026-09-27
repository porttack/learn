// Random Tourist Town street maps: corners on a jittered grid joined by
// streets, unweighted. Geometry only -- the "fewest ice cream vans" answer
// is always computed fresh from graphs.js (minDominatingSet), never
// stored, so a frozen worksheet and its hidden answer key can never drift
// apart.
import { buildGridGraph } from "./graphs.js";

export const SIZES = {
  warmup: { label: "Warm-up town", n: 6, cols: 3 },
  small: { label: "Small town", n: 9, cols: 3 },
  big: { label: "Big town", n: 14, cols: 4 },
};

export function generateMap(rng, sizeKey = "small") {
  const { n, cols } = SIZES[sizeKey] || SIZES.small;
  const { nodes, edges, width, height } = buildGridGraph(rng, { n, cols, extraEdgeProb: 0.3 });
  return { nodes, edges, width, height };
}
