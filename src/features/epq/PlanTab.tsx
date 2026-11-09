/**
 * EPQ → Plan (/study/epq/plan): the research plan from the handover, in note form. Hours per
 * block against what's been logged, the gates, a to-do list, the decisions to log on ProjectQ,
 * questions for the supervisor, risks, and leads for the sources library. Ticks are lt_records.
 */
import type { CSSProperties, ReactNode } from 'react';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { longDate } from '../../domain/epq/model';
import { BLOCKS, blockProgress, CASE_STUDY, CUT_ORDER, DECISIONS, EXPERIMENTS, FOR_EMMA, GATES, LEADS, QUESTION, RISKS, RULES, SETUP, SOURCE_GAPS, SUCCESS, TODO, type Check } from '../../domain/epq/plan';
import { dayCount, shortDay } from '../../domain/log/dates';
import { H2 } from '../../ui/i/bits';
import { toggleCheck, type EpqState } from './actions';

function Tick({ c, done, today, extra }: { c: Check; done?: string; today: string; extra?: ReactNode }) {
  return (
    <div className={`epq-ck${done ? ' is-done' : ''}`}>
      <button type="button" className="epq-ck__box" role="checkbox" aria-checked={!!done} aria-label={c.text} onClick={() => toggleCheck(c.key, today)}>
        {done ? '✓' : ''}
      </button>
      <span className="epq-ck__t">
        {c.text}
        {done && <small> · {shortDay(done, today)}</small>}
      </span>
      {extra}
    </div>
  );
}

