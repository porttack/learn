#!/usr/bin/env python3
"""Dev tool, not part of the app. Writes js/core/lettering-data.js: the letters the `write` block draws.

The letters are single strokes, so a pen or an embroidery machine can follow them. Five are Hershey fonts, read from the
`Hershey-Fonts` package on PyPI, which carries the original font data. The package is NOT part of TurtleLab: this
script only needs it once, to make the data file. The sixth, `blocky`, is EMS Osmotron, an SVG font kept in dev/fonts/
(see below), and the seventh, `pixel`, is drawn by hand for TurtleLab (see below). Run it again only to change the fonts:

    python3 -m venv /some/folder && /some/folder/bin/pip install Hershey-Fonts
    /some/folder/bin/python turtlelab/dev/make-lettering-data.py

The fonts the block offers, and why these: each is a few long strokes (so an embroidery machine makes few jumps), has all
95 printable English keyboard keys, and reads well at the sizes that fit a 4 inch hoop. The Hershey set also has
blackletter, Greek and symbol fonts, left out because they are many short strokes or not Latin letters.
  script   Script Simplex   joined up handwriting (the first one the block had)
  fancy    Script Complex   formal, looped writing, more lines than script
  sans     Futura Light     thin print letters, one line each
  bold     Futura Medium    print letters drawn as double lines, so stitched they look thick
  serif    Times Roman      print letters with feet
  blocky   EMS Osmotron     wide letters with square, cut off corners, in few lines (a single line version of Orbitron)
  pixel    drawn for TurtleLab  video game letters made of square pixels, drawn as the outline of the pixels

EMS Osmotron is by Windell H. Oskay (Evil Mad Scientist Laboratories, https://gitlab.com/oskay/svg-fonts), made for Hershey Text from
Orbitron by Matt McInerney (the League of Moveable Type), and is under the SIL Open Font License 1.1 (fonts/osmotron/OFL.txt). Its SVG
file is kept unchanged in dev/fonts/ so this script can be run again without fetching anything. Its straight lines are made fit for
the write block in `read_svg`: stems that poke past the baseline and the capital height are trimmed to them (the block promises
that a capital letter is exactly `size` tall), each letter is centered in its own box, and the numbers are scaled and rounded.

The `pixel` letters are original: dev/fonts/pixel-5x7.txt draws each of the 95 keys as a picture of lit and empty square pixels, 5 wide and
7 tall (the style of old video games and dot matrix displays), and `read_pixels` turns each picture into the outline of its lit pixels. They
are not taken from any font file (not from any game's font either), so they are under the AGPL like the rest of TurtleLab.

Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later. The data it writes is the Hershey
Fonts, which are in the public domain, EMS Osmotron, under the SIL Open Font License, and the pixel letters, under the AGPL, each
with the acknowledgments written at the top of the file it makes.
"""
import json
import os
import re
import xml.etree.ElementTree as ET
from HersheyFonts import HersheyFonts

HERE = os.path.dirname(__file__)

# (id used by the app, where it comes from, and the name of the font in the Hershey-Fonts package or the path of the SVG font).
# Keep `script` first: it is the default. The order is the order of the dropdown (LETTER_FONTS in core/lettering.js says the same).
FONTS = [
    ('script', 'hershey', 'scripts'),
    ('fancy', 'hershey', 'scriptc'),
    ('sans', 'hershey', 'futural'),
    ('bold', 'hershey', 'futuram'),
    ('serif', 'hershey', 'timesr'),
    ('blocky', 'svg', 'fonts/EMSOsmotron.svg'),
    ('pixel', 'pixels', 'fonts/pixel-5x7.txt'),
]

# For the SVG font (units: 1000 to the em). SVG_SCALE turns them into the small whole numbers this app keeps (a capital letter comes out
# 118 tall); SVG_MIN_PAD is the least empty room, on each side of a letter, that is kept.
SVG_SCALE = 0.2
SVG_MIN_PAD = 40
SVG_NS = '{http://www.w3.org/2000/svg}'
CAPITALS_AND_DIGITS = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

# For the pixel font: one pixel is this many of the font's units, so a capital (7 pixels tall) comes out 84.
PIXEL = 12
CAPITAL_ROWS = 7


