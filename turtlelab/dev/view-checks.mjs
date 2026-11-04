// Dev tool, not part of the app. Checks, in a real headless Chrome, the buttons that change what
// you see: Fit (zoom the drawing and the blocks so everything is in view), the grid of x and y
// numbers, and that the PDF button fits first.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/view-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';
import { mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
  check('the grid button turns the grid on (and says so, and its tooltip changes)',
    await chrome.eval(`document.querySelector('.paper-grid').hidden === false && document.getElementById('grid').getAttribute('aria-pressed') === 'true' && /Hide/.test(document.getElementById('grid').title)`));
  const gridInk = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper-grid'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  check('it draws lines and numbers', gridInk > 20000, `${gridInk} pixels`);
  check('the grid is never on the paper itself, so a saved picture or a PDF never has it', (await paperData()) === noGrid);

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
  await click('#grid');
  await chrome.sleep(200);
  check('the grid button turns it off again', await chrome.eval(`document.querySelector('.paper-grid').hidden === true && document.getElementById('grid').getAttribute('aria-pressed') === 'false'`));

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
