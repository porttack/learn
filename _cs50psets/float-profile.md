---
title: "Profiling Float"
order: 13
chapter: 8
source: original
subtitle: "Write the decision logic for an underwater profiling float: hold a depth for 30 seconds, then catch a reading on every rung of the way up."
---

## Background

Scientists keep track of the ocean with robots that nobody steers. A
profiling float is a tube full of electronics that sinks, rises, and
sinks again on its own, measuring temperature and light as it goes,
and then radios its data home when it breaks the surface. Hundreds of
them are drifting in the real ocean right now.

The 2027 MATE Floats! task asks you to build a small one. It has no
tether and no remote control. The only thing deciding what it does is
the program inside it. For one **vertical profile** the float must:

1. Start on the surface, then sink to **2.0 meters** and stay within
   **plus or minus 0.33 meters** of that depth for **30 seconds in a
   row**. If it drifts out of that band even once, the 30 seconds
   start over.
2. Sink to **4.0 meters**.
3. Rise to the surface, taking a reading every **0.5 meters**: at 4.0,
   3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5 and 0.0 meters, each one within
   **20 centimeters** of its depth. That is nine readings.
4. Transmit its data packets once it is back on top.

A float that sinks like a stone and bobs up again has completed a
profile, but it has not shown that it is in control. The judge looks
at your **data packets** and decides. Your job in this problem is to be
that judge, and then to be the float.

A **buoyancy engine** changes how much the float weighs for its size by
pushing a little fluid out of the tube (so it displaces more water and
rises) or pulling it back in (so it sinks). It cannot move the float
directly. It only changes how hard gravity and water are pulling, so
the float speeds up and slows down gradually. That is why this is hard:
a float that waits until it reaches 2.0 meters to stop pushing will
glide right past 2.0 meters.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir float
cd float
code float.py
```

## Starter Code

Paste this into `float.py`. Run `python3 -m doctest float.py` from
inside your `float` folder to check the examples. Silence means every
example passed. Add at least one example of your own to each function.

A **data packet** is a pair of numbers in parentheses, `(seconds, depth)`
(Python calls this a **tuple**): the time since the float started, in
seconds, and the depth in meters of the **top** of the float. If
`packet = (10, 1.9)`, then `packet[0]` is `10` and `packet[1]` is `1.9`.
A **log** is a list of packets in time order. Packets may be
any number of seconds apart, but never closer than one second.

```python
"""
Profiling Float

Doctests: python3 -m doctest float.py
"""

HOLD_DEPTH = 2.0
HOLD_BAND = 0.33
HOLD_SECONDS = 30
RUNGS = [4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0]
RUNG_BAND = 0.20


def held(log, offset=0.0):
    """
    Returns the time the first successful 30 second hold began, or
    None if the log never shows one. offset is how many meters below
    the top of the float the depth sensor sits.

    >>> held([(0, 0.1), (5, 1.2), (10, 1.9), (15, 2.1), (20, 2.0),
    ...       (25, 2.3), (30, 2.2), (35, 2.0), (40, 1.8), (45, 2.1)])
    10
    >>> held([(0, 1.9), (5, 2.1), (10, 2.5), (15, 2.0), (20, 2.0),
    ...       (25, 1.8), (30, 2.2), (35, 2.0), (40, 2.1), (45, 1.9)])
    15
    """
    pass


def rungs(log):
    """
    Returns a list of nine packets, one for each depth in RUNGS, taken
    from the part of the log after the float reached its deepest
    point. A rung's packet is the one closest to that depth, as long
    as it is within RUNG_BAND. A rung with no such packet is None.

    >>> rungs([(0, 0.0), (5, 2.0), (10, 4.1), (15, 3.55), (20, 3.1),
    ...        (25, 2.45)])
    [(10, 4.1), (15, 3.55), (20, 3.1), (25, 2.45), None, None, None, None, None]
    """
    pass


def step(phase, depth, speed, t, hold_since, got):
    """
    Decides what the float does next. Returns a tuple
    (phase, hold_since, action, sample).
    """
    pass