def length(strokes):
    """The total length of the lines of a letter, in the font's units."""
    return sum(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5 for stroke in strokes for (x1, y1), (x2, y2) in zip(stroke, stroke[1:]))


def squeeze(strokes, low, high):
    """Move every point of a letter's lines into the band low <= y <= high (either may be None). A stem that poked out comes back to the edge of
    the band, and a bar that was a little outside it comes in, so lines that joined still join. (A slanting line that ends outside the band is
    turned a degree or so by it, which no one can see.) Points that land on top of each other are kept once."""
    out = []
    for stroke in strokes:
        points = []
        for x, y in stroke:
            if low is not None:
                y = max(y, low)
            if high is not None:
                y = min(y, high)
            if not points or points[-1] != (x, y):
                points.append((x, y))
        if len(points) >= 2:
            out.append(points)
    return out


def read_svg(relative_path):
    """Read an SVG font whose letters are straight lines (M and L only) into the same shape `read` gives: (cap, { char: [advance, strokes] })."""
    tree = ET.parse(os.path.join(HERE, relative_path))
    raw = {}
    for glyph in tree.iter(SVG_NS + 'glyph'):
        ch = glyph.get('unicode')
        if ch is None or len(ch) != 1 or not 32 <= ord(ch) < 127:
            continue
        d = glyph.get('d', '')
        if re.search(r'[A-KN-Za-z]', d):  # anything but M and L (and numbers)
            raise SystemExit('%s: "%s" is not made of straight lines' % (relative_path, ch))
        strokes = []
        for part in re.split(r'(?=M)', d.strip()):
            nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', part)]
            if len(nums) >= 4:
                strokes.append(list(zip(nums[0::2], nums[1::2])))
        raw[ch] = (float(glyph.get('horiz-adv-x', 0)), strokes)
    missing = [chr(c) for c in range(32, 127) if chr(c) not in raw]
    if missing:
        raise SystemExit('%s has no letter for %r' % (relative_path, missing))

    def ys(ch):
        return [y for stroke in raw[ch][1] for _, y in stroke]

    # The font's own lines: the flat bottom and top of an E are the baseline and the capital height, and an o reaches the x height.
    base, cap_top, x_top = min(ys('E')), max(ys('E')), max(ys('o'))
    glyphs = {}
    for code in range(32, 127):
        ch = chr(code)
        advance, strokes = raw[ch]
        if strokes and (ch in CAPITALS_AND_DIGITS or ch.isalpha()):
            lows, highs = min(ys(ch)), max(ys(ch))
            # Stems poke out past the letters' round ends, so trim them: not below the baseline (unless the letter has a tail), and capitals
            # and digits not above the capital height, small letters with no ascender not above the x height. Marks (. , ' and so on) are left alone.
            low = base if lows > base - 60 else None
            high = cap_top if ch in CAPITALS_AND_DIGITS else (x_top if highs < 560 else None)
            before = length(strokes)
            strokes = squeeze(strokes, low, high)
            # A letter that lost much of its lines was spoiled, not trimmed (an earlier version threw away whole bars): stop.
            if length(strokes) < 0.85 * before:
                raise SystemExit('trimming "%s" took away %d%% of its lines' % (ch, 100 - 100 * length(strokes) / before))
        if strokes:
            xs = [x for stroke in strokes for x, _ in stroke]
            left, right = min(xs), max(xs)
            width = right - left
            advance = max(advance, width + 2 * SVG_MIN_PAD)
            shift = (advance - width) / 2 - left  # the letter centered in its box, as the Hershey ones are
        else:
            shift = 0
        scaled = []
        for stroke in strokes:
            points = []
            for x, y in stroke:
                point = (round((x + shift) * SVG_SCALE), round((y - base) * SVG_SCALE))
                if not points or points[-1] != point:
                    points.append(point)
            if len(points) >= 2:
                scaled.append([n for point in points for n in point])
        glyphs[ch] = [round(advance * SVG_SCALE), scaled]
    return round((cap_top - base) * SVG_SCALE), glyphs


