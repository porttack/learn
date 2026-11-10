---
layout: minimal
title: "Project 2.4 worksheet answer key"
permalink: /pico/project2-4-worksheet-key/
sitemap: false
---

# Project 2.4 worksheet answer key

For the [Project 2.4 worksheet](/pico/project2-4-worksheet/).

**A. Plan.** Answers vary. Check that each row is one frame, that each frame has a letter for all 8 columns, and that the key names every letter.

**B. Reading frames.** There are **4** frames, and each frame has **8** colors. `frames[1][1]` is **R**. `frames[2][5]` is **G**. In frame 3, pixel 3 is **red** and pixel 4 is **green**; the rest are off. `frames[4][0]` raises an **IndexError**: the valid frame numbers are 0 to 3, so there is no frame 4. `frames[0][8]` raises an **IndexError** too: the valid pixel numbers are 0 to 7, so there is no pixel 8.

**C. The loop inside a loop.** The line runs **32** times (4 frames times 8 pixels). `np.write()` runs **4** times, once per frame. It goes after the inner loop because the stick should change only once the whole frame is set; inside the inner loop it would send the frame to the strip 8 times and the pixels would change one at a time.

**D. Scrubbing.** The legal frame numbers are **0, 1, 2 and 3**. A frame number of 4 is an **IndexError**, because there is no `frames[4]`. Fixes include scaling by `len(frames) - 1` instead of `len(frames)`, or using `min()` to hold the number at `len(frames) - 1`.

**E. Your own.** Answers vary; the position must be two indexes in the right order, frame first and pixel second, and match the grid. For the reflection, look for the word *frame* for one list of 8 colors and *index* used twice, once for the frame and once for the pixel, so `frames[f][i]` finds one color.
