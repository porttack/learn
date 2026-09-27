// Generates binary logic puzzles: a full random valid grid, then givens
// removed one at a time as long as the puzzle keeps exactly one solution.
//
// DOM-free, like binairo.js, so tools/check_binary_puzzles.mjs and
// tools/freeze_binary_puzzles.mjs can both import it.

import { cloneGrid, countSolutionsBounded, findSolution, simpleSolve } from "./binairo.js";

// Node budget for each "is this still unique?" check while reducing a
// puzzle. Bounded rather than exhaustive so a click on "New set" always
// stays fast: a check that blows the budget is treated as "not safely
// removable" and the given is kept, which can never make a shipped puzzle
// wrong -- it can only leave it a little less reduced than the true limit.
const REDUCE_NODE_BUDGET = 100;

// Levels shown on the generator page. "easy" additionally requires the
// puzzle to be fully solvable with the simple techniques taught on the
// worksheet (no guessing); the others only require a unique solution.
// `count` is how many puzzles a set has at that level -- fewer for a
// bigger grid, so a set still prints in a reasonable number of pages.
export const LEVELS = {
  "6-easy": { label: "6x6 easy", n: 6, easy: true, count: 6 },
  "6-hard": { label: "6x6 harder", n: 6, easy: false, count: 6 },
  "8": { label: "8x8", n: 8, easy: false, count: 5 },
  "10": { label: "10x10", n: 10, easy: false, count: 4 },
};

function emptyGrid(n) {
  return Array.from({ length: n }, () => Array(n).fill(null));
}

export function generateSolution(rng, n) {
  const solution = findSolution(emptyGrid(n), n, rng);
  if (!solution) throw new Error(`No solution exists for n=${n} (this would be a bug)`);
  return solution;
}

// Removes givens from a full solution one at a time, in a random order,
// keeping a removal only when the puzzle that results still has exactly
// one solution (and, for `easy`, is still solvable with simpleSolve
// alone). Stops when no remaining given can be removed.
export function reduceToPuzzle(rng, solution, n, { easy = false } = {}) {
  const puzzle = cloneGrid(solution);
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  for (const [r, c] of rng.shuffle(cells)) {
    const saved = puzzle[r][c];
    puzzle[r][c] = null;
    const unique = countSolutionsBounded(puzzle, n, 2, REDUCE_NODE_BUDGET) === 1;
    const simpleOk = !easy || simpleSolve(puzzle, n).solved;
    if (!unique || !simpleOk) puzzle[r][c] = saved;
  }
  return puzzle;
}

export function generatePuzzle(rng, n, opts = {}) {
  const solution = generateSolution(rng, n);
  const given = reduceToPuzzle(rng, solution, n, opts);
  return { n, given, solution };
}

// A whole set. Puzzle i draws from its own forked generator, so changing
// the count doesn't reshuffle earlier puzzles.
export function generateSet(rng, { level = "6-easy", count } = {}) {
  const cfg = LEVELS[level] || LEVELS["6-easy"];
  const total = count ?? cfg.count;
  const out = [];
  for (let i = 0; i < total; i++) {
    out.push(generatePuzzle(rng.fork(i + 1), cfg.n, { easy: cfg.easy }));
  }
  return out;
}
