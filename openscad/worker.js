// Runs one OpenSCAD render off the main thread, so a runaway script can be
// stopped by terminating this worker. Each render uses a fresh engine,
// because OpenSCAD's main() can only be called once per instance.
import { createOpenSCAD } from "./engine/openscad.js";

const NOISE = /cache|localization|Status:|Genus:|Vertices:|Facets:|Top level object|Simple:|Volumes:|Rendering Polygon|Rendering Polyhedron|Total rendering time|Convex:|Simple:/;

self.onmessage = async (e) => {
  const log = [];
  const keep = (s) => { if (!NOISE.test(s)) log.push(s); };
  try {
    const o = await createOpenSCAD({ print: keep, printErr: keep });
    const inst = o.getInstance();
    inst.FS.writeFile("/input.scad", e.data.code);
    let rc = 1;
    try {
      rc = inst.callMain(["/input.scad", "--backend=manifold", "--export-format=binstl", "-o", "/out.stl"]);
    } catch (err) {
      log.push("ERROR: " + (err && err.message ? err.message : err));
    }
    let stl = null;
    try { stl = inst.FS.readFile("/out.stl"); } catch (err) { /* nothing was made */ }
    if (stl && stl.length > 84) {
      self.postMessage({ ok: true, log, stl: stl.buffer }, [stl.buffer]);
    } else {
      self.postMessage({ ok: false, log, rc });
    }
  } catch (err) {
    self.postMessage({ ok: false, log: ["ERROR: " + (err && err.message ? err.message : err)] });
  }
};
