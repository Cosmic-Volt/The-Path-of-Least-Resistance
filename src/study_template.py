NAV = [("home","dash","Home"),("plan","map","Plan"),("progress","chart","Progress"),
       ("journal","book","Journal"),("library","library","Library")]


def build(cfg, r, icon, FONTS, BASE_CSS, STUDY_CSS, ICONS, STUDY_CORE):

    rail = "\n".join(
        f'      <button class="nav-item{" on" if i==0 else ""}" data-screen="{k}" onclick="showScreen(\'{k}\')">'
        f'{icon(ic)}<span>{label}</span>'
        + (f'<span class="nav-badge" id="rail-streak">0d</span>' if k == "progress" else "")
        + '</button>'
        for i,(k,ic,label) in enumerate(NAV))

    bottom = "\n".join(
        f'    <button class="bn-item{" on" if i==0 else ""}" data-screen="{k}" onclick="showScreen(\'{k}\')">'
        f'<span class="bn-ind">{icon(ic)}</span><span>{label}</span></button>'
        for i,(k,ic,label) in enumerate(NAV))

    prog_rows = "\n".join(
        f'        <div class="prog-row"><span class="prog-label">{t["label"]}</span>'
        f'<div class="bar bar-s"><i id="pb-{t["key"]}"></i><b class="bar-mark" id="mk-{t["key"]}"></b></div>'
        f'<span class="prog-pct" id="pct-{t["key"]}">0%</span></div>'
        for t in cfg["tracks"])

    phase_chips = "\n".join(
        f'        <button class="chip{" chip-on" if i==0 else ""}" onclick="filterPhase({i},this)">{p["short"]}</button>'
        for i,p in enumerate(cfg["phases"]))

    flow = r(cfg["flow"]) if cfg.get("flow") else ""

    return f"""<!DOCTYPE html>
<html lang="en" class="t-{cfg['theme']}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{cfg['subject']} — Olympiad Training</title>
<meta name="description" content="{cfg['tagline']}">
<meta name="theme-color" content="#0C0C10">
{FONTS}
<style>
{BASE_CSS}
{STUDY_CSS}
</style>
</head>
<body>
<div class="bg-field" aria-hidden="true"><i></i></div>
{ICONS}

<div class="app">

  <!-- NAVIGATION RAIL -->
  <nav class="rail" aria-label="Sections">
    <a class="rail-brand" href="index.html">
      <span class="rail-mark">{icon(cfg['glyph'])}</span>
      <span>
        <span class="rail-name">{cfg['subject']}</span>
        <span class="rail-sub" id="rail-day">Day 1</span>
      </span>
    </a>

    <div class="nav">
{rail}
    </div>

    <div class="rail-foot">
      <a class="rail-link" href="index.html">{icon('home')}Basecamp</a>
      <a class="rail-link" href="practice.html#{cfg['theme']}">{icon('target')}Practice range</a>
      <a class="rail-link" href="{cfg['sibling']}">{icon(cfg['siblingGlyph'])}{cfg['siblingName']}</a>
    </div>
  </nav>

  <!-- CONTENT -->
  <main class="content">

  <!-- ══════════ HOME ══════════ -->
  <section class="screen on" id="screen-home">
    <header class="topbar">
      <div class="topbar-title">
        <p class="overline dim"><span id="phase-tag">Phase 1</span> · {cfg['protocol']}</p>
        <h1>{cfg['homeGreeting']}</h1>
        <p id="home-sub">Foundation</p>
      </div>
      <div class="row">
        <span class="chip chip-err" id="missed-chip" style="display:none"></span>
        <div class="day-strip">
          <div>
            <span class="d-num num" id="day-num">1</span>
            <span class="d-of">/ 450</span>
          </div>
          <button class="icon-btn icon-btn-s" onclick="shiftDay(-1)" aria-label="Previous day">{icon('chev-left')}</button>
          <button class="icon-btn icon-btn-s" id="day-next" onclick="shiftDay(1)" aria-label="Next day">{icon('chev-right')}</button>
          <button class="icon-btn icon-btn-s" onclick="openDialog('dlg-jump')" aria-label="Jump to an earlier day">{icon('map')}</button>
          <button class="btn btn-tonal btn-xs" id="day-today" onclick="goToday()" style="display:none">Today</button>
        </div>
        <button class="icon-btn" onclick="openDialog('dlg-settings')" aria-label="Settings">{icon('gear')}</button>
      </div>
    </header>

    <div class="past-banner" id="past-banner" style="display:none"></div>

    <div class="stack-l">

      <!-- timer -->
      <div class="timer-hero" id="timer-hero">
        <div>
          <p class="t-label">Session clock</p>
          <div class="t-read num" id="t-read">00:00:00</div>
          <p class="t-meta" id="t-meta">Start the clock, or log time manually.</p>
        </div>
        <div>
          <p class="t-label">Logged today</p>
          <div class="t-today num" id="t-today">0m</div>
        </div>
        <div class="t-actions">
          <button class="btn btn-filled btn-l" id="t-toggle" onclick="toggleTimer()">{icon('play')}<span>Start</span></button>
          <button class="btn btn-outlined btn-l" id="t-log" onclick="logFromTimer()" disabled>{icon('check')}Log it</button>
          <button class="btn btn-outlined btn-l" onclick="resetTimer()" aria-label="Reset clock">{icon('reset')}</button>
          <button class="btn btn-outlined btn-l" onclick="openDialog('dlg-manual')">{icon('plus')}Manual</button>
        </div>
      </div>

      <!-- today's quest -->
      <div>
        <div class="topic-banner">
          <span class="tb-mark">{icon('layers')}</span>
          <div>
            <p class="overline">This week — <span id="today-week">Week 1</span></p>
            <h2 id="today-topic">—</h2>
          </div>
        </div>

        <div class="quest-grid">
          <div class="card">
            <div class="card-head">
              <p class="overline">Today's tasks</p>
              <span class="label-m on-var" id="task-count">0 of 5 done</span>
            </div>
            <div class="bar bar-s" style="margin-bottom:18px"><i id="task-bar"></i></div>
            <div id="task-list"></div>
          </div>

          <div class="stack">
            <div class="card tip-card">
              <div class="card-head"><p class="overline" style="opacity:.75">Focus tip</p>{icon('bulb')}</div>
              <p class="tip-body" id="today-tip"></p>
            </div>
            <div class="card">
              <div class="card-head"><p class="overline">Resources today</p></div>
              <div class="mini-list" id="today-res"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- glance -->
      <div class="tiles">
        <div class="tile tile-pri">
          <div class="tile-icon">{icon('spark')}</div>
          <div class="tile-val num" id="d-xp">0</div>
          <div class="tile-label">Total XP</div>
        </div>
        <div class="tile">
          <div class="tile-icon">{icon('clock')}</div>
          <div class="tile-val num" id="d-hrs">0.0</div>
          <div class="tile-label">Hours logged</div>
          <div class="tile-sub">of 1800 target</div>
        </div>
        <div class="tile">
          <div class="tile-icon">{icon('flame')}</div>
          <div class="tile-val num" id="d-streak">0</div>
          <div class="tile-label">Day streak</div>
        </div>
        <div class="tile">
          <div class="tile-icon">{icon('check')}</div>
          <div class="tile-val num" id="d-studied">0</div>
          <div class="tile-label">Days studied</div>
        </div>
      </div>

    </div>
  </section>

  <!-- ══════════ PLAN ══════════ -->
  <section class="screen" id="screen-plan">
    <header class="topbar">
      <div class="topbar-title">
        <p class="overline dim">450-day curriculum</p>
        <h1>Plan</h1>
        <p>{cfg['currSub']}</p>
      </div>
    </header>

    <div class="stack-l">
      <div>
        <p class="overline dim" style="margin-bottom:12px">Phases</p>
        <div class="stepper" id="stepper"></div>
      </div>
{flow}
      <div>
        <p class="overline dim" style="margin-bottom:12px">Weeks</p>
        <div class="filter-chips">
{phase_chips}
        </div>
        <div id="week-list"></div>
      </div>
    </div>
  </section>

  <!-- ══════════ PROGRESS ══════════ -->
  <section class="screen" id="screen-progress">
    <header class="topbar">
      <div class="topbar-title">
        <p class="overline dim">Where you stand</p>
        <h1>Progress</h1>
      </div>
    </header>

    <div class="stack-l">
      <div class="rank-hero">
        <div class="rank-orb" id="rank-orb">E</div>
        <div class="rank-info">
          <div class="rank-name" id="rank-name">Initiate</div>
          <p class="rank-next" id="rank-next">200 XP to rank D</p>
          <div class="bar"><i id="rank-bar"></i></div>
          <p class="label-m dim num" id="rank-xp" style="margin-top:9px">0 / 200 XP</p>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <p class="overline">Subject progress</p>
          <span class="label-m dim" id="prog-summary"></span>
        </div>
        <p class="body-s dim" style="margin-bottom:18px">Bars show days you actually studied in each block. The notch marks where the calendar says you should be.</p>
        <div class="prog-row">
          <span class="prog-label">Overall journey</span>
          <div class="bar bar-s"><i id="pb-all"></i><b class="bar-mark" id="mk-all"></b></div>
          <span class="prog-pct" id="pct-all">0%</span>
        </div>
{prog_rows}
      </div>

      <div class="card">
        <div class="card-head">
          <p class="overline">Streak map</p>
          <div class="legend">
            <span class="sw" style="background:var(--sc-high)"></span><span>None</span><span class="gap"></span>
            <span class="sw" style="background:var(--error-container)"></span><span>Missed</span><span class="gap"></span>
            <span class="sw s-cell h1"></span><span class="sw s-cell h2"></span>
            <span class="sw s-cell h3"></span><span class="sw s-cell h4"></span><span>4h+</span>
          </div>
        </div>
        <div class="tiles" style="margin-bottom:22px">
          <div class="tile"><div class="tile-val num" id="st-cur">0</div><div class="tile-label">Current streak</div></div>
          <div class="tile"><div class="tile-val num" id="st-best">0</div><div class="tile-label">Longest streak</div></div>
          <div class="tile"><div class="tile-val num" id="st-total">0</div><div class="tile-label">Days logged</div></div>
          <div class="tile"><div class="tile-val num" id="st-pct">0%</div><div class="tile-label">Completion</div></div>
        </div>
        <div class="streak-map" id="streak-map"></div>
      </div>

      <div class="card">
        <div class="card-head">
          <p class="overline">Achievements</p>
          <span class="chip chip-xs num" id="ach-count">0 / 0</span>
        </div>
        <div class="ach-grid" id="ach-grid"></div>
      </div>
    </div>
  </section>

  <!-- ══════════ JOURNAL ══════════ -->
  <section class="screen" id="screen-journal">
    <header class="topbar">
      <div class="topbar-title">
        <p class="overline dim">{cfg['journalName']}</p>
        <h1>Journal</h1>
        <p>What clicked, what's unclear, what's next.</p>
      </div>
      <span class="chip" id="j-count">0 entries</span>
    </header>

    <div class="stack-l">
      <div class="card">
        <div class="card-head"><p class="overline">New entry — day <span id="j-day-num">1</span></p></div>
        <div class="field">
          <label for="j-input">Tonight's notes</label>
          <textarea id="j-input" placeholder="{cfg['journalPlaceholder']}"></textarea>
        </div>
        <div class="row" style="margin-top:16px">
          <button class="btn btn-filled" onclick="addJournal()">{icon('check')}Save entry</button>
          <button class="btn btn-text" onclick="clearJournalInput()">Clear</button>
        </div>
      </div>
      <div id="journal-entries"></div>
    </div>
  </section>

  <!-- ══════════ LIBRARY ══════════ -->
  <section class="screen" id="screen-library">
    <header class="topbar">
      <div class="topbar-title">
        <p class="overline dim">Resource library</p>
        <h1>Library</h1>
        <p>{cfg['resSub']}</p>
      </div>
    </header>
{r(cfg['library'])}
  </section>

  </main>
</div>

<!-- BOTTOM NAVIGATION (mobile) -->
<nav class="bottom-nav" aria-label="Sections">
{bottom}
</nav>

<!-- PERSISTENT TIMER DOCK -->
<div class="dock" id="dock">
  <span class="d-dot"></span>
  <span class="d-time num" id="dock-time">00:00:00</span>
  <button class="icon-btn icon-btn-filled" id="dock-toggle" onclick="toggleTimer()" aria-label="Play or pause">{icon('play')}</button>
  <button class="btn btn-filled btn-s" onclick="logFromTimer()">{icon('check')}Log</button>
</div>

<!-- DIALOGS -->
<div class="scrim" id="dlg-manual" onclick="if(event.target===this)closeDialog('dlg-manual')">
  <form class="dialog" onsubmit="return submitManual(event)">
    <div class="dialog-icon">{icon('plus')}</div>
    <h3 class="title-l">Log time manually</h3>
    <p class="dialog-sub">Adds to whatever is already logged for day <span id="dlg-day">1</span>.</p>
    <div class="row" style="gap:12px;flex-wrap:nowrap">
      <div class="field grow">
        <label for="m-hours">Hours</label>
        <input id="m-hours" type="number" min="0" max="16" step="1" placeholder="0" inputmode="numeric">
      </div>
      <div class="field grow">
        <label for="m-mins">Minutes</label>
        <input id="m-mins" type="number" min="0" max="59" step="5" placeholder="0" inputmode="numeric">
      </div>
    </div>
    <div class="dialog-actions">
      <button type="button" class="btn btn-text" onclick="closeDialog('dlg-manual')">Cancel</button>
      <button type="submit" class="btn btn-filled">Add to log</button>
    </div>
  </form>
</div>

<div class="scrim" id="dlg-jump" onclick="if(event.target===this)closeDialog('dlg-jump')">
  <form class="dialog" onsubmit="return submitJump(event)">
    <div class="dialog-icon">{icon('map')}</div>
    <h3 class="title-l">Jump to a day</h3>
    <p class="dialog-sub">Review or backfill an earlier day. You can't jump past today — the current day follows your system clock.</p>
    <div class="field">
      <label for="jump-day">Day number</label>
      <input id="jump-day" type="number" min="1" step="1" placeholder="1" inputmode="numeric">
    </div>
    <div class="dialog-actions">
      <button type="button" class="btn btn-text" onclick="closeDialog('dlg-jump')">Cancel</button>
      <button type="submit" class="btn btn-filled">Go</button>
    </div>
  </form>
</div>

<div class="scrim" id="dlg-settings" onclick="if(event.target===this)closeDialog('dlg-settings')">
  <form class="dialog" onsubmit="return submitSettings(event)">
    <div class="dialog-icon">{icon('gear')}</div>
    <h3 class="title-l">Settings</h3>
    <p class="dialog-sub">Day 1 of your plan. Change this and every logged day, task and journal entry moves with it.</p>
    <div class="field">
      <label for="set-start">Start date</label>
      <input id="set-start" type="date" required>
    </div>

    <hr class="divider" style="margin:24px 0 18px">
    <p class="overline dim" style="margin-bottom:6px">Backup</p>
    <p class="body-s dim" style="margin-bottom:14px">Everything lives in this browser only. Export regularly — clearing site data wipes it.</p>
    <div class="row" style="gap:8px;flex-wrap:nowrap">
      <button type="button" class="btn btn-tonal grow" onclick="exportAll()">{icon('doc')}Export</button>
      <button type="button" class="btn btn-tonal grow" onclick="document.getElementById('import-file').click()">{icon('plus')}Import</button>
      <input type="file" id="import-file" accept="application/json,.json" style="display:none" onchange="importAll(this)">
    </div>

    <hr class="divider" style="margin:22px 0 16px">
    <button type="button" class="btn btn-error btn-block" onclick="closeDialog('dlg-settings');openDialog('dlg-reset')">{icon('reset')}Reset all progress</button>

    <div class="dialog-actions">
      <button type="button" class="btn btn-text" onclick="closeDialog('dlg-settings')">Cancel</button>
      <button type="submit" class="btn btn-filled">Save</button>
    </div>
  </form>
</div>

<div class="scrim" id="dlg-reset" onclick="if(event.target===this)closeDialog('dlg-reset')">
  <div class="dialog">
    <div class="dialog-icon" style="background:var(--error-container);color:var(--on-error-container)">{icon('reset')}</div>
    <h3 class="title-l">Reset all progress?</h3>
    <p class="dialog-sub">Every logged hour, journal entry, XP point and achievement for {cfg['subject']} will be erased. This cannot be undone.</p>
    <label class="check-row">
      <input type="checkbox" id="reset-keep-start" checked>
      <span>Keep my start date (day numbering stays the same)</span>
    </label>
    <div class="dialog-actions">
      <button class="btn btn-text" onclick="closeDialog('dlg-reset')">Keep my progress</button>
      <button class="btn btn-error" onclick="confirmReset()">Reset everything</button>
    </div>
  </div>
</div>

<div class="scrim" id="lu-scrim" onclick="if(event.target===this)closeDialog('lu-scrim')">
  <div class="dialog" style="text-align:center">
    <p class="overline dim">Rank up</p>
    <div class="rank-orb" id="lu-rank" style="margin:18px auto 14px">D</div>
    <h3 class="headline" id="lu-name">Observer</h3>
    <p class="dialog-sub" id="lu-sub" style="margin-bottom:6px">You earned this.</p>
    <button class="btn btn-filled btn-block" onclick="closeDialog('lu-scrim')" style="margin-top:18px">Continue</button>
  </div>
</div>

<!-- SNACKBAR -->
<div class="snackbar" id="snackbar" role="status" aria-live="polite">
  <span class="snack-icon" id="snack-icon"></span>
  <span>
    <span class="snack-title" id="snack-title"></span><br>
    <span class="snack-sub" id="snack-sub"></span>
  </span>
</div>

<script>
{r(cfg['data'])}
</script>
<script>
{STUDY_CORE}
</script>
</body>
</html>
"""
