/** Small instrument parts used everywhere: gauges, steppers, meters, toggles, headings. */
import type { CSSProperties, ReactNode } from 'react';
import type { SectionId } from '../../data/types';

export const accent = (id: SectionId | 'general' | 'quests' | null | undefined): CSSProperties => ({ '--c': `var(--c-${id ?? 'general'})` }) as CSSProperties;

export function Seg({ pct, n = 20, thin, label }: { pct: number; n?: number; thin?: boolean; label?: string }) {
  const on = Math.round(Math.max(0, Math.min(1, pct)) * n);
  return (
    <span
      className={`i-seg${thin ? ' i-seg--thin' : ''}`}
      style={{ '--n': n } as CSSProperties}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < on ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export function Led({ on, style }: { on?: boolean; style?: CSSProperties }) {
  return <span className={`i-led${on ? ' is-on' : ''}`} style={style} aria-hidden="true" />;
}

export function Stepper({ value, label, onStep }: { value: ReactNode; label: string; onStep: (d: -1 | 1) => void }) {
  return (
    <span className="i-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onStep(-1)} aria-label={`Less ${label}`}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onStep(1)} aria-label={`More ${label}`}>
        +
      </button>
    </span>
  );
}

export function Meter({ value, label, onClick, pressed }: { value: ReactNode; label: ReactNode; onClick?: () => void; pressed?: boolean }) {
  const inner = (
    <>
      <span className="i-meter__v">{value}</span>
      <span className="i-meter__l">{label}</span>
    </>
  );
  return onClick ? (
    <button type="button" className="i-meter" onClick={onClick} aria-pressed={pressed}>
      {inner}
    </button>
  ) : (
    <div className="i-meter">{inner}</div>
  );
}

export function Toggle({ on, label, hint, onChange }: { on: boolean; label: ReactNode; hint?: ReactNode; onChange: (on: boolean) => void }) {
  return (
    <button type="button" className="i-toggle" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span>
        {label}
        {hint && (
          <>
            <br />
            <span className="i-mono i-small i-dim">{hint}</span>
          </>
        )}
      </span>
      <span className="i-switch" />
    </button>
  );
}

export function H2({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="i-h2">
      <h2>{children}</h2>
      {aside && (typeof aside === 'string' ? <span className="i-h2__aside">{aside}</span> : aside)}
    </div>
  );
}

export function Picks<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <div className="i-picks" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className="i-pick" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string; c?: SectionId }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="i-chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className="i-chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)} style={o.c ? accent(o.c) : undefined}>
          {o.c && <span className="i-led" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A clearly labelled note about where data comes from: simulated, off or live. */
export function Source({ kind = 'sim', children }: { kind?: 'sim' | 'off' | 'live'; children: ReactNode }) {
  return <p className={`i-sim${kind === 'off' ? ' i-sim--off' : kind === 'live' ? ' i-sim--live' : ''}`}>{children}</p>;
}
