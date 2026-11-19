// Interactive map and profile viewer for the Profiling Float page.
// Plain JavaScript. Makes no network requests: all data comes from float-data.js.
// Several regions can be selected at once. Each has its own color and marker shape,
// and all of them draw on the same graph so they can be compared.
(function () {
  'use strict';
  var D = window.FLOAT_DATA;
  var root = document.getElementById('float-explorer');
  if (!D || !root) return;

  var VARS = {
    temperature: { label: 'Temperature', unit: '°C',
      why: 'Sunlight warms only the top of the ocean. Deeper down it is cold almost everywhere.' },
    salinity: { label: 'Salinity', unit: 'psu',
      why: 'How salty the water is. With temperature it decides how heavy the water is, so it decides what sinks and what floats.' },
    doxy: { label: 'Oxygen', unit: 'µmol/kg',
      why: 'Tiny plants make it near the surface. Animals and bacteria use it up as things sink and rot.' },
    nitrate: { label: 'Nitrate', unit: 'µmol/kg',
      why: 'Fertilizer for tiny ocean plants. Surface water that has run out of it cannot grow many.' },
    chla: { label: 'Chlorophyll', unit: 'mg/m³',
      why: 'The green pigment in tiny ocean plants. More chlorophyll means more of them. It only shows up where sunlight reaches.' }
  };
  var ORDER = ['temperature', 'salinity', 'doxy', 'nitrate', 'chla'];

  // One color and one marker shape per region (same order as the data).
  var COLORS = ['#0072B2', '#009E73', '#B3447F', '#6A3D9A', '#7A5C00'];
  var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross'];

  var tl = { on: false, t: 0, playing: false, last: 0, raf: null, follow: null, byType: false, data: null };
  var state = { bgcOnly: false, sel: [], v: 'temperature', range: 2000, hoverZ: null };
  D.profiles.forEach(function () { state.sel.push(false); });
  state.sel[0] = true;                       // start with a cold region and a warm one
  if (D.profiles.length > 4) state.sel[4] = true;

  var mapCanvas = root.querySelector('#fx-map');
  var chartCanvas = root.querySelector('#fx-chart');
  var readout = root.querySelector('#fx-readout');
  var info = root.querySelector('#fx-info');
  var why = root.querySelector('#fx-why');
  var profList = root.querySelector('#fx-profiles');
  var varList = root.querySelector('#fx-vars');
  var rangeSel = root.querySelector('#fx-range');
  var allBtn = root.querySelector('#fx-all');
  var bgcBtn = root.querySelector('#fx-bgc');

  var floats = D.snapshot.floats;
  var nBgc = 0;
  floats.forEach(function (f) { if (f[2]) nBgc += 1; });
  allBtn.textContent = 'All floats (' + floats.length.toLocaleString('en-US') + ')';
  bgcBtn.textContent = 'With chemistry and biology sensors (' + nBgc.toLocaleString('en-US') + ')';

  // ---------- helpers ----------
  function fit(canvas, cssHeight) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 600;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.height = cssHeight + 'px';
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: cssHeight };
  }

  function niceStep(span, target) {
    var raw = span / target;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / mag;
    var s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return s * mag;
  }

  function fmt(x, unit) {
    var a = Math.abs(x);
    var s = a >= 100 ? x.toFixed(0) : a >= 10 ? x.toFixed(1) : a >= 1 ? x.toFixed(2) : x.toFixed(3);
    return s + ' ' + unit;
  }

  function selected() {
    var out = [];
    state.sel.forEach(function (on, k) { if (on) out.push(k); });
    return out;
  }

  function marker(c, shape, x, y, r) {
    c.beginPath();
    if (shape === 'circle') {
      c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    } else if (shape === 'square') {
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    } else if (shape === 'triangle') {
      c.moveTo(x, y - r - 1); c.lineTo(x + r + 1, y + r); c.lineTo(x - r - 1, y + r); c.closePath(); c.fill();
    } else if (shape === 'diamond') {
      c.moveTo(x, y - r - 1); c.lineTo(x + r + 1, y); c.lineTo(x, y + r + 1); c.lineTo(x - r - 1, y); c.closePath(); c.fill();
    } else {   // cross
      var w = Math.max(1.6, r * 0.7);
      c.fillRect(x - r - 1, y - w / 2, 2 * r + 2, w);
      c.fillRect(x - w / 2, y - r - 1, w, 2 * r + 2);
    }
  }

  // ---------- map ----------
  var MAP_H_RATIO = 0.5;      // height / width
  var LAT_TOP = 85, LAT_BOT = -80;
  var mapBox = null;

  function project(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * h];
  }

  function drawMap() {
    var w = mapCanvas.clientWidth || 600;
    var h = Math.round(w * MAP_H_RATIO);
    var g = fit(mapCanvas, h), c = g.c;
    mapBox = { w: g.w, h: g.h };
    c.fillStyle = '#e4eef6';
    c.fillRect(0, 0, g.w, g.h);

    c.strokeStyle = 'rgba(60,90,120,0.18)';
    c.lineWidth = 1;
    c.fillStyle = 'rgba(40,70,100,0.75)';
    c.font = '11px sans-serif';
    var lon, lat, p;
    for (lon = -150; lon <= 150; lon += 30) {
      p = project(lon, 0, g.w, g.h);
      c.beginPath(); c.moveTo(p[0], 0); c.lineTo(p[0], g.h); c.stroke();
      c.fillText((lon < 0 ? -lon + '°W' : lon === 0 ? '0°' : lon + '°E'), p[0] + 3, g.h - 4);
    }
    for (lat = -60; lat <= 60; lat += 30) {
      p = project(0, lat, g.w, g.h);
      c.beginPath(); c.moveTo(0, p[1]); c.lineTo(g.w, p[1]); c.stroke();
      c.fillText((lat === 0 ? 'Equator' : lat < 0 ? -lat + '°S' : lat + '°N'), 4, p[1] - 3);
    }

    if (tl.on) { drawTimelapse(c, g); return; }

    var r = g.w > 700 ? 2.2 : 1.7;
    var i, f;
    if (!state.bgcOnly) {
      c.fillStyle = 'rgba(40,58,78,0.75)';
      for (i = 0; i < floats.length; i++) {
        f = floats[i];
        if (f[2]) continue;
        p = project(f[0], f[1], g.w, g.h);
        c.fillRect(p[0] - r / 2, p[1] - r / 2, r, r);
      }
    }
    c.fillStyle = state.bgcOnly ? 'rgba(0,128,128,0.9)' : 'rgba(0,150,140,0.95)';
    var rb = state.bgcOnly ? r + 0.8 : r + 0.4;
    for (i = 0; i < floats.length; i++) {
      f = floats[i];
      if (!f[2]) continue;
      p = project(f[0], f[1], g.w, g.h);
      c.fillRect(p[0] - rb / 2, p[1] - rb / 2, rb, rb);
    }

    // the profiles you can open: colored rings, filled when selected
    D.profiles.forEach(function (pr, k) {
      var q = project(pr.lon, pr.lat, g.w, g.h);
      var on = state.sel[k];
      c.beginPath();
      c.arc(q[0], q[1], 11, 0, Math.PI * 2);
      c.fillStyle = on ? COLORS[k] : 'rgba(255,255,255,0.92)';
      c.fill();
      c.lineWidth = 2.5;
      c.strokeStyle = COLORS[k];
      c.stroke();
      c.fillStyle = on ? '#fff' : COLORS[k];
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(k + 1), q[0], q[1] + 0.5);
      c.textAlign = 'start';
      c.textBaseline = 'alphabetic';
    });
  }

  mapCanvas.addEventListener('click', function (ev) {
    if (!mapBox) return;
    var rect = mapCanvas.getBoundingClientRect();
    var x = (ev.clientX - rect.left) * (mapBox.w / rect.width);
    var y = (ev.clientY - rect.top) * (mapBox.h / rect.height);
    if (tl.on) { tlPick(x, y); return; }
    var best = -1, bd = 18 * 18;
    D.profiles.forEach(function (pr, k) {
      var q = project(pr.lon, pr.lat, mapBox.w, mapBox.h);
      var d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y);
      if (d < bd) { bd = d; best = k; }
    });
    if (best >= 0) toggleProfile(best);
  });

  // ---------- profile chart ----------
  var plot = null;

  function seriesOf(k) {
    var all = D.profiles[k].s[state.v] || [];
    return all.filter(function (p) { return p[0] <= state.range; });
  }

  function unionDepths() {
    var seen = {}, out = [];
    selected().forEach(function (k) {
      seriesOf(k).forEach(function (p) { if (!seen[p[0]]) { seen[p[0]] = true; out.push(p[0]); } });
    });
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function nearestPoint(pts, z) {
    var best = null, bd = Infinity;
    pts.forEach(function (p) { var d = Math.abs(p[0] - z); if (d < bd) { bd = d; best = p; } });
    return best && bd <= Math.max(8, z * 0.06) ? best : null;
  }

  function drawChart() {
    var meta = VARS[state.v];
    var sel = selected();
    var series = sel.map(function (k) { return seriesOf(k); });

    // measure the legend so it can wrap on narrow screens
    var cw = chartCanvas.clientWidth || 600;
    var legendRows = 1, lx = 54;
    var probe = chartCanvas.getContext('2d');
    probe.font = '12px sans-serif';
    sel.forEach(function (k) {
      var wd = 22 + probe.measureText(D.profiles[k].name).width + 16;
      if (lx + wd > cw - 10) { legendRows += 1; lx = 54; }
      lx += wd;
    });
    var CH = 380 + (legendRows - 1) * 18;
    var g = fit(chartCanvas, CH), c = g.c;
    var L = 54, R = 16, T = 22 + legendRows * 18, B = 44;
    var pw = g.w - L - R, ph = g.h - T - B;
    plot = { L: L, T: T, pw: pw, ph: ph, CH: CH };

    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, g.w, g.h);

    var lo = Infinity, hi = -Infinity, any = false;
    series.forEach(function (pts) {
      pts.forEach(function (p) { any = true; if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; });
    });
    if (!any) {
      c.fillStyle = '#555';
      c.font = '14px sans-serif';
      c.fillText('No ' + meta.label.toLowerCase() + ' readings in this depth range for the chosen regions.', L, T + 30);
      return;
    }
    if (hi - lo < 1e-9) { hi = lo + 1; }
    var pad = (hi - lo) * 0.06;
    lo -= pad; hi += pad;
    if (state.v === 'chla' || state.v === 'nitrate') { if (lo < 0) lo = 0; }

    function X(v) { return L + (v - lo) / (hi - lo) * pw; }
    function Y(z) { return T + z / state.range * ph; }

    // the strip where a 2 meter pool float works
    var stripH = Math.max(3, Y(2) - T);
    c.fillStyle = 'rgba(217,72,15,0.25)';
    c.fillRect(L, T, pw, stripH);
    var tag = state.range > 300 ? 'orange strip: the 0 to 2 m your float works in' : 'orange strip: 0 to 2 m';

    // grid and ticks
    c.strokeStyle = '#e3e3e3';
    c.fillStyle = '#444';
    c.lineWidth = 1;
    c.font = '12px sans-serif';
    var zs = niceStep(state.range, 5), z, v;
    c.textAlign = 'right';
    for (z = 0; z <= state.range + 1e-9; z += zs) {
      c.beginPath(); c.moveTo(L, Y(z)); c.lineTo(L + pw, Y(z)); c.stroke();
      c.fillText(String(Math.round(z)), L - 6, Y(z) + 4);
    }
    c.textAlign = 'center';
    var xs = niceStep(hi - lo, 5);
    for (v = Math.ceil(lo / xs) * xs; v <= hi; v += xs) {
      c.beginPath(); c.moveTo(X(v), T); c.lineTo(X(v), T + ph); c.stroke();
      c.fillText((Math.abs(xs) < 1 ? v.toFixed(2) : String(Math.round(v * 100) / 100)), X(v), T + ph + 16);
    }
    c.textAlign = 'start';

    // axis labels
    c.fillStyle = '#222';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'center';
    c.fillText(meta.label + ' (' + meta.unit + ')', L + pw / 2, g.h - 8);
    c.save();
    c.translate(14, T + ph / 2);
    c.rotate(-Math.PI / 2);
    c.fillText('Depth (m): the surface is at the top', 0, 0);
    c.restore();
    c.textAlign = 'start';

    // legend (color + shape + name)
    c.font = '12px sans-serif';
    var row = 0; lx = L;
    sel.forEach(function (k) {
      var name = D.profiles[k].name;
      var wd = 22 + c.measureText(name).width + 16;
      if (lx + wd > g.w - 10) { row += 1; lx = L; }
      c.fillStyle = COLORS[k]; c.strokeStyle = COLORS[k]; c.lineWidth = 2;
      c.beginPath(); c.moveTo(lx, 16 + row * 18); c.lineTo(lx + 16, 16 + row * 18); c.stroke();
      marker(c, SHAPES[k], lx + 8, 16 + row * 18, 3.6);
      c.fillStyle = '#222';
      c.fillText(name, lx + 22, 20 + row * 18);
      lx += wd;
    });

    // lines and markers
    sel.forEach(function (k, idx) {
      var pts = series[idx];
      if (!pts.length) return;
      c.strokeStyle = COLORS[k];
      c.lineWidth = 2;
      c.beginPath();
      pts.forEach(function (p, i) {
        if (i === 0) c.moveTo(X(p[1]), Y(p[0])); else c.lineTo(X(p[1]), Y(p[0]));
      });
      c.stroke();
      c.fillStyle = COLORS[k];
      pts.forEach(function (p) { marker(c, SHAPES[k], X(p[1]), Y(p[0]), 2.8); });
    });

    // strip label, drawn last so the lines never hide it
    c.font = '12px sans-serif';
    var tw = c.measureText(tag).width;
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.fillRect(L + 4, T + stripH + 3, tw + 8, 16);
    c.fillStyle = '#b53a0a';
    c.fillText(tag, L + 8, T + stripH + 15);

    // hover: a horizontal guide and a ring on each region's nearest point
    if (state.hoverZ !== null) {
      c.strokeStyle = 'rgba(0,0,0,0.45)';
      c.lineWidth = 1;
      c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(L, Y(state.hoverZ)); c.lineTo(L + pw, Y(state.hoverZ)); c.stroke();
      c.setLineDash([]);
      sel.forEach(function (k, idx) {
        var p = nearestPoint(series[idx], state.hoverZ);
        if (!p) return;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(X(p[1]), Y(p[0]), 7, 0, Math.PI * 2); c.fill();
        c.strokeStyle = COLORS[k]; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = COLORS[k];
        marker(c, SHAPES[k], X(p[1]), Y(p[0]), 3.6);
      });
    }
    plot.X = X; plot.Y = Y;
  }

  function showReadout() {
    var meta = VARS[state.v];
    while (readout.firstChild) readout.removeChild(readout.firstChild);
    if (state.hoverZ === null) {
      readout.textContent = 'Move over the graph (or click it and use the arrow keys) to compare the regions at one depth.';
      return;
    }
    var lead = document.createElement('span');
    lead.textContent = 'At ' + state.hoverZ + ' m deep: ';
    readout.appendChild(lead);
    selected().forEach(function (k) {
      var p = nearestPoint(seriesOf(k), state.hoverZ);
      var s = document.createElement('span');
      s.style.color = COLORS[k];
      s.style.marginRight = '1em';
      s.style.whiteSpace = 'nowrap';
      s.textContent = D.profiles[k].name + ' ' + (p ? fmt(p[1], meta.unit) : 'no reading');
      readout.appendChild(s);
    });
  }

  function hoverAt(clientY) {
    if (!plot) return;
    var depths = unionDepths();
    if (!depths.length) return;
    var rect = chartCanvas.getBoundingClientRect();
    var y = (clientY - rect.top) * (plot.CH / rect.height);
    var z = (y - plot.T) / plot.ph * state.range;
    var best = depths[0], bd = Infinity;
    depths.forEach(function (d) { var dd = Math.abs(d - z); if (dd < bd) { bd = dd; best = d; } });
    state.hoverZ = best;
    drawChart(); showReadout();
  }

  chartCanvas.addEventListener('pointermove', function (ev) { hoverAt(ev.clientY); });
  chartCanvas.addEventListener('pointerdown', function (ev) { hoverAt(ev.clientY); });
  chartCanvas.addEventListener('pointerleave', function () { state.hoverZ = null; drawChart(); showReadout(); });
  chartCanvas.addEventListener('keydown', function (ev) {
    var depths = unionDepths();
    if (!depths.length) return;
    var i = state.hoverZ === null ? -1 : depths.indexOf(state.hoverZ);
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
      i = Math.min(depths.length - 1, i + 1);
    } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
      i = Math.max(0, i - 1);
    } else { return; }
    ev.preventDefault();
    state.hoverZ = depths[i];
    drawChart(); showReadout();
  });


  // ---------- timelapse: every Argo float, 1997 to now ----------
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var tlStart = root.querySelector('#fx-tl-start');
  var tlBox = root.querySelector('#fx-tl');
  var tlPlay = root.querySelector('#fx-tl-play');
  var tlTime = root.querySelector('#fx-tl-time');
  var tlSpeed = root.querySelector('#fx-tl-speed');
  var tlFollow = root.querySelector('#fx-tl-follow');
  var tlUnfollow = root.querySelector('#fx-tl-unfollow');
  var tlColor = root.querySelector('#fx-tl-color');
  var tlExit = root.querySelector('#fx-tl-exit');
  var tlReadout = root.querySelector('#fx-tl-readout');
  var countC = root.querySelector('#fx-count');
  var STEP = 20;   // slider units per snapshot

  function decodeTimelapse(raw) {
    var floats = raw.floats.map(function (f, i) {
      var arr = f[3], n = arr.length / 2;
      var lon = new Float32Array(n), lat = new Float32Array(n);
      var x = arr[0], y = arr[1];
      lon[0] = x / 10; lat[0] = y / 10;
      for (var k = 1; k < n; k++) { x += arr[2 * k]; y += arr[2 * k + 1]; lon[k] = x / 10; lat[k] = y / 10; }
      var hue = (i * 137.508) % 360;          // the golden angle spreads colors apart
      return { s: f[0], n: n, e: f[0] + n - 1, bgc: f[1], id: f[2], lon: lon, lat: lat,
               col: 'hsl(' + hue.toFixed(0) + ',78%,42%)' };
    });
    return { dates: raw.dates, counts: raw.counts, floats: floats };
  }

  function wrapLon(x) { return ((x + 180) % 360 + 360) % 360 - 180; }
  function alphaAt(f, t) {
    if (t < f.s - 1 || t > f.e + 1) return 0;
    if (t < f.s) return t - (f.s - 1);
    if (t > f.e) return 1 - (t - f.e);
    return 1;
  }
  function posAt(f, t, out) {
    var tt = Math.max(f.s, Math.min(f.e, t)) - f.s;
    var i = Math.floor(tt);
    if (i >= f.n - 1) { out.lon = f.lon[f.n - 1]; out.lat = f.lat[f.n - 1]; return; }
    var fr = tt - i;
    out.lon = f.lon[i] + (f.lon[i + 1] - f.lon[i]) * fr;
    out.lat = f.lat[i] + (f.lat[i + 1] - f.lat[i]) * fr;
  }
  function dateLabel(idx) {
    var d = tl.data.dates[idx];
    return MONTHS[parseInt(d.slice(5), 10) - 1] + ' ' + d.slice(0, 4);
  }
  function nearIdx() { return Math.max(0, Math.min(tl.data.dates.length - 1, Math.round(tl.t))); }
  function haversine(lon1, lat1, lon2, lat2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function drawTimelapse(c, g) {
    var d = tl.data, t = tl.t, pos = {}, p0 = {};
    var r = g.w > 700 ? 2.6 : 2.0;
    var follow = tl.follow, dim = follow !== null;
    var i, f, a, p, q;
    for (i = 0; i < d.floats.length; i++) {
      f = d.floats[i];
      a = alphaAt(f, t);
      if (!a || (state.bgcOnly && !f.bgc)) continue;
      if (f === follow) continue;
      posAt(f, t, pos);
      p = project(wrapLon(pos.lon), pos.lat, g.w, g.h);
      var shade = dim ? 0.16 : 1;
      var col = tl.byType ? (f.bgc ? 'rgb(0,140,130)' : 'rgb(40,58,78)') : f.col;
      var rr = f.bgc && tl.byType ? r + 0.7 : r;
      if (!dim) {   // a short tail shows which way it is drifting
        posAt(f, t - 0.8, p0);
        q = project(wrapLon(p0.lon), p0.lat, g.w, g.h);
        if (Math.abs(q[0] - p[0]) < g.w / 3) {
          c.globalAlpha = a * 0.5; c.strokeStyle = col; c.lineWidth = 1;
          c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(p[0], p[1]); c.stroke();
        }
      }
      c.globalAlpha = a * shade; c.fillStyle = col;
      c.fillRect(p[0] - rr / 2, p[1] - rr / 2, rr, rr);
    }
    c.globalAlpha = 1;

    if (follow) {          // the whole path so far, then the float itself
      var upto = Math.max(follow.s, Math.min(follow.e, t));
      var k, prev = null, pts = [];
      for (k = 0; k < follow.n; k++) {
        if (follow.s + k > upto) break;
        pts.push(project(wrapLon(follow.lon[k]), follow.lat[k], g.w, g.h));
      }
      posAt(follow, t, pos);
      pts.push(project(wrapLon(pos.lon), pos.lat, g.w, g.h));
      [['#ffffff', 5], [follow.col, 2.5]].forEach(function (st) {
        c.strokeStyle = st[0]; c.lineWidth = st[1]; c.lineJoin = 'round';
        c.beginPath(); prev = null;
        pts.forEach(function (pp) {
          if (prev && Math.abs(pp[0] - prev[0]) > g.w / 2) c.moveTo(pp[0], pp[1]);
          else if (prev) c.lineTo(pp[0], pp[1]); else c.moveTo(pp[0], pp[1]);
          prev = pp;
        });
        c.stroke();
      });
      var here = pts[pts.length - 1];
      c.globalAlpha = Math.max(0.35, alphaAt(follow, t));
      c.beginPath(); c.arc(here[0], here[1], 8, 0, Math.PI * 2);
      c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = follow.col; c.stroke();
      c.beginPath(); c.arc(here[0], here[1], 3.2, 0, Math.PI * 2); c.fillStyle = follow.col; c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#111'; c.font = 'bold 12px sans-serif';
      c.fillText('float ' + follow.id, here[0] + 12, here[1] + 4);
    }

    // the date and the count, in the corner
    var idx = nearIdx(), cn = d.counts[idx];
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fillRect(g.w - 232, 8, 224, 54);
    c.fillStyle = '#111'; c.font = 'bold 20px sans-serif';
    c.fillText(dateLabel(idx), g.w - 224, 32);
    c.font = '12px sans-serif';
    c.fillText(cn[0].toLocaleString('en-US') + ' floats, ' + cn[1].toLocaleString('en-US') + ' with chemistry sensors', g.w - 224, 52);
  }

  function tlPick(x, y) {
    var d = tl.data, t = tl.t, pos = {}, best = null, bd = 14 * 14;
    d.floats.forEach(function (f) {
      if (alphaAt(f, t) < 0.99 || (state.bgcOnly && !f.bgc)) return;
      posAt(f, t, pos);
      var p = project(wrapLon(pos.lon), pos.lat, mapBox.w, mapBox.h);
      var dd = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
      if (dd < bd) { bd = dd; best = f; }
    });
    if (best) setFollow(best);
  }

  function setFollow(f) {
    tl.follow = f;
    tlUnfollow.hidden = !f;
    tlRender();
  }

  function followText() {
    var f = tl.follow, d = tl.data;
    if (!f) return 'Click a dot on the map, or press "Follow a random float", to follow one float and see its whole path.';
    var upto = Math.max(f.s, Math.min(f.e, tl.t)), km = 0, k;
    for (k = 0; k < f.n - 1; k++) {
      if (f.s + k + 1 <= upto) km += haversine(f.lon[k], f.lat[k], f.lon[k + 1], f.lat[k + 1]);
      else if (f.s + k < upto) {
        var fr = upto - (f.s + k);
        km += fr * haversine(f.lon[k], f.lat[k], f.lon[k + 1], f.lat[k + 1]);
      }
    }
    var pos = {}; posAt(f, tl.t, pos);
    var lat = Math.abs(pos.lat).toFixed(1) + '°' + (pos.lat < 0 ? 'S' : 'N');
    var lon = Math.abs(wrapLon(pos.lon)).toFixed(1) + '°' + (wrapLon(pos.lon) < 0 ? 'W' : 'E');
    var s = 'Float ' + f.id + (f.bgc ? ' (has chemistry and biology sensors)' : '') + ', first seen ' + dateLabel(f.s) + '. ';
    if (tl.t > f.e + 0.5) s += 'Its last report was ' + dateLabel(f.e) + '. ';
    else if (tl.t < f.s) s += 'It has not been launched yet. ';
    else s += 'Now at ' + lat + ' ' + lon + '. ';
    s += 'It has drifted at least ' + Math.round(km / 10) * 10 + ' km so far. (Between snapshots the path is a straight line, so the real distance is longer.)';
    return s;
  }

  function drawCount() {
    var d = tl.data, g = fit(countC, 120), c = g.c;
    var L = 46, R = 12, T = 10, B = 24, pw = g.w - L - R, ph = g.h - T - B;
    var N = d.dates.length, max = 0, i;
    d.counts.forEach(function (x) { if (x[0] > max) max = x[0]; });
    max = Math.ceil(max / 1000) * 1000;
    function X(k) { return L + k / (N - 1) * pw; }
    function Y(v) { return T + ph - v / max * ph; }
    c.fillStyle = '#fff'; c.fillRect(0, 0, g.w, g.h);
    c.strokeStyle = '#e6e6e6'; c.fillStyle = '#444'; c.font = '11px sans-serif'; c.lineWidth = 1;
    c.textAlign = 'right';
    for (i = 0; i <= max; i += 1000) { c.beginPath(); c.moveTo(L, Y(i)); c.lineTo(L + pw, Y(i)); c.stroke(); c.fillText(i.toLocaleString('en-US'), L - 5, Y(i) + 4); }
    c.textAlign = 'center';
    d.dates.forEach(function (dt, k) {
      var yr = parseInt(dt.slice(0, 4), 10);
      if (dt.slice(5) === '11' && yr % 5 === 0) c.fillText(String(yr), X(k), g.h - 8);
    });
    c.textAlign = 'start';
    [[0, '#34495e', 'all floats'], [1, '#00968c', 'with chemistry and biology sensors']].forEach(function (ln, j) {
      c.strokeStyle = ln[1]; c.lineWidth = 2; c.beginPath();
      d.counts.forEach(function (x, k) { if (k === 0) c.moveTo(X(k), Y(x[ln[0]])); else c.lineTo(X(k), Y(x[ln[0]])); });
      c.stroke();
      c.fillStyle = ln[1]; c.font = 'bold 11px sans-serif';
      c.fillText(ln[2], L + 8, T + 12 + j * 14);
    });
    c.strokeStyle = 'rgba(217,72,15,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X(tl.t), T); c.lineTo(X(tl.t), T + ph); c.stroke();
    countC._geom = { L: L, pw: pw, N: N };
  }

  countC.addEventListener('click', function (ev) {
    if (!tl.on || !countC._geom) return;
    var rect = countC.getBoundingClientRect(), g = countC._geom;
    var x = (ev.clientX - rect.left) * (countC.clientWidth / rect.width);
    tl.t = Math.max(0, Math.min(g.N - 1, (x - g.L) / g.pw * (g.N - 1)));
    tlPause(); tlRender();
  });

  function tlRender() {
    tlTime.value = String(Math.round(tl.t * STEP));
    tlReadout.textContent = followText();
    drawMap(); drawCount();
  }
  function tlPause() { tl.playing = false; if (tl.raf) cancelAnimationFrame(tl.raf); tlPlay.textContent = tl.t >= tl.data.dates.length - 1 ? 'Play again' : 'Play'; }
  function tlResume() {
    if (tl.t >= tl.data.dates.length - 1) tl.t = 0;
    tl.playing = true; tl.last = 0; tlPlay.textContent = 'Pause';
    tl.raf = requestAnimationFrame(tlFrame);
  }
  function tlFrame(ts) {
    if (!tl.on || !tl.playing) return;
    if (!tl.last) tl.last = ts;
    var dt = Math.min(0.1, (ts - tl.last) / 1000); tl.last = ts;
    tl.t += dt * parseFloat(tlSpeed.value);
    var maxT = tl.data.dates.length - 1;
    if (tl.t >= maxT) { tl.t = maxT; tlPause(); }
    tlRender();
    if (tl.playing) tl.raf = requestAnimationFrame(tlFrame);
  }

  function tlEnter() {
    tl.on = true; tlBox.hidden = false;
    tlStart.hidden = true;
    tlTime.max = String((tl.data.dates.length - 1) * STEP);
    tl.t = 0; tl.follow = null; tlUnfollow.hidden = true;
    tlRender(); tlResume();
  }
  tlStart.addEventListener('click', function () {
    if (tl.data) { tlEnter(); return; }
    var src = root.getAttribute('data-timelapse-src');
    if (!src) return;
    tlStart.disabled = true;
    tlStart.textContent = 'Loading the timelapse data...';
    var sc = document.createElement('script');
    sc.src = src;
    sc.onload = function () {
      tl.data = decodeTimelapse(window.FLOAT_TIME);
      tlStart.disabled = false;
      tlStart.textContent = 'Timelapse: watch the floats arrive and drift, 1997 to now';
      tlEnter();
    };
    sc.onerror = function () { tlStart.disabled = false; tlStart.textContent = 'The timelapse data did not load. Try again.'; };
    document.head.appendChild(sc);
  });
  tlPlay.addEventListener('click', function () { if (tl.playing) tlPause(); else tlResume(); });
  tlTime.addEventListener('input', function () { tlPause(); tl.t = parseInt(tlTime.value, 10) / STEP; tlRender(); });
  tlSpeed.addEventListener('change', function () { tl.last = 0; });
  tlFollow.addEventListener('click', function () {
    var d = tl.data, cands = [];
    d.floats.forEach(function (f) { if (f.n >= 10 && alphaAt(f, tl.t) === 1 && (!state.bgcOnly || f.bgc)) cands.push(f); });
    if (!cands.length) {   // nothing long-lived is out right now: pick from the whole history
      d.floats.forEach(function (f) { if (f.n >= 10 && (!state.bgcOnly || f.bgc)) cands.push(f); });
    }
    if (!cands.length) return;
    setFollow(cands[Math.floor(Math.random() * cands.length)]);
  });
  tlUnfollow.addEventListener('click', function () { setFollow(null); });
  tlColor.addEventListener('click', function () {
    tl.byType = !tl.byType;
    tlColor.setAttribute('aria-pressed', tl.byType ? 'true' : 'false');
    tlColor.textContent = tl.byType ? 'Color: by sensor type' : 'Color: each float its own';
    tlRender();
  });
  tlExit.addEventListener('click', function () {
    tlPause(); tl.on = false; tl.follow = null; tlBox.hidden = true; tlStart.hidden = false;
    drawMap();
  });

  // ---------- controls ----------
  var profButtons = [];

  function paintButtons() {
    profButtons.forEach(function (b, k) {
      var on = state.sel[k];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.borderColor = COLORS[k];
      b.style.borderWidth = '2px';
      b.style.background = on ? COLORS[k] : '#fff';
      b.style.color = on ? '#fff' : '#222';
    });
    var n = selected().length;
    allBtnProf.setAttribute('aria-pressed', n === D.profiles.length ? 'true' : 'false');
  }

  function renderInfo() {
    while (info.firstChild) info.removeChild(info.firstChild);
    selected().forEach(function (k) {
      var pr = D.profiles[k];
      var lat = Math.abs(pr.lat).toFixed(1) + '°' + (pr.lat < 0 ? 'S' : 'N');
      var lon = Math.abs(pr.lon).toFixed(1) + '°' + (pr.lon < 0 ? 'W' : 'E');
      var line = document.createElement('div');
      var dot = document.createElement('span');
      dot.style.color = COLORS[k];
      dot.style.fontWeight = 'bold';
      dot.textContent = (k + 1) + '. ' + pr.name + ': ';
      line.appendChild(dot);
      line.appendChild(document.createTextNode('float ' + pr.id.split('_')[0] + ', trip number ' +
        parseInt(pr.id.split('_')[1], 10) + ', ' + pr.date + ', at ' + lat + ' ' + lon + '.'));
      info.appendChild(line);
    });
    why.textContent = VARS[state.v].why;
  }

  function refresh() {
    state.hoverZ = null;
    paintButtons(); renderInfo(); drawMap(); drawChart(); showReadout();
  }

  function toggleProfile(k) {
    if (state.sel[k] && selected().length === 1) return;   // keep at least one on the graph
    state.sel[k] = !state.sel[k];
    refresh();
  }

  D.profiles.forEach(function (pr, k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = (k + 1) + '. ' + pr.name;
    b.addEventListener('click', function () { toggleProfile(k); });
    profList.appendChild(b);
    profButtons.push(b);
  });

  var allBtnProf = document.createElement('button');
  allBtnProf.type = 'button';
  allBtnProf.textContent = 'Compare all five';
  allBtnProf.addEventListener('click', function () {
    var allOn = selected().length === D.profiles.length;
    if (allOn) {
      state.sel = state.sel.map(function (_, k) { return k === 0; });
    } else {
      state.sel = state.sel.map(function () { return true; });
    }
    refresh();
  });
  profList.appendChild(allBtnProf);

  ORDER.forEach(function (key) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = VARS[key].label;
    b.addEventListener('click', function () {
      state.v = key; state.hoverZ = null;
      Array.prototype.forEach.call(varList.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      renderInfo(); drawChart(); showReadout();
    });
    varList.appendChild(b);
  });

  rangeSel.addEventListener('change', function () {
    state.range = parseInt(rangeSel.value, 10); state.hoverZ = null;
    drawChart(); showReadout();
  });

  allBtn.addEventListener('click', function () {
    state.bgcOnly = false;
    allBtn.setAttribute('aria-pressed', 'true'); bgcBtn.setAttribute('aria-pressed', 'false');
    drawMap();
  });
  bgcBtn.addEventListener('click', function () {
    state.bgcOnly = true;
    allBtn.setAttribute('aria-pressed', 'false'); bgcBtn.setAttribute('aria-pressed', 'true');
    drawMap();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (tl.on) tlRender(); else drawMap(); drawChart(); }, 120);
  });

  varList.querySelectorAll('button')[0].setAttribute('aria-pressed', 'true');
  allBtn.setAttribute('aria-pressed', 'true');
  bgcBtn.setAttribute('aria-pressed', 'false');
  root.classList.add('fx-ready');
  refresh();
})();
