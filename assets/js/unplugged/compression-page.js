// Fixed text-compression worksheet: the frozen puzzle lives as JSON in
// <script type="application/json" data-compression-set>, drawn into the
// .compress-puzzle and .compress-key elements it names.
import { renderPuzzle, renderKey } from "./compression-render.js";

for (const script of document.querySelectorAll("script[data-compression-set]")) {
  const result = JSON.parse(script.textContent);
  const puzzle = document.querySelector(script.dataset.puzzle);
  const key = document.querySelector(script.dataset.key);
  if (puzzle) renderPuzzle(puzzle, result);
  if (key) renderKey(key, result);
}
