// TurtleLab: the color picker that opens from the color box on a set color or fill screen block.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A color is three numbers, and the block keeps its three numbers: this is only another way to set them. The panel shows the color three ways
// at once, so it can be used to explain how a computer keeps a color:
//
//   a picker       the browser's own color chooser (a color input), and a box for the whole color as hex, like #FF8000
//   for each of red, green and blue
//                  a slider, the number from 0 to 255, the same number in hex (2 digits) and in binary (8 bits)
//   all 24 bits    the three bytes one after another
//
// Every one of them can be typed into, and the others follow. Changing a color changes the block as you go (`onLive`), and everything you did
// while the picker was open is kept as ONE undo step when it closes (`onCommit`), so Undo puts back the color the block had before you opened it.
// Clicking anywhere else, Escape or Done closes it.
// It only changes the numbers in the block. Nothing is stored or sent.

import { channelBinary, channelHex, colorBits, parseBinary, parseChannelHex, parseHex, toHex, toHexUpper } from '../core/color.js';

const CHANNELS = ['red', 'green', 'blue'];

/** A binary number as two groups of four, the way it is easier to read: "1111 1111". */
const spaced = (bits) => `${bits.slice(0, 4)} ${bits.slice(4)}`;

/**
 * Open the picker.
 * @param {object} options
 * @param {HTMLElement} options.stage the element the picker floats inside
 * @param {DOMRect} options.anchor where the color box is on the screen (the picker opens just under it, or above if there is no room)
 * @param {number[]} options.color the color now: [red, green, blue], each 0 to 255
 * @param {string} [options.title] what it is for ("set color"), for people using a screen reader
 * @param {(color: number[]) => void} options.onLive called each time the color changes, so the block can show it
 * @param {(color: number[]) => void} options.onCommit called once, when it closes, if the color is not what it was when it opened
 * @param {() => void} [options.onClose] called when it closes
 * @returns {{ close: () => void, el: HTMLElement }}
 */
