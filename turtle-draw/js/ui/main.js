// Turtle Draw: starts the app.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Milestone a: no block editor yet. This runs a few built-in demo programs
// so the turtle, the canvas, the interpreter and the scheduler can be tried
// together. The block editor replaces the demo picker next.
//
// For developers: the address can carry ?demo=flower&speed=instant&autorun=1
// to pick a demo and speed and run it as soon as the page loads.

import { APP_NAME } from '../app-info.js';
import { Turtle } from '../core/turtle.js';
import { Scheduler, SPEEDS } from '../core/scheduler.js';
import { runBlocks, createContext, RunError } from '../core/interpreter.js';
import { findMainStack, validateProject, FORMAT_ID, FORMAT_VERSION } from '../core/project.js';
import { CanvasView } from './canvas-view.js';

// ---- Demo programs ------------------------------------------------------

const b = (op, ...args) => ({ op, args });
const repeat = (n, ...body) => ({ op: 'repeat', args: [n], body });

const DEMOS = {
  square: {
    label: 'Square',
    blocks: [b('clean'), repeat(4, b('forward', 150), b('right', 90))],
  },
  flower: {
    label: 'Flower (arcs)',
    blocks: [
      b('clean'),
      b('fillscreen', 25, 25, 70),
      b('setcolor', 255, 120, 200),
      b('setpensize', 4),
      repeat(12, repeat(2, b('arc', 60, 140), b('right', 120)), b('right', 30)),
    ],
  },
  arcs: {
    label: 'Right and left arcs',
    blocks: [
      b('clean'),
      b('setcolor', 220, 0, 0),
      b('arc', 90, 120),
      b('penup'),
      b('setxy', 0, 0),
      b('setheading', 0),
      b('pendown'),
      b('setcolor', 0, 0, 220),
      b('arc', -90, 120),
    ],
  },
  star: {
    label: 'Gold star (fill)',
    blocks: [
      b('clean'),
      b('penup'),
      b('setxy', -110, -100),
      b('pendown'),
      b('setcolor', 255, 200, 0),
      b('startfill'),
      b('setcolor', 120, 60, 0),
      b('setpensize', 6),
      repeat(5, b('forward', 220), b('right', 144)),
      b('endfill'),
    ],
  },
  forever: {
    label: 'Forever (press Stop)',
    blocks: [
      b('clean'),
      b('setpensize', 2),
      { op: 'repeat', args: [1e9], body: [b('forward', 3), b('right', 7)] },
    ],
  },
};

// ---- Wiring -------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

document.title = APP_NAME;
$('app-name').textContent = APP_NAME;

const demoSelect = $('demo');
for (const [id, demo] of Object.entries(DEMOS)) {
  demoSelect.append(new Option(demo.label, id));
}
if (params.get('demo') in DEMOS) demoSelect.value = params.get('demo');

const speedSelect = $('speed');
if (params.get('speed') in SPEEDS) speedSelect.value = params.get('speed');

const message = $('message');
const runButton = $('run');
const stopButton = $('stop');

let view = null;
const turtle = new Turtle({ onOp: (op) => view.applyOp(op) });

const scheduler = new Scheduler({
  speed: speedSelect.value,
  onStart: () => {
    runButton.disabled = true;
    stopButton.disabled = false;
    view.sprite.classList.add('locked');
    message.textContent = '';
  },
  onStep: () => view.requestSync(),
  onFinish: (result) => {
    runButton.disabled = false;
    stopButton.disabled = true;
    view.sprite.classList.remove('locked');
    view.sync();
    if (result.status === 'error') {
      const error = result.error;
      message.textContent =
        error instanceof RunError
          ? `Stopped. ${error.message}`
          : 'Something went wrong inside the app. Try Run again.';
      if (!(error instanceof RunError)) console.error(error);
    }
  },
});

view = new CanvasView({
  stage: $('stage'),
  turtle,
  isLocked: () => scheduler.running,
});

speedSelect.addEventListener('change', () => {
  scheduler.speed = speedSelect.value;
});

function currentProject() {
  const result = validateProject({
    app: FORMAT_ID,
    version: FORMAT_VERSION,
    stacks: [{ x: 20, y: 20, blocks: DEMOS[demoSelect.value].blocks }],
  });
  if (!result.ok) throw new Error(result.error);
  return result.project;
}

function run() {
  const stack = findMainStack(currentProject());
  scheduler.start(runBlocks(stack.blocks, createContext({ turtle })));
}

runButton.addEventListener('click', run);
stopButton.addEventListener('click', () => scheduler.stop());

stopButton.disabled = true;
if (params.get('autorun') === '1') run();
