// Random sorted lists and targets for the "Trace a search: make a new list"
// generator, in the same shape the fixed worksheet uses so one renderer
// (search-render.js) draws both.
//
// DOM-free on purpose: tools/check_search.mjs imports this in Node to verify
// hundreds of generated seeds, the same way it verifies the frozen list in
// _data/unplugged/search_trace.yml.
import { linearSearch, binarySearch } from "./search.js";

export const LEVELS = {
  15: { label: "15 numbers", size: 15 },
  31: { label: "31 numbers", size: 31 },
  63: { label: "63 numbers", size: 63 },
};

export const MODES = {
  sorted: { label: "Sorted (the normal way)" },
  unsorted: { label: "Unsorted (watch binary search fail)" },
};

// A list of `size` distinct positive numbers in ascending order. Random gaps
// between them (1 to 6) so the numbers look like real data, not a plain
// count-up.
function randomSortedList(rng, size) {
  const list = [];
  let v = rng.int(1, 5);
  for (let i = 0; i < size; i++) {
    list.push(v);
    v += rng.int(1, 6);
  }
  return list;
}

// Generates one list + target pair.
//   mode "sorted"   the list stays in order; binary search works correctly.
//   mode "unsorted" the list is shuffled first, then a target is chosen (and
//     if necessary the shuffle retried) so that running the ordinary binary
//     search steps on it demonstrably gets the wrong answer -- reporting
//     "not found" for a number that really is in the list. That failure is
//     the entire point of this mode, so it's guaranteed rather than left to
//     chance.
export function generateSet(rng, { level = 15, mode = "sorted" } = {}) {
  const size = LEVELS[level] ? LEVELS[level].size : Number(level) || 15;
  const sorted = randomSortedList(rng, size);

  if (mode !== "unsorted") {
    // Present about 2 times out of 3; otherwise a target that falls between
    // two numbers, so "not found" gets practiced too.
    const present = rng.chance(2 / 3);
    let target;
    if (present) {
      target = rng.pick(sorted);
    } else {
      const i = rng.int(0, sorted.length - 2);
      target = sorted[i] + 1;
      if (sorted.includes(target)) target = sorted[i]; // exceedingly rare gap of 1; fall back to a present target
    }
    const linear = linearSearch(sorted, target);
    const binary = binarySearch(sorted, target);
    return { list: sorted, target, mode: "sorted", linear, binary };
  }

  for (let attempt = 0; attempt < 60; attempt++) {
    const shuffled = rng.shuffle(sorted);
    const target = rng.pick(sorted);
    const binary = binarySearch(shuffled, target);
    if (!binary.found) {
      const linear = linearSearch(shuffled, target);
      return { list: shuffled, target, mode: "unsorted", linear, binary };
    }
  }
  // Extremely unlikely fallback: couldn't force a failure, so at least
  // return a valid (if unremarkable) unsorted set.
  const shuffled = rng.shuffle(sorted);
  const target = rng.pick(sorted);
  return { list: shuffled, target, mode: "unsorted", linear: linearSearch(shuffled, target), binary: binarySearch(shuffled, target) };
}
