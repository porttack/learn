---
title: "Robot grid 3: sensing with CAN_MOVE"
source: original
level: hs
kind: [single, supplementary]
topics: [Robot programs]
time: 30
grouping: Solo, then compare with a partner
materials: "Pencil"
scripts: [/assets/js/unplugged/robot-page.js]
generator: /unplugged/robot-grid-generator/
generator_presets:
  - { label: "CAN_MOVE", query: "level=challenge" }
  - { label: "Loops and procedures", query: "level=ap" }
  - { label: "Moves and turns", query: "level=starter" }
---

Now the robot can look before it moves. `CAN_MOVE` and `REPEAT UNTIL` let one program handle many different grids, but they also let a program get stuck, crash, or walk right past the goal. For each program, work out what really happens, not what the programmer hoped would happen.

{% include unplugged/robot-rules.html %}

Work each question on paper first. Trace the robot's moves with your pencil
right on the grid, one line of code at a time.

<noscript><p class="callout warning">This worksheet draws its grids with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div class="robot-questions" id="q-robot_3"></div>


<section class="answer-key robot-answer-key" id="key-robot_3"></section>

<script type="application/json" data-robot-set data-questions="#q-robot_3" data-key="#key-robot_3">{{ site.data.unplugged.robot_3.questions | jsonify }}</script>

