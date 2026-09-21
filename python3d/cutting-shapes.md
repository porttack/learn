---
layout: minimal
title: "Cutting Shapes"
permalink: /python3d/cutting-shapes/
---

<div class="lesson-crumbs">
  <a href="{{ '/python3d/' | relative_url }}">&larr; Python in 3D</a>
  &middot;
  <a href="{{ '/python3d/combining-shapes/' | relative_url }}">&larr; Combining Shapes</a>
</div>

<div class="lesson" markdown="1">

# Cutting Shapes

## Why Cut Shapes

Last lesson was about combining shapes into one. Sometimes you want the
opposite: cut a shape *out* of another one. `difference(base, *subtract)`
starts with `base` and removes every shape listed after it.

<div class="embed" data-embed="first">
<textarea class="embed-code">difference(Box(3, 3, 2), Cylinder(0.6, 3, z=-0.5))</textarea>
</div>

That's a block with a cylindrical hole drilled straight through it.

## Drilling a Hole, the Short Way

Drilling a hole is such a common thing to want that there's a shortcut:
`hole=True`.

<div class="embed" data-embed="hole-demo">
<textarea class="embed-code">Box(3, 3, 2, fill="orange")
Cylinder(0.6, 3, z=-0.5, hole=True)</textarea>
</div>

Same result as the `difference()` example above, without writing
`difference()` yourself. `hole=True` marks a shape as "not really there" --
at the very end, every hole-marked shape gets subtracted from everything
else in the scene.

<div class="quiz" data-quiz="hole-shortcut" data-answer="drilled">
  <p class="quiz-prompt"><code>Box(3, 3, 2)</code> and <code>Cylinder(0.6, 3, z=-0.5, hole=True)</code> on two separate lines, not wrapped in <code>difference()</code>. What do you see?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="bump">A block with a solid cylinder poking through it</button>
    <button class="quiz-option" data-key="drilled">A block with a hole drilled through it</button>
    <button class="quiz-option" data-key="justblock">Just the block -- the hole-marked cylinder does nothing else</button>
    <button class="quiz-option" data-key="justcyl">Just the cylinder</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Cutting in Place

`a.subtract(b)` cuts `b` out of `a`, in place -- the same idea as
`a.add(b)` from the last lesson, just removing instead of adding.
`a -= b` means the same thing.

<div class="embed" data-embed="subtract-method">
<textarea class="embed-code">a = Box(3, 3, 2, fill="green")
a -= Cylinder(0.6, 3, z=-0.5)</textarea>
</div>

Notice this one doesn't need `hole=True` at all -- you already have both
shapes in hand, so you can cut directly.

<div class="quiz" data-quiz="subtract-vs-minus" data-answer="same-object">
  <p class="quiz-prompt"><code>a = Box(3, 3, 2)</code>, then <code>a -= Cylinder(0.6, 3, z=-0.5)</code>. What best describes what just happened?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="new-object">a is a brand new object now; the old box is gone</button>
    <button class="quiz-option" data-key="same-object">a is the exact same object as before, just with the cylinder's shape removed from it</button>
    <button class="quiz-option" data-key="second-var">This makes a second variable, also named a</button>
    <button class="quiz-option" data-key="nothing">Nothing happens until you also call difference() again</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## A Hole Stays a Hole, However You Combine It

`hole=True` means the same thing everywhere, not just for a shape left
completely on its own. If you `+`/`union()` a hole-marked shape together
with a regular one, the hole still gets cut out of the regular one, right
away -- `+`/`union()`/`add()` check whether an ingredient is a hole
before deciding what to do with it, instead of just gluing everything
together no matter what.

<div class="embed" data-embed="surprise">
<textarea class="embed-code">block = Box(4, 4, 2, fill="orange")
peg = Cylinder(0.5, 3, z=-0.5, hole=True)
combo = block + peg</textarea>
</div>

