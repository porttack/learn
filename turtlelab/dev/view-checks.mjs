// Dev tool, not part of the app. Checks, in a real headless Chrome, the buttons that change what
// you see: Fit (zoom the drawing and the blocks so everything is in view), the grid of x and y
// numbers, and that the PDF button fits first.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/view-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';
import { mkdtempSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { handPoint } from '../js/core/hand.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 1366, height: 700 });
const downloads = mkdtempSync(join(tmpdir(), 'turtlelab-view-'));
await chrome.downloadsTo(downloads);

const b = (op, ...args) => ({ op, args });
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);

/** Open the app with this program already on the page (saved work from a page that does not autosave). */
async function openWith(stacks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}

async function finishRun() {
  for (let i = 0; i < 100; i += 1) {
    if (await chrome.eval(`!document.getElementById('run').disabled`)) return true;
    await chrome.sleep(150);
  }
  return false;
}

async function run() {
  await click('#run');
  await chrome.sleep(300);
  await finishRun();
  await chrome.sleep(200);
}

const paperData = () => chrome.eval(`document.querySelector('canvas.paper').toDataURL()`);

/** The box round the pixels that match a test, on the paper canvas, in canvas pixels. */
const inkBox = (test) =>
  chrome.eval(`(() => {
    const c = document.querySelector('canvas.paper');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const isInk = (r, g, b) => ${test};
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, n = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (isInk(d[i], d[i + 1], d[i + 2])) { n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    return { n, minX, maxX, minY, maxY, w: c.width, h: c.height };
  })()`);
const redBox = () => inkBox('r > 200 && g < 60 && b < 60');
const MARGIN_PIXELS = 80; // the paper keeps this much clear round a fitted drawing (40 paper units)

