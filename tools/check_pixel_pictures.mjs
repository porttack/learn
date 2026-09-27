// Verifies pixel-picture codes against the encoder/decoder.
//
//   node tools/check_pixel_pictures.mjs
//   node tools/check_pixel_pictures.mjs --gen 50   fewer generated sets
//
// Checks every library picture (assets/js/unplugged/pixel-library.js), the
// frozen worksheet (_data/unplugged/pixel_pictures.yml), and a batch of
// generated sets: decode(encode(row)) must reproduce the row exactly, and
// every row's code must sum to the picture's width. YAML is converted with
// Ruby (already required by Jekyll) so this needs no npm packages.
import { execFileSync } from "node:child_process";
import { parsePicture, encodeRow, decodeRow, runSum, rowsEqual } from "../assets/js/unplugged/pixels.js";
import { LIBRARY } from "../assets/js/unplugged/pixel-library.js";
import { generateSet } from "../assets/js/unplugged/pixel-gen.js";
import { makeRng } from "../assets/js/unplugged/rng.js";

let failures = 0;

function checkPicture(label, pic) {
  pic.rows.forEach((row, i) => {
    const runs = encodeRow(row);
    const sum = runSum(runs);
    if (sum !== pic.w) {
      failures++;
      console.log(`FAIL ${label} row ${i + 1}: code sums to ${sum}, width is ${pic.w}`);
      return;
    }
    const back = decodeRow(runs, pic.w);
    if (!rowsEqual(back, row)) {
      failures++;
      console.log(`FAIL ${label} row ${i + 1}: decode(encode(row)) doesn't match the original row`);
    }
  });
}

let libCount = 0;
for (const size of Object.keys(LIBRARY)) {
  for (const entry of LIBRARY[size]) {
    libCount++;
    try {
      checkPicture(`library ${size}/${entry.name}`, parsePicture(entry.art));
    } catch (e) {
      failures++;
      console.log(`FAIL library ${size}/${entry.name}: ${e.message}`);
    }
  }
}
console.log(`${libCount} library pictures checked`);

const dir = new URL("../_data/unplugged/", import.meta.url).pathname;
let frozen = { pictures: [] };
try {
  const json = execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts YAML.load_file(ARGV[0]).to_json", dir + "pixel_pictures.yml"]);
  frozen = JSON.parse(json);
} catch (e) {
  failures++;
  console.log(`FAIL: could not load pixel_pictures.yml: ${e.message}`);
}
for (const entry of frozen.pictures || []) {
  try {
    checkPicture(`frozen/${entry.name}`, parsePicture(entry.art));
  } catch (e) {
    failures++;
    console.log(`FAIL frozen/${entry.name}: ${e.message}`);
  }
}
console.log(`${(frozen.pictures || []).length} frozen worksheet pictures checked`);

const n = Number(process.argv[process.argv.indexOf("--gen") + 1]) || 200;
let genChecked = 0;
const t0 = Date.now();
for (const size of Object.keys(LIBRARY)) {
  for (let seed = 20000; seed < 20000 + n / 2; seed++) {
    const pics = generateSet(makeRng(seed), { size, count: 4 });
    pics.forEach((pic, i) => {
      checkPicture(`generated ${size} seed ${seed} #${i + 1}`, pic);
      genChecked++;
    });
  }
}
console.log(`${genChecked} generated pictures checked in ${Date.now() - t0} ms`);
console.log(failures ? `${failures} failure(s)` : "all pixel codes match their pictures");
process.exit(failures ? 1 : 0);
