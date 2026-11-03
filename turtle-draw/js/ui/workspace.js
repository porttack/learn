// Turtle Draw: the workspace, where blocks live and get dragged around.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The workspace is one big transparent SVG laid over the drawing paper.
// Everything in it passes clicks through to the paper and the turtle
// underneath, except the blocks themselves.
//
// What a person does, and what happens:
//   press a block and drag   pick it up (with every block below it, like a
//                            stack of cards) and carry it. Near a place it
//                            fits, a ring shows where it will snap.
//   let go                   it snaps there, or stays where it is dropped.
//   drop it on the palette   deleted.
//   tap a block              run its stack.
//   tap a number             type a new number.
//
// The rules for how a drop changes the project live in core/edit.js. This
// file works out which blocks the person meant and draws the result.

import { layoutStack, renderStack, walkNodes } from './block-view.js';
import {
  newBlock,
  detachCommands,
  detachReporter,
  attachAfter,
  attachInside,
  attachAbove,
  attachReporter,
  removeStack,
  isReporterStack,
} from '../core/edit.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SNAP_DISTANCE = 28; // how close (in screen pixels) a drop must be to snap
const DRAG_THRESHOLD = 6; // how far a press must move before it is a drag
const TOUCH_DRAG_THRESHOLD = 10; // fingers wobble more than mice

export class Workspace {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the element the workspace fills
   * @param {object} options.project the project being edited (changed in place)
   * @param {() => void} [options.onChange] called after every edit
   * @param {(stack: object) => void} [options.onRunStack] a block was tapped
   * @param {(op: string) => void} [options.onRunPaletteBlock] a palette block was tapped
   * @param {(x: number, y: number) => boolean} [options.isOverPalette] for deleting
   * @param {(hovering: boolean) => void} [options.onPaletteHover]
   */
  constructor({
    stage,
    project,
    onChange = () => {},
    onRunStack = () => {},
    onRunPaletteBlock = () => {},
    isOverPalette = () => false,
    onPaletteHover = () => {},
  }) {
    this.stage = stage;
    this.project = project;
    this.onChange = onChange;
    this.onRunStack = onRunStack;
    this.onRunPaletteBlock = onRunPaletteBlock;
    this.isOverPalette = isOverPalette;
    this.onPaletteHover = onPaletteHover;

    this.layouts = [];
    this.registry = new Map(); // element id -> what it is
    this.byBlock = new Map(); // block object -> its node
    this.view = { x: 0, y: 0, zoom: 1 }; // pan and zoom (used by a later milestone)
    this.pointer = null; // the press in progress, if any
    this.drag = null; // the drag in progress, if any
    this.runningBlock = null;
    this.errorBlock = null;

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'workspace');
    this.viewport = document.createElementNS(SVG_NS, 'g');
    this.stackLayer = document.createElementNS(SVG_NS, 'g');
    this.overlay = document.createElementNS(SVG_NS, 'g');
    this.snapRing = document.createElementNS(SVG_NS, 'circle');
    this.snapRing.setAttribute('class', 'snap-ring');
    this.snapRing.setAttribute('r', '12');
    this.snapRing.setAttribute('visibility', 'hidden');
    this.overlay.append(this.snapRing);
    this.viewport.append(this.stackLayer, this.overlay);
    this.svg.append(this.viewport);
    stage.append(this.svg);

    this.hint = document.createElement('p');
    this.hint.className = 'hint';
    this.hint.textContent = 'Pick a palette on the left, then drag blocks here.';
    stage.append(this.hint);

