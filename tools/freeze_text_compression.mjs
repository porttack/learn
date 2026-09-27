// Freezes the main text-compression worksheet's puzzle (the Pease
// Porridge Hot poem) into YAML, so a later change to the compress()
// algorithm can never change a sheet that's already been printed.
//
//   node tools/freeze_text_compression.mjs > _data/unplugged/text_compression_fixed.yml
//
// Re-run tools/check_text_compression.mjs afterwards to re-verify.
import { compress } from "../assets/js/unplugged/compression.js";
import { FIXED_POEM } from "../assets/js/unplugged/compression-gen.js";

const result = compress(FIXED_POEM.text);
const doc = {
  title: FIXED_POEM.title,
  original: FIXED_POEM.text,
  tokens: result.tokens,
  boxContent: result.boxContent,
};

console.log("# Frozen from: node tools/freeze_text_compression.mjs");
console.log(JSON.stringify(doc, null, 2));
