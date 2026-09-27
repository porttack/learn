import { mountGenerator } from "./generator-shell.js";
import { generateSet } from "./battleship-gen.js";
import { playerBoardsHtml } from "./battleship-render.js";
import { LEVELS, placeValues } from "./battleship.js";

const root = document.querySelector(".puzzle-generator");

function referenceCardHtml(level) {
  const L = LEVELS[level];
  if (L.hex) {
    const digits = Array.from({ length: 16 }, (_, i) => i);
    return `<h2>Reference</h2>
      <p>Every label on this board is a single hex digit, standing for a number from 0 to 15.</p>
      <table class="battleship-ref">
        <tr><th>Hex</th>${digits.map((n) => `<td>${n.toString(16).toUpperCase()}</td>`).join("")}</tr>
        <tr><th>Decimal</th>${digits.map((n) => `<td>${n}</td>`).join("")}</tr>
      </table>`;
  }
  const values = placeValues(level);
  return `<h2>Reference</h2>
    <p>Every label is a ${L.bits}-bit binary number. Add up the place value under every 1 digit to get its decimal row or column number.</p>
    <table class="battleship-ref">
      <tr><th>Place value</th>${values.map((v) => `<td>${v}</td>`).join("")}</tr>
    </table>`;
}

mountGenerator({
  root,
  options: [
    {
      name: "level",
      label: "Level",
      default: "easy",
      choices: Object.entries(LEVELS).map(([k, v]) => [k, v.label]),
    },
  ],
  render(rng, opts) {
    const set = generateSet(rng, opts.level);
    const qroot = root.querySelector(".puzzle-questions");
    qroot.innerHTML = ["A", "B"]
      .map(
        (p) => `<section class="battleship-player" data-player="${p}"><div class="name-line" aria-hidden="true"><span>Name <i></i></span><span>Date <i></i></span><span>Period <i></i></span></div>
          <h3>Player ${p}</h3>
          ${playerBoardsHtml(set.level, set.players[p].ships, `gen-${p}`)}
        </section>`,
      )
      .join("");
    const kroot = root.querySelector(".puzzle-key");
    if (kroot) kroot.innerHTML = referenceCardHtml(set.level);
  },
});
