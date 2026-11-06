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
import { emptyProject, findRunStack, restoredStack, usesBoxes, validateProject, walkBlocks, FORMAT_ID, FORMAT_VERSION } from '../core/project.js';
import { visibleOps } from '../core/fit.js';
import { drawingStats } from '../core/efficiency.js';
import { BLOCKS, DEFAULT_SPEED } from '../core/blocks-spec.js';
import { definitionsOf, isDefinition } from '../core/definitions.js';
import { cloneBlock, isReporterStack } from '../core/edit.js';
import { CanvasView } from './canvas-view.js';
import { Workspace } from './workspace.js';
import { PaletteUI } from './palette.js';
import { Autosave, loadAutosave } from './storage.js';
import { savePicture, savePdf, readFile, dragHasFiles, exportAs, EXPORTS } from './files.js';
import { ExportMenu } from './export-menu.js';
import { GRID_TYPES, gridTypeById } from '../core/grid.js';
import { PAPERS, paperById, afterGridPress } from '../core/paper.js';
import { DEMOS } from './demos.js';
import { sampleById, sampleStacks, LEFT as SAMPLE_LEFT, TOP as SAMPLE_TOP } from './samples.js';
import { noteHeight, stackSize } from './block-view.js';
import { PythonBox } from './python-box.js';
import { LogoBox } from './logo-box.js';
import { compileLogo } from '../core/logo-compile.js';
import { toLogo, jsLogoAddress } from '../core/logo.js';
import { setupFullscreen } from './fullscreen.js';
import { Fish } from './fish.js';
import { Boat } from './boat.js';
import { Idle, BREATH_AFTER_MS } from './idle.js';
import { ScoreBadge } from './score-badge.js';
import { makeAntics, idleAntics, makeRewards, makeSurprises } from './antics.js';
import { Reward, workMark, earnedWork, GOAL } from './reward.js';

const $ = (id) => document.getElementById(id);

const TOO_LONG_TO_ZOOM = 'That picture has so many lines that only some are remembered, so it cannot be zoomed. Run it again to draw it fresh.';
const params = new URLSearchParams(location.search);
// ?embed=1: TurtleLab in a frame on a lesson page. A slim toolbar (the stylesheet; js/embed-flag.js sets the class early), no antics, treats or fish, and like a sample it
// never reads or writes what a student saved. (Build the address with ?sample=lesson-box-size&embed=1; see "Embedding in lessons" in CLAUDE.md.)
const embed = params.get('embed') === '1';

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
const hideButton = $('hide-blocks');
const pythonButton = $('python-toggle');
const logoButton = $('logo-toggle');
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
  // A demo is a list of blocks (one stack), or { stacks: [...] } when it needs several
  // (a block you make is a stack of its own).
  const made = DEMOS[demo];
  const loaded = validateProject({
    app: FORMAT_ID,
    version: FORMAT_VERSION,
    stacks: Array.isArray(made) ? [{ x: 300, y: 70, blocks: cloneBlock(made) }] : cloneBlock(made.stacks),
  });
  if (loaded.ok) project.stacks = loaded.project.stacks;
}

// A sample (?sample=square) loads its blocks and a sticky note instead. It is
// not the student's own work, so it never reads what they saved and never saves
// (see the autosave below).
const sampleName = params.get('sample');
const sample = sampleName === null ? null : sampleById(sampleName);
if (sample) {
  const loaded = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: sampleStacks(sample, { noteHeight, stackSize, stageWidth: stage.clientWidth, stageHeight: stage.clientHeight }) });
  if (loaded.ok) project.stacks = loaded.project.stacks;
}

// Pick up where you left off: the blocks from last time, kept in this browser.
let welcomeBack = false;
if (!sample && !embed && !(demo && Object.hasOwn(DEMOS, demo))) {
  const saved = loadAutosave();
  if (saved) {
    project.stacks = saved.stacks;
    welcomeBack = saved.stacks.length > 0;
  }
}

// ---- Drawing, running ----------------------------------------------------

// Every run starts at this speed. A speed block in the program changes it from
// there. (?speed=slow in the address is a handy way to try the others.)
const startSpeed = Object.hasOwn(SPEEDS, params.get('speed')) ? params.get('speed') : DEFAULT_SPEED;

