// OpenSCAD -> Python 3D Studio converter. Best effort, and honest about it:
// whatever Python 3D cannot do is left as a "# NOTE:" comment in the result and
// listed in `warnings`, never silently dropped.
//
// What maps well: cube, cylinder (cones too), sphere, polyhedron, square, circle,
// polygon, text, translate, rotate, color, union, difference, intersection,
// linear_extrude, rotate_extrude, variables, expressions, functions, modules (with
// children()), for, if/else, let, list comprehensions and ranges. Scale is pushed down
// into the shapes it covers (Python 3D has no scale). Left as notes: mirror, hull,
// minkowski, offset, resize, multmatrix, projection, import, twisted extrusions.
//
// Plain ES module with no browser APIs, so Node can test it (tools/check_scad2py.mjs).

// ---------------------------------------------------------------- lexer
function lex(src) {
  const toks = [];
  const n = src.length;
  let i = 0;
  const re = (r) => { r.lastIndex = i; return r.exec(src); };
  const NUM = /(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/y;
  const ID = /[A-Za-z_$][A-Za-z0-9_$]*/y;
  const TWO = new Set(["==", "!=", "<=", ">=", "&&", "||"]);
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      const m = re(NUM); toks.push({ t: "num", v: m[0], p: i }); i += m[0].length; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      const m = re(ID);
      if ((m[0] === "use" || m[0] === "include") && /^\s*</.test(src.slice(i + m[0].length, i + m[0].length + 20))) {
        const e = src.indexOf(">", i);
        toks.push({ t: "incl", v: src.slice(i, e < 0 ? n : e + 1), p: i }); i = e < 0 ? n : e + 1; continue;
      }
      toks.push({ t: "id", v: m[0], p: i }); i += m[0].length; continue;
    }
    if (c === '"') {
      let s = ""; const p = i; i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\") {
          const e = src[i + 1];
          s += e === "n" ? "\n" : e === "t" ? "\t" : e === "r" ? "\r" : e; i += 2;
        } else s += src[i++];
      }
      i++; toks.push({ t: "str", v: s, p }); continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO.has(two)) { toks.push({ t: "op", v: two, p: i }); i += 2; continue; }
    toks.push({ t: "op", v: c, p: i }); i++;
  }
  toks.push({ t: "eof", v: "", p: n });
  return toks;
}

// ---------------------------------------------------------------- parser
const num = (n, raw) => ({ k: "num", n, raw });
const raw = (s) => ({ k: "raw", s });

class Parser {
  constructor(src) { this.src = src; this.t = lex(src); this.i = 0; }
  fail(msg, tok = this.peek()) {
    const line = this.src.slice(0, tok.p).split("\n").length;
    throw new Error(`line ${line}: ${msg}`);
  }
  peek(o = 0) { return this.t[Math.min(this.i + o, this.t.length - 1)]; }
  next() { return this.t[this.i++]; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === "op" && t.v === v; }
  isId(v, o = 0) { const t = this.peek(o); return t.t === "id" && t.v === v; }
  eatOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; }
  expectOp(v) { if (!this.eatOp(v)) this.fail(`expected "${v}" but found "${this.peek().v || "end of file"}"`); }
  ident() { const t = this.next(); if (t.t !== "id") this.fail(`expected a name but found "${t.v}"`, t); return t.v; }

  program() { const out = []; while (this.peek().t !== "eof") { const s = this.stmt(); if (s) out.push(s); } return out; }

  stmt() {
    const t = this.peek();
    if (t.t === "op" && t.v === ";") { this.i++; return null; }
    if (t.t === "op" && t.v === "{") { return { k: "block", body: this.blockBody() }; }
    if (t.t === "incl") { this.i++; return { k: "incl", text: t.v }; }
    if (t.t === "op" && "*!#%".includes(t.v)) { this.i++; const s = this.stmt(); return s ? { k: "mod", m: t.v, s } : null; }
    if (t.t === "id") {
      if (t.v === "module") return this.moduleDef();
      if (t.v === "function") return this.functionDef();
      if (t.v === "for" || t.v === "intersection_for") return this.forStmt();
      if (t.v === "if") return this.ifStmt();
      if (t.v === "let" && this.isOp("(", 1)) {
        this.i++; const assigns = this.assignList(); const body = this.stmt();
        return { k: "let", assigns, body: body ? [body] : [] };
      }
      if (this.isOp("=", 1)) {
        const name = this.ident(); this.i++; const e = this.expr(); this.expectOp(";");
        return { k: "assign", name, e };
      }
      return this.callStmt();
    }
    this.fail(`unexpected "${t.v}"`);
  }
  blockBody() { this.expectOp("{"); const out = []; while (!this.isOp("}")) { if (this.peek().t === "eof") this.fail("missing }"); const s = this.stmt(); if (s) out.push(s); } this.i++; return out; }
  childList() { // what follows a call: ";" or one statement or a block
    if (this.eatOp(";")) return null;
    if (this.isOp("{")) return this.blockBody();
    const s = this.stmt(); return s ? [s] : [];
  }
  params() {
    this.expectOp("("); const out = [];
    while (!this.isOp(")")) {
      const name = this.ident(); let def = null;
      if (this.eatOp("=")) def = this.expr();
      out.push({ name, def }); if (!this.eatOp(",")) break;
    }
    this.expectOp(")"); return out;
  }
  moduleDef() { this.i++; const name = this.ident(); const params = this.params(); const body = this.stmt(); return { k: "module", name, params, body: body ? [body] : [] }; }
  functionDef() { this.i++; const name = this.ident(); const params = this.params(); this.expectOp("="); const e = this.expr(); this.expectOp(";"); return { k: "function", name, params, e }; }
  assignList() { // ( a = 1, b = 2 )
    this.expectOp("("); const out = [];
    while (!this.isOp(")")) { const name = this.ident(); this.expectOp("="); out.push({ name, e: this.expr() }); if (!this.eatOp(",")) break; }
    this.expectOp(")"); return out;
  }
  forStmt() {
    const inter = this.next().v === "intersection_for";
    this.expectOp("("); const vars = [];
    while (!this.isOp(")")) {
      const name = this.ident(); this.expectOp("="); vars.push({ name, e: this.expr() });
      if (this.isOp(";")) this.fail("C-style for loops are not supported");
      if (!this.eatOp(",")) break;
    }
    this.expectOp(")"); const body = this.stmt();
    return { k: "for", vars, inter, body: body ? [body] : [] };
  }
  ifStmt() {
    this.i++; this.expectOp("("); const c = this.expr(); this.expectOp(")");
    const a = this.stmt(); let b = null;
    if (this.isId("else")) { this.i++; const s = this.stmt(); b = s ? [s] : []; }
    return { k: "if", c, then: a ? [a] : [], else: b };
  }
  callStmt() {
    const name = this.ident(); const args = this.args();
    const children = this.childList();
    return { k: "call", name, args, children };
  }
  args() {
    this.expectOp("("); const out = [];
    while (!this.isOp(")")) {
      if (this.peek().t === "id" && this.isOp("=", 1)) { const name = this.ident(); this.i++; out.push({ name, e: this.expr() }); }
      else out.push({ e: this.expr() });
      if (!this.eatOp(",")) break;
    }
    this.expectOp(")"); return out;
  }

  // ---- expressions
  expr() { return this.tern(); }
  tern() {
    const c = this.bin(0);
    if (this.eatOp("?")) { const a = this.tern(); this.expectOp(":"); const b = this.tern(); return { k: "tern", c, a, b }; }
    return c;
  }
  bin(level) {
    const LV = [["||"], ["&&"], ["==", "!="], ["<", ">", "<=", ">="], ["+", "-"], ["*", "/", "%"]];
    if (level >= LV.length) return this.unary();
    let l = this.bin(level + 1);
    for (;;) {
      const t = this.peek();
      if (t.t === "op" && LV[level].includes(t.v)) { this.i++; l = { k: "bin", op: t.v, l, r: this.bin(level + 1) }; } else return l;
    }
  }
  unary() {
    const t = this.peek();
    if (t.t === "op" && (t.v === "!" || t.v === "-" || t.v === "+")) { this.i++; return { k: "un", op: t.v, e: this.unary() }; }
    return this.power();
  }
  power() { const l = this.postfix(); if (this.eatOp("^")) return { k: "bin", op: "^", l, r: this.unary() }; return l; }
  postfix() {
    let e = this.primary();
    for (;;) {
      if (this.isOp("(") && e.k === "id") { e = { k: "call", name: e.name, args: this.args() }; }
      else if (this.isOp("[")) { this.i++; const i = this.expr(); this.expectOp("]"); e = { k: "idx", e, i }; }
      else if (this.isOp(".") && this.peek(1).t === "id") { this.i++; e = { k: "mem", e, m: this.next().v }; }
      else return e;
    }
  }
  primary() {
    const t = this.next();
    if (t.t === "num") return num(parseFloat(t.v), t.v);
    if (t.t === "str") return { k: "str", v: t.v };
    if (t.t === "id") {
      if (t.v === "true") return { k: "lit", v: "True" };
      if (t.v === "false") return { k: "lit", v: "False" };
      if (t.v === "undef") return { k: "lit", v: "None" };
      if (t.v === "let" && this.isOp("(")) { const assigns = this.assignList(); return { k: "let", assigns, e: this.expr() }; }
      return { k: "id", name: t.v };
    }
    if (t.t === "op" && t.v === "(") { const e = this.expr(); this.expectOp(")"); return e; }
    if (t.t === "op" && t.v === "[") return this.bracket();
    this.fail(`unexpected "${t.v || "end of file"}" in an expression`, t);
  }
  bracket() {
    if (this.eatOp("]")) return { k: "vec", items: [] };
    const first = this.element();
    if (this.isOp(":") && !first.gen) {
      this.i++; const b = this.expr(); let s = null, e = b;
      if (this.eatOp(":")) { s = b; e = this.expr(); }
      this.expectOp("]"); return { k: "range", a: first, s, b: e };
    }
    const items = [first];
    while (this.eatOp(",")) { if (this.isOp("]")) break; items.push(this.element()); }
    this.expectOp("]"); return { k: "vec", items };
  }
  element() { // one item inside [ ... ]: an expression, or a generator (for / if / each / let)
    if (this.isId("for") && this.isOp("(", 1)) {
      this.i++; this.expectOp("("); const vars = [];
      while (!this.isOp(")")) {
        const name = this.ident(); this.expectOp("="); vars.push({ name, e: this.expr() });
        if (this.isOp(";")) this.fail("C-style for in a list is not supported");
        if (!this.eatOp(",")) break;
      }
      this.expectOp(")"); return { gen: "for", vars, body: this.element() };
    }
    if (this.isId("each")) { this.i++; return { gen: "each", e: this.expr() }; }
    if (this.isId("if") && this.isOp("(", 1)) {
      this.i++; this.expectOp("("); const c = this.expr(); this.expectOp(")");
      const a = this.element(); let b = null;
      if (this.isId("else")) { this.i++; b = this.element(); }
      return { gen: "if", c, a, b };
    }
    if (this.isId("let") && this.isOp("(", 1)) { this.i++; const assigns = this.assignList(); return { gen: "let", assigns, body: this.element() }; }
    return this.expr();
  }
}

