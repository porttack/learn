#!/usr/bin/env python3
"""Extract the nine circuit diagrams from the electronics101 source PDF into
`assets/img/electronics101/`.

Pages 3-11 of `circuit-diagrams.pdf` are presentation slides, and
`pdfimages -list` shows each one embeds exactly one full-page RGB JPEG -- so
this shells out to poppler's `pdfimages` and renames the output rather than
re-rendering anything, which keeps the extracted images bit-identical to what
is already in the PDF.

Usage:
    python3 tools/pdf_to_diagrams.py source/electronics101/circuit-diagrams.pdf

Re-running overwrites the images, so this is safe to run repeatedly if the
source PDF changes.
"""
import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

FIRST_DIAGRAM_PAGE = 3
LAST_DIAGRAM_PAGE = 11


def extract(pdf_path, imgdir):
    imgdir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            [
                "pdfimages",
                "-j",
                "-f", str(FIRST_DIAGRAM_PAGE),
                "-l", str(LAST_DIAGRAM_PAGE),
                str(pdf_path),
                f"{tmp}/page",
            ],
            check=True,
        )
        extracted = sorted(Path(tmp).glob("page-*.jpg"))
        if len(extracted) != (LAST_DIAGRAM_PAGE - FIRST_DIAGRAM_PAGE + 1):
            raise SystemExit(
                f"expected {LAST_DIAGRAM_PAGE - FIRST_DIAGRAM_PAGE + 1} images, "
                f"got {len(extracted)} -- check the PDF still has one image per page"
            )
        for i, src in enumerate(extracted, start=1):
            dest = imgdir / f"diagram-{i}.jpg"
            shutil.copyfile(src, dest)
            print(f"wrote {dest}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="path to circuit-diagrams.pdf")
    parser.add_argument(
        "--imgdir",
        type=Path,
        default=Path("assets/img/electronics101"),
        help="output directory for diagram-N.jpg files",
    )
    args = parser.parse_args()
    extract(args.pdf, args.imgdir)


if __name__ == "__main__":
    main()
