import { mountGenerator } from "./generator-shell.js";
import { generateSet } from "./sortnet-gen.js";
import { renderProblems } from "./sortnet-render.js";

mountGenerator({
  root: document.querySelector(".puzzle-generator"),
  options: [
    {
      name: "twist",
      label: "Trace",
      choices: [
        ["numbers", "Numbers"],
        ["words", "Words (A-Z order)"],
      ],
    },
    {
      name: "level",
      label: "Level",
      choices: [
        ["ms", "Two-digit numbers"],
        ["hs", "Three-digit numbers"],
      ],
    },
  ],
  render(rng, opts) {
    const problems = generateSet(rng, opts);
    renderProblems(document.querySelector(".puzzle-questions"), problems, { filled: false });
    renderProblems(document.querySelector(".puzzle-key"), problems, { filled: true });
  },
});
