'use strict';
// Tricampus Conquest. Edit REGIONS and TERRITORIES to match the real campus.
// Territories are rectangles [x, y, w, h] on a 1000 x 620 map. Two territories
// that share an edge touch, so they are neighbors. EXTRA_LINKS adds paths
// that are not shared edges (pairs of territory ids).
const REGIONS = {
  ms:  { name: 'MIDDLE SCHOOL', bonus: 3, tint: '#e8c9a0' },
  hs:  { name: 'HIGH SCHOOL',   bonus: 3, tint: '#b9cdea' },
  cte: { name: 'CTE',           bonus: 2, tint: '#bfe3b8' },
  com: { name: '',              bonus: 0, tint: '#d9d2c3' },
};
const TERRITORIES = [
  // id, name, region, rect
  ['ms-office', 'MS Office',      'ms', [0, 200, 140, 120]],
  ['ms-lib',    'MS Library',     'ms', [140, 200, 140, 120]],
  ['ms-sci',    'MS Science',     'ms', [280, 200, 140, 120]],
  ['ms-quad',   'MS Quad',        'ms', [0, 320, 280, 110]],
  ['ms-cafe',   'MS Cafeteria',   'ms', [280, 320, 140, 110]],
  ['ms-gym',    'MS Gym',         'ms', [0, 430, 140, 190]],
  ['ms-port',   'MS Portables',   'ms', [140, 430, 140, 190]],
  ['ms-field',  'MS Field',       'ms', [280, 430, 140, 190]],
  ['parking',   'Parking Lot',    'com', [420, 200, 160, 420]],
  ['woods',     'The Redwoods',   'com', [0, 0, 580, 200]],
  ['hs-main',   'HS Main Bldg',   'hs', [580, 200, 140, 120]],
  ['hs-lib',    'HS Library',     'hs', [720, 200, 140, 120]],
  ['hs-theater','Theater',        'hs', [860, 200, 140, 120]],
  ['hs-quad',   'HS Quad',        'hs', [580, 320, 280, 110]],
  ['hs-cafe',   'HS Cafeteria',   'hs', [860, 320, 140, 110]],
  ['hs-gym',    'HS Gym',         'hs', [580, 430, 140, 190]],
  ['hs-track',  'Track & Field',  'hs', [720, 430, 280, 190]],
  ['cte-tech',  'Tech Building',  'cte', [580, 0, 100, 120]],
  ['cte-green', 'Greenhouse',     'cte', [680, 0, 80, 120]],
  ['cte-ag',    'Ag Building',    'cte', [760, 0, 100, 120]],
  ['tennis',    'Tennis Courts',  'hs', [860, 0, 140, 200]],
  ['cte-walk',  'CTE Walkway',    'cte', [580, 120, 280, 80]],
];
const EXTRA_LINKS = [];
// Allies can't attack each other and win together (if both are in the game).
const ALLIANCES = [['Brownovia', 'Brandtonia']]; // the CTE alliance
const COLORS = ['#d1242f', '#2a7ae2', '#2da44e', '#e3a008', '#8250df', '#1b1f23'];
const COUNTRIES = [
  // [country, subject taught, motto]. Made up, derived from teachers' last names.
  ['Brandtonia', 'Graphic Design', 'Pixels over power'],
  ['Brownovia', 'Computer Science', 'Ctrl+Alt+Conquer'],
  ['Buiestan', 'ELD', 'Many tongues, one empire'],
  ['Clarkeshire', 'Language Arts', 'Conquer with a strong thesis'],
  ['Croomania', 'Education Specialist', 'Every citizen counts'],
  ['Curcistan', 'Science', 'Hypothesis: we win'],
  ['Cymanskovia', 'Science', 'Reaction guaranteed'],
  ['Dahlenzuela', 'Spanish', 'Viva la victoria'],
  ['Devinique', 'French', 'Liberte, egalite, territoire'],
  ['Donovania', 'Language Arts', 'Plot twist: we invade'],
  ['Heningria', 'Math', 'Divide and conquer'],
  ['Hornmark', 'Math', 'Solve for victory'],
  ['Hunterra', 'Art', 'Paint the map our color'],
  ['Listonia', 'Music', 'March to the beat'],
  ['Murrayvia', 'Adapted PE', 'Never skip warmups'],
  ['Obrienburg', 'PE', 'Run the extra lap'],
  ['Olivieria', 'Social Studies', 'History is written by us'],
  ['Peabodia', 'Math', 'Show your work, then your army'],
  ['Purtschenia', 'Social Studies', 'Rise and fall of everyone else'],
  ['Richeystan', 'Digital Media', 'Like, share, invade'],
  ['Rossgard', 'PE', 'Hustle up the hill'],
  ['Seletzkia', 'Science', 'Observe, then attack'],
  ['Tranquilia', 'Social Studies', 'Peace through superior armies'],
  ['Wilhitania', 'Drama', 'All the campus is a stage'],
  ['Wyndoria', 'Leadership', 'Lead from the front line'],
  ['Bondavia', 'SDC', 'Small team, big heart'],
  ['Germannsburg', 'SDC', 'Steady and unstoppable'],
  ['Mikolyskia', 'Education Specialist', 'Support wins wars'],
];

