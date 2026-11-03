// Dev tool, not part of the app. Checks the block editor in a real headless
// Chrome: dragging blocks out of the palette, snapping, unsnapping, deleting,
// plugging in reporters, typing numbers, and tapping a stack to run it.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/editor-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProjectFile } from '../js/core/project-file.js';
import { DEMOS } from '../js/ui/demos.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const SHOTS = (process.env.SHOTS_DIR ?? tmpdir()) + '/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};
const near = (a, b, tolerance = 3) => Math.abs(a - b) <= tolerance;

const chrome = await launch({ width: 1200, height: 800 });

// ---- Helpers that look at the page ----------------------------------------

const BLOCK_NODES = ".workspace .node.command, .workspace .node.clamp, .workspace .node.hat, .workspace .node.reporter";
const rectJs = `(n) => { const r = n.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; }`;

/** The screen rectangle of the workspace block with this exact label, or null. */
const nodeRect = (label) =>
  chrome.eval(`(() => {
    const n = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.trim() === ${JSON.stringify(label)});
    return n ? (${rectJs})(n) : null;
  })()`);

const count = (selector) => chrome.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
const stacks = () => count('.workspace .stack');

const flyoutRect = (op) =>
  chrome.eval(`(() => { const s = document.querySelector('.flyout .stack[data-op=${op}]'); return s ? (${rectJs})(s) : null; })()`);

async function openPalette(title) {
  const open = await chrome.eval(`(() => { const f = document.querySelector('.flyout'); return !f.hidden && document.querySelector('.palette-button.selected')?.title; })()`);
  if (open === title) return;
  const button = await chrome.centerOf(`.palette-button[title="${title}"]`);
  await chrome.click(button.x, button.y);
  await chrome.sleep(100);
}

/**
 * Drag a block out of the open palette so its top-left corner lands at
 * (left, top). It grabs the block at a point that really is on the block,
 * found by asking the page: the left edge of a reporter is a small notch and
 * the middle of a clamp is its empty mouth, so a fixed offset would miss.
 */
async function dragFromPalette(op, left, top) {
  const rect = await flyoutRect(op);
  const press = await chrome.eval(`(() => {
    const stack = document.querySelector('.flyout .stack[data-op=${op}]');
    const r = stack.getBoundingClientRect();
    for (let y = r.top + r.height / 2; y < r.bottom - 2; y += 3) {
      for (let x = r.left + 4; x < r.right - 2; x += 3) {
        if (document.elementFromPoint(x, y)?.closest('.stack') === stack) return { x, y };
      }
    }
    return null;
  })()`);
  if (!press) throw new Error(`no point on the ${op} block in the palette to grab`);
  await chrome.drag(press, { x: left + (press.x - rect.left), y: top + (press.y - rect.top) }, 10);
  await chrome.sleep(80);
}

/** Tap the last workspace block with this label, at a point that really is on it. */
async function tapBlockNamed(label) {
  const point = await chrome.eval(`(() => {
    const nodes = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].filter((n) => n.textContent.trim() === ${JSON.stringify(label)});
    const node = nodes.at(-1);
    const r = node.getBoundingClientRect();
    for (let y = r.top + 4; y < r.bottom - 2; y += 3) {
      for (let x = r.left + 4; x < r.right - 2; x += 3) {
        if (document.elementFromPoint(x, y)?.closest('.node') === node) return { x, y };
      }
    }
    return null;
  })()`);
  if (!point) throw new Error(`no point on the ${label} block to tap`);
  await chrome.click(point.x, point.y);
  await chrome.sleep(150);
}

/** Drag a workspace block by a point near its left edge, moving it by (dx, dy). */
async function dragBlock(label, dx, dy) {
  const rect = await nodeRect(label);
  const from = { x: rect.left + 10, y: rect.top + rect.h / 2 };
  await chrome.drag(from, { x: from.x + dx, y: from.y + dy }, 10);
  await chrome.sleep(80);
}

