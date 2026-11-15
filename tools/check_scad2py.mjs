// Checks openscad/scad2py.js: converts sample OpenSCAD programs, runs the Python in the
// real Python 3D shim (read straight out of python3d/studio.html) with CPython, and
// compares the shape tree it builds. Run: node tools/check_scad2py.mjs
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scadToPython } from "../openscad/scad2py.js";

const studio = readFileSync(new URL("../python3d/studio.html", import.meta.url), "utf8");
const m = studio.match(/const PYTHON_SHIM = `([\s\S]*?)\n`;\n/);
if (!m) throw new Error("could not find PYTHON_SHIM in studio.html");
const shim = (0, eval)("`" + m[1] + "`");
const dir = mkdtempSync(join(tmpdir(), "scad2py-"));
writeFileSync(join(dir, "shim.py"), shim);

function run(code) {
  writeFileSync(join(dir, "prog.py"), code);
  const driver = `import json,sys\nsys.setrecursionlimit(5000)\nexec(open(${JSON.stringify(join(dir, "shim.py"))}).read())\n_reset()\nexec(open(${JSON.stringify(join(dir, "prog.py"))}).read())\nprint(_dump())\n`;
  writeFileSync(join(dir, "driver.py"), driver);
  const lines = execFileSync("python3", ["-I", join(dir, "driver.py")], { encoding: "utf8" }).trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);   // the last line is the shapes; print() output comes before it
}

