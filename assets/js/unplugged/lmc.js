// Little Man Computer: assembler and simulator.
//
// The Little Man Computer (LMC) is a paper model of a CPU, invented by
// Stuart Madnick in 1965. A "little man" sits in a room of 100 numbered
// mailboxes (00-99), each holding one 3-digit number (000-999). He has one
// number he's holding, the accumulator, and he follows a numbered list of
// instructions one at a time, using a calculator to add and subtract.
//
// Negative numbers: the accumulator can go below zero (SUB can make it
// negative), and that's what BRP checks. But a mailbox and the output tray
// only ever hold 000-999, the normal 3-digit convention every popular LMC
// simulator uses. So the moment a value leaves the accumulator, through STA
// or OUT, it's forced back into that range: a small negative number wraps
// around like a car's odometer rolling backward (-1 becomes 999). None of
// the programs written for these worksheets ever store or print a negative
// value, so that wrap never actually fires here, but the simulator applies
// it anyway so it behaves like the real thing.
//
// DOM-free on purpose: tools/check_lmc.mjs imports this in Node to verify
// every program on the fixed sheets and in the generator's bank.

// mnemonic -> opcode digit, for instructions whose machine code is
// opcode*100 + a 2-digit mailbox address.
export const ADDRESS_OPS = { ADD: 1, SUB: 2, STA: 3, LDA: 5, BRA: 6, BRZ: 7, BRP: 8 };
// Fixed 3-digit codes for instructions that take no address.
export const FIXED_OPS = { INP: 901, OUT: 902, HLT: 0 };

const OP_BY_DIGIT = Object.fromEntries(Object.entries(ADDRESS_OPS).map(([m, d]) => [d, m]));
const OP_BY_CODE = Object.fromEntries(Object.entries(FIXED_OPS).map(([m, c]) => [c, m]));

export const MAILBOXES = 100;

function pad(n, width) {
  return String(n).padStart(width, "0");
}

// Wraps a value into the 000-999 range a mailbox or the output tray can
// hold, the way a small negative number wraps around like an odometer.
export function wrap(n) {
  return ((n % 1000) + 1000) % 1000;
}

// ---- Assembler ---------------------------------------------------------------
//
// One instruction per line: an optional LABEL, then a MNEMONIC, then an
// optional OPERAND (a label name or a bare mailbox number). Addresses are
// assigned in order, starting at 0, one per line -- there's no ORG
// directive, because every program here is short enough not to need one.

export function assemble(source) {
  const lines = String(source)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length > MAILBOXES) throw new Error(`Program has ${lines.length} lines, but there are only ${MAILBOXES} mailboxes`);

  const isMnemonic = (t) => t in ADDRESS_OPS || t in FIXED_OPS || t === "DAT";

  // Pass 1: split each line into { label, mnemonic, operand }, and record
  // every label's address.
  const parsed = lines.map((line, addr) => {
    const tokens = line.split(/\s+/);
    if (tokens.length > 3) throw new Error(`Line ${addr + 1}: too many parts ("${line}")`);
    let label = null;
    let mnemonic;
    let operand = null;
    if (tokens.length === 3) [label, mnemonic, operand] = tokens;
    else if (tokens.length === 2) {
      if (isMnemonic(tokens[0])) [mnemonic, operand] = tokens;
      else [label, mnemonic] = tokens;
    } else [mnemonic] = tokens;
    if (!isMnemonic(mnemonic)) throw new Error(`Line ${addr + 1}: unknown instruction "${mnemonic}"`);
    return { addr, label, mnemonic, operand };
  });

  const labels = {};
  for (const p of parsed) {
    if (!p.label) continue;
    if (p.label in labels) throw new Error(`Label ${p.label} used twice`);
    labels[p.label] = p.addr;
  }

  // Pass 2: resolve operands into machine code.
  const code = new Array(MAILBOXES).fill(0);
  const listing = parsed.map((p) => {
    const resolveAddress = () => {
      if (p.operand == null) throw new Error(`Line ${p.addr + 1}: ${p.mnemonic} needs an operand`);
      if (p.operand in labels) return labels[p.operand];
      if (/^\d+$/.test(p.operand) && Number(p.operand) < MAILBOXES) return Number(p.operand);
      throw new Error(`Line ${p.addr + 1}: unknown label "${p.operand}"`);
    };
    let value;
    if (p.mnemonic === "DAT") {
      if (p.operand != null && !/^\d+$/.test(p.operand)) throw new Error(`Line ${p.addr + 1}: DAT needs a plain number`);
      value = p.operand == null ? 0 : Number(p.operand);
      if (value > 999) throw new Error(`Line ${p.addr + 1}: DAT value ${value} doesn't fit in a mailbox (max 999)`);
    } else if (p.mnemonic in FIXED_OPS) {
      if (p.operand != null) throw new Error(`Line ${p.addr + 1}: ${p.mnemonic} takes no operand`);
      value = FIXED_OPS[p.mnemonic];
    } else {
      value = ADDRESS_OPS[p.mnemonic] * 100 + resolveAddress();
    }
    code[p.addr] = value;
    return { addr: p.addr, label: p.label, mnemonic: p.mnemonic, operand: p.operand, code: value };
  });

  return { code, listing, labels };
}

