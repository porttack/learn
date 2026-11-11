// OpenSCAD editor: CodeMirror 6 plus a small OpenSCAD colorer, auto-indent and
// completion. Bundled once by esbuild into ../editor.js (MIT-licensed libraries).
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { StreamLanguage, indentService, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { autocompletion, snippetCompletion, completeFromList } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { tags as t } from "@lezer/highlight";

const KEYWORDS = "module function if else for let each include use intersection_for assign".split(" ");
const ATOMS = ["true", "false", "undef", "PI"];
// name: snippet (#{} marks a tab stop). Only the common ones get a shape.
const MODULES = {
  cube: "cube([${x}, ${y}, ${z}]);", sphere: "sphere(d = ${10});", cylinder: "cylinder(d = ${10}, h = ${10});",
  polyhedron: "polyhedron(points = ${[]}, faces = ${[]});", circle: "circle(d = ${10});", square: "square([${10}, ${10}]);",
  polygon: "polygon(${[[0,0],[10,0],[0,10]]});", text: "text(\"${text}\", size = ${10});",
  translate: "translate([${0}, ${0}, ${0}])", rotate: "rotate([${0}, ${0}, ${90}])", scale: "scale([${1}, ${1}, ${1}])",
  mirror: "mirror([${1}, ${0}, ${0}])", resize: "resize([${10}, ${10}, ${10}])", multmatrix: "multmatrix(m = ${})",
  color: "color(\"${red}\")", offset: "offset(r = ${1})", hull: "hull()", minkowski: "minkowski()",
  union: "union()", difference: "difference()", intersection: "intersection()",
  linear_extrude: "linear_extrude(height = ${10})", rotate_extrude: "rotate_extrude()", projection: "projection(cut = ${true})",
  render: "render()", surface: "surface(file = \"${file.dat}\")", import: "import(\"${file.stl}\");", children: "children();",
  echo: "echo(${});", assert: "assert(${cond}, \"${message}\");",
};
const FUNCTIONS = "abs sign sin cos tan acos asin atan atan2 floor round ceil ln len let log lookup max min pow sqrt exp rands norm cross concat str chr ord search version version_num parent_module is_undef is_list is_num is_bool is_string is_function is_object".split(" ");
const SPECIAL = ["$fn", "$fa", "$fs", "$t", "$vpr", "$vpt", "$vpd", "$vpf", "$children", "$preview"];
const BUILTIN_MODULES = new Set(Object.keys(MODULES));
const FUNCS = new Set(FUNCTIONS);

const language = StreamLanguage.define({
  name: "openscad",
  startState: () => ({ block: false, afterDef: false }),
  token(stream, state) {
    if (state.block) {
      if (stream.match(/^.*?\*\//)) state.block = false; else stream.skipToEnd();
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
    if (stream.match("/*")) { state.block = true; if (stream.match(/^.*?\*\//)) state.block = false; else stream.skipToEnd(); return "comment"; }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
    if (stream.match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/)) return "number";
    if (stream.match(/^\$[A-Za-z_]\w*/)) return "variableName.special";
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const w = stream.current();
      if (state.afterDef) { state.afterDef = false; return "def"; }
      if (w === "module" || w === "function") { state.afterDef = true; return "keyword"; }
      if (KEYWORDS.includes(w)) return "keyword";
      if (ATOMS.includes(w)) return "atom";
      if (BUILTIN_MODULES.has(w) || FUNCS.has(w)) return "builtin";
      return "variableName";
    }
    if (stream.match(/^[-+*\/%^<>=!&|?:]+/)) return "operator";
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: "//", block: { open: "/*", close: "*/" } }, closeBrackets: { brackets: ["(", "[", "{", '"'] } },
  tokenTable: {},
});

// Auto-indent: two spaces per unclosed bracket, a closer lines up with its opener,
// and a lone statement under if/for/else is pushed in one more.
function stripNoise(s) { return s.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); }
const indenter = indentService.of((cx, pos) => {
  const doc = cx.state.doc, line = doc.lineAt(pos);
  // Pressing Enter asks "how far in is the NEW line", with the cursor still on the old one
  // (simulateBreak). Re indenting a line (typing a closer) asks about the line itself.
  const newLine = cx.options && cx.options.simulateBreak === pos;
  const before = stripNoise(doc.sliceString(0, newLine ? pos : line.from));
  const here = (newLine ? doc.sliceString(pos, line.to) : line.text).trim();
  let depth = 0;
  for (const ch of before) { if ("({[".includes(ch)) depth++; else if (")}]".includes(ch)) depth--; }
  if (/^[)}\]]/.test(here)) depth--;
  // a lone statement under if / for / else is pushed in one more
  let extra = 0;
  const prevLines = before.split("\n");
  while (prevLines.length && !prevLines[prevLines.length - 1].trim()) prevLines.pop();
  const p = (prevLines[prevLines.length - 1] || "").trim();
  if (/^(else\s+)?(if|for|intersection_for|let)\b.*\)$/.test(p) || p === "else" || /\belse$/.test(p)) extra = 1;
  return Math.max(0, depth + extra) * 2;
});

