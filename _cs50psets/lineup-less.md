---
title: "Lineup (less comfortable)"
order: 8
chapter: 8
source: original
subtitle: "Implement enqueue and dequeue on a plain list for a bounded song request line."
---

<figure id="fig-lineup-queue" class="pset-hero">
  <svg viewBox="0 0 440 170" role="img" aria-labelledby="lineup-queue-title">
    <title id="lineup-queue-title">A row of song cards. The leftmost card is highlighted and labeled Now Playing, with an arrow leading further left toward a musical note. Three plainer cards behind it are labeled Up Next, numbered 1 through 3. A dashed circle to the right, marked with a plus sign, is about to join the back of the line.</title>
    <text x="30" y="98" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#111">&#9834;</text>
    <line x1="52" y1="85" x2="102" y2="85" stroke="#111" stroke-width="2" marker-end="url(#lineup-arrow)"/>
    <defs>
      <marker id="lineup-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#111"/>
      </marker>
    </defs>

    <rect x="110" y="40" width="72" height="90" rx="8" fill="#111"/>
    <text x="146" y="80" text-anchor="middle" font-size="20" fill="#fff">&#9654;</text>
    <text x="146" y="147" text-anchor="middle" font-size="12" font-weight="600" fill="#111" letter-spacing="0.5">NOW PLAYING</text>

    <text x="292" y="25" text-anchor="middle" font-size="12" fill="#828282" letter-spacing="1">UP NEXT</text>

    <g>
      <rect x="200" y="48" width="62" height="74" rx="6" fill="#f2f2f2" stroke="#ccc"/>
      <text x="210" y="63" font-size="11" fill="#828282">1</text>
      <line x1="216" y1="95" x2="216" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="231" y1="85" x2="231" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="246" y1="90" x2="246" y2="105" stroke="#aaa" stroke-width="3"/>
    </g>
    <g>
      <rect x="272" y="48" width="62" height="74" rx="6" fill="#f2f2f2" stroke="#ccc"/>
      <text x="282" y="63" font-size="11" fill="#828282">2</text>
      <line x1="288" y1="95" x2="288" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="303" y1="80" x2="303" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="318" y1="90" x2="318" y2="105" stroke="#aaa" stroke-width="3"/>
    </g>
    <g>
      <rect x="344" y="48" width="62" height="74" rx="6" fill="#f2f2f2" stroke="#ccc"/>
      <text x="354" y="63" font-size="11" fill="#828282">3</text>
      <line x1="360" y1="90" x2="360" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="375" y1="95" x2="375" y2="105" stroke="#aaa" stroke-width="3"/>
      <line x1="390" y1="82" x2="390" y2="105" stroke="#aaa" stroke-width="3"/>
    </g>

    <circle cx="425" cy="85" r="13" fill="none" stroke="#828282" stroke-width="1.5" stroke-dasharray="3,3"/>
    <text x="425" y="90" text-anchor="middle" font-size="15" fill="#828282">+</text>
  </svg>
  <figcaption>First come, first served: whichever request has been waiting longest plays next, and new requests join at the back.</figcaption>
</figure>

## Background

A queue shows up everywhere once you notice the shape: the checkout
line at a store, a printer working through a stack of print jobs, a
line of people waiting for a bathroom pass. Whoever got there first
gets served first. Nobody cuts, and nobody new joins anywhere but the
back. That rule has a name: first in, first out, or FIFO.

This problem asks you to build a FIFO line for a much more fun
occasion: you're running the music table at the school dance, and
classmates keep texting you song requests. You can't play them all at
once, so you add each request to the back of the lineup as it comes
in, and whenever one song ends, you pull the next one off the front.
The two operations that make a queue a queue, adding to the back and
removing from the front, have their own names too: enqueue and
dequeue. That's what you'll implement.

<div class="pset-demo">
  <label for="lineup-song">Song request:</label>
  <input type="text" id="lineup-song" placeholder="e.g. Anti-Hero" autocomplete="off">
  <button type="button" id="lineup-add-btn">Add to lineup</button>
  <button type="button" id="lineup-play-btn">Play next</button>
  <pre id="lineup-state"></pre>
</div>

<script>
(function () {
  var songInput = document.getElementById('lineup-song');
  var addBtn = document.getElementById('lineup-add-btn');
  var playBtn = document.getElementById('lineup-play-btn');
  var state = document.getElementById('lineup-state');
  if (!songInput || !addBtn || !playBtn || !state) return;

  var CAPACITY = 5;
  var lineup = [];
  var nowPlaying = null;

  function render() {
    var playing = nowPlaying || '(nothing yet)';
    var upNext = lineup.length ? lineup.join(', ') : '(empty)';
    state.textContent = 'Now Playing: ' + playing + '\nUp Next: ' + upNext;
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
    render();
  });

  render();
})();
</script>

