// TurtleLab: the workspace, where blocks live and get dragged around.
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
//   drop it on the left edge  deleted (the whole left column, not just the buttons).
//   tap a block              run its stack.
//   tap a number             type a new number.
//   tap a name on a `to`     type the block's name, or an input's name.
//   hold a block, or         a bubble with a one-line tip, and a Copy stack
//   right-click it           button. Shift-drag copies a stack too.
//   drag empty space         slide the workspace (two fingers: pinch to zoom).
//   mouse wheel, trackpad    scroll to slide, Ctrl and scroll (or pinch) to zoom.
//
// The rules for how a drop changes the project live in core/edit.js. This
// file works out which blocks the person meant and draws the result.

import { layoutStack, renderStack, walkNodes } from './block-view.js';
import { HelpBubble } from './help-bubble.js';
import { NOTE_MAX_CHARS, specOf } from '../core/blocks-spec.js';
import { renameDefinition, setInput, uniquifyDefinition } from '../core/definitions.js';
import { INPUT_MAX, NAME_MAX } from '../core/names.js';
import { HOME_VIEW, zoomAbout, panBy, zoomToFit } from '../core/view.js';
import {
  cloneBlock,
  detachCommands,
  detachReporter,
  attachAfter,
  attachInside,
  attachAbove,
  attachReporter,
  removeStack,
  isReporterStack,
  canPlug,
} from '../core/edit.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SNAP_DISTANCE = 28; // how close (in screen pixels) a drop must be to snap
const DRAG_THRESHOLD = 6; // how far a press must move before it is a drag
const TOUCH_DRAG_THRESHOLD = 10; // fingers wobble more than mice
const LONG_PRESS_MS = 500; // how long to hold a block for its help bubble
const COPY_OFFSET = 30; // how far a copied stack lands from the original
const EAT_MS = 380; // how long a deleted stack takes to be eaten
const EATEN_SIZE = 0.12; // how small it is by the time it reaches the shark

