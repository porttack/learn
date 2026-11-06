// Dev tool, not part of the app. Checks, in a real headless Chrome, the score on the garbage can and poking the can: a sticker with the number of things
// the shark has eaten, a point off when the harpoon hits, and as many pokes as the score (one if there is none) calling a fish or the boat. Also the whimsy
// on every change of grid or paper, and the shark being sick: everything it ate comes back up, lands round the can, and fades away.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/can-checks.mjs
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const chrome = await launch({ width: 1200, height: 800 });

/** What the can shows: the number on the sticker, whether the sticker is there, and whether a visitor is out. */
const can = () => chrome.eval(`(() => {
  const el = document.querySelector('.trash-can');
  const sticker = el.querySelector('.can-score');
  const left = el.querySelector('.poke-left');
  return { text: el.querySelector('.can-score-text').textContent, shown: getComputedStyle(sticker).display !== 'none', hasClass: el.classList.contains('has-score'),
    left: left ? left.textContent : null, visitor: !!document.querySelector('.sky .fish, .sky .boat'), fish: !!document.querySelector('.sky .fish'), boat: !!document.querySelector('.sky .boat'),
    clang: el.classList.contains('clang'), poked: el.classList.contains('poked') };
})()`);
const poke = async () => {
  const at = await chrome.centerOf('.trash-hit');
  await chrome.click(at.x, at.y);
  await chrome.sleep(120);
};
const waitFor = async (test, ms = 12000, step = 100) => {
  for (let waited = 0; waited < ms; waited += step) {
    const state = await can();
    if (test(state)) return state;
    await chrome.sleep(step);
  }
  return can();
};
/** Throw a block into the can: take a new block out of the Turtle flyout and let go of it on the delete zone. */
async function feedOneBlock() {
  const open = await chrome.eval(`(() => { const f = document.querySelector('.flyout'); return !f.hidden; })()`);
  if (!open) {
    const b = await chrome.centerOf('.palette-button[title="Turtle"]');
    await chrome.click(b.x, b.y);
    await chrome.sleep(150);
  }
  const at = await chrome.eval(`(() => { const s = document.querySelector('.flyout .stack[data-op=forward]'); s.scrollIntoView({ block: 'nearest' }); const r = s.getBoundingClientRect(); return { x: r.left + 10, y: r.top + r.height / 2 }; })()`);
  await chrome.mouse('mouseMoved', at.x, at.y, { buttons: 0 });
  await chrome.mouse('mousePressed', at.x, at.y);
  for (let i = 1; i <= 6; i += 1) await chrome.mouse('mouseMoved', at.x + 6 * i, at.y + 20 * i);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', at.x + 36 + ((600 - at.x - 36) * i) / 8, at.y + 120);
  for (let i = 1; i <= 8; i += 1) await chrome.mouse('mouseMoved', 600 + ((60 - 600) * i) / 8, at.y + 120);
  await chrome.mouse('mouseReleased', 60, at.y + 120);
  await chrome.sleep(250);
}

