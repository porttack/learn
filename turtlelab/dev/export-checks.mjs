// Dev tool, not part of the app. Checks, in a real headless Chrome, the ways to save: right-clicking
// Save, and every file it can make (PNG, JPEG, SVG, the embroidery files, Python, the project).
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/export-checks.mjs
// Set EMBROIDERY_PYTHON to a Python that has pyembroidery installed to have it read the embroidery files too
// (see test/embroidery-oracle.py).
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readProjectFile } from '../js/core/project-file.js';
import { dstDecode } from '../js/core/embroidery.js';
import { EXPORTS } from '../js/ui/files.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 1366, height: 700 });
const downloads = mkdtempSync(join(tmpdir(), 'turtlelab-exports-'));
await chrome.downloadsTo(downloads);

const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const menuOpen = () => chrome.eval(`(() => { const m = document.querySelector('.export-menu'); return !!m && !m.hidden; })()`);
const filesWith = (extension) => readdirSync(downloads).filter((f) => f.endsWith(`.${extension}`));
const b = (op, ...args) => ({ op, args });

/** Right-click a button the way a person would. */
async function rightClick(selector) {
  const at = await chrome.centerOf(selector);
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y, button: 'none', buttons: 0 });
  await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'right', buttons: 2, clickCount: 1 });
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'right', buttons: 0, clickCount: 1 });
  await chrome.sleep(250);
}

async function waitForFile(extension, count = 1) {
  for (let i = 0; i < 60; i += 1) {
    if (filesWith(extension).length >= count) return filesWith(extension).sort().at(count - 1);
    await chrome.sleep(100);
  }
  return null;
}

/** Choose a way to save from the menu. */
async function saveVia(format) {
  await rightClick('#save');
  await click(`.export-item[data-format="${format}"]`);
  await chrome.sleep(400);
}

async function openWith(stacks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}
async function run() {
  await click('#run');
  await chrome.sleep(400);
  for (let i = 0; i < 100 && !(await chrome.eval(`!document.getElementById('run').disabled`)); i += 1) await chrome.sleep(150);
  await chrome.sleep(200);
}

// A circle and a star in two colors: the kind of thing that goes on a badge.
const badge = [{ x: 140, y: 60, blocks: [
  b('start'), b('clean'), b('setpensize', 3), b('setcolor', 10, 85, 163), b('penup'), b('setxy', 0, 100), b('setheading', 90), b('pendown'), b('arc', 360, 100),
  b('penup'), b('setxy', 0, 79), b('setheading', 162), b('pendown'), b('setcolor', 237, 23, 31), { op: 'repeat', args: [5], body: [b('forward', 150), b('right', 144)] },
] }];

const oraclePython = process.env.EMBROIDERY_PYTHON;
const askOracle = (request) => {
  if (!oraclePython) return null;
  const answer = spawnSync(oraclePython, ['-I', new URL('../test/embroidery-oracle.py', import.meta.url).pathname], { input: JSON.stringify(request), encoding: 'utf8' });
  return answer.status === 0 ? JSON.parse(answer.stdout) : null;
};

