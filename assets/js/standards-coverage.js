/* Renders /standards/'s coverage map client-side from standards/data/*.json.
 *
 * This is a JS port of tools/build_alignment.py's Coverage class (the join
 * between a framework's catalog codes and every carrier's reverse map) and
 * tools/build_coverage_map.py's panel renderers (now retired -- that script
 * rendered this same page server-side, once, with every source always
 * shown). Keeping the two in sync is a matter of re-reading Coverage's
 * methods if this ever needs to change; there's no shared code between
 * Python and JS, just the same logic written twice on purpose, since the
 * catalog/carrier JSON shape is the actual contract, not the code that
 * reads it.
 *
 * Every code's full covering-source list is computed once, at initial
 * render, and stored on its badge. Toggling a source checkbox never
 * re-fetches or re-parses anything -- it just re-walks the (~284, small)
 * already-rendered badges and recomputes each one's visible bars and
 * has-coverage state against the current checkbox set.
 */
(function () {
  'use strict';

  var DATA_BASE = 'data/';
  var STRAND_ORDER = ['CS', 'NI', 'DA', 'AP', 'IC'];
  var CHAP_REF_RE = /\bchap(\d{2})([a-z]?)\b/g;

  // The sources panel is a <details>, closed by default in the markup --
  // for now, an admin skimming this page doesn't need the raw source list
  // (with its Primary/Secondary sub-groups) inviting a click before they've
  // even looked at coverage. A reader can still open it by hand regardless
  // of screen width; this only sets the *initial* state.

  // Drag-to-resize the sources sidebar, desktop only (the resizer itself is
  // display:none under the mobile breakpoint, where the layout stacks
  // instead of sitting side by side -- a column width has nothing to mean
  // there). Sets flex-basis directly on the aside; that inline value beats
  // the stylesheet's own flex shorthand for just that one longhand, so no
  // other layout rule needs to change. Session-only, not persisted.
  (function wirePanelResizer() {
    var resizer = document.getElementById('panel-resizer');
    var aside = document.getElementById('source-picker');
    if (!resizer || !aside) return;
    var MIN_WIDTH = 180;
    var MAX_WIDTH = 560;
    var dragging = false;

    resizer.addEventListener('mousedown', function (e) {
      if (window.matchMedia('(max-width: 780px)').matches) return;
      dragging = true;
      resizer.classList.add('is-dragging');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var layoutLeft = document.querySelector('.layout').getBoundingClientRect().left;
      var width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - layoutLeft));
      aside.style.flexBasis = width + 'px';
    });
    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('is-dragging');
      document.body.style.userSelect = '';
    });
  })();

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function humanizeChapterRefs(text, interludeLetters) {
    interludeLetters = interludeLetters || {};
    return text.replace(CHAP_REF_RE, function (_, num, letter) {
      var key = String(parseInt(num, 10)) + letter;
      return interludeLetters[key] ? 'Interlude ' + interludeLetters[key] : 'Chapter ' + key;
    });
  }

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch ' + url + ' (' + r.status + ')');
      return r.json();
    });
  }

  // ---------- Locator rendering: shared by makeCoverage (many sources, keyed
  // by slug) and the per-source report (just the one carrier's own meta) ----------

  // The ?readonly suffix is specific to working_in_python's JupyterLite setup
  // (always link the static read-only view, never the live notebook pane) --
  // opt-in via meta.readonly_suffix, not assumed for every source with a
  // locator_url_template. A plain single-page source just wants its own URL
  // back, no notebook-specific query string tacked on.
  function locatorUrlFor(meta, locator, anchorSlug) {
    var template = meta.locator_url_template;
    if (!template) return null;
    var padded = String(locator);
    if (meta.locator_kind === 'chapter') {
      var m = /^(\d+)([a-zA-Z]*)$/.exec(String(locator));
      if (m) padded = ('00' + m[1]).slice(-2) + m[2];
    }
    var url = template.replace('{base_url}', meta.base_url || '').replace('{locator}', padded);
    if (meta.readonly_suffix) {
      url += anchorSlug ? '?readonly#' + anchorSlug : '?readonly';
    } else if (anchorSlug) {
      url += '#' + anchorSlug;
    }
    return url;
  }

  // locator_kind "none" (a source with no real sub-units, e.g. a single blog
  // post) skips the "Chapter"/"Unit" noun entirely and just shows that
  // locator's own title -- "Unit post" would imply structure that doesn't
  // exist.
  function locatorClauseFor(meta, locator, anchor) {
    var interludeLetter = (meta.interlude_letters || {})[String(locator)];
    var locatorTitle = (meta.locator_titles || {})[String(locator)];
    var text;
    if (interludeLetter) {
      text = 'Interlude ' + interludeLetter;
    } else if (meta.locator_kind === 'none') {
      text = locatorTitle || 'the source';
    } else {
      text = (meta.locator_kind === 'chapter' ? 'Chapter ' : 'Unit ') + locator;
    }
    var sectionTitle = anchor && anchor.title;
    if (sectionTitle) text += ' – ' + sectionTitle;
    else if (locatorTitle && meta.locator_kind !== 'none') text += ' (' + locatorTitle + ')';
    var url = locatorUrlFor(meta, locator, anchor && anchor.slug);
    return url ? '<a href="' + esc(url) + '">' + esc(text) + '</a>' : esc(text);
  }

  // ---------- Coverage: one instance per framework, joins catalog codes against carriers ----------

  function makeCoverage(carrierFiles, framework) {
    var byCode = {};
    var sourceMeta = {};
    Object.keys(carrierFiles).forEach(function (source) {
      sourceMeta[source] = carrierFiles[source].meta || {};
      var entries = (carrierFiles[source].coverage || {})[framework] || {};
      Object.keys(entries).forEach(function (code) {
        (byCode[code] = byCode[code] || []).push({ source: source, entry: entries[code] });
      });
    });

    function get(code) {
      return byCode[code] || [];
    }

    function locatorClause(source, locator, anchor) {
      return locatorClauseFor(sourceMeta[source] || {}, locator, anchor);
    }

    // Not (checked:true with no locators) -- an acknowledged, explicit gap is
    // the one case that does NOT count as covering.
    function isCovering(entry) {
      return !(entry.checked && !(entry.locators || []).length);
    }

    // {source, strength} rather than a bare source list -- strength (set only
    // on some entries; see carriers/README.md) rides along so a badge's bars
    // can be dimmed for a "partial"/"related" match instead of looking
    // identical to a "strong" one.
    function allCovering(code) {
      return get(code)
        .filter(function (e) { return isCovering(e.entry); })
        .map(function (e) { return { source: e.source, strength: e.entry.strength || null }; });
    }

    // When no checked/visible source actually covers the code, fall back to
    // listing every source that does (checked or not) -- a badge sitting there
    // white/unassigned given the current picker selection is exactly when a
    // teacher wants to know which other source they could turn a source on
    // for, not just "Unassigned" with nothing to act on.
    function carrierHtml(code, visibleSources) {
      var allEntries = get(code);
      var checkedCovering = allEntries.filter(function (e) {
        return visibleSources.has(e.source) && isCovering(e.entry);
      });
      var fallback = !checkedCovering.length;
      var entries = fallback
        ? allEntries.filter(function (e) { return isCovering(e.entry); })
        : allEntries.filter(function (e) { return visibleSources.has(e.source); });
      if (!entries.length) return 'Unassigned';
      var lines = entries.map(function (e) {
        var source = e.source, entry = e.entry;
        var locs = entry.locators || [];
        var anchors = entry.anchors || {};
        var abbrev = esc((sourceMeta[source] || {}).abbrev || source);
        var text;
        if (locs.length) {
          text = locs.map(function (loc) { return locatorClause(source, loc, anchors[String(loc)]); }).join(', ');
          if (entry.strength && entry.strength !== 'strong') {
            text += ' <span class="tt-source-strength">(' + esc(entry.strength) + ')</span>';
          }
        } else if (entry.checked) {
          text = 'Not covered';
        } else {
          text = 'No locator on record';
        }
        return '<strong>' + abbrev + '</strong>: ' + text;
      });
      var note = fallback
        ? '<div class="tt-source-note">Not covered by any selected source. Covered elsewhere by:</div>'
        : '';
      return note + lines.join('<br>');
    }

    function noteFor(code, source) {
      var found = get(code).filter(function (e) { return e.source === source; })[0];
      if (!found || !found.entry.note) return null;
      return humanizeChapterRefs(found.entry.note, (sourceMeta[source] || {}).interlude_letters);
    }

    return { allCovering: allCovering, carrierHtml: carrierHtml, noteFor: noteFor };
  }

  // ---------- Panel/group/badge rendering ----------

  var badgeRegistry = []; // { el, code, framework, covering: [source,...] }

  // ---------- Crosswalk: hand-built code-to-code comparisons between two frameworks ----------
  //
  // Separate from Coverage (which joins a framework's own catalog against content
  // carriers) -- this joins two *catalogs* against each other, for the "compare
  // these standards' actual wording" feature in each badge's tooltip. Populated
  // once at boot from manifest.crosswalks; a framework/code with no row here just
  // renders no cross-reference, same as an unmapped carrier renders "Unassigned".
  var crosswalkIndex = {}; // "<framework> <code>" -> [{framework, code, strength, note}, ...]
  var catalogEntryByCode = {}; // framework -> code -> catalog standard entry (for the compare-text expansion)
  var FRAMEWORK_LABELS = { castandards: 'CA', csta2017: 'CSTA 2017' };

  function frameworkLabel(framework) {
    return FRAMEWORK_LABELS[framework] || framework;
  }

  function buildCrosswalkIndex(crosswalkResults) {
    var index = {};
    function add(framework, code, entry) {
      var key = framework + ' ' + code;
      (index[key] = index[key] || []).push(entry);
    }
    crosswalkResults.forEach(function (pair) {
      var meta = pair[0], data = pair[1];
      var a = meta.between[0], b = meta.between[1];
      (data.crosswalk || []).forEach(function (row) {
        add(a, row[a], { framework: b, code: row[b], strength: row.strength, note: row.note });
        add(b, row[b], { framework: a, code: row[a], strength: row.strength, note: row.note });
      });
    });
    return index;
  }

  function lookupCrossRefs(framework, code) {
    return crosswalkIndex[framework + ' ' + code] || [];
  }

  function crosswalkHtml(refs) {
    if (!refs.length) return '';
    return '<div class="tt-crosswalk">' + refs.map(function (r) {
      var other = (catalogEntryByCode[r.framework] || {})[r.code];
      var detail = other
        ? '<div class="tt-xref-code">' + esc(r.code) + (other.strand_name ? ' · ' + esc(other.strand_name) : '') + '</div>' +
          '<div class="tt-xref-text">' + esc(other.paraphrase) + '</div>' +
          (r.note ? '<div class="tt-xref-note">' + esc(r.note) + '</div>' : '')
        : esc(r.code);
      return (
        '<button type="button" class="tt-xref-toggle" aria-expanded="false">' +
        '<span class="tt-xref-chevron">▸</span> ↔ ' + esc(frameworkLabel(r.framework)) + ' ' + esc(r.code) +
        ' <span class="tt-xref-strength">(' + esc(r.strength) + ')</span>' +
        '</button>' +
        '<div class="tt-xref-detail" hidden>' + detail + '</div>'
      );
    }).join('') + '</div>';
  }

  // A sub-type accent (a faint border/shadow tint on each badge, showing which
  // Big Idea/Strand/Concept it belongs to) only reads as information, not noise,
  // when there are few enough groups to keep every hue clearly distinct at a
  // glance -- past that it degrades into near-duplicate colors, which is worse
  // than no color at all. So this is a threshold, not a per-framework special
  // case: any section with more groups than MAX_TINTED_GROUPS (CA ICT's 11
  // anchor groups + 10 Pathway C groups, well past it) just renders untinted,
  // the same as if tinting didn't exist. Hue is spaced evenly around the wheel
  // by index/total -- generated, not a hand-picked palette, since there's
  // nothing here worth curating per group.
  var MAX_TINTED_GROUPS = 8;

  function groupHue(index, total) {
    if (total <= 1 || total > MAX_TINTED_GROUPS) return null;
    return Math.round((index * 360) / total);
  }

  function badgeHtml(framework, code, displayCode, title, paraphrase, hue) {
    var heading = title ? esc(code) + ' · ' + esc(title) : esc(code);
    var tintAttrs = hue === null || hue === undefined ? '' : ' data-tinted="true" style="--group-hue:' + hue + 'deg"';
    return (
      '<div class="cov-badge" data-framework="' + esc(framework) + '" data-code="' + esc(code) + '"' + tintAttrs + '>' +
      '<button class="cov-badge-btn" type="button" aria-expanded="false" aria-label="' + esc(code) + '">' + esc(displayCode) + '</button>' +
      '<div class="cov-bars"></div>' +
      '<div class="cov-tooltip" role="dialog">' +
      '<div class="tt-code">' + heading + '</div>' +
      '<div class="tt-paraphrase">' + esc(paraphrase) + '</div>' +
      crosswalkHtml(lookupCrossRefs(framework, code)) +
      '<div class="tt-source"></div>' +
      '</div>' +
      '</div>'
    );
  }

  function renderGroupGrid(label, entries, framework, hue) {
    // entries: [{code, displayCode, title, paraphrase}]
    var badges = entries.map(function (e) {
      return badgeHtml(framework, e.code, e.displayCode, e.title, e.paraphrase, hue);
    }).join('\n');
    return (
      '<div class="cov-group">' +
      '<div class="cov-group-title">' + esc(label) + '</div>' +
      '<div class="cov-grid">' + badges + '</div>' +
      '</div>'
    );
  }

  function renderApcspPanel(catalog) {
    var bigIdeas = {};
    catalog.big_ideas.forEach(function (b) { bigIdeas[b.id] = b; });
    var order = catalog.big_ideas.slice().sort(function (a, b) { return a.number - b.number; }).map(function (b) { return b.id; });
    var byBigIdea = {};
    catalog.topics.forEach(function (t) {
      (byBigIdea[t.big_idea] = byBigIdea[t.big_idea] || []).push({ code: t.code, displayCode: t.code, title: t.title, paraphrase: t.paraphrase });
    });
    // Computational Thinking Practices deliberately omitted: never reverse-mapped
    // in this data, and too broad/cross-cutting to be a meaningful coverage
    // question here.
    return order.map(function (bid, i) {
      var bi = bigIdeas[bid];
      var label = 'Big Idea ' + bi.number + ': ' + bi.name + ' (' + bi.mcq_weight_low + '–' + bi.mcq_weight_high + '%)';
      return renderGroupGrid(label, byBigIdea[bid] || [], 'apcsp', groupHue(i, order.length));
    }).join('\n');
  }

  // Shared by castandards.json and csta2017.json -- both are a flat
  // strand/grade_band-tagged standards list (CS/NI/DA/AP/IC), just from
  // different frameworks, so the same grouping logic renders either one.
  function renderCastandardsPanel(catalog, gradeBand, framework) {
    framework = framework || 'castandards';
    var strandNames = {};
    var byStrand = {};
    catalog.standards.forEach(function (s) {
      if (s.grade_band !== gradeBand) return;
      strandNames[s.strand] = s.strand_name;
      var display = s.code.indexOf(gradeBand + '.') === 0 ? s.code.slice(gradeBand.length + 1) : s.code;
      (byStrand[s.strand] = byStrand[s.strand] || []).push({ code: s.code, displayCode: display, title: null, paraphrase: s.paraphrase });
    });
    // Hue keyed by each strand's fixed position in STRAND_ORDER (not its index
    // among only-the-strands-present-in-this-band), so e.g. "AP" gets the same
    // accent color in both the 6-8 and 9-12 panels.
    return STRAND_ORDER.filter(function (s) { return byStrand[s]; }).map(function (strand) {
      var hue = groupHue(STRAND_ORDER.indexOf(strand), STRAND_ORDER.length);
      return renderGroupGrid(strand + ' · ' + strandNames[strand], byStrand[strand], framework, hue);
    }).join('\n');
  }

  // A code's prefix (before the first hyphen) is its level/tier: MS/HS for
  // the core Middle School/High School bands, S1/S2 for the two elective
  // Specialty tiers. Concept names are shared across tiers (e.g. "Physical
  // Computing" holds both S1-PHY-* and S2-PHY-* codes), so without an
  // explicit sub-grouping a reader has nothing but the badge's own code
  // text to tell two similar-looking entries apart.
  var LEVEL_LABELS = { MS: 'Middle School', HS: 'High School', S1: 'Specialty I', S2: 'Specialty II' };

  function renderCsta2026Panel(catalog) {
    var order = [];
    var byConcept = {};
    catalog.standards.forEach(function (s) {
      if (!byConcept[s.concept]) order.push(s.concept);
      var display = s.code.indexOf('HS-') === 0 ? s.code.slice(3) : s.code;
      (byConcept[s.concept] = byConcept[s.concept] || []).push({ code: s.code, displayCode: display, title: null, paraphrase: s.paraphrase });
    });
    return order.map(function (concept, i) {
      var entries = byConcept[concept];
      var hue = groupHue(i, order.length);
      var tierOrder = [];
      var byTier = {};
      entries.forEach(function (e) {
        var prefix = e.code.split('-')[0];
        var tier = LEVEL_LABELS[prefix] || prefix;
        if (!byTier[tier]) tierOrder.push(tier);
        (byTier[tier] = byTier[tier] || []).push(e);
      });
      if (tierOrder.length <= 1) {
        return renderGroupGrid(concept, entries, 'csta2026', hue);
      }
      var badges = tierOrder.map(function (tier) {
        return (
          '<div class="cov-subgroup"><h4>' + esc(tier) + '</h4>' +
          '<div class="cov-grid">' + byTier[tier].map(function (e) {
            return badgeHtml('csta2026', e.code, e.displayCode, e.title, e.paraphrase, hue);
          }).join('\n') + '</div></div>'
        );
      }).join('\n');
      return '<div class="cov-group"><div class="cov-group-title">' + esc(concept) + '</div>' + badges + '</div>';
    }).join('\n');
  }

  function renderCaIctPanel(catalog) {
    function renderSubgroup(grp, hue) {
      var entries = (grp.items || []).map(function (item) {
        return { code: item.code, displayCode: item.code, title: null, paraphrase: item.paraphrase };
      });
      var badges = entries.map(function (e) { return badgeHtml('ca-ict-anchor', e.code, e.displayCode, e.title, e.paraphrase, hue); }).join('\n');
      return '<div class="cov-subgroup"><h4>' + esc(grp.code) + ' ' + esc(grp.name) + '</h4><div class="cov-grid">' + badges + '</div></div>';
    }
    // Both blocks are well past MAX_TINTED_GROUPS (11 anchors, 10 Pathway C
    // groups) so groupHue() returns null for every one of them today -- this
    // isn't an ICT special case, just the same threshold rule landing on "no
    // tint" here. If either list ever shrank under the cap, tinting would
    // start applying automatically.
    var body = ['<div class="cov-anchor-block">', '<h3 class="cov-subpanel-heading">Anchor Standards (cross-sector)</h3>'];
    catalog.anchor_standards.forEach(function (grp, i) {
      body.push(renderSubgroup(grp, groupHue(i, catalog.anchor_standards.length)));
    });
    body.push('</div>');
    body.push('<h3 class="cov-subpanel-heading">Pathway C: ' + esc(catalog.pathway.name) + '</h3>');
    catalog.pathway.standards.forEach(function (grp, i) {
      body.push(renderSubgroup(grp, groupHue(i, catalog.pathway.standards.length)));
    });
    return body.join('\n');
  }

  // ---------- Per-source report: everything one carrier covers, rendered
  // live from the same fetched catalogs/carrierFiles as the badge grid above
  // -- no separate build step, no pre-generated file to go stale. Same
  // .cov-panel/data-panel-category/<details> shape as the panels above, so
  // wirePanelActions() (Open all/Close all/Show CA*) drives this exactly the
  // same way with no code of its own. Unlike the grid, only codes this
  // source actually covers get a card; the %-covered figure on each
  // section/subsection heading is what tells you the rest of the shape
  // (including the parts it covers nothing in) without listing every
  // uncovered code as an empty placeholder. ----------

  function isCoveringEntry(entry) {
    return !(entry.checked && !(entry.locators || []).length);
  }

  function pctLabel(covered, total) {
    if (!total) return '0/0';
    return covered + '/' + total + ' (' + Math.round((covered / total) * 100) + '%)';
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // A source's ?only=/?report= value may be its slug or its abbrev
  // (case-insensitive) -- e.g. "LB" for little_brother -- so a hand-typed or
  // hand-embedded link doesn't have to get the internal slug exactly right.
  function resolveSourceSlug(raw, manifest) {
    if (!raw) return null;
    var lower = raw.toLowerCase();
    var byAbbrev = null;
    for (var i = 0; i < manifest.sources.length; i++) {
      var s = manifest.sources[i];
      if (s.slug === raw) return s.slug;
      if (!byAbbrev && s.abbrev && s.abbrev.toLowerCase() === lower) byAbbrev = s.slug;
    }
    return byAbbrev;
  }

  function reportCard(anchorPrefix, item, entry, meta) {
    var anchor = anchorPrefix + '-' + item.code;
    var titleBit = item.title ? ' ' + esc(item.title) : '';
    var scopeNote = item.scopeNote ? '<p class="note">' + esc(item.scopeNote) + '</p>' : '';
    var locs = entry.locators || [];
    var anchors = entry.anchors || {};
    var clause = locs.length
      ? locs.map(function (loc) { return locatorClauseFor(meta, loc, anchors[String(loc)]); }).join(', ')
      : 'Covered, no locator on record';
    if (entry.strength && entry.strength !== 'strong') {
      clause += ' <span class="tt-source-strength">(' + esc(entry.strength) + ')</span>';
    }
    var note = entry.note
      ? '<p class="note">' + esc(humanizeChapterRefs(entry.note, meta.interlude_letters)) + '</p>'
      : '';
    return (
      '<div class="topic" id="' + esc(anchor) + '">' +
      '<h3><a class="anchor-link" href="#' + esc(anchor) + '">#</a><span class="code-badge">' + esc(item.code) + '</span>' + titleBit + '</h3>' +
      '<p class="paraphrase">' + esc(item.paraphrase) + '</p>' +
      scopeNote +
      '<p class="meta">' + clause + '</p>' +
      note +
      '</div>'
    );
  }

  function reportSubsection(id, heading, items, coveredDict, anchorPrefix, meta) {
    var covered = 0;
    var cards = [];
    items.forEach(function (item) {
      var entry = coveredDict[item.code];
      if (!entry || !isCoveringEntry(entry)) return;
      covered++;
      cards.push(reportCard(anchorPrefix, item, entry, meta));
    });
    var total = items.length;
    return {
      total: total,
      covered: covered,
      html:
        '<details class="report-subsection" id="' + esc(slugify(id)) + '"' + (covered > 0 ? ' open' : '') + '>' +
        '<summary>' + esc(heading) + ' <span class="pct-tag">' + pctLabel(covered, total) + '</span></summary>' +
        (cards.length ? cards.join('') : '<p class="report-empty">Nothing recorded here.</p>') +
        '</details>'
    };
  }

  function reportSection(category, heading, refHref, subsections) {
    var totalAll = 0, coveredAll = 0;
    subsections.forEach(function (s) { totalAll += s.total; coveredAll += s.covered; });
    var headingHtml =
      '<h2><a class="panel-ref-link" href="' + esc(refHref) + '">' + esc(heading) + '</a> ' +
      '<span class="pct-tag">' + pctLabel(coveredAll, totalAll) + '</span></h2>';
    return (
      '<div class="cov-panel" data-panel-category="' + esc(category) + '">' +
      '<details open><summary>' + headingHtml + '</summary>' +
      subsections.map(function (s) { return s.html; }).join('\n') +
      '</details></div>'
    );
  }

  function reportApcspSection(catalog, coveredDict, meta) {
    var bigIdeas = {};
    catalog.big_ideas.forEach(function (b) { bigIdeas[b.id] = b; });
    var order = catalog.big_ideas.slice().sort(function (a, b) { return a.number - b.number; }).map(function (b) { return b.id; });
    var byBigIdea = {};
    catalog.topics.forEach(function (t) { (byBigIdea[t.big_idea] = byBigIdea[t.big_idea] || []).push(t); });
    var subs = order.map(function (bid) {
      var bi = bigIdeas[bid];
      var items = (byBigIdea[bid] || []).map(function (t) {
        return { code: t.code, title: t.title, paraphrase: t.paraphrase, scopeNote: null };
      });
      return reportSubsection('rep-apcsp-' + bi.id, 'Big Idea ' + bi.number + ': ' + bi.name, items, coveredDict, 'T', meta);
    });
    return reportSection('ap', 'AP Computer Science Principles', 'apcsp-standards-reference.html', subs);
  }

  // Shared by castandards.json and csta2017.json, same as renderCastandardsPanel
  // above -- both are a flat strand/grade_band-tagged standards list.
  function reportStrandSection(catalog, gradeBand, coveredDict, meta, heading, refHref, category, anchorPrefix) {
    var byStrand = {};
    var strandNames = {};
    catalog.standards.forEach(function (s) {
      if (s.grade_band !== gradeBand) return;
      strandNames[s.strand] = s.strand_name;
      (byStrand[s.strand] = byStrand[s.strand] || []).push(s);
    });
    var subs = STRAND_ORDER.filter(function (s) { return byStrand[s]; }).map(function (strand) {
      var items = byStrand[strand].map(function (s) {
        return { code: s.code, title: null, paraphrase: s.paraphrase, scopeNote: s.scope_note || null };
      });
      return reportSubsection('rep-' + refHref + '-' + gradeBand + '-' + strand, strand + ' · ' + strandNames[strand], items, coveredDict, anchorPrefix, meta);
    });
    return reportSection(category, heading, refHref, subs);
  }

  function reportCsta2026Section(catalog, coveredDict, meta) {
    var order = [];
    var byConcept = {};
    catalog.standards.forEach(function (s) {
      if (!byConcept[s.concept]) order.push(s.concept);
      (byConcept[s.concept] = byConcept[s.concept] || []).push(s);
    });
    var subs = order.map(function (concept) {
      var items = byConcept[concept].map(function (s) {
        return { code: s.code, title: null, paraphrase: s.paraphrase, scopeNote: s.scope_note || null };
      });
      return reportSubsection('rep-csta2026-' + concept, concept, items, coveredDict, 'T', meta);
    });
    return reportSection('csta', 'CSTA 2026', 'csta2026-standards-reference.html', subs);
  }

  function reportCaIctSection(catalog, coveredDict, meta) {
    function flatten(groups) {
      var items = [];
      groups.forEach(function (g) {
        items.push({ code: g.code, title: g.name, paraphrase: g.paraphrase, scopeNote: null });
        (g.items || []).forEach(function (item) {
          items.push({ code: item.code, title: null, paraphrase: item.paraphrase, scopeNote: null });
        });
      });
      return items;
    }
    var subs = [
      reportSubsection('rep-ca-ict-anchor', 'Anchor Standards (cross-sector)', flatten(catalog.anchor_standards), coveredDict, 'T', meta),
      reportSubsection('rep-ca-ict-pathwayc', 'Pathway C: ' + catalog.pathway.name, flatten(catalog.pathway.standards), coveredDict, 'T', meta)
    ];
    return reportSection('ca-ict', 'California CTE (ICT)', 'ca-ict-anchor-standards-reference.html', subs);
  }

  function buildSourceReportHtml(slug, carrierFiles, catalogs) {
    var carrier = carrierFiles[slug] || {};
    var meta = carrier.meta || {};
    var coverage = carrier.coverage || {};
    function covered(fw) { return coverage[fw] || {}; }

    return [
      reportApcspSection(catalogs.apcsp, covered('apcsp'), meta),
      reportStrandSection(catalogs.castandards, '9-12', covered('castandards'), meta, 'California 9-12 Computer Science', 'ca-cs-standards-reference.html', 'ca-hs', 'S'),
      reportStrandSection(catalogs.castandards, '9-12 Specialty', covered('castandards'), meta, 'California 9-12 Specialty', 'ca-cs-standards-reference.html', 'ca-hs', 'S'),
      reportStrandSection(catalogs.csta2017, '9-12', covered('csta2017'), meta, 'CSTA 2017 (Grades 9-12)', 'csta2017-standards-reference.html', 'csta', 'S'),
      reportCsta2026Section(catalogs.csta2026, covered('csta2026'), meta),
      reportCaIctSection(catalogs['ca-ict-anchor'], covered('ca-ict-anchor'), meta),
      reportStrandSection(catalogs.castandards, '6-8', covered('castandards'), meta, 'California 6-8 Computer Science', 'ca-cs-standards-reference.html', 'ca-ms', 'S'),
      reportStrandSection(catalogs.csta2017, '6-8', covered('csta2017'), meta, 'CSTA 2017 (Grades 6-8)', 'csta2017-standards-reference.html', 'csta', 'S')
    ].join('\n');
  }

  function renderReportMode(slug, carrierFiles, catalogs, manifestBySlug) {
    document.body.classList.add('cov-report-mode');
    var meta = manifestBySlug[slug] || {};
    // ?view=<preset> scopes which sections start open, same VIEW_PRESETS ids
    // as the badge grid (e.g. &view=ca-cs or &view=ap-only) -- so a link can
    // be "just this source's CA coverage" or "...AP coverage" instead of
    // always opening the whole report. Defaults to fully expanded.
    var view = new URLSearchParams(window.location.search).get('view') || 'open-all';

    var titleEl = document.querySelector('.page-header h1');
    if (titleEl) titleEl.textContent = (meta.title || slug) + ' — Standards Report';
    var homeLink = document.querySelector('.page-header .home-link');
    if (homeLink) {
      homeLink.textContent = '← Back to Standards Coverage';
      homeLink.setAttribute('href', '?only=' + encodeURIComponent(slug) + '&view=' + encodeURIComponent(view));
    }

    var actionsRow = document.querySelector('.panel-actions');
    if (actionsRow) {
      var printBtn = document.createElement('button');
      printBtn.type = 'button';
      printBtn.className = 'view-toggle-btn print-report-btn';
      printBtn.textContent = 'Print this report';
      printBtn.addEventListener('click', function () { window.print(); });
      actionsRow.appendChild(printBtn);
    }

    document.getElementById('panels').innerHTML = buildSourceReportHtml(slug, carrierFiles, catalogs);

    // Without this, a click on a section's framework-reference link bubbles
    // up to <summary> and also toggles that section closed -- same fix as
    // the badge grid's own panel-ref-link wiring, needed again here since
    // report mode builds its own separate set of these links.
    document.querySelectorAll('.panel-ref-link').forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    var panelActions = wirePanelActions();
    panelActions.applyView(view); // defaults to open-all -- a single source's own report is usually short, no need to narrow it the way "Show CA" narrows the full cross-source catalog
    panelActions.clearActive();

    // Printing a collapsed <details> prints nothing inside it, even with
    // print CSS -- force every one open just for the print, then restore
    // whatever the reader actually had open or closed afterward.
    var reopened = [];
    window.addEventListener('beforeprint', function () {
      reopened = Array.prototype.slice.call(document.querySelectorAll('#panels details:not([open])'));
      reopened.forEach(function (d) { d.setAttribute('open', ''); });
    });
    window.addEventListener('afterprint', function () {
      reopened.forEach(function (d) { d.removeAttribute('open'); });
      reopened = [];
    });
  }

  // ---------- Reactivity: bars + has-coverage state, recomputed on every toggle ----------

  function barHtml(source, manifestBySlug, strength) {
    var m = manifestBySlug[source];
    if (!m) return '';
    var strengthAttrs = strength && strength !== 'strong' ? ' data-strength="' + esc(strength) + '"' : '';
    var title = strength && strength !== 'strong' ? m.title + ' (' + strength + ' match)' : m.title;
    return (
      '<span class="cov-bar" style="border-left-color:var(--hue-' + esc(source) + ')"' + strengthAttrs +
      ' title="' + esc(title) + '">' +
      esc(m.abbrev) +
      '</span>'
    );
  }

  function refreshBadges(checkedSources, manifestBySlug) {
    badgeRegistry.forEach(function (b) {
      var visible = b.covering.filter(function (s) { return checkedSources.has(s.source); });
      b.el.classList.toggle('has-coverage', visible.length > 0);
      b.el.querySelector('.cov-bars').innerHTML = visible.map(function (s) { return barHtml(s.source, manifestBySlug, s.strength); }).join('');
    });
  }

  // ---------- Panel view presets (Open all / Close all / Show CA*), for the panel-level <details> ----------
  //
  // Each panel carries a data-panel-category attribute (set where the panels
  // array is built, below). A preset is just the set of categories to leave
  // open; null means "every category" (Open all). These are mutually
  // exclusive, button-group style, rather than the momentary link-style
  // actions elsewhere on the page (source All/None) -- unlike those, "which
  // preset is active" is durable state a reader benefits from seeing at a
  // glance, so exactly one button stays visually pressed until another preset
  // is chosen or the reader manually opens/closes a panel by hand.
  var VIEW_PRESETS = {
    'open-all': null,
    'close-all': [],
    // Admins reviewing this page care about CA compliance, not CSTA -- so
    // "Show CA" is every non-CSTA panel, not literally every California-named
    // one alone; "HS"/"MS" split that same set by which grade band each panel
    // actually serves (CTE/ICT is a high-school-only pathway, not grade-banded
    // itself, so it rides with HS).
    'ca': ['ap', 'ca-hs', 'ca-ict', 'ca-ms'],
    'ca-hs': ['ap', 'ca-hs', 'ca-ict'],
    'ca-ms': ['ca-ms'],
    // Not tied to a visible view-toggle-btn -- only reachable via a
    // recommendation link (see wireRecommendations) for a class whose
    // relevant panels don't match one of the five buttons above.
    'ca-cs': ['ca-hs', 'ca-ms'],
    'ca-hs-ict': ['ca-hs', 'ca-ict'],
    // Same idea, one framework alone -- e.g. a blog post's own "AP CSP
    // coverage" section linking to just the AP panel, scoped to one source
    // via ?only=<slug>&view=ap-only.
    'ap-only': ['ap']
  };

  function wirePanelActions() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.view-toggle-btn'));
    var panelEls = Array.prototype.slice.call(document.querySelectorAll('.cov-panel'));

    function clearActive() {
      buttons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
    }
    function setActive(btn) {
      clearActive();
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
    }
    function applyView(view) {
      var categories = VIEW_PRESETS[view];
      panelEls.forEach(function (el) {
        var details = el.querySelector('details');
        var show = categories === null || categories.indexOf(el.getAttribute('data-panel-category')) !== -1;
        if (show) details.setAttribute('open', ''); else details.removeAttribute('open');
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyView(btn.getAttribute('data-view'));
        setActive(btn);
      });
    });

    // Default view on first load: admins mainly care about California
    // compliance across both grade bands, so start there rather than
    // everything wide open.
    var defaultBtn = document.getElementById('view-show-ca');
    if (defaultBtn) { applyView('ca'); setActive(defaultBtn); }

    // A manual open/close on any one panel no longer matches a named preset --
    // clear the pressed button so the group doesn't keep claiming a state that
    // no longer holds. Listens on <summary> (the actual user control) rather
    // than the details' "toggle" event, since browsers queue "toggle" as an
    // async task -- listening there would race the setActive() call above and
    // this file's own applyView() calls, clearing a press we just set.
    panelEls.forEach(function (el) {
      el.querySelector('summary').addEventListener('click', clearActive);
    });

    return { applyView: applyView, clearActive: clearActive };
  }

  // ---------- Recommendations: one-click "set up the picker for this class" ----------
  //
  // Each link names the exact set of sources to check (everything else gets
  // unchecked -- "turn on X only") and a view preset id, both mirrored into
  // its own href (?sources=...&view=...) so the link is a real, copyable URL
  // -- right-click "Copy Link", drop it in an email, and opening it lands on
  // this same picker state (see applyParamsFromLocation, called at boot).
  // Where the view id matches one of the five view-toggle-btn elements'
  // data-view (all five now id="view-show-<id>", including the two that
  // read "Open all"/"Close all" rather than "Show ..."), applying it presses
  // that button same as a manual click would; some classes need a panel
  // combination none of those five buttons cover (e.g. CA 9-12 + ICT only,
  // with no AP and no CA 6-8), so those ids exist only in VIEW_PRESETS and
  // are applied directly via panelActions, leaving no view-toggle-btn
  // pressed.
  //
  // sourcesCsv is optional: omitting it (as opposed to passing an empty
  // string) leaves the current source-checkbox selection untouched, so a
  // link can carry just ?view=open-all to set the panel view alone -- e.g.
  // for someone who already has their own sources picked and just wants a
  // different set of panels open -- without also forcing "only these
  // sources" the way a full recommendation link does.
  function applyRecommendation(sourcesCsv, view, handleToggle, panelActions) {
    if (sourcesCsv != null) {
      var wanted = sourcesCsv.split(',').filter(Boolean);
      document.querySelectorAll('#source-list input[type=checkbox]').forEach(function (cb) {
        cb.checked = wanted.indexOf(cb.getAttribute('data-source')) !== -1;
      });
      handleToggle();
    }
    var viewBtn = view && document.getElementById('view-show-' + view);
    if (viewBtn) {
      viewBtn.click();
    } else if (view) {
      panelActions.applyView(view);
      panelActions.clearActive();
    }
  }

  function wireRecommendations(handleToggle, panelActions) {
    document.querySelectorAll('.reco-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sourcesCsv = link.getAttribute('data-sources');
        var view = link.getAttribute('data-view');
        applyRecommendation(sourcesCsv, view, handleToggle, panelActions);
        // Syncs the address bar to this link's own href so "copy from the
        // URL bar" works too, not just right-clicking the sidebar link.
        history.replaceState(null, '', link.getAttribute('href'));
      });
    });
  }

  // Reproduces a recommendation link's state from the URL that loaded this
  // page (?sources=slug,slug&view=id), so a link pasted into an email lands
  // on the same picker state a click on the sidebar would have. Either
  // param may be given alone: ?view=open-all sets just the panel view
  // preset (open-all/close-all/ca/ca-hs/ca-ms/ca-cs/ca-hs-ict -- the same
  // ids VIEW_PRESETS above and the five view-toggle-btn buttons use)
  // without touching source selection, and ?sources=... alone sets just
  // the checked sources without touching whatever view is already showing.
  // Absent or unrecognized params leave the just-applied default (ca)
  // view alone.
  function applyParamsFromLocation(handleToggle, panelActions) {
    var params = new URLSearchParams(window.location.search);
    var sourcesCsv = params.get('sources');
    var view = params.get('view');
    if (!sourcesCsv && !view) return;
    applyRecommendation(sourcesCsv, view, handleToggle, panelActions);
  }

  // ---------- Focus mode: ?only=<source-slug-or-abbrev> selects just that
  // one source and opens every panel -- a link that's easy to hand-embed in
  // that source's own page (e.g. the Little Brother post linking back to
  // /standards/?only=little_brother, or ?only=LB using its abbrev). Unlike
  // ?sources=, which can legitimately hold several slugs for comparison and
  // never claims to mean "just one," this always means exactly one source,
  // and always shows the *whole* catalog with that source highlighted --
  // nothing is hidden by default (an earlier version of this hid every
  // uncovered standard outright, which reads as "here's the shape of this
  // source" when what most readers actually want first is "here's the whole
  // landscape, with this source's coverage highlighted on it"). The
  // "Hide standards not covered" checkbox in the banner is the opt-in for
  // that narrower view.
  function applyOnlyParam(manifest, manifestBySlug, handleToggle, panelActions, hasReport) {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('only');
    if (!raw) return;
    var slug = resolveSourceSlug(raw, manifest);
    var banner = document.getElementById('only-banner');
    if (!banner) return;
    if (!slug) {
      banner.innerHTML = 'Unknown source “' + esc(raw) + '”. <a href="' + esc(window.location.pathname) + '">Show all standards</a>';
      banner.hidden = false;
      return;
    }
    // ?view=<preset> scopes which panels start open (e.g. &view=ca-cs or
    // &view=ap-only, same VIEW_PRESETS ids the badge grid always used) --
    // still highlights this source across the whole catalog either way,
    // just narrows what's open by default. Defaults to every panel open.
    var view = params.get('view') || 'open-all';
    applyRecommendation(slug, view, handleToggle, panelActions);
    var title = (manifestBySlug[slug] || {}).title || slug;
    var reportLink = hasReport(slug) ? ' <a href="?report=' + esc(slug) + (params.get('view') ? '&view=' + esc(params.get('view')) : '') + '">View report</a>' : '';
    banner.innerHTML =
      'Showing standards covered by <strong>' + esc(title) + '</strong>.' + reportLink +
      ' <label class="only-hide-toggle"><input type="checkbox" id="only-hide-uncovered"> Hide standards not covered</label>';
    banner.hidden = false;
    document.getElementById('only-hide-uncovered').addEventListener('change', function (e) {
      document.body.classList.toggle('cov-only-hide', e.target.checked);
    });
  }

  // ---------- Detail panel (click-to-open), built lazily from current checkbox state ----------

  function wireBadgeInteractions(coverageByFramework, getCheckedSources) {
    var open = null;
    function close(b) {
      b.classList.remove('is-open');
      b.querySelector('.cov-badge-btn').setAttribute('aria-expanded', 'false');
      if (open === b) open = null;
    }
    document.querySelectorAll('.cov-badge').forEach(function (b) {
      var btn = b.querySelector('.cov-badge-btn');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = b.classList.contains('is-open');
        if (open) close(open);
        if (wasOpen) return;
        var framework = b.getAttribute('data-framework');
        var code = b.getAttribute('data-code');
        var sourceLine = b.querySelector('.tt-source');
        var checked = getCheckedSources();
        var html = coverageByFramework[framework].carrierHtml(code, checked);
        sourceLine.innerHTML = html === 'Unassigned' ? '' : html;
        b.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        open = b;
      });
    });
    document.addEventListener('click', function (e) {
      if (open && !open.contains(e.target)) close(open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) close(open);
    });
  }

  // A cross-reference chevron expands in place, inside the same tooltip, rather
  // than opening a nested floating tooltip -- so comparing the two standards'
  // actual wording never needs more than one thing open at once. stopPropagation
  // keeps this click from reaching the document-level listener above that closes
  // the badge's tooltip on any outside click.
  function wireCrossRefToggles() {
    document.querySelectorAll('.tt-xref-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        btn.querySelector('.tt-xref-chevron').textContent = expanded ? '▸' : '▾';
        btn.nextElementSibling.hidden = expanded;
      });
    });
  }

  // ---------- Sidebar: one checkbox per manifest source, grouped by how central it is ----------
  //
  // "Primary" carriers actively drive this teacher's lesson choices; "Secondary"
  // ones are occasional/supplemental. That's an editorial judgment about
  // current usage, not a fact recorded on the carrier files themselves, so
  // it's a fixed lookup here rather than manifest/carrier metadata.
  var SOURCE_GROUPS = [
    { label: 'Primary', slugs: ['cmu_cs0', 'cmu_cs1', 'cmu_csp', 'codeorg_apcsp', 'cs50ap', 'cs50ap_extended', 'cs50p', 'codehs_corgi'] },
    { label: 'Secondary', slugs: ['working_in_python', 'little_brother', 'codeorg_csd_1_2', 'codeorg_csd_3a', 'codeorg_csd_3b'] }
  ];

  // A report is pointless for a carrier that covers nothing (an empty/stub
  // file) -- shared by the sidebar's per-source "report" link and the
  // #only-banner's, so neither offers a report with nothing in it.
  function sourceHasCoverage(carrierFiles, slug) {
    var coverage = (carrierFiles[slug] || {}).coverage || {};
    return Object.keys(coverage).some(function (fw) { return Object.keys(coverage[fw] || {}).length > 0; });
  }

  function renderSourcePicker(manifest, carrierFiles, onChange) {
    var list = document.getElementById('source-list');
    var bySlug = {};
    manifest.sources.forEach(function (s) { bySlug[s.slug] = s; });

    function rowHtml(s) {
      var label = esc(s.abbrev) + ': ' + esc(s.title);
      var baseUrl = (carrierFiles[s.slug] || {}).meta && carrierFiles[s.slug].meta.base_url;
      var titleHtml = baseUrl
        ? '<a class="source-title source-link" href="' + esc(baseUrl) + '" target="_blank" rel="noopener">' + label + '</a>'
        : '<span class="source-title">' + label + '</span>';
      // Real, copyable links (not click-intercepted like the .reco-link
      // sidebar shortcuts) -- meant to be right-clicked and pasted into that
      // source's own page, so they need a plain href a reader can grab, not
      // just an in-page behavior. See applyOnlyParam()/#only-banner for what
      // opening "only" actually does. Flowed inline right after the title as
      // plain parenthetical text (not boxed buttons) -- a bordered pill per
      // link per row was too much chrome for a ~260px-wide sidebar, especially
      // once title text itself wraps to two lines.
      var onlyHtml =
        '<a class="source-aux-link" href="?only=' + esc(s.slug) + '&view=open-all" ' +
        'title="Link to just ' + esc(s.title) + '’s standards">only</a>';
      var reportHtml = sourceHasCoverage(carrierFiles, s.slug)
        ? ' · <a class="source-aux-link" href="?report=' + esc(s.slug) + '" ' +
          'title="Printable report of everything ' + esc(s.title) + ' covers">report</a>'
        : '';
      return (
        '<label class="source-row">' +
        '<input type="checkbox" checked class="source-checkbox" data-source="' + esc(s.slug) +
        '" style="--swatch-color:var(--hue-' + esc(s.slug) + ')">' +
        '<span class="source-text">' + titleHtml +
        ' <span class="source-aux">(' + onlyHtml + reportHtml + ')</span></span>' +
        '</label>'
      );
    }

    var groups = SOURCE_GROUPS.map(function (g) {
      return { label: g.label, sources: g.slugs.map(function (slug) { return bySlug[slug]; }).filter(Boolean) };
    });
    // A manifest source that isn't in either group above still needs somewhere
    // to render, or adding a new carrier silently stops offering a way to
    // toggle it off -- rather than assume every future addition remembers to
    // update SOURCE_GROUPS too, anything left over gets its own group.
    var grouped = {};
    SOURCE_GROUPS.forEach(function (g) { g.slugs.forEach(function (slug) { grouped[slug] = true; }); });
    var leftover = manifest.sources.filter(function (s) { return !grouped[s.slug]; });
    if (leftover.length) groups.push({ label: 'Other', sources: leftover });

    list.innerHTML = groups.map(function (g) {
      return (
        '<details class="source-group"><summary>' + esc(g.label) + '</summary>' +
        g.sources.map(rowHtml).join('\n') +
        '</details>'
      );
    }).join('\n');

    var checkboxes = list.querySelectorAll('input[type=checkbox]');
    checkboxes.forEach(function (cb) {
      cb.addEventListener('change', onChange);
    });
    // Without this, a click on the link bubbles up to the <label> and also
    // toggles the checkbox -- native label-forwarding behavior on a click that
    // already did something (navigate), not what a reader clicking a link wants.
    list.querySelectorAll('a.source-link, a.source-aux-link').forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    function setAll(checked) {
      checkboxes.forEach(function (cb) { cb.checked = checked; });
      onChange();
    }
    document.getElementById('source-select-all').addEventListener('click', function () { setAll(true); });
    document.getElementById('source-select-none').addEventListener('click', function () { setAll(false); });
  }

  function checkedSourceSet() {
    var set = new Set();
    document.querySelectorAll('#source-list input[type=checkbox]:checked').forEach(function (cb) {
      set.add(cb.getAttribute('data-source'));
    });
    return set;
  }

  // ---------- Hue CSS custom properties, one pair (light/dark) per source slug ----------

  function injectHueStyle(manifest) {
    var light = manifest.sources.map(function (s) { return '  --hue-' + s.slug + ': ' + s.hue_light + ';'; }).join('\n');
    var dark = manifest.sources.map(function (s) { return '  --hue-' + s.slug + ': ' + s.hue_dark + ';'; }).join('\n');
    var css =
      ':root {\n' + light + '\n}\n' +
      '@media (prefers-color-scheme: dark) {\n:root {\n' + dark + '\n}\n}\n' +
      ':root[data-theme="dark"] {\n' + dark + '\n}\n' +
      ':root[data-theme="light"] {\n' + light + '\n}\n';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- Boot ----------

  fetchJSON(DATA_BASE + 'manifest.json').then(function (manifest) {
    var manifestBySlug = {};
    manifest.sources.forEach(function (s) { manifestBySlug[s.slug] = s; });

    var carrierFetches = manifest.sources.map(function (s) {
      return fetchJSON(DATA_BASE + 'carriers/' + s.file).then(function (data) { return [s.slug, data]; });
    });
    var catalogFetches = manifest.catalog.map(function (name) {
      return fetchJSON(DATA_BASE + 'catalog/' + name + '.json').then(function (data) { return [name, data]; });
    });
    var crosswalkFetches = (manifest.crosswalks || []).map(function (c) {
      return fetchJSON(DATA_BASE + 'crosswalk/' + c.file).then(function (data) { return [c, data]; });
    });

    return Promise.all([Promise.all(carrierFetches), Promise.all(catalogFetches), Promise.all(crosswalkFetches)]).then(function (results) {
      var carrierFiles = {};
      results[0].forEach(function (pair) { carrierFiles[pair[0]] = pair[1]; });
      var catalogs = {};
      results[1].forEach(function (pair) { catalogs[pair[0]] = pair[1]; });
      crosswalkIndex = buildCrosswalkIndex(results[2]);
      manifest.catalog.forEach(function (fw) {
        if (catalogs[fw] && Array.isArray(catalogs[fw].standards)) {
          var byCode = {};
          catalogs[fw].standards.forEach(function (s) { byCode[s.code] = s; });
          catalogEntryByCode[fw] = byCode;
        }
      });

      injectHueStyle(manifest);

      // ?report=<slug-or-abbrev> replaces the badge grid entirely with the
      // per-source report (see renderReportMode above) -- checked before any
      // of the grid's own setup runs, since none of it is needed in this mode.
      var reportSlug = resolveSourceSlug(new URLSearchParams(window.location.search).get('report'), manifest);
      if (reportSlug && carrierFiles[reportSlug]) {
        renderReportMode(reportSlug, carrierFiles, catalogs, manifestBySlug);
        return;
      }

      renderSourcePicker(manifest, carrierFiles, handleToggle);

      var coverageByFramework = {};
      manifest.catalog.forEach(function (fw) { coverageByFramework[fw] = makeCoverage(carrierFiles, fw); });

      // Third element is this panel's data-panel-category, consumed by
      // VIEW_PRESETS in wirePanelActions() to decide what Open all / Close
      // all / Show CA* leave open. Fourth is the standalone reference page for
      // that framework (same ones linked from the sources sidebar's "Standards
      // reference" list) -- California's two grade bands and CSTA 2017's two
      // grade bands each come from one combined catalog, so both panels for a
      // framework point at that framework's single reference page. Fifth,
      // where present, is a plain-text annotation shown after the link (not
      // part of it) -- either the standard's publication year, or for CSTA
      // "national standard", the one-word answer to why an admin unfamiliar
      // with CSTA sees it on this page at all.
      var panels = [
        ['AP Computer Science Principles', renderApcspPanel(catalogs.apcsp), 'ap', 'apcsp-standards-reference.html', '2023'],
        ['California 9-12 Computer Science', renderCastandardsPanel(catalogs.castandards, '9-12', 'castandards'), 'ca-hs', 'ca-cs-standards-reference.html', '2018'],
        ['California 9-12 Specialty', renderCastandardsPanel(catalogs.castandards, '9-12 Specialty', 'castandards'), 'ca-hs', 'ca-cs-standards-reference.html', '2018, non-core'],
        ['CSTA 2017 (Grades 9-12)', renderCastandardsPanel(catalogs.csta2017, '9-12', 'csta2017'), 'csta', 'csta2017-standards-reference.html', 'national standard'],
        ['CSTA 2026', renderCsta2026Panel(catalogs.csta2026), 'csta', 'csta2026-standards-reference.html', 'national standard'],
        ['California CTE (ICT)', renderCaIctPanel(catalogs['ca-ict-anchor']), 'ca-ict', 'ca-ict-anchor-standards-reference.html', '2013'],
        // Last, deliberately: these two are the only middle-school-level panels
        // among otherwise all-high-school frameworks.
        ['California 6-8 Computer Science', renderCastandardsPanel(catalogs.castandards, '6-8', 'castandards'), 'ca-ms', 'ca-cs-standards-reference.html', '2018'],
        ['CSTA 2017 (Grades 6-8)', renderCastandardsPanel(catalogs.csta2017, '6-8', 'csta2017'), 'csta', 'csta2017-standards-reference.html', 'national standard'],
      ];
      // Each panel is a native <details>, open by default -- collapsing one
      // shrinks it to just its title bar (the chevron before the heading),
      // no custom JS toggle logic needed, same mechanism as the sources
      // sidebar. <summary> may contain a single heading element per spec, so
      // the reference link goes inside that heading rather than beside it.
      document.getElementById('panels').innerHTML = panels
        .map(function (p) {
          var annotation = p[4] ? ' <span class="panel-annotation">(' + esc(p[4]) + ')</span>' : '';
          var heading = '<h2><a class="panel-ref-link" href="' + esc(p[3]) + '">' + esc(p[0]) + '</a>' + annotation + '</h2>';
          return '<div class="cov-panel" data-panel-category="' + esc(p[2]) + '"><details open><summary>' + heading + '</summary>' + p[1] + '</details></div>';
        })
        .join('\n');
      // Without this, a click on the link bubbles up to <summary> and also
      // toggles the panel open/closed -- the same fix already applied to the
      // sidebar's source-title links, needed here for the same reason.
      document.querySelectorAll('.panel-ref-link').forEach(function (a) {
        a.addEventListener('click', function (e) { e.stopPropagation(); });
      });
      var panelActions = wirePanelActions();

      badgeRegistry = Array.prototype.slice.call(document.querySelectorAll('.cov-badge')).map(function (el) {
        var framework = el.getAttribute('data-framework');
        var code = el.getAttribute('data-code');
        return { el: el, covering: coverageByFramework[framework].allCovering(code) };
      });

      function handleToggle() {
        refreshBadges(checkedSourceSet(), manifestBySlug);
      }
      handleToggle(); // initial paint, all sources checked

      wireBadgeInteractions(coverageByFramework, checkedSourceSet);
      wireCrossRefToggles();
      wireRecommendations(handleToggle, panelActions);
      applyParamsFromLocation(handleToggle, panelActions);
      applyOnlyParam(manifest, manifestBySlug, handleToggle, panelActions, function (slug) { return sourceHasCoverage(carrierFiles, slug); });
    });
  }).catch(function (err) {
    document.getElementById('panels').innerHTML =
      '<p style="color:#c00">Failed to load standards data: ' + esc(err.message) + '</p>';
    // eslint-disable-next-line no-console
    console.error(err);
  });
})();
