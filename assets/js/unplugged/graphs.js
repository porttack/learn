// Shared graph algorithms and random-map builders for the three graph
// activities: Muddy City (minimum spanning trees), the Poor Cartographer
// (graph coloring), and Tourist Town (dominating sets).
//
// DOM-free on purpose: tools/check_graphs.mjs imports this in Node to
// verify every frozen worksheet and hundreds of generated maps against
// brute force, the same way tools/check_robot_sets.mjs checks robot.js.
//
// Graphs here are always plain arrays: `nodes.length` is the node count,
// node ids are array indices, and edges are `{ a, b, w }` (streets, `w` =
// paving stones) or `[a, b]` pairs (borders, no weight).

// ---- Union-find, used by Kruskal's algorithm and the connectivity check ----

class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  // Returns true if a and b were in different sets (and are now joined).
  union(a, b) {
    a = this.find(a);
    b = this.find(b);
    if (a === b) return false;
    if (this.rank[a] < this.rank[b]) [a, b] = [b, a];
    this.parent[b] = a;
    if (this.rank[a] === this.rank[b]) this.rank[a]++;
    return true;
  }
}

function edgePair(e) {
  return Array.isArray(e) ? e : [e.a, e.b];
}

export function isConnected(n, edges) {
  if (n <= 1) return true;
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    const [a, b] = edgePair(e);
    adj[a].push(b);
    adj[b].push(a);
  }
  const seen = new Array(n).fill(false);
  seen[0] = true;
  const stack = [0];
  while (stack.length) {
    const u = stack.pop();
    for (const v of adj[u]) if (!seen[v]) { seen[v] = true; stack.push(v); }
  }
  return seen.every(Boolean);
}

// ---- Minimum spanning tree (Muddy City) ---------------------------------

// Kruskal's algorithm: sort streets cheapest first, pave one whenever it
// joins two houses that aren't already connected by paved streets.
export function kruskalMST(n, edges) {
  const order = edges.map((e, i) => i).sort((i, j) => edges[i].w - edges[j].w);
  const uf = new UnionFind(n);
  const chosen = [];
  let total = 0;
  for (const i of order) {
    const e = edges[i];
    if (uf.union(e.a, e.b)) {
      chosen.push(i);
      total += e.w;
    }
  }
  return { chosen, total, spanning: chosen.length === n - 1 };
}

// Exhaustive check: try every subset of (n - 1) streets and keep the
// cheapest one that connects every house. Only sane for small graphs --
// callers keep generated towns small enough that this stays fast.
export function bruteForceMST(n, edges) {
  if (n <= 1) return { total: 0 };
  const need = n - 1;
  const m = edges.length;
  let best = Infinity;
  const combo = (start, picked, sum) => {
    if (picked.length === need) {
      const uf = new UnionFind(n);
      for (const i of picked) if (!uf.union(edges[i].a, edges[i].b)) return;
      if (sum < best) best = sum;
      return;
    }
    if (m - start < need - picked.length) return; // not enough left to fill
    for (let i = start; i < m; i++) {
      picked.push(i);
      combo(i + 1, picked, sum + edges[i].w);
      picked.pop();
    }
  };
  combo(0, [], 0);
  return { total: best };
}

// ---- Graph coloring (the Poor Cartographer) ------------------------------

// Backtracking search: is there a proper coloring of `nodes` with only `k`
// colors, given `edges` as border pairs? Returns the coloring (an array,
// one color index per node) or null.
export function existsColoring(n, edges, k) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    const [a, b] = edgePair(e);
    adj[a].push(b);
    adj[b].push(a);
  }
  // Coloring the most-connected countries first fails fast when k is too
  // small, instead of wandering through easy countries first.
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => adj[y].length - adj[x].length);
  const color = new Array(n).fill(-1);
  const assign = (idx) => {
    if (idx === n) return true;
    const node = order[idx];
    for (let c = 0; c < k; c++) {
      if (adj[node].every((nb) => color[nb] !== c)) {
        color[node] = c;
        if (assign(idx + 1)) return true;
        color[node] = -1;
      }
    }
    return false;
  };
  return assign(0) ? color.slice() : null;
}

// Smallest k for which a proper coloring exists, and one such coloring.
export function minColoring(n, edges) {
  for (let k = 1; k <= Math.max(1, n); k++) {
    const coloring = existsColoring(n, edges, k);
    if (coloring) return { k, coloring };
  }
  return { k: n, coloring: Array.from({ length: n }, (_, i) => i) };
}

export function isProperColoring(n, edges, coloring) {
  if (coloring.length !== n) return false;
  return edges.every((e) => {
    const [a, b] = edgePair(e);
    return coloring[a] !== coloring[b];
  });
}

// ---- Dominating sets (Tourist Town) ---------------------------------------

// Every subset of corners, smallest first, checked exhaustively: a set
// "dominates" the town if every corner either has a van or is one street
// from a corner that does. n is kept small enough (see the generators
// below) that this finishes quickly.
export function minDominatingSet(n, edges) {
  const closed = new Array(n).fill(0);
  for (let i = 0; i < n; i++) closed[i] |= (1 << i);
  for (const e of edges) {
    const [a, b] = edgePair(e);
    closed[a] |= (1 << b);
    closed[b] |= (1 << a);
  }
  const full = (1 << n) - 1;
  for (let size = 1; size <= n; size++) {
    const idx = Array.from({ length: size }, (_, i) => i);
    while (true) {
      let mask = 0;
      for (const i of idx) mask |= closed[i];
      if (mask === full) return { size, set: idx.slice() };
      let p = size - 1;
      while (p >= 0 && idx[p] === n - size + p) p--;
      if (p < 0) break;
      idx[p]++;
      for (let q = p + 1; q < size; q++) idx[q] = idx[q - 1] + 1;
    }
  }
  return { size: n, set: Array.from({ length: n }, (_, i) => i) };
}

