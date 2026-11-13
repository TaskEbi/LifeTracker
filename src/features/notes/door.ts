/** What the ways in (Study, Home) need without loading the notes themselves. */
import { useMemo } from 'react';
import { data } from '../../data/store';
import { useStore } from '../../lib/createStore';
import { cardsIn, notesIn, type CardMarks, type NotesRead } from './actions';

export const NOTES_KANJI = '講';

export function useNotes(): NotesRead {
  const records = useStore(data, (s) => s.lt_records);
  return useMemo(() => notesIn(data.get()), [records]);
}

export function useCards(): CardMarks {
  const records = useStore(data, (s) => s.lt_records);
  return useMemo(() => cardsIn(data.get()), [records]);
}
