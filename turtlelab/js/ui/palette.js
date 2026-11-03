// TurtleLab: the palettes. A column of round buttons down the left side,
// one per kind of block, and a flyout that slides out showing that kind's
// blocks to drag into the workspace.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Dragging a block out of the flyout is handled by the workspace (it creates
// the new block and carries it). Dropping anything on the palette deletes it,
// so this file also answers "is that point over the palette?".

import { PALETTES, BLOCKS } from '../core/blocks-spec.js';
import { newBlock } from '../core/edit.js';
import { PALETTE_COLORS } from './palette-colors.js';
import { layoutStack, renderStack, stackBounds } from './block-view.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GAP = 14; // space between blocks in the flyout
const MARGIN = 14;

export class PaletteUI {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage
   * @param {import('./workspace.js').Workspace} options.workspace
   */
  constructor({ stage, workspace }) {
    this.workspace = workspace;
    this.selected = null;

    this.nav = document.createElement('nav');
    this.nav.className = 'palettes';
    this.nav.setAttribute('aria-label', 'Block palettes');

    this.flyout = document.createElement('div');
    this.flyout.className = 'flyout';
    this.flyout.hidden = true;
    this.flyoutSvg = document.createElementNS(SVG_NS, 'svg');
    this.flyoutSvg.setAttribute('class', 'flyout-svg');
    this.flyout.append(this.flyoutSvg);

    // Only show palettes that have blocks in them so far.
    this.buttons = new Map();
    for (const palette of PALETTES) {
      if (!Object.values(BLOCKS).some((spec) => spec.palette === palette.id)) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'palette-button';
      button.title = palette.label;
      button.setAttribute('aria-label', palette.label);
      button.style.setProperty('--palette-color', PALETTE_COLORS[palette.id].fill);
      const icon = document.createElement('img');
      icon.src = `images/palette-${palette.id}.svg`;
      icon.alt = '';
      icon.draggable = false;
      button.append(icon);
      button.addEventListener('click', () => this.select(palette.id));
      this.nav.append(button);
      this.buttons.set(palette.id, button);
    }

    stage.append(this.nav, this.flyout);
    this.flyoutSvg.addEventListener('pointerdown', (event) => this.pressFlyout(event));
  }

  /** Open a palette's flyout, or close it if it is already open. */
  select(id) {
    this.selected = this.selected === id ? null : id;
    for (const [key, button] of this.buttons) {
      button.classList.toggle('selected', key === this.selected);
    }
    this.flyout.hidden = this.selected === null;
    if (this.selected) this.fillFlyout(this.selected);
  }

  fillFlyout(id) {
    this.flyoutSvg.replaceChildren();
    let y = MARGIN;
    let widest = 0;
    for (const [op, spec] of Object.entries(BLOCKS)) {
      if (spec.palette !== id) continue;
      const layout = layoutStack({ x: MARGIN, y, blocks: [newBlock(op)] });
      const group = renderStack(layout, () => {});
      group.dataset.op = op;
      this.flyoutSvg.append(group);
      const { width, height } = stackBounds(layout);
      widest = Math.max(widest, width);
      y += height + GAP;
    }
    const width = Math.ceil(widest + 2 * MARGIN);
    this.flyoutSvg.setAttribute('width', width);
    this.flyoutSvg.setAttribute('height', Math.ceil(y));
    this.flyout.style.width = `${width + 4}px`;
  }

  /** A press on a block in the flyout: hand it to the workspace to carry. */
  pressFlyout(event) {
    const group = event.target.closest?.('.stack');
    if (!group) return;
    this.workspace.pressPaletteBlock(event, group.dataset.op, group.getBoundingClientRect());
  }

  /** True if the screen point is over the palette column or its flyout. */
  isOver(clientX, clientY) {
    const inside = (el) => {
      if (el.hidden) return false;
      const box = el.getBoundingClientRect();
      return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
    };
    return inside(this.nav) || inside(this.flyout);
  }

  /** Tint the palette while a block is held over it, to say "drop to delete". */
  setTrashHover(hovering) {
    this.nav.classList.toggle('trash', hovering);
    this.flyout.classList.toggle('trash', hovering);
  }
}