// ---------------------------------------------------------------- helpers (Python source)
// Written into the result only when something uses them. Order matters (definitions first).
const HELPERS = {
  _sind: ["def _sind(x):\n    return math.sin(math.radians(x))"],
  _cosd: ["def _cosd(x):\n    return math.cos(math.radians(x))"],
  _tand: ["def _tand(x):\n    return math.tan(math.radians(x))"],
  _asind: ["def _asind(x):\n    return math.degrees(math.asin(x))"],
  _acosd: ["def _acosd(x):\n    return math.degrees(math.acos(x))"],
  _atand: ["def _atand(x):\n    return math.degrees(math.atan(x))"],
  _atan2d: ["def _atan2d(y, x):\n    return math.degrees(math.atan2(y, x))"],
  _round: ["def _round(x):\n    return math.floor(x + 0.5) if x >= 0 else -math.floor(-x + 0.5)"],
  _sign: ["def _sign(x):\n    return (x > 0) - (x < 0)"],
  _range: ["def _range(a, b, s=1):\n    # OpenSCAD's [a:s:b] includes b\n    if s == 0:\n        return []\n    count = int(math.floor((b - a) / s + 1e-9)) + 1\n    return [a + i * s for i in range(max(count, 0))]"],
  _vadd: ["def _vadd(a, b):\n    # OpenSCAD adds vectors slot by slot\n    return [_vadd(x, y) for x, y in zip(a, b)] if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)) else a + b"],
  _vsub: ["def _vsub(a, b):\n    return [_vsub(x, y) for x, y in zip(a, b)] if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)) else a - b"],
  _vmul: ["def _vmul(a, b):\n    # number * vector scales it; vector * vector is the dot product\n    la, lb = isinstance(a, (list, tuple)), isinstance(b, (list, tuple))\n    if la and lb:\n        return sum(x * y for x, y in zip(a, b))\n    if la:\n        return [x * b for x in a]\n    if lb:\n        return [a * y for y in b]\n    return a * b"],
  _vdiv: ["def _vdiv(a, b):\n    return [x / b for x in a] if isinstance(a, (list, tuple)) else a / b"],
  _norm: ["def _norm(v):\n    return math.sqrt(sum(x * x for x in v))"],
  _cross: ["def _cross(a, b):\n    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]"],
  _concat: ["def _concat(*parts):\n    out = []\n    for p in parts:\n        out += list(p) if isinstance(p, (list, tuple)) else [p]\n    return out"],
  _str: ["def _str(*parts):\n    return \"\".join(str(p) for p in parts)"],
  _rands: ["def _rands(lo, hi, n, seed=None):\n    r = random.Random(seed)\n    return [r.uniform(lo, hi) for _ in range(n)]", ["random"]],
  _xyz: ["def _xyz(v):\n    # pad a 2D or 3D vector out to x, y, z\n    return (list(v) + [0, 0, 0])[:3]"],
  _sz: ["def _sz(v):\n    # a size can be one number or a list\n    return [v, v, v] if not isinstance(v, (list, tuple)) else (list(v) + [1, 1, 1])[:3]"],
  _rgb: ["def _rgb(c):\n    # OpenSCAD colors are 0 to 1; make \"#rrggbb\"\n    return \"#%02x%02x%02x\" % tuple(max(0, min(255, round(x * 255))) for x in c[:3])"],
  _flat: ["def _flat(points, dx=0, dy=0, sx=1, sy=1):\n    # [[x, y], ...] -> x, y, x, y, ... (what Polygon wants), moved and scaled\n    out = []\n    for p in points:\n        out += [p[0] * sx + dx, p[1] * sy + dy]\n    return out"],
  _scalepts: ["def _scalepts(points, sx, sy, sz):\n    return [[p[0] * sx, p[1] * sy, p[2] * sz] for p in points]"],
  _flip: ["def _flip(faces):\n    # OpenSCAD lists a face clockwise from outside; Python 3D wants the other way round\n    return [list(reversed(f)) for f in faces]"],
  _empty: ["def _empty():\n    # a loop or if that made nothing\n    s = Box(0.001, 0.001, 0.001)\n    s.visible = False\n    return s"],
  _group: ["def _group(items):\n    items = list(items)\n    if not items:\n        return _empty()\n    return items[0] if len(items) == 1 else union(*items)", ["_empty"]],
  _mods: ["def _mods(s, **flags):\n    # OpenSCAD's % # ! modifiers\n    for k, v in flags.items():\n        setattr(s, k, v)\n    return s"],
  _paint: ["def _paint(x, color, alpha=1):\n    # color() colors every part that has no color of its own yet\n    def go(node):\n        if node.get(\"fill\") is None and not node.get(\"hole\"):\n            node[\"fill\"] = color\n            node[\"opacity\"] = round(alpha * 100)\n        for c in node.get(\"children\", []):\n            go(c)\n        if \"base\" in node:\n            go(node[\"base\"])\n        for c in node.get(\"subtract\", []):\n            go(c)\n        if \"child\" in node:\n            go(node[\"child\"])\n    for s in (x if isinstance(x, (list, tuple)) else [x]):\n        go(s.data)\n    return x"],
};