try {
  // ---- The sticker ---------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(500);
  const start = await can();
  check('a new page has no score: the can has no sticker', !start.shown && !start.hasClass && start.text === '0', JSON.stringify(start));
  check('the can itself ignores the mouse (a stack held over it is what gets it), but its body can be pressed', await chrome.eval(`getComputedStyle(document.querySelector('.trash-can')).pointerEvents === 'none' && getComputedStyle(document.querySelector('.trash-hit')).pointerEvents === 'auto' && getComputedStyle(document.querySelector('.trash-hit')).cursor === 'pointer'`));
  const hitBox = await chrome.eval(`(() => { const h = document.querySelector('.trash-hit').getBoundingClientRect(); const c = document.querySelector('.trash-can').getBoundingClientRect(); return { inside: h.left >= c.left && h.right <= c.right && h.bottom <= c.bottom + 0.5, belowShark: h.top > c.top + c.height * 0.5, wide: h.width > 25, high: h.height > 25 }; })()`);
  check('the part of the can that can be pressed is its body, below the shark and inside the can', hitBox.inside && hitBox.belowShark && hitBox.wide && hitBox.high, JSON.stringify(hitBox));

  await feedOneBlock();
  const one = await can();
  check('throwing a stack of blocks into the can is a point: the sticker comes on, saying 1', one.shown && one.hasClass && one.text === '1', JSON.stringify(one));
  await chrome.sleep(1500);
  await feedOneBlock();
  const two = await can();
  check('and another is 2', two.shown && two.text === '2', JSON.stringify(two));
  check('the number is on the can, on the front of its body', await chrome.eval(`(() => { const s = document.querySelector('.can-score circle').getBoundingClientRect(); const c = document.querySelector('.trash-can').getBoundingClientRect(); return s.left >= c.left && s.right <= c.right && s.top > c.top + c.height * 0.5 && s.bottom <= c.bottom; })()`));

  // ---- Poking the can ------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant&canscore=2');
  await chrome.sleep(500);
  const preset = await can();
  check('?canscore=2 starts the can with a score of 2 (for trying it out)', preset.shown && preset.text === '2', JSON.stringify(preset));
  await poke();
  const afterOne = await can();
  check('one poke of two: the can jiggles, the bubble says "1 more", and no visitor comes', afterOne.left === '1 more' && !afterOne.visitor, JSON.stringify(afterOne));
  await poke();
  const came = await waitFor((s) => s.visitor, 3000);
  check('the second poke calls a visitor: a fish or the boat', came.visitor && (came.fish || came.boat), JSON.stringify(came));
  check('and the score is untouched by poking', (await can()).text === '2');

  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(500);
  await poke();
  const noScore = await waitFor((s) => s.visitor, 3000);
  check('with no score one poke is enough to call a visitor', noScore.visitor, JSON.stringify(noScore));

  await chrome.goto(BASE + '?speed=instant&canscore=2');
  await chrome.sleep(500);
  await poke();
  await chrome.sleep(1800);
  await poke();
  const slow = await can();
  check('a pause of more than a second and a half starts the count again: the second poke is the first of a new run', slow.left === '1 more' && !slow.visitor, JSON.stringify(slow));

  await chrome.goto(BASE + '?speed=instant&canscore=3');
  await chrome.sleep(500);
  await poke();
  const three1 = await can();
  await poke();
  const three2 = await can();
  check('with a score of 3 the bubble counts down: 2 more, then 1 more', three1.left === '2 more' && three2.left === '1 more' && !three2.visitor, JSON.stringify([three1.left, three2.left]));

  // ---- A fish the shark eats ----------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant&fish=now');
  await chrome.sleep(900);
  const fishAt = await chrome.eval(`(() => { const f = document.querySelector('.sky .fish'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  check('?fish=now sends a fish', fishAt !== null);
  if (fishAt) {
    await chrome.click(fishAt.x, fishAt.y);
    const ate = await waitFor((s) => s.text === '1', 9000);
    check('clicking the fish sends the shark out to eat it, and that is a point', ate.text === '1' && ate.shown, JSON.stringify(ate));
    await chrome.sleep(3500);
    check('and it stays one point (the bite is counted once)', (await can()).text === '1');
  }

  // ---- The harpoon takes a point off ------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant&canscore=3&boat=now');
  await chrome.sleep(400);
  const hit = await waitFor((s) => s.clang, 16000, 80);
  check('the boat\'s harpoon hits the can', hit.clang, JSON.stringify(hit));
  await chrome.sleep(300);
  check('and that is a point off: 3 becomes 2', (await can()).text === '2', JSON.stringify(await can()));
  await waitFor((s) => !s.boat, 12000);

  await chrome.goto(BASE + '?speed=instant&canscore=1&boat=now');
  await chrome.sleep(400);
  await waitFor((s) => s.clang, 16000, 80);
  await chrome.sleep(300);
  const gone = await can();
  check('at the last point the harpoon takes the score away: the sticker comes off', !gone.shown && !gone.hasClass, JSON.stringify(gone));
  await waitFor((s) => !s.boat, 12000);
  await chrome.goto(BASE + '?speed=instant&boat=now');
  await chrome.sleep(400);
  await waitFor((s) => s.clang, 16000, 80);
  await chrome.sleep(300);
  check('a harpoon on a can with no score changes nothing (it does not go below nothing)', !(await can()).shown && (await can()).text === '0', JSON.stringify(await can()));
  await waitFor((s) => !s.boat, 12000);

  // ---- Being sick: everything the shark ate comes back up ---------------------------------------------------------
  const pieces = () => chrome.eval(`[...document.querySelectorAll('.sky .spew-piece')].map((el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, opacity: Number(getComputedStyle(el).opacity), chip: el.classList.contains('spew-chip'), svg: !!el.querySelector('svg') }; })`);
  const sharkNow = () => chrome.eval(`(() => { const c = document.querySelector('.trash-can'); return { heaving: c.classList.contains('heaving'), up: c.classList.contains('spitting'), word: !!c.querySelector('.spew-word'), green: getComputedStyle(c.querySelector('.shark')).filter }; })()`);
  const gridPress = async () => {
    const at = await chrome.centerOf('#grid');
    await chrome.click(at.x, at.y);
  };
  /** Watch for the first sign that something happened in the can, on the turtle or in the layer above everything, counted in window.__seen. */
  const watchForWhimsy = () => chrome.eval(`(() => {
    window.__seen = 0;
    new MutationObserver((records) => {
      for (const r of records) {
        const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (t?.closest('.sky, .turtle-sprite, .trash-can')) window.__seen += 1;
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] }); // (the turtle's bubbles are shown by un-hiding them)
  })()`);
  /** Wait up to this long for `test` of the pieces to hold, and give back the last list. */
  const waitForPieces = async (test, ms = 6000) => {
    let list = [];
    for (let waited = 0; waited < ms; waited += 80) {
      list = await pieces();
      if (test(list)) return list;
      await chrome.sleep(80);
    }
    return list;
  };

  await chrome.goto(BASE + '?speed=instant&surprise=spew');
  await chrome.sleep(500);
  await feedOneBlock();
  await chrome.sleep(1500);
  await feedOneBlock();
  await chrome.sleep(1800);
  check('before the grid changes the shark is just resting', await (async () => { const s = await sharkNow(); return !s.heaving && !s.word; })());
  await gridPress();
  let heave = null;
  for (let waited = 0; waited < 1500 && !(heave?.heaving && heave?.word); waited += 60) {
    heave = await sharkNow();
    await chrome.sleep(60);
  }
  check('changing the grid with two things in its belly makes the shark come up, heave, turn green and say blech', heave.heaving && heave.up && heave.word && /hue-rotate/.test(heave.green), JSON.stringify(heave));
  const out = await waitForPieces((list) => list.length >= 2, 4000);
  check('each thing it ate comes out of its mouth into the layer above everything: two stacks, two pieces', out.length === 2, JSON.stringify(out.map((p) => [Math.round(p.x), Math.round(p.y)])));
  await chrome.sleep(1900); // they have landed (and are lying there)
  const landed = await pieces();
  const win = await chrome.eval(`({ w: innerWidth, h: innerHeight })`);
  check('they land inside the window, near the can: out to the right of it and a little below the shark\'s mouth', landed.length === 2 && landed.every((p) => p.x >= 0 && p.x <= win.w && p.y >= 0 && p.y <= win.h && p.x < 520), JSON.stringify(landed.map((p) => [Math.round(p.x), Math.round(p.y)])));
  check('and they are small pictures of what it ate, not the stacks full size', landed.every((p) => p.w <= 80 && p.h <= 80 && p.w > 4 && p.h > 4), JSON.stringify(landed.map((p) => [Math.round(p.w), Math.round(p.h)])));
  check('the pictures are the blocks themselves (a small svg of the stack), not plain chips', landed.every((p) => p.svg && !p.chip), JSON.stringify(landed.map((p) => [p.svg, p.chip])));
  const settled = await sharkNow();
  check('the shark is done by then: it stops heaving and sinks', !settled.heaving && !settled.up && !settled.word, JSON.stringify(settled));
  let sawFade = false;
  let atEnd = landed;
  for (let waited = 0; waited < 7000 && atEnd.length > 0; waited += 80) {
    atEnd = await pieces();
    if (atEnd.some((p) => p.opacity > 0.05 && p.opacity < 0.95)) sawFade = true;
    await chrome.sleep(80);
  }
  check('they fade out by their opacity, not all at once, and then they are gone from the page', sawFade && atEnd.length === 0, `fade seen: ${sawFade}, left: ${atEnd.length}`);
  await gridPress();
  await chrome.sleep(900);
  const empty = await sharkNow();
  check('with nothing left in its belly, the next change of grid does not make it sick', !empty.heaving && !empty.word && (await pieces()).length === 0, JSON.stringify(empty));

  // A fish it ate comes back up as a fish.
  await chrome.goto(BASE + '?speed=instant&fish=now&surprise=spew');
  await chrome.sleep(900);
  const fishWas = await chrome.eval(`(() => { const f = document.querySelector('.sky .fish'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (fishWas) {
    await chrome.click(fishWas.x, fishWas.y);
    await waitFor((s) => s.text === '1', 9000);
    await chrome.sleep(3500); // the shark is home and resting again
    await gridPress();
    const fishBack = await waitForPieces((list) => list.length >= 1, 4000);
    check('a fish that the shark ate comes back up as a fish: its own picture, small', fishBack.length === 1 && fishBack[0].svg && !fishBack[0].chip && fishBack[0].w <= 80, JSON.stringify(fishBack));
  } else {
    check('?fish=now sends a fish to be eaten', false);
  }

  // The developer shortcut: ?antic=spew gives a shark that has eaten nothing three things to bring up, as chips.
  await chrome.goto(BASE + '?speed=instant&antic=spew');
  const trial = await waitForPieces((list) => list.length >= 3, 5000);
  check('?antic=spew makes a shark that has eaten nothing bring up three plain chips, for trying it out', trial.length === 3 && trial.every((p) => p.chip), JSON.stringify(trial.map((p) => p.chip)));
  await waitForPieces((list) => list.length === 0, 9000);

  // ---- Whimsy on every change of grid or paper --------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(500);
  await watchForWhimsy();
  const reacted = [];
  for (let press = 1; press <= 6; press += 1) {
    await chrome.eval(`window.__seen = 0`);
    await gridPress();
    let seen = 0;
    for (let waited = 0; waited < 1500 && seen === 0; waited += 60) {
      seen = await chrome.eval(`window.__seen`);
      await chrome.sleep(60);
    }
    reacted.push(seen > 0);
    await chrome.sleep(300);
  }
  check('every one of six presses of the grid button (white, whiteboard, graph, chalkboard, blueprint, blank, round the whole cycle) makes the turtle or the shark do something', reacted.every(Boolean), JSON.stringify(reacted));

  await chrome.goto(BASE + '?speed=instant&surprise=dance');
  await chrome.sleep(500);
  const dancing = () => chrome.eval(`document.querySelector('.turtle-sprite').classList.contains('pose-dance')`);
  check('before the grid changes the turtle is not dancing', (await dancing()) === false);
  await gridPress();
  await chrome.sleep(400);
  check('a press of the grid button makes it happen (?surprise=dance forces the dance, to be sure it is the one)', (await dancing()) === true);
  await chrome.sleep(3900); // the dance is over
  check('and it is over after a few seconds, like the others', (await dancing()) === false);
  const at = await chrome.centerOf('#grid');
  await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'right', buttons: 2, clickCount: 1 });
  await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'right', buttons: 0, clickCount: 1 });
  await chrome.sleep(250);
  const blueprint = await chrome.centerOf('.export-radio[data-format="paper:blueprint"]');
  await chrome.click(blueprint.x, blueprint.y);
  await chrome.sleep(400);
  check('choosing a grid or paper from the right-click menu does it too', (await dancing()) === true);
  await chrome.sleep(300);
  // moving the mouse (activity) does not end it: it is not an idle antic
  await chrome.mouse('mouseMoved', 700, 300, { buttons: 0 });
  await chrome.mouse('mouseMoved', 760, 340, { buttons: 0 });
  await chrome.sleep(300);
  check('moving the mouse afterwards does not stop it (it plays like a treat, not like an idle antic)', (await dancing()) === true);

  // ---- A computer that asked for calm ---------------------------------------------------------------------
  await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.goto(BASE + '?speed=instant&canscore=1');
  await chrome.sleep(500);
  await poke();
  await chrome.sleep(1200);
  const calm = await can();
  check('on a computer that asked for less motion, poking does nothing: no jiggle, no bubble, no visitor (and the sticker still shows the score)', !calm.visitor && calm.left === null && !calm.poked && calm.shown && calm.text === '1', JSON.stringify(calm));
  await chrome.goto(BASE + '?speed=instant');
  await chrome.sleep(500);
  await watchForWhimsy();
  await gridPress();
  await chrome.sleep(1500);
  check('on a computer that asked for less motion, changing the grid makes nothing happen: no dance, no bubbles, no fish, no shark', (await chrome.eval(`window.__seen`)) === 0, `${await chrome.eval(`window.__seen`)} changes`);
  await chrome.send('Emulation.setEmulatedMedia', { features: [] });

  // ---- Nothing is kept ------------------------------------------------------------------------------
  await chrome.goto(BASE + '?speed=instant', { keepStorage: true });
  await chrome.sleep(500);
  const afterReload = await can();
  check('the score is not kept: a page opened again starts with no sticker', !afterReload.shown && afterReload.text === '0', JSON.stringify(afterReload));
  check('and nothing was stored for it: no storage but the autosave', (await chrome.eval(`Object.keys(localStorage).filter((k) => k !== 'turtlelab-project').length`)) === 0 && (await chrome.eval(`sessionStorage.length`)) === 0);
  check('no console errors, exceptions or policy violations', chrome.problems.length === 0, chrome.problems.join(' | '));
} finally {
  await chrome.close();
}
console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
