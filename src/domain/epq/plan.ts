/**
 * The owner's EPQ plan, from the handover of 9 November 2026: note form, for reference and for
 * ticking off. None of it is text to submit: the essay, the log and the code stay the owner's own.
 * Dates assume a late-April hand-in until the supervisor confirms the real ones.
 */

export const RULES = [
  'American spelling in everything for the EPQ (behavior, analyze, color).',
  'Your writing and code stay your own. Plans and feedback are notes to rewrite with the notes closed.',
  'Only cite what you have opened and read. Note when something is paywalled or only partly read.',
  'Log AI help on ProjectQ as AI-assisted planning, with a date.',
];

export const QUESTION = 'To what extent can AI systems perform classical piano music with expression that is human-like?';

export const SETUP = 'The same pieces in three versions (human from ASAP, AI from a renderer you run, deadpan from the score), all through the same piano sound. 6–10 pieces with 4+ human performances each; two held out for the listening test.';

export const EXPERIMENTS: { n: number; title: string; what: string; shows: string }[] = [
  { n: 1, title: 'Feature measurement', what: 'Your Python (partitura, librosa, pretty_midi) matches played notes to the score and measures tempo curves, timing, velocity and articulation; plots show whether each AI sits inside the human range.', shows: 'Whether AI expression is measurably human-like, and where it differs' },
  { n: 2, title: 'Classifier', what: 'scikit-learn on Experiment 1’s features, one row per phrase. Split by piece, test on unseen pieces and ideally an unseen AI system; check feature importance.', shows: 'Whether a difference exists in the numbers: ~50% = indistinguishable, ~90% = clear difference' },
  { n: 3, title: 'Blind listening test', what: '~20 people, 20–30 s clips, same piano sound, attention check. Per clip: expressiveness /5, which is human, confidence /5. Record musical experience.', shows: 'Whether people can hear it, and whether musicians and non-musicians differ' },
];

export const CASE_STUDY = 'Violin case study: Experiment 1 only, on violin recordings (maybe your own), plus vibrato rate and width and pitch over time. Shows why strings are harder to model; no classifier.';

export const GATES: { key: string; when: string; title: string; check: string; fallback: string }[] = [
  { key: 'gate1', when: '2026-11-30', title: 'Gate 1: does an AI renderer run?', check: 'Install VirtuosoNet (or ScorePerformer, DExter, PianoFlow) and get MIDI out for one score.', fallback: 'Use the authors’ published sample MIDI and narrow the conclusion to those systems.' },
  { key: 'gate2', when: '2027-01-31', title: 'Gate 2: expression or file quirks?', check: 'Train the classifier to tell two halves of the human data apart: it should score about 50%.', fallback: 'Tighten the shared cleaning step; if it still fails, report it and lean on the human-range comparison.' },
];

/** The planned hours, block by block (120 in all). */
export const BLOCKS: { from: string; to: string; label: string; hours: number; work: string; evidence: string }[] = [
  { from: '2026-11-01', to: '2026-11-14', label: 'Nov, weeks 1–2', hours: 8, work: 'Agree the plan with Emma; your own title and objectives; Part A proposal; log AI-assisted planning', evidence: 'Part A Candidate Proposal' },
  { from: '2026-11-15', to: '2026-11-30', label: 'Nov, weeks 3–4', hours: 14, work: 'Read starred papers; set up git and Python; install a renderer; pick ASAP pieces; check training splits', evidence: 'Gate 1' },
  { from: '2026-12-01', to: '2026-12-31', label: 'December', hours: 18, work: 'Feature code v1 on one piece; known-answer tests; source table to about 20', evidence: 'Planning Review' },
  { from: '2027-01-01', to: '2027-01-31', label: 'January', hours: 20, work: 'Render all pieces; features on everything; human-range plots; classifier v1 with the artifact check', evidence: 'Gate 2 (mocks will cut in)' },
  { from: '2027-02-01', to: '2027-02-14', label: 'Early Feb', hours: 8, work: 'Build clips; ethics and consent sign-off; pilot with 3–4 people; write predictions', evidence: 'Pilot changes logged' },
  { from: '2027-02-15', to: '2027-03-07', label: 'Feb – early Mar', hours: 12, work: 'Run the listening test; violin recording and vibrato analysis', evidence: 'Mid-Project Review' },
  { from: '2027-03-08', to: '2027-03-31', label: 'March', hours: 18, work: 'Statistics, charts, classifier vs listeners; essay draft', evidence: 'Dated draft to Emma' },
  { from: '2027-04-01', to: '2027-04-20', label: 'Early April', hours: 12, work: 'Revise; references; AI-use declaration', evidence: 'Final essay' },
  { from: '2027-04-21', to: '2027-05-31', label: 'Late Apr – May', hours: 10, work: 'Presentation with a live “human or AI?” clip; reflection', evidence: 'Presentation Record, Product Review, Summary and Reflection' },
];

