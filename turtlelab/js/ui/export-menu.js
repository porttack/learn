// TurtleLab: the list of other ways to save, shown when you right-click the Save button.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// The Save button itself still saves a picture with your blocks inside, with one click. This menu is for
// the other kinds of file: a JPEG, an SVG, a file for an embroidery machine... It opens
//   * on a right-click (or the menu key on a keyboard),
//   * or when you press and hold the button (a touchscreen has no right button).
// Choosing a line saves that kind of file. Escape, or clicking anywhere else, closes it.

const HOLD_MS = 500;
const HOLD_SLOP = 8;

export class ExportMenu {
  /**
   * @param {object} options
   * @param {HTMLElement} options.button the Save button
   * @param {{id: string, label: string, hint: string}[]} options.items what can be saved
   * @param {(id: string) => void} options.onPick called with the id of the line that was chosen
   */
  constructor({ button, items, onPick }) {
    this.button = button;
    this.onPick = onPick;
    this.swallowClick = false;

    this.menu = document.createElement('div');
    this.menu.className = 'export-menu';
    this.menu.setAttribute('role', 'menu');
    this.menu.setAttribute('aria-label', 'Ways to save');
    this.menu.hidden = true;
    for (const item of items) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'export-item';
      row.setAttribute('role', 'menuitem');
      row.dataset.format = item.id;
      const label = document.createElement('span');
      label.className = 'export-label';
      label.textContent = item.label;
      const hint = document.createElement('span');
      hint.className = 'export-hint';
      hint.textContent = item.hint;
      row.append(label, hint);
      row.addEventListener('click', () => {
        this.close();
        this.onPick(item.id);
      });
      this.menu.append(row);
    }
    document.body.append(this.menu);

    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.open();
    });

    // Press and hold, for a touchscreen.
    let timer = null;
    let start = null;
    const cancel = () => {
      clearTimeout(timer);
      timer = null;
    };
    button.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY };
      cancel();
      timer = setTimeout(() => {
        timer = null;
        this.swallowClick = true; // the press that opened the menu must not also press the button
        this.open();
      }, HOLD_MS);
    });
    button.addEventListener('pointermove', (event) => {
      if (timer && start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > HOLD_SLOP) cancel();
    });
    for (const name of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(name, cancel);
    // In the capture phase, so this runs before the button's own click handler and can stop it.
    button.addEventListener('click', (event) => {
      if (!this.swallowClick) return;
      this.swallowClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener('pointerdown', (event) => {
      if (!this.menu.hidden && !this.menu.contains(event.target) && event.target !== button) this.close();
    });
    this.menu.addEventListener('keydown', (event) => this.keyInMenu(event));
    window.addEventListener('blur', () => this.close());
    window.addEventListener('resize', () => this.close());
  }

  get isOpen() {
    return !this.menu.hidden;
  }

  open() {
    this.menu.hidden = false;
    const box = this.button.getBoundingClientRect();
    const width = this.menu.offsetWidth;
    const height = this.menu.offsetHeight;
    // Just under the button, kept inside the window.
    const left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(box.bottom + 4, window.innerHeight - height - 8));
    this.menu.style.left = `${left}px`;
    this.menu.style.top = `${top}px`;
    this.menu.querySelector('.export-item')?.focus();
  }

  close() {
    if (this.menu.hidden) return;
    this.menu.hidden = true;
  }

  keyInMenu(event) {
    const rows = [...this.menu.querySelectorAll('.export-item')];
    const at = rows.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.button.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      rows[(at + 1) % rows.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      rows[(at - 1 + rows.length) % rows.length].focus();
    }
  }
}
