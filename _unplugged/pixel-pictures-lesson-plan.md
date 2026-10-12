---
title: "Pixel Pictures: lesson plan"
source: original
level: ms
companion: true
name_line: false
standards_locator: pixel-pictures
standards_open: true
---

A short teacher-led plan for [Pixel Pictures]({{ '/unplugged/pixel-pictures/' | relative_url }}):
how a computer turns a black-and-white picture into numbers, and how a fax
machine squeezes those numbers down. About **50 minutes**. Leaving it for a
sub? Use the box below.

{% include unplugged/sub-box.html
   sheet="/unplugged/pixel-pictures-how-to/"
   sheet_label="instructions"
   sheet_no_name=true
   sheet_note="Then hand out [Decode & Encode](/unplugged/pixel-pictures/) and [Make Your Own](/unplugged/pixel-pictures-make-your-own/) right behind it, in that order. Names go on those two; nothing needs to be stapled."
   collect="Decode & Encode and Make Your Own from every student, plus at least one keep-going sheet from anyone who got that far (its Set # shows it's their own work, not a copy of a neighbor's). The instructions sheet doesn't need to come back"
   before_sub_day="**Before the sub day (teacher, or whoever preps the sub folder):** print one copy of each sheet per student: (1) [Instructions](/unplugged/pixel-pictures-how-to/), (2) [Decode & Encode](/unplugged/pixel-pictures/), (3) [Make Your Own](/unplugged/pixel-pictures-make-your-own/). Then print the keep-going set: a ready [class set of 30](/unplugged/pixel-pictures-generator/?copies=30&per=2) already has 30 different puzzles built in, two pages each (front and back), so print that one large page once for the whole class, not once per student. Different class size? Open the [New set page](/unplugged/pixel-pictures-generator/) and change **Copies** there instead."
   slides="/unplugged/pixel-pictures-slides/"
   slides_stop="On Your Sheet"
   go="pixel"
   generator="/unplugged/pixel-pictures-generator/"
   class_size="30"
   keep_going="new set of mystery pictures to decode"
   say="Today you're learning how a computer stores a picture as numbers. Read the first sheet, then follow the rule on your own. Shade lightly in pencil first." %}

## Students will be able to

- Explain that a picture on a screen is a grid of pixels, stored as numbers.
- Decode and encode a black-and-white picture with run-length encoding.
- Say when this kind of compression saves space and when it doesn't.

## Before class

- Print one copy of each sheet per student, handed out in order: (1)
  [Instructions]({{ '/unplugged/pixel-pictures-how-to/' | relative_url }}),
  (2) [Decode & Encode]({{ '/unplugged/pixel-pictures/' | relative_url }}),
  (3) [Make Your Own]({{ '/unplugged/pixel-pictures-make-your-own/' | relative_url }}).
  Only the second two come back from students, so there's no need to staple
  all three together.
- Print the keep-going set once for the whole class, not once per student:
  a ready [class set of 30]({{ '/unplugged/pixel-pictures-generator/?copies=30&per=2' | relative_url }})
  already has 30 different puzzles built in, two pages each (front and
  back). Different class size? Open the
  [New set page]({{ '/unplugged/pixel-pictures-generator/' | relative_url }}) and change **Copies** there.
- Have any photo ready to project, or use the [slides]({{ '/unplugged/pixel-pictures-slides/' | relative_url }}) instead.

## The lesson

### 1. Hook (5 minutes)

Project a photo and zoom in until the squares show. Ask: *"What's under
the squares?"* (Nothing. Every picture is just a grid of pixels.) Then:
*"A computer can only store numbers. How could it store this?"*

### 2. The sheets (25 minutes)

Students read the rule on the first sheet, then decode and encode on the
second. Walk the room: the most common mistake is forgetting that every
row starts with a **white** count, even when that count is 0.

When most students reach the third sheet, **Make your own**, pair them up
to trade and decode each other's pictures.

### 3. Keep going (as students finish)

Hand out keep-going sheets. Nobody sits idle and nothing is optional.
Collect at least one from anyone who gets this far, along with their other
two sheets.

### 4. Wrap-up (5 minutes)

Ask: *"Why does a picture with big blocks of one color shrink a lot, and
a checkerboard hardly at all?"* (Long runs need few numbers; a
checkerboard changes color every pixel.)

## Going further

- **6th grade, first time through:** the three sheets are already sized for
  this group. If time is short, cut **Your partner's pictures** rather than
  **Make your own**: drawing and encoding their own picture is where the
  idea actually clicks.
- **9th grade or faster finishers:** after all three sheets, hand out
  [Pixel Pictures: how much do you save?]({{ '/unplugged/pixel-pictures-compression/' | relative_url }}).
  It has them count the numbers their own completed codes actually used and
  work out a real compression ratio, instead of taking "it saves space" on
  faith.
- **AP CSP:** this activity is lossless compression (nothing is thrown
  away; the exact picture comes back). Use the down arrow on the slides'
  **On Your Sheet** slide, or just ask in discussion: a real photo has
  thousands of colors, so what would a computer have to give up to compress
  one the same way? That trade-off is lossy compression (JPEG), and it's a
  useful contrast to draw before or after the AP exam's data compression
  questions.

[Text Compression]({{ '/unplugged/text-compression/' | relative_url }}) uses
the same idea (store the pattern, not every piece) for words instead of pixels.

{% include standards-alignment.html %}
