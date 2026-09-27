// Creature sorting: 16 cartoon creatures, one for every combination of four
// yes/no traits, plus a boolean-expression parser/evaluator over them.
//
// Every `if` a program ever runs boils down to one of these three words:
// AND, OR, NOT. This module is DOM-free so tools/check_creature_sorting.mjs
// can import it in Node to verify every hand-written answer key and to
// stress-test the generator.

// ---- The 16 creatures --------------------------------------------------------
//
// Creature number n (1-16) encodes its four traits in the bits of n - 1:
//   bit 3 (8s place)  round     (else square)
//   bit 2 (4s place)  has_hat   (else no hat)
//   bit 1 (2s place)  two_eyes  (else one eye)
//   bit 0 (1s place)  striped   (else plain)
// That's just a fixed, checkable rule for turning a number into a picture --
// the numbering carries no other meaning, so any lesson can refer to
// "creature 11" and mean the same creature every time.

export const TRAIT_NAMES = ["round", "has_hat", "two_eyes", "striped"];

// Trait name -> creature property, and a plain-English pair of labels for
// each trait (true label, false label), used by legends and hints.
export const TRAIT_LABELS = {
  round: ["round body", "square body"],
  has_hat: ["has a hat", "no hat"],
  two_eyes: ["two eyes", "one eye"],
  striped: ["striped body", "plain body"],
};

const PROP = { round: "round", has_hat: "hasHat", two_eyes: "twoEyes", striped: "striped" };

export const CREATURES = Array.from({ length: 16 }, (_, idx) => ({
  n: idx + 1,
  round: !!(idx & 8),
  hasHat: !!(idx & 4),
  twoEyes: !!(idx & 2),
  striped: !!(idx & 1),
}));

// ---- Expression parser --------------------------------------------------------
//
// Grammar (standard precedence, NOT tightest, then AND, then OR):
//   expr   := orExpr
//   orExpr := andExpr (OR andExpr)*
//   andExpr:= notExpr (AND notExpr)*
//   notExpr:= NOT notExpr | atom
//   atom   := trait-name | "(" expr ")"
//
// AND/OR/NOT are recognized case-insensitively so the same parser reads both
// the AP CSP pseudocode style ("AND", "OR", "NOT") and real Python
// ("and", "or", "not") used on the second, HS-only page.

function tokenize(src) {
  const toks = [];
  const re = /\s*(?:([A-Za-z_][A-Za-z0-9_]*)|([(){}]))/y;
  let i = 0;
  src = String(src);
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new Error(`Can't read expression near: ${src.slice(i, i + 20)}`);
    if (m[1]) toks.push({ k: "id", v: m[1] });
    else toks.push({ k: "sym", v: m[2] });
    i = re.lastIndex;
  }
  return toks;
}

const KEYWORDS = ["AND", "OR", "NOT"];

export function parseExpr(text) {
  const toks = tokenize(text);
  let p = 0;
  const peek = () => toks[p];
  const isKw = (kw) => {
    const t = peek();
    return !!t && t.k === "id" && t.v.toUpperCase() === kw;
  };
  const isSym = (v) => {
    const t = peek();
    return !!t && t.k === "sym" && t.v === v;
  };

  function orExpr() {
    let a = andExpr();
    while (isKw("OR")) {
      p++;
      a = { t: "or", a, b: andExpr() };
    }
    return a;
  }
  function andExpr() {
    let a = notExpr();
    while (isKw("AND")) {
      p++;
      a = { t: "and", a, b: notExpr() };
    }
    return a;
  }
  function notExpr() {
    if (isKw("NOT")) {
      p++;
      return { t: "not", a: notExpr() };
    }
    if (isSym("(")) {
      p++;
      const e = orExpr();
      if (!isSym(")")) throw new Error('Expected ")"');
      p++;
      return e;
    }
    const t = peek();
    if (!t || t.k !== "id") throw new Error("Expected a trait name");
    if (KEYWORDS.includes(t.v.toUpperCase())) throw new Error(`Unexpected "${t.v}"`);
    if (!TRAIT_NAMES.includes(t.v)) throw new Error(`Unknown trait "${t.v}"`);
    p++;
    return { t: "trait", name: t.v };
  }

  const e = orExpr();
  if (p !== toks.length) throw new Error(`Unexpected text after expression near: ${toks[p].v}`);
  return e;
}

export function evaluate(expr, creature) {
  const node = typeof expr === "string" ? parseExpr(expr) : expr;
  const go = (c) => {
    switch (c.t) {
      case "trait":
        return creature[PROP[c.name]];
      case "not":
        return !go(c.a);
      case "and":
        return go(c.a) && go(c.b);
      case "or":
        return go(c.a) || go(c.b);
      default:
        throw new Error(`Unknown node ${c.t}`);
    }
  };
  return go(node);
}

// The creature numbers (ascending) for which an expression is true.
export function matchSet(expr) {
  const node = typeof expr === "string" ? parseExpr(expr) : expr;
  return CREATURES.filter((c) => evaluate(node, c)).map((c) => c.n);
}

// ---- Formatter -----------------------------------------------------------------
//
// Turns an AST back into text, in either style. Parens are added only where
// the grouping would otherwise change: an OR nested inside an AND always
// needs them (AND binds tighter); an AND nested inside an OR never does; NOT
// applied to a compound AND/OR always does, since NOT binds tightest of all.

const KW = {
  AP: { AND: "AND", OR: "OR", NOT: "NOT" },
  python: { AND: "and", OR: "or", NOT: "not" },
};

function fmtNode(c, parentOp, kw) {
  switch (c.t) {
    case "trait":
      return c.name;
    case "not": {
      const needsParens = c.a.t === "and" || c.a.t === "or";
      const inner = fmtNode(c.a, "not", kw);
      return `${kw.NOT} ${needsParens ? `(${inner})` : inner}`;
    }
    case "and":
    case "or": {
      const s = `${fmtNode(c.a, c.t, kw)} ${kw[c.t.toUpperCase()]} ${fmtNode(c.b, c.t, kw)}`;
      const needsParens = parentOp === "and" && c.t === "or";
      return needsParens ? `(${s})` : s;
    }
    default:
      throw new Error(`Unknown node ${c.t}`);
  }
}

export function formatExpr(expr, style = "AP") {
  const node = typeof expr === "string" ? parseExpr(expr) : expr;
  return fmtNode(node, null, KW[style]);
}

// ---- Question checking -----------------------------------------------------------
//
// One schema serves the fixed worksheets (_data/unplugged/creature_sorting*.yml)
// and the generator, same pattern as the robot activity.
//   kind "evaluate": q.expr is given; q.answer is the creature numbers it's
//     true for.
//   kind "reverse": q.marked is given (the creatures shown circled); q.key is
//     one expression that selects exactly that set (others may also work).

export function computeAnswer(q) {
  if (q.kind === "evaluate") return matchSet(q.expr);
  if (q.kind === "reverse") return matchSet(q.key);
  throw new Error(`Unknown question kind ${q.kind}`);
}

export function normalizeSet(a) {
  return (Array.isArray(a) ? a : String(a).split(/[\s,]+/).filter(Boolean).map(Number))
    .slice()
    .sort((x, y) => x - y);
}
