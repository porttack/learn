---
title: "Secret Messages in ASCII"
reviewed: 2026-10-03
source: original
level: ms
kind: [single, supplementary]
topics: [Binary, Data representation]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/ascii-messages-generator/
generator_presets:
  - { label: "Decimal, decode", query: "format=decimal&direction=decode&chart=full" }
  - { label: "Decimal, encode", query: "format=decimal&direction=encode&chart=full" }
---

Computers do not store letters. They store numbers. ASCII is the code that
turns each letter into a number, and you are about to crack it.

## Your code table

<table class="ascii-table">
<tbody>
<tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th></tr>
<tr><td>65</td><td>66</td><td>67</td><td>68</td><td>69</td><td>70</td><td>71</td><td>72</td><td>73</td></tr>
<tr><th>J</th><th>K</th><th>L</th><th>M</th><th>N</th><th>O</th><th>P</th><th>Q</th><th>R</th></tr>
<tr><td>74</td><td>75</td><td>76</td><td>77</td><td>78</td><td>79</td><td>80</td><td>81</td><td>82</td></tr>
<tr><th>S</th><th>T</th><th>U</th><th>V</th><th>W</th><th>X</th><th>Y</th><th>Z</th><th>space</th></tr>
<tr><td>83</td><td>84</td><td>85</td><td>86</td><td>87</td><td>88</td><td>89</td><td>90</td><td>32</td></tr>
</tbody>
</table>

## What to do

1. Find each number in the table above.
2. Write the matching letter in the box under it.
3. A hatched box is the code 32. That means "space." Leave it blank.
4. Read your finished answer to check it makes sense.

<aside class="callout note" markdown="1">
**TRY THIS FIRST**

72 73 decodes to **HI**.

<div class="code-row is-example">
  <div class="code-cell"><span class="code-num">72</span><span class="code-box">H</span></div>
  <div class="code-cell"><span class="code-num">73</span><span class="code-box">I</span></div>
</div>
</aside>

## Now decode these

{% assign msgs = site.data.unplugged.ascii_fixed.decimal.messages %}
{% for m in msgs %}
<div class="ascii-question">
<p class="ascii-prompt">{{ forloop.index }}. {{ m.prompt }}</p>
<div class="code-row">
{% for code in m.codes %}
<div class="code-cell{% if code == 32 %} is-space{% endif %}">
  <span class="code-num">{{ code }}</span>
  <span class="code-box"></span>
</div>
{% endfor %}
</div>
</div>
{% endfor %}

## Lowercase, punctuation, and digits

Real messages need more than capital letters. Every lowercase letter's code
is **32 more** than its capital: A is 65, so a is 97.

{% assign lower = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z" | split: "," %}
<table class="ascii-table">
<tbody>
{% for band in (0..2) %}{% assign off = band | times: 9 %}
<tr>{% for l in lower limit: 9 offset: off %}<th>{{ l }}</th>{% endfor %}</tr>
<tr>{% for l in lower limit: 9 offset: off %}<td>{{ forloop.index0 | plus: off | plus: 97 }}</td>{% endfor %}</tr>
{% endfor %}
</tbody>
</table>

<table class="ascii-table ascii-punct">
<tbody>
<tr><th>space</th><th>!</th><th>,</th><th>.</th><th>?</th></tr>
<tr><td>32</td><td>33</td><td>44</td><td>46</td><td>63</td></tr>
</tbody>
</table>

<table class="ascii-table ascii-punct">
<tbody>
<tr>{% for d in (0..9) %}<th>{{ d }}</th>{% endfor %}</tr>
<tr>{% for d in (0..9) %}<td>{{ d | plus: 48 }}</td>{% endfor %}</tr>
</tbody>
</table>

Notice that the digit **7** is stored as **55**, not 7. To a computer, the
character "7" and the number 7 are different things. (That's why a program
that reads typed text has to convert "12" into the number 12 before it can
do math with it.)

{% assign more = site.data.unplugged.ascii_fixed.decimal_more %}
For example, {{ more.example.codes | join: " " }} is **{{ more.example.text }}**

{% for m in more.messages %}
<div class="ascii-question">
<p class="ascii-prompt">{{ m.prompt }}</p>
<div class="code-row">
{% for code in m.codes %}
<div class="code-cell{% if code == 32 %} is-space{% endif %}">
  <span class="code-num">{{ code }}</span>
  <span class="code-box"></span>
</div>
{% endfor %}
</div>
</div>
{% endfor %}

## Write your name in ASCII

Now go the other way. Write one letter of your name in each top box, then
use the table to write its code underneath.

<div class="name-strip">
{% for i in (1..8) %}
<div class="name-cell">
  <span class="code-box"></span>
  <span class="value-box"></span>
</div>
{% endfor %}
</div>

Short name? Leave the extra boxes blank. Longer than eight letters? Keep
going on the back of the page.

## Secret messages for a friend

Think of two short messages (up to 16 letters, spaces, and marks each) and
write them on the lines **below the fold line**. Then write each message's
codes in its boxes, one character per box. Fold the bottom strip under so
only the **codes** show, and trade with a friend. Can they read your
messages?

{% for k in (1..2) %}
<div class="ascii-secret">
<p>Message {{ k }} codes:</p>
<div class="ascii-secret-boxes">{% for i in (1..16) %}<span class="value-box"></span>{% endfor %}</div>
</div>
{% endfor %}

<div class="ascii-fold">
<p class="ascii-fold-line">fold here</p>
<p>Message 1: <span class="fill-line"></span></p>
<p>Message 2: <span class="fill-line"></span></p>
</div>

<section class="ascii-friend" markdown="1">
## Your friend's messages

Decode your friend's codes, one character in each box.

{% for k in (1..2) %}
<div class="ascii-secret">
<p>Friend's message {{ k }}:</p>
<div class="ascii-secret-boxes">{% for i in (1..16) %}<span class="code-box"></span>{% endfor %}</div>
</div>
{% endfor %}
</section>

<section class="ascii-full" markdown="1">
## ASCII table: 32 to 122

Every character from code 32 to 122. Use it for your secret messages.

{% assign full = site.data.unplugged.ascii_full.rows %}
<table class="ascii-table ascii-full-table">
<thead><tr>{% for k in (1..5) %}<th>Code</th><th>Char</th>{% endfor %}</tr></thead>
<tbody>
{% for r in (0..18) %}<tr>{% for k in (0..4) %}{% assign i = k | times: 19 | plus: r %}{% if i < full.size %}{% assign row = full[i] %}<td>{{ row.code }}</td><td class="ascii-char">{{ row.char | escape }}</td>{% else %}<td></td><td></td>{% endif %}{% endfor %}</tr>
{% endfor %}
</tbody>
</table>
</section>

Want even more (codes 0 to 127, in hex too)? See the
[full ASCII / Hex table]({{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}).

<section class="answer-key">
<h2>Answer key</h2>
<ol class="ascii-key-list">
{% for m in msgs %}<li>{{ m.text }}</li>
{% endfor %}</ol>
<p><strong>Lowercase, punctuation, and digits:</strong> {% for m in site.data.unplugged.ascii_fixed.decimal_more.messages %}{{ m.text }}{% unless forloop.last %} / {% endunless %}{% endfor %}</p>
</section>
