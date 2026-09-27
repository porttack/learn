// Freezes named library pictures into YAML for the fixed pixel-pictures
// worksheet, so a later library edit (new art, a tweaked pixel) can never
// change a sheet that's already been printed.
//
//   node tools/freeze_pixel_set.mjs small:Plus small:Diamond small:Boat small:House small:Target > _data/unplugged/pixel_pictures.yml
//
// Each argument is "<size>:<name>" naming an entry in
// assets/js/unplugged/pixel-library.js. Review the output, then run
// tools/check_pixel_pictures.mjs to verify it.
import { LIBRARY } from "../assets/js/unplugged/pixel-library.js";
import { parsePicture } from "../assets/js/unplugged/pixels.js";

const specs = process.argv.slice(2);
if (!specs.length) {
  console.error("Usage: node tools/freeze_pixel_set.mjs <size>:<name> ...");
  process.exit(1);
}

const out = ['title: "Pixel pictures"', "pictures:"];
for (const spec of specs) {
  const [size, name] = spec.split(":");
  const entry = (LIBRARY[size] || []).find((p) => p.name === name);
  if (!entry) {
    console.error(`No picture named "${name}" in LIBRARY.${size}`);
    process.exit(1);
  }
  const pic = parsePicture(entry.art); // throws if the art is malformed
  out.push(`  - name: ${JSON.stringify(entry.name)}`);
  out.push("    art: |");
  for (const row of pic.rows) {
    out.push(`      ${row.map((px) => (px ? "#" : ".")).join("")}`);
  }
}
console.log(out.join("\n"));