    this.listen();
    this.render();
  }

  // ---- Drawing -----------------------------------------------------------

  /** Rebuild everything on screen from the project. */
  render() {
    this.stackLayer.replaceChildren();
    this.registry.clear();
    this.byBlock.clear();
    this.layouts = this.project.stacks.map((stack) => {
      const layout = layoutStack(stack);
      this.stackLayer.append(renderStack(layout, (id, entry) => this.registry.set(id, entry)));
      walkNodes(layout, (node) => this.byBlock.set(node.block, node));
      return layout;
    });
    if (this.drag) this.layoutOf(this.drag.carried)?.el.classList.add('carried');
    this.hint.hidden = this.project.stacks.length > 0;
    this.applyMarks();
  }

  layoutOf(stack) {
    return this.layouts.find((layout) => layout.stack === stack);
  }

  /** Where a point on the screen is in workspace coordinates. */
  toWorld(clientX, clientY) {
    const box = this.svg.getBoundingClientRect();
    return {
      x: (clientX - box.left - this.view.x) / this.view.zoom,
      y: (clientY - box.top - this.view.y) / this.view.zoom,
    };
  }

  // ---- Running marks: which block is running, which one failed -----------

  /** Outline the block that just ran. Pass null to clear it. */
  setRunning(block) {
    this.runningBlock = block;
    this.applyMarks();
  }

  /** Outline a block in red because it caused an error. Pass null to clear it. */
  setError(block) {
    this.errorBlock = block;
    this.applyMarks();
  }

  applyMarks() {
    for (const el of this.stackLayer.querySelectorAll('.running, .error')) {
      el.classList.remove('running', 'error');
    }
    this.byBlock.get(this.runningBlock)?.el?.classList.add('running');
    this.byBlock.get(this.errorBlock)?.el?.classList.add('error');
  }

  // ---- Pointer handling --------------------------------------------------

  listen() {
    this.svg.addEventListener('pointerdown', (event) => this.pressBlock(event));
    this.svg.addEventListener('pointermove', (event) => this.move(event));
    this.svg.addEventListener('pointerup', (event) => this.release(event));
    this.svg.addEventListener('pointercancel', (event) => this.cancel(event));
  }

  /** A press on a block in the workspace. */
  pressBlock(event) {
    if (this.pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const el = event.target.closest?.('[data-nid]');
    const entry = el && this.registry.get(Number(el.dataset.nid));
    if (!entry) return;
    this.startPress(event, { entry });
  }

  /** A press on a block in the palette (called by the palette). */
  pressPaletteBlock(event, op, rect) {
    if (this.pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.startPress(event, { palette: { op, rect } });
  }

  startPress(event, what) {
    this.pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      threshold: event.pointerType === 'mouse' ? DRAG_THRESHOLD : TOUCH_DRAG_THRESHOLD,
      ...what,
    };
    // Capture on the workspace itself: it outlives the re-drawing that
    // happens when a drag begins, so the events keep coming.
    this.svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  move(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    if (!this.drag) {
      const far = Math.hypot(event.clientX - this.pointer.startX, event.clientY - this.pointer.startY);
      if (far < this.pointer.threshold) return;
      this.beginDrag();
      if (!this.drag) return;
    }
    this.carry(event);
  }

  release(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    const { entry, palette } = this.pointer;
    this.pointer = null;
    if (this.drag) {
      this.drop(event);
    } else if (palette) {
      this.onRunPaletteBlock(palette.op);
    } else if (entry.type === 'literal') {
      this.editNumber(entry);
    } else {
      this.onRunStack(entry.node.stack);
    }
  }

  cancel(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    this.pointer = null;
    if (this.drag) this.drop(event, { keepWhereItIs: true });
  }

  // ---- Dragging ----------------------------------------------------------

  /** Pick up whatever was pressed. */
  beginDrag() {
    const { entry, palette } = this.pointer;
    // Measure from where the press happened, not from where the pointer is
    // now: a quick drag has already travelled before it counts as a drag,
    // and the block must not jump.
    const pointer = this.toWorld(this.pointer.startX, this.pointer.startY);
    let carried;
    let origin; // where the top-left of the carried stack starts, in workspace coordinates

    if (palette) {
      origin = this.toWorld(palette.rect.left, palette.rect.top);
      carried = { x: origin.x, y: origin.y, blocks: [newBlock(palette.op)] };
      this.project.stacks.push(carried);
    } else {
      // A press on a number box picks up the block the number belongs to.
      const node = entry.type === 'literal' ? entry.owner : entry.node;
      origin = { x: node.stack.x + node.ax, y: node.stack.y + node.ay };
      carried = node.argOf
        ? detachReporter(this.project, node.argOf.block, node.argIndex, origin.x, origin.y)
        : detachCommands(this.project, node.stack, node.list, node.index, origin.x, origin.y);
    }

    this.drag = { carried, grab: { x: pointer.x - origin.x, y: pointer.y - origin.y }, target: null };
    this.render();
  }

  /** Move the carried stack with the pointer and show where it would snap. */
  carry(event) {
    const { carried, grab } = this.drag;
    const pointer = this.toWorld(event.clientX, event.clientY);
    carried.x = pointer.x - grab.x;
    carried.y = pointer.y - grab.y;
    const layout = this.layoutOf(carried);
    layout.el.setAttribute('transform', `translate(${carried.x} ${carried.y})`);

    this.drag.target = this.findTarget(layout);
    if (this.drag.target) {
      const [x, y] = this.drag.target.point;
      this.snapRing.setAttribute('cx', x);
      this.snapRing.setAttribute('cy', y);
      this.snapRing.setAttribute('visibility', 'visible');
    } else {
      this.snapRing.setAttribute('visibility', 'hidden');
    }
    this.onPaletteHover(this.isOverPalette(event.clientX, event.clientY));
  }

  /** Let go of the carried stack: snap it, delete it, or leave it. */
  drop(event, { keepWhereItIs = false } = {}) {
    const { carried, target } = this.drag;
    this.drag = null;
    this.snapRing.setAttribute('visibility', 'hidden');
    this.onPaletteHover(false);

    if (!keepWhereItIs && this.isOverPalette(event.clientX, event.clientY)) {
      removeStack(this.project, carried);
    } else if (!keepWhereItIs && target) {
      this.snapTo(target, carried);
    }
    this.render();
    this.onChange();
  }

  snapTo(target, carried) {
    const project = this.project;
    switch (target.kind) {
      case 'after':
        attachAfter(project, carried, target.node.list, target.node.index);
        break;
      case 'inside':
        attachInside(project, carried, target.node.block);
        break;
      case 'above': {
        // The blocks go on top, but the stack that was already there should
        // not jump: keep its old top block exactly where it was.
        const stack = target.layout.stack;
        const [oldX, oldY] = [stack.x, stack.y];
        attachAbove(project, carried, stack);
        const oldTop = layoutStack(stack).nodes[carried.blocks.length];
        stack.x = oldX - oldTop.ax;
        stack.y = oldY - oldTop.ay;
        break;
      }
      case 'socket':
        attachReporter(project, carried, target.owner.block, target.index, target.point[0] + 40, target.point[1] + 40);
        break;
      default:
        break;
    }
  }

  /**
   * The nearest place the carried stack would snap to, or null. Looks at
   * every connection point in every other stack, in workspace coordinates.
   */
  findTarget(carriedLayout) {
    const limit = SNAP_DISTANCE / this.view.zoom;
    const carried = carriedLayout.stack;
    const first = carriedLayout.nodes[0];
    const last = carriedLayout.nodes[carriedLayout.nodes.length - 1];
    const at = (layout, node, dock) => [
      layout.stack.x + node.ax + dock[0],
      layout.stack.y + node.ay + dock[1],
    ];

    // A reporter plugs in by its left edge. A command stack hangs by its top,
    // or sits on top of another stack by its bottom.
    const topPoint = at(carriedLayout, first, first.slot);
    const bottomPoint = at(carriedLayout, last, last.tab);
    const reporter = isReporterStack(carried);

    let best = null;
    const consider = (point, mine, target) => {
      const distance = Math.hypot(point[0] - mine[0], point[1] - mine[1]);
      if (distance <= limit && (!best || distance < best.distance)) {
        best = { ...target, point, distance };
      }
    };

    for (const layout of this.layouts) {
      if (layout === carriedLayout) continue;
      walkNodes(layout, (node) => {
        if (reporter) {
          node.args.forEach((_, i) => {
            consider(at(layout, node, node.docks[1 + i]), topPoint, { kind: 'socket', owner: node, index: i });
          });
        } else if (node.kind !== 'reporter') {
          consider(at(layout, node, node.tab), topPoint, { kind: 'after', node });
          if (node.mouth) consider(at(layout, node, node.mouth), topPoint, { kind: 'inside', node });
        }
      });
      const head = layout.nodes[0];
      if (!reporter && head.kind !== 'reporter') {
        consider(at(layout, head, head.slot), bottomPoint, { kind: 'above', layout });
      }
    }
    return best;
  }

  // ---- Typing a number ---------------------------------------------------

  /** Put a text box over a number so it can be changed. */
  editNumber(entry) {
    const box = entry.arg.el.getBoundingClientRect();
    const stageBox = this.stage.getBoundingClientRect();
    const input = document.createElement('input');
    input.className = 'number-input';
    input.type = 'text';
    input.inputMode = 'decimal';
    input.value = entry.arg.literal.text;
    input.style.left = `${box.left - stageBox.left}px`;
    input.style.top = `${box.top - stageBox.top}px`;
    input.style.width = `${Math.max(box.width, 56)}px`;
    input.style.height = `${box.height}px`;
    this.stage.append(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (keep) => {
      if (finished) return;
      finished = true;
      const text = input.value.trim();
      input.remove();
      const number = Number(text);
      if (keep && text !== '' && Number.isFinite(number)) {
        entry.owner.block.args[entry.index] = number;
        this.render();
        this.onChange();
      }
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') finish(true);
      else if (event.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }
}
