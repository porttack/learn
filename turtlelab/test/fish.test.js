// Tests for js/ui/fish.js: when a fish comes, where it swims, how the shark watches it, and that it stays away when it should.
// The timing and the path are plain functions. The Fish class is run against small stand-ins for the page, so no browser is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_FISH_MS, NEXT_FISH_MS, SWIM_MS, TRY_AGAIN_MS, PEEK_DISTANCE, between, canSwim, swimPath, fishAt, gaze, isNear, Fish,
} from '../js/ui/fish.js';

const steady = (value) => () => value;

test('between picks a number in the range from random()', () => {
  assert.equal(between([10, 20], steady(0)), 10);
  assert.equal(between([10, 20], steady(0.5)), 15);
  assert.ok(between([10, 20], steady(0.999999)) < 20);
});

test('fish come now and then, not often: the first after half a minute to a minute and a half, then every one and a half to four minutes', () => {
  assert.deepEqual(FIRST_FISH_MS, [30000, 90000]);
  assert.deepEqual(NEXT_FISH_MS, [90000, 240000]);
  assert.ok(SWIM_MS >= 4000 && SWIM_MS <= 10000, 'a lazy swim, a few seconds');
  assert.ok(TRY_AGAIN_MS >= 5000);
});

test('a fish only comes at a good moment: nobody asked for calm, the tab shows, the blocks show and the shark is not busy', () => {
  const good = { calm: false, visible: true, blocksHidden: false, sharkBusy: false };
  assert.equal(canSwim(good), true);
  for (const key of ['calm', 'blocksHidden', 'sharkBusy']) assert.equal(canSwim({ ...good, [key]: true }), false, key);
  assert.equal(canSwim({ ...good, visible: false }), false, 'visible');
});

test('a swim crosses the strip above the can, left to right or right to left, starting and ending off the side', () => {
  for (const [first, direction] of [[0.1, 1], [0.9, -1]]) {
    const path = swimPath({ canTop: 400, canHeight: 130, random: steady(first) });
    assert.equal(path.direction, direction);
    assert.equal(Math.sign(path.to - path.from), direction);
    assert.ok(Math.min(path.from, path.to) < -40 && Math.max(path.from, path.to) > 200, 'enters and leaves off the sides');
    assert.ok(path.y >= 400 && path.y <= 400 + 130 * 0.3 + 1e-9, `at the height of the shark's room (${path.y})`);
  }
  // Never up off the top of a short window.
  assert.ok(swimPath({ canTop: -50, canHeight: 100, random: steady(0.5) }).y >= 70);
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

/** Just enough of a page: a stage, a can with a shark, timers and frames the test steps by hand. */
function setup({ calm = false, visible = true, random = steady(0.3), hidden = false, busy = false } = {}) {
  const log = { added: [], removed: 0, peek: [], look: [] };
  const element = () => ({
    className: '', innerHTML: '', style: {}, offsetWidth: 42, offsetHeight: 27, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    remove() { log.removed += 1; },
  });
  const globalDocument = globalThis.document;
  globalThis.document = { createElement: () => element() };
  const classes = new Set(busy ? ['eating'] : []);
  const stage = {
    classList: { contains: (name) => (name === 'blocks-hidden' ? hidden : false) },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 }),
    insertBefore(el, before) { log.added.push([el, before]); },
  };
  const trash = {
    el: { getBoundingClientRect: () => ({ left: 8, top: 450, width: 80, height: 128 }), classList: { contains: (name) => classes.has(name) } },
    setPeek(on) { log.peek.push(on); },
    look(at) { log.look.push(at); },
  };
  const timers = [];
  const frames = [];
  let clock = 0;
  const fish = new Fish({
    stage, trash, before: 'the blocks layer', random, calm: () => calm, visible: () => visible,
    now: () => clock, setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
    nextFrame: (fn) => frames.push(fn),
  });
  return {
    fish, log, timers, frames, classes,
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
    assert.equal(page.log.added.length, 1, 'a fish is on the page');
    const [element, before] = page.log.added[0];
    assert.equal(before, 'the blocks layer', 'under the blocks, like the can');
    assert.match(element.className, /\bfish\b/);
    assert.equal(element.attributes['aria-hidden'], 'true', 'for looking at only');
    assert.match(element.innerHTML, /<svg[^>]*class="fish-svg"/);
    assert.match(element.style.transform, /^translate\(/);
    // Frame by frame it moves, and the shark follows it.
    const places = [];
    for (let i = 0; i < 20; i += 1) {
      page.advance(SWIM_MS / 20 - 1);
      places.push(element.style.transform);
    }
    assert.ok(new Set(places).size > 15, 'it moves every frame');
    assert.ok(page.log.peek.includes(true), 'the shark looked up at some point');
    assert.ok(page.log.look.some((at) => at && at.x !== 0), 'and its eyes moved');
    assert.equal(page.log.removed, 0, 'still swimming');
    page.advance(SWIM_MS);
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
      assert.equal(page.log.added.length, 0, JSON.stringify(options));
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
    assert.equal(page.log.added.length, 1);
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

test('asking for a fish by hand also respects calm', () => {
  const page = setup({ calm: true });
  try {
    assert.equal(page.fish.swim(), false);
    assert.equal(page.log.added.length, 0);
  } finally {
    page.restore();
  }
});
