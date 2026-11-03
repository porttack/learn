// TurtleLab: starts the app and wires the pieces together.
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
import { History } from '../core/history.js';
import { formatNumber, formatValue } from '../core/format.js';
import { runBlocks, createContext, evalArg, RunError } from '../core/interpreter.js';
import { emptyProject, findRunStack, usesBoxes, validateProject, FORMAT_ID, FORMAT_VERSION } from '../core/project.js';
import { BLOCKS } from '../core/blocks-spec.js';
import { newBlock, cloneBlock, isReporterStack } from '../core/edit.js';
import { CanvasView } from './canvas-view.js';
import { Workspace } from './workspace.js';
import { PaletteUI } from './palette.js';
import { Autosave, loadAutosave } from './storage.js';
import { savePicture, readFile, dragHasFiles } from './files.js';
import { DEMOS } from './demos.js';
import { sampleById, sampleStacks, LEFT as SAMPLE_LEFT, TOP as SAMPLE_TOP } from './samples.js';
import { noteHeight } from './block-view.js';

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
const undoButton = $('undo');
const redoButton = $('redo');

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

// A sample (?sample=square) loads its blocks and a sticky note instead. It is
// not the student's own work, so it never reads what they saved and never saves
// (see the autosave below).
const sampleName = params.get('sample');
const sample = sampleName === null ? null : sampleById(sampleName);
if (sample) {
  const loaded = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: sampleStacks(sample, noteHeight) });
  if (loaded.ok) project.stacks = loaded.project.stacks;
}

// Pick up where you left off: the blocks from last time, kept in this browser.
let welcomeBack = false;
if (!sample && !(demo && Object.hasOwn(DEMOS, demo))) {
  const saved = loadAutosave();
  if (saved) {
    project.stacks = saved.stacks;
    welcomeBack = saved.stacks.length > 0;
  }
}

// ---- Drawing, running ----------------------------------------------------

if (params.get('speed') in SPEEDS) speedSelect.value = params.get('speed');

let view = null;
let workspace = null;
const turtle = new Turtle({ onOp: (op) => view.applyOp(op) });

// The boxes (variables) belong to the most recent run. Each run starts with
// fresh boxes at 0. The readout shows them, but only when the project has a
// box block in it, so it stays out of the way until it matters.
let context = createContext({ turtle });
let boxesInUse = usesBoxes(project);
const readout = document.createElement('p');
readout.className = 'boxes-readout';
stage.append(readout);

// What print blocks say goes in a small box at the top right: the last few
// lines, cleared at the start of every run. It is redrawn at most once a frame,
// because a loop can print thousands of lines a second.
const output = document.createElement('div');
output.className = 'output';
output.hidden = true;
stage.append(output);
let outputLines = [];
let outputQueued = false;

function print(line) {
  outputLines.push(line);
  if (outputLines.length > 8) outputLines.shift();
  if (outputQueued) return;
  outputQueued = true;
  requestAnimationFrame(() => {
    outputQueued = false;
    output.textContent = outputLines.join('\n');
    output.hidden = outputLines.length === 0;
  });
}

function clearOutput() {
  outputLines = [];
  output.textContent = '';
  output.hidden = true;
}

function showBoxes() {
  readout.hidden = !boxesInUse;
  readout.textContent = context.boxes.map((value, i) => `box${i + 1}  ${formatNumber(value)}`).join('      ');
}

function refreshBoxes() {
  boxesInUse = usesBoxes(project);
  showBoxes();
}
showBoxes();

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
    if (scheduler.speed !== 'instant') {
      workspace.setRunning(block);
      showBoxes();
    }
  },
  onFinish: (result) => {
    runButton.disabled = false;
    stopButton.disabled = true;
    view.sprite.classList.remove('locked');
    view.sync();
    workspace.setRunning(null);
    showBoxes();
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
  if (BLOCKS[stack.blocks[0].op].kind === 'note') return; // a sticky note is not a program
  if (isReporterStack(stack)) {
    // Tapping a reporter reads from the boxes the last run left behind.
    // Looking at a value never changes it.
    const reading = createContext({ turtle, boxes: context.boxes.slice() });
    const block = stack.blocks[0];
    try {
      const value = formatValue(evalArg(block, reading, block));
      // A block with no sockets (like x) reads best as "x is 5"; one with
      // sockets (like +) just gives its answer.
      say(BLOCKS[block.op].args.length === 0 ? `${BLOCKS[block.op].label} is ${value}` : `Answer: ${value}`);
    } catch (error) {
      if (!(error instanceof RunError)) throw error;
      say(error.message);
    }
    return;
  }
  clearOutput();
  context = createContext({ turtle, print });
  scheduler.start(runBlocks(stack.blocks, context));
}

// ---- Blocks --------------------------------------------------------------

const history = new History(project);
const autosave = new Autosave(project);
if (sample) autosave.pause();

function updateHistoryButtons() {
  undoButton.disabled = !history.canUndo;
  redoButton.disabled = !history.canRedo;
}

/** Put the project back to an earlier (or later) copy and redraw it. */
function restore(snapshot) {
  if (!snapshot || workspace.busy) return;
  project.stacks = snapshot.stacks;
  workspace.render();
  workspace.setError(null);
  updateHistoryButtons();
  refreshBoxes();
  autosave.schedule();
}