let view = null;
let idle = null; // watches for quiet, and starts the little antics (set below)
let reward = null; // watches for work, and gives treats for it (set below)
let lastMark = null; // what the blocks were at the last change, to tell whether the next one is work
let workspace = null;
const turtle = new Turtle({ onOp: (op) => view.applyOp(op) });

// The boxes (variables) belong to the most recent run. Each run starts with
// fresh boxes at 0. The readout shows them, but only when the project has a
// box block in it, so it stays out of the way until it matters.
/** A fresh set of boxes, the blocks the student made, and a way for a speed block to reach the scheduler. */
const newContext = (definitions = new Map()) =>
  createContext({
    turtle,
    print,
    definitions,
    setSpeed: (name) => {
      if (!hurry) scheduler.speed = name; // (a run for the PDF stays at instant, whatever the program's speed blocks say)
    },
  });
// The PDF has the program's efficiency on it, which needs a run, so the PDF button runs a program that has not run yet (see runBeforePdf).
// While `hurry` is true that run goes at instant speed. A wait block still takes its real time, and a program that never ends is stopped after
// PDF_RUN_MS (the address can say ?pdfrun=3 for 3 seconds, to try it out).
let hurry = false;
const PDF_RUN_MS = Number(params.get('pdfrun')) > 0 ? Number(params.get('pdfrun')) * 1000 : 5000;
let finishWaiters = []; // called, with the result, when the run that is going ends
let finishes = 0; // how many runs have ended, and how the last one did (a short program at instant speed is over before `start` returns)
let lastResult = null;
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

let outlined = false; // is a block outlined as running right now?
let runningLogo = false; // is what is running (or ran last) the Logo box's program, not the blocks?
let runSteps = 0; // how many blocks the run has run so far (for efficiency, see core/efficiency.js)
let runHasWrite = false; // does the program being run write words? (the words' lines are not judged for efficiency)
/** Does any of these stacks have a write block in it? */
function writesWords(stacks) {
  let found = false;
  for (const stack of stacks) walkBlocks(stack.blocks, (block) => { if (block.op === 'write') found = true; });
  return found;
}
/** A wait at least this long (milliseconds) makes the turtle yawn. A shorter one is just a pause. */
const YAWN_AFTER_MS = 700;

const scheduler = new Scheduler({
  speed: startSpeed,
  onWait: (ms) => {
    // A long wait: the turtle yawns and sways with a Zzz, until the next block runs (onStep) or the program ends.
    if (ms >= YAWN_AFTER_MS) view.setYawning(true);
  },
  onStart: () => {
    runSteps = 0;
    turtle.resetWalked();
    scoreBadge.setRun(null); // the last run is over: efficiency waits for this one
    idle?.poke();
    view.stopWaving();
    view.setYawning(false);
    turtle.stopWriting();
    runButton.disabled = true;
    stopButton.disabled = false;
    view.sprite.classList.add('locked');
    workspace.setError(null);
    say('');
  },
  onStep: (block) => {
    runSteps += 1;
    view.setYawning(false);
    view.requestSync();
    // Outlining every block would only slow down an instant run.
    if (scheduler.speed !== 'instant') {
      workspace.setRunning(block);
      outlined = true;
      showBoxes();
    } else if (outlined) {
      // A speed block just switched to instant: take the outline off the last block.
      workspace.setRunning(null);
      outlined = false;
    }
  },
  onFinish: (result) => {
    idle?.poke(); // a run is activity: the quiet minute starts from when it ends
    runButton.disabled = false;
    stopButton.disabled = true;
    view.sprite.classList.remove('locked');
    view.setYawning(false);
    if (result.status === 'done') {
      view.wave(); // a finished program: the turtle waves
      reward?.ran(); // and a program written (or changed) and run to the end is work
    }
    turtle.stopWriting(); // Stop part way through a word: the turtle is shown where it really is, not where its pen was
    // How efficient the run was, from what it did: a run that finished or was stopped can be measured, one that went wrong cannot.
    scoreBadge.setRun(result.status === 'error' ? null : drawingStats({ ops: visibleOps(turtle.ops).ops, walked: turtle.walked, steps: runSteps, hasWrite: runHasWrite, truncated: turtle.truncated }));
    view.sync();
    workspace.setRunning(null);
    outlined = false;
    showBoxes();
    if (result.status === 'error') {
      if (result.error instanceof RunError) {
        workspace.setError(result.error.block);
        // A mistake while the Logo box's program runs knows which line of the Logo it came from.
        const line = runningLogo ? result.error.block?.logoLine : undefined;
        say(line ? `Line ${line}: ${result.error.message}` : result.error.message);
        if (line) logoBox.showError(line, result.error.message);
      } else if (result.error instanceof RangeError) {
        // Blocks inside blocks inside blocks, more than the page can keep track of.
        say('That program nests too deeply for the page to keep track of. Does one of your blocks call itself without a way to stop?');
      } else {
        say('Something went wrong inside the app. Try again.');
        console.error(result.error);
      }
    }
    finishes += 1;
    lastResult = result;
    const waiting = finishWaiters;
    finishWaiters = [];
    for (const done of waiting) done(result);
  },
});

