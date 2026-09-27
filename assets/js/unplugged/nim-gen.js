// Generates random multi-pile Nim positions for the "binary secret"
// generator page, in the same shape the fixed practice table uses
// (_data/unplugged/nim_binary_secret.yml), so one render function draws
// both.
import { nimSum, classify, winningMove, bitWidth, toBinary, describeMove } from "./nim.js";

export const PILE_COUNTS = {
  3: { label: "3 piles" },
  4: { label: "4 piles" },
};

function randomPosition(rng, pileCount, maxSize) {
  const piles = [];
  for (let i = 0; i < pileCount; i++) piles.push(rng.int(1, maxSize));
  return piles;
}

// One question: a random position, built to a target win/lose outcome so a
// set isn't accidentally all wins or all losses. Tries a bounded number of
// draws, then gives up on the target and takes whatever it drew last.
function buildPosition(rng, pileCount, maxSize, wantWin) {
  let piles = randomPosition(rng, pileCount, maxSize);
  for (let attempt = 0; attempt < 60; attempt++) {
    if ((classify(piles) === "win") === wantWin) break;
    piles = randomPosition(rng, pileCount, maxSize);
  }
  return piles;
}

export function makeQuestion(rng, { pileCount = 4, maxSize = 15, wantWin = true } = {}) {
  const piles = buildPosition(rng, pileCount, maxSize, wantWin);
  const sum = nimSum(piles);
  const move = winningMove(piles);
  const width = bitWidth(piles);
  return {
    piles,
    binary: piles.map((p) => toBinary(p, width)),
    sumBinary: toBinary(sum, width),
    sum,
    answer: classify(piles),
    move,
    moveText: describeMove(move),
  };
}

// A whole set. Question i draws from its own forked generator, so changing
// the count doesn't reshuffle earlier questions, and alternates the target
// win/lose so the set is a mix rather than a coin flip that happens to run
// long in one direction.
export function generateSet(rng, { pileCount = 4, maxSize = 15, count = 8 } = {}) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    const r = rng.fork(i + 1);
    qs.push(makeQuestion(r, { pileCount, maxSize, wantWin: i % 2 === 0 }));
  }
  return qs;
}