export function isDominatingSet(n, edges, set) {
  const covered = new Set(set);
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    const [a, b] = edgePair(e);
    adj[a].push(b);
    adj[b].push(a);
  }
  for (let v = 0; v < n; v++) {
    if (covered.has(v)) continue;
    if (!adj[v].some((nb) => covered.has(nb))) return false;
  }
  return true;
}

// ---- Random "street grid" builder (Muddy City and Tourist Town) -----------
//
// Lays houses/corners out on a jittered grid so streets never cross on
// paper, picks a random spanning tree over the grid's own edges (so the
// town always starts connected), then adds back a few more streets so
// there's more than one way to connect things -- otherwise the "cheapest
// way to connect everyone" puzzle has only one possible answer.

export function buildGridGraph(rng, { n, cols, extraEdgeProb = 0.35, weightRange = null, spacing = 96, jitter = 0.26 }) {
  const rows = Math.ceil(n / cols);
  const idOf = new Map();
  const nodes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * cols + c >= n) continue;
      idOf.set(`${r},${c}`, nodes.length);
      const jx = (rng.next() * 2 - 1) * jitter * spacing;
      const jy = (rng.next() * 2 - 1) * jitter * spacing;
      nodes.push({ x: Math.round(c * spacing + spacing / 2 + jx), y: Math.round(r * spacing + spacing / 2 + jy), r, c });
    }
  }
  const allPairs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = idOf.get(`${r},${c}`);
      if (a === undefined) continue;
      const right = idOf.get(`${r},${c + 1}`);
      if (right !== undefined) allPairs.push([a, right]);
      const down = idOf.get(`${r + 1},${c}`);
      if (down !== undefined) allPairs.push([a, down]);
    }
  }

  // Randomized Prim's: grow a spanning tree one grid edge at a time.
  const visited = new Array(nodes.length).fill(false);
  visited[rng.int(0, nodes.length - 1)] = true;
  const treePairs = [];
  let visitedCount = 1;
  while (visitedCount < nodes.length) {
    const frontier = allPairs.filter(([a, b]) => visited[a] !== visited[b]);
    if (!frontier.length) break; // grid is connected, shouldn't happen
    const [a, b] = rng.pick(frontier);
    treePairs.push([a, b]);
    visited[a] = true;
    visited[b] = true;
    visitedCount++;
  }
  const treeKeys = new Set(treePairs.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
  const extraPairs = allPairs.filter(([a, b]) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    return !treeKeys.has(key) && rng.chance(extraEdgeProb);
  });

  const pairs = [...treePairs, ...extraPairs];
  const edges = weightRange
    ? pairs.map(([a, b]) => ({ a, b, w: rng.int(weightRange[0], weightRange[1]) }))
    : pairs.map(([a, b]) => ({ a, b }));
  return { nodes, edges, width: cols * spacing, height: rows * spacing };
}

// ---- Random rectangular "country map" builder (the Poor Cartographer) ----
//
// Recursive guillotine cuts: start with one big rectangle and keep
// splitting the largest few pieces until there are `count` countries. Two
// countries border each other only if they share an edge of positive
// length -- meeting at a single corner point doesn't count, matching the
// book's own rule for the map-coloring problem.

export function subdivideRect(rng, rect, count, minSize = 46) {
  let leaves = [{ ...rect }];
  let guard = 0;
  while (leaves.length < count && guard < count * 30) {
    guard++;
    leaves.sort((a, b) => b.w * b.h - a.w * a.h);
    const splittable = leaves.filter((r) => r.w >= minSize * 2 || r.h >= minSize * 2);
    if (!splittable.length) break;
    const target = rng.pick(splittable.slice(0, Math.min(3, splittable.length)));
    const idx = leaves.indexOf(target);
    const canH = target.w >= minSize * 2;
    const canV = target.h >= minSize * 2;
    const horizontal = canH && canV ? rng.chance(0.5) : canH;
    if (horizontal) {
      const cut = rng.int(minSize, target.w - minSize);
      leaves.splice(idx, 1,
        { x: target.x, y: target.y, w: cut, h: target.h },
        { x: target.x + cut, y: target.y, w: target.w - cut, h: target.h });
    } else {
      const cut = rng.int(minSize, target.h - minSize);
      leaves.splice(idx, 1,
        { x: target.x, y: target.y, w: target.w, h: cut },
        { x: target.x, y: target.y + cut, w: target.w, h: target.h - cut });
    }
  }
  return leaves;
}

export function rectAdjacencyEdges(rects) {
  const edges = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const vertTouch = (a.x + a.w === b.x || b.x + b.w === a.x) && yOverlap > 0;
      const horizTouch = (a.y + a.h === b.y || b.y + b.h === a.y) && xOverlap > 0;
      if (vertTouch || horizTouch) edges.push([i, j]);
    }
  }
  return edges;
}

export const LETTERS = "ABCDEFGHIJKLMNOPQRST".split("");
