// Draws a sorting-network trace: six wires, the fixed comparator rungs
// from sortnet.js, and a small box on every wire that changes in a round,
// for the student to fill in by pencil. In "filled" mode (the answer key)
// every box already shows the simulator's own computed value.
import { ROUNDS, ROUND_COUNT, WIRE_COUNT } from "./sortnet.js";

const MARGIN_X = 20;
const LANE_GAP = 38;
const ROUND_H = 46;
const TOP_PAD = 28;
const BOTTOM_PAD = 34;
const NODE_R = 4;
const BOX_W = 30;
const BOX_H = 15;
// Vertical gap left between a comparator's node and the box below it
// where the student writes that wire's value.
const BOX_GAP = 4;

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const laneX = (i) => MARGIN_X + i * LANE_GAP;
const roundTopY = (r) => TOP_PAD + r * ROUND_H;
const roundBotY = (r) => TOP_PAD + (r + 1) * ROUND_H;
const compY = (r) => roundTopY(r) + ROUND_H / 2;
const boxY = (r) => compY(r) + NODE_R + BOX_GAP + BOX_H / 2;

function box(x, y, text, filled) {
  const parts = [
    `<rect x="${x - BOX_W / 2}" y="${y - BOX_H / 2}" width="${BOX_W}" height="${BOX_H}" rx="2.5" fill="#fff" stroke="currentColor" stroke-width="1.1"/>`,
  ];
  if (filled) {
    parts.push(
      `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="9" font-weight="700">${esc(text)}</text>`,
    );
  }
  return parts.join("");
}

// Builds the SVG for one trace. `problem` is {kind, values, roundResults,
// sorted} from sortnet-gen.js (or a frozen worksheet entry with the same
// shape).
export function networkSvg(problem, { filled = false } = {}) {
  const n = WIRE_COUNT;
  const width = MARGIN_X * 2 + (n - 1) * LANE_GAP;
  const height = TOP_PAD + ROUND_COUNT * ROUND_H + BOTTOM_PAD;
  const label = (v) => String(v);

  const lines = [];
  for (let i = 0; i < n; i++) {
    lines.push(
      `<line x1="${laneX(i)}" y1="${TOP_PAD}" x2="${laneX(i)}" y2="${roundBotY(ROUND_COUNT - 1)}" stroke="currentColor" stroke-width="1.3"/>`,
    );
  }

  const marks = [];
  for (let i = 0; i < n; i++) {
    marks.push(
      `<text x="${laneX(i)}" y="${TOP_PAD - 12}" text-anchor="middle" font-size="10" font-weight="700">${esc(label(problem.values[i]))}</text>`,
    );
  }

  ROUNDS.forEach((pairs, r) => {
    const y = compY(r);
    const touched = new Set();
    pairs.forEach(([a, b]) => {
      touched.add(a);
      touched.add(b);
      marks.push(`<line x1="${laneX(a)}" y1="${y}" x2="${laneX(b)}" y2="${y}" stroke="currentColor" stroke-width="1.3"/>`);
      marks.push(`<circle cx="${laneX(a)}" cy="${y}" r="${NODE_R}" fill="currentColor"/>`);
      marks.push(`<circle cx="${laneX(b)}" cy="${y}" r="${NODE_R}" fill="currentColor"/>`);
    });
    touched.forEach((i) => {
      const val = problem.roundResults[r][i];
      marks.push(box(laneX(i), boxY(r), label(val), filled));
    });
  });

  const finalY = roundBotY(ROUND_COUNT - 1) + BOTTOM_PAD / 2;
  for (let i = 0; i < n; i++) {
    marks.push(box(laneX(i), finalY, label(problem.sorted[i]), filled));
  }

  return `<svg class="sortnet-diagram" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Sorting network with ${n} wires and ${ROUND_COUNT} rounds">${lines.join("")}${marks.join("")}</svg>`;
}

const TWIST_CAPTION = { numbers: "Numbers", words: "Words, A to Z" };

export function renderProblems(container, problems, { filled = false } = {}) {
  container.innerHTML = "";
  problems.forEach((p, i) => {
    const fig = document.createElement("figure");
    fig.className = "sortnet-fig";
    const cap = document.createElement("figcaption");
    cap.textContent = `Round ${i + 1}: ${TWIST_CAPTION[p.kind] || p.kind}`;
    fig.innerHTML = networkSvg(p, { filled });
    fig.appendChild(cap);
    container.appendChild(fig);
  });
}
