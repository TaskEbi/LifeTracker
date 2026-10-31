/**
 * Starting points for Future: universities, programmes and career paths to add with one tap.
 * University dates are the usual pattern for a cycle, never a confirmed date: each preset is saved
 * unconfirmed and the screen says so until the user ticks "checked on the official site".
 */
import type { Country } from './model';

export interface UniPreset {
  name: string;
  country: Country;
  course: string;
  plan: string;
  /** Month-day of the usual deadline, in the autumn before entry ('10-15') or January of entry ('+01-14'). */
  deadline: string;
  interview?: string;
  tests: string[];
  music: string;
}

export const UNI_PRESETS: UniPreset[] = [
  { name: 'Oxford', country: 'UK', course: 'Computer Science', plan: 'UCAS (Oxbridge)', deadline: '10-15', interview: '12-08', tests: ['MAT'], music: 'Joint courses include Maths & Computer Science; strong college music.' },
  { name: 'Cambridge', country: 'UK', course: 'Computer Science', plan: 'UCAS (Oxbridge)', deadline: '10-15', interview: '12-08', tests: ['TMUA'], music: 'College instrumental awards; many orchestras.' },
  { name: 'Imperial', country: 'UK', course: 'Computing', plan: 'UCAS', deadline: '+01-14', tests: ['TMUA'], music: '' },
  { name: 'UCL', country: 'UK', course: 'Computer Science', plan: 'UCAS', deadline: '+01-14', tests: [], music: '' },
  { name: 'Edinburgh', country: 'UK', course: 'Computer Science', plan: 'UCAS', deadline: '+01-14', tests: [], music: '' },
  { name: 'MIT', country: 'US', course: 'EECS (Course 6)', plan: 'Early Action', deadline: '11-01', tests: ['SAT'], music: 'Music major, minor or concentration; MIT Symphony Orchestra.' },
  { name: 'Stanford', country: 'US', course: 'Computer Science', plan: 'Restrictive Early Action', deadline: '11-01', tests: ['SAT'], music: 'Music major, including Music, Science & Technology (CCRMA).' },
  { name: 'Carnegie Mellon', country: 'US', course: 'School of Computer Science', plan: 'Early Decision', deadline: '11-01', tests: ['SAT'], music: 'BCSA: a combined Computer Science and Arts degree.' },
  { name: 'Caltech', country: 'US', course: 'Computer Science', plan: 'Restrictive Early Action', deadline: '11-01', tests: ['SAT'], music: '' },
  { name: 'Tufts', country: 'US', course: 'Computer Science', plan: 'Early Decision I', deadline: '11-01', tests: [], music: 'Five-year combined degree with the New England Conservatory.' },
  { name: 'Yale', country: 'US', course: 'Computer Science', plan: 'Single-Choice Early Action', deadline: '11-01', tests: ['SAT'], music: 'Music major; Yale Symphony Orchestra.' },
  { name: 'Harvard', country: 'US', course: 'Computer Science', plan: 'Restrictive Early Action', deadline: '11-01', tests: ['SAT'], music: 'Five-year dual degree with the New England Conservatory (AB + MM).' },
  { name: 'UC Berkeley', country: 'US', course: 'EECS / Computer Science', plan: 'UC application', deadline: '11-30', tests: [], music: 'UC applications don’t use the SAT.' },
];

/** The preset's usual date for starting in `entry`. */
export function presetDate(md: string, entry: number): string {
  return md.startsWith('+') ? `${entry}-${md.slice(1)}` : `${entry - 1}-${md}`;
}

/** Checklist every application starts with (editable per university). */
export function defaultChecklist(country: Country, tests: string[]): { id: string; label: string; done: boolean }[] {
  const base =
    country === 'UK'
      ? ['Personal statement final', 'Reference requested', 'Predicted grades in', 'Course and college chosen']
      : country === 'US'
        ? ['Common App essay final', 'Supplements written', 'Activities list done', 'Teacher recommendations requested', 'Counselor report and transcript', 'Financial aid forms (CSS / ISFAA)']
        : ['Application form', 'Essay', 'References'];
  return [...base, ...tests.map((t) => `${t} score sent`), 'Submitted'].map((label, i) => ({ id: `c${i}`, label, done: false }));
}

export interface ProgramPreset {
  name: string;
  kind: 'program' | 'competition';
  note: string;
}
export const PROGRAM_PRESETS: ProgramPreset[] = [
  { name: 'IOI', kind: 'competition', note: 'Through your national informatics olympiad' },
  { name: 'National informatics olympiad', kind: 'competition', note: 'Selection for the IOI team' },
  { name: 'USACO', kind: 'competition', note: 'Online contests through the year' },
  { name: 'Maths olympiad', kind: 'competition', note: 'National rounds' },
  { name: 'Physics olympiad', kind: 'competition', note: 'National rounds' },
  { name: 'RSI (Research Science Institute)', kind: 'program', note: 'Summer research at MIT; very selective' },
  { name: 'Summer Science Program', kind: 'program', note: 'Six-week research programme' },
  { name: 'PROMYS', kind: 'program', note: 'Summer maths programme' },
  { name: 'Ross Mathematics Program', kind: 'program', note: 'Summer maths programme' },
  { name: 'University summer school', kind: 'program', note: 'A taster course at a university you’re aiming for' },
  { name: 'Research internship', kind: 'program', note: 'With a professor or lab you’ve contacted' },
  { name: 'Summer music festival', kind: 'program', note: 'Orchestra or chamber music course' },
  { name: 'Concerto competition', kind: 'competition', note: 'A chance to play with an orchestra' },
];

export const CAREER_PRESETS: { name: string; needs: string }[] = [
  { name: 'Researcher (CS / maths)', needs: 'A strong degree, research experience early, a PhD' },
  { name: 'Software / ML engineer', needs: 'CS degree, internships, projects people use' },
  { name: 'Startup founder', needs: 'Something people want, a co-founder, shipping early and often' },
  { name: 'Quantitative trader / researcher', needs: 'Maths and CS, competitions, internships at trading firms' },
  { name: 'Engineer (robotics, hardware)', needs: 'Engineering or CS, building real things, labs and teams' },
  { name: 'Performing musician', needs: 'Conservatory-level playing, competitions, performing a lot' },
  { name: 'Music technology', needs: 'CS + music: audio, instruments, software for musicians' },
];

/** Ages on the life timeline to start from. */
export const TIMELINE_AGES = [18, 22, 25, 30, 40];