try {
  await openWith(badge);
  await run();
  const requestsBefore = chrome.requestLog.length;

  // ---- The menu -------------------------------------------------------------------------------------
  check('before anything, the menu is closed', !(await menuOpen()));
  await rightClick('#save');
  check('right-clicking Save opens the list of ways to save', await menuOpen());
  const listed = await chrome.eval(`[...document.querySelectorAll('.export-item')].map((r) => r.dataset.format)`);
  check('it lists every way to save, in order', JSON.stringify(listed) === JSON.stringify(EXPORTS.map((e) => e.id)), listed.join());
  check('each line says what it is and gives a hint, and a keyboard can reach them',
    await chrome.eval(`[...document.querySelectorAll('.export-item')].every((r) => r.querySelector('.export-label').textContent.length > 5 && r.querySelector('.export-hint').textContent.length > 10 && r.getAttribute('role') === 'menuitem') && document.activeElement.classList.contains('export-item')`));
  const where = await chrome.eval(`(() => { const r = document.querySelector('.export-menu').getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight }; })()`);
  check('the menu is on the screen', where.left >= 0 && where.top >= 0 && where.right <= where.w && where.bottom <= where.h, JSON.stringify(where));
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);
  check('Escape closes it', !(await menuOpen()));
  await rightClick('#save');
  await chrome.click(900, 400);
  await chrome.sleep(150);
  check('so does clicking anywhere else', !(await menuOpen()));

  // A plain click still saves the picture with the blocks inside, with no menu.
  await click('#save');
  const firstPng = await waitForFile('png');
  check('an ordinary click on Save still saves the PNG with the blocks, straight away, with no menu', firstPng !== null && !(await menuOpen()) && /^Saved turtlelab-.*\.png\. To get your blocks back/.test(await message()), await message());
  check('and that PNG has the blocks inside it', readProjectFile(new Uint8Array(readFileSync(join(downloads, firstPng)))).ok);
  const pngCount = filesWith('png').length;

  // Press and hold opens the menu without also saving.
  const at = await chrome.centerOf('#save');
  await chrome.eval(`document.getElementById('message').textContent = ''`);
  await chrome.mouse('mouseMoved', at.x, at.y, { buttons: 0 });
  await chrome.mouse('mousePressed', at.x, at.y);
  await chrome.sleep(700);
  await chrome.mouse('mouseReleased', at.x, at.y);
  await chrome.sleep(1200); // a save, if one wrongly happened, shows its message by now
  check('pressing and holding Save opens the menu, and does not also save a picture', (await menuOpen()) && filesWith('png').length === pngCount && (await message()) === '', await message());
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await chrome.sleep(150);

  // ---- The files ------------------------------------------------------------------------------------
  await saveVia('png-plain');
  const names = filesWith('png').sort();
  const plainName = names.find((f) => f !== firstPng) ?? names.at(-1);
  const plainBytes = new Uint8Array(readFileSync(join(downloads, plainName)));
  check('PNG picture only: a real PNG with no blocks inside', plainBytes[1] === 0x50 && !readProjectFile(plainBytes).ok && /the drawing only/.test(await message()), await message());

  await saveVia('jpeg');
  const jpg = await waitForFile('jpg');
  const jpgBytes = jpg ? readFileSync(join(downloads, jpg)) : Buffer.alloc(0);
  check('JPEG: a real JPEG of the whole paper', jpgBytes[0] === 0xff && jpgBytes[1] === 0xd8 && jpgBytes.length > 5000 && /JPEG/.test(await message()), `${jpgBytes.length} bytes`);

  await saveVia('svg');
  const svgs = () => filesWith('svg').sort();
  await waitForFile('svg');
  const svgText = readFileSync(join(downloads, svgs()[0]), 'utf8');
  const drawsAsPicture = await chrome.eval(`(async () => {
    const image = new Image();
    image.src = 'data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}';
    await image.decode();
    return image.naturalWidth > 100 && image.naturalHeight > 100;
  })()`);
  check('SVG picture: valid, opens as a picture, holds the circle and the star in their colors',
    drawsAsPicture && svgText.includes('<svg') && svgText.includes('rgb(10, 85, 163)') && svgText.includes('rgb(237, 23, 31)') && / A 100 100 /.test(svgText), `${svgText.length} bytes`);

  await saveVia('svg-cut');
  await waitForFile('svg', 2);
  const cutText = readFileSync(join(downloads, svgs().at(-1)), 'utf8');
  check('SVG for a cutter: hairlines, in inches, one color', cutText.includes('stroke="#ff0000"') && /width="[\d.]+in"/.test(cutText) && !cutText.includes('rgb('), cutText.slice(0, 120).replace(/\n/g, ' '));

  await saveVia('pes');
  const pes = await waitForFile('pes');
  const pesBytes = pes ? readFileSync(join(downloads, pes)) : Buffer.alloc(0);
  const pesNote = await message();
  check('PES: a Brother file (#PES0001), and the message says the stitches, size, threads and their Brother colors',
    pesBytes.subarray(0, 8).toString('latin1') === '#PES0001' && /\d+ stitches, 90 by 90 mm, 2 threads, so 1 thread change\. Thread order: Blue and Red\./.test(pesNote), pesNote);

  await saveVia('dst');
  const dst = await waitForFile('dst');
  const dstBytes = dst ? readFileSync(join(downloads, dst)) : Buffer.alloc(0);
  let stitches = 0;
  let colorChanges = 0;
  for (let i = 512; i + 2 < dstBytes.length; i += 3) {
    const kind = dstDecode([dstBytes[i], dstBytes[i + 1], dstBytes[i + 2]]).kind;
    if (kind === 'stitch') stitches += 1;
    if (kind === 'color') colorChanges += 1;
  }
  check('DST: a Tajima file with a real header, the stitches, one color change, and the end record',
    dstBytes.subarray(0, 3).toString('latin1') === 'LA:' && stitches > 100 && colorChanges === 1 && dstBytes[dstBytes.length - 1] === 0xf3, `${stitches} stitches`);

  const oracle = askOracle({ mode: 'read', dst: dstBytes.toString('base64'), pes: pesBytes.toString('base64') });
  if (oracle) {
    check('an independent program (pyembroidery) reads both embroidery files and finds the same stitches in each',
      oracle.dst.stitches.filter((s) => s.cmd === 'stitch').length > 100
      && JSON.stringify(oracle.dst.stitches.filter((s) => s.cmd === 'stitch').map((s) => [Math.round(s.x), Math.round(s.y)]).filter((_, i, a) => i === a.findIndex((q) => q[0] === _[0] && q[1] === _[1])).sort())
        === JSON.stringify(oracle.pes.stitches.filter((s) => s.cmd === 'stitch').map((s) => [Math.round(s.x), Math.round(s.y)]).filter((_, i, a) => i === a.findIndex((q) => q[0] === _[0] && q[1] === _[1])).sort()));
  } else {
    console.log('SKIP  pyembroidery reading the embroidery files (set EMBROIDERY_PYTHON to run this)');
  }

  // The SVG picture has to LOOK the same as the screen. Paint the same drawing both ways, over the paper, and compare.
  for (const demo of ['flower', 'star', 'arcs', 'circlefn', 'squarefn']) {
    const different = await chrome.eval(`(async () => {
      const { Turtle } = await import('./js/core/turtle.js');
      const { runBlocks, createContext } = await import('./js/core/interpreter.js');
      const { DEMOS } = await import('./js/ui/demos.js');
      const { validateProject, findRunStack, FORMAT_ID, FORMAT_VERSION } = await import('./js/core/project.js');
      const { definitionsOf } = await import('./js/core/definitions.js');
      const { paintOp } = await import('./js/ui/canvas-view.js');
      const { opsToSvg } = await import('./js/core/svg-export.js');
      const demo = DEMOS[${JSON.stringify(demo)}];
      const stacks = Array.isArray(demo) ? [{ x: 0, y: 0, blocks: demo }] : demo.stacks;
      const { project } = validateProject({ app: FORMAT_ID, version: FORMAT_VERSION, stacks: structuredClone(stacks) });
      const turtle = new Turtle();
      const { map } = definitionsOf(project);
      const { stack } = findRunStack(project);
      [...runBlocks(stack.blocks, createContext({ turtle, definitions: map, print() {}, random: () => 0.5 }))];
      const reference = document.createElement('canvas');
      reference.width = 1400; reference.height = 1120;
      const refContext = reference.getContext('2d', { willReadFrequently: true });
      for (const op of turtle.ops) paintOp(refContext, op);
      const made = opsToSvg(turtle.ops, { box: { minX: -350, minY: -280, maxX: 350, maxY: 280 } });
      const image = new Image();
      image.src = 'data:image/svg+xml;base64,' + btoa(made.svg);
      await image.decode();
      const drawn = document.createElement('canvas');
      drawn.width = 1400; drawn.height = 1120;
      const drawnContext = drawn.getContext('2d', { willReadFrequently: true });
      drawnContext.fillStyle = '#fff';
      drawnContext.fillRect(0, 0, 1400, 1120);
      drawnContext.drawImage(image, 0, 0, 1400, 1120);
      const a = refContext.getImageData(0, 0, 1400, 1120).data;
      const b = drawnContext.getImageData(0, 0, 1400, 1120).data;
      let ink = 0; let off = 0;
      for (let i = 0; i < a.length; i += 4) {
        const isInk = a[i] !== a[0] || a[i + 1] !== a[1] || a[i + 2] !== a[2];
        if (isInk) ink += 1;
        if (Math.abs(a[i] - b[i]) > 70 || Math.abs(a[i + 1] - b[i + 1]) > 70 || Math.abs(a[i + 2] - b[i + 2]) > 70) off += 1;
      }
      return { ink, off, share: off / Math.max(1, ink) };
    })()`);
    check(`the SVG of the ${demo} example, laid over the paper, matches what the screen paints`, different.ink > 2000 && different.share < 0.04, `${different.off} of ${different.ink} marked pixels differ`);
  }

  await saveVia('python');
  const py = await waitForFile('py');
  const pyText = py ? readFileSync(join(downloads, py), 'utf8') : '';
  check('Python: the blocks as a program', pyText.includes('from turtle import *') && pyText.includes('for _ in range(5):'), pyText.slice(0, 50));

  await saveVia('json');
  const json = await waitForFile('json');
  const jsonBytes = json ? new Uint8Array(readFileSync(join(downloads, json))) : new Uint8Array();
  const reread = readProjectFile(jsonBytes);
  check('Project file: the blocks as text that Open can read back', reread.ok && reread.project.stacks.length === 1 && reread.project.stacks[0].blocks.length === badge[0].blocks.length);

  // Everything so far was saved without a single request (loading the next page below, of course, is one).
  const sentWhileSaving = chrome.requestLog.slice(requestsBefore).filter((r) => /^https?:/.test(r.url));

  // ---- When there is nothing to save ---------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  const requestsAfterLoad = chrome.requestLog.length;
  // Count only finished files. A download still arriving from an earlier step, or one of Chrome's own temporary names
  // (which come and go), would otherwise be counted as a save made now: that made this check flaky.
  const finished = () => readdirSync(downloads).filter((f) => /^turtlelab-.*\.[a-z]+$/.test(f) && !f.endsWith('.crdownload'));
  let settled = 0;
  for (let i = 0; i < 40 && settled < 4; i += 1) {
    const listing = finished().join('|');
    await chrome.sleep(150);
    settled = finished().join('|') === listing ? settled + 1 : 0;
  }
  const before = finished().length;
  for (const format of ['svg', 'svg-cut', 'pes', 'dst']) {
    await saveVia(format);
    const now = finished();
    check(`${format} with nothing drawn says so, kindly, and saves nothing`, /There are no lines to save yet\. Press Run first/.test(await message()) && now.length === before, `${await message()} (${now.length} files, was ${before}; newest: ${now.slice(-2).join(', ')})`);
  }
  await saveVia('png-plain');
  check('a picture of blank paper is still fine', /Saved turtlelab-.*\.png/.test(await message()));

  // ---- Nothing leaves the page ----------------------------------------------------------------------------
  const sent = [...sentWhileSaving, ...chrome.requestLog.slice(requestsAfterLoad).filter((r) => /^https?:/.test(r.url))];
  check('saving any of these used no network at all', sent.length === 0, sent.map((r) => r.url).join(' | '));
  check('no sockets were opened', chrome.webSockets === 0);
  check('no console errors or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
  await chrome.sleep(600);
  check('and the only thing stored is still the autosave', (await chrome.eval(`Object.keys(localStorage).join()`)) === '' || (await chrome.eval(`Object.keys(localStorage).join()`)) === 'turtlelab-project');
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
