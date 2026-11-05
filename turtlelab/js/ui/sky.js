// TurtleLab: the layer above everything, for things that float up off the top of the window (bubbles, the Zzz) or fall off the bottom (the
// turtle's little accident), and the plain arithmetic for how far and how long.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The layer is one fixed, window-sized piece of the page that ignores clicks and hides what leaves it, so nothing in it can be pressed,
// scroll the page or add a scrollbar. The sizes are worked out from where the thing starts, so a bubble from a turtle low on the
// paper takes longer to leave than one from high up, and moves at the same speed either way.

/** How fast things float up, in pixels a second. */
export const FLOAT_SPEED = { bubbles: 100, zzz: 85 };

/** How far it is from a starting height (pixels down from the top of the window) to just off the top, with a little extra to be sure. */
export function riseDistance(y, margin = 70) {
  return Math.max(80, y + margin);
}

/** How long a rise of this many pixels takes (seconds), at this speed, never very short and never very long. */
export function riseTime(distance, speed) {
  return Math.min(16, Math.max(2.2, distance / speed));
}

/** How far it is from a starting height down to just off the bottom of a window this tall. */
export function fallDistance(y, windowHeight, margin = 70) {
  return Math.max(60, windowHeight - y + margin);
}

/**
 * How long something takes to fall this many pixels (seconds): it speeds up the way a dropped thing does, but with a gravity so light that
 * it is a slow drop you can watch (about 3 seconds from the middle of the window; at real gravity it was under one, which was too fast).
 */
export function fallTime(distance, gravity = 120) {
  return Math.max(1.2, Math.sqrt((2 * distance) / gravity));
}

let layer = null;

/** The layer, made the first time it is asked for. */
export function sky() {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'sky';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  return layer;
}
