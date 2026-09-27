// Verifies the Caesar cipher activity's puzzle logic and every fixed
// worksheet's answer key.
//
//   node tools/check_caesar_cipher.mjs            fixed worksheets + 300 generated sets
//   node tools/check_caesar_cipher.mjs --gen 50   fewer generated sets
//
// Fixed worksheet content lives in _data/unplugged/cipher_*.yml. YAML is
// converted with Ruby (already required by Jekyll) so this needs no npm
// packages, matching tools/check_robot_sets.mjs.
import { execFileSync } from "node:child_process";
import { encrypt, decrypt, letterCounts, guessShiftFromFrequency, ALPHABET, KEYSPACE } from "../assets/js/unplugged/cipher.js";
import { PHRASES, PARAGRAPHS, isUnambiguous, generateSet } from "../assets/js/unplugged/cipher-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

function loadYaml(relPath) {
  const path = new URL(relPath, import.meta.url).pathname;
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", path]);
  return JSON.parse(json);
}

// ---- 1. Round-trip every phrase and paragraph under every possible key ------

for (const phrase of PHRASES) {
  for (let key = 1; key <= KEYSPACE; key++) {
    const cipher = encrypt(phrase, key);
    const back = decrypt(cipher, key);
    if (back !== phrase.toUpperCase()) fail(`roundtrip phrase "${phrase}" key ${key}`, `got "${back}"`);
  }
}
console.log(`${PHRASES.length} phrases x ${KEYSPACE} keys round-tripped`);

for (const para of PARAGRAPHS) {
  for (let key = 1; key <= KEYSPACE; key += 3) {
    const cipher = encrypt(para, key);
    const back = decrypt(cipher, key);
    if (back !== para.toUpperCase()) fail(`roundtrip paragraph key ${key}`, `mismatch`);
  }
  // E must be the most common letter, or "guess the shift from the most
  // common letter" doesn't actually work for this passage.
  const counts = letterCounts(para);
  const best = ALPHABET.split("").reduce((a, b) => (counts[b] > counts[a] ? b : a));
  if (best !== "E") fail(`paragraph frequency`, `most common letter is ${best} (${counts[best]}), not E (${counts.E}): "${para.slice(0, 40)}..."`);
}
console.log(`${PARAGRAPHS.length} paragraphs checked (round-trip + E is most common letter)`);

// ---- 2. No accidental duplicates in the phrase bank -------------------------

const seenPhrases = new Set();
for (const p of PHRASES) {
  if (seenPhrases.has(p)) fail("phrase bank", `duplicate phrase "${p}"`);
  seenPhrases.add(p);
}
if (PHRASES.length < 40) fail("phrase bank", `only ${PHRASES.length} phrases, want 40+`);

// ---- 3. Frozen fixed worksheets ---------------------------------------------

const fixed = loadYaml("../_data/unplugged/cipher_fixed.yml");
for (const [i, m] of fixed.decode.messages.entries()) {
  const gotCipher = encrypt(m.plain, fixed.decode.key);
  if (gotCipher !== m.cipher) fail(`cipher_fixed.yml decode #${i + 1}`, `encrypt(plain, ${fixed.decode.key}) = "${gotCipher}", yml says "${m.cipher}"`);
  const gotPlain = decrypt(m.cipher, fixed.decode.key);
  if (gotPlain !== m.plain) fail(`cipher_fixed.yml decode #${i + 1}`, `decrypt(cipher, ${fixed.decode.key}) = "${gotPlain}", yml says "${m.plain}"`);
  if (!PHRASES.includes(m.plain)) fail(`cipher_fixed.yml decode #${i + 1}`, `"${m.plain}" is not in the phrase bank`);
}
{
  const gotCipher = encrypt(fixed.crack.plain, fixed.crack.key);
  if (gotCipher !== fixed.crack.cipher) fail("cipher_fixed.yml crack", `encrypt mismatch: got "${gotCipher}"`);
  if (!isUnambiguous(fixed.crack.cipher)) fail("cipher_fixed.yml crack", "more than one shift produces a bank phrase: not a fair 'crack it' puzzle");
  if (!PHRASES.includes(fixed.crack.plain)) fail("cipher_fixed.yml crack", `"${fixed.crack.plain}" is not in the phrase bank`);
}
console.log(`cipher_fixed.yml: ${fixed.decode.messages.length} decode messages + 1 crack puzzle checked`);

const freq = loadYaml("../_data/unplugged/cipher_frequency.yml");
{
  const gotCipher = encrypt(freq.plain, freq.key);
  if (gotCipher !== freq.cipher) fail("cipher_frequency.yml", `encrypt(plain, ${freq.key}) mismatch`);
  const gotCounts = letterCounts(freq.cipher);
  for (const l of ALPHABET) {
    if (gotCounts[l] !== freq.counts[l]) fail("cipher_frequency.yml counts", `letter ${l}: computed ${gotCounts[l]}, yml says ${freq.counts[l]}`);
  }
  const guess = guessShiftFromFrequency(freq.cipher);
  if (guess.guessLetter !== freq.guess_letter) fail("cipher_frequency.yml", `most common letter computed as ${guess.guessLetter}, yml says ${freq.guess_letter}`);
  if (guess.key !== freq.key) fail("cipher_frequency.yml", `frequency-guessed key ${guess.key} does not match actual key ${freq.key}`);
  if (!PARAGRAPHS.includes(freq.plain)) fail("cipher_frequency.yml", "passage is not in the paragraph bank");
}
console.log("cipher_frequency.yml: passage, cipher, tally, and guessed key all checked");

// ---- 4. Generated sets, many seeds, all three modes -------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const mode of ["key", "crack", "frequency"]) {
  for (let seed = 10000; seed < 10000 + n / 3; seed++) {
    const puzzle = generateSet(makeRng(seed), { mode, count: 5 });
    total++;
    if (mode === "key") {
      for (const it of puzzle.items) {
        if (decrypt(it.cipher, puzzle.key) !== it.plain) fail(`gen key seed ${seed}`, "decrypt(encrypt(m)) != m");
        if (!PHRASES.includes(it.plain)) fail(`gen key seed ${seed}`, `"${it.plain}" not in phrase bank`);
      }
    } else if (mode === "crack") {
      if (decrypt(puzzle.cipher, puzzle.key) !== puzzle.plain) fail(`gen crack seed ${seed}`, "decrypt(encrypt(m)) != m");
      if (!isUnambiguous(puzzle.cipher)) fail(`gen crack seed ${seed}`, "ambiguous: more than one shift lands on a bank phrase");
    } else {
      if (decrypt(puzzle.cipher, puzzle.key) !== puzzle.passage) fail(`gen frequency seed ${seed}`, "decrypt(encrypt(passage)) != passage");
      if (puzzle.guess.key !== puzzle.key) fail(`gen frequency seed ${seed}`, `guessed key ${puzzle.guess.key} != actual key ${puzzle.key}`);
    }
  }
}
console.log(`${total} generated sets checked (key / crack / frequency) in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all Caesar cipher answer keys match the simulator");
process.exit(failures ? 1 : 0);
