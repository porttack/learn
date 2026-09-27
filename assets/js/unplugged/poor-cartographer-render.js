// Draws Poor Cartographer maps (fixed or generated) and their hidden
// answer keys.
import { rectAdjacencyEdges, minColoring } from "./graphs.js";
import { countryMapSvg, patternLegendSvg } from "./graphs-render.js";

function figure(map, coloring) {
  const svg = countryMapSvg(map.rects, { coloring });
  const caption = map.label ? `<figcaption>${map.label}</figcaption>` : "";
  const note = map.note ? `<p class="graphs-map-note">${map.note}</p>` : "";
  return `<figure class="graphs-fig">${svg}${caption}${note}</figure>`;
}

export function renderQuestions(maps, root) {
  if (!root) return;
  root.innerHTML =
    `<p class="graphs-legend-label">If you don't have colored pencils, use these four patterns instead:</p>${patternLegendSvg()}` +
    maps.map((m) => figure(m, null)).join("");
}

export function renderKey(maps, root) {
  if (!root) return;
  root.innerHTML =
    `<h2>Check your answers</h2>` +
    maps
      .map((m) => {
        const edges = rectAdjacencyEdges(m.rects);
        const { k, coloring } = minColoring(m.rects.length, edges);
        return `<div class="graphs-key-item">${figure(m, coloring)}<p><strong>${k} color${k === 1 ? "" : "s"}.</strong> No two touching countries share a pattern.</p></div>`;
      })
      .join("");
}
