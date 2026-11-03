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
| `js/ui/blockfactory.js` | `js/blockfactory.js`: the `SVG` block shape generator (`basicBlock`, `basicBox`, `basicClamp` and the helpers they use) | Copyright (c) 2015-20 Walter Bender | Converted to an ES module; kept only the shapes in use; fills, strokes and text are SVG attributes instead of `style` attributes (Turtle Draw's Content Security Policy forbids inline styles); removed the drop shadow filter; text color is a constant instead of `platformColor.blockText`. The geometry is unchanged. `dev/port-blockfactory.mjs` rebuilds the file from the original and shows every change. |
| `js/ui/artwork.js` | `js/artwork.js`: the turtle SVG template and the `FILLCOLORS` / `STROKECOLORS` lists | Copyright (c) 2014-21 Walter Bender | Converted to an ES module; cut down to the turtle sprite and its colors; removed the XML prolog from the SVG; added `turtleSvg()`. The SVG paths are unchanged. |
| `images/palette-turtle.svg`, `palette-pen.svg`, `palette-math.svg`, `palette-flow.svg`, `palette-myblocks.svg` | `js/artwork.js`: the constants `TURTLEPALETTEICON`, `PENPALETTEICON`, `NUMBERPALETTEICON`, `FLOWPALETTEICON`, `MYBLOCKSPALETTEICON` | Copyright (c) 2014-21 Walter Bender | Each inline SVG string was written out as its own file. Otherwise unchanged. |
| `images/run-button.svg`, `stop-button.svg`, `hide-blocks-button.svg`, `bigger-button.svg`, `smaller-button.svg` | `header-icons/` | None stated in the files (they carry no license text; the repository's AGPL-3.0-or-later applies) | Copied unchanged. |
| `images/go-home-button.svg` | `header-icons/go-home-button.svg` | As above | Removed one red dashed guide rectangle that was left inside the drawing. Nothing else changed. |

## Sam Parkinson, platformstyle.js (Turtle Blocks JS)

`js/ui/palette-colors.js` uses color values from `js/utils/platformstyle.js`
in the Turtle Blocks JS repository above: Copyright (C) 2015 Sam Parkinson,
GNU General Public License, version 3 or (at your option) any later version.
That license can be combined with this project's AGPL-3.0-or-later. Only the
hex color values were taken, and they are grouped into Turtle Draw's own five
palettes.

## Roboto

`fonts/roboto/Roboto-Regular.woff2` and `Roboto-Bold.woff2`, taken unchanged
from the `fonts/roboto/` folder of the Turtle Blocks JS repository above.
The font files themselves declare: "Roboto, Version 2.136; 2017. Copyright
2011 Google Inc. All Rights Reserved. Licensed under the Apache License,
Version 2.0." The license text is in `fonts/roboto/LICENSE-Apache-2.0.txt`
(the official text from https://www.apache.org/licenses/LICENSE-2.0.txt).
The Apache License 2.0 can be combined with this project's AGPL-3.0-or-later.

## GNU Affero General Public License

`COPYING` is the text of the GNU AGPL version 3 as published by the Free
Software Foundation (https://www.gnu.org/licenses/agpl-3.0.txt).

## Still to be added

Entries are added when files are copied in. Still to come: more toolbar icons
from `header-icons/` (save and open), and any further block shapes (the boolean
ones, for the Math palette). `images/undo.svg` and `redo.svg` are original
drawings made for this project, not taken from anywhere.
