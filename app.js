// Study Quest — one engine, many homework units. Each unit (units/*.js) is pure data:
// facts → Study Cards + Quiz, sorts → Sort games, say → grown-up-checked test practice,
// stations → which games appear on the home screen and in what order.
import { UNITS } from './units/index.js';
import { MAPS } from './maps/georgia.js';
import { sfx, speak, hush, unlockAudio, setSound, soundOn } from './audio.js';

const app = document.getElementById('app');
const fx = document.getElementById('fx');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const PRAISE = ['Yes!', 'You got it!', 'Nice!', 'Great job!', 'Awesome!', 'That’s right!'];
const praise = () => PRAISE[Math.random() * PRAISE.length | 0];

// ---------- storage (localStorage can throw in private mode; the app still runs without it) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- unit + progress ----------
function daysUntil(iso) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + 'T00:00:00') - t) / 864e5);
}
function defaultUnit() {
  const saved = UNITS.find(u => u.id === store.get('sq:unit'));
  if (saved) return saved;
  const upcoming = UNITS.filter(u => daysUntil(u.testDate) >= 0).sort((a, b) => daysUntil(a.testDate) - daysUntil(b.testDate));
  return upcoming[0] || UNITS.at(-1);
}

let unit, state;
function useUnit(u) {
  unit = u;
  state = Object.assign({ mastery: {}, stars: {}, say: {}, missed: {} }, store.get('sq:' + u.id, {}));
  store.set('sq:unit', u.id);
}
const save = () => store.set('sq:' + unit.id, state);
const mastery = id => state.mastery[id] || 0;

function stationScore(st) {
  if (st.type === 'quiz') return unit.facts.reduce((s, f) => s + mastery(f.id), 0) / (unit.facts.length * 3);
  if (st.type === 'say') return unit.say.filter(p => (state.say[p.id] || 0) >= p.need).length / unit.say.length;
  return (state.stars[st.id] || 0) / 3;
}
const readiness = () => Math.round(100 * unit.stations.reduce((s, st) => s + stationScore(st), 0) / unit.stations.length);

