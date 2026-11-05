// Dev tool, not part of the app. Checks, in a real headless Chrome, the Logo box: it shows the blocks as Logo,
// follows them, can be changed and run (with fd and forward both working), says where a mistake is, and
// keeps the Python box and the blocks out of its way. A short suite: about half a minute.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/logo-checks.mjs
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
const status = () => chrome.eval(`document.querySelector('.logo-status').textContent`);
const isProblem = () => chrome.eval(`document.querySelector('.logo-status').classList.contains('problem')`);
const area = () => chrome.eval(`document.querySelector('.logo-code').value`);
const paper = () => chrome.eval(`document.querySelector('canvas.paper').toDataURL()`);
const logoHidden = () => chrome.eval(`document.getElementById('logo-box').hidden`);
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
async function finish() {
  for (let i = 0; i < 80; i += 1) {
    if (await chrome.eval(`!document.getElementById('run').disabled`)) return;
    await chrome.sleep(100);
  }
}
/** Replace everything in the Logo box with `text`, the way typing would. */
async function typeLogo(text) {
  await chrome.eval(`(() => { const a = document.querySelector('.logo-code'); a.focus(); a.select(); })()`);
  await chrome.send('Input.insertText', { text });
  await chrome.sleep(80);
}
async function runLogo(text) {
  await typeLogo(text);
  await click('.logo-run');
  await finish();
  await chrome.sleep(150);
}

