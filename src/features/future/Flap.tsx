/**
 * Split-flap text: one cell per character, each flipping in a little after the one before, like a
 * station board settling. Pure CSS (future.css); still under reduced motion.
 */
import type { CSSProperties } from 'react';

export function Flap({ text, len, delay = 0, className = '' }: { text: string; len?: number; delay?: number; className?: string }) {
  const t = text.toUpperCase();
  const chars = (len ? t.slice(0, len).padEnd(len, ' ') : t).split('');
  return (
    <span className={`fu-flap ${className}`} aria-label={text} role="img">
      {chars.map((c, i) => (
        <span key={i} className="fu-flap__c" style={{ '--d': `${delay + i * 28}ms` } as CSSProperties} aria-hidden="true">
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}