function standardScore(stdId) {
  const parts = [];
  const facts = unit.facts.filter(f => f.std === stdId);
  if (facts.length) parts.push(facts.reduce((s, f) => s + mastery(f.id), 0) / (facts.length * 3));
  const says = unit.say.filter(p => p.std === stdId);
  if (says.length) parts.push(says.filter(p => (state.say[p.id] || 0) >= p.need).length / says.length);
  return parts.length ? Math.round(100 * parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
}

function nextStation(afterId) {
  const list = unit.stations;
  const start = afterId ? list.findIndex(s => s.id === afterId) + 1 : 0;
  const ordered = [...list.slice(start), ...list.slice(0, start)];
  return ordered.find(s => stationScore(s) < 1) || list.find(s => s.type === 'quiz') || list[0];
}

// ---------- shell ----------
let handlers = {};
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

function stars(n, size = '') {
  return `<span class="stars ${size}" aria-label="${n} of 3 stars">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}">${i < n ? '★' : '☆'}</i>`).join('')}</span>`;
}
const soundBtn = () => `<button class="icon-btn" data-act="sound" aria-pressed="${soundOn()}" aria-label="${soundOn() ? 'Sound on — tap to mute' : 'Sound off — tap to turn on'}">${soundOn() ? '🔊' : '🔇'}</button>`;

function screen(title, body, cls = '') {
  app.innerHTML = `
    <header class="bar">
      <button class="pill back" data-act="home"><span aria-hidden="true">‹</span> Home</button>
      <h1 class="bar-title">${esc(title)}</h1>
      ${soundBtn()}
    </header>
    <main class="screen ${cls}">${body}</main>
    <p id="live" class="sr" aria-live="polite"></p>`;
}
const live = t => { const el = document.getElementById('live'); if (el) el.textContent = t; };
const progress = (done, total) => `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="Progress"><i style="width:${100 * done / total}%"></i></div>`;

app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  unlockAudio();
  const act = b.dataset.act;
  if (act === 'home') { sfx.tap(); return go('#/'); }
  if (act === 'sound') {
    setSound(!soundOn()); store.set('sq:sound', soundOn());
    b.outerHTML = soundBtn(); if (soundOn()) sfx.tap();
    return;
  }
  handlers[act]?.(b, e);
});

function route() {
  hush(); handlers = {};
  window.scrollTo(0, 0);
  const h = location.hash.slice(1) || '/';
  const m = h.match(/^\/s\/([\w-]+)/);
  const st = m && unit.stations.find(s => s.id === m[1]);
  if (st) return MODES[st.type](st);
  if (h === '/grownup') return grownup();
  home();
}

// ---------- home ----------
function whenText(d) {
  if (d > 1) return `in ${d} days`;
  if (d === 1) return 'tomorrow!';
  if (d === 0) return 'today!';
  return 'is done — review mode';
}

function home() {
  const d = daysUntil(unit.testDate);
  const date = new Date(unit.testDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const ready = readiness();
  const next = nextStation();
  handlers = {
    play: b => { sfx.tap(); go('#/s/' + b.dataset.id); },
    grownup: () => { sfx.tap(); go('#/grownup'); },
    unit: b => { sfx.tap(); useUnit(UNITS.find(u => u.id === b.dataset.id)); home(); },
    install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); deferredInstall = null; home(); },
  };
  app.innerHTML = `
    <main class="screen home">
      <header class="home-top">
        <p class="brand">Study <b>Quest</b></p>
        <div class="top-actions">
          ${deferredInstall ? '<button class="pill" data-act="install">Install app</button>' : ''}
          ${soundBtn()}
        </div>
      </header>

      <section class="hero" style="--deco:'${unit.icon || '📚'}'">
        <div class="hero-text">
          <p class="eyebrow">${esc(unit.subject)} · Test ${esc(date)}</p>
          <h1 class="hero-title">${esc(unit.title)}</h1>
          <p class="countdown">${esc(unit.kid)}’s test is <b>${whenText(d)}</b></p>
        </div>
        <div class="ring" style="--p:${ready}" role="img" aria-label="${ready} percent ready">
          <span><b>${ready}%</b>ready</span>
        </div>
      </section>

      <button class="cta" data-act="play" data-id="${next.id}">
        <span class="cta-icon" aria-hidden="true">${next.icon}</span>
        <span class="cta-text"><small>${stationScore(next) > 0 ? 'Keep going' : 'Play next'}</small>${esc(next.title)}</span>
        <span class="cta-go" aria-hidden="true">▶</span>
      </button>

      <h2 class="label">All games</h2>
      <div class="stations">
        ${unit.stations.map((st, i) => `
          <button class="station ${st.id === next.id ? 'is-next' : ''}" data-act="play" data-id="${st.id}">
            <span class="st-num" aria-hidden="true">${i + 1}</span>
            <span class="st-icon" aria-hidden="true">${st.icon}</span>
            <span class="st-title">${esc(st.title)}</span>
            <span class="st-blurb">${esc(st.blurb)}</span>
            ${st.grownup ? '<span class="tag">With a grown-up</span>' : ''}
            ${stars(Math.round(stationScore(st) * 3))}
          </button>`).join('')}
      </div>

      ${UNITS.length > 1 ? `
        <h2 class="label">Other study guides</h2>
        <div class="units">${UNITS.filter(u => u !== unit).map(u => `
          <button class="pill unit-pill" data-act="unit" data-id="${u.id}">${u.icon || '📚'} ${esc(u.title)}</button>`).join('')}
        </div>` : ''}

      <button class="pill grown" data-act="grownup">Grown-ups: progress & weak spots</button>
    </main>`;
}

// ---------- results ----------
function confetti() {
  const colors = ['#FFC93C', '#E8663D', '#2E9E62', '#2F7FD8', '#7A3FC0'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i');
    p.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % 5]};animation-delay:${Math.random() * 0.4}s;--dx:${(Math.random() - 0.5) * 160}px;--r:${Math.random() * 720}deg`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 2600);
  }
}

