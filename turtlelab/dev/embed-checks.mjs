// Dev tool, not part of the app. Checks, in a real headless Chrome, TurtleLab as a lesson page shows it: in a frame, with ?embed=1 on the address (a slim toolbar,
// nothing amusing itself, a demo that fits a frame about 700 by 520, and saved work that is never touched). Also, if SITE_URL is given (the whole site, for
// example `bundle exec jekyll serve --port 4010`, then SITE_URL=http://127.0.0.1:4010/), a lesson page with its frames in it.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/embed-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { readdirSync, readFileSync } from 'node:fs';
import { launch } from './cdp.mjs';
import { SAMPLES, sampleById } from '../js/ui/samples.js';
import { FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const SITE = process.env.SITE_URL ?? null;
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 700, height: 520 });
// The window has browser bars of its own; a frame on a lesson page is exactly this size, so ask for exactly this size.
await chrome.send('Emulation.setDeviceMetricsOverride', { width: 700, height: 520, deviceScaleFactor: 1, mobile: false });

const embedUrl = (id, extra = '') => `${BASE}?sample=${id}&embed=1${extra}`;
// Every demo a lesson frames (the ones made only for lessons, and ordinary samples a lesson uses too), and the lesson pages that have a frame in them.
const lessonFiles = readdirSync(new URL('../../_turtlelessons/', import.meta.url)).filter((f) => /^step-\d+-.*\.md$/.test(f)).sort((a, c) => parseInt(a.slice(5), 10) - parseInt(c.slice(5), 10));
const framedBy = (file) => [...readFileSync(new URL(`../../_turtlelessons/${file}`, import.meta.url), 'utf8').matchAll(/include turtlelab-embed\.html\s+sample="([^"]+)"/g)].map((m) => m[1]);
const framedIds = new Set(lessonFiles.flatMap(framedBy));
const lessonDemos = SAMPLES.filter((s) => s.id.startsWith('lesson-') || framedIds.has(s.id));
const shownIn = (selector) => chrome.eval(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.id || e.className || e.tagName)`);
// (a demo that waits for a person is as finished as it will get once its question is open or it says it is listening for clicks: see actAsPerson)
const finishRun = async () => {
  for (let i = 0; i < 100; i += 1) {
    if (await chrome.eval(`!document.getElementById('run').disabled || !!document.querySelector('.ask-box') || /^Listening for clicks/.test(document.getElementById('message').textContent)`)) return true;
    await chrome.sleep(100);
  }
  return false;
};
const waits = (sample) => (sample.answers ?? []).length > 0 || (sample.handlers ?? []).length > 0;
/** Be the person a demo waits for, on a page that is itself the frame: type each of its `answers`, click the paper at each of its `clicks`. */
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
}
const ink = () => chrome.eval(`(() => {
  const c = document.querySelector('canvas.paper');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] !== 255 || d[i + 1] !== 255 || d[i + 2] !== 255) n += 1;
  return n;
})()`);

try {
  // ---- The slim toolbar ----------------------------------------------------------------------------------------------
  await chrome.goto(embedUrl('lesson-box-house'));
  await chrome.sleep(1200);
  const shown = await shownIn('.toolbar > *');
  check('inside a lesson the toolbar is slim: Run, Stop, Undo, Redo, Start over and Open full size, and nothing else', JSON.stringify(shown) === JSON.stringify(['run', 'stop', 'undo', 'redo', 'embed-reset', 'embed-open']), JSON.stringify(shown));
  check('the page knows it is embedded from the very start (a class put there by js/embed-flag.js, not after the page is drawn)', await chrome.eval(`document.documentElement.classList.contains('embedded')`));
  check('the palettes and the can are still there, so blocks can be dragged out and thrown away', (await shownIn('.palettes')).length >= 1 && (await chrome.eval(`!!document.querySelector('.trash-can') && getComputedStyle(document.querySelector('.trash-can')).display !== 'none'`)));
  check('the score badge is not shown in a frame (it would sit on the drawing)', await chrome.eval(`getComputedStyle(document.querySelector('.score-badge')).display === 'none'`));
  check('and the box readout is, at the right edge now that the badge is not there to make room', await chrome.eval(`(() => { const r = document.querySelector('.boxes-readout'); const b = r.getBoundingClientRect(); return !r.hidden && getComputedStyle(r).display !== 'none' && innerWidth - b.right < 40 && b.right <= innerWidth; })()`));
  check('the message line is one short line, so it does not take room from the blocks', await chrome.eval(`document.getElementById('message').getBoundingClientRect().height < 34`), await chrome.eval(`document.getElementById('message').textContent`));
  check('Open full size is this same demo without ?embed=1, in a new tab', await chrome.eval(`(() => { const a = document.getElementById('embed-open'); const u = new URL(a.href); return u.searchParams.get('sample') === 'lesson-box-house' && !u.searchParams.has('embed') && a.target === '_blank' && a.rel.includes('noopener'); })()`), await chrome.eval(`document.getElementById('embed-open').href`));
  await chrome.goto(`${BASE}?sample=lesson-box-house`);
  await chrome.sleep(800);
  const normal = await shownIn('.toolbar > *');
  check('the same page without ?embed=1 is the whole app, with none of the embed-only controls', normal.length > 15 && !normal.includes('embed-reset') && !normal.includes('embed-open') && (await chrome.eval(`getComputedStyle(document.querySelector('.score-badge')).display !== 'none'`)), `${normal.length} things on the toolbar`);

  // ---- Every demo made for a lesson fits a frame and runs --------------------------------------------------------------
  for (const demo of lessonDemos) {
    await chrome.goto(embedUrl(demo.id));
    await chrome.sleep(1100);
    const fit = await chrome.eval(`(() => {
      const msg = document.getElementById('message').getBoundingClientRect();
      const stacks = [...document.querySelectorAll('.workspace .stack')].map((e) => e.getBoundingClientRect());
      const palettes = document.querySelector('.palettes').getBoundingClientRect();
      return { bottom: Math.round(Math.max(...stacks.map((r) => r.bottom))), top: Math.round(Math.min(...stacks.map((r) => r.top))), right: Math.round(Math.max(...stacks.map((r) => r.right))), left: Math.round(Math.min(...stacks.map((r) => r.left))), room: Math.round(msg.top), width: innerWidth, palettes: Math.round(palettes.right) };
    })()`);
    check(`${demo.id} fits the frame: all its blocks are above the message line and inside the window`, fit.bottom <= fit.room && fit.top >= 38 && fit.right <= fit.width && fit.left >= fit.palettes - 2, JSON.stringify(fit));
    await finishRun();
    if (waits(demo)) await actAsPerson(demo); // (a demo that asks, or listens for clicks, draws once someone answers or clicks)
    check(`${demo.id} has run by itself and drawn something${waits(demo) ? ' (when answered and clicked)' : ''}`, (await ink()) > 300, `${await ink()} marked pixels`);
  }

  // ---- Start over, and a frame that can be run again ------------------------------------------------------------------
  await chrome.goto(embedUrl('lesson-box-house'));
  await chrome.sleep(1100);
  await chrome.eval(`window.__before = 1`);
  const resetAt = await chrome.centerOf('#embed-reset');
  await chrome.click(resetAt.x, resetAt.y);
  await chrome.sleep(1200);
  check('Start over loads the demo again, as it was', (await chrome.eval(`window.__before === undefined`)) && (await ink()) > 300 && (await chrome.eval(`/box1\\s+80/.test(document.querySelector('.boxes-readout').textContent)`)));
  const runAt = await chrome.centerOf('#run');
  await chrome.eval(`document.querySelector('canvas.paper').getContext('2d').clearRect(0, 0, 1400, 1120)`);
  await chrome.click(runAt.x, runAt.y);
  await finishRun();
  check('Run draws it again', (await ink()) > 300);

  // ---- Saved work is never read and never written ---------------------------------------------------------------------
  const saved = { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [{ x: 120, y: 80, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'forward', args: [37] }] }] };
  const text = JSON.stringify(saved);
  const seed = await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('turtlelab-project', ${JSON.stringify(text)})` });
  await chrome.goto(embedUrl('lesson-box-house'), { keepStorage: true });
  await chrome.sleep(1200);
  const stackCount = await chrome.eval(`document.querySelectorAll('.workspace .stack').length`);
  const forward37 = await chrome.eval(`document.querySelector('.workspace').textContent.includes('37')`);
  // do something that would make an ordinary page save: run it, and drag the turtle's blocks about
  await chrome.click(runAt.x, runAt.y);
  await finishRun();
  await chrome.mouse('mouseMoved', 400, 300, { buttons: 0 });
  await chrome.sleep(900);
  await chrome.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seed.identifier });
  check('a frame never reads what a student saved: it shows its own blocks, not the saved ones', stackCount >= 2 && !forward37, `${stackCount} stacks`);
  check('and never writes it either: the saved project is exactly what it was, and nothing else is stored', (await chrome.eval(`localStorage.getItem('turtlelab-project')`)) === text && (await chrome.eval(`localStorage.length`)) === 1 && (await chrome.eval(`sessionStorage.length`)) === 0);
  await chrome.goto('about:blank');

  // ---- Nothing amuses itself in a frame ------------------------------------------------------------------------------
  await chrome.goto(`${BASE}?sample=lesson-box-house&idle=2`); // the whole app, quiet for 1 second: the turtle's shell starts to breathe
  await chrome.sleep(2500);
  const breathesOutside = await chrome.eval(`document.querySelector('.turtle-sprite').classList.contains('breathing-color')`);
  await chrome.goto(embedUrl('lesson-box-house', '&idle=2'));
  await chrome.sleep(2500);
  const breathesInside = await chrome.eval(`document.querySelector('.turtle-sprite').classList.contains('breathing-color')`);
  check('in a frame nothing amuses itself (the control: the same page without ?embed=1 does)', breathesOutside === true && breathesInside === false, `outside ${breathesOutside}, inside ${breathesInside}`);

  // ---- Nothing leaves the site, nothing is wrong -----------------------------------------------------------------------
  const origin = new URL(BASE).origin;
  const outside = chrome.requestLog.filter((r) => /^https?:/.test(r.url) && !r.url.startsWith(origin));
  check('not one request went to any other address', outside.length === 0, outside.map((r) => r.url).join(' | '));
  check('no sockets were opened', chrome.webSockets === 0);

  // ---- A lesson page with its frames in it (only if the whole site is being served) ----------------------------------------
  if (SITE) {
    const lessons = (process.env.LESSON_PAGES ?? lessonFiles.filter((f) => framedBy(f).length > 0).map((f) => `turtle-lessons/${f.replace(/\.md$/, '')}/`).join(',')).split(',').filter(Boolean);
    for (const path of lessons) {
      await chrome.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 800, deviceScaleFactor: 1, mobile: false });
      await chrome.goto(`${SITE}${path}`);
      await chrome.sleep(500);
      const frames = await chrome.eval(`[...document.querySelectorAll('iframe.tl-embed-frame')].map((f) => ({ src: f.getAttribute('src'), title: f.title, lazy: f.loading, height: f.getAttribute('height') }))`);
      check(`${path}: every demo has a frame with a title, loaded lazily, in embed mode`, frames.length >= 1 && frames.every((f) => f.title.length > 3 && f.lazy === 'lazy' && /[?&]embed=1\b/.test(f.src) && /[?&]sample=[a-z0-9-]+/.test(f.src)), JSON.stringify(frames));
      check(`${path}: at most four frames (each is a whole copy of the app)`, frames.length <= 4, String(frames.length));
      // scroll to each frame so that it loads, then check that the demo inside ran
      for (let i = 0; i < frames.length; i += 1) {
        await chrome.eval(`document.querySelectorAll('iframe.tl-embed-frame')[${i}].scrollIntoView({ block: 'center' })`);
        // A demo that asks a question or listens for clicks is waiting for a person: be one, inside the frame. A question is answered through its form; a click is a real click on the paper.
        const framed = sampleById(frames[i].src.match(/[?&]sample=([a-z0-9-]+)/)[1]);
        if (framed && waits(framed)) {
          for (const answer of framed.answers ?? []) {
            let asked = false;
            for (let waited = 0; waited < 10000 && !asked; waited += 250) {
              await chrome.sleep(250);
              asked = await chrome.eval(`!!document.querySelectorAll('iframe.tl-embed-frame')[${i}].contentDocument?.querySelector('.ask-box')`);
            }
            await chrome.eval(`(() => { const doc = document.querySelectorAll('iframe.tl-embed-frame')[${i}].contentDocument; const box = doc.querySelector('.ask-input'); box.value = ${JSON.stringify(String(answer))}; box.form.requestSubmit(); })()`);
          }
          for (const [x, y] of framed.clicks ?? []) {
            let ready = false;
            for (let waited = 0; waited < 10000 && !ready; waited += 250) {
              await chrome.sleep(250);
              ready = await chrome.eval(`/^Listening for clicks/.test(document.querySelectorAll('iframe.tl-embed-frame')[${i}].contentDocument?.getElementById('message')?.textContent ?? '')`);
            }
            await chrome.sleep(300); // (the message is short so the paper has stopped moving, but let it settle)
            const at = await chrome.eval(`(() => { const f = document.querySelectorAll('iframe.tl-embed-frame')[${i}]; const fr = f.getBoundingClientRect(); const r = f.contentDocument.querySelector('.paper-box').getBoundingClientRect(); const s = r.width / 700; return { x: fr.left + r.left + (350 + ${x}) * s, y: fr.top + r.top + (280 - ${y}) * s }; })()`);
            await chrome.click(at.x, at.y);
            await chrome.sleep(400);
          }
        }
        // (a demo can be slow on purpose, like the one that shows a variable changing, so wait for its run to end: up to 20 seconds)
        let inside = null;
        for (let waited = 0; waited < 20000; waited += 500) {
          await chrome.sleep(500);
          inside = await chrome.eval(`(() => {
            const doc = document.querySelectorAll('iframe.tl-embed-frame')[${i}].contentDocument;
            if (!doc?.getElementById('run')) return null;
            const c = doc.querySelector('canvas.paper');
            const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let k = 0; k < d.length; k += 4) if (d[k] !== 255 || d[k + 1] !== 255 || d[k + 2] !== 255) n += 1;
            return { ink: n, embedded: doc.documentElement.classList.contains('embedded'), running: doc.getElementById('run').disabled, listening: /^Listening for clicks/.test(doc.getElementById('message').textContent) };
          })()`);
          if (inside && (!inside.running || (framed && waits(framed) && inside.listening)) && inside.ink > 300) break;
        }
        check(`${path}: frame ${i + 1} loaded TurtleLab in embed mode and the demo drew something`, inside !== null && inside.embedded && inside.ink > 300, JSON.stringify(inside));
      }
    }
  }
  check('no console errors, exceptions or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}
console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
