// Renders a Vigenere cipher puzzle (from vigenere-gen.js's generateSet)
// into the generator page's .puzzle-questions and .puzzle-key elements.
//
// Only the generator page uses this. The fixed worksheet
// (_unplugged/vigenere-cipher.md) is hand-written HTML/Markdown pulling
// straight from _data/unplugged/vigenere_fixed.yml, so a change here can
// never desync a class set that has already been printed.

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// Matches Liquid's `capitalize` filter, used on the fixed page: capitalize
// the first character, lowercase the rest, so an all-caps puzzle string
// reads back as an ordinary sentence.
const sentenceCase = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

function decodeBody(puzzle) {
  const q = `<p class="vigenere-set-key"><strong>Keyword: ${esc(puzzle.keyword)}</strong></p>
    <ol class="vigenere-messages">${puzzle.items
      .map((it) => `<li><code class="vigenere-text">${esc(it.cipher)}</code><p class="fill-line"></p></li>`)
      .join("")}</ol>`;
  const k = `<p class="vigenere-set-key"><strong>Keyword: ${esc(puzzle.keyword)}</strong></p>
    <ol class="vigenere-messages">${puzzle.items.map((it) => `<li>${esc(sentenceCase(it.plain))}</li>`).join("")}</ol>`;
  return { q, k };
}

function encodeBody(puzzle) {
  const q = `<p class="vigenere-set-key"><strong>Keyword: ${esc(puzzle.keyword)}</strong></p>
    <ol class="vigenere-messages">${puzzle.items
      .map((it) => `<li>${esc(sentenceCase(it.plain))}<p class="fill-line"></p></li>`)
      .join("")}</ol>`;
  const k = `<p class="vigenere-set-key"><strong>Keyword: ${esc(puzzle.keyword)}</strong></p>
    <ol class="vigenere-messages">${puzzle.items.map((it) => `<li><code class="vigenere-text">${esc(it.cipher)}</code></li>`).join("")}</ol>`;
  return { q, k };
}

export function renderPuzzle(puzzle, qRoot, keyRoot) {
  const body = puzzle.mode === "encode" ? encodeBody(puzzle) : decodeBody(puzzle);
  qRoot.innerHTML = body.q;
  if (keyRoot) keyRoot.innerHTML = `<h2>Check your answers</h2>${body.k}`;
}
