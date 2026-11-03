// TurtleLab: how blocks look. Works out their sizes and builds their SVG.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Two steps, kept apart on purpose:
//
//   1. LAYOUT (layoutStack) turns a stack from the project into a tree of
//      "nodes", one per block, each knowing its size, where its connection
//      points are, and where its neighbours and the things plugged into it
//      sit. It uses blockfactory.js, the shape generator from Turtle Blocks.
//   2. RENDER (renderStack) turns that tree into SVG elements.
//
// Every edit rebuilds the stacks it touched. Projects are small, so this is
// far simpler than patching the picture, and it can't get out of sync.
//
// Sizes are in screen pixels at zoom 1. A block's shape comes with
// "docks": the points where other things connect. Their order is fixed:
//   command  [ slot (top), socket 0, socket 1, ..., tab (bottom) ]
//   clamp    [ slot, socket 0, ..., mouth (where inner blocks start), tab ]
//   hat      like a command, but the first dock is a cap: nothing connects there
//   stop     like a command, but the last dock is a tail: nothing connects there
//   reporter [ plug (its left edge), socket 0, socket 1, ... ]

import { SVG } from './blockfactory.js';
import { BLOCKS, BODY_KEYS, mouthCount } from '../core/blocks-spec.js';
import { PALETTE_COLORS, NUMBER_COLORS } from './palette-colors.js';
import { formatNumber } from '../core/format.js';

export { formatNumber };

export const SCALE = 1.5; // Turtle Blocks' own default block scale
const FONT_SIZE = 10; // before SCALE is applied
const SMALL_FONT_SIZE = FONT_SIZE / 1.5; // the little labels beside sockets
export const FONT_STACK = 'Roboto, system-ui, sans-serif';
const SVG_NS = 'http://www.w3.org/2000/svg';

// How tall a number box is, and so how far apart stacked sockets are.
const BOX_HEIGHT = 31.5;
// How tall the mouth of an empty clamp is.
const EMPTY_MOUTH = 33;

// ---- Measuring text ------------------------------------------------------

let measureContext = null;

/** How wide a piece of text is when drawn at `fontSize` (before SCALE). */
export function textWidth(text, fontSize = FONT_SIZE) {
  measureContext ??= document.createElement('canvas').getContext('2d');
  measureContext.font = `${fontSize}px ${FONT_STACK}`;
  return measureContext.measureText(text).width;
}

function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// ---- Layout --------------------------------------------------------------

let nextId = 1;

/**
 * Fill in the label placeholders the shape generator leaves in its SVG. The
 * generator draws the small labels beside sockets in a small font. The words
 * between the mouths of an if else (else) are keywords a student has to read,
 * so with `fullSize` they are drawn in the same font as the block's name, and
 * moved down so they still sit in the middle of the band they label.
 */
function withLabels(markup, label, argLabels, fullSize = false) {
  let out = markup.replace('block_label', () => escapeXml(label));
  if (fullSize) {
    const size = FONT_SIZE; // the block's own text is drawn at this size inside the scaled shape
    out = out.replace(
      /(<text class="block-text" font-size=")([\d.]+)("[^>]*><tspan x="-?\d+" y=")(-?\d+)(">arg_label_\d+<\/tspan>)/g,
      (all, head, small, middle, y, tail) => `${head}${size}${middle}${Math.round(Number(y) + (size - small) * 0.35)}${tail}`,
    );
  }
  argLabels.forEach((text, i) => {
    out = out.replace(`arg_label_${i + 1}`, () => escapeXml(text));
  });
  return out.replace(/arg_label_\d+/g, '');
}

/** One number box (a socket's own number). */
function layoutLiteral(value) {
  const text = formatNumber(value);
  const expandX = Math.max(14, textWidth(text) + 8);
  const shape = new SVG();
  shape.setScale(SCALE);
  shape.setFontSize(FONT_SIZE);
  shape.setColors([NUMBER_COLORS.fill, NUMBER_COLORS.stroke]);
  shape.setExpand(expandX, 0, 0, 0);
  const markup = shape.basicBox().replace('block_label', () => escapeXml(text));
  return { id: nextId++, value, text, markup, w: shape.getWidth(), h: shape.getHeight(), plug: shape.docks[0] };
}

