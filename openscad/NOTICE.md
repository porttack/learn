# OpenSCAD in the browser: licence notice

This folder runs **OpenSCAD**, a free program for making 3D models from code.

- `engine/openscad.js` is OpenSCAD compiled to WebAssembly, copied unchanged from
  the npm package `openscad-wasm-prebuilt` 1.2.0
  (https://github.com/lorenzowritescode/openscad-wasm).
- OpenSCAD is copyright its contributors and is licensed **GPL-2.0-or-later**
  (full text in `engine/COPYING`). Source code: https://github.com/openscad/openscad
  and the build recipe above.
- `index.html` and `worker.js` are the site's own small wrapper. They only
  load the engine and show its output.

Like `turtlelab/` and `logo/`, this folder is a separate-licence island in an
otherwise MIT/CC repo: do not copy the engine elsewhere, and do not put lesson
content in here.

The page makes no request to any other site except the 3D viewer library
(three.js, from the same CDN Python in 3D uses). Your code is not sent anywhere;
it is kept only in this browser's local storage so it is still there tomorrow.

## The editor

`editor.js` is CodeMirror 6 (MIT, https://codemirror.net) bundled with esbuild, plus
our own OpenSCAD colouring, auto-indent and completion from `src/editor-entry.js`.
To rebuild: in a scratch folder `npm i codemirror @codemirror/language
@codemirror/autocomplete @codemirror/commands @codemirror/state @codemirror/view
@lezer/highlight esbuild`, copy `src/editor-entry.js` there, and run
`npx esbuild editor-entry.js --bundle --minify --format=esm --outfile=editor.js`.

## Fonts

`fonts/` holds DejaVu Sans, DejaVu Sans Bold and DejaVu Sans Mono (from the npm package
`dejavu-fonts-ttf` 2.37.3), so OpenSCAD's `text()` works. Their license (Bitstream Vera
license plus public domain changes) is in `fonts/LICENSE-DejaVu.txt`. The page loads them only
when a script uses `text(`.
