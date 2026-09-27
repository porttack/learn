// Fixed binary search tree worksheets. Each page embeds one JSON script
// tag naming the mount points it fills; the tag's own data-* attributes
// say which element gets which piece, so one script serves every page in
// the family without page-specific branching creeping into this file.
import {
  renderVocab, renderExample, renderPracticeQuestions, renderPracticeKey,
  renderHiddenPlayer, renderHiddenKey, renderBuildTemplates, renderBuildKey,
} from "./bst-view.js";

const $ = (sel) => (sel ? document.querySelector(sel) : null);

for (const script of document.querySelectorAll("script[data-bst-search]")) {
  const data = JSON.parse(script.textContent);
  const vocabEl = $(script.dataset.vocab);
  const exampleEl = $(script.dataset.example);
  const qEl = $(script.dataset.questions);
  const keyEl = $(script.dataset.key);
  if (vocabEl) renderVocab(data.vocab.values, vocabEl);
  if (exampleEl) renderExample(data.example.values, data.example.target, exampleEl);
  if (qEl) renderPracticeQuestions(data.practice.values, data.practice.targets, qEl);
  if (keyEl) renderPracticeKey(data.practice.values, data.practice.targets, keyEl);
}

for (const script of document.querySelectorAll("script[data-bst-hidden]")) {
  const pair = JSON.parse(script.textContent);
  const aEl = $(script.dataset.boardA);
  const bEl = $(script.dataset.boardB);
  const keyEl = $(script.dataset.key);
  if (aEl) renderHiddenPlayer(pair, "A", aEl);
  if (bEl) renderHiddenPlayer(pair, "B", bEl);
  if (keyEl) renderHiddenKey(pair, keyEl);
}

for (const script of document.querySelectorAll("script[data-bst-build]")) {
  const data = JSON.parse(script.textContent);
  const qEl = $(script.dataset.questions);
  const keyEl = $(script.dataset.key);
  if (qEl) renderBuildTemplates(data.values, data.sorted, qEl);
  if (keyEl) renderBuildKey(data.values, data.sorted, keyEl);
}
