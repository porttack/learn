// Tests for Trash.hunt in js/ui/trash.js: the shark swims out of the can to a clicked fish or boat, chomps, and swims home.
// The page is a small stand-in and time is a clock the test moves by hand, so no browser is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Trash, HUNT, swimTime } from '../js/ui/trash.js';
import { sky } from '../js/ui/sky.js';

function setup({ canShowing = true } = {}) {
  const element = () => {
    const classes = new Set();
    const el = {
      className: '', innerHTML: '', style: { props: {}, setProperty(k, v) { this.props[k] = v; }, removeProperty(k) { delete this.props[k]; } }, attributes: {}, children: [], removed: false,
      classList: { add: (...n) => n.forEach((x) => classes.add(x)), remove: (...n) => n.forEach((x) => classes.delete(x)), contains: (n) => classes.has(n), toggle: (n, on) => (on ? classes.add(n) : classes.delete(n)) },
      classes,
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...items) { this.children.push(...items); },
      addEventListener() {},
      remove() { this.removed = true; },
      // (whatever is looked for: the mouth, the score's sticker and its number, each a stand-in that can be written on)
      querySelector: () => ({
        getBoundingClientRect: () => (canShowing ? { left: 38, top: 480, width: 17, height: 11 } : { left: 0, top: 0, width: 0, height: 0 }),
        setAttribute() {}, textContent: '', classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      }),
      getBoundingClientRect: () => (canShowing ? { left: 8, top: 450, width: 80, height: 128 } : { left: 0, top: 0, width: 0, height: 0 }),
      offsetWidth: 80,
    };
    return el;
  };
  const before = { document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, matchMedia: globalThis.matchMedia };
  globalThis.document = { body: element(), createElement: () => element(), createElementNS: () => element() };
  let clock = 0;
  const jobs = [];
  globalThis.setTimeout = (fn, ms) => { jobs.push({ fn, at: clock + ms, live: true }); return jobs.length - 1; };
  globalThis.clearTimeout = (id) => { if (jobs[id]) jobs[id].live = false; };
  globalThis.matchMedia = undefined;
  const layer = sky();
  const already = layer.children.length;
  const stage = { insertBefore: () => {} };
  const trash = new Trash(stage, null, { random: () => 0 });
  return {
    trash,
    layer: () => layer.children.slice(already),
    swimmers: () => layer.children.slice(already),
    advance: (ms) => {
      const end = clock + ms;
      for (;;) {
        const next = jobs.filter((j) => j.live && j.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!next) break;
        clock = next.at;
        next.live = false;
        next.fn();
      }
      clock = end;
    },
    restore: () => Object.assign(globalThis, before),
  };
}

test('the shark comes up, a copy swims to the target and chomps, swims home, the real shark burps, sinks, and the sender is told', () => {
  const page = setup();
  try {
    const log = [];
    const home = page.trash.mouthPoint({ raised: true });
    const target = { x: 400, y: 440 };
    const ms = swimTime(Math.hypot(target.x - home.x, target.y - home.y));
    assert.equal(page.trash.hunt(target, { onBite: () => log.push('bite'), onDone: () => log.push('done') }), true);
    assert.ok(page.trash.el.classList.contains('hunting'), 'the shark comes up and the lid comes off');
    assert.equal(page.swimmers().length, 0, 'the copy is not out yet');
    assert.equal(page.trash.hunt(target), false, 'one trip at a time');

    page.advance(HUNT.RISE_MS);
    const [swimmer] = page.swimmers();
    assert.match(swimmer.className, /shark-swimmer/);
    assert.ok(page.trash.el.classList.contains('swimming-out'), 'the real shark hides while its copy is out');
    assert.ok(swimmer.classes.has('swimming'));
    assert.match(swimmer.style.transition, new RegExp(`transform ${ms}ms`));
    assert.equal(swimmer.style.props['--look-x'], '2.8px', 'eyes toward where it is going');
    const outward = swimmer.style.transform;

    page.advance(ms);
    assert.ok(swimmer.classes.has('chomp') && !swimmer.classes.has('swimming'), 'arrived: jaws going');
    assert.deepEqual(log, []);
    page.advance(HUNT.BITE_AT_MS);
    assert.deepEqual(log, ['bite'], 'the jaws close on it once');

    page.advance(HUNT.CHOMP_MS - HUNT.BITE_AT_MS);
    assert.ok(swimmer.classes.has('swimming'), 'turns for home');
    assert.notEqual(swimmer.style.transform, outward);
    assert.equal(swimmer.style.props['--look-x'], '-2.8px');

    page.advance(ms);
    assert.equal(swimmer.removed, true, 'home: the copy is gone');
    assert.ok(!page.trash.el.classList.contains('swimming-out'), 'and the real shark is there');
    assert.ok(page.trash.el.children.some((child) => /\bburp\b/.test(child.className)), 'with a full stomach, it burps');
    assert.deepEqual(log, ['bite']);

    page.advance(HUNT.BURP_HOLD_MS);
    assert.deepEqual(log, ['bite', 'done']);
    assert.ok(!page.trash.el.classList.contains('hunting'), 'the shark sinks and the lid goes back on');
    assert.equal(page.trash.trip, null);
  } finally {
    page.restore();
  }
});

