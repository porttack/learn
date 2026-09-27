// Fixed creature-sorting worksheets: each <script type="application/json"
// data-creature-set> holds one set's Part A/Part B data (from
// _data/unplugged/), drawn into the .creature-questions and
// .creature-answer-key elements named by its data-questions / data-key
// attributes. Same pattern as robot-page.js.
import { renderSet } from "./creatures-render.js";

for (const script of document.querySelectorAll("script[data-creature-set]")) {
  const data = JSON.parse(script.textContent);
  renderSet(data, document.querySelector(script.dataset.questions), document.querySelector(script.dataset.key));
}