view = new CanvasView({ stage, turtle, isLocked: () => scheduler.running });

/** Run a stack of blocks. A lone reporter (like x) just shows its value. */
function runStack(stack) {
  if (BLOCKS[stack.blocks[0].op].kind === 'note') return; // a sticky note is not a program
  if (isDefinition(stack)) {
    // A block you made does nothing until something calls it.
    say('This is a block you made. Put a call to it under a Start block and press Run.');
    return;
  }
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
  const { map: definitions, duplicate } = definitionsOf(project);
  if (duplicate) {
    workspace.setError(duplicate);
    say(`Two of your blocks are both called ${duplicate.name}. Give one of them a different name.`);
    return;
  }
  view.resetDrawView({ force: true }); // every run starts with the paper as it was, not zoomed from the last Fit
  clearOutput();
  context = newContext(definitions);
  scheduler.speed = hurry ? 'instant' : startSpeed; // the last run's speed block does not carry over
  runningLogo = false;
  runHasWrite = writesWords(project.stacks);
  scheduler.start(runBlocks(stack.blocks, context));
}

/** Run the Logo in the Logo box. It is read into blocks and run by the same interpreter, so it behaves just like the blocks. */
function runLogo(text) {
  const compiled = compileLogo(text);
  if (!compiled.ok) {
    logoBox.showError(compiled.line, compiled.error);
    say(`Line ${compiled.line}: ${compiled.error}`);
    return;
  }
  if (compiled.main.length === 0) {
    logoBox.say('There is nothing to run yet. Try: forward 100', true);
    say('There is nothing in the Logo box to run yet.');
    return;
  }
  logoBox.clearProblem();
  view.resetDrawView({ force: true });
  clearOutput();
  context = newContext(definitionsOf({ stacks: compiled.stacks }).map);
  scheduler.speed = startSpeed;
  runningLogo = true;
  runHasWrite = writesWords(compiled.stacks);
  scheduler.start(runBlocks(compiled.main, context));
}

/**
 * Open the program in JSLogo, a real Logo kept on this site (/logo/), in a new tab, where it runs at once. The program goes in
 * the part of the address after the #, which the browser never sends anywhere. TurtleLab's own Logo is a little different from
 * JSLogo's, so it is written again for JSLogo (core/logo.js, `jslogo: true`). If the box has been typed in, that text is read
 * first, so it is the student's Logo that goes (and a mistake in it is reported here, not sent).
 */
function openInRealLogo(text, edited) {
  let stacks = project.stacks;
  let boxNames = [];
  let nothing = false;
  if (edited) {
    const compiled = compileLogo(text);
    if (!compiled.ok) {
      logoBox.showError(compiled.line, compiled.error);
      say(`Line ${compiled.line}: ${compiled.error} Fix it first, then open it in real Logo.`);
      return;
    }
    stacks = compiled.stacks;
    boxNames = compiled.boxNames; // so the variables keep the names the student gave them
    nothing = compiled.main.length === 0 && compiled.definitions.length === 0;
  }
  const code = toLogo({ stacks }, { jslogo: true, boxNames });
  if (nothing || code.startsWith('; Drag some blocks')) {
    say('There is nothing to open in real Logo yet.');
    return;
  }
  const opened = window.open(new URL(jsLogoAddress(code), location.href).href, '_blank');
  if (!opened) {
    say('The browser did not open a new tab. Allow pop-ups for this page, then press the button again.');
    return;
  }
  opened.opener = null;
  say('Opened real Logo (JSLogo) in a new tab. It is translated, because TurtleLab\'s Logo is a little different. Nothing leaves this site.');
}

// ---- Blocks --------------------------------------------------------------

const history = new History(project);
const autosave = new Autosave(project);
if (sample || embed) autosave.pause();

