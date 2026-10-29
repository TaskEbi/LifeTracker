/**
 * Section level-ups, one per section, each echoing that section's illustrated world
 * (src/features/<section>/Art.tsx): the recital stage, the CRT, the trail map, the iron
 * warehouse, the chalkboard, the chess column, the night sky, the zen garden and the cabinet.
 * 'general' and anything unknown keep the generic kanji cube (scenes.tsx).
 */
import { useMemo } from 'react';
import type { SectionId } from '../../../../data/types';
import { Burst, Caption, Embers, glyphPath, GLYPHS, pad2, range, rng, Ripples, safeSection, Stamp, Twinkles, type Css } from '../kit';
import type { SectionFx } from './types';
import './sections.css';

function SecCap({ id, from, to, ink }: { id: SectionId; from: number; to: number; ink?: boolean }) {
  const s = safeSection(id);
  return <Caption className={ink ? 'fx-cap--ink' : ''} chip={`${s?.code ?? ''} · technique up`} title={s?.full ?? id} line={<>LV {pad2(from)} → <b>LV {pad2(to)}</b></>} />;
}

// ─── 1 violin: curtain call ──────────────────────────────────────────────────

const VBODY = 'M40 70C53 70 70 77 70 94C70 105 68 111 64 114C60 117 58 122 58.6 129C59 136 61 140 66 143C74 148 78 159 78 171C78 189 62 200 40 200C18 200 2 189 2 171C2 159 6 148 14 143C19 140 21 136 21.4 129C22 122 20 117 16 114C12 111 10 105 10 94C10 77 27 70 40 70Z';

function Violin() {
  return (
    <svg className="fx-vl__violin" viewBox="0 0 80 206" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fxvl-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0a24c" />
          <stop offset=".5" stopColor="#b5541f" />
          <stop offset="1" stopColor="#5e220c" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="10" r="7" fill="url(#fxvl-wood)" stroke="#2a0f04" strokeWidth="1" />
      <path d="M35 16h10l1 22H34z" fill="#8a3c15" stroke="#2a0f04" strokeWidth="1" />
      <path d="M36 38h8l.8 34h-9.6z" fill="#9c4a1c" />
      <path d={VBODY} fill="url(#fxvl-wood)" stroke="#2a0f04" strokeWidth="1.4" />
      <path d="M30 118c-3 4 2 9-1 15s-4 9-1 13M50 118c3 4-2 9 1 15s4 9 1 13" fill="none" stroke="#1d0c05" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M36.4 36h7.2l2.4 96q-6 3-12 0z" fill="#17100c" />
      <path d="M30 150h20l-1.6-4.6h-16.8z" fill="#f0d9a3" />
      <path d="M35 160h10l2.2 26q-7.2 4.6-14.4 0z" fill="#17100c" />
      <g stroke="#f6ead0" strokeWidth=".5">
        <path d="M38 38L36.6 161M39.4 38L39 161M40.6 38L41 161M42 38L43.4 161" />
      </g>
      <ellipse cx="30" cy="92" rx="10" ry="14" fill="#ffe6b8" opacity=".22" />
    </svg>
  );
}

