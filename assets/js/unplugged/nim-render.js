// Draws a set of Nim positions (fixed or generated) as a fill-in table plus
// a worked-binary answer key. Used by the "binary secret" generator page;
// the fixed practice table on the binary secret page itself is rendered at
// build time straight from YAML by Liquid, not by this module, but both
// draw on the same nim.js functions so the numbers always agree.
import { PILE_LABELS } from "./nim.js";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

function placeValues(width) {
  const out = [];
  for (let i = width - 1; i >= 0; i--) out.push(2 ** i);
  return out;
}

// One question's row in the fill-in table: piles shown, two blank cells for
// the student to fill in by hand.
function questionRow(q, n) {
  const piles = q.piles.map((p, i) => `${PILE_LABELS[i]} ${p}`).join(", ");
  return `<tr>
    <td>${n}</td>
    <td>${esc(piles)}</td>
    <td></td>
    <td></td>
  </tr>`;
}

// One question's answer: the binary place-value table (one row per pile,
// plus the nim-sum row), then the plain-English answer.
function keyBlock(q, n) {
  const values = placeValues(q.binary[0].length);
  const header = values.map((v) => `<th>${v}</th>`).join("");
  const pileRows = q.piles
    .map((p, i) => {
      const bits = q.binary[i]
        .split("")
        .map((b) => `<td>${b}</td>`)
        .join("");
      return `<tr><td>${PILE_LABELS[i]} (${p})</td>${bits}</tr>`;
    })
    .join("");
  const sumBits = q.sumBinary
    .split("")
    .map((b) => `<td>${b}</td>`)
    .join("");

  const verdict =
    q.answer === "win"
      ? `Nim-sum is ${q.sum}, not zero, so the player about to move has a winning move. ${esc(q.moveText)}`
      : `Nim-sum is 0, so the player about to move is in a losing position. ${esc(q.moveText)}`;

  return `<div class="nim-work">
    <p class="nim-work-label"><strong>${n}.</strong> Piles: ${esc(q.piles.map((p, i) => `${PILE_LABELS[i]} ${p}`).join(", "))}</p>
    <table class="nim-binary-table">
      <thead><tr><th>Pile</th>${header}</tr></thead>
      <tbody>
        ${pileRows}
        <tr class="nim-sum-row"><td>Nim-sum</td>${sumBits}</tr>
      </tbody>
    </table>
    <p class="nim-verdict"><strong>${q.answer === "win" ? "Win" : "Lose"}.</strong> ${verdict}</p>
  </div>`;
}

// Fills `qRoot` with a fill-in table and `keyRoot` with the worked answer key.
export function renderSet(questions, qRoot, keyRoot) {
  qRoot.innerHTML = `<table class="checkoff nim-position-table">
    <colgroup><col style="width: 8%"><col style="width: 32%"><col style="width: 20%"><col style="width: 40%"></colgroup>
    <thead><tr><th>#</th><th>Piles</th><th>Win or lose?</th><th>Winning move (if any)</th></tr></thead>
    <tbody>${questions.map((q, i) => questionRow(q, i + 1)).join("")}</tbody>
  </table>`;
  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>
      <p class="nim-key-intro">"Win" means the player about to move can force a win. Each column is a place
      value; a pile's row shows it in binary. The nim-sum row adds each column without carrying, so it's 1
      exactly where an odd number of piles have a 1 there.</p>
      ${questions.map((q, i) => keyBlock(q, i + 1)).join("")}`;
  }
}
