// Freezes generated graph-activity maps into YAML for a fixed worksheet, so
// a later change to the random generators can never alter a sheet that's
// already been printed. Only geometry is frozen (node positions, streets,
// rectangles) -- every "correct answer" (cheapest streets, fewest colors,
// fewest vans) is always recomputed from that geometry by graphs.js, in the
// browser and in tools/check_graphs.mjs, so it can never go stale.
//
//   node tools/freeze_graphs.mjs muddy-city <seed> <sizeKey> <label>
//   node tools/freeze_graphs.mjs poor-cartographer <seed> <target> <label>
//   node tools/freeze_graphs.mjs tourist-town <seed> <sizeKey> <label>
//
// Review the printed YAML, then paste it into (or build up) the matching
// _data/unplugged/*.yml file. Run tools/check_graphs.mjs afterward.
import { makeRng } from "../assets/js/unplugged/rng.js";
import * as muddyCity from "../assets/js/unplugged/muddy-city.js";
import * as poorCartographer from "../assets/js/unplugged/poor-cartographer.js";
import * as touristTown from "../assets/js/unplugged/tourist-town.js";

const [activity, seedArg, opt, ...labelParts] = process.argv.slice(2);
const seed = Number(seedArg);
const label = labelParts.join(" ") || null;

function nodesYaml(nodes, ind) {
  return nodes.map((n) => `${ind}- { x: ${n.x}, y: ${n.y} }`).join("\n");
}
function edgesYaml(edges, ind, weighted) {
  return edges
    .map((e) => (weighted ? `${ind}- { a: ${e.a}, b: ${e.b}, w: ${e.w} }` : `${ind}- { a: ${e.a}, b: ${e.b} }`))
    .join("\n");
}
function rectsYaml(rects, ind) {
  return rects.map((r) => `${ind}- { x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h} }`).join("\n");
}

let out;
if (activity === "muddy-city") {
  const map = muddyCity.generateMap(makeRng(seed), opt);
  out = [
    `- label: ${JSON.stringify(label || muddyCity.SIZES[opt]?.label || opt)}`,
    `  width: ${map.width}`,
    `  height: ${map.height}`,
    `  nodes:`,
    nodesYaml(map.nodes, "    "),
    `  edges:`,
    edgesYaml(map.edges, "    ", true),
  ].join("\n");
} else if (activity === "tourist-town") {
  const map = touristTown.generateMap(makeRng(seed), opt);
  out = [
    `- label: ${JSON.stringify(label || touristTown.SIZES[opt]?.label || opt)}`,
    `  width: ${map.width}`,
    `  height: ${map.height}`,
    `  nodes:`,
    nodesYaml(map.nodes, "    "),
    `  edges:`,
    edgesYaml(map.edges, "    ", false),
  ].join("\n");
} else if (activity === "poor-cartographer") {
  const map = poorCartographer.generateMap(makeRng(seed), Number(opt));
  out = [
    `- label: ${JSON.stringify(label || poorCartographer.TARGETS[opt]?.label || opt)}`,
    `  rects:`,
    rectsYaml(map.rects, "    "),
  ].join("\n");
} else {
  console.error("Usage: node tools/freeze_graphs.mjs <muddy-city|poor-cartographer|tourist-town> <seed> <option> [label]");
  process.exit(1);
}

console.log(out);
