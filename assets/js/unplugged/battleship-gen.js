// Builds one whole Binary Battleship set: a fleet for Player A and a fleet
// for Player B, from one seed. Each player's fleet comes from its own
// forked generator, so re-rolling doesn't secretly couple the two boards.
import { generateFleet } from "./battleship.js";

export function generateSet(rng, level) {
  return {
    level,
    players: {
      A: generateFleet(rng.fork(1), level),
      B: generateFleet(rng.fork(2), level),
    },
  };
}
