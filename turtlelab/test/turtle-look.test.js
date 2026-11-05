// Tests for js/ui/turtle-look.js: the turtle's shell takes the pen's color.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spriteSvg, shellColors } from '../js/ui/turtle-look.js';
import { turtleSvg } from '../js/ui/artwork.js';

test('the sprite is the same picture with the shell, its markings and the waving flipper named, so the stylesheet can color and move them', () => {
  const plain = turtleSvg();
  const sprite = spriteSvg();
  assert.equal(sprite.match(/class="shell"/g).length, 1, 'one shell');
  assert.equal(sprite.match(/class="scutes"/g).length, 1, 'one set of markings');
  assert.equal(sprite.match(/class="wave-flipper"/g).length, 1, 'one flipper that waves');
  assert.match(sprite.match(/<path class="wave-flipper"[^>]*>/)[0], /d="M 40\.16 11\.726/, 'the front one on the turtle\'s right');
  // Nothing else changed: take the three names out and it is the plain picture, exactly.
  assert.equal(sprite.replace(' class="shell"', '').replace(' class="scutes"', '').replace(' class="wave-flipper"', ''), plain);
  // The shell is the big oval (its own path), and the markings are the five dark shapes on it.
  const shell = sprite.match(/<path class="shell"[^>]*>/)[0];
  assert.match(shell, /d="M 43\.102 30\.421/);
  const scutes = sprite.slice(sprite.indexOf('<g class="scutes">'));
  assert.equal(scutes.slice(0, scutes.indexOf('</g>')).match(/<path /g).length, 5);
});

test('the shell is the pen color, written the way CSS wants it', () => {
  assert.equal(shellColors([255, 0, 0]).shell, '#ff0000');
  assert.equal(shellColors([20, 70, 170]).shell, '#1446aa');
  assert.equal(shellColors([0, 0, 0]).shell, '#000000');
  assert.equal(shellColors([255, 255, 255]).shell, '#ffffff');
});

test('the markings are always a different shade of the shell, darker on a light pen and lighter on a dark one, so they always show', () => {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const colors = [[255, 0, 0], [20, 70, 170], [0, 0, 0], [255, 255, 255], [255, 255, 0], [0, 255, 0], [128, 128, 128], [200, 40, 90], [10, 10, 10]];
  for (const pen of colors) {
    const { shell, scute } = shellColors(pen);
    assert.match(scute, /^#[0-9a-f]{6}$/);
    assert.ok(Math.abs(lum(shell) - lum(scute)) > 0.15, `${pen}: shell ${shell}, markings ${scute}`);
  }
  assert.ok(lum(shellColors([255, 255, 0]).scute) < lum('#ffff00'), 'a light pen gets darker markings');
  assert.ok(lum(shellColors([0, 0, 0]).scute) > 0.2, 'a black pen gets lighter ones');
});
