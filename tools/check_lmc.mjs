// Verifies every Little Man Computer program used on the unplugged LMC
// sheets: the fixed worksheets (assembled from _data/unplugged/lmc_*.yml),
// the three "write your own" reference solutions (not shown to students,
// checked here only), and the generator's bank of programs (checked
// against an independent JS formula, and structurally checked through many
// random sets).
//
//   node tools/check_lmc.mjs            fixed worksheets + reference
//                                        solutions + 300 generated sets per
//                                        level
//   node tools/check_lmc.mjs --gen 50   fewer generated sets
//
// YAML is read with Ruby (already required by Jekyll), so this needs no
// npm packages.
import { execFileSync } from "node:child_process";
import { assemble, run, assembleAndRun } from "../assets/js/unplugged/lmc.js";
import { generateSet, LEVELS } from "../assets/js/unplugged/lmc-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

const MAX_STEPS = 1000;
let failures = 0;

function checkProgram(label, source, inputs, expected) {
  let result;
  try {
    result = assembleAndRun(source, inputs, { maxSteps: MAX_STEPS });
  } catch (e) {
    failures++;
    console.log(`FAIL ${label}: ${e.message}`);
    return;
  }
  if (!result.halted) {
    failures++;
    console.log(`FAIL ${label}: never halted within ${MAX_STEPS} steps`);
    return;
  }
  if (expected && result.outputs.join(",") !== expected.join(",")) {
    failures++;
    console.log(`FAIL ${label}: expected [${expected}], got [${result.outputs}]`);
  }
}

// ---- Fixed worksheets (_data/unplugged/lmc_*.yml) --------------------------

const dataDir = new URL("../_data/unplugged/", import.meta.url).pathname;
for (const f of ["lmc_1.yml", "lmc_2.yml"]) {
  let set;
  try {
    const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dataDir + f]);
    set = JSON.parse(json);
  } catch (e) {
    failures++;
    console.log(`FAIL ${f}: couldn't load (${e.message})`);
    continue;
  }
  checkProgram(`${f} worked (${set.worked.title})`, set.worked.source, set.worked.inputs, set.worked.expected);
  set.practice.forEach((p, i) => checkProgram(`${f} practice #${i + 1} (${p.title})`, p.source, p.inputs, p.expected));
  console.log(`${f}: worked example + ${set.practice.length} practice program(s) checked`);
}

// ---- "Write your own" reference solutions (lmc-3-write.md) -----------------
//
// Not shown to students -- the sheet asks them to trace their own program
// by hand instead. Loaded from _data/unplugged/lmc_3.yml (the same file the
// page's answer key renders from -- see lmc-page.js's renderTaskKey), so the
// key on the page and this check can never drift apart. Proves each task is
// actually solvable in LMC assembly within a reasonable number of mailboxes,
// with the sheet's own suggested test input.

let sheet3 = [];
try {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dataDir + "lmc_3.yml"]);
  sheet3 = JSON.parse(json).tasks;
} catch (e) {
  failures++;
  console.log(`FAIL lmc_3.yml: couldn't load (${e.message})`);
}
for (const s of sheet3) checkProgram(`sheet 3: ${s.title}`, s.source, s.inputs, s.expected);
console.log(`sheet 3: ${sheet3.length} reference solution(s) checked`);

// ---- Generator bank: each template against its own independent formula -----

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let templateChecks = 0;
for (const [levelName, level] of Object.entries(LEVELS)) {
  for (const tmpl of level.templates) {
    for (let seed = 1; seed <= n; seed++) {
      const rng = makeRng(seed * 7919 + 1);
      const inputs = tmpl.makeInputs(rng);
      let result;
      try {
        const { code } = assemble(tmpl.source);
        result = run(code, inputs, { maxSteps: MAX_STEPS });
      } catch (e) {
        failures++;
        console.log(`FAIL ${levelName}/${tmpl.id} seed ${seed}: ${e.message}`);
        continue;
      }
      templateChecks++;
      if (!result.halted) {
        failures++;
        console.log(`FAIL ${levelName}/${tmpl.id} seed ${seed}: never halted for inputs ${inputs}`);
      } else if (!tmpl.check(inputs, result.outputs)) {
        failures++;
        console.log(`FAIL ${levelName}/${tmpl.id} seed ${seed}: inputs ${inputs} gave outputs ${result.outputs}`);
      }
    }
  }
}
console.log(`${templateChecks} template check(s) across ${Object.keys(LEVELS).length} levels checked in ${Date.now() - t0} ms`);

// ---- Generated sets: structurally halt and produce outputs -----------------

let sets = 0;
for (const levelName of Object.keys(LEVELS)) {
  for (let seed = 10000; seed < 10000 + 100; seed++) {
    try {
      const qs = generateSet(makeRng(seed), { level: levelName, count: 6 });
      sets++;
      for (const q of qs) {
        if (!Number.isInteger(q.steps) || q.steps <= 0) {
          failures++;
          console.log(`FAIL generated set ${levelName} seed ${seed}: ${q.id} reported no steps`);
        }
      }
    } catch (e) {
      failures++;
      console.log(`FAIL generated set ${levelName} seed ${seed}: ${e.message}`);
    }
  }
}
console.log(`${sets} generated set(s) checked for halting`);

console.log(failures ? `${failures} failure(s)` : "all LMC programs assemble, halt, and match their expected outputs");
process.exit(failures ? 1 : 0);
