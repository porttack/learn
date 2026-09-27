// Solo Battleship (Bimaru) core: fleet placement search, solution counting,
// and from-scratch validation. A puzzle is a hidden fleet on an n x n grid,
// known only by how many ship squares sit in each row and column (plus a
// few given squares). There's no orientation hint on any square: a student
// (and the solver) only ever sees "ship" or "water," never "this is the
// left end of a horizontal ship."
//
// Grid values: 1 = ship, 0 = water, null = unknown (a given's blank).
//
// DOM-free on purpose: tools/check_solo_battleship.mjs imports this in Node
// to prove every fixed and generated puzzle has exactly one solution.

// ---- Grid text format ---------------------------------------------------
//
// One row per line, one character per cell, no separators:
//   S    given ship square
//   w    given water square
//   .    blank (to be solved)
// A solved grid (no blanks) uses only S and w.

export function parseGiven(text) {
  const rows = String(text)
    .trim()
    .split("\n")
    .map((r) => r.trim());
  const n = rows.length;
  return rows.map((row, r) => {
    if (row.length !== n) throw new Error(`Row ${r + 1} has ${row.length} cells, expected ${n}`);
    return row.split("").map((ch) => {
      if (ch === "S") return 1;
      if (ch === "w") return 0;
      if (ch === "." || ch === "_") return null;
      throw new Error(`Unknown cell "${ch}" in row ${r + 1}`);
    });
  });
}

export function gridToText(grid) {
  return grid.map((row) => row.map((v) => (v === 1 ? "S" : v === 0 ? "w" : ".")).join("")).join("\n");
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function emptyGrid(n) {
  return Array.from({ length: n }, () => Array(n).fill(null));
}

export function rowCountsOf(grid) {
  return grid.map((row) => row.reduce((s, v) => s + (v === 1 ? 1 : 0), 0));
}

export function colCountsOf(grid) {
  const n = grid.length;
  return Array.from({ length: n }, (_, c) => grid.reduce((s, row) => s + (row[c] === 1 ? 1 : 0), 0));
}

// Every cell adjacent to (r, c), including diagonally.
function neighborhood(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) out.push([r + dr, c + dc]);
  return out;
}

// ---- From-scratch validation ---------------------------------------------
//
// Re-derives every legality rule from a plain ship/water grid: connected
// ship groups must each be a straight line, no two groups may touch (even
// diagonally), and the sizes must match the fleet exactly. This never
// trusts that the placement search or a hand-frozen YAML solution got it
// right; it checks the finished grid the same way a person would.

function shipComponents(n, grid) {
  const seen = Array.from({ length: n }, () => Array(n).fill(false));
  const comps = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 1 || seen[r][c]) continue;
      const cells = [];
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length) {
        const [rr, cc] = stack.pop();
        cells.push([rr, cc]);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = rr + dr, nc = cc + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 1 && !seen[nr][nc]) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      comps.push(cells);
    }
  }
  return comps;
}

function isStraightRun(cells) {
  if (cells.length === 1) return true;
  const sorted = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const sameRow = sorted.every(([r]) => r === sorted[0][0]);
  const sameCol = sorted.every(([, c]) => c === sorted[0][1]);
  if (sameRow) {
    const cols = sorted.map(([, c]) => c);
    return cols.every((c, i) => i === 0 || c === cols[i - 1] + 1);
  }
  if (sameCol) {
    const rows = sorted.map(([r]) => r);
    return rows.every((r, i) => i === 0 || r === rows[i - 1] + 1);
  }
  return false;
}

function componentsTouch(a, b) {
  const setB = new Set(b.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of a) for (const [nr, nc] of neighborhood(r, c)) if (setB.has(`${nr},${nc}`)) return true;
  return false;
}

// Returns a list of problem strings for a *complete* ship/water grid;
// legal iff empty. Doesn't check row/col counts -- see validateCounts.
export function validateSolution(n, grid, fleet) {
  const errors = [];
  const comps = shipComponents(n, grid);
  const gotLens = comps.map((c) => c.length).sort((a, b) => b - a);
  const wantLens = [...fleet].sort((a, b) => b - a);
  if (JSON.stringify(gotLens) !== JSON.stringify(wantLens)) {
    errors.push(`Ship sizes [${gotLens.join(",")}] don't match fleet [${wantLens.join(",")}]`);
  }
  comps.forEach((cells, i) => {
    if (!isStraightRun(cells)) errors.push(`Ship ${i} isn't a straight, contiguous line`);
  });
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      if (componentsTouch(comps[i], comps[j])) errors.push(`Ships ${i} and ${j} touch`);
    }
  }
  return errors;
}