try {
  // ---- The palette -------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  check('Roboto loaded from the app itself', await chrome.eval(`[...document.fonts].some((f) => f.family === 'Roboto' && f.status === 'loaded')`));
  check('starts empty, with a hint', (await stacks()) === 0 && (await chrome.eval(`!document.querySelector('.hint').hidden`)));
  check('five palettes have blocks', (await count('.palette-button')) === 5);

  await openPalette('Turtle');
  check('the Turtle palette opens and lists its 11 blocks', (await chrome.eval(`!document.querySelector('.flyout').hidden`)) && (await count('.flyout .stack')) === 11,
    `${await count('.flyout .stack')} blocks`);

  // Every label, in every palette, must fit inside its block, and no two
  // labels in one block may overlap each other. (Compared as rectangles on
  // the screen, which works for every kind of block.)
  const problemsWithLabels = [];
  for (const title of ['Turtle', 'Pen', 'Math', 'Flow', 'My Blocks']) {
    await openPalette(title);
    const bad = await chrome.eval(`(() => {
      const bad = [];
      for (const stack of document.querySelectorAll('.flyout .stack')) {
        for (const node of stack.querySelectorAll('.node')) {
          const outline = node.querySelector('path, rect').getBoundingClientRect();
          const texts = [...node.querySelectorAll('text')].filter((t) => t.textContent.trim());
          const boxes = texts.map((t) => t.getBoundingClientRect());
          boxes.forEach((t, i) => {
            if (t.left < outline.left - 0.5 || t.right > outline.right + 0.5) bad.push('outside ' + stack.dataset.op + ': ' + texts[i].textContent.trim());
          });
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i], b = boxes[j];
              // Text boxes include a little line spacing, so touching is fine.
              // Overlapping means they share more than half the smaller one's height and some width.
              const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (across > 2 && down > 0.5 * Math.min(a.height, b.height)) {
                bad.push('overlap ' + stack.dataset.op + ': ' + texts[i].textContent.trim() + ' / ' + texts[j].textContent.trim());
              }
            }
          }
        }
      }
      return bad;
    })()`);
    problemsWithLabels.push(...bad);
  }
  check('every label fits inside its block, and no two labels overlap', problemsWithLabels.length === 0, problemsWithLabels.join(', '));
  await openPalette('Turtle');

  // ---- Dragging out of the palette ----------------------------------------
  await dragFromPalette('forward', 420, 200);
  const forward = await nodeRect('forward');
  check('dragging forward out of the palette puts one block in the workspace', (await stacks()) === 1 && forward !== null);
  check('the block lands where it was dropped', forward && near(forward.left, 420) && near(forward.top, 200),
    forward ? `at ${Math.round(forward.left)},${Math.round(forward.top)}` : 'missing');
  check('the hint goes away', await chrome.eval(`document.querySelector('.hint').hidden`));
  check('the new block carries its default number 100', (await chrome.eval(`[...document.querySelectorAll('.workspace .node.literal')].map((n) => n.textContent.trim()).join(',')`)) === '100');

  // ---- Snapping ------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('clean', 420, 150);
  const clean = await nodeRect('clean');
  await dragFromPalette('forward', clean.left + 6, clean.bottom + 4);
  const snapped = await nodeRect('forward');
  check('a block dropped just under another snaps into one stack', (await stacks()) === 1, `${await stacks()} stacks`);
  check('the snapped block lines up under the first', snapped && near(snapped.left, clean.left, 2) && near(snapped.top, clean.top + 31.5, 2),
    snapped ? `dx ${(snapped.left - clean.left).toFixed(1)}, dy ${(snapped.top - clean.top).toFixed(1)}` : 'missing');

  await dragFromPalette('right', 700, 400);
  check('a block dropped far away stays on its own', (await stacks()) === 2);

  // ---- Tapping a stack runs it -----------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('clean', 420, 150);
  const c2 = await nodeRect('clean');
  await dragFromPalette('forward', c2.left + 6, c2.bottom + 4);
  const turtleBefore = await chrome.centerOf('.turtle-sprite');
  const fwd = await nodeRect('forward');
  await chrome.click(fwd.left + 10, fwd.top + fwd.h / 2);
  await chrome.sleep(400);
  const turtleAfter = await chrome.centerOf('.turtle-sprite');
  const scale = (await chrome.centerOf('.paper-box')).w / 700;
  check('tapping a block runs its stack: the turtle moves 100 steps up', near(turtleBefore.y - turtleAfter.y, 100 * scale, 3) && near(turtleBefore.x, turtleAfter.x, 1),
    `moved ${(turtleBefore.y - turtleAfter.y).toFixed(1)}px, expected ${(100 * scale).toFixed(1)}`);

  // ---- Typing a number ---------------------------------------------------------
  const lit = (await chrome.eval(`(() => { const n = document.querySelector('.workspace .node.literal'); return (${rectJs})(n); })()`));
  await chrome.click(lit.left + lit.w / 2, lit.top + lit.h / 2);
  await chrome.sleep(100);
  check('tapping a number opens a text box over it', (await count('.number-input')) === 1);
  await chrome.send('Input.insertText', { text: '50' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.sleep(100);
  check('typing 50 and pressing Enter changes the number', (await count('.number-input')) === 0 &&
    (await chrome.eval(`document.querySelector('.workspace .node.literal').textContent.trim()`)) === '50');
  const fwd2 = await nodeRect('forward');
  await chrome.click(fwd2.left + 10, fwd2.top + fwd2.h / 2);
  await chrome.sleep(400);
  // The stack starts with clean, so the turtle goes home first, then 50 up.
  const t4 = await chrome.centerOf('.turtle-sprite');
  const paper = await chrome.centerOf('.paper-box');
  check('the new number is used when the stack runs', near(paper.y - t4.y, 50 * scale, 3), `ended ${(paper.y - t4.y).toFixed(1)}px above the middle, expected ${(50 * scale).toFixed(1)}`);

  // ---- Unsnapping ----------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('clean', 420, 120);
  let tail = await nodeRect('clean');
  await dragFromPalette('forward', tail.left + 6, tail.bottom + 4);
  tail = await nodeRect('forward');
  await dragFromPalette('right', tail.left + 6, tail.bottom + 4);
  check('three blocks snapped into one stack', (await stacks()) === 1);
  await dragBlock('forward', 200, 120);
  check('pulling a middle block out takes it and the blocks below it', (await stacks()) === 2 && (await count(BLOCK_NODES)) === 3);
  const pulled = await nodeRect('forward');
  const left = await nodeRect('clean');
  check('the pulled blocks moved away, the top block stayed', pulled.left > left.left + 150 && near((await nodeRect('right')).left, pulled.left, 2));

  // ---- Deleting by dropping on the palette -------------------------------------------
  const target = await chrome.centerOf('.palette-button[title="Pen"]');
  const rightRect = await nodeRect('right');
  const press = { x: rightRect.left + 10, y: rightRect.top + rightRect.h / 2 };
  await chrome.mouse('mouseMoved', press.x, press.y, { buttons: 0 });
  await chrome.mouse('mousePressed', press.x, press.y);
  for (let i = 1; i <= 10; i++) {
    await chrome.mouse('mouseMoved', press.x + ((target.x - press.x) * i) / 10, press.y + ((target.y - press.y) * i) / 10);
  }
  check('holding a block over the palette tints it red', await chrome.eval(`document.querySelector('.palettes').classList.contains('trash')`));
  await chrome.mouse('mouseReleased', target.x, target.y);
  await chrome.sleep(100);
  check('dropping it on the palette deletes it', (await count(BLOCK_NODES)) === 2 && (await nodeRect('right')) === null);
  check('the palette stops being red', await chrome.eval(`!document.querySelector('.palettes').classList.contains('trash')`));

  // ---- Plugging a reporter into a number box ----------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 420, 200);
  const socketBox = await chrome.eval(`(() => { const n = document.querySelector('.workspace .node.literal'); return (${rectJs})(n); })()`);
  await dragFromPalette('heading', socketBox.left + 2, socketBox.top + 2);
  check('a reporter dropped on a number box plugs in and replaces the number',
    (await count('.workspace .node.reporter')) === 1 && (await count('.workspace .node.literal')) === 0 && (await stacks()) === 1,
    `${await count('.workspace .node.reporter')} reporters, ${await count('.workspace .node.literal')} numbers, ${await stacks()} stacks`);
  const plugged = await nodeRect('heading');
  const fwdBlock = await nodeRect('forward');
  check('the plugged reporter sits at the right edge of its block', plugged.left > fwdBlock.right - 25 && near(plugged.top, fwdBlock.top, 8),
    `reporter left ${Math.round(plugged.left)}, block right ${Math.round(fwdBlock.right)}`);
  await dragBlock('heading', 150, 90);
  check('pulling the reporter out puts the number back', (await count('.workspace .node.literal')) === 1 && (await stacks()) === 2);

  // ---- A clamp (repeat) and putting blocks inside it ------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('repeat', 420, 150);
  const repeat = await nodeRect('repeat');
  await openPalette('Turtle');
  await dragFromPalette('forward', repeat.left + 13.5 + 4, repeat.top + 31.5 + 4);
  const inside = await nodeRect('forward');
  const repeatAfter = await nodeRect('repeat');
  check('a block dropped in the mouth of repeat goes inside it', (await stacks()) === 1 && inside.left > repeatAfter.left + 8,
    `forward ${Math.round(inside.left - repeatAfter.left)}px in from the edge`);
  check('the repeat block grows to fit what is inside it', repeatAfter.h >= repeat.h - 1 && inside.bottom <= repeatAfter.bottom);
  await dragFromPalette('right', inside.left + 6, inside.bottom + 4);
  const inside2 = await nodeRect('right');
  check('a second block snaps under the first, still inside', (await stacks()) === 1 && near(inside2.left, inside.left, 2));
  await chrome.screenshot(SHOTS + 'editor-repeat.png');

  // ---- The Start block and the Run button -------------------------------------------------------
  const pressRun = async () => {
    const button = await chrome.centerOf('#run');
    await chrome.click(button.x, button.y);
    await chrome.sleep(300);
  };
  const messageText = () => chrome.eval(`document.getElementById('message').textContent`);
  const stepsUp = async () => (await chrome.centerOf('.paper-box')).y - (await chrome.centerOf('.turtle-sprite')).y;

  await chrome.goto(BASE + '?speed=instant');
  await pressRun();
  check('Run on an empty page explains where to begin', /Start block/.test(await messageText()));

  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 300);
  await pressRun();
  check('with no Start block, Run runs the topmost stack', near(await stepsUp(), 100 * scale, 3), `${(await stepsUp()).toFixed(0)}px up`);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  check('the Flow palette lists its six blocks', (await count('.flyout .stack')) === 6);
  await dragFromPalette('start', 450, 300);
  const startBlock = await nodeRect('start');
  await openPalette('Turtle');
  await dragFromPalette('back', startBlock.left + 6, startBlock.bottom + 4);
  check('a block snaps under a Start block', (await stacks()) === 1);
  await dragFromPalette('forward', 450, 100);
  check('a second stack higher on the page stays separate', (await stacks()) === 2);
  await pressRun();
  check('Run starts at the Start block, not at the higher stack', near(-(await stepsUp()), 100 * scale, 3), `${(await stepsUp()).toFixed(0)}px up (negative = down)`);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('start', 450, 300);
  await dragFromPalette('start', 450, 100);
  await pressRun();
  check('with two Start blocks, Run says which one it used', /2 Start blocks/.test(await messageText()), await messageText());

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 300);
  const fwdHeight = (await nodeRect('forward')).h;
  await openPalette('Flow');
  const hatHeight = (await flyoutRect('start')).h;
  const stackTop = await nodeRect('forward');
  await dragFromPalette('start', stackTop.left, stackTop.top - hatHeight + 4);
  const merged = await nodeRect('start');
  check('a Start block dropped on top of a stack joins it', (await stacks()) === 1 && merged.top < (await nodeRect('forward')).top);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('start', 450, 300);
  const hat = await nodeRect('start');
  await openPalette('Turtle');
  await dragFromPalette('forward', hat.left, hat.top - fwdHeight + 4);
  check('nothing snaps above a Start block', (await stacks()) === 2);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 200);
  const below = await nodeRect('forward');
  await openPalette('Flow');
  await dragFromPalette('start', below.left + 2, below.bottom + 6);
  check('a Start block cannot hang from the bottom of another block', (await stacks()) === 2);

  await chrome.goto(BASE + '?demo=square&speed=instant');
  const run2 = await chrome.centerOf('#run');
  await chrome.click(run2.x, run2.y);
  await chrome.sleep(400);
  const red = await chrome.eval(`(() => { const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 0) n++; return n; })()`);
  check('Run draws the square from the demo blocks', red > 5000, `${red} red pixels`);
  await chrome.screenshot(SHOTS + 'editor-square-run.png');

  // ---- Undo and redo ------------------------------------------------------------------------
  const isDisabled = (id) => chrome.eval(`document.getElementById('${id}').disabled`);
  const clickButton = async (id) => {
    const b = await chrome.centerOf('#' + id);
    await chrome.click(b.x, b.y);
    await chrome.sleep(100);
  };
  const key = async (name, code, windowsVirtualKeyCode, modifiers) => {
    for (const type of ['keyDown', 'keyUp']) {
      await chrome.send('Input.dispatchKeyEvent', { type, key: name, code, windowsVirtualKeyCode, modifiers });
    }
    await chrome.sleep(100);
  };
  const CTRL = 2;
  const SHIFT = 8;

  await chrome.goto(BASE + '?speed=instant');
  check('undo and redo start out greyed out', (await isDisabled('undo')) && (await isDisabled('redo')));
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 200);
  check('after an edit, undo is available', !(await isDisabled('undo')) && (await isDisabled('redo')));
  await clickButton('undo');
  check('undo takes the block away again', (await stacks()) === 0 && !(await isDisabled('redo')));
  await clickButton('redo');
  check('redo brings it back', (await stacks()) === 1 && (await nodeRect('forward')) !== null);

  await key('z', 'KeyZ', 90, CTRL);
  check('Ctrl+Z undoes', (await stacks()) === 0);
  await key('y', 'KeyY', 89, CTRL);
  check('Ctrl+Y redoes', (await stacks()) === 1);
  await key('z', 'KeyZ', 90, CTRL);
  await key('z', 'KeyZ', 90, CTRL | SHIFT);
  check('Ctrl+Shift+Z redoes', (await stacks()) === 1);

  const number = await chrome.eval(`(() => { const n = document.querySelector('.workspace .node.literal'); return (${rectJs})(n); })()`);
  await chrome.click(number.left + number.w / 2, number.top + number.h / 2);
  await chrome.sleep(100);
  await chrome.send('Input.insertText', { text: '7' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.sleep(100);
  const numberText = () => chrome.eval(`document.querySelector('.workspace .node.literal').textContent.trim()`);
  check('changing a number can be undone', (await numberText()) === '7' && (await (async () => { await clickButton('undo'); return numberText(); })()) === '100');

  // Dropping a block on the palette where it started leaves nothing to undo.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 200);
  await clickButton('undo');
  await dragFromPalette('back', 450, 200);
  const pal = await chrome.centerOf('.palette-button[title="Turtle"]');
  const back = await nodeRect('back');
  await chrome.drag({ x: back.left + 10, y: back.top + back.h / 2 }, { x: pal.x, y: pal.y }, 8);
  await chrome.sleep(100);
  check('a block made and then deleted in one go is a single undoable step', (await stacks()) === 0);
  await clickButton('undo');
  check('and undoing it brings it back', (await stacks()) === 1);

  // ---- Boxes (variables) -----------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  const readoutHidden = () => chrome.eval(`document.querySelector('.boxes-readout').hidden`);
  const readoutText = () => chrome.eval(`document.querySelector('.boxes-readout').textContent.replace(/\\s+/g, ' ').trim()`);
  check('the boxes readout stays hidden until a box is used', await readoutHidden());
  await openPalette('My Blocks');
  check('My Blocks lists the six box blocks', (await count('.flyout .stack')) === 6);
  await dragFromPalette('store1', 450, 150);
  check('the readout appears once a box block is on the page', !(await readoutHidden()) && (await readoutText()) === 'box1 0 box2 0 box3 0', await readoutText());

  const literalRect = (index) =>
    chrome.eval(`(() => { const n = document.querySelectorAll('.workspace .node.literal')[${index}]; return n ? (${rectJs})(n) : null; })()`);
  const firstNumber = await literalRect(0);
  await chrome.click(firstNumber.left + firstNumber.w / 2, firstNumber.top + firstNumber.h / 2);
  await chrome.sleep(100);
  await chrome.send('Input.insertText', { text: '40' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.sleep(100);

  const storeBlock = await nodeRect('store in box1');
  await openPalette('Turtle');
  await dragFromPalette('forward', storeBlock.left + 6, storeBlock.bottom + 4);
  const forwardNumber = await literalRect(1);
  await openPalette('My Blocks');
  await dragFromPalette('box1', forwardNumber.left + 2, forwardNumber.top + 2);
  check('box1 plugs into the forward block like any reporter', (await count('.workspace .node.reporter')) === 1 && (await count('.workspace .node.literal')) === 1);

  const storeNow = await nodeRect('store in box1');
  await chrome.click(storeNow.left + 10, storeNow.top + storeNow.h / 2);
  await chrome.sleep(300);
  check('running it moves the turtle by what was stored in the box', near(await stepsUp(), 40 * scale, 3), `${(await stepsUp()).toFixed(1)}px up, expected ${(40 * scale).toFixed(1)}`);
  check('the readout shows the stored number', (await readoutText()) === 'box1 40 box2 0 box3 0', await readoutText());

  await dragFromPalette('box1', 700, 450);
  // There are two box1 blocks now (one plugged in); the lone one is the last in the page.
  const lone = await chrome.eval(`(() => {
    const all = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].filter((n) => n.textContent.trim() === 'box1');
    return (${rectJs})(all.at(-1));
  })()`);
  await chrome.click(lone.left + 12, lone.top + lone.h / 2);
  await chrome.sleep(150);
  check('tapping a lone box1 shows what the last run left in it', /box1 is 40/.test(await messageText()), await messageText());
  check('looking at a box does not change it', (await readoutText()) === 'box1 40 box2 0 box3 0');

  await chrome.goto(BASE + '?demo=boxes&speed=instant');
  await pressRun();
  check('the boxes demo draws its square, sized by box1', near(await stepsUp(), 0, 2) && (await readoutText()) === 'box1 120 box2 0 box3 0', await readoutText());

  await chrome.goto(BASE + '?demo=boxorder&speed=instant');
  await pressRun();
  await pressRun();
  check('each run starts with empty boxes: reading a box before storing in it always gives 0',
    near(await stepsUp(), 0, 1) && (await readoutText()) === 'box1 50 box2 0 box3 0', `${(await stepsUp()).toFixed(1)}px up`);

  // ---- Math, if, forever, stop, wait, print --------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Math');
  check('the Math palette lists its twelve blocks', (await count('.flyout .stack')) === 12, `${await count('.flyout .stack')}`);
  // Math and comparison blocks read left to right: both sockets on one row.
  const rowSockets = (op) =>
    chrome.eval(`(() => {
      const stack = document.querySelector('.flyout .stack[data-op=${op}]');
      const parts = [...stack.querySelectorAll('.node')].map((n) => ({ kind: n.getAttribute('class'), r: n.getBoundingClientRect() }));
      const block = parts[0].r;
      const slots = parts.filter((p) => p.kind.includes('literal')).map((p) => p.r);
      return { block: { left: block.left, right: block.right, top: block.top, bottom: block.bottom }, slots: slots.map((r) => ({ left: r.left, right: r.right, top: r.top })) };
    })()`);
  const modText = await chrome.eval(`document.querySelector('.flyout .stack[data-op=mod] .node').textContent.trim()`);
  check('the modulo block is labelled %', modText === '%', modText);
  const parenRow = await chrome.eval(`(() => {
    const stack = document.querySelector('.flyout .stack[data-op=paren]');
    const nodes = [...stack.querySelectorAll('.node')];
    const block = nodes[0].getBoundingClientRect();
    const slot = nodes.find((n) => n.getAttribute('class').includes('literal')).getBoundingClientRect();
    const texts = [...nodes[0].querySelectorAll('text')].map((t) => ({ text: t.textContent.trim(), r: t.getBoundingClientRect() })).filter((t) => t.text);
    return { block: [block.left, block.right], slot: [slot.left, slot.right], texts: texts.map((t) => ({ text: t.text, left: t.r.left, right: t.r.right })) };
  })()`);
  const [openText, closeText] = parenRow.texts;
  check('the paren block draws ( before its slot and ) after it',
    openText?.text === '(' && closeText?.text === ')' && openText.right <= parenRow.slot[0] + 1 && closeText.left >= parenRow.slot[1] - 1 &&
    parenRow.slot[0] > parenRow.block[0] && parenRow.slot[1] < parenRow.block[1], JSON.stringify(parenRow));
  for (const op of ['add', 'less', 'random']) {
    const row = await rowSockets(op);
    check(`${op}: the two number slots sit side by side inside the block`,
      row.slots.length === 2 && near(row.slots[0].top, row.slots[1].top, 1) && row.slots[1].left > row.slots[0].right &&
      row.slots[0].left >= row.block.left && row.slots[1].right <= row.block.right + 1,
      JSON.stringify(row.slots));
  }

  // Which blocks fit which sockets.
  await openPalette('Flow');
  await dragFromPalette('if', 450, 150);
  const ifRect = await nodeRect('if');
  await openPalette('Math');
  await dragFromPalette('add', ifRect.left + ifRect.w - 12, ifRect.top + 2);
  check('a number block does not fit the pointed socket of an if', (await stacks()) === 2, `${await stacks()} stacks`);
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('if', 450, 150);
  const ifRect2 = await nodeRect('if');
  await openPalette('Math');
  await dragFromPalette('less', ifRect2.left + ifRect2.w - 12, ifRect2.top + 2);
  const lessBlock = await nodeRect('<');
  const ifAfter = await nodeRect('if');
  check('a yes-or-no block plugs into the pointed socket of an if', (await stacks()) === 1 && lessBlock !== null && lessBlock.left > ifAfter.left + 30,
    `${await stacks()} stacks`);
  check('the if grows tall enough to hold it', lessBlock.bottom <= ifAfter.bottom + 1);
  await chrome.screenshot(SHOTS + 'editor-if-less.png');

  const forwardSocket = async () => {
    await chrome.goto(BASE + '?speed=instant');
    await openPalette('Turtle');
    await dragFromPalette('forward', 450, 200);
    const box = await literalRect(0);
    await openPalette('Math');
    return box;
  };
  let box = await forwardSocket();
  await dragFromPalette('less', box.left + 2, box.top + 2);
  check('a yes-or-no block does not fit a number box', (await stacks()) === 2 && (await literalRect(0)) !== null, `${await stacks()} stacks`);

  box = await forwardSocket();
  await dragFromPalette('add', box.left + 2, box.top + 2);
  check('a number block does fit a number box', (await stacks()) === 1 && (await count('.workspace .node.reporter')) === 1, `${await stacks()} stacks`);
  const addRect = await nodeRect('+');
  const firstSocket = await literalRect(0);
  await dragFromPalette('multiply', firstSocket.left + 2, firstSocket.top + 2);
  // The multiply block was plugged into the + block, so the + block holds it.
  const nestedRect = await nodeRect('\u00d7');
  const holderRect = await nodeRect('+');
  check('a block plugged into a math block sits inside it, and the block grows to fit',
    nestedRect.left >= holderRect.left && nestedRect.right <= holderRect.right + 1 && holderRect.right - holderRect.left > 150,
    `${nestedRect.left.toFixed(0)}-${nestedRect.right.toFixed(0)} inside ${holderRect.left.toFixed(0)}-${holderRect.right.toFixed(0)}`);
  check('blocks plug into blocks, as deep as you like', (await stacks()) === 1 && (await count('.workspace .node.reporter')) === 2 && (await nodeRect('\u00d7')).left > addRect.left,
    `${await stacks()} stacks, ${await count('.workspace .node.reporter')} reporters`);

  await chrome.goto(BASE + '?demo=parens&speed=instant');
  await pressRun();
  check('( 2 + 3 ) x 4 with parentheses goes 20 steps', near(await stepsUp(), 20 * scale, 2), `${(await stepsUp()).toFixed(1)}px up, expected ${(20 * scale).toFixed(1)}`);

  await chrome.goto(BASE + '?demo=pencolor&speed=instant');
  await pressRun();
  check('the pen color readers report red, green and blue', (await readoutText()) === 'box1 10 box2 20 box3 30', await readoutText());

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Pen');
  check('the Pen palette lists eleven blocks, including pen red, green and blue', (await count('.flyout .stack')) === 11, `${await count('.flyout .stack')}`);

  // Stop, forever.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 150);
  const f1 = await nodeRect('forward');
  await openPalette('Flow');
  await dragFromPalette('stop', f1.left + 6, f1.bottom + 4);
  check('stop snaps under another block', (await stacks()) === 1);
  const stopRect = await nodeRect('stop');
  await openPalette('Turtle');
  await dragFromPalette('back', stopRect.left + 6, stopRect.bottom + 4);
  check('nothing snaps below a stop block', (await stacks()) === 2);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 300);
  const f2 = await nodeRect('forward');
  await openPalette('Flow');
  const stopHeight = (await flyoutRect('stop')).h;
  await dragFromPalette('stop', f2.left, f2.top - stopHeight + 4);
  check('a stop block cannot go on top of a stack', (await stacks()) === 2);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('forever', 450, 150);
  const foreverRect = await nodeRect('forever');
  await openPalette('Turtle');
  await dragFromPalette('forward', foreverRect.left + 13.5 + 4, foreverRect.top + 31.5 + 4);
  const inner = await nodeRect('forward');
  check('a block dropped in the mouth of forever goes inside it', (await stacks()) === 1 && inner.left > foreverRect.left + 8);

  // Programs, using the example programs.
  await chrome.goto(BASE + '?demo=counting&speed=instant');
  await pressRun();
  check('forever with an if and a stop: counts five laps and stops itself', near(await stepsUp(), 50 * scale, 2) && (await readoutText()) === 'box1 5 box2 0 box3 0',
    `${(await stepsUp()).toFixed(1)}px up, ${await readoutText()}`);
  check('the program finished by itself', await chrome.eval(`!document.getElementById('run').disabled`));

  await chrome.goto(BASE + '?demo=waiting&speed=instant');
  const runNow = await chrome.centerOf('#run');
  await chrome.click(runNow.x, runNow.y);
  await chrome.sleep(200);
  const early = await stepsUp();
  await chrome.sleep(1100);
  const late = await stepsUp();
  check('wait really waits, even at instant speed', near(early, 0, 1) && near(late, 50 * scale, 2), `after 0.2s: ${early.toFixed(1)}px, after 1.3s: ${late.toFixed(1)}px`);

  await chrome.goto(BASE + '?demo=longwait&speed=instant');
  await pressRun();
  await chrome.sleep(150);
  check('while waiting, Run is off and Stop is on', await chrome.eval(`document.getElementById('run').disabled && !document.getElementById('stop').disabled`));
  await clickButton('stop');
  await chrome.sleep(150);
  check('Stop cuts a long wait short', await chrome.eval(`!document.getElementById('run').disabled`) && near(await stepsUp(), 0, 1));

  await chrome.goto(BASE + '?demo=printing&speed=instant');
  await pressRun();
  await chrome.sleep(200);
  const printed = await chrome.eval(`(() => { const o = document.querySelector('.output'); return o.hidden ? null : o.textContent; })()`);
  check('print shows its values in the output box', printed === '21\n0.1', JSON.stringify(printed));
  await pressRun();
  await chrome.sleep(200);
  check('the output box starts fresh each run', (await chrome.eval(`document.querySelector('.output').textContent`)) === '21\n0.1');

  await chrome.goto(BASE + '?demo=emptyif&speed=instant');
  await pressRun();
  await chrome.sleep(200);
  check('an if with nothing plugged in explains itself', /yes or no/.test(await messageText()), await messageText());
  check('and the if block is outlined in red', (await count('.workspace .node.error')) === 1);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Math');
  await dragFromPalette('add', 600, 300);
  await tapBlockNamed('+');
  check('tapping a lone + block shows its answer', (await messageText()) === 'Answer: 2', await messageText());
  await dragFromPalette('less', 600, 450);
  await tapBlockNamed('<');
  check('tapping a lone < block shows true or false', (await messageText()) === 'Answer: false', await messageText());

  // ---- Zoom and pan -----------------------------------------------------------------------------
  await chrome.goto(BASE + '?demo=square&speed=instant');
  const width = async () => (await nodeRect('clean')).w;
  const w1 = await width();
  await clickButton('zoom-in');
  const w2 = await width();
  check('the zoom in button makes blocks bigger', near(w2 / w1, 1.25, 0.02), `x${(w2 / w1).toFixed(2)}`);
  await clickButton('zoom-out');
  await clickButton('zoom-out');
  const w3 = await width();
  check('the zoom out button makes them smaller', near(w3 / w1, 0.8, 0.02), `x${(w3 / w1).toFixed(2)}`);
  await clickButton('view-home');
  check('the home button puts the view back', near(await width(), w1, 0.5));

  const wheel = (x, y, deltaX, deltaY, modifiers = 0) =>
    chrome.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX, deltaY, modifiers });
  const blockPlace = nodeRect;
  const beforeWheel = await blockPlace('clean');
  await wheel(700, 500, 0, -240, CTRL);
  await chrome.sleep(100);
  check('Ctrl and the wheel zooms in', (await width()) > w1 * 1.3, `x${((await width()) / w1).toFixed(2)}`);
  await clickButton('view-home');

  // Zooming about a point keeps the point under the pointer fixed. Use the
  // top-left corner of a block as the point: it should not move.
  const corner = await nodeRect('clean');
  await wheel(corner.left + 1, corner.top + 1, 0, -200, CTRL);
  await chrome.sleep(100);
  const cornerAfter = await nodeRect('clean');
  check('zooming around a block corner keeps that corner still', near(cornerAfter.left, corner.left, 3) && near(cornerAfter.top, corner.top, 3),
    `moved ${(cornerAfter.left - corner.left).toFixed(1)},${(cornerAfter.top - corner.top).toFixed(1)}`);
  await clickButton('view-home');

  const p0 = await nodeRect('clean');
  await wheel(700, 500, 0, 60);
  await chrome.sleep(100);
  const p1 = await nodeRect('clean');
  check('the wheel scrolls the workspace', near(p0.top - p1.top, 60, 2) && near(p0.left, p1.left, 1), `moved ${(p1.top - p0.top).toFixed(0)}`);
  await clickButton('view-home');

  await chrome.drag({ x: 900, y: 600 }, { x: 960, y: 640 }, 6);
  const dragged = await nodeRect('clean');
  check('dragging empty space slides the blocks', near(dragged.left - p0.left, 60, 2) && near(dragged.top - p0.top, 40, 2),
    `moved ${(dragged.left - p0.left).toFixed(0)},${(dragged.top - p0.top).toFixed(0)}`);
  await clickButton('view-home');

  const turtleNow = await chrome.centerOf('.turtle-sprite');
  await chrome.drag({ x: turtleNow.x, y: turtleNow.y + 4 }, { x: turtleNow.x + 50, y: turtleNow.y + 40 }, 6);
  const afterTurtle = await nodeRect('clean');
  check('dragging the turtle moves the turtle, not the blocks', near(afterTurtle.left, p0.left, 1) && near(afterTurtle.top, p0.top, 1) &&
    near((await chrome.centerOf('.turtle-sprite')).x - turtleNow.x, 50, 3));

  await chrome.goto(BASE + '?speed=instant');
  await clickButton('zoom-in');
  await openPalette('Turtle');
  await dragFromPalette('clean', 480, 150);
  const zc = await nodeRect('clean');
  await dragFromPalette('forward', zc.left + 6, zc.bottom + 4);
  check('snapping still works when zoomed in', (await stacks()) === 1);

  // ---- Copying a stack ------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('clean', 450, 150);
  const base = await nodeRect('clean');
  await dragFromPalette('forward', base.left + 6, base.bottom + 4);
  const nodes = () => count(BLOCK_NODES);
  check('a stack of two blocks to copy', (await stacks()) === 1 && (await nodes()) === 2);
  const grab = await nodeRect('clean');
  await chrome.drag({ x: grab.left + 10, y: grab.top + grab.h / 2 }, { x: grab.left + 260, y: grab.top + 120 }, 8, { modifiers: SHIFT });
  await chrome.sleep(100);
  check('Shift-drag makes a copy of the whole stack and leaves the original', (await stacks()) === 2 && (await nodes()) === 4);
  const originalStill = await chrome.eval(`(() => { const r = [...document.querySelectorAll('.workspace .node.command')].map((n) => n.getBoundingClientRect()); return r.some((b) => Math.abs(b.left - ${grab.left}) < 2 && Math.abs(b.top - ${grab.top}) < 2); })()`);
  check('the original stayed where it was', originalStill);

  // ---- Help bubble: press and hold, right click, Escape ----------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 200);
  const held = await nodeRect('forward');
  const spriteBefore = await chrome.centerOf('.turtle-sprite');
  const point = { x: held.left + 10, y: held.top + held.h / 2 };
  await chrome.mouse('mouseMoved', point.x, point.y, { buttons: 0 });
  await chrome.mouse('mousePressed', point.x, point.y);
  await chrome.sleep(750);
  const bubbleText = () => chrome.eval(`(() => { const b = document.querySelector('.bubble'); return b.hidden ? null : b.querySelector('p').textContent; })()`);
  const copyVisible = () => chrome.eval(`!document.querySelector('.bubble button').hidden`);
  check('holding a block shows its one-line tip', /Moves the turtle forward/.test((await bubbleText()) ?? ''), await bubbleText());
  check('a block in the workspace gets a Copy stack button', await copyVisible());
  await chrome.mouse('mouseReleased', point.x, point.y);
  await chrome.sleep(300);
  check('letting go after a hold does not run the stack', near((await chrome.centerOf('.turtle-sprite')).y, spriteBefore.y, 1));
  check('the bubble stays until you tap elsewhere', (await bubbleText()) !== null);
  const copyButton = await chrome.centerOf('.bubble button');
  await chrome.click(copyButton.x, copyButton.y);
  await chrome.sleep(150);
  check('Copy stack copies the stack and closes the bubble', (await stacks()) === 2 && (await bubbleText()) === null);

  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, buttons: 0 });
  await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'right', buttons: 2, clickCount: 1 });
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'right', buttons: 0, clickCount: 1 });
  await chrome.sleep(200);
  check('right-clicking a block shows its tip', (await bubbleText()) !== null);
  await key('Escape', 'Escape', 27, 0);
  check('Escape closes the bubble', (await bubbleText()) === null);

  const fl = await flyoutRect('back');
  const fp = { x: fl.left + 10, y: fl.top + fl.h / 2 };
  await chrome.mouse('mouseMoved', fp.x, fp.y, { buttons: 0 });
  await chrome.mouse('mousePressed', fp.x, fp.y);
  await chrome.sleep(750);
  check('holding a palette block shows its tip, without a Copy button', /backward/.test((await bubbleText()) ?? '') && !(await copyVisible()), await bubbleText());
  await chrome.mouse('mouseReleased', fp.x, fp.y);
  await chrome.sleep(100);
  check('holding a palette block does not add one to the workspace', (await stacks()) === 2);

  // ---- The same things with a finger ---------------------------------------------------------
  // Touch input is its own set of events in Chrome, so it gets its own checks.
  await chrome.goto(BASE + '?speed=instant');
  await chrome.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await chrome.goto(BASE + '?speed=instant');
  const finger = async (from, to, steps = 10) => {
    await chrome.touch('touchStart', [{ x: from.x, y: from.y }]);
    for (let i = 1; i <= steps; i++) {
      await chrome.touch('touchMove', [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }]);
      await chrome.sleep(16);
    }
    await chrome.touch('touchEnd', []);
    await chrome.sleep(100);
  };
  const tap = async (x, y) => {
    await chrome.touch('touchStart', [{ x, y }]);
    await chrome.sleep(40);
    await chrome.touch('touchEnd', []);
    await chrome.sleep(150);
  };

  const turtleButton = await chrome.centerOf('.palette-button[title="Turtle"]');
  await tap(turtleButton.x, turtleButton.y);
  check('touch: tapping a palette button opens its flyout', await chrome.eval(`!document.querySelector('.flyout').hidden`));

  let cleanTouch = await flyoutRect('clean');
  await finger({ x: cleanTouch.left + 8, y: cleanTouch.top + cleanTouch.h / 2 }, { x: 430, y: 160 });
  cleanTouch = await nodeRect('clean');
  check('touch: dragging a block out of the palette with a finger works', cleanTouch !== null && near(cleanTouch.left, 422, 3) && near(cleanTouch.top, 160 - cleanTouch.h / 2, 3),
    cleanTouch ? `at ${Math.round(cleanTouch.left)},${Math.round(cleanTouch.top)}` : 'missing');

  const forwardTouch = await flyoutRect('forward');
  await finger({ x: forwardTouch.left + 8, y: forwardTouch.top + forwardTouch.h / 2 }, { x: cleanTouch.left + 14, y: cleanTouch.bottom + forwardTouch.h / 2 + 4 });
  check('touch: a dragged block snaps just like with a mouse', (await stacks()) === 1);

  const touchStart = await chrome.centerOf('.turtle-sprite');
  const touchFwd = await nodeRect('forward');
  await tap(touchFwd.left + 10, touchFwd.top + touchFwd.h / 2);
  await chrome.sleep(300);
  const touchEnd = await chrome.centerOf('.turtle-sprite');
  check('touch: tapping a block runs its stack', touchEnd.y < touchStart.y - 50, `moved ${(touchStart.y - touchEnd.y).toFixed(0)}px up`);

  const sprite = await chrome.centerOf('.turtle-sprite');
  await finger({ x: sprite.x, y: sprite.y + 4 }, { x: sprite.x + 90, y: sprite.y + 64 });
  const moved = await chrome.centerOf('.turtle-sprite');
  check('touch: dragging the turtle with a finger moves it', near(moved.x - sprite.x, 90, 4) && near(moved.y - sprite.y, 60, 4), `moved ${(moved.x - sprite.x).toFixed(0)},${(moved.y - sprite.y).toFixed(0)}`);

  const numberBox = await chrome.eval(`(() => { const n = document.querySelector('.workspace .node.literal'); return (${rectJs})(n); })()`);
  await tap(numberBox.left + numberBox.w / 2, numberBox.top + numberBox.h / 2);
  check('touch: tapping a number opens the text box', (await count('.number-input')) === 1);
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(100);

  // Press and hold with a finger: the tip and the Copy stack button (a touchscreen has no Shift key).
  const stacksBefore = await stacks();
  const heldBlock = await nodeRect('forward');
  await chrome.touch('touchStart', [{ x: heldBlock.left + 10, y: heldBlock.top + heldBlock.h / 2 }]);
  await chrome.sleep(750);
  const touchBubble = await chrome.eval(`(() => { const b = document.querySelector('.bubble'); return b.hidden ? null : b.querySelector('p').textContent; })()`);
  await chrome.touch('touchEnd', []);
  await chrome.sleep(200);
  check('touch: holding a block shows its tip', /Moves the turtle forward/.test(touchBubble ?? ''), touchBubble);
  const touchCopy = await chrome.centerOf('.bubble button');
  await tap(touchCopy.x, touchCopy.y);
  check('touch: the Copy stack button copies the stack', (await stacks()) === stacksBefore + 1);

  // Two fingers on empty space pinch to zoom.
  const pinchWidth = async () => (await nodeRect('clean')).w;
  const homeButton = await chrome.centerOf('#view-home');
  await tap(homeButton.x, homeButton.y);
  const pw1 = await pinchWidth();
  await chrome.touch('touchStart', [{ x: 760, y: 450, id: 1 }, { x: 860, y: 450, id: 2 }]);
  for (let i = 1; i <= 8; i++) {
    await chrome.touch('touchMove', [{ x: 760 - i * 10, y: 450, id: 1 }, { x: 860 + i * 10, y: 450, id: 2 }]);
    await chrome.sleep(16);
  }
  await chrome.touch('touchEnd', []);
  await chrome.sleep(100);
  check('touch: pinching two fingers apart zooms in', (await pinchWidth()) > pw1 * 1.4, `x${((await pinchWidth()) / pw1).toFixed(2)}`);

  // ---- Saving, opening, and autosave -------------------------------------------------------------------
  const downloads = mkdtempSync(join(tmpdir(), 'turtlelab-downloads-'));
  await chrome.downloadsTo(downloads);
  const savedPngs = () => readdirSync(downloads).filter((f) => f.endsWith('.png')).sort();
  const waitForPngCount = async (n) => {
    for (let i = 0; i < 60; i += 1) {
      if (savedPngs().length >= n) return savedPngs().at(n - 1);
      await chrome.sleep(100);
    }
    return null;
  };
  const redPixels = (selector = 'canvas') =>
    chrome.eval(`(() => { const c = document.querySelector(${JSON.stringify(selector)}); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 0) n++; return n; })()`);

  await chrome.goto(BASE + '?demo=square&speed=instant');
  await pressRun();
  check('the paper has the square drawn on it', (await redPixels()) > 5000);
  for (const id of ['new', 'open', 'save']) check(`the ${id} button is in the toolbar`, (await count('#' + id)) === 1);
  await clickButton('save');
  const savedName = await waitForPngCount(1);
  check('Save downloads a PNG named with the date and time', /^turtlelab-\d{4}-\d{2}-\d{2}-\d{4}\.png$/.test(savedName ?? ''), savedName);
  check('and says so, and says how to get the blocks back', /Saved turtlelab-.*open it or drag it/.test(await messageText()), await messageText());

  const savedPath = join(downloads, savedName);
  const savedBytes = new Uint8Array(readFileSync(savedPath));
  const savedView = new DataView(savedBytes.buffer);
  check('it is a real PNG picture, the full 1400 by 1120', savedBytes[1] === 0x50 && savedView.getUint32(16) === 1400 && savedView.getUint32(20) === 1120,
    `${savedView.getUint32(16)} by ${savedView.getUint32(20)}`);
  const embedded = readProjectFile(savedBytes);
  check('the blocks are inside it, exactly the blocks that were on the page', embedded.ok && JSON.stringify(embedded.project.stacks[0].blocks) === JSON.stringify(DEMOS.square),
    embedded.ok ? 'same' : embedded.error);

  const pixelsInSaved = await chrome.eval(`(async () => {
    const image = new Image();
    image.src = 'data:image/png;base64,${Buffer.from(savedBytes).toString('base64')}';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let red = 0, turtle = 0, white = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) red++;
      if (data[i] === 108 && data[i + 1] === 198 && data[i + 2] === 0) turtle++;
      if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) white++;
    }
    return { red, turtle, white };
  })()`);
  check('the picture shows the square on white paper, and the turtle is not in it', pixelsInSaved.red > 5000 && pixelsInSaved.turtle === 0 && pixelsInSaved.white > 100000, JSON.stringify(pixelsInSaved));

  // (Two saves in the same minute get the same file name, and the browser decides what to do about
  // that, so look for the app's own "Saved" message rather than counting files.)
  await chrome.eval(`document.getElementById('message').textContent = ''`);
  await key('s', 'KeyS', 83, CTRL);
  await chrome.sleep(800);
  check('Ctrl+S saves too', /^Saved turtlelab-/.test(await messageText()), await messageText());

  await clickButton('new');
  check('New clears the blocks and the paper', (await stacks()) === 0 && (await redPixels()) === 0);
  check('and says Undo brings the blocks back', /Undo brings your blocks back/.test(await messageText()), await messageText());
  await clickButton('undo');
  check('Undo brings the blocks back after New', (await stacks()) === 1);
  await clickButton('new');

  await chrome.setFileInput('#open-file', [savedPath]);
  await chrome.sleep(700);
  check('Open brings the blocks back from the saved picture', (await stacks()) === 1 && (await nodeRect('repeat')) !== null && /Opened turtlelab-/.test(await messageText()), await messageText());
  check('and the picture comes back too, without running anything', (await redPixels()) > 5000);
  await clickButton('undo');
  check('Undo after Open brings back the blocks from before', (await stacks()) === 0);
  await clickButton('redo');
  await pressRun();
  check('the opened blocks run and draw the same square', (await redPixels()) > 5000 && (await stepsUp()) === 0 || near(await stepsUp(), 0, 1));

  // Dropping a saved picture on the page, and what happens with files that will not work.
  const dropOnPage = (setup) =>
    chrome.eval(`(async () => {
      ${setup}
      const before = location.href;
      document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }));
      const highlighted = document.querySelector('.stage').classList.contains('drop-target');
      document.body.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
      const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer });
      document.body.dispatchEvent(drop);
      return { highlighted, handled: drop.defaultPrevented, stillHere: location.href === before, finished: !document.querySelector('.stage').classList.contains('drop-target') };
    })()`);
  const b64 = Buffer.from(savedBytes).toString('base64');
  await clickButton('new');
  const dropped = await dropOnPage(`const bytes = Uint8Array.from(atob('${b64}'), (c) => c.charCodeAt(0)); const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File([bytes], 'my-drawing.png', { type: 'image/png' }));`);
  await chrome.sleep(700);
  check('dropping a saved picture on the page brings back the blocks and the picture', (await stacks()) === 1 && (await redPixels()) > 5000 && /Opened my-drawing\.png/.test(await messageText()), await messageText());
  check('the page lights up while a file is over it, then settles, and the browser does not leave the page',
    dropped.highlighted && dropped.finished && dropped.handled && dropped.stillHere, JSON.stringify(dropped));

  const stacksAfterOpening = await stacks();
  await dropOnPage(`const blob = await new Promise((resolve) => { const c = document.createElement('canvas'); c.width = 20; c.height = 20; c.toBlob(resolve, 'image/png'); }); const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File([blob], 'plain.png', { type: 'image/png' }));`);
  await chrome.sleep(500);
  check('a picture with no program in it is turned down kindly and nothing changes', (await messageText()) === "This picture doesn't have a program inside it." && (await stacks()) === stacksAfterOpening, await messageText());
  await dropOnPage(`const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File([JSON.stringify({ app: 'porttack-turtle', version: 99, stacks: [] })], 'future.json', { type: 'application/json' }));`);
  await chrome.sleep(500);
  check('a project from a newer version is explained, and nothing changes', /newer version/.test(await messageText()) && (await stacks()) === stacksAfterOpening, await messageText());
  await dropOnPage(`const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File(['hello'], 'notes.txt', { type: 'text/plain' }));`);
  await chrome.sleep(500);
  check('some other kind of file is turned down kindly', /not a TurtleLab picture or project/.test(await messageText()) && (await stacks()) === stacksAfterOpening, await messageText());
  await dropOnPage(`const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File([JSON.stringify({ app: 'porttack-turtle', version: 1, stacks: [{ x: 50, y: 50, blocks: [{ op: 'start' }, { op: 'forward', args: [30] }] }] })], 'teacher.json', { type: 'application/json' }));`);
  await chrome.sleep(500);
  check('a plain project file in JSON opens too, onto clean paper', (await stacks()) === 1 && (await nodeRect('forward')) !== null && (await redPixels()) === 0, await messageText());

  // Autosave.
  const stored = () => chrome.eval(`localStorage.getItem('turtlelab-project')`);
  await chrome.goto(BASE + '?speed=instant');
  check('a fresh visit has nothing saved', (await stored()) === null);
  await openPalette('Turtle');
  await dragFromPalette('forward', 450, 200);
  await chrome.sleep(800);
  const autosaved = JSON.parse(await stored());
  check('after a change, a copy of the blocks is kept in this browser (one item, named turtlelab-project)',
    autosaved?.app === 'porttack-turtle' && autosaved.stacks[0].blocks[0].op === 'forward' && (await chrome.eval(`Object.keys(localStorage).join()`)) === 'turtlelab-project');
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('after a refresh the blocks are still there, with a welcome back', (await stacks()) === 1 && (await nodeRect('forward')) !== null && /Welcome back/.test(await messageText()), await messageText());
  await clickButton('new');
  await chrome.sleep(800);
  check('starting fresh leaves nothing saved at all', (await stored()) === null);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('and a refresh then gives an empty page', (await stacks()) === 0 && (await messageText()) === '');
  const problemsBefore = chrome.problems.length;
  await chrome.eval(`localStorage.setItem('turtlelab-project', '{ this is not a project')`);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('a damaged autosave is ignored: the page loads empty and without errors', (await stacks()) === 0 && chrome.problems.length === problemsBefore, chrome.problems.slice(problemsBefore).join(' | '));

  // ---- No backend: what the app and its pages really do ----------------------------------------------
  // data: and blob: addresses are made from data already in the page, so no network is involved.
  const own = (r) => r.method === 'GET' && (r.url.startsWith(BASE) || r.url.startsWith('data:') || r.url.startsWith('blob:'));
  await chrome.goto(BASE + '?demo=counting&speed=instant');
  await chrome.sleep(900);
  const loadedRequests = chrome.requestLog.length;
  await openPalette('Turtle');
  await openPalette('Math');
  await openPalette('Flow');
  await dragFromPalette('forever', 600, 400);
  await pressRun();
  await clickButton('zoom-in');
  await clickButton('undo');
  await chrome.sleep(300);
  const laterRequests = chrome.requestLog.slice(loadedRequests);
  check('once the page has loaded, using it (palettes, dragging, running, zoom, undo) makes no network requests at all',
    laterRequests.length === 0, laterRequests.map((r) => `${r.method} ${r.url}`).join(', '));
  check('every request the page ever made was a plain GET for one of its own files', chrome.requestLog.every(own),
    chrome.requestLog.filter((r) => !own(r)).map((r) => `${r.method} ${r.url}`).join(', '));
  check('it opened no web sockets', chrome.webSockets === 0);
  const { cookies } = await chrome.send('Network.getAllCookies');
  check('it set no cookies', cookies.length === 0 && (await chrome.eval('document.cookie')) === '', JSON.stringify(cookies));
  const storedInBrowser = await chrome.eval(`(async () => ({
    keys: Object.keys(localStorage),
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
    caches: typeof caches === 'undefined' ? 0 : (await caches.keys()).length,
    workers: (await navigator.serviceWorker.getRegistrations()).length,
  }))()`);
  check('the only thing it stores is the autosave: one local storage item named turtlelab-project, and nothing else anywhere',
    JSON.stringify(storedInBrowser.keys) === '["turtlelab-project"]' && storedInBrowser.session === 0 && storedInBrowser.databases === 0 && storedInBrowser.caches === 0 && storedInBrowser.workers === 0,
    JSON.stringify(storedInBrowser));

  for (const [file, heading] of [['about.html', 'About TurtleLab'], ['privacy.html', 'TurtleLab privacy'], ['guide.html', 'TurtleLab guide']]) {
    const mark = chrome.requestLog.length;
    await chrome.goto(BASE + file);
    await chrome.sleep(400);
    const h1 = await chrome.eval(`document.querySelector('h1').textContent`);
    const fontOk = await chrome.eval(`[...document.fonts].some((f) => f.family === 'Roboto' && f.status === 'loaded')`);
    check(`${file} loads with its heading and its font, and asks for nothing outside`,
      h1 === heading && fontOk && chrome.requestLog.slice(mark).every(own), `${h1}, font loaded: ${fontOk}`);
  }
  const aboutLinks = await (async () => {
    await chrome.goto(BASE + 'about.html');
    return chrome.eval(`[...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))`);
  })();
  check('About links to the source, the licence text, and the NOTICE file',
    aboutLinks.some((h) => h.endsWith('/tree/main/turtlelab')) && aboutLinks.some((h) => h.endsWith('/turtlelab/COPYING')) && aboutLinks.some((h) => h.endsWith('/turtlelab/NOTICE.md')));

  check('no console errors, exceptions or CSP violations', chrome.problems.length === 0, chrome.problems.join(' | '));
  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('the page asked for nothing outside its own address', elsewhere.length === 0, `${chrome.requests.length} requests; outside: ${elsewhere.join(', ') || 'none'}`);

  // Last of all (it deliberately provokes the browser's refusal, which logs a
  // CSP violation and would count as a console error above): the page really
  // is not allowed to reach another website, even if it tried.
  await chrome.goto(BASE);
  await chrome.sleep(500);
  const before = chrome.problems.length;
  const probe = await chrome.eval(`(async () => {
    const result = {};
    try { await fetch('https://example.com/', { mode: 'no-cors' }); result.fetch = 'went out'; } catch { result.fetch = 'refused'; }
    result.image = await new Promise((resolve) => { const i = new Image(); i.onload = () => resolve('loaded'); i.onerror = () => resolve('refused'); i.src = 'https://example.com/x.png'; });
    result.script = await new Promise((resolve) => { const t = document.createElement('script'); t.onload = () => resolve('ran'); t.onerror = () => resolve('refused'); t.src = 'https://example.com/x.js'; document.head.append(t); });
    return result;
  })()`);
  await chrome.sleep(300);
  const violations = chrome.problems.splice(before);
  check('the browser itself refuses to contact other sites: a fetch, an image and a script all fail',
    probe.fetch === 'refused' && probe.image === 'refused' && probe.script === 'refused' && violations.some((v) => /Content Security Policy/i.test(v)),
    `${JSON.stringify(probe)}; ${violations.length} policy messages`);
} finally {
  await chrome.close();
}
console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