function finish(st, n, msg, extra = '') {
  state.stars[st.id] = Math.max(state.stars[st.id] || 0, n);
  save();
  const nxt = nextStation(st.id);
  handlers = {
    again: () => { sfx.tap(); route(); },
    next: () => { sfx.tap(); go('#/s/' + nxt.id); },
  };
  screen(st.title, `
    <section class="done">
      ${stars(n, 'big')}
      <h2 class="done-title">${n === 3 ? 'Superstar!' : n === 2 ? 'Great work!' : 'Good practice!'}</h2>
      <p class="done-msg">${esc(msg)}</p>
      ${extra}
      <div class="row">
        <button class="btn primary" data-act="next">Next: ${esc(nxt.title)} ▶</button>
        <button class="btn" data-act="again">Play again</button>
      </div>
    </section>`, 'center');
  sfx.win(); confetti();
  setTimeout(() => speak(`${n === 3 ? 'Superstar!' : 'Great work!'} ${msg}`), 500);
}

// ---------- Study Cards ----------
function learn(st) {
  const facts = unit.facts;
  let i = 0, flipped = false;
  const draw = () => {
    const f = facts[i], g = unit.groups[f.group];
    screen(st.title, `
      ${progress(i + 1, facts.length)}
      <p class="counter">Card ${i + 1} of ${facts.length}</p>
      <button class="flash ${flipped ? 'is-flipped' : ''}" data-act="flip" style="--c:${g.color}">
        <span class="chip">${g.icon} ${esc(g.label)}</span>
        <span class="big-icon" aria-hidden="true">${f.icon}</span>
        <span class="flash-q">${esc(f.q)}</span>
        ${flipped ? `<span class="flash-a">${esc(f.a)}</span>` : '<span class="flash-hint">Tap to see the answer</span>'}
      </button>
      <div class="row">
        ${flipped
          ? `<button class="btn ok" data-act="knew">👍🏾 I knew it!</button><button class="btn" data-act="notyet">🤔 Still learning</button>`
          : `<button class="btn primary" data-act="flip">Flip the card</button>`}
      </div>
      <div class="row small">
        <button class="btn quiet" data-act="prev" ${i === 0 ? 'disabled' : ''}>‹ Back a card</button>
        <button class="btn quiet" data-act="read">🔊 Read it again</button>
      </div>`);
    if (flipped) speak(f.a); else speak(f.q);
  };
  const advance = () => {
    if (i < facts.length - 1) { i++; flipped = false; draw(); }
    else finish(st, 3, `You studied all ${facts.length} cards!`);
  };
  handlers = {
    flip: () => { if (flipped) return; sfx.flip(); flipped = true; draw(); },
    knew: () => { const f = facts[i]; state.mastery[f.id] = Math.max(mastery(f.id), 1); save(); sfx.right(); advance(); },
    notyet: () => { const f = facts[i]; state.missed[f.id] = (state.missed[f.id] || 0) + 1; save(); sfx.tap(); advance(); },
    prev: () => { if (i > 0) { i--; flipped = false; sfx.tap(); draw(); } },
    read: () => { const f = facts[i]; speak(flipped ? `${f.q} ... ${f.a}` : f.q); },
  };
  draw();
}

