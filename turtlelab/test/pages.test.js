// Tests for the static pages: the app page, About, Privacy and Guide.
// They keep the privacy promises made on those pages true as the pages change.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { APP_NAME, SOURCE_URL } from '../js/app-info.js';
import { AUTOSAVE_KEY } from '../js/ui/storage.js';

const here = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, here), 'utf8');
const PAGES = ['index.html', 'about.html', 'privacy.html', 'guide.html', 'samples.html'];
const policyOf = (html) => html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1];

test('every page has the same strict Content Security Policy', () => {
  const policy = policyOf(read('index.html'));
  assert.ok(policy, 'index.html has a policy');
  for (const directive of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "connect-src 'self'", "form-action 'none'", "object-src 'none'", "base-uri 'none'"]) {
    assert.ok(policy.includes(directive), `policy has ${directive}`);
  }
  assert.ok(!/unsafe-|https?:|\*/.test(policy), 'no unsafe-inline, unsafe-eval, wildcards or outside addresses');
  for (const page of PAGES) assert.equal(policyOf(read(page)), policy, `${page} has the same policy`);
});

test('no page has inline scripts, inline styles or inline event handlers', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.ok(!/<style/i.test(html), `${page}: <style>`);
    assert.ok(!/\sstyle\s*=/i.test(html), `${page}: style attribute`);
    assert.ok(!/<script(?![^>]*\ssrc=)/i.test(html), `${page}: inline <script>`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html), `${page}: inline event handler`);
  }
});

