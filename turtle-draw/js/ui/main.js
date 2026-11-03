// Turtle Draw: starts the app and wires the pieces together.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The pieces:
//   Turtle + CanvasView   the drawing and the turtle you can drag
//   Workspace + PaletteUI the blocks and where they come from
//   Scheduler             runs a program at a watchable speed
// This file just connects them to the buttons and to each other.

import { APP_NAME } from '../app-info.js';
import { Turtle } from '../core/turtle.js';
import { Scheduler, SPEEDS } from '../core/scheduler.js';
import { runBlocks, createContext, evalNumber, RunError } from '../core/interpreter.js';
import { emptyProject, findRunStack, validateProject, FORMAT_ID, FORMAT_VERSION } from '../core/project.js';
import { BLOCKS } from '../core/blocks-spec.js';
import { newBlock, cloneBlock, isReporterStack } from '../core/edit.js';
import { CanvasView } from './canvas-view.js';
import { Workspace } from './workspace.js';
import { PaletteUI } from './palette.js';
import { DEMOS } from './demos.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

document.title = APP_NAME;
$('app-name').textContent = APP_NAME;

// Block sizes are worked out from the width of their text, so the font has to
// be loaded before the first block is measured. (If it fails to load, the
// fallback font is used for both measuring and drawing, which is still fine.)
await Promise.all([document.fonts.load('400 10px Roboto'), document.fonts.load('700 16px Roboto')]);

const stage = $('stage');
const message = $('message');
const runButton = $('run');
const stopButton = $('stop');
const speedSelect = $('speed');
const hideButton = $('hide-blocks');

function say(text) {
  message.textContent = text;
}

// ---- The project ---------------------------------------------------------

const project = emptyProject();
const demo = params.get('demo');
if (demo && Object.hasOwn(DEMOS, demo)) {
  // Run it through the same checks as a file from a student would get.
  const loaded = validateProject({
    app: FORMAT_ID,
    version: FORMAT_VERSION,
    stacks: [{ x: 300, y: 70, blocks: cloneBlock(DEMOS[demo]) }],
  });
  if (loaded.ok) project.stacks = loaded.project.stacks;
}

// ---- Drawing, running ----------------------------------------------------

if (params.get('speed') in SPEEDS) speedSelect.value = params.get('speed');

let view = null;
let workspace = null;
const turtle = new Turtle({ onOp: (op) => view.applyOp(op) });

const scheduler = new Scheduler({
  speed: speedSelect.value,
  onStart: () => {
    runButton.disabled = true;
    stopButton.disabled = false;
    view.sprite.classList.add('locked');
    workspace.setError(null);
    say('');
  },
  onStep: (block) => {
    view.requestSync();
    // Outlining every block would only slow down an instant run.
    if (scheduler.speed !== 'instant') workspace.setRunning(block);
  },
  onFinish: (result) => {
    runButton.disabled = false;
    stopButton.disabled = true;
    view.sprite.classList.remove('locked');
    view.sync();
    workspace.setRunning(null);
    if (result.status === 'error') {
      if (result.error instanceof RunError) {
        workspace.setError(result.error.block);
        say(result.error.message);
      } else {
        say('Something went wrong inside the app. Try again.');
        console.error(result.error);
      }
    }
  },
});

view = new CanvasView({ stage, turtle, isLocked: () => scheduler.running });

/** Run a stack of blocks. A lone reporter (like x) just shows its value. */
function runStack(stack) {
  const context = createContext({ turtle });
  if (isReporterStack(stack)) {
    const block = stack.blocks[0];
    try {
      say(`${BLOCKS[block.op].label} is ${evalNumber(block, context, block)}`);
    } catch (error) {
      if (!(error instanceof RunError)) throw error;
      say(error.message);
    }
    return;
  }
  scheduler.start(runBlocks(stack.blocks, context));
}

// ---- Blocks --------------------------------------------------------------

let palettes = null;
workspace = new Workspace({
  stage,
  project,
  onChange: () => {
    workspace.setError(null);
  },
  onRunStack: runStack,
  onRunPaletteBlock: (op) => runStack({ x: 0, y: 0, blocks: [newBlock(op)] }),
  isOverPalette: (x, y) => palettes.isOver(x, y),
  onPaletteHover: (hovering) => palettes.setTrashHover(hovering),
});
palettes = new PaletteUI({ stage, workspace });

// ---- Buttons -------------------------------------------------------------

/** Press Run: start at the Start block (see findRunStack for the exact rule). */
function pressRun() {
  const { stack, startCount } = findRunStack(project);
  if (!stack) {
    say('Drag some blocks onto the page first. Run begins at the Start block, which is in the Flow palette.');
    return;
  }
  runStack(stack);
  if (startCount > 1) say(`There are ${startCount} Start blocks. Run uses the top one. Tap a stack to run that one instead.`);
}

runButton.addEventListener('click', pressRun);

stopButton.addEventListener('click', () => scheduler.stop());
stopButton.disabled = true;

speedSelect.addEventListener('change', () => {
  scheduler.speed = speedSelect.value;
});

hideButton.addEventListener('click', () => {
  const hidden = stage.classList.toggle('blocks-hidden');
  hideButton.setAttribute('aria-pressed', String(hidden));
  hideButton.title = hidden ? 'Show blocks' : 'Hide blocks';
});

if (params.get('autorun') === '1') pressRun();
