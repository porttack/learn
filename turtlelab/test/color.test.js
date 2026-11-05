// Tests for js/core/color.js: colors as three numbers, and as hex and binary for the color picker.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampChannel, makeColor, toCss, toHex, toHexUpper, channelHex, channelBinary, colorBits, parseHex, parseChannelHex, parseBinary, colorOfArgs,
} from '../js/core/color.js';

test('the plain helpers: clamping and rounding a number into 0 to 255, css and lowercase hex', () => {
  assert.equal(clampChannel(300), 255);
  assert.equal(clampChannel(-5), 0);
  assert.equal(clampChannel(12.5), 13);
  assert.equal(clampChannel('x'), 0);
  assert.deepEqual(makeColor(256, -1, 127.4), [255, 0, 127]);
  assert.equal(toCss([1, 2, 3]), 'rgb(1, 2, 3)');
  assert.equal(toHex([255, 128, 0]), '#ff8000');
});

test('hex in capitals, for one number and for a whole color, with a leading zero when it needs one', () => {
  assert.equal(toHexUpper([255, 128, 0]), '#FF8000');
  assert.equal(toHexUpper([0, 0, 0]), '#000000');
  assert.equal(toHexUpper([5, 10, 15]), '#050A0F');
  assert.equal(channelHex(255), 'FF');
  assert.equal(channelHex(5), '05');
  assert.equal(channelHex(0), '00');
  assert.equal(channelHex(300), 'FF', 'out of range is pulled back first');
  assert.equal(channelHex(171), 'AB');
});

test('binary: always eight digits, so a number reads the same way as the byte it is', () => {
  assert.equal(channelBinary(0), '00000000');
  assert.equal(channelBinary(1), '00000001');
  assert.equal(channelBinary(5), '00000101');
  assert.equal(channelBinary(128), '10000000');
  assert.equal(channelBinary(255), '11111111');
  assert.equal(channelBinary(-3), '00000000');
  assert.equal(colorBits([255, 128, 0]), '11111111 10000000 00000000');
  assert.equal(colorBits([1, 2, 3]), '00000001 00000010 00000011');
});

test('every number from 0 to 255 goes round: number to binary and back, number to hex and back', () => {
  for (let n = 0; n <= 255; n += 1) {
    assert.equal(parseBinary(channelBinary(n)), n, `binary ${n}`);
    assert.equal(parseChannelHex(channelHex(n)), n, `hex ${n}`);
    assert.equal(channelHex(n).length, 2);
    assert.equal(channelBinary(n).length, 8);
  }
  // And a whole color round trips through its hex.
  for (const color of [[0, 0, 0], [255, 255, 255], [255, 128, 7], [18, 52, 86], [171, 205, 239]]) assert.deepEqual(parseHex(toHexUpper(color)), color);
});

test('typed hex is read the way people write it: with or without #, any case, spaces, or three digits', () => {
  assert.deepEqual(parseHex('#ff8000'), [255, 128, 0]);
  assert.deepEqual(parseHex('FF8000'), [255, 128, 0]);
  assert.deepEqual(parseHex('  #Ff8000  '), [255, 128, 0]);
  assert.deepEqual(parseHex('#f80'), [255, 136, 0], 'three digits are each doubled');
  assert.deepEqual(parseHex('f80'), [255, 136, 0]);
  for (const bad of ['', '#', '#ff80', '#ff80000', '#gg0000', '12345', 'red', null, undefined, '#ff 80 00', '##ff8000']) assert.equal(parseHex(bad), null, String(bad));
});

test('one typed hex number or binary number: short ones are fine, anything else is not a number yet', () => {
  assert.equal(parseChannelHex('f'), 15);
  assert.equal(parseChannelHex('Ff'), 255);
  assert.equal(parseChannelHex(' 0A '), 10);
  for (const bad of ['', 'fff', 'g', '1 2', '-1', '0x1']) assert.equal(parseChannelHex(bad), null, bad);
  assert.equal(parseBinary('101'), 5);
  assert.equal(parseBinary('1111 1111'), 255);
  assert.equal(parseBinary('0000 0001'), 1);
  assert.equal(parseBinary(' 1 '), 1);
  for (const bad of ['', '2', '123', '111111111', '1.0', 'b101']) assert.equal(parseBinary(bad), null, bad);
});

test('the color of a block\'s three sockets: plain numbers are pulled into range, an empty socket is its default, and another block in a socket means no single color', () => {
  assert.deepEqual(colorOfArgs([255, 0, 128], [0, 0, 0]), [255, 0, 128]);
  assert.deepEqual(colorOfArgs([300, -5, 12.6]), [255, 0, 13]);
  assert.deepEqual(colorOfArgs([null, undefined, 7], [10, 20, 30]), [10, 20, 7]);
  assert.deepEqual(colorOfArgs(undefined, [255, 0, 0]), [255, 0, 0]);
  assert.deepEqual(colorOfArgs([], [1, 2, 3]), [1, 2, 3]);
  assert.equal(colorOfArgs([255, { op: 'random', args: [0, 255] }, 0]), null);
  assert.equal(colorOfArgs([{ op: 'box1', args: [] }, 0, 0]), null);
});
