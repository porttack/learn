// TurtleLab: writing embroidery machine files (.dst and .pes).
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// An embroidery machine does not draw lines. It moves a needle to a list of spots, one stitch
// at a time, in steps of a tenth of a millimeter, and every company has its own file for that
// list. This file turns a list of stitch commands (see stitch-plan.js for where those come
// from) into two of them:
//
//   .dst   Tajima's. Almost every machine can read it, including Brother's.
//   .pes   Brother's own (version 1, which every Brother machine and program reads).
//
// A plan is { name, threads: [[r, g, b], ...], commands: [{ cmd, x, y }, ...] } where cmd is
// 'stitch', 'jump' (move without stitching), 'trim' (cut the thread), 'color' (change thread)
// or 'end'. Positions are whole numbers in tenths of a millimeter from the middle of the design,
// and y grows UP (like the turtle's paper). A thread is the color the stitches should have.
//
// The layouts of both files are written down in public documentation and in open source
// programs; this code is written fresh from that, and the tests check it against another
// program's reader and writer (pyembroidery, which is not part of TurtleLab). See NOTICE.md.

/** The most a machine can move in one record: 12.1 mm for .dst, 204.7 mm for .pes. */
export const MAX_DST_MOVE = 121;
export const MAX_PES_MOVE = 2047;

// ---- The Brother thread colors ----------------------------------------------------------------------

/**
 * Brother's 64 thread colors. A .pes file does not say what color a thread is. It says "number 5",
 * and the machine shows its own picture of number 5, so the colors of the design have to be matched
 * to this list. Index 0 is not used. (The colors are Brother's thread chart.)
 */
export const PEC_PALETTE = [
  null,
  ['Prussian Blue', 0x0e1f7c], ['Blue', 0x0a55a3], ['Teal Green', 0x008777], ['Cornflower Blue', 0x4b6baf],
  ['Red', 0xed171f], ['Reddish Brown', 0xd15c00], ['Magenta', 0x913697], ['Light Lilac', 0xe49acb],
  ['Lilac', 0x915fac], ['Mint Green', 0x9ed67d], ['Deep Gold', 0xe8a900], ['Orange', 0xfeba35],
  ['Yellow', 0xffff00], ['Lime Green', 0x70bc1f], ['Brass', 0xba9800], ['Silver', 0xa8a8a8],
  ['Russet Brown', 0x7d6f00], ['Cream Brown', 0xffffb3], ['Pewter', 0x4f5556], ['Black', 0x000000],
  ['Ultramarine', 0x0b3d91], ['Royal Purple', 0x770176], ['Dark Gray', 0x293133], ['Dark Brown', 0x2a1301],
  ['Deep Rose', 0xf64a8a], ['Light Brown', 0xb27624], ['Salmon Pink', 0xfcbbc5], ['Vermilion', 0xfe370f],
  ['White', 0xf0f0f0], ['Violet', 0x6a1c8a], ['Seacrest', 0xa8ddc4], ['Sky Blue', 0x2584bb],
  ['Pumpkin', 0xfeb343], ['Cream Yellow', 0xfff36b], ['Khaki', 0xd0a660], ['Clay Brown', 0xd15400],
  ['Leaf Green', 0x66ba49], ['Peacock Blue', 0x134a46], ['Gray', 0x878787], ['Warm Gray', 0xd8ccc6],
  ['Dark Olive', 0x435607], ['Flesh Pink', 0xfdd9de], ['Pink', 0xf993bc], ['Deep Green', 0x003822],
  ['Lavender', 0xb2afd4], ['Wisteria Violet', 0x686ab0], ['Beige', 0xefe3b9], ['Carmine', 0xf73866],
  ['Amber Red', 0xb54b64], ['Olive Green', 0x132b1a], ['Dark Fuchsia', 0xc70156], ['Tangerine', 0xfe9e32],
  ['Light Blue', 0xa8deeb], ['Emerald Green', 0x00673e], ['Purple', 0x4e2990], ['Moss Green', 0x2f7e20],
  ['Flesh Pink', 0xffcccc], ['Harvest Gold', 0xffd911], ['Electric Blue', 0x095ba6], ['Lemon Yellow', 0xf0f970],
  ['Fresh Green', 0xe3f35b], ['Orange', 0xff9900], ['Cream Yellow', 0xfff08d], ['Applique', 0xffc8c8],
];

