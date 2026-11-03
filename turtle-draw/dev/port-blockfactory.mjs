// Dev tool, not part of the app. Rebuilds js/ui/blockfactory.js from Turtle
// Blocks JS's js/blockfactory.js, so the changes made to the original are
// all visible in this one script instead of buried in a hand-edited copy.
//
//   git clone https://github.com/sugarlabs/turtleblocksjs <somewhere outside this repo>
//   node turtle-draw/dev/port-blockfactory.mjs <somewhere>/js/blockfactory.js turtle-draw/js/ui/blockfactory.js
//
// It reads the original as text only. To port another shape (for example the
// boolean ones, needed by the Math palette), add its line range to `pieces`.
// The line numbers are from commit 8c510b4f830e132861a43bdb20906e9c6d90c788.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { readFileSync, writeFileSync } from 'node:fs';
const [, , srcPath, outPath] = process.argv;
const src = readFileSync(srcPath, 'utf8').split('\n');
const range = (a, b) => src.slice(a - 1, b).join('\n');   // 1-indexed, inclusive

// The pieces of the SVG class we use, by original line number.
const pieces = [
  [39, 86],     // constructor
  [88, 345],    // attribute setters
  [347, 563],   // min/max helpers, calculateXY/WH, newPath, closePath, text, lineTo, arcTo
  [565, 672],   // rarcTo, corner, iCorner
  [674, 805],   // doInnie, doOutie, doSlot, doTail, doTab, doPorch
  [823, 834],   // doBoolean (basicBlock refers to it)
  [857, 931],   // header, transform, footer, style
  [945, 1069],  // basicBlock
  [1071, 1113], // basicBox
  [1365, 1570], // basicClamp
];
let body = pieces.map(([a, b]) => range(a, b)).join('\n\n');

function patch(label, from, to) {
  if (!body.includes(from)) throw new Error('patch target not found: ' + label);
  body = body.replace(from, to);
}

// 1. text(): the original writes style="..." which a strict CSP blocks. Use attributes.
patch('text style',
`            '<text style="font-size:' +
            fontSize +
            "px;fill:" +
            platformColor.blockText +
            ";font-family:sans-serif;text-anchor:" +
            align +
            '">';`,
`            '<text class="block-text" font-size="' +
            fontSize +
            '" fill="' +
            BLOCK_TEXT_COLOR +
            '" text-anchor="' +
            align +
            '">';`);

// 2. _style(): same reason. Also drops the drop-shadow filter.
patch('path style',
`            'style="fill:' +
            this._fill +
            ";fill-opacity:1;stroke:" +
            this._stroke +
            ";stroke-width:" +
            this._strokeWidth +
            ';stroke-linecap:round;stroke-opacity:1;filter:url(#dropshadow);" />'`,
`            'fill="' +
            this._fill +
            '" fill-opacity="1" stroke="' +
            this._stroke +
            '" stroke-width="' +
            this._strokeWidth +
            '" stroke-linecap="round" stroke-opacity="1" />'`);

// 3. _header(): remove the <filter> definition (drop shadow). Keep the svg wrapper.
patch('header filter',
`            this._transform(center) +
            '<filter id="dropshadow" height="130%"> \\
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> \\
            <feOffset dx="2" dy="2" result="offsetblur"/> \\
            <feComponentTransfer xmlns="http://www.w3.org/2000/svg"> \\
            <feFuncA type="linear" slope="0.2"/> </feComponentTransfer> \\
            <feMerge> <feMergeNode/> <feMergeNode in="SourceGraphic"/> </feMerge> \\
            </filter>'`,
`            this._transform(center)`);


// 4. Room for tall things plugged into ANY socket. The original can only
//    stretch for the first two sockets (and the second one shares a number
//    with a clamp's mouth). Keep a list, one entry per socket instead.
patch('expandYs field', '        this._expandY2 = 0;\n', '        this._expandY2 = 0;\n        this._expandYs = null; // extra height under each socket (see setExpandYs)\n');
const oldStretch = `                if (i === 0) {
                    svg += this._rLineTo(0, this._expandY);
                } else if (i === 1 && this._expandY2 > 0) {
                    svg += this._rLineTo(0, this._expandY2);
                }`;
if (body.split(oldStretch).length !== 3) throw new Error('expected the socket stretch code exactly twice (basicBlock and basicClamp)');
body = body.split(oldStretch).join('                svg += this._rLineTo(0, this._innieExtra(i));');
patch('boolean clamp header',
  '            svg += this._rLineTo(0, 2 * this._padding + this._strokeWidth);\n            svg += this._doBoolean();',
  '            svg += this._rLineTo(0, 2 * this._padding + this._strokeWidth + this._innieExtra(0));\n            svg += this._doBoolean();');
body += `

    /**
     * Added for Turtle Draw. Extra height, in the same units as setExpand,
     * under each socket, for blocks plugged in that are taller than a number
     * box. One entry per socket.
     * @public
     * @param {number[]} list
     * @returns {void}
     */
    setExpandYs(list) {
        this._expandYs = list;
    }

    /**
     * Added for Turtle Draw. The extra height under socket number i.
     * @private
     * @param {number} i
     * @returns {number}
     */
    _innieExtra(i) {
        if (this._expandYs) {
            return this._expandYs[i] || 0;
        }
        if (i === 0) {
            return this._expandY;
        }
        return i === 1 && this._expandY2 > 0 ? this._expandY2 : 0;
    }`;

if (/platformColor|style="/.test(body.replace(/\/\/.*$/gm, ''))) throw new Error('unpatched style/platformColor remains');

const header = `// Block shape generator.
//
// Ported from Turtle Blocks JS, js/blockfactory.js:
//   Copyright (c) 2015-20 Walter Bender
//   https://github.com/sugarlabs/turtleblocksjs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//
// Borrowing loosely from tasprite_factory.py in the Python version.
//
// Modified 2026 by Eric Brown for Turtle Draw:
//   * converted to an ES module;
//   * kept only the shapes Turtle Draw uses: basicBlock (commands),
//     basicBox (number boxes and plain reporters) and basicClamp (blocks
//     with a C-shaped mouth, like repeat and if);
//   * added setExpandYs and _innieExtra, so a tall block plugged into any
//     socket (not just the first two) makes room for itself;
//   * fills, strokes and text are written as SVG attributes instead of
//     style="..." attributes, because Turtle Draw's Content Security Policy
//     does not allow inline styles;
//   * removed the drop shadow filter;
//   * the text color is a constant here instead of platformColor.blockText.
// The geometry (every number that decides what a block looks like) is
// unchanged. See NOTICE.md.

const BLOCK_TEXT_COLOR = '#282828';

`;
const out = header + `export class SVG {\n${body.split('\n').slice(0).join('\n')}\n}\n`;
writeFileSync(outPath, out);
console.log('wrote', outPath, out.split('\n').length, 'lines');