def read_pixel_table(relative_path):
    """Read dev/fonts/pixel-5x7.txt: { key: (rows above the baseline, rows below it) }, each a list of strings of # (lit) and . (empty)."""
    glyphs = {}
    current = None
    with open(os.path.join(HERE, relative_path)) as f:
        for number, raw in enumerate(f, 1):
            line = raw.rstrip('\n')
            if line.startswith(';') or not line.strip():
                continue
            if line.startswith('@ '):
                name = line[2:]
                key = ' ' if name == 'SPACE' else name
                if len(key) != 1 or key in glyphs:
                    raise SystemExit('%s line %d: "%s" is not a new single key' % (relative_path, number, name))
                current = glyphs[key] = ([], [], [False])
            elif current is None:
                raise SystemExit('%s line %d: rows before the first "@ " line' % (relative_path, number))
            elif line == '--':
                current[2][0] = True
            else:
                if set(line.strip()) - set('#.'):
                    raise SystemExit('%s line %d: only # and . make a row' % (relative_path, number))
                (current[1] if current[2][0] else current[0]).append(line.strip())
    return {key: (above, below) for key, (above, below, _) in glyphs.items()}


def pixel_cells(above, below):
    """The lit pixels of one letter as { (column, row) } with row 0 the one just above the baseline and rows below it negative, and its width."""
    cells = set()
    for r, row in enumerate(above):
        cells.update((c, len(above) - 1 - r) for c, v in enumerate(row) if v == '#')
    for r, row in enumerate(below):
        cells.update((c, -1 - r) for c, v in enumerate(row) if v == '#')
    widths = {len(row) for row in above + below}
    if len(widths) != 1:
        raise SystemExit('rows of different widths: %s' % (above + ['--'] + below,))
    return cells, widths.pop()


def pixel_outline(cells):
    """The outline of a set of lit pixels, as closed loops of corner points in pixel units (the last point is the first).

    Every edge between a lit pixel and an empty one is a directed edge with the lit pixel on its left, so the loops join up. Where two lit
    pixels touch only at a corner, the loop turns right there, which joins them into one loop (the pen passes through that corner twice, which
    looks the same and saves a lift of the pen). Corners in the middle of a straight run are dropped."""
    edges = {}
    def add(a, b):
        edges.setdefault(a, []).append((a, b))
    for (x, y) in cells:
        if (x, y - 1) not in cells: add((x, y), (x + 1, y))
        if (x + 1, y) not in cells: add((x + 1, y), (x + 1, y + 1))
        if (x, y + 1) not in cells: add((x + 1, y + 1), (x, y + 1))
        if (x - 1, y) not in cells: add((x, y + 1), (x, y))
    used = set()
    loops = []
    for start in sorted(edges, key=lambda v: (v[1], v[0])):
        for first in edges[start]:
            if first in used:
                continue
            points = [first[0]]
            edge = first
            while True:
                used.add(edge)
                a, b = edge
                points.append(b)
                heading = (b[0] - a[0], b[1] - a[1])
                options = [e for e in edges.get(b, []) if e not in used]
                if not options:
                    break
                # cross product of the way in and the way out: negative is a right turn, so the smallest is the sharpest right
                edge = min(options, key=lambda e: heading[0] * (e[1][1] - e[0][1]) - heading[1] * (e[1][0] - e[0][0]))
            if points[-1] != points[0]:
                raise SystemExit('an outline that does not close: %s' % (points,))
            ring = points[:-1]
            corners = [q for i, q in enumerate(ring)
                       if (q[0] - ring[i - 1][0]) * (ring[(i + 1) % len(ring)][1] - q[1]) - (q[1] - ring[i - 1][1]) * (ring[(i + 1) % len(ring)][0] - q[0]) != 0]
            loops.append(corners + [corners[0]])
    # The biggest first (a letter's outside before the holes in it), then left to right: a fixed order, so the file comes out the same each time.
    loops.sort(key=lambda loop: (-(max(p[0] for p in loop) - min(p[0] for p in loop)) * (max(p[1] for p in loop) - min(p[1] for p in loop)), min(p[0] for p in loop)))
    return loops


