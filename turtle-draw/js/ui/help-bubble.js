// Turtle Draw: the little help bubble.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// Press and hold a block (or right-click it) and a bubble appears with a
// one-line tip about what the block does. For blocks in the workspace the
// bubble also has a "Copy stack" button: that is how a touchscreen, which has
// no Shift key, makes a copy of a stack.
//
// Tapping anywhere else, or pressing Escape, closes it.

export class HelpBubble {
  /** @param {HTMLElement} stage the element the bubble floats inside */
  constructor(stage) {
    this.stage = stage;

    this.el = document.createElement('div');
    this.el.className = 'bubble';
    this.el.hidden = true;
    this.el.setAttribute('role', 'tooltip');

    this.text = document.createElement('p');
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.textContent = 'Copy stack';
    this.el.append(this.text, this.button);
    stage.append(this.el);

    this.onCopy = null;
    this.button.addEventListener('click', () => {
      const copy = this.onCopy;
      this.hide();
      if (copy) copy();
    });

    // Capture phase so it hears the tap even if something else handles it.
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!this.el.hidden && !this.el.contains(event.target)) this.hide();
      },
      true,
    );
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.hide();
    });
  }

  /**
   * Show a tip just below a block.
   * @param {object} options
   * @param {DOMRect} options.rect the block's place on the screen
   * @param {string} options.text the tip
   * @param {(() => void) | null} [options.onCopy] if given, show a Copy stack button
   */
  show({ rect, text, onCopy = null }) {
    this.text.textContent = text;
    this.button.hidden = onCopy === null;
    this.onCopy = onCopy;
    this.el.hidden = false;

    // Put it under the block, then slide it back if it hangs off the stage.
    const stageBox = this.stage.getBoundingClientRect();
    const width = this.el.offsetWidth;
    const height = this.el.offsetHeight;
    let left = rect.left - stageBox.left;
    let top = rect.bottom - stageBox.top + 8;
    if (left + width > stageBox.width - 8) left = stageBox.width - width - 8;
    if (top + height > stageBox.height - 8) top = rect.top - stageBox.top - height - 8;
    this.el.style.left = `${Math.max(8, left)}px`;
    this.el.style.top = `${Math.max(8, top)}px`;
  }

  hide() {
    this.el.hidden = true;
    this.onCopy = null;
  }

  get visible() {
    return !this.el.hidden;
  }
}
