/** 医務室: tap where it hurts, follow it until it heals, and watch how fast the load is climbing. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { progressInput, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { activeNiggles, loadGuard, niggleDays, recurring, regionInfo, REGIONS, SEVERITY, ZONE_TEXT, type LoadGuard, type RegionId } from '../../../domain/hq/body';
import { addDays, shortDay } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { H2, Picks, Source } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { healNiggle, saveNiggle, useHq } from '../store';
import { wearEvents } from '../wearEvents';

const SPOTS: Record<RegionId, { x: number; y: number }> = {
  jaw: { x: 72, y: 34 },
  neck: { x: 208, y: 44 },
  lshoulder: { x: 100, y: 58 },
  rshoulder: { x: 40, y: 58 },
  chest: { x: 70, y: 76 },
  upperback: { x: 208, y: 72 },
  lowerback: { x: 208, y: 112 },
  lelbow: { x: 112, y: 104 },
  relbow: { x: 28, y: 104 },
  lwrist: { x: 120, y: 146 },
  rwrist: { x: 20, y: 146 },
  lhip: { x: 88, y: 138 },
  rhip: { x: 52, y: 138 },
  lknee: { x: 86, y: 198 },
  rknee: { x: 54, y: 198 },
  lshin: { x: 86, y: 236 },
  rshin: { x: 54, y: 236 },
  lcalf: { x: 190, y: 232 },
  rcalf: { x: 226, y: 232 },
  lfoot: { x: 88, y: 276 },
  rfoot: { x: 52, y: 276 },
};

const figure = (cx: number) => (
  <g className="hq-body__fig">
    <circle cx={cx} cy={24} r={15} />
    <rect x={cx - 6} y={36} width={12} height={12} />
    <path d={`M${cx - 28} 52 q28 -10 56 0 l-4 62 q-2 18 -2 24 h-44 q0 -6 -2 -24z`} />
    <path d={`M${cx - 29} 53 q-13 4 -14 18 l-8 74 h12 l12 -66z`} />
    <path d={`M${cx + 29} 53 q13 4 14 18 l8 74 h-12 l-12 -66z`} />
    <path d={`M${cx - 24} 136 h22 l-1 74 -3 62 h-13 l-5 -62z`} />
    <path d={`M${cx + 24} 136 h-22 l1 74 3 62 h13 l5 -62z`} />
    <path d={`M${cx - 20} 272 h13 l1 12 h-20z`} />
    <path d={`M${cx + 20} 272 h-13 l-1 12 h20z`} />
  </g>
);

function BodyMap({ active }: { active: Map<RegionId, number> }) {
  return (
    <svg className="hq-body" viewBox="0 0 280 296" role="group" aria-label="Body map: tap where it hurts">
      {figure(70)}
      {figure(208)}
      <text x={70} y={294} textAnchor="middle" className="hq-body__l">
        front
      </text>
      <text x={208} y={294} textAnchor="middle" className="hq-body__l">
        back
      </text>
      {REGIONS.map((r) => {
        const s = SPOTS[r.id];
        const sev = active.get(r.id);
        return (
          <g
            key={r.id}
            className={`hq-spot${sev ? ` is-${sev}` : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${r.name}${sev ? `, ${SEVERITY[sev - 1].name.toLowerCase()}` : ''}`}
            onClick={() => openSheet({ type: 'hq-niggle', region: r.id })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSheet({ type: 'hq-niggle', region: r.id });
              }
            }}
          >
            <circle cx={s.x} cy={s.y} r={13} className="hq-spot__hit" />
            <circle cx={s.x} cy={s.y} r={sev ? 9 : 4} className="hq-spot__dot" />
          </g>
        );
      })}
    </svg>
  );
}

function NiggleSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const region0 = spec.region as RegionId | undefined;
  const existing = spec.editId ? hq.niggles.find((n) => n.id === spec.editId) : region0 ? hq.niggles.find((n) => n.region === region0 && !n.healedOn) : undefined;
  const [region, setRegion] = useState<RegionId>(existing?.region ?? region0 ?? 'lknee');
  const [severity, setSeverity] = useState(String(existing?.severity ?? 1));
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.startedOn ?? today);
  const past = hq.niggles.filter((n) => n.region === region && n.id !== existing?.id);
  return (
    <Sheet
      title={existing ? regionInfo(existing.region)!.name : 'Where does it hurt?'}
      onClose={closeSheet}
      footer={
        <>
          {existing && (
            <button type="button" className="i-btn" onClick={() => (healNiggle(existing.id, today), closeSheet())}>
              It’s healed
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => (saveNiggle({ region, severity: Number(severity), note, startedOn: date }, existing?.id), closeSheet())}>
            {existing ? 'Update' : 'Save'}
          </button>
        </>
      }
    >
      {!existing && (
        <label className="i-field">
          <span className="i-lab">Where</span>
          <select className="i-input" value={region} onChange={(e) => setRegion(e.target.value as RegionId)}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="i-field">
        <span className="i-lab">How bad</span>
        <Picks label="How bad" value={severity} onChange={setSeverity} options={SEVERITY.map((s) => ({ id: String(s.v), label: s.name }))} />
        <small className="i-note">{SEVERITY[Number(severity) - 1].hint}</small>
      </div>
      <label className="i-field">
        <span className="i-lab">When does it hurt?</span>
        <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="After long runs, on shifts, going downstairs…" maxLength={300} />
      </label>
      {!existing && (
        <label className="i-field">
          <span className="i-lab">Since</span>
          <input className="i-input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      )}
      {existing && (
        <p className="i-note">
          Since {shortDay(existing.startedOn)}, {niggleDays(existing, today)} days.
          {existing.log.length > 1 ? ` ${existing.log.map((l) => SEVERITY[l.severity - 1]?.name.toLowerCase()).join(' → ')}.` : ''}
        </p>
      )}
      {past.length > 0 && <p className="i-note">Here before: {past.slice(0, 3).map((n) => `${shortDay(n.startedOn)} (${niggleDays(n, today)} days)`).join(', ')}.</p>}
    </Sheet>
  );
}
registerSheet('hq-niggle', NiggleSheet);

function Gauge({ g, unit, title }: { g: LoadGuard; unit: string; title: string }) {
  const pos = g.ratio == null ? null : Math.min(1, g.ratio / 2);
  return (
    <div className={`hq-gauge is-${g.zone}`}>
      <div className="hq-gauge__h">
        <b>{title}</b>
        <span className="i-mono">{g.ratio != null ? g.ratio.toFixed(2) : '—'}</span>
      </div>
      <span className="hq-gauge__bar" role="img" aria-label={`${title}: load ratio ${g.ratio != null ? g.ratio.toFixed(2) : 'not known yet'}, ${g.zone}`}>
        {pos != null && <i style={{ '--p': `${pos * 100}%` } as CSSProperties} />}
      </span>
      <div className="hq-gauge__scale" aria-hidden="true">
        <span>easing off</span>
        <span>building</span>
        <span>spiking</span>
      </div>
      <small>
        {Math.round(g.acute)} {unit} in the last 7 days, your usual is {Math.round(g.chronic)} {unit} a week.
        {g.jump != null && Math.abs(g.jump) >= 0.05 ? ` ${g.jump > 0 ? 'Up' : 'Down'} ${Math.abs(Math.round(g.jump * 100))}% on the week before.` : ''} {ZONE_TEXT[g.zone]}
      </small>
    </div>
  );
}

export function InfirmaryRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const active = activeNiggles(hq.niggles);
  const map = useMemo(() => new Map(active.map((n) => [n.region, n.severity])), [active]);
  const again = recurring(hq.niggles, today);
  const healed = hq.niggles.filter((n) => n.healedOn);
  const input = progressInput(st, today);
  const guards = useMemo(() => {
    const km = new Map<string, number>();
    const violin = new Map<string, number>();
    for (const e of wearEvents(input)) {
      if (e.source === 'running' && e.km) km.set(e.date, (km.get(e.date) ?? 0) + e.km);
      if (e.source === 'violin') violin.set(e.date, (violin.get(e.date) ?? 0) + e.minutes);
    }
    return { run: loadGuard(km, today), violin: loadGuard(violin, today) };
  }, [input, today]);
  const gymPain = useMemo(() => {
    const from = addDays(today, -30);
    return input.entries.flatMap((e) => {
      if (e.date < from) return [];
      const d = input.details.get(e.id);
      const data = d && !d.deleted_at ? (d.data as { pain?: boolean; painNote?: string }) : null;
      return data?.pain ? [{ date: e.date, note: data.painNote ?? '' }] : [];
    });
  }, [input, today]);

  return (
    <div>
      <RoomHead room="infirmary" />
      <div className="i-pnl hq-bodywrap">
        <BodyMap active={map} />
        <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'hq-niggle' })}>
          Log a niggle
        </button>
      </div>

      {active.length > 0 && (
        <>
          <H2 aside="tap to update">Being watched</H2>
          <div className="i-pnl i-pnl--flush">
            {active.map((n) => (
              <button key={n.id} type="button" className="i-row" onClick={() => openSheet({ type: 'hq-niggle', editId: n.id })}>
                <span className="i-row__t">
                  <b>{regionInfo(n.region)!.name}</b>
                  <small>
                    {SEVERITY[n.severity - 1].name} · day {niggleDays(n, today)}
                    {n.note ? ` · ${n.note}` : ''}
                  </small>
                </span>
                <span className={`i-tag${n.severity >= 2 ? ' i-tag--warn' : ''}`}>{SEVERITY[n.severity - 1].name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {again.map((a) => (
        <p key={a.region} className="i-note i-note--warn">
          {regionInfo(a.region)!.name}: {a.n} times in a year. Worth asking a physio why it keeps coming back.
        </p>
      ))}
      {gymPain.length > 0 && (
        <p className="i-note">
          Pain noted in the gym lately: {gymPain.slice(0, 3).map((p) => `${shortDay(p.date)}${p.note ? ` (${p.note})` : ''}`).join(', ')}.
        </p>
      )}

      <H2 aside="acute : chronic">Load guard</H2>
      <div className="i-pnl i-stack">
        <Gauge g={guards.run} unit="km" title="Running" />
        <Gauge g={guards.violin} unit="min" title="Violin" />
      </div>
      <Source kind="live">From your log. The ratio compares the last 7 days with your 4-week average: about 0.8–1.3 is the usual “safe” band. It’s a rule of thumb, not medical advice, and pain that doesn’t settle is a job for a physio.</Source>

      {healed.length > 0 && (
        <>
          <H2>Healed</H2>
          <div className="i-pnl i-pnl--flush">
            {healed.slice(0, 10).map((n) => (
              <div key={n.id} className="i-row">
                <span className="i-row__t">
                  <b>{regionInfo(n.region)!.name}</b>
                  <small>
                    {shortDay(n.startedOn)}, {niggleDays(n, today)} days{n.note ? ` · ${n.note}` : ''}
                  </small>
                </span>
                <button type="button" className="i-btn i-btn--sm" onClick={() => deleteRecord(n.id, 'Removed')} aria-label={`Remove ${regionInfo(n.region)!.name} from the record`}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
