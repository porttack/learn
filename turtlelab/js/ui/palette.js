// TurtleLab: the palettes. A column of round buttons down the left side,
// one per kind of block, and a flyout that slides out showing that kind's
// blocks to drag into the workspace.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Dragging a block out of the flyout is handled by the workspace (it creates
// the new block and carries it). Dropping anything on the palette deletes it,
// so this file also answers "is that point over the palette?".

import { PALETTES, BLOCKS, specOf } from '../core/blocks-spec.js';
import { newBlock } from '../core/edit.js';
import { definitionHats, newCall, newDefinition, newInput } from '../core/definitions.js';
import { PALETTE_COLORS } from './palette-colors.js';
import { layoutStack, renderStack, stackBounds } from './block-view.js';
import { Trash } from './trash.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GAP = 14; // space between blocks in the flyout
const MARGIN = 14;
const ZONE_MARGIN = 8; // the delete zone reaches this far past the palette

export class PaletteUI {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage
   * @param {import('./workspace.js').Workspace} options.workspace
   * @param {number} [options.burpChance] how often the shark burps after a meal (0 to 1), for trying it out
   */
  constructor({ stage, workspace, burpChance }) {
    this.stage = stage;
    this.workspace = workspace;
    this.selected = null;
    this.entries = new Map(); // each block in the flyout, by its element: how to make one, and its tip

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

    // The delete zone: the whole left column, not just the buttons. It is tinted
    // while a block is held over it (between the paper and the blocks), and the
    // trash can at the bottom of it, with its shark, shows what happens next.
    this.band = document.createElement('div');
    this.band.className = 'trash-band';
    this.band.setAttribute('aria-hidden', 'true');
    stage.insertBefore(this.band, workspace.svg);

    stage.append(this.nav, this.flyout);
    this.trash = new Trash(stage, workspace.svg, burpChance === undefined ? {} : { burpChance });
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

  /**
   * What a palette shows: for each block, a `make` that builds a fresh one
   * (what gets dragged out, or run when tapped) and its tip. The My Blocks
   * palette has the `to` block, then a call block for every block the student
   * has made and an input block for each of its inputs, so it changes as they
   * make more.
   */
  entriesFor(id) {
    const project = this.workspace.project;
    const entries = [];
    for (const [op, spec] of Object.entries(BLOCKS)) {
      if (spec.palette !== id || spec.dynamic) continue;
      entries.push({ op, make: () => (op === 'to' ? newDefinition(project) : newBlock(op)), help: spec.help });
    }
    if (id === 'myblocks') {
      for (const hat of definitionHats(project)) {
        const name = hat.name;
        entries.push({ op: 'call', key: `call:${name}`, make: () => newCall(hat), help: specOf(newCall(hat)).help, spaceBefore: true });
        for (const param of hat.params ?? []) {
          entries.push({ op: 'input', key: `input:${name}:${param}`, make: () => newInput(param), help: specOf(newInput(param)).help });
        }
      }
    }
    return entries;
  }

  /** Draw the flyout again from the project, for when the blocks a student made have changed. */
  refresh() {
    if (this.selected) this.fillFlyout(this.selected);
  }

  fillFlyout(id) {
    this.flyoutSvg.replaceChildren();
    this.entries = new Map();
    let y = MARGIN;
    let widest = 0;
    for (const entry of this.entriesFor(id)) {
      if (entry.spaceBefore) y += GAP;
      const layout = layoutStack({ x: MARGIN, y, blocks: [entry.make()] });
      const group = renderStack(layout, () => {});
      group.dataset.op = entry.op;
      if (entry.key) group.dataset.key = entry.key;
      this.entries.set(group, entry);
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
    const entry = group && this.entries.get(group);
    if (!entry) return;
    this.workspace.pressPaletteBlock(event, entry, group.getBoundingClientRect());
  }

  /**
   * How far right the delete zone reaches: the palette column, or its open
   * flyout if that is wider, and a little more.
   */
  deleteEdge() {
    const reach = (el) => (el.hidden || el.offsetParent === null ? 0 : el.getBoundingClientRect().right);
    return Math.max(reach(this.nav), reach(this.flyout)) + ZONE_MARGIN;
  }

  /**
   * True if a block dropped here is deleted. That is the whole left column, top
   * to bottom, as wide as the palette, and anything dragged past the left edge
   * of the window: letting go anywhere along the side is "putting it away". A
   * stack lying on the trash can counts too (see coversCan).
   * (It used to be only the strip of buttons, so a block dropped just below or
   * beside them stayed where it was.) Only the sideways position matters.
   */
  isOver(clientX, clientY, stackRect = null) {
    if (clientX <= this.deleteEdge()) return true;
    return stackRect !== null && this.coversCan(stackRect);
  }

  /**
   * True if a stack of blocks (its rectangle on the screen) is lying on the trash can: the
   * can's middle is under it. It does not matter where the stack was picked up. A wide stack
   * grabbed by its far end can be right on top of the can with the pointer well away from
   * it, and to the student that is "in the trash".
   */
  coversCan(rect) {
    const can = this.trash.el.getBoundingClientRect();
    if (can.width === 0 || can.height === 0) return false; // the can is not showing
    const x = can.left + can.width / 2;
    const y = can.top + can.height * 0.65;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  /** Tint the whole left column, and bring the shark up, while a block is held over it: "drop to delete". */
  setTrashHover(hovering) {
    this.nav.classList.toggle('trash', hovering);
    this.flyout.classList.toggle('trash', hovering);
    this.band.classList.toggle('active', hovering);
    if (hovering) this.band.style.width = `${this.deleteEdge() - this.stage.getBoundingClientRect().left}px`;
    this.trash.setHungry(hovering);
  }

  /** What a deleted stack is fed to: where its mouth is on the screen, and a nudge to start chewing. */
  get eater() {
    return { mouthPoint: (options) => this.trash.mouthPoint(options), feed: (meal) => this.trash.feed(meal), spit: (ms) => this.trash.spit(ms) };
  }
}
