// TurtleLab: writing a PDF.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A PDF of your work: one page, the blocks in the top half and the drawing in the
// bottom half, so both can be seen at a glance. No library is used. A PDF is
// just numbered objects written one after another, then a table that says where each
// one starts, and that is all that is written here.
//
//   the two pictures   stored as plain pixels, squashed with Flate (the same squashing
//                      PNG uses), which every PDF viewer understands
//   the PNG            the real TurtleLab picture, with the blocks tucked inside it, is
//                      attached to the PDF as a file. It is stored as it is, not squashed,
//                      so its bytes can be found inside the PDF again (project-file.js
//                      does that, which is how a PDF can be opened in TurtleLab).
//
// Only plain text is written (the file name and a few words), in the Helvetica that
// every PDF viewer already has, so there is no font to embed.

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

/**
 * Work out the layout. `code` is the blocks' size in points ({ width, height }, or null if there are none) and
 * `drawing` the drawing's. Returns { kind, pages } where each page has `code` and `drawing` as the exact
 * rectangle { x, y, width, height } to put them in (or null), and `divider`, the height of a line to draw
 * between the halves (or null). Nothing is distorted and nothing is made bigger than its own size.
 */
export function chooseLayout(code, drawing) {
  const rectAt = (x, top, size) => ({ x, y: top - size.height, width: size.width, height: size.height });
  const half = HALF_HEIGHT;

  // The top and bottom halves, as they always were (also used when there are no blocks).
  const stacked = () => {
    const drawn = fitInside(drawing.width, drawing.height, FULL_WIDTH, half);
    const blocks = code ? fitInside(code.width, code.height, FULL_WIDTH, half) : null;
    return {
      kind: 'stacked',
      pages: [{
        code: blocks ? rectAt(MARGIN, TOP, blocks) : null,
        drawing: { x: MARGIN + (FULL_WIDTH - drawn.width) / 2, y: BOTTOM + (half - drawn.height) / 2, width: drawn.width, height: drawn.height },
        divider: BOTTOM + half + GAP / 2,
      }],
    };
  };
  if (!code) return stacked();
  const shrunk = fitInside(code.width, code.height, FULL_WIDTH, half).width / code.width;
  if (shrunk >= READABLE_SCALE) return stacked();

  // Side by side: the blocks as big as the page is tall (never past full size), but leaving the drawing its room.
  const tallest = Math.min(1, FULL_HEIGHT / code.height);
  for (const room of [PREFERRED_DRAWING_WIDTH, LEAST_DRAWING_WIDTH]) {
    const scale = Math.min(tallest, (FULL_WIDTH - GAP - room) / code.width);
    if (scale < READABLE_SCALE) continue;
    const blocks = { width: code.width * scale, height: code.height * scale };
    const left = MARGIN + blocks.width + GAP;
    const drawn = fitInside(drawing.width, drawing.height, MARGIN + FULL_WIDTH - left, FULL_HEIGHT);
    return { kind: 'side', pages: [{ code: rectAt(MARGIN, TOP, blocks), drawing: rectAt(left, TOP, drawn), divider: null }] };
  }

  // Two pages: each picture gets a whole page.
  const blocks = fitInside(code.width, code.height, FULL_WIDTH, FULL_HEIGHT);
  const drawn = fitInside(drawing.width, drawing.height, FULL_WIDTH, FULL_HEIGHT);
  return {
    kind: 'pages',
    pages: [
      { code: rectAt(MARGIN, TOP, blocks), drawing: null, divider: null },
      { code: null, drawing: rectAt(MARGIN + (FULL_WIDTH - drawn.width) / 2, TOP, drawn), divider: null },
    ],
  };
}

/** The size in points of a picture that may have been drawn sharper than it is shown. */
export const sizeInPoints = (picture) => ({ width: picture.width / (picture.pixelsPerPoint ?? 1), height: picture.height / (picture.pixelsPerPoint ?? 1) });

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
 * @param {Date} [options.date]
 */
export async function buildPdf({ title, code, drawing, attachment, date = new Date() }) {
  const layout = chooseLayout(code ? sizeInPoints(code) : null, { width: drawing.width, height: drawing.height });

  // Objects are numbered from 1. The first page's numbers are always the same; a second page, the pictures and
  // the attached file are added after them, only if there.
  const ids = { catalog: 1, pages: 2, page: 3, font: 4, contents: 5, info: 6 };
  let next = 7;
  const pageIds = layout.pages.map((_, i) => {
    if (i === 0) return { page: ids.page, contents: ids.contents };
    const made = { page: next, contents: next + 1 };
    next += 2;
    return made;
  });
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
  const text = (ops, x, y, size, gray, words) => ops.push(`BT /F1 ${size} Tf ${gray} g ${num(x)} ${num(y)} Td ${pdfString(words)} Tj ET`);
  const picture = (ops, name, rect) => ops.push(`q ${num(rect.width)} 0 0 ${num(rect.height)} ${num(rect.x)} ${num(rect.y)} cm /${name} Do Q`);
  const pageOps = layout.pages.map((page, index) => {
    const ops = [];
    const many = layout.pages.length > 1;
    text(ops, MARGIN, PAGE_H - MARGIN - 9, 10, 0.15, many ? `${title}  (page ${index + 1} of ${layout.pages.length})` : title);
    if (page.code) {
      picture(ops, 'Code', page.code);
    } else if (!code) {
      text(ops, MARGIN, TOP - 16, 11, 0.5, 'There are no blocks on the page.');
    }
    if (page.divider !== null) ops.push(`0.8 G 0.75 w ${num(MARGIN)} ${num(page.divider)} m ${num(PAGE_W - MARGIN)} ${num(page.divider)} l S`);
    if (page.drawing) {
      picture(ops, 'Drawing', page.drawing);
      ops.push(`0.75 G 0.75 w ${num(page.drawing.x)} ${num(page.drawing.y)} ${num(page.drawing.width)} ${num(page.drawing.height)} re S`);
    }
    text(ops, MARGIN, MARGIN - 4, 7, 0.45, 'The PNG attached to this PDF has the blocks inside it. Drag this PDF onto TurtleLab to open them again.');
    return ops;
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
  pageIds.forEach((made, index) => {
    object(
      made.page,
      `<< /Type /Page /Parent ${ids.pages} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${ids.font} 0 R >> /XObject << ${xobjects} >> >> /Contents ${made.contents} 0 R >>`,
    );
    const content = encoder.encode(pageOps[index].join('\n'));
    object(made.contents, `<< /Length ${content.length} >>`, content);
  });
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
