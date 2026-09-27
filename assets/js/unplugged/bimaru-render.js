// Draws Solo Battleship grids (fixed or generated): a table with row and
// column counts as headers, given ship/water squares marked, everything
// else an empty box for pencil, plus a fleet key the student can cross
// ships off as they place them. String-building only, no `document` calls,
// so it's reused by both the fixed-worksheet page module and the generator
// module.

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// The label printed for a row or column count: plain decimal, or a 3-bit
// binary string for the binary-counts level. Counts on this puzzle never
// exceed 7 (the largest fleet used tops out at a 4-long ship on an 8-wide
// grid), so 3 bits always fit.
function countLabel(v, binary) {
  return binary ? v.toString(2).padStart(3, "0") : String(v);
}

// Cell size (in em), smaller as the grid grows so an 8 by 8 puzzle still
// fits the page, but never as small as a plain logic-puzzle grid: these
// need to stay big enough to shade in with a pencil.
function cellSize(n) {
  if (n <= 5) return 2.2;
  if (n === 6) return 1.9;
  return 1.5;
}

function puzzleTable(n, rowCounts, colCounts, given, binary) {
  const cell = cellSize(n);
  const lab = (v) => countLabel(v, binary);
  const rows = [];
  rows.push(
    `<tr><td class="bimaru-corner"></td>${colCounts
      .map((v) => `<td class="bimaru-count-col">${lab(v)}</td>`)
      .join("")}</tr>`,
  );
  for (let r = 0; r < n; r++) {
    const cells = [`<td class="bimaru-count-row">${lab(rowCounts[r])}</td>`];
    for (let c = 0; c < n; c++) {
      const v = given[r][c];
      if (v === 1) cells.push(`<td class="given-ship" aria-label="ship, given"></td>`);
      else if (v === 0) cells.push(`<td class="given-water" aria-label="water, given"><span class="water-dot">&bull;</span></td>`);
      else cells.push(`<td class="blank"></td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table class="bimaru-grid${binary ? " binary" : ""}" style="--cell: ${cell}em">
    <tbody>${rows.join("")}</tbody>
  </table>`;
}

// A row of small boxes for each distinct ship length in the fleet, longest
// first, with one checkbox-style square per ship of that length so a
// student can cross each one off as they find it.
function fleetKeyHtml(fleet) {
  const counts = new Map();
  for (const len of fleet) counts.set(len, (counts.get(len) || 0) + 1);
  const lengths = [...counts.keys()].sort((a, b) => b - a);
  const rows = lengths
    .map((len) => {
      const ship = `<span class="fleet-ship" aria-label="${len} square ship">${"<i></i>".repeat(len)}</span>`;
      const boxes = Array.from({ length: counts.get(len) }, () => `<span class="fleet-box"></span>`).join("");
      return `<div class="fleet-row">${ship}<span class="fleet-boxes">${boxes}</span></div>`;
    })
    .join("");
  return `<div class="fleet-key"><p class="fleet-key-title">Fleet</p>${rows}</div>`;
}

function label(p, i) {
  return p.label || `Puzzle ${i} (${p.n} by ${p.n})`;
}

export function puzzleFigure(p, i) {
  return `<figure class="bimaru-puzzle">
    <figcaption>${i}. ${esc(label(p, i))}</figcaption>
    <div class="bimaru-puzzle-body">
      ${puzzleTable(p.n, p.rowCounts, p.colCounts, p.given, p.binary)}
      ${fleetKeyHtml(p.fleet)}
    </div>
  </figure>`;
}

// Fills `qRoot` with every puzzle's grid and fleet key. `puzzles[i].given`
// must already be a grid array (bimaru.js's 1/0/null form); bimaru-page.js
// parses the frozen text form before calling this, and the live generator
// hands grid arrays straight from bimaru-gen.js.
export function renderPuzzleSet(puzzles, qRoot) {
  qRoot.innerHTML = `<div class="bimaru-puzzles">${puzzles.map((p, i) => puzzleFigure(p, i + 1)).join("")}</div>`;
}

// ---- Answer key: solved grids -------------------------------------------
//
// Same table drawing as puzzleFigure, but fed the finished solution instead
// of the given/blank grid, and no fleet key (there's nothing left to cross
// off). Kept small and fleet-key-free so a whole set of solved grids still
// fits on one printed key page. `puzzles[i].solution` must already be a
// grid array, same convention as `.given` above.
export function solvedFigure(p, i) {
  return `<figure class="bimaru-puzzle bimaru-key-puzzle">
    <figcaption>${i}. ${esc(label(p, i))}</figcaption>
    ${puzzleTable(p.n, p.rowCounts, p.colCounts, p.solution, p.binary)}
  </figure>`;
}

export function renderKeySet(puzzles, keyRoot) {
  keyRoot.innerHTML = `<h2>Answer key</h2><div class="bimaru-puzzles bimaru-key">${puzzles.map((p, i) => solvedFigure(p, i + 1)).join("")}</div>`;
}
