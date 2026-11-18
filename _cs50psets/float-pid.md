---
title: "Profiling Float: PID"
order: 14
chapter: 8
source: original
subtitle: "Build a PID controller, tune it to hold a float at 2.0 meters even when the float is a little too heavy and the sensor is noisy, and fix the bug that makes an integral term dangerous."
---

## Background

In [Profiling Float](/cs50-psets/float-profile/) you wrote a float that
decided how fast it wanted to go and nudged itself toward that speed.
That works in a perfect pool. This problem is the same float in a
pool that is not perfect, and the 2027 MATE Floats! task asks for
the same job: hold the top of the float at **2.0 meters, plus or minus
0.33 meters, for 30 seconds in a row**.

Three things go wrong in a real float:

- **It is never perfectly balanced.** The float you weighed at your
  bench sits a little differently in water that is warmer, saltier, or
  has a bubble stuck in the tube. A small, constant push, up or down,
  that you did not ask for. We will call it the **bias**.
- **The sensor is noisy.** A depth reading jitters a little, even in
  still water.
- **The motor is slow.** When your program says "push", the buoyancy
  engine takes a few seconds to get there.

A **PID controller** is the standard answer to this kind of problem,
and you will find one inside drones, cruise control, thermostats, and
the real floats in the ocean. At every tick it looks at one number, the
**error**, which is how far you are from where you want to be (here:
`2.0 - depth`, so a positive error means "too shallow, sink"). It
makes its decision from three things about that error:

| Term | It looks at | In float terms |
|---|---|---|
| **P**roportional | the error right now | "I am 0.5 m too shallow, so push this hard." |
| **I**ntegral | the error added up over time (a running total) | "I have been 10 cm too shallow for 20 seconds. Something is pushing me, so push harder." |
| **D**erivative | how fast the error is changing (a slope) | "I am rushing at the target. Ease off before I overshoot." |

"Integral" and "derivative" are words from calculus, which you may
meet in a few years. You do not need calculus here. The **integral
term** is only a running total: each second, add the current error to a
total. The **derivative term** is only a slope, the same slope you
found in Algebra 1 as "rise over run": how much the error changed
since the last tick (the rise), divided by the seconds that passed
(the run).

The output is a number from -1 (push up as hard as you can) to 1 (sink
as hard as you can). The formula is just:

```
output = kp * error + ki * (running total of errors) + kd * (slope of the error)
```

Each gain is a plain number you multiply by. A bigger `kp` means the
P part pushes harder for the same error. It is the same idea as the
`m` in `y = mx`.

`kp`, `ki` and `kd` are the **gains**. Choosing them is called
**tuning**, and it is part science and part patience.

This video explains PID controllers well. It is worth watching before
you start, and again if the tuning in Part 2 gets confusing.

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/tFVAaUcOm4I" title="Video explaining PID controllers" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir floatpid
cd floatpid
code floatpid.py
```

## Starter Code

Paste this into `floatpid.py`. Run `python3 -m doctest floatpid.py`
from inside your `floatpid` folder to check the examples. Add one of
your own to `update`.

A `class` is a way to bundle numbers and functions together. Here, one
`PID` object remembers its own gains, its running total, and the last
error. `self` means "this object", so `self.total` is this controller's
running total. You will not need to write a class from scratch, only
fill in the one function that is empty.

The examples use `round(..., 3)` on some answers. Computers store
decimals a tiny bit off (for example `0.12000000000000001`), and
rounding to 3 places hides that so the answer can be compared.

```python
"""
Profiling Float: PID

Doctests: python3 -m doctest floatpid.py
"""

import random


class PID:
    def __init__(self, kp, ki=0.0, kd=0.0, limit=1.0):
        """
        >>> p = PID(2)
        >>> p.kp, p.ki, p.kd, p.limit, p.total
        (2, 0.0, 0.0, 1.0, 0.0)
        """
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.limit = limit
        self.total = 0.0    # the sum of errors so far
        self.last = None    # the previous error, None before the first

    def update(self, error, dt=1.0):
        """
        Takes the current error and the seconds since the last call.
        Returns the output, never beyond -limit or +limit.

        >>> PID(2).update(0.25)
        0.5
        >>> p = PID(0.1, ki=0.5)
        >>> round(p.update(0.2), 3)
        0.12
        >>> round(p.update(0.2), 3)
        0.22
        >>> p = PID(0, kd=2)
        >>> p.update(0.5)
        0.0
        >>> p.update(0.25)
        -0.5
        >>> PID(10).update(1.0)
        1.0
        >>> PID(10).update(-1.0)
        -1.0
        """
        pass
```

## Specification

### Part 1: The controller

Fill in `update`. Each call, in order:

1. The **derivative** is `(error - last_error) / dt`. On the very first
   call there is no last error, so the derivative is `0.0`. Remember
   this call's error as the last one.
2. Add `error * dt` to `total`, **before** you use it.
3. The output is `kp * error + ki * total + kd * derivative`.
4. If the output is more than `limit`, return `limit`. If it is less
   than `-limit`, return `-limit`. Otherwise return it as it is.

### Part 2: Tune it

Paste this simulator **under** your class. It is the float, in a pool
that is not perfect. You do not need to change it, but do read it, as
the three problems from above are each a line of it.

```python
def simulate(gains, bias=0.0, noise=0.03, seconds=120, seed=1):
    """
    Runs one float for `seconds` seconds, one tick per second.
    Returns a list of (second, depth) packets.
    """
    kp, ki, kd = gains                 # split the three numbers apart
    pid = PID(kp, ki, kd)
    rnd = random.Random(seed)          # makes the same "random" wobble each run
    depth, speed, engine = 0.0, 0.0, 0.0
    log = []
    for t in range(1, seconds + 1):
        seen = depth + rnd.gauss(0, noise)       # a noisy sensor: the true
                                                 # depth plus a small random wobble
        u = pid.update(2.0 - seen)               # ask the controller
        engine += 0.25 * (u - engine)            # a slow motor
        speed = (speed + 0.04 * engine + bias) * 0.9    # a bias
        depth = max(0.0, depth + speed)
        log.append((t, round(depth, 2)))
    return log