const PYRESERVED = new Set(("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield " +
  "Box Cylinder Rect Circle RegularPolygon Polygon Polyhedron Oval Star Label Solid extrude linear_extrude rotate_extrude translate rotate union difference intersection " +
  "math random struct base64 json range len list str min max abs sum round print int float pow dict set tuple map filter sorted reversed any all enumerate zip chr ord bool isinstance type id SEGMENTS").split(" "));

const MATH = {
  sin: "_sind", cos: "_cosd", tan: "_tand", asin: "_asind", acos: "_acosd", atan: "_atand", atan2: "_atan2d",
  sqrt: "math.sqrt", abs: "abs", sign: "_sign", floor: "math.floor", ceil: "math.ceil", round: "_round", pow: "pow",
  exp: "math.exp", ln: "math.log", log: "math.log10", min: "min", max: "max", len: "len", norm: "_norm", cross: "_cross",
  concat: "_concat", str: "_str", chr: "chr", ord: "ord", rands: "_rands",
};
const NUMERIC_FN = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sqrt", "abs", "sign", "floor", "ceil", "round", "pow", "exp", "ln", "log", "min", "max", "len", "norm"]);
const IS_FN = { is_undef: "(%s is None)", is_list: "isinstance(%s, (list, tuple))", is_num: "isinstance(%s, (int, float))", is_string: "isinstance(%s, str)", is_bool: "isinstance(%s, bool)" };

const POSITIONAL = {
  cube: ["size", "center"], sphere: ["r"], cylinder: ["h", "r1", "r2", "center"], polyhedron: ["points", "faces", "convexity"],
  square: ["size", "center"], circle: ["r"], polygon: ["points", "paths"], text: ["text", "size"],
  translate: ["v"], rotate: ["a", "v"], scale: ["v"], mirror: ["v"], color: ["c", "alpha"],
  linear_extrude: ["height", "center", "convexity", "twist", "slices", "scale"], rotate_extrude: ["angle", "convexity"],
};
const PASS_THROUGH = new Set(["hull", "minkowski", "offset", "resize", "multmatrix", "projection", "render", "group"]);
const ZERO_CHILD = new Set(["import", "surface"]);

// ---------------------------------------------------------------- converter
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(10)));
const isNum = (e) => e && e.k === "num";
const numVal = (e) => (isNum(e) ? e.n : e && e.k === "un" && e.op === "-" && isNum(e.e) ? -e.e.n : e && e.k === "un" && e.op === "+" ? numVal(e.e) : null);
const one = num(1, "1"), zero = num(0, "0");
const bin = (op, l, r) => ({ k: "bin", op, l, r });
function mul(a, b) {
  const x = numVal(a), y = numVal(b);
  if (x !== null && y !== null) return num(x * y);
  if (x === 1) return b; if (y === 1) return a;
  if (x === 0 || y === 0) return zero;
  return bin("*", a, b);
}
function add(a, b) {
  const x = numVal(a), y = numVal(b);
  if (x !== null && y !== null) return num(x + y);
  if (x === 0) return b; if (y === 0) return a;
  if (y !== null && a.k === "bin" && a.op === "-" && numVal(a.r) !== null) { const k = numVal(a.r) - y; return k === 0 ? a.l : k > 0 ? bin("-", a.l, num(k)) : bin("+", a.l, num(-k)); }
  return bin("+", a, b);
}
const half = (a) => (numVal(a) !== null ? num(numVal(a) / 2) : bin("/", a, num(2)));
const neg = (a) => (numVal(a) !== null ? num(-numVal(a)) : { k: "un", op: "-", e: a });

class Converter {
  constructor(src, name) {
    this.src = src; this.name = name;
    this.lines = []; this.ind = 0; this.tmp = 0; this.depth = 0;
    this.notes = []; this.helpers = new Set(); this.imports = new Set(["math"]);
    this.userMods = new Map(); this.userFns = new Set();
    this.kinds = new Map(); this.ints = new Set();
  }

  // ---- output
  emit(s) { this.lines.push("    ".repeat(this.ind) + s); }
  note(msg) { if (!this.notes.includes(msg)) this.notes.push(msg); this.emit("# NOTE: " + msg); }
  quietNote(msg) { if (!this.notes.includes(msg)) this.notes.push(msg); }
  use(h) { if (this.helpers.has(h)) return; this.helpers.add(h); for (const d of HELPERS[h][1] || []) { if (HELPERS[d]) this.use(d); else this.imports.add(d); } }
  fresh(prefix) { return `${prefix}${++this.tmp}`; }
  py(n) { if (n[0] === "$") return "_" + n.slice(1); return PYRESERVED.has(n) ? n + "_" : n; }
  withBody(f) { this.ind++; const mark = this.lines.length; f(); if (this.lines.length === mark) this.emit("pass"); this.ind--; }

