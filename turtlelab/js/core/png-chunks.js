// TurtleLab: reading and writing PNG text chunks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A PNG file is an 8 byte signature followed by "chunks". Each chunk is:
//
//   4 bytes   length of the data (a big-endian number)
//   4 bytes   type, four letters like IHDR, IDAT or IEND
//   N bytes   the data
//   4 bytes   CRC, a checksum of the type and data
//
// Image viewers ignore chunk types they do not know, so we can tuck our own
// "iTXt" (international text) chunk into a picture without changing how it
// looks. That is how a drawing can carry the program that made it. No library
// is used: the CRC and the chunk code are written out here in full.

export class PngError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PngError';
  }
}

export const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);

/** The most text we will put in (or read from) one chunk. */
export const MAX_TEXT_BYTES = 8 * 1024 * 1024;

// ---- CRC-32 ------------------------------------------------------------
//
// The checksum PNG uses. Each of the 256 possible byte values is turned,
// once, into a number by a short routine; after that, checking a byte is one
// table lookup and a couple of bit moves.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let bit = 0; bit < 8; bit += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/** The CRC-32 of bytes[start] up to (not including) bytes[end], as an unsigned number. */
export function crc32(bytes, start = 0, end = bytes.length) {
  let c = 0xffffffff;
  for (let i = start; i < end; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// ---- Chunks ------------------------------------------------------------

/** True if the bytes begin with the PNG signature. */
export function isPng(bytes) {
  return bytes.length >= 8 && PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

const typeAt = (bytes, at) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);

/**
 * List the chunks of a PNG: { type, start, length, dataStart, end }, where
 * `start` is where the chunk begins and `end` is just past its checksum.
 * Stops after IEND, which every complete PNG ends with. Throws PngError if the
 * file is not a PNG or is cut short.
 */
export function readChunks(bytes) {
  if (!isPng(bytes)) throw new PngError('This is not a PNG picture.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  let at = PNG_SIGNATURE.length;
  while (at + 12 <= bytes.length) {
    const length = view.getUint32(at);
    const dataStart = at + 8;
    const end = dataStart + length + 4;
    if (length > 0x7fffffff || end > bytes.length) throw new PngError('This PNG picture is cut short.');
    const type = typeAt(bytes, at + 4);
    chunks.push({ type, start: at, length, dataStart, end });
    at = end;
    if (type === 'IEND') return chunks;
  }
  throw new PngError('This PNG picture is cut short.');
}

/** Make one chunk: length, type, data and checksum. */
export function buildChunk(type, data) {
  if (!/^[A-Za-z]{4}$/.test(type)) throw new PngError('A chunk type is four letters.');
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
  return out;
}

// ---- iTXt: text that can hold any language ------------------------------
//
// The data of an iTXt chunk is:
//   keyword (1 to 79 plain letters)  0
//   compression flag (0 = not compressed)  compression method (0)
//   language tag (may be empty)  0
//   translated keyword (may be empty)  0
//   the text, as UTF-8

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function checkKeyword(keyword) {
  if (!/^[\x20-\x7e]{1,79}$/.test(keyword)) throw new PngError('A text keyword is 1 to 79 plain characters.');
}

/** The data bytes for an iTXt chunk holding `text` under `keyword`. Not compressed. */
export function buildITXtData(keyword, text) {
  checkKeyword(keyword);
  const body = encoder.encode(text);
  if (body.length > MAX_TEXT_BYTES) throw new PngError('That is too much text to put in a picture.');
  const head = encoder.encode(keyword);
  // keyword, 0, flag 0, method 0, empty language, 0, empty translated keyword, 0
  const out = new Uint8Array(head.length + 5 + body.length);
  out.set(head, 0);
  out.set(body, head.length + 5);
  return out;
}

/**
 * Put a text chunk into a PNG, just before its IEND chunk, and return the new
 * file as new bytes. Everything else in the picture is left exactly as it was.
 */
export function addTextChunk(png, keyword, text) {
  const end = readChunks(png).at(-1); // readChunks guarantees this is IEND
  const chunk = buildChunk('iTXt', buildITXtData(keyword, text));
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, end.start), 0);
  out.set(chunk, end.start);
  out.set(png.subarray(end.start), end.start + chunk.length);
  return out;
}

/**
 * Read the text stored under `keyword`, or null if the picture has none. If
 * there are several, the last one wins. Throws PngError if the picture is
 * damaged or the chunk is one we cannot read.
 */
export function readTextChunk(png, keyword) {
  checkKeyword(keyword);
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let found = null;
  for (const chunk of readChunks(png)) {
    if (chunk.type !== 'iTXt') continue;
    const { dataStart, length } = chunk;
    const data = png.subarray(dataStart, dataStart + length);
    const nul = data.indexOf(0);
    if (nul < 1 || new TextDecoder('latin1').decode(data.subarray(0, nul)) !== keyword) continue;

    // The checksum has to match, or the text may not be what was written.
    if (view.getUint32(dataStart + length) !== crc32(png, chunk.start + 4, dataStart + length)) {
      throw new PngError('The text inside this picture is damaged.');
    }
    if (data[nul + 1] !== 0) throw new PngError('The text inside this picture is packed in a way we cannot read.');
    // Skip the language tag and the translated keyword (each ends in a 0).
    const languageEnd = data.indexOf(0, nul + 3);
    const translatedEnd = languageEnd < 0 ? -1 : data.indexOf(0, languageEnd + 1);
    if (translatedEnd < 0) throw new PngError('The text inside this picture is damaged.');
    try {
      found = decoder.decode(data.subarray(translatedEnd + 1));
    } catch {
      throw new PngError('The text inside this picture is damaged.');
    }
  }
  return found;
}
