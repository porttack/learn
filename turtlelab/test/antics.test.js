// Tests for js/ui/antics.js: which antics there are, how likely, how long, and that each starts and stops what it should.
// The turtle and the shark are stand-ins that note what they are asked to do.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANTIC_MS, SECOND_POOP_CHANCE, IDLE_ANTICS, TREAT_ANTICS, makeAntics, idleAntics, makeRewards, makeSurprises } from '../js/ui/antics.js';

function stands({ canDream = true, canSpew = true, spewed = true, fish = { el: null }, random = () => 0.99, seconds = { yawn: 1, breathe: 2, poop: 1.5, dream: 3, spew: 3 } } = {}) {
  const log = [];
  const timers = [];
  const view = {
    setPose: (pose) => log.push(`pose ${pose}`),
    setYawning: (on, options) => { log.push(`yawn ${on}${options?.once ? ' once' : ''}`); return on ? seconds.yawn : 0; },
    setBreathing: (on) => { log.push(`breathe ${on}`); return on ? seconds.breathe : 0; },
    dropPoop: () => { log.push('poop'); return seconds.poop; }, clearPoop: () => log.push('clear poop'),
  };
  const trash = {
    canDream: () => canDream, setDreaming: (on) => { log.push(`dream ${on}`); return on ? seconds.dream : 0; },
    canSpew: () => canSpew, spew: () => { log.push('spew'); return spewed ? { ms: seconds.spew * 1000, stop: () => log.push('spew stop') } : false; },
  };
  const antics = makeAntics({
    view, trash, fish, random,
    setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
  });
  return { log, antics, timers };
}

test('there are seven antics: four common, a rarer dream and spew, and the rarest of all', () => {
  const { antics } = stands();
  assert.deepEqual(antics.map((a) => a.name), ['dance', 'scratch', 'yawn', 'breathe', 'poop', 'dream', 'spew']);
  const weight = Object.fromEntries(antics.map((a) => [a.name, a.weight]));
  assert.ok(weight.poop < weight.dream && weight.dream < weight.dance, JSON.stringify(weight));
  assert.ok(Object.values(weight).every((w) => w > 0));
  assert.deepEqual(Object.keys(ANTIC_MS).sort(), antics.map((a) => a.name).sort(), 'every antic has a length');
  for (const ms of Object.values(ANTIC_MS)) assert.ok(ms >= 2000 && ms <= 10000, 'a few seconds each');
});

test('each antic starts what it should, says how long it lasts, and its stop puts everything back', () => {
  const expected = {
    dance: [['pose dance'], ['pose null']],
    scratch: [['pose scratch'], ['pose null']],
    yawn: [['yawn true once'], ['yawn false']],
    breathe: [['breathe true'], ['breathe false']],
    poop: [['poop'], ['clear poop']],
    dream: [['dream true'], ['dream false']],
    spew: [['spew'], ['spew stop']],
  };
  for (const [name, [started, stopped]] of Object.entries(expected)) {
    const { log, antics } = stands();
    const antic = antics.find((a) => a.name === name);
    const { ms, stop } = antic.play();
    assert.equal(ms, ANTIC_MS[name], `${name}: its own time, when what floats is gone sooner than that`);
    assert.deepEqual(log, started, `${name} starts`);
    stop();
    assert.deepEqual(log.slice(started.length), stopped, `${name} stops`);
  }
});

test('an antic lasts long enough for what floats up or falls to be gone: a long way to the top means a longer antic', () => {
  const far = { yawn: 9, breathe: 8, poop: 5, dream: 12, spew: 9 };
  for (const [name, takes] of Object.entries(far)) {
    const { antics } = stands({ seconds: far });
    const { ms } = antics.find((a) => a.name === name).play();
    assert.ok(ms >= ANTIC_MS[name]);
    assert.ok(ms >= takes * 1000, `${name}: ${ms} ms for something that takes ${takes} s`);
  }
});

test('now and then the turtle does it twice, a moment after the first, and stopping takes both away', () => {
  assert.ok(SECOND_POOP_CHANCE > 0.2 && SECOND_POOP_CHANCE < 0.6);
  const once = stands({ random: () => SECOND_POOP_CHANCE + 0.01 });
  once.antics.find((a) => a.name === 'poop').play();
  assert.deepEqual(once.log, ['poop']);
  assert.equal(once.timers.length, 0, 'no second one planned');
  const twice = stands({ random: () => 0 });
  const { ms, stop } = twice.antics.find((a) => a.name === 'poop').play();
  assert.equal(twice.timers.length, 1);
  assert.ok(twice.timers[0].ms >= 700 && twice.timers[0].ms <= 1300, 'a moment later');
  assert.ok(ms >= (1.5 + 0.7) * 1000, 'long enough for the second to fall as well');
  twice.timers[0].fn();
  assert.deepEqual(twice.log, ['poop', 'poop']);
  stop();
  assert.equal(twice.log.at(-1), 'clear poop');
  // Stopped before the second one is dropped: it never happens.
  const early = stands({ random: () => 0 });
  const second = early.antics.find((a) => a.name === 'poop').play();
  second.stop();
  assert.equal(early.timers[0].live, false, 'the second is cancelled');
  assert.deepEqual(early.log, ['poop', 'clear poop']);
});

