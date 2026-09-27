// Bank of short LMC programs for the "make a new set" generator, plus a
// `check` for each one so tools/check_lmc.mjs can confirm the assembly is
// actually correct, not just that it halts. Each template is checked with
// an independent JS formula, not by trusting the simulator's own output.
//
// DOM-free: imported by the generator page and by the Node checker.
import { assemble, assembleAndRun } from "./lmc.js";

const straight = [
  {
    id: "double",
    title: "Double it",
    source: `INP
STA N
LDA N
ADD N
OUT
HLT
N DAT 0`,
    makeInputs: (rng) => [rng.int(2, 40)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === inputs[0] * 2,
  },
  {
    id: "triple",
    title: "Triple it",
    source: `INP
STA N
LDA N
ADD N
ADD N
OUT
HLT
N DAT 0`,
    makeInputs: (rng) => [rng.int(2, 30)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === inputs[0] * 3,
  },
  {
    id: "add-three",
    title: "Add three numbers",
    source: `INP
STA A
INP
ADD A
STA A
INP
ADD A
OUT
HLT
A DAT 0`,
    makeInputs: (rng) => [rng.int(1, 30), rng.int(1, 30), rng.int(1, 30)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === inputs[0] + inputs[1] + inputs[2],
  },
  {
    id: "sum-doubled",
    title: "Add two numbers, then double the total",
    source: `INP
STA A
INP
ADD A
STA S
ADD S
OUT
HLT
A DAT 0
S DAT 0`,
    makeInputs: (rng) => [rng.int(1, 20), rng.int(1, 20)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === (inputs[0] + inputs[1]) * 2,
  },
  {
    id: "subtract",
    title: "Subtract two numbers",
    source: `INP
STA A
INP
STA B
LDA A
SUB B
OUT
HLT
A DAT 0
B DAT 0`,
    // Second input never bigger than the first, so the result stays
    // positive -- see lmc-2-branches for what happens when it doesn't.
    makeInputs: (rng) => {
      const a = rng.int(10, 50);
      return [a, rng.int(0, a)];
    },
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === inputs[0] - inputs[1],
  },
];

const branch = [
  {
    id: "countdown",
    title: "Count down from your input",
    source: `INP
LOOP OUT
SUB ONE
BRZ DONE
BRA LOOP
DONE HLT
ONE DAT 1`,
    makeInputs: (rng) => [rng.int(3, 6)],
    check: (inputs, outputs) => {
      const n = inputs[0];
      const want = Array.from({ length: n }, (_, i) => n - i);
      return outputs.length === want.length && outputs.every((v, i) => v === want[i]);
    },
  },
  {
    id: "count-up",
    title: "Count up to your input",
    source: `INP
STA N
LDA ONE
STA I
LOOP LDA N
SUB I
BRP CONT
BRA DONE
CONT LDA I
OUT
LDA I
ADD ONE
STA I
BRA LOOP
DONE HLT
N DAT 0
I DAT 0
ONE DAT 1`,
    makeInputs: (rng) => [rng.int(3, 6)],
    check: (inputs, outputs) => {
      const n = inputs[0];
      const want = Array.from({ length: n }, (_, i) => i + 1);
      return outputs.length === want.length && outputs.every((v, i) => v === want[i]);
    },
  },
  {
    id: "larger",
    title: "Output the larger input",
    source: `INP
STA A
INP
SUB A
BRP BIGB
LDA A
OUT
HLT
BIGB ADD A
OUT
HLT
A DAT 0`,
    makeInputs: (rng) => [rng.int(1, 50), rng.int(1, 50)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === Math.max(inputs[0], inputs[1]),
  },
  {
    id: "smaller",
    title: "Output the smaller input",
    source: `INP
STA A
INP
SUB A
BRP SMALLA
ADD A
OUT
HLT
SMALLA LDA A
OUT
HLT
A DAT 0`,
    makeInputs: (rng) => [rng.int(1, 50), rng.int(1, 50)],
    check: (inputs, outputs) => outputs.length === 1 && outputs[0] === Math.min(inputs[0], inputs[1]),
  },
  {
    id: "sum-to-n",
    title: "Add up every number from 1 to your input",
    source: `INP
STA N
LDA ZERO
STA SUM
LDA N
STA I
LOOP LDA I
BRZ DONE
LDA SUM
ADD I
STA SUM
LDA I
SUB ONE
STA I
BRA LOOP
DONE LDA SUM
OUT
HLT
N DAT 0
SUM DAT 0
I DAT 0
ZERO DAT 0
ONE DAT 1`,
    makeInputs: (rng) => [rng.int(3, 8)],
    check: (inputs, outputs) => {
      const n = inputs[0];
      return outputs.length === 1 && outputs[0] === (n * (n + 1)) / 2;
    },
  },
];

export const LEVELS = {
  straight: { label: "Straight-line (no branches)", templates: straight },
  branch: { label: "Branching (loops)", templates: branch },
};

// One question's render data: the assembled listing, the inputs it was
// dealt, and how many blanks the output tray needs. `trace` and `outputs`
// are never drawn into the printed questions (students trace it out for
// themselves), only into the answer key (lmc-generator.js), so a teacher can
// grade a printed set without re-running the simulator by hand.
function buildQuestion(rng, tmpl, i) {
  const r = rng.fork(i + 1);
  const inputs = tmpl.makeInputs(r);
  const { code, listing } = assemble(tmpl.source);
  const { trace, outputs, halted, steps } = assembleAndRun(tmpl.source, inputs);
  if (!halted) throw new Error(`${tmpl.id} didn't halt for inputs ${inputs}`);
  return { id: `${tmpl.id}-${i}`, title: tmpl.title, listing, inputs, blanks: outputs.length, steps, code, trace, outputs };
}

export function generateSet(rng, { level = "branch", count = 6 } = {}) {
  const templates = LEVELS[level].templates;
  const order = rng.shuffle(templates);
  const qs = [];
  for (let i = 0; i < count; i++) qs.push(buildQuestion(rng, order[i % order.length], i));
  return qs;
}