def longest_hold(log):
    """Longest run, in packets, inside 2.0 meters plus or minus 0.33."""
    run = best = 0
    for t, depth in log:
        run = run + 1 if abs(depth - 2.0) <= 0.33 else 0
        best = max(best, run)
    return best


def check(gains):
    """
    Tries the float with no bias, a bias that sinks it, and a bias that
    floats it, and with three different patterns of sensor noise each.
    Returns (shortest hold, deepest depth) over all nine runs.
    """
    holds, deepest = [], 0.0
    for bias in (0.0, 0.02, -0.02):
        for seed in (1, 2, 3):
            log = simulate(gains, bias=bias, seed=seed)
            holds.append(longest_hold(log))
            deepest = max(deepest, max(depth for t, depth in log))
    return min(holds), deepest
```

Add a `main` that prints `check(...)` for gains of your choice, as
`(kp, ki, kd)`:

```python
def main():
    print(check((1, 0, 0)))
```

A float passes when the **shortest hold is at least 30 seconds** (it
held in every one of the nine pools) and the **deepest depth is less
than 5.0** (the bottom of the pool is at 5.18).

Your job:

1. Run it with `(1, 0, 0)`, the P controller alone. Try making `kp`
   bigger: 2, 5, 10. Write down what happens in a comment, and why you
   think it does. (The float is never perfectly balanced, and the motor
   is slow.)
2. Add a D term: `(1, 0, 2)`. Does it fix the zero-bias pool? Does it
   fix the others?
3. Add an I term, and find gains that pass `check`. There is more than
   one answer. Put yours in a function:

```python
def gains():
    return (kp, ki, kd)     # your numbers
```

   Print `check(gains())` in `main`.

### Part 3: The windup bug

Your float spends its first 10 seconds or so far from 2.0 meters. The
error is big, so the output is stuck at its maximum, `limit`, and the
engine is already pushing as hard as it can. Asking for more does
nothing. But your `total` keeps **adding up** that big error for the
whole time, as if it counted. By the time the float
arrives, `total` is a huge number, `ki * total` is a huge push, and the
float is thrown straight through the hold depth. This is called
**integral windup**, and it is a famous way for real controllers to
fail.

Fix it in `update`. After computing the output in step 3, if it had to
be clamped **and** `error` and the output are both positive or both negative (the
error is still pushing the output further past its limit), **undo** this call's addition
to `total`: subtract `error * dt` again.

Add these to the doctests of `update`. When the output is clamped, the
total must not grow:

```python
        >>> p = PID(10, ki=1)
        >>> p.update(1.0)
        1.0
        >>> p.total
        0.0
        >>> p.update(1.0)
        1.0
        >>> p.total
        0.0
        >>> p = PID(0.1, ki=1)
        >>> round(p.update(0.5), 3)
        0.55
        >>> p.total
        0.5
```

The first pair of calls is clamped, so the total stays at 0.0. The second
controller is not clamped, so its total grows as before.

Then try these gains, which your class should now hold with:

```python
print(check((1, 0.06, 3)))
```

With the windup fix in place, the shortest hold is well over 30 seconds.
Comment out your fix and run it again. Write down the shortest hold you
get without it, and why.

## Hints

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- The doctest `p.update(0.2)` giving `0.12` is `0.1 * 0.2 + 0.5 * 0.2`:
  a P part of 0.02 plus an I part of 0.1. If you get 0.02, you are
  forgetting that `total` has to include this call's error already.
- The first call to the derivative has nothing to subtract. Check for
  `self.last is None` before subtracting.
- To clamp: `max(-self.limit, min(self.limit, output))`.
- `(out > 0) == (error > 0)` is a short way to say "both positive or
  both negative". To ask "did the clamp change the output?", compare
  the clamped number with the original: `clamped != out`.
- In Part 2, tune **one gain at a time**, with the other two at 0.
  Start with `kp`. Add `kd` until the float stops overshooting. Add
  `ki` last and in small steps (0.01 or 0.02). A big `ki` is a float
  that swings back and forth for a minute.
- If the float oscillates (swings back and forth past 2.0 again and
  again), the usual suspects are `kp` too high or `ki`
  too high. If it settles but a little off from 2.0, `ki` is too low.
- To see what the float is doing, print a few packets:
  `print(simulate(gains(), bias=0.02)[::10])`.

</details>

## To Get Full Credit

Submit early, then keep improving.

- The doctests all pass, including the three you add and the ones for
  the windup fix.
- `check(gains())` gives a shortest hold of at least 30 and a deepest
  depth under 5.0.
- You wrote down what `(1, 0, 0)` and `(1, 0, 2)` do and why, and what
  happened without the windup fix.

## Going Further

- **Which is more dangerous?** Change the motor's lag from `0.25` to
  `0.1`. Which gain has to change first?
- **Noise and D.** Raise `noise` from `0.03` to `0.1`. Which term gets
  noisy first? The D term divides a change by a small number of
  seconds, so why does that make a small wobble look big? What could you do to
  the depth readings before you hand them to the controller?
- **Tune by robot.** Write a loop that tries many `(kp, ki, kd)` and
  keeps the combination with the longest shortest hold. Is the best
  answer one you would trust in a real pool?
- **Mix it into the profile.** Use a PID as the thing that decides the
  action in `step` from Profiling Float, with the target changing as the
  float goes from 2.0 to 4.0 to the surface.
