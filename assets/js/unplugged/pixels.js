// Pixel picture run-length encoding: DOM-free core.
//
// Every picture on a screen is a grid of pixels. This activity's whole
// point is walking a student through *why* a list of numbers can stand
// for a picture, then having them do the encoding and decoding by hand.
// Keep this module DOM-free so tools/check_pixel_pictures.mjs can import
// it in Node.
//
// A picture is { w, h, rows }, where rows is h arrays of w values, each
// 0 (white) or 1 (black).
//
// A row's code is a list of run lengths, alternating white/black, ALWAYS
// starting with a white count, so a row that starts black begins its code
// with a 0. That single rule is the whole activity.

export function parsePicture(text) {
  const lines = String(text)
    .trim()
    .split("\n")
    .map((line) => line.trim());
  const w = lines[0].length;
  const rows = lines.map((line, i) => {
    if (line.length !== w) throw new Error(`Row ${i + 1} has ${line.length} pixels, expected ${w}`);
    return [...line].map((ch) => {
      if (ch === "#") return 1;
      if (ch === ".") return 0;
      throw new Error(`Unknown pixel "${ch}" (use "." for white, "#" for black)`);
    });
  });
  return { w, h: rows.length, rows };
}

export function pictureToText(pic) {
  return pic.rows.map((row) => row.map((px) => (px ? "#" : ".")).join("")).join("\n");
}

// A row's code: run lengths, always starting with a white count (0 if the
// row starts black).
export function encodeRow(row) {
  const runs = [];
  let color = 0;
  let count = 0;
  for (const px of row) {
    if (px === color) {
      count++;
    } else {
      runs.push(count);
      color = 1 - color;
      count = 1;
    }
  }
  runs.push(count);
  return runs;
}

// The reverse: a row's code back into pixels. Throws if the code doesn't
// add up to the row's width, which is exactly the check a student can do
// by hand too.
export function decodeRow(runs, width) {
  const row = [];
  let color = 0;
  for (const n of runs) {
    for (let i = 0; i < n; i++) row.push(color);
    color = 1 - color;
  }
  if (row.length !== width) throw new Error(`Code decodes to ${row.length} pixels, expected ${width}`);
  return row;
}

export function encodePicture(pic) {
  return pic.rows.map(encodeRow);
}

export function decodePicture(codes, width) {
  return codes.map((runs) => decodeRow(runs, width));
}

export function rowsEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function picturesEqual(a, b) {
  return a.length === b.length && a.every((row, i) => rowsEqual(row, b[i]));
}

export function runSum(runs) {
  return runs.reduce((a, b) => a + b, 0);
}
