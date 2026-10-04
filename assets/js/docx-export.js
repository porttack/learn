// "Download as Word (.docx)": converts the lesson exactly as it is showing
// (current generator set, ?player=, ?key=1) into a real Word document in the
// browser. Google Docs opens the same file (upload it to Drive), which is why
// this builds proper Word content with the `docx` library instead of the
// common shortcut of embedding HTML in a Word file (Word opens that; Google
// Docs doesn't).
//
// Text, headings, lists, tables, and code become editable Word content.
// Anything laid out with CSS flex/grid, inline SVG, and canvases (robot
// grids, dot cards, bit boxes, maps) becomes an image, since Word can't
// reproduce those layouts. Both libraries load from jsdelivr only when the
// button is clicked.
//
// Test hook: ?docx=selftest builds the file on load and writes it, base64,
// into <pre id="docx-selftest"> so a headless browser can read it back.

const DOCX_URL = "https://cdn.jsdelivr.net/npm/docx@9.8.1/+esm";
const IMG_URL = "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm";

// Screen-only controls and chrome that don't belong in the document.
const SKIP = [
  "script", "style", "noscript", "nav", "button", "form",
  ".pathway-back", ".lesson-nav", ".new-set-bar", ".player-switch",
  ".generator-bar", ".git-history", ".standards-alignment", ".copy-btn",
  ".suggest-links", ".key-link", ".activity-filters", ".teacher-box",
].join(",");

const MAX_W = 624; // 6.5in of usable width at 96 px per inch
const SCALE = 2; // render pictures at 2x so they print sharply

// Elements that start a new printed page. Read from the site's own print
// CSS (any rule with break-before: page) so the Word file breaks exactly
// where the printout does; the fallback list covers rules that can't be read.
const NEW_PAGE_FALLBACK = ".answer-key, .cutout-page, .vigenere-square-page";
let newPageSelectors = null;

function printBreakSelectors() {
  if (newPageSelectors) return newPageSelectors;
  const found = new Set(NEW_PAGE_FALLBACK.split(",").map((x) => x.trim()));
  const walk = (rules, inPrint) => {
    for (const r of rules) {
      if (r.media && r.cssRules) walk(r.cssRules, inPrint || /print/.test(r.media.mediaText));
      else if (r.selectorText && r.style) {
        const v = r.style.breakBefore || r.style.pageBreakBefore;
        if (v === "page" || v === "always") for (const sel of r.selectorText.split(",")) found.add(sel.trim());
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, false); } catch { /* cross-origin sheet */ }
  }
  newPageSelectors = [...found];
  return newPageSelectors;
}

function startsNewPage(el) {
  return printBreakSelectors().some((sel) => { try { return el.matches(sel); } catch { return false; } });
}

let D; // the docx module
let H; // html-to-image

// Every cell gets its own borders: Word, Pages, and Google Docs disagree on
// how table-level borders apply to inside lines, and Google Docs may drop them.
function cellBorders() {
  const b = { style: D.BorderStyle.SINGLE, size: 6, color: "555555" };
  return { top: b, bottom: b, left: b, right: b };
}

function pageBreak() {
  return new D.Paragraph({ children: [new D.PageBreak()] });
}

function hidden(el) {
  const cs = getComputedStyle(el);
  return cs.display === "none" || cs.visibility === "hidden" || el.hidden;
}

function isPicture(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === "svg" || tag === "canvas" || tag === "img") return true;
  const d = getComputedStyle(el).display;
  // A flex/grid layout is a drawn widget (dot cards, code rows, bit boxes).
  // Exceptions read better as text: wrappers holding headings/paragraphs/code,
  // and small text-only badges like a circled answer letter.
  if (!(d.includes("flex") || d.includes("grid"))) return false;
  if (tag === "ul" || tag === "ol" || tag === "li") return false; // lists convert to text/tables
  if (el.querySelector("h1,h2,h3,h4,p,ol,ul,table,pre,aside")) return false;
  if (!el.querySelector("svg,canvas,img") && el.children.length < 2) return false;
  return true;
}

