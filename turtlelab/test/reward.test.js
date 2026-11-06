// Tests for js/ui/reward.js: what counts as work, when a treat is earned, which one plays, and the rests in between.
// Time and the treats are stand-ins the test moves by hand, so no browser is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EDIT_POINTS, RUN_POINTS, GOAL, WINDOW_MS, COOLDOWN_MS, AFTER_RUN_MS, countBlocks, workMark, earnedWork, Reward,
} from '../js/ui/reward.js';

const stack = (x, y, ...blocks) => ({ x, y, blocks });

test('blocks are counted wherever they are: in a stack, inside a repeat, or plugged into a socket', () => {
  assert.equal(countBlocks([]), 0);
  assert.equal(countBlocks([stack(0, 0, { op: 'start' }, { op: 'forward', args: [100] })]), 2);
  const nested = [stack(0, 0, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [{ op: 'plus', args: [10, { op: 'random', args: [1, 5] }] }] }, { op: 'right', args: [90] }] })];
  assert.equal(countBlocks(nested), 5, 'repeat, forward, plus, random, right');
});

test('work is a change to the blocks themselves that did not take blocks away', () => {
  const before = workMark([stack(10, 10, { op: 'start' }, { op: 'forward', args: [100] })]);
  const moved = workMark([stack(300, 250, { op: 'start' }, { op: 'forward', args: [100] })]);
  const added = workMark([stack(10, 10, { op: 'start' }, { op: 'forward', args: [100] }, { op: 'right', args: [90] })]);
  const number = workMark([stack(10, 10, { op: 'start' }, { op: 'forward', args: [150] })]);
  const reordered = workMark([stack(10, 10, { op: 'forward', args: [100] }, { op: 'start' })]);
  const fewer = workMark([stack(10, 10, { op: 'start' })]);
  const none = workMark([]);
  assert.equal(earnedWork(before, before), false, 'nothing changed');
  assert.equal(earnedWork(before, moved), false, 'dragging a stack somewhere else is not work');
  assert.equal(earnedWork(before, added), true, 'a block added');
  assert.equal(earnedWork(before, number), true, 'a number changed');
  assert.equal(earnedWork(before, reordered), true, 'blocks rearranged');
  assert.equal(earnedWork(before, fewer), false, 'taking a block away is not');
  assert.equal(earnedWork(before, none), false, 'nor is deleting everything');
  assert.equal(earnedWork(none, before), true, 'starting from nothing is');
});

