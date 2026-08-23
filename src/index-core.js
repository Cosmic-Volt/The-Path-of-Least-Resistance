/* ============================================================================
   Basecamp — aggregates both study systems plus the general log.
   Writes only ever go to the general log (olympiadStreakData), exactly as
   before; the study systems keep owning their own data.
   ========================================================================== */
(function () {
'use strict';

var GENERAL_KEY = 'olympiadStreakData';                 // { "YYYY-MM-DD": hours }
var PUB = { ioaa: 'olympiad.progress.ioaa', ipho: 'olympiad.progress.ipho' };

function readJSON(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function readGeneral() { return readJSON(GENERAL_KEY) || {}; }
function writeGeneral(d) { try { localStorage.setItem(GENERAL_KEY, JSON.stringify(d)); } catch (e) {} }

function $(id) { return document.getElementById(id); }
function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtHrs(h) {
  var w = Math.floor(h), m = Math.round((h - w) * 60);
  if (m === 60) { w += 1; m = 0; }
  if (w > 0 && m > 0) return w + 'h ' + m + 'm';
  if (w > 0) return w + 'h';
  return m + 'm';
}

/* ---------- combined day index ------------------------------------------
   { "YYYY-MM-DD": { total, general, ioaa, ipho } }
   Study systems publish their per-day logs keyed "dN"; each carries the
   calendar date it was recorded against, so they slot straight in.         */
function buildCombined() {
  var out = {};
  function add(key, bucket, hrs) {
    if (!hrs || hrs <= 0) return;
    if (!out[key]) out[key] = { total: 0, general: 0, ioaa: 0, ipho: 0 };
    out[key][bucket] += hrs;
    out[key].total += hrs;
  }

  var gen = readGeneral();
  Object.keys(gen).forEach(function (k) { add(k, 'general', gen[k]); });

  ['ioaa', 'ipho'].forEach(function (which) {
    var pub = readJSON(PUB[which]);
    if (!pub || !pub.logs) return;
    Object.keys(pub.logs).forEach(function (dk) {
      var entry = pub.logs[dk];
      if (entry && entry.date) add(entry.date, which, entry.hrs || 0);
    });
  });

  Object.keys(out).forEach(function (k) { out[k].total = Math.round(out[k].total * 100) / 100; });
  return out;
}

/* ---------- activity calendar ------------------------------------------
   A weekday-aligned year graph: 53 columns of 7 days, each column one
   week starting Sunday, so rows line up by weekday the way people expect. */
var WEEKS = 53, CELLS = WEEKS * 7;

function level(hours, isToday, isFuture, beforeStart) {
  if (isFuture) return 'future';
  if (!hours || hours <= 0) return beforeStart ? 'none' : (isToday ? 'pending' : 'miss');
  if (hours < 1) return '1';
  if (hours < 2.5) return '2';
  if (hours < 4) return '3';
  return '4';
}

function renderCalendar() {
  var cal = $('cal'); if (!cal) return;
  var data = buildCombined();
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var tKey = dateKey(today);

  /* end on the Saturday of the current week, start 52 weeks earlier */
  var end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  var start = new Date(end);
  start.setDate(start.getDate() - (CELLS - 1));

  /* days before your very first logged session aren't misses — they're
     simply before the story starts */
  var activeKeys = Object.keys(data).filter(function (k) { return data[k].total > 0; }).sort();
  var firstActive = activeKeys.length ? new Date(activeKeys[0] + 'T00:00:00') : today;

  cal.innerHTML = '';
  var tooltip = $('tooltip');
  var frag = document.createDocumentFragment();
  var cursor = new Date(start);
  var monthCols = [];

  for (var i = 0; i < CELLS; i++) {
    (function (day, index) {
      var key = dateKey(day);
      var rec = data[key];
      var hours = rec ? rec.total : 0;
      var isToday = key === tKey;
      var isFuture = day > today;

      if (day.getDate() <= 7 && index % 7 === 0) {
        monthCols.push({ col: Math.floor(index / 7) + 1, label: MONTHS[day.getMonth()] });
      }

      var cell = document.createElement('div');
      var beforeStart = day < firstActive;
      cell.className = 'cell lv-' + level(hours, isToday, isFuture, beforeStart);
      cell.tabIndex = isFuture ? -1 : 0;
      if (isToday) cell.style.boxShadow = 'inset 0 0 0 2px var(--on-surface)';

      function show() {
        var d = new Date(key + 'T00:00:00');
        var label = DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
        var main = isFuture ? 'Not here yet'
          : hours > 0 ? fmtHrs(hours)
          : beforeStart ? 'Before you started'
          : isToday ? 'Nothing logged yet' : 'Nothing logged';
        var parts = [];
        if (rec) {
          if (rec.ioaa) parts.push('IOAA ' + fmtHrs(rec.ioaa));
          if (rec.ipho) parts.push('IPhO ' + fmtHrs(rec.ipho));
          if (rec.general) parts.push('General ' + fmtHrs(rec.general));
        }
        tooltip.innerHTML = '<span class="tt-date"></span><span class="tt-hours"></span>' +
                            (parts.length > 1 ? '<span class="tt-split"></span>' : '');
        tooltip.querySelector('.tt-date').textContent = label;
        tooltip.querySelector('.tt-hours').textContent = main;
        if (parts.length > 1) tooltip.querySelector('.tt-split').textContent = parts.join(' \u00b7 ');
        var r = cell.getBoundingClientRect();
        tooltip.style.left = (r.left + r.width / 2) + 'px';
        tooltip.style.top = r.top + 'px';
        tooltip.classList.add('visible');
      }
      function hide() { tooltip.classList.remove('visible'); }

      cell.addEventListener('mouseenter', show);
      cell.addEventListener('mouseleave', hide);
      cell.addEventListener('focus', show);
      cell.addEventListener('blur', hide);
      frag.appendChild(cell);
    })(new Date(cursor), i);
    cursor.setDate(cursor.getDate() + 1);
  }
  cal.appendChild(frag);

  var months = $('calMonths');
  if (months) {
    months.innerHTML = monthCols.map(function (m) {
      return '<span style="grid-column:' + m.col + '">' + m.label + '</span>';
    }).join('');
  }

  setText('calRange', MONTHS[start.getMonth()] + ' ' + start.getFullYear() +
                      '  \u2192  ' + MONTHS[end.getMonth()] + ' ' + end.getFullYear());
  renderActivityStats(data);
}

function renderActivityStats(data) {
  var active = Object.keys(data).filter(function (k) { return data[k].total > 0; });
  var total = active.reduce(function (s, k) { return s + data[k].total; }, 0);

  var streak = 0;
  var cur = new Date(); cur.setHours(0, 0, 0, 0);
  if (!(data[dateKey(cur)] && data[dateKey(cur)].total > 0)) cur.setDate(cur.getDate() - 1);
  while (data[dateKey(cur)] && data[dateKey(cur)].total > 0) { streak++; cur.setDate(cur.getDate() - 1); }

  var best = 0, run = 0, prev = null;
  active.sort().forEach(function (k) {
    var d = new Date(k + 'T00:00:00');
    run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });

  setText('statHours', fmtHrs(total));
  setText('statDays', active.length);
  setText('statStreak', streak);
  setText('statBest', best);
}

function addGeneralHours(key, hours) {
  if (!hours || hours <= 0) return;
  var d = readGeneral();
  d[key] = Math.round(((d[key] || 0) + hours) * 100) / 100;
  writeGeneral(d);
  renderCalendar();
}

/* ---------- session clock ------------------------------------------------ */
var ms = 0, running = false, raf = null, last = 0;
var clockCard = $('clockCard'), clockEl = $('clock'), noteEl = $('clockNote');
var btnStart = $('btnStart'), btnLog = $('btnLog'), btnReset = $('btnReset');
var IDLE = 'Start the clock, then log the session. Everything logged today adds to one running total.';

function svg(id) { return '<svg viewBox="0 0 24 24"><use href="#i-' + id + '"/></svg>'; }
function fmtClock(v) {
  var t = Math.floor(v / 1000);
  return String(Math.floor(t / 3600)).padStart(2, '0') + ':' +
         String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' +
         String(t % 60).padStart(2, '0');
}
function paint() {
  clockEl.textContent = fmtClock(ms);
  clockCard.classList.toggle('running', running);
  btnLog.disabled = ms < 1000;
  btnStart.innerHTML = running ? svg('pause') + 'Pause' : svg('play') + (ms > 0 ? 'Resume' : 'Start');
}
function tick() {
  var now = performance.now();
  ms += now - last; last = now;
  paint();
  raf = requestAnimationFrame(tick);
}
btnStart.addEventListener('click', function () {
  if (running) { running = false; cancelAnimationFrame(raf); noteEl.textContent = 'Paused. Resume when you’re back at it.'; }
  else { running = true; last = performance.now(); raf = requestAnimationFrame(tick); noteEl.textContent = 'Running — log the session whenever you stop.'; }
  paint();
});
btnReset.addEventListener('click', function () {
  running = false; cancelAnimationFrame(raf); ms = 0;
  noteEl.textContent = IDLE; paint();
});
btnLog.addEventListener('click', function () {
  if (ms < 1000) return;
  var hours = ms / 3600000;
  addGeneralHours(dateKey(new Date()), hours);
  var label = fmtHrs(hours);
  running = false; cancelAnimationFrame(raf); ms = 0; paint();
  noteEl.textContent = 'Logged ' + label + ' to today. Start another whenever — it adds to the same day.';
});

/* ---------- manual log --------------------------------------------------- */
var mDate = $('mDate'), mHours = $('mHours'), mMins = $('mMins'), mStatus = $('manualStatus');
mDate.value = dateKey(new Date());
mDate.max = dateKey(new Date());

$('manualForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var total = (parseFloat(mHours.value) || 0) + (parseFloat(mMins.value) || 0) / 60;
  if (total <= 0) { mStatus.textContent = 'Add at least a few minutes before logging.'; return; }
  var key = mDate.value || dateKey(new Date());
  addGeneralHours(key, total);
  mStatus.textContent = 'Added ' + fmtHrs(total) + ' to ' + key + '.';
  mHours.value = ''; mMins.value = '';
});

/* ---------- track cards + breakdown -------------------------------------- */
function pct(p) { return (Math.round(p * 10) / 10).toString().replace(/\.0$/, '') + '%'; }

function renderTrack(which) {
  var data = readJSON(PUB[which]);
  var live = $(which + '-live'), empty = $(which + '-empty');

  if (!data) { live.hidden = true; empty.hidden = false; return; }
  live.hidden = false; empty.hidden = true;

  setText(which + '-rank', data.rank || 'E');
  setText(which + '-rankname', data.rankName || 'Initiate');
  setText(which + '-xp', data.xp != null ? data.xp : 0);
  setText(which + '-day', data.day != null ? data.day : 1);
  setText(which + '-hrs', data.hours != null ? fmtHrs(data.hours) : '0m');
  setText(which + '-streak', data.streak != null ? data.streak : 0);
  setText(which + '-pct', pct(data.overall || 0));
  var f = $(which + '-fill'); if (f) f.style.width = (data.overall || 0) + '%';
}

function renderBreakdown(which, label) {
  var data = readJSON(PUB[which]);
  var list = $(which + 'Topics'), badge = $(which + 'Badge'), meta = $(which + 'Meta');

  if (!data) {
    badge.textContent = '0%';
    list.innerHTML = '<li class="break-empty">No data yet — open the system to begin.</li>';
    meta.textContent = 'Not started yet';
    return;
  }
  badge.textContent = pct(data.overall || 0);
  list.innerHTML = '';
  (data.topics || []).forEach(function (t) {
    var li = document.createElement('li');
    li.className = 'break-topic';
    var n = document.createElement('span'); n.className = 'bt-name'; n.textContent = t.name;
    var bar = document.createElement('span'); bar.className = 'bar bar-s';
    var fill = document.createElement('i'); fill.style.width = (t.pct || 0) + '%';
    bar.appendChild(fill);
    var p = document.createElement('span'); p.className = 'bt-pct'; p.textContent = pct(t.pct || 0);
    li.append(n, bar, p);
    list.appendChild(li);
  });
  var d = new Date(data.updatedAt);
  meta.textContent = 'Day ' + (data.day || 1) + ' · ' + pct(data.overall || 0) + ' complete · synced ' +
    d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderAll() {
  renderTrack('ioaa'); renderTrack('ipho');
  renderBreakdown('ioaa', 'IOAA'); renderBreakdown('ipho', 'IPhO');
  renderCalendar();
}

/* ---------- init --------------------------------------------------------- */
paint();
renderAll();

window.addEventListener('storage', function (e) {
  if (!e.key || e.key === GENERAL_KEY || e.key.indexOf('olympiad.progress.') === 0) renderAll();
});
window.addEventListener('pageshow', renderAll);
window.addEventListener('focus', renderAll);
document.addEventListener('visibilitychange', function () { if (!document.hidden) renderAll(); });

(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .08 });
  document.querySelectorAll('.track, .act-tile, .section > .card, .clock-card, .manual-card, .break-card, .foot')
    .forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 55 + 'ms'; io.observe(el); });
})();

})();
