// Tests for js/ui/boat.js: the timeline of the boat's visit, where the boat and the harpoon are at each moment, and that the Boat class
// plays it through (the shark peeks, clangs and snaps in the right order) and stays away when it should. Stand-ins replace the page.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASES, TOTAL, FIRST_BOAT_MS, NEXT_BOAT_MS, TRY_AGAIN_MS, between, canSail, phaseAt, boatAt, spearAt, Boat,
} from '../js/ui/boat.js';
import { FIRST_FISH_MS } from '../js/ui/fish.js';
import { sky } from '../js/ui/sky.js';
import { OVER_MS } from '../js/ui/visitors.js';

const steady = (value) => () => value;

test('the visit is a fixed list of parts, a little over ten seconds in all', () => {
  assert.deepEqual(PHASES.map(([name]) => name), ['arrive', 'watch', 'throw', 'stuck', 'reel', 'snap', 'leave']);
  assert.ok(TOTAL > 9 && TOTAL < 15, `${TOTAL} seconds`);
  assert.ok(PHASES.every(([, seconds]) => seconds > 0));
});

test('phaseAt says which part it is and how far through, and "done" at the end', () => {
  assert.deepEqual(phaseAt(0), { name: 'arrive', u: 0, start: 0 });
  let start = 0;
  for (const [name, seconds] of PHASES) {
    const middle = phaseAt(start + seconds / 2);
    assert.equal(middle.name, name);
    assert.ok(Math.abs(middle.u - 0.5) < 1e-9, name);
    assert.equal(phaseAt(start + seconds - 1e-6).name, name, `the end of ${name} is still ${name}`);
    start += seconds;
  }
  assert.equal(phaseAt(TOTAL).name, 'done');
  assert.equal(phaseAt(TOTAL + 100).name, 'done');
  assert.equal(phaseAt(-1).name, 'arrive');
});

test('boats come rarely, rarer than fish, and a boat is not a good idea at a bad moment', () => {
  assert.ok(FIRST_BOAT_MS[0] >= FIRST_FISH_MS[1], 'the first boat is later than the first fish could be');
  assert.ok(NEXT_BOAT_MS[0] >= 120000, 'a couple of minutes at the least between boats');
  assert.ok(TRY_AGAIN_MS >= 5000);
  const good = { calm: false, visible: true, blocksHidden: false, sharkBusy: false };
  assert.equal(canSail(good), true);
  for (const key of ['calm', 'blocksHidden', 'sharkBusy']) assert.equal(canSail({ ...good, [key]: true }), false, key);
  assert.equal(canSail({ ...good, visible: false }), false);
  assert.equal(between([10, 20], steady(0.5)), 15);
});

test('the boat sails in from off the edge and slows to a stop, waits, then turns and sails off faster the way it came', () => {
  const course = { from: 1500, stop: 300 };
  assert.equal(boatAt(0, course).x, 1500);
  assert.equal(boatAt(0, course).facing, 1, 'facing left, the way it sails in');
  const arriveEnd = PHASES[0][1];
  assert.ok(Math.abs(boatAt(arriveEnd, course).x - 300) < 1e-6, 'stops where it should');
  let previous = Infinity;
  for (let t = 0; t <= arriveEnd; t += 0.1) {
    const { x } = boatAt(t, course);
    assert.ok(x <= previous + 1e-9, 'only ever moves left on the way in');
    previous = x;
  }
  // It slows as it comes in: the last half second covers less than the first.
  assert.ok(boatAt(0.5, course).x - boatAt(0, course).x < 0 && Math.abs(boatAt(arriveEnd, course).x - boatAt(arriveEnd - 0.5, course).x) < Math.abs(boatAt(0.5, course).x - boatAt(0, course).x));
  // Waiting: it stays put (and bobs).
  const waiting = PHASES[0][1] + 0.4;
  assert.ok(Math.abs(boatAt(waiting, course).x - 300) < 1e-9);
  // Leaving: faces the other way, speeds up, and is gone off the edge at the end.
  const leaveStart = TOTAL - PHASES[6][1];
  assert.equal(boatAt(leaveStart + 0.5, course).facing, -1);
  assert.ok(boatAt(TOTAL - 1e-6, course).x > 1400);
  assert.ok(boatAt(leaveStart + 1, course).x - 300 < boatAt(TOTAL - 1, course).x - boatAt(TOTAL - 2, course).x + 400, 'it speeds up');
  assert.ok(Math.abs(boatAt(0, course).bob) < 1e-9);
  assert.ok([0.5, 1.7, 3.1, 6.2].some((t) => Math.abs(boatAt(t, course).bob) > 0.5), 'it bobs on the water');
});

