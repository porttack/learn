// Seeded randomness for printable puzzle generators.
//
// Every generated sheet is fully determined by its seed, and the seed is
// printed on the sheet and kept in the URL (?seed=...). That's what makes a
// printed puzzle and its answer key match, and lets a teacher reprint the
// exact same set later. Keep this module DOM-free so Node test scripts in
// tools/ can import it.

// mulberry32: tiny, fast, good enough for puzzles. Not for anything secret.
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    // Integer in [lo, hi], inclusive.
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // A child generator, so question 3 of a set doesn't change when
    // question 2's generator starts drawing more random numbers.
    fork: (salt) => makeRng((seed * 2654435761 + salt * 40503) >>> 0),
  };
  return rng;
}

// Five-digit seeds: short enough to read off paper and type back in.
export function randomSeed() {
  return 10000 + Math.floor(Math.random() * 90000);
}
