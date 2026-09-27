import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS } from "./creatures-gen.js";
import { renderSet } from "./creatures-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "level", label: "Level", default: "two", choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Part A questions", default: 8, choices: [[6, "6"], [8, "8"], [10, "10"]] },
  ],
  render(rng, opts) {
    const data = generateSet(rng, { level: opts.level, count: Number(opts.count) });
    renderSet(data, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
