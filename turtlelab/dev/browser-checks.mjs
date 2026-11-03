// Dev tool, not part of the app. Checks the app in a real headless Chrome.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/browser-checks.mjs
// Set TURTLE_URL to test another address, SHOTS_DIR to keep screenshots
// somewhere other than the system temp folder.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
//
// Checks grow with the milestones. So far: milestone a (turtle drag,
// Run/Stop, no freeze under a flat-out loop, no console or CSP errors).
import { launch } from './cdp.mjs';
import { tmpdir } from 'node:os';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const SHOTS = (process.env.SHOTS_DIR ?? tmpdir()) + '/';

const results = [];
const check =(name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch();
try {
  // 1. Arcs: positive curves right, negative curves left.
  await chrome.goto(BASE + '?demo=arcs&speed=instant&autorun=1');
  await chrome.sleep(500);
  await chrome.screenshot(SHOTS + 'arcs.png');

  // 2. Dragging the turtle.
  await chrome.goto(BASE + '?demo=forever&speed=instant');
  let before = await chrome.centerOf('.turtle-sprite');
  await chrome.drag({ x: before.x, y: before.y + 4 }, { x: before.x + 120, y: before.y + 64 });
  let after = await chrome.centerOf('.turtle-sprite');
  check('dragging the shell moves the turtle', Math.abs(after.x - before.x - 120) <= 2 && Math.abs(after.y - before.y - 60) <= 2,
    `moved ${Math.round(after.x - before.x)},${Math.round(after.y - before.y)}`);

  const size = after.w; // sprite box (unrotated) is square
  await chrome.drag({ x: after.x, y: after.y - 0.32 * size }, { x: after.x + 90, y: after.y });
  const transform = await chrome.eval(`document.querySelector('.turtle-sprite').style.transform`);
  check('dragging the head turns the turtle to point right', /rotate\(90deg\)/.test(transform), transform);

  const stayed = await chrome.centerOf('.turtle-sprite');
  check('turning does not move the turtle', Math.abs(stayed.x - after.x) < 1 && Math.abs(stayed.y - after.y) < 1);

  // 3. Run forever at full speed: page must stay responsive; Stop must work.
  // Send a pointerdown straight to the sprite and report whether a drag started.
  // (setPointerCapture is stubbed because a made-up pointer id can't be captured.)
  const tryDrag = `(() => {
    const el = document.querySelector('.turtle-sprite');
    el.setPointerCapture = () => {};
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse',
      button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    const started = el.classList.contains('dragging');
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'mouse' }));
    return started;
  })()`;
  check('control: the same probe does start a drag when nothing is running', (await chrome.eval(tryDrag)) === true);
  const runBtn = await chrome.centerOf('#run');
  const stopBtn = await chrome.centerOf('#stop');
  await chrome.click(runBtn.x, runBtn.y);
  await chrome.sleep(1200);
  const state = await chrome.eval(`({ run: document.getElementById('run').disabled, stop: document.getElementById('stop').disabled })`, 3000)
    .catch((e) => ({ frozen: e.message }));
  check('page stays responsive while a forever-style loop runs flat out', !state.frozen, state.frozen ?? '');
  check('Run is disabled and Stop enabled while running', state.run === true && state.stop === false);

  // The running program moves the turtle itself, so compare no positions.
  check('the turtle cannot be dragged while a program runs', (await chrome.eval(tryDrag)) === false);

  const paintedBefore = await chrome.eval(`(() => { const c = document.querySelector('canvas'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.reduce((n, v, i) => n + (i % 4 === 0 && v < 255 ? 1 : 0), 0); })()`);
  await chrome.click(stopBtn.x, stopBtn.y);
  await chrome.sleep(300);
  const after2 = await chrome.eval(`({ run: document.getElementById('run').disabled, stop: document.getElementById('stop').disabled })`, 3000);
  check('Stop halts the program and re-enables Run', after2.run === false && after2.stop === true);
  const p1 = await chrome.eval(`document.querySelector('.turtle-sprite').style.transform`);
  await chrome.sleep(500);
  const p2 = await chrome.eval(`document.querySelector('.turtle-sprite').style.transform`);
  check('the turtle stays put after Stop', p1 === p2);
  await chrome.screenshot(SHOTS + 'forever.png');

  // 4. Slow speed really is slow, and Stop works in the middle of a wait.
  await chrome.goto(BASE + '?demo=square&speed=slow&autorun=1');
  await chrome.sleep(1700);
  const lines = await chrome.eval(`(() => { const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0) n++; return n; })()`);
  const stopBtn2 = await chrome.centerOf('#stop');
  const mid = await chrome.eval(`document.getElementById('stop').disabled`);
  check('at slow speed the square is still being drawn after 1.7 s', mid === false && lines > 0 && lines < 20000, `red px ${lines}`);
  await chrome.click(stopBtn2.x, stopBtn2.y);
  await chrome.sleep(100);
  check('Stop works mid-wait', (await chrome.eval(`document.getElementById('stop').disabled`)) === true);

  check('no console errors, exceptions or CSP violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}
console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
