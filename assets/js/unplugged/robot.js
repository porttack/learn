// AP CSP robot: grid parser, pseudocode parser, simulator, and formatter.
//
// Follows the College Board exam reference sheet:
//   MOVE_FORWARD ()      one square in the direction the robot faces
//   ROTATE_LEFT ()       90 degrees counterclockwise, in place
//   ROTATE_RIGHT ()      90 degrees clockwise, in place
//   CAN_MOVE (direction) true if the square in that direction, relative to
//                        the robot (left, right, forward, backward), is open
// "If the robot attempts to move to a square that is not open or is beyond
// the edge of the grid, the robot will stay in its current location and the
// program will terminate." That's status "crashed" below.
//
// DOM-free on purpose: tools/check_robot_sets.mjs imports this in Node to
// verify every hand-written answer key.

export const DIR_NAMES = ["up", "right", "down", "left"];
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
const ARROWS = { "^": 0, ">": 1, v: 2, "<": 3 };
const ARROW_CHARS = ["^", ">", "v", "<"];
const REL = { forward: 0, right: 1, backward: 2, left: 3 };

// ---- Grids -----------------------------------------------------------------
//
// Text form, one row per line, cells separated by spaces:
//   .  open      #  blocked (black)     G  goal (gray)
//   ^ > v <      robot start, pointing that way
//   A-F          open square with a letter label (for "where does it end?")

export function parseGrid(text) {
  const rows = String(text).trim().split("\n").map((r) => r.trim().split(/\s+/));
  const h = rows.length;
  const w = rows[0].length;
  const g = { w, h, blocked: new Set(), goal: null, start: null, labels: {} };
  rows.forEach((row, r) => {
    if (row.length !== w) throw new Error(`Grid row ${r + 1} has ${row.length} cells, expected ${w}`);
    row.forEach((t, c) => {
      if (t === "#") g.blocked.add(r * w + c);
      else if (t === "G") g.goal = { r, c };
      else if (t in ARROWS) g.start = { r, c, d: ARROWS[t] };
      else if (/^[A-F]$/.test(t)) g.labels[t] = { r, c };
      else if (t !== ".") throw new Error(`Unknown grid cell "${t}"`);
    });
  });
  return g;
}

export function gridToText(g) {
  const lines = [];
  for (let r = 0; r < g.h; r++) {
    const cells = [];
    for (let c = 0; c < g.w; c++) {
      let t = ".";
      if (g.blocked.has(r * g.w + c)) t = "#";
      if (g.goal && g.goal.r === r && g.goal.c === c) t = "G";
      for (const [k, v] of Object.entries(g.labels || {})) if (v.r === r && v.c === c) t = k;
      if (g.start && g.start.r === r && g.start.c === c) t = ARROW_CHARS[g.start.d];
      cells.push(t);
    }
    lines.push(cells.join(" "));
  }
  return lines.join("\n");
}

export function isOpen(g, r, c) {
  return r >= 0 && c >= 0 && r < g.h && c < g.w && !g.blocked.has(r * g.w + c);
}

// ---- Pseudocode parser -----------------------------------------------------

function tokenize(src) {
  const toks = [];
  const re = /\s*(?:(←|<-)|([A-Za-z_][A-Za-z0-9_]*)|(\d+)|([(){},+\-]))/y;
  let i = 0;
  src = String(src);
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new Error(`Can't read code near: ${src.slice(i, i + 20)}`);
    if (m[1]) toks.push({ k: "assign" });
    else if (m[2]) toks.push({ k: "id", v: m[2] });
    else if (m[3]) toks.push({ k: "num", v: Number(m[3]) });
    else toks.push({ k: "sym", v: m[4] });
    i = re.lastIndex;
  }
  return toks;
}

