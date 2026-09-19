---
layout: minimal
title: "Position and Size"
permalink: /python3d/position-size/
---

<div class="lesson-crumbs">
  <a href="{{ '/python3d/' | relative_url }}">&larr; Python in 3D</a>
  &middot;
  <a href="{{ '/python3d/shapes/' | relative_url }}">&larr; Flat Shapes</a>
</div>

<div class="lesson" markdown="1">

# Position and Size

## Our First Program

Let's build a box. Click **Run** below to run this Python code:

<div class="embed" data-embed="first">
<textarea class="embed-code">Box(4, 4, 4)</textarea>
</div>

You just ran a Python program that built a real 3D object! Now let's edit
it. In the code above, change some of the numbers and click Run a few
times. See how the box changes. If the code stops working, no problem,
just click Reset to start over and try again.

## The Scene

To understand what's going on, we first have to talk about the scene. In
this tool, shapes are placed in 3D space instead of drawn on a flat
canvas. We use `(x, y, z)` coordinates to talk about where something sits:

- `(0, 0, 0)` is the **center** of the scene, not a corner.
- As `x` increases, you head right.
- As `y` increases, you head away from you.
- As `z` increases, you head up.

If you just came from [Lesson 1]({{ '/python3d/shapes/' | relative_url }}),
this is a little different: there, `y` increased as you went *down*, and
`(0, 0)` was a corner. Here, up is a real direction, so `z` takes over that
job, and `x`/`y` share the flat ground, centered on zero instead of starting
in a corner.

<div class="quiz" data-quiz="up" data-answer="up">
  <p class="quiz-prompt">If you increase a shape's <code>z</code> value, which way does it move?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="down">Down</button>
    <button class="quiz-option" data-key="toward">Toward you</button>
    <button class="quiz-option" data-key="up">Up</button>
    <button class="quiz-option" data-key="right">Right</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Building Boxes

Here is the Python code from above:

```python
Box(4, 4, 4)
```

We use `Box` to build a rectangular block. In full, `Box` takes six
values: `width`, `depth`, `height`, `x`, `y`, `z`. The first three are
required, in that order. The last three are optional and default to 0 if
you leave them out. So the code above makes a block 4 wide, 4 deep, 4
tall, centered at `x=0, y=0`, with its bottom sitting right on the
ground.

