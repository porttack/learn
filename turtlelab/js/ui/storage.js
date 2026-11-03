// TurtleLab: autosave, so a page refresh does not lose your blocks.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A copy of the current project is kept in the browser's own local storage,
// under one name. It lives on this device only and is never sent anywhere.
// It is plain text (the same project JSON as a saved picture holds). When
// the project is empty nothing is kept at all.
//
// Storage can be missing or full (a private window, blocked site data), so
// every use is wrapped: if it fails, TurtleLab simply carries on without
// autosave.

import { validateProject } from '../core/project.js';

/** The one name this app stores anything under. The privacy page names it too. */
export const AUTOSAVE_KEY = 'turtlelab-project';

/** The saved project from last time, or null if there is none or it is no good. */
export function loadAutosave() {
  try {
    const text = localStorage.getItem(AUTOSAVE_KEY);
    if (!text) return null;
    const checked = validateProject(JSON.parse(text));
    return checked.ok ? checked.project : null;
  } catch {
    return null;
  }
}

export class Autosave {
  /**
   * @param {object} project the project to keep a copy of (read when saving)
   * @param {number} [delay] how long to wait after the last change, in milliseconds
   */
  constructor(project, delay = 400) {
    this.project = project;
    this.delay = delay;
    this.timer = null;
    // Save at once if the page is being closed or hidden, before the wait is over.
    addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  /** Something changed: save soon. Many quick changes make just one save. */
  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delay);
  }

  /** Save now. An empty project removes the saved copy instead. */
  flush() {
    clearTimeout(this.timer);
    this.timer = null;
    try {
      if (this.project.stacks.length === 0) localStorage.removeItem(AUTOSAVE_KEY);
      else localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(this.project));
    } catch {
      // No storage, or it is full: carry on without autosave.
    }
  }
}
