// Builds src/domain/papers/catalogue.ts: every past paper listed for the user's units,
// from Physics & Maths Tutor's pages, plus examiner reports for IAL Physics and the topic-question
// booklets. Every link it writes was listed on those pages when the script ran.
// Run: node scripts/papers-catalogue.mjs
import { writeFileSync } from 'node:fs';

const LAST_YEAR = 2026;
const UA = { 'User-Agent': 'Mozilla/5.0 (paper list builder)' };
const cache = new Map();
async function page(url) {
  if (!cache.has(url)) {
    const r = await fetch(url, { headers: UA, redirect: 'follow' });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    cache.set(url, await r.text());
  }
  return cache.get(url);
}
async function pdfs(url) {
  const out = new Set();
  for (const m of (await page(url)).matchAll(/https:\/\/pmt\.physicsandmathstutor\.com\/download\/([^"']+?\.pdf)/g)) out.add(decodeURIComponent(m[1].replace(/&amp;/g, '&')));
  return [...out];
}

const MONTHS = {
  January: 1,
  February: 2,
  March: 3,
  May: 5,
  June: 6,
  October: 10,
  November: 11,
};
function when(s) {
  const m = s.match(/^(January|February|March|May|June|October|November)\s+(\d{4})/);
  if (m) return { month: MONTHS[m[1]], year: +m[2] };
  const sp = s.match(/^Specimen(?:\s+\(?(\d{4})\)?)?/);
  return sp ? { month: 0, year: sp[1] ? +sp[1] : 0 } : null;
}

const UNITS = [];
const PHYS = [
  ['Unit 1', 'Mechanics and Materials', 'AS'],
  ['Unit 2', 'Waves and Electricity', 'AS'],
  ['Unit 3', 'Practical Skills I', 'AS'],
  ['Unit 4', 'Further Mechanics, Fields and Particles', 'A2'],
  ['Unit 5', 'Thermodynamics, Radiation, Oscillations and Cosmology', 'A2'],
  ['Unit 6', 'Practical Skills II', 'A2'],
];
PHYS.forEach(([short, name, level], i) => {
  const n = i + 1;
  const pg = `https://www.physicsandmathstutor.com/past-papers/a-level-physics/edexcel-unit-${n}/`;
  UNITS.push({
    subject: 'Physics',
    code: `WPH1${n}`,
    short,
    name,
    level,
    spec: 'new',
    page: pg,
    tpl: `Physics/A-level/Past-Papers/Edexcel-IAL/2018-spec/Unit-${n}/{T}/{S} (IAL) {T}.pdf`,
    re: new RegExp(`^Physics/A-level/Past-Papers/Edexcel-IAL/2018-spec/Unit-${n}/(QP|MS)/(.+) \\(IAL\\) (?:QP|MS)\\.pdf$`),
    s: 2,
    t: 1,
  });
  UNITS.push({
    subject: 'Physics',
    code: `WPH0${n}`,
    short,
    name,
    level,
    spec: 'old',
    page: pg,
    tpl: `Physics/A-level/Past-Papers/Edexcel-IAL/Unit-${n}/{S} {T} - Unit ${n} Edexcel Physics A-level.pdf`,
    re: new RegExp(`^Physics/A-level/Past-Papers/Edexcel-IAL/Unit-${n}/(.+?) (QP|MS) - Unit ${n} Edexcel Physics A-level\\.pdf$`),
    s: 1,
    t: 2,
  });
});
const MATHS_PAGE = 'https://www.physicsandmathstutor.com/a-level-maths-papers/edexcel-maths-ial-papers/';
for (const [subject, code, short, name, level, dir] of [
  ['Maths', 'WMA11', 'P1', 'Pure Mathematics 1', 'AS', 'Pure/P1'],
  ['Maths', 'WMA12', 'P2', 'Pure Mathematics 2', 'AS', 'Pure/P2'],
  ['Maths', 'WME01', 'M1', 'Mechanics 1', 'AS', 'Mechanics/M1'],
  ['Maths', 'WST01', 'S1', 'Statistics 1', 'AS', 'Statistics/S1'],
  ['Maths', 'WDM11', 'D1', 'Decision Mathematics 1', 'AS', 'Decision/D1'],
  ['Maths', 'WMA13', 'P3', 'Pure Mathematics 3', 'A2', 'Pure/P3'],
  ['Maths', 'WMA14', 'P4', 'Pure Mathematics 4', 'A2', 'Pure/P4'],
  ['Maths', 'WME02', 'M2', 'Mechanics 2', 'A2', 'Mechanics/M2'],
  ['Maths', 'WME03', 'M3', 'Mechanics 3', 'A2', 'Mechanics/M3'],
  ['Maths', 'WST02', 'S2', 'Statistics 2', 'A2', 'Statistics/S2'],
  ['Maths', 'WST03', 'S3', 'Statistics 3', 'A2', 'Statistics/S3'],
  ['Further Maths', 'WFM01', 'F1', 'Further Pure Mathematics 1', 'AS', 'Further-Pure/F1'],
  ['Further Maths', 'WFM02', 'F2', 'Further Pure Mathematics 2', 'A2', 'Further-Pure/F2'],
  ['Further Maths', 'WFM03', 'F3', 'Further Pure Mathematics 3', 'A2', 'Further-Pure/F3'],
])
  UNITS.push({
    subject,
    code,
    short,
    name,
    level,
    spec: 'new',
    page: MATHS_PAGE,
    tpl: `Maths/A-level/Papers/Edexcel-IAL/${dir}/{T}/{S} {T}.pdf`,
    re: new RegExp(`^Maths/A-level/Papers/Edexcel-IAL/${dir}/(QP|MS|MA)/(.+) (?:QP|MS|MA)\\.pdf$`),
    s: 2,
    t: 1,
  });
[
  ['Paper 1', 'Theory Fundamentals', 'AS'],
  ['Paper 2', 'Fundamental Problem-solving and Programming Skills', 'AS'],
  ['Paper 3', 'Advanced Theory', 'A2'],
  ['Paper 4', 'Practical', 'A2'],
].forEach(([short, name, level], i) => {
  const n = i + 1;
  const pg = `https://www.physicsandmathstutor.com/past-papers/a-level-computer-science/caie-paper-${n}/`;
  UNITS.push({
    subject: 'Computer Science',
    code: `9618/${n}`,
    short,
    name,
    level,
    spec: 'new',
    page: pg,
    tpl: `Computer-Science/A-level/Past-Papers/CAIE/Spec-2021/Paper-${n}/{T}/{S} {T}.pdf`,
    re: new RegExp(`^Computer-Science/A-level/Past-Papers/CAIE/Spec-2021/Paper-${n}/(QP|MS)/(.+) (?:QP|MS)\\.pdf$`),
    s: 2,
    t: 1,
  });
  UNITS.push({
    subject: 'Computer Science',
    code: `9608/${n}`,
    short,
    name,
    level,
    spec: 'old',
    page: pg,
    tpl: `Computer-Science/A-level/Past-Papers/CAIE/Paper-${n}/{S} {T} - Paper ${n} CAIE Computer Science A-level.pdf`,
    re: new RegExp(`^Computer-Science/A-level/Past-Papers/CAIE/Paper-${n}/(.+?) (QP|MS) - Paper ${n} CAIE Computer Science A-level\\.pdf$`),
    s: 1,
    t: 2,
  });
});

// Examiner reports for IAL Physics, from the EPP mirror's directory listings.
const EPP = 'https://edexcel-past-papers.vercel.app';
const MON = {
  jan: 'January',
  january: 'January',
  june: 'June',
  oct: 'October',
  october: 'October',
};
const ers = new Map();
for (const m of (await page(`${EPP}/alevels/Physics/`)).matchAll(/alevels\/Physics\/((20\d\d)%20(\w+))"/g)) {
  const [, folder, year, mon] = m;
  if (+year < 2019 || +year > LAST_YEAR) continue;
  for (const sub of ['Examiner-report', 'Examiner-report%20(2018)']) {
    const html = await page(`${EPP}/alevels/Physics/${folder}/${sub}/`).catch(() => '');
    for (const f of html.matchAll(/title=([^ >]+?\.pdf)/g)) {
      const path = f[1].replace(/&#47;/g, '/');
      const unit = path.match(/WPH\d\d/i)?.[0].toUpperCase();
      if (unit) ers.set(`${unit}|${MON[mon.toLowerCase()]} ${year}`, path.replace(/^\/alevels\/Physics\//, ''));
    }
  }
}

const units = [];
for (const u of UNITS) {
  const by = new Map();
  for (const f of await pdfs(u.page)) {
    const m = f.match(u.re);
    if (!m) continue;
    const s = m[u.s].trim();
    const w = when(s);
    if (!w || w.year > LAST_YEAR) continue;
    const t = m[u.t];
    if (u.tpl.replace('{S}', s).replaceAll('{T}', t) !== f) throw new Error(`template mismatch ${u.code}: ${f}`);
    const row = by.get(s) ?? { s, ...w, docs: new Set() };
    row.docs.add(t);
    by.set(s, row);
  }
  const rows = [...by.values()].filter((r) => r.docs.has('QP')).sort((a, b) => a.year - b.year || a.month - b.month || a.s.localeCompare(b.s));
  const er = (s) => ers.get(`${u.code}|${s.replace(/ \(IAL\)$/, '')}`);
  units.push({
    code: u.code,
    subject: u.subject,
    short: u.short,
    name: u.name,
    level: u.level,
    spec: u.spec,
    page: u.page,
    tpl: u.tpl,
    s: rows.map((r) => [r.s, (r.docs.has('MS') ? 'm' : '') + (r.docs.has('MA') ? 'a' : ''), er(r.s)].filter((x, i) => i < 2 || x).join('|')),
  });
  console.log(u.code, rows.length, rows.filter((r) => er(r.s)).length, 'reports');
}

// Topic questions: past-paper questions sorted into booklets by topic.
const topics = [];
const pair = (files, unit, page, group) => {
  const items = new Map();
  for (const f of files) {
    const file = f.split('/').pop();
    const set = f.split('/').slice(-2, -1)[0];
    const ms = / MS\.pdf$/.test(file);
    const name = file
      .replace(/\.pdf$/, '')
      .replace(/ (MS|QP)( \d)?$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const k = `${set}|${name}`;
    const it = items.get(k) ?? {
      set: group(set),
      name,
      dir: f.slice(0, f.length - file.length),
    };
    if (ms) it.ms = file;
    else it.qp = file;
    items.set(k, it);
  }
  topics.push({
    unit,
    page,
    items: [...items.values()].filter((i) => i.qp).sort((a, b) => a.set.localeCompare(b.set) || a.name.localeCompare(b.name, 'en', { numeric: true })),
  });
};
for (let n = 1; n <= 6; n++) {
  const pg = `https://www.physicsandmathstutor.com/physics-revision/a-level-edexcel-ial/unit-${n}/`;
  const files = (await pdfs(pg)).filter((f) => f.startsWith(`Physics/A-level/Topic-Qs/Edexcel-IAL/Unit-${n}/`));
  if (files.length) pair(files, `WPH1${n}`, pg, (s) => s.replace('Set-', 'Set '));
}
for (const [unit, slug] of [
  ['WMA11', 'c1'],
  ['WMA12', 'c2'],
  ['WME01', 'm1'],
  ['WST01', 's1'],
  ['WFM01', 'fp1'],
  ['WDM11', 'd1'],
]) {
  const pg = `https://www.physicsandmathstutor.com/a-level-maths-papers/${slug}-by-topic/`;
  const files = (await pdfs(pg)).filter((f) => /\/Topic-Qs\/Edexcel-Set/.test(f));
  if (files.length) pair(files, unit, pg, (s) => s.replace('Edexcel-Set-', 'Set '));
}
for (const t of topics) console.log('topics', t.unit, t.items.length);

const ts = `/**
 * Generated by scripts/papers-catalogue.mjs from Physics & Maths Tutor's paper pages and the EPP
 * mirror of Pearson's examiner reports. Papers ${LAST_YEAR} and earlier. Do not edit by hand.
 *
 * Units: \`tpl\` builds a file path from the session ({S}) and document ({T}: QP, MS, MA).
 * Sessions: "label|docs|report", docs has m (mark scheme) and a (model answers).
 */
export const PMT_BASE = 'https://pmt.physicsandmathstutor.com/download/';
export const REPORT_BASE = '${EPP}/alevels/Physics/';
export const LAST_YEAR = ${LAST_YEAR};

export interface UnitRow {
  code: string;
  subject: 'Physics' | 'Maths' | 'Further Maths' | 'Computer Science';
  short: string;
  name: string;
  level: 'AS' | 'A2';
  spec: 'new' | 'old';
  page: string;
  tpl: string;
  s: string[];
}
export interface TopicRow {
  unit: string;
  page: string;
  items: { set: string; name: string; dir: string; qp: string; ms?: string }[];
}

export const UNITS: UnitRow[] = ${JSON.stringify(units, null, 1)};

export const TOPIC_BOOKLETS: TopicRow[] = ${JSON.stringify(topics, null, 1)};
`;
writeFileSync(new URL('../src/domain/papers/catalogue.ts', import.meta.url), ts);
console.log('wrote catalogue.ts', ts.length, 'chars');
