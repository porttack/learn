// Verifies every linear-vs-binary-search puzzle in this activity family
// against a real implementation, since no page ever prints an answer key.
//
//   node tools/check_search.mjs            fixed worksheets + 300 generated sets per mode
//   node tools/check_search.mjs --gen 50   fewer generated sets
//
// Fixed data lives in _data/unplugged/search_trace.yml and
// search_battleships.yml. YAML is converted with Ruby (already required by
// Jekyll) so this needs no npm packages.
import { execFileSync } from "node:child_process";
import {
  linearSearch,
  binarySearch,
  isSortedAscending,
  isPermutation,
  hasUniqueValues,
} from "../assets/js/unplugged/search.js";
import { generateSet, LEVELS, MODES } from "../assets/js/unplugged/search-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

function loadYaml(relPath) {
  const path = new URL(relPath, import.meta.url).pathname;
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", path]);
  return JSON.parse(json);
}

// A demo (or any list+target pair) is correct if the stored linear/binary
// check sequences match what the algorithms actually produce.
function checkTrace(label, list, target, want) {
  const linear = linearSearch(list, target);
  const binary = binarySearch(list, target);
  if (want.linear_checks && JSON.stringify(linear.checked) !== JSON.stringify(want.linear_checks)) {
    fail(label, `linear_checks says [${want.linear_checks}], search.js says [${linear.checked}]`);
  }
  if (want.binary_checks && JSON.stringify(binary.checked) !== JSON.stringify(want.binary_checks)) {
    fail(label, `binary_checks says [${want.binary_checks}], search.js says [${binary.checked}]`);
  }
  if (want.linear_count != null && linear.count !== want.linear_count) {
    fail(label, `linear_count says ${want.linear_count}, search.js says ${linear.count}`);
  }
  if (want.binary_count != null && binary.count !== want.binary_count) {
    fail(label, `binary_count says ${want.binary_count}, search.js says ${binary.count}`);
  }
  if (want.found != null && linear.found !== want.found) {
    fail(label, `found says ${want.found}, but target ${target} ${linear.found ? "is" : "isn't"} actually in the list`);
  }
  if (linear.found !== binary.found) {
    fail(label, `linear search and binary search disagree on whether ${target} is in the list`);
  }
  return { linear, binary };
}

// ---- search_trace.yml -------------------------------------------------------

let trace;
try {
  trace = loadYaml("../_data/unplugged/search_trace.yml");
} catch (e) {
  fail("search_trace.yml", `couldn't load: ${e.message}`);
}

if (trace) {
  if (!isSortedAscending(trace.demo.list)) fail("search_trace demo", "demo.list isn't sorted ascending");
  checkTrace("search_trace demo", trace.demo.list, trace.demo.target, trace.demo);

  const list = trace.main.list;
  if (!isSortedAscending(list)) fail("search_trace main.list", "isn't sorted ascending");
  if (!hasUniqueValues(list)) fail("search_trace main.list", "has a repeated value");
  if (!trace.main.targets.some((t) => t.mark)) fail("search_trace main.targets", "no target has mark: true");

  trace.main.targets.forEach((t, i) => {
    checkTrace(`search_trace target #${i + 1} (${t.value})`, list, t.value, t);
  });
  console.log(`search_trace.yml: demo + ${trace.main.targets.length} targets checked`);
}

// ---- search_battleships.yml --------------------------------------------------

let ships;
try {
  ships = loadYaml("../_data/unplugged/search_battleships.yml");
} catch (e) {
  fail("search_battleships.yml", `couldn't load: ${e.message}`);
}

if (ships) {
  if (!isSortedAscending(ships.demo.list)) fail("search_battleships demo", "demo.list isn't sorted ascending");
  checkTrace("search_battleships demo", ships.demo.list, ships.demo.target, ships.demo);

  if (ships.letters.length !== 6) fail("search_battleships letters", "expected 6 letters");

  for (const p of ["A", "B"]) {
    const player = ships.players[p];
    if (!isSortedAscending(player.sorted)) fail(`search_battleships player ${p}`, "sorted isn't sorted ascending");
    if (!hasUniqueValues(player.sorted)) fail(`search_battleships player ${p}`, "sorted has a repeated value");
    if (!isPermutation(player.round1_order, player.sorted)) {
      fail(`search_battleships player ${p}`, "round1_order isn't a permutation of sorted (same six numbers)");
    }
    if (player.round1_order.length !== ships.letters.length) {
      fail(`search_battleships player ${p}`, `round1_order has ${player.round1_order.length} ships, expected ${ships.letters.length}`);
    }
  }

  const pairs = [
    ["a_finds_on_b", "B"],
    ["b_finds_on_a", "A"],
  ];
  for (const [key, targetPlayer] of pairs) {
    const t = ships.targets[key];
    const player = ships.players[targetPlayer];
    if (!player.sorted.includes(t.value)) {
      fail(`search_battleships targets.${key}`, `${t.value} isn't one of player ${targetPlayer}'s ships`);
      continue;
    }
    // Round 1 (unsorted): the searcher can only do a plain linear search.
    const linear = linearSearch(player.round1_order, t.value);
    if (linear.count !== t.linear_count) {
      fail(`search_battleships targets.${key}`, `linear_count says ${t.linear_count}, search.js says ${linear.count}`);
    }
    // Round 2 (sorted): the searcher can do a real binary search.
    const binary = binarySearch(player.sorted, t.value);
    if (binary.count !== t.binary_count) {
      fail(`search_battleships targets.${key}`, `binary_count says ${t.binary_count}, search.js says ${binary.count}`);
    }
  }
  console.log("search_battleships.yml: demo, both players, and both targets checked");
}

// ---- generator ---------------------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const level of Object.keys(LEVELS)) {
  for (const mode of Object.keys(MODES)) {
    for (let seed = 10000; seed < 10000 + n / (Object.keys(LEVELS).length * Object.keys(MODES).length); seed++) {
      const set = generateSet(makeRng(seed), { level, mode });
      const label = `level ${level} mode ${mode} seed ${seed}`;
      total++;

      if (mode === "sorted" && !isSortedAscending(set.list)) {
        fail(label, "mode sorted but the list isn't sorted ascending");
      }
      if (!hasUniqueValues(set.list)) fail(label, "list has a repeated value");

      const linear = linearSearch(set.list, set.target);
      const binary = binarySearch(set.list, set.target);
      if (JSON.stringify(linear) !== JSON.stringify(set.linear)) fail(label, "returned linear result doesn't match search.js");
      if (JSON.stringify(binary) !== JSON.stringify(set.binary)) fail(label, "returned binary result doesn't match search.js");

      if (mode === "unsorted") {
        const reallyThere = set.list.includes(set.target);
        if (!reallyThere) fail(label, "unsorted mode's target isn't actually in the list");
        if (set.binary.found) fail(label, "unsorted mode was supposed to make binary search fail, but it still found the target");
      } else if (set.linear.found !== set.binary.found) {
        fail(label, "sorted mode: linear and binary search disagree on whether the target is present");
      }
    }
  }
}
console.log(`${total} generated sets checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all search puzzles match a real implementation");
process.exit(failures ? 1 : 0);
