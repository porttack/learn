// Generates AP CSP style robot questions in the same schema as the fixed
// worksheets in _data/unplugged/robot_*.yml, so one renderer draws both.
//
// Wrong answers aren't random: each one is the correct program with one
// classic mistake applied (left/right mix-up, off-by-one count, a missing
// turn, two steps swapped), and the answer key says which mistake it is.
// Every choice is run through the simulator before it's used.

import {
  parseGrid, gridToText, isOpen, run, reachesGoal, formatProgram, parseProgram,
  LETTERS, ROMAN, describeRomans,
} from "./robot.js";

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export const LEVELS = {
  starter: { label: "Starter: sequences only", sizes: [[4, 4], [5, 4], [5, 5]], density: 0.15 },
  ap: { label: "AP: loops and procedures", sizes: [[5, 5], [6, 5], [6, 6]], density: 0.2 },
  challenge: { label: "Challenge: CAN_MOVE and REPEAT UNTIL", sizes: [[5, 5], [6, 6]], density: 0.22 },
};

// ---- Grids and walks ---------------------------------------------------------

function randomGrid(rng, level) {
  const [w, h] = rng.pick(LEVELS[level].sizes);
  const g = { w, h, blocked: new Set(), goal: null, start: null, labels: {} };
  for (let i = 0; i < w * h; i++) if (rng.chance(LEVELS[level].density)) g.blocked.add(i);
  const open = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (isOpen(g, r, c)) open.push([r, c]);
  const [r, c] = rng.pick(open);
  g.start = { r, c, d: rng.int(0, 3) };
  return g;
}

function freeAhead(g, r, c, d, cap) {
  let n = 0;
  while (n < cap && isOpen(g, r + DR[d] * (n + 1), c + DC[d] * (n + 1))) n++;
  return n;
}

// A legal random walk as a list of "F" / "L" / "R" ops, or null.
function walkOps(rng, g, runs, maxRun) {
  let { r, c, d } = g.start;
  const ops = [];
  for (let i = 0; i < runs; i++) {
    const turns = i === 0 ? ["", "", "L", "R"] : ["L", "R"];
    const options = rng.shuffle(turns);
    let done = false;
    for (const t of options) {
      let nd = d;
      for (const ch of t) nd = ch === "L" ? (nd + 3) % 4 : (nd + 1) % 4;
      const free = freeAhead(g, r, c, nd, maxRun);
      if (free === 0) continue;
      const len = rng.int(1, free);
      for (const ch of t) ops.push(ch);
      for (let k = 0; k < len; k++) ops.push("F");
      d = nd;
      r += DR[d] * len;
      c += DC[d] * len;
      done = true;
      break;
    }
    if (!done) return null;
  }
  return ops;
}

// Ops -> AST. useRepeat folds runs of 2+ moves into REPEAT n TIMES.
function compress(ops, useRepeat, rng) {
  const out = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    let j = i;
    while (j < ops.length && ops[j] === op) j++;
    const n = j - i;
    const node = op === "F" ? { t: "move" } : op === "L" ? { t: "left" } : { t: "right" };
    const fold = useRepeat && n >= 2 && (op === "F" ? rng.chance(0.85) : rng.chance(0.3));
    if (fold) out.push({ t: "repeat", count: { t: "num", v: n }, body: [node] });
    else for (let k = 0; k < n; k++) out.push({ ...node });
    i = j;
  }
  return out;
}

// A program shaped like "do this pattern k times", the AP exam's favorite.
function periodicProgram(rng, g) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const moves = rng.int(1, 2);
    const turn = rng.pick(["left", "right"]);
    const times = rng.int(2, 3);
    const body = [];
    if (moves === 1) body.push({ t: "move" });
    else body.push({ t: "repeat", count: { t: "num", v: moves }, body: [{ t: "move" }] });
    body.push({ t: turn });
    if (rng.chance(0.4)) body.push({ t: "move" });
    const prog = [{ t: "repeat", count: { t: "num", v: times }, body }];
    const res = run(g, prog);
    if (res.status === "ok" && (res.r !== g.start.r || res.c !== g.start.c)) return prog;
  }
  return null;
}

