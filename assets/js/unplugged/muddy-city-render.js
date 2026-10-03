// Draws Muddy City maps (fixed or generated) and their hidden answer keys.
//
// Houses are always lettered (never numbered, so a house label is never
// confused with a road's paving-stone count). Roads draw as stepping
// stones by default (a map's own `stones` field, frozen for fixed towns or
// set by the generator's "Roads" option); `stones: false` falls back to a
// number on each road.
import { kruskalMST, LETTERS } from "./graphs.js";
import { streetGraphSvg, esc } from "./graphs-render.js";

function roadStyle(map) {
  return map.stones !== false;
}

function figure(map, chosen, { caption = true } = {}) {
  const svg = streetGraphSvg(map.nodes, map.edges, {
    width: map.width,
    height: map.height,
    weighted: true,
    houses: true,
    labels: "letters",
    stones: roadStyle(map),
    chosen,
  });
  return `<figure class="graphs-fig">${svg}${caption && map.label ? `<figcaption>${esc(map.label)}</figcaption>` : ""}</figure>`;
}

// "A-C, C-E, ..." -- the same best set of roads the shading on the map
// shows, spelled out so a substitute teacher can check a student's answer
// without having to compare shading by eye.
function pavedRoadsList(map, chosen) {
  return chosen
    .map((i) => {
      const e = map.edges[i];
      return `${LETTERS[e.a] || e.a}-${LETTERS[e.b] || e.b}`;
    })
    .join(", ");
}

export function renderQuestions(maps, root) {
  if (!root) return;
  root.innerHTML = maps.map((m) => figure(m, null)).join("");
}

export function renderKey(maps, root) {
  if (!root) return;
  root.innerHTML =
    `<h2>Check your answers</h2>
     <p class="graphs-key-intro">The shaded roads are the cheapest way to connect every house.</p>` +
    maps
      .map((m) => {
        const { chosen, total } = kruskalMST(m.nodes.length, m.edges);
        return `<div class="graphs-key-item">${figure(m, new Set(chosen))}<p><strong>${total} paving stones.</strong> One best set of roads: ${esc(pavedRoadsList(m, chosen))}.</p></div>`;
      })
      .join("");
}

// ---- "Invent your own strategy" town sets (the generator, and the main
// sheet's early-finisher towns) ---------------------------------------------
//
// A town can be drawn once (just solve it) or "doubled": the same blank
// map twice, side by side, so a student tries one strategy, then a
// different one, and compares.

function attemptBlock(map, n, tryLabels) {
  return `<div class="muddy-attempt">
    <p class="muddy-attempt-label">Try ${n}: ${esc(tryLabels[n - 1])}</p>
    ${figure(map, null, { caption: false })}
    <p>My strategy: <span class="fill-line"></span></p>
    <p>Stones used: <span class="fill-line short"></span></p>
  </div>`;
}

function closingQuestions() {
  return `<div class="muddy-town-questions">
    <p>Which try used fewer stones? <span class="fill-line short"></span></p>
    <p>Describe your best strategy in one sentence.</p>
    <p class="fill-line"></p>
    <p>Do you think your strategy always finds the fewest stones? Why?</p>
    <p class="fill-line"></p>
  </div>`;
}

// towns: [{ ...map, label, double, note }]. `tryLabels` names the two
// attempts ("your first idea" / "a different strategy" on the generator,
// "your own idea" / "a different idea" on the early-finisher sheet).
export function renderTownSet(towns, root, { tryLabels = ["your first idea", "a different strategy"] } = {}) {
  if (!root) return;
  root.innerHTML = towns
    .map((t) => {
      if (t.double) {
        return `<div class="muddy-town">
          <p class="muddy-town-label">${esc(t.label || "")}</p>
          <div class="muddy-attempts">
            ${attemptBlock(t, 1, tryLabels)}
            ${attemptBlock(t, 2, tryLabels)}
          </div>
          ${closingQuestions()}
        </div>`;
      }
      return `<div class="muddy-town muddy-town-single">
        <p class="muddy-town-label">${esc(t.label || "")}</p>
        ${figure(t, null, { caption: false })}
        <p>Stones used: <span class="fill-line short"></span></p>
        ${t.note ? `<p class="muddy-town-note">${esc(t.note)}</p><p class="fill-line"></p>` : ""}
      </div>`;
    })
    .join("");
}

export function renderTownSetKey(towns, root) {
  if (!root) return;
  root.innerHTML = towns
    .map((t) => {
      const { chosen, total } = kruskalMST(t.nodes.length, t.edges);
      return `<div class="graphs-key-item">
        ${figure(t, new Set(chosen))}
        <p><strong>${total} paving stones.</strong> One best set of roads: ${esc(pavedRoadsList(t, chosen))}.</p>
        ${t.note ? `<p><strong>${esc(t.note)}</strong> ${esc(t.answer || "")}</p>` : ""}
      </div>`;
    })
    .join("");
}
