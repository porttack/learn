// Answer key for _unplugged/tlc-spit-not-so.md: a line-by-line table of
// which letter each row, column, and diagonal shares, computed straight from
// the same GRID/LINES the page's board is built from (tools/check_tlc.mjs
// verifies this magic-square property holds), so a teacher can check any
// claimed win at a glance instead of re-reading three words by eye.
import { GRID, LINES, sharedLetters } from "./tlc-spit-not-so.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Matches LINES's own order in tlc-spit-not-so.js: rows, then columns, then
// both diagonals.
const LABELS = [
  "Top row",
  "Middle row",
  "Bottom row",
  "Left column",
  "Middle column",
  "Right column",
  "Diagonal (top-left to bottom-right)",
  "Diagonal (top-right to bottom-left)",
];

function rowsHtml() {
  return LINES.map((line, i) => {
    const words = line.map((idx) => GRID[idx]);
    const shared = sharedLetters(words).join("");
    return `<tr><td>${esc(LABELS[i])}</td><td>${words.map(esc).join(", ")}</td><td>${esc(shared)}</td></tr>`;
  }).join("");
}

const root = document.querySelector(".answer-key");
if (root) {
  root.innerHTML = `<h2>Answer key</h2>
    <p class="tlc-key-note">A win is three words in a straight line on the grid. Find that line here to check the letter they share.</p>
    <table class="checkoff tlc-key-lines">
      <thead><tr><th>Line</th><th>Words</th><th>Shared letter</th></tr></thead>
      <tbody>${rowsHtml()}</tbody>
    </table>`;
}
