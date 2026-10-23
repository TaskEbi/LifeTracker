/* LifeTracker prototype shell: shared interaction controller.
   Each design supplies its own views, sheets and reward markup; this file wires
   the same actions (data-a="…") to the shared LT data so every design behaves alike. */
(function (global) {
  'use strict';

  global.Shell = function (cfg) {
    const LT = global.LT, D = LT.date, F = LT.fmt, T = LT.TODAY;
    LT.init(cfg.key);
    const app = document.getElementById(cfg.appId || 'app');
    const layer = document.getElementById(cfg.layerId || 'layer');
    const nav = cfg.navId ? document.getElementById(cfg.navId) : null;

    const ui = Object.assign({
      view: 'home', prev: null, dir: 'fwd', bubble: null, pokeN: 0,
      taskWhen: 'open', taskSec: null, calSel: T, calWeek: 0, calFilter: [], calMode: 'week',
      sport: 'all', subject: 'maths', tc: 'rapid', gymLift: 'Bench press',
      sleepDraft: null, screenDraft: null,
    }, cfg.ui || {});
    const S = { ui, sheet: null, rest: null, LT, D, F, T };

    const timeAdd = (t, d) => D.fromMin(D.toMin(t) + d);
    const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    S.clock = clock; S.timeAdd = timeAdd;

    /* ---------- render ---------- */
    function render(keepScroll) {
      const scroller = cfg.scroller ? cfg.scroller() : window;
      const y = scroller === window ? window.scrollY : scroller.scrollTop;
      if (!S.ui.sleepDraft) S.ui.sleepDraft = { bed: '23:15', wake: '08:00', score: null };
      if (!S.ui.screenDraft) S.ui.screenDraft = { minutes: 195 };
      const view = cfg.views[ui.view] || cfg.views.home;
      app.innerHTML = view(S);
      app.dataset.view = ui.view;
      const sc = cfg.scroller ? cfg.scroller() : window;
      if (keepScroll) { sc === window ? window.scrollTo(0, y) : (sc.scrollTop = y); }
      else { sc === window ? window.scrollTo(0, 0) : (sc.scrollTop = 0); }
      if (nav && cfg.nav) nav.innerHTML = cfg.nav(S);
      restBar();
      if (cfg.afterRender) cfg.afterRender(S, keepScroll);
    }
    function renderSheet() {
      if (!S.sheet) { if (!layer.querySelector('[data-reward]')) layer.innerHTML = ''; return; }
      const body = layer.querySelector('[data-sheet-body]'); const st = body ? body.scrollTop : 0;
      layer.innerHTML = cfg.sheets[S.sheet.type](S);
      const nb = layer.querySelector('[data-sheet-body]'); if (nb && S.sheet.keep) nb.scrollTop = st;
      S.sheet.keep = true;
      if (cfg.afterSheet) cfg.afterSheet(S);
    }
    function go(view, dir = 'fwd') {
      if (S.sheet) closeSheet();
      ui.prev = ui.view; ui.view = view; ui.dir = dir; ui.bubble = null;
      if (cfg.transition) cfg.transition(S, () => render()); else render();
    }
    function openSheet(s) { S.sheet = s; renderSheet(); }
    function closeSheet() { if (S.sheet) S.sheet.timerRunning = false; S.sheet = null; renderSheet(); }
    function showReward(r) { if (!r) return; layer.innerHTML = cfg.reward(r, S); if (cfg.afterReward) cfg.afterReward(r, S); }
    function closeReward() { layer.innerHTML = ''; render(true); }
    function toast(msg) {
      const t = document.createElement('div');
      t.className = cfg.toastClass || 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1900);
    }

    /* ---------- gym rest timer ---------- */
    function restBar() {
      let el = document.getElementById('restbar');
      if (!S.rest || ui.view !== 'gym' || !LT.state.gym.active || !cfg.restBar) { if (el) el.remove(); return; }
      const left = Math.max(0, Math.ceil((S.rest.end - Date.now()) / 1000));
      if (!el) { el = document.createElement('div'); el.id = 'restbar'; document.body.appendChild(el); }
      el.innerHTML = cfg.restBar(left, S);
      if (left === 0) { S.rest = null; el.remove(); toast('Rest done. Next set when ready.'); }
    }
    setInterval(() => {
      if (S.rest) restBar();
      const sh = S.sheet;
      if (sh && sh.type === 'violin' && sh.timerRunning) {
        sh.timerSec++;
        const t = document.getElementById('vtimer'); if (t) t.textContent = clock(sh.timerSec);
      }
      if (cfg.tick) cfg.tick(S);
    }, 1000);

    function startViolin() {
      const thu = D.dow(T) === 4;
      S.sheet = { type: 'violin', step: 1, typeId: thu ? 'lesson' : null, minutes: 30, items: [], split: {}, splitOn: false, notes: '', noteOpen: false, timer: false, timerRunning: false, timerSec: 0 };
      renderSheet();
    }
    const after = (view, r) => { closeSheet(); ui.view = view; render(); showReward(r); };

    /* ---------- actions ---------- */
    const A = {
      open: v => go(v), home: () => go('home', 'back'),
      go: (v, el) => { if (el && el.dataset.sec !== undefined) ui.taskSec = el.dataset.sec || null; go(v, el && el.dataset.dir); },
      poke: () => {
        const O = LT.overall(), st = LT.streak();
        const lines = cfg.pokeLines ? cfg.pokeLines(S) : [
          `${st.n}-day streak. Rest days count too.`, `${O.toNext} XP until Level ${O.level + 1}.`,
          `${LT.violin.weekTotal()} of ${LT.state.violin.target} violin minutes this week.`, 'Gym at 10:00, then the rest of the day is yours.',
        ];
        ui.bubble = lines[(ui.pokeN = ui.pokeN + 1) % lines.length];
        render(true);
        if (cfg.onPoke) cfg.onPoke(S);
      },
      quick: () => openSheet({ type: 'quick' }),
      ql: v => {
        if (v === 'violin') return startViolin();
        closeSheet();
        if (v === 'tasks') return openSheet({ type: 'task', title: '', section: null, priority: 'medium', due: '' });
        if (v === 'sports') return openSheet({ type: 'sport', sport: 'running', minutes: 40, km: 7, kind: 'Training', score: '', notes: '' });
        if (v === 'study') return openSheet({ type: 'study', subject: 'maths', minutes: 45, topic: '' });
        if (v === 'chess') return openSheet({ type: 'chess', kind: 'puzzles', minutes: 15, solved: 10, topic: '' });
        go(v);
      },
      close: () => closeSheet(),
      rclose: () => closeReward(),

      // violin: type → duration → pieces → save
      vlog: () => startViolin(),
      vtype: v => {
        const pre = { lesson: ['bruch', 'bach', 'gmin3'], orchestra: ['dvorak'], trio: ['elgar'], solo: [] };
        const mins = { lesson: 45, orchestra: 90, trio: 60, solo: 30 };
        Object.assign(S.sheet, { typeId: v, step: 2, items: pre[v].slice(), minutes: mins[v], keep: false, split: {}, splitOn: false });
        renderSheet();
      },
      vmin: (_, el) => { S.sheet.minutes = Math.max(5, S.sheet.minutes + +el.dataset.d); renderSheet(); },
      vset: v => { S.sheet.minutes = +v; renderSheet(); },
      vtimermode: () => { S.sheet.timer = !S.sheet.timer; S.sheet.timerRunning = false; renderSheet(); },
      vtimer: () => { S.sheet.timerRunning = !S.sheet.timerRunning; renderSheet(); },
      vtimerdone: () => { const f = S.sheet; f.minutes = Math.max(1, Math.ceil(f.timerSec / 60)); f.timer = false; f.timerRunning = false; renderSheet(); toast(`Timer: ${f.minutes} min`); },
      vnext: () => { S.sheet.step = 3; S.sheet.keep = false; S.sheet.timerRunning = false; renderSheet(); },
      vback: () => { S.sheet.step--; S.sheet.keep = false; renderSheet(); },
      vitem: v => { const f = S.sheet, i = f.items.indexOf(v); if (i >= 0) { f.items.splice(i, 1); delete f.split[v]; } else f.items.push(v); if (f.items.length < 2) f.splitOn = false; renderSheet(); },
      vsplitmode: () => {
        const f = S.sheet; if (f.items.length < 2) return;
        f.splitOn = !f.splitOn;
        if (f.splitOn && !Object.keys(f.split).length) { const each = Math.floor(f.minutes / f.items.length / 5) * 5; f.items.forEach(id => { f.split[id] = each; }); }
        renderSheet();
      },
      vsplit: (_, el) => { const f = S.sheet, id = el.dataset.v; f.split[id] = Math.max(0, (f.split[id] || 0) + 5 * +el.dataset.d); renderSheet(); },
      vnote: () => { S.sheet.noteOpen = true; renderSheet(); const t = document.getElementById('vnote'); if (t) t.focus(); },
      vsave: () => {
        const f = S.sheet;
        const split = f.splitOn ? Object.fromEntries(Object.entries(f.split).filter(([id, m]) => m > 0 && f.items.includes(id))) : null;
        after('violin', LT.violin.log({ type: f.typeId, minutes: f.minutes, items: f.items, split, notes: f.notes }));
      },

      // gym
      gstart: v => { LT.gym.start(v); render(); },
      gset: (_, el) => {
        const ei = +el.dataset.e, done = LT.gym.toggleSet(ei, +el.dataset.s);
        S.rest = done ? { end: Date.now() + LT.state.gym.active.exercises[ei].rest * 1000, total: LT.state.gym.active.exercises[ei].rest } : null;
        render(true);
      },
      gbump: (_, el) => { LT.gym.bump(+el.dataset.e, +el.dataset.s, el.dataset.f, +el.dataset.d); render(true); },
      gswap: v => openSheet({ type: 'swap', ei: +v }),
      gswapto: v => { LT.gym.swap(S.sheet.ei, v); closeSheet(); render(true); toast('Swapped for today'); },
      gadd: v => { LT.gym.addSet(+v); render(true); },
      grem: v => { LT.gym.removeSet(+v); render(true); },
      gcancel: () => { LT.gym.cancel(); S.rest = null; render(); toast('Session discarded'); },
      gfinish: () => openSheet({ type: 'finish', effort: null, soreness: null, pain: false, painNote: '' }),
      fin: (_, el) => { S.sheet[el.dataset.f] = +el.dataset.v; renderSheet(); },
      finpain: () => { S.sheet.pain = !S.sheet.pain; renderSheet(); },
      gdone: () => { const r = LT.gym.finish(S.sheet); S.rest = null; after('gym', r); },
      glift: v => { ui.gymLift = v; render(true); },
      rest30: () => { if (S.rest) S.rest.end += 30000; restBar(); },
      restskip: () => { S.rest = null; restBar(); },

      // sleep
      sadj: (_, el) => { ui.sleepDraft[el.dataset.f] = timeAdd(ui.sleepDraft[el.dataset.f], +el.dataset.d); render(true); },
      sscore: (_, el) => { const f = ui.sleepDraft; f.score = f.score == null ? 80 : Math.max(0, Math.min(100, f.score + +el.dataset.d)); render(true); },
      sleepsave: () => { const r = LT.sleep.log(ui.sleepDraft); render(true); showReward(r); },
      sleepedit: () => {
        const n = LT.state.sleep.nights.find(x => x.date === T);
        ui.sleepDraft = { bed: n.bed, wake: n.wake, score: n.score };
        LT.state.sleep.nights = LT.state.sleep.nights.filter(x => x.date !== T); LT.commit(); render(true);
      },
      ssched: (_, el) => { const k = el.dataset.k, f = el.dataset.f; LT.sleep.setSchedule(k, f, timeAdd(LT.state.sleep.schedule[k][f], 15 * +el.dataset.d)); render(true); },
      sremind: () => { LT.sleep.toggleReminders(); render(true); toast(LT.state.sleep.schedule.reminders ? 'Wind-down reminder on (simulated)' : 'Reminder off'); },

      // screen time
      scr: (_, el) => { ui.screenDraft.minutes = Math.max(0, ui.screenDraft.minutes + +el.dataset.d); render(true); },
      scrsave: () => { const r = LT.screen.log(ui.screenDraft.minutes); render(true); showReward(r); },
      scrtgt: (_, el) => { LT.screen.setTarget(Math.max(30, LT.state.screen.target + 15 * +el.dataset.d)); render(true); },

      // sports
      sport: v => { ui.sport = v; render(true); },
      slog: () => openSheet({ type: 'sport', sport: ui.sport === 'all' ? 'running' : ui.sport, minutes: ['volleyball', 'tennis'].includes(ui.sport) ? 90 : 40, km: ui.sport === 'swimming' ? 1.5 : ui.sport === 'cycling' ? 20 : 7, kind: 'Training', score: '', notes: '' }),
      ssport: v => { const f = S.sheet; f.sport = v; f.km = v === 'swimming' ? 1.5 : v === 'cycling' ? 20 : 7; f.minutes = ['volleyball', 'tennis'].includes(v) ? 90 : 40; renderSheet(); },
      smin: (_, el) => { S.sheet.minutes = Math.max(5, S.sheet.minutes + 5 * +el.dataset.d); renderSheet(); },
      skm: (_, el) => { const f = S.sheet, step = f.sport === 'swimming' ? 0.05 : f.sport === 'cycling' ? 1 : 0.2; f.km = Math.max(step, Math.round((f.km + step * +el.dataset.d) * 100) / 100); renderSheet(); },
      skind: v => { S.sheet.kind = v; renderSheet(); },
      ssave: () => {
        const f = S.sheet, end = ['running', 'cycling', 'swimming'].includes(f.sport);
        after('sports', LT.sports.log({ sport: f.sport, minutes: f.minutes, km: end ? f.km : undefined, kind: end ? undefined : f.kind, score: !end && f.kind === 'Match' ? f.score : undefined, notes: f.notes }));
      },

      // study
      subject: v => { ui.subject = v; render(true); },
      studylog: () => openSheet({ type: 'study', subject: ui.subject, minutes: 45, topic: '' }),
      stsub: v => { S.sheet.subject = v; renderSheet(); },
      stmin: (_, el) => { S.sheet.minutes = Math.max(5, S.sheet.minutes + 5 * +el.dataset.d); renderSheet(); },
      stsave: () => { const f = S.sheet; ui.subject = f.subject; after('study', LT.study.log({ subject: f.subject, minutes: f.minutes, topic: (f.topic || '').trim() || 'General revision' })); },

      // chess
      tc: v => { ui.tc = v; render(true); },
      chesslog: () => openSheet({ type: 'chess', kind: 'puzzles', minutes: 15, solved: 10, topic: '' }),
      chkind: v => { S.sheet.kind = v; renderSheet(); },
      chmin: (_, el) => { S.sheet.minutes = Math.max(5, S.sheet.minutes + 5 * +el.dataset.d); renderSheet(); },
      chsolved: (_, el) => { S.sheet.solved = Math.max(0, S.sheet.solved + +el.dataset.d); renderSheet(); },
      chsave: () => after('chess', LT.chess.log(S.sheet)),

      // calendar
      calf: v => { const i = ui.calFilter.indexOf(v); if (i >= 0) ui.calFilter.splice(i, 1); else ui.calFilter.push(v); render(true); },
      calfclear: () => { ui.calFilter = []; render(true); },
      calw: (_, el) => { ui.calWeek += +el.dataset.d; ui.calSel = D.addDays(D.weekStart(T), ui.calWeek * 7); render(true); },
      cald: v => { ui.calSel = v; const w = Math.floor(D.diffDays(D.weekStart(T), D.weekStart(v)) / 7); ui.calWeek = w; render(true); },
      calmode: v => { ui.calMode = v; render(true); },
      today: () => { ui.calWeek = 0; ui.calSel = T; render(true); },
      ev: v => { const o = LT.cal.find(v); if (o) openSheet({ type: 'ev', occ: o, date: o.date, start: o.start, scope: 'one' }); },
      rule: v => {
        const r = LT.state.cal.rules.find(x => x.id === v);
        const occ = LT.cal.occurrences(T, D.addDays(T, 21), { includeLogs: false, tasks: false }).find(o => o.ruleId === v && !o.cancelled);
        if (occ) openSheet({ type: 'ev', occ, date: occ.date, start: occ.start, scope: 'one' }); else toast(`${r.title} has no dates in the next 3 weeks`);
      },
      evd: (_, el) => { S.sheet.date = D.addDays(S.sheet.date, +el.dataset.d); renderSheet(); },
      evt: (_, el) => { S.sheet.start = timeAdd(S.sheet.start, 15 * +el.dataset.d); renderSheet(); },
      evscope: v => { S.sheet.scope = v; renderSheet(); },
      evsave: () => {
        const f = S.sheet, o = f.occ, len = o.start ? D.toMin(o.end) - D.toMin(o.start) : 0;
        LT.cal.reschedule(o, { date: f.date, start: f.start, end: o.start ? timeAdd(f.start, len) : o.end }, f.scope);
        closeSheet(); render(true);
        const c = LT.cal.conflicts(D.addDays(T, -7), D.addDays(T, 28)).length;
        toast(c ? `Saved. ${c} overlapping events still flagged.` : 'Saved. No overlaps left.');
      },
      evcancel: () => { LT.cal.cancel(S.sheet.occ, S.sheet.scope); closeSheet(); render(true); toast('Cancelled'); },
      evrestore: () => { LT.cal.restore(S.sheet.occ); closeSheet(); render(true); toast('Restored'); },
      addev: () => openSheet({ type: 'addev', title: '', section: 'violin', date: D.addDays(T, 1), start: '16:00' }),
      aesec: v => { S.sheet.section = v; renderSheet(); },
      aed: (_, el) => { S.sheet.date = D.addDays(S.sheet.date, +el.dataset.d); renderSheet(); },
      aet: (_, el) => { S.sheet.start = timeAdd(S.sheet.start, 15 * +el.dataset.d); renderSheet(); },
      aesave: () => {
        const f = S.sheet;
        if (!f.title.trim()) { toast('Add a title first'); return; }
        LT.cal.add({ title: f.title.trim(), section: f.section, date: f.date, start: f.start, end: timeAdd(f.start, 60) });
        ui.calSel = f.date; ui.calWeek = Math.floor(D.diffDays(D.weekStart(T), D.weekStart(f.date)) / 7);
        closeSheet(); render(true); toast('Event added');
      },

      // tasks
      task: v => { const r = LT.tasks.toggle(v); render(true); if (r) toast('+5 XP · task done'); },
      tw: v => { ui.taskWhen = v; render(true); },
      ts: v => { ui.taskSec = v || null; render(true); },
      addtask: () => openSheet({ type: 'task', title: '', section: ui.taskSec, priority: 'medium', due: '' }),
      tsec: v => { S.sheet.section = v || null; renderSheet(); },
      tpri: v => { S.sheet.priority = v; renderSheet(); },
      tdue: v => { S.sheet.due = v; renderSheet(); },
      tsave: () => {
        if (!S.sheet.title.trim()) { toast('Give the task a title'); return; }
        LT.tasks.add(S.sheet); closeSheet();
        if (ui.view !== 'tasks') go('tasks'); else render(true);
        toast('Task added');
      },

      // progress
      preview: () => showReward(LT.previewEvolution()),
      rest: () => { const r = LT.rest(); render(true); showReward(r); },
      reset: () => {
        if (ui.confirmReset) { LT.reset(); ui.confirmReset = false; ui.sleepDraft = null; ui.screenDraft = null; S.rest = null; go('home'); toast('Prototype data reset'); }
        else { ui.confirmReset = true; toast('Tap reset again to confirm'); setTimeout(() => { ui.confirmReset = false; }, 3000); }
      },
    };
    Object.assign(A, cfg.actions || {});

    document.addEventListener('click', e => {
      const el = e.target.closest('[data-a]');
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const fn = A[el.dataset.a];
      if (fn) { e.preventDefault(); fn(el.dataset.v, el, e); }
    });
    document.addEventListener('input', e => {
      const k = e.target.dataset && e.target.dataset.in;
      if (k && S.sheet) S.sheet[k] = e.target.value;
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (layer.querySelector('[data-reward]')) closeReward(); else if (S.sheet) closeSheet();
    });

    Object.assign(S, { render, renderSheet, go, openSheet, closeSheet, showReward, toast, A, startViolin });
    render();
    return S;
  };
})(window);
