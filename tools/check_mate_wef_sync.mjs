// Fails if the MATE view in the porttack.com skills widget (the data file) and this repo's
// _standards/mate-wef-links.json disagree. Usage: node tools/check_mate_wef_sync.mjs [path-to-skills-widget-data.js]
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.argv[2] || resolve(root, "assets/js/skills-widget/skills-widget-data.js");
const ours = JSON.parse(readFileSync(resolve(root, "_standards/mate-wef-links.json"), "utf8"));
const skills = JSON.parse(readFileSync(resolve(root, "_standards/mate-skills.json"), "utf8"));
const ids = skills.groups.flatMap(g => g.items.map(i => i.code));

let dataset = null;
const SkillsWidget = { registerDataset(name, ds) { dataset = ds; } };
vm.runInNewContext(readFileSync(dataPath, "utf8"), { window: { SkillsWidget }, SkillsWidget, console });
if (!dataset || !dataset.matchViews || !dataset.matchViews.mate) { console.error("no 'mate' match view in " + dataPath); process.exit(1); }
const view = dataset.matchViews.mate;
const problems = [];
const key = l => `${l.s}|${l.a}|${l.w}`;
const a = new Set(view.links.map(key)), b = new Set(ours.links.map(key));
for (const k of a) if (!b.has(k)) problems.push("widget has a link our JSON does not: " + k);
for (const k of b) if (!a.has(k)) problems.push("our JSON has a link the widget does not: " + k);
const anchorIds = view.anchors.map(x => x.id);
if (anchorIds.join() !== ids.join()) problems.push("anchor ids differ from mate-skills.json: " + anchorIds.join());
const names = dataset.skills.map(s => s.name.replace(/&amp;/g, "&"));
ours.wef_skills.forEach((s, i) => { if (names[i] !== s.name.replace(/&amp;/g, "&")) problems.push(`employer skill ${i}: widget "${names[i]}" vs ours "${s.name}"`); });
view.anchors.forEach(x => { if (!view.details[x.id]) problems.push("no details for " + x.id); });
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`ok: ${view.links.length} links, ${view.anchors.length} MATE skills, ${dataset.skills.length} employer skills agree (${dataPath})`);
