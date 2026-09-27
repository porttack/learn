import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS } from "./robot-gen.js";
import { renderSet } from "./robot-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "level", label: "Level", default: "ap", choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Questions", default: 6, choices: [[4, "4"], [6, "6"], [8, "8"]] },
  ],
  render(rng, opts) {
    const qs = generateSet(rng, { level: opts.level, count: Number(opts.count) });
    renderSet(qs, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
