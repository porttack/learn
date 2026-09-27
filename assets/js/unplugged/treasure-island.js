// Pure finite-state-automaton logic for the Treasure Island activity
// (_unplugged/treasure-island.md). No DOM here on purpose: the worksheet
// itself is static markup (the map never changes, so there's nothing to
// render), but tools/check_treasure_island.mjs imports this same module to
// prove every answer printed on the page and in its hidden key.
//
// `routes` mirrors _data/unplugged/treasure_island.yml's `routes:` map.
// Keep the two in sync -- the checker loads both and cross-checks them.
export const ROUTES = {
  pirates: { A: "shipwreck", B: "musket" },
  shipwreck: { A: "musket", B: "deadman" },
  deadman: { A: "musket", B: "shipwreck" },
  musket: { A: "pirates", B: "mutineers" },
  mutineers: { A: "smugglers", B: "deadman" },
  smugglers: { A: "pirates", B: "treasure" },
  // Treasure Island is the end of the line: no outgoing ships.
};

export const START = "pirates";
export const TREASURE = "treasure";

// One ship, one letter. Returns null if this island has no such ship
// (only Treasure Island, which ends the trip).
export function step(island, letter) {
  const legs = ROUTES[island];
  if (!legs) return null;
  return legs[letter] || null;
}

// Follows a route (a string of "A"/"B" characters) from a starting island.
// Returns { end, path }, where `path` includes the starting island and
// every island landed on, in order. If the route runs off the map (should
// never happen here, since every non-Treasure island has both ships),
// `end` is null and `path` stops short.
export function follow(start, route) {
  let cur = start;
  const path = [cur];
  for (const letter of route) {
    const next = step(cur, letter);
    if (next == null) return { end: null, path };
    cur = next;
    path.push(cur);
  }
  return { end: cur, path };
}

// Breadth-first search for the shortest route between two islands. Returns
// { sequence, path } for the first (shortest) route found, or null if the
// target can't be reached at all. Ties are broken by trying ship A before
// ship B at each island, which is enough to make the result deterministic
// for this map (it happens to have a unique shortest route).
export function shortestRoute(start, target) {
  if (start === target) return { sequence: "", path: [start] };
  const seen = new Set([start]);
  const queue = [{ island: start, sequence: "", path: [start] }];
  while (queue.length) {
    const { island, sequence, path } = queue.shift();
    for (const letter of ["A", "B"]) {
      const next = step(island, letter);
      if (next == null || seen.has(next)) continue;
      const nextPath = path.concat(next);
      if (next === target) return { sequence: sequence + letter, path: nextPath };
      seen.add(next);
      queue.push({ island: next, sequence: sequence + letter, path: nextPath });
    }
  }
  return null;
}
