---
title: "Inheritance"
order: 10
chapter: 10
source: cs50-ap
source_url: "https://cs50.harvard.edu/ap/2025/curriculum/x/psets/5/inheritance/"
---

<figure id="fig-inheritance-tree" class="pset-hero">
  <svg viewBox="0 0 460 260" role="img" aria-labelledby="inheritance-tree-title">
    <title id="inheritance-tree-title">A family tree, three generations tall. A child with blood type BA sits at the bottom. Above are two parents, blood types AB and BA, each connected to the child by a line. Above them are four grandparents, blood types AA, AB, BO, and AO, each connected to their child.</title>

    <line x1="230" y1="210" x2="120" y2="160" stroke="#ccc" stroke-width="1.5"/>
    <line x1="230" y1="210" x2="340" y2="160" stroke="#ccc" stroke-width="1.5"/>
    <line x1="120" y1="120" x2="50" y2="68" stroke="#ccc" stroke-width="1.5"/>
    <line x1="120" y1="120" x2="140" y2="68" stroke="#ccc" stroke-width="1.5"/>
    <line x1="340" y1="120" x2="320" y2="68" stroke="#ccc" stroke-width="1.5"/>
    <line x1="340" y1="120" x2="410" y2="68" stroke="#ccc" stroke-width="1.5"/>

    <rect x="185" y="210" width="90" height="40" rx="8" fill="#111"/>
    <text x="230" y="234" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Child: BA</text>

    <rect x="75" y="120" width="90" height="40" rx="8" fill="#555"/>
    <text x="120" y="144" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Parent: AB</text>
    <rect x="295" y="120" width="90" height="40" rx="8" fill="#555"/>
    <text x="340" y="144" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Parent: BA</text>

    <rect x="10" y="30" width="80" height="38" rx="6" fill="#f2f2f2" stroke="#ccc"/>
    <text x="50" y="53" text-anchor="middle" font-size="11" fill="#828282">Grandparent: AA</text>
    <rect x="100" y="30" width="80" height="38" rx="6" fill="#f2f2f2" stroke="#ccc"/>
    <text x="140" y="53" text-anchor="middle" font-size="11" fill="#828282">Grandparent: AB</text>
    <rect x="280" y="30" width="80" height="38" rx="6" fill="#f2f2f2" stroke="#ccc"/>
    <text x="320" y="53" text-anchor="middle" font-size="11" fill="#828282">Grandparent: BO</text>
    <rect x="370" y="30" width="80" height="38" rx="6" fill="#f2f2f2" stroke="#ccc"/>
    <text x="410" y="53" text-anchor="middle" font-size="11" fill="#828282">Grandparent: AO</text>
  </svg>
  <figcaption>Each person's blood type is one allele inherited from each parent, chosen at random.</figcaption>
</figure>

## Background

A person's blood type is determined by two alleles (different forms of
the same gene). There are three possible alleles, `A`, `B`, and `O`,
and everybody has two of them, possibly the same, possibly different.
Each of a child's parents randomly passes down one of their own two
alleles, so a child's blood type depends on their parents', which
depends on *their* parents', and so on back through the family.

That's a recursive relationship, and this problem asks you to
implement it that way: a function that builds a family going back some
number of generations, and a function that prints the whole tree out.

Before that, one thing about Python dictionaries worth knowing: a
dictionary's value doesn't have to be a string or a number, it can be
another dictionary.

```python
>>> book = {"title": "Hidden Figures", "author": {"first": "Margot", "last": "Lee Shetterly"}}
>>> book["author"]["last"]
'Lee Shetterly'
```

That's how you'll represent a person: a dict whose `"parents"` value
holds that person's own two parents, each one a person dict in turn.

<div class="pset-demo">
  <button type="button" id="inheritance-generate-btn">Generate a family</button>
  <pre id="inheritance-tree"></pre>
</div>

