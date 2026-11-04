// TurtleLab: a picture of the blocks, for the PDF.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Every stack of blocks (and every sticky note) is laid out and drawn exactly as the
// workspace draws them, put in one SVG, and turned into pixels with a canvas. An SVG
// shown as a picture cannot use the page's own fonts, so the Roboto font is tucked
// into the SVG, where it can. All of this happens on this computer and nothing is
// fetched: the font is part of the page's own code (roboto-data.js).

import { layoutStack, renderStack, stackBounds } from './block-view.js';
import { ROBOTO_REGULAR_BASE64 } from './roboto-data.js';
import { packInColumns, readableScale } from '../core/pack.js';
import { HALF_PAGE } from '../core/pdf.js';

const PADDING = 14; // round the blocks, in the units the workspace uses

/** The CSS that gives the SVG its font: the font file itself, written into the style. */
const FONT_CSS =
  `@font-face{font-family:'TurtleLabRoboto';src:url(data:font/woff2;base64,${ROBOTO_REGULAR_BASE64}) format('woff2');}` +
  `.block-text{font-family:'TurtleLabRoboto',Roboto,Arial,sans-serif;}`;

/**
 * Red, green and blue bytes for the pixels of a canvas, with anything see-through shown
 * over white (a PDF picture has no see-through). The bytes run left to right, top to bottom.
 */
export function canvasToRgb(canvas) {
  const { width, height } = canvas;
  const { data } = canvas.getContext('2d').getImageData(0, 0, width, height);
  const rgb = new Uint8Array(width * height * 3);
  for (let from = 0, to = 0; from < data.length; from += 4, to += 3) {
    const alpha = data[from + 3];
    for (let c = 0; c < 3; c += 1) rgb[to + c] = (data[from + c] * alpha + 255 * (255 - alpha) + 127) / 255;
  }
  return rgb;
}

/**
 * The blocks as a picture: { width, height, rgb, pixelsPerPoint }, or null if there are none.
 * `pixelsPerPoint` is how many times sharper than the screen it is drawn (2 by default),
 * lowered if the picture would be enormous.
 */
export async function renderCodeImage(project, { sharpness = 2, maxPixels = 9_000_000 } = {}) {
  if (project.stacks.length === 0) return null;

  const placed = project.stacks.map((stack) => {
    const layout = layoutStack(stack);
    return { stack, layout, ...stackBounds(layout) };
  });

  // Where each stack goes in the picture: where the student put it, or, if that leaves so
  // much empty space that the writing would come out much smaller, packed close together.
  const left = Math.min(...placed.map(({ stack }) => stack.x));
  const top = Math.min(...placed.map(({ stack }) => stack.y));
  const asPlaced = {
    width: Math.max(...placed.map(({ stack, width }) => stack.x + width)) - left,
    height: Math.max(...placed.map(({ stack, height }) => stack.y + height)) - top,
    where: new Map(placed.map(({ stack }) => [stack, { x: stack.x - left, y: stack.y - top }])),
  };
  const packed = packInColumns(
    placed.map(({ stack, width, height }) => ({ id: stack, x: stack.x, y: stack.y, width, height })),
    { aspect: HALF_PAGE.width / HALF_PAGE.height },
  );
  const scaleOf = (size) => readableScale(size.width + 2 * PADDING, size.height + 2 * PADDING, HALF_PAGE.width, HALF_PAGE.height);
  const arrangement = scaleOf(packed) > scaleOf(asPlaced) * 1.1 ? { width: packed.width, height: packed.height, where: packed.places } : asPlaced;
  const width = Math.ceil(arrangement.width + 2 * PADDING);
  const height = Math.ceil(arrangement.height + 2 * PADDING);
  let pixelsPerPoint = sharpness;
  while (width * height * pixelsPerPoint * pixelsPerPoint > maxPixels && pixelsPerPoint > 0.5) pixelsPerPoint -= 0.25;

  const serializer = new XMLSerializer();
  const stacks = placed.map(({ stack, layout }) => {
    const group = renderStack(layout, () => {});
    const at = arrangement.where.get(stack);
    group.setAttribute('transform', `translate(${at.x + PADDING} ${at.y + PADDING})`);
    return serializer.serializeToString(group);
  });
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<style>${FONT_CSS}</style><rect width="${width}" height="${height}" fill="#ffffff"/>${stacks.join('')}</svg>`;

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * pixelsPerPoint);
    canvas.height = Math.ceil(height * pixelsPerPoint);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, rgb: canvasToRgb(canvas), pixelsPerPoint, canvas };
  } finally {
    URL.revokeObjectURL(url);
  }
}
