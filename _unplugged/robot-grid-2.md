---
title: "Robot grid 2: loops and procedures"
source: original
level: hs
kind: [single, supplementary]
topics: [Robot programs]
time: 30
grouping: Solo, then compare with a partner
materials: "Pencil"
generator: /unplugged/robot-grid-generator/
scripts: [/assets/js/unplugged/robot-page.js]
---

Real programs don't write `MOVE_FORWARD ()` six times in a row. This set adds `REPEAT n TIMES` and procedures with a parameter, the two shortcuts the AP exam uses most. The trick is the same as before: follow the code one step at a time, and count every time around a loop.

{% include unplugged/robot-rules.html %}

Work each question on paper first. Trace the robot's moves with your pencil
right on the grid, one line of code at a time.

<noscript><p class="callout warning">This worksheet draws its grids with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div class="robot-questions" id="q-robot_2"></div>

Want more? [Make a new set of robot questions]({{ '/unplugged/robot-grid-generator/' | relative_url }}).

<section class="answer-key robot-answer-key" id="key-robot_2"></section>

<script type="application/json" data-robot-set data-questions="#q-robot_2" data-key="#key-robot_2">{{ site.data.unplugged.robot_2.questions | jsonify }}</script>