def read_pixels(relative_path):
    """The pixel font: each key's picture of pixels (dev/fonts/pixel-5x7.txt) as the outline of its lit pixels. Returns (cap, glyphs) like `read`."""
    table = read_pixel_table(relative_path)
    missing = [chr(code) for code in range(32, 127) if chr(code) not in table]
    if missing:
        raise SystemExit('%s has no letter for: %s' % (relative_path, ''.join(missing)))
    glyphs = {}
    for code in range(32, 127):
        ch = chr(code)
        above, below = table[ch]
        cells, width = pixel_cells(above, below)
        if ch in CAPITALS_AND_DIGITS:
            rows = {y for (_, y) in cells}
            if max(rows) != CAPITAL_ROWS - 1 or min(rows) != 0:
                raise SystemExit('%s: a capital or digit must fill rows 0 to %d, not %d to %d' % (ch, CAPITAL_ROWS - 1, min(rows), max(rows)))
        strokes = [[n * PIXEL for point in loop for n in point] for loop in pixel_outline(cells)]
        glyphs[ch] = [(width + 1) * PIXEL, strokes]
    return CAPITAL_ROWS * PIXEL, glyphs


def read(hershey_name):
    font = HersheyFonts()
    font.load_default_font(hershey_name)
    baseline = int(font.all_glyphs['A'].base_line)  # y of the bottom of a capital letter, in the font's own units (y grows down)
    glyphs = {}
    for code in range(32, 127):
        ch = chr(code)
        g = font.all_glyphs[ch]
        left = g.left_offset
        strokes = []
        for stroke in g.strokes:
            # x counted from the glyph's left edge, y counted up from the baseline
            strokes.append([n for (x, y) in stroke for n in (x - left, baseline - y)])
        glyphs[ch] = [g.char_width, strokes]
    cap = int(max(max(s[1::2]) for s in glyphs['H'][1]))
    return cap, glyphs


out = os.path.join(os.path.dirname(__file__), '..', 'js', 'core', 'lettering-data.js')
with open(out, 'w') as f:
    f.write('''// TurtleLab: the letters for the write block. GENERATED by dev/make-lettering-data.py, do not edit.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later, except for the font data below.
//
// The font data is from the Hershey Fonts (Script Simplex, Script Complex, Futura Light, Futura Medium and Times Roman),
// which are in the public domain. Their notices:
//   - The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the
//     U. S. National Bureau of Standards.
//   - The format of the font data in the distribution this was made from was originally created by
//     James Hurt, Cognition, Inc., 900 Technology Park Drive, Billerica, MA 01821.
// This is not the format that the U.S. NTIS distributes.
//
// The `blocky` font is EMS Osmotron, by Windell H. Oskay (Evil Mad Scientist Laboratories), a single line version made for Hershey
// Text of Orbitron by Matt McInerney (the League of Moveable Type), and is under the SIL Open Font License, Version 1.1. Orbitron's
// notice: "Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: Orbitron".
// This font is not called Orbitron. It was changed here (stems trimmed to a common baseline and capital height, each letter centered in
// its box, the numbers scaled and rounded, only the 95 printable characters kept). The license is in fonts/osmotron/OFL.txt, and that
// font's data (the `blocky` entry below) stays under it. Everything else in this file is under the AGPL.
//
// The `pixel` font is original: each letter was drawn by hand as a picture of square pixels (dev/fonts/pixel-5x7.txt), and the data below is the
// outline of each letter's lit pixels. It is not taken from any font file.
//
// FONT_DATA has one entry for each font, by the id the app uses. In each, `cap` is how tall a capital letter is in the
// font's own units, and each letter is [advance, strokes]. `advance` is how far the pen moves along the line after the
// letter. Each stroke is a list of x, y, x, y, ... with x counted from the letter's left edge and y counted UP from the
// baseline (so a capital letter reaches `cap` and a g hangs below zero).

export const FONT_DATA = {
''')
    for k, (font_id, kind, source) in enumerate(FONTS):
        cap, glyphs = {'hershey': read, 'svg': read_svg, 'pixels': read_pixels}[kind](source)
        f.write('  %s: {\n    cap: %d,\n    glyphs: {\n' % (font_id, cap))
        items = list(glyphs.items())
        for i, (ch, data) in enumerate(items):
            f.write('      %s: %s%s\n' % (json.dumps(ch), json.dumps(data, separators=(',', ':')), ',' if i < len(items) - 1 else ''))
        f.write('    },\n  }%s\n' % (',' if k < len(FONTS) - 1 else ''))
        print(font_id, '<-', source, 'capital height', cap)
    f.write('};\n')
print('wrote', os.path.abspath(out))
