// The color of each palette's blocks.
//
// The hex values are taken from Turtle Blocks JS, js/utils/platformstyle.js:
//   Copyright (C) 2015 Sam Parkinson
//   https://github.com/sugarlabs/turtleblocksjs
//   GNU General Public License, version 3 or (at your option) any later
//   version. (GPL-3.0-or-later can be combined with this project's
//   AGPL-3.0-or-later.)
// Only the colors were taken, and TurtleLab groups them into its own five
// palettes. See NOTICE.md.
//
// Each color has a `fill` (the block body) and a `stroke` (its outline).

export const PALETTE_COLORS = {
  turtle: { fill: '#92A9FF', stroke: '#5370DC' },
  pen: { fill: '#3EDCDD', stroke: '#1DBCBD' },
  math: { fill: '#FF6EA1', stroke: '#FF2C76' },
  flow: { fill: '#D98A43', stroke: '#B7651A' },
  myblocks: { fill: '#FFBF00', stroke: '#DAAF30' },
  // Sticky notes: the pale yellow of the paper kind. These two are original, not from Sugar.
  notes: { fill: '#FFF1A8', stroke: '#C9B037' },
};

// The little boxes that hold a number use the Math palette's color.
export const NUMBER_COLORS = PALETTE_COLORS.math;
