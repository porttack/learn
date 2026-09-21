---
layout: minimal
title: "Polyhedrons"
permalink: /python3d/polyhedrons/
---

<div class="lesson-crumbs">
  <a href="{{ '/python3d/' | relative_url }}">&larr; Python in 3D</a>
  &middot;
  <a href="{{ '/python3d/rotate-extrude/' | relative_url }}">&larr; Shapes of Revolution</a>
</div>

<div class="lesson" markdown="1">

<p class="advanced-badge">Advanced &middot; optional</p>

# Polyhedrons

This one's a bonus, same as Shapes of Revolution -- come back to it any
time. It answers a question that comes up the moment you look at
`Polyhedron` in the Cheatsheet and think "wait, what's a face, and how
is that different from a point?"

## Why Polyhedron

Every shape you've used so far is really a shortcut. `Box` is a
shortcut for "six flat rectangles, arranged into a closed box." Even
`rotate_extrude()` is a shortcut for "lots of flat panels, swept around
in a circle." Underneath, a 3D shape is always just **flat faces
meeting at corners** -- `Polyhedron` is the tool that builds that
directly, corner by corner, face by face, instead of going through a
shortcut at all.

It's also not just a classroom exercise. An exported `.stl` file --
the kind Download STL makes, the kind a 3D printer actually reads -- IS
a `Polyhedron`, whether it started that way or not: a flat list of
corners and the flat faces connecting them. By the end of this lesson
you'll know exactly what's inside one.

## Points Are Just Corners

A `Polyhedron` starts with a list of **points** -- each one just an
`(x, y, z)` corner in space, same coordinates you already know from
`Box`. The only new idea is that each point also has a **number**,
counting from 0, based on where it sits in the list.

<div class="embed" data-embed="points-list">
<textarea class="embed-code">points = [
    (0, 0, 0),   # point 0
    (2, 0, 0),   # point 1
    (1, 2, 0),   # point 2
    (1, 1, 2),   # point 3
]
for i, p in enumerate(points):
    print("point", i, "is at", p)</textarea>
</div>

Nothing draws yet -- a list of points by itself isn't a shape, any more
than four dots on a page are a drawing. That's the next piece.

<div class="quiz" data-quiz="points-are-corners" data-answer="one2">
  <p class="quiz-prompt">Using that same points list, what are the coordinates of point 2?</p>
  <div class="quiz-options quiz-options-code">
    <button class="quiz-option" data-key="one2"><code>(1, 2, 0)</code></button>
    <button class="quiz-option" data-key="two"><code>(2, 0, 0)</code></button>
    <button class="quiz-option" data-key="three"><code>(1, 1, 2)</code></button>
    <button class="quiz-option" data-key="twopoints"><code>2</code> points, since indexing starts at 0</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Faces Are Lists of Point Numbers

A **face** is a flat panel, and you build one by listing which points
trace its outline -- **by number, not by coordinates again**. Face `[0,
1, 2]` doesn't mean "a triangle at the position 0, 1, 2" -- it means
"connect point 0, then point 1, then point 2, and fill in the flat
triangle between them."

<div class="embed" data-embed="one-face">
<textarea class="embed-code">points = [
    (0, 0, 0),
    (2, 0, 0),
    (1, 2, 0),
    (1, 1, 2),
]
Polyhedron(points=points, faces=[(0, 1, 2)], fill="cornflowerblue")</textarea>
</div>

One face, one flat triangle -- literally a single panel floating in
space, using 3 of the 4 points and completely ignoring point 3. A
`Polyhedron` can have as many faces as you list, and nothing stops two
faces from sharing the same points -- in fact, sharing points along an
edge is exactly how faces fit together into a solid, which is what the
next section builds.