<script>
(function () {
  var generateBtn = document.getElementById('inheritance-generate-btn');
  var output = document.getElementById('inheritance-tree');
  if (!generateBtn || !output) return;

  var ALLELES = ['A', 'B', 'O'];
  var GENERATIONS = 3;

  function randomAllele() {
    return ALLELES[Math.floor(Math.random() * ALLELES.length)];
  }

  function choice(pair) {
    return pair[Math.floor(Math.random() * pair.length)];
  }

  function createFamily(generations) {
    if (generations === 1) {
      return { parents: [null, null], alleles: [randomAllele(), randomAllele()] };
    }
    var parent0 = createFamily(generations - 1);
    var parent1 = createFamily(generations - 1);
    return {
      parents: [parent0, parent1],
      alleles: [choice(parent0.alleles), choice(parent1.alleles)]
    };
  }

  function label(generation) {
    if (generation === 0) return 'Child';
    if (generation === 1) return 'Parent';
    return 'Great-'.repeat(generation - 2) + 'Grandparent';
  }

  function printFamily(person, generation, lines) {
    var indent = '    '.repeat(generation);
    lines.push(indent + label(generation) + ' (Generation ' + generation + '): blood type ' + person.alleles.join(''));
    person.parents.forEach(function (parent) {
      if (parent !== null) printFamily(parent, generation + 1, lines);
    });
  }

  generateBtn.addEventListener('click', function () {
    var lines = [];
    printFamily(createFamily(GENERATIONS), 0, lines);
    output.textContent = lines.join('\n');
  });
})();
</script>

This is the same algorithm your program will implement, in JavaScript
instead of Python. Click it a few times; the tree is different every
time, since alleles are chosen at random.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir inheritance
cd inheritance
code inheritance.py
```

That creates a new folder called `inheritance`, moves into it, and
opens a new, empty file called `inheritance.py` for you to edit.

## Starter Code

Paste this into `inheritance.py` to start from. `main` is already
written for you; it's just two lines. `random_allele`, `create_family`,
and `print_family` are stubbed out with `pass` and doctest examples;
run `python3 -m doctest inheritance.py` from inside your `inheritance`
folder to check them. They'll fail until you replace `pass` with real
code.

```python
# Student Initials:
"""
Inheritance

Slug: porttack/cs50/problems/py/inheritance
Doctests: python3 -m doctest inheritance.py
"""

import random


ALLELES = ["A", "B", "O"]
GENERATIONS = 3


def main():
    family = create_family(GENERATIONS)
    print_family(family)


def random_allele():
    """
    Returns one randomly chosen allele from ALLELES.

    >>> import random
    >>> random.seed(0)
    >>> random_allele()
    'B'
    >>> random_allele()
    'B'
    >>> random_allele()
    'A'
    """
    pass


def create_family(generations):
    """
    Recursively builds a family going back the given number of
    generations, returning the person in the youngest generation as a
    nested dict: {"parents": [parent0, parent1], "alleles": [a, b]}.
    generations == 1 is the base case: no parents, two random alleles.

    >>> import random
    >>> random.seed(0)
    >>> create_family(1)
    {'parents': [None, None], 'alleles': ['B', 'B']}
    """
    pass