test('with no can showing there is nowhere to swim from, so nothing happens and false comes back', () => {
  const page = setup({ canShowing: false });
  try {
    assert.equal(page.trash.hunt({ x: 400, y: 440 }, { onDone: () => assert.fail('never started') }), false);
    assert.equal(page.swimmers().length, 0);
  } finally {
    page.restore();
  }
});

test('a block dropped on the can (or held over it) calls the shark home at once, and the sender is still told, once', () => {
  for (const interrupt of [(t) => t.feed(), (t) => t.setHungry(true), (t) => t.spit(500), (t) => t.snap()]) {
    const page = setup();
    try {
      let done = 0;
      page.trash.hunt({ x: 400, y: 440 }, { onDone: () => { done += 1; } });
      page.advance(HUNT.RISE_MS + 100);
      const [swimmer] = page.swimmers();
      interrupt(page.trash);
      assert.equal(done, 1);
      assert.equal(swimmer.removed, true);
      assert.ok(!page.trash.el.classList.contains('hunting') && !page.trash.el.classList.contains('swimming-out'));
      page.advance(20000);
      assert.equal(done, 1, 'told only once, and the old timers do nothing more');
    } finally {
      page.restore();
    }
  }
});

// ---- The score on the can, and poking it ---------------------------------------------------------------------------

test('each thing the shark eats is a point on the can: a block thrown in, and a fish or boat it swims out to eat when the jaws close on it', () => {
  const page = setup();
  try {
    assert.equal(page.trash.points, 0);
    assert.ok(!page.trash.el.classList.contains('has-score'), 'no sticker with no score');
    page.trash.feed();
    assert.equal(page.trash.points, 1);
    assert.ok(page.trash.el.classList.contains('has-score'));
    page.trash.feed();
    assert.equal(page.trash.points, 2);
    page.advance(2000);
    const home = page.trash.mouthPoint({ raised: true });
    const target = { x: 400, y: 440 };
    const ms = swimTime(Math.hypot(target.x - home.x, target.y - home.y));
    assert.equal(page.trash.hunt(target), true);
    page.advance(HUNT.RISE_MS + ms);
    assert.equal(page.trash.points, 2, 'not yet: the jaws have not closed');
    page.advance(HUNT.BITE_AT_MS);
    assert.equal(page.trash.points, 3, 'the bite is the point');
    page.advance(5000);
    assert.equal(page.trash.points, 3, 'and only one');
  } finally { page.restore(); }
});

test('a harpoon on the can takes a point off, and at the last point the sticker comes off', () => {
  const page = setup();
  try {
    page.trash.setScore(2);
    assert.ok(page.trash.el.classList.contains('has-score'));
    page.trash.clang();
    assert.equal(page.trash.points, 1);
    assert.ok(page.trash.el.classList.contains('has-score'));
    page.trash.clang();
    assert.equal(page.trash.points, 0);
    assert.ok(!page.trash.el.classList.contains('has-score'), 'zero is no sticker');
    page.trash.clang();
    assert.equal(page.trash.points, 0, 'a harpoon with no score does not go below nothing');
    page.trash.feed();
    assert.equal(page.trash.points, 1, 'the next meal starts it again');
  } finally { page.restore(); }
});

