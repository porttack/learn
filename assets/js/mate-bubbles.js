/* Open and close the bubble tooltips and their cross-reference toggles on the MATE pages.
   Same behavior as /standards/: click a bubble to open it, click it again or elsewhere to close,
   Escape closes, and a cross-reference toggle expands in place. */
(function () {
  'use strict';
  function closeAll(except) {
    Array.prototype.forEach.call(document.querySelectorAll('.cov-badge.is-open'), function (b) {
      if (b === except) return;
      b.classList.remove('is-open');
      var btn = b.querySelector('.cov-badge-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.cov-badge-btn') : null;
    if (btn) {
      var badge = btn.parentElement;
      var wasOpen = badge.classList.contains('is-open');
      closeAll(badge);
      badge.classList.toggle('is-open', !wasOpen);
      btn.setAttribute('aria-expanded', String(!wasOpen));
      return;
    }
    var tog = e.target.closest ? e.target.closest('.tt-xref-toggle') : null;
    if (tog) {
      var expanded = tog.getAttribute('aria-expanded') === 'true';
      tog.setAttribute('aria-expanded', String(!expanded));
      var chev = tog.querySelector('.tt-xref-chevron');
      if (chev) chev.textContent = expanded ? '▸' : '▾';
      if (tog.nextElementSibling) tog.nextElementSibling.hidden = expanded;
      return;
    }
    if (!(e.target.closest && e.target.closest('.cov-tooltip'))) closeAll(null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  // The competencies page is an outline of <details> rows. A link or address that points at a row opens it.
  function rows() { return Array.prototype.slice.call(document.querySelectorAll('details.comp-row')); }
  function openFromHash() {
    var h = window.location.hash;
    if (h.length < 2) return;
    var el = document.getElementById(decodeURIComponent(h.slice(1)));
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openFromHash);
  document.addEventListener('DOMContentLoaded', openFromHash);
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-mate-action]') : null;
    if (!b) return;
    var open = b.getAttribute('data-mate-action') === 'open-all';
    rows().forEach(function (r) { r.open = open; });
  });
  // Printing a collapsed <details> prints nothing inside it, so open every row for the print and put them back.
  var wasClosed = [];
  window.addEventListener('beforeprint', function () { wasClosed = rows().filter(function (r) { return !r.open; }); wasClosed.forEach(function (r) { r.open = true; }); });
  window.addEventListener('afterprint', function () { wasClosed.forEach(function (r) { r.open = false; }); wasClosed = []; });
})();
