# TurtleLab

Block-based turtle graphics that runs entirely in your browser. Nothing you do
is sent anywhere.

**Status: under construction.** You can drag blocks out of the palettes,
snap them together, and run them, with undo, zoom and pan. Saving, the Math
palette and My Blocks are still to come. See `CLAUDE.md` for the plan and the rules this
project follows.

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
