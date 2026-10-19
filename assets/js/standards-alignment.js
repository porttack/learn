// Standards alignment widget: reads a published carrier JSON
// (standards/data/carriers/<slug>.json, see _standards/carriers/README.md)
// client-side and lists standards covered, each with the catalog's own short
// description of what the code means (not just our note on how a lesson
// covers it). Reference-page filename + anchor-id prefix + catalog filename
// per framework -- the reference-page scheme must match
// tools/build_alignment.py's own (S- for castandards/csta2017, T- for apcsp
// topics/csta2026/ca-ict-anchor).
//
// Two modes, both driven by the same .standards-alignment[data-carrier-url]
// markup:
//   - Per-lesson (data-chapter set, see _includes/standards-alignment.html):
//     only codes whose locators include this page's chapter/slug.
//   - Pathway-level summary (no data-chapter, e.g. unplugged/index.md): every
//     code the carrier covers anywhere, deduplicated.
//
// Embeddable on another site (e.g. porttack.com): optional data-base prefixes
// every /standards/... URL this script builds (catalog fetch, reference-page
// links, map/report links), so a page on a different origin can point back at
// this site's published data and pages instead of its own root. learn's own
// pages never set it, so they're unaffected. Optional data-scope-label swaps
// the word "pathway" in summary-mode link text for something that fits a
// non-pathway carrier (e.g. "unit").
var STANDARDS_FRAMEWORKS = {
  apcsp: { file: 'apcsp-standards-reference.html', prefix: 'T', name: 'AP Computer Science Principles', catalog: 'apcsp' },
  castandards: { file: 'ca-cs-standards-reference.html', prefix: 'S', name: 'California Computer Science', catalog: 'castandards' },
  csta2017: { file: 'csta2017-standards-reference.html', prefix: 'S', name: 'CSTA 2017', catalog: 'csta2017' },
  csta2026: { file: 'csta2026-standards-reference.html', prefix: 'T', name: 'CSTA 2026', catalog: 'csta2026' },
  'ca-ict-anchor': { file: 'ca-ict-anchor-standards-reference.html', prefix: 'T', name: 'CA CTE (ICT)', catalog: 'ca-ict-anchor' },
  'iste-digital-citizen': { file: 'iste-digital-citizen-standards-reference.html', prefix: 'T', name: 'ISTE Digital Citizen', catalog: 'iste-digital-citizen' },
  'unesco-mil': { file: 'unesco-mil-standards-reference.html', prefix: 'T', name: 'UNESCO Media and Information Literacy', catalog: 'unesco-mil' },
  'unesco-ai-cfs': { file: 'unesco-ai-cfs-standards-reference.html', prefix: 'T', name: 'UNESCO AI Competency Framework for Students', catalog: 'unesco-ai-cfs' },
  'aasl-engage': { file: 'aasl-engage-standards-reference.html', prefix: 'T', name: 'AASL Engage (National School Library Standards)', catalog: 'aasl-engage' },
  casel: { file: 'casel-standards-reference.html', prefix: 'T', name: 'CASEL (Social-Emotional Learning)', catalog: 'casel' },
  'cde-tsel': { file: 'cde-tsel-standards-reference.html', prefix: 'T', name: 'California Transformative SEL (T-SEL)', catalog: 'cde-tsel' },
  ruler: { file: 'ruler-standards-reference.html', prefix: 'T', name: 'RULER Approach', catalog: 'ruler' },
  'via-character': { file: 'via-character-standards-reference.html', prefix: 'T', name: 'VIA Character Strengths', catalog: 'via-character' }
};

function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s == null ? '' : s;
  return div.innerHTML;
}

// Each catalog framework nests its codes differently -- see
// _standards/carriers/README.md and standards/data/catalog/*.json. apcsp
// topics have a short title; everything else only has a one-sentence
// paraphrase, shown in full -- these are single sentences already, and
// truncating them by word count tends to cut off right before the
// sentence's actual point (many read "setup -- payload").
function catalogLabel(fw, catalogData, code) {
  if (!catalogData) return null;
  if (fw === 'apcsp') {
    var topic = (catalogData.topics || []).filter(function (t) { return t.code === code; })[0];
    return topic ? (topic.title || topic.paraphrase) : null;
  }
  if (fw === 'castandards' || fw === 'csta2026' || fw === 'csta2017') {
    var std = (catalogData.standards || []).filter(function (s) { return s.code === code; })[0];
    return std ? std.paraphrase : null;
  }
  if (fw === 'ca-ict-anchor') {
    var groups = (catalogData.anchor_standards || []).concat(((catalogData.pathway || {}).standards) || []);
    var label = null;
    groups.forEach(function (g) {
      (g.items || []).forEach(function (item) {
        if (item.code === code) label = item.paraphrase;
      });
    });
    return label;
  }
  if (catalogData.groups) {
    // Shared shape for iste-digital-citizen/unesco-mil/unesco-ai-cfs: {groups:
    // [{items: [{code, paraphrase}]}]}. See tools/build_alignment.py's
    // render_grouped for the full shape.
    var label2 = null;
    catalogData.groups.forEach(function (g) {
      (g.items || []).forEach(function (item) {
        if (item.code === code) label2 = item.paraphrase;
      });
    });
    return label2;
  }
  return null;
}

