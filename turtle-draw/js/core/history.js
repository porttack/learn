// Turtle Draw: undo and redo.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// After every edit the editor hands the whole project to `record`, which
// keeps a copy as text. Undo and redo just hand an old copy back. Projects
// are small, so remembering whole copies is far simpler (and harder to get
// wrong) than remembering each kind of change and how to reverse it.

export class History {
  /**
   * @param {object} project the starting project
   * @param {number} [limit] how many steps back you can go
   */
  constructor(project, limit = 100) {
    this.limit = limit;
    this.snapshots = [JSON.stringify(project)];
    this.index = 0; // which snapshot is the current one
  }

  /**
   * Remember the project as it is now. Does nothing if it has not changed
   * (dropping a block onto the palette, for example, can end up exactly
   * where it started). Making a new change throws away any redo steps.
   * Returns true if something was recorded.
   */
  record(project) {
    const text = JSON.stringify(project);
    if (text === this.snapshots[this.index]) return false;
    this.snapshots.length = this.index + 1;
    this.snapshots.push(text);
    if (this.snapshots.length > this.limit + 1) this.snapshots.shift();
    this.index = this.snapshots.length - 1;
    return true;
  }

  get canUndo() {
    return this.index > 0;
  }

  get canRedo() {
    return this.index < this.snapshots.length - 1;
  }

  /** The project one step back, or null if there is nowhere to go. */
  undo() {
    if (!this.canUndo) return null;
    this.index -= 1;
    return JSON.parse(this.snapshots[this.index]);
  }

  /** The project one step forward, or null if there is nowhere to go. */
  redo() {
    if (!this.canRedo) return null;
    this.index += 1;
    return JSON.parse(this.snapshots[this.index]);
  }
}
