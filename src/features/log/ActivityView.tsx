/** All activity: every Daily Log entry (including topics no section uses), with a plain editor. */
import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { getSectionTopics, ltToday, topicSectionMap, useSectionTopics } from '../../data/lt';
import { updateEntry } from '../../data/logActions';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import type { SectionId } from '../../data/types';
import { longDay } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { SECTIONS, sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips } from '../../ui/i/bits';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';

function EntrySheet({ spec }: { spec: SheetSpec }) {
  const st = data.get();
  const e = st.log_entries.get(spec.editId as string);
  const today = ltToday();
  const [date, setDate] = useState(e?.date ?? today);
  const [minutes, setMinutes] = useState(e?.minutes ?? 30);
  const [topic, setTopic] = useState(e?.topic_id ?? '');
  const [sub, setSub] = useState(e?.subcategory_id ?? '');
  const [note, setNote] = useState(e?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  if (!e) return null;
  const topics = [...st.log_topics.values()].filter((t) => !t.deleted_at && (!t.archived_at || t.id === e.topic_id || t.id === e.subcategory_id));
  const subs = topics.filter((t) => t.parent_id === topic);
  const detail = st.lt_details.get(e.id);
  return (
    <Sheet
      title="Edit entry"
      onClose={closeSheet}
      footer={
        <>
          <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(e.id, 'Entry deleted'), closeSheet())}>
            Delete
          </button>
          <button
            type="button"
            className="i-btn i-btn--sig i-btn--block"
            onClick={() => {
              const err = updateEntry(e.id, { date, minutes, topic_id: topic, subcategory_id: sub || null, note });
              if (err) setError(err);
              else closeSheet();
            }}
          >
            Save
          </button>
        </>
      }
    >
      {detail && !detail.deleted_at && <p className="i-note">This entry has {sectionInfo(detail.section).name.toLowerCase()} details; edit it from that channel to change them. Changes here keep them.</p>}
      <label className="i-field">
        <span className="i-lab">Topic</span>
        <select className="i-input" value={topic} onChange={(ev) => (setTopic(ev.target.value), setSub(''))}>
          {topics.filter((t) => !t.parent_id).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      {subs.length > 0 && (
        <label className="i-field">
          <span className="i-lab">Subcategory</span>
          <select className="i-input" value={sub} onChange={(ev) => setSub(ev.target.value)}>
            <option value="">None</option>
            {subs.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      )}
      <MinutesField value={minutes} onChange={setMinutes} />
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={1000} placeholder="Note" aria-label="Note" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}
registerSheet('log-entry', EntrySheet);

type Filter = SectionId | 'all' | 'unmapped';
const PAGE = 60;

export function ActivityView() {
  const entries = useStore(data, (s) => s.log_entries);
  const topics = useStore(data, (s) => s.log_topics);
  const details = useStore(data, (s) => s.lt_details);
  const mapping = useSectionTopics();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(PAGE);
  const map = useMemo(() => topicSectionMap(topics.values(), mapping ?? getSectionTopics()), [topics, mapping]);
  const sectionOf = (id: string, topicId: string): SectionId | null => {
    const d = details.get(id);
    return d && !d.deleted_at ? d.section : map.get(topicId) ?? null;
  };
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...entries.values()]
      .filter((e) => !e.deleted_at)
      .filter((e) => {
        const s = sectionOf(e.id, e.topic_id);
        if (filter === 'unmapped' ? s : filter !== 'all' && s !== filter) return false;
        if (!needle) return true;
        const name = `${topics.get(e.topic_id)?.name ?? ''} ${e.subcategory_id ? topics.get(e.subcategory_id)?.name ?? '' : ''} ${e.note ?? ''}`.toLowerCase();
        return name.includes(needle);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, topics, details, map, filter, q]);
  const total = list.reduce((a, e) => a + e.minutes, 0);
  const days: [string, typeof list][] = [];
  for (const e of list.slice(0, shown)) {
    const last = days[days.length - 1];
    if (last && last[0] === e.date) last[1].push(e);
    else days.push([e.date, [e]]);
  }

  return (
    <div>
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">SYS · Daily Log</span>
          <h1>All activity</h1>
        </div>
        <div className="i-chhead__lv">
          ENTRIES<b>{list.length}</b>
          {formatMinutes(total)}
        </div>
      </header>
      <Chips
        label="Filter"
        value={filter}
        onChange={(v) => (setFilter(v), setShown(PAGE))}
        options={[{ id: 'all' as const, label: 'All' }, ...SECTIONS.filter((s) => ['violin', 'coding', 'sports', 'gym', 'study', 'chess'].includes(s.id)).map((s) => ({ id: s.id, label: s.name, c: s.id })), { id: 'unmapped' as const, label: 'Other topics' }]}
      />
      <input className="i-input" type="search" value={q} onChange={(e) => (setQ(e.target.value), setShown(PAGE))} placeholder="Search topics and notes" aria-label="Search" style={{ margin: '8px 0' }} />
      {days.length ? (
        days.map(([date, es]) => (
          <section key={date} aria-label={longDay(date)}>
            <h2 className="i-lab" style={{ margin: '14px 0 4px' }}>
              {longDay(date)} · {formatMinutes(es.reduce((a, e) => a + e.minutes, 0))}
            </h2>
            <div className="i-pnl i-pnl--flush">
              {es.map((e) => {
                const s = sectionOf(e.id, e.topic_id);
                const t = topics.get(e.topic_id);
                const sub = e.subcategory_id ? topics.get(e.subcategory_id) : undefined;
                return (
                  <button key={e.id} type="button" className="i-row" style={s ? accent(s) : undefined} onClick={() => openSheet({ type: 'log-entry', editId: e.id })}>
                    <span className="i-row__t">
                      <b>
                        <span className="i-mono i-small" style={{ color: s ? 'var(--c)' : 'var(--fg-3)' }}>{s ? sectionInfo(s).code : '—'}</span> {t?.name ?? 'Unknown topic'}
                        {sub ? ` · ${sub.name}` : ''}
                      </b>
                      {e.note && <small>{e.note}</small>}
                    </span>
                    <span className="i-row__n">{formatMinutes(e.minutes)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <p className="i-note">No entries{filter !== 'all' || q ? ' match' : ' yet'}.</p>
      )}
      {list.length > shown && (
        <button type="button" className="i-btn i-btn--block" style={{ marginTop: 12 }} onClick={() => setShown(shown + PAGE)}>
          Show more ({list.length - shown} left)
        </button>
      )}
    </div>
  );
}