/**
 * Make the shape for a block.
 * `extra` is extra room: x (width), ys (height under each socket, for
 * something taller than a number box plugged in), and mouth (extra height
 * inside a clamp).
 */
function makeShape(spec, colors, extra) {
  const shape = new SVG();
  shape.setScale(SCALE);
  shape.setFontSize(FONT_SIZE);
  shape.setColors([colors.fill, colors.stroke]);
  shape.setExpand(extra.x, extra.ys[0] || 0, 0, spec.kind === 'clamp' ? 0 : extra.ys[1] || 0);
  if (spec.kind === 'clamp') shape.setMouthExtras(extra.mouths);
  shape.setExpandYs(extra.ys);
  const sockets = spec.args.map(() => true);
  let markup;
  if (spec.kind === 'clamp') {
    shape.setClampCount(mouthCount(spec));
    if (spec.args[0]?.type === 'boolean') {
      // The pointed socket of an if: the shape draws it itself, so it has no round sockets.
      shape.setBoolean(true);
      shape.setInnies([]);
    } else {
      shape.setInnies(sockets);
    }
    markup = shape.basicClamp();
  } else if (spec.kind === 'reporter' && sockets.length > 0) {
    // Reporters with sockets are drawn as a row by layoutRow, not by this.
    throw new Error(`${spec.label} needs a layout (infix or prefix)`);
  } else if (spec.kind === 'reporter') {
    markup = shape.basicBox();
  } else {
    shape.setInnies(sockets);
    // A hat has a cap on top instead of a slot, so nothing can go above it.
    if (spec.kind === 'hat') shape.setCap(true);
    // A block that ends a stack has a tail instead of a tab, so nothing can go below it.
    if (spec.endsStack) shape.setTail(true);
    markup = shape.basicBlock();
  }
  // For a clamp with a yes-or-no socket (if, if else) the generator's small labels sit
  // beside the mouths, not the sockets, so those are the words to give it.
  const mouthWords = spec.kind === 'clamp' && spec.args[0]?.type === 'boolean';
  const argLabels = mouthWords ? spec.mouthLabels ?? [] : spec.args.map((arg) => arg.label ?? '');
  return { shape, markup: withLabels(markup, spec.label, argLabels, mouthWords) };
}

/** How much wider than its minimum a block must be for its labels to fit. */
function widthNeeded(spec, minimumWidth) {
  const labelWidth = textWidth(spec.label);
  const argLabelWidth = Math.max(0, ...spec.args.map((arg) => textWidth(arg.label ?? '', SMALL_FONT_SIZE)));
  let required;
  // A reporter's label starts about 13 in from its left edge.
  if (spec.kind === 'reporter' && spec.args.length === 0) required = labelWidth + 17;
  else if (spec.kind === 'clamp') required = labelWidth + argLabelWidth + 30;
  else required = Math.max(labelWidth, argLabelWidth) + 22;
  return Math.max(spec.kind === 'reporter' && spec.args.length === 0 ? 14 : 0, required - minimumWidth);
}

// ---- Blocks laid out as a row ------------------------------------------------
//
// Math and comparison blocks read left to right, like a sum on paper:
//   [ 3 ] + [ 4 ]      [ 3 ] < [ 4 ]      random [ 1 ] [ 10 ]
// The sockets sit side by side inside the block. A number goes in as a white
// slot you can tap and type in, and another block plugs in over the slot, so
// the block just grows to hold it. Putting one block inside another is how
// you say which part of a sum is worked out first.
// This is TurtleLab's own drawing code. Number blocks borrow only the
// plug on their left edge (from basicBox); yes-or-no blocks are pills.

const SLOT_HEIGHT = 27; // a number slot
const ROW_PAD_V = 5; // above and below the row of sockets
const ROW_PAD_H = 7; // before the first and after the last item
const ROW_GAP = 7; // between items

