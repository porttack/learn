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
//
// "Copies" makes a class set: N different sheets (sets #seed, #seed+1, ...),
// each starting a new printed page with its own Name/Date/Period line. When
// the key is shown (?key=1), all the keys print together at the end, each
// labeled with its set number. Works for every generator: the shell calls
// render() once per copy and snapshots what it drew.
import { makeRng, randomSeed } from "./rng.js";

export function mountGenerator({ root, options = [], render }) {
  const params = new URLSearchParams(location.search);
  let seed = Number(params.get("seed")) || randomSeed();
  const COPIES = [1, 5, 10, 20, 25, 30, 35];
  let copies = COPIES.includes(Number(params.get("copies"))) ? Number(params.get("copies")) : 1;
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
    `<label>Copies <select name="copies">${COPIES.map((c) => `<option value="${c}"${c === copies ? " selected" : ""}>${c === 1 ? "1" : c + " (class set)"}</option>`).join("")}</select></label>
     <button type="button" class="generator-new">New set</button>
     <button type="button" class="generator-print">Print</button>
     <label class="generator-seed-label">Set #<input name="seed" type="number" min="1" inputmode="numeric"></label>`;
  root.prepend(bar);

  const seedLabels = root.querySelectorAll(".generator-seed");
  const seedInput = bar.querySelector('input[name="seed"]');

  // Everything the generator draws into (all of root except the toolbar).
  const parts = () => [...root.children].filter((c) => c !== bar && !c.classList.contains("class-set"));

  const drawOne = (s) => {
    seedLabels.forEach((el) => (el.textContent = `Set #${s}`));
    render(makeRng(s), { ...opts }, s);
  };

  const draw = () => {
    seedInput.value = seed;
    // Keep parameters other pages care about (player=, key=).
    const q = new URLSearchParams(location.search);
    q.set("seed", seed);
    for (const [k, v] of Object.entries(opts)) q.set(k, v);
    if (copies > 1) q.set("copies", copies); else q.delete("copies");
    history.replaceState(null, "", `${location.pathname}?${q}`);

    root.querySelector(":scope > .class-set")?.remove();
    parts().forEach((p) => p.classList.remove("class-set-original"));
    if (copies === 1) {
      drawOne(seed);
      return;
    }
    // Class set: draw each copy, snapshot it, and stack the snapshots.
    const set = document.createElement("div");
    set.className = "class-set";
    const keys = document.createElement("div");
    keys.className = "class-set-keys";
    const nameLine = document.querySelector(".name-line");
    // Each copy gets the sheet's short title ("Robot grid: make a new set"
    // -> "Robot grid"); the page's own title is hidden in print (see CSS).
    const pageTitle = (document.querySelector("article h1")?.textContent || "").split(":")[0].trim();
    for (let i = 0; i < copies; i++) {
      const s = seed + i;
      drawOne(s);
      const copy = document.createElement("section");
      copy.className = "class-set-copy";
      if (nameLine) copy.appendChild(nameLine.cloneNode(true));
      if (pageTitle) {
        const h = document.createElement("h2");
        h.className = "class-set-title";
        h.textContent = pageTitle;
        copy.appendChild(h);
      }
      for (const p of parts()) copy.appendChild(p.cloneNode(true));
      // Pull the answer keys out so they print together at the end.
      copy.querySelectorAll(".answer-key").forEach((k) => {
        const holder = document.createElement("div");
        holder.className = "class-set-key";
        holder.innerHTML = `<p class="class-set-key-label"><strong>Set #${s}</strong></p>`;
        holder.append(...k.childNodes);
        keys.appendChild(holder);
        k.remove();
      });
      set.appendChild(copy);
    }
    if (keys.children.length) {
      const wrap = document.createElement("section");
      wrap.className = "answer-key class-set-answer-key";
      wrap.innerHTML = "<h2>Answer keys</h2>";
      wrap.appendChild(keys);
      set.appendChild(wrap);
    }
    // Hide the originals with !important CSS: a plain `hidden` loses to the
    // rule that shows answer keys when ?key=1.
    parts().forEach((p) => p.classList.add("class-set-original"));
    root.appendChild(set);
  };

  bar.addEventListener("change", (e) => {
    if (e.target.name === "seed") seed = Number(e.target.value) || seed;
    else if (e.target.name === "copies") copies = Number(e.target.value) || 1;
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
