import type { CSSProperties, ReactNode } from 'react';
import type { BotDesign, BotRegistry } from './types';
import './forms.css';

/**
 * Forms 21 to 40, "beyond Kami": the drone stops being a drone. Each is its own drawing in the
 * 200 x 200 box, coloured by c and c2 so paint jobs work. Motion lives in forms.css.
 */

type Art = BotDesign['Art'];

const INK = { stroke: 'var(--fg)', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const THIN = { ...INK, strokeWidth: 1.8 } as const;
const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const NIGHT = '#07060f';

const mix = (a: string, p: number, b = 'var(--surf)') => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const dark = (a: string, p = 60) => mix(a, p, '#05040a');
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return v - Math.floor(v);
};
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const polar = (r: number, deg: number): [number, number] => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
/** A four-pointed sparkle. */
const spark = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
/** Motion props, or nothing when the art is still. */
const mo = (still: boolean, cls: string, t?: number, delay?: number, extra?: Record<string, string>) =>
  still ? {} : { className: cls, style: { ...(t ? { animationDuration: `${t}s` } : {}), ...(delay ? { animationDelay: `${delay}s` } : {}), ...extra } as CSSProperties };
const hover = (still: boolean) => (still ? undefined : 'i-hover');

const Mirror = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <g transform="matrix(-1 0 0 1 200 0)">{children}</g>
  </>
);
const Gaze = ({ still, children }: { still: boolean; children: ReactNode }) => (
  <g className="dr-gaze">
    <g className={still ? undefined : 'i-blink'}>{children}</g>
  </g>
);
const Shadow = ({ rx = 56, y = 184 }: { rx?: number; y?: number }) => <ellipse cx="100" cy={y} rx={rx} ry="5" fill="var(--fg)" opacity=".14" />;
const Lin = ({ id, a, b, h, user }: { id: string; a: string; b: string; h?: boolean; user?: [number, number, number, number] }) =>
  user ? (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={user[0]} y1={user[1]} x2={user[2]} y2={user[3]}>
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  ) : (
    <linearGradient id={id} x1="0" y1="0" x2={h ? 1 : 0} y2={h ? 0 : 1}>
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
const Glow = ({ id, stops }: { id: string; stops: [number, string, number][] }) => (
  <radialGradient id={id}>
    {stops.map(([o, c, a]) => (
      <stop key={o} offset={o} stopColor={c} stopOpacity={a} />
    ))}
  </radialGradient>
);

// ─── 21 Vanguard ────────────────────────────────────────────────────────────

const Vanguard: Art = ({ c, c2, uid, still, happy }) => {
  const white = `${uid}va`;
  const main = `${uid}vb`;
  return (
    <g>
      <defs>
        <Lin id={white} a={c2} b={mix(c2, 66, c)} />
        <Lin id={main} a={c} b={dark(c, 62)} />
      </defs>
      <Shadow rx={52} />
      <g className={hover(still)}>
        <g {...mo(still, 'bf-fade', 1.6)}>
          <path d="M155 146L186 14" {...LINE} stroke={c} strokeWidth="13" opacity=".3" />
        </g>
        <path d="M155 146L186 14" {...LINE} stroke="var(--fg)" strokeWidth="8.5" />
        <path d="M155 146L186 14" {...LINE} stroke={c} strokeWidth="5.5" />
        <path d="M157 138L185 18" {...LINE} stroke={c2} strokeWidth="2" />
        <Mirror>
          <path d="M80 70L50 22L62 18L92 62Z" fill={`url(#${main})`} {...INK} />
          <path d="M62 44L56 32" {...LINE} stroke={c2} strokeWidth="2.5" />
          {/* leg */}
          <path d="M92 118L74 118L70 146L90 146Z" fill="var(--surf-2)" {...INK} />
          <path d="M90 142L68 142L60 170L88 170Z" fill={`url(#${white})`} {...INK} />
          <path d="M66 138L90 138L86 154L72 154Z" fill={`url(#${main})`} {...INK} />
          <path d="M60 168L90 168L94 183L48 183Z" fill={`url(#${main})`} {...INK} />
          {/* skirt */}
          <path d="M86 112L66 118L60 144L78 140L92 124Z" fill={`url(#${white})`} {...INK} />
          {/* arm */}
          <path d="M40 92L60 92L58 118L44 118Z" fill="var(--surf-2)" {...INK} />
          <path d="M36 116L62 116L60 146L42 146Z" fill={`url(#${white})`} {...INK} />
          <path d="M40 124L58 124" {...LINE} stroke={c} strokeWidth="3" />
          <rect x="42" y="146" width="17" height="14" rx="3" fill="var(--surf-2)" {...INK} />
        </Mirror>
        <rect x="143" y="146" width="17" height="14" rx="3" fill="var(--surf-2)" {...INK} />
        {/* waist and chest */}
        <path d="M84 106L116 106L112 124L88 124Z" fill="var(--surf-2)" {...INK} />
        <path d="M92 116H108L106 130H94Z" fill={c} {...INK} />
        <path d="M68 68H132L128 96L114 110H86L72 96Z" fill={`url(#${main})`} {...INK} />
        <path d="M76 76H95L92 92H80Z M124 76H105L108 92H120Z" fill={`url(#${white})`} {...THIN} />
        <path d="M100 78L107 92L100 106L93 92Z" fill={c2} {...THIN} />
        <Mirror>
          {/* shoulder */}
          <path d="M74 62L42 56L30 72L36 96L62 96L74 80Z" fill={`url(#${white})`} {...INK} />
          <path d="M40 66L66 68L62 84L36 80Z" fill={c} {...THIN} />
          {/* fin */}
          <path d="M100 50L58 10L72 38L92 56Z" fill={`url(#${white})`} {...INK} />
        </Mirror>
        {/* head */}
        <path d="M83 44Q100 32 117 44L115 62L100 70L85 62Z" fill={`url(#${white})`} {...INK} />
        <path d="M96 30H104L103 46H97Z" fill={c} {...THIN} />
        <path d="M87 48H113L111 59L100 62L89 59Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" />
        <Gaze still={still}>
          {happy ? (
            <path d="M90 56Q94.500 50 98 55M102 55Q105.500 50 110 56" {...LINE} stroke={c2} strokeWidth="2.6" />
          ) : (
            <path d="M90 51L98 54.500V57.500L91 55.500ZM110 51L102 54.500V57.500L109 55.500Z" fill={c2} />
          )}
        </Gaze>
      </g>
    </g>
  );
};

// ─── 22 Musha ───────────────────────────────────────────────────────────────

const Musha: Art = ({ c, c2, uid, still, happy }) => {
  const lac = `${uid}ma`;
  const gold = `${uid}mb`;
  return (
    <g>
      <defs>
        <Lin id={lac} a={c} b={dark(c, 58)} />
        <Lin id={gold} a={mix(c2, 70, '#fff')} b={c2} />
      </defs>
      <Shadow rx={60} />
      {/* nodachi, slung across the back */}
      <path d="M170 14L24 176" {...LINE} stroke="var(--fg)" strokeWidth="12" />
      <path d="M144 42L24 176" {...LINE} stroke={dark(c, 72)} strokeWidth="7" />
      <path d="M170 14L150 36" {...LINE} stroke={c2} strokeWidth="7" />
      <path d="M166 19L160 26M160 25L154 32" {...LINE} stroke={NIGHT} strokeWidth="2.5" />
      <path d="M140 34L156 48" {...LINE} stroke="var(--fg)" strokeWidth="9" />
      <path d="M140 34L156 48" {...LINE} stroke={c2} strokeWidth="5" />
      <Mirror>
        {/* shin and foot */}
        <path d="M92 146L68 146L64 172H90Z" fill={`url(#${lac})`} {...INK} />
        <path d="M70 156L88 156" {...LINE} stroke={c2} strokeWidth="2.5" />
        <path d="M62 170L92 170L94 183L52 183Z" fill="var(--surf-2)" {...INK} />
        {/* arm */}
        <path d="M46 116L66 112L70 146L50 152Z" fill="var(--surf-2)" {...INK} />
        <rect x="50" y="148" width="20" height="14" rx="4" fill={`url(#${lac})`} {...INK} />
      </Mirror>
      {/* kusazuri, three tiers */}
      <path d="M76 138H124L146 164H54Z" fill={`url(#${lac})`} {...INK} />
      <path d="M78 126H122L136 150H64Z" fill={c} {...INK} />
      <path d="M64 150H136M69 142H131" {...LINE} stroke={c2} strokeWidth="2.5" />
      {/* do */}
      <path d="M70 80H130L122 130H78Z" fill={`url(#${lac})`} {...INK} />
      <path d="M72 94H128M75 106H125M77 118H123" {...LINE} stroke={c2} strokeWidth="2.5" />
      <path d="M100 82V128" {...LINE} stroke={dark(c, 50)} strokeWidth="3" />
      <Mirror>
        {/* sode, layered lames */}
        <path d="M72 76L30 66L18 86L62 94Z" fill={c} {...INK} />
        <path d="M63 92L18 84L12 104L58 110Z" fill={dark(c, 76)} {...INK} />
        <path d="M58 108L12 102L8 122L54 128Z" fill={`url(#${lac})`} {...INK} />
        <path d="M32 72L24 88M22 90L18 106M18 108L14 122" {...LINE} stroke={c2} strokeWidth="3" />
      </Mirror>
      {/* kabuto */}
      <path d="M66 58Q100 42 134 58L146 78Q100 66 54 78Z" fill={`url(#${lac})`} {...INK} />
      <path d="M62 66Q100 54 138 66" {...LINE} stroke={c2} strokeWidth="2.5" />
      <path d="M74 56Q74 28 100 28Q126 28 126 56Q100 46 74 56Z" fill={dark(c, 42)} {...INK} />
      <path d="M78 62Q100 54 122 62L118 84L100 92L82 84Z" fill={NIGHT} {...INK} />
      <path d="M86 80L100 86L114 80" {...LINE} stroke={c2} strokeWidth="2.5" />
      <path d="M92 84V88M100 86V90M108 84V88" {...LINE} stroke={c2} strokeWidth="1.5" />
      {/* the crest */}
      <path d="M100 48C72 44 54 26 46 2C66 20 84 28 100 30C116 28 134 20 154 2C146 26 128 44 100 48Z" fill={`url(#${gold})`} {...INK} />
      <path d="M100 26L108 38L100 50L92 38Z" fill={c} {...INK} />
      <Gaze still={still}>
        {happy ? (
          <path d="M84 72Q90 65 96 71M104 71Q110 65 116 72" {...LINE} stroke={c2} strokeWidth="3" />
        ) : (
          <path d="M83 65L97 70V75L85 72ZM117 65L103 70V75L115 72Z" fill={c2} />
        )}
      </Gaze>
    </g>
  );
};

// ─── 23 Kaiju ───────────────────────────────────────────────────────────────

const SPINES: [number, number, number, number][] = [
  [88, 48, 14, 8],
  [103, 53, 22, 16],
  [120, 63, 28, 26],
  [135, 78, 30, 36],
  [148, 96, 26, 44],
  [160, 116, 21, 42],
  [175, 131, 15, 28],
];

const Kaiju: Art = ({ c, c2, uid, still, happy }) => {
  const hide = `${uid}ka`;
  const spine = `${uid}kb`;
  const blast = `${uid}kc`;
  return (
    <g>
      <defs>
        <Lin id={hide} a={c} b={dark(c, 55)} />
        <Lin id={spine} a="#fff" b={c2} />
        <Glow id={blast} stops={[[0, '#fff', 1], [0.3, c2, 0.95], [1, c2, 0]]} />
      </defs>
      <Shadow rx={76} y={185} />
      {/* far leg */}
      <path d="M72 138L104 140L100 168L112 183H62L74 166Z" fill={dark(c, 50)} {...INK} />
      {/* spines */}
      {SPINES.map(([x, y, h, r], i) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
          <g {...mo(still, 'bf-fade', 1.8, i * 0.14)}>
            <path d={`M${-h * 0.46} 6L${-h * 0.3} ${-h * 0.5}L0 ${-h}L${h * 0.3} ${-h * 0.5}L${h * 0.46} 6Z`} fill={`url(#${spine})`} {...INK} strokeWidth="2.6" />
          </g>
        </g>
      ))}
      {/* body and tail */}
      <path d="M68 46C100 50 128 70 142 100C154 126 176 138 198 122C194 152 166 170 136 158C120 152 100 158 84 150C64 142 54 112 58 84Z" fill={`url(#${hide})`} {...INK} />
      {/* belly plates */}
      <path d="M62 96C66 124 76 142 96 148C86 130 82 112 84 92Z" fill={mix(c2, 22, dark(c, 80))} {...THIN} />
      <path d="M66 110L84 106M71 124L86 120M79 136L92 134" {...LINE} stroke="var(--fg)" strokeWidth="1.6" />
      <path d="M154 146L176 140M138 148L148 146" {...LINE} stroke={c2} strokeWidth="2.5" opacity=".8" />
      {/* near leg */}
      <path d="M106 122C128 116 150 134 142 158L136 168L150 183H96L108 166C98 150 98 134 106 122Z" fill={`url(#${hide})`} {...INK} />
      <path d="M100 183L104 174M116 183V174M130 183L128 174" {...LINE} stroke="var(--fg)" strokeWidth="2.5" />
      <circle cx="122" cy="142" r="8" fill="var(--surf-2)" {...THIN} />
      <circle cx="122" cy="142" r="3" fill={c2} />
      {/* arm */}
      <path d="M68 90L88 96L78 116L64 124L52 118L62 106Z" fill={`url(#${hide})`} {...INK} />
      <path d="M52 118L46 124M58 122L54 130M64 124L64 132" {...LINE} stroke="var(--fg)" strokeWidth="2.5" />
      {/* jaw, then mouth glow, then skull */}
      <path d="M22 92L60 80L78 72L76 94L42 102Z" fill={dark(c, 72)} {...INK} />
      <path d="M28 90L33 84L37 88L42 80L46 85L52 78L55 82" fill="#fff" stroke="var(--fg)" strokeWidth="1.4" strokeLinejoin="round" />
      <g transform="translate(34 75)">
        <g {...mo(still, 'bf-fade', 1.1)}>
          <circle r="27" fill={`url(#${blast})`} />
        </g>
      </g>
      <path d="M14 56L38 36L76 36L86 62L74 74L46 70L18 72Z" fill={`url(#${hide})`} {...INK} />
      <path d="M20 72L25 79L30 71L36 78L41 71L47 77L52 71" fill="#fff" stroke="var(--fg)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M38 36L50 46L72 42" {...LINE} stroke="var(--fg)" strokeWidth="1.6" />
      <path d="M40 50L68 44L70 58L46 62Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
      <Gaze still={still}>
        {happy ? <path d="M46 57Q55 47 64 53" {...LINE} stroke={c2} strokeWidth="3.4" /> : <path d="M46 56L66 49V55L50 60Z" fill={c2} />}
      </Gaze>
    </g>
  );
};