function ViolinScene({ from, to }: { from: number; to: number }) {
  const notes = useMemo(() => range(8).map((i) => ({ transform: `rotateY(${i * 45}deg) translateZ(118px) translateY(${70 - i * 24}px)`, '--d': `${900 + i * 90}ms` }) as Css), []);
  return (
    <div className="fx-scene fx-vl" style={{ '--tc': '#e8c27a' } as Css}>
      <i className="fx-bg fx-vl__hall" />
      <i className="fx-vl__spot" />
      <i className="fx-vl__floor" />
      <div className="fx-at fx-vl__at">
        <div className="fx-vl__helix">
          {notes.map((st, i) => (
            <span key={i} className="fx-vl__note" style={st}>
              {i % 3 === 0 ? '♫' : '♪'}
            </span>
          ))}
        </div>
        <div className="fx-vl__fly">
          <Violin />
        </div>
      </div>
      <div className="fx-stage fx-vl__curtains" aria-hidden="true">
        <i className="fx-vl__cur fx-vl__cur--l" />
        <i className="fx-vl__cur fx-vl__cur--r" />
        <i className="fx-vl__valance" />
      </div>
      <div className="fx-at fx-vl__cardat">
        <div className="fx-vl__card">
          <small>Tonight's programme</small>
          <em>Level</em>
          <b>{to}</b>
          <small>
            Violin · LV {from} → {to}
          </small>
        </div>
      </div>
      <Burst n={12} seed={to * 3 + 1} colors={['#e8c27a', '#fff3d6', '#c9a24a']} spread={[110, 230]} delay="1300ms" />
      <SecCap id="violin" from={from} to={to} />
    </div>
  );
}

// ─── 2 coding: green CRT, Accepted ───────────────────────────────────────────

const RAIN = 'アカサタナハマヤラワ01ｦｱｳｴｵｶｷｸｹｺ{}<>=+#;'.split('');

function CodingScene({ from, to }: { from: number; to: number }) {
  const cols = useMemo(() => {
    const r = rng(to * 17 + 5);
    return range(10).map((i) => {
      const z = Math.round(-700 + r() * 820);
      return {
        text: range(14)
          .map(() => RAIN[Math.floor(r() * RAIN.length)])
          .join(''),
        style: { left: `${(i / 10) * 100 + r() * 6}%`, '--z': `${z}px`, '--d': `${-Math.round(r() * 2600)}ms`, '--o': (0.25 + (z + 700) / 2000).toFixed(2) } as Css,
      };
    });
  }, [to]);
  const lv = `LV ${to}`;
  return (
    <div className="fx-scene fx-cd" style={{ '--tc': '#3cff7a' } as Css}>
      <i className="fx-bg fx-cd__bg" />
      <div className="fx-stage fx-cd__rain" aria-hidden="true">
        {cols.map((c, i) => (
          <span key={i} className="fx-cd__col" style={c.style}>
            {c.text}
          </span>
        ))}
      </div>
      <div className="fx-at">
        <div className="fx-cd__mon">
          <i className="fx-cd__side" />
          <div className="fx-cd__bezel">
            <div className="fx-cd__tube">
              <p className="fx-cd__ln" style={{ '--in': '620ms' } as Css}>
                $ judge --submit level.cpp
              </p>
              <p className="fx-cd__ln" style={{ '--in': '800ms' } as Css}>
                tests 1..{from + 36} <span className="fx-cd__ok">✓✓✓✓✓✓</span>
              </p>
              <p className="fx-cd__verdict">
                <span>Accepted</span>
              </p>
              <p className="fx-cd__lv">
                {[...lv].map((ch, i) => (
                  <span key={i} style={{ '--in': `${1400 + i * 85}ms` } as Css}>
                    {ch === ' ' ? ' ' : ch}
                  </span>
                ))}
                <i className="fx-cd__caret" style={{ '--in': `${1400 + lv.length * 85}ms` } as Css} />
              </p>
              <i className="fx-cd__scan" />
            </div>
          </div>
          <span className="fx-cd__led" />
        </div>
      </div>
      <Burst n={10} seed={to * 5} colors={['#3cff7a', '#b6ffcf']} spread={[150, 260]} />
      <SecCap id="coding" from={from} to={to} />
    </div>
  );
}

// ─── 3 sports: the trail map folds up into terrain, a flag on the summit ────

