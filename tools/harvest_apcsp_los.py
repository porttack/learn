#!/usr/bin/env python3
"""ONE-TIME MIGRATION, already run 2026-08-28. Kept for reference/audit. Will
crash if run again (topics[].los is now a list of {code, text, eks} objects,
not bare code strings, so the "existing vs harvested" comparison below can't
compare them) -- that's deliberate, not a bug to fix; it stops a second run
from silently mangling already-harvested data instead of erroring.

One-time harvest: pull AP CSP learning-objective and essential-knowledge
paraphrases out of working-in-python's apcsp-standards-reference.html and fold
them into standards/apcsp.json's topics[].los, converting it from a flat list
of LO codes into a list of {code, text, eks: [{code, text}]} objects.

This text exists nowhere else -- it was written directly into that HTML page
and never folded back into the JSON. Must run before any generator touches
that page, or the LO/EK prose is lost.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_SRC = Path("/Users/ebrown/src/working-in-python/alignment/apcsp-standards-reference.html")
CATALOG = ROOT / "_standards" / "apcsp.json"

TOPIC_RE = re.compile(r'<div class="topic" id="T-([^"]+)">(.*?)(?=<div class="topic" id="T-|\Z)', re.S)
LO_RE = re.compile(
    r'<div class="lo" id="([^"]+)">\s*<h4>.*?<span class="lo-text">(.*?)</span></h4>\s*'
    r'<ul class="ek-list">(.*?)</ul></div>',
    re.S,
)
EK_RE = re.compile(r'<li id="([^"]+)">.*?<span class="code-badge">[^<]*</span>\s*(.*?)</li>', re.S)


def clean(text):
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def parse_html(path):
    src = path.read_text()
    by_topic = {}
    for code, block in TOPIC_RE.findall(src):
        los = []
        for lo_code, lo_text, ek_block in LO_RE.findall(block):
            eks = [{"code": ek_code, "text": clean(ek_text)} for ek_code, ek_text in EK_RE.findall(ek_block)]
            los.append({"code": lo_code, "text": clean(lo_text), "eks": eks})
        by_topic[code] = los
    return by_topic


def main():
    harvested = parse_html(HTML_SRC)
    catalog = json.loads(CATALOG.read_text())

    missing = []
    lo_total = ek_total = 0
    for topic in catalog["topics"]:
        code = topic["code"]
        existing_codes = topic.get("los", [])
        los = harvested.get(code)
        if los is None:
            missing.append(code)
            continue
        harvested_codes = {lo["code"] for lo in los}
        if set(existing_codes) != harvested_codes:
            print(f"WARNING {code}: JSON los {existing_codes} != HTML los {sorted(harvested_codes)}", file=sys.stderr)
        topic["los"] = los
        lo_total += len(los)
        ek_total += sum(len(lo["eks"]) for lo in los)

    if missing:
        print(f"ERROR: {len(missing)} topics had no matching HTML block: {missing}", file=sys.stderr)
        sys.exit(1)

    CATALOG.write_text(json.dumps(catalog, indent=1) + "\n")
    print(f"Harvested {lo_total} LOs, {ek_total} EKs across {len(catalog['topics'])} topics.")


if __name__ == "__main__":
    main()