test('the shark only dozes off when it is resting and no fish is swimming past; the turtle\'s antics are always possible', () => {
  const resting = stands().antics;
  assert.equal(resting.find((a) => a.name === 'dream').can(), true);
  assert.equal(stands({ canDream: false }).antics.find((a) => a.name === 'dream').can(), false);
  assert.equal(stands({ fish: { el: {} } }).antics.find((a) => a.name === 'dream').can(), false, 'not while a fish swims');
  for (const antic of resting.filter((a) => a.name !== 'dream' && a.name !== 'spew')) assert.equal(antic.can, undefined, antic.name);
});

test('the shark is only sick when it has something to bring up and is resting, with no fish or boat about; if it is asked and cannot, nothing is left running', () => {
  const spew = (options) => stands(options).antics.find((a) => a.name === 'spew');
  assert.equal(spew().can(), true);
  assert.equal(spew({ canSpew: false }).can(), false, 'nothing eaten, or not resting');
  assert.equal(spew({ fish: { el: {} } }).can(), false, 'not while a fish or the boat is about');
  const failed = spew({ spewed: false }).play();
  assert.equal(failed.ms, 0);
  assert.doesNotThrow(() => failed.stop(), 'an antic that did not start still has something safe to stop');
  assert.ok(spew().weight > 0);
});

test('some antics are for when nobody is around, some are treats for working, and the bubbles are both; every name in the lists is a real antic', () => {
  const { antics } = stands();
  const names = antics.map((a) => a.name);
  for (const name of [...IDLE_ANTICS, ...TREAT_ANTICS]) assert.ok(names.includes(name), name);
  assert.deepEqual(idleAntics(antics).map((a) => a.name), ['scratch', 'yawn', 'breathe', 'poop', 'dream', 'spew']);
  assert.ok(!idleAntics(antics).some((a) => a.name === 'dance'), 'dancing is a celebration, so it is not for when nobody is there');
  assert.ok(IDLE_ANTICS.includes('breathe') && TREAT_ANTICS.includes('breathe'));
  assert.ok(!TREAT_ANTICS.includes('poop') && !TREAT_ANTICS.includes('yawn') && !TREAT_ANTICS.includes('dream') && !TREAT_ANTICS.includes('spew'), 'the sleepy and silly ones, and being sick, are not rewards');
});

test('the treats are the dance, the happy bubbles, a fish and a boat, and the fish and the boat say no when it is not a good moment for them', () => {
  const { antics, log } = stands();
  const calls = [];
  const treats = makeRewards({ antics, fish: { swim: () => { calls.push('swim'); return false; } }, boat: { sail: () => { calls.push('sail'); return true; } } });
  assert.deepEqual(treats.map((t) => t.name), ['dance', 'breathe', 'fish', 'boat']);
  assert.ok(treats.every((t) => t.weight > 0));
  assert.equal(treats.find((t) => t.name === 'fish').play(), false);
  assert.equal(treats.find((t) => t.name === 'boat').play(), true);
  assert.deepEqual(calls, ['swim', 'sail']);
  treats.find((t) => t.name === 'dance').play();
  assert.deepEqual(log, ['pose dance'], 'the dance is the very same one');
});

test('on a whim anything can happen: every antic, a fish and a boat, each saying no when it is not a good moment', () => {
  const { antics, log } = stands();
  const calls = [];
  const surprises = makeSurprises({ antics, fish: { swim: () => { calls.push('swim'); return false; } }, boat: { sail: () => { calls.push('sail'); return true; } } });
  assert.deepEqual(surprises.map((s) => s.name), ['dance', 'scratch', 'yawn', 'breathe', 'poop', 'dream', 'spew', 'fish', 'boat']);
  assert.ok(surprises.every((s) => s.weight > 0));
  assert.equal(surprises.find((s) => s.name === 'fish').play(), false);
  assert.equal(surprises.find((s) => s.name === 'boat').play(), true);
  assert.deepEqual(calls, ['swim', 'sail']);
  surprises.find((s) => s.name === 'spew').play();
  assert.deepEqual(log, ['spew'], 'the very same antic, not a copy');
  for (const name of [...IDLE_ANTICS, ...TREAT_ANTICS]) assert.ok(surprises.some((s) => s.name === name), `${name} can happen on a whim`);
});
