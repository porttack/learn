// Verifies every Nim answer key two independent ways: the nim-sum shortcut
// and a brute-force search of the whole game tree. A key only counts as
// checked if both agree.
//
//   node tools/check_nim.mjs            fixed pages + 300 generated positions per pile count
//   node tools/check_nim.mjs --gen 50   fewer generated positions
//
// The fixed practice table lives in _data/unplugged/nim_binary_secret.yml.
// YAML is converted with Ruby (already required by Jekyll) so this needs no
// npm packages, matching tools/check_robot_sets.mjs.
import { execFileSync } from "node:child_process";
import {
  nimSum,
  classify,
  winningMove,
  bruteForceClassify,
  bitWidth,
  toBinary,
  describeMove,
  takeAwayClassify,
  takeAwayWinningMove,
  bruteForceTakeAway,
} from "../assets/js/unplugged/nim.js";
import { generateSet } from "../assets/js/unplugged/nim-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

// ---- Multi-pile Nim: nim-sum vs. brute force, for one position ------------

function checkPosition(label, piles) {
  const bySum = classify(piles);
  const byBrute = bruteForceClassify(piles);
  if (bySum !== byBrute) {
    fail(label, `nim-sum says ${bySum}, brute force says ${byBrute}, piles ${JSON.stringify(piles)}`);
    return;
  }
  const move = winningMove(piles);
  if (bySum === "win") {
    if (!move) {
      fail(label, `classified as a win but winningMove() found none, piles ${JSON.stringify(piles)}`);
      return;
    }
    if (move.to < 0 || move.to >= move.from || move.index < 0 || move.index >= piles.length) {
      fail(label, `winningMove() returned an illegal move ${JSON.stringify(move)}`);
      return;
    }
    const next = piles.slice();
    next[move.index] = move.to;
    if (bruteForceClassify(next) !== "lose") {
      fail(label, `winningMove() leaves ${JSON.stringify(next)}, but brute force says that's still a win for the opponent`);
    }
  } else if (move) {
    fail(label, `classified as a loss but winningMove() found ${JSON.stringify(move)}`);
  }
}

// ---- Fixed pages ------------------------------------------------------------

// nim.md's single-pile take-away boards and multi-pile boards. Kept here as
// plain numbers, matching what's hand-written on the page (that page has no
// data file of its own -- it's plain HTML/markdown so a printed sheet can
// never drift from a live generator).
const NIM_MD_SINGLE_PILES = [13, 15, 16, 21];
const NIM_MD_MULTI_PILES = [
  [3, 5, 7],
  [1, 3, 5],
  [2, 4, 6],
  [4, 5, 6],
];

for (const n of NIM_MD_SINGLE_PILES) {
  const bySum = takeAwayClassify(n, 3);
  const byBrute = bruteForceTakeAway(n, 3);
  if (bySum !== byBrute) fail(`nim.md single pile of ${n}`, `takeAwayClassify says ${bySum}, brute force says ${byBrute}`);
}
console.log(`nim.md: ${NIM_MD_SINGLE_PILES.length} single-pile boards checked`);

NIM_MD_MULTI_PILES.forEach((piles, i) => checkPosition(`nim.md multi-pile board #${i + 1}`, piles));
console.log(`nim.md: ${NIM_MD_MULTI_PILES.length} multi-pile boards checked`);

// nim-binary-secret.md's worked examples and practice table.
const dataPath = new URL("../_data/unplugged/nim_binary_secret.yml", import.meta.url).pathname;
const secretData = JSON.parse(execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dataPath]));

function checkFrozenQuestion(label, q) {
  const width = bitWidth(q.piles);
  if (width !== q.width) {
    fail(label, `bitWidth(piles) is ${width}, YAML says width: ${q.width}`);
    return;
  }
  const binary = q.piles.map((p) => toBinary(p, q.width));
  if (JSON.stringify(binary) !== JSON.stringify(q.binary)) {
    fail(label, `computed binary ${JSON.stringify(binary)} doesn't match YAML's ${JSON.stringify(q.binary)}`);
  }
  const sum = nimSum(q.piles);
  if (sum !== q.sum) fail(label, `nimSum is ${sum}, YAML says sum: ${q.sum}`);
  const sumBinary = toBinary(sum, q.width);
  if (sumBinary !== q.sum_binary) fail(label, `sum binary is ${sumBinary}, YAML says sum_binary: ${q.sum_binary}`);

  const bySum = classify(q.piles);
  const byBrute = bruteForceClassify(q.piles);
  if (bySum !== byBrute) {
    fail(label, `nim-sum says ${bySum}, brute force says ${byBrute}`);
    return;
  }
  if (bySum !== q.answer) fail(label, `computed answer ${bySum}, YAML says answer: ${q.answer}`);

  const move = winningMove(q.piles);
  const moveText = describeMove(move);
  if (moveText !== q.move) fail(label, `computed move "${moveText}", YAML says move: "${q.move}"`);
  if (move) {
    const next = q.piles.slice();
    next[move.index] = move.to;
    if (bruteForceClassify(next) !== "lose") fail(label, `suggested move leaves ${JSON.stringify(next)}, still a win for the opponent by brute force`);
  }
}

(secretData.worked_examples || []).forEach((q, i) => checkFrozenQuestion(`nim_binary_secret.yml worked example #${i + 1}`, q));
(secretData.practice || []).forEach((q, i) => checkFrozenQuestion(`nim_binary_secret.yml practice #${i + 1}`, q));
console.log(
  `nim_binary_secret.yml: ${(secretData.worked_examples || []).length} worked examples + ${(secretData.practice || []).length} practice positions checked`,
);

// ---- Single-pile take-away: the multiples-of-4 rule, in general -----------
//
// The rule "losing positions are multiples of (maxTake + 1)" should hold for
// any maxTake, not just 3 -- check a range for several values.
let takeAwayChecked = 0;
for (const maxTake of [1, 2, 3, 4, 5]) {
  for (let n = 0; n <= 60; n++) {
    const bySum = takeAwayClassify(n, maxTake);
    const byBrute = bruteForceTakeAway(n, maxTake);
    takeAwayChecked++;
    if (bySum !== byBrute) {
      fail(`take-away n=${n} maxTake=${maxTake}`, `takeAwayClassify says ${bySum}, brute force says ${byBrute}`);
      continue;
    }
    if (bySum === "win") {
      const take = takeAwayWinningMove(n, maxTake);
      if (!take || take < 1 || take > maxTake || bruteForceTakeAway(n - take, maxTake) !== "lose") {
        fail(`take-away n=${n} maxTake=${maxTake}`, `winning move ${take} doesn't leave a loss for the opponent`);
      }
    }
  }
}
console.log(`take-away game: ${takeAwayChecked} (n, maxTake) combinations checked`);

// ---- Generated positions ----------------------------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const pileCount of [3, 4]) {
  for (let seed = 20000; seed < 20000 + n / 2; seed++) {
    const qs = generateSet(makeRng(seed), { pileCount, count: 6 });
    qs.forEach((q, i) => checkPosition(`generated pileCount=${pileCount} seed ${seed} #${i + 1}`, q.piles));
    total += qs.length;
  }
}
console.log(`${total} generated positions checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all answer keys match both the nim-sum shortcut and brute-force search");
process.exit(failures ? 1 : 0);
