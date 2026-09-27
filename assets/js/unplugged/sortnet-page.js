// Fixed sorting-network worksheet: the frozen problems live as JSON in
// <script type="application/json" data-sortnet-set>, drawn into the
// .sortnet-problems and .sortnet-key elements it names.
import { renderProblems } from "./sortnet-render.js";

for (const script of document.querySelectorAll("script[data-sortnet-set]")) {
  const problems = JSON.parse(script.textContent);
  const puzzle = document.querySelector(script.dataset.puzzle);
  const key = document.querySelector(script.dataset.key);
  if (puzzle) renderProblems(puzzle, problems, { filled: false });
  if (key) renderProblems(key, problems, { filled: true });
}
