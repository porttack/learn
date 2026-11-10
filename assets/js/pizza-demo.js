// Live demo for the Pizza pset: pick a command, see what pizza.py prints.
// The two menus are the same files students download. The table drawing
// copies how tabulate's "grid" format sizes columns: a column is as wide as
// its longest cell, or its header plus 2 spaces, whichever is bigger, with
// one space of padding on each side.
(function () {
  var MENUS = {
    'regular.csv': 'Regular Pizza,Small,Large\nCheese,$13.50,$18.95\n1 topping,$14.75,$20.95\n2 toppings,$15.95,$22.95\n3 toppings,$16.95,$24.95\nSpecial,$18.50,$26.95',
    'sicilian.csv': 'Sicilian Pizza,Small,Large\nCheese,$25.50,$39.95\n1 item,$27.50,$41.95\n2 items,$29.50,$43.95\n3 items,$31.50,$45.95\nSpecial,$33.50,$47.95'
  };

  function grid(rows) {
    var widths = rows[0].map(function (h, c) {
      var w = h.length + 2;
      rows.slice(1).forEach(function (r) { w = Math.max(w, r[c].length); });
      return w + 2;
    });
    function rule(ch) {
      return '+' + widths.map(function (w) { return new Array(w + 1).join(ch); }).join('+') + '+';
    }
    function line(r) {
      return '|' + r.map(function (cell, c) {
        return ' ' + cell + new Array(widths[c] - cell.length).join(' ');
      }).join('|') + '|';
    }
    var out = [rule('-'), line(rows[0]), rule('=')];
    rows.slice(1).forEach(function (r) { out.push(line(r), rule('-')); });
    return out.join('\n');
  }

  function run(args) {
    if (args.length < 1) return 'Too few command-line arguments';
    if (args.length > 1) return 'Too many command-line arguments';
    if (!/\.csv$/.test(args[0])) return 'Not a CSV file';
    if (!MENUS.hasOwnProperty(args[0])) return 'File does not exist';
    return grid(MENUS[args[0]].split('\n').map(function (l) { return l.split(','); }));
  }

  var select = document.getElementById('pizza-try-select');
  var cmd = document.getElementById('pizza-try-command');
  var out = document.getElementById('pizza-try-output');
  if (!select || !cmd || !out) return;

  function update() {
    var args = select.value === '' ? [] : select.value.split(' ');
    cmd.textContent = ('$ python pizza.py ' + select.value).replace(/ $/, '');
    out.textContent = run(args);
  }
  select.addEventListener('change', update);
  update();
})();
