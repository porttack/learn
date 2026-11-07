// Dev tool, not part of the app. Checks the sample programs in a real headless
// Chrome: every one opens, runs by itself, draws something, fits on a
// Chromebook-sized screen beside its sticky note, and (the important part)
// never reads or changes what a student saved.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/sample-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { SAMPLES, LISTED_SAMPLES } from '../js/ui/samples.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

// A common Chromebook screen is 1366 by 768, and the browser's own bars take
// about 70 of that, so check at 1366 by 700.
const chrome = await launch({ width: 1366, height: 700 });

const messageText = () => chrome.eval(`document.getElementById('message').textContent`);
const stored = () => chrome.eval(`localStorage.getItem('turtlelab-project')`);

/**
 * Wait until the run is over (the Run button comes back). A program that waits for a person is as over as it will get when its question is open
 * or it says it is listening for clicks: it is then up to someone to answer or click (see actAsPerson).
 */
async function finishRun() {
  for (let i = 0; i < 100; i += 1) {
    if (await chrome.eval(`!document.getElementById('run').disabled || !!document.querySelector('.ask-box') || /^Listening for clicks/.test(document.getElementById('message').textContent)`)) return true;
    await chrome.sleep(200);
  }
  return false;
}

/** Be the person a sample waits for: type each of its `answers` into its question, and click the paper at each of its `clicks` once it is listening. */
async function actAsPerson(sample) {
  for (const answer of sample.answers ?? []) {
    for (let i = 0; i < 50 && !(await chrome.eval(`!!document.querySelector('.ask-box')`)); i += 1) await chrome.sleep(100);
    await chrome.eval(`(() => { const i = document.querySelector('.ask-input'); i.focus(); i.select(); })()`);
    await chrome.send('Input.insertText', { text: String(answer) });
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await chrome.sleep(300);
  }
  await finishRun();
  for (const [x, y] of sample.clicks ?? []) {
    const at = await chrome.eval(`(() => { const r = document.querySelector('.paper-box').getBoundingClientRect(); const s = r.width / 700; return { x: r.left + (350 + ${x}) * s, y: r.top + (280 - ${y}) * s }; })()`);
    await chrome.click(at.x, at.y);
    await chrome.sleep(400);
  }
  if (await chrome.eval(`/^Listening for clicks/.test(document.getElementById('message').textContent)`)) {
    const stop = await chrome.centerOf('#stop');
    await chrome.click(stop.x, stop.y); // (end the listening, so the next sample starts clean)
    await chrome.sleep(200);
  }
}

/** How many pixels on the paper are not the color of its corner. */
const inkOnPaper = () =>
  chrome.eval(`(() => {
    const canvas = document.querySelector('canvas.paper');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 4; i < data.length; i += 4) if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) ink += 1;
    return ink;
  })()`);

/** The rectangles of the workspace stacks, and of the page they live on. */
const layout = () =>
  chrome.eval(`(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    const stacks = [...document.querySelectorAll('.workspace .stack')].map((el) => ({ ...rect(el), note: !!el.querySelector('.node.note'), definition: !!el.querySelector('.node.nameslot:not(.textslot)') }));
    return { stacks, viewport: { width: innerWidth, height: innerHeight } };
  })()`);

