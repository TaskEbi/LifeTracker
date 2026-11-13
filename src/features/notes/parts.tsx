/** Pieces the notes page and its tools share: links, the inline markup, blocks, reveal-on-scroll. */
import { useEffect, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react';
import { navigate } from '../../app/router';
import type { Block } from '../../domain/notes';
import { parseInline, type Inline } from '../../domain/notes/markup';
import { Fig } from './figs';

export const pad = (n: number) => String(n).padStart(2, '0');
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const vars = (v: Record<string, string | number>) => v as CSSProperties;

// ── links ──

export function A({ to, className, children, label, current }: { to: string[]; className?: string; children: ReactNode; label?: string; current?: boolean }) {
  const onClick = (e: ReactMouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    navigate('study', to);
  };
  return (
    <a href={`/study/${to.join('/')}`} className={className} onClick={onClick} aria-label={label} aria-current={current ? 'page' : undefined}>
      {children}
    </a>
  );
}

// ── text ──

function inl(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    if (typeof n === 'string') return n;
    if (n.k === 'code') return <code key={i}>{n.t}</code>;
    if (n.k === 'b') return <strong key={i}>{inl(n.c)}</strong>;
    return n.k === 'sup' ? <sup key={i}>{inl(n.c)}</sup> : <sub key={i}>{inl(n.c)}</sub>;
  });
}
export const R = ({ t }: { t: string }) => <>{inl(parseInline(t))}</>;

export function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string')
    return (
      <p>
        <R t={b} />
      </p>
    );
  switch (b.k) {
    case 'h':
      return <h3>{b.t}</h3>;
    case 'ul':
      return (
        <ul>
          {b.items.map((x, i) => (
            <li key={i}>
              <R t={x} />
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="nt-steps">
          {b.items.map((x, i) => (
            <li key={i}>
              <span>
                <R t={x} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'f':
      return (
        <div className="nt-f" data-rv="">
          {b.lines.map((l, i) => (
            <div key={i} style={vars({ '--i': i })}>
              <R t={l} />
            </div>
          ))}
        </div>
      );
    case 'tbl':
      return (
        <div className="nt-tbl">
          <table>
            <thead>
              <tr>
                {b.head.map((x, i) => (
                  <th key={i} scope="col">
                    <R t={x} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((x, j) => (
                    <td key={j}>
                      <R t={x} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'tip':
    case 'trap':
      return (
        <div className={`nt-callout nt-callout--${b.k}`} data-rv="">
          <div className="nt-tag">
            {b.k === 'tip' ? 'Examiner’s tip' : 'Common mistake'}
            {b.k === 'tip' && (
              <span className="nt-stars" aria-hidden="true">
                ★★★★★
              </span>
            )}
          </div>
          <div>
            <p>
              <R t={b.t} />
            </p>
          </div>
        </div>
      );
    case 'code':
      return <pre className="nt-code">{b.t}</pre>;
    case 'fig':
      return <Fig id={b.id} cap={b.cap} />;
  }
}

// ── hooks ──

/** Adds .is-in to every [data-rv] under the root as it scrolls into view. */
export function useReveal(root: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const els = [...(root.current?.querySelectorAll<HTMLElement>('[data-rv]') ?? [])];
    if (typeof IntersectionObserver !== 'function' || reduced()) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries)
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root, key]);
}

export function Foot({ left, right }: { left: string; right: string }) {
  return (
    <footer className="nt-foot nt-wrap">
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  );
}
