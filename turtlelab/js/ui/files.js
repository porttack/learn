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
// Other ways to save (right-click Save): a JPEG, an SVG, files for an embroidery machine, the Python,
// the project as text. See EXPORTS and exportAs below.
//
// Open: read a file the person chose or dropped, whether it is a saved
// picture, a TurtleLab PDF, or a plain project file. This file only reads it;
// main.js decides what to do with the result.

import { embedProject, readProjectFile } from '../core/project-file.js';
import { buildPdf, chooseLayout, sizeInPoints } from '../core/pdf.js';
import { opsToSvg } from '../core/svg-export.js';
import { planStitches } from '../core/stitch-plan.js';
import { encodeDst, encodePes, brotherColorsFor, PEC_PALETTE } from '../core/embroidery.js';
import { toPython } from '../core/python.js';
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
  const { kind } = chooseLayout(code ? sizeInPoints(code) : null, { width: shown.width, height: shown.height });
  const pdf = await buildPdf({
    title: stamp,
    code,
    drawing: { width: shown.width, height: shown.height, rgb: canvasToRgb(shown) },
    attachment: { name: `${stamp}.png`, bytes: picture },
  });
  download(new Blob([pdf], { type: 'application/pdf' }), `${stamp}.pdf`);
  return { name: `${stamp}.pdf`, kind }; // kind: where the blocks and drawing went (see chooseLayout)
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

// ---- Other ways to save -----------------------------------------------------------------------------

/** Every way to save, in the order the right-click menu lists them. The first is what the Save button does. */
export const EXPORTS = [
  { id: 'png', label: 'PNG picture with your blocks inside', hint: 'What the Save button does. Open it again to get your blocks back.' },
  { id: 'png-plain', label: 'PNG picture only', hint: 'Just the drawing. No blocks inside it.' },
  { id: 'jpeg', label: 'JPEG picture', hint: 'A small picture file, good for sharing.' },
  { id: 'svg', label: 'SVG picture', hint: 'Lines that stay sharp at any size. Holds everything you drew, even off the paper.' },
  { id: 'svg-cut', label: 'SVG for a cutter or plotter', hint: 'Hairlines in red. 100 steps are 1 inch.' },
  { id: 'pes', label: 'Embroidery: PES (Brother)', hint: 'For a Brother stitching machine. Sized to fit a 4 inch hoop.' },
  { id: 'dst', label: 'Embroidery: DST (most machines)', hint: 'For most stitching machines. Sized to fit a 4 inch hoop.' },
  { id: 'python', label: 'Python program (.py)', hint: 'Your blocks, written as Python.' },
  { id: 'json', label: 'Project file (.json)', hint: 'Just your blocks, as text. Open reads it back.' },
];

const MAX_THREAD_NAMES = 6;

/** Words for a list of things: "a", "a and b", "a, b and c". */
function listOf(things) {
  if (things.length <= 1) return things.join('');
  return `${things.slice(0, -1).join(', ')} and ${things[things.length - 1]}`;
}

/** A sentence about an embroidery plan: how big it is, how many stitches, and which threads to load. */
function describeStitching(plan, format) {
  const parts = [`${plan.stitches} stitches, ${plan.widthMm} by ${plan.heightMm} mm`];
  if (plan.threads.length === 1) {
    parts.push('1 thread');
  } else {
    parts.push(`${plan.threads.length} threads, so ${plan.threads.length - 1} thread ${plan.threads.length === 2 ? 'change' : 'changes'}`);
  }
  let sentence = `${parts.join(', ')}.`;
  if (format === 'pes') {
    // A .pes file names a Brother color for each thread, so say which, in the order they are stitched.
    const names = brotherColorsFor(plan.threads).map((index) => PEC_PALETTE[index][0]);
    sentence += ` Thread order: ${listOf(names.slice(0, MAX_THREAD_NAMES))}${names.length > MAX_THREAD_NAMES ? ' and more' : ''}.`;
  }
  if (plan.skippedFills > 0) sentence += ` Filled shapes are stitched round their edge only.`;
  return sentence;
}

/** Make a file name like turtlelab-2026-11-03-1530.svg */
const fileName = (extension) => `turtlelab-${fileStamp()}.${extension}`;

/** Save `blob` under a new name and return the name. */
function saveBlob(blob, extension) {
  const name = fileName(extension);
  download(blob, name);
  return name;
}

const NO_LINES = 'There are no lines to save yet. Press Run first, so the turtle draws something.';

/**
 * Save in one of the ways listed in EXPORTS. Resolves to { name, note } where `note` is a sentence to show
 * the person. Throws an Error with a sentence a student can read if there is nothing to save.
 *
 * @param {string} format one of the ids in EXPORTS
 * @param {{canvas: HTMLCanvasElement, project: object, turtle: import('../core/turtle.js').Turtle}} what
 */
export async function exportAs(format, { canvas, project, turtle }) {
  const keptOnlySome = turtle.truncated ? ' (Only the most recent lines were kept, because there were so many.)' : '';
  switch (format) {
    case 'png': {
      const name = await savePicture(canvas, project);
      return { name, note: `Saved ${name}. To get your blocks back, open it or drag it onto this page.` };
    }
    case 'png-plain': {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('The paper could not be turned into a picture.'))), 'image/png');
      });
      const name = saveBlob(blob, 'png');
      return { name, note: `Saved ${name}: the drawing only. It has no blocks inside, so it cannot be opened to get them back.` };
    }
    case 'jpeg': {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('The paper could not be turned into a picture.'))), 'image/jpeg', 0.92);
      });
      const name = saveBlob(blob, 'jpg');
      return { name, note: `Saved ${name}: the drawing only, as a JPEG.` };
    }
    case 'svg':
    case 'svg-cut': {
      const made = opsToSvg(turtle.ops, { mode: format === 'svg' ? 'picture' : 'cut' });
      if (!made) throw new Error(NO_LINES);
      const name = saveBlob(new Blob([made.svg], { type: 'image/svg+xml' }), 'svg');
      const what = format === 'svg'
        ? 'It holds everything you drew, even what ran off the paper.'
        : 'Every line is a red hairline, and 100 steps are 1 inch.';
      return { name, note: `Saved ${name}. ${what}${keptOnlySome}` };
    }
    case 'pes':
    case 'dst': {
      const plan = planStitches(turtle.ops, { name: 'TurtleLab' });
      if (!plan) throw new Error(NO_LINES);
      const bytes = format === 'pes' ? encodePes(plan) : encodeDst(plan);
      const name = saveBlob(new Blob([bytes], { type: 'application/octet-stream' }), format);
      return { name, note: `Saved ${name}. ${describeStitching(plan, format)}${keptOnlySome}` };
    }
    case 'python': {
      const name = saveBlob(new Blob([toPython(project)], { type: 'text/x-python' }), 'py');
      return { name, note: `Saved ${name}: your blocks as Python.` };
    }
    case 'json': {
      const name = saveBlob(new Blob([`${JSON.stringify(project, null, 2)}\n`], { type: 'application/json' }), 'json');
      return { name, note: `Saved ${name}: your blocks as text. Open can read it back.` };
    }
    default:
      throw new Error('That way of saving is not known.');
  }
}
