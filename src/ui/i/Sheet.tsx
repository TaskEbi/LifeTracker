import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Step labels for a flow; the current one is `step` (1-based). */
  steps?: string[];
  step?: number;
  /** Section colour variable, e.g. 'violin'. */
  accent?: string;
}

/** Bottom sheet on a phone, centred dialog on a laptop. Escape and the scrim close it. */
export function Sheet({ title, onClose, children, footer, steps, step = 1, accent }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select, button:not(.i-sheet__x)');
    (first ?? box.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const style = accent ? ({ '--c': `var(--c-${accent})` } as CSSProperties) : undefined;
  return (
    <>
      <div className="i-scrim" onClick={onClose} aria-hidden="true" />
      <div className="i-sheet" role="dialog" aria-modal="true" aria-label={title} ref={box} tabIndex={-1} style={style}>
        <div className="i-sheet__h">
          <h2>{title}</h2>
          <button type="button" className="i-sheet__x" onClick={onClose} aria-label="Close">
            ESC
          </button>
        </div>
        {steps && (
          <div className="i-sheet__steps" style={{ '--n': steps.length } as CSSProperties} aria-label={`Step ${step} of ${steps.length}`}>
            {steps.map((s, i) => (
              <div key={s} className={i < step ? 'is-on' : ''}>
                {String(i + 1).padStart(2, '0')} {s}
              </div>
            ))}
          </div>
        )}
        <div className="i-sheet__b">{children}</div>
        {footer && <div className="i-sheet__f">{footer}</div>}
      </div>
    </>
  );
}
