// Freezes generated Solo Battleship puzzles into YAML for the fixed
// worksheet, so a later change to the generator can never alter a sheet
// that's already been printed.
//
//   node tools/freeze_solo_battleship.mjs <seed> "level:label" ... > _data/unplugged/solo_battleship.yml
//
// `level` is one of bimaru-gen.js's LEVELS keys (5-easy, 6x6, 8x8,
// 6-binary). Each puzzle draws from its own forked generator (index-based),
// so adding a puzzle at the end never reshuffles the earlier ones. Review
// the output, then run tools/check_solo_battleship.mjs to re-verify it.
import { generatePuzzle, LEVELS } from "../assets/js/unplugged/bimaru-gen.js";
import { gridToText } from "../assets/js/unplugged/bimaru.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

const [seedArg, ...specs] = process.argv.slice(2);
if (!seedArg || specs.length === 0) {
  console.error('Usage: node tools/freeze_solo_battleship.mjs <seed> "level:label" ...');
  console.error(`Levels: ${Object.keys(LEVELS).join(", ")}`);
  process.exit(1);
}
const base = makeRng(Number(seedArg));

const block = (s, ind) => "|\n" + s.split("\n").map((l) => ind + l).join("\n");
const str = (s) => JSON.stringify(s);
const listNum = (arr) => `[${arr.join(", ")}]`;

const out = [`# Frozen from: node tools/freeze_solo_battleship.mjs ${seedArg} ${specs.map((s) => `"${s}"`).join(" ")}`, "puzzles:"];
specs.forEach((spec, i) => {
  const [level, ...labelParts] = spec.split(":");
  const cfg = LEVELS[level];
  if (!cfg) {
    console.error(`Unknown level "${level}". Levels: ${Object.keys(LEVELS).join(", ")}`);
    process.exit(1);
  }
  const label = labelParts.join(":") || `Puzzle ${i + 1}`;
  const rng = base.fork(i + 1);
  const p = generatePuzzle(rng, cfg);
  out.push(`  - n: ${p.n}`);
  out.push(`    label: ${str(label)}`);
  out.push(`    fleet: ${listNum(p.fleet)}`);
  out.push(`    rowCounts: ${listNum(p.rowCounts)}`);
  out.push(`    colCounts: ${listNum(p.colCounts)}`);
  out.push(`    binary: ${p.binary}`);
  out.push(`    given: ${block(gridToText(p.given), "      ")}`);
  out.push(`    solution: ${block(gridToText(p.solution), "      ")}`);
});
console.log(out.join("\n"));