export interface Check {
  key: string;
  text: string;
  /** Where it leads in the app: a log entry of this kind. */
  log?: 'Decision' | 'Progress' | 'Reflection';
}

export const TODO: Check[] = [
  { key: 'rationale', text: 'Rationale final draft submitted' },
  { key: 'expdesc', text: 'Experiment description: same piano sound for every clip, classifier tested on unseen pieces, each AI compared with several humans' },
  { key: 'morepapers', text: 'One or two more papers per side, with one limit each' },
  { key: 'three', text: 'Three short pieces in your own words: what you know vs need to find out; definitions (expressive, human-like, AI system, classical); why it suits an EPQ' },
  { key: 'sourcelog', text: 'Start your own source log: why, what specifically, how, how reliable', log: 'Progress' },
  { key: 'nonpaper', text: 'Non-paper sources: a book, a news or industry piece, a recorded talk, a primary source' },
  { key: 'meetinglog', text: 'Finish the supervisor-meeting entry: date, decision and why, next steps with dates, Emma’s points', log: 'Progress' },
  { key: 'decisions', text: 'Log each decision on ProjectQ with a date and your reason, plus AI-assisted planning entries', log: 'Decision' },
  { key: 'emmalist', text: 'Take the questions list to the next meeting with Emma' },
  { key: 'parta', text: 'Submit the Part A Candidate Proposal' },
  { key: 'gate1run', text: 'Gate 1: one renderer outputs MIDI; check its training split against your ASAP pieces; write down the result', log: 'Progress' },
];

export const DECISIONS: { key: string; when: string; chose: string; over: string }[] = [
  { key: 'd-idea', when: '2026-10-07', chose: 'Idea 2: can AI perform music with human-like expression', over: 'Practice app (not measurable, ownership), model benchmarks (no clear question, dates fast)' },
  { key: 'd-perf', when: '2026-10-07', chose: 'Performance rendering (how notes are played)', over: 'Composition and text-to-music (context only)' },
  { key: 'd-essay', when: '2026-10-29', chose: 'Essay (~5,000 words)', over: 'Artefact (the ownership and measurability risks Emma raised)' },
  { key: 'd-optb', when: '2026-10-29', chose: 'Option B: essay + own feature code + classifier + listening test', over: 'A (measurement only, less AI); C (own model: too much data and time)' },
  { key: 'd-piano', when: '2026-11-04', chose: 'Classical piano as the main study, violin as a small case study', over: 'Violin as the main study (vibrato and bowing hard to encode, little research)' },
  { key: 'd-asap', when: '2026-11-04', chose: 'ASAP for human performances (real MIDI aligned to scores)', over: 'ATEPP (transcribed, artifacts); MAESTRO alone (no scores)' },
  { key: 'd-run', when: '2026-11-04', chose: 'Run renderers yourself, VirtuosoNet first', over: 'Demo pages only (best-case examples, too few)' },
  { key: 'd-split', when: '2026-11-04', chose: 'Split by piece, hold out an AI system, human-vs-human check', over: 'Random split by clip (inflates accuracy)' },
  { key: 'd-model', when: '2026-11-04', chose: 'No model of your own', over: 'Own model as a stretch goal (dropped)' },
];

export const FOR_EMMA: Check[] = [
  { key: 'q-optb', text: 'Is option B acceptable?' },
  { key: 'q-scope', text: 'Scope: core vs optional parts' },
  { key: 'q-consent', text: 'Parental consent for under-18 listeners' },
  { key: 'q-recruit', text: 'Recruiting listeners at school' },
  { key: 'q-dates', text: 'Real dates: Part A, Planning Review, Mid-Project Review, hand-in' },
  { key: 'q-ai', text: 'The school’s AI-use policy' },
  { key: 'q-code', text: 'Does code count towards the word limit (appendix?)' },
];

export const SUCCESS = [
  'Code passes known-answer tests',
  'At least 2 AI systems rendered; classifier tested on a held-out system',
  'At least 20 complete listening responses that pass the attention check',
  'The essay reaches a justified judgment weighing both sides',
];

export const CUT_ORDER = ['AI-label bias test', 'Teacher interview', 'One-change clips', 'Violin (becomes literature only)'];

export const RISKS: { risk: string; fallback: string }[] = [
  { risk: 'Ownership: much of the plan was drafted with AI', fallback: 'Write the proposal without AI docs open; dated log entries; lead the Emma meeting with your own questions' },
  { risk: 'No renderer runs on current Python', fallback: 'Authors’ published samples; a narrower conclusion' },
  { risk: 'Renderer trained on your test pieces', fallback: 'Pick pieces from its test split, or state it as a limitation' },
  { risk: 'Classifier spots file quirks, not expression', fallback: 'Shared cleaning step; human-vs-human check; lean on the range comparison' },
  { risk: 'Fewer than 20 listeners by mid-February', fallback: 'Run it in a music lesson or club with permission; extend a week' },
  { risk: 'Too big for 5,000 words', fallback: 'The agreed cut order' },
  { risk: 'A “boring” result: no one can tell', fallback: 'That is a finding: discuss why' },
];

