// Fixed Poor Cartographer worksheet: the <script type="application/json"
// data-poor-cartographer-set> holds the frozen maps (from
// _data/unplugged/poor_cartographer.yml), drawn into the .graphs-questions
// and the answer-key element named by its data-questions / data-key
// attributes.
import { renderQuestions, renderKey } from "./poor-cartographer-render.js";

for (const script of document.querySelectorAll("script[data-poor-cartographer-set]")) {
  const maps = JSON.parse(script.textContent);
  renderQuestions(maps, document.querySelector(script.dataset.questions));
  renderKey(maps, document.querySelector(script.dataset.key));
}
