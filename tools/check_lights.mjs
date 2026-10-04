// Verifies the message-in-lights generator: every letter round-trips, and
// every message in the ASCII bank (which the generator draws from) encodes
// and decodes back to itself.
//   node tools/check_lights.mjs
import { execFileSync } from "node:child_process";
import { letterBits, bitsToLetter, encodeMessage, decodeRows } from "../assets/js/unplugged/lights.js";

let failures = 0;
for (let n = 1; n <= 26; n++) {
  const ch = String.fromCharCode(96 + n);
  if (bitsToLetter(letterBits(ch)) !== ch) { failures++; console.log(`FAIL letter ${ch}`); }
}
const bank = JSON.parse(execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json",
  new URL("../_data/unplugged/ascii_bank.yml", import.meta.url).pathname]));
const texts = [...bank.jokes.map((j) => j.punchline), ...bank.words];
for (const t of texts) {
  const back = decodeRows(encodeMessage(t));
  if (back !== t.toLowerCase()) { failures++; console.log(`FAIL "${t}" -> "${back}"`); }
}
console.log(`26 letters and ${texts.length} bank messages checked`);
console.log(failures ? `${failures} failure(s)` : "all light messages round-trip");
process.exit(failures ? 1 : 0);