  // ---- kinds of expression (a number, a vector, or not known), for vector arithmetic and range()
  kindOf(e) {
    switch (e.k) {
      case "num": return "num";
      case "vec": case "range": return "vec";
      case "str": return "str";
      case "id": return this.kinds.get(e.name) || "?";
      case "un": return e.op === "!" ? "num" : this.kindOf(e.e);
      case "bin": {
        if (["==", "!=", "<", ">", "<=", ">=", "&&", "||"].includes(e.op)) return "num";
        const a = this.kindOf(e.l), b = this.kindOf(e.r);
        if (a === "vec" || b === "vec") return "vec";
        return a === "num" && b === "num" ? "num" : "?";
      }
      case "tern": { const a = this.kindOf(e.a), b = this.kindOf(e.b); return a === b ? a : "?"; }
      case "call": return NUMERIC_FN.has(e.name) && !this.userFns.has(e.name) ? "num" : (e.name === "cross" || e.name === "concat") ? "vec" : "?";
      case "mem": return "num";
      case "let": return this.kindOf(e.e);
      default: return "?";
    }
  }
  intish(e) {
    const v = numVal(e);
    if (v !== null) return Number.isInteger(v);
    if (e.k === "id") return this.ints.has(e.name);
    if (e.k === "bin" && ["+", "-", "*"].includes(e.op)) return this.intish(e.l) && this.intish(e.r);
    return false;
  }
  noteKind(name, e) {
    this.kinds.set(name, this.kindOf(e));
    if (this.intish(e)) this.ints.add(name); else this.ints.delete(name);
  }

  // ---- expressions
  ex(n, min = 0) { const [s, p] = this.exp(n); return p < min ? `(${s})` : s; }
  exp(n) {
    switch (n.k) {
      case "num": return [n.raw !== undefined ? this.numRaw(n.raw) : fmt(n.n), 10];
      case "str": return [JSON.stringify(n.v), 10];
      case "lit": return [n.v, 10];
      case "raw": return [n.s, 10];
      case "id": return [this.idEx(n.name), 10];
      case "vec": return [this.vecEx(n), 10];
      case "range": return [this.rangeEx(n), 10];
      case "un":
        if (n.op === "!") return [`not ${this.ex(n.e, 4)}`, 4];
        if (n.op === "+") return this.exp(n.e);
        return [`-${this.ex(n.e, 8)}`, 8];
      case "bin": return this.binEx(n);
      case "tern": return [`(${this.ex(n.a)} if ${this.ex(n.c)} else ${this.ex(n.b)})`, 10];
      case "call": return [this.callEx(n), 10];
      case "idx": return [`${this.ex(n.e, 10)}[${this.ex(n.i)}]`, 10];
      case "mem": { const i = { x: 0, y: 1, z: 2 }[n.m]; if (i === undefined) { this.quietNote(`.${n.m} is not supported`); return [`${this.ex(n.e, 10)}.${n.m}`, 10]; } return [`${this.ex(n.e, 10)}[${i}]`, 10]; }
      case "let": { // let (a = 1, b = a + 1) expr  ->  nested lambdas
        let s = this.ex(n.e);
        for (let i = n.assigns.length - 1; i >= 0; i--) {
          s = `(lambda ${this.py(n.assigns[i].name)}: ${s})(${this.ex(n.assigns[i].e)})`;
        }
        return [s, 10];
      }
      default: return ["None", 10];
    }
  }
  numRaw(r) { return /^\d+$/.test(r) ? r : fmt(parseFloat(r)); }
  idEx(name) {
    if (name === "PI") return "math.pi";
    if (name === "$fn") return "SEGMENTS";
    if (name === "$t") return "0";
    if (name === "$preview") return "True";
    if (name === "$children") return "len(_children)";
    if (name[0] === "$") this.quietNote(`${name} is not used by Python 3D`);
    return this.py(name);
  }
  binEx(n) {
    const op = n.op;
    if (["+", "-", "*", "/"].includes(op) && (this.kindOf(n.l) === "vec" || this.kindOf(n.r) === "vec")) {
      const h = { "+": "_vadd", "-": "_vsub", "*": "_vmul", "/": "_vdiv" }[op];
      this.use(h); return [`${h}(${this.ex(n.l)}, ${this.ex(n.r)})`, 10];
    }
    if (op === "%") return [`math.fmod(${this.ex(n.l)}, ${this.ex(n.r)})`, 10];
    if (op === "^") return [`${this.ex(n.l, 10)} ** ${this.ex(n.r, 8)}`, 9];
    const table = { "||": ["or", 2], "&&": ["and", 3], "==": ["==", 5], "!=": ["!=", 5], "<": ["<", 5], ">": [">", 5], "<=": ["<=", 5], ">=": [">=", 5], "+": ["+", 6], "-": ["-", 6], "*": ["*", 7], "/": ["/", 7] };
    const [pyop, p] = table[op];
    const cmp = p === 5;
    return [`${this.ex(n.l, cmp ? p + 1 : p)} ${pyop} ${this.ex(n.r, p + 1)}`, p];
  }
  vecEx(n) {
    if (!n.items.some((i) => i.gen)) return `[${n.items.map((i) => this.ex(i)).join(", ")}]`;
    if (n.items.length === 1) return this.genEx(n.items[0]);
    this.use("_concat");
    return `_concat(${n.items.map((i) => (i.gen ? this.genEx(i) : `[${this.ex(i)}]`)).join(", ")})`;
  }
  genEx(g) { const { clauses, elt } = this.gen(g); return `[${elt}${clauses.map((c) => " " + c).join("")}]`; }
  gen(g) { // a generator as list-comprehension pieces
    if (!g.gen) return { clauses: [], elt: this.ex(g) };
    if (g.gen === "for") {
      const clauses = g.vars.map((v) => `for ${this.py(v.name)} in ${this.iterEx(v.e)}`);
      const inner = this.gen(g.body); return { clauses: [...clauses, ...inner.clauses], elt: inner.elt };
    }
    if (g.gen === "if") {
      if (g.b) { const a = this.gen(g.a), b = this.gen(g.b); return { clauses: [...a.clauses, ...b.clauses], elt: `(${a.elt} if ${this.ex(g.c)} else ${b.elt})` }; }
      const inner = this.gen(g.a); return { clauses: [`if ${this.ex(g.c)}`, ...inner.clauses], elt: inner.elt };
    }
    if (g.gen === "each") { const v = this.fresh("_e"); return { clauses: [`for ${v} in ${this.ex(g.e)}`], elt: v }; }
    if (g.gen === "let") { const inner = this.gen(g.body); return { clauses: [...g.assigns.map((a) => `for ${this.py(a.name)} in [${this.ex(a.e)}]`), ...inner.clauses], elt: inner.elt }; }
    return { clauses: [], elt: "None" };
  }
  iterEx(e) { return this.ex(e); }
  rangeEx(r) {
    const stepV = r.s ? numVal(r.s) : 1;
    if (this.intish(r.a) && this.intish(r.b) && (!r.s || (stepV !== null && Number.isInteger(stepV) && stepV !== 0))) {
      const stop = stepV < 0 ? add(r.b, num(-1)) : add(r.b, one);
      const parts = [this.ex(r.a), this.ex(stop)]; if (r.s) parts.push(this.ex(r.s));
      return `range(${parts.join(", ")})`;
    }
    this.use("_range");
    return `_range(${[r.a, r.b, r.s].filter(Boolean).map((x) => this.ex(x)).join(", ")})`;
  }
  argStr(args) { return args.map((a) => (a.name ? `${this.py(a.name)}=${this.ex(a.e)}` : this.ex(a.e))).join(", "); }
  callEx(n) {
    const name = n.name;
    if (this.userFns.has(name)) return `${this.py(name)}(${this.argStr(n.args)})`;
    if (IS_FN[name]) return IS_FN[name].replace("%s", this.ex(n.args[0].e));
    if (MATH[name]) { const f = MATH[name]; if (f.startsWith("_")) this.use(f); return `${f}(${this.argStr(n.args)})`; }
    this.quietNote(`the function ${name}() is not available in Python 3D`);
    return `${this.py(name)}(${this.argStr(n.args)})`;
  }

