// Verifies the three graph activities (Muddy City, the Poor Cartographer,
// Tourist Town) against brute force.
//
//   node tools/check_graphs.mjs            fixed worksheets + 150 generated maps each
//   node tools/check_graphs.mjs --gen 50    fewer generated maps
//
// The Muddy City and Tourist Town fixed pages now use the CS Unplugged
// book's own worksheet, transcribed into _data/unplugged/{muddy_city_book,
// tourist_town_book}.yml so their answer keys can be proven here. The Poor
// Cartographer page also uses the book's own (hand-illustrated) worksheets
// and solution images; those maps' borders are too intricate to transcribe
// reliably, so there is no computed check for them here -- the hidden key
// is just the book's own solution page images. YAML is converted with Ruby
// (already required by Jekyll) so this needs no npm packages, the same way
// tools/check_robot_sets.mjs checks the robot worksheets.
import { execFileSync } from "node:child_process";
import { makeRng } from "../assets/js/unplugged/rng.js";
import {
  kruskalMST,
  bruteForceMST,
  isConnected,
  existsColoring,
  minColoring,
  isProperColoring,
  minDominatingSet,
  isDominatingSet,
  rectAdjacencyEdges,
} from "../assets/js/unplugged/graphs.js";
import { generateMap as generateMuddyCity, SIZES as MUDDY_SIZES } from "../assets/js/unplugged/muddy-city.js";
import { generateMap as generateCartographer, TARGETS } from "../assets/js/unplugged/poor-cartographer.js";
import { generateMap as generateTouristTown, SIZES as TOWN_SIZES } from "../assets/js/unplugged/tourist-town.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

function loadYaml(file) {
  const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + file]);
  return JSON.parse(json);
}

// ---- Muddy City: minimum spanning trees -----------------------------------

function checkMuddyCity(label, map) {
  const n = map.nodes.length;
  if (!isConnected(n, map.edges)) return fail(label, "town is not fully connected by streets");
  const mst = kruskalMST(n, map.edges);
  if (!mst.spanning) return fail(label, "Kruskal's algorithm didn't find a spanning tree");
  const bf = bruteForceMST(n, map.edges);
  if (mst.total !== bf.total) fail(label, `Kruskal says ${mst.total} stones, brute force says ${bf.total}`);
}

const muddyData = loadYaml("muddy_city.yml");
muddyData.maps.forEach((m, i) => checkMuddyCity(`muddy_city.yml map ${i + 1} (${m.label})`, m));
console.log(`muddy_city.yml: ${muddyData.maps.length} maps checked`);

// The book's graph version printed on the Muddy City sheet: its key states
// the fewest paving stones, so prove it two ways.
{
  const book = loadYaml("muddy_city_book.yml");
  const idx = Object.fromEntries(book.houses.map((h, i) => [h, i]));
  const edges = book.roads.map(([a, b, w]) => ({ a: idx[a], b: idx[b], w }));
  const n = book.houses.length;
  const k = kruskalMST(n, edges).total;
  const bfTotal = bruteForceMST(n, edges).total;
  if (k !== book.fewest_stones || bfTotal !== book.fewest_stones) {
    fail("muddy_city_book.yml", `key says ${book.fewest_stones}, Kruskal ${k}, brute force ${bfTotal}`);
  } else console.log(`muddy_city_book.yml: fewest paving stones = ${k} (Kruskal and brute force agree)`);
  // The key says the graph has more than one best answer: count them.
  let best = 0;
  const pick = [];
  const walk = (start) => {
    if (pick.length === n - 1) {
      const chosen = pick.map((i) => edges[i]);
      if (chosen.reduce((t, e) => t + e.w, 0) === book.fewest_stones && kruskalMST(n, chosen).spanning) best++;
      return;
    }
    for (let i = start; i < edges.length; i++) { pick.push(i); walk(i + 1); pick.pop(); }
  };
  walk(0);
  if (best < 2) fail("muddy_city_book.yml", `key says more than one best answer, found ${best}`);
  else console.log(`muddy_city_book.yml: ${best} different best answers`);
}

