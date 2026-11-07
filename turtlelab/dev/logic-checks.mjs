// Dev tool, not part of the app. Checks, in a real headless Chrome, the blocks that put yes-or-no blocks together: `and`, `or` and `not` (Math
// palette): they are in the palette after the three comparisons; a yes-or-no block plugs into their pointed holes by dragging and a number block
// does not; pulling one out leaves a hole again; they nest; they run (and a guard keeps a divide from running); an empty hole is outlined with the
// plain message; and the Python and Logo boxes write them.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/logic-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const SHOTS = process.env.SHOTS_DIR ?? null;
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 1200, height: 800 });
const b = (op, ...args) => ({ op, args });
const count = (selector) => chrome.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
const stacks = () => count('.workspace .stack');
const message = () => chrome.eval(`document.getElementById('message').textContent`);
const BLOCK_NODES = '.workspace .node.command, .workspace .node.clamp, .workspace .node.hat, .workspace .node.reporter';
const rectJs = `(n) => { const r = n.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; }`;
const nodeRect = (label) =>
  chrome.eval(`(() => {
    const n = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.replace(/\\s+/g, '') === ${JSON.stringify(label)}.replace(/\\s+/g, ''));
    return n ? (${rectJs})(n) : null;
  })()`);
/** The empty yes-or-no holes of the workspace block whose words are exactly this label (left to right). */
const holes = (label) =>
  chrome.eval(`(() => {
    const n = [...document.querySelectorAll(${JSON.stringify(BLOCK_NODES)})].find((n) => n.textContent.replace(/\\s+/g, '') === ${JSON.stringify(label)}.replace(/\\s+/g, ''));
    if (!n) return null;
    return [...n.querySelectorAll('path[fill-opacity]')].map((p) => (${rectJs})(p)).sort((a, c) => a.left - c.left);
  })()`);

