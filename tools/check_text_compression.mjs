// Verifies every text-compression puzzle actually decodes back to its
// original text: decode(compress(x)) === x.
//
//   node tools/check_text_compression.mjs            frozen sheet + bank + 300 generated sets
//   node tools/check_text_compression.mjs --gen 50   fewer generated sets
import { execFileSync } from "node:child_process";
import { compress, decode, letterCounts } from "../assets/js/unplugged/compression.js";
import { RHYMES, FIXED_POEM, SHORT_AND_SWEET_POEM, generateSet } from "../assets/js/unplugged/compression-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;
const check = (label, original, result) => {
  const got = decode(result);
  if (got !== original) {
    failures++;
    console.log(`FAIL ${label}`);
    console.log(`  want: ${JSON.stringify(original)}`);
    console.log(`  got:  ${JSON.stringify(got)}`);
  }
};

// The frozen worksheet: recompute nothing, just confirm the FROZEN tokens
// (as printed) still decode to the original poem.
const dataPath = new URL("../_data/unplugged/text_compression_fixed.yml", import.meta.url).pathname;
const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dataPath]);
const frozen = JSON.parse(json);
check("frozen sheet", frozen.original, frozen);
console.log(`frozen sheet: ${frozen.tokens.length} tokens, ${Object.keys(frozen.boxContent).length} box(es) checked`);
if (frozen.original !== FIXED_POEM.text) {
  failures++;
  console.log("FAIL frozen sheet: _data/unplugged/text_compression_fixed.yml is stale -- re-run tools/freeze_text_compression.mjs");
}

// The "Short and Sweet" poem (a paper cross-out exercise, no rendered
// boxes): confirm the frozen letter counts the hidden key quotes are
// actually what compress() gets for the book's poem text, not hand-typed.
const sas = frozen.short_and_sweet;
if (!sas || sas.original !== SHORT_AND_SWEET_POEM.text) {
  failures++;
  console.log("FAIL short_and_sweet: frozen original text doesn't match SHORT_AND_SWEET_POEM -- re-run tools/freeze_text_compression.mjs");
} else {
  const fresh = compress(SHORT_AND_SWEET_POEM.text);
  check("short_and_sweet", SHORT_AND_SWEET_POEM.text, fresh);
  const counts = letterCounts(SHORT_AND_SWEET_POEM.text, fresh);
  if (
    counts.original !== sas.letters_original ||
    counts.kept !== sas.letters_kept ||
    counts.saved !== sas.letters_saved
  ) {
    failures++;
    console.log("FAIL short_and_sweet: frozen letter counts are stale -- re-run tools/freeze_text_compression.mjs");
    console.log(`  want: ${JSON.stringify(counts)}`);
    console.log(`  got:  ${JSON.stringify({ original: sas.letters_original, kept: sas.letters_kept, saved: sas.letters_saved })}`);
  } else {
    console.log(`short_and_sweet: ${counts.saved}/${counts.original} letters saved, matches frozen key`);
  }
}

// Every rhyme in the generator's bank, compressed fresh.
for (const [key, rhyme] of Object.entries(RHYMES)) {
  check(`bank rhyme ${key}`, rhyme.text, compress(rhyme.text));
}

// Many generated sets across both levels.
const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 300;
const t0 = Date.now();
let total = 0;
for (const level of ["ms", "hs"]) {
  for (let seed = 10000; seed < 10000 + n / 2; seed++) {
    const puzzles = generateSet(makeRng(seed), { level });
    puzzles.forEach((p) => {
      check(`${level} seed ${seed} (${p.key})`, p.original, p);
      total++;
    });
  }
}
console.log(`${total} generated puzzles checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all puzzles decode correctly");
process.exit(failures ? 1 : 0);
