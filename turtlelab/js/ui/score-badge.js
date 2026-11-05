// TurtleLab: the program score, a small badge in the bottom right corner of the window.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// It shows how complex the program is (core/complexity.js works that out from the blocks), and it goes up as you add loops, conditionals and above all
// variables. Press it to see how the score was worked out and what to try next. When the score goes up and then stays still for a moment, "+12"
// floats up from the badge (and the level's name, if you reached a new level). It only reads the project: nothing here stores or sends anything.

import { scoreProject } from '../core/complexity.js';

/** How long the score must stay still before the "+N" shows, so building a stack block by block gives one "+N", not one for each block. */
const SETTLE_MS = 500;
/** How long the "+N" floats (the stylesheet's animation says the same). */
const GAIN_MS = 1800;

export class ScoreBadge {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the element the badge floats in
   * The rest are for tests: `setTimer`, `clearTimer`.
   */
  constructor({ stage, setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (id) => clearTimeout(id) }) {
    Object.assign(this, { setTimer, clearTimer });
    this.shown = 0; // the score the last "+N" was counted from
    this.result = scoreProject(null);
    this.settleTimer = null;
    this.gainTimer = null;

    this.el = document.createElement('div');
    this.el.className = 'score-badge';

    this.pill = document.createElement('button');
    this.pill.type = 'button';
    this.pill.className = 'score-pill';
    this.pill.setAttribute('aria-expanded', 'false');
    this.pill.setAttribute('aria-controls', 'score-panel');
    const star = document.createElement('span');
    star.className = 'score-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '★';
    const word = document.createElement('span');
    word.className = 'score-word';
    word.textContent = 'Score';
    this.number = document.createElement('span');
    this.number.className = 'score-number';
    this.pill.append(star, word, this.number);

    this.gain = document.createElement('span');
    this.gain.className = 'score-gain';
    this.gain.hidden = true;
    this.gain.setAttribute('aria-hidden', 'true');

    this.panel = document.createElement('div');
    this.panel.className = 'score-panel';
    this.panel.id = 'score-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'region');
    this.panel.setAttribute('aria-label', 'How the score was worked out');

    this.el.append(this.pill, this.gain, this.panel);
    stage.append(this.el);

    this.pill.addEventListener('click', () => this.toggle());
    // Anywhere else, or Escape, closes the details.
    document.addEventListener('pointerdown', (event) => {
      if (!this.panel.hidden && !this.el.contains(event.target)) this.close();
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.panel.hidden) {
        this.close();
        this.pill.focus();
      }
    });
    this.draw();
  }

  /**
   * Work the score out again for these blocks (the project's, as the editor has them). A `quiet` refresh (a program opened, or undone) only shows
   * the new score; otherwise, once the score settles, a rise floats up as "+N".
   */
  refresh(project, { quiet = false } = {}) {
    const before = this.result;
    this.result = scoreProject(project);
    this.draw();
    if (quiet) {
      this.clearTimer(this.settleTimer);
      this.settleTimer = null;
      this.shown = this.result.score;
      this.shownLevel = this.result.level;
      return;
    }
    if (this.result.score !== before.score) {
      this.clearTimer(this.settleTimer);
      this.settleTimer = this.setTimer(() => this.settle(), SETTLE_MS);
    }
  }

  /** The score has stopped changing: if it is higher than it was, show how much higher. */
  settle() {
    this.settleTimer = null;
    const { score, level } = this.result;
    const gained = score - this.shown;
    const before = this.shownLevel ?? level;
    this.shown = score;
    this.shownLevel = level;
    if (gained <= 0) return;
    this.gain.textContent = level.min > before.min ? `+${gained}  ${level.label}!` : `+${gained}`;
    this.gain.hidden = false;
    // Start the animation again even if one was going (take the class off, let the page notice, put it back).
    this.gain.classList.remove('score-gain-go');
    void this.gain.offsetWidth;
    this.gain.classList.add('score-gain-go');
    this.clearTimer(this.gainTimer);
    this.gainTimer = this.setTimer(() => {
      this.gain.hidden = true;
      this.gain.classList.remove('score-gain-go');
    }, GAIN_MS);
  }

  /** Put the numbers and the details on the screen. */
  draw() {
    const { score, level, parts, tip } = this.result;
    this.number.textContent = String(score);
    this.pill.title = `Program score: ${score} (${level.label}). Press to see how it was worked out`;
    this.pill.setAttribute('aria-label', `Program score ${score}, ${level.label}. Press for details`);
    this.drawPanel({ score, level, parts, tip });
  }

  drawPanel({ score, level, parts, tip }) {
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const head = make('p', 'score-head');
    head.append(make('strong', 'score-big', String(score)), make('span', 'score-level', level.label));
    const next = make('p', 'score-next', level.next ? `${level.next.min - score} more points to reach ${level.next.label}` : 'The top level');

    const table = make('table', 'score-table');
    for (const part of parts) {
      const row = make('tr', part.points === 0 ? 'score-zero' : '');
      row.dataset.part = part.id;
      const name = make('td', 'score-part');
      name.append(make('span', 'score-part-name', part.label));
      if (part.detail) name.append(make('span', 'score-part-detail', part.detail));
      row.append(name, make('td', 'score-points', part.points > 0 ? `+${part.points}` : '0'));
      table.append(row);
    }
    const advice = make('p', 'score-tip', tip);
    const fine = make('p', 'score-fine', 'Counted from the blocks on the page, here on this device. Variables score the most, then loops and conditionals. Plain blocks only count up to a limit.');
    this.panel.replaceChildren(head, next, table, advice, fine);
  }

  toggle() {
    if (this.panel.hidden) this.open();
    else this.close();
  }

  open() {
    this.panel.hidden = false;
    this.pill.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.panel.hidden = true;
    this.pill.setAttribute('aria-expanded', 'false');
  }
}
