// Block shape generator.
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
//   * kept only the shapes Turtle Draw uses: basicBlock (commands and
//     reporters with sockets), basicBox (number boxes and plain reporters),
//     booleanCompare (the yes-or-no blocks <, > and =) and basicClamp
//     (blocks with a C-shaped mouth, like repeat);
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

export class SVG {
    constructor() {
        this._x = 0;
        this._y = 0;
        this._minX = 10000;
        this._minY = 10000;
        this._maxX = -10000;
        this._maxY = -10000;
        this._width = 0;
        this._height = 0;
        this.docks = [];
        this._scale = 1;
        this._orientation = 0;
        this._radius = 8;
        this._strokeWidth = 1;
        this._innies = [];
        this._outie = false;
        this._innieX1 = (9 - this._strokeWidth) / 2;
        this._innieY1 = 3;
        this._innieX2 = (9 - this._strokeWidth) / 2;
        this._innieY2 = (9 - this._strokeWidth) / 2;
        this._inniesSpacer = 9;
        this._padding = this._innieY1 + this._strokeWidth;
        this._slot = true;
        this._cap = false;
        this._tab = true;
        this._bool = false;
        this._slotX = 10;
        this._slotY = 2;
        this._tail = false;
        this._porch = false;
        this._porchX = this._innieX1 + this._innieX2 + 4 * this._strokeWidth;
        this._porchY = this._innieY2;
        this._expandX = 30;
        this._expandX2 = 0;
        this._expandY = 0;
        this._expandY2 = 0;
        this._expandYs = null; // extra height under each socket (see setExpandYs)
        this._clampCount = 1;
        this._clampSlots = [1];
        this._slotSize = 21; // TODO: Compute this.
        this._arm = true;
        this._else = false;
        this._draw_inniess = true;
        this._fill = "fill_color";
        this._stroke = "stroke_color";
        this.margins = [0, 0, 0, 0];
        this._fontSize = 10;
        this._labelOffset = 0;
    }

    // Attribute methods

    /**
     * @public
     * @param {number} fontSize
     * @returns {void}
     */
    setFontSize(fontSize) {
        this._fontSize = fontSize;
    }

    /**
     * @public
     * @param {number} offset
     * @returns {void}
     */
    setLabelOffset(offset) {
        this._labelOffset = offset;
    }

    /**
     * @public
     * @param {boolean} offset
     * @returns {void}
     */
    setDrawInniess(flag) {
        this._draw_inniess = flag;
    }

    /**
     * @public
     * @returns {number}
     */
    getWidth() {
        return this._width;
    }

    /**
     * @public
     * @returns {number}
     */
    getHeight() {
        return this._height;
    }

    /**
     * @public
     * @returns {void}
     */
    clearDocks() {
        this.docks = [];
    }

    /**
     * @public
     * @param {number} scale
     * @returns {void}
     */
    setScale(scale) {
        this._scale = scale;
    }

    /**
     * @public
     * @param {number} orientation
     * @returns {void}
     */
    setOrientation(orientation) {
        this._orientation = orientation;
    }

    /**
     * @public
     * @param {number} number
     * @returns {void}
     */

    setClampCount(number) {
        this._clampCount = number;
        const n = this._clampSlots.length;
        if (n < number) {
            for (let i = 0; i < number - n; i++) {
                this._clampSlots.push(1);
            }
        }
    }

    /**
     * @public
     * @param {number} clamp
     * @param {number} number
     * @returns {void}
     */
    setClampSlots(clamp, number) {
        if (clamp > this._clampCount.length - 1) {
            this.setClampCount(clamp + 1);
        }
        this._clampSlots[clamp] = number;
    }

    /**
     * @public
     * @param {number} w
     * @param {number} h
     * @param {number} w2
     * @param {number} h2
     * @returns {void}
     */
    setExpand(w, h, w2, h2) {
        // TODO: make this an array
        this._expandX = w;
        this._expandY = h;
        this._expandX2 = w2;
        this._expandY2 = h2;
    }

