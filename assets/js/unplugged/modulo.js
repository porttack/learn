// Core modulo math, shared by every page in this family.
//
// DOM-free on purpose: tools/check_modulo.mjs imports this in Node to verify
// every fixed worksheet and a few hundred generated puzzles.
//
// JavaScript's own `%` keeps the sign of the FIRST number (-3 % 10 === -3 in
// plain JS). Python's `%` keeps the sign of the SECOND number instead
// (-3 % 10 === 7 in Python), which matches the clock picture students use on
// this site: counting backward past 0 always wraps around to a positive
// spot, never a negative one. pymod() below implements Python's rule so the
// site's answer keys match what a student sees if they type the same
// expression into an actual Python interpreter.

// Python-style modulo: result always has the same sign as `n` (matches
// Python's `%`, not JavaScript's built-in `%`).
export function pymod(a, n) {
  return a - n * Math.floor(a / n);
}

// Python-style floor division (Python's `//`).
export function pyfloordiv(a, n) {
  return Math.floor(a / n);
}

// Where you land counting forward `steps` places from `start` on a clock
// with `n` positions (0 .. n-1), wrapping past n-1 back to 0.
export function stepForward(n, start, steps) {
  return pymod(start + steps, n);
}

// Where you land counting backward instead. Rewinding past 0 wraps around
// to n-1, the same way a real clock's hour hand would.
export function stepBackward(n, start, steps) {
  return pymod(start - steps, n);
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- Check digits -----------------------------------------------------------
//
// A simplified version of the check-digit rule real barcodes (like UPC) use:
// walk the data digits left to right, alternately weighting each one by 3
// and by 1 starting with 3, add them up, and the check digit is whatever
// makes the total a multiple of 10.

export function checkDigit(dataDigits) {
  let sum = 0;
  dataDigits.forEach((d, i) => {
    sum += d * (i % 2 === 0 ? 3 : 1);
  });
  return pymod(10 - pymod(sum, 10), 10);
}

// `fullDigits` includes the check digit as its last entry.
export function isValidCode(fullDigits) {
  const data = fullDigits.slice(0, -1);
  const check = fullDigits[fullDigits.length - 1];
  return checkDigit(data) === check;
}
