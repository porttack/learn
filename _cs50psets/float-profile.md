---
title: "Profiling Float"
order: 13
chapter: 8
source: original
slides_link: /cs50-psets/float-profile-slides/
subtitle: "Steer a profiling float and judge its data: did it hold its depth for 30 seconds, and did it touch the bottom?"
---

<style>
/* The MATE logo floats in the header, right of the title and left of the menu button. */
.page-content .wrapper { position: relative; }
.mate-logo { position: absolute; top: 8px; right: 60px; line-height: 0; z-index: 1; }
.mate-logo img { display: block; height: 72px; width: auto; }
.mate-note { margin: 0.2em 0 1em; font-size: 0.8em; color: #57606a; }
a.slides-cta { display: flex; align-items: center; gap: 1em; max-width: 36em; margin: 1em auto 1.4em; padding: 0.8em 1.2em; background: #0b5cad; color: #fff; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 8px rgba(11,92,173,0.35); }
a.slides-cta:hover, a.slides-cta:focus-visible { background: #084a8c; color: #fff; text-decoration: none; }
a.slides-cta:visited { color: #fff; }
.page-content a.slides-cta, .page-content a.slides-cta * { text-decoration: none !important; }
.page-content a.slides-cta:hover strong { text-decoration: underline !important; }
.slides-cta-play { flex: 0 0 auto; width: 2.6em; height: 2.6em; border-radius: 50%; background: #fff; color: #0b5cad; display: flex; align-items: center; justify-content: center; font-size: 1.1em; padding-left: 0.15em; }
.slides-cta strong { font-size: 1.2em; }
.slides-cta small { display: block; margin-top: 0.15em; font-size: 0.85em; opacity: 0.95; line-height: 1.35; }
@media print { a.slides-cta { display: none; } }
@media (max-width: 640px) {
  .mate-logo { position: static; text-align: center; margin: 0 0 0.6em; }
  .mate-logo img { margin: 0 auto; height: 64px; }
}
.float-hero { display: flex; flex-wrap: wrap; gap: 1em; align-items: flex-end; justify-content: center; margin: 1em 0; }
.float-hero figure { margin: 0; flex: 0 1 auto; }
.float-hero img { display: block; max-width: 100%; height: auto; border-radius: 4px; }
.float-hero .fh-photo img { max-height: 420px; width: auto; }
.float-hero .fh-cut img { max-height: 420px; width: auto; background: #fff; }
.float-hero figcaption { font-size: 0.8em; max-width: 24em; }
.float-explorer { margin: 1.5em 0; padding: 1em 1.2em; border: 1px solid #d8d8d8; border-radius: 6px; background: #f6f6f6; }
.float-explorer canvas { display: block; width: 100%; background: #fff; border: 1px solid #ccc; border-radius: 4px; }
.float-explorer .fx-row { display: flex; flex-wrap: wrap; gap: 0.4em; margin: 0.5em 0; align-items: center; }
.float-explorer button { font: inherit; font-size: 0.9em; padding: 0.35em 0.75em; border: 1px solid #888; border-radius: 4px; background: #fff; color: inherit; cursor: pointer; }
.float-explorer button[aria-pressed="true"] { background: #0b5cad; border-color: #0b5cad; color: #fff; }
.float-explorer button:focus-visible, .float-explorer canvas:focus-visible, .float-explorer select:focus-visible { outline: 3px solid #d9480f; outline-offset: 2px; }
.float-explorer select { font: inherit; font-size: 0.9em; padding: 0.3em; }
.float-explorer h3 { margin: 1em 0 0.2em; font-size: 1.05em; }
.float-explorer .fx-readout { min-height: 1.5em; font-weight: 600; margin: 0.4em 0; }
.float-explorer .fx-small { font-size: 0.85em; margin: 0.3em 0; }
.float-explorer-noscript, .float-explorer-print { font-size: 0.9em; }
.float-explorer-print { display: none; }
.float-explorer:not(.fx-ready) .fx-needs-js { display: none; }
.sv-row { display: flex; flex-wrap: wrap; gap: 1em; margin: 0.6em 0; }
.sv-pool { flex: 0 0 220px; max-width: 100%; }
.sv-graph { flex: 1 1 300px; min-width: 0; }
.float-explorer input[type="range"] { flex: 1 1 160px; min-width: 120px; }
.float-explorer .fx-check { display: block; margin: 0.4em 0; font-size: 0.9em; }
@media print { .float-explorer { display: none; } .float-explorer-print { display: block; } }
</style>

<a class="mate-logo" href="https://materovcompetition.org" title="MATE ROV Competition"><img src="{{ '/assets/img/cs50psets/mate-rov-monterey-bay.png' | relative_url }}" alt="MATE ROV Competition, Monterey Bay logo"></a>
<a class="slides-cta" href="{{ '/cs50-psets/float-profile-slides/' | relative_url }}"><span class="slides-cta-play" aria-hidden="true">&#9654;</span><span><strong>Open the slides</strong><small>15 slides: videos that play by themselves, a map of 4,000 real floats, the Atlantic compared with the Pacific, and the three simulated floats running on their own.</small></span></a>

<p class="mate-note">This problem is based on the 2027 MATE Floats! task. Logo: MATE ROV Competition, Monterey Bay, used under the permission in the <a href="https://materovcompetition.org/marketing-kit">MATE ROV Competition Marketing Kit</a>.</p>

<div class="float-hero">
  <figure class="fh-photo">
    <img src="{{ '/assets/img/cs50psets/argo-float-aranda.jpg' | relative_url }}" alt="A yellow Argo profiling float standing upright in a wooden frame on a ship's green deck, next to a coil of orange rope">
    <figcaption>A real Argo float on the deck of a research ship, before it is dropped into the sea. It is about 2 meters long. Yours will be under 60 centimeters. (Photo: Antti Leppänen, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:Argo_float_Aranda.jpg">Wikimedia Commons</a>; resized.)</figcaption>
  </figure>
  <figure class="fh-cut">
    <img src="{{ '/assets/img/cs50psets/argo-cutaway.png' | relative_url }}" alt="Cutaway drawing of an Argo float: a long tube with an antenna at the top and a pump with a rubber oil bladder at the bottom">
    <figcaption>A cutaway of an Argo float. The antenna is at the top. Near the bottom, a pump moves oil in and out of a rubber bladder: that is the buoyancy engine. (Public domain, via <a href="https://commons.wikimedia.org/wiki/File:Argo_Cutaway.png">Wikimedia Commons</a>.)</figcaption>
  </figure>
</div>

## What real floats bring back

The floats in this problem are small copies of a real idea. Right now,
thousands of robots like the one in the photo are drifting through the
oceans. The biggest group is the **Argo** program, run by many
countries together. Each Argo float repeats the same trip about every
10 days for years: it sinks to about 1,000 meters and drifts with the
current, dives to 2,000 meters, then rises to the surface while
measuring **temperature** and **salinity** (how salty the water is) at
every depth. At the surface it sends its data to a satellite, and then
it sinks again. Nobody steers it. The data are free for anyone to use.

Some floats carry more sensors. **Chemistry and biology floats** add
**oxygen**, **nitrate**, **chlorophyll** and more. A project called
**SOCCOM** put floats like this around Antarctica, where ships rarely
go. **GO-BGC**, the project this year's competition is based on,
builds a network of them around the whole world.

Why do scientists want all this? The ocean soaks up most of the extra
heat from global warming and roughly a quarter of the carbon dioxide
people release. Floats are how we watch it happen, a few meters at a
time, from the surface down to 2,000 meters.

Your float's job is a small version of theirs. At each depth it makes
a data packet with the time, the depth, the temperature and a light
reading, and it sends them when it surfaces. The graph you will make
at the end of the competition task (temperature on one axis and depth
on the other) is the same kind of graph you can explore below.

<div class="float-explorer" id="float-explorer" data-timelapse-src="{{ '/assets/js/cs50psets/float-timelapse-data.js' | relative_url }}">
  <h3>Where are the floats?</h3>
  <p class="fx-small">Each dot is one float, at the place where it last reported between 1 and 10 November 2026. No coastlines are drawn. The floats draw the oceans for us. The five numbered circles are real profiles. Click a circle, or a button below, to add a region to the graph or take it off, and compare them side by side.</p>
  <div class="fx-row">
    <button type="button" id="fx-all"></button>
    <button type="button" id="fx-bgc"></button>
  </div>
  <canvas id="fx-map" role="img" aria-label="World map made of dots, one for each of about four thousand Argo floats. Five numbered circles mark profiles you can open."></canvas>
  <div class="fx-row fx-needs-js"><button type="button" id="fx-tl-start">Timelapse: watch the floats arrive and drift, 1997 to now</button></div>
  <div id="fx-tl" hidden>
    <div class="fx-row">
      <button type="button" id="fx-tl-play">Pause</button>
      <input type="range" id="fx-tl-time" min="0" max="1160" value="0" aria-label="Time in the timelapse">
      <label for="fx-tl-speed" class="fx-small">Speed:</label>
      <select id="fx-tl-speed"><option value="1.2">Slow</option><option value="2" selected>Medium</option><option value="4">Fast</option></select>
    </div>
    <div class="fx-row">
      <button type="button" id="fx-tl-follow">Follow a random float</button>
      <button type="button" id="fx-tl-unfollow" hidden>Stop following</button>
      <button type="button" id="fx-tl-color" aria-pressed="false">Color: each float its own</button>
      <button type="button" id="fx-tl-exit">Back to the November 2026 snapshot</button>
    </div>
    <p class="fx-readout" id="fx-tl-readout" aria-live="polite"></p>
    <canvas id="fx-count" role="img" aria-label="Line graph of the number of floats reporting over time, from 1997 to now: all floats, and those with chemistry and biology sensors. Click it to jump to a date."></canvas>
    <p class="fx-small">Each frame is a ten day window, taken every six months from November 1997 to November 2026. Click the map to follow a float, or click the graph to jump to a date. The positions are real. Between the windows each dot slides in a straight line from one position to the next, so the paths are smoothed guesses. A float that reports less often than every ten days can be missed in a window, so the early counts are a little low.</p>
  </div>
  <h3>What did these floats measure?</h3>
  <div class="fx-row fx-needs-js" id="fx-profiles" role="group" aria-label="Choose which regions to compare"></div>
  <div class="fx-small" id="fx-info"></div>
  <div class="fx-row fx-needs-js" id="fx-vars" role="group" aria-label="Choose what to graph"></div>
  <div class="fx-row">
    <label for="fx-range">Depth range:</label>
    <select id="fx-range">
      <option value="2000">0 to 2,000 meters (the whole trip up)</option>
      <option value="200">0 to 200 meters (where sunlight reaches)</option>
    </select>
  </div>
  <canvas id="fx-chart" tabindex="0" role="img" aria-label="Graph of one measurement against depth for the chosen regions, one colored line each. The surface is at the top. Use the arrow keys to compare values at one depth."></canvas>
  <p class="fx-readout" id="fx-readout" aria-live="polite"></p>
  <p class="fx-small" id="fx-why"></p>
  <p class="fx-small">These are real measurements, thinned to about 57 depths per profile and checked only for impossible values. They are the data as the float sent it, not the final cleaned-up version scientists publish. Do not expect smooth curves: real water comes in layers, and a float passing through them shows wiggles. The orange strip is the 0 to 2 meters where your float works: on the whole-trip graph it is a sliver.</p>
</div>

<p class="float-explorer-noscript"><noscript>The interactive map needs JavaScript. It shows where about four thousand floats are and what five of them measured.</noscript></p>
<p class="float-explorer-print">On the web page there is an interactive map of about four thousand real floats and graphs of what five of them measured.</p>

<p class="fx-small" style="font-size:0.8em">Data: collected and made freely available by the International Argo Program and the national programs that contribute to it (<a href="https://argo.ucsd.edu">argo.ucsd.edu</a>; the Argo Program is part of the Global Ocean Observing System), read through <a href="https://argovis.colorado.edu">Argovis</a>. Float map positions are the most recent profile of each float, 1 to 10 November 2026.</p>

<script src="{{ '/assets/js/cs50psets/float-data.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/cs50psets/float-explorer.js' | relative_url }}" defer></script>

## Background

A profiling float is a tube full of electronics that sinks, rises, and
sinks again on its own, measuring temperature and light as it goes,
and then radios its data home when it breaks the surface.

The 2027 MATE Floats! task asks student teams to build a small one. It
has no tether and no remote control. For one **vertical profile** the
float must:

1. Start on the surface, then sink to the **hold depth** and stay
   within **plus or minus 0.33 meters** of that depth for **30
   seconds in a row**. If it drifts out of that band even once, the 30
   seconds start over.
2. Sink to the **deep depth**.
3. Rise to the surface, taking a reading every **0.5 meters** on the
   way up, each one within **20 centimeters** of its depth.
4. Transmit its data packets once it is back on top.

The competition says how deep the pool is, and the depths follow from
that. A 13 foot pool is about **3.96 meters** deep, so this problem
uses these numbers:

| | Depth |
|---|---|
| Hold depth | 1.0 meters (stay between 0.67 and 1.33) |
| Deep depth | 2.0 meters |
| Readings on the way up | 2.0, 1.5, 1.0, 0.5 and 0.0 meters: five readings |

Nobody watches a float underwater. The judge looks at the **data
packets** it sends back and decides what it did. **In this problem you
are the judge**, and you are also the float's brain. You will write
four short functions. One steers the float. The other three read the
float's packets and answer two questions:

- Did the float **touch the bottom** of the pool? (That costs points.)
- Did it **hold** its depth for 30 seconds in a row?

We give you three simulated floats. One of them is fine, and each of
the others has something wrong with it. Your steering code makes them
dive, and your judging code finds out which is which.

| What the judge looks for | Points |
|---|---|
| Held the hold depth for 30 seconds | +5 |
| Touched the bottom of the pool | -5 |

(The real scoresheet has more lines than these two. It also checks the
readings on the way up, which this problem does not judge.)

<div class="float-explorer" id="sim-viewer">
  <h3>Watch the three floats</h3>
  <p class="fx-small">These three floats are what the simulator in this problem produces. The picture on the left is a side view of a 13 foot pool with the float moving in it. The graph on the right is the log of packets the float sends, which is all a judge ever sees. Press Play, or drag the slider.</p>
  <div class="fx-row" id="sv-floats" role="group" aria-label="Choose a simulated float"></div>
  <div class="sv-row">
    <div class="sv-pool"><canvas id="sv-pool" role="img" aria-label="Side view of a pool with a yellow float moving up and down"></canvas></div>
    <div class="sv-graph"><canvas id="sv-graph" role="img" aria-label="Graph of the float's depth over time. The surface is at the top."></canvas></div>
  </div>
  <div class="fx-row">
    <button type="button" id="sv-play">Play</button>
    <input type="range" id="sv-time" min="1" max="75" value="1" aria-label="Time in seconds">
    <span class="fx-small" id="sv-clock"></span>
  </div>
  <label class="fx-check"><input type="checkbox" id="sv-judge"> Show what a correct judge finds: the 30 second hold (gold)</label>
  <p class="fx-small" id="sv-note"></p>
  <div id="sv-review" hidden>
    <h3>Review the play: graph the data</h3>
    <p class="fx-small">When the float is back on top, the team graphs what it sent. The manual asks for two graphs from one profile: <strong>temperature versus depth</strong> and <strong>light versus depth</strong>, each with the measurement on the X axis and depth on the Y axis. They must be drawn on a computer, and they need a reading at every required depth. That part of the task is not what you are coding here, but this is what the team does next.</p>
    <div class="sv-row">
      <div class="sv-graph"><canvas id="sv-temp" role="img" aria-label="Temperature versus depth graph made from the float's packets at each required depth"></canvas></div>
      <div class="sv-graph"><canvas id="sv-light" role="img" aria-label="Light versus depth graph made from the float's packets at each required depth"></canvas></div>
    </div>
    <p class="fx-small" id="sv-review-note"></p>
  </div>
</div>
<p class="float-explorer-print">On the web page there is an animation of the three simulated floats moving in a pool.</p>
<script src="{{ '/assets/js/cs50psets/float-sim-data.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/cs50psets/float-sim-viewer.js' | relative_url }}" defer></script>

<aside class="callout note" markdown="1">
**NOTE**

The steering rule you finish (`decide`) is the simplest possible one,
on purpose. Making a real float hold its depth in a real pool is the
hard engineering job of the competition, and it belongs to the team
that builds the float. This problem is mostly about reading a float's
data and deciding what it did, which is the other half of the job. If
you want to try a smarter steering rule, that is the extra credit.
</aside>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir float
cd float
code float.py
```

## Starter Code

You will work in pairs, so decide who types first and swap after each
function.

A **data packet** is a small list of two numbers, `[seconds, depth]`:
the time since the float started, in seconds, and the depth in meters
of the **top** of the float. If `packet = [10, 1.9]`, then `packet[0]`
is `10` and `packet[1]` is `1.9`. A **log** is a list of packets in
time order, like `[[1, 0.0], [2, 0.1], [3, 0.3]]`. In this problem the
float sends one packet every second.

Paste this into `float.py`. These are the four functions you write.
The first branch of `decide` is already filled in. Run
`python3 -m doctest float.py` to check the examples. Silence means every
example passed. Add at least one example of your own to each function.

```python
"""
Profiling Float

Slug: porttack/cs50/problems/py/float_profile
Doctests: python3 -m doctest float.py
"""

import random

POOL_DEPTH = 3.96     # meters
FLOAT_LENGTH = 0.6    # meters, below the top of the float
# the deepest the TOP of the float can go before its bottom hits the floor
FLOOR = POOL_DEPTH - FLOAT_LENGTH

HOLD_DEPTH = 1.0
HOLD_BAND = 0.33
HOLD_SECONDS = 30
DEEP = 2.0

COAST = 0.1   # stop pushing when this close to the target, in meters


def decide(depth, speed, target):
    """
    The float's brain. Every second, it looks at where it is and where
    it wants to be, and picks what the buoyancy engine does next.

    Args:
        depth: how deep the top of the float is now, in meters.
        speed: how fast the float is sinking, in meters per second.
            A float that is rising has a negative speed. You will not
            need it until the extra credit.
        target: the depth, in meters, that the float is trying to
            reach.

    Returns:
        The string "SINK" if the float is more than COAST meters above
        its target, "RISE" if it is more than COAST meters below its
        target, and "IDLE" if it is close enough (so it coasts).

    >>> decide(0.0, 0.0, 1.0)
    'SINK'
    >>> decide(2.5, 0.0, 1.0)
    'RISE'
    >>> decide(1.05, 0.0, 1.0)
    'IDLE'
    >>> decide(1.0, 0.0, 2.0)
    'SINK'
    """
    if depth < target - COAST:
        return "SINK"
    # Your turn: the other two cases.
    pass


def touched_bottom(log):
    """
    Decides whether the float touched the bottom of the pool.

    Args:
        log: a list of packets. Each packet is a list [seconds, depth],
            with depth in meters.

    Returns:
        True if any packet has a depth of FLOOR or more, otherwise
        False.

    >>> touched_bottom([[0, 0.0], [5, 1.2], [10, 2.1], [15, 1.0]])
    False
    >>> touched_bottom([[0, 0.0], [5, 2.5], [10, 3.4], [15, 1.0]])
    True
    >>> touched_bottom([[5, 3.36]])
    True
    """
    pass


def in_band(depth):
    """
    Decides whether one depth is inside the hold band: HOLD_BAND meters
    above or below HOLD_DEPTH.

    Args:
        depth: a depth in meters.

    Returns:
        True if depth is between HOLD_DEPTH - HOLD_BAND and
        HOLD_DEPTH + HOLD_BAND, otherwise False.

    >>> in_band(1.0)
    True
    >>> in_band(1.2)
    True
    >>> in_band(0.8)
    True
    >>> in_band(0.5)
    False
    >>> in_band(1.6)
    False
    >>> in_band(0.0)
    False
    """
    pass


def held(log):
    """
    Decides whether the float held the hold depth for HOLD_SECONDS in a
    row. The float sends one packet every second, so that means
    HOLD_SECONDS packets in a row that are all in the band.

    Args:
        log: a list of packets. Each packet is a list [seconds, depth],
            with depth in meters, one packet per second, in time order.

    Returns:
        True if there is a run of HOLD_SECONDS or more packets in a row
        that are all in the band, otherwise False. One packet outside
        the band ends the run, and counting starts over.

    The examples build a log with a list comprehension:
    [[t, 1.0] for t in range(30)] is a log of 30 packets, one per
    second, all at 1.0 meters.

    >>> held([[t, 1.0] for t in range(30)])
    True
    >>> held([[t, 1.0] for t in range(29)])
    False
    >>> held([[0, 2.5]] + [[t, 1.0] for t in range(1, 32)])
    True
    >>> held([[t, 1.0] for t in range(10)] + [[10, 2.5]] +
    ...      [[t, 1.0] for t in range(11, 30)])
    False
    """
    pass
```

## The Floats

Paste the rest **under** your four functions. You do not change it
to finish the problem, but do read it. You can write your four
functions first and paste this later: the doctests and check50 test
your four functions without it. You need it to run `python3 float.py`,
which shows the floats diving and prints the score cards. It makes three simulated floats,
sends each one through a dive steered by **your** `decide`, and calls
your other functions to score it.

```python
FLOATS = [
    {"name": "Steady",  "push": 0.04, "bias": 0.00, "noise": 0.00, "seed": 1},
    {"name": "Heavy",   "push": 0.04, "bias": 0.02, "noise": 0.00, "seed": 1},
    {"name": "Jittery", "push": 0.04, "bias": 0.00, "noise": 0.12, "seed": 3},
]
# push:  how hard the buoyancy engine pushes each second (bigger is stronger)
# bias:  a small constant pull. Positive means the float is a bit too heavy
# noise: how much random jitter the depth sensor adds to every packet
# seed:  makes the "random" jitter come out the same every run


def simulate(settings):
    """
    Runs one float through a whole dive, one second at a time. The
    float goes to the hold depth, waits there 30 seconds, sinks to the
    deep depth, then rises to the surface. At each moment this function
    chooses the target and asks decide() what to do about it. The
    float's own program (decide) sees its true depth. Only the packets
    it sends carry the sensor jitter, because the jitter is the judge's
    problem here, not the float's.

    Args:
        settings: a dictionary with the keys "push", "bias", "noise"
            and "seed" (see FLOATS above).

    Returns:
        A log: a list of packets [seconds, depth], one every second.
    """
    rnd = random.Random(settings["seed"])
    depth, speed, t = 0.0, 0.0, 0
    phase, hold_since = "TO_HOLD", None
    log = []
    while phase != "DONE" and t < 400:
        # pick the target for this part of the dive
        if phase == "TO_HOLD":
            target = HOLD_DEPTH
            if abs(depth - HOLD_DEPTH) <= HOLD_BAND:
                phase, hold_since = "HOLD", t
        elif phase == "HOLD":
            target = HOLD_DEPTH
            if abs(depth - HOLD_DEPTH) > HOLD_BAND:
                hold_since = t
            elif t - hold_since >= HOLD_SECONDS:
                phase = "TO_DEEP"
        elif phase == "TO_DEEP":
            target = DEEP + 0.5     # aim a bit past, so it really arrives
            if depth >= DEEP:
                phase = "UP"
        else:
            target = -0.5           # aim a bit above the surface

        action = decide(depth, speed, target)
        pushes = {"SINK": settings["push"],
                  "RISE": -settings["push"],
                  "IDLE": 0.0}
        push = pushes[action]
        # the water slows the float by 10% each second
        speed = (speed + push + settings["bias"]) * 0.9
        depth = max(0.0, depth + speed)
        t += 1
        log.append([t, round(depth + rnd.gauss(0, settings["noise"]), 2)])
        if phase == "UP" and depth <= 0.05:
            phase = "DONE"
    return log


def score_card(name, log):
    """
    Judges one float with your functions and prints a score card.

    Args:
        name: the float's name, a string.
        log: the float's log, a list of packets [seconds, depth].

    Returns:
        The float's score, an integer.
    """
    points = 0
    print(name)
    if held(log):
        print("  Hold:  yes,", HOLD_SECONDS, "packets in a row  (+5)")
        points += 5
    else:
        print("  Hold:  FAILED. Never stayed in the band for",
              HOLD_SECONDS, "packets in a row.")
    if touched_bottom(log):
        print("  Floor: TOUCHED THE BOTTOM  (-5)")
        points -= 5
    else:
        print("  Floor: stayed off the bottom")
    print("  Score:", points)
    return points


def show(log):
    """
    Prints a picture of a dive: time goes down the page, depth goes
    across, and a "|" on each side marks the hold band.

    Args:
        log: a list of packets [seconds, depth].
    """
    low = int((HOLD_DEPTH - HOLD_BAND) * 20)
    high = int((HOLD_DEPTH + HOLD_BAND) * 20)
    print("time      surface -> deeper")
    for t, depth in log[::3]:    # every third packet
        row = [" "] * 80
        row[low] = "|"
        row[high] = "|"
        row[min(79, max(0, int(depth * 20)))] = "o"
        print(f"{t:4d} s  " + "".join(row).rstrip())


def main():
    scores = []
    for settings in FLOATS:
        scores.append(score_card(settings["name"], simulate(settings)))
        print()
    print("Best float:", FLOATS[scores.index(max(scores))]["name"])
    print()
    show(simulate(FLOATS[0]))


if __name__ == "__main__":
    main()
```

## Specification

### Part 1: Steer the float

Finish `decide(depth, speed, target)`. Once a second the float asks it:
"I am at `depth` and I want to be at `target`. What should the engine
do?" It answers with one word.

- If the float is more than `COAST` meters **above** its target, the
  answer is `"SINK"`. We wrote this part for you.
- If the float is more than `COAST` meters **below** its target, the
  answer is `"RISE"`.
- Otherwise it is close enough, and the answer is `"IDLE"`, which lets
  it coast.

`speed` is there for the extra credit. You do not need it yet. When
`decide` works, paste in the code from The Floats, run
`python3 float.py`, and look at the picture of the Steady float's dive
at the bottom of the output. (The score cards above
the picture will say FAILED until your judging functions work. That is
fine.)

### Part 2: Did it touch the bottom?

Implement `touched_bottom(log)`. Look at every packet. If any packet's
depth is `FLOOR` or more, the float touched the bottom. This is the
quickest one, so start here.

### Part 3: Is this depth in the band?

Implement `in_band(depth)`. The hold band is `HOLD_BAND` meters above
and below `HOLD_DEPTH`. With our numbers that is 0.67 to 1.33 meters.
Return `True` if `depth` is inside it and `False` if not. There is no
loop here, just one yes-or-no question about one number.

### Part 4: Did it hold?

Implement `held(log)`, using your `in_band`.

- The float must stay in the band for 30 seconds **in a row**. It sends
  one packet a second, so that is 30 packets in a row, all in the
  band.
- One packet outside the band breaks the run, and the count starts
  over from zero. A float that was in the band for 20 packets, left,
  and came back needs a whole new 30.
- Return `True` as soon as you have seen 30 in a row. If you get all the
  way through the log without that, return `False`.

(The real judge looks for seven packets, five seconds apart. That is
also 30 seconds. Our float sends faster, so we count more packets.)

### Run it

When all four work, run `python3 float.py`. You should see this score
card, then a picture of the Steady float's dive:

```
Steady
  Hold:  yes, 30 packets in a row  (+5)
  Floor: stayed off the bottom
  Score: 5

Heavy
  Hold:  yes, 30 packets in a row  (+5)
  Floor: TOUCHED THE BOTTOM  (-5)
  Score: 0

Jittery
  Hold:  FAILED. Never stayed in the band for 30 packets in a row.
  Floor: stayed off the bottom
  Score: 0

Best float: Steady
```

If your numbers differ, your judge is disagreeing with ours. Look at the
float's picture with `show(simulate(FLOATS[1]))` (change the number to
look at a different float) and decide who is right.

## Hints

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- For `decide`, the part we gave you asks "is the float too shallow?"
  The other two cases are the mirror image and the leftover. Here is
  the shape:

  ```python
  if depth < target - COAST:
      return "SINK"
  if ____:                    # too deep: below the target by more than COAST
      return ____
  return ____                 # close enough
  ```

- `for packet in log:` gives you one packet at a time. Inside the
  loop, `packet[0]` is the time and `packet[1]` is the depth.
- For `touched_bottom`, as soon as you find a deep packet you can
  `return True` right away. Only after the loop has checked every
  packet can you `return False`.
- For `in_band`, the answer to the question is already a `True` or a
  `False`. You can `return` the comparison itself. Python lets you chain
  two comparisons, like `1 <= x <= 5`. If that is new to you, `and`
  works too: `x >= 1 and x <= 5`.
- For `held`, you need one number that you keep as you go through the
  log: how many packets in a row have been in the band so far. Call it
  `run`. Start it at 0. Here is the shape, with the important parts left
  for you:

  ```python
  run = 0
  for packet in log:
      if ____:            # is this packet in the band?
          run = ____      # one more in a row
      else:
          run = ____      # the run is broken
      if run >= HOLD_SECONDS:
          return ____
  return ____             # we never got 30 in a row
  ```

- To see what is going on, `print(log[:10])` shows the first ten
  packets of a float's log.

</details>

## To Get Full Credit

Submit early, then keep improving.

- `decide`, `touched_bottom`, `in_band` and `held` pass the examples in
  the starter code and your own extra examples. Try a log with no packets at
  all, and a float that is in the band for 29 packets, leaves for one, and
  comes back for 29 more.
- Your score card matches the one above.

## Extra Credit: A Smarter `decide`

Your `decide` is a simple rule. Make it smarter, on the honor code:
this part is for **your** brain, so no looking up answers and no asking
an AI. Ask your partner, and if you are stuck, ask your teacher for a
question back, not an answer.

The rules:

- Change only the body of `decide`. Keep its three arguments and its
  three possible answers, `"SINK"`, `"RISE"` and `"IDLE"`.
- Do not change the numbers in `FLOATS`. The hardware is what it is.
- The goal: make **Heavy** score **5**.
- Look at `show(simulate(FLOATS[1]))` to see what Heavy does wrong, and
  think about what the float could do differently. Your `decide` never
  looks at `speed`. Why might it matter?

Then look at "Jittery" again. Its trouble is jitter in the packets, not
anything the float does, so a better `decide` should not matter. Does
its score change? If it does, explain why in one sentence. If it does
not, explain that instead.

## Going Further

- **Fix the floats.** The numbers in `FLOATS` describe the floats'
  hardware. "Heavy" is a little too heavy (`bias`). Change one number at
  a time until it scores 5. What did you have to give up?
- **Build your own.** Add a float to `FLOATS` and try to find settings
  that score 5, then settings that score as low as you can. Can you make
  a float that scores -5?
- **Is Jittery really bad?** Its float is fine. It is the sensor that
  is noisy. Change `held` so that it looks at three packets in a row
  before it compares to the band, and count it as in the band if two of
  the three are. Does Jittery pass now? Does an honestly bad float still
  fail?
- **A sensor below the top.** If a float's depth sensor sits 0.25 meters
  below its top, every depth it reports is 0.25 larger. Give `in_band` a
  second argument, `offset`, that moves the band down by that much. (A
  default value like `offset=0.0` lets old calls keep working.)
- **The readings on the way up.** The manual also wants a reading every
  0.5 meters as the float rises. Write `rungs(log)`: for each of the
  depths 2.0, 1.5, 1.0, 0.5 and 0.0, find the packet closest to it on the
  way up, or `None` if no packet is within 0.20 meters. Only packets
  from the deepest point on count.

## Style and Submission

Run these one at a time, from inside your `float` folder.

Check your style:

{% include copy-command.html command="style50 float.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/float_profile" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/float_profile" %}

check50 tests your four functions one at a time. Those checks work
whether or not you have pasted in the code from The Floats. One last
check runs your whole program to see if the three floats get the right
scores, and that one needs the code from The Floats pasted in. If you
have not pasted it yet, that check fails and tells you so. The extra
credit `decide` is not checked by check50.