function updateHistoryButtons() {
  undoButton.disabled = !history.canUndo;
  redoButton.disabled = !history.canRedo;
}

/** Put the project back to an earlier (or later) copy and redraw it. */
function restore(snapshot, { spit = false } = {}) {
  if (!snapshot || workspace.busy) return;
  // An Undo that brings a deleted stack back has the shark spit it out.
  const back = spit ? restoredStack(project.stacks, snapshot.stacks) : null;
  project.stacks = snapshot.stacks;
  workspace.render();
  workspace.setError(null);
  updateHistoryButtons();
  refreshBoxes();
  projectChanged();
  autosave.schedule();
  if (back) workspace.spitOut(back);
}

let palettes = null;
let pythonBox = null;
let logoBox = null;

const scoreBadge = new ScoreBadge({ stage }); // the program score (see core/complexity.js)

/**
 * The blocks changed (by editing, undo, open or new): what shows them elsewhere has to follow. Only an `edit` (building) can float a "+N" from the
 * score; opening a program, starting a new one and Undo just show the new score.
 */
function projectChanged({ edit = false } = {}) {
  blocksFitted = null; // new or changed blocks: the next Fit fits them afresh
  lastMark = workMark(project.stacks);
  palettes.refresh();
  pythonBox.refresh();
  logoBox.refresh();
  scoreBadge.refresh(project, { quiet: !edit });
}

workspace = new Workspace({
  stage,
  project,
  onChange: () => {
    workspace.setError(null);
    history.record(project);
    updateHistoryButtons();
    refreshBoxes();
    // Putting a block in, changing a number or rearranging blocks is work; moving a stack, taking blocks away and Undo are not (see reward.js).
    if (lastMark && earnedWork(lastMark, workMark(project.stacks))) reward?.edited();
    projectChanged({ edit: true });
    autosave.schedule();
  },
  onRunStack: runStack,
  onRunPaletteBlock: (block) => runStack({ x: 0, y: 0, blocks: [block] }),
  onMessage: say,
  eater: { mouthPoint: (options) => palettes.eater.mouthPoint(options), feed: (meal) => palettes.eater.feed(meal), spit: (ms) => palettes.eater.spit(ms) },
  isOverPalette: (x, y, rect) => palettes.isOver(x, y, rect),
  onPaletteHover: (hovering) => palettes.setTrashHover(hovering),
});
palettes = new PaletteUI({ stage, workspace, burpChance: params.get('burp') === 'always' ? 1 : undefined }); // (?burp=always makes the shark burp after every meal, for trying it out)
// A fish swims across the window, and the shark watches it (and eats it if it is clicked). A fishing boat sails in and tries to harpoon the shark (and the can).
// They are treats for doing work (reward.js), not something that happens on its own: `auto: false`. They never share the shark.
// (?fish=now and ?boat=now send one 0.4 s after the page opens, for trying them out.)
const fish = new Fish({ stage, trash: palettes.trash, auto: false });
if (params.get('fish') === 'now') setTimeout(() => fish.swim(), 400);
const boat = new Boat({ stage, trash: palettes.trash, others: [fish], auto: false });
fish.others.push(boat);
if (params.get('boat') === 'now') setTimeout(() => boat.sail(), 400);
// Poking the can (as many times as its score, or once if it has none) calls a visitor: a fish or the boat, in whichever order the dice say, and if the
// first cannot come now (one is already out, say) the other is tried. (?canscore=5 starts the can with a score, for trying it out.)
palettes.trash.onSummon = () => {
  const sends = Math.random() < 0.5 ? [() => fish.swim(), () => boat.sail()] : [() => boat.sail(), () => fish.swim()];
  return sends.some((send) => send());
};
if (Number(params.get('canscore')) > 0) palettes.trash.setScore(params.get('canscore'));