<div class="quiz" data-quiz="hole-surprise" data-answer="drilled">
  <p class="quiz-prompt"><code>block = Box(4, 4, 2)</code>, <code>peg = Cylinder(0.5, 3, z=-0.5, hole=True)</code>, then <code>combo = block + peg</code>. What does combo actually look like?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="drilled">A block with a hole drilled through it</button>
    <button class="quiz-option" data-key="bump">A block with a solid bump sticking out</button>
    <button class="quiz-option" data-key="unchanged">Just the block, completely unchanged</button>
    <button class="quiz-option" data-key="error">An error -- you can't combine a hole with a non-hole</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

This works no matter which side does the combining -- `block + peg`,
`peg + block`, `union(block, peg)`, and `block.add(peg)` (or
`block += peg`) all cut the same hole, because each of those checks its
ingredients for `hole=True` first. The one operation that *always* cuts,
whether or not anything involved is marked `hole=True`, is the explicit
`difference(block, peg)` / `block -= peg` -- reach for that when you want
the cut to happen no matter how `peg` was built.

## Bonus: A Third Operation

There's one more boolean operation worth knowing about:
`intersection(*shapes)` keeps *only* the part where every shape overlaps
-- not everything combined (`union`), not one thing with pieces removed
(`difference`), just the shared middle.

<div class="embed" data-embed="intersection-demo">
<textarea class="embed-code">intersection(Box(3, 3, 3, x=-1), Cylinder(1.5, 4, z=-2))</textarea>
</div>

That comes out as a partial cylinder, sliced flat on one side. Shifting
the box over means only part of the cylinder's circular cross-section
still overlaps it -- the piece sticking out past the box's edge is gone,
along with the top and bottom the two shapes don't share in z.
`intersection()` keeps only what's inside *every* shape at once, in
every direction, not just height. It's in the Cheatsheet and the Studio
if you want to explore it further -- this course doesn't test you on it,
since `union()` and `difference()` alone already cover almost everything
you'll want to build.

## Checking Your Work

<div class="exercise">
  <p class="exercise-prompt">
    <strong>Exercise:</strong> build a block with a hole drilled through
    it. Use <code>hole=True</code>, or <code>difference()</code>/
    <code>-=</code> directly -- whichever you like.
  </p>
  <div class="embed" data-embed="ex5" data-check="ex5">
  <textarea class="embed-code">Box(3, 3, 2)</textarea>
  </div>
</div>

## Match the Shape

One more, just for fun. Here's a shape to reproduce. Flip to "Solution"
to see it from any angle (spin it, zoom in), then flip back to "Your
Code" and try to build the same thing. Flip back and forth as often as
you want. "Check My Work" is loose on purpose here -- it just checks that
this generally looks like a table, not that it matches the solution
exactly, so there's more than one right answer.

<div class="match-shape">
  <div class="match-tabs">
    <button class="match-tab active" data-tab="code" type="button">Your Code</button>
    <button class="match-tab" data-tab="solution" type="button">Solution</button>
  </div>
  <div class="embed" data-embed="match-table" data-check="match-table">
  <textarea class="embed-code"># A simple table. Add the four legs!
top = Box(4, 4, 0.3, z=2)</textarea>
  </div>
  <div class="embed" data-embed="match-table-solution" data-solution="true" hidden>
  <textarea class="embed-code">top = Box(4, 4, 0.3, z=2)
leg1 = Cylinder(0.2, 2, x=-1.6, y=-1.6)
leg2 = Cylinder(0.2, 2, x=1.6, y=-1.6)
leg3 = Cylinder(0.2, 2, x=-1.6, y=1.6)
leg4 = Cylinder(0.2, 2, x=1.6, y=1.6)
union(top, leg1, leg2, leg3, leg4)</textarea>
  </div>
</div>

## Practice

