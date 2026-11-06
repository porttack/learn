// Tests for js/ui/idle.js: when the little idle antics happen, which one, and that any activity or a bad moment stops them.
// Fake timers stand in for the clock, so a minute takes no time.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDLE_MS, GAP_MS, RETRY_MS, BREATH_AFTER_MS, between, pickAntic, Idle } from '../js/ui/idle.js';

const steady = (value) => () => value;

test('an antic comes after a minute of quiet, and then every so often while it stays quiet', () => {
  assert.equal(IDLE_MS, 30000, 'half a minute of quiet (it was 45 seconds: the user asked for a bit more often)');
  assert.ok(GAP_MS[0] >= 20000 && GAP_MS[1] > GAP_MS[0] && GAP_MS[1] <= 50000, 'a pause of 20 to 50 seconds between one and the next, not a constant stream');
  assert.ok(RETRY_MS >= 5000);
  assert.equal(between([10, 20], steady(0)), 10);
  assert.equal(between([10, 20], steady(0.5)), 15);
});

test('the choice favors the more likely antics, can be any of them, and gives null when there are none', () => {
  const a = { name: 'a', weight: 3 };
  const b = { name: 'b', weight: 1 };
  assert.equal(pickAntic([a, b], steady(0)), a);
  assert.equal(pickAntic([a, b], steady(0.74)), a);
  assert.equal(pickAntic([a, b], steady(0.76)), b);
  assert.equal(pickAntic([a, b], steady(0.9999)), b);
  assert.equal(pickAntic([], steady(0.5)), null);
  assert.equal(pickAntic([{ name: 'z', weight: 0 }], steady(0.5)), null);
  // Over many rolls the shares are about right.
  let seed = 11;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 4000; i += 1) counts[pickAntic([a, b], random).name] += 1;
  assert.ok(Math.abs(counts.a / 4000 - 0.75) < 0.04, JSON.stringify(counts));
});

/** An Idle with fake timers and antics that note when they start and stop. */
function setup({ calm = false, visible = true, busy = false, can = true, random = steady(0.1) } = {}) {
  const log = [];
  const timers = [];
  const state = { calm, visible, busy, can };
  const antic = (name, weight, ms = 3000) => ({ name, weight, can: () => state.can, play: () => { log.push(`start ${name}`); return { ms, stop: () => log.push(`stop ${name}`) }; } });
  const idle = new Idle({
    antics: [antic('dance', 1), antic('yawn', 1)],
    busy: () => state.busy, calm: () => state.calm, visible: () => state.visible, random,
    setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; },
    clearTimer: (id) => { if (id !== null && timers[id]) timers[id].live = false; },
  });
  return {
    idle, log, timers, state,
    live: () => timers.filter((t) => t.live),
    fire: () => { const t = timers.filter((x) => x.live).at(-1); t.live = false; t.fn(); },
  };
}

test('nothing happens at first: the timer is a minute, and when it is up one antic plays', () => {
  const page = setup();
  page.idle.start();
  assert.deepEqual(page.live().map((t) => t.ms), [IDLE_MS]);
  assert.deepEqual(page.log, []);
  page.fire();
  assert.deepEqual(page.log, ['start dance']);
  assert.equal(page.live().length, 1, 'and a timer for how long it lasts');
  assert.equal(page.live()[0].ms, 3000);
});

test('when an antic has run its course it stops, and the next is a longer pause away', () => {
  const page = setup();
  page.idle.start();
  page.fire();
  page.fire(); // its own length is up
  assert.deepEqual(page.log, ['start dance', 'stop dance']);
  const next = page.live();
  assert.equal(next.length, 1);
  assert.ok(next[0].ms >= GAP_MS[0] && next[0].ms <= GAP_MS[1]);
  page.fire();
  assert.equal(page.log.at(-1), 'start dance', 'and it happens again');
});

test('any activity stops an antic at once and starts the minute over', () => {
  const page = setup();
  page.idle.start();
  page.fire();
  page.idle.poke();
  assert.deepEqual(page.log, ['start dance', 'stop dance'], 'stopped right away');
  assert.deepEqual(page.live().map((t) => t.ms), [IDLE_MS], 'and the whole quiet time to wait again');
  // Activity while nothing is playing just restarts the minute.
  page.idle.poke();
  assert.deepEqual(page.live().map((t) => t.ms), [IDLE_MS]);
  assert.equal(page.log.length, 2);
});

test('at a bad moment nothing happens and it looks again soon: a program running, the tab hidden, nothing possible', () => {
  for (const [key, value] of [['busy', true], ['visible', false], ['can', false]]) {
    const page = setup({ [key]: value });
    page.idle.start();
    page.fire();
    assert.deepEqual(page.log, [], key);
    assert.deepEqual(page.live().map((t) => t.ms), [RETRY_MS], `${key}: look again soon`);
    page.state[key] = key === 'visible' ? true : key === 'busy' ? false : true; // it is a good moment now
    page.fire();
    assert.equal(page.log[0], 'start dance', `${key}: and it happens once the moment is good`);
  }
});

test('when the computer asked for calm, nothing ever happens, not even the timer', () => {
  const page = setup({ calm: true });
  page.idle.start();
  assert.equal(page.timers.length, 0);
  page.idle.poke();
  assert.equal(page.timers.length, 0);
  assert.deepEqual(page.log, []);
});

