// Fixed robot worksheets: each <script type="application/json"
// data-robot-set> holds one set's questions (from _data/unplugged/), drawn
// into the .robot-questions and .robot-answer-key elements named by its
// data-questions / data-key attributes.
import { renderSet } from "./robot-render.js";

for (const script of document.querySelectorAll("script[data-robot-set]")) {
  const questions = JSON.parse(script.textContent);
  renderSet(questions, document.querySelector(script.dataset.questions), document.querySelector(script.dataset.key));
}
