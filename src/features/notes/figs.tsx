/**
 * Small animated diagrams for the notes. Each is one SVG drawn in the page's ink; the motion is
 * CSS (see notes.css, "figures") plus a little SMIL where something has to follow a path.
 * With reduced motion the SMIL parts are left out and the CSS parts stand still, fully drawn.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { FigId } from '../../domain/notes';

const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

const Axes = ({ x = 'x', y = 'y', ox = 40, oy = 150 }: { x?: string; y?: string; ox?: number; oy?: number }) => (
  <>
    <path className="nt-ink" d={`M${ox},20 V${oy} H300`} />
    <text className="nt-txt" x={300} y={oy + 14} textAnchor="end">
      {x}
    </text>
    <text className="nt-txt" x={ox - 6} y={26} textAnchor="end">
      {y}
    </text>
  </>
);

const Motion = ({ path, dur, begin = 0, r = 4 }: { path: string; dur: number; begin?: number; r?: number }) =>
  still ? null : (
    <circle r={r} className="nt-fill">
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
    </circle>
  );

const FIGS: Record<FigId, () => ReactNode> = {
  vt: () => (
    <>
      <Axes x="time" y="velocity" />
      <clipPath id="nt-vt">
        <rect className="nt-growx" x="40" y="20" width="250" height="130" />
      </clipPath>
      <path className="nt-soft" clipPath="url(#nt-vt)" d="M50,150 L110,60 L210,60 L280,150 Z" />
      <path className="nt-ink nt-bold" d="M50,150 L110,60 L210,60 L280,150" />
      <Motion path="M50,150 L110,60 L210,60 L280,150" dur={5} />
      <text className="nt-txt" x="160" y="112" textAnchor="middle">
        area = displacement
      </text>
      <text className="nt-txt" x="70" y="92" textAnchor="middle">
        a &gt; 0
      </text>
      <text className="nt-txt" x="160" y="52" textAnchor="middle">
        a = 0
      </text>
      <text className="nt-txt" x="256" y="92" textAnchor="middle">
        a &lt; 0
      </text>
    </>
  ),
  projectile: () => (
    <>
      <path className="nt-ink" d="M20,155 H300" />
      <path className="nt-ink nt-dash" d="M30,155 Q160,-65 290,155" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const t = i / 6;
        const x = 30 + 260 * t;
        const y = 155 - 440 * t * (1 - t);
        return (
          <g key={i}>
            <path className="nt-ink nt-faint" d={`M${x},${y} V155`} />
            <circle className="nt-fill nt-faint" cx={x} cy={y} r="2.5" />
          </g>
        );
      })}
      <Motion path="M30,155 Q160,-65 290,155" dur={3.2} r={5} />
      <text className="nt-txt" x="160" y="172" textAnchor="middle">
        equal times, equal horizontal steps
      </text>
      <text className="nt-txt" x="160" y="36" textAnchor="middle">
        vertical velocity is 0 at the top
      </text>
    </>
  ),
  moments: () => (
    <>
      <path className="nt-fill" d="M130,150 L118,172 H142 Z" />
      <g className="nt-rock">
        <path className="nt-ink nt-bold" d="M30,148 H290" />
        <rect className="nt-fill" x="62" y="112" width="34" height="34" />
        <rect className="nt-fill" x="262" y="130" width="16" height="16" />
        <text className="nt-txt nt-inv" x="79" y="134" textAnchor="middle">
          4F
        </text>
        <path className="nt-ink nt-faint" d="M79,156 H130 M130,156 H270" />
        <text className="nt-txt" x="104" y="168" textAnchor="middle">
          x
        </text>
        <text className="nt-txt" x="200" y="168" textAnchor="middle">
          4x
        </text>
        <text className="nt-txt" x="270" y="124" textAnchor="middle">
          F
        </text>
      </g>
      <text className="nt-txt" x="160" y="30" textAnchor="middle">
        4F × x = F × 4x
      </text>
    </>
  ),
  stress: () => (
    <>
      <Axes x="strain" y="stress" />
      <path className="nt-ink nt-bold nt-draw" pathLength={1} d="M40,150 L110,62 C122,47 134,42 150,44 C190,48 232,22 276,40" />
      {(
        [
          [110, 62, 'limit of proportionality', 118, 78, 1.2],
          [150, 44, 'yield point', 150, 32, 2],
          [276, 40, 'breaks', 276, 28, 3.2],
        ] as const
      ).map(([x, y, label, tx, ty, delay]) => (
        <g key={label} className="nt-seq" style={d(delay)}>
          <circle className="nt-fill" cx={x} cy={y} r="3.5" />
          <text className="nt-txt" x={tx} y={ty} textAnchor={x > 200 ? 'end' : 'start'}>
            {label}
          </text>
        </g>
      ))}
      <text className="nt-txt" x="62" y="140">
        gradient = E
      </text>
    </>
  ),
  wave: () => (
    <>
      <path className="nt-ink nt-faint" d="M20,90 H300" />
      <clipPath id="nt-wv">
        <rect x="20" y="20" width="280" height="140" />
      </clipPath>
      <g clipPath="url(#nt-wv)">
        <path className="nt-ink nt-bold nt-slide" d="M-100,90 q30,-80 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0" />
      </g>
      <path className="nt-ink" d="M50,150 H170 M50,145 V155 M170,145 V155" />
      <text className="nt-txt" x="110" y="168" textAnchor="middle">
        wavelength λ
      </text>
      <path className="nt-ink" d="M290,90 V50 M285,50 H295" />
      <text className="nt-txt" x="284" y="40" textAnchor="end">
        amplitude
      </text>
    </>
  ),
  standing: () => (
    <>
      <path className="nt-ink nt-faint" d="M30,90 H290" />
      <path className="nt-ink nt-faint nt-dash" d="M30,90 Q73,30 117,90 T203,90 T290,90" />
      <path className="nt-ink nt-faint nt-dash" d="M30,90 Q73,150 117,90 T203,90 T290,90" />
      <path className="nt-ink nt-bold" d="M30,90 Q73,30 117,90 T203,90 T290,90">
        {!still && <animate attributeName="d" dur="1.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1" values="M30,90 Q73,30 117,90 T203,90 T290,90;M30,90 Q73,150 117,90 T203,90 T290,90;M30,90 Q73,30 117,90 T203,90 T290,90" />}
      </path>
      {[30, 117, 203, 290].map((x) => (
        <g key={x}>
          <circle className="nt-fill" cx={x} cy="90" r="3.5" />
          <text className="nt-txt" x={x} y="112" textAnchor="middle">
            N
          </text>
        </g>
      ))}
      {[73, 160, 247].map((x) => (
        <text key={x} className="nt-txt" x={x} y="24" textAnchor="middle">
          A
        </text>
      ))}
      <path className="nt-ink" d="M30,150 H117 M30,145 V155 M117,145 V155" />
      <text className="nt-txt" x="73" y="168" textAnchor="middle">
        λ ÷ 2
      </text>
    </>
  ),
  photo: () => (
    <>
      <rect className="nt-soft" x="20" y="120" width="280" height="40" />
      <path className="nt-ink nt-bold" d="M20,120 H300" />
      <text className="nt-txt" x="160" y="146" textAnchor="middle">
        metal surface · work function φ
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 80} 0)`}>
          <path className="nt-ink nt-acc nt-photon" style={d(i * 0.9)} d="M30,20 q6,-8 12,4 t12,4 t12,4 t12,4 t12,4" />
          <g className="nt-electron" style={d(i * 0.9 + 1.1)}>
            <circle className="nt-fill" cx="96" cy="112" r="4.5" />
            <text className="nt-txt" x="106" y="108">
              e⁻
            </text>
          </g>
        </g>
      ))}
      <text className="nt-txt" x="24" y="16">
        photons, each hf
      </text>
    </>
  ),
  circuit: () => {
    const loop = 'M70,40 H250 V140 H70 Z';
    return (
      <>
        <path className="nt-ink" d="M70,78 V40 H250 V56 M250,84 V96 M250,124 V140 H70 V102" />
        <path className="nt-ink nt-bold" d="M56,78 H84 M62,90 H78" />
        <path className="nt-ink" d="M70,90 V102" />
        <rect className="nt-ink nt-paper" x="240" y="56" width="20" height="28" />
        <rect className="nt-ink nt-paper" x="240" y="96" width="20" height="28" />
        <text className="nt-txt" x="268" y="74">
          R₁
        </text>
        <text className="nt-txt" x="268" y="114">
          R₂
        </text>
        <text className="nt-txt" x="50" y="88" textAnchor="end">
          V in
        </text>
        <path className="nt-ink nt-faint nt-dash" d="M250,90 H212 M250,140 H212" />
        <text className="nt-txt" x="208" y="119" textAnchor="end">
          V out
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <Motion key={i} path={loop} dur={5} begin={-i} r={3} />
        ))}
      </>
    );
  },
  unitcircle: () => (
    <>
      <path className="nt-ink nt-faint" d="M20,90 H180 M100,10 V170" />
      <circle className="nt-ink" cx="100" cy="90" r="64" />
      <g className="nt-turn" style={{ transformOrigin: '100px 90px' }}>
        <path className="nt-ink nt-bold" d="M100,90 H164" />
        <circle className="nt-fill" cx="164" cy="90" r="5" />
      </g>
      <path className="nt-ink nt-faint" d="M222,26 V154 M196,172 H316" />
      <g className="nt-sine">
        <circle className="nt-fill nt-accf" cx="222" cy="90" r="5" />
      </g>
      <g className="nt-cosine">
        <circle className="nt-fill nt-accf" cx="256" cy="172" r="5" />
      </g>
      <text className="nt-txt" x="230" y="30">
        sin θ
      </text>
      <text className="nt-txt" x="316" y="162" textAnchor="end">
        cos θ
      </text>
      <text className="nt-txt" x="118" y="84">
        1
      </text>
    </>
  ),
  tangent: () => (
    <>
      <Axes />
      <path className="nt-ink nt-bold" d="M40,150 Q160,150 280,30" />
      <g className="nt-swing" style={{ transformOrigin: '160px 120px' }}>
        <path className="nt-ink nt-acc" d="M40,120 H290" />
      </g>
      <circle className="nt-fill" cx="160" cy="120" r="4.5" />
      <text className="nt-txt" x="166" y="138">
        P
      </text>
      <text className="nt-txt" x="60" y="40">
        chord → tangent
      </text>
      <text className="nt-txt" x="60" y="54">
        gradient → dy/dx
      </text>
    </>
  ),
  area: () => {
    const y = (x: number) => 150 - 0.0016 * (x - 40) * (x - 40) - 20;
    return (
      <>
        <Axes />
        {Array.from({ length: 10 }, (_, i) => {
          const x = 70 + i * 20;
          return <rect key={i} className="nt-soft nt-seq" style={d(i * 0.22)} x={x} y={y(x + 10)} width="19" height={150 - y(x + 10)} />;
        })}
        <path className="nt-ink nt-bold" d={`M40,${y(40)} ${Array.from({ length: 27 }, (_, i) => `L${40 + i * 10},${y(40 + i * 10).toFixed(1)}`).join(' ')}`} />
        <text className="nt-txt" x="70" y="164" textAnchor="middle">
          a
        </text>
        <text className="nt-txt" x="270" y="164" textAnchor="middle">
          b
        </text>
        <text className="nt-txt" x="170" y="36" textAnchor="middle">
          area = ∫ f(x) dx from a to b
        </text>
      </>
    );
  },
  normal: () => {
    const bell = 'M20,150 C95,150 115,36 160,36 C205,36 225,150 300,150';
    return (
      <>
        <path className="nt-ink" d="M20,150 H300" />
        <clipPath id="nt-nm">
          <rect className="nt-growx" x="20" y="20" width="176" height="131" />
        </clipPath>
        <path className="nt-soft" clipPath="url(#nt-nm)" d={`${bell} Z`} />
        <path className="nt-ink nt-bold" d={bell} />
        <path className="nt-ink nt-dash" d="M160,36 V150 M196,70 V150" />
        <text className="nt-txt" x="160" y="166" textAnchor="middle">
          μ
        </text>
        <text className="nt-txt" x="196" y="166" textAnchor="middle">
          z
        </text>
        <text className="nt-txt" x="128" y="120" textAnchor="middle">
          Φ(z)
        </text>
      </>
    );
  },
  argand: () => (
    <>
      <path className="nt-ink nt-faint" d="M20,90 H300 M160,10 V170" />
      <text className="nt-txt" x="300" y="104" textAnchor="end">
        Re
      </text>
      <text className="nt-txt" x="168" y="20">
        Im
      </text>
      <circle className="nt-ink nt-faint nt-dash" cx="160" cy="90" r="67" />
      <g className="nt-quarter" style={{ transformOrigin: '160px 90px' }}>
        <path className="nt-ink nt-bold" d="M160,90 L220,60" />
        <circle className="nt-fill" cx="220" cy="60" r="5" />
      </g>
      <text className="nt-txt" x="226" y="52">
        z
      </text>
      <text className="nt-txt" x="124" y="22" textAnchor="end">
        iz
      </text>
      <text className="nt-txt" x="24" y="166">
        each × i turns it 90°
      </text>
    </>
  ),
  newton: () => (
    <>
      <path className="nt-ink" d="M30,120 H300" />
      <path className="nt-ink nt-bold" d="M40,160 Q200,160 300,20" />
      <circle className="nt-fill nt-accf" cx="193.9" cy="120" r="4" />
      {(
        [
          ['M279.4,120 V46.6', 'M279.4,46.6 L217.7,120', 279.4, 'x₀', 0.3],
          ['M217.7,120 V104.4', 'M217.7,104.4 L196.1,120', 221, 'x₁', 1.5],
        ] as const
      ).map(([up, tan, x, label, delay]) => (
        <g key={label} className="nt-seq" style={d(delay)}>
          <path className="nt-ink nt-dash" d={up} />
          <path className="nt-ink nt-acc" d={tan} />
          <text className="nt-txt" x={x} y="134" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <text className="nt-txt nt-seq" style={d(2.7)} x="192" y="134" textAnchor="end">
        x₂
      </text>
      <text className="nt-txt" x="40" y="40">
        follow the tangent to the axis
      </text>
    </>
  ),
  fde: () => {
    const box = (x: number, y: number, label: string, i: number, w = 62) => (
      <g key={label}>
        <rect className="nt-ink nt-paper" x={x} y={y} width={w} height="34" />
        <rect className="nt-fill nt-pulse" style={d(i)} x={x} y={y} width={w} height="34" />
        <text className="nt-txt nt-mono" x={x + w / 2} y={y + 21} textAnchor="middle">
          {label}
        </text>
      </g>
    );
    return (
      <>
        <path className="nt-ink" d="M82,47 H118 M180,47 H216 M216,127 H180 M118,127 H82" />
        <path className="nt-fill" d="M118,47 l-7,-4 v8 Z M216,47 l-7,-4 v8 Z M180,127 l7,-4 v8 Z M82,127 l7,-4 v8 Z" />
        {box(20, 30, 'PC', 0)}
        {box(118, 30, 'MAR', 1)}
        <rect className="nt-ink nt-paper" x="216" y="30" width="84" height="114" />
        <rect className="nt-fill nt-pulse" style={d(2)} x="216" y="30" width="84" height="114" />
        <text className="nt-txt nt-mono" x="258" y="92" textAnchor="middle">
          MEMORY
        </text>
        {box(118, 110, 'MDR', 3)}
        {box(20, 110, 'CIR', 4)}
        <text className="nt-txt" x="51" y="88" textAnchor="middle">
          PC + 1
        </text>
      </>
    );
  },
  gp: () => (
    <>
      <path className="nt-ink" d="M30,150 H300" />
      {[96, 48, 24, 12, 6, 3].map((hgt, i) => (
        <rect key={i} className="nt-fill nt-seq" style={d(i * 0.35)} x={40 + i * 26} y={150 - hgt} width="20" height={hgt} opacity={0.85 - i * 0.1} />
      ))}
      <path className="nt-ink nt-dash" d="M214,54 H290" />
      {[96, 48, 24, 12, 6, 3].reduce<{ y: number; el: ReactNode[] }>(
        (acc, hgt, i) => {
          const hh = hgt / 2;
          acc.el.push(<rect key={i} className={i % 2 ? 'nt-soft nt-seq' : 'nt-fill nt-seq'} style={d(i * 0.35 + 0.15)} x="232" y={acc.y - hh} width="40" height={hh} />);
          acc.y -= hh;
          return acc;
        },
        { y: 150, el: [] },
      ).el}
      <text className="nt-txt" x="252" y="46" textAnchor="middle">
        S∞ = a ÷ (1 − r)
      </text>
      <text className="nt-txt" x="105" y="168" textAnchor="middle">
        terms
      </text>
      <text className="nt-txt" x="252" y="168" textAnchor="middle">
        running total
      </text>
    </>
  ),
};

export function Fig({ id, cap }: { id: FigId; cap: string }) {
  return (
    <figure className="nt-figure">
      <svg viewBox="0 0 320 180" role="img" aria-label={cap}>
        {FIGS[id]()}
      </svg>
      <figcaption>{cap}</figcaption>
    </figure>
  );
}
