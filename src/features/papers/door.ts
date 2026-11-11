/** What the ways in (Study, Home) need without loading the paper list. */
import { useMemo } from 'react';
import { data } from '../../data/store';
import { useStore } from '../../lib/createStore';
import { papersIn, type PapersState } from './actions';

export const PAPERS_KANJI = '卷';

export function usePapers(): PapersState {
  const st = useStore(data, (s) => s);
  return useMemo(() => papersIn(st), [st]);
}
