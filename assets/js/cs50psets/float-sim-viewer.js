// Side view of a 13 foot pool plus a depth-versus-time graph for the four
// simulated floats in the Profiling Float problem. Plain JavaScript, no network.
(function () {
  'use strict';
  var DATA = window.FLOAT_SIM;
  var root = document.getElementById('sim-viewer');
  if (!DATA || !root) return;

  var POOL = 3.96, FLOAT_LEN = 0.6, HOLD = 1.0, BAND = 0.33, DEEP = 2.0;
  var RUNGS = [2.0, 1.5, 1.0, 0.5, 0.0];
  var FLOOR = POOL - FLOAT_LEN;
  var SPEED = 8;   // simulated seconds per real second

  var WHY = {
    Steady: 'A balanced float with a gentle motor. It overshoots a little, then settles into the hold band.',
    Heavy: 'Ballast a little too heavy: it is always being pulled down. It holds its depth, but watch its dive and the red floor line.',
    Jittery: 'The float itself is fine (gray line). The depth sensor is noisy, so the packets it sends (blue) wobble.'
  };

  var poolC = root.querySelector('#sv-pool');
  var graphC = root.querySelector('#sv-graph');
  var btns = root.querySelector('#sv-floats');
  var play = root.querySelector('#sv-play');
  var slider = root.querySelector('#sv-time');
  var judge = root.querySelector('#sv-judge');
  var note = root.querySelector('#sv-note');
  var clock = root.querySelector('#sv-clock');
  var review = root.querySelector('#sv-review');
  var tempC = root.querySelector('#sv-temp');
  var lightC = root.querySelector('#sv-light');
  var reviewNote = root.querySelector('#sv-review-note');

  var cur = 0, t = 0, playing = false, last = 0, raf = null;

  function fit(canvas, h) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 300;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }

  function idxNow(d) { return Math.max(0, Math.min(d.log.length - 1, Math.floor(t) - 1)); }

  // ---------- pool ----------
  function drawPool() {
    var d = DATA[cur], H = 360;
    var g = fit(poolC, H), c = g.c, W = g.w;
    var top = 14, bot = H - 6, span = bot - top;
    var minD = -0.35, maxD = POOL + 0.15;
    function Y(m) { return top + (m - minD) / (maxD - minD) * span; }

    c.fillStyle = '#fbfbfb'; c.fillRect(0, 0, W, H);
    // water
    c.fillStyle = '#cfe6f5'; c.fillRect(0, Y(0), W, Y(POOL) - Y(0));
    // floor
    c.fillStyle = '#9a8f7e'; c.fillRect(0, Y(POOL), W, bot - Y(POOL) + 6);
    c.strokeStyle = '#2b6a9b'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, Y(0)); c.lineTo(W, Y(0)); c.stroke();
    // hold band
    c.fillStyle = 'rgba(80,190,100,0.28)';
    c.fillRect(0, Y(HOLD - BAND), W, Y(HOLD + BAND) - Y(HOLD - BAND));
    c.fillStyle = '#2f7a3a'; c.font = '11px sans-serif';
    c.fillText('hold band', W - 62, Y(HOLD - BAND) + 12);
    // rung ticks
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; c.fillStyle = '#333';
    RUNGS.forEach(function (r) {
      c.beginPath(); c.moveTo(0, Y(r)); c.lineTo(14, Y(r)); c.stroke();
      c.fillText(r.toFixed(1) + ' m', 18, Y(r) + 4);
    });
    // floor line for the TOP of the float
    c.strokeStyle = '#c92a2a'; c.setLineDash([5, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, Y(FLOOR)); c.lineTo(W, Y(FLOOR)); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#c92a2a';
    c.fillText('floor for the top of the float', 18, Y(FLOOR) - 4);
    c.fillStyle = '#555';
    c.fillText('pool floor: ' + POOL.toFixed(2) + ' m (13 ft)', 8, Y(POOL) + 14);

    // the float
    var i = idxNow(d), depth = d.true[i];
    var fx = W * 0.62, fw = 26;
    var y0 = Y(depth), y1 = Y(depth + FLOAT_LEN);
    var touching = depth + FLOAT_LEN >= POOL - 1e-9 || depth >= FLOOR;
    c.fillStyle = touching ? '#e03131' : '#f2c200';
    c.strokeStyle = '#333'; c.lineWidth = 1.5;
    c.fillRect(fx - fw / 2, y0, fw, y1 - y0);
    c.strokeRect(fx - fw / 2, y0, fw, y1 - y0);
    c.beginPath(); c.moveTo(fx, y0); c.lineTo(fx, y0 - 10); c.stroke();   // antenna
    c.fillStyle = '#222'; c.font = 'bold 12px sans-serif';
    c.fillText(depth.toFixed(2) + ' m', fx + fw / 2 + 6, y0 + 12);
    if (touching) { c.fillStyle = '#c92a2a'; c.fillText('touching the floor!', 8, Y(POOL) - 8); }
  }

  // ---------- graph ----------
  function drawGraph() {
    var d = DATA[cur], H = 360;
    var g = fit(graphC, H), c = g.c, W = g.w;
    var L = 50, R = 14, T = 16, B = 40, pw = W - L - R, ph = H - T - B;
    var maxT = d.log.length, maxD = 3.6;
    function X(s) { return L + s / maxT * pw; }
    function Y(m) { return T + m / maxD * ph; }

    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    // hold band
    c.fillStyle = 'rgba(80,190,100,0.28)';
    c.fillRect(L, Y(HOLD - BAND), pw, Y(HOLD + BAND) - Y(HOLD - BAND));
    // grid and axes
    c.strokeStyle = '#e6e6e6'; c.fillStyle = '#444'; c.font = '12px sans-serif'; c.lineWidth = 1;
    var m, s;
    c.textAlign = 'right';
    for (m = 0; m <= 3.5; m += 0.5) {
      c.beginPath(); c.moveTo(L, Y(m)); c.lineTo(L + pw, Y(m)); c.stroke();
      c.fillText(m.toFixed(1), L - 6, Y(m) + 4);
    }
    c.textAlign = 'center';
    var step = maxT > 80 ? 20 : 10;
    for (s = 0; s <= maxT; s += step) {
      c.beginPath(); c.moveTo(X(s), T); c.lineTo(X(s), T + ph); c.stroke();
      c.fillText(String(s), X(s), T + ph + 16);
    }
    c.fillStyle = '#222'; c.font = 'bold 12px sans-serif';
    c.fillText('Time (seconds)', L + pw / 2, H - 6);
    c.save(); c.translate(13, T + ph / 2); c.rotate(-Math.PI / 2);
    c.fillText('Depth (m), surface at top', 0, 0); c.restore();
    c.textAlign = 'start';
    // floor line
    c.strokeStyle = '#c92a2a'; c.setLineDash([6, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(L, Y(FLOOR)); c.lineTo(L + pw, Y(FLOOR)); c.stroke();
    c.setLineDash([]);

    var i = idxNow(d), k;
    // what a correct judge finds
    if (judge.checked) {
      if (d.hold) {
        c.fillStyle = 'rgba(255,200,0,0.35)';
        c.fillRect(X(d.hold[0]), T, X(d.hold[1]) - X(d.hold[0]), ph);
      }
    }
    // true path (only interesting when the sensor is noisy)
    if (d.settings.noise > 0) {
      c.strokeStyle = '#9aa0a6'; c.lineWidth = 2; c.beginPath();
      for (k = 0; k <= i; k++) { if (k === 0) c.moveTo(X(k + 1), Y(d.true[k])); else c.lineTo(X(k + 1), Y(d.true[k])); }
      c.stroke();
    }
    // the packets
    c.strokeStyle = '#0b5cad'; c.fillStyle = '#0b5cad'; c.lineWidth = 2; c.beginPath();
    for (k = 0; k <= i; k++) {
      var px = X(d.log[k][0]), py = Y(d.log[k][1]);
      if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    c.beginPath(); c.arc(X(d.log[i][0]), Y(d.log[i][1]), 4, 0, Math.PI * 2); c.fill();
    // cursor
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(d.log[i][0]), T); c.lineTo(X(d.log[i][0]), T + ph); c.stroke();
  }


  // ---------- review the play: the graphs the manual asks for ----------
  // The simulator only knows depths, so the pool's temperature and light are a
  // made-up model: warm and bright at the top, cooler and darker deeper down.
  function tempAt(z) { return 22.0 + 4.0 * Math.exp(-z / 1.0); }        // degrees C
  function lightAt(z) { return 3.0 * Math.exp(-0.9 * z); }              // sensor volts

  function drawReviewGraph(canvas, d, valueAt, xmin, xmax, xlabel, title, color) {
    var H = 340;
    var g = fit(canvas, H), c = g.c, W = g.w;
    var L = 50, R = 14, T = 30, B = 44, pw = W - L - R, ph = H - T - B;
    var maxD = 2.3;
    function X(v) { return L + (v - xmin) / (xmax - xmin) * pw; }
    function Y(m) { return T + m / maxD * ph; }
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);

    c.strokeStyle = '#e6e6e6'; c.fillStyle = '#444'; c.font = '12px sans-serif'; c.lineWidth = 1;
    var m, v;
    c.textAlign = 'right';
    for (m = 0; m <= 2.0001; m += 0.5) {
      c.beginPath(); c.moveTo(L, Y(m)); c.lineTo(L + pw, Y(m)); c.stroke();
      c.fillText(m.toFixed(1), L - 6, Y(m) + 4);
    }
    c.textAlign = 'center';
    var xs = (xmax - xmin) / 5;
    for (v = xmin; v <= xmax + 1e-9; v += xs) {
      c.beginPath(); c.moveTo(X(v), T); c.lineTo(X(v), T + ph); c.stroke();
      c.fillText(v.toFixed(1), X(v), T + ph + 16);
    }
    c.fillStyle = '#222'; c.font = 'bold 12px sans-serif';
    c.fillText(xlabel, L + pw / 2, H - 6);
    c.fillText(title, L + pw / 2, 16);
    c.save(); c.translate(13, T + ph / 2); c.rotate(-Math.PI / 2);
    c.fillText('Depth (m), surface at top', 0, 0); c.restore();
    c.textAlign = 'start';

    var pts = [], missing = [];
    d.rungs.forEach(function (p, k) {
      if (!p) { missing.push(RUNGS[k]); return; }
      // the sensor measures where the float really is; the packet reports a depth
      var truth = d.true[Math.max(0, Math.min(d.true.length - 1, p[0] - 1))];
      pts.push([valueAt(truth), p[1]]);
    });
    // depths with no packet: a dashed guide and a label, so the gap is obvious
    missing.forEach(function (r) {
      c.strokeStyle = '#c92a2a'; c.setLineDash([4, 4]); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(L, Y(r)); c.lineTo(L + pw, Y(r)); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#c92a2a'; c.font = '12px sans-serif'; c.textAlign = 'right';
      c.fillText('no packet near ' + r.toFixed(1) + ' m', L + pw - 4, Y(r) - 4);
      c.textAlign = 'start';
    });
    pts.sort(function (a, b) { return a[1] - b[1]; });
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 2;
    c.beginPath();
    pts.forEach(function (p, i) { if (i === 0) c.moveTo(X(p[0]), Y(p[1])); else c.lineTo(X(p[0]), Y(p[1])); });
    c.stroke();
    pts.forEach(function (p) { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 4.5, 0, Math.PI * 2); c.fill(); });
    return missing;
  }

  function drawReview(d) {
    var missing = drawReviewGraph(tempC, d, tempAt, 21.5, 26.5,
      'Temperature (°C)', 'Temperature versus depth', '#c2410c');
    drawReviewGraph(lightC, d, lightAt, 0, 3.0,
      'Light sensor reading (volts)', 'Light versus depth', '#1d4ed8');
    var tail = ' The temperature and light numbers on these graphs are made up for the simulation: the simulated float has no real sensors.';
    if (missing.length) {
      reviewNote.textContent = d.name + ' has no packet near ' +
        missing.map(function (r) { return r.toFixed(1) + ' m'; }).join(' and ') +
        ', so a team could not graph its own data here. The manual needs a reading at every required depth. (A team in that spot may graph data MATE supplies instead.)' + tail;
    } else {
      reviewNote.textContent = d.name + ' has a packet at every required depth, so a team could graph its own data: two graphs, each with the measurement on the X axis and depth on the Y axis, drawn on a computer. The manual accepts the data from either profile.' + tail;
    }
  }

  function render() {
    var d = DATA[cur], i = idxNow(d);
    clock.textContent = 'Time: ' + d.log[i][0] + ' s   Packet depth: ' + d.log[i][1].toFixed(2) + ' m';
    slider.value = String(Math.round(t));
    drawPool(); drawGraph();
    var done = t >= d.log.length;
    review.hidden = !done;
    if (done) drawReview(d);
  }

  function loop(ts) {
    if (!playing) return;
    if (!last) last = ts;
    t += (ts - last) / 1000 * SPEED; last = ts;
    var maxT = DATA[cur].log.length;
    if (t >= maxT) { t = maxT; playing = false; play.textContent = 'Play again'; }
    render();
    if (playing) raf = requestAnimationFrame(loop);
  }

  function setPlaying(on) {
    playing = on;
    if (on) {
      if (t >= DATA[cur].log.length) t = 1;
      last = 0; play.textContent = 'Pause'; raf = requestAnimationFrame(loop);
    } else { play.textContent = 'Play'; if (raf) cancelAnimationFrame(raf); }
  }

  function selectFloat(k) {
    cur = k; t = 1; setPlaying(false); play.textContent = 'Play';
    slider.max = String(DATA[k].log.length);
    Array.prototype.forEach.call(btns.querySelectorAll('button'), function (b, j) {
      b.setAttribute('aria-pressed', j === k ? 'true' : 'false');
    });
    note.textContent = WHY[DATA[k].name] || '';
    render();
  }

  DATA.forEach(function (d, k) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = d.name;
    b.addEventListener('click', function () { selectFloat(k); });
    btns.appendChild(b);
  });
  play.addEventListener('click', function () { setPlaying(!playing); });
  slider.addEventListener('input', function () { setPlaying(false); play.textContent = 'Play'; t = parseInt(slider.value, 10); render(); });
  judge.addEventListener('change', render);
  var timer = null;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(render, 120); });

  root.classList.add('sv-ready');
  selectFloat(0);
})();
