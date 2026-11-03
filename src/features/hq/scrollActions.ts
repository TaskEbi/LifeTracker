/** Saving what the scroll understood. Each line goes through the same functions as its section's own sheet. */
import { ltToday, markRestDay, prefValue, withReward } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { saveSession, type SessionSave } from '../../data/sessions';
import { setMetric } from '../../data/logActions';
import { data } from '../../data/store';
import { addTodo } from '../../data/todoActions';
import type { Intent } from '../../domain/hq/scroll';
import { bookOf, titleKey } from '../../domain/reading/model';
import { addBucket } from '../bucket/actions';
import { booksIn } from '../reading/actions';
import { writeNight } from '../sleep/actions';
import { subjectsOf } from '../study/model';

const SPORT_NAME: Record<string, string> = { running: 'Running', cycling: 'Cycling', swimming: 'Swimming', tennis: 'Tennis', volleyball: 'Volleyball' };

/** Context for the parser: your subjects and books as they are now. */
export function scrollContext() {
  const st = data.get();
  return { today: ltToday(), subjects: subjectsOf(prefValue(st, 'study_subjects')), books: booksIn(st).map((b) => b.title) };
}

function sessionOf(i: Extract<Intent, { kind: 'session' }>): SessionSave {
  const base = { section: i.section, date: i.date, minutes: i.minutes };
  switch (i.section) {
    case 'violin':
      return { ...base, note: i.note, subcategory: 'Practice', detail: { type: 'solo', pieces: [], scales: [] } };
    case 'coding':
      return { ...base, note: i.note, subcategory: null, detail: { kind: 'Problems' } };
    case 'sports': {
      const sport = i.sport ?? 'running';
      const distance = sport === 'running' || sport === 'cycling' || sport === 'swimming';
      return { ...base, note: i.note, subcategory: SPORT_NAME[sport], detail: distance ? { sport, ...(i.km ? { km: i.km } : {}) } : { sport, type: i.match ? 'match' : 'training' } };
    }
    case 'gym':
      return { ...base, note: i.note, subcategory: null, detail: null };
    case 'study': {
      const subject = i.subject ?? 'Other';
      return { ...base, note: null, subcategory: subject, detail: { subject, kind: i.studyKind ?? 'Revision', ...(i.note ? { topic: i.note.slice(0, 80) } : {}) } };
    }
    case 'chess': {
      const kind = ['Openings', 'Endgames', 'Study', 'Lesson'].find((k) => i.note.toLowerCase().includes(k.toLowerCase().replace(/s$/, ''))) ?? 'Puzzles';
      return { ...base, note: i.note, subcategory: kind, detail: { kind } };
    }
    case 'future': {
      const n = i.note.toLowerCase();
      const kind = n.includes('sat') ? 'SAT' : n.includes('tmua') ? 'TMUA' : n.includes('essay') || n.includes('statement') ? 'Essays' : n.includes('appl') || n.includes('ucas') ? 'Applications' : 'Planning';
      return { ...base, note: i.note, subcategory: kind, detail: { kind } };
    }
    case 'reading':
      return { ...base, note: i.note, subcategory: i.book?.slice(0, 60) ?? null, detail: null };
  }
}

function saveOne(i: Intent): string | null {
  switch (i.kind) {
    case 'session': {
      const s = sessionOf(i);
      if (i.section === 'reading' && i.book) {
        const st = data.get();
        const book = booksIn(st).find((b) => titleKey(b.title) === titleKey(i.book!));
        if (book) {
          s.detail = { bookId: book.id, book: book.title.slice(0, 200) };
          // Logging a book moves it along, as the reading sheet does.
          const rec = st.lt_records.get(book.id);
          const known = rec ? bookOf(rec) : null;
          if (rec && known && known.status !== 'reading' && known.status !== 'finished') saveRecord('reading', 'book', { ...rec.data, status: 'reading', startedOn: known.startedOn ?? i.date }, rec.id);
        }
      }
      const r = saveSession(s);
      return 'error' in r ? r.error : null;
    }
    case 'night':
      return writeNight({ date: i.date, bed: i.bed, wake: i.wake, minutes: i.minutes, score: null });
    case 'screen':
      return setMetric('screen', i.date, i.minutes);
    case 'task': {
      const made = addTodo({ title: i.title, priority: 'normal', due: i.due });
      return 'error' in made ? made.error : null;
    }
    case 'wish': {
      const { added, dupes } = addBucket([i.title]);
      return added.length || dupes ? null : 'That wish was empty.';
    }
    case 'rest':
      markRestDay();
      return null;
    case 'unknown':
      return null;
  }
}

/** Save everything understood. Returns the problems, line by line; what worked stays saved. */
export function saveScroll(intents: Intent[]): { saved: number; errors: string[] } {
  const errors: string[] = [];
  let saved = 0;
  withReward(
    () => {
      for (const i of intents) {
        if (i.kind === 'unknown') continue;
        const err = saveOne(i);
        if (err) errors.push(err);
        else saved++;
      }
      return saved > 0;
    },
    intents.some((i) => i.kind === 'rest') ? { rest: true } : {},
  );
  return { saved, errors };
}
