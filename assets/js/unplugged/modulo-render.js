// Draws modulo clock faces and question sets (generated puzzles only; the
// two fixed worksheets are plain Liquid/markdown and don't load this file).
// Same split as the robot family: this module only builds HTML strings, no
// `document` calls, so a build-time script can also call clockSvg() to
// freeze static diagrams into markdown.

import { stepForward, stepBackward, pymod, checkDigit, isValidCode, WEEKDAYS } from "./modulo.js";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// A clock face with `n` positions, numbered 0..n-1 clockwise from the top.
// `labelFor(i)` can rename a position (hour, weekday, "Even"/"Odd", ...).
// A big `n` (24, 360) would be unreadable with every position labeled, so
// only every `tickEvery`-th position gets a tick + label; `highlight` still
// marks the exact start/landing spots even when they fall between ticks.
export function clockSvg(n, { labelFor = (i) => String(i), highlight = null, size = 220, caption = "" } = {}) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const ring = r - size * 0.16;
  const tickEvery = Math.max(1, Math.round(n / 12));
  const angleOf = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const round = (v) => Math.round(v * 100) / 100;
  const pt = (i, radius) => {
    const a = angleOf(i);
    return [round(cx + radius * Math.cos(a)), round(cy + radius * Math.sin(a))];
  };

  const parts = [`<circle cx="${cx}" cy="${cy}" r="${ring}" fill="#fff" stroke="#555" stroke-width="1.5"/>`];
  for (let i = 0; i < n; i += tickEvery) {
    const [tx, ty] = pt(i, ring);
    const [lx, ly] = pt(i, ring * 0.78);
    parts.push(`<circle cx="${tx}" cy="${ty}" r="2.5" fill="#555"/>`);
    parts.push(
      `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.075}" font-family="system-ui, sans-serif">${esc(labelFor(i))}</text>`,
    );
  }
  if (highlight) {
    const { from, to } = highlight;
    if (from != null) {
      const [fx, fy] = pt(from, ring);
      parts.push(`<circle cx="${fx}" cy="${fy}" r="9" fill="none" stroke="#1f6fb2" stroke-width="2.5"/>`);
    }
    if (to != null) {
      const [tx2, ty2] = pt(to, ring);
      parts.push(`<circle cx="${tx2}" cy="${ty2}" r="7" fill="#1f6fb2"/>`);
    }
  }
  const svg = `<svg class="modulo-clock" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="A clock with ${n} positions${caption ? `, ${caption}` : ""}">${parts.join("")}</svg>`;
  return caption ? `<figure class="modulo-clock-fig">${svg}<figcaption>${esc(caption)}</figcaption></figure>` : svg;
}

// Position labels for the clock sizes the generator can pick.
const LABELERS = {
  12: (i) => (i === 0 ? "12" : String(i)),
  7: (i) => WEEKDAYS[i],
  2: (i) => (i === 0 ? "Even" : "Odd"),
};
const labelerFor = (n) => LABELERS[n] || ((i) => String(i));

// ---- Generated question rendering -------------------------------------------

function clockQuestionHtml(q, n) {
  const dirWord = q.direction === "back" ? "backward" : "forward";
  const fig = clockSvg(q.n, { labelFor: labelerFor(q.n), highlight: { from: q.start } });
  return `<div class="modulo-q modulo-q-clock">
    <p class="modulo-q-prompt"><strong>${n}.</strong> A clock has ${q.n} positions, numbered 0 to ${q.n - 1}. Start at ${q.start}. Count ${dirWord} ${q.steps} steps. Where do you land?</p>
    <div class="modulo-q-body">${fig}<span class="fill-line short"></span></div>
  </div>`;
}
function clockKeyHtml(q, n) {
  return `<p class="modulo-key-answer"><strong>${n}.</strong> ${q.answer}</p>`;
}

function predictQuestionHtml(q, n) {
  return `<div class="modulo-q modulo-q-predict">
    <p class="modulo-q-prompt"><strong>${n}.</strong> Predict the value of <code>${q.a} % ${q.n}</code>. <span class="fill-line short"></span></p>
  </div>`;
}
function predictKeyHtml(q, n) {
  return `<p class="modulo-key-answer"><strong>${n}.</strong> ${q.a} % ${q.n} = ${q.answer}</p>`;
}

function digitsToCode(digits) {
  return digits.join("");
}
function checkDigitQuestionHtml(q, n) {
  if (q.task === "validate") {
    return `<div class="modulo-q modulo-q-checkdigit">
      <p class="modulo-q-prompt"><strong>${n}.</strong> Code <span class="modulo-code">${digitsToCode(q.digits)}</span>. Is the last digit a correct check digit? <span class="fill-line short"></span></p>
    </div>`;
  }
  const shown = digitsToCode(q.digits.slice(0, -1)) + "?";
  return `<div class="modulo-q modulo-q-checkdigit">
    <p class="modulo-q-prompt"><strong>${n}.</strong> Find the missing check digit: <span class="modulo-code">${shown}</span> <span class="fill-line short"></span></p>
  </div>`;
}
function checkDigitKeyHtml(q, n) {
  if (q.task === "validate") {
    return `<p class="modulo-key-answer"><strong>${n}.</strong> ${q.valid ? "Yes, valid." : "No, not valid."} (correct check digit would be ${q.correctCheck})</p>`;
  }
  return `<p class="modulo-key-answer"><strong>${n}.</strong> ${q.digits[q.digits.length - 1]}</p>`;
}

const RENDERERS = {
  clock: { q: clockQuestionHtml, key: clockKeyHtml },
  predict: { q: predictQuestionHtml, key: predictKeyHtml },
  checkdigit: { q: checkDigitQuestionHtml, key: checkDigitKeyHtml },
};

// Fills `qRoot` with the questions and `keyRoot` with the (hidden until
// ?key=1) answer key. Every question object carries its own `kind`.
export function renderSet(questions, qRoot, keyRoot) {
  qRoot.innerHTML = questions.map((q, i) => RENDERERS[q.kind].q(q, i + 1)).join("");
  if (keyRoot) {
    keyRoot.innerHTML = `<h2>Check your answers</h2>${questions.map((q, i) => RENDERERS[q.kind].key(q, i + 1)).join("")}`;
  }
}

export { pymod, stepForward, stepBackward, checkDigit, isValidCode };
