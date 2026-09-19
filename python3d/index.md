---
layout: minimal
title: "Python in 3D"
permalink: /python3d/
---

<div class="playground-landing" markdown="1">

# Python in 3D

You already know how to draw shapes in Python: a circle here, a rectangle
there, maybe a label with some text. This is the same idea, with one more
axis. Instead of drawing on a flat canvas, you're placing shapes in space.
Instead of pixels, what you build is a real 3D model you can spin around,
print, and hold.

<div class="playground-cards">
  <a class="playground-card" href="{{ '/python3d/intro/' | relative_url }}">
    <strong>Lesson 1: Start Here &rarr;</strong>
    <span>A short first lesson: position, size, and your first few boxes.</span>
  </a>
  <a class="playground-card" href="{{ '/python3d/transformations/' | relative_url }}">
    <strong>Lesson 2: Transformations &rarr;</strong>
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

## The idea in short

- `Box(...)` and `Cylinder(...)` are 3D shapes you already understand
  from their 2D cousins. They just also have a height now.
- `Rect`, `Circle`, `RegularPolygon`, `Polygon`, and `Label` are flat 2D
  shapes, exactly like the ones you've drawn before. Nothing shows up in
  3D until you push one up off the page with `linear_extrude(...)`.
- `union()`, `difference()`, and `intersection()` combine shapes: glue
  them together, cut one out of another, or keep only where they overlap.
- `hole=True` is a shortcut for the single most common thing you'll want
  to do, which is drilling a hole through something.
- When you're happy with it, Download STL gives you a file ready for a
  3D printer.

None of this needs to be memorized going in. The cheatsheet has the full
syntax for everything, and the Studio's starter code is already a working
example to poke at.

<p class="site-note">
This lives on <strong>learn.porttack.com</strong>, a small site of CS and
robotics teaching material. This page is just one part of it, so feel
free to look around.
</p>

</div>

<style>
  .playground-landing {
    max-width: 720px;
  }
  .playground-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 24px 0 32px;
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
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .playground-card:hover {
    border-color: #2a7ae2;
    box-shadow: 0 2px 10px rgba(42, 122, 226, 0.15);
  }
  .playground-card strong {
    color: #2a7ae2;
    font-size: 1.05rem;
  }
  .playground-card span {
    color: #57606a;
    font-size: 0.92rem;
  }
  .site-note {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #d0d7de;
    color: #57606a;
    font-size: 0.9rem;
  }
</style>
