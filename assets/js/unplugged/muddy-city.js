// Random Muddy City towns: houses on a jittered grid joined by muddy
// streets, each street labeled with how many paving stones it would take.
// Geometry only -- the "cheapest way to connect every house" answer is
// always computed fresh from graphs.js (kruskalMST), never stored, so a
// frozen worksheet and its hidden answer key can never drift apart.
import { buildGridGraph } from "./graphs.js";

// "stones" (default for small/medium towns): each road draws as a row of
// stepping stones, one per paving stone -- so costs stay small (1-6) and
// countable. "numbers" (default for big towns, or picked by hand for older
// students): the classic number-in-a-box on each road, which reads fine
// even for the bigger costs a ten-house town can roll.
//
// `minExtraEdges` guarantees every town has real choices: a bare spanning
// tree (n - 1 roads) leaves nothing to decide, so each size asks for
// several roads beyond that -- more for a bigger town -- so a best answer
// always has to leave some out. See buildGridGraph in graphs.js.
export const SIZES = {
  warmup: { label: "Warm-up town", n: 5, cols: 3, defaultRoadStyle: "stones", minExtraEdges: 3 },
  small: { label: "Small town", n: 6, cols: 3, defaultRoadStyle: "stones", minExtraEdges: 4 },
  medium: { label: "Medium town", n: 8, cols: 3, defaultRoadStyle: "stones", minExtraEdges: 6 },
  big: { label: "Big town", n: 10, cols: 4, defaultRoadStyle: "numbers", minExtraEdges: 8 },
};

// Houses sit this far apart (before jitter) on the grid. Stepping stones
// need real room between two houses to show a gap and never touch --
// bigger than the old 96 so a road's stones stay countable even at the
// full count of 6.
const SPACING = 150;

export function generateMap(rng, sizeKey = "medium", roadStyle) {
  const size = SIZES[sizeKey] || SIZES.medium;
  const style = roadStyle || size.defaultRoadStyle;
  const weightRange = style === "stones" ? [1, 6] : [1, 9];
  const { nodes, edges, width, height } = buildGridGraph(rng, {
    n: size.n,
    cols: size.cols,
    extraEdgeProb: 0.4,
    weightRange,
    spacing: SPACING,
    minExtraEdges: size.minExtraEdges,
  });
  return { nodes, edges, width, height, stones: style === "stones" };
}