// ─── 24 Leviathan ───────────────────────────────────────────────────────────

const Leviathan: Art = ({ c, c2, uid, still, happy }) => {
  const scale = `${uid}la`;
  const sea = `${uid}lb`;
  const hump = 'M14 188C14 120 78 120 80 188';
  const neck = 'M122 190C146 158 182 132 168 94C156 64 122 74 104 66';
  const tube = (d: string, w: number) => (
    <>
      <path d={d} {...LINE} stroke="var(--fg)" strokeWidth={w + 6} />
      <path d={d} {...LINE} stroke={`url(#${scale})`} strokeWidth={w} />
      <path d={d} {...LINE} stroke={c2} strokeWidth="4.5" strokeDasharray="9 11" {...mo(still, 'bf-fade', 2)} />
    </>
  );
  return (
    <g>
      <defs>
        <Lin id={scale} a={c} b={dark(c, 65)} user={[0, 60, 0, 190]} />
        <Lin id={sea} a={mix(c, 80, c2)} b={dark(c, 55)} />
      </defs>
      {/* fins on the back of the coil */}
      <path d="M20 134L8 112L36 120ZM44 120L44 94L62 118ZM68 136L84 116L84 148Z" fill={c2} {...INK} />
      <path d="M180 100L198 82L190 112ZM178 126L198 122L180 142ZM160 72L176 52L176 82Z" fill={c2} {...INK} />
      {tube(hump, 21)}
      <g {...mo(still, 'bf-wave', 6, 0, { '--bf-wave': '-6px' })}>
        <path d="M4 180Q8 154 22 168Q38 152 54 168Q70 152 86 168Q102 152 118 168Q134 152 150 168Q166 152 182 168Q194 156 196 180Z" fill={dark(c, 72)} {...INK} />
      </g>
      {tube(neck, 24)}
      {/* armoured head */}
      <path d="M100 42L108 10L116 36L136 16L132 46L156 36L140 64L108 68Z" fill={c2} {...INK} />
      <path d="M116 66L92 36L58 28L24 42L14 56L40 58L66 62L86 78Z" fill={`url(#${scale})`} {...INK} />
      <path d="M86 76L66 66L36 66L28 73L60 82L90 86L106 74Z" fill={dark(c, 60)} {...INK} />
      <path d="M24 42L58 40L92 36" {...LINE} stroke={c2} strokeWidth="2.5" />
      <path d="M30 58L34 65L39 59L44 66L49 60L54 67L59 62" fill="#fff" stroke="var(--fg)" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M50 44L82 40L84 54L60 56Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
      <Gaze still={still}>
        {happy ? <path d="M58 52Q68 42 78 49" {...LINE} stroke={c2} strokeWidth="3.4" /> : <path d="M58 51L80 44V50L62 55Z" fill={c2} />}
      </Gaze>
      {/* front sea */}
      <g {...mo(still, 'bf-wave')}>
        <path d="M0 187Q10 164 28 178Q46 160 66 178Q84 160 104 178Q122 160 142 178Q160 160 178 178Q192 166 200 187Q100 204 0 187Z" fill={`url(#${sea})`} {...INK} />
        <path d="M10 186Q24 178 38 186M78 186Q92 178 106 186M146 186Q160 178 174 186" {...LINE} stroke={c2} strokeWidth="2.5" />
      </g>
    </g>
  );
};

// ─── 25 Valkyrie ────────────────────────────────────────────────────────────

const Valkyrie: Art = ({ c, c2, uid, still, happy }) => {
  const hull = `${uid}wa`;
  const fire = `${uid}wb`;
  return (
    <g>
      <defs>
        <Lin id={hull} a={mix(c, 78, '#fff')} b={dark(c, 70)} />
        <Lin id={fire} a="#fff" b={c2} />
      </defs>
      <g className={hover(still)}>
        <Mirror>
          {/* afterburner */}
          <g {...mo(still, 'bf-flick')}>
            <path d="M68 156H90L79 198Z" fill={`url(#${fire})`} {...INK} strokeWidth="2.4" />
          </g>
          {/* wing */}
          <path d="M84 66L4 106L2 122L32 120L80 108Z" fill={`url(#${hull})`} {...INK} />
          <path d="M6 110L2 122L32 120L36 106Z" fill={c2} {...INK} strokeWidth="2.2" />
          <path d="M70 80L40 96" {...LINE} stroke="var(--fg)" strokeWidth="1.8" />
          <rect x="44" y="104" width="22" height="5" rx="2.500" fill="var(--surf-2)" {...THIN} transform="rotate(-8 55 106)" />
          {/* tail fin */}
          <path d="M82 104L52 138L60 144L92 122Z" fill={c2} {...INK} />
          {/* thigh and engine leg */}
          <path d="M80 104L98 106L96 132H76Z" fill="var(--surf-2)" {...INK} />
          <path d="M70 128L98 128L94 158H70Z" fill={`url(#${hull})`} {...INK} />
          <path d="M72 148H94M73 140H95" {...LINE} stroke={c2} strokeWidth="2.5" />
          <rect x="66" y="154" width="26" height="7" rx="2" fill={NIGHT} {...INK} strokeWidth="2.2" />
          {/* arm folded out of the hull */}
          <path d="M82 78L64 88L56 118L66 122L76 96L90 90Z" fill="var(--surf-2)" {...INK} />
          <rect x="50" y="116" width="16" height="14" rx="3.500" fill={`url(#${hull})`} {...INK} transform="rotate(14 58 123)" />
        </Mirror>
        {/* gun pod in the right hand */}
        <path d="M138 126L146 170L156 168L152 122Z" fill={dark(c, 60)} {...INK} />
        {/* fuselage */}
        <path d="M100 6C110 22 116 46 118 70L122 112L100 120L78 112L82 70C84 46 90 22 100 6Z" fill={`url(#${hull})`} {...INK} />
        <path d="M100 6L106 20H94Z" fill={c2} {...THIN} />
        <path d="M90 92H110L106 112H94Z" fill={c2} {...THIN} />
        {/* canopy visor */}
        <path d="M100 28C110 34 113 50 111 68L100 76L89 68C87 50 90 34 100 28Z" fill={NIGHT} {...INK} />
        <path d="M95 36Q97 33 100 32" {...LINE} stroke="#fff" strokeWidth="2" opacity=".7" />
        <Gaze still={still}>
          {happy ? (
            <path d="M92 58Q100 49 108 58" {...LINE} stroke={c2} strokeWidth="3.6" />
          ) : (
            <path d="M90 50L110 50L107 58H93Z" fill={c2} />
          )}
        </Gaze>
      </g>
    </g>
  );
};

