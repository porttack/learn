// Freezes the main text-compression worksheet's data into YAML, so a later
// change to the compress() algorithm can never change a sheet that's
// already been printed.
//
//   node tools/freeze_text_compression.mjs > _data/unplugged/text_compression_fixed.yml
//
// Re-run tools/check_text_compression.mjs afterwards to re-verify.
//
// The "Pease Porridge Hot" poem's tokens/boxContent are frozen only so the
// hidden key's decoded text can be checked by machine (the printed page
// shows the book's own hand-drawn diagram image, not our boxes). The
// "Short and Sweet" poem is a paper cross-out exercise, so only its letter
// counts are frozen, as a benchmark the hidden key can quote.
import { compress, letterCounts } from "../assets/js/unplugged/compression.js";
import { FIXED_POEM, SHORT_AND_SWEET_POEM } from "../assets/js/unplugged/compression-gen.js";

const result = compress(FIXED_POEM.text);
const sas = compress(SHORT_AND_SWEET_POEM.text);
const sasCounts = letterCounts(SHORT_AND_SWEET_POEM.text, sas);

const doc = {
  title: FIXED_POEM.title,
  original: FIXED_POEM.text,
  tokens: result.tokens,
  boxContent: result.boxContent,
  short_and_sweet: {
    title: SHORT_AND_SWEET_POEM.title,
    original: SHORT_AND_SWEET_POEM.text,
    letters_original: sasCounts.original,
    letters_kept: sasCounts.kept,
    letters_saved: sasCounts.saved,
  },
};

console.log("# Frozen from: node tools/freeze_text_compression.mjs");
console.log(JSON.stringify(doc, null, 2));
