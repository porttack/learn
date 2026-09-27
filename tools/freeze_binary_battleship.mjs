// Freezes a generated Binary Battleship set into YAML for a fixed
// worksheet, so a later change to the fleet generator can never alter a
// sheet that's already been printed.
//
//   node tools/freeze_binary_battleship.mjs <level> <seed> > _data/unplugged/binary-battleship.yml
//
// Re-run tools/check_binary_battleship.mjs afterwards to verify the frozen
// fleets are still legal.
import { generateSet } from "../assets/js/unplugged/battleship-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

const [level, seed] = process.argv.slice(2);
if (!level || !seed) {
  console.error("Usage: node tools/freeze_binary_battleship.mjs <level> <seed>");
  process.exit(1);
}

const set = generateSet(makeRng(Number(seed)), level);

const shipsYaml = (ships, ind) =>
  ships
    .map((cells) => `${ind}- [${cells.map(([r, c]) => `[${r}, ${c}]`).join(", ")}]`)
    .join("\n");

const out = [
  `# Frozen from: node tools/freeze_binary_battleship.mjs ${level} ${seed}`,
  `level: ${level}`,
  `set: ${seed}`,
  "players:",
  "  A:",
  "    ships:",
  shipsYaml(set.players.A.ships, "      "),
  "  B:",
  "    ships:",
  shipsYaml(set.players.B.ships, "      "),
];
console.log(out.join("\n"));