// ─── 26 Stormbringer ────────────────────────────────────────────────────────

const PUFFS: [number, number, number][] = [
  [100, 54, 40],
  [60, 66, 30],
  [140, 66, 30],
  [30, 86, 22],
  [170, 86, 22],
  [76, 92, 26],
  [124, 92, 26],
  [100, 98, 22],
];

const Stormbringer: Art = ({ c, c2, uid, still, happy }) => {
  const cloud = `${uid}sa`;
  const bolt = `${uid}sb`;
  return (
    <g>
      <defs>
        <Lin id={cloud} a={mix(c, 64, '#cbd5e1')} b={dark(c, 42)} user={[0, 14, 0, 118]} />
        <Lin id={bolt} a="#fff" b={c2} />
      </defs>
      {/* rain */}
      <path d="M50 118L42 138M72 124L64 146M140 124L132 146M156 116L148 134M116 150L110 166" {...LINE} stroke={c} strokeWidth="3" {...mo(still, 'bf-fade', 1)} />
      <g {...mo(still, 'bf-flash')}>
        {/* lightning arms */}
        <path d="M50 94L20 118L38 124L6 160L20 162L-2 194L52 142L34 136L66 108Z" fill={`url(#${bolt})`} {...INK} />
        <path d="M150 94L180 118L162 124L194 160L180 162L202 194L148 142L166 136L134 108Z" fill={`url(#${bolt})`} {...INK} />
        {/* the strike below */}
        <path d="M112 106L82 146L102 148L84 192L128 136L106 134L128 106Z" fill={`url(#${bolt})`} {...INK} />
      </g>
      <g className={hover(still)}>
        {PUFFS.map(([x, y, r]) => (
          <circle key={x * 100 + y} cx={x} cy={y} r={r} fill="var(--fg)" stroke="var(--fg)" strokeWidth="6" />
        ))}
        {PUFFS.map(([x, y, r]) => (
          <circle key={x * 100 + y} cx={x} cy={y} r={r} fill={`url(#${cloud})`} />
        ))}
        <path d="M78 38Q92 24 108 28M46 56Q52 46 64 46M136 46Q150 44 156 56" {...LINE} stroke="#fff" strokeWidth="3" opacity=".5" />
        {/* the eye */}
        <path d="M56 72Q100 34 144 72Q100 106 56 72Z" fill={NIGHT} {...INK} />
        <Gaze still={still}>
          {happy ? (
            <path d="M68 76Q100 46 132 76" {...LINE} stroke={c2} strokeWidth="6" />
          ) : (
            <path d="M107 50L88 74H100L92 94L114 68H101Z" fill={c2} stroke={c2} strokeWidth="1.5" strokeLinejoin="round" />
          )}
        </Gaze>
      </g>
    </g>
  );
};

// ─── 27 Magma ───────────────────────────────────────────────────────────────

const Magma: Art = ({ c, c2, uid, still, happy }) => {
  const rock = `${uid}ga`;
  const core = `${uid}gb`;
  const crack = (d: string, w = 3.5) => (
    <>
      <path d={d} {...LINE} stroke={c} strokeWidth={w + 3.5} />
      <path d={d} {...LINE} stroke={c2} strokeWidth={w} />
    </>
  );
  return (
    <g>
      <defs>
        <Lin id={rock} a={dark(c, 42)} b={dark(c, 16)} />
        <Glow id={core} stops={[[0, '#fff', 1], [0.35, c2, 1], [1, c, 0]]} />
      </defs>
      <Shadow rx={84} />
      {/* embers */}
      {range(6).map((i) => (
        <circle key={i} cx={22 + i * 31} cy={20 + (i % 2) * 14} r={2.4} fill={c2} {...mo(still, 'bf-rise', 3 + (i % 3), i * 0.6)} />
      ))}
      <Mirror>
        {/* leg */}
        <path d="M60 128L96 134L92 183H50L46 160Z" fill={`url(#${rock})`} {...INK} />
        {/* boulder shoulder, arm to the ground, fist */}
        <path d="M14 82L42 92L52 128L40 150L14 148L6 118Z" fill={`url(#${rock})`} {...INK} />
        <path d="M2 146L20 138L50 146L56 170L44 184H8L-4 168Z" fill={`url(#${rock})`} {...INK} />
        <path d="M78 54L46 26L16 44L6 80L30 104L64 92Z" fill={`url(#${rock})`} {...INK} />
      </Mirror>
      {/* torso */}
      <path d="M58 52H142L156 96L134 140H66L44 96Z" fill={`url(#${rock})`} {...INK} />
      <circle cx="100" cy="102" r="30" fill={`url(#${core})`} {...mo(still, 'bf-fade', 2.2)} />
      <Mirror>
        {crack('M92 100L74 86L78 72L60 58')}
        {crack('M92 108L72 114L66 132', 3)}
        {crack('M30 42L38 60L26 72L34 92', 3)}
        {crack('M26 150L32 164L24 178', 2.5)}
        {crack('M70 142L76 156L66 170', 3)}
      </Mirror>
      {crack('M100 90L96 106L104 112L99 134')}
      {/* sunken head with a heavy brow */}
      <path d="M80 44L120 44L128 66L114 82H86L72 66Z" fill={`url(#${rock})`} {...INK} />
      <path d="M74 60L126 60L122 72H78Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
      <Gaze still={still}>
        {happy ? (
          <path d="M82 70Q90 61 97 68M103 68Q110 61 118 70" {...LINE} stroke={c2} strokeWidth="3.6" />
        ) : (
          <path d="M82 63L97 67V71H85ZM118 63L103 67V71H115Z" fill={c2} />
        )}
      </Gaze>
      {crack('M92 82L100 78L108 82', 2.5)}
    </g>
  );
};

// ─── 28 Glacier ─────────────────────────────────────────────────────────────

const Glacier: Art = ({ c, c2, still, happy }) => {
  const light = mix(c2, 88, '#fff');
  const mid = mix(c, 40, c2);
  /** A crystal with a lit and a shaded face. */
  const shard = (x: number, y: number, h: number, w: number, r: number) => (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d={`M0 0L${-w} ${-h * 0.72}L0 ${-h}Z`} fill={light} />
      <path d={`M0 0L${w} ${-h * 0.72}L0 ${-h}Z`} fill={mid} />
      <path d={`M0 0L${-w} ${-h * 0.72}L0 ${-h}L${w} ${-h * 0.72}Z`} fill="none" {...INK} strokeWidth="2.6" />
    </g>
  );
  return (
    <g>
      <Shadow rx={60} />
      <Mirror>
        {/* legs end in crystal points */}
        <path d="M86 128L62 134L58 160L68 183L84 160Z" fill={mid} {...INK} />
        <path d="M86 128L62 134L72 158L84 160Z" fill={light} />
        <path d="M86 128L62 134L58 160L68 183L84 160Z" fill="none" {...INK} />
        {/* shoulder crystals */}
        {shard(38, 92, 44, 11, -58)}
        {shard(46, 86, 62, 13, -34)}
        {shard(66, 80, 72, 14, -14)}
        {/* arm, a long blade */}
        <path d="M48 88L24 106L18 138L34 172L46 134L60 106Z" fill={c} {...INK} />
        <path d="M48 88L24 106L18 138L34 172Z" fill={light} />
        <path d="M48 88L24 106L18 138L34 172L46 134L60 106Z" fill="none" {...INK} />
      </Mirror>
      {/* torso: an inverted cut gem */}
      <path d="M58 78H142L124 124L100 140L76 124Z" fill={c} {...INK} />
      <path d="M58 78H100L76 124Z" fill={light} />
      <path d="M100 78L76 124L100 140Z" fill={mid} />
      <path d="M100 78L124 124L100 140Z" fill={mix(c, 74, c2)} />
      <path d="M58 78H142L124 124L100 140L76 124Z" fill="none" {...INK} />
      <path d="M100 78V140M100 78L76 124M100 78L124 124" {...LINE} stroke="var(--fg)" strokeWidth="1.6" />
      {/* head */}
      <path d="M100 26L122 46L116 76L100 86L84 76L78 46Z" fill={mid} {...INK} />
      <path d="M100 26L78 46L84 76L100 86Z" fill={light} />
      <path d="M100 26L122 46L116 76L100 86L84 76L78 46Z" fill="none" {...INK} />
      <path d="M81 48H119L116 62H84Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
      <Gaze still={still}>
        {happy ? (
          <path d="M86 59Q92 50 98 57M102 57Q108 50 114 59" {...LINE} stroke={c2} strokeWidth="3" />
        ) : (
          <path d="M85 51L98 55.500V59.500L87 56.500ZM115 51L102 55.500V59.500L113 56.500Z" fill={c2} />
        )}
      </Gaze>
      {/* frost breath */}
      <g {...mo(still, 'bf-fade', 2.4)}>
        <path d="M92 74C76 70 56 58 34 56C18 56 8 64 10 74C12 86 28 92 44 86C62 82 78 84 94 80Z" fill={mix(c, 45, c2)} stroke="var(--fg)" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M22 72Q30 64 42 68Q50 72 62 70" {...LINE} stroke={c2} strokeWidth="2.6" />
      </g>
      {[
        [12, 42, 9, 0],
        [8, 104, 7, 0.9],
        [36, 36, 6, 1.7],
      ].map(([x, y, r, d]) => (
        <g key={x + y} stroke={mix(c, 60, c2)} strokeWidth="2.2" strokeLinecap="round" {...mo(still, 'bf-twinkle', 3, d)}>
          <path d={`M${x - r} ${y}H${x + r}M${x - r / 2} ${y - r * 0.87}L${x + r / 2} ${y + r * 0.87}M${x + r / 2} ${y - r * 0.87}L${x - r / 2} ${y + r * 0.87}`} />
        </g>
      ))}
    </g>
  );
};

