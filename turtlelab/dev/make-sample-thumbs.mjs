// Dev tool, not part of the app. Makes the little pictures on the Samples page
// by running every sample in a real headless Chrome and photographing the
// paper (with the blocks hidden). Run it again whenever a sample changes:
//   python3 -m http.server 4011 --directory turtlelab
//   node turtlelab/dev/make-sample-thumbs.mjs
// The samples that use chance (random) come out a little different each time. To make only some
// (and leave the other pictures exactly as they are), name them:  ONLY=stitch-heart,stitch-star node ...
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { mkdirSync } from 'node:fs';
import { LISTED_SAMPLES } from '../js/ui/samples.js';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const OUT = new URL('../images/samples/', import.meta.url).pathname;
const WIDTH = 350; // thumbnails are 350 by 280, the shape of the paper
mkdirSync(OUT, { recursive: true });

/** True if anything was drawn right at the edge of the paper (so part of the picture is cut off). */
const touchesEdge = (chrome) =>
  chrome.eval(`(() => {
    const canvas = document.querySelector('canvas.paper');
    const { width, height } = canvas;
    const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const at = (x, y) => (y * width + x) * 4;
    const background = [data[0], data[1], data[2]];
    const differs = (x, y) => [0, 1, 2].some((c) => data[at(x, y) + c] !== background[c]);
    for (let i = 0; i < width; i += 1) if (differs(i, 2) || differs(i, height - 3)) return true;
    for (let i = 0; i < height; i += 1) if (differs(2, i) || differs(width - 3, i)) return true;
    return false;
  })()`);

const chrome = await launch({ width: 1200, height: 800 });
try {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const sample of LISTED_SAMPLES) {
    if (only && !only.includes(sample.id)) continue;
    // A sample that uses chance can wander off the paper. Run it again until the
    // picture fits, so the thumbnail shows all of it.
    const tries = sample.concepts.includes('random') ? 12 : 1;
    for (let attempt = 1; attempt <= tries; attempt += 1) {
      await chrome.goto(`${BASE}?sample=${sample.id}&speed=instant`);
      // Wait until the run is over (the Run button comes back), up to 20 seconds.
      for (let i = 0; i < 100; i += 1) {
        if (await chrome.eval(`!document.getElementById('run').disabled`)) break;
        await chrome.sleep(200);
      }
      if (!(await touchesEdge(chrome))) break;
      if (attempt === tries) console.log(`(${sample.id}: still touches the edge after ${tries} tries)`);
    }
    // Only the picture belongs in a thumbnail, not the little readout of box values.
    await chrome.eval(`document.querySelector('.boxes-readout').style.display = 'none'`);
    await chrome.click(...Object.values(await chrome.eval(`(() => { const r = document.getElementById('hide-blocks').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`)));
    await chrome.sleep(300);
    const box = await chrome.eval(`(() => { const r = document.querySelector('.paper-box').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()`);
    await chrome.screenshot(`${OUT}${sample.id}.png`, { ...box, scale: WIDTH / box.width });
    console.log(`made images/samples/${sample.id}.png`);
  }
  if (chrome.problems.length) console.log('PROBLEMS:\n' + chrome.problems.join('\n'));
} finally {
  await chrome.close();
}
