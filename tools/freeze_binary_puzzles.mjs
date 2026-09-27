// Freezes a set of generated binary logic puzzles into YAML for the fixed
// worksheet, so later generator changes can never alter a sheet that's
// already been printed.
//
//   node tools/freeze_binary_puzzles.mjs <seed> <n:easy|hard:label> ... > _data/unplugged/binary_puzzles.yml
//
// Each puzzle draws from its own forked generator (index-based), so adding
// a puzzle at the end never reshuffles the earlier ones. Review the output
// afterwards, then run tools/check_binary_puzzles.mjs to re-verify it.
import { generatePuzzle } from "../assets/js/unplugged/binairo-gen.js";
import { gridToText } from "../assets/js/unplugged/binairo.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

const [seedArg, ...specs] = process.argv.slice(2);
if (!seedArg || specs.length === 0) {
  console.error('Usage: node tools/freeze_binary_puzzles.mjs <seed> "n:easy|hard:label" ...');
  process.exit(1);
}
const base = makeRng(Number(seedArg));

const block = (s, ind) => "|\n" + s.split("\n").map((l) => ind + l).join("\n");
const str = (s) => JSON.stringify(s);

const out = [`# Frozen from: node tools/freeze_binary_puzzles.mjs ${seedArg} ${specs.map((s) => `"${s}"`).join(" ")}`, "puzzles:"];
specs.forEach((spec, i) => {
  const [nStr, diff, ...labelParts] = spec.split(":");
  const n = Number(nStr);
  const easy = diff === "easy";
  const label = labelParts.join(":") || `Puzzle ${i + 1}`;
  const rng = base.fork(i + 1);
  const { given, solution } = generatePuzzle(rng, n, { easy });
  out.push(`  - n: ${n}`);
  out.push(`    label: ${str(label)}`);
  out.push(`    given: ${block(gridToText(given), "      ")}`);
  out.push(`    solution: ${block(gridToText(solution), "      ")}`);
});
console.log(out.join("\n"));
