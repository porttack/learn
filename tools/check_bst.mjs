// Verifies every binary search tree worksheet against assets/js/unplugged/bst.js.
//
//   node tools/check_bst.mjs             fixed worksheets + 300 generated sets
//   node tools/check_bst.mjs --gen 50   fewer generated sets
//
// Fixed data lives in _data/unplugged/bst_*.yml. YAML is converted with
// Ruby (already required by Jekyll) so this needs no npm packages.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import {
  insertAll, isValidBst, searchPath, nodeCount, isChain, inorderValues,
} from "../assets/js/unplugged/bst.js";
import { generateSearchSet, generateBuildSet } from "../assets/js/unplugged/bst-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL: ${msg}`);
};

function loadYaml(path) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", path]);
  return JSON.parse(json);
}

// Builds the tree, and checks it two independent ways: the recursive BST
// invariant, and that every value survived insertion (a duplicate in the
// insertion list would otherwise silently vanish and no one would notice).
function checkTree(label, values) {
  const root = insertAll(values);
  if (!isValidBst(root)) fail(`${label}: tree breaks the BST rule (left < node < right)`);
  if (nodeCount(root) !== new Set(values).size) fail(`${label}: insertAll dropped a value (duplicate in the list?)`);
  return root;
}

// Checks a search: does searchPath's verdict agree with a completely
// different way of asking the same question (an in-order listing)?
function checkTarget(label, root, target) {
  const res = searchPath(root, target);
  const truly = inorderValues(root).includes(target);
  if (res.found !== truly) {
    fail(`${label} target ${target}: searchPath found=${res.found} but the tree's own inorder listing says ${truly}`);
  }
  if (res.found && res.path[res.path.length - 1] !== target) {
    fail(`${label} target ${target}: found, but the recorded path doesn't end on it`);
  }
  if (!res.found && !res.deadEnd) {
    fail(`${label} target ${target}: not found, but no dead end was recorded`);
  }
  if (res.comparisons !== res.path.length) {
    fail(`${label} target ${target}: comparisons (${res.comparisons}) != path length (${res.path.length})`);
  }
  return res;
}

function checkSearchSet(label, values, targets) {
  const root = checkTree(label, values);
  let sawFound = false;
  let sawMissing = false;
  for (const t of targets) {
    const res = checkTarget(label, root, t);
    if (res.found) sawFound = true;
    else sawMissing = true;
  }
  if (!sawFound) fail(`${label}: no target is actually in the tree (nothing to find)`);
  if (!sawMissing) fail(`${label}: every target is in the tree (no dead end to practice)`);
}

function samePermutation(label, a, b) {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  if (JSON.stringify(sa) !== JSON.stringify(sb)) fail(`${label}: values and sorted aren't the same numbers`);
}

function checkBuildSet(label, values, sorted) {
  samePermutation(label, values, sorted);
  const bushy = checkTree(`${label} (given order)`, values);
  const chain = checkTree(`${label} (sorted order)`, sorted);
  if (!isChain(chain)) fail(`${label}: sorted-order insertion didn't produce a chain`);
  if (isChain(bushy)) fail(`${label}: given-order insertion accidentally produced a chain too (no contrast to see)`);
}

function checkHiddenPair(label, tree) {
  const root = checkTree(label, tree.values);
  const res = checkTarget(label, root, tree.target);
  if (!res.found) fail(`${label}: target ${tree.target} must be in the tree for the hidden-number game to work`);
  if (res.comparisons < 1 || res.comparisons > nodeCount(root)) {
    fail(`${label}: fewest-reveals count (${res.comparisons}) is out of range for a ${nodeCount(root)}-node tree`);
  }
}

// ---- Fixed worksheets --------------------------------------------------------

const dataDir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dataDir).filter((f) => /^bst_.*\.ya?ml$/.test(f));
} catch {}

for (const f of files) {
  const data = loadYaml(dataDir + f);
  if (f === "bst_search.yml") {
    checkTree("bst_search vocab", data.vocab.values);
    const exRoot = checkTree("bst_search example", data.example.values);
    const exRes = checkTarget("bst_search example", exRoot, data.example.target);
    if (!exRes.found) fail("bst_search example: worked example's target must be found, not missing");
    checkSearchSet("bst_search practice", data.practice.values, data.practice.targets);
  } else if (f === "bst_hidden.yml") {
    checkHiddenPair("bst_hidden tree1", data.tree1);
    checkHiddenPair("bst_hidden tree2", data.tree2);
  } else if (f === "bst_build.yml") {
    checkBuildSet("bst_build", data.values, data.sorted);
  } else {
    console.log(`(skipping unrecognized file ${f})`);
  }
  console.log(`${f}: checked`);
}

// ---- Generated sets -----------------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
const sizes = ["small", "medium", "large"];
for (const size of sizes) {
  for (let seed = 10000; seed < 10000 + n / sizes.length; seed++) {
    const rng = makeRng(seed);
    const search = generateSearchSet(rng.fork(1), { size, count: 5 });
    checkSearchSet(`generated search seed ${seed} (${size})`, search.values, search.targets);
    const build = generateBuildSet(rng.fork(2), { size });
    checkBuildSet(`generated build seed ${seed} (${size})`, build.values, build.sorted);
    total += 2;
  }
}
console.log(`${total} generated sets checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all trees, searches, and builds check out");
process.exit(failures ? 1 : 0);