// Assembly text the way a student would write it: "LABEL  MNEMONIC OPERAND".
export function listingLine(entry) {
  const parts = [entry.label || "", entry.mnemonic, entry.operand || ""].filter((s) => s !== "");
  return parts.join(" ");
}

// ---- Simulator ---------------------------------------------------------------
//
// Returns { trace, outputs, halted, steps }.
//   trace    one row per instruction executed: { step, pc, acc, output }
//            (acc and output are the values *after* that instruction runs;
//            output is null unless this step was an OUT)
//   outputs  every value sent to the output tray, in order (each wrapped
//            into 000-999)
//   halted   true if the program reached HLT; false if it hit the step
//            limit (an infinite loop, for our purposes) or ran off the end
//            of memory without halting
export function run(code, inputs, { maxSteps = 1000 } = {}) {
  let acc = 0;
  let pc = 0;
  let ip = 0;
  const trace = [];
  const outputs = [];
  let steps = 0;
  let halted = false;

  while (steps < maxSteps) {
    if (pc < 0 || pc >= MAILBOXES) throw new Error(`Program counter ran off the end of memory at address ${pc}`);
    const instr = code[pc];
    const startPc = pc;
    let mnemonic;
    let addr = null;
    if (instr in OP_BY_CODE) mnemonic = OP_BY_CODE[instr];
    else {
      const digit = Math.floor(instr / 100);
      if (!(digit in OP_BY_DIGIT)) throw new Error(`Mailbox ${pad(pc, 2)} holds ${pad(instr, 3)}, which isn't a valid instruction`);
      mnemonic = OP_BY_DIGIT[digit];
      addr = instr % 100;
    }

    let branched = false;
    let outputVal = null;
    switch (mnemonic) {
      case "INP":
        if (ip >= inputs.length) throw new Error("Ran out of input: the program asked for more numbers than were given");
        acc = inputs[ip++];
        break;
      case "OUT":
        outputVal = wrap(acc);
        outputs.push(outputVal);
        break;
      case "ADD":
        acc = acc + code[addr];
        break;
      case "SUB":
        acc = acc - code[addr];
        break;
      case "STA":
        code[addr] = wrap(acc);
        break;
      case "LDA":
        acc = code[addr];
        break;
      case "BRA":
        pc = addr;
        branched = true;
        break;
      case "BRZ":
        if (acc === 0) {
          pc = addr;
          branched = true;
        }
        break;
      case "BRP":
        if (acc >= 0) {
          pc = addr;
          branched = true;
        }
        break;
      case "HLT":
        halted = true;
        break;
      default:
        throw new Error(`Unhandled instruction ${mnemonic}`);
    }

    steps++;
    trace.push({ step: steps, pc: startPc, acc, output: outputVal });
    if (halted) break;
    if (!branched) pc++;
  }

  return { trace, outputs, halted, steps };
}

// Convenience for callers that only care about the final output tray, e.g.
// the generator bank's per-template correctness checks.
export function assembleAndRun(source, inputs, opts) {
  const { code, listing } = assemble(source);
  const result = run(code, inputs, opts);
  return { ...result, listing };
}