// A solved grid's own row/col counts must match the counts printed on the
// puzzle, and every given square must agree with the solution.
export function validateCounts(n, grid, rowCounts, colCounts) {
  const errors = [];
  const gotRows = rowCountsOf(grid);
  const gotCols = colCountsOf(grid);
  for (let r = 0; r < n; r++) if (gotRows[r] !== rowCounts[r]) errors.push(`Row ${r} has ${gotRows[r]} ship squares, label says ${rowCounts[r]}`);
  for (let c = 0; c < n; c++) if (gotCols[c] !== colCounts[c]) errors.push(`Column ${c} has ${gotCols[c]} ship squares, label says ${colCounts[c]}`);
  return errors;
}

export function validateGiven(n, given, solution) {
  const errors = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (given[r][c] !== null && given[r][c] !== solution[r][c]) {
        errors.push(`Given square (${r},${c})=${given[r][c]} doesn't match the recorded solution`);
      }
    }
  }
  return errors;
}

// ---- Placement search -----------------------------------------------------
//
// Rather than fill cells one at a time, the search places whole ships: for
// each length in the fleet (grouped, longest first) it tries every straight
// position that doesn't overlap or touch an already-placed ship, isn't
// blocked by a given water square, and doesn't push any row or column past
// its target count. Ships of the same length are only ever tried in
// increasing position order, so the same finished grid is never counted
// twice under two different "which ship is which" labelings.

function candidatePlacements(n, length) {
  const cands = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c + length <= n; c++) {
      cands.push(Array.from({ length }, (_, i) => [r, c + i]));
    }
  }
  if (length > 1) {
    for (let r = 0; r + length <= n; r++) {
      for (let c = 0; c < n; c++) {
        cands.push(Array.from({ length }, (_, i) => [r + i, c]));
      }
    }
  }
  return cands.map((cells) => {
    const mask = cells.map(([r, c]) => r * n + c);
    const neighMask = new Set();
    for (const [r, c] of cells) {
      for (const [nr, nc] of neighborhood(r, c)) {
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) neighMask.add(nr * n + nc);
      }
    }
    return { cells, mask, neighMask: [...neighMask] };
  });
}

const placementCache = new Map();
function placementsFor(n, length) {
  const key = `${n}:${length}`;
  if (!placementCache.has(key)) placementCache.set(key, candidatePlacements(n, length));
  return placementCache.get(key);
}

// Thrown to unwind the search the instant a node budget is exhausted.
class BudgetExceeded {}

