// Verifies the ASCII messages activity family.
//
//   node tools/check_ascii_messages.mjs
//
// Checks two things, both against the DOM-free logic in
// assets/js/unplugged/ascii.js (never against hand math):
//   1. _data/unplugged/ascii_bank.yml: every joke punchline and every encode
//      word is capital letters and spaces only, and round-trips through
//      encode -> decode in all three formats (decimal, binary, hex).
//   2. _data/unplugged/ascii_fixed.yml: every code shown on the three fixed
//      worksheets really does decode to its intended text, and encoding
//      that text really does produce those codes.
//
// YAML is read with Ruby (already required by Jekyll) so this needs no npm
// packages.
import { execFileSync } from "node:child_process";
import { encodeText, decodeCodes, isValidMessage, FORMATS, sentenceCase, alphabetTable } from "../assets/js/unplugged/ascii.js";

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

// codes as read back from YAML may be numbers (decimal) or strings
// (binary/hex); normalize both sides to strings before comparing.
const asStrings = (codes) => codes.map(String);

function checkRoundTrip(label, text) {
  if (!isValidMessage(text)) {
    fail(label, `"${text}" is not capital letters and spaces only`);
    return;
  }
  for (const format of FORMATS) {
    let codes, back;
    try {
      codes = encodeText(text, format);
      back = decodeCodes(codes, format);
    } catch (e) {
      fail(`${label} (${format})`, e.message);
      continue;
    }
    if (back !== text) fail(`${label} (${format})`, `encode then decode gave "${back}", expected "${text}"`);
  }
}

// ---- Bank: every joke punchline and every encode word -----------------------

const bank = loadYaml("../_data/unplugged/ascii_bank.yml");

if (!bank.jokes || bank.jokes.length < 40) {
  fail("ascii_bank.yml", `only ${bank.jokes ? bank.jokes.length : 0} jokes, want 40+`);
}
for (const [i, joke] of (bank.jokes || []).entries()) {
  checkRoundTrip(`joke #${i + 1} ("${joke.setup}")`, joke.punchline);
}
for (const [i, word] of (bank.words || []).entries()) {
  checkRoundTrip(`encode word #${i + 1}`, word);
}
console.log(`ascii_bank.yml: ${(bank.jokes || []).length} jokes, ${(bank.words || []).length} encode words checked`);

// ---- Fixed worksheets: codes on the page must match the intended text -------

const fixed = loadYaml("../_data/unplugged/ascii_fixed.yml");
let fixedCount = 0;

for (const format of FORMATS) {
  const sheet = fixed[format];
  if (!sheet) {
    fail(`ascii_fixed.yml`, `missing "${format}" sheet`);
    continue;
  }
  const items = [sheet.example, ...(sheet.messages || []), ...(sheet.encode || [])].filter(Boolean);
  for (const item of items) {
    fixedCount++;
    const label = `${format} sheet: "${item.text}"`;
    if (!isValidMessage(item.text)) {
      fail(label, `"${item.text}" is not capital letters and spaces only`);
      continue;
    }
    let decoded, encoded;
    try {
      decoded = decodeCodes(item.codes, format);
      encoded = encodeText(item.text, format);
    } catch (e) {
      fail(label, e.message);
      continue;
    }
    if (decoded !== item.text) fail(label, `the printed codes decode to "${decoded}", not "${item.text}"`);
    const wantCodes = asStrings(item.codes);
    const gotCodes = asStrings(encoded);
    if (wantCodes.join(",") !== gotCodes.join(",")) {
      fail(label, `encoding "${item.text}" gives [${gotCodes.join(", ")}], but the page shows [${wantCodes.join(", ")}]`);
    }
  }
}
console.log(`ascii_fixed.yml: ${fixedCount} fixed puzzles checked across decimal/binary/hex`);

// ---- Anchors sheet: lowercase and digits allowed, codes in hex --------------

const anchors = fixed.anchors;
if (!anchors) fail("ascii_fixed.yml", 'missing "anchors" sheet');
for (const item of anchors ? [anchors.example, ...(anchors.messages || [])] : []) {
  const label = `anchors sheet: "${item.text}"`;
  try {
    const decoded = decodeCodes(item.codes, "hex");
    const encoded = encodeText(item.text, "hex", { extended: true });
    if (decoded !== item.text) fail(label, `the printed codes decode to "${decoded}"`);
    if (asStrings(encoded).join(",") !== asStrings(item.codes).join(",")) fail(label, `encoding gives [${encoded.join(", ")}]`);
  } catch (e) {
    fail(label, e.message);
  }
}

// The generator's anchors level sentence-cases every punchline.
for (const [i, joke] of (bank.jokes || []).entries()) {
  const text = sentenceCase(joke.punchline);
  for (const format of FORMATS) {
    try {
      const back = decodeCodes(encodeText(text, format, { extended: true }), format);
      if (back !== text) fail(`joke #${i + 1} anchors (${format})`, `round trip gave "${back}"`);
    } catch (e) {
      fail(`joke #${i + 1} anchors (${format})`, e.message);
    }
  }
}

// ---- Printed chart data must match the code -----------------------------------

const chart = loadYaml("../_data/unplugged/ascii_chart.yml").rows;
const truth = alphabetTable();
if (!chart || chart.length !== truth.length) fail("ascii_chart.yml", "wrong number of rows");
else chart.forEach((row, i) => {
  const t = truth[i];
  if (row.letter !== t.letter || row.decimal !== t.decimal || row.binary !== t.binary || row.hex !== t.hex) {
    fail("ascii_chart.yml", `row ${i + 1} (${row.letter}) doesn't match ascii.js`);
  }
});
console.log(`anchors sheet, sentence-case bank, and ${chart ? chart.length : 0}-row chart checked`);

console.log(failures ? `${failures} failure(s)` : "all ASCII messages check out");
process.exit(failures ? 1 : 0);
