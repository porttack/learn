---
title: "Robot grid 1: moves and turns"
source: original
level: both
kind: [single, supplementary]
topics: [Robot programs]
time: 30
grouping: Solo, then compare with a partner
materials: "Pencil"
scripts: [/assets/js/unplugged/robot-page.js]
generator: /unplugged/robot-grid-generator/
generator_presets:
  - { label: "Moves and turns", query: "level=starter" }
  - { label: "Loops and procedures", query: "level=ap" }
  - { label: "CAN_MOVE", query: "level=challenge" }
---

On the AP CSP exam, a robot on a grid gets used to test whether you can read code exactly the way a computer does. Nothing here needs a computer. You just need to keep track of where the robot is and which way it's facing. This first set uses only three commands: move, turn left, and turn right.

{% include unplugged/robot-rules.html %}

Work each question on paper first. Trace the robot's moves with your pencil
right on the grid, one line of code at a time.

<noscript><p class="callout warning">This worksheet draws its grids with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div class="robot-questions" id="q-robot_1"></div>


<section class="answer-key robot-answer-key" id="key-robot_1"></section>

<script type="application/json" data-robot-set data-questions="#q-robot_1" data-key="#key-robot_1">{{ site.data.unplugged.robot_1.questions | jsonify }}</script>