<div class="quiz" data-quiz="faces-are-indices" data-answer="reuse">
  <p class="quiz-prompt">A second face is added: `faces=[(0, 1, 2), (0, 1, 3)]`. What does that second face, `(0, 1, 3)`, do?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="reuse">Reuses points 0 and 1 from the first face, and adds point 3 -- a new triangle sharing one edge with the first</button>
    <button class="quiz-option" data-key="newpoints">Creates 3 brand new points, separate from the first face's</button>
    <button class="quiz-option" data-key="replaces">Replaces the first face -- only the most recent face in the list is kept</button>
    <button class="quiz-option" data-key="error">Causes an error, since point 0 and point 1 are already used</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Order Around the Face Matters (Even Though You Can't See It Here)

One more rule about a face's list: the order you name its points in
isn't arbitrary. Walk them **around the outside of the face, in one
consistent direction** -- that's what tells a face which way is "out"
and which way is "in," exactly the same idea OpenSCAD (and every real
CAD tool) uses.

Here's the honest part: in Studio's own preview, you will not be able
to see a mistake here. Every shape in this tool renders from both
sides, and this viewer is specifically built to shade a backwards face
as if it were facing you correctly -- so a face wound the wrong way
around looks completely normal on screen:

<div class="embed" data-embed="winding-compare">
<textarea class="embed-code">points = [(0, 0, 0), (2, 0, 0), (1, 2, 0), (1, 1, 2)]

correct = Polyhedron(points=points, faces=[(0, 2, 1), (0, 1, 3), (1, 2, 3), (2, 0, 3)], fill="orange")
correct.x = -2.5

backwards = Polyhedron(points=points, faces=[(0, 2, 1), (0, 3, 1), (1, 2, 3), (2, 0, 3)], fill="orange")
backwards.x = 2.5</textarea>
</div>

Run it. One face on the right copy is wound backwards (`0, 3, 1`
instead of `0, 1, 3`) -- and it looks completely identical to the
correct one. That's not a bug you're supposed to spot; it's the actual
point. **This viewer being forgiving doesn't mean winding stopped
mattering** -- it means this one tool happens to hide the mistake from
you. A `.stl` file made from those same two shapes still records the
wrong order, and not every tool that reads a `.stl` is this forgiving.

This is exactly why this Studio's own drag-and-drop STL importer can
sometimes fail to patch a small hole automatically (you'll meet that
feature in the next section): it walks a hole's boundary by following
each edge's wound direction to figure out how to close it back up, and
inconsistent winding is one of the things that can make that automatic
repair give up.

<div class="quiz" data-quiz="winding-order" data-answer="hidden">
  <p class="quiz-prompt">A face is wound backwards from its neighbors. What actually happens?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="hidden">Studio's own preview hides the mistake completely -- but the wrong order is still there in the data, and other tools that read the shape can be affected by it</button>
    <button class="quiz-option" data-key="vanish">That face disappears completely, in every tool</button>
    <button class="quiz-option" data-key="crash">Polyhedron() raises an error and refuses to build the shape</button>
    <button class="quiz-option" data-key="nothing">Nothing -- winding order is just a suggestion and never actually matters anywhere</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Building a Tetrahedron, All Together

Put it all together: the same 4 points from the start of this lesson,
wound consistently, make a complete, solid **tetrahedron** -- the
simplest possible solid made of flat faces, 4 points and 4 triangles,
nothing left open:

<div class="embed" data-embed="tetrahedron">
<textarea class="embed-code">points = [
    (0, 0, 0),
    (2, 0, 0),
    (1, 2, 0),
    (1, 1, 2),
]
faces = [
    (0, 2, 1),  # the base
    (0, 1, 3),
    (1, 2, 3),
    (2, 0, 3),
]
Polyhedron(points=points, faces=faces, fill="mediumseagreen")</textarea>
</div>

Every one of those 4 faces reuses points from the other faces -- that's
not a coincidence, it's the whole idea. A closed solid is exactly a set
of faces where every edge is shared by precisely two faces, one on each
side. Try deleting one of the four faces from the list above and
running it again: the tetrahedron springs a hole exactly where that
face used to be.

## From an STL, Automatically

This is also exactly what's happening when you drag a plain `.stl` file
-- one that doesn't have this Studio's own code saved inside it -- onto
the viewer. Every corner recorded in that file becomes a point, every
triangle becomes a face, and you get back a real, editable `Polyhedron`
call built from whatever was in the file. It won't be neat, hand-written
code like the tetrahedron above (a real model can have hundreds of
points), but it's built from exactly the same two ideas this lesson just
covered.

If the file has a small gap in its surface -- one missing face, say --
Studio tries to patch it automatically before handing you the code, by
walking the edges around the hole and filling it back in. That's the
"automatic repair" the previous section mentioned: it works by following
each edge's wound direction, so a file with genuinely inconsistent
winding is one of the ways that repair can fail and ask you to fix the
file another way instead.

## Checking Your Work

<div class="exercise">
  <p class="exercise-prompt">
    <strong>Exercise:</strong> build a square pyramid with <code>Polyhedron</code>
    -- 5 points (4 base corners, plus 1 apex above the middle) and at
    least 5 faces: a base, plus 4 triangle sides. The base can be one
    4-point face, or 2 triangles if you'd rather keep every face a
    triangle -- both are real polyhedrons.
  </p>
  <div class="embed" data-embed="ex-polyhedron" data-check="ex-polyhedron">
  <textarea class="embed-code">points = [
    (0, 0, 0),
]
faces = []
Polyhedron(points=points, faces=faces)</textarea>
  </div>
</div>

## Practice

`Polyhedron(points, faces, fill=, opacity=100, hole=False)`: points are
numbered `(x, y, z)` corners; faces are lists of point numbers, wound
consistently around each face's outside. It's the same building block a
`.stl` file itself is made of.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/python3d/studio/' | relative_url }}">
    <strong>Open the Studio &rarr;</strong>
    <span>Everything from every lesson, plus fillets, align=, and more.</span>
  </a>
  <a class="playground-card" href="{{ '/python3d/cheatsheet/' | relative_url }}">
    <strong>Cheatsheet &rarr;</strong>
    <span>Every shape, transform, and option on one page.</span>
  </a>
</div>

</div>

<style>
  .lesson-crumbs {
    max-width: 720px;
    font-size: 0.85rem;
  }
  .lesson-crumbs a {
    color: #2a7ae2;
    text-decoration: none;
  }
  .lesson-crumbs a:hover { text-decoration: underline; }

  .lesson {
    max-width: 720px;
  }
  .lesson h1 { margin-top: 8px; }
  .lesson h2 {
    margin-top: 2.2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #d0d7de;
  }
  .lesson code {
    background: #f3f4f6;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-size: 0.92em;
  }
  .lesson pre code {
    display: block;
    padding: 10px 14px;
    overflow-x: auto;
  }

  .advanced-badge {
    display: inline-block;
    margin: 0;
    padding: 3px 10px;
    border-radius: 999px;
    background: #fff3d6;
    color: #7a5b00;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .embed {
    position: relative;
    margin: 1.2em 0;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .embed-code {
    display: block;
    width: 100%;
    min-height: 70px;
    border: 0;
    resize: vertical;
    padding: 12px 14px;
    font: 13px/1.5 "SF Mono", Menlo, Consolas, monospace;
    outline: none;
    box-sizing: border-box;
  }
  .embed-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid #d0d7de;
    background: #f6f8fa;
  }
  .embed-run {
    font: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #2e9e44;
    background: #2e9e44;
    color: white;
    cursor: pointer;
  }
  .embed-run:disabled { opacity: 0.5; cursor: default; }
  .embed-reset, .embed-stop {
    font: inherit;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: white;
    color: #57606a;
    cursor: pointer;
  }
  .embed-stop:disabled { opacity: 0.5; cursor: default; }
  .embed-check {
    font: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #2a7ae2;
    background: white;
    color: #2a7ae2;
    cursor: pointer;
  }
  .embed-export {
    font: inherit;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: white;
    color: #57606a;
    cursor: pointer;
  }
  .embed-status {
    font-size: 0.8rem;
    color: #57606a;
    margin-left: auto;
  }
  .embed-zoom-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .embed-zoom-controls button {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: rgba(255,255,255,0.9);
    color: #1b1f23;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }
  .embed-zoom-controls button:hover {
    border-color: #2a7ae2;
    color: #2a7ae2;
  }
  .embed-free-rotate {
    position: absolute;
    top: 8px;
    left: 8px;
    font: inherit;
    font-size: 0.72rem;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: rgba(255,255,255,0.9);
    color: #1b1f23;
    cursor: pointer;
  }
  .embed-free-rotate:hover { border-color: #2a7ae2; color: #2a7ae2; }
  .embed-free-rotate.active {
    background: #2a7ae2;
    border-color: #2a7ae2;
    color: #fff;
  }
  .embed-error {
    display: none;
    margin: 0 10px 10px;
    padding: 8px 10px;
    background: #fff0f0;
    border: 1px solid #d1242f;
    border-radius: 6px;
    color: #d1242f;
    font: 11.5px/1.4 "SF Mono", Menlo, Consolas, monospace;
    white-space: pre-wrap;
  }
  .embed-output {
    margin: 0 10px 10px;
    padding: 8px 10px;
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    color: #1b1f23;
    font: 11.5px/1.4 "SF Mono", Menlo, Consolas, monospace;
    white-space: pre-wrap;
  }
  .embed-output[hidden] { display: none; }
  .embed-next {
    font: inherit;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: white;
    color: #57606a;
    cursor: pointer;
  }
  .embed-viewer {
    position: relative;
    height: 260px;
    border-top: 1px solid #d0d7de;
    background: #e9edf1;
  }
  .embed-viewer:focus { outline: none; }
  .embed-viewer.keyboard-active:focus {
    outline: 2px solid #2a7ae2;
    outline-offset: -2px;
  }
  .embed-key-hint {
    position: absolute;
    bottom: 8px;
    left: 8px;
    font-size: 0.75rem;
    color: #57606a;
    background: rgba(255,255,255,0.85);
    padding: 4px 8px;
    border-radius: 4px;
  }
  .embed-key-hint[hidden] { display: none; }
  .embed-viewer canvas { display: block; }

  .quiz {
    position: relative;
    margin: 1.4em 0;
    padding: 14px 16px;
    border-left: 5px solid #8b5cf6;
    background: #f5f3ff;
    border-radius: 0 8px 8px 0;
  }
  .checkpoint-locked > *:not(.checkpoint-lock) {
    filter: blur(4px);
    pointer-events: none;
    user-select: none;
  }
  .checkpoint-lock {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.55);
  }
  .checkpoint-lock p {
    margin: 0;
    font-weight: 600;
    color: #57606a;
    background: white;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .checkpoint-skip {
    font: inherit;
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: white;
    color: #57606a;
    cursor: pointer;
  }
  .quiz-prompt { margin: 0 0 10px; font-weight: 600; }
  .quiz-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .quiz-options-code { flex-direction: column; align-items: flex-start; }
  .quiz-option {
    font: inherit;
    font-size: 0.9rem;
    padding: 7px 12px;
    border-radius: 6px;
    border: 1px solid #c4b5fd;
    background: white;
    cursor: pointer;
    text-align: left;
  }
  .quiz-option:hover { border-color: #8b5cf6; }
  .quiz-option.correct { border-color: #2e9e44; background: #eafaf0; }
  .quiz-option.incorrect { border-color: #d1242f; background: #fff0f0; }
  .quiz-feedback {
    margin: 10px 0 0;
    font-size: 0.88rem;
    min-height: 1.2em;
  }
  .quiz-feedback.correct { color: #216e39; }
  .quiz-feedback.incorrect { color: #d1242f; }

  .exercise {
    margin: 1.4em 0;
    padding: 14px 16px;
    border-left: 5px solid #2a7ae2;
    background: #f0f6ff;
    border-radius: 0 8px 8px 0;
  }
  .exercise-prompt { margin: 0 0 10px; }
  .exercise .embed { margin: 0; }
  .check-feedback {
    margin: 8px 10px 0;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 0.88rem;
    display: none;
  }
  .check-feedback.pass {
    display: block;
    background: #eafaf0;
    color: #216e39;
    border: 1px solid #2e9e44;
  }
  .check-feedback.fail {
    display: block;
    background: #fff8e8;
    color: #7a5b00;
    border: 1px solid #b98900;
  }

  .playground-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 20px 0 8px;
  }
  .playground-card {
    flex: 1 1 260px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px 18px;
    border: 1px solid #d0d7de;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    background: #fff;
  }
  .playground-card:hover { border-color: #2a7ae2; }
  .playground-card strong { color: #2a7ae2; font-size: 1.05rem; }
  .playground-card span { color: #57606a; font-size: 0.92rem; }
</style>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ViewHelper } from "three/addons/helpers/ViewHelper.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";

// The leanest shim in the whole course -- this lesson is about exactly
// one shape. No Box/Cylinder/translate()/rotate()/union()/etc.: nothing
// here needs them, and every other lesson's shim is trimmed to match
// what it actually teaches (see rotate-extrude.md for the same idea one
// step less trimmed).
const MINI_SHIM = `
_registry = []

class Solid:
    # Attribute access proxies straight into .data, so shape.x = -2.5
    # (used in the winding-comparison demo below) mutates it in place,
    # same mutability every other page in this course has.
    def __init__(self, data):
        self.__dict__["data"] = data
        _registry.append(self)
    def __getattr__(self, name):
        data = self.__dict__["data"]
        if name in data:
            return data[name]
        raise AttributeError(f"'Solid' object has no attribute '{name}'")
    def __setattr__(self, name, value):
        self.__dict__["data"][name] = value

def Polyhedron(points, faces, x=0, y=0, z=0, fill=None, opacity=100):
    if not points or len(points) < 4:
        raise ValueError("Polyhedron needs at least 4 points")
    if not faces or any(len(f) < 3 for f in faces):
        raise ValueError("Polyhedron needs at least one face, each with at least 3 points")
    return Solid({
        "type": "polyhedron", "points": [tuple(p) for p in points],
        "faces": [list(f) for f in faces],
        "x": x, "y": y, "z": z, "fill": fill, "opacity": opacity, "visible": True,
    })

def _reset():
    # Every real Run gets a genuinely fresh namespace -- see studio.html
    # for why (a stale variable/function from a previous run would
    # otherwise silently survive into one that no longer defines it).
    _registry.clear()
    for name in list(globals().keys()):
        if name not in _BASE_NAMES:
            del globals()[name]

def _dump():
    import json
    live = [s.data for s in _registry if s.data.get("visible", True)]
    return json.dumps(live)

_BASE_NAMES = set(globals().keys()) | {"_BASE_NAMES"}
`;

// Python runs in a Web Worker, shared by every embed on this page, so a
// runaway loop in one exercise can't freeze the tab. See studio.html for
// the full rationale (COOP/COEP headers aren't available on GitHub Pages,
// so "Stop" always means terminate-and-respawn the whole interpreter) and
// for why the worker loads pyodide's ESM build via dynamic import() rather
// than importScripts(): importScripts() of this exact CDN file fails
// outright in some Chromium builds even though fetch() of the same URL
// succeeds, while the ESM build works end to end.
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";
const WORKER_SCRIPT = `
let pyodide = null;
let outputLines = [];
function hasFn(name) {
  const fn = pyodide.globals.get(name);
  const ok = !!fn && typeof fn === "function";
  if (fn && fn.destroy) fn.destroy();
  return ok;
}
self.onmessage = async (e) => {
  const { id, type, payload } = e.data;
  try {
    if (type === "init") {
      const { loadPyodide } = await import(payload.pyodideUrl);
      pyodide = await loadPyodide({
        stdout: (msg) => outputLines.push(msg),
        stderr: (msg) => outputLines.push(msg),
      });
      pyodide.runPython(payload.shim);
      self.postMessage({ id, type: "ready" });
      return;
    }
    if (type === "run") {
      outputLines = [];
      pyodide.runPython("_reset()");
      pyodide.runPython(payload.code);
      const shapes = pyodide.runPython("_dump()");
      self.postMessage({
        id, type: "result", shapes,
        hasOnKeyPress: hasFn("onKeyPress"), hasOnNext: hasFn("onNext"),
        output: outputLines,
      });
      return;
    }
    if (type === "event") {
      const fn = pyodide.globals.get(payload.fnName);
      let ran = false, shapes = null;
      outputLines = [];
      if (fn && typeof fn === "function") {
        try {
          fn(...(payload.args || []));
          ran = true;
        } finally {
          fn.destroy();
        }
        shapes = pyodide.runPython("_dump()");
      }
      self.postMessage({ id, type: "result", shapes, ran, output: outputLines });
    }
  } catch (err) {
    self.postMessage({ id, type: "error", message: err.message, output: outputLines });
  }
};
`;

class PyodideWorker {
  constructor(pyodideUrl, shim) {
    this.pyodideUrl = pyodideUrl;
    this.shim = shim;
    this.nextId = 1;
    this.pending = new Map();
    this._spawn();
  }
  _spawn() {
    const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.onmessage = (e) => {
      const { id, type, message, output, ...result } = e.data;
      const entry = this.pending.get(id);
      if (!entry) return;
      this.pending.delete(id);
      if (type === "error") {
        const err = new Error(message);
        err.output = output;
        entry.reject(err);
      } else if (type === "result") {
        entry.resolve({ ...result, output });
      } else {
        entry.resolve();
      }
    };
    const id = this.nextId++;
    this.readyPromise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.worker.postMessage({ id, type: "init", payload: { pyodideUrl: this.pyodideUrl, shim: this.shim } });
  }
  ready() { return this.readyPromise; }
  run(code) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type: "run", payload: { code } });
    });
  }
  event(fnName, args = []) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type: "event", payload: { fnName, args } });
    });
  }
  async cancelAndRestart() {
    for (const [, entry] of this.pending) entry.reject(new Error("Stopped -- restarting Python."));
    this.pending.clear();
    this.worker.terminate();
    this._spawn();
    await this.ready();
  }
}

