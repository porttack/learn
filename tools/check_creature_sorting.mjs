// Verifies creature-sorting answer keys against the expression evaluator.
//
//   node tools/check_creature_sorting.mjs             fixed worksheets + 300 generated seeds/level
//   node tools/check_creature_sorting.mjs --gen 50    fewer generated sets
//
// Fixed worksheets live in _data/unplugged/creature_sorting*.yml. YAML is
// converted with Ruby (already required by Jekyll) so this needs no npm
// packages. Same pattern as tools/check_robot_sets.mjs.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { computeAnswer, normalizeSet } from "../assets/js/unplugged/creatures.js";
import { generateSet, LEVELS } from "../assets/js/unplugged/creatures-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const check = (label, q, want) => {
  let got;
  try {
    got = normalizeSet(computeAnswer(q)).join(",");
  } catch (e) {
    got = `error: ${e.message}`;
  }
  const wantStr = normalizeSet(want).join(",");
  if (wantStr !== got) {
    failures++;
    console.log(`FAIL ${label}: key says ${wantStr}, evaluator says ${got}`);
  }
};

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^creature_sorting.*\.ya?ml$/.test(f));
} catch {}
for (const f of files) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + f]);
  const set = JSON.parse(json);
  (set.partA || []).forEach((q, i) => check(`${f} partA #${i + 1}`, q, q.answer));
  (set.partB || []).forEach((q, i) => check(`${f} partB #${i + 1}`, q, q.marked));
  console.log(`${f}: ${(set.partA || []).length} Part A + ${(set.partB || []).length} Part B checked`);
}

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
const levels = Object.keys(LEVELS);
for (const level of levels) {
  for (let seed = 10000; seed < 10000 + n / levels.length; seed++) {
    const { partA, partB } = generateSet(makeRng(seed), { level, count: 8 });
    partA.forEach((q, i) => {
      check(`${level} seed ${seed} partA #${i + 1}`, q, q.answer);
      if (q.answer.length === 0 || q.answer.length === 16) {
        failures++;
        console.log(`FAIL ${level} seed ${seed} partA #${i + 1}: trivial set (${q.answer.length} creatures) for "${q.expr}"`);
      }
    });
    partB.forEach((q, i) => {
      check(`${level} seed ${seed} partB #${i + 1}`, q, q.marked);
      if (q.marked.length === 0 || q.marked.length === 16) {
        failures++;
        console.log(`FAIL ${level} seed ${seed} partB #${i + 1}: trivial set (${q.marked.length} creatures) for "${q.key}"`);
      }
    });
    total += partA.length + partB.length;
  }
}
console.log(`${total} generated questions checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all answer keys match the evaluator");
process.exit(failures ? 1 : 0);