try {
  // ---- Every sample ------------------------------------------------------
  for (const sample of SAMPLES) {
    await chrome.goto(`${BASE}?sample=${sample.id}&speed=instant`);
    const finished = await finishRun();
    const messageAtStart = await messageText();
    const { stacks, viewport } = await layout();
    const note = stacks.find((s) => s.note);
    const program = stacks.find((s) => !s.note && !s.definition);
    const made = stacks.filter((s) => s.definition);
    const waitsForPerson = (sample.answers ?? []).length > 0 || (sample.handlers ?? []).length > 0;
    if (waitsForPerson) await actAsPerson(sample); // (a sample that asks, or listens for clicks, needs someone to answer or click before it draws)
    check(`${sample.id}: opens with its note, its program and the blocks it makes, and runs by itself${waitsForPerson ? ' (when answered and clicked)' : ''}`,
      finished && stacks.length === 2 + (sample.defines?.length ?? 0) + (sample.handlers?.length ?? 0) && made.length === (sample.defines?.length ?? 0) && !!note && !!program && (await inkOnPaper()) > 100,
      `${stacks.length} stacks, ${await inkOnPaper()} pixels of ink`);
    // The note is above the program, or (when the program is too tall for both) in a column of its own beside it.
    check(`${sample.id}: the note is above the program, or beside it, and everything fits on a 1366 by 700 screen`,
      !!note && !!program && (note.bottom <= program.top || note.right <= program.left || program.right <= note.left) && note.left >= 60 && stacks.every((s) => s.bottom <= viewport.height - 4 && s.right <= viewport.width),
      program ? `note ends ${Math.round(note.bottom)}, program ${Math.round(program.top)} to ${Math.round(program.bottom)}, lowest ${Math.round(Math.max(...stacks.map((s) => s.bottom)))} of ${viewport.height}` : 'no program');
    check(`${sample.id}: the blocks do not sit on top of each other`,
      stacks.every((a, i) => stacks.every((c, j) => i >= j || a.right <= c.left + 1 || c.right <= a.left + 1 || a.bottom <= c.top + 1 || c.bottom <= a.top + 1)));
    check(`${sample.id}: the note is shown whole, not cut off with ...`,
      await chrome.eval(`![...document.querySelectorAll('.workspace .node.note tspan')].some((t) => t.textContent.endsWith('...'))`));
    check(`${sample.id}: the message names the sample and says it is not saved`,
      (messageAtStart.startsWith(`Sample: ${sample.title}.`) && /not saved/.test(messageAtStart)) || ((sample.handlers ?? []).length > 0 && /^Listening for clicks/.test(messageAtStart)), messageAtStart); // (a program that listens says so as soon as its blocks have run)
    check(`${sample.id}: no storage was touched`, (await chrome.eval(`localStorage.length`)) === 0);
  }
  check('no sample caused a console error, a warning or a security policy violation', chrome.problems.length === 0, chrome.problems.join(' | '));

  // ---- Samples never touch what a student saved ----------------------------
  // Put a saved project in place from a page that has no autosave of its own.
  const mine = JSON.stringify({ app: 'porttack-turtle', version: 1, stacks: [{ x: 120, y: 120, blocks: [{ op: 'forward', args: [42] }] }] });
  await chrome.goto(BASE + 'about.html');
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(mine)})`);
  await chrome.goto(`${BASE}?sample=square&speed=instant`, { keepStorage: true });
  await finishRun();
  check('with saved work waiting, a sample still shows the sample, not the saved work',
    (await chrome.eval(`document.querySelectorAll('.workspace .node.command').length`)) >= 4 && !/Welcome back/.test(await messageText()));
  // Change the sample: undo/redo and New all try to autosave, which a sample must not do.
  const newButton = await chrome.centerOf('#new');
  await chrome.click(newButton.x, newButton.y);
  await chrome.sleep(900); // longer than the autosave delay
  check('pressing New on a sample does not delete the saved work', (await stored()) === mine, String(await stored()).slice(0, 60));
  await chrome.goto('about:blank', { keepStorage: true }); // leaving the page is when an autosave would fire at once
  await chrome.goto(BASE + 'about.html', { keepStorage: true });
  check('and leaving the sample page does not either', (await stored()) === mine);

  await chrome.goto(`${BASE}?sample=spiral&speed=instant`, { keepStorage: true });
  await finishRun();
  const saveButton = await chrome.centerOf('#save');
  check('the Save button is still there on a sample, so a student can keep their own copy', saveButton.w > 10);
  await chrome.goto('about:blank', { keepStorage: true });

  // The next normal visit still finds the saved work, as it always did.
  await chrome.goto(BASE, { keepStorage: true });
  check('the next normal visit brings the saved work back', /Welcome back/.test(await messageText()) && (await chrome.eval(`document.querySelectorAll('.workspace .node.command').length`)) === 1, await messageText());
  await chrome.goto('about:blank', { keepStorage: true });

  // ---- A sample that does not exist ----------------------------------------------
  await chrome.goto(`${BASE}?sample=nope&speed=instant`);
  check('an unknown sample says so, in words', /There is no sample called "nope"/.test(await messageText()), await messageText());
  await chrome.goto(`${BASE}?sample=${encodeURIComponent('<img src=x onerror=alert(1)>' + 'x'.repeat(80))}`);
  check('a strange sample name is shown as plain text and cut short',
    (await chrome.eval(`document.getElementById('message').querySelector('img')`)) === null && (await messageText()).length < 160, (await messageText()).slice(0, 80));
  await chrome.goto(`${BASE}?sample=toString`);
  check('names that every object has (toString, constructor) are not samples', /There is no sample called "toString"/.test(await messageText()), await messageText());

  // ---- Opening a sample while the paper has no autorun -------------------------
  await chrome.goto(`${BASE}?sample=square&autorun=0&speed=instant`);
  await chrome.sleep(300);
  check('autorun=0 shows the blocks without running them', (await inkOnPaper()) === 0 && /^Sample: A square/.test(await messageText()));
  const run = await chrome.centerOf('#run');
  await chrome.click(run.x, run.y);
  await chrome.sleep(400);
  check('then Run draws the sample', (await inkOnPaper()) > 100);

  // ---- The Samples page ------------------------------------------------------------
  await chrome.goto(BASE + 'samples.html');
  check('the Samples page shows one card per sample, each with a loaded picture',
    (await chrome.eval(`document.querySelectorAll('.sample-card').length`)) === LISTED_SAMPLES.length &&
      (await chrome.eval(`[...document.querySelectorAll('.sample-card img')].every((i) => i.complete && i.naturalWidth === 350)`)));
  check('the cards fit the page without sideways scrolling', await chrome.eval(`document.documentElement.scrollWidth <= innerWidth`));
  const card = await chrome.centerOf('.sample-card:nth-child(3) a');
  await chrome.click(card.x, card.y);
  await chrome.sleep(900);
  check('clicking a card opens that sample in TurtleLab', (await chrome.eval(`location.search`)).includes('sample=hexagon-flower') && /^Sample: Hexagon flower/.test(await messageText()), await chrome.eval(`location.href`));

  // ---- The link in the app's toolbar ---------------------------------------------
  await chrome.goto(BASE);
  check('the app toolbar links to Samples in a new tab, so no click loses your blocks',
    await chrome.eval(`(() => { const a = [...document.querySelectorAll('.toolbar-link')].find((l) => l.textContent === 'Samples'); return !!a && a.target === '_blank' && a.getAttribute('href') === 'samples.html'; })()`));
  check('and to the TurtleLab Lessons in a new tab too, right after Samples',
    await chrome.eval(`(() => { const links = [...document.querySelectorAll('.toolbar-link')].map((l) => l.textContent); const a = [...document.querySelectorAll('.toolbar-link')].find((l) => l.textContent === 'Lessons'); return links.join('|') === 'Samples|Lessons|Guide|About' && !!a && a.target === '_blank' && a.getAttribute('href') === '../turtle-lessons/'; })()`));
  for (const width of [1366, 1100, 1000]) {
    await chrome.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: false });
    await chrome.sleep(150);
    // One row is about 51 px tall; a wrapped toolbar is twice that.
    const height = await chrome.eval(`document.querySelector('.toolbar').getBoundingClientRect().height`);
    check(`the toolbar stays on one row at ${width} wide, with the menu on it`, height < 64, `${Math.round(height)} px tall`);
  }
  await chrome.send('Emulation.clearDeviceMetricsOverride');
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
