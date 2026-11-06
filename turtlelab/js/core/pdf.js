// TurtleLab: writing a PDF.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A PDF of your work: the blocks in the top half and the drawing in the bottom half, so both
// can be seen at a glance, with the program's score in a strip along the top of page 1 and, on
// a page after the drawing, the reasons for that score (the `report`, see core/score-report.js).
// No library is used. A PDF is just numbered objects written one after another, then a table
// that says where each one starts, and that is all that is written here.
//
//   the two pictures   stored as plain pixels, squashed with Flate (the same squashing
//                      PNG uses), which every PDF viewer understands
//   the PNG            the real TurtleLab picture, with the blocks tucked inside it, is
//                      attached to the PDF as a file. It is stored as it is, not squashed,
//                      so its bytes can be found inside the PDF again (project-file.js
//                      does that, which is how a PDF can be opened in TurtleLab).
//
// Only plain text is written (the file name, the score and its reasons), in the Helvetica that
// every PDF viewer already has, so there is no font to embed. That means the width of each letter is
// not in the file, so it is written out below (`HELVETICA`) to wrap the reasons at the page's edge.

const encoder = new TextEncoder();

/** US Letter, in points (72 to the inch), and the space round the edge. */
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 36;

// The page, from the top: a line of title, the blocks, a gap, the drawing, a line of help.
const TOP = PAGE_H - MARGIN - 18;
const BOTTOM = MARGIN + 14;
const GAP = 14;
const HALF_HEIGHT = (TOP - BOTTOM - GAP) / 2;

/** How much room each picture has, in points: the blocks are fitted to this, and so is the drawing. */
export const HALF_PAGE = Object.freeze({ width: PAGE_W - 2 * MARGIN, height: HALF_HEIGHT });

/** Squash bytes the way PDF's FlateDecode wants them, or null if this browser cannot. */
async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') return null;
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Text for a PDF string: ASCII only, with the three characters that mean something escaped. */
function pdfString(text) {
  return `(${String(text).replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&')})`;
}

/** The date in the form PDF likes, D:YYYYMMDDHHMMSSZ, in UTC. */
function pdfDate(date) {
  const two = (n) => String(n).padStart(2, '0');
  return `D:${date.getUTCFullYear()}${two(date.getUTCMonth() + 1)}${two(date.getUTCDate())}${two(date.getUTCHours())}${two(date.getUTCMinutes())}${two(date.getUTCSeconds())}Z`;
}

/** How big something is when it is made to fit a box without distorting it, and never bigger than `most` times its own size. */
export function fitInside(width, height, boxWidth, boxHeight, most = 1) {
  const scale = Math.min(boxWidth / width, boxHeight / height, most);
  return { width: width * scale, height: height * scale };
}

const num = (n) => String(Math.round(n * 100) / 100);

// ---- Measuring and wrapping text -------------------------------------------------------------------------
//
// The width of each printable ASCII letter (space to ~) in Helvetica, in 1000ths of the size, from Adobe's published metrics for the font.
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // space ! " # $ % & ' ( ) * + , - . /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // 0 to 9 : ; < = > ?
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // @ A to O
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // P to Z [ \ ] ^ _
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // ` a to o
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, // p to z { | } ~
];

/** Text as the PDF will hold it: anything but plain ASCII becomes a question mark. */
const plain = (text) => String(text).replace(/[^\x20-\x7e]/g, '?');

/** How wide this text is in Helvetica at this size, in points. */
export function textWidth(text, size) {
  let total = 0;
  for (const letter of plain(text)) total += HELVETICA[letter.charCodeAt(0) - 32];
  return (total * size) / 1000;
}

