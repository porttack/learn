// Tests for js/ui/fish.js: when a fish comes, where it swims, how the shark watches it, what happens when it is clicked, and that it stays away
// when it should. The timing and the path are plain functions. The Fish class is run against small stand-ins for the page, so no browser is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_FISH_MS, NEXT_FISH_MS, FISH_SPEED, TRY_AGAIN_MS, PEEK_DISTANCE, between, canSwim, swimPath, fishAt, gaze, isNear, Fish,
} from '../js/ui/fish.js';
import { sky } from '../js/ui/sky.js';
import { OVER_MS } from '../js/ui/visitors.js';

const steady = (value) => () => value;

test('between picks a number in the range from random()', () => {
  assert.equal(between([10, 20], steady(0)), 10);
  assert.equal(between([10, 20], steady(0.5)), 15);
  assert.ok(between([10, 20], steady(0.999999)) < 20);
});

test('fish come now and then: the first after 20 to 60 seconds, then every minute to two and a half', () => {
  assert.deepEqual(FIRST_FISH_MS, [20000, 60000]);
  assert.deepEqual(NEXT_FISH_MS, [60000, 150000]);
  assert.ok(FISH_SPEED >= 60 && FISH_SPEED <= 200, 'a lazy swim');
  assert.ok(TRY_AGAIN_MS >= 5000);
});

test('a fish only comes at a good moment: nobody asked for calm, the tab shows, the blocks show and the shark is not busy', () => {
  const good = { calm: false, visible: true, blocksHidden: false, sharkBusy: false };
  assert.equal(canSwim(good), true);
  for (const key of ['calm', 'blocksHidden', 'sharkBusy']) assert.equal(canSwim({ ...good, [key]: true }), false, key);
  assert.equal(canSwim({ ...good, visible: false }), false, 'visible');
});

test('a swim crosses the whole window above the can, left to right or right to left, starting and ending off the side', () => {
  for (const [first, direction] of [[0.1, 1], [0.9, -1]]) {
    const path = swimPath({ canTop: 400, canHeight: 130, width: 1366, random: steady(first) });
    assert.equal(path.direction, direction);
    assert.equal(Math.sign(path.to - path.from), direction);
    assert.ok(Math.min(path.from, path.to) < -40 && Math.max(path.from, path.to) > 1366 + 40, 'enters and leaves off the sides of the whole window');
    assert.ok(path.y >= 400 && path.y <= 400 + 130 * 0.3 + 1e-9, `at the height of the shark's room (${path.y})`);
    assert.ok(Math.abs(Math.abs(path.to - path.from) / path.seconds - FISH_SPEED) < 1e-9, 'a steady, lazy speed');
  }
  // A narrow window is a short swim, a very wide one is not endless, and never up off the top of a short window.
  assert.equal(swimPath({ canTop: 400, canHeight: 130, width: 100, random: steady(0.1) }).seconds, 7);
  assert.equal(swimPath({ canTop: 400, canHeight: 130, width: 9000, random: steady(0.1) }).seconds, 20);
  assert.ok(swimPath({ canTop: -50, canHeight: 100, width: 1366, random: steady(0.5) }).y >= 70);
});

test('the fish goes steadily along its path and bobs a little up and down', () => {
  const path = { from: -70, to: 230, y: 480, direction: 1, bob: 6, waves: 3 };
  assert.deepEqual(fishAt(path, 0), { x: -70, y: 480, direction: 1 });
  assert.equal(fishAt(path, 1).x, 230);
  assert.equal(fishAt(path, 0.5).x, 80);
  let high = -Infinity;
  let low = Infinity;
  for (let t = 0; t <= 1; t += 0.01) {
    const spot = fishAt(path, t);
    high = Math.max(high, spot.y);
    low = Math.min(low, spot.y);
    assert.ok(Math.abs(spot.y - 480) <= 6 + 1e-9);
  }
  assert.ok(high - low > 10, 'it really bobs');
});

test('the shark\'s eyes follow the fish, a little way each side, and the shark looks up only when the fish is near', () => {
  const eyes = { x: 50, y: 500 };
  assert.deepEqual(gaze({ x: 50, y: 500 }, eyes), { x: 0, y: 0 });
  assert.deepEqual(gaze({ x: 500, y: 100 }, eyes), { x: 1, y: -1 }, 'far to the right and up, but never more than looking all the way');
  assert.deepEqual(gaze({ x: -500, y: 900 }, eyes), { x: -1, y: 1 });
  assert.ok(gaze({ x: 110, y: 500 }, eyes).x > 0 && gaze({ x: -10, y: 500 }, eyes).x < 0);
  assert.equal(isNear({ x: 50 + PEEK_DISTANCE - 1 }, { x: 50 }), true);
  assert.equal(isNear({ x: 50 - PEEK_DISTANCE + 1 }, { x: 50 }), true);
  assert.equal(isNear({ x: 50 + PEEK_DISTANCE + 1 }, { x: 50 }), false);
});

