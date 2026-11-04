/**
 * The drone on Home, alive. Its eye follows your finger; it sleeps in the small hours, sweats while
 * the streak buffer is holding and bounces once today's training is done. A tap talks and boings,
 * a long press pets it (hearts), and poking it five times fast makes it dizzy. Only transforms.
 */
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { DroneMood } from '../../domain/fun/season';
import { useGame, useLoadout } from '../game/store';
import { chassisMk } from '../../domain/game/wallet';
import { Robot } from '../../ui/i/bots/Robot';
import './living.css';

type Reaction = 'boing' | 'pet' | 'dizzy' | null;

const PET_MS = 550;
const POKES = 5;
const POKE_WINDOW = 1800;
const MAX_X = 7;
const MAX_Y = 3.5;

export function LivingDrone({ stage, mood, onTalk, onSay }: { stage: number; mood: DroneMood; onTalk: () => void; onSay: (line: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const look = useLoadout();
  const wallet = useGame().wallet;
  const [reaction, setReaction] = useState<Reaction>(null);
  /** Woken by a tap: it stays up for a while, even at 2 a.m. */
  const [awake, setAwake] = useState(false);
  const pokes = useRef<number[]>([]);
  const dizzyUntil = useRef(0);
  const petTimer = useRef<number | undefined>(undefined);
  const petted = useRef(false);
  const shown: DroneMood = mood === 'asleep' && awake ? 'idle' : mood;

  // The eye follows the pointer; after a pause it looks ahead again.
  useEffect(() => {
    let raf = 0;
    let idle = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (!el) return;
        const box = el.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 2);
        const len = Math.max(1, Math.hypot(dx, dy));
        const pull = Math.min(1, len / 160);
        el.style.setProperty('--gx', `${((dx / len) * pull * MAX_X).toFixed(1)}px`);
        el.style.setProperty('--gy', `${((dy / len) * pull * MAX_Y).toFixed(1)}px`);
        window.clearTimeout(idle);
        idle = window.setTimeout(() => {
          ref.current?.style.setProperty('--gx', '0px');
          ref.current?.style.setProperty('--gy', '0px');
        }, 2400);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const t = window.setTimeout(() => setReaction(null), reaction === 'boing' ? 480 : 1500);
    return () => window.clearTimeout(t);
  }, [reaction]);

  const down = (e: RPointerEvent) => {
    petted.current = false;
    if (e.button) return;
    window.clearTimeout(petTimer.current);
    petTimer.current = window.setTimeout(() => {
      petted.current = true;
      setReaction('pet');
      onSay('…bzzzrrr. That’s the spot.');
    }, PET_MS);
  };
  const up = () => window.clearTimeout(petTimer.current);
  const click = () => {
    // the click that ends a long press
    if (petted.current) {
      petted.current = false;
      return;
    }
    if (mood === 'asleep' && !awake) {
      setAwake(true);
      setReaction('boing');
      onSay('Wha— I’m up. It’s late, you know.');
      return;
    }
    const now = Date.now();
    // still spinning: it can't hear you
    if (now < dizzyUntil.current) return;
    pokes.current = [...pokes.current.filter((t) => now - t < POKE_WINDOW), now];
    if (pokes.current.length >= POKES) {
      pokes.current = [];
      dizzyUntil.current = now + 1500;
      setReaction('dizzy');
      onSay('Okay! Okay. I’m awake. Everything is spinning.');
      return;
    }
    setReaction('boing');
    onTalk();
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`h-hero__drone i-drone ld ld--${shown}${reaction ? ` is-${reaction}` : ''}`}
      onClick={click}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Talk to your robot"
    >
      <span className="ld__body">
        <Robot stage={stage} look={look} label={false} mk={look.chassis === 'drone' ? undefined : chassisMk(wallet, look.chassis) || 1} />
      </span>
      {shown === 'asleep' && (
        <span className="ld__zz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      )}
      {shown === 'worried' && <i className="ld__sweat" aria-hidden="true" />}
      {shown === 'proud' && (
        <span className="ld__glints" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      {reaction === 'pet' && (
        <span className="ld__hearts" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i}>♥</i>
          ))}
        </span>
      )}
      {reaction === 'dizzy' && (
        <span className="ld__stars" aria-hidden="true">
          <i>★</i>
          <i>★</i>
          <i>★</i>
        </span>
      )}
    </button>
  );
}
