// Draws Muddy City maps (fixed or generated) and their hidden answer keys.
import { kruskalMST } from "./graphs.js";
import { streetGraphSvg } from "./graphs-render.js";

function figure(map, chosen) {
  const svg = streetGraphSvg(map.nodes, map.edges, {
    width: map.width,
    height: map.height,
    weighted: true,
    chosen,
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
     <p class="graphs-key-intro">The thick black streets are the cheapest way to connect every house.</p>` +
    maps
      .map((m) => {
        const { chosen, total } = kruskalMST(m.nodes.length, m.edges);
        return `<div class="graphs-key-item">${figure(m, new Set(chosen))}<p><strong>${total} paving stones.</strong></p></div>`;
      })
      .join("");
}
