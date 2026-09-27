// Marching Orders has no computed puzzle answer (it's a describe-and-draw
// pair game), so there's nothing to prove correct the way the other
// unplugged checkers do. This instead checks the structural things that
// would otherwise fail silently: no picture handed to both players, both
// players' main rounds balanced (so turns actually alternate evenly), and
// every picture referenced in the data has an image file on disk.
//
//   node tools/check_marching_orders.mjs
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

let failures = 0;
const fail = (label, msg) => {
  failures++;
  console.log(`FAIL ${label}: ${msg}`);
};

function loadYaml(file) {
  const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + file]);
  return JSON.parse(json);
}

const data = loadYaml("marching_orders.yml");

const aPics = data.players.A.pictures;
const bPics = data.players.B.pictures;

// ---- No picture assigned to both players, or twice to the same player.
const allMain = aPics.concat(bPics);
const seen = new Set();
for (const id of allMain) {
  if (seen.has(id)) fail("assignment", `picture ${id} is assigned more than once`);
  seen.add(id);
}

// ---- Balanced main rounds: both players need the same number of pictures
// to describe, so the "describe, then swap" turns actually alternate evenly.
if (aPics.length !== bPics.length) {
  fail("balance", `Player A has ${aPics.length} pictures, Player B has ${bPics.length} -- rounds won't alternate evenly`);
}

// ---- The challenge picture must be a real, distinct picture, not one
// already in the main rounds.
if (seen.has(data.challenge.picture)) {
  fail("challenge", `challenge picture ${data.challenge.picture} is already used in the main rounds`);
}
if (!data.pictures[data.challenge.picture]) {
  fail("challenge", `challenge picture ${data.challenge.picture} has no description in pictures:`);
}

// ---- Every picture mentioned (main rounds + challenge) has both a
// description and an actual image file under assets/img/unplugged/marching-orders/.
const imgDir = fileURLToPath(new URL("../assets/img/unplugged/marching-orders/", import.meta.url));
const allIds = new Set([...allMain, data.challenge.picture]);
for (const id of allIds) {
  if (!data.pictures[id]) fail("pictures", `picture ${id} has no entry under pictures:`);
  const path = `${imgDir}picture-${id}.png`;
  if (!existsSync(path)) fail("pictures", `picture-${id}.png is missing from assets/img/unplugged/marching-orders/`);
}
// Picture E is intentionally excluded (see the yml's header comment) --
// make sure nobody re-adds it by accident without revisiting that note.
if (allIds.has("e") || data.pictures.e) {
  fail("pictures", "picture e (the dot-grid shape) should stay excluded -- see the yml's header comment");
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("All Marching Orders checks passed.");
}
