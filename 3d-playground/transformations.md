---
layout: minimal
title: "Transformations"
permalink: /3d-playground/transformations/
---

<div class="lesson-crumbs">
  <a href="{{ '/3d-playground/' | relative_url }}">&larr; 3D Playground</a>
  &middot;
  <a href="{{ '/3d-playground/intro/' | relative_url }}">&larr; Position and Size</a>
</div>

<div class="lesson" markdown="1">

# Transformations

## Meet the Cylinder

Everything from the last lesson (position, size, `align=`, `center=`) works
exactly the same for a new shape: `Cylinder(radius, height, x=0, y=0,
z=0)`. Same base-at-z, centered-on-x/y rule as `Box`. Try it:

<div class="embed" data-embed="cyl">
<textarea class="embed-code">Cylinder(1.5, 4)</textarea>
</div>

We're using a cylinder for this lesson on purpose, not just for variety.
A box that's rotated often looks almost the same as before, especially if
it's close to a cube. A cylinder standing up and a cylinder lying down
look nothing alike, so it's much easier to actually see what a
transformation did.

## Turning Things: rotate()

`rotate(shape, angle, axis="z")` takes a shape and gives back a new,
rotated one. `angle` is in degrees. `axis` is `"x"`, `"y"`, or `"z"` --
which direction you're turning around.

<div class="embed" data-embed="rotate1">
<textarea class="embed-code">standing = Cylinder(1, 4)
rotate(standing, 90, axis="y")</textarea>
</div>

Notice `standing` never shows up on its own here. That's on purpose:
`rotate()` *consumes* the shape you give it, the same way you'd expect if
you handed someone a piece of paper and they folded it -- you don't also
still have an unfolded copy. Only the result of `rotate(...)` renders.

<div class="quiz" data-quiz="rotate-z" data-answer="same">
  <p class="quiz-prompt">If you rotate a standing cylinder 90&deg; around <code>axis="z"</code>, what happens to how it looks?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="falls">It falls on its side</button>
    <button class="quiz-option" data-key="same">Nothing visible changes</button>
    <button class="quiz-option" data-key="taller">It gets taller</button>
    <button class="quiz-option" data-key="gone">It disappears</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

Try it yourself below before reading on.

<div class="embed" data-embed="rotate-z-demo">
<textarea class="embed-code">rotate(Cylinder(1, 4), 90, axis="z")</textarea>
</div>

A standing cylinder's own axis *is* `z`. Spinning something around its own
axis doesn't change its silhouette at all -- it's the same reason spinning
a can of soup in place doesn't make it look any different, even though it
really is turning. This is worth remembering: rotating around the axis a
shape is already lined up with is often invisible.

## Moving Things: translate()

You already know how to move a shape: give `Box`/`Cylinder` their own
`x=`/`y=`/`z=`. So why would you ever need `translate(shape, x=0, y=0,
z=0)` too?

Because once you've rotated something, its own sense of "up" has changed.
A cylinder lying on its side doesn't have a clean `z=` to lift it off the
ground with any more -- its height now runs sideways. `translate()` moves
the *finished* shape in the scene's real x/y/z, no matter what it's been
rotated into.

<div class="embed" data-embed="translate1">
<textarea class="embed-code">lying = rotate(Cylinder(1, 4), 90, axis="y")
translate(lying, z=1)</textarea>
</div>

## Order Matters

`translate()` and `rotate()` nest like any other function calls, and like
CMU's own nested function calls, the inside runs first. That means
`translate(rotate(shape, 90, axis="x"), z=3)` and `rotate(translate(shape,
z=3), 90, axis="x")` are **not** the same thing, even though they use the
exact same two operations.

<div class="embed" data-embed="order1">
<textarea class="embed-code">a = translate(rotate(Cylinder(1, 3), 90, axis="x"), z=3)
b = rotate(translate(Cylinder(1, 3, x=4), z=3), 90, axis="x")</textarea>
</div>

Run that, then look closely at `a` and `b`. Try swapping which one has
`x=4` if you want to line them up side by side for an easier comparison.

<div class="quiz" data-quiz="order" data-answer="lift-then-tip">
  <p class="quiz-prompt"><code>translate(rotate(cyl, 90, axis="x"), z=3)</code> -- which happens first?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="move-then-tip">It moves up to z=3, then tips onto its side</button>
    <button class="quiz-option" data-key="lift-then-tip">It tips onto its side, then the whole thing lifts to z=3</button>
    <button class="quiz-option" data-key="same-thing">Both orders always look the same</button>
  </div>
  <p class="quiz-feedback"></p>
</div>

## Checking Your Work

<div class="exercise">
  <p class="exercise-prompt">
    <strong>Exercise:</strong> build a cylinder that's lying down instead
    of standing up (its long axis running sideways, not vertically). Any
    axis, any position -- just make it lie down.
  </p>
  <div class="embed" data-embed="ex2" data-check="ex2">
  <textarea class="embed-code">Cylinder(1, 3)</textarea>
  </div>
</div>

## Practice

That's rotate(), translate(), and how they compose. Two more things worth
knowing, both in the cheatsheet if you want the details:

- `Cylinder` also takes `segments=`, which controls how many flat faces
  approximate its curved side -- try `segments=6` sometime for a hexagonal
  prism instead of a smooth cylinder.