// ---------- Quiz: 8 questions, weakest facts first, misses come back once ----------
function quiz(st) {
  const ROUND = Math.min(8, unit.facts.length);
  const pool = shuffle(unit.facts).sort((a, b) => mastery(a.id) - mastery(b.id));
  const queue = shuffle(pool.slice(0, ROUND));
  const retried = new Set();
  let done = 0, firstTry = 0, locked = false, choices = [];
  const draw = () => {
    const f = queue[0], g = unit.groups[f.group];
    choices = shuffle([f.right, ...f.wrong]);
    locked = false;
    screen(st.title, `
      ${progress(done, ROUND)}
      <p class="counter">${retried.has(f.id) ? 'Try this one again!' : `Question ${done + 1} of ${ROUND}`}</p>
      <section class="qcard" style="--c:${g.color}">
        <span class="chip">${g.icon} ${esc(g.label)}</span>
        <span class="big-icon" aria-hidden="true">${f.icon}</span>
        <h2 class="q">${esc(f.q)}</h2>
        <button class="pill read" data-act="read">🔊 Read to me</button>
      </section>
      <div class="choices">
        ${choices.map((c, k) => `<button class="choice" data-act="pick" data-k="${k}"><b aria-hidden="true">${'ABCD'[k]}</b><span>${esc(c)}</span></button>`).join('')}
      </div>
      <div class="feedback" id="fb"></div>`);
    speak(f.q);
  };
  const next = () => {
    queue.shift();
    if (queue.length) draw();
    else {
      const n = firstTry >= ROUND - 1 ? 3 : firstTry >= Math.ceil(ROUND * 0.6) ? 2 : 1;
      finish(st, n, `${firstTry} of ${ROUND} right on the first try.`);
    }
  };
  handlers = {
    read: () => { const f = queue[0]; speak(`${f.q} ... ${choices.map((c, k) => `${'ABCD'[k]}: ${c}.`).join(' ')}`); },
    pick: b => {
      if (locked) return;
      locked = true;
      const f = queue[0];
      const ok = choices[+b.dataset.k] === f.right;
      const btns = [...document.querySelectorAll('.choice')];
      btns.forEach(x => x.disabled = true);
      const rightBtn = btns[choices.indexOf(f.right)];
      const fb = document.getElementById('fb');
      if (ok) {
        b.classList.add('right'); sfx.right();
        if (!retried.has(f.id)) { firstTry++; state.mastery[f.id] = Math.min(3, mastery(f.id) + 1); }
        done++; save();
        const p = praise();
        fb.innerHTML = `<p class="fb ok">⭐ ${p}</p>`;
        live(p); speak(p);
        setTimeout(next, 1300);
      } else {
        b.classList.add('wrong'); rightBtn.classList.add('right', 'reveal'); sfx.wrong();
        state.mastery[f.id] = Math.max(0, mastery(f.id) - 2);
        state.missed[f.id] = (state.missed[f.id] || 0) + 1;
        if (!retried.has(f.id)) { retried.add(f.id); queue.push(f); } else done++;
        save();
        fb.innerHTML = `<p class="fb no">Not quite. The answer is: <b>${esc(f.right)}</b></p>
          <button class="btn primary" data-act="next">Next ▶</button>`;
        live(`Not quite. The answer is ${f.right}`);
        speak(`Not quite. The answer is: ${f.right}`);
      }
    },
    next: () => { sfx.tap(); next(); },
  };
  draw();
}

