// Shared SVG drawing for the three graph activities. Kept separate from
// graphs.js (the DOM-free puzzle logic) so this file can safely assume it's
// only ever used in a browser, the same split robot.js/robot-render.js use.

export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// ---- Streets: houses or corners joined by lines (Muddy City, Tourist Town) --

// nodes: [{x, y}]. edges: [{a, b, w?}].
//   weighted:  show each street's paving-stone count.
//   chosen:    a Set of edge indices to draw as paved (thick, dashed black).
//   vans:      a Set of node indices to draw as filled ("has a van").
export function streetGraphSvg(nodes, edges, { width, height, weighted = false, chosen = null, vans = null, pad = 26 } = {}) {
  const R = 17;
  const W = width + pad * 2;
  const H = height + pad * 2;
  const at = (n) => [n.x + pad, n.y + pad];
  const parts = [];

  edges.forEach((e, i) => {
    const [ax, ay] = at(nodes[e.a]);
    const [bx, by] = at(nodes[e.b]);
    const paved = chosen && chosen.has(i);
    parts.push(
      `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${paved ? "#111" : "#999"}" stroke-width="${paved ? 5 : 2.5}" ${paved ? 'stroke-dasharray="1 0"' : ""}/>`,
    );
    if (weighted) {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      parts.push(
        `<rect x="${mx - 10}" y="${my - 11}" width="20" height="18" fill="#fff" stroke="${paved ? "#111" : "#bbb"}" stroke-width="1"/>` +
        `<text x="${mx}" y="${my + 3}" text-anchor="middle" font-size="13" font-weight="${paved ? 700 : 400}" font-family="system-ui, sans-serif">${e.w}</text>`,
      );
    }
  });

  nodes.forEach((n, i) => {
    const [x, y] = at(n);
    const isVan = vans && vans.has(i);
    parts.push(
      `<circle cx="${x}" cy="${y}" r="${R}" fill="${isVan ? "#111" : "#fff"}" stroke="#111" stroke-width="2.5"/>` +
      `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${isVan ? "#fff" : "#111"}" font-family="system-ui, sans-serif">${i + 1}</text>`,
    );
  });

  return `<svg class="graphs-street" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Map with ${nodes.length} ${weighted ? "houses" : "corners"}">${parts.join("")}</svg>`;
}

// ---- Country maps (the Poor Cartographer) ---------------------------------

// Four ways to fill a country that never rely on color alone: dots,
// stripes, cross-hatch, solid black.
const PATTERN_NAMES = ["dots", "stripes", "cross", "solid"];

// Every <svg> that defines these patterns needs its own id namespace --
// two inline SVGs on the same page sharing one literal id (say,
// "patt-dots") is invalid HTML, and browsers don't reliably keep their
// url(#...) references separate. Each call gets a fresh numeric suffix.
let uid = 0;
function patternDefsSvg(suffix) {
  return `<defs>
    <pattern id="patt-dots-${suffix}" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#fff"/>
      <circle cx="3" cy="3" r="1.6" fill="#111"/>
      <circle cx="8" cy="8" r="1.6" fill="#111"/>
    </pattern>
    <pattern id="patt-stripes-${suffix}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="10" height="10" fill="#fff"/>
      <rect width="4" height="10" fill="#111"/>
    </pattern>
    <pattern id="patt-cross-${suffix}" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#fff"/>
      <path d="M0 0 L10 10 M10 0 L0 10" stroke="#111" stroke-width="1.6"/>
    </pattern>
    <pattern id="patt-solid-${suffix}" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#111"/>
    </pattern>
  </defs>`;
}

// A small key showing what each fill means, since a black-and-white
// printout can't show color. Same four patterns every time.
export function patternLegendSvg() {
  const suffix = `legend${uid++}`;
  const labels = ["Pattern A", "Pattern B", "Pattern C", "Pattern D"];
  const boxes = PATTERN_NAMES.map(
    (name, i) => `<g transform="translate(${i * 92}, 0)">
      <rect width="26" height="26" fill="url(#patt-${name}-${suffix})" stroke="#111" stroke-width="1.5"/>
      <text x="34" y="18" font-size="13" font-family="system-ui, sans-serif">${labels[i]}</text>
    </g>`,
  ).join("");
  return `<svg class="graphs-legend" viewBox="0 0 ${92 * 4} 28" width="${92 * 4}" height="28" role="img" aria-label="Four fill patterns: dots, stripes, cross-hatch, solid black">${patternDefsSvg(suffix)}${boxes}</svg>`;
}

// rects: [{x, y, w, h}]. `coloring`, if given, is one color index per
// country (fills it in, for the key). Without it, countries print blank
// and labeled, ready for a student to fill in by hand.
export function countryMapSvg(rects, { coloring = null, pad = 8 } = {}) {
  const suffix = `map${uid++}`;
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const W = maxX + pad * 2;
  const H = maxY + pad * 2;
  const parts = [patternDefsSvg(suffix)];
  rects.forEach((r, i) => {
    const x = r.x + pad, y = r.y + pad;
    const fill = coloring ? `url(#patt-${PATTERN_NAMES[coloring[i]]}-${suffix})` : "#fff";
    parts.push(`<rect x="${x}" y="${y}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="#111" stroke-width="2.5"/>`);
    const cx = x + r.w / 2, cy = y + r.h / 2;
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="12" fill="#fff" stroke="#111" stroke-width="1.5"/>` +
      `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">${String.fromCharCode(65 + i)}</text>`,
    );
  });
  return `<svg class="graphs-map" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Map of ${rects.length} countries">${parts.join("")}</svg>`;
}
