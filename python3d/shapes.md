---
layout: minimal
title: "Flat Shapes"
permalink: /python3d/shapes/
---

<div class="lesson-crumbs">
  <a href="{{ '/python3d/' | relative_url }}">&larr; Python in 3D</a>
</div>

<div class="lesson" markdown="1">

# Flat Shapes

<aside class="callout note" markdown="1">
**ALREADY COMFORTABLE WITH THIS?**

If you've already placed shapes with x/y coordinates somewhere else, this
lesson will feel familiar. Feel free to
[skip ahead to Lesson 2]({{ '/python3d/position-size/' | relative_url }}).
</aside>

## Our First Shape

Click **Run** below to run this Python code:

<div class="embed" data-embed="first">
<textarea class="embed-code">Rect(1, 1, 4, 3)</textarea>
</div>

That's a rectangle. `Rect` is a Python function, and calling it is enough to
draw it, no extra steps. Now edit the numbers above and click Run a few
times. Watch how the rectangle changes shape and moves. If something stops
working, click Reset to start over.

## The Flat Grid

Every shape here needs to know where to go. We use `(x, y)` coordinates for
that:

- `(0, 0)` is the **center** of the grid.
- As `x` increases, you head right.
- As `y` increases, you head **down**.

That last one trips people up the first time, so slow down on it. On paper,
you're used to "up" meaning a bigger number, like a graph in math class.
Here, `y` works the opposite way: bigger `y` means further down. This
matches how a lot of drawing tools work, this one included.

<div class="quiz" data-quiz="coords" data-answer="down">
  <p class="quiz-prompt">If you increase a shape's <code>y</code> value, which way does it move on the screen?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="up">Up</button>
    <button class="quiz-option" data-key="down">Down</button>
    <button class="quiz-option" data-key="right">Right</button>
    <button class="quiz-option" data-key="nowhere">Nowhere, y doesn't affect position</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Rectangles

Here is the code from above again:

```python
Rect(1, 1, 4, 3)
```

In full, `Rect` takes four values, all required, in this order: `left`,
`top`, `width`, `height`. `left` and `top` are the coordinates of the
rectangle's **top-left corner**. `width` and `height` say how big it is
from there. So the code above draws a rectangle whose top-left corner sits
at `(1, 1)`, 4 units wide and 3 units tall.

That's worth slowing down on too: a `Rect` is not centered on the point you
give it. The point you give it is a corner, and the rectangle grows to the
right and down from there.

**Question:** if you call `Rect(2, 1, 4, 3)`, where is the corner opposite
`(2, 1)`? (Hint: which two values do you add, and to which two numbers?)

<div class="quiz" data-quiz="rectcall" data-answer="a">
  <p class="quiz-prompt">Which call draws a rectangle 4 wide and 3 tall, with its top-left corner at <code>x=2, y=1</code>?</p>
  <div class="quiz-options quiz-options-code">
    <button class="quiz-option" data-key="a"><code>Rect(2, 1, 4, 3)</code></button>
    <button class="quiz-option" data-key="b"><code>Rect(4, 3, 2, 1)</code></button>
    <button class="quiz-option" data-key="c"><code>Rect(2, 1, 3, 4)</code></button>
    <button class="quiz-option" data-key="d"><code>Rect(0, 0, 4, 3, x=2, y=1)</code></button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Circles

`Circle` is the other shape you'll use here:

<div class="embed" data-embed="circle1">
<textarea class="embed-code">Circle(0, 0, 2)</textarea>
</div>

`Circle` takes three values: `centerX`, `centerY`, `radius`. Notice the
first two are called `centerX`/`centerY`, not `left`/`top`. That's not just
a naming choice: a `Circle` is anchored by its **center**, not a corner.
There isn't really a "corner" of a circle to anchor it by.

<div class="quiz" data-quiz="circle" data-answer="anchor">
  <p class="quiz-prompt"><code>Rect(2, 1, 4, 3)</code> and <code>Circle(2, 1, 4)</code> both start with the numbers <code>2, 1</code>. Why do they end up in different places?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="anchor">Rect's first two numbers are a corner; Circle's are the center</button>
    <button class="quiz-option" data-key="same">They don't, both shapes end up in the same place</button>
    <button class="quiz-option" data-key="units">Rect and Circle use different units for position</button>
    <button class="quiz-option" data-key="ignored">Circle ignores position and always draws at the center of the grid</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

You can also color a shape in with `fill=`:

