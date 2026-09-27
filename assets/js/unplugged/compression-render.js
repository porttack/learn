// DOM rendering for text-compression puzzles: turns a {tokens, boxContent}
// result from compression.js into the printed poem, with numbered boxes
// standing in for repeated words the student fills back in.
import { decode } from "./compression.js";

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

export function renderPuzzle(container, result) {
  container.innerHTML = "";
  const wrap = el("div", "compress-poem");
  let line = el("p", "compress-line");
  wrap.appendChild(line);

  result.tokens.forEach((t) => {
    if (t.type === "break") {
      line = el("p", "compress-line");
      wrap.appendChild(line);
      return;
    }
    if (line.childNodes.length) line.appendChild(document.createTextNode(" "));
    if (t.type === "word") {
      if (t.defines) line.appendChild(el("span", "compress-badge", String(t.defines)));
      line.appendChild(document.createTextNode(t.text));
      return;
    }
    // ptr: a box the student fills back in from memory of the box's
    // earlier, still-visible words.
    const box = el("span", "compress-box");
    box.appendChild(el("span", "compress-badge", String(t.box)));
    box.appendChild(el("span", "fill-line short"));
    line.appendChild(box);
  });
  container.appendChild(wrap);
}

// The key is just the fully spelled out poem -- reading it back and
// recognizing the rhyme IS the check.
export function renderKey(container, result) {
  container.innerHTML = "";
  const wrap = el("div", "compress-poem");
  decode(result)
    .split("\n")
    .forEach((text) => wrap.appendChild(el("p", "compress-line", text)));
  container.appendChild(wrap);
}
