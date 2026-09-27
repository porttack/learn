// Verifies the three Teaching London Computing adaptations under
// _unplugged/tlc-*.md. Each of these activities is "self-checking" on the
// page (a game that shouldn't be lose-able, a puzzle with a target move
// count) instead of an answer key, so this script is what actually proves
// those claims are true rather than just asserted.
//
//   node tools/check_tlc.mjs
//
// Plain ES modules, no npm packages, matching tools/check_nim.mjs etc.

import {
  paperChoices,
  winner,
  emptyCells,
  minimax,
  CORNERS,
  CENTER,
} from "../assets/js/unplugged/tlc-intelligent-paper.js";
import {
  GRID,
  checkMagicSquare,
  replayOnGrid,
  linesPerCell,
} from "../assets/js/unplugged/tlc-spit-not-so.js";
import {
  shortestSolution,
  verifySolution,
} from "../assets/js/unplugged/tlc-swap-puzzle.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

// ---- The Paper That Never Loses --------------------------------------------
//
// Brute-force every possible Human reply at every turn, AND every place the
// printed algorithm itself leaves a choice open ("a free corner", "that
// space" when more than one qualifies). If any complete game ends with the
// Human (O) winning, the printed instructions are wrong.

let gamesChecked = 0;

function playOut(board, moveNumber) {
  if (winner(board) || emptyCells(board).length === 0) {
    const w = winner(board);
    gamesChecked++;
    if (w === "O") {
      fail("Intelligent Piece of Paper", `Human wins from board [${board.map((c) => c ?? ".").join("")}]`);
    }
    return;
  }

  const choices = paperChoices(board, moveNumber);
  if (!choices.length) {
    fail("Intelligent Piece of Paper", `no legal choice for move ${moveNumber} on board [${board.map((c) => c ?? ".").join("")}]`);
    return;
  }

  for (const paperCell of choices) {
    const afterPaper = board.slice();
    afterPaper[paperCell] = "X";

    if (winner(afterPaper) || emptyCells(afterPaper).length === 0) {
      playOut(afterPaper, moveNumber + 1); // records the finished game
      continue;
    }

    for (const humanCell of emptyCells(afterPaper)) {
      const afterHuman = afterPaper.slice();
      afterHuman[humanCell] = "O";
      playOut(afterHuman, moveNumber + 1);
    }
  }
}

playOut(new Array(9).fill(null), 1);
console.log(`Intelligent Piece of Paper: ${gamesChecked} complete games checked (every human reply, every ambiguous Paper choice)`);

// Part 2's printed hint ("if the Human takes a corner first, try taking the
// center") needs to hold up on its own: with perfect play by both sides
// after (Human corner, Paper center), the game should be a draw at worst
// for the Paper. Checked by full minimax rather than asserted, since we
// don't print (or test) a complete second-player program on the page.
for (const corner of CORNERS) {
  const board = new Array(9).fill(null);
  board[corner] = "X";
  board[CENTER] = "O";
  const value = minimax(board, "X"); // Human (X) to move next
  if (value > 0) {
    fail(
      "Intelligent Piece of Paper Part 2 hint",
      `after Human plays corner ${corner} and Paper answers center, perfect play still lets the Human force a win (minimax value ${value})`
    );
  }
}
console.log('Intelligent Piece of Paper Part 2: the "take the center" hint after a corner opening holds up against perfect play (never worse than a draw for the Paper)');

// ---- Spit-Not-So ------------------------------------------------------------

const gridProblems = checkMagicSquare(GRID);
if (gridProblems.length) {
  gridProblems.forEach((p) => fail("Spit-Not-So grid", p));
} else {
  console.log(`Spit-Not-So: all 8 lines share exactly one letter, and no other word triple accidentally shares one (${GRID.length} words checked)`);
}

const cellCounts = linesPerCell();
const lengthMismatches = GRID.filter((word, i) => word.length !== cellCounts[i]);
if (lengthMismatches.length) {
  fail("Spit-Not-So word/line-count match", `word(s) whose letter count doesn't match their square's line count: ${lengthMismatches.join(", ")}`);
} else {
  console.log("Spit-Not-So: every word's letter count matches how many lines pass through its square (the Challenge callout's claim)");
}

const workedExample = ["SPIT", "SO", "FAT", "NOT", "FOP", "IF", "PAN"];
const result = replayOnGrid(workedExample);
if (!result || result.winner !== 1 || result.line.slice().sort().join(",") !== ["SPIT", "FOP", "PAN"].sort().join(",")) {
  fail("Spit-Not-So worked example", `expected player 1 to win with SPIT/FOP/PAN, got ${JSON.stringify(result)}`);
} else {
  console.log("Spit-Not-So: worked example on the sheet really does end in a win for player 1 via SPIT/FOP/PAN (all share \"P\")");
}

// ---- Swap Puzzle --------------------------------------------------------

// The printed sheet's own targets, from Teaching London Computing's
// "Algorithmic Thinking Puzzle 1: Swap" (3, 5, and 7 squares).
const SWAP_TARGETS = { 1: 3, 2: 8, 3: 15 };

for (const [nStr, target] of Object.entries(SWAP_TARGETS)) {
  const n = Number(nStr);
  const path = shortestSolution(n);
  if (!path) {
    fail(`Swap puzzle n=${n}`, "no solution found at all");
    continue;
  }
  if (path.length !== target) {
    fail(`Swap puzzle n=${n}`, `shortest solution is ${path.length} moves, sheet says ${target}`);
    continue;
  }
  const check = verifySolution(n, path);
  if (!check.ok) {
    fail(`Swap puzzle n=${n}`, `BFS solution failed replay: ${check.error}`);
    continue;
  }
  console.log(`Swap puzzle n=${n} (board of ${2 * n + 1}): shortest solution is ${path.length} moves, matches the sheet, and replays legally`);
}

// The fully worked n=1 example printed on the page itself, word for word,
// so if tlc-swap-puzzle.js's move-description wording ever changes, the
// page and the checker can't silently drift apart.
const PAGE_WORKED_EXAMPLE = [
  "slide the piece in square 0 to square 1",
  "jump the piece in square 2 over square 1 to square 0",
  "slide the piece in square 1 to square 2",
];
const workedCheck = verifySolution(1, PAGE_WORKED_EXAMPLE);
if (!workedCheck.ok || workedCheck.moves !== 3) {
  fail("Swap puzzle worked example (tlc-swap-puzzle.md)", workedCheck.error || `expected 3 moves, got ${workedCheck.moves}`);
} else {
  console.log("Swap puzzle: the worked example printed on the page replays legally in exactly 3 moves");
}

// General formula check (n(n+2)) beyond the three printed boards, so the
// "harder gets easier once you see the pattern" framing on the sheet holds
// up past the boards actually printed.
for (let n = 1; n <= 5; n++) {
  const path = shortestSolution(n);
  const expected = n * (n + 2);
  if (!path || path.length !== expected) {
    fail(`Swap puzzle general formula n=${n}`, `expected n(n+2) = ${expected} moves, got ${path ? path.length : "no solution"}`);
  }
}
console.log("Swap puzzle: n(n+2) formula holds for n=1..5");

console.log(failures ? `${failures} failure(s)` : "all tlc checks passed");
process.exit(failures ? 1 : 0);
