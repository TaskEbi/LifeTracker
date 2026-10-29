import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAchievements } from '../../data/lt';
import { shortDay } from '../../domain/log/dates';
import { TIERS, type Achievement, type Tier } from '../../domain/progress/achievements';
import { ACHIEVEMENT_GROUPS, type AchievementGroup } from '../../domain/progress/glyphs';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { Chips } from '../../ui/i/bits';
import { Emblem } from '../../ui/i/Emblem';
import { celebrate, celebrationStore } from '../../ui/i/fx/celebrate';
import './emblems.css';

const TIER_NAME: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

const sect = (s: Parameters<typeof sectionInfo>[0]) => ({ name: sectionInfo(s).name, kanji: sectionInfo(s).kanji });
/** Group headings: a name and the kanji the app uses for it. */
const GROUP: Record<AchievementGroup, { name: string; kanji: string; c: string }> = {
  start: { name: 'First steps', kanji: '始', c: 'var(--sig)' },
  streaks: { name: 'Streaks', kanji: '連', c: 'var(--sig)' },
  time: { name: 'Time', kanji: '時', c: 'var(--acc2)' },
  violin: { ...sect('violin'), c: 'var(--c-violin)' },
  coding: { ...sect('coding'), c: 'var(--c-coding)' },
  sports: { ...sect('sports'), c: 'var(--c-sports)' },
  gym: { ...sect('gym'), c: 'var(--c-gym)' },
  study: { ...sect('study'), c: 'var(--c-study)' },
  chess: { ...sect('chess'), c: 'var(--c-chess)' },
  sleep: { ...sect('sleep'), c: 'var(--c-sleep)' },
  screen: { ...sect('screen'), c: 'var(--c-screen)' },
  tasks: { name: 'Tasks', kanji: '務', c: 'var(--c-quests)' },
  cabinet: { ...sect('cabinet'), c: 'var(--c-cabinet)' },
  levels: { name: 'Levels', kanji: '段', c: 'var(--acc2)' },
  quests: { name: 'Quests', kanji: '任', c: 'var(--c-quests)' },
  bosses: { name: 'Bosses', kanji: '討', c: 'var(--sig)' },
  secret: { name: 'Secret', kanji: '秘', c: 'var(--fg-2)' },
};

const hidden = (a: Achievement) => !!a.secret && !a.unlockedOn;
const titleOf = (a: Achievement) => (hidden(a) ? '???' : a.title);
const descOf = (a: Achievement) => (hidden(a) ? 'A secret. Keep playing to find it.' : a.desc);
const ratio = (a: Achievement) => (a.goal ? a.progress / a.goal : 0);
function label(a: Achievement) {
  const t = hidden(a) ? 'Secret emblem' : a.title;
  const state = a.unlockedOn ? `unlocked ${shortDay(a.unlockedOn)}` : hidden(a) ? 'locked' : `locked, ${a.progress} of ${a.goal}`;
  return `${t}, ${TIER_NAME[a.tier]}, ${state}`;
}

const COLLAPSE_KEY = 'lifetracker-emblem-groups';
function readCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── card ─────────────────────────────────────────────────────────────────── */

function Card({ a, onOpen }: { a: Achievement; onOpen: (a: Achievement, el: HTMLElement) => void }) {
  const on = !!a.unlockedOn;
  return (
    <li className="pg-em-cell">
      <button
        type="button"
        className={`pg-em-card pg-em--${a.tier}${on ? ' is-on' : ''}`}
        aria-label={label(a)}
        aria-haspopup="dialog"
        onClick={(e) => onOpen(a, e.currentTarget)}
      >
        <span className="pg-em-card__m" aria-hidden="true">
          <Emblem a={a} size={72} locked={!on} secret={a.secret} />
        </span>
        <b className="pg-em-card__t">{titleOf(a)}</b>
        <small className="pg-em-card__d">{descOf(a)}</small>
        {on ? (
          <span className="pg-em-card__when i-mono">{shortDay(a.unlockedOn!)}</span>
        ) : (
          <span className="pg-em-card__prog">
            <span className="pg-em-bar" aria-hidden="true">
              <i style={{ width: `${Math.round(ratio(a) * 100)}%` }} />
            </span>
            <span className="i-mono">{hidden(a) ? '?' : `${a.progress}/${a.goal}`}</span>
          </span>
        )}
      </button>
    </li>
  );
}