const KEY_NAMES = { ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right", " ": "Space" };

// See studio.html for the full "Look From Any Angle" story. This page
// only ships the button, not the Alt-key alternative -- a bare keydown
// has no way to know which of several embeds on one page it should
// apply to, so the button (already scoped to its own embed) is the only
// version that makes sense here.
const NORMAL_MAX_POLAR = Math.PI * 0.47;
const FREE_MAX_POLAR = Math.PI * 0.85;

let worker;
let embeds = [];
async function stopAndRestart() {
  embeds.forEach((e) => {
    e.runToken++;
    e.runBtn.disabled = true;
    e.stopBtn.disabled = true;
    e.statusEl.textContent = "Restarting Python…";
    e.clearError();
    e.showOutput(null);
    e.setKeyboardActive(false);
    e.nextBtn.hidden = true;
  });
  try {
    await worker.cancelAndRestart();
  } finally {
    embeds.forEach((e) => {
      e.runBtn.disabled = false;
      e.stopBtn.disabled = false;
      e.statusEl.textContent = "Ready -- click Run";
    });
  }
}

const materialCache = new Map();
function materialFor(fill, opacity = 100) {
  const key = (fill || "default") + "|" + opacity;
  if (!materialCache.has(key)) {
    const color = fill ? new THREE.Color(fill) : new THREE.Color(0x2a7ae2);
    materialCache.set(key, new THREE.MeshStandardMaterial({
      // DoubleSide -- a Polyhedron face's winding isn't guaranteed
      // outward (that's the whole point of the winding-order section),
      // so without this a backwards-wound face would just vanish
      // instead of showing the wrong-looking shading this lesson
      // actually wants visible.
      color, transparent: opacity < 100, opacity: opacity / 100, side: THREE.DoubleSide,
    }));
  }
  return materialCache.get(key);
}

function makeTickSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.font = "20px monospace";
  ctx.fillStyle = "#57606a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 16);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), depthTest: false, transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.5, 0.25, 1);
  return sprite;
}