// ---- The Fish class, against stand-ins for the page ----------------------------------------------------------------

/** Just enough of a page: a stage, a window layer, a can with a shark, timers and frames the test steps by hand. */
function setup({ calm = false, visible = true, random = steady(0.3), hidden = false, busy = false, auto = true } = {}) {
  const log = { removed: 0, peek: [], look: [], hunts: [] };
  const element = () => {
    const el = {
      className: '', innerHTML: '', style: {}, offsetWidth: 42, offsetHeight: 27, attributes: {}, children: [], listeners: {}, classes: new Set(),
      getBoundingClientRect: () => ({ left: 300, top: 500, width: 42, height: 27 }),
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      append(...items) { this.children.push(...items); },
      classList: { add: (name) => el.classes.add(name) },
      remove() { log.removed += 1; },
    };
    return el;
  };
  const globalDocument = globalThis.document;
  globalThis.document = { body: element(), createElement: () => element() };
  const layer = sky();
  const already = layer.children.length;
  const classes = new Set(busy ? ['eating'] : []);
  const stage = { classList: { contains: (name) => (name === 'blocks-hidden' ? hidden : false) } };
  const trash = {
    el: { getBoundingClientRect: () => ({ left: 8, top: 450, width: 80, height: 128 }), classList: { contains: (name) => classes.has(name) } },
    setPeek(on) { log.peek.push(on); },
    look(at) { log.look.push(at); },
    hunt(target, calls) { log.hunts.push({ target, calls }); return true; },
  };
  const timers = [];
  const frames = [];
  let clock = 0;
  const fish = new Fish({
    stage, trash, auto, random, calm: () => calm, visible: () => visible, windowWidth: () => 1366,
    now: () => clock, setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
    nextFrame: (fn) => frames.push(fn),
  });
  return {
    fish, log, timers, frames, classes,
    added: () => layer.children.slice(already),
    restore: () => { globalThis.document = globalDocument; },
    live: () => timers.filter((t) => t.live),
    fire: () => { const timer = timers.filter((t) => t.live).at(-1); timer.live = false; timer.fn(); },
    advance: (ms) => { clock += ms; const run = frames.splice(0); run.forEach((fn) => fn()); },
  };
}

test('start waits for the first fish, and does nothing at all when calm was asked for', () => {
  const calm = setup({ calm: true });
  calm.fish.start();
  assert.equal(calm.timers.length, 0, 'no timer, so no fish ever');
  calm.restore();
  const normal = setup({ random: steady(0) });
  normal.fish.start();
  assert.equal(normal.live().length, 1);
  assert.equal(normal.live()[0].ms, FIRST_FISH_MS[0]);
  normal.restore();
});