  // ---- statements
  emitAssign(s) {
    const { name, e } = s;
    if (name === "$fn") {
      if (numVal(e) === 0) return;
      if (this.depth === 0) { this.emit(`SEGMENTS = ${this.ex(e)}`); return; }
      this.note("$fn set inside a module or block is ignored; set it once at the top"); return;
    }
    if (name === "$fa" || name === "$fs") { this.emit(`# ${name} = ${this.ex(e)}   (Python 3D smooths curves with SEGMENTS instead)`); return; }
    if (name === "$t") { this.emit("# $t (animation) is not available"); return; }
    this.emit(`${this.py(name)} = ${this.ex(e)}`);
    this.noteKind(name, e);
  }
  emitDefs(stmts) { for (const s of stmts) if (s.k === "module") this.emitModule(s); else if (s.k === "function") this.emitFunction(s); }
  emitFunction(s) {
    const saved = [new Map(this.kinds), new Set(this.ints)];
    for (const p of s.params) { this.kinds.set(p.name, p.def ? this.kindOf(p.def) : "?"); this.ints.delete(p.name); }
    this.emit(`def ${this.py(s.name)}(${s.params.map((p) => `${this.py(p.name)}=${p.def ? this.ex(p.def) : "None"}`).join(", ")}):`);
    this.ind++; this.emit(`return ${this.ex(s.e)}`); this.ind--;
    [this.kinds, this.ints] = saved;
  }
  emitModule(s) {
    const saved = [new Map(this.kinds), new Set(this.ints)];
    for (const p of s.params) { this.kinds.set(p.name, p.def ? this.kindOf(p.def) : "?"); this.ints.delete(p.name); }
    const ps = s.params.filter((p) => p.name[0] !== "$").map((p) => `${this.py(p.name)}=${p.def ? this.ex(p.def) : "None"}`);
    this.emit(`def ${this.py(s.name)}(${[...ps, "_children=()"].join(", ")}):`);
    this.depth++; this.ind++;
    const out = this.fresh("_r");
    this.emit(`${out} = []`);
    for (const st of s.body) this.stmt(st, out, {});
    this.emit(`return ${out}`);
    this.ind--; this.depth--;
    [this.kinds, this.ints] = saved;
    this.emit("");
  }
  // One statement. `sink` is null (draw it where it stands) or the name of a list to add to.
  stmt(s, sink, ctx) {
    if (!s) return;
    switch (s.k) {
      case "assign": this.emitAssign(s); return;
      case "module": case "function": this.emitDefs([s]); return;
      case "incl": this.note(`${s.text} is not available here; paste the library code into your file first`); return;
      case "mod": if (s.m === "*") return; break;
      case "block": for (const c of s.body) this.stmt(c, sink, ctx); return;
      case "let":
        for (const a of s.assigns) this.emitAssign({ name: a.name, e: a.e });
        for (const c of s.body) this.stmt(c, sink, ctx); return;
      case "for":
        if (s.inter) break;
        this.forLoop(s, 0, () => { for (const c of s.body) this.stmt(c, sink, ctx); }); return;
      case "if": this.ifStmt(s, sink, ctx, false); return;
      case "call":
        if (s.name === "echo") { this.emit(`print(${this.argStr(s.args)})`); for (const c of s.children || []) this.stmt(c, sink, ctx); return; }
        if (s.name === "assert") { for (const c of s.children || []) this.stmt(c, sink, ctx); return; }
        if (this.userMods.has(s.name)) { const v = this.val(s, ctx); this.put(v, sink); return; }
        break;
      default: break;
    }
    const v = this.val(s, ctx);
    if (v) this.put(v, sink);
  }
  put(v, sink) {
    if (!v) return;
    if (sink) this.emit(v.many ? `${sink}.extend(${v.expr})` : `${sink}.append(${v.expr})`);
    else if (!v.many || !/^_r\d+$/.test(v.expr)) this.emit(v.expr);
  }
  forLoop(s, i, body) {
    const v = s.vars[i];
    if (v.e.k === "vec" && v.e.items.length && v.e.items.every((x) => !x.gen && x.k === "vec")) this.kinds.set(v.name, "vec");
    else if (v.e.k === "range") { this.kinds.set(v.name, "num"); if (this.intish(v.e.a) && (!v.e.s || this.intish(v.e.s))) this.ints.add(v.name); else this.ints.delete(v.name); }
    else this.kinds.set(v.name, "?");
    this.emit(`for ${this.py(v.name)} in ${this.iterEx(v.e)}:`);
    this.withBody(() => { if (i + 1 < s.vars.length) this.forLoop(s, i + 1, body); else body(); });
  }
  ifStmt(s, sink, ctx, isElif) {
    this.emit(`${isElif ? "elif" : "if"} ${this.ex(s.c)}:`);
    this.withBody(() => { for (const c of s.then) this.stmt(c, sink, ctx); });
    if (s.else) {
      if (s.else.length === 1 && s.else[0].k === "if") this.ifStmt(s.else[0], sink, ctx, true);
      else { this.emit("else:"); this.withBody(() => { for (const c of s.else) this.stmt(c, sink, ctx); }); }
    }
  }