const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Workspace {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the element the workspace fills
   * @param {object} options.project the project being edited (changed in place)
   * @param {() => void} [options.onChange] called after every edit
   * @param {(stack: object) => void} [options.onRunStack] a block was tapped
   * @param {(block: object) => void} [options.onRunPaletteBlock] a palette block was tapped (a fresh copy of it)
   * @param {(text: string) => void} [options.onMessage] something to tell the student, like why a name was refused
   * @param {(x: number, y: number) => boolean} [options.isOverPalette] for deleting
   * @param {(hovering: boolean) => void} [options.onPaletteHover]
   * @param {{ mouthPoint: () => ({x: number, y: number} | null), feed: () => void }} [options.eater]
   *        what eats a deleted stack: where its mouth is on the screen, and a nudge to start chewing
   */
  constructor({
    stage,
    project,
    onChange = () => {},
    onRunStack = () => {},
    onRunPaletteBlock = () => {},
    onMessage = () => {},
    isOverPalette = () => false,
    onPaletteHover = () => {},
    eater = null,
  }) {
    this.stage = stage;
    this.project = project;
    this.onChange = onChange;
    this.onRunStack = onRunStack;
    this.onRunPaletteBlock = onRunPaletteBlock;
    this.onMessage = onMessage;
    this.isOverPalette = isOverPalette;
    this.onPaletteHover = onPaletteHover;
    this.eater = eater;

    this.layouts = [];
    this.registry = new Map(); // element id -> what it is
    this.byBlock = new Map(); // block object -> its node
    this.view = { ...HOME_VIEW }; // how the workspace is slid and zoomed
    this.pointer = null; // the press in progress, if any
    this.pressTimer = null; // fires when a block has been held long enough
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
    this.hint.textContent = 'Drag blocks here from the palettes. Run begins at the Start block (in Flow).';
    stage.append(this.hint);

    this.bubble = new HelpBubble(stage);

    this.listen();
    this.listenForView();
    this.applyView();
    this.render();
  }

  /** True while a block is being carried. */
  get busy() {
    return this.drag !== null;
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
    // A drag must always end. If the button comes up where this page cannot see it (over
    // the browser's own edge, say), or the browser takes the pointer back, or the window
    // loses focus, the block would otherwise stay stuck to the pointer.
    this.svg.addEventListener('lostpointercapture', (event) => this.cancel(event));
    window.addEventListener('pointerup', (event) => this.release(event));
    window.addEventListener('blur', () => this.abandon());
    this.svg.addEventListener('contextmenu', (event) => {
      const entry = this.entryAt(event.target);
      if (entry?.type === 'block') {
        event.preventDefault();
        this.showHelp(entry.node);
      }
    });
  }

  /** What was pressed: the block or number box under an element, if any. */
  entryAt(target) {
    const el = target.closest?.('[data-nid]');
    return el ? this.registry.get(Number(el.dataset.nid)) : null;
  }

  /** A press on a block in the workspace. */
  pressBlock(event) {
    if (this.pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const entry = this.entryAt(event.target);
    if (!entry) return;
    this.startPress(event, { entry, duplicate: event.shiftKey });
  }

  /** A press on a block in the palette (called by the palette). `entry` knows how to make a fresh one, and its tip. */
  pressPaletteBlock(event, entry, rect) {
    if (this.pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.startPress(event, { palette: { make: entry.make, help: entry.help, rect } });
  }

  startPress(event, what) {
    this.pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      threshold: event.pointerType === 'mouse' ? DRAG_THRESHOLD : TOUCH_DRAG_THRESHOLD,
      longPressed: false,
      ...what,
    };
    this.pressTimer = setTimeout(() => this.longPress(), LONG_PRESS_MS);
    // Capture on the workspace itself: it outlives the re-drawing that
    // happens when a drag begins, so the events keep coming.
    this.svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  move(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    // The mouse button is up but we never heard it come up (it was let go off the edge of
    // the window, say). That is letting go, and where is where the block last was: the mouse
    // may have wandered anywhere since, but the student meant to drop it there.
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.release(event, { atLastSpot: true });
      return;
    }
    if (!this.drag) {
      const far = Math.hypot(event.clientX - this.pointer.startX, event.clientY - this.pointer.startY);
      if (far < this.pointer.threshold) return;
      this.clearPressTimer();
      this.beginDrag();
      if (!this.drag) return;
    }
    this.carry(event);
  }

  release(event, { atLastSpot = false } = {}) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    const { entry, palette, longPressed } = this.pointer;
    this.clearPressTimer();
    this.pointer = null;
    if (this.drag) {
      this.drop(event, atLastSpot ? { over: this.drag.over } : {});
    } else if (longPressed) {
      // The help bubble is showing. Letting go is not a tap.
    } else if (palette) {
      this.onRunPaletteBlock(palette.make());
    } else if (entry.type === 'literal') {
      this.editNumber(entry);
    } else if (entry.type === 'nameslot') {
      this.editName(entry);
    } else if (entry.node.kind === 'note') {
      this.editNote(entry.node); // tapping a sticky note is for writing in it
    } else {
      this.onRunStack(entry.node.stack);
    }
  }

  cancel(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    this.abandon();
  }

  /** End whatever press or drag is going on without doing anything with it: a carried block stays where it is. */
  abandon() {
    if (!this.pointer) return;
    this.clearPressTimer();
    this.pointer = null;
    if (this.drag) this.drop({ clientX: 0, clientY: 0 }, { keepWhereItIs: true });
  }

  clearPressTimer() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  // ---- Help bubble and copying a stack -----------------------------------

  /** A block has been held down without moving: show its tip. */
  longPress() {
    this.pressTimer = null;
    const press = this.pointer;
    if (!press || this.drag) return;
    if (press.palette) {
      press.longPressed = true;
      this.bubble.show({ rect: press.palette.rect, text: press.palette.help });
    } else if (press.entry.type === 'block') {
      press.longPressed = true;
      this.showHelp(press.entry.node);
    }
    // A press on a number box is for typing, so it gets no bubble.
  }

  /** Show the tip for a block in the workspace, with a Copy stack button. */
  showHelp(node) {
    this.bubble.show({
      rect: node.el.getBoundingClientRect(),
      text: specOf(node.block).help,
      onCopy: () => this.copyStack(node.stack),
    });
  }

  /** Make a copy of a whole stack, a little way from the original. */
  copyStack(stack) {
    const copy = {
      x: stack.x + COPY_OFFSET,
      y: stack.y + COPY_OFFSET,
      blocks: stack.blocks.map(cloneBlock),
    };
    this.project.stacks.push(copy);
    uniquifyDefinition(this.project, copy); // two blocks of the same name would not make sense
    this.render();
    this.onChange();
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
      carried = { x: origin.x, y: origin.y, blocks: [palette.make()] };
      this.project.stacks.push(carried);
    } else if (this.pointer.duplicate) {
      // Shift-drag: carry a copy of the whole stack. It starts right on top of
      // the original, so wherever you grabbed it, you are still holding it there.
      const source = (entry.type === 'literal' ? entry.owner : entry.node).stack;
      origin = { x: source.x, y: source.y };
      carried = { x: source.x, y: source.y, blocks: source.blocks.map(cloneBlock) };
      this.project.stacks.push(carried);
      uniquifyDefinition(this.project, carried);
    } else {
      // A press on a number box picks up the block the number belongs to.
      const node = entry.type === 'literal' ? entry.owner : entry.node;
      origin = { x: node.stack.x + node.ax, y: node.stack.y + node.ay };
      carried = node.argOf
        ? detachReporter(this.project, node.argOf.block, node.argIndex, origin.x, origin.y)
        : detachCommands(this.project, node.stack, node.list, node.index, origin.x, origin.y);
    }

    // A block fresh from the palette starts out over the palette, so the delete tint waits until it has left.
    this.drag = { carried, grab: { x: pointer.x - origin.x, y: pointer.y - origin.y }, target: null, fromPalette: Boolean(palette), over: false };
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
    const over = this.isOverPalette(event.clientX, event.clientY);
    this.drag.over = over; // where the block was last, for a button-up we never hear
    if (!over) this.drag.fromPalette = false;
    this.onPaletteHover(over && !this.drag.fromPalette);
  }

  /** Let go of the carried stack: snap it, delete it, or leave it. */
  drop(event, { keepWhereItIs = false, over = this.isOverPalette(event.clientX, event.clientY) } = {}) {
    const { carried, target } = this.drag;
    this.drag = null;
    this.snapRing.setAttribute('visibility', 'hidden');
    this.onPaletteHover(false);

    let eaten = null;
    if (!keepWhereItIs && over) {
      eaten = this.ghostOf(carried);
      removeStack(this.project, carried);
    } else if (!keepWhereItIs && target) {
      this.snapTo(target, carried);
    }
    this.render();
    this.onChange();
    if (eaten) this.swallow(eaten);
  }

  /**
   * A copy of a stack that is about to be deleted, for showing it being eaten, or
   * null if nothing is there to eat it (or the student asked for less motion).
   */
  ghostOf(carried) {
    const layout = this.layoutOf(carried);
    const mouth = this.eater?.mouthPoint();
    if (!layout?.el || !mouth || prefersReducedMotion()) return null;
    const box = layout.el.getBoundingClientRect();
    // A picture only: it keeps none of the class names or ids the app looks things up by,
    // so nothing can mistake it for a block that is really on the page.
    const el = layout.el.cloneNode(true);
    el.setAttribute('class', 'ghost');
    for (const part of el.querySelectorAll('[data-nid]')) {
      part.removeAttribute('data-nid');
      part.setAttribute('class', 'ghost-part');
    }
    return { el, from: { x: carried.x, y: carried.y }, mouth, size: { w: box.width / this.view.zoom, h: box.height / this.view.zoom } };
  }

  /**
   * Show a deleted stack shrinking into the shark's mouth, then take it away. The
   * project has already lost it, so Undo brings it back whatever the picture is doing.
   */
  swallow({ el, from, mouth, size }) {
    const goal = this.toWorld(mouth.x, mouth.y);
    el.style.transform = `translate(${from.x}px, ${from.y}px)`;
    this.overlay.append(el);
    el.getBoundingClientRect(); // lets the browser see where it starts, so the move below is animated
    el.style.transition = `transform ${EAT_MS}ms cubic-bezier(0.4, 0, 0.9, 0.6), opacity ${EAT_MS}ms`;
    el.style.transform = `translate(${goal.x - (size.w * EATEN_SIZE) / 2}px, ${goal.y - (size.h * EATEN_SIZE) / 2}px) scale(${EATEN_SIZE})`;
    el.style.opacity = '0.25';
    this.eater.feed();
    setTimeout(() => el.remove(), EAT_MS + 80);
  }

  snapTo(target, carried) {
    const project = this.project;
    switch (target.kind) {
      case 'after':
        attachAfter(project, carried, target.node.list, target.node.index);
        break;
      case 'inside':
        attachInside(project, carried, target.node.block, target.mouth);
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
    // A sticky note floats: it snaps to nothing, and nothing snaps to it.
    if (first.kind === 'note') return null;
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
    // A stack that begins with a hat has a cap on top: it cannot hang from
    // anything. (It can still sit on top of another stack by its bottom.)
    const canHang = first.kind !== 'hat';

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
          // A reporter only fits a socket of its own kind: a yes-or-no block cannot go in a number box.
          node.args.forEach((_, i) => {
            if (!canPlug(node.block, i, carried.blocks[0])) return;
            consider(at(layout, node, node.docks[1 + i]), topPoint, { kind: 'socket', owner: node, index: i });
          });
        } else if (node.kind !== 'reporter' && node.kind !== 'note' && canHang) {
          // Nothing goes below a block that ends a stack (like stop).
          if (!node.spec.endsStack) consider(at(layout, node, node.tab), topPoint, { kind: 'after', node });
          node.mouths.forEach((mouth, k) => consider(at(layout, node, mouth), topPoint, { kind: 'inside', node, mouth: k }));
        }
      });
      // Blocks can go on top of a stack, unless it starts with a hat (its
      // cap is the top) or is a lone reporter.
      const head = layout.nodes[0];
      if (!reporter && !last.spec.endsStack && head.kind !== 'reporter' && head.kind !== 'hat' && head.kind !== 'note') {
        consider(at(layout, head, head.slot), bottomPoint, { kind: 'above', layout });
      }
    }
    return best;
  }

  // ---- Panning and zooming -----------------------------------------------

  applyView() {
    const { x, y, zoom } = this.view;
    this.viewport.setAttribute('transform', `translate(${x} ${y}) scale(${zoom})`);
  }

  setView(view) {
    this.view = view;
    this.applyView();
    this.bubble.hide();
  }

  /** Zoom in or out around the middle of the stage (used by the buttons). */
  zoomBy(factor) {
    const box = this.svg.getBoundingClientRect();
    this.setView(zoomAbout(this.view, factor, box.width / 2, box.height / 2));
  }

  /**
   * Zoom out, never in, so every stack fits above the bottom of the window,
   * keeping the point (px, py) of the workspace where it is. See zoomToFit.
   */
  fitHeight(px, py) {
    const box = this.svg.getBoundingClientRect();
    let contentBottom = 0;
    for (const el of this.stackLayer.children) {
      contentBottom = Math.max(contentBottom, (el.getBoundingClientRect().bottom - box.top - this.view.y) / this.view.zoom);
    }
    const zoom = zoomToFit({ contentBottom, anchorY: py, height: box.height });
    if (zoom < 1) this.setView(zoomAbout({ ...HOME_VIEW }, zoom, px, py));
  }

  resetView() {
    this.setView({ ...HOME_VIEW });
  }

  /**
   * Slide and zoom with the pointer. On empty space (the paper, or the gray
   * around it) one finger or the mouse slides the workspace, and two fingers
   * pinch to zoom. The wheel slides, and Ctrl with the wheel (which is also
   * what a trackpad pinch sends) zooms around the pointer. The turtle and the
   * palettes are not "empty space", so they keep their own behavior.
   */
  listenForView() {
    const isEmpty = (target) =>
      target === this.stage || target.classList?.contains('paper') || target.classList?.contains('paper-box');
    const fingers = new Map(); // pointer id -> where it is now

    const spread = () => {
      const [a, b] = [...fingers.values()];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    this.stage.addEventListener('pointerdown', (event) => {
      if (!isEmpty(event.target) || (event.pointerType === 'mouse' && event.button !== 0)) return;
      this.bubble.hide();
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.stage.setPointerCapture(event.pointerId);
    });

    this.stage.addEventListener('pointermove', (event) => {
      const before = fingers.get(event.pointerId);
      if (!before) return;
      if (fingers.size === 1) {
        this.setView(panBy(this.view, event.clientX - before.x, event.clientY - before.y));
        fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      } else if (fingers.size === 2) {
        const was = spread();
        fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const now = spread();
        const box = this.svg.getBoundingClientRect();
        let view = zoomAbout(this.view, now.distance / was.distance, was.x - box.left, was.y - box.top);
        view = panBy(view, now.x - was.x, now.y - was.y);
        this.setView(view);
      }
    });

    const lift = (event) => fingers.delete(event.pointerId);
    this.stage.addEventListener('pointerup', lift);
    this.stage.addEventListener('pointercancel', lift);

    this.stage.addEventListener(
      'wheel',
      (event) => {
        if (!isEmpty(event.target) && !this.svg.contains(event.target)) return; // e.g. scrolling the flyout
        event.preventDefault();
        if (event.ctrlKey) {
          const box = this.svg.getBoundingClientRect();
          const factor = Math.exp(-event.deltaY * 0.01);
          this.setView(zoomAbout(this.view, factor, event.clientX - box.left, event.clientY - box.top));
        } else {
          const lines = event.deltaMode === 1 ? 16 : 1; // a mouse wheel counts in lines
          this.setView(panBy(this.view, -event.deltaX * lines, -event.deltaY * lines));
        }
      },
      { passive: false },
    );
  }

  // ---- Writing on a sticky note ------------------------------------------

  /** Put a text box over a note so its words can be changed. Clicking away keeps them. Escape cancels. */
  editNote(node) {
    const box = node.el.getBoundingClientRect();
    const stageBox = this.stage.getBoundingClientRect();
    const area = document.createElement('textarea');
    area.className = 'note-input';
    area.maxLength = NOTE_MAX_CHARS;
    area.value = node.block.text ?? '';
    area.setAttribute('aria-label', 'Note');
    area.placeholder = 'Write what your program does';
    area.style.left = `${box.left - stageBox.left}px`;
    area.style.top = `${box.top - stageBox.top}px`;
    area.style.width = `${box.width}px`;
    area.style.height = `${Math.max(box.height, 96)}px`;
    this.stage.append(area);
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);

    let finished = false;
    const finish = (keep) => {
      if (finished) return;
      finished = true;
      const text = area.value;
      area.remove();
      if (keep && text !== (node.block.text ?? '')) {
        node.block.text = text;
        this.render();
        this.onChange();
      }
    };
    area.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') finish(false);
    });
    area.addEventListener('blur', () => finish(true));
  }

  // ---- Typing the name of a block you make, or of one of its inputs --------

  /**
   * Put a text box over a name box on a `to` block. Enter or clicking away
   * keeps what was typed, and Escape cancels. The first box is the block's
   * name and the others are its inputs: emptying an input takes it away, and
   * typing in the dashed one adds an input. If the name will not do (too long,
   * odd characters, already taken) nothing changes and the student is told why.
   */
  editName(entry) {
    const hat = entry.node.block;
    const box = entry.node.nameSlots[entry.index].el.getBoundingClientRect();
    const stageBox = this.stage.getBoundingClientRect();
    const isName = entry.index === 0;
    const input = document.createElement('input');
    input.className = 'number-input';
    input.type = 'text';
    input.maxLength = isName ? NAME_MAX : INPUT_MAX;
    input.value = entry.slot.text;
    input.setAttribute('aria-label', isName ? 'Name of this block' : 'Name of an input');
    input.style.left = `${box.left - stageBox.left}px`;
    input.style.top = `${box.top - stageBox.top}px`;
    input.style.width = `${Math.max(box.width, 96)}px`;
    input.style.height = `${box.height}px`;
    this.stage.append(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (keep) => {
      if (finished) return;
      finished = true;
      const text = input.value;
      input.remove();
      if (!keep || text.trim() === entry.slot.text) return;
      const result = isName ? renameDefinition(this.project, hat, text) : setInput(this.project, hat, entry.index - 1, text);
      if (!result.ok) {
        this.onMessage(result.error);
        return;
      }
      this.render();
      this.onChange();
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') finish(true);
      else if (event.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
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