async function toPng(el) {
  const tag = el.tagName.toLowerCase();
  const rect = el.getBoundingClientRect();
  let w = Math.max(1, rect.width);
  let h = Math.max(1, rect.height);
  let dataUrl;
  if (tag === "img") {
    await el.decode?.().catch(() => {});
    const c = document.createElement("canvas");
    const nw = el.naturalWidth || w;
    const nh = el.naturalHeight || h;
    c.width = nw;
    c.height = nh;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, nw, nh);
    g.drawImage(el, 0, 0, nw, nh);
    dataUrl = c.toDataURL("image/png");
  } else {
    dataUrl = await H.toPng(el, { pixelRatio: SCALE, backgroundColor: "#ffffff", cacheBust: false });
  }
  if (w > MAX_W) {
    h = (h * MAX_W) / w;
    w = MAX_W;
  }
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (ch) => ch.charCodeAt(0));
  return new D.ImageRun({ type: "png", data: bytes, transformation: { width: Math.round(w), height: Math.round(h) } });
}

// Inline content of one block -> array of runs.
async function runs(node, style = {}) {
  const out = [];
  for (const n of node.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent.replace(/\s+/g, " ");
      if (t) out.push(new D.TextRun({ text: t, ...style }));
      continue;
    }
    if (n.nodeType !== Node.ELEMENT_NODE || n.matches(SKIP) || hidden(n)) continue;
    const tag = n.tagName.toLowerCase();
    if (tag === "br") out.push(new D.TextRun({ break: 1 }));
    else if (n.classList.contains("choice-letter")) out.push(new D.TextRun({ text: n.textContent.trim() + ". ", bold: true, ...style }));
    else if (n.classList.contains("fill-line")) out.push(new D.TextRun({ text: "_______________", ...style }));
    else if (isPicture(n)) out.push(await toPng(n));
    else if (tag === "strong" || tag === "b") out.push(...(await runs(n, { ...style, bold: true })));
    else if (tag === "em" || tag === "i" || tag === "cite") out.push(...(await runs(n, { ...style, italics: true })));
    else if (tag === "code") out.push(new D.TextRun({ text: n.textContent, font: "Courier New", ...style }));
    else if (tag === "a" && n.href && !n.href.startsWith("javascript")) {
      out.push(new D.ExternalHyperlink({ link: n.href, children: [new D.TextRun({ text: n.textContent.replace(/\s+/g, " "), style: "Hyperlink", ...style })] }));
    } else out.push(...(await runs(n, style)));
  }
  return out;
}

const BLOCK = /^(p|h[1-6]|ul|ol|table|pre|figure|div|section|aside|footer|header|article|blockquote|hr|figcaption|details|summary|li)$/;

function isBlockEl(n) {
  const tag = n.tagName.toLowerCase();
  if (BLOCK.test(tag)) return true;
  const d = getComputedStyle(n).display;
  return isPicture(n) && d !== "inline" && d !== "inline-block";
}

// Does this element introduce something that should stay on its page
// (a picture, table, code block, or callout right after it)?
function introducesBlock(el) {
  let nx = el.nextElementSibling;
  while (nx && (hidden(nx) || nx.matches(SKIP))) nx = nx.nextElementSibling;
  if (!nx) return false;
  return isPicture(nx) || /^(table|pre|figure|aside|ol|ul)$/i.test(nx.tagName) || !!nx.querySelector?.("svg,table,pre,img");
}

// Runs for a list item's own text, leaving nested blocks for later.
async function ownRuns(li) {
  const out = [];
  for (const n of li.childNodes) {
    if (n.nodeType === Node.ELEMENT_NODE && isBlockEl(n) && n.tagName.toLowerCase() !== "p") continue;
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName.toLowerCase() === "p" && n.classList.contains("fill-line")) {
      out.push(new D.TextRun({ break: 1 }), new D.TextRun("______________________________________________"));
    } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName.toLowerCase() === "p") out.push(...(await runs(n)));
    else out.push(...(await runs({ childNodes: [n] })));
  }
  return out;
}

