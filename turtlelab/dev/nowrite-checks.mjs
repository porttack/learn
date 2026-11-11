// Dev tool, not part of the app. Checks, in a real headless Chrome, the ?nowrite=1 address: the write block (and set font, set curve) is not in the
// Notes palette, a program that has one (opened from a file, say) will not run and the block is outlined, and the plain address still has write.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/nowrite-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};
const chrome = await launch({ width: 1366, height: 700 });
const b = (op, ...args) => ({ op, args });
const notesBlocks = async () => {
  await chrome.eval(`document.querySelector('.palette-button[title="Notes"]').click()`);
  await chrome.sleep(250);
  return chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op)`);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
async function openWith(stacks, query) {
  await chrome.goto(BASE + 'about.html');
  const project = { app: 'porttack-turtle', version: 1, stacks };
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify(project))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(600);
}
const writer = () => [{ x: 90, y: 70, blocks: [b('start'), b('clean'), { op: 'write', args: [60], text: 'AB' }, b('forward', 50)] }];

try {
  await openWith(writer(), '?nowrite=1&speed=instant');
  const locked = await notesBlocks();
  check('with ?nowrite=1 the Notes palette has no write, set font or set curve', !locked.some((op) => ['write', 'setfont', 'setcurve'].includes(op)), locked.join(','));
  check('but it still has the sticky note', locked.includes('note'));
  await chrome.eval(`document.getElementById('run').click()`);
  await chrome.sleep(500);
  check('a program with a write block does not run, and says why', (await ink()) === 0 && /write block is turned off/.test(await message()), await message());
  check('and the write block is outlined', await chrome.eval(`document.querySelectorAll('.error').length > 0`));

  // the Logo box can type write too
  await chrome.eval(`document.querySelector('#logo-toggle, .logo-button, [title="Logo"]')?.click()`);
  await chrome.sleep(300);
  const logoRun = await chrome.eval(`(() => { const box = document.querySelector('.logo-box textarea, textarea.logo-text, .logo-box textarea'); const run = [...document.querySelectorAll('button')].find((x) => /run logo/i.test(x.textContent)); if (!box || !run) return false; box.value = 'write |AB| 60'; box.dispatchEvent(new Event('input', { bubbles: true })); run.click(); return true; })()`);
  await chrome.sleep(500);
  const logoSays = await chrome.eval(`document.querySelector('.logo-box')?.textContent ?? ''`);
  check('the Logo box cannot run write either, and says so itself', logoRun && (await ink()) === 0 && /write word is turned off/.test(logoSays), `${logoRun} ${logoSays.slice(-120)}`);

  await openWith(writer(), '?speed=instant');
  const open = await notesBlocks();
  check('the plain address still has write, set font and set curve', ['write', 'setfont', 'setcurve'].every((op) => open.includes(op)), open.join(','));
  await chrome.eval(`document.getElementById('run').click()`);
  await chrome.sleep(1500);
  check('and the same program runs', (await ink()) > 0);
} finally {
  await chrome.close();
}
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