function resizeGrid(gridState, targetSize) {
  if (targetSize === gridState.size) return;
  const scene = gridState.mesh.parent;
  scene.remove(gridState.mesh);
  gridState.mesh.geometry.dispose();
  gridState.mesh.material.dispose();
  const divisions = Math.min(targetSize, 40);
  const newGrid = new THREE.GridHelper(targetSize, divisions, 0xbbbbbb, 0xdddddd);
  newGrid.rotation.x = Math.PI / 2;
  newGrid.position.z = -0.01;
  scene.add(newGrid);
  gridState.mesh = newGrid;
  gridState.size = targetSize;
}

function fitSceneToContent(camera, controls, group, gridState) {
  const box = new THREE.Box3().setFromObject(group);
  let farthestExtent = 10;
  if (!box.isEmpty()) {
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    farthestExtent = controls.target.distanceTo(sphere.center) + sphere.radius;
  }
  const currentDist = camera.position.distanceTo(controls.target);
  const safeDist = farthestExtent * 1.8 + 1;
  if (currentDist < safeDist) {
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(1, -1, 0.8);
    dir.normalize();
    camera.position.copy(controls.target).addScaledVector(dir, safeDist);
    controls.maxDistance = Math.max(controls.maxDistance, safeDist * 3);
    if (camera.far < safeDist * 4) {
      camera.far = safeDist * 4;
      camera.updateProjectionMatrix();
    }
    controls.update();
  }
  resizeGrid(gridState, Math.max(20, Math.ceil((farthestExtent * 3) / 10) * 10));
}