// Block content -> array of Paragraphs/Tables.
async function blocks(node) {
  const out = [];
  let inline = []; // loose text and inline elements between blocks
  const flush = async () => {
    if (!inline.length) return;
    const meaningful = inline.some((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
    const rs = meaningful ? await runs({ childNodes: inline }) : [];
    if (rs.length) out.push(new D.Paragraph({ children: rs }));
    inline = [];
  };

  for (const n of node.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) {
      inline.push(n);
      continue;
    }
    if (n.nodeType !== Node.ELEMENT_NODE || n.matches(SKIP) || hidden(n)) continue;
    if (!isBlockEl(n)) {
      inline.push(n);
      continue;
    }
    await flush();
    const tag = n.tagName.toLowerCase();
    if (out.length && startsNewPage(n)) out.push(pageBreak());

    if (isPicture(n)) {
      out.push(new D.Paragraph({ children: [await toPng(n)], alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 120 } }));
    } else if (/^h[1-6]$/.test(tag)) {
      const level = [D.HeadingLevel.HEADING_1, D.HeadingLevel.HEADING_2, D.HeadingLevel.HEADING_3, D.HeadingLevel.HEADING_4][Math.min(3, Number(tag[1]) - 1)];
      out.push(new D.Paragraph({ heading: level, keepNext: true, keepLines: true, children: await runs(n) }));
    } else if (n.classList.contains("activity-meta")) {
      const parts = [...n.children].filter((c) => !hidden(c)).map((c) => c.textContent.trim()).filter(Boolean);
      out.push(new D.Paragraph({ children: [new D.TextRun({ text: parts.join("  \u00b7  "), italics: true, color: "555555" })] }));
    } else if (tag === "p" || tag === "figcaption" || tag === "summary") {
      if (n.classList.contains("fill-line")) {
        out.push(new D.Paragraph({ children: [new D.TextRun("________________________________________________")] }));
      } else {
        const rs = await runs(n);
        if (rs.length) out.push(new D.Paragraph({ children: rs, keepNext: introducesBlock(n), ...(tag === "figcaption" ? { alignment: D.AlignmentType.CENTER } : {}) }));
      }
    } else if ((tag === "ul" || tag === "ol") && getComputedStyle(n).display.includes("grid")) {
      const items = [...n.children].filter((li) => li.tagName.toLowerCase() === "li" && !hidden(li));
      const cols = Math.max(1, Math.min(2, getComputedStyle(n).gridTemplateColumns.split(" ").filter(Boolean).length));
      const rows = [];
      for (let k = 0; k < items.length; k += cols) {
        const cells = [];
        for (let c = 0; c < cols; c++) {
          const li = items[k + c];
          const kids = li ? [new D.Paragraph({ children: await ownRuns(li) })] : [];
          if (li) for (const sub of li.children) if (isBlockEl(sub) && sub.tagName.toLowerCase() !== "p" && !hidden(sub)) kids.push(...(await blocks({ childNodes: [sub] })));
          cells.push(new D.TableCell({ borders: cellBorders(), children: kids.length ? kids : [new D.Paragraph("")], margins: { top: 80, bottom: 80, left: 100, right: 100 } }));
        }
        rows.push(new D.TableRow({ cantSplit: true, children: cells }));
      }
      out.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows }));
      out.push(new D.Paragraph(""));
    } else if (tag === "ul" || tag === "ol") {
      let i = Number(n.getAttribute("start") || 1);
      for (const li of n.children) {
        if (li.tagName.toLowerCase() !== "li" || hidden(li)) continue;
        // Lists styled with no markers (answer choices, card rows) get none.
        const shown = getComputedStyle(n).listStyleType !== "none";
        const marker = !shown ? "" : tag === "ol" ? `${i++}. ` : "\u2022 ";
        out.push(new D.Paragraph({ children: [new D.TextRun(marker), ...(await ownRuns(li))], indent: { left: 360, hanging: 260 } }));
        for (const sub of li.children) {
          if (isBlockEl(sub) && sub.tagName.toLowerCase() !== "p" && !hidden(sub) && !sub.matches(SKIP)) out.push(...(await blocks({ childNodes: [sub] })));
        }
      }
    } else if (tag === "pre") {
      const lines = n.textContent.replace(/\n$/, "").split("\n");
      out.push(new D.Paragraph({
        children: lines.map((l, k) => new D.TextRun({ text: l, font: "Courier New", size: 19, break: k ? 1 : 0 })),
        shading: { type: D.ShadingType.CLEAR, fill: "F4F5F6" },
      }));
    } else if (tag === "table") {
      out.push(await table(n));
      out.push(new D.Paragraph(""));
    } else if (tag === "hr") {
      out.push(new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: "999999" } } }));
    } else if (n.classList.contains("provenance")) {
      for (const pEl of n.querySelectorAll("p")) {
        out.push(new D.Paragraph({ spacing: { before: 0, after: 40, line: 240 }, children: await runs(pEl, { size: 16, color: "555555" }) }));
      }
    } else if (tag === "aside" || n.classList.contains("callout")) {
      // A callout box becomes one bordered cell.
      const inner = await blocks(n);
      out.push(new D.Table({
        width: { size: 100, type: D.WidthType.PERCENTAGE },
        rows: [new D.TableRow({ cantSplit: false, children: [new D.TableCell({ borders: cellBorders(), children: inner.length ? inner : [new D.Paragraph("")], margins: { top: 120, bottom: 120, left: 160, right: 160 } })] })],
      }));
      out.push(new D.Paragraph(""));
    } else {
      out.push(...(await blocks(n)));
    }
  }
  await flush();
  return out;
}