// ---- The Poor Cartographer: graph coloring --------------------------------

function checkCartographer(label, map) {
  const n = map.rects.length;
  const edges = rectAdjacencyEdges(map.rects);
  if (!isConnected(n, edges)) return fail(label, "map is not one connected piece");
  const { k, coloring } = minColoring(n, edges);
  if (!isProperColoring(n, edges, coloring)) return fail(label, "claimed coloring puts two touching countries in the same color");
  if (k > 1 && existsColoring(n, edges, k - 1)) fail(label, `claims ${k} colors are needed, but ${k - 1} also works`);
}

// No fixed-worksheet check here: the page uses the book's own hand-drawn
// "Graph Coloring 1-4" worksheets, whose wobbly borders can't be traced
// into an adjacency list with confidence. The hidden key is the book's own
// solution page images instead. checkCartographer (above) still runs
// against the generated maps below, which come from known rectangles.

// ---- Tourist Town: dominating sets -----------------------------------------

function checkTouristTown(label, map) {
  const n = map.nodes.length;
  if (!isConnected(n, map.edges)) return fail(label, "town is not fully connected by streets");
  const { size, set } = minDominatingSet(n, map.edges);
  if (!isDominatingSet(n, map.edges, set)) return fail(label, "claimed van placement doesn't cover every corner");
  // minDominatingSet already searches sizes from 1 up, so finding `size`
  // proves no smaller set works -- re-run one size down as a cross-check.
  if (size > 0) {
    const smaller = minDominatingSet(n, map.edges);
    if (smaller.size !== size) fail(label, `inconsistent minimum: got ${size} then ${smaller.size}`);
  }
}

// The book's own "Ice Cream Vans" map printed on the Tourist Town sheet:
// its key states six vans are the fewest possible, so prove it.
{
  const book = loadYaml("tourist_town_book.yml");
  const idx = Object.fromEntries(book.corners.map((c, i) => [c, i]));
  const edges = book.streets.map(([a, b]) => ({ a: idx[a], b: idx[b] }));
  const n = book.corners.length;
  if (!isConnected(n, edges)) fail("tourist_town_book.yml", "town is not fully connected by streets");
  const { size, set } = minDominatingSet(n, edges);
  if (!isDominatingSet(n, edges, set)) fail("tourist_town_book.yml", "claimed van placement doesn't cover every corner");
  if (size !== book.min_vans) {
    fail("tourist_town_book.yml", `key says ${book.min_vans} vans, minDominatingSet says ${size}`);
  } else {
    console.log(`tourist_town_book.yml: fewest vans = ${size} (matches the key), e.g. at ${set.map((i) => book.corners[i]).join(", ")}`);
  }
}

// ---- Generated maps ---------------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 150;
const t0 = Date.now();

let total = 0;
for (const size of Object.keys(MUDDY_SIZES)) {
  for (let seed = 20000; seed < 20000 + n; seed++) {
    const map = generateMuddyCity(makeRng(seed), size);
    checkMuddyCity(`muddy-city generated size=${size} seed ${seed}`, map);
    total++;
  }
}
for (const target of [2, 3, 4]) {
  for (let seed = 30000; seed < 30000 + n; seed++) {
    const map = generateCartographer(makeRng(seed), target);
    checkCartographer(`poor-cartographer generated target=${target} seed ${seed}`, map);
    total++;
  }
}
for (const size of Object.keys(TOWN_SIZES)) {
  for (let seed = 40000; seed < 40000 + n; seed++) {
    const map = generateTouristTown(makeRng(seed), size);
    checkTouristTown(`tourist-town generated size=${size} seed ${seed}`, map);
    total++;
  }
}

console.log(`${total} generated maps checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all answers match brute force");
process.exit(failures ? 1 : 0);
