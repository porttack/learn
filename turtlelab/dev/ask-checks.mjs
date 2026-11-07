// Dev tool, not part of the app. Checks, in a real headless Chrome, the ask block: the block itself (its question, "into box1", the
// text box on it), the question box that opens when a program reaches it (focus, Enter, Escape, Cancel, Stop, a bad answer), the number
// going into box1 and the drawing following it, a run made for the PDF (nobody to ask: it answers 0 and says so), a frame in a lesson
// page (700 x 520), and nothing stored or requested.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/ask-checks.mjs
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
const downloads = mkdtempSync(join(tmpdir(), 'turtlelab-ask-'));
await chrome.downloadsTo(downloads);

const b = (op, ...args) => ({ op, args });
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const boxOpen = () => chrome.eval(`!!document.querySelector('.ask-box')`);
const runDisabled = () => chrome.eval(`document.getElementById('run').disabled`);
const press = async (key, code, windowsVirtualKeyCode, text) => {
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, text });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
};
const enter = () => press('Enter', 'Enter', 13, '\r');
const escape = () => press('Escape', 'Escape', 27);
/** Type into the question box the way a student would. */
async function type(text) {
  await chrome.eval(`(() => { const i = document.querySelector('.ask-input'); i.focus(); i.select(); })()`);
  await chrome.send('Input.insertText', { text });
}
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
async function waitFor(test, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    if (await chrome.eval(test)) return true;
    await chrome.sleep(100);
  }
  return false;
}
async function shot(name) {
  if (SHOTS) await chrome.screenshot(join(SHOTS, `ask-${name}.png`));
}

/** Seed saved work, then open the app (so a program with an ask block is on the page). */
async function openWith(blocks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks: [{ x: 90, y: 70, blocks }] };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}

/** Ask how many sides, then draw that polygon. */
const polygon = () => [
  b('start'), b('clean'), { op: 'ask', args: [], text: 'How many sides?' },
  { op: 'repeat', args: [{ op: 'box1' }], body: [b('forward', 60), b('right', { op: 'divide', args: [360, { op: 'box1' }] })] },
];

