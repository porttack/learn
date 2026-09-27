// Builds the HTML for every binary search tree widget: the vocabulary
// figure, the worked example, the practice questions and their hidden
// answer key, the hidden-number pair game, and the build-a-tree templates.
// Shared by the fixed pages (bst-page.js) and the generator
// (bst-generator.js), the same way robot-render.js serves both robot pages.

import {
  insertAll, searchPath, linearSearchCount, inorderValues, firstBranch, firstLeaf,
} from "./bst.js";
import { treeSvg } from "./bst-render.js";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// A plain-English narration of a search, one clause per node checked, for
// the worked example. "smaller"/"bigger" always describes the target
// compared to the node just checked, matching the one rule the page teaches.
function describeSteps(path, target) {
  const clauses = path.map((v, i) => {
    if (v === target) return `${v} matches`;
    const dir = target < v ? "smaller, so go left" : "bigger, so go right";
    return `${i === 0 ? "Root is" : "Next is"} ${v}: target is ${dir}`;
  });
  return clauses.join(". ") + ".";
}

// ---- Vocabulary figure -----------------------------------------------------

export function renderVocab(values, mount) {
  const root = insertAll(values);
  const branch = firstBranch(root);
  const leaf = firstLeaf(root);
  // No caption: the prose right after this figure already says the same
  // thing, and repeating it just to unblank a leaf-shaped figcaption would
  // burn page space this one-page worksheet can't spare.
  mount.innerHTML = treeSvg(root, {
    vocab: { root: root.value, branch: branch ? branch.value : null, leaf },
    compact: true,
  });
}

// ---- Worked example (shown solved, not an exercise) ------------------------

export function renderExample(values, target, mount) {
  const root = insertAll(values);
  const res = searchPath(root, target);
  const svg = treeSvg(root, { path: res.path, found: res.found, deadEnd: res.deadEnd, compact: true });
  const note = res.found
    ? `${describeSteps(res.path, target)} Found ${target} after ${plural(res.comparisons, "comparison")}.`
    : `${target} is not in this tree.`;
  mount.innerHTML = `${svg}<p class="bst-example-note">${esc(note)}</p>`;
}

// ---- Practice: trace searches, plus the linear-search comparison ----------

export function renderPracticeQuestions(values, targets, mount) {
  const root = insertAll(values);
  const sorted = inorderValues(root);
  mount.innerHTML = `
    <div class="bst-tree-wrap">${treeSvg(root, { compact: true })}</div>
    <p class="bst-sorted-label">The same numbers, in a plain sorted list (for the last column below):</p>
    <div class="bst-sorted-list">${sorted.map((v) => `<span class="bst-sorted-box">${esc(v)}</span>`).join("")}</div>
    <table class="bst-target-table">
      <colgroup>
        <col style="width: 12%"><col><col style="width: 19%"><col style="width: 19%">
      </colgroup>
      <thead>
        <tr><th>Target</th><th>Path from the root (write each number you check, in order)</th><th>Tree comparisons</th><th>Linear-list checks</th></tr>
      </thead>
      <tbody>
        ${targets.map((t) => `<tr><td class="bst-target-value">${esc(t)}</td><td></td><td></td><td></td></tr>`).join("")}
      </tbody>
    </table>`;
}

export function renderPracticeKey(values, targets, mount) {
  const root = insertAll(values);
  const sorted = inorderValues(root);
  mount.innerHTML = targets
    .map((t) => {
      const res = searchPath(root, t);
      const lin = linearSearchCount(sorted, t);
      const svg = treeSvg(root, { path: res.path, found: res.found, deadEnd: res.deadEnd, compact: true });
      const note = res.found
        ? `Found after ${plural(res.comparisons, "comparison")}: ${res.path.join(" → ")}.`
        : `Not in the tree. Checking ${res.path.join(" → ")} runs out of tree to the ${res.deadEnd.dir} of ${res.deadEnd.after}, so ${res.comparisons} comparisons is enough to be sure it's missing.`;
      return `<div class="bst-key-item">
        <p><strong>Target ${esc(t)}.</strong> ${esc(note)}</p>
        <p>Tree comparisons: <strong>${res.comparisons}</strong>. Linear-list checks: <strong>${lin}</strong>.</p>
        ${svg}
      </div>`;
    })
    .join("");
}

