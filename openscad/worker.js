// Runs one OpenSCAD render off the main thread, so a runaway script can be
// stopped by terminating this worker. Each render uses a fresh engine,
// because OpenSCAD's main() can only be called once per instance.
import { createOpenSCAD } from "./engine/openscad.js";

const NOISE = /cache|localization|Status:|Genus:|Vertices:|Facets:|Top level object|Simple:|Volumes:|Rendering Polygon|Rendering Polyhedron|Total rendering time|Convex:|Simple:/;

// Fonts for text(). They are only fetched (once) when a script uses text(), because
// they are about 1.8 MB. DejaVu fonts are freely licensed (see fonts/LICENSE-DejaVu.txt).
const FONT_FILES = ["DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSansMono.ttf"];
let fontData = null;
async function loadFonts() {
  if (!fontData) {
    fontData = await Promise.all(FONT_FILES.map(async (f) => {
      const r = await fetch(new URL("./fonts/" + f, import.meta.url));
      if (!r.ok) throw new Error("could not load font " + f);
      return [f, new Uint8Array(await r.arrayBuffer())];
    }));
  }
  return fontData;
}
function installFonts(inst, fonts) {
  inst.FS.mkdir("/fonts");
  for (const [name, bytes] of fonts) inst.FS.writeFile("/fonts/" + name, bytes);
  inst.FS.writeFile("/fonts/fonts.conf", '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/fonts</dir><cachedir>/tmp/fontcache</cachedir></fontconfig>');
  inst.ENV.FONTCONFIG_FILE = "/fonts/fonts.conf";
  inst.ENV.FONTCONFIG_PATH = "/fonts";
}

self.onmessage = async (e) => {
  const log = [];
  const keep = (s) => { if (!NOISE.test(s)) log.push(s); };
  try {
    const o = await createOpenSCAD({ print: keep, printErr: keep });
    const inst = o.getInstance();
    if (/\btext\s*\(/.test(e.data.code)) {
      try { installFonts(inst, await loadFonts()); }
      catch (err) { fontData = null; log.push("WARNING: text() fonts could not be loaded (" + (err && err.message ? err.message : err) + ")."); }
    }
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
