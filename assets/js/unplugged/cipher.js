// Caesar cipher core: shifting, letter tallies, and the standard English
// reference frequencies used to guess a shift from ciphertext alone.
//
// Every puzzle on this site's cipher pages works the same way: letters A-Z
// shift by a fixed key, wrapping from Z back to A, and spaces pass straight
// through untouched. Puzzle text is always uppercase letters and spaces only
// (no punctuation), which keeps by-hand shifting unambiguous.
//
// DOM-free on purpose: tools/check_caesar_cipher.mjs imports this in Node to
// verify every fixed worksheet and a few hundred generated puzzles.

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Every possible key other than 0 (which would leave the message unchanged).
// There are 25 of them -- small enough to brute-force by hand, which is
// itself the point of the "crack it" puzzles below.
export const KEYSPACE = 25;

const norm = (k) => ((k % 26) + 26) % 26;

export function shiftLetter(ch, key) {
  const i = ALPHABET.indexOf(ch);
  if (i < 0) return ch;
  return ALPHABET[(i + norm(key)) % 26];
}

export function encrypt(text, key) {
  const k = norm(key);
  return String(text)
    .toUpperCase()
    .split("")
    .map((ch) => shiftLetter(ch, k))
    .join("");
}

export function decrypt(text, key) {
  return encrypt(text, norm(-norm(key)));
}

// One row per key 1-25: what the text decrypts to under that key. This is
// the whole "try every shift" brute-force attack, spelled out.
export function allShifts(cipherText) {
  const out = [];
  for (let key = 1; key <= KEYSPACE; key++) out.push({ key, text: decrypt(cipherText, key) });
  return out;
}

export function letterCounts(text) {
  const counts = {};
  for (const c of ALPHABET) counts[c] = 0;
  for (const ch of String(text).toUpperCase()) if (ch in counts) counts[ch]++;
  return counts;
}

// Typical letter frequencies in English prose, as a percentage of all
// letters (not counting spaces or punctuation). Standard published figures,
// e.g. as tabulated on Wikipedia's "Letter frequency" page; not adapted from
// any single source.
export const ENGLISH_FREQ = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0,
  D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0,
  P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.10, Z: 0.07,
};

// The classic first move in frequency analysis: whatever ciphertext letter
// shows up most is probably standing in for "E", English's most common
// letter, so the gap between them is probably the key.
export function guessShiftFromFrequency(cipherText) {
  const counts = letterCounts(cipherText);
  let guessLetter = "A";
  let best = -1;
  for (const c of ALPHABET) {
    if (counts[c] > best) {
      best = counts[c];
      guessLetter = c;
    }
  }
  const key = norm(ALPHABET.indexOf(guessLetter) - ALPHABET.indexOf("E"));
  return { guessLetter, key };
}