// ─── 29 Verdant ─────────────────────────────────────────────────────────────

const LEAVES: [number, number, number][] = [
  [100, 28, 26],
  [62, 34, 24],
  [138, 34, 24],
  [30, 56, 22],
  [170, 56, 22],
  [78, 58, 16],
  [122, 58, 16],
];
const FLIES: [number, number][] = [
  [14, 92],
  [186, 96],
  [46, 92],
  [154, 88],
  [100, 4],
  [12, 30],
  [188, 28],
  [30, 128],
  [172, 134],
];

const Verdant: Art = ({ c, c2, uid, still, happy }) => {
  const leaf = `${uid}da`;
  const fly = `${uid}db`;
  const bark = `${uid}dc`;
  const branch = (d: string, w: number) => (
    <>
      <path d={d} {...LINE} stroke="var(--fg)" strokeWidth={w + 5} />
      <path d={d} {...LINE} stroke={`url(#${bark})`} strokeWidth={w} />
    </>
  );
  return (
    <g>
      <defs>
        <Lin id={leaf} a={mix(c2, 92, '#fff')} b={mix(c2, 45, c)} user={[0, 0, 0, 84]} />
        <Lin id={bark} a={c} b={dark(c, 55)} user={[0, 40, 0, 170]} />
        <Glow id={fly} stops={[[0, '#fff', 1], [0.35, c2, 1], [1, c2, 0]]} />
      </defs>
      <Shadow rx={84} />
      {/* crown */}
      {LEAVES.map(([x, y, r]) => (
        <circle key={x * 100 + y} cx={x} cy={y} r={r} fill="var(--fg)" stroke="var(--fg)" strokeWidth="6" />
      ))}
      {LEAVES.map(([x, y, r]) => (
        <circle key={x * 100 + y} cx={x} cy={y} r={r} fill={`url(#${leaf})`} />
      ))}
      {branch('M100 96V36', 11)}
      {branch('M90 92C76 76 62 62 62 40', 9)}
      {branch('M110 92C124 76 138 62 138 40', 9)}
      {branch('M78 92C60 86 44 76 32 60', 8)}
      {branch('M122 92C140 86 156 76 168 60', 8)}
      {/* root legs */}
      <Mirror>
        <path d="M76 124C66 150 42 152 12 182H36C54 170 72 164 88 146Z" fill={`url(#${bark})`} {...INK} />
        <path d="M86 134C84 152 74 168 60 182H84C92 170 98 158 100 140Z" fill={`url(#${bark})`} {...INK} />
        <path d="M54 152L64 162" {...LINE} stroke={c2} strokeWidth="4" />
        <path d="M78 150L90 156" {...LINE} stroke={c2} strokeWidth="4" />
      </Mirror>
      {/* trunk: bark plate with a mech's face */}
      <path d="M72 84H128L136 138L100 148L64 138Z" fill={`url(#${bark})`} {...INK} />
      <path d="M78 120L74 136M92 122L90 142M108 122L110 142M122 120L126 136" {...LINE} stroke="var(--fg)" strokeWidth="1.8" />
      <path d="M100 108V126M100 126L88 136M100 126L112 136" {...LINE} stroke={c2} strokeWidth="2.5" {...mo(still, 'bf-fade', 2.8)} />
      <circle cx="100" cy="126" r="4.500" fill={c2} {...THIN} />
      <path d="M76 90H124L120 106H80Z" fill={NIGHT} {...INK} strokeWidth="2.4" />
      <Gaze still={still}>
        {happy ? (
          <path d="M83 102Q90 92 97 100M103 100Q110 92 117 102" {...LINE} stroke={c2} strokeWidth="3.2" />
        ) : (
          <>
            <circle cx="89" cy="98" r="4.800" fill={c2} />
            <circle cx="111" cy="98" r="4.800" fill={c2} />
          </>
        )}
      </Gaze>
      {FLIES.map(([x, y], i) => (
        <circle key={x + y} cx={x} cy={y} r="6" fill={`url(#${fly})`} {...mo(still, 'bf-twinkle', 2 + (i % 3) * 0.7, i * 0.35)} />
      ))}
    </g>
  );
};

// ─── 30 Ophanim ─────────────────────────────────────────────────────────────

