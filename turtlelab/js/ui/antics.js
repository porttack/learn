// TurtleLab: what the turtle and the shark get up to: when nobody is around (idle.js decides when), or as a treat for doing work (reward.js decides
// when). Each one is a little show that lasts a few seconds. The idle ones stop the moment anyone touches anything; the treats play on while they work.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The turtle dances, scratches its head, yawns, blows bubbles as if breathing under water (they float off the top of the window), or (rarely)
// does what turtles do, which falls off the bottom of the window, and now and then twice. The shark dozes off and dreams of turtle soup, or is sick
// and brings up everything it has eaten, which lands all round the can and fades away.
// They are only for looking at: nothing here touches a project, stores anything or fetches anything. The motion itself is in the
// stylesheet (and in canvas-view.js and trash.js, which hold the pictures); this file says which ones there are, how likely each is, and
// how long it lasts.

/**
 * The least time each antic lasts, in milliseconds. Bubbles, Zzz and the like are given as long as they need to float right out of the
 * window, which can be longer when the turtle is low down on the page.
 */
export const ANTIC_MS = { dance: 3400, scratch: 2600, yawn: 3200, breathe: 4200, poop: 2300, dream: 8500, spew: 4500 };

/**
 * Which of the antics happen when nobody is doing anything (the sleepy and the silly ones), and which are treats for doing work: dancing is a celebration, and
 * the bubbles can be either. The fish and the boat (fish.js, boat.js) are treats too (see makeRewards). To change which is which, move a name between the lists.
 */
export const IDLE_ANTICS = ['scratch', 'yawn', 'breathe', 'poop', 'dream', 'spew'];
export const TREAT_ANTICS = ['dance', 'breathe'];

/** How often the turtle does it twice, with a short pause between. */
export const SECOND_POOP_CHANCE = 0.4;

/** The antics to give Idle: the ones for when nobody is around. */
export function idleAntics(antics) {
  return antics.filter((antic) => IDLE_ANTICS.includes(antic.name));
}

/**
 * The treats for Reward: the antics that are treats, and a fish or a fishing boat coming by (each gives back false if it is not a good moment for it).
 * @param {object} things
 * @param {{ name: string }[]} things.antics what makeAntics gave back
 * @param {{ swim: () => boolean }} things.fish
 * @param {{ sail: () => boolean }} things.boat
 */
export function makeRewards({ antics, fish, boat }) {
  return [
    ...antics.filter((antic) => TREAT_ANTICS.includes(antic.name)),
    { name: 'fish', weight: 3, play: () => fish.swim() },
    { name: 'boat', weight: 2, play: () => boat.sail() },
  ];
}

/**
 * What can happen on a whim, when somebody changes the grid or the paper: any antic at all (the turtle dances, yawns, scratches or blows bubbles, the shark
 * dozes off or is sick) or a fish or a fishing boat coming by. Each gives back false if it is not a good moment for it, and the next is tried (see Reward.surprise).
 * @param {object} things the same as makeRewards
 */
export function makeSurprises({ antics, fish, boat }) {
  return [
    ...antics,
    { name: 'fish', weight: 3, play: () => fish.swim() },
    { name: 'boat', weight: 2, play: () => boat.sail() },
  ];
}

/**
 * The antics there are (all of them: idleAntics and makeRewards say which are for when).
 * @param {object} things
 * @param {import('./canvas-view.js').CanvasView} things.view the turtle on the paper
 * @param {import('./trash.js').Trash} things.trash the can with the shark
 * @param {{ el: object | null }} [things.fish] the fish, if there is one (the shark does not doze off while a fish is swimming past)
 * The rest are for tests: `random`, `setTimer`, `clearTimer`, `secondPoopChance`.
 */
export function makeAntics({ view, trash, fish = { el: null }, random = Math.random, setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id), secondPoopChance = SECOND_POOP_CHANCE }) {
  /** How long it lasts: at least its time, and long enough for what floats to float away (seconds are how long that takes). */
  const lasts = (name, seconds) => Math.max(ANTIC_MS[name], seconds * 1000 + 300);
  return [
    { name: 'dance', weight: 3, play: () => { view.setPose('dance'); return { ms: ANTIC_MS.dance, stop: () => view.setPose(null) }; } },
    { name: 'scratch', weight: 3, play: () => { view.setPose('scratch'); return { ms: ANTIC_MS.scratch, stop: () => view.setPose(null) }; } },
    { name: 'yawn', weight: 3, play: () => ({ ms: lasts('yawn', view.setYawning(true, { once: true })), stop: () => view.setYawning(false) }) },
    { name: 'breathe', weight: 3, play: () => ({ ms: lasts('breathe', view.setBreathing(true)), stop: () => view.setBreathing(false) }) },
    {
      name: 'poop',
      weight: 1,
      play: () => {
        let seconds = view.dropPoop();
        const timers = [];
        if (random() < secondPoopChance) {
          const pause = 0.7 + random() * 0.6; // and, now and then, another a moment later
          timers.push(setTimer(() => view.dropPoop(), pause * 1000));
          seconds += pause;
        }
        return { ms: lasts('poop', seconds), stop: () => { timers.forEach((id) => clearTimer(id)); view.clearPoop(); } };
      },
    },
    {
      name: 'dream',
      weight: 2,
      can: () => trash.canDream() && !fish.el,
      play: () => ({ ms: lasts('dream', trash.setDreaming(true)), stop: () => trash.setDreaming(false) }),
    },
    {
      // The shark is sick and brings up everything it has eaten. Only possible if it has eaten something and is just resting, with no fish or boat about.
      name: 'spew',
      weight: 3,
      can: () => trash.canSpew() && !fish.el,
      play: () => {
        const started = trash.spew();
        return started ? { ms: lasts('spew', started.ms / 1000), stop: started.stop } : { ms: 0, stop: () => {} };
      },
    },
  ];
}
