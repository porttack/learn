---
layout: minimal
title: "About OpenSCAD in the Browser"
permalink: /openscad/about/
---

<div class="lesson-crumbs">
  <a href="{{ '/openscad/' | relative_url }}">&larr; Open the tool</a>
</div>

<div class="lesson" markdown="1">

# About OpenSCAD in the Browser

## What this is

A page where you type OpenSCAD code and watch the 3D model appear next to it.
It is the real OpenSCAD, running inside your browser, so a script that works on
your own computer works here too, and the other way around. When you like the
model, **File, Download STL** gives you a file a 3D printer's software can read.

Everything stays on your computer. Your code is not sent anywhere, and there is
nothing to install and no account to make.

## What you can do here

- **Write and run code.** Colors for the parts of the language, automatic
  indenting, and suggestions as you type (try typing `cyl`). Press Ctrl or
  Cmd and Enter to render.
- **Keep many drawings.** Give a drawing a name and it is saved in this browser
  as you type. **File, My drawings** lists all of them, and you can back them
  up to a file and restore them later.
- **Look at the model.** Turn it, zoom, fit it to the window, look from below,
  show scale numbers on the axes, and show its size and center.
- **Check it for printing.** **Print, Show overhangs** paints in red the faces
  that tilt too far out and would need support, and tells you how many square
  millimeters that is. **Auto-orient** tries the faces of the model as its
  bottom and keeps the way up that needs the least support.

## Why OpenSCAD matters

Most 3D design programs are about dragging shapes with a mouse. OpenSCAD is
about describing a shape with numbers and words, and that changes what you can
do.

- **It is exact.** A hole that is 10.8 mm is 10.8 mm, not "about that size on
  the screen." Parts that must fit together, such as a cap that slides into a
  tube and squeezes an O-ring, depend on numbers like that.
- **Change one number, change the whole part.** Put the tube size at the top as
  a variable and every other measurement follows. This is called a parametric
  design, and it is how one design becomes ten sizes.
- **Your design is a text file.** You can copy it, share it, compare two
  versions, and keep it for years. Nothing is hidden inside a mouse movement.
- **It teaches real programming.** Variables, loops, if statements, functions
  and your own modules are all in it, and the result is something you can hold
  after it prints.
- **It is free and open.** Anyone can use it, read how it works, and add to it.
  Many people who share 3D printable designs write them in OpenSCAD.

It also pairs with the rest of this site. [Python in 3D]({{ '/python3d/' | relative_url }})
uses the same ideas (shapes, translate, rotate, difference) written in Python.
If you can write one, the other will feel familiar.

## What is under the hood

| Part | What it does | License |
|---|---|---|
| OpenSCAD (a snapshot dated 2025-01-19, built for the web) | Reads your code and builds the model. It uses the Manifold geometry library for fast cutting and joining of shapes. | GPL-2.0-or-later (Manifold: Apache-2.0) |
| DejaVu fonts | The letters used by `text()`. | Free (Bitstream Vera license) |
| WebAssembly and a Web Worker | WebAssembly lets the program written for desktops run in a browser. The worker runs it off the main page, so the page stays responsive and **Stop** works if a script never finishes. | Part of the browser |
| CodeMirror 6 | The editor: colors, indenting, suggestions, undo. | MIT |
| three.js | Draws the 3D model, the grid, the axes and the arrows. | MIT |
| lz-string | Squeezes your code into a share link. | MIT |
| Your browser's local storage | Keeps your named drawings on this computer. | Part of the browser |

The OpenSCAD engine is copied, unchanged, from the open source package
[openscad-wasm-prebuilt](https://github.com/lorenzowritescode/openscad-wasm),
which compiles [OpenSCAD](https://openscad.org) for the web. The overhang check
and auto-orient are this page's own code: they look at the triangles of the
finished model, they are not part of OpenSCAD.

## Licensing

- **OpenSCAD is free software under the GNU General Public License, version 2
  or later.** The engine file on this site is that program, so it comes with
  its license text and the sources are linked above. This is why the tool lives
  in its own folder, separate from the lessons.
- **What you make is yours.** The code you write and the STL files you download
  belong to you, to use and share as you like.
- **This page's own wrapper** (the page, the editor setup and the viewer code)
  is the work of the course teacher and is part of this site.

## Privacy

- Your code and drawings are never sent to a server. They live in this
  browser's local storage, on this computer, and are gone if the site's data is
  cleared. Use **File, My drawings, Back up all** for anything you care about.
- The page does load two small code libraries (three.js and lz-string) from a
  public library host, the same way the Python in 3D pages do. That host can see
  that a page asked for them, as any host would, but it never receives your
  code.

## What is not here yet

- **Fonts:** `text()` works with three fonts: DejaVu Sans, DejaVu Sans Bold and
  DejaVu Sans Mono. Use them by name, for example
  `text("Hi", font="DejaVu Sans:style=Bold")`. Other fonts are not included, and
  the fonts are downloaded only when your script uses `text()`.
- **Libraries:** `use <...>` and `include <...>` of outside libraries (such as
  MCAD or BOSL) do not work, and neither does `import()` of a file. Everything
  has to be in your one script.
- **Size:** the first time you open the page it downloads the engine, which is
  about 11 MB. After that your browser keeps it.
- **Overhangs:** the red faces are a guide. A real 3D printer's software has the
  final say about what needs support, and a face exactly at the limit is treated
  as printable.

## Where to learn OpenSCAD

- The [OpenSCAD cheatsheet](https://openscad.org/cheatsheet/) is one page with
  every command. It is also in the **Help** menu.
- The [OpenSCAD documentation](https://openscad.org/documentation.html) has a
  full manual and tutorials.
- In the tool, **File, Example: overhang test** is a small script that shows
  what the overhang check does.

</div>

<style>
  .lesson-crumbs { max-width: 720px; font-size: 0.85rem; }
  .lesson-crumbs a { color: #2a7ae2; text-decoration: none; }
  .lesson-crumbs a:hover { text-decoration: underline; }
  .lesson { max-width: 720px; }
  .lesson h1 { margin-top: 8px; }
  .lesson h2 { margin-top: 1.6em; padding-bottom: 0.3em; border-bottom: 1px solid #d0d7de; }
  .lesson table { font-size: 0.9rem; }
</style>
