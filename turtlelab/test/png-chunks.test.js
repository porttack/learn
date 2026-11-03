// Tests for the hand-written PNG chunk code: CRC-32, chunks, and text chunks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 as nodeCrc32, deflateSync } from 'node:zlib';

import {
  PngError,
  PNG_SIGNATURE,
  MAX_TEXT_BYTES,
  crc32,
  isPng,
  readChunks,
  buildChunk,
  buildITXtData,
  addTextChunk,
  readTextChunk,
} from '../js/core/png-chunks.js';

const ascii = (text) => new TextEncoder().encode(text);

/** A chunk built with Node's own CRC, so it does not depend on the code under test. */
function referenceChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(nodeCrc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return new Uint8Array(out);
}

/** A real 2 by 2 picture: signature, IHDR, one compressed IDAT, IEND. */
function tinyPng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0); // width
  ihdr.writeUInt32BE(2, 4); // height
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // RGBA
  const scanlines = Buffer.concat([Buffer.from([0]), Buffer.alloc(8, 200), Buffer.from([0]), Buffer.alloc(8, 100)]);
  const parts = [PNG_SIGNATURE, referenceChunk('IHDR', ihdr), referenceChunk('IDAT', deflateSync(scanlines)), referenceChunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

test('crc32 gives the standard answers', () => {
  assert.equal(crc32(ascii('123456789')), 0xcbf43926, 'the usual check string');
  assert.equal(crc32(ascii('IEND')), 0xae426082, 'the type of every IEND chunk, whose checksum is famous');
  assert.equal(crc32(new Uint8Array(0)), 0);
});

test('crc32 agrees with Node on all sorts of input', () => {
  for (const length of [1, 2, 7, 64, 255, 1000, 65537]) {
    const bytes = new Uint8Array(length).map((_, i) => (i * 131 + length * 7) & 0xff);
    assert.equal(crc32(bytes), nodeCrc32(bytes), `length ${length}`);
  }
  const bytes = ascii('hello, turtle');
  assert.equal(crc32(bytes, 3, 9), nodeCrc32(bytes.subarray(3, 9)), 'a slice');
});

test('a chunk is length, type, data and checksum, and matches one built with Node', () => {
  const data = ascii('some data');
  assert.deepEqual(buildChunk('tEXt', data), referenceChunk('tEXt', data));
  const iend = buildChunk('IEND', new Uint8Array(0));
  assert.deepEqual([...iend], [0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82], 'the well known IEND chunk');
});

test('a chunk type must be four letters', () => {
  assert.throws(() => buildChunk('abc', new Uint8Array(0)), PngError);
  assert.throws(() => buildChunk('ab1d', new Uint8Array(0)), PngError);
});

test('readChunks lists the chunks of a real picture', () => {
  const png = tinyPng();
  assert.equal(isPng(png), true);
  const chunks = readChunks(png);
  assert.deepEqual(chunks.map((c) => c.type), ['IHDR', 'IDAT', 'IEND']);
  // Every checksum in a real picture is one our own crc32 agrees with.
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  for (const chunk of chunks) {
    const stored = view.getUint32(chunk.dataStart + chunk.length);
    assert.equal(crc32(png, chunk.start + 4, chunk.dataStart + chunk.length), stored, chunk.type);
  }
});

test('readChunks refuses what is not a PNG, and what is cut short', () => {
  assert.equal(isPng(ascii('not a picture')), false);
  assert.throws(() => readChunks(ascii('not a picture')), PngError);
  const png = tinyPng();
  assert.throws(() => readChunks(png.subarray(0, png.length - 5)), /cut short/);
});

test('text goes in just before IEND and comes back out, with any characters', () => {
  const png = tinyPng();
  const text = 'héllo ✓ \u{1f422} {"a":1}';
  const withText = addTextChunk(png, 'porttack-turtle-project', text);
  assert.deepEqual(readChunks(withText).map((c) => c.type), ['IHDR', 'IDAT', 'iTXt', 'IEND']);
  assert.equal(readTextChunk(withText, 'porttack-turtle-project'), text);
});

test('adding text changes nothing else in the picture', () => {
  const png = tinyPng();
  const withText = addTextChunk(png, 'note', 'hi');
  const end = readChunks(png).find((c) => c.type === 'IEND');
  assert.deepEqual(withText.subarray(0, end.start), png.subarray(0, end.start), 'everything before the new chunk');
  assert.deepEqual(withText.subarray(withText.length - 12), png.subarray(end.start), 'the IEND chunk at the end');
  // The new chunk itself matches one built independently.
  const expected = referenceChunk('iTXt', buildITXtData('note', 'hi'));
  assert.deepEqual(withText.subarray(end.start, end.start + expected.length), expected);
});

test('the picture is still a valid picture with a good checksum on every chunk', () => {
  const withText = addTextChunk(tinyPng(), 'k', 'v');
  const view = new DataView(withText.buffer, withText.byteOffset, withText.byteLength);
  for (const chunk of readChunks(withText)) {
    assert.equal(crc32(withText, chunk.start + 4, chunk.dataStart + chunk.length), view.getUint32(chunk.dataStart + chunk.length), chunk.type);
  }
});

test('a picture with no text, or text under another keyword, reads as null', () => {
  assert.equal(readTextChunk(tinyPng(), 'porttack-turtle-project'), null);
  const other = addTextChunk(tinyPng(), 'something-else', 'x');
  assert.equal(readTextChunk(other, 'porttack-turtle-project'), null);
  assert.equal(readTextChunk(other, 'something-else'), 'x');
});

test('when there are two chunks with the same keyword, the last one wins', () => {
  const twice = addTextChunk(addTextChunk(tinyPng(), 'k', 'first'), 'k', 'second');
  assert.equal(readTextChunk(twice, 'k'), 'second');
});

test('a damaged text chunk is noticed, not trusted', () => {
  const withText = addTextChunk(tinyPng(), 'k', 'important');
  const chunk = readChunks(withText).find((c) => c.type === 'iTXt');
  const damaged = withText.slice();
  damaged[chunk.dataStart + chunk.length - 2] ^= 0xff; // change a letter of the text
  assert.throws(() => readTextChunk(damaged, 'k'), /damaged/);
});

test('text that is not valid UTF-8 is refused, and compressed text is not guessed at', () => {
  // A chunk with a good checksum but nonsense text bytes.
  const data = buildITXtData('k', 'ok');
  data[data.length - 1] = 0xff;
  const bad = tinyPng();
  const withBad = (() => {
    const chunk = referenceChunk('iTXt', data);
    const end = readChunks(bad).find((c) => c.type === 'IEND');
    const out = new Uint8Array(bad.length + chunk.length);
    out.set(bad.subarray(0, end.start), 0);
    out.set(chunk, end.start);
    out.set(bad.subarray(end.start), end.start + chunk.length);
    return out;
  })();
  assert.throws(() => readTextChunk(withBad, 'k'), /damaged/);

  const packed = buildITXtData('k', 'ok');
  packed[2] = 1; // compression flag
  const base = tinyPng();
  const end = readChunks(base).find((c) => c.type === 'IEND');
  const chunk = referenceChunk('iTXt', packed);
  const withPacked = new Uint8Array(base.length + chunk.length);
  withPacked.set(base.subarray(0, end.start), 0);
  withPacked.set(chunk, end.start);
  withPacked.set(base.subarray(end.start), end.start + chunk.length);
  assert.throws(() => readTextChunk(withPacked, 'k'), /packed/);
});

test('keywords must be 1 to 79 plain characters, and text has a size limit', () => {
  assert.throws(() => addTextChunk(tinyPng(), '', 'x'), PngError);
  assert.throws(() => addTextChunk(tinyPng(), 'x'.repeat(80), 'x'), PngError);
  assert.throws(() => addTextChunk(tinyPng(), 'café', 'x'), PngError);
  assert.throws(() => addTextChunk(tinyPng(), 'k', 'x'.repeat(MAX_TEXT_BYTES + 1)), /too much/);
});

test('a PNG with no IEND is cut short, and cannot take a text chunk', () => {
  const png = tinyPng();
  const end = readChunks(png).find((c) => c.type === 'IEND');
  const cut = png.subarray(0, end.start);
  assert.throws(() => readChunks(cut), /cut short/);
  assert.throws(() => addTextChunk(cut, 'k', 'v'), /cut short/);
});