def main():
    # See Part 3.
    pass


if __name__ == "__main__":
    main()
```

## Specification

### Part 1: Did it hold?

Implement `held(log, offset=0.0)`.

- The float must hold the top of the float at 2.0 meters plus or minus
  0.33 meters, which is 1.67 to 2.33 meters, for 30 seconds. A packet
  exactly on an edge of the band is in the band.
- If the depth sensor is below the top of the float, every depth it
  reports is larger by `offset`. A sensor 0.25 meters below the top
  reads 2.25 when the top is at 2.0, so the band for that sensor is
  1.92 to 2.58. `held` must shift the band by `offset`.
- The hold counts only if the packets in the band form an **unbroken
  run**, and the time from the first packet of the run to the last is
  **at least** 30 seconds. A single packet outside the band ends the
  run, and a new run must begin from the next in-band packet.
- Return the time of the **first packet of the first run** that is long
  enough. If there is none, return `None` (not `0`: a hold that began at
  time 0 is a real answer, and it must not look like "no hold").

### Part 2: Which packets go on the graph?

Implement `rungs(log)`.

- Look only at packets from the moment the float was **deepest**, to
  the end of the log. The float passes 2.0 meters on the way down too,
  and a descending packet is not a reading on the ascent.
- For each depth in `RUNGS`, in that order, find the packet whose depth
  is closest to it. If the closest one is more than 0.20 meters away,
  that rung is `None`. Otherwise the rung is that packet.
- The judge needs all nine. A list with a `None` in it means "this
  profile did not earn the points."

### Part 3: Be the float

A float cannot see the whole log, only the present. Implement
`step(phase, depth, speed, t, hold_since, got)`, the function the
float's computer calls once every second.

The arguments:

- `phase` is one of `"DOWN2"` (sinking to the hold depth), `"HOLD"`,
  `"DOWN4"` (sinking to 4.0 meters), `"UP"` (rising, taking readings)
  or `"DONE"`.
- `depth` is the depth of the top of the float in meters.
- `speed` is how fast the float is sinking, in meters per second. A
  rising float has a negative speed.
- `t` is the time in seconds.
- `hold_since` is the time the float last entered the hold band, or
  `None` if it never has.
- `got` is a **set**, a collection of the rungs from `RUNGS` that
  already have a reading. A set holds each value only once, and
  `4.0 in got` is `True` if 4.0 is in it.

It returns a tuple of four things:

1. The **new phase.** `"DOWN2"` becomes `"HOLD"` as soon as the float
   is inside the band. `"HOLD"` becomes `"DOWN4"` after 30 seconds in
   the band, but leaving the band at any moment restarts the 30
   seconds. `"DOWN4"` becomes `"UP"` once `depth` reaches 4.0. In
   `"UP"` the phase stays `"UP"`; the program that is running the float
   changes it to `"DONE"` at the surface.
2. The new `hold_since`.
3. The **action** for the buoyancy engine: `"SINK"`, `"RISE"` or
   `"IDLE"`. `SINK` and `RISE` each change the speed a little; they do
   not set it. When the float is already moving the right way at about
   the right speed, `IDLE` lets it coast.
4. A **sample**: when in the `"UP"` phase, and `depth` is within 0.20 of
   a rung that is not yet in `got`, return that rung. Otherwise return
   `False`.

### Putting it together

Below is a simulator you can paste under your functions. It is a rough
model of a float in water: each `SINK` or `RISE` nudges the speed, and
the water slows the float down a little every second. It prints what
your float did, using your own `held` and `rungs` to judge it.

```python
def simulate():
    depth, speed, t = 0.0, 0.0, 0
    phase, hold_since, got = "DOWN2", None, set()
    log = []
    while phase != "DONE" and t < 600:
        phase, hold_since, action, sample = step(
            phase, depth, speed, t, hold_since, got
        )
        # look up the push for this action: SINK adds speed downward,
        # RISE adds speed upward (negative), IDLE adds none
        push = {"SINK": 0.04, "RISE": -0.04, "IDLE": 0.0}[action]
        speed = (speed + push) * 0.9    # the water slows the float 10% a second
        depth = max(0.0, depth + speed)
        t += 1
        log.append((t, round(depth, 2)))
        if sample is not False:
            got.add(sample)
        if phase == "UP" and depth <= 0.05:
            phase = "DONE"
    return log


