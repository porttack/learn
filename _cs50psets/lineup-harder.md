---
title: "Lineup (harder)"
order: 9
chapter: 9
source: original
---

<figure id="fig-lineup-harder-history" class="pset-hero-compact">
  <svg viewBox="0 0 300 210" role="img" aria-labelledby="lineup-harder-history-title">
    <title id="lineup-harder-history-title">A stack of three song cards. The top card is highlighted and labeled Most Recent. Two plainer cards sit beneath it, each a little more faded than the one above, further back in the stack. An arrow labeled Back runs up the side, from the bottom card to the top one.</title>
    <text x="150" y="24" text-anchor="middle" font-size="12" fill="#828282" letter-spacing="1">HISTORY</text>

    <rect x="70" y="34" width="160" height="46" rx="8" fill="#111"/>
    <text x="150" y="62" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">MOST RECENT</text>

    <rect x="70" y="90" width="160" height="46" rx="8" fill="#f2f2f2" stroke="#ccc" opacity="0.85"/>
    <line x1="90" y1="105" x2="90" y2="120" stroke="#aaa" stroke-width="3"/>
    <line x1="105" y1="110" x2="105" y2="120" stroke="#aaa" stroke-width="3"/>
    <line x1="120" y1="100" x2="120" y2="120" stroke="#aaa" stroke-width="3"/>

    <rect x="70" y="146" width="160" height="46" rx="8" fill="#f2f2f2" stroke="#ccc" opacity="0.6"/>
    <line x1="90" y1="161" x2="90" y2="176" stroke="#aaa" stroke-width="3"/>
    <line x1="105" y1="166" x2="105" y2="176" stroke="#aaa" stroke-width="3"/>
    <line x1="120" y1="156" x2="120" y2="176" stroke="#aaa" stroke-width="3"/>

    <defs>
      <marker id="lineup-harder-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#111"/>
      </marker>
    </defs>
    <line x1="255" y1="165" x2="255" y2="50" stroke="#111" stroke-width="2" marker-end="url(#lineup-harder-arrow)"/>
    <text x="255" y="110" text-anchor="middle" font-size="11" fill="#828282" transform="rotate(-90 255 110)">BACK</text>
  </svg>
  <figcaption>BACK walks up the stack: most recently played first.</figcaption>
</figure>

## Background

This is the harder version of [Lineup](/cs50-psets/lineup/): same DJ
booth, same song request line. If you haven't done Lineup yet, start
there; this problem assumes you already have working `ADD` and `PLAY`
commands, just rebuilt here with a different tool.

Two things are new. First, the lineup itself moves from a plain list
to `deque`, the queue class built into Python's `collections` module.
Second, you're adding a running history of everything that's already
played, so you can answer the question that always comes up at a
dance: "wait, what was that song two songs ago?" History works
backwards from the lineup: the answer you want first is the most
recent song, then the one before that, and so on. Something that comes
out most-recently-added-first instead of first-in-first-out is called
a stack, and its two operations are push (add to the top) and pop
(remove from the top).

<div class="pset-demo">
  <label for="lineup-harder-song">Song request:</label>
  <input type="text" id="lineup-harder-song" placeholder="e.g. Anti-Hero" autocomplete="off">
  <button type="button" id="lineup-harder-add-btn">Add to lineup</button>
  <button type="button" id="lineup-harder-play-btn">Play next</button>
  <button type="button" id="lineup-harder-back-btn">Back</button>
  <pre id="lineup-harder-state"></pre>
</div>

