// Nim game logic: the take-away warm-up game and classic multi-pile Nim.
//
// Two independent ways to answer "who wins from here?" are kept side by
// side on purpose. nimSum()/winningMove() are the fast shortcut (binary,
// taught on the "binary secret" page). bruteForceClassify() and
// bruteForceTakeAway() re-derive the same answer by searching the whole
// game tree, with no binary math at all. tools/check_nim.mjs runs both and
// checks they agree, so a key is proven correct rather than just computed
// once and trusted.
//
// DOM-free on purpose: tools/check_nim.mjs and the Node checker import this
// directly.

// ---- Classic multi-pile Nim --------------------------------------------------
//
// Rules: on your turn, pick one pile and remove any number of stones from
// it (at least one). Whoever removes the last stone overall wins. A
// "position" is just an array of pile sizes; order doesn't change who wins,
// only which pile a move names.

export function nimSum(piles) {
  return piles.reduce((a, b) => a ^ b, 0);
}

// How many bits wide the biggest pile needs, at least 3 so small piles still
// show a few placeholder zeros.
export function bitWidth(piles) {
  const max = Math.max(3, ...piles, 1);
  return Math.max(3, max.toString(2).length);
}

export function toBinary(n, width) {
  return n.toString(2).padStart(width, "0");
}

// "win" means the player about to move can force a win with correct play.
// "lose" means any move they make hands the win to their opponent.
export function classify(piles) {
  return nimSum(piles) === 0 ? "lose" : "win";
}

// The move that leaves a nim-sum of 0 for the opponent, or null if the
// position is already a loss (nim-sum 0) and no move can do that.
// { index, from, to } means: change piles[index] from `from` down to `to`.
export function winningMove(piles) {
  const sum = nimSum(piles);
  if (sum === 0) return null;
  for (let i = 0; i < piles.length; i++) {
    const target = piles[i] ^ sum;
    if (target < piles[i]) return { index: i, from: piles[i], to: target };
  }
  // Can't happen: if the nim-sum is nonzero, some pile always has its
  // leading set bit in common with the sum, which is exactly what makes
  // target < piles[i] there.
  return null;
}

const bfCache = new Map();

// Independent check: searches every legal move from this position. A
// position is a win for the player to move if at least one move leads to a
// position that's a loss for the next player; it's a loss if every move
// leads to a win for the next player (or there are no stones left at all).
// Memoized on the sorted pile sizes, since who wins never depends on pile
// order, only on the multiset of sizes -- and generated positions often
// repeat piles once sorted, so the cache pays off across calls.
export function bruteForceClassify(piles) {
  const sorted = piles.slice().sort((a, b) => a - b);
  const key = sorted.join(",");
  if (bfCache.has(key)) return bfCache.get(key);
  let result = "lose";
  outer: for (let i = 0; i < sorted.length; i++) {
    for (let take = 1; take <= sorted[i]; take++) {
      const next = sorted.slice();
      next[i] -= take;
      if (bruteForceClassify(next) === "lose") {
        result = "win";
        break outer;
      }
    }
  }
  bfCache.set(key, result);
  return result;
}

// ---- Single-pile take-away (page 1's warm-up game) --------------------------
//
// Rules: one pile. On your turn, remove 1, 2, or 3 stones (or 1..maxTake, in
// general). Whoever removes the last stone wins.
//
// The shortcut: the losing positions are exactly the multiples of
// (maxTake + 1). If it's your turn and the pile isn't a multiple of that,
// take enough stones to make it one.

export function takeAwayClassify(n, maxTake = 3) {
  return n % (maxTake + 1) === 0 ? "lose" : "win";
}

// The number of stones to take, or null if there's no winning move (n is
// already a multiple of maxTake + 1).
export function takeAwayWinningMove(n, maxTake = 3) {
  const r = n % (maxTake + 1);
  return r === 0 ? null : r;
}

const takeAwayCache = new Map();

export function bruteForceTakeAway(n, maxTake = 3) {
  const key = `${maxTake}:${n}`;
  if (takeAwayCache.has(key)) return takeAwayCache.get(key);
  let result = "lose";
  if (n > 0) {
    for (let take = 1; take <= Math.min(maxTake, n); take++) {
      if (bruteForceTakeAway(n - take, maxTake) === "lose") {
        result = "win";
        break;
      }
    }
  }
  takeAwayCache.set(key, result);
  return result;
}

// ---- Shared text helpers -----------------------------------------------------

export const PILE_LABELS = ["A", "B", "C", "D", "E", "F"];

// "Take 4 from pile B (7 down to 3)." Used by both the fixed page's data
// and the generator's answer key so the phrasing matches everywhere.
export function describeMove(move) {
  if (!move) return "No winning move: any move you make leaves your opponent a winning position.";
  const label = PILE_LABELS[move.index] || `#${move.index + 1}`;
  const removed = move.from - move.to;
  return `Take ${removed} from pile ${label} (${move.from} down to ${move.to}).`;
}