const N = TERRITORIES.length;
const T = TERRITORIES.map(([id, name, region, r]) => ({ id, name, region, r }));
const adj = T.map(() => new Set());
function touch(a, b) {
  const [ax, ay, aw, ah] = a, [bx, by, bw, bh] = b;
  const ox = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
  const oy = Math.min(ay + ah, by + bh) - Math.max(ay, by);
  return (ox === 0 && oy > 10) || (oy === 0 && ox > 10);
}
for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (touch(T[i].r, T[j].r)) { adj[i].add(j); adj[j].add(i); }
for (const [a, b] of EXTRA_LINKS) { const i = T.findIndex(t => t.id === a), j = T.findIndex(t => t.id === b); adj[i].add(j); adj[j].add(i); }

const KINDS = ['● Infantry', '▲ Cavalry', '■ Artillery'];
const SET_VALUES = [4, 6, 8, 10, 12, 15]; // then +5 each trade, as in Risk
const $ = id => document.getElementById(id);

// ---------- sound (made with the Web Audio API, no files) ----------
const sfx = (() => {
  let ctx = null, muted = false;
  const get = () => {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return ctx;
  };
  const noise = (c, dur) => {
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = b; return src;
  };
  const env = (c, g, t0, peak, dur) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); };
  const tone = (c, type, f, t0, dur, vol) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    env(c, g, t0, vol, dur); o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  };
  return {
    toggle() { muted = !muted; return muted; },
    isMuted: () => muted,
    wake() { get(); },
    tick() { const c = get(); if (c) tone(c, 'sine', 700, c.currentTime, 0.06, 0.15); },
    dice() {
      const c = get(); if (!c) return;
      for (let i = 0; i < 7; i++) {
        const t = c.currentTime + i * 0.04 + Math.random() * 0.02, n = noise(c, 0.03), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 2500; env(c, g, t, 0.35, 0.03);
        n.connect(f).connect(g).connect(c.destination); n.start(t);
      }
    },
    boom(size) {
      const c = get(); if (!c) return; const t = c.currentTime, k = Math.min(1.6, 0.7 + size * 0.15);
      const n = noise(c, 0.7), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(90, t + 0.6);
      env(c, g, t, 0.7 * k, 0.65); n.connect(f).connect(g).connect(c.destination); n.start(t);
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      env(c, og, t, 0.8 * k, 0.55); o.connect(og).connect(c.destination); o.start(t); o.stop(t + 0.7);
    },
    capture() { const c = get(); if (!c) return; [523, 659, 784, 1047].forEach((f, i) => tone(c, 'square', f, c.currentTime + i * 0.09, 0.16, 0.12)); },
    chime() { const c = get(); if (!c) return; [880, 1320].forEach((f, i) => tone(c, 'triangle', f, c.currentTime + i * 0.12, 0.35, 0.25)); },
    win() { const c = get(); if (!c) return; [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(c, 'square', f, c.currentTime + i * 0.13, 0.25, 0.14)); },
  };
})();
const svgNS = 'http://www.w3.org/2000/svg';
let S = null; // game state

