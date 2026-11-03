/** 映写室: your year so far as a film, from the records of that year. Tap through or let it run. */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { progressInput, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { monthLabel, reelPanels, reelYears, yearReel, type ReelPanel, type YearReel } from '../../../domain/hq/wrapped';
import { shortDay } from '../../../domain/log/dates';
import { formatMinutes } from '../../../domain/log/duration';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent } from '../../../ui/i/bits';
import { playStyle } from '../../../ui/i/fx/celebrate';
import { bucketItems } from '../../bucket/actions';
import '../../progress/episode.css';
import { booksIn } from '../../reading/actions';
import { RoomHead } from '../HqView';
import { useHq } from '../store';

const PANEL_MS = 4200;
const hours = (m: number) => Math.round(m / 60).toLocaleString('en-GB');

function Panel({ kind, r }: { kind: ReelPanel; r: YearReel }) {
  const partial = r.through.slice(5) !== '12-31';
  switch (kind) {
    case 'title':
      return (
        <section className="cm-p">
          <span className="cm-k" lang="ja" aria-hidden="true">
            {r.year}年
          </span>
          <h2>{partial ? `${r.year}, so far` : `Your ${r.year}`}</h2>
          <p>A film, from your own records.</p>
        </section>
      );
    case 'time':
      return (
        <section className="cm-p">
          <p>You put in</p>
          <b className="cm-big">{hours(r.minutes)} hours</b>
          <p>
            over {r.days} days and {r.sessions.toLocaleString('en-GB')} sessions.
          </p>
          {r.bestMonth && <p>{monthLabel(r.bestMonth.month)} was your biggest month: {hours(r.bestMonth.minutes)} hours.</p>}
        </section>
      );
    case 'sections': {
      const top = r.sections.slice(0, 5);
      return (
        <section className="cm-p">
          <p>It went on</p>
          <ul className="cm-bars">
            {top.map((s) => (
              <li key={s.id} style={accent(s.id)}>
                <span>{sectionInfo(s.id).name}</span>
                <i style={{ width: `${(s.minutes / top[0].minutes) * 100}%` }} />
                <b>{hours(s.minutes)} h</b>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case 'best':
      return (
        <section className="cm-p">
          <p>Your biggest day</p>
          <b className="cm-big">{shortDay(r.bestDay!.date)}</b>
          <p>{formatMinutes(r.bestDay!.minutes)} in a single day.</p>
        </section>
      );
    case 'miles':
      return (
        <section className="cm-p">
          <p>You covered</p>
          <b className="cm-big">{r.km.toLocaleString('en-GB')} km</b>
          {r.distanceLine && <p>{r.distanceLine}</p>}
        </section>
      );
    case 'nights':
      return (
        <section className="cm-p">
          <p>You logged</p>
          <b className="cm-big">{r.nights} nights</b>
          {r.avgSleep != null && <p>Averaging {formatMinutes(r.avgSleep)}.</p>}
          {r.screenAvg != null && <p>Screens took {formatMinutes(r.screenAvg)} a day.</p>}
        </section>
      );
    case 'weather':
      return (
        <section className="cm-p">
          <p>Inside, it was mostly</p>
          <b className="cm-big" lang="ja">
            {r.weather!.kanji}
          </b>
          <p>
            {r.weather!.name}, {Math.round(r.weather!.share * 100)}% of the {r.moodDays} days you checked in.
          </p>
        </section>
      );
    case 'trophies':
      return (
        <section className="cm-p">
          <p>On the shelf</p>
          <ul className="cm-list">
            {r.books > 0 && <li>{r.books} {r.books === 1 ? 'book' : 'books'} finished</li>}
            {r.wishes > 0 && <li>{r.wishes} {r.wishes === 1 ? 'wish' : 'wishes'} crossed off</li>}
            {r.tasks > 0 && <li>{r.tasks.toLocaleString('en-GB')} tasks done</li>}
            {r.capsules > 0 && <li>{r.capsules} {r.capsules === 1 ? 'letter' : 'letters'} sealed for later</li>}
          </ul>
        </section>
      );
    case 'end':
      return (
        <section className="cm-p">
          <span className="cm-k" lang="ja" aria-hidden="true">
            {partial ? '続く' : '完'}
          </span>
          <h2>{partial ? 'To be continued.' : 'The end.'}</h2>
          <p>{partial ? 'The rest of the year isn’t written yet.' : 'On to the next one.'}</p>
        </section>
      );
  }
}

function Player({ r, onClose }: { r: YearReel; onClose: () => void }) {
  const panels = useMemo(() => reelPanels(r), [r]);
  const [i, setI] = useState(0);
  const full = playStyle() === 'full';
  const closeBtn = useRef<HTMLButtonElement>(null);
  const last = i === panels.length - 1;
  const go = useCallback((d: 1 | -1) => setI((x) => Math.max(0, Math.min(panels.length - 1, x + d))), [panels.length]);
  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose]);
  useEffect(() => {
    if (!full || last) return;
    const t = window.setTimeout(() => go(1), PANEL_MS);
    return () => window.clearTimeout(t);
  }, [full, i, last, go]);
  return createPortal(
    <div className={`ep${full ? '' : ' ep--calm'}`} role="dialog" aria-modal="true" aria-label={`Your ${r.year}`}>
      <div className="ep-pips" aria-hidden="true">
        {panels.map((p, n) => (
          <i key={p} className={n < i ? 'is-done' : n === i ? 'is-now' : ''} style={{ '--ms': `${PANEL_MS}ms` } as CSSProperties} />
        ))}
      </div>
      <div className="ep-stage" key={i} aria-live="polite">
        <Panel kind={panels[i]} r={r} />
      </div>
      <div className="ep-nav">
        <button type="button" className="ep-btn" disabled={i === 0} onClick={() => go(-1)}>
          Back
        </button>
        <button ref={closeBtn} type="button" className="ep-btn" onClick={onClose}>
          Close
        </button>
        <button type="button" className="ep-btn ep-btn--go" onClick={() => (last ? onClose() : go(1))}>
          {last ? 'Done' : 'Next'}
        </button>
      </div>
    </div>,
    document.querySelector('.i-shell') ?? document.body,
  );
}

export function CinemaRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const input = progressInput(st, today);
  const years = useMemo(() => reelYears(input, hq.checkIns), [input, hq.checkIns]);
  const reels = useMemo(() => {
    const ctx = {
      checkIns: hq.checkIns,
      bookDates: booksIn(st).filter((b) => b.status === 'finished' && b.finishedOn).map((b) => b.finishedOn!),
      wishDates: bucketItems(st).done.map((b) => b.done_at!.slice(0, 10)),
      capsulesSealed: hq.capsules.map((c) => c.sealedOn),
    };
    return years.map((y) => yearReel(input, y, ctx));
  }, [years, input, st, hq.checkIns, hq.capsules]);
  const [playing, setPlaying] = useState<YearReel | null>(null);
  return (
    <div>
      <RoomHead room="cinema" />
      {reels.length ? (
        <div className="cm-reels">
          {reels.map((r) => (
            <button key={r.year} type="button" className="cm-reel" onClick={() => setPlaying(r)}>
              <span className="cm-reel__play" aria-hidden="true">
                ▶
              </span>
              <span>
                <b>{r.through.slice(5) === '12-31' ? `${r.year}` : `${r.year}, so far`}</b>
                <small>
                  {hours(r.minutes)} hours · {r.days} days
                  {r.km ? ` · ${Math.round(r.km)} km` : ''}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing on film yet. Log something and there’s a year to watch.</p>
      )}
      <p className="i-note" style={{ marginTop: 10 }}>Every number comes from your own records, and anything you didn’t log just isn’t in the film.</p>
      {playing && <Player r={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