test('stop ends the antic and everything after it, and poke after stop does nothing', () => {
  const page = setup();
  page.idle.start();
  page.fire();
  page.idle.stop();
  assert.deepEqual(page.log, ['start dance', 'stop dance']);
  assert.equal(page.live().length, 0);
  page.idle.poke();
  assert.equal(page.live().length, 0);
});

test('playNow plays the named antic at once, even before the minute is up, and a click still ends it', () => {
  const page = setup();
  page.idle.start();
  assert.equal(page.idle.playNow('yawn'), true);
  assert.deepEqual(page.log, ['start yawn']);
  page.idle.poke();
  assert.deepEqual(page.log, ['start yawn', 'stop yawn']);
  assert.equal(page.idle.playNow('nonsense'), false);
  assert.equal(page.log.length, 2);
  // It also replaces one already playing, and respects calm.
  assert.equal(page.idle.playNow('dance'), true);
  assert.equal(page.idle.playNow('yawn'), true);
  assert.deepEqual(page.log.slice(2), ['start dance', 'stop dance', 'start yawn']);
  page.idle.stop();
  const calm = setup({ calm: true });
  assert.equal(calm.idle.playNow('dance'), false);
});

// ---- Things that go on quietly (the turtle breathing) -----------------------------------------------------------

function ambientSetup({ calm = false, busy = false, visible = true } = {}) {
  const log = [];
  const timers = [];
  const state = { calm, busy, visible };
  const idle = new Idle({
    antics: [{ name: 'dance', weight: 1, play: () => { log.push('start dance'); return { ms: 3000, stop: () => log.push('stop dance') }; } }],
    ambient: [{ name: 'breath', afterMs: BREATH_AFTER_MS, start: () => log.push('start breath'), stop: () => log.push('stop breath') }],
    busy: () => state.busy, calm: () => state.calm, visible: () => state.visible, random: steady(0.1),
    setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; },
    clearTimer: (id) => { if (id !== null && timers[id]) timers[id].live = false; },
  });
  return {
    idle, log, timers, state,
    live: () => timers.filter((t) => t.live),
    fireAfter: (ms) => { const t = timers.filter((x) => x.live && x.ms === ms).at(-1); t.live = false; t.fn(); },
  };
}

test('the turtle starts to breathe after five quiet seconds, before the first antic, and stops the moment anyone does anything', () => {
  assert.equal(BREATH_AFTER_MS, 5000, 'five seconds, as asked');
  assert.ok(BREATH_AFTER_MS < IDLE_MS, 'before the antics begin');
  const page = ambientSetup();
  page.idle.start();
  assert.deepEqual(page.live().map((t) => t.ms).sort((a, b) => a - b), [BREATH_AFTER_MS, IDLE_MS], 'one timer for each');
  page.fireAfter(BREATH_AFTER_MS);
  assert.deepEqual(page.log, ['start breath']);
  page.idle.poke();
  assert.deepEqual(page.log, ['start breath', 'stop breath'], 'stopped at once');
  assert.deepEqual(page.live().map((t) => t.ms).sort((a, b) => a - b), [BREATH_AFTER_MS, IDLE_MS], 'and the quiet starts over, for both');
  // Activity when it is not breathing changes nothing but the timers.
  page.idle.poke();
  assert.deepEqual(page.log, ['start breath', 'stop breath']);
});

test('the breathing carries on while an antic plays, and any activity ends both', () => {
  const page = ambientSetup();
  page.idle.start();
  page.fireAfter(BREATH_AFTER_MS);
  page.fireAfter(IDLE_MS);
  assert.deepEqual(page.log, ['start breath', 'start dance']);
  page.idle.poke();
  assert.deepEqual(page.log.slice(2).sort(), ['stop breath', 'stop dance']);
});

test('the breathing waits for a good moment like the antics do, and never happens when calm was asked for', () => {
  const busy = ambientSetup({ busy: true });
  busy.idle.start();
  busy.fireAfter(BREATH_AFTER_MS);
  assert.deepEqual(busy.log, [], 'a program is running');
  assert.ok(busy.live().some((t) => t.ms === RETRY_MS), 'it looks again soon');
  busy.state.busy = false;
  busy.fireAfter(RETRY_MS);
  assert.deepEqual(busy.log, ['start breath']);
  const calm = ambientSetup({ calm: true });
  calm.idle.start();
  assert.equal(calm.timers.length, 0);
  calm.idle.poke();
  assert.equal(calm.timers.length, 0);
  assert.equal(calm.idle.playNow('breath'), false);
});

test('stop ends the breathing too, and playNow starts it at once (the address ?antic=breath) until anyone does anything', () => {
  const page = ambientSetup();
  page.idle.start();
  assert.equal(page.idle.playNow('breath'), true);
  assert.deepEqual(page.log, ['start breath']);
  assert.equal(page.idle.playNow('breath'), true);
  assert.deepEqual(page.log, ['start breath'], 'not started twice');
  page.idle.poke();
  assert.deepEqual(page.log, ['start breath', 'stop breath']);
  page.idle.playNow('breath');
  page.idle.stop();
  assert.equal(page.log.at(-1), 'stop breath');
  assert.equal(page.live().length, 0);
});
