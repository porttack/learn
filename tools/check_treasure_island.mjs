// Verifies _unplugged/treasure-island.md's worksheet and hidden key against
// _data/unplugged/treasure_island.yml, using the same map logic the page
// itself would use if it were interactive (it isn't -- the map is fixed, so
// the page is static markup -- but every number on it still has to be
// provable from the transcribed map, not hand-typed).
//
//   node tools/check_treasure_island.mjs
//
// YAML is read with Ruby (already required by Jekyll), the same way
// tools/check_graphs.mjs and tools/check_robot_sets.mjs do it, so this needs
// no npm packages.
import { execFileSync } from "node:child_process";
import { ROUTES, follow, shortestRoute } from "../assets/js/unplugged/treasure-island.js";

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

const data = loadYaml("treasure_island.yml");

// ---- The map itself: routes.js must match the yml, and every non-Treasure
// island must have exactly both ships (no dead ends the book didn't intend).
const islandIds = data.islands.map((i) => i.id);
for (const id of islandIds) {
  const jsLegs = ROUTES[id] || null;
  const dataLegs = data.routes[id] || null;
  if (id === data.treasure) {
    if (jsLegs) fail("map", `Treasure Island (${id}) should have no outgoing ships in treasure-island.js`);
    if (dataLegs) fail("map", `Treasure Island (${id}) should have no outgoing ships in the yml`);
    continue;
  }
  if (!jsLegs) fail("map", `${id} has no ships in treasure-island.js`);
  if (!dataLegs) fail("map", `${id} has no ships in the yml`);
  if (jsLegs && dataLegs) {
    for (const letter of ["A", "B"]) {
      if (jsLegs[letter] !== dataLegs[letter]) {
        fail("map", `${id}'s ship ${letter}: js says ${jsLegs[letter]}, yml says ${dataLegs[letter]}`);
      }
    }
  }
}

// ---- The book's own worked examples (p.112): both must reach Treasure Island.
function checkBookExample(label, route, expectPath) {
  const { end, path } = follow(data.start, route);
  if (end !== data.treasure) {
    fail(label, `route ${route} from ${data.start} ended at ${end}, not ${data.treasure}`);
  }
  if (expectPath && JSON.stringify(path) !== JSON.stringify(expectPath)) {
    fail(label, `path was ${JSON.stringify(path)}, expected ${JSON.stringify(expectPath)}`);
  }
}
checkBookExample("worked example (BBBABAB)", data.worked_example.route, data.worked_example.path);
checkBookExample("book example 2 (BBBABBABAB)", data.book_example_2.route, null);

// ---- Practice routes printed on the sheet.
for (const p of data.practice_routes) {
  const { end } = follow(data.start, p.route);
  if (end !== p.end) {
    fail(`practice route ${p.route}`, `computed end ${end}, yml says ${p.end}`);
  }
}

// ---- Shortest route from Pirates' Island to Treasure Island, and that it's
// actually shortest (no route of a smaller length exists).
const bfs = shortestRoute(data.start, data.treasure);
if (!bfs) {
  fail("shortest route", "no route found at all");
} else {
  if (bfs.sequence !== data.shortest_route.sequence) {
    fail("shortest route", `BFS found ${bfs.sequence}, yml says ${data.shortest_route.sequence}`);
  }
  if (bfs.sequence.length !== data.shortest_route.length) {
    fail("shortest route", `length ${bfs.sequence.length}, yml says ${data.shortest_route.length}`);
  }
  if (JSON.stringify(bfs.path) !== JSON.stringify(data.shortest_route.path)) {
    fail("shortest route", `path ${JSON.stringify(bfs.path)}, yml says ${JSON.stringify(data.shortest_route.path)}`);
  }
}
// Brute force every route up to the found length minus one, from Pirates'
// Island, and confirm none of them reach Treasure Island -- i.e. that the
// BFS result really is shortest, not just "a" route.
function bruteForceNoShorterRoute(maxLen) {
  let frontier = [{ island: data.start, route: "" }];
  for (let len = 0; len < maxLen; len++) {
    const next = [];
    for (const { island, route } of frontier) {
      for (const letter of ["A", "B"]) {
        const dest = (data.routes[island] || {})[letter];
        if (dest == null) continue;
        if (dest === data.treasure) return false; // found a shorter route!
        next.push({ island: dest, route: route + letter });
      }
    }
    frontier = next;
  }
  return true;
}
if (!bruteForceNoShorterRoute(data.shortest_route.length - 1)) {
  fail("shortest route", "a shorter route to Treasure Island exists than the yml claims");
}

// ---- The "Musket Hill finish": B, A, B from Musket Hill always reaches
// Treasure Island.
{
  const mf = data.musket_finish;
  const { end, path } = follow(mf.start, mf.route);
  if (end !== data.treasure) {
    fail("Musket Hill finish", `route ${mf.route} from ${mf.start} ended at ${end}, not Treasure Island`);
  }
  if (JSON.stringify(path) !== JSON.stringify(mf.path)) {
    fail("Musket Hill finish", `path ${JSON.stringify(path)}, yml says ${JSON.stringify(mf.path)}`);
  }
}

// ---- The challenge callout's hidden-key example: visits Dead Man's Island
// twice, still ends at Treasure Island.
{
  const c = data.challenge_example;
  const { end, path } = follow(data.start, c.route);
  if (end !== data.treasure) {
    fail("challenge example", `route ${c.route} ended at ${end}, not Treasure Island`);
  }
  if (JSON.stringify(path) !== JSON.stringify(c.path)) {
    fail("challenge example", `path ${JSON.stringify(path)}, yml says ${JSON.stringify(c.path)}`);
  }
  const visits = path.filter((isl) => isl === c.visits_twice).length;
  if (visits < 2) {
    fail("challenge example", `only visits ${c.visits_twice} ${visits} time(s), expected at least 2`);
  }
}

// ---- Every island other than Treasure Island can still reach Treasure
// Island somehow (sanity check: nothing on this map is a true dead end).
for (const id of islandIds) {
  if (id === data.treasure) continue;
  const r = shortestRoute(id, data.treasure);
  if (!r) fail("reachability", `${id} can never reach Treasure Island`);
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("All Treasure Island checks passed.");
}
