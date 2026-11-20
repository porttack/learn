/* Copied unchanged from porttack.com/assets/skills-widget.js on 2026-11-20 by tools/sync_skills_widget.sh. Edit it there, not here. */
/*
 * skills-widget.js — reusable "Skills <-> Standards" interactive chart.
 *
 * One engine, many posts. The datasets live in their own file (e.g.
 * skills-widget-data.js) and register themselves with SkillsWidget.registerDataset;
 * a post then names a dataset and supplies only its per-post config (which tabs,
 * default tab, anchors, any caption overrides). This file owns all the behavior
 * (tab switching, animated bars, the match-up lines and detail panels, print
 * fallbacks, deep-linking) and its own styles, which it injects once on first init.
 *
 * Usage from a post:
 *   <script src="/assets/skills-widget.js"></script>
 *   <script src="/assets/skills-widget-data.js"></script>
 *   <div id="wef-skills-widget" class="skills-widget"> ...title/legend/source... </div>
 *   <script>
 *     SkillsWidget.init({
 *       el: "#wef-skills-widget",
 *       dataset: "wef-skills",                      // data comes from the library
 *       defaultView: "match",                       // (1) which tab opens first
 *       tabs: [                                      // (3) which tabs are shown, in order
 *         { view:"now",     label:"Most essential today",    anchor:"wef-skills-now" },
 *         { view:"match",   label:"CTE Match-up",            anchor:"wef-skills-match" }
 *       ],
 *       hiddenViews: [                               // reachable by deep-link, no tab
 *         { view:"cte", anchor:"wef-skills-cte" }
 *       ],
 *       captions: { now: "..." }                    // optional per-post overrides
 *     });
 *   </script>
 *
 * Printing is WYSIWYG: the currently-shown view (chart, lines, caption) prints
 * as-is; only the tabs and the hover hint are hidden. Switch tabs, then print.
 *
 * Config keys:
 *   el           CSS selector or element for the widget container.
 *   dataset      Name of a dataset registered via SkillsWidget.registerDataset.
 *   defaultView  View shown on load when no matching URL hash is present.  (1)
 *   tabs         Array of { view, label, anchor? }. Order = display order.  (3)
 *                An anchor gives the tab a deep-link target (#anchor).      (2)
 *                Append "?a=<id>" or "?s=<idx>" to that hash to also open
 *                (and pin) one chip in a match view on load, e.g.
 *                "#wef-skills-match?a=7" opens CTE anchor 7.0.
 *   hiddenViews  Array of { view, anchor? } reachable only by hash, no tab.
 *   percentMax   Denominator for percent bars (default from dataset, else 80).
 *   tableView    View name that renders the standards table (default "cte").
 *   captions     { <view>: html } overrides merged over the dataset's captions.
 *   data         Inline data instead of (or overriding) a named dataset:
 *     data.bars     { <view>: [ {name,cls,val?,rank2025?}, ... ] } bar views.
 *     data.skills   The shared skill list: left column of every match view and
 *                   the rows of the table view. Items: {name,cls,rank,std,fit}.
 *     data.captions { <view>: html } caption under the tab bar per view.
 *     data.matchViews { <view>: {anchors,links,details,covered,rightTitle} }.
 *
 * A dataset registered with registerDataset(name, ds) carries the reusable,
 * unchanging content: { percentMax?, bars, skills, matchViews, captions }.
 */
