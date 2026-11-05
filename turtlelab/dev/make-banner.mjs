// Dev tool, not part of the app. Makes two pictures of TurtleLab:
//   images/banner.png  the picture on TurtleLab's card on the home page of the site (1024 by 254, like the other cards' banners)
//   images/social.png  the picture a mail program, chat or social site shows when the address of the app is pasted in
//                      (1200 by 630, the shape those expect; index.html names it in its og:image tag)
// Each one loads the real app with a small spiral program, hides the toolbar and palettes, and puts a wordmark next to the
// real blocks and the real drawing, so the picture is just what TurtleLab looks like.
// Start the dev server first:  python3 -m http.server 4011 --directory turtlelab
// Then run:                    node turtlelab/dev/make-banner.mjs
// The pictures show Sugar-derived artwork (the blocks and the turtle), which is why they live inside this folder and not in
// the rest of the site.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const BASE = process.env.TURTLE_URL ?? 'http://127.0.0.1:4011/';

// Where everything goes, picture by picture. The paper (with the turtle on it) is 700 by 560 before it is scaled.
const PICTURES = [
  {
    file: 'banner.png',
    width: 1024,
    height: 254,
    paper: { right: 20, top: 14, scale: 0.9 },
    blocks: { x: 490, y: 14, scale: 0.7 },
    word: { left: '36px', top: '50%', transform: 'translateY(-56%)', font: '700 104px Roboto, system-ui, sans-serif', letterSpacing: '-2px' },
    tagline: null,
  },
  {
    file: 'social.png',
    width: 1200,
    height: 630,
    paper: { right: 44, top: 120, scale: 0.6 },
    blocks: { x: 70, y: 300, scale: 0.85 },
    word: { left: '62px', top: '50px', transform: 'none', font: '700 138px Roboto, system-ui, sans-serif', letterSpacing: '-3px' },
    tagline: { left: 66, top: '208px', lines: ['Snap blocks together', 'and watch a turtle draw'], font: '500 34px/42px Roboto, system-ui, sans-serif' },
  },
];

const chrome = await launch({ width: 1300, height: 760 });
try {
  for (const picture of PICTURES) {
    const { file, width, height } = picture;
    const out = new URL(`../images/${file}`, import.meta.url).pathname;
    await chrome.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await chrome.goto(`${BASE}?demo=banner&speed=instant&autorun=1`);
    await chrome.sleep(1000);
    await chrome.eval(`((picture) => {
      const hide = (selector) => document.querySelectorAll(selector).forEach((el) => { el.style.display = 'none'; });
      hide('.toolbar, .palettes, .flyout, .hint, .message, .boxes-readout, .output, [class*="trash"]');
      document.body.style.background = 'linear-gradient(100deg, #2b7fe0 0%, #4da6ff 55%, #9fd0ff 100%)';
      const stage = document.getElementById('stage');
      stage.style.background = 'transparent';

      // The drawing paper, tucked into the right-hand corner. It scales as one piece with the turtle on it.
      const paper = stage.querySelector('.paper-box');
      Object.assign(paper.style, { position: 'absolute', right: picture.paper.right + 'px', top: picture.paper.top + 'px', transformOrigin: 'top right', transform: 'scale(' + picture.paper.scale + ')', borderRadius: '10px', overflow: 'hidden' });

      // The real blocks, moved and shrunk to sit between the wordmark and the paper.
      const blocks = stage.querySelector('.workspace .stack');
      blocks.setAttribute('transform', 'translate(' + picture.blocks.x + ' ' + picture.blocks.y + ') scale(' + picture.blocks.scale + ')');

      const text = (words, style) => {
        const el = document.createElement('div');
        el.textContent = words;
        Object.assign(el.style, { position: 'absolute', color: '#fff', textShadow: '0 3px 10px rgba(0, 40, 100, 0.35)', whiteSpace: 'nowrap' }, style);
        stage.append(el);
      };
      text('TurtleLab', picture.word);
      if (picture.tagline) text(picture.tagline.lines.join(String.fromCharCode(10)), { left: picture.tagline.left + 'px', top: picture.tagline.top, font: picture.tagline.font, whiteSpace: 'pre' });
    })(${JSON.stringify(picture)})`);
    await chrome.sleep(400);
    const { data } = await chrome.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(out, Buffer.from(data, 'base64'));
    console.log(`wrote ${out} (${width} by ${height})`);
  }
  console.log('problems:', chrome.problems.length ? chrome.problems.join('\n') : 'none');
} finally {
  await chrome.close();
}