export function parseProgram(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = (o = 0) => toks[p + o];
  const isId = (v, o = 0) => peek(o) && peek(o).k === "id" && peek(o).v === v;
  const isSym = (v, o = 0) => peek(o) && peek(o).k === "sym" && peek(o).v === v;
  const expectSym = (v) => {
    if (!isSym(v)) throw new Error(`Expected "${v}"`);
    p++;
  };
  const expectId = (v) => {
    if (!isId(v)) throw new Error(`Expected ${v}`);
    p++;
  };
  const emptyParens = () => {
    expectSym("(");
    expectSym(")");
  };

  function block() {
    expectSym("{");
    const body = [];
    while (!isSym("}")) {
      if (!peek()) throw new Error("Missing }");
      body.push(stmt());
    }
    p++;
    return body;
  }

  function numExpr() {
    let a = numAtom();
    while (isSym("+") || isSym("-")) {
      const op = peek().v;
      p++;
      a = { t: "bin", op, a, b: numAtom() };
    }
    return a;
  }
  function numAtom() {
    const t = peek();
    if (!t) throw new Error("Expected a number");
    if (t.k === "num") {
      p++;
      return { t: "num", v: t.v };
    }
    if (t.k === "id") {
      p++;
      return { t: "var", name: t.v };
    }
    if (isSym("(")) {
      p++;
      const e = numExpr();
      expectSym(")");
      return e;
    }
    throw new Error("Expected a number");
  }

  function cond() {
    let a = andCond();
    while (isId("OR")) {
      p++;
      a = { t: "or", a, b: andCond() };
    }
    return a;
  }
  function andCond() {
    let a = notCond();
    while (isId("AND")) {
      p++;
      a = { t: "and", a, b: notCond() };
    }
    return a;
  }
  function notCond() {
    if (isId("NOT")) {
      p++;
      return { t: "not", a: notCond() };
    }
    if (isSym("(")) {
      p++;
      const c = cond();
      expectSym(")");
      return c;
    }
    if (isId("CAN_MOVE")) {
      p++;
      expectSym("(");
      const d = peek();
      if (!d || d.k !== "id" || !(d.v in REL)) throw new Error("CAN_MOVE needs left, right, forward, or backward");
      p++;
      expectSym(")");
      return { t: "can", dir: d.v };
    }
    if (isId("GoalReached")) {
      p++;
      emptyParens();
      return { t: "goal" };
    }
    if (isId("true") || isId("false")) {
      const v = peek().v === "true";
      p++;
      return { t: "bool", v };
    }
    throw new Error("Expected a condition");
  }

  function stmt() {
    const t = peek();
    if (t.k !== "id") throw new Error(`Unexpected "${t.v}"`);
    switch (t.v) {
      case "MOVE_FORWARD":
        p++;
        emptyParens();
        return { t: "move" };
      case "ROTATE_LEFT":
        p++;
        emptyParens();
        return { t: "left" };
      case "ROTATE_RIGHT":
        p++;
        emptyParens();
        return { t: "right" };
      case "REPEAT":
        p++;
        if (isId("UNTIL")) {
          p++;
          expectSym("(");
          const c = cond();
          expectSym(")");
          return { t: "until", cond: c, body: block() };
        } else {
          const count = numExpr();
          expectId("TIMES");
          return { t: "repeat", count, body: block() };
        }
      case "IF": {
        p++;
        expectSym("(");
        const c = cond();
        expectSym(")");
        const then = block();
        let els = null;
        if (isId("ELSE")) {
          p++;
          els = block();
        }
        return { t: "if", cond: c, then, else: els };
      }
      case "PROCEDURE": {
        p++;
        const name = peek().v;
        p++;
        expectSym("(");
        const params = [];
        while (!isSym(")")) {
          params.push(peek().v);
          p++;
          if (isSym(",")) p++;
        }
        p++;
        return { t: "proc", name, params, body: block() };
      }
      default: {
        p++;
        if (peek() && peek().k === "assign") {
          p++;
          return { t: "assign", name: t.v, expr: numExpr() };
        }
        expectSym("(");
        const args = [];
        while (!isSym(")")) {
          args.push(numExpr());
          if (isSym(",")) p++;
        }
        p++;
        return { t: "call", name: t.v, args };
      }
    }
  }

  const prog = [];
  while (p < toks.length) prog.push(stmt());
  return prog;
}

