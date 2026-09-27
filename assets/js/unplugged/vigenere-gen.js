// Picks keywords and messages and builds puzzle sets for the Vigenere
// cipher generator. Same schema either way a puzzle gets used: a fixed
// worksheet's front matter (see _data/unplugged/vigenere_fixed.yml) or a
// freshly generated set.
//
// DOM-free on purpose: tools/check_vigenere_cipher.mjs imports this in Node.

import { encrypt, isValidKeyword } from "./vigenere.js";
import { PHRASES } from "./cipher-gen.js";

// Reuses the Caesar cipher activity's phrase bank (assets/js/unplugged/
// cipher-gen.js) so students see the same style of short original lines
// either way, and so one bank of school-appropriate text is kept in one
// place instead of two.
export { PHRASES };

// Original keyword bank: real words, letters only, no repeats, a useful mix
// of short (easy to keep track of) and longer (harder) keywords.
export const KEYWORDS = [
  "CAT", "DOG", "SUN", "KEY", "MAP",
  "OCEAN", "ROBOT", "PIXEL", "LASER", "COMET",
  "PYTHON", "BINARY", "SENSOR", "CIRCUIT", "VOLTAGE",
  "GALAXY", "QUANTUM", "THRUSTER", "COMPILER",
];

export const MODES = {
  decode: { label: "Decode: keyword given" },
  encode: { label: "Encode: keyword given" },
};

function pickPhrases(rng, count) {
  const used = new Set();
  const items = [];
  for (let i = 0; i < count; i++) {
    let plain;
    do {
      plain = rng.pick(PHRASES);
    } while (used.has(plain) && used.size < PHRASES.length);
    used.add(plain);
    items.push(plain);
  }
  return items;
}

export function generateSet(rng, { mode = "decode", count = 5 } = {}) {
  const keyword = rng.pick(KEYWORDS);
  if (!isValidKeyword(keyword)) throw new Error(`Bad keyword in bank: "${keyword}"`);
  const plains = pickPhrases(rng, count);
  const items = plains.map((plain) => ({ plain, cipher: encrypt(plain, keyword) }));
  return { mode, keyword, items };
}
