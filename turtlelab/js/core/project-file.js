// TurtleLab: saving a project inside a picture, and reading it back.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A saved drawing is an ordinary PNG picture. Tucked inside it, in a text
// chunk, is the whole project as JSON, so the picture IS the program: drag it
// back onto TurtleLab and the blocks come back. The JSON holds only the
// blocks (see project.js). It has no name, date or anything about the
// computer it was made on.
//
// A plain .json file with the same project in it also works, which is handy
// for teachers. So does a PDF made by TurtleLab (see pdf.js): the picture is
// attached to it untouched, so it can be found inside and read the same way.

import { PngError, isPng, addTextChunk, readTextChunk } from './png-chunks.js';
import { validateProject } from './project.js';

/**
 * The name the project is saved under inside the picture. It does not change
 * if the app is ever renamed, so old pictures keep opening.
 */
export const PROJECT_KEYWORD = 'porttack-turtle-project';

const PDF_START = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
// The start of any PNG: its 8 byte signature, then the first chunk (IHDR, 13 bytes long).
const PNG_START = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];

/** True if the bytes are a PDF. */
export function isPdf(bytes) {
  return bytes.length > PDF_START.length && PDF_START.every((byte, i) => bytes[i] === byte);
}

/**
 * The PNG a TurtleLab PDF has attached, as bytes (running on to the end of the PDF; a PNG
 * says where it ends), or null if there is none. The attached file is stored plain, so its
 * signature can be found by looking, which no picture drawn on the page ever is.
 */
export function findAttachedPng(bytes) {
  for (let at = bytes.indexOf(0x89); at !== -1; at = bytes.indexOf(0x89, at + 1)) {
    if (at + PNG_START.length > bytes.length) return null;
    if (PNG_START.every((byte, i) => bytes[at + i] === byte)) return bytes.subarray(at);
  }
  return null;
}

/** Files bigger than this are refused. A real drawing is far smaller. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

/** Put a project inside PNG picture bytes. Returns the new bytes. */
export function embedProject(pngBytes, project) {
  return addTextChunk(pngBytes, PROJECT_KEYWORD, JSON.stringify(project));
}

/**
 * Work out what a file is and get the project out of it.
 * Returns { ok: true, project, kind, picture? } where kind is 'png', 'pdf' or 'json'
 * and `picture` (for the first two) is the PNG itself, to paint on the paper, or
 * { ok: false, error } where `error` is a sentence a student can read.
 */
export function readProjectFile(bytes) {
  if (bytes.length > MAX_FILE_BYTES) return fail('That file is too big to be a TurtleLab picture.');
  if (isPdf(bytes)) {
    const picture = findAttachedPng(bytes);
    if (!picture) return fail("This PDF doesn't have a TurtleLab picture inside it. Only a PDF saved by TurtleLab does.");
    const inner = readProjectFile(picture);
    return inner.ok ? { ...inner, kind: 'pdf', picture } : inner;
  }

  let text;
  let kind;
  if (isPng(bytes)) {
    kind = 'png';
    try {
      text = readTextChunk(bytes, PROJECT_KEYWORD);
    } catch (error) {
      if (error instanceof PngError) return fail(error.message);
      throw error;
    }
    if (text === null) return fail("This picture doesn't have a program inside it.");
  } else {
    kind = 'json';
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return fail('This is not a TurtleLab picture or project.');
    }
    if (!text.trimStart().startsWith('{')) return fail('This is not a TurtleLab picture or project.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return fail(kind === 'png' ? 'The program inside this picture is damaged.' : 'This project file is damaged.');
  }
  const checked = validateProject(data);
  return checked.ok ? { ok: true, project: checked.project, kind, ...(kind === 'png' ? { picture: bytes } : {}) } : fail(checked.error);
}

function fail(error) {
  return { ok: false, error };
}