// ---- Formatter (AP exam text style) ------------------------------------------

function fmtNum(e) {
  if (e.t === "num") return String(e.v);
  if (e.t === "var") return e.name;
  return `${fmtNum(e.a)} ${e.op} ${fmtNum(e.b)}`;
}
function fmtCond(c, top = true) {
  switch (c.t) {
    case "can":
      return `CAN_MOVE (${c.dir})`;
    case "goal":
      return "GoalReached ()";
    case "bool":
      return String(c.v);
    case "not":
      return `NOT ${fmtCond(c.a, false)}`;
    case "and":
    case "or": {
      const s = `${fmtCond(c.a, false)} ${c.t.toUpperCase()} ${fmtCond(c.b, false)}`;
      return top ? s : `(${s})`;
    }
  }
}

export function formatProgram(prog, indent = "") {
  const out = [];
  const blk = (body) => {
    out.push(`${indent}{`);
    if (body.length) out.push(formatProgram(body, indent + "  "));
    out.push(`${indent}}`);
  };
  for (const s of prog) {
    switch (s.t) {
      case "move":
        out.push(`${indent}MOVE_FORWARD ()`);
        break;
      case "left":
        out.push(`${indent}ROTATE_LEFT ()`);
        break;
      case "right":
        out.push(`${indent}ROTATE_RIGHT ()`);
        break;
      case "repeat":
        out.push(`${indent}REPEAT ${fmtNum(s.count)} TIMES`);
        blk(s.body);
        break;
      case "until":
        out.push(`${indent}REPEAT UNTIL (${fmtCond(s.cond)})`);
        blk(s.body);
        break;
      case "if":
        out.push(`${indent}IF (${fmtCond(s.cond)})`);
        blk(s.then);
        if (s.else) {
          out.push(`${indent}ELSE`);
          blk(s.else);
        }
        break;
      case "proc":
        out.push(`${indent}PROCEDURE ${s.name} (${s.params.join(", ")})`);
        blk(s.body);
        break;
      case "call":
        out.push(`${indent}${s.name} (${s.args.map(fmtNum).join(", ")})`);
        break;
      case "assign":
        out.push(`${indent}${s.name} ← ${fmtNum(s.expr)}`);
        break;
    }
  }
  return out.join("\n");
}

// ---- Simulator ---------------------------------------------------------------

class Stop {
  constructor(status) {
    this.status = status;
  }
}

