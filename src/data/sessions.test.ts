import { beforeEach, describe, expect, it } from 'vitest';
import { ltToday, setPref } from './lt';
import { saveSession } from './sessions';
import { commit, data } from './store';
import type { LogTopic } from './types';

const T = '2026-10-01T00:00:00Z';
const topic = (id: string, name: string, extra: Partial<LogTopic> = {}): LogTopic => ({
  id, parent_id: null, name, color: 'blue', sort_order: 1, archived_at: null, created_at: T, updated_at: T, deleted_at: null, ...extra,
});

describe('saveSession', () => {
  beforeEach(() => data.set({ log_topics: new Map(), log_entries: new Map(), lt_details: new Map(), lt_prefs: new Map() }));

  it('brings back a section topic that was archived in Curio Cabinet', () => {
    commit('log_topics', [topic('cp', 'Competitive programming', { archived_at: T })]);
    setPref('section_topics', { coding: 'cp' });
    const saved = saveSession({ section: 'coding', date: ltToday(), minutes: 30, note: null, detail: null });
    expect(saved).toHaveProperty('id');
    expect(data.get().log_topics.get('cp')!.archived_at).toBeNull();
    expect(data.get().log_entries.get((saved as { id: string }).id)!.topic_id).toBe('cp');
  });

  it("says why when the archived topic can't come back", () => {
    commit('log_topics', [topic('cp', 'Competitive programming', { archived_at: T }), topic('cp2', 'competitive programming', { sort_order: 2 })]);
    setPref('section_topics', { coding: 'cp' });
    const saved = saveSession({ section: 'coding', date: ltToday(), minutes: 30, note: null, detail: null });
    expect(saved).toEqual({ error: expect.stringContaining('Rename one of them first') });
    expect(data.get().log_entries.size).toBe(0);
  });
});
