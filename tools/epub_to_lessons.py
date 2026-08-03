#!/usr/bin/env python3
"""Convert spine sections of the Pico MicroPython book EPUB into lesson
markdown for the `rov` Jekyll collection.

The XHTML in this EPUB is well-formed XML, so this uses only
xml.etree.ElementTree from the standard library -- no BeautifulSoup needed.

Usage:
    python3 tools/epub_to_lessons.py source/rpi-pico-2e/book.epub \\
        --lesson 00-front-matter:Front matter:00,01,02,03,04 \\
        --lesson 01-get-to-know-your-pico:Get to know your Raspberry Pi Pico:05

Each --lesson is SLUG:TITLE:FILES, where FILES is a comma-separated list of
spine basenames (no extension) to concatenate, in order, into one lesson.
The leading digits of SLUG become the `order` front matter field, and the
output file is <outdir>/<SLUG>.md.

Re-running overwrites the lesson files and copied images, so this is safe
to run repeatedly as the source or the conversion rules change.
"""
import argparse
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

FIGURE_LABEL_RE = re.compile(r"Figure\s+(\d+)-(\d+)")
WS_RE = re.compile(r"\s+")


def collapse_ws(text):
    return WS_RE.sub(" ", text or "")


def strip_namespaces(el):
    for e in el.iter():
        if "}" in e.tag:
            e.tag = e.tag.split("}", 1)[1]
    return el


def find_opf_path(zf):
    container = ET.fromstring(zf.read("META-INF/container.xml"))
    strip_namespaces(container)
    rootfile = container.find(".//rootfile")
    return rootfile.get("full-path")


def load_manifest(zf):
    """Return (opf_dir, {basename_without_ext: zip_path_to_xhtml})."""
    opf_path = find_opf_path(zf)
    opf_dir = posixpath.dirname(opf_path)
    opf = ET.fromstring(zf.read(opf_path))
    strip_namespaces(opf)

    basenames = {}
    for item in opf.findall(".//manifest/item"):
        href = item.get("href")
        m = re.match(r"^text/(\w+)\.xhtml$", href)
        if m:
            basenames[m.group(1)] = posixpath.normpath(posixpath.join(opf_dir, href))
    return opf_dir, basenames


def resolve_image_path(xhtml_zip_path, src):
    return posixpath.normpath(posixpath.join(posixpath.dirname(xhtml_zip_path), src))


class Lesson:
    def __init__(self, slug, title, basenames):
        self.slug = slug
        self.title = title
        self.basenames = basenames
        self.order = int(re.match(r"^(\d+)", slug).group(1))


def parse_lesson_spec(spec):
    slug, title, files = spec.split(":", 2)
    return Lesson(slug, title, [f.strip() for f in files.split(",") if f.strip()])


# --- Pass 1: figure id map -------------------------------------------------

def figure_number(figcaption):
    label = figcaption.find("span")
    if label is None or label.get("class") != "figure-label":
        return None
    m = FIGURE_LABEL_RE.search(collapse_ws(label.text or ""))
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def collect_figure_ids(roots, lesson_order):
    """Map original figcaption id -> new `fig-N-M` id, for every captioned
    figure in the lesson (across all its source files)."""
    id_map = {}
    fallback_n = 0
    for root in roots:
        for el in root.iter("figure"):
            figcaption = el.find("figcaption")
            if figcaption is None:
                continue  # decorative chapter-opener figure, no caption
            orig_id = figcaption.get("id")
            num = figure_number(figcaption)
            if num:
                chapter, n = num
            else:
                fallback_n += 1
                chapter, n = lesson_order, fallback_n
            id_map[orig_id] = f"fig-{chapter}-{n}"
    return id_map


# --- Pass 2: rendering ------------------------------------------------------

class RenderContext:
    def __init__(self, id_map, zf, xhtml_zip_path, img_out_dir, img_url_prefix):
        self.id_map = id_map
        self.zf = zf
        self.xhtml_zip_path = xhtml_zip_path
        self.img_out_dir = img_out_dir
        self.img_url_prefix = img_url_prefix


def render_inline_children(el, ctx):
    parts = [collapse_ws(el.text or "")]
    for child in el:
        parts.append(render_inline(child, ctx))
        parts.append(collapse_ws(child.tail or ""))
    return collapse_ws("".join(parts))


def wrap_inline(el, ctx, marker):
    """Wrap el's rendered text in `marker` on both sides, without swallowing
    a boundary space that separates it from surrounding text (e.g. "custom
    " + em("integrated circuit") must stay "custom *integrated circuit*",
    not "custom*integrated circuit*")."""
    raw = render_inline_children(el, ctx)
    inner = raw.strip()
    if not inner:
        return raw
    leading = " " if raw[0] == " " else ""
    trailing = " " if raw[-1] == " " else ""
    return f"{leading}{marker}{inner}{marker}{trailing}"


