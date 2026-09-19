---
layout: minimal
title: "Position and Size"
permalink: /3d-playground/intro/
---

<div class="lesson-crumbs">
  <a href="{{ '/3d-playground/' | relative_url }}">&larr; 3D Playground</a>
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

If you've used a 2D canvas before, this is a little different: there,
`y` increased as you went *down*, and `(0, 0)` was the top-left corner.
Here, up is a real direction, so `z` takes over that job, and `x`/`y`
share the flat ground, centered on zero instead of starting in a corner.

<div class="quiz" data-quiz="up" data-answer="up">
  <p class="quiz-prompt">If you increase a shape's <code>z</code> value, which way does it move?</p>
  <div class="quiz-options">
    <button class="quiz-option" data-key="up">Up</button>
    <button class="quiz-option" data-key="down">Down</button>
    <button class="quiz-option" data-key="right">Right</button>
    <button class="quiz-option" data-key="toward">Toward you</button>
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
    <button class="quiz-option" data-key="a"><code>Box(4, 4, 10, x=3)</code></button>
    <button class="quiz-option" data-key="b"><code>Box(4, 4, 10, z=3)</code></button>
    <button class="quiz-option" data-key="c"><code>Box(4, 10, 4, x=3)</code></button>
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
  <div class="embed" data-embed="ex1" data-check="ex1">
  <textarea class="embed-code">Box(1, 1, 1)</textarea>
  </div>
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

That's it for the basics! From here, head to the Studio to build
something of your own, or keep the Cheatsheet open while you work.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/3d-playground/studio/' | relative_url }}">
    <strong>Open the Studio &rarr;</strong>
    <span>Write Python on the left, watch the model update live on the right.</span>
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

  /* ---- embedded runnable widget ---- */
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
  .embed-status {
    font-size: 0.8rem;
    color: #57606a;
    margin-left: auto;
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

  /* ---- checkpoint quiz ---- */
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
<script src="https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js"></script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MINI_SHIM = `
_shapes = []

def Box(width, depth, height, x=0, y=0, z=0):
    _shapes.append({
        "type": "box", "width": width, "depth": depth, "height": height,
        "x": x, "y": y, "z": z,
    })

def Cylinder(radius, height, x=0, y=0, z=0):
    _shapes.append({
        "type": "cylinder", "radius": radius, "height": height,
        "x": x, "y": y, "z": z,
    })

def _reset():
    _shapes.clear()

def _dump():
    import json
    return json.dumps(_shapes)
`;

let pyodide;
const material = new THREE.MeshStandardMaterial({ color: 0x2a7ae2 });

function buildGeometry(node) {
  if (node.type === "box") {
    const g = new THREE.BoxGeometry(node.width, node.depth, node.height);
    g.translate(0, 0, node.height / 2);
    return g;
  }
  if (node.type === "cylinder") {
    const g = new THREE.CylinderGeometry(node.radius, node.radius, node.height, 32);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, node.height / 2);
    return g;
  }
  return null;
}

// The exercise checkers: given the parsed shape list from a run, return
// { pass, message }. Kept deliberately simple -- just enough to check the
// one or two properties an exercise is actually about.
const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;
const CHECKERS = {
  ex1(shapes) {
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
    this.scene.add(new THREE.AxesHelper(2));
    this.group = new THREE.Group();
    this.scene.add(this.group);
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
    const result = checker(this.lastShapes);
    this.feedbackEl.className = "check-feedback " + (result.pass ? "pass" : "fail");
    this.feedbackEl.textContent = result.message;
  }

  rebuild(shapes) {
    for (const child of [...this.group.children]) this.group.remove(child);
    for (const g of this.disposables) g.dispose();
    this.disposables = [];
    for (const node of shapes) {
      const geometry = buildGeometry(node);
      if (!geometry) continue;
      this.disposables.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
      this.group.add(mesh);
    }
  }

  ready() {
    this.runBtn.disabled = false;
    this.statusEl.textContent = "Ready";
    this.run();
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
