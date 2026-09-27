// Binary search tree core: build, validate, search-with-path, and layout.
//
// A node is a plain object { value, left, right }. Trees here are always
// built by repeated insert() calls (never hand-authored structures), so a
// frozen worksheet's tree and its answer key can never drift apart: both
// come from the same insertion list run through the same function.
//
// DOM-free on purpose: tools/check_bst.mjs imports this in Node to verify
// every printed tree, search path, and built tree.

export function insert(root, value) {
  if (!root) return { value, left: null, right: null };
  if (value < root.value) return { value: root.value, left: insert(root.left, value), right: root.right };
  if (value > root.value) return { value: root.value, left: root.left, right: insert(root.right, value) };
  return root; // duplicate value: every worksheet uses distinct numbers
}

export function insertAll(values) {
  let root = null;
  for (const v of values) root = insert(root, v);
  return root;
}

// Checks the BST rule holds everywhere: every value in a left subtree is
// smaller than its parent, every value in a right subtree is larger.
export function isValidBst(node, lo = -Infinity, hi = Infinity) {
  if (!node) return true;
  if (!(node.value > lo && node.value < hi)) return false;
  return isValidBst(node.left, lo, node.value) && isValidBst(node.right, node.value, hi);
}

// Follows the one rule from the root down. Returns:
//   found        true if target is a node in the tree
//   path         values visited in order, root first
//   comparisons  path.length (one comparison per node visited)
//   deadEnd      when not found: { after, dir } -- the last node checked,
//                and which side (with no branch there) target would need
export function searchPath(root, target) {
  const path = [];
  let node = root;
  while (node) {
    path.push(node.value);
    if (target === node.value) return { found: true, path, comparisons: path.length, deadEnd: null };
    const dir = target < node.value ? "left" : "right";
    const next = node[dir];
    if (!next) return { found: false, path, comparisons: path.length, deadEnd: { after: node.value, dir } };
    node = next;
  }
  // Empty tree.
  return { found: false, path, comparisons: 0, deadEnd: null };
}

export function height(node) {
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}

export function nodeCount(node) {
  if (!node) return 0;
  return 1 + nodeCount(node.left) + nodeCount(node.right);
}

export function isLeaf(node) {
  return !!node && !node.left && !node.right;
}

// True when every node has at most one child: the shape sorted-order
// insertion always produces, a long line instead of a bushy tree.
export function isChain(node) {
  if (!node) return true;
  if (node.left && node.right) return false;
  return isChain(node.left) && isChain(node.right);
}

export function inorderValues(node, out = []) {
  if (!node) return out;
  inorderValues(node.left, out);
  out.push(node.value);
  inorderValues(node.right, out);
  return out;
}

export function findNode(node, value) {
  if (!node) return null;
  if (node.value === value) return node;
  return findNode(value < node.value ? node.left : node.right, value);
}

// The first branch node (both children present) in an in-order walk, for
// the vocabulary demo -- picked by a rule, never hand-picked, so it can
// never point at the wrong node if the demo tree changes.
export function firstBranch(root) {
  const walk = (node) => {
    if (!node) return null;
    return walk(node.left) || (node.left && node.right ? node : null) || walk(node.right);
  };
  return walk(root);
}

export function firstLeaf(root) {
  const vals = inorderValues(root);
  for (const v of vals) if (isLeaf(findNode(root, v))) return v;
  return null;
}

// Linear search over a sorted list, scanning left to right the way a
// student reads a printed row of boxes. Comparisons to find target, or the
// full length if it never appears.
export function linearSearchCount(values, target) {
  for (let i = 0; i < values.length; i++) if (values[i] === target) return i + 1;
  return values.length;
}

// ---- Layout for SVG rendering ----------------------------------------------
//
// x = in-order rank (so left-to-right on paper reads smallest-to-largest,
// same as the tree rule promises); y = depth from the root. Returns a Map
// keyed by value (values are always distinct) plus the edge list and the
// overall grid size in cells, so a renderer can turn cells into pixels.
export function layout(root) {
  const positions = new Map();
  const edges = [];
  let i = 0;
  const walk = (node, depth) => {
    if (!node) return;
    walk(node.left, depth + 1);
    const x = i++;
    positions.set(node.value, { x, y: depth });
    walk(node.right, depth + 1);
    if (node.left) edges.push([node.value, node.left.value, "left"]);
    if (node.right) edges.push([node.value, node.right.value, "right"]);
  };
  walk(root, 0);
  return { positions, edges, cols: i, rows: height(root) };
}
