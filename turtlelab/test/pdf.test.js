// Tests for the PDF writer, and for opening a PDF in TurtleLab again.
//
// Some read the PDF back with plain code (the table of where objects start, the pictures,
// the attached PNG). The last ones ask poppler's tools (pdfinfo, pdfdetach, pdftoppm) what
// they make of it, which is the closest a test gets to a real PDF viewer. They are skipped
// if those tools are not installed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 as nodeCrc32, deflateSync, inflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildPdf, fitInside } from '../js/core/pdf.js';
import { fontModule } from '../dev/make-font-data.mjs';
import { PNG_SIGNATURE, readChunks } from '../js/core/png-chunks.js';
import { embedProject, readProjectFile, isPdf, findAttachedPng } from '../js/core/project-file.js';
import { FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';

// ---- Fixtures ----------------------------------------------------------------------------------

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(nodeCrc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return new Uint8Array(out);
}

function plainPng(width = 6, height = 4) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) rows.push(Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 4, 40 + y)]));
  const parts = [PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const project = () => ({
  app: FORMAT_ID,
  version: FORMAT_VERSION,
  stacks: [{ x: 30, y: 40, blocks: [{ op: 'start' }, { op: 'clean' }, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }] }] }],
});

/** A picture of `width` by `height` pixels in which every pixel is a different, known color. */
function rainbow(width, height) {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < rgb.length; i += 1) rgb[i] = (i * 7 + (i >> 3)) & 255;
  return { width, height, rgb };
}

const NAME = 'turtlelab-2026-11-03-1409.png';
const attachment = () => ({ name: NAME, bytes: embedProject(plainPng(), project()) });

async function makePdf(overrides = {}) {
  return buildPdf({
    title: 'turtlelab-2026-11-03-1409',
    code: { ...rainbow(40, 30), pixelsPerPoint: 2 },
    drawing: rainbow(70, 56),
    attachment: attachment(),
    date: new Date(Date.UTC(2026, 10, 3, 14, 9, 5)),
    ...overrides,
  });
}

const latin1 = (bytes) => Buffer.from(bytes).toString('latin1');
const same = (a, b) => a.length === b.length && a.every((byte, i) => byte === b[i]);

// ---- Fitting a picture in a box -----------------------------------------------------------------

test('a picture is made to fit its box without being squashed, and is not blown up past its own size', () => {
  assert.deepEqual(fitInside(1000, 500, 500, 500), { width: 500, height: 250 });
  assert.deepEqual(fitInside(200, 400, 500, 500), { width: 200, height: 400 }, 'already small enough: left alone');
  assert.deepEqual(fitInside(100, 100, 500, 500, 2), { width: 200, height: 200 }, 'unless it is allowed to grow');
  const fitted = fitInside(700, 560, 540, 346);
  assert.ok(Math.abs(fitted.width / fitted.height - 700 / 560) < 1e-9, 'same shape');
});

// ---- The file itself ----------------------------------------------------------------------------

test('it is a one page US Letter PDF with the usual start and end', async () => {
  const pdf = await makePdf();
  const text = latin1(pdf);
  assert.ok(isPdf(pdf));
  assert.match(text, /^%PDF-1\.4\n/);
  assert.match(text, /\n%%EOF\n$/);
  assert.match(text, /\/Type \/Pages \/Kids \[3 0 R\] \/Count 1/);
  assert.match(text, /\/MediaBox \[0 0 612 792\]/);
  assert.match(text, /\/Title \(turtlelab-2026-11-03-1409\)/);
  assert.match(text, /\/CreationDate D:20261103140905Z/);
});

