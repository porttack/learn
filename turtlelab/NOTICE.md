# Notice: third-party material in TurtleLab

TurtleLab is licensed under the GNU Affero General Public License,
version 3 or later (see `COPYING`). It includes work from the projects below.
Each entry says what was taken, from where, under what license, and what was
changed. Add an entry whenever a file is copied in.

## Sugar Labs, Turtle Blocks JS

https://github.com/sugarlabs/turtleblocksjs, AGPL-3.0-or-later.
Studied and copied from commit `8c510b4f830e132861a43bdb20906e9c6d90c788`
(2026-09-18). TurtleLab takes its visual style from Turtle Blocks.
TurtleLab does not include Turtle Blocks' runtime engine or any of its
dependencies.

| File here | Taken from | Copyright | Modifications |
|---|---|---|---|
| `js/ui/blockfactory.js` | `js/blockfactory.js`: the `SVG` block shape generator (`basicBlock`, `basicBox`, `basicClamp` and the helpers they use) | Copyright (c) 2015-20 Walter Bender | Converted to an ES module; kept only the shapes in use; fills, strokes and text are SVG attributes instead of `style` attributes (TurtleLab's Content Security Policy forbids inline styles); removed the drop shadow filter; text color is a constant instead of `platformColor.blockText`; added `setExpandYs` and `_innieExtra` so a tall block plugged into any socket (not only the first two) makes room for itself. The shapes' geometry is otherwise unchanged. (An earlier version also took `booleanCompare`; the horizontal math blocks replaced it, so it is gone again.) `dev/port-blockfactory.mjs` rebuilds the file from the original and shows every change. |
| `js/ui/artwork.js` | `js/artwork.js`: the turtle SVG template and the `FILLCOLORS` / `STROKECOLORS` lists | Copyright (c) 2014-21 Walter Bender | Converted to an ES module; cut down to the turtle sprite and its colors; removed the XML prolog from the SVG; added `turtleSvg()`. The SVG paths are unchanged. |
| `images/favicon.svg` | The turtle SVG template in `js/artwork.js` (the same turtle as the sprite), in its green colors | Copyright (c) 2014-21 Walter Bender | Written out as its own file with only the namespaces a browser needs. The paths are unchanged. |
| `images/apple-touch-icon.png` | The same turtle as `images/favicon.svg`, 128 pixels wide on a blue square, as the 180 pixel picture an iPad uses for Add to Home Screen | Copyright (c) 2014-21 Walter Bender for the turtle | Made once with headless Chrome from the favicon and a gradient. |
| `images/banner.png` | A screenshot of TurtleLab itself (made by `dev/make-banner.mjs`), so it shows the Sugar-derived blocks and turtle | Copyright (c) 2015-21 Walter Bender for the shapes and turtle; the layout and wordmark are original | A picture of the app. It is kept in this folder, not in the site's shared images, so the AGPL artwork stays inside the AGPL part of the repo. |
| `images/social.png` | The same kind of picture as the banner, 1200 by 630 for link previews (made by `dev/make-banner.mjs`), so it also shows the Sugar-derived blocks and turtle | Copyright (c) 2015-21 Walter Bender for the shapes and turtle; the layout and wordmark are original | A picture of the app. It is kept in this folder, not in the site's shared images, so the AGPL artwork stays inside the AGPL part of the repo. |
| `images/samples/*.png` | Screenshots of TurtleLab's own drawings (made by `dev/make-sample-thumbs.mjs`), which include the turtle sprite from `js/artwork.js` | Copyright (c) 2014-21 Walter Bender for the turtle; the drawings are made by the sample programs | Pictures of the app, kept in this folder with the rest of the AGPL artwork. |
| `images/palette-turtle.svg`, `palette-pen.svg`, `palette-math.svg`, `palette-flow.svg`, `palette-boxes.svg` | `js/artwork.js`: the constants `TURTLEPALETTEICON`, `PENPALETTEICON`, `NUMBERPALETTEICON`, `FLOWPALETTEICON`, `MYBLOCKSPALETTEICON` | Copyright (c) 2014-21 Walter Bender | Each inline SVG string was written out as its own file. Otherwise unchanged. (`palette-boxes.svg` was called `palette-myblocks.svg` until the blocks you make got a palette of their own. The new `palette-myblocks.svg` is original.) |
| `images/run-button.svg`, `stop-button.svg`, `hide-blocks-button.svg`, `bigger-button.svg`, `smaller-button.svg`, `new-button.svg`, `open-button.svg`, `save-button.svg` | `header-icons/` | None stated in the files (they carry no license text; the repository's AGPL-3.0-or-later applies) | Copied unchanged. |
| `images/go-home-button.svg` | `header-icons/go-home-button.svg` | As above | Removed one red dashed guide rectangle that was left inside the drawing. Nothing else changed. |

## Sam Parkinson, platformstyle.js (Turtle Blocks JS)

`js/ui/palette-colors.js` uses color values from `js/utils/platformstyle.js`
in the Turtle Blocks JS repository above: Copyright (C) 2015 Sam Parkinson,
GNU General Public License, version 3 or (at your option) any later version.
That license can be combined with this project's AGPL-3.0-or-later. Only the
hex color values were taken, and they are grouped into TurtleLab's own five
palettes.

## Roboto

`fonts/roboto/Roboto-Regular.woff2` and `Roboto-Bold.woff2`, taken unchanged
from the `fonts/roboto/` folder of the Turtle Blocks JS repository above.
The font files themselves declare: "Roboto, Version 2.136; 2017. Copyright
2011 Google Inc. All Rights Reserved. Licensed under the Apache License,
Version 2.0." The license text is in `fonts/roboto/LICENSE-Apache-2.0.txt`
(the official text from https://www.apache.org/licenses/LICENSE-2.0.txt).
The Apache License 2.0 can be combined with this project's AGPL-3.0-or-later.

`js/ui/roboto-data.js` is `Roboto-Regular.woff2` again, written out as text
(by `dev/make-font-data.mjs`, with nothing changed) so the PDF can draw blocks with
the right font without fetching anything. The same license applies.

## The Hershey fonts

The letters the **write** block draws (`js/core/lettering-data.js`, made by `dev/make-lettering-data.py`)
are five Hershey fonts, one for each choice in the block's font list: Script Simplex (script), Script Complex
(fancy), Futura Light (sans), Futura Medium (bold) and Times Roman (serif). The Hershey fonts are in the public domain, on these terms: the
following acknowledgments must come with the font data, and the data must not be put in the format that
the U.S. NTIS distributes (it is not: it is a short list of numbers for each letter).

- The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National Bureau
  of Standards.
- The format of the font data in the distribution this was made from was originally created by James Hurt,
  Cognition, Inc., 900 Technology Park Drive, Billerica, MA 01821.

The data came from the `Hershey-Fonts` package on PyPI (MIT licence), which carries the original fonts. That
package is used once, by the dev script, to write the data file. It is not part of TurtleLab and is not needed
to run it. Only the numbers for the 95 printable characters of each font were kept.

## GNU Affero General Public License

`COPYING` is the text of the GNU AGPL version 3 as published by the Free
Software Foundation (https://www.gnu.org/licenses/agpl-3.0.txt).

## Still to be added

Entries are added when files are copied in. Still to come: any further toolbar
icons from `header-icons/`, and any further block shapes. `images/undo.svg`, `redo.svg`, `palette-notes.svg`, `fit-button.svg`, `grid-button.svg`, `fullscreen-button.svg` and `exit-fullscreen-button.svg` are original
drawings made for this project, not taken from anywhere.

## Embroidery files

`js/core/embroidery.js` writes `.dst` (Tajima) and `.pes` (Brother) files. The layouts of both are public: they are
described in several places and written out in open source programs. The code is written fresh for TurtleLab, and
is checked against **pyembroidery** (https://github.com/EmbroidePy/pyembroidery, MIT licence), which is used only
by the tests, is not copied into this folder, and is not needed to use the app (`test/embroidery-oracle.py`).

One piece of data does come from it: the table of Brother's 64 thread colors (names and colors) in
`PEC_PALETTE`, which a `.pes` file refers to by number. It is Brother's own thread chart, as listed in pyembroidery's
`EmbThreadPec.py` (author listed as Tatarize). pyembroidery is released under the MIT licence, which allows this and
asks that its notice be kept, so here it is, as it appears in version 1.5.1:

> MIT License
>
> Copyright (c) 2018
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

The color distance used to match a thread to a Brother color is the "redmean" measure described by Thiadmer
Riemersma (https://www.compuphase.com/cmetric.htm).
