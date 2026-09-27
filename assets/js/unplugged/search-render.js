// Draws a row of numbered search boxes as HTML. Mirrors the markup that
// _includes/unplugged/search-list.html renders with Liquid on the fixed
// worksheet, so a generated set looks exactly like the printed one.
// String-building only, no `document` calls.

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// mode: "mark" leaves a blank corner for the student to write the check
// order in. checks (used only then) is unused for "mark"; kept for parity
// with the Liquid include's "solved" mode, which this module doesn't need
// (the generator never shows a worked solution, only blank marking rows).
export function listHtml(list, { mode = "display" } = {}) {
  const cls = mode === "mark" ? " search-list-mark" : "";
  const boxes = list
    .map(
      (v, i) => `<div class="search-box">
        <span class="search-box-pos">${i + 1}</span>
        <span class="search-box-val">${esc(v)}</span>
        ${mode === "mark" ? '<span class="search-box-order"></span>' : ""}
      </div>`,
    )
    .join("");
  return `<div class="search-list${cls}">${boxes}</div>`;
}

// Same idea as the Liquid include's "dual" mode (_includes/unplugged/search-list.html,
// used by the fixed worksheet's answer key): one row of boxes, each marked
// with which check(s) it was -- "L2" for linear search's 2nd check, "B1" for
// binary search's 1st -- so both searches fit in a single compact row for
// an answer key. `linearChecked`/`binaryChecked` are 1-indexed positions, in
// check order (the shape linearSearch/binarySearch return as `.checked`).
export function dualListHtml(list, linearChecked, binaryChecked, { small = false } = {}) {
  const lOrder = new Map(linearChecked.map((pos, i) => [pos, i + 1]));
  const bOrder = new Map(binaryChecked.map((pos, i) => [pos, i + 1]));
  const cls = small ? " search-list-small" : "";
  const boxes = list
    .map((v, i) => {
      const pos = i + 1;
      const l = lOrder.get(pos);
      const b = bOrder.get(pos);
      const checked = l != null || b != null;
      return `<div class="search-box${checked ? " search-box-checked" : ""}">
        <span class="search-box-pos">${pos}</span>
        <span class="search-box-val">${esc(v)}</span>
        <span class="search-box-dual"><span class="search-box-dual-l">${l != null ? "L" + l : ""}</span><span class="search-box-dual-b">${b != null ? "B" + b : ""}</span></span>
      </div>`;
    })
    .join("");
  return `<div class="search-list search-list-dual${cls}">${boxes}</div>`;
}

// Answer key for one generated set: computed entirely from `set.linear` and
// `set.binary` (search-gen.js's own linearSearch/binarySearch results), so
// the key can never say anything the algorithms didn't actually do.
export function keyHtml(set) {
  const note =
    set.mode === "unsorted" && !set.binary.found
      ? `<p class="callout warning">The target really is in the list (found by linear search), but binary search's steps report "not found" anyway, because the list isn't sorted. That's the point of this mode.</p>`
      : !set.linear.found
        ? `<p class="search-key-note">Not in the list: both searches ran out of places to check.</p>`
        : "";
  return `
    <p class="search-target">Target: <strong>${esc(set.target)}</strong></p>
    ${dualListHtml(set.list, set.linear.checked, set.binary.checked, { small: true })}
    ${note}
    <p class="search-fill">Linear: <strong>${set.linear.count}</strong> checks. Binary: <strong>${set.binary.count}</strong> checks.</p>
  `;
}

// The full generated worksheet body: the list once for reference, then two
// marking rows (linear, then binary) for the one target, matching the fixed
// page's Target 1 layout.
export function setHtml(set) {
  const unsortedNote =
    set.mode === "unsorted"
      ? `<p class="callout warning">This list is <strong>not sorted</strong>. Try the binary search
         steps anyway (start in the middle, then go left or right). Watch what happens.</p>`
      : "";
  return `
    ${unsortedNote}
    <p class="search-target">Target: <strong>${esc(set.target)}</strong></p>
    <p class="search-list-label">The list:</p>
    ${listHtml(set.list, { mode: "display" })}
    <p class="search-list-label">Linear search: mark each box you check, in order.</p>
    ${listHtml(set.list, { mode: "mark" })}
    <p class="search-fill">Checks: <span class="fill-line short"></span></p>
    <p class="search-list-label">Binary search: start in the middle, then go left or right half.</p>
    ${listHtml(set.list, { mode: "mark" })}
    <p class="search-fill">Checks: <span class="fill-line short"></span></p>
  `;
}
