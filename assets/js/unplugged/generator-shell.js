// Shared toolbar for "make me a new one" puzzle pages.
//
// Usage, from an activity's own generator module:
//
//   mountGenerator({
//     root: document.querySelector(".puzzle-generator"),
//     options: [{ name: "level", label: "Level", choices: [["ms", "Middle school"], ...] }],
//     render(rng, opts, seed) { ...fill .puzzle-questions and .puzzle-key... },
//   });
//
// The seed and every option live in the URL, so a page can be bookmarked or
// reprinted exactly, and the seed is printed on the sheet (and its answer
// key) so paper and key always match.
import { makeRng, randomSeed } from "./rng.js";

export function mountGenerator({ root, options = [], render }) {
  const params = new URLSearchParams(location.search);
  let seed = Number(params.get("seed")) || randomSeed();
  const opts = {};
  for (const o of options) {
    const v = params.get(o.name);
    opts[o.name] = o.choices.some(([val]) => String(val) === v) ? v : String(o.default ?? o.choices[0][0]);
  }

  const bar = document.createElement("form");
  bar.className = "generator-bar";
  bar.innerHTML =
    options
      .map(
        (o) => `<label>${o.label}
          <select name="${o.name}">${o.choices
            .map(([val, text]) => `<option value="${val}"${String(val) === opts[o.name] ? " selected" : ""}>${text}</option>`)
            .join("")}</select></label>`,
      )
      .join("") +
    `<button type="button" class="generator-new">New set</button>
     <button type="button" class="generator-print">Print</button>
     <label class="generator-seed-label">Set #<input name="seed" type="number" min="1" inputmode="numeric"></label>`;
  root.prepend(bar);

  const seedLabels = root.querySelectorAll(".generator-seed");
  const seedInput = bar.querySelector('input[name="seed"]');

  const draw = () => {
    seedInput.value = seed;
    seedLabels.forEach((el) => (el.textContent = `Set #${seed}`));
    // Keep parameters other pages care about (player=, key=).
    const q = new URLSearchParams(location.search);
    q.set("seed", seed);
    for (const [k, v] of Object.entries(opts)) q.set(k, v);
    history.replaceState(null, "", `${location.pathname}?${q}`);
    render(makeRng(seed), { ...opts }, seed);
  };

  bar.addEventListener("change", (e) => {
    if (e.target.name === "seed") seed = Number(e.target.value) || seed;
    else opts[e.target.name] = e.target.value;
    draw();
  });
  bar.addEventListener("submit", (e) => e.preventDefault());
  bar.querySelector(".generator-new").addEventListener("click", () => {
    seed = randomSeed();
    draw();
  });
  bar.querySelector(".generator-print").addEventListener("click", () => window.print());
  draw();
}
