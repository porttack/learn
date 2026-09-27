// Renders a Caesar cipher puzzle (from cipher-gen.js's generateSet) into the
// generator page's .puzzle-questions and .puzzle-key elements.
//
// Only the generator page uses this. The two fixed worksheets
// (_unplugged/caesar-cipher.md and caesar-cipher-frequency.md) are
// hand-written HTML/Markdown pulling straight from
// _data/unplugged/cipher_*.yml, so a change here can never desync a
// class set that has already been printed.

import { ALPHABET, ENGLISH_FREQ } from "./cipher.js";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Matches Liquid's `capitalize` filter, used on the fixed pages: capitalize
// the first character, lowercase the rest, so an all-caps puzzle string
// reads back as an ordinary sentence in the answer key.
const sentenceCase = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

function freqTableHalf(letters, counts) {
  const rows = letters
    .map(
      (l) =>
        `<tr><td>${l}</td><td><span class="freq-bar" style="width: ${Math.max(1, Math.round(ENGLISH_FREQ[l] * 7.5))}%"></span></td><td></td><td>${counts ? counts[l] : ""}</td></tr>`,
    )
    .join("");
  return `<table class="freq-table">
    <colgroup><col style="width: 12%"><col style="width: 38%"><col style="width: 32%"><col style="width: 18%"></colgroup>
    <thead><tr><th>Letter</th><th>Typical</th><th>Cipher tally</th><th>Count</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function freqTables(counts) {
  const letters = ALPHABET.split("");
  return `<div class="freq-tables">${freqTableHalf(letters.slice(0, 13), counts)}${freqTableHalf(letters.slice(13), counts)}</div>`;
}

function crackGrid() {
  const rows = [];
  for (let row = 0; row < 5; row++) {
    const cells = [];
    for (let col = 0; col < 5; col++) {
      const key = row * 5 + col + 1;
      cells.push(`<td><span class="crack-key">${key}</span><span class="fill-line short"></span></td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table class="crack-grid">${rows.join("")}</table>`;
}

function keyBody(puzzle) {
  const q = `<p class="cipher-set-key"><strong>Key: ${puzzle.key}</strong></p>
    <ol class="cipher-messages">${puzzle.items
      .map((it) => `<li><code class="cipher-text">${esc(it.cipher)}</code><p class="fill-line"></p></li>`)
      .join("")}</ol>`;
  const k = `<p class="cipher-set-key"><strong>Key: ${puzzle.key}</strong></p>
    <ol class="cipher-messages">${puzzle.items.map((it) => `<li>${esc(sentenceCase(it.plain))}</li>`).join("")}</ol>`;
  return { q, k };
}

function crackBody(puzzle) {
  const q = `<p class="cipher-crack-text"><code class="cipher-text">${esc(puzzle.cipher)}</code></p>${crackGrid()}`;
  const k = `<p>The key is <strong>${puzzle.key}</strong>. Decoded:</p><p>${esc(sentenceCase(puzzle.plain))}</p>`;
  return { q, k };
}

function frequencyBody(puzzle) {
  const q = `<p class="cipher-passage"><code class="cipher-text">${esc(puzzle.cipher)}</code></p>${freqTables()}`;
  const k = `<p><strong>${puzzle.guess.guessLetter}</strong> is the most common letter in this ciphertext,
    standing in for E. That makes the key <strong>${puzzle.key}</strong>.</p>
    ${freqTables(puzzle.counts)}
    <p>${esc(sentenceCase(puzzle.passage))}</p>`;
  return { q, k };
}

export function renderPuzzle(puzzle, qRoot, keyRoot) {
  const body = puzzle.mode === "crack" ? crackBody(puzzle) : puzzle.mode === "frequency" ? frequencyBody(puzzle) : keyBody(puzzle);
  qRoot.innerHTML = body.q;
  if (keyRoot) keyRoot.innerHTML = `<h2>Check your answers</h2>${body.k}`;
}