// Returns { status, r, c, d, path, steps }.
//   status "ok"       program finished normally
//   status "crashed"  tried to move into a black square or off the grid
//   status "forever"  hit the step limit (an infinite loop, for our purposes)
export function run(grid, prog, { maxSteps = 2000 } = {}) {
  if (typeof prog === "string") prog = parseProgram(prog);
  const st = { r: grid.start.r, c: grid.start.c, d: grid.start.d, steps: 0 };
  const path = [[st.r, st.c]];
  const procs = {};
  for (const s of prog) if (s.t === "proc") procs[s.name] = s;

  const tick = () => {
    if (++st.steps > maxSteps) throw new Stop("forever");
  };
  const num = (e, env) => {
    if (e.t === "num") return e.v;
    if (e.t === "var") {
      if (!(e.name in env)) throw new Error(`Unknown variable ${e.name}`);
      return env[e.name];
    }
    const a = num(e.a, env);
    const b = num(e.b, env);
    return e.op === "+" ? a + b : a - b;
  };
  const test = (c, env) => {
    switch (c.t) {
      case "bool":
        return c.v;
      case "goal":
        return !!grid.goal && st.r === grid.goal.r && st.c === grid.goal.c;
      case "can": {
        const d = (st.d + REL[c.dir]) % 4;
        return isOpen(grid, st.r + DR[d], st.c + DC[d]);
      }
      case "not":
        return !test(c.a, env);
      case "and":
        return test(c.a, env) && test(c.b, env);
      case "or":
        return test(c.a, env) || test(c.b, env);
    }
  };
  const exec = (body, env) => {
    for (const s of body) {
      switch (s.t) {
        case "move": {
          tick();
          const nr = st.r + DR[st.d];
          const nc = st.c + DC[st.d];
          if (!isOpen(grid, nr, nc)) throw new Stop("crashed");
          st.r = nr;
          st.c = nc;
          path.push([nr, nc]);
          break;
        }
        case "left":
          tick();
          st.d = (st.d + 3) % 4;
          break;
        case "right":
          tick();
          st.d = (st.d + 1) % 4;
          break;
        case "repeat": {
          const n = num(s.count, env);
          for (let i = 0; i < n; i++) {
            tick();
            exec(s.body, env);
          }
          break;
        }
        case "until":
          while (!test(s.cond, env)) {
            tick();
            exec(s.body, env);
          }
          break;
        case "if":
          if (test(s.cond, env)) exec(s.then, env);
          else if (s.else) exec(s.else, env);
          break;
        case "proc":
          break;
        case "assign":
          env[s.name] = num(s.expr, env);
          break;
        case "call": {
          const pr = procs[s.name];
          if (!pr) throw new Error(`Unknown procedure ${s.name}`);
          const local = { ...env };
          pr.params.forEach((name, i) => (local[name] = num(s.args[i], env)));
          tick();
          exec(pr.body, local);
          break;
        }
      }
    }
  };

  let status = "ok";
  try {
    exec(prog, {});
  } catch (e) {
    if (e instanceof Stop) status = e.status;
    else throw e;
  }
  return { status, r: st.r, c: st.c, d: st.d, path, steps: st.steps };
}

export function reachesGoal(grid, prog) {
  const res = run(grid, prog);
  return res.status === "ok" && grid.goal && res.r === grid.goal.r && res.c === grid.goal.c;
}

// ---- Question checking -------------------------------------------------------
//
// One question schema serves the fixed worksheets (_data/unplugged/robot_*.yml)
// and the generator. checkQuestion() recomputes the right answer from the
// simulator, so a typo in a hand-written key gets caught.

export const LETTERS = ["A", "B", "C", "D", "E", "F"];
export const ROMAN = ["I", "II", "III", "IV"];

export function normalizeAnswer(a) {
  return (Array.isArray(a) ? a : String(a).split(/[\s,]+/)).filter(Boolean).sort();
}

export function computeAnswer(q) {
  if (q.kind === "which-code") {
    const g = parseGrid(q.grid);
    return q.choices.map((ch, i) => (reachesGoal(g, ch) ? LETTERS[i] : null)).filter(Boolean);
  }
  if (q.kind === "end-square") {
    const g = parseGrid(q.grid);
    const res = run(g, q.code);
    if (res.status !== "ok") return [`(${res.status})`];
    const hit = Object.entries(g.labels).find(([, v]) => v.r === res.r && v.c === res.c);
    return hit ? [hit[0]] : ["(unlabeled square)"];
  }
  if (q.kind === "which-grids") {
    const works = q.grids.map((t, i) => (reachesGoal(parseGrid(t), q.code) ? ROMAN[i] : null)).filter(Boolean);
    const want = describeRomans(works, q.grids.length);
    const i = q.choices.findIndex((ch) => ch === want);
    return i >= 0 ? [LETTERS[i]] : [`(no choice says "${want}")`];
  }
  throw new Error(`Unknown question kind ${q.kind}`);
}

// ["I", "III"] -> "I and III only"; matches the AP exam's phrasing. "only"
// is dropped when the list is every grid there is.
export function describeRomans(list, total) {
  const only = list.length === total ? "" : " only";
  if (list.length === 0) return "None of the grids";
  if (list.length === 1) return `${list[0]}${only}`;
  if (list.length === 2) return `${list[0]} and ${list[1]}${only}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}${only}`;
}
