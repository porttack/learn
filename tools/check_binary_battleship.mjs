// Verifies Binary Battleship fleets are legal: in bounds, straight and
// contiguous, no overlaps, and no two ships touching (even diagonally).
//
//   node tools/check_binary_battleship.mjs            fixed worksheets + 300 generated sets per level
//   node tools/check_binary_battleship.mjs --gen 50   fewer generated sets
//
// Fixed worksheets live in _data/unplugged/binary-battleship*.yml. YAML is
// converted with Ruby (already required by Jekyll) so this needs no npm
// packages.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { LEVELS, validateFleet } from "../assets/js/unplugged/battleship.js";
import { generateSet } from "../assets/js/unplugged/battleship-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const check = (label, level, fleet) => {
  const errors = validateFleet(level, fleet);
  if (errors.length) {
    failures++;
    console.log(`FAIL ${label}:`);
    for (const e of errors) console.log(`  - ${e}`);
  }
};

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^binary-battleship.*\.ya?ml$/.test(f));
} catch {}
for (const f of files) {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + f]);
  const doc = JSON.parse(json);
  for (const [p, fleet] of Object.entries(doc.players)) {
    check(`${f} player ${p}`, doc.level, fleet);
  }
  console.log(`${f}: level "${doc.level}", set #${doc.set}, players ${Object.keys(doc.players).join(", ")} checked`);
}

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const level of Object.keys(LEVELS)) {
  for (let seed = 10000; seed < 10000 + n; seed++) {
    const set = generateSet(makeRng(seed), level);
    check(`${level} seed ${seed} player A`, level, set.players.A);
    check(`${level} seed ${seed} player B`, level, set.players.B);
    total += 2;
  }
}
console.log(`${total} generated fleets checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all fleets are legal");
process.exit(failures ? 1 : 0);
