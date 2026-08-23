/* ============================================================================
   Study engine — shared by the IOAA and IPhO manuals.

   Day model: TODAY is always derived from the system clock relative to your
   start date. It is never stored and never advanced by hand. S.day is only a
   *view cursor* for reviewing or backfilling earlier days, clamped so it can
   never point past today.
   ========================================================================== */
(function () {
'use strict';

var C            = window.CONFIG;
var CURRICULUM   = C.curriculum;
var TASK_TEMPLATES = C.taskTemplates;
var RANKS        = C.ranks;
var ACHIEVEMENTS = C.achievements;
var PHASES       = C.phases;
var TRACKS       = C.tracks;
var TOTAL_DAYS   = C.totalDays || 450;

function icon(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function $(id) { return document.getElementById(id); }
function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

/* ---------- state -------------------------------------------------------- */
var DEF = {
  day: 1, xp: 0, streak: 0, longestStreak: 0,
  logs: {}, checks: {}, journal: [], progress: {},
  unlockedAch: [], unlockedAchDates: {}, startDate: null
};
TRACKS.forEach(function (t) { DEF.progress[t.key] = 0; });

var S = JSON.parse(JSON.stringify(DEF));

function save() { try { localStorage.setItem(C.storageKey, JSON.stringify(S)); } catch (e) {} }
function load() {
  try {
    var raw = localStorage.getItem(C.storageKey);
    if (raw) S = Object.assign({}, JSON.parse(JSON.stringify(DEF)), JSON.parse(raw));
    if (!S.startDate) S.startDate = todayStr();
  } catch (e) {}
}

function totalHrs(s) { return Object.values(s.logs).reduce(function (a, b) { return a + (b.hrs || 0); }, 0); }
function loggedDays(s) { return Object.values(s.logs).filter(function (l) { return l.hrs > 0; }).length; }
window.totalHrs = totalHrs; window.loggedDays = loggedDays;

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dateToDay(dateStr) {
  if (!S.startDate) return 1;
  return Math.round((new Date(dateStr + 'T00:00:00') - new Date(S.startDate + 'T00:00:00')) / 86400000) + 1;
}
function dayToDate(dayNum) {
  if (!S.startDate) return '';
  var d = new Date(S.startDate + 'T00:00:00');
  d.setDate(d.getDate() + dayNum - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* THE day number, always from the system clock. Never stored. */
function todayDay() {
  return Math.max(1, Math.min(TOTAL_DAYS, dateToDay(todayStr())));
}
/* true once the calendar has run past the end of the plan */
function planFinished() { return dateToDay(todayStr()) > TOTAL_DAYS; }

function clampCursor() {
  S.day = Math.max(1, Math.min(todayDay(), S.day || 1));
}

function fmtHrs(h) {
  var w = Math.floor(h), m = Math.round((h - w) * 60);
  if (m === 60) { w += 1; m = 0; }
  if (w > 0 && m > 0) return w + 'h ' + m + 'm';
  if (w > 0) return w + 'h';
  return m + 'm';
}

/* every past day with no entry is recorded as a miss */
function fillMissedDays() {
  if (!S.startDate) return;
  var current = todayDay(), filled = 0;
  for (var i = 1; i < current && i <= TOTAL_DAYS; i++) {
    if (!('d' + i in S.logs)) { S.logs['d' + i] = { hrs: 0, date: dayToDate(i), missed: true }; filled++; }
  }
  if (filled) save();
  clampCursor();
}

/* ---------- timer -------------------------------------------------------- */
var running = false, tStart = null, tElapsed = 0, tRAF = null;

function fmtClock(ms) {
  var s = Math.floor(ms / 1000);
  return String(Math.floor(s / 3600)).padStart(2, '0') + ':' +
         String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' +
         String(s % 60).padStart(2, '0');
}
function elapsedMs() { return running ? tElapsed + (Date.now() - tStart) : tElapsed; }

function paintTimer() {
  var ms = elapsedMs(), str = fmtClock(ms), hrs = ms / 3600000;
  setText('t-read', str);
  setText('dock-time', str);
  var todayLogged = S.logs['d' + S.day] ? (S.logs['d' + S.day].hrs || 0) : 0;
  setText('t-today', fmtHrs(todayLogged + hrs));
  setText('t-meta', running ? 'Running — log it whenever you stop.'
                  : ms > 0 ? 'Paused. Resume when you’re back at it.'
                  : 'Start the clock, or log time manually.');

  var hero = $('timer-hero');
  if (hero) hero.classList.toggle('running', running);

  var dock = $('dock');
  if (dock) {
    dock.classList.toggle('show', ms > 0 && currentScreen !== 'home');
    dock.classList.toggle('paused', !running);
  }
  var btn = $('t-toggle');
  if (btn) btn.innerHTML = running ? icon('pause') + '<span>Pause</span>' : icon('play') + '<span>' + (ms > 0 ? 'Resume' : 'Start') + '</span>';
  var dbtn = $('dock-toggle');
  if (dbtn) dbtn.innerHTML = running ? icon('pause') : icon('play');
  var logBtn = $('t-log'); if (logBtn) logBtn.disabled = ms < 1000;
  if (running) tRAF = requestAnimationFrame(paintTimer);
}

window.toggleTimer = function () {
  if (running) { tElapsed += Date.now() - tStart; running = false; cancelAnimationFrame(tRAF); }
  else { tStart = Date.now(); running = true; }
  paintTimer();
};
window.resetTimer = function () {
  running = false; cancelAnimationFrame(tRAF); tElapsed = 0; tStart = null;
  paintTimer();
};
window.logFromTimer = function () {
  var hrs = parseFloat((elapsedMs() / 3600000).toFixed(2));
  if (hrs < 0.01) {
    snack(elapsedMs() > 0 ? 'Too short to log' : 'Nothing to log',
          elapsedMs() > 0 ? 'Sessions under a minute aren’t recorded' : 'Start the clock first', 'clock');
    return;
  }
  doLog(hrs, true);
  window.resetTimer();
};

/* ---------- logging ------------------------------------------------------ */
function doLog(hrs, additive) {
  var key = 'd' + S.day;
  var prev = (S.logs[key] && S.logs[key].hrs) || 0;
  var next = additive ? Math.round((prev + hrs) * 100) / 100 : hrs;
  var added = next - prev;
  /* stamp the calendar date of the day being logged, not of "now" —
     otherwise backfilled sessions all collapse onto today */
  S.logs[key] = { hrs: next, date: dayToDate(S.day), missed: next === 0 };

  var bonus = Math.max(0, Math.round(added * 10));
  var before = getRank(S.xp);
  if (added > 0) S.xp += bonus;
  var after = getRank(S.xp);

  updateProgress(); save(); render(); publish();

  if (after.rank !== before.rank) {
    var r = $('lu-rank');
    r.textContent = after.rank; r.style.color = after.color;
    setText('lu-name', after.name);
    setText('lu-sub', 'Rank ' + after.rank + ' · ' + after.name);
    $('lu-scrim').classList.add('show');
  }
  snack('Day ' + S.day + ' logged',
        next === 0 ? 'Recorded as a missed day' : '+' + bonus + ' XP · ' + fmtHrs(next) + ' that day',
        next === 0 ? 'flame' : 'check');
}

/* ---------- progress: measures work done, not days elapsed --------------- */
function loggedDaysBetween(from, to) {
  var n = 0;
  for (var i = Math.max(1, from); i <= Math.min(TOTAL_DAYS, to); i++) {
    var l = S.logs['d' + i];
    if (l && l.hrs > 0) n++;
  }
  return n;
}
function updateProgress() {
  TRACKS.forEach(function (t) {
    S.progress[t.key] = loggedDaysBetween(t.offset + 1, t.offset + t.span);
  });
}
/* where the calendar says you ought to be, for the schedule marker */
function schedulePct(offset, span) {
  return Math.max(0, Math.min(100, (todayDay() - offset) / span * 100));
}

window.shiftDay = function (delta) {
  S.day = Math.max(1, Math.min(todayDay(), S.day + delta));
  render(); publish();
};
window.goToday = function () {
  S.day = todayDay();
  render(); publish();
  snack('Back to today', 'Day ' + S.day + ' of ' + TOTAL_DAYS, 'today');
};

/* ---------- rank --------------------------------------------------------- */
function getRank(xp) { var r = RANKS[0]; RANKS.forEach(function (k) { if (xp >= k.xp) r = k; }); return r; }
function getNextRank(xp) { for (var i = 0; i < RANKS.length; i++) if (xp < RANKS[i].xp) return RANKS[i]; return null; }
function phaseIndex(d) { for (var i = 0; i < PHASES.length; i++) if (d <= PHASES[i].to) return i; return PHASES.length - 1; }

function weekFor(d) {
  return CURRICULUM.find(function (w) {
    var r = w.days.split('–').map(Number); return d >= r[0] && d <= r[1];
  }) || CURRICULUM[0];
}

/* ---------- daily tasks, generated from the week's own topics ------------ */
function tasksFor(day) {
  var wk = weekFor(day);
  var range = wk.days.split('–').map(Number);
  var i = Math.max(0, day - range[0]);
  var topics = wk.topics && wk.topics.length ? wk.topics : [wk.title];
  var res = wk.res && wk.res.length ? wk.res : ['your main text'];

  var slot = {
    A: topics[i % topics.length],
    B: topics[(i + 1) % topics.length],
    C: topics[(i + 2) % topics.length],
    R: res[i % res.length],
    W: wk.title
  };
  return TASK_TEMPLATES.map(function (t) {
    return {
      text: t.text.replace(/\{([ABCRW])\}/g, function (m, k) { return slot[k]; }),
      dur: t.dur, xp: t.xp
    };
  });
}

/* ---------- render ------------------------------------------------------- */
function render() {
  clampCursor();
  var today = todayDay();
  var d = S.day;
  var hrs = totalHrs(S), rank = getRank(S.xp), next = getNextRank(S.xp);
  var pi = phaseIndex(today), ph = PHASES[pi];
  var viewingPast = d < today;

  setText('rail-day', 'Day ' + today);
  setText('day-num', d);
  setText('home-sub', ph.name + ' · ' + fmtHrs(hrs) + ' logged all time');
  setText('phase-tag', planFinished() ? 'Plan complete' : 'Phase ' + (pi + 1));

  /* past-day banner + disable "next" at today */
  var nextBtn = $('day-next');
  if (nextBtn) nextBtn.disabled = d >= today;
  var backBtn = $('day-today');
  if (backBtn) backBtn.style.display = viewingPast ? '' : 'none';
  var pastBar = $('past-banner');
  if (pastBar) {
    pastBar.style.display = viewingPast ? '' : 'none';
    if (viewingPast) {
      pastBar.innerHTML = icon('clock') +
        '<span>Viewing <b>day ' + d + '</b> (' + dayToDate(d) + ') — anything you log lands on that day. Today is day ' + today + '.</span>';
    }
  }

  /* rank */
  var orb = $('rank-orb');
  if (orb) {
    orb.textContent = rank.rank;
    orb.style.background = 'color-mix(in srgb, ' + rank.color + ' 24%, transparent)';
    orb.style.color = rank.color;
  }
  setText('rank-name', rank.name);
  setText('rank-next', next
    ? (next.xp - S.xp) + ' XP to rank ' + next.rank + ' · ' + next.name
    : 'Maximum rank reached — ' + C.maxRankLabel);
  var xpPct = next ? Math.round((S.xp - rank.xp) / (next.xp - rank.xp) * 100) : 100;
  var xf = $('rank-bar'); if (xf) { xf.style.width = xpPct + '%'; xf.style.background = rank.color; }
  setText('rank-xp', S.xp + (next ? ' / ' + next.xp + ' XP' : ' XP'));

  /* tiles */
  setText('d-day', today);
  setText('d-xp', S.xp);
  setText('d-hrs', hrs.toFixed(1));
  setText('d-studied', loggedDays(S));

  var missed = Object.values(S.logs).filter(function (l) { return l.missed; }).length;
  var ma = $('missed-chip');
  if (ma) {
    ma.style.display = missed > 0 ? '' : 'none';
    ma.innerHTML = icon('flame') + missed + ' missed day' + (missed > 1 ? 's' : '');
  }

  /* today's quest — for whichever day the cursor is on */
  var wk = weekFor(d);
  setText('today-week', wk.w);
  setText('today-topic', wk.title);
  setText('today-tip', wk.tip);
  var resEl = $('today-res');
  if (resEl) resEl.innerHTML = wk.res.map(function (r) {
    return '<div class="mini-row"><span class="mini-dot"></span><span>' + esc(r) + '</span></div>';
  }).join('');

  var dayTasks = tasksFor(d);
  var list = $('task-list');
  if (list) {
    list.innerHTML = '';
    dayTasks.forEach(function (t, i) {
      var key = 'd' + d + 't' + i;
      var done = !!S.checks[key];
      var el = document.createElement('div');
      el.className = 'task' + (done ? ' done' : '');
      el.setAttribute('role', 'checkbox');
      el.setAttribute('aria-checked', done ? 'true' : 'false');
      el.tabIndex = 0;
      el.innerHTML = '<span class="task-box">' + icon('check') + '</span>' +
        '<span class="task-text">' + esc(t.text) + '</span>' +
        '<span class="task-meta"><span class="task-dur">' + t.dur + '</span>' +
        '<span class="chip chip-xs chip-pri">+' + t.xp + '</span></span>';
      var fire = function () { toggleTask(key, t.xp); };
      el.onclick = fire;
      el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } };
      list.appendChild(el);
    });
  }
  var doneCount = dayTasks.filter(function (t, i) { return S.checks['d' + d + 't' + i]; }).length;
  setText('task-count', doneCount + ' of ' + dayTasks.length + ' done');
  var tb = $('task-bar');
  if (tb) tb.style.width = Math.round(doneCount / dayTasks.length * 100) + '%';

  setText('j-day-num', d);
  setText('dlg-day', d);

  /* subject progress — work done, with a marker for the schedule */
  TRACKS.forEach(function (t) {
    var pct = Math.min(100, Math.round((S.progress[t.key] || 0) / t.span * 100));
    var b = $('pb-' + t.key); if (b) b.style.width = pct + '%';
    setText('pct-' + t.key, pct + '%');
    var m = $('mk-' + t.key);
    if (m) {
      var sp = schedulePct(t.offset, t.span);
      m.style.left = sp + '%';
      m.style.display = sp > 0 && sp < 100 ? '' : 'none';
      m.title = 'Schedule is ' + Math.round(sp) + '% through this block';
    }
  });
  var ovDone = loggedDays(S);
  var ov = Math.round(ovDone / TOTAL_DAYS * 100);
  var pa = $('pb-all'); if (pa) pa.style.width = ov + '%';
  setText('pct-all', ov + '%');
  var mAll = $('mk-all');
  if (mAll) {
    var sAll = Math.max(0, Math.min(100, (today - 1) / TOTAL_DAYS * 100));
    mAll.style.left = sAll + '%';
    mAll.style.display = sAll > 0 && sAll < 100 ? '' : 'none';
    mAll.title = 'Day ' + today + ' of ' + TOTAL_DAYS + ' elapsed';
  }
  setText('prog-summary', ovDone + ' of ' + today + ' days studied so far · ' +
    (today > 0 ? Math.round(ovDone / today * 100) : 0) + '% turn-up rate');

  renderStepper();
  renderStreakStats();
  renderJournal();
  checkAchievements();
  if (!running) paintTimer();
}

/* ---------- plan --------------------------------------------------------- */
function renderStepper() {
  var el = $('stepper'); if (!el) return;
  var d = todayDay();
  el.innerHTML = PHASES.map(function (p, i) {
    var done = d > p.to, cur = d >= p.from && d <= p.to;
    var logged = loggedDaysBetween(p.from, p.to);
    var span = p.to - p.from + 1;
    return '<div class="step-card ' + (done ? 'done' : cur ? 'cur' : '') + '">' +
      '<div class="s-num">' + (done ? '✓' : (i + 1)) + '</div>' +
      '<div class="s-days">Days ' + p.from + '–' + p.to + '</div>' +
      '<div class="s-name">' + esc(p.name) + '</div>' +
      '<div class="s-note">' + esc(p.note) + '</div>' +
      '<div class="s-logged">' + logged + '/' + span + ' days studied</div></div>';
  }).join('');
}

var currPhase = null;
function renderWeeks(phase) {
  currPhase = phase;
  var body = $('week-list'); if (!body) return;
  var today = todayDay();
  body.innerHTML = '';
  CURRICULUM.filter(function (w) { return w.phase === phase; }).forEach(function (wk) {
    var r = wk.days.split('–').map(Number);
    var done = today > r[1], cur = today >= r[0] && today <= r[1];
    var logged = loggedDaysBetween(r[0], r[1]);
    var span = r[1] - r[0] + 1;
    var card = document.createElement('article');
    card.className = 'week' + (cur ? ' open' : '');
    card.innerHTML =
      '<div class="week-head" role="button" tabindex="0" aria-expanded="' + (cur ? 'true' : 'false') + '">' +
        '<span class="week-days">Days ' + esc(wk.days) + '</span>' +
        '<span class="week-title">' + esc(wk.title) + '</span>' +
        '<span class="chip chip-xs">' + logged + '/' + span + '</span>' +
        '<span class="chip chip-xs ' + (done ? 'chip-ok' : cur ? 'chip-pri' : '') + '">' +
          (done ? 'Done' : cur ? 'Current' : 'Upcoming') + '</span>' +
        '<span class="week-chev">' + icon('chevron') + '</span>' +
      '</div>' +
      '<div class="week-body">' +
        '<div class="mini-list">' +
        wk.topics.map(function (t) {
          return '<div class="mini-row"><span class="mini-dot"></span><span>' + esc(t) + '</span></div>';
        }).join('') +
        '</div>' +
        '<div class="week-tip">' + icon('bulb') + '<span>' + esc(wk.tip) + '</span></div>' +
        '<p class="overline dim" style="margin:18px 0 8px">Resources</p>' +
        '<div class="mini-list">' +
        wk.res.map(function (x) {
          return '<div class="mini-row"><span class="mini-dot"></span><span>' + esc(x) + '</span></div>';
        }).join('') +
        '</div>' +
      '</div>';
    var head = card.querySelector('.week-head');
    var toggle = function () {
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    body.appendChild(card);
  });
}

window.filterPhase = function (p, btn) {
  document.querySelectorAll('.filter-chips .chip').forEach(function (b) { b.classList.remove('chip-on'); });
  btn.classList.add('chip-on');
  renderWeeks(p);
};

/* ---------- streak ------------------------------------------------------- */
function renderStreakMap() {
  var map = $('streak-map'); if (!map) return;
  map.innerHTML = '';
  var today = todayDay();
  var frag = document.createDocumentFragment();
  for (var i = 1; i <= TOTAL_DAYS; i++) {
    var log = S.logs['d' + i];
    var h = log ? (log.hrs || 0) : 0;
    var isMissed = log && log.missed && i < today;
    var isFuture = i > today;
    var cls = 's-cell';
    if (isMissed) cls += ' missed';
    else if (!isFuture && h >= 4) cls += ' h4';
    else if (!isFuture && h >= 3) cls += ' h3';
    else if (!isFuture && h >= 2) cls += ' h2';
    else if (!isFuture && h > 0) cls += ' h1';
    if (i === today) cls += ' today-marker';
    var c = document.createElement('div');
    c.className = cls;
    var ds = dayToDate(i);
    c.title = isFuture ? 'Day ' + i + ' — not here yet'
      : isMissed ? 'Day ' + i + ' · ' + ds + ' · missed'
      : 'Day ' + i + (h ? ' · ' + fmtHrs(h) : ' · not logged') + (ds ? ' · ' + ds : '');
    frag.appendChild(c);
  }
  map.appendChild(frag);
}

function renderStreakStats() {
  recalcStreak();
  var total = loggedDays(S);
  setText('st-cur', S.streak);
  setText('st-best', S.longestStreak);
  setText('st-total', total);
  setText('st-pct', Math.round(total / TOTAL_DAYS * 100) + '%');
  setText('rail-streak', S.streak + 'd');
}

function recalcStreak() {
  var trail = 0, i, today = todayDay();
  for (i = today; i >= 1; i--) { var l = S.logs['d' + i]; if (l && l.hrs > 0) trail++; else break; }
  var longest = 0, run = 0;
  for (i = 1; i <= TOTAL_DAYS; i++) {
    var g = S.logs['d' + i];
    if (g && g.hrs > 0) { run++; longest = Math.max(longest, run); } else run = 0;
  }
  S.streak = trail;
  S.longestStreak = Math.max(S.longestStreak || 0, longest);
}

/* ---------- journal ------------------------------------------------------ */
function renderJournal() {
  var list = $('journal-entries'); if (!list) return;
  if (!S.journal || !S.journal.length) {
    list.innerHTML = '<div class="empty">' + icon('book') + '<p>No entries yet. Write one after today’s session.</p></div>';
    setText('j-count', '0 entries');
    return;
  }
  list.innerHTML = S.journal.slice().reverse().slice(0, 60).map(function (j) {
    return '<article class="j-entry"><div class="j-meta">Day ' + j.day + ' · ' + esc(j.date) + '</div>' +
           '<div class="j-text">' + esc(j.text) + '</div></article>';
  }).join('');
  setText('j-count', S.journal.length + (S.journal.length === 1 ? ' entry' : ' entries'));
}

window.addJournal = function () {
  var input = $('j-input');
  var text = input.value.trim();
  if (!text) { snack('Nothing to save', 'Write something first', 'book'); return; }
  if (!S.journal) S.journal = [];
  S.journal.push({ text: text, day: S.day, date: dayToDate(S.day) });
  input.value = '';
  save(); renderJournal();
  snack('Entry saved', 'Day ' + S.day + ' · ' + C.journalName, 'check');
};
window.clearJournalInput = function () { $('j-input').value = ''; };

/* ---------- achievements ------------------------------------------------- */
function achSnapshot() { return Object.assign({}, S, { day: todayDay() }); }

function renderAchievements() {
  var grid = $('ach-grid'); if (!grid) return;
  grid.innerHTML = ACHIEVEMENTS.map(function (a) {
    var un = S.unlockedAch.indexOf(a.id) !== -1;
    var at = S.unlockedAchDates && S.unlockedAchDates[a.id];
    return '<div class="ach ' + (un ? 'unlocked' : 'locked') + '">' +
      '<div class="ach-icon">' + a.icon + '</div>' +
      '<div class="ach-name">' + esc(a.name) + '</div>' +
      '<div class="ach-desc">' + esc(a.desc) + '</div>' +
      (un && at ? '<div class="ach-at">Day ' + at + '</div>' : '') + '</div>';
  }).join('');
  setText('ach-count', S.unlockedAch.length + ' / ' + ACHIEVEMENTS.length);
}

function checkAchievements() {
  if (!S.unlockedAchDates) S.unlockedAchDates = {};
  var snap = achSnapshot(), changed = false;
  ACHIEVEMENTS.forEach(function (a) {
    if (S.unlockedAch.indexOf(a.id) === -1 && a.cond(snap)) {
      S.unlockedAch.push(a.id);
      S.unlockedAchDates[a.id] = snap.day;
      changed = true;
      snack('Achievement unlocked', a.icon + '  ' + a.name, 'trophy');
    }
  });
  if (changed) { save(); renderAchievements(); }
}

function toggleTask(key, xp) {
  var was = !!S.checks[key];
  S.checks[key] = !was;
  if (!was) { S.xp += xp; snack('Task complete', '+' + xp + ' XP', 'check'); }
  else S.xp = Math.max(0, S.xp - xp);
  save(); render(); publish();
}

/* ---------- navigation --------------------------------------------------- */
var currentScreen = 'home';
window.showScreen = function (id) {
  currentScreen = id;
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
  $('screen-' + id).classList.add('on');
  document.querySelectorAll('[data-screen]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.screen === id);
  });
  if (id === 'plan')     renderWeeks(currPhase === null ? phaseIndex(todayDay()) : currPhase);
  if (id === 'progress') { renderStreakMap(); renderStreakStats(); renderAchievements(); }
  if (id === 'journal')  renderJournal();
  paintTimer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ---------- dialogs ------------------------------------------------------ */
window.openDialog = function (id) {
  if (id === 'dlg-settings') $('set-start').value = S.startDate || todayStr();
  $(id).classList.add('show');
  var f = $(id).querySelector('input,textarea,button');
  if (f) setTimeout(function () { f.focus(); }, 90);
};
window.closeDialog = function (id) { $(id).classList.remove('show'); };

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') document.querySelectorAll('.scrim.show').forEach(function (s) { s.classList.remove('show'); });
});

window.submitManual = function (e) {
  e.preventDefault();
  var h = parseFloat($('m-hours').value) || 0;
  var m = parseFloat($('m-mins').value) || 0;
  var total = Math.round((h + m / 60) * 100) / 100;
  if (total <= 0) { snack('Nothing to add', 'Enter hours or minutes', 'clock'); return false; }
  doLog(total, true);
  $('m-hours').value = ''; $('m-mins').value = '';
  window.closeDialog('dlg-manual');
  return false;
};

window.submitJump = function (e) {
  e.preventDefault();
  var today = todayDay();
  var want = parseInt($('jump-day').value, 10) || S.day;
  var v = Math.max(1, Math.min(today, want));
  S.day = v;
  render(); publish();
  window.closeDialog('dlg-jump');
  snack(want > today ? 'Clamped to today' : 'Jumped to day ' + v,
        want > today ? 'You can review the past, not the future' : PHASES[phaseIndex(v)].name, 'map');
  return false;
};

/* ---------- start date --------------------------------------------------- */
window.submitSettings = function (e) {
  e.preventDefault();
  var next = $('set-start').value;
  if (!next) { snack('Pick a date', 'A start date is required', 'today'); return false; }
  if (next === S.startDate) { window.closeDialog('dlg-settings'); return false; }

  /* Every day index is (date − start). Moving the start by D days shifts
     every index by exactly −D, so logs, checks and journal all remap cleanly. */
  var D = Math.round((new Date(next + 'T00:00:00') - new Date(S.startDate + 'T00:00:00')) / 86400000);
  var logs = {}, checks = {};
  Object.keys(S.logs).forEach(function (k) {
    var oldI = parseInt(k.slice(1), 10);
    var nI = oldI - D;
    if (nI >= 1 && nI <= TOTAL_DAYS) {
      var entry = S.logs[k];
      entry.date = entry.date || '';
      logs['d' + nI] = entry;
    }
  });
  Object.keys(S.checks).forEach(function (k) {
    var m = /^d(\d+)t(\d+)$/.exec(k);
    if (!m) return;
    var nI = parseInt(m[1], 10) - D;
    if (nI >= 1 && nI <= TOTAL_DAYS) checks['d' + nI + 't' + m[2]] = S.checks[k];
  });
  (S.journal || []).forEach(function (j) {
    var nd = j.day - D;
    j.day = Math.max(1, Math.min(TOTAL_DAYS, nd));
  });

  S.logs = logs; S.checks = checks; S.startDate = next; S.day = todayDay();
  /* re-stamp calendar dates against the new start */
  Object.keys(S.logs).forEach(function (k) {
    S.logs[k].date = dayToDate(parseInt(k.slice(1), 10));
  });

  fillMissedDays(); updateProgress(); save(); render(); publish();
  renderStreakMap(); renderAchievements();
  window.closeDialog('dlg-settings');
  snack('Start date updated', 'Today is now day ' + todayDay(), 'today');
  return false;
};

/* ---------- backup ------------------------------------------------------- */
var BACKUP_KEYS = ['ioaa-sys', 'ipho-sys', 'olympiadStreakData',
  'olympiad.progress.ioaa', 'olympiad.progress.ipho',
  'practice.stats.v1', 'practice.seen.v1', 'practice.solved.v1',
  'practice.attempts.v1', 'practice.companion.v1'];

window.exportAll = function () {
  var out = { format: 'olympiad-training-backup', version: 1, exportedAt: new Date().toISOString(), data: {} };
  BACKUP_KEYS.forEach(function (k) {
    var v = localStorage.getItem(k);
    if (v !== null) out.data[k] = v;
  });
  var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'olympiad-backup-' + todayStr() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  snack('Backup downloaded', Object.keys(out.data).length + ' records saved', 'doc');
};

window.importAll = function (input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(reader.result);
      if (!parsed || parsed.format !== 'olympiad-training-backup' || !parsed.data) {
        snack('Not a backup file', 'Expected an export from this app', 'close');
        return;
      }
      var n = 0;
      Object.keys(parsed.data).forEach(function (k) {
        if (BACKUP_KEYS.indexOf(k) === -1) return;
        localStorage.setItem(k, parsed.data[k]);
        n++;
      });
      snack('Backup restored', n + ' records · reloading…', 'check');
      setTimeout(function () { location.reload(); }, 900);
    } catch (e) {
      snack('Could not read that file', 'It may be corrupted', 'close');
    }
  };
  reader.readAsText(file);
  input.value = '';
};

