// Binary logic puzzle (Takuzu / Binairo style): fill an n x n grid with 0s
// and 1s so that
//   1. no more than two of the same digit are next to each other in a row
//      or column,
//   2. every row and every column has exactly n/2 zeros and n/2 ones,
//   3. no two rows are identical and no two columns are identical.
//
// DOM-free on purpose: tools/check_binary_puzzles.mjs imports this in Node
// to prove every fixed and generated puzzle has exactly one solution.

// ---- Grid text format --------------------------------------------------------
//
// One row per line, one character per cell, no separators:
//   0 1     filled digit
//   .       blank (to be solved)

export function parsePuzzle(text) {
  const rows = String(text)
    .trim()
    .split("\n")
    .map((r) => r.trim());
  const n = rows.length;
  const grid = rows.map((row, r) => {
    if (row.length !== n) throw new Error(`Row ${r + 1} has ${row.length} cells, expected ${n}`);
    return row.split("").map((ch) => {
      if (ch === "0") return 0;
      if (ch === "1") return 1;
      if (ch === "." || ch === "_") return null;
      throw new Error(`Unknown cell "${ch}" in row ${r + 1}`);
    });
  });
  return grid;
}

export function gridToText(grid) {
  return grid.map((row) => row.map((v) => (v === null ? "." : String(v))).join("")).join("\n");
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function isComplete(grid) {
  return grid.every((row) => row.every((v) => v !== null));
}

// ---- Rule checking ------------------------------------------------------------

// True if placing/keeping the value at (r, c) doesn't break any rule, given
// the *rest* of the grid as it currently stands (which may still have
// blanks elsewhere). Used to prune the solver as it fills cells in, so it
// only checks locally around (r, c) plus whichever row/column just became
// fully filled.
function consistentAt(grid, n, r, c) {
  const v = grid[r][c];
  if (v === null) return true;

  // No three in a row, in either direction, through (r, c).
  const row = grid[r];
  for (let start = Math.max(0, c - 2); start <= Math.min(c, n - 3); start++) {
    const a = row[start], b = row[start + 1], cc = row[start + 2];
    if (a !== null && a === b && b === cc) return false;
  }
  for (let start = Math.max(0, r - 2); start <= Math.min(r, n - 3); start++) {
    const a = grid[start][c], b = grid[start + 1][c], cc = grid[start + 2][c];
    if (a !== null && a === b && b === cc) return false;
  }

  // Row and column counts can't exceed n / 2.
  const half = n / 2;
  let row0 = 0, row1 = 0;
  for (const x of row) {
    if (x === 0) row0++;
    else if (x === 1) row1++;
  }
  if (row0 > half || row1 > half) return false;

  let col0 = 0, col1 = 0;
  for (let rr = 0; rr < n; rr++) {
    const x = grid[rr][c];
    if (x === 0) col0++;
    else if (x === 1) col1++;
  }
  if (col0 > half || col1 > half) return false;

  // A row or column that just became fully filled can't duplicate another
  // fully filled row or column.
  if (!row.includes(null)) {
    for (let rr = 0; rr < n; rr++) {
      if (rr === r) continue;
      const other = grid[rr];
      if (!other.includes(null) && other.every((x, i) => x === row[i])) return false;
    }
  }
  let colFull = true;
  for (let rr = 0; rr < n && colFull; rr++) if (grid[rr][c] === null) colFull = false;
  if (colFull) {
    const col = [];
    for (let rr = 0; rr < n; rr++) col.push(grid[rr][c]);
    for (let cc2 = 0; cc2 < n; cc2++) {
      if (cc2 === c) continue;
      let otherFull = true;
      for (let rr = 0; rr < n && otherFull; rr++) if (grid[rr][cc2] === null) otherFull = false;
      if (otherFull) {
        let same = true;
        for (let rr = 0; rr < n && same; rr++) if (grid[rr][cc2] !== col[rr]) same = false;
        if (same) return false;
      }
    }
  }
  return true;
}

// The value forced at blank cell (r, c) by the two solving techniques
// taught on the worksheet (a run of two matching neighbors, or a row/column
// already at half its zeros or ones), or null if neither applies yet.
function forcedValue(grid, n, r, c, half) {
  for (const off of [-2, -1, 0]) {
    const cs = [c + off, c + off + 1, c + off + 2];
    if (cs[0] < 0 || cs[2] >= n) continue;
    const vals = cs.map((cc) => grid[r][cc]);
    if (vals.filter((v) => v === null).length !== 1) continue;
    const others = vals.filter((v) => v !== null);
    if (others[0] === others[1]) return others[0] === 0 ? 1 : 0;
  }
  for (const off of [-2, -1, 0]) {
    const rs = [r + off, r + off + 1, r + off + 2];
    if (rs[0] < 0 || rs[2] >= n) continue;
    const vals = rs.map((rr) => grid[rr][c]);
    if (vals.filter((v) => v === null).length !== 1) continue;
    const others = vals.filter((v) => v !== null);
    if (others[0] === others[1]) return others[0] === 0 ? 1 : 0;
  }
  let row0 = 0, row1 = 0;
  for (const x of grid[r]) {
    if (x === 0) row0++;
    else if (x === 1) row1++;
  }
  if (row0 === half) return 1;
  if (row1 === half) return 0;
  let col0 = 0, col1 = 0;
  for (let rr = 0; rr < n; rr++) {
    const x = grid[rr][c];
    if (x === 0) col0++;
    else if (x === 1) col1++;
  }
  if (col0 === half) return 1;
  if (col1 === half) return 0;
  return null;
}

// Forced-cell deduction (the same techniques as simpleSolve below), run to
// a fixpoint and mutating `grid` in place. `seed`, if given, is the list of
// cells that just changed (so only their rows/columns need reconsidering,
// not the whole grid) -- pass null to scan every blank cell once, which is
// only needed for the very first call on a fresh puzzle. Returns
// "contradiction" the instant a forced value would break a rule,
// "complete" if every cell is now filled, or "stuck" if nothing else can
// be deduced.
function propagate(grid, n, seed) {
  const half = n / 2;
  const queue = [];
  const queued = new Set();
  const enqueue = (r, c) => {
    if (grid[r][c] !== null) return;
    const key = r * n + c;
    if (queued.has(key)) return;
    queued.add(key);
    queue.push([r, c]);
  };
  if (seed) {
    for (const [r, c] of seed) {
      for (let cc = 0; cc < n; cc++) enqueue(r, cc);
      for (let rr = 0; rr < n; rr++) enqueue(rr, c);
    }
  } else {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) enqueue(r, c);
  }

  while (queue.length) {
    const [r, c] = queue.shift();
    queued.delete(r * n + c);
    if (grid[r][c] !== null) continue;
    const forced = forcedValue(grid, n, r, c, half);
    if (forced === null) continue;
    grid[r][c] = forced;
    if (!consistentAt(grid, n, r, c)) return "contradiction";
    for (let cc = 0; cc < n; cc++) enqueue(r, cc);
    for (let rr = 0; rr < n; rr++) enqueue(rr, c);
  }
  return isComplete(grid) ? "complete" : "stuck";
}