/**
 * How different two colors look, using the "redmean" measure: it counts a difference in green most,
 * and weighs red and blue by how red the two colors are, which is closer to how an eye sees than just
 * adding up the differences. (From a paper on color distance by Thiadmer Riemersma.)
 */
export function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  const redMean = Math.round((r1 + r2) / 2);
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;
  return (((512 + redMean) * r * r) >> 8) + 4 * g * g + (((767 - redMean) * b * b) >> 8);
}

const rgbOf = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/**
 * Which Brother color to use for each thread of a design: the closest one that no other thread has
 * already taken, so a design with two similar threads still shows two different ones. Returns the
 * numbers (1 to 64), in the order of the threads.
 */
export function brotherColorsFor(threads) {
  const taken = new Set();
  return threads.map((thread) => {
    let best = -1;
    let bestDistance = Infinity;
    for (let index = 1; index < PEC_PALETTE.length; index += 1) {
      if (taken.has(index)) continue;
      const distance = colorDistance(thread, rgbOf(PEC_PALETTE[index][1]));
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    // More than 64 threads cannot all be different: start again from the closest, whichever it is.
    if (best === -1) {
      for (let index = 1; index < PEC_PALETTE.length; index += 1) {
        const distance = colorDistance(thread, rgbOf(PEC_PALETTE[index][1]));
        if (distance <= bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
    }
    taken.add(best);
    return best;
  });
}

// ---- Writing bytes ----------------------------------------------------------------------------------

/** A growing list of bytes with the number-writing helpers a file format needs. */
class Bytes {
  constructor() {
    this.data = [];
  }

  get length() {
    return this.data.length;
  }

  u8(n) {
    this.data.push(n & 255);
  }

  u16(n) {
    this.data.push(n & 255, (n >> 8) & 255);
  }

  u24(n) {
    this.data.push(n & 255, (n >> 8) & 255, (n >> 16) & 255);
  }

  u32(n) {
    this.data.push(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255);
  }

  f32(n) {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, n, true);
    for (let i = 0; i < 4; i += 1) this.data.push(view.getUint8(i));
  }

  /** Text: one byte for each character (all the text written here is plain letters, digits and spaces). */
  text(s) {
    for (const ch of s) this.data.push(ch.charCodeAt(0) & 255);
  }

  fill(byte, count) {
    for (let i = 0; i < count; i += 1) this.data.push(byte);
  }

  patch(at, bytes) {
    bytes.forEach((byte, i) => { this.data[at + i] = byte; });
  }

  toUint8Array() {
    return Uint8Array.from(this.data);
  }
}

/** A name that is safe to put in a header: plain letters, digits and a few marks, never longer than `max`. */
export function plainName(name, max) {
  const cleaned = String(name ?? '').replace(/[^A-Za-z0-9 _.-]/g, '').trim();
  return (cleaned || 'TurtleLab').slice(0, max);
}

const pad = (text, width) => text.padEnd(width, ' ');
const padLeft = (value, width) => String(value).padStart(width, ' ');

// ---- Moves longer than a record can say -------------------------------------------------------------

/** Round to the nearest whole number, with halves going to the even one (112.5 and 113.5 both give an even number). */
function roundHalfEven(n) {
  const floor = Math.floor(n);
  const fraction = n - floor;
  if (fraction < 0.5) return floor;
  if (fraction > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Cut a move into equal pieces, none bigger than `limit` along either axis, so the pieces add up exactly.
 *
 * This is done the way pyembroidery does it, on purpose, so the files are the same to the byte: the even
 * share is added on again and again from where the move starts (`startX`, `startY`, the needle's place on
 * the whole design), and each piece is what is needed to reach that spot from where the last piece
 * ended, rounded with halves going to the even number. Doing the sum another way (say, by multiplying)
 * is just as even, but rounds a half the other way now and then.
 */
export function splitMove(dx, dy, limit, startX = 0, startY = 0) {
  if (Math.abs(dx) <= limit && Math.abs(dy) <= limit) return [[dx, dy]];
  const steps = Math.max(Math.ceil(Math.abs(dx / limit)), Math.ceil(Math.abs(dy / limit)));
  const shareX = dx / steps;
  const shareY = dy / steps;
  const out = [];
  let wantX = startX;
  let wantY = startY;
  let doneX = startX;
  let doneY = startY;
  for (let i = 1; i < steps; i += 1) {
    wantX += shareX;
    wantY += shareY;
    const stepX = roundHalfEven(wantX - doneX);
    const stepY = roundHalfEven(wantY - doneY);
    out.push([stepX, stepY]);
    doneX += stepX;
    doneY += stepY;
  }
  // The last piece lands exactly on the end of the move.
  out.push([startX + dx - doneX, startY + dy - doneY]);
  return out;
}

/** A trim right beside a color change is pointless (the machine cuts the thread to change it), so it is left out. */
function dropRedundantTrims(commands) {
  return commands.filter((command, i) => command.cmd !== 'trim' || (commands[i - 1]?.cmd !== 'color' && commands[i + 1]?.cmd !== 'color'));
}

/** The commands with every move cut down to what the file can hold. Commands that do not move pass through. */
function limitMoves(commands, limit) {
  const out = [];
  let x = 0;
  let y = 0;
  for (const command of dropRedundantTrims(commands)) {
    if (command.cmd === 'stitch' || command.cmd === 'jump') {
      const dx = command.x - x;
      const dy = command.y - y;
      let atX = x;
      let atY = y;
      for (const [sx, sy] of splitMove(dx, dy, limit, x, y)) {
        atX += sx;
        atY += sy;
        out.push({ cmd: command.cmd, x: atX, y: atY });
      }
      x = command.x;
      y = command.y;
    } else {
      out.push({ cmd: command.cmd, x, y });
    }
  }
  return out;
}

/** The box round everything the needle visits: { minX, minY, maxX, maxY }, or all zeros if nothing. */
export function planBounds(commands) {
  if (commands.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const { x, y } of commands) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

// ---- .dst (Tajima) ----------------------------------------------------------------------------------

/**
 * One 3 byte record: a move of (dx, dy) tenths of a millimeter, each at most 121, in y UP. The
 * numbers are written in a kind of base 3 (add up some of 1, 3, 9, 27, 81, each with a plus or a
 * minus), one bit for each, spread over the three bytes. The third byte also says what to do:
 * stitch, jump, change color, or end.
 */
export function dstRecord(dx, dy, kind = 'stitch') {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  const bit = (n) => 1 << n;
  if (kind === 'color') return [0, 0, 0b11000011];
  if (kind === 'end') return [0, 0, 0b11110011];
  if (kind === 'jump') b2 += bit(7);
  b2 += bit(0) + bit(1);
  let x = dx;
  let y = dy;
  if (x > 40) { b2 += bit(2); x -= 81; }
  if (x < -40) { b2 += bit(3); x += 81; }
  if (x > 13) { b1 += bit(2); x -= 27; }
  if (x < -13) { b1 += bit(3); x += 27; }
  if (x > 4) { b0 += bit(2); x -= 9; }
  if (x < -4) { b0 += bit(3); x += 9; }
  if (x > 1) { b1 += bit(0); x -= 3; }
  if (x < -1) { b1 += bit(1); x += 3; }
  if (x > 0) { b0 += bit(0); x -= 1; }
  if (x < 0) { b0 += bit(1); x += 1; }
  if (y > 40) { b2 += bit(5); y -= 81; }
  if (y < -40) { b2 += bit(4); y += 81; }
  if (y > 13) { b1 += bit(5); y -= 27; }
  if (y < -13) { b1 += bit(4); y += 27; }
  if (y > 4) { b0 += bit(5); y -= 9; }
  if (y < -4) { b0 += bit(4); y += 9; }
  if (y > 1) { b1 += bit(7); y -= 3; }
  if (y < -1) { b1 += bit(6); y += 3; }
  if (y > 0) { b0 += bit(7); y -= 1; }
  if (y < 0) { b0 += bit(6); y += 1; }
  if (x !== 0 || y !== 0) throw new RangeError(`A .dst record cannot move ${dx}, ${dy}`);
  return [b0, b1, b2];
}

/** Read a record back: { dx, dy, kind }. (Used by the tests, which check every move a record can hold.) */
export function dstDecode([b0, b1, b2]) {
  if (b2 === 0b11110011) return { dx: 0, dy: 0, kind: 'end' };
  if (b2 === 0b11000011) return { dx: 0, dy: 0, kind: 'color' };
  const on = (byte, n) => ((byte >> n) & 1) === 1;
  let dx = 0;
  let dy = 0;
  if (on(b0, 0)) dx += 1; if (on(b0, 1)) dx -= 1; if (on(b0, 2)) dx += 9; if (on(b0, 3)) dx -= 9;
  if (on(b1, 0)) dx += 3; if (on(b1, 1)) dx -= 3; if (on(b1, 2)) dx += 27; if (on(b1, 3)) dx -= 27;
  if (on(b2, 2)) dx += 81; if (on(b2, 3)) dx -= 81;
  if (on(b0, 7)) dy += 1; if (on(b0, 6)) dy -= 1; if (on(b0, 5)) dy += 9; if (on(b0, 4)) dy -= 9;
  if (on(b1, 7)) dy += 3; if (on(b1, 6)) dy -= 3; if (on(b1, 5)) dy += 27; if (on(b1, 4)) dy -= 27;
  if (on(b2, 5)) dy += 81; if (on(b2, 4)) dy -= 81;
  return { dx, dy, kind: on(b2, 7) ? 'jump' : 'stitch' };
}

/**
 * A .dst file: a 512 byte header of plain text (the name, how many stitches and color changes, how big
 * the design is) and then one 3 byte record for each stitch, jump, color change and the end. A trim is
 * three tiny jumps in a row, which is how Tajima machines are told to cut the thread.
 */
export function encodeDst(plan) {
  const commands = limitMoves(plan.commands, MAX_DST_MOVE);
  const box = planBounds(commands);
  const colorChanges = commands.filter((c) => c.cmd === 'color').length;
  const last = commands.length ? commands[commands.length - 1] : { x: 0, y: 0 };

  const out = new Bytes();
  out.text(`LA:${pad(plainName(plan.name, 16), 16)}\r`);
  out.text(`ST:${padLeft(commands.length, 7)}\r`);
  out.text(`CO:${padLeft(colorChanges, 3)}\r`);
  out.text(`+X:${padLeft(Math.abs(box.maxX), 5)}\r`);
  out.text(`-X:${padLeft(Math.abs(box.minX), 5)}\r`);
  // A .dst counts y the other way from the plan (its records are written with y turned over, below),
  // so the plan's lowest point is the file's +Y and its highest point is the file's -Y.
  out.text(`+Y:${padLeft(Math.abs(box.minY), 5)}\r`);
  out.text(`-Y:${padLeft(Math.abs(box.maxY), 5)}\r`);
  out.text(`AX:${last.x >= 0 ? '+' : '-'}${padLeft(Math.abs(last.x), 5)}\r`);
  out.text(`AY:${last.y >= 0 ? '+' : '-'}${padLeft(Math.abs(last.y), 5)}\r`);
  out.text(`MX:+${padLeft(0, 5)}\r`);
  out.text(`MY:+${padLeft(0, 5)}\r`);
  out.text(`PD:${pad('******', 6)}\r`);
  out.u8(0x1a);
  out.fill(0x20, 512 - out.length);

  let x = 0;
  let y = 0;
  const write = (record) => record.forEach((byte) => out.u8(byte));
  for (const command of commands) {
    const dx = command.x - x;
    const dy = command.y - y;
    x = command.x;
    y = command.y;
    if (command.cmd === 'trim') {
      write(dstRecord(2, -2, 'jump'));
      write(dstRecord(-4, 4, 'jump'));
      write(dstRecord(2, -2, 'jump'));
    } else {
      write(dstRecord(dx, dy, command.cmd));
    }
  }
  return out.toUint8Array();
}

// ---- .pes (Brother) ---------------------------------------------------------------------------------

const PEC_ICON_WIDTH = 48;
const PEC_ICON_HEIGHT = 38;
const PEC_ICON_STRIDE = PEC_ICON_WIDTH / 8;

/** The small framed picture of a blank design that the machine shows on its screen (a border, 48 by 38 dots). */
function blankIcon() {
  const rows = [];
  const frame = [0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f];
  rows.push([0, 0, 0, 0, 0, 0]);
  rows.push(frame);
  rows.push([0x08, 0, 0, 0, 0, 0x10]);
  rows.push([0x04, 0, 0, 0, 0, 0x20]);
  for (let i = 4; i < 34; i += 1) rows.push([0x02, 0, 0, 0, 0, 0x40]);
  rows.push([0x04, 0, 0, 0, 0, 0x20]);
  rows.push([0x08, 0, 0, 0, 0, 0x10]);
  rows.push(frame);
  rows.push([0, 0, 0, 0, 0, 0]);
  return rows.flat();
}

/** Mark the needle's spots on a picture, scaled to fit the picture the way the machine's own files do. */
function drawIcon(icon, points, box, buffer) {
  const width = box.maxX - box.minX || 1;
  const height = box.maxY - box.minY || 1;
  const iconHeight = icon.length / PEC_ICON_STRIDE;
  const scale = Math.min((PEC_ICON_WIDTH - buffer) / width, (iconHeight - buffer) / height);
  const cx = (box.maxX + box.minX) / 2;
  const cy = (box.maxY + box.minY) / 2;
  const tx = -cx * scale + PEC_ICON_WIDTH / 2;
  const ty = -cy * scale + iconHeight / 2;
  for (const { x, y } of points) {
    const px = Math.floor(x * scale + tx);
    const py = Math.floor(y * scale + ty);
    if (px < 0 || py < 0 || px >= PEC_ICON_WIDTH || py >= iconHeight) continue;
    icon[py * PEC_ICON_STRIDE + Math.floor(px / 8)] |= 1 << (px % 8);
  }
}

/** One number of the stitch data: one byte if it is small, two (with a flag) if not. */
function pecValue(out, value, long = false, flag = 0) {
  if (!long && value > -64 && value < 63) {
    out.u8(value & 0x7f);
    return;
  }
  const word = (value & 0x0fff) | 0x8000 | (flag << 8);
  out.u8((word >> 8) & 255);
  out.u8(word & 255);
}

const PEC_JUMP = 0b00010000;
const PEC_TRIM = 0b00100000;

/** The stitch data of a .pes file: each move as the change from the one before, y DOWN, ending in 0xFF. */
function encodePecStitches(out, commands) {
  let colorTwo = true;
  let jumping = true;
  let first = true;
  let x = 0;
  let y = 0;
  for (const command of commands) {
    const dx = command.x - x;
    const dy = -command.y - y; // this file counts y downwards
    x = command.x;
    y = -command.y;
    if (command.cmd === 'stitch') {
      if (jumping) {
        if (dx !== 0 && dy !== 0) {
          pecValue(out, 0);
          pecValue(out, 0);
        }
        jumping = false;
      }
      pecValue(out, dx);
      pecValue(out, dy);
    } else if (command.cmd === 'jump') {
      jumping = true;
      const flag = first ? PEC_JUMP : PEC_TRIM;
      pecValue(out, dx, true, flag);
      pecValue(out, dy, true, flag);
    } else if (command.cmd === 'color') {
      if (jumping) {
        pecValue(out, 0);
        pecValue(out, 0);
        jumping = false;
      }
      out.u8(0xfe);
      out.u8(0xb0);
      out.u8(colorTwo ? 2 : 1);
      colorTwo = !colorTwo;
    } else if (command.cmd === 'end') {
      out.u8(0xff);
      break;
    }
    first = false;
  }
}

/** The part of a .pes file that machines read: name, thread numbers, stitches, and little pictures. */
function writePec(out, plan, commands, colorNumbers) {
  // y DOWN for everything in here, like the stitch data.
  const down = commands.map((c) => ({ ...c, y: -c.y }));
  const box = planBounds(down);

  out.text(`LA:${pad(plainName(plan.name, 8), 16)}\r`);
  out.fill(0x20, 12);
  out.u8(0xff);
  out.u8(0x00);
  out.u8(PEC_ICON_STRIDE);
  out.u8(PEC_ICON_HEIGHT);
  const threadCount = colorNumbers.length;
  if (threadCount !== 0) {
    out.fill(0x20, 12);
    out.u8(threadCount - 1);
    colorNumbers.forEach((n) => out.u8(n));
  } else {
    out.data.push(0x20, 0x20, 0x20, 0x20, 0x64, 0x20, 0x00, 0x20, 0x00, 0x20, 0x20, 0x20, 0xff);
  }
  out.fill(0x20, 463 - threadCount);

  const blockStart = out.length;
  out.u8(0);
  out.u8(0);
  out.u24(0); // the length, written in below
  out.u8(0x31);
  out.u8(0xff);
  out.u8(0xf0);
  out.u16(Math.round(box.maxX - box.minX));
  out.u16(Math.round(box.maxY - box.minY));
  out.u16(0x1e0);
  out.u16(0x1b0);
  encodePecStitches(out, commands);
  const length = out.length - blockStart;
  out.patch(blockStart + 2, [length & 255, (length >> 8) & 255, (length >> 16) & 255]);

  // The pictures: the whole design, then each color on its own.
  const stitchPoints = (list) => list.filter((c) => c.cmd === 'stitch');
  const whole = blankIcon();
  // The first picture draws each run of stitches (everything between jumps and color changes).
  drawIcon(whole, stitchPoints(down), box, 4);
  out.data.push(...whole);
  let start = 0;
  const blocks = [];
  down.forEach((c, i) => {
    if (c.cmd === 'color') {
      blocks.push(down.slice(start, i + 1));
      start = i + 1;
    }
  });
  if (start !== down.length) blocks.push(down.slice(start));
  for (const block of blocks) {
    const icon = blankIcon();
    drawIcon(icon, stitchPoints(block), box, 5);
    out.data.push(...icon);
  }
}

/**
 * A .pes file, version 1: a short header that says where the machine's part starts, a description of
 * the stitches as shapes (which Brother's own program uses to let you edit the design), and then the
 * machine's part (see writePec). Which thread is which Brother color is chosen by brotherColorsFor.
 */
export function encodePes(plan) {
  const commands = limitMoves(plan.commands, MAX_PES_MOVE);
  const colorNumbers = brotherColorsFor(plan.threads);
  const out = new Bytes();
  out.text('#PES0001');
  const pecPointerAt = out.length;
  out.u32(0); // where the machine's part starts, written in below

  if (commands.length === 0) {
    out.u16(1);
    out.u16(1);
    out.u16(0);
    out.u16(0);
    out.u16(0);
  } else {
    writePesShapes(out, commands, colorNumbers);
  }
  const pecAt = out.length;
  out.patch(pecPointerAt, [pecAt & 255, (pecAt >> 8) & 255, (pecAt >> 16) & 255, (pecAt >>> 24) & 255]);
  writePec(out, plan, commands, colorNumbers);
  return out.toUint8Array();
}

/** A length-prefixed name, as the PES shape blocks write them. */
function pesString(out, text) {
  out.u16(text.length);
  out.text(text);
}

/**
 * The stitches as "segments": a run of stitches in one color, or a jump. Brother's editing program
 * reads these; the machine does not need them. Positions are measured from the top left of the design,
 * with y down.
 */
function writePesShapes(out, commands, colorNumbers) {
  const down = commands.map((c) => ({ ...c, y: -c.y }));
  const box = planBounds(down);
  const cx = (box.maxX + box.minX) / 2;
  const cy = (box.maxY + box.minY) / 2;
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  out.u16(1); // scale to fit
  out.u16(1); // the larger hoop
  out.u16(1); // how many shapes there are
  out.u16(0xffff);
  out.u16(0x0000);
  pesString(out, 'CEmbOne');
  for (let i = 0; i < 8; i += 1) out.u16(0);
  const hoopWidth = 1300;
  const hoopHeight = 1800;
  out.f32(1); out.f32(0); out.f32(0); out.f32(1);
  out.f32(350 + hoopWidth / 2 - width / 2);
  out.f32(100 + height + hoopHeight / 2 - height / 2);
  out.u16(1);
  out.u16(0);
  out.u16(0);
  out.u16(Math.trunc(width));
  out.u16(Math.trunc(height));
  out.fill(0, 8);
  const sectionCountAt = out.length;
  out.u16(0); // how many sections, written in below
  out.u16(0xffff);
  out.u16(0x0000);
  pesString(out, 'CSewSeg');

  // Cut the commands into runs of the same kind, the way the segments are cut.
  const runs = [];
  for (const command of down) {
    const previous = runs[runs.length - 1];
    if (previous && previous.cmd === command.cmd) previous.items.push(command);
    else runs.push({ cmd: command.cmd, items: [command] });
  }
  let colorIndex = 0;
  let colorNumber = colorNumbers.length ? colorNumbers[0] : 0;
  colorIndex += 1;
  let stitchedX = 0;
  let stitchedY = 0;
  let sections = 0;
  let first = true;
  let previousColor = -1;
  const colorLog = [];
  const left = box.minX;
  const bottom = box.maxY;
  for (const run of runs) {
    let points;
    let flag;
    if (run.cmd === 'jump') {
      const last = run.items[run.items.length - 1];
      points = [[stitchedX - left, stitchedY - bottom], [last.x - left, last.y - bottom]];
      flag = 1;
    } else if (run.cmd === 'color') {
      colorNumber = colorIndex < colorNumbers.length ? colorNumbers[colorIndex] : colorNumbers[colorNumbers.length - 1] ?? 0;
      colorIndex += 1;
      continue;
    } else if (run.cmd === 'stitch') {
      points = run.items.map((c) => {
        stitchedX = c.x;
        stitchedY = c.y;
        return [c.x - left, c.y - bottom];
      });
      flag = 0;
    } else {
      continue;
    }
    if (!first) out.u16(0x8003); // the end of the section before
    first = false;
    if (previousColor !== colorNumber) {
      colorLog.push([sections, colorNumber]);
      previousColor = colorNumber;
    }
    out.u16(flag);
    out.u16(colorNumber);
    out.u16(points.length);
    for (const [px, py] of points) {
      out.u16(Math.trunc(px));
      out.u16(Math.trunc(py));
    }
    sections += 1;
  }
  out.u16(colorLog.length);
  for (const [section, number] of colorLog) {
    out.u16(section);
    out.u16(number);
  }
  out.u16(0);
  out.u16(0);
  out.patch(sectionCountAt, [sections & 255, (sections >> 8) & 255]);
  void cx; void cy;
}