<script>
(function () {
  var songInput = document.getElementById('lineup-harder-song');
  var addBtn = document.getElementById('lineup-harder-add-btn');
  var playBtn = document.getElementById('lineup-harder-play-btn');
  var backBtn = document.getElementById('lineup-harder-back-btn');
  var state = document.getElementById('lineup-harder-state');
  if (!songInput || !addBtn || !playBtn || !backBtn || !state) return;

  var CAPACITY = 5;
  var lineup = [];
  var history = [];
  var nowPlaying = null;
  var lastPlayed = null;

  function render() {
    var playing = nowPlaying || '(nothing yet)';
    var upNext = lineup.length ? lineup.join(', ') : '(empty)';
    var back = lastPlayed || '(nothing yet)';
    state.textContent = 'Now Playing: ' + playing + '\nUp Next: ' + upNext + '\nLast Played (Back): ' + back;
  }

  addBtn.addEventListener('click', function () {
    var song = songInput.value.trim();
    if (!song) return;
    if (lineup.length < CAPACITY) {
      lineup.push(song);
      songInput.value = '';
    }
    render();
  });

  playBtn.addEventListener('click', function () {
    nowPlaying = lineup.length ? lineup.shift() : null;
    if (nowPlaying) history.push(nowPlaying);
    render();
  });

  backBtn.addEventListener('click', function () {
    lastPlayed = history.length ? history.pop() : null;
    render();
  });

  render();
})();
</script>

This shows the idea: the lineup itself behaves exactly like it did in
Lineup, and Back walks backwards through what already played, most
recent first. It doesn't match your program's exact commands or
wording; see the specification below for those.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir lineup_harder
cd lineup_harder
code lineup_harder.py
```

That creates a new folder called `lineup_harder`, moves into it, and opens a
new, empty file called `lineup_harder.py` for you to edit.

## Starter Code

Paste this into `lineup_harder.py` to start from. `enqueue` and `dequeue` are
already filled in for you this time, the same logic as Lineup, just
working on a `deque` instead of a list. `push` and `pop` are the new
parts, stubbed out with `pass` and doctest examples; run
`python3 -m doctest lineup_harder.py` from inside your `lineup_harder` folder to
check them.

`main` is left as a comment on purpose, same as always: the command
loop is the actual point of this problem, and a docstring can't check
a loop the way it can check a pure function. Yes, that means rewriting
the `ADD`/`PLAY` handling you already built in Lineup; this time it
also has to handle `BACK`.

```python
# Student Initials:
"""
Lineup (harder)

Slug: porttack/cs50/problems/py/lineup_harder
Doctests: python3 -m doctest lineup_harder.py
"""

from collections import deque


CAPACITY = 5


def main():
    # Loop, prompting "Command: " each time, until the input is
    # "DONE". Same ADD and PLAY behavior as Lineup, plus BACK. On a
    # successful PLAY, also call push to add that song to history.
    # See the specification below for exactly what to print for each
    # case.
    pass


def enqueue(lineup, song):
    """
    Adds song to the back of lineup if there's room (fewer than
    CAPACITY songs already waiting). Returns True if song was added,
    False if lineup was already full and song was not added.

    >>> lineup = deque()
    >>> enqueue(lineup, "Sunroof")
    True
    >>> list(lineup)
    ['Sunroof']
    """
    if len(lineup) >= CAPACITY:
        return False
    lineup.append(song)
    return True


def dequeue(lineup):
    """
    Removes and returns the song at the front of lineup. Returns
    None, and leaves lineup unchanged, if lineup is empty.

    >>> lineup = deque(["Sunroof", "Flowers"])
    >>> dequeue(lineup)
    'Sunroof'
    >>> list(lineup)
    ['Flowers']
    """
    if not lineup:
        return None
    return lineup.popleft()


def push(history, song):
    """
    Adds song to the top of history, a plain list.

    >>> history = ["Anti-Hero"]
    >>> push(history, "Flowers")
    >>> history
    ['Anti-Hero', 'Flowers']
    """
    pass


