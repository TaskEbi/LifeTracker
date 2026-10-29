/**
 * Plays queued celebrations one at a time, full screen. While it plays, the app itself takes part:
 * the page tilts back and recedes, the command bar drops away, two diagonal ink panels close over
 * it like a manga page, and at the end they split apart while the page swings back into place.
 *
 * Only transform and opacity are animated. The page and the bar are animated separately (never
 * .i-shell, whose fixed children would lose their place) and every animation is cancelled at the
 * end, so nothing lingers. Tap anywhere or Skip for the next one, Escape skips them all.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { rewardStore } from '../../../data/lt';
import { useStore } from '../../../lib/createStore';
import { celebrate, celebrationStore, fxStore, playStyle, type Celebration } from './celebrate';
import { celebrationsFor } from './fromReward';
import { CalmCard, Scene, tell, timing } from './scenes';
import './fx.css';

const IN_MS = 460;
const OUT_MS = 560;
const CALM_MS = 2600;
const FADE_MS = 240;
/** Taps this soon after a sequence starts are ignored (the tap that saved, a double tap). */
const TAP_GUARD_MS = 350;

type Phase = 'idle' | 'play' | 'out';

const EASE_IN = 'cubic-bezier(.3,.7,.2,1)';

function shellParts(from: Element | null) {
  const shell = from?.closest('.i-shell') ?? document.querySelector('.i-shell');
  if (!shell) return null;
  const pick = (sel: string) => shell.querySelector<HTMLElement>(sel);
  return {
    shell: shell as HTMLElement,
    main: pick(':scope > .i-main') ?? pick(':scope > .i-cabinet-host'),
    bars: [pick(':scope > .i-cmd'), pick('.fo-pill')].filter((x): x is HTMLElement => !!x),
    rail: pick(':scope > .i-rail'),
  };
}

const TILT_MAIN = 'perspective(1200px) translate3d(0, 3%, -420px) rotateX(32deg)';
const FLAT_MAIN = 'perspective(1200px) translate3d(0, 0, 0) rotateX(0deg)';
const OVER_MAIN = 'perspective(1200px) translate3d(0, 0, 30px) rotateX(-5deg)';
const DROP_BAR = 'perspective(600px) translate3d(0, 130%, 0) rotateX(60deg)';
const FLAT_BAR = 'perspective(600px) translate3d(0, 0, 0) rotateX(0deg)';
const AWAY_RAIL = 'perspective(900px) translate3d(-30%, 0, -200px) rotateY(35deg)';
const FLAT_RAIL = 'perspective(900px) translate3d(0, 0, 0) rotateY(0deg)';