function SportsScene({ from, to }: { from: number; to: number }) {
  const layers = [
    { w: 230, h: 200, x: 10, y: 4 },
    { w: 186, h: 158, x: 20, y: 0 },
    { w: 146, h: 124, x: 26, y: -6 },
    { w: 108, h: 92, x: 30, y: -10 },
    { w: 72, h: 62, x: 34, y: -14 },
    { w: 40, h: 34, x: 36, y: -16 },
  ];
  return (
    <div className="fx-scene fx-sp" style={{ '--tc': '#ff8a3d' } as Css}>
      <i className="fx-bg fx-sp__bg" />
      <div className="fx-at fx-sp__at">
        <div className="fx-sp__fly">
          <div className="fx-sp__map">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <g fill="none" stroke="#2f5a3a" strokeOpacity=".35" strokeWidth="1.2">
                {range(7).map((i) => (
                  <ellipse key={i} cx={40 + i * 3} cy={250 - i * 2} rx={20 + i * 12} ry={12 + i * 8} />
                ))}
              </g>
              <path d="M20 280C60 250 40 210 90 200S150 230 170 190S160 150 186 146" fill="none" stroke="#ff8a3d" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 9" />
              <path d="M0 100h300M0 200h300M100 0v300M200 0v300" stroke="#2f5a3a" strokeOpacity=".18" />
              <circle cx="20" cy="280" r="6" fill="#fff6dc" stroke="#1d3324" strokeWidth="2" />
            </svg>
            <i className="fx-sp__fold" />
            {layers.map((l, i) => (
              <i key={i} className="fx-sp__layer" style={{ width: l.w, height: l.h, marginLeft: -l.w / 2 + l.x, marginTop: -l.h / 2 + l.y, '--z': `${(i + 1) * 15}px`, '--d': `${900 + i * 70}ms`, '--lc': `color-mix(in srgb, #3f7a4c ${100 - i * 11}%, #f3e9c8)` } as Css} />
            ))}
            <div className="fx-sp__summit">
              <i className="fx-sp__ring" />
              <div className="fx-sp__flag">
                <i className="fx-sp__pole" />
                <span className="fx-sp__cloth">
                  <small>LV</small>
                  {to}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg className="fx-sp__compass" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#1d3324" stroke="#fff6dc" strokeWidth="2" />
        <path d="M32 6l5 26-5 26-5-26z" fill="#fff6dc" />
        <path d="M32 6l5 26h-10z" fill="#ff8a3d" />
      </svg>
      <Burst n={10} seed={to * 11} colors={['#ff8a3d', '#fff6dc']} spread={[110, 220]} delay="1520ms" />
      <SecCap id="sports" from={from} to={to} />
    </div>
  );
}

// ─── 4 gym: plates fly in from depth and slam onto the bar, the bar lifts ──

/** A barbell seen at an angle: `plates` per side, each flying in at its own delay. */
export function Barbell({ plates, first, step, className = '' }: { plates: { d: number; c: string }[]; first: number; step: number; className?: string }) {
  // left/right alternating, outward from the collars
  const placed = plates.flatMap((p, i) => {
    const off = 96 + plates.slice(0, i).reduce((n) => n + 22, 0);
    return [
      { ...p, x: -off, side: -1, k: i * 2 },
      { ...p, x: off, side: 1, k: i * 2 + 1 },
    ];
  });
  return (
    <div className={`fx-bb ${className}`}>
      <i className="fx-bb__bar" />
      <i className="fx-bb__sleeve fx-bb__sleeve--l" />
      <i className="fx-bb__sleeve fx-bb__sleeve--r" />
      {placed.map((p) => (
        <div key={p.k} className="fx-bb__fly" style={{ '--x': `${p.x}px`, '--sx': `${p.side * 420}px`, '--d': `${first + p.k * step}ms`, '--pd': `${p.d}px`, '--pc': p.c } as Css}>
          <i className="fx-bb__plate fx-bb__plate--b" />
          <i className="fx-bb__plate" />
        </div>
      ))}
    </div>
  );
}

const GYM_PLATES = [
  { d: 150, c: '#1c1e21' },
  { d: 124, c: '#24272b' },
  { d: 96, c: '#2c3035' },
];

function GymScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-gy" style={{ '--tc': '#d4ff3a' } as Css}>
      <i className="fx-bg fx-gy__bg" />
      <i className="fx-gy__tape" />
      <div className="fx-at fx-gy__at">
        <div className="fx-gy__rig">
          <div className="fx-gy__lift">
            <Barbell plates={GYM_PLATES} first={250} step={150} />
          </div>
        </div>
      </div>
      <Embers n={10} seed={to * 7} colors={['rgb(255 255 255 / .7)', 'rgb(212 255 58 / .7)']} spread={300} rise={160} delay={1150} className="fx-gy__dust" />
      <Stamp className="fx-gy__lv" delay={520}>
        <small>LEVEL</small>
        <b>{pad2(to)}</b>
      </Stamp>
      <SecCap id="gym" from={from} to={to} />
    </div>
  );
}

// ─── 5 study: the chalkboard swings in, LV written stroke by stroke ────────

function StudyScene({ from, to }: { from: number; to: number }) {
  const chars = ['L', 'V', ...String(to)];
  const paths = chars.map((ch, i) => ({ d: glyphPath(GLYPHS[ch] ?? [], i * 46 + (i >= 2 ? 22 : 0)), delay: 700 + i * 240 }));
  const width = chars.length * 46 + 22;
  const end = 700 + chars.length * 240;
  const dust = useMemo(() => {
    const r = rng(to * 13);
    return range(8).map((i) => ({ left: `${12 + (i / 8) * 76}%`, '--d': `${760 + i * 150}ms`, '--dx': `${Math.round((r() - 0.5) * 30)}px` }) as Css);
  }, [to]);
  return (
    <div className="fx-scene fx-st" style={{ '--tc': '#ffe066' } as Css}>
      <i className="fx-bg fx-st__bg" />
      <div className="fx-at">
        <div className="fx-st__board">
          <span className="fx-st__f fx-st__f1">a² + b² = c²</span>
          <span className="fx-st__f fx-st__f2">∫ x dx = x²⁄2</span>
          <span className="fx-st__k">学</span>
          <svg className="fx-st__write" viewBox={`-4 -6 ${width + 8} 80`} style={{ width: Math.min(250, width * 1.9) }} aria-hidden="true">
            {paths.map((p, i) => (
              <path key={i} d={p.d} pathLength={1} style={{ '--d': `${p.delay}ms` } as Css} />
            ))}
            <path className="fx-st__under" d={`M0 70Q${width / 2} 62 ${width} 68`} pathLength={1} style={{ '--d': `${end}ms` } as Css} />
          </svg>
          <i className="fx-st__chalk" style={{ '--cd': `${end - 700}ms` } as Css} />
          {dust.map((d, i) => (
            <i key={i} className="fx-st__dust" style={d} />
          ))}
          <span className="fx-st__tray" />
        </div>
      </div>
      <SecCap id="study" from={from} to={to} />
    </div>
  );
}

// ─── 6 chess: the board tilts up, the knight leaps in an L, checkmate ──────

function ChessScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-ch" style={{ '--tc': '#b3261e' } as Css}>
      <i className="fx-bg fx-ch__paper" />
      <span className="fx-ch__mast">The Chess Column</span>
      <div className="fx-at fx-ch__at">
        <div className="fx-ch__tilt">
          <div className="fx-ch__board">
            <svg className="fx-ch__move" viewBox="0 0 256 256" aria-hidden="true">
              <path d="M144 240V176H164" fill="none" stroke="#b3261e" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 7" />
              <path d="M162 167l14 9-14 9z" fill="#b3261e" />
            </svg>
            <i className="fx-ch__ring" />
            <div className="fx-ch__king">
              <span>{'♚︎'}</span>
            </div>
            <div className="fx-ch__knight">
              <span>{'♞︎'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="fx-ch__plate">
        <span className="fx-ch__mate">Checkmate</span>
        <svg className="fx-ch__crown" viewBox="0 0 60 40" aria-hidden="true">
          <path d="M4 36L8 10l12 14L30 4l10 20 12-14 4 26z" fill="#d4a017" stroke="#1b1a17" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="30" cy="4" r="3" fill="#b3261e" stroke="#1b1a17" strokeWidth="1.5" />
        </svg>
        <b className="fx-ch__lv">LV {to}</b>
      </div>
      <SecCap id="chess" from={from} to={to} ink />
    </div>
  );
}