try {
  // ---- The block ------------------------------------------------------------------------------------------------------
  await openWith(polygon());
  const look = await chrome.eval(`(() => {
    const words = [...document.querySelectorAll('text.block-text')].map((t) => t.textContent);
    const end = [...document.querySelectorAll('text.block-text')].find((t) => t.textContent === 'into box1');
    const svg = end?.closest('svg');
    const slot = [...document.querySelectorAll('.nameslot.textslot')].find((s) => /How many sides/.test(s.textContent));
    const e = end?.getBoundingClientRect(); const s = svg?.getBoundingClientRect(); const t = slot?.getBoundingClientRect();
    return { words, hasEnd: !!end, hasSlot: !!slot, endInside: !!e && !!s && e.right <= s.right - 2 && e.left >= s.left, slotBeforeEnd: !!t && !!e && t.right <= e.left + 1, slotText: slot?.textContent };
  })()`);
  check('the block says ask, shows its question in a box, and says "into box1" after it', look.words.includes('ask') && look.hasEnd && look.hasSlot && look.slotText.includes('How many sides?'), JSON.stringify(look));
  check('"into box1" is inside the block and after the question box', look.endInside && look.slotBeforeEnd);
  check('the boxes readout is on the page, since ask writes box1', await chrome.eval(`!!document.querySelector('.boxes-readout') && !document.querySelector('.boxes-readout').hidden`));
  await shot('block');

  // ---- Editing the question ----------------------------------------------------------------------------------------
  const slotAt = await chrome.eval(`(() => { const s = [...document.querySelectorAll('.nameslot.textslot')].find((x) => /How many sides/.test(x.textContent)); const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(slotAt.x, slotAt.y);
  await chrome.sleep(150);
  const editor = await chrome.eval(`(() => { const i = document.querySelector('input.number-input'); return i ? { max: i.maxLength, label: i.getAttribute('aria-label'), value: i.value } : null; })()`);
  check('pressing the question opens a text box that holds 60 letters and is labelled as the question', editor && editor.max === 60 && /question/i.test(editor.label) && editor.value === 'How many sides?', JSON.stringify(editor));
  await chrome.eval(`document.querySelector('input.number-input').select()`);
  await chrome.send('Input.insertText', { text: 'How many sides do you want?' });
  await enter();
  await chrome.sleep(200);
  // (the block shows the first 30 letters of a question and keeps them all: the question box below shows it whole)
  check('the new question is on the block', await chrome.eval(`[...document.querySelectorAll('.nameslot.textslot')].some((s) => /How many sides do you want\\?/.test(s.textContent))`));

  // ---- A run that asks -----------------------------------------------------------------------------------------------
  await click('#run');
  check('Run shows the question box with the block\'s question, and the program waits', await waitFor(`!!document.querySelector('.ask-box')`) && (await chrome.eval(`document.querySelector('.ask-question').textContent`)) === 'How many sides do you want?');
  check('the program is running (Run is off, Stop is on) and the box is waiting', (await runDisabled()) && (await chrome.eval(`!document.getElementById('stop').disabled`)));
  check('the answer box has the keyboard, so typing goes straight into it', await chrome.eval(`document.activeElement === document.querySelector('.ask-input')`));
  const geometry = await chrome.eval(`(() => { const r = document.querySelector('.ask-box').getBoundingClientRect(); const run = document.getElementById('run').getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, runBottom: run.bottom }; })()`);
  check('the box is inside the window and below the toolbar', geometry.left >= 0 && geometry.right <= geometry.w && geometry.bottom <= geometry.h && geometry.top >= geometry.runBottom - 1, JSON.stringify(geometry));
  await shot('asking');
  const before = await ink();

  await type('abc');
  await enter();
  await chrome.sleep(150);
  check('words are not an answer: the box stays and says what to type', (await boxOpen()) && /Type a number/.test(await chrome.eval(`document.querySelector('.ask-problem').textContent`)));
  await type('');
  await enter();
  check('and an empty box is not an answer either', await boxOpen());
  await type('5');
  check('typing again takes the complaint away', (await chrome.eval(`document.querySelector('.ask-problem').textContent`)) === '');
  await enter();
  check('a number closes the box and the program carries on to the end', (await waitFor(`!document.getElementById('run').disabled && !document.querySelector('.ask-box')`)) && !(await boxOpen()));
  const five = await ink();
  check('the number went into box1 (the strip says 5) and the drawing is the five sided shape', (await chrome.eval(`document.querySelector('.boxes-readout').textContent`)).includes('5') && five > before, `ink ${five}`);
  await shot('answered');

  // a different answer draws a different shape
  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  await type('3');
  await enter();
  await waitFor(`!document.getElementById('run').disabled`);
  await chrome.sleep(150);
  const three = await ink();
  check('a different answer draws a different shape (3 sides, not 5)', three > 0 && three !== five, `3 sides ${three}, 5 sides ${five}`);

  // negative and decimal numbers are numbers
  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  await type(' -2.5 ');
  await enter();
  check('a negative decimal with spaces round it is accepted', await waitFor(`!document.getElementById('run').disabled && !document.querySelector('.ask-box')`));
  check('and is what box1 holds', (await chrome.eval(`document.querySelector('.boxes-readout').textContent`)).includes('-2.5'), await chrome.eval(`document.querySelector('.boxes-readout').textContent`));

  // ---- Giving up and Stop -----------------------------------------------------------------------------------------
  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  await click('.ask-cancel');
  check('Cancel stops the program and takes the box away', (await waitFor(`!document.getElementById('run').disabled`)) && !(await boxOpen()));

  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  await escape();
  check('Escape does the same', (await waitFor(`!document.getElementById('run').disabled`)) && !(await boxOpen()));

  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  await click('#stop');
  check('the Stop button takes the question away and stops the program', (await waitFor(`!document.getElementById('run').disabled`)) && !(await boxOpen()));
  check('after all that Run still works (a fresh question)', await (async () => { await click('#run'); const open = await waitFor(`!!document.querySelector('.ask-box')`); await type('4'); await enter(); return open && (await waitFor(`!document.getElementById('run').disabled`)); })());

  // typing in the box is not the workspace's keys: Ctrl+Z in the box does not undo the blocks
  await click('#run');
  await waitFor(`!!document.querySelector('.ask-box')`);
  const stacksBefore = await chrome.eval(`document.querySelectorAll('.nameslot.textslot').length`);
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, modifiers: 2 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, modifiers: 2 });
  await chrome.sleep(150);
  check('Ctrl+Z while the box is open does not undo the blocks', (await chrome.eval(`document.querySelectorAll('.nameslot.textslot').length`)) === stacksBefore && (await boxOpen()));
  await click('#stop');
  await waitFor(`!document.getElementById('run').disabled`);

  // ---- A run for the PDF has nobody to ask ---------------------------------------------------------------------------
  await openWith(polygon());
  await click('#save-pdf');
  check('the PDF button does not open a question box: the run it makes answers 0', await (async () => { let opened = false; for (let i = 0; i < 40; i += 1) { if (await boxOpen()) opened = true; if (/Saved/.test(await message())) break; await chrome.sleep(100); } return !opened; })());
  const note = await message();
  check('and the message says it asked and used 0', /Your program asks a question, so this run used 0 as the answer\./.test(note) && /Saved/.test(note), note.slice(0, 160));
  check('a PDF was saved', readdirSync(downloads).some((f) => f.endsWith('.pdf')), readdirSync(downloads).join(', '));
  check('a program that does not ask gets no such sentence', await (async () => { await openWith([b('start'), b('clean'), b('forward', 50)]); await click('#save-pdf'); await waitFor(`/Saved/.test(document.getElementById('message').textContent)`, 80); return !/asks a question/.test(await message()); })());

  // ---- Saved work: the question is kept, the answer is not ----------------------------------------------------------------
  await openWith(polygon());
  const saved = await chrome.eval(`localStorage.getItem('turtlelab-project')`);
  check('the saved project keeps the question', saved.includes('How many sides?'));
  check('and the only thing stored is the one autosave item', (await chrome.eval(`Object.keys(localStorage).join(',')`)) === 'turtlelab-project' && (await chrome.eval(`sessionStorage.length`)) === 0);

  // ---- In a lesson frame (700 x 520) ----------------------------------------------------------------------------------------
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 700, height: 520, deviceScaleFactor: 1, mobile: false });
  await chrome.goto(`${BASE}?demo=ask&embed=1&speed=instant&autorun=0`); // (a frame never reads saved work, so the program is the developer demo)
  await chrome.sleep(500);
  await click('#run');
  check('in a 700 x 520 frame the question box opens, fits, and leaves Run and Stop uncovered', await (async () => {
    const open = await waitFor(`!!document.querySelector('.ask-box')`);
    const r = await chrome.eval(`(() => { const a = document.querySelector('.ask-box').getBoundingClientRect(); const run = document.getElementById('run').getBoundingClientRect(); const stop = document.getElementById('stop').getBoundingClientRect(); const hit = (x) => !(a.right < x.left || a.left > x.right || a.bottom < x.top || a.top > x.bottom); return { inside: a.left >= 0 && a.right <= innerWidth && a.top >= 0 && a.bottom <= innerHeight, covers: hit(run) || hit(stop) }; })()`);
    return open && r.inside && !r.covers;
  })());
  await shot('frame');
  await type('6');
  await enter();
  check('and answering in the frame draws the shape', (await waitFor(`!document.getElementById('run').disabled`)) && (await ink()) > 0);
  await chrome.send('Emulation.clearDeviceMetricsOverride');

  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('no request went to another address (the page asked nothing of anyone)', elsewhere.length === 0, elsewhere.join(' '));
  check('no console errors, exceptions or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
