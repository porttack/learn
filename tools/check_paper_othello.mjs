// Verifies the Paper Othello worksheet: the worked capture example, that
// the Paper's program always picks exactly one legal move, and that the
// Paper wins most games against a random opponent but not all of them --
// that last part is the whole point of the sheet, so it must be true.
//
//   node tools/check_paper_othello.mjs            (2000 games each matchup)
//   node tools/check_paper_othello.mjs --games 500
import {
  initialBoard,
  legalMoves,
  applyMove,
  flipsFor,
  paperMove,
  playGame,
  countDiscs,
  squareName,
  BLACK,
  WHITE,
} from "../assets/js/unplugged/othello.js";

let failures = 0;
function assertEqual(label, got, want) {
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failures++;
    console.log(`FAIL ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}
function assertTrue(label, cond) {
  if (!cond) {
    failures++;
    console.log(`FAIL ${label}`);
  }
}

// ---- The worked capture example on the page -----------------------------
// "The Paper plays c2. It sandwiches the White disc at c3 between the new
// disc and the Black disc already at c4, so c3 flips."
{
  const board = initialBoard();
  const before = countDiscs(board);
  assertEqual("initial disc count", before, { black: 2, white: 2 });

  const flips = flipsFor(board, BLACK, 1, 2); // c2
  assertEqual("c2 flips", flips.map(([r, c]) => squareName(r, c)).sort(), ["c3"]);

  const after = applyMove(board, BLACK, 1, 2, flips);
  assertEqual("c2 square after", after[1][2], BLACK);
  assertEqual("c3 square after (flipped)", after[2][2], BLACK);
  // Nothing else on the board should have changed.
  let changed = 0;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (board[r][c] !== after[r][c]) changed++;
  assertEqual("squares changed by c2", changed, 2); // c2 placed, c3 flipped
}

// ---- The Paper's program always returns exactly one legal move ---------
// Checked by construction (paperMove returns a single move object, never a
// list), but confirm every move it ever proposes -- across the worked
// example and every simulated game below -- is actually legal.
function checkedPaperMove(board, player, legal) {
  const move = paperMove(board, player);
  assertTrue(
    `paper move exists when legal moves exist (${legal.length} legal)`,
    legal.length === 0 ? move === null : move !== null
  );
  if (move) {
    const isLegal = legal.some((m) => m.r === move.r && m.c === move.c);
    assertTrue(`paper's move ${squareName(move.r, move.c)} is legal`, isLegal);
  }
  return move;
}
assertEqual("Paper's first move from the start position", squareName(paperMove(initialBoard(), BLACK).r, paperMove(initialBoard(), BLACK).c), "c2");

// ---- Opponents for simulation --------------------------------------------
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPlayer(rng) {
  return (board, player, legal) => legal[Math.floor(rng() * legal.length)];
}

function greedyPlayer() {
  return (board, player, legal) => {
    let best = legal[0];
    for (const m of legal) if (m.flips.length > best.flips.length) best = m;
    return best;
  };
}

function simulate(label, opponentFactory, games) {
  let paperWins = 0;
  let paperLosses = 0;
  let ties = 0;
  for (let seed = 1; seed <= games; seed++) {
    const rng = makeRng(seed * 2654435761);
    const opp = opponentFactory(rng);
    const chooseBlack = (board, player, legal) => checkedPaperMove(board, player, legal);
    const result = playGame(chooseBlack, opp);
    if (result.black > result.white) paperWins++;
    else if (result.black < result.white) paperLosses++;
    else ties++;
  }
  const winRate = paperWins / games;
  const lossRate = paperLosses / games;
  const tieRate = ties / games;
  console.log(
    `${label}: Paper won ${paperWins}/${games} (${(winRate * 100).toFixed(1)}%), ` +
      `lost ${paperLosses} (${(lossRate * 100).toFixed(1)}%), tied ${ties} (${(tieRate * 100).toFixed(1)}%)`
  );
  return { winRate, lossRate, tieRate };
}

const games = Number(process.argv[process.argv.indexOf("--games") + 1]) || 2000;

const vsRandom = simulate("Paper (Black) vs random legal moves (White)", randomPlayer, games);
const vsGreedy = simulate("Paper (Black) vs greedy most-flips (White)", greedyPlayer, games);

// The sheet's whole lesson: the Paper is a good heuristic player (wins most
// games against a random opponent) but heuristics aren't guaranteed, so it
// must lose sometimes.
assertTrue("Paper beats random more than it loses", vsRandom.winRate > 0.5);
assertTrue("Paper does NOT win every game against random", vsRandom.winRate < 1);
assertTrue("Paper does lose at least a few games against random", vsRandom.lossRate > 0 || vsRandom.tieRate > 0);

console.log(failures ? `${failures} failure(s)` : "all checks passed");
process.exit(failures ? 1 : 0);