  // The children of a statement as single shapes (each child or group of children is one shape).
  kids(stmts, ctx) {
    const out = [];
    for (const c of stmts || []) {
      if (!c) continue;
      if (c.k === "assign" || c.k === "module" || c.k === "function" || c.k === "incl" || (c.k === "call" && (c.name === "echo" || c.name === "assert"))) { this.stmt(c, null, ctx); continue; }
      const v = this.val(c, ctx); if (v) out.push(this.single(v));
    }
    return out;
  }
  single(v) { if (!v.many) return v.expr; this.use("_group"); return `_group(${v.expr})`; }
  union(items) { return items.length === 0 ? null : items.length === 1 ? items[0] : `union(${items.join(", ")})`; }
  // collect a statement that makes several shapes (for, if) into a list
  collect(s, ctx) {
    const tmp = this.fresh("_r"); this.emit(`${tmp} = []`);
    this.stmt(s, tmp, ctx);
    return { expr: tmp, many: true };
  }

  // A statement as a Python expression that makes shapes. Returns { expr, many } or null.
  val(s, ctx) {
    switch (s.k) {
      case "mod": {
        if (s.m === "*") return null;
        const v = this.val(s.s, ctx); if (!v) return null;
        this.use("_mods");
        const flag = { "%": "background", "#": "debug", "!": "show_only" }[s.m];
        return { expr: `_mods(${this.single(v)}, ${flag}=True)`, many: false };
      }
      case "block": { const u = this.union(this.kids(s.body, ctx)); return u ? { expr: u, many: false } : null; }
      case "let": { for (const a of s.assigns) this.emitAssign({ name: a.name, e: a.e }); const u = this.union(this.kids(s.body, ctx)); return u ? { expr: u, many: false } : null; }
      case "for":
        if (s.inter) {
          const tmp = this.fresh("_r"); this.emit(`${tmp} = []`);
          this.forLoop(s, 0, () => { for (const c of s.body) this.stmt(c, tmp, ctx); });
          return { expr: `intersection(*${tmp})`, many: false };
        }
        return this.collect(s, ctx);
      case "if": return this.collect(s, ctx);
      case "call": return this.callVal(s, ctx);
      default: return null;
    }
  }

  // ---- arguments of the built-in shapes
  getArgs(call) {
    const pos = POSITIONAL[call.name] || [];
    const a = {}; let i = 0;
    for (const arg of call.args) {
      if (arg.name) a[arg.name] = arg.e;
      else if (i < pos.length) a[pos[i++]] = arg.e;
    }
    return a;
  }
  // [x, y, z] nodes of a vector argument (fill = what a missing slot becomes)
  dims(node, n, fill) {
    if (!node) return Array(n).fill(fill);
    if (node.k === "vec" && !node.items.some((i) => i.gen)) return Array.from({ length: n }, (_, i) => node.items[i] || fill);
    const kind = this.kindOf(node);
    if (kind === "num") return Array(n).fill(node);
    if (kind === "vec") return Array.from({ length: n }, (_, i) => ({ k: "raw", s: `${this.ex(node, 10)}[${i}]` }));
    this.use("_sz");
    return Array.from({ length: n }, (_, i) => ({ k: "raw", s: `_sz(${this.ex(node)})[${i}]` }));
  }
  // scale as x, y, z nodes (rotate_extrude: x is the radius, z is the height)
  sc(ctx) { const s = ctx.scale || [one, one, one]; return { x: s[0], y: s[1], z: s[2] }; }
  seg(a) { const f = a.$fn; return f && numVal(f) !== 0 ? `segments=${this.ex(f)}` : ""; }

  // 2D shape as a Python profile expression (moved by ctx.off when revolving)
  profile(call, ctx) {
    const a = this.getArgs(call), { x: sx, y: sy0, z: sz } = this.sc(ctx);
    const sy = ctx.rev ? sz : sy0;
    const off = ctx.off || [zero, zero];
    const A = (n) => this.ex(n);
    if (call.name === "square") {
      const [w, h] = this.dims(a.size || num(1), 2, one);
      const W = mul(w, sx), H = mul(h, sy), centered = a.center && a.center.k === "lit" && a.center.v === "True";
      const left = centered ? add(off[0], neg(half(W))) : off[0], top = centered ? add(off[1], neg(half(H))) : off[1];
      return `Rect(${A(left)}, ${A(top)}, ${A(W)}, ${A(H)})`;
    }
    if (call.name === "circle") {
      const r = a.r || (a.d ? half(a.d) : one);
      if (this.ex(sx) !== this.ex(sy)) this.note("a circle scaled differently in x and y is drawn with the x scale (Python 3D has no ellipse to extrude)");
      const seg = this.seg(a);
      return `Circle(${A(off[0])}, ${A(off[1])}, ${A(mul(r, sx))}${seg ? ", " + seg : ""})`;
    }
    if (call.name === "polygon") {
      const pts = a.points;
      if (a.paths) this.note("polygon paths (holes) are ignored; only the outer points are used");
      if (!pts) return "Polygon(0, 0, 1, 0, 0, 1)";
      if (pts.k === "vec" && pts.items.length >= 3 && pts.items.every((p) => p.k === "vec" && p.items.length === 2 && !p.items.some((q) => q.gen))) {
        const coords = pts.items.flatMap((p) => [add(mul(p.items[0], sx), off[0]), add(mul(p.items[1], sy), off[1])]);
        return `Polygon(${coords.map(A).join(", ")})`;
      }
      this.use("_flat");
      return `Polygon(*_flat(${A(pts)}, ${A(off[0])}, ${A(off[1])}, ${A(sx)}, ${A(sy)}))`;
    }
    if (call.name === "text") {
      if (ctx.rev) this.note("text cannot be revolved");
      const t = a.text || { k: "str", v: "" };
      return `Label(${A(t)}, ${A(off[0])}, ${A(off[1])}, size=${A(mul(a.size || num(10), sx))})`;
    }
    return "None";
  }
  // a 2D leaf in whatever mode we are in: extruded, revolved, or standing alone as a flat slab
  leaf2d(call, ctx) {
    const p = this.profile(call, ctx);
    if (ctx.ext) {
      const h = ctx.ext.h;
      if (ctx.sub) return ctx.ext.center ? `extrude(${p}, ${this.ex(add(h, num(0.02)))}, center=True)` : `extrude(${p}, ${this.ex(add(h, num(0.02)))}, z=-0.01)`;
      return `extrude(${p}, ${this.ex(h)}${ctx.ext.center ? ", center=True" : ""})`;
    }
    if (ctx.rev) return `rotate_extrude(${p}${ctx.rev.angle ? ", angle=" + this.ex(ctx.rev.angle) : ""}${ctx.rev.seg ? ", " + ctx.rev.seg : ""})`;
    return p;
  }

