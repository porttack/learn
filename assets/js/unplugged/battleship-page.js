// Fixed Binary Battleship worksheets: each <script type="application/json"
// data-battleship-set> holds one frozen set (from _data/unplugged/), drawn
// into the two player mount points named by its data-a / data-b attributes.
import { playerBoardsHtml } from "./battleship-render.js";

for (const script of document.querySelectorAll("script[data-battleship-set]")) {
  const data = JSON.parse(script.textContent);
  const mounts = { a: script.dataset.a, b: script.dataset.b };
  for (const [p, sel] of Object.entries(mounts)) {
    const root = document.querySelector(sel);
    if (!root) continue;
    const letter = p.toUpperCase();
    root.innerHTML = playerBoardsHtml(data.level, data.players[letter].ships, `f-${letter}`);
  }
}
