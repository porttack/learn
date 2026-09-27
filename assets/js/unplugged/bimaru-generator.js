import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS } from "./bimaru-gen.js";
import { renderPuzzleSet, renderKeySet } from "./bimaru-render.js";

const root = document.querySelector(".puzzle-generator");

mountGenerator({
  root,
  options: [
    {
      name: "level",
      label: "Level",
      default: "5-easy",
      choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]),
    },
  ],
  render(rng, opts) {
    const puzzles = generateSet(rng, { level: opts.level });
    renderPuzzleSet(puzzles, root.querySelector(".puzzle-questions"));
    renderKeySet(puzzles, root.querySelector(".puzzle-key"));
  },
});
