---
title: "Secret Messages in ASCII"
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

Want the whole table, with lowercase letters and punctuation too? See the
[full ASCII / Hex table]({{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}).

<section class="answer-key">
<h2>Answer key</h2>
<ol class="ascii-key-list">
{% for m in msgs %}<li>{{ m.text }}</li>
{% endfor %}</ol>
</section>
