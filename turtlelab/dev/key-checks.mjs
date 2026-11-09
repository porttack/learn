// Dev tool, not part of the app. Checks, in a real headless Chrome, the key handler and the timer: the `when [key] pressed` hat and the `every` hat
// (Flow palette); the key list on the hat; a program that has one keeps listening after its last block; a key press runs the handler for that key (and
// nothing else, not with Ctrl held, not while typing in the Logo box, and a space does not press a button that has focus); the timer goes off again and
// again from the moment the last block has run, until Stop; a bad time is a plain mistake; the message says what the program is listening for; and the
// snake in a lesson frame (700 x 520), steered with the arrow keys.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/key-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
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
// (a headless page that has never had focus turns "hidden" on its first key press, which stops animation frames and slows timers: keep it focused)
await chrome.send('Emulation.setFocusEmulationEnabled', { enabled: true });
await chrome.send('Page.bringToFront');

const b = (op, ...args) => ({ op, args });
const box1 = { op: 'box1', args: [] };
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const printed = () => chrome.eval(`document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim()`);
const running = () => chrome.eval(`document.getElementById('run').disabled`);
async function waitFor(test, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    if (await chrome.eval(test)) return true;
    await chrome.sleep(100);
  }
  return false;
}
async function shot(name) {
  if (SHOTS) await chrome.screenshot(join(SHOTS, `key-${name}.png`));
}
/** Seed saved work (stacks of blocks), then open the app with it on the page. */
async function openWith(stacks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}
const key = (id, ...blocks) => ({ x: 380, y: 70, blocks: [{ op: 'onkey', args: [], key: id }, ...blocks] });
const timer = (tenths, ...blocks) => ({ x: 380, y: 260, blocks: [{ op: 'onstep', args: [tenths] }, ...blocks] });
const counter = [b('store1', b('add', box1, 1)), b('print', box1)];
const heard = () => waitFor(`/Listening|Repeating/.test(document.getElementById('message').textContent)`);
const spriteAngle = () => chrome.eval(`Number(/rotate\\((-?[\\d.]+)deg\\)/.exec(document.querySelector('.turtle-sprite').style.transform)?.[1])`);