window.confirmReset = function () {
  var keepStart = $('reset-keep-start') && $('reset-keep-start').checked;
  var start = S.startDate;
  S = JSON.parse(JSON.stringify(DEF));
  S.startDate = keepStart ? start : todayStr();
  S.day = 1;
  save(); fillMissedDays(); updateProgress(); render(); publish();
  renderStreakMap(); renderAchievements();
  window.closeDialog('dlg-reset');
  snack('Progress reset', keepStart ? 'Start date kept' : 'Starting fresh from today', 'reset');
};

/* ---------- snackbar ----------------------------------------------------- */
var snackTimer = null;
function snack(title, sub, ic) {
  var el = $('snackbar');
  $('snack-icon').innerHTML = icon(ic || 'check');
  setText('snack-title', title);
  setText('snack-sub', sub || '');
  el.classList.add('show');
  if (snackTimer) clearTimeout(snackTimer);
  snackTimer = setTimeout(function () { el.classList.remove('show'); }, 3400);
}
window.snack = snack;

/* ---------- publish to the home dashboard -------------------------------- */
function publish() {
  try {
    localStorage.setItem(C.publishKey, JSON.stringify({
      subject: C.subject,
      overall: Math.round(loggedDays(S) / TOTAL_DAYS * 1000) / 10,
      elapsed: Math.round((todayDay() - 1) / TOTAL_DAYS * 1000) / 10,
      topics: TRACKS.map(function (t) {
        return {
          name: t.label,
          pct: Math.round(Math.min(100, (S.progress[t.key] || 0) / t.span * 100) * 10) / 10,
          schedulePct: Math.round(schedulePct(t.offset, t.span) * 10) / 10
        };
      }),
      logs: S.logs,
      hours: Math.round(totalHrs(S) * 10) / 10,
      streak: S.streak,
      day: todayDay(),
      daysStudied: loggedDays(S),
      rank: getRank(S.xp).rank,
      rankName: getRank(S.xp).name,
      xp: S.xp,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {}
}

/* ---------- keyboard ----------------------------------------------------- */
document.addEventListener('keydown', function (e) {
  if (e.target.matches('input, textarea, select')) return;
  if (document.querySelector('.scrim.show')) return;
  if (e.code === 'Space') { e.preventDefault(); window.toggleTimer(); }
});

/* ---------- init --------------------------------------------------------- */
load();
fillMissedDays();
S.day = todayDay();          /* always open on today */
updateProgress();
render();
renderWeeks(phaseIndex(todayDay()));
publish();
paintTimer();

$('jump-day').max = todayDay();

/* the clock can roll past midnight while the tab is open */
setInterval(function () {
  var before = todayDay();
  fillMissedDays();
  if (todayDay() !== before) S.day = todayDay();
  $('jump-day').max = todayDay();
  render(); publish();
}, 60000);

window.addEventListener('pagehide', publish);
document.addEventListener('visibilitychange', function () {
  if (document.hidden) publish();
  else { fillMissedDays(); render(); publish(); }
});

(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .06 });
  document.querySelectorAll('.content .card, .content .tile, .content .timer-hero, .content .rank-hero, .content .topic-banner')
    .forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 6) * 50 + 'ms'; io.observe(el); });
})();

})();
