// TurtleLab: the badge in the bottom right corner: how many blocks, and the program's complexity, elegance and efficiency.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A small card with four columns: the number of blocks, and three numbers from 0.0 to 1.0 (core/quality.js works them out). Complexity and
// elegance come from the blocks and follow them as they change. Efficiency is about the last run, so it says "run it" until a program has run, and
// goes back to that when the blocks change. Press the card for the reasons behind each number and what to try next. When building makes complexity or
// elegance go up and then stay still for a moment, "+0.1 elegance" floats up. It only reads the blocks and the run: nothing here stores or sends anything.

import { assess, tenths, levelLine, METRICS } from '../core/quality.js';

/** How long the numbers must stay still before a "+0.1" shows, so building a stack block by block gives one, not one for each block. */
const SETTLE_MS = 500;
/** How long the "+0.1" floats (the stylesheet's animation says the same). */
const GAIN_MS = 1800;

export class ScoreBadge {
  /**
   * @param {object} options
   * @param {HTMLElement} options.stage the element the badge floats in
   * The rest are for tests: `setTimer`, `clearTimer`.
   */
  constructor({ stage, setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (id) => clearTimeout(id) }) {
    Object.assign(this, { setTimer, clearTimer });
    this.project = null;
    this.run = null; // what the last run did (core/efficiency.js drawingStats), or null
    this.result = assess({ project: null });
    this.shown = { complexity: tenths(0), elegance: tenths(null) }; // what the last "+0.1" was counted from
    this.settleTimer = null;
    this.gainTimer = null;

    this.el = document.createElement('div');
    this.el.className = 'score-badge';

    this.pill = document.createElement('button');
    this.pill.type = 'button';
    this.pill.className = 'score-pill';
    this.pill.setAttribute('aria-expanded', 'false');
    this.pill.setAttribute('aria-controls', 'score-panel');
    this.cells = {};
    const cell = (id, label) => {
      const node = document.createElement('span');
      node.className = `score-cell score-${id}`;
      node.dataset.metric = id;
      const caption = document.createElement('span');
      caption.className = 'score-label';
      caption.textContent = label;
      const value = document.createElement('span');
      value.className = 'score-value';
      const bar = document.createElement('span');
      bar.className = 'score-bar';
      const fill = document.createElement('i');
      bar.append(fill);
      node.append(caption, value, bar);
      this.cells[id] = { node, value, fill };
      return node;
    };
    this.pill.append(cell('blocks', 'Blocks'), ...METRICS.map((m) => cell(m.id, m.label)));

    this.gain = document.createElement('span');
    this.gain.className = 'score-gain';
    this.gain.hidden = true;
    this.gain.setAttribute('aria-hidden', 'true');

    this.panel = document.createElement('div');
    this.panel.className = 'score-panel';
    this.panel.id = 'score-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'region');
    this.panel.setAttribute('aria-label', 'How complex, elegant and efficient the program is');

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
   * Work the numbers out again for these blocks (the project's, as the editor has them). The blocks changed, so the last run no longer says how
   * efficient they are: efficiency waits for the next run. A `quiet` refresh (a program opened, or undone) only shows the new numbers; otherwise, once
   * complexity and elegance settle, a rise floats up as "+0.1 elegance".
   */
  refresh(project, { quiet = false } = {}) {
    this.project = project;
    this.run = null;
    this.result = assess({ project, run: null });
    this.draw();
    if (quiet) {
      this.clearTimer(this.settleTimer);
      this.settleTimer = null;
      this.remember();
      return;
    }
    this.clearTimer(this.settleTimer);
    this.settleTimer = this.setTimer(() => this.settle(), SETTLE_MS);
  }

  /** A program has run (or been stopped): what it did says how efficient it was. `null` forgets the run. Efficiency never floats a "+". */
  setRun(run) {
    this.run = run;
    this.result = assess({ project: this.project, run });
    this.draw();
  }

  /** The numbers as they are shown now are what the next "+" counts from. */
  remember() {
    this.shown = { complexity: tenths(this.result.complexity.value), elegance: tenths(this.result.elegance.value) };
  }

  /** The numbers have stopped changing: say which went up, if any. */
  settle() {
    this.settleTimer = null;
    const now = { complexity: tenths(this.result.complexity.value), elegance: tenths(this.result.elegance.value) };
    const rose = [];
    for (const { id, label } of METRICS.slice(0, 2)) {
      const before = Number(this.shown[id]);
      const after = Number(now[id]);
      // (Only a rise from a real number counts: elegance first appearing, once there are blocks to judge, is not a rise.)
      if (Number.isFinite(before) && Number.isFinite(after) && after > before) rose.push(`+${(after - before).toFixed(1)} ${label.toLowerCase()}`);
    }
    this.shown = now;
    if (rose.length === 0) return;
    this.gain.textContent = rose.join('  ');
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

  /** What a column says for a number: the number to one decimal, or what is needed first. */
  say(id, value) {
    if (value !== null) return tenths(value);
    return id === 'efficiency' ? 'run it' : '?';
  }

  /** Put the numbers and the details on the screen. */
  draw() {
    const { blocks, complexity, elegance, efficiency } = this.result;
    const values = { complexity: complexity.value, elegance: elegance.value, efficiency: efficiency.value };
    this.cells.blocks.value.textContent = String(blocks);
    this.cells.blocks.fill.parentElement.hidden = true;
    for (const { id } of METRICS) {
      const { value, fill, node } = this.cells[id];
      value.textContent = this.say(id, values[id]);
      fill.style.width = `${Math.round((values[id] ?? 0) * 100)}%`;
      node.classList.toggle('score-none', values[id] === null);
    }
    const said = METRICS.map(({ id, label }) => `${label} ${values[id] === null ? (id === 'efficiency' ? 'after it runs' : 'not yet') : tenths(values[id])}`);
    this.pill.title = `${blocks} ${blocks === 1 ? 'block' : 'blocks'}. ${said.join('. ')}. Press to see the reasons`;
    this.pill.setAttribute('aria-label', `${blocks} ${blocks === 1 ? 'block' : 'blocks'}. ${said.join('. ')}. Press for the reasons`);
    this.drawPanel();
  }

  drawPanel() {
    const { blocks, complexity, elegance, efficiency } = this.result;
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const head = make('p', 'score-head');
    head.append(make('strong', 'score-big', String(blocks)), make('span', 'score-level', blocks === 1 ? 'block' : 'blocks'));

    const section = (metric, value, bodyNodes, heading = null) => {
      const box = make('section', `score-section score-section-${metric.id}`);
      box.dataset.metric = metric.id;
      const title = make('h3', 'score-title');
      title.append(make('span', 'score-title-name', metric.label), make('span', 'score-title-value', this.say(metric.id, value)));
      if (heading) title.append(make('span', 'score-title-note', heading));
      const meter = make('div', 'score-meter');
      const fill = document.createElement('i');
      fill.style.width = `${Math.round((value ?? 0) * 100)}%`;
      meter.append(fill);
      box.append(title, meter, make('p', 'score-what', metric.what), ...bodyNodes);
      return box;
    };
    const reasons = (list) => {
      const ul = make('ul', 'score-reasons');
      for (const reason of list) ul.append(make('li', `score-reason score-${reason.kind}`, reason.text));
      return ul;
    };

    // Complexity: where the points came from (the rows that are 0 are dimmed, with a hint), the level, and one thing to try.
    const table = make('table', 'score-table');
    for (const part of complexity.parts) {
      const row = make('tr', part.points === 0 ? 'score-zero' : '');
      row.dataset.part = part.id;
      const name = make('td', 'score-part');
      name.append(make('span', 'score-part-name', part.label));
      if (part.detail) name.append(make('span', 'score-part-detail', part.detail));
      row.append(name, make('td', 'score-points', part.points > 0 ? `+${part.points}` : '0'));
      table.append(row);
    }
    const complexityBody = [make('p', 'score-next', levelLine(complexity)), table, make('p', 'score-tip', complexity.tip)];
    const fine = make('p', 'score-fine', 'Worked out from the blocks on the page, here on this device. Nothing is saved or sent.');

    // On a wide window complexity (its points) is a column on the left, and elegance and efficiency, with their reasons, are one on the right.
    const left = make('div', 'score-col');
    left.append(section(METRICS[0], complexity.value, complexityBody));
    const right = make('div', 'score-col');
    right.append(section(METRICS[1], elegance.value, [reasons(elegance.reasons)]), section(METRICS[2], efficiency.value, [reasons(efficiency.reasons)]));
    const cols = make('div', 'score-cols');
    cols.append(left, right);
    this.panel.replaceChildren(head, cols, fine);
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
