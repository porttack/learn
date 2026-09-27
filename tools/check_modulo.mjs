// Verifies the modulo activity family: Python-style mod/floordiv math, the
// three fixed worksheets' hand-picked answers, and a batch of generated
// puzzles in every mode.
//
//   node tools/check_modulo.mjs            fixed worksheets + 300 generated sets
//   node tools/check_modulo.mjs --gen 60   fewer generated sets
//
// Fixed worksheet content lives in _data/unplugged/modulo_*.yml. YAML is
// converted with Ruby (already required by Jekyll), matching
// tools/check_robot_sets.mjs and tools/check_caesar_cipher.mjs.
import { execFileSync } from "node:child_process";
import { pymod, pyfloordiv, stepForward, stepBackward, checkDigit, isValidCode } from "../assets/js/unplugged/modulo.js";
import { generateSet } from "../assets/js/unplugged/modulo-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

function loadYaml(relPath) {
  const path = new URL(relPath, import.meta.url).pathname;
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", path]);
  return JSON.parse(json);
}

// ---- 1. pymod matches Python's actual sign-of-the-divisor rule --------------
//
// Values below were checked against a real Python 3 interpreter by hand
// (`python3 -c "print(-3 % 10)"` etc.) -- the whole point of pymod() is that
// it must agree with Python, not with JavaScript's own `%`.
const PYTHON_CASES = [
  [-3, 10, 7],
  [17, 5, 2],
  [-7, 3, 2],
  [7, -3, -2],
  [-1, 26, 25],
  [0, 5, 0],
  [-24, 12, 0],
  [-4, 2, 0],
];
for (const [a, n, want] of PYTHON_CASES) {
  const got = pymod(a, n);
  if (got !== want) fail(`pymod(${a}, ${n})`, `got ${got}, want ${want} (Python's own answer)`);
}
if (pyfloordiv(97, 60) !== 1) fail("pyfloordiv(97, 60)", `got ${pyfloordiv(97, 60)}`);
if (pyfloordiv(135, 60) !== 2) fail("pyfloordiv(135, 60)", `got ${pyfloordiv(135, 60)}`);
console.log(`${PYTHON_CASES.length} pymod cases checked against Python's own rule`);

// ---- 2. modulo_clocks.yml ----------------------------------------------------

const clocks = loadYaml("../_data/unplugged/modulo_clocks.yml");
{
  const { start, steps, answer } = clocks.forward.worked;
  if (stepForward(10, start, steps) !== answer) fail("modulo_clocks.yml forward.worked", "mismatch");
}
clocks.forward.problems.forEach((p, i) => {
  if (stepForward(10, p.start, p.steps) !== p.answer) fail(`modulo_clocks.yml forward #${i + 1}`, `stepForward(10, ${p.start}, ${p.steps}) = ${stepForward(10, p.start, p.steps)}, yml says ${p.answer}`);
});
{
  const { start, steps, answer } = clocks.backward.worked;
  if (stepBackward(10, start, steps) !== answer) fail("modulo_clocks.yml backward.worked", "mismatch");
}
clocks.backward.problems.forEach((p, i) => {
  if (stepBackward(10, p.start, p.steps) !== p.answer) fail(`modulo_clocks.yml backward #${i + 1}`, `stepBackward(10, ${p.start}, ${p.steps}) = ${stepBackward(10, p.start, p.steps)}, yml says ${p.answer}`);
});
clocks.other_clocks.forEach((c, i) => {
  if (stepForward(c.n, c.start, c.steps) !== c.answer) fail(`modulo_clocks.yml other_clocks #${i + 1} (${c.name})`, `stepForward(${c.n}, ${c.start}, ${c.steps}) = ${stepForward(c.n, c.start, c.steps)}, yml says ${c.answer}`);
});
{
  const { a, n, answer } = clocks.predict.worked;
  if (pymod(a, n) !== answer) fail("modulo_clocks.yml predict.worked", "mismatch");
}
clocks.predict.problems.forEach((p, i) => {
  if (pymod(p.a, p.n) !== p.answer) fail(`modulo_clocks.yml predict #${i + 1}`, `${p.a} % ${p.n} = ${pymod(p.a, p.n)}, yml says ${p.answer}`);
});
console.log(
  `modulo_clocks.yml: ${clocks.forward.problems.length} forward + ${clocks.backward.problems.length} backward + ${clocks.other_clocks.length} other-clock + ${clocks.predict.problems.length} predict problems checked`,
);

// ---- 3. modulo_in_code.yml ----------------------------------------------------

const inCode = loadYaml("../_data/unplugged/modulo_in_code.yml");

