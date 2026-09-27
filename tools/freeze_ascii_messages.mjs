// Prints codes for a message, to copy into _data/unplugged/ascii_fixed.yml
// or _data/unplugged/ascii_bank.yml by hand, instead of computing ASCII
// codes with a calculator (and getting one wrong).
//
//   node tools/freeze_ascii_messages.mjs decimal "TINY MOTH"
//   node tools/freeze_ascii_messages.mjs binary BIT
//   node tools/freeze_ascii_messages.mjs hex BOT
//
// Prints a ready-to-paste YAML snippet. Review it, then re-run
// tools/check_ascii_messages.mjs to verify the file you pasted it into.
import { encodeText } from "../assets/js/unplugged/ascii.js";

const [format, ...words] = process.argv.slice(2);
const text = words.join(" ").toUpperCase();

if (!format || !text) {
  console.error('Usage: node tools/freeze_ascii_messages.mjs <decimal|binary|hex> "<TEXT>"');
  process.exit(1);
}

const codes = encodeText(text, format);
const str = (s) => JSON.stringify(s);
const codeList = format === "decimal" ? codes.join(", ") : codes.map(str).join(", ");

console.log(`text: ${str(text)}`);
console.log(`codes: [${codeList}]`);