// ---------- setup ----------
function drawNames() {
  const n = +$('count').value, box = $('names');
  box.textContent = '';
  const pick = COUNTRIES.map((_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div'); row.className = 'prow';
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = COLORS[i];
    const sel = document.createElement('select'); sel.className = 'country';
    COUNTRIES.forEach((c, k) => { const o = document.createElement('option'); o.value = k; o.textContent = c[0] + ' (' + c[1] + ')'; sel.append(o); });
    sel.value = pick[i];
    const kind = document.createElement('select'); kind.className = 'kind';
    for (const v of ['Human', 'Bot']) { const o = document.createElement('option'); o.textContent = v; kind.append(o); }
    kind.value = i === 0 ? 'Human' : 'Bot';
    row.append(sw, sel, kind); box.append(row);
  }
}
$('count').onchange = drawNames; drawNames();

$('mute').onclick = () => { const m = sfx.toggle(); $('mute').textContent = m ? 'Sound: off' : 'Sound: on'; if (!m) sfx.tick(); };
$('start').onclick = () => {
  sfx.wake();
  const picks = [...$('names').querySelectorAll('.country')].map(e => +e.value);
  const bots = [...$('names').querySelectorAll('.kind')].map(e => e.value === 'Bot');
  if (new Set(picks).size < picks.length) { alert('Each player needs a different country.'); return; }
  const P = picks.length;
  S = { players: picks.map((k, i) => ({ name: COUNTRIES[k][0], motto: COUNTRIES[k][2], color: COLORS[i], bot: bots[i], alive: true, cards: [] })),
        owner: [], armies: [], cur: 0, phase: 'reinforce', pool: 0, sel: null, log: [], over: false,
        conquered: false, attacked: false, alliances: $('allies').checked, trades: 0, move: null, deck: [], keep: false };
  const order = [...Array(N).keys()].sort(() => Math.random() - 0.5);
  order.forEach((t, k) => { S.owner[t] = k % P; S.armies[t] = 1; });
  const extra = Math.max(4, Math.floor(N / P) * 2);
  for (let p = 0; p < P; p++) {
    const mine = owned(p);
    for (let k = 0; k < extra; k++) S.armies[mine[Math.floor(Math.random() * mine.length)]]++;
  }
  $('setup').hidden = true; $('game').hidden = false; $('newgame').hidden = false;
  if (S.alliances) ALLIANCES.forEach(g => { const here = g.filter(n => S.players.some(p => p.name === n)); if (here.length > 1) say(`Alliance: ${here.join(' and ')} will not fight each other.`); });
  say(`${S.players[0].name} stands on the hill and declares war on everyone. "${S.players[0].motto}!"`);
  startTurn();
};
$('newgame').onclick = () => { if (confirm('Abandon this game?')) location.reload(); };
$('keep').onchange = e => { if (S) S.keep = e.target.checked; };

// ---------- helpers ----------
function say(t) { S.log.unshift(t); }
function owned(p) { return T.map((_, i) => i).filter(i => S.owner[i] === p); }
function regionIds(k) { return T.map((t, i) => t.region === k ? i : -1).filter(i => i >= 0); }
function bonusFor(p) {
  let b = 0;
  for (const k in REGIONS) if (REGIONS[k].bonus && regionIds(k).every(i => S.owner[i] === p)) b += REGIONS[k].bonus;
  return b;
}
const me = () => S.players[S.cur];
function allied(p, q) {
  if (p === q) return true;
  if (!S.alliances) return false;
  const a = S.players[p].name, b = S.players[q].name;
  return ALLIANCES.some(g => g.includes(a) && g.includes(b));
}
function foe(i, j) { return !allied(S.owner[i], S.owner[j]); } // true if territories i and j belong to enemies
function hasEnemyNeighbor(i) { for (const j of adj[i]) if (foe(i, j)) return true; return false; }
function connected(a, b) {
  const seen = new Set([a]), q = [a];
  while (q.length) { const x = q.shift(); if (x === b) return true;
    for (const y of adj[x]) if (!seen.has(y) && S.owner[y] === S.cur) { seen.add(y); q.push(y); } }
  return false;
}
const roll = n => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);

