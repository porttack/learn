// Tests for the static pages: the app page, About, Privacy and Guide.
// They keep the privacy promises made on those pages true as the pages change.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { APP_NAME, SOURCE_URL } from '../js/app-info.js';
import { AUTOSAVE_KEY } from '../js/ui/storage.js';

const here = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, here), 'utf8');
const PAGES = ['index.html', 'about.html', 'privacy.html', 'guide.html'];
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
  for (const css of ['css/app.css', 'css/pages.css', 'css/fonts.css']) {
    assert.ok(!/@import|url\(\s*['"]?(https?:)?\/\//i.test(read(css)), `${css}: reaches outside`);
  }
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
  for (const word of ['Save', 'Open', 'New', 'Ctrl+S', 'shared computer']) assert.ok(guide.includes(word), word);
});

test('the app page links to Guide and About in a new tab, so no click loses your blocks', () => {
  const html = read('index.html');
  for (const target of ['guide.html', 'about.html']) {
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
