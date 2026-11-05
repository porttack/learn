// TurtleLab: how the turtle on the screen looks while it works. The shell takes the pen's color, and when the pen is up the
// turtle hovers.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The turtle's picture is the one from artwork.js (Sugar Labs' turtle, see NOTICE.md), left exactly as it is there. This file
// only marks four parts of it so the stylesheet can move and color them: the big oval of the shell (`shell`), the markings on it
// (`scutes`), the front right flipper (`wave-flipper`), which waves when a program has finished, and the front left one
// (`scratch-flipper`), which scratches the turtle's head when it has been left alone a while. The page then sets two CSS variables on the sprite, --shell and --scute, from the pen's color (see CanvasView.sync).
// The turtle in a PDF is not tinted: it is stamped from the plain picture, so it looks the same whatever the pen was.

import { turtleSvg } from './artwork.js';
import { toHex } from '../core/color.js';

// The two places in the picture's text. If the picture is ever changed these stop matching, and a test says so.
const SHELL = '<path d="M 43.102 30.421';
const SCUTES = '<g><path d="M 27.501 41.551';
const FLIPPER = '<path d="M 40.16 11.726'; // the flipper at the front on the turtle's right
const SCRATCHER = '<path d="M 19.026 15.437'; // and the one at the front on its left

/** The turtle's picture with its shell and the markings on it named, so they can be colored from the stylesheet. */
export function spriteSvg() {
  const plain = turtleSvg();
  if (![SHELL, SCUTES, FLIPPER, SCRATCHER].every((part) => plain.includes(part))) throw new Error('The turtle picture changed: update turtle-look.js.');
  return plain
    .replace(SHELL, '<path class="shell" d="M 43.102 30.421')
    .replace(SCUTES, '<g class="scutes"><path d="M 27.501 41.551')
    .replace(FLIPPER, '<path class="wave-flipper" d="M 40.16 11.726')
    .replace(SCRATCHER, '<path class="scratch-flipper" d="M 19.026 15.437');
}

/** How bright a color is, 0 (black) to 1 (white), the way the eye sees it. */
function brightness([r, g, b]) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Mix a color toward black or white by `amount` (0 to 1). */
function mix([r, g, b], toward, amount) {
  return [r, g, b].map((c) => Math.round(c + (toward - c) * amount));
}

/**
 * The shade a color breathes out to, while the turtle breathes (see `setColorBreathing`): a lighter, less deep one of the same color, 40% of the way to
 * white. A color that is already very light cannot get lighter, so it breathes to a deeper one instead (30% of the way to black). It is always still a
 * color (never see-through), and the true color is the other end of the breath.
 */
function breathOut(color) {
  return brightness(color) > 0.7 ? mix(color, 0, 0.3) : mix(color, 255, 0.4);
}

/**
 * The colors for the shell and its markings from the pen's color: the shell is the pen's color, and the markings are
 * a shade of it, darker if the pen is a light color and lighter if it is a dark one, so they always show. `shellBreath` and `scuteBreath` are the
 * shades each of those breathes out to.
 * @param {number[]} pen red, green and blue, each 0 to 255
 * @returns {{ shell: string, scute: string, shellBreath: string, scuteBreath: string }} CSS colors
 */
export function shellColors(pen) {
  const dark = brightness(pen) <= 0.45;
  const scute = dark ? mix(pen, 255, 0.55) : mix(pen, 0, 0.5);
  return { shell: toHex(pen), scute: toHex(scute), shellBreath: toHex(breathOut(pen)), scuteBreath: toHex(breathOut(scute)) };
}
