// Tests for saving a project inside a picture and reading it back.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 as nodeCrc32, deflateSync } from 'node:zlib';

import { PNG_SIGNATURE, readChunks, addTextChunk } from '../js/core/png-chunks.js';
import { PROJECT_KEYWORD, MAX_FILE_BYTES, embedProject, readProjectFile } from '../js/core/project-file.js';
import { FORMAT_ID, FORMAT_VERSION } from '../js/core/project.js';

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(nodeCrc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return new Uint8Array(out);
}

function tinyPng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const scanlines = Buffer.concat([Buffer.from([0]), Buffer.alloc(8, 200), Buffer.from([0]), Buffer.alloc(8, 100)]);
  const parts = [PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', new Uint8Array(0))];
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
  stacks: [{ x: 30, y: 40, blocks: [{ op: 'start' }, { op: 'repeat', args: [4], body: [{ op: 'forward', args: [{ op: 'box1' }] }, { op: 'right', args: [90] }] }] }],
});

const text = (s) => new TextEncoder().encode(s);

test('a project goes into a picture and comes back exactly', () => {
  const saved = embedProject(tinyPng(), project());
  const result = readProjectFile(saved);
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'png');
  assert.deepEqual(result.project, project());
});

test('the saved picture is still an ordinary picture with the same pixels', () => {
  const original = tinyPng();
  const saved = embedProject(original, project());
  const types = readChunks(saved).map((c) => c.type);
  assert.deepEqual(types, ['IHDR', 'IDAT', 'iTXt', 'IEND']);
  const originalIdat = readChunks(original).find((c) => c.type === 'IDAT');
  const savedIdat = readChunks(saved).find((c) => c.type === 'IDAT');
  assert.deepEqual(saved.subarray(savedIdat.start, savedIdat.end), original.subarray(originalIdat.start, originalIdat.end));
});

test('only the blocks are stored: no name, date or anything else', () => {
  const saved = embedProject(tinyPng(), project());
  const raw = new TextDecoder('latin1').decode(saved);
  assert.ok(raw.includes(PROJECT_KEYWORD));
  assert.ok(raw.includes(JSON.stringify(project())), 'the project text is there, as it is');
  assert.ok(!/ebrown|@|\/Users|Chrome|Macintosh/.test(raw.slice(raw.indexOf('iTXt'))), 'no personal or computer details');
});

test('a picture with no program in it says so in plain words', () => {
  const result = readProjectFile(tinyPng());
  assert.equal(result.ok, false);
  assert.equal(result.error, "This picture doesn't have a program inside it.");
});

test('a picture with a damaged program inside says so', () => {
  const notJson = addTextChunk(tinyPng(), PROJECT_KEYWORD, 'this is { not json');
  assert.equal(readProjectFile(notJson).error, 'The program inside this picture is damaged.');
});

test('a program from a newer version, or from another app, is explained', () => {
  const newer = { ...project(), version: FORMAT_VERSION + 1 };
  assert.match(readProjectFile(addTextChunk(tinyPng(), PROJECT_KEYWORD, JSON.stringify(newer))).error, /newer version/);
  const other = { app: 'something-else', version: 1, stacks: [] };
  assert.match(readProjectFile(addTextChunk(tinyPng(), PROJECT_KEYWORD, JSON.stringify(other))).error, /not made by this app/);
});

test('a program with blocks that do not exist is refused, not run', () => {
  const evil = { app: FORMAT_ID, version: 1, stacks: [{ x: 0, y: 0, blocks: [{ op: 'launchRockets' }] }] };
  const result = readProjectFile(addTextChunk(tinyPng(), PROJECT_KEYWORD, JSON.stringify(evil)));
  assert.equal(result.ok, false);
  assert.match(result.error, /launchRockets/);
});

test('a plain project file in JSON works too', () => {
  const result = readProjectFile(text(JSON.stringify(project(), null, 2)));
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'json');
  assert.deepEqual(result.project, project());
});

test('files that are neither a picture nor a project are refused kindly', () => {
  assert.match(readProjectFile(text('just some words')).error, /not a TurtleLab picture or project/);
  assert.match(readProjectFile(new Uint8Array([0xff, 0xfe, 0x00, 0x80])).error, /not a TurtleLab picture or project/);
  assert.match(readProjectFile(text('{ broken json')).error, /damaged/);
  assert.match(readProjectFile(new Uint8Array(0)).error, /not a TurtleLab picture or project/);
});

test('a file that is far too big is refused without being read', () => {
  const huge = new Uint8Array(MAX_FILE_BYTES + 1);
  assert.match(readProjectFile(huge).error, /too big/);
});

test('saving twice gives a picture that still opens, and the program is the same', () => {
  const once = embedProject(tinyPng(), project());
  const twice = embedProject(once, project());
  assert.deepEqual(readProjectFile(twice).project, project());
});