// Fan-triangulates each face from its own first point -- correct for any
// convex face (every example in this lesson: triangles, and a square
// base), matching the exact same approach (and the exact same
// limitation, documented on the Cheatsheet) Studio's own Polyhedron
// uses.
function buildLeafGeometry(node) {
  const positions = [];
  for (const face of node.faces) {
    for (let i = 1; i < face.length - 1; i++) {
      for (const idx of [face[0], face[i], face[i + 1]]) {
        const [x, y, z] = node.points[idx];
        positions.push(x, y, z);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  return geometry;
}

// No CSG, no translate()/rotate() wrapping to unwrap -- this lesson's
// shim only ever produces one kind of node, so building its mesh is a
// straight leaf-geometry-plus-position job, not the general recursive
// tree-walk studio.html and every other lesson need.
function buildBrush(node) {
  const geometry = buildLeafGeometry(node);
  geometry.translate(node.x || 0, node.y || 0, node.z || 0);
  const mesh = new THREE.Mesh(geometry, materialFor(node.fill, node.opacity));
  mesh.userData.geometry = geometry;
  return mesh;
}

// Loose on purpose, matching this course's other checkers: looks for a
// real Polyhedron with enough points/faces to be a square pyramid (not
// literally checking for a square base and an apex), plus a rough
// bounding-box sanity check so a degenerate/flat attempt doesn't pass.
const CHECKERS = {
  "ex-polyhedron"(shapes, group) {
    const poly = shapes.find((n) => n.type === "polyhedron");
    if (!poly) return { pass: false, message: "I don't see a Polyhedron() yet." };
    if (poly.points.length < 5) {
      return { pass: false, message: "A square pyramid needs at least 5 points -- 4 base corners plus 1 apex." };
    }
    if (poly.faces.length < 5) {
      return { pass: false, message: "A square pyramid needs at least 5 faces -- the base plus 4 triangle sides (a 4-point base face counts as one)." };
    }
    const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    if (size.x < 0.5 || size.y < 0.5 || size.z < 0.5) {
      return { pass: false, message: "That looks too flat or too small to be a real pyramid -- check your points." };
    }
    return { pass: true, message: `That's a real pyramid -- ${poly.points.length} points, ${poly.faces.length} faces. Nice work.` };
  },
};

class Embed {
  constructor(container) {
    this.container = container;
    const seedTextarea = container.querySelector(".embed-code");
    this.starterCode = seedTextarea.value;
    this.checkerName = container.dataset.check;
    this.disposables = [];
    this.runToken = 0;
    this.freeRotateActive = false;
    this.buildDom(container);
    this.setupScene();
    this.bindEvents();
    new ResizeObserver(() => this.resize()).observe(this.viewerEl);
    this.resize();
    this.animate();
  }

  buildDom(container) {
    container.innerHTML = "";
    this.codeEl = document.createElement("textarea");
    this.codeEl.className = "embed-code";
    this.codeEl.spellcheck = false;
    this.codeEl.value = this.starterCode;
    container.appendChild(this.codeEl);

    this.errorEl = document.createElement("div");
    this.errorEl.className = "embed-error";
    container.appendChild(this.errorEl);

    this.outputEl = document.createElement("div");
    this.outputEl.className = "embed-output";
    this.outputEl.hidden = true;
    container.appendChild(this.outputEl);

    const toolbar = document.createElement("div");
    toolbar.className = "embed-toolbar";

    this.runBtn = document.createElement("button");
    this.runBtn.className = "embed-run";
    this.runBtn.textContent = "Run";
    this.runBtn.disabled = true;
    toolbar.appendChild(this.runBtn);

    this.stopBtn = document.createElement("button");
    this.stopBtn.className = "embed-stop";
    this.stopBtn.textContent = "Stop";
    this.stopBtn.title = "Stuck in a loop? This restarts Python.";
    this.stopBtn.disabled = true;
    toolbar.appendChild(this.stopBtn);

    this.nextBtn = document.createElement("button");
    this.nextBtn.className = "embed-next";
    this.nextBtn.textContent = "Next";
    this.nextBtn.title = "Calls onNext() again.";
    this.nextBtn.hidden = true;
    toolbar.appendChild(this.nextBtn);

    this.resetBtn = document.createElement("button");
    this.resetBtn.className = "embed-reset";
    this.resetBtn.textContent = "Reset";
    toolbar.appendChild(this.resetBtn);

    if (this.checkerName) {
      this.checkBtn = document.createElement("button");
      this.checkBtn.className = "embed-check";
      this.checkBtn.textContent = "Check My Work";
      toolbar.appendChild(this.checkBtn);
    }

    this.exportBtn = document.createElement("button");
    this.exportBtn.className = "embed-export";
    this.exportBtn.textContent = "Export STL";
    toolbar.appendChild(this.exportBtn);

    this.statusEl = document.createElement("span");
    this.statusEl.className = "embed-status";
    this.statusEl.textContent = "Loading Python…";
    toolbar.appendChild(this.statusEl);

    container.appendChild(toolbar);

    if (this.checkerName) {
      this.feedbackEl = document.createElement("div");
      this.feedbackEl.className = "check-feedback";
      container.appendChild(this.feedbackEl);
    }

    this.viewerEl = document.createElement("div");
    this.viewerEl.className = "embed-viewer";
    this.viewerEl.tabIndex = 0;
    container.appendChild(this.viewerEl);

    this.keyHintEl = document.createElement("div");
    this.keyHintEl.className = "embed-key-hint";
    this.keyHintEl.textContent = "Click here, then press a key";
    this.keyHintEl.hidden = true;
    this.viewerEl.appendChild(this.keyHintEl);

    this.freeRotateBtn = document.createElement("button");
    this.freeRotateBtn.className = "embed-free-rotate";
    this.freeRotateBtn.textContent = "Look From Any Angle";
    this.viewerEl.appendChild(this.freeRotateBtn);

    const zoomControls = document.createElement("div");
    zoomControls.className = "embed-zoom-controls";
    this.zoomInBtn = document.createElement("button");
    this.zoomInBtn.textContent = "+";
    this.zoomInBtn.title = "Zoom in";
    this.zoomOutBtn = document.createElement("button");
    this.zoomOutBtn.textContent = "−";
    this.zoomOutBtn.title = "Zoom out";
    zoomControls.appendChild(this.zoomInBtn);
    zoomControls.appendChild(this.zoomOutBtn);
    this.viewerEl.appendChild(zoomControls);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe9edf1);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(6, -6, 5);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.viewerEl.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = NORMAL_MAX_POLAR;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 40;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(5, -10, 12);
    this.scene.add(sun);
    const grid = new THREE.GridHelper(20, 20, 0xbbbbbb, 0xdddddd);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.01;
    this.scene.add(grid);
    this.gridState = { mesh: grid, size: 20 };
    this.scene.add(new THREE.AxesHelper(2));
    for (let i = -6; i <= 6; i += 2) {
      if (i === 0) continue;
      const xTick = makeTickSprite(String(i));
      xTick.position.set(i, -0.4, 0.02);
      this.scene.add(xTick);
      const yTick = makeTickSprite(String(i));
      yTick.position.set(-0.4, i, 0.02);
      this.scene.add(yTick);
    }
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.viewHelper = new ViewHelper(this.camera, this.renderer.domElement);
    this.viewHelper.location.left = 6;
    this.viewHelper.location.bottom = 6;
    this.viewHelper.setLabels("X", "Y", "Z");
    this.renderer.domElement.addEventListener("click", (e) => this.viewHelper.handleClick(e));
    this.clock = new THREE.Clock();
  }

  resize() {
    const w = this.viewerEl.clientWidth, h = this.viewerEl.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.viewHelper.animating) this.viewHelper.update(this.clock.getDelta());
    this.renderer.autoClear = false;
    this.viewHelper.render(this.renderer);
    this.renderer.autoClear = true;
  }

  zoomBy(delta) {
    this.renderer.domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: delta, bubbles: true, cancelable: true }));
  }

  exportSTL() {
    if (!this.group.children.length) return;
    const exporter = new STLExporter();
    const stlText = exporter.parse(this.group);
    const blob = new Blob([stlText], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model.stl";
    a.click();
    URL.revokeObjectURL(url);
  }

  bindEvents() {
    this.runBtn.addEventListener("click", () => this.run());
    this.stopBtn.addEventListener("click", () => stopAndRestart());
    this.nextBtn.addEventListener("click", () => this.runEvent("onNext", []));
    this.resetBtn.addEventListener("click", () => {
      this.codeEl.value = this.starterCode;
      if (this.feedbackEl) this.feedbackEl.className = "check-feedback";
      this.run();
    });
    if (this.checkBtn) {
      this.checkBtn.addEventListener("click", () => this.check());
    }
    this.exportBtn.addEventListener("click", () => this.exportSTL());
    this.zoomInBtn.addEventListener("click", () => this.zoomBy(-120));
    this.zoomOutBtn.addEventListener("click", () => this.zoomBy(120));
    this.freeRotateBtn.addEventListener("click", () => {
      this.freeRotateActive = !this.freeRotateActive;
      this.applyFreeRotateState();
    });
    this.viewerEl.addEventListener("keydown", (e) => {
      if (!this.viewerEl.classList.contains("keyboard-active")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      this.runEvent("onKeyPress", [KEY_NAMES[e.key] || e.key]);
    });
  }

  applyFreeRotateState() {
    this.controls.maxPolarAngle = this.freeRotateActive ? FREE_MAX_POLAR : NORMAL_MAX_POLAR;
    if (this.freeRotateActive) {
      const box = new THREE.Box3().setFromObject(this.group);
      if (!box.isEmpty()) box.getCenter(this.controls.target);
    } else {
      this.controls.target.set(0, 0, 0);
    }
    this.freeRotateBtn.textContent = this.freeRotateActive ? "Back to Normal View" : "Look From Any Angle";
    this.freeRotateBtn.classList.toggle("active", this.freeRotateActive);
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.style.display = "block";
  }
  clearError() {
    this.errorEl.style.display = "none";
  }

  showOutput(lines) {
    if (!lines || lines.length === 0) {
      this.outputEl.hidden = true;
      this.outputEl.textContent = "";
      return;
    }
    this.outputEl.hidden = false;
    this.outputEl.textContent = lines.join("\n");
  }

  setKeyboardActive(active) {
    this.viewerEl.classList.toggle("keyboard-active", active);
    this.keyHintEl.hidden = !active;
  }

  async run() {
    const token = ++this.runToken;
    this.clearError();
    try {
      const { shapes: shapesJson, hasOnKeyPress, hasOnNext, output } = await worker.run(this.codeEl.value);
      if (token !== this.runToken) return;
      this.lastShapes = JSON.parse(shapesJson);
      this.rebuild(this.lastShapes);
      this.showOutput(output);
      this.setKeyboardActive(!!hasOnKeyPress);
      this.nextBtn.hidden = !hasOnNext;
    } catch (err) {
      if (token !== this.runToken) return;
      this.lastShapes = null;
      this.showOutput(err.output);
      this.showError(err.message);
    }
  }

  async runEvent(fnName, args) {
    const token = ++this.runToken;
    this.clearError();
    try {
      const { shapes: shapesJson, ran, output } = await worker.event(fnName, args);
      if (token !== this.runToken) return;
      if (!ran) return;
      this.lastShapes = JSON.parse(shapesJson);
      this.rebuild(this.lastShapes);
      this.showOutput(output);
    } catch (err) {
      if (token !== this.runToken) return;
      this.showOutput(err.output);
      this.showError(err.message);
    }
  }

  check() {
    if (!this.checkerName) return;
    const checker = CHECKERS[this.checkerName];
    if (!checker || !this.lastShapes) {
      this.feedbackEl.className = "check-feedback fail";
      this.feedbackEl.textContent = "Run your code first, then click Check My Work.";
      return;
    }
    const result = checker(this.lastShapes, this.group);
    this.feedbackEl.className = "check-feedback " + (result.pass ? "pass" : "fail");
    this.feedbackEl.textContent = result.message;
    if (result.pass) progress.markDone(this.checkerName);
  }

  rebuild(shapes) {
    for (const child of [...this.group.children]) this.group.remove(child);
    for (const g of this.disposables) g.dispose();
    this.disposables = [];
    for (const node of shapes) {
      const mesh = buildBrush(node);
      this.disposables.push(mesh.userData.geometry);
      this.group.add(mesh);
    }
    fitSceneToContent(this.camera, this.controls, this.group, this.gridState);
    if (this.freeRotateActive) this.applyFreeRotateState();
  }

  ready() {
    this.runBtn.disabled = false;
    this.stopBtn.disabled = false;
    this.statusEl.textContent = "Ready -- click Run";
  }
}

function setupQuizzes() {
  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const answer = quiz.dataset.answer;
    const feedback = quiz.querySelector(".quiz-feedback");
    let solved = false;
    quiz.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (solved) return;
        quiz.querySelectorAll(".quiz-option").forEach((b) => b.classList.remove("correct", "incorrect"));
        if (btn.dataset.key === answer) {
          btn.classList.add("correct");
          feedback.textContent = "Correct!";
          feedback.className = "quiz-feedback correct";
          solved = true;
          progress.markDone(quiz.dataset.quiz);
        } else {
          btn.classList.add("incorrect");
          feedback.textContent = "Not quite -- try another one.";
          feedback.className = "quiz-feedback incorrect";
        }
      });
    });
  });
}

