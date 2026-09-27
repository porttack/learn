// Freezes a generated robot set into YAML for a fixed worksheet, so later
// generator changes can never alter a sheet that's already been printed.
//
//   node tools/freeze_robot_set.mjs <level> <seed> <count> "<title>" > _data/unplugged/robot_N.yml
//
// Review and hand-edit the YAML afterwards (prompts, notes, `explain:`),
// then run tools/check_robot_sets.mjs to re-verify the keys.
import { generateSet } from "../assets/js/unplugged/robot-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

const [level, seed, count, title] = process.argv.slice(2);
const qs = generateSet(makeRng(Number(seed)), { level, count: Number(count) });

const block = (s, ind) => "|\n" + s.split("\n").map((l) => ind + l).join("\n");
const str = (s) => JSON.stringify(s);
const out = [`# Frozen from: node tools/freeze_robot_set.mjs ${level} ${seed} ${count}`, `title: ${str(title)}`, "questions:"];
for (const q of qs) {
  out.push(`  - kind: ${q.kind}`);
  if (q.grid) out.push(`    grid: ${block(q.grid, "      ")}`);
  if (q.grids) {
    out.push("    grids:");
    for (const g of q.grids) out.push(`      - ${block(g, "        ")}`);
  }
  if (q.code) out.push(`    code: ${block(q.code, "      ")}`);
  if (q.choices) {
    out.push("    choices:");
    for (const c of q.choices) out.push(c.includes("\n") ? `      - ${block(c, "        ")}` : `      - ${str(c)}`);
  }
  out.push(`    answer: [${q.answer.join(", ")}]`);
  out.push("    notes:");
  for (const n of q.notes) out.push(`      - ${str(n)}`);
}
console.log(out.join("\n"));