// PROCEDURE with a parameter, then two or three calls.
const PROC_TEMPLATES = [
  (turn) => parseProgram(`PROCEDURE moveAndTurn (n)
{
  REPEAT n TIMES
  {
    MOVE_FORWARD ()
  }
  ${turn} ()
}`)[0],
  (turn) => parseProgram(`PROCEDURE turnAndMove (n)
{
  ${turn} ()
  REPEAT n TIMES
  {
    MOVE_FORWARD ()
  }
}`)[0],
  () => parseProgram(`PROCEDURE uTurnMove (n)
{
  ROTATE_RIGHT ()
  ROTATE_RIGHT ()
  REPEAT n TIMES
  {
    MOVE_FORWARD ()
  }
}`)[0],
];

function procedureProgram(rng, g) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const def = rng.pick(PROC_TEMPLATES)(rng.pick(["ROTATE_LEFT", "ROTATE_RIGHT"]));
    const prog = [def];
    const calls = rng.int(2, 3);
    let ok = true;
    for (let k = 0; k < calls && ok; k++) {
      ok = false;
      for (const n of rng.shuffle([1, 2, 3])) {
        const trial = [...prog, { t: "call", name: def.name, args: [{ t: "num", v: n }] }];
        if (run(g, trial).status === "ok") {
          prog.push(trial[trial.length - 1]);
          ok = true;
          break;
        }
      }
    }
    const res = run(g, prog);
    if (ok && res.status === "ok" && (res.r !== g.start.r || res.c !== g.start.c)) return prog;
  }
  return null;
}

function buildProgram(rng, g, level, style) {
  if (style === "procedure") return procedureProgram(rng, g);
  if (style === "periodic") return periodicProgram(rng, g);
  const ops = walkOps(rng, g, level === "starter" ? rng.int(2, 3) : rng.int(2, 4), level === "starter" ? 3 : 4);
  if (!ops || ops.filter((o) => o === "F").length < 3) return null;
  return compress(ops, level !== "starter", rng);
}

// ---- Mutations ---------------------------------------------------------------

const clone = (x) => JSON.parse(JSON.stringify(x));

// Every statement list in the program, including loop and procedure bodies.
function bodies(prog) {
  const out = [prog];
  const walk = (list) => {
    for (const s of list) {
      for (const k of ["body", "then", "else"]) if (s[k]) {
        out.push(s[k]);
        walk(s[k]);
      }
    }
  };
  walk(prog);
  return out;
}

function allNodes(prog) {
  return bodies(prog).flat();
}

