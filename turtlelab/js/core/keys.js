// The keys a `when [key] pressed` block can listen for: the four arrows, space, enter, the letters a to z and the digits 0 to 9.
//
// A key is kept as a short id ('up', 'space', 'a', '7'). Each has a label for the block's dropdown, the name the browser gives it
// (KeyboardEvent.key) and the name Python's turtle module gives it (onkeypress). Boxes hold numbers only, so a program cannot ask
// "which key was it?": there is a hat for each key it listens for.

const NAMED = [
  { id: 'up', label: 'up arrow', event: 'ArrowUp', python: 'Up', logo: 'up' },
  { id: 'down', label: 'down arrow', event: 'ArrowDown', python: 'Down', logo: 'down' },
  { id: 'left', label: 'left arrow', event: 'ArrowLeft', python: 'Left', logo: 'left' },
  { id: 'right', label: 'right arrow', event: 'ArrowRight', python: 'Right', logo: 'right' },
  { id: 'space', label: 'space', event: ' ', python: 'space', logo: 'space' },
  { id: 'enter', label: 'enter', event: 'Enter', python: 'Return', logo: 'enter' },
];

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => ({ id: letter, label: letter, event: letter, python: letter, logo: letter }));
const DIGITS = '0123456789'.split('').map((digit) => ({ id: digit, label: digit, event: digit, python: digit, logo: digit }));

export const KEYS = Object.freeze([...NAMED, ...LETTERS, ...DIGITS]);
export const DEFAULT_KEY = 'up';

const BY_ID = new Map(KEYS.map((key) => [key.id, key]));
const BY_EVENT = new Map(KEYS.map((key) => [key.event, key]));

/** True for the id of a key (a block read from a file may hold anything). */
export function isKey(id) {
  return typeof id === 'string' && BY_ID.has(id);
}

/** The id itself if it is a key, otherwise the default. */
export function cleanKey(id) {
  return isKey(id) ? id : DEFAULT_KEY;
}

/** The key with this id (the default if there is no such key). */
export function keyOf(id) {
  return BY_ID.get(cleanKey(id));
}

/** The id of the key a keyboard event was for, or null if it is not one a block can listen for (Shift, F5, a symbol...). */
export function keyIdFromEvent(event) {
  const name = typeof event?.key === 'string' && event.key.length === 1 ? event.key.toLowerCase() : event?.key;
  return BY_EVENT.get(name)?.id ?? null;
}