// Completion: built-ins with a shape, plus names defined in this file.
const staticOptions = [
  ...Object.entries(MODULES).map(([k, v]) => snippetCompletion(v.replace(/\$\{\}/g, "${}"), { label: k, type: "function", detail: "module" })),
  ...FUNCTIONS.map((f) => ({ label: f, type: "function", detail: "function", apply: f + "(" })),
  ...KEYWORDS.filter((k) => !["include", "use"].includes(k)).map((k) => ({ label: k, type: "keyword" })),
  snippetCompletion("module ${name}(${args}) {\n  ${}\n}", { label: "module", type: "keyword", detail: "define a module", boost: 2 }),
  snippetCompletion("for (${i} = [${0} : ${n} - 1]) {\n  ${}\n}", { label: "for", type: "keyword", detail: "loop", boost: 2 }),
  snippetCompletion("if (${cond}) {\n  ${}\n}", { label: "if", type: "keyword", detail: "if", boost: 2 }),
  ...ATOMS.map((a) => ({ label: a, type: "constant" })),
  ...SPECIAL.map((s) => ({ label: s, type: "variable", detail: "special" })),
];
function complete(ctx) {
  const word = ctx.matchBefore(/\$?[A-Za-z_]\w*/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  const text = ctx.state.doc.toString();
  const mine = new Map();
  for (const m of text.matchAll(/\b(module|function)\s+([A-Za-z_]\w*)/g)) mine.set(m[2], m[1] === "module" ? "module (yours)" : "function (yours)");
  for (const m of text.matchAll(/^\s*([A-Za-z_]\w*)\s*=[^=]/gm)) if (!mine.has(m[1])) mine.set(m[1], "variable");
  for (const m of text.matchAll(/\bfor\s*\(\s*([A-Za-z_]\w*)\s*=/g)) if (!mine.has(m[1])) mine.set(m[1], "variable");
  const own = [...mine].filter(([k]) => k !== word.text).map(([label, detail]) => ({
    label, detail, type: detail.startsWith("variable") ? "variable" : "function",
    apply: detail.startsWith("variable") ? undefined : label + "(", boost: 1,
  }));
  return { from: word.from, options: [...own, ...staticOptions], validFor: /^\$?\w*$/ };
}

export function createEditor(parent, doc, { onChange, onRun } = {}) {
  const view = new EditorView({
    parent, doc,
    extensions: [
      basicSetup, language, syntaxHighlighting(HighlightStyle.define([
        { tag: t.keyword, color: "#a626a4", fontWeight: "600" },
        { tag: t.atom, color: "#986801" },
        { tag: t.number, color: "#986801" },
        { tag: t.string, color: "#50a14f" },
        { tag: t.comment, color: "#8a919a", fontStyle: "italic" },
        { tag: t.operator, color: "#0184bc" },
        { tag: t.standard(t.variableName), color: "#0451a5" },
        { tag: t.special(t.variableName), color: "#c18401" },
        { tag: t.definition(t.variableName), color: "#c7254e", fontWeight: "600" },
      ])), indenter,
      autocompletion({ override: [complete] }),
      Prec.highest(keymap.of([{ key: "Mod-Enter", run: () => { onRun && onRun(); return true; } }])),
      keymap.of([indentWithTab]),
      EditorView.updateListener.of((u) => { if (u.docChanged && onChange) onChange(); }),
      EditorView.theme({ "&": { height: "100%", fontSize: "13px" }, ".cm-scroller": { fontFamily: "ui-monospace, Menlo, Consolas, monospace", lineHeight: "1.45" } }),
    ],
  });
  return {
    get: () => view.state.doc.toString(),
    set: (s) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: s } }),
    focus: () => view.focus(),
  };
}