def print_family(person, generation=0):
    """
    Prints person and all their ancestors, one line per person,
    indented four spaces per generation. Doesn't return anything.

    >>> person = {
    ...     "parents": [
    ...         {"parents": [None, None], "alleles": ["A", "O"]},
    ...         {"parents": [None, None], "alleles": ["B", "O"]},
    ...     ],
    ...     "alleles": ["A", "B"],
    ... }
    >>> print_family(person)
    Child (Generation 0): blood type AB
        Parent (Generation 1): blood type AO
        Parent (Generation 1): blood type BO
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, `inheritance.py`, that builds a random family
tree and prints out everyone's blood type.

- `ALLELES` and `GENERATIONS` are already defined for you: the three
  possible alleles, and how many generations back to go (3, matching
  the child, their two parents, and their four grandparents).
- `random_allele()` returns one allele chosen at random from
  `ALLELES`. `random.choice()` does exactly this.
- `create_family(generations)` builds and returns one person, going
  back the given number of generations:
  - **Base case**, `generations == 1`: return a person with
    `"parents": [None, None]` and two alleles from `random_allele()`.
    This is the oldest generation in the tree; they have no parents of
    their own to inherit from.
  - **Recursive case**, `generations > 1`: call `create_family` on
    `generations - 1` twice, once for each parent. Then build this
    person's `"alleles"` by choosing one allele at random from each
    parent's own two, `random.choice(parent["alleles"])`. Build the
    parents before you build this person; you can't choose from a
    parent's alleles until that parent exists.
- `print_family(person, generation=0)` prints `person`, then
  recursively prints each of their parents (parent 0 before parent 1),
  each one generation deeper:
  - Each line reads `<Label> (Generation <N>): blood type <XY>`, where
    `<XY>` is `person`'s two alleles joined together with no space
    between them.
  - Each line is indented 4 spaces per generation: generation 0 isn't
    indented at all, generation 1 is indented 4 spaces, generation 2 is
    indented 8 spaces, and so on.
  - The label is `Child` at generation 0, `Parent` at generation 1, and
    `Grandparent` at generation 2. (Generations past 2 aren't part of
    the base spec, but see the Bonus below.)
  - If a person's parent is `None` (the base case), don't print
    anything for that parent, and don't recurse into it.
- `main` (already written for you) calls `create_family(GENERATIONS)`
  and prints the result with `print_family`.

<aside class="callout note" markdown="1">
**NOTE**

The original C version of this problem also asks for a `free_family`
function, walking the same tree a third time to manually release each
person's memory before the program exits. There's no equivalent here,
and that's not an omission: Python's garbage collector already tracks
whether anything still refers to a family tree, and reclaims the whole
thing automatically once `main` returns and nothing does. Manual
memory management is real work C asks of you that Python just
doesn't.
</aside>

## Usage

Since alleles are chosen at random, your output won't match this
exactly, but it will have the same shape. This is one real run:

```
$ python inheritance.py
Child (Generation 0): blood type BA
    Parent (Generation 1): blood type AB
        Grandparent (Generation 2): blood type AA
        Grandparent (Generation 2): blood type AB
    Parent (Generation 1): blood type BA
        Grandparent (Generation 2): blood type BO
        Grandparent (Generation 2): blood type AO
```

## Hints

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- `create_family`'s recursive case needs both parents built before it
  can choose either of this person's alleles, so build `parent0` and
  `parent1` first, store them in variables, and use those variables
  both for `"parents"` and for picking alleles.
- `random.choice()` works on any list, so
  `random.choice(parent0["alleles"])` picks one of that parent's two
  alleles directly; you don't need an index or `random.randint()`.
- For the label in `print_family`, resist the urge to hardcode
  `"Grandparent"` as a literal string for generation 2. A small rule
  like `"Great-" * (generation - 2) + "Grandparent"` gives you the same
  word at generation 2 (`"Great-" * 0` is `""`) and keeps working if
  the tree ever goes back further, which is exactly what the Bonus
  below asks for.
- `"    " * generation` (4 spaces, repeated) builds the right amount
  of indentation for any generation without an `if` for every level.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Fill in `random_allele`, `create_family`, and `print_family` with
  real code, and add one more `>>>` example of your own to each
  docstring covering a case not already shown. All three are pure
  enough to doctest cleanly.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Bonus

For extra credit: make the number of generations configurable instead
of fixed at 3. If your program is run with a single command-line
argument, an integer, use that many generations instead of
`GENERATIONS`. This is exactly where the "Great-" label rule from the
hint above pays off: if you hardcoded `"Grandparent"` for generation 2,
this is where it'll show.

```
$ python inheritance.py 4
Child (Generation 0): blood type AA
    Parent (Generation 1): blood type BA
        Grandparent (Generation 2): blood type BO
            Great-Grandparent (Generation 3): blood type AB
            Great-Grandparent (Generation 3): blood type AO
        Grandparent (Generation 2): blood type AA
            Great-Grandparent (Generation 3): blood type AA
            Great-Grandparent (Generation 3): blood type AA
    Parent (Generation 1): blood type OA
        Grandparent (Generation 2): blood type OB
            Great-Grandparent (Generation 3): blood type OO
            Great-Grandparent (Generation 3): blood type BB
        Grandparent (Generation 2): blood type AO
            Great-Grandparent (Generation 3): blood type BA
            Great-Grandparent (Generation 3): blood type AO
```

Your program should still default to 3 generations when run with no
arguments; check50 needs that to still pass.

## Style and Submission

Run these one at a time, from inside your `inheritance` folder.

Check your style:

{% include copy-command.html command="style50 inheritance.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/inheritance" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/inheritance" %}

<hr>

## Glossary

- **nested dict** — A dictionary whose value for some key is itself
  another dictionary, rather than a string, number, or list.
- **allele** — One of the possible forms a gene can take. Blood type
  in this problem is determined by two alleles, `A`, `B`, or `O`, one
  inherited from each parent.
- **base case** — The condition in a recursive function that stops the
  recursion and returns directly, without calling itself again. Here,
  `generations == 1`.
- **recursive case** — The branch of a recursive function that calls
  itself again, on a smaller version of the problem. Here, building
  each parent by calling `create_family` on one fewer generation.