// ---- Hidden-number pair game ------------------------------------------------

// pair = { tree1: { values, target }, tree2: { values, target } }
export function renderHiddenPlayer(pair, side, mount) {
  const t1 = insertAll(pair.tree1.values);
  const t2 = insertAll(pair.tree2.values);
  const yourTurn = (label, tree, target) => `
    <div class="bst-hidden-round">
      <h3>${label}: you're hunting</h3>
      <p>Your target: <strong>${esc(target)}</strong>. Point at the root and ask
      its number, then follow the rule (left if smaller, right if larger)
      down the tree until you find it.</p>
      ${treeSvg(tree, { blank: true })}
      <p>Reveals it took: <span class="fill-line short"></span></p>
    </div>`;
  const yourTree = (label, tree) => `
    <div class="bst-hidden-round">
      <h3>${label}: your tree</h3>
      <p>Your partner is hunting here. When they point at a circle, read
      them its number. Don't say anything else.</p>
      ${treeSvg(tree, {})}
    </div>`;
  const rounds =
    side === "A"
      ? yourTree("Round 1", t1) + yourTurn("Round 2", t2, pair.tree2.target)
      : yourTurn("Round 1", t1, pair.tree1.target) + yourTree("Round 2", t2);
  // Side by side, not stacked: two rounds' worth of writable-size trees
  // stacked vertically would spill onto a second page, and the page's
  // width has plenty of room going spare either way.
  mount.innerHTML = `<div class="bst-hidden-rounds">${rounds}</div>`;
}

export function renderHiddenKey(pair, mount) {
  const t1 = insertAll(pair.tree1.values);
  const t2 = insertAll(pair.tree2.values);
  const best = (tree, target) => searchPath(tree, target).comparisons;
  mount.innerHTML = `
    <p>Fewest possible reveals, if you follow the rule every time: Round 1
    target ${esc(pair.tree1.target)} takes <strong>${best(t1, pair.tree1.target)}</strong>;
    Round 2 target ${esc(pair.tree2.target)} takes <strong>${best(t2, pair.tree2.target)}</strong>.
    More than that means a wrong turn happened somewhere, not that anything's
    broken; look at the tree shape below to see the fastest route.</p>
    <div class="bst-key-item">${treeSvg(t1, { path: searchPath(t1, pair.tree1.target).path, found: true })}</div>
    <div class="bst-key-item">${treeSvg(t2, { path: searchPath(t2, pair.tree2.target).path, found: true })}</div>`;
}

// ---- Build-a-tree -----------------------------------------------------------

export function renderBuildTemplates(values, sorted, mount) {
  const bushy = insertAll(values);
  const chain = insertAll(sorted);
  mount.innerHTML = `
    <div class="bst-build-step">
      <p class="bst-build-label">Insert these numbers, one at a time, in this
      order: <strong>${values.join(", ")}</strong>. For each one, start at the
      root and follow the rule down until you reach an empty circle, then
      write the number there.</p>
      ${treeSvg(bushy, { blank: true })}
    </div>
    <div class="bst-build-step">
      <p class="bst-build-label">Now insert the same numbers again, but in
      this order: <strong>${sorted.join(", ")}</strong>.</p>
      ${treeSvg(chain, { blank: true })}
    </div>`;
}

export function renderBuildKey(values, sorted, mount) {
  const bushy = insertAll(values);
  const chain = insertAll(sorted);
  mount.innerHTML = `
    <div class="bst-key-item">
      <p>Inserted in the given order:</p>
      ${treeSvg(bushy, {})}
    </div>
    <div class="bst-key-item">
      <p>Inserted in sorted order. Every number is bigger than every number
      already placed, so each one becomes the new rightmost node instead of
      splitting the tree in half:</p>
      ${treeSvg(chain, {})}
    </div>`;
}
