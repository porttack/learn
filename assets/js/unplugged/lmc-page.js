// Fixed LMC worksheets: reads the worked example and practice programs out
// of <script type="application/json"> tags (from _data/unplugged/lmc_*.yml)
// and draws each one's listing and trace table into the page. Also draws
// the (hidden-by-default, see assets/main.scss's .answer-key rule) answer
// key: the same practice programs, but with a completely filled trace table
// and a final-output line, so a teacher can grade a printed sheet at a
// glance.
import { assemble, run } from "./lmc.js";
import { esc, codeBlock, inputTrayLine, filledTraceTable, blankTraceTable } from "./lmc-render.js";

function renderWorked(set, root) {
  const { code, listing } = assemble(set.source);
  const traced = run(code, set.inputs);
  root.innerHTML = `
    <h3>Worked example: ${esc(set.title)}</h3>
    ${codeBlock(listing)}
    ${inputTrayLine(set.inputs)}
    ${filledTraceTable(traced.trace, listing)}
  `;
}

function renderPractice(sets, root) {
  root.innerHTML = sets
    .map((set, i) => {
      const { code, listing } = assemble(set.source);
      const traced = run(code, set.inputs);
      return `<div class="lmc-practice">
        <h3>${i + 1}. ${esc(set.title)}</h3>
        ${codeBlock(listing)}
        ${inputTrayLine(set.inputs)}
        ${blankTraceTable(traced.trace.length)}
      </div>`;
    })
    .join("");
}

// Answer key for the practice programs: same programs, fully traced, plus
// the final output tray -- what a teacher checks a student's filled-in
// trace table against.
function renderPracticeKey(sets, root) {
  root.innerHTML = `<h2>Answer key</h2>${sets
    .map((set, i) => {
      const { code, listing } = assemble(set.source);
      const traced = run(code, set.inputs);
      const output = traced.outputs.length ? traced.outputs.join(", ") : "(no output)";
      return `<div class="lmc-practice">
        <h3>${i + 1}. ${esc(set.title)}</h3>
        ${filledTraceTable(traced.trace, listing)}
        <p class="lmc-output-line"><strong>Output tray, in order:</strong> ${esc(output)}</p>
      </div>`;
    })
    .join("")}`;
}

// A "write your own" reference solution: a working listing (never shown as
// THE answer, since other programs can be correct too) plus the expected
// output for the sheet's own test input(s).
function renderTaskKey(tasks, root) {
  root.innerHTML = `<h2>Answer key</h2>
    <p class="lmc-key-note">One working program per task. Yours can look completely different and still be correct, as long as it produces the same output for the test input.</p>
    ${tasks
      .map((t, i) => {
        const { code, listing } = assemble(t.source);
        const traced = run(code, t.inputs);
        return `<div class="lmc-practice">
          <h3>${i + 1}. ${esc(t.title)}</h3>
          ${codeBlock(listing)}
          ${inputTrayLine(t.inputs)}
          <p class="lmc-output-line"><strong>Output tray, in order:</strong> ${esc(traced.outputs.join(", "))}</p>
        </div>`;
      })
      .join("")}`;
}

for (const script of document.querySelectorAll("script[data-lmc-worked]")) {
  const set = JSON.parse(script.textContent);
  renderWorked(set, document.querySelector(script.dataset.root));
}
for (const script of document.querySelectorAll("script[data-lmc-practice]")) {
  const sets = JSON.parse(script.textContent);
  renderPractice(sets, document.querySelector(script.dataset.root));
}
for (const script of document.querySelectorAll("script[data-lmc-practice-key]")) {
  const sets = JSON.parse(script.textContent);
  renderPracticeKey(sets, document.querySelector(script.dataset.root));
}
for (const script of document.querySelectorAll("script[data-lmc-task-key]")) {
  const tasks = JSON.parse(script.textContent);
  renderTaskKey(tasks, document.querySelector(script.dataset.root));
}