def render_inline(el, ctx):
    tag = el.tag
    cls = el.get("class") or ""

    if tag == "br":
        return " "
    if tag == "sup":
        return f"<sup>{render_inline_children(el, ctx)}</sup>"
    if tag == "em":
        return wrap_inline(el, ctx, "*")
    if tag == "strong":
        return wrap_inline(el, ctx, "**")
    if tag == "code" or "rpi-inline-code" in cls or "rpi-filename" in cls:
        return wrap_inline(el, ctx, "`")
    if tag == "a":
        return render_link(el, ctx)
    if tag == "span":
        # rpi-tighten / rpi-loosen / rpi-keyphrase / rpi-callout-ref and any
        # other typographic span: no semantic markdown, just unwrap.
        return render_inline_children(el, ctx)

    return render_inline_children(el, ctx)


def render_link(el, ctx):
    cls = el.get("class") or ""
    text = render_inline_children(el, ctx).strip()
    href = el.get("href") or ""

    if "rpi-xref" in cls:
        frag = href.split("#", 1)[1] if "#" in href else None
        new_id = ctx.id_map.get(frag) if frag else None
        if new_id:
            return f"[{text}](#{new_id})"
        # Figure/chapter/appendix reference we haven't converted: keep the
        # visible text, drop the dead link.
        return text

    # External / plain link.
    return f"[{text}]({href})" if href else text


def render_listing_block(div, ctx):
    lines = [pre.text or "" for pre in div.findall("pre")]
    code = "\n".join(line.rstrip("\n") for line in lines)
    return f"```python\n{code}\n```"


def render_note_class(label_text):
    label = label_text.strip().upper()
    if label == "WARNING":
        return "warning"
    if label.startswith("CHALLENGE"):
        return "challenge"
    return "note"  # NOTE, FURTHER READING, and any custom titled box


def render_note(outer, ctx):
    # rpi-note-block or "rpi-note-block warning"; skip the rpi-note-icon div.
    block = None
    for div in outer:
        if (div.get("class") or "").startswith("rpi-note-block"):
            block = div
            break
    label_el = block.find("h5")
    label_text = collapse_ws((label_el.text or "")) if label_el is not None else "NOTE"
    css_class = render_note_class(label_text)

    body_parts = []
    for p in block.findall("p"):
        text = render_inline_children(p, ctx).strip()
        if text:
            body_parts.append(text)
    body = "\n\n".join(body_parts)

    return (
        f'<aside class="callout {css_class}" markdown="1">\n'
        f"**{label_text.strip()}**\n\n"
        f"{body}\n"
        f"</aside>"
    )


def render_figure(fig, ctx):
    figcaption = fig.find("figcaption")
    if figcaption is None:
        return None  # decorative opener, no caption -> skip

    orig_id = figcaption.get("id")
    new_id = ctx.id_map[orig_id]

    label = figcaption.find("span")
    caption_body = collapse_ws(label.tail or "").strip() if label is not None else ""
    num = figure_number(figcaption)
    if num:
        chapter, n = num
        caption = f"Figure {chapter}-{n}: {caption_body}"
    else:
        caption = caption_body

    img = fig.find(".//img")
    src = img.get("src")
    ext = posixpath.splitext(src)[1].lstrip(".")
    out_name = f"{new_id}.{ext}"

    img_zip_path = resolve_image_path(ctx.xhtml_zip_path, src)
    ctx.img_out_dir.mkdir(parents=True, exist_ok=True)
    (ctx.img_out_dir / out_name).write_bytes(ctx.zf.read(img_zip_path))

    img_url = f"{ctx.img_url_prefix}/{out_name}"
    return (
        f'<figure id="{new_id}">\n'
        f'  <img src="{{{{ \'{img_url}\' | relative_url }}}}" alt="{caption}">\n'
        f"  <figcaption>{caption}</figcaption>\n"
        f"</figure>"
    )


def render_list(list_el, ctx):
    ordered = list_el.tag == "ol"
    lines = []
    for i, li in enumerate(list_el.findall("li"), start=1):
        text_parts = [render_inline_children(p, ctx).strip() for p in li.findall("p")]
        text = " ".join(t for t in text_parts if t)
        marker = f"{i}." if ordered else "-"
        lines.append(f"{marker} {text}")
    return "\n".join(lines)


def render_table(table, ctx):
    rows = []
    for tr in table.iter("tr"):
        cells = [render_inline_children(td, ctx).strip() for td in list(tr)]
        rows.append(cells)
    if not rows:
        return ""
    header, *body = rows
    out = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * len(header)) + " |"]
    for row in body:
        out.append("| " + " | ".join(row) + " |")
    return "\n".join(out)


