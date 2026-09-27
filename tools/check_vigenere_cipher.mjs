// Verifies the Vigenere cipher activity's puzzle logic and the fixed
// worksheet's answer key.
//
//   node tools/check_vigenere_cipher.mjs            fixed worksheet + 300 generated sets
//   node tools/check_vigenere_cipher.mjs --gen 50   fewer generated sets
//
// Fixed worksheet content lives in _data/unplugged/vigenere_fixed.yml. YAML
// is converted with Ruby (already required by Jekyll) so this needs no npm
// packages, matching tools/check_caesar_cipher.mjs.
import { execFileSync } from "node:child_process";
import { encrypt, decrypt, isValidKeyword } from "../assets/js/unplugged/vigenere.js";
import { PHRASES, KEYWORDS, generateSet } from "../assets/js/unplugged/vigenere-gen.js";
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

// ---- 1. The worked example on the page itself -------------------------------

{
  const got = encrypt("HELLO", "KEY");
  if (got !== "RIJVS") fail("worked example", `encrypt("HELLO", "KEY") = "${got}", page says "RIJVS"`);
  if (decrypt(got, "KEY") !== "HELLO") fail("worked example", "decrypt(encrypt(HELLO)) != HELLO");
}

// ---- 2. The keyword bank: letters only, no duplicates -----------------------

const seenKeywords = new Set();
for (const kw of KEYWORDS) {
  if (!isValidKeyword(kw)) fail("keyword bank", `"${kw}" is not letters-only A-Z`);
  if (seenKeywords.has(kw)) fail("keyword bank", `duplicate keyword "${kw}"`);
  seenKeywords.add(kw);
}
if (KEYWORDS.length < 8) fail("keyword bank", `only ${KEYWORDS.length} keywords, want 8+`);
console.log(`${KEYWORDS.length} keywords checked (letters only, no duplicates)`);

// ---- 3. Round-trip every phrase under every keyword -------------------------

for (const phrase of PHRASES) {
  for (const kw of KEYWORDS) {
    const cipher = encrypt(phrase, kw);
    const back = decrypt(cipher, kw);
    if (back !== phrase.toUpperCase()) fail(`roundtrip phrase "${phrase}" keyword ${kw}`, `got "${back}"`);
  }
}
console.log(`${PHRASES.length} phrases x ${KEYWORDS.length} keywords round-tripped`);

// ---- 4. No accidental duplicates in the (shared) phrase bank ----------------

const seenPhrases = new Set();
for (const p of PHRASES) {
  if (seenPhrases.has(p)) fail("phrase bank", `duplicate phrase "${p}"`);
  seenPhrases.add(p);
}
if (PHRASES.length < 40) fail("phrase bank", `only ${PHRASES.length} phrases, want 40+`);

// ---- 5. The frozen fixed worksheet -------------------------------------------

const fixed = loadYaml("../_data/unplugged/vigenere_fixed.yml");
if (!isValidKeyword(fixed.decode.keyword)) fail("vigenere_fixed.yml", `keyword "${fixed.decode.keyword}" is not letters-only A-Z`);
for (const [i, m] of fixed.decode.messages.entries()) {
  const gotCipher = encrypt(m.plain, fixed.decode.keyword);
  if (gotCipher !== m.cipher) fail(`vigenere_fixed.yml decode #${i + 1}`, `encrypt(plain, ${fixed.decode.keyword}) = "${gotCipher}", yml says "${m.cipher}"`);
  const gotPlain = decrypt(m.cipher, fixed.decode.keyword);
  if (gotPlain !== m.plain) fail(`vigenere_fixed.yml decode #${i + 1}`, `decrypt(cipher, ${fixed.decode.keyword}) = "${gotPlain}", yml says "${m.plain}"`);
  if (!PHRASES.includes(m.plain)) fail(`vigenere_fixed.yml decode #${i + 1}`, `"${m.plain}" is not in the phrase bank`);
}
console.log(`vigenere_fixed.yml: ${fixed.decode.messages.length} decode messages checked`);

// ---- 6. Generated sets, many seeds, both modes -------------------------------

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const mode of ["decode", "encode"]) {
  for (let seed = 10000; seed < 10000 + n / 2; seed++) {
    const puzzle = generateSet(makeRng(seed), { mode, count: 5 });
    total++;
    if (!isValidKeyword(puzzle.keyword)) fail(`gen ${mode} seed ${seed}`, `keyword "${puzzle.keyword}" is not letters-only A-Z`);
    if (!KEYWORDS.includes(puzzle.keyword)) fail(`gen ${mode} seed ${seed}`, `keyword "${puzzle.keyword}" not in keyword bank`);
    for (const it of puzzle.items) {
      if (!PHRASES.includes(it.plain)) fail(`gen ${mode} seed ${seed}`, `"${it.plain}" not in phrase bank`);
      if (encrypt(it.plain, puzzle.keyword) !== it.cipher) fail(`gen ${mode} seed ${seed}`, `encrypt(plain) != cipher for "${it.plain}"`);
      if (decrypt(it.cipher, puzzle.keyword) !== it.plain) fail(`gen ${mode} seed ${seed}`, `decrypt(encrypt(m)) != m for "${it.plain}"`);
    }
  }
}
console.log(`${total} generated sets checked (decode / encode) in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all Vigenere cipher answer keys match the simulator");
process.exit(failures ? 1 : 0);
