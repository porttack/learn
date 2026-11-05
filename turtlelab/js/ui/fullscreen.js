// TurtleLab: the Full screen button, which hides the browser's own bars so the blocks and the drawing fill the whole screen.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Browsers do this with the "fullscreen" feature. Chrome, Edge and Firefox on a computer have it, and so does Safari on an iPad
// (which still calls it by its old name, with webkit in front). Safari on an iPhone has no way to do it for a page like this
// one, so there the button hides itself instead of doing nothing. Nothing is stored and nothing is fetched.

const ENTER_TITLE = 'Full screen: hide the browser bars so your blocks and drawing fill the screen';
const EXIT_TITLE = 'Leave full screen (the Esc key works too)';
const WONT = 'This browser would not go full screen. An iPhone cannot. On an iPad, Share then Add to Home Screen opens TurtleLab with no browser bars.';

/**
 * What the browser offers, under whichever name it uses.
 * @param {Document} doc
 * @returns {{ supported: boolean, active: () => boolean, enter: () => Promise<void>, exit: () => Promise<void>, events: string[] }}
 */
export function fullscreenApi(doc) {
  const page = doc.documentElement;
  const request = page.requestFullscreen ? () => page.requestFullscreen({ navigationUI: 'hide' }) : page.webkitRequestFullscreen ? () => page.webkitRequestFullscreen() : null;
  const leave = doc.exitFullscreen ? () => doc.exitFullscreen() : doc.webkitExitFullscreen ? () => doc.webkitExitFullscreen() : null;
  const allowed = doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled;
  return {
    supported: Boolean(request && leave) && allowed !== false,
    active: () => Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement),
    // The newer functions give back a promise and the old one gives nothing: either way the caller gets a promise.
    enter: async () => { await request(); },
    exit: async () => { await leave(); },
    events: ['fullscreenchange', 'webkitfullscreenchange'],
  };
}

/**
 * Wire up the button. It hides itself if the browser cannot do this, toggles on a press, and follows what the browser
 * says (so the Esc key, or the browser's own way out, keeps the icon right).
 * @param {object} options
 * @param {HTMLButtonElement} options.button its <img> is swapped between the two icons
 * @param {(words: string) => void} options.say shows a line in the message bar
 * @param {Document} [options.doc]
 * @returns {{ supported: boolean }}
 */
export function setupFullscreen({ button, say, doc = document }) {
  const api = fullscreenApi(doc);
  if (!api.supported) {
    button.hidden = true;
    return { supported: false };
  }
  const icon = button.querySelector('img');
  const show = () => {
    const on = api.active();
    button.setAttribute('aria-pressed', String(on));
    button.title = on ? EXIT_TITLE : ENTER_TITLE;
    if (icon) icon.src = on ? 'images/exit-fullscreen-button.svg' : 'images/fullscreen-button.svg';
  };
  for (const name of api.events) doc.addEventListener(name, show);
  button.addEventListener('click', async () => {
    try {
      if (api.active()) await api.exit();
      else await api.enter();
    } catch {
      say(WONT);
    }
    show();
  });
  show();
  return { supported: true };
}
