// Click a column heading to sort the movie table (click again to reverse).
(function () {
  var table = document.querySelector(".movie-table");
  if (!table) return;
  var body = table.tBodies[0];
  var heads = table.tHead.rows[0].cells;
  function titleKey(r) {
    var c = r.cells[0];
    return (c.getAttribute("data-sort") || c.textContent).trim().toLowerCase();
  }
  // Start from A to Z by title so any later sort has a clean order to fall back on.
  Array.prototype.slice.call(body.rows).sort(function (a, b) {
    var x = titleKey(a), y = titleKey(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }).forEach(function (r) { body.appendChild(r); });
  Array.prototype.forEach.call(heads, function (th, col) {
    if (th.hasAttribute("data-nosort")) return;
    var label = th.textContent;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sort-btn";
    btn.textContent = label;
    th.textContent = "";
    th.appendChild(btn);
    th.setAttribute("aria-sort", "none");
    btn.addEventListener("click", function () {
      var dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
      Array.prototype.forEach.call(heads, function (h) { h.setAttribute("aria-sort", "none"); });
      th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      var rows = Array.prototype.slice.call(body.rows);
      var numeric = th.getAttribute("data-type") === "number";
      function key(r) {
        var c = r.cells[col], v = c.getAttribute("data-sort");
        if (v === null) v = c.textContent.trim();
        return numeric ? parseFloat(v) : v.toLowerCase();
      }
      rows.sort(function (a, b) {
        var x = key(a), y = key(b);
        if (x !== y) return (x < y ? -1 : 1) * dir;
        // Ties (same rating, same year, ...) always fall back to the title,
        // A to Z, ignoring a leading "The " or "A " (the first cell's data-sort).
        var tx = titleKey(a), ty = titleKey(b);
        return tx < ty ? -1 : tx > ty ? 1 : 0;
      });
      rows.forEach(function (r) { body.appendChild(r); });
    });
  });
  // Start sorted by Rated, lowest first.
  var rated = table.querySelector("th:nth-child(3) .sort-btn");
  if (rated) rated.click();
})();
