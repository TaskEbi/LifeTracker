/**
 * 前回 / 次回予告: last week as an anime recap. Full-screen manga panels from the real numbers, tap
 * through or let them run, ending on a "next time on…" with this week's boss. Nothing here is
 * invented: a panel with nothing to show isn't played. Still and manual under reduced motion.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useBoss, useQuests, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { episodePanels, episodeTitle, weekChange, type EpisodePanel } from '../../domain/fun/episode';
import { addDays, rangeLabel, shortDay } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { BOSSES } from '../../domain/progress/boss';
import type { XpSection } from '../../domain/progress/engine';
import type { WeekRecap } from '../../domain/progress/recap';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { playStyle } from '../../ui/i/fx/celebrate';
import { BossArt } from './BossArt';
import './episode.css';

const PANEL_MS = 3600;
const secName = (s: XpSection) => (s === 'general' ? 'Other topics' : s === 'quests' ? 'Quests' : sectionInfo(s).name);
const secKanji = (s: XpSection) => (s === 'general' || s === 'quests' ? '他' : sectionInfo(s).kanji);

/** Counts up to a number of minutes, shown as time. */
function CountUp({ minutes, run }: { minutes: number; run: boolean }) {
  const [v, setV] = useState(run ? 0 : minutes);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1100);
      setV(Math.round(minutes * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [minutes, run]);
  return <>{formatMinutes(v)}</>;
}

function Panel({ kind, recap, run }: { kind: EpisodePanel; recap: WeekRecap; run: boolean }) {
  const boss = useBoss();
  const quests = useQuests();
  const today = useToday();
  const events = useStore(data, (s) => s.lt_events);
  const nextEvent = useMemo(() => occurrences(events.values(), today, addDays(today, 7)).find((o) => !o.cancelled), [events, today]);

  if (kind === 'title') {
    return (
      <section className="ep-p ep-title">
        <i className="ep-lines" aria-hidden="true" />
        <span className="ep-title__k" lang="ja" aria-hidden="true">前回</span>
        <p className="ep-title__on">Previously on LifeTracker</p>
        <h2>{episodeTitle(recap)}</h2>
        <p className="ep-title__date">{rangeLabel(recap.start, recap.end)}</p>
      </section>
    );
  }
  if (kind === 'time') {
    const ch = weekChange(recap);
    return (
      <section className="ep-p ep-time">
        <i className="ep-lines" aria-hidden="true" />
        <p className="ep-small">You put in</p>
        <b className="ep-time__n">
          <CountUp minutes={recap.minutes} run={run} />
        </b>
        <p className="ep-small">
          over {recap.activeDays} {recap.activeDays === 1 ? 'day' : 'days'} and {recap.sessions} {recap.sessions === 1 ? 'session' : 'sessions'}
        </p>
        {ch.text && <p className={`ep-time__ch${ch.up === true ? ' is-up' : ch.up === false ? ' is-down' : ''}`}>{ch.text}</p>}
      </section>
    );
  }
  if (kind === 'sections') {
    const top = recap.sections.slice(0, 4);
    const max = top[0]?.minutes ?? 1;
    return (
      <section className="ep-p ep-secs">
        <h2>Where it went</h2>
        <ul>
          {top.map((s, i) => (
            <li key={s.id} style={{ '--i': i, '--c': `var(--c-${s.id})`, '--w': `${Math.max(10, (s.minutes / max) * 100)}%` } as CSSProperties}>
              <span className="ep-secs__k" lang="ja" aria-hidden="true">{secKanji(s.id)}</span>
              <span className="ep-secs__t">
                <b>{secName(s.id)}</b>
                <i aria-hidden="true" />
              </span>
              <em>{formatMinutes(s.minutes)}</em>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (kind === 'facts') {
    const facts: [string, string][] = [];
    if (recap.bestDay) facts.push(['Best day', `${shortDay(recap.bestDay.date)} · ${formatMinutes(recap.bestDay.minutes)}`]);
    if (recap.longest >= 15) facts.push(['Longest session', formatMinutes(recap.longest)]);
    if (recap.quests) facts.push(['Quests cleared', String(recap.quests)]);
    if (recap.tasks) facts.push(['Tasks done', String(recap.tasks)]);
    if (recap.nights) facts.push(['Nights logged', String(recap.nights)]);
    return (
      <section className="ep-p ep-facts">
        {facts.slice(0, 4).map(([k, v], i) => (
          <div key={k} className="ep-facts__p" style={{ '--i': i } as CSSProperties}>
            <small>{k}</small>
            <b>{v}</b>
          </div>
        ))}
      </section>
    );
  }
  if (kind === 'boss' && recap.boss) {
    const def = BOSSES.find((b) => b.name === recap.boss!.name) ?? BOSSES[0];
    const won = !!recap.boss.defeatedOn;
    return (
      <section className={`ep-p ep-boss${won ? ' is-won' : ''}`}>
        <i className="ep-lines" aria-hidden="true" />
        <div className="ep-boss__mask">
          <BossArt boss={def} down={won} />
          <span className="ep-stamp" lang="ja" aria-hidden="true">{won ? '討伐' : '逃走'}</span>
        </div>
        <h2>{recap.boss.name}</h2>
        <p className="ep-small">{won ? `Defeated on ${shortDay(recap.boss.defeatedOn!)}.` : `Got away with ${Math.max(0, recap.boss.hp - recap.boss.damage)} HP left.`}</p>
      </section>
    );
  }
  // next time on…
  const open = quests.weekly.quests.find((q) => !q.doneOn);
  return (
    <section className="ep-p ep-next">
      <i className="ep-lines" aria-hidden="true" />
      <span className="ep-next__k" lang="ja" aria-hidden="true">次回予告</span>
      <p className="ep-title__on">Next time on LifeTracker</p>
      <div className="ep-next__mask">
        <BossArt boss={boss.boss} down={!!boss.defeatedOn} />
      </div>
      <h2>{boss.defeatedOn ? `${boss.boss.name} falls!` : `${boss.boss.name} appears!`}</h2>
      <ul className="ep-next__list">
        <li>{boss.defeatedOn ? 'Already beaten this week.' : `Weak to ${sectionInfo(boss.boss.weak).name.toLowerCase()}. ${Math.max(0, boss.hp - boss.damage)} HP to go.`}</li>
        {open && <li>Weekly quest: {open.title.toLowerCase()}.</li>}
        {nextEvent && <li>{nextEvent.event.title}, {shortDay(nextEvent.date)}.</li>}
      </ul>
      <p className="ep-next__end" lang="ja">お楽しみに</p>
    </section>
  );
}

function Player({ recap, onClose }: { recap: WeekRecap; onClose: () => void }) {
  const panels = useMemo(() => episodePanels(recap), [recap]);
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
    <div className={`ep${full ? '' : ' ep--calm'}`} role="dialog" aria-modal="true" aria-label="Last week's episode">
      <div className="ep-pips" aria-hidden="true">
        {panels.map((p, n) => (
          <i key={p} className={n < i ? 'is-done' : n === i ? 'is-now' : ''} style={{ '--ms': `${PANEL_MS}ms` } as CSSProperties} />
        ))}
      </div>
      <div className="ep-stage" key={i} aria-live="polite">
        <Panel kind={panels[i]} recap={recap} run={full} />
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

/** The button that opens it. */
export function PlayEpisode({ recap }: { recap: WeekRecap }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ep-play" onClick={() => setOpen(true)}>
        <span aria-hidden="true">▶</span> Watch last week's episode
      </button>
      {open && <Player recap={recap} onClose={() => setOpen(false)} />}
    </>
  );
}
