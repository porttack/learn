// Freezes three sorting-network trace problems (two number rounds, one
// word round) into YAML, so a later change to the network or generator
// can never change a sheet that's already been printed.
//
//   node tools/freeze_sortnet.mjs [seed1] [seed2] [seed3] > _data/unplugged/sortnet_fixed.yml
//
// Re-run tools/check_sorting_network.mjs afterwards to re-verify.
import { makeRng } from "../assets/js/unplugged/rng.js";
import { generateSet } from "../assets/js/unplugged/sortnet-gen.js";

const seed1 = Number(process.argv[2]) || 40217;
const seed2 = Number(process.argv[3]) || 55031;
const seed3 = Number(process.argv[4]) || 61984;

const round1 = generateSet(makeRng(seed1), { twist: "numbers", level: "ms" })[0];
const round2 = generateSet(makeRng(seed2), { twist: "numbers", level: "ms" })[0];
const round3 = generateSet(makeRng(seed3), { twist: "words" })[0];

console.log(`# Frozen from: node tools/freeze_sortnet.mjs ${seed1} ${seed2} ${seed3}`);
console.log(JSON.stringify({ problems: [round1, round2, round3] }, null, 2));
