// Verifies _unplugged/if-else.md's data (_data/unplugged/if_else.yml) by running
// every program in real Python 3:
//   - the worked example and each Part A program print what the key says
//   - the Part A follow-up answer is found by brute force
//   - each Part B solution gives the expected output for every test value
//   - each Part C broken program is a syntax error and its fix is not
//
//   node tools/check_if_else.mjs
import { execFileSync, spawnSync } from "node:child_process";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

const path = new URL("../_data/unplugged/if_else.yml", import.meta.url).pathname;
const d = JSON.parse(execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", path]));

function run(code) {
  const r = spawnSync("python3", ["-I", "-c", code], { encoding: "utf8" });
  return { ok: r.status === 0, lines: r.stdout.split("\n").filter((x, i, a) => i < a.length - 1 || x !== ""), err: r.stderr };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function checkOutput(label, code, expect) {
  const r = run(code);
  if (!r.ok) return fail(label, `did not run: ${r.err.trim()}`);
  if (!same(r.lines, expect)) fail(label, `printed ${JSON.stringify(r.lines)}, expected ${JSON.stringify(expect)}`);
}

checkOutput("example", d.example.code, d.example.answer);
// The page says changing the first line to 75 flips the answer.
checkOutput("example at 75", d.example.code.replace("temperature = 55", "temperature = 75"), ["No jacket needed."]);

d.partA.forEach((q, i) => {
  checkOutput(`A${i + 1}`, q.code, q.answer);
  if (q.ask) {
    let best = null;
    for (let n = 0; n <= 50; n++) {
      const r = run(q.code.replace(q.ask_replace, `coins = ${n}`));
      if (same(r.lines, [q.ask_expect])) best = n;
    }
    if (best !== q.ask_answer) fail(`A${i + 1} follow-up`, `brute force says ${best}, key says ${q.ask_answer}`);
  }
});

const bTests = [{ ...d.example_b, label: "B example" }, ...d.partB.map((q, i) => ({ ...q, label: `B${i + 1}` }))];
for (const q of bTests) {
  for (const t of q.tests) checkOutput(`${q.label} (${t.given})`, `${t.given}\n${q.solution}`, t.expect);
}

d.partC.forEach((q, i) => {
  const setup = "hunger = level = rain = 0\nlights = 'on'\n";
  const broken = run(setup + q.broken);
  if (broken.ok || !/SyntaxError|IndentationError/.test(broken.err)) fail(`C${i + 1}`, "broken program is not a syntax error");
  const fixed = run(setup + q.fixed);
  if (!fixed.ok) fail(`C${i + 1}`, `fixed program does not run: ${fixed.err.trim()}`);
});

console.log(failures ? `${failures} failure(s)` : `if-else: ${d.partA.length} Part A, ${d.partB.length + 1} Part B, ${d.partC.length} Part C checked in real Python`);
process.exit(failures ? 1 : 0);
