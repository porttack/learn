// Text compression puzzle logic: split text into words (and line breaks),
// find repeated runs of two or more words that already appeared earlier,
// and replace each repeat with a small numbered "box" pointing back to its
// first appearance. Decoding means finding the box's earlier number and
// copying those same words.
//
// DOM-free on purpose: tools/check_text_compression.mjs imports this in
// Node to verify every puzzle actually decodes back to its original text.

// A repeat has to be at least this many words to be worth a box, unless
// it's one long word (5+ letters) repeated on its own.
const MIN_WORDS = 2;
const MIN_SINGLE_WORD_LEN = 5;

// Splits text into an ordered list of units: {type:"word", text} for each
// word, and {type:"break"} for each line break. Punctuation stays attached
// to its word (so "hot," and "hot" are different units on purpose --
// compression only replaces exact repeats).
export function splitUnits(text) {
  const lines = String(text).split("\n");
  const units = [];
  lines.forEach((line, li) => {
    if (li > 0) units.push({ type: "break" });
    line
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => units.push({ type: "word", text: w }));
  });
  return units;
}

function unitsEqual(a, b) {
  return a.type === b.type && (a.type !== "word" || a.text === b.text);
}

function contentKey(units, start, len) {
  return units
    .slice(start, start + len)
    .map((u) => (u.type === "break" ? "↵" : u.text))
    .join(" ");
}

// Compresses text into a token stream plus the box definitions it points
// to. Every box points to text that is still literally visible on the
// page (never to another box), so decoding never has to chase a chain.
export function compress(text) {
  const units = splitUnits(text);
  const tokens = [];
  const isLiteral = new Array(units.length).fill(false);
  const unitToToken = new Array(units.length).fill(-1);
  const boxByContent = new Map();
  const boxContent = {};
  let nextBox = 1;
  let i = 0;

  const wordCount = (start, len) => {
    let n = 0;
    for (let k = 0; k < len; k++) if (units[start + k].type === "word") n++;
    return n;
  };

  while (i < units.length) {
    let bestLen = 0;
    let bestJ = -1;
    for (let j = 0; j < i; j++) {
      let len = 0;
      while (
        i + len < units.length &&
        j + len < i &&
        isLiteral[j + len] &&
        unitsEqual(units[j + len], units[i + len])
      ) {
        len++;
      }
      if (len > bestLen) {
        bestLen = len;
        bestJ = j;
      }
    }
    const worthIt =
      bestLen > 0 &&
      (wordCount(bestJ, bestLen) >= MIN_WORDS ||
        (bestLen === 1 &&
          units[i].type === "word" &&
          units[i].text.replace(/[^A-Za-z]/g, "").length >= MIN_SINGLE_WORD_LEN));

    if (worthIt) {
      const key = contentKey(units, bestJ, bestLen);
      let box = boxByContent.get(key);
      if (box == null) {
        box = nextBox++;
        boxByContent.set(key, box);
        boxContent[box] = units.slice(bestJ, bestJ + bestLen);
        tokens[unitToToken[bestJ]].defines = box;
      }
      tokens.push({ type: "ptr", box });
      for (let k = 0; k < bestLen; k++) isLiteral[i + k] = false;
      i += bestLen;
    } else {
      const u = units[i];
      const tok = u.type === "break" ? { type: "break" } : { type: "word", text: u.text };
      tokens.push(tok);
      unitToToken[i] = tokens.length - 1;
      isLiteral[i] = true;
      i++;
    }
  }
  return { tokens, boxContent };
}

function unitsToText(units) {
  let out = "";
  units.forEach((u, idx) => {
    if (u.type === "break") {
      out += "\n";
      return;
    }
    if (idx > 0 && units[idx - 1].type === "word") out += " ";
    out += u.text;
  });
  return out;
}

// Reverses compress(): follows every ptr token back to its box's stored
// words and reassembles the original text.
export function decode({ tokens, boxContent }) {
  const units = [];
  for (const t of tokens) {
    if (t.type === "word") units.push({ type: "word", text: t.text });
    else if (t.type === "break") units.push({ type: "break" });
    else if (t.type === "ptr") units.push(...boxContent[t.box]);
  }
  return unitsToText(units);
}

// How many letters (A-Z only, no spaces/punctuation) a compressed version
// keeps versus the original -- used to report a "letters saved" figure.
// Each ptr token counts as 0 kept letters, since a box replaces however
// many letters its words would have cost.
export function letterCounts(text, result) {
  const letters = (s) => (s.match(/[A-Za-z]/g) || []).length;
  const original = letters(text);
  let kept = 0;
  for (const t of result.tokens) {
    if (t.type === "word") kept += letters(t.text);
  }
  return { original, kept, saved: original - kept };
}