const MUTATIONS = [
  {
    note: "turns the wrong way at one of the turns",
    apply(p, rng) {
      const turns = allNodes(p).filter((s) => s.t === "left" || s.t === "right");
      if (!turns.length) return false;
      const s = rng.pick(turns);
      s.t = s.t === "left" ? "right" : "left";
      return true;
    },
  },
  {
    note: "mixes up ROTATE_LEFT and ROTATE_RIGHT",
    apply(p) {
      const turns = allNodes(p).filter((s) => s.t === "left" || s.t === "right");
      if (turns.length < 2) return false;
      for (const s of turns) s.t = s.t === "left" ? "right" : "left";
      return true;
    },
  },
  {
    note: "moves one square too many",
    apply(p, rng) {
      const counts = allNodes(p).filter((s) => s.t === "repeat" && s.count.t === "num" && s.body.every((b) => b.t === "move"));
      const calls = allNodes(p).filter((s) => s.t === "call" && s.args.length && s.args[0].t === "num");
      if (counts.length && rng.chance(0.7)) {
        rng.pick(counts).count.v += 1;
        return true;
      }
      if (calls.length) {
        rng.pick(calls).args[0].v += 1;
        return true;
      }
      const list = rng.pick(bodies(p).filter((b) => b.some((s) => s.t === "move")));
      if (!list) return false;
      const i = list.findIndex((s) => s.t === "move");
      list.splice(i, 0, { t: "move" });
      return true;
    },
  },
  {
    note: "moves one square too few",
    apply(p, rng) {
      const counts = allNodes(p).filter((s) => s.t === "repeat" && s.count.t === "num" && s.count.v > 1 && s.body.every((b) => b.t === "move"));
      const calls = allNodes(p).filter((s) => s.t === "call" && s.args.length && s.args[0].t === "num" && s.args[0].v > 1);
      if (counts.length && rng.chance(0.7)) {
        rng.pick(counts).count.v -= 1;
        return true;
      }
      if (calls.length) {
        rng.pick(calls).args[0].v -= 1;
        return true;
      }
      const lists = bodies(p).filter((b) => b.filter((s) => s.t === "move").length >= 2);
      if (!lists.length) return false;
      const list = rng.pick(lists);
      list.splice(list.findIndex((s) => s.t === "move"), 1);
      return true;
    },
  },
  {
    note: "leaves out a turn",
    apply(p, rng) {
      const lists = bodies(p).filter((b) => b.some((s) => s.t === "left" || s.t === "right"));
      if (!lists.length) return false;
      const list = rng.pick(lists);
      const idx = list.map((s, i) => (s.t === "left" || s.t === "right" ? i : -1)).filter((i) => i >= 0);
      list.splice(rng.pick(idx), 1);
      return true;
    },
  },
  {
    note: "does two steps in the wrong order",
    apply(p, rng) {
      const lists = bodies(p).filter((b) => b.length >= 2);
      if (!lists.length) return false;
      const list = rng.pick(lists);
      const i = rng.int(0, list.length - 2);
      if (JSON.stringify(list[i]) === JSON.stringify(list[i + 1])) return false;
      [list[i], list[i + 1]] = [list[i + 1], list[i]];
      return true;
    },
  },
];

function mutants(rng, prog) {
  const out = [];
  for (const m of rng.shuffle(MUTATIONS)) {
    for (let tries = 0; tries < 3; tries++) {
      const p = clone(prog);
      if (m.apply(p, rng)) {
        out.push({ prog: p, note: m.note });
        break;
      }
    }
  }
  return out;
}

// Same behavior, different code: the "select two answers" partner.
function equivalent(rng, prog) {
  const rewrites = rng.shuffle([
    (p) => {
      const turns = allNodes(p).filter((s) => s.t === "left" || s.t === "right");
      if (!turns.length) return false;
      const s = rng.pick(turns);
      const other = s.t === "left" ? "right" : "left";
      Object.assign(s, { t: "repeat", count: { t: "num", v: 3 }, body: [{ t: other }] });
      return true;
    },
    (p) => {
      for (const list of bodies(p)) {
        const i = list.findIndex((s) => s.t === "repeat" && s.count.t === "num" && s.count.v * s.body.length <= 6);
        if (i >= 0) {
          const s = list[i];
          const flat = [];
          for (let k = 0; k < s.count.v; k++) flat.push(...clone(s.body));
          list.splice(i, 1, ...flat);
          return true;
        }
      }
      return false;
    },
    (p) => {
      for (const list of bodies(p)) {
        for (let i = 0; i + 1 < list.length; i++) {
          if (list[i].t === "move" && list[i + 1].t === "move") {
            let j = i;
            while (j < list.length && list[j].t === "move") j++;
            list.splice(i, j - i, { t: "repeat", count: { t: "num", v: j - i }, body: [{ t: "move" }] });
            return true;
          }
        }
      }
      return false;
    },
  ]);
  for (const rw of rewrites) {
    const p = clone(prog);
    if (rw(p)) return p;
  }
  return null;
}

// ---- Question builders -------------------------------------------------------

