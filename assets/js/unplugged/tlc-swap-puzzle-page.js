// Answer key for _unplugged/tlc-swap-puzzle.md: a shortest move sequence
// and the minimum move count for each board size printed on the sheet (the
// 5-square "Your turn" board and the 7-square Challenge board). Computed
// with the exact same breadth-first search the sheet's own checker
// (tools/check_tlc.mjs) verifies, so the key can never drift from what's
// actually shortest.
import { shortestSolution, verifySolution } from "./tlc-swap-puzzle.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const BOARDS = [
  { n: 2, label: "Your turn: 5 squares" },
  { n: 3, label: "Challenge: 7 squares" },
];

function boardKeyHtml(n, label) {
  const path = shortestSolution(n);
  const check = verifySolution(n, path);
  if (!check.ok) {
    // Should never happen (tools/check_tlc.mjs proves this for n up to 5),
    // but fail loudly on the page rather than silently show a wrong key.
    return `<p class="callout warning">Couldn't verify a solution for ${label}: ${esc(check.error || "unknown error")}</p>`;
  }
  const moves = path.map((description, i) => `<li>${esc(description.charAt(0).toUpperCase() + description.slice(1))}.</li>`).join("");
  return `<div class="tlc-key-puzzle">
    <h3>${esc(label)}</h3>
    <ol class="tlc-key-moves">${moves}</ol>
    <p class="tlc-key-count"><strong>${path.length} moves</strong>, the fewest possible.</p>
  </div>`;
}

const root = document.querySelector(".answer-key");
if (root) {
  root.innerHTML = `<h2>Answer key</h2>${BOARDS.map((b) => boardKeyHtml(b.n, b.label)).join("")}`;
}
