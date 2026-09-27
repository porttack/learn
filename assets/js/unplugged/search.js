// Linear search and binary search: the core algorithms shared by every page
// in this activity family (the fixed worksheets, their generators, and
// tools/check_search.mjs).
//
// Both functions return the same shape: { checked, found, index, count }.
//   checked  1-indexed positions, in the order they were examined
//   found    true if the target was located
//   index    the 1-indexed position of the target, or -1
//   count    checked.length, the "shot count" students record
//
// DOM-free on purpose: tools/check_search.mjs imports this in Node so every
// printed puzzle's implied answer can be verified against a real
// implementation, not just hand arithmetic.

// Checks each position from left to right, in list order, stopping the
// moment it finds a match. Doesn't assume the list is sorted -- that's the
// whole point of the comparison with binarySearch below.
export function linearSearch(list, target) {
  const checked = [];
  for (let i = 0; i < list.length; i++) {
    checked.push(i + 1);
    if (list[i] === target) return { checked, found: true, index: i + 1, count: checked.length };
  }
  return { checked, found: false, index: -1, count: checked.length };
}

// Assumes list is sorted ascending. The "middle" of a range with an even
// number of positions is defined as the lower of the two centers (round
// down), applied the same way every time the range narrows:
//   mid = lo + floor((hi - lo) / 2)
// This is the one middle rule every page in this family states and follows,
// so a student's traced-by-hand answer always matches this function.
export function binarySearch(list, target) {
  let lo = 0;
  let hi = list.length - 1;
  const checked = [];
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    checked.push(mid + 1);
    if (list[mid] === target) return { checked, found: true, index: mid + 1, count: checked.length };
    if (list[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { checked, found: false, index: -1, count: checked.length };
}

// Binary search only works when the list is actually sorted. This runs the
// exact same algorithm on whatever order it's given -- on an unsorted list
// it can easily miss a target that's really there, which is the point of
// the generator's "unsorted" mode.
export const binarySearchBlind = binarySearch;

export function isSortedAscending(list) {
  for (let i = 1; i < list.length; i++) if (list[i - 1] >= list[i]) return false;
  return true;
}

// True if `a` and `b` contain exactly the same numbers (a permutation of one
// another), regardless of order. Used to check a shuffled "round 1" row
// against its sorted "round 2" counterpart.
export function isPermutation(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export function hasUniqueValues(list) {
  return new Set(list).size === list.length;
}
