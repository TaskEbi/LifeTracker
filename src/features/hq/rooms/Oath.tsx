/** 誓約: a promise with a date and a price, checked by your own records. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet } from '../../../app/sheets';
import { progressInput, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { TIMED_SECTIONS, type TimedSection } from '../../../data/types';
import { OATH_METRICS, oathProgress, oathWords, type Oath, type OathMetric, type OathStatus } from '../../../domain/hq/oath';
import { addDays, shortDay } from '../../../domain/log/dates';
import { dayFacts } from '../../../domain/progress/quests';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { Chips, H2, Picks } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { payOath, saveOath, useHq } from '../store';

const STAKES = ['No phone in bed for a week', 'Tell a friend I broke my word', 'Give £10 to a charity', 'An extra 5 km in the rain'];
const WORD: Record<OathStatus, string> = { kept: 'Kept', ahead: 'On track', behind: 'Behind', broken: 'Broken', 'not-started': 'Not started' };

function OathSheet() {
  const today = useToday();
  const [metric, setMetric] = useState<OathMetric>('minutes');
  const [section, setSection] = useState<TimedSection>('violin');
  const [target, setTarget] = useState('300');
  const [length, setLength] = useState('7');
  const [stake, setStake] = useState('');
  const needs = OATH_METRICS.find((m) => m.id === metric)!;
  const t = Number(target);
  const ok = t > 0 && stake.trim();
  return (
    <Sheet
      title="Swear an oath"
      onClose={closeSheet}
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ok} onClick={() => (saveOath({ metric, section: needs.needsSection ? section : null, target: t, from: today, until: addDays(today, Number(length) - 1), stake }), closeSheet())}>
          Sign it
        </button>
      }
    >
      <Picks label="What you’re promising" value={metric} onChange={setMetric} options={OATH_METRICS.map((m) => ({ id: m.id, label: m.label }))} />
      {needs.needsSection && <Chips label="Of what" value={section} onChange={setSection} options={TIMED_SECTIONS.map((s) => ({ id: s, label: sectionInfo(s).name, c: s }))} />}
      <label className="i-field">
        <span className="i-lab">How much ({needs.unit})</span>
        <input className="i-input" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))} />
      </label>
      <div className="i-field">
        <span className="i-lab">By when</span>
        <Chips label="How long" value={length} onChange={setLength} options={[{ id: '7', label: '1 week' }, { id: '14', label: '2 weeks' }, { id: '30', label: '1 month' }, { id: '90', label: '3 months' }]} />
      </div>
      <label className="i-field">
        <span className="i-lab">If I break it, I will…</span>
        <input data-autofocus className="i-input" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="It has to cost you something" maxLength={200} />
      </label>
      <div className="i-chips i-chips--wrap">
        {STAKES.map((s) => (
          <button key={s} type="button" className="i-chip" onClick={() => setStake(s)}>
            {s}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
registerSheet('hq-oath', OathSheet);

function OathCard({ o, today, facts }: { o: Oath; today: string; facts: ReturnType<typeof dayFacts> }) {
  const p = oathProgress(o, facts, today);
  const unit = OATH_METRICS.find((m) => m.id === o.metric)!.unit;
  return (
    <article className={`oa is-${p.status}`} style={{ '--p': `${Math.min(100, p.pct * 100)}%` } as CSSProperties}>
      <header>
        <b>{oathWords(o)}</b>
        <span className="oa__stamp">{p.status === 'kept' ? '守' : p.status === 'broken' ? '破' : '誓'}</span>
      </header>
      <small>
        by {shortDay(o.until, today)} · {WORD[p.status]}
      </small>
      <span className="oa__bar" role="progressbar" aria-label={`${oathWords(o)}: ${p.done} done`} aria-valuenow={Math.round(Math.min(1, p.pct) * 100)} aria-valuemin={0} aria-valuemax={100}>
        <i />
      </span>
      <p className="oa__n i-mono">
        {p.done} of {o.target} {unit}
        {(p.status === 'ahead' || p.status === 'behind') && p.daysLeft ? ` · ${Math.ceil(p.perDay * 10) / 10} a day from here` : ''}
      </p>
      <p className="oa__stake">
        If broken: <b>{o.stake}</b>
      </p>
      {p.status === 'broken' && (
        <div className="oa__acts">
          {o.paidOn ? (
            <span className="i-tag i-tag--ok">Paid {shortDay(o.paidOn, today)}</span>
          ) : (
            <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => payOath(o.id, today)}>
              I’ve paid the price
            </button>
          )}
        </div>
      )}
      <button type="button" className="i-link oa__del" onClick={() => deleteRecord(o.id, 'Oath deleted')} aria-label={`Delete oath: ${oathWords(o)}`}>
        Delete
      </button>
    </article>
  );
}

export function OathRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const facts = useMemo(() => dayFacts(progressInput(st, today)), [st, today]);
  const open = hq.oaths.filter((o) => {
    const s = oathProgress(o, facts, today).status;
    return s === 'ahead' || s === 'behind' || s === 'not-started';
  });
  const done = hq.oaths.filter((o) => !open.includes(o));
  const kept = done.filter((o) => oathProgress(o, facts, today).status === 'kept').length;
  return (
    <div>
      <RoomHead room="oath" />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-oath' })}>
        + Swear an oath
      </button>
      {!hq.oaths.length && <p className="i-note" style={{ marginTop: 10 }}>A goal you can quietly drop. An oath has a date and a price you chose yourself, and your records check whether you kept it. Keep them few, or they stop meaning anything.</p>}
      {open.length > 0 && (
        <>
          <H2>In force</H2>
          <div className="oa-list">
            {open.map((o) => (
              <OathCard key={o.id} o={o} today={today} facts={facts} />
            ))}
          </div>
        </>
      )}
      {done.length > 0 && (
        <>
          <H2 aside={`${kept} of ${done.length} kept`}>The record</H2>
          <div className="oa-list">
            {done.map((o) => (
              <OathCard key={o.id} o={o} today={today} facts={facts} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
