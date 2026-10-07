#!/usr/bin/env python3
"""Regenerate assets/data/emoji-list.json from the `emoji` PyPI package.

The carpedm20.github.io/emoji reference list is blocked by the school
firewall, so the emojize pset (_cs50psets/emojize.md) hosts its own copy of
the name/alias -> emoji table, built from the same package students
`pip install emoji` to do the assignment.

Usage:
    pip install emoji
    python3 tools/generate_emoji_list.py

Re-run this after bumping the `emoji` version mentioned in emojize.md, since
a new release can add, rename, or drop codes.
"""

import json
from pathlib import Path

import emoji

OUT_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "emoji-list.json"


def main():
    entries = []
    for char, info in emoji.EMOJI_DATA.items():
        name = info.get("en")
        if not name:
            continue
        entries.append({
            "emoji": char,
            "name": name.strip(":"),
            "aliases": [a.strip(":") for a in info.get("alias", [])],
        })

    entries.sort(key=lambda e: e["name"])

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump({"emoji_version": emoji.__version__, "entries": entries}, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {len(entries)} entries (emoji {emoji.__version__}) to {OUT_PATH}")


if __name__ == "__main__":
    main()
