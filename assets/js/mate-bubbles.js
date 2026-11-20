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
})();
