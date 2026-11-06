// TurtleLab: what happens when the shark eats a visitor that was clicked (the fish in fish.js, the boat in boat.js).
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The visitor stops where it is, and the shark swims out of the can to it (Trash.hunt), chomps it, and swims home. This is only the glue
// between the two: the swimming is the shark's, and the visitor only has to spin down when the jaws close on it and then be taken off the page.

/** How long the eaten thing takes to spin and shrink away under the shark's jaws, in milliseconds (the stylesheet's visitor-eaten). */
export const OVER_MS = 480;

/**
 * Send the shark after a visitor.
 * @param {object} options
 * @param {HTMLElement} options.el the visitor's picture, where it was clicked (it is not moved: the shark comes to it)
 * @param {import('./trash.js').Trash} options.trash the can with the shark
 * @param {() => void} options.onDone called once the shark is home again (or at once if there was no shark to send)
 * @param {(fn: () => void, ms: number) => unknown} [options.setTimer]
 * @returns {boolean} whether the shark went
 */
export function eatVisitor({ el, trash, onDone, setTimer = (fn, ms) => setTimeout(fn, ms) }) {
  const box = el.getBoundingClientRect();
  const target = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  trash.setPeek(false);
  trash.look(null);
  const svg = el.querySelector?.('svg');
  const went = trash.hunt(target, {
    meal: svg ? { node: svg.cloneNode(true), width: box.width, height: box.height } : null, // (a picture of it, in case the shark is sick later)
    onBite: () => {
      el.classList.add('eaten');
      setTimer(() => el.remove(), OVER_MS);
    },
    onDone,
  });
  if (!went) onDone();
  return went;
}
