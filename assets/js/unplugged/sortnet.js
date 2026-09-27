// A sorting network: a fixed wiring of "compare and swap" steps that
// always sorts six values, with several comparisons happening at the same
// time. This is the classic "odd-even transposition" network: on an even
// round, compare wires (0,1) (2,3) (4,5) at the same time; on an odd
// round, compare (1,2) (3,4) at the same time. After exactly 6 rounds the
// wires are always in order, for any starting values -- that always-works
// property is what makes it a sorting NETWORK rather than just a sort.
//
// DOM-free on purpose: tools/check_sorting_network.mjs imports this in
// Node to verify the network against every possible input order.

export const WIRE_COUNT = 6;
export const ROUND_COUNT = 6;

// One array of [top, bottom] wire-index pairs per round.
export const ROUNDS = Array.from({ length: ROUND_COUNT }, (_, r) => {
  const start = r % 2;
  const pairs = [];
  for (let i = start; i + 1 < WIRE_COUNT; i += 2) pairs.push([i, i + 1]);
  return pairs;
});

const defaultCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Runs `values` (length WIRE_COUNT) through the network. Returns the
// value on every wire after every round (roundResults[r] is all 6 wires
// once round r has finished), plus the final sorted order.
export function simulate(values, cmp = defaultCmp) {
  if (values.length !== WIRE_COUNT) {
    throw new Error(`sorting network expects ${WIRE_COUNT} values, got ${values.length}`);
  }
  let wires = values.slice();
  const roundResults = [];
  for (const pairs of ROUNDS) {
    wires = wires.slice();
    for (const [a, b] of pairs) {
      if (cmp(wires[a], wires[b]) > 0) {
        const t = wires[a];
        wires[a] = wires[b];
        wires[b] = t;
      }
    }
    roundResults.push(wires.slice());
  }
  return { roundResults, sorted: wires };
}

export function isSorted(values, cmp = defaultCmp) {
  for (let i = 0; i + 1 < values.length; i++) {
    if (cmp(values[i], values[i + 1]) > 0) return false;
  }
  return true;
}

// Highest number of comparisons that happen in the same round (used to
// answer "why is this fast").
export const MAX_PARALLEL = Math.max(...ROUNDS.map((r) => r.length));
export const TOTAL_COMPARISONS = ROUNDS.reduce((n, r) => n + r.length, 0);