// ---------- cards ----------
function newDeck() {
  const d = T.map((_, i) => ({ t: i, k: i % 3 })); d.push({ t: -1, k: -1 }, { t: -1, k: -1 });
  return d.sort(() => Math.random() - 0.5);
}
function drawCard(p) { if (!S.deck.length) S.deck = newDeck(); p.cards.push(S.deck.pop()); }
function validSet(c) {
  const ks = c.filter(x => x.k >= 0).map(x => x.k);
  return new Set(ks).size === ks.length ? true : new Set(ks).size === 1;
}
function findSet(pi) {
  const c = S.players[pi].cards; let best = null, bs = -1;
  for (let a = 0; a < c.length; a++) for (let b = a + 1; b < c.length; b++) for (let d = b + 1; d < c.length; d++) {
    const trio = [c[a], c[b], c[d]];
    const ks = trio.filter(x => x.k >= 0).map(x => x.k), u = new Set(ks).size;
    if (!(u === 1 || u === ks.length)) continue;
    const sc = trio.filter(x => x.t >= 0 && S.owner[x.t] === pi).length;
    if (sc > bs) { bs = sc; best = [a, b, d]; }
  }
  return best;
}
function setValue() { return S.trades < SET_VALUES.length ? SET_VALUES[S.trades] : 15 + 5 * (S.trades - 5); }
function canTrade() { return (S.phase === 'reinforce' || (S.phase === 'attack' && !S.attacked)) && !S.move && !!findSet(S.cur); }
function doTrade() {
  const p = me(), idx = findSet(S.cur), v = setValue();
  const trio = idx.map(i => p.cards[i]);
  p.cards = p.cards.filter((_, i) => !idx.includes(i));
  sfx.chime(); S.pool += v; S.trades++; if (S.phase === 'attack') S.phase = 'reinforce';
  let msg = `${p.name} trades a set of cards for ${v} armies.`;
  const mine = trio.find(x => x.t >= 0 && S.owner[x.t] === S.cur);
  if (mine) { S.armies[mine.t] += 2; msg += ` +2 on ${T[mine.t].name} (it was on a card).`; }
  say(msg);
}
$('trade').onclick = () => { if (S && !me().bot && canTrade()) { doTrade(); render(); } };

// ---------- turn flow ----------
function startTurn() {
  S.phase = 'reinforce'; S.sel = null; S.conquered = false; S.attacked = false; S.move = null;
  S.pool = Math.max(3, Math.floor(owned(S.cur).length / 3)) + bonusFor(S.cur);
  render();
  if (me().bot) setTimeout(botStep, 600);
}
function endTurn() {
  if (S.conquered) { drawCard(me()); }
  do { S.cur = (S.cur + 1) % S.players.length; } while (!S.players[S.cur].alive);
  say(`${me().name}'s turn.`);
  startTurn();
}
function mustTrade() { return me().cards.length >= 5; }

// ---------- human actions ----------
function clickT(i) {
  if (S.over || me().bot || S.move) return;
  const m = S.cur;
  if (S.phase === 'reinforce') {
    if (S.owner[i] !== m) return;
    if (mustTrade()) { if (canTrade()) doTrade(); render(); return; }
    S.armies[i]++; S.pool--; sfx.tick();
    if (S.pool === 0) S.phase = 'attack';
  } else if (S.phase === 'attack') {
    if (S.owner[i] === m) S.sel = S.armies[i] >= 2 ? i : null;
    else if (S.sel !== null && adj[S.sel].has(i) && foe(S.sel, i)) attack(S.sel, i, S.keep);
  } else if (S.phase === 'fortify') {
    if (S.owner[i] !== m) return;
    if (S.sel !== null && i !== S.sel && S.armies[S.sel] >= 2 && connected(S.sel, i)) { S.armies[S.sel]--; S.armies[i]++; }
    else S.sel = S.armies[i] >= 2 ? i : null;
  }
  render();
}
function attack(a, d, keep) {
  S.attacked = true;
  let la = 0, ld = 0, last = null, took = false;
  do {
    const ad = Math.min(3, S.armies[a] - 1);
    if (ad < 1) break;
    const dd = Math.min(2, S.armies[d]);
    const ar = roll(ad), dr = roll(dd);
    last = { ar, dr };
    for (let k = 0; k < Math.min(ad, dd); k++) { if (ar[k] > dr[k]) { S.armies[d]--; ld++; } else { S.armies[a]--; la++; } }
    if (S.armies[d] <= 0) { took = true; break; }
    if (!keep) say(`${T[a].name} attacks ${T[d].name}: [${ar}] vs [${dr}]`);
  } while (keep && S.armies[a] >= 2);
  if (last) {
    sfx.dice();
    setTimeout(() => { if (ld + la) sfx.boom(took ? 4 : ld + la); if (took) sfx.capture(); }, 280);
    S.lastRoll = { ...last, a, d };
    S.fx = (S.fx || []).filter(e => performance.now() - e.born < 1200);
    S.fx.push({ a, d, la, ld, took, born: performance.now() });
  }
  if (took) { conquer(a, d, last.ar.length); return; }
  if (keep) say(`${T[a].name} attacks ${T[d].name} until it can't go on.`);
  if (S.armies[a] < 2) S.sel = null;
}
function conquer(a, d, dice) {
  const loser = S.owner[d];
  S.owner[d] = S.cur; S.conquered = true;
  const mv = Math.min(dice, S.armies[a] - 1);
  S.armies[a] -= mv; S.armies[d] = mv;
  say(`${me().name} takes ${T[d].name} from ${S.players[loser].name}!`);
  if (!owned(loser).length) {
    S.players[loser].alive = false;
    me().cards.push(...S.players[loser].cards); S.players[loser].cards = [];
    say(`${S.players[loser].name} is wiped out. ${me().name} takes their cards.`);
  }
  const alive = S.players.map((p, i) => i).filter(i => S.players[i].alive);
  if (alive.every(a => alive.every(b => allied(a, b)))) {
    S.over = true; S.sel = null; sfx.win();
    say(`${alive.map(i => S.players[i].name).join(' and ')} rule${alive.length > 1 ? '' : 's'} the whole campus!`); return;
  }
  const extra = S.armies[a] - 1;
  S.sel = a;
  if (extra > 0 && !me().bot) { S.move = { a, d, extra }; return; }
  finishMove();
}
function shift(n) { // move n more armies into the new territory
  const m = S.move; n = Math.min(n, m.extra);
  S.armies[m.a] -= n; S.armies[m.d] += n; m.extra -= n;
  if (m.extra === 0) finishMove(); render();
}
function finishMove() {
  const m = S.move; S.move = null;
  const a = m ? m.a : S.sel;
  S.sel = null; // the selection after a capture is simply cleared; click again to continue
  if (m) { if (S.armies[m.d] >= 2) S.sel = m.d; else if (S.armies[m.a] >= 2) S.sel = m.a; }
}
$('mv1').onclick = () => shift(1);
$('mvall').onclick = () => shift(S.move.extra);
$('mvdone').onclick = () => { finishMove(); render(); };
$('next').onclick = () => {
  if (S.over || me().bot || S.move || S.phase === 'reinforce') return;
  if (S.phase === 'attack') { S.phase = 'fortify'; S.sel = null; render(); return; }
  endTurn();
};

