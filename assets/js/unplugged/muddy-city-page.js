// Fixed Muddy City worksheet: the <script type="application/json"
// data-muddy-city-set> holds the frozen maps (from
// _data/unplugged/muddy_city.yml), drawn into the .graphs-questions and
// the answer-key element named by its data-questions / data-key attributes.
import { renderQuestions, renderKey } from "./muddy-city-render.js";

for (const script of document.querySelectorAll("script[data-muddy-city-set]")) {
  const maps = JSON.parse(script.textContent);
  renderQuestions(maps, document.querySelector(script.dataset.questions));
  renderKey(maps, document.querySelector(script.dataset.key));
}
