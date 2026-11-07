"""Runs the Python that TurtleLab writes, for the tests. Not part of the app.

It reads {"source": "...", "mode": "...", "answers": [...], "clicks": [[x, y], ...]} from standard input (answers are what input() is given, in order; clicks, when given, make
onscreenclick exist and call the function it was given for each click after the program has run, as real Python's turtle would from done()). The modes:
  check           only compiles the source, to prove it is valid Python.
  names           lists the names the program uses without defining them (the turtle
                  functions, the builtins) and the module functions it calls
                  (random.randint, ...), so a test can check them against what EduBlocks
                  provides. A name used only inside `try: ... except NameError:` does not
                  count: that is how the program says "if this exists".
  edublocks-names lists every name EduBlocks' turtle module has (see below).
  run             runs the program against a stand-in for the turtle module and prints
                  where the turtle ended up, how far it drew, its pen, what was printed and what input() was asked.

The stand-in is EduBlocks, not Python. edublocks.org runs Python with PyScript, and its
turtle module is a small file of its own, https://app.edublocks.org/pyscript/turtle/turtle.py
(read in November 2026). The stand-in has exactly the names that file exports, takes a color
the way that file does (one string, or three WHOLE numbers), and, like it, has no done(),
no colormode(), and cannot be asked for the pen's color or size. So a program that runs
here runs in EduBlocks, and one that calls colormode() fails here as it did there. The
moves follow the real turtle module's rules (heading 0 is east and turns counter-clockwise,
and circle() uses the same steps as the real one), but nothing is drawn.
"""
import ast, io, json, math, sys, time, types

request = json.load(sys.stdin)
source = request["source"]

# Every name in the __all__ of EduBlocks' turtle.py: its classes, its turtle functions and its screen functions.
EDUBLOCKS_NAMES = (
    "Turtle Screen "
    "forward fd left lt backward bk back right rt goto setpos setposition circle width pensize color pencolor "
    "fillcolor begin_fill end_fill penup pu pendown pd speed shape setheading seth write xcor ycor position pos "
    "setx sety heading hideturtle ht showturtle st isvisible home dot distance towards clear reset stamp "
    "clearstamp clearstamps undo turtlesize shapesize "
    "bgcolor setup title tracer update window_width window_height"
).split()

if request["mode"] == "check":
    compile(source, "program.py", "exec")
    print(json.dumps({"ok": True}))
    sys.exit(0)

if request["mode"] == "edublocks-names":
    print(json.dumps({"names": EDUBLOCKS_NAMES}))
    sys.exit(0)

if request["mode"] == "names":
    defined, used, attributes = set(), set(), set()

    class Collect(ast.NodeVisitor):
        def visit_Try(self, node):
            # `try: done() except NameError: pass` asks whether done exists: it is allowed not to.
            guarded = any(isinstance(h.type, ast.Name) and h.type.id == "NameError" for h in node.handlers)
            if not guarded:
                self.generic_visit(node)
                return
            for part in node.handlers + node.orelse + node.finalbody:
                self.visit(part)

        def visit_FunctionDef(self, node):
            defined.add(node.name)
            defined.update(a.arg for a in node.args.args)
            self.generic_visit(node)

        def visit_Name(self, node):
            (used if isinstance(node.ctx, ast.Load) else defined).add(node.id)

        def visit_Import(self, node):
            defined.update((a.asname or a.name).split(".")[0] for a in node.names)

        def visit_Attribute(self, node):
            if isinstance(node.value, ast.Name):
                attributes.add(node.value.id + "." + node.attr)
            self.generic_visit(node)

    Collect().visit(ast.parse(source))
    print(json.dumps({"free": sorted(used - defined), "attributes": sorted(attributes)}))
    sys.exit(0)

state = {"x": 0.0, "y": 0.0, "heading": 0.0, "down": True, "size": 1, "color": None,
         "length": 0.0, "speeds": []}

def get_color(args):
    # As in EduBlocks' turtle.py: three whole numbers make a hex color, anything else is passed on as it is.
    if len(args) == 3:
        return "#%02x%02x%02x" % (args[0], args[1], args[2])
    return args[0]  # no argument at all is an IndexError there, as it is here

def remember_color(args):
    value = get_color(args)
    if isinstance(value, str) and value.startswith("#") and len(value) == 7:
        state["color"] = [int(value[i:i + 2], 16) for i in (1, 3, 5)]

def _go(dx, dy):
    if state["down"]:
        state["length"] += math.hypot(dx, dy)
    state["x"] += dx
    state["y"] += dy

def forward(distance):
    _go(distance * math.cos(math.radians(state["heading"])), distance * math.sin(math.radians(state["heading"])))

def backward(distance):
    forward(-distance)

def left(angle):
    state["heading"] = (state["heading"] + angle) % 360

def right(angle):
    left(-angle)

def goto(x, y=None):
    _go(x - state["x"], y - state["y"])

def setheading(angle):
    state["heading"] = angle % 360

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

def pensize(width):  # a size is required, so the size cannot be read back
    state["size"] = width

def color(*args):
    remember_color(args)

def pencolor(*args):
    remember_color(args)

def fillcolor(*args):
    get_color(args)

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

def speed(speed):  # required, like EduBlocks'
    state["speeds"].append(speed)

def begin_fill():
    pass

def end_fill():
    pass

def bgcolor(*args):
    get_color(args)

fake = types.ModuleType("turtle")
for name in EDUBLOCKS_NAMES:
    # the aliases are the same function; everything else that is not used here does nothing
    impl = {"fd": forward, "lt": left, "bk": backward, "back": backward, "rt": right, "setpos": goto, "setposition": goto,
            "width": pensize, "pu": penup, "pd": pendown, "seth": setheading}.get(name) or globals().get(name)
    setattr(fake, name, impl if callable(impl) and name not in ("Turtle", "Screen") else (lambda *a, **k: None))
fake.__all__ = list(EDUBLOCKS_NAMES)
# EduBlocks' turtle has no onscreenclick, so a program only finds one here when the test is about clicks and says so.
click_handlers = []
clicks = request.get("clicks")
if clicks is not None:
    def onscreenclick(fun, btn=1, add=None):
        click_handlers.append(fun)
    fake.onscreenclick = onscreenclick
    fake.__all__ = list(EDUBLOCKS_NAMES) + ["onscreenclick"]
sys.modules["turtle"] = fake
time.sleep = lambda s: None  # the tests do not wait

# input() is answered from the request, and the questions are kept apart from what was printed (a real input() writes its question to
# the screen, but a program's prints are what the tests compare with the blocks').
import builtins
answers = [str(a) for a in request.get("answers", [])]
asked = []
def fake_input(prompt=""):
    asked.append(prompt)
    if not answers:
        raise EOFError("input() was asked for more answers than the test gave")
    return answers.pop(0)
builtins.input = fake_input

out = io.StringIO()
real_stdout = sys.stdout
sys.stdout = out
try:
    exec(compile(source, "program.py", "exec"), {"__name__": "__main__"})
    for click_x, click_y in clicks or []:
        if click_handlers:
            click_handlers[-1](click_x, click_y)
except SystemExit:
    pass
finally:
    sys.stdout = real_stdout

print(json.dumps({
    "x": state["x"], "y": state["y"], "heading": state["heading"], "length": state["length"],
    "color": state["color"], "size": state["size"],
    "speeds": state["speeds"], "printed": out.getvalue().split(), "asked": asked,
}))