function whichCode(rng, level) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const g = randomGrid(rng, level);
    const style = level === "starter" ? "walk" : rng.pick(["walk", "walk", "periodic", "procedure"]);
    const prog = buildProgram(rng, g, level, style);
    if (!prog) continue;
    const end = run(g, prog);
    if (end.r === g.start.r && end.c === g.start.c) continue;
    g.goal = { r: end.r, c: end.c };

    const seen = new Set([formatProgram(prog)]);
    const correct = [{ prog, note: "Correct." }];
    if (level !== "starter" && rng.chance(0.35)) {
      const eq = equivalent(rng, prog);
      if (eq && reachesGoal(g, eq) && !seen.has(formatProgram(eq))) {
        seen.add(formatProgram(eq));
        correct.push({ prog: eq, note: "Correct. Different code, same moves." });
      }
    }
    const wrong = [];
    for (const m of mutants(rng, prog)) {
      const text = formatProgram(m.prog);
      if (seen.has(text) || reachesGoal(g, m.prog)) continue;
      seen.add(text);
      const res = run(g, m.prog);
      const then = res.status === "crashed" ? " That sends the robot into a black square or off the grid, so the program stops." : "";
      wrong.push({ prog: m.prog, note: `This one ${m.note}.${then}` });
      if (wrong.length === 4 - correct.length) break;
    }
    if (wrong.length < 4 - correct.length) continue;

    const choices = rng.shuffle([...correct, ...wrong]);
    return {
      kind: "which-code",
      grid: gridToText(g),
      choices: choices.map((c) => formatProgram(c.prog)),
      notes: choices.map((c) => c.note),
      answer: choices.map((c, i) => (correct.includes(c) ? LETTERS[i] : null)).filter(Boolean),
    };
  }
  throw new Error("Couldn't build a which-code question");
}

function endSquare(rng, level) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const g = randomGrid(rng, level);
    const style = level === "starter" ? "walk" : rng.pick(["walk", "periodic", "procedure", "procedure"]);
    const prog = buildProgram(rng, g, level, style);
    if (!prog) continue;
    const end = run(g, prog);
    if (end.r === g.start.r && end.c === g.start.c) continue;

    const key = (r, c) => `${r},${c}`;
    const taken = new Set([key(g.start.r, g.start.c), key(end.r, end.c)]);
    const spots = [{ r: end.r, c: end.c, note: "Correct." }];
    for (const m of mutants(rng, prog)) {
      const res = run(g, m.prog);
      if (res.status !== "ok" || taken.has(key(res.r, res.c))) continue;
      taken.add(key(res.r, res.c));
      spots.push({ r: res.r, c: res.c, note: `This is where the robot ends if it ${m.note}.` });
      if (spots.length === 4) break;
    }
    // Top up with nearby open squares if the mistakes didn't give enough.
    const near = [];
    for (let r = 0; r < g.h; r++)
      for (let c = 0; c < g.w; c++)
        if (isOpen(g, r, c) && !taken.has(key(r, c)) && Math.abs(r - end.r) + Math.abs(c - end.c) <= 3) near.push([r, c]);
    for (const [r, c] of rng.shuffle(near)) {
      if (spots.length === 4) break;
      taken.add(key(r, c));
      spots.push({ r, c, note: "The robot doesn't end here." });
    }
    if (spots.length < 4) continue;

    const order = rng.shuffle(spots);
    order.forEach((s, i) => (g.labels[LETTERS[i]] = { r: s.r, c: s.c }));
    return {
      kind: "end-square",
      grid: gridToText(g),
      code: formatProgram(prog),
      notes: order.map((s) => s.note),
      answer: [LETTERS[order.findIndex((s) => s.note === "Correct.")]],
    };
  }
  throw new Error("Couldn't build an end-square question");
}

// Maze-style programs for the "for which grids does it work?" format.
const LOOP_PROGRAMS = [
  `REPEAT UNTIL (GoalReached ())
{
  IF (CAN_MOVE (forward))
  {
    MOVE_FORWARD ()
  }
  ELSE
  {
    ROTATE_RIGHT ()
  }
}`,
  `REPEAT UNTIL (GoalReached ())
{
  IF (CAN_MOVE (forward))
  {
    MOVE_FORWARD ()
  }
  ELSE
  {
    ROTATE_LEFT ()
  }
}`,
  `REPEAT UNTIL (GoalReached ())
{
  IF (CAN_MOVE (left))
  {
    ROTATE_LEFT ()
  }
  MOVE_FORWARD ()
}`,
  `REPEAT UNTIL (GoalReached ())
{
  REPEAT UNTIL (NOT CAN_MOVE (forward))
  {
    MOVE_FORWARD ()
  }
  ROTATE_RIGHT ()
}`,
  `REPEAT UNTIL (GoalReached ())
{
  IF (CAN_MOVE (right))
  {
    ROTATE_RIGHT ()
  }
  IF (CAN_MOVE (forward))
  {
    MOVE_FORWARD ()
  }
  ELSE
  {
    ROTATE_LEFT ()
  }
}`,
];