function checkInCodeItem(label, it) {
  if (it.kind === "even_odd") {
    if (pymod(it.n, 2) !== it.answer) fail(label, `${it.n} % 2 = ${pymod(it.n, 2)}, yml says ${it.answer}`);
  } else if (it.kind === "wrap") {
    const idx = pymod(it.i + 1, it.colors.length);
    if (idx !== it.answer_index) fail(label, `(i + 1) % len = ${idx}, yml says ${it.answer_index}`);
    if (it.colors[idx] !== it.answer_word) fail(label, `colors[${idx}] = "${it.colors[idx]}", yml says "${it.answer_word}"`);
  } else if (it.kind === "robot") {
    const d = pymod(it.facing + it.turns, 4);
    if (d !== it.answer) fail(label, `(facing + turns) % 4 = ${d}, yml says ${it.answer}`);
  } else if (it.kind === "minutes") {
    const h = pyfloordiv(it.total, 60);
    const m = pymod(it.total, 60);
    if (h !== it.hours) fail(label, `${it.total} // 60 = ${h}, yml says ${it.hours}`);
    if (m !== it.minutes) fail(label, `${it.total} % 60 = ${m}, yml says ${it.minutes}`);
  } else if (it.kind === "cipher") {
    const c = pymod(it.letter + it.shift, 26);
    if (c !== it.answer) fail(label, `(letter + shift) % 26 = ${c}, yml says ${it.answer}`);
  } else {
    fail(label, `unknown kind "${it.kind}"`);
  }
}

checkInCodeItem("modulo_in_code.yml examples.even_odd", inCode.examples.even_odd);
checkInCodeItem("modulo_in_code.yml examples.wrap", inCode.examples.wrap);
checkInCodeItem("modulo_in_code.yml examples.robot", inCode.examples.robot);
checkInCodeItem("modulo_in_code.yml examples.minutes", inCode.examples.minutes);
checkInCodeItem("modulo_in_code.yml examples.cipher", inCode.examples.cipher);
checkInCodeItem("modulo_in_code.yml examples.negative_even_odd", inCode.examples.negative_even_odd);
inCode.practice.forEach((it, i) => checkInCodeItem(`modulo_in_code.yml practice #${i + 1}`, it));
console.log(`modulo_in_code.yml: 5 worked examples + ${inCode.practice.length} practice problems checked`);

// ---- 4. modulo_check_digits.yml -----------------------------------------------

const cd = loadYaml("../_data/unplugged/modulo_check_digits.yml");
{
  const got = checkDigit(cd.worked.data);
  if (got !== cd.worked.check) fail("modulo_check_digits.yml worked", `checkDigit(${cd.worked.data}) = ${got}, yml says ${cd.worked.check}`);
  if (cd.worked.data.join("") + cd.worked.check !== cd.worked.full) fail("modulo_check_digits.yml worked", "full code doesn't match data + check");
}
cd.validate.forEach((v, i) => {
  const digits = v.full.split("").map(Number);
  const got = isValidCode(digits);
  if (got !== v.valid) fail(`modulo_check_digits.yml validate #${i + 1} (${v.full})`, `isValidCode = ${got}, yml says ${v.valid}`);
});
// Guard against an accidentally all-valid or all-invalid answer key: half
// the point of "is this real?" is that some are and some aren't.
{
  const validCount = cd.validate.filter((v) => v.valid).length;
  if (validCount === 0 || validCount === cd.validate.length) fail("modulo_check_digits.yml validate", "every code has the same validity; not a fair mix");
}
cd.find_missing.forEach((f, i) => {
  const got = checkDigit(f.data);
  if (got !== f.check) fail(`modulo_check_digits.yml find_missing #${i + 1}`, `checkDigit(${f.data}) = ${got}, yml says ${f.check}`);
});
console.log(`modulo_check_digits.yml: 1 worked + ${cd.validate.length} validate + ${cd.find_missing.length} find-missing codes checked`);

// ---- 5. Generated puzzles, every mode, many seeds -----------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const mode of ["clock", "predict", "checkdigit"]) {
  for (const level of ["ms", "hs"]) {
    for (let seed = 10000; seed < 10000 + n / 6; seed++) {
      const qs = generateSet(makeRng(seed), { mode, level, count: 8 });
      qs.forEach((q, i) => {
        total++;
        const label = `gen ${mode}/${level} seed ${seed} #${i + 1}`;
        if (q.kind === "clock") {
          const want = q.direction === "back" ? stepBackward(q.n, q.start, q.steps) : stepForward(q.n, q.start, q.steps);
          if (want !== q.answer) fail(label, `recomputed ${want}, generator said ${q.answer}`);
          if (q.start < 0 || q.start >= q.n) fail(label, `start ${q.start} out of range for a ${q.n}-clock`);
        } else if (q.kind === "predict") {
          if (pymod(q.a, q.n) !== q.answer) fail(label, `${q.a} % ${q.n} recomputes to ${pymod(q.a, q.n)}, generator said ${q.answer}`);
          if (level === "ms" && q.a < 0) fail(label, "easier level should never use a negative number");
        } else if (q.kind === "checkdigit") {
          const data = q.digits.slice(0, -1);
          const last = q.digits[q.digits.length - 1];
          const correct = checkDigit(data);
          if (q.task === "find") {
            if (last !== correct) fail(label, `"find" puzzle's own digits aren't self-consistent: checkDigit = ${correct}, digits end in ${last}`);
          } else {
            const wantValid = last === correct;
            if (wantValid !== q.valid) fail(label, `isValidCode says ${wantValid}, generator said ${q.valid}`);
          }
        } else {
          fail(label, `unknown kind "${q.kind}"`);
        }
      });
    }
  }
}
console.log(`${total} generated questions checked (clock / predict / checkdigit, both levels) in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all modulo answer keys match the math");
process.exit(failures ? 1 : 0);
