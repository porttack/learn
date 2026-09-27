// Proves every binary logic puzzle (frozen worksheet or freshly generated)
// has exactly one solution, and that the frozen solution actually is one.
//
//   node tools/check_binary_puzzles.mjs           fixed worksheets + 300 generated puzzles
//   node tools/check_binary_puzzles.mjs --gen 40  fewer generated puzzles
//
// Fixed worksheets live in _data/unplugged/binary_puzzles*.yml. YAML is
// converted with Ruby (already required by Jekyll) so this needs no npm
// packages.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { countSolutions, isValidSolution, parsePuzzle } from "../assets/js/unplugged/binairo.js";
import { generateSet, LEVELS } from "../assets/js/unplugged/binairo-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;

function checkPuzzle(label, given, solution, n) {
  if (!isValidSolution(solution, n)) {
    failures++;
    console.log(`FAIL ${label}: recorded solution breaks a rule`);
    return;
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (given[r][c] !== null && given[r][c] !== solution[r][c]) {
        failures++;
        console.log(`FAIL ${label}: given cell (${r},${c})=${given[r][c]} doesn't match the recorded solution`);
        return;
      }
    }
  }
  const count = countSolutions(given, n, 2);
  if (count !== 1) {
    failures++;
    console.log(`FAIL ${label}: has ${count === 2 ? "more than one" : "no"} solution, not exactly one`);
  }
}

// ---- Fixed worksheets ---------------------------------------------------------

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^binary_puzzles.*\.ya?ml$/.test(f));
} catch {}
for (const f of files) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + f]);
  const data = JSON.parse(json);
  data.puzzles.forEach((p, i) => {
    const given = parsePuzzle(p.given);
    const solution = parsePuzzle(p.solution);
    checkPuzzle(`${f} #${i + 1} (${p.label})`, given, solution, p.n);
  });
  console.log(`${f}: ${data.puzzles.length} puzzles checked`);
}

// ---- Generated puzzles ---------------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const perLevel = Math.max(1, Math.round(n / Object.keys(LEVELS).length));
const t0 = Date.now();
let total = 0;
for (const level of Object.keys(LEVELS)) {
  let seed = 20000;
  let checkedThisLevel = 0;
  while (checkedThisLevel < perLevel) {
    const set = generateSet(makeRng(seed), { level, count: 3 });
    set.forEach((p, i) => {
      if (checkedThisLevel >= perLevel) return;
      checkPuzzle(`${level} seed ${seed} #${i + 1}`, p.given, p.solution, p.n);
      checkedThisLevel++;
      total++;
    });
    seed++;
  }
}
console.log(`${total} generated puzzles checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all puzzles have exactly one solution");
process.exit(failures ? 1 : 0);
