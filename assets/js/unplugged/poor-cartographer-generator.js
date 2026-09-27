import { mountGenerator } from "./generator-shell.js";
import { generateMap, TARGETS } from "./poor-cartographer.js";
import { renderQuestions, renderKey } from "./poor-cartographer-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    {
      name: "target",
      label: "Difficulty",
      default: "3",
      choices: [
        ["2", TARGETS[2].label],
        ["3", TARGETS[3].label],
        ["4", TARGETS[4].label],
      ],
    },
  ],
  render(rng, opts) {
    const warmup = generateMap(rng.fork(1), 2);
    warmup.label = "Warm-up map";
    const main = generateMap(rng.fork(2), Number(opts.target));
    main.label = (TARGETS[opts.target] || TARGETS[3]).label;
    const maps = [warmup, main];
    renderQuestions(maps, root.querySelector(".puzzle-questions"));
    renderKey(maps, root.querySelector(".puzzle-key"));
  },
});
