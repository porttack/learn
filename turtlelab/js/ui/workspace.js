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
import { colorOfArgs } from '../core/color.js';
import { openColorPicker } from './color-picker.js';
import { renameDefinition, setInput, uniquifyDefinition } from '../core/definitions.js';
import { INPUT_MAX, NAME_MAX } from '../core/names.js';
import {
  LETTERING_MAX_CHARS, LETTER_FONTS, cleanFont, cleanLetteringText, letteringStrokes, letteringWidth,
} from '../core/lettering.js';
import { HOME_VIEW, FIT_MIN_ZOOM, zoomAbout, panBy, zoomToFit, fitBlocksView } from '../core/view.js';
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
const CLICK_SLOP = 6; // how far a press on the paper may move and still be a click (more is a slide)
const TOUCH_DRAG_THRESHOLD = 10; // fingers wobble more than mice
const LONG_PRESS_MS = 500; // how long to hold a block for its help bubble
const COPY_OFFSET = 30; // how far a copied stack lands from the original
const EAT_MS = 380; // how long a deleted stack takes to be eaten
const SPIT_MS = 520; // and how long a stack that Undo brought back takes to fly out of the shark
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
   * @param {(x: number, y: number, stackRect: object | null) => boolean} [options.isOverPalette] for deleting:
   *        the pointer's place, and the rectangle of the stack being carried
   * @param {(hovering: boolean) => void} [options.onPaletteHover]
   * @param {{ mouthPoint: (options?: {raised?: boolean}) => ({x: number, y: number} | null), feed: (meal?: { node: Element, width: number, height: number }) => void, spit?: (ms: number) => void }} [options.eater]
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
    onPaperClick = () => {},
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
    this.onPaperClick = onPaperClick; // (clientX, clientY): a click, not a slide, on the paper or the gray round it
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
    // (Deferred a moment: if the mouse-up comes right behind it, that is the end of the drag, not this.)
    this.svg.addEventListener('lostpointercapture', (event) => setTimeout(() => this.cancel(event), 0));
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
      if (entry.slot.editor === 'text') this.editText(entry);
      else if (entry.slot.editor === 'font') this.chooseFont(entry);
      else if (entry.slot.editor === 'color') this.chooseColor(entry);
      else this.editName(entry);
    } else if (entry.node.kind === 'note') {
      this.editNote(entry.node); // tapping a sticky note is for writing in it
    } else {
      this.onRunStack(entry.node.stack);
    }
  }

  /**
   * The browser took the pointer away (a cancel, or it let go of its hold on it). A block
   * being carried is dropped where it last was, the way a lost mouse-up is: over the trash
   * can that deletes it, anywhere else it stays. A press that never became a drag is just ended.
   */
  cancel(event) {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    if (this.drag) this.release(event, { atLastSpot: true });
    else this.abandon();
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
    const over = this.isOverPalette(event.clientX, event.clientY, layout.el.getBoundingClientRect());
    this.drag.over = over; // where the block was last, for a button-up we never hear
    if (!over) this.drag.fromPalette = false;
    this.onPaletteHover(over && !this.drag.fromPalette);
  }

  /** Let go of the carried stack: snap it, delete it, or leave it. */
  drop(event, { keepWhereItIs = false, over = null } = {}) {
    const { carried, target } = this.drag;
    const stackRect = this.layoutOf(carried)?.el.getBoundingClientRect() ?? null;
    over ??= this.isOverPalette(event.clientX, event.clientY, stackRect);
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
    this.eater.feed({ node: el.cloneNode(true), width: size.w, height: size.h }); // (a picture of the stack, in case the shark is sick later)
    setTimeout(() => el.remove(), EAT_MS + 80);
  }

  /**
   * An Undo brought a deleted stack back, so the shark spits it out: a copy flies from the shark's mouth to where the stack is, growing
   * to full size, while the real stack waits out of sight (it is still clickable, so a quick click is not lost) and appears where the copy lands. Nothing happens for someone who asked for
   * less motion, or when the shark is not showing.
   */
  spitOut(stack) {
    const layout = this.layoutOf(stack);
    const mouth = this.eater?.mouthPoint({ raised: true });
    if (!layout?.el || !mouth || prefersReducedMotion()) return;
    const real = layout.el;
    const box = real.getBoundingClientRect();
    const size = { w: box.width / this.view.zoom, h: box.height / this.view.zoom };
    const ghost = real.cloneNode(true);
    ghost.setAttribute('class', 'ghost');
    for (const part of ghost.querySelectorAll('[data-nid]')) {
      part.removeAttribute('data-nid');
      part.setAttribute('class', 'ghost-part');
    }
    const from = this.toWorld(mouth.x, mouth.y);
    ghost.style.transform = `translate(${from.x - (size.w * EATEN_SIZE) / 2}px, ${from.y - (size.h * EATEN_SIZE) / 2}px) scale(${EATEN_SIZE})`;
    ghost.style.opacity = '0.25';
    real.style.opacity = '0'; // out of sight while the copy flies, but still there to click if someone is quick
    this.overlay.append(ghost);
    ghost.getBoundingClientRect(); // lets the browser see where it starts, so the move below is animated
    ghost.style.transition = `transform ${SPIT_MS}ms cubic-bezier(0.1, 0.7, 0.3, 1), opacity ${SPIT_MS}ms`;
    ghost.style.transform = `translate(${stack.x}px, ${stack.y}px)`;
    ghost.style.opacity = '1';
    this.eater.spit?.(SPIT_MS + 200);
    setTimeout(() => {
      ghost.remove();
      real.style.opacity = '';
    }, SPIT_MS + 40);
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
   * Zoom out (never in) and slide so that every stack is inside the window, so all the code
   * can be seen. `leftInset` is how many pixels along the left edge are taken by the palettes.
   * With `normal` the code is not made smaller than normal size (1) however big it is: its top left
   * corner is brought into the window and the rest can be slid into view. With no blocks it just
   * goes back to the starting view.
   */
  fitBlocks(leftInset = 0, { normal = false } = {}) {
    const box = this.svg.getBoundingClientRect();
    const content = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const el of this.stackLayer.children) {
      const r = el.getBoundingClientRect();
      content.left = Math.min(content.left, (r.left - box.left - this.view.x) / this.view.zoom);
      content.top = Math.min(content.top, (r.top - box.top - this.view.y) / this.view.zoom);
      content.right = Math.max(content.right, (r.right - box.left - this.view.x) / this.view.zoom);
      content.bottom = Math.max(content.bottom, (r.bottom - box.top - this.view.y) / this.view.zoom);
    }
    if (content.left > content.right) {
      this.resetView();
      return;
    }
    const margin = 12;
    this.setView(fitBlocksView({
      content,
      room: { left: leftInset + margin, top: margin, right: box.width - margin, bottom: box.height - margin },
      minZoom: normal ? 1 : FIT_MIN_ZOOM,
    }));
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
    let press = null; // the one press that might turn out to be a click: where it began, and whether it has moved or been joined by another finger

    const spread = () => {
      const [a, b] = [...fingers.values()];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    this.stage.addEventListener('pointerdown', (event) => {
      if (!isEmpty(event.target) || (event.pointerType === 'mouse' && event.button !== 0)) return;
      this.bubble.hide();
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      press = fingers.size === 1 ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false } : { ...press, moved: true };
      this.stage.setPointerCapture(event.pointerId);
    });

    this.stage.addEventListener('pointermove', (event) => {
      const before = fingers.get(event.pointerId);
      if (!before) return;
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > CLICK_SLOP) press.moved = true;
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
    this.stage.addEventListener('pointerup', (event) => {
      // Pressed and let go in the same place, on the paper or the gray round it, with one finger: a click (a drag was a slide, and was not).
      const clicked = press && press.id === event.pointerId && !press.moved && fingers.size === 1;
      if (press && press.id === event.pointerId) press = null;
      lift(event);
      if (clicked) this.onPaperClick(event.clientX, event.clientY);
    });
    this.stage.addEventListener('pointercancel', (event) => {
      if (press && press.id === event.pointerId) press = null;
      lift(event);
    });

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

  // ---- Typing the words of a write block -----------------------------------

  /**
   * Put a text box over the words on a write block. Enter or clicking away keeps what was typed, and
   * Escape cancels. Letters the script cannot draw are dropped, and the student is told if that happened.
   */
  editText(entry) {
    const block = entry.node.block;
    const box = entry.node.nameSlots[entry.index].el.getBoundingClientRect();
    const stageBox = this.stage.getBoundingClientRect();
    const input = document.createElement('input');
    input.className = 'number-input';
    input.type = 'text';
    const textSlot = specOf(block).textSlot;
    const max = textSlot.max ?? LETTERING_MAX_CHARS;
    input.maxLength = max;
    input.value = block.text ?? '';
    input.setAttribute('aria-label', block.op === 'ask' ? 'The question to ask' : 'The words to write');
    input.style.left = `${box.left - stageBox.left}px`;
    input.style.top = `${box.top - stageBox.top}px`;
    input.style.width = `${Math.max(box.width, 220)}px`;
    input.style.height = `${box.height}px`;
    this.stage.append(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (keep) => {
      if (finished) return;
      finished = true;
      const typed = input.value;
      input.remove();
      if (!keep) return;
      const text = cleanLetteringText(typed, max);
      if (text !== typed) this.onMessage(block.op === 'ask' ? 'Some of those letters cannot be shown. Use the letters, numbers and symbols on an English keyboard.' : 'Some of those letters cannot be written. The script has the letters, numbers and symbols on an English keyboard.');
      if (text === (block.text ?? '')) return;
      block.text = text;
      this.render();
      this.onChange();
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') finish(true);
      else if (event.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  // ---- Choosing the font of a write block -----------------------------------

  /** The words as a small picture in one font, for the list (the same lines the turtle would draw). */
  fontPreview(words, fontId) {
    const SIZE = 22;
    const ABOVE = 5;
    const BELOW = 9;
    const width = Math.ceil(letteringWidth(words, SIZE, fontId)) + 6;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(SIZE + ABOVE + BELOW));
    svg.setAttribute('class', 'font-preview');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const parts = [];
    for (const stroke of letteringStrokes(words, SIZE, fontId)) {
      stroke.forEach(([along, up], i) => parts.push(`${i === 0 ? 'M' : 'L'}${(3 + along).toFixed(1)} ${(ABOVE + SIZE - up).toFixed(1)}`));
    }
    path.setAttribute('d', parts.join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#222');
    path.setAttribute('stroke-width', '1.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    return svg;
  }

  /** Take the font list away, if it is showing. */
  closeFontMenu() {
    this.fontMenuClose?.();
  }

  /**
   * Open the list of fonts under a write block's font box. Each choice shows the block's own words in that font, so you
   * can see what you are picking. Choosing one changes the block (one undo step); clicking anywhere else, or Escape,
   * closes the list and changes nothing.
   */
  chooseFont(entry) {
    this.closeFontMenu();
    const block = entry.node.block;
    const box = entry.node.nameSlots[entry.index].el.getBoundingClientRect();
    const stageBox = this.stage.getBoundingClientRect();
    const current = cleanFont(block.font);
    const words = 'Hello'; // (the words in the menu are only to show what each font looks like)

    const menu = document.createElement('div');
    menu.className = 'font-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Font for the words');
    const options = LETTER_FONTS.map((font) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'font-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(font.id === current));
      option.dataset.font = font.id;
      option.title = font.tip;
      const name = document.createElement('span');
      name.className = 'font-name';
      name.textContent = font.label;
      option.append(name, this.fontPreview(words, font.id));
      option.addEventListener('click', () => {
        close();
        if (font.id === current) return;
        block.font = font.id;
        this.render();
        this.onChange();
      });
      menu.append(option);
      return option;
    });

    let closed = false;
    const away = (event) => {
      if (!menu.contains(event.target)) close();
    };
    const keys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const at = options.indexOf(document.activeElement);
        const next = (at + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      }
    };
    const close = () => {
      if (closed) return;
      closed = true;
      this.fontMenuClose = null;
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('keydown', keys, true);
      menu.remove();
    };
    this.fontMenuClose = close;

    this.stage.append(menu);
    // Under the box if there is room, otherwise above it, and never off the right side.
    const room = this.stage.clientHeight - (box.bottom - stageBox.top) - 8;
    const above = menu.offsetHeight > room && box.top - stageBox.top > menu.offsetHeight;
    menu.style.left = `${Math.max(4, Math.min(box.left - stageBox.left, this.stage.clientWidth - menu.offsetWidth - 4))}px`;
    menu.style.top = `${above ? box.top - stageBox.top - menu.offsetHeight - 4 : box.bottom - stageBox.top + 4}px`;
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', keys, true);
    options[LETTER_FONTS.findIndex((font) => font.id === current)].focus();
  }

  /**
   * Open the color picker under the color box of a set color or fill screen block (js/ui/color-picker.js). It only changes the block's three
   * numbers, which stay where they are: the block shows each change as it is made, and a finished change is one undo step. If another block is
   * plugged into one of the sockets there is no one color to pick, so it says so instead.
   */
  chooseColor(entry) {
    this.colorPickerClose?.();
    this.closeFontMenu();
    const block = entry.node.block;
    const spec = entry.node.spec;
    const color = colorOfArgs(block.args, spec.args.map((arg) => arg.default));
    if (color === null) {
      this.onMessage('This color comes from other blocks (a variable, an input or random, say), so it is N/A until the program runs and there is no one color to pick. Take the blocks out of the sockets and the color box picks for you.');
      return;
    }
    const anchor = entry.node.nameSlots[entry.index].el.getBoundingClientRect();
    const picker = openColorPicker({
      stage: this.stage,
      anchor,
      color,
      title: spec.label,
      onLive: (next) => {
        block.args = [next[0], next[1], next[2]];
        this.render();
      },
      onCommit: () => this.onChange(),
      onClose: () => {
        this.colorPickerClose = null;
      },
    });
    this.colorPickerClose = picker.close;
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