function initLessonProgress(lessonId, order) {
  const storageKey = "python3d-progress:" + lessonId;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch (e) { saved = {}; }

  function checkpointEl(id) {
    return document.querySelector('[data-quiz="' + id + '"], [data-check="' + id + '"]');
  }
  function unlock(el) {
    const lock = el.querySelector(".checkpoint-lock");
    if (lock) lock.remove();
    el.classList.remove("checkpoint-locked");
  }
  function lock(el) {
    if (el.querySelector(".checkpoint-lock")) return;
    const overlay = document.createElement("div");
    overlay.className = "checkpoint-lock";
    overlay.innerHTML = '<p>🔒 Complete the checkpoint above first</p>';
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "checkpoint-skip";
    skip.textContent = "I already know this -- unlock it";
    skip.addEventListener("click", () => unlock(el));
    overlay.appendChild(skip);
    el.classList.add("checkpoint-locked");
    el.appendChild(overlay);
  }

  order.forEach((id, i) => {
    const el = checkpointEl(id);
    if (!el) return;
    if (i > 0 && !saved[order[i - 1]]) lock(el);
  });

  return {
    markDone(id) {
      if (saved[id]) return;
      saved[id] = true;
      try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (e) { /* private browsing, etc. */ }
      const idx = order.indexOf(id);
      if (idx === -1 || idx + 1 >= order.length) return;
      const nextEl = checkpointEl(order[idx + 1]);
      if (nextEl) unlock(nextEl);
    },
  };
}

let progress;

async function main() {
  setupQuizzes();
  embeds = [...document.querySelectorAll("[data-embed]")].map((el) => new Embed(el));
  progress = initLessonProgress("polyhedrons", ["points-are-corners", "faces-are-indices", "winding-order", "ex-polyhedron"]);
  worker = new PyodideWorker(PYODIDE_URL, MINI_SHIM);
  await worker.ready();
  embeds.forEach((e) => e.ready());
}
main();
</script>
