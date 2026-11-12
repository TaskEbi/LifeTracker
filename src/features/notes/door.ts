/** What the ways in (Study, Home) need without loading the notes themselves. */
import { useMemo } from 'react';
import { data } from '../../data/store';
import { useStore } from '../../lib/createStore';
import { notesIn, type NotesRead } from './actions';

export const NOTES_KANJI = '講';

export function useNotes(): NotesRead {
  const records = useStore(data, (s) => s.lt_records);
  return useMemo(() => notesIn(data.get()), [records]);
}
