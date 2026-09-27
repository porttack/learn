// Draws a Binary Battleship board (fixed or generated) as an SVG grid.
// Ships are shaded with a hatch pattern rather than a color, so the game
// stays readable on a black-and-white printer. String-building only, no
// `document` calls, so it can be reused by both the page module and the
// generator module.
import { LEVELS, labelFor } from "./battleship.js";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

function metrics(level) {
  const L = LEVELS[level];
  const labels = Array.from({ length: L.size }, (_, i) => labelFor(i, level));
  const maxLen = Math.max(...labels.map((s) => s.length));
  // A label longer than 2 characters (a 4-bit binary label) is too wide to
  // sit upright over a narrow column, so it's rotated to run bottom-to-top
  // instead. Row labels stay upright either way; they have a whole margin
  // column to themselves.
  const rotateCols = maxLen > 3;
  const cell = L.size <= 8 ? 30 : 20;
  const margin = maxLen * 7 + 12;
  const topMargin = rotateCols ? maxLen * 7 + 16 : 20;
  return { L, labels, cell, margin, topMargin, rotateCols };
}

// `ships`: this board's own fleet (array of cell lists) to shade in, or []
// for a blank "My shots" tracking board. `idPrefix` keeps this board's hatch
// pattern id unique when several boards sit on one page.
export function boardSvg(level, ships = [], { idPrefix = "b" } = {}) {
  const { L, labels, cell, margin, topMargin, rotateCols } = metrics(level);
  const W = margin + L.size * cell;
  const H = topMargin + L.size * cell;
  const patId = `hatch-${idPrefix}`;
  const parts = [
    `<defs><pattern id="${patId}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#333" stroke-width="3"/>` +
      `</pattern></defs>`,
  ];

  labels.forEach((lab, c) => {
    const x = margin + c * cell + cell / 2;
    if (rotateCols) {
      const y = topMargin - 6;
      parts.push(
        `<text x="${x}" y="${y}" text-anchor="start" font-size="11" font-family="system-ui, sans-serif" transform="rotate(-90 ${x} ${y})">${esc(lab)}</text>`,
      );
    } else {
      parts.push(
        `<text x="${x}" y="${topMargin - 6}" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif">${esc(lab)}</text>`,
      );
    }
  });
  labels.forEach((lab, r) => {
    const y = topMargin + r * cell + cell / 2 + 4;
    parts.push(
      `<text x="${margin - 6}" y="${y}" text-anchor="end" font-size="11" font-family="system-ui, sans-serif">${esc(lab)}</text>`,
    );
  });

  const shipCells = new Set();
  for (const s of ships) for (const [r, c] of s) shipCells.add(`${r},${c}`);

  for (let r = 0; r < L.size; r++) {
    for (let c = 0; c < L.size; c++) {
      const x = margin + c * cell;
      const y = topMargin + r * cell;
      const isShip = shipCells.has(`${r},${c}`);
      const fill = isShip ? `url(#${patId})` : "#fff";
      parts.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="#555" stroke-width="1"/>`);
    }
  }

  return `<svg class="battleship-board" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${L.size} by ${L.size} battleship grid">${parts.join("")}</svg>`;
}

// One player's pair of boards: their own fleet, and a blank tracking grid.
// A big board (16 by 16) is too wide to sit side by side on a printed page
// at a readable cell size, so it stacks instead; the small 8 by 8 board
// still reads fine side by side.
export function playerBoardsHtml(level, ships, idPrefix) {
  const stacked = LEVELS[level].size > 8;
  return `<div class="battleship-boards${stacked ? " stacked" : ""}">
    <figure class="battleship-fig">${boardSvg(level, ships, { idPrefix: `${idPrefix}-ships` })}<figcaption>My ships</figcaption></figure>
    <figure class="battleship-fig">${boardSvg(level, [], { idPrefix: `${idPrefix}-shots` })}<figcaption>My shots</figcaption></figure>
  </div>`;
}