function setup({ calm = false, visible = true, busy = false, random = () => 0, can = {}, goal = GOAL } = {}) {
  const state = { calm, visible, busy };
  const log = [];
  const timers = [];
  let clock = 0;
  const treat = (name, weight = 1, play) => ({ name, weight, can: can[name], play: play ?? (() => { log.push(`play ${name}`); return { ms: 3000, stop: () => log.push(`stop ${name}`) }; }) });
  const rewards = [treat('dance', 3), treat('bubbles', 1), treat('fish', 3, () => { log.push('play fish'); return true; })];
  const reward = new Reward({
    rewards, goal, busy: () => state.busy, calm: () => state.calm, visible: () => state.visible, random: () => random(), now: () => clock,
    setTimer: (fn, ms) => { timers.push({ fn, ms, at: clock + ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
  });
  return {
    reward, log, state, timers, rewards,
    advance: (ms) => {
      const end = clock + ms;
      for (;;) {
        const next = timers.filter((t) => t.live && t.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!next) break;
        clock = next.at;
        next.live = false;
        next.fn();
      }
      clock = end;
    },
    edits: (n) => { for (let i = 0; i < n; i += 1) reward.edited(); },
  };
}

test('the goal is about a square\'s worth of building and then running it, and a treat does not come before it', () => {
  assert.equal(GOAL, 8);
  assert.ok(RUN_POINTS > EDIT_POINTS, 'running a program is worth more than one change');
  const page = setup();
  page.edits(GOAL - 1);
  assert.deepEqual(page.log, [], 'one short of the goal');
  page.reward.edited();
  assert.equal(page.log.length, 1, 'the goal is reached, and a treat plays');
});

test('a program that ran to the end after the blocks changed earns points, and running the same blocks again earns nothing', () => {
  const page = setup({ goal: 100 }); // (a goal out of reach, so the points can be looked at)
  page.edits(4);
  page.reward.ran();
  assert.equal(page.reward.score(), 4 * EDIT_POINTS + RUN_POINTS);
  page.reward.ran();
  page.reward.ran();
  assert.equal(page.reward.score(), 4 * EDIT_POINTS + RUN_POINTS, 'pressing Run again and again is not work');
  page.reward.edited();
  page.reward.ran();
  assert.equal(page.reward.score(), 5 * EDIT_POINTS + 2 * RUN_POINTS, 'a change, then another run, is');
});

test('a treat for a run waits for the wave to finish, and shows up once the points are enough', () => {
  const page = setup();
  page.edits(5);
  page.reward.ran(); // 5 + 3 = 8
  assert.deepEqual(page.log, [], 'not at once: the turtle is waving');
  page.advance(AFTER_RUN_MS - 1);
  assert.deepEqual(page.log, []);
  page.advance(2);
  assert.deepEqual(page.log, ['play dance']);
});

test('points are only worth something for a few minutes, so a little work spread over a whole class period earns no treat', () => {
  const page = setup();
  for (let i = 0; i < GOAL * 2; i += 1) {
    page.reward.edited();
    if (page.log.length > 0) break;
    page.advance(WINDOW_MS / 4 + 1);
  }
  assert.deepEqual(page.log, [], 'a change every minute never adds up to the goal');
});

test('after a treat the points start over, and there is a rest before the next, even for lots of work', () => {
  const page = setup();
  page.edits(GOAL);
  assert.equal(page.log.filter((e) => e.startsWith('play')).length, 1);
  page.edits(GOAL * 3);
  assert.equal(page.log.filter((e) => e.startsWith('play')).length, 1, 'no second treat in the rest');
  page.advance(COOLDOWN_MS + 1);
  page.reward.edited();
  assert.equal(page.log.filter((e) => e.startsWith('play')).length, 2, 'and one once the rest is over (the points saved up count)');
});

test('the same treat is not played twice in a row, unless it is the only one', () => {
  const page = setup({ random: () => 0 }); // always the first choice
  const played = [];
  for (let i = 0; i < 4; i += 1) {
    page.edits(GOAL);
    played.push(page.log.filter((e) => e.startsWith('play')).at(-1));
    page.advance(COOLDOWN_MS + 1);
  }
  for (let i = 1; i < played.length; i += 1) assert.notEqual(played[i], played[i - 1], played.join(', '));
  const alone = setup();
  alone.reward.rewards = [alone.rewards[0]];
  alone.edits(GOAL);
  alone.advance(COOLDOWN_MS + 1);
  alone.edits(GOAL);
  assert.deepEqual(alone.log.filter((e) => e.startsWith('play')), ['play dance', 'play dance']);
});

test('a treat that cannot happen just now is skipped for one that can (a fish while a boat is here), and is only asked once', () => {
  const page = setup({ random: () => 0.99 }); // the last choice first: the fish
  page.rewards[2].play = () => { page.log.push('fish said no'); return false; };
  page.edits(GOAL);
  assert.deepEqual(page.log, ['fish said no', 'play bubbles']);
});

test('if nothing is possible the points are kept for the next change', () => {
  const page = setup();
  for (const r of page.rewards) r.play = () => false;
  page.edits(GOAL);
  assert.equal(page.reward.score(), GOAL, 'nothing lost');
  page.rewards[0].play = () => { page.log.push('play dance'); return true; };
  page.reward.edited();
  assert.deepEqual(page.log, ['play dance']);
});

test('a treat that has to be stopped stops after its time, and when the whole thing is stopped, and then no more come', () => {
  const page = setup();
  page.edits(GOAL);
  assert.deepEqual(page.log, ['play dance']);
  page.advance(2999);
  assert.deepEqual(page.log, ['play dance']);
  page.advance(2);
  assert.deepEqual(page.log, ['play dance', 'stop dance']);
  page.advance(COOLDOWN_MS);
  page.edits(GOAL);
  assert.equal(page.log.at(-1), 'play bubbles', 'the next treat is a different one');
  page.reward.stop();
  assert.equal(page.log.at(-1), 'stop bubbles', 'stopping the whole thing ends the treat that is playing');
  const length = page.log.length;
  page.advance(COOLDOWN_MS * 2);
  page.edits(GOAL * 2);
  page.reward.ran();
  assert.equal(page.log.length, length, 'and nothing comes after that');
});

test('no treats at a bad moment: calm was asked for, the tab is hidden, or a program is running (it comes once the moment is good)', () => {
  for (const [key, value] of [['calm', true], ['visible', false], ['busy', true]]) {
    const page = setup();
    page.state[key] = value;
    page.edits(GOAL * 2);
    assert.deepEqual(page.log, [], key);
  }
  const page = setup();
  page.state.busy = true;
  page.edits(GOAL);
  assert.deepEqual(page.log, []);
  page.state.busy = false;
  page.reward.edited();
  assert.deepEqual(page.log, ['play dance'], 'the work was not lost');
  const calm = setup({ calm: true });
  calm.edits(3);
  assert.equal(calm.reward.score(), 0, 'with calm asked for, nothing is even counted');
});

test('playNow plays a named treat whatever the points (for trying them out), and says no to an unknown one or when calm was asked for', () => {
  const page = setup();
  assert.equal(page.reward.playNow('dance'), true);
  assert.deepEqual(page.log, ['play dance']);
  assert.equal(page.reward.playNow('fish'), true);
  assert.equal(page.reward.playNow('nothing'), false);
  assert.equal(setup({ calm: true }).reward.playNow('dance'), false);
});

// ---- Surprises: something happens on a whim (every change of the grid or paper) -------------------------------------------

function whim({ calm = false, visible = true, busy = false, random = () => 0, options = {} } = {}) {
  const state = { calm, visible, busy };
  const log = [];
  const timers = [];
  const make = (name, weight = 1, config = {}) => ({
    name, weight, can: config.can,
    play: () => {
      if (config.refuse) return false;
      log.push(`play ${name}`);
      return config.looksAfterItself ? true : { ms: 3000, stop: () => log.push(`stop ${name}`) };
    },
  });
  const surprises = [make('dance', 3, options.dance), make('yawn', 3, options.yawn), make('spew', 3, options.spew), make('fish', 3, { looksAfterItself: true, ...options.fish })];
  const reward = new Reward({
    rewards: [], surprises, busy: () => state.busy, calm: () => state.calm, visible: () => state.visible, random: () => random(), now: () => 0,
    setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; }, clearTimer: (id) => { timers[id].live = false; },
  });
  return { reward, log, state, timers };
}

test('a surprise plays one thing, chosen by weight, and says which', () => {
  const first = whim({ random: () => 0 });
  assert.equal(first.reward.surprise(), 'dance');
  assert.deepEqual(first.log, ['play dance']);
  const last = whim({ random: () => 0.99 });
  assert.equal(last.reward.surprise(), 'fish');
});

test('it needs nothing: not points, not a quiet moment, and it does not use up the rest before the next treat or the points', () => {
  const page = whim({ busy: true });
  assert.equal(page.reward.surprise(), 'dance', 'a program running does not stop it: it is the user asking for whimsy');
  assert.equal(page.reward.lastAt, null, 'it does not start the rest between treats');
  page.reward.edited();
  page.reward.edited();
  const points = page.reward.score();
  page.reward.surprise();
  assert.equal(page.reward.score(), points, 'and it does not take the points');
});

test('on a computer that asked for calm, or with the tab hidden, nothing happens', () => {
  const calm = whim({ calm: true });
  assert.equal(calm.reward.surprise(), false);
  assert.deepEqual(calm.log, []);
  const hidden = whim({ visible: false });
  assert.equal(hidden.reward.surprise(), false);
  assert.deepEqual(hidden.log, []);
});

test('what is not possible now is left out, and one that says no is skipped for the next', () => {
  const noSpew = whim({ random: () => 0.7, options: { spew: { can: () => false } } });
  for (let i = 0; i < 5; i += 1) assert.notEqual(noSpew.reward.surprise(), 'spew', 'it has nothing to bring up');
  const refuses = whim({ random: () => 0.99, options: { fish: { refuse: true, looksAfterItself: false } } });
  assert.equal(refuses.reward.surprise(), 'spew', 'the fish said no, so something else is tried');
  const none = whim({ options: { dance: { refuse: true }, yawn: { refuse: true }, spew: { refuse: true }, fish: { refuse: true } } });
  assert.equal(none.reward.surprise(), false);
});

test('it is not the same thing twice in a row if something else will do', () => {
  const page = whim({ random: () => 0 });
  const names = [];
  for (let i = 0; i < 4; i += 1) names.push(page.reward.surprise());
  assert.deepEqual(names, ['dance', 'yawn', 'dance', 'yawn'], 'the dice always say the first, so each time it is the first that is not the last');
  const only = whim({ random: () => 0, options: { yawn: { can: () => false }, spew: { can: () => false }, fish: { can: () => false } } });
  assert.equal(only.reward.surprise(), 'dance');
  assert.equal(only.reward.surprise(), 'dance', 'unless it is all there is');
});

test('a new surprise ends the one before, and one that lasts ends by itself, whatever anyone does meanwhile', () => {
  const page = whim({ random: () => 0 });
  page.reward.surprise();
  page.reward.surprise();
  assert.deepEqual(page.log, ['play dance', 'stop dance', 'play yawn'], 'the first is ended before the second begins');
  assert.equal(page.timers.filter((t) => t.live).length, 1, 'one timer waiting to end the one that is playing');
  const [, second] = page.timers;
  assert.equal(second.ms, 3000);
  second.fn();
  assert.equal(page.log.at(-1), 'stop yawn');
});

test('a surprise can be asked for by name, if it is possible, for trying them out', () => {
  const page = whim({ random: () => 0 });
  assert.equal(page.reward.surprise('spew'), 'spew');
  assert.equal(page.reward.surprise('spew'), 'spew', 'by name it can be the same again');
  assert.equal(page.reward.surprise('nosuch'), false);
  const impossible = whim({ options: { spew: { can: () => false } } });
  assert.equal(impossible.reward.surprise('spew'), false, 'and not if it is not possible');
});

test('after stop there are no more surprises', () => {
  const page = whim();
  page.reward.stop();
  assert.equal(page.reward.surprise(), false);
});
