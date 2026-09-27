import { mountGenerator } from "./generator-shell.js";
import { generateSearchSet, generateBuildSet, SIZES } from "./bst-gen.js";
import {
  renderPracticeQuestions, renderPracticeKey, renderBuildTemplates, renderBuildKey,
} from "./bst-view.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    {
      name: "mode",
      label: "Kind",
      default: "search",
      choices: [
        ["search", "Search a tree"],
        ["build", "Build a tree"],
      ],
    },
    { name: "size", label: "Size", default: "medium", choices: Object.entries(SIZES).map(([k, v]) => [k, v.label]) },
  ],
  render(rng, opts) {
    const qRoot = root.querySelector(".puzzle-questions");
    const keyRoot = root.querySelector(".puzzle-key");
    if (opts.mode === "build") {
      const { values, sorted } = generateBuildSet(rng, { size: opts.size });
      renderBuildTemplates(values, sorted, qRoot);
      renderBuildKey(values, sorted, keyRoot);
    } else {
      const { values, targets } = generateSearchSet(rng, { size: opts.size, count: 5 });
      renderPracticeQuestions(values, targets, qRoot);
      renderPracticeKey(values, targets, keyRoot);
    }
  },
});
