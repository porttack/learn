# TurtleLab

Block-based turtle graphics that runs entirely in your browser. Nothing you do
is sent anywhere.

**Status: published, and still growing.** You can drag blocks out of the
palettes (Turtle, Pen, Math, Flow, Boxes and My Blocks), snap them together, and run them,
with undo, zoom and pan. Save a drawing as a PNG with your blocks inside it,
and open it again later. Your blocks are also kept in your browser so a
refresh does not lose them. You can make blocks of your own, with inputs. A PDF
button makes a PDF (the blocks, and the drawing with a grid and the turtle on it; a big program gets a page of its own; the picture
attached so the PDF opens in TurtleLab again), and a small box shows your blocks as
Python. A Fit button zooms the drawing and the blocks so everything is in view (press it again to go back), a write block draws words in script with the pen, a grid
button shows x and y, and right-clicking Save offers JPEG, SVG (a picture, and hairlines
for a cutter), and `.pes` and `.dst` files for embroidery machines. See `CLAUDE.md` for the plan and the rules this project
follows.

## Try it

From the `learn` repo root:

    python3 -m http.server 4011 --directory turtlelab

then open http://127.0.0.1:4011/ in Chrome. (A web server is needed because
the code is split into ES modules, which browsers will not load from a
`file://` address.)

## Tests

    cd turtlelab
    node --test

## License

GNU Affero General Public License, version 3 or later. See `COPYING` and
`NOTICE.md`. The look of the blocks comes from Sugar Labs' Turtle Blocks.
