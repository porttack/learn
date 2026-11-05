// Tests for js/ui/visitors.js: what happens when a visitor (the fish or the boat) is clicked: it stays put, the shark swims out to it, and it goes under the jaws.
// The shark and the visitor are small stand-ins, so no browser is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OVER_MS, eatVisitor } from '../js/ui/visitors.js';

function stand({ goes = true } = {}) {
  const log = [];
  const timers = [];
  let calls = null;
  const trash = {
    setPeek: (on) => log.push(['peek', on]),
    look: (at) => log.push(['look', at]),
    hunt: (target, given) => { log.push(['hunt', target]); calls = given; return goes; },
  };
  const classes = new Set();
  const el = { style: {}, removed: false, classList: { add: (name) => classes.add(name) }, remove() { this.removed = true; }, getBoundingClientRect: () => ({ left: 200, top: 500, width: 40, height: 20 }) };
  return { log, trash, el, classes, timers, calls: () => calls, setTimer: (fn, ms) => timers.push({ fn, ms }) };
}

test('the shark is sent to the middle of the visitor, and the shark stops watching it', () => {
  const page = stand();
  let done = 0;
  const went = eatVisitor({ el: page.el, trash: page.trash, setTimer: page.setTimer, onDone: () => { done += 1; } });
  assert.equal(went, true);
  assert.deepEqual(page.log.find(([name]) => name === 'hunt'), ['hunt', { x: 220, y: 510 }]);
  assert.ok(page.log.some(([name, value]) => name === 'peek' && value === false));
  assert.ok(page.log.some(([name, value]) => name === 'look' && value === null));
  assert.equal(done, 0, 'not done until the shark is home');
  assert.equal(page.el.style.transform, undefined, 'the visitor is not moved: the shark comes to it');
});

test('when the jaws close it spins down under them and is taken off the page, and the sender is told when the shark is home', () => {
  const page = stand();
  let done = 0;
  eatVisitor({ el: page.el, trash: page.trash, setTimer: page.setTimer, onDone: () => { done += 1; } });
  assert.equal(page.classes.has('eaten'), false);
  page.calls().onBite();
  assert.ok(page.classes.has('eaten'));
  assert.equal(page.el.removed, false, 'still spinning');
  assert.equal(page.timers.length, 1);
  assert.equal(page.timers[0].ms, OVER_MS);
  page.timers[0].fn();
  assert.equal(page.el.removed, true);
  page.calls().onDone();
  assert.equal(done, 1);
});

test('with no shark to send (the can is not showing) the sender is told at once and nothing was eaten', () => {
  const page = stand({ goes: false });
  let done = 0;
  assert.equal(eatVisitor({ el: page.el, trash: page.trash, setTimer: page.setTimer, onDone: () => { done += 1; } }), false);
  assert.equal(done, 1);
  assert.equal(page.classes.size, 0);
});
