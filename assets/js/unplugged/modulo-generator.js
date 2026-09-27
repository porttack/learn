import { mountGenerator } from "./generator-shell.js";
import { generateSet } from "./modulo-gen.js";
import { renderSet } from "./modulo-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    {
      name: "mode",
      label: "Puzzle type",
      default: "clock",
      choices: [
        ["clock", "Clock problems"],
        ["predict", "Predict %"],
        ["checkdigit", "Check digits"],
      ],
    },
    {
      name: "level",
      label: "Level",
      default: "ms",
      choices: [
        ["ms", "Easier"],
        ["hs", "Challenge"],
      ],
    },
    {
      name: "count",
      label: "Problems",
      default: 10,
      choices: [
        [6, "6"],
        [10, "10"],
        [14, "14"],
      ],
    },
  ],
  render(rng, opts) {
    const qs = generateSet(rng, { mode: opts.mode, level: opts.level, count: Number(opts.count) });
    renderSet(qs, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
