#!/usr/bin/env python3
"""Draw the square tiles on the CS50 Problems contents page (cs50-psets/index.md).

Style follows assets/img/cs50psets/banner.png: a dark circuit board with thin traces and white icons.
Red = slightly revised CS50 problems (AP or Python), green = new CS50 style problems, blue = MATE CS50 problems (same colors as the key on the page).
Run: python3 tools/make_pset_tiles.py   (writes assets/img/cs50psets/tiles/<slug>.svg; re-runnable)
"""
import random, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets/img/cs50psets/tiles"
RED = ("#6f0f18", "#a3202c")     # background, trace
MATEC = ("#0b3a6e", "#2f7ab8")   # MATE CS50 problems: dark blue
GREEN = ("#11452b", "#2c7a50")
W = "#ffffff"
F = "font-family='Menlo, Consolas, monospace' font-weight='700' fill='#fff' text-anchor='middle'"

def text(s, size=34, y=70):
    return f"<text x='60' y='{y}' font-size='{size}' {F}>{s}</text>"

def rect(x, y, w, h, fill=W, rx=3, extra=""):
    return f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{rx}' fill='{fill}' {extra}/>"

def path(d, w=5, extra=""):
    return f"<path d='{d}' fill='none' stroke='#fff' stroke-width='{w}' stroke-linecap='round' stroke-linejoin='round' {extra}/>"

def circ(x, y, r, fill=W):
    return f"<circle cx='{x}' cy='{y}' r='{r}' fill='{fill}'/>"

def pyramid():  # half pyramid of blocks
    return "".join(rect(26 + c * 17, 78 - r * 17, 15, 15) for r in range(4) for c in range(4 - r))

def hollow_square():
    return rect(32, 32, 56, 56, "none", 4, "stroke='#fff' stroke-width='7'")

def grid():
    return "".join(rect(28 + c * 25, 28 + r * 25, 20, 20, W if (r in (0, 3) or c in (0, 3)) else "none", 3,
                        "stroke='#fff' stroke-width='3'") for r in range(4) for c in range(4))

def battery():
    return (rect(22, 42, 70, 36, "none", 6, "stroke='#fff' stroke-width='5'") + rect(94, 52, 8, 16, W, 2)
            + rect(29, 49, 40, 22, W, 3))

def lineup():  # a queue: three people-ish bars, first one leaving
    return rect(24, 50, 20, 44, W, 5) + rect(50, 50, 20, 44, W, 5) + rect(76, 50, 20, 44, W, 5) + circ(34, 36, 9) + circ(60, 36, 9) + circ(86, 36, 9)

def pizza():
    return (f"<path d='M60 94 L24 38 A66 66 0 0 1 96 38 Z' fill='#fff'/>"
            + circ(48, 52, 6, "#a3202c") + circ(70, 56, 6, "#a3202c") + circ(59, 72, 6, "#a3202c")
            + "<path d='M22 36 A70 70 0 0 1 98 36' fill='none' stroke='#fff' stroke-width='8' stroke-linecap='round'/>")

def palindrome():
    return (text("ab", 30, 62).replace("x='60'", "x='36'") + text("ba", 30, 62).replace("x='60'", "x='84'")
            + "<line x1='60' y1='28' x2='60' y2='84' stroke='#fff' stroke-width='3' stroke-dasharray='5 5'/>"
            + path("M28 84 H92", 3))

def caesar():
    return (text("A", 36, 56).replace("x='60'", "x='34'") + text("D", 36, 56).replace("x='60'", "x='86'")
            + path("M30 70 Q60 100 90 70", 5) + path("M80 66 L91 70 L85 80", 5))

def pathfinder():
    return circ(26, 86, 10) + circ(94, 32, 10) + path("M26 86 V60 H60 V32 H94", 5) + circ(60, 60, 5)

def readability():
    return text("Aa", 46, 76)

