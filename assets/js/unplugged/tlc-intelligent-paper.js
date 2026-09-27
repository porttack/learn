// DOM-free logic for "The Paper That Never Loses" (_unplugged/tlc-intelligent-paper.md),
// adapted from Teaching London Computing's "Intelligent Piece of Paper" activity.
//
// Board indices:
//   0 1 2
//   3 4 5
//   6 7 8
// X is "the Paper" (always goes first). O is "the Human".
//
// This module encodes the printed algorithm exactly as worded on the sheet,
// so tools/check_tlc.mjs can brute-force every possible human reply (and
// every place the algorithm itself leaves ambiguous, like "a free corner")
// and confirm the Paper never loses a game.

export const CORNERS = [0, 2, 6, 8];
export const SIDES = [1, 3, 5, 7];
export const CENTER = 4;
export const OPPOSITE_CORNER = { 0: 8, 2: 6, 6: 2, 8: 0 };

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

export function emptyCells(board) {
  const out = [];
  for (let i = 0; i < 9; i++) if (board[i] === null) out.push(i);
  return out;
}

export function freeCorners(board) {
  return CORNERS.filter((c) => board[c] === null);
}

// A line with exactly two `mark`s and one empty space: returns that empty
// space, or null if no such line exists. If more than one line qualifies,
// returns every candidate space (the algorithm just says "go in that
// space", so a real Paper could pick any of them).
export function winningOrBlockingSpaces(board, mark) {
  const spaces = new Set();
  for (const line of LINES) {
    const marks = line.filter((i) => board[i] === mark);
    const blanks = line.filter((i) => board[i] === null);
    if (marks.length === 2 && blanks.length === 1) spaces.add(blanks[0]);
  }
  return [...spaces];
}

export function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return null;
}

// Every legal choice the Paper could make for move number `moveNumber`
// (1-5), given the board just before that move. Returns an array of
// candidate cell indices -- more than one when the printed algorithm's
// wording ("a free corner", "that space") doesn't pin down a single cell.
export function paperChoices(board, moveNumber) {
  if (moveNumber === 1) {
    // Any corner works by the board's symmetry; fixing one is enough
    // once the checker enumerates every human reply from there.
    return [CORNERS[0]];
  }
  if (moveNumber === 2) {
    const firstMove = CORNERS.find((c) => board[c] === "X");
    const opposite = OPPOSITE_CORNER[firstMove];
    if (board[opposite] === null) return [opposite];
    return freeCorners(board);
  }
  if (moveNumber === 3 || moveNumber === 4) {
    const winSpaces = winningOrBlockingSpaces(board, "X");
    if (winSpaces.length) return winSpaces;
    const blockSpaces = winningOrBlockingSpaces(board, "O");
    if (blockSpaces.length) return blockSpaces;
    const corners = freeCorners(board);
    if (corners.length) return corners;
    // No free corner left this late is not supposed to happen in a real
    // game, but fall back to any empty cell rather than throwing.
    return emptyCells(board);
  }
  if (moveNumber === 5) {
    return emptyCells(board);
  }
  throw new Error(`paperChoices: no move ${moveNumber}`);
}

// Full minimax over the (small) tic-tac-toe game tree, used only by
// tools/check_tlc.mjs to verify Part 2's printed hint ("if the Human takes
// a corner first, try taking the center"). Returns the game's value from
// X's point of view assuming perfect play by both sides from here on:
// 1 if X can force a win, -1 if O can force a win, 0 if best play draws.
export function minimax(board, turn) {
  const w = winner(board);
  if (w === "X") return 1;
  if (w === "O") return -1;
  const empties = emptyCells(board);
  if (empties.length === 0) return 0;

  if (turn === "X") {
    let best = -Infinity;
    for (const cell of empties) {
      const next = board.slice();
      next[cell] = "X";
      best = Math.max(best, minimax(next, "O"));
    }
    return best;
  }
  let best = Infinity;
  for (const cell of empties) {
    const next = board.slice();
    next[cell] = "O";
    best = Math.min(best, minimax(next, "X"));
  }
  return best;
}