That's `difference()`, `hole=` as its shortcut, cutting in place with
`subtract()`/`-=`, why `hole=True` doesn't affect `+`/`union()`, and a
peek at `intersection()`. Between this lesson and the last, you can now
combine and cut shapes -- everything you need to build genuinely
complicated objects out of simple pieces.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/python3d/rotate-extrude/' | relative_url }}">
    <strong>Advanced: Shapes of Revolution &rarr;</strong>
    <span>Optional bonus lesson. rotate_extrude() -- spin a profile around an axis, like a potter's wheel.</span>
  </a>
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
  /* Both set an explicit display above, which (at equal specificity)
     beats the browser's default [hidden] rule since author styles win --
     so a bare .hidden = true is a no-op for either without this. */
  .embed-code[hidden], .embed-toolbar[hidden] { display: none; }
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

  .match-shape { margin: 1.2em 0; }
  .match-tabs { display: flex; gap: 8px; margin-bottom: 8px; }
  .match-tab {
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: #fff;
    color: #57606a;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .match-tab:hover { border-color: #2a7ae2; color: #2a7ae2; }
  .match-tab.active { background: #2a7ae2; border-color: #2a7ae2; color: #fff; }
</style>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/",
    "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.9.15/build/index.module.js",
    "three-bvh-csg": "https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.18/build/index.module.js"
  }
}
</script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ViewHelper } from "three/addons/helpers/ViewHelper.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from "three-bvh-csg";

