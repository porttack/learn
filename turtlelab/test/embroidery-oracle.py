"""Checks TurtleLab's embroidery files against another program, for the tests. Not part of the app.

pyembroidery (https://github.com/EmbroidePy/pyembroidery, MIT licence) is an open source library that
reads and writes dozens of embroidery formats. It is NOT part of TurtleLab and is not needed to use it:
the tests that use it are skipped when it is not installed. To run them, make a folder with it in:

    python3 -m venv /some/folder && /some/folder/bin/pip install pyembroidery
    EMBROIDERY_PYTHON=/some/folder/bin/python3 node --test turtlelab/test/embroidery.test.js

It reads {"mode": ..., ...} from standard input and prints one line of JSON. The modes:
  write   given a plan ({name, threads, commands}, y UP, tenths of a millimeter), writes it as .dst and .pes
          with pyembroidery's own writers and says what it wrote (base64), so TurtleLab's bytes can be
          compared with them
  read    given .dst and .pes bytes (base64), reads them with pyembroidery and says what stitches it found
  png     given .pes or .dst bytes, draws them with pyembroidery to a picture file, to look at
"""
import base64, io, json, os, sys, tempfile

try:
    import pyembroidery
    from pyembroidery import EmbPattern, EmbThread
except ImportError:
    print(json.dumps({"missing": True}))
    sys.exit(0)

request = json.load(sys.stdin)
mode = request["mode"]

NAMES = {
    pyembroidery.STITCH: "stitch",
    pyembroidery.JUMP: "jump",
    pyembroidery.TRIM: "trim",
    pyembroidery.COLOR_CHANGE: "color",
    pyembroidery.END: "end",
}
COMMANDS = {name: code for code, name in NAMES.items()}


def pattern_from(plan):
    pattern = EmbPattern()
    pattern.metadata("name", plan.get("name", "TurtleLab"))
    for r, g, b in plan["threads"]:
        thread = EmbThread()
        thread.color = (r << 16) | (g << 8) | b
        pattern.add_thread(thread)
    for command in plan["commands"]:
        # pyembroidery counts y downwards, TurtleLab upwards.
        pattern.add_stitch_absolute(COMMANDS[command["cmd"]], command["x"], -command["y"])
    return pattern


def stitches_of(pattern):
    out = []
    for x, y, flags in pattern.stitches:
        out.append({"cmd": NAMES.get(flags & pyembroidery.COMMAND_MASK, "other"), "x": x, "y": -y})
    return out


def write_file(pattern, suffix):
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
        path = handle.name
    try:
        if suffix == ".dst":
            pyembroidery.write_dst(pattern, path)
        else:
            pyembroidery.write_pes(pattern, path)
        with open(path, "rb") as handle:
            return handle.read()
    finally:
        os.unlink(path)


def read_bytes(data, suffix):
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
        handle.write(data)
        path = handle.name
    try:
        return pyembroidery.read(path)
    finally:
        os.unlink(path)


if mode == "write":
    plan = request["plan"]
    dst = write_file(pattern_from(plan), ".dst")
    pes = write_file(pattern_from(plan), ".pes")
    print(json.dumps({"dst": base64.b64encode(dst).decode(), "pes": base64.b64encode(pes).decode()}))
elif mode == "read":
    out = {}
    for suffix in (".dst", ".pes"):
        key = suffix[1:]
        if key in request:
            pattern = read_bytes(base64.b64decode(request[key]), suffix)
            out[key] = {
                "stitches": stitches_of(pattern),
                "threads": [(t.color >> 16 & 255, t.color >> 8 & 255, t.color & 255) for t in pattern.threadlist],
            }
    print(json.dumps(out))
elif mode == "png":
    pattern = read_bytes(base64.b64decode(request["data"]), request["suffix"])
    pyembroidery.write_png(pattern, request["out"])
    print(json.dumps({"ok": True}))
