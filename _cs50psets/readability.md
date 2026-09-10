---
title: "Readability"
permalink: /cs50/problems/2024/x/sentimental/readability/
order: 6
source: cs50-ap
source_url: "https://cs50.harvard.edu/ap/2025/curriculum/x/psets/6/readability/"
---

## Background

Some writing is easy to read. Some takes real effort. Longer words and
longer sentences tend to push a text toward the harder end, and over
the years people have turned that observation into a whole family of
"readability tests," each one a formula for estimating which is which.
In 1975, Meri Coleman and T. L. Liau came up with one of them: feed it
a passage of English text, and it estimates the U.S. grade level a
reader would need to understand it, based on nothing more than how
long the words and sentences tend to be. No dictionary, no grammar
check, just averages.

It's not a perfect measure. A sentence can be long and still be easy,
or short and still be dense. But it's a genuinely useful first pass,
and it's the same kind of estimate you'll find behind the "readability"
score in a word processor or a librarian's reading-level guide on a
book jacket.

<figure id="fig-charlottes-web">
  <img src="https://cs50.harvard.edu/ap/2025/curriculum/x/psets/2/readability/charlottes_web.jpg" alt="Cover of E.B. White's Charlotte's Web">
  <figcaption>Scholastic rates <em>Charlotte's Web</em> at grades 2&ndash;4. A formula like Coleman-Liau tries to guess that same kind of number from nothing but the text itself. (Book cover via <a href="https://cs50.harvard.edu/ap/2025/curriculum/x/psets/2/readability/">CS50 AP</a>; rights belong to its publisher.)</figcaption>
</figure>

<div class="pset-demo">
  <div class="pset-demo-head">
    <label for="readability-input">Try your own text, or browse the examples below:</label>
    <div class="pset-demo-nav">
      <button type="button" id="readability-prev" aria-label="Previous example">‹</button>
      <span id="readability-example-counter" aria-hidden="true"></span>
      <button type="button" id="readability-next" aria-label="Next example">›</button>
    </div>
  </div>
  <textarea id="readability-input" rows="3" placeholder="Paste or type a sentence or two...">Congratulations! Today is your day. You're off to Great Places! You're off and away!</textarea>
  <pre id="readability-result"></pre>
</div>