try {
  // ---- The blocks in their palette ---------------------------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean')] }]);
  await click('.palette-button[title="Flow"]');
  await chrome.sleep(150);
  const flow = await chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op)`);
  check('Flow has the key hat and the every hat right after mouseX and mouseY', flow.indexOf('onkey') === flow.indexOf('mousey') + 1 && flow.indexOf('onstep') === flow.indexOf('onkey') + 1, flow.join(' '));
  const labels = await chrome.eval(`[...document.querySelectorAll('.flyout text.block-text')].map((t) => t.textContent)`);
  check('they read "when [up arrow] key pressed" and "every tenths [5]"', labels.includes('when') && labels.includes('up arrow') && labels.includes('key pressed') && labels.some((t) => /^every\s*tenths$/.test(t)), labels.filter((t) => /when|arrow|pressed|every|tenths/.test(t)).join(' | '));
  await click('.palette-button.selected');
  await chrome.sleep(100);

  // ---- The key list on the hat ---------------------------------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean')] }, key('up', ...counter)]);
  const hatBox = await chrome.eval(`(() => { const t = [...document.querySelectorAll('.workspace text.block-text, svg text.block-text')].find((x) => x.textContent === 'up arrow'); const svg = t?.closest('svg'); const a = t?.getBoundingClientRect(); const s = svg?.getBoundingClientRect(); return { found: !!t, inside: !!a && !!s && a.right <= s.right - 2 && a.left >= s.left, width: s?.width }; })()`);
  check('the hat on the page shows its key, and the words fit inside it', hatBox.found && hatBox.inside, JSON.stringify(hatBox));
  const openKeyList = async () => {
    const at = await chrome.eval(`(() => { const t = [...document.querySelectorAll('svg text.block-text')].find((x) => /arrow|space|enter|^[a-z0-9]$/.test(x.textContent) && x.closest('svg').querySelector('path') && x.textContent !== 'key pressed'); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await chrome.click(at.x, at.y);
    await chrome.sleep(200);
  };
  await openKeyList();
  const menu = await chrome.eval(`(() => { const m = document.querySelector('.key-menu'); if (!m) return null; const o = [...m.querySelectorAll('.key-option')]; return { count: o.length, first: o.slice(0, 6).map((x) => x.textContent), selected: o.filter((x) => x.getAttribute('aria-selected') === 'true').map((x) => x.dataset.key), focused: document.activeElement?.dataset?.key, inside: (() => { const r = m.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })() }; })()`);
  check('tapping the key box opens a list of 42 keys, the named ones first, with the block\'s key picked', !!menu && menu.count === 42 && menu.first.join(',') === 'up arrow,down arrow,left arrow,right arrow,space,enter' && menu.selected.join() === 'up' && menu.focused === 'up', JSON.stringify(menu));
  check('and the list is inside the window', !!menu?.inside);
  await shot('key-list');
  await chrome.press('ArrowRight');
  const moved = await chrome.eval(`document.activeElement?.dataset?.key`);
  check('the arrow keys move through the list', moved === 'down', String(moved));
  await chrome.press('Escape');
  check('Escape closes it and changes nothing', (await chrome.eval(`!document.querySelector('.key-menu')`)) && (await chrome.eval(`[...document.querySelectorAll('svg text.block-text')].some((x) => x.textContent === 'up arrow')`)));
  await openKeyList();
  await click('.key-option[data-key="left"]');
  await chrome.sleep(200);
  check('choosing a key changes the block, and the list goes away', (await chrome.eval(`!document.querySelector('.key-menu')`)) && (await chrome.eval(`[...document.querySelectorAll('svg text.block-text')].some((x) => x.textContent === 'left arrow')`)));
  await chrome.sleep(1500); // (the autosave waits a moment)
  const saved = await chrome.eval(`JSON.stringify(JSON.parse(localStorage.getItem('turtlelab-project')).stacks.flatMap((s) => s.blocks).filter((x) => x.op === 'onkey').map((x) => x.key))`);
  check('the choice is kept in the block (and so in the saved work)', saved === '["left"]', saved);
  await chrome.press('z', { modifiers: 2 });
  await chrome.sleep(200);
  check('and Ctrl+Z undoes it', await chrome.eval(`[...document.querySelectorAll('svg text.block-text')].some((x) => x.textContent === 'up arrow')`));

  // ---- A program with a key handler listens ----------------------------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean'), b('store1', 0)] }, key('up', ...counter), key('a', b('print', 100))]);
  await click('#run');
  check('after its last block the program says it is listening for keys, and is still running', (await heard()) && (await running()) && /Listening for keys/.test(await message()), await message());
  await chrome.press('ArrowUp');
  await chrome.press('ArrowUp');
  await chrome.press('ArrowUp');
  check('each press of the key runs its handler (1 2 3)', await waitFor(`document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim() === '1 2 3'`), await printed());
  check('and the yellow strip shows box1 as it changes, even at the instant speed', await waitFor(`/box1\\s+3\\b/.test(document.querySelector('.boxes-readout').textContent)`), await chrome.eval(`document.querySelector('.boxes-readout').textContent`));
  await chrome.press('a');
  await chrome.press('b'); // a key with no handler
  await chrome.press('ArrowDown');
  await chrome.press('ArrowUp', { modifiers: 2 }); // Ctrl held: not a key press
  await chrome.sleep(300);
  check('another key runs its own handler, and keys with none (or with Ctrl held) do nothing', (await printed()) === '1 2 3 100', await printed());
  await chrome.press('A', { modifiers: 8 });
  await chrome.sleep(250);
  check('a capital letter is the same key', (await printed()) === '1 2 3 100 100', await printed());
  const ringed = await chrome.eval(`!!document.querySelector('.click-ring')`);
  const at = await chrome.eval(`(() => { const r = document.querySelector('.paper-box').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(at.x, at.y);
  await chrome.sleep(120);
  check('a click on the paper is not heard by a program that only listens for keys (no ring, nothing printed)', !ringed && (await chrome.eval(`!document.querySelector('.click-ring')`)) && (await printed()) === '1 2 3 100 100', await printed());
  // a held key repeats, like typing
  await chrome.press('ArrowUp', { repeat: true });
  await chrome.press('ArrowUp', { repeat: true });
  check('a key held down repeats the handler', await waitFor(`/ 4 5$/.test(document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim())`), await printed());
  // a button that has focus is not pressed by a space (the handler for space runs instead)
  await chrome.eval(`document.getElementById('stop').focus()`);
  await chrome.press('ArrowUp');
  await chrome.sleep(250);
  check('the program is still running (the handler key did not press anything that has focus)', await running());
  await click('#stop');
  check('Stop ends it', await waitFor(`!document.getElementById('run').disabled`));
  const lines = (await printed()).split(' ').length;
  await chrome.press('ArrowUp');
  await chrome.sleep(300);
  check('and after Stop a key does nothing', (await printed()).split(' ').length === lines);

  // ---- A space or enter handler, and typing in a box is not a key press ------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean')] }, key('space', b('print', 7)), key('enter', b('print', 8))]);
  await click('#run');
  await heard();
  await chrome.eval(`document.getElementById('stop').focus()`);
  await chrome.press(' ');
  await chrome.press('Enter');
  check('space and enter run their handlers, and a focused Stop button is not pressed by them', (await waitFor(`document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim() === '7 8'`)) && (await running()), await printed());
  await click('#logo-toggle');
  await chrome.sleep(200);
  await chrome.eval(`document.querySelector('#logo-box textarea').focus()`);
  await chrome.press(' ');
  await chrome.press('Enter');
  await chrome.sleep(300);
  check('typing in the Logo box is typing, not a key press', (await printed()) === '7 8', await printed());
  await click('#stop');
  await chrome.eval(`document.getElementById('logo-toggle').click()`);

  // ---- Timers ----------------------------------------------------------------------------------------------------------------
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean'), b('store1', 0)] }, timer(2, ...counter)]);
  await click('#run');
  check('a program with an every block says it is repeating, and is still running', (await heard()) && (await running()) && /Repeating on a timer/.test(await message()), await message());
  await chrome.sleep(1300);
  const ticks = (await printed()).split(' ').filter(Boolean).length;
  check('it goes off again and again by itself (every 0.2 seconds: about 6 times in 1.3 seconds)', ticks >= 4 && ticks <= 8, `${ticks} ticks: ${await printed()}`);
  await click('#stop');
  await chrome.sleep(100);
  const atStop = (await printed()).split(' ').filter(Boolean).length;
  await chrome.sleep(700);
  check('Stop stops the timer', (await printed()).split(' ').filter(Boolean).length === atStop);
  await click('#run');
  await heard();
  await chrome.sleep(500);
  check('Run again starts it again from the beginning (box1 starts at 0 again)', /^1 2/.test(await printed()), await printed());
  await click('#stop');

  // the timer starts when the last block has run, not before
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean'), b('store1', 0), b('print', 0), b('wait', 15)] }, timer(2, ...counter)], '?speed=fast');
  await click('#run');
  await chrome.sleep(900);
  check('the timer waits until the last block has run: one second in, only the start has printed', (await printed()) === '0', await printed());
  check('then it starts', await waitFor(`document.querySelector('.output').textContent.replace(/\\s+/g, ' ').trim().split(' ').length >= 3`, 40), await printed());
  await click('#stop');

  // the time can come from a box
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean'), b('store1', 3)] }, { x: 380, y: 70, blocks: [{ op: 'onstep', args: [box1] }, b('print', 1)] }]);
  await click('#run');
  await heard();
  await chrome.sleep(1000);
  const slow = (await printed()).split(' ').filter(Boolean).length;
  check('the time can be a box: box1 = 3 is 0.3 seconds, about 3 in a second', slow >= 2 && slow <= 4, String(slow));
  await click('#stop');

  // a time that is too fast, or an empty one, is a plain mistake
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean')] }, timer(0.1, b('print', 1))]);
  await click('#run');
  check('a time that is too fast stops the program with a plain message, and outlines the hat', (await waitFor(`/too fast/.test(document.getElementById('message').textContent)`)) && (await chrome.eval(`!document.getElementById('run').disabled`)), await message());
  await openWith([{ x: 90, y: 70, blocks: [b('start'), b('clean')] }, { x: 380, y: 70, blocks: [{ op: 'onstep', args: [null] }, b('print', 1)] }]);
  await click('#run');
  check('an empty time says so', await waitFor(`/empty box/.test(document.getElementById('message').textContent)`), await message());

  // ---- Everything at once, and a page with only a handler ------------------------------------------------------------------------
  await openWith([
    { x: 90, y: 70, blocks: [b('start'), b('clean')] },
    { x: 380, y: 70, blocks: [b('onclick'), b('print', 1)] },
    key('up', b('print', 2)),
  ]);
  await click('#run');
  check('with clicks and keys the message says both', (await heard()) && /Listening for clicks and keys/.test(await message()), await message());
  await click('#stop');
  await openWith([key('right', b('right', 90))]);
  await click('#run');
  check('a page with only a key handler runs and listens at once, with the turtle facing up first', (await heard()) && /Listening for keys/.test(await message()), await message());
  const before = await spriteAngle();
  await chrome.press('ArrowRight');
  await chrome.sleep(500);
  const after = await spriteAngle();
  check('and the key turns the turtle a quarter', Math.abs((((after - before) % 360) + 360) % 360 - 90) < 1, `${before} then ${after}`);
  await click('#stop');
  // tapping a hat says what it is for
  await click('svg text.block-text');
  await chrome.sleep(150);

  // ---- The snake, in a lesson frame (700 x 520) ---------------------------------------------------------------------
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 700, height: 520, deviceScaleFactor: 1, mobile: false });
  await chrome.goto(`${BASE}?sample=lesson-snake&embed=1`);
  await chrome.sleep(1200);
  check('in the frame the snake is listening for keys, with its blocks hidden and the paper clear', (await heard()) && /Listening for keys/.test(await message()) && (await chrome.eval(`getComputedStyle(document.querySelector('.workspace') ?? document.body).display !== undefined`)), await message());
  const start = await spriteAngle();
  check('it starts facing right (90) and walking', Math.abs(start - 90) < 1, String(start));
  const x0 = await chrome.eval(`document.querySelector('.turtle-sprite').getBoundingClientRect().left`);
  await chrome.sleep(900);
  const x1 = await chrome.eval(`document.querySelector('.turtle-sprite').getBoundingClientRect().left`);
  check('it walks by itself, to the right', x1 > x0 + 30, `${x0} to ${x1}`);
  await chrome.press('ArrowDown');
  await chrome.sleep(500);
  check('the down arrow turns it to face down (180)', Math.abs((await spriteAngle()) - 180) < 1, String(await spriteAngle()));
  const y0 = await chrome.eval(`document.querySelector('.turtle-sprite').getBoundingClientRect().top`);
  await chrome.sleep(700);
  const y1 = await chrome.eval(`document.querySelector('.turtle-sprite').getBoundingClientRect().top`);
  check('and it walks down', y1 > y0 + 20, `${y0} to ${y1}`);
  await chrome.press('ArrowLeft');
  await chrome.sleep(400);
  check('the left arrow faces it left (270)', Math.abs((await spriteAngle()) - 270) < 1, String(await spriteAngle()));
  await chrome.press('ArrowUp');
  await chrome.sleep(400);
  check('and the up arrow faces it up (0)', Math.abs(((await spriteAngle()) + 360) % 360) < 1 || Math.abs((await spriteAngle()) - 360) < 1, String(await spriteAngle()));
  await shot('snake');
  check('the frame has no blocks showing: the paper is the whole of it', await chrome.eval(`document.querySelectorAll('.workspace svg').length === 0 || getComputedStyle(document.querySelector('.workspace')).display === 'none' || document.body.classList.contains('embedded')`));
  await chrome.send('Emulation.clearDeviceMetricsOverride');
} catch (error) {
  console.log('FAIL  the checks stopped early:', error.message);
  results.push(false);
} finally {
  await chrome.close();
}
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed} of ${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