def main():
    log = simulate()
    start = held(log)
    print("Hold began at:", start)
    print("Deepest:", max(d for t, d in log), "m")
    # zip walks along two lists at the same time: a rung and its packet
    for rung, packet in zip(RUNGS, rungs(log)):
        print(rung, packet)
```

When `main` prints a hold time and **nine packets, no `None`**, your
float would have earned its points. Your float must also never go
deeper than **5.0 meters**, because the bottom of the competition pool
is at 5.18.

<aside class="callout note" markdown="1">
**NOTE**

The simulator belongs to *this problem*, not to the competition. A real
float has a pressure sensor that is noisy, a motor that takes time to
start, and a tube that is a different size than the one you modeled.
The moves you work out here (look at where you are, look at how fast
you are going, and decide) carry over. The numbers will not, and you
will need to tune them in a real pool.
</aside>

## Hints

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- For `held`, you only need to remember one thing as you go through
  the log: when the current run started. Make it `None` when no run is
  going, set it on the first in-band packet, and clear it on any
  packet that is out of band.
- Compare against `start` using the packet's *own* time, not by
  counting packets. A log can have packets one second apart or ten.
- For `rungs`, first find where the deepest packet is. Loop over the
  log with `for i in range(len(log)):`, and keep track of the index `i`
  with the biggest `log[i][1]` (that is the depth). Then `log[i:]` is
  everything from that packet to the end.
- For `rungs`, `abs(depth - rung)` is the distance between the two
  numbers (it is the absolute value from Algebra 1: it never comes out
  negative). Loop over the packets and keep the one with the smallest
  distance so far.
- For `step`, a float that waits until it reaches its target to stop
  pushing will overshoot. Instead, decide how fast you *want* to be
  going: faster when you are far from the target, slower when you
  are near. A straight line works well: `want = 0.5 * (target - depth)`
  is the `y = mx` from Algebra 1, with the distance to the target as
  `x`. Use `min` and `max` to keep `want` from getting bigger than
  0.15 or smaller than -0.15. Then compare it with `speed`. If you are slower than you
  want, `SINK`; faster, `RISE`; close enough, `IDLE`.
- Aim a little deeper than 4.0 when you sink, and a little shallower
  than 0.0 when you rise. A float that is aiming for exactly the
  target slows down as it arrives and may never get there.
- Print `step`'s arguments in the simulator loop to see what your float
  is thinking. `print(t, phase, round(depth, 2), round(speed, 3), action)`.

</details>

## To Get Full Credit

Submit early, then keep improving.

- `held` and `rungs` pass the examples in the starter code and your own
  extra examples, including a hold that begins at time 0, a log with no
  hold at all, and a sensor with a nonzero `offset`.
- `step` plus `simulate` earn a hold, nine rungs, and a maximum depth
  under 5.0 meters.
- Explain, in a comment above `step`, why you pick the desired speed
  the way you do, in two or three sentences.

## Going Further

- **Bigger overshoot.** Raise the push in the simulator from `0.04`
  to `0.08`. Does your float still hold? What number in `step` did you
  have to change, and why?
- **A noisy sensor.** Make the simulator add a random error of up to
  0.05 meters to the depth that `step` sees (but not to the real depth
  that goes in the log). Does your float still hold? If not, can you
  average the last few depths?
- **A shallow pool.** Some venues are only 3 meters deep, so the hold is
  at 1.0 meters and the deep point is at 2.0. Turn the constants at the
  top into arguments so that one program handles both pools.
- **Two profiles.** The competition runs two. Write a loop that restarts
  at `"DOWN2"` once the float is back on top, and counts the profile
  that scored.
- **Graph it.** Use a library such as `matplotlib` to graph depth
  (vertical axis, flipped so the surface is on top) against time. Then
  graph depth against temperature using made-up temperature data.
