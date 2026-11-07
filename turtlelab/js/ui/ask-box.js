// TurtleLab: the question box that an ask block shows.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A program that reaches an ask block waits here for a number. The box floats at the top of the page (clear of the drawing and of the
// blocks), holds the question the block carries, a place to type, OK and Cancel. Enter is OK and Escape is Cancel. Something that is not a
// number (parseAnswer in core/format.js) is not accepted: the box says what to type and stays open. It is a box of the page, not
// window.prompt, which stops everything else on the page (the shark, Stop) while it is open.
//
// Giving up (Cancel or Escape) answers null, and the scheduler stops the program as if Stop had been pressed. Stop pressed while the box is
// open takes it away (`cancel`). Nothing typed here is kept anywhere: the number goes into box1 and nowhere else.

import { parseAnswer } from '../core/format.js';

export class AskBox {
  /** @param {{ stage: HTMLElement }} options the element the box floats inside */
  constructor({ stage }) {
    this.stage = stage;
    this.el = null;
  }

  /** True while a question is showing. */
  get open() {
    return this.el !== null;
  }

  /**
   * Show a question. Returns { answered, cancel }: `answered` settles with the number typed, or null if the person gave up, and
   * `cancel()` takes the box away (the program was stopped). A second question while one is open replaces it, and the first is given up.
   */
  ask(question) {
    this.cancel();
    let settle;
    const answered = new Promise((resolve) => { settle = resolve; });
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };

    const panel = make('form', 'ask-box');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'A question for you');
    panel.noValidate = true;
    const words = make('p', 'ask-question', question && question.trim() ? question : 'Type a number.');
    const row = make('div', 'ask-row');
    const input = make('input', 'ask-input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = 24;
    input.setAttribute('aria-label', 'Your answer, a number');
    const ok = make('button', 'ask-ok', 'OK');
    ok.type = 'submit';
    const cancelButton = make('button', 'ask-cancel', 'Cancel');
    cancelButton.type = 'button';
    const problem = make('p', 'ask-problem');
    problem.setAttribute('role', 'alert');
    row.append(input, ok, cancelButton);
    panel.append(words, row, problem);

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      panel.remove();
      if (this.el === panel) {
        this.el = null;
        this.stop = null;
      }
      settle(value);
    };
    panel.addEventListener('submit', (event) => {
      event.preventDefault();
      const number = parseAnswer(input.value);
      if (number === null) {
        problem.textContent = 'Type a number, like 12 or -3.5.';
        input.focus();
        input.select();
        return;
      }
      finish(number);
    });
    input.addEventListener('input', () => { problem.textContent = ''; });
    cancelButton.addEventListener('click', () => finish(null));
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(null);
      }
      event.stopPropagation(); // typing here is not the workspace's keys
    });

    this.el = panel;
    this.stop = () => finish(null);
    this.stage.append(panel);
    input.focus();
    return { answered, cancel: () => finish(null) };
  }

  /** Take any open question away (its answer is null). */
  cancel() {
    this.stop?.();
  }
}