// ─── 7 sleep: the moon rises, stars connect into the level's digits ────────

function SleepScene({ from, to }: { from: number; to: number }) {
  const digits = [...String(to)];
  const W = 46;
  const scale = digits.length <= 1 ? 2.6 : digits.length === 2 ? 2 : 1.5;
  const { stars, lines } = useMemo(() => {
    const digits = [...String(to)];
    const st: { x: number; y: number; d: number }[] = [];
    const ln: { d: string; delay: number }[] = [];
    let k = 0;
    digits.forEach((ch, i) => {
      const strokes = GLYPHS[ch] ?? [];
      const seen = new Set<string>();
      for (const s of strokes)
        for (const [x, y] of s) {
          const key = `${x},${y}`;
          if (seen.has(key)) continue;
          seen.add(key);
          st.push({ x: (x + i * W) * scale, y: y * scale, d: 450 + k++ * 55 });
        }
      ln.push({ d: glyphPath(strokes, i * W, 1).replace(/[\d.]+/g, (v) => String(Number(v) * scale)), delay: 950 + i * 260 });
    });
    return { stars: st, lines: ln };
  }, [to]);
  const w = (digits.length * W - 6) * scale;
  return (
    <div className="fx-scene fx-sl" style={{ '--tc': '#b6bdff' } as Css}>
      <i className="fx-bg fx-sl__sky" />
      <Twinkles n={7} seed={to * 3} top={50} />
      <div className="fx-stage fx-sl__cam">
        <div className="fx-sl__moon">
          <i className="fx-sl__halo" />
          <i className="fx-sl__disc" />
        </div>
      </div>
      <div className="fx-sl__con" style={{ width: w, marginLeft: -w / 2 }}>
        <span className="fx-sl__lv">LV</span>
        <svg viewBox={`-4 -4 ${w + 8} ${60 * scale + 8}`} style={{ width: w + 8, height: 60 * scale + 8 }} aria-hidden="true">
          {lines.map((l, i) => (
            <path key={i} d={l.d} pathLength={1} style={{ '--d': `${l.delay}ms` } as Css} />
          ))}
        </svg>
        {stars.map((s, i) => (
          <i key={i} className="fx-sl__star" style={{ left: s.x, top: s.y, '--d': `${s.d}ms` } as Css} />
        ))}
        <i className="fx-sl__glint" />
      </div>
      <i className="fx-sl__cloud fx-sl__cloud--a" />
      <i className="fx-sl__cloud fx-sl__cloud--b" />
      <i className="fx-sl__hills" />
      <SecCap id="sleep" from={from} to={to} />
    </div>
  );
}

// ─── 8 screen: a stone drops into the sand, ripples, an ensō round LV ──────

function ScreenScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-zn" style={{ '--tc': '#3d5a45' } as Css}>
      <i className="fx-bg fx-zn__paper" />
      <div className="fx-zn__enso">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path className="fx-zn__brush" d="M118 22C70 12 24 46 24 100s40 80 80 78 74-36 72-84c-1-30-20-52-40-62" pathLength={1} />
          <path className="fx-zn__brush fx-zn__brush--dry" d="M120 26C74 18 30 50 30 100s38 74 76 72 68-34 66-78" pathLength={1} />
        </svg>
        <span className="fx-zn__lv">
          <small>LV</small>
          {to}
        </span>
      </div>
      <div className="fx-at fx-zn__at">
        <div className="fx-zn__plane">
          <i className="fx-zn__sand" />
          <i className="fx-zn__shadow" />
          <Ripples n={4} delay={760} gap={170} tilt={0} className="fx-zn__rip" />
          <div className="fx-zn__drop">
            <svg className="fx-zn__stone" viewBox="0 0 80 52" aria-hidden="true">
              <defs>
                <radialGradient id="fxzn-stone" cx=".35" cy=".3" r=".8">
                  <stop offset="0" stopColor="#a39e94" />
                  <stop offset=".6" stopColor="#6e6a62" />
                  <stop offset="1" stopColor="#3f3c37" />
                </radialGradient>
              </defs>
              <path d="M4 34C4 14 22 2 42 2s34 10 34 28-16 20-36 20S4 48 4 34z" fill="url(#fxzn-stone)" />
            </svg>
          </div>
        </div>
      </div>
      <svg className="fx-zn__bamboo" viewBox="0 0 40 120" aria-hidden="true">
        <path d="M14 120V8" stroke="#5f7a4a" strokeWidth="5" />
        <path d="M11 40h6M11 74h6M11 104h6" stroke="#3f5a33" strokeWidth="2" />
        <path d="M16 38c10-6 18-6 24-2c-8 4-16 5-24 2zM14 70c-8-8-12-10-14-10c4 6 8 10 14 10zM16 22c8-10 14-14 22-14c-6 8-12 12-22 14z" fill="#7a9a5c" />
      </svg>
      <SecCap id="screen" from={from} to={to} ink />
    </div>
  );
}

// ─── 9 cabinet: a drawer slides out toward the camera with the LV card ─────

function CabinetScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-cb" style={{ '--tc': '#d9a441' } as Css}>
      <i className="fx-bg fx-cb__wall" />
      <div className="fx-at fx-cb__at">
        <div className="fx-cb__cab">
          {range(9).map((i) =>
            i === 4 ? (
              <i key={i} className="fx-cb__hole" />
            ) : (
              <i key={i} className="fx-cb__cell">
                <b />
              </i>
            ),
          )}
          <div className="fx-cb__drawer">
            <i className="fx-cb__f fx-cb__f--l" />
            <i className="fx-cb__f fx-cb__f--r" />
            <i className="fx-cb__f fx-cb__f--b" />
            <i className="fx-cb__f fx-cb__f--front">
              <b />
              <span>LV</span>
            </i>
          </div>
        </div>
      </div>
      <div className="fx-at fx-cb__at">
        <div className="fx-cb__card">
          <small>No. {pad2(to)} · Cabinet</small>
          <b>LV {to}</b>
          <span>
            catalogued · LV {from} → {to}
          </span>
          <i className="fx-cb__seal">蔵</i>
        </div>
      </div>
      <Embers n={9} seed={to * 9} colors={['rgb(255 236 200 / .7)']} spread={260} rise={260} delay={700} />
      <SecCap id="cabinet" from={from} to={to} />
    </div>
  );
}

const k = (ch: string) => <span className="fx-calm__k">{ch}</span>;

export const SECTION_FX: Partial<Record<SectionId, SectionFx>> = {
  violin: { Scene: ViolinScene, time: { dur: 2750, hit: 1300 }, calm: k('弦') },
  coding: { Scene: CodingScene, time: { dur: 2700, hit: 1080 }, calm: k('算') },
  sports: { Scene: SportsScene, time: { dur: 2700, hit: 1520 }, calm: k('走') },
  gym: { Scene: GymScene, time: { dur: 2700, hit: 1150 }, calm: k('力') },
  study: { Scene: StudyScene, time: { dur: 2750, hit: 1800, shake: 'soft' }, calm: k('学') },
  chess: { Scene: ChessScene, time: { dur: 2750, hit: 1380 }, calm: k('将') },
  sleep: { Scene: SleepScene, time: { dur: 2750, hit: 1700, shake: 'soft' }, calm: k('眠') },
  screen: { Scene: ScreenScene, time: { dur: 2700, hit: 760, shake: 'soft' }, calm: k('画') },
  cabinet: { Scene: CabinetScene, time: { dur: 2650, hit: 1200 }, calm: k('蔵') },
};