    /**
     * @public
     * @param {number} stroke_width
     * @returns {void}
     */
    setstrokeWidth(stroke_width) {
        this._strokeWidth = stroke_width;
        this._calc_porch_params();
    }

    /**
     * @public
     * @param {array} colors
     * @returns {void}
     */
    setColors(colors) {
        this._fill = colors[0];
        this._stroke = colors[1];
    }

    /**
     * @public
     * @param {Number} color
     * @returns {void}
     */
    setFillColor(color) {
        this._fill = color;
    }

    /**
     * @public
     * @param {Number} color
     * @returns {void}
     */
    setStrokeColor(color) {
        this._stroke = color;
    }

    /**
     * @public
     * @param {array} inniesArray
     * @returns {void}
     */
    setInnies(inniesArray) {
        for (let i = 0; i < inniesArray.length; i++) {
            this._innies.push(inniesArray[i]);
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setOutie(flag) {
        // Only one outie.
        this._outie = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setSlot(flag) {
        this._slot = flag;
        if (flag) {
            this._cap = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setCap(flag) {
        this._cap = flag;
        if (flag) {
            this._slot = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setTab(flag) {
        this._tab = flag;
        if (flag) {
            this._tail = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setTail(flag) {
        this._tail = flag;
        if (flag) {
            this._tab = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setPorch(flag) {
        this._porch = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setBoolean(flag) {
        this._bool = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setElse(flag) {
        this._else = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setArm(flag) {
        this._arm = flag;
    }

    // SVG-related helper methods

    /**
     * @private
     * @returns {void}
     */
    _resetMinMax() {
        this._minX = 10000;
        this._minY = 10000;
        this._maxX = -10000;
        this._maxY = -10000;
    }

    /**
     * @private
     * @returns {void}
     */
    _checkMinMax() {
        if (this._x < this._minX) {
            this._minX = this._x;
        }
        if (this._y < this._minY) {
            this._minY = this._y;
        }
        if (this._x > this._maxX) {
            this._maxX = this._x;
        }
        if (this._y > this._maxY) {
            this._maxY = this._y;
        }
    }

    /**
     * @private
     * @returns {void}
     */ _calculateXY() {
        let x = this._strokeWidth / 2.0;
        let y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = x + this._strokeWidth + 0.5;
        this.margins[1] = this._strokeWidth + 0.5;

        if (this._outie) {
            x += this._innieX1 + this._innieX2;
            this.margins[0] += this._innieX1 + this._innieX2;
        }

        if (this._cap) {
            y += this._slotY * 3.0;
            this.margins[1] += this._slotY * 3.0;
        } else if (this._slot) {
            this.margins[1] += this._slotY;
        }

        this.margins[0] *= this._scale;
        this.margins[1] *= this._scale;

        this.margins[0] = Math.floor(this.margins[0]);
        this.margins[1] = Math.floor(this.margins[1]);
        return [x, y];
    }

    /**
     * @private
     * @returns {void}
     */
    _calculateWH(addstrokeWidth) {
        if (addstrokeWidth) {
            this._width = (this._maxX - this._minX + this._strokeWidth) * this._scale;
        } else {
            this._width = (this._maxX - this._minX) * this._scale;
        }

        if (this.margins[2] === 0) {
            this.margins[2] = (this._strokeWidth + 0.5) * this._scale;
        } else {
            this.margins[2] = this._width - this.margins[2];
        }

        if (addstrokeWidth) {
            this._height = (this._maxY - this._minY + this._strokeWidth) * this._scale;
        } else {
            this._height = (this._maxY - this._minY) * this._scale;
        }

        if (this.margins[3] === 0) {
            if (this._tab) {
                this.margins[3] = (this._slotY + this._strokeWidth + 0.5) * this._scale;
            } else {
                this.margins[3] = (this._slotY * 2 + this._strokeWidth + 0.5) * this._scale;
            }
        } else {
            this.margins[3] = this._height - this.margins[3];
        }

        this.margins[2] = Math.floor(this.margins[2] + 0.5);
        this.margins[3] = Math.floor(this.margins[3] + 0.5);
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    _newPath(x, y) {
        this._x = x;
        this._y = y;
        return '<path d="m' + x + " " + y + " ";
    }

    /**
     * @private
     * @returns {string}
     */
    _closePath() {
        return 'z" ';
    }

    /**
     * @public
     * @param {number} x
     * @param {number} y
     * @param {number} fontSize
     * @param {number} width
     * @param {string} alignment
     * @param {string} string
     * @returns {string}
     */
    text(x, y, fontSize, width, alignment, string) {
        this._x = x;
        this._y = y;
        this._checkMinMax();
        this._x = x + width;
        this._y = y - fontSize;
        this._checkMinMax();

        let align;
        // writing-mode:lr';
        switch (alignment) {
            case "left":
            case "start":
                align = "start";
                break;
            case "middle":
            case "center":
                align = "middle";
                break;
            case "right":
            case "end":
                align = "end";
                break;
        }

        let yy = y;
        const tspans = string.split("\n");
        let text =
            '<text class="block-text" font-size="' +
            fontSize +
            '" fill="' +
            BLOCK_TEXT_COLOR +
            '" text-anchor="' +
            align +
            '">';
        for (let i = 0; i < tspans.length; i++) {
            text +=
                '<tspan x="' +
                Math.floor(x + 0.5) +
                '" y="' +
                Math.floor(yy + 0.5) +
                '">' +
                tspans[i] +
                "</tspan>";
            yy += fontSize;
        }
        text += "</text>";
        return text;
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    _lineTo(x, y) {
        this._checkMinMax();
        if (this._x === x && this._y === y) {
            return "";
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return "L " + x + " " + y + " ";
        }
    }

    /**
     * @private
     * @param {number} dx
     * @param {number} dy
     * @returns {string}
     */
    _rLineTo(dx, dy) {
        if (dx === 0 && dy === 0) {
            return "";
        } else {
            return this._lineTo(this._x + dx, this._y + dy);
        }
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {number} a
     * @param {number} l

     * @returns {string}
     */
    _arcTo(x, y, r, a, l, s) {
        this._checkMinMax();
        if (r === 0) {
            return this._lineTo(x, y);
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return "A " + r + " " + r + " " + a + " " + l + " " + s + " " + x + " " + y + " ";
        }
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @returns {string}
     */
    _rarcTo(signX, signY, a, l, s) {
        if (this._radius === 0) {
            return "";
        } else {
            return this._arcTo(
                this._x + signX * this._radius,
                this._y + signY * this._radius,
                this._radius,
                a,
                l,
                s
            );
        }
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @param {boolean} start
     * @param {boolean} end
     * @param {boolean} skip
     * @returns {string}
     */
    _corner(signX, signY, a, l, s, start, end, skip) {
        let svg_str = "";
        if (this._radius > 0) {
            const r2 = this._radius / 2.0;
            if (start) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(signX * r2, 0);
                } else if (!skip) {
                    svg_str += this._rLineTo(0, signY * r2);
                }
            }

            svg_str += this._arcTo(this._x + signX * r2, this._y + signY * r2, r2, a, l, s);
            if (end) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(0, signY * r2);
                } else if (!skip) {
                    svg_str += this._rLineTo(signX * r2, 0);
                }
            }
        }
        return svg_str;
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @param {boolean} start
     * @param {boolean} end
     * @param {boolean} skip
     * @returns {string}
     */

    _iCorner(signX, signY, a, l, s, start, end) {
        let svg_str = "";
        const r2 = this._strokeWidth + this._radius / 2.0;
        if (start) {
            if (signX * signY === -1) {
                svg_str = this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            } else {
                svg_str = this._rLineTo(0, signY * (r2 - this._strokeWidth));
            }
        }

        svg_str += this._arcTo(this._x + signX * r2, this._y + signY * r2, r2, a, l, s);
        if (end) {
            if (signX * signY === -1) {
                svg_str += this._rLineTo(0, signY * (r2 - this._strokeWidth));
            } else {
                svg_str += this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            }
        }
        return svg_str;
    }

    /**
     * @private
     * @returns {void}
     */
    _doInnie() {
        this.docks.push([
            (this._x + this._strokeWidth) * this._scale,
            (this._y + this._innieY2) * this._scale
        ]);
        if (this.margins[2] === 0) {
            this.margins[1] = (this._y - this._innieY1) * this._scale;
            this.margins[2] =
                (this._x - this._innieX1 - this._innieX2 - this._strokeWidth * 2) * this._scale;
        }
        this.margins[3] = (this._y + this._innieY2 + this._innieY1) * this._scale;
        return (
            this._rLineTo(-this._innieX1, 0) +
            this._rLineTo(0, -this._innieY1) +
            this._rLineTo(-this._innieX2, 0) +
            this._rLineTo(0, this._innieY2 + 2 * this._innieY1) +
            this._rLineTo(this._innieX2, 0) +
            this._rLineTo(0, -this._innieY1) +
            this._rLineTo(this._innieX1, 0)
        );
    }

    /**
     * @private
     * @returns {void}
     */
    _doOutie() {
        if (!this._outie) {
            return this._rLineTo(0, -this._innieY2);
        }
        // Outie needs to be the first dock element.
        this.docks.unshift([this._x * this._scale, this._y * this._scale]);
        return (
            this._rLineTo(0, -this._strokeWidth) +
            this._rLineTo(-this._innieX1 - 2 * this._strokeWidth, 0) +
            this._rLineTo(0, this._innieY1) +
            this._rLineTo(-this._innieX2 + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._innieY2 - 2 * this._innieY1 + 2 * this._strokeWidth) +
            this._rLineTo(this._innieX2 - 2 * this._strokeWidth, 0) +
            this._rLineTo(0, this._innieY1) +
            this._rLineTo(this._innieX1 + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._strokeWidth)
        );
    }

    /**
     * @private
     * @returns {void}
     */
    _doSlot() {
        // let x;
        if (this._slot) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(0, this._slotY) +
                this._rLineTo(this._slotX, 0) +
                this._rLineTo(0, -this._slotY)
            );
        } else if (this._cap) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(this._slotX / 2.0, -this._slotY * 3.0) +
                this._rLineTo(this._slotX / 2.0, this._slotY * 3.0)
            );
        } else {
            return this._rLineTo(this._slotX, 0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _doTail() {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        } else if (this._tail) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(-this._slotX / 2.0, this._slotY * 3.0) +
                this._rLineTo(-this._slotX / 2.0, -this._slotY * 3.0)
            );
        } else {
            return this._rLineTo(-this._slotX, 0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _doTab() {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        }
        this.docks.push([
            (this._x - this._slotX / 2.0) * this._scale,
            (this._y + this._strokeWidth) * this._scale
        ]);
        return (
            this._rLineTo(-this._strokeWidth, 0) +
            this._rLineTo(0, this._slotY) +
            this._rLineTo(-this._slotX + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._slotY) +
            this._rLineTo(-this._strokeWidth, 0)
        );
    }

    /**
     * @private
     * @param {boolean} flag
     * @returns {void}
     */
    _doPorch(flag) {
        if (flag) {
            return (
                this._rLineTo(0, this._porchY + this._innieY1) +
                this._rLineTo(this._porchX - this._radius, 0) +
                this._corner(1, 1, 90, 0, 1, true, true, false)
            );
        } else {
            return (
                this._rLineTo(0, this._porchY - this._padding) +
                this._rLineTo(this._porchX - this._radius, 0) +
                this._corner(1, 1, 90, 0, 1, true, true, false)
            );
        }
    }

    /**
     * @private
     * @returns {string}
     */
    _doBoolean() {
        this.docks.push([
            (this._x - this._radius + this._strokeWidth) * this._scale,
            (this._y + this._radius) * this._scale
        ]);
        this.margins[2] = (this._x - this._radius - this._strokeWidth) * this._scale;
        return this._rarcTo(-1, 1, 90, 0, 0) + this._rarcTo(1, 1, 90, 0, 0);
    }

    /**
     * @private
     * @param {boolean} center
     * @returns {string}
     */
    _header(center) {
        // FIXME: Why are our calculations off by 2 x strokeWidth?
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            Math.floor(this._width + 2 * this._strokeWidth + 0.5) +
            '" height="' +
            Math.floor(this._height + 0.5) +
            '">' +
            this._transform(center)
        );
    }

    /**
     * @private
     * @param {boolean} center
     * @returns {string}
     */
    _transform(center) {
        let orientation = "";
        if (this._orientation !== 0) {
            orientation =
                '<g transform = "rotate(' +
                this._orientation +
                " " +
                this._width / 2.0 +
                " " +
                this._height / 2.0 +
                ')">';
        }
        if (center) {
            return '<g transform="translate(' + -this._minX + ", " + -this._minY + ')">';
        } else {
            return '<g transform="scale(' + this._scale + ", " + this._scale + ')">' + orientation;
        }
    }

    /**
     * @private
     * @returns {string}
     */
    _footer() {
        if (this._orientation !== 0) {
            return "</g></g></svg>";
        } else {
            return "</g></svg>";
        }
    }

    /**
     * @private
     * @returns {string}
     */
    _style() {
        return (
            'fill="' +
            this._fill +
            '" fill-opacity="1" stroke="' +
            this._stroke +
            '" stroke-width="' +
            this._strokeWidth +
            '" stroke-linecap="round" stroke-opacity="1" />'
        );
    }

    /**
     * @public
     * @returns {string}
     */ basicBlock() {
        // The most common block type: used for 0, 1, 2, or 3
        // argument commands (forward, setxy, plus, sqrt, etc.)
        this._resetMinMax();

        const obj = this._calculateXY();
        const x = obj[0];
        const y = obj[1];

        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        svg += this._rLineTo(this._expandX, 0);
        const xx = this._x;
        if (!this._bool) {
            svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        } else {
            svg += this._rLineTo(3, 0);
            svg += this._rLineTo(0, 2);
        }

        if (this._bool) {
            svg += this._doBoolean();
        } else if (this._innies.length === 0) {
            // To maintain standard block height
            svg += this._rLineTo(0, this._padding);
        } else {
            for (let i = 0; i < this._innies.length; i++) {
                if (this._innies[i]) {
                    svg += this._doInnie();
                }
                svg += this._rLineTo(0, this._innieExtra(i));
                if (i === 0 && this._porch) {
                    svg += this._doPorch(false);
                } else if (this._innies.length - 1 > i) {
                    svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
                }
            }
        }

        if (!this._bool) {
            svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        } else {
            svg += this._rLineTo(0, 2);
            svg += this._rLineTo(-3, 0);
        }

        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        if (this._tab) {
            svg += this._doTab();
        } else {
            svg += this._doTail();
        }
        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(0, -this._expandY);
        if (this._innies.indexOf(true) !== -1) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }

        this._calculateWH(true);
        svg += this._closePath();
        svg += this._style();

        // Add a block label
        const tx =
            this._width -
            this._scale * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        let ty = this._height / 2 + this._fontSize / (5 / this._scale);

        // If we have an odd number of innie slots, we need to avoid a
        // collision between the block label and the slot label.
        const nInnies = this._innies.length;
        if (nInnies > 2 && Math.round(nInnies / 2) * 2 !== nInnies) {
            ty -= 2 * this._fontSize;
        }

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        // Add a label for each innies
        let di = 0;
        if (this._slot || this._outie) {
            di = 1; // Skip the first dock since it is a slot.
        }

        let count = 1;
        for (let i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - this._fontSize / (8 / this._scale) + this._scale;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    basicBox() {
        // Basic argument style used for numbers, text, media, parameters
        this._resetMinMax();
        this.setOutie(true);

        const x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, this._strokeWidth / 2.0);
        svg += this._rLineTo(this._expandX, 0);
        svg += this._rLineTo(0, 2 * this._radius + this._innieY2 + this._expandY);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
        svg += this._doOutie();
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        const tx =
            2 * (this._innieX1 + this._innieX2) +
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @param {boolean} notnot
     * @returns {string}
     */
    booleanCompare() {
        // Booleans are in a class of their own (greater than, less than, etc)
        this._resetMinMax();
        let yoffset =
            this._radius * 2 +
            2 * this._innieY2 +
            this._inniesSpacer +
            this._strokeWidth / 2.0 +
            this._expandY;
        const xoffset = this._strokeWidth / 2.0;

        const yoff = this._radius * 2;
        let svg = '<g transform="matrix(1,0,0,1,0,-' + yoff + ')"> ';

        svg += this._newPath(xoffset, yoffset + this._radius);
        this.docks.push([this._x * this._scale, (this._y - 2 * this._radius) * this._scale]);
        this._radius -= this._strokeWidth;
        svg += this._rarcTo(1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._rLineTo(this._strokeWidth, 0);
        svg += this._rLineTo(0, -this._expandY);

        yoffset = -2 * this._innieY2 - this._inniesSpacer - this._strokeWidth;
        svg += this._rLineTo(0, yoffset + this._radius);

        svg += this._rarcTo(1, -1, 90, 0, 1);
        svg += this._rLineTo(this._radius / 2.0 + this._expandX, 0);
        svg += this._rLineTo(0, this._radius);
        const xx = this._x;
        svg += this._doInnie();
        this.docks[1][1] -= this._radius * 2 * this._scale;
        svg += this._rLineTo(0, this._expandY);

        if (this._porch) {
            svg += this._doPorch(false);
        } else {
            svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
        }
        svg += this._doInnie();
        this.docks[2][1] -= this._radius * 2 * this._scale;
        svg += this._rLineTo(0, this._innieExtra(1));
        svg += this._rLineTo(0, this._radius);
        svg += this._lineTo(xx, this._y);

        svg += this._rLineTo(-this._expandX, 0);

        svg += this._rLineTo(-this._radius * 1.5, 0);
        svg += this._rLineTo(0, -this._radius);
        svg += this._rLineTo(0, -this._strokeWidth);
        svg += this._rLineTo(-this._strokeWidth, 0);
        this._radius -= this._strokeWidth;
        svg += this._rarcTo(-1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();
        svg += "</g>";

        this.margins[0] = (this._radius + this._strokeWidth) * this._scale;
        this.margins[1] = this._strokeWidth * this._scale;
        this.margins[2] = this._strokeWidth * this._scale;

        // Add a block label
        const tx =
            this._width -
            2 * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    basicClamp() {
        // Special block for clamps around stacks; includes an 'arm'
        // that extends down the left side of a stack and a bottom jaw
        // to clamp the blocks. (Used for start, action, repeat, etc.)
        const save_cap = this._cap;
        const save_slot = this._slot;
        this._resetMinMax();
        let x;
        let y;
        if (this._outie) {
            x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        } else {
            x = this._strokeWidth / 2.0;
        }
        if (this._cap) {
            y = this._strokeWidth / 2.0 + this._radius + this._slotY * 3.0;
        } else {
            y = this._strokeWidth / 2.0 + this._radius;
        }

        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        if (this._cap) {
            this._slot = true;
            this._cap = false;
        }

        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        const xx = this._x;
        svg += this._rLineTo(this._expandX, 0);
        svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        if (this._innies[0]) {
            // svg += this._doInnie();
            for (let i = 0; i < this._innies.length; i++) {
                if (this._innies[i]) {
                    svg += this._doInnie();
                }
                svg += this._rLineTo(0, this._innieExtra(i));
                if (i === 0 && this._porch) {
                    svg += this._doPorch(false);
                } else if (this._innies.length - 1 > i) {
                    svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
                }
            }
        } else if (this._bool) {
            svg += this._rLineTo(0, 2 * this._padding + this._strokeWidth + this._innieExtra(0));
            svg += this._doBoolean();
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        } else {
            svg += this._rLineTo(0, this._padding);
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        }

        for (let clamp = 0; clamp < this._clampCount; clamp++) {
            if (clamp > 0) {
                svg += this._rLineTo(this._expandX, 0);
                svg += this._rLineTo(0, 3 * this._padding);
            }
            svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
            svg += this._lineTo(xx, this._y);
            const saveOutie = this._outie;
            this._outie = false;
            svg += this._doTab();
            this._outie = saveOutie;
            svg += this._iCorner(-1, 1, 90, 0, 0, true, true);
            svg += this._rLineTo(0, this._padding);
            if (this._clampSlots[clamp] > 1) {
                svg += this._rLineTo(0, this._slotSize * (this._clampSlots[clamp] - 1));
            }
            svg += this._rLineTo(0, this._expandY2);
            svg += this._iCorner(1, 1, 90, 0, 0, true, true);
            const saveSlot = this._slot;
            this._slot = true;
            svg += this._doSlot();
            this._slot = saveSlot;
            this.docks.pop(); // We don't need this dock.
            svg += this._rLineTo(this._radius, 0);
        }

        if (this._clampCount > 0) {
            svg += this._rLineTo(0, this._innieY1 * 2);
            // Add a bit of padding to make multiple of standard block height.
            svg += this._rLineTo(0, this._innieY1 + 3 * this._strokeWidth);
        }

        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);

        if (this._clampCount === 0) {
            svg += this._lineTo(xx, this._y);
        }

        svg += this._rLineTo(-this._radius - this._strokeWidth, 0);

        if (this._tail) {
            svg += this._doTail();
        } else {
            svg += this._doTab();
        }

        this._cap = save_cap;
        this._slot = save_slot;

        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        if (this._outie) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        let tx;
        let ty;
        // Add a block label
        if (this._outie) {
            tx =
                10 * this._strokeWidth +
                this._innieX1 +
                this._innieX2 +
                this._labelOffset * this._scale;
        } else {
            tx = 8 * this._strokeWidth + this._labelOffset * this._scale;
        }

        if (this._cap) {
            ty = (this._strokeWidth / 2.0 + this._radius + this._slotY) * this._scale;
        } else if (this._innies.length > 1) {
            ty = ((this._strokeWidth / 2.0 + this._radius) * this._scale) / 2;
            ty += this._fontSize;
        } else {
            ty = ((this._strokeWidth / 2.0 + this._radius) * this._scale) / 2;
        }

        ty += (this._fontSize + 1) * this._scale;
        if (this._bool) {
            ty += this._fontSize / 2;
        }

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        // Booleans get an extra label.
        let count = 1;
        if (this._bool) {
            tx = this._width - this._radius;
            for (let clamp = 0; clamp < this._clampCount; clamp++) {
                ty = this.docks[clamp + 2][1] - this._fontSize + 3 * this._strokeWidth;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
            }
        }

        // Add a label for each innies
        let di = 0;
        if (this._slot || this._outie) {
            di = 1; // Skip the first dock since it is a slot.
        }

        count = 1;
        tx = this._width - this._scale * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth;
        for (let i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - this._fontSize / (8 / this._scale) + this._scale;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    }

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
    }
}
