// ASCII encode/decode core for the "Secret Messages in ASCII" activity family.
//
// The main sheets use capital letters A-Z (codes 65-90) and space (32) only,
// so they fit on a small printed table a 6th grader can use without help.
// The harder "anchors" level adds lowercase a-z (97-122) and digits 0-9
// (48-57): students get only the four anchor codes below and count from
// there. Pass { extended: true } to allow those characters.
// DOM-free on purpose: tools/check_ascii_messages.mjs imports this in Node,
// and ascii-messages-generator.js imports it in the browser.

export const FIRST_CODE = 65; // "A"
export const LAST_CODE = 90; // "Z"
export const SPACE_CODE = 32;

// The only clues the "anchors" level prints: everything else is counted
// forward from one of these.
export const ANCHORS = [
  { label: "A", code: 65 },
  { label: "a", code: 97 },
  { label: "0", code: 48 },
  { label: "space", code: 32 },
];

// True only for a non-empty message in this activity's alphabet: capital
// letters and spaces, plus lowercase letters and digits when extended.
export function isValidMessage(text, { extended = false } = {}) {
  const re = extended ? /^[A-Za-z0-9 !,.?]+$/ : /^[A-Z ]+$/;
  return typeof text === "string" && text.length > 0 && re.test(text);
}

const inRange = (code, lo, hi) => code >= lo && code <= hi;
// The four punctuation marks the sheets teach: ! , . ?
export const PUNCTUATION = { "!": 33, ",": 44, ".": 46, "?": 63 };
const isKnownCode = (code) =>
  code === SPACE_CODE || inRange(code, 65, 90) || inRange(code, 97, 122) || inRange(code, 48, 57) ||
  Object.values(PUNCTUATION).includes(code);

function codeOfChar(ch) {
  const code = ch.charCodeAt(0);
  if (ch.length !== 1 || !isKnownCode(code)) throw new Error(`"${ch}" is not a letter, digit, or space`);
  return code;
}

function charOfCode(code) {
  if (!isKnownCode(code)) throw new Error(`${code} is not a letter, digit, or space code`);
  return String.fromCharCode(code);
}

// "IT HAD A VIRUS" -> "It had a virus": the bank is all capitals, and the
// anchors level turns punchlines into ordinary sentences so lowercase shows up.
export function sentenceCase(text) {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function toBinary8(code) {
  return code.toString(2).padStart(8, "0");
}

export function toHex2(code) {
  return code.toString(16).toUpperCase().padStart(2, "0");
}

function fromBinary8(token) {
  if (!/^[01]{8}$/.test(token)) throw new Error(`"${token}" is not an 8-bit binary code`);
  return parseInt(token, 2);
}

function fromHex2(token) {
  if (!/^[0-9A-Fa-f]{2}$/.test(token)) throw new Error(`"${token}" is not a 2-digit hex code`);
  return parseInt(token, 16);
}

// format: "decimal" | "binary" | "hex"
const FORMATS = ["decimal", "binary", "hex"];

function encodeCode(code, format) {
  if (format === "decimal") return String(code);
  if (format === "binary") return toBinary8(code);
  if (format === "hex") return toHex2(code);
  throw new Error(`Unknown format "${format}"`);
}

function decodeToken(token, format) {
  let code;
  if (format === "decimal") code = Number(token);
  else if (format === "binary") code = fromBinary8(token);
  else if (format === "hex") code = fromHex2(token);
  else throw new Error(`Unknown format "${format}"`);
  return charOfCode(code);
}

// "HI", "decimal" -> ["72", "73"]
export function encodeText(text, format, { extended = false } = {}) {
  if (!isValidMessage(text, { extended })) throw new Error(`"${text}" has characters this level doesn't use`);
  return text.split("").map((ch) => encodeCode(codeOfChar(ch), format));
}

// ["72", "73"], "decimal" -> "HI"
export function decodeCodes(codes, format) {
  return codes.map((token) => decodeToken(String(token), format)).join("");
}

// The A-Z-and-space code table this whole activity is built on, one row per
// letter, in every format at once. Used to build printed reference tables
// and to sanity-check hand-written ones.
export function alphabetTable() {
  const rows = [];
  for (let code = FIRST_CODE; code <= LAST_CODE; code++) {
    const letter = String.fromCharCode(code);
    rows.push({ letter, decimal: code, binary: toBinary8(code), hex: toHex2(code), position: code - FIRST_CODE + 1 });
  }
  rows.push({ letter: "space", decimal: SPACE_CODE, binary: toBinary8(SPACE_CODE), hex: toHex2(SPACE_CODE), position: null });
  return rows;
}

export function formatCode(code, format) {
  return encodeCode(code, format);
}

export { FORMATS };
