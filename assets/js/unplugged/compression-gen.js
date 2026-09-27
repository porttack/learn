// Generates "text compression" puzzles from a small bank of public-domain
// nursery rhymes. DOM-free: tools/check_text_compression.mjs imports this
// to verify hundreds of generated puzzles all decode correctly.
import { compress } from "./compression.js";

// Public domain nursery rhymes, punctuation written so repeated lines
// match exactly (compression only ever replaces an exact repeat).
export const RHYMES = {
  rain: {
    title: "Rain, Rain, Go Away",
    text:
      "Rain, rain, go away.\n" +
      "Come again another day.\n" +
      "Little Johnny wants to play.\n" +
      "Rain, rain, go away.",
  },
  baa: {
    title: "Baa, Baa, Black Sheep",
    text:
      "Baa, baa, black sheep,\n" +
      "Have you any wool?\n" +
      "Yes sir, yes sir,\n" +
      "Three bags full.\n" +
      "One for the master,\n" +
      "One for the dame,\n" +
      "And one for the little boy\n" +
      "Who lives down the lane.",
  },
  hickory: {
    title: "Hickory Dickory Dock",
    text:
      "Hickory dickory dock.\n" +
      "The mouse ran up the clock.\n" +
      "The clock struck one,\n" +
      "The mouse ran down.\n" +
      "Hickory dickory dock.",
  },
  row: {
    title: "Row, Row, Row Your Boat",
    text:
      "Row, row, row your boat,\n" +
      "Gently down the stream.\n" +
      "Merrily, merrily, merrily, merrily,\n" +
      "Life is but a dream.",
  },
  twinkle: {
    title: "Twinkle, Twinkle, Little Star",
    text:
      "Twinkle, twinkle, little star,\n" +
      "How I wonder what you are.\n" +
      "Up above the world so high,\n" +
      "Like a diamond in the sky.\n" +
      "Twinkle, twinkle, little star,\n" +
      "How I wonder what you are.",
  },
};

const MS_BANK = ["rain", "baa", "hickory", "twinkle"];
const HS_BANK = ["baa", "row", "hickory", "rain", "twinkle"];

// The main worksheet's own decode puzzle -- frozen into
// _data/unplugged/text_compression_fixed.yml by
// tools/freeze_text_compression.mjs, not part of the "new set" bank above.
// This is the CS Unplugged book's own worksheet poem (2015 ed., p.29); the
// printed page shows the book's own hand-drawn box-and-arrow diagram
// (assets/img/unplugged/text-compression/pease-porridge-worksheet.png), so
// this text is used only to freeze and verify the hidden key, never rendered
// as our own boxes.
export const FIXED_POEM = {
  title: "Pease Porridge Hot",
  text:
    "Pease porridge hot,\n" +
    "Pease porridge cold,\n" +
    "Pease porridge in the pot,\n" +
    "Nine days old.\n" +
    "Some like it hot,\n" +
    "Some like it cold,\n" +
    "Some like it in the pot,\n" +
    "Nine days old.",
};

// The book's "Short and Sweet" worksheet poem (2015 ed., p.31-32): a student
// crosses out repeats by hand on paper, so we never render boxes for it
// either. Frozen letter counts give the hidden key a "how good was that"
// benchmark, computed here rather than hand-typed.
export const SHORT_AND_SWEET_POEM = {
  title: "I Know an Old Lady",
  text:
    "I know an old lady who swallowed a bird.\n" +
    "How absurd! She swallowed a bird!\n" +
    "She swallowed the bird to catch the spider\n" +
    "That wriggled and jiggled\n" +
    "and tickled inside her.\n" +
    "She swallowed the spider to catch the fly.\n" +
    "I don't know why she swallowed a fly.\n" +
    "Perhaps she'll die...",
};

// One puzzle: a title, the original text (kept only for the checker/key),
// and the compressed {tokens, boxContent}.
function buildPuzzle(key) {
  const rhyme = RHYMES[key];
  return { key, title: rhyme.title, original: rhyme.text, ...compress(rhyme.text) };
}

// level "ms": one rhyme. level "hs": two different rhymes back to back,
// which is harder only because there is more to track, not a new idea.
export function generateSet(rng, opts = {}) {
  const level = opts.level === "hs" ? "hs" : "ms";
  if (level === "ms") {
    const key = rng.pick(MS_BANK);
    return [buildPuzzle(key)];
  }
  const bank = rng.shuffle(HS_BANK);
  return [buildPuzzle(bank[0]), buildPuzzle(bank[1])];
}