test('a fish swims across, the shark peeks and looks, then the fish goes and the next one is waited for', () => {
  const page = setup();
  try {
    page.fish.start();
    page.fire(); // the timer for the first fish
    assert.equal(page.added().length, 1, 'a fish is on the page, in the layer above everything');
    const [element] = page.added();
    assert.match(element.className, /\bfish\b/);
    assert.equal(element.attributes['aria-hidden'], 'true', 'for looking at only');
    assert.match(element.innerHTML, /<svg[^>]*class="fish-svg"/);
    assert.match(element.style.transform, /^translate\(/);
    // Frame by frame it moves, and the shark follows it.
    const seconds = (1366 + 140) / FISH_SPEED;
    const places = [];
    for (let i = 0; i < 20; i += 1) {
      page.advance((seconds * 1000) / 20 - 1);
      places.push(element.style.transform);
    }
    assert.ok(new Set(places).size > 15, 'it moves every frame');
    assert.ok(page.log.peek.includes(true), 'the shark looked up at some point');
    assert.ok(page.log.look.some((at) => at && at.x !== 0), 'and its eyes moved');
    assert.equal(page.log.removed, 0, 'still swimming');
    page.advance(seconds * 1000);
    assert.equal(page.log.removed, 1, 'and gone at the end');
    assert.equal(page.log.peek.at(-1), false, 'the shark goes back down');
    assert.equal(page.log.look.at(-1), null, 'and looks straight ahead');
    const next = page.live();
    assert.equal(next.length, 1, 'the next fish is waited for');
    assert.ok(next[0].ms >= NEXT_FISH_MS[0] && next[0].ms <= NEXT_FISH_MS[1]);
  } finally {
    page.restore();
  }
});

test('if it is not a good moment the fish waits and tries again soon: hidden blocks, a busy shark, a hidden tab', () => {
  for (const options of [{ hidden: true }, { busy: true }, { visible: false }]) {
    const page = setup(options);
    try {
      page.fish.start();
      page.fire();
      assert.equal(page.added().length, 0, JSON.stringify(options));
      assert.equal(page.live().at(-1).ms, TRY_AGAIN_MS, 'it will try again');
    } finally {
      page.restore();
    }
  }
});

test('only one fish at a time, and stop takes the fish away and keeps more from coming', () => {
  const page = setup();
  try {
    assert.equal(page.fish.swim(), true);
    assert.equal(page.fish.swim(), false, 'one is already swimming');
    assert.equal(page.added().length, 1);
    page.fish.stop();
    assert.equal(page.log.removed, 1);
    assert.equal(page.live().length, 0, 'no timer left');
    page.fish.start();
    page.fish.stop();
    assert.equal(page.live().length, 0);
    assert.equal(page.fish.swim(), true, 'swim by hand still works (the address ?fish=now does that)');
  } finally {
    page.restore();
  }
});

test('no fish while the boat (or any other visitor to the shark) is here, and one comes once it has gone', () => {
  const page = setup();
  const boat = { el: {} };
  page.fish.others = [boat];
  try {
    assert.equal(page.fish.swim(), false);
    assert.equal(page.added().length, 0);
    boat.el = null;
    assert.equal(page.fish.swim(), true);
  } finally {
    page.restore();
  }
});

test('asking for a fish by hand also respects calm', () => {
  const page = setup({ calm: true });
  try {
    assert.equal(page.fish.swim(), false);
    assert.equal(page.added().length, 0);
  } finally {
    page.restore();
  }
});

test('the fish goes if the blocks (and so the shark) are hidden while it swims', () => {
  const page = setup();
  try {
    page.fish.swim();
    page.advance(500);
    assert.equal(page.log.removed, 0);
    page.fish.stage = { classList: { contains: (name) => name === 'blocks-hidden' } };
    page.advance(500);
    assert.equal(page.log.removed, 1);
    assert.equal(page.fish.el, null);
  } finally {
    page.restore();
  }
});

test('click the fish and it stops where it is while the shark swims out to it; when the shark is home the fish is gone and the next is waited for', () => {
  const page = setup();
  try {
    page.fish.swim();
    const [element] = page.added();
    assert.equal(typeof element.listeners.pointerdown, 'function', 'the fish takes clicks');
    page.advance(1000);
    const place = element.style.transform;
    let prevented = false;
    element.listeners.pointerdown({ preventDefault: () => { prevented = true; } });
    assert.ok(prevented);
    assert.equal(page.fish.eaten, true);
    assert.equal(page.log.hunts.length, 1, 'the shark is sent');
    assert.deepEqual(page.log.hunts[0].target, { x: 321, y: 513.5 }, 'to the middle of the fish');
    assert.equal(page.log.peek.at(-1), false, 'no more peeking at it');
    // It stays right where it was clicked, however long the shark takes.
    page.advance(1000);
    assert.equal(element.style.transform, place);
    assert.equal(page.log.removed, 0, 'still there');
    // A second click does nothing more.
    element.listeners.pointerdown({ preventDefault() {} });
    assert.equal(page.log.hunts.length, 1);
    // The jaws close on it: it goes under them and off the page.
    page.log.hunts[0].calls.onBite();
    assert.ok(element.classes.has('eaten'));
    const gulp = page.live().find((timer) => timer.ms === OVER_MS);
    assert.ok(gulp, 'a timer for it to spin down');
    gulp.live = false;
    gulp.fn();
    assert.equal(page.log.removed, 1);
    // The shark gets home: the next fish is waited for.
    assert.notEqual(page.fish.el, null, 'the fish is not finished with until the shark is home');
    page.log.hunts[0].calls.onDone();
    assert.equal(page.fish.el, null);
    assert.equal(page.fish.eaten, false);
    const next = page.live().at(-1);
    assert.ok(next.ms >= NEXT_FISH_MS[0] && next.ms <= NEXT_FISH_MS[1]);
  } finally {
    page.restore();
  }
});

test('a fish that is not automatic (a treat for working) never comes on its own, not at the start and not after one has gone, but swims when asked', () => {
  const page = setup({ auto: false });
  try {
    page.fish.start();
    assert.equal(page.timers.length, 0, 'no first fish is waited for');
    assert.equal(page.fish.swim(), true, 'asked for, it swims');
    page.advance((1366 + 140) / FISH_SPEED * 1000 + 100);
    assert.equal(page.log.removed, 1, 'and goes');
    assert.equal(page.live().length, 0, 'and no next one is waited for');
  } finally {
    page.restore();
  }
});