<script>
(function () {
  var input = document.getElementById('readability-input');
  var result = document.getElementById('readability-result');
  var prevBtn = document.getElementById('readability-prev');
  var nextBtn = document.getElementById('readability-next');
  var counter = document.getElementById('readability-example-counter');
  if (!input || !result) return;

  // Same order as the table under "Usage" below -- keep the two in sync.
  var EXAMPLES = [
    'One fish. Two fish. Red fish. Blue fish.',
    'Would you like them here or there? I would not like them here or there. I would not like them anywhere.',
    'Congratulations! Today is your day. You\'re off to Great Places! You\'re off and away!',
    'Harry Potter was a highly unusual boy in many ways. For one thing, he hated the summer holidays more than any other time of year. For another, he really wanted to do his homework, but was forced to do it in secret, in the dead of the night. And he also happened to be a wizard.',
    'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.',
    'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversation?"',
    'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem\'s fears of never being able to play football were assuaged, he was seldom self-conscious about his injury. His left arm was somewhat shorter than his right; when he stood or walked, the back of his hand was at right angles to his body, his thumb parallel to his thigh.',
    'There are more things in Heaven and Earth, Horatio, than are dreamt of in your philosophy.',
    'It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.',
    'A large class of computational problems involve the determination of properties of graphs, digraphs, integers, arrays of integers, finite families of finite sets, boolean formulas and elements of other countable domains.'
  ];
  var exampleIndex = 2; // matches the textarea's starting text, above

  function update() {
    var text = input.value.trim();
    var words = text.length ? text.split(/\s+/).filter(Boolean) : [];
    if (words.length === 0) {
      result.textContent = '';
      return;
    }
    var letters = (text.match(/[a-zA-Z]/g) || []).length;
    var sentences = (text.match(/[.!?]/g) || []).length;
    var L = 100 * letters / words.length;
    var S = 100 * sentences / words.length;
    var index = 0.0588 * L - 0.296 * S - 15.8;
    var rounded = Math.round(index);
    var grade;
    if (rounded < 1) grade = 'Before Grade 1';
    else if (rounded >= 16) grade = 'Grade 16+';
    else grade = 'Grade ' + rounded;

    result.textContent =
      'letters=' + letters + '  words=' + words.length + '  sentences=' + sentences + '\n' +
      'L=' + L.toFixed(2) + '  S=' + S.toFixed(2) + '\n' +
      'index=' + index.toFixed(2) + '  →  ' + grade;
  }

  function showExample(i) {
    exampleIndex = ((i % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length;
    input.value = EXAMPLES[exampleIndex];
    if (counter) counter.textContent = (exampleIndex + 1) + ' / ' + EXAMPLES.length;
    update();
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { showExample(exampleIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { showExample(exampleIndex + 1); });

  input.addEventListener('input', update);
  if (counter) counter.textContent = (exampleIndex + 1) + ' / ' + EXAMPLES.length;
  update();
})();
</script>

This mirrors the formula so you can play with real text before you
write any code, but it's more forgiving than your program needs to be
(it shrugs off extra spaces and blank lines). Your program should
follow the word-counting rule in the spec exactly, not this demo's
looser version.

## Walkthrough

Before you start writing code, step through this with the class. It
scans a real sentence one character at a time, so you can see exactly
when a letter, a word, or a sentence gets counted, before you have to
write that logic yourself.

Click into the box, then use the buttons below it, the arrow keys, or
Page Up/Down to move between its 7 steps. On step 3, the spacebar
steps the character scan itself.

<div class="rw-walk" id="rw-walk" tabindex="0" role="group" aria-label="Readability walkthrough, 7 steps. Use the Next and Back buttons, or the arrow keys, to move between steps.">

  <div class="rw-stage">

    <!-- 1 -->
    <section class="step on" id="rw-s1">
      <h2>Text goes in. A grade level comes out.</h2>
      <p class="sub">That is the whole program. Everything else is figuring out how to measure a sentence.</p>
      <div class="specimen">
        <p>Congratulations! Today is your day. You're off to Great Places! You're off and away!</p>
        <span class="stamp">Grade 3</span>
      </div>
      <p class="attrib">The Coleman-Liau index estimates what U.S. grade level a reader needs to understand a passage. Longer words and longer sentences push the number up.</p>
    </section>

    <!-- 2 -->
    <section class="step" id="rw-s2">
      <h2>Four small problems, not one big one.</h2>
      <p class="sub">Each box below is a function. Three of them count something. One does arithmetic.</p>
      <div class="pipe">
        <div class="box"><code>count_letters</code><span>Takes text. Returns how many letters.</span></div>
        <div class="box"><code>count_words</code><span>Takes text. Returns how many words.</span></div>
        <div class="box"><code>count_sentences</code><span>Takes text. Returns how many sentences.</span></div>
        <div class="box out"><code>coleman_liau</code><span>Takes those three numbers. Returns a grade.</span></div>
      </div>
      <div class="returns">
        <p>Notice what none of these do: print. Each one hands a value back so the next step can use it. If a counting function prints instead of returning, the formula has nothing to work with.</p>
      </div>
    </section>

    <!-- 3 -->
    <section class="step wide" id="rw-s3">
      <h2>One character at a time.</h2>
      <p class="sub">Walk the string. Look at the character under the marker. Ask three questions about it, then move on.</p>
      <div class="tape" id="rw-tape"></div>
      <div class="meters">
        <div class="meter" id="rw-mL"><span class="lbl">letters</span><span class="val" id="rw-vL">0</span></div>
        <div class="meter" id="rw-mW"><span class="lbl">words (starts at 1)</span><span class="val" id="rw-vW">1</span></div>
        <div class="meter" id="rw-mS"><span class="lbl">sentences</span><span class="val" id="rw-vS">0</span></div>
      </div>
      <div class="say" id="rw-say">Press Step, or hit the spacebar.</div>
      <div class="scanbtns">
        <button class="go" id="rw-btnStep">Step</button>
        <button class="nav" id="rw-btnPlay">Play</button>
        <button class="nav" id="rw-btnReset">Reset</button>
        <span class="hint">Spacebar steps. Arrow keys or Page Up/Down move between steps.</span>
      </div>
    </section>

    <!-- 4 -->
    <section class="step" id="rw-s4">
      <h2>What counts as what.</h2>
      <p class="sub">The specification decides this for you. Read it carefully before you write anything.</p>
      <ul class="rules">
        <li><span class="k">letter</span><span class="v">Any character a through z, upper or lower. Not digits, not punctuation, not the apostrophe in <em>You're</em>.</span></li>
        <li><span class="k">word</span><span class="v">Any run of characters separated by a space. So <em>sister-in-law</em> is one word, not three.</span></li>
        <li><span class="k">sentence</span><span class="v">Any period, exclamation point, or question mark.</span></li>
      </ul>
      <div class="caution">
        <p>Counting spaces and adding one only works because the spec promises the text will not start or end with a space, and will never have two spaces in a row.</p>
        <p>That promise is doing real work. Take it away and your word count breaks. Assumptions like this one are why reading the spec is part of the problem.</p>
      </div>
    </section>

    <!-- 5 -->
    <section class="step" id="rw-s5">
      <h2>Now the arithmetic.</h2>
      <p class="sub">Three counts become two averages, and the two averages become one number.</p>
      <div class="formula">index = 0.0588 &times; <span class="v1">L</span> &minus; 0.296 &times; <span class="v2">S</span> &minus; 15.8</div>
      <div class="defs">
        <div><span class="sym a">L</span><p>Letters per 100 words. Long words push this up, which raises the grade.</p></div>
        <div><span class="sym b">S</span><p>Sentences per 100 words. More sentences means shorter ones, which lowers the grade.</p></div>
      </div>
      <div class="work">
        letters = 22, words = 6, sentences = 2<br>
        <span class="v1">L</span> = 100 &times; 22 / 6 = 366.67<br>
        <span class="v2">S</span> = 100 &times; 2 / 6 = 33.33<br>
        index = 0.0588 &times; 366.67 &minus; 0.296 &times; 33.33 &minus; 15.8 = <span class="res">&minus;4.11</span>
      </div>
    </section>

    <!-- 6 -->
    <section class="step" id="rw-s6">
      <h2>Three ways to print it.</h2>
      <p class="sub">The index is a float. What you print is not.</p>
      <div class="edges">
        <div class="edge"><span class="when">index &lt; 1</span><span class="then">Before Grade 1</span></div>
        <div class="edge"><span class="when">1 &le; index &lt; 16</span><span class="then">Grade 7</span></div>
        <div class="edge"><span class="when">index &ge; 16</span><span class="then">Grade 16+</span></div>
      </div>
      <p>Round to the nearest whole number before you compare. Our short example landed at &minus;4.11, so it prints <strong>Before Grade 1</strong>. That is not a bug. Two tiny sentences really are that simple.</p>
      <p>Three outcomes means three branches. Write them so that each one exits cleanly rather than nesting inside the last.</p>
    </section>

    <!-- 7 -->
    <section class="step" id="rw-s7">
      <h2>Your turn.</h2>
      <p class="sub">Here is the shape. The bodies are yours.</p>
      <div class="pseudo"><span class="c"># readability.py</span>

text = input("Text: ")

<span class="c"># count each thing, using a function per thing</span>
<span class="c"># each function takes text and returns a number</span>

<span class="k">def</span> count_letters(text):
    <span class="c">...</span>

<span class="c"># turn the counts into L and S</span>
<span class="c"># apply the formula</span>
<span class="c"># round, then print one of three things</span>
</div>
      <ul class="checks">
        <li>Does every counting function return a number instead of printing one?</li>
        <li>Can you say out loud why the word count starts at 1?</li>
        <li>Does an apostrophe change your letter count? It should not.</li>
        <li>Test the Dr. Seuss passage from the first slide. You should get Grade 3.</li>
      </ul>
    </section>

  </div>

  <div class="controls">
    <div class="ticks" id="rw-ticks"></div>
    <span class="rw-counter" id="rw-counter">1 / 7</span>
    <div class="navbtns">
      <button class="nav" id="rw-prev">Back</button>
      <button class="nav" id="rw-next">Next</button>
    </div>
  </div>

</div>

<script>
(function(){
  "use strict";

  var root = document.getElementById("rw-walk");
  if (!root) return;

  /* ---------- step navigation ---------- */
  var steps = Array.prototype.slice.call(root.querySelectorAll(".step"));
  var total = steps.length;
  var at = 0;
  var counter = document.getElementById("rw-counter");
  var prevBtn = document.getElementById("rw-prev");
  var nextBtn = document.getElementById("rw-next");
  var ticks = document.getElementById("rw-ticks");

  steps.forEach(function(_, i){
    var b = document.createElement("button");
    b.className = "tick";
    b.type = "button";
    b.setAttribute("aria-label", "Go to step " + (i+1));
    b.addEventListener("click", function(){ show(i); });
    ticks.appendChild(b);
  });
  var tickEls = Array.prototype.slice.call(ticks.children);

  function show(i){
    at = Math.max(0, Math.min(total - 1, i));
    steps.forEach(function(s, n){ s.classList.toggle("on", n === at); });
    tickEls.forEach(function(t, n){ t.classList.toggle("on", n === at); });
    counter.textContent = (at + 1) + " / " + total;
    prevBtn.disabled = at === 0;
    nextBtn.disabled = at === total - 1;
    if (at !== 2) stop();
  }

  prevBtn.addEventListener("click", function(){ show(at - 1); });
  nextBtn.addEventListener("click", function(){ show(at + 1); });

  // Scoped to this widget, not the whole document: a lesson page also has
  // its own scrolling, a print button, and prev/next lesson links, so
  // global arrow-key/Page Up/Down handlers would hijack normal page
  // navigation. Click or tab into the widget first to focus it.
  root.addEventListener("keydown", function(e){
    var k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || k === "ArrowDown"){ e.preventDefault(); show(at + 1); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp"){ e.preventDefault(); show(at - 1); }
    else if (k === " " && at === 2){ e.preventDefault(); step(); }
  });

  /* ---------- the scan (step 3) ---------- */
  var TEXT = "Today is your day. You're off!";
  var tape = document.getElementById("rw-tape");
  var say  = document.getElementById("rw-say");
  var vL = document.getElementById("rw-vL"), vW = document.getElementById("rw-vW"), vS = document.getElementById("rw-vS");
  var mL = document.getElementById("rw-mL"), mW = document.getElementById("rw-mW"), mS = document.getElementById("rw-mS");
  var cells = [];
  var idx = -1, L = 0, W = 1, S = 0, timer = null;

  TEXT.split("").forEach(function(ch){
    var el = document.createElement("span");
    el.className = "ch" + (ch === " " ? " space" : "");
    el.textContent = ch === " " ? " " : ch;
    tape.appendChild(el);
    cells.push(el);
  });

  function isLetter(c){ return /[A-Za-z]/.test(c); }

  function clearHits(){ [mL, mW, mS].forEach(function(m){ m.classList.remove("hit"); }); }

  function step(){
    if (idx >= TEXT.length - 1){ stop(); say.innerHTML = "Done. Every character has been looked at once."; return; }
    idx++;
    clearHits();
    cells.forEach(function(c, i){
      c.classList.toggle("here", i === idx);
      c.classList.toggle("done", i < idx);
    });
    var ch = TEXT[idx];
    var shown = ch === " " ? "a space" : '"' + ch + '"';
    if (isLetter(ch)){
      L++; vL.textContent = L; mL.classList.add("hit");
      say.innerHTML = shown + " is a letter. <b>letters + 1</b>";
    } else if (ch === " "){
      W++; vW.textContent = W; mW.classList.add("hit");
      say.innerHTML = "A space ends a word. <b>words + 1</b>";
    } else if (ch === "." || ch === "!" || ch === "?"){
      S++; vS.textContent = S; mS.classList.add("hit");
      say.innerHTML = shown + " ends a sentence. <b>sentences + 1</b>";
    } else {
      say.innerHTML = shown + " is none of the three. Nothing changes.";
    }
  }

  function stop(){
    if (timer){ clearInterval(timer); timer = null; }
    document.getElementById("rw-btnPlay").textContent = "Play";
  }

  function reset(){
    stop();
    idx = -1; L = 0; W = 1; S = 0;
    vL.textContent = "0"; vW.textContent = "1"; vS.textContent = "0";
    clearHits();
    cells.forEach(function(c){ c.classList.remove("here","done"); });
    say.textContent = "Press Step, or hit the spacebar.";
  }

  document.getElementById("rw-btnStep").addEventListener("click", step);
  document.getElementById("rw-btnReset").addEventListener("click", reset);
  document.getElementById("rw-btnPlay").addEventListener("click", function(){
    if (timer){ stop(); return; }
    if (idx >= TEXT.length - 1) reset();
    this.textContent = "Pause";
    timer = setInterval(function(){
      if (idx >= TEXT.length - 1){ step(); stop(); } else { step(); }
    }, 620);
  });

  show(0);
})();
</script>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir readability
cd readability
code readability.py
```

That creates a new folder called `readability`, moves into it, and
opens a new, empty file called `readability.py` for you to edit.

## Starter Code

Paste this into `readability.py` to start from. It's the same
four-function shape as the walkthrough: three counters and a function
for the formula, each one currently just a stub with `pass` for a
body.

The three counters each carry a couple of `>>>` examples, the same
doctest format you've already seen in Think Python. They'll fail until
you replace `pass` with real code; run `python3 -m doctest
readability.py` from inside your `readability` folder to check them.

```python
def main():
    text = input("Text: ")
    letters = count_letters(text)
    words = count_words(text)
    sentences = count_sentences(text)
    index = coleman_liau(letters, words, sentences)
    # round index, then print one of the three outputs


def count_letters(text):
    """
    Returns the number of letters in text.

    >>> count_letters("cat")
    3
    >>> count_letters("You're")
    5
    """
    pass


def count_words(text):
    """
    Returns the number of words in text.

    >>> count_words("cat dog")
    2
    >>> count_words("sister-in-law is one word")
    4
    """
    pass


def count_sentences(text):
    """
    Returns the number of sentences in text.

    >>> count_sentences("Wait! Really?")
    2
    """
    pass


def coleman_liau(letters, words, sentences):
    """
    Returns the Coleman-Liau grade level for the given letter, word,
    and sentence counts.
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, `readability.py`, that computes the approximate
grade level needed to comprehend a piece of text.

- Print `Text: ` (with a trailing space, no newline) and prompt the
  user for a string of text with `input()`.
- Compute the number of letters, words, and sentences in the text,
  using these rules:
  - A **letter** is any character `a` through `z` or `A` through `Z`.
    Digits, punctuation, and spaces are not letters, and neither is an
    apostrophe.
  - A **word** is any sequence of characters separated by spaces. You
    can assume the text has no leading or trailing spaces, and never
    has two spaces in a row.
  - A **sentence** ends with a period, an exclamation point, or a
    question mark. Count one of those characters as one sentence,
    wherever it appears.
- From those three counts, compute two averages:
  - *L*, the average number of letters per 100 words.
  - *S*, the average number of sentences per 100 words.
- Compute the Coleman-Liau index:

  ```
  index = 0.0588 * L - 0.296 * S - 15.8
  ```

- Round the index to the nearest whole number before deciding what to
  print.
  - If the rounded index is less than 1, print `Before Grade 1`.
  - If the rounded index is 16 or more, print `Grade 16+`.
  - Otherwise, print `Grade N`, where `N` is the rounded index.
- After printing, output a newline.

## Usage

Your program should behave per the examples below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="readability-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python readability.py
Text: See Spot run. Spot runs fast.
Before Grade 1

$ python readability.py
Text: Turtles carry their homes on their backs and can live for over a hundred years.
Grade 7

$ python readability.py
Text: When students submit their problem sets, check50 automatically verifies whether the program's observed behavior matches the staff-written expectations for a range of sample inputs, and style50 separately reports on formatting.
Grade 16+
</pre>

<script>
(function () {
  var el = document.getElementById('readability-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python readability.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Text: ', type: false },
    { text: 'See Spot run. Spot runs fast.\n', type: true, speed: 55 },
    { text: 'Before Grade 1\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python readability.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Text: ', type: false },
    { text: 'Turtles carry their homes on their backs and can live for over a hundred years.\n', type: true, speed: 28 },
    { text: 'Grade 7\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python readability.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Text: ', type: false },
    { text: "When students submit their problem sets, check50 automatically verifies whether the program's observed behavior matches the staff-written expectations for a range of sample inputs, and style50 separately reports on formatting.\n", type: true, speed: 12 },
    { text: 'Grade 16+\n', type: false }
  ];

  var pauseBetweenLoops = 3400;
  var pauseBetweenLines = 550;

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

A few more to try, spanning the full range from `Before Grade 1` up to
`Grade 16+`:

| Text | Output |
|---|---|
| One fish. Two fish. Red fish. Blue fish. | Before Grade 1 |
| Would you like them here or there? I would not like them here or there. I would not like them anywhere. | Grade 2 |
| Congratulations! Today is your day. You're off to Great Places! You're off and away! | Grade 3 |
| Harry Potter was a highly unusual boy in many ways. For one thing, he hated the summer holidays more than any other time of year. For another, he really wanted to do his homework, but was forced to do it in secret, in the dead of the night. And he also happened to be a wizard. | Grade 5 |
| In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. | Grade 7 |
| Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversation?" | Grade 8 |
| When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury. His left arm was somewhat shorter than his right; when he stood or walked, the back of his hand was at right angles to his body, his thumb parallel to his thigh. | Grade 8 |
| There are more things in Heaven and Earth, Horatio, than are dreamt of in your philosophy. | Grade 9 |
| It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him. | Grade 10 |
| A large class of computational problems involve the determination of properties of graphs, digraphs, integers, arrays of integers, finite families of finite sets, boolean formulas and elements of other countable domains. | Grade 16+ |

## Hints

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- You'll need at least three separate counts (letters, words,
  sentences) before you can compute anything. Get each one right on
  its own before you touch the formula.
- Python strings support `for ch in text:`, which visits one character
  at a time, same as the walkthrough's scan.
- A string has an `.isalpha()` method that tells you whether a single
  character is a letter. It correctly says `False` for an apostrophe.
- Counting words by counting spaces works only because of the
  no-leading/trailing/doubled-space guarantee in the spec. If you'd
  rather not rely on that, Python's `.split()` method breaks a string
  into a list of words directly; either approach is fine.
- `round()` rounds a float to the nearest whole number, which you need
  before comparing the index against 1 and 16.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you do
everything below. Submit early, then keep improving and resubmit as many
times as you like.

- Structure your program with more than one function besides `main()`.
  The starter code's four-function shape, one function each for
  letters, words, sentences, and the formula itself, is a reasonable
  way to do it, but you're free to rename or reorganize as long as the
  same decomposition idea holds: more than one function doing real work.
- Each counting function should take the text and return a number.
  None of them should print anything themselves; only `main()` should
  decide what to print, and only once, at the end.
- At the end of the program, add a comment describing any challenges you
  ran into or what you'd improve if you did this again. A sentence or two
  is fine.

## Style and Submission

Run these one at a time, from inside your `readability` folder.

Check your style:

{% include copy-command.html command="style50 readability.py" %}

Check your correctness:

{% include copy-command.html command="check50 cs50/problems/2024/x/sentimental/readability" %}

Submit your work:

{% include copy-command.html command="submit50 cs50/problems/2024/x/sentimental/readability" %}

<hr>

## Glossary

- **Coleman-Liau index** — A readability formula that estimates a U.S.
  grade level from the average number of letters and sentences per 100
  words, without looking at word meaning or grammar.
- **function** — A named, reusable block of code. Can take parameters
  and return a value.
- **parameter** — A value a function accepts as input, named in its
  definition.
- **return value** — The value a function hands back to whatever
  called it, using a `return` statement. Different from printing,
  which only displays something and hands nothing back.
- **average** — A single number summarizing a set of values. Here,
  letters and sentences are each expressed as an average per 100
  words, rather than a raw count, so texts of different lengths can be
  compared fairly.

<hr>

## Standards Alignment

**AP CSP:** [3.3 Mathematical Expressions](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.3), [3.4 Strings](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.4), [3.8 Iteration](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.8), [3.13 Developing Procedures](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.13) (Big Idea 3, 30–35% of the exam). Also [3.6 Conditionals](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.6), headers only — the three-way output is a straightforward branch once the harder counting work is done.
**California 9-12:** [9-12.AP.14](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.AP.14), [9-12.AP.16](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.AP.16)
**CSTA 2026:** [HS-ALG-PS-02](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-ALG-PS-02), [HS-PRO-PD-12](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-PRO-PD-12)
**CA CTE (ICT):** [C4.9](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.9) (Pathway C).

Turning a formula into code is 3.3 in its most direct form, and walking
text one character at a time to build up the three counts is 3.4 and
3.8 together. Splitting the problem into a function per count, plus
one for the formula, is 3.13 and AP.16's decomposition, and CSTA's
HS-ALG-PS-02 and HS-PRO-PD-12 in different words; ICT's C4.9 names the
same shared toolkit (loops, functions with parameters, branches) this
problem asks for all at once.
