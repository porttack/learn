// Generates Solo Battleship puzzles: a random legal fleet placement, then
// true-value givens added one at a time (see bimaru.js's
// addGivensForUniqueness) until the row/col counts plus those givens pin
// down exactly one solution, then a cleanup pass that drops any given that
// turns out not to have been necessary.
//
// DOM-free, like bimaru.js, so tools/check_solo_battleship.mjs and
// tools/freeze_solo_battleship.mjs can both import it.

import {
  randomFleetPlacement,
  rowCountsOf,
  colCountsOf,
  addGivensForUniqueness,
  minimizeGivens,
  simpleSolve,
  countSolutions,
} from "./bimaru.js";

// Levels shown on the generator page. "easy" additionally requires the
// puzzle to be fully solvable with the two simple techniques taught on the
// main worksheet (no guessing); the others only require a unique solution.
// "binary" swaps the printed row/column counts for 3-bit binary numbers;
// it doesn't change the puzzle logic at all.
export const LEVELS = {
  "5-easy": { label: "5x5 easy", n: 5, fleet: [3, 2, 1, 1], easy: true, binary: false, count: 2 },
  "6x6": { label: "6x6", n: 6, fleet: [3, 2, 2, 1, 1, 1], easy: false, binary: false, count: 2 },
  "8x8": { label: "8x8", n: 8, fleet: [4, 3, 3, 2, 2, 1, 1], easy: false, binary: false, count: 1 },
  "6-binary": { label: "6x6, binary counts", n: 6, fleet: [3, 2, 2, 1, 1, 1], easy: false, binary: true, count: 2 },
};

const MAX_ATTEMPTS = 300;

// One puzzle: { n, fleet, rowCounts, colCounts, binary, given, solution },
// with `given` and `solution` as grid arrays (bimaru.js's 1/0/null form),
// the same shape the live generator page draws directly. Only the freeze
// script converts them to the text format the frozen YAML stores.
//
// Retries with a fresh random fleet placement (a fresh fork of `rng`)
// whenever a placement can't be forced unique within budget, or (for
// "easy") turns out to need real guessing after all -- cheap enough at
// these grid sizes that a few hundred retries still takes well under a
// second, see tools/check_solo_battleship.mjs's timings.
export function generatePuzzle(rng, cfg) {
  const { n, fleet, easy } = cfg;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const r = rng.fork(attempt);
    const solution = randomFleetPlacement(r.fork(1), n, fleet);
    const rowCounts = rowCountsOf(solution);
    const colCounts = colCountsOf(solution);
    let given = addGivensForUniqueness(r.fork(2), n, rowCounts, colCounts, fleet, solution);
    if (!given) continue;
    given = minimizeGivens(r.fork(3), n, rowCounts, colCounts, fleet, given);
    if (easy && !simpleSolve(n, rowCounts, colCounts, given).solved) continue;
    if (countSolutions(n, rowCounts, colCounts, given, fleet, 2) !== 1) continue;
    return { n, fleet, rowCounts, colCounts, binary: !!cfg.binary, given, solution };
  }
  throw new Error(`Couldn't build a unique${easy ? ", easy," : ""} ${n} by ${n} puzzle after ${MAX_ATTEMPTS} attempts`);
}

// A whole set. Puzzle i draws from its own forked generator, so changing
// the count doesn't reshuffle earlier puzzles.
export function generateSet(rng, { level = "5-easy", count } = {}) {
  const cfg = LEVELS[level] || LEVELS["5-easy"];
  const total = count ?? cfg.count;
  const out = [];
  for (let i = 0; i < total; i++) out.push(generatePuzzle(rng.fork(i + 1), cfg));
  return out;
}