async function openPalette(title) {
  const open = await chrome.eval(`(() => { const f = document.querySelector('.flyout'); return !f.hidden && document.querySelector('.palette-button.selected')?.title; })()`);
  if (open === title) return;
  const button = await chrome.centerOf(`.palette-button[title="${title}"]`);
  await chrome.click(button.x, button.y);
  await chrome.sleep(120);
}
/** Drag a block out of the open palette so its top-left corner lands at (left, top). */
async function dragFromPalette(op, left, top) {
  await chrome.eval(`document.querySelector('.flyout .stack[data-op=${op}]')?.scrollIntoView({ block: 'nearest' })`);
  await chrome.sleep(60);
  const rect = await chrome.eval(`(() => { const s = document.querySelector('.flyout .stack[data-op=${op}]'); return s ? (${rectJs})(s) : null; })()`);
  const press = await chrome.eval(`(() => {
    const stack = document.querySelector('.flyout .stack[data-op=${op}]');
    const r = stack.getBoundingClientRect();
    for (let y = r.top + r.height / 2; y < r.bottom - 2; y += 3) {
      for (let x = r.left + 4; x < r.right - 2; x += 3) {
        if (document.elementFromPoint(x, y)?.closest('.stack') === stack) return { x, y };
      }
    }
    return null;
  })()`);
  if (!press) throw new Error(`no point on the ${op} block in the palette to grab`);
  await chrome.drag(press, { x: left + (press.x - rect.left), y: top + (press.y - rect.top) }, 10);
  await chrome.sleep(100);
}
async function openWith(stacksOfBlocks, query = '?speed=instant') {
  await chrome.goto(BASE + 'about.html');
  await chrome.eval(`localStorage.setItem('turtlelab-project', ${JSON.stringify(JSON.stringify({ app: 'porttack-turtle', version: 1, stacks: stacksOfBlocks }))})`);
  await chrome.goto(BASE + query, { keepStorage: true });
  await chrome.sleep(500);
}
const ink = () =>
  chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) n += 1; return n; })()`);
async function runAndWait() {
  const run = await chrome.centerOf('#run');
  await chrome.click(run.x, run.y);
  for (let i = 0; i < 60; i += 1) {
    if (await chrome.eval(`!document.getElementById('run').disabled`)) break;
    await chrome.sleep(100);
  }
  await chrome.sleep(150);
}

try {
  // ---- In the palette ---------------------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await openPalette('Math');
  const order = await chrome.eval(`[...document.querySelectorAll('.flyout .stack')].map((s) => s.dataset.op)`);
  check('Math lists and, or and not right after the three comparisons, before print', order.join(' ').includes('less greater equal and or not print'), order.join(' '));
  const labels = await chrome.eval(`['and', 'or', 'not'].map((op) => { const s = document.querySelector('.flyout .stack[data-op=' + op + ']'); return [...s.querySelectorAll('text.block-text')].map((t) => t.textContent).join('|'); })`);
  check('and, or and not are written on their blocks', labels.join(',') === 'and,or,not', labels.join(','));
  const palette = await chrome.eval(`['and', 'or', 'not'].map((op) => { const s = document.querySelector('.flyout .stack[data-op=' + op + ']'); return s.querySelectorAll('path[fill-opacity]').length; })`);
  check('each shows its empty yes-or-no holes: two, two and one', palette.join(',') === '2,2,1', palette.join(','));
  const fit = await chrome.eval(`['and', 'or', 'not'].map((op) => { const s = document.querySelector('.flyout .stack[data-op=' + op + ']'); const w = s.getBoundingClientRect(); return [...s.querySelectorAll('text.block-text')].every((t) => { const r = t.getBoundingClientRect(); return r.left >= w.left - 1 && r.right <= w.right + 1; }); })`);
  check('the words fit inside the blocks', fit.every(Boolean), fit.join(','));

  // ---- Dragging them together ---------------------------------------------------------------------------------------------
  /** The reporters on the page: the words of each block (a block holding others says all their words), and how many empty holes it has itself. */
  const reporters = () =>
    chrome.eval(`[...document.querySelectorAll('.workspace .node.reporter')].map((n) => ({ words: n.textContent.replace(/\\s+/g, ' ').trim(), own: n.querySelectorAll(':scope > path[fill-opacity], :scope > svg path[fill-opacity]').length, all: n.querySelectorAll('path[fill-opacity]').length }))`);
  await openPalette('Flow');
  await dragFromPalette('if', 420, 150);
  const ifRect = await nodeRect('if');
  await openPalette('Math');
  await dragFromPalette('and', ifRect.left + ifRect.w - 12, ifRect.top + 2);
  const joined = await nodeRect('and');
  const ifAfter = await nodeRect('if');
  check('an and plugs into the pointed socket of an if', (await stacks()) === 1 && joined !== null && joined.left > ifAfter.left + 30, `${await stacks()} stacks`);
  let h = await holes('and');
  check('and shows two empty holes, side by side, inside it', h.length === 2 && h[1].left > h[0].right && h[0].left >= joined.left && h[1].right <= joined.right + 1, JSON.stringify(h));
  if (SHOTS) await chrome.screenshot(`${SHOTS}/logic-and-empty.png`);

  await dragFromPalette('add', h[0].left + 2, h[0].top + 2);
  check('a number block does not fit a yes-or-no hole (it stays a stack of its own)', (await stacks()) === 2 && (await holes('and')).length === 2, `${await stacks()} stacks`);
  const undo = await chrome.centerOf('#undo');
  await chrome.click(undo.x, undo.y); // take the stray block away again
  await chrome.sleep(300);
  check('(Undo takes the stray number block away)', (await stacks()) === 1, `${await stacks()} stacks`);

  h = await holes('and');
  await dragFromPalette('less', h[0].left + 2, h[0].top + 2);
  let seen = await reporters();
  check('a < plugs into the first hole of the and', (await stacks()) === 1 && seen.map((r) => r.words).sort().join(',') === '<,and', JSON.stringify(seen.map((r) => r.words)));
  h = await holes('and');
  check('and one hole is left in the and, to the right of the <', h.length === 1 && h[0].left > (await nodeRect('<')).right - 2, JSON.stringify(h));
  await dragFromPalette('not', h[0].left + 2, h[0].top + 2);
  seen = await reporters();
  check('a not plugs into the second hole, so they nest', (await stacks()) === 1 && seen.map((r) => r.words).sort().join(',') === '<,and,not', JSON.stringify(seen.map((r) => r.words)));
  check('the and has no hole left and the not has one of its own', (await holes('and')).length === 0 && (await holes('not')).length === 1);
  h = await holes('not');
  await dragFromPalette('greater', h[0].left + 2, h[0].top + 2);
  seen = await reporters();
  check('a > plugs into the not', (await stacks()) === 1 && seen.map((r) => r.words).sort().join(',') === '<,>,and,not', JSON.stringify(seen.map((r) => r.words)));
  check('and no hole is left anywhere', seen.every((r) => r.all === 0), JSON.stringify(seen));
  if (SHOTS) await chrome.screenshot(`${SHOTS}/logic-nested.png`);

  // pull the < back out of the and: it becomes its own stack, and the hole comes back
  const lessNow = await nodeRect('<');
  await chrome.drag({ x: lessNow.left + 10, y: lessNow.top + lessNow.h / 2 }, { x: lessNow.left + 10, y: lessNow.top + 260 }, 12);
  await chrome.sleep(250);
  check('pulling the < out gives it a stack of its own and leaves a hole behind', (await stacks()) === 2 && (await holes('and')).length === 1, `${await stacks()} stacks, ${(await holes('and'))?.length} holes`);

  // ---- Running them -----------------------------------------------------------------------------------------------------
  const inside = () => b('and', b('greater', b('box1'), -50), b('less', b('box1'), 50));
  await openWith([
    { x: 80, y: 90, blocks: [b('start'), b('clean'), b('store1', 7),
      { op: 'if', args: [inside()], body: [b('forward', 40)] },
      { op: 'if', args: [b('or', b('less', b('box1'), 0), b('equal', b('box1'), 7))], body: [b('right', 90), b('forward', 30)] },
      { op: 'if', args: [b('not', b('equal', b('box1'), 7))], body: [b('forward', 500)] },
      // the guard: box2 is 0, and 10 / box2 would be a mistake if the second half ran
      { op: 'if', args: [b('and', b('greater', b('box2'), 0), b('greater', b('divide', 10, b('box2')), 2))], body: [b('forward', 500)] },
    ] },
  ]);
  await runAndWait();
  check('a program with and, or and not runs and draws something', (await ink()) > 0, await message());
  const bounds = await chrome.eval(`(() => { const c = document.querySelector('canvas.paper'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1; for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) { const i = (y * c.width + x) * 4; if (d[i] > 200 && d[i + 1] < 120 && d[i + 2] < 120) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); } } return { minx, maxx, miny, maxy, w: c.width }; })()`);
  const unit = bounds.w / 700; // canvas pixels for one turtle step
  check('it went up about 40 and right about 30 (and not 500: the no answers and the guard were skipped)', Math.abs((bounds.maxy - bounds.miny) / unit - 40) < 12 && Math.abs((bounds.maxx - bounds.minx) / unit - 30) < 12 && (bounds.maxx - bounds.minx) / unit < 60, JSON.stringify(bounds));
  check('and no mistake was reported, even with a divide that would fail if it had run', !/divide by zero/.test(await message()) && (await count('.workspace .error')) === 0, await message());

  // ---- A hole left empty is a mistake, and it points at the block ----------------------------------------------------------------
  await openWith([{ x: 80, y: 90, blocks: [b('start'), { op: 'if', args: [b('and', b('less', 1, 2), null)], body: [b('forward', 10)] }] }]);
  await runAndWait();
  check('an empty hole says what to do, in plain words', /yes or no/.test(await message()), await message());
  check('and the and block is outlined', (await count('.workspace .node.error')) === 1, `${await count('.workspace .node.error')} outlined`);

  // ---- The Python and the Logo ------------------------------------------------------------------------------------------------
  await openWith([{ x: 80, y: 90, blocks: [b('start'), { op: 'if', args: [b('or', b('and', b('greater', b('x'), -50), b('less', b('x'), 50)), b('not', b('equal', b('y'), 0)))], body: [b('forward', 10)] }] }]);
  const py = await chrome.centerOf('#python-toggle');
  await chrome.click(py.x, py.y);
  await chrome.sleep(400);
  const pythonText = await chrome.eval(`document.querySelector('.python-box textarea, .python-box pre, .python-box code')?.value ?? document.querySelector('.python-box')?.textContent ?? ''`);
  check('the Python box writes it as Python: (a and b) or not (c)', /if \(xcor\(\) > -50 and xcor\(\) < 50\) or not \(ycor\(\) == 0\):/.test(pythonText), pythonText.split('\n').find((line) => /^if/.test(line)) ?? pythonText.slice(0, 200));
  await chrome.click(py.x, py.y); // close it
  await chrome.sleep(200);
  const lg = await chrome.centerOf('#logo-toggle');
  await chrome.click(lg.x, lg.y);
  await chrome.sleep(400);
  const logoText = await chrome.eval(`document.querySelector('.logo-box textarea')?.value ?? ''`);
  check('the Logo box writes it as Logo, in brackets', /if \(or \(and \(xcor > -50\) \(xcor < 50\)\) \(not \(ycor = 0\)\)\) \[/.test(logoText), logoText.split('\n').find((line) => /^if/.test(line)) ?? logoText.slice(0, 200));
  if (SHOTS) await chrome.screenshot(`${SHOTS}/logic-logo.png`);

  // ---- Nothing stored or fetched, and no console trouble ---------------------------------------------------------------------------
  const stored = await chrome.eval(`Object.keys(localStorage).sort().join(',')`);
  check('only the autosave item is stored', stored === 'turtlelab-project', stored);
  const elsewhere = chrome.requests.filter((url) => !url.startsWith(BASE) && !url.startsWith('data:') && !url.startsWith('blob:'));
  check('no request went to another address', elsewhere.length === 0, elsewhere.join(' '));
  check('no console errors, exceptions or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
