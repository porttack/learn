import { mountGenerator } from "./generator-shell.js";
import { generateSet, MODES } from "./vigenere-gen.js";
import { renderPuzzle } from "./vigenere-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "mode", label: "Puzzle type", default: "decode", choices: Object.entries(MODES).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Messages", default: 5, choices: [[3, "3"], [5, "5"], [8, "8"]] },
  ],
  render(rng, opts) {
    const puzzle = generateSet(rng, { mode: opts.mode, count: Number(opts.count) });
    renderPuzzle(puzzle, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
