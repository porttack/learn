// Dev tool, not part of the app. Checks, in a real headless Chrome, what tapping a block in the palette does: a block that moves the turtle shows
// a grey preview that fades while the turtle goes there and comes back, and changes nothing (not the picture, not the turtle, not the stacks);
// other blocks only say what they do; a reporter still shows its value; a program that is running is left alone.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/peek-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};
const chrome = await launch({ width: 1366, height: 700 });
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
const peekInk = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper-peek'); if (c.hidden) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) n += 1; return n; })()`);
const sprite = () => chrome.eval(`document.querySelector('.turtle-sprite').style.transform`);
// (the paper can settle a pixel or so when the message line changes, so "the same place" means within 2 pixels and the same heading)
const near = (a, b) => {
  const nums = (t) => (t.match(/-?[\d.]+/g) ?? []).map(Number);
  const [p, q] = [nums(a), nums(b)];
  return p.length === q.length && p.every((n, i) => Math.abs(n - q[i]) <= 2);
};
const stackCount = () => chrome.eval(`document.querySelectorAll('.workspace .stack').length`);
const tapBlock = async (palette, label) => {
  // (pressing the button of the palette that is open closes it, so open it only if it is not the one showing)
  if (!(await chrome.eval(`document.querySelector('.palette-button.selected')?.title === ${JSON.stringify(palette)}`))) await click(`.palette-button[title="${palette}"]`);
  await chrome.sleep(250);
  const at = await chrome.eval(`(() => { const t = [...document.querySelectorAll('.flyout text.block-text')].find((x) => x.textContent === ${JSON.stringify(label)}); const r = t.getBoundingClientRect(); return { x: r.left + 6, y: r.top + r.height / 2 }; })()`);
  await chrome.click(at.x, at.y);
};

try {
  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(600);
  const before = { ink: await ink(), at: await sprite(), stacks: await stackCount() };

  await tapBlock('Turtle', 'forward');
  await chrome.sleep(150);
  const during = await sprite();
  check('tapping forward shows a grey preview', (await peekInk()) > 100, `peek pixels ${await peekInk()}`);
  check('the turtle goes to the far end while it shows', !near(during, before.at), `${before.at} -> ${during}`);
  check('the picture has no ink in it', (await ink()) === before.ink);
  check('and it says it is only a preview', /preview/i.test(await message()), await message());
  await chrome.sleep(2200);
  check('afterwards the turtle is back where it was', near(await sprite(), before.at), await sprite());
  check('and the preview has gone', (await peekInk()) === -1);
  check('no stack was added and the picture is still empty', (await stackCount()) === before.stacks && (await ink()) === before.ink);

  await tapBlock('Turtle', 'left');
  await chrome.sleep(150);
  check('a turn shows no line but the turtle turns, then comes back', (await peekInk()) === -1 && !near(await sprite(), before.at), `peek ${await peekInk()}, ${await sprite()}, ${await message()}`);
  await chrome.sleep(2200);
  check('and it is back', near(await sprite(), before.at));

  await tapBlock('Pen', 'pen up');
  await chrome.sleep(150);
  check('a pen block does nothing but explain itself', /drag/i.test(await message()) && near(await sprite(), before.at) && (await peekInk()) === -1, await message());
  check('and the pen is still down', await chrome.eval(`!document.querySelector('.turtle-sprite').classList.contains('pen-up')`));

  await tapBlock('Math', 'random');
  check('a reporter still shows its answer', /Answer/.test(await message()), await message());
} finally {
  await chrome.close();
}
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
