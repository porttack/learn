// Dev tool, not part of the app. Writes samples.html, the page that lists every
// sample with its picture, from js/ui/samples.js. The words live in samples.js
// only, so run this again whenever a sample's title, summary or tags change:
//   node turtlelab/dev/make-samples-page.mjs
// A test fails if samples.html is not exactly what this makes. The header (with
// the site menu) is copied from guide.html, so the menu cannot drift.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SAMPLES } from '../js/ui/samples.js';

const root = new URL('../', import.meta.url);
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderSamplesPage() {
  const guide = readFileSync(new URL('guide.html', root), 'utf8');
  const head = guide.match(/^[\s\S]*?<title>/)[0].replace(/<title>$/, '<title>TurtleLab samples');
  const afterTitle = guide.match(/<\/title>([\s\S]*?)<main>/)[1];
  const cards = SAMPLES.map(
    (sample) => `      <li class="sample-card">
        <a href="./?sample=${sample.id}">
          <img src="images/samples/${sample.id}.png" alt="${escape(sample.look)}" width="350" height="280">
          <h2>${escape(sample.title)}</h2>
          <span class="open">Open in TurtleLab</span>
        </a>
        <p>${escape(sample.summary)}</p>
        <p class="tags">${sample.concepts.map((tag) => `<span>${escape(tag)}</span>`).join(' ')}</p>
      </li>`,
  ).join('\n');
  return `${head}</title>${afterTitle}<main class="wide">
    <h1>TurtleLab samples</h1>

    <p>Pick a sample to open it in TurtleLab. It runs by itself, so you can watch the turtle draw it. Then change the blocks and see what happens. The sticky note on the page explains what the program does and why.</p>

    <p class="small">Nothing you change in a sample is saved unless you press Save, and the blocks you saved before are never touched. The eye button hides the blocks so you can see the whole picture. The samples are in order, easiest first.</p>

    <ul class="sample-grid">
${cards}
    </ul>

    <p class="small"><a href="guide.html">Back to the guide</a></p>
  </main>
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(new URL('samples.html', root), renderSamplesPage());
  console.log(`wrote samples.html with ${SAMPLES.length} samples`);
}