<div class="embed" data-embed="fill1">
<textarea class="embed-code">Rect(-4, -3, 3, 2, fill="crimson")
Circle(2, 2, 1.5, fill="cornflowerblue")</textarea>
</div>

## Checking Your Work

<div class="exercise">
  <p class="exercise-prompt">
    <strong>Exercise:</strong> draw a rectangle 4 wide and 3 tall with its
    top-left corner at <code>(1, 1)</code>, and a circle with radius 2
    centered at <code>(-3, -3)</code>.
  </p>
  <div class="embed" data-embed="ex1" data-check="ex1">
  <textarea class="embed-code">Rect(0, 0, 1, 1)</textarea>
  </div>
</div>

## Practice

That's it for flat shapes! One thing to know before you move on: in the
Studio (the full sandbox tool), `Rect` and `Circle` work a little
differently. There, they describe a flat outline, and nothing shows up
until you call `extrude(...)` to give it real height. We kept things
simple here on purpose, so you could focus on positioning first.

Here's a small preview of that, working right now -- with a bonus shape,
`Label`, that draws text:

<div class="embed" data-embed="extrude-preview" data-rotatable="true">
<textarea class="embed-code">extrude(Label("Mr. Brown", 0, 0, size=1.5), 1)</textarea>
</div>

`extrude(shape, height)` takes a shape you already drew and gives
it a real height instead of the thin default. This one viewer, just for
this example, lets you drag to rotate, so you can actually see that
height. (Every other viewer in this lesson stays locked flat, since this
lesson is about a flat page.) Go ahead and change `"Mr. Brown"` to your
own name. You'll meet `extrude` (and `Label`'s full set of
options) for real once you get to the Studio and the Cheatsheet -- along
with a second kind, `rotate_extrude`, once you're further along.

From here, move on to real 3D shapes with height, or jump straight to the
Studio or Cheatsheet.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/python3d/position-size/' | relative_url }}">
    <strong>Lesson 2: Position and Size &rarr;</strong>
    <span>Give shapes real height: position, size, and your first boxes.</span>
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
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

