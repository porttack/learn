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

/**
 * The view that puts every block inside the window, so all your code can be seen at once.
 * `content` is the box that holds all the stacks, in workspace units. `room` is the part of
 * the window to use, in screen pixels measured from the workspace's top left corner (the
 * palettes along the left edge are not in it). It zooms OUT as far as `minZoom` to make
 * everything fit, never IN past full size, and puts the top left corner of the blocks at the
 * top left corner of the room. If they are still too big at `minZoom`, you slide the page.
 */
export function fitBlocksView({ content, room, minZoom = MIN_ZOOM, maxZoom = 1 }) {
  const width = content.right - content.left;
  const height = content.bottom - content.top;
  const roomWidth = Math.max(1, room.right - room.left);
  const roomHeight = Math.max(1, room.bottom - room.top);
  let zoom = Math.min(width > 0 ? roomWidth / width : Infinity, height > 0 ? roomHeight / height : Infinity);
  if (!Number.isFinite(zoom)) zoom = maxZoom;
  zoom = Math.min(maxZoom, Math.max(minZoom, zoom));
  return { x: room.left - content.left * zoom, y: room.top - content.top * zoom, zoom };
}