// ---------- Sort: tap the right bin ----------
function sort(st) {
  const S = unit.sorts[st.sort];
  const defs = S.binDefs || unit.groups;
  const bins = S.bins.map(id => ({ id, ...defs[id] }));
  const queue = shuffle(S.items);
  const placed = Object.fromEntries(bins.map(b => [b.id, []]));
  const total = queue.length, retried = new Set();
  let done = 0, firstTry = 0, locked = false;
  const binLabel = id => bins.find(b => b.id === id).label;
  const draw = () => {
    const it = queue[0];
    locked = false;
    screen(st.title, `
      ${progress(done, total)}
      <p class="counter">${esc(S.title)}</p>
      <section class="sort-card" id="card">
        <span class="big-icon" aria-hidden="true">${it.icon}</span>
        <h2 class="q">${esc(it.text)}</h2>
        <button class="pill read" data-act="read">🔊 Read to me</button>
      </section>
      <div class="bins" style="--n:${bins.length}">
        ${bins.map(b => `
          <button class="bin" data-act="drop" data-bin="${b.id}" style="--c:${b.color}">
            <span class="bin-icon" aria-hidden="true">${b.icon}</span>
            <span class="bin-label">${esc(b.label)}</span>
            <span class="bin-count">${placed[b.id].length}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="fb"></div>`);
    speak(`${it.text}. ${bins.map(b => b.label).join(', or ')}?`);
  };
  const next = () => {
    queue.shift();
    if (queue.length) return draw();
    const n = firstTry >= total - 1 ? 3 : firstTry >= Math.ceil(total * 0.65) ? 2 : 1;
    finish(st, n, `${firstTry} of ${total} sorted right on the first try.`, `
      <div class="summary" style="--n:${bins.length}">
        ${bins.map(b => `<div class="sum-col" style="--c:${b.color}">
          <h3>${b.icon} ${esc(b.label)}</h3>
          <ul>${placed[b.id].map(x => `<li><span aria-hidden="true">${x.icon}</span> ${esc(x.text)}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>`);
  };
  handlers = {
    read: () => speak(`${queue[0].text}. ${bins.map(b => b.label).join(', or ')}?`),
    drop: b => {
      if (locked) return;
      locked = true;
      const it = queue[0], ok = b.dataset.bin === it.bin;
      const fb = document.getElementById('fb');
      document.querySelectorAll('.bin').forEach(x => x.disabled = true);
      if (ok) {
        sfx.place(); b.classList.add('right');
        document.getElementById('card').classList.add('fly');
        placed[it.bin].push(it); done++;
        if (!retried.has(it.id ?? it.text)) firstTry++;
        const p = praise();
        live(p);
        if (it.why) {
          fb.innerHTML = `<p class="fb ok">⭐ ${p} ${esc(it.why)}</p><button class="btn primary" data-act="next">Next ▶</button>`;
          speak(`${p} ${it.why}`);
        } else { speak(p); setTimeout(next, 900); }
      } else {
        sfx.wrong(); b.classList.add('wrong');
        document.querySelector(`.bin[data-bin="${it.bin}"]`).classList.add('right', 'reveal');
        const key = it.id ?? it.text;
        if (!retried.has(key)) { retried.add(key); queue.push(it); } else { placed[it.bin].push(it); done++; }
        const msg = `Not quite — that one goes in ${binLabel(it.bin)}.`;
        fb.innerHTML = `<p class="fb no">${esc(msg)} ${esc(it.why || '')}</p><button class="btn primary" data-act="next">Next ▶</button>`;
        live(msg); speak(`${msg} ${it.why || ''}`);
      }
    },
    next: () => { sfx.tap(); next(); },
  };
  draw();
}

// ---------- Map: explore the regions, then tap-the-region questions ----------
function mapMode(st) {
  const M = MAPS[st.map];
  const qs = shuffle(st.questions);
  const seen = new Set();
  let phase = 'explore', qi = 0, firstTry = 0, missed = false, locked = false, picked = null;
  const regionById = id => M.regions.find(r => r.id === id);

  const svg = () => `
    <svg class="map ${phase}" viewBox="${M.viewBox}" data-act="map" role="img" aria-label="Map of Georgia with ${M.regions.map(r => r.label).join(', ')}">
      <defs><clipPath id="clip"><path d="${M.outline}"/></clipPath></defs>
      <g clip-path="url(#clip)">
        ${M.regions.map(r => `<path class="region ${picked === r.id ? 'sel' : ''}" data-r="${r.id}" d="${r.path}" style="--c:${r.color}"/>`).join('')}
      </g>
      <path class="outline" d="${M.outline}"/>
      ${M.regions.map(r => `<g class="lbl" transform="translate(${r.at})"><text class="lbl-icon" y="-10">${r.icon}</text><text class="lbl-text" y="22">${esc(r.label)}</text></g>`).join('')}
      <g class="home-pin" transform="translate(${M.home.at})"><circle r="7"/><text x="12" y="5">${esc(M.home.label)}</text></g>
    </svg>`;

  const draw = () => {
    if (phase === 'explore') {
      const info = picked ? st.explore[picked] : null;
      screen(st.title, `
        <p class="counter">Tap each part of Georgia to learn about it (${seen.size} of ${M.regions.length})</p>
        <div class="map-wrap">${svg()}</div>
        <div class="info ${picked ? '' : 'empty'}" style="--c:${picked ? regionById(picked).color : '#999'}">
          ${info ? `<h2>${regionById(picked).icon} ${esc(regionById(picked).label)}</h2><p>${esc(info)}</p>` : '<p>👆🏾 Tap the map!</p>'}
        </div>
        <div class="row"><button class="btn ${seen.size === M.regions.length ? 'primary' : ''}" data-act="start">Start the map game ▶</button></div>`);
    } else {
      const q = qs[qi];
      locked = false;
      screen(st.title, `
        ${progress(qi, qs.length)}
        <p class="counter">Question ${qi + 1} of ${qs.length}</p>
        <div class="map-q"><h2 class="q">${esc(q.q)}</h2><button class="pill read" data-act="read" aria-label="Read the question to me">🔊 Read to me</button></div>
        <div class="map-wrap">${svg()}</div>
        <div class="feedback" id="fb"></div>`);
      speak(q.q);
    }
  };
  const flash = (id, cls) => {
    const el = document.querySelector(`.region[data-r="${id}"]`);
    if (!el) return;
    el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
  };
  handlers = {
    map: (el, e) => {
      const s = document.querySelector('svg.map');
      const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(s.getScreenCTM().inverse());
      const id = M.regionAt(p.x, p.y);
      if (!id) {
        sfx.tap(); live('Tap inside Georgia!'); speak('Tap inside Georgia!');
        const box = document.getElementById('fb') || document.querySelector('.info');
        if (box) box.innerHTML = '<p class="fb no">👆🏾 Tap inside Georgia!</p>';
        return;
      }
      if (phase === 'explore') {
        sfx.tap(); picked = id; seen.add(id); draw(); speak(st.explore[id]);
        return;
      }
      if (locked) return;
      const q = qs[qi], fb = document.getElementById('fb');
      if (q.answer.includes(id)) {
        locked = true; flash(id, 'hit'); sfx.right();
        if (!missed) firstTry++;
        const p = `${praise()} That’s the ${regionById(id).label}.`;
        fb.innerHTML = `<p class="fb ok">⭐ ${esc(p)}</p>`; live(p); speak(p);
        setTimeout(() => {
          qi++; missed = false;
          if (qi < qs.length) draw();
          else finish(st, firstTry >= qs.length - 1 ? 3 : firstTry >= Math.ceil(qs.length * 0.6) ? 2 : 1, `${firstTry} of ${qs.length} right on the first tap.`);
        }, 1500);
      } else {
        missed = true; flash(id, 'miss'); sfx.wrong();
        q.answer.forEach(a => { flash(a, 'glow'); document.querySelector(`.region[data-r="${a}"]`)?.classList.add('hint'); });
        const p = `Not quite — that’s the ${regionById(id).label}. Try the glowing part!`;
        fb.innerHTML = `<p class="fb no">${esc(p)}</p>`; live(p); speak(p);
      }
    },
    start: () => { sfx.tap(); phase = 'quiz'; picked = null; draw(); },
    read: () => speak(qs[qi].q),
  };
  draw();
}

// ---------- Say It: open-response, checked by a grown-up ----------
function sayMode(st) {
  const list = unit.say;
  let i = 0, revealed = false, hint = false, got = new Set();
  const std = id => unit.standards.find(s => s.id === id);
  const draw = () => {
    const p = list[i];
    screen(st.title, `
      ${progress(i, list.length)}
      <p class="counter">Test question ${i + 1} of ${list.length}</p>
      <section class="say-card">
        <span class="chip">📝 ${esc(std(p.std)?.short || 'Test question')}</span>
        <h2 class="q">${esc(p.prompt)}</h2>
        <div class="row small">
          <button class="pill" data-act="read">🔊 Read to me</button>
          <button class="pill" data-act="hint" aria-expanded="${hint}">💡 ${hint ? 'Hide' : 'Need a'} hint</button>
        </div>
        ${hint ? `<p class="frame">Try: “${esc(p.frame)}”</p>` : ''}
        <p class="say-how">🎤 ${esc(unit.kid)}: say your answer out loud to a grown-up.</p>
      </section>
      ${revealed ? `
        <section class="key">
          <h3>Grown-up: tap each thing ${esc(unit.kid)} said <span class="need ${got.size >= p.need ? 'met' : ''}">${got.size} / ${p.need} needed</span></h3>
          <div class="points">
            ${p.points.map((t, k) => `<button class="point" data-act="tick" data-k="${k}" aria-pressed="${got.has(k)}"><span class="box" aria-hidden="true">${got.has(k) ? '✓' : ''}</span>${esc(t)}</button>`).join('')}
          </div>
          <div class="row">
            <button class="btn primary" data-act="next">${i < list.length - 1 ? 'Next question ▶' : 'Finish'}</button>
            <button class="btn" data-act="retry">Try it again</button>
          </div>
        </section>`
      : `<div class="row"><button class="btn primary big" data-act="reveal">${esc(unit.kid)} answered — show the answer key</button></div>`}`);
  };
  const keep = () => { const p = list[i]; state.say[p.id] = Math.max(state.say[p.id] || 0, got.size); save(); };
  handlers = {
    read: () => speak(list[i].prompt),
    hint: () => { sfx.tap(); hint = !hint; draw(); if (hint) speak(list[i].frame); },
    reveal: () => { sfx.flip(); revealed = true; draw(); },
    tick: b => {
      const k = +b.dataset.k;
      got.has(k) ? got.delete(k) : got.add(k);
      const met = got.size === list[i].need && got.has(k);
      met ? sfx.right() : sfx.tap();
      draw();
    },
    retry: () => { keep(); sfx.tap(); revealed = false; hint = false; got = new Set(); draw(); speak(list[i].prompt); },
    next: () => {
      keep();
      if (i < list.length - 1) { i++; revealed = false; hint = false; got = new Set(); sfx.tap(); draw(); speak(list[i].prompt); return; }
      const met = list.filter(p => (state.say[p.id] || 0) >= p.need).length;
      finish(st, met === list.length ? 3 : met >= list.length / 2 ? 2 : 1, `${met} of ${list.length} test answers were complete.`);
    },
  };
  draw();
  speak(list[0].prompt);
}

// ---------- Grown-up view ----------
function grownup() {
  const weak = unit.facts
    .filter(f => mastery(f.id) < 2)
    .sort((a, b) => (state.missed[b.id] || 0) - (state.missed[a.id] || 0) || mastery(a.id) - mastery(b.id))
    .slice(0, 8);
  handlers = {
    reset: () => {
      if (!confirm(`Erase all of ${unit.kid}’s progress on “${unit.title}”?`)) return;
      state = { mastery: {}, stars: {}, say: {}, missed: {} }; save(); sfx.tap(); go('#/');
    },
  };
  screen('Grown-ups', `
    <section class="panel">
      <h2>${esc(unit.title)} — ${readiness()}% ready</h2>
      <p class="muted">Test: ${esc(unit.testDate)}. Each test standard below mixes quiz mastery with the Say It answers you checked off.</p>
      ${unit.standards.map(s => { const v = standardScore(s.id); return `
        <div class="std">
          <div class="std-head"><b>${esc(s.short)}</b><span>${v}%</span></div>
          <div class="meter"><i style="width:${v}%"></i></div>
          <p class="muted">${esc(s.text)}</p>
        </div>`; }).join('')}
    </section>
    <section class="panel">
      <h2>Practice these next</h2>
      ${weak.length ? `<ol class="weak">${weak.map(f => `<li><b>${esc(f.q)}</b><br>${esc(f.a)}${state.missed[f.id] ? ` <span class="miss">missed ${state.missed[f.id]}×</span>` : ''}</li>`).join('')}</ol>`
        : '<p>Every fact is at 2+ correct answers. 🎉</p>'}
    </section>
    <section class="panel">
      <h2>Say It answers</h2>
      <ul class="says">${unit.say.map(p => { const v = state.say[p.id] || 0; return `<li class="${v >= p.need ? 'met' : ''}"><span>${v >= p.need ? '✅' : '⬜'}</span> ${esc(p.prompt)} <em>(${v}/${p.need})</em></li>`; }).join('')}</ul>
    </section>
    <section class="panel">
      <h2>Next week’s homework</h2>
      <p class="muted">Send Claude photos of the new study guide and say “add this to Study Quest.” It becomes a new unit here; this one stays for review.</p>
      <button class="btn danger" data-act="reset">Reset progress for this guide</button>
    </section>`);
}

const MODES = { learn, quiz, sort, map: mapMode, say: sayMode };

// ---------- boot ----------
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (!location.hash || location.hash === '#/') home(); });
setSound(store.get('sq:sound', true));
useUnit(defaultUnit());
addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__sq = { unit: () => unit, state: () => state };
