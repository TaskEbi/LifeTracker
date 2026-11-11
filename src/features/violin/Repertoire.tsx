/**
 * The repertoire, /violin/repertoire: every piece you've played, on the stand now or from before, with when you
 * learned it, its level, how often you practised it and where you performed it. Pieces are the same `piece`
 * records the stand uses; past ones are archived. Performances come from the Stage.
 */
import { useMemo, useState } from 'react';
import { navigate } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { sectionEntries, sectionRecords } from '../../data/lt';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { showsIn } from '../stage/store';
import { ViolinArt } from './Art';
import { itemStats, pieceOf, pieceSpan, pieceYear, sortRepertoire, type Piece, type RepSort, type ViolinDetail } from './model';
import './repertoire.css';

type Filter = 'all' | 'stand' | 'past' | 'performed' | 'fav';

export function Repertoire() {
  const st = useStore(data, (s) => s);
  const pieces = useMemo(() => sectionRecords(st, 'violin', 'piece').map(pieceOf), [st]);
  const sessions = useMemo(() => sectionEntries<ViolinDetail>(st, 'violin'), [st]);
  const performed = useMemo(() => {
    const by = new Map<string, { n: number; last: string; title: string }>();
    for (const s of showsIn(st)) {
      if (s.type !== 'violin') continue;
      for (const id of s.pieces) {
        const p = by.get(id);
        by.set(id, { n: (p?.n ?? 0) + 1, last: !p || s.date > p.last ? s.date : p.last, title: !p || s.date > p.last ? s.title : p.title });
      }
    }
    return by;
  }, [st]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<RepSort>('year');
  const [q, setQ] = useState('');

  const composers = useMemo(() => {
    const by = new Map<string, number>();
    for (const p of pieces) if (p.composer) by.set(p.composer, (by.get(p.composer) ?? 0) + 1);
    return [...by.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [pieces]);
  const years = useMemo(() => {
    const ys = pieces.map((p) => pieceYear(p)).filter((y): y is number => y != null);
    if (new Set(ys).size < 2) return null;
    const from = Math.min(...ys);
    const to = Math.max(...ys);
    const list = Array.from({ length: to - from + 1 }, (_, i) => from + i).slice(-12);
    return { list, counts: list.map((y) => ys.filter((v) => v === y).length) };
  }, [pieces]);

  const needle = q.trim().toLowerCase();
  const shown = sortRepertoire(
    pieces.filter(
      (p) =>
        (filter === 'all' || (filter === 'stand' && !p.archived) || (filter === 'past' && p.archived) || (filter === 'performed' && performed.has(p.id)) || (filter === 'fav' && p.fav)) &&
        (!needle || `${p.title} ${p.composer} ${p.level} ${p.group} ${p.note}`.toLowerCase().includes(needle)),
    ),
    sort,
  );
  const groups = new Map<string, Piece[]>();
  for (const p of shown) {
    const k = sort === 'composer' ? p.composer || 'Composer not noted' : sort === 'title' ? (p.title[0] ?? '#').toUpperCase() : !p.archived ? 'On the stand' : String(pieceYear(p) ?? 'Undated');
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <div style={accent('violin')}>
      <ChannelHead id="violin" sub="repertoire" art={<ViolinArt />} />
      <button type="button" className="i-link" onClick={() => navigate('violin')}>
        ◀ Back to the journal
      </button>
      <h2 className="rp-h1">Repertoire</h2>
      <div className="i-meters">
        <Meter value={pieces.length} label="Pieces" />
        <Meter value={composers.length} label="Composers" />
        <Meter value={performed.size} label="Performed" />
        <Meter value={pieces.filter((p) => !p.archived).length} label="On the stand" />
      </div>
      <div className="rp-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'violin-piece', kind: 'piece', past: true })}>
          <Icon name="plus" size={16} /> Add a past piece
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'violin-pieces' })}>
          Add many at once
        </button>
      </div>

      {!pieces.length ? (
        <div className="i-pnl i-stack">
          <p className="i-note">Your repertoire is every piece you’ve learned, from your first one to the one on the stand now. Add the old ones (“Add many at once” takes a whole list) and the stand’s pieces join them here when you finish with them.</p>
        </div>
      ) : (
        <>
          {composers.length > 0 && (
            <p className="rp-composers" aria-label="Most played composers">
              {composers.slice(0, 6).map(([c, n]) => (
                <button key={c} type="button" className="rp-chip" onClick={() => setQ(q === c ? '' : c)} aria-pressed={q === c}>
                  {c} <small>{n}</small>
                </button>
              ))}
            </p>
          )}
          {years && (
            <div className="i-pnl">
              <Bars values={years.counts} labels={years.list.map((y) => `'${String(y).slice(2)}`)} long={years.list.map(String)} hi={[years.list.length - 1]} max={Math.max(3, Math.ceil(Math.max(...years.counts) / 3) * 3)} caption="Pieces finished (or started) per year" height={110} />
            </div>
          )}
          <div className="rp-tools">
            <div className="i-picks" role="group" aria-label="Show">
              {(
                [
                  ['all', 'All'],
                  ['stand', 'On the stand'],
                  ['past', 'Past'],
                  ['performed', 'Performed'],
                  ['fav', '♥'],
                ] as [Filter, string][]
              ).map(([id, label]) => (
                <button key={id} type="button" className="i-pick" aria-pressed={filter === id} onClick={() => setFilter(id)} aria-label={id === 'fav' ? 'Favourites' : undefined}>
                  {label}
                </button>
              ))}
            </div>
            <div className="i-picks" role="group" aria-label="Sort by">
              {(
                [
                  ['year', 'Year'],
                  ['composer', 'Composer'],
                  ['title', 'A–Z'],
                ] as [RepSort, string][]
              ).map(([id, label]) => (
                <button key={id} type="button" className="i-pick" aria-pressed={sort === id} onClick={() => setSort(id)}>
                  {label}
                </button>
              ))}
            </div>
            <input className="i-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, composer, level" aria-label="Search the repertoire" />
          </div>
          {[...groups.entries()].map(([k, list]) => (
            <section key={k} aria-label={k}>
              <H2 aside={`${list.length}`}>{k}</H2>
              <div className="i-pnl i-pnl--flush">
                {list.map((p) => {
                  const s = itemStats(sessions, p.id);
                  const perf = performed.get(p.id);
                  return (
                    <button key={p.id} type="button" className="i-row rp-row" onClick={() => openSheet({ type: 'violin-piece', editId: p.id })}>
                      <span className="i-row__t">
                        <b>
                          {sort !== 'composer' && p.composer ? <span className="rp-composer">{p.composer} </span> : null}
                          {p.title}
                          {p.fav ? ' ♥' : ''}
                        </b>
                        <small>{[p.level, pieceSpan(p), p.status && p.status !== 'Learned' ? p.status : '', s.sessions ? `practised ${s.sessions}×` : '', perf ? `performed ${perf.n}× · last ${perf.title} ${shortDay(perf.last)}` : ''].filter(Boolean).join(' · ') || 'No details yet'}</small>
                      </span>
                      {perf && (
                        <span className="rp-perf" aria-label={`Performed ${perf.n} times`}>
                          奏<small>{perf.n}</small>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {!shown.length && <p className="i-note">Nothing matches.</p>}
        </>
      )}
    </div>
  );
}
