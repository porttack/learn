import { mountGenerator } from "./generator-shell.js";
import { generateMap, SIZES } from "./tourist-town.js";
import { renderQuestions, renderKey } from "./tourist-town-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    {
      name: "size",
      label: "Town size",
      default: "small",
      choices: [
        ["small", SIZES.small.label],
        ["big", SIZES.big.label],
      ],
    },
  ],
  render(rng, opts) {
    const warmup = generateMap(rng.fork(1), "warmup");
    warmup.label = SIZES.warmup.label;
    const main = generateMap(rng.fork(2), opts.size);
    main.label = (SIZES[opts.size] || SIZES.small).label;
    const maps = [warmup, main];
    renderQuestions(maps, root.querySelector(".puzzle-questions"));
    renderKey(maps, root.querySelector(".puzzle-key"));
  },
});
