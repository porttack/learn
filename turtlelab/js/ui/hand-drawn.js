// TurtleLab: the chalk grain for the chalkboard paper.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Chalk skips over a rough board, so a chalk line is not solid: it is speckled. The chalkboard gets that from a mask (a picture whose see-through
// specks let the board show through) laid over the drawing by the stylesheet. core/hand.js works out one small tile of grain; this turns it into a
// picture the page can use as a mask, once, from numbers (no file, nothing fetched, nothing stored).

import { GRAIN_SIZE, chalkGrain } from '../core/hand.js';

let tile = null;

/** The address of the chalk grain tile, for `mask-image`: a small picture made on first use (a data address, which the page's policy allows for images). */
export function chalkGrainUrl() {
  if (tile) return tile;
  const alpha = chalkGrain();
  const canvas = document.createElement('canvas');
  canvas.width = GRAIN_SIZE;
  canvas.height = GRAIN_SIZE;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  for (let i = 0; i < alpha.length; i += 1) {
    image.data[i * 4] = 255;
    image.data[i * 4 + 1] = 255;
    image.data[i * 4 + 2] = 255;
    image.data[i * 4 + 3] = alpha[i];
  }
  ctx.putImageData(image, 0, 0);
  tile = canvas.toDataURL('image/png');
  return tile;
}

/** How big the tile is shown, in the screen's pixels (twice as many pixels as that on a sharp screen). */
export const GRAIN_SHOWN = GRAIN_SIZE / 2;
