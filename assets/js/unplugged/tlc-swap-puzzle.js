// DOM-free logic for _unplugged/tlc-swap-puzzle.md, adapted from Teaching
// London Computing's "Swap Puzzle" (frogs-and-toads) activity.
//
// A board of size 2n+1 starts as n H's, one empty square, then n T's, and
// the goal is the mirror image (n T's, empty, n H's). A piece can slide
// into an adjacent empty square, or jump a single adjacent piece (of
// either kind) into an empty square just beyond it.

export function startBoard(n) {
  return [...Array(n).fill("H"), "_", ...Array(n).fill("T")];
}

export function goalBoard(n) {
  return [...Array(n).fill("T"), "_", ...Array(n).fill("H")];
}

// All boards reachable in one legal move from `board`, each paired with a
// human-readable description of the move (used to check worked examples).
export function nextMoves(board) {
  const moves = [];
  const emptyIndex = board.indexOf("_");
  for (const from of [emptyIndex - 1, emptyIndex - 2]) {
    if (from < 0) continue;
    const distance = emptyIndex - from;
    if (distance === 1) {
      moves.push(applyMove(board, from, emptyIndex, `slide the piece in square ${from} to square ${emptyIndex}`));
    } else if (board[from + 1] !== "_") {
      moves.push(applyMove(board, from, emptyIndex, `jump the piece in square ${from} over square ${from + 1} to square ${emptyIndex}`));
    }
  }
  for (const from of [emptyIndex + 1, emptyIndex + 2]) {
    if (from >= board.length) continue;
    const distance = from - emptyIndex;
    if (distance === 1) {
      moves.push(applyMove(board, from, emptyIndex, `slide the piece in square ${from} to square ${emptyIndex}`));
    } else if (board[from - 1] !== "_") {
      moves.push(applyMove(board, from, emptyIndex, `jump the piece in square ${from} over square ${from - 1} to square ${emptyIndex}`));
    }
  }
  return moves;
}

function applyMove(board, from, to, description) {
  const next = board.slice();
  next[to] = board[from];
  next[from] = "_";
  return { board: next, description };
}

// Breadth-first search for the shortest solution. Returns the sequence of
// move descriptions (length = shortest number of moves), or null if the
// goal is unreachable (should never happen for these boards).
export function shortestSolution(n) {
  const start = startBoard(n).join("");
  const goal = goalBoard(n).join("");
  if (start === goal) return [];

  const cameFrom = new Map(); // state -> { prevState, description }
  const seen = new Set([start]);
  let frontier = [start];

  while (frontier.length) {
    const next = [];
    for (const state of frontier) {
      const board = state.split("");
      for (const move of nextMoves(board)) {
        const key = move.board.join("");
        if (seen.has(key)) continue;
        seen.add(key);
        cameFrom.set(key, { prevState: state, description: move.description });
        if (key === goal) {
          // Walk the path back to the start.
          const path = [];
          let cur = key;
          while (cur !== start) {
            const step = cameFrom.get(cur);
            path.push(step.description);
            cur = step.prevState;
          }
          return path.reverse();
        }
        next.push(key);
      }
    }
    frontier = next;
  }
  return null;
}

// Verifies a move-list a student might write out: legal from the start
// board, and ends on the goal board. Returns { ok, moves, error }.
export function verifySolution(n, descriptions) {
  let board = startBoard(n);
  for (const [i, description] of descriptions.entries()) {
    const legal = nextMoves(board);
    const match = legal.find((m) => m.description === description);
    if (!match) {
      return { ok: false, error: `move ${i + 1} ("${description}") is not legal from ${board.join("")}` };
    }
    board = match.board;
  }
  const goal = goalBoard(n).join("");
  if (board.join("") !== goal) {
    return { ok: false, error: `after ${descriptions.length} moves, board is ${board.join("")}, not the goal ${goal}` };
  }
  return { ok: true, moves: descriptions.length };
}
