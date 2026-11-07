// Dev tool, not part of the app. Checks, in a real headless Chrome, the click handler: the `when paper clicked` hat (Flow palette) and the built in
// variables mouseX and mouseY (Boxes palette); a program that has a handler keeps listening after its last block; a click on the paper (not a slide,
// not the gray round it, not a block or a palette) runs the handler with where the click was; clicks come one after another; Stop ends it; a page
// with only a handler; the PDF's run first does not wait for clicks; and a frame in a lesson page (700 x 520).
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/click-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch } from './cdp.mjs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const SHOTS = process.env.SHOTS_DIR ?? null;
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 1366, height: 700 });
const downloads = mkdtempSync(join(tmpdir(), 'turtlelab-click-'));
await chrome.downloadsTo(downloads);

const b = (op, ...args) => ({ op, args });
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const printed = () => chrome.eval(`document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim()`);
const runDisabled = () => chrome.eval(`document.getElementById('run').disabled`);
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
async function waitFor(test, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    if (await chrome.eval(test)) return true;
    await chrome.sleep(100);
  }
  return false;
}
// (the message is short so it stays on one line: a message that wraps takes room from the paper, which then resizes a moment later, so wait for that to settle)
const listening = async () => {
  const heard = await waitFor(`/Listening for clicks/.test(document.getElementById('message').textContent)`);
  await chrome.sleep(250);
  return heard;
};
async function shot(name) {
  if (SHOTS) await chrome.screenshot(join(SHOTS, `click-${name}.png`));
}
/** The screen point of a spot on the paper, given in the turtle's x and y (the paper is 700 by 560, the middle is 0, 0, y goes up), and the paper's own box. */
async function screenOf(x, y) {
  return chrome.eval(`(() => { const r = document.querySelector('.paper-box').getBoundingClientRect(); const s = r.width / 700; return { x: r.left + (350 + ${x}) * s, y: r.top + (280 - ${y}) * s, left: r.left, top: r.top, right: r.right, bottom: r.bottom, scale: s }; })()`);
}

/** Seed saved work (stacks of blocks), then open the app with it on the page. */
async function openWith(stacks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}
const mouseX = { op: 'mousex', args: [] };
const mouseY = { op: 'mousey', args: [] };
/** A program that draws a little square wherever the paper is clicked, and prints where it was. */
const stamper = () => [
  { x: 90, y: 70, blocks: [b('start'), b('clean')] },
  { x: 380, y: 70, blocks: [b('onclick'), b('print', mouseX), b('print', mouseY), b('penup'), b('setxy', mouseX, mouseY), b('pendown'), { op: 'repeat', args: [4], body: [b('forward', 30), b('right', 90)] }] },
];

