// TurtleLab: saving a picture, and opening one.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Save: the drawing on the paper is turned into a PNG picture, the project (the
// blocks) is tucked inside it (see core/project-file.js), and the browser is
// asked to download it. The download is made right here from data already in
// the page, so nothing is sent anywhere.
//
// Save a PDF: the same picture is attached to a one page PDF that has the blocks in
// the top half and the drawing in the bottom half (see core/pdf.js).
//
// Open: read a file the person chose or dropped, whether it is a saved
// picture, a TurtleLab PDF, or a plain project file. This file only reads it;
// main.js decides what to do with the result.

import { embedProject, readProjectFile } from '../core/project-file.js';
import { buildPdf } from '../core/pdf.js';
import { canvasToRgb, renderCodeImage } from './code-image.js';

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

/** The paper as PNG bytes, with the project tucked inside. */
export async function makePicture(canvas, project) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('The paper could not be turned into a picture.'))), 'image/png');
  });
  return embedProject(new Uint8Array(await blob.arrayBuffer()), project);
}

/**
 * Save the paper as a PNG with the project inside it. Resolves to the file
 * name the browser was asked to use.
 */
export async function savePicture(canvas, project) {
  const picture = await makePicture(canvas, project);
  const name = `turtlelab-${fileStamp()}.png`;
  download(new Blob([picture], { type: 'image/png' }), name);
  return name;
}

/**
 * Save a one page PDF: the blocks on top, the drawing below, and the PNG (with the blocks
 * inside it) attached. `canvas` is the bare paper, which the attached PNG is made from.
 * `shown` is what the page shows of the drawing, which can be the paper with the turtle
 * on it (the PNG never has the turtle, the page for a teacher grading does).
 * Resolves to the file name the browser was asked to use.
 */
export async function savePdf(canvas, project, shown = canvas) {
  const stamp = `turtlelab-${fileStamp()}`;
  const [picture, code] = await Promise.all([makePicture(canvas, project), renderCodeImage(project)]);
  const pdf = await buildPdf({
    title: stamp,
    code,
    drawing: { width: shown.width, height: shown.height, rgb: canvasToRgb(shown) },
    attachment: { name: `${stamp}.png`, bytes: picture },
  });
  download(new Blob([pdf], { type: 'application/pdf' }), `${stamp}.pdf`);
  return `${stamp}.pdf`;
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