// After 30 seconds with nobody doing anything the turtle might scratch its head, yawn or blow bubbles, or the shark might doze off and
// dream of turtle stew, or be sick and bring up everything it has eaten. Any click, key, touch or scroll stops it and starts the wait over. (?antic=scratch and so on plays one at once (?antic=breath is the color breathing;
// ?antic=spew gives the shark three things to bring up if it has eaten nothing), and ?idle=5 makes the quiet time 5 seconds instead of 30, and ?poop=two always drops two, for trying them out.)
const idleSeconds = Number(params.get('idle'));
const allAntics = makeAntics({ view, trash: palettes.trash, fish: { get el() { return fish.el || boat.el; } }, ...(params.get('poop') === 'two' ? { secondPoopChance: 1 } : {}) });
idle = new Idle({
  // After 5 seconds (with ?idle=N, N/2 of them) the turtle starts to breathe: its shell slowly goes lighter and deeper again, until anyone does anything.
  ambient: [{ name: 'breath', afterMs: idleSeconds > 0 ? idleSeconds * 500 : BREATH_AFTER_MS, start: () => view.setColorBreathing(true), stop: () => view.setColorBreathing(false) }],
  antics: idleAntics(allAntics),
  busy: () => scheduler.running || workspace.busy,
  // (with ?idle=5 the pauses between one antic and the next shrink in step, so you do not wait a minute for the next)
  ...(idleSeconds > 0 ? { idleMs: idleSeconds * 1000, gapMs: [idleSeconds * 750, idleSeconds * 2000] } : {}),
});
for (const name of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) document.addEventListener(name, () => idle.poke(), { passive: true, capture: true });
if (!embed) idle.start(); // (in a lesson's frame nothing amuses itself: the demo is there to be looked at and changed)
// Treats for work: after enough real building and running (reward.js) the turtle dances or blows happy bubbles, or a fish or a boat comes by for the shark.
// They play on while somebody works (unlike the idle antics, any click does not stop them). (?goal=3 makes the goal 3 points, with only 5 s of rest between
// treats, for trying them out; ?antic=dance, fish or boat plays one at once.)
const goalPoints = Number(params.get('goal'));
reward = new Reward({
  rewards: makeRewards({ antics: allAntics, fish, boat }),
  surprises: makeSurprises({ antics: allAntics, fish, boat }), // (what a change of grid or paper plays: see `surprise` below)
  busy: () => scheduler.running || workspace.busy,
  ...(goalPoints > 0 ? { goal: goalPoints, cooldownMs: 5000 } : { goal: GOAL }),
});
if (embed) reward.stop(); // no treats, and no surprises, in a lesson's frame
lastMark = workMark(project.stacks); // (from here on, a change to the blocks can be work)
scoreBadge.refresh(project, { quiet: true }); // the score of the program the page started with
if (params.get('antic')) {
  setTimeout(() => {
    // (the shark can only be sick if it has eaten something: for trying it out it is given three things, shown as plain chips)
    if (params.get('antic') === 'spew' && !palettes.trash.hasMeals()) for (let i = 0; i < 3; i += 1) palettes.trash.meals.add(null);
    idle.playNow(params.get('antic')) || reward.playNow(params.get('antic'));
  }, 500);
}
pythonBox = new PythonBox({ stage, project, onMessage: say });
logoBox = new LogoBox({
  stage,
  project,
  onMessage: say,
  onRun: runLogo,
  onOpenReal: openInRealLogo,
  onClose: () => {
    logoBox.hide();
    showCodeBoxes();
  },
});
// The blocks are drawn big. On a short screen a sample would run off the bottom,
// so zoom out until it fits (the reset button brings the full size back).
if (sample) workspace.fitHeight(SAMPLE_LEFT, SAMPLE_TOP);

// ---- Buttons -------------------------------------------------------------

/** Press Run: start at the Start block (see findRunStack for the exact rule). */
function pressRun() {
  const { stack, startCount } = findRunStack(project);
  if (!stack) {
    say(
      project.stacks.some(isDefinition)
        ? 'Run begins at the Start block (in the Flow palette). Put one on the page, and under it a call to the block you made.'
        : 'Drag some blocks onto the page first. Run begins at the Start block, which is in the Flow palette.',
    );
    return;
  }
  runStack(stack);
  if (startCount > 1) say(`There are ${startCount} Start blocks. Run uses the top one. Tap a stack to run that one instead.`);
}

runButton.addEventListener('click', pressRun);

undoButton.addEventListener('click', () => restore(history.undo(), { spit: true }));
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

let blocksFitted = null; // where the last Fit left the blocks (their view). Still there, and Fit again means "go back"; moved, and it fits afresh
const sameBlocksView = (a, b) => !!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.zoom - b.zoom) < 0.002;