def pop(history):
    """
    Removes and returns the song on top of history (the one played
    most recently). Returns None, and leaves history unchanged, if
    history is empty.

    >>> history = ["Anti-Hero", "Flowers"]
    >>> pop(history)
    'Flowers'
    >>> history
    ['Anti-Hero']
    >>> pop([])
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, `lineup_harder.py`, that runs the song request line for
the dance, same as Lineup, plus a history of what already played.

- Keep the lineup itself in a `deque`, starting empty. `CAPACITY` is
  already defined as `5`. `enqueue` and `dequeue` are already
  implemented for you above.
- Keep a second collection, `history`, a plain list, also starting
  empty, for songs that have already played.
- Loop, prompting exactly `"Command: "` each time.
- If the input is exactly `DONE`, stop looping. Print nothing else.
- If the input starts with `ADD ` followed by at least one more
  character, everything after that first space is the song title,
  spaces and all.
  - If the lineup has fewer than 5 songs waiting, call `enqueue` and
    print `Added: <song>`.
  - If the lineup is already full, print `Lineup is full` and don't
    add the song.
- If the input is exactly `PLAY`:
  - If the lineup isn't empty, call `dequeue`, print
    `Now playing: <song>`, and call `push` to add that same song to
    `history`.
  - If the lineup is empty, print `Nothing to play`.
- If the input is exactly `BACK`:
  - If `history` isn't empty, call `pop` and print
    `Last played: <song>`.
  - If `history` is empty, print `Nothing has played yet`.
  - `BACK` only reports what already played; it never changes the
    lineup, and a song popped off `history` doesn't go back on it.
- Anything else, a blank line, `ADD` with nothing after it, a
  misspelled command, lowercase input, prints `Huh?` and prompts
  again. Don't crash on unexpected input.
- `push` and `pop` should never print anything or read input
  themselves. All the printing happens in `main`, based on what they
  return.

<aside class="callout note" markdown="1">
**NOTE**

Why `deque` and not a plain list, the way Lineup did it? A list can do
this too: `lineup.append(song)` adds to the back just fine, and
`lineup.pop(0)` removes from the front. The catch is `pop(0)`, and
`insert(0, song)` if you ever needed to add to the front, both have to
shift every remaining item over by one to close the gap. For a
five-song dance lineup that's nothing. For a real queue that might
hold thousands of waiting items, like a print queue or a customer
service line, that shifting gets slower and slower as the queue grows.

`deque` (short for "double-ended queue") is built specifically so
adding or removing from either end, `.append()`, `.appendleft()`,
`.pop()`, `.popleft()`, is fast no matter how long it gets. That's why
it lives in Python's standard library instead of everyone hand-rolling
their own: it's the right tool whenever something behaves like a
queue.
</aside>

<aside class="callout note" markdown="1">
**NOTE**

`history`, on the other hand, is a plain list, not a `deque`. A stack
only ever adds and removes from one end, the top, and a plain list is
already fast there: `history.append(song)` and `history.pop()` (with
no index) both work on the end of the list directly, no shifting
required. `deque` earns its keep when something needs to be fast at
*both* ends, front and back, which is exactly the difference between a
queue and a stack.
</aside>

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="lineup-harder-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python lineup_harder.py
Command: ADD Anti-Hero
Added: Anti-Hero
Command: ADD Flowers
Added: Flowers
Command: PLAY
Now playing: Anti-Hero
Command: PLAY
Now playing: Flowers
Command: BACK
Last played: Flowers
Command: BACK
Last played: Anti-Hero
Command: BACK
Nothing has played yet
Command: PLAY
Nothing to play
Command: DONE

$ python lineup_harder.py
Command: ADD A
Added: A
Command: ADD B
Added: B
Command: ADD C
Added: C
Command: ADD D
Added: D
Command: ADD E
Added: E
Command: ADD F
Lineup is full
Command: DONE
</pre>

<script>
(function () {
  var el = document.getElementById('lineup-harder-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python lineup_harder.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'ADD Anti-Hero\n', type: true, speed: 70 },
    { text: 'Added: Anti-Hero\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'ADD Flowers\n', type: true, speed: 70 },
    { text: 'Added: Flowers\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'PLAY\n', type: true, speed: 90 },
    { text: 'Now playing: Anti-Hero\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'PLAY\n', type: true, speed: 90 },
    { text: 'Now playing: Flowers\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'BACK\n', type: true, speed: 90 },
    { text: 'Last played: Flowers\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'BACK\n', type: true, speed: 90 },
    { text: 'Last played: Anti-Hero\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'BACK\n', type: true, speed: 90 },
    { text: 'Nothing has played yet\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'PLAY\n', type: true, speed: 90 },
    { text: 'Nothing to play\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python lineup_harder.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'ADD E\n', type: true, speed: 90 },
    { text: 'Added: E\n', type: false },
    { text: 'Command: ', type: false },
    { text: 'ADD F\n', type: true, speed: 90 },
    { text: 'Lineup is full\n', type: false }
  ];

  var pauseBetweenLoops = 3600;
  var pauseBetweenLines = 500;

  function typeText(text, speed, cb) {
    var i = 0;
    (function step() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      } else {
        cb();
      }
    })();
  }

  function playStep(index) {
    if (index >= script.length) {
      setTimeout(function () {
        el.textContent = '';
        playStep(0);
      }, pauseBetweenLoops);
      return;
    }
    var item = script[index];
    if (item.type) {
      typeText(item.text, item.speed, function () { playStep(index + 1); });
    } else {
      el.textContent += item.text;
      setTimeout(function () { playStep(index + 1); }, pauseBetweenLines);
    }
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    var full = '';
    for (var i = 0; i < script.length; i++) full += script[i].text;
    el.textContent = full;
  } else {
    playStep(0);
  }
})();
</script>

## Hints

The Python docs for `collections.deque` are a solid reference if the
note above left you curious:
[`collections.deque`](https://docs.python.org/3/library/collections.html#collections.deque).
The hints below are specific to this problem.

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- `main` needs the same command-parsing shape as Lineup:
  `"ADD Anti Hero".split(" ", 1)` gives you
  `['ADD', 'Anti Hero']`, and `command.startswith("ADD ")` (note the
  trailing space) is the cleanest way to check before splitting.
- An empty list is falsy, same as an empty `deque`: `if history:` is
  `True` only when there's something in it. That's the cleanest way
  to check before calling `pop`.
- Don't reach for `deque` inside `push`/`pop`. `history` only ever
  grows and shrinks from one end, so a plain list's `.append()` and
  `.pop()` (called with no argument, which removes from the end) are
  exactly what you want. See the note above the Usage section for why.
- `push` and `pop` don't need `try`/`except`. They're not parsing user
  input, just managing `history` and reporting back what happened, so
  a plain `if` covering the empty case is all `pop` needs, and `push`
  needs no check at all.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Fill in `push` and `pop` with real code, and add one more `>>>`
  example of your own to each docstring covering a case not already
  shown. Both are pure enough to doctest cleanly, same as `enqueue`
  and `dequeue` above them. Don't try to doctest `main`; a loop that
  reads input doesn't fit the format.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Style and Submission

Run these one at a time, from inside your `lineup_harder` folder.

Check your style:

{% include copy-command.html command="style50 lineup_harder.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/lineup_harder" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/lineup_harder" %}

<hr>

## Glossary

- **queue** — A data structure where items come out in the same order
  they went in: first in, first out (FIFO). A line of people works the
  same way.
- **enqueue** — Adding an item to the back of a queue.
- **dequeue** — Removing and returning the item at the front of a
  queue.
- **FIFO** — "First in, first out." The rule that makes a queue a
  queue: whatever's been waiting longest comes out first.
- **deque** — Short for "double-ended queue," and the name of the
  class in Python's `collections` module built to add or remove items
  from either end quickly, no matter how long it gets.
- **stack** — A data structure where the most recently added item
  comes out first: last in, first out (LIFO). A stack of trays in a
  cafeteria works the same way; you take from the top, not the
  bottom.
- **push** — Adding an item to the top of a stack.
- **pop** — Removing and returning the item on top of a stack.
- **LIFO** — "Last in, first out." The rule that makes a stack a
  stack, the opposite of a queue's FIFO.
