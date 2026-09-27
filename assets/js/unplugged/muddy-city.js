// Random Muddy City towns: houses on a jittered grid joined by muddy
// streets, each street labeled with how many paving stones it would take.
// Geometry only -- the "cheapest way to connect every house" answer is
// always computed fresh from graphs.js (kruskalMST), never stored, so a
// frozen worksheet and its hidden answer key can never drift apart.
import { buildGridGraph } from "./graphs.js";

export const SIZES = {
  warmup: { label: "Warm-up town", n: 5, cols: 3 },
  small: { label: "Small town", n: 6, cols: 3 },
  medium: { label: "Medium town", n: 8, cols: 3 },
  big: { label: "Big town", n: 10, cols: 4 },
};

export function generateMap(rng, sizeKey = "medium") {
  const { n, cols } = SIZES[sizeKey] || SIZES.medium;
  const { nodes, edges, width, height } = buildGridGraph(rng, {
    n,
    cols,
    extraEdgeProb: 0.4,
    weightRange: [1, 9],
  });
  return { nodes, edges, width, height };
}
