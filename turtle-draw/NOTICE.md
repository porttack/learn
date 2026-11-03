# Notice: third-party material in Turtle Draw

Turtle Draw is licensed under the GNU Affero General Public License,
version 3 or later (see `COPYING`). It includes work from the projects below.
Each entry says what was taken, from where, under what license, and what was
changed. Add an entry whenever a file is copied in.

## Sugar Labs, Turtle Blocks JS

https://github.com/sugarlabs/turtleblocksjs, AGPL-3.0-or-later.
Studied and copied from commit `8c510b4f830e132861a43bdb20906e9c6d90c788`
(2026-09-18). Turtle Draw takes its visual style from Turtle Blocks.
Turtle Draw does not include Turtle Blocks' runtime engine or any of its
dependencies.

| File here | Taken from | Copyright | Modifications |
|---|---|---|---|
| `js/ui/artwork.js` | `js/artwork.js`: the turtle SVG template and the `FILLCOLORS` / `STROKECOLORS` lists | Copyright (c) 2014-21 Walter Bender | Converted to an ES module; cut down to the turtle sprite and its colors; removed the XML prolog from the SVG; added `turtleSvg()`. The SVG paths are unchanged. |

## GNU Affero General Public License

`COPYING` is the text of the GNU AGPL version 3 as published by the Free
Software Foundation (https://www.gnu.org/licenses/agpl-3.0.txt).

## Still to be added

Entries are added when the files are copied in: the block-shape generator
(`js/blockfactory.js`), palette colors (from `js/utils/platformstyle.js`,
GPL-3.0-or-later, Sam Parkinson), toolbar icons from `header-icons/`, and the
Roboto font (Apache License 2.0, Google) with its license text.
