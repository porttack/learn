import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS } from "./binairo-gen.js";
import { renderPuzzleSet } from "./binairo-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [{ name: "level", label: "Level", default: "6-easy", choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]) }],
  render(rng, opts) {
    const puzzles = generateSet(rng, { level: opts.level });
    renderPuzzleSet(puzzles, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
