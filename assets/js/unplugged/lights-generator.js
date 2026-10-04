// "Message in lights: make a new set" (Count the Dots). Decode: a joke's
// setup in words and its punchline in lights, one row per letter. Encode: a
// word to turn into lights. Mixed symbols give every row its own pair and
// key, like the book's coded numbers.
import { mountGenerator } from "./generator-shell.js";
import { THEMES, PLACES, encodeMessage } from "./lights.js";

const bank = JSON.parse(document.getElementById("lights-bank").textContent);
const root = document.querySelector(".puzzle-generator");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const header = `<th>${PLACES.join(" &nbsp; ")}</th>`;

// "random": one surprise pair for the whole set.
const resolveTheme = (rng, themeKey) => (themeKey === "random" ? rng.pick(Object.keys(THEMES)) : themeKey);

function decodeHtml(rng, themeKey) {
  themeKey = resolveTheme(rng, themeKey);
  const joke = rng.pick(bank.jokes);
  const rows = encodeMessage(joke.punchline);
  const mixed = themeKey === "mixed";
  const keys = Object.keys(THEMES);
  const trs = rows
    .map((r) => {
      if (r === null) return `<tr class="lights-space"><td colspan="${mixed ? 4 : 3}"><em>(space)</em></td></tr>`;
      const t = THEMES[mixed ? rng.pick(keys) : themeKey];
      const lights = r.bits.map((b) => (b ? t.on : t.off)).join(" ");
      return `<tr><td class="lights-cell">${lights}</td>${mixed ? `<td class="lights-key">${t.on}=1 ${t.off}=0</td>` : ""}<td></td><td></td></tr>`;
    });
  // One table, shrunk to fit one printed page: full size up to 9 rows,
  // then smaller as the message gets longer.
  const scale = Math.min(1, 9 / trs.length);
  const head = `<thead><tr>${header}${mixed ? "<th>Key</th>" : ""}<th>Number</th><th>Letter</th></tr></thead>`;
  const tables = `<table class="checkoff lights-table" style="zoom: ${scale.toFixed(2)}">${head}<tbody>${trs.join("")}</tbody></table>`;
  const legend = mixed ? "Each row has its own key." : `${THEMES[themeKey].on} = 1 (on) and ${THEMES[themeKey].off} = 0 (off).`;
  const html = `<p class="lights-setup"><strong>${esc(joke.setup)}</strong></p>
    <p>The answer is in lights. ${legend} Use the code <strong>1 = a, 2 = b, 3 = c, &hellip;, 26 = z</strong>.</p>
    ${tables}
    <p>Answer: <span class="fill-line"></span></p>`;
  const key = `<p><strong>${esc(joke.setup)}</strong> ${esc(joke.punchline)}</p>
    <p class="lights-key-nums">${rows.map((r) => (r === null ? "/" : r.n)).join(" ")}</p>`;
  return { html, key };
}

function encodeHtml(rng, themeKey) {
  themeKey = resolveTheme(rng, themeKey);
  const word = rng.pick(bank.words);
  const t = THEMES[themeKey === "mixed" ? "lights" : themeKey];
  const rows = encodeMessage(word);
  const body = rows
    .map((r) => `<tr><td class="lights-letter">${r === null ? "(space)" : r.ch}</td>${PLACES.map(() => "<td class=\"lights-box\"></td>").join("")}</tr>`)
    .join("");
  const html = `<p>Turn this word into lights: <strong>${esc(word)}</strong>. For each letter, find its number
    (1 = a, 2 = b, &hellip;, 26 = z), then draw <strong>${t.on}</strong> under each place you need and
    <strong>${t.off}</strong> under the rest.</p>
    <table class="checkoff lights-encode"><thead><tr><th>Letter</th>${PLACES.map((p) => `<th>${p}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
  const key = `<p><strong>${esc(word)}</strong>: ${rows.map((r) => (r === null ? "/" : `${r.ch} = ${r.n} = ${r.bits.map((b) => (b ? t.on : t.off)).join("")}`)).join(", ")}</p>`;
  return { html, key };
}

mountGenerator({
  root,
  options: [
    { name: "theme", label: "Symbols", default: "lights", choices: [["random", "Random (a surprise pair)"], ...Object.entries(THEMES).map(([k, v]) => [k, v.label]), ["mixed", "Mixed (a new pair every row)"]] },
    { name: "direction", label: "Direction", default: "decode", choices: [["decode", "Decode a message"], ["encode", "Encode a word"]] },
  ],
  render(rng, opts) {
    const out = opts.direction === "encode" ? encodeHtml(rng, opts.theme) : decodeHtml(rng, opts.theme);
    root.querySelector(".puzzle-questions").innerHTML = out.html;
    root.querySelector(".puzzle-key").innerHTML = `<h2>Answer key</h2>${out.key}`;
  },
});