export function openColorPicker({ stage, anchor, color, title = 'color', onLive, onCommit, onClose = () => {} }) {
  let current = [...color];
  let committed = [...color];
  let closed = false;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const input = (className, attributes = {}) => {
    const node = make('input', className);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };

  const panel = make('div', 'color-picker');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', `Pick a color for ${title}`);

  // The top: the browser's color chooser, and the whole color as hex.
  const native = input('cp-native', { type: 'color', 'aria-label': 'Open the color chooser' });
  const hex = input('cp-hex', { type: 'text', maxlength: '7', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'The whole color as hex, like #FF8000' });
  const top = make('div', 'cp-top');
  const hexLabel = make('label', 'cp-hex-label');
  hexLabel.append(make('span', 'cp-caption', 'Hex'), hex);
  top.append(native, hexLabel);

  // One row for each of red, green and blue.
  const rows = CHANNELS.map((name, index) => {
    const row = make('div', `cp-row cp-${name}`);
    row.dataset.channel = name;
    const slider = input('cp-slider', { type: 'range', min: '0', max: '255', step: '1', 'aria-label': `${name} slider` });
    const number = input('cp-number', { type: 'number', min: '0', max: '255', step: '1', inputmode: 'numeric', 'aria-label': `${name} as a number from 0 to 255` });
    const hexPair = input('cp-chex', { type: 'text', maxlength: '2', spellcheck: 'false', autocomplete: 'off', 'aria-label': `${name} as 2 hex digits` });
    const bits = input('cp-bin', { type: 'text', maxlength: '9', spellcheck: 'false', autocomplete: 'off', inputmode: 'numeric', 'aria-label': `${name} as 8 binary digits` });
    row.append(make('span', 'cp-name', name), slider, number, hexPair, bits);
    return { index, row, slider, number, hexPair, bits };
  });
  const heads = make('div', 'cp-heads');
  heads.append(make('span', '', ''), make('span', '', ''), make('span', '', 'number'), make('span', '', 'hex'), make('span', '', 'binary'));
  heads.setAttribute('aria-hidden', 'true');

  const all = make('p', 'cp-bits');
  const note = make('p', 'cp-note', 'A color is three numbers from 0 to 255. Each one is one byte: 2 hex digits, or 8 bits of binary.');
  const done = make('button', 'cp-done', 'Done');
  done.type = 'button';
  panel.append(top, heads, ...rows.map((r) => r.row), all, note, done);

  /** Put the color into every control except `except` (the one being typed into, which keeps its own text until it is finished). */
  function show(except = null) {
    const put = (control, value) => {
      if (control !== except && control.value !== value) control.value = value;
    };
    put(native, toHex(current));
    put(hex, toHexUpper(current));
    rows.forEach(({ index, slider, number, hexPair, bits }) => {
      put(slider, String(current[index]));
      put(number, String(current[index]));
      put(hexPair, channelHex(current[index]));
      put(bits, spaced(channelBinary(current[index])));
    });
    all.textContent = `All 24 bits: ${colorBits(current)}`;
  }

  /** Make this the color. It shows in the block at once; it is kept (as one undo step) when the picker closes. `except` is the control being typed in. */
  function set(next, { except = null } = {}) {
    const changed = next.some((n, i) => n !== current[i]);
    current = next;
    show(except);
    if (changed) onLive([...current]);
  }

  /** Keep what was done as one change (if it is not the color the block had when the picker opened). */
  function keep() {
    if (current.every((n, i) => n === committed[i])) return;
    committed = [...current];
    onCommit([...current]);
  }

  /** One channel changed. */
  const setChannel = (index, value, options) => set(current.map((n, i) => (i === index ? value : n)), options);

  // ---- What each control does when it is typed in or moved ----------------------------------------------------
  native.addEventListener('input', () => set(parseHex(native.value) ?? current, { except: native }));
  native.addEventListener('change', () => set(parseHex(native.value) ?? current));

  hex.addEventListener('input', () => {
    const parsed = parseHex(hex.value);
    if (parsed) set(parsed, { except: hex });
  });
  hex.addEventListener('change', () => set(parseHex(hex.value) ?? current));

  for (const { index, slider, number, hexPair, bits } of rows) {
    slider.addEventListener('input', () => setChannel(index, Number(slider.value), { except: slider }));

    const whole = () => (/^\d{1,3}$/.test(number.value.trim()) && Number(number.value) <= 255 ? Number(number.value) : null);
    number.addEventListener('input', () => {
      const n = whole();
      if (n !== null) setChannel(index, n, { except: number });
    });
    number.addEventListener('change', () => setChannel(index, whole() ?? current[index]));

    hexPair.addEventListener('input', () => {
      const n = hexPair.value.trim().length === 2 ? parseChannelHex(hexPair.value) : null;
      if (n !== null) setChannel(index, n, { except: hexPair });
    });
    hexPair.addEventListener('change', () => setChannel(index, parseChannelHex(hexPair.value) ?? current[index]));

    bits.addEventListener('input', () => {
      const clean = bits.value.replace(/\s+/g, '');
      const n = clean.length === 8 ? parseBinary(clean) : null;
      if (n !== null) setChannel(index, n, { except: bits });
    });
    bits.addEventListener('change', () => setChannel(index, parseBinary(bits.value) ?? current[index]));
  }

  // ---- Showing it, and closing it ------------------------------------------------------------------------------
  function close() {
    if (closed) return;
    closed = true;
    keep();
    document.removeEventListener('pointerdown', away, true);
    document.removeEventListener('keydown', keys, true);
    document.removeEventListener('drop', close, true);
    panel.remove();
    onClose();
  }
  const away = (event) => {
    if (!panel.contains(event.target)) close();
  };
  const keys = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if ((event.ctrlKey || event.metaKey) && /^[zys]$/i.test(event.key)) {
      close(); // Undo, Redo and Save work on the blocks: keep this change first, then let the shortcut go on to do its job
    }
  };
  done.addEventListener('click', close);

  show();
  stage.append(panel);
  // Under the color box if there is room, otherwise above it, and if there is room for neither (a short window) as far up or down as it will go, so that
  // all of it, the Done button too, can be reached. Never off the sides of the window.
  const stageBox = stage.getBoundingClientRect();
  const room = stage.clientHeight - (anchor.bottom - stageBox.top) - 8;
  const above = panel.offsetHeight > room && anchor.top - stageBox.top > panel.offsetHeight;
  const wanted = above ? anchor.top - stageBox.top - panel.offsetHeight - 4 : anchor.bottom - stageBox.top + 4;
  panel.style.left = `${Math.max(4, Math.min(anchor.left - stageBox.left, stage.clientWidth - panel.offsetWidth - 4))}px`;
  panel.style.top = `${Math.max(4, Math.min(wanted, stage.clientHeight - panel.offsetHeight - 4))}px`;
  document.addEventListener('pointerdown', away, true);
  document.addEventListener('keydown', keys, true);
  document.addEventListener('drop', close, true); // a file dropped on the page opens another program: leave this one's block alone
  rows[0].number.focus();
  rows[0].number.select();
  return { close, el: panel };
}
