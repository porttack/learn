// Generates fresh binary search tree question sets: "search" (a random
// tree plus a mix of findable and missing targets) and "build" (a random
// list to insert, plus the same numbers sorted).
//
// Every generated tree is built the same way a fixed worksheet's tree is:
// run a list of numbers through bst.js's insertAll(). That's what makes
// tools/check_bst.mjs able to verify hundreds of random seeds with the
// exact same code the page uses.

import { insertAll, inorderValues, isChain } from "./bst.js";

export const SIZES = {
  small: { label: "Small tree (7 numbers)", n: 7, range: [1, 60] },
  medium: { label: "Medium tree (9 numbers)", n: 9, range: [1, 99] },
  large: { label: "Large tree (12 numbers)", n: 12, range: [1, 200] },
};

function distinctValues(rng, n, [min, max]) {
  const set = new Set();
  let guard = 0;
  while (set.size < n && guard++ < n * 50) set.add(rng.int(min, max));
  return [...set];
}

// A tree plus a mix of search targets, some in the tree and some not.
export function generateSearchSet(rng, { size = "medium", count = 5 } = {}) {
  const cfg = SIZES[size] || SIZES.medium;
  const values = rng.shuffle(distinctValues(rng, cfg.n, cfg.range));
  const root = insertAll(values);
  const present = inorderValues(root);

  const missingWanted = Math.max(1, Math.round(count * 0.35));
  const presentWanted = count - missingWanted;

  const presentPicks = rng.shuffle(present).slice(0, presentWanted);
  const missingPicks = [];
  let guard = 0;
  while (missingPicks.length < missingWanted && guard++ < 500) {
    const v = rng.int(cfg.range[0], cfg.range[1]);
    if (!present.includes(v) && !missingPicks.includes(v)) missingPicks.push(v);
  }

  const targets = rng.shuffle([...presentPicks, ...missingPicks]);
  return { values, root, targets };
}

// A list to insert in the order given, plus the same numbers sorted, so a
// student can build one tree from each order and compare shapes. Rejects
// any insertion order that happens to build a chain on its own (not just
// the sorted/reverse-sorted cases: e.g. 5, 3, 4 chains too) -- the whole
// point is to contrast a bushy tree against a chain, and a "given order"
// that's already a chain would erase that contrast.
export function generateBuildSet(rng, { size = "small" } = {}) {
  const cfg = SIZES[size] || SIZES.small;
  const n = Math.min(cfg.n, 7); // a chain of more than 7 runs off the page
  let values;
  let guard = 0;
  do {
    values = rng.shuffle(distinctValues(rng, n, cfg.range));
  } while (isChain(insertAll(values)) && guard++ < 30);
  const sorted = [...values].sort((a, b) => a - b);
  return { values, sorted };
}