  callVal(s, ctx) {
    const name = s.name, a = this.getArgs(s), S = this.sc(ctx);
    const A = (n) => this.ex(n);
    const one1 = (expr) => ({ expr, many: false });
    const hasKids = s.children && s.children.length;
    const flag = (n) => n && n.k === "lit" && n.v === "True";

    // ---- user modules
    if (this.userMods.has(name)) {
      if (ctx.scale) this.note(`scale() around the module ${name}() is not applied`);
      const named = s.args.filter((x) => !(x.name && x.name[0] === "$"));
      if (named.length !== s.args.length) this.quietNote(`${name}(): $fn and other $ settings are not passed to modules; set SEGMENTS at the top instead`);
      let kidArg = "";
      if (hasKids) {
        const ks = [];
        for (const c of s.children) {
          if (c.k === "assign" || c.k === "module" || c.k === "function") { this.stmt(c, null, ctx); continue; }
          const k = this.fresh("_k");
          this.emit(`def ${k}():`);
          this.withBody(() => { const v = this.val(c, ctx); this.emit(v ? `return ${this.single(v)}` : "return _empty()"); if (!v) this.use("_empty"); });
          ks.push(k);
        }
        kidArg = `_children=[${ks.join(", ")}]`;
      }
      const args = [this.argStr(named), kidArg].filter(Boolean).join(", ");
      return { expr: `${this.py(name)}(${args})`, many: true };
    }

    switch (name) {
      case "children": {
        if (!s.args.length) return { expr: "[k() for k in _children]", many: true };
        const e = s.args[0].e;
        return one1(`_children[${A(e)}]()`);
      }
      case "cube": {
        const [w, d, h] = this.dims(a.size || one, 3, one);
        const c = flag(a.center);
        return one1(`Box(${A(mul(w, S.x))}, ${A(mul(d, S.y))}, ${A(mul(h, S.z))}${c ? ", center=True" : ', align="left-bottom"'})`);
      }
      case "cylinder": {
        const H = mul(a.h || one, S.z);
        let r1 = a.r1 || (a.d1 && half(a.d1)), r2 = a.r2 || (a.d2 && half(a.d2));
        const r = a.r || (a.d && half(a.d));
        if (r) { r1 = r1 || r; r2 = r2 || r; }
        r1 = r1 || one; r2 = r2 || one;
        if (this.ex(S.x) !== this.ex(S.y)) this.note("a cylinder scaled differently in x and y is drawn with the x scale");
        const R1 = mul(r1, S.x), R2 = mul(r2, S.x), seg = this.seg(a), c = flag(a.center);
        if (this.ex(R1) === this.ex(R2)) return one1(`Cylinder(${A(R1)}, ${A(H)}${c ? ", center=True" : ""}${seg ? ", " + seg : ""})`);
        // a cone: revolve a trapezoid
        const z0 = c ? neg(half(H)) : zero, z1 = c ? half(H) : H;
        const pts = [[zero, z0]];
        if (numVal(R1) !== 0) pts.push([R1, z0]);
        if (numVal(R2) !== 0) pts.push([R2, z1]);
        pts.push([zero, z1]);
        return one1(`rotate_extrude(Polygon(${pts.flatMap((p) => p).map(A).join(", ")})${seg ? ", " + seg : ""})`);
      }
      case "sphere": {
        const r = a.r || (a.d ? half(a.d) : one);
        if (this.ex(S.x) !== this.ex(S.z) || this.ex(S.x) !== this.ex(S.y)) this.note("a sphere scaled differently in x, y and z is drawn with the x scale (Python 3D has no ellipsoid)");
        const seg = this.seg(a), R = A(mul(r, S.x));
        return one1(`rotate_extrude(Circle(0, 0, ${R}${seg ? ", " + seg : ""})${seg ? ", " + seg : ""})`);
      }
      case "polyhedron": {
        const pts = a.points, faces = a.faces || a.triangles;
        if (!pts || !faces) return null;
        this.use("_flip");
        let P = A(pts);
        if (ctx.scale) { this.use("_scalepts"); P = `_scalepts(${P}, ${A(S.x)}, ${A(S.y)}, ${A(S.z)})`; }
        return one1(`Polyhedron(points=${P}, faces=_flip(${A(faces)}))`);
      }
      case "square": case "circle": case "polygon": case "text": return one1(this.leaf2d(s, ctx));
      case "translate": case "rotate": case "mirror": case "color": case "scale": return this.transformVal(s, ctx);
      case "union": { const u = this.union(this.kids(s.children, ctx)); return u ? one1(u) : null; }
      case "difference": case "intersection": {
        const items = [];
        let first = true;
        for (const c of s.children || []) {
          if (c.k === "assign" || c.k === "module" || c.k === "function") { this.stmt(c, null, ctx); continue; }
          const c2 = name === "difference" && !first && ctx.ext ? { ...ctx, sub: true } : ctx;
          const v = this.val(c, c2); if (v) { items.push(this.single(v)); first = false; }
        }
        if (!items.length) return null;
        return one1(items.length === 1 ? items[0] : `${name}(${items.join(", ")})`);
      }
      case "linear_extrude": {
        if (a.twist && numVal(a.twist) !== 0) this.note("linear_extrude twist is not supported; extruded straight");
        if (a.scale && numVal(a.scale) !== 1) this.note("linear_extrude scale is not supported; extruded straight");
        const ctx2 = { ...ctx, ext: { h: mul(a.height || num(100), S.z), center: flag(a.center) }, rev: null, sub: false };
        const u = this.union(this.kids(s.children, ctx2)); return u ? one1(u) : null;
      }
      case "rotate_extrude": {
        const ang = a.angle && numVal(a.angle) !== 360 ? a.angle : null;
        const ctx2 = { ...ctx, rev: { angle: ang, seg: this.seg(a) }, ext: null, off: [zero, zero] };
        const u = this.union(this.kids(s.children, ctx2)); return u ? one1(u) : null;
      }
      default: break;
    }
    if (PASS_THROUGH.has(name)) {
      if (name === "render" || name === "group") { const u = this.union(this.kids(s.children, ctx)); return u ? one1(u) : null; }
      this.note(`${name}() is not available in Python 3D; its shapes are put together with union() instead`);
      const u = this.union(this.kids(s.children, ctx)); return u ? one1(u) : null;
    }
    if (ZERO_CHILD.has(name)) { this.note(`${name}() is not available in Python 3D and was left out`); return null; }
    this.note(`${name}() is not known to this converter and was left out`);
    this.kids(s.children, ctx);
    return null;
  }