/** Leads for the library: what the handover recorded about each. Open and read before citing. */
export interface Lead {
  key: string;
  short: string;
  author: string;
  year: string;
  where: string;
  url: string;
  side: string;
  facts: string;
  limits: string;
}
export const LEADS: Lead[] = [
  { key: 'symupe', short: 'SyMuPe / PianoFlow', author: 'Borovik, Gavrilev & Viro', year: '2025', where: 'ACM Multimedia', url: 'https://arxiv.org/abs/2511.03425', side: 'AI can', facts: '26 listeners, 708 paired votes; won 54% against humans', limits: 'Two-thirds of “human” samples transcribed; asked which is better, not which is human; ASAP in its training data' },
  { key: 'rencon', short: 'RenCon 2025', author: 'Zhang et al.', year: '2026', where: 'NIME', url: 'https://arxiv.org/abs/2605.02059', side: 'AI cannot (yet)', facts: 'Live, 8 systems, same Disklavier; human 4.40 vs best AI 3.62; 36 of 48 picked the human', limits: 'One piece, one pianist, mostly researchers; scale points unlabeled' },
  { key: 'virtuosonet', short: 'VirtuosoNet', author: 'Jeong et al.', year: '2019', where: 'ISMIR', url: '', side: 'Both', facts: 'Tempo curves r 0.7–1.0 with pianists; humans still rated highest', limits: 'Only 5 listeners, 3 pieces' },
  { key: 'review2018', short: 'Computational models of expressive performance (review)', author: 'Cancino-Chacón et al.', year: '2018', where: 'Frontiers in Digital Humanities', url: '', side: 'Cannot / method', facts: 'Evaluation “still largely unsolved”; models miss long-term structure', limits: 'A review, not an experiment' },
  { key: 'ansani', short: 'AI performer bias', author: 'Ansani et al.', year: '2025', where: 'Empirical Studies of the Arts 43(2)', url: '', side: 'Complicates both', facts: '120 people; identical audio rated lower when labeled AI', limits: 'Publisher page blocks checks: use the open copy' },
  { key: 'widmer', short: 'Con Espressione Manifesto', author: 'Widmer', year: '2017', where: 'ACM TIST 8(2)', url: '', side: 'Cannot', facts: 'AI lacks musical understanding even when it sounds right', limits: 'An argument, not an experiment' },
  { key: 'ortega', short: 'Violin expression', author: 'Ortega et al.', year: '2019', where: 'Frontiers in Psychology', url: '', side: 'Cannot / violin', facts: 'Modeled loudness and timing; 20 listeners; none judged more human-like', limits: 'One violinist, under 7 minutes of data' },
  { key: 'asap', short: 'ASAP dataset', author: 'Foscarin et al.', year: '2020', where: 'ISMIR', url: '', side: 'Data', facts: '1,067 performances, 222 scores', limits: 'Used in several renderers’ training: check overlap' },
  { key: 'pianist', short: 'Pianist Transformer', author: 'You et al.', year: '2025', where: 'ICML 2026', url: '', side: 'AI can', facts: '39 listeners: 32.7% first-place votes vs 30.8% for the human', limits: 'Not significant; six 15-second clips' },
  { key: 'stylenet', short: 'StyleNet', author: 'Malik & Ek', year: '2017', where: '', url: '', side: 'AI can', facts: 'Velocity only; listeners picked the human 53% on short clips', limits: 'Loudness only; 10-second clips' },
  { key: 'repp', short: 'A microcosm of musical expression I', author: 'Repp', year: '1998', where: 'JASA', url: '', side: 'Method', facts: 'Classic tempo curves across many pianists', limits: 'A model for your plots' },
  { key: 'afchar', short: 'Detecting music deepfakes is easy but actually hard', author: 'Afchar et al.', year: '2024', where: '', url: '', side: 'Detectors', facts: 'Detectors learn generator artifacts and fail on unseen ones', limits: 'Why you hold out an AI system' },
];

export const SOURCE_GAPS = ['A book (e.g. Müller, Fundamentals of Music Processing)', 'A news or industry piece', 'A recorded talk', 'A primary source, such as a teacher interview'];

/** Minutes logged within each planned block. */
export function blockProgress(sessions: { date: string; minutes: number }[]) {
  return BLOCKS.map((b) => ({ ...b, minutes: sessions.filter((s) => s.date >= b.from && s.date <= b.to).reduce((a, s) => a + s.minutes, 0) }));
}