// ---------- bots ----------
function regionFrac(k, p) { const ids = regionIds(k); return ids.filter(i => S.owner[i] === p).length / ids.length; }
function botStep() {
  if (!S || S.over || !me().bot) return;
  const p = S.cur;
  if (S.phase === 'reinforce') {
    if (findSet(p) && (mustTrade() || me().cards.length >= 3)) { doTrade(); render(); return setTimeout(botStep, 500); }
    const border = owned(p).filter(hasEnemyNeighbor);
    let best = border[0] !== undefined ? border[0] : owned(p).sort((x, y) => S.armies[y] - S.armies[x])[0], bs = -1e9;
    for (const i of border) {
      const foes = [...adj[i]].filter(j => foe(i, j));
      const weak = Math.min(...foes.map(j => S.armies[j]));
      const prog = Math.max(...foes.map(j => regionFrac(T[j].region, p)));
      const sc = prog * 10 - weak + S.armies[i] * 0.3;
      if (sc > bs) { bs = sc; best = i; }
    }
    S.armies[best] += S.pool; say(`${me().name} reinforces ${T[best].name} with ${S.pool}.`); S.pool = 0; S.phase = 'attack';
    render(); return setTimeout(botStep, 500);
  }
  if (S.phase === 'attack') {
    let best = null, bs = 0;
    for (const a of owned(p)) {
      if (S.armies[a] < 2) continue;
      for (const d of adj[a]) {
        if (!foe(a, d)) continue;
        const edge = S.armies[a] - S.armies[d];
        if (edge < 2 && !(S.armies[d] === 1 && S.armies[a] >= 2)) continue;
        const loser = S.owner[d];
        const sc = edge + regionFrac(T[d].region, p) * 5 + (owned(loser).length === 1 ? 6 : 0) + (S.players[loser].cards.length >= 3 ? 2 : 0);
        if (best === null || sc > bs) { bs = sc; best = [a, d]; }
      }
    }
    if (!best) { S.phase = 'fortify'; return botStep(); }
    const [a, d] = best;
    attack(a, d, true);
    if (S.over) { render(); return; }
    // a bot always moves everything forward when the new place still borders enemies
    if (S.owner[d] === p && S.armies[a] > 1 && hasEnemyNeighbor(d)) { const n = S.armies[a] - 1; S.armies[a] -= n; S.armies[d] += n; }
    render(); return setTimeout(botStep, 1100);
  }
  // fortify
  let src = null;
  for (const i of owned(p)) if (!hasEnemyNeighbor(i) && S.armies[i] >= 2 && (src === null || S.armies[i] > S.armies[src])) src = i;
  if (src !== null) {
    const dest = owned(p).filter(i => hasEnemyNeighbor(i) && connected(src, i));
    if (dest.length) {
      dest.sort((x, y) => S.armies[x] - S.armies[y]);
      S.armies[dest[0]] += S.armies[src] - 1; S.armies[src] = 1;
      say(`${me().name} marches troops to ${T[dest[0]].name}.`);
    }
  }
  render(); setTimeout(endTurn, 500);
}