This shows the idea: whichever request has waited longest plays next,
and the lineup never holds more than 5 songs at once. It doesn't match
your program's exact commands or wording; see the specification below
for those.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir lineup_less
cd lineup_less
code lineup_less.py
```

That creates a new folder called `lineup_less`, moves into it, and opens a
new, empty file called `lineup_less.py` for you to edit.

## Starter Code

Paste this into `lineup_less.py` to start from. `enqueue` and `dequeue` are
stubbed out with `pass` and doctest examples; run
`python3 -m doctest lineup_less.py` from inside your `lineup_less` folder to
check them. They'll fail until you replace `pass` with real code.

`main` is left as a comment on purpose, same as it was in Battery
Gauge: the command loop is the actual point of this problem, and a
docstring can't check a loop the way it can check a pure function.

```python
# Student Initials:
"""
Lineup (less comfortable)

Slug: porttack/cs50/problems/py/lineup_less
Doctests: python3 -m doctest lineup_less.py
"""

CAPACITY = 5


def main():
    # Loop, prompting "Command: " each time, until the input is
    # "DONE". See the specification below for exactly what ADD and
    # PLAY need to do, and what to print for each case.
    pass


def enqueue(lineup, song):
    """
    Adds song to the back of lineup if there's room (fewer than
    CAPACITY songs already waiting). Returns True if song was added,
    False if lineup was already full and song was not added.

    >>> lineup = []
    >>> enqueue(lineup, "Sunroof")
    True
    >>> lineup
    ['Sunroof']
    """
    pass


def dequeue(lineup):
    """
    Removes and returns the song at the front of lineup. Returns
    None, and leaves lineup unchanged, if lineup is empty.

    >>> lineup = ["Sunroof", "Flowers"]
    >>> dequeue(lineup)
    'Sunroof'
    >>> lineup
    ['Flowers']
    >>> dequeue([])
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, `lineup_less.py`, that runs the song request line for
the dance.

- Keep the lineup itself in a plain list, starting empty. `CAPACITY`
  is already defined as `5`.
- Loop, prompting exactly `"Command: "` each time.
- If the input is exactly `DONE`, stop looping. Print nothing else.
- If the input starts with `ADD ` followed by at least one more
  character, everything after that first space is the song title,
  spaces and all. For example, `ADD Anti Hero` requests the song
  `Anti Hero`, not just `Anti`.
  - If the lineup has fewer than 5 songs waiting, call `enqueue` and
    print `Added: <song>`.
  - If the lineup is already full, print `Lineup is full` and don't
    add the song.
- If the input is exactly `PLAY`:
  - If the lineup isn't empty, call `dequeue` and print
    `Now playing: <song>`.
  - If the lineup is empty, print `Nothing to play`.
- Anything else, a blank line, `ADD` with nothing after it, a
  misspelled command, lowercase `add`, prints `Huh?` and prompts
  again. Don't crash on unexpected input.
- `enqueue` and `dequeue` should never print anything or read input
  themselves. All the printing happens in `main`, based on what they
  return.

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="lineup-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python lineup_less.py
Command: ADD Anti-Hero
Added: Anti-Hero
Command: ADD Flowers
Added: Flowers
Command: PLAY
Now playing: Anti-Hero
Command: PLAY
Now playing: Flowers
Command: PLAY
Nothing to play
Command: DONE

$ python lineup_less.py
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
  var el = document.getElementById('lineup-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python lineup_less.py', type: true, speed: 90 },
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
    { text: 'PLAY\n', type: true, speed: 90 },
    { text: 'Nothing to play\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python lineup_less.py', type: true, speed: 90 },
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

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- `"ADD Anti Hero".split(" ", 1)` gives you
  `['ADD', 'Anti Hero']`, the second piece being everything after that
  first space, spaces and all. That `1` matters: without it, `split`
  would break `Anti Hero` into two separate pieces instead of one.
- Check `command.startswith("ADD ")` (note the trailing space) before
  trying to split it. That trailing space is also what correctly
  rejects a bare `ADD` with nothing after it, since `"ADD".startswith("ADD ")`
  is `False`.
- An empty list is falsy: `if lineup:` is `True` only when there's
  something in it. That's the cleanest way to check before calling
  `dequeue`.
- `enqueue` and `dequeue` don't need `try`/`except` at all. They're
  not parsing user input, just managing the list and reporting back
  what happened, so a plain `if` covering the full/empty case is all
  either one needs.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Fill in `enqueue` and `dequeue` with real code, and add one more
  `>>>` example of your own to each docstring covering a case not
  already shown (the full lineup for `enqueue`, for instance). Both
  are pure enough to doctest cleanly. Don't try to doctest `main`;
  same reasoning as Battery Gauge, a loop that reads input doesn't fit
  the format.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Style and Submission

Run these one at a time, from inside your `lineup_less` folder.

Check your style:

{% include copy-command.html command="style50 lineup_less.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/lineup_less" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/lineup_less" %}

<hr>

Once this is working, try the more comfortable version:
[Lineup (more comfortable)](/cs50-psets/lineup-more/) picks up right
where this leaves off, the same lineup, plus a history of everything
that's already played.

## Glossary

- **queue** — A data structure where items come out in the same order
  they went in: first in, first out (FIFO). A line of people works the
  same way.
- **enqueue** — Adding an item to the back of a queue.
- **dequeue** — Removing and returning the item at the front of a
  queue.
- **FIFO** — "First in, first out." The rule that makes a queue a
  queue: whatever's been waiting longest comes out first.