test('the harpoon is on the boat until it is thrown, flies in an arc to the target, sticks, and is hauled back, with its rope out all that time', () => {
  const hand = { x: 400, y: 440 };
  const target = { x: 60, y: 520 };
  const at = (part, u) => {
    let start = 0;
    for (const [name, seconds] of PHASES) {
      if (name === part) return start + seconds * u;
      start += seconds;
    }
    return NaN;
  };
  for (const part of ['arrive', 'watch']) assert.deepEqual([spearAt(at(part, 0.5), hand, target).visible, spearAt(at(part, 0.5), hand, target).rope], [false, false], part);
  const begin = spearAt(at('throw', 0), hand, target);
  assert.ok(begin.visible && begin.rope);
  assert.ok(Math.abs(begin.x - hand.x) < 1 && Math.abs(begin.y - hand.y) < 1, 'it starts in the hand');
  const end = spearAt(at('throw', 1) - 1e-6, hand, target);
  assert.ok(Math.abs(end.x - target.x) < 1 && Math.abs(end.y - target.y) < 1, 'and lands on the target');
  // It arches: in the middle of the throw it is higher up (a smaller y) than the straight line between the two.
  const middle = spearAt(at('throw', 0.5), hand, target);
  const straightY = hand.y + (target.y - hand.y) * ((middle.x - hand.x) / (target.x - hand.x));
  assert.ok(middle.y < straightY - 10, `${middle.y} against ${straightY}`);
  // Flying left and down, it points left.
  assert.ok(Math.abs(end.angle) > 90 || end.angle < -90 || Math.cos((end.angle * Math.PI) / 180) < 0, `points left (${end.angle})`);
  // Stuck: stays at the target.
  for (const u of [0, 0.5, 0.99]) {
    const stuck = spearAt(at('stuck', u), hand, target);
    assert.ok(Math.hypot(stuck.x - target.x, stuck.y - target.y) < 1 && stuck.visible && stuck.rope, `stuck ${u}`);
  }
  // Reeled in: back to the hand, along the straight rope.
  const out = spearAt(at('reel', 0.001), hand, target);
  assert.ok(Math.hypot(out.x - target.x, out.y - target.y) < 2);
  const back = spearAt(at('reel', 0.999), hand, target);
  assert.ok(Math.hypot(back.x - hand.x, back.y - hand.y) < 4);
  for (const part of ['snap', 'leave']) assert.equal(spearAt(at(part, 0.5), hand, target).visible, false, part);
  assert.equal(spearAt(TOTAL + 5, hand, target).visible, false);
});

// ---- The Boat class, against stand-ins for the page ----------------------------------------------------------------

