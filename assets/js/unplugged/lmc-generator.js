import { mountGenerator } from "./generator-shell.js";
import { generateSet, LEVELS } from "./lmc-gen.js";
import { esc, codeBlock, inputTrayLine } from "./lmc-render.js";

const root = document.querySelector(".puzzle-generator");

function questionHtml(q, n) {
  const blanks = Array.from({ length: q.blanks }, () => `<span class="fill-line short"></span>`).join(" ");
  return `<div class="lmc-q">
    <h3>${n}. ${esc(q.title)}</h3>
    ${codeBlock(q.listing)}
    ${inputTrayLine(q.inputs)}
    <p class="lmc-output-line"><strong>Output tray, in order:</strong> ${q.blanks ? blanks : "(this program never outputs anything)"}</p>
  </div>`;
}

// Answer key: the sheet asks only for the output tray, so the key is one
// line per program (inputs and outputs straight from the simulator run in
// lmc-gen.js). Full trace tables live on the fixed sheets' keys.
function keyHtml(q, n) {
  const output = q.outputs.length ? q.outputs.join(", ") : "(no output)";
  const inputs = q.inputs && q.inputs.length ? q.inputs.join(", ") : "none";
  return `<li><strong>${esc(q.title)}</strong> (inputs: ${esc(inputs)}): <strong>${esc(output)}</strong></li>`;
}

mountGenerator({
  root,
  options: [
    { name: "level", label: "Level", default: "branch", choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]) },
    { name: "count", label: "Programs", default: 6, choices: [[4, "4"], [6, "6"], [8, "8"]] },
  ],
  render(rng, opts) {
    const qs = generateSet(rng, { level: opts.level, count: Number(opts.count) });
    root.querySelector(".puzzle-questions").innerHTML = qs.map((q, i) => questionHtml(q, i + 1)).join("");
    root.querySelector(".puzzle-key").innerHTML = `<h2>Answer key</h2><ol class="lmc-key-list">${qs.map((q, i) => keyHtml(q, i + 1)).join("")}</ol>`;
  },
});
