// TurtleLab: the little box that shows your blocks as Python.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A small panel, hidden until the Python button is pressed, with the Python for the
// blocks on the page (core/python.js) in a small monospace font. It follows the
// blocks as they change. Copy puts the program on the clipboard so it can be pasted
// into IDLE or Thonny. Nothing here is saved or sent anywhere: it only shows text.

import { toPython } from '../core/python.js';

export class PythonBox {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the page the box floats over
   * @param {object} options.project the project to show (read every time it is refreshed)
   * @param {(text: string) => void} [options.onMessage] where to say "Copied" and the like
   */
  constructor({ stage, project, onMessage = () => {} }) {
    this.project = project;
    this.onMessage = onMessage;
    this.text = '';

    this.el = document.createElement('section');
    this.el.className = 'python-box';
    this.el.hidden = true;
    this.el.id = 'python-box';
    this.el.setAttribute('aria-label', 'Your blocks as Python code');

    const head = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = 'Python';
    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'python-copy';
    this.copyButton.textContent = 'Copy';
    this.copyButton.title = 'Copy this code, to paste into IDLE or Thonny';
    this.copyButton.addEventListener('click', () => this.copy());
    head.append(title, this.copyButton);

    this.pre = document.createElement('pre');
    this.pre.className = 'python-code';
    this.pre.tabIndex = 0; // so the keyboard can scroll it
    this.code = document.createElement('code');
    this.pre.append(this.code);

    this.el.append(head, this.pre);
    stage.append(this.el);
  }

  get visible() {
    return !this.el.hidden;
  }

  /** Hide the box (for when something else takes its place). */
  hide() {
    this.el.hidden = true;
  }

  /** Show the box if it is hidden, and hide it if it is showing. Returns whether it is showing now. */
  toggle() {
    this.el.hidden = !this.el.hidden;
    if (!this.el.hidden) this.refresh();
    return this.visible;
  }

  /** Write the Python for the blocks as they are now. Does nothing while the box is hidden. */
  refresh() {
    if (this.el.hidden) return;
    const text = toPython(this.project);
    if (text === this.text) return;
    this.text = text;
    this.code.textContent = text;
  }

  /** Put the code on the clipboard, or say how to copy it by hand if the browser will not let us. */
  async copy() {
    try {
      await navigator.clipboard.writeText(this.text);
      this.onMessage('Copied the Python. Paste it into IDLE or Thonny and run it.');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(this.code);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      this.onMessage('The code is selected. Press Ctrl+C (or Cmd+C) to copy it.');
    }
  }
}
