// Finds the other files a .scad file reads (import, include, use, surface) and fetches them, so the
// in-browser OpenSCAD can find them. Used by /openscad/ and /stl/. It only ever fetches from the same
// GitHub repository (or, in /stl/, from files the person dropped or the Drive folder they opened).

const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");

// The file names a piece of code asks for. Names built in code (import(str(name, ".stl"))) are not found.
export function findRefs(code) {
  const t = strip(code), out = new Set();
  for (const m of t.matchAll(/\b(?:include|use)\s*<([^>\n]+)>/g)) out.add(m[1].trim());
  for (const m of t.matchAll(/\b(?:import|surface)\s*\(\s*(?:file\s*=\s*)?"([^"\n]+)"/g)) out.add(m[1].trim());
  return [...out];
}
const dirOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
// rel is relative to the folder dir; returns a path from the top of the repository, or null if it leaves it.
export function resolvePath(dir, rel) {
  if (!rel || rel.startsWith("/")) return null;
  const parts = dir ? dir.split("/") : [];
  for (const seg of rel.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") { if (!parts.length) return null; parts.pop(); } else parts.push(seg);
  }
  return parts.length ? parts.join("/") : null;
}

// Fetches every file mainPath's code uses (and the .scad files those use, and so on).
// fetchFile(path) gives an ArrayBuffer, or null when there is no such file.
// Returns { files: { "/path": Uint8Array }, missing: [names], count }; the paths start at the top of the repository,
// so OpenSCAD finds ../ and folders just as it would on a computer.
export async function collectFiles({ mainPath, code, fetchFile, maxFiles = 40, maxBytes = 40e6 }) {
  const files = {}, missing = [], seen = new Set([mainPath]);
  let bytes = 0, count = 0;
  const queue = [{ from: mainPath, code }];
  while (queue.length) {
    const { from, code: c } = queue.shift();
    for (const rel of findRefs(c)) {
      const p = resolvePath(dirOf(from), rel);
      if (p === null) { missing.push(rel); continue; }
      if (seen.has(p)) continue;
      seen.add(p);
      if (count >= maxFiles) { missing.push(rel + " (too many files)"); continue; }
      let buf = null;
      try { buf = await fetchFile(p); } catch (e) { buf = null; }
      if (!buf) { missing.push(rel); continue; }
      bytes += buf.byteLength;
      if (bytes > maxBytes) { missing.push(rel + " (too big)"); continue; }
      count++;
      files["/" + p] = new Uint8Array(buf);
      if (/\.scad$/i.test(p)) queue.push({ from: p, code: new TextDecoder().decode(buf) });
    }
  }
  return { files, missing, count };
}

// A file from a GitHub repository: through the API with a token (private repositories), otherwise straight from
// raw.githubusercontent.com. Remembered for a minute so repeated renders do not ask again.
const memo = new Map();
export async function fetchGitHubFile({ owner, repo, ref, path, token }) {
  const key = [owner, repo, ref, path].join("\n"), hit = memo.get(key);
  if (hit && Date.now() - hit.t < 60000) return hit.buf;
  const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
  let buf = null;
  try {
    const r = token
      ? await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${enc(path)}?ref=${encodeURIComponent(ref)}`, { headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" } })
      : await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${enc(path)}`);
    if (r.ok) buf = await r.arrayBuffer();
  } catch (e) { buf = null; }
  if (buf) memo.set(key, { t: Date.now(), buf });
  return buf;
}
