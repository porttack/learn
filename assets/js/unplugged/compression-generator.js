import { mountGenerator } from "./generator-shell.js";
import { generateSet } from "./compression-gen.js";
import { renderPuzzle, renderKey } from "./compression-render.js";

mountGenerator({
  root: document.querySelector(".puzzle-generator"),
  options: [
    {
      name: "level",
      label: "Level",
      choices: [
        ["ms", "One rhyme"],
        ["hs", "Two rhymes"],
      ],
    },
  ],
  render(rng, opts) {
    const puzzles = generateSet(rng, opts);
    const questions = document.querySelector(".puzzle-questions");
    const keyEl = document.querySelector(".puzzle-key");
    questions.innerHTML = "";
    keyEl.innerHTML = "";
    puzzles.forEach((result) => {
      const qWrap = document.createElement("div");
      qWrap.className = "compress-set";
      const h = document.createElement("h3");
      h.textContent = result.title;
      qWrap.appendChild(h);
      const puzzleHolder = document.createElement("div");
      qWrap.appendChild(puzzleHolder);
      renderPuzzle(puzzleHolder, result);
      questions.appendChild(qWrap);

      const kWrap = document.createElement("div");
      kWrap.className = "compress-set";
      const kh = document.createElement("h3");
      kh.textContent = result.title;
      kWrap.appendChild(kh);
      const keyHolder = document.createElement("div");
      kWrap.appendChild(keyHolder);
      renderKey(keyHolder, result);
      keyEl.appendChild(kWrap);
    });
  },
});
