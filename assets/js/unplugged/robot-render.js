// Draws robot question sets (fixed or generated) and their answer keys.
// Same look as the AP exam: black squares are blocked, the gray square is
// the goal, and the robot is a triangle pointing the way it faces.

import { parseGrid, run, LETTERS, ROMAN, normalizeAnswer } from "./robot.js";

const CELL = 34;

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

export function gridSvg(g, { path = null, caption = "" } = {}) {
  const W = g.w * CELL;
  const H = g.h * CELL;
  const parts = [];
  for (let r = 0; r < g.h; r++) {
    for (let c = 0; c < g.w; c++) {
      const blocked = g.blocked.has(r * g.w + c);
      const goal = g.goal && g.goal.r === r && g.goal.c === c;
      const fill = blocked ? "#111" : goal ? "#b5b5b5" : "#fff";
      parts.push(`<rect x="${c * CELL}" y="${r * CELL}" width="${CELL}" height="${CELL}" fill="${fill}" stroke="#555" stroke-width="1"/>`);
    }
  }
  for (const [label, { r, c }] of Object.entries(g.labels || {})) {
    parts.push(`<text x="${c * CELL + CELL / 2}" y="${r * CELL + CELL / 2 + 6}" text-anchor="middle" font-size="17" font-weight="700" font-family="system-ui, sans-serif">${label}</text>`);
  }
  if (path && path.length > 1) {
    const pts = path.map(([r, c]) => `${c * CELL + CELL / 2},${r * CELL + CELL / 2}`).join(" ");
    parts.push(`<polyline points="${pts}" fill="none" stroke="#1f6fb2" stroke-width="3" stroke-dasharray="6 4" stroke-linejoin="round"/>`);
    const [er, ec] = path[path.length - 1];
    parts.push(`<circle cx="${ec * CELL + CELL / 2}" cy="${er * CELL + CELL / 2}" r="6" fill="#1f6fb2"/>`);
  }
  if (g.start) {
    const cx = g.start.c * CELL + CELL / 2;
    const cy = g.start.r * CELL + CELL / 2;
    const s = CELL * 0.32;
    parts.push(`<polygon points="${cx},${cy - s} ${cx + s * 0.85},${cy + s * 0.8} ${cx - s * 0.85},${cy + s * 0.8}" fill="#111" transform="rotate(${g.start.d * 90} ${cx} ${cy})"/>`);
  }
  const svg = `<svg class="robot-grid" viewBox="-1 -1 ${W + 2} ${H + 2}" width="${W + 2}" height="${H + 2}" role="img" aria-label="Robot grid, ${g.w} by ${g.h}">${parts.join("")}</svg>`;
  return caption ? `<figure class="robot-grid-fig">${svg}<figcaption>${esc(caption)}</figcaption></figure>` : svg;
}

const PROMPTS = {
  "end-square": "The code segment below is run with the robot starting as shown. In which labeled square does the robot end?",
  "which-code": "Which of the following code segments can be used to move the robot to the gray square?",
  "which-grids": "The program below is run on each grid. For which of the grids does the program move the robot to the gray square?",
};

function questionHtml(q, n) {
  const answers = normalizeAnswer(q.answer);
  let prompt = esc(q.prompt || PROMPTS[q.kind]);
  if (answers.length === 2) prompt += " <strong>Select two answers.</strong>";

  let figure = "";
  if (q.kind === "which-grids") {
    figure = `<div class="robot-grids">${q.grids.map((t, i) => gridSvg(parseGrid(t), { caption: `Grid ${ROMAN[i]}` })).join("")}</div>`;
  } else {
    figure = gridSvg(parseGrid(q.grid));
  }
  const code = q.code ? `<pre class="ap-code">${esc(q.code.trimEnd())}</pre>` : "";

  let choices = "";
  if (q.choices) {
    const isCode = q.kind === "which-code";
    // Long lines (procedure calls) don't fit four across on paper.
    const wide = isCode && Math.max(...q.choices.flatMap((ch) => ch.split("\n").map((l) => l.length))) > 20;
    choices = `<ol class="robot-choices${isCode ? " code-choices" : ""}${wide ? " wide" : ""}">${q.choices
      .map((ch, i) => `<li><span class="choice-letter">${LETTERS[i]}</span>${isCode ? `<pre class="ap-code">${esc(ch.trimEnd())}</pre>` : `<span>${esc(ch)}</span>`}</li>`)
      .join("")}</ol>`;
  }
  const answerLine = q.kind === "end-square" ? `<p class="robot-answer-line">Answer: <span class="fill-line short"></span></p>` : "";

  return `<div class="robot-q">
    <p class="robot-q-prompt"><strong>${n}.</strong> ${prompt}</p>
    <div class="robot-q-body">${figure}${code}</div>
    ${choices}${answerLine}
  </div>`;
}

function keyHtml(q, n) {
  const answers = normalizeAnswer(q.answer);
  let figs = "";
  if (q.kind === "which-grids") {
    figs = q.grids
      .map((t, i) => {
        const g = parseGrid(t);
        return gridSvg(g, { path: run(g, q.code, { maxSteps: 60 }).path, caption: `Grid ${ROMAN[i]}` });
      })
      .join("");
  } else {
    const g = parseGrid(q.grid);
    const code = q.kind === "which-code" ? q.choices[LETTERS.indexOf(answers[0])] : q.code;
    figs = gridSvg(g, { path: run(g, code).path });
  }
  const notes = (q.notes || [])
    .map((note, i) => (note ? `<li><strong>${LETTERS[i]}:</strong> ${esc(note)}</li>` : ""))
    .join("");
  const explain = q.explain ? `<p>${esc(q.explain)}</p>` : "";
  return `<div class="robot-key">
    <p class="robot-key-answer"><strong>${n}. ${answers.join(" and ")}</strong></p>
    <div class="robot-grids">${figs}</div>
    ${explain}${notes ? `<ul class="robot-key-notes">${notes}</ul>` : ""}
  </div>`;
}

// Fills `qRoot` with the questions and `keyRoot` with the answer key.
export function renderSet(questions, qRoot, keyRoot) {
  qRoot.innerHTML = questions.map((q, i) => questionHtml(q, i + 1)).join("");
  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>
      <p class="robot-key-intro">The dashed line shows the robot's path for the correct code.</p>
      ${questions.map((q, i) => keyHtml(q, i + 1)).join("")}`;
  }
}
