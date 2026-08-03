---
layout: lesson
title: "Voltage and current"
pathway: electronics101
order: 1
source: original
---

Build circuits 1 and 2 from the printed diagrams before reading past the
figures. Get every meter reading matching, then come back here.

<figure id="diagram-1">
  <img src="{{ '/assets/img/electronics101/diagram-1.jpg' | relative_url }}" alt="Diagram 1: five small circuits — a single AA battery with a voltmeter, two AA batteries wired in parallel, two AA batteries wired in series, a battery with one resistor, and a battery with two resistors in series, each with a voltmeter attached.">
  <figcaption>Diagram 1: Voltage — five circuits, one AA battery each unless noted</figcaption>
</figure>

<figure id="diagram-2">
  <img src="{{ '/assets/img/electronics101/diagram-2.jpg' | relative_url }}" alt="Diagram 2: the same resistor circuits from diagram 1, now read with ammeters instead of voltmeters, plus a fourth circuit with two resistors and two ammeters.">
  <figcaption>Diagram 2: Ammeter — the same circuits, measured a different way</figcaption>
</figure>

## Voltage is measured across, current is measured through

That's the whole difference between these two diagrams. Same batteries,
same resistors, same layout — diagram 1 puts a meter *across* something,
diagram 2 puts a meter *in the path* of something.

Look at what that difference does to the readings. In diagram 1, two AA
batteries in parallel still read 1.50 V — adding a second cell in parallel
gives you more current capacity, not more voltage. Wired in series instead,
the same two cells read 3.00 V. Voltage sources add when you stack them
end to end; they don't add when you just wire them side by side.

The last two circuits in diagram 1 put one resistor, then two resistors in
series, across a battery. The two-resistor circuit reads 1.12 V — less than
the battery's 1.50 V. That's not a meter error. Getting to the bottom of
that number is the point of this lesson.

## Same circuit, other meter

Diagram 2 rebuilds the one-resistor and two-resistor circuits from diagram
1, but swaps the voltmeter for an ammeter. The one-resistor circuit
(300 Ω) reads 4.99 mA. The two-resistor circuit (100 Ω + 200 Ω) also reads
4.99 mA on *both* ammeters — one on either side of the two resistors.

Sit with that for a second: the current is the same everywhere in that
loop, on both sides of both resistors. Current doesn't get "used up" as it
flows past a resistor — voltage does.

<aside class="callout challenge" markdown="1">
**OHM'S LAW**

Three quantities describe every circuit here: voltage (V, in volts), current
(I, in amps), and resistance (R, in ohms). They're related by

> V = I × R

Check it against the numbers already on the page. The one-resistor circuit
in diagram 2 has a 300 Ω resistor and reads 4.99 mA (0.00499 A) across a
1.50 V battery:

> 1.50 V ÷ 300 Ω = 0.005 A = 5 mA

That's the meter's 4.99 mA, off only by simulator rounding. Ohm's law didn't
just describe the circuit after the fact — it predicted the photograph.

Now use it on the two-resistor circuit. Both resistors carry the same
4.99 mA (you measured that above). What voltage should each one drop?

> V = I × R = 0.00499 A × 100 Ω ≈ 0.499 V
>
> V = I × R = 0.00499 A × 200 Ω ≈ 0.998 V

Diagram 2's voltmeters read 499 mV and 998 mV — matching. And 0.499 V +
0.998 V ≈ 1.50 V, the full battery voltage, split between the two
resistors in proportion to their resistance. That's the 1.12 V from
diagram 1 explained: a two-resistor divider never gives you back the full
supply voltage on either resistor alone.
</aside>

## Questions

1. Two batteries in parallel and two batteries in series both use two AA
   cells. Why doesn't the parallel pair read 3.00 V too?
2. The two-resistor circuit had the *same* current through both resistors
   but *different* voltages across them. Could a circuit ever have the same
   voltage across two different resistors instead? What would that take?