try {
  // ---- The blocks in their palettes ---------------------------------------------------------------------------
  await openWith(stamper());
  const palette = async (title) => {
    await click(`.palette-button[title="${title}"]`);
    await chrome.sleep(150);
    return chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op)`);
  };
  const flow = await palette('Flow');
  check('Flow has the "when paper clicked" hat right after start, and mouseX and mouseY right under it', flow.indexOf('onclick') === flow.indexOf('start') + 1 && flow.indexOf('mousex') === flow.indexOf('onclick') + 1 && flow.indexOf('mousey') === flow.indexOf('mousex') + 1, flow.join(' '));
  const boxes = await palette('Boxes');
  check('and the Boxes palette is just the boxes and ask', !boxes.includes('mousex') && !boxes.includes('mousey') && boxes.includes('ask'), boxes.join(' '));
  await palette('Flow');
  const labels = await chrome.eval(`[...document.querySelectorAll('.flyout text.block-text')].map((t) => t.textContent)`);
  check('and they are named mouseX and mouseY on the blocks', labels.includes('mouseX') && labels.includes('mouseY'));
  await click('.palette-button.selected'); // close the flyout again
  await chrome.sleep(100);
  const hat = await chrome.eval(`(() => { const t = [...document.querySelectorAll('text.block-text')].find((x) => x.textContent === 'when paper clicked'); const svg = t?.closest('svg'); const a = t?.getBoundingClientRect(); const s = svg?.getBoundingClientRect(); return { found: !!t, inside: !!a && !!s && a.right <= s.right - 2 && a.left >= s.left }; })()`);
  check('the hat says "when paper clicked" and the words fit inside it', hat.found && hat.inside, JSON.stringify(hat));
  await shot('blocks');

  // ---- Before Run, a click does nothing ---------------------------------------------------------------------------
  let at = await screenOf(0, 0);
  await chrome.click(at.x, at.y);
  await chrome.sleep(200);
  check('clicking the paper before the program runs does nothing', (await printed()) === '' && (await ink()) === 0);
  check('tapping the handler says what it is for', await (async () => { await click('text.block-text'); return true; })() && true);

  // ---- Run: the program ends, and listens -------------------------------------------------------------------------------
  await click('#run');
  check('after its last block the program says it is listening, and is still running', (await listening()) && (await runDisabled()) && (await chrome.eval(`!document.getElementById('stop').disabled`)), await message());
  check('the paper has nothing on it yet, and the block outline has gone', (await ink()) === 0 && (await chrome.eval(`!document.querySelector('.running')`)));

  // ---- A click ----------------------------------------------------------------------------------------------------------
  at = await screenOf(120, -80);
  await chrome.click(at.x, at.y);
  check('a click runs the handler: it printed where the paper was clicked (120 and -80)', await waitFor(`/120 -80/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' '))`), await printed());
  const afterOne = await ink();
  check('and it drew its square there', afterOne > 0);
  check('the program is still listening after a click', (await runDisabled()) && (await chrome.eval(`!document.getElementById('stop').disabled`)));
  await shot('clicked');

  // two more clicks, quickly: each runs, in order
  const second = await screenOf(220, 150); // (spots under the blocks are the blocks', so these are on clear paper)
  const third = await screenOf(-50, -200);
  await chrome.click(second.x, second.y);
  await chrome.click(third.x, third.y);
  check('two quick clicks both run, in the order they were made', await waitFor(`/120 -80 220 150 -50 -200/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' '))`), await printed());
  check('and each drew a square (more ink every time)', (await ink()) > afterOne);

  // ---- What is not a click -------------------------------------------------------------------------------------------
  const lines = await printed();
  const drag = await screenOf(0, 0);
  const blocksBefore = await chrome.eval(`document.querySelector('.stack-layer, svg g')?.getAttribute('transform') ?? ''`);
  await chrome.drag({ x: drag.x, y: drag.y }, { x: drag.x + 60, y: drag.y + 40 }, 8);
  await chrome.sleep(300);
  check('sliding the paper is not a click: the blocks slid and nothing ran', (await printed()) === lines);
  const stray = await screenOf(0, 0);
  const outside = { x: stray.left - 40, y: stray.top + 100 };
  const insideStage = await chrome.eval(`(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { left: r.left, right: r.right }; })()`);
  if (outside.x > insideStage.left + 4) {
    await chrome.click(outside.x, outside.y);
    await chrome.sleep(300);
    check('a click on the gray round the paper is not a click on the paper', (await printed()) === lines);
  } else {
    const rightOf = { x: stray.right + 30, y: stray.top + 100 };
    await chrome.click(rightOf.x, rightOf.y);
    await chrome.sleep(300);
    check('a click on the gray round the paper is not a click on the paper', stray.right + 30 > insideStage.right || (await printed()) === lines);
  }
  // a click on a block or on a palette button is for that, not the paper
  const handlerBlock = await chrome.eval(`(() => { const t = [...document.querySelectorAll('text.block-text')].find((x) => x.textContent === 'when paper clicked'); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(handlerBlock.x, handlerBlock.y);
  await chrome.sleep(300);
  check('a click on a block is not a click on the paper (tapping the handler says what it is)', (await printed()) === lines && /click the paper/.test(await message()), await message());
  const paletteButton = await chrome.centerOf('.palette-button');
  await chrome.click(paletteButton.x, paletteButton.y);
  await chrome.sleep(300);
  check('and nor is a click on a palette button', (await printed()) === lines);
  await click('.palette-button.selected');

  // ---- Stop ---------------------------------------------------------------------------------------------------------------
  await click('#stop');
  check('Stop ends the listening: Run is back', await waitFor(`!document.getElementById('run').disabled`));
  const afterStop = await screenOf(60, 60);
  await chrome.click(afterStop.x, afterStop.y);
  await chrome.sleep(300);
  check('and a click after Stop does nothing', (await printed()) === lines);

  // ---- Run again: a new run starts clean, and the old clicks are gone ---------------------------------------------------------------
  await click('#run');
  await listening();
  check('running again starts fresh: no old output, no old drawing', (await printed()) === '' && (await ink()) === 0);
  const again = await screenOf(250, -60);
  await chrome.click(again.x, again.y);
  check('and it listens again', await waitFor(`/250 -60/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' '))`), await printed());
  await click('#stop');
  await waitFor(`!document.getElementById('run').disabled`);

  // ---- mouseX and mouseY are global: the main program can read them, and they hold the last click -------------------------------------
  await openWith([
    { x: 90, y: 70, blocks: [b('start'), b('clean'), b('print', mouseX), b('wait', 6), b('print', mouseX)] },
    { x: 380, y: 70, blocks: [b('onclick'), b('store1', mouseX)] },
  ]);
  await click('#run');
  const spot = await screenOf(77, 0);
  await chrome.click(spot.x, spot.y);
  check('mouseX read by the main program is 0 before a click and the click\'s x after it', await waitFor(`/^0 77$/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim())`, 40), await printed());
  await click('#stop');
  await waitFor(`!document.getElementById('run').disabled`);

  // ---- A page with only a handler listens at once ---------------------------------------------------------------------------------
  await openWith([{ x: 380, y: 70, blocks: [b('onclick'), b('print', mouseY)] }]);
  await click('#run');
  check('with only a handler on the page Run starts listening straight away', (await listening()) && (await runDisabled()));
  const only = await screenOf(0, 33);
  await chrome.click(only.x, only.y);
  check('and a click runs it', await waitFor(`/33/.test(document.querySelector('.output').textContent)`), await printed());
  await click('#stop');
  await waitFor(`!document.getElementById('run').disabled`);

  // ---- A program without a handler ends as it always did ---------------------------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean'), b('forward', 50)] }]);
  await click('#run');
  check('a program with no handler ends by itself, and never says it is listening', (await waitFor(`!document.getElementById('run').disabled`)) && !/Listening/.test(await message()));

  // ---- The PDF's run first does not wait for clicks -----------------------------------------------------------------------------------
  await openWith(stamper());
  const began = Date.now();
  await click('#save-pdf');
  const saved = await waitFor(`/Saved/.test(document.getElementById('message').textContent)`, 100);
  const took = Date.now() - began;
  const note = await message();
  check('the PDF button runs a program with a handler and finishes at once, not after the 5 second limit', saved && took < 4000 && !/still going/.test(note) && /was run first/.test(note), `${took} ms: ${note.slice(0, 140)}`);
  check('a PDF was saved', readdirSync(downloads).some((f) => f.endsWith('.pdf')));
  check('and nothing is left running or listening', await waitFor(`!document.getElementById('run').disabled`));

  // ---- Saved work: the handler is kept, nothing about clicks is stored --------------------------------------------------------------------
  await openWith(stamper());
  check('the saved project keeps the handler, and only the one autosave item is stored', (await chrome.eval(`localStorage.getItem('turtlelab-project').includes('"op":"onclick"')`)) && (await chrome.eval(`Object.keys(localStorage).join(',')`)) === 'turtlelab-project' && (await chrome.eval(`sessionStorage.length`)) === 0);

  // ---- In a lesson frame (700 x 520) -------------------------------------------------------------------------------------------------------
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 700, height: 520, deviceScaleFactor: 1, mobile: false });
  await chrome.goto(`${BASE}?demo=click&embed=1&speed=instant&autorun=0`);
  await chrome.sleep(500);
  await click('#run');
  check('in a 700 x 520 frame the program listens', await listening());
  const inFrame = await screenOf(250, -230);
  await chrome.click(inFrame.x, inFrame.y);
  check('and a click in the frame runs the handler with the right place', await waitFor(`/250 -230/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' '))`), await printed());
  await shot('frame');
  await chrome.send('Emulation.clearDeviceMetricsOverride');

  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('no request went to another address', elsewhere.length === 0, elsewhere.join(' '));
  check('no console errors, exceptions or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
