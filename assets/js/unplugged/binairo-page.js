// Fixed binary-puzzle worksheet: the <script type="application/json"
// data-binairo-set> holds the frozen puzzle list (from
// _data/unplugged/binary_puzzles.yml), drawn into the .binairo-puzzles and
// .binairo-answer-key elements named by its data-questions / data-key
// attributes.
import { parsePuzzle } from "./binairo.js";
import { renderPuzzleSet } from "./binairo-render.js";

for (const script of document.querySelectorAll("script[data-binairo-set]")) {
  // Frozen puzzles store given/solution as the same row-of-text format the
  // generator's grids come from JS as arrays, so parse them the same way.
  const puzzles = JSON.parse(script.textContent).map((p) => ({
    ...p,
    given: parsePuzzle(p.given),
    solution: parsePuzzle(p.solution),
  }));
  renderPuzzleSet(puzzles, document.querySelector(script.dataset.questions), document.querySelector(script.dataset.key));
}
