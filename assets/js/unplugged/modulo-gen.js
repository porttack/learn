// Generates modulo puzzles in the three modes the generator page offers:
// clock problems, Python `%` predictions, and check digits. DOM-free, so
// tools/check_modulo.mjs can import it directly.

import { stepForward, stepBackward, pymod, checkDigit } from "./modulo.js";

export const CLOCK_SIZES = {
  ms: [10, 12, 7, 2],
  hs: [10, 12, 24, 7, 360, 2],
};

function clockQuestion(rng, level) {
  const n = rng.pick(CLOCK_SIZES[level] || CLOCK_SIZES.ms);
  const start = rng.int(0, n - 1);
  const back = level === "hs" && rng.chance(0.4);
  const steps = level === "hs" ? rng.int(1, Math.max(20, n * 3)) : rng.int(1, Math.min(20, n * 2));
  const answer = back ? stepBackward(n, start, steps) : stepForward(n, start, steps);
  return { kind: "clock", n, start, steps, direction: back ? "back" : "forward", answer };
}

function predictQuestion(rng, level) {
  const n = rng.int(2, 12);
  const allowNegative = level === "hs" && rng.chance(0.35);
  const a = allowNegative ? -rng.int(1, 60) : rng.int(0, 80);
  return { kind: "predict", a, n, answer: pymod(a, n) };
}

function checkDigitQuestion(rng, level) {
  const len = level === "hs" ? 6 : 4;
  const data = Array.from({ length: len }, () => rng.int(0, 9));
  const correctCheck = checkDigit(data);
  const task = rng.pick(["validate", "find"]);
  if (task === "find") {
    return { kind: "checkdigit", task, digits: [...data, correctCheck] };
  }
  const showValid = rng.chance(0.5);
  let check = correctCheck;
  if (!showValid) {
    // Any wrong digit works; pick one that's actually different.
    const wrong = rng.pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== correctCheck));
    check = wrong;
  }
  return { kind: "checkdigit", task, digits: [...data, check], valid: check === correctCheck, correctCheck };
}

const BUILDERS = { clock: clockQuestion, predict: predictQuestion, checkdigit: checkDigitQuestion };

// One whole set. Question i draws from its own forked generator, so
// changing the count doesn't reshuffle the earlier questions.
export function generateSet(rng, { mode = "clock", level = "ms", count = 10 } = {}) {
  const build = BUILDERS[mode] || BUILDERS.clock;
  const qs = [];
  for (let i = 0; i < count; i++) qs.push(build(rng.fork(i + 1), level));
  return qs;
}