// Counts grids consistent with `given` (an n x n array with some nulls),
// `rowCounts`/`colCounts`, and `fleet`, stopping once `limit` are found.
// `maxNodes`, if given, caps how many candidate placements the search will
// try before giving up (returns null rather than a possibly-wrong count).
// Omit it for the exhaustive count the checker trusts.
function search(n, rowCounts, colCounts, given, fleet, limit, { rng, maxNodes, onSolution } = {}) {
  const sortedFleet = [...fleet].sort((a, b) => b - a);
  const lengths = [...new Set(sortedFleet)];
  const cands = new Map(lengths.map((L) => [L, rng ? rng.shuffle(placementsFor(n, L)) : placementsFor(n, L)]));

  const givenShip = [];
  const givenWaterMask = new Set();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (given && given[r][c] === 1) givenShip.push(r * n + c);
      else if (given && given[r][c] === 0) givenWaterMask.add(r * n + c);
    }
  }

  let found = 0;
  let nodes = 0;
  const occupied = new Set();
  // Reference counts, not a Set: two ships that don't touch each other can
  // still share a forbidden buffer cell between them (e.g. the empty row
  // separating two horizontal ships forbids the same cell from both sides),
  // so removing one ship on backtrack must not un-forbid a cell the other
  // ship still needs forbidden.
  const forbidCount = new Array(n * n).fill(0);
  const rowCnt = new Array(n).fill(0);
  const colCnt = new Array(n).fill(0);

  function finish() {
    for (const g of givenShip) if (!occupied.has(g)) return;
    found++;
    if (onSolution) {
      const grid = emptyGrid(n);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) grid[r][c] = occupied.has(r * n + c) ? 1 : 0;
      onSolution(grid);
    }
  }

  function rec(idx, prevIdx) {
    if (found >= limit) return;
    if (idx === sortedFleet.length) {
      finish();
      return;
    }
    const L = sortedFleet[idx];
    const sameAsPrev = idx > 0 && sortedFleet[idx - 1] === L;
    const list = cands.get(L);
    const from = sameAsPrev ? prevIdx + 1 : 0;
    for (let i = from; i < list.length; i++) {
      if (maxNodes && ++nodes > maxNodes) throw new BudgetExceeded();
      const cand = list[i];
      let ok = true;
      for (const m of cand.mask) {
        if (forbidCount[m] > 0 || givenWaterMask.has(m)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (const [r, c] of cand.cells) {
        rowCnt[r]++;
        colCnt[c]++;
        if (rowCnt[r] > rowCounts[r] || colCnt[c] > colCounts[c]) ok = false;
      }
      if (ok) {
        for (const m of cand.mask) occupied.add(m);
        for (const m of cand.mask) forbidCount[m]++;
        for (const m of cand.neighMask) forbidCount[m]++;
        rec(idx + 1, i);
        for (const m of cand.mask) occupied.delete(m);
        for (const m of cand.mask) forbidCount[m]--;
        for (const m of cand.neighMask) forbidCount[m]--;
      }
      // Undo exactly what was added above, cell for cell (a ship can visit
      // the same row/column more than once, so this must mirror the
      // increments one for one, not just once per distinct row/col).
      for (const [r, c] of cand.cells) {
        rowCnt[r]--;
        colCnt[c]--;
      }
      if (found >= limit) return;
    }
  }

  try {
    rec(0, -1);
  } catch (e) {
    if (e instanceof BudgetExceeded) return null;
    throw e;
  }
  return found;
}

// Exhaustive (no node budget). A puzzle has exactly one solution iff this
// returns 1. This is the one tools/check_solo_battleship.mjs trusts.
export function countSolutions(n, rowCounts, colCounts, given, fleet, limit = 2) {
  return search(n, rowCounts, colCounts, given, fleet, limit);
}

// Like countSolutions, but gives up and returns null after `maxNodes`
// candidate placements rather than exhaustively proving uniqueness. Only
// safe to use for "do I need another given?" decisions while generating --
// treating null the same as "not yet unique" can never ship a wrong puzzle,
// it can only add a given that turns out not to have been strictly needed.
export function countSolutionsBounded(n, rowCounts, colCounts, given, fleet, limit, maxNodes) {
  return search(n, rowCounts, colCounts, given, fleet, limit, { maxNodes });
}

// The first solution found, in random order (`rng`) or search order.
export function findSolution(n, rowCounts, colCounts, given, fleet, { rng } = {}) {
  let solution = null;
  search(n, rowCounts, colCounts, given, fleet, 1, { rng, onSolution: (g) => (solution = g) });
  return solution;
}

// A random legal full fleet placement with no count targets at all (used
// to build a fresh solution to generate a puzzle from). Places ships
// greedily at random legal positions, restarting the whole attempt if a
// later ship has nowhere left to go.
export function randomFleetPlacement(rng, n, fleet) {
  const sortedFleet = [...fleet].sort((a, b) => b - a);
  for (let attempt = 0; attempt < 500; attempt++) {
    const grid = emptyGrid(n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) grid[r][c] = 0;
    const forbidden = new Set();
    let ok = true;
    for (const len of sortedFleet) {
      let placed = null;
      for (let tries = 0; tries < 300 && !placed; tries++) {
        const horizontal = len === 1 || rng.chance(0.5);
        const maxR = horizontal ? n - 1 : n - len;
        const maxC = horizontal ? n - len : n - 1;
        if (maxR < 0 || maxC < 0) continue;
        const r = rng.int(0, maxR);
        const c = rng.int(0, maxC);
        const cells = Array.from({ length: len }, (_, i) => (horizontal ? [r, c + i] : [r + i, c]));
        if (cells.some(([rr, cc]) => forbidden.has(rr * n + cc))) continue;
        placed = cells;
      }
      if (!placed) {
        ok = false;
        break;
      }
      for (const [rr, cc] of placed) {
        grid[rr][cc] = 1;
        for (const [nr, nc] of neighborhood(rr, cc)) {
          if (nr >= 0 && nr < n && nc >= 0 && nc < n) forbidden.add(nr * n + nc);
        }
        forbidden.add(rr * n + cc);
      }
    }
    if (ok) return grid;
  }
  throw new Error(`Couldn't place fleet [${fleet.join(",")}] on a ${n} by ${n} grid after many attempts`);
}

// ---- Simple solving techniques --------------------------------------------
//
// The two techniques taught on the worksheet, repeated to a fixpoint, no
// guessing: a row/column already showing its full ship count has every
// other square in it as water; a row/column whose remaining blanks exactly
// fill its remaining count has every one of those blanks as a ship; and any
// square diagonally touching a known ship square is water, since ships
// never touch corner to corner. Used to grade "easy": an easy puzzle must
// be fully solvable this way, with no placement search at all.
export function simpleSolve(n, rowCounts, colCounts, given) {
  const grid = cloneGrid(given);
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < n; r++) {
      let ship = 0;
      const blanks = [];
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 1) ship++;
        else if (grid[r][c] === null) blanks.push(c);
      }
      if (!blanks.length) continue;
      if (ship === rowCounts[r]) {
        for (const c of blanks) grid[r][c] = 0;
        changed = true;
      } else if (ship + blanks.length === rowCounts[r]) {
        for (const c of blanks) grid[r][c] = 1;
        changed = true;
      }
    }
    for (let c = 0; c < n; c++) {
      let ship = 0;
      const blanks = [];
      for (let r = 0; r < n; r++) {
        if (grid[r][c] === 1) ship++;
        else if (grid[r][c] === null) blanks.push(r);
      }
      if (!blanks.length) continue;
      if (ship === colCounts[c]) {
        for (const r of blanks) if (grid[r][c] === null) { grid[r][c] = 0; changed = true; }
      } else if (ship + blanks.length === colCounts[c]) {
        for (const r of blanks) if (grid[r][c] === null) { grid[r][c] = 1; changed = true; }
      }
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== 1) continue;
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === null) {
            grid[nr][nc] = 0;
            changed = true;
          }
        }
      }
    }
  }
  return { grid, solved: grid.every((row) => row.every((v) => v !== null)) };
}

