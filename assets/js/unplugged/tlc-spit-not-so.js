// DOM-free data + checks for _unplugged/tlc-spit-not-so.md, adapted from
// Teaching London Computing's "Spit-Not-So" activity.
//
// The whole point of the activity is that these nine words can be arranged
// in a 3x3 grid so that claiming three words that share a letter is exactly
// the same as getting three-in-a-row in tic-tac-toe. tools/check_tlc.mjs
// verifies that fact rather than assuming it.

// Grid position order matches the printed sheet:
//   NOT  IN   PAN
//   SO   SPIT AS
//   FOP  IF   FAT
export const GRID = ["NOT", "IN", "PAN", "SO", "SPIT", "AS", "FOP", "IF", "FAT"];

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

// Letters shared by every word in a line, if any (case-insensitive).
export function sharedLetters(words) {
  const letterSets = words.map((w) => new Set(w.toUpperCase()));
  const [first, ...rest] = letterSets;
  return [...first].filter((letter) => rest.every((set) => set.has(letter)));
}

function combinations3(items) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      for (let k = j + 1; k < items.length; k++) out.push([i, j, k]);
    }
  }
  return out;
}

// How many of the 8 lines pass through each grid index (3 for a corner, 2
// for a side, 4 for the center) -- used to check the tidy coincidence that
// each word's letter count matches its square's line count.
export function linesPerCell(lines = LINES) {
  const counts = new Array(9).fill(0);
  for (const line of lines) for (const i of line) counts[i]++;
  return counts;
}

// Checks that GRID really behaves like a tic-tac-toe board of words:
//  - every one of the 8 lines shares exactly one letter across all three
//    of its words (so claiming that line = claiming a common letter), and
//  - no *other* triple of words (one that isn't one of the 8 lines) also
//    shares a letter, which would let a player win "off the grid" in a way
//    the noughts-and-crosses picture doesn't show.
export function checkMagicSquare(grid = GRID) {
  const problems = [];
  const lineKey = (triple) => triple.slice().sort((a, b) => a - b).join(",");
  const lineKeys = new Set(LINES.map(lineKey));

  for (const line of LINES) {
    const words = line.map((i) => grid[i]);
    const shared = sharedLetters(words);
    if (shared.length !== 1) {
      problems.push(`line [${words.join(", ")}] shares ${shared.length} letters (${shared.join("")}), expected exactly 1`);
    }
  }

  for (const triple of combinations3(grid.map((_, i) => i))) {
    if (lineKeys.has(lineKey(triple))) continue;
    const words = triple.map((i) => grid[i]);
    const shared = sharedLetters(words);
    if (shared.length > 0) {
      problems.push(`non-line triple [${words.join(", ")}] unexpectedly shares a letter (${shared.join("")})`);
    }
  }

  return problems;
}

// Replays a claim sequence (word strings, alternating players starting
// with player 1) against the grid and returns { winner, line } or null.
export function replayOnGrid(claims, grid = GRID) {
  const owner = {}; // grid index -> 1 | 2
  claims.forEach((word, turn) => {
    const index = grid.indexOf(word);
    if (index === -1) throw new Error(`"${word}" is not one of the grid's words`);
    owner[index] = (turn % 2) + 1;
  });
  for (const line of LINES) {
    const [a, b, c] = line;
    if (owner[a] && owner[a] === owner[b] && owner[b] === owner[c]) {
      return { winner: owner[a], line: line.map((i) => grid[i]) };
    }
  }
  return null;
}
