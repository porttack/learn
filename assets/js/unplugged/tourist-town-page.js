// Fixed Tourist Town worksheet: the <script type="application/json"
// data-tourist-town-set> holds the frozen maps (from
// _data/unplugged/tourist_town.yml), drawn into the .graphs-questions and
// the answer-key element named by its data-questions / data-key
// attributes.
import { renderQuestions, renderKey } from "./tourist-town-render.js";

for (const script of document.querySelectorAll("script[data-tourist-town-set]")) {
  const maps = JSON.parse(script.textContent);
  renderQuestions(maps, document.querySelector(script.dataset.questions));
  renderKey(maps, document.querySelector(script.dataset.key));
}