(function (global) {
  "use strict";

  var STYLE_ID = "skills-widget-css";

  var CSS = [
    ".skills-widget{",
    "  --ink:#1B2A3A; --sub:#5A6672; --line:#E6EAEE;",
    "  --human:#0E7C86; --tech:#C2CBD3; --ai:#E0A100; --ocean:#2A6FB0;",
    "  font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;",
    "  color:var(--ink); max-width:720px; margin:1.5rem 0; line-height:1.4;}",
    ".skills-widget *{box-sizing:border-box;}",
    ".skills-widget .wsw-head{display:flex; flex-wrap:wrap; gap:.75rem 1rem; align-items:center; justify-content:space-between; margin-bottom:.35rem;}",
    "/* Match the site's in-content H2 (minima: 2rem, weight 400, 1.75rem <=800px). */",
    ".skills-widget .wsw-title{font-size:2rem; font-weight:400; margin:0;}",
    "@media (max-width:800px){.skills-widget .wsw-title{font-size:1.75rem;}}",
    ".skills-widget .wsw-toggle{display:inline-flex; flex-wrap:wrap; background:#F1F4F6; border-radius:999px; padding:3px;}",
    ".skills-widget .wsw-btn{",
    "  border:0; background:transparent; cursor:pointer; font:inherit; font-size:.82rem; font-weight:600;",
    "  color:var(--sub); padding:.4rem .8rem; border-radius:999px; transition:all .18s ease;}",
    ".skills-widget .wsw-btn.is-active{background:#fff; color:var(--ink); box-shadow:0 1px 3px rgba(20,40,60,.14);}",
    ".skills-widget .wsw-caption{font-size:.92rem; color:var(--sub); margin:.2rem 0 1rem; min-height:1.3em;}",
    ".skills-widget .wsw-caption b{color:var(--ink);}",
    ".skills-widget .wsw-row{display:grid; grid-template-columns:26px 168px 1fr 46px; align-items:center; gap:.55rem; margin:.32rem 0;}",
    ".skills-widget .wsw-row.cte{grid-template-columns:36px 168px 1fr 62px; margin:.42rem 0;}",
    ".skills-widget .wsw-row.cte .wsw-rank{font-size:.72rem;}",
    ".skills-widget .wsw-thead{margin:.1rem 0 .5rem; padding-bottom:.35rem; border-bottom:1px solid var(--line);}",
    ".skills-widget .wsw-thead div{font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--sub);}",
    ".skills-widget .wsw-thead div:nth-child(1){text-align:center;}",
    ".skills-widget .wsw-thead div:nth-child(2){text-align:right;}",
    ".skills-widget .wsw-thead div:nth-child(4){text-align:center;}",
    ".skills-widget .wsw-rank{font-size:.8rem; font-weight:700; color:var(--sub); text-align:center;}",
    ".skills-widget .wsw-label{font-size:.84rem; text-align:right; color:var(--ink);}",
    ".skills-widget .wsw-label .dot{width:9px; height:9px; margin-left:.35rem; vertical-align:-1px;}",
    ".skills-widget .wsw-track{background:#F1F4F6; border-radius:5px; height:22px; overflow:hidden;}",
    ".skills-widget .wsw-bar{height:100%; width:0; border-radius:5px; transition:width .55s cubic-bezier(.22,.61,.36,1), background-color .3s ease; position:relative;}",
    ".skills-widget .wsw-bar-rank{position:absolute; left:4px; top:50%; transform:translateY(-50%); font-size:.7rem; font-weight:700; color:#fff; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,.3);}",
    ".skills-widget .wsw-bar.human{background:var(--human);}",
    ".skills-widget .wsw-bar.tech{background:var(--tech);}",
    ".skills-widget .wsw-bar.ai{background:var(--ai);}",
    ".skills-widget .wsw-bar.ocean{background:var(--ocean);}",
    ".skills-widget .wsw-val{font-size:.84rem; font-weight:700; color:var(--ink);}",
    ".skills-widget .wsw-std{font-size:.8rem; color:var(--ink); line-height:1.3;}",
    ".skills-widget .wsw-std b{font-weight:700;}",
    "/* Coverage tags are deliberately neutral so they don't collide with the",
    "   category legend colors, which label the skills themselves. */",
    ".skills-widget .wsw-fit{font-size:.64rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; border-radius:4px; padding:3px 0; text-align:center;}",
    ".skills-widget .wsw-fit.strong{background:var(--ink); color:#fff;}",
    ".skills-widget .wsw-fit.partial{background:#8A94A0; color:#fff;}",
    ".skills-widget .wsw-fit.gap{background:#fff; border:1px solid var(--tech); color:var(--sub);}",
    "/* Match-up view: two columns of chips with SVG lines drawn between them. */",
    ".skills-widget .wsw-match{position:relative; display:flex; justify-content:space-between;}",
    ".skills-widget .wsw-match-svg{position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;}",
    ".skills-widget .wsw-mcol{display:flex; flex-direction:column; gap:.45rem; width:42%; position:relative; z-index:1;}",
    ".skills-widget .wsw-mcol.right{width:36%; justify-content:space-between;}",
    ".skills-widget .wsw-mcol-h{font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--sub); margin-bottom:.15rem;}",
    ".skills-widget .wsw-mcol.left .wsw-mcol-h{text-align:right;}",
    ".skills-widget .wsw-mitem{font-size:.78rem; line-height:1.25; background:#F1F4F6; border-radius:6px; padding:.35rem .55rem; color:var(--ink);}",
    ".skills-widget .wsw-mcol.left .wsw-mitem{text-align:right;}",
    ".skills-widget .wsw-mitem .dot{width:9px; height:9px; margin-left:.35rem; vertical-align:-1px;}",
    ".skills-widget .wsw-mitem.is-gap{background:#fff; border:1px dashed var(--tech); color:var(--sub);}",
    ".skills-widget .wsw-mnum{font-weight:700; color:var(--sub); margin-right:.3rem;}",
    "/* Both columns are interactive: right chips open the detail panel, left",
    "   chips highlight their match lines. */",
    ".skills-widget .wsw-mcol.right .wsw-mitem{display:flex; align-items:center; gap:.45rem; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease;}",
    ".skills-widget .wsw-mcol.right .wsw-mitem .dot{flex:none; width:9px; height:9px; margin:0;}",
    ".skills-widget .wsw-mtext{flex:1;}",
    ".skills-widget .wsw-mcol.right .wsw-mitem:not(.is-active):hover{background:#E6EAEE;}",
    ".skills-widget .wsw-mcol.left .wsw-mitem{cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease;}",
    ".skills-widget .wsw-mcol.left .wsw-mitem:not(.is-active):hover{background:#E6EAEE;}",
    ".skills-widget .wsw-mitem.is-active{background:var(--ink); color:#fff;}",
    ".skills-widget .wsw-mitem.is-active .wsw-mnum{color:#C9D2DA;}",
    ".skills-widget .wsw-minfo{flex:none; width:16px; height:16px; line-height:14px; text-align:center; font-size:.75rem; font-weight:700; color:var(--sub); border:1px solid #D5DBE1; border-radius:50%; background:#fff;}",
    ".skills-widget .wsw-mitem.is-active .wsw-minfo{color:var(--ink);}",
    ".skills-widget .wsw-mhint{font-size:.76rem; color:var(--sub); margin:.65rem 0 0; font-style:italic;}",
    ".skills-widget .wsw-detail{display:none; margin-top:.7rem; border:1px solid var(--line); border-left:4px solid var(--human); border-radius:8px; padding:.75rem .9rem; background:#FBFCFD;}",
    ".skills-widget .wsw-detail h4{margin:0 0 .3rem; font-size:.95rem; color:var(--ink);}",
    ".skills-widget .wsw-detail-match{font-size:.76rem; color:var(--sub); margin:0 0 .55rem;}",
    ".skills-widget .wsw-mtag{display:inline-block; border-radius:999px; padding:1px 8px; font-size:.68rem; font-weight:700; margin:0 .25rem .15rem .1rem;}",
    ".skills-widget .wsw-mtag.human{background:#E0F1F2; color:var(--human);}",
    ".skills-widget .wsw-mtag.tech{background:#EEF1F4; color:var(--sub);}",
    ".skills-widget .wsw-mtag.ai{background:#FBF1D9; color:#8A6A00;}",
    ".skills-widget .wsw-mtag.ocean{background:#E3EEF9; color:var(--ocean);}",
    ".skills-widget .wsw-detail-desc{font-size:.82rem; color:var(--ink); margin:0 0 .55rem;}",
    "/* Whole-anchor (strong) matches: the description itself is the covered text,",
    "   and every sub-standard gets a lighter tint than the specifically-mapped ones. */",
    ".skills-widget .wsw-detail-desc.is-covered{background:#E0F1F2; padding:.5rem .6rem; border-radius:5px; box-shadow:inset 3px 0 0 var(--human);}",
    ".skills-widget .wsw-detail li.is-covered-whole{background:#F0F7F8; color:var(--ink);}",
    ".skills-widget .wsw-mwhole{display:block; margin-top:.3rem; font-style:italic;}",
    ".skills-widget .wsw-detail ul{list-style:none; margin:0; padding:0;}",
    ".skills-widget .wsw-detail li{font-size:.78rem; color:var(--sub); margin:.22rem 0; padding:.24rem .45rem; border-radius:5px; line-height:1.35;}",
    ".skills-widget .wsw-detail li b{color:var(--ink); margin-right:.3rem;}",
    ".skills-widget .wsw-detail li.is-covered{background:#E0F1F2; color:var(--ink); box-shadow:inset 3px 0 0 var(--human);}",
    ".skills-widget .wsw-covlabel{display:inline-block; margin-left:.4rem; font-size:.64rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--human);}",
    ".skills-widget .wsw-legend{display:flex; flex-wrap:wrap; gap:.4rem 1.1rem; margin:1rem 0 .5rem; font-size:.8rem; color:var(--sub);}",
    ".skills-widget .wsw-key{display:inline-flex; align-items:center; gap:.4rem;}",
    ".skills-widget .dot{width:11px; height:11px; border-radius:3px; display:inline-block;}",
    ".skills-widget .dot.human{background:var(--human);}",
    ".skills-widget .dot.tech{background:var(--tech);}",
    ".skills-widget .dot.ai{background:var(--ai);}",
    ".skills-widget .dot.ocean{background:var(--ocean);}",
    ".skills-widget .wsw-source{font-size:.74rem; color:#8A94A0; margin:.4rem 0 0; line-height:1.4;}",
    "@media (max-width:520px){",
    "  .skills-widget .wsw-row{grid-template-columns:22px 120px 1fr 40px; gap:.4rem;}",
    "  .skills-widget .wsw-row.cte{grid-template-columns:30px 104px 1fr 50px;}",
    "  .skills-widget .wsw-label{font-size:.78rem;}",
    "  .skills-widget .wsw-rank{font-size:.74rem;}",
    "  .skills-widget .wsw-std{font-size:.74rem;}",
    "  .skills-widget .wsw-mitem{font-size:.7rem; padding:.3rem .4rem;}",
    "  .skills-widget .wsw-mcol{width:44%;}",
    "  .skills-widget .wsw-mcol.right{width:40%;}}",
    "@media print{",
    "  /* Print what's on screen: keep the live chart (and its SVG lines), drop",
    "     only the controls and the hover hint that mean nothing on paper. */",
    "  .skills-widget .wsw-toggle, .skills-widget .wsw-mhint{display:none !important;}",
    "  /* No animation in print; freeze bars at their final width. */",
    "  .skills-widget .wsw-bar{transition:none !important;}",
    "  /* Keep the diagram together on one page where possible. */",
    "  .skills-widget .wsw-match{break-inside:avoid;}",
    "  /* Keep fills/lines when printers drop background colors. */",
    "  .skills-widget .wsw-bar, .skills-widget .dot, .skills-widget .wsw-fit, .skills-widget .wsw-match-svg{-webkit-print-color-adjust:exact; print-color-adjust:exact;}}"
  ].join("\n");

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // Line colors mirror the category dots but nudge "tech" darker so thin lines read.
  var LINE_COLORS = { human: "#0E7C86", tech: "#9AA7B2", ai: "#E0A100", ocean: "#2A6FB0" };
  // Each item on the left gets its own line color (and the same color as a bar on its chip's right edge), so a line can be followed
  // from one side to the other. The dots still show the kind of skill; the colors are only for telling lines apart.
  var LINE_PALETTE = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#4c9a1a", "#c79400", "#a6611a", "#1f78b4", "#b2182b", "#555555", "#12a4b6", "#8c564b", "#7b3fa0"];
  function lineColor(i) { return LINE_PALETTE[i % LINE_PALETTE.length]; }

  function Widget(root, cfg) {
    this.root = root;
    this.cfg = cfg;
    this.data = cfg.data || {};
    this.SKILLS = this.data.skills || [];
    this.BARS = this.data.bars || {};
    this.CAPTIONS = this.data.captions || {};
    this.MATCH_VIEWS = this.data.matchViews || {};
    this.percentMax = cfg.percentMax || 80;
    this.tableView = cfg.tableView || "cte";

    this.currentView = null;
    this.pinned = null; // selection locked by click/tap
    this.shown = null;  // current selection ("a:<id>" or "s:<idx>")

    this.buildScaffold();
    this.wireEvents();

    // Open the default view, then let a matching URL hash override it.
    this.render(cfg.defaultView);
    this.applyHash();
  }

  Widget.prototype.q = function (sel) { return this.root.querySelector(sel); };

  // Build tabs, deep-link anchor targets, and print blocks from config so the
  // post's markup stays down to a title, legend, and source line.
  Widget.prototype.buildScaffold = function () {
    var self = this, cfg = this.cfg, root = this.root;
    this.chart = this.q(".wsw-chart");
    this.caption = this.q(".wsw-caption");
    var toggle = this.q(".wsw-toggle");

    // Deep-link anchor targets: invisible <a id> elements just before the widget,
    // one per tab or hidden view that declares an anchor. Also record hash->view.
    this.hashViews = {};
    var anchors = document.createDocumentFragment();
    (cfg.tabs || []).concat(cfg.hiddenViews || []).forEach(function (t) {
      if (!t.anchor) return;
      self.hashViews["#" + t.anchor] = t.view;
      if (document.getElementById(t.anchor)) return;
      var a = document.createElement("a");
      a.id = t.anchor;
      a.setAttribute("aria-hidden", "true");
      a.setAttribute("tabindex", "-1");
      a.style.cssText = "display:block;height:0;overflow:hidden;";
      anchors.appendChild(a);
    });
    if (root.parentNode) root.parentNode.insertBefore(anchors, root);

    // Tab buttons, in config order.
    if (toggle) {
      (cfg.tabs || []).forEach(function (t) {
        var b = document.createElement("button");
        b.className = "wsw-btn";
        b.setAttribute("data-view", t.view);
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", "false");
        if (t.anchor) b.setAttribute("data-anchor", t.anchor);
        b.innerHTML = t.label;
        toggle.appendChild(b);
      });
    }

  };

  // --- Row builders -------------------------------------------------------

  // Dispatch a view to its renderer: match view, standards table, or bars.
  // The active view prints as-is (the live chart is shown in print), so there is
  // no separate static print rendering.
  Widget.prototype.buildRows = function (view, staticWidth) {
    if (this.MATCH_VIEWS[view]) return this.buildMatch(view);
    if (view === this.tableView) return this.buildTable();
    return this.buildBars(this.BARS[view] || [], staticWidth);
  };

  // Horizontal bars. A row with a numeric `val` renders as a percent bar; a row
  // without one renders by rank (position). `rank2025`, when present, prints the
  // prior-year rank inside the bar. When staticWidth is true (print), the final
  // width is baked in so it renders without the screen animation.
  Widget.prototype.buildBars = function (rows, staticWidth) {
    var max = this.percentMax, html = "";
    rows.forEach(function (d, i) {
      var width, valText;
      if (d.val !== undefined && d.val !== null) {
        width = (d.val / max) * 100;
        valText = d.val + "%";
      } else {
        width = ((rows.length - i) / rows.length) * 100;
        valText = "";
      }
      // A row may fix its own width (equal-length bars) and its own value text.
      if (d.w !== undefined && d.w !== null) width = d.w;
      if (d.valText !== undefined && d.valText !== null) valText = d.valText;
      var barAttr = staticWidth ? 'style="width:' + width + '%"' : 'data-w="' + width + '"';
      var rankInner = "";
      if (d.rank2025 !== undefined) {
        var rankText = d.rank2025 ? d.rank2025 : "—";
        rankInner = '<span class="wsw-bar-rank">' + rankText + '</span>';
      }
      html += '<div class="wsw-row">'
        + '<div class="wsw-rank">' + (i + 1) + '</div>'
        + '<div class="wsw-label">' + d.name + '</div>'
        + '<div class="wsw-track"><div class="wsw-bar ' + d.cls + '" ' + barAttr + '>' + rankInner + '</div></div>'
        + '<div class="wsw-val">' + valText + '</div>'
        + '</div>';
    });
    return html;
  };

  // The standards table: each skill against its mapped anchor standard + coverage.
  Widget.prototype.buildTable = function () {
    var html = '<div class="wsw-row cte wsw-thead">'
      + '<div>Rank</div><div>WEF skill</div><div>Standard</div><div>Coverage</div>'
      + '</div>';
    this.SKILLS.forEach(function (d) {
      html += '<div class="wsw-row cte">'
        + '<div class="wsw-rank">' + (d.rank ? d.rank : "2030") + '</div>'
        + '<div class="wsw-label">' + d.name + ' <i class="dot ' + d.cls + '"></i></div>'
        + '<div class="wsw-std">' + d.std + '</div>'
        + '<div class="wsw-fit ' + d.fit + '">' + d.fit + '</div>'
        + '</div>';
    });
    return html;
  };

  // The match-up view: skills on the left, standards on the right, SVG lines between.
  // The left column of a match view: the view's own `left` list when it has one (links' `s` then index
  // that list), otherwise the shared employer-skill list.
  Widget.prototype.leftOf = function (mcfg) { return mcfg.left || this.SKILLS; };

  Widget.prototype.buildMatch = function (view) {
    var mcfg = this.MATCH_VIEWS[view];
    var linked = {};
    mcfg.links.forEach(function (l) { linked[l.s] = true; });
    var html = '<div class="wsw-match">'
      + '<svg class="wsw-match-svg" preserveAspectRatio="none"></svg>'
      + '<div class="wsw-mcol left"><div class="wsw-mcol-h">' + (mcfg.leftTitle || "WEF skills (2025 &amp; 2030)") + '</div>';
    this.leftOf(mcfg).forEach(function (d, i) {
      html += '<div class="wsw-mitem' + (linked[i] ? '' : ' is-gap') + '" data-skill="' + i + '" role="button" tabindex="0"'
        + (linked[i] ? ' style="box-shadow:inset -4px 0 0 ' + lineColor(i) + '"' : '') + '>'
        + d.name + ' <i class="dot ' + d.cls + '"></i></div>';
    });
    html += '</div><div class="wsw-mcol right"><div class="wsw-mcol-h">' + mcfg.rightTitle + '</div>';
    mcfg.anchors.forEach(function (a) {
      html += '<div class="wsw-mitem" data-anchor="' + a.id + '" role="button" tabindex="0" aria-expanded="false">'
        + '<i class="dot ' + a.cls + '"></i>'
        + '<span class="wsw-mtext"><span class="wsw-mnum">' + a.disp + '</span>' + a.name + '</span>'
        + '<span class="wsw-minfo" aria-hidden="true">+</span></div>';
    });
    html += '</div></div>'
      + '<p class="wsw-mhint">' + (mcfg.hint || 'Hover or tap a skill on the left to light up its matches, or an item on the right to read its full text and see where the employer skills land.') + '</p>'
      + '<div class="wsw-detail"></div>';
    return html;
  };

  // --- Match-up interaction ----------------------------------------------

  // Draw curved connectors between skill chips and standard chips. Positions
  // come from the rendered layout, so this runs after render and on resize.
  Widget.prototype.drawMatchLines = function () {
    var mcfg = this.MATCH_VIEWS[this.currentView];
    var box = this.q(".wsw-match");
    if (!mcfg || !box) return;
    var svg = box.querySelector(".wsw-match-svg");
    var br = box.getBoundingClientRect();
    if (br.width === 0) return;
    svg.setAttribute("viewBox", "0 0 " + br.width + " " + br.height);
    var recs = [], paths = "";
    mcfg.links.forEach(function (l) {
      var s = box.querySelector('.wsw-mitem[data-skill="' + l.s + '"]');
      var t = box.querySelector('.wsw-mitem[data-anchor="' + l.a + '"]');
      if (!s || !t) return;
      var sr = s.getBoundingClientRect(), tr = t.getBoundingClientRect();
      recs.push({ l: l, sr: sr, tr: tr, y1: sr.top + sr.height / 2 - br.top, y2: tr.top + tr.height / 2 - br.top, d1: 0, d2: 0 });
    });
    // Where several lines meet one chip, fan them out along its edge, ordered by where they go, so they leave side by side
    // instead of in one bundle and cross less.
    function spread(key, other, off) {
      var groups = {};
      recs.forEach(function (r) { var k = key(r); (groups[k] = groups[k] || []).push(r); });
      Object.keys(groups).forEach(function (k) {
        var g = groups[k].sort(function (a, b) { return other(a) - other(b); });
        var h = g[0].sr && key === keyS ? g[0].sr.height : g[0].tr.height;
        var step = Math.min(4, Math.max(0, (h - 8) / Math.max(1, g.length - 1)));
        g.forEach(function (r, n) { r[off] = (n - (g.length - 1) / 2) * step; });
      });
    }
    function keyS(r) { return r.l.s; }
    function keyA(r) { return r.l.a; }
    spread(keyS, function (r) { return r.y2; }, "d1");
    spread(keyA, function (r) { return r.y1; }, "d2");
    // Partial (dashed) lines first, so the solid ones sit on top. Each line has a white casing underneath so a crossing is readable.
    recs.sort(function (a, b) { return (a.l.w === "partial" ? 0 : 1) - (b.l.w === "partial" ? 0 : 1); });
    recs.forEach(function (r) {
      var l = r.l;
      var x1 = r.sr.right - br.left + 2, y1 = r.y1 + r.d1;
      var x2 = r.tr.left - br.left - 2, y2 = r.y2 + r.d2;
      var mx = (x1 + x2) / 2;
      var d = 'M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
      var attrs = ' data-a="' + l.a + '" data-s="' + l.s + '" d="' + d + '" fill="none"';
      paths += '<path class="wsw-halo"' + attrs + ' stroke="#fff" stroke-width="5" opacity=".85"/>';
      paths += '<path class="wsw-line"' + attrs + ' stroke="' + lineColor(l.s) + '" stroke-width="2.25"'
        + (l.w === "partial" ? ' stroke-dasharray="6 4" opacity=".9"' : ' opacity="1"') + '/>';
    });
    svg.innerHTML = paths;
    if (this.shown !== null) this.highlightLines(this.shown);
  };

  // Emphasize the lines of one selection ("a:<id>" or "s:<idx>"); null restores all.
  Widget.prototype.highlightLines = function (sel) {
    var box = this.q(".wsw-match");
    if (!box) return;
    var attr = sel && sel.charAt(0) === "a" ? "data-a" : "data-s";
    var val = sel ? sel.slice(2) : null;
    Array.prototype.forEach.call(box.querySelectorAll(".wsw-match-svg path"), function (p) {
      var halo = p.getAttribute("class") === "wsw-halo";
      if (sel === null) { p.style.opacity = ""; p.style.strokeWidth = ""; }
      else if (p.getAttribute(attr) === val) { p.style.opacity = halo ? ".9" : "1"; p.style.strokeWidth = halo ? "6.5" : "3.5"; }
      else { p.style.opacity = halo ? "0" : ".1"; p.style.strokeWidth = ""; }
    });
  };

  Widget.prototype.anchorMatches = function (mcfg, n) {
    var SKILLS = this.leftOf(mcfg), out = [];
    mcfg.links.forEach(function (l) {
      if (l.a === n) out.push({ name: SKILLS[l.s].name, cls: SKILLS[l.s].cls, w: l.w });
    });
    return out;
  };

  // Open the detail panel for a standard chip (right column).
  Widget.prototype.showDetail = function (n, scroll) {
    var mcfg = this.MATCH_VIEWS[this.currentView];
    var panel = this.q(".wsw-detail");
    var box = this.q(".wsw-match");
    if (!mcfg || !panel || !box) return;
    var d = mcfg.details[n];
    var a = null;
    mcfg.anchors.forEach(function (x) { if (x.id === n) a = x; });
    if (!d || !a) return;
    var unit = a.unit || "standard";
    var matches = this.anchorMatches(mcfg, n);
    var strongNames = [];
    matches.forEach(function (m) { if (m.w === "strong") strongNames.push(m.name); });
    var mhtml;
    if (matches.length) {
      mhtml = "Matched " + (mcfg.leftNoun || "employer skills") + ": ";
      matches.forEach(function (m) {
        mhtml += '<span class="wsw-mtag ' + m.cls + '">' + m.name + ' (' + m.w + ')</span>';
      });
      if (strongNames.length) {
        mhtml += '<span class="wsw-mwhole">A strong match means the whole ' + unit + ' is '
          + strongNames.join(" and ") + ": the description and every item below count toward it.</span>";
      }
    } else {
      mhtml = mcfg.leftNoun ? "None of the " + mcfg.leftNoun + " point here." : "No skill on the WEF employer list points here.";
    }
    var html = '<h4>' + a.disp + ' ' + a.name + '</h4>'
      + '<p class="wsw-detail-match">' + mhtml + '</p>'
      + '<p class="wsw-detail-desc' + (strongNames.length ? ' is-covered' : '') + '">' + d.desc + '</p>';
    if (d.subs.length) {
      html += '<ul>';
      d.subs.forEach(function (s) {
        var cov = mcfg.covered[s.n];
        var cls = cov ? ' class="is-covered"' : (strongNames.length ? ' class="is-covered-whole"' : '');
        html += '<li' + cls + '><b>' + s.n + '</b>' + s.t
          + (cov ? '<span class="wsw-covlabel">' + cov + '</span>' : '') + '</li>';
      });
      html += '</ul>';
    }
    panel.innerHTML = html;
    panel.style.display = "block";
    this.shown = "a:" + n;
    this.highlightLines(this.shown);
    this.markActive(this.shown);
    if (scroll) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Highlight a skill's lines (left column). Skill chips carry no document text,
  // only their matches, so there's no detail panel.
  Widget.prototype.showSkill = function (i) {
    var box = this.q(".wsw-match");
    if (!box) return;
    var panel = this.q(".wsw-detail");
    if (panel) panel.style.display = "none";
    this.shown = "s:" + i;
    this.highlightLines(this.shown);
    this.markActive(this.shown);
  };

  // Sync is-active / aria / +- icons on every chip against a selection key.
  Widget.prototype.markActive = function (sel) {
    var box = this.q(".wsw-match");
    if (!box) return;
    var pinned = this.pinned;
    Array.prototype.forEach.call(box.querySelectorAll(".wsw-mitem"), function (c) {
      var key = c.hasAttribute("data-anchor") ? "a:" + c.getAttribute("data-anchor") : "s:" + c.getAttribute("data-skill");
      var active = key === sel;
      c.classList.toggle("is-active", active);
      if (c.hasAttribute("data-anchor")) {
        c.setAttribute("aria-expanded", active ? "true" : "false");
        var icon = c.querySelector(".wsw-minfo");
        if (icon) icon.textContent = (active && pinned === sel) ? "×" : "+";
      }
    });
  };

  Widget.prototype.clearSelection = function () {
    var panel = this.q(".wsw-detail");
    if (panel) panel.style.display = "none";
    this.shown = null;
    this.highlightLines(null);
    this.markActive(null);
  };

  Widget.prototype.selectChip = function (chip, fromClick) {
    if (chip.hasAttribute("data-anchor")) this.showDetail(chip.getAttribute("data-anchor"), fromClick);
    else this.showSkill(parseInt(chip.getAttribute("data-skill"), 10));
  };

  // --- Wiring -------------------------------------------------------------

  Widget.prototype.wireEvents = function () {
    var self = this, root = this.root;

    // Tab clicks switch views.
    root.addEventListener("click", function (e) {
      var btn = e.target.closest(".wsw-btn");
      if (btn && root.contains(btn)) { self.render(btn.getAttribute("data-view")); return; }
    });

    // Hover previews; click/tap pins (tap again to close). The hover preview
    // lingers so the panel below stays readable while the mouse travels to it.
    root.addEventListener("mouseover", function (e) {
      if (self.pinned !== null) return;
      var chip = e.target.closest(".wsw-mitem[data-anchor], .wsw-mitem[data-skill]");
      if (chip) self.selectChip(chip, false);
    });
    // Leaving the interactive area (e.g. back up into the prose) drops the hover
    // preview and restores all lines, matching the tab's initial state. The
    // notes panel sits inside the chart, so moving down into it to read or
    // scroll the notes does not count as leaving.
    this.chart.addEventListener("mouseleave", function () {
      if (self.pinned !== null) return;
      if (self.MATCH_VIEWS[self.currentView]) self.clearSelection();
    });
    root.addEventListener("click", function (e) {
      var chip = e.target.closest(".wsw-mitem[data-anchor], .wsw-mitem[data-skill]");
      if (!chip) return;
      var key = chip.hasAttribute("data-anchor") ? "a:" + chip.getAttribute("data-anchor") : "s:" + chip.getAttribute("data-skill");
      if (self.pinned === key) { self.pinned = null; self.clearSelection(); }
      else { self.pinned = key; self.selectChip(chip, true); self.markActive(key); }
    });
    root.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var chip = e.target.closest ? e.target.closest(".wsw-mitem[data-anchor], .wsw-mitem[data-skill]") : null;
      if (!chip) return;
      e.preventDefault();
      chip.click();
    });

    // Links with class "wsw-jump" flip the widget to a view and scroll to it.
    // Delegated so it covers in-prose links and the dynamically-rendered caption.
    document.addEventListener("click", function (e) {
      var link = e.target.closest(".wsw-jump");
      if (!link) return;
      e.preventDefault();
      self.render(link.getAttribute("data-view") || self.cfg.defaultView);
      root.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Redraw match lines when the layout width changes.
    var redraw = function () { if (self.MATCH_VIEWS[self.currentView]) self.drawMatchLines(); };
    window.addEventListener("resize", redraw);
    window.addEventListener("load", redraw);
    // The page prints the live chart; if switching to print re-flows the widget
    // to a new width, remeasure so the SVG lines still land on their chips.
    window.addEventListener("beforeprint", redraw);
    if (window.matchMedia) {
      var mq = window.matchMedia("print");
      var onmq = function (e) { if (e.matches) redraw(); };
      if (mq.addEventListener) mq.addEventListener("change", onmq);
      else if (mq.addListener) mq.addListener(onmq);
    }
  };

  Widget.prototype.render = function (view) {
    if (!view) return;
    this.currentView = view;
    this.pinned = null;
    this.shown = null;

    // Sync tab button state (a hidden view leaves every tab inactive).
    Array.prototype.forEach.call(this.root.querySelectorAll(".wsw-btn"), function (b) {
      var on = b.getAttribute("data-view") === view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });

    this.chart.innerHTML = this.buildRows(view, false);
    this.caption.innerHTML = this.CAPTIONS[view] || "";

    var self = this;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self.chart.querySelectorAll(".wsw-bar").forEach(function (b) {
          b.style.width = b.getAttribute("data-w") + "%";
        });
        self.drawMatchLines();
      });
    });
  };

  // Deep-link support: a matching hash switches the widget to that view on
  // load. Views whose tab is hidden still render via their anchor. An
  // optional "?a=<id>" or "?s=<idx>" suffix on the hash also opens (and pins)
  // one chip in a match view, e.g. "#wef-skills-match?a=7" for anchor "7" in
  // the "match" view's chip list.
  Widget.prototype.applyHash = function () {
    var hash = window.location.hash;
    var qIdx = hash.indexOf("?");
    var base = qIdx === -1 ? hash : hash.slice(0, qIdx);
    var view = this.hashViews[base];
    if (view) this.render(view);
    if (qIdx === -1 || !this.MATCH_VIEWS[this.currentView]) return;
    var params = hash.slice(qIdx + 1), m;
    if ((m = /(?:^|&)a=([^&]+)/.exec(params))) {
      var id = decodeURIComponent(m[1]);
      this.pinned = "a:" + id;
      this.showDetail(id, true);
    } else if ((m = /(?:^|&)s=([^&]+)/.exec(params))) {
      var idx = decodeURIComponent(m[1]);
      this.pinned = "s:" + idx;
      this.showSkill(parseInt(idx, 10));
    }
  };

  // Registry of named datasets. The data lives in a companion file that calls
  // registerDataset once loaded; posts reference a dataset by name.
  var datasets = {};
  function registerDataset(name, ds) { datasets[name] = ds; }

  function assign(target, src) {
    if (src) for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    return target;
  }

  function init(cfg) {
    injectCss();
    var el = cfg && cfg.el;
    var root = typeof el === "string" ? document.querySelector(el)
      : (el || document.getElementById("wef-skills-widget"));
    if (!root) return null;

    // Resolve data: start from the named dataset, then let anything passed
    // inline on cfg.data override it, then merge caption overrides on top.
    var base = (cfg.dataset && datasets[cfg.dataset]) || {};
    var inline = cfg.data || {};
    var captions = assign(assign(assign({}, base.captions), inline.captions), cfg.captions);
    cfg.data = {
      bars: inline.bars || base.bars || {},
      skills: inline.skills || base.skills || [],
      matchViews: inline.matchViews || base.matchViews || {},
      captions: captions
    };
    if (cfg.percentMax == null) {
      cfg.percentMax = inline.percentMax != null ? inline.percentMax : base.percentMax;
    }
    return new Widget(root, cfg);
  }

  global.SkillsWidget = { init: init, registerDataset: registerDataset };
})(window);
