/** Small pieces the Atlas screens share. */
import { boxOf, MEDALS, SKILLS, TOP_BOX, type Marks } from '../../domain/atlas/model';

export function Flag({ id, alt, className }: { id: string; alt: string; className?: string }) {
  return <img className={`at-flag${className ? ` ${className}` : ''}`} src={`/flags/${id}.svg`} alt={alt} loading="lazy" decoding="async" draggable={false} />;
}

/** Three small meters: how far the flag, the place and the capital have got (box 0–5). */
export function Pips({ id, marks }: { id: string; marks: Marks }) {
  return (
    <span className="at-pips" role="img" aria-label={SKILLS.map((s) => `${s.name} ${boxOf(marks, id, s.id)} of ${TOP_BOX}`).join(', ')}>
      {SKILLS.map((s) => {
        const b = boxOf(marks, id, s.id);
        return <i key={s.id} data-b={b} style={{ '--b': b / TOP_BOX } as React.CSSProperties} />;
      })}
    </span>
  );
}

export function MedalDot({ tier, flawless, big }: { tier: number; flawless?: boolean; big?: boolean }) {
  return (
    <span className={`at-medal at-medal--${tier}${big ? ' at-medal--big' : ''}`} role="img" aria-label={tier ? `${MEDALS[tier]} medal${flawless ? ', flawless' : ''}` : 'No medal yet'}>
      {flawless ? '★' : ''}
    </span>
  );
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <span className="at-meter" role="img" aria-label={`${label}: ${value} of ${max}`}>
      <i style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </span>
  );
}
