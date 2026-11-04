// A way to run JSLogo (the real Logo copy in ../../jslogo, written by Joshua Bell) from the tests, with no browser:
// its interpreter is loaded as it is, and given a turtle that only writes down what it is told to do.
// The tests use it to check that the Logo TurtleLab sends to JSLogo (core/logo.js with `jslogo: true`) draws what
// TurtleLab's own blocks draw. This file is not part of the app.

import vm from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';

const LOGO_JS = new URL('../../jslogo/logo.js', import.meta.url);

/** Is the copy of JSLogo there to test against? */
export const hasJsLogo = existsSync(LOGO_JS);

const round10 = (n) => Math.round(n * 1e10) / 1e10;

/**
 * Just enough turtle for the interpreter, and it records instead of drawing. y counts up and heading counts
 * clockwise from up, like the real one. Colors are whatever JSLogo hands it (a CSS color string).
 */
export class RecordingTurtle {
  constructor() {
    this.segments = []; // { x1, y1, x2, y2, color, width } for every line the pen drew since the last clear
    this.fills = []; // { color } for every filled shape
    this.labels = [];
    this.arcs = []; // the arc command itself, which TurtleLab's translation should not use
    this.x = 0;
    this.y = 0;
    this.headingDegrees = 0;
    this.pendown = true;
    this.penwidth = 1;
    this.color = 'black';
    this.background = '#ffffff';
    this.penmode = 'paint';
    this.visible = true;
    this.turtlemode = 'wrap';
    this.fontsize = 12;
    this.fontname = 'sans-serif';
    this.scrunch = [1, 1];
    this.bounds = [225, 125];
    this.pathStart = 0;
  }

  // Like the real turtle: setting the screen color paints the whole screen, so what was drawn is gone.
  get bgcolor() { return this.background; }
  set bgcolor(color) { this.background = color; this.clear(); }

  get position() { return [this.x, this.y]; }
  set position([x, y]) { this.#goto(x ?? this.x, y ?? this.y); }
  get heading() { return ((this.headingDegrees % 360) + 360) % 360; }
  set heading(degrees) { this.headingDegrees = degrees; }

  #goto(x, y) {
    if (this.pendown) this.segments.push({ x1: this.x, y1: this.y, x2: x, y2: y, color: this.color, width: this.penwidth });
    this.x = x;
    this.y = y;
  }

  move(distance) {
    const r = (this.headingDegrees * Math.PI) / 180;
    this.#goto(round10(this.x + distance * Math.sin(r)), round10(this.y + distance * Math.cos(r)));
  }

  turn(angle) { this.headingDegrees += angle; }
  home() { this.#goto(0, 0); this.headingDegrees = 0; }
  clear() { this.segments.length = 0; this.fills.length = 0; this.labels.length = 0; }
  clearscreen() { this.home(); this.clear(); }
  clearturtles() {}
  arc(angle, radius) { this.arcs.push({ angle, radius }); }
  beginpath() { this.pathStart = this.segments.length; }
  fillpath(color) { this.fills.push({ color, edges: this.segments.length - this.pathStart }); }
  fill() { this.fills.push({ color: this.color, flood: true }); }
  drawtext(text) { this.labels.push({ text, size: this.fontsize, x: this.x, y: this.y }); }
  towards(x, y) { return 90 - (Math.atan2(y - this.y, x - this.x) * 180) / Math.PI; }
  get turtles() { return []; }
  get currentturtle() { return 0; }
  set currentturtle(_) {}
  get mousepos() { return [0, 0]; }
  get clickpos() { return [0, 0]; }
  get button() { return 0; }
  touches() { return false; }
  copy() { return {}; }
  paste() {}
}

/** The interpreter's constructor, loaded fresh each time. */
function loadInterpreter() {
  const sandbox = {
    console,
    // The interpreter only waits (for `wait`, or to give the page a breath); here that takes no time.
    setTimeout: (f) => setTimeout(f, 0),
    clearTimeout,
    Date,
    Math,
    performance,
    self: null,
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${readFileSync(LOGO_JS, 'utf8')}\nthis.LogoInterpreter = LogoInterpreter;`, sandbox, { filename: 'jslogo/logo.js' });
  return sandbox.LogoInterpreter;
}

/**
 * Run Logo text in JSLogo. Resolves to { turtle, printed, error, logo }: what the turtle was told to do, what was
 * printed (a line each), and the error message if JSLogo complained (or null).
 */
export async function runJsLogo(code) {
  const LogoInterpreter = loadInterpreter();
  const turtle = new RecordingTurtle();
  let text = '';
  const stream = {
    write: (...args) => { text += args.join(''); },
    read: async () => '',
    clear: () => { text = ''; },
    readback: () => text,
    textsize: 12,
    font: 'sans-serif',
  };
  const logo = new LogoInterpreter(turtle, stream);
  let error = null;
  try {
    await logo.run(code);
  } catch (e) {
    error = e.message ?? String(e);
  }
  return { turtle, printed: text.split('\n').filter((line) => line !== ''), error, logo };
}

/** Every name JSLogo has as a built-in word (so a block of yours cannot be called that there). */
export function jsLogoPrimitives() {
  const LogoInterpreter = loadInterpreter();
  const logo = new LogoInterpreter(new RecordingTurtle(), { write() {}, read: async () => '', clear() {}, readback: () => '' });
  return [...logo.routines.keys()].map((name) => String(name).toLowerCase()).sort();
}
