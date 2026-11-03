// TurtleLab: saving a picture, and opening one.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Save: the drawing on the paper is turned into a PNG picture, the project (the
// blocks) is tucked inside it (see core/project-file.js), and the browser is
// asked to download it. The download is made right here from data already in
// the page, so nothing is sent anywhere.
//
// Open: read a file the person chose or dropped, whether it is a saved
// picture or a plain project file. This file only reads it; main.js decides
// what to do with the result.

import { embedProject, readProjectFile } from '../core/project-file.js';

const two = (n) => String(n).padStart(2, '0');

/** A date and time for a file name, like 2026-11-03-1530. */
export function fileStamp(date = new Date()) {
  const day = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
  return `${day}-${two(date.getHours())}${two(date.getMinutes())}`;
}

/** Ask the browser to save these bytes as a file with this name. */
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before letting go of the data.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Save the paper as a PNG with the project inside it. Resolves to the file
 * name the browser was asked to use.
 */
export async function savePicture(canvas, project) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('The paper could not be turned into a picture.'))), 'image/png');
  });
  const picture = new Uint8Array(await blob.arrayBuffer());
  const name = `turtlelab-${fileStamp()}.png`;
  download(new Blob([embedProject(picture, project)], { type: 'image/png' }), name);
  return name;
}

/**
 * Read a chosen or dropped file. Resolves to { result, bytes } where `result`
 * is what readProjectFile says (see core/project-file.js), or throws if the
 * file could not be read at all.
 */
export async function readFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { result: readProjectFile(bytes), bytes };
}

/** True if a drag carries files (as opposed to text or a link). */
export function dragHasFiles(event) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}
