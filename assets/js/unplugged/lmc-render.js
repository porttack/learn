// Renders LMC listings and trace tables as HTML strings. Shared by the
// fixed worksheets (lmc-page.js) and the generator (lmc-generator.js), so
// both draw from the same assembler/simulator output.
import { listingLine } from "./lmc.js";

export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const pad = (n, width) => String(n).padStart(width, "0");

// A short assembly listing as a plain monospace block, address first, the
// way it's easiest to keep your place while tracing: "00  INP".
export function codeBlock(listing) {
  const lines = listing.map((e) => `${pad(e.addr, 2)}  ${listingLine(e)}`);
  return `<pre class="lmc-code">${esc(lines.join("\n"))}</pre>`;
}

// The full listing form: address, label, mnemonic, operand, machine code.
export function listingTable(listing) {
  const rows = listing
    .map(
      (e) => `<tr>
        <td>${pad(e.addr, 2)}</td>
        <td>${e.label ? esc(e.label) : ""}</td>
        <td>${esc(e.mnemonic)}</td>
        <td>${e.operand ? esc(e.operand) : ""}</td>
        <td>${pad(e.code, 3)}</td>
      </tr>`,
    )
    .join("");
  return `<table class="checkoff lmc-listing">
    <colgroup><col style="width: 12%"><col style="width: 18%"><col style="width: 22%"><col style="width: 22%"><col style="width: 26%"></colgroup>
    <thead><tr><th>Address</th><th>Label</th><th>Mnemonic</th><th>Operand</th><th>Machine code</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// An empty listing form of a given size, for a student to assemble their
// own program into (no data to render, so no addresses filled in either --
// filling in the address column correctly, one per line, is part of the task).
export function blankListingTable(rows) {
  const body = Array.from({ length: rows }, () => `<tr><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  return `<table class="checkoff lmc-listing">
    <colgroup><col style="width: 12%"><col style="width: 18%"><col style="width: 22%"><col style="width: 22%"><col style="width: 26%"></colgroup>
    <thead><tr><th>Address</th><th>Label</th><th>Mnemonic</th><th>Operand</th><th>Machine code</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function inputTrayLine(inputs) {
  return `<p class="lmc-input-tray"><strong>Input tray, in order:</strong> ${inputs.map(esc).join(", ")}</p>`;
}

function findInstr(listing, pc) {
  const e = listing.find((l) => l.addr === pc);
  return e ? listingLine(e) : `(${pad(pc, 2)})`;
}

// A fully worked trace table, every cell filled in from an actual run --
// the demonstration a student studies before tracing one themselves.
export function filledTraceTable(trace, listing) {
  const rows = trace
    .map(
      (t) => `<tr>
        <td>${t.step}</td>
        <td>${pad(t.pc, 2)}</td>
        <td>${esc(findInstr(listing, t.pc))}</td>
        <td>${t.acc}</td>
        <td>${t.output == null ? "" : t.output}</td>
      </tr>`,
    )
    .join("");
  return traceTableShell(rows);
}

// A blank trace table with exactly the right number of rows for the
// program being traced -- so there's never a leftover blank row, or too
// few to fit every step.
export function blankTraceTable(rowCount) {
  const rows = Array.from({ length: rowCount }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`).join("");
  return traceTableShell(rows);
}

function traceTableShell(rows) {
  return `<table class="checkoff trace-table lmc-trace">
    <colgroup><col style="width: 10%"><col style="width: 10%"><col style="width: 38%"><col style="width: 22%"><col style="width: 20%"></colgroup>
    <thead><tr><th>Step</th><th>PC</th><th>Instruction</th><th>Accumulator</th><th>Output</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
