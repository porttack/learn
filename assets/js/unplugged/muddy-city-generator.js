import { mountGenerator } from "./generator-shell.js";
import { generateMap, SIZES } from "./muddy-city.js";
import { renderQuestions, renderKey } from "./muddy-city-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    {
      name: "size",
      label: "Town size",
      default: "medium",
      choices: [
        ["small", SIZES.small.label],
        ["medium", SIZES.medium.label],
        ["big", SIZES.big.label],
      ],
    },
  ],
  render(rng, opts) {
    const warmup = generateMap(rng.fork(1), "warmup");
    warmup.label = SIZES.warmup.label;
    const main = generateMap(rng.fork(2), opts.size);
    main.label = (SIZES[opts.size] || SIZES.medium).label;
    const maps = [warmup, main];
    renderQuestions(maps, root.querySelector(".puzzle-questions"));
    renderKey(maps, root.querySelector(".puzzle-key"));
  },
});