let failed = 0;
function check(name, scad, test) {
  let out, conv;
  try { conv = scadToPython(scad); out = run(conv.code); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message.split("\n").slice(-3).join(" | ")}\n${conv ? conv.code : ""}`); return; }
  try { test(out, conv); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}\n${conv.code}\n${JSON.stringify(out)}`); }
}
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${what}: got ${JSON.stringify(a)}, wanted ${JSON.stringify(b)}`); };

check("cube corner", "cube([10,20,30]);", (o) => { eq(o.length, 1, "shapes"); const b = o[0]; eq([b.type, b.width, b.depth, b.height, b.align, b.center], ["box", 10, 20, 30, "left-bottom", false], "box"); });
check("cube centered scalar", "cube(5, center=true);", (o) => { const b = o[0]; eq([b.width, b.depth, b.height, b.center, b.align], [5, 5, 5, true, "center"], "box"); });
check("cylinder", "cylinder(h=10, r=3);", (o) => eq([o[0].type, o[0].radius, o[0].height], ["cylinder", 3, 10], "cyl"));
check("cylinder d", "cylinder(h=10, d=6, center=true, $fn=12);", (o) => eq([o[0].radius, o[0].center, o[0].segments], [3, true, 12], "cyl"));
check("cone", "cylinder(h=10, r1=4, r2=0);", (o) => { eq(o[0].type, "rotate_extrude", "type"); eq(o[0].profile.points, [[0, 0], [4, 0], [0, 10]], "profile"); });
check("sphere", "sphere(r=5);", (o) => eq(o[0].type, "rotate_extrude", "type"));
check("translate rotate", "translate([1,2,3]) rotate([0,90,0]) cube(2);", (o) => { const t = o[0]; eq([t.type, t.x, t.y, t.z], ["translate", 1, 2, 3], "t"); eq([t.child.type, t.child.angles], ["rotate", [0, 90, 0]], "r"); });
check("translate 2d vector", "translate([5,5]) cube(1);", (o) => eq([o[0].x, o[0].y, o[0].z], [5, 5, 0], "t"));
check("difference", "difference(){ cube(10); translate([5,5,-1]) cylinder(r=2,h=12); }", (o) => { eq(o.length, 1, "one"); eq(o[0].type, "difference", "type"); eq(o[0].subtract.length, 1, "sub"); });
check("union block", "translate([1,0,0]) { cube(1); translate([0,2,0]) cube(1); }", (o) => { eq(o.length, 1, "one"); eq(o[0].child.type, "union", "union"); });
check("for loop", "for (i=[0:3]) translate([i*10,0,0]) cube(5);", (o) => { eq(o.length, 4, "four"); eq(o.map((s) => s.x), [0, 10, 20, 30], "xs"); });
check("for inside difference", "difference(){ cube(20); for (i=[0:2]) translate([i*6+2,2,-1]) cylinder(r=1,h=30); }", (o) => { eq(o[0].subtract.length, 1, "sub"); eq(o[0].subtract[0].children.length, 3, "three holes"); });
check("variables and expressions", "w=4; h=w*2+1; cube([w,w,h]);", (o) => eq([o[0].width, o[0].height], [4, 9], "dims"));
check("module with params", "module peg(r=2,h=5){ cylinder(r=r,h=h); } peg(); translate([10,0,0]) peg(3,8);", (o) => { eq(o.length, 2, "two"); eq(o[0].radius, 2, "r"); eq(o[1].child.height, 8, "h"); });
check("module used before defined", "peg(); module peg(){ cube(1); }", (o) => eq(o.length, 1, "one"));
check("module children", "module twice(){ children(); translate([5,0,0]) children(); } twice() cube(1);", (o) => eq(o.length, 2, "two"));
check("if else", "n=3; if (n>2) cube(1); else sphere(1);", (o) => eq(o[0].type, "box", "type"));
check("function", "function sq(x)=x*x; cube(sq(3));", (o) => eq(o[0].width, 9, "w"));
check("trig is degrees", "cube(sin(90)*5);", (o) => eq(o[0].width, 5, "w"));
check("vector math", "p=[1,2,3]; translate(p*2+[1,1,1]) cube(1);", (o) => eq([o[0].x, o[0].y, o[0].z], [3, 5, 7], "t"));
check("list comprehension", "pts=[for (i=[0:3]) i*2]; cube(len(pts));", (o) => eq(o[0].width, 4, "len"));
check("ternary", "a=2; cube(a>1 ? 7 : 3);", (o) => eq(o[0].width, 7, "w"));
check("color", 'color("red") cube(1); color([0,0,1], 0.5) cube(1);', (o) => { eq(o[0].fill, "red", "red"); eq([o[1].fill, o[1].opacity], ["#0000ff", 50], "blue"); });
check("color on difference keeps inner color", 'color("red") difference(){ color("green") cube(2); cube(1); }', (o) => eq(o[0].fill, "green", "fill"));
check("linear_extrude", "linear_extrude(height=5) square([4,3]);", (o) => { eq(o[0].type, "extrude", "type"); eq(o[0].height, 5, "h"); eq(o[0].profile.points[2], [4, 3], "corner"); });
check("linear_extrude 2D difference", "linear_extrude(height=5) difference(){ square(10); translate([5,5]) circle(r=2); }", (o) => { eq(o[0].type, "difference", "type"); eq(o[0].base.type, "extrude", "base"); eq(o[0].subtract[0].type, "translate", "sub"); });
check("linear_extrude centered", "linear_extrude(height=4, center=true) circle(3);", (o) => eq([o[0].center, o[0].height], [true, 4], "c"));
check("rotate_extrude", "rotate_extrude() translate([5,0]) square([2,3]);", (o) => { eq(o[0].type, "rotate_extrude", "type"); eq(o[0].profile.points[0], [5, 0], "start"); });
check("scale pushes into shapes", "scale([2,3,4]) cube(1);", (o) => eq([o[0].width, o[0].depth, o[0].height], [2, 3, 4], "dims"));
check("scale translate", "scale(2) translate([1,0,0]) cube(1);", (o) => eq([o[0].x, o[0].child.width], [2, 2], "scaled"));
check("polygon extrude", "linear_extrude(2) polygon([[0,0],[4,0],[0,3]]);", (o) => eq(o[0].profile.points, [[0, 0], [4, 0], [0, 3]], "pts"));
check("polyhedron", "polyhedron(points=[[0,0,0],[1,0,0],[0,1,0],[0,0,1]], faces=[[0,1,2],[0,3,1],[1,3,2],[2,3,0]]);", (o) => eq(o[0].faces[0], [2, 1, 0], "flipped"));
check("modifiers", "%cube(1); #cube(2);", (o) => eq(o.length >= 1, true, "some"));
check("\\$fn sets SEGMENTS", "$fn=8; cylinder(r=1,h=1);", (o) => eq(o[0].segments, 8, "seg"));
check("mirror warns", "mirror([1,0,0]) cube(1);", (o, c) => { eq(c.warnings.length, 1, "warnings"); eq(o.length, 1, "kept"); });
check("range with step", "for (i=[0:2:6]) translate([i,0,0]) cube(1);", (o) => eq(o.map((s) => s.x), [0, 2, 4, 6], "xs"));
check("float range", "for (a=[0:0.5:1]) translate([a*10,0,0]) cube(1);", (o) => eq(o.map((s) => s.x), [0, 5, 10], "xs"));
check("nested for", "for (i=[0:1], j=[0:2]) translate([i,j,0]) cube(1);", (o) => eq(o.length, 6, "six"));
check("empty for makes nothing", "for (i=[0:-1]) cube(1); cube(2);", (o) => eq(o.length, 1, "one"));
check("let and comments", "// hi\n/* x */ let(a=3) cube(a);", (o) => eq(o[0].width, 3, "w"));
check("assignment after use", "cube(s); s = 7;", (o) => eq(o[0].width, 7, "w"));
check("echo", 'echo("hi", 3); cube(1);', (o) => eq(o.length, 1, "one"));
check("rotate axis", "rotate(a=90, v=[1,0,0]) cube(1);", (o) => eq([o[0].mode, o[0].axis, o[0].angle], ["axis", "x", 90], "r"));
check("intersection", "intersection(){ cube(4); sphere(3); }", (o) => eq(o[0].type, "intersection", "type"));
check("a realistic part", `
// box with lid screws
w = 40; d = 30; h = 15; wall = 2; screw = 1.5;
module post(x, y) { translate([x, y, wall]) cylinder(h = h - wall, r = screw + 1, $fn = 20); }
difference() {
  union() {
    difference() {
      cube([w, d, h]);
      translate([wall, wall, wall]) cube([w - 2 * wall, d - 2 * wall, h]);
    }
    for (x = [5, w - 5], y = [5, d - 5]) post(x, y);
  }
  for (x = [5, w - 5], y = [5, d - 5]) translate([x, y, wall]) cylinder(h = h, r = screw, $fn = 12);
}`, (o) => { eq(o.length, 1, "one"); eq(o[0].type, "difference", "type"); });

try { scadToPython("cube(;"); failed++; console.log("FAIL syntax error should throw"); } catch (e) { console.log("ok   syntax error: " + e.message); }
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nall passed");