let numberPlugCache = null;
/** Where a number block plugs in: the same on every one, measured from its top-left corner. */
function numberPlug() {
  if (!numberPlugCache) {
    const shape = new SVG();
    shape.setScale(SCALE);
    shape.basicBox();
    numberPlugCache = shape.docks[0];
  }
  return numberPlugCache;
}

/** A number in a socket inside a row block: a white slot. */
function layoutSlotLiteral(value, colors) {
  const text = formatNumber(value);
  const width = Math.max(32, textWidth(text) * SCALE + 14);
  const fontSize = FONT_SIZE * SCALE;
  const markup =
    `<svg xmlns="${SVG_NS}" width="${width + 2}" height="${SLOT_HEIGHT + 2}">` +
    `<rect x="1" y="1" width="${width}" height="${SLOT_HEIGHT}" rx="5" fill="#ffffff" stroke="${colors.stroke}" stroke-width="1.5"/>` +
    `<text class="block-text" font-size="${fontSize}" fill="#282828" text-anchor="middle" x="${1 + width / 2}" y="${1 + SLOT_HEIGHT / 2 + fontSize * 0.35}">${escapeXml(text)}</text>` +
    `</svg>`;
  return { id: nextId++, value, text, markup, w: width + 2, h: SLOT_HEIGHT + 2, plug: [0, 0] };
}

/** The outline of a yes-or-no block: a pill. */
function pillMarkup(width, height, colors) {
  const r = height / 2;
  const inset = 0.75; // so the outline is not cut off at the edge
  const right = width - inset;
  const bottom = height - inset;
  const path =
    `M ${r} ${inset} H ${right - r + inset} A ${r - inset} ${r - inset} 0 0 1 ${right - r + inset} ${bottom} ` +
    `H ${r} A ${r - inset} ${r - inset} 0 0 1 ${r} ${inset} Z`;
  return (
    `<svg xmlns="${SVG_NS}" width="${width}" height="${height}">` +
    `<path d="${path}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>` +
    `</svg>`
  );
}

/** Finish the layout of a math or comparison block (its sockets are already laid out in node.args). */
function layoutRow(node, spec, colors) {
  const boolean = spec.returns === 'boolean';
  const fontSize = FONT_SIZE * SCALE;
  const sizeOf = (arg) => arg.child ?? arg.literal;

  // The row is as tall as its tallest socket, with a little room above and below.
  const contentHeight = Math.max(SLOT_HEIGHT + 2, ...node.args.map((arg) => sizeOf(arg).h));
  const height = contentHeight + 2 * ROW_PAD_V;
  const plug = numberPlug();

  // The things in the row, left to right. The label sits between the two
  // sockets (infix), before them (prefix), or there is text on both sides of
  // one socket (wrap, for parentheses).
  const text = (value) => ({ text: value });
  let items;
  if (spec.layout === 'infix') items = [{ socket: 0 }, text(spec.label), { socket: 1 }];
  else if (spec.layout === 'wrap') items = [text(spec.label), { socket: 0 }, text(spec.endLabel)];
  else items = [text(spec.label), { socket: 0 }, { socket: 1 }];
  const gap = spec.layout === 'wrap' ? 3 : ROW_GAP;

  let x = boolean ? height / 2 + ROW_PAD_H - 2 : plug[0] + ROW_PAD_H;
  const socketAt = [];
  let labelMarkup = '';
  items.forEach((item, k) => {
    if (k > 0) x += gap;
    if (item.text !== undefined) {
      labelMarkup +=
        `<text class="block-text" font-size="${fontSize}" fill="#282828" text-anchor="start" x="${x}" y="${height / 2 + fontSize * 0.35}">${escapeXml(item.text)}</text>`;
      x += textWidth(item.text) * SCALE;
    } else {
      const box = sizeOf(node.args[item.socket]);
      socketAt[item.socket] = { x, y: ROW_PAD_V + (contentHeight - box.h) / 2 };
      x += box.w;
    }
  });
  const width = x + (boolean ? height / 2 + ROW_PAD_H - 2 : ROW_PAD_H);
  let outline;
  let size;
  if (boolean) {
    outline = pillMarkup(width, height, colors);
    size = { w: width, h: height };
  } else {
    const shape = new SVG();
    shape.setScale(SCALE);
    shape.setFontSize(FONT_SIZE);
    shape.setColors([colors.fill, colors.stroke]);
    // basicBox is 13.5 wide and 31.5 tall with no stretch, and grows by SCALE per unit of stretch.
    shape.setExpand((width - 13.5) / SCALE, (height - 31.5) / SCALE, 0, 0);
    outline = shape.basicBox().replace('block_label', '');
    size = { w: shape.getWidth(), h: shape.getHeight() };
  }
  node.markup = outline.replace(/<\/svg>\s*$/, `${labelMarkup}</svg>`);
  node.w = size.w;
  node.h = size.h;

  // Plug on the left; each socket's dock is where a block's plug must land
  // for that block to sit exactly over the slot.
  const ownPlug = boolean ? [1, height / 2] : plug;
  node.docks = [ownPlug, ...socketAt.map((at) => [at.x + plug[0], at.y + plug[1]])];
  node.slot = node.docks[0];
  node.tab = node.docks[node.docks.length - 1];
  node.mouths = [];
  node.argPos = socketAt.map((at) => ({ x: at.x, y: at.y }));
  return node;
}