- `rotate()` can also take a list of three angles instead of one angle and
  an axis: `rotate(shape, [30, 0, 45])` rotates around x, then y, then z,
  all in one call. Everything in this lesson used the `angle, axis="x"`
  form on purpose, since it doesn't require knowing what a list is yet --
  but if you've used lists before, the list form is there when you want
  more than one axis at once.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/3d-playground/studio/' | relative_url }}">
    <strong>Open the Studio &rarr;</strong>
    <span>Everything from both lessons, plus union/difference, fillets, and more.</span>
  </a>
  <a class="playground-card" href="{{ '/3d-playground/cheatsheet/' | relative_url }}">
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
  .embed-reset {
    font: inherit;
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    background: white;
    color: #57606a;
    cursor: pointer;
  }
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
  .embed-viewer {
    position: relative;
    height: 260px;
    border-top: 1px solid #d0d7de;
    background: #e9edf1;
  }
  .embed-viewer canvas { display: block; }

  .quiz {
    margin: 1.4em 0;
    padding: 14px 16px;
    border-left: 5px solid #8b5cf6;
    background: #f5f3ff;
    border-radius: 0 8px 8px 0;
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
</style>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
  }
}
</script>
<script src="https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js"></script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ViewHelper } from "three/addons/helpers/ViewHelper.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";

const MINI_SHIM = `
_registry = []

class Solid:
    def __init__(self, data):
        self.data = data
        _registry.append(self)

def _consume(solid):
    if solid in _registry:
        _registry.remove(solid)

SEGMENTS = 32

def Box(width, depth, height, x=0, y=0, z=0, fill=None, align="center", center=False):
    return Solid({
        "type": "box", "width": width, "depth": depth, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
    })

def Cylinder(radius, height, x=0, y=0, z=0, fill=None, align="center", center=False, segments=None):
    return Solid({
        "type": "cylinder", "radius": radius, "height": height,
        "x": x, "y": y, "z": z, "fill": fill, "align": align, "center": center,
        "segments": SEGMENTS if segments is None else segments,
    })

def translate(solid, x=0, y=0, z=0):
    _consume(solid)
    return Solid({
        "type": "translate", "x": x, "y": y, "z": z,
        "child": solid.data, "fill": solid.data.get("fill"),
    })

def rotate(solid, angle, axis="z"):
    _consume(solid)
    data = {"type": "rotate", "child": solid.data, "fill": solid.data.get("fill")}
    if isinstance(angle, (list, tuple)):
        data["mode"] = "vector"
        data["angles"] = list(angle)
    else:
        data["mode"] = "axis"
        data["angle"] = angle
        data["axis"] = axis
    return Solid(data)

def _reset():
    global SEGMENTS
    SEGMENTS = 32
    _registry.clear()

def _dump():
    import json
    return json.dumps([s.data for s in _registry])
`;

let pyodide;
const material = new THREE.MeshStandardMaterial({ color: 0x2a7ae2 });
const materialCache = new Map();
function materialFor(fill) {
  if (!fill) return material;
  if (!materialCache.has(fill)) {
    materialCache.set(fill, new THREE.MeshStandardMaterial({ color: new THREE.Color(fill) }));
  }
  return materialCache.get(fill);
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
// into the accumulated matrix in buildMesh() below, which is what lets
// translate()/rotate() wrap a shape correctly: the wrapper's transform
// has to apply as one combined matrix, not separate position/rotation
// properties, or nesting them would compose in the wrong order.
function buildGeometry(node) {
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
  return new THREE.Mesh(geometry, materialFor(node.fill));
}

// Robust to *how* a shape ends up lying down (which axis, which order it
// was composed in) -- checks the visible result instead of one specific
// code path, since several different answers are equally correct here.
// Compares against the cylinder's own declared height/radius rather than a
// fixed ratio: a fixed threshold (e.g. "z-extent under 60% of the rest")
// silently fails for dimensions where height and diameter aren't that far
// apart (radius=1, height=3 is only a 2:3 ratio), which is exactly the
// starter code here.
function findLeaf(node) {
  while (node.child) node = node.child;
  return node;
}
const CHECKERS = {
  ex2(shapes, group) {
    const cylinderNode = shapes.map(findLeaf).find((n) => n.type === "cylinder");
    if (!cylinderNode) return { pass: false, message: "I don't see a Cylinder yet." };
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const stillStanding = Math.abs(size.z - cylinderNode.height) < Math.max(0.3, cylinderNode.height * 0.15);
    if (stillStanding) return { pass: false, message: "That's still standing up -- try wrapping it in rotate()." };
    return { pass: true, message: "Nice, it's lying down!" };
  },
};

class Embed {
  constructor(container) {
    this.container = container;
    const seedTextarea = container.querySelector(".embed-code");
    this.starterCode = seedTextarea.value;
    this.checkerName = container.dataset.check;
    this.disposables = [];
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

    const toolbar = document.createElement("div");
    toolbar.className = "embed-toolbar";

    this.runBtn = document.createElement("button");
    this.runBtn.className = "embed-run";
    this.runBtn.textContent = "Run";
    this.runBtn.disabled = true;
    toolbar.appendChild(this.runBtn);

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
    container.appendChild(this.viewerEl);

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
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.style.display = "block";
  }
  clearError() {
    this.errorEl.style.display = "none";
  }

  run() {
    this.clearError();
    try {
      pyodide.runPython("_reset()");
      pyodide.runPython(this.codeEl.value);
      this.lastShapes = JSON.parse(pyodide.runPython("_dump()"));
      this.rebuild(this.lastShapes);
    } catch (err) {
      this.lastShapes = null;
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
        } else {
          btn.classList.add("incorrect");
          feedback.textContent = "Not quite -- try another one.";
          feedback.className = "quiz-feedback incorrect";
        }
      });
    });
  });
}

async function main() {
  setupQuizzes();
  const embeds = [...document.querySelectorAll("[data-embed]")].map((el) => new Embed(el));
  pyodide = await loadPyodide();
  pyodide.runPython(MINI_SHIM);
  embeds.forEach((e) => e.ready());
}
main();
</script>
