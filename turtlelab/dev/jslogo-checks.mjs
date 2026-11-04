// Dev tool, not part of the app. Checks, in a real headless Chrome, the copy of JSLogo kept at /jslogo/ and the trip to it from
// TurtleLab's Logo box: it runs a program from the address, makes no request outside the site, keeps nothing in the browser,
// and the browser itself refuses anything else. About 20 seconds.
// It needs the WHOLE site served (JSLogo is outside the turtlelab folder). From the repo's top folder:
//   python3 -m http.server 4012
// Then run:   node turtlelab/dev/jslogo-checks.mjs
// (SITE_URL says where the site is if it is not on 4012, and must end with a slash.)
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';

const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:4012/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};
const encode = (code) => encodeURIComponent(code).replace(/_/g, '%5F');

const chrome = await launch({ width: 1366, height: 700 });
const click = async (selector) => {
  const at = await chrome.centerOf(selector);
  await chrome.click(at.x, at.y);
};
const ink = () =>
  chrome.eval(`(() => { const c = document.getElementById('sandbox'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250)) n += 1; return n; })()`);
const editorText = () => chrome.eval(`[...document.querySelectorAll('.CodeMirror')].map((e) => e.CodeMirror.getValue()).join('|')`);
const outside = () => chrome.requests.filter((url) => !url.startsWith(SITE) && !url.startsWith('data:') && !url.startsWith('blob:'));
async function openJsLogo(code) {
  await chrome.goto(`${SITE}turtlelab/about.html`); // a different page first, so this is a fresh load and not a change of #
  await chrome.goto(`${SITE}jslogo/#${encode(code)}`);
  await chrome.sleep(1500);
}