// ---- Sticky notes --------------------------------------------------------------
//
// A note is a pale yellow square with a folded corner and the words wrapped
// inside. It connects to nothing, so it only needs a size. This is TurtleLab's
// own drawing, not Sugar's.

const NOTE_WIDTH = 200;
const NOTE_TEXT_WIDTH = 160; // narrower than the note, so words stay clear of the folded corner
const NOTE_FONT = 14;
const NOTE_LINE = 18;
const NOTE_MIN_LINES = 3;
const NOTE_MAX_LINES = 16;
const NOTE_FOLD = 16;

/** Break text into lines no wider than `maxWidth` pixels. Words wider than a line are split. */
function wrapText(text, maxWidth, fontSize) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      let rest = word;
      // A word wider than a whole line is cut into pieces that fit.
      while (textWidth(rest, fontSize) > maxWidth) {
        let n = rest.length;
        while (n > 1 && textWidth(rest.slice(0, n), fontSize) > maxWidth) n -= 1;
        if (line) lines.push(line);
        line = '';
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      const longer = line ? `${line} ${rest}` : rest;
      if (textWidth(longer, fontSize) <= maxWidth) {
        line = longer;
      } else {
        lines.push(line);
        line = rest;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Lay out a sticky note: its size, and the SVG for it. */
function layoutNote(node, spec, colors) {
  const text = node.block.text ?? '';
  let lines = text === '' ? ['Tap to write a note.'] : wrapText(text, NOTE_TEXT_WIDTH, NOTE_FONT);
  if (lines.length > NOTE_MAX_LINES) lines = [...lines.slice(0, NOTE_MAX_LINES - 1), `${lines[NOTE_MAX_LINES - 1]}...`.slice(0, 40)];
  const height = 16 + Math.max(lines.length, NOTE_MIN_LINES) * NOTE_LINE + 10;
  const width = NOTE_WIDTH;
  const ink = text === '' ? '#9a8f4a' : '#4a4100';
  const rows = lines
    .map((line, i) => `<tspan x="12" y="${26 + i * NOTE_LINE}">${escapeXml(line)}</tspan>`)
    .join('');
  node.markup =
    `<svg xmlns="${SVG_NS}" width="${width}" height="${height}">` +
    `<path d="M1 1 H${width - NOTE_FOLD - 1} L${width - 1} ${NOTE_FOLD + 1} V${height - 1} H1 Z" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M${width - NOTE_FOLD - 1} 1 V${NOTE_FOLD + 1} H${width - 1} Z" fill="#e7d57e" stroke="${colors.stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<text class="block-text note-text" font-size="${NOTE_FONT}" fill="${ink}">${rows}</text>` +
    `</svg>`;
  node.w = width;
  node.h = height;
  // A note connects to nothing. These keep the code that expects docks happy.
  node.docks = [[0, 0], [0, 0]];
  node.slot = [0, 0];
  node.tab = [0, 0];
  node.mouths = [];
  node.argPos = [];
  return node;
}

/**
 * Work out the size and shape of one block and everything plugged into it
 * or inside it. Positions are relative to the block's own top-left corner
 * until placeNode() makes them absolute.
 */
export function layoutBlock(block) {
  const spec = BLOCKS[block.op];
  const colors = PALETTE_COLORS[spec.palette];
  const node = { id: nextId++, block, spec, kind: spec.kind, args: [], bodies: [], ax: 0, ay: 0 };
  if (spec.kind === 'note') return layoutNote(node, spec, colors);

  // What is in each socket: a number box, another block plugged in, or (for
  // a pointed yes-or-no socket with nothing in it) nothing: the notch is the
  // empty socket.
  spec.args.forEach((socket, i) => {
    const value = block.args?.[i];
    if (value !== null && typeof value === 'object') node.args.push({ child: layoutBlock(value) });
    else if (socket.type === 'boolean') node.args.push({});
    else node.args.push({ literal: spec.layout ? layoutSlotLiteral(value, colors) : layoutLiteral(value) });
  });

  if (spec.layout) return layoutRow(node, spec, colors);

  // Make room for any socket content taller than a number box.
  const heightOf = (arg) => (arg.child ? arg.child.h : arg.literal ? arg.literal.h : 0);
  const extra = {
    x: 0,
    ys: node.args.map((arg) => Math.max(0, heightOf(arg) - BOX_HEIGHT) / SCALE),
    mouths: new Array(mouthCount(spec)).fill(0),
  };

  // Pick the width from the smallest version of this shape.
  const smallest = makeShape(spec, colors, extra).shape;
  extra.x = widthNeeded(spec, smallest.getWidth() / SCALE);

  let made = makeShape(spec, colors, extra);

  node.bodyPos = [];
  if (spec.kind === 'clamp') {
    // Stack the blocks that go inside each mouth, one mouth at a time from the
    // top, and make each mouth big enough to hold what is in it. (Making an
    // earlier mouth bigger pushes the later ones down, which is why they go in order.)
    for (let k = 0; k < mouthCount(spec); k += 1) {
      const children = (block[BODY_KEYS[k]] ?? []).map(layoutBlock);
      const mouth = made.shape.docks[1 + spec.args.length + k];
      const positions = chainPositions(children, mouth);
      node.bodies.push(children);
      node.bodyPos.push(positions);
      if (children.length > 0) {
        const last = children[children.length - 1];
        const bodyBottom = positions[children.length - 1].y + last.h;
        extra.mouths[k] = Math.max(0, bodyBottom - mouth[1] - EMPTY_MOUTH) / SCALE;
        made = makeShape(spec, colors, extra);
      }
    }
  }

  const { shape, markup } = made;
  node.markup = markup;
  node.w = shape.getWidth();
  node.h = shape.getHeight();
  node.docks = shape.docks;
  node.slot = shape.docks[0]; // top connection (commands) or plug (reporters)
  node.tab = shape.docks[shape.docks.length - 1]; // bottom connection
  node.mouths = shape.docks.slice(1 + spec.args.length, 1 + spec.args.length + mouthCount(spec));

  // Where each socket's content sits, relative to this block.
  node.argPos = node.args.map((arg, i) => {
    const socket = shape.docks[1 + i];
    const plug = arg.child ? arg.child.slot : arg.literal ? arg.literal.plug : [0, 0];
    return { x: socket[0] - plug[0], y: socket[1] - plug[1] };
  });
  return node;
}

/**
 * Where each node in a row of connected blocks goes, relative to the
 * thing they hang from. The first block's top connection lands on `anchor`
 * (or the top-left corner if there is no anchor) and each block after it
 * hangs from the one before.
 */
function chainPositions(nodes, anchor = null) {
  const positions = [];
  nodes.forEach((node, k) => {
    if (k === 0) {
      positions.push(anchor ? { x: anchor[0] - node.slot[0], y: anchor[1] - node.slot[1] } : { x: 0, y: 0 });
    } else {
      const before = nodes[k - 1];
      const at = positions[k - 1];
      positions.push({ x: at.x + before.tab[0] - node.slot[0], y: at.y + before.tab[1] - node.slot[1] });
    }
  });
  return positions;
}

/** Make positions absolute (relative to the stack) and note where each block lives. */
function placeNode(node, x, y, home) {
  node.ax = x;
  node.ay = y;
  Object.assign(node, home); // stack, list, index, or argOf and argIndex
  node.args.forEach((arg, i) => {
    arg.ax = x + node.argPos[i].x;
    arg.ay = y + node.argPos[i].y;
    arg.owner = node;
    arg.index = i;
    if (arg.child) placeNode(arg.child, arg.ax, arg.ay, { stack: home.stack, argOf: node, argIndex: i });
  });
  node.bodies.forEach((children, k) => {
    children.forEach((child, j) => {
      placeNode(child, x + node.bodyPos[k][j].x, y + node.bodyPos[k][j].y, {
        stack: home.stack,
        list: node.block[BODY_KEYS[k]],
        index: j,
      });
    });
  });
}

/** Lay out a whole stack. The result is what the editor keeps for hit testing. */
export function layoutStack(stack) {
  const nodes = stack.blocks.map(layoutBlock);
  const positions = chainPositions(nodes);
  nodes.forEach((node, k) => {
    placeNode(node, positions[k].x, positions[k].y, { stack, list: stack.blocks, index: k });
  });
  return { stack, nodes };
}

/** Call `visit` for every block node in a layout, including nested ones. */
export function walkNodes(layout, visit) {
  const walk = (node) => {
    visit(node);
    node.args.forEach((arg) => arg.child && walk(arg.child));
    node.bodies.forEach((children) => children.forEach(walk));
  };
  layout.nodes.forEach(walk);
}

// ---- Rendering -----------------------------------------------------------

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

/**
 * Build the SVG for a laid out stack.
 * `register(id, entry)` is called for everything that can be pointed at, so
 * the editor can find out what was clicked.
 */
export function renderStack(layout, register) {
  const group = svgElement('g', {
    class: 'stack',
    transform: `translate(${layout.stack.x} ${layout.stack.y})`,
  });
  const renderNode = (node) => {
    const el = svgElement('g', {
      class: `node ${node.kind}`,
      transform: `translate(${node.ax} ${node.ay})`,
      'data-nid': node.id,
    });
    el.innerHTML = node.markup;
    group.append(el);
    node.el = el;
    register(node.id, { type: 'block', node });
    node.args.forEach((arg) => {
      if (arg.child) {
        renderNode(arg.child);
      } else if (arg.literal) {
        const box = svgElement('g', {
          class: 'node literal',
          transform: `translate(${arg.ax} ${arg.ay})`,
          'data-nid': arg.literal.id,
        });
        box.innerHTML = arg.literal.markup;
        group.append(box);
        arg.el = box;
        register(arg.literal.id, { type: 'literal', owner: node, index: arg.index, arg });
      }
    });
    node.bodies.forEach((children) => children.forEach(renderNode));
  };
  layout.nodes.forEach(renderNode);
  layout.el = group;
  return group;
}

/** The size of a laid out stack: from its top-left corner to the far corner. */
export function stackBounds(layout) {
  let width = 0;
  let height = 0;
  walkNodes(layout, (node) => {
    width = Math.max(width, node.ax + node.w);
    height = Math.max(height, node.ay + node.h);
    node.args.forEach((arg) => {
      const w = arg.child ? arg.child.w : arg.literal ? arg.literal.w : 0;
      const h = arg.child ? arg.child.h : arg.literal ? arg.literal.h : 0;
      width = Math.max(width, arg.ax + w);
      height = Math.max(height, arg.ay + h);
    });
  });
  return { width, height };
}
