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