try {
  // ---- The page itself ----------------------------------------------------------------------------------------
  await openJsLogo('repeat 4 [fd 100 rt 90]');
  check('JSLogo opens from this site and runs a program given in the address', (await ink()) > 300, `${await ink()} pixels`);
  check('it says nothing is wrong', chrome.problems.length === 0 && !(await chrome.eval(`document.body.innerText.includes('Error:')`)), chrome.problems.join(' | '));
  check('it asked for nothing outside this site (no CDN, no fonts, no collaboration service)', outside().length === 0, outside().join(', '));
  check('the editor is ours: CodeMirror came from this site', chrome.requests.some((url) => url.includes('/jslogo/vendor/codemirror/codemirror.min.js')) && typeof (await chrome.eval(`typeof CodeMirror`)) === 'string' && (await chrome.eval(`typeof CodeMirror`)) === 'function');
  check('TogetherJS and the Collaborate link are gone', (await chrome.eval(`typeof window.TogetherJS`)) === 'undefined' && !(await chrome.eval(`document.body.innerText.includes('Collaborate')`)));
  check('both pages carry a policy that lets them load only from this site', await chrome.eval(`/default-src 'self'/.test(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? '') && !/unsafe-eval/.test(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content)`));
  const referencePolicy = await chrome.eval(`fetch('language.html').then((r) => r.text()).then((t) => /Content-Security-Policy/.test(t) && !/<script>/.test(t))`);
  check('the reference page has the policy too, and no inline script', referencePolicy === true);
  check('it keeps nothing in the browser: no database, no stored items, no cookies',
    (await chrome.eval(`(async () => (await indexedDB.databases()).length)()`)) === 0 && (await chrome.eval(`localStorage.length + sessionStorage.length`)) === 0 && (await chrome.eval(`document.cookie`)) === '');

  // A program of several lines, a block of your own, an underscore in a name, a color as a CSS word.
  await openJsLogo('to tri_angle :s\n  repeat 3 [fd :s rt 120]\nend\ncs\nsetpc "#1e50c8\nsetpensize 4\nrepeat 6 [tri_angle 80 rt 60]\nprint "done');
  check('a program of several lines, with a block of its own, an underscore in its name and a CSS color, runs', (await ink()) > 3000 && !(await chrome.eval(`document.body.innerText.includes('Error:')`)), `${await ink()} pixels`);
  check('and it opens the big box, so it can be read', await chrome.eval(`document.body.classList.contains('multi')`) && /tri_angle/.test(await editorText()), (await editorText()).slice(0, 40));

  // Nothing is kept for next time.
  await chrome.goto(`${SITE}jslogo/`);
  await chrome.sleep(1200);
  check('after a refresh the library and history are empty again (nothing was kept)', (await chrome.eval(`document.querySelectorAll('#library .snippets > *, #history .snippets > *').length`)) === 0 && (await chrome.eval(`(async () => (await indexedDB.databases()).length)()`)) === 0);

  // The reference page and the box it sends examples to are the same site.
  await chrome.eval(`window.postMessage({ example: 'fd 5' }, location.origin)`);
  await chrome.sleep(300);
  check('an example sent from this site (the reference page does this) goes into the editor', /fd 5/.test(await editorText()), await editorText());
  await click('#sb-link-reference'); // the reference page loads only when it is shown
  await chrome.sleep(1200);
  const frameOk = await chrome.eval(`(() => { const e = document.getElementById('reference').contentDocument?.querySelector('.example'); if (!e) return false; e.click(); return e.textContent.trim().length > 0; })()`);
  await chrome.sleep(300);
  check('and clicking an example on the reference page really does that', frameOk && (await editorText()).trim().length > 0 && !/^fd 5$/.test((await editorText()).trim()), (await editorText()).slice(0, 30));

  // ---- The trip from TurtleLab ---------------------------------------------------------------------------------
  const sent = [];
  for (const sample of ['initials-curves', 'star', 'tree', 'own-block']) {
    await chrome.goto(`${SITE}turtlelab/?sample=${sample}&speed=instant`);
    for (let i = 0; i < 80; i += 1) {
      if (await chrome.eval(`!document.getElementById('run').disabled`)) break;
      await chrome.sleep(100);
    }
    await click('#logo-toggle');
    await chrome.sleep(150);
    await chrome.eval(`window.__opened = []; window.open = (url) => { window.__opened.push(String(url)); return {}; }`);
    await click('.logo-real');
    await chrome.sleep(150);
    const url = (await chrome.eval(`window.__opened`))[0] ?? '';
    sent.push([sample, url]);
  }
  check('from TurtleLab, the button sends each program to /jslogo/ on this same site', sent.every(([, url]) => url.startsWith(`${SITE}jslogo/#`)), sent.map(([, u]) => u.slice(0, 40)).join(' | '));
  for (const [sample, url] of sent) {
    await chrome.goto(`${SITE}turtlelab/about.html`);
    await chrome.goto(url);
    await chrome.sleep(2200);
    check(`${sample}: opened in JSLogo it draws, with no error`, (await ink()) > 300 && !(await chrome.eval(`document.body.innerText.includes('Error:')`)) && !(await chrome.eval(`document.getElementById('error').classList.contains('shown')`)), `${await ink()} pixels; ${(await chrome.eval(`document.getElementById('error').textContent`)).slice(0, 80)}`);
  }
  check('and none of that asked for anything outside the site, or caused a console error', outside().length === 0 && chrome.problems.length === 0, `${outside().join(', ')} ${chrome.problems.join(' | ')}`);

  // ---- Last of all (it provokes the browser's refusal, which logs policy messages) --------------------------------
  await chrome.goto(`${SITE}jslogo/`);
  await chrome.sleep(800);
  const before = chrome.problems.length;
  const probe = await chrome.eval(`(async () => {
    const result = {};
    try { await fetch('https://example.com/', { mode: 'no-cors' }); result.fetch = 'went out'; } catch { result.fetch = 'refused'; }
    result.image = await new Promise((resolve) => { const i = new Image(); i.onload = () => resolve('loaded'); i.onerror = () => resolve('refused'); i.src = 'https://example.com/x.png'; });
    result.script = await new Promise((resolve) => { const t = document.createElement('script'); t.onload = () => resolve('ran'); t.onerror = () => resolve('refused'); t.src = 'https://example.com/x.js'; document.head.append(t); });
    try { result.eval = String(eval('1 + 1')); } catch { result.eval = 'refused'; }
    return result;
  })()`);
  await chrome.sleep(300);
  const violations = chrome.problems.splice(before);
  check('the browser itself refuses to contact other sites from JSLogo, and refuses eval too', probe.fetch === 'refused' && probe.image === 'refused' && probe.script === 'refused' && probe.eval === 'refused' && violations.some((v) => /Content Security Policy/i.test(v)), `${JSON.stringify(probe)}; ${violations.length} policy messages`);
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
