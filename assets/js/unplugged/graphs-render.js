// Shared SVG drawing for the three graph activities. Kept separate from
// graphs.js (the DOM-free puzzle logic) so this file can safely assume it's
// only ever used in a browser, the same split robot.js/robot-render.js use.

import { LETTERS } from "./graphs.js";

export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// A small house outline (roof + walls as one five-point polygon), used in
// place of a plain circle for Muddy City so a "house" reads as a house at a
// glance. Bigger than a circle would be (not just matching R=17 below) --
// pencil-and-paper shading needs a label and a wall big enough to write
// next to, not a minimal glyph.
function houseIconSvg(x, y, filled) {
  const halfW = 20;
  const top = y - 21;
  const roofBottom = y - 4;
  const bottom = y + 21;
  const left = x - halfW;
  const right = x + halfW;
  const fill = filled ? "#111" : "#fff";
  return `<polygon points="${left},${bottom} ${left},${roofBottom} ${x},${top} ${right},${roofBottom} ${right},${bottom}" fill="${fill}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/>`;
}

// A street's cost drawn as a row of little rounded "stepping stones" (the
// book's own picture for Muddy City) instead of a number: a student counts
// and shades them. Kept clear of the houses at each end with `inset`, and
// given a real minimum gap so neighboring stones never touch (that's a
// grid-spacing job too -- see SPACING in muddy-city.js -- but the floor
// here is the last line of defense).
function stoneRoadSvg(ax, ay, bx, by, count, paved) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  // The inset shrinks on a short road (instead of staying a fixed amount)
  // so stones are never pushed past the segment's own ends and over a
  // house icon -- usable is always the real room between the two insets,
  // never padded out past it.
  const inset = Math.min(26, len * 0.22);
  const usable = Math.max(len - inset * 2, 8);
  const minGap = 3;
  let stoneLen = (usable - minGap * (count - 1)) / count;
  stoneLen = Math.max(5, Math.min(18, stoneLen));
  // Last-resort clamp: even at the smallest readable size, `count` stones
  // in a row might still be too wide for a very short road. Shrink further
  // rather than let them spill past `usable` and over a house icon.
  if (stoneLen * count > usable) stoneLen = usable / count;
  const gap = count > 1 ? Math.max(0, (usable - stoneLen * count) / (count - 1)) : 0;
  const thick = 12;
  // Center the row of stones in the usable stretch rather than anchoring it
  // to the first house: a low-cost road (one or two stones, capped well
  // under `usable`) would otherwise read as "a plain line with a stone
  // stuck on the end", easy to mistake for a road with no stones at all.
  const span = stoneLen * count + gap * (count - 1);
  const extra = Math.max(0, (usable - span) / 2);
  const startX = ax + ux * (inset + extra);
  const startY = ay + uy * (inset + extra);
  const fill = paved ? "#111" : "#fff";
  const stroke = paved ? "#111" : "#444";
  const parts = [];
  for (let k = 0; k < count; k++) {
    const d = k * (stoneLen + gap) + stoneLen / 2;
    const cx = (startX + ux * d).toFixed(1);
    const cy = (startY + uy * d).toFixed(1);
    parts.push(
      `<rect x="${(-stoneLen / 2).toFixed(1)}" y="${-thick / 2}" width="${stoneLen.toFixed(1)}" height="${thick}" rx="3" ry="3" fill="${fill}" stroke="${stroke}" stroke-width="${paved ? 1.3 : 1.6}" transform="translate(${cx},${cy}) rotate(${angle.toFixed(1)})"/>`,
    );
  }
  return parts.join("");
}

// ---- Streets: houses or corners joined by lines (Muddy City, Tourist Town) --

// nodes: [{x, y}]. edges: [{a, b, w?}].
//   weighted:  show each street's paving-stone count.
//   chosen:    a Set of edge indices to draw as paved (thick black, or
//              shaded stepping stones when `stones` is on).
//   vans:      a Set of node indices to draw as filled ("has a van").
//   houses:    draw each node as a little house instead of a plain circle
//              (Muddy City only -- Tourist Town keeps circles/corners).
//   labels:    "numbers" (default) or "letters" (A, B, C, ... never
//              confusable with a road's paving-stone count).
//   stones:    when `weighted`, draw each street's cost as a row of
//              stepping stones instead of a number box.
export function streetGraphSvg(
  nodes,
  edges,
  { width, height, weighted = false, chosen = null, vans = null, houses = false, pad = houses ? 34 : 26, labels = "numbers", stones = false } = {},
) {
  const R = 17;
  const W = width + pad * 2;
  const H = height + pad * 2;
  const at = (n) => [n.x + pad, n.y + pad];
  const parts = [];

  edges.forEach((e, i) => {
    const [ax, ay] = at(nodes[e.a]);
    const [bx, by] = at(nodes[e.b]);
    const paved = chosen && chosen.has(i);
    const stoneRoad = weighted && stones;
    const lineColor = stoneRoad ? "#bbb" : paved ? "#111" : "#999";
    const lineWidth = stoneRoad ? 1 : paved ? 5 : 2.5;
    parts.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${lineColor}" stroke-width="${lineWidth}"/>`);
    if (stoneRoad) {
      parts.push(stoneRoadSvg(ax, ay, bx, by, e.w, paved));
    } else if (weighted) {
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
    const label = esc(labels === "letters" ? LETTERS[i] || String(i + 1) : String(i + 1));
    const fontSize = houses ? 18 : 14;
    const text = `<text x="${x}" y="${y + (houses ? 6 : 5)}" text-anchor="middle" font-size="${fontSize}" font-weight="700" fill="${isVan ? "#fff" : "#111"}" font-family="system-ui, sans-serif">${label}</text>`;
    if (houses) {
      parts.push(houseIconSvg(x, y, isVan) + text);
    } else {
      parts.push(
        `<circle cx="${x}" cy="${y}" r="${R}" fill="${isVan ? "#111" : "#fff"}" stroke="#111" stroke-width="2.5"/>` + text,
      );
    }
  });

  const nounPlural = houses ? "lettered houses" : weighted ? "houses" : "corners";
  return `<svg class="graphs-street" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Map with ${nodes.length} ${nounPlural}">${parts.join("")}</svg>`;
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