/** A cheap 3D tilt for whichever card the pointer is on: two CSS variables, transform only. */
function useTilt() {
  const last = useRef<HTMLElement | null>(null);
  const reset = () => {
    const el = last.current;
    if (el) {
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
      el.classList.remove('is-tilt');
    }
    last.current = null;
  };
  const move = (e: RPointerEvent) => {
    if (reducedMotion()) return;
    if (e.pointerType === 'touch' && !e.buttons) return;
    const card = (e.target as HTMLElement).closest<HTMLElement>('.pg-em-card');
    if (last.current && last.current !== card) reset();
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--rx', `${(-y * 18).toFixed(1)}deg`);
    card.style.setProperty('--ry', `${(x * 22).toFixed(1)}deg`);
    card.classList.add('is-tilt');
    last.current = card;
  };
  return { onPointerMove: move, onPointerDown: move, onPointerLeave: reset, onPointerUp: (e: RPointerEvent) => e.pointerType === 'touch' && reset(), onPointerCancel: reset };
}

/* ── panel ────────────────────────────────────────────────────────────────── */

export function AchievementsPanel() {
  const ach = useAchievements();
  const [filter, setFilter] = useState<'all' | 'on' | 'off'>('all');
  const [order, setOrder] = useState<'group' | 'close'>('group');
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [open, setOpen] = useState<{ id: string; from: HTMLElement } | null>(null);
  const tilt = useTilt();

  const unlocked = ach.filter((a) => a.unlockedOn);
  const shown = ach.filter((a) => (filter === 'on' ? a.unlockedOn : filter === 'off' ? !a.unlockedOn : true));
  const pct = ach.length ? Math.round((unlocked.length / ach.length) * 100) : 0;

  const groups = useMemo(() => {
    const by = new Map<AchievementGroup, Achievement[]>();
    for (const a of shown) by.set(a.group, [...(by.get(a.group) ?? []), a]);
    return ACHIEVEMENT_GROUPS.filter((g) => by.has(g)).map((g) => ({ g, list: by.get(g)!, all: ach.filter((a) => a.group === g) }));
  }, [shown, ach]);

  const closest = useMemo(
    () =>
      [...shown].sort((a, b) => {
        if (!a.unlockedOn !== !b.unlockedOn) return a.unlockedOn ? 1 : -1;
        if (a.unlockedOn) return b.unlockedOn!.localeCompare(a.unlockedOn!);
        return ratio(b) - ratio(a);
      }),
    [shown],
  );

  const toggle = (g: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...n]));
      } catch {
        /* per-device nicety only */
      }
      return n;
    });

  const onOpen = useCallback((a: Achievement, from: HTMLElement) => setOpen({ id: a.id, from }), []);
  const current = open ? ach.find((a) => a.id === open.id) : undefined;

  return (
    <div className="pg-em">
      <div className="pg-em-sum">
        <div className="pg-em-ring" role="img" aria-label={`${pct}% of emblems unlocked`} style={{ '--p': pct } as CSSProperties}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="27" className="pg-em-ring__bg" />
            <circle cx="32" cy="32" r="27" className="pg-em-ring__fg" pathLength="100" strokeDasharray={`${pct} 100`} />
          </svg>
          <b className="i-mono">{pct}%</b>
        </div>
        <div className="pg-em-sum__n">
          <span className="pg-em-sum__k" aria-hidden="true">
            紋
          </span>
          <b className="i-mono">
            {unlocked.length}
            <small>/{ach.length}</small>
          </b>
          <span>emblems unlocked</span>
        </div>
        <ul className="pg-em-tiers" aria-label="Unlocked by tier">
          {TIERS.map((t) => {
            const all = ach.filter((a) => a.tier === t);
            const n = all.filter((a) => a.unlockedOn).length;
            return (
              <li key={t} className={`pg-em-tier pg-em--${t}`} aria-label={`${TIER_NAME[t]}: ${n} of ${all.length}`}>
                <Emblem a={{ id: `tier-${t}`, tier: t, glyph: 'star' }} size={34} ribbon={false} />
                <b className="i-mono">
                  {n}/{all.length}
                </b>
                <small>{TIER_NAME[t]}</small>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pg-em-ctl">
        <Chips
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: `All ${ach.length}` },
            { id: 'on', label: `Unlocked ${unlocked.length}` },
            { id: 'off', label: `Locked ${ach.length - unlocked.length}` },
          ]}
        />
        <Chips
          label="Order"
          value={order}
          onChange={setOrder}
          options={[
            { id: 'group', label: 'Groups' },
            { id: 'close', label: 'Closest' },
          ]}
        />
      </div>

      {!shown.length ? (
        <p className="i-note">{filter === 'on' ? 'Nothing unlocked yet. The closest ones are under Locked.' : 'Every emblem is unlocked.'}</p>
      ) : order === 'close' ? (
        <ul className="pg-em-grid" aria-label="Achievements" {...tilt}>
          {closest.map((a) => (
            <Card key={a.id} a={a} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <ul className="pg-em-groups" aria-label="Achievements" {...tilt}>
          {groups.map(({ g, list, all }) => {
            const info = GROUP[g];
            const shut = collapsed.has(g);
            return (
              <li key={g} className="pg-em-group" style={{ '--gc': info.c, containIntrinsicHeight: `auto ${Math.ceil(list.length / 3) * 196 + 56}px` } as CSSProperties}>
                <h2 className="pg-em-group__h">
                  <button type="button" aria-expanded={!shut} aria-controls={`pg-em-g-${g}`} onClick={() => toggle(g)}>
                    <span className="pg-em-group__k" aria-hidden="true">
                      {info.kanji}
                    </span>
                    <span className="pg-em-group__n">{info.name}</span>
                    <span className="pg-em-group__c i-mono">
                      {all.filter((a) => a.unlockedOn).length}/{all.length}
                    </span>
                    <span className="pg-em-group__chev" aria-hidden="true" />
                  </button>
                </h2>
                <ul id={`pg-em-g-${g}`} className="pg-em-grid" aria-label={info.name} hidden={shut}>
                  {!shut && list.map((a) => <Card key={a.id} a={a} onOpen={onOpen} />)}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {current && open && <Inspector a={current} onClose={() => setOpen(null)} returnTo={open.from} />}
    </div>
  );
}

/* ── inspector: the emblem as a 3D coin ───────────────────────────────────── */

const EDGE_LAYERS = 12;

function Inspector({ a, onClose, returnTo }: { a: Achievement; onClose: () => void; returnTo: HTMLElement }) {
  const on = !!a.unlockedOn;
  const box = useRef<HTMLDivElement>(null);
  const coin = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const playing = useStore(celebrationStore, (s) => s.playing || s.queue.length > 0);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [side, setSide] = useState<'front' | 'back'>('front');

  // Spin state lives outside React: the rAF loop writes the transform directly and only runs
  // while the coin is moving (a drag, inertia, a flip or the idle spin).
  const st = useRef({ angle: -18, v: 0, drag: false, lastX: 0, lastT: 0, raf: 0, timer: 0, idleAt: 0, tween: null as null | { from: number; to: number; t0: number; ms: number } });
  const reduced = useMemo(reducedMotion, []);

  const paint = () => {
    const el = coin.current;
    if (!el) return;
    const ang = st.current.angle;
    el.style.transform = `rotateX(8deg) rotateY(${ang.toFixed(2)}deg)`;
    // The sheen slides across as the coin turns.
    el.style.setProperty('--sx', `${(Math.sin((ang * Math.PI) / 180) * 32).toFixed(1)}%`);
    const norm = ((ang % 360) + 360) % 360;
    const face = norm > 90 && norm < 270 ? 'back' : 'front';
    // Also hide the far face directly, in case a browser flattens the 3D (backface-visibility then fails).
    if (el.dataset.side !== face) el.dataset.side = face;
    setSide(face);
  };

  const loop = () => {
    const s = st.current;
    s.raf = 0;
    const now = performance.now();
    let moving = false;
    if (s.tween) {
      const k = Math.min(1, (now - s.tween.t0) / s.tween.ms);
      s.angle = s.tween.from + (s.tween.to - s.tween.from) * (1 - Math.pow(1 - k, 3));
      if (k >= 1) s.tween = null;
      moving = true;
    } else if (s.drag) {
      return;
    } else if (Math.abs(s.v) > 0.04) {
      s.angle += s.v;
      s.v *= 0.95;
      moving = true;
    } else if (!reduced && !document.hidden) {
      if (now >= s.idleAt) {
        s.angle += 0.35; // idle: about 20° a second
        moving = true;
      } else {
        clearTimeout(s.timer);
        s.timer = window.setTimeout(kick, s.idleAt - now + 16);
      }
    }
    if (moving) {
      paint();
      s.raf = requestAnimationFrame(loop);
    }
  };
  const kick = () => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    const s = st.current;
    cancelAnimationFrame(s.raf);
    clearTimeout(s.timer);
    s.raf = 0;
  };
  const pause = (ms = 5000) => {
    st.current.idleAt = performance.now() + ms;
  };

  useEffect(() => {
    paint();
    st.current.idleAt = performance.now() + 700;
    kick();
    const vis = () => kick();
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      stop();
    };
  }, []);

  // Focus, Escape, a Tab trap and a still page underneath, like the sheets.
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (playingRef.current) return; // the celebration on top handles its own keys
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        turnTo(st.current.angle + (e.key === 'ArrowLeft' ? -30 : 30), 260);
      } else if (e.key === 'Tab' && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      if (returnTo.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, []);

  function turnTo(to: number, ms: number) {
    const s = st.current;
    s.v = 0;
    pause();
    if (reduced || ms === 0) {
      s.tween = null;
      s.angle = to;
      paint();
      return;
    }
    s.tween = { from: s.angle, to, t0: performance.now(), ms };
    kick();
  }

  const flip = () => {
    // to the nearest face, then half a turn
    const near = Math.round(st.current.angle / 180) * 180;
    turnTo(near + 180, 650);
  };

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    s.drag = true;
    s.tween = null;
    s.v = 0;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
    stop();
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.drag) return;
    const now = performance.now();
    const dx = e.clientX - s.lastX;
    s.angle += dx * 0.55;
    const dt = Math.max(1, now - s.lastT);
    s.v = s.v * 0.4 + ((dx * 0.55) / dt) * 16.7 * 0.6; // degrees per frame
    s.lastX = e.clientX;
    s.lastT = now;
    if (!s.raf)
      s.raf = requestAnimationFrame(() => {
        s.raf = 0;
        paint();
      });
  };
  const up = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false;
    if (performance.now() - s.lastT > 80) s.v = 0; // held still before letting go
    s.v = Math.max(-25, Math.min(25, s.v));
    pause(4000);
    if (reduced) {
      s.v = 0;
      turnTo(Math.round(s.angle / 180) * 180, 0);
    } else kick();
  };

  const group = GROUP[a.group];
  const pct = Math.round(ratio(a) * 100);
  const sec = a.section ? `var(--c-${a.section})` : 'var(--c-quests)';
  const style = { '--tc': `var(--t-${a.tier})`, '--sc': sec } as CSSProperties;

  return createPortal(
    <div className={`pg-em-insp pg-em--${a.tier}${on ? ' is-on' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} ref={box} style={style}>
      <div className="pg-em-insp__bg" aria-hidden="true" onClick={onClose} />
      <div className="pg-em-insp__in">
        <p className="pg-em-insp__kick">
          <span aria-hidden="true">{group.kanji}</span> {group.name} · {TIER_NAME[a.tier]}
        </p>
        <div
          className="pg-em-stage"
          role="img"
          aria-label={`${hidden(a) ? 'Secret' : a.title} emblem, showing its ${side}. Drag sideways or use the arrow keys to turn it.`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <div className="pg-em-coin" ref={coin} data-side="front">
            {Array.from({ length: EDGE_LAYERS }, (_, i) => (
              <Emblem
                key={i}
                a={a}
                size={300}
                silhouette={on ? `color-mix(in srgb, var(--t-${a.tier}) ${i % 2 ? 48 : 62}%, #000)` : `color-mix(in srgb, var(--fg-3) ${i % 2 ? 30 : 40}%, var(--surf))`}
                className="pg-em-coin__edge"
                style={{ '--z': `${(i - (EDGE_LAYERS - 1) / 2) * 1.3}px` } as CSSProperties}
              />
            ))}
            <div className="pg-em-coin__face pg-em-coin__front">
              <Emblem a={a} size={300} locked={!on} secret={a.secret} ribbon={false} />
              <span className="pg-em-coin__sheen" />
            </div>
            <div className="pg-em-coin__face pg-em-coin__back">
              <Emblem a={a} size={300} silhouette={on ? `color-mix(in srgb, var(--t-${a.tier}) 70%, #000)` : 'var(--surf-3)'} />
              <Emblem a={a} size={300} silhouette={on ? `color-mix(in srgb, var(--t-${a.tier}) 22%, var(--surf))` : 'var(--surf-2)'} className="pg-em-coin__plate" />
              <span className="pg-em-coin__wm" aria-hidden="true">
                {group.kanji}
              </span>
              <div className="pg-em-coin__txt" aria-hidden="true">
                <span className="pg-em-coin__tier">{TIER_NAME[a.tier]}</span>
                <b>{titleOf(a)}</b>
                <small>{descOf(a)}</small>
                {on ? <span className="i-mono">{shortDay(a.unlockedOn!)}</span> : <span className="i-mono">{hidden(a) ? '???' : `${a.progress}/${a.goal}`}</span>}
              </div>
              <span className="pg-em-coin__sheen" />
            </div>
          </div>
        </div>

        <h2 className="pg-em-insp__t" id={titleId}>
          {titleOf(a)}
        </h2>
        <div id={descId} className="pg-em-insp__d">
          <p>{descOf(a)}</p>
          {on ? (
            <p className="pg-em-insp__when">Unlocked {shortDay(a.unlockedOn!)}</p>
          ) : (
            <div className="pg-em-insp__prog">
              <span className="pg-em-bar" role="progressbar" aria-label={`${titleOf(a)} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${pct}%` }} />
              </span>
              <span className="i-mono">{hidden(a) ? 'Locked' : `${a.progress} of ${a.goal}`}</span>
            </div>
          )}
        </div>

        <div className="pg-em-insp__btns">
          <button type="button" className="pg-em-btn" ref={first} onClick={flip} aria-label={side === 'front' ? 'Flip to the back' : 'Flip to the front'}>
            Flip
          </button>
          {on && (
            <button type="button" className="pg-em-btn pg-em-btn--go" onClick={() => celebrate({ kind: 'achievement', achievement: a, preview: true })}>
              Replay unlock
            </button>
          )}
          <button type="button" className="pg-em-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
