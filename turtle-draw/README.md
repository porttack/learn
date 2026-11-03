# Turtle Draw (working name)

Block-based turtle graphics that runs entirely in your browser. Nothing you do
is sent anywhere.

**Status: under construction.** The page currently runs a few built-in demo
programs. The block editor, saving, and the rest are coming. See `CLAUDE.md`
for the plan and the rules this project follows.

## Try it

From the `learn` repo root:

    python3 -m http.server 4011 --directory turtle-draw

then open http://127.0.0.1:4011/ in Chrome. (A web server is needed because
the code is split into ES modules, which browsers will not load from a
`file://` address.)

## Tests

    cd turtle-draw
    node --test

## License

GNU Affero General Public License, version 3 or later. See `COPYING` and
`NOTICE.md`. The look of the blocks comes from Sugar Labs' Turtle Blocks.