That last part is worth slowing down on: `Box` is centered on `x` and
`y`, but it sits on top of `z`, not centered on it. A box's bottom is
always at whatever `z` you give it (0, if you don't say), and it builds
upward from there.

**Question:** if you call `Box(2, 2, 8, x=1)`, where does the *top* of
the box end up? (Hint: which argument is height, and where does height
start counting from?)

<div class="quiz" data-quiz="boxcall" data-answer="a">
  <p class="quiz-prompt">Which call makes a box that's 4 wide, 4 deep, 10 tall, sitting on the ground, centered above <code>x=3, y=0</code>?</p>
  <div class="quiz-options quiz-options-code">
    <button class="quiz-option" data-key="c"><code>Box(4, 10, 4, x=3)</code></button>
    <button class="quiz-option" data-key="b"><code>Box(4, 4, 10, z=3)</code></button>
    <button class="quiz-option" data-key="a"><code>Box(4, 4, 10, x=3)</code></button>
    <button class="quiz-option" data-key="d"><code>Box(10, 4, 4, x=3)</code></button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Checking Your Work

An important part of learning to code is knowing when you've actually
gotten it right. Below, you'll see a **Check My Work** button next to
Run. Read the instructions, edit the code, click Run, then click Check
My Work to see how you did. If it's not right yet, keep adjusting and
try again.

<div class="exercise">
  <p class="exercise-prompt">
    <strong>Exercise:</strong> build a box that is 4 wide, 2 deep, 3
    tall, centered at <code>x=3</code> (leave <code>y</code> and
    <code>z</code> at their defaults).
  </p>
  <div class="embed" data-embed="ex2" data-check="ex2">
  <textarea class="embed-code">Box(1, 1, 1)</textarea>
  </div>
</div>

## Rounding Corners

Every `Box` so far has had sharp, square corners. You can round them with
`fillet=`, which takes a size, same units as everything else:

<div class="embed" data-embed="fillet1">
<textarea class="embed-code">Box(4, 4, 4, fillet=0.8)</textarea>
</div>

Try changing that `0.8`. A small number rounds just the edges a little; a
number close to half the box's shortest side rounds it almost into a
capsule shape. If you go bigger than that, it gets clamped automatically
-- a rounded corner can't be bigger than the box it's rounding.

This kind of rounded, curved edge has a real name: a **fillet**. (A flat,
angled cut instead of a curve would be called a *chamfer* -- a different
thing.) It's not just decoration, either: rounded corners and edges are
genuinely easier to 3D print cleanly and are less likely to snag or crack
than a sharp corner.

<div class="quiz" data-quiz="fillet" data-answer="clamped">
  <p class="quiz-prompt">What actually happens if you set <code>fillet=</code> to something bigger than half the box's shortest side?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="error">Python raises an error</button>
    <button class="quiz-option" data-key="bigger">The box gets bigger to fit the rounding</button>
    <button class="quiz-option" data-key="clamped">It's automatically limited to the largest size that still fits</button>
    <button class="quiz-option" data-key="nothing">Nothing -- fillet= is ignored past that point</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Errors

Python is very picky. Here are some rules to follow:

- Case matters, so `Box` is not the same as `box`.
- A command must have the right number of values after it. For `Box`,
  those are `width`, `depth`, and `height` at least. These values are
  called **arguments**. Arguments must be in the right order, inside
  parentheses, and separated by commas.

If any of these rules aren't followed, you have an error, and your code
won't run until you fix it. Try running the broken code below. Read the
error message. What does it tell you?

<div class="embed" data-embed="broken">
<textarea class="embed-code">box(20, 20, 20)</textarea>
</div>

## Comments

Did you notice the `#` signs followed by English text in some of the
code examples in the cheatsheet? Those are called comments. You can add
a comment to any line of your code: anything from the `#` sign to the
end of that line is a comment, and Python ignores it completely. So why
use them? To make your code easier for you, and for others, to
understand.

## Practice

That's it for the basics! From here, move on to rotating and moving
shapes, head to the Studio to build something of your own, or keep the
Cheatsheet open while you work.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/python3d/transformations/' | relative_url }}">
    <strong>Lesson 3: Transformations &rarr;</strong>
    <span>Cylinders, rotate(), translate(), and how they compose.</span>
  </a>
  <a class="playground-card" href="{{ '/python3d/studio/' | relative_url }}">
    <strong>Open the Studio &rarr;</strong>
    <span>Write Python on the left, watch the model update live on the right.</span>
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

  /* ---- embedded runnable widget ---- */
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
  /* Unobtrusive by design: [hidden] means no space reserved at all unless
     a run/event actually printed something. */
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
  /* Only relevant once onKeyPress is defined -- see keyboard-active class
     toggled in JS -- so it doesn't visually suggest every embed is
     keyboard-interactive. */
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

  /* ---- checkpoint quiz ---- */
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

  /* ---- exercise wrapper ---- */
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

  /* ---- closing cards (same look as the landing page) ---- */
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
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const MINI_SHIM = `
# Box/Cylinder register themselves and render on their own, exactly like
# lesson 1 -- unless translate()/rotate() consumes one first, in which case
# only the *wrapped* result stays registered. Same idea as Studio's
# union()/difference(), just for one shape instead of combining several.
_registry = []

class Solid:
    # Attribute access proxies straight into .data, so a shape kept from
    # an earlier run stays a live handle: shape.x += 3 (or .fill =, .opacity
    # =, any field already in its data dict) mutates it in place. This is
    # what makes onKeyPress/onNext useful for moving an existing shape,
    # not just drawing new ones -- see run()/runEvent() below, which never
    # clear the registry before calling into student code, so a shape you
    # keep a reference to survives and reflects whatever you changed on it.
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

def _consume(solid):
    if solid in _registry:
        _registry.remove(solid)

SEGMENTS = 32

def Box(width, depth, height, x=0, y=0, z=0, fill=None, align="center", center=False, fillet=0, opacity=100):
    return Solid({
        "type": "box", "width": width, "depth": depth, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
        "fillet": fillet, "opacity": opacity,
    })

def Cylinder(radius, height, x=0, y=0, z=0, fill=None, align="center", center=False, segments=None, opacity=100):
    return Solid({
        "type": "cylinder", "radius": radius, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
        "segments": SEGMENTS if segments is None else segments, "opacity": opacity,
    })

def translate(solid, x=0, y=0, z=0):
    _consume(solid)
    return Solid({
        "type": "translate", "x": x, "y": y, "z": z,
        "child": solid.data, "fill": solid.data.get("fill"),
        "opacity": solid.data.get("opacity", 100),
    })

def rotate(solid, angle, axis="z"):
    # angle in degrees. axis is "x"/"y"/"z", or pass [rx, ry, rz] to rotate
    # around all three at once (x first, then y, then z).
    _consume(solid)
    data = {
        "type": "rotate", "child": solid.data, "fill": solid.data.get("fill"),
        "opacity": solid.data.get("opacity", 100),
    }
    if isinstance(angle, (list, tuple)):
        data["mode"] = "vector"
        data["angles"] = list(angle)
    else:
        data["mode"] = "axis"
        data["angle"] = angle
        data["axis"] = axis
    return Solid(data)

def _reset():
    # Every real Run gets a genuinely fresh namespace, not just an empty
    # shape registry -- see studio.html for why (a stale onKeyPress/onNext
    # from a previous run would otherwise keep responding).
    global SEGMENTS
    SEGMENTS = 32
    _registry.clear()
    for name in list(globals().keys()):
        if name not in _BASE_NAMES:
            del globals()[name]

def _dump():
    import json
    return json.dumps([s.data for s in _registry])

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
// onKeyPress/onNext (if the student's code defines them) are invoked
// straight into this same already-running session -- the registry is
// never cleared first, so a shape kept from the initial run (or an
// earlier event) survives and can be mutated in place (see Solid's
// __setattr__ above) rather than needing to be redrawn from scratch.
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

// CMU names its named keys this way; everything else (letters, digits,
// punctuation) already matches the raw browser event.key value.
const KEY_NAMES = { ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right", " ": "Space" };

let worker;
let embeds = [];
async function stopAndRestart() {
  embeds.forEach((e) => {
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

// Materials are cached by (color, opacity) pair, not just color -- two
// shapes sharing a fill but not an opacity would otherwise silently share
// (and fight over) one material's opacity.
const materialCache = new Map();
function materialFor(fill, opacity = 100) {
  const key = (fill || "default") + "|" + opacity;
  if (!materialCache.has(key)) {
    const color = fill ? new THREE.Color(fill) : new THREE.Color(0x2a7ae2);
    materialCache.set(key, new THREE.MeshStandardMaterial({
      color, transparent: opacity < 100, opacity: opacity / 100,
    }));
  }
  return materialCache.get(key);
}

// Same align redefinition as the Studio: "top"/"bottom" describe y (depth)
// here, not vertical position, since z is up in this scene.
function alignOffset(align, width, depth) {
  const a = align || "center";
  let ox = 0, oy = 0;
  if (a.includes("left")) ox = width / 2;
  else if (a.includes("right")) ox = -width / 2;
  if (a.includes("top")) oy = -depth / 2;
  else if (a.includes("bottom")) oy = depth / 2;
  return { ox, oy };
}

// A camera sitting at a fixed distance works fine for small shapes, but a
// student trying Box(20, 20, 20) (very reasonable -- "change some of the
// numbers" is the actual instruction) ends up with the camera *inside* the
// shape, which is invisible (back faces are culled) rather than obviously
// wrong. Only nudges the camera outward, along the direction it's already
// facing, and only when it would otherwise be unsafe -- normal-sized shapes
// never trigger this, so it doesn't interfere with a student's own zoom.
//
// The grid is a fixed 20-unit square by default, which has the same
// problem one step removed: once the camera pulls back far enough to frame
// a 20-unit box, the box is roughly the same size as the whole grid and
// visually swallows it. Resizing the grid to match current content (both
// growing and shrinking) fixes that; unlike the camera, this has no reason
// to be one-directional, since a plain grid resize can't strand anything
// out of view the way moving the camera inward could.
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
  let farthestExtent = 10; // matches the default 20-unit grid when the scene is empty
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

// Leaf geometry only -- align/center baked in, but NOT x/y/z. Those get
// folded into the accumulated matrix in buildMesh() below, which is what
// lets translate()/rotate() wrap a shape correctly (matching Studio): the
// wrapper's transform has to apply to the shape's already-positioned
// geometry as one combined matrix, not as separate position/rotation
// properties, or nesting them would compose in the wrong order.
function buildGeometry(node) {
  if (node.type === "box") {
    const g = node.fillet > 0
      ? new RoundedBoxGeometry(node.width, node.depth, node.height, 4, node.fillet)
      : new THREE.BoxGeometry(node.width, node.depth, node.height);
    const { ox, oy } = alignOffset(node.align, node.width, node.depth);
    g.translate(ox, oy, node.center ? 0 : node.height / 2);
    return g;
  }
  if (node.type === "cylinder") {
    const g = new THREE.CylinderGeometry(node.radius, node.radius, node.height, node.segments || 32);
    g.rotateX(Math.PI / 2);
    const { ox, oy } = alignOffset(node.align, node.radius * 2, node.radius * 2);
    g.translate(ox, oy, node.center ? 0 : node.height / 2);
    return g;
  }
  return null;
}

const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

function buildMesh(node, matrix, disposables) {
  if (node.type === "translate") {
    const m = new THREE.Matrix4().makeTranslation(node.x || 0, node.y || 0, node.z || 0);
    return buildMesh(node.child, matrix.clone().multiply(m), disposables);
  }
  if (node.type === "rotate") {
    let m;
    if (node.mode === "vector") {
      const [rx, ry, rz] = node.angles;
      m = new THREE.Matrix4()
        .makeRotationZ(THREE.MathUtils.degToRad(rz))
        .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(ry)))
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(rx)));
    } else {
      m = new THREE.Matrix4().makeRotationAxis(AXES[node.axis] || AXES.z, THREE.MathUtils.degToRad(node.angle));
    }
    return buildMesh(node.child, matrix.clone().multiply(m), disposables);
  }
  const geometry = buildGeometry(node);
  const localOffset = new THREE.Matrix4().makeTranslation(node.x || 0, node.y || 0, node.z || 0);
  geometry.applyMatrix4(matrix.clone().multiply(localOffset));
  disposables.push(geometry);
  return new THREE.Mesh(geometry, materialFor(node.fill, node.opacity));
}

// The exercise checkers: given the parsed shape list from a run, return
// { pass, message }. Kept deliberately simple -- just enough to check the
// one or two properties an exercise is actually about.
const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;
const CHECKERS = {
  ex2(shapes) {
    const box = shapes.find((s) => s.type === "box");
    if (!box) return { pass: false, message: "I don't see a Box yet -- try calling Box(...)." };
    if (!near(box.width, 4) || !near(box.depth, 2) || !near(box.height, 3)) {
      return { pass: false, message: "Check the width, depth, and height -- they should be 4, 2, and 3." };
    }
    if (!near(box.x, 3)) {
      return { pass: false, message: "The size looks right! Now check where it's positioned -- it should be centered at x=3." };
    }
    return { pass: true, message: "Nice work, that's exactly right!" };
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
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 40;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
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
    this.viewerEl.addEventListener("keydown", (e) => {
      if (!this.viewerEl.classList.contains("keyboard-active")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // don't hijack browser/system shortcuts
      e.preventDefault();
      this.runEvent("onKeyPress", [KEY_NAMES[e.key] || e.key]);
    });
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

  // Only relevant once onKeyPress is actually defined -- toggled fresh on
  // every real Run (never after an event call), so editing code that
  // removes onKeyPress cleanly drops the listener's effect.
  setKeyboardActive(active) {
    this.viewerEl.classList.toggle("keyboard-active", active);
    this.keyHintEl.hidden = !active;
  }

  async run() {
    const token = ++this.runToken;
    this.clearError();
    try {
      const { shapes: shapesJson, hasOnKeyPress, hasOnNext, output } = await worker.run(this.codeEl.value);
      if (token !== this.runToken) return; // a newer run (or a Stop) happened meanwhile
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

  // Shared by both the keydown listener and the Next button -- same render
  // path as a normal run(), just invoking one already-defined function in
  // the still-running session instead of the whole script. The registry is
  // never cleared first (see Solid's mutability, and the worker's "event"
  // handler), so a shape kept from an earlier run/event survives and can
  // be mutated in place; calling Box()/Cylinder() again just adds to
  // what's there.
  async runEvent(fnName, args) {
    const token = ++this.runToken;
    this.clearError();
    try {
      const { shapes: shapesJson, ran, output } = await worker.event(fnName, args);
      if (token !== this.runToken) return;
      if (!ran) return; // e.g. mid-edit, the function briefly isn't defined -- ignore quietly
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
    const result = checker(this.lastShapes);
    this.feedbackEl.className = "check-feedback " + (result.pass ? "pass" : "fail");
    this.feedbackEl.textContent = result.message;
    if (result.pass) progress.markDone(this.checkerName);
  }

  rebuild(shapes) {
    for (const child of [...this.group.children]) this.group.remove(child);
    for (const g of this.disposables) g.dispose();
    this.disposables = [];
    for (const node of shapes) {
      this.group.add(buildMesh(node, new THREE.Matrix4(), this.disposables));
    }
    fitSceneToContent(this.camera, this.controls, this.group, this.gridState);
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

// Checkpoints unlock in order -- each one stays blurred/disabled until the
// one before it is solved. Saved to localStorage (per browser, not per
// student -- there's no login here) so it survives a reload; the "already
// know this" link is a deliberate, always-present escape hatch, since nothing
// else could unstick a student if this ever gets in the way by mistake.
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

const progress = initLessonProgress("position-size", ["up", "boxcall", "ex2", "fillet"]);

async function main() {
  setupQuizzes();
  embeds = [...document.querySelectorAll("[data-embed]")].map((el) => new Embed(el));
  worker = new PyodideWorker(PYODIDE_URL, MINI_SHIM);
  await worker.ready();
  embeds.forEach((e) => e.ready());
}
main();
</script>
