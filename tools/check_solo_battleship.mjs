// Proves every Solo Battleship puzzle (frozen worksheet or freshly
// generated) has exactly one solution, that the recorded solution is
// itself a legal fleet (straight ships, right sizes, none touching, even
// diagonally), that it actually matches the printed row/column counts, and
// that every given square agrees with it.
//
//   node tools/check_solo_battleship.mjs            fixed worksheets + 300 generated puzzles per level
//   node tools/check_solo_battleship.mjs --gen 40    fewer generated puzzles
//
// Fixed worksheets live in _data/unplugged/solo_battleship*.yml. YAML is
// converted with Ruby (already required by Jekyll) so this needs no npm
// packages.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import {
  countSolutions,
  validateSolution,
  validateCounts,
  validateGiven,
  parseGiven,
  simpleSolve,
} from "../assets/js/unplugged/bimaru.js";
import { generateSet, LEVELS } from "../assets/js/unplugged/bimaru-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;

function checkPuzzle(label, n, fleet, rowCounts, colCounts, given, solution) {
  const solErrs = validateSolution(n, solution, fleet);
  if (solErrs.length) {
    failures++;
    console.log(`FAIL ${label}: recorded solution isn't a legal fleet:`);
    for (const e of solErrs) console.log(`  - ${e}`);
    return;
  }
  const countErrs = validateCounts(n, solution, rowCounts, colCounts);
  if (countErrs.length) {
    failures++;
    console.log(`FAIL ${label}: printed counts don't match the solution:`);
    for (const e of countErrs) console.log(`  - ${e}`);
    return;
  }
  const givenErrs = validateGiven(n, given, solution);
  if (givenErrs.length) {
    failures++;
    console.log(`FAIL ${label}: given squares don't match the solution:`);
    for (const e of givenErrs) console.log(`  - ${e}`);
    return;
  }
  const count = countSolutions(n, rowCounts, colCounts, given, fleet, 2);
  if (count !== 1) {
    failures++;
    console.log(`FAIL ${label}: has ${count === 2 ? "more than one" : "no"} solution, not exactly one`);
  }
}

// ---- Fixed worksheets ------------------------------------------------------

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^solo_battleship.*\.ya?ml$/.test(f));
} catch {}
for (const f of files) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + f]);
  const data = JSON.parse(json);
  // `example` (if present) is the tiny worked example on the main sheet,
  // hand-authored as static HTML there rather than drawn by JS -- it's kept
  // here purely so it's re-verified the same way as everything else.
  if (data.example) {
    const p = data.example;
    checkPuzzle(`${f} example`, p.n, p.fleet, p.rowCounts, p.colCounts, parseGiven(p.given), parseGiven(p.solution));
  }
  data.puzzles.forEach((p, i) => {
    const given = parseGiven(p.given);
    const solution = parseGiven(p.solution);
    checkPuzzle(`${f} #${i + 1} (${p.label})`, p.n, p.fleet, p.rowCounts, p.colCounts, given, solution);
  });
  console.log(`${f}: ${data.puzzles.length} puzzles checked${data.example ? " + 1 worked example" : ""}`);
}

// ---- Generated puzzles ------------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const perLevel = Math.max(1, Math.round(n / Object.keys(LEVELS).length));
const t0 = Date.now();
let total = 0;
let easyFailures = 0;
for (const level of Object.keys(LEVELS)) {
  let seed = 30000;
  let checkedThisLevel = 0;
  while (checkedThisLevel < perLevel) {
    const set = generateSet(makeRng(seed), { level, count: 1 });
    set.forEach((p) => {
      if (checkedThisLevel >= perLevel) return;
      checkPuzzle(`${level} seed ${seed}`, p.n, p.fleet, p.rowCounts, p.colCounts, p.given, p.solution);
      if (LEVELS[level].easy && !simpleSolve(p.n, p.rowCounts, p.colCounts, p.given).solved) {
        failures++;
        easyFailures++;
        console.log(`FAIL ${level} seed ${seed}: labeled easy but not solvable without guessing`);
      }
      checkedThisLevel++;
      total++;
    });
    seed++;
  }
}
console.log(`${total} generated puzzles checked in ${Date.now() - t0} ms`);
if (easyFailures) console.log(`${easyFailures} "easy" puzzle(s) actually needed guessing`);
console.log(failures ? `${failures} failure(s)` : "all puzzles have exactly one solution and a legal fleet");
process.exit(failures ? 1 : 0);