const MINI_SHIM = `
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

    # add()/subtract() grow or cut a shape in place -- mutating the same
    # dict (not replacing it) so anything that already wrapped it keeps
    # seeing updates, same rule shape.x += 3 relies on. + / - make a new
    # shape (delegate to union()/difference()); += / -= mutate in place
    # instead, via Python's own separate __iadd__/__isub__ protocol.
    # other is snapshotted (a plain dict copy) before being consumed, so
    # changing other afterward can't reach back into what it was
    # added/subtracted.
    #
    # add() checks other's own hole flag rather than ignoring it: a
    # hole-marked shape gets cut into self instead of glued on, same rule
    # union() uses below. subtract() always cuts regardless of other's own
    # hole flag -- it's already the explicit "cut this" operation, so
    # there's no ambiguity to resolve.
    def add(self, other):
        snapshot = dict(other.data)
        _consume(other)
        self._fold(snapshot, as_hole=bool(snapshot.get("hole")))
    def subtract(self, other):
        snapshot = dict(other.data)
        _consume(other)
        self._fold(snapshot, as_hole=True)
    def _fold(self, snapshot, as_hole):
        data = self.__dict__["data"]
        if as_hole:
            if data.get("type") != "difference":
                original = dict(data)
                data.clear()
                data.update({
                    "type": "difference", "base": original, "subtract": [snapshot],
                    "fill": original.get("fill"), "opacity": original.get("opacity", 100),
                    "hole": original.get("hole", False), "visible": original.get("visible", True),
                })
            else:
                data["subtract"].append(snapshot)
        else:
            if data.get("type") != "union":
                original = dict(data)
                data.clear()
                data.update({
                    "type": "union", "children": [original],
                    "fill": original.get("fill"), "opacity": original.get("opacity", 100),
                    "hole": original.get("hole", False), "visible": original.get("visible", True),
                })
            data["children"].append(snapshot)
    def __add__(self, other):
        return union(self, other)
    def __sub__(self, other):
        return difference(self, other)
    def __iadd__(self, other):
        self.add(other)
        return self
    def __isub__(self, other):
        self.subtract(other)
        return self

# Consuming a shape never removes it or destroys it -- it just sets its
# own .visible to False (same property CMU shapes use). The new combined
# result always gets a fresh COPY of the shape's data instead, so the
# original becomes an orphan holding stale data nothing else points to.
def _consume(solid):
    solid.data["visible"] = False

def Box(width, depth, height, x=0, y=0, z=0, fill=None, align="center", center=False, opacity=100, hole=False):
    return Solid({
        "type": "box", "width": width, "depth": depth, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
        "opacity": opacity, "hole": hole, "visible": True,
    })

def Cylinder(radius, height, x=0, y=0, z=0, fill=None, align="center", center=False, segments=32, opacity=100, hole=False):
    return Solid({
        "type": "cylinder", "radius": radius, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
        "segments": segments, "opacity": opacity, "hole": hole, "visible": True,
    })

def translate(solid, x=0, y=0, z=0):
    snapshot = dict(solid.data)
    _consume(solid)
    return Solid({
        "type": "translate", "x": x, "y": y, "z": z,
        "child": snapshot, "fill": snapshot.get("fill"),
        "opacity": snapshot.get("opacity", 100), "visible": True,
    })

def rotate(solid, angle, axis="z"):
    snapshot = dict(solid.data)
    _consume(solid)
    data = {
        "type": "rotate", "child": snapshot, "fill": snapshot.get("fill"),
        "opacity": snapshot.get("opacity", 100), "visible": True,
    }
    if isinstance(angle, (list, tuple)):
        data["mode"] = "vector"
        data["angles"] = list(angle)
    else:
        data["mode"] = "axis"
        data["angle"] = angle
        data["axis"] = axis
    return Solid(data)

def union(*solids, fill=None, opacity=None, hole=False):
    snapshots = [dict(s.data) for s in solids]
    for s in solids:
        _consume(s)
    inherit_fill = snapshots[0].get("fill") if snapshots else None
    inherit_opacity = snapshots[0].get("opacity", 100) if snapshots else 100
    resolved_fill = fill if fill is not None else inherit_fill
    resolved_opacity = opacity if opacity is not None else inherit_opacity

    # union() looks at what it was actually given rather than blindly
    # gluing geometry together no matter what: a mix of hole and non-hole
    # children cuts the holes into the non-hole parts right now (same as
    # calling difference() yourself); an all-hole group of children stays
    # a hole -- just a bigger one, ready to cut whatever it ends up near
    # later, the same idea union(*shapes, hole=True) already supports
    # explicitly. Every node here already carries its own "hole" field,
    # compound ones included, so this is a shallow check, not a tree walk.
    hole_parts = [s for s in snapshots if s.get("hole")]
    solid_parts = [s for s in snapshots if not s.get("hole")]

    if hole_parts and solid_parts:
        base = solid_parts[0] if len(solid_parts) == 1 else {
            "type": "union", "children": solid_parts,
            "fill": resolved_fill, "opacity": resolved_opacity, "visible": True,
        }
        return Solid({
            "type": "difference", "base": base, "subtract": hole_parts,
            "fill": resolved_fill, "opacity": resolved_opacity,
            "hole": hole, "visible": True,
        })
    if hole_parts and not solid_parts:
        return Solid({
            "type": "union", "children": snapshots,
            "fill": resolved_fill, "opacity": resolved_opacity,
            "hole": True, "visible": True,
        })
    return Solid({
        "type": "union", "children": snapshots,
        "fill": resolved_fill, "opacity": resolved_opacity,
        "hole": hole, "visible": True,
    })

def difference(base, *subtract, fill=None, opacity=None, hole=False):
    base_snapshot = dict(base.data)
    subtract_snapshots = [dict(s.data) for s in subtract]
    _consume(base)
    for s in subtract:
        _consume(s)
    resolved_fill = fill if fill is not None else base_snapshot.get("fill")
    resolved_opacity = opacity if opacity is not None else base_snapshot.get("opacity", 100)
    return Solid({
        "type": "difference", "base": base_snapshot, "subtract": subtract_snapshots,
        "fill": resolved_fill, "opacity": resolved_opacity, "hole": hole, "visible": True,
    })

def intersection(*solids, fill=None, opacity=None, hole=False):
    snapshots = [dict(s.data) for s in solids]
    for s in solids:
        _consume(s)
    inherit_fill = snapshots[0].get("fill") if snapshots else None
    inherit_opacity = snapshots[0].get("opacity", 100) if snapshots else 100
    return Solid({
        "type": "intersection", "children": snapshots,
        "fill": fill if fill is not None else inherit_fill,
        "opacity": opacity if opacity is not None else inherit_opacity,
        "hole": hole, "visible": True,
    })

def _reset():
    # Every real Run gets a genuinely fresh namespace, not just an empty
    # shape registry -- see studio.html for why (a stale onKeyPress/onNext
    # from a previous run would otherwise keep responding).
    _registry.clear()
    for name in list(globals().keys()):
        if name not in _BASE_NAMES:
            del globals()[name]

def _dump():
    # A hole-marked shape isn't drawn on its own -- it's subtracted from
    # every other (non-hole) shape at the very end. Each solid is cut
    # independently so unrelated solids keep their own colors. Consumed
    # shapes stay in _registry (see _consume()) but with visible=False, so
    # they're filtered out here rather than never having been removed.
    import json
    live = [s.data for s in _registry if s.data.get("visible", True)]
    holes = [s for s in live if s.get("hole")]
    solids = [s for s in live if not s.get("hole")]
    if holes:
        result = [
            {
                "type": "difference", "base": solid, "subtract": holes,
                "fill": solid.get("fill"), "opacity": solid.get("opacity", 100),
            }
            for solid in solids
        ]
    else:
        result = solids
    return json.dumps(result)

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

// See studio.html for the full "Look From Any Angle" story (three real
// bugs, each verified via STL export or direct debugging, not just a
// screenshot). This page only ships the button, not the Alt-key
// alternative: a bare keydown has no way to know which of several
// embeds on one page it should apply to, so the button (already scoped
// to its own embed) is the only version that makes sense here, and it's
// the one that works on a touchscreen/trackpad-only Chromebook too.
const NORMAL_MAX_POLAR = Math.PI * 0.47;
const FREE_MAX_POLAR = Math.PI * 0.85;

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

function alignOffset(align, width, depth) {
  const a = align || "center";
  let ox = 0, oy = 0;
  if (a.includes("left")) ox = width / 2;
  else if (a.includes("right")) ox = -width / 2;
  if (a.includes("top")) oy = -depth / 2;
  else if (a.includes("bottom")) oy = depth / 2;
  return { ox, oy };
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

// Leaf geometry only -- align/center baked in, but not x/y/z. Those fold
// into the accumulated matrix in buildBrush() below, which is what lets
// translate()/rotate()/union()/difference() wrap a shape correctly: the
// wrapper's transform has to apply as one combined matrix, not separate
// position/rotation properties, or nesting them would compose wrong.
function buildLeafGeometry(node) {
  if (node.type === "box") {
    const g = new THREE.BoxGeometry(node.width, node.depth, node.height);
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
const evaluator = new Evaluator();
const CSG_OPS = { union: ADDITION, difference: SUBTRACTION, intersection: INTERSECTION };
let disposableGeometries = [];

function buildBrush(node, matrix = new THREE.Matrix4()) {
  if (node.type in CSG_OPS) {
    // union/intersection combine a flat list of children; difference
    // combines [base, ...subtract] -- everything after the first operand
    // is subtracted from it, not just consumed alongside it.
    const parts = node.type === "difference" ? [node.base, ...node.subtract] : node.children;
    const op = CSG_OPS[node.type];
    let result = buildBrush(parts[0], matrix);
    for (let i = 1; i < parts.length; i++) {
      const operand = buildBrush(parts[i], matrix);
      result = evaluator.evaluate(result, operand, op);
      disposableGeometries.push(result.geometry);
    }
    result.material = materialFor(node.fill, node.opacity);
    return result;
  }
  if (node.type === "translate") {
    const m = new THREE.Matrix4().makeTranslation(node.x || 0, node.y || 0, node.z || 0);
    return buildBrush(node.child, matrix.clone().multiply(m));
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
    return buildBrush(node.child, matrix.clone().multiply(m));
  }
  const geometry = buildLeafGeometry(node);
  const localOffset = new THREE.Matrix4().makeTranslation(node.x || 0, node.y || 0, node.z || 0);
  geometry.applyMatrix4(matrix.clone().multiply(localOffset));
  disposableGeometries.push(geometry);
  const brush = new Brush(geometry, materialFor(node.fill, node.opacity));
  brush.updateMatrixWorld();
  return brush;
}

// Whether a student used hole=True or difference()/-= directly, the
// dumped shape ends up the same either way: one top-level "difference"
// node. That's what makes one checker accept both approaches.
const CHECKERS = {
  ex5(shapes) {
    if (shapes.length !== 1 || shapes[0].type !== "difference") {
      return { pass: false, message: "I should see one shape with something cut out of it -- try hole=True or difference()/-= ." };
    }
    if (!shapes[0].subtract || shapes[0].subtract.length < 1) {
      return { pass: false, message: "I don't see anything being subtracted yet." };
    }
    return { pass: true, message: "Nice, that's a real hole!" };
  },
  // Loose on purpose -- this checks "does this look roughly like a
  // table," not "does this match the solution exactly." Leg count,
  // spacing, and exact proportions are all free to vary.
  "match-table"(shapes, group) {
    function countTypes(nodes) {
      let boxes = 0, cylinders = 0;
      function walk(n) {
        if (n.type === "box") boxes++;
        else if (n.type === "cylinder") cylinders++;
        for (const c of n.children || []) walk(c);
        if (n.base) walk(n.base);
        for (const c of n.subtract || []) walk(c);
        if (n.child) walk(n.child);
      }
      for (const n of nodes) walk(n);
      return { boxes, cylinders };
    }
    const { boxes, cylinders } = countTypes(shapes);
    if (boxes < 1) {
      return { pass: false, message: "I don't see a tabletop -- try a wide, flat Box()." };
    }
    if (cylinders < 3) {
      return { pass: false, message: `A table needs legs to stand on -- I only see ${cylinders} Cylinder(s). Try at least 3 or 4.` };
    }
    const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    if (size.z < 1) {
      return { pass: false, message: "This looks flat -- the legs should lift the top up off the ground." };
    }
    if (size.x < 2 || size.y < 2) {
      return { pass: false, message: "This looks small and narrow for a table -- try spreading the legs out more." };
    }
    return { pass: true, message: "That looks like a table! Nice work." };
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

  // See the button's own construction (buildDom) and studio.html's much
  // longer version of this same story. Re-centering the target on this
  // embed's own current model (not the world origin) is what keeps an
  // off-center shape from swinging out of frame entirely at the wider
  // angle -- see rebuild() below for why this also has to re-run after
  // every Run, not just on the initial toggle.
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
      this.group.add(buildBrush(node));
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

// A "Match the Shape" pair is two ordinary [data-embed] elements (so
// Embed builds and runs each one exactly like any other) -- the
// data-solution="true" one just gets its code/toolbar hidden and an
// automatic run, since the student never sees or clicks anything on it.
// Must run AFTER embeds are constructed, same reason initLessonProgress()
// below has to: Embed's buildDom() replaces the container's innerHTML,
// which would silently undo hiding done any earlier.
function setupMatchShapes(builtEmbeds) {
  document.querySelectorAll(".match-shape").forEach((wrap) => {
    const codeContainer = wrap.querySelector("[data-embed]:not([data-solution])");
    const solutionContainer = wrap.querySelector('[data-embed][data-solution="true"]');
    const solutionEmbed = builtEmbeds.find((e) => e.container === solutionContainer);
    if (solutionEmbed) {
      solutionEmbed.codeEl.hidden = true;
      solutionContainer.querySelector(".embed-toolbar").hidden = true;
    }
    const tabs = wrap.querySelectorAll(".match-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const showSolution = tab.dataset.tab === "solution";
        codeContainer.hidden = showSolution;
        solutionContainer.hidden = !showSolution;
      });
    });
  });
}

// Assigned inside main(), after embeds are built -- see the note there
// for why initLessonProgress() can't run before that.
let progress;

async function main() {
  setupQuizzes();
  embeds = [...document.querySelectorAll("[data-embed]")].map((el) => new Embed(el));
  // Must run after the line above: Embed's buildDom() replaces each
  // embed's innerHTML, which would silently wipe out a checkpoint-lock
  // overlay (and its "I already know this" skip button) added to an
  // exercise checkpoint any earlier -- exercises are [data-embed]
  // elements Embed rebuilds; quizzes aren't, so this only ever bit
  // exercise checkpoints, and only when one was locked at page load.
  progress = initLessonProgress("cutting-shapes", ["hole-shortcut", "subtract-vs-minus", "hole-surprise", "ex5"]);
  setupMatchShapes(embeds);
  worker = new PyodideWorker(PYODIDE_URL, MINI_SHIM);
  await worker.ready();
  embeds.forEach((e) => e.ready());
  embeds.forEach((e) => { if (e.container.dataset.solution === "true") e.run(); });
}
main();
</script>