/**
 * Zoom the drawing so everything drawn (even off the edge of the paper) and the turtle are on it,
 * and slide and zoom the blocks so all of them are inside the window (a long program can be shrunk
 * a lot to do that, which is why pressing Fit again goes back: the paper to normal, and the code
 * to normal size with its top left in the window, ready to slide). `toggle` is only for the Fit
 * button. Returns what the paper did, with `back` true if this press went back.
 */
function fitEverything({ toggle = false } = {}) {
  const palettesEdge = document.querySelector('.palettes')?.getBoundingClientRect().right ?? 0;
  const inset = Math.max(0, palettesEdge - workspace.svg.getBoundingClientRect().left);
  const result = view.fit({ toggle });
  const back = toggle && (result.back === true || sameBlocksView(workspace.view, blocksFitted));
  workspace.fitBlocks(inset, { normal: back });
  blocksFitted = back ? null : { ...workspace.view };
  return { ...result, back };
}

/**
 * The PDF's score includes efficiency, which is about a run, and the badge has none until the program has run since its blocks last changed.
 * So if there is none, run the program now (at instant speed, and stopped after PDF_RUN_MS if it never ends) and wait for it, so the PDF
 * has the efficiency and a drawing that comes from these blocks. A run that is going already is waited for instead of started again.
 * Resolves to what to tell the student about it, or '' when nothing was run.
 */
async function runBeforePdf() {
  if (scoreBadge.run !== null) return ''; // it has run since the blocks last changed: the badge has the numbers
  const startedHere = !scheduler.running;
  const finishesBefore = finishes;
  if (startedHere) {
    const { stack } = findRunStack(project);
    if (!stack) return ''; // nothing to run (no Start block or blocks): the PDF says "not run"
    hurry = true;
    runStack(stack);
    if (!scheduler.running && finishes === finishesBefore) {
      hurry = false; // it did not start, and the app has said why (a block with two names, say)
      return '';
    }
  }
  const seconds = Math.round(PDF_RUN_MS / 1000);
  let cut = false;
  let result = lastResult; // a short program was over before `start` returned
  if (scheduler.running) {
    say('Running your program first, so the PDF can say how it did...');
    const timer = setTimeout(() => {
      cut = true;
      scheduler.stop();
    }, PDF_RUN_MS);
    result = await new Promise((resolve) => finishWaiters.push(resolve));
    clearTimeout(timer);
  }
  hurry = false;
  if (result.status === 'error') return 'Your program stopped with a mistake (the block is outlined), so the PDF has what it drew before that. ';
  if (cut) return `Your program was still going after ${seconds} seconds, so it was stopped there and the PDF has what it had drawn. `;
  return startedHere ? 'Your program was run first, so the numbers and the drawing are from that run. ' : '';
}

/** Save a PDF: the blocks on top, the drawing below, the score along the top of page 1 and its reasons on a page after, and the picture with the blocks inside attached. */
let makingPdf = false;
async function savePdfNow() {
  if (makingPdf) return;
  makingPdf = true;
  say('Making the PDF...');
  try {
    const ranNote = await runBeforePdf();
    say('Making the PDF...');
    view.fit({ toggle: false }); // so the whole drawing is on the paper that goes in the PDF (the blocks in the PDF are drawn apart from the screen: the ones on the screen stay as they are)
    const { name, kind } = await savePdf(view.canvas, project, await view.paperWithTurtle(), scoreBadge.result);
    // Where things went depends on how big the program is (see chooseLayout in core/pdf.js).
    const where = { stacked: 'The blocks are on top and the drawing is below.', side: 'The blocks are down the left and the drawing is on the right.', pages: 'The blocks are on page 1 and the drawing is on page 2.' }[kind];
    say(`${ranNote}Saved ${name}. ${where} The score is at the top of page 1, and the reasons for it are on the last page. Drag the PDF onto this page to open the blocks again.`);
  } catch (error) {
    console.error(error);
    say('Sorry, the PDF could not be made. Try again.');
  } finally {
    makingPdf = false;
    hurry = false;
  }
}

