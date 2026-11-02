/**
 * XP orbs: when the reward box is dismissed, a few sparks arc from the XP number into the level
 * button, which bumps as they land. Plain DOM with the Web Animations API, removed when done, and
 * nothing can be tapped by accident. Only in Full mode, never under reduced motion.
 */
import { playStyle } from './celebrate';
import { fxStore } from './celebrate';

const MAX_ORBS = 12;

function visibleTarget(): HTMLElement | null {
  const list = document.querySelectorAll<HTMLElement>('[data-xp-target]');
  for (const el of list) {
    const box = el.getBoundingClientRect();
    if (box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0) return el;
  }
  return null;
}

export function flyXp(from: Element | null, xp: number) {
  if (!from || xp <= 0 || fxStore.get().mode !== 'full' || playStyle() !== 'full') return;
  const target = visibleTarget();
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const x1 = b.left + b.width / 2;
  const y1 = b.top + b.height / 2;
  const n = Math.min(MAX_ORBS, 4 + Math.floor(xp / 15));
  const color = getComputedStyle(target).getPropertyValue('--sig').trim() || '#ffd23f';
  let landed = 0;
  for (let i = 0; i < n; i++) {
    const orb = document.createElement('i');
    const size = 6 + Math.random() * 5;
    Object.assign(orb.style, {
      position: 'fixed',
      left: `${x0 - size / 2}px`,
      top: `${y0 - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 10px 2px ${color}`,
      zIndex: '95',
      pointerEvents: 'none',
    });
    orb.setAttribute('aria-hidden', 'true');
    document.body.appendChild(orb);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const fanX = (Math.random() - 0.5) * 170;
    const fanY = -30 - Math.random() * 90;
    const anim = orb.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(0.4)', opacity: 0 },
        { transform: `translate3d(${fanX}px, ${fanY}px, 0) scale(1)`, opacity: 1, offset: 0.34, easing: 'cubic-bezier(.5, 0, .9, .5)' },
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.5)`, opacity: 1 },
      ],
      { duration: 620 + Math.random() * 180, delay: i * 34, easing: 'ease-out', fill: 'both' },
    );
    anim.onfinish = anim.oncancel = () => {
      orb.remove();
      landed++;
      if (landed === 1 || landed === n) target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.26)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
    };
  }
}