test('poking: as many quick pokes as the score call a visitor; a slow poke starts the count again; with no score one poke does', () => {
  const page = setup();
  try {
    let now = 0;
    page.trash.now = () => now;
    const sent = [];
    page.trash.onSummon = () => { sent.push(now); return true; };
    page.trash.setScore(3);
    page.trash.poke();
    now = 400;
    page.trash.poke();
    assert.deepEqual(sent, [], 'two pokes of three');
    assert.equal(page.trash.leftLabel.textContent, '1 more', 'and it says so');
    now = 800;
    page.trash.poke();
    assert.deepEqual(sent, [800], 'the third calls a visitor');
    assert.equal(page.trash.leftLabel, null, 'no bubble when one comes');
    now = 1000;
    page.trash.poke();
    now = 5000; // a long pause
    page.trash.poke();
    assert.deepEqual(sent, [800], 'the pause started the count again');
    assert.equal(page.trash.leftLabel.textContent, '2 more');
    page.trash.setScore(0);
    now = 9000;
    page.trash.poke();
    assert.deepEqual(sent, [800, 9000], 'with no score one poke is enough');
  } finally { page.restore(); }
});

test('if no visitor can come just now (one is already out), the can says so, and on a computer that asked for calm poking does nothing at all', () => {
  const page = setup();
  try {
    page.trash.onSummon = () => false;
    page.trash.poke();
    assert.equal(page.trash.leftLabel.textContent, 'not now');
    page.trash.showLeft(null);
    globalThis.matchMedia = () => ({ matches: true });
    let asked = 0;
    page.trash.onSummon = () => { asked += 1; return true; };
    page.trash.poke();
    assert.equal(asked, 0);
    assert.equal(page.trash.leftLabel, null);
  } finally { page.restore(); }
});


// ---- Being sick: everything the shark ate comes back up ---------------------------------------------------------------

import { SPEW } from '../js/ui/spew.js';

const stackMeal = () => ({ node: { nodeName: 'g', removeAttribute() {} }, width: 120, height: 200 });
const fishMeal = () => ({ node: { nodeName: 'svg', attrs: {}, setAttribute(n, v) { this.attrs[n] = v; } }, width: 60, height: 30 });

test('the shark remembers what it ate: stacks thrown in, and fish and boats it was sent after', () => {
  const page = setup();
  try {
    assert.equal(page.trash.hasMeals(), false);
    assert.equal(page.trash.canSpew(), false, 'nothing eaten, nothing to bring up');
    page.trash.feed(stackMeal());
    page.trash.feed();
    assert.equal(page.trash.meals.count, 2, 'a stack with no picture (nobody to see it) is remembered too');
    page.advance(2000);
    page.trash.hunt({ x: 400, y: 440 }, { meal: fishMeal() });
    page.advance(HUNT.RISE_MS);
    assert.equal(page.trash.meals.count, 2, 'the fish is not eaten until the jaws close on it');
    page.advance(3000);
    assert.equal(page.trash.meals.count, 3, 'a fish that was eaten');
    assert.equal(page.trash.canSpew(), true);
  } finally {
    page.restore();
  }
});

test('an Undo that brings a stack back takes it out of the shark', () => {
  const page = setup();
  try {
    page.trash.feed(stackMeal());
    page.trash.feed(fishMeal());
    page.trash.spit(500);
    assert.equal(page.trash.meals.count, 1);
    assert.equal(page.trash.meals.takeAll()[0].width, 120, 'the one that went back is the latest');
  } finally {
    page.restore();
  }
});

