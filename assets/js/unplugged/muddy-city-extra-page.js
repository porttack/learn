// "Early finishers" towns on the main Muddy City sheet: frozen in
// _data/unplugged/muddy_city_extra.yml (never a live seed, so a printed
// class set and its key can't drift), drawn into the page's
// .muddy-extra-towns and the hidden .muddy-extra-towns-key the
// <script data-muddy-extra-set> names.
import { renderTownSet, renderTownSetKey } from "./muddy-city-render.js";

for (const script of document.querySelectorAll("script[data-muddy-extra-set]")) {
  const towns = JSON.parse(script.textContent);
  const questions = document.querySelector(script.dataset.towns);
  const key = document.querySelector(script.dataset.key);
  if (questions) renderTownSet(towns, questions, { tryLabels: ["your own idea", "a different idea"] });
  if (key) renderTownSetKey(towns, key);
}
