// Dev tool, not part of the app. A tiny Chrome DevTools Protocol driver for
// checking TurtleLab in a real (headless) Chrome: mouse and touch input,
// page evaluation, screenshots, and a log of console errors and CSP
// violations. No dependencies. Needs Google Chrome at the macOS path below.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1200, height = 800, port = 9333 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'turtle-cdp-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore' });

  let targets;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      targets = await res.json();
      if (targets.some((t) => t.type === 'page')) break;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let nextId = 1;
  const pending = new Map();
  const problems = []; // console errors, exceptions, CSP violations
  const requests = []; // every URL the page asked for
  const requestLog = []; // the same, with the method: { url, method }
  let webSockets = 0; // how many web sockets the page opened
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method === 'Network.webSocketCreated') {
      webSockets += 1;
    } else if (msg.method === 'Network.requestWillBeSent') {
      requests.push(msg.params.request.url);
      requestLog.push({ url: msg.params.request.url, method: msg.params.request.method });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      problems.push('exception: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
    } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      problems.push(`console.${msg.params.type}: ` + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level)
      // Chrome's note about reading pixels more than a few times. Only our own checks do that.
      && !/willReadFrequently/.test(msg.params.entry.text)) {
      problems.push(`log.${msg.params.entry.level}: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');

  const api = {
    problems,
    requests,
    requestLog,
    get webSockets() { return webSockets; },
    send,
    /**
     * Go to a page. The site's stored data (autosave) is cleared so each test
     * starts with a fresh page, unless `keepStorage` says to keep it. The old
     * page is left FIRST: when a page unloads it autosaves its blocks, which
     * would put back the very data we are clearing.
     */
    async goto(url, { keepStorage = false } = {}) {
      if (!keepStorage && /^https?:/.test(url)) {
        await send('Page.navigate', { url: 'about:blank' });
        await sleep(150);
        try {
          await send('Storage.clearDataForOrigin', { origin: new URL(url).origin, storageTypes: 'all' });
        } catch { /* nothing to clear yet */ }
      }
      await send('Page.navigate', { url });
      await sleep(600);
    },
    /** Send downloads to this folder, without asking. */
    async downloadsTo(dir) {
      try {
        await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
      } catch {
        await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
      }
    },
    /** Choose files for a file input, as if picked in the Open dialog. */
    async setFileInput(selector, files) {
      const { root } = await send('DOM.getDocument');
      const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
      await send('DOM.setFileInputFiles', { files, nodeId });
    },
    /** Evaluate JS in the page; returns the value. Rejects after `timeout` ms (frozen tab). */
    async eval(expression, timeout = 5000) {
      const run = send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      const timer = new Promise((_, reject) => setTimeout(() => reject(new Error('page did not answer: frozen? ' + expression)), timeout));
      const result = await Promise.race([run, timer]);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed');
      return result.result.value;
    },
    mouse: (type, x, y, extra = {}) =>
      send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra }),
    async drag(from, to, steps = 8, extra = {}) {
      await api.mouse('mouseMoved', from.x, from.y, { buttons: 0 });
      await api.mouse('mousePressed', from.x, from.y, extra);
      for (let i = 1; i <= steps; i++) {
        await api.mouse('mouseMoved', from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps, extra);
      }
      await api.mouse('mouseReleased', to.x, to.y, extra);
    },
    touch: (type, points) => send('Input.dispatchTouchEvent', { type, touchPoints: points }),
    /**
     * Press and let go of a key, the way a keyboard does: `key` is the KeyboardEvent.key ('ArrowUp', ' ', 'a'), `modifiers` is a bit mask
     * (Alt 1, Ctrl 2, Meta 4, Shift 8). Pass `repeat: true` for the key events a held key keeps sending.
     */
    async press(key, { modifiers = 0, repeat = false } = {}) {
      const codes = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, ' ': 32, Enter: 13, Escape: 27 };
      const code = codes[key] ?? key.toUpperCase().charCodeAt(0);
      const text = key.length === 1 ? key : key === 'Enter' ? '\r' : undefined;
      const down = { type: text ? 'keyDown' : 'rawKeyDown', key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers, autoRepeat: repeat, ...(text ? { text } : {}) };
      await send('Input.dispatchKeyEvent', down);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers });
    },
    async click(x, y) {
      await api.mouse('mouseMoved', x, y, { buttons: 0 });
      await api.mouse('mousePressed', x, y);
      await api.mouse('mouseReleased', x, y);
    },
    async centerOf(selector) {
      return api.eval(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, left: r.left, top: r.top }; })()`);
    },
    /** Save a picture of the page. With `clip` ({ x, y, width, height, scale }), only that part of it. */
    async screenshot(path, clip = null) {
      const { data } = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
      writeFileSync(path, Buffer.from(data, 'base64'));
    },
    sleep,
    async close() {
      try { await send('Browser.close'); } catch { /* already gone */ }
      proc.kill();
    },
  };
  return api;
}
