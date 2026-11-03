// Dev tool, not part of the app. Checks the block editor in a real headless
// Chrome: dragging blocks out of the palette, snapping, unsnapping, deleting,
// plugging in reporters, typing numbers, and tapping a stack to run it.
// Start the dev server first:  python3 -m http.server 4011 --directory turtle-draw
// Then run:                    node turtle-draw/dev/editor-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';

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

const BLOCK_NODES = ".workspace .node.command, .workspace .node.clamp, .workspace .node.reporter";
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

/** Drag a block out of the open palette so its top-left corner lands at (left, top). */
async function dragFromPalette(op, left, top) {
  const rect = await flyoutRect(op);
  const press = { x: rect.left + 8, y: rect.top + rect.h / 2 };
  await chrome.drag(press, { x: left + 8, y: top + rect.h / 2 }, 10);
  await chrome.sleep(80);
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
  check('three palettes have blocks so far', (await count('.palette-button')) === 3);

  await openPalette('Turtle');
  check('the Turtle palette opens and lists its 11 blocks', (await chrome.eval(`!document.querySelector('.flyout').hidden`)) && (await count('.flyout .stack')) === 11,
    `${await count('.flyout .stack')} blocks`);

  // Every label, in every palette, must fit inside its block.
  const overflows = [];
  for (const title of ['Turtle', 'Pen', 'Flow']) {
    await openPalette(title);
    const bad = await chrome.eval(`(() => {
      const bad = [];
      for (const stack of document.querySelectorAll('.flyout .stack')) {
        for (const node of stack.querySelectorAll('.node')) {
          const path = node.querySelector('path'); const box = path.getBBox();
          for (const text of node.querySelectorAll('text')) {
            if (!text.textContent.trim()) continue;
            const t = text.getBBox();
            if (t.x < box.x - 0.5 || t.x + t.width > box.x + box.width + 0.5) bad.push(stack.dataset.op + ':' + text.textContent.trim());
          }
        }
      }
      return bad;
    })()`);
    overflows.push(...bad);
  }
  check('every label in every palette fits inside its block', overflows.length === 0, overflows.join(', '));
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

  // ---- Run button -----------------------------------------------------------------------------
  const runBtn = await chrome.centerOf('#run');
  await chrome.click(runBtn.x, runBtn.y);
  await chrome.sleep(200);
  check('Run with no clean block explains what to do', /clean/.test(await chrome.eval(`document.getElementById('message').textContent`)));

  await chrome.goto(BASE + '?demo=square&speed=instant');
  const run2 = await chrome.centerOf('#run');
  await chrome.click(run2.x, run2.y);
  await chrome.sleep(400);
  const red = await chrome.eval(`(() => { const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 0) n++; return n; })()`);
  check('Run draws the square from the demo blocks', red > 5000, `${red} red pixels`);
  await chrome.screenshot(SHOTS + 'editor-square-run.png');

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

  check('no console errors, exceptions or CSP violations', chrome.problems.length === 0, chrome.problems.join(' | '));
  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('the page asked for nothing outside its own address', elsewhere.length === 0, `${chrome.requests.length} requests; outside: ${elsewhere.join(', ') || 'none'}`);
} finally {
  await chrome.close();
}
console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