try {
  // ---- The buttons --------------------------------------------------------------------------------
  await openWith([]);
  check('the toolbar has a Fit button and a grid button, each with a picture and a tooltip',
    await chrome.eval(`(() => {
      const fit = document.getElementById('fit'); const grid = document.getElementById('grid');
      return !!fit && !!grid && fit.querySelector('img').getAttribute('src') === 'images/fit-button.svg' && grid.querySelector('img').getAttribute('src') === 'images/grid-button.svg'
        && /everything you drew is on the paper/.test(fit.title) && grid.getAttribute('aria-pressed') === 'false' && /grid/i.test(grid.title);
    })()`));

  // ---- Fit: a drawing that runs far off the paper ---------------------------------------------------
  const bigSquare = [{ x: 140, y: 60, blocks: [b('start'), b('clean'), b('setcolor', 220, 0, 0), b('setpensize', 20), { op: 'repeat', args: [4], body: [b('forward', 900), b('right', 90)] }] }];
  await openWith(bigSquare);
  await run();
  const first = await paperData();
  const clipped = await redBox();
  check('before Fit, a 900 unit square is cut off by the edge of the paper', clipped.minY === 0 || clipped.maxY === clipped.h - 1 || clipped.maxX === clipped.w - 1, JSON.stringify(clipped));

  await click('#fit');
  await chrome.sleep(300);
  const fitted = await redBox();
  check('Fit zooms out so the whole square is on the paper, with the margin all round',
    fitted.minX >= MARGIN_PIXELS - 4 && fitted.maxX <= fitted.w - 1 - (MARGIN_PIXELS - 4) && fitted.minY >= MARGIN_PIXELS - 4 && fitted.maxY <= fitted.h - 1 - (MARGIN_PIXELS - 4), JSON.stringify(fitted));
  check('and fills the paper: the picture is as tall as the margins allow',
    fitted.maxY - fitted.minY > fitted.h - 2 * MARGIN_PIXELS - 8, `${fitted.maxY - fitted.minY} tall of ${fitted.h - 2 * MARGIN_PIXELS}`);
  check('Fit says what it did', /Zoomed to fit/.test(await message()), await message());
  check('the turtle is on the paper, not left off the edge',
    await chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite').getBoundingClientRect(); const p = document.querySelector('.paper-box').getBoundingClientRect(); const x = s.left + s.width / 2; const y = s.top + s.height / 2; return x > p.left && x < p.right && y > p.top && y < p.bottom; })()`));
  const blocksIn = await chrome.eval(`(() => {
    const box = document.querySelector('.workspace').getBoundingClientRect();
    const r = [...document.querySelectorAll('.workspace .stack')].map((g) => g.getBoundingClientRect());
    return r.length > 0 && r.every((q) => q.left >= box.left && q.top >= box.top && q.right <= box.right && q.bottom <= box.bottom);
  })()`);
  check('and every block is inside the window', blocksIn);

  await click('#fit');
  await chrome.sleep(300);
  check('pressing Fit a second time goes back to the normal paper, exactly as it was before the first press', (await paperData()) === first);
  check('and says so', /Back to the normal paper/.test(await message()), await message());
  await click('#fit');
  await chrome.sleep(300);
  const third = await redBox();
  check('a third press fits again, the same as the first time', JSON.stringify(third) === JSON.stringify(fitted), JSON.stringify(third));
  // The PDF button always wants the fitted picture, so on a paper that is already fitted it must NOT go back.
  const pdfsBefore = readdirSync(downloads).filter((f) => f.endsWith('.pdf')).length;
  await click('#save-pdf');
  let pdfDone = false;
  for (let i = 0; i < 60 && !pdfDone; i += 1) {
    await chrome.sleep(150);
    pdfDone = readdirSync(downloads).filter((f) => f.endsWith('.pdf')).length > pdfsBefore;
  }
  const stillFitted = await redBox();
  check('the PDF button on an already fitted paper keeps it fitted (it never toggles back)', pdfDone && JSON.stringify(stillFitted) === JSON.stringify(fitted), JSON.stringify(stillFitted));

  await click('#view-home');
  await chrome.sleep(300);
  check('the house button goes back to the starting view, and the picture is exactly as it was (it is drawn again from the turtle\'s lines)',
    (await paperData()) === first);

  await click('#fit');
  await chrome.sleep(200);
  await run();
  check('running a program starts from the starting view, not the zoom from the last Fit', (await paperData()) === first);

  // ---- The PDF button fits first --------------------------------------------------------------------
  await click('#view-home');
  await chrome.sleep(200);
  await click('#save-pdf');
  let saved = null;
  for (let i = 0; i < 60 && !saved; i += 1) {
    await chrome.sleep(150);
    saved = readdirSync(downloads).find((f) => f.endsWith('.pdf')) ?? null;
  }
  const afterPdf = await redBox();
  check('the PDF button fits the drawing first, so the whole of it is in the PDF',
    saved !== null && afterPdf.minX >= MARGIN_PIXELS - 4 && afterPdf.maxX <= afterPdf.w - 1 - (MARGIN_PIXELS - 4) && afterPdf.minY >= MARGIN_PIXELS - 4 && afterPdf.maxY <= afterPdf.h - 1 - (MARGIN_PIXELS - 4), `${saved} ${JSON.stringify(afterPdf)}`);

  // ---- Fit draws every kind of mark again exactly (arcs, fills, a whole-paper color) ---------------
  for (const demo of ['flower', 'star', 'arcs', 'squarefn', 'boxes']) {
    await chrome.goto(`${BASE}?demo=${demo}&speed=instant&autorun=1`);
    await chrome.sleep(800);
    await finishRun();
    const was = await paperData();
    await click('#fit');
    await chrome.sleep(250);
    const fittedData = await paperData();
    await click('#fit');
    await chrome.sleep(200);
    const twice = await paperData();
    await click('#fit');
    await chrome.sleep(250);
    const thrice = await paperData();
    await click('#view-home');
    await chrome.sleep(250);
    check(`the ${demo} example: Fit, then Fit again, gives back exactly the first picture; a third press fits exactly as before; the house button also gives back the first`,
      (await paperData()) === was && twice === was && thrice === fittedData && fittedData !== was && was.length > 5000);
  }

  // ---- Nothing drawn --------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  const blank = await paperData();
  await click('#fit');
  await chrome.sleep(200);
  check('with nothing drawn, Fit leaves the paper alone and does not complain', (await paperData()) === blank && /Zoomed to fit/.test(await message()));

  // ---- A picture opened from a file needs no zoom -------------------------------------------------
  await chrome.goto(`${BASE}?demo=star&speed=instant&autorun=1`);
  await chrome.sleep(800);
  await click('#save');
  let png = null;
  for (let i = 0; i < 60 && !png; i += 1) {
    await chrome.sleep(150);
    png = readdirSync(downloads).find((f) => f.endsWith('.png')) ?? null;
  }
  await click('#new');
  await chrome.setFileInput('#open-file', [join(downloads, png ?? 'missing.png')]);
  await chrome.sleep(900);
  const opened = await paperData();
  const openedInk = await redBox();
  await click('#fit');
  await chrome.sleep(250);
  check('a picture opened from a file is not changed by Fit (there are no lines to zoom to)', png !== null && (await paperData()) === opened && openedInk.n === 0 && opened.length > 5000);

  // ---- Dragging the turtle, zoomed -------------------------------------------------------------------
  const smallSquare = [{ x: 140, y: 60, blocks: [b('start'), b('clean'), { op: 'repeat', args: [4], body: [b('forward', 100), b('right', 90)] }] }];
  await openWith(smallSquare);
  await run();
  await click('#fit');
  await chrome.sleep(250);
  const spriteCenter = () => chrome.eval(`(() => { const s = document.querySelector('.turtle-sprite').getBoundingClientRect(); return { x: s.left + s.width / 2, y: s.top + s.height / 2 }; })()`);
  const from = await spriteCenter();
  const to = { x: from.x + 70, y: from.y - 50 };
  await chrome.drag(from, to);
  await chrome.sleep(200);
  const dropped = await spriteCenter();
  check('after Fit, dragging the turtle puts it where you let go (the zoom is taken into account)', Math.hypot(dropped.x - to.x, dropped.y - to.y) < 5, `${Math.round(dropped.x)},${Math.round(dropped.y)} wanted ${Math.round(to.x)},${Math.round(to.y)}`);

  // ---- The grid ------------------------------------------------------------------------------------
  // A thin blue line down x = 0 and a red square off to the right: the grid axis must sit on the blue line,
  // both at the starting view and after Fit slides and zooms the paper.
  const axes = [{ x: 140, y: 60, blocks: [
    b('start'), b('clean'), b('setpensize', 2), b('setcolor', 0, 0, 255), b('penup'), b('setxy', 0, -200), b('setheading', 0), b('pendown'), b('forward', 400),
    b('penup'), b('setxy', 200, 100), b('pendown'), b('setcolor', 220, 0, 0), b('setpensize', 10), { op: 'repeat', args: [4], body: [b('forward', 60), b('right', 90)] },
  ] }];
  await openWith(axes);
  await run();
  const noGrid = await paperData();
  check('the grid starts off', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));
  await click('#grid');
  await chrome.sleep(250);
  check('the grid button turns the grid on (and its tooltip changes to say what the next press does)',
    await chrome.eval(`document.querySelector('.paper-grid').hidden === false && document.getElementById('grid').getAttribute('aria-pressed') === 'true' && /Next paper/.test(document.getElementById('grid').title)`));
  const gridInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-grid'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  check('it draws lines and numbers', gridInk > 20000, `${gridInk} pixels`);
  check('the grid is never on the paper itself, so a saved picture never has it (the PDF adds its own copy for its picture)', (await paperData()) === noGrid);

  const blueColumn = () => chrome.eval(`(() => {
    const c = document.querySelector('canvas.paper');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let sum = 0, n = 0; const y = 300;
    for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (d[i + 2] > 200 && d[i] < 80 && d[i + 1] < 80) { sum += x; n++; } }
    return n ? sum / n : -1;
  })()`);
  const axisColumn = () => chrome.eval(`(() => {
    const c = document.querySelector('canvas.paper-grid');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const counts = new Uint16Array(c.width);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const a = d[(y * c.width + x) * 4 + 3]; if (a >= 110 && a <= 146) counts[x]++; }
    let best = 0; for (let x = 0; x < c.width; x++) if (counts[x] > counts[best]) best = x;
    let lo = best, hi = best;
    while (lo > 0 && counts[lo - 1] >= counts[best] * 0.7) lo--;
    while (hi < c.width - 1 && counts[hi + 1] >= counts[best] * 0.7) hi++;
    return (lo + hi) / 2;
  })()`);
  const blue0 = await blueColumn();
  const axis0 = await axisColumn();
  check('at the starting view the y axis of the grid is right on the line drawn along x = 0', Math.abs(blue0 - axis0) <= 2 && Math.abs(axis0 - 700) <= 2, `line at ${blue0}, axis at ${axis0}`);
  await click('#fit');
  await chrome.sleep(300);
  const blue1 = await blueColumn();
  const axis1 = await axisColumn();
  check('after Fit slides and zooms the paper, the grid moves with it and the axis is still on that line', Math.abs(blue1 - axis1) <= 2 && Math.abs(axis1 - 700) > 100, `line at ${blue1}, axis at ${axis1}`);
  check('and the zoomed grid changes its own spacing: it is still on, with lines', await chrome.eval(`document.querySelector('.paper-grid').hidden === false`));
  const spriteAt = await spriteCenter();
  await chrome.drag(spriteAt, { x: spriteAt.x + 30, y: spriteAt.y + 30 });
  await chrome.sleep(150);
  const spriteAfter = await spriteCenter();
  check('the turtle can still be dragged with the grid on (clicks go through the grid)', Math.hypot(spriteAfter.x - spriteAt.x - 30, spriteAfter.y - spriteAt.y - 30) < 5);
  // Each further press goes on to the next paper (always with the squares and their numbers), and after the last one the blank screen is back.
  const state = () => chrome.eval(`({ classes: document.querySelector('.paper-box').className, gridHidden: document.querySelector('.paper-grid').hidden, pressed: document.getElementById('grid').getAttribute('aria-pressed'), title: document.getElementById('grid').title })`);
  const cycle = [];
  for (let press = 0; press < 5; press += 1) {
    await click('#grid');
    await chrome.sleep(250);
    const now = await state();
    cycle.push(`${now.gridHidden ? 'no grid' : 'grid'}/${(now.classes.match(/paper-(white|whiteboard|graph|chalkboard|blueprint)\b/) ?? [])[1]}`);
    if (press === 3) check('on the last paper the tooltip says the next press puts the blank screen back', /blank screen/.test(now.title), now.title);
  }
  check('pressing the grid button again goes through the papers one at a time, then back to the blank screen', cycle.join() === 'grid/whiteboard,grid/graph,grid/chalkboard,grid/blueprint,no grid/white', cycle.join());
  check('and at the blank screen the button is off and the paper plain: the grid is hidden and nothing is drawn over the paper', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.getElementById('grid').getAttribute('aria-pressed') === 'false' && document.querySelector('canvas.paper-style').hidden && document.querySelector('canvas.paper-sketch').hidden && getComputedStyle(document.querySelector('canvas.paper')).visibility === 'visible'`));

  // ---- Other grids and papers: right-click the grid button ------------------------------------------
  const rightClick = async (selector) => {
    const at = await chrome.centerOf(selector);
    await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'right', buttons: 2, clickCount: 1 });
    await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'right', buttons: 0, clickCount: 1 });
    await chrome.sleep(200);
  };
  const menuState = () => chrome.eval(`(() => { const m = [...document.querySelectorAll('.export-menu')].find((x) => x.getAttribute('aria-label') === 'Grids and papers'); if (!m) return null; return { open: !m.hidden, headings: [...m.querySelectorAll('.export-heading')].map((h) => h.textContent), rows: [...m.querySelectorAll('.export-radio')].map((r) => r.dataset.format), checked: [...m.querySelectorAll('.export-radio[aria-checked="true"]')].map((r) => r.dataset.format) }; })()`);
  const pick = async (id) => {
    await rightClick('#grid');
    await click(`.export-radio[data-format="${id}"]`);
    await chrome.sleep(250);
  };
  /** Is there grid ink at (or within 2 pixels of) this spot of the grid canvas? */
  const ink = (points) => chrome.eval(`(() => { const c = document.querySelector('canvas.paper-grid'); const g = c.getContext('2d'); return ${JSON.stringify(points)}.map(([x, y]) => { const d = g.getImageData(x - 2, y - 2, 5, 5).data; let a = 0; for (let i = 3; i < d.length; i += 4) a = Math.max(a, d[i]); return a > 20; }); })()`);
  const mid = [700, 560]; // the middle of the paper, in the grid canvas's own pixels (at the starting view)
  const toward = (heading, distance) => [Math.round(mid[0] + distance * Math.sin((heading * Math.PI) / 180)), Math.round(mid[1] - distance * Math.cos((heading * Math.PI) / 180))];

  await openWith(axes);
  await run();
  const plainPicture = await paperData();
  await rightClick('#grid');
  const menu0 = await menuState();
  check('right-clicking the grid button opens a list with a Grid part and a Paper part', menu0?.open && menu0.headings.join() === 'Grid,Paper', JSON.stringify(menu0));
  check('it lists No grid, the four grids and the papers, with No grid and White chosen to begin with',
    menu0.rows.join() === 'grid:off,grid:numbers,grid:squares,grid:dots,grid:polar,paper:white,paper:whiteboard,paper:graph,paper:chalkboard,paper:blueprint' && menu0.checked.join() === 'grid:off,paper:white', JSON.stringify(menu0));
  check('right-clicking did not also press the button: the grid is still off', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);
  check('Escape closes it', !(await menuState()).open);

  await pick('grid:numbers');
  const numbersInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-grid'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  const [numbersLine, numbersBetween] = await ink([[800, 300], [787, 300]]);
  check('choosing squares with numbers shows the grid (and turns the button on), with a line at x = 50 and none between', numbersLine && !numbersBetween && (await chrome.eval(`document.getElementById('grid').getAttribute('aria-pressed') === 'true' && /Next paper/.test(document.getElementById('grid').title)`)));
  check('the menu now has Squares with numbers chosen', (await (async () => { await rightClick('#grid'); const m = await menuState(); await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); return m.checked.join(); })()) === 'grid:numbers,paper:white');
  await pick('grid:squares');
  const squaresInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-grid'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  const [squaresLine] = await ink([[800, 300]]);
  check('plain squares are the same lines without the numbers (less ink)', squaresLine && squaresInk < numbersInk * 0.97, `${squaresInk} against ${numbersInk}`);
  await pick('grid:dots');
  const [dot, offDot, axisDot] = await ink([[800, 460], [800, 500], [700, 460]]);
  check('dots are a dot at each crossing (and nothing between them)', dot && !offDot && axisDot, JSON.stringify([dot, offDot, axisDot]));
  await pick('grid:polar');
  const [ring, betweenRings, spoke, strayPoint] = await ink([toward(15, 100), toward(15, 150), toward(30, 300), [800, 300]]);
  check('circles and angles are rings around the middle, 50 steps apart, with a spoke every 30 degrees', ring && !betweenRings && spoke && !strayPoint, JSON.stringify([ring, betweenRings, spoke, strayPoint]));
  check('and they say so: the message tells about distances and headings', /how far from the middle/.test(await message()) && /set heading/.test(await message()), await message());

  // The paper
  await pick('grid:numbers');
  const gridPixel = (x, y) => chrome.eval(`Array.from(document.querySelector('canvas.paper-grid').getContext('2d').getImageData(${x}, ${y}, 1, 1).data)`);
  const stylePixel = (x, y) => chrome.eval(`Array.from(document.querySelector('canvas.paper-style').getContext('2d').getImageData(${x}, ${y}, 1, 1).data)`);
  const axisOnWhite = await gridPixel(700, 100);
  check('on white paper the grid is dark lines', axisOnWhite[3] > 0 && axisOnWhite[0] < 60, JSON.stringify(axisOnWhite));
  // The hand drawn papers: the sketch canvas shows the drawing wobbled, the paper canvas (the real picture) is untouched.
  /** Where the thin blue line (x = 0) is on a canvas, row by row: how many rows have it, and how far it wanders sideways, in canvas pixels. */
  const wander = (selector) => chrome.eval(`(() => { const g = document.querySelector('${selector}').getContext('2d'); const xs = []; for (let y = 300; y <= 820; y += 20) { const d = g.getImageData(640, y, 120, 1).data; let sum = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100 && d[i + 2] > 150 && d[i] < 120) { sum += i / 4; n += 1; } if (n) xs.push(sum / n); } return { rows: xs.length, spread: Math.max(...xs) - Math.min(...xs) }; })()`);
  const turtleAt = () => chrome.eval(`(() => { const r = document.querySelector('.turtle-sprite').getBoundingClientRect(); const b = document.querySelector('.paper-box').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: b.left, top: b.top, scale: b.width / 700 }; })()`);
  const spot = (t, x, y) => ({ x: t.left + (350 + x) * t.scale, y: t.top + (280 - y) * t.scale });
  const straight = await wander('canvas.paper');
  check('on white paper the blue line is straight (the picture itself)', straight.rows > 20 && straight.spread <= 1, JSON.stringify(straight));
  const turtleWhite = await turtleAt();
  const wantWhite = spot(turtleWhite, 200, 100);
  check('on white paper the turtle sits exactly where the turtle is', Math.hypot(turtleWhite.x - wantWhite.x, turtleWhite.y - wantWhite.y) < 1.5, JSON.stringify([turtleWhite, wantWhite]));
  await pick('paper:whiteboard');
  const white = await chrome.eval(`(() => { const box = document.querySelector('.paper-box'); const sketch = document.querySelector('canvas.paper-sketch'); const style = document.querySelector('canvas.paper-style'); return { classes: box.className, sketchHidden: sketch.hidden, paperSeen: getComputedStyle(document.querySelector('canvas.paper')).visibility, blend: getComputedStyle(style).mixBlendMode, styleHidden: style.hidden, filter: getComputedStyle(sketch).filter, mask: getComputedStyle(sketch).maskImage, background: box.style.backgroundColor }; })()`);
  check('a whiteboard shows a sketch of the drawing instead of the paper (which stays, hidden), with smudges blended over it, and no chalk grain', /paper-whiteboard/.test(white.classes) && /paper-hand/.test(white.classes) && !white.sketchHidden
    && white.paperSeen === 'hidden' && !white.styleHidden && white.blend === 'multiply' && white.filter === 'none' && white.mask === 'none' && white.background === '', JSON.stringify(white));
  const wobbly = await wander('canvas.paper-sketch');
  check('on the whiteboard the blue line wanders: the sketch is wobbly, but not wildly so', wobbly.rows > 20 && wobbly.spread > 1.5 && wobbly.spread < 22, JSON.stringify(wobbly));
  check('the real picture did not wobble: the paper canvas is still straight, and is exactly the picture a Save makes on white paper', (await wander('canvas.paper')).spread <= 1 && (await paperData()) === plainPicture);
  // The look (which seed, how much wobble) is chosen by chance each time, and is written on the box for these checks. Choose again until the wobble at the
  // turtle's spot is big enough to see, so that the check has something to find.
  const lookNow = () => chrome.eval(`JSON.parse(document.querySelector('.paper-box').dataset.handLook)`);
  let turtleHand = await turtleAt();
  let look = await lookNow();
  const shiftBy = (t, l) => { const at = handPoint(200, 100, l); const from = spot(t, 200, 100); const to = spot(t, at.x, at.y); return Math.hypot(to.x - from.x, to.y - from.y); };
  for (let tries = 0; tries < 15 && shiftBy(turtleHand, look) < 2; tries += 1) {
    await pick('paper:whiteboard');
    turtleHand = await turtleAt();
    look = await lookNow();
  }
  const atHand = handPoint(200, 100, look);
  const wantHand = spot(turtleHand, atHand.x, atHand.y);
  // Compared with where it sat on white paper (the same spot, measured the same way), it has moved by just what the wobble says there.
  const moved = { x: turtleHand.x - turtleWhite.x, y: turtleHand.y - turtleWhite.y };
  const shouldMove = { x: wantHand.x - wantWhite.x, y: wantHand.y - wantWhite.y };
  check('the turtle sits on the end of the wobbled line, not on the straight one: it moved by the wobble there', Math.hypot(moved.x - shouldMove.x, moved.y - shouldMove.y) < 0.6 && Math.hypot(shouldMove.x, shouldMove.y) >= 2, JSON.stringify([moved, shouldMove, look]));
  const smudged = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-style'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  check('the whiteboard has smudges on it where it was wiped, and they are faint (even the dirtiest look stays well under full strength)', smudged > 100000 && (await chrome.eval(`(() => { const d = document.querySelector('canvas.paper-style').getContext('2d').getImageData(0, 0, 1400, 1120).data; let top = 0; for (let i = 3; i < d.length; i += 4) top = Math.max(top, d[i]); return top; })()`)) < 170, `${smudged} pixels`);
  await chrome.eval(`window.__sketchBefore = document.querySelector('canvas.paper-sketch').toDataURL(); true`);
  await click('#fit');
  await chrome.sleep(400);
  check('Fit repaints the sketch with the view, and the grid is still on', (await chrome.eval(`document.querySelector('canvas.paper-sketch').toDataURL() !== window.__sketchBefore && !document.querySelector('.paper-grid').hidden`)));
  await click('#fit');
  await chrome.sleep(400);
  check('and pressing Fit again goes back to exactly the sketch it was before (the wobble belongs to the place, not to the zoom)', await chrome.eval(`document.querySelector('canvas.paper-sketch').toDataURL() === window.__sketchBefore`));
  await pick('grid:squares'); // no numbers beside the axis to be mistaken for the line
  const gridWobble = await chrome.eval(`(() => { const g = document.querySelector('canvas.paper-grid').getContext('2d'); const xs = []; for (let y = 120; y <= 1000; y += 40) { const d = g.getImageData(660, y, 80, 1).data; let sum = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 60) { sum += i / 4; n += 1; } if (n) xs.push(sum / n); } return { rows: xs.length, spread: Math.max(...xs) - Math.min(...xs) }; })()`);
  check('the grid wanders too, so a grid line and a line drawn along it wander together', gridWobble.rows > 15 && gridWobble.spread > 1.5, JSON.stringify(gridWobble));
  await pick('grid:numbers');
  // Every time a hand drawn paper is chosen it gets a new random look: new wobble, new smudges (and choosing the same one again is a new look too).
  const fingerprint = () => chrome.eval(`(() => { const dig = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (Math.imul(h, 31) + d[i]) | 0; return h; }; return { look: document.querySelector('.paper-box').dataset.handLook, board: dig(document.querySelector('canvas.paper-style')), sketch: dig(document.querySelector('canvas.paper-sketch')) }; })()`);
  const lookA = await fingerprint();
  await pick('paper:chalkboard');
  const chalkLook = await fingerprint();
  await pick('paper:whiteboard');
  const lookB = await fingerprint();
  await pick('paper:whiteboard');
  const lookC = await fingerprint();
  const looks = [lookA, lookB, lookC].map((f) => JSON.parse(f.look));
  check('each time a whiteboard is chosen the wobble and the smudges are new: switching away and back, and choosing it again, each give a different look', new Set([lookA, chalkLook, lookB, lookC].map((f) => JSON.parse(f.look).seed)).size === 4
    && lookA.board !== lookB.board && lookB.board !== lookC.board && lookA.sketch !== lookB.sketch && lookB.sketch !== lookC.sketch, JSON.stringify([lookA, lookB, lookC]));
  check('and the looks stay within bounds: the wobble between 2 and 5 steps, the dirt between 0.7 and 1.5', looks.every((l) => l.amount >= 2.2 && l.amount <= 4.6 && l.dirt >= 0.7 && l.dirt <= 1.5 && l.swipes >= 0 && l.swipes <= 3), JSON.stringify(looks));
  check('a plain page does not carry a look: it is only written while a hand drawn paper shows', await (async () => { await pick('paper:graph'); const gone = await chrome.eval(`document.querySelector('.paper-box').dataset.handLook === undefined`); await pick('paper:whiteboard'); return gone; })());
  await pick('paper:graph');
  check('graph paper prints faint squares over the paper (blended in), and does not touch the grid or turn it off',
    await chrome.eval(`(() => { const box = document.querySelector('.paper-box'); const style = document.querySelector('canvas.paper-style'); return box.classList.contains('paper-graph') && !style.hidden && getComputedStyle(style).mixBlendMode === 'multiply' && getComputedStyle(document.querySelector('canvas.paper')).filter === 'none' && !document.querySelector('.paper-grid').hidden; })()`));
  const graphInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-style'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  check('the graph paper has plenty of lines on it', graphInk > 30000, `${graphInk} pixels`);
  await pick('paper:chalkboard');
  const board = await stylePixel(10, 10);
  check('a chalkboard is dark green: the drawing is shown light on dark, and a layer gives the board its color', await chrome.eval(`(() => { const box = document.querySelector('.paper-box'); const style = document.querySelector('canvas.paper-style'); return box.classList.contains('paper-chalkboard') && !style.hidden && getComputedStyle(style).mixBlendMode === 'lighten' && /invert/.test(getComputedStyle(document.querySelector('canvas.paper-sketch')).filter); })()`)
    && board[0] === 0x2f && board[1] === 0x4a && board[2] === 0x3b && board[3] === 255, JSON.stringify(board));
  const axisOnBoard = await gridPixel(700, 100);
  const chalk = await chrome.eval(`(() => { const box = document.querySelector('.paper-box'); const sketch = document.querySelector('canvas.paper-sketch'); return { classes: box.className, hidden: sketch.hidden, mask: getComputedStyle(sketch).maskImage || getComputedStyle(sketch).webkitMaskImage, background: box.style.backgroundColor, paperSeen: getComputedStyle(document.querySelector('canvas.paper')).visibility }; })()`);
  check('a chalkboard is hand drawn in chalk: a sketch with a grain mask (a picture the page made itself) that lets the board show through, over a board colored box', /paper-hand/.test(chalk.classes) && !chalk.hidden
    && /^url\("data:image\/png;base64,/.test(chalk.mask) && chalk.background === 'rgb(47, 74, 59)' && chalk.paperSeen === 'hidden', JSON.stringify({ ...chalk, mask: String(chalk.mask).slice(0, 40) }));
  const chalkWobble = await wander('canvas.paper-sketch');
  check('and the chalk line wanders like the marker one', chalkWobble.rows > 20 && chalkWobble.spread > 1.5 && chalkWobble.spread < 22, JSON.stringify(chalkWobble));
  check('on a dark paper the grid changes to light lines so that it shows', axisOnBoard[3] > 0 && axisOnBoard[0] > 200, JSON.stringify(axisOnBoard));
  check('the paper is only a look: the picture a Save would make is exactly the same as on white paper', (await paperData()) === plainPicture);
  await pick('paper:blueprint');
  const blue = await stylePixel(10, 10);
  const blueInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-style'); const g = c.getContext('2d'); let n = 0; const d = g.getImageData(0, 0, c.width, 200).data; for (let i = 0; i < d.length; i += 4) if (d[i] > 40) n++; return n; })()`);
  check('a blueprint is blue paper with pale lines printed on it', blue[2] === 0x9c && blue[0] === 0x1c && blueInk > 500, `${JSON.stringify(blue)} with ${blueInk} pale pixels`);
  await pick('paper:white');
  check('choosing White puts the plain paper back: no sketch, nothing drawn over it, the paper seen again, the box white', await chrome.eval(`document.querySelector('.paper-box').classList.contains('paper-white') && !document.querySelector('.paper-box').classList.contains('paper-hand') && document.querySelector('canvas.paper-style').hidden && document.querySelector('canvas.paper-sketch').hidden && getComputedStyle(document.querySelector('canvas.paper')).filter === 'none' && getComputedStyle(document.querySelector('canvas.paper')).visibility === 'visible' && document.querySelector('.paper-box').style.backgroundColor === ''`));
  check('the grid stayed on all the while, and the menu marks Squares with numbers and White', await chrome.eval(`!document.querySelector('.paper-grid').hidden`) && (await (async () => { await rightClick('#grid'); const m = await menuState(); await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); return m.checked.join(); })()) === 'grid:numbers,paper:white');
  await pick('grid:off');
  check('No grid hides the grid again', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));
  // The paper and the grid are only for looking at: the PDF is still written, and a page that is opened again starts plain.
  await pick('paper:chalkboard');
  await pick('grid:polar');
  // The file name only has the minute in it, so a second PDF in the same minute replaces the first: look for a newer file, not for another one.
  const newestPdf = () => Math.max(0, ...readdirSync(downloads).filter((f) => f.endsWith('.pdf')).map((f) => statSync(join(downloads, f)).mtimeMs));
  const pdfsNow = newestPdf();
  await click('#save-pdf');
  let pdfMade = false;
  for (let i = 0; i < 60 && !pdfMade; i += 1) {
    await chrome.sleep(250);
    pdfMade = newestPdf() > pdfsNow;
  }
  check('with a chalkboard and circles on the screen, the PDF button still writes its PDF (it always uses white paper and the squares)', pdfMade);
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  await chrome.sleep(400);
  check('a page opened again starts with no grid and white paper: the choices are not kept', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.querySelector('.paper-box').classList.contains('paper-white') && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));
  check('and nothing was stored for them: the autosave is still the only item', (await chrome.eval(`Object.keys(localStorage).join()`)) === 'turtlelab-project' && (await chrome.eval(`sessionStorage.length`)) === 0);
  await chrome.goto(BASE + '?speed=instant&grid=polar&paper=blueprint');
  await chrome.sleep(500);
  const [shortcutRing] = await ink([toward(15, 100)]);
  check('?grid=polar&paper=blueprint opens with that grid showing on that paper', shortcutRing && (await chrome.eval(`document.querySelector('.paper-box').classList.contains('paper-blueprint') && document.getElementById('grid').getAttribute('aria-pressed') === 'true'`)));

  // A plain press from a state chosen in the menu: always on to the squares with numbers, on the next paper; and at the last paper, blank.
  await click('#grid');
  await chrome.sleep(250);
  check('from circles and angles on a blueprint (the last paper) a press puts the blank screen back', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.querySelector('.paper-box').classList.contains('paper-white') && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));
  await chrome.goto(BASE + '?speed=instant&grid=dots&paper=graph');
  await chrome.sleep(500);
  await click('#grid');
  await chrome.sleep(250);
  await rightClick('#grid');
  const afterPress = await menuState();
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);
  check('from dots on graph paper a press goes to the next paper, chalkboard, and to the squares with x and y numbers', afterPress.checked.join() === 'grid:numbers,paper:chalkboard', JSON.stringify(afterPress));
  await chrome.goto(BASE + '?speed=instant&paper=chalkboard');
  await chrome.sleep(500);
  await click('#grid');
  await chrome.sleep(250);
  check('with the grid off on a chalkboard (chosen from the menu), a press turns the grid on without changing the paper', await chrome.eval(`document.querySelector('.paper-grid').hidden === false && document.querySelector('.paper-box').classList.contains('paper-chalkboard')`));

  // ---- Full screen ---------------------------------------------------------------------------------
  await openWith([{ x: 20, y: 20, blocks: [b('start'), b('forward', 50)] }]);
  const fullState = () => chrome.eval(`({ on: Boolean(document.fullscreenElement), pressed: document.getElementById('fullscreen').getAttribute('aria-pressed'), icon: document.querySelector('#fullscreen img').getAttribute('src'), hidden: document.getElementById('fullscreen').hidden })`);
  const before = await fullState();
  check('the Full screen button is on the toolbar, visible, and starts as "not full screen"', !before.hidden && !before.on && before.pressed === 'false' && /\/fullscreen-button\.svg$|^images\/fullscreen-button\.svg$/.test(before.icon), JSON.stringify(before));
  await click('#fullscreen');
  await chrome.sleep(700);
  const during = await fullState();
  check('pressing it makes the page full screen, and the icon and pressed state follow', during.on && during.pressed === 'true' && /exit-fullscreen-button\.svg$/.test(during.icon), JSON.stringify(during));
  check('the app is still there and still lays out in full screen (toolbar and paper both visible)', await chrome.eval(`(() => { const t = document.querySelector('.toolbar').getBoundingClientRect(); const p = document.querySelector('.paper-box').getBoundingClientRect(); return t.width > 300 && t.height > 20 && p.width > 100 && p.height > 100 && p.bottom <= innerHeight + 1; })()`));
  await click('#fullscreen');
  await chrome.sleep(700);
  const after = await fullState();
  check('pressing it again leaves full screen and puts the icon back', !after.on && after.pressed === 'false' && /^images\/fullscreen-button\.svg$/.test(after.icon), JSON.stringify(after));
  // The browser can end full screen by itself (Esc, or its own button): the icon must notice.
  await click('#fullscreen');
  await chrome.sleep(700);
  await chrome.eval(`document.exitFullscreen()`);
  await chrome.sleep(700);
  const escaped = await fullState();
  check('when the browser leaves full screen on its own (like the Esc key), the button is put right', !escaped.on && escaped.pressed === 'false' && /^images\/fullscreen-button\.svg$/.test(escaped.icon), JSON.stringify(escaped));

  // ---- Nothing new is stored ----------------------------------------------------------------------
  await chrome.sleep(600);
  check('none of this stores anything new: the only item is still the autosave',
    (await chrome.eval(`Object.keys(localStorage).join()`)) === 'turtlelab-project' && (await chrome.eval(`sessionStorage.length`)) === 0);
  check('no console errors or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
  check('a PDF was really written (so the PDF button ran)', saved !== null && existsSync(join(downloads, saved)));
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