const OUTCOME_NOTE = {
  ok: "the robot reaches the gray square",
  crashed: "the robot tries to move into a black square or off the grid, so the program stops",
  forever: "the robot goes around in a loop forever and never reaches the gray square",
};

function smallGridWithGoal(rng) {
  const g = randomGrid(rng, "challenge");
  g.w = rng.int(4, 5);
  g.h = rng.int(4, 5);
  g.blocked = new Set();
  for (let i = 0; i < g.w * g.h; i++) if (rng.chance(0.25)) g.blocked.add(i);
  const open = [];
  for (let r = 0; r < g.h; r++) for (let c = 0; c < g.w; c++) if (isOpen(g, r, c)) open.push([r, c]);
  if (open.length < 6) return null;
  const [a, b] = rng.shuffle(open);
  g.start = { r: a[0], c: a[1], d: rng.int(0, 3) };
  g.goal = { r: b[0], c: b[1] };
  return g;
}

function whichGrids(rng, avoid = new Set()) {
  const fresh = LOOP_PROGRAMS.filter((p) => !avoid.has(p));
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = rng.pick(fresh.length ? fresh : LOOP_PROGRAMS);
    const prog = parseProgram(code);
    const count = rng.chance(0.5) ? 2 : 3;
    // Decide the answer first so it isn't always "I only".
    const want = Array.from({ length: count }, () => rng.chance(0.5));
    const grids = [];
    const outcomes = [];
    for (let i = 0; i < count; i++) {
      let found = null;
      for (let k = 0; k < 300 && !found; k++) {
        const g = smallGridWithGoal(rng);
        if (!g) continue;
        const res = run(g, prog, { maxSteps: 400 });
        const ok = res.status === "ok";
        if (ok === want[i]) found = { g, status: res.status };
      }
      if (!found) break;
      grids.push(found.g);
      outcomes.push(found.status);
    }
    if (grids.length < count) continue;

    const works = ROMAN.slice(0, count).filter((_, i) => outcomes[i] === "ok");
    const right = describeRomans(works, count);
    const all = [];
    for (let mask = 0; mask < 1 << count; mask++) {
      all.push(describeRomans(ROMAN.slice(0, count).filter((_, i) => mask & (1 << i)), count));
    }
    const others = rng.shuffle(all.filter((d) => d !== right)).slice(0, 3);
    const choices = rng.shuffle([right, ...others]);
    const gridNotes = outcomes.map((o, i) => `Grid ${ROMAN[i]}: ${OUTCOME_NOTE[o]}.`);
    return {
      kind: "which-grids",
      grids: grids.map(gridToText),
      code,
      choices,
      notes: choices.map((c) => (c === right ? gridNotes.join(" ") : "")),
      answer: [LETTERS[choices.indexOf(right)]],
    };
  }
  throw new Error("Couldn't build a which-grids question");
}

// A whole set. Question i draws from its own forked generator, so changing
// the count doesn't reshuffle the earlier questions.
export function generateSet(rng, { level = "ap", count = 6 } = {}) {
  const plan = {
    starter: ["end-square", "which-code"],
    ap: ["end-square", "which-code", "which-code", "end-square"],
    challenge: ["which-grids", "which-code", "which-grids", "end-square"],
  }[level];
  const qs = [];
  const usedLoops = new Set();
  for (let i = 0; i < count; i++) {
    const r = rng.fork(i + 1);
    const kind = plan[i % plan.length];
    if (kind === "which-code") qs.push(whichCode(r, level === "challenge" ? "ap" : level));
    else if (kind === "end-square") qs.push(endSquare(r, level === "challenge" ? "ap" : level));
    else {
      const q = whichGrids(r, usedLoops);
      usedLoops.add(q.code);
      qs.push(q);
    }
  }
  return qs;
}
