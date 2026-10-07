---
layout: minimal
title: "Emoji Code List"
permalink: /cs50-psets/emoji-list/
---

<p><a href="{{ '/cs50-psets/emojize/' | relative_url }}">&larr; Back to Emojize</a></p>

# Emoji Code List

Every code and alias the `emoji` package understands, for the
[Emojize]({{ '/cs50-psets/emojize/' | relative_url }}) problem set.
CS50's own version of this list lives at carpedm20.github.io/emoji,
which the school firewall blocks, so this is the same data hosted here
instead, generated straight from the `emoji` package itself.

<div class="emoji-list-widget">
  <label for="emoji-list-search">Search by name (try "cat", "thumbs", or "pizza"):</label>
  <input type="text" id="emoji-list-search" autocomplete="off" placeholder="e.g. cat">
  <p class="emoji-list-status" id="emoji-list-status"></p>
  <div id="emoji-list-results"></div>
</div>

<p class="emoji-list-print" markdown="1">
*(This list only works on the live site, not on paper. Visit this page
in a browser to search it.)*
</p>

<aside class="callout note" markdown="1">
**NOTE**

The "Code" column is what goes between the colons, like
`:thumbs_up:`. Some emoji have one or more shorter "Aliases" too,
and either one works with `emojize`.
</aside>

<script src="{{ '/assets/js/emojize-demo.js' | relative_url }}" defer></script>
