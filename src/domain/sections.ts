import type { SectionId } from '../data/types';

export interface SectionInfo {
  id: SectionId;
  /** Short label for keys and channel tabs. */
  name: string;
  full: string;
  /** Channel code shown on the instrument: CH01…CH09. */
  code: string;
  /** What the channel is, in a few words. */
  sub: string;
}

export const SECTIONS: SectionInfo[] = [
  { id: 'violin', name: 'Violin', full: 'Violin', code: 'CH01', sub: 'practice journal' },
  { id: 'coding', name: 'Coding', full: 'Competitive coding', code: 'CH02', sub: 'Road to IOI' },
  { id: 'sports', name: 'Sports', full: 'Sports', code: 'CH03', sub: 'run · ride · swim · court' },
  { id: 'gym', name: 'Gym', full: 'Gym', code: 'CH04', sub: 'workout sheet' },
  { id: 'study', name: 'Study', full: 'School studies', code: 'CH05', sub: 'A-level subjects' },
  { id: 'chess', name: 'Chess', full: 'Chess', code: 'CH06', sub: 'ratings and games' },
  { id: 'sleep', name: 'Sleep', full: 'Sleep', code: 'CH07', sub: 'night monitor' },
  { id: 'screen', name: 'Screen', full: 'Screen time', code: 'CH08', sub: 'daily totals' },
  { id: 'cabinet', name: 'Cabinet', full: 'Cabinet', code: 'CH09', sub: 'collection' },
];

export const sectionInfo = (id: SectionId): SectionInfo => SECTIONS.find((s) => s.id === id)!;

/** Default Daily Log topic names each timed section matches on first run (case-insensitive). */
export const TOPIC_NAME_HINTS: Record<string, string[]> = {
  violin: ['violin'],
  coding: ['competitive programming', 'competitive coding', 'coding', 'programming', 'road to ioi'],
  sports: ['sports', 'sport', 'exercise'],
  gym: ['gym', 'strength'],
  study: ['schoolwork', 'school', 'study', 'studies', 'homework'],
  chess: ['chess'],
};
