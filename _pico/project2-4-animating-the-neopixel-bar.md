---
layout: lesson
title: "Project 2.4: Animating the NeoPixel Bar"
pathway: pico
order: 111
chapter: "p2.4"
standards_carrier: picoprojects
project: 2
project_part: 4
label: "Project 2.4"
source: original
subtitle: "An animation is a list of lists, and the knob can scrub through it"
---

This is for after Project 2.3's bar is working. Keep the same wiring: the
NeoPixel stick on GP17 and the potentiometer on GP26. Nothing new to plug in
this time. The new idea is in the data.

### An animation is a list of frames

A flip book is a stack of pictures, and playing the animation just means
showing them in order. Do the same thing with the bar. Each **frame** is a
list of 8 colors, one per pixel. The animation is a list of frames.

Picture it as a grid. **Rows are moments in time, columns are pixels.** That is
the same `grid[row][col]` idea from the
[Square Grid problem set](/cs50-psets/square-grid/): to find the color of
pixel 3 during frame 5, you look in row 5, column 3, which in Python is
`frames[5][3]`. The first index picks the frame, the second index picks the
pixel.

### A starter animation

Give your colors one-letter names so the code looks like the animation it
makes. Every brightness value stays at 20 or below, the same rule as Project
2.3.

```python
R = (20, 0, 0)
OFF = (0, 0, 0)

frames = [
    [R,   OFF, OFF, OFF, OFF, OFF, OFF, OFF],   # frame 0
    [OFF, R,   OFF, OFF, OFF, OFF, OFF, OFF],   # frame 1
    # TODO: your own frames
]
```

Read down the two rows. In frame 0 the red pixel is at the start of the strip,
and in frame 1 it has moved one pixel over. You can see the movement without
running anything. Your job is to write the rest of the animation.

### Plan it on paper first

Before you type anything, sketch your animation on graph paper. Draw 8
columns, one for each pixel, and one row for each frame. Color in the squares
or write a letter in each one. A bouncing pixel, two pixels chasing each other,
and a bar that fills up and empties are all good ideas.

Then type your frames in, one row of your sketch to one line of code. If your
code has the same shape as your sketch, you are on the right track.

<aside class="callout note" markdown="1">
**EVERY FRAME NEEDS 8 COLORS**

The strip has 8 pixels, so every frame must be a list of exactly 8 colors.
Count them. A frame with 7 colors will break your program, and the error will
show up when the animation reaches that frame, not when you press Run.
</aside>

### Part A: loop it

Play your frames in order, over and over, with a short pause between them. Add
this to the setup from Project 2.3 (`np` is your `NeoPixel(Pin(17), 8)`):

```python
while True:
    # TODO: show each frame in order, one pixel at a time
    time.sleep_ms(150)
```

<aside class="callout note" markdown="1">
**HINT**

You need one loop inside another. The outer loop picks which frame, a row of
your grid, and the inner loop picks which pixel, a column. Use `len(frames)`
and `len(np)` for the two `range()`s instead of typing the numbers. Remember
that nothing on the stick changes until `np.write()` runs, and you only want to
send the finished frame to the stick once, after every pixel in it is set.
</aside>

Change the number in `time.sleep_ms()` and see what it does to the speed of
your animation. Then try adding more frames.

### Part B: scrub it with the knob

Now take the loop away. Instead of playing the frames by itself, let the
potentiometer choose which frame is showing, like dragging the slider on a
video. Turn the knob all the way one way and you see the first frame. Turn it
the other way and you see the last one, with the rest in between.

Start from the reading loop in Project 2.3, the one that builds `samples` and
works out `volts`. Then, where it used to work out `lit`, work out a frame
number instead:

```python
    frame_number = ...   # TODO: turn volts into an index into frames
```

<aside class="callout note" markdown="1">
**HINT**

It is the same scaling idea as `lit`: a voltage between 0 and 3.3 becomes a
whole number. But watch the top end. The first index is 0, so the last frame is
`frames[len(frames) - 1]`, and an index of `len(frames)` is one too far. With
the knob turned all the way up, your number must still be a legal index. Test
the extreme positions of the knob first.
</aside>

Once you have the number, copy that frame onto the strip with the same inner
loop you wrote in Part A, so the frame you see matches the knob. You will not
need the outer loop this time.

### Stretch: a history bar

Make the bar draw a graph of the last 8 readings, so you can see the knob's
recent past. Keep a list of the most recent readings, and each time through the
loop add the newest one to the end and remove the oldest one from the front:

```python
history = [0] * 8          # starts full of zeros, so it is always 8 long

# inside the loop, after you work out volts:
history.append(volts)      # newest reading goes on the end
history.pop(0)             # the oldest reading comes off the front
```

Because one goes on as one comes off, the list stays 8 elements long, and
`history[0]` is always the oldest reading and `history[7]` the newest. Then
color each pixel from its own stored reading. A pixel could be brighter for a
higher voltage, or a different color for a lower one, but keep every value at
20 or below. A list that you add to at one end and take from the other is
called a queue, and you will meet queues again later.

### Troubleshooting

If you get an `IndexError`, there are two usual causes. Either one of your
frames has fewer than 8 colors, so asking for `frames[f][i]` runs off the end
of that frame, or your frame number got too big and went past the last frame in
`frames`. Print the frame number and `len(frames)` to see which. If the error
only happens at one position of the knob, it is almost always the second one.

If nothing changes on the strip, check that `np.write()` runs after the pixels
are set, and go back to Project 2.3's troubleshooting for the wiring checks.

When your animation works, move on to
[Project 2.5](/pico/project2-5-swapping-in-a-light-sensor/), an optional part
where you trade the knob for a light sensor and the same code keeps working.
