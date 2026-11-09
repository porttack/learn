// Draws creature-sorting question sets (fixed or generated) and their
// answer keys. Same look every time: a grid of 16 numbered cartoon
// creatures, drawn so every trait is a shape, not a color -- safe on a
// black-and-white printer.

import { CREATURES, normalizeSet, matchSet, formatExpr } from "./creatures.js";

let gridCount = 0;

function creatureSvg(c, patternId) {
  const body = c.round
    ? `<circle cx="30" cy="36" r="18" fill="${c.striped ? `url(#${patternId})` : "#fff"}" stroke="#000" stroke-width="2"/>`
    : `<rect x="12" y="18" width="36" height="36" rx="4" fill="${c.striped ? `url(#${patternId})` : "#fff"}" stroke="#000" stroke-width="2"/>`;

  const hat = c.hasHat
    ? `<rect x="16" y="17" width="28" height="3" fill="#000"/>
       <polygon points="30,4 19,20 41,20" fill="#fff" stroke="#000" stroke-width="2"/>`
    : "";

  const eyes = c.twoEyes
    ? `<circle cx="23" cy="32" r="3" fill="#000"/><circle cx="37" cy="32" r="3" fill="#000"/>`
    : `<circle cx="30" cy="32" r="5" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="30" cy="32" r="2" fill="#000"/>`;

  return `<svg class="creature-svg" viewBox="0 0 60 60" width="60" height="60" role="img" aria-label="Creature ${c.n}">${body}${hat}${eyes}</svg>`;
}

// A grid of every creature (or a chosen subset), each numbered. When
// `markedSet` is given, those creatures get a heavy border instead of a
// color, so "these are the marked ones" survives a grayscale printout.
export function creatureGridHtml(creatures = CREATURES, { markedSet = new Set() } = {}) {
  const id = `cg${gridCount++}`;
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <pattern id="${id}-stripes" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#fff"/>
        <line x1="0" y1="2.5" x2="10" y2="2.5" stroke="#000" stroke-width="2.5"/>
        <line x1="0" y1="7.5" x2="10" y2="7.5" stroke="#000" stroke-width="2.5"/>
      </pattern>
    </defs>
  </svg>`;
  const figs = creatures
    .map(
      (c) =>
        `<figure class="creature${markedSet.has(c.n) ? " creature-marked" : ""}">${creatureSvg(c, `${id}-stripes`)}<figcaption>${c.n}</figcaption></figure>`,
    )
    .join("");
  return `${defs}<div class="creature-grid">${figs}</div>`;
}

function answerRowHtml() {
  const items = Array.from({ length: 16 }, (_, i) => `<li>${i + 1}</li>`).join("");
  return `<ol class="creature-answer-row">${items}</ol>`;
}

// Just the marked numbers, boxed for visibility -- not the whole grid again.
// Refers back to the single illustrated grid printed once at the top of the
// page, the same way every question refers back to it.
function markedChipsHtml(marked) {
  const items = normalizeSet(marked)
    .map((n) => `<li>${n}</li>`)
    .join("");
  return `<ol class="creature-answer-row creature-marked-list">${items}</ol>`;
}

function evaluateQuestionHtml(q, n) {
  return `<div class="creature-q">
    <p class="creature-q-prompt"><strong>${n}.</strong> Circle every creature this is true for: <code>${q.expr}</code></p>
    ${answerRowHtml()}
  </div>`;
}

function evaluateKeyHtml(q, n) {
  const answers = normalizeSet(q.answer);
  return `<div class="creature-key">
    <p><strong>${n}.</strong> <code>${q.expr}</code>: creatures ${answers.join(", ")}</p>
  </div>`;
}

function reverseQuestionHtml(q, n) {
  return `<div class="creature-q creature-reverse">
    <div class="creature-reverse-head"><strong>${n}.</strong> ${markedChipsHtml(q.marked)}<span class="creature-answer-line">${q.example ? `Example: <span class="creature-given">${q.key}</span>` : ""}</span></div>`;
}

function reverseKeyHtml(q, n) {
  return `<div class="creature-key">
    <p><strong>${n}.</strong> One expression that works: <code>${q.key}</code>.
    Other expressions can work too. Check yours by testing it against every
    creature in the marked set, and every creature not in it.</p>
  </div>`;
}


// Worked examples shown before Part B: marked set -> expression, computed by
// the evaluator so they can never be wrong. The "not an expression" list is
// the shapes students most often hand in by mistake.
const EXAMPLE_EXPRS = [
  "striped",
  "NOT has_hat",
  "round AND striped",
  "has_hat OR two_eyes",
  "NOT (round OR striped)",
  "round AND NOT two_eyes AND has_hat",
];

function expressionExamplesHtml(style) {
  const rows = EXAMPLE_EXPRS.map((e) => {
    const marked = matchSet(e);
    return `<tr><td>${markedChipsHtml(marked)}</td><td><code>${formatExpr(e, style)}</code></td></tr>`;
  }).join("");
  const k = style === "python" ? { and: "and", or: "or", not: "not" } : { and: "AND", or: "OR", not: "NOT" };
  return `<div class="creature-examples">
    <p><strong>What an expression looks like.</strong> Here are some marked sets and an expression that picks out exactly that set.
    Check one against the grid to see why it works.</p>
    <table class="creature-examples-table">
      <thead><tr><th>Marked creatures</th><th>Expression</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <ul class="creature-examples-rules">
      <li>An expression is made of trait words (<code>round</code>, <code>has_hat</code>, <code>two_eyes</code>, <code>striped</code>) joined by <code>${k.and}</code>, <code>${k.or}</code>, and <code>${k.not}</code>.</li>
      <li>Two trait words always need a joiner between them: <code>round ${k.and} striped</code>, never <code>round striped</code>.</li>
      <li><code>${k.not}</code> goes right before the trait (or the parentheses) it flips: <code>${k.not} has_hat</code>.</li>
      <li>There is no word for "square" or "one eye". Say it with <code>${k.not}</code>: <code>${k.not} round</code> means square.</li>
      <li>Use parentheses when <code>${k.not}</code> should flip a whole group: <code>${k.not} (round ${k.or} striped)</code>.</li>
    </ul>
  </div>`;
}

// Fills `qRoot` with the reference grid, Part A, and Part B, and `keyRoot`
// (if given) with the matching answer key.
export function renderSet(data, qRoot, keyRoot, { split = false } = {}) {
  const { partA, partB } = data;
  let n = 0;
  const aQ = partA.map((q) => evaluateQuestionHtml(q, ++n)).join("");
  const aK = partA.map((q, i) => evaluateKeyHtml(q, i + 1)).join("");
  const bQ = partB.map((q) => reverseQuestionHtml(q, ++n)).join("");
  const bK = partB.map((q, i) => reverseKeyHtml(q, partA.length + i + 1)).join("");

  // split: the grid stays on the reference sheet (page 1 in print) and the
  // questions start a fresh printed page with their own Name line.
  const nameLine = `<div class="name-line" aria-hidden="true"><span>Name <i></i></span><span>Date <i></i></span><span>Period <i></i></span></div>`;
  const questions = `<h2>Part A: which creatures?</h2>
    <p>For each expression, circle every creature number it's true for on the
    row below it. Use the grid to check a creature's traits.</p>
    ${aQ}
    <h2 class="creature-part-b">Part B: write the expression</h2>
    <p>Now go the other way. The marked numbers are a set of creatures. Write an
    expression, using <code>round</code>, <code>has_hat</code>,
    <code>two_eyes</code>, and <code>striped</code>, that picks out exactly
    that set and no others.</p>
    ${expressionExamplesHtml(data.style || "AP")}
    ${bQ}`;
  qRoot.innerHTML = split
    ? `${creatureGridHtml(CREATURES)}<div class="creature-worksheet">${nameLine}${questions}</div>`
    : `${creatureGridHtml(CREATURES)}${questions}`;

  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>
      <h3>Part A</h3>
      ${aK}
      <h3>Part B</h3>
      ${bK}`;
  }
}
