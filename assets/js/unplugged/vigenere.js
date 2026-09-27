// Vigenere cipher core: a repeating keyword picks a different Caesar shift
// for each letter of the message. Built directly on shiftLetter from
// cipher.js, the same single-letter shift every Caesar puzzle on this site
// uses, so a Vigenere cipher is just "many Caesar shifts, chosen by a
// keyword" rather than a new idea from scratch.
//
// Keyword letter A picks shift 0, B picks shift 1, and so on through Z at
// shift 25 -- the same order the printed Vigenere square uses for its row
// labels (_includes/unplugged/vigenere-square.html). The keyword repeats to
// cover the whole message; a space passes straight through unchanged and,
// like the Caesar puzzles, does not use up a keyword letter.
//
// DOM-free on purpose: tools/check_vigenere_cipher.mjs imports this in Node
// to verify every fixed worksheet and a few hundred generated puzzles.

import { ALPHABET, shiftLetter } from "./cipher.js";

export function isValidKeyword(keyword) {
  const k = String(keyword || "").toUpperCase();
  return k.length > 0 && /^[A-Z]+$/.test(k);
}

export function keywordShifts(keyword) {
  if (!isValidKeyword(keyword)) throw new Error(`Keyword must be one or more letters A-Z: "${keyword}"`);
  return String(keyword)
    .toUpperCase()
    .split("")
    .map((ch) => ALPHABET.indexOf(ch));
}

function transform(text, keyword, sign) {
  const shifts = keywordShifts(keyword);
  let k = 0;
  return String(text)
    .toUpperCase()
    .split("")
    .map((ch) => {
      if (ALPHABET.indexOf(ch) < 0) return ch;
      const shift = shifts[k % shifts.length] * sign;
      k++;
      return shiftLetter(ch, shift);
    })
    .join("");
}

export function encrypt(text, keyword) {
  return transform(text, keyword, 1);
}

export function decrypt(text, keyword) {
  return transform(text, keyword, -1);
}