function setup({ calm = false, visible = true, random = steady(0.3), hidden = false, shark = [], others = [], auto = true } = {}) {
  const log = [];
  const huntCalls = [];
  const makeElement = () => {
    const el = {
      className: '', innerHTML: '', style: {}, attributes: {}, offsetWidth: 90, offsetHeight: 58, children: [], removed: false, listeners: {}, classes: new Set(),
      setAttribute(name, value) { this.attributes[name] = value; },
      getBoundingClientRect: () => ({ left: 900, top: 480, width: 90, height: 58 }),
      addEventListener(type, fn) { this.listeners[type] = fn; },
      classList: { add: (name) => el.classes.add(name) },
      append(...items) { this.children.push(...items); },
      remove() { this.removed = true; },
      querySelector: (selector) => (el.parts[selector] ??= { attributes: {}, setAttribute(n, v) { this.attributes[n] = v; }, cloneNode() { return { picture: selector }; } }),
      parts: {},
    };
    return el;
  };
  const before = globalThis.document;
  globalThis.document = { body: makeElement(), createElement: () => makeElement(), createElementNS: () => makeElement() };
  const layer = sky();
  const already = layer.children.length;
  const classes = new Set(shark);
  const stage = {
    classList: { contains: (name) => (name === 'blocks-hidden' ? hidden : false) },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1366, height: 613 }),
  };
  const trash = {
    el: { getBoundingClientRect: () => ({ left: 8, top: 480, width: 80, height: 128 }), classList: { contains: (name) => classes.has(name) } },
    setPeek: (on) => log.push(`peek ${on}`), look: (at) => log.push(at ? 'look' : 'look away'), clang: () => log.push('clang'), snap: () => log.push('snap'),
    hunt: (target, calls) => { huntCalls.push({ target, calls }); log.push('hunt'); return true; },
  };
  const timers = [];
  const frames = [];
  let clock = 0;
  const boat = new Boat({
    stage, trash, others, auto, random, calm: () => calm, visible: () => visible, windowSize: () => ({ w: 1366, h: 613 }),
    now: () => clock, setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
    nextFrame: (fn) => frames.push(fn),
  });
  return {
    boat, log, huntCalls, timers, restore: () => { globalThis.document = before; },
    added: () => layer.children.slice(already),
    live: () => timers.filter((t) => t.live),
    fire: () => { const t = timers.filter((x) => x.live).at(-1); t.live = false; t.fn(); },
    advance: (seconds) => { clock += seconds * 1000; frames.splice(0).forEach((fn) => fn()); },
  };
}

test('start waits for the first boat (minutes), and does nothing at all when calm was asked for', () => {
  const calm = setup({ calm: true });
  try {
    calm.boat.start();
    assert.equal(calm.timers.length, 0);
  } finally { calm.restore(); }
  const normal = setup({ random: steady(0) });
  try {
    normal.boat.start();
    assert.deepEqual(normal.live().map((t) => t.ms), [FIRST_BOAT_MS[0]]);
  } finally { normal.restore(); }
});

test('the visit goes: sail in, the shark peeks and looks, the harpoon clangs on the can, the shark snaps, the boat leaves, and the next is waited for', () => {
  const page = setup();
  try {
    page.boat.start();
    page.fire();
    const [boatEl, linesEl] = page.added();
    assert.match(boatEl.className, /\bboat\b/);
    assert.equal(boatEl.attributes['aria-hidden'], 'true');
    assert.match(boatEl.innerHTML, /<svg[^>]*class="boat-svg"/);
    assert.deepEqual(page.log, [], 'the shark does nothing while the boat is still sailing in');
    // Step through the visit in tenths of a second.
    const xs = [];
    for (let t = 0; t < TOTAL + 0.5; t += 0.1) {
      page.advance(0.1);
      xs.push(boatEl.style.transform);
    }
    const order = page.log.filter((entry) => ['clang', 'snap'].includes(entry) || entry === 'peek true' || entry === 'peek false');
    assert.deepEqual([...new Set(order)], ['peek true', 'clang', 'peek false', 'snap'], page.log.join(' | '));
    assert.equal(page.log.filter((entry) => entry === 'clang').length, 1, 'one clang');
    assert.equal(page.log.filter((entry) => entry === 'snap').length, 1, 'one snap');
    assert.ok(page.log.includes('look') && page.log.at(-1) === 'look away', 'the eyes follow the boat, then look ahead again');
    assert.ok(new Set(xs).size > 40, 'it moves along');
    assert.equal(boatEl.removed, true, 'the boat is gone at the end');
    assert.equal(linesEl.removed, true, 'and so is the harpoon line');
    const next = page.live();
    assert.equal(next.length, 1);
    assert.ok(next[0].ms >= NEXT_BOAT_MS[0] && next[0].ms <= NEXT_BOAT_MS[1]);
  } finally { page.restore(); }
});

