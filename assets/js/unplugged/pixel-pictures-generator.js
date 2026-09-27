import { mountGenerator } from "./generator-shell.js";
import { generateSet, SIZES } from "./pixel-gen.js";
import { renderSet } from "./pixel-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "size", label: "Size", default: "small", choices: Object.entries(SIZES).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Pictures", default: 3, choices: [[2, "2"], [3, "3"], [4, "4"]] },
  ],
  render(rng, opts) {
    const pics = generateSet(rng, { size: opts.size, count: Number(opts.count) });
    renderSet(pics, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