test('the table of where every object starts is right, so a viewer can find them', async () => {
  const pdf = await makePdf();
  const text = latin1(pdf);
  const tableAt = Number(text.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(text.slice(tableAt, tableAt + 4), 'xref');
  const size = Number(text.match(/trailer\n<< \/Size (\d+)/)[1]);
  const rows = text.slice(tableAt).split('\n').slice(2, 2 + size).map((row) => row.trim());
  assert.equal(rows[0], '0000000000 65535 f');
  for (let id = 1; id < size; id += 1) {
    const at = Number(rows[id].slice(0, 10));
    assert.ok(text.startsWith(`${id} 0 obj\n`, at), `object ${id} is where the table says (${at})`);
  }
});

test('the blocks and the drawing are stored as squashed pixels that come out exactly as they went in', async () => {
  const pdf = await makePdf();
  const text = latin1(pdf);
  const found = [...text.matchAll(/(\d+) 0 obj\n<< \/Type \/XObject \/Subtype \/Image \/Width (\d+) \/Height (\d+) \/ColorSpace \/DeviceRGB \/BitsPerComponent 8 \/Filter \/FlateDecode \/Length (\d+) >>\nstream\n/g)];
  assert.equal(found.length, 2);
  const expected = { 40: rainbow(40, 30), 70: rainbow(70, 56) };
  for (const match of found) {
    const [start, width, , length] = [match.index + match[0].length, Number(match[2]), Number(match[3]), Number(match[4])];
    const pixels = inflateSync(pdf.subarray(start, start + length));
    assert.ok(same(pixels, expected[width].rgb), `the ${width} wide picture comes back exactly`);
  }
});

test('the attached PNG is stored plain, byte for byte, with its blocks still inside', async () => {
  const pdf = await makePdf();
  const text = latin1(pdf);
  assert.match(text, /\/Type \/Filespec \/F \(turtlelab-2026-11-03-1409\.png\)/);
  assert.match(text, /\/Names \[\(turtlelab-2026-11-03-1409\.png\) \d+ 0 R\]/);
  assert.match(text, /\/Subtype \/image#2Fpng/);
  const png = findAttachedPng(pdf);
  assert.ok(png, 'it can be found');
  assert.ok(same(png.subarray(0, attachment().bytes.length), attachment().bytes), 'the same bytes that were given');
  assert.equal(readChunks(png).at(-1).type, 'IEND', 'and it is a whole PNG');
});

test('with no blocks on the page, the top half says so and only the drawing is a picture', async () => {
  const pdf = await makePdf({ code: null });
  const text = latin1(pdf);
  assert.match(text, /There are no blocks on the page\./);
  assert.equal([...text.matchAll(/\/Subtype \/Image/g)].length, 1);
});

test('only plain text goes in, and the characters PDF treats as special are escaped', async () => {
  const pdf = await makePdf({ title: 'a (odd) \\ name é' });
  assert.match(latin1(pdf), /\/Title \(a \\\(odd\\\) \\\\ name \?\)/);
});

test('the pictures are in the right halves: the blocks above the line, the drawing below', async () => {
  const text = latin1(await makePdf());
  const contents = text.match(/5 0 obj\n<< \/Length \d+ >>\nstream\n([\s\S]*?)\nendstream/)[1];
  const placements = [...contents.matchAll(/q ([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm \/(\w+) Do Q/g)].map((m) => ({ name: m[5], x: Number(m[3]), y: Number(m[4]), w: Number(m[1]), h: Number(m[2]) }));
  const code = placements.find((p) => p.name === 'Code');
  const drawing = placements.find((p) => p.name === 'Drawing');
  assert.ok(code.y > 792 / 2 && code.y + code.h <= 792 - 36, 'the blocks are in the top half, inside the margin');
  assert.ok(drawing.y >= 36 && drawing.y + drawing.h < 792 / 2, 'the drawing is in the bottom half, inside the margin');
  assert.ok(code.w <= 20 + 1e-9 && code.h <= 15 + 1e-9, 'blocks drawn twice as sharp as shown are shown at half their pixels');
  assert.ok(Math.abs(code.x - 36) < 1e-9, 'the blocks start at the left margin');
  assert.ok(Math.abs(drawing.x + drawing.w / 2 - 306) < 0.02, 'the drawing is centered');
});

// ---- Opening a PDF in TurtleLab ----------------------------------------------------------------------

test('a TurtleLab PDF opens in TurtleLab: the blocks come back, with the picture to paint', async () => {
  const pdf = await makePdf();
  const result = readProjectFile(pdf);
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'pdf');
  assert.deepEqual(result.project, project());
  assert.equal(readChunks(result.picture).at(-1).type, 'IEND');
});

test('a PNG still reports itself as a PNG, with the picture to paint', () => {
  const result = readProjectFile(embedProject(plainPng(), project()));
  assert.equal(result.kind, 'png');
  assert.equal(result.picture.length > 0, true);
});

test('a PDF that did not come from TurtleLab is turned away politely', () => {
  const other = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
  const result = readProjectFile(other);
  assert.equal(result.ok, false);
  assert.match(result.error, /doesn't have a TurtleLab picture inside it/);
});

test('a PDF that lost its end (the table) still gives up the blocks, but one cut through the picture says so', async () => {
  const pdf = await makePdf();
  const lostTable = pdf.subarray(0, pdf.length - 300);
  assert.deepEqual(readProjectFile(lostTable).project, project(), 'the picture is stored before the table, so it is still whole');
  const pictureAt = pdf.length - findAttachedPng(pdf).length;
  const cutThrough = readProjectFile(pdf.subarray(0, pictureAt + 60));
  assert.equal(cutThrough.ok, false);
  assert.match(cutThrough.error, /cut short/);
});

test('a PDF whose attached picture has no blocks inside says so', async () => {
  const pdf = await makePdf({ attachment: { name: NAME, bytes: plainPng() } });
  const result = readProjectFile(pdf);
  assert.equal(result.ok, false);
  assert.match(result.error, /doesn't have a program inside it/);
});

// ---- What a real PDF viewer makes of it -----------------------------------------------------------------

const hasPoppler = ['pdfinfo', 'pdfdetach', 'pdftoppm'].every((tool) => spawnSync(tool, ['-v']).status !== null && !spawnSync(tool, ['-v']).error);
const needsPoppler = { skip: hasPoppler ? false : 'poppler (pdfinfo, pdfdetach, pdftoppm) is not installed' };

async function writeTemp(bytes) {
  const dir = mkdtempSync(join(tmpdir(), 'turtlelab-pdf-'));
  const file = join(dir, 'out.pdf');
  writeFileSync(file, await bytes);
  return { dir, file };
}

test('poppler reads it: one letter page, no complaints, and the attachment is listed', needsPoppler, async () => {
  const { file } = await writeTemp(makePdf());
  const info = spawnSync('pdfinfo', [file], { encoding: 'utf8' });
  assert.equal(info.status, 0, info.stderr);
  assert.match(info.stdout, /Pages:\s+1/);
  assert.match(info.stdout, /Page size:\s+612 x 792 pts \(letter\)/);
  assert.match(info.stdout, /Title:\s+turtlelab-2026-11-03-1409/);
  assert.doesNotMatch(info.stderr, /Syntax|Error/i);
  const listed = spawnSync('pdfdetach', ['-list', file], { encoding: 'utf8' });
  assert.match(listed.stdout, /1 embedded files/);
  assert.match(listed.stdout, /turtlelab-2026-11-03-1409\.png/);
});

test('poppler takes the attached file out and it is the same PNG, which TurtleLab opens', needsPoppler, async () => {
  const { dir, file } = await writeTemp(makePdf());
  const out = join(dir, 'taken.png');
  const saved = spawnSync('pdfdetach', ['-save', '1', '-o', out, file], { encoding: 'utf8' });
  assert.equal(saved.status, 0, saved.stderr);
  const taken = new Uint8Array(readFileSync(out));
  assert.ok(same(taken, attachment().bytes), 'exactly the bytes that were attached');
  assert.deepEqual(readProjectFile(taken).project, project());
});

test('poppler draws the page without errors', needsPoppler, async () => {
  const { dir, file } = await writeTemp(makePdf());
  const made = spawnSync('pdftoppm', ['-png', '-r', '40', file, join(dir, 'page')], { encoding: 'utf8' });
  assert.equal(made.status, 0, made.stderr);
  assert.doesNotMatch(made.stderr, /Syntax|Error/i);
  const png = new Uint8Array(readFileSync(join(dir, 'page-1.png')));
  assert.equal(readChunks(png)[0].type, 'IHDR');
});

test('the font that ships inside the page for the PDF is the same Roboto file the page uses (run dev/make-font-data.mjs)', () => {
  const onDisk = readFileSync(new URL('../js/ui/roboto-data.js', import.meta.url), 'utf8');
  assert.equal(onDisk, fontModule());
  assert.match(onDisk, /Apache License 2\.0/);
});

// ---- Where the blocks and the drawing go ----------------------------------------------------------------

import { chooseLayout, READABLE_SCALE, sizeInPoints } from '../js/core/pdf.js';

const inside = (rect) => rect.x >= 36 - 1e-9 && rect.x + rect.width <= 612 - 36 + 1e-9 && rect.y >= 36 && rect.y + rect.height <= 792 - 36 + 1e-9;
const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const DRAWING = { width: 1400, height: 1120 };

test('a small program keeps the old layout: blocks on the top half, drawing on the bottom half', () => {
  const layout = chooseLayout({ width: 200, height: 250 }, DRAWING);
  assert.equal(layout.kind, 'stacked');
  assert.equal(layout.pages.length, 1);
  const [{ code, drawing, divider }] = layout.pages;
  assert.ok(code.y > 792 / 2 && drawing.y + drawing.height < 792 / 2 && divider > drawing.y + drawing.height && divider < code.y);
  assert.deepEqual([code.width, code.height], [200, 250], 'blocks are never made bigger than they are');
});

test('with no blocks it is the old layout too, and the drawing is in the bottom half', () => {
  const layout = chooseLayout(null, DRAWING);
  assert.equal(layout.kind, 'stacked');
  assert.equal(layout.pages[0].code, null);
});

test('a thin tall program (a dozen blocks) goes down the left with the drawing beside it, still one page', () => {
  // 228 by 760 points: squeezed to the half page it would be about 6.5 point writing. Side by side it keeps 8 or more.
  const code = { width: 228, height: 760 };
  const layout = chooseLayout(code, DRAWING);
  assert.equal(layout.kind, 'side');
  const [{ code: blocks, drawing }] = layout.pages;
  assert.ok(blocks.width / code.width >= READABLE_SCALE, `blocks at ${blocks.width / code.width}`);
  assert.ok(Math.abs(blocks.width / code.width - blocks.height / code.height) < 1e-9, 'not squashed');
  assert.ok(drawing.width >= 380 - 1e-9, `the drawing is ${drawing.width} wide`);
  assert.ok(inside(blocks) && inside(drawing) && !overlap(blocks, drawing), 'both on the page, not on each other');
  assert.ok(Math.abs(blocks.y + blocks.height - (792 - 36 - 18)) < 1e-9 && Math.abs(drawing.y + drawing.height - (792 - 36 - 18)) < 1e-9, 'both start at the top');
});

test('a wide or very long program gets page 1 to itself, and the drawing is page 2', () => {
  for (const code of [{ width: 661, height: 883 }, { width: 1079, height: 853 }, { width: 228, height: 2400 }]) {
    const layout = chooseLayout(code, DRAWING);
    assert.equal(layout.kind, 'pages', JSON.stringify(code));
    assert.equal(layout.pages.length, 2);
    const [first, second] = layout.pages;
    assert.ok(first.code && !first.drawing && !second.code && second.drawing);
    assert.ok(inside(first.code) && inside(second.drawing));
    assert.ok(second.drawing.width > 500, 'the drawing is big on its own page');
    // Page 1 uses the whole page for the blocks, so they are bigger than the half page would have made them.
    const stackedScale = Math.min(540 / code.width, 337 / code.height);
    assert.ok(first.code.width / code.width > stackedScale + 1e-9);
  }
});

test('whatever the program, the writing is as readable as the layouts can make it, and nothing is distorted', () => {
  for (let width = 100; width <= 1200; width += 150) {
    for (let height = 100; height <= 1500; height += 200) {
      const layout = chooseLayout({ width, height }, DRAWING);
      for (const page of layout.pages) {
        for (const rect of [page.code, page.drawing].filter(Boolean)) assert.ok(inside(rect), `${width}x${height} ${layout.kind}`);
        if (page.code && page.drawing) assert.ok(!overlap(page.code, page.drawing), `${width}x${height} ${layout.kind}`);
        if (page.code) assert.ok(Math.abs(page.code.width / width - page.code.height / height) < 1e-9);
      }
      // The stacked layout is only used when it is readable; otherwise something better was found if there was one.
      if (layout.kind === 'stacked') assert.ok(layout.pages[0].code.width / width >= READABLE_SCALE - 1e-9, `${width}x${height}`);
    }
  }
});

test('a PDF with the blocks on page 1 and the drawing on page 2 is a two page PDF that still opens in TurtleLab', async () => {
  const code = { ...rainbow(661 * 2, 883 * 2), pixelsPerPoint: 2 };
  assert.deepEqual(sizeInPoints(code), { width: 661, height: 883 });
  const pdf = await makePdf({ code });
  const text = latin1(pdf);
  assert.match(text, /\/Type \/Pages \/Kids \[3 0 R 7 0 R\] \/Count 2/);
  assert.equal([...text.matchAll(/\/Type \/Page /g)].length, 2);
  assert.ok(text.includes('(turtlelab-2026-11-03-1409  \\(page 1 of 2\\)) Tj'));
  assert.ok(text.includes('(turtlelab-2026-11-03-1409  \\(page 2 of 2\\)) Tj'));
  const tableAt = Number(text.match(/startxref\n(\d+)\n%%EOF/)[1]);
  const size = Number(text.match(/trailer\n<< \/Size (\d+)/)[1]);
  const rows = text.slice(tableAt).split('\n').slice(2, 2 + size).map((row) => row.trim());
  for (let id = 1; id < size; id += 1) assert.ok(text.startsWith(`${id} 0 obj\n`, Number(rows[id].slice(0, 10))), `object ${id}`);
  assert.ok(isPdf(pdf));
});

// ---- The score: a strip on page 1, the reasons on a page after the drawing ------------------------------------------

import { textWidth, wrapText, SCORE_STRIP } from '../js/core/pdf.js';
import { scoreReport } from '../js/core/score-report.js';
import { assess } from '../js/core/quality.js';

const REPORT = () => scoreReport(assess({ project: project(), run: { segments: 4, drawn: 400, filled: false, tiny: 0, walkedUp: 0, walkedDown: 400, steps: 12, hasWrite: false, truncated: false, overdrawn: 0, looked: 100 } }));

/** What is drawn on each page: the text of each content stream, in page order. */
const contentsOf = (pdf) => [...latin1(pdf).matchAll(/<< \/Length \d+ >>\nstream\n([\s\S]*?)\nendstream/g)].map((m) => m[1]);
/** The words shown on a page, in the order they are drawn. */
const wordsOn = (contents) => [...contents.matchAll(/\((.*)\) Tj ET/g)].map((m) => m[1].replace(/\\([()\\])/g, '$1'));

test('text is measured with Helvetica\'s own letter widths, so a line can be broken before the page edge', () => {
  assert.equal(textWidth('', 10), 0);
  assert.equal(textWidth('i', 1000), 222);
  assert.equal(textWidth('W', 1000), 944);
  assert.equal(textWidth('0123456789', 10), 55.6, 'every digit is 556');
  assert.equal(textWidth('é', 1000), textWidth('?', 1000), 'what is not plain ASCII is written as a question mark, so it is measured as one');
});

test('wrapping breaks between words, never makes a line too wide, and keeps every word in order', () => {
  const words = 'the turtle walked 300 steps with the pen up and drew nothing on the way home'.split(' ');
  const lines = wrapText(words.join(' '), 9.5, 150);
  assert.ok(lines.length > 2);
  for (const line of lines) assert.ok(textWidth(line, 9.5) <= 150 + 1e-9, line);
  assert.deepEqual(lines.join(' ').split(' '), words);
  assert.deepEqual(wrapText('', 9.5, 150), []);
  assert.deepEqual(wrapText('   two   words  ', 9.5, 500), ['two words'], 'spaces are tidied');
});

test('a word wider than the whole line is cut rather than run off the page', () => {
  const lines = wrapText('x'.repeat(200), 10, 100);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(textWidth(line, 10) <= 100 + 1e-9);
  assert.equal(lines.join(''), 'x'.repeat(200));
});

test('room is left at the top of page 1 for the strip of scores, in every layout, and the second page is not given less', () => {
  for (const code of [{ width: 200, height: 250 }, { width: 228, height: 760 }, { width: 661, height: 883 }, null]) {
    const reserved = chooseLayout(code, DRAWING, SCORE_STRIP);
    const [first] = reserved.pages;
    for (const rect of [first.code, first.drawing].filter(Boolean)) {
      assert.ok(inside(rect), JSON.stringify(code));
      if (reserved.kind !== 'pages' || rect === first.code) assert.ok(rect.y + rect.height <= 792 - 36 - 18 - SCORE_STRIP + 1e-9, `${reserved.kind}: the pictures start under the strip`);
    }
    if (first.code && first.drawing) assert.ok(!overlap(first.code, first.drawing));
  }
  const plain = chooseLayout({ width: 661, height: 883 }, DRAWING);
  const reserved = chooseLayout({ width: 661, height: 883 }, DRAWING, SCORE_STRIP);
  assert.equal(reserved.kind, 'pages');
  assert.deepEqual(reserved.pages[1], plain.pages[1], 'the drawing on page 2 has the whole page, as before');
  assert.deepEqual(chooseLayout({ width: 200, height: 250 }, DRAWING, 0), chooseLayout({ width: 200, height: 250 }, DRAWING), 'no reserve is the old layout');
});

test('with a score, a small program is two pages: the pictures and the strip, then the reasons', async () => {
  const pdf = await makePdf({ report: REPORT() });
  const text = latin1(pdf);
  assert.match(text, /\/Type \/Pages \/Kids \[3 0 R 7 0 R\] \/Count 2/);
  assert.match(text, /\/BaseFont \/Helvetica-Bold/, 'the numbers and headings are bold');
  const [first, second] = contentsOf(pdf);
  const one = wordsOn(first);
  assert.deepEqual(one.slice(0, 1), ['turtlelab-2026-11-03-1409  (page 1 of 2)']);
  for (const label of ['BLOCKS', 'COMPLEXITY', 'ELEGANCE', 'EFFICIENCY']) assert.ok(one.includes(label), label);
  assert.ok(/\/Code Do/.test(first) && /\/Drawing Do/.test(first), 'both pictures are still on page 1');
  const two = wordsOn(second);
  assert.equal(two[0], 'turtlelab-2026-11-03-1409  (page 2 of 2)');
  assert.ok(two.includes('Score and reasons'));
  assert.ok(!/ Do Q/.test(second), 'the reasons page has no pictures');
  const tableAt = Number(text.match(/startxref\n(\d+)\n%%EOF/)[1]);
  const size = Number(text.match(/trailer\n<< \/Size (\d+)/)[1]);
  const rows = text.slice(tableAt).split('\n').slice(2, 2 + size).map((row) => row.trim());
  for (let id = 1; id < size; id += 1) assert.ok(text.startsWith(`${id} 0 obj\n`, Number(rows[id].slice(0, 10))), `object ${id} is where the table says`);
  assert.deepEqual(readProjectFile(pdf).project, project(), 'it still opens in TurtleLab');
});

test('the reasons page says every reason the badge gives, each one once, with Good or Tip beside it', async () => {
  const report = REPORT();
  const pdf = await makePdf({ report });
  const two = wordsOn(contentsOf(pdf)[1]).join(' ');
  for (const section of report.sections) {
    assert.ok(two.includes(section.heading), section.heading);
    for (const line of section.lines.filter((l) => l.kind === 'good' || l.kind === 'tip')) {
      // A long reason is wrapped onto several lines, so look for its first and last words.
      const words = line.text.split(' ');
      assert.ok(two.includes(words.slice(0, 3).join(' ')) && two.includes(words.slice(-3).join(' ')), line.text);
    }
  }
  assert.ok(wordsOn(contentsOf(pdf)[1]).includes('Good') || wordsOn(contentsOf(pdf)[1]).includes('Tip'));
});

test('with no blocks the first page still has the strip and says there are no blocks, below it', async () => {
  const empty = scoreReport(assess({ project: { app: FORMAT_ID, version: FORMAT_VERSION, stacks: [] } }));
  const pdf = await makePdf({ code: null, report: empty });
  const [first] = contentsOf(pdf);
  assert.ok(wordsOn(first).includes('There are no blocks on the page.'));
  const noBlocksY = Number(first.match(/ ([\d.]+) Td \(There are no blocks/)[1]);
  const labelY = Number(first.match(/ ([\d.]+) Td \(COMPLEXITY\)/)[1]);
  assert.ok(noBlocksY < labelY - 20, 'the sentence is under the strip, not on it');
});

test('a very long report runs on to more pages, none of its lines goes below the bottom margin, and every page has a title', async () => {
  const lines = Array.from({ length: 60 }, (_, i) => ({ kind: i % 2 ? 'tip' : 'good', text: `Reason number ${i}: ${'a few more words to make the line wrap onto a second row '.repeat(3)}` }));
  const report = { scores: REPORT().scores, sections: [{ heading: 'Elegance: 0.5', lines }] };
  const pdf = await makePdf({ report });
  const streams = contentsOf(pdf);
  assert.ok(streams.length >= 4, `${streams.length} pages`);
  streams.forEach((stream, i) => {
    assert.ok(wordsOn(stream)[0].includes(`(page ${i + 1} of ${streams.length})`));
    for (const y of [...stream.matchAll(/ ([\d.]+) Td /g)].map((m) => Number(m[1]))) assert.ok(y >= 36 - 5, `y ${y} on page ${i + 1}`);
  });
  assert.match(latin1(pdf), new RegExp(`/Count ${streams.length}`));
});

test('poppler reads the score: the numbers on page 1, the reasons on page 2', needsPoppler, async () => {
  const { file } = await writeTemp(makePdf({ report: REPORT() }));
  const info = spawnSync('pdfinfo', [file], { encoding: 'utf8' });
  assert.match(info.stdout, /Pages:\s+2/);
  assert.doesNotMatch(info.stderr, /Syntax|Error/i);
  if (spawnSync('pdftotext', ['-v']).error) return;
  const page = (n) => spawnSync('pdftotext', ['-layout', '-f', String(n), '-l', String(n), file, '-'], { encoding: 'utf8' }).stdout;
  assert.match(page(1), /BLOCKS\s+COMPLEXITY\s+ELEGANCE\s+EFFICIENCY/);
  assert.match(page(2), /Score and reasons/);
  assert.match(page(2), /Complexity: \d\.\d/);
  assert.match(page(2), /Elegance: /);
  assert.match(page(2), /Efficiency: \d\.\d/);
  assert.match(page(2), /It took 12 steps to make the picture\./);
});

// ---- The complexity table: numbers beside the words, ruled rows, and room to write a mark ----------------------------

/** Every piece of text on a page with where it starts: { x, y, words }. */
const textOps = (contents) => [...contents.matchAll(/\/(F\d) ([\d.]+) Tf [\d.]+ g ([\d.-]+) ([\d.-]+) Td \((.*)\) Tj ET/g)].map((m) => ({ font: m[1], size: Number(m[2]), x: Number(m[3]), y: Number(m[4]), words: m[5].replace(/\\([()\\])/g, '$1') }));

test('the complexity table has its numbers right beside the words, the rows ruled, and the right part of every row left empty for a mark', async () => {
  const pdf = await makePdf({ report: REPORT() });
  const page = contentsOf(pdf)[1];
  const found = textOps(page);
  const head = ['Idea', 'Count', 'Points', 'Mark'].map((name) => found.find((t) => t.words === name));
  assert.ok(head.every(Boolean), 'the four column names');
  assert.ok(head[0].x < head[1].x && head[1].x < head[2].x && head[2].x < head[3].x, 'in that order, left to right');
  assert.ok(head.every((t) => t.y === head[0].y), 'on one line');
  const markLeft = head[3].x - 6;
  const rows = ['repeat / forever', 'if / if else', 'Blocks', 'Total'].map((name) => found.find((t) => t.words === name));
  assert.ok(rows.every(Boolean), 'the rows are there, named for the blocks');
  for (const row of rows) {
    const same = found.filter((t) => Math.abs(t.y - row.y) < 0.01);
    assert.ok(same.length >= 2, `${row.words} has numbers on its line`);
    for (const t of same) assert.ok(t.x + textWidth(t.words, t.size) < markLeft, `${row.words}: "${t.words}" is left of the Mark column, which is empty`);
    const farthest = Math.max(...same.map((t) => t.x + textWidth(t.words, t.size)));
    assert.ok(farthest - row.x < 330, `${row.words}: the numbers are within 330 points of the word, not out at the margin (${farthest - row.x})`);
  }
  assert.ok(markLeft < 612 - 36 - 150, 'and the empty column is at least two inches wide');
  const rule = page.match(/0\.7 G 0\.5 w ([^S]*)S/)[1];
  assert.ok((rule.match(/ m /g) ?? []).length >= 9 + 5 - 1, 'a rule above, under the names, under every row, and down between the columns');
  const lines = [...rule.matchAll(/([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l/g)].map((m) => m.slice(1).map(Number));
  assert.ok(lines.some(([x1, , x2]) => x1 === 36 && x2 === 576), 'the horizontal rules run the whole width, over the mark column too');
});

test('poppler reads a row of the table straight across: the words, then the count, then the points', needsPoppler, async () => {
  const { file } = await writeTemp(makePdf({ report: REPORT() }));
  if (spawnSync('pdftotext', ['-v']).error) return;
  const second = spawnSync('pdftotext', ['-layout', '-f', '2', '-l', '2', file, '-'], { encoding: 'utf8' }).stdout;
  assert.match(second, /Idea\s+Count\s+Points\s+Mark/);
  assert.match(second, /repeat \/ forever\s+1\s+\d+\n/, 'one repeat: the name, 1, its points, and nothing after');
  assert.match(second, /Total\s+\d+\n/);
  assert.doesNotMatch(second, /try repeat|try if|try to|\(0 boxes/);
});