def render_section(section, ctx, blocks, heading_level, suppress_h1):
    for el in section:
        tag = el.tag
        cls = el.get("class") or ""

        if tag == "h1":
            if suppress_h1:
                continue
            blocks.append(f"## {render_inline_children(el, ctx).strip()}")
        elif tag == "h2":
            blocks.append(f"### {render_inline_children(el, ctx).strip()}")
        elif tag == "h3":
            blocks.append(f"#### {render_inline_children(el, ctx).strip()}")
        elif tag == "p":
            if "rpi-line-space" in cls or "rpi-chap-number" in cls:
                continue  # spacer / redundant "Chapter N" label
            text = render_inline_children(el, ctx).strip()
            if not text:
                continue
            if "rpi-subtitle" in cls:
                blocks.append(f"*{text}*")
            else:
                blocks.append(text)
        elif tag == "figure":
            rendered = render_figure(el, ctx)
            if rendered:
                blocks.append(rendered)
        elif tag == "div" and "rpi-listing-block" in cls:
            blocks.append(render_listing_block(el, ctx))
        elif tag == "div" and "rpi-note-outer" in cls:
            blocks.append(render_note(el, ctx))
        elif tag in ("ul", "ol"):
            blocks.append(render_list(el, ctx))
        elif tag == "table":
            rendered = render_table(el, ctx)
            if rendered:
                blocks.append(rendered)
        elif tag == "section":
            render_section(el, ctx, blocks, heading_level + 1, suppress_h1=False)
        # else: unhandled structural wrapper, nothing to emit at this level.


def render_document(root, ctx, suppress_h1, fallback_title):
    blocks = []
    section = root.find(".//section")
    children = list(section)
    has_leading_h1 = bool(children) and children[0].tag == "h1"
    if not has_leading_h1 and not suppress_h1:
        # File has no rpi-chap-title (e.g. the copyright page) -- use the
        # XHTML <title> so this section isn't unheaded in a multi-file lesson.
        blocks.append(f"## {fallback_title}")
    render_section(section, ctx, blocks, heading_level=1, suppress_h1=suppress_h1)
    return blocks


# --- Driver -----------------------------------------------------------------

def yaml_quote(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def build_lesson(zf, basename_to_path, lesson, out_dir, img_out_dir, img_url_prefix,
                  pathway, source_id):
    roots = []
    zip_paths = []
    fallback_titles = []
    for basename in lesson.basenames:
        zip_path = basename_to_path[basename]
        root = ET.fromstring(zf.read(zip_path))
        strip_namespaces(root)
        roots.append(root)
        zip_paths.append(zip_path)
        title_el = root.find(".//title")
        fallback_titles.append(collapse_ws(title_el.text or "").strip() if title_el is not None else "")

    id_map = collect_figure_ids(roots, lesson.order)
    suppress_h1 = len(roots) == 1  # single-file lesson: h1 duplicates page title

    all_blocks = []
    for root, zip_path, fallback_title in zip(roots, zip_paths, fallback_titles):
        ctx = RenderContext(id_map, zf, zip_path, img_out_dir, img_url_prefix)
        all_blocks.extend(render_document(root, ctx, suppress_h1, fallback_title))

    front_matter = (
        "---\n"
        "layout: lesson\n"
        f"title: {yaml_quote(lesson.title)}\n"
        f"pathway: {pathway}\n"
        f"order: {lesson.order}\n"
        f"source: {source_id}\n"
        "---\n"
    )

    out_path = out_dir / f"{lesson.slug}.md"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path.write_text(front_matter + "\n" + "\n\n".join(all_blocks) + "\n", encoding="utf-8")
    return out_path


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("epub_path")
    parser.add_argument("--lesson", action="append", required=True, dest="lessons",
                         help="SLUG:TITLE:FILES (repeatable)")
    parser.add_argument("--outdir", default="_rov")
    parser.add_argument("--imgdir", default="assets/img/rov")
    parser.add_argument("--pathway", default="rov")
    parser.add_argument("--source-id", default="rpi-pico-2e")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    out_dir = repo_root / args.outdir
    img_out_dir = repo_root / args.imgdir
    img_url_prefix = "/" + args.imgdir

    lessons = [parse_lesson_spec(spec) for spec in args.lessons]

    with zipfile.ZipFile(args.epub_path) as zf:
        _, basename_to_path = load_manifest(zf)
        for lesson in lessons:
            out_path = build_lesson(
                zf, basename_to_path, lesson, out_dir, img_out_dir, img_url_prefix,
                args.pathway, args.source_id,
            )
            try:
                display_path = out_path.relative_to(repo_root)
            except ValueError:
                display_path = out_path
            print(f"wrote {display_path}")


if __name__ == "__main__":
    sys.exit(main())
