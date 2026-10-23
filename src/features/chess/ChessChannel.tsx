import { useEffect, useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { dayOf, ltToday, prefValue, sectionEntries, setPref, useToday, withReward } from '../../data/lt';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { addDays, shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Picks, Source } from '../../ui/i/bits';
import { Bars, Line } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { Sheet } from '../../ui/i/Sheet';
import { chess, loadChess, timeByDay, type Game, type TimeClass } from './api';
import './chess.css';

const DEFAULT_USER = 'GM_TaskTaskPro';
const KINDS = ['Puzzles', 'Study', 'Openings', 'Endgames', 'Lesson', 'Over the board'] as const;
const TC_NAME: Record<TimeClass, string> = { rapid: 'Rapid', blitz: 'Blitz', bullet: 'Bullet', daily: 'Daily' };

interface ChessDetail {
  kind: string;
  from?: 'chess.com';
  games?: number;
}

function ChessSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<ChessDetail>(data.get(), 'chess').find((s) => s.entry.id === editId) : undefined;
  const [kind, setKind] = useState<string>(prev?.detail?.kind ?? 'Puzzles');
  const [minutes, setMinutes] = useState(prev?.entry.minutes ?? 30);
  const [date, setDate] = useState(prev?.entry.date ?? today);
  const [note, setNote] = useState(prev?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const imported = prev?.detail?.from === 'chess.com';
  const save = () => {
    let err: string | null = null;
    withReward(() => {
      const r = saveSession({ section: 'chess', date, minutes, note, subcategory: kind, detail: { ...(prev?.detail ?? {}), kind } }, editId);
      if ('error' in r) err = r.error;
      return !('error' in r);
    });
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit chess session' : 'CH06 · log chess'}
      onClose={closeSheet}
      accent="chess"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      {imported ? (
        <p className="i-note">Logged from {prev!.detail!.games} Chess.com games. The time is the games' own start-to-end; adjust it if you like.</p>
      ) : (
        <Picks label="Kind" value={kind} onChange={setKind} options={KINDS.map((k) => ({ id: k, label: k }))} />
      )}
      <MinutesField value={minutes} onChange={setMinutes} presets={[15, 20, 30, 45, 60]} />
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Themes, an idea worth keeping · optional" aria-label="Notes" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function UserSheet() {
  const [u, setU] = useState(String(prefValue(data.get(), 'chess_username') ?? DEFAULT_USER));
  const ok = /^[A-Za-z0-9_-]{3,25}$/.test(u.trim());
  return (
    <Sheet
      title="Chess.com username"
      onClose={closeSheet}
      accent="chess"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ok} onClick={() => (setPref('chess_username', u.trim()), void loadChess(u.trim(), true), closeSheet())}>
          Save
        </button>
      }
    >
      <input className="i-input" value={u} onChange={(e) => setU(e.target.value)} aria-label="Chess.com username" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <p className="i-note">Only public data is read (ratings and games). No password is needed or stored.</p>
    </Sheet>
  );
}

registerSheet('chess', ChessSheet);
registerSheet('chess-user', UserSheet);

const RES = { win: 'W', loss: 'L', draw: 'D' } as const;

