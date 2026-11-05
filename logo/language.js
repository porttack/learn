// The reference page (language.html): clicking an example sends it to the page it is shown in.
// (This was an inline script in the upstream copy. It is a file here so our policy can forbid inline scripts,
// and it sends to this site only, not to any window at all.)
document.addEventListener('DOMContentLoaded', function() {
  Array.from(document.querySelectorAll('.example')).forEach(function(e) {
    e.title = 'Click to try this example';
    e.addEventListener('click', function() {
      if (!window.parent || window.parent === window) return;
      var text = this.textContent || this.innerText;
      window.parent.postMessage({
        example: text
      }, window.location.origin);
    });
  });
});
