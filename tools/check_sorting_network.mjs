// Verifies the sorting network actually sorts, and that every trace
// problem's stored per-round values and final order match the simulator.
//
//   node tools/check_sorting_network.mjs            network + frozen sheet + 300 generated sets
//   node tools/check_sorting_network.mjs --gen 50   fewer generated sets
import { execFileSync } from "node:child_process";
import { ROUNDS, ROUND_COUNT, WIRE_COUNT, simulate, isSorted } from "../assets/js/unplugged/sortnet.js";
import { generateSet } from "../assets/js/unplugged/sortnet-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;

// 1. The network itself: every one of the 720 orderings of six distinct
// numbers must come out sorted.
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}
let netFails = 0;
const allPerms = permutations([0, 1, 2, 3, 4, 5]);
for (const perm of allPerms) {
  const { sorted } = simulate(perm);
  if (!isSorted(sorted)) netFails++;
}
console.log(`network: ${allPerms.length} input orders checked, ${netFails} not sorted`);
failures += netFails;
console.log(`network shape: ${ROUND_COUNT} rounds, ${ROUNDS.reduce((n, r) => n + r.length, 0)} comparisons total`);

// 2. A problem's stored roundResults/sorted must match re-running the
// simulator on its own starting values (catches a stale frozen file).
function checkProblem(label, p) {
  if (p.values.length !== WIRE_COUNT) {
    failures++;
    console.log(`FAIL ${label}: expected ${WIRE_COUNT} values, got ${p.values.length}`);
    return;
  }
  const { roundResults, sorted } = simulate(p.values);
  const want = JSON.stringify({ roundResults, sorted });
  const got = JSON.stringify({ roundResults: p.roundResults, sorted: p.sorted });
  if (want !== got) {
    failures++;
    console.log(`FAIL ${label}: stored trace does not match the simulator`);
  }
  if (!isSorted(sorted)) {
    failures++;
    console.log(`FAIL ${label}: final order is not actually sorted`);
  }
}

// Frozen worksheet.
const dataPath = new URL("../_data/unplugged/sortnet_fixed.yml", import.meta.url).pathname;
const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dataPath]);
const frozen = JSON.parse(json);
frozen.problems.forEach((p, i) => checkProblem(`frozen sheet round ${i + 1} (${p.kind})`, p));
console.log(`frozen sheet: ${frozen.problems.length} rounds checked`);

// 3. Many generated sets across both twists and levels.
const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const twist of ["numbers", "words"]) {
  for (const level of ["ms", "hs"]) {
    for (let seed = 10000; seed < 10000 + n / 4; seed++) {
      const [p] = generateSet(makeRng(seed), { twist, level });
      checkProblem(`${twist}/${level} seed ${seed}`, p);
      total++;
    }
  }
}
console.log(`${total} generated problems checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "network always sorts, and every trace matches the simulator");
process.exit(failures ? 1 : 0);
