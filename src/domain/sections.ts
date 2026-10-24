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
  /** One kanji that stands for the section (the 技 "techniques" grid, headers, navigation). */
  kanji: string;
}

export const SECTIONS: SectionInfo[] = [
  { id: 'violin', name: 'Violin', full: 'Violin', code: 'CH01', sub: 'practice journal', kanji: '弦' },
  { id: 'coding', name: 'Coding', full: 'Competitive coding', code: 'CH02', sub: 'Road to IOI', kanji: '算' },
  { id: 'sports', name: 'Sports', full: 'Sports', code: 'CH03', sub: 'run · ride · swim · court', kanji: '走' },
  { id: 'gym', name: 'Gym', full: 'Gym', code: 'CH04', sub: 'workout sheet', kanji: '力' },
  { id: 'study', name: 'Study', full: 'School studies', code: 'CH05', sub: 'A-level subjects', kanji: '学' },
  { id: 'chess', name: 'Chess', full: 'Chess', code: 'CH06', sub: 'ratings and games', kanji: '将' },
  { id: 'sleep', name: 'Sleep', full: 'Sleep', code: 'CH07', sub: 'night monitor', kanji: '眠' },
  { id: 'screen', name: 'Screen', full: 'Screen time', code: 'CH08', sub: 'daily totals', kanji: '画' },
  { id: 'cabinet', name: 'Cabinet', full: 'Cabinet', code: 'CH09', sub: 'collection', kanji: '蔵' },
];

/** Kanji for the shared screens. */
export const SYSTEM_KANJI = { home: '家', calendar: '暦', tasks: '務', progress: '覚', log: '録', settings: '設' } as const;

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