export function PlanTab({ s }: { s: EpqState }) {
  const today = useToday();
  const blocks = blockProgress(s.sessions);
  const now = blocks.find((b) => today >= b.from && today <= b.to);
  const plannedToDate = BLOCKS.filter((b) => b.to < today).reduce((a, b) => a + b.hours, 0) + (now ? (now.hours * Math.max(0, dayCount(now.from, today))) / dayCount(now.from, now.to) : 0);
  const doneHours = s.sessions.reduce((a, x) => a + x.minutes, 0) / 60;
  const todoDone = TODO.filter((t) => s.checks.has(t.key)).length;
  const logged = DECISIONS.filter((d) => s.checks.has(d.key)).length;
  const inLibrary = new Set(s.sources.map((x) => x.title.toLowerCase()));
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="epq-plan">
      <div className="i-pnl epq-rules" role="note" aria-label="Rules for the EPQ">
        <b>House rules</b>
        <ul>
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <H2>The question</H2>
      <div className="i-pnl epq-q">
        <p className="epq-q__rq">“{QUESTION}”</p>
        <p className="i-note">{SETUP}</p>
        <ol className="epq-exps">
          {EXPERIMENTS.map((e) => (
            <li key={e.n}>
              <b>
                {e.n}. {e.title}
              </b>
              <span>{e.what}</span>
              <em>Shows: {e.shows}</em>
            </li>
          ))}
        </ol>
        <p className="i-note">{CASE_STUDY}</p>
      </div>

      <H2 aside={`${todoDone}/${TODO.length}`}>To do</H2>
      <div className="i-pnl i-pnl--flush" aria-label="EPQ to-do list">
        {TODO.map((t) => (
          <Tick
            key={t.key}
            c={t}
            done={s.checks.get(t.key)}
            today={today}
            extra={
              t.log && !s.checks.has(t.key) ? (
                <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'epq-log', kind: t.log })} aria-label={`Log entry: ${t.text}`}>
                  + Log
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      <H2>Gates</H2>
      <div className="epq-gates">
        {GATES.map((g) => {
          const days = dayCount(today, g.when) - 1;
          const done = s.checks.get(g.key);
          return (
            <article key={g.key} className={`i-pnl epq-gate${done ? ' is-done' : days < 0 ? ' is-late' : days <= 14 ? ' is-soon' : ''}`} aria-label={g.title}>
              <div className="epq-gate__h">
                <b>{g.title}</b>
                <span className="i-mono">{done ? 'passed' : days < 0 ? `${-days}d over` : `D-${days}`}</span>
              </div>
              <small>By {longDate(g.when)}. {g.check}</small>
              <small className="i-dim">If not: {g.fallback}</small>
              <button type="button" className="i-btn i-btn--sm" onClick={() => toggleCheck(g.key, today)} aria-pressed={!!done}>
                {done ? `Passed ${shortDay(done, today)}` : 'Mark passed'}
              </button>
            </article>
          );
        })}
      </div>

      <H2 aside={`${r1(doneHours)} h of ${r1(plannedToDate)} h planned so far`}>Hours, block by block</H2>
      <div className="i-pnl i-pnl--flush" aria-label="Planned hours against hours logged">
        {blocks.map((b) => {
          const h = b.minutes / 60;
          const isNow = b === blocks.find((x) => x.from === now?.from);
          const past = b.to < today;
          return (
            <div key={b.from} className={`epq-blk${isNow ? ' is-now' : ''}${past ? ' is-past' : ''}`}>
              <div className="epq-blk__h">
                <b>
                  {b.label}
                  {isNow ? ' · now' : ''}
                </b>
                <span className="i-mono">
                  {r1(h)} / {b.hours} h
                </span>
              </div>
              <span className={`epq-blk__bar${past && h < b.hours ? ' is-short' : ''}`} style={{ '--p': `${Math.min(100, (h / b.hours) * 100)}%` } as CSSProperties}>
                <i />
              </span>
              <small>
                {b.work} · <em>{b.evidence}</em>
              </small>
            </div>
          );
        })}
      </div>

      <H2 aside={`${logged}/${DECISIONS.length} logged`}>Decisions to log on ProjectQ</H2>
      <p className="i-note">The checklist marks decisions you show, with a date and your own reason. Tick each once it’s on ProjectQ.</p>
      <div className="i-pnl i-pnl--flush" aria-label="Decisions to log">
        {DECISIONS.map((d) => (
          <Tick
            key={d.key}
            c={{ key: d.key, text: `${d.chose} (${shortDay(d.when, today)}). Over: ${d.over}` }}
            done={s.checks.get(d.key)}
            today={today}
            extra={
              !s.checks.has(d.key) ? (
                <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'epq-log', kind: 'Decision' })} aria-label={`Write the decision: ${d.chose}`}>
                  + Log
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      <H2 aside={`${FOR_EMMA.filter((q) => s.checks.has(q.key)).length}/${FOR_EMMA.length} asked`}>For Emma</H2>
      <div className="i-pnl i-pnl--flush" aria-label="Questions for your supervisor">
        {FOR_EMMA.map((q) => (
          <Tick key={q.key} c={q} done={s.checks.get(q.key)} today={today} />
        ))}
      </div>

      <H2 aside="open and read before citing">Reading leads</H2>
      <div className="i-pnl i-pnl--flush" aria-label="Reading leads">
        {LEADS.map((l) => {
          const have = inLibrary.has(l.short.toLowerCase()) || s.sources.some((x) => x.author.toLowerCase().startsWith(l.author.split(/[ ,&]/)[0].toLowerCase()) && x.year === l.year);
          return (
            <div key={l.key} className="epq-lead">
              <span className="epq-lead__t">
                <b>
                  {l.author} ({l.year}) · {l.short}
                </b>
                <small>
                  <em>{l.side}.</em> {l.facts}. Limits: {l.limits}.
                </small>
              </span>
              {have ? (
                <span className="i-tag">In library</span>
              ) : (
                <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'epq-source', prefill: { title: l.short, author: l.author, year: l.year, publisher: l.where, url: l.url, type: 'Journal article' } })} aria-label={`Add to library: ${l.short}`}>
                  + Library
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="i-note">Still missing: {SOURCE_GAPS.join('; ')}.</p>

      <H2>Success criteria</H2>
      <ul className="i-pnl epq-list">
        {SUCCESS.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <H2>Risks</H2>
      <div className="i-pnl i-pnl--flush">
        {RISKS.map((r) => (
          <div key={r.risk} className="epq-risk">
            <b>{r.risk}</b>
            <small>{r.fallback}</small>
          </div>
        ))}
      </div>
      <p className="i-note">If behind, cut in this order (agree it with Emma): {CUT_ORDER.join(' → ')}.</p>
    </div>
  );
}

