// Dev tool, not part of the app. Checks the block editor in a real headless
// Chrome: dragging blocks out of the palette, snapping, unsnapping, deleting,
// plugging in reporters, typing numbers, and tapping a stack to run it.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/editor-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readProjectFile, isPdf } from '../js/core/project-file.js';
import { validateProject, FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';
import { toPython } from '../js/core/python.js';
import { assess, tenths } from '../js/core/quality.js';
import { toHexUpper, colorBits } from '../js/core/color.js';
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
    const n = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.replace(/\\s+/g, '') === ${JSON.stringify(label)}.replace(/\\s+/g, ''));
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
  // The flyout scrolls up and down, and the longer Flow palette no longer fits
  // in a short window, so bring the block into view first.
  await chrome.eval(`document.querySelector('.flyout .stack[data-op=${op}]')?.scrollIntoView({ block: 'nearest' })`);
  await chrome.sleep(50);
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
    const nodes = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].filter((n) => n.textContent.replace(/\\s+/g, '') === ${JSON.stringify(label)}.replace(/\\s+/g, ''));
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
  check('seven palettes have blocks, with Boxes and My Blocks apart', (await count('.palette-button')) === 7 && (await chrome.eval(`[...document.querySelectorAll('.palette-button')].map((b) => b.title).join()`)) === 'Turtle,Pen,Math,Flow,Boxes,My Blocks,Notes');

  await openPalette('Turtle');
  check('the Turtle palette opens and lists its 11 blocks', (await chrome.eval(`!document.querySelector('.flyout').hidden`)) && (await count('.flyout .stack')) === 11,
    `${await count('.flyout .stack')} blocks`);

  // Every label, in every palette, must fit inside its block, and no two
  // labels in one block may overlap each other. (Compared as rectangles on
  // the screen, which works for every kind of block.)
  const problemsWithLabels = [];
  for (const title of ['Turtle', 'Pen', 'Math', 'Flow', 'My Blocks', 'Notes']) {
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

  // ---- The delete zone is the whole left column, not only the buttons -------------------------------
  // Put a forward block on the page (flyout closed, or open), pick it up, and let go at `where`.
  const dropForwardAt = async (where, { flyout = false } = {}) => {
    await chrome.goto(BASE + '?speed=instant');
    await openPalette('Turtle');
    await dragFromPalette('forward', 600, 300);
    if (!flyout) {
      const button = await chrome.centerOf('.palette-button[title="Turtle"]');
      await chrome.click(button.x, button.y); // tapping the open palette's button closes it
      await chrome.sleep(100);
    }
    const r = await nodeRect('forward');
    const target = typeof where === 'function' ? await where() : where;
    await chrome.drag({ x: r.left + 10, y: r.top + r.h / 2 }, target, 12);
    await chrome.sleep(120);
    // (A block dropped on the delete zone is gone a moment later, a little longer on a busy machine: wait for that, not for a fixed time.)
    for (let i = 0; i < 6 && (await stacks()) !== 0; i += 1) await chrome.sleep(100);
    return stacks();
  };
  const flyoutBox = () => chrome.eval(`(() => { const r = document.querySelector('.flyout').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);

  for (const [label, where] of [
    ['below the buttons', { x: 30, y: 650 }],
    ['beside the buttons, at the very edge', { x: 3, y: 200 }],
    ['just to the right of the buttons', { x: 78, y: 200 }],
    ['past the left edge of the window', { x: -40, y: 300 }],
  ]) {
    check(`letting go ${label} deletes the block`, (await dropForwardAt(where)) === 0);
  }
  check('letting go over the open flyout deletes it', (await dropForwardAt({ x: 170, y: 300 }, { flyout: true })) === 0);
  check('letting go in the gap between the buttons and the open flyout deletes it', (await dropForwardAt({ x: 80, y: 300 }, { flyout: true })) === 0);
  check('letting go well to the right of the closed palette keeps the block (this is the page)', (await dropForwardAt({ x: 160, y: 300 })) === 1);
  check('letting go well to the right of the open flyout keeps it too', (await dropForwardAt(async () => ({ x: (await flyoutBox()).right + 50, y: 300 }), { flyout: true })) === 1);

  // The column tells you: it turns red while a block is held over it, and not before.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  const heldRect = await nodeRect('forward');
  const heldAt = { x: heldRect.left + 10, y: heldRect.top + heldRect.h / 2 };
  const bandNow = () => chrome.eval(`(() => { const b = document.querySelector('.trash-band'); const r = b.getBoundingClientRect(); return { active: b.classList.contains('active'), shown: getComputedStyle(b).display !== 'none', width: r.width, height: r.height, text: b.textContent }; })()`);
  await chrome.mouse('mouseMoved', heldAt.x, heldAt.y, { buttons: 0 });
  await chrome.mouse('mousePressed', heldAt.x, heldAt.y);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', heldAt.x + ((450 - heldAt.x) * i) / 8, heldAt.y + ((200 - heldAt.y) * i) / 8);
  check('while a block is held out in the page, no delete zone shows', !(await bandNow()).shown);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', 450 + ((30 - 450) * i) / 8, 200 + ((650 - 200) * i) / 8);
  const band = await bandNow();
  check('held over the left side, the whole column turns red', band.active && band.shown && band.width >= 70 && band.height > 500, JSON.stringify(band));
  await chrome.sleep(350);
  // What the page hears when a mouse-up was lost: the next move arrives with no button down. (A scripted
  // move cannot do this, since the browser itself still thinks the button is held, so send the event.)
  const strayMove = (x, y) =>
    chrome.eval(`document.querySelector('svg.workspace').dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0, clientX: ${x}, clientY: ${y}, bubbles: true }))`);
  const sharkAt = () => chrome.eval(`(() => { const can = document.querySelector('.trash-can'); const m = getComputedStyle(can.querySelector('.shark')).transform; return { hungry: can.classList.contains('hungry'), eating: can.classList.contains('eating'), lift: m === 'none' ? 0 : Number(m.match(/matrix\\(.*,\\s*(-?[\\d.]+)\\)/)[1]) }; })()`);
  const up = await sharkAt();
  check('and the lid comes off and a shark pops up out of the trash can, ready to eat it', up.hungry && up.lift <= -30, JSON.stringify(up));
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', 30 + ((500 - 30) * i) / 8, 650 + ((250 - 650) * i) / 8);
  check('and it stops being red when the block moves away, and the shark goes back down', !(await bandNow()).shown && !(await sharkAt()).hungry);
  await chrome.mouse('mouseReleased', 500, 250);
  await chrome.sleep(100);
  check('letting go there keeps the block', (await stacks()) === 1);

  // A block fresh from the flyout starts over the flyout, so the red waits until it has left and come back.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  const fresh = await flyoutRect('forward');
  const freshAt = { x: fresh.left + 10, y: fresh.top + fresh.h / 2 };
  await chrome.mouse('mouseMoved', freshAt.x, freshAt.y, { buttons: 0 });
  await chrome.mouse('mousePressed', freshAt.x, freshAt.y);
  for (let i = 1; i <= 6; i += 1) await chrome.mouse('mouseMoved', freshAt.x + 6 * i, freshAt.y + 20 * i);
  check('taking a new block out of the flyout does not flash the delete zone', !(await bandNow()).shown && (await chrome.eval(`!document.querySelector('.flyout').classList.contains('trash')`)));
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', freshAt.x + 36 + ((600 - freshAt.x - 36) * i) / 8, freshAt.y + 120);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', 600 + ((170 - 600) * i) / 8, freshAt.y + 120);
  check('but once it has been out in the page, bringing it back over the left side does', (await bandNow()).active);
  await chrome.mouse('mouseReleased', 170, freshAt.y + 120);
  await chrome.sleep(100);
  for (let i = 0; i < 6 && (await stacks()) !== 0; i += 1) await chrome.sleep(100); // gone a moment later on a busy machine
  check('and letting go there deletes it', (await stacks()) === 0);

  // Letting go is eaten by the shark, and then everything goes back to rest.
  const settled = () => chrome.eval(`(() => { const c = document.querySelector('.trash-can').classList; return !c.contains('hungry') && !c.contains('eating') && !c.contains('chomp'); })()`);
  const ghosts = () => count('.workspace .ghost');
  await chrome.goto(BASE + '?speed=instant');
  check('at rest the shark is out of sight and the lid is on', (await settled()) && (await sharkAt()).lift >= 60);
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  await dragFromPalette('right', 600, 500);
  const toEat = await nodeRect('forward');
  const eatFrom = { x: toEat.left + 10, y: toEat.top + toEat.h / 2 };
  await chrome.drag(eatFrom, { x: 40, y: 560 }, 10);
  await chrome.sleep(120);
  check('a deleted stack flies into the shark as a copy, while the real one is already gone', (await ghosts()) === 1 && (await stacks()) === 1 && (await chrome.eval(`document.querySelector('.trash-can').classList.contains('eating')`)));
  await chrome.sleep(1900);
  check('then the copy is gone, and the shark and lid are back where they started', (await ghosts()) === 0 && (await settled()) && (await sharkAt()).lift >= 60);
  check('only the stack that was eaten is gone', (await stacks()) === 1 && (await nodeRect('right')) !== null && (await nodeRect('forward')) === null);

  // Nothing is left stuck: the other block can be picked up and moved normally, and moving the mouse alone moves nothing.
  const keep = await nodeRect('right');
  await chrome.mouse('mouseMoved', keep.left + 60, keep.top - 80, { buttons: 0 });
  await chrome.mouse('mouseMoved', keep.left + 120, keep.top - 120, { buttons: 0 });
  check('moving the mouse after a delete does not drag anything along', near((await nodeRect('right')).left, keep.left, 1) && near((await nodeRect('right')).top, keep.top, 1));
  await dragBlock('right', 80, -60);
  check('and the next block can be picked up and moved as usual', near((await nodeRect('right')).left - keep.left, 80, 2) && near((await nodeRect('right')).top - keep.top, -60, 2));

  // The mouse button comes up somewhere the page cannot see it: the block must not stay stuck to the pointer.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  const lost = await nodeRect('forward');
  await chrome.mouse('mouseMoved', lost.left + 10, lost.top + lost.h / 2, { buttons: 0 });
  await chrome.mouse('mousePressed', lost.left + 10, lost.top + lost.h / 2);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', lost.left + 10 + ((40 - lost.left - 10) * i) / 8, lost.top + lost.h / 2 + ((450 - lost.top - lost.h / 2) * i) / 8);
  check('held over the left side, the shark is up', (await sharkAt()).hungry);
  // No mouse-up is heard: the next thing the page hears is the mouse moving with no button down.
  await strayMove(41, 452);
  await chrome.sleep(150);
  check('if the button-up is never heard, the next move with no button down still lets go (and deletes)', (await stacks()) === 0);
  await chrome.sleep(1900);
  check('and nothing is left red or stuck afterwards', (await settled()) && !(await bandNow()).shown && (await ghosts()) === 0);

  // The block was over the left side when the button came up unseen, and the mouse has wandered off since: it was dropped there.
  const holdOverLeft = async (finish) => {
    await chrome.goto(BASE + '?speed=instant');
    await openPalette('Turtle');
    await dragFromPalette('forward', 600, 300);
    const at = await nodeRect('forward');
    const from = { x: at.left + 10, y: at.top + at.h / 2 };
    await chrome.mouse('mouseMoved', from.x, from.y, { buttons: 0 });
    await chrome.mouse('mousePressed', from.x, from.y);
    for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', from.x + ((300 - from.x) * i) / 8, from.y + ((250 - from.y) * i) / 8);
    return finish;
  };
  await holdOverLeft();
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', 300 - 270 * (i / 8), 250 + 200 * (i / 8));
  await strayMove(640, 120);
  await chrome.sleep(150);
  check('a button-up never heard is a drop where the block last was: over the left side, so it is deleted', (await stacks()) === 0);

  // But if the block was out in the page, a mouse that wanders over the left side with no button down deletes nothing.
  await holdOverLeft();
  await strayMove(38, 440);
  await chrome.sleep(150);
  check('a button-up never heard, with the block out in the page, keeps the block where it was', (await stacks()) === 1 && (await nodeRect('forward')) !== null);
  await chrome.sleep(900);
  check('and the shark and the red stay away', (await settled()) && !(await bandNow()).shown);

  // A stack lying on the trash can is in the trash, wherever it was picked up. A wide one grabbed by its
  // far end has the pointer well away from the can, but the block is on top of it.
  const seedProject = async (project) => {
    await chrome.goto(BASE + 'about.html');
    await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
    await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
    await chrome.sleep(400);
  };
  const wide = { app: 'porttack-turtle', version: 1, stacks: [{ x: 300, y: 300, blocks: [{ op: 'to', name: 'foo', params: ['size'] }, { op: 'forward', args: [100] }] }] };
  const plainRect = (selector, last = false) =>
    chrome.eval(`(() => { const all = [...document.querySelectorAll(${JSON.stringify(selector)})]; const r = all.${last ? 'at(-1)' : 'at(0)'}.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; })()`);
  const canRect = () => chrome.eval(`(() => { const r = document.querySelector('.trash-can').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; })()`);
  /** Grab the wide stack by its last name box, move it so its left end is over the can (or `lift` above it), and hold there. */
  const dragWideOver = async (lift = 0) => {
    await seedProject(wide);
    const hat = await plainRect('.workspace .node.hat');
    const slot = await plainRect('.workspace .node.nameslot', true);
    const can = await canRect();
    const from = { x: slot.left + slot.width / 2, y: slot.top + slot.height / 2 };
    const to = { x: can.left + 10 + (from.x - hat.left), y: can.top + 50 - lift };
    await chrome.mouse('mouseMoved', from.x, from.y, { buttons: 0 });
    await chrome.mouse('mousePressed', from.x, from.y);
    for (let i = 1; i <= 14; i += 1) await chrome.mouse('mouseMoved', from.x + ((to.x - from.x) * i) / 14, from.y + ((to.y - from.y) * i) / 14);
    return to;
  };
  const wideTo = await dragWideOver();
  check('a wide stack grabbed by its far end, lying on the can with the pointer far from it, opens the can', (await sharkAt()).hungry && wideTo.x > 150, `pointer at ${Math.round(wideTo.x)}`);
  await chrome.mouse('mouseReleased', wideTo.x, wideTo.y);
  await chrome.sleep(150);
  check('and letting go deletes it', (await stacks()) === 0);
  await chrome.sleep(1900);

  const nearCan = await dragWideOver(120); // the left end is 120 px above the middle of the can: close, but not on it
  check('a stack that is only near the can does not open it', !(await sharkAt()).hungry);
  await chrome.mouse('mouseReleased', nearCan.x, nearCan.y);
  await chrome.sleep(150);
  check('and letting go keeps it', (await stacks()) === 1);

  // The browser can end a drag in more than one order. Whatever it does, a block over the can is deleted.
  const finishWith = (script) => chrome.eval(`(() => { const svg = document.querySelector('svg.workspace'); const window_ = window; ${script} })()`);
  const holdOverCan = async () => {
    await chrome.goto(BASE + '?speed=instant');
    await openPalette('Turtle');
    await dragFromPalette('forward', 600, 300);
    const at = await nodeRect('forward');
    const from = { x: at.left + 10, y: at.top + at.h / 2 };
    await chrome.mouse('mouseMoved', from.x, from.y, { buttons: 0 });
    await chrome.mouse('mousePressed', from.x, from.y);
    for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', from.x + ((40 - from.x) * i) / 8, from.y + ((450 - from.y) * i) / 8);
  };
  await holdOverCan();
  await finishWith(`svg.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, pointerType: 'mouse', bubbles: true })); window_.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 40, clientY: 450, bubbles: true }));`);
  await chrome.sleep(150);
  check('if the browser says it let go of the pointer just BEFORE the mouse-up, the mouse-up still deletes', (await stacks()) === 0);
  await chrome.sleep(1900);

  // ...but the mouse-up says where it was let go, and that wins over where the block last was.
  await holdOverCan();
  await finishWith(`svg.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, pointerType: 'mouse', bubbles: true })); window_.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 700, clientY: 300, bubbles: true }));`);
  await chrome.sleep(150);
  check('and when that mouse-up is out in the page, away from the can, the block is not deleted', (await stacks()) === 1);
  await chrome.sleep(900);

  await holdOverCan();
  await finishWith(`svg.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true }));`);
  await chrome.sleep(150);
  check('if the browser cancels the pointer while a block is over the can, it counts as dropping it there', (await stacks()) === 0);
  await chrome.sleep(1900);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  const outside = await nodeRect('forward');
  const outsideFrom = { x: outside.left + 10, y: outside.top + outside.h / 2 };
  await chrome.mouse('mouseMoved', outsideFrom.x, outsideFrom.y, { buttons: 0 });
  await chrome.mouse('mousePressed', outsideFrom.x, outsideFrom.y);
  for (let i = 1; i <= 6; i += 1) await chrome.mouse('mouseMoved', outsideFrom.x + 8 * i, outsideFrom.y - 20 * i);
  await finishWith(`svg.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true }));`);
  await chrome.sleep(150);
  check('a cancel with the block out in the page leaves it there, and nothing is red or stuck', (await stacks()) === 1 && !(await bandNow()).shown && (await settled()));
  await strayMove(100, 100);
  check('and the mouse moving after that moves nothing', near((await nodeRect('forward')).left, outside.left + 48, 3));

  // The can sits under the blocks, so a stack carried over the shark is drawn on top of it.
  check('the trash can is under the blocks, so a held stack is drawn on top of the shark',
    await chrome.eval(`(() => { const kids = [...document.getElementById('stage').children]; const can = document.querySelector('.trash-can'); return kids.indexOf(can) < kids.indexOf(document.querySelector('svg.workspace')) && getComputedStyle(can).zIndex === 'auto'; })()`));

  // The window loses focus in the middle of a drag: the block stays where it is, and nothing is stuck.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  const blurred = await nodeRect('forward');
  await chrome.mouse('mouseMoved', blurred.left + 10, blurred.top + blurred.h / 2, { buttons: 0 });
  await chrome.mouse('mousePressed', blurred.left + 10, blurred.top + blurred.h / 2);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', blurred.left + 10 + ((40 - blurred.left - 10) * i) / 8, blurred.top + blurred.h / 2 + ((450 - blurred.top - blurred.h / 2) * i) / 8);
  await chrome.eval(`window.dispatchEvent(new Event('blur'))`);
  await chrome.sleep(150);
  check('losing the window mid-drag puts the drag down without deleting the block', (await stacks()) === 1 && !(await bandNow()).shown && !(await sharkAt()).hungry);
  await chrome.mouse('mouseReleased', 40, 450);
  await chrome.sleep(100);
  check('and the late mouse-up does nothing', (await stacks()) === 1);

  // Less motion: the block is simply deleted, with no flying copy and no chewing.
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  const calm = await nodeRect('forward');
  await chrome.drag({ x: calm.left + 10, y: calm.top + calm.h / 2 }, { x: 40, y: 450 }, 10);
  await chrome.sleep(100);
  check('with reduced motion on, it is deleted at once with no flying copy', (await stacks()) === 0 && (await ghosts()) === 0 && !(await chrome.eval(`document.querySelector('.trash-can').classList.contains('eating')`)));
  await chrome.send('Emulation.setEmulatedMedia', { features: [] });

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
  check('the Flow palette lists its eight blocks', (await count('.flyout .stack')) === 8);
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
  await openPalette('Boxes');
  check('the Boxes palette lists four store blocks and four box blocks, and nothing of your own', (await count('.flyout .stack')) === 8 && (await count('.flyout .stack[data-op=to]')) === 0);
  await dragFromPalette('store1', 450, 150);
  check('the readout appears once a box block is on the page', !(await readoutHidden()) && (await readoutText()) === 'box1 0 box2 0 box3 0 box4 0', await readoutText());

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
  await openPalette('Boxes');
  await dragFromPalette('box1', forwardNumber.left + 2, forwardNumber.top + 2);
  check('box1 plugs into the forward block like any reporter', (await count('.workspace .node.reporter')) === 1 && (await count('.workspace .node.literal')) === 1);

  const storeNow = await nodeRect('store in box1');
  await chrome.click(storeNow.left + 10, storeNow.top + storeNow.h / 2);
  await chrome.sleep(300);
  check('running it moves the turtle by what was stored in the box', near(await stepsUp(), 40 * scale, 3), `${(await stepsUp()).toFixed(1)}px up, expected ${(40 * scale).toFixed(1)}`);
  check('the readout shows the stored number', (await readoutText()) === 'box1 40 box2 0 box3 0 box4 0', await readoutText());

  await dragFromPalette('box1', 700, 450);
  // There are two box1 blocks now (one plugged in); the lone one is the last in the page.
  const lone = await chrome.eval(`(() => {
    const all = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].filter((n) => n.textContent.trim() === 'box1');
    return (${rectJs})(all.at(-1));
  })()`);
  await chrome.click(lone.left + 12, lone.top + lone.h / 2);
  await chrome.sleep(150);
  check('tapping a lone box1 shows what the last run left in it', /box1 is 40/.test(await messageText()), await messageText());
  check('looking at a box does not change it', (await readoutText()) === 'box1 40 box2 0 box3 0 box4 0');

  await chrome.goto(BASE + '?demo=boxes&speed=instant');
  await pressRun();
  check('the boxes demo draws its square, sized by box1', near(await stepsUp(), 0, 2) && (await readoutText()) === 'box1 120 box2 0 box3 0 box4 0', await readoutText());

  await chrome.goto(BASE + '?demo=boxorder&speed=instant');
  await pressRun();
  await pressRun();
  check('each run starts with empty boxes: reading a box before storing in it always gives 0',
    near(await stepsUp(), 0, 1) && (await readoutText()) === 'box1 50 box2 0 box3 0 box4 0', `${(await stepsUp()).toFixed(1)}px up`);

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

  // ---- if else: two mouths, and only one of them runs -------------------------------------------
  // Build "if (condition) forward, else back" by dragging, then run it.
  const buildIfElse = async (conditionOp) => {
    await chrome.goto(BASE + '?speed=instant');
    await openPalette('Flow');
    await dragFromPalette('ifelse', 420, 100);
    const empty = await nodeRect('ifelse');
    await openPalette('Turtle');
    // With both mouths empty, the else mouth starts 63 px below the first one.
    await dragFromPalette('back', empty.left + 13.5 + 4, empty.top + 126 + 4);
    const elsed = await nodeRect('back');
    await dragFromPalette('forward', empty.left + 13.5 + 4, empty.top + 63 + 4);
    const first = await nodeRect('forward');
    const grown = await nodeRect('ifelse');
    await openPalette('Math');
    await dragFromPalette(conditionOp, grown.left + grown.w - 12, grown.top + 2);
    return { empty, elsed, first, grown };
  };

  const yes = await buildIfElse('equal');
  check('both mouths of an if else take a block, and they stay one stack', (await stacks()) === 1 && (await count('.workspace .node.command')) === 2, `${await stacks()} stacks`);
  check('the first mouth holds forward, above the else mouth holding back', yes.first.bottom <= (await nodeRect('back')).top && (await nodeRect('forward')).top < (await nodeRect('back')).top);
  check('the else label sits between the two mouths', await chrome.eval(`(() => {
    const t = [...document.querySelectorAll('.workspace .node.clamp text')].find((x) => x.textContent === 'else');
    if (!t) return false;
    const y = t.getBoundingClientRect().top + t.getBoundingClientRect().height / 2;
    const forward = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.trim() === 'forward').getBoundingClientRect();
    const back = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.trim() === 'back').getBoundingClientRect();
    return y > forward.bottom && y < back.top;
  })()`));
  await chrome.screenshot(SHOTS + 'editor-ifelse.png');
  await tapBlockNamed('ifelse');
  await chrome.sleep(300);
  check('if else with a true condition runs only the first mouth (forward goes up)', (await stepsUp()) > 5, `${(await stepsUp()).toFixed(0)}px up`);

  await buildIfElse('less');
  await tapBlockNamed('ifelse');
  await chrome.sleep(300);
  check('if else with a false condition runs only the else mouth (back goes down)', (await stepsUp()) < -5, `${(await stepsUp()).toFixed(0)}px up (negative = down)`);

  await chrome.goto(BASE + '?demo=ifelseyes&speed=instant');
  await pressRun();
  check('the true demo goes 100 steps up', near(await stepsUp(), 100 * scale, 3), `${(await stepsUp()).toFixed(0)}px up`);
  await chrome.goto(BASE + '?demo=ifelseno&speed=instant');
  await pressRun();
  check('the false demo goes 100 steps down', near(-(await stepsUp()), 100 * scale, 3), `${(await stepsUp()).toFixed(0)}px up (negative = down)`);

  // ---- The speed block: the only speed control, and it lasts for one run ----------------------
  await chrome.goto(BASE + '?speed=instant');
  check('the toolbar has no speed menu', (await count('.toolbar select')) === 0 && (await count('#speed')) === 0);

  const runIsOver = () => chrome.eval(`!document.getElementById('run').disabled`);
  /** Wait for the run to end. Returns how many milliseconds it took, or null if it was still going after `limit`. */
  const timeRun = async (limit) => {
    const began = Date.now();
    while (Date.now() - began < limit) {
      if (await runIsOver()) return Date.now() - began;
      await chrome.sleep(50);
    }
    return null;
  };

  await chrome.goto(BASE + '?demo=slowdown&speed=instant');
  await pressRun();
  check('a speed block of 1 slows the program to a crawl (still running 300 ms later)', !(await runIsOver()));
  const slowTook = await timeRun(8000);
  check('and the program does finish, taking seconds, not instants', slowTook !== null && slowTook > 1200, `${slowTook} ms more`);

  // Run starts again from the normal speed, even though the last run ended at slow.
  await openPalette('Flow');
  const tapPoint = await chrome.eval(`(() => {
    document.querySelector('.flyout .stack[data-op=repeat]').scrollIntoView({ block: 'nearest' });
    const stack = document.querySelector('.flyout .stack[data-op=repeat]');
    const r = stack.getBoundingClientRect();
    for (let y = r.top + 6; y < r.bottom - 2; y += 3) {
      for (let x = r.left + 4; x < r.right - 2; x += 3) {
        if (document.elementFromPoint(x, y)?.closest('.stack') === stack) return { x, y };
      }
    }
    return null;
  })()`);
  await chrome.click(tapPoint.x, tapPoint.y);
  await chrome.sleep(150);
  const againTook = await timeRun(1500);
  check('the next run starts at the normal speed again (a slow run would take 2 seconds)', againTook !== null && againTook < 1000, `${againTook} ms`);

  await chrome.goto(BASE + '?demo=speedup&speed=instant');
  await pressRun();
  const upTook = await timeRun(8000);
  check('a speed block of 4 in the middle of a slow run finishes it at once (fifty slow steps would take 25 seconds)', upTook !== null && upTook < 3500, `${upTook} ms more`);
  check('and the outline that follows a slow run is gone afterwards', (await count('.workspace .running')) === 0, `${await count('.workspace .running')} outlined`);

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Flow');
  await dragFromPalette('speed', 450, 150);
  check('a speed block comes out of the palette set to 1, so using one does something you can see',
    (await chrome.eval(`document.querySelector('.workspace .stack').textContent.replace(/\\s+/g, '')`)) === 'speed1');

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
  check('the pen color readers report red, green and blue', (await readoutText()) === 'box1 10 box2 20 box3 30 box4 0', await readoutText());

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
  check('forever with an if and a stop: counts five laps and stops itself', near(await stepsUp(), 50 * scale, 2) && (await readoutText()) === 'box1 5 box2 0 box3 0 box4 0',
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

  // ---- Blocks you make yourself (functions) -----------------------------------------------------
  const typeAndEnter = async (text) => {
    await chrome.sleep(100);
    await chrome.send('Input.insertText', { text });
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await chrome.sleep(120);
  };
  /** The little name boxes on `to` blocks, as { text, empty, rect }. */
  const nameSlots = () =>
    chrome.eval(`[...document.querySelectorAll('.workspace .node.nameslot')].map((n) => ({ text: n.textContent.trim(), rect: (${rectJs})(n) }))`);
  const clickSlot = async (index) => {
    const slot = (await nameSlots())[index];
    await chrome.click(slot.rect.left + slot.rect.w / 2, slot.rect.top + slot.rect.h / 2);
  };
  const flyoutTexts = () => chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op + ':' + s.textContent.replace(/\\s+/g, ''))`);
  const errorCount = () => count('.workspace .error');

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('My Blocks');
  check('the My Blocks palette starts with just a to block (the boxes are in their own palette), and no calls yet',
    (await count('.flyout .stack')) === 1 && (await flyoutTexts())[0].startsWith('to:to') && (await count('.flyout .stack[data-op=call]')) === 0, (await flyoutTexts()).join(' '));

  await dragFromPalette('to', 450, 150);
  check('a to block lands as a stack of its own, with boxes for its name and for adding an input',
    (await stacks()) === 1 && (await nameSlots()).map((x) => x.text).join('|') === 'myblock|input', (await nameSlots()).map((x) => x.text).join('|'));

  await clickSlot(0);
  await typeAndEnter('go');
  check('typing in the first box names the block', (await nameSlots())[0].text === 'go', (await nameSlots())[0].text);
  const afterName = await flyoutTexts();
  check('and a call to it appears in the palette at once', afterName.some((t) => t === 'call:go'), afterName.join(' '));

  await clickSlot(1);
  await typeAndEnter('distance');
  check('typing in the dashed box adds an input, and a new dashed box follows', (await nameSlots()).map((x) => x.text).join('|') === 'go|distance|input', (await nameSlots()).map((x) => x.text).join('|'));
  const afterInput = await flyoutTexts();
  check('the palette now has a call with a socket, and an input block to use inside', afterInput.some((t) => t.startsWith('call:go') && t.includes('distance')) && afterInput.includes('input:distance'), afterInput.join(' '));
  check('the call in the palette comes out with a number socket', await chrome.eval(`document.querySelectorAll('.flyout .stack[data-op=call] .node.literal').length === 1`));

  const hatRect = await nodeRect('to');
  await openPalette('Turtle');
  await dragFromPalette('forward', hatRect.left + 6, hatRect.bottom + 4);
  check('a block snaps under the to block: it is part of what the block does', (await stacks()) === 1 && (await count(BLOCK_NODES)) === 2);
  const forwardSocket2 = await literalRect(0);
  await openPalette('My Blocks');
  await dragFromPalette('input', forwardSocket2.left + 2, forwardSocket2.top + 2);
  check('the input block plugs into forward like any number block', (await count('.workspace .node.reporter')) === 1 && (await count('.workspace .node.literal')) === 0);

  await openPalette('Flow');
  await dragFromPalette('start', 450, 420);
  const startRect = await nodeRect('start');
  await openPalette('My Blocks');
  await dragFromPalette('call', startRect.left + 6, startRect.bottom + 4);
  check('the call snaps under Start', (await stacks()) === 2 && (await count('.workspace .node.command')) === 2);
  const callSocket = await literalRect(0);
  await chrome.click(callSocket.left + callSocket.w / 2, callSocket.top + callSocket.h / 2);
  await typeAndEnter('60');
  await pressRun();
  check('running goes forward by the number given to the call', near(await stepsUp(), 60 * scale, 3), `${(await stepsUp()).toFixed(1)}px up, expected ${(60 * scale).toFixed(1)}`);

  const upAfterFirst = await stepsUp();
  await clickSlot(0);
  await typeAndEnter('jump');
  check('renaming the block renames the call to it', await chrome.eval(`[...document.querySelectorAll('.workspace .node.command')].some((n) => n.textContent.includes('jump'))`));
  check('and the palette follows', (await flyoutTexts()).some((t) => t.startsWith('call:jump')));
  await pressRun();
  check('the renamed call still runs the block', near((await stepsUp()) - upAfterFirst, 60 * scale, 3), `${((await stepsUp()) - upAfterFirst).toFixed(1)}px more`);

  const hatNow = await nodeRect('to');
  const nav = await chrome.centerOf('.palette-button[title="Turtle"]');
  await chrome.drag({ x: hatNow.left + 10, y: hatNow.top + hatNow.h / 2 }, { x: nav.x, y: nav.y }, 10);
  await chrome.sleep(100);
  check('dropping the to block on the palette deletes the block and its blocks', (await stacks()) === 1 && (await count('.workspace .node.nameslot')) === 0);
  await pressRun();
  check('the call that is left says the block is gone, and is outlined', /There is no block called jump/.test(await messageText()) && (await errorCount()) === 1, await messageText());
  await clickButton('undo');
  check('Undo brings the block back', (await stacks()) === 2 && (await count('.workspace .node.nameslot')) === 3);
  await pressRun();
  check('and the call works again', (await messageText()) === '' && (await errorCount()) === 0, await messageText());

  // Names that will not do are refused, and the student is told why.
  await clickSlot(0);
  await typeAndEnter('no-dashes');
  check('a name with odd characters is refused with a reason, and the old name stays', /letters, numbers/.test(await messageText()) && (await nameSlots())[0].text === 'jump', await messageText());
  await clickSlot(1);
  await chrome.sleep(100);
  check('the name box will not take more letters than a name can have, so a name is never too long to type',
    (await chrome.eval(`document.querySelector('.number-input').maxLength`)) === 10);
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(100);
  check('Escape leaves the name as it was', (await nameSlots())[1].text === 'distance' && (await count('.number-input')) === 0);
  await clickSlot(2);
  await typeAndEnter('DISTANCE');
  check('a second input with the same name is refused', /already has an input/.test(await messageText()), await messageText());

  // Autosave keeps the blocks you made, and a reload brings them back.
  await chrome.sleep(600);
  const keptText = await chrome.eval(`localStorage.getItem('turtlelab-project')`);
  check('autosave keeps the block you made', /"op":"to"/.test(keptText ?? '') && /"name":"jump"/.test(keptText ?? ''));
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('after a reload the block is back, and so is its call in the palette',
    (await count('.workspace .node.nameslot')) === 3 && (await nameSlots())[0].text === 'jump' && (await (async () => { await openPalette('My Blocks'); return (await flyoutTexts()).some((t) => t.startsWith('call:jump')); })()));

  // A block with no name clash: tapping it explains itself, and copies get a name of their own.
  await chrome.goto(BASE + '?demo=squarefn&speed=instant');
  const squareHat = await nodeRect('to');
  await chrome.click(squareHat.left + 14, squareHat.top + squareHat.h / 2 + 4);
  await chrome.sleep(150);
  check('tapping a to block says what it is, and draws nothing', /block you made/.test(await messageText()) && near(await stepsUp(), 0, 2), await messageText());
  const hatBox = await nodeRect('to');
  await chrome.drag({ x: hatBox.left + 14, y: hatBox.top + hatBox.h / 2 + 4 }, { x: hatBox.left + 200, y: hatBox.top + 330 }, 8, { modifiers: SHIFT });
  await chrome.sleep(150);
  check('copying a block you made gives the copy a name of its own, so there are never two the same',
    (await nameSlots()).map((x) => x.text).filter((t) => /^square/.test(t)).sort().join() === 'square,square2', (await nameSlots()).map((x) => x.text).join('|'));
  check('and the copy is ready to use: its call is in the palette', await (async () => { await openPalette('My Blocks'); return (await flyoutTexts()).filter((t) => t.startsWith('call:square')).length === 2; })());

  // The demos: each ends the way it should, in the real browser.
  await chrome.goto(BASE + '?demo=squarefn&speed=instant');
  await pressRun();
  check('two squares from one block: it runs, draws, and ends where it began', (await messageText()) === '' && near(await stepsUp(), 0, 2));
  await chrome.goto(BASE + '?demo=circlefn&speed=instant');
  await pressRun();
  const circleDone = (await timeRun(6000)) !== null;
  check('a block that calls itself 360 deep runs to the end (a circle), with no message', circleDone && (await messageText()) === '', await messageText());
  await chrome.goto(BASE + '?demo=stopinside&speed=instant');
  await pressRun();
  check('stop inside a block only leaves that block: 10 then the 5 after it', near(await stepsUp(), 15 * scale, 3), `${(await stepsUp()).toFixed(1)}px up, expected ${(15 * scale).toFixed(1)}`);
  await chrome.goto(BASE + '?demo=forevercall&speed=instant');
  await pressRun();
  const runaway = await timeRun(6000);
  check('a block that calls itself forever ends with a friendly message and one outlined block', runaway !== null && /called itself more than \d+ times\. Does it have a way to stop\?/.test(await messageText()) && (await errorCount()) === 1, await messageText());
  await chrome.goto(BASE + '?demo=ghostcall&speed=instant');
  await pressRun();
  check('a call to a block that is not there says so', /There is no block called ghost/.test(await messageText()) && (await errorCount()) === 1, await messageText());
  await chrome.goto(BASE + '?demo=twinblocks&speed=instant');
  await pressRun();
  check('two blocks with the same name: Run says so before running, and outlines the second', /Two of your blocks are both called Twin/.test(await messageText()) && (await errorCount()) === 1 && near(await stepsUp(), 0, 2), await messageText());

  // The Run button on a page with only blocks you made.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('My Blocks');
  await dragFromPalette('to', 450, 200);
  await pressRun();
  check('with only a to block on the page, Run says to add a Start and a call', /Start block.*call to the block you made/.test(await messageText()), await messageText());

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

  // ---- Saving a PDF ------------------------------------------------------------------------
  const savedPdfs = () => readdirSync(downloads).filter((f) => f.endsWith('.pdf')).sort();
  const waitForPdf = async () => {
    for (let i = 0; i < 100; i += 1) {
      if (savedPdfs().length > 0) return savedPdfs().at(-1);
      await chrome.sleep(100);
    }
    return null;
  };
  const poppler = ['pdfinfo', 'pdfdetach', 'pdftoppm'].every((tool) => !spawnSync(tool, ['-v']).error);

  await chrome.goto(BASE + '?demo=squarefn&speed=instant');
  await pressRun();
  check('the toolbar has a PDF button, with the PDF icon, that says what it does',
    (await count('#save-pdf')) === 1 && (await chrome.eval(`document.querySelector('#save-pdf img').getAttribute('src')`)) === 'images/pdf-button.svg' && /Save a PDF: your blocks on top/.test(await chrome.eval(`document.getElementById('save-pdf').title`)));
  // The blocks on the page are the demo's, as the app cleans them when it loads them.
  const onPage = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: structuredClone(DEMOS.squarefn.stacks) }).project;
  const requestsBefore = chrome.requestLog.length;
  await clickButton('save-pdf');
  const pdfName = await waitForPdf();
  check('Save as PDF downloads a PDF named with the date and time', /^turtlelab-\d{4}-\d{2}-\d{2}-\d{4}\.pdf$/.test(pdfName ?? ''), pdfName);
  await chrome.sleep(300);
  check('and says what is in it, and how to open it again', /Saved turtlelab-.*\.pdf\. The blocks are on top and the drawing is below\. Drag the PDF onto this page/.test(await messageText()), await messageText());
  const pdfBytes = new Uint8Array(readFileSync(join(downloads, pdfName)));
  check('it is a real PDF of a sensible size', isPdf(pdfBytes) && pdfBytes.length > 20000 && pdfBytes.length < 3000000, `${pdfBytes.length} bytes`);
  const fromPdf = readProjectFile(pdfBytes);
  check('the PNG inside it has the blocks: exactly the ones that were on the page, both stacks (the block and its program)',
    fromPdf.ok && fromPdf.kind === 'pdf' && fromPdf.project.stacks.length === 2 && JSON.stringify(fromPdf.project) === JSON.stringify(onPage), fromPdf.ok ? JSON.stringify(fromPdf.project).slice(0, 120) : fromPdf.error);
  const sent = chrome.requestLog.slice(requestsBefore).filter((r) => /^https?:/.test(r.url));
  check('making it used no network at all: not one request, to this site or any other',
    sent.length === 0, sent.map((r) => `${r.method} ${r.url}`).join(' | '));
  check('and no sockets were opened', chrome.webSockets === 0);

  if (poppler) {
    const pdfPath = join(downloads, pdfName);
    const info = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
    check('a real PDF reader (poppler) says it is one page of US Letter, with no complaints', info.status === 0 && /Pages:\s+1/.test(info.stdout) && /612 x 792 pts \(letter\)/.test(info.stdout) && !/Error|Syntax/i.test(info.stderr), info.stderr.slice(0, 120));
    check('and lists the attached picture', /\.png/.test(spawnSync('pdfdetach', ['-list', pdfPath], { encoding: 'utf8' }).stdout));
    const pages = join(downloads, 'pdfpage');
    const drawn = spawnSync('pdftoppm', ['-png', '-r', '30', pdfPath, pages], { encoding: 'utf8' });
    check('and can draw the page', drawn.status === 0 && !/Error|Syntax/i.test(drawn.stderr));

    // The turtle is on the PDF's drawing (the grader wants to see which way it faces), but the PNG attached
    // to the same PDF is the bare paper. Count the turtle's green, in the page poppler draws and in the PNG.
    const ppmBase = join(downloads, 'pdfcolor');
    spawnSync('pdftoppm', ['-r', '100', pdfPath, ppmBase], { encoding: 'utf8' });
    const ppm = readFileSync(`${ppmBase}-1.ppm`);
    const [header, ppmWidth, ppmHeight] = /^P6\s+(\d+)\s+(\d+)\s+255\s/.exec(ppm.subarray(0, 40).toString('latin1'));
    const isTurtleGreen = (r, g, b) => g > r + 40 && g > b + 100;
    const greenIn = (fromRow, toRow) => {
      let n = 0;
      for (let row = fromRow; row < toRow; row += 1) {
        for (let col = 0; col < Number(ppmWidth); col += 1) {
          const at = header.length + (row * Number(ppmWidth) + col) * 3;
          if (isTurtleGreen(ppm[at], ppm[at + 1], ppm[at + 2])) n += 1;
        }
      }
      return n;
    };
    const half = Math.floor(Number(ppmHeight) / 2);
    check('the turtle is on the drawing in the bottom half of the PDF page', greenIn(half, Number(ppmHeight)) > 500, `${greenIn(half, Number(ppmHeight))} green pixels`);
    check('and not in the blocks above it', greenIn(0, half) === 0, `${greenIn(0, half)} green pixels`);
    const attachedPng = readProjectFile(pdfBytes).picture;
    const greenInAttached = await chrome.eval(`(async () => {
      const image = new Image();
      image.src = 'data:image/png;base64,${Buffer.from(attachedPng).toString('base64')}';
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let turtle = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i] === 108 && data[i + 1] === 198 && data[i + 2] === 0) turtle++;
      return turtle;
    })()`);
    check('but the PNG attached to the PDF is the bare paper, with no turtle in it', greenInAttached === 0, `${greenInAttached} turtle pixels`);
  }

  // paperWithTurtle (what the PDF's drawing is made from): the turtle is where it is and faces the way it faces, and the
  // paper underneath is not touched. The turtle's body is a little heavier toward the tail, so the middle of its pixels sits
  // a little behind where it is. Drawn big (so the difference is many pixels, not one), that offset must point away from the
  // way it faces at every heading.
  await chrome.goto(BASE + '?speed=instant');
  const stamped = await chrome.eval(`(async () => {
    const { CanvasView, PIXEL_RATIO } = await import('./js/ui/canvas-view.js');
    const { PAPER_W, PAPER_H } = await import('./js/core/turtle.js');
    const results = {};
    for (const size of [undefined, 300]) {
      for (const heading of [0, 45, 90, 135, 180, 270]) {
        const turtle = { x: 80, y: -40, heading };
        const view = new CanvasView({ stage: document.createElement('div'), turtle });
        const before = view.canvas.toDataURL();
        const copy = await view.paperWithTurtle(size);
        const data = copy.getContext('2d').getImageData(0, 0, copy.width, copy.height).data;
        let n = 0, sumX = 0, sumY = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 1] > data[i] + 40 && data[i + 1] > data[i + 2] + 100) {
            const at = i / 4;
            n += 1; sumX += at % copy.width; sumY += Math.floor(at / copy.width);
          }
        }
        results[(size ?? 'normal') + ':' + heading] = { n, x: sumX / n, y: sumY / n, paperUntouched: view.canvas.toDataURL() === before,
          sameSize: copy.width === view.canvas.width && copy.height === view.canvas.height,
          anchorX: (80 + PAPER_W / 2) * PIXEL_RATIO, anchorY: (PAPER_H / 2 + 40) * PIXEL_RATIO };
      }
    }
    return results;
  })()`);
  const headings = [0, 45, 90, 135, 180, 270];
  const normal = (h) => stamped[`normal:${h}`];
  const big = (h) => stamped[`300:${h}`];
  check('paperWithTurtle draws the turtle (thousands of its pixels), and leaves the paper itself bare',
    headings.every((h) => normal(h).n > 2000 && normal(h).paperUntouched && normal(h).sameSize && big(h).n > 50000 && big(h).paperUntouched), JSON.stringify(normal(0)));
  const around = (found) => ({ dx: found.x - found.anchorX, dy: found.y - found.anchorY });
  check('the turtle is at its own spot on the paper, whichever way it faces', headings.every((h) => Math.hypot(around(normal(h)).dx, around(normal(h)).dy) < 8),
    headings.map((h) => `${h}:${around(normal(h)).dx.toFixed(1)},${around(normal(h)).dy.toFixed(1)}`).join(' '));
  const behind = headings.map((h) => {
    const { dx, dy } = around(big(h));
    const ahead = dx * Math.sin((h * Math.PI) / 180) - dy * Math.cos((h * Math.PI) / 180); // how far toward the nose (screen y points down)
    return { h, ahead };
  });
  check('and the middle of its pixels is behind it at every heading, so the nose points the way the heading says',
    behind.every(({ ahead }) => ahead < -4), behind.map(({ h, ahead }) => `${h}:${ahead.toFixed(1)}`).join(' '));

  await clickButton('new');
  check('New clears the page', (await stacks()) === 0);
  // Dropping the PDF on the page works like dropping a picture: the browser must not open it in the tab instead.
  const pdfB64 = Buffer.from(pdfBytes).toString('base64');
  const droppedPdf = await dropOnPage(`const bytes = Uint8Array.from(atob('${pdfB64}'), (c) => c.charCodeAt(0)); const dataTransfer = new DataTransfer(); dataTransfer.items.add(new File([bytes], 'saved-pdf.pdf', { type: 'application/pdf' }));`);
  await chrome.sleep(900);
  check('dropping a TurtleLab PDF on the page brings back the blocks and the drawing', (await stacks()) === 2 && (await redPixels()) > 100 && /^Opened saved-pdf\.pdf/.test(await messageText()), await messageText());
  check('and the browser keeps the page instead of opening the PDF in the tab', droppedPdf.handled && droppedPdf.stillHere && droppedPdf.highlighted && droppedPdf.finished, JSON.stringify(droppedPdf));
  const droppedRects = await chrome.eval(`[...document.querySelectorAll('.workspace .stack')].map((g) => { const r = g.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; })`);
  await clickButton('new');
  await chrome.setFileInput('#open-file', [join(downloads, pdfName)]);
  await chrome.sleep(900);
  check('opening the PDF brings the blocks back, both stacks', (await stacks()) === 2 && (await count('.workspace .node.nameslot')) >= 1 && /^Opened turtlelab-.*\.pdf/.test(await messageText()), await messageText());
  check('and the drawing comes back too, from the picture attached to it', (await redPixels()) > 100);
  const openedRects = await chrome.eval(`[...document.querySelectorAll('.workspace .stack')].map((g) => { const r = g.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; })`);
  check('and every stack is back exactly where it was on the screen', JSON.stringify(openedRects) === JSON.stringify(droppedRects) && openedRects.length === 2, `${JSON.stringify(openedRects)} vs ${JSON.stringify(droppedRects)}`);
  await chrome.sleep(700); // autosave
  check('and they are exactly the blocks that were saved', JSON.stringify(JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`))) === JSON.stringify(onPage));
  await chrome.goto(BASE + '?speed=instant');
  await clickButton('save-pdf');
  await chrome.sleep(1500);
  check('with nothing on the page, a PDF is still made (and says so)', /^Saved turtlelab-.*\.pdf/.test(await messageText()), await messageText());

  // The picture of the blocks in the PDF looks like the screen: same arrangement, with only the wide empty bands closed up.
  await chrome.goto(BASE + '?speed=instant');
  const placement = await chrome.eval(`(async () => {
    const { renderCodeImage } = await import('./js/ui/code-image.js');
    const { sampleById, sampleStacks } = await import('./js/ui/samples.js');
    const { noteHeight, stackSize } = await import('./js/ui/block-view.js');
    const stacks = sampleStacks(sampleById('tree'), { noteHeight, stackSize, stageWidth: 1366 });
    const image = await renderCodeImage({ stacks });
    return image.placements.map((p) => ({ what: p.stack.blocks[0].op, x: p.x, y: p.y, width: p.width, height: p.height, screenX: p.stack.x, screenY: p.stack.y }));
  })()`);
  const [pNote, pProgram, pBlock] = placement; // the sample's order: its note, its program, then the block it makes
  check('in the PDF the block you made is still on the left, with the note above the program on the right, as on the screen',
    pBlock.x < pNote.x && pNote.x === pProgram.x && pNote.y < pProgram.y && pBlock.screenX < pNote.screenX, JSON.stringify(placement.map((p) => [p.what, p.x, p.y])));
  check('and the note is the same distance above the program as on the screen', pProgram.y - pNote.y === pProgram.screenY - pNote.screenY, `${pProgram.y - pNote.y} vs ${pProgram.screenY - pNote.screenY}`);
  check('the only change is the empty space: the band between the block and the note, which was over 600 wide, is now 40',
    pNote.screenX - (pBlock.screenX + pBlock.width) > 600 && pNote.x - (pBlock.x + pBlock.width) === 40, `${pNote.screenX - (pBlock.screenX + pBlock.width)} became ${pNote.x - (pBlock.x + pBlock.width)}`);
  await chrome.goto(BASE + '?sample=square&speed=instant');
  const small = await chrome.eval(`(async () => {
    const { renderCodeImage } = await import('./js/ui/code-image.js');
    const { sampleById, sampleStacks } = await import('./js/ui/samples.js');
    const { noteHeight, stackSize } = await import('./js/ui/block-view.js');
    const stacks = sampleStacks(sampleById('square'), { noteHeight, stackSize, stageWidth: 1366 });
    const image = await renderCodeImage({ stacks });
    return image.placements.map((p) => ({ x: p.x, y: p.y, screenX: p.stack.x, screenY: p.stack.y }));
  })()`);
  check('a page that was already close together is not changed at all', small.every((p) => p.x === small[0].x && p.y - small[0].y === p.screenY - small[0].screenY), JSON.stringify(small));

  // A PDF that did not come from TurtleLab is turned away with a reason.
  const stranger = join(downloads, 'stranger.pdf');
  writeFileSync(stranger, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
  await chrome.setFileInput('#open-file', [stranger]);
  await chrome.sleep(600);
  check('a PDF that TurtleLab did not make is turned away, saying why', /doesn't have a TurtleLab picture inside it/.test(await messageText()), await messageText());

  // ---- The Python box ---------------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  const pythonShown = () => chrome.eval(`getComputedStyle(document.getElementById('python-box')).display !== 'none'`);
  const pythonText = () => chrome.eval(`document.querySelector('.python-code').textContent`);
  check('the Python box starts hidden, and its button says so', !(await pythonShown()) && (await chrome.eval(`document.getElementById('python-toggle').getAttribute('aria-pressed')`)) === 'false');
  await clickButton('python-toggle');
  check('the button shows it, and the button looks pressed', (await pythonShown()) && (await chrome.eval(`document.getElementById('python-toggle').getAttribute('aria-pressed')`)) === 'true' && /Hide/.test(await chrome.eval(`document.getElementById('python-toggle').title`)));
  check('with nothing on the page it says what to do', /Drag some blocks onto the page/.test(await pythonText()), await pythonText());
  check('the writing is small', (await chrome.eval(`parseFloat(getComputedStyle(document.querySelector('.python-code')).fontSize)`)) <= 12);
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 300);
  check('a block dragged onto the page shows up in the Python at once', /forward\(100\)/.test(await pythonText()) && /from turtle import \*/.test(await pythonText()), await pythonText());
  await chrome.sleep(700);
  const pageProject = JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`));
  check('it is exactly the Python for the blocks that are on the page', (await pythonText()) === toPython(pageProject));
  await clickButton('undo');
  check('Undo takes it back out of the Python', !/forward\(100\)/.test(await pythonText()));
  await clickButton('redo');
  check('and Redo puts it back', /forward\(100\)/.test(await pythonText()));
  await clickButton('hide-blocks');
  check('hiding the blocks hides the Python too, so the whole picture shows', !(await pythonShown()));
  await clickButton('hide-blocks');
  check('and showing the blocks brings it back', await pythonShown());
  await chrome.eval(`document.getElementById('message').textContent = ''`);
  const copy = await chrome.centerOf('.python-copy');
  await chrome.click(copy.x, copy.y);
  await chrome.sleep(300);
  check('Copy copies it, or if the browser will not, selects it and says how to copy', /Copied the Python|The code is selected/.test(await messageText()), await messageText());
  await clickButton('python-toggle');
  check('the button hides it again', !(await pythonShown()));
  await chrome.goto(BASE + '?demo=squarefn&speed=instant');
  await clickButton('python-toggle');
  check('blocks of your own show as Python functions, called by name', /def square\(size\):/.test(await pythonText()) && /^square\(70\)$/m.test(await pythonText()), (await pythonText()).slice(0, 80));
  await chrome.goto(BASE + '?sample=tree&speed=instant');
  await clickButton('python-toggle');
  check('and so does a sample', /def tree\(size\):/.test(await pythonText()) && /tree\(size \* 0\.7\)/.test(await pythonText()));

  // ---- Sticky notes ----------------------------------------------------------------------------------
  const noteRect = () =>
    chrome.eval(`(() => { const n = document.querySelector('.workspace .node.note'); return n ? (${rectJs})(n) : null; })()`);
  // The words as a reader sees them: wrapped lines joined with a space.
  const noteWords = () => chrome.eval(`(() => { const n = document.querySelector('.workspace .node.note'); return n ? [...n.querySelectorAll('tspan')].map((t) => t.textContent).join(' ').trim() : null; })()`);
  const writeNote = async (words) => {
    const r = await noteRect();
    await chrome.click(r.left + 30, r.top + 40);
    await chrome.sleep(150);
    await chrome.send('Input.insertText', { text: words });
    await chrome.click(850, 640); // clicking away keeps what was written
    await chrome.sleep(200);
  };

  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Notes');
  check('the Notes palette has the sticky note and the three text blocks (write, set font, set curve), and nothing else', (await count('.flyout .stack')) === 4 && (await count('.flyout .stack[data-op=note]')) === 1 && (await count('.flyout .stack[data-op=write]')) === 1 && (await count('.flyout .stack[data-op=setfont]')) === 1 && (await count('.flyout .stack[data-op=setcurve]')) === 1);
  await dragFromPalette('note', 480, 120);
  check('a note dragged out lands on the page, asking to be written on', (await stacks()) === 1 && (await noteWords()) === 'Tap to write a note.');

  const emptyNote = await noteRect();
  await chrome.click(emptyNote.left + 30, emptyNote.top + 40);
  await chrome.sleep(150);
  check('tapping a note opens a writing box over it, and does not run anything', (await count('.note-input')) === 1 && (await chrome.eval(`document.activeElement.className`)) === 'note-input');
  await chrome.send('Input.insertText', { text: 'Draws a square with four sides.' });
  await chrome.click(850, 640);
  await chrome.sleep(200);
  check('clicking away keeps the words, shown on the note', (await count('.note-input')) === 0 && /Draws a square with four sides\./.test(await noteWords()), await noteWords());

  await clickButton('undo');
  check('Undo takes the words away again', (await noteWords()) === 'Tap to write a note.');
  await clickButton('redo');
  check('and Redo brings them back', /Draws a square/.test(await noteWords()));

  const wordsBefore = await noteWords();
  const r1 = await noteRect();
  await chrome.click(r1.left + 30, r1.top + 40);
  await chrome.sleep(150);
  await chrome.send('Input.insertText', { text: ' EXTRA' });
  await key('Escape', 'Escape', 27, 0);
  await chrome.sleep(150);
  check('Escape cancels what was typed', (await count('.note-input')) === 0 && (await noteWords()) === wordsBefore);

  await writeNote(' ' + 'a very long explanation '.repeat(8));
  const long = await chrome.eval(`(() => {
    const n = document.querySelector('.workspace .node.note');
    const box = n.querySelector('path').getBoundingClientRect();
    const lines = [...n.querySelectorAll('tspan')].map((t) => t.getBoundingClientRect());
    return { lines: lines.length, height: box.height, outside: lines.filter((l) => l.left < box.left || l.right > box.right || l.bottom > box.bottom + 1).length };
  })()`);
  check('long words wrap onto more lines, and the note grows to hold them', long.lines > 4 && long.outside === 0 && long.height > 100, JSON.stringify(long));

  // Notes connect to nothing.
  await openPalette('Turtle');
  const noteBox = await noteRect();
  await dragFromPalette('forward', noteBox.left + 4, noteBox.bottom + 4);
  check('a block dropped right under a note does not snap to it', (await stacks()) === 2);
  await openPalette('Notes');
  const fwdBox = await nodeRect('forward');
  await dragFromPalette('note', fwdBox.left + 4, fwdBox.bottom + 4);
  check('a note dropped right under a block does not snap to it either', (await stacks()) === 3);

  // Run ignores notes.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Notes');
  await dragFromPalette('note', 480, 120);
  await pressRun();
  check('with only a note on the page, Run says there is nothing to run', /Drag some blocks onto the page first/.test(await messageText()), await messageText());
  const noteOnly = await noteRect();
  await chrome.click(noteOnly.left + 30, noteOnly.top + 40);
  await chrome.sleep(150);
  check('and tapping a note edits it rather than running it', (await count('.note-input')) === 1 && !(await chrome.eval(`document.getElementById('run').disabled`)));
  await key('Escape', 'Escape', 27, 0);

  await chrome.goto(BASE + '?demo=square&speed=instant');
  await openPalette('Notes');
  await dragFromPalette('note', 480, 20);
  await pressRun();
  check('a note higher up the page does not stop Run from running the real program', (await redPixels()) > 5000);

  // Copying a note, and keeping it.
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Notes');
  await dragFromPalette('note', 480, 120);
  await writeNote('Starts at the middle.');
  const toCopy = await noteRect();
  await chrome.mouse('mouseMoved', toCopy.left + 30, toCopy.top + 40, { buttons: 0 });
  await chrome.mouse('mousePressed', toCopy.left + 30, toCopy.top + 40);
  await chrome.sleep(750);
  const bubbleButton = await chrome.centerOf('.bubble button');
  await chrome.mouse('mouseReleased', toCopy.left + 30, toCopy.top + 40);
  await chrome.click(bubbleButton.x, bubbleButton.y);
  await chrome.sleep(200);
  const copies = await chrome.eval(`[...document.querySelectorAll('.workspace .node.note')].map((n) => n.textContent.trim())`);
  check('press and hold on a note offers Copy stack, and the copy has the same words', copies.length === 2 && copies.every((t) => t === 'Starts at the middle.'), JSON.stringify(copies));

  await chrome.sleep(700);
  const noteAutosave = JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`));
  check('the words are kept by autosave', noteAutosave.stacks.filter((st) => st.blocks[0].op === 'note' && st.blocks[0].text === 'Starts at the middle.').length === 2);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('and are still on the notes after a refresh', (await chrome.eval(`[...document.querySelectorAll('.workspace .node.note')].map((n) => n.textContent.trim()).join('|')`)) === 'Starts at the middle.|Starts at the middle.');

  const noteFileBefore = savedPngs().length;
  await chrome.eval(`document.getElementById('message').textContent = ''`);
  await clickButton('save');
  let withNotes = null;
  for (let i = 0; i < 40 && !withNotes; i += 1) {
    await chrome.sleep(150);
    for (const f of savedPngs()) {
      const found = readProjectFile(new Uint8Array(readFileSync(join(downloads, f))));
      if (found.ok && found.project.stacks.some((st) => st.blocks[0].text === 'Starts at the middle.')) withNotes = found;
    }
  }
  check('a saved picture carries the words of its notes', withNotes !== null && noteFileBefore >= 1);

  // ---- The write block: words in script, typed on the block ------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Notes');
  await dragFromPalette('write', 480, 140);
  const writeWords = () => chrome.eval(`document.querySelector('.workspace .node.textslot')?.textContent.trim()`);
  const writeBlockText = () => chrome.eval(`document.querySelector('.workspace .stack').textContent.replace(/\\s+/g, '')`);
  check('a write block dragged out shows its words in a box, with the size beside it', (await writeWords()) === 'Hello' && /write/.test(await writeBlockText()) && /size/.test(await writeBlockText()) && /60/.test(await writeBlockText()) && (await count('.workspace .node.textslot:not(.fontslot)')) === 1, await writeBlockText());
  const wordsBox = await plainRect('.workspace .node.textslot');
  check('the words box sits inside the block, after the word write', await chrome.eval(`(() => { const b = document.querySelector('.workspace .stack .node.command').getBoundingClientRect(); const w = document.querySelector('.workspace .node.textslot').getBoundingClientRect(); return w.left > b.left + 30 && w.right < b.right - 10 && w.top >= b.top && w.bottom <= b.bottom; })()`));
  await chrome.click(wordsBox.left + wordsBox.width / 2, wordsBox.top + wordsBox.height / 2);
  await chrome.sleep(150);
  check('tapping the words opens a box over them, with the words selected, and does not run anything',
    (await count('.number-input')) === 1 && (await chrome.eval(`document.activeElement.getAttribute('aria-label')`)) === 'The words to write' && (await redPixels()) === 0);
  await chrome.send('Input.insertText', { text: 'Go Cougars' });
  await chrome.click(850, 640);
  await chrome.sleep(200);
  check('clicking away keeps what was typed, shown in the box', (await count('.number-input')) === 0 && (await writeWords()) === 'Go Cougars', await writeWords());
  await pressRun();
  check('running it writes the words on the paper, in the pen color', (await redPixels()) > 300, `${await redPixels()} red pixels`);
  // Escape cancels, and letters the script has no way to draw are dropped with an explanation.
  const box2 = await plainRect('.workspace .node.textslot');
  await chrome.click(box2.left + box2.width / 2, box2.top + box2.height / 2);
  await chrome.sleep(150);
  await chrome.send('Input.insertText', { text: 'zzz' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);
  check('Escape leaves the words as they were', (await writeWords()) === 'Go Cougars' && (await count('.number-input')) === 0);
  const box3 = await plainRect('.workspace .node.textslot');
  await chrome.click(box3.left + box3.width / 2, box3.top + box3.height / 2);
  await chrome.sleep(150);
  await chrome.send('Input.insertText', { text: 'Caf\u00e9' });
  await chrome.click(850, 640);
  await chrome.sleep(200);
  check('a letter the script cannot draw is left out, and the student is told', (await writeWords()) === 'Caf' && /cannot be written/.test(await chrome.eval(`document.getElementById('message').textContent`)), await writeWords());
  // The words are part of the project: kept by autosave, and brought back after a refresh.
  await chrome.sleep(700);
  const writeSaved = JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`));
  check('the words are kept by autosave, with the size', writeSaved.stacks[0].blocks[0].op === 'write' && writeSaved.stacks[0].blocks[0].text === 'Caf' && writeSaved.stacks[0].blocks[0].args[0] === 60, JSON.stringify(writeSaved.stacks[0].blocks[0]));
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('and are on the block after a refresh', (await writeWords()) === 'Caf');
  // Long words are shortened on the block (the block keeps all of them), and the block grows to fit what it shows.
  await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 300, y: 200, blocks: [{ op: 'write', args: [60], text: 'The quick brown fox jumps over' }] }] });
  check('words too long to show are shortened with dots on the block, which stays inside the window', await chrome.eval(`(() => { const t = document.querySelector('.workspace .node.textslot').textContent.trim(); const r = document.querySelector('.workspace .stack').getBoundingClientRect(); return t.endsWith('...') && r.right < window.innerWidth; })()`));
  check('no label on the write block runs outside it', await chrome.eval(`(() => { const stack = document.querySelector('.workspace .stack').getBoundingClientRect(); return [...document.querySelectorAll('.workspace .stack text')].every((t) => { const r = t.getBoundingClientRect(); return r.left >= stack.left - 1 && r.right <= stack.right + 1; }); })()`));

  // ---- The set font block: a dropdown of fonts, like set color is a setting ------------------------------------------------------------------
  const pressKey = async (key, code, windowsVirtualKeyCode, text) => {
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, ...(text ? { text } : {}) });
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
    await chrome.sleep(150);
  };
  const fontBoxText = () => chrome.eval(`document.querySelector('.workspace .node.fontslot')?.textContent.trim()`);
  const blockWidth = () => chrome.eval(`Math.round([...document.querySelectorAll('.workspace .stack .node.command')].find((n) => /setfont|set font/.test(n.textContent)).getBoundingClientRect().width)`);
  const savedFont = async () => { await chrome.sleep(650); return JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`)).stacks[0].blocks.find((b) => b.op === 'setfont').font; };
  const openFontList = async () => {
    const box = await plainRect('.workspace .node.fontslot');
    await chrome.click(box.left + box.width / 2, box.top + box.height / 2);
    await chrome.sleep(200);
  };
  const fontOptions = () => chrome.eval(`[...document.querySelectorAll('.font-option')].map((o) => o.dataset.font + (o.getAttribute('aria-selected') === 'true' ? '*' : ''))`);
  const writeInk = async () => { await pressRun(); await chrome.sleep(300); return redPixels(); };

  await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'penup' }, { op: 'setxy', args: [-150, -30] }, { op: 'setfont', args: [], font: 'script' }, { op: 'write', args: [90], text: 'Go' }] }] });
  check('a set font block is a dropdown of fonts, showing script until you choose another', (await count('.workspace .node.fontslot')) === 1 && (await fontBoxText()) === 'script'
    && await chrome.eval(`(() => { const f = document.querySelector('.workspace .node.fontslot').getBoundingClientRect(); const b = [...document.querySelectorAll('.workspace .stack .node.command')].find((n) => /set font/.test(n.textContent)).getBoundingClientRect(); return f.left > b.left + 30 && f.right <= b.right && f.top >= b.top && f.bottom <= b.bottom; })()`));
  check('and a small arrow is drawn in it, and the write block beside it has no font box of its own', await chrome.eval(`!!document.querySelector('.workspace .node.fontslot path')`) && (await count('.workspace .node.fontslot')) === 1);
  const widthScript = await blockWidth();
  const inkScript = await writeInk();
  check('with script chosen it writes in script (as it always did)', inkScript > 200, `${inkScript} red pixels`);

  await openFontList();
  check('tapping the font box opens a list of the seven fonts, script ticked, nothing else changed', JSON.stringify(await fontOptions()) === JSON.stringify(['script*', 'fancy', 'sans', 'bold', 'serif', 'blocky', 'pixel']) && (await count('.number-input')) === 0, JSON.stringify(await fontOptions()));
  check('each choice shows a word drawn in that font', await chrome.eval(`[...document.querySelectorAll('.font-option')].every((o) => { const d = o.querySelector('svg path')?.getAttribute('d') ?? ''; return d.startsWith('M') && d.length > 100; }) && new Set([...document.querySelectorAll('.font-option path')].map((p) => p.getAttribute('d'))).size === 7`));
  check('the list sits inside the window', await chrome.eval(`(() => { const r = document.querySelector('.font-menu').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })()`));
  await pressKey('Escape', 'Escape', 27);
  check('Escape closes the list and changes nothing', (await count('.font-menu')) === 0 && (await fontBoxText()) === 'script');
  await openFontList();
  await chrome.click(900, 90);
  await chrome.sleep(150);
  check('clicking anywhere else closes it and changes nothing', (await count('.font-menu')) === 0 && (await fontBoxText()) === 'script');
  await openFontList();
  await chrome.click((await chrome.centerOf('.font-option[data-font="script"]')).x, (await chrome.centerOf('.font-option[data-font="script"]')).y);
  await chrome.sleep(150);
  check('choosing the font it already has closes the list and is not an edit', (await count('.font-menu')) === 0 && (await fontBoxText()) === 'script' && (await chrome.eval(`document.getElementById('undo').disabled`)) === true);

  await openFontList();
  const bold = await chrome.centerOf('.font-option[data-font="bold"]');
  await chrome.click(bold.x, bold.y);
  await chrome.sleep(250);
  check('choosing bold closes the list and puts bold in the box', (await count('.font-menu')) === 0 && (await fontBoxText()) === 'bold', await fontBoxText());
  check('the block stays the same width whichever font it shows', (await blockWidth()) === widthScript, `${widthScript} then ${await blockWidth()}`);
  const inkBold = await writeInk();
  check('running it now writes in the new font (a different amount of ink than script did)', inkBold > 200 && Math.abs(inkBold - inkScript) > 100, `script ${inkScript}, bold ${inkBold}`);
  check('the choice is kept by autosave', (await savedFont()) === 'bold');
  await chrome.eval(`document.getElementById('undo').click()`);
  await chrome.sleep(200);
  check('Undo goes back to script, and the saved block says script', (await fontBoxText()) === 'script' && (await savedFont()) === 'script');
  await openFontList();
  const serif = await chrome.centerOf('.font-option[data-font="serif"]');
  await chrome.click(serif.x, serif.y);
  await chrome.sleep(250);
  check('serif can be chosen too, and is kept', (await fontBoxText()) === 'serif' && (await savedFont()) === 'serif');
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  check('and is still chosen after a refresh', (await fontBoxText()) === 'serif');
  await openFontList();
  const toScript = await chrome.centerOf('.font-option[data-font="script"]');
  await chrome.click(toScript.x, toScript.y);
  await chrome.sleep(250);
  check('choosing script again works, and a set font block keeps it (it is what sets the font back)', (await fontBoxText()) === 'script' && (await savedFont()) === 'script');

  // The keyboard: open the list, arrow to a choice, and press Enter.
  await openFontList();
  check('the list opens with the current font focused, so the keyboard can start from it', await chrome.eval(`document.activeElement?.dataset?.font`) === 'script');
  await pressKey('ArrowDown', 'ArrowDown', 40);
  await pressKey('ArrowDown', 'ArrowDown', 40);
  await pressKey('Enter', 'Enter', 13, '\r');
  check('arrow keys and Enter choose a font (script, down, down is sans)', (await fontBoxText()) === 'sans' && (await count('.font-menu')) === 0, await fontBoxText());
  await openFontList();
  await pressKey('ArrowUp', 'ArrowUp', 38);
  await pressKey('ArrowUp', 'ArrowUp', 38);
  await pressKey('ArrowUp', 'ArrowUp', 38);
  check('and the arrow keys wrap round from the top to the end of the list (sans, up, up, up is pixel, the last)', await chrome.eval(`document.activeElement?.dataset?.font`) === 'pixel');
  await pressKey('Escape', 'Escape', 27);

  // The Python box leaves the font as a note.
  await chrome.eval(`document.getElementById('python-toggle').click()`);
  await chrome.sleep(200);
  check('the Python box names the font in its note for a set font block', /set font sans/.test(await chrome.eval(`document.getElementById('python-box').textContent`)), (await chrome.eval(`document.getElementById('python-box').textContent`)).slice(0, 120));
  await chrome.eval(`document.getElementById('python-toggle').click()`);


  // ---- set curve, and the words following the turtle ---------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Notes');
  check('the Notes palette lists the sticky note, write, set font and set curve, in that order', JSON.stringify(await chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op)`)) === JSON.stringify(['note', 'write', 'setfont', 'setcurve']));
  await dragFromPalette('setcurve', 480, 140);
  check('a set curve block comes out with 120 in its number box, like set pen size comes out with 5', /setcurve|set curve/.test(await chrome.eval(`document.querySelector('.workspace .stack').textContent`)) && /120/.test(await chrome.eval(`document.querySelector('.workspace .stack').textContent`)));
  const redBox = () => chrome.eval(`(() => { const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let i = 0; i < d.length; i += 4) { if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 0) { const p = i / 4; const x = p % c.width; const y = Math.floor(p / c.width); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { w: x1 - x0, h: y1 - y0 }; })()`);
  const writeWith = async (...before) => {
    await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'penup' }, { op: 'setxy', args: [0, 150] }, ...before, { op: 'write', args: [60], text: 'HELLO' }] }] });
    await pressRun();
    await chrome.sleep(400);
    return redBox();
  };
  const straight = await writeWith();
  const arched = await writeWith({ op: 'setcurve', args: [120] });
  const bowled = await writeWith({ op: 'setcurve', args: [-120] });
  const turned = await writeWith({ op: 'setheading', args: [90] });
  check('write goes straight along the page by default (wider than it is tall)', straight.w > straight.h * 2, JSON.stringify(straight));
  check('set curve 120 bends the words either way: an arch and a bowl are both taller than straight words, and they are different (the bowl\'s letters stand inward, so it is the smaller)', arched.h > straight.h + 25 && bowled.h > straight.h + 25 && bowled.w < arched.w && bowled.h < arched.h, `straight ${JSON.stringify(straight)}, arch ${JSON.stringify(arched)}, bowl ${JSON.stringify(bowled)}`);
  check('turning the turtle turns the words: facing right they run down the page (taller than wide)', turned.h > turned.w * 2, JSON.stringify(turned));
  // ---- Writing takes the time the speed says: a letter at a time ----------------------------------------------
  const cougars = { app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'write', args: [60], text: 'Cougars' }] }] };
  const runAt = async (speed) => {
    await chrome.goto(BASE + 'about.html');
    await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(cougars))})`);
    await chrome.goto(BASE + `?speed=${speed}`, { keepStorage: true });
    await chrome.sleep(400);
    const button = await chrome.centerOf('#run');
    const started = Date.now();
    await chrome.click(button.x, button.y);
    return started;
  };
  await runAt('instant');
  await chrome.sleep(500);
  const inkAtOnce = await redPixels();
  check('at instant speed the whole word is on the paper at once', inkAtOnce > 300, `${inkAtOnce} red pixels`);
  const slowStart = await runAt('slow');
  // While it writes, watch the turtle: where its picture is and how it is turned, every 130 ms.
  const spriteNow = () => chrome.eval(`(() => { const r = document.querySelector('.turtle-sprite').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, turn: (document.querySelector('.turtle-sprite').style.transform.match(/rotate\\((-?[\\d.]+)deg\\)/) ?? [])[1] }; })()`);
  const paperCenter = await chrome.centerOf('.paper-box');
  const spots = [];
  let inkEarly = 0;
  while (Date.now() - slowStart < 2400) {
    spots.push(await spriteNow());
    if (Date.now() - slowStart >= 1250 && inkEarly === 0) inkEarly = await redPixels();
    await chrome.sleep(130);
  }
  const wandered = Math.max(...spots.map((p) => Math.hypot(p.x - paperCenter.x, p.y - paperCenter.y)));
  check('at slow speed the turtle is seen travelling along the letters, away from where it started', wandered > 60, `${Math.round(wandered)} px from the middle of the paper`);
  check('and it moves smoothly along, not a letter at a time: its place changes in most of the looks', new Set(spots.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`)).size >= spots.length * 0.6, `${new Set(spots.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`)).size} different places in ${spots.length} looks`);
  check('and it turns to face the way it is drawing', new Set(spots.map((p) => Math.round(Number(p.turn)))).size >= 4, [...new Set(spots.map((p) => Math.round(Number(p.turn))))].join(', '));
  await chrome.sleep(Math.max(0, 4300 - (Date.now() - slowStart)));
  const inkLate = await redPixels();
  check('at slow speed the word is only partly written a little way in (a letter every half second)', inkEarly > 20 && inkEarly < inkAtOnce * 0.8, `${inkEarly} of ${inkAtOnce} red pixels at 1.25 s`);
  check('and finishes as the very same picture the instant run made', Math.abs(inkLate - inkAtOnce) <= 2, `${inkLate} against ${inkAtOnce} red pixels at 4.3 s`);
  const home = await spriteNow();
  check('when the word is finished the turtle is back where it started (writing never moves it)', Math.hypot(home.x - paperCenter.x, home.y - paperCenter.y) < 3 && Number(home.turn) % 360 === 0, `${Math.round(home.x - paperCenter.x)}, ${Math.round(home.y - paperCenter.y)} from the middle, turned ${home.turn}`);
  // Stop in the middle of a word: the turtle goes home, and the part written stays.
  const stopStart = await runAt('slow');
  await chrome.sleep(Math.max(0, 1300 - (Date.now() - stopStart)));
  const midway = await spriteNow();
  const stopAt = await chrome.centerOf('#stop');
  await chrome.click(stopAt.x, stopAt.y);
  await chrome.sleep(250);
  const afterStop = await spriteNow();
  const inkStopped = await redPixels();
  check('Stop part way through a word puts the turtle back where it really is, and leaves what was written', Math.hypot(midway.x - paperCenter.x, midway.y - paperCenter.y) > 40 && Math.hypot(afterStop.x - paperCenter.x, afterStop.y - paperCenter.y) < 3 && inkStopped > 20 && inkStopped < inkAtOnce, `${Math.round(Math.hypot(midway.x - paperCenter.x, midway.y - paperCenter.y))} px away, then ${Math.round(Math.hypot(afterStop.x - paperCenter.x, afterStop.y - paperCenter.y))} px; ${inkStopped} of ${inkAtOnce} red pixels`);
  const midStart = await runAt('medium');
  await chrome.sleep(Math.max(0, 200 - (Date.now() - midStart)));
  const inkMedium = await redPixels();
  check('medium speed is gradual too, just quicker: partly written at a fifth of a second', inkMedium > 20 && inkMedium < inkAtOnce, `${inkMedium} of ${inkAtOnce} red pixels`);
  await chrome.sleep(900);

  // ---- The turtle's look: shell color, a hover with the pen up, a squirm when held; and the occasional fish ----------
  const look = () => chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite'); const shell = getComputedStyle(s.querySelector('.shell')); const svg = getComputedStyle(s.querySelector('svg')); return { shellVar: s.style.getPropertyValue('--shell'), fill: shell.fill, penUp: s.classList.contains('pen-up'), scale: svg.scale, animation: svg.animationName, rotate: svg.rotate }; })()`);
  await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'setcolor', args: [20, 70, 170] }, { op: 'forward', args: [60] }, { op: 'penup' }, { op: 'forward', args: [40] }] }] });
  const startLook = await look();
  check('before anything runs the shell is the pen\'s starting color, red, and the turtle sits on the paper', startLook.shellVar === '#ff0000' && startLook.fill === 'rgb(255, 0, 0)' && !startLook.penUp && startLook.scale === 'none', JSON.stringify(startLook));
  await pressRun();
  await chrome.sleep(300);
  const penUp = await look();
  check('after set color the shell is that color', penUp.shellVar === '#1446aa' && penUp.fill === 'rgb(20, 70, 170)', JSON.stringify(penUp));
  check('with the pen up the turtle hovers (bigger, a shadow) and the shell is paler', penUp.penUp && penUp.scale === '1.14' && (await chrome.eval(`getComputedStyle(document.querySelector('.turtle-sprite .shell')).fillOpacity`)) === '0.4' && /drop-shadow/.test(await chrome.eval(`getComputedStyle(document.querySelector('.turtle-sprite svg')).filter`)));
  await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'forward', args: [30] }] }] });
  await pressRun();
  await chrome.sleep(300);
  const landed = await look();
  check('with the pen down it lies flat on the paper in the pen color', !landed.penUp && landed.scale === 'none' && landed.shellVar === '#ff0000', JSON.stringify(landed));
  const turtleAt = await chrome.centerOf('.turtle-sprite');
  await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: turtleAt.x, y: turtleAt.y + 6, button: 'left', clickCount: 1 });
  await chrome.sleep(110);
  const held1 = await look();
  await chrome.sleep(100);
  const held2 = await look();
  check('picked up, the turtle squirms: it wriggles from side to side while it is held', held1.animation === 'turtle-squirm' && held1.rotate !== 'none' && held1.rotate !== held2.rotate, `${held1.rotate} then ${held2.rotate}`);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: turtleAt.x, y: turtleAt.y + 6, button: 'left', clickCount: 1 });
  await chrome.sleep(120);
  check('and stops squirming when it is let go', (await look()).animation === 'none');

  // The fish: ?fish=now sends one a moment after the page opens. It crosses the WHOLE window, and clicking it feeds it to the shark.
  await chrome.goto(BASE + '?fish=now');
  await chrome.sleep(900);
  const fishNow = () => chrome.eval(`(() => { const f = document.querySelector('.fish'); const can = document.querySelector('.trash-can'); if (!f) return null; const r = f.getBoundingClientRect(); const c = can.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, away: Math.abs(r.x + r.width / 2 - (c.left + c.width / 2)), peek: can.classList.contains('peek'), lookX: can.style.getPropertyValue('--look-x'), events: getComputedStyle(f).pointerEvents, hit: !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.fish'), inLayer: f.parentElement.classList.contains('sky'), layerEvents: getComputedStyle(f.parentElement).pointerEvents, hidden: f.getAttribute('aria-hidden') }; })()`);
  const fishWindow = await chrome.eval('window.innerWidth');
  const fish1 = await fishNow();
  check('?fish=now sends a fish swimming along above the trash can, in the layer above everything, and the fish itself can be clicked', fish1 !== null && fish1.events === 'auto' && fish1.hit && fish1.inLayer && fish1.layerEvents === 'none' && fish1.hidden === 'true' && fish1.y > 380, JSON.stringify(fish1));
  await chrome.sleep(1200);
  const fish2 = await fishNow();
  // The shark only peeks while the fish is near the can (within 190 px), and the fish comes in from either side by chance, so wait for it to get there
  // (it crosses the whole window) rather than looking at one moment that is right for one direction and wrong for the other.
  let fishLow = Math.min(fish1.x, fish2.x);
  let fishHigh = Math.max(fish1.x, fish2.x);
  let nearFish = fish2;
  for (let i = 0; i < 200 && nearFish !== null && nearFish.away >= 150; i += 1) {
    await chrome.sleep(100);
    nearFish = await fishNow();
    if (nearFish !== null) {
      fishLow = Math.min(fishLow, nearFish.x);
      fishHigh = Math.max(fishHigh, nearFish.x);
    }
  }
  check('it moves along, and the shark peeks over the rim and looks toward it when the fish comes near', fish2 !== null && Math.abs(fish2.x - fish1.x) > 20 && nearFish !== null && nearFish.away < 150 && nearFish.peek && nearFish.lookX !== '', `${Math.round(fish1.x)} then ${Math.round(fish2.x)}, near: ${JSON.stringify(nearFish && { away: Math.round(nearFish.away), peek: nearFish.peek, look: nearFish.lookX })}`);
  // Watch it go the whole way across the window (about 14 seconds at 110 pixels a second).
  for (let i = 0; i < 90; i += 1) {
    const f = await fishNow();
    if (f === null) break;
    fishLow = Math.min(fishLow, f.x);
    fishHigh = Math.max(fishHigh, f.x);
    await chrome.sleep(250);
  }
  check('the fish crosses the whole window, not just the part by the can', fishHigh - fishLow > fishWindow * 0.85, `from ${Math.round(fishLow)} to ${Math.round(fishHigh)} in a window ${fishWindow} wide`);
  check('and when it has crossed it is gone, the shark goes back down and looks straight ahead', (await fishNow()) === null && (await chrome.eval(`(() => { const c = document.querySelector('.trash-can'); return !c.classList.contains('peek') && c.style.getPropertyValue('--look-x') === ''; })()`)));
  check('the fish never changes the project or stores anything', (await chrome.eval(`Object.keys(localStorage).filter((k) => k !== 'turtlelab-project').length`)) === 0 && (await chrome.eval(`sessionStorage.length`)) === 0);
  // Click a fish: it stops where it is, and the shark swims out of the can to it, chomps, and swims home.
  await chrome.goto(BASE + '?fish=now');
  await chrome.sleep(900);
  const fishClickAt = await fishNow();
  const clickedAt = { x: fishClickAt.x + fishClickAt.w / 2, y: fishClickAt.y + 10 };
  await chrome.click(clickedAt.x, clickedAt.y);
  const eatenSeen = { eaten: false, hunting: false, swimmerInLayer: false, reachedFish: false, burp: false, stoodStill: true };
  let fishSpot = null;
  for (let i = 0; i < 36; i += 1) {
    const e = await chrome.eval(`(() => { const f = document.querySelector('.fish'); const sw = document.querySelector('.shark-swimmer'); const can = document.querySelector('.trash-can'); const r = f ? f.getBoundingClientRect() : null; const w = sw ? sw.getBoundingClientRect() : null; return { eaten: f ? f.classList.contains('eaten') : false, hunting: can.classList.contains('hunting'), swimmer: !!sw, inLayer: sw ? sw.parentElement.classList.contains('sky') : false, sx: w ? w.x + w.width / 2 : null, sy: w ? w.y + w.height * 0.32 : null, burp: !!document.querySelector('.burp'), fx: r ? r.x + r.width / 2 : null, fy: r ? r.y + r.height / 2 : null }; })()`);
    if (e.eaten) eatenSeen.eaten = true;
    if (e.hunting) eatenSeen.hunting = true;
    if (e.swimmer && e.inLayer) eatenSeen.swimmerInLayer = true;
    if (e.burp) eatenSeen.burp = true;
    if (e.fx !== null) {
      fishSpot ??= { x: e.fx, y: e.fy };
      if (Math.hypot(e.fx - fishSpot.x, e.fy - fishSpot.y) > 4) eatenSeen.stoodStill = false;
      if (e.sx !== null && Math.hypot(e.sx - e.fx, e.sy - e.fy) < 90) eatenSeen.reachedFish = true;
    }
    await chrome.sleep(125);
  }
  check('click the fish: it stops where it was, and the shark comes up and swims out to it in a copy of its head in the layer above everything', eatenSeen.hunting && eatenSeen.swimmerInLayer && eatenSeen.stoodStill && eatenSeen.reachedFish, JSON.stringify({ eatenSeen, fishSpot }));
  check('the fish goes under the shark\'s jaws, and the shark burps when it is home', eatenSeen.eaten && eatenSeen.burp, JSON.stringify(eatenSeen));
  check('and then the fish and the swimming shark are gone, the shark is back to resting, and no second fish swims right away', await chrome.eval(`!document.querySelector('.fish') && !document.querySelector('.shark-swimmer') && document.querySelector('.trash-can').className === 'trash-can'`));
  // Asked for calm, there is no fish at all.
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?fish=now');
  await chrome.sleep(1200);
  check('when the computer asks for reduced motion there is no fish, not even when asked for', (await fishNow()) === null);
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  // Busy shark: a fish does not interrupt the shark eating.
  await chrome.goto(BASE + '?speed=instant');

  // ---- The turtle yawns on a long wait and waves when it is done; the shark burps after a meal and spits a stack back on Undo ----
  const mood = () => chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite'); const z = document.querySelector('.turtle-zzz'); return { yawning: s.classList.contains('yawning'), waving: s.classList.contains('waving'), zzz: !z.hidden && getComputedStyle(z).display !== 'none' }; })()`);
  const clickRun = async () => { const at = await chrome.centerOf('#run'); await chrome.click(at.x, at.y); };
  const waits = (tenths) => ({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'forward', args: [30] }, { op: 'wait', args: [tenths] }, { op: 'forward', args: [30] }] }] });
  await seedProject(waits(12));
  await clickRun();
  await chrome.sleep(500);
  const yawn = await mood();
  check('during a long wait (over a second) the turtle yawns, with a Zzz floating up', yawn.yawning && yawn.zzz && !yawn.waving, JSON.stringify(yawn));
  await chrome.sleep(1100);
  const done = await mood();
  check('when the wait is over the yawn stops, and when the program has finished the turtle waves', !done.yawning && !done.zzz && done.waving, JSON.stringify(done));
  await chrome.sleep(1500);
  check('and the wave only lasts a moment', !(await mood()).waving);
  await seedProject(waits(4));
  await clickRun();
  await chrome.sleep(150);
  check('a short wait (under a second) is only a pause: no yawn', !(await mood()).yawning);
  await seedProject(waits(60));
  await clickRun();
  await chrome.sleep(500);
  check('a long wait yawns, and pressing Stop ends the yawn, with no wave (it did not finish)', (await mood()).yawning);
  const stopButtonAt = await chrome.centerOf('#stop');
  await chrome.click(stopButtonAt.x, stopButtonAt.y);
  await chrome.sleep(200);
  const stopped = await mood();
  check('stopped: no yawn, no Zzz, and no wave', !stopped.yawning && !stopped.zzz && !stopped.waving, JSON.stringify(stopped));

  // The shark: eat a stack (it may burp), then Undo brings the stack back by spitting it out.
  const meal = { app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }] }, { x: 120, y: 300, blocks: [{ op: 'penup', args: [] }, { op: 'pendown', args: [] }] }] };
  const seedMeal = async (query) => {
    await chrome.goto(BASE + 'about.html');
    await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(meal))})`);
    await chrome.goto(BASE + query, { keepStorage: true });
    await chrome.sleep(500);
  };
  const feedShark = async () => {
    const from = await chrome.eval(`(() => { const r = document.querySelectorAll('.workspace .stack')[1].querySelector('.node').getBoundingClientRect(); return { x: r.x + 14, y: r.y + r.height / 2 }; })()`);
    await chrome.drag(from, { x: 40, y: 540 });
  };
  const sharkNow = () => chrome.eval(`(() => ({ stacks: document.querySelectorAll('.workspace .stack').length, ghosts: document.querySelectorAll('.workspace .ghost').length, hidden: [...document.querySelectorAll('.workspace .stack')].filter((s) => s.style.opacity === '0').length, shark: document.querySelector('.trash-can').className, burp: !!document.querySelector('.burp') }))()`);
  await seedMeal('?speed=instant&burp=always');
  await feedShark();
  await chrome.sleep(1050);
  const afterMeal = await sharkNow();
  check('the shark eats the stack and, with burps turned all the way up, a burp bubble comes out of it', afterMeal.stacks === 1 && afterMeal.burp, JSON.stringify(afterMeal));
  check('the burp floats away, and the shark is back down', await (async () => { await chrome.sleep(2300); const s = await sharkNow(); return !s.burp && s.shark === 'trash-can'; })());
  const undoAt = await chrome.centerOf('#undo');
  await chrome.click(undoAt.x, undoAt.y);
  await chrome.sleep(230);
  const spitting = await sharkNow();
  check('Undo brings the eaten stack back by spitting it out: the shark comes up, a copy flies out, and the real stack waits unseen', spitting.shark.includes('spitting') && spitting.ghosts === 1 && spitting.hidden === 1 && spitting.stacks === 2, JSON.stringify(spitting));
  await chrome.sleep(900);
  const landed2 = await sharkNow();
  check('then it lands: the stack is on the page, no copy is left, and the shark goes back down', landed2.stacks === 2 && landed2.ghosts === 0 && landed2.hidden === 0 && landed2.shark === 'trash-can', JSON.stringify(landed2));
  const redoAt = await chrome.centerOf('#redo');
  await chrome.click(redoAt.x, redoAt.y);
  await chrome.sleep(120);
  const redone = await sharkNow();
  check('Redo takes the stack away again at once, with no shark show', redone.stacks === 1 && redone.ghosts === 0, JSON.stringify(redone));
  // An Undo of something that is not a deleted stack (moving a stack) has no spit.
  await seedMeal('?speed=instant');
  const mover = await chrome.eval(`(() => { const r = document.querySelectorAll('.workspace .stack')[0].querySelector('.node').getBoundingClientRect(); return { x: r.x + 14, y: r.y + r.height / 2 }; })()`);
  await chrome.drag(mover, { x: mover.x + 120, y: mover.y + 60 });
  await chrome.sleep(200);
  await chrome.click(undoAt.x, undoAt.y);
  await chrome.sleep(200);
  const afterMove = await sharkNow();
  check('undoing a move is not a stack coming back: no copy flies, the shark stays down', afterMove.ghosts === 0 && afterMove.shark === 'trash-can' && afterMove.stacks === 2, JSON.stringify(afterMove));
  // Asked for calm: no burp, no flying copy.
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await seedMeal('?speed=instant&burp=always');
  await feedShark();
  await chrome.sleep(1050);
  const calmMeal = await sharkNow();
  await chrome.click(undoAt.x, undoAt.y);
  await chrome.sleep(230);
  const calmUndo = await sharkNow();
  check('with reduced motion there is no burp and no flying copy: the stack just comes back', !calmMeal.burp && calmUndo.ghosts === 0 && calmUndo.hidden === 0 && calmUndo.stacks === 2, JSON.stringify([calmMeal, calmUndo]));
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.goto(BASE + '?speed=instant');

  // ---- When nobody is around: the turtle dances, scratches, yawns, blows bubbles (or worse), and the shark dreams ----------
  const antic = () => chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite'); const can = document.querySelector('.trash-can'); return { pose: [...s.classList].filter((c) => c.startsWith('pose-') || c === 'yawning').join(' '), bubbles: !document.querySelector('.turtle-bubbles').hidden, poop: !!document.querySelector('.turtle-poop'), dreaming: can.classList.contains('dreaming') && !!document.querySelector('.dream') }; })()`);
  const nothing = (a) => a.pose === '' && !a.bubbles && !a.poop && !a.dreaming;
  const wanted = { dance: (a) => a.pose === 'pose-dance', scratch: (a) => a.pose === 'pose-scratch', yawn: (a) => a.pose === 'yawning', breathe: (a) => a.bubbles, poop: (a) => a.poop, dream: (a) => a.dreaming };
  for (const [name, isPlaying] of Object.entries(wanted)) {
    await chrome.goto(BASE + `?antic=${name}&speed=instant`);
    await chrome.sleep(1200);
    const playing = await antic();
    check(`?antic=${name} makes it happen (and nothing else does)`, isPlaying(playing) && Object.entries(wanted).filter(([other]) => other !== name).every(([, f]) => !f(playing)), JSON.stringify(playing));
  }
  await chrome.goto(BASE + '?antic=scratch&speed=instant');
  await chrome.sleep(1100);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 300 });
  await chrome.sleep(80);
  check('any movement of the mouse stops it at once', nothing(await antic()));
  await chrome.goto(BASE + '?antic=dance&speed=instant');
  await chrome.sleep(1100);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 300 });
  await chrome.sleep(300);
  check('but dancing is a treat for working, not something for when nobody is there, so moving the mouse does not stop it', (await antic()).pose === 'pose-dance');
  await chrome.goto(BASE + '?antic=dream&speed=instant');
  await chrome.sleep(1200);
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16 });
  await chrome.sleep(80);
  check('and so does any key, and the shark wakes up with its bubble gone', nothing(await antic()));
  // The bubbles and the Zzz float all the way off the top of the window, and the poop falls all the way off the bottom.
  const reach = async (selector, ms) => {
    let minTop = Infinity; let maxBottom = -Infinity; const started = Date.now();
    while (Date.now() - started < ms) {
      const boxes = await chrome.eval(`[...document.querySelectorAll(${JSON.stringify(selector)})].map((e) => { const b = e.getBoundingClientRect(); return b.width > 0 ? [b.top, b.bottom] : null; }).filter(Boolean)`);
      for (const [top, bottom] of boxes) { minTop = Math.min(minTop, top); maxBottom = Math.max(maxBottom, bottom); }
      await chrome.sleep(100);
    }
    return { minTop, maxBottom };
  };
  await chrome.goto(BASE + '?antic=breathe&speed=instant');
  await chrome.sleep(400);
  const bubbleReach = await reach('.turtle-bubbles span', 9500);
  check('the bubbles float all the way up and off the top of the window', bubbleReach.minTop < -5, JSON.stringify(bubbleReach));
  check('(and they are in the layer above everything, so nothing clips them on the way)', await chrome.eval(`document.querySelector('.turtle-bubbles').parentElement.classList.contains('sky') && getComputedStyle(document.querySelector('.sky')).pointerEvents === 'none'`));
  await chrome.goto(BASE + '?antic=yawn&speed=instant');
  await chrome.sleep(400);
  const zReach = await reach('.turtle-zzz span', 9500);
  check('the Zzz of a yawn float off the top of the window too', zReach.minTop < -5, JSON.stringify(zReach));
  await chrome.goto(BASE + '?antic=dream&speed=instant');
  await chrome.sleep(700);
  check('the shark dreams of turtle soup, and says so in the bubble', (await chrome.eval(`document.querySelector('.dream text')?.textContent`)) === 'turtle soup' && (await chrome.eval(`!!document.querySelector('.dream svg .shell, .dream svg path')`)));
  const sharkZ = await reach('.sky .turtle-zzz span', 11000);
  check('and the shark\'s z\'s float off the top of the window as well', sharkZ.minTop < -5, JSON.stringify(sharkZ));
  await chrome.goto(BASE + '?antic=poop&poop=two&speed=instant');
  await chrome.sleep(450);
  let lowest = -Infinity; let distinct = 0; let firstAt = null; let bottomAt = null; const poopStart = Date.now();
  const windowHeight = await chrome.eval('window.innerHeight');
  while (Date.now() - poopStart < 7500) {
    const info = await chrome.eval(`(() => { let fresh = 0; const bottoms = []; for (const e of document.querySelectorAll('.turtle-poop')) { if (!e.dataset.seen) { e.dataset.seen = '1'; fresh += 1; } bottoms.push(e.querySelector('svg').getBoundingClientRect().bottom); } return { fresh, bottoms }; })()`);
    distinct += info.fresh;
    if (distinct > 0 && firstAt === null) firstAt = Date.now();
    for (const bottom of info.bottoms) {
      lowest = Math.max(lowest, bottom);
      if (bottom > windowHeight && bottomAt === null) bottomAt = Date.now();
    }
    await chrome.sleep(60);
  }
  check('the poop falls all the way off the bottom of the window', lowest > windowHeight, `${Math.round(lowest)} in a window ${windowHeight} tall`);
  check('and with ?poop=two there are two of them, one after the other', distinct === 2, `${distinct}`);
  check('it falls slowly enough to watch: a couple of seconds from the turtle to the bottom, not a blink', bottomAt !== null && firstAt !== null && bottomAt - firstAt >= 1700, `${bottomAt - firstAt} ms`);
  // With ?idle=3 the pauses between antics shrink too, so there is more than one in a short while.
  await chrome.goto(BASE + '?idle=3&speed=instant');
  let started = 0; let wasQuiet = true; const idleStart = Date.now();
  while (Date.now() - idleStart < 22000) {
    const quiet = nothing(await antic());
    if (!quiet && wasQuiet) started += 1;
    wasQuiet = quiet;
    await chrome.sleep(200);
  }
  check('?idle=3 shortens the pauses between antics too: more than one happens in 22 seconds', started >= 2, `${started} antics started`);
  // The fishing boat: sails in, the shark peeks, the harpoon clangs on the can, the shark snaps, the boat leaves.
  // Whether the boat starts off the right edge is seen by a recorder in the page that looks on every animation frame: polling from here every
  // 120 ms or so missed the moment now and then when the machine was busy (it is a race, not a fault of the boat).
  const recorder = await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { window.__boatOffscreen = false; const look = () => { const b = document.querySelector('.boat'); if (b && b.getBoundingClientRect().left >= window.innerWidth - 5) window.__boatOffscreen = true; requestAnimationFrame(look); }; requestAnimationFrame(look); })();` });
  await chrome.goto(BASE + '?boat=now&speed=instant');
  const sawBoat = { fromOffscreen: false, peek: false, clang: false, word: false, snap: false, spearAtCan: false, spearShown: false, throughBoat: null, inLayer: false, leftAgain: false };
  const boatStart = Date.now();
  const windowWidth = await chrome.eval('window.innerWidth');
  while (Date.now() - boatStart < 15500) {
    const b = await chrome.eval(`(() => {
      const boat = document.querySelector('.boat'); const can = document.querySelector('.trash-can'); const spear = document.querySelector('.boat-lines .spear');
      const c = can.getBoundingClientRect();
      const r = boat ? boat.getBoundingClientRect() : null;
      let spearHit = false;
      if (spear && spear.getAttribute('visibility') === 'visible') { const m = spear.getBoundingClientRect(); spearHit = m.left < c.right + 30 && m.right > c.left - 30 && m.top < c.bottom && m.bottom > c.top; }
      return { boat: !!boat, left: r ? r.left : null, right: r ? r.right : null, inLayer: boat ? boat.parentElement.classList.contains('sky') : false, events: boat ? getComputedStyle(boat).pointerEvents : null,
        peek: can.classList.contains('peek'), clang: can.classList.contains('clang'), word: !!document.querySelector('.clang-word'), snap: can.classList.contains('eating') && can.classList.contains('chomp'),
        spearShown: !!spear && spear.getAttribute('visibility') === 'visible', spearHit };
    })()`);
    if (b.boat && b.left >= windowWidth - 5) sawBoat.fromOffscreen = true;
    if (b.boat && b.left > windowWidth - 1 && sawBoat.snap) sawBoat.leftAgain = true;
    if (b.boat && b.inLayer && b.events === 'auto') sawBoat.inLayer = true;
    for (const key of ['peek', 'clang', 'word', 'snap', 'spearShown']) if (b[key]) sawBoat[key] = true;
    if (b.spearHit) sawBoat.spearAtCan = true;
    if (b.boat && b.right > windowWidth) sawBoat.leftAgain = sawBoat.leftAgain || sawBoat.snap;
    await chrome.sleep(120);
  }
  sawBoat.fromOffscreen = sawBoat.fromOffscreen || (await chrome.eval('window.__boatOffscreen === true'));
  await chrome.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: recorder.identifier });
  check('a boat sails in from off the right edge of the window, in the layer above everything, and the boat itself can be clicked', sawBoat.fromOffscreen && sawBoat.inLayer, JSON.stringify(sawBoat));
  check('the shark peeks up as it comes near, and the harpoon flies out and lands on the can', sawBoat.peek && sawBoat.spearShown && sawBoat.spearAtCan, JSON.stringify(sawBoat));
  check('the can rings with a "clang!" where it was hit', sawBoat.clang && sawBoat.word, JSON.stringify(sawBoat));
  check('then the shark pops up and snaps, and the boat sails off the way it came', sawBoat.snap && sawBoat.leftAgain, JSON.stringify(sawBoat));
  check('when the visit is over the boat, its harpoon and the clang are gone, and the shark is back to resting', await chrome.eval(`!document.querySelector('.boat') && !document.querySelector('.boat-lines') && !document.querySelector('.clang-word') && document.querySelector('.trash-can').className === 'trash-can'`));
  check('the boat never touches the project or stores anything', (await chrome.eval(`Object.keys(localStorage).filter((k) => k !== 'turtlelab-project').length`)) === 0);
  // Click the boat: it stops where it is, its harpoon goes, and the shark swims out of the can to it, chomps, and swims home.
  await chrome.goto(BASE + '?boat=now&speed=instant');
  let boatClick = null;
  for (let i = 0; i < 80 && !boatClick; i += 1) {
    await chrome.sleep(100);
    boatClick = await chrome.eval(`(() => { const b = document.querySelector('.boat'); if (!b) return null; const r = b.getBoundingClientRect(); if (r.right > window.innerWidth - 20 || r.left < 0) return null; return { x: r.x + r.width / 2, y: r.y + r.height * 0.45 }; })()`);
  }
  check('a boat sails into view to be clicked', boatClick !== null);
  const boatHit = await chrome.eval(`!!document.elementFromPoint(${boatClick.x}, ${boatClick.y})?.closest('.boat')`);
  check('the boat takes the click (nothing else in the layer does, not its harpoon and rope)', boatHit && (await chrome.eval(`getComputedStyle(document.querySelector('.boat-lines')).pointerEvents === 'none'`)));
  await chrome.click(boatClick.x, boatClick.y);
  const boatEaten = { eaten: false, linesGone: false, hunting: false, swimmerInLayer: false, reachedBoat: false, burp: false, stoodStill: true };
  let boatSpot = null;
  for (let i = 0; i < 40; i += 1) {
    const e = await chrome.eval(`(() => { const b = document.querySelector('.boat'); const sw = document.querySelector('.shark-swimmer'); const can = document.querySelector('.trash-can'); const r = b ? b.getBoundingClientRect() : null; const w = sw ? sw.getBoundingClientRect() : null; return { eaten: b ? b.classList.contains('eaten') : false, lines: !!document.querySelector('.boat-lines'), hunting: can.classList.contains('hunting'), swimmer: !!sw, inLayer: sw ? sw.parentElement.classList.contains('sky') : false, sx: w ? w.x + w.width / 2 : null, sy: w ? w.y + w.height * 0.32 : null, burp: !!document.querySelector('.burp'), bx: r ? r.x + r.width / 2 : null, by: r ? r.y + r.height / 2 : null }; })()`);
    if (e.eaten) { boatEaten.eaten = true; if (!e.lines) boatEaten.linesGone = true; }
    if (e.hunting) boatEaten.hunting = true;
    if (e.swimmer && e.inLayer) boatEaten.swimmerInLayer = true;
    if (e.burp) boatEaten.burp = true;
    if (e.bx !== null && !e.eaten) {
      boatSpot ??= { x: e.bx, y: e.by };
      if (Math.hypot(e.bx - boatSpot.x, e.by - boatSpot.y) > 4) boatEaten.stoodStill = false;
    }
    if (e.bx !== null && e.sx !== null && Math.hypot(e.sx - e.bx, e.sy - e.by) < 110) boatEaten.reachedBoat = true;
    await chrome.sleep(125);
  }
  check('click the boat: it stops where it was, and the shark comes up and swims out to it in a copy of its head in the layer above everything', boatEaten.hunting && boatEaten.swimmerInLayer && boatEaten.stoodStill && boatEaten.reachedBoat, JSON.stringify({ boatEaten, boatSpot }));
  check('its harpoon is gone at once, it goes under the jaws, and the shark burps when it is home', boatEaten.linesGone && boatEaten.eaten && boatEaten.burp, JSON.stringify(boatEaten));
  check('and then the boat and the swimming shark are gone, with no clang and the shark back to resting', await chrome.eval(`!document.querySelector('.boat') && !document.querySelector('.boat-lines') && !document.querySelector('.shark-swimmer') && !document.querySelector('.clang-word') && document.querySelector('.trash-can').className === 'trash-can'`));
  // No fish at the same time as a boat, and no boat when asked for calm.
  await chrome.goto(BASE + '?boat=now&fish=now&speed=instant');
  await chrome.sleep(1500);
  check('a fish and a boat never share the shark: with both asked for at once, one comes and the other waits', (await chrome.eval(`[!!document.querySelector('.boat'), !!document.querySelector('.fish')].filter(Boolean).length`)) === 1);
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?boat=now&speed=instant');
  await chrome.sleep(1500);
  check('when the computer asks for reduced motion there is no boat, not even when asked for', await chrome.eval(`!document.querySelector('.boat')`));
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.goto(BASE + '?speed=instant');

  // ---- Treats for working: real changes to the blocks, and a program that ran after them, earn a dance, bubbles, a fish or a boat ----
  const treat = () => chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite'); return { dance: s.classList.contains('pose-dance'), bubbles: !document.querySelector('.turtle-bubbles').hidden, fish: !!document.querySelector('.fish'), boat: !!document.querySelector('.boat') }; })()`);
  const gotTreat = (t) => t.dance || t.bubbles || t.fish || t.boat;
  await chrome.goto(BASE + '?goal=2&speed=instant');
  await chrome.sleep(500);
  check('before any work there is no treat', !gotTreat(await treat()));
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 250);
  await chrome.sleep(500);
  check('one block put in is work, but not yet enough for a treat (the goal is 2 points here)', (await stacks()) === 1 && !gotTreat(await treat()));
  for (let i = 0; i < 3; i += 1) await dragBlock('forward', 25, 35);
  await chrome.sleep(400);
  check('moving a stack around the page earns nothing', !gotTreat(await treat()));
  const toDelete = await nodeRect('forward');
  await chrome.drag({ x: toDelete.left + 10, y: toDelete.top + toDelete.h / 2 }, { x: 40, y: 300 }, 12);
  await chrome.sleep(400);
  check('and neither does deleting it', (await stacks()) === 0 && !gotTreat(await treat()));
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 420);
  await chrome.sleep(700);
  const earned = await treat();
  check('another block in reaches the goal, and a treat plays (the turtle dances, blows bubbles, or a fish or a boat comes by)', gotTreat(earned), JSON.stringify(earned));
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: 330 });
  await chrome.sleep(400);
  check('it plays on while they keep working: moving the mouse does not stop it', gotTreat(await treat()));
  // A program that ran after the blocks changed is worth more.
  await chrome.goto(BASE + '?goal=4&speed=instant');
  await chrome.sleep(500);
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 250);
  await chrome.sleep(400);
  check('(a block put in is 1 of the 4 points, so no treat yet)', !gotTreat(await treat()));
  await tapBlockNamed('forward');
  await chrome.sleep(900);
  check('a program run to the end is worth 3 more, but the turtle waves first: no treat in that moment', !gotTreat(await treat()) && (await chrome.eval(`document.querySelector('.turtle-sprite').classList.contains('waving')`)));
  await chrome.sleep(1600);
  check('and once it has waved the treat comes', gotTreat(await treat()));
  // Running blocks that were not changed earns nothing: open a sample and press Run.
  await chrome.goto(BASE + '?sample=square&goal=3&speed=instant');
  await chrome.sleep(600);
  const runAtSample = await chrome.centerOf('#run');
  await chrome.click(runAtSample.x, runAtSample.y);
  await chrome.sleep(3500);
  check('running a sample without changing anything earns no treat, however many times', !gotTreat(await treat()));
  // Calm: no treats at all.
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?goal=1&speed=instant');
  await chrome.sleep(500);
  await openPalette('Turtle');
  await dragFromPalette('forward', 600, 250);
  await chrome.sleep(900);
  check('when the computer asks for reduced motion there are no treats, whatever the work', !gotTreat(await treat()));
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.goto(BASE + '?speed=instant');

  // The turtle's color breathing: it fades and comes back, slowly, after half the quiet time, until anyone does anything.
  const breath = () => chrome.eval(`(() => { const sp = document.querySelector('.turtle-sprite'); const r = sp.getBoundingClientRect(); const others = [...sp.querySelectorAll('svg path, svg circle, svg ellipse')].filter((el) => !el.classList.contains('shell') && !el.closest('.scutes')); const shell = getComputedStyle(sp.querySelector('.shell')); const scute = getComputedStyle(sp.querySelector('.scutes path')); const rgb = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number); return { on: sp.classList.contains('breathing-color'), shell: rgb(shell.fill), scute: rgb(scute.fill), shellOpacity: Number(shell.fillOpacity), scuteOpacity: Number(scute.fillOpacity), sprite: getComputedStyle(sp).opacity + ' ' + getComputedStyle(sp).filter + ' ' + getComputedStyle(sp).transform, x: Math.round(r.x), y: Math.round(r.y), others: [...new Set(others.map((el) => getComputedStyle(el).fillOpacity + ' ' + getComputedStyle(el).fill))].join('|'), count: others.length }; })()`);
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  await chrome.goto(BASE + '?antic=breath&speed=instant');
  await chrome.sleep(500);
  const breaths = [];
  for (let i = 0; i < 42; i += 1) {
    breaths.push(await breath());
    await chrome.sleep(105);
  }
  const trueShell = breaths.reduce((deepest, b) => (b.shell[1] + b.shell[2] < deepest[1] + deepest[2] ? b.shell : deepest), breaths[0].shell);
  const lightest = breaths.reduce((far, b) => (distance(b.shell, trueShell) > distance(far, trueShell) ? b.shell : far), trueShell);
  check('?antic=breath makes the color of the turtle\'s shell go lighter and come back to its full depth, over and over, like a breath', breaths.every((b) => b.on) && distance(lightest, trueShell) > 80 && distance(lightest, trueShell) < 330 && lightest[1] + lightest[2] > trueShell[1] + trueShell[2], `deepest ${trueShell}, lightest ${lightest}`);
  check('it is a change of color and never of see-through: the shell stays fully solid the whole time', breaths.every((b) => b.shellOpacity === 1 && b.scuteOpacity === 1), `${[...new Set(breaths.map((b) => b.shellOpacity))]}`);
  check('the markings on the shell change shade with it', Math.max(...breaths.map((b) => distance(b.scute, breaths[0].scute))) > 40);
  check('only the colored top changes: the rest of the turtle (head, flippers, outline) never does', breaths[0].count >= 3 && breaths.every((b) => b.others === breaths[0].others), `${breaths[0].count} other parts`);
  check('and the turtle itself stays exactly where it is, at full strength, with nothing moved or scaled', breaths.every((b) => b.sprite === breaths[0].sprite && b.x === breaths[0].x && b.y === breaths[0].y) && breaths[0].sprite.startsWith('1 none'), `${breaths[0].sprite} at ${breaths[0].x},${breaths[0].y}`);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 760, y: 300 });
  await chrome.sleep(400);
  const stoppedBreath = await breath();
  check('and any movement of the mouse stops it, back to the turtle\'s true color', !stoppedBreath.on && distance(stoppedBreath.shell, trueShell) < 3, JSON.stringify(stoppedBreath));
  await chrome.goto(BASE + '?idle=4&speed=instant');
  await chrome.sleep(700);
  check('with a quiet time of 4 seconds the breathing has not started yet before half of it is up', !(await breath()).on);
  await chrome.sleep(2200);
  check('and it has by the time half of it is up (the breathing starts before the first antic)', (await breath()).on);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 740, y: 320 });
  await chrome.sleep(80);
  check('touching anything ends it and the quiet starts over', !(await breath()).on);
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?idle=2&antic=breath&speed=instant');
  await chrome.sleep(2800);
  check('when the computer asks for reduced motion the color never breathes', !(await breath()).on);
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.goto(BASE + '?speed=instant');

  // The minute of quiet (made 3 seconds by ?idle=3 so this does not take a minute).
  await chrome.goto(BASE + '?idle=3&speed=instant');
  await chrome.sleep(2200);
  check('nothing happens before the quiet time is up', nothing(await antic()));
  await chrome.sleep(1700);
  check('and once it is up, one thing does', !nothing(await antic()));
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 650, y: 280 });
  await chrome.sleep(80);
  check('touching anything ends it, and the quiet time starts over', nothing(await antic()));
  await chrome.sleep(2200);
  check('(so nothing happens for a while after that)', nothing(await antic()));
  // Not while a program is running.
  await seedProject({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 60, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'forever', args: [], body: [{ op: 'forward', args: [1] }, { op: 'right', args: [1] }] }] }] });
  await chrome.goto(BASE + '?idle=2&speed=slow', { keepStorage: true });
  await chrome.sleep(400);
  const goButton = await chrome.centerOf('#run');
  await chrome.click(goButton.x, goButton.y);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1200, y: 650 });
  await chrome.sleep(4000);
  const during = await antic();
  const stopBtn = await chrome.centerOf('#stop');
  await chrome.click(stopBtn.x, stopBtn.y);
  check('nothing happens while a program is running, however quiet it is', nothing(during), JSON.stringify(during));
  // Asked for calm: never.
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?idle=2&antic=dance&speed=instant');
  await chrome.sleep(3600);
  check('when the computer asks for reduced motion none of it ever happens, not even when asked for', nothing(await antic()));
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.goto(BASE + '?speed=instant');

  // ---- The site menu (the hamburger) ---------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  const aboutLink = await chrome.centerOf('a.toolbar-link[href="about.html"]');
  const hamburger = await chrome.centerOf('.site-menu-icon');
  check('the hamburger menu sits to the right of About', hamburger.x > aboutLink.x + aboutLink.w / 2 && near(hamburger.y, aboutLink.y, 25),
    `About at ${Math.round(aboutLink.x)}, menu at ${Math.round(hamburger.x)}`);
  const panelOpen = () => chrome.eval(`getComputedStyle(document.querySelector('.site-menu-panel')).display !== 'none'`);
  check('the menu starts closed', !(await panelOpen()));
  check('and while it is closed nothing covers the page: the palette button is what gets clicked',
    await chrome.eval(`document.elementFromPoint(40, 95)?.closest('.palette-button') !== null`));
  await chrome.click(hamburger.x, hamburger.y);
  check('clicking the hamburger opens it, with TurtleLab and the rest of the site in it', (await panelOpen()) &&
    (await chrome.eval(`[...document.querySelectorAll('.site-menu-panel a')].map((a) => a.textContent.trim()).join('|')`)).includes('TurtleLab|TurtleLab Lessons|CS50 Problems'));
  const panelBox = await chrome.eval(`(() => { const r = document.querySelector('.site-menu-panel').getBoundingClientRect(); return { right: r.right, bottom: r.bottom, left: r.left, width: window.innerWidth, height: window.innerHeight }; })()`);
  check('the open menu fits on the screen', panelBox.left >= 0 && panelBox.right <= panelBox.width && panelBox.bottom <= panelBox.height, JSON.stringify(panelBox));
  await chrome.click(400, 500);
  check('clicking anywhere else closes it', !(await panelOpen()));
  await chrome.click(hamburger.x, hamburger.y);
  check('and the menu is above the blocks and palettes, so its links can be clicked', await chrome.eval(`(() => { const a = document.querySelector('.site-menu-panel a'); const r = a.getBoundingClientRect(); return document.elementFromPoint(r.left + 20, r.top + r.height / 2).closest('.site-menu-panel') !== null; })()`));
  await chrome.goto(BASE + 'guide.html');
  const pageIcon = await chrome.centerOf('.site-menu-icon');
  await chrome.click(pageIcon.x, pageIcon.y);
  check('the same menu works on the Guide page', await chrome.eval(`getComputedStyle(document.querySelector('.site-menu-panel')).display !== 'none' && document.querySelectorAll('.site-menu-panel a').length >= 9`));

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

  // ---- The badge: blocks, complexity, elegance, efficiency --------------------------------------------
  // A card in the bottom right corner: how many blocks, and complexity, elegance and efficiency from 0.0 to 1.0 (core/quality.js), "+0.1 elegance" when
  // building raises one, and the reasons on a press. Efficiency is about a run, so it says "run it" until a program has run.
  const badge = () => chrome.eval(`(() => { const cell = (id) => document.querySelector('.score-cell[data-metric="' + id + '"] .score-value')?.textContent; return { blocks: cell('blocks'), complexity: cell('complexity'), elegance: cell('elegance'), efficiency: cell('efficiency'), title: document.querySelector('.score-pill')?.title, gain: document.querySelector('.score-gain')?.hidden === false ? document.querySelector('.score-gain').textContent : null }; })()`);
  const wantFor = (project, run = null) => { const a = assess({ project, run }); return { blocks: String(a.blocks), complexity: tenths(a.complexity.value), elegance: a.elegance.value === null ? '?' : tenths(a.elegance.value) }; };
  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(500);
  const emptyBadge = await badge();
  check('an empty page has the badge: 0 blocks, complexity 0.0, elegance not yet, efficiency waiting for a run', emptyBadge.blocks === '0' && emptyBadge.complexity === '0.0' && emptyBadge.elegance === '?' && emptyBadge.efficiency === 'run it' && /0 blocks/.test(emptyBadge.title), JSON.stringify(emptyBadge));
  await openPalette('Flow');
  await dragFromPalette('repeat', 480, 150);
  await chrome.sleep(900);
  const afterRepeat = await badge();
  const keptRepeat = JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`));
  const wantRepeat = wantFor(keptRepeat);
  check('dragging a repeat block in counts it and raises complexity, to what the same blocks come to when worked out here', afterRepeat.blocks === wantRepeat.blocks && afterRepeat.complexity === wantRepeat.complexity && Number(afterRepeat.complexity) > 0, `${JSON.stringify(afterRepeat)} against ${JSON.stringify(wantRepeat)}`);
  check('and "+0.1 complexity" (or more) floats up from the badge', afterRepeat.gain !== null && /^\+\d\.\d complexity$/.test(afterRepeat.gain), JSON.stringify(afterRepeat));
  await chrome.sleep(2200);
  check('the "+" goes away again by itself', (await badge()).gain === null);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  await chrome.sleep(1100);
  const reopened = await badge();
  check('a page opened with that program shows its numbers and no "+" (opening a program is not building one)', reopened.blocks === afterRepeat.blocks && reopened.complexity === afterRepeat.complexity && reopened.gain === null, JSON.stringify(reopened));
  // (Undo only goes back over what was done since the page opened, so build one more thing here first.)
  await openPalette('Turtle');
  await dragFromPalette('forward', 480, 330);
  await chrome.sleep(900);
  const withForward = await badge();
  check('another block is counted: one more block', Number(withForward.blocks) === Number(reopened.blocks) + 1, JSON.stringify([reopened, withForward]));
  await chrome.sleep(2200);
  await chrome.eval(`document.getElementById('undo').click()`);
  await chrome.sleep(900);
  const afterUndo = await badge();
  check('Undo takes the count and the numbers back to what they were, quietly (no "+")', afterUndo.blocks === reopened.blocks && afterUndo.complexity === reopened.complexity && afterUndo.gain === null, JSON.stringify(afterUndo));
  await chrome.eval(`document.getElementById('redo').click()`);
  await chrome.sleep(900);
  const afterRedo = await badge();
  check('and Redo brings them back, also with no "+" (only building floats one)', afterRedo.blocks === withForward.blocks && afterRedo.gain === null, JSON.stringify(afterRedo));

  // A program with a counter in a loop, ready made: numbers for all three, and efficiency after it has run.
  const side = () => [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }];
  const counter = { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 160, y: 60, blocks: [
    { op: 'start', args: [] }, { op: 'clean', args: [] }, { op: 'store1', args: [0] },
    { op: 'repeat', args: [12], body: [{ op: 'store1', args: [{ op: 'add', args: [{ op: 'box1', args: [] }, 6] }] }, { op: 'forward', args: [{ op: 'box1', args: [] }] }, { op: 'right', args: [60] }] },
  ] }] };
  const seedAndOpen = async (project) => {
    await chrome.goto(BASE + 'about.html');
    await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
    await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
    await chrome.sleep(600);
  };
  await seedAndOpen(counter);
  const wantCounter = wantFor(counter);
  const counterBadge = await badge();
  check('a program with a counter in a loop shows its block count, complexity and elegance, as worked out here, and efficiency waits', counterBadge.blocks === wantCounter.blocks && counterBadge.complexity === wantCounter.complexity && counterBadge.elegance === wantCounter.elegance && counterBadge.efficiency === 'run it' && Number(counterBadge.complexity) >= 0.5, JSON.stringify([counterBadge, wantCounter]));
  await pressRun();
  await chrome.sleep(900);
  const ranBadge = await badge();
  check('after it runs there is an efficiency, and a neat spiral is 1.0', ranBadge.efficiency === '1.0' && /Efficiency 1\.0/.test(ranBadge.title), JSON.stringify(ranBadge));
  await openPalette('Turtle');
  await dragFromPalette('back', 480, 330);
  await chrome.sleep(300);
  check('changing the blocks makes efficiency wait for the next run again (it was about the blocks as they were)', (await badge()).efficiency === 'run it');

  // The details: a column of reasons for each of the three.
  const pillAt = await chrome.centerOf('.score-pill');
  await chrome.click(pillAt.x, pillAt.y);
  await chrome.sleep(250);
  const panel = await chrome.eval(`(() => { const p = document.querySelector('.score-panel'); const r = p.getBoundingClientRect(); return { open: !p.hidden, expanded: document.querySelector('.score-pill').getAttribute('aria-expanded'), head: p.querySelector('.score-head').textContent, sections: [...p.querySelectorAll('.score-section')].map((s) => s.dataset.metric + ':' + s.querySelector('.score-title-value').textContent), rows: [...p.querySelectorAll('tr')].map((tr) => tr.dataset.part + ':' + tr.querySelector('.score-points').textContent), reasons: [...p.querySelectorAll('.score-section-elegance .score-reason')].map((li) => li.className + '|' + li.textContent), effReasons: [...p.querySelectorAll('.score-section-efficiency .score-reason')].map((li) => li.textContent), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; })()`);
  check('pressing the badge opens the details: the block count, then Complexity, Elegance and Efficiency, each with its number, and they fit in the window', panel.open && panel.expanded === 'true' && /^\d+ blocks?$/.test(panel.head) && panel.sections.length === 3 && panel.sections.map((x) => x.split(':')[0]).join() === 'complexity,elegance,efficiency' && panel.inside, JSON.stringify(panel));
  check('complexity shows where its points came from, the variables first (the counter is worth the most)', panel.rows.length === 7 && panel.rows[0].startsWith('variables:+') && Number(panel.rows[0].split('+')[1]) > Number(panel.rows[1].split('+')[1]), panel.rows.join(' '));
  check('elegance says what is good about it, with a tick', panel.reasons.some((r) => /score-good/.test(r) && /A loop does the repeating/.test(r)), JSON.stringify(panel.reasons));
  check('efficiency says to run the program, since the blocks just changed', panel.effReasons.some((t) => /Run your program/.test(t)), JSON.stringify(panel.effReasons));
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);
  check('Escape closes the details and puts the focus back on the badge', await chrome.eval(`document.querySelector('.score-panel').hidden === true && document.activeElement === document.querySelector('.score-pill')`));
  await chrome.click(pillAt.x, pillAt.y);
  await chrome.sleep(200);
  await chrome.click(700, 300);
  await chrome.sleep(200);
  check('pressing somewhere else closes them too', await chrome.eval(`document.querySelector('.score-panel').hidden === true`));
  await chrome.eval(`document.getElementById('hide-blocks').click()`);
  await chrome.sleep(250);
  check('hiding the blocks hides the badge, so the whole picture shows, and showing them brings it back', await chrome.eval(`getComputedStyle(document.querySelector('.score-badge')).display === 'none'`)
    && await (async () => { await chrome.eval(`document.getElementById('hide-blocks').click()`); await chrome.sleep(250); return chrome.eval(`getComputedStyle(document.querySelector('.score-badge')).display !== 'none'`); })());

  // Copy and paste is less elegant, with the reason; going back over lines is less efficient, with the reason.
  const unrolled = { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 160, y: 60, blocks: [{ op: 'start', args: [] }, { op: 'clean', args: [] }, ...side(), ...side(), ...side(), ...side()] }] };
  await seedAndOpen(unrolled);
  const unrolledBadge = await badge();
  check('a square with every side written out has low elegance (0.4), and the same 9 blocks as the loop version would', unrolledBadge.elegance === '0.4' && unrolledBadge.blocks === '9', JSON.stringify(unrolledBadge));
  await chrome.click(pillAt.x, pillAt.y);
  await chrome.sleep(250);
  check('and the reason is plain: it comes 4 times in a row, a repeat block could do it, and how many blocks that saves', (await chrome.eval(`[...document.querySelectorAll('.score-section-elegance .score-reason')].map((li) => li.textContent)`)).some((t) => /forward 100, right 90 comes 4 times in a row\. A repeat block could do it, and save 6 blocks\./.test(t)));
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  const retrace = { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 160, y: 60, blocks: [{ op: 'start', args: [] }, { op: 'clean', args: [] }, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [100] }, { op: 'back', args: [100] }, { op: 'right', args: [90] }] }] }] };
  await seedAndOpen(retrace);
  await pressRun();
  await chrome.sleep(900);
  const retraced = await badge();
  check('a program that goes back over each line has a lower efficiency (about 0.6)', Number(retraced.efficiency) >= 0.5 && Number(retraced.efficiency) <= 0.7, JSON.stringify(retraced));
  await chrome.click(pillAt.x, pillAt.y);
  await chrome.sleep(250);
  check('and the reason says how much was drawn on top of lines already there', (await chrome.eval(`[...document.querySelectorAll('.score-section-efficiency .score-reason')].map((li) => li.textContent)`)).some((t) => /^\d+% of the lines are drawn on top of lines that were already there/.test(t)));
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });

  // ---- The color picker on set color and fill screen -------------------------------------------------
  // A color box on each of those blocks shows the color of the three numbers and its hex; pressing it opens a picker that changes the three numbers
  // (which stay on the block) and shows each in hex and in binary.
  const colorProject = { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 230, y: 60, blocks: [
    { op: 'start', args: [] }, { op: 'clean', args: [] },
    { op: 'fillscreen', args: [30, 40, 90] },
    { op: 'setcolor', args: [255, 128, 0] },
    { op: 'setcolor', args: [{ op: 'random', args: [0, 255] }, 0, 0] },
    { op: 'forward', args: [100] },
  ] }] };
  await chrome.goto(BASE + 'about.html');
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(colorProject))})`);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  await chrome.sleep(600);
  const boxes = () => chrome.eval(`[...document.querySelectorAll('.workspace .node.colorslot')].map((n) => ({ text: n.textContent.trim(), fill: n.querySelector('rect').getAttribute('fill') }))`);
  const wantBoxes = [{ text: '#1E285A', fill: 'rgb(30, 40, 90)' }, { text: '#FF8000', fill: 'rgb(255, 128, 0)' }, { text: 'N/A', fill: 'rgb(255, 255, 255)' }];
  const shown = await boxes();
  check('a color box on each fill screen and set color block shows the color and its hex (one with another block in a socket says N/A)', JSON.stringify(shown) === JSON.stringify(wantBoxes), JSON.stringify(shown));
  check('the three numbers are still on the blocks', (await count('.workspace .node.literal')) >= 8);
  // The box is right under the words on the block, lined up with them on the left, and inside the block. (And it is not a name box: it does not have
  // the class the checks use to count the names of blocks you made.)
  const under = await chrome.eval(`(() => {
    const out = [];
    for (const label of ['fill screen', 'set color']) {
      for (const block of document.querySelectorAll('.workspace .stack .node.command')) {
        const word = [...block.querySelectorAll('text')].find((t) => t.textContent.trim() === label);
        if (!word) continue;
        const w = word.getBoundingClientRect();
        const r = block.getBoundingClientRect();
        out.push({ label, word: { left: w.left, bottom: w.bottom, top: w.top }, blockRect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } });
        break;
      }
    }
    return out;
  })()`);
  const colorBoxes = await chrome.eval(`[...document.querySelectorAll('.workspace .node.colorslot')].map((n) => { const r = n.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, classes: n.getAttribute('class') }; })`);
  check('the color box sits under the words of its block ("fill screen", "set color"), lined up with them on the left, inside the block',
    [0, 1].every((i) => colorBoxes[i].top >= under[i].word.bottom - 2 && Math.abs(colorBoxes[i].left - under[i].word.left) <= 4 && colorBoxes[i].left >= under[i].blockRect.left && colorBoxes[i].bottom <= under[i].blockRect.bottom && colorBoxes[i].right <= under[i].blockRect.right),
    JSON.stringify({ under, colorBoxes }));
  check('and a color box is not a name box (it has no nameslot class, so it is never mistaken for the name of a block you made)', colorBoxes.every((b) => !/nameslot/.test(b.classes)) && (await count('.workspace .node.nameslot')) === 0, JSON.stringify(colorBoxes.map((b) => b.classes)));
  const boxCenter = (i) => chrome.eval(`(() => { const r = [...document.querySelectorAll('.workspace .node.colorslot')][${i}].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const pickerState = () => chrome.eval(`(() => { const p = document.querySelector('.color-picker'); if (!p) return null; const r = p.getBoundingClientRect(); return {
    hex: p.querySelector('.cp-hex').value, native: p.querySelector('.cp-native').value,
    numbers: [...p.querySelectorAll('.cp-number')].map((i) => i.value), hexes: [...p.querySelectorAll('.cp-chex')].map((i) => i.value), bins: [...p.querySelectorAll('.cp-bin')].map((i) => i.value),
    sliders: [...p.querySelectorAll('.cp-slider')].map((i) => i.value), bits: p.querySelector('.cp-bits').textContent, inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight - 0.5 }; })()`);
  const at1 = await boxCenter(1);
  await chrome.click(at1.x, at1.y);
  await chrome.sleep(300);
  const first = await pickerState();
  check('pressing the color box opens the picker, showing the color as hex, as three numbers, in hex and in binary, and all 24 bits, and it fits in the window',
    first && first.hex === '#FF8000' && first.native === '#ff8000' && first.numbers.join() === '255,128,0' && first.hexes.join() === 'FF,80,00'
    && first.bins.join() === '1111 1111,1000 0000,0000 0000' && first.sliders.join() === '255,128,0' && first.bits === `All 24 bits: ${colorBits([255, 128, 0])}` && first.inside, JSON.stringify(first));
  check('the picker has the focus on the first number, ready to type', await chrome.eval(`document.activeElement?.classList.contains('cp-number')`));

  const typeInto = async (selector, text) => {
    await chrome.eval(`(() => { const f = document.querySelector(${JSON.stringify(selector)}); f.focus(); f.select(); })()`);
    await chrome.send('Input.insertText', { text });
    await chrome.sleep(120);
  };
  await typeInto('.cp-green .cp-bin', '01000000');
  const afterBinary = await pickerState();
  check('typing 8 binary digits for green changes the other forms to match (64 is 40 in hex), and the color box on the block follows at once',
    afterBinary.numbers.join() === '255,64,0' && afterBinary.hexes.join() === 'FF,40,00' && afterBinary.hex === '#FF4000' && afterBinary.sliders[1] === '64' && (await boxes())[1].text === '#FF4000', JSON.stringify([afterBinary, (await boxes())[1]]));
  await typeInto('.cp-hex', '#0a141e');
  const afterHex = await pickerState();
  check('typing a whole hex color sets all three numbers (and any case will do)', afterHex.numbers.join() === '10,20,30' && afterHex.bins.join() === '0000 1010,0001 0100,0001 1110' && (await boxes())[1].text === '#0A141E', JSON.stringify(afterHex));
  await typeInto('.cp-red .cp-chex', 'c8');
  check('typing 2 hex digits for red sets red (C8 is 200)', (await pickerState()).numbers.join() === '200,20,30');
  await typeInto('.cp-blue .cp-number', '255');
  check('typing a number sets that one, and the binary follows', (await pickerState()).bins.join() === '1100 1000,0001 0100,1111 1111');
  await typeInto('.cp-blue .cp-number', '300');
  check('a number over 255 is not taken: the box waits with what was typed, and the color (and the block) stays as it was', (await pickerState()).sliders.join() === '200,20,255' && (await boxes())[1].text === '#C814FF', JSON.stringify([await pickerState(), (await boxes())[1]]));
  await chrome.eval(`document.querySelector('.cp-blue .cp-number').blur()`);
  await chrome.sleep(100);
  check('and when you leave the box it goes back to the number that is really there', (await pickerState()).numbers.join() === '200,20,255');
  await chrome.eval(`(() => { const s = document.querySelector('.cp-green .cp-slider'); s.value = '99'; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await chrome.sleep(100);
  check('moving a slider sets that number and the others follow', (await pickerState()).numbers.join() === '200,99,255' && (await pickerState()).hexes.join() === 'C8,63,FF');
  await chrome.eval(`(() => { const n = document.querySelector('.cp-native'); n.value = '#336699'; n.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await chrome.sleep(100);
  const afterNative = await pickerState();
  check('the browser\'s own color chooser sets all three too', afterNative.numbers.join() === '51,102,153' && afterNative.hex === '#336699', JSON.stringify(afterNative));
  check('while the picker is open nothing is saved yet, however many boxes you have typed in (it is one change, kept when it closes)', JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`)).stacks[0].blocks[3].args.join() === '255,128,0');
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(900);
  const savedColor = JSON.parse(await chrome.eval(`localStorage.getItem('turtlelab-project')`)).stacks[0].blocks[3];
  check('Escape closes it and keeps the color: the block has the three numbers 51, 102, 153, and nothing else about the block changed', (await count('.color-picker')) === 0 && savedColor.op === 'setcolor' && savedColor.args.join() === '51,102,153', JSON.stringify(savedColor));
  check('the Python box would say the same numbers: the block\'s color is really those numbers (the picker adds nothing to the project)', Object.keys(savedColor).sort().join() === 'args,op');
  await chrome.eval(`document.getElementById('undo').click()`);
  await chrome.sleep(500);
  check('one Undo puts the old color back, all of it: the whole picking was one step', (await boxes())[1].text === '#FF8000' && (await count('.color-picker')) === 0, JSON.stringify(await boxes()));
  await chrome.eval(`document.getElementById('redo').click()`);
  await chrome.sleep(500);
  check('and Redo brings the new one back', (await boxes())[1].text === '#336699');

  // Pressing somewhere else closes it too; Done closes it; a block in a socket means there is nothing to pick.
  const at0 = await boxCenter(0);
  await chrome.click(at0.x, at0.y);
  await chrome.sleep(250);
  check('the fill screen block has a picker as well, opening on its own color', (await pickerState())?.hex === '#1E285A', JSON.stringify(await pickerState()));
  await chrome.click(900, 150);
  await chrome.sleep(250);
  check('pressing somewhere else closes the picker, and changes nothing', (await count('.color-picker')) === 0 && (await boxes())[0].text === '#1E285A');
  const at2 = await boxCenter(2);
  await chrome.click(at2.x, at2.y);
  await chrome.sleep(250);
  check('with another block in a socket there is no picker, and the message says why', (await count('.color-picker')) === 0 && /no one color to pick/.test(await chrome.eval(`document.getElementById('message').textContent`)));
  // The blocks in the palette have color boxes too, but a press there is not an edit.
  await openPalette('Pen');
  const paletteBoxes = await chrome.eval(`[...document.querySelectorAll('.flyout .node.colorslot')].map((n) => n.textContent.trim())`);
  check('the set color and fill screen blocks in the palette show their color boxes too (red, and white)', paletteBoxes.join() === '#FF0000,#FFFFFF', paletteBoxes.join());
  const pb = await chrome.eval(`(() => { const r = document.querySelector('.flyout .node.colorslot').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(pb.x, pb.y);
  await chrome.sleep(300);
  check('and pressing a palette block\'s color box does not open a picker (that block is only a pattern to drag out)', (await count('.color-picker')) === 0);
  await chrome.eval(`document.querySelector('.palette-button.selected')?.click()`);
  // A color box makes the same project it always did: the picker adds nothing to the file, and Logo and Python are unchanged.
  const forPython = toPython(validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 0, y: 0, blocks: [{ op: 'start', args: [] }, { op: 'setcolor', args: [51, 102, 153] }] }] }).project);
  check('Python for a set color block is what it was, with the three numbers', /rgb\(51, 102, 153\)/.test(forPython), forPython.split('\n').filter((l) => /rgb\(51/.test(l)).join('|'));
  check('and the color of those numbers has the hex #336699', toHexUpper([51, 102, 153]) === '#336699');

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
