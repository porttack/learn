---
layout: lesson
title: "Color is three numbers"
pathway: turtlelessons
order: 10
source: original
---

Every color on a screen is made from three lights: **red**, **green** and **blue**. Your screen has a tiny red, a tiny green and a tiny blue light in every dot, and it makes each color by turning each light up or down.

TurtleLab's `set color` block works the same way. It takes three numbers, one for each light, from **0** (that light is off) to **255** (all the way on).

## Try it: a bar of color

Open the frame and press Run. The screen is filled with black, and the bar is drawn with the numbers `255 0 0`: red all the way up, green and blue off.

{% include turtlelab-embed.html sample="lesson-color-mix" title="A thick bar drawn with the three numbers of set color" %}

Predict the color of the bar for each set of numbers. Then change the three numbers in `set color`, press Run, and check:

1. `0 255 0`
2. `0 0 255`
3. `255 255 0` (two lights at full)
4. `255 255 255`
5. `128 128 128`
6. `0 0 0` (careful: what is behind the bar?)

Then see if you can make **orange**. It is mostly red, with some green and no blue.

<details markdown="1">
<summary>Check your answers</summary>

1. Green.
2. Blue.
3. Yellow. Red light and green light together look yellow.
4. White, all three lights at full.
5. Gray. Any color where all three numbers are equal is a gray: a low number is dark gray, a high one is light gray.
6. The bar vanishes. Black is all three lights off, and the screen behind it is black too.

For orange, try `255 128 0`.
</details>

## Why does it stop at 255?

The computer keeps each of the three numbers in **8 bits**. A bit is a switch that is either off (0) or on (1). Eight switches make a row, and each switch is worth twice the one beside it:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|

To make a number, add up the values of the switches that are on. Everything on is 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = **255**, and nothing on is **0**. That is why the biggest number is 255. It is the biggest number eight switches can make.

Write each number as eight 1s and 0s, with a space in the middle to make it easier to read:

- 255 is `1111 1111`.
- 128 is `1000 0000`, because only the 128 switch is on.
- 10 is `0000 1010`, because 8 + 2 is 10.

## Look inside the color

The colored box under the words `set color` is a **color picker**. Use **Open full size** under the frame, then press that colored box. The picker shows each light as a number, as two **hex** digits, and as eight **binary** digits, and it shows all 24 bits at the bottom. Change one and the others follow.

1. Type 10 into the red number. What binary does the picker show? Does it match your answer above?
2. Which number gives the binary `0100 0000`?
3. **Hex** uses sixteen digits, 0 to 9 and then A to F, and two hex digits hold one light. FF is 255. What color is `#FFFF00`? What color is `#00FF00`?
4. Eight bits make how many different numbers? Three lights make how many different colors?

<details markdown="1">
<summary>Check your answers</summary>

1. `0000 1010`.
2. 64, because only the 64 switch is on.
3. `#FFFF00` is yellow: red FF and green FF, blue 00. `#00FF00` is green.
4. Eight bits make 256 numbers, 0 to 255. Three lights make 256 times 256 times 256, which is 16,777,216 colors. That is 24 bits in all, which is what the picker shows at the bottom.
</details>

## A color from a box

Last, put variables and colors together. In this sample, the variable `box1` grows by 7 on every lap, and the color is made from it: red is `box1`, and blue is `255 - box1`.

{% include turtlelab-embed.html sample="spinning-squares" title="Squares whose color is made from a variable that grows each lap" %}

1. The first square is drawn after box1 becomes 7. About what are its three numbers, and which light is strongest?
2. The last square is drawn when box1 is 252. About what are its three numbers?
3. Why does `255 - box1` make blue fall exactly as red rises?

<details markdown="1">
<summary>Check your answers</summary>

1. Red 7, green 60, blue 248. Blue is the strongest, so the first square looks blue with a little purple.
2. Red 252, green 60, blue 3. Red is the strongest, so the last square looks red.
3. The two always add up to 255. When red is small, blue is big, and when red is big, blue is small.
</details>

## Make your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Draw a row of squares, or a spiral, that **fades** from one color to another. Use a variable that grows each lap, and make the color from it, as the sample does. Predict the first color and the last color before you run it.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Pick any color you like in the picker. Write its three numbers, then write each one in binary. Check your eight 1s and 0s against what the picker shows.