test('the shark is sick: it comes up green and heaving, says blech, and each thing it ate comes out in turn, lands in the layer above everything, and fades away', () => {
  const page = setup();
  try {
    page.trash.feed(stackMeal());
    page.trash.feed(fishMeal());
    page.trash.feed(null);
    page.advance(2000);
    const started = page.trash.spew();
    assert.ok(started, 'it could be sick');
    assert.equal(page.trash.meals.count, 0, 'and it is empty now');
    assert.equal(page.trash.canSpew(), false, 'so it cannot be sick again until it has eaten something');
    for (const name of ['spitting', 'heaving']) assert.ok(page.trash.el.classList.contains(name), name);
    assert.ok(page.trash.el.children.some((child) => child.className === 'spew-word' && child.textContent === 'blech!'), 'it says blech');
    assert.equal(page.layer().length, 0, 'nothing has come out yet: it heaves first');
    page.advance(SPEW.HEAVE_MS);
    assert.equal(page.layer().length, 1, 'the first thing');
    page.advance(SPEW.STAGGER_MS);
    assert.equal(page.layer().length, 2);
    page.advance(SPEW.STAGGER_MS);
    assert.equal(page.layer().length, 3, 'all three, one after another');
    assert.ok(page.layer().every((piece) => /spew-piece/.test(piece.className)));
    assert.ok(page.layer().some((piece) => /spew-chip/.test(piece.className)), 'a thing with no picture is a plain chip');
    assert.ok(page.layer().every((piece) => piece.style.transform.includes('translate(') && piece.style.width && piece.style.height));
    page.advance(600);
    assert.ok(!page.trash.el.classList.contains('heaving'), 'the shark is done a moment after the last thing is out');
    assert.ok(!page.trash.el.classList.contains('spitting'));
    assert.ok(page.trash.el.children.find((child) => child.className === 'spew-word').removed, 'and the word is gone');
    assert.ok(page.layer().every((piece) => !piece.removed), 'while the things are still lying there');
    page.advance(6000);
    assert.ok(page.layer().every((piece) => piece.removed), 'and then they have faded and are gone');
    assert.ok(started.ms >= SPEW.HEAVE_MS + 2 * SPEW.STAGGER_MS + SPEW.FADE_MS, `it says how long it takes: ${started.ms}`);
  } finally {
    page.restore();
  }
});

test('a fish or a boat it ate comes up as its own picture, a stack as its blocks in a small picture of their own', () => {
  const page = setup();
  try {
    const fish = fishMeal();
    page.trash.feed(stackMeal());
    page.trash.feed(fish);
    page.advance(2000);
    page.trash.spew();
    page.advance(SPEW.HEAVE_MS + SPEW.STAGGER_MS + 10);
    const [block, fishPiece] = page.layer();
    assert.equal(block.children.length, 1, 'the stack is wrapped in an svg to be drawn in');
    assert.equal(fishPiece.children[0], fish.node, 'the fish is its own picture');
    assert.equal(fish.node.attrs.width, String(fishPiece.style.width.replace('px', '')), 'drawn small');
    assert.ok(parseFloat(fishPiece.style.width) <= 46 + 1e-9 && parseFloat(block.style.height) <= 46 + 1e-9, 'no bigger than the others');
  } finally {
    page.restore();
  }
});

test('the shark is not sick when it has eaten nothing, when it is busy, when the can is not showing, or when the computer asked for calm', () => {
  const empty = setup();
  try {
    assert.equal(empty.trash.spew(), false);
    assert.equal(empty.layer().length, 0);
  } finally {
    empty.restore();
  }
  const hidden = setup({ canShowing: false });
  try {
    hidden.trash.feed(null);
    assert.equal(hidden.trash.spew(), false, 'the can is not showing');
    assert.equal(hidden.trash.meals.count, 1, 'and it keeps what it ate');
  } finally {
    hidden.restore();
  }
  const busy = setup();
  try {
    busy.trash.feed(null);
    busy.trash.setHungry(true);
    assert.equal(busy.trash.spew(), false, 'a block is being held over it');
    busy.trash.setHungry(false);
    busy.advance(2000);
    globalThis.matchMedia = () => ({ matches: true });
    assert.equal(busy.trash.spew(), false, 'calm was asked for');
    assert.equal(busy.trash.meals.count, 1, 'and nothing was lost');
    globalThis.matchMedia = undefined;
    assert.ok(busy.trash.spew(), 'later it can');
  } finally {
    busy.restore();
  }
});

test('if the shark is fed or sent after a fish while it heaves, the heaving stops at once and the things already out carry on', () => {
  const page = setup();
  try {
    page.trash.feed(null);
    page.advance(2000);
    page.trash.spew();
    page.advance(SPEW.HEAVE_MS + 10);
    assert.equal(page.layer().length, 1);
    page.trash.feed(stackMeal());
    assert.ok(!page.trash.el.classList.contains('heaving'));
    assert.ok(page.trash.el.classList.contains('eating'), 'it eats again');
    assert.ok(!page.layer()[0].removed, 'what was already out is still fading');
    assert.equal(page.trash.meals.count, 1, 'and it has eaten something new');
  } finally {
    page.restore();
  }
});
