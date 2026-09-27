// Draws binary logic puzzle grids (fixed or generated) and their answer
// key. A blank cell prints empty so a student can pencil in a digit; a
// given cell prints bold on a light shaded background, so the difference
// still reads on a black-and-white printer even without the bold weight.

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Cell size (in em) by grid size n, smaller for a bigger grid so it still
// fits the page, and smaller again in "small" mode (the answer key).
function cellSize(n, small) {
  const full = { 4: 2.3, 6: 1.9, 8: 1.5, 10: 1.2 };
  const compact = { 4: 1.0, 6: 0.9, 8: 0.75, 10: 0.62 };
  const cell = (small ? compact : full)[n] ?? (small ? 0.6 : 1.1);
  return { cell, font: Math.round(cell * 55) / 100 };
}

function gridTable(n, cellAt, { small = false } = {}) {
  const { cell, font } = cellSize(n, small);
  const rows = [];
  for (let r = 0; r < n; r++) {
    const cells = [];
    for (let c = 0; c < n; c++) cells.push(cellAt(r, c));
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table class="binairo-grid${small ? " small" : ""}" style="--cell: ${cell}em; --font: ${font}em"><tbody>${rows.join("")}</tbody></table>`;
}

// The puzzle as a student sees it: givens filled in bold, everything else
// an empty box to write in.
function puzzleTable(given) {
  const n = given.length;
  return gridTable(n, (r, c) => {
    const v = given[r][c];
    return v === null ? `<td class="blank"></td>` : `<td class="given">${v}</td>`;
  });
}

// The full solved grid for the answer key: same given/blank styling, but
// every cell is filled in, so a student can see at a glance which digits
// they had to work out.
function solvedTable(given, solution) {
  const n = solution.length;
  return gridTable(n, (r, c) => {
    const isGiven = given[r][c] !== null;
    return `<td class="${isGiven ? "given" : "solved"}">${solution[r][c]}</td>`;
  }, { small: true });
}

function label(p, i) {
  return p.label || `Puzzle ${i} (${p.n}x${p.n})`;
}

function puzzleFigure(p, i) {
  return `<figure class="binairo-puzzle">
    <figcaption>${i}. ${esc(label(p, i))}</figcaption>
    ${puzzleTable(p.given)}
  </figure>`;
}

function keyFigure(p, i) {
  return `<figure class="binairo-puzzle binairo-key-fig">
    <figcaption>${i}. ${esc(label(p, i))}</figcaption>
    ${solvedTable(p.given, p.solution)}
  </figure>`;
}

// Fills `qRoot` with the puzzle grids and `keyRoot` (if given) with the
// solved grids. Same shape as robot-render.js's renderSet, so a fixed
// worksheet and the generator page can share this one function.
export function renderPuzzleSet(puzzles, qRoot, keyRoot) {
  qRoot.innerHTML = `<div class="binairo-puzzles">${puzzles.map((p, i) => puzzleFigure(p, i + 1)).join("")}</div>`;
  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>
      <p class="binairo-key-intro">Shaded squares are the ones you started with; the rest is what you filled in.</p>
      <div class="binairo-puzzles binairo-key">${puzzles.map((p, i) => keyFigure(p, i + 1)).join("")}</div>`;
  }
}
