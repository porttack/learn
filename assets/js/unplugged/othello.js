// 6x6 Othello: legal moves, flips, passes, game end, and "the Paper's"
// heuristic program, exactly as printed on the worksheet.
//
// DOM-free on purpose: tools/check_paper_othello.mjs imports this in Node
// to verify the worked example on the page and to simulate thousands of
// games. Board coordinates are (r, c), both 0-indexed, r = row (0 is row
// "1" on the printed sheet), c = column (0 is column "a").

export const SIZE = 6;
export const BLACK = "B";
export const WHITE = "W";

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function opponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

// Standard Othello start, scaled to 6x6: the center 2x2 block (c3, c4, d3,
// d4) with same-colored discs diagonal to each other.
export function initialBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  // Columns a-f are 0-5, rows 1-6 are 0-5. Center block is cols c,d (2,3)
  // and rows 3,4 (2,3), same-colored discs diagonal to each other:
  //   c3 = White   d3 = Black
  //   c4 = Black   d4 = White
  b[2][2] = WHITE; // c3
  b[2][3] = BLACK; // d3
  b[3][2] = BLACK; // c4
  b[3][3] = WHITE; // d4
  return b;
}

export function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

export function isCorner(r, c) {
  return (r === 0 || r === SIZE - 1) && (c === 0 || c === SIZE - 1);
}

export function isEdge(r, c) {
  const onBorder = r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
  return onBorder && !isCorner(r, c);
}

export const CORNERS = [[0, 0], [0, SIZE - 1], [SIZE - 1, 0], [SIZE - 1, SIZE - 1]];

// True if (r, c) touches an empty corner: it is one of the (up to three)
// squares next to a corner, including diagonally, and that corner is
// currently empty.
export function touchesEmptyCorner(board, r, c) {
  for (const [cr, cc] of CORNERS) {
    if (board[cr][cc] !== null) continue;
    if (Math.max(Math.abs(r - cr), Math.abs(c - cc)) === 1) return true;
  }
  return false;
}

// Cells that would flip if `player` plays at (r, c). Empty array means the
// move is not legal (Othello requires at least one flip).
export function flipsFor(board, player, r, c) {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE || board[r][c] !== null) return [];
  const opp = opponent(player);
  const flips = [];
  for (const [dr, dc] of DIRS) {
    let rr = r + dr;
    let cc = c + dc;
    const line = [];
    while (inBounds(rr, cc) && board[rr][cc] === opp) {
      line.push([rr, cc]);
      rr += dr;
      cc += dc;
    }
    if (line.length && inBounds(rr, cc) && board[rr][cc] === player) flips.push(...line);
  }
  return flips;
}

export function legalMoves(board, player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const flips = flipsFor(board, player, r, c);
      if (flips.length) moves.push({ r, c, flips });
    }
  }
  return moves;
}

export function hasLegalMove(board, player) {
  return legalMoves(board, player).length > 0;
}

// Returns a new board with the move applied. Does not check legality.
export function applyMove(board, player, r, c, flips) {
  const next = board.map((row) => row.slice());
  next[r][c] = player;
  for (const [fr, fc] of flips) next[fr][fc] = player;
  return next;
}

export function countDiscs(board) {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === BLACK) black++;
      else if (cell === WHITE) white++;
    }
  }
  return { black, white };
}

export function isGameOver(board) {
  return !hasLegalMove(board, BLACK) && !hasLegalMove(board, WHITE);
}

export function colLetter(c) {
  return "abcdef"[c];
}

export function squareName(r, c) {
  return `${colLetter(c)}${r + 1}`;
}

// ---- The Paper's program -----------------------------------------------
//
// Checked top to bottom, exactly as printed on the worksheet:
//   1. Take a legal corner move if there is one.
//   2. Cross off any legal move that touches an empty corner (even
//      diagonally) -- unless that would cross off every legal move, then
//      keep them all.
//   3. Take a legal edge move (not a corner) if one is left.
//   4. Otherwise, take the legal move that flips the most discs.
//   Tie-break: topmost row, then leftmost column.
function tieBreak(moves) {
  let best = moves[0];
  for (const m of moves.slice(1)) {
    if (m.r < best.r || (m.r === best.r && m.c < best.c)) best = m;
  }
  return best;
}

export function paperMove(board, player) {
  const moves = legalMoves(board, player);
  if (!moves.length) return null;

  const corners = moves.filter((m) => isCorner(m.r, m.c));
  if (corners.length) return tieBreak(corners);

  const safe = moves.filter((m) => !touchesEmptyCorner(board, m.r, m.c));
  const pool = safe.length ? safe : moves;

  const edges = pool.filter((m) => isEdge(m.r, m.c));
  if (edges.length) return tieBreak(edges);

  let best = [];
  let bestFlips = -1;
  for (const m of pool) {
    if (m.flips.length > bestFlips) {
      bestFlips = m.flips.length;
      best = [m];
    } else if (m.flips.length === bestFlips) {
      best.push(m);
    }
  }
  return tieBreak(best);
}

// ---- Full-game simulation (for the checker) -----------------------------

export function playGame(chooseBlack, chooseWhite, { maxMoves = 200 } = {}) {
  let board = initialBoard();
  let player = BLACK;
  let passes = 0;
  let moves = 0;
  while (passes < 2 && moves < maxMoves) {
    const legal = legalMoves(board, player);
    if (!legal.length) {
      passes++;
      player = opponent(player);
      continue;
    }
    passes = 0;
    const choose = player === BLACK ? chooseBlack : chooseWhite;
    const move = choose(board, player, legal);
    board = applyMove(board, player, move.r, move.c, move.flips);
    player = opponent(player);
    moves++;
  }
  return { board, ...countDiscs(board) };
}
