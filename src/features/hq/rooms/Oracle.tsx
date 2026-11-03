/** 神託: predictions with a percentage, called when the day comes, scored for how good your judgement is. */
import { useMemo, useState } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { calibration, CONFIDENCES, isDue, MIN_FOR_VERDICT, type Calibration, type Prediction } from '../../../domain/hq/oracle';
import { addDays, dayCount, shortDay } from '../../../domain/log/dates';
import { H2, Meter, Picks } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { resolvePrediction, savePrediction, useHq } from '../store';

const PROMPTS = [
  { claim: 'I’ll clear the JOI second round', by: '2026-11-29' },
  { claim: 'I’ll run the marathon under 4:10', by: '2027-04-18' },
  { claim: 'I’ll score 1580+ on my first SAT', by: '2027-06-30' },
  { claim: 'I’ll finish every book I start this month', by: '' },
  { claim: 'I’ll get every Big Three done this week', by: '' },
  { claim: 'I’ll do at least 5 hours of uni prep every week this month', by: '' },
];

function PredictionSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const prev = spec.editId ? hq.predictions.find((p) => p.id === spec.editId) : undefined;
  const [claim, setClaim] = useState(prev?.claim ?? (spec.claim as string) ?? '');
  const [confidence, setConfidence] = useState(String(prev?.confidence ?? 70));
  const given = spec.by as string | undefined;
  const [by, setBy] = useState(prev?.by ?? (given && given > today ? given : addDays(today, 30)));
  return (
    <Sheet
      title={prev ? 'Edit prediction' : 'New prediction'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Prediction deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!claim.trim() || !by} onClick={() => (savePrediction({ claim, confidence: Number(confidence), by }, today, prev?.id), closeSheet())}>
            Write it down
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">I think that…</span>
        <textarea data-autofocus className="i-textarea" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Something you’ll be able to say yes or no to" maxLength={300} />
      </label>
      <div className="i-field">
        <span className="i-lab">How sure? {confidence === '50' ? '(a coin flip)' : confidence === '99' ? '(certain)' : ''}</span>
        <Picks label="How sure" value={confidence} onChange={setConfidence} options={CONFIDENCES.map((c) => ({ id: String(c), label: `${c}%` }))} />
      </div>
      <label className="i-field">
        <span className="i-lab">We’ll know by</span>
        <input className="i-input" type="date" value={by} onChange={(e) => setBy(e.target.value)} />
      </label>
      <p className="i-note">Think it’s unlikely? Write the opposite instead, so the number stays above 50%.</p>
    </Sheet>
  );
}
registerSheet('hq-prediction', PredictionSheet);

function CalibrationChart({ c }: { c: Calibration }) {
  const S = 200;
  const pad = 26;
  const x = (v: number) => pad + ((v - 50) / 50) * (S - pad - 6);
  const y = (v: number) => S - pad - (v / 100) * (S - pad - 6);
  return (
    <svg className="hq-calib" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`Calibration: ${c.bins.map((b) => `when you say ${b.from} to ${b.to}%, it happens ${Math.round(b.hit)}% of the time`).join('; ')}`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={pad} x2={S - 6} y1={y(v)} y2={y(v)} className="hq-calib__g" />
          <text x={pad - 4} y={y(v) + 3} textAnchor="end" className="hq-calib__t">
            {v}
          </text>
        </g>
      ))}
      {[50, 60, 70, 80, 90, 100].map((v) => (
        <text key={v} x={x(v)} y={S - pad + 12} textAnchor="middle" className="hq-calib__t">
          {v}
        </text>
      ))}
      <line x1={x(50)} y1={y(50)} x2={x(100)} y2={y(100)} className="hq-calib__perfect" />
      {c.bins.map((b) => (
        <circle key={b.from} cx={x(b.said)} cy={y(b.hit)} r={3 + Math.min(8, Math.sqrt(b.n) * 2)} className="hq-calib__dot">
          <title>{`Said ${Math.round(b.said)}%, happened ${Math.round(b.hit)}% (${b.n})`}</title>
        </circle>
      ))}
      <text x={(S + pad) / 2} y={S - 2} textAnchor="middle" className="hq-calib__t">
        what you said
      </text>
    </svg>
  );
}

