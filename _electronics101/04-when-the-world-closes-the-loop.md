---
layout: lesson
title: "Photoresistor"
pathway: electronics101
order: 4
source: original
---

Build circuit 7 before reading past the figure.

<figure id="diagram-7">
  <img src="{{ '/assets/img/electronics101/diagram-7.jpg' | relative_url }}" alt="Diagram 7: a breadboard with a 5V power supply, an LED, and a photoresistor.">
  <figcaption>Diagram 7: Breadboard and photoresistor</figcaption>
</figure>

## A resistor the world turns

A potentiometer, from a couple of lessons back, is a resistor a person
turns with a knob. A photoresistor is the same idea with a different hand
on the dial: its resistance changes with the light falling on it, higher in
the dark, lower in bright light. Wire it in place of a fixed resistor and
you've built a light sensor out of a component with no electronics inside
it at all.

Cover the photoresistor and watch the LED's brightness change, the same way
turning the potentiometer changed brightness in lesson 2. Nothing about the
math is different — it's still current set by resistance, Ohm's law from
lesson 1 still holds at every instant. The only thing that changed is who,
or what, is adjusting the resistance: you, with a knob; the room, with its
light level.

That's the last piece of the pattern this whole sequence has been
building: a switch is a break in the loop a *person* controls. A
photoresistor is a break in the loop the *world* controls. Next lesson,
you'll build one a *program* controls.

## Questions

1. If you wanted the LED to get brighter as the room gets darker instead of
   dimmer, what would need to change in the circuit?
