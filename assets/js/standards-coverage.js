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

    function carrierHtml(code, visibleSources) {
      var entries = get(code).filter(function (e) { return visibleSources.has(e.source); });
      if (!entries.length) return 'Unassigned';
      return entries
        .map(function (e) {
          var source = e.source, entry = e.entry;
          var locs = entry.locators || [];
          var anchors = entry.anchors || {};
          var title = esc((sourceMeta[source] || {}).title || source);
          if (locs.length) {
            var clauses = locs
              .map(function (loc) { return locatorClause(source, loc, anchors[String(loc)]); })
              .join(', ');
            return 'Covered by ' + title + ': ' + clauses;
          }
          if (entry.checked) return 'Not covered by ' + title;
          return 'Covered by ' + title + ', no locator on record';
        })
        .join('; ');
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

  function renderCastandardsPanel(catalog, gradeBand) {
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
      return renderGroupGrid(strand + ' · ' + strandNames[strand], byStrand[strand], 'castandards', hue);
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

  // ---------- Sidebar: one checkbox per manifest source, all checked by default ----------

  function renderSourcePicker(manifest, carrierFiles, onChange) {
    var list = document.getElementById('source-list');
    list.innerHTML = manifest.sources.map(function (s) {
      var label = esc(s.abbrev) + ': ' + esc(s.title);
      var baseUrl = (carrierFiles[s.slug] || {}).meta && carrierFiles[s.slug].meta.base_url;
      var titleHtml = baseUrl
        ? '<a class="source-title source-link" href="' + esc(baseUrl) + '" target="_blank" rel="noopener">' + label + '</a>'
        : '<span class="source-title">' + label + '</span>';
      return (
        '<label class="source-row">' +
        '<input type="checkbox" checked data-source="' + esc(s.slug) + '">' +
        '<span class="swatch" style="background:var(--hue-' + esc(s.slug) + ')"></span>' +
        titleHtml +
        '</label>'
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

    return Promise.all([Promise.all(carrierFetches), Promise.all(catalogFetches)]).then(function (results) {
      var carrierFiles = {};
      results[0].forEach(function (pair) { carrierFiles[pair[0]] = pair[1]; });
      var catalogs = {};
      results[1].forEach(function (pair) { catalogs[pair[0]] = pair[1]; });

      injectHueStyle(manifest);
      renderSourcePicker(manifest, carrierFiles, handleToggle);

      var coverageByFramework = {};
      manifest.catalog.forEach(function (fw) { coverageByFramework[fw] = makeCoverage(carrierFiles, fw); });

      var panels = [
        ['AP Computer Science Principles', renderApcspPanel(catalogs.apcsp)],
        ['California 9-12 Computer Science', renderCastandardsPanel(catalogs.castandards, '9-12')],
        ['CSTA 2026', renderCsta2026Panel(catalogs.csta2026)],
        ['California CTE (ICT)', renderCaIctPanel(catalogs['ca-ict-anchor'])],
        // Last, deliberately: this is the only middle-school-level panel among
        // otherwise all-high-school frameworks.
        ['California 6-8 Computer Science', renderCastandardsPanel(catalogs.castandards, '6-8')],
      ];
      document.getElementById('panels').innerHTML = panels
        .map(function (p) { return '<div class="cov-panel"><h2>' + esc(p[0]) + '</h2>' + p[1] + '</div>'; })
        .join('\n');

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
    });
  }).catch(function (err) {
    document.getElementById('panels').innerHTML =
      '<p style="color:#c00">Failed to load standards data: ' + esc(err.message) + '</p>';
    // eslint-disable-next-line no-console
    console.error(err);
  });
})();
