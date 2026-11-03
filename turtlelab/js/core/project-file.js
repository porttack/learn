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
// for teachers.

import { PngError, isPng, addTextChunk, readTextChunk } from './png-chunks.js';
import { validateProject } from './project.js';

/**
 * The name the project is saved under inside the picture. It does not change
 * if the app is ever renamed, so old pictures keep opening.
 */
export const PROJECT_KEYWORD = 'porttack-turtle-project';

/** Files bigger than this are refused. A real drawing is far smaller. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

/** Put a project inside PNG picture bytes. Returns the new bytes. */
export function embedProject(pngBytes, project) {
  return addTextChunk(pngBytes, PROJECT_KEYWORD, JSON.stringify(project));
}

/**
 * Work out what a file is and get the project out of it.
 * Returns { ok: true, project, kind } where kind is 'png' or 'json', or
 * { ok: false, error } where `error` is a sentence a student can read.
 */
export function readProjectFile(bytes) {
  if (bytes.length > MAX_FILE_BYTES) return fail('That file is too big to be a TurtleLab picture.');

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
  return checked.ok ? { ok: true, project: checked.project, kind } : fail(checked.error);
}

function fail(error) {
  return { ok: false, error };
}