// Rect/Circle are self-registering and immediately visible here, matching
// real CMU behavior (Rect(10,10,50,50) just draws something -- no separate
// "make it visible" step) -- the Studio works the same way now too, just
// with more options (fill=/opacity=/hole=) than this lesson needs yet.
// This lesson is about coordinates, not the extrude step, so that part
// stays minimal here on purpose.
const MINI_SHIM = `
import math

_registry = []

class Solid:
    # Attribute access proxies straight into .data, so a shape kept from
    # an earlier run stays a live handle: shape.x += 3 (or .fill =, any
    # field already in its data dict) mutates it in place -- useful for
    # onKeyPress/onNext, which call back into this same running session
    # without clearing the registry first.
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
    solid.data["visible"] = False

# Just enough depth for the 3D viewer to show a real, lit surface -- you
# don't need to think about this yet. Every shape gets the same thickness.
_THICKNESS = 0.4

def Rect(left, top, width, height, fill=None, opacity=100):
    return Solid({
        "kind": "rect", "left": left, "top": top, "width": width, "height": height,
        "fill": fill, "opacity": opacity, "visible": True,
    })

def Circle(centerX, centerY, radius, fill=None, opacity=100):
    return Solid({
        "kind": "circle", "centerX": centerX, "centerY": centerY, "radius": radius,
        "fill": fill, "opacity": opacity, "visible": True,
    })

def Label(text, x, y, size=1, fill=None, opacity=100):
    # Matches CMU's Label(value, x, y, size): centered at (x, y). Just the
    # one font here (no font=/bold=/italic= yet) -- this lesson only needs
    # a taste of real text, not the full Studio API.
    return Solid({
        "kind": "text", "text": str(text), "x": x, "y": y, "size": size,
        "fill": fill, "opacity": opacity, "visible": True,
    })

# A small, honest preview of the Studio's real extrude(): shapes here
# are already visible with a default thin height (see _THICKNESS above)
# -- this just swaps in a custom one instead of that default, so you get
# a taste of "shapes with real height" without changing how Rect/Circle
# behave everywhere else in this lesson.
def extrude(solid, height):
    data = dict(solid.data)
    _consume(solid)
    data["_extrudeHeight"] = height
    data["visible"] = True
    return Solid(data)

# The outline actually drawn is computed fresh at dump time, not when
# Rect()/Circle() was first called -- so mutating a kept shape's own
# properties (rect.left += 1, circle.radius = 3, ...) is reflected the
# next time it's drawn, not frozen at whatever it was on creation.
def _points_for(data):
    if data["kind"] == "rect":
        left, top, width, height = data["left"], data["top"], data["width"], data["height"]
        return [(left, top), (left + width, top), (left + width, top + height), (left, top + height)]
    segments = 48
    cx, cy, r = data["centerX"], data["centerY"], data["radius"]
    return [
        (cx + r * math.cos(2 * math.pi * i / segments), cy + r * math.sin(2 * math.pi * i / segments))
        for i in range(segments)
    ]

def _reset():
    # Every real Run gets a genuinely fresh namespace, not just an empty
    # shape registry -- see studio.html for why (a stale onKeyPress/onNext
    # from a previous run would otherwise keep responding).
    _registry.clear()
    for name in list(globals().keys()):
        if name not in _BASE_NAMES:
            del globals()[name]

def _dump():
    import json
    out = []
    for s in _registry:
        if not s.data.get("visible", True):
            continue
        d = dict(s.data)
        if d["kind"] != "text":
            d["points"] = _points_for(s.data)
        out.append(d)
    return json.dumps(out)

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
    e.runToken++; // invalidate whatever run() call is currently awaiting the stuck worker
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

// No translate()/rotate() composition in this lesson -- every shape is a
// flat outline, extruded either the default thin amount or, if
// extrude() set one, a custom height. Centered on z either way, so
// it doesn't read as "sitting on" or "floating above" anything -- z isn't
// a concept this lesson otherwise uses.
function buildMesh(node, disposables) {
  const depth = node._extrudeHeight || 0.4;
  if (node.kind === "text") {
    const geometry = new TextGeometry(node.text, {
      font: fontCache.get("helvetiker"), size: node.size, depth, bevelEnabled: false,
    });
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const cx = (bbox.max.x + bbox.min.x) / 2;
    const cy = (bbox.max.y + bbox.min.y) / 2;
    geometry.translate(-cx + node.x, -cy + node.y, -depth / 2); // centered on (x, y) like CMU's Label
    disposables.push(geometry);
    return new THREE.Mesh(geometry, materialFor(node.fill, node.opacity));
  }
  const points = node.points.map(([x, y]) => new THREE.Vector2(x, y));
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);
  disposables.push(geometry);
  return new THREE.Mesh(geometry, materialFor(node.fill, node.opacity));
}

// The exercise checkers: given the parsed shape list from a run, return
// { pass, message }. A Rect always dumps 4 points; a Circle dumps 48 --
// that difference is all we need to tell them apart here.
const near = (a, b, tol = 0.4) => Math.abs(a - b) <= tol;
const CHECKERS = {
  ex1(shapes) {
    const rect = shapes.find((s) => s.points.length === 4);
    if (!rect) return { pass: false, message: "I don't see a Rect yet -- try calling Rect(...)." };
    const xs = rect.points.map((p) => p[0]), ys = rect.points.map((p) => p[1]);
    const left = Math.min(...xs), top = Math.min(...ys);
    const width = Math.max(...xs) - left, height = Math.max(...ys) - top;
    if (!near(left, 1) || !near(top, 1) || !near(width, 4) || !near(height, 3)) {
      return { pass: false, message: "Check the Rect: left=1, top=1, width=4, height=3." };
    }
    const circle = shapes.find((s) => s.points.length > 4);
    if (!circle) return { pass: false, message: "The Rect looks right! Now add a Circle too." };
    const cxs = circle.points.map((p) => p[0]), cys = circle.points.map((p) => p[1]);
    const cx = (Math.max(...cxs) + Math.min(...cxs)) / 2;
    const cy = (Math.max(...cys) + Math.min(...cys)) / 2;
    const r = (Math.max(...cxs) - Math.min(...cxs)) / 2;
    if (!near(cx, -3) || !near(cy, -3) || !near(r, 2)) {
      return { pass: false, message: "Check the Circle: centered at (-3, -3) with radius 2." };
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
    this.rotatable = container.dataset.rotatable === "true";
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

  // A locked-down, top-down orthographic camera instead of the free-orbit
  // perspective camera the other lessons use -- this lesson is about a
  // flat page, not a 3D scene, so the viewer should actually look flat.
  // The vertical flip (world +y renders toward the bottom of the screen,
  // matching Rect's "top" corner and this lesson's own "y increases down"
  // explanation) comes from swapping top/bottom in the frustum itself,
  // not from fighting the camera's up-vector -- that avoids any gimbal
  // weirdness from looking straight down an axis that's also "up."
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe9edf1);
    this.viewSize = 10;
    this.camera = new THREE.OrthographicCamera(-10, 10, -10, 10, 0.1, 100);
    if (this.rotatable) {
      // OrbitControls fixes its orbit axis from camera.up at construction
      // time, so the extrude() preview -- the one embed that
      // actually rotates -- needs z-up set before that happens, same
      // convention as the other two lessons' free-orbit viewers. Starting
      // from an angled 3/4 view (not straight down) avoids the gimbal
      // case entirely, so there's no need for the flipped-frustum y-down
      // trick here either -- that's specific to the locked top-down view.
      this.camera.up.set(0, 0, 1);
      this.camera.position.set(6, -6, 5);
    } else {
      this.camera.position.set(0, 0, 50);
    }
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.viewerEl.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // The extrude() preview is the one embed on this page where
    // seeing height actually matters -- a locked top-down view can't show
    // it at all, so that one embed alone gets to rotate like a normal 3D
    // viewer (data-rotatable="true" on its markup).
    this.controls.enableRotate = this.rotatable;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minZoom = 0.3;
    this.controls.maxZoom = 8;
    this.controls.mouseButtons = this.rotatable
      ? { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
      : { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.position.set(0, 0, 20);
    this.scene.add(sun);
    const grid = new THREE.GridHelper(20, 20, 0xbbbbbb, 0xdddddd);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.21;
    this.scene.add(grid);
    this.scene.add(new THREE.AxesHelper(2));
    for (let i = -8; i <= 8; i += 2) {
      if (i === 0) continue;
      const xTick = makeTickSprite(String(i));
      xTick.position.set(i, -0.6, 0.02);
      this.scene.add(xTick);
      const yTick = makeTickSprite(String(i));
      yTick.position.set(-0.6, i, 0.02);
      this.scene.add(yTick);
    }
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  resize() {
    const w = this.viewerEl.clientWidth, h = this.viewerEl.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const H = this.viewSize;
    this.camera.left = -H * aspect;
    this.camera.right = H * aspect;
    // top/bottom swapped on purpose for the locked top-down view -- see
    // the note above setupScene(). The rotatable preview uses a normal,
    // unflipped frustum, since it isn't trying to hold a fixed y-down
    // top-down illusion in the first place.
    this.camera.top = this.rotatable ? H : -H;
    this.camera.bottom = this.rotatable ? -H : H;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
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
  // be mutated in place; calling Rect()/Circle() again just adds to what's
  // there.
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
      this.group.add(buildMesh(node, this.disposables));
    }
  }

  ready() {
    this.runBtn.disabled = false;
    this.stopBtn.disabled = false;
    this.statusEl.textContent = "Ready -- click Run";
  }
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
  sprite.scale.set(0.9, 0.45, 1);
  return sprite;
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

// Assigned inside main(), after embeds are built -- see the note there
// for why initLessonProgress() can't run before that.
let progress;

// One font, loaded once, eagerly -- this lesson's Label() doesn't take a
// font= choice, so there's nothing to lazy-load on demand the way Studio
// does for its multiple font families.
const fontCache = new Map();
function loadDefaultFont() {
  return new Promise((resolve, reject) => {
    const url = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r186/examples/fonts/helvetiker_regular.typeface.json";
    new FontLoader().load(url, (loaded) => { fontCache.set("helvetiker", loaded); resolve(); }, undefined, reject);
  });
}

async function main() {
  setupQuizzes();
  embeds = [...document.querySelectorAll("[data-embed]")].map((el) => new Embed(el));
  // Must run after the line above: Embed's buildDom() replaces each
  // embed's innerHTML, which would silently wipe out a checkpoint-lock
  // overlay (and its "I already know this" skip button) added to an
  // exercise checkpoint any earlier -- exercises are [data-embed]
  // elements Embed rebuilds; quizzes aren't, so this only ever bit
  // exercise checkpoints, and only when one was locked at page load.
  progress = initLessonProgress("shapes", ["coords", "rectcall", "circle", "ex1"]);
  worker = new PyodideWorker(PYODIDE_URL, MINI_SHIM);
  await Promise.all([worker.ready(), loadDefaultFont()]);
  embeds.forEach((e) => e.ready());
}
main();
</script>
