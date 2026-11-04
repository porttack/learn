"""Runs the Python that TurtleLab writes, for the tests. Not part of the app.

It reads {"source": "...", "mode": "check" | "names" | "run"} from standard input.
  check  only compiles the source, to prove it is valid Python.
  names  lists the names the program uses without defining them (the turtle functions,
         the builtins) and the module functions it calls (random.randint, ...), so a
         test can check them against what EduBlocks' Python (Skulpt) really provides.
  run    runs it against a stand-in for Python's turtle module and prints where the
         turtle ended up, how far it drew, and what was printed.

The stand-in follows the real module's rules (heading 0 is east and turns counter
clockwise, and circle() uses the same steps as the real one), but draws nothing. Like
Skulpt it has no top-level colormode: that is only on Screen(), so a program that calls
a bare colormode() fails here, as it does in EduBlocks.
"""
import ast, io, json, math, sys, time, types

request = json.load(sys.stdin)
source = request["source"]

if request["mode"] == "check":
    compile(source, "program.py", "exec")
    print(json.dumps({"ok": True}))
    sys.exit(0)

if request["mode"] == "names":
    defined, used, attributes = set(), set(), set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.FunctionDef):
            defined.add(node.name)
            defined.update(a.arg for a in node.args.args)
        elif isinstance(node, ast.Name):
            (used if isinstance(node.ctx, ast.Load) else defined).add(node.id)
        elif isinstance(node, ast.Import):
            defined.update((a.asname or a.name).split(".")[0] for a in node.names)
        elif isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
            attributes.add(node.value.id + "." + node.attr)
    print(json.dumps({"free": sorted(used - defined), "attributes": sorted(attributes)}))
    sys.exit(0)

state = {"x": 0.0, "y": 0.0, "heading": 0.0, "down": True, "size": 1, "color": (0, 0, 0),
         "length": 0.0, "speeds": [], "mode": 1.0}

def _go(dx, dy):
    nx, ny = state["x"] + dx, state["y"] + dy
    if state["down"]:
        state["length"] += math.hypot(dx, dy)
    state["x"], state["y"] = nx, ny

def forward(d):
    _go(d * math.cos(math.radians(state["heading"])), d * math.sin(math.radians(state["heading"])))

def backward(d):
    forward(-d)

def left(a):
    state["heading"] = (state["heading"] + a) % 360

def right(a):
    left(-a)

def goto(x, y):
    _go(x - state["x"], y - state["y"])

def setheading(a):
    state["heading"] = a % 360

def circle(radius, extent=None, steps=None):
    # The same steps as the real turtle module.
    if extent is None:
        extent = 360
    frac = abs(extent) / 360.0
    if steps is None:
        steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
    w = 1.0 * extent / steps
    w2 = 0.5 * w
    l = 2.0 * radius * math.sin(math.radians(w2))
    if radius < 0:
        l, w, w2 = -l, -w, -w2
    left(w2)
    for _ in range(steps):
        forward(l)
        left(w)
    left(-w2)

def penup():
    state["down"] = False

def pendown():
    state["down"] = True

def pensize(n=None):
    if n is None:
        return state["size"]
    state["size"] = n

def color(*rgb):
    state["color"] = tuple(rgb)

def pencolor(*rgb):
    if not rgb:
        return state["color"]
    state["color"] = tuple(rgb)

def clear():
    state["length"] = 0.0

def home():
    goto(0, 0)
    setheading(0)

def xcor():
    return state["x"]

def ycor():
    return state["y"]

def heading():
    return state["heading"]

def speed(s=None):
    state["speeds"].append(s)

class _Screen:
    def colormode(self, m=None):
        if m is not None:
            state["mode"] = m
        return state["mode"]

def Screen():
    return _Screen()

noop = lambda *a, **k: None
fake = types.ModuleType("turtle")
for name in ("forward backward left right goto setheading circle penup pendown pensize color pencolor "
             "clear home xcor ycor heading speed Screen").split():
    setattr(fake, name, globals()[name])
fake.begin_fill = fake.end_fill = fake.bgcolor = fake.done = noop
fake.__all__ = [n for n in dir(fake) if not n.startswith("_")]
sys.modules["turtle"] = fake
time.sleep = lambda s: None  # the tests do not wait

out = io.StringIO()
real_stdout = sys.stdout
sys.stdout = out
try:
    exec(compile(source, "program.py", "exec"), {"__name__": "__main__"})
except SystemExit:
    pass
finally:
    sys.stdout = real_stdout

print(json.dumps({
    "x": state["x"], "y": state["y"], "heading": state["heading"], "length": state["length"],
    "speeds": state["speeds"], "printed": out.getvalue().split(),
}))
