// Fails if the MATE and Ocean Decade views in the shared skills widget (the porttack.com data file, or the copy in
// this repo) disagree with this repo's JSON. Recomputes each view's expected left list, anchors, links and bars from
// _standards/*.json on its own, so it does not depend on tools/build_skills_widget_data.py being right.
// Usage: node tools/check_mate_wef_sync.mjs [path-to-skills-widget-data.js]
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.argv[2] || resolve(root, "assets/js/skills-widget/skills-widget-data.js");
const J = f => JSON.parse(readFileSync(resolve(root, "_standards", f), "utf8"));
const wef = J("mate-wef-links.json"), ocean = J("mate-ocean-links.json"), skillsCat = J("mate-skills.json");
const odCat = J("ocean-decade.json"), missions = J("carriers/mate-missions.json");
const mateIds = skillsCat.groups.flatMap(g => g.items.map(i => i.code));
const challenges = odCat.groups.find(g => g.code === "OD").items;

let ds = null;
vm.runInNewContext(readFileSync(dataPath, "utf8"), { window: { SkillsWidget: { registerDataset(n, d) { ds = d; } } }, console });
if (!ds) { console.error("no dataset registered by " + dataPath); process.exit(1); }

const clean = s => String(s).replace(/&amp;/g, "&");
const problems = [];
const same = (label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}\n   widget: ${JSON.stringify(got)}\n   ours:   ${JSON.stringify(want)}`); };
const linkSet = ls => ls.map(l => `${l.s}|${l.a}|${l.w}`).sort();

const byRank = key => wef.wef_skills.filter(w => w[key]).sort((a, b) => a[key] - b[key]).map(w => w.index);
const WEF25 = byRank("rank_2025"), WEF30 = byRank("rank_2030");
const wefName = i => clean(wef.wef_skills[i].name);
const remap = (links, idxs) => links.filter(l => idxs.includes(l.s)).map(l => ({ s: idxs.indexOf(l.s), a: l.a, w: l.w }));
const odNum = code => parseInt(code.split(".")[1], 10);
const oceanLeft = challenges.map((c, n) => `${n + 1}. ${c.name}`);

const expected = {
  mate25: { left: WEF25.map(wefName), anchors: mateIds, links: remap(wef.links, WEF25) },
  mate30: { left: WEF30.map(wefName), anchors: mateIds, links: remap(wef.links, WEF30) },
  "ocean-mate": { left: oceanLeft, anchors: mateIds, links: ocean.ocean_mate.map(l => ({ s: odNum(l.o) - 1, a: l.a, w: l.w })) },
  "wef30-ocean": { left: WEF30.map(wefName), anchors: challenges.map(c => c.code), links: remap(ocean.wef30_ocean, WEF30).map(l => ({ s: l.s, a: l.a, w: l.w })) },
  "ocean-wef30": { left: oceanLeft, anchors: WEF30.map(i => "w" + i), links: ocean.wef30_ocean.map(l => ({ s: odNum(l.a) - 1, a: "w" + l.s, w: l.w })) },
};
for (const [view, want] of Object.entries(expected)) {
  const v = ds.matchViews[view];
  if (!v) { problems.push("missing match view: " + view); continue; }
  same(`${view}: left list`, (v.left || []).map(x => clean(x.name)), want.left);
  same(`${view}: anchor ids`, v.anchors.map(x => x.id), want.anchors);
  same(`${view}: links`, linkSet(v.links), linkSet(want.links));
  v.anchors.forEach(x => { if (!v.details[x.id]) problems.push(`${view}: no details for ${x.id}`); });
}
// Ocean 10 bars: ten equal bars, value text from MATE's own task tags
const taskCount = code => ((missions.coverage["ocean-decade"][code] || { locators: [] }).locators.filter(k => k !== "2026-0")).length;
const wantBars = challenges.map(c => { const k = taskCount(c.code); return { name: c.name, valText: String(k) }; });
const gotBars = (ds.bars.ocean || []).map(b => ({ name: clean(b.name), valText: b.valText }));
same("ocean bars", gotBars, wantBars);
if ((ds.bars.ocean || []).some(b => b.w !== 100)) problems.push("ocean bars are not all equal width");
// The employer-skill list is shared by every view; the order must match mate-wef-links.json
same("employer skill names", ds.skills.map(s => clean(s.name)), wef.wef_skills.map(s => clean(s.name)));
// Regression: the views that were there before must still be there
["match", "csta", "csta3"].forEach(v => { if (!ds.matchViews[v]) problems.push("lost the existing match view: " + v); });
["now", "growing"].forEach(v => { if (!ds.bars[v]) problems.push("lost the existing bar view: " + v); });
["now", "growing", "cte", "match", "csta", "csta3"].forEach(v => { if (!ds.captions[v]) problems.push("lost the existing caption: " + v); });
Object.keys(ds.matchViews).forEach(v => { if (!ds.captions[v]) problems.push("no caption for view " + v); });
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`ok: ${Object.keys(expected).length} match views and the Ocean 10 bars agree with _standards (${dataPath})`);