test('no boat at a bad moment, and none while the shark is busy or a fish is swimming', () => {
  for (const options of [{ hidden: true }, { visible: false }, { shark: ['eating'] }, { shark: ['peek'] }, { shark: ['dreaming'] }, { others: [{ el: {} }] }]) {
    const page = setup(options);
    try {
      page.boat.start();
      page.fire();
      assert.equal(page.added().length, 0, JSON.stringify(options));
      assert.equal(page.live().at(-1).ms, TRY_AGAIN_MS, 'it tries again soon');
    } finally { page.restore(); }
  }
});

test('only one boat at a time, stop takes it away, and by-hand sailing also respects calm', () => {
  const page = setup();
  try {
    assert.equal(page.boat.sail(), true);
    assert.equal(page.boat.sail(), false, 'one at a time');
    page.boat.stop();
    assert.equal(page.added()[0].removed, true);
    assert.equal(page.live().length, 0);
    assert.equal(page.log.at(-1), 'look away');
  } finally { page.restore(); }
  const calm = setup({ calm: true });
  try {
    assert.equal(calm.boat.sail(), false);
  } finally { calm.restore(); }
});

test('click the boat and it stops where it is (the harpoon goes) while the shark swims out to it; when the shark is home the boat is gone and the next is waited for', () => {
  const page = setup();
  try {
    page.boat.start();
    page.fire();
    const [boatEl, linesEl] = page.added();
    assert.equal(typeof boatEl.listeners.pointerdown, 'function', 'the boat takes clicks');
    page.advance(2);
    const place = boatEl.style.transform;
    let prevented = false;
    boatEl.listeners.pointerdown({ preventDefault: () => { prevented = true; } });
    assert.ok(prevented);
    assert.equal(page.boat.eaten, true);
    assert.equal(linesEl.removed, true, 'the harpoon and rope go at once');
    assert.equal(page.huntCalls.length, 1, 'the shark is sent');
    assert.deepEqual(page.huntCalls[0].target, { x: 945, y: 509 }, 'to the middle of the boat');
    // It stays right where it was clicked, and the rest of the visit (clang, snap) never happens.
    page.advance(5);
    assert.equal(boatEl.style.transform, place);
    assert.equal(page.log.includes('clang') || page.log.includes('snap'), false);
    // A second click does nothing more.
    boatEl.listeners.pointerdown({ preventDefault() {} });
    assert.equal(page.huntCalls.length, 1);
    // The jaws close on it, it goes; when the shark is home the boat is finished with and the next is waited for.
    page.huntCalls[0].calls.onBite();
    assert.ok(boatEl.classes.has('eaten'));
    assert.equal(page.boat.el !== null, true);
    page.huntCalls[0].calls.onDone();
    assert.equal(boatEl.removed, true);
    assert.equal(page.boat.el, null);
    assert.equal(page.boat.eaten, false);
    const next = page.live().at(-1);
    assert.ok(next.ms >= NEXT_BOAT_MS[0] && next.ms <= NEXT_BOAT_MS[1]);
  } finally { page.restore(); }
});

test('a boat that is not automatic (a treat for working) never comes on its own, not at the start and not after one has gone, but sails when asked', () => {
  const page = setup({ auto: false });
  try {
    page.boat.start();
    assert.equal(page.timers.length, 0, 'no first boat is waited for');
    assert.equal(page.boat.sail(), true, 'asked for, it sails');
    page.advance(TOTAL + 0.5);
    assert.equal(page.added()[0].removed, true, 'and goes');
    assert.equal(page.live().length, 0, 'and no next one is waited for');
  } finally { page.restore(); }
});
