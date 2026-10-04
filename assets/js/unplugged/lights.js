// Message in lights: a = 1 ... z = 26 as five binary "lights" (16 8 4 2 1),
// as in Count the Dots Part 5. DOM-free so tools/check_lights.mjs can test it.

export const PLACES = [16, 8, 4, 2, 1];

// Symbol pairs for lit (1) and dark (0). Plain text glyphs, not emoji, so
// they print the same in black and white everywhere.
export const THEMES = {
  lights: { label: "Lights (● on, ○ off)", on: "●", off: "○" },
  stars: { label: "Stars (★ / ☆)", on: "★", off: "☆" },
  boxes: { label: "Boxes (☑ / ☐)", on: "☑", off: "☐" },
  triangles: { label: "Triangles (▲ / ▽)", on: "▲", off: "▽" },
  // The funny ones (emoji; they print fine in black and white).
  pizza: { label: "Pizza = 1, broccoli = 0", on: "\u{1F355}", off: "\u{1F966}" },
  pets: { label: "Dog = 1, cat = 0", on: "\u{1F436}", off: "\u{1F431}" },
  sleepy: { label: "Awake = 1, asleep = 0", on: "\u{1F600}", off: "\u{1F634}" },
  thumbs: { label: "Thumbs up = 1, down = 0", on: "\u{1F44D}", off: "\u{1F44E}" },
  sky: { label: "Sun = 1, moon = 0", on: "\u2600\uFE0F", off: "\u{1F319}" },
};

// "c" -> [0, 0, 0, 1, 1]
export function letterBits(ch) {
  const n = ch.toLowerCase().charCodeAt(0) - 96;
  if (n < 1 || n > 26) throw new Error(`"${ch}" is not a letter`);
  return PLACES.map((p) => (n & p ? 1 : 0));
}

export function bitsToLetter(bits) {
  const n = bits.reduce((t, b, i) => t + (b ? PLACES[i] : 0), 0);
  if (n < 1 || n > 26) throw new Error(`${bits.join("")} is not a letter code`);
  return String.fromCharCode(96 + n);
}

// One row per character; spaces stay spaces.
export function encodeMessage(text) {
  return [...text.toLowerCase()].map((ch) => (ch === " " ? null : { ch, bits: letterBits(ch), n: ch.charCodeAt(0) - 96 }));
}

export function decodeRows(rows) {
  return rows.map((r) => (r === null ? " " : bitsToLetter(r.bits))).join("");
}
