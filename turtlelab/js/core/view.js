// TurtleLab: panning and zooming the block workspace.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The view says how the workspace is placed on the screen: it is moved by
// (x, y) pixels and then scaled by `zoom`. So a point (wx, wy) in the
// workspace appears on screen at (x + wx * zoom, y + wy * zoom).

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 2.5;

export const HOME_VIEW = Object.freeze({ x: 0, y: 0, zoom: 1 });

/** Keep a zoom level inside the allowed range. */
export function clampZoom(zoom) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Zoom by a factor (2 doubles the size) while keeping one point of the
 * screen still: the point under the pointer stays under the pointer, which
 * is what makes zooming feel natural. `px` and `py` are measured from the
 * top-left corner of the workspace. Returns a new view.
 */
export function zoomAbout(view, factor, px, py) {
  const zoom = clampZoom(view.zoom * factor);
  const ratio = zoom / view.zoom;
  return {
    x: px - (px - view.x) * ratio,
    y: py - (py - view.y) * ratio,
    zoom,
  };
}

/**
 * How far to zoom out so a column of blocks fits in the window. `contentBottom`
 * is how far down the blocks reach (in workspace units), `anchorY` is the top
 * of the part we keep still, and `height` is how tall the window is. Returns
 * a zoom from `minZoom` up to 1: it never zooms IN, and never goes smaller than
 * `minZoom`, because tiny blocks are hard to read (past that, you slide the page).
 */
export function zoomToFit({ contentBottom, anchorY, height, margin = 12, minZoom = 0.6 }) {
  const needed = contentBottom - anchorY;
  const room = height - margin - anchorY;
  if (needed <= 0 || needed <= room) return 1;
  return Math.min(1, Math.max(minZoom, room / needed));
}

/** Slide the view by (dx, dy) screen pixels. Returns a new view. */
export function panBy(view, dx, dy) {
  return { x: view.x + dx, y: view.y + dy, zoom: view.zoom };
}
