// TurtleLab: the box that shows your blocks as Logo, which you can change and run.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A panel, hidden until the Logo button is pressed, with the Logo for the blocks on the page (core/logo.js)
// in a text box. Until you type in it, it follows the blocks as they change. Once you have changed it, it
// stops (your words are never thrown away behind your back) and says so, with a button to follow the blocks
// again. Run Logo hands the text to the app, which reads it (core/logo-compile.js) and runs it on the same
// paper as the blocks. Your blocks never change. Nothing here is saved or sent anywhere.

import { toLogo } from '../core/logo.js';

export class LogoBox {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the page the box floats over
   * @param {object} options.project the project to show (read every time it is refreshed)
   * @param {(text: string) => void} [options.onMessage] where to say "Copied" and the like
   * @param {(text: string) => void} [options.onRun] called with the text when Run Logo is pressed
   */
  constructor({ stage, project, onMessage = () => {}, onRun = () => {} }) {
    this.project = project;
    this.onMessage = onMessage;
    this.onRun = onRun;
    this.generated = ''; // the last text written from the blocks
    this.edited = false; // has the student changed it?

    this.el = document.createElement('section');
    this.el.className = 'logo-box';
    this.el.id = 'logo-box';
    this.el.hidden = true;
    this.el.setAttribute('aria-label', 'Your blocks as Logo code, which you can change and run');

    const head = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = 'Logo';

    const shortLabel = document.createElement('label');
    shortLabel.className = 'logo-short';
    shortLabel.title = 'Write fd, rt and pu instead of forward, right and penup. Both ways work when you run it.';
    this.shortBox = document.createElement('input');
    this.shortBox.type = 'checkbox';
    this.shortBox.addEventListener('change', () => this.refresh({ force: true }));
    shortLabel.append(this.shortBox, ' Short words');

    this.followButton = this.button('logo-follow', 'Follow my blocks', 'Throw away your changes and show the Logo for the blocks again');
    this.followButton.hidden = true;
    this.followButton.addEventListener('click', () => this.follow());
    const copyButton = this.button('logo-copy', 'Copy', 'Copy this Logo');
    copyButton.addEventListener('click', () => this.copy());
    this.runButton = this.button('logo-run', 'Run Logo', 'Run what is in this box (Ctrl+Enter)');
    this.runButton.addEventListener('click', () => this.run());
    const actions = document.createElement('span');
    actions.className = 'logo-actions';
    actions.append(this.followButton, copyButton, this.runButton);
    head.append(title, shortLabel, actions);

    this.area = document.createElement('textarea');
    this.area.className = 'logo-code';
    this.area.setAttribute('aria-label', 'Logo program');
    this.area.spellcheck = false;
    this.area.autocomplete = 'off';
    this.area.autocapitalize = 'off';
    this.area.setAttribute('autocorrect', 'off');
    this.area.wrap = 'off';
    this.area.maxLength = LOGO_MAX_CHARS;
    this.area.addEventListener('input', () => this.typed());
    this.area.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.run();
      }
    });

    this.status = document.createElement('p');
    this.status.className = 'logo-status';
    this.status.setAttribute('role', 'status');

    this.el.append(head, this.area, this.status);
    stage.append(this.el);
    this.say(HINT);
  }

  button(className, label, tip) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.title = tip;
    return button;
  }

  get visible() {
    return !this.el.hidden;
  }

  get text() {
    return this.area.value;
  }

  /** Show the box if it is hidden, and hide it if it is showing. Returns whether it is showing now. */
  toggle() {
    this.el.hidden = !this.el.hidden;
    if (!this.el.hidden) this.refresh();
    return this.visible;
  }

  /** Hide the box (for when something else takes its place). */
  hide() {
    this.el.hidden = true;
  }

  /**
   * Write the Logo for the blocks as they are now, unless you have changed it (then it is left alone) or the box
   * is hidden. `force` rewrites it even so (for the short words box).
   */
  refresh({ force = false } = {}) {
    if (this.el.hidden || (this.edited && !force)) return;
    const text = toLogo(this.project, { short: this.shortBox.checked });
    this.generated = text;
    this.edited = false;
    this.followButton.hidden = true;
    this.shortBox.disabled = false;
    if (this.area.value !== text) this.area.value = text;
    if (force) this.say(HINT);
  }

  /** The student typed something. */
  typed() {
    const edited = this.area.value !== this.generated;
    if (edited === this.edited) return;
    this.edited = edited;
    this.followButton.hidden = !edited;
    this.shortBox.disabled = edited;
    this.shortBox.title = edited ? 'Press Follow my blocks first' : '';
    this.say(edited ? CHANGED : HINT);
  }

  /** Go back to the Logo for the blocks. */
  follow() {
    this.edited = false;
    this.refresh({ force: true });
    this.onMessage('The Logo box shows your blocks again.');
  }

  run() {
    this.onRun(this.area.value);
  }

  /** Say something under the text, in the normal color or (`problem`) as a complaint. */
  say(text, problem = false) {
    this.status.textContent = text;
    this.status.classList.toggle('problem', problem);
  }

  /** Show a mistake in the Logo, and select the line it is on so it can be fixed. */
  showError(line, message) {
    this.say(`Line ${line}: ${message}`, true);
    const rows = this.area.value.split('\n');
    const before = rows.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
    const at = Math.min(before, this.area.value.length);
    this.area.focus();
    this.area.setSelectionRange(at, Math.min(at + (rows[line - 1]?.length ?? 0), this.area.value.length));
  }

  /** Take any complaint away (the Logo is running, or it was changed). */
  clearProblem() {
    if (this.status.classList.contains('problem')) this.say(this.edited ? CHANGED : HINT);
  }

  /** Put the text on the clipboard, or say how to copy it by hand if the browser will not let us. */
  async copy() {
    try {
      await navigator.clipboard.writeText(this.area.value);
      this.onMessage('Copied the Logo.');
    } catch {
      this.area.focus();
      this.area.select();
      this.onMessage('Press Ctrl+C (or Cmd+C on a Mac) to copy the Logo.');
    }
  }
}

/** The most Logo that fits in the box, so a huge paste cannot make the page crawl. */
const LOGO_MAX_CHARS = 20000;

const HINT = 'Change the Logo if you like, then press Run Logo. Your blocks stay as they are.';
const CHANGED = 'You changed the Logo, so it no longer follows your blocks. It is not saved: Copy it to keep it.';