test('no page loads anything from another website', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.ok(!/<(script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\s(src|href|data)\s*=\s*"(https?:)?\/\//i.test(html), `${page}: loads an outside file`);
    assert.ok(!/<form\b/i.test(html), `${page}: has a form`);
  }
  for (const css of ['css/app.css', 'css/pages.css', 'css/fonts.css', 'css/site-menu.css']) {
    assert.ok(!/@import|url\(\s*['"]?(https?:)?\/\//i.test(read(css)), `${css}: reaches outside`);
  }
});

test('every page uses the turtle as its icon, and the icon is a plain, safe SVG', () => {
  for (const page of PAGES) {
    assert.match(read(page), /<link rel="icon" type="image\/svg\+xml" href="images\/favicon\.svg">/, page);
  }
  const icon = read('images/favicon.svg');
  assert.match(icon, /<svg[^>]*viewBox=/);
  assert.ok(!/<script|style=|onload|href=/i.test(icon));
});

test('the home page card has a banner, which is a PNG the size of the other cards', () => {
  const pathways = readFileSync(new URL('../_data/pathways.yml', here), 'utf8');
  assert.match(pathways, /- id: turtlelab[\s\S]*?image: \/turtlelab\/images\/banner\.png/);
  const banner = readFileSync(new URL('images/banner.png', here));
  assert.deepEqual([...banner.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  assert.equal(banner.readUInt32BE(16), 1024, 'width');
  assert.equal(banner.readUInt32BE(20), 254, 'height');
});

test('the menu on every page is exactly the site menu, in the same order', () => {
  const data = readFileSync(new URL('../_data/site_menu.yml', here), 'utf8');
  const expected = [...data.matchAll(/^- title: (.+)\n  url: (\S+)/gm)].map((m) => ({ title: m[1].trim(), href: m[2] }));
  assert.ok(expected.length >= 9, 'read the site menu');
  assert.ok(expected.some((item) => item.title === 'TurtleLab' && item.href === '/turtlelab/'), 'TurtleLab is in the site menu');
  for (const page of PAGES) {
    const panel = read(page).match(/<nav class="site-menu-panel"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(panel, `${page} has the menu`);
    const actual = [...panel.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => ({ title: m[2].trim(), href: m[1] }));
    assert.deepEqual(actual, expected, `${page}: the menu has drifted from _data/site_menu.yml`);
  }
});

test('in the app, the menu comes after About and its links open in a new tab, so no click loses your drawing', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('>About</a>') < html.indexOf('class="site-menu"'), 'the menu is to the right of About');
  const panel = html.match(/<nav class="site-menu-panel"[^>]*>([\s\S]*?)<\/nav>/)[1];
  for (const link of panel.match(/<a [^>]*>/g)) assert.match(link, /target="_blank" rel="noopener"/, link);
});

test('every page says what it is: language, viewport, and a title with the app name', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.match(html, /<html lang="en">/, page);
    assert.match(html, /<meta name="viewport"/, page);
    assert.ok(new RegExp(`<title>[^<]*${APP_NAME}[^<]*</title>`).test(html), `${page}: title`);
  }
});

test('the About page credits Sugar Labs, names the licence, and links to the source', () => {
  const about = read('about.html');
  assert.ok(about.includes(SOURCE_URL), 'links to the source in app-info.js');
  assert.match(about, /Sugar Labs/);
  assert.match(about, /Turtle Blocks/);
  assert.match(about, /GNU Affero General Public License/);
  assert.match(about, /NOTICE/);
  assert.match(about, /COPYING/);
  assert.match(about, /not made by, or endorsed by, Sugar Labs/);
  assert.match(about, /Roboto/);
});

test('the Privacy page quotes the very policy the pages carry', () => {
  const quoted = read('privacy.html').match(/<pre>([^<]*)<\/pre>/)?.[1];
  assert.equal(quoted, policyOf(read('index.html')));
});

test('the Privacy page promises only what the code does', () => {
  const privacy = read('privacy.html');
  for (const claim of ['no cookies', 'no analytics', 'no server of its own', 'GitHub Pages']) {
    assert.ok(privacy.toLowerCase().includes(claim.toLowerCase()), `says: ${claim}`);
  }
});

test('every page that describes what is stored names the one storage item the app really uses', () => {
  assert.equal(AUTOSAVE_KEY, 'turtlelab-project');
  assert.ok(read('privacy.html').includes(AUTOSAVE_KEY), 'the TurtleLab privacy page');
  const siteWide = readFileSync(new URL('../privacy.md', here), 'utf8');
  assert.ok(siteWide.includes(`\`${AUTOSAVE_KEY}\``), 'the site-wide privacy page');
  assert.match(read('privacy.html'), /local storage/i);
  assert.match(read('privacy.html'), /Save button/);
});

test('the Guide explains Save, Open, New and Ctrl+S, and no longer says saving is missing', () => {
  const guide = read('guide.html');
  assert.ok(!/not built yet|not yet/i.test(guide));
  for (const word of ['Save', 'Open', 'New', 'Ctrl+S', 'shared computer', 'Sticky notes']) assert.ok(guide.includes(word), word);
});

test('the Guide says how to delete: drag to the left, where the trash can and its shark are', () => {
  const guide = read('guide.html');
  assert.match(guide, /Delete a block<\/td><td>Drag it to the left side, where the trash can is/);
  assert.match(guide, /shark/);
  assert.match(guide, /Undo brings them back/);
});

test('the Guide points to the Samples page', () => {
  assert.match(read('guide.html'), /<a href="samples\.html">/);
});

test('the app page links to Samples, Guide and About in a new tab, so no click loses your blocks', () => {
  const html = read('index.html');
  for (const target of ['samples.html', 'guide.html', 'about.html']) {
    assert.match(html, new RegExp(`<a [^>]*href="${target}"[^>]*target="_blank"[^>]*rel="noopener"`), target);
  }
});

test('the pages have no em dashes or en dashes', () => {
  for (const page of PAGES) assert.ok(!/[\u2013\u2014]/.test(read(page)), page);
});

test('the site config publishes the folder but keeps the developer files out', () => {
  const config = readFileSync(new URL('../_config.yml', here), 'utf8');
  assert.ok(!/^\s*-\s+turtlelab\/\s*$/m.test(config), 'the whole folder is not excluded any more');
  for (const dev of ['CLAUDE.md', 'README.md', 'NOTICE.md', 'package.json', 'test/', 'dev/']) {
    assert.ok(config.includes(`- turtlelab/${dev}`), `excludes turtlelab/${dev}`);
  }
});

test('the home page has a TurtleLab card', () => {
  const pathways = readFileSync(new URL('../_data/pathways.yml', here), 'utf8');
  assert.match(pathways, /- id: turtlelab\n\s+title: "TurtleLab"\n\s+url: \/turtlelab\//);
});

test('the Guide explains making your own blocks: the to block, inputs, using itself, and what a rename or delete does', () => {
  const guide = read('guide.html');
  assert.match(guide, /<h2>Make your own blocks<\/h2>/);
  for (const word of ['<strong>to</strong>', 'dashed', 'input', 'use itself', 'a way to stop', 'Undo brings it back']) assert.ok(guide.includes(word), word);
});

test('the Guide, and the Privacy page, explain the PDF button and the Python box', () => {
  const guide = read('guide.html');
  assert.match(guide, /<strong>PDF<\/strong> \(the button with PDF on it\) downloads a PDF/);
  assert.match(guide, /grid of x and y numbers on it/, 'the Guide says the PDF has the grid');
  assert.match(guide, /on page 1 with the drawing on page 2/, 'and where a bigger program goes');
  assert.match(guide, /<h2>See your blocks as Python<\/h2>/);
  for (const word of ['turtle</em> module', 'Copy', 'IDLE or Thonny', 'def</em> functions']) assert.ok(guide.includes(word), word);
  const privacy = read('privacy.html');
  assert.match(privacy, /What does the PDF button do\?/);
  assert.match(privacy, /always has a grid on its drawing/, 'the privacy page tells the one exception to the grid never being in a saved picture');
  assert.match(privacy, /nothing is fetched to make it/);
  assert.match(privacy, /What does the Python box do\?/);
});

test('the toolbar has the PDF and Python buttons, each with its own icon, and the PDF button says what it makes', () => {
  const html = read('index.html');
  assert.match(html, /<button id="save-pdf"[^>]*title="Save a PDF: your blocks on top, your drawing below"[^>]*>\s*<img src="images\/pdf-button\.svg"/);
  assert.match(html, /<button id="python-toggle"[^>]*aria-pressed="false"[^>]*aria-controls="python-box"[^>]*>\s*<img src="images\/python-button\.svg"/);
  assert.match(html, /accept="[^"]*\.pdf,application\/pdf/, 'Open takes PDFs');
  for (const icon of ['pdf-button', 'python-button']) {
    const svg = read(`images/${icon}.svg`);
    assert.match(svg, /<svg[^>]*viewBox=/);
    assert.ok(!/<script|style=|onload|href=|<text/i.test(svg), `${icon} is a plain, safe SVG drawn from shapes`);
  }
});

test('the toolbar has no speed menu: speed is a block, which you find in Flow', () => {
  const html = read('index.html');
  assert.ok(!/<select/i.test(html), 'no drop-down menus in the toolbar');
  assert.ok(!/id="speed"/.test(html));
  assert.match(read('guide.html'), /speed<\/em> block/);
});

test('the Guide and the Privacy page explain the Logo box, and say what you type in it is not kept', () => {
  const guide = read('guide.html');
  assert.match(guide, /<h2>Write Logo, the language the turtle was made for<\/h2>/);
  for (const word of ['Run Logo', 'Follow my blocks', 'Short words', 'forward 100</em> or <em>fd 100', 'is not saved', 'no longer match', 'repeat 4 [ forward 100 right 90 ]']) assert.ok(guide.includes(word), word);
  assert.ok(!/[\u2013\u2014]/.test(guide.slice(guide.indexOf('Write Logo'), guide.indexOf('Things to know'))), 'no dashes in the new section');
  const privacy = read('privacy.html');
  assert.match(privacy, /What does the Logo box do\?/);
  assert.match(privacy, /not saved, not kept in local storage and not sent anywhere/);
});
