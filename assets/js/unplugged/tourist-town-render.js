// Draws Tourist Town maps (fixed or generated) and their hidden answer
// keys.
import { minDominatingSet } from "./graphs.js";
import { streetGraphSvg } from "./graphs-render.js";

function figure(map, vans) {
  const svg = streetGraphSvg(map.nodes, map.edges, {
    width: map.width,
    height: map.height,
    weighted: false,
    vans,
  });
  return `<figure class="graphs-fig">${svg}${map.label ? `<figcaption>${map.label}</figcaption>` : ""}</figure>`;
}

export function renderQuestions(maps, root) {
  if (!root) return;
  root.innerHTML = maps.map((m) => figure(m, null)).join("");
}

export function renderKey(maps, root) {
  if (!root) return;
  root.innerHTML =
    `<h2>Check your answers</h2>
     <p class="graphs-key-intro">The filled corners are one way to place the fewest vans.</p>` +
    maps
      .map((m) => {
        const { size, set } = minDominatingSet(m.nodes.length, m.edges);
        return `<div class="graphs-key-item">${figure(m, new Set(set))}<p><strong>${size} van${size === 1 ? "" : "s"}.</strong></p></div>`;
      })
      .join("");
}