/** Break text into lines no wider than `width` points at this size, between words (a word too long for a line is cut). */
export function wrapText(text, size, width) {
  const lines = [];
  let line = '';
  for (const word of plain(text).split(/\s+/).filter(Boolean)) {
    let rest = word;
    for (;;) {
      const tried = line ? `${line} ${rest}` : rest;
      if (textWidth(tried, size) <= width) {
        line = tried;
        break;
      }
      if (line) {
        lines.push(line);
        line = '';
        continue;
      }
      // A word wider than a whole line: put as many letters as fit on this one.
      let cut = 1;
      while (cut < rest.length && textWidth(rest.slice(0, cut + 1), size) <= width) cut += 1;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---- Where things go on the page(s) ------------------------------------------------------------------
//
// Blocks are tall and thin, and half a page is wide and short, so a program of a dozen blocks is already
// squeezed to a third of its size up there, and its writing is too small to read. So there are three layouts, and
// the first one that keeps the writing readable is used:
//   stacked  the blocks on the top half and the drawing on the bottom half (the way it always was)
//   side     the blocks down the left, the drawing at the top of the right (a thin program gets the whole height)
//   pages    the blocks fill page 1 and the drawing fills page 2 (a wide or very long program)

/** The blocks' writing is 15 points when they are not shrunk. It may be shrunk to 8 points and no further. */
export const READABLE_SCALE = 8 / 15;
/** In the side by side layout the drawing wants to be at least this wide (and is happier at the first number). */
const PREFERRED_DRAWING_WIDTH = 380;
const LEAST_DRAWING_WIDTH = 300;
const FULL_WIDTH = PAGE_W - 2 * MARGIN;
const FULL_HEIGHT = TOP - BOTTOM;

/** The strip of scores along the top of page 1 takes this much height, in points, from the pictures (and a gap under it). */
export const SCORE_STRIP = 40;

/**
 * Work out the layout. `code` is the blocks' size in points ({ width, height }, or null if there are none) and
 * `drawing` the drawing's. Returns { kind, pages } where each page has `code` and `drawing` as the exact
 * rectangle { x, y, width, height } to put them in (or null), and `divider`, the height of a line to draw
 * between the halves (or null). Nothing is distorted and nothing is made bigger than its own size.
 * `reserve` is height to leave empty at the top of page 1 (for the strip of scores); a second page does not need it.
 */
export function chooseLayout(code, drawing, reserve = 0) {
  const rectAt = (x, top, size) => ({ x, y: top - size.height, width: size.width, height: size.height });
  const top1 = TOP - reserve;
  const fullHeight1 = top1 - BOTTOM;
  const half = (fullHeight1 - GAP) / 2;

  // The top and bottom halves, as they always were (also used when there are no blocks).
  const stacked = () => {
    const drawn = fitInside(drawing.width, drawing.height, FULL_WIDTH, half);
    const blocks = code ? fitInside(code.width, code.height, FULL_WIDTH, half) : null;
    return {
      kind: 'stacked',
      pages: [{
        code: blocks ? rectAt(MARGIN, top1, blocks) : null,
        drawing: { x: MARGIN + (FULL_WIDTH - drawn.width) / 2, y: BOTTOM + (half - drawn.height) / 2, width: drawn.width, height: drawn.height },
        divider: BOTTOM + half + GAP / 2,
      }],
    };
  };
  if (!code) return stacked();
  const shrunk = fitInside(code.width, code.height, FULL_WIDTH, half).width / code.width;
  if (shrunk >= READABLE_SCALE) return stacked();

  // Side by side: the blocks as big as the page is tall (never past full size), but leaving the drawing its room.
  const tallest = Math.min(1, fullHeight1 / code.height);
  for (const room of [PREFERRED_DRAWING_WIDTH, LEAST_DRAWING_WIDTH]) {
    const scale = Math.min(tallest, (FULL_WIDTH - GAP - room) / code.width);
    if (scale < READABLE_SCALE) continue;
    const blocks = { width: code.width * scale, height: code.height * scale };
    const left = MARGIN + blocks.width + GAP;
    const drawn = fitInside(drawing.width, drawing.height, MARGIN + FULL_WIDTH - left, fullHeight1);
    return { kind: 'side', pages: [{ code: rectAt(MARGIN, top1, blocks), drawing: rectAt(left, top1, drawn), divider: null }] };
  }

  // Two pages: each picture gets a whole page.
  const blocks = fitInside(code.width, code.height, FULL_WIDTH, fullHeight1);
  const drawn = fitInside(drawing.width, drawing.height, FULL_WIDTH, FULL_HEIGHT);
  return {
    kind: 'pages',
    pages: [
      { code: rectAt(MARGIN, top1, blocks), drawing: null, divider: null },
      { code: null, drawing: rectAt(MARGIN + (FULL_WIDTH - drawn.width) / 2, TOP, drawn), divider: null },
    ],
  };
}

/** The size in points of a picture that may have been drawn sharper than it is shown. */
export const sizeInPoints = (picture) => ({ width: picture.width / (picture.pixelsPerPoint ?? 1), height: picture.height / (picture.pixelsPerPoint ?? 1) });

// ---- The score: the strip on page 1, and the reasons page(s) after the drawing -------------------------------------

/** One piece of writing: Helvetica (F1) or Helvetica Bold (F2), a size, a gray from 0 (black) to 1, where its baseline starts. */
const text = (ops, x, y, size, gray, words, font = 'F1') => ops.push(`BT /${font} ${size} Tf ${gray} g ${num(x)} ${num(y)} Td ${pdfString(words)} Tj ET`);

/** The strip along the top of page 1: each score's name, its number and a bar for how full it is. */
function scoreStrip(ops, scores) {
  const cell = FULL_WIDTH / scores.length;
  scores.forEach(({ label, text: said, fraction }, index) => {
    const x = MARGIN + index * cell;
    const number = /^\d/.test(said);
    text(ops, x, TOP - 8, 7, 0.45, label.toUpperCase());
    text(ops, x, TOP - 24, number ? 15 : 10, number ? 0.1 : 0.45, said, 'F2');
    if (fraction === null) return;
    const bar = cell - 24;
    ops.push(`0.75 G 0.5 w ${num(x)} ${num(TOP - 31)} ${num(bar)} 3 re S`);
    ops.push(`0.35 g ${num(x)} ${num(TOP - 31)} ${num(bar * Math.max(0, Math.min(1, fraction)))} 3 re f`);
  });
}

const BODY = 9.5;
const LEADING = 13;
const LABEL_WIDTH = 32; // the "Good" or "Tip" that starts a reason
const POINTS_WIDTH = 40; // room at the right edge for a complexity row's points

/**
 * The reasons, laid out in lines of writing, down as many pages as it takes. Returns the drawing commands of each page
 * (without the title line, which the caller puts on every page).
 */
function reasonPages(report) {
  const pages = [[]];
  let y = TOP;
  const room = (needed) => {
    if (y - needed >= BOTTOM + 6) return;
    pages.push([]);
    y = TOP;
  };
  const ops = () => pages.at(-1);

  const said = report.scores.map(({ label, text: value }) => `${label} ${value}`).join('.   ');
  text(ops(), MARGIN, y - 12, 14, 0.1, 'Score and reasons', 'F2');
  text(ops(), MARGIN, y - 28, BODY, 0.3, `${said}.`);
  y -= 46;

  for (const section of report.sections) {
    room(34);
    text(ops(), MARGIN, y - 11, 11.5, 0.1, section.heading, 'F2');
    ops().push(`0.82 G 0.5 w ${num(MARGIN)} ${num(y - 16)} m ${num(PAGE_W - MARGIN)} ${num(y - 16)} l S`);
    y -= 26;
    for (const line of section.lines) {
      const indent = { good: LABEL_WIDTH, tip: LABEL_WIDTH, part: 8 }[line.kind] ?? 0;
      const width = FULL_WIDTH - indent - (line.kind === 'part' ? POINTS_WIDTH : 0);
      const words = wrapText(line.text, BODY, width);
      room(words.length * LEADING + 3);
      const gray = line.kind === 'what' ? 0.45 : line.kind === 'part' && line.points === '0' ? 0.55 : 0.1;
      if (line.kind === 'good' || line.kind === 'tip') text(ops(), MARGIN, y - 9, 8, 0.4, line.kind === 'good' ? 'Good' : 'Tip', 'F2');
      words.forEach((row, i) => text(ops(), MARGIN + indent, y - 9 - i * LEADING, BODY, gray, row));
      if (line.kind === 'part') text(ops(), PAGE_W - MARGIN - textWidth(line.points, BODY), y - 9, BODY, gray, line.points);
      y -= words.length * LEADING + 3;
    }
    y -= 8;
  }
  return pages;
}

/**
 * Make the PDF. Returns its bytes.
 *
 * @param {object} options
 * @param {string} options.title      the file name without its ending, shown at the top
 * @param {{width: number, height: number, rgb: Uint8Array, pixelsPerPoint?: number} | null} options.code
 *        the blocks as a picture (raw red, green, blue bytes), or null if there are none.
 *        `pixelsPerPoint` says how sharp it is (2 means it was drawn twice as big as it is shown).
 * @param {{width: number, height: number, rgb: Uint8Array}} options.drawing  the paper, the same way
 * @param {{name: string, bytes: Uint8Array}} options.attachment  the PNG to attach, as it was saved
 * @param {ReturnType<import('./score-report.js').scoreReport> | null} [options.report]  the score and its reasons (core/score-report.js):
 *        the scores go in a strip along the top of page 1 and the reasons on a page (or more) after the drawing. Left out, the PDF has neither.
 * @param {Date} [options.date]
 */
export async function buildPdf({ title, code, drawing, attachment, report = null, date = new Date() }) {
  const layout = chooseLayout(code ? sizeInPoints(code) : null, { width: drawing.width, height: drawing.height }, report ? SCORE_STRIP : 0);
  const reasons = report ? reasonPages(report) : [];
  const pageTotal = layout.pages.length + reasons.length;

  // Objects are numbered from 1. The first page's numbers are always the same; a second page, the bold font, the pictures and
  // the attached file are added after them, only if there.
  const ids = { catalog: 1, pages: 2, page: 3, font: 4, contents: 5, info: 6 };
  let next = 7;
  const pageIds = Array.from({ length: pageTotal }, (_, i) => {
    if (i === 0) return { page: ids.page, contents: ids.contents };
    const made = { page: next, contents: next + 1 };
    next += 2;
    return made;
  });
  const boldId = report ? next : null; // the score and its headings are in bold
  if (report) next += 1;
  const pictures = [];
  const addPicture = (name, picture) => {
    const id = next;
    next += 1;
    pictures.push({ id, name, picture });
    return id;
  };
  if (code) addPicture('Code', code);
  addPicture('Drawing', drawing);
  const filespecId = next;
  const embeddedId = next + 1;

  // What is drawn on each page.
  const picture = (ops, name, rect) => ops.push(`q ${num(rect.width)} 0 0 ${num(rect.height)} ${num(rect.x)} ${num(rect.y)} cm /${name} Do Q`);
  const heading = (ops, index) => text(ops, MARGIN, PAGE_H - MARGIN - 9, 10, 0.15, pageTotal > 1 ? `${title}  (page ${index + 1} of ${pageTotal})` : title);
  const footer = (ops) => text(ops, MARGIN, MARGIN - 4, 7, 0.45, 'The PNG attached to this PDF has the blocks inside it. Drag this PDF onto TurtleLab to open them again.');
  const pageOps = layout.pages.map((page, index) => {
    const ops = [];
    heading(ops, index);
    if (report && index === 0) scoreStrip(ops, report.scores);
    if (page.code) {
      picture(ops, 'Code', page.code);
    } else if (!code) {
      text(ops, MARGIN, TOP - (report && index === 0 ? SCORE_STRIP : 0) - 16, 11, 0.5, 'There are no blocks on the page.');
    }
    if (page.divider !== null) ops.push(`0.8 G 0.75 w ${num(MARGIN)} ${num(page.divider)} m ${num(PAGE_W - MARGIN)} ${num(page.divider)} l S`);
    if (page.drawing) {
      picture(ops, 'Drawing', page.drawing);
      ops.push(`0.75 G 0.75 w ${num(page.drawing.x)} ${num(page.drawing.y)} ${num(page.drawing.width)} ${num(page.drawing.height)} re S`);
    }
    footer(ops);
    return ops;
  });
  reasons.forEach((body, i) => {
    const ops = [];
    heading(ops, layout.pages.length + i);
    ops.push(...body);
    footer(ops);
    pageOps.push(ops);
  });

  // Writing the file: each piece is added and the position it starts at is remembered.
  const parts = [];
  let length = 0;
  const offsets = new Map();
  const write = (piece) => {
    const bytes = typeof piece === 'string' ? encoder.encode(piece) : piece;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (id, dictionary, stream = null) => {
    offsets.set(id, length);
    write(`${id} 0 obj\n${dictionary}\n`);
    if (stream) {
      write('stream\n');
      write(stream);
      write('\nendstream\n');
    }
    write('endobj\n');
  };

  write('%PDF-1.4\n');
  write(Uint8Array.of(0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a)); // a comment of high bytes: it says "this file is not plain text"
  const attachmentName = pdfString(attachment.name);
  object(ids.catalog, `<< /Type /Catalog /Pages ${ids.pages} 0 R /Names << /EmbeddedFiles << /Names [${attachmentName} ${filespecId} 0 R] >> >> >>`);
  object(ids.pages, `<< /Type /Pages /Kids [${pageIds.map((p) => `${p.page} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  const xobjects = pictures.map((p) => `/${p.name} ${p.id} 0 R`).join(' ');
  object(ids.font, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fonts = `/F1 ${ids.font} 0 R${boldId ? ` /F2 ${boldId} 0 R` : ''}`;
  pageIds.forEach((made, index) => {
    object(
      made.page,
      `<< /Type /Page /Parent ${ids.pages} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << ${fonts} >> /XObject << ${xobjects} >> >> /Contents ${made.contents} 0 R >>`,
    );
    const content = encoder.encode(pageOps[index].join('\n'));
    object(made.contents, `<< /Length ${content.length} >>`, content);
  });
  if (boldId) object(boldId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  object(ids.info, `<< /Title ${pdfString(title)} /Creator (TurtleLab) /Producer (TurtleLab) /CreationDate ${pdfDate(date)} >>`);
  for (const { id, picture } of pictures) {
    const squashed = await deflate(picture.rgb);
    const data = squashed ?? picture.rgb;
    object(
      id,
      `<< /Type /XObject /Subtype /Image /Width ${picture.width} /Height ${picture.height} /ColorSpace /DeviceRGB /BitsPerComponent 8${squashed ? ' /Filter /FlateDecode' : ''} /Length ${data.length} >>`,
      data,
    );
  }
  object(
    filespecId,
    `<< /Type /Filespec /F ${attachmentName} /UF ${attachmentName} /Desc ${pdfString('Your blocks and your drawing, as a TurtleLab picture. Drag it onto TurtleLab to open the blocks.')} /EF << /F ${embeddedId} 0 R /UF ${embeddedId} 0 R >> >>`,
  );
  object(embeddedId, `<< /Type /EmbeddedFile /Subtype /image#2Fpng /Params << /Size ${attachment.bytes.length} >> /Length ${attachment.bytes.length} >>`, attachment.bytes);

  // The table that says where every object starts, and where to find the table.
  const count = embeddedId + 1;
  const tableAt = length;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id += 1) table += `${String(offsets.get(id)).padStart(10, '0')} 00000 n \n`;
  table += `trailer\n<< /Size ${count} /Root ${ids.catalog} 0 R /Info ${ids.info} 0 R >>\nstartxref\n${tableAt}\n%%EOF\n`;
  write(table);

  const out = new Uint8Array(length);
  let at = 0;
  for (const piece of parts) {
    out.set(piece, at);
    at += piece.length;
  }
  return out;
}