def emojize():
    return (circ(60, 60, 38, "none").replace("fill='none'", "fill='none' stroke='#fff' stroke-width='6'")
            + circ(47, 51, 5) + circ(73, 51, 5) + path("M42 70 Q60 88 78 70", 5))

def inheritance():
    return (rect(40, 24, 40, 22, W, 4) + path("M60 46 V58 M30 58 H90 M30 58 V70 M90 58 V70", 4)
            + rect(14, 70, 32, 20, W, 4) + rect(74, 70, 32, 20, W, 4))

def float_profile():
    return (path("M18 44 Q39 20 60 44 T102 44", 5) + path("M18 70 Q39 46 60 70 T102 70", 5, "opacity='.55'")
            + circ(60, 94, 8))

def pid():
    return (path("M18 86 L18 30", 3) + path("M18 86 H104", 3)
            + path("M22 80 C40 20 50 20 62 56 S88 52 100 50", 5)
            + "<line x1='18' y1='50' x2='104' y2='50' stroke='#fff' stroke-width='2' stroke-dasharray='4 5'/>")

TILES = {
    "mario-less": (RED, pyramid), "pathfinder": (GREEN, pathfinder), "palindromes": (GREEN, palindrome),
    "square": (GREEN, hollow_square), "square-grid": (GREEN, grid), "caesar": (RED, caesar),
    "emojize": (RED, emojize), "readability": (RED, readability), "battery": (GREEN, battery),
    "lineup-less": (GREEN, lineup), "lineup-more": (GREEN, lineup), "inheritance": (RED, inheritance),
    "pizza": (RED, pizza), "float-profile": (MATEC, float_profile), "float-pid": (MATEC, pid),
}

MATE = {"float-profile", "float-pid"}   # MATE ROV series: these get the wave badge (add slugs as more arrive)

def badge(cx, cy, r):
    """A small round bright MATE blue badge with two waves. Our own drawing, not MATE's logo."""
    k = r / 15
    def w(dy):
        return (f"<path d='M{cx-9*k:.1f} {cy+dy*k:.1f} q{2.25*k:.1f} {-4*k:.1f} {4.5*k:.1f} 0 t{4.5*k:.1f} 0 t{4.5*k:.1f} 0' "
                f"fill='none' stroke='#fff' stroke-width='{2.4*k:.1f}' stroke-linecap='round'/>")
    return (f"<circle cx='{cx}' cy='{cy}' r='{r}' fill='#2a9fd6' stroke='#fff' stroke-width='{2.5*k:.1f}'/>"
            + w(-3) + w(4))

def traces(seed, color):
    rnd = random.Random(seed)
    out = []
    for _ in range(9):
        x, y = rnd.randrange(0, 121, 10), rnd.randrange(0, 121, 10)
        d, horiz = f"M{x} {y}", rnd.random() < .5
        for _ in range(rnd.randint(2, 4)):
            step = rnd.choice([-1, 1]) * rnd.randrange(10, 50, 10)
            if horiz: x = max(-5, min(125, x + step))
            else: y = max(-5, min(125, y + step))
            d += f" {'H' if horiz else 'V'}{x if horiz else y}"
            horiz = not horiz
        out.append(f"<path d='{d}' fill='none' stroke='{color}' stroke-width='2.5' stroke-linejoin='round'/>"
                   f"<circle cx='{x}' cy='{y}' r='4' fill='none' stroke='{color}' stroke-width='2.5'/>")
    return "".join(out)

OUT.mkdir(parents=True, exist_ok=True)
for slug, ((bg, tr), icon) in TILES.items():
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' width='120' height='120'>"
           f"<rect width='120' height='120' fill='{bg}'/>{traces(slug, tr)}"
           f"<g>{icon()}</g>{badge(98, 22, 15) if slug in MATE else ''}</svg>\n")
    (OUT / f"{slug}.svg").write_text(svg)
print(f"wrote {len(TILES)} tiles to {OUT}")
