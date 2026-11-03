// Turtle Draw: how blocks look. Works out their sizes and builds their SVG.
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
//   reporter [ plug (its left edge) ]

import { SVG } from './blockfactory.js';
import { BLOCKS } from '../core/blocks-spec.js';
import { PALETTE_COLORS, NUMBER_COLORS } from './palette-colors.js';

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

/** The text shown in a number box. */
export function formatNumber(value) {
  if (value === null || value === undefined) return '';
  return String(Number(Number(value).toPrecision(10)));
}

// ---- Layout --------------------------------------------------------------

let nextId = 1;

/** Fill in the label placeholders the shape generator leaves in its SVG. */
function withLabels(markup, label, argLabels) {
  let out = markup.replace('block_label', () => escapeXml(label));
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
 * `extra` is extra room: x (width), y (below socket 0), y2 (below socket 1),
 * and mouth (extra height inside a clamp).
 */
function makeShape(spec, colors, extra) {
  const shape = new SVG();
  shape.setScale(SCALE);
  shape.setFontSize(FONT_SIZE);
  shape.setColors([colors.fill, colors.stroke]);
  shape.setExpand(extra.x, extra.y, 0, spec.kind === 'clamp' ? extra.mouth : extra.y2);
  const sockets = spec.args.map(() => true);
  let markup;
  if (spec.kind === 'clamp') {
    shape.setInnies(sockets);
    shape.setClampCount(1);
    markup = shape.basicClamp();
  } else if (spec.kind === 'reporter') {
    if (sockets.length > 0) throw new Error('reporters with sockets are not supported yet');
    markup = shape.basicBox();
  } else {
    shape.setInnies(sockets);
    // A hat has a cap on top instead of a slot, so nothing can go above it.
    if (spec.kind === 'hat') shape.setCap(true);
    markup = shape.basicBlock();
  }
  const argLabels = spec.args.map((arg) => arg.label ?? '');
  return { shape, markup: withLabels(markup, spec.label, argLabels) };
}

/** How much wider than its minimum a block must be for its labels to fit. */
function widthNeeded(spec, minimumWidth) {
  const labelWidth = textWidth(spec.label);
  const argLabelWidth = Math.max(0, ...spec.args.map((arg) => textWidth(arg.label ?? '', SMALL_FONT_SIZE)));
  let required;
  // A reporter's label starts about 13 in from its left edge.
  if (spec.kind === 'reporter') required = labelWidth + 17;
  else if (spec.kind === 'clamp') required = labelWidth + argLabelWidth + 30;
  else required = Math.max(labelWidth, argLabelWidth) + 22;
  return Math.max(spec.kind === 'reporter' ? 14 : 0, required - minimumWidth);
}

/**
 * Work out the size and shape of one block and everything plugged into it
 * or inside it. Positions are relative to the block's own top-left corner
 * until placeNode() makes them absolute.
 */
export function layoutBlock(block) {
  const spec = BLOCKS[block.op];
  const colors = PALETTE_COLORS[spec.palette];
  const node = { id: nextId++, block, spec, kind: spec.kind, args: [], body: [], ax: 0, ay: 0 };

  // What is in each socket: a number box, or another block plugged in.
  spec.args.forEach((_, i) => {
    const value = block.args?.[i];
    node.args.push(
      value !== null && typeof value === 'object'
        ? { child: layoutBlock(value) }
        : { literal: layoutLiteral(value) },
    );
  });

  // Make room for any socket content taller than a number box.
  const heightOf = (arg) => (arg.child ? arg.child.h : arg.literal.h);
  const extra = { x: 0, y: 0, y2: 0, mouth: 0 };
  if (node.args[0]) extra.y = Math.max(0, heightOf(node.args[0]) - BOX_HEIGHT) / SCALE;
  if (node.args[1]) extra.y2 = Math.max(0, heightOf(node.args[1]) - BOX_HEIGHT) / SCALE;

  // Pick the width from the smallest version of this shape.
  const smallest = makeShape(spec, colors, extra).shape;
  extra.x = widthNeeded(spec, smallest.getWidth() / SCALE);

  let made = makeShape(spec, colors, extra);

  if (spec.kind === 'clamp') {
    // Stack the blocks that go inside the mouth, then make the mouth big
    // enough to hold them.
    node.body = (block.body ?? []).map(layoutBlock);
    const mouth = made.shape.docks[1 + spec.args.length];
    node.bodyPos = chainPositions(node.body, mouth);
    if (node.body.length > 0) {
      const last = node.body[node.body.length - 1];
      const bodyBottom = node.bodyPos[node.body.length - 1].y + last.h;
      extra.mouth = Math.max(0, bodyBottom - mouth[1] - EMPTY_MOUTH) / SCALE;
      made = makeShape(spec, colors, extra);
    }
  }

  const { shape, markup } = made;
  node.markup = markup;
  node.w = shape.getWidth();
  node.h = shape.getHeight();
  node.docks = shape.docks;
  node.slot = shape.docks[0]; // top connection (commands) or plug (reporters)
  node.tab = shape.docks[shape.docks.length - 1]; // bottom connection
  node.mouth = spec.kind === 'clamp' ? shape.docks[1 + spec.args.length] : null;

  // Where each socket's content sits, relative to this block.
  node.argPos = node.args.map((arg, i) => {
    const socket = shape.docks[1 + i];
    const plug = arg.child ? arg.child.slot : arg.literal.plug;
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
  node.body.forEach((child, j) => {
    placeNode(child, x + node.bodyPos[j].x, y + node.bodyPos[j].y, {
      stack: home.stack,
      list: node.block.body,
      index: j,
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
    node.body.forEach(walk);
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
      } else {
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
    node.body.forEach(renderNode);
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
      const w = arg.child ? arg.child.w : arg.literal.w;
      const h = arg.child ? arg.child.h : arg.literal.h;
      width = Math.max(width, arg.ax + w);
      height = Math.max(height, arg.ay + h);
    });
  });
  return { width, height };
}
