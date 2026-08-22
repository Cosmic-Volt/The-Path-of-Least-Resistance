(() => {
  'use strict';

  /* =========================================================
     Storage helpers
  ========================================================= */
  const STREAK_KEY = 'olympiadStreakData';   // { "YYYY-MM-DD": hoursNumber }
  const PROGRESS_KEY = 'olympiadProgress';   // { overall, ioaa, ipho }

  const loadStreakData = () => {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };
  const saveStreakData = (data) => {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  };

  const loadProgress = () => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : { overall: 0, ioaa: 0, ipho: 0 };
    } catch (e) {
      return { overall: 0, ioaa: 0, ipho: 0 };
    }
  };
  const saveProgress = (data) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  };

  const toDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* =========================================================
     Streak grid (night-sky themed)
     Always renders as a full, fixed rectangle. Logging starts
     in the top-left cell (your first-ever logged day) and fills
     left to right, wrapping to the next row once a row is full.
     Cells beyond today are just empty, waiting boxes.
  ========================================================= */
  const GRID_COLUMNS = 30;
  const GRID_ROWS = 12;
  const TOTAL_CELLS = GRID_COLUMNS * GRID_ROWS;

  // hours -> level. 0 hours (a past day) and "very little" practice
  // both read as orange; real practice reads as green, brighter with more time.
  function levelForDay(hours, isToday, isFuture) {
    if (isFuture) return 'future';
    if (!hours || hours <= 0) return isToday ? 'pending' : 'miss';
    if (hours < 1) return 'low';
    if (hours < 2) return 'g1';
    if (hours < 4) return 'g2';
    return 'g3';
  }

  function buildDayList(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loggedKeys = Object.keys(data).sort();
    const start = loggedKeys.length
      ? new Date(loggedKeys[0] + 'T00:00:00')
      : new Date(today);

    const days = [];
    const cursor = new Date(start);
    for (let i = 0; i < TOTAL_CELLS; i++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  function formatShortDate(d) {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function renderStreakGrid() {
    const grid = document.getElementById('streakGrid');
    const rangeLabel = document.getElementById('streakRange');
    const tooltip = document.getElementById('tooltip');
    if (!grid) return;

    const data = loadStreakData();
    const days = buildDayList(data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toDateKey(today);

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${GRID_COLUMNS}, 12px)`;

    if (rangeLabel) {
      rangeLabel.textContent = `Started ${formatShortDate(days[0])} \u2192 grid runs through ${formatShortDate(days[days.length - 1])}`;
    }

    days.forEach((day) => {
      const key = toDateKey(day);
      const hours = data[key] || 0;
      const isToday = key === todayKey;
      const isFuture = day > today;
      const level = levelForDay(hours, isToday, isFuture);

      const cell = document.createElement('div');
      cell.className = `cell level-${level}`;
      cell.tabIndex = 0;
      cell.dataset.date = key;
      cell.dataset.hours = String(hours);
      if (isToday) cell.style.boxShadow = (cell.style.boxShadow ? cell.style.boxShadow + ', ' : '') + '0 0 0 1.5px var(--cyan)';

      const show = () => {
        const d = new Date(key + 'T00:00:00');
        const label = `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        let hrsLabel;
        if (isFuture) hrsLabel = 'Not here yet';
        else if (hours > 0) hrsLabel = `${formatHoursLabel(hours)} logged`;
        else if (isToday) hrsLabel = 'Nothing logged yet';
        else hrsLabel = 'Missed';
        tooltip.innerHTML = `<span class="t-date">${label}</span><span class="t-hours">${hrsLabel}</span>`;
        const rect = cell.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.classList.add('visible');
      };
      const hide = () => tooltip.classList.remove('visible');

      cell.addEventListener('mouseenter', show);
      cell.addEventListener('mouseleave', hide);
      cell.addEventListener('focus', show);
      cell.addEventListener('blur', hide);

      grid.appendChild(cell);
    });

    renderStats(data);
  }

  function formatHoursLabel(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  function renderStats(data) {
    const entries = Object.entries(data).filter(([, h]) => h > 0);
    const totalHours = entries.reduce((sum, [, h]) => sum + h, 0);
    const activeDays = entries.length;

    // current streak: consecutive days ending today (or yesterday if today has no entry yet)
    let currentStreak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!(data[toDateKey(cursor)] > 0)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (data[toDateKey(cursor)] > 0) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // best streak across recorded history
    const sortedKeys = Object.keys(data).filter((k) => data[k] > 0).sort();
    let best = 0, run = 0, prev = null;
    sortedKeys.forEach((k) => {
      const d = new Date(k + 'T00:00:00');
      if (prev) {
        const diff = Math.round((d - prev) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = d;
    });

    document.getElementById('statTotalHours').textContent = formatHoursLabel(totalHours);
    document.getElementById('statActiveDays').textContent = String(activeDays);
    document.getElementById('statCurrentStreak').textContent = `${currentStreak}d`;
    document.getElementById('statBestStreak').textContent = `${best}d`;
  }

  function addHoursToToday(hours) {
    addHoursToDate(toDateKey(new Date()), hours);
  }

  function addHoursToDate(dateKey, hours) {
    if (!hours || hours <= 0) return;
    const data = loadStreakData();
    data[dateKey] = Math.round(((data[dateKey] || 0) + hours) * 100) / 100;
    saveStreakData(data);
    renderStreakGrid();
  }

  /* =========================================================
     Chronometer / stopwatch
  ========================================================= */
  let elapsedMs = 0;
  let running = false;
  let tickHandle = null;
  let lastTick = 0;

  const timerDisplay = document.getElementById('timerDisplay');
  const btnStart = document.getElementById('btnStart');
  const btnReset = document.getElementById('btnReset');
  const btnLogSession = document.getElementById('btnLogSession');
  const timerNote = document.getElementById('timerNote');

  function formatStopwatch(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function refreshTimerUI() {
    timerDisplay.textContent = formatStopwatch(elapsedMs);
    timerDisplay.classList.toggle('running', running);
    btnLogSession.disabled = elapsedMs < 1000; // require at least 1s before logging
  }

  function tick() {
    const now = performance.now();
    elapsedMs += now - lastTick;
    lastTick = now;
    refreshTimerUI();
    tickHandle = requestAnimationFrame(tick);
  }

  function startPause() {
    if (running) {
      running = false;
      cancelAnimationFrame(tickHandle);
      btnStart.textContent = 'Resume';
      timerNote.textContent = 'Paused. Resume when you\'re back at it.';
    } else {
      running = true;
      lastTick = performance.now();
      tickHandle = requestAnimationFrame(tick);
      btnStart.textContent = 'Pause';
      timerNote.textContent = 'Running \u2014 log the session whenever you stop.';
    }
    refreshTimerUI();
  }

  function resetTimer() {
    running = false;
    cancelAnimationFrame(tickHandle);
    elapsedMs = 0;
    btnStart.textContent = 'Start';
    timerNote.textContent = 'Start the chronometer, then log the session. Every session you log today adds to one running total for today.';
    refreshTimerUI();
  }

  function logSession() {
    if (elapsedMs < 1000) return;
    const hours = elapsedMs / 3600000;
    addHoursToToday(hours);
    const loggedLabel = formatHoursLabel(hours);
    resetTimer();
    // set this *after* resetTimer, which would otherwise overwrite it
    timerNote.textContent = `Logged ${loggedLabel} to today\u2019s total \u2014 reset and start another session whenever you like, it'll add to the same box.`;
  }

  btnStart.addEventListener('click', startPause);
  btnReset.addEventListener('click', resetTimer);
  btnLogSession.addEventListener('click', logSession);

  /* =========================================================
     Manual log form
  ========================================================= */
  const manualForm = document.getElementById('manualLogForm');
  const manualDate = document.getElementById('manualDate');
  const manualHours = document.getElementById('manualHours');
  const manualMinutes = document.getElementById('manualMinutes');
  const manualStatus = document.getElementById('manualLogStatus');

  manualDate.value = toDateKey(new Date());
  manualDate.max = toDateKey(new Date());

  manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const h = parseFloat(manualHours.value) || 0;
    const m = parseFloat(manualMinutes.value) || 0;
    const totalHours = h + m / 60;
    if (totalHours <= 0) {
      manualStatus.textContent = 'Add at least a few minutes before logging.';
      return;
    }
    const dateKey = manualDate.value || toDateKey(new Date());
    addHoursToDate(dateKey, totalHours);
    manualStatus.textContent = `Added ${formatHoursLabel(totalHours)} to ${dateKey}.`;
    manualHours.value = '0';
    manualMinutes.value = '0';
  });

  /* =========================================================
     Progress bars (editable)
  ========================================================= */
  function renderProgress() {
    const data = loadProgress();
    ['overall', 'ioaa', 'ipho'].forEach((key) => {
      const val = Math.max(0, Math.min(100, Math.round(data[key] || 0)));
      const valueEl = document.querySelector(`[data-value-for="${key}"]`);
      const fillEl = document.querySelector(`[data-fill-for="${key}"]`);
      if (valueEl) valueEl.textContent = `${val}%`;
      if (fillEl) fillEl.style.width = `${val}%`;
    });
  }

  function beginEdit(key, button) {
    const valueEl = button.querySelector(`[data-value-for="${key}"]`);
    if (!valueEl || button.querySelector('input')) return;
    const data = loadProgress();
    const current = Math.round(data[key] || 0);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '100';
    input.value = String(current);
    input.className = 'progress-edit-input';

    valueEl.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const next = Math.max(0, Math.min(100, Math.round(parseFloat(input.value) || 0)));
      const d = loadProgress();
      d[key] = next;
      saveProgress(d);
      renderProgress();
    };

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
      if (ev.key === 'Escape') { ev.preventDefault(); renderProgress(); }
    });
    input.addEventListener('blur', commit);
    input.addEventListener('click', (ev) => ev.stopPropagation());
  }

  document.querySelectorAll('.progress-edit').forEach((button) => {
    button.addEventListener('click', () => beginEdit(button.dataset.key, button));
  });

  /* =========================================================
     Topic breakdown (hover popovers under IOAA / IPhO)
  ========================================================= */
  const TOPICS_KEY = 'olympiadTopics';

  const DEFAULT_TOPICS = {
    ioaa: [
      { name: 'Celestial mechanics', pct: 0 },
      { name: 'Stellar astrophysics', pct: 0 },
      { name: 'Observational astronomy', pct: 0 },
      { name: 'Cosmology', pct: 0 },
      { name: 'Coordinates & time', pct: 0 },
      { name: 'Data analysis', pct: 0 }
    ],
    ipho: [
      { name: 'Mechanics', pct: 0 },
      { name: 'Electromagnetism', pct: 0 },
      { name: 'Thermodynamics', pct: 0 },
      { name: 'Optics & waves', pct: 0 },
      { name: 'Modern physics', pct: 0 },
      { name: 'Experimental skills', pct: 0 }
    ]
  };

  const loadTopics = () => {
    try {
      const raw = localStorage.getItem(TOPICS_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_TOPICS));
      const parsed = JSON.parse(raw);
      return {
        ioaa: Array.isArray(parsed.ioaa) ? parsed.ioaa : DEFAULT_TOPICS.ioaa,
        ipho: Array.isArray(parsed.ipho) ? parsed.ipho : DEFAULT_TOPICS.ipho
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_TOPICS));
    }
  };
  const saveTopics = (data) => localStorage.setItem(TOPICS_KEY, JSON.stringify(data));

  function renderTopics() {
    const topics = loadTopics();
    ['ioaa', 'ipho'].forEach((subject) => {
      const list = document.getElementById(`topicList-${subject}`);
      if (!list) return;
      list.innerHTML = '';
      topics[subject].forEach((topic, index) => {
        const pct = Math.max(0, Math.min(100, Math.round(topic.pct || 0)));

        const row = document.createElement('div');
        row.className = 'topic-row';

        const name = document.createElement('span');
        name.className = 'topic-name';
        name.textContent = topic.name;

        const track = document.createElement('div');
        track.className = 'topic-track';
        const fill = document.createElement('div');
        fill.className = 'topic-fill';
        fill.style.width = `${pct}%`;
        track.appendChild(fill);

        const value = document.createElement('button');
        value.type = 'button';
        value.className = 'topic-value';
        value.textContent = `${pct}%`;
        value.setAttribute('aria-label', `Edit ${topic.name} progress`);
        value.addEventListener('click', (ev) => {
          ev.stopPropagation();
          beginTopicEdit(subject, index, value);
        });

        row.append(name, track, value);
        list.appendChild(row);
      });
    });
  }

  function beginTopicEdit(subject, index, valueButton) {
    if (valueButton.querySelector('input')) return;
    const topics = loadTopics();
    const current = Math.round(topics[subject][index].pct || 0);
    const label = valueButton.textContent;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '100';
    input.value = String(current);
    input.className = 'topic-edit-input';

    valueButton.textContent = '';
    valueButton.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const next = Math.max(0, Math.min(100, Math.round(parseFloat(input.value) || 0)));
      const d = loadTopics();
      d[subject][index].pct = next;
      saveTopics(d);
      renderTopics();
    };

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
      if (ev.key === 'Escape') { ev.preventDefault(); valueButton.textContent = label; }
    });
    input.addEventListener('blur', commit);
    input.addEventListener('click', (ev) => ev.stopPropagation());
  }

  /* =========================================================
     Init
  ========================================================= */
  renderStreakGrid();
  refreshTimerUI();
  renderProgress();
  renderTopics();
})();