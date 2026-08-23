const { chromium } = require('playwright');
const B = 'http://localhost:8899/';
const errs = [];
const ok = [];
function check(name, cond, detail) {
  (cond ? ok : errs).push((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  → ' + detail : ''));
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('JS ERROR  ' + e.message));

  /* ══════════ IOAA study system ══════════ */
  await page.goto(B + 'ioaa-study.html'); await page.waitForTimeout(500);
  /* start the plan 250 days ago so there is a real past to navigate */
  await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() - 249);
    localStorage.setItem('ioaa-sys', JSON.stringify({
      day: 1, xp: 0, logs: {}, checks: {}, journal: [], progress: {},
      unlockedAch: [], unlockedAchDates: {}, startDate: d.toISOString().slice(0, 10) }));
  });
  await page.reload(); await page.waitForTimeout(700);
  check('today is derived from the system clock', (await page.textContent('#day-num')) === '250', await page.textContent('#day-num'));
  check('cannot step past today', await page.isDisabled('#day-next'));

  // manual log dialog
  await page.click('[onclick*="dlg-manual"]'); await page.waitForTimeout(350);
  check('manual dialog opens', await page.isVisible('#dlg-manual .dialog'));
  await page.fill('#m-hours', '3'); await page.fill('#m-mins', '30');
  await page.click('#dlg-manual button[type=submit]'); await page.waitForTimeout(500);
  check('manual log adds hours', (await page.textContent('#d-hrs')) === '3.5', await page.textContent('#d-hrs'));
  check('manual log awards XP', (await page.textContent('#d-xp')) === '35', await page.textContent('#d-xp'));
  check('today total updates', (await page.textContent('#t-today')) === '3h 30m', await page.textContent('#t-today'));
  check('snackbar shows', await page.isVisible('#snackbar.show'));

  // timer + persistent dock
  await page.click('#t-toggle'); await page.waitForTimeout(1300);
  const tRead = await page.textContent('#t-read');
  check('timer counts', tRead !== '00:00:00', tRead);
  await page.click('[data-screen=progress]'); await page.waitForTimeout(600);
  check('dock follows across screens', await page.isVisible('#dock.show'));
  check('dock mirrors the clock', (await page.textContent('#dock-time')) !== '00:00:00');
  await page.click('#dock-toggle'); await page.waitForTimeout(300);
  await page.click('[data-screen=home]'); await page.waitForTimeout(500);
  check('dock hides on home', !(await page.isVisible('#dock.show')));
  await page.click('#t-log'); await page.waitForTimeout(500);
  check('sub-minute sessions are refused, with a reason',
        (await page.textContent('#snack-title')) === 'Too short to log', await page.textContent('#snack-title'));
  await page.click('[onclick="resetTimer()"]'); await page.waitForTimeout(200);

  // tasks
  await page.click('#task-list .task'); await page.waitForTimeout(300);
  check('task toggles', (await page.getAttribute('#task-list .task', 'class')).includes('done'));
  check('task counter updates', (await page.textContent('#task-count')).startsWith('1 of'), await page.textContent('#task-count'));
  await page.screenshot({ path: 'shots/V1-ioaa-home.png' });

  // plan
  await page.click('[data-screen=plan]'); await page.waitForTimeout(600);
  check('phase stepper renders', (await page.locator('.step-card').count()) === 4);
  const wkCur = await page.locator('.week').count();
  check('plan opens on the phase you are actually in', wkCur > 0, wkCur + ' weeks');
  check('the current week is expanded by default', (await page.locator('.week.open').count()) >= 1);
  await page.click('.filter-chips .chip:nth-child(1)'); await page.waitForTimeout(400);
  const wk1 = await page.locator('.week').count();
  check('phase filter switches', wk1 === 7 && wk1 !== wkCur, 'phase 1 has ' + wk1);
  check('weeks show days actually studied', /\d+\/\d+/.test(await page.locator('.week .chip').first().textContent()),
        await page.locator('.week .chip').first().textContent());
  await page.click('.week:nth-child(2) .week-head'); await page.waitForTimeout(300);
  check('week expands', (await page.getAttribute('.week:nth-child(2)', 'class')).includes('open'));
  await page.screenshot({ path: 'shots/V2-ioaa-plan.png' });

  // progress
  await page.click('[data-screen=progress]'); await page.waitForTimeout(600);
  check('streak map renders 450 days', (await page.locator('#streak-map .s-cell').count()) === 450);
  check('achievements render', (await page.locator('.ach').count()) === 18);
  check('at least one unlocked', (await page.locator('.ach.unlocked').count()) > 0);
  check('rank hero shows', (await page.textContent('#rank-name')).length > 0);
  const ovPct = parseInt(await page.textContent('#pct-all'), 10);
  check('progress measures work, not the calendar', ovPct < 20,
        ovPct + '% on day 243 — calendar-based would read ~54%');
  check('schedule marker is placed', await page.evaluate(() => {
    const m = document.getElementById('mk-all');
    return m && m.style.display !== 'none' && parseFloat(m.style.left) > 20;
  }));
  check('turn-up summary shown', (await page.textContent('#prog-summary')).includes('turn-up'),
        await page.textContent('#prog-summary'));
  await page.screenshot({ path: 'shots/V3-ioaa-progress.png' });

  // journal
  await page.click('[data-screen=journal]'); await page.waitForTimeout(500);
  await page.fill('#j-input', 'Derived the distance modulus twice from scratch. Extinction still slippery.');
  await page.click('[onclick="addJournal()"]'); await page.waitForTimeout(400);
  check('journal saves', (await page.locator('.j-entry').count()) === 1);
  await page.screenshot({ path: 'shots/V4-ioaa-journal.png' });

  // library
  await page.click('[data-screen=library]'); await page.waitForTimeout(500);
  check('library cards render', (await page.locator('.res-card').count()) === 16, String(await page.locator('.res-card').count()));
  await page.screenshot({ path: 'shots/V5-ioaa-library.png' });

  // jump + reset dialogs
  await page.click('[data-screen=home]'); await page.waitForTimeout(400);
  await page.click('[onclick*="dlg-jump"]'); await page.waitForTimeout(300);
  await page.fill('#jump-day', '120');
  await page.click('#dlg-jump button[type=submit]'); await page.waitForTimeout(500);
  check('jump to an earlier day works', (await page.textContent('#day-num')) === '120', await page.textContent('#day-num'));
  check('past-day banner appears', await page.isVisible('#past-banner'));
  await page.click('[onclick*="dlg-jump"]'); await page.waitForTimeout(250);
  check('jump input is capped at today', (await page.getAttribute('#jump-day', 'max')) === '250',
        await page.getAttribute('#jump-day', 'max'));
  await page.fill('#jump-day', '449');
  await page.click('#dlg-jump button[type=submit]'); await page.waitForTimeout(400);
  check('a future day is refused outright', (await page.textContent('#day-num')) === '120',
        await page.textContent('#day-num'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('#day-today'); await page.waitForTimeout(400);
  check('back-to-today returns and hides the banner',
        (await page.textContent('#day-num')) === '250' && !(await page.isVisible('#past-banner')));

  const pub = JSON.parse(await page.evaluate(() => localStorage.getItem('olympiad.progress.ioaa')));
  check('IOAA publishes rank', !!pub.rank, pub.rank);
  check('IOAA publishes logs for the calendar', !!pub.logs && Object.keys(pub.logs).length > 0);

  /* --- backfill stamps the right calendar date --- */
  await page.click('[aria-label="Previous day"]'); await page.waitForTimeout(200);
  await page.click('[aria-label="Previous day"]'); await page.waitForTimeout(200);
  const cursor = parseInt(await page.textContent('#day-num'), 10);
  await page.click('[onclick*="dlg-manual"]'); await page.waitForTimeout(250);
  await page.fill('#m-hours', '2');
  await page.click('#dlg-manual button[type=submit]'); await page.waitForTimeout(500);
  const stamp = await page.evaluate(c => {
    const st = JSON.parse(localStorage.getItem('ioaa-sys'));
    const s0 = new Date(st.startDate + 'T00:00:00'); s0.setDate(s0.getDate() + c - 1);
    return { got: st.logs['d' + c].date, want: s0.toISOString().slice(0, 10) };
  }, cursor);
  check('backfilled hours keep their own date', stamp.got === stamp.want, stamp.got + ' vs ' + stamp.want);
  await page.click('#day-today'); await page.waitForTimeout(400);

  /* --- daily tasks come from the curriculum --- */
  const tA = await page.$$eval('#task-list .task-text', n => n.map(x => x.textContent));
  await page.click('[aria-label="Previous day"]'); await page.waitForTimeout(350);
  const tB = await page.$$eval('#task-list .task-text', n => n.map(x => x.textContent));
  check('daily tasks change day to day', JSON.stringify(tA) !== JSON.stringify(tB), tA[0]);
  check('tasks name real curriculum topics', tA[0].length > 20 && tA[0].includes('—'), tA[0]);
  await page.click('#day-today'); await page.waitForTimeout(350);

  /* --- settings: start date + backup --- */
  await page.click('[aria-label=Settings]'); await page.waitForTimeout(350);
  check('settings dialog opens', await page.isVisible('#dlg-settings .dialog'));
  const dayBefore = parseInt(await page.textContent('#day-num'), 10);
  const curStart = await page.inputValue('#set-start');
  const moved = new Date(curStart + 'T00:00:00'); moved.setDate(moved.getDate() + 7);
  await page.fill('#set-start', moved.toISOString().slice(0, 10));
  await page.click('#dlg-settings button[type=submit]'); await page.waitForTimeout(700);
  check('editing the start date shifts every day', parseInt(await page.textContent('#day-num'), 10) === dayBefore - 7,
        dayBefore + ' -> ' + await page.textContent('#day-num'));
  const consistent = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('ioaa-sys'));
    return Object.keys(st.logs).filter(k => st.logs[k].hrs > 0).every(k => {
      const i = +k.slice(1), d = new Date(st.startDate + 'T00:00:00');
      d.setDate(d.getDate() + i - 1);
      return d.toISOString().slice(0, 10) === st.logs[k].date;
    });
  });
  check('logs stay consistent with the new start date', consistent);

  await page.click('[aria-label=Settings]'); await page.waitForTimeout(350);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[onclick="exportAll()"]')]);
  await dl.saveAs('/tmp/verify-backup.json');
  const backup = JSON.parse(require('fs').readFileSync('/tmp/verify-backup.json', 'utf8'));
  check('backup exports', backup.format === 'olympiad-training-backup' && Object.keys(backup.data).length > 0,
        Object.keys(backup.data).join(','));
  const hrsBefore = await page.textContent('#d-hrs');
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(600);
  await page.click('[aria-label=Settings]'); await page.waitForTimeout(350);
  await page.setInputFiles('#import-file', '/tmp/verify-backup.json'); await page.waitForTimeout(1700);
  check('backup restores', (await page.textContent('#d-hrs')) === hrsBefore,
        hrsBefore + ' -> ' + await page.textContent('#d-hrs'));

  await page.click('[aria-label=Settings]'); await page.waitForTimeout(300);
  await page.click('[onclick*="dlg-reset"]'); await page.waitForTimeout(350);
  check('reset dialog opens', await page.isVisible('#dlg-reset .dialog'));
  await page.click('[onclick="closeDialog(\'dlg-reset\')"]'); await page.waitForTimeout(300);

  /* ══════════ IPhO study system ══════════ */
  await page.goto(B + 'ipho-study.html'); await page.waitForTimeout(600);
  await page.click('[onclick*="dlg-manual"]'); await page.waitForTimeout(300);
  await page.fill('#m-hours', '5');
  await page.click('#dlg-manual button[type=submit]'); await page.waitForTimeout(500);
  check('IPhO logs independently', (await page.textContent('#d-hrs')) === '5.0', await page.textContent('#d-hrs'));
  await page.click('[data-screen=plan]'); await page.waitForTimeout(600);
  check('IPhO has 7 phases', (await page.locator('.step-card').count()) === 7);
  check('IPhO reading flow renders', (await page.locator('.flow-step').count()) === 5);
  await page.screenshot({ path: 'shots/V6-ipho-plan.png' });
  await page.click('[data-screen=home]'); await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/V7-ipho-home.png' });
  const pub2 = JSON.parse(await page.evaluate(() => localStorage.getItem('olympiad.progress.ipho')));
  check('IPhO publishes (was broken before)', !!pub2 && pub2.subject === 'IPhO');

  /* ══════════ Basecamp ══════════ */
  await page.goto(B + 'index.html'); await page.waitForTimeout(900);
  check('year graph renders 371 cells', (await page.locator('#cal .cell').count()) === 371);
  check('month labels render', (await page.locator('#calMonths span').count()) >= 12);
  const agg = await page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem('olympiadStreakData') || '{}');
    let t = Object.values(g).reduce((a, b) => a + b, 0);
    ['ioaa', 'ipho'].forEach(k => {
      const pub = JSON.parse(localStorage.getItem('olympiad.progress.' + k) || 'null');
      if (pub && pub.logs) Object.values(pub.logs).forEach(e => { t += e.hrs || 0; });
    });
    return Math.round(t * 10) / 10;
  });
  const shown = await page.textContent('#statHours');
  const shownH = (parseInt((shown.match(/(\d+)h/) || [0, 0])[1], 10) || 0)
               + (parseInt((shown.match(/(\d+)m/) || [0, 0])[1], 10) || 0) / 60;
  check('activity total equals general + IOAA + IPhO', Math.abs(shownH - agg) < 0.05,
        shown + ' vs computed ' + agg + 'h');
  check('IOAA track card is live', !(await page.getAttribute('#ioaa-live', 'hidden')));
  check('IPhO track card is live', !(await page.getAttribute('#ipho-live', 'hidden')));
  check('IOAA rank surfaces on home', (await page.textContent('#ioaa-rank')).length > 0);
  check('breakdown topics render', (await page.locator('#ioaaTopics .break-topic').count()) === 6);

  await page.click('#btnStart'); await page.waitForTimeout(1300);
  check('basecamp clock runs', (await page.textContent('#clock')) !== '00:00:00');
  check('log button enables', !(await page.isDisabled('#btnLog')));
  await page.click('#btnReset'); await page.waitForTimeout(300);
  await page.fill('#mHours', '2'); await page.fill('#mMins', '30');
  await page.click('#manualForm button[type=submit]'); await page.waitForTimeout(600);
  check('basecamp manual log works', (await page.textContent('#manualStatus')).includes('2h 30m'), await page.textContent('#manualStatus'));

  await page.screenshot({ path: 'shots/V8-index-hero.png' });
  const actBox = await page.locator('.section').first().boundingBox();
  await page.evaluate(y => window.scrollTo(0, y - 80), actBox.y); await page.waitForTimeout(600);
  await page.locator('#cal .cell').nth(367).scrollIntoViewIfNeeded();
  await page.locator('#cal .cell').nth(367).hover(); await page.waitForTimeout(400);
  check('day tooltip appears', await page.isVisible('#tooltip.visible'),
        (await page.textContent('#tooltip')).slice(0, 40));
  await page.screenshot({ path: 'shots/V9-index-activity.png' });
  const logBox = await page.locator('.section').nth(1).boundingBox();
  await page.evaluate(y => window.scrollTo(0, y - 80), logBox.y); await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/V10-index-log.png' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/V11-index-breakdown.png' });

  /* ══════════ Practice ══════════ */
  await page.goto(B + 'practice.html'); await page.waitForTimeout(700);
  await page.click('[data-olymp=ioaa]'); await page.waitForTimeout(500);
  check('difficulty cards render', (await page.locator('#diffRow .pick').count()) === 4);
  await page.click('#diffRow .pick:nth-child(2)'); await page.waitForTimeout(900);
  check('session starts with 2 questions', (await page.locator('.qblock').count()) === 2);
  check('exam clock set', (await page.textContent('#clock')).startsWith('00:44'), await page.textContent('#clock'));
  await page.click('.hintbtn'); await page.waitForTimeout(400);
  check('hint appears', (await page.locator('.hint').count()) === 1);
  await page.fill('#scratch', 'v^2 = u^2 - 2gh');
  await page.evaluate(() => window.scrollTo(0, 340)); await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/V12-practice-arena.png' });
  await page.click('#btnEnd'); await page.waitForTimeout(700);
  check('review renders both questions', (await page.locator('.revq').count()) === 2);
  await page.click('.grade button:nth-child(1)'); await page.waitForTimeout(400);
  check('grading records', (await page.textContent('#chipIoaa')).includes('1'), await page.textContent('#chipIoaa'));
  await page.evaluate(() => window.scrollTo(0, 320)); await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/V13-practice-review.png' });

  if (!(await page.isVisible('#vegaBubble.open'))) { await page.click('#vegaBtn'); await page.waitForTimeout(500); }
  check('Vega panel opens', await page.isVisible('#vegaBubble.open'));
  await page.click('#qvHint'); await page.waitForTimeout(600);
  check('Vega replies', (await page.locator('.msg').count()) > 1);
  await page.screenshot({ path: 'shots/V14-practice-vega.png' });

  await page.click('[data-olymp=ipho-pyq]'); await page.waitForTimeout(600);
  const archTotal = await page.textContent('#pyqCount');
  check('archive lists the full index', archTotal === '248 papers', archTotal);
  await page.selectOption('#pyqSubject', 'ioaa'); await page.waitForTimeout(400);
  check('archive filters by olympiad', (await page.textContent('#pyqCount')) === '169 papers',
        await page.textContent('#pyqCount'));
  await page.selectOption('#pyqType', 'data-analysis'); await page.waitForTimeout(350);
  check('archive filters by round', (await page.textContent('#pyqCount')) === '24 papers',
        await page.textContent('#pyqCount'));
  await page.selectOption('#pyqSubject', ''); await page.selectOption('#pyqType', '');
  await page.fill('#pyqSearch', 'neutron'); await page.waitForTimeout(450);
  check('archive search works', (await page.locator('.pyq-card').count()) > 0,
        await page.textContent('#pyqCount'));
  await page.fill('#pyqSearch', ''); await page.waitForTimeout(400);
  const links = await page.$$eval('.pyq-card [data-open]', n => n.map(x => x.dataset.open));
  check('archive links point at official PDFs',
        links.length > 0 && links.every(u => /^https:\/\/(cdn\.ioaastrophysics\.org|ioaa\.olimpicos\.net|ipho\.olimpicos\.net)\//.test(u)),
        links[0]);
  await page.evaluate(() => window.scrollTo(0, 520)); await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/V15-practice-archive.png' });
  await page.selectOption('#pyqTopic', '');
  await page.click('.pyq-card .gold'); await page.waitForTimeout(900);
  check('archive session starts', (await page.locator('.qblock').count()) === 2);
  check('archive clock is 90 min', (await page.textContent('#clock')).startsWith('01:29'), await page.textContent('#clock'));

  /* --- KaTeX must work with no network at all --- */
  const off = await ctx.newPage();
  off.on('pageerror', e => errs.push('OFFLINE JS  ' + e.message));
  const remote = [];
  await off.route('http://**', r => { remote.push(r.request().url()); r.abort(); });
  await off.route('https://**', r => { remote.push(r.request().url()); r.abort(); });
  await off.goto('file:///home/claude/olympiad/dist/practice.html'); await off.waitForTimeout(1200);
  const katex = await off.evaluate(async () => {
    const d = document.createElement('div');
    d.textContent = 'Check $v^2 = u^2 - 2gh$ and $$\\oint \\vec{B}\\cdot d\\vec{l} = \\mu_0 I$$';
    document.body.appendChild(d);
    await window.__renderMathInEl(d);
    const n = d.querySelector('.katex');
    return { rendered: d.querySelectorAll('.katex').length, font: n ? getComputedStyle(n).fontFamily : '' };
  });
  const nonFont = remote.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  check('KaTeX renders with no network of its own', katex.rendered === 2 && nonFont.length === 0,
        katex.rendered + ' formulas · ' + nonFont.length + ' non-font requests');
  check('the only remote request left is the Google Fonts stylesheet',
        remote.length === 0 || remote.every(u => /fonts\.(googleapis|gstatic)\.com/.test(u)),
        remote.join(' '));
  check('KaTeX uses its embedded fonts', katex.font.indexOf('KaTeX_Main') === 0, katex.font);
  await off.close();

  /* --- generators cover every difficulty --- */
  const genOK = await page.evaluate(() => {
    const bad = [];
    ['ioaa', 'ipho'].forEach(o => ['easy', 'medium', 'hard', 'olympiad'].forEach(d => {
      for (let i = 0; i < 5; i++) {
        const q = genQuestion(o, d);
        if (!q || !q.q || !q.parts.length || !q.sol || !q.hints.length) bad.push(o + '.' + d);
      }
    }));
    return bad;
  });
  check('every difficulty can generate fresh problems', genOK.length === 0, genOK.join(','));

  /* ══════════ Mobile ══════════ */
  const m = await ctx.newPage();
  m.on('pageerror', e => errs.push('MOBILE JS  ' + e.message));
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(B + 'ioaa-study.html'); await m.waitForTimeout(800);
  check('bottom nav shows on mobile', await m.isVisible('.bottom-nav'));
  check('rail nav hidden on mobile', !(await m.isVisible('.rail .nav')));
  await m.screenshot({ path: 'shots/V16-mobile-home.png' });
  await m.click('.bn-item[data-screen=progress]'); await m.waitForTimeout(700);
  check('bottom nav switches screens', await m.isVisible('#screen-progress.on'));
  await m.screenshot({ path: 'shots/V17-mobile-progress.png' });
  await m.goto(B + 'index.html'); await m.waitForTimeout(800);
  await m.screenshot({ path: 'shots/V18-mobile-index.png' });
  await m.goto(B + 'practice.html'); await m.waitForTimeout(800);
  await m.screenshot({ path: 'shots/V19-mobile-practice.png' });

  console.log(ok.join('\n'));
  console.log('\n───────────────────────────────');
  console.log(ok.length + ' passed, ' + errs.length + ' failed');
  if (errs.length) console.log('\n' + errs.join('\n'));
  await browser.close();
})();
