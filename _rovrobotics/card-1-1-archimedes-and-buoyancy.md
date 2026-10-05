---
title: "Card 1.1: Archimedes and Buoyancy"
order: 12
source: original
unit: "1. Water Physics"
status: Ready
solo: true
duration: "1 wk"
organizer: /rovrobotics/card-1-1-worksheet/
organizer_label: "Worksheet"
slides: /rovrobotics/card-1-1-intro-slides/
slides_label: "Card 1.1 slides"
---

**Format:** Resource + bench challenge | **Time:** 40 minutes | **Prerequisites:** None. First science card of the year.

## Core Question

A steel ship floats. A steel bolt sinks. Same material, opposite fates. What actually decides whether something floats, sinks, or hovers, and how do we make a robot do the third one on purpose?

## Resource (~10 minutes)

Archimedes' principle, one sentence: water pushes up on a submerged object with a force equal to the weight of the water that object displaces. Read it carefully, because the principle is about the WATER's weight, not the object's. Push a basketball underwater and the upward shove you feel is the weight of a basketball's worth of water, roughly 7 kilograms of force, trying to reclaim its space. The ocean does not know or care what the object is made of; it only knows how much room the object takes up.

So floating is a contest between two numbers: the object's weight pulling down, and the displaced water's weight pushing up. The bolt loses because solid steel weighs about eight times more than the water it displaces. Shape the same steel into a hollow hull and the contest flips: the hull is mostly enclosed air, so it displaces an enormous volume of water while weighing less than that volume of water weighs.

<figure id="fig-ship-bolt">
  <img src="{{ '/assets/img/rovrobotics/fig-ship-bolt.svg' | relative_url }}" alt="A small steel bolt resting on the bottom of a tank, with a short buoyant-force arrow and a long weight arrow, next to a hollow steel hull floating at the surface, with a weight arrow and a buoyant-force arrow of matching length">
  <figcaption>Same material, opposite fates: the contest is decided by displaced volume, not what the object is made of</figcaption>
</figure>

Between sinking and floating lies the state this class cares about most: neutral buoyancy, where the two numbers exactly tie and the object hovers, weightless, at whatever depth you put it. Every ROV wants this, because a robot that naturally hovers spends its thruster power on the mission instead of on fighting its own weight.

The working tool falls straight out of the numbers. Fresh water weighs one gram per cubic centimeter. Therefore every cubic centimeter of displacement buys exactly one gram of upward force. A 5,000 cm³ robot hovers at 5,000 grams, floats below that, sinks above it. Trimming a robot stops being mystical: measure the volume, do the subtraction, add foam or lead until the ledger balances. You will do this arithmetic for real, first on parts small enough to hold in your hand, eventually on a 15-kilogram robot where guessing wrong costs a pool day.

## See It Before You Touch It

<figure id="fig-buoyancy-states">
  <img src="{{ '/assets/img/rovrobotics/fig-buoyancy-states.svg' | relative_url }}" alt="Three tanks side by side: in the first a submerged object sinks because weight is greater than buoyant force, in the second it hovers at a dashed line because the two forces are equal, in the third it rises and floats because weight is less than buoyant force">
  <figcaption>The same fully submerged object in three states: only the ballast changes</figcaption>
</figure>

<div class="buoy-demo" id="buoy-demo" role="group" aria-label="Buoyancy demo: drag the ballast slider and watch the sealed float sink, hover, or rise">
  <svg class="buoy-tank" viewBox="0 0 180 160" aria-hidden="true">
    <rect class="buoy-water" x="0" y="0" width="180" height="160"/>
    <line class="buoy-hover-line" x1="0" y1="80" x2="180" y2="80"/>
    <circle class="buoy-object" id="buoy-object" cx="90" cy="80" r="18"/>
  </svg>
  <div class="buoy-controls">
    <label for="buoy-ballast">Ballast: <span id="buoy-ballast-val">250</span> g</label>
    <input type="range" id="buoy-ballast" min="0" max="500" value="250" step="10">
    <p class="buoy-readout">
      Sealed float: <strong>500 cm³</strong>, so buoyant force is a fixed <strong>500 g</strong> of lift, no matter how deep it goes.
      Shell weighs <strong>50 g</strong>. Total weight right now: <strong><span id="buoy-total">300</span> g</strong>.
    </p>
    <p class="buoy-state" id="buoy-state"></p>
  </div>
