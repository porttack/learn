// "Secret Messages: make a new set" generator
// (_unplugged/ascii-messages-generator.md). Picks a joke (decode direction)
// or a word (encode direction) from the bank embedded in the page, and
// draws the matching reference table for whichever format is selected.
import { mountGenerator } from "./generator-shell.js";
import { encodeText, alphabetTable, ANCHORS, sentenceCase } from "./ascii.js";

const bank = JSON.parse(document.getElementById("ascii-bank").textContent);

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Same three groups of nine columns as the fixed worksheets, so the
// generator's table looks like the ones students already know.
const GROUPS = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z", "space"],
];

// Three kinds of help, from most to least:
//   full     letter and code side by side: pure lookup
//   fill     letter and decimal, plus a blank row to fill in binary/hex
//   anchors  just A, a, 0, and space; messages use lowercase and digits too
function referenceTable(format, chart) {
  if (chart === "anchors") {
    const clues = ANCHORS.map((a) => `<span>${a.label} = ${a.code}</span>`).join("");
    return `<div class="ascii-anchors">${clues}</div>
      <p class="ascii-hint">Turn each code into decimal, pick the clue it belongs to (48 to 57 digits, 65 to 90 capitals, 97 to 122 lowercase), and count forward.</p>`;
  }
  const byLetter = Object.fromEntries(alphabetTable().map((r) => [r.letter, r]));
  if (chart === "fill" && format !== "decimal") {
    const label = format === "binary" ? "Binary" : "Hex";
    const per = format === "binary" ? 7 : 9;
    const letters = GROUPS.flat();
    const bands = [];
    for (let i = 0; i < letters.length; i += per) {
      const group = letters.slice(i, i + per);
      bands.push(`<tr class="chart-letters"><th class="row-label"></th>${group.map((l) => `<th>${l}</th>`).join("")}</tr>
        <tr class="chart-decimal"><th class="row-label">Decimal</th>${group.map((l) => `<td>${byLetter[l].decimal}</td>`).join("")}</tr>
        <tr class="chart-blank"><th class="row-label">${label}</th>${group.map(() => "<td></td>").join("")}</tr>`);
    }
    return `<table class="ascii-table ascii-chart fill-${format}"><tbody>${bands.join("")}</tbody></table>`;
  }
  const blocks = GROUPS.map((group) => {
    const heads = group.map((l) => `<th>${l}</th>`).join("");
    const vals = group.map((l) => `<td>${byLetter[l][format]}</td>`).join("");
    return `<tr>${heads}</tr><tr>${vals}</tr>`;
  }).join("");
  return `<table class="ascii-table"><tbody>${blocks}</tbody></table>`;
}

function codeCell(ch, code) {
  const spaceClass = ch === " " ? " is-space" : "";
  return `<div class="code-cell${spaceClass}"><span class="code-num">${esc(code)}</span><span class="code-box"></span></div>`;
}

function letterCell(ch) {
  return `<div class="code-cell"><span class="code-letter">${esc(ch)}</span><span class="value-box"></span></div>`;
}

function decodeQuestion(format, chart, joke) {
  const extended = chart === "anchors";
  const text = extended ? sentenceCase(joke.punchline) : joke.punchline;
  const codes = encodeText(text, format, { extended });
  const cells = text
    .split("")
    .map((ch, i) => codeCell(ch, codes[i]))
    .join("");
  return `<div class="ascii-question">
    <p class="ascii-prompt">${esc(joke.setup)}</p>
    <div class="code-row">${cells}</div>
  </div>`;
}

function encodeQuestion(word) {
  const cells = word
    .split("")
    .map((ch) => letterCell(ch))
    .join("");
  return `<div class="ascii-question">
    <p class="ascii-prompt">Write the code under each letter of this word.</p>
    <div class="code-row">${cells}</div>
  </div>`;
}

// Answer key: a numbered list of decoded texts (decode direction), or the
// one word's codes spelled out (encode direction). Always built from the
// exact jokes/word the questions above were drawn from -- never a fresh
// rng draw, so the key can never point at a different puzzle than the one
// printed on the sheet.
function decodeKeyHtml(jokes, chart) {
  const extended = chart === "anchors";
  const items = jokes.map((joke) => `<li>${esc(extended ? sentenceCase(joke.punchline) : joke.punchline)}</li>`).join("");
  return `<ol class="ascii-key-list">${items}</ol>`;
}

function encodeKeyHtml(word, format) {
  const codes = encodeText(word, format);
  const pairs = word
    .split("")
    .map((ch, i) => `<span class="ascii-key-pair">${esc(ch)} = ${esc(codes[i])}</span>`)
    .join(" &middot; ");
  return `<p class="ascii-key-encode">${pairs}</p>`;
}

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "format", label: "Format", default: "decimal", choices: [["decimal", "Decimal"], ["binary", "Binary"], ["hex", "Hex"]] },
    { name: "direction", label: "Direction", default: "decode", choices: [["decode", "Decode a message"], ["encode", "Encode a word"]] },
    { name: "chart", label: "Help", default: "full", choices: [["full", "Full chart"], ["fill", "Chart to fill in"], ["anchors", "Only four clues (harder)"]] },
  ],
  render(rng, opts) {
    root.querySelector(".puzzle-reference").innerHTML = referenceTable(opts.format, opts.chart);
    if (opts.direction === "encode") {
      const word = rng.pick(bank.words);
      root.querySelector(".puzzle-questions").innerHTML = encodeQuestion(word);
      root.querySelector(".puzzle-key").innerHTML = `<h2>Answer key</h2>${encodeKeyHtml(word, opts.format)}`;
    } else {
      const jokes = rng.shuffle(bank.jokes).slice(0, 3);
      root.querySelector(".puzzle-questions").innerHTML = jokes.map((joke) => decodeQuestion(opts.format, opts.chart, joke)).join("");
      root.querySelector(".puzzle-key").innerHTML = `<h2>Answer key</h2>${decodeKeyHtml(jokes, opts.chart)}`;
    }
  },
});
