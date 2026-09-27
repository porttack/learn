import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS, MODES } from "./search-gen.js";
import { setHtml, keyHtml } from "./search-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "level", label: "How many numbers", default: 15, choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]) },
    { name: "mode", label: "List", default: "sorted", choices: Object.entries(MODES).map(([k, v]) => [k, v.label]) },
  ],
  render(rng, opts) {
    const set = generateSet(rng, { level: opts.level, mode: opts.mode });
    root.querySelector(".puzzle-body").innerHTML = setHtml(set);
    root.querySelector(".puzzle-key").innerHTML = `<h2>Answer key</h2>${keyHtml(set)}`;
  },
});
