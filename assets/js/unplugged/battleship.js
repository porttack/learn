// Binary Battleship: grid levels, binary/hex labels, and fleet legality.
//
// A "fleet" is { level, ships }, where ships is an array of ship cell
// lists, each cell a [row, col] pair, e.g. ships: [[[0,0],[0,1],[0,2]], ...].
// Fleets are either produced by generateFleet() (random, seeded) or
// hand-frozen into _data/unplugged/binary-battleship*.yml. validateFleet()
// checks both the same way, so a frozen sheet can never quietly go stale.
//
// DOM-free on purpose: tools/check_binary_battleship.mjs imports this in
// Node to verify every fleet, generated and frozen.

export const LEVELS = {
  easy: {
    label: "Easy: 8 by 8, 3-bit binary labels",
    size: 8,
    bits: 3,
    hex: false,
    ships: [5, 4, 3, 3, 2],
  },
  harder: {
    label: "Harder: 16 by 16, 4-bit binary labels",
    size: 16,
    bits: 4,
    hex: false,
    ships: [5, 5, 4, 4, 3, 3, 3, 2, 2],
  },
  hex: {
    label: "Hex challenge: 16 by 16, hex labels",
    size: 16,
    bits: 4,
    hex: true,
    ships: [5, 5, 4, 4, 3, 3, 3, 2, 2],
  },
};

// The label printed on row/column n at this level: a zero-padded binary
// string ("101"), or a single hex digit ("A") when the level says hex.
export function labelFor(n, level) {
  const L = LEVELS[level];
  if (!L) throw new Error(`Unknown level "${level}"`);
  return L.hex ? n.toString(16).toUpperCase() : n.toString(2).padStart(L.bits, "0");
}

// Place value of each binary digit, most significant first, e.g. [4, 2, 1]
// for a 3-bit level. null for a hex level (a hex digit isn't place-value
// decomposed the same way; it's just the number itself).
export function placeValues(level) {
  const L = LEVELS[level];
  if (!L) throw new Error(`Unknown level "${level}"`);
  if (L.hex) return null;
  return Array.from({ length: L.bits }, (_, i) => 2 ** (L.bits - 1 - i));
}

const key = (r, c) => `${r},${c}`;

// Every cell adjacent to (r, c), including diagonally.
function neighborhood(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) out.push([r + dr, c + dc]);
  return out;
}

// A random legal fleet for `level`: every ship in bounds, no two ships
// overlap or touch (even diagonally), so a hit is never ambiguous about
// which ship it belongs to.
export function generateFleet(rng, level) {
  const L = LEVELS[level];
  if (!L) throw new Error(`Unknown level "${level}"`);
  const { size, ships } = L;

  for (let attempt = 0; attempt < 300; attempt++) {
    const placedShips = [];
    const forbidden = new Set();
    let ok = true;

    for (const len of ships) {
      let placed = null;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const horizontal = rng.chance(0.5);
        const maxR = horizontal ? size - 1 : size - len;
        const maxC = horizontal ? size - len : size - 1;
        if (maxR < 0 || maxC < 0) continue;
        const r = rng.int(0, maxR);
        const c = rng.int(0, maxC);
        const cells = Array.from({ length: len }, (_, i) => (horizontal ? [r, c + i] : [r + i, c]));
        if (cells.some(([rr, cc]) => forbidden.has(key(rr, cc)))) continue;
        placed = cells;
      }
      if (!placed) {
        ok = false;
        break;
      }
      for (const [rr, cc] of placed) {
        for (const [nr, nc] of neighborhood(rr, cc)) forbidden.add(key(nr, nc));
      }
      placedShips.push(placed);
    }

    if (ok) return { level, ships: placedShips };
  }
  throw new Error(`Couldn't place a legal fleet for level "${level}" after many attempts`);
}

function isStraightRun(cells) {
  if (!cells.length) return false;
  if (cells.length === 1) return true;
  const sorted = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const sameRow = sorted.every(([r]) => r === sorted[0][0]);
  const sameCol = sorted.every(([, c]) => c === sorted[0][1]);
  if (sameRow) {
    const cols = sorted.map(([, c]) => c);
    return cols.every((c, i) => i === 0 || c === cols[i - 1] + 1);
  }
  if (sameCol) {
    const rows = sorted.map(([r]) => r);
    return rows.every((r, i) => i === 0 || r === rows[i - 1] + 1);
  }
  return false;
}

function shipsTouch(a, b) {
  const setB = new Set(b.map(([r, c]) => key(r, c)));
  for (const [r, c] of a) {
    for (const [nr, nc] of neighborhood(r, c)) {
      if (setB.has(key(nr, nc))) return true;
    }
  }
  return false;
}

// Re-derives every legality rule from scratch (bounds, straight and
// contiguous, no overlap, no touching, right ship lengths for the level),
// so it catches a mistake in generateFleet() as readily as a typo in a
// hand-frozen YAML fleet. Returns a list of problem strings; legal iff empty.
export function validateFleet(level, fleet) {
  const L = LEVELS[level];
  const errors = [];
  if (!L) {
    errors.push(`Unknown level "${level}"`);
    return errors;
  }
  if (!fleet || !Array.isArray(fleet.ships)) {
    errors.push("Fleet has no ships array");
    return errors;
  }

  const wantLens = [...L.ships].sort((a, b) => b - a);
  const gotLens = fleet.ships.map((s) => s.length).sort((a, b) => b - a);
  if (JSON.stringify(wantLens) !== JSON.stringify(gotLens)) {
    errors.push(`Ship lengths [${gotLens.join(",")}] don't match level "${level}" [${wantLens.join(",")}]`);
  }

  const seen = new Map();
  fleet.ships.forEach((cells, i) => {
    if (!isStraightRun(cells)) errors.push(`Ship ${i} isn't a straight, contiguous line`);
    for (const [r, c] of cells) {
      if (r < 0 || c < 0 || r >= L.size || c >= L.size) {
        errors.push(`Ship ${i} cell (${r},${c}) is out of bounds for a ${L.size} by ${L.size} grid`);
      }
      const k = key(r, c);
      if (seen.has(k)) errors.push(`Ship ${i} overlaps ship ${seen.get(k)} at (${r},${c})`);
      seen.set(k, i);
    }
  });

  for (let i = 0; i < fleet.ships.length; i++) {
    for (let j = i + 1; j < fleet.ships.length; j++) {
      if (shipsTouch(fleet.ships[i], fleet.ships[j])) errors.push(`Ships ${i} and ${j} touch`);
    }
  }

  return errors;
}