// ---------- drawing ----------
function starPoints(cx, cy, R) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.45 : R, an = -Math.PI / 2 + i * Math.PI / 5; pts.push((cx + r * Math.cos(an)).toFixed(1) + ',' + (cy + r * Math.sin(an)).toFixed(1)); }
  return pts.join(' ');
}
function drawArmy(g, x, y, w, n) {
  // 10 = gold star, 5 = tank, 1 = soldier
  const toks = [];
  for (let i = 0; i < Math.floor(n / 10); i++) toks.push(10);
  for (let i = 0; i < Math.floor((n % 10) / 5); i++) toks.push(5);
  for (let i = 0; i < n % 5; i++) toks.push(1);
  const per = Math.max(3, Math.floor((w - 24) / 17));
  toks.forEach((v, k) => {
    const row = Math.floor(k / per), col = k % per, cnt = Math.min(per, toks.length - row * per);
    const cx = x + (col - (cnt - 1) / 2) * 17, cy = y + row * 19;
    const o = { 'pointer-events': 'none' };
    if (v === 1) {
      el('rect', { ...o, x: cx - 3.5, y: cy - 2, width: 7, height: 9, rx: 2, fill: '#fff', stroke: '#222', 'stroke-width': 1 }, g);
      el('circle', { ...o, cx, cy: cy - 5.5, r: 3.4, fill: '#fff', stroke: '#222', 'stroke-width': 1 }, g);
      el('line', { ...o, x1: cx + 3, y1: cy + 1, x2: cx + 8, y2: cy - 4, stroke: '#222', 'stroke-width': 1.6 }, g);
    } else if (v === 5) {
      el('rect', { ...o, x: cx - 8, y: cy - 1, width: 16, height: 8, rx: 3, fill: '#fff', stroke: '#222', 'stroke-width': 1 }, g);
      el('rect', { ...o, x: cx - 4, y: cy - 6, width: 8, height: 6, rx: 2, fill: '#fff', stroke: '#222', 'stroke-width': 1 }, g);
      el('line', { ...o, x1: cx + 4, y1: cy - 3.5, x2: cx + 11, y2: cy - 3.5, stroke: '#222', 'stroke-width': 2 }, g);
    } else {
      el('polygon', { ...o, points: starPoints(cx, cy, 10), fill: '#ffd33d', stroke: '#222', 'stroke-width': 1.2 }, g);
    }
  });
}
// Redwood trees: tall reddish trunks with a dark green crown, drawn inside a clip so they stay in their territory.
const TREES = [[20,.9],[75,1.1],[125,.8],[170,1.2],[225,.95],[275,1.15],[320,.85],[370,1.25],[420,1],[470,.9],[520,1.2],[565,.85]];
function drawRedwoods(g, t) {
  const [x, y, w, h] = t.r, id = 'clip-' + t.id;
  const cp = el('clipPath', { id }, g); el('rect', { x, y, width: w, height: h }, cp);
  const f = el('g', { 'clip-path': 'url(#' + id + ')', 'pointer-events': 'none', opacity: .8 }, g);
  el('rect', { x, y: y + h - 26, width: w, height: 26, fill: '#3b2616', opacity: .45 }, f);        // needle-covered ground
  TREES.forEach(([tx, k], n) => {
    const cx = x + tx, base = y + h + 4, th = h * (0.78 + 0.22 * (k - 0.8)), tw = 15 * k;
    el('polygon', { points: `${cx - tw / 2},${base} ${cx - tw * 0.28},${base - th} ${cx + tw * 0.28},${base - th} ${cx + tw / 2},${base}`, fill: n % 2 ? '#7a3320' : '#8c3d26' }, f);
    for (let r = 1; r < 5; r++) el('line', { x1: cx - tw * 0.08 * r, y1: base, x2: cx - tw * 0.05 * r, y2: base - th * 0.9, stroke: '#4d1f12', 'stroke-width': 1, opacity: .6 }, f);
    const top = base - th;                                                                            // crown
    el('ellipse', { cx, cy: top + 6, rx: 17 * k, ry: 26 * k, fill: '#1d4d2b' }, f);
    el('ellipse', { cx: cx - 7 * k, cy: top + 20, rx: 14 * k, ry: 20 * k, fill: '#256338', opacity: .9 }, f);
    el('ellipse', { cx: cx + 8 * k, cy: top + 28, rx: 13 * k, ry: 18 * k, fill: '#1d4d2b', opacity: .9 }, f);
  });
  for (let i = 0; i < 9; i++) {                                                                     // ferns
    const fx = x + 30 + i * 62, fy = y + h - 4;
    for (let a = -2; a <= 2; a++) el('path', { d: `M${fx},${fy} q${a * 9},-16 ${a * 14},-22`, stroke: '#4f9d4a', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, f);
  }
}
function centerOf(i) { const [x, y, w, h] = T[i].r; return [x + w / 2, y + Math.min(h / 2, 44)]; }
function drawFx(svg) {
  const now = performance.now(), live = (S.fx || []).filter(e => now - e.born < 1100);
  for (const e of live) {
    const dl = 'animation-delay:-' + Math.round(now - e.born) + 'ms';
    const [ax, ay] = centerOf(e.a), [dx, dy] = centerOf(e.d);
    el('line', { x1: ax, y1: ay, x2: dx, y2: dy, class: 'beam', style: dl }, svg);
    const boom = (cx, cy, size, text, big) => {
      const g = el('g', { 'pointer-events': 'none' }, svg);
      el('circle', { cx, cy, r: 14 * size, class: 'boom', style: dl, fill: '#ff7a1a' }, g);
      el('circle', { cx, cy, r: 8 * size, class: 'boom b2', style: dl, fill: '#ffe45c' }, g);
      for (let k = 0; k < 10; k++) {
        const an = k * Math.PI / 5 + 0.3, dist = (30 + (k % 3) * 12) * size;
        el('circle', { cx, cy, r: 2.6, class: 'spark', fill: k % 2 ? '#ffd33d' : '#fff', style: `--dx:${(Math.cos(an) * dist).toFixed(0)}px;--dy:${(Math.sin(an) * dist).toFixed(0)}px;${dl}` }, g);
      }
      el('text', { x: cx, y: cy - 10, class: 'dmg', style: dl }, g).textContent = text;
    };
    if (e.ld > 0) boom(dx, dy, e.took ? 1.8 : 1 + e.ld * 0.25, '-' + e.ld);
    if (e.la > 0) boom(ax, ay, 0.8 + e.la * 0.2, '-' + e.la);
    if (e.took) el('text', { x: dx, y: dy - 30, class: 'dmg flag', style: dl }, svg).textContent = '\u2691 CAPTURED';
  }
}

function el(name, attrs, parent) {
  const e = document.createElementNS(svgNS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.append(e); return e;
}
function render() {
  const svg = $('map'); svg.textContent = '';
  T.forEach((t, i) => {
    const [x, y, w, h] = t.r, p = S.players[S.owner[i]];
    const g = el('g', {}, svg);
    const r = el('rect', { x, y, width: w, height: h, class: 't', fill: p.color, 'fill-opacity': .78 }, g);
    r.addEventListener('click', () => clickT(i));
    el('rect', { x: x + 3, y: y + 3, width: w - 6, height: h - 6, fill: 'none', stroke: REGIONS[t.region].tint, 'stroke-width': 4, 'pointer-events': 'none' }, g);
    if (t.id === 'woods') drawRedwoods(g, t);
    const hl = S.sel === i ? '#fff' : (S.sel !== null && S.phase === 'attack' && adj[S.sel].has(i) && foe(S.sel, i) ? '#ffe600' : null);
    if (hl) el('rect', { x: x + 1, y: y + 1, width: w - 2, height: h - 2, fill: 'none', stroke: hl, 'stroke-width': 5, 'pointer-events': 'none' }, g);
    el('text', { x: x + w / 2, y: y + 20, class: 'lbl' }, g).textContent = t.name;
    drawArmy(g, x + w / 2, y + Math.min(h / 2 + 8, 52), w, S.armies[i]);
    el('circle', { cx: x + w - 16, cy: y + h - 16, r: 12, fill: '#111c', 'pointer-events': 'none' }, g);
    el('text', { x: x + w - 16, y: y + h - 10.5, class: 'army' }, g).textContent = S.armies[i];
  });
  drawFx(svg);
  for (const k in REGIONS) if (REGIONS[k].name) {
    const ts = T.filter(t => t.region === k); const y = Math.min(...ts.map(t => t.r[1])), x = Math.min(...ts.map(t => t.r[0]));
    el('text', { x: x + 8, y: y - 4 < 12 ? y + 14 : y - 4, class: 'reg' }, svg).textContent = REGIONS[k].name + ' (+' + REGIONS[k].bonus + ')';
  }
  const m = me();
  $('who').textContent = ''; const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = m.color;
  $('who').append(sw, document.createTextNode(m.name + (m.bot ? ' (bot) ' : ' ')));
  const mo = document.createElement('small'); mo.className = 'fine'; mo.textContent = '"' + m.motto + '"'; $('who').append(mo);

  const dc = $('dice'); dc.textContent = '';
  if (S.lastRoll) {
    const L = S.lastRoll, face = n => String.fromCodePoint(0x267F + n);
    const line = (lbl, arr, cls) => { const d = document.createElement('div'); d.className = 'diceline ' + cls;
      d.textContent = lbl + ' ' + arr.map(face).join(' '); dc.append(d); };
    line('Attack', L.ar, 'dA'); line('Defend', L.dr, 'dD');
  }
  let msg;
  if (S.over) msg = S.log[0];
  else if (m.bot) msg = 'The bot is thinking...';
  else if (S.move) msg = `You took it! Send more armies in? (${S.move.extra} can still move.)`;
  else if (S.phase === 'reinforce') msg = mustTrade() ? 'You hold 5 cards: trade a set before placing.' : `Place armies: click your buildings. ${S.pool} left.`;
  else if (S.phase === 'attack') msg = S.sel === null ? 'Attack: click your building with 2+ armies, then a touching enemy (yellow).' : `Attacking from ${T[S.sel].name}. Click a yellow enemy.`;
  else msg = 'Fortify (optional): click a building, then a connected one of yours to slide 1 army.';
  $('msg').textContent = msg;

  const human = !m.bot && !S.over;
  $('moveui').hidden = !(S.move && human);
  $('opts').hidden = !(S.phase === 'attack' && human && !S.move);
  $('trade').hidden = !human;
  $('trade').disabled = !canTrade();
  $('trade').textContent = 'Trade cards (' + setValue() + ' armies)';
  $('next').textContent = S.phase === 'attack' ? 'Done attacking' : 'End turn';
  $('next').disabled = S.phase === 'reinforce' || S.over || !!S.move || m.bot;

  const cd = $('cards'); cd.textContent = '';
  if (human) {
    const t = document.createElement('div'); t.className = 'fine';
    t.textContent = m.cards.length ? 'Your cards (3 of a kind, or one of each, trade in; a wild fits anywhere):' : 'No cards yet. Capture at least one building in a turn to earn a card.';
    cd.append(t);
    m.cards.forEach(c => { const s = document.createElement('span'); s.className = 'card';
      s.textContent = (c.k < 0 ? '★ Wild' : KINDS[c.k]) + (c.t >= 0 ? ' - ' + T[c.t].name : ''); cd.append(s); });
  }
  const sc = $('score'); sc.textContent = '';
  S.players.forEach((p, i) => {
    const tr = sc.insertRow(); if (!p.alive) tr.className = 'dead';
    const c = tr.insertCell(); const s = document.createElement('span'); s.className = 'sw'; s.style.background = p.color; c.append(s);
    tr.insertCell().textContent = p.name + (S.alliances && S.players.some((q, j) => j !== i && allied(i, j)) ? ' \u2764' : '');
    const o = owned(i); tr.insertCell().textContent = o.length + ' bldg';
    tr.insertCell().textContent = o.reduce((a, b) => a + S.armies[b], 0) + ' arm.';
    tr.insertCell().textContent = p.cards.length + ' cards';
  });
  const log = $('log'); log.textContent = '';
  S.log.slice(0, 40).forEach(l => { const p = document.createElement('p'); p.textContent = l; log.append(p); });
}
