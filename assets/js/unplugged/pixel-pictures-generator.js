import { mountGenerator } from "./generator-shell.js";
import { generateSet, SIZES } from "./pixel-gen.js";
import { renderSet } from "./pixel-render.js";

const root = document.querySelector(".puzzle-generator");
mountGenerator({
  root,
  options: [
    { name: "size", label: "Size", default: "small", choices: Object.entries(SIZES).map(([k, v]) => [k, v.label]) },
    // Default 2, not 3: a class-set copy's first page also carries the Name
    // line and title, and 3 small pictures plus that header don't fit one
    // printed page (the 3rd picture's whole .pixel-q block, break-inside:
    // avoid, wraps to a second page instead of sharing the first). 2 always
    // fits, keeping "Sets per student: 2" at exactly 2 pages per student.
    // Higher counts (up to 8) are there for a teacher who'd rather hand out
    // one bigger set than two small ones -- more room for the one encode
    // question to not feel so rare, at the cost of more than one page.
    { name: "count", label: "Pictures", default: 2, choices: [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8"]] },
  ],
  render(rng, opts) {
    const pics = generateSet(rng, { size: opts.size, count: Number(opts.count) });
    renderSet(pics, root.querySelector(".puzzle-questions"), root.querySelector(".puzzle-key"));
  },
});
