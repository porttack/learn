(function () {
  "use strict";

  var DATA_URL = "/assets/data/emoji-list.json";

  var tryInput = document.getElementById("emojize-try-input");
  var tryOutput = document.getElementById("emojize-try-output");
  var searchInput = document.getElementById("emoji-list-search");
  var searchStatus = document.getElementById("emoji-list-status");
  var searchResults = document.getElementById("emoji-list-results");

  if (!tryInput && !searchInput) return;

  var lookup = null; // "name" (no colons) -> emoji char, includes aliases
  var rows = null; // parallel to window.__emojiEntries: {tr, name, aliases}

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // A small stand-in for emoji.emojize(text, language="en"): replaces each
  // :name: token with its emoji if known, leaves unknown tokens untouched.
  function emojizeText(text) {
    return text.replace(/:([a-zA-Z0-9_+-]+):/g, function (whole, name) {
      var hit = lookup[name.toLowerCase()];
      return hit ? hit : whole;
    });
  }

  function updateTry() {
    if (!tryInput || !tryOutput) return;
    tryOutput.textContent = lookup ? emojizeText(tryInput.value) : "";
  }

  function buildTable(entries) {
    var html = entries.map(function (e) {
      var aliasText = e.aliases.length ? e.aliases.map(function (a) { return ":" + a + ":"; }).join(", ") : "";
      return "<tr><td class=\"emoji-list-glyph\">" + e.emoji + "</td>" +
        "<td><code>:" + escapeHtml(e.name) + ":</code></td>" +
        "<td>" + escapeHtml(aliasText) + "</td></tr>";
    }).join("");

    searchResults.innerHTML =
      "<table class=\"emoji-list-table\"><thead><tr><th>Emoji</th><th>Code</th><th>Aliases</th></tr></thead><tbody>" +
      html + "</tbody></table>";

    var trs = searchResults.querySelectorAll("tbody tr");
    rows = entries.map(function (e, i) {
      return { tr: trs[i], name: e.name.toLowerCase(), aliases: e.aliases.map(function (a) { return a.toLowerCase(); }) };
    });
  }

  function filterRows(query) {
    if (!rows) return;
    var q = query.toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var match = !q || r.name.indexOf(q) !== -1 || r.aliases.some(function (a) { return a.indexOf(q) !== -1; });
      r.tr.style.display = match ? "" : "none";
      if (match) shown++;
    });
    searchStatus.textContent = query
      ? shown + " match" + (shown === 1 ? "" : "es") + " for \"" + query + "\"."
      : shown + " emoji total. Type to filter.";
  }

  fetch(DATA_URL)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      window.__emojiEntries = data.entries;
      lookup = {};
      data.entries.forEach(function (e) {
        lookup[e.name.toLowerCase()] = e.emoji;
        e.aliases.forEach(function (a) { lookup[a.toLowerCase()] = e.emoji; });
      });
      updateTry();

      if (searchResults) {
        buildTable(data.entries);
        filterRows(searchInput ? searchInput.value.trim() : "");
      }
    })
    .catch(function () {
      if (tryOutput) tryOutput.textContent = "Couldn't load the emoji list right now.";
      if (searchStatus) searchStatus.textContent = "Couldn't load the emoji list right now.";
    });

  if (tryInput) tryInput.addEventListener("input", updateTry);
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterRows(searchInput.value.trim());
    });
  }

  if (searchStatus) searchStatus.textContent = "Loading emoji list...";
})();
