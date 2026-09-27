// Fixed pixel-pictures worksheet: each <script type="application/json"
// data-pixel-set> holds one frozen set's pictures (from
// _data/unplugged/pixel_pictures.yml), drawn into the .pixel-questions and
// the answer-key element named by its data-questions / data-key attributes.
import { parsePicture } from "./pixels.js";
import { renderSet } from "./pixel-render.js";

for (const script of document.querySelectorAll("script[data-pixel-set]")) {
  const data = JSON.parse(script.textContent);
  const pics = (data.pictures || []).map((p) => ({ ...parsePicture(p.art), name: p.name }));
  renderSet(pics, document.querySelector(script.dataset.questions), document.querySelector(script.dataset.key));
}
