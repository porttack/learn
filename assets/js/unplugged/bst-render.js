// Draws binary search trees as SVG: filled-in (numbers showing), blank
// (same shape, empty circles, for the hidden-number game and the build
// page's fill-in-as-you-go templates), and with a search path highlighted
// and numbered for the worked examples and answer keys.
//
// Never relies on color alone: a black-and-white printer still shows every
// distinction here (line weight, dashing, a double ring, an "X").

import { layout } from "./bst.js";

// Full size: big enough to write a two-digit number in a circle by hand,
// for the hidden-number game and the build-a-tree templates. Compact: a
// teaching illustration or a printed-with-its-numbers reference tree that
// nobody writes on, used on the search page so a whole tree of questions
// still fits in a page or two.
const SIZES = {
  normal: { r: 18, dx: 48, dy: 56, pad: 20, font: 15 },
  compact: { r: 12, dx: 34, dy: 38, pad: 13, font: 11 },
};

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// root: a bst.js tree (or null for an empty-tree placeholder).
// path: ordered array of values visited by a search (root first).
// found: whether the last path value is the target itself.
// deadEnd: { after, dir } from searchPath(), drawn as a dashed stub.
// blank: draw empty circles (hidden-number game / build templates).
// vocab: { root, branch, leaf } values to label for the vocabulary figure.
// compact: smaller size for a tree nobody writes on (see SIZES above).
export function treeSvg(
  root,
  { path = [], found = false, deadEnd = null, blank = false, vocab = null, caption = "", compact = false } = {},
) {
  if (!root) {
    return `<p class="bst-empty">(empty tree)</p>`;
  }
  const { r: R, dx: DX, dy: DY, pad: PAD, font: FONT } = compact ? SIZES.compact : SIZES.normal;
  const cellToPx = (cell) => ({ cx: cell.x * DX + DX / 2 + PAD, cy: cell.y * DY + DY / 2 + PAD });
  const { positions, edges, cols, rows } = layout(root);
  const W = Math.max(1, cols) * DX + PAD * 2 - (DX - 2 * R);
  const H = (rows + 1) * DY + PAD;
  const px = (v) => cellToPx(positions.get(v));
  const onPath = new Set(path);
  const order = new Map(path.map((v, i) => [v, i + 1]));

  const parts = [];

  // Edges first, so nodes draw on top of the lines that meet them.
  for (const [a, b] of edges) {
    const pa = px(a), pb = px(b);
    const stepA = order.get(a), stepB = order.get(b);
    const hi = stepA && stepB && Math.abs(stepA - stepB) === 1;
    parts.push(
      `<line x1="${pa.cx}" y1="${pa.cy}" x2="${pb.cx}" y2="${pb.cy}" stroke="${hi ? "#1f6fb2" : "#444"}" stroke-width="${hi ? 3.5 : 1.5}"/>`,
    );
  }

  // A dashed stub toward the empty branch a missed search would have taken.
  if (deadEnd) {
    const p = px(deadEnd.after);
    const dx = deadEnd.dir === "left" ? -DX * 0.55 : DX * 0.55;
    const ex = p.cx + dx;
    const ey = p.cy + DY * 0.72;
    parts.push(`<line x1="${p.cx}" y1="${p.cy}" x2="${ex}" y2="${ey}" stroke="#1f6fb2" stroke-width="2.5" stroke-dasharray="5 4"/>`);
    const s = 8;
    parts.push(
      `<g stroke="#1f6fb2" stroke-width="2.5">` +
        `<line x1="${ex - s}" y1="${ey - s}" x2="${ex + s}" y2="${ey + s}"/>` +
        `<line x1="${ex - s}" y1="${ey + s}" x2="${ex + s}" y2="${ey - s}"/>` +
        `</g>`,
    );
  }

  const scale = R / SIZES.normal.r;
  for (const [value, cell] of positions) {
    const { cx, cy } = cellToPx(cell);
    const hi = onPath.has(value);
    const isTarget = hi && found && order.get(value) === path.length;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${hi ? "#1f6fb2" : "#222"}" stroke-width="${hi ? 3 : 1.6}"/>`);
    // A found target gets a second inner ring instead of a color change.
    if (isTarget) parts.push(`<circle cx="${cx}" cy="${cy}" r="${R - 6}" fill="none" stroke="#1f6fb2" stroke-width="2"/>`);
    if (!blank) {
      parts.push(
        `<text x="${cx}" y="${cy + FONT * 0.35}" text-anchor="middle" font-size="${FONT}" font-weight="700" font-family="system-ui, sans-serif">${esc(value)}</text>`,
      );
    } else {
      // A faint dashed circle inside says "write here," matching the
      // fill-in-as-you-read graphic-organizer convention elsewhere on the
      // site: an empty shape with no dashed hint could read as "no answer
      // needed" instead of "not filled in yet."
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="none" stroke="#bbb" stroke-width="1" stroke-dasharray="3 3"/>`);
    }
    const step = order.get(value);
    if (step) {
      const bx = cx + R * 0.75, by = cy - R * 0.75;
      const br = 9 * scale;
      parts.push(
        `<circle cx="${bx}" cy="${by}" r="${br}" fill="#fff" stroke="#1f6fb2" stroke-width="1.5"/>` +
          `<text x="${bx}" y="${by + 3.5 * scale}" text-anchor="middle" font-size="${10 * scale}" font-weight="700" fill="#1f6fb2" font-family="system-ui, sans-serif">${step}</text>`,
      );
    }
    if (vocab) {
      const label = vocab.root === value ? "root" : vocab.leaf === value ? "leaf" : vocab.branch === value ? "branch" : null;
      if (label) {
        parts.push(
          `<text x="${cx}" y="${cy - R - 8}" text-anchor="middle" font-size="${12 * scale}" font-style="italic" font-family="system-ui, sans-serif">${label}</text>`,
        );
      }
    }
  }

  const svg = `<svg class="bst-tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Binary search tree${blank ? ", numbers hidden" : ""}">${parts.join("")}</svg>`;
  return caption ? `<figure class="bst-fig">${svg}<figcaption>${esc(caption)}</figcaption></figure>` : svg;
}