/** Open a saved picture, a PDF saved by TurtleLab, or a project file: its blocks come back, and its picture. */
async function openFile(file) {
  if (!file || workspace.busy) return;
  let read;
  try {
    read = await readFile(file);
  } catch {
    say('That file could not be read.');
    return;
  }
  const { result } = read;
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
  context = newContext();
  refreshBoxes();
  projectChanged();
  autosave.schedule();

  let note = `Opened ${file.name}. Undo brings your old blocks back.`;
  if (result.picture) {
    turtle.forget(); // the turtle did not draw this picture, so it forgets its old drawing
    try {
      // For a PDF this is the PNG attached to it, not the PDF.
      const image = await createImageBitmap(new Blob([result.picture], { type: 'image/png' }));
      view.paintImage(image); // the paper keeps it, to paint again when the view changes
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
  view.resetDrawView();
  history.record(project);
  updateHistoryButtons();
  clearOutput();
  context = newContext();
  refreshBoxes();
  projectChanged();
  autosave.schedule();
  say(hadBlocks ? 'Starting fresh. Undo brings your blocks back.' : 'Starting fresh.');
}

$('save').addEventListener('click', savePictureNow);
new ExportMenu({
  button: $('save'),
  items: EXPORTS,
  onPick: async (format) => {
    try {
      const { note } = await exportAs(format, { canvas: view.canvas, project, turtle });
      say(note);
    } catch (error) {
      if (!/^There are no lines|^That way/.test(error.message)) console.error(error);
      say(/^There are no lines|^That way/.test(error.message) ? error.message : 'Sorry, that file could not be saved. Try again.');
    }
  },
});
$('save-pdf').addEventListener('click', savePdfNow);
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
$('view-home').addEventListener('click', () => {
  workspace.resetView();
  if (!view.resetDrawView().ok) say(TOO_LONG_TO_ZOOM);
});
const gridButton = $('grid');
// What is said when a kind of grid shows. A plain press only ever shows the numbers one, so the others (chosen from the menu) say how to change them.
const GRID_SAY = {
  numbers: 'The grid shows x and y, the same numbers you type into set xy. Press the button again to try the next paper, and once more at the end to put the blank screen back. It is never in a saved picture, but a PDF always has a grid on its drawing.',
  squares: 'Squares, without the numbers. Right-click the button to choose another grid, or to hide it.',
  dots: 'A dot wherever the lines would cross. Right-click the button to choose another grid, or to hide it.',
  polar: 'The rings show how far from the middle, the number you use in forward. The numbers around the edge are headings, the ones in set heading: 0 is up and 90 is to the right. Right-click the button to choose another grid, or to hide it.',
};
/** What is said when a paper shows: it is only a look, and what the next press does. */
const paperSay = (id, last) => `${paperById(id).label} is only how the paper looks on your screen. Saved pictures and PDFs still have white paper. ${last ? 'Press the button again to put the blank screen back.' : 'Press the button again for the next paper.'}`;
/** Bring the grid button, its tooltip and the check marks in its menu up to date with the grid and paper that are showing. */
function gridChanged() {
  const on = view.gridVisible;
  gridButton.setAttribute('aria-pressed', String(on));
  const next = afterGridPress({ gridVisible: on, paperId: view.paperId });
  const what = !on ? 'Show a grid with x and y numbers' : next.gridVisible ? `Next paper (this one is ${paperById(view.paperId).label})` : 'Put the blank screen back';
  gridButton.title = `${what}. Right-click, or press and hold, to choose other grids and papers`;
  gridMenu.setChecked([`grid:${on ? view.gridType : 'off'}`, `paper:${view.paperId}`]);
}
/**
 * A little whimsy: every change of the grid or the paper makes something happen at random (Reward.surprise): the turtle dances, yawns, scratches or blows
 * bubbles, the shark dozes off or is sick, or a fish or the boat comes by. (?surprise=spew makes it that one every time, for trying them out.)
 */
const surprise = () => reward?.surprise(params.get('surprise') || undefined);
// A press: the grid on (squares with x and y), then on to each paper in turn, then the blank screen again.
gridButton.addEventListener('click', () => {
  const next = afterGridPress({ gridVisible: view.gridVisible, paperId: view.paperId });
  const paperChanged = next.paperId !== view.paperId;
  view.setGridType(next.gridType);
  if (paperChanged) view.setPaper(next.paperId);
  view.setGridVisible(next.gridVisible);
  gridChanged();
  if (!next.gridVisible) say('');
  else if (paperChanged && next.paperId !== 'white') say(paperSay(next.paperId, afterGridPress({ gridVisible: true, paperId: next.paperId }).gridVisible === false));
  else say(GRID_SAY[next.gridType]);
  surprise();
});
// Right-click (or press and hold) the grid button for the other kinds of grid, and the paper. The paper is only how the page looks on the screen.
const gridMenu = new ExportMenu({
  button: gridButton,
  label: 'Grids and papers',
  items: [
    { heading: 'Grid' },
    { id: 'grid:off', label: 'No grid', hint: 'Just the paper', radio: true },
    ...GRID_TYPES.map((type) => ({ id: `grid:${type.id}`, label: type.label, hint: type.hint, radio: true })),
    { heading: 'Paper' },
    ...PAPERS.map((paper) => ({ id: `paper:${paper.id}`, label: paper.label, hint: paper.hint, radio: true })),
  ],
  onPick: (id) => {
    const [kind, name] = id.split(':');
    if (kind === 'grid' && name === 'off') {
      view.setGridVisible(false);
      say('');
    } else if (kind === 'grid') {
      view.setGridType(name);
      view.setGridVisible(true);
      say(GRID_SAY[name]);
    } else {
      view.setPaper(name);
      say(name === 'white' ? '' : `${paperById(name).label} is only how the paper looks on your screen. Saved pictures and PDFs still have white paper. Press the grid button to go on to the next paper.`);
    }
    gridChanged();
    surprise();
  },
});
// (?grid=polar shows that kind of grid, and ?paper=blueprint that paper, for trying them out)
if (gridTypeById(params.get('grid'))) {
  view.setGridType(params.get('grid'));
  view.setGridVisible(true);
}
if (paperById(params.get('paper'))) view.setPaper(params.get('paper'));
gridChanged();
setupFullscreen({ button: $('fullscreen'), say });
$('fit').addEventListener('click', () => {
  // Pressed again, it goes back: the normal paper, and the blocks at normal size.
  const result = fitEverything({ toggle: true });
  if (!result.ok) say(`${TOO_LONG_TO_ZOOM} ${result.back ? 'Your blocks are at normal size.' : 'Your blocks are in the window.'}`);
  else if (result.back) say('Back to the normal paper and your blocks at normal size. Slide the blocks to see the rest of a long program. Press Fit again to see everything at once.');
  else say('Zoomed to fit: everything you drew is on the paper and all your blocks are in the window. Press Fit again to go back to the normal paper and your blocks at normal size.');
});

// Ctrl or Cmd with S saves; with Z it undoes; with Shift (or Ctrl+Y) it redoes.
// Typing in the number box keeps its own undo, so leave the keys alone there.
document.addEventListener('keydown', (event) => {
  if (event.target.matches?.('input, textarea, select')) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === 's' && !event.shiftKey) savePictureNow();
  else if (key === 'z' && !event.shiftKey) restore(history.undo(), { spit: true });
  else if ((key === 'z' && event.shiftKey) || key === 'y') restore(history.redo());
  else return;
  event.preventDefault();
});

stopButton.addEventListener('click', () => scheduler.stop());

// Inside a lesson page: Start over loads the demo again, and Open full size is the same address without ?embed=1 (in a tab of its own, where everything works).
if (embed) {
  $('embed-reset').addEventListener('click', () => location.reload());
  const full = new URL(location.href);
  full.searchParams.delete('embed');
  $('embed-open').href = full.href;
}
stopButton.disabled = true;

// The Python box and the Logo box sit in the same corner, so only one is open at a time.
function showCodeBoxes() {
  pythonButton.setAttribute('aria-pressed', String(pythonBox.visible));
  pythonButton.title = pythonBox.visible ? 'Hide the Python code' : 'Show your blocks as Python code';
  logoButton.setAttribute('aria-pressed', String(logoBox.visible));
  logoButton.title = logoBox.visible ? 'Hide the Logo code' : 'Show your blocks as Logo code, which you can change and run';
}
pythonButton.addEventListener('click', () => {
  if (!pythonBox.visible) logoBox.hide();
  pythonBox.toggle();
  showCodeBoxes();
});
logoButton.addEventListener('click', () => {
  if (!logoBox.visible) pythonBox.hide();
  logoBox.toggle();
  showCodeBoxes();
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
  say(embed
    ? `${sample.title}. Change anything you like and press Run.` // (short: in a frame the message must stay on one line, or it takes room from the blocks)
    : `Sample: ${sample.title}. Change anything you like. It is not saved unless you press Save, and the blocks you saved before are untouched.`);
} else {
  if (sampleName !== null) say(`There is no sample called "${sampleName.slice(0, 40)}". The Samples page lists them all.`);
  if (params.get('autorun') === '1') pressRun();
}
