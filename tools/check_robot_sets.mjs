// Verifies robot-question answer keys against the simulator.
//
//   node tools/check_robot_sets.mjs            fixed worksheets + 300 generated sets
//   node tools/check_robot_sets.mjs --gen 50   fewer generated sets
//
// Fixed worksheets live in _data/unplugged/robot_*.yml. YAML is converted
// with Ruby (already required by Jekyll) so this needs no npm packages.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { computeAnswer, normalizeAnswer } from "../assets/js/unplugged/robot.js";
import { generateSet } from "../assets/js/unplugged/robot-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const check = (label, q) => {
  const want = normalizeAnswer(q.answer).join(",");
  let got;
  try {
    got = normalizeAnswer(computeAnswer(q)).join(",");
  } catch (e) {
    got = `error: ${e.message}`;
  }
  if (want !== got) {
    failures++;
    console.log(`FAIL ${label}: key says ${want}, simulator says ${got}`);
  }
};

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^robot_.*\.ya?ml$/.test(f));
} catch {}
for (const f of files) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + f]);
  const set = JSON.parse(json);
  set.questions.forEach((q, i) => check(`${f} #${i + 1}`, q));
  console.log(`${f}: ${set.questions.length} questions checked`);
}

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const level of ["starter", "ap", "challenge"]) {
  for (let seed = 10000; seed < 10000 + n / 3; seed++) {
    const qs = generateSet(makeRng(seed), { level, count: 6 });
    qs.forEach((q, i) => check(`${level} seed ${seed} #${i + 1}`, q));
    total += qs.length;
  }
}
console.log(`${total} generated questions checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all answer keys match the simulator");
process.exit(failures ? 1 : 0);
