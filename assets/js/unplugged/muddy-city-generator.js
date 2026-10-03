import { mountGenerator } from "./generator-shell.js";
import { generateMap, SIZES } from "./muddy-city.js";
import { renderTownSet, renderTownSetKey } from "./muddy-city-render.js";

const root = document.querySelector(".puzzle-generator");

// The "Roads" option defaults to whatever the currently-chosen town size
// would pick on its own (stepping stones for small/medium, numbers for
// big), but a teacher can override it either way -- e.g. numbers for an
// older class on a small town, or stones on a big one.
const initialSize = new URLSearchParams(location.search).get("size");
const defaultRoads = (SIZES[initialSize] || SIZES.medium).defaultRoadStyle;

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
    {
      name: "roads",
      label: "Roads",
      default: defaultRoads,
      choices: [
        ["stones", "Stepping stones"],
        ["numbers", "Numbers"],
      ],
    },
  ],
  render(rng, opts) {
    const warmup = generateMap(rng.fork(1), "warmup", opts.roads);
    warmup.label = SIZES.warmup.label;
    warmup.double = true;
    const main = generateMap(rng.fork(2), opts.size, opts.roads);
    main.label = (SIZES[opts.size] || SIZES.medium).label;
    main.double = true;
    const maps = [warmup, main];
    renderTownSet(maps, root.querySelector(".puzzle-questions"));
    renderTownSetKey(maps, root.querySelector(".puzzle-key"));
  },
});