// Thrown to unwind the search the instant a node budget is exhausted; see
// `maxNodes` below.
class BudgetExceeded {}

// DPLL-style search: propagate forced cells first (cheap and does most of
// the work), then branch only on a cell propagation couldn't resolve.
// Calls `onSolution` for each complete, valid grid found, and stops once
// `limit` solutions have been found. `rng`, if given, randomizes which
// branch (0 or 1) is tried first (used to generate a fresh random
// solution); omit it to search in a fixed order (counting solutions, where
// order only affects speed, not the count). `maxNodes`, if given, caps how
// many branch points the search will visit before giving up (used only to
// keep the in-browser generator fast; see countSolutionsBounded).
function search(puzzle, n, limit, onSolution, { rng, maxNodes } = {}) {
  let found = 0;
  let nodes = 0;

  function solve(grid, seed) {
    const status = propagate(grid, n, seed);
    if (status === "contradiction") return;
    if (status === "complete") {
      found++;
      onSolution(grid);
      return;
    }
    if (maxNodes && ++nodes > maxNodes) throw new BudgetExceeded();
    let br = null;
    for (let r = 0; r < n && !br; r++) for (let c = 0; c < n && !br; c++) if (grid[r][c] === null) br = [r, c];
    const [r, c] = br;
    const vals = rng ? rng.shuffle([0, 1]) : [0, 1];
    for (const v of vals) {
      const g2 = cloneGrid(grid);
      g2[r][c] = v;
      if (consistentAt(g2, n, r, c)) {
        solve(g2, [[r, c]]);
        if (found >= limit) return;
      }
    }
  }

  solve(cloneGrid(puzzle), null);
  return found;
}

// Counts solutions to `puzzle` (an n x n grid with some cells null), capped
// at `limit`. A puzzle has exactly one solution iff this returns 1. Always
// exhaustive (no node budget) -- this is the one the checker tools trust.
export function countSolutions(puzzle, n, limit = 2) {
  let count = 0;
  search(puzzle, n, limit, () => count++, {});
  return count;
}

// Like countSolutions, but gives up and returns null after `maxNodes`
// branch points rather than exhaustively proving uniqueness. Only safe to
// use for "should I remove this given?" decisions during generation, where
// giving up just means keeping a given rather than ever claiming a wrong
// answer -- never use this to certify a puzzle that will actually ship.
export function countSolutionsBounded(puzzle, n, limit, maxNodes) {
  let count = 0;
  try {
    search(puzzle, n, limit, () => count++, { maxNodes });
  } catch (e) {
    if (e instanceof BudgetExceeded) return null;
    throw e;
  }
  return count;
}

// The first solution found, or null if the puzzle has none. Pass `rng` to
// get a randomized solution when `puzzle` is empty (grid generation);
// leave it out to deterministically solve an existing puzzle.
export function findSolution(puzzle, n, rng = null) {
  let solution = null;
  search(puzzle, n, 1, (g) => (solution = g), { rng });
  return solution;
}

// True if `grid` is a complete, fully valid solution (every rule holds).
export function isValidSolution(grid, n) {
  if (!isComplete(grid)) return false;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!consistentAt(grid, n, r, c)) return false;
  return true;
}

// ---- Simple solving techniques ------------------------------------------------
//
// The techniques taught on the worksheet: forced cells from a run of two
// matching neighbors, or from a row/column that already has half its
// zeros or ones. Repeated to a fixpoint. No guessing/backtracking. Used to
// grade "easy" puzzles: an easy puzzle must be fully solvable this way.

export function simpleSolve(puzzle, n) {
  const grid = cloneGrid(puzzle);
  const half = n / 2;
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== null) continue;
        const forced = forcedValue(grid, n, r, c, half);
        if (forced !== null) {
          grid[r][c] = forced;
          changed = true;
        }
      }
    }
  }
  return { grid, solved: isComplete(grid) };
}
