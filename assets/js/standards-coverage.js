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

  // The sources panel is a <details>, open by default in the markup (so it
  // renders expanded with JS disabled or before this runs). On a narrow
  // screen it starts collapsed instead -- a fixed-width sidebar reads fine on
  // desktop but a full checkbox list shoving the actual content off-screen on
  // a phone is the opposite of useful. Only sets the *initial* state; a
  // reader can still open/close it by hand afterward regardless of width.
  (function collapseSourcesOnNarrowScreens() {
    var details = document.getElementById('source-details');
    if (details && window.matchMedia('(max-width: 780px)').matches) {
      details.removeAttribute('open');
    }
  })();

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

    function locatorUrl(source, locator, anchorSlug) {
      var meta = sourceMeta[source] || {};
      var template = meta.locator_url_template;
      if (!template) return null;
      var padded = String(locator);
      if (meta.locator_kind === 'chapter') {
        var m = /^(\d+)([a-zA-Z]*)$/.exec(String(locator));
        if (m) padded = ('00' + m[1]).slice(-2) + m[2];
      }
      var url = template.replace('{base_url}', meta.base_url || '').replace('{locator}', padded);
      url += anchorSlug ? '?readonly#' + anchorSlug : '?readonly';
      return url;
    }

    function locatorClause(source, locator, anchor) {
      var meta = sourceMeta[source] || {};
      var interludeLetter = (meta.interlude_letters || {})[String(locator)];
      var text;
      if (interludeLetter) {
        text = 'Interlude ' + interludeLetter;
      } else {
        text = (meta.locator_kind === 'chapter' ? 'Chapter ' : 'Unit ') + locator;
      }
      var sectionTitle = anchor && anchor.title;
      var chapterTitle = (meta.locator_titles || {})[String(locator)];
      if (sectionTitle) text += ' – ' + sectionTitle;
      else if (chapterTitle) text += ' (' + chapterTitle + ')';
      var url = locatorUrl(source, locator, anchor && anchor.slug);
      return url ? '<a href="' + esc(url) + '">' + esc(text) + '</a>' : esc(text);
    }

    // Not (checked:true with no locators) -- an acknowledged, explicit gap is
    // the one case that does NOT count as covering.
    function isCovering(entry) {
      return !(entry.checked && !(entry.locators || []).length);
    }

    function allCovering(code) {
      return get(code)
        .filter(function (e) { return isCovering(e.entry); })
        .map(function (e) { return e.source; });
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

  function renderCsta2026Panel(catalog) {
    var order = [];
    var byConcept = {};
    catalog.standards.forEach(function (s) {
      if (!byConcept[s.concept]) order.push(s.concept);
      var display = s.code.indexOf('HS-') === 0 ? s.code.slice(3) : s.code;
      (byConcept[s.concept] = byConcept[s.concept] || []).push({ code: s.code, displayCode: display, title: null, paraphrase: s.paraphrase });
    });
    return order.map(function (concept, i) {
      return renderGroupGrid(concept, byConcept[concept], 'csta2026', groupHue(i, order.length));
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

  // ---------- Reactivity: bars + has-coverage state, recomputed on every toggle ----------

  function barHtml(source, manifestBySlug) {
    var m = manifestBySlug[source];
    if (!m) return '';
    return (
      '<span class="cov-bar" style="border-left-color:var(--hue-' + esc(source) + ')" title="' + esc(m.title) + '">' +
      esc(m.abbrev) +
      '</span>'
    );
  }

  function refreshBadges(checkedSources, manifestBySlug) {
    badgeRegistry.forEach(function (b) {
      var visible = b.covering.filter(function (s) { return checkedSources.has(s); });
      b.el.classList.toggle('has-coverage', visible.length > 0);
      b.el.querySelector('.cov-bars').innerHTML = visible.map(function (s) { return barHtml(s, manifestBySlug); }).join('');
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
    'ca-hs-ict': ['ca-hs', 'ca-ict']
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

    // Default view on first load: admins mainly look at the high-school-facing
    // CA panels, so start there rather than everything wide open.
    var defaultBtn = document.getElementById('view-show-ca-hs');
    if (defaultBtn) { applyView('ca-hs'); setActive(defaultBtn); }

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
  // Each button names the exact set of sources to check (everything else gets
  // unchecked -- "turn on X only") and a view preset id. Where that id matches
  // one of the five view-toggle-btn elements' data-view, clicking it presses
  // that button same as a manual click would; some classes need a panel
  // combination none of those five buttons cover (e.g. CA 9-12 + ICT only,
  // with no AP and no CA 6-8), so those ids exist only in VIEW_PRESETS and are
  // applied directly via panelActions, leaving no view-toggle-btn pressed.
  function wireRecommendations(handleToggle, panelActions) {
    document.querySelectorAll('.reco-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wanted = (btn.getAttribute('data-sources') || '').split(',').filter(Boolean);
        document.querySelectorAll('#source-list input[type=checkbox]').forEach(function (cb) {
          cb.checked = wanted.indexOf(cb.getAttribute('data-source')) !== -1;
        });
        handleToggle();
        var view = btn.getAttribute('data-view');
        var viewBtn = document.getElementById('view-show-' + view);
        if (viewBtn) {
          viewBtn.click();
        } else {
          panelActions.applyView(view);
          panelActions.clearActive();
        }
      });
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
    { label: 'Secondary', slugs: ['working_in_python', 'little_brother'] }
  ];

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
      return (
        '<label class="source-row">' +
        '<input type="checkbox" checked class="source-checkbox" data-source="' + esc(s.slug) +
        '" style="--swatch-color:var(--hue-' + esc(s.slug) + ')">' +
        titleHtml +
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
    list.querySelectorAll('a.source-link').forEach(function (a) {
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
      renderSourcePicker(manifest, carrierFiles, handleToggle);

      var coverageByFramework = {};
      manifest.catalog.forEach(function (fw) { coverageByFramework[fw] = makeCoverage(carrierFiles, fw); });

      // Third element is this panel's data-panel-category, consumed by
      // VIEW_PRESETS in wirePanelActions() to decide what Open all / Close
      // all / Show CA* leave open. Fourth is the standalone reference page for
      // that framework (same ones linked from the sources sidebar's "Standards
      // reference" list) -- California's two grade bands and CSTA 2017's two
      // grade bands each come from one combined catalog, so both panels for a
      // framework point at that framework's single reference page.
      var panels = [
        ['AP Computer Science Principles', renderApcspPanel(catalogs.apcsp), 'ap', 'apcsp-standards-reference.html'],
        ['California 9-12 Computer Science', renderCastandardsPanel(catalogs.castandards, '9-12', 'castandards'), 'ca-hs', 'ca-cs-standards-reference.html'],
        ['CSTA 2017 (Grades 9-12)', renderCastandardsPanel(catalogs.csta2017, '9-12', 'csta2017'), 'csta', 'csta2017-standards-reference.html'],
        ['CSTA 2026', renderCsta2026Panel(catalogs.csta2026), 'csta', 'csta2026-standards-reference.html'],
        ['California CTE (ICT)', renderCaIctPanel(catalogs['ca-ict-anchor']), 'ca-ict', 'ca-ict-anchor-standards-reference.html'],
        // Last, deliberately: these two are the only middle-school-level panels
        // among otherwise all-high-school frameworks.
        ['California 6-8 Computer Science', renderCastandardsPanel(catalogs.castandards, '6-8', 'castandards'), 'ca-ms', 'ca-cs-standards-reference.html'],
        ['CSTA 2017 (Grades 6-8)', renderCastandardsPanel(catalogs.csta2017, '6-8', 'csta2017'), 'csta', 'csta2017-standards-reference.html'],
      ];
      // Each panel is a native <details>, open by default -- collapsing one
      // shrinks it to just its title bar (the chevron before the heading),
      // no custom JS toggle logic needed, same mechanism as the sources
      // sidebar. <summary> may contain a single heading element per spec, so
      // the reference link goes inside that heading rather than beside it.
      document.getElementById('panels').innerHTML = panels
        .map(function (p) {
          var heading = '<h2><a class="panel-ref-link" href="' + esc(p[3]) + '">' + esc(p[0]) + '</a></h2>';
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
    });
  }).catch(function (err) {
    document.getElementById('panels').innerHTML =
      '<p style="color:#c00">Failed to load standards data: ' + esc(err.message) + '</p>';
    // eslint-disable-next-line no-console
    console.error(err);
  });
})();