async function table(el) {
  const rows = [];
  for (const tr of el.querySelectorAll("tr")) {
    if (hidden(tr)) continue;
    const cells = [];
    for (const td of tr.children) {
      if (!/^(td|th)$/i.test(td.tagName) || hidden(td)) continue;
      const kids = await blocks(td);
      const isHead = td.tagName.toLowerCase() === "th";
      cells.push(new D.TableCell({
        borders: cellBorders(),
        verticalAlign: D.VerticalAlign.CENTER,
        columnSpan: td.colSpan > 1 ? td.colSpan : undefined,
        shading: isHead ? { type: D.ShadingType.CLEAR, fill: "EEEEEE" } : undefined,
        children: kids.length ? kids : [new D.Paragraph(" ")],
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      }));
    }
    if (cells.length) {
      const h = tr.getBoundingClientRect().height;
      // Screen rows carry extra padding; ~70% of it matches the printed sheet.
      rows.push(new D.TableRow({ children: cells, height: { value: Math.round(h * 10.5), rule: D.HeightRule.ATLEAST } }));
    }
  }
  // Keep narrow tables narrow: width as a share of the page's text column.
  const col = (el.closest("article") || document.body).getBoundingClientRect().width || 1;
  const pct = Math.max(20, Math.min(100, Math.round((el.getBoundingClientRect().width / col) * 100)));
  return new D.Table({ width: { size: pct, type: D.WidthType.PERCENTAGE }, rows: rows.length ? rows : [new D.TableRow({ children: [new D.TableCell({ children: [new D.Paragraph("")] })] })] });
}

async function build() {
  [D, H] = await Promise.all([import(DOCX_URL), import(IMG_URL)]);
  const article = document.querySelector("article.lesson") || document.querySelector("main");
  const children = [];
  // The print-only Name / Date / Period line (hidden on screen).
  if (document.querySelector(".name-line")) {
    children.push(new D.Paragraph({ children: [new D.TextRun("Name ______________________________   Date ____________   Period ______")] }));
    children.push(new D.Paragraph(""));
  }
  children.push(...(await blocks(article)));
  const doc = new D.Document({
    creator: "learn.porttack.com",
    title: document.title,
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 120, line: 276 } } },
        heading1: { run: { font: "Arial", size: 36, bold: true, color: "222222" }, paragraph: { spacing: { before: 120, after: 160 } } },
        heading2: { run: { font: "Arial", size: 28, bold: true, color: "222222" }, paragraph: { spacing: { before: 280, after: 120 } } },
        heading3: { run: { font: "Arial", size: 24, bold: true, color: "222222" }, paragraph: { spacing: { before: 220, after: 100 } } },
        heading4: { run: { font: "Arial", size: 22, bold: true, color: "222222" }, paragraph: { spacing: { before: 200, after: 80 } } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children }],
  });
  return D.Packer.toBlob(doc);
}

function fileName() {
  const slug = location.pathname.replace(/\/$/, "").split("/").pop() || "lesson";
  const seed = new URLSearchParams(location.search).get("seed");
  const player = new URLSearchParams(location.search).get("player");
  return `${slug}${seed ? "-set-" + seed : ""}${player ? "-player-" + player : ""}.docx`;
}

async function download(btn) {
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Making the Word file…";
  try {
    const blob = await build();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  } catch (err) {
    alert("Sorry, the Word file couldn't be made: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

for (const btn of document.querySelectorAll(".docx-button")) btn.addEventListener("click", () => download(btn));

if (new URLSearchParams(location.search).get("docx") === "selftest") {
  // Give generators a moment to draw before converting.
  setTimeout(async () => {
    const pre = document.createElement("pre");
    pre.id = "docx-selftest";
    try {
      const blob = await build();
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      pre.textContent = "OK:" + btoa(s);
    } catch (err) {
      pre.textContent = "ERR:" + err.stack;
    }
    document.body.appendChild(pre);
  }, 800);
}
