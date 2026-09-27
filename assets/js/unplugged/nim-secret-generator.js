import { mountGenerator } from "./generator-shell.js";
import { generateSet, PILE_COUNTS } from "./nim-gen.js";
import { renderSet } from "./nim-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "piles", label: "Piles", default: 4, choices: Object.entries(PILE_COUNTS).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Positions", default: 8, choices: [[6, "6"], [8, "8"], [10, "10"]] },
  ],
  render(rng, opts) {
    const qs = generateSet(rng, { pileCount: Number(opts.piles), count: Number(opts.count) });
    renderSet(qs, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
