// Fixed Solo Battleship worksheet: the <script type="application/json"
// data-bimaru-set> holds the frozen puzzle list (from
// _data/unplugged/solo_battleship.yml, given as text grids), drawn into the
// .bimaru-puzzles element named by its data-questions attribute, plus (if
// data-key names one) the solved answer key.
import { parseGiven } from "./bimaru.js";
import { renderPuzzleSet, renderKeySet } from "./bimaru-render.js";

for (const script of document.querySelectorAll("script[data-bimaru-set]")) {
  const puzzles = JSON.parse(script.textContent).map((p) => ({ ...p, given: parseGiven(p.given), solution: parseGiven(p.solution) }));
  renderPuzzleSet(puzzles, document.querySelector(script.dataset.questions));
  if (script.dataset.key) renderKeySet(puzzles, document.querySelector(script.dataset.key));
}
