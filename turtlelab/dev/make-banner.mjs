// Dev tool, not part of the app. Makes images/banner.png, the picture on
// TurtleLab's card on the home page of the site (1024 by 254, like the other
// cards' banners). It loads the real app with a small spiral program, hides
// the toolbar and palettes, and puts a wordmark next to the real blocks and
// the real drawing, so the banner is just what TurtleLab looks like.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/make-banner.mjs
// The banner shows Sugar-derived artwork (the blocks and the turtle), which is
// why it lives inside this folder and not in the rest of the site.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';
const out = new URL('../images/banner.png', import.meta.url).pathname;
const WIDTH = 1024;
const HEIGHT = 254;

const chrome = await launch({ width: 1100, height: 420 });
try {
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await chrome.goto(`${BASE}?demo=banner&speed=instant&autorun=1`);
  await chrome.sleep(1000);
  await chrome.eval(`(() => {
    const hide = (selector) => document.querySelectorAll(selector).forEach((el) => { el.style.display = 'none'; });
    hide('.toolbar, .palettes, .flyout, .hint, .message, .boxes-readout, .output');
    document.body.style.background = 'linear-gradient(100deg, #2b7fe0 0%, #4da6ff 55%, #9fd0ff 100%)';
    const stage = document.getElementById('stage');
    stage.style.background = 'transparent';

    // The drawing paper, tucked into the right-hand corner. It scales as one piece with the turtle on it.
    const paper = stage.querySelector('.paper-box');
    Object.assign(paper.style, { position: 'absolute', right: '20px', top: '14px', transformOrigin: 'top right', transform: 'scale(0.9)', borderRadius: '10px', overflow: 'hidden' });

    // The real blocks, moved and shrunk to sit between the wordmark and the paper.
    const blocks = stage.querySelector('.workspace .stack');
    blocks.setAttribute('transform', 'translate(490 14) scale(0.7)');

    // The wordmark.
    const word = document.createElement('div');
    word.textContent = 'TurtleLab';
    Object.assign(word.style, { position: 'absolute', left: '36px', top: '50%', transform: 'translateY(-56%)', color: '#fff', font: '700 104px Roboto, system-ui, sans-serif', letterSpacing: '-2px', textShadow: '0 3px 10px rgba(0, 40, 100, 0.35)' });
    stage.append(word);
  })()`);
  await chrome.sleep(400);
  const { data } = await chrome.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(`wrote ${out} (${WIDTH} by ${HEIGHT})`);
  console.log('problems:', chrome.problems.length ? chrome.problems.join('\n') : 'none');
} finally {
  await chrome.close();
}
