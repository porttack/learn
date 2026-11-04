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
  // The two halves of the page.
  const half = HALF_HEIGHT;
  const bottom = BOTTOM;
  const gap = GAP;
  const codeBox = { x: MARGIN, y: TOP - half, width: HALF_PAGE.width, height: half };
  const drawingBox = { x: MARGIN, y: BOTTOM, width: HALF_PAGE.width, height: half };

  // Objects are numbered from 1. Pictures and the attached file are added only if there.
  const ids = { catalog: 1, pages: 2, page: 3, font: 4, contents: 5, info: 6 };
  let next = 7;
  const pictures = [];
  const addPicture = (name, picture) => {
    const id = next;
    next += 1;
    pictures.push({ id, name, picture });
    return id;
  };
  const codeId = code ? addPicture('Code', code) : null;
  const drawingId = addPicture('Drawing', drawing);
  const filespecId = next;
  const embeddedId = next + 1;

  // What is drawn on the page.
  const ops = [];
  const place = (id, name, picture, box, { fromTop = false, most = 1, pixelsPerPoint = 1 } = {}) => {
    const size = fitInside(picture.width / pixelsPerPoint, picture.height / pixelsPerPoint, box.width, box.height, most);
    const x = fromTop ? box.x : box.x + (box.width - size.width) / 2;
    const y = fromTop ? box.y + box.height - size.height : box.y + (box.height - size.height) / 2;
    ops.push(`q ${num(size.width)} 0 0 ${num(size.height)} ${num(x)} ${num(y)} cm /${name} Do Q`);
    return { x, y, ...size };
  };
  const text = (x, y, size, gray, words) => ops.push(`BT /F1 ${size} Tf ${gray} g ${num(x)} ${num(y)} Td ${pdfString(words)} Tj ET`);

  text(MARGIN, PAGE_H - MARGIN - 9, 10, 0.15, title);
  if (code) {
    place(codeId, 'Code', code, codeBox, { fromTop: true, pixelsPerPoint: code.pixelsPerPoint ?? 1 });
  } else {
    text(MARGIN, codeBox.y + codeBox.height - 16, 11, 0.5, 'There are no blocks on the page.');
  }
  ops.push(`0.8 G 0.75 w ${num(MARGIN)} ${num(bottom + half + gap / 2)} m ${num(PAGE_W - MARGIN)} ${num(bottom + half + gap / 2)} l S`);
  const drawn = place(drawingId, 'Drawing', drawing, drawingBox);
  ops.push(`0.75 G 0.75 w ${num(drawn.x)} ${num(drawn.y)} ${num(drawn.width)} ${num(drawn.height)} re S`);
  text(MARGIN, MARGIN - 4, 7, 0.45, 'The PNG attached to this PDF has the blocks inside it. Drag this PDF onto TurtleLab to open them again.');

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
  object(ids.pages, `<< /Type /Pages /Kids [${ids.page} 0 R] /Count 1 >>`);
  const xobjects = pictures.map((p) => `/${p.name} ${p.id} 0 R`).join(' ');
  object(
    ids.page,
    `<< /Type /Page /Parent ${ids.pages} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${ids.font} 0 R >> /XObject << ${xobjects} >> >> /Contents ${ids.contents} 0 R >>`,
  );
  object(ids.font, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const content = encoder.encode(ops.join('\n'));
  object(ids.contents, `<< /Length ${content.length} >>`, content);
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