function OnlinePanel({ username }: { username: string }) {
  const s = useStore(chess, (x) => x.s);
  const today = useToday();
  const st = useStore(data, (x) => x);
  const [tc, setTc] = useState<TimeClass | null>(null);
  useEffect(() => void loadChess(username), [username]);

  if (s.status === 'idle' || s.status === 'loading') return <p className="i-note" role="status">Loading {username} from Chess.com…</p>;
  if (s.status === 'error')
    return (
      <div className="i-pnl i-stack">
        <p className="i-error" role="alert">{s.message}</p>
        <Source kind="off">No Chess.com data is shown until it loads. Nothing here is sample data.</Source>
        <button type="button" className="i-btn i-btn--sm" onClick={() => void loadChess(username, true)}>
          Try again
        </button>
      </div>
    );

  const shownTc = tc ?? (s.stats.ratings.find((r) => r.tc !== 'daily')?.tc ?? 'rapid');
  const series = s.games.filter((g) => g.tc === shownTc && g.rated).slice(0, 30).reverse();
  const perDay = timeByDay(s.games, dayOf);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const todayGames = perDay.get(today);
  const already = sectionEntries<ChessDetail>(st, 'chess').some((x) => x.entry.date === today && x.detail?.from === 'chess.com');
  const fetched = new Date(s.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="i-meters">
        {s.stats.ratings.map((r) => (
          <Meter
            key={r.tc}
            value={r.rating}
            label={
              <>
                {TC_NAME[r.tc]}
                {r.best ? ` · best ${r.best}` : ''}
                <br />
                {r.win}W {r.loss}L {r.draw}D
              </>
            }
            onClick={r.tc === 'daily' ? undefined : () => setTc(r.tc)}
            pressed={r.tc === shownTc}
          />
        ))}
        {s.stats.tactics != null && <Meter value={s.stats.tactics} label="Puzzles · highest" />}
        {s.stats.rush != null && <Meter value={s.stats.rush} label="Puzzle Rush · best" />}
      </div>
      <Source kind="live">
        From Chess.com's public API for {username} · fetched {fetched} ·{' '}
        <button type="button" className="i-link" onClick={() => void loadChess(username, true)}>
          refresh
        </button>
      </Source>

      <div className="i-cols">
        <div>
          <H2 aside={`last ${series.length} rated`}>{TC_NAME[shownTc]} rating</H2>
          <div className="i-pnl">
            {series.length > 1 ? (
              <Line values={series.map((g) => g.rating)} labels={series.map(() => '')} long={series.map((g) => `${new Date(g.end * 1000).toLocaleDateString()} vs ${g.opponent}`)} caption={`${TC_NAME[shownTc]} rating over the last ${series.length} rated games`} />
            ) : (
              <p className="i-note">Not enough recent rated {TC_NAME[shownTc].toLowerCase()} games for a trend.</p>
            )}
          </div>
        </div>
        <div>
          <H2 aside="live games · min">Time on Chess.com</H2>
          <div className="i-pnl">
            <Bars values={days.map((d) => Math.round((perDay.get(d)?.seconds ?? 0) / 60))} labels={days.map((d) => shortDay(d).slice(0, 2))} long={days.map((d) => `${shortDay(d)}: ${perDay.get(d)?.games ?? 0} games`)} hi={[6]} caption="Minutes of live games per day, last 7 days" />
          </div>
          {todayGames && (
            <button
              type="button"
              className="i-btn i-btn--sm"
              style={{ marginTop: 8 }}
              disabled={already}
              onClick={() =>
                withReward(() => {
                  const r = saveSession({ section: 'chess', date: today, minutes: Math.max(1, Math.round(todayGames.seconds / 60)), note: null, subcategory: 'Online games', detail: { kind: 'Online games', from: 'chess.com', games: todayGames.games } });
                  return !('error' in r);
                })
              }
            >
              {already ? "Today's games are logged" : `Log today's ${todayGames.games} games (${Math.round(todayGames.seconds / 60)}m)`}
            </button>
          )}
        </div>
      </div>

      <H2 aside={`${s.games.length} in 2 months`}>Recent games</H2>
      <div className="i-pnl i-pnl--flush">
        {s.games.slice(0, 10).map((g: Game) => (
          <a key={g.url} className="i-row i-row--lead" href={g.url} target="_blank" rel="noreferrer">
            <span className={`c-res is-${g.result}`} aria-label={g.result}>
              {RES[g.result]}
            </span>
            <span className="i-row__t">
              <b>
                vs {g.opponent} <span className="i-mono i-small i-dim">({g.opponentRating})</span>
              </b>
              <small>
                {g.tc === 'other' ? g.timeControl : TC_NAME[g.tc]} · {g.white ? 'white' : 'black'}
                {g.opening ? ` · ${g.opening}` : ''}
                {g.rated ? '' : ' · unrated'}
              </small>
            </span>
            <span className="i-row__n">{g.rating}</span>
          </a>
        ))}
        {!s.games.length && <p className="i-note" style={{ padding: '12px 0' }}>No games in the last two months.</p>}
      </div>
    </>
  );
}

export function ChessChannel() {
  const st = useStore(data, (s) => s);
  const username = String(prefValue(st, 'chess_username') ?? DEFAULT_USER);
  const sessions = useMemo(() => sectionEntries<ChessDetail>(st, 'chess'), [st]);
  return (
    <div style={accent('chess')}>
      <ChannelHead id="chess" />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'chess' })}>
        <Icon name="plus" /> Log puzzles or study
      </button>
      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'chess-user' })}>{username}</button>}>Chess.com</H2>
      <OnlinePanel username={username} />

      <H2 aside={`${sessions.length} sessions`}>Logged</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 10).map((s) => (
            <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'chess', editId: s.entry.id })}>
              <span className="i-row__t">
                <b>{s.detail?.kind ?? 'Chess'}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                <small>{s.detail?.from ? `${s.detail.games} games from Chess.com` : s.entry.note || (s.detail ? '' : 'From the Daily Log')}</small>
              </span>
              <span className="i-row__n">{s.entry.minutes}m</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Puzzles, study and games you log count towards levels; Chess.com games only count once you log them.</p>
        )}
      </div>
      <RelatedTasks section="chess" />
    </div>
  );
}
