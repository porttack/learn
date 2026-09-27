// Generates trace problems for the sorting-network activity: six random
// numbers, or six random words to put in alphabetical order, run through
// the same fixed network (sortnet.js) so the answer key is always just
// the simulator's own output.
import { WIRE_COUNT, simulate } from "./sortnet.js";

// All different lengths and starting letters, so no two ever tie
// alphabetically and the "twist" reads clearly as words, not numbers.
const WORD_BANK = [
  "apple", "mango", "kiwi", "fig", "date", "pear", "plum", "grape",
  "lemon", "peach", "otter", "zebra", "camel", "tiger", "eagle", "robin",
  "gecko", "moose", "llama", "heron", "cobra", "hippo", "shark", "whale",
];

function randomNumbers(rng, min, max) {
  const seen = new Set();
  const out = [];
  while (out.length < WIRE_COUNT) {
    const n = rng.int(min, max);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function randomWords(rng) {
  return rng.shuffle(WORD_BANK).slice(0, WIRE_COUNT);
}

function buildProblem(kind, values) {
  const { roundResults, sorted } = simulate(values);
  return { kind, values, roundResults, sorted };
}

// opts.twist: "numbers" (default) or "words".
// opts.level: "hs" uses three-digit numbers instead of two-digit ones.
export function generateSet(rng, opts = {}) {
  if (opts.twist === "words") return [buildProblem("words", randomWords(rng))];
  const hard = opts.level === "hs";
  return [buildProblem("numbers", randomNumbers(rng, hard ? 100 : 1, hard ? 999 : 99))];
}
