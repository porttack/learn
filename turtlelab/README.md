# TurtleLab

Block-based turtle graphics that runs entirely in your browser. Nothing you do
is sent anywhere.

**Status: published, and still growing.** You can drag blocks out of the
palettes (Turtle, Pen, Math, Flow, Boxes and My Blocks), snap them together, and run them,
with undo, zoom and pan. Save a drawing as a PNG with your blocks inside it,
and open it again later. Your blocks are also kept in your browser so a
refresh does not lose them. You can make blocks of your own, with inputs. A PDF
button makes a one page hand-in (blocks on top, drawing below, with the picture
attached so the PDF opens in TurtleLab again), and a small box shows your blocks as
Python. SVG export is still to come. See `CLAUDE.md` for the plan and the rules this project
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