document.querySelectorAll('.standards-alignment[data-carrier-url]').forEach(function (section) {
  // Compared as text: pico's locators are chapter numbers, unplugged's are
  // page slugs. Absent entirely in pathway-summary mode (see file header).
  var chapter = section.getAttribute('data-chapter');
  var carrierSlug = section.getAttribute('data-carrier-slug');
  var base = section.getAttribute('data-base') || '';
  var scopeLabel = section.getAttribute('data-scope-label') || 'pathway';
  fetch(section.getAttribute('data-carrier-url'))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return null;
      var groups = [];
      Object.keys(STANDARDS_FRAMEWORKS).forEach(function (fw) {
        var coverage = (data.coverage || {})[fw] || {};
        var items = [];
        Object.keys(coverage).forEach(function (code) {
          var entry = coverage[code];
          if (!chapter) {
            // Pathway summary: every code this carrier covers, anywhere.
            items.push({ code: code, note: entry.note });
            return;
          }
          if (entry.locators && entry.locators.some(function (l) { return String(l) === chapter; })) {
            // locator_notes (optional) says how *this* page covers the code,
            // when the shared note describes several pages at once.
            var own = (entry.locator_notes || {})[chapter];
            items.push({ code: code, note: own || entry.note });
          }
        });
        if (items.length) groups.push({ fw: fw, items: items });
      });
      if (!groups.length) return null;
      // Only fetch the catalogs actually needed for the frameworks matched above.
      return Promise.all(groups.map(function (g) {
        var catalogUrl = base + '/standards/data/catalog/' + STANDARDS_FRAMEWORKS[g.fw].catalog + '.json';
        return fetch(catalogUrl).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      })).then(function (catalogs) {
        return { groups: groups, catalogs: catalogs };
      });
    })
    .then(function (result) {
      if (!result) return;
      var html = '';
      result.groups.forEach(function (g, i) {
        var meta = STANDARDS_FRAMEWORKS[g.fw];
        var catalogData = result.catalogs[i];
        html += '<h3>' + escapeHtml(meta.name) + '</h3><ul>';
        g.items.forEach(function (item) {
          var url = base + '/standards/' + meta.file + '#' + meta.prefix + '-' + encodeURIComponent(item.code);
          var label = catalogLabel(g.fw, catalogData, item.code);
          html += '<li><a href="' + url + '">' + escapeHtml(item.code) + '</a>' +
            (label ? ' — <em>' + escapeHtml(label) + '</em>' : '') +
            (item.note ? '<p class="standards-note">' + escapeHtml(item.note) + '</p>' : '') +
            '</li>';
        });
        html += '</ul>';
      });
      if (carrierSlug) {
        var mapUrl = base + '/standards/?only=' + encodeURIComponent(carrierSlug) + '&view=open-all';
        var html2suffix;
        if (chapter) {
          // &locator=<chapter> narrows the report to just this lesson's own
          // coverage instead of the whole pathway's -- see
          // filterCoverageToLocator() in standards-coverage.js. The report
          // page itself offers a "View all of <pathway>" link back out, so
          // this is never a dead end.
          var reportUrl = base + '/standards/?report=' + encodeURIComponent(carrierSlug) + '&locator=' + encodeURIComponent(chapter) + '&view=open-all';
          html2suffix = '<a href="' + reportUrl + '">View this lesson\'s own report</a>';
        } else {
          var pathwayReportUrl = base + '/standards/?report=' + encodeURIComponent(carrierSlug) + '&view=open-all';
          html2suffix = '<a href="' + pathwayReportUrl + '">View this ' + escapeHtml(scopeLabel) + '\'s own report</a>';
        }
        // scopeLabel here always names the whole carrier/source (e.g.
        // "pathway", or porttack's "category"/"unit"), never the single
        // lesson -- this link filters the map to everything the carrier
        // covers, not just this page's own locator.
        html += '<p class="standards-alignment-links">' +
          '<a href="' + mapUrl + '">See this ' + escapeHtml(scopeLabel) + ' on the full standards map</a> &middot; ' +
          html2suffix + '</p>';
      }
      section.querySelector('.standards-alignment-body').innerHTML = html;
      section.hidden = false;
    })
    .catch(function () {});
});
