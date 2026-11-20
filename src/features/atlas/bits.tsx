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

/** A Doubloon: the coin and how many. */
export function Coin({ n, big }: { n: number; big?: boolean }) {
  return (
    <span className={`at-coin${big ? ' at-coin--big' : ''}`}>
      <i aria-hidden="true">金</i>
      <b>{n.toLocaleString('en-GB')}</b>
      <span className="at-sr"> Doubloons</span>
    </span>
  );
}

/** Each ship drawn small, side on, facing right. */
export function ShipArt({ id, className, ...at }: { id: string; className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...at} className={`at-ship${className ? ` ${className}` : ''}`} viewBox="0 0 64 48" aria-hidden="true">
      {SHIP_ART[id] ?? SHIP_ART.raft}
    </svg>
  );
}

const SAIL = 'var(--at-sail, #f3ead6)';
const HULL = 'var(--at-hull, #9a6440)';
const DARK = 'var(--at-hull-2, #5b3922)';
const ACC = 'var(--sig)';
const SHIP_ART: Record<string, React.ReactNode> = {
  raft: (
    <>
      <path d="M30 34V12" stroke={DARK} strokeWidth="2" />
      <path d="M31 13q10 4 9 15l-9-2z" fill={SAIL} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={12 + i * 8} y="33" width="8" height="6" rx="3" fill={i % 2 ? HULL : DARK} />
      ))}
    </>
  ),
  sloop: (
    <>
      <path d="M32 36V6" stroke={DARK} strokeWidth="2" />
      <path d="M33 7l16 27H33z" fill={SAIL} />
      <path d="M31 10L17 33h14z" fill={SAIL} opacity=".85" />
      <path d="M8 36h50l-7 8H15z" fill={HULL} />
      <path d="M32 6l6 2-6 2z" fill={ACC} />
    </>
  ),
  dhow: (
    <>
      <path d="M28 36V12" stroke={DARK} strokeWidth="2" />
      <path d="M10 14L52 6 38 34z" fill={SAIL} />
      <path d="M10 14L52 6" stroke={DARK} strokeWidth="1.5" />
      <path d="M6 33h52q-2 8-10 10H18q-9-2-12-10z" fill={HULL} />
      <path d="M8 36h48" stroke={ACC} strokeWidth="1.5" />
    </>
  ),
  junk: (
    <>
      <path d="M30 36V6M46 36V16" stroke={DARK} strokeWidth="2" />
      <path d="M18 8h14l2 26H16z" fill={ACC} opacity=".9" />
      <path d="M17 13h16M17 18h16M17 23h16M16 28h18" stroke={DARK} strokeWidth="1" />
      <path d="M40 17h10l1 17H38z" fill={ACC} opacity=".75" />
      <path d="M4 30h14l4 4h28l10-6-4 14H12z" fill={HULL} />
    </>
  ),
  galleon: (
    <>
      <path d="M20 36V10M34 36V4M48 36V12" stroke={DARK} strokeWidth="2" />
      <path d="M14 12h12l1 8H13zM13 22h14l1 9H12zM27 6h14l1 9H26zM26 17h16l1 10H25zM42 14h12l1 8H41zM41 24h14l1 7H40z" fill={SAIL} />
      <path d="M34 4l7 2-7 2z" fill={ACC} />
      <path d="M2 32l10 2h40l8-6-2 10-6 6H12z" fill={HULL} />
      <path d="M10 38h44" stroke={ACC} strokeWidth="1.5" strokeDasharray="2 3" />
    </>
  ),
  clipper: (
    <>
      <path d="M18 36V6M32 36V2M46 36V8" stroke={DARK} strokeWidth="1.6" />
      <path d="M12 7h12v6H12zM11 15h14v7H11zM10 24h16v8H10zM26 3h12v6H26zM25 11h14v8H25zM24 21h16v10H24zM40 9h12v6H40zM39 17h14v7H39zM38 26h16v6H38z" fill={SAIL} />
      <path d="M54 26l9 8H52z" fill={SAIL} opacity=".85" />
      <path d="M4 34h58l-6 8H10z" fill={DARK} />
      <path d="M6 36h54" stroke={ACC} strokeWidth="1.2" />
    </>
  ),
  steamer: (
    <>
      <path d="M36 8q4-6 10-4t10-2" stroke="var(--fg-3)" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
      <rect x="32" y="10" width="8" height="16" fill={ACC} />
      <rect x="32" y="10" width="8" height="3" fill={DARK} />
      <rect x="16" y="22" width="34" height="8" rx="1" fill={SAIL} />
      <path d="M20 25h3M26 25h3M32 25h3M38 25h3M44 25h3" stroke={DARK} strokeWidth="1.5" />
      <path d="M4 30h58l-6 10H10z" fill={HULL} />
      <circle cx="26" cy="35" r="6" fill="none" stroke={DARK} strokeWidth="2" />
    </>
  ),
  airship: (
    <>
      <ellipse cx="30" cy="16" rx="24" ry="10" fill={SAIL} />
      <path d="M8 16h44M12 10q18-4 36 0M12 22q18 4 36 0" stroke={DARK} strokeWidth="1" fill="none" opacity=".5" />
      <path d="M54 16l8-7v14z" fill={ACC} />
      <path d="M22 26l2 6M38 26l-2 6" stroke={DARK} strokeWidth="1.2" />
      <rect x="22" y="32" width="16" height="7" rx="2" fill={HULL} />
      <circle cx="18" cy="35" r="3" fill="none" stroke={DARK} strokeWidth="1.5" />
    </>
  ),
};