const Almond = ({ x = 0, y = 0, r = 6, rot = 0, iris }: { x?: number; y?: number; r?: number; rot?: number; iris: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M${-r} 0Q0 ${-r} ${r} 0Q0 ${r} ${-r} 0Z`} fill="#fff" stroke={NIGHT} strokeWidth="1" />
    <circle r={r * 0.42} fill={iris} />
    <circle r={r * 0.2} fill={NIGHT} />
  </g>
);

const Ophanim: Art = ({ c, c2, uid, still, happy }) => {
  const band = `${uid}oa`;
  const orb = `${uid}ob`;
  const halo = `${uid}oc`;
  const near = `${uid}od`;
  const wheel = (r: number, w: number, eyes: number, eye: number, t: number, rev: boolean) => (
    <g {...mo(still, rev ? 'bf-rot bf-rev' : 'bf-rot', t)}>
      <circle r={r} fill="none" stroke="var(--fg)" strokeWidth={w + 5} />
      <circle r={r} fill="none" stroke={`url(#${band})`} strokeWidth={w} />
      {range(eyes).map((i) => {
        const [x, y] = polar(r, (i * 360) / eyes);
        return <Almond key={i} x={x} y={y} r={eye} rot={(i * 360) / eyes} iris={c} />;
      })}
    </g>
  );
  const tilted = (rot: number, t: number, rev: boolean, front: boolean) => (
    <g transform={`translate(100 98) rotate(${rot}) scale(1 .34)`}>
      <g clipPath={front ? `url(#${near})` : undefined}>{wheel(92, 15, 10, 8, t, rev)}</g>
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={band} a={c2} b={c} />
        <Glow id={orb} stops={[[0, mix(c, 50, NIGHT), 1], [1, NIGHT, 1]]} />
        <Glow id={halo} stops={[[0, c2, 0.7], [0.7, c, 0.25], [1, c, 0]]} />
        <clipPath id={near}>
          <rect x="-120" y="0" width="240" height="120" />
        </clipPath>
      </defs>
      <circle cx="100" cy="98" r="100" fill={`url(#${halo})`} />
      {tilted(50, 26, false, false)}
      {tilted(-50, 32, true, false)}
      <g transform="translate(100 98)">
        {wheel(64, 13, 12, 6.5, 40, false)}
        {range(16).map((i) => (
          <path key={i} d="M-5 -71L0 -84L5 -71Z" fill={c2} {...THIN} transform={`rotate(${i * 22.5})`} />
        ))}
      </g>
      {tilted(50, 26, false, true)}
      {tilted(-50, 32, true, true)}
      {/* the great eye */}
      <circle cx="100" cy="98" r="33" fill={`url(#${orb})`} {...INK} />
      <circle cx="100" cy="98" r="27" fill="none" stroke={c2} strokeWidth="1.5" strokeDasharray="2 5" {...(still ? {} : { className: 'i-spin i-spin--slow' })} />
      <Gaze still={still}>
        {happy ? (
          <path d="M78 104Q100 78 122 104" {...LINE} stroke={c2} strokeWidth="6" />
        ) : (
          <>
            <path d="M74 98Q100 70 126 98Q100 126 74 98Z" fill="#fff" stroke={c2} strokeWidth="2.5" />
            <circle cx="100" cy="98" r="11.500" fill={c} />
            <circle cx="100" cy="98" r="5.500" fill={NIGHT} />
            <circle cx="96" cy="94" r="2.200" fill="#fff" />
          </>
        )}
      </Gaze>
    </g>
  );
};

// ─── 31 Seraph ──────────────────────────────────────────────────────────────

const Seraph: Art = ({ c, c2, uid, still, happy }) => {
  const feather = `${uid}ra`;
  const flame = `${uid}rc`;
  const halo = `${uid}rd`;
  const vane = (L: number, w: number) => `M0 0C${w} ${-L * 0.3} ${w} ${-L * 0.72} 0 ${-L}C${-w} ${-L * 0.72} ${-w} ${-L * 0.3} 0 0Z`;
  /** One wing, drawn pointing along +x from its root: a leading edge with feathers hanging off it. */
  const wing = (rot: number, L: number, sway: number) => {
    const at = (t: number): [number, number] => [2 * (1 - t) * t * 38 + t * t * L, 2 * (1 - t) * t * -30 + t * t * -14];
    return (
      <g transform={`translate(108 98) rotate(${rot})`}>
        <g {...mo(still, 'bf-sway', 5, 0, { '--bf-sway': `${sway}deg` })}>
          {range(8).map((j) => {
            const t = 1 - j / 8;
            const [x, y] = at(t);
            return <path key={j} d={vane(20 + t * 26, 7.5)} fill={`url(#${feather})`} {...INK} strokeWidth="2.2" transform={`translate(${x} ${y}) rotate(${172 - t * 80})`} />;
          })}
          {range(7).map((j) => {
            const t = 0.82 - j * 0.12;
            const [x, y] = at(t);
            return <path key={j} d={vane(13 + t * 8, 5.5)} fill={c2} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" transform={`translate(${x} ${y}) rotate(${176 - t * 76})`} />;
          })}
          <path d={`M0 0Q38 -30 ${L} -14`} {...LINE} stroke="var(--fg)" strokeWidth="8.5" />
          <path d={`M0 0Q38 -30 ${L} -14`} {...LINE} stroke={c} strokeWidth="4.5" />
        </g>
      </g>
    );
  };
  return (
    <g>
      <defs>
        <Lin id={feather} a={c} b={mix(c2, 60, c)} />
        <Lin id={flame} a="#fff" b={c} />
        <Glow id={halo} stops={[[0, c2, 0.9], [0.5, c, 0.35], [1, c, 0]]} />
      </defs>
      <circle cx="100" cy="98" r="60" fill={`url(#${halo})`} />
      <Mirror>
        {wing(54, 76, -4)}
        {wing(-66, 86, 5)}
        {wing(-6, 90, -5)}
      </Mirror>
      {/* burning core */}
      <g transform="translate(100 98) scale(.82) translate(-100 -98)">
        <path d="M100 42C110 58 116 56 124 70C120 66 118 68 118 70C130 84 134 96 128 112C124 128 112 138 100 138C88 138 76 128 72 112C66 96 70 84 82 70C82 68 80 66 76 70C84 56 90 58 100 42Z" fill={c} {...INK} strokeWidth="3.6" />
        <path d="M100 62C110 76 122 88 120 106C118 122 110 130 100 130C90 130 82 122 80 106C78 88 90 76 100 62Z" fill={`url(#${flame})`} {...mo(still, 'bf-fade', 1.4)} />
        <path d="M78 100Q100 80 122 100Q100 118 78 100Z" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" />
        <Gaze still={still}>
          {happy ? <path d="M86 104Q100 90 114 104" {...LINE} stroke={c2} strokeWidth="4" /> : <circle cx="100" cy="99" r="7.500" fill={c2} />}
        </Gaze>
      </g>
    </g>
  );
};

// ─── 32 Nebula ──────────────────────────────────────────────────────────────

const FIGURE =
  'M100 26C112 26 120 36 120 46C120 56 114 64 108 67C112 76 128 76 138 84C150 94 150 118 154 134C168 144 186 156 180 170C170 182 130 180 100 180C70 180 30 182 20 170C14 156 32 144 46 134C50 118 50 94 62 84C72 76 88 76 92 67C86 64 80 56 80 46C80 36 88 26 100 26ZM68 104C64 116 66 128 62 140L78 134C76 124 74 114 68 104ZM132 104C136 116 134 128 138 140L122 134C124 124 126 114 132 104Z';

const Nebula: Art = ({ c, c2, uid, still, happy }) => {
  const a = `${uid}na`;
  const b = `${uid}nb`;
  const sky = `${uid}nc`;
  const clip = `${uid}nd`;
  return (
    <g>
      <defs>
        <Glow id={a} stops={[[0, c, 0.95], [0.6, c, 0.5], [1, c, 0]]} />
        <Glow id={b} stops={[[0, c2, 0.95], [0.55, c2, 0.45], [1, c2, 0]]} />
        <Lin id={sky} a={dark(c, 55)} b={NIGHT} />
        <clipPath id={clip}>
          <path d={FIGURE} clipRule="evenodd" />
        </clipPath>
      </defs>
      {/* star clouds behind */}
      <g transform="translate(100 96)">
        <g {...mo(still, 'bf-rot', 70)}>
          <ellipse cx="-54" cy="-34" rx="50" ry="40" fill={`url(#${a})`} />
          <ellipse cx="56" cy="-30" rx="46" ry="46" fill={`url(#${b})`} />
          <ellipse cx="-44" cy="48" rx="46" ry="42" fill={`url(#${b})`} />
          <ellipse cx="52" cy="46" rx="50" ry="44" fill={`url(#${a})`} />
          <ellipse cx="0" cy="-68" rx="40" ry="28" fill={`url(#${a})`} />
        </g>
      </g>
      <g className={hover(still)}>
        {/* a seated figure of sky */}
        <path d={FIGURE} fill={`url(#${sky})`} fillRule="evenodd" stroke={c2} strokeWidth="9" opacity=".32" strokeLinejoin="round" />
        <path d={FIGURE} fill={`url(#${sky})`} fillRule="evenodd" />
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="70" cy="150" rx="46" ry="26" fill={`url(#${a})`} />
          <ellipse cx="136" cy="156" rx="40" ry="24" fill={`url(#${b})`} opacity=".7" />
          <ellipse cx="100" cy="100" rx="30" ry="28" fill={`url(#${a})`} />
        </g>
        <path d={FIGURE} fill="none" fillRule="evenodd" {...INK} strokeWidth="2.6" />
        <path d={spark(100, 104, 12)} fill="#fff" {...mo(still, 'bf-twinkle', 3)} />
        {range(26).map((i) => {
          const x = 30 + rnd(i) * 140;
          const y = 88 + rnd(i + 40) * 86;
          return <circle key={i} cx={x} cy={y} r={0.9 + rnd(i + 80) * 1.2} fill="#fff" opacity=".9" />;
        })}
        <Gaze still={still}>
          {happy ? (
            <path d="M86 50Q91 42 96 49M104 49Q109 42 114 50" {...LINE} stroke="#fff" strokeWidth="3" />
          ) : (
            <>
              <path d={spark(90, 47, 7)} fill="#fff" />
              <path d={spark(110, 47, 7)} fill="#fff" />
            </>
          )}
        </Gaze>
      </g>
      {/* little stars around */}
      {[
        [18, 40, 7],
        [182, 30, 8],
        [36, 12, 5],
        [160, 80, 5],
        [14, 110, 6],
        [188, 118, 6],
        [150, 10, 4],
      ].map(([x, y, r], i) => (
        <path key={x} d={spark(x, y, r)} fill={c2} stroke="var(--fg)" strokeWidth=".8" {...mo(still, 'bf-twinkle', 2.2 + (i % 3), i * 0.3)} />
      ))}
    </g>
  );
};

// ─── 33 Pulsar ──────────────────────────────────────────────────────────────

const Pulsar: Art = ({ c, c2, uid, still, happy }) => {
  const beam = `${uid}pa`;
  const plate = `${uid}pb`;
  const ring = `${uid}pc`;
  const lobe = (s: number) => `M0 ${-16 * s}C${40 * s} ${-74 * s} ${88 * s} ${-44 * s} ${88 * s} 0C${88 * s} ${44 * s} ${40 * s} ${74 * s} 0 ${16 * s}`;
  return (
    <g>
      <defs>
        <linearGradient id={beam} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-118">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".22" stopColor={c2} />
          <stop offset=".7" stopColor={c} stopOpacity=".85" />
          <stop offset="1" stopColor={c} stopOpacity=".3" />
        </linearGradient>
        <Lin id={plate} a={mix(c, 70, '#fff')} b={dark(c, 45)} />
        <Glow id={ring} stops={[[0, c, 0.5], [1, c, 0]]} />
      </defs>
      <circle cx="100" cy="100" r="70" fill={`url(#${ring})`} />
      <g transform="translate(100 100) rotate(28)">
        <g {...mo(still, 'bf-rot', 14)}>
          {[1, 0.74, 0.5].map((s) => (
            <g key={s}>
              <path d={lobe(s)} {...LINE} stroke={c} strokeWidth="3" />
              <path d={lobe(s)} {...LINE} stroke={c} strokeWidth="3" transform="scale(-1 1)" />
            </g>
          ))}
          {[0, 180].map((r) => (
            <path key={r} d="M-7 -12L-27 -122H27L7 -12Z" fill={`url(#${beam})`} transform={`rotate(${r})`} />
          ))}
          {[0, 180].map((r) => (
            <path key={r} d="M-2.500 -12L-6 -122H6L2.500 -12Z" fill="#fff" opacity=".85" transform={`rotate(${r})`} />
          ))}
        </g>
      </g>
      <g transform="translate(100 100)">
        <circle r="60" fill="none" stroke={c2} strokeWidth="2.5" {...mo(still, 'bf-ping', 2.4)} />
      </g>
      {/* the dense core, plated */}
      <path d="M100 62L127 73L138 100L127 127L100 138L73 127L62 100L73 73Z" fill={`url(#${plate})`} {...INK} strokeWidth="3.5" />
      <path d="M100 62V76M127 73L116 84M138 100H124M127 127L116 116M100 138V124M73 127L84 116M62 100H76M73 73L84 84" {...LINE} stroke="var(--fg)" strokeWidth="2" />
      <path d="M100 76L117 83L124 100L117 117L100 124L83 117L76 100L83 83Z" fill={dark(c, 70)} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="78" y="91" width="44" height="18" rx="9" fill={NIGHT} stroke={c2} strokeWidth="1.5" />
      <Gaze still={still}>
        {happy ? (
          <path d="M86 104Q100 90 114 104" {...LINE} stroke={c2} strokeWidth="4" />
        ) : (
          <>
            <rect x="85" y="95" width="30" height="10" rx="5" fill={c2} />
            <rect x="93" y="96.500" width="14" height="7" rx="3.500" fill="#fff" />
          </>
        )}
      </Gaze>
    </g>
  );
};

// ─── 34 Quasar ──────────────────────────────────────────────────────────────

const Quasar: Art = ({ c, c2, uid, still, happy }) => {
  const jet = `${uid}qa`;
  const near = `${uid}qb`;
  const heat = `${uid}qc`;
  const halo = `${uid}qd`;
  const disc = (
    <g {...mo(still, 'bf-rot', 16)}>
      <circle r="90" fill="none" stroke={dark(c, 60)} strokeWidth="18" />
      <circle r="70" fill="none" stroke={c} strokeWidth="22" />
      <circle r="52" fill="none" stroke={mix(c2, 72, c)} strokeWidth="14" />
      <circle r="42" fill="none" stroke={mix(c2, 60, '#fff')} strokeWidth="6" />
      <circle r="84" fill="none" stroke={c2} strokeWidth="3" strokeDasharray="34 26" />
      <circle r="68" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="20 34" opacity=".7" />
      <circle r="54" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="14 18" />
      <circle r="99" fill="none" stroke="var(--fg)" strokeWidth="3" />
    </g>
  );
  const flare = (flip: boolean) => (
    <g transform={flip ? 'rotate(180)' : undefined}>
      <path d="M-5 -26C-7 -60 -14 -86 -30 -112H30C14 -86 7 -60 5 -26Z" fill={`url(#${jet})`} stroke="var(--fg)" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M-1.500 -26L-5 -112H5L1.500 -26Z" fill="#fff" />
      {[62, 84].map((y, i) => (
        <circle key={y} cy={-y} r={5 + i * 1.5} fill="#fff" stroke={c2} strokeWidth="2" {...mo(still, 'bf-fade', 1.3, i * 0.4)} />
      ))}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={jet} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={c2} />
          <stop offset=".6" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity=".45" />
        </linearGradient>
        <clipPath id={near}>
          <rect x="-120" y="0" width="240" height="120" />
        </clipPath>
        <Glow id={heat} stops={[[0, '#fff', 1], [0.7, c2, 1], [1, c, 1]]} />
        <Glow id={halo} stops={[[0, c2, 0.75], [0.5, c, 0.3], [1, c, 0]]} />
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${halo})`} />
      <g transform="translate(100 100) rotate(-16)">
        {flare(false)}
        {flare(true)}
        <g transform="scale(1 .32)">{disc}</g>
        {/* the far side of the disc, bent up over the hole by its gravity */}
        <circle r="37" fill="none" stroke="var(--fg)" strokeWidth="10" />
        <circle r="37" fill="none" stroke={`url(#${heat})`} strokeWidth="7" />
        <circle r="31" fill={NIGHT} />
        <g transform="scale(1 .32)">
          <g clipPath={`url(#${near})`}>{disc}</g>
        </g>
      </g>
      <Gaze still={still}>
        {happy ? (
          <path d="M84 95Q100 79 116 95" {...LINE} stroke={c2} strokeWidth="4.500" />
        ) : (
          <>
            <path d="M80 92Q100 74 120 92Q100 104 80 92Z" fill={NIGHT} stroke={c2} strokeWidth="2.5" />
            <circle cx="100" cy="90" r="7" fill={c2} />
            <circle cx="100" cy="90" r="3" fill={NIGHT} />
          </>
        )}
      </Gaze>
    </g>
  );
};

// ─── 35 Chronos ─────────────────────────────────────────────────────────────

const Gear = ({ x, y, r, n, fill, t, rev, still }: { x: number; y: number; r: number; n: number; fill: string; t: number; rev?: boolean; still: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <g {...mo(still, rev ? 'bf-rot bf-rev' : 'bf-rot', t)}>
      {range(n).map((i) => (
        <rect key={i} x={-r * 0.2} y={-r * 1.22} width={r * 0.4} height={r * 0.5} fill={fill} stroke="var(--fg)" strokeWidth="2.2" transform={`rotate(${(i * 360) / n})`} />
      ))}
      <circle r={r} fill={fill} {...INK} />
      <circle r={r * 0.62} fill="none" stroke="var(--fg)" strokeWidth="1.6" />
      {range(3).map((i) => (
        <path key={i} d={`M0 0V${-r * 0.62}`} stroke="var(--fg)" strokeWidth="2.2" transform={`rotate(${i * 120})`} />
      ))}
      <circle r={r * 0.2} fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="1.8" />
    </g>
  </g>
);

const Chronos: Art = ({ c, c2, uid, still, happy }) => {
  const brass = `${uid}ca`;
  const glass = `${uid}cb`;
  return (
    <g>
      <defs>
        <Lin id={brass} a={mix(c, 60, '#fde68a')} b={c} />
        <Lin id={glass} a={mix(c2, 45, 'transparent')} b={mix(c2, 22, 'transparent')} />
      </defs>
      <Shadow rx={54} />
      <Gear x={40} y={70} r={25} n={10} fill={`url(#${brass})`} t={12} still={still} />
      <Gear x={160} y={70} r={25} n={10} fill={`url(#${brass})`} t={12} rev still={still} />
      <Gear x={26} y={112} r={14} n={7} fill={c2} t={7} rev still={still} />
      <Gear x={174} y={112} r={14} n={7} fill={c2} t={7} still={still} />
      {/* hourglass for legs */}
      <rect x="60" y="172" width="80" height="10" rx="3" fill={`url(#${brass})`} {...INK} />
      <path d="M68 128V172M132 128V172" {...LINE} stroke="var(--fg)" strokeWidth="6" />
      <path d="M68 128V172M132 128V172" {...LINE} stroke={c} strokeWidth="2.5" />
      <path d="M76 128C76 146 96 148 96 152C96 156 76 160 76 172H124C124 160 104 156 104 152C104 148 124 146 124 128Z" fill={`url(#${glass})`} {...INK} />
      <path d="M84 139C90 147 97 148 100 152C103 148 110 147 116 139Z" fill={c} />
      <path d="M82 172Q100 152 118 172Z" fill={c} />
      <path d="M100 152V166" {...LINE} stroke={c} strokeWidth="2.2" strokeDasharray="2 3" {...mo(still, 'bf-sand')} />
      {/* head */}
      <path d="M78 42C78 14 122 14 122 42V52H78Z" fill={`url(#${brass})`} {...INK} />
      <path d="M100 8V20" {...LINE} stroke="var(--fg)" strokeWidth="3" />
      <circle cx="100" cy="8" r="4" fill={c2} {...THIN} />
      <rect x="82" y="25" width="36" height="14" rx="7" fill={NIGHT} stroke="var(--fg)" strokeWidth="2" />
      <Gaze still={still}>
        {happy ? (
          <path d="M88 36Q100 25 112 36" {...LINE} stroke={c2} strokeWidth="3.4" />
        ) : (
          <rect x="89" y="28" width="22" height="8" rx="4" fill={c2} />
        )}
      </Gaze>
      {/* the clock is the chest */}
      <circle cx="100" cy="88" r="46" fill={`url(#${brass})`} {...INK} strokeWidth="3.5" />
      <circle cx="100" cy="88" r="37" fill={c2} {...INK} />
      <g transform="translate(100 88)">
        {range(12).map((i) => (
          <path key={i} d={i % 3 ? 'M0 -34V-29' : 'M0 -34V-25'} stroke={NIGHT} strokeWidth={i % 3 ? 2.2 : 4} transform={`rotate(${i * 30})`} />
        ))}
        <g transform="rotate(-50)">
          <g {...mo(still, 'bf-rot', 96)}>
            <path d="M0 6V-20" {...LINE} stroke={NIGHT} strokeWidth="5" />
          </g>
        </g>
        <g transform="rotate(50)">
          <g {...mo(still, 'bf-rot', 8)}>
            <path d="M0 8V-29" {...LINE} stroke={c} strokeWidth="3.4" />
          </g>
        </g>
        <circle r="4.500" fill={c} stroke={NIGHT} strokeWidth="1.5" />
      </g>
    </g>
  );
};

// ─── 36 Paradox ─────────────────────────────────────────────────────────────

const Paradox: Art = ({ c, c2, uid, still, happy }) => {
  const mid = mix(c2, 42, c);
  const [a, b, d] = [`${uid}za`, `${uid}zb`, `${uid}zd`];
  return (
    <g>
      <defs>
        <Lin id={a} a={mix(c2, 84, '#fff')} b={mix(c2, 62, c)} user={[100, 20, 180, 150]} />
        <Lin id={b} a={c} b={mix(c2, 30, c)} user={[30, 150, 175, 150]} />
        <Lin id={d} a={mix(c2, 26, c)} b={mix(c2, 62, c)} user={[20, 150, 100, 20]} />
      </defs>
      <Shadow rx={64} />
      <g className={hover(still)}>
        {/* a fork with three prongs below and two above */}
        <g fill="none" stroke="var(--fg)" strokeWidth="2.6" strokeLinecap="round">
          <path d="M72 158V176M84 158V176M94 158V176M106 158V176M116 158V176M128 158V176" />
          <ellipse cx="78" cy="177" rx="6" ry="4" fill={mid} />
          <ellipse cx="100" cy="177" rx="6" ry="4" fill={mid} />
          <ellipse cx="122" cy="177" rx="6" ry="4" fill={mid} />
        </g>
        {/* the triangle that cannot be built */}
        <polygon points="107.8 21.500 178.8 144.500 163.200 144.500 107.8 48.500 60.200 131 44.600 131 100 35 92.200 21.500" fill={`url(#${a})`} {...INK} />
        <polygon points="171 158 29 158 36.800 144.500 147.600 144.500 100 62 107.800 48.500 163.200 144.500 178.800 144.500" fill={`url(#${b})`} {...INK} />
        <polygon points="21.200 144.500 92.200 21.500 100 35 44.600 131 139.800 131 147.600 144.500 36.800 144.500 29 158" fill={`url(#${d})`} {...INK} />
        {/* the eye in the hole */}
        <circle cx="100" cy="108" r="17" fill={NIGHT} stroke={c2} strokeWidth="2.5" />
        <Gaze still={still}>
          {happy ? (
            <path d="M90 112Q100 100 110 112" {...LINE} stroke={c2} strokeWidth="4" />
          ) : (
            <>
              <circle cx="100" cy="108" r="8" fill={c2} />
              <circle cx="100" cy="108" r="3.500" fill={NIGHT} />
            </>
          )}
        </Gaze>
      </g>
      {/* an impossible cube, and a piece that belongs nowhere */}
      <g {...mo(still, 'bf-bob', 3.2)}>
        <path d="M20 40L38 30L56 40V58L38 68L20 58Z" fill={c} {...INK} />
        <path d="M20 40L38 50L56 40M38 50V68" {...LINE} stroke={c2} strokeWidth="2.5" />
        <path d="M38 30V50" {...LINE} stroke={c2} strokeWidth="2.5" />
      </g>
      <g {...mo(still, 'bf-bob', 4, 0.8, { '--bf-bob': '6px' })}>
        <path d="M152 34L180 34L188 48L160 48Z" fill={c2} {...INK} />
        <path d="M160 48L188 48L180 62L152 62Z" fill={c} {...INK} />
      </g>
    </g>
  );
};

// ─── 37 Cipher ──────────────────────────────────────────────────────────────

/** Where the figure is cut, and how far each slice has slipped: [top, height, slip]. */
const SLICES: [number, number, number][] = [
  [6, 18, 3],
  [24, 9, -3],
  [33, 17, 11],
  [50, 8, -6],
  [58, 10, 2],
  [68, 12, -10],
  [80, 6, 13],
  [86, 14, -2],
  [100, 10, 8],
  [110, 5, -15],
  [115, 15, 3],
  [130, 10, -7],
  [140, 7, 11],
  [147, 13, -3],
  [160, 6, -12],
  [166, 22, 5],
];
const BODY = 'M72 42C72 10 128 10 128 42L124 64H112V72H144L154 92L136 100L130 132H124L122 178H104L100 136L96 178H78L76 132H70L64 100L46 92L56 72H88V64H76Z';

const Cipher: Art = ({ c, c2, uid, still, happy }) => {
  const fig = `${uid}ya`;
  const sil = `${uid}yb`;
  const slip = SLICES[2][2];
  const motion = (i: number) => mo(still, 'bf-glitch', 2.2 + (i % 4) * 0.7, i * 0.11, { '--bf-g': `${(i % 2 ? -1 : 1) * (3 + (i % 3) * 3)}px` });
  return (
    <g>
      <defs>
        <path id={sil} d={BODY} />
        <g id={fig}>
          <Mirror>
            <path d="M46 92L28 98L20 142L36 148L48 112L64 100Z" fill={c} {...INK} />
            <path d="M34 108L28 136" {...LINE} stroke={c2} strokeWidth="2.5" />
          </Mirror>
          <use href={`#${sil}`} fill={c} {...INK} />
          <path d="M78 34H122V52H78Z" fill={NIGHT} stroke={c2} strokeWidth="2" />
          <path d="M100 76L120 88V112L100 124L80 112V88Z" fill="none" stroke={c2} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M60 80H80M120 80H140M86 136V160M114 136V160" {...LINE} stroke={c2} strokeWidth="2" />
          <g fontFamily="ui-monospace, monospace" fontSize="10" fontWeight="700" fill={c2} textAnchor="middle">
            <text x="100" y="97">01</text>
            <text x="100" y="109">1F</text>
          </g>
        </g>
        {SLICES.map(([y, h], i) => (
          <clipPath key={i} id={`${uid}y${i}`}>
            <rect x="-60" y={y} width="320" height={h} />
          </clipPath>
        ))}
      </defs>
      <Shadow rx={46} />
      {/* data falling out of it */}
      <g fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill={c2}>
        {['1', '0', 'F', '1', 'A', '0', '7', '1'].map((t, i) => (
          <text key={i} x={i % 2 ? 176 - (i % 3) * 7 : 10 + (i % 3) * 7} y={24 + i * 21} {...mo(still, 'bf-fade', 1.5 + (i % 3) * 0.6, i * 0.2)}>
            {t}
          </text>
        ))}
      </g>
      {[
        [30, 16, 10],
        [168, 22, 8],
        [12, 164, 8],
        [190, 172, 7],
      ].map(([x, y, r], i) => (
        <path key={x} d={`M${x} ${y - r}L${x + r * 0.87} ${y - r / 2}V${y + r / 2}L${x} ${y + r}L${x - r * 0.87} ${y + r / 2}V${y - r / 2}Z`} fill="none" stroke={c2} strokeWidth="2.6" strokeLinejoin="round" {...mo(still, 'bf-twinkle', 3, i * 0.5)} />
      ))}
      {SLICES.map(([, , dx], i) => (
        <g key={i} {...motion(i)}>
          <g clipPath={`url(#${uid}y${i})`}>
            <use href={`#${sil}`} x={dx + 6} fill={c2} />
            <use href={`#${sil}`} x={dx - 5} fill={mix(c2, 40, '#ff2bd6')} opacity=".75" />
            <use href={`#${fig}`} x={dx} />
          </g>
        </g>
      ))}
      {/* slabs thrown clear */}
      <g fill={c2} stroke="var(--fg)" strokeWidth="1.6">
        <rect x="148" y="111" width="26" height="5" {...mo(still, 'bf-fade', 1.1)} />
        <rect x="24" y="80" width="18" height="6" {...mo(still, 'bf-fade', 1.7, 0.3)} />
        <rect x="150" y="62" width="14" height="5" {...mo(still, 'bf-fade', 1.4, 0.6)} />
        <rect x="28" y="160" width="30" height="5" {...mo(still, 'bf-fade', 1.3, 0.2)} />
      </g>
      <g {...motion(2)}>
        <Gaze still={still}>
          {happy ? (
            <path d={`M${84 + slip} 48L${90 + slip} 40L${96 + slip} 48M${104 + slip} 48L${110 + slip} 40L${116 + slip} 48`} fill="none" stroke={c2} strokeWidth="3.6" strokeLinejoin="miter" />
          ) : (
            <>
              <rect x={84 + slip} y="38" width="12" height="10" fill={c2} />
              <rect x={104 + slip} y="38" width="12" height="10" fill={c2} />
            </>
          )}
        </Gaze>
      </g>
    </g>
  );
};

// ─── 38 Void Emperor ────────────────────────────────────────────────────────

const VoidEmperor: Art = ({ c, c2, uid, still, happy }) => {
  const sky = `${uid}xa`;
  const face = `${uid}xb`;
  const crown = `${uid}xc`;
  const cape = 'M100 76C78 72 62 78 54 92C44 120 22 150 2 186L28 176L44 190L68 178L86 192L100 180L114 192L132 178L156 190L172 176L198 186C178 150 156 120 146 92C138 78 122 72 100 76Z';
  return (
    <g>
      <defs>
        <Lin id={sky} a={NIGHT} b={dark(c, 92)} />
        <Glow id={face} stops={[[0, '#000', 1], [0.72, '#000', 1], [1, c2, 1]]} />
        <Lin id={crown} a={mix(c2, 70, '#fff')} b={c} />
        <Glow id={`${uid}xd`} stops={[[0, c2, 0.55], [0.75, c2, 0.3], [1, c2, 0]]} />
      </defs>
      {/* a black sun behind him */}
      <circle cx="100" cy="60" r="72" fill={`url(#${uid}xd)`} />
      <g transform="translate(100 60)">
        <g {...mo(still, 'bf-rot', 60)}>
          {range(24).map((i) => (
            <path key={i} d="M-3 -54L0 -70L3 -54Z" fill={c2} stroke="var(--fg)" strokeWidth="1.2" strokeLinejoin="round" transform={`rotate(${i * 15})`} />
          ))}
        </g>
        <circle r="54" fill={NIGHT} {...INK} />
        <circle r="50" fill="none" stroke={c2} strokeWidth="2.5" />
      </g>
      {/* collar blades */}
      <Mirror>
        <path d="M76 86L38 34L58 52L60 26L82 64Z" fill={NIGHT} {...INK} />
        <path d="M60 58L58 42M50 54L46 46" {...LINE} stroke={c2} strokeWidth="2.2" />
      </Mirror>
      <path d={cape} fill={`url(#${sky})`} {...INK} />
      <path d="M2 186L28 176L44 190L68 178L86 192L100 180L114 192L132 178L156 190L172 176L198 186" {...LINE} stroke={c2} strokeWidth="2.5" />
      {/* stars in the cape */}
      {range(30).map((i) => {
        const t = 0.12 + rnd(i) * 0.84;
        const x = 100 + (rnd(i + 50) * 2 - 1) * (30 + t * 66);
        const y = 92 + t * 82;
        return i % 3 === 0 ? (
          <path key={i} d={spark(x, y, 4 + rnd(i + 9) * 3.5)} fill={i % 2 ? '#fff' : c2} {...mo(still, 'bf-twinkle', 2 + (i % 4) * 0.7, i * 0.2)} />
        ) : (
          <circle key={i} cx={x} cy={y} r={0.9 + rnd(i + 3) * 1.1} fill="#fff" />
        );
      })}
      {/* body */}
      <path d="M80 84H120L114 132L100 150L86 132Z" fill={NIGHT} {...INK} />
      <path d="M100 88V144" {...LINE} stroke={c2} strokeWidth="3" {...mo(still, 'bf-fade', 3)} />
      <Mirror>
        <path d="M84 96L92 104L88 122" {...LINE} stroke={c} strokeWidth="2.5" />
      </Mirror>
      {/* hood and the void */}
      <path d="M100 30C124 30 130 54 126 72C122 86 110 92 100 92C90 92 78 86 74 72C70 54 76 30 100 30Z" fill={NIGHT} {...INK} />
      <ellipse cx="100" cy="62" rx="19" ry="23" fill={`url(#${face})`} />
      <Gaze still={still}>
        {happy ? (
          <path d="M87 64Q92 56 97 63M103 63Q108 56 113 64" {...LINE} stroke={c2} strokeWidth="3.4" />
        ) : (
          <path d="M86 56L98 62L96 67L88 64ZM114 56L102 62L104 67L112 64Z" fill="#fff" stroke={c2} strokeWidth="1.6" strokeLinejoin="round" />
        )}
      </Gaze>
      {/* crown */}
      <g className={hover(still)}>
        <path d="M70 36L66 8L80 22L88 2L100 20L112 2L120 22L134 8L130 36Q100 26 70 36Z" fill={`url(#${crown})`} {...INK} />
        <path d="M100 34L95 26L100 18L105 26Z" fill={c2} {...THIN} />
      </g>
    </g>
  );
};

// ─── 39 Genesis ─────────────────────────────────────────────────────────────

/** A tapered spiral arm around the origin. */
const spiral = (rot: number, w: number) => {
  const out: string[] = [];
  const back: string[] = [];
  range(25).forEach((i) => {
    const t = i / 24;
    const a = rot + t * 330;
    const r = 4 + t * 64;
    const h = w * (1 - t) ** 0.7 * Math.min(1, t * 6);
    out.push(polar(r + h, a).map((n) => n.toFixed(1)).join(' '));
    back.unshift(polar(r - h, a).map((n) => n.toFixed(1)).join(' '));
  });
  return `M${out.join('L')}L${back.join('L')}Z`;
};
const ARMS = [0, 120, 240].map((r) => [spiral(r, 9), spiral(r, 3.2)]);

const EGG = 'M100 16C136 16 162 70 162 112C162 154 134 180 100 180C66 180 38 154 38 112C38 70 64 16 100 16Z';

const Genesis: Art = ({ c, c2, uid, still, happy }) => {
  const shell = `${uid}ea`;
  const egg = `${uid}eb`;
  const cap = `${uid}ec`;
  const cup = `${uid}ed`;
  const burst = `${uid}ee`;
  const core = `${uid}ef`;
  const capEdge = 'M30 66L52 76L64 58L80 74L94 54L110 76L124 58L140 76L170 62';
  const cupEdge = 'M30 136L50 126L66 142L84 128L100 146L118 128L134 142L150 126L172 136';
  return (
    <g>
      <defs>
        <linearGradient id={shell} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor={mix(c2, 86, '#fff')} />
          <stop offset="1" stopColor={mix(c, 40, c2)} />
        </linearGradient>
        <clipPath id={egg}>
          <path d={EGG} />
        </clipPath>
        <clipPath id={cap}>
          <path d={`${capEdge}V0H30Z`} />
        </clipPath>
        <clipPath id={cup}>
          <path d={`${cupEdge}V200H30Z`} />
        </clipPath>
        <Glow id={burst} stops={[[0, c2, 1], [0.45, c, 0.55], [1, c, 0]]} />
        <Glow id={core} stops={[[0, '#fff', 1], [0.5, c2, 1], [1, c2, 0]]} />
      </defs>
      <Shadow rx={50} />
      {/* light breaking out */}
      <circle cx="100" cy="100" r="100" fill={`url(#${burst})`} />
      <g transform="translate(100 100)">
        <g {...mo(still, 'bf-rot', 60)}>
          {range(14).map((i) => (
            <path key={i} d="M-4 -56L0 -104L4 -56Z" fill={c2} stroke="var(--fg)" strokeWidth="1.2" transform={`rotate(${i * (360 / 14)})`} opacity=".95" />
          ))}
        </g>
      </g>
      <path d={EGG} fill={NIGHT} {...INK} />
      {/* the galaxy inside */}
      <g clipPath={`url(#${egg})`}>
      <g transform="translate(100 100) scale(1 .7) rotate(-14)">
        <g {...mo(still, 'bf-rot', 18)}>
          {ARMS.map(([wide, thin]) => (
            <g key={wide}>
              <path d={wide} fill={c} />
              <path d={thin} fill={c2} />
            </g>
          ))}
          {range(30).map((i) => {
            const [x, y] = polar(10 + rnd(i) * 52, rnd(i + 30) * 360);
            return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i + 60)} fill="#fff" />;
          })}
        </g>
      </g>
      </g>
      <circle cx="100" cy="100" r="22" fill={`url(#${core})`} {...mo(still, 'bf-fade', 2.4)} />
      {/* the cup and the lifted cap */}
      <g clipPath={`url(#${cup})`}>
        <path d={EGG} fill={`url(#${shell})`} {...INK} />
      </g>
      <g clipPath={`url(#${egg})`}>
        <path d={cupEdge} {...LINE} {...INK} fill="none" />
      </g>
      <path d="M66 142L72 156L64 166M118 128L124 148L136 156M100 146L98 162" {...LINE} stroke={c} strokeWidth="2.5" />
      <g transform="translate(-4 -12) rotate(-9 100 60)">
        <g clipPath={`url(#${cap})`}>
          <path d={EGG} fill={`url(#${shell})`} {...INK} />
        </g>
        <g clipPath={`url(#${egg})`}>
          <path d={capEdge} {...LINE} {...INK} fill="none" />
        </g>
        <path d="M80 74L84 58L76 44M124 58L120 46L128 34" {...LINE} stroke={c} strokeWidth="2.5" />
      </g>
      {/* shell shards drifting off */}
      <g {...mo(still, 'bf-bob', 3.4)}>
        <path d="M18 92L34 82L38 100L24 108Z" fill={`url(#${shell})`} {...INK} />
      </g>
      <g {...mo(still, 'bf-bob', 4.2, 0.7, { '--bf-bob': '5px' })}>
        <path d="M176 96L190 88L188 108L174 112Z" fill={`url(#${shell})`} {...INK} />
      </g>
      <Gaze still={still}>
        {happy ? (
          <path d="M84 104Q100 88 116 104" {...LINE} stroke={NIGHT} strokeWidth="4.500" />
        ) : (
          <>
            <path d="M80 100Q100 84 120 100Q100 116 80 100Z" fill={NIGHT} stroke="#fff" strokeWidth="2.2" />
            <circle cx="100" cy="100" r="7" fill={c2} />
          </>
        )}
      </Gaze>
    </g>
  );
};

