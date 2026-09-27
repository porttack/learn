// Draws pixel-picture question sets (fixed or generated) and their answer
// keys: a blank grid plus its code for the puzzle, a shaded grid for the
// key. Squares are drawn big enough to shade in with a pencil.
import { encodeRow } from "./pixels.js";

// Blank puzzle grids are drawn big (CELL) so a student can shade them in
// with a pencil. The answer key just needs to be legible at a glance, not
// shaded by hand, so it's drawn smaller (KEY_CELL) to keep the answer
// page compact.
const CELL = 24;
const KEY_CELL = 16;

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// shade: true draws the picture's actual black squares (the answer key).
// false draws a blank grid, ruled off so a student can shade it by hand.
export function pictureSvg(pic, { shade = true, caption = "", cell = CELL } = {}) {
  const W = pic.w * cell;
  const H = pic.h * cell;
  const parts = [];
  for (let r = 0; r < pic.h; r++) {
    for (let c = 0; c < pic.w; c++) {
      const black = shade && pic.rows[r][c] === 1;
      parts.push(
        `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="${black ? "#111" : "#fff"}" stroke="#888" stroke-width="1"/>`,
      );
    }
  }
  const label = `${pic.w} by ${pic.h} pixel grid${shade ? "" : ", blank"}`;
  const svg = `<svg class="pixel-grid" viewBox="-1 -1 ${W + 2} ${H + 2}" width="${W + 2}" height="${H + 2}" role="img" aria-label="${esc(label)}">${parts.join("")}</svg>`;
  return caption ? `<figure class="pixel-grid-fig">${svg}<figcaption>${esc(caption)}</figcaption></figure>` : svg;
}

function codeText(pic) {
  return pic.rows.map((row) => encodeRow(row).join(", ")).join("\n");
}

function questionHtml(pic, n) {
  const code = codeText(pic);
  const grid = pictureSvg(pic, { shade: false });
  return `<div class="pixel-q">
    <p class="pixel-q-prompt"><strong>Picture ${n}.</strong> Shade the grid to match this code. Each line is one row, top to bottom.</p>
    <div class="pixel-q-body">
      <pre class="pixel-code">${esc(code)}</pre>
      ${grid}
    </div>
  </div>`;
}

function keyHtml(pic, n) {
  const caption = pic.name ? `Picture ${n}: ${pic.name}` : `Picture ${n}`;
  return pictureSvg(pic, { shade: true, caption, cell: KEY_CELL });
}

// Fills qRoot with the questions and keyRoot with the answer key.
export function renderSet(pics, qRoot, keyRoot) {
  qRoot.innerHTML = pics.map((p, i) => questionHtml(p, i + 1)).join("");
  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>
      <p class="pixel-key-intro">Here is what each code draws.</p>
      <div class="pixel-grids">${pics.map((p, i) => keyHtml(p, i + 1)).join("")}</div>`;
  }
}