try {
  await chrome.goto(`${BASE}?sample=square&speed=instant`);
  await finish();
  await chrome.sleep(300);
  const blocksPicture = await paper();

  // ---- The button and the box ------------------------------------------------------------------------------
  check('there is a Logo button with its own picture and a tooltip', await chrome.eval(`(() => { const b = document.getElementById('logo-toggle'); return !!b && b.querySelector('img').getAttribute('src') === 'images/logo-button.svg' && /Logo/.test(b.title) && b.getAttribute('aria-pressed') === 'false'; })()`));
  check('the box starts hidden', await logoHidden());
  await click('#logo-toggle');
  await chrome.sleep(150);
  check('the button opens it and says it is pressed', !(await logoHidden()) && (await chrome.eval(`document.getElementById('logo-toggle').getAttribute('aria-pressed')`)) === 'true');
  const first = await area();
  check('it shows the blocks as Logo', /clearscreen/.test(first) && /setpencolor \[0 90 220\]/.test(first) && /repeat 4 \[\n {2}forward 100\n {2}right 90\n\]/.test(first), first.split('\n').slice(0, 3).join(' | '));
  check('the box fits on the screen', await chrome.eval(`(() => { const r = document.getElementById('logo-box').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })()`));

  await click('.logo-short input');
  await chrome.sleep(120);
  check('Short words writes fd and rt', /repeat 4 \[\n {2}fd 100\n {2}rt 90\n\]/.test(await area()) && /^cs$/m.test(await area()));
  await click('.logo-short input');
  await chrome.sleep(120);
  check('and the whole words again', /forward 100/.test(await area()));

  // ---- Running ---------------------------------------------------------------------------------------------
  await click('.logo-run');
  await finish();
  await chrome.sleep(200);
  check('running Logo that was not changed draws exactly what the blocks drew', (await paper()) === blocksPicture);

  await typeLogo((await area()).replace('repeat 4 [', 'repeat 3 [').replace('right 90', 'right 120'));
  check('changing the text shows a Follow my blocks button, says the Logo no longer follows, and shuts the short words box',
    (await chrome.eval(`!document.querySelector('.logo-follow').hidden && document.querySelector('.logo-short input').disabled`)) && /no longer follows your blocks/.test(await status()) && /not saved/.test(await status()));
  await click('.logo-run');
  await finish();
  await chrome.sleep(200);
  const triangle = await paper();
  check('running the changed Logo draws something different', triangle !== blocksPicture && (await ink()) > 500);
  check('and the blocks themselves are not touched', await chrome.eval(`document.querySelector('.workspace').textContent.includes('90') && document.querySelectorAll('.workspace .stack').length === 2`));

  // fd and forward, written by hand
  await runLogo('cs\nrepeat 5 [fd 80 rt 144]');
  const star = await paper();
  await runLogo('CLEARSCREEN\nREPEAT 5 [FORWARD 80 RIGHT 144]');
  check('fd and rt draw the same as forward and right, whatever the capitals', star === (await paper()) && star !== triangle);
  check('and there was no complaint', !(await isProblem()));
  await runLogo('cs\nmake "size 30\nrepeat 4 [fd :size rt 90 make "size :size + 10]\nprint :size');
  check('variables, print and the output box work', (await chrome.eval(`document.querySelector('.output').textContent`)) === '70');
  await runLogo('to tri :s\n  repeat 3 [fd :s rt 120]\nend\ncs\ntri 50\ntri 100');
  check('a block of your own, defined and called in Logo, draws', (await ink()) > 500 && !(await isProblem()));

  // ---- Mistakes ----------------------------------------------------------------------------------------------
  await runLogo('forward 100\nrigth 90\nforward 50');
  check('a mistake says the line and what to do, in the box and in the message bar',
    (await status()) === 'Line 2: I do not know how to rigth. Did you mean right?' && (await message()) === (await status()) && (await isProblem()));
  check('and the line with the mistake is selected', (await chrome.eval(`(() => { const a = document.querySelector('.logo-code'); return a.value.slice(a.selectionStart, a.selectionEnd); })()`)) === 'rigth 90');
  await runLogo('forward 10\nprint 1 / 0');
  check('a mistake while it runs names its line too', (await status()) === 'Line 2: You cannot divide by zero.' && (await isProblem()));
  await runLogo('');
  check('an empty box says there is nothing to run', /nothing to run/.test(await status()) && (await isProblem()));
  await runLogo('repeat 4 [fd 10');
  check('a missing bracket is found', /Line 1: I could not find the \] that closes the \[ on line 1/.test(await status()));
  await runLogo('forever [ fd 1 ]');
  await chrome.sleep(300);
  check('a forever loop in Logo can be stopped with Stop', await chrome.eval(`document.getElementById('run').disabled`));
  await click('#stop');
  await chrome.sleep(200);
  check('and Stop works', await chrome.eval(`!document.getElementById('run').disabled`));

  // ---- Open in real Logo --------------------------------------------------------------------------------------
  // The button opens a new tab. Here the page is told to remember the address instead of opening it, so it can be read.
  await chrome.eval(`window.__opened = []; window.open = (url) => { window.__opened.push(String(url)); return {}; }`);
  const opened = () => chrome.eval(`window.__opened.slice()`);
  const decoded = async () => {
    const urls = await opened();
    const url = urls.at(-1) ?? '';
    return { url, count: urls.length, code: url.includes('#') ? decodeURIComponent(url.slice(url.indexOf('#') + 1).replace(/_/g, ' ')) : '' };
  };
  check('the box has an Open in real Logo button, with a tooltip that says what it does',
    await chrome.eval(`(() => { const b = document.querySelector('.logo-real'); return !!b && b.textContent === 'Open in real Logo' && /JSLogo/.test(b.title) && /translated/.test(b.title); })()`));
  await click('.logo-follow');
  await chrome.sleep(120);
  await click('.logo-real');
  await chrome.sleep(150);
  let sent = await decoded();
  check('pressing it opens JSLogo, from this site, with the program in the address after the #', sent.count === 1 && /^http:\/\/127\.0\.0\.1:\d+\/logo\/#/.test(sent.url), sent.url.slice(0, 60));
  check('what is sent is the blocks written for JSLogo: the screen set up like TurtleLab, a CSS color, and the loop',
    /^window\nclearscreen\npendown\nsetpensize 5\nsetpencolor "#ff0000\nsetpencolor "#005adc\nsetpensize 6\nrepeat 4 \[\n {2}forward 100\n {2}right 90\n\]\n$/.test(sent.code), JSON.stringify(sent.code.slice(0, 90)));
  check('and it says it did, and that nothing leaves the site', /Opened real Logo \(JSLogo\) in a new tab/.test(await message()) && /Nothing leaves this site/.test(await message()));
  check('the address has no spaces and no underscores in it (JSLogo reads underscores as spaces)', !/[ _]/.test(sent.url.slice(sent.url.indexOf('#'))));

  await typeLogo('cs\nto spiral :n\n  repeat 3 [ arc 90 :n rt 30 ]\nend\nmake "size 40\nspiral :size\nprint :size % 7');
  await click('.logo-real');
  await chrome.sleep(150);
  sent = await decoded();
  check('if the Logo was typed in, it is the typed Logo that goes, translated', sent.count === 2 && /^to tlarc :angle :radius\n/.test(sent.code) && /^to tlmod :a :b$/m.test(sent.code) && /^to spiral :n$/m.test(sent.code) && /^ +tlarc 90 :n$/m.test(sent.code) && /^make "size 0$/m.test(sent.code) && /^make "size 40$/m.test(sent.code) && /\(tlmod :size 7\)/.test(sent.code) && !/box1/.test(sent.code), JSON.stringify(sent.code.slice(0, 60)));
  await typeLogo('forward 10\nrigth 5');
  await click('.logo-real');
  await chrome.sleep(150);
  check('a mistake in typed Logo is not sent: it is shown, with its line, and nothing opens', (await decoded()).count === 2 && /^Line 2: I do not know how to rigth/.test(await status()) && /Fix it first/.test(await message()));
  await typeLogo('; only a comment');
  await click('.logo-real');
  await chrome.sleep(120);
  check('a box with nothing to run says so, and nothing opens', (await decoded()).count === 2 && /nothing to open in real Logo/.test(await message()));
  await click('.logo-follow');
  await chrome.sleep(120);

  // ---- The X in the corner -------------------------------------------------------------------------------------
  const corner = await chrome.eval(`(() => { const box = document.getElementById('logo-box').getBoundingClientRect(); const x = document.querySelector('.logo-close').getBoundingClientRect(); return { right: box.right - x.right, top: x.top - box.top, size: x.width, label: document.querySelector('.logo-close').getAttribute('aria-label'), text: document.querySelector('.logo-close').textContent }; })()`);
  check('there is an X in the top right corner of the box', corner.right >= 0 && corner.right <= 12 && corner.top >= 0 && corner.top <= 10 && corner.size >= 20 && corner.text === '\u00d7' && /Close/.test(corner.label), JSON.stringify(corner));
  const beforeClose = await area();
  await click('.logo-close');
  await chrome.sleep(150);
  check('pressing it closes the box and lets the toolbar button out', (await logoHidden()) && (await chrome.eval(`document.getElementById('logo-toggle').getAttribute('aria-pressed')`)) === 'false' && /Show your blocks as Logo/.test(await chrome.eval(`document.getElementById('logo-toggle').title`)));
  await click('#logo-toggle');
  await chrome.sleep(150);
  check('and opening it again brings back the same text', !(await logoHidden()) && (await area()) === beforeClose);
  await typeLogo('fd 7');
  await click('.logo-close');
  await click('#logo-toggle');
  await chrome.sleep(150);
  check('even Logo you typed is still there after the X (it is only hidden)', (await area()) === 'fd 7' && (await chrome.eval(`!document.querySelector('.logo-follow').hidden`)));
  await click('.logo-follow');
  await chrome.sleep(120);

  // ---- Following the blocks ----------------------------------------------------------------------------------
  await typeLogo('fd 5');
  await click('.logo-follow');
  await chrome.sleep(150);
  check('Follow my blocks puts the blocks back in the box and hides the button', /repeat 4 \[/.test(await area()) && (await chrome.eval(`document.querySelector('.logo-follow').hidden && !document.querySelector('.logo-short input').disabled`)));
  // Changing the blocks changes the Logo, as long as it has not been typed in.
  await chrome.eval(`document.querySelector('.workspace .node.literal') && 1`);
  const numberBox = await chrome.eval(`(() => { const lits = [...document.querySelectorAll('.workspace .node.literal')]; const el = lits.find((l) => l.textContent.trim() === '4'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(numberBox.x, numberBox.y);
  await chrome.sleep(120);
  await chrome.send('Input.insertText', { text: '7' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.sleep(250);
  check('editing the blocks changes the Logo while the Logo is untouched', /repeat 7 \[/.test(await area()), (await area()).split('\n').filter((l) => /repeat/.test(l)).join());
  await typeLogo('fd 5');
  const kept = await area();
  await chrome.eval(`document.querySelector('.workspace .node.literal') && 1`);
  const again = await chrome.eval(`(() => { const lits = [...document.querySelectorAll('.workspace .node.literal')]; const el = lits.find((l) => l.textContent.trim() === '7'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await chrome.click(again.x, again.y);
  await chrome.sleep(120);
  await chrome.send('Input.insertText', { text: '9' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await chrome.sleep(250);
  check('but once you have typed in it, the blocks changing never throws your words away', (await area()) === kept && kept === 'fd 5');

  // ---- Sharing the corner, hiding, keys, storage -------------------------------------------------------------
  await click('#python-toggle');
  await chrome.sleep(120);
  check('opening the Python box closes the Logo box (they share a corner)', (await logoHidden()) && !(await chrome.eval(`document.getElementById('python-box').hidden`)));
  await click('#logo-toggle');
  await chrome.sleep(120);
  check('and the Logo button closes Python in turn, and your typing is still there', !(await logoHidden()) && (await chrome.eval(`document.getElementById('python-box').hidden`)) && (await area()) === 'fd 5');
  await click('#hide-blocks');
  await chrome.sleep(120);
  check('Hide blocks hides the Logo box too', (await chrome.eval(`getComputedStyle(document.getElementById('logo-box')).display`)) === 'none');
  await click('#hide-blocks');
  await chrome.eval(`(() => { const a = document.querySelector('.logo-code'); a.focus(); a.select(); })()`);
  await chrome.send('Input.insertText', { text: 'cs\nrepeat 6 [fd 40 rt 60]' });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', modifiers: 2, windowsVirtualKeyCode: 13 });
  await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', modifiers: 2, windowsVirtualKeyCode: 13 });
  await finish();
  await chrome.sleep(250);
  check('Ctrl+Enter runs it', (await ink()) > 300);
  check('typing in the box does not trigger the page keys (Ctrl+S would have downloaded a picture)', await chrome.eval(`document.getElementById('message').textContent.indexOf('Saved') === -1`));

  check('typing and running Logo stores nothing: the only stored item is still the autosave, and there are no cookies',
    (await chrome.eval(`Object.keys(localStorage).filter((k) => k !== 'turtlelab-project').join()`)) === '' && (await chrome.eval(`sessionStorage.length`)) === 0 && (await chrome.eval(`document.cookie`)) === '');

  for (const width of [1366, 1100, 1000]) {
    await chrome.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: false });
    await chrome.sleep(200);
    const height = await chrome.eval(`document.querySelector('.toolbar').getBoundingClientRect().height`);
    check(`the toolbar, with the Logo button, stays on one row at ${width} wide`, height < 64, `${Math.round(height)} px tall`);
  }
  check('no console errors or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('and nothing was asked for outside the page', elsewhere.length === 0, elsewhere.join(', '));
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