export function CelebrationLayer() {
  const queue = useStore(celebrationStore, (s) => s.queue);
  const current: Celebration | undefined = queue[0];
  const [phase, setPhase] = useState<Phase>('idle');
  const [style, setStyle] = useState<'full' | 'calm'>('full');
  /** Items finished this session (also re-keys the scene). */
  const [done, setDone] = useState(0);
  const [session, setSession] = useState(0);
  const [announce, setAnnounce] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const anims = useRef<Animation[]>([]);
  const saved = useRef<{ el: HTMLElement; origin: string; clip: string }[]>([]);
  const outTimer = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);
  const prevFocus = useRef<HTMLElement | null>(null);

  // A save's reward: queue its celebrations once (the reward box waits until they're done).
  useEffect(() => {
    const seen = new WeakSet<object>();
    return rewardStore.subscribe(() => {
      const r = rewardStore.get().reward;
      if (!r || seen.has(r)) return;
      seen.add(r);
      if (fxStore.get().mode === 'off') return;
      const items = celebrationsFor(r);
      if (items.length) celebrate(...items);
    });
  }, []);

  const restoreShell = useCallback(() => {
    for (const a of anims.current) a.cancel();
    anims.current = [];
    for (const s of saved.current) {
      s.el.style.transformOrigin = s.origin;
      s.el.style.clipPath = s.clip;
    }
    saved.current = [];
    shellParts(anchor.current)?.shell.classList.remove('is-fx');
  }, []);

  const shellIn = useCallback(() => {
    const p = shellParts(anchor.current);
    if (!p) return;
    p.shell.classList.add('is-fx');
    const run = (el: HTMLElement, from: Keyframe, to: Keyframe, origin: string, clip?: string) => {
      if (!saved.current.some((s) => s.el === el)) saved.current.push({ el, origin: el.style.transformOrigin, clip: el.style.clipPath });
      el.style.transformOrigin = origin;
      if (clip) el.style.clipPath = clip;
      anims.current.push(el.animate([from, to], { duration: IN_MS, easing: EASE_IN, fill: 'forwards' }));
    };
    if (p.main) {
      // Pivot near the bottom of what's on screen and tilt only that part (a static clip): the
      // rest of a long page would otherwise swing out toward the viewer and widen the page.
      const box = p.main.getBoundingClientRect();
      const above = Math.max(0, Math.round(-box.top - 40));
      const below = Math.max(0, Math.round(box.bottom - innerHeight - 40));
      run(p.main, { transform: FLAT_MAIN, opacity: 1 }, { transform: TILT_MAIN, opacity: 0.55 }, `50% ${Math.round(innerHeight * 0.8 - box.top)}px`, `inset(${above}px 0 ${below}px 0)`);
    }
    for (const b of p.bars) run(b, { transform: FLAT_BAR, opacity: 1 }, { transform: DROP_BAR, opacity: 0 }, '50% 100%');
    if (p.rail) run(p.rail, { transform: FLAT_RAIL, opacity: 1 }, { transform: AWAY_RAIL, opacity: 0.4 }, '0% 50%');
  }, []);

  const shellOut = useCallback(() => {
    const p = shellParts(anchor.current);
    if (!p) return;
    const opts: KeyframeAnimationOptions = { duration: OUT_MS, easing: 'ease-out', fill: 'forwards' };
    if (p.main) anims.current.push(p.main.animate([{ transform: TILT_MAIN, opacity: 0.55 }, { transform: OVER_MAIN, opacity: 1, offset: 0.62 }, { transform: FLAT_MAIN, opacity: 1 }], opts));
    for (const b of p.bars) anims.current.push(b.animate([{ transform: DROP_BAR, opacity: 0 }, { transform: FLAT_BAR, opacity: 1 }], { ...opts, delay: 120, duration: OUT_MS - 120 }));
    if (p.rail) anims.current.push(p.rail.animate([{ transform: AWAY_RAIL, opacity: 0.4 }, { transform: FLAT_RAIL, opacity: 1 }], opts));
  }, []);

  const advance = useCallback(() => {
    celebrationStore.set((s) => ({ ...s, queue: s.queue.slice(1) }));
    setDone((n) => n + 1);
  }, []);
  const skipAll = useCallback(() => {
    celebrationStore.set((s) => ({ ...s, queue: [] }));
  }, []);

  // Start, resume or finish the session as the queue fills and empties.
  useEffect(() => {
    if (current && phase === 'idle') {
      const st = playStyle();
      setStyle(st);
      setDone(0);
      prevFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      celebrationStore.set({ playing: true });
      setPhase('play');
      if (st === 'full') shellIn();
    } else if (current && phase === 'out') {
      window.clearTimeout(outTimer.current);
      restoreShell();
      setSession((n) => n + 1);
      setPhase('play');
      if (style === 'full') shellIn();
    } else if (!current && phase === 'play') {
      setPhase('out');
      if (style === 'full') shellOut();
      else root.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' });
      outTimer.current = window.setTimeout(
        () => {
          restoreShell();
          setPhase('idle');
          setAnnounce('');
          celebrationStore.set({ playing: false });
          const back = prevFocus.current;
          prevFocus.current = null;
          if (back?.isConnected && !rewardStore.get().reward) back.focus({ preventScroll: true });
        },
        style === 'full' ? OUT_MS : FADE_MS,
      );
    }
  }, [current, phase, style, shellIn, shellOut, restoreShell]);

  // Leaving the page mid-sequence: put everything back.
  useEffect(
    () => () => {
      window.clearTimeout(outTimer.current);
      restoreShell();
      celebrationStore.set({ playing: false });
    },
    [restoreShell],
  );

  // Each item: announce it, then move on by itself.
  useEffect(() => {
    if (phase !== 'play' || !current) return;
    startedAt.current = performance.now();
    const t = tell(current);
    setAnnounce(`${current.preview ? 'Preview, nothing earned. ' : ''}${t.kicker}: ${t.title}. ${t.line}`);
    const ms = style === 'full' ? timing(current).dur : CALM_MS;
    const id = window.setTimeout(advance, ms);
    return () => window.clearTimeout(id);
    // `done` re-runs this for the same object queued twice in a row
  }, [current, phase, style, done, advance]);

  // A layout effect, so Escape works from the first frame (a passive effect can run late after a
  // heavy first paint, and an early Escape would be lost).
  useLayoutEffect(() => {
    if (phase === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // the Emblems inspector also listens for Escape: this one is ours
        e.stopImmediatePropagation();
        e.preventDefault();
        skipAll();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [phase, skipAll]);

  useEffect(() => {
    if (phase === 'play') skipRef.current?.focus({ preventScroll: true });
  }, [phase, session]);

  // Calm cards cross-fade (WAAPI, so it still plays where CSS animations are switched off).
  useLayoutEffect(() => {
    if (phase !== 'play' || style !== 'calm' || !root.current) return;
    const card = root.current.querySelector('.fx-calm');
    card?.animate([{ opacity: 0, transform: 'scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: FADE_MS, easing: 'ease-out' });
  }, [phase, style, done, current]);
  useLayoutEffect(() => {
    if (phase === 'play' && style === 'calm') root.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS });
  }, [phase, style, session]);

  const onTap = () => {
    if (phase !== 'play' || performance.now() - startedAt.current < TAP_GUARD_MS) return;
    advance();
  };

  const tm = current ? timing(current) : null;
  const hit = tm?.hit ?? 0;
  const remaining = queue.length;
  const total = done + remaining;
  const label = current ? `${current.preview ? 'Preview: ' : ''}${tell(current).kicker}` : 'Celebration';

  return (
    <>
      <span ref={anchor} className="fx-sr" aria-live="polite" aria-atomic="true">
        {announce}
      </span>
      {phase !== 'idle' && (
        <div
          ref={root}
          className={`fx fx--${style}`}
          data-phase={phase}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={onTap}
          style={{ '--fxc': current ? tell(current).color : 'var(--sig)' } as React.CSSProperties}
        >
          {style === 'full' ? (
            <div className="fx-panels" key={`p${session}`} aria-hidden="true">
              <i className="fx-half fx-half--a" />
              <i className="fx-half fx-half--b" />
              <i className="fx-slash" />
            </div>
          ) : (
            <i className="fx-dim" aria-hidden="true" />
          )}
          {current && (
            <div className={`fx-shot${tm?.shake ? ` fx-shot--${tm.shake}` : ''}`} key={`s${done}`} style={{ '--hit': `${hit}ms` } as React.CSSProperties}>
              {style === 'full' ? <Scene c={current} /> : <CalmCard c={current} />}
            </div>
          )}
          {current && (
            <div className="fx-hud" onClick={(e) => e.stopPropagation()}>
              <span className="fx-hud__l">
                {current.preview ? <span className="fx-preview">Preview — nothing earned</span> : total > 1 ? <span className="fx-count">{`${done + 1} / ${total}`}</span> : null}
              </span>
              {remaining > 1 && (
                <button type="button" className="fx-btn fx-btn--ghost" onClick={skipAll}>
                  Skip all
                </button>
              )}
              <button ref={skipRef} type="button" className="fx-btn" onClick={advance}>
                {remaining > 1 ? 'Next' : 'Skip'}
              </button>
            </div>
          )}
          {current && <p className="fx-tap" aria-hidden="true">Tap to continue</p>}
        </div>
      )}
    </>
  );
}