let palettes = null;
workspace = new Workspace({
  stage,
  project,
  onChange: () => {
    workspace.setError(null);
    history.record(project);
    updateHistoryButtons();
    refreshBoxes();
    autosave.schedule();
  },
  onRunStack: runStack,
  onRunPaletteBlock: (op) => runStack({ x: 0, y: 0, blocks: [newBlock(op)] }),
  isOverPalette: (x, y) => palettes.isOver(x, y),
  onPaletteHover: (hovering) => palettes.setTrashHover(hovering),
});
palettes = new PaletteUI({ stage, workspace });
// The blocks are drawn big. On a short screen a sample would run off the bottom,
// so zoom out until it fits (the reset button brings the full size back).
if (sample) workspace.fitHeight(SAMPLE_LEFT, SAMPLE_TOP);

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

undoButton.addEventListener('click', () => restore(history.undo()));
redoButton.addEventListener('click', () => restore(history.redo()));
updateHistoryButtons();

// ---- Saving, opening and starting over ------------------------------------

/** Save the paper as a picture with the blocks tucked inside it. */
async function savePictureNow() {
  try {
    const name = await savePicture(view.canvas, project);
    say(`Saved ${name}. To get your blocks back, open it or drag it onto this page.`);
  } catch (error) {
    console.error(error);
    say('Sorry, the picture could not be saved. Try again.');
  }
}

/** Open a saved picture (or a project file): its blocks come back, and its picture. */
async function openFile(file) {
  if (!file || workspace.busy) return;
  let read;
  try {
    read = await readFile(file);
  } catch {
    say('That file could not be read.');
    return;
  }
  const { result, bytes } = read;
  if (!result.ok) {
    say(result.error);
    return;
  }
  scheduler.stop();
  project.stacks = result.project.stacks;
  workspace.render();
  workspace.setError(null);
  history.record(project);
  updateHistoryButtons();
  clearOutput();
  context = createContext({ turtle, print });
  refreshBoxes();
  autosave.schedule();

  let note = `Opened ${file.name}. Undo brings your old blocks back.`;
  if (result.kind === 'png') {
    turtle.forget(); // the turtle did not draw this picture, so it forgets its old drawing
    try {
      const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      view.paintImage(image);
      image.close();
    } catch {
      note = `Opened the blocks from ${file.name}, but its picture could not be shown. Press Run to draw it.`;
    }
  } else {
    turtle.clean(); // a project file has no picture, so start with clean paper
    note = `Opened ${file.name}. Press Run to draw it. Undo brings your old blocks back.`;
  }
  view.sync();
  say(note);
}

/** Start over: no blocks, clean paper. Undo brings the blocks back. */
function newProject() {
  if (workspace.busy) return;
  const hadBlocks = project.stacks.length > 0;
  scheduler.stop();
  project.stacks = [];
  workspace.render();
  workspace.setError(null);
  turtle.clean();
  history.record(project);
  updateHistoryButtons();
  clearOutput();
  context = createContext({ turtle, print });
  refreshBoxes();
  autosave.schedule();
  say(hadBlocks ? 'Starting fresh. Undo brings your blocks back.' : 'Starting fresh.');
}

$('save').addEventListener('click', savePictureNow);
$('new').addEventListener('click', newProject);
$('open').addEventListener('click', () => $('open-file').click());
$('open-file').addEventListener('change', (event) => {
  openFile(event.target.files[0]);
  event.target.value = ''; // so the same file can be opened again
});

// Drop a saved picture anywhere on the page. (Handling the drop also stops the
// browser from leaving the page to show the file, which would lose your blocks.)
let dragDepth = 0;
document.addEventListener('dragenter', (event) => {
  if (!dragHasFiles(event)) return;
  event.preventDefault();
  dragDepth += 1;
  stage.classList.add('drop-target');
});
document.addEventListener('dragover', (event) => {
  if (!dragHasFiles(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
document.addEventListener('dragleave', (event) => {
  if (!dragHasFiles(event)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) stage.classList.remove('drop-target');
});
document.addEventListener('drop', (event) => {
  if (!dragHasFiles(event)) return;
  event.preventDefault();
  dragDepth = 0;
  stage.classList.remove('drop-target');
  openFile(event.dataTransfer.files[0]);
});

$('zoom-in').addEventListener('click', () => workspace.zoomBy(1.25));
$('zoom-out').addEventListener('click', () => workspace.zoomBy(0.8));
$('view-home').addEventListener('click', () => workspace.resetView());

// Ctrl or Cmd with S saves; with Z it undoes; with Shift (or Ctrl+Y) it redoes.
// Typing in the number box keeps its own undo, so leave the keys alone there.
document.addEventListener('keydown', (event) => {
  if (event.target.matches?.('input, textarea, select')) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === 's' && !event.shiftKey) savePictureNow();
  else if (key === 'z' && !event.shiftKey) restore(history.undo());
  else if ((key === 'z' && event.shiftKey) || key === 'y') restore(history.redo());
  else return;
  event.preventDefault();
});

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

if (welcomeBack) say('Welcome back. Your blocks from last time are here. Press Run to draw them again.');

if (sample) {
  // It runs by itself, so the drawing is the first thing you see. Starting a
  // run clears the message line, so the message goes up after it starts.
  if (params.get('autorun') !== '0') pressRun();
  say(`Sample: ${sample.title}. Change anything you like. It is not saved unless you press Save, and the blocks you saved before are untouched.`);
} else {
  if (sampleName !== null) say(`There is no sample called "${sampleName.slice(0, 40)}". The Samples page lists them all.`);
  if (params.get('autorun') === '1') pressRun();
}
