/* LifeTracker prototype core.
   Shared sample data, illustrative progression rules and local state.
   All six design prototypes load this file so they compare the same data.
   Nothing here talks to a network: every "connected" source is sample data. */
(function (global) {
  'use strict';

  /* ---------- dates & formatting ---------- */
  const TODAY = '2026-10-24'; // Saturday — fixed so the sample week stays coherent
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const dow = s => parse(s).getDay();
  const weekStart = s => addDays(s, -((dow(s) + 6) % 7));
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fmt = {
    dur(min) {
      min = Math.round(min);
      if (min < 60) return `${min} min`;
      const h = Math.floor(min / 60), m = min % 60;
      return m ? `${h}h ${m}m` : `${h}h`;
    },
    hm(min) { min = Math.round(min); return `${Math.floor(min / 60)}h ${pad(min % 60)}m`; },
    date(s) { const d = parse(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; },
    short(s) { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; },
    long(s) { const d = parse(s); return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`; },
    day(s) { return DAYS[dow(s)]; },
    dayLong(s) { return DAYS_LONG[dow(s)]; },
    month(s) { const d = parse(s); return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`; },
    rel(s) {
      const n = diffDays(TODAY, s);
      if (n === 0) return 'Today';
      if (n === 1) return 'Tomorrow';
      if (n === -1) return 'Yesterday';
      if (n > 1 && n < 7) return `In ${n} days`;
      if (n < -1 && n > -7) return `${-n} days ago`;
      if (n >= 7) return `In ${Math.round(n / 7)} wk${Math.round(n / 7) > 1 ? 's' : ''}`;
      return fmt.short(s);
    },
    pace(min, km) { if (!km) return '—'; const s = Math.round(min * 60 / km); return `${Math.floor(s / 60)}:${pad(s % 60)} /km`; },
    speed(min, km) { if (!km) return '—'; return `${(km / (min / 60)).toFixed(1)} km/h`; },
    swim(min, km) { if (!km) return '—'; const s = Math.round(min * 60 / (km * 10)); return `${Math.floor(s / 60)}:${pad(s % 60)} /100 m`; },
    num(n) { return Number(n).toLocaleString('en-GB'); },
  };

  /* ---------- sections ---------- */
  const SECTIONS = [
    { id: 'violin', name: 'Violin', full: 'Violin', blurb: 'Practice journal' },
    { id: 'coding', name: 'Coding', full: 'Competitive coding', blurb: 'Road to IOI' },
    { id: 'sports', name: 'Sports', full: 'Sports', blurb: 'Run, ride, swim, court' },
    { id: 'gym', name: 'Gym', full: 'Gym', blurb: 'Workout sheet' },
    { id: 'study', name: 'Study', full: 'School studies', blurb: 'A-level subjects' },
    { id: 'chess', name: 'Chess', full: 'Chess', blurb: 'Ratings and games' },
    { id: 'sleep', name: 'Sleep', full: 'Sleep', blurb: 'Nightly timeline' },
    { id: 'screen', name: 'Screen time', full: 'Screen time', blurb: 'Daily totals' },
  ];
  const sectionById = id => SECTIONS.find(s => s.id === id);

  const LABELS = {
    sample: 'Sample data',
    xp: 'Illustrative XP values, not final balancing',
    dragon: 'Sample DragonCode data · not connected',
    garmin: 'Sample import · Garmin and Strava are not connected',
    chess: 'Fictional sample ratings · not fetched from Chess.com',
    google: 'Google Calendar is not connected in this prototype',
    school: 'School calendar is an optional reference · not imported',
    screen: 'Manual entry · a web app cannot read iPhone Screen Time',
    sleep: 'Manual entry · Garmin sleep import is not built',
    studyApp: 'Sample from your maths/physics app · link not built yet',
    gym: 'Placeholder template · not a personalised training or medical plan',
  };

  /* ---------- progression (illustrative) ---------- */
  const SECTION_STEP = n => 80 + 20 * n;   // XP from section level n to n+1
  const OVERALL_STEP = n => 200 + 60 * n;  // XP from overall level n to n+1
  function levelInfo(xp, step) {
    let level = 1, floor = 0;
    while (xp >= floor + step(level)) { floor += step(level); level++; }
    const need = step(level);
    return { level, xp, into: xp - floor, need, pct: (xp - floor) / need, toNext: floor + need - xp };
  }
  const STAGES = [
    { level: 1, key: 0, since: 'Sep 2025' },
    { level: 6, key: 1, since: 'Feb 2026' },
    { level: 16, key: 2, since: null },
    { level: 28, key: 3, since: null, eta: 'around late 2027' },
    { level: 45, key: 4, since: null, eta: 'around 2029' },
  ];
  const stageFor = level => { let s = 0; STAGES.forEach((st, i) => { if (level >= st.level) s = i; }); return s; };

  /* ---------- sample data builders ---------- */
  const VIOLIN_PIECES = [
    { id: 'bruch', kind: 'piece', title: 'Violin Concerto No. 1, I', composer: 'Bruch', status: 'Polishing', started: '2026-05-04' },
    { id: 'bach', kind: 'piece', title: 'Partita No. 2 — Allemanda', composer: 'J. S. Bach', status: 'Learning', started: '2026-08-20' },
    { id: 'elgar', kind: 'piece', title: "Salut d'Amour (trio arr.)", composer: 'Elgar', status: 'Learning', started: '2026-10-08', group: 'Trio' },
    { id: 'dvorak', kind: 'piece', title: 'Symphony No. 8 — 1st violin', composer: 'Dvořák', status: 'Rehearsing', started: '2026-09-10', group: 'Orchestra' },
    { id: 'gmin3', kind: 'scale', title: 'G melodic minor, 3 octaves' },
    { id: 'dmaj3', kind: 'scale', title: 'D major, 3 octaves' },
    { id: 'thirds', kind: 'scale', title: 'Thirds on G' },
    { id: 'bbarp', kind: 'scale', title: 'B♭ major arpeggio' },
  ];
  const VIOLIN_ARCHIVE = [
    { id: 'massenet', title: 'Méditation (Thaïs)', composer: 'Massenet', status: 'Performed', when: 'Jun 2026' },
    { id: 'kreisler', title: 'Praeludium and Allegro', composer: 'Kreisler', status: 'Shelved', when: 'Apr 2026' },
    { id: 'mozart3', title: 'Concerto No. 3, I', composer: 'Mozart', status: 'Performed', when: 'Dec 2025' },
  ];
  const PERFORMANCES = [
    { id: 'perf1', title: 'Chamber Evening', date: '2026-11-19', time: '19:00', venue: 'Drama Studio', pieces: ['elgar'], group: 'Trio' },
    { id: 'perf2', title: 'Winter Concert', date: '2026-12-03', time: '19:00', venue: 'Main Hall', pieces: ['dvorak'], group: 'Orchestra' },
    { id: 'perf0', title: 'Summer Recital', date: '2026-06-18', time: '18:30', venue: 'Main Hall', pieces: ['massenet'], past: true },
  ];

  function buildViolinSessions() {
    // [monday, solo sessions [dayOffset, minutes], hasOrchestra, trioSunday]
    const weeks = [
      ['2026-08-31', [[0, 35], [2, 40], [4, 30], [5, 45]], false, false],
      ['2026-09-07', [[1, 20], [5, 30]], true, false],
      ['2026-09-14', [[0, 30], [2, 45], [4, 35], [5, 40]], true, false],
      ['2026-09-21', [[0, 25], [1, 30], [5, 50], [6, 30]], true, false],
      ['2026-09-28', [[0, 40], [2, 35], [4, 30]], true, false],
      ['2026-10-05', [[0, 30], [2, 40], [5, 45]], true, true],
      ['2026-10-12', [[1, 35], [2, 30], [4, 25], [5, 40]], true, true],
      ['2026-10-19', [[0, 30], [2, 40], [4, 25]], true, false],
    ];
    const patterns = [['bruch', 'gmin3'], ['bach', 'dmaj3'], ['bruch', 'bach', 'thirds'], ['dvorak', 'bruch'], ['bach', 'gmin3', 'bbarp']];
    const lateExtra = ['elgar', 'gmin3'];
    const notes = ['Bars 34–40 at ♩ = 72. Third-octave intonation better.', 'Slow practice on the Allemanda — bowing distribution.', '', 'Shifting drill, then run-through.', '', 'Tired today; kept it short and slow.'];
    const out = [];
    let n = 0;
    weeks.forEach(([mon, solos, orch, trio]) => {
      solos.forEach(([off, min]) => {
        const date = addDays(mon, off);
        let items = patterns[n % patterns.length];
        if (date >= '2026-10-08' && n % 3 === 0) items = lateExtra;
        let split = null;
        if (min >= 40 && n % 2 === 0) {
          const first = Math.round(min * 0.5 / 5) * 5;
          split = {};
          split[items[0]] = first;
          const rest = items.slice(1);
          rest.forEach((id, i) => { split[id] = i === rest.length - 1 ? min - first - Object.values(split).slice(1).reduce((a, b) => a + b, 0) : Math.round((min - first) / rest.length / 5) * 5; });
        }
        out.push({ id: 'v' + (n + 1), date, type: 'solo', minutes: min, items: items.slice(), split, notes: notes[n % notes.length] });
        n++;
      });
      const thu = addDays(mon, 3);
      out.push({ id: 'vl' + mon, date: thu, type: 'lesson', minutes: 45, items: ['bruch', 'bach', 'gmin3'], split: null, notes: mon === '2026-10-19' ? 'Shift in bar 37 lands sharp — practise slowly with a drone. Start Allemanda dynamics.' : '' });
      if (orch) out.push({ id: 'vo' + mon, date: thu, type: 'orchestra', minutes: 90, items: ['dvorak'], split: null, notes: mon === '2026-10-19' ? 'Sectional: mvt I bowings marked up to letter F.' : '' });
      if (trio) out.push({ id: 'vt' + mon, date: addDays(mon, 6), type: 'trio', minutes: 60, items: ['elgar'], split: null, notes: 'Balance with cello in the middle section.' });
    });
    // explicit detail for the Wednesday of this week
    const wed = out.find(s => s.date === '2026-10-21' && s.type === 'solo');
    if (wed) { wed.items = ['bruch', 'gmin3', 'bach']; wed.split = { bruch: 20, gmin3: 10, bach: 10 }; wed.notes = 'Bars 34–40 at ♩ = 72. Third-octave intonation better.'; }
    return out.sort((a, b) => a.date < b.date ? 1 : -1);
  }

  const GYM_TEMPLATES = {
    upperA: {
      id: 'upperA', name: 'Upper A', focus: 'Push and pull', estimate: 70, exercises: [
        { name: 'Bench press', sets: 4, reps: 6, weight: 50, rest: 120, alts: ['Dumbbell bench press', 'Machine chest press', 'Weighted push-up'] },
        { name: 'One-arm dumbbell row', sets: 3, reps: 10, weight: 22, rest: 90, alts: ['Seated cable row', 'Chest-supported row'] },
        { name: 'Overhead press', sets: 3, reps: 8, weight: 30, rest: 90, alts: ['Seated dumbbell press', 'Landmine press'] },
        { name: 'Lat pulldown', sets: 3, reps: 10, weight: 45, rest: 75, alts: ['Assisted pull-up', 'Chin-up'] },
        { name: 'Face pull', sets: 3, reps: 15, weight: 15, rest: 60, alts: ['Band pull-apart', 'Reverse fly'] },
        { name: 'Plank', sets: 3, reps: 40, unit: 's', weight: 0, rest: 45, alts: ['Dead bug', 'Side plank'] },
      ],
    },
    lowerA: {
      id: 'lowerA', name: 'Lower A', focus: 'Legs and trunk', estimate: 65, exercises: [
        { name: 'Goblet squat', sets: 3, reps: 8, weight: 24, rest: 120, alts: ['Leg press', 'Box squat'] },
        { name: 'Romanian deadlift', sets: 3, reps: 8, weight: 50, rest: 120, alts: ['Single-leg RDL', 'Cable pull-through'] },
        { name: 'Bulgarian split squat', sets: 3, reps: 10, weight: 12, rest: 90, alts: ['Reverse lunge', 'Step-up'] },
        { name: 'Hip thrust', sets: 3, reps: 10, weight: 60, rest: 90, alts: ['Glute bridge', 'Back extension'] },
        { name: 'Tibialis raise', sets: 2, reps: 15, weight: 0, rest: 45, alts: ['Toe walks', 'Banded dorsiflexion'] },
        { name: 'Dead bug', sets: 3, reps: 10, weight: 0, rest: 45, alts: ['Bird dog', 'Hollow hold'] },
      ],
    },
    full: {
      id: 'full', name: 'Full body', focus: 'Strength mix', estimate: 75, exercises: [
        { name: 'Trap-bar deadlift', sets: 3, reps: 5, weight: 80, rest: 150, alts: ['Romanian deadlift', 'Kettlebell deadlift'] },
        { name: 'Incline dumbbell press', sets: 3, reps: 10, weight: 18, rest: 90, alts: ['Push-up', 'Machine incline press'] },
        { name: 'Chin-up', sets: 3, reps: 6, weight: 0, rest: 120, alts: ['Lat pulldown', 'Inverted row'] },
        { name: 'Split squat', sets: 3, reps: 8, weight: 10, rest: 90, alts: ['Goblet squat', 'Step-up'] },
        { name: 'Pallof press', sets: 3, reps: 12, weight: 10, rest: 45, alts: ['Side plank', 'Suitcase carry'] },
      ],
    },
  };

  const GYM_HISTORY = [
    { date: '2026-10-21', template: 'upperA', minutes: 72, sets: 19, effort: 7, soreness: 2, top: { 'Bench press': 50, 'Overhead press': 30 } },
    { date: '2026-10-17', template: 'lowerA', minutes: 64, sets: 17, effort: 7, soreness: 3, top: { 'Goblet squat': 22, 'Romanian deadlift': 50 } },
    { date: '2026-10-14', template: 'upperA', minutes: 70, sets: 19, effort: 8, soreness: 2, top: { 'Bench press': 50, 'Overhead press': 27.5 } },
    { date: '2026-10-07', template: 'full', minutes: 78, sets: 15, effort: 7, soreness: 3, top: { 'Trap-bar deadlift': 75 } },
    { date: '2026-10-03', template: 'lowerA', minutes: 61, sets: 17, effort: 6, soreness: 2, top: { 'Goblet squat': 20, 'Romanian deadlift': 45 } },
    { date: '2026-09-30', template: 'upperA', minutes: 68, sets: 18, effort: 7, soreness: 1, top: { 'Bench press': 47.5, 'Overhead press': 27.5 } },
    { date: '2026-09-23', template: 'upperA', minutes: 74, sets: 19, effort: 8, soreness: 2, top: { 'Bench press': 45, 'Overhead press': 25 } },
    { date: '2026-09-19', template: 'lowerA', minutes: 60, sets: 16, effort: 6, soreness: 4, top: { 'Goblet squat': 18, 'Romanian deadlift': 45 } },
    { date: '2026-09-09', template: 'upperA', minutes: 66, sets: 18, effort: 7, soreness: 2, top: { 'Bench press': 42.5, 'Overhead press': 25 } },
  ];

  const SLEEP_NIGHTS = [
    ['2026-10-10', '23:40', '08:15', 82], ['2026-10-11', '23:55', '08:30', null], ['2026-10-12', '22:50', '06:30', 78],
    ['2026-10-13', '23:10', '06:00', 71], ['2026-10-14', '22:40', '06:30', 85], ['2026-10-15', '23:25', '06:00', 66],
    ['2026-10-16', '22:55', '06:30', 79], ['2026-10-17', '00:10', '08:40', 74], ['2026-10-18', '23:30', '08:05', 83],
    ['2026-10-19', '22:45', '06:30', 86], ['2026-10-20', '23:05', '06:00', 72], ['2026-10-21', '22:35', '06:30', 88],
    ['2026-10-22', '23:15', '06:00', 70], ['2026-10-23', '22:50', '06:30', 81],
  ].map(([date, bed, wake, score]) => ({ date, bed, wake, score }));

  const SCREEN_DAYS = [
    ['2026-10-10', 262], ['2026-10-11', 298], ['2026-10-12', 205], ['2026-10-13', 188], ['2026-10-14', 214],
    ['2026-10-15', 196], ['2026-10-16', 231], ['2026-10-17', 305], ['2026-10-18', 276], ['2026-10-19', 190],
    ['2026-10-20', 175], ['2026-10-21', 202], ['2026-10-22', 207], ['2026-10-23', 198],
  ].map(([date, minutes]) => ({ date, minutes }));

  const SPORTS_LOG = [
    { id: 's1', date: '2026-10-23', sport: 'volleyball', minutes: 90, kind: 'Training', notes: 'Serve receive; float serve 7/10 in.' },
    { id: 's2', date: '2026-10-22', sport: 'running', minutes: 41, km: 7.4, route: 'Botanic Gardens loop', source: 'sample-import' },
    { id: 's3', date: '2026-10-20', sport: 'volleyball', minutes: 60, kind: 'Training', notes: 'Morning: footwork and blocking.' },
    { id: 's4', date: '2026-10-19', sport: 'volleyball', minutes: 90, kind: 'Training', notes: '' },
    { id: 's5', date: '2026-10-18', sport: 'running', minutes: 63, km: 11.2, route: 'East Coast Park', source: 'sample-import' },
    { id: 's6', date: '2026-10-17', sport: 'tennis', minutes: 75, kind: 'Match', score: '6–4, 3–6, 10–7', notes: 'Backhand return more consistent.' },
    { id: 's7', date: '2026-10-16', sport: 'volleyball', minutes: 90, kind: 'Training', notes: '' },
    { id: 's8', date: '2026-10-14', sport: 'swimming', minutes: 34, km: 1.5, source: 'sample-import' },
    { id: 's9', date: '2026-10-13', sport: 'volleyball', minutes: 60, kind: 'Training', notes: '' },
    { id: 's10', date: '2026-10-11', sport: 'cycling', minutes: 62, km: 24.5, route: 'Southern Ridges', source: 'sample-import' },
    { id: 's11', date: '2026-10-10', sport: 'running', minutes: 52, km: 9.0, route: 'MacRitchie trails', source: 'sample-import' },
    { id: 's12', date: '2026-10-09', sport: 'tennis', minutes: 60, kind: 'Training', notes: 'Serve toss drills.' },
  ];
  const SPORTS = {
    running: { name: 'Running', metric: 'pace' },
    cycling: { name: 'Cycling', metric: 'speed' },
    swimming: { name: 'Swimming', metric: 'swim' },
    volleyball: { name: 'Volleyball', metric: 'court' },
    tennis: { name: 'Tennis', metric: 'court' },
  };
  const PBS = [
    { sport: 'running', label: '5 km', value: '23:41', date: '2026-02-14' },
    { sport: 'running', label: '10 km', value: '49:58', date: '2026-01-25' },
    { sport: 'running', label: 'Half marathon', value: '1:58:12', date: '2026-03-08', note: 'Sub-2 goal met' },
    { sport: 'swimming', label: '1.5 km', value: '32:40', date: '2026-08-30' },
    { sport: 'cycling', label: '40 km', value: '1:31:05', date: '2026-07-12' },
  ];
  const SPORTS_WEEKS = [
    { week: '2026-08-31', run: 95, ride: 0, swim: 30, court: 150 }, { week: '2026-09-07', run: 110, ride: 60, swim: 0, court: 240 },
    { week: '2026-09-14', run: 80, ride: 0, swim: 35, court: 300 }, { week: '2026-09-21', run: 120, ride: 55, swim: 0, court: 300 },
    { week: '2026-09-28', run: 90, ride: 0, swim: 30, court: 270 }, { week: '2026-10-05', run: 104, ride: 62, swim: 0, court: 210 },
    { week: '2026-10-12', run: 115, ride: 0, swim: 34, court: 285 }, { week: '2026-10-19', run: 41, ride: 0, swim: 0, court: 240 },
  ];

  const STUDY = {
    subjects: [
      { id: 'maths', name: 'Maths', week: [210, 185, 240, 200, 225, 150], hard: ['Integration by parts — choosing u', 'Parametric differentiation'], topics: ['Integration by substitution', 'Binomial expansion (negative n)', 'Vectors in 3D'], marks: [{ title: 'Pure test 2', score: 87, date: '2026-10-09' }, { title: 'Stats quiz', score: 92, date: '2026-09-25' }] },
      { id: 'fm', name: 'Further Maths', week: [180, 200, 160, 220, 190, 140], hard: ['Complex loci', 'Proof by induction (divisibility)'], topics: ['Argand diagrams', 'Roots of polynomials', 'Matrices — transformations'], marks: [{ title: 'Core Pure test 1', score: 74, date: '2026-10-02' }, { title: 'Matrices quiz', score: 81, date: '2026-09-18' }] },
      { id: 'physics', name: 'Physics', week: [150, 170, 140, 190, 160, 120], hard: ['Circular motion — banked tracks'], topics: ['Simple harmonic motion', 'Momentum and impulse', 'Circular motion'], marks: [{ title: 'Mechanics test', score: 81, date: '2026-10-07' }, { title: 'Practical endorsement 4', score: 100, date: '2026-09-29', note: 'Pass' }] },
      { id: 'cs', name: 'Computer Science', week: [120, 140, 110, 150, 135, 95], hard: ['Recursion complexity', 'Floating-point representation'], topics: ['Big-O notation', 'Binary trees', 'Two’s complement'], marks: [{ title: 'Paper 1 practice', score: 92, date: '2026-10-12' }, { title: 'Data representation quiz', score: 78, date: '2026-09-21' }] },
    ],
    weeks: ['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19'],
    log: [
      { id: 'st1', date: '2026-10-23', subject: 'fm', minutes: 50, topic: 'Complex loci — circles and half-lines' },
      { id: 'st2', date: '2026-10-23', subject: 'physics', minutes: 35, topic: 'SHM graphs', source: 'sample-link' },
      { id: 'st3', date: '2026-10-22', subject: 'maths', minutes: 45, topic: 'Integration by parts', source: 'sample-link' },
      { id: 'st4', date: '2026-10-21', subject: 'cs', minutes: 40, topic: 'Binary tree traversal' },
      { id: 'st5', date: '2026-10-20', subject: 'maths', minutes: 30, topic: 'Vectors in 3D' },
      { id: 'st6', date: '2026-10-19', subject: 'fm', minutes: 55, topic: 'Roots of polynomials' },
    ],
    exams: [
      { id: 'e1', subject: 'physics', title: 'Physics unit test — Oscillations', date: '2026-11-05' },
      { id: 'e2', subject: 'maths', title: 'Maths mock — Pure 1', date: '2026-11-12' },
      { id: 'e3', subject: 'fm', title: 'Further Maths test — Complex numbers', date: '2026-11-18' },
      { id: 'e4', subject: 'cs', title: 'CS mock — Paper 1', date: '2026-11-26' },
    ],
  };

  const CHESS = {
    tcs: [
      { id: 'rapid', name: 'Rapid', rating: 1642, best: 1688, hist: [1588, 1596, 1610, 1604, 1621, 1630, 1618, 1644, 1652, 1638, 1649, 1642] },
      { id: 'blitz', name: 'Blitz', rating: 1518, best: 1561, hist: [1540, 1532, 1525, 1547, 1530, 1512, 1504, 1521, 1529, 1515, 1509, 1518] },
      { id: 'bullet', name: 'Bullet', rating: 1390, best: 1442, hist: [1410, 1402, 1388, 1420, 1395, 1380, 1376, 1391, 1404, 1385, 1379, 1390] },
      { id: 'daily', name: 'Daily', rating: 1720, best: 1720, hist: [1650, 1655, 1661, 1670, 1668, 1680, 1688, 1695, 1702, 1710, 1714, 1720] },
    ],
    puzzle: { rating: 2105, best: 2140 },
    games: [
      { date: '2026-10-23', tc: 'rapid', clock: '10+0', color: 'white', opp: 'harbourknight', oppRating: 1655, result: 'win', opening: 'Italian Game', moves: 38, mins: 17 },
      { date: '2026-10-23', tc: 'blitz', clock: '3+2', color: 'black', opp: 'quietpawn_22', oppRating: 1530, result: 'loss', opening: 'Caro-Kann', moves: 41, mins: 8 },
      { date: '2026-10-22', tc: 'rapid', clock: '10+0', color: 'black', opp: 'lionrock_sg', oppRating: 1612, result: 'draw', opening: 'Caro-Kann', moves: 56, mins: 19 },
      { date: '2026-10-21', tc: 'daily', clock: '1 day', color: 'white', opp: 'endgame_owl', oppRating: 1702, result: 'win', opening: 'Queen’s Gambit Declined', moves: 47, mins: 22 },
      { date: '2026-10-20', tc: 'rapid', clock: '15+10', color: 'white', opp: 'mangosteen64', oppRating: 1670, result: 'loss', opening: 'Italian Game', moves: 33, mins: 24 },
      { date: '2026-10-19', tc: 'blitz', clock: '5+0', color: 'white', opp: 'flagfall_7', oppRating: 1496, result: 'win', opening: 'London System', moves: 29, mins: 7 },
    ],
    weekMinutes: [40, 25, 0, 55, 30, 45, 0], // Mon..Sun of the current week (sample)
    puzzles: [{ date: '2026-10-23', solved: 14, minutes: 15 }, { date: '2026-10-21', solved: 9, minutes: 12 }, { date: '2026-10-19', solved: 11, minutes: 15 }],
    study: [{ date: '2026-10-22', topic: 'Rook endgames — Lucena position', minutes: 25 }, { date: '2026-10-18', topic: 'Caro-Kann Advance — plans', minutes: 30 }],
  };

  const CODING = {
    dragonUrl: 'https://dragon-academy-sigma.vercel.app/',
    repoUrl: 'https://github.com/TaskEbi/DragonCode',
    rating: { label: 'Contest rating', value: 1487, peak: 1532, hist: [1312, 1340, 1335, 1381, 1402, 1398, 1436, 1450, 1471, 1458, 1490, 1487] },
    solved: 412, solvedWeek: 9, minutesWeek: 310,
    focus: 'Graphs — shortest paths and DSU',
    plan: [{ label: 'Dijkstra variants', done: 5, total: 8 }, { label: 'DSU with rollback', done: 2, total: 6 }, { label: 'Virtual contest (Div. 2)', done: 1, total: 2 }],
    road: [
      { label: 'USACO Bronze', status: 'done', when: 'Dec 2025' },
      { label: 'USACO Silver', status: 'done', when: 'Feb 2026' },
      { label: 'Contest rating 1400', status: 'done', when: 'Jul 2026' },
      { label: 'USACO Gold', status: 'current', when: 'Target Jan 2027' },
      { label: 'Contest rating 1700', status: 'next', when: '' },
      { label: 'National olympiad selection', status: 'next', when: '' },
      { label: 'IOI', status: 'goal', when: '' },
    ],
    days: [45, 60, 0, 30, 75, 40, 0, 50, 35, 0, 60, 45, 30, 0, 55, 40, 65, 0, 30, 45, 50, 0, 40, 70, 35, 45, 0, 0], // last 28 days, ending today
    recent: [
      { date: '2026-10-22', title: 'Virtual contest — Div. 2', note: 'Solved A–C; D upsolve pending' },
      { date: '2026-10-20', title: 'Problem set: Dijkstra variants', note: '3 solved' },
      { date: '2026-10-18', title: 'USACO Gold practice — Feb 2024', note: '1 of 3' },
    ],
  };

  const TASKS = [
    { id: 't1', title: 'Further Maths problem sheet 6', section: 'study', subject: 'fm', priority: 'high', due: '2026-10-26', done: false },
    { id: 't2', title: 'Physics practical write-up (SHM)', section: 'study', subject: 'physics', priority: 'medium', due: '2026-10-28', done: false },
    { id: 't3', title: 'Confirm trio rehearsal time', section: 'violin', priority: 'medium', due: '2026-10-25', done: false },
    { id: 't4', title: 'Mark bowings in Dvořák part', section: 'violin', priority: 'low', due: '2026-10-29', done: false },
    { id: 't5', title: 'Upsolve contest problem D', section: 'coding', priority: 'medium', due: '2026-10-27', done: false },
    { id: 't6', title: 'Replace running shoes (about 600 km)', section: 'sports', priority: 'low', due: null, done: false },
    { id: 't7', title: 'Review CS mock corrections', section: 'study', subject: 'cs', priority: 'high', due: '2026-10-30', done: false },
    { id: 't8', title: 'Pack gym bag', section: 'gym', priority: 'low', due: '2026-10-24', done: true },
    { id: 't9', title: 'Analyse last rapid loss', section: 'chess', priority: 'low', due: null, done: false },
    { id: 't10', title: 'Set phone downtime for 22:30', section: 'screen', priority: 'medium', due: '2026-10-22', done: true },
    { id: 't11', title: 'Email form tutor about mock dates', section: null, priority: 'medium', due: '2026-10-24', done: false },
  ];

  const CAL_RULES = [
    { id: 'r-lesson', title: 'Violin lesson', section: 'violin', kind: 'session', match: 'lesson', days: [4], start: '16:00', end: '16:45', from: '2026-09-03', until: null, exceptions: {} },
    { id: 'r-orch', title: 'Orchestra', section: 'violin', kind: 'session', match: 'orchestra', days: [4], start: '17:15', end: '18:45', from: '2026-09-10', until: null, exceptions: {} },
    { id: 'r-trio', title: 'Trio practice', section: 'violin', kind: 'session', match: 'trio', days: [0], start: '15:00', end: '16:00', from: '2026-10-11', until: null, exceptions: { '2026-10-25': { start: '16:00', end: '17:00' } } },
    { id: 'r-vb-am', title: 'Volleyball (morning)', section: 'sports', kind: 'session', match: 'volleyball', days: [2, 4], start: '07:00', end: '08:00', from: '2026-09-01', until: '2026-11-27', exceptions: { '2026-10-27': { cancelled: true, note: 'Coach away' } } },
    { id: 'r-vb-pm', title: 'Volleyball (after school)', section: 'sports', kind: 'session', match: 'volleyball', days: [1, 5], start: '15:30', end: '17:00', from: '2026-09-01', until: '2026-11-27', exceptions: {} },
    { id: 'r-vb-post', title: 'Volleyball (off-season)', section: 'sports', kind: 'session', match: 'volleyball', days: [3], start: '15:30', end: '17:00', from: '2026-11-30', until: null, exceptions: {} },
  ];
  const CAL_SINGLES = [
    { id: 'c-gym1', title: 'Gym — Upper A', section: 'gym', kind: 'session', match: 'gym', date: '2026-10-21', start: '16:00', end: '17:15' },
    { id: 'c-gym2', title: 'Gym — Lower A', section: 'gym', kind: 'session', match: 'gym', date: '2026-10-24', start: '10:00', end: '11:10' },
    { id: 'c-run1', title: 'Easy run · 7 km', section: 'sports', kind: 'session', match: 'running', date: '2026-10-25', start: '07:30', end: '08:15' },
    { id: 'c-gym3', title: 'Gym — Upper A', section: 'gym', kind: 'session', match: 'gym', date: '2026-10-28', start: '16:00', end: '17:15' },
    { id: 'c-tennis', title: 'Tennis friendly', section: 'sports', kind: 'competition', date: '2026-10-29', start: '16:30', end: '17:30' },
    { id: 'c-gym4', title: 'Gym — Full body', section: 'gym', kind: 'session', match: 'gym', date: '2026-10-31', start: '10:00', end: '11:15' },
    { id: 'c-cf', title: 'Online contest (Div. 2)', section: 'coding', kind: 'competition', date: '2026-11-01', start: '19:35', end: '21:35' },
    { id: 'c-ex1', title: 'Physics unit test', section: 'study', kind: 'exam', date: '2026-11-05', start: '09:00', end: '10:00' },
    { id: 'c-ex2', title: 'Maths mock — Pure 1', section: 'study', kind: 'exam', date: '2026-11-12', start: '09:00', end: '11:00' },
    { id: 'c-vbt', title: 'Volleyball tournament (away)', section: 'sports', kind: 'competition', date: '2026-11-14', start: null, end: null },
    { id: 'c-ex3', title: 'Further Maths test', section: 'study', kind: 'exam', date: '2026-11-18', start: '11:00', end: '12:00' },
    { id: 'c-perf1', title: 'Chamber Evening', section: 'violin', kind: 'performance', date: '2026-11-19', start: '19:00', end: '20:30' },
    { id: 'c-ex4', title: 'CS mock — Paper 1', section: 'study', kind: 'exam', date: '2026-11-26', start: '09:00', end: '11:30' },
    { id: 'c-perf2', title: 'Winter Concert', section: 'violin', kind: 'performance', date: '2026-12-03', start: '19:00', end: '21:00' },
    { id: 'c-school1', title: 'Parent–teacher meetings (early finish)', section: null, kind: 'school', date: '2026-11-04', start: null, end: null },
  ];

  const ACHIEVEMENTS = [
    { id: 'first', title: 'First Entry', desc: 'Logged your first activity', fixed: '2025-09-02' },
    { id: 'thursday', title: 'Thursday Regular', desc: 'Lesson and orchestra on 6 Thursdays', goal: 6, calc: s => new Set(s.violin.sessions.filter(x => x.type === 'orchestra').map(x => x.date)).size },
    { id: 'target5', title: 'Five at Target', desc: 'Violin weekly target 5 weeks running', goal: 5, calc: s => violinStreak(s) },
    { id: 'target8', title: 'Eight at Target', desc: 'Violin weekly target 8 weeks running', goal: 8, calc: s => violinStreak(s) },
    { id: 'sub2', title: 'Sub-2', desc: 'Half marathon under 2 hours', fixed: '2026-03-08' },
    { id: 'rested', title: 'Well Rested', desc: '7 nights in a row within 30 min of your bedtime', goal: 7, calc: s => sleepStreak(s) },
    { id: 'iron', title: 'Iron Habit', desc: '12 gym sessions logged', goal: 12, calc: s => s.gym.history.length },
    { id: 'rest', title: 'Rest Counts', desc: '4 planned rest days in a month', goal: 4, calc: s => s.restDays.filter(d => d >= addDays(TODAY, -30)).length },
    { id: 'club400', title: '400 Club', desc: '400 problems solved (DragonCode sample)', fixed: '2026-10-11' },
    { id: 'balanced', title: 'Balanced Week', desc: 'Activity in 5 sections in one week', fixed: '2026-09-27' },
    { id: 'scales', title: 'Scale Ladder', desc: 'Scales practised in 20 sessions', goal: 20, calc: s => s.violin.sessions.filter(x => x.items.some(i => (VIOLIN_PIECES.find(p => p.id === i) || {}).kind === 'scale')).length },
    { id: 'screen7', title: 'Screen Smart', desc: '7 days in a row under your screen-time target', goal: 7, calc: s => screenStreak(s) },
  ];

  /* ---------- state ---------- */
  function freshState() {
    return {
      v: 3,
      xp: { violin: 1600, coding: 2130, sports: 1250, gym: 590, study: 2380, chess: 960, sleep: 760, screen: 430, bonus: 0 },
      xpLog: [],
      overallStreak: 23, activeToday: false, restToday: false, restDays: ['2026-10-04', '2026-10-11'],
      ach: { first: '2025-09-02', thursday: '2026-10-15', target5: '2026-10-18', sub2: '2026-03-08', club400: '2026-10-11', balanced: '2026-09-27', scales: '2026-10-21' },
      stagesSeen: 1,
      violin: { sessions: buildViolinSessions(), target: 240 },
      gym: { history: GYM_HISTORY.slice(), active: null, weekTarget: 2, streak: 3, plan: [
        { date: '2026-10-21', template: 'upperA' }, { date: '2026-10-24', template: 'lowerA' }, { date: '2026-10-28', template: 'upperA' }, { date: '2026-10-31', template: 'full' },
      ] },
      sleep: { nights: SLEEP_NIGHTS.slice(), schedule: { weekday: { bed: '22:45', wake: '06:30' }, weekend: { bed: '23:30', wake: '08:00' }, early: { days: 'Tue & Thu', wake: '06:00', why: 'Morning volleyball (busy season)' }, windDown: 30, reminders: true } },
      screen: { days: SCREEN_DAYS.slice(), target: 210 },
      sports: { log: SPORTS_LOG.slice() },
      study: { log: STUDY.log.slice() },
      chess: { puzzles: CHESS.puzzles.slice(), study: CHESS.study.slice() },
      tasks: TASKS.map(t => ({ ...t })),
      cal: { rules: JSON.parse(JSON.stringify(CAL_RULES)), singles: JSON.parse(JSON.stringify(CAL_SINGLES)) },
      streaks: { coding: 12, sports: 4, study: 9, chess: 2 },
    };
  }

  let storeKey = 'lifetracker-proto';
  let state = freshState();
  const listeners = [];
  function save() { try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep in memory */ } }
  function load() {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === state.v) state = s; }
    } catch (e) { /* ignore */ }
  }
  function commit() { save(); listeners.forEach(fn => fn(state)); }

  /* ---------- derived values ---------- */
  function violinWeekTotal(s, mon) {
    const end = addDays(mon, 7);
    return s.violin.sessions.filter(x => x.date >= mon && x.date < end).reduce((a, x) => a + x.minutes, 0);
  }
  function violinStreak(s) {
    let n = 0, wk = addDays(weekStart(TODAY), -7);
    while (violinWeekTotal(s, wk) >= s.violin.target) { n++; wk = addDays(wk, -7); }
    if (violinWeekTotal(s, weekStart(TODAY)) >= s.violin.target) n++;
    return n;
  }
  function bedDelta(night, sched) {
    const isWeekend = [0, 6].includes(dow(night.date));
    const target = toMin((isWeekend ? sched.weekend : sched.weekday).bed);
    const norm = m => (m < 720 ? m + 1440 : m);
    return norm(toMin(night.bed)) - norm(target);
  }
  function sleepDuration(n) { let d = toMin(n.wake) - toMin(n.bed); if (d <= 0) d += 1440; return d; }
  function sleepStreak(s) {
    const nights = s.sleep.nights.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    let n = 0, expect = nights[0] && nights[0].date;
    for (const x of nights) {
      if (x.date !== expect || Math.abs(bedDelta(x, s.sleep.schedule)) > 30) break;
      n++; expect = addDays(expect, -1);
    }
    return n;
  }
  function screenStreak(s) {
    const days = s.screen.days.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    let n = 0, expect = days[0] && days[0].date;
    for (const x of days) { if (x.date !== expect || x.minutes > s.screen.target) break; n++; expect = addDays(expect, -1); }
    return n;
  }
  function gymWeekCount(s) { const mon = weekStart(TODAY); return s.gym.history.filter(h => h.date >= mon).length; }

  function totalXP(s) { return Object.values(s.xp).reduce((a, b) => a + b, 0); }

  /* ---------- rewards ---------- */
  function award(lines) {
    const beforeOverall = levelInfo(totalXP(state), OVERALL_STEP).level;
    const sectionUps = [];
    lines.forEach(l => {
      const key = l.section || 'bonus';
      const before = key === 'bonus' ? null : levelInfo(state.xp[key], SECTION_STEP).level;
      state.xp[key] += l.xp;
      state.xpLog.unshift({ date: TODAY, section: key, xp: l.xp, reason: l.reason });
      if (before !== null) {
        const after = levelInfo(state.xp[key], SECTION_STEP).level;
        if (after > before && !sectionUps.find(u => u.section === key)) sectionUps.push({ section: key, name: sectionById(key).name, from: before, to: after });
      }
    });
    const afterOverall = levelInfo(totalXP(state), OVERALL_STEP).level;
    const overallUp = afterOverall > beforeOverall ? { from: beforeOverall, to: afterOverall } : null;
    const evolved = overallUp && stageFor(afterOverall) > stageFor(beforeOverall) ? { from: stageFor(beforeOverall), to: stageFor(afterOverall) } : null;
    const streakBefore = state.overallStreak;
    if (!state.activeToday) { state.activeToday = true; state.overallStreak += 1; }
    const unlocked = checkAchievements();
    return { lines, total: lines.reduce((a, l) => a + l.xp, 0), sectionUps, overallUp, evolved, unlocked, streak: state.overallStreak, streakUp: state.overallStreak > streakBefore };
  }
  function checkAchievements() {
    const out = [];
    ACHIEVEMENTS.forEach(a => {
      if (a.calc && !state.ach[a.id] && a.calc(state) >= a.goal) { state.ach[a.id] = TODAY; out.push(a); }
    });
    return out;
  }

  /* ---------- actions ---------- */
  const uid = p => p + Math.random().toString(36).slice(2, 8);

  const violin = {
    TYPES: [
      { id: 'solo', name: 'Solo practice' }, { id: 'lesson', name: 'Lesson' },
      { id: 'orchestra', name: 'Orchestra' }, { id: 'trio', name: 'Trio practice' },
    ],
    pieces: VIOLIN_PIECES, archive: VIOLIN_ARCHIVE, performances: PERFORMANCES,
    item: id => VIOLIN_PIECES.find(p => p.id === id),
    log({ type, minutes, items, split, notes, date }) {
      date = date || TODAY;
      const mon = weekStart(date);
      const before = violinWeekTotal(state, mon);
      const cleanSplit = split && Object.keys(split).length ? split : null;
      const session = { id: uid('v'), date, type, minutes, items: items.slice(), split: cleanSplit, notes: notes || '', fresh: true };
      state.violin.sessions.forEach(s => delete s.fresh);
      state.violin.sessions.unshift(session);
      const lines = [
        { section: 'violin', xp: Math.min(Math.round(minutes / 2), 45), reason: `${fmt.dur(minutes)} of ${violin.typeName(type).toLowerCase()}` },
        { section: 'violin', xp: 10, reason: 'Session logged' },
      ];
      const after = before + minutes;
      if (before < state.violin.target && after >= state.violin.target) lines.push({ section: 'violin', xp: 30, reason: 'Weekly target reached' });
      const r = award(lines);
      r.session = session;
      commit();
      return r;
    },
    typeName: id => (violin.TYPES.find(t => t.id === id) || {}).name || id,
    weekTotal: mon => violinWeekTotal(state, mon || weekStart(TODAY)),
    weeks(n = 8) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const mon = addDays(weekStart(TODAY), -7 * i);
        const end = addDays(mon, 7);
        const ss = state.violin.sessions.filter(x => x.date >= mon && x.date < end);
        const by = { solo: 0, lesson: 0, orchestra: 0, trio: 0 };
        ss.forEach(x => { by[x.type] += x.minutes; });
        out.push({ week: mon, minutes: ss.reduce((a, x) => a + x.minutes, 0), by, current: i === 0 });
      }
      return out;
    },
    streak: () => violinStreak(state),
    daysPractised(n = 28) {
      const from = addDays(TODAY, -(n - 1));
      return new Set(state.violin.sessions.filter(x => x.date >= from).map(x => x.date)).size;
    },
    dayGrid(n = 28) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const d = addDays(TODAY, -i);
        out.push({ date: d, minutes: state.violin.sessions.filter(x => x.date === d).reduce((a, x) => a + x.minutes, 0) });
      }
      return out;
    },
    itemStats(id) {
      const ss = state.violin.sessions.filter(x => x.items.includes(id));
      const precise = ss.filter(x => x.split && x.split[id] != null);
      return { sessions: ss.length, last: ss[0] ? ss[0].date : null, preciseSessions: precise.length, preciseMinutes: precise.reduce((a, x) => a + x.split[id], 0) };
    },
  };

  const gym = {
    templates: GYM_TEMPLATES,
    nextPlanned() { return state.gym.plan.find(p => p.date >= TODAY && !state.gym.history.find(h => h.date === p.date)); },
    start(templateId) {
      const t = GYM_TEMPLATES[templateId];
      state.gym.active = {
        templateId, name: t.name, startedAt: Date.now(),
        exercises: t.exercises.map(e => ({ name: e.name, unit: e.unit || 'reps', rest: e.rest, alts: e.alts.slice(), swappedFrom: null, sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: e.weight, done: false })) })),
      };
      commit();
    },
    toggleSet(ei, si) { const s = state.gym.active.exercises[ei].sets[si]; s.done = !s.done; commit(); return s.done; },
    bump(ei, si, field, delta) {
      const s = state.gym.active.exercises[ei].sets[si];
      s[field] = Math.max(0, Math.round((s[field] + delta) * 10) / 10);
      // carry weight changes forward to the sets that haven't been done yet
      if (field === 'weight') state.gym.active.exercises[ei].sets.forEach((x, i) => { if (i > si && !x.done) x.weight = s.weight; });
      commit();
    },
    swap(ei, name) {
      const e = state.gym.active.exercises[ei];
      const old = e.name;
      e.alts = e.alts.filter(a => a !== name).concat(e.swappedFrom ? [] : [old]);
      if (e.swappedFrom === name) { e.swappedFrom = null; } else if (!e.swappedFrom) { e.swappedFrom = old; }
      e.name = name;
      commit();
    },
    addSet(ei) { const sets = state.gym.active.exercises[ei].sets; const last = sets[sets.length - 1]; sets.push({ reps: last.reps, weight: last.weight, done: false }); commit(); },
    removeSet(ei) { const sets = state.gym.active.exercises[ei].sets; if (sets.length > 1) sets.pop(); commit(); },
    progress() {
      const a = state.gym.active; if (!a) return null;
      const all = a.exercises.flatMap(e => e.sets);
      return { done: all.filter(s => s.done).length, total: all.length, elapsed: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)) };
    },
    cancel() { state.gym.active = null; commit(); },
    finish({ effort, soreness, pain, painNote } = {}) {
      const a = state.gym.active; if (!a) return null;
      const p = gym.progress();
      const t = GYM_TEMPLATES[a.templateId];
      const minutes = p.elapsed >= 15 ? p.elapsed : t.estimate;
      const top = {};
      a.exercises.forEach(e => { const w = Math.max(...e.sets.filter(s => s.done).map(s => s.weight), 0); if (w) top[e.name] = w; });
      const weekBefore = gymWeekCount(state);
      state.gym.history.unshift({ date: TODAY, template: a.templateId, minutes, sets: p.done, effort: effort || null, soreness: soreness || null, pain: !!pain, painNote: painNote || '', top, fresh: true });
      state.gym.active = null;
      const lines = [
        { section: 'gym', xp: 40, reason: `${t.name} completed` },
        { section: 'gym', xp: Math.min(p.done, 20), reason: `${p.done} sets done (XP capped at the plan)` },
      ];
      if (effort || soreness || pain) lines.push({ section: 'gym', xp: 5, reason: 'Check-in recorded' });
      if (weekBefore + 1 === state.gym.weekTarget) { state.gym.streak += 1; lines.push({ section: 'gym', xp: 15, reason: 'Weekly target: 2 sessions' }); }
      const r = award(lines);
      r.pain = !!pain;
      commit();
      return r;
    },
    weekCount: () => gymWeekCount(state),
    progression(name) {
      return state.gym.history.filter(h => h.top && h.top[name] != null).map(h => ({ date: h.date, weight: h.top[name] })).reverse();
    },
  };

  const sleep = {
    duration: sleepDuration,
    delta: n => bedDelta(n, state.sleep.schedule),
    targetFor(date) { return [0, 6].includes(dow(date)) ? state.sleep.schedule.weekend : state.sleep.schedule.weekday; },
    lastNightLogged: () => !!state.sleep.nights.find(n => n.date === TODAY),
    log({ date, bed, wake, score }) {
      date = date || TODAY;
      state.sleep.nights = state.sleep.nights.filter(n => n.date !== date);
      const night = { date, bed, wake, score: score == null || score === '' ? null : Number(score), fresh: true };
      state.sleep.nights.forEach(n => delete n.fresh);
      state.sleep.nights.push(night);
      state.sleep.nights.sort((a, b) => (a.date < b.date ? -1 : 1));
      const lines = [{ section: 'sleep', xp: 10, reason: 'Night logged' }];
      if (Math.abs(bedDelta(night, state.sleep.schedule)) <= 30) lines.push({ section: 'sleep', xp: 10, reason: 'Bedtime within 30 min of plan' });
      const r = award(lines);
      r.night = night;
      commit();
      return r;
    },
    stats(n = 7) {
      const nights = state.sleep.nights.slice(-n);
      const durs = nights.map(sleepDuration);
      const norm = m => (m < 720 ? m + 1440 : m);
      const beds = nights.map(x => norm(toMin(x.bed)));
      const wakes = nights.map(x => toMin(x.wake));
      const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
      const mean = avg(beds);
      const sd = Math.sqrt(avg(beds.map(b => (b - mean) ** 2)));
      const scored = nights.filter(x => x.score != null);
      return {
        nights: nights.length, avgDuration: avg(durs), avgBed: fromMin(mean), avgWake: fromMin(avg(wakes)), spread: Math.round(sd),
        inWindow: nights.filter(x => Math.abs(bedDelta(x, state.sleep.schedule)) <= 30).length,
        avgScore: scored.length ? Math.round(avg(scored.map(x => x.score))) : null,
      };
    },
    streak: () => sleepStreak(state),
    setSchedule(kind, field, value) { state.sleep.schedule[kind][field] = value; commit(); },
    toggleReminders() { state.sleep.schedule.reminders = !state.sleep.schedule.reminders; commit(); },
    windDownTime(date) { return fromMin(toMin(sleep.targetFor(addDays(date || TODAY, 1)).bed) - state.sleep.schedule.windDown); },
  };

  const screen = {
    log(minutes, date) {
      date = date || TODAY;
      state.screen.days = state.screen.days.filter(d => d.date !== date);
      state.screen.days.push({ date, minutes, fresh: true });
      state.screen.days.sort((a, b) => (a.date < b.date ? -1 : 1));
      const lines = [{ section: 'screen', xp: 5, reason: 'Daily total logged' }];
      if (minutes <= state.screen.target) lines.push({ section: 'screen', xp: 10, reason: 'Under your target' });
      const r = award(lines);
      commit();
      return r;
    },
    todayLogged: () => !!state.screen.days.find(d => d.date === TODAY),
    streak: () => screenStreak(state),
    weekAvg(offsetWeeks = 0) {
      const mon = addDays(weekStart(TODAY), -7 * offsetWeeks), end = addDays(mon, 7);
      const ds = state.screen.days.filter(d => d.date >= mon && d.date < end);
      return ds.length ? Math.round(ds.reduce((a, d) => a + d.minutes, 0) / ds.length) : null;
    },
    setTarget(m) { state.screen.target = m; commit(); },
  };

  const sports = {
    kinds: SPORTS, pbs: PBS, weeks: SPORTS_WEEKS,
    log(entry) {
      const e = { id: uid('s'), date: TODAY, fresh: true, ...entry };
      state.sports.log.forEach(x => delete x.fresh);
      state.sports.log.unshift(e);
      const r = award([
        { section: 'sports', xp: Math.min(Math.round(e.minutes / 3), 30), reason: `${fmt.dur(e.minutes)} of ${SPORTS[e.sport].name.toLowerCase()}` },
        { section: 'sports', xp: 10, reason: 'Session logged' },
      ]);
      commit();
      return r;
    },
    metric(e) {
      if (e.sport === 'running') return fmt.pace(e.minutes, e.km);
      if (e.sport === 'cycling') return fmt.speed(e.minutes, e.km);
      if (e.sport === 'swimming') return fmt.swim(e.minutes, e.km);
      return e.kind || '';
    },
    weekCount() { const mon = weekStart(TODAY); return state.sports.log.filter(x => x.date >= mon).length; },
  };

  const study = {
    subjects: STUDY.subjects, weeks: STUDY.weeks, exams: STUDY.exams,
    subject: id => STUDY.subjects.find(s => s.id === id),
    log(entry) {
      state.study.log.unshift({ id: uid('st'), date: TODAY, fresh: true, ...entry });
      const r = award([{ section: 'study', xp: Math.min(Math.round(entry.minutes / 2), 40), reason: `${fmt.dur(entry.minutes)} of ${study.subject(entry.subject).name}` }]);
      commit();
      return r;
    },
    weekMinutes(id) { const mon = weekStart(TODAY); return state.study.log.filter(x => x.subject === id && x.date >= mon).reduce((a, x) => a + x.minutes, 0); },
  };

  const chess = {
    data: CHESS,
    record() { const g = CHESS.games; return { win: g.filter(x => x.result === 'win').length, loss: g.filter(x => x.result === 'loss').length, draw: g.filter(x => x.result === 'draw').length }; },
    log(entry) {
      if (entry.kind === 'puzzles') state.chess.puzzles.unshift({ date: TODAY, solved: entry.solved || 0, minutes: entry.minutes, fresh: true });
      else state.chess.study.unshift({ date: TODAY, topic: entry.topic || 'Study', minutes: entry.minutes, fresh: true });
      const r = award([{ section: 'chess', xp: Math.min(Math.round(entry.minutes / 2), 20), reason: entry.kind === 'puzzles' ? 'Puzzle session logged' : 'Study logged' }]);
      commit();
      return r;
    },
  };

  const tasks = {
    list(filter = {}) {
      let t = state.tasks.slice();
      if (filter.section) t = t.filter(x => x.section === filter.section);
      if (filter.status === 'open') t = t.filter(x => !x.done);
      if (filter.status === 'done') t = t.filter(x => x.done);
      if (filter.when === 'today') t = t.filter(x => x.due && x.due <= TODAY);
      if (filter.when === 'week') t = t.filter(x => x.due && x.due <= addDays(TODAY, 7));
      if (filter.priority) t = t.filter(x => x.priority === filter.priority);
      const pr = { high: 0, medium: 1, low: 2 };
      return t.sort((a, b) => (a.done - b.done) || ((a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : pr[a.priority] - pr[b.priority]));
    },
    toggle(id) {
      const t = state.tasks.find(x => x.id === id);
      t.done = !t.done;
      let r = null;
      if (t.done && !t.xpGiven) { t.xpGiven = true; r = award([{ section: t.section, xp: 5, reason: 'Task completed' }]); }
      commit();
      return r;
    },
    add({ title, section, priority, due }) {
      const t = { id: uid('t'), title, section: section || null, priority: priority || 'medium', due: due || null, done: false, fresh: true };
      state.tasks.unshift(t);
      commit();
      return t;
    },
    overdue: t => !t.done && t.due && t.due < TODAY,
  };

  /* ---------- calendar ---------- */
  const cal = {
    occurrences(from, to, opts = {}) {
      const out = [];
      const { rules, singles } = state.cal;
      for (let d = from; d <= to; d = addDays(d, 1)) {
        rules.forEach(r => {
          if (d < r.from || (r.until && d > r.until) || !r.days.includes(dow(d))) return;
          const ex = r.exceptions[d] || {};
          const date = ex.moveTo || d;
          out.push({ id: `${r.id}@${d}`, ruleId: r.id, origDate: d, date, title: r.title, section: r.section, kind: r.kind, match: r.match, start: ex.start || r.start, end: ex.end || r.end, recurring: true, cancelled: !!ex.cancelled, changed: !!(ex.start || ex.moveTo), note: ex.note || '' });
        });
      }
      singles.forEach(s => { if (s.date >= from && s.date <= to) out.push({ ...s, origDate: s.date, recurring: false, cancelled: !!s.cancelled }); });
      // moved occurrences may land outside the range
      let list = out.filter(o => o.date >= from && o.date <= to);
      // planned vs completed
      const logs = cal.logs(from, to);
      list.forEach(o => {
        if (o.date > TODAY || o.cancelled || o.kind !== 'session') { o.status = o.cancelled ? 'cancelled' : 'planned'; return; }
        const hit = logs.find(l => !l.used && l.date === o.date && l.section === o.section && (!o.match || l.match === o.match || o.section === 'gym'));
        if (hit) { hit.used = true; o.status = 'done'; o.logged = hit; } else o.status = o.date < TODAY ? 'unlogged' : 'planned';
      });
      if (opts.includeLogs !== false) logs.filter(l => !l.used).forEach(l => list.push({ id: 'log-' + l.id, date: l.date, title: l.title, section: l.section, kind: 'log', start: null, end: null, status: 'done', logged: l, recurring: false }));
      // tasks with due dates
      if (opts.tasks !== false) state.tasks.filter(t => t.due && t.due >= from && t.due <= to).forEach(t => list.push({ id: 'task-' + t.id, taskId: t.id, date: t.due, title: t.title, section: t.section, kind: 'task', start: null, end: null, status: t.done ? 'done' : 'planned', recurring: false }));
      // conflicts between timed, active events
      const timed = list.filter(o => o.start && o.end && !o.cancelled && o.kind !== 'log' && o.kind !== 'task');
      timed.forEach(a => timed.forEach(b => {
        if (a === b || a.date !== b.date) return;
        if (toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) { a.conflict = true; (a.conflictWith = a.conflictWith || []).includes(b.title) || a.conflictWith.push(b.title); }
      }));
      if (opts.sections && opts.sections.length) list = list.filter(o => !o.section || opts.sections.includes(o.section));
      return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.start || '00:00') < (b.start || '00:00') ? -1 : 1));
    },
    logs(from, to) {
      const L = [];
      state.violin.sessions.filter(x => x.date >= from && x.date <= to).forEach(x => L.push({ id: x.id, date: x.date, section: 'violin', match: x.type, title: `${violin.typeName(x.type)} · ${fmt.dur(x.minutes)}`, minutes: x.minutes }));
      state.gym.history.filter(x => x.date >= from && x.date <= to).forEach((x, i) => L.push({ id: 'g' + x.date + i, date: x.date, section: 'gym', match: 'gym', title: `${GYM_TEMPLATES[x.template].name} · ${fmt.dur(x.minutes)}`, minutes: x.minutes }));
      state.sports.log.filter(x => x.date >= from && x.date <= to).forEach(x => L.push({ id: x.id, date: x.date, section: 'sports', match: x.sport, title: `${SPORTS[x.sport].name} · ${x.km ? x.km + ' km' : fmt.dur(x.minutes)}`, minutes: x.minutes }));
      state.study.log.filter(x => x.date >= from && x.date <= to).forEach(x => L.push({ id: x.id, date: x.date, section: 'study', match: 'study', title: `${study.subject(x.subject).name} · ${fmt.dur(x.minutes)}`, minutes: x.minutes }));
      return L;
    },
    find(id) { return cal.occurrences(addDays(TODAY, -60), addDays(TODAY, 120), { includeLogs: false, tasks: false }).find(o => o.id === id); },
    // Moves or retimes an event. scope: 'one' | 'future' (recurring only).
    reschedule(occ, { date, start, end }, scope = 'one') {
      if (!occ.recurring) {
        const s = state.cal.singles.find(x => x.id === occ.id);
        Object.assign(s, { date: date || s.date, start: start || s.start, end: end || s.end });
      } else {
        const r = state.cal.rules.find(x => x.id === occ.ruleId);
        if (scope === 'one') {
          r.exceptions[occ.origDate] = { ...(r.exceptions[occ.origDate] || {}), start, end, moveTo: date !== occ.origDate ? date : undefined, cancelled: false };
        } else {
          const shift = diffDays(occ.origDate, date);
          const copy = JSON.parse(JSON.stringify(r));
          copy.id = uid('r-');
          copy.from = occ.origDate;
          copy.start = start; copy.end = end;
          copy.days = r.days.map(d => (d + shift + 7) % 7);
          copy.exceptions = {};
          r.until = addDays(occ.origDate, -1);
          state.cal.rules.push(copy);
        }
      }
      commit();
    },
    cancel(occ, scope = 'one') {
      if (!occ.recurring) { state.cal.singles.find(x => x.id === occ.id).cancelled = true; }
      else {
        const r = state.cal.rules.find(x => x.id === occ.ruleId);
        if (scope === 'one') r.exceptions[occ.origDate] = { ...(r.exceptions[occ.origDate] || {}), cancelled: true };
        else r.until = addDays(occ.origDate, -1);
      }
      commit();
    },
    restore(occ) {
      if (!occ.recurring) { delete state.cal.singles.find(x => x.id === occ.id).cancelled; }
      else { const r = state.cal.rules.find(x => x.id === occ.ruleId); delete r.exceptions[occ.origDate]; }
      commit();
    },
    add(ev) { const e = { id: uid('c-'), kind: 'session', ...ev }; state.cal.singles.push(e); commit(); return e; },
    conflicts(from, to) { return cal.occurrences(from, to, { includeLogs: false, tasks: false }).filter(o => o.conflict); },
  };

  /* ---------- today & summary ---------- */
  function todayItems() {
    const occ = cal.occurrences(TODAY, addDays(TODAY, 1), { includeLogs: false, tasks: false }).filter(o => !o.cancelled);
    const items = occ.map(o => ({ type: 'event', when: o.date === TODAY ? (o.start || 'All day') : 'Tomorrow' + (o.start ? ' ' + o.start : ''), title: o.title, section: o.section, status: o.status, occ: o, tomorrow: o.date !== TODAY }));
    if (state.sleep.schedule.reminders) items.push({ type: 'reminder', when: sleep.windDownTime(TODAY), title: 'Wind down for bed', section: 'sleep' });
    const sortKey = i => (i.tomorrow ? '1' : '0') + (i.when.match(/\d\d:\d\d/) ? i.when.match(/\d\d:\d\d/)[0] : '00:00');
    const t = state.tasks.filter(x => !x.done && x.due && x.due <= addDays(TODAY, 1)).map(x => ({ type: 'task', when: x.due < TODAY ? 'Overdue' : x.due === TODAY ? 'Due today' : 'Due tomorrow', title: x.title, section: x.section, task: x }));
    return { events: items.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1)), tasks: t };
  }

  function rest() {
    if (!state.restToday) { state.restToday = true; state.restDays.push(TODAY); }
    const streakBefore = state.overallStreak;
    if (!state.activeToday) { state.activeToday = true; state.overallStreak += 1; }
    const unlocked = checkAchievements();
    commit();
    return { lines: [], total: 0, sectionUps: [], overallUp: null, evolved: null, unlocked, streak: state.overallStreak, streakUp: state.overallStreak > streakBefore, rest: true };
  }

  function sectionStreak(id) {
    switch (id) {
      case 'violin': return { n: violinStreak(state), unit: 'wk', label: 'weeks at 240 min' };
      case 'gym': return { n: state.gym.streak, unit: 'wk', label: 'weeks with 2 sessions' };
      case 'sleep': return { n: sleepStreak(state), unit: 'nights', label: 'nights near bedtime' };
      case 'screen': return { n: screenStreak(state), unit: 'days', label: 'days under target' };
      case 'coding': return { n: state.streaks.coding, unit: 'days', label: 'day streak (sample)' };
      case 'sports': return { n: state.streaks.sports, unit: 'wk', label: 'weeks with 3+ sessions' };
      case 'study': return { n: state.streaks.study, unit: 'days', label: 'day streak' };
      case 'chess': return { n: state.streaks.chess, unit: 'wk', label: 'weeks with 3 sessions' };
    }
    return { n: 0, unit: '', label: '' };
  }

  // Demo of the level-up / evolution moment without changing data.
  function previewEvolution() {
    const lvl = levelInfo(totalXP(state), OVERALL_STEP).level;
    const from = stageFor(lvl), to = Math.min(from + 1, STAGES.length - 1);
    return { lines: [{ section: null, xp: 0, reason: 'Preview only, no XP added' }], total: 0, sectionUps: [], overallUp: { from: STAGES[to].level - 1, to: STAGES[to].level }, evolved: { from, to }, unlocked: [], preview: true, streak: state.overallStreak };
  }

  const LT = {
    TODAY, SECTIONS, LABELS, STAGES, ACHIEVEMENTS,
    date: { parse, toISO, addDays, diffDays, dow, weekStart, toMin, fromMin, DAYS, DAYS_LONG, MONTHS, MONTHS_LONG },
    fmt, section: sectionById,
    get state() { return state; },
    init(key) { storeKey = 'lifetracker-proto-' + key; load(); return LT; },
    reset() { state = freshState(); commit(); },
    on(fn) { listeners.push(fn); },
    commit,
    level(id) { return levelInfo(state.xp[id], SECTION_STEP); },
    overall() { const info = levelInfo(totalXP(state), OVERALL_STEP); info.stage = stageFor(info.level); info.nextStage = STAGES[info.stage + 1] || null; return info; },
    stageFor,
    streak() { return { n: state.overallStreak, today: state.activeToday, rest: state.restToday }; },
    sectionStreak, achievements() {
      return ACHIEVEMENTS.map(a => ({ ...a, unlocked: state.ach[a.id] || null, progress: a.calc ? Math.min(a.calc(state), a.goal) : null }));
    },
    violin, gym, sleep, screen, sports, study, chess, coding: CODING, tasks, cal,
    today: todayItems, rest, previewEvolution,
    reduced: () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches,
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  };

  /* ---------- tiny SVG chart helpers (styled by each design's CSS) ---------- */
  const niceStep = raw => { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
  LT.chart = {
    // Vertical bars with optional target line. values: numbers; labels: strings.
    bars({ values, labels, w = 340, h = 150, max, target, unit = '', valueFmt = v => v, hi = [], pad = { t: 18, r: 8, b: 22, l: 34 }, ticks = 3, cls = '' }) {
      const rawMax = Math.max(...values, target || 0) * 1.05 || 1;
      const step = niceStep((max || rawMax) / ticks);
      const top = max || Math.ceil(rawMax / step) * step;
      if (!max) ticks = Math.round(top / step);
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const bw = iw / values.length;
      const y = v => pad.t + ih - (v / top) * ih;
      let g = '';
      for (let i = 0; i <= ticks; i++) {
        const v = (top / ticks) * i;
        g += `<line class="ch-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ch-axis" x="${pad.l - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${valueFmt(Math.round(v))}</text>`;
      }
      let b = '';
      values.forEach((v, i) => {
        const x = pad.l + i * bw + bw * 0.18, bwid = bw * 0.64;
        const isHi = hi.includes(i);
        b += `<rect class="ch-bar${isHi ? ' is-hi' : ''}${target && v >= target ? ' is-met' : ''}" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${bwid.toFixed(1)}" height="${Math.max(0, pad.t + ih - y(v)).toFixed(1)}" rx="2"><title>${labels[i]}: ${valueFmt(v)}${unit}</title></rect>`;
        b += `<text class="ch-lbl${isHi ? ' is-hi' : ''}" x="${(x + bwid / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle">${labels[i]}</text>`;
      });
      const tl = target ? `<line class="ch-target" x1="${pad.l}" x2="${w - pad.r}" y1="${y(target).toFixed(1)}" y2="${y(target).toFixed(1)}"/><text class="ch-target-lbl" x="${w - pad.r}" y="10" text-anchor="end">- - Target ${valueFmt(target)}${unit}</text>` : '';
      return `<svg class="chart ${cls}" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${g}${b}${tl}</svg>`;
    },
    // Line chart. series: [{values, cls}]; labels for x.
    line({ series, labels, w = 340, h = 150, min, max, valueFmt = v => v, pad = { t: 14, r: 12, b: 22, l: 38 }, ticks = 3, every = 1, dots = true, cls = '', area = false }) {
      const all = series.flatMap(s => s.values);
      const st = niceStep(((max != null ? max : Math.max(...all)) - (min != null ? min : Math.min(...all)) || 1) / ticks);
      const lo = min != null ? min : Math.floor(Math.min(...all) / st) * st;
      const hiV = max != null ? max : Math.max(lo + st * ticks, Math.ceil(Math.max(...all) / st) * st);
      const span = hiV - lo || 1;
      ticks = Math.round(span / st) || ticks;
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const n = series[0].values.length;
      const x = i => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
      const y = v => pad.t + ih - ((v - lo) / span) * ih;
      let g = '';
      for (let i = 0; i <= ticks; i++) {
        const v = lo + (span / ticks) * i;
        g += `<line class="ch-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ch-axis" x="${pad.l - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${valueFmt(Math.round(v))}</text>`;
      }
      labels.forEach((l, i) => { if (i % every === 0 || i === n - 1) g += `<text class="ch-lbl" x="${x(i).toFixed(1)}" y="${h - 6}" text-anchor="middle">${l}</text>`; });
      let p = '';
      series.forEach(s => {
        const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
        if (area) p += `<path class="ch-area ${s.cls || ''}" d="M${pts[0]} L${pts.join(' L')} L${x(n - 1).toFixed(1)},${pad.t + ih} L${x(0).toFixed(1)},${pad.t + ih} Z"/>`;
        p += `<polyline class="ch-line ${s.cls || ''}" points="${pts.join(' ')}"/>`;
        if (dots) s.values.forEach((v, i) => { p += `<circle class="ch-dot ${s.cls || ''}${i === n - 1 ? ' is-end' : ''}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === n - 1 ? 4 : 2.4}"><title>${labels[i]}: ${valueFmt(v)}</title></circle>`; });
      });
      return `<svg class="chart ${cls}" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${g}${p}</svg>`;
    },
  };

  global.LT = LT;
})(window);