  // translate, rotate, scale, mirror, color: compile the children under the right context, then wrap
  transformVal(s, ctx) {
    const name = s.name, a = this.getArgs(s), A = (n) => this.ex(n);
    const wrapKids = (ctx2) => this.union(this.kids(s.children, ctx2));
    if (name === "scale") {
      const base = this.sc(ctx);
      const [x, y, z] = this.dims(a.v || one, 3, one);
      const ctx2 = { ...ctx, scale: [mul(base.x, x), mul(base.y, y), mul(base.z, z)] };
      const u = wrapKids(ctx2); return u ? { expr: u, many: false } : null;
    }
    if (name === "translate") {
      const S = this.sc(ctx);
      const v = a.v || zero;
      if (ctx.rev) { // moving a profile before it is revolved
        const [x, y] = this.dims(v, 2, zero), off = ctx.off || [zero, zero];
        const ctx2 = { ...ctx, off: [add(off[0], mul(x, S.x)), add(off[1], mul(y, S.z))] };
        const u = wrapKids(ctx2); return u ? { expr: u, many: false } : null;
      }
      const u = wrapKids(ctx); if (!u) return null;
      if (v.k === "vec" && !v.items.some((i) => i.gen) && v.items.length >= 2 && v.items.length <= 3) {
        const comps = [0, 1, 2].map((i) => mul(v.items[i] || zero, [S.x, S.y, S.z][i]));
        const parts = ["x", "y", "z"].map((n, i) => (numVal(comps[i]) === 0 ? null : `${n}=${A(comps[i])}`)).filter(Boolean);
        return { expr: parts.length ? `translate(${u}, ${parts.join(", ")})` : u, many: false };
      }
      this.use("_xyz");
      let vv = A(v);
      if (ctx.scale) { this.use("_vmul"); vv = `[${["x", "y", "z"].map((_, i) => `_xyz(${vv})[${i}] * ${A([S.x, S.y, S.z][i])}`).join(", ")}]`; }
      return { expr: `translate(${u}, *_xyz(${vv}))`, many: false };
    }
    if (name === "rotate") {
      if (ctx.rev) { this.note("rotate() inside rotate_extrude is not supported; shape left unrotated"); const u = wrapKids(ctx); return u ? { expr: u, many: false } : null; }
      if (ctx.scale && (this.ex(ctx.scale[0]) !== this.ex(ctx.scale[1]) || this.ex(ctx.scale[1]) !== this.ex(ctx.scale[2]))) this.note("rotate() inside a scale() that is not the same in x, y and z may come out slightly different");
      const u = wrapKids(ctx); if (!u) return null;
      const ang = a.a || zero;
      if (a.v) { // rotate(a, v = axis)
        const v = a.v; let axis = A(v);
        if (v.k === "vec" && v.items.length === 3) {
          const t = v.items.map(numVal);
          if (t[0] === 1 && t[1] === 0 && t[2] === 0) axis = '"x"'; else if (t[0] === 0 && t[1] === 1 && t[2] === 0) axis = '"y"'; else if (t[0] === 0 && t[1] === 0 && t[2] === 1) axis = '"z"';
        }
        return { expr: `rotate(${u}, ${A(ang)}, axis=${axis})`, many: false };
      }
      if (ang.k === "vec" && !ang.items.some((i) => i.gen)) {
        const items = [0, 1, 2].map((i) => ang.items[i] || zero);
        if (items.every((x) => numVal(x) === 0)) return { expr: u, many: false };
        return { expr: `rotate(${u}, [${items.map(A).join(", ")}])`, many: false };
      }
      if (numVal(ang) === 0) return { expr: u, many: false };
      return { expr: `rotate(${u}, ${A(ang)})`, many: false };
    }
    if (name === "mirror") {
      this.note("mirror() is not available in Python 3D; the shape is left unmirrored");
      const u = wrapKids(ctx); return u ? { expr: u, many: false } : null;
    }
    if (name === "color") {
      const u = wrapKids(ctx); if (!u) return null;
      const c = a.c; if (!c) return { expr: u, many: false };
      let col, alpha = a.alpha ? numVal(a.alpha) : null;
      if (c.k === "str") col = JSON.stringify(c.v.toLowerCase());
      else if (c.k === "vec" && c.items.length >= 3 && c.items.every((i) => numVal(i) !== null)) {
        const v = c.items.map(numVal);
        col = JSON.stringify("#" + v.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(x * 255))).toString(16).padStart(2, "0")).join(""));
        if (v.length > 3 && alpha === null) alpha = v[3];
      } else { this.use("_rgb"); col = `_rgb(${A(c)})`; }
      this.use("_paint");
      return { expr: `_paint(${u}, ${col}${alpha !== null && alpha !== 1 ? ", " + fmt(alpha) : ""})`, many: false };
    }
    return null;
  }

  // ---- whole program
  program(stmts) {
    // find every module and function first (OpenSCAD lets you use one before it is defined)
    const find = (list) => { for (const s of list || []) { if (s.k === "module") { this.userMods.set(s.name, s); find(s.body); } else if (s.k === "function") this.userFns.add(s.name); else { find(s.body); find(s.then); find(s.else); find(s.children); } } };
    find(stmts);
    const defs = stmts.filter((s) => s.k === "module" || s.k === "function");
    const assigns = stmts.filter((s) => s.k === "assign");
    const rest = stmts.filter((s) => s.k !== "module" && s.k !== "function" && s.k !== "assign");
    // OpenSCAD takes the last value of a variable for the whole file; keep the last one only
    const lastAssign = new Map(); assigns.forEach((s, i) => lastAssign.set(s.name, i));
    const usesFn = (e) => { let hit = false; const w = (n) => { if (!n || typeof n !== "object") return; if (n.k === "call" && this.userFns.has(n.name)) hit = true; for (const v of Object.values(n)) Array.isArray(v) ? v.forEach(w) : w(v); }; w(e); return hit; };
    const defsFirst = assigns.some((s) => usesFn(s.e));
    const emitAssigns = () => assigns.forEach((s, i) => { if (lastAssign.get(s.name) === i) this.emitAssign(s); else this.emit(`# (${s.name} is set again below; OpenSCAD uses the last one)`); });
    // kinds of the top-level variables are known before any module is written
    for (const s of assigns) if (s.name[0] !== "$") this.noteKind(s.name, s.e);
    if (defsFirst) { this.emitDefs(defs); emitAssigns(); } else { emitAssigns(); if (assigns.length && defs.length) this.emit(""); this.emitDefs(defs); }
    if (rest.length && (assigns.length || defs.length)) this.emit("");
    for (const s of rest) this.stmt(s, null, {});
  }
}

export function scadToPython(source, opts = {}) {
  const parser = new Parser(source);
  const stmts = parser.program();
  const cv = new Converter(source, opts.name);
  cv.program(stmts);
  const head = [`# Converted from OpenSCAD${opts.name ? ` (${opts.name})` : ""} by the OpenSCAD tool, as best it could.`];
  head.push("# Python 3D has fewer features than OpenSCAD, so read this over and fix anything that looks off.");
  if (cv.notes.length) { head.push("# What could not be converted (see the NOTE lines):"); for (const n of cv.notes) head.push(`#   - ${n}`); }
  head.push("", ...[...cv.imports].sort().map((m) => `import ${m}`));
  const helpers = Object.keys(HELPERS).filter((h) => cv.helpers.has(h)).map((h) => HELPERS[h][0]);
  const parts = [head.join("\n")];
  if (helpers.length) parts.push("# ---- small helpers that stand in for OpenSCAD built-ins\n" + helpers.join("\n\n"));
  parts.push(cv.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim());
  return { code: parts.join("\n\n") + "\n", warnings: cv.notes };
}
