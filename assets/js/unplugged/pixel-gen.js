// Builds a set of pixel pictures to decode, in the same schema the fixed
// worksheet uses ({ w, h, rows, name }), so one renderer draws both.
// DOM-free: tools/check_pixel_pictures.mjs imports this in Node.
import { parsePicture } from "./pixels.js";
import { LIBRARY } from "./pixel-library.js";

export const SIZES = {
  small: { label: "Small (10 by 10)", w: 10, h: 10 },
  large: { label: "Large (16 by 16)", w: 16, h: 16 },
};

// The one "encode" picture in a set (see generateSet) is drawn smaller than
// the rest: writing out every row's code by hand is more work than shading
// one in, so a smaller grid keeps that question from taking disproportionately
// longer than the decode questions around it.
const ENCODE_SIZES = {
  small: { w: 8, h: 8 },
  large: { w: 12, h: 12 },
};

// A symmetric "space invader" style sprite: mirrored left and right, so
// there's always a fresh picture even after the library runs out. Retries
// a few times so an all-white sprite (nothing to decode) is very unlikely.
export function generateInvader(rng, w, h, density = 0.42) {
  const halfW = w / 2;
  let rows = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    rows = [];
    for (let r = 0; r < h; r++) {
      const half = Array.from({ length: halfW }, () => (rng.chance(density) ? 1 : 0));
      rows.push(half.concat([...half].reverse()));
    }
    if (rows.some((row) => row.some((px) => px))) break;
  }
  return { w, h, rows, name: "Space invader" };
}

// A whole set: a mix of library pictures and freshly generated invaders.
// Question i draws from its own forked generator, so changing the count
// doesn't reshuffle the earlier pictures. Decode ("shade the grid to match
// this code") is the default question; once 3 or more pictures are
// requested, the last one is an encode question ("write the code for this
// picture") instead, so a bigger set also practices the other direction,
// not just more of the same one.
export function generateSet(rng, { size = "small", count = 3 } = {}) {
  const { w, h } = SIZES[size] || SIZES.small;
  const pool = rng.shuffle(LIBRARY[size] || LIBRARY.small);
  let poolIndex = 0;
  const pics = [];
  const encodeIndex = count >= 3 ? count - 1 : -1;
  for (let i = 0; i < count; i++) {
    const r = rng.fork(i + 1);
    if (i === encodeIndex) {
      const enc = ENCODE_SIZES[size] || ENCODE_SIZES.small;
      pics.push({ ...generateInvader(r, enc.w, enc.h), dir: "encode" });
    } else if (poolIndex < pool.length && r.chance(0.55)) {
      const entry = pool[poolIndex++];
      pics.push({ ...parsePicture(entry.art), name: entry.name, dir: "decode" });
    } else {
      pics.push({ ...generateInvader(r, w, h), dir: "decode" });
    }
  }
  return pics;
}
