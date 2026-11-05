// Tests for js/ui/fullscreen.js: finding the browser's fullscreen functions under either name, and the button that uses them.
// Nothing here needs a browser: a small pretend document stands in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullscreenApi, setupFullscreen } from '../js/ui/fullscreen.js';

/** A pretend document. `names` says which fullscreen functions this browser has: 'standard', 'webkit' or neither. */
function pretendDocument(names, { enabled } = {}) {
  const listeners = new Map();
  const calls = [];
  const doc = {
    calls,
    documentElement: {},
    addEventListener: (name, f) => { listeners.set(name, f); },
    fire: (name) => listeners.get(name)?.(),
  };
  if (names === 'standard') {
    doc.documentElement.requestFullscreen = async (options) => { calls.push(['request', options]); doc.fullscreenElement = doc.documentElement; };
    doc.exitFullscreen = async () => { calls.push(['exit']); doc.fullscreenElement = null; };
    if (enabled !== undefined) doc.fullscreenEnabled = enabled;
  }
  if (names === 'webkit') {
    doc.documentElement.webkitRequestFullscreen = () => { calls.push(['request']); doc.webkitFullscreenElement = doc.documentElement; };
    doc.webkitExitFullscreen = () => { calls.push(['exit']); doc.webkitFullscreenElement = null; };
    if (enabled !== undefined) doc.webkitFullscreenEnabled = enabled;
  }
  return doc;
}

function pretendButton() {
  const attributes = {};
  const icon = { src: '' };
  const button = {
    hidden: false,
    title: '',
    handler: null,
    setAttribute: (name, value) => { attributes[name] = value; },
    querySelector: () => icon,
    addEventListener: (name, f) => { if (name === 'click') button.handler = f; },
    attributes,
    icon,
  };
  return button;
}

test('a computer browser (standard names) and an iPad (webkit names) both count as supported; an iPhone does not', () => {
  assert.equal(fullscreenApi(pretendDocument('standard')).supported, true);
  assert.equal(fullscreenApi(pretendDocument('webkit')).supported, true);
  assert.equal(fullscreenApi(pretendDocument('none')).supported, false);
});

test('a browser that says fullscreen is switched off (inside a frame, or by a setting) is not supported', () => {
  assert.equal(fullscreenApi(pretendDocument('standard', { enabled: false })).supported, false);
  assert.equal(fullscreenApi(pretendDocument('webkit', { enabled: false })).supported, false);
  assert.equal(fullscreenApi(pretendDocument('standard', { enabled: true })).supported, true);
});

test('entering and leaving work with either set of names, even when one gives back no promise', async () => {
  for (const names of ['standard', 'webkit']) {
    const doc = pretendDocument(names);
    const api = fullscreenApi(doc);
    assert.equal(api.active(), false);
    await api.enter();
    assert.equal(api.active(), true, names);
    await api.exit();
    assert.equal(api.active(), false, names);
    assert.deepEqual(doc.calls.map(([name]) => name), ['request', 'exit']);
  }
});

test('the standard request asks the browser to hide its own bars', async () => {
  const doc = pretendDocument('standard');
  await fullscreenApi(doc).enter();
  assert.deepEqual(doc.calls[0], ['request', { navigationUI: 'hide' }]);
});

test('the button hides itself where fullscreen is not possible', () => {
  const button = pretendButton();
  const result = setupFullscreen({ button, say: () => {}, doc: pretendDocument('none') });
  assert.equal(result.supported, false);
  assert.equal(button.hidden, true);
  assert.equal(button.handler, null);
});

test('pressing the button toggles, and the icon and title follow what the browser says', async () => {
  for (const names of ['standard', 'webkit']) {
    const doc = pretendDocument(names);
    const button = pretendButton();
    setupFullscreen({ button, say: () => {}, doc });
    assert.equal(button.hidden, false);
    assert.equal(button.attributes['aria-pressed'], 'false');
    assert.match(button.icon.src, /\/fullscreen-button\.svg$/);
    await button.handler();
    assert.equal(button.attributes['aria-pressed'], 'true', names);
    assert.match(button.icon.src, /exit-fullscreen-button\.svg$/);
    assert.match(button.title, /Leave full screen/);
    await button.handler();
    assert.equal(button.attributes['aria-pressed'], 'false', names);
    assert.match(button.icon.src, /^images\/fullscreen-button\.svg$/);
  }
});

test('leaving with the Esc key (the browser does it, not the button) puts the button right again', async () => {
  const doc = pretendDocument('standard');
  const button = pretendButton();
  setupFullscreen({ button, say: () => {}, doc });
  await button.handler();
  assert.equal(button.attributes['aria-pressed'], 'true');
  doc.fullscreenElement = null; // the browser leaves fullscreen on its own
  doc.fire('fullscreenchange');
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.match(button.icon.src, /^images\/fullscreen-button\.svg$/);
});

test('if the browser refuses, the button says what to try instead of failing quietly', async () => {
  const doc = pretendDocument('standard');
  doc.documentElement.requestFullscreen = async () => { throw new TypeError('Permissions check failed'); };
  const button = pretendButton();
  const said = [];
  setupFullscreen({ button, say: (words) => said.push(words), doc });
  await button.handler();
  assert.equal(said.length, 1);
  assert.match(said[0], /Add to Home Screen/);
  assert.equal(button.attributes['aria-pressed'], 'false');
});