</div>

Drag the ballast slider. Notice the buoyant-force number never moves, only the ballast does, because the float's volume never changes. That fixed number is the entire reason a rigid sealed float behaves the same at 1 meter as it does at 30: depth changes the pressure squeezing the water, not the volume of water a rigid shell pushes out of the way.

<script>
(function () {
  var slider = document.getElementById('buoy-ballast');
  if (!slider) return;
  var val = document.getElementById('buoy-ballast-val');
  var total = document.getElementById('buoy-total');
  var state = document.getElementById('buoy-state');
  var object = document.getElementById('buoy-object');
  var SHELL = 50, BUOYANT = 500;

  function render() {
    var ballast = parseInt(slider.value, 10);
    var weight = SHELL + ballast;
    var net = BUOYANT - weight;
    val.textContent = ballast;
    total.textContent = weight;
    var cy = 80 - net * 0.22;
    if (cy < 24) cy = 24;
    if (cy > 136) cy = 136;
    object.setAttribute('cy', cy);
    if (Math.abs(net) <= 15) {
      state.innerHTML = 'Net force: about 0 g — <strong>hovers</strong>';
    } else if (net > 0) {
      state.innerHTML = 'Net force: ' + net + ' g up — <strong>rises and floats</strong>';
    } else {
      state.innerHTML = 'Net force: ' + (-net) + ' g down — <strong>sinks</strong>';
    }
  }
  slider.addEventListener('input', render);
  render();
})();
</script>

## Bench Challenge (team, ~20 minutes)

Before you touch anything, open your artifact doc (see below) and write your prediction: a sealed object hovers, neutrally buoyant, at 1 meter deep. We move it to 3 meters and release it. Does it stay, rise, or sink? Write your answer AND your reasoning using the two-number contest above. Then a second prediction: does your answer change if the object is a sealed rigid box versus a soft air-filled bag? You will test both ideas against the slider's logic above, and defending or revising your written prediction is part of the oral check.

Each team gets a handful of real parts: a scrap of PVC, a thruster or motor, a bolt or other fastener, and a couple more the teacher hands out. For each part:

1. Weigh it (grams).
2. Measure its volume by water displacement in the 9-inch bin: submerge it fully and read off how much water it displaces (1 mL = 1 cm³).
3. Calculate its buoyant force: volume × 1 g/cm³.
4. Calculate net force: buoyant force minus weight. Predict: sinks, floats, or close to neutral.
5. Drop it in the bin and check your prediction against what actually happens.

Record every part in one table: Part, Weight (g), Volume (cm³), Buoyant force (g), Net force (g), Prediction, Actual. Which part surprised you most? If you capped both ends of the PVC scrap and sealed the air inside, would its row change? Why?

## Written Artifact

Create one Google Doc for this card. Put in it:

1. Your prediction and reasoning from the Bench Challenge's first step, written before you touched anything.
2. Your measurement table: every part's weight, volume, buoyant force, net force, prediction, and actual result.
3. Two sentences: why does a steel ship float? Use the word "displaces."
4. One sentence: our float (Ebirah) changes its buoyancy without adding or removing any weight. Based on today, what MUST it be changing instead?

Share the doc with your teacher, by email or your class's online classroom, before your oral check.

Prefer paper? There's an optional [printable worksheet]({{ '/rovrobotics/card-1-1-worksheet/' | relative_url }}) with the same four items. Fill it out by hand and bring it to your oral check instead of sharing a doc.

## Clearing This Card

Share the doc above (or bring your filled-out worksheet), plus a 90-second oral check: your teacher (or a student who has already cleared this card) hands you a part's weight and volume, you calculate whether it floats or sinks and by how much net force. Example: "This part weighs 180 g and displaces 220 cm³ of water. Does it float or sink, and what's the net force?"

## If You Miss This Class

The bins, parts, and scale stay available for two weeks. Run the challenge solo or with any cleared student, then same artifact doc and oral check.

## Why This Matters for Competition

Buoyancy and ballast is a named section of the MATE technical documentation, and neutral trim is the difference between a robot that flies and one that fights you through every mission task. The 1 gram per cm³ tool from today is the same math the team uses to trim Godzillah, and question 4 is the entire operating principle of the float you will tune this season.