// Adds true-value givens (read from `solution`), one random still-blank
// square at a time, until the puzzle (rowCounts/colCounts + fleet + givens
// so far) has exactly one solution -- forcing uniqueness the same way a
// real Bimaru setter does, rather than hoping the counts alone are enough.
// Uses a bounded search each round for speed; the caller should re-certify
// the final result with the unbounded countSolutions before shipping it.
export function addGivensForUniqueness(rng, n, rowCounts, colCounts, fleet, solution, { budget = 6000, maxGivens } = {}) {
  const given = emptyGrid(n);
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  const order = rng.shuffle(cells);
  const cap = maxGivens ?? cells.length;
  let idx = 0;
  let count = countSolutionsBounded(n, rowCounts, colCounts, given, fleet, 2, budget);
  while (count !== 1) {
    if (idx >= order.length || idx >= cap) return null;
    const [r, c] = order[idx++];
    given[r][c] = solution[r][c];
    count = countSolutionsBounded(n, rowCounts, colCounts, given, fleet, 2, budget);
  }
  return given;
}

// Cleans up after addGivensForUniqueness: tries dropping each given, one at
// a time in random order, keeping the drop only if the puzzle (checked
// exhaustively, since boards this size solve in well under a second either
// way) still has exactly one solution. addGivensForUniqueness can leave a
// few more givens than strictly necessary, since it stops at the first
// order of cells that works rather than searching for the smallest set.
export function minimizeGivens(rng, n, rowCounts, colCounts, fleet, given) {
  const trimmed = cloneGrid(given);
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (trimmed[r][c] !== null) cells.push([r, c]);
  for (const [r, c] of rng.shuffle(cells)) {
    const saved = trimmed[r][c];
    trimmed[r][c] = null;
    if (countSolutions(n, rowCounts, colCounts, trimmed, fleet, 2) !== 1) trimmed[r][c] = saved;
  }
  return trimmed;
}
