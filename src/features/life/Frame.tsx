/**
 * The frame the life pages share (Mood, Money, People, Media, Places): a way back to Home's More
 * page, a header with the page's kanji, and optional tabs that keep their own addresses.
 */
import type { CSSProperties, ReactNode } from 'react';
import { navigate, type RouteName } from '../../app/router';
import './life.css';

export const LIFE = {
  mood: { k: '心', name: 'Mood', c: '#ff8fb0', blurb: 'Weather, energy and stress, and what goes with them' },
  money: { k: '金', name: 'Money', c: '#e3c15a', blurb: 'Pocket money, spending and what you’re saving for' },
  people: { k: '人', name: 'People', c: '#6fd0ff', blurb: 'Birthdays, gifts, notes and time together' },
  media: { k: '観', name: 'Media', c: '#b48cff', blurb: 'Films, shows, anime, manga, music and games' },
  places: { k: '旅', name: 'Places', c: '#5fd39a', blurb: 'Where you’ve been, time outside and where next' },
} as const;
export type LifeId = keyof typeof LIFE;
export const LIFE_IDS = Object.keys(LIFE) as LifeId[];

export function LifePage({ id, line, aside, tabs, tab, children }: { id: LifeId; line?: ReactNode; aside?: ReactNode; tabs?: { id: string; label: string; n?: number }[]; tab?: string; children: ReactNode }) {
  const l = LIFE[id];
  return (
    <div className="lf" style={{ '--lc': l.c } as CSSProperties}>
      <button type="button" className="i-link lf-back" onClick={() => navigate('home', ['more'])}>
        ◀ More
      </button>
      <header className="lf-head">
        <span className="lf-head__k" aria-hidden="true">
          {l.k}
        </span>
        <div className="lf-head__t">
          <h1>{l.name}</h1>
          <p>{line ?? l.blurb}</p>
        </div>
        {aside}
      </header>
      {tabs && (
        <nav className="lf-tabs" aria-label={`${l.name} pages`}>
          {tabs.map((t) => (
            <button key={t.id} type="button" className="lf-tab" aria-current={(tab ?? '') === t.id ? 'page' : undefined} onClick={() => navigate(id as RouteName, t.id ? [t.id] : [], { replace: true })}>
              {t.label}
              {!!t.n && <small>{t.n}</small>}
            </button>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}

/** A friendly empty state with one thing to do. */
export function Empty({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="i-pnl lf-empty">
      <p>{children}</p>
      {action && (
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="i-field">
      <span className="i-lab">{label}</span>
      {children}
    </label>
  );
}