function Row({ p, today }: { p: Prediction; today: string }) {
  const due = isDue(p, today);
  const left = dayCount(today, p.by) - 1;
  return (
    <div className={`hq-pred${due ? ' is-due' : ''}`}>
      <button type="button" className="hq-pred__t" onClick={() => openSheet({ type: 'hq-prediction', editId: p.id })}>
        <b>{p.claim}</b>
        <small>
          {p.confidence}% · {due ? `was due ${shortDay(p.by, today)}` : left === 0 ? 'due today' : `${left} days to go`}
        </small>
      </button>
      {due ? (
        <span className="hq-pred__acts" role="group" aria-label={`Did it happen: ${p.claim}`}>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => resolvePrediction(p.id, true, today)}>
            It happened
          </button>
          <button type="button" className="i-btn i-btn--sm" onClick={() => resolvePrediction(p.id, false, today)}>
            It didn’t
          </button>
        </span>
      ) : (
        <span className="hq-pred__acts" role="group" aria-label={`Call it early: ${p.claim}`}>
          <button type="button" className="i-link" onClick={() => resolvePrediction(p.id, true, today)}>
            Already happened
          </button>
          <button type="button" className="i-link" onClick={() => resolvePrediction(p.id, false, today)}>
            Won’t happen
          </button>
        </span>
      )}
    </div>
  );
}

export function OracleRoom() {
  const today = useToday();
  const hq = useHq();
  const open = hq.predictions.filter((p) => p.outcome == null);
  const due = open.filter((p) => isDue(p, today));
  const waiting = open.filter((p) => !isDue(p, today));
  const done = hq.predictions.filter((p) => p.outcome != null).sort((a, b) => (b.resolvedOn ?? '').localeCompare(a.resolvedOn ?? ''));
  const c = useMemo(() => calibration(hq.predictions), [hq.predictions]);

  return (
    <div>
      <RoomHead room="oracle" />
      <div className="i-meters i-meters--4">
        <Meter value={open.length} label="Open" />
        <Meter value={c.n} label="Called" />
        <Meter value={c.brier != null ? c.brier.toFixed(2) : '—'} label="Brier score (lower is better; a coin is 0.25)" />
        <Meter value={c.bias != null && c.n >= MIN_FOR_VERDICT ? `${c.bias > 0 ? '+' : '−'}${Math.abs(Math.round(c.bias))}` : '—'} label="Overconfidence, points" />
      </div>
      <button type="button" className="i-btn i-btn--sig i-btn--block" style={{ marginTop: 10 }} onClick={() => openSheet({ type: 'hq-prediction' })}>
        + New prediction
      </button>

      {due.length > 0 && (
        <>
          <H2>Time to call these</H2>
          <div className="i-pnl i-pnl--flush">
            {due.map((p) => (
              <Row key={p.id} p={p} today={today} />
            ))}
          </div>
        </>
      )}

      {c.n > 0 && (
        <>
          <H2>How good is your judgement?</H2>
          <div className="i-pnl i-stack">
            <p className="hq-verdict">{c.verdict}</p>
            {c.bins.length > 0 && <CalibrationChart c={c} />}
            <p className="i-note">Dots on the diagonal mean that when you say 70%, it happens 70% of the time. Below it, you’re too sure. Above, too modest.</p>
          </div>
        </>
      )}

      {waiting.length > 0 && (
        <>
          <H2>Waiting on the future</H2>
          <div className="i-pnl i-pnl--flush">
            {waiting.map((p) => (
              <Row key={p.id} p={p} today={today} />
            ))}
          </div>
        </>
      )}

      {!hq.predictions.length && (
        <>
          <H2>Try one</H2>
          <p className="i-note">Writing a number down before you know the answer is the only way to find out if you’re as good at judging things as you think. Ideas to edit:</p>
          <div className="i-chips i-chips--wrap">
            {PROMPTS.map((t) => (
              <button key={t.claim} type="button" className="i-chip" onClick={() => openSheet({ type: 'hq-prediction', claim: t.claim, by: t.by })}>
                {t.claim}
              </button>
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <H2>The record</H2>
          <div className="i-pnl i-pnl--flush">
            {done.slice(0, 20).map((p) => (
              <div key={p.id} className="i-row">
                <span className="i-row__t">
                  <b>{p.claim}</b>
                  <small>
                    {p.confidence}% · {p.resolvedOn ? shortDay(p.resolvedOn, today) : ''}
                  </small>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`i-tag ${p.outcome ? 'i-tag--ok' : 'i-tag--warn'}`}>{p.outcome ? 'Happened' : 'Didn’t'}</span>
                  <button type="button" className="i-btn i-btn--sm" onClick={() => resolvePrediction(p.id, null, today)} aria-label={`Reopen: ${p.claim}`}>
                    ↺
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