// ─── 40 Origin ──────────────────────────────────────────────────────────────

const Origin: Art = ({ c, c2, uid, still, happy }) => {
  const glow = `${uid}ia`;
  const ray = `${uid}ib`;
  const petal = `${uid}ic`;
  const heart = `${uid}id`;
  const field = `${uid}ie`;
  const inner = `${uid}if`;
  const INK2 = '#1a1206';
  const CORE = '#f2541b';
  const deep = mix(c, 62, '#7c2d12');
  return (
    <g>
      <defs>
        <Glow id={glow} stops={[[0, c2, 1], [0.5, c, 0.8], [0.78, c, 0.22], [1, c, 0]]} />
        <linearGradient id={ray} gradientUnits="userSpaceOnUse" x1="0" y1="-62" x2="0" y2="-112">
          <stop offset="0" stopColor={c2} />
          <stop offset=".35" stopColor={c} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={petal} gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-60">
          <stop offset="0" stopColor={deep} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={inner} gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="-44">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <Glow id={field} stops={[[0, dark(c, 46), 1], [0.7, dark(c, 28), 1], [1, dark(c, 12), 1]]} />
        <Glow id={heart} stops={[[0, '#fff', 1], [0.62, c2, 1], [0.86, c, 1], [1, deep, 1]]} />
      </defs>
      <circle cx="100" cy="100" r="116" fill={`url(#${glow})`} {...mo(still, 'bf-fade', 6)} />
      <g transform="translate(100 100)">
        {/* rays, long and short */}
        <g {...mo(still, 'bf-rot', 80)}>
          {range(16).map((i) => (
            <path key={i} d="M-5 -62L0 -92L5 -62Z" fill={c2} stroke="var(--fg)" strokeWidth="1.4" strokeLinejoin="round" transform={`rotate(${(i + 0.5) * 22.5})`} />
          ))}
          {range(16).map((i) => (
            <path key={i} d={i % 2 ? 'M-9 -60C-6 -80 -3 -92 0 -104C3 -92 6 -80 9 -60Z' : 'M-10 -60C-6 -84 -3 -100 0 -118C3 -100 6 -84 10 -60Z'} fill={`url(#${ray})`} stroke="var(--fg)" strokeWidth="1.8" strokeLinejoin="round" transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        {/* a dark field for the gold to sit on */}
        <circle r="67" fill={`url(#${field})`} stroke="var(--fg)" strokeWidth="3" />
        {range(24).map((i) => {
          const [x, y] = polar(62, i * 15 + 7.5);
          return <circle key={i} cx={x} cy={y} r="1" fill={c2} opacity=".8" />;
        })}
        {/* lotus, outer then inner */}
        <g {...mo(still, 'bf-rot bf-rev', 54)}>
          {range(16).map((i) => (
            <path key={i} d="M0 -28C14 -38 15 -50 0 -60C-15 -50 -14 -38 0 -28Z" fill={`url(#${petal})`} stroke={c2} strokeWidth="1.3" strokeLinejoin="round" transform={`rotate(${i * 22.5})`} />
          ))}
          {range(16).map((i) => (
            <path key={i} d="M0 -34V-54" stroke={deep} strokeWidth="1" transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        <g {...mo(still, 'bf-rot', 36)}>
          {range(12).map((i) => (
            <path key={i} d="M0 -22C10 -28 10 -38 0 -46C-10 -38 -10 -28 0 -22Z" fill={`url(#${inner})`} stroke={dark(c, 40)} strokeWidth="1.5" strokeLinejoin="round" transform={`rotate(${i * 30 + 15})`} />
          ))}
        </g>
        {/* a bead for every form it has been; the first is the Core's own colour */}
        <circle r="67" fill="none" stroke={c} strokeWidth="5" />
        <g {...mo(still, 'bf-rot bf-rev', 110)}>
          {range(40).map((i) => {
            const [x, y] = polar(67, i * 9);
            return <circle key={i} cx={x} cy={y} r={i === 0 ? 4 : 2.1} fill={i === 0 ? CORE : c2} stroke={INK2} strokeWidth=".8" />;
          })}
        </g>
        {/* the small, calm centre */}
        <circle r="28" fill={`url(#${heart})`} stroke={INK2} strokeWidth="2" />
        <circle r="66" fill="none" stroke={c2} strokeWidth="3" {...mo(still, 'bf-ping', 6)} />
      </g>
      {/* the original Core */}
      <g {...mo(still, 'bf-bob', 5, 0, { '--bf-bob': '-2px' })}>
        <circle cx="100" cy="100" r="19" fill="#fff" stroke={INK2} strokeWidth="3.2" />
        <path d="M87 91A16 16 0 0 1 113 91" fill="none" stroke={mix(CORE, 26, '#fff')} strokeWidth="2.2" />
        <rect x="88" y="94" width="24" height="12" rx="6" fill={INK2} />
        <Gaze still={still}>
          {happy ? <path d="M93 102Q100 95 107 102" {...LINE} stroke={CORE} strokeWidth="3" /> : <rect x="92" y="97" width="16" height="6" rx="3" fill={CORE} />}
        </Gaze>
      </g>
    </g>
  );
};

export const FORMS: BotRegistry = {
  vanguard: { Art: Vanguard, head: { x: 100, y: 36, s: 0.56 } },
  musha: { Art: Musha, head: { x: 100, y: 28, s: 0.8 } },
  kaiju: { Art: Kaiju, head: { x: 56, y: 36, s: 0.9 } },
  leviathan: { Art: Leviathan, head: { x: 62, y: 30, s: 0.85 } },
  valkyrie: { Art: Valkyrie, head: { x: 100, y: 10, s: 0.4 } },
  stormbringer: { Art: Stormbringer, head: { x: 100, y: 12, s: 1.2 } },
  magma: { Art: Magma, head: { x: 100, y: 44, s: 0.85 } },
  glacier: { Art: Glacier, head: { x: 100, y: 26, s: 0.7 } },
  verdant: { Art: Verdant, head: { x: 100, y: 0, s: 1 } },
  ophanim: { Art: Ophanim, head: { x: 100, y: 65, s: 1.1 } },
  seraph: { Art: Seraph, head: { x: 100, y: 52, s: 0.62 } },
  nebula: { Art: Nebula, head: { x: 100, y: 26, s: 0.66 } },
  pulsar: { Art: Pulsar, head: { x: 100, y: 62, s: 1.2 } },
  quasar: { Art: Quasar, head: { x: 100, y: 68, s: 1 } },
  chronos: { Art: Chronos, head: { x: 100, y: 20, s: 0.72 } },
  paradox: { Art: Paradox, head: { x: 100, y: 24, s: 0.55 } },
  cipher: { Art: Cipher, head: { x: 103, y: 19, s: 0.92 } },
  voidemperor: { Art: VoidEmperor, head: { x: 100, y: 4, s: 1.1 } },
  genesis: { Art: Genesis, head: { x: 96, y: 4, s: 1 } },
  origin: { Art: Origin, head: { x: 100, y: 81, s: 0.62 } },
};
