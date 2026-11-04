import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisEvent.css';

/** The event set: eight seasonal bodies, the prizes of the festival events. */

const ST = { stroke: 'var(--fg)', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const THIN = { stroke: 'var(--fg)', strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
/** Ink for faces: stays dark in both themes, because the faces sit on coloured bodies. */
const INK = '#1c1420';
const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
const anim = (still: boolean, cls: string) => (still ? undefined : cls);

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={anim(still, 'i-blink')}>{children}</g>
    </g>
  );
}

function Shadow({ rx }: { rx: number }) {
  return <ellipse cx="100" cy="187" rx={rx} ry="5" fill="var(--fg)" opacity=".13" />;
}

function Bolt({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--surf-2)" {...THIN} />
      <path d={`M${x - r * 0.6} ${y}h${r * 1.2}`} stroke="var(--fg)" strokeWidth="1.1" />
    </g>
  );
}

/** A particle: sits at x, y; when animated it runs `cls` from a staggered start. */
function Drift({ x, y, i, cls, still, children }: { x: number; y: number; i: number; cls: string; still: boolean; children: ReactNode }) {
  const style: CSSProperties | undefined = still ? undefined : { animationDelay: `${-i * 0.73}s` };
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={anim(still, cls)} style={style}>
        {children}
      </g>
    </g>
  );
}

function Glow({ id, c, c2, cy = 90, r = 96 }: { id: string; c: string; c2: string; cy?: number; r?: number }) {
  return (
    <>
      <radialGradient id={id}>
        <stop offset="0" stopColor={c2} stopOpacity=".5" />
        <stop offset=".6" stopColor={c} stopOpacity=".22" />
        <stop offset="1" stopColor={c} stopOpacity="0" />
      </radialGradient>
      <circle cx="100" cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

// Half a momiji leaf, tip to stem, on a unit radius.
const LEAF: [number, number][] = [
  [0, -1], [0.17, -0.6], [0.2, -0.38], [0.46, -0.56], [0.74, -0.74], [0.66, -0.36], [0.5, -0.14], [0.78, -0.12], [1, 0.1], [0.72, 0.24], [0.46, 0.22], [0.6, 0.42], [0.66, 0.66], [0.38, 0.54], [0.16, 0.38], [0.05, 0.5],
];
const leafD = (r: number) => {
  const right = LEAF.map(([x, y]) => `${(x * r).toFixed(1)} ${(y * r).toFixed(1)}`);
  const left = LEAF.slice(1).reverse().map(([x, y]) => `${(-x * r).toFixed(1)} ${(y * r).toFixed(1)}`);
  return `M${right.join('L')}L${left.join('L')}Z`;
};

function Leaf({ x, y, r, rot = 0, fill, sw = 1.8 }: { x: number; y: number; r: number; rot?: number; fill: string; sw?: number }) {
  return <path d={leafD(r)} transform={`translate(${x} ${y}) rotate(${rot})`} fill={fill} {...THIN} strokeWidth={sw} />;
}

const PETAL = 'M0 7C-7 3-7-5-2-7L0-5 2-7C7-5 7 3 0 7Z';

function Blossom({ x, y, r, fill, core, sw = 1.6 }: { x: number; y: number; r: number; fill: string; core: string; sw?: number }) {
  const k = r / 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M0-1C-9-4-9-12-2.4-14.5L0-12 2.4-14.5C9-12 9-4 0-1Z" transform={`rotate(${a})`} fill={fill} {...THIN} strokeWidth={sw / k} />
      ))}
      <circle r="3.4" fill={core} {...THIN} strokeWidth={sw / k} />
    </g>
  );
}

/** Mitsudomoe, the three-comma drum crest. */
function Tomoe({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`} fill={fill}>
      {[0, 120, 240].map((a) => (
        <path key={a} d="M0-.08C.1-.3.5-.3.52-.62.5-.9.1-.98-.2-.86-.5-.72-.5-.3-.28-.14-.18-.06-.07-.04 0-.08Z" transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

function Kodama({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const leaf = `${uid}-kl`;
  const wood = mix(c2, 30, '#b5834f');
  return (
    <g>
      <defs>
        <linearGradient id={leaf} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 62, c2)} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 72, '#2a0008')} />
        </linearGradient>
      </defs>
      {mk === 3 && <Glow id={`${uid}-kg`} c={c} c2={c2} cy={84} />}
      <Shadow rx={32} />
      <g className={anim(still, 'i-hover')}>
        {/* twig legs and peg body */}
        <path d="M90 158V178M110 158V178" stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
        <path d="M90 158V177M110 158V177" stroke={wood} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M84 134L60 150M60 150L50 146M60 150L54 160M116 134L140 150M140 150L150 146M140 150L146 160" stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
        <path d="M84 134L60 150M60 150L50 146M60 150L54 160M116 134L140 150M140 150L150 146M140 150L146 160" stroke={wood} strokeWidth="3" strokeLinecap="round" />
        <path d="M86 116C78 134 78 152 84 164H116C122 152 122 134 114 116Z" fill={wood} {...ST} />
        <path d="M81 146H119" {...THIN} fill="none" />
        <Leaf x={100} y={131} r={10} fill={c} sw={1.5} />
        <Bolt x={89} y={155} r={2.2} />
        <Bolt x={111} y={155} r={2.2} />
        <g className={anim(still, 'bce-rattle')}>
          <rect x="95" y="104" width="10" height="16" fill={mix(c, 60, '#2a0008')} {...THIN} />
          <path d={leafD(58)} transform="translate(100 78)" fill={`url(#${leaf})`} {...ST} strokeWidth={3.5} />
          <path d="M100 56V30M72 56L62 44M128 56L138 44M72 86L48 84M128 86L152 84M86 98L68 112M114 98L132 112" fill="none" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
          <Bolt x={100} y={100} r={3} />
          <Eyes still={still}>
            {happy ? (
              <path d="M74 80Q84 66 94 80M106 80Q116 66 126 80" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="83" cy="75" rx="10.5" ry="12.5" fill={INK} />
                <ellipse cx="117" cy="75" rx="10.5" ry="12.5" fill={INK} />
                <circle cx="87" cy="70" r="3.6" fill={c2} />
                <circle cx="121" cy="70" r="3.6" fill={c2} />
                <circle cx="80" cy="80" r="1.6" fill={c2} />
                <circle cx="114" cy="80" r="1.6" fill={c2} />
              </>
            )}
          </Eyes>
          <ellipse cx="100" cy="90" rx="3.5" ry="4.5" fill={INK} />
          {mk >= 2 && (
            <>
              <Leaf x={68} y={42} r={17} rot={-34} fill={c} />
              <Leaf x={132} y={42} r={17} rot={34} fill={c} />
              <Leaf x={84} y={30} r={18} rot={-16} fill={mix(c, 80, c2)} />
              <Leaf x={116} y={30} r={18} rot={16} fill={mix(c, 80, c2)} />
              <Leaf x={100} y={24} r={20} fill={c} />
              <path d="M62 60Q100 40 138 60" fill="none" stroke="var(--fg)" strokeWidth="8" strokeLinecap="round" />
              <path d="M62 60Q100 40 138 60" fill="none" stroke={c2} strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="100" cy="50" r="4" fill={c} {...THIN} />
            </>
          )}
        </g>
        {mk === 3 && (
          <g>
            {/* shimenawa collar and shrine bell */}
            <path d="M78 118Q100 130 122 118" fill="none" stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
            <path d="M78 118Q100 130 122 118" fill="none" stroke="#f7efe0" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M78 118Q100 130 122 118" fill="none" stroke={c} strokeWidth="5.5" strokeDasharray="4 5" />
            <g className={anim(still, 'bce-ring')}>
              <path d="M100 124V128" stroke="var(--fg)" strokeWidth="3" />
              <circle cx="100" cy="141" r="14.5" fill={c2} {...ST} />
              <path d="M90 134Q95 129 101 130" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
              <path d="M86.5 143H113.5" {...THIN} />
              <path d="M100 145V153" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="100" cy="148" r="2.8" fill={INK} />
            </g>
          </g>
        )}
      </g>
      {mk === 3 &&
        [
          [18, 34, 11], [40, 92, 9], [24, 142, 10], [176, 30, 10], [160, 96, 8], [182, 134, 11], [150, 8, 8], [52, 10, 9],
        ].map(([x, y, r], i) => (
          <Drift key={i} x={x} y={y} i={i} cls="bce-fall" still={still}>
            <Leaf x={0} y={0} r={r} rot={i * 47} fill={i % 3 === 1 ? c2 : c} sw={1.5} />
          </Drift>
        ))}
    </g>
  );
}

function Flake({ r, c }: { r: number; c: string }) {
  const d = `M0 ${-r}V${r}M${-r * 0.87} ${-r / 2}L${r * 0.87} ${r / 2}M${-r * 0.87} ${r / 2}L${r * 0.87} ${-r / 2}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="var(--fg)" strokeWidth="3.4" />
      <path d={d} stroke={c} strokeWidth="1.6" />
    </g>
  );
}

function Yukidaruma({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const snow = `${uid}-ys`;
  const pail = `${uid}-yp`;
  const ice = `${uid}-yi`;
  return (
    <g>
      <defs>
        <radialGradient id={snow} cx="38%" cy="28%" r="82%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".62" stopColor={mix(c, 60, '#fff')} />
          <stop offset="1" stopColor={mix(c, 78, '#3f6f96')} />
        </radialGradient>
        <linearGradient id={pail} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(c2, 72, '#fff')} />
          <stop offset=".45" stopColor={c2} />
          <stop offset="1" stopColor={mix(c2, 68, '#300')} />
        </linearGradient>
        <linearGradient id={ice} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      {mk === 3 && <Glow id={`${uid}-yg`} c={c} c2={c} cy={92} />}
      <Shadow rx={42} />
      <g className={anim(still, 'i-hover')}>
        {mk >= 2 && (
          <g>
            <path d="M156 62L150 152" stroke="var(--fg)" strokeWidth="8" strokeLinecap="round" />
            <path d="M156 62L150 152" stroke="#b5834f" strokeWidth="4" strokeLinecap="round" />
            <path d="M143 150L126 184L140 180L144 186L152 180L160 186L164 179L176 182L157 151Z" fill={mix(c2, 22, '#c9a15f')} {...ST} />
            <path d="M149 158L140 178M151 158L152 180M153 158L164 178" {...THIN} fill="none" />
            <rect x="141" y="147" width="18" height="7" rx="2" fill={c2} {...THIN} />
          </g>
        )}
        <circle cx="52" cy="134" r="10" fill={c2} {...ST} />
        <circle cx="148" cy="134" r="10" fill={c2} {...ST} />
        <circle cx="100" cy="139" r="43" fill={`url(#${snow})`} {...ST} strokeWidth={3.5} />
        <path d="M58 134Q100 150 142 134" fill="none" {...THIN} opacity=".65" />
        <Bolt x={100} y={124} r={3.6} />
        <Bolt x={100} y={150} r={3.6} />
        <Bolt x={100} y={169} r={3.2} />
        <circle cx="100" cy="86" r="32" fill={`url(#${snow})`} {...ST} strokeWidth={3.5} />
        <circle cx="79" cy="96" r="6" fill={c2} opacity=".42" />
        <circle cx="121" cy="96" r="6" fill={c2} opacity=".42" />
        <Eyes still={still}>
          {happy ? (
            <path d="M80 87Q87 77 94 87M106 87Q113 77 120 87" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="87" cy="84" r="6.2" fill={INK} />
              <circle cx="113" cy="84" r="6.2" fill={INK} />
              <circle cx="89" cy="82" r="1.9" fill="#fff" />
              <circle cx="115" cy="82" r="1.9" fill="#fff" />
            </>
          )}
        </Eyes>
        <path d={happy ? 'M92 97Q100 106 108 97' : 'M93 99h3M99 101h3M105 99h3'} fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        {mk >= 2 && (
          <g>
            <path d="M113 116L132 118L137 158L114 156Z" fill={c2} {...ST} />
            <path d="M115 130L134 132M116 142L135 144" stroke="#fff" strokeWidth="3" opacity=".85" />
            <path d="M118 157V163M125 158V164M132 158V164" {...THIN} />
            <path d="M71 106Q100 122 129 106L132 118Q100 136 68 118Z" fill={c2} {...ST} />
            <path d="M76 114Q100 127 124 114" fill="none" stroke="#fff" strokeWidth="2.6" opacity=".85" />
          </g>
        )}
        <g transform="rotate(-5 100 60)">
          <g className={anim(still, 'bce-tip')}>
            <path d="M76 62L83 32H117L124 62Z" fill={`url(#${pail})`} {...ST} />
            <path d="M80 46H120" {...THIN} />
            <rect x="69" y="57" width="62" height="9" rx="4.5" fill={`url(#${pail})`} {...ST} />
            <path d="M131 62C148 70 144 88 133 92" fill="none" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
            <Bolt x={88} y={53} r={2} />
            <Bolt x={112} y={53} r={2} />
            {mk < 3 && (
              <>
                <path d="M100 32V20" stroke="var(--fg)" strokeWidth="3" />
                <circle cx="100" cy="17" r="4.2" fill={c} {...THIN} className={anim(still, 'i-pulse')} />
              </>
            )}
            {mk === 3 && (
              <>
                <path d="M78 38L70 12L85 24L91 2L100 20L109 2L115 24L130 12L122 38Q100 46 78 38Z" fill={`url(#${ice})`} {...ST} />
                <path d="M85 24L88 38M91 2L96 36M109 2L104 36M115 24L112 38" stroke={c} strokeWidth="1.6" opacity=".9" />
                <circle cx="100" cy="35" r="4.4" fill={c2} {...THIN} />
              </>
            )}
          </g>
        </g>
      </g>
      {mk === 3 && (
        <g>
          {[
            [12, 40, 'M0 0q18 -8 36 0'], [156, 58, 'M0 0q18 -8 36 0'], [4, 104, 'M0 0q16 7 32 0'], [162, 118, 'M0 0q16 7 32 0'],
          ].map(([x, y, d], i) => (
            <Drift key={i} x={x as number} y={y as number} i={i} cls="bce-wind" still={still}>
              <path d={d as string} fill="none" stroke={mix(c, 70, 'var(--fg)')} strokeWidth="3" strokeLinecap="round" />
            </Drift>
          ))}
          {[
            [24, 20, 8], [52, 62, 6], [14, 76, 6], [28, 124, 7], [174, 22, 8], [146, 8, 5], [184, 84, 7], [170, 148, 6], [18, 166, 6], [186, 174, 5],
          ].map(([x, y, r], i) => (
            <Drift key={i} x={x} y={y} i={i} cls="bce-snow" still={still}>
              <Flake r={r} c={c} />
            </Drift>
          ))}
        </g>
      )}
    </g>
  );
}

function Oni({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const skin = `${uid}-os`;
  const horn = `${uid}-oh`;
  const hair = mix(c, 22, '#1d1320');
  const drums = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      <defs>
        <linearGradient id={skin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 82, '#fff')} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 70, '#200')} />
        </linearGradient>
        <linearGradient id={horn} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c2, 60, '#fff')} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      {mk === 3 && <Glow id={`${uid}-og`} c={c} c2={c2} cy={92} />}
      {mk === 3 && (
        <g className={anim(still, 'i-spin i-spin--slow')}>
          <circle cx="100" cy="92" r="84" fill="none" stroke="var(--fg)" strokeWidth="5" />
          <circle cx="100" cy="92" r="84" fill="none" stroke={c2} strokeWidth="2" />
          {drums.map((a, i) => (
            <g key={a} transform={`rotate(${a} 100 92) translate(100 8)`}>
              <circle r="14.5" fill={c} {...ST} />
              <circle r="10.5" fill={mix(c2, 16, '#fff')} {...THIN} />
              <g transform={`rotate(${i * 30})`}>
                <Tomoe x={0} y={0} r={9} fill={c} />
              </g>
            </g>
          ))}
        </g>
      )}
      <Shadow rx={46} />
      <g className={anim(still, 'i-hover')}>
        <rect x="70" y="150" width="24" height="26" rx="5" fill={`url(#${skin})`} {...ST} />
        <rect x="106" y="150" width="24" height="26" rx="5" fill={`url(#${skin})`} {...ST} />
        <path d="M66 182Q66 172 74 172H92Q98 172 98 182ZM102 182Q102 172 108 172H126Q134 172 134 182Z" fill="var(--surf-2)" {...ST} />
        {mk >= 2 && (
          <g transform="rotate(9 158 150)">
            <rect x="153" y="118" width="10" height="56" rx="3" fill={mix(c2, 30, '#6d6470')} {...ST} />
            <path d="M149 120L143 26Q158 10 173 26L167 120Z" fill={mix(c, 18, '#3b3440')} {...ST} strokeWidth={3.5} />
            {[34, 54, 74, 94, 110].map((y, i) => (
              <g key={y}>
                <path d={`M${146 + y * 0.03} ${y + 5}L${135 + y * 0.03} ${y}L${146 + y * 0.03} ${y - 5}Z`} fill={c2} {...THIN} />
                <path d={`M${170 - y * 0.03} ${y + 5}L${181 - y * 0.03} ${y}L${170 - y * 0.03} ${y - 5}Z`} fill={c2} {...THIN} />
                <circle cx="158" cy={y} r="3.6" fill={c2} {...THIN} transform={`translate(${i % 2 ? 4 : -4} 0)`} />
              </g>
            ))}
            <path d="M158 12L153 22H163Z" fill={c2} {...THIN} />
          </g>
        )}
        {/* arms */}
        <path d="M66 112C46 116 38 134 42 152" fill="none" stroke="var(--fg)" strokeWidth="23" strokeLinecap="round" />
        <path d="M66 112C46 116 38 134 42 152" fill="none" stroke={c} strokeWidth="17" strokeLinecap="round" />
        <path d="M134 112C154 116 158 132 156 148" fill="none" stroke="var(--fg)" strokeWidth="23" strokeLinecap="round" />
        <path d="M134 112C154 116 158 132 156 148" fill="none" stroke={c} strokeWidth="17" strokeLinecap="round" />
        <circle cx="42" cy="156" r="11" fill="var(--surf-2)" {...ST} />
        <circle cx="157" cy="152" r="11" fill="var(--surf-2)" {...ST} />
        <path d="M62 106Q100 94 138 106L132 158H68Z" fill={`url(#${skin})`} {...ST} strokeWidth={3.5} />
        <path d="M100 112V140" {...THIN} opacity=".6" />
        <path d="M78 122Q88 128 97 122M103 122Q112 128 122 122" fill="none" {...THIN} opacity=".7" />
        {mk < 3 ? (
          <>
            <rect x="66" y="144" width="68" height="13" rx="3" fill={INK} {...ST} />
            <rect x="92" y="144" width="16" height="13" rx="2" fill={c2} {...THIN} />
          </>
        ) : (
          <>
            <path d="M64 142H136L139 164L128 158L120 170L110 160L100 172L90 160L80 170L72 158L61 164Z" fill={c2} {...ST} />
            <path d="M74 144L72 156M88 144L84 164M102 144L100 168M116 144L118 164M128 144L130 156" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="150" r="6.5" fill={c} {...THIN} />
          </>
        )}
        {/* horns */}
        <path d="M78 52C66 44 58 26 62 6C72 18 88 28 94 44Z" fill={`url(#${horn})`} {...ST} />
        <path d="M122 52C134 44 142 26 138 6C128 18 112 28 106 44Z" fill={`url(#${horn})`} {...ST} />
        <path d="M66 26L79 22M72 38L86 32M134 26L121 22M128 38L114 32" stroke={INK} strokeWidth="2.6" strokeLinecap="round" opacity=".75" />
        {/* head */}
        <rect x="60" y="42" width="80" height="66" rx="20" fill={`url(#${skin})`} {...ST} strokeWidth={3.5} />
        <circle cx="57" cy="76" r="7" fill={c2} {...THIN} />
        <circle cx="143" cy="76" r="7" fill={c2} {...THIN} />
        <path d="M58 58C58 40 80 34 100 34C120 34 142 40 142 58L130 52L124 62L112 52L100 62L88 52L76 62L70 52Z" fill={hair} {...ST} />
        <path d="M64 92H136" {...THIN} opacity=".55" />
        <Bolt x={67} y={98} r={2.4} />
        <Bolt x={133} y={98} r={2.4} />
        <Eyes still={still}>
          {happy ? (
            <path d="M70 76Q81 62 92 76M108 76Q119 62 130 76" fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
          ) : (
            <>
              <path d="M69 64L93 72V82Q80 86 72 78Z" fill={INK} />
              <path d="M131 64L107 72V82Q120 86 128 78Z" fill={INK} />
              <circle cx="83" cy="75" r="4.6" fill={c2} />
              <circle cx="117" cy="75" r="4.6" fill={c2} />
            </>
          )}
        </Eyes>
        {!happy && <path d="M66 60L94 69M134 60L106 69" stroke={hair} strokeWidth="6.5" strokeLinecap="round" />}
        <path d={happy ? 'M74 86H126Q124 104 100 104Q76 104 74 86Z' : 'M76 88H124V100Q100 94 76 100Z'} fill={INK} {...THIN} />
        <path d={happy ? 'M80 86L84 96L89 86ZM111 86L116 96L120 86Z' : 'M81 98L84 84L90 96ZM119 98L116 84L110 96Z'} fill="#fff" {...THIN} strokeWidth={1.2} />
      </g>
      <Drift x={40} y={52} i={0} cls="bce-bean" still={still}>
        <ellipse rx="6.5" ry="5" fill={mix(c2, 45, '#f4e7c3')} {...THIN} transform="rotate(-25)" />
        <path d="M-2-1.5q2 1.5 4 0" fill="none" stroke={INK} strokeWidth="1" />
      </Drift>
      {mk === 3 &&
        [
          [28, 28, 0], [172, 180, 1], [176, 26, 2], [24, 174, 3],
        ].map(([x, y, i]) => (
          <Drift key={i} x={x} y={y} i={i * 1.1} cls="bce-spark" still={still}>
            <path d="M3-12L-6 1H-1L-4 12L6-3H1Z" fill={c2} {...THIN} />
          </Drift>
        ))}
    </g>
  );
}

function Sakurei({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const pet = `${uid}-sp`;
  const hair = mix(c, 26, '#23101f');
  const skin = mix(c, 8, '#fffaf5');
  return (
    <g>
      <defs>
        <linearGradient id={pet} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 45, '#b0245f')} />
          <stop offset=".55" stopColor={mix(c, 80, '#d43d7c')} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <radialGradient id={`${uid}-sl`}>
          <stop offset="0" stopColor="#ffc14d" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffc14d" stopOpacity="0" />
        </radialGradient>
      </defs>
      {mk === 3 && (
        <>
          <Glow id={`${uid}-sg`} c={c} c2={c2} cy={88} />
          <g className={anim(still, 'bce-halo')} opacity=".72">
            <circle cx="100" cy="74" r="76" fill="none" />
            <g transform="translate(100 74)">
              {[0, 72, 144, 216, 288].map((a) => (
                <path key={a} d="M0-6C-34-20-34-58-8-74L0-64 8-74C34-58 34-20 0-6Z" transform={`rotate(${a})`} fill={c} stroke={c2} strokeWidth="2" />
              ))}
            </g>
          </g>
        </>
      )}
      <Shadow rx={46} />
      <g className={anim(still, 'i-hover')}>
        {/* the hakama is an upside-down blossom */}
        {[-54, 54, -27, 27, 0].map((a) => (
          <path key={a} d="M0-6C-24 14-27 56-11 80L0 70 11 80C27 56 24 14 0-6Z" transform={`translate(100 102) rotate(${a})`} fill={`url(#${pet})`} {...ST} />
        ))}
        <path d="M100 112V162M100 112L84 154M100 112L116 154" stroke={mix(c, 55, '#7a1f4a')} strokeWidth="1.6" opacity=".7" />
        {/* long hair, behind */}
        <path d="M76 56C74 28 126 28 124 56L128 96Q116 104 112 92H88Q84 104 72 96Z" fill={hair} {...ST} />
        {/* paper sleeves */}
        {[-1, 1].map((d) => (
          <g key={d} className={anim(still, 'bce-flap')} style={still ? undefined : ({ transformOrigin: `${100 + d * 14}px 90px`, '--bce-a': `${-d * 7}deg`, animationDelay: d < 0 ? '0s' : '-1.2s' } as CSSProperties)}>
            <path d={`M${100 + d * 12} 84L${100 + d * 56} 96L${100 + d * 58} 130L${100 + d * 34} 136L${100 + d * 26} 114L${100 + d * 10} 106Z`} fill={c2} {...ST} />
            <path d={`M${100 + d * 34} 136L${100 + d * 26} 114L${100 + d * 58} 130Z`} fill={c} {...THIN} />
            <path d={`M${100 + d * 56} 96L${100 + d * 26} 114`} {...THIN} opacity=".5" />
            <circle cx={100 + d * 48} cy={102} r="2" fill={c} {...THIN} strokeWidth={1.2} />
          </g>
        ))}
        {/* kosode and obi */}
        <path d="M86 84H114L118 106H82Z" fill={c2} {...ST} />
        <path d="M90 84L100 100L110 84" fill="none" stroke={c} strokeWidth="3" />
        <rect x="80" y="100" width="40" height="11" rx="2" fill={mix(c, 60, '#7a1f4a')} {...ST} />
        <Bolt x={100} y={105.5} r={3} />
        {/* antenna and flower */}
        <path d="M100 42V26" stroke="var(--fg)" strokeWidth="3" />
        <Blossom x={100} y={22} r={16} fill={c} core={c2} />
        {/* face */}
        <ellipse cx="100" cy="64" rx="21" ry="23" fill={skin} {...ST} />
        <path d="M78 62C76 34 124 34 122 62L116 52L108 58L100 50L92 58L84 52Z" fill={hair} {...ST} />
        <path d="M78 50L74 56L80 60M122 50L126 56L120 60" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <circle cx="86" cy="74" r="4" fill={c} opacity=".65" />
        <circle cx="114" cy="74" r="4" fill={c} opacity=".65" />
        <Eyes still={still}>
          {happy ? (
            <path d="M84 69Q90 61 96 69M104 69Q110 61 116 69" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="90" cy="67" rx="3.6" ry="5.2" fill={INK} />
              <ellipse cx="110" cy="67" rx="3.6" ry="5.2" fill={INK} />
            </>
          )}
        </Eyes>
        <path d="M97 78Q100 81 103 78" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        {mk >= 2 &&
          [-1, 1].map((d) => (
            <g key={d} className={anim(still, 'bce-pin')} style={still ? undefined : { transformOrigin: `${100 + d * 33}px 44px`, animationDelay: d < 0 ? '0s' : '-.9s' }}>
              <path d={`M${100 + d * 33} 44V94`} stroke="var(--fg)" strokeWidth="2" />
              <path d={`M${100 + d * 12} 42L${100 + d * 40} 36`} stroke="var(--fg)" strokeWidth="5.5" strokeLinecap="round" />
              <path d={`M${100 + d * 12} 42L${100 + d * 40} 36`} stroke={mix(c2, 30, '#f7b801')} strokeWidth="2.6" strokeLinecap="round" />
              <Blossom x={100 + d * 33} y={50} r={11} fill={c} core={c2} />
              <Blossom x={100 + d * 33} y={70} r={9} fill={mix(c, 70, c2)} core={c} />
              <Blossom x={100 + d * 33} y={87} r={8} fill={c} core={c2} />
            </g>
          ))}
        {mk === 3 && (
          <g>
            <path d="M158 130L160 152" stroke="var(--fg)" strokeWidth="2.4" />
            <rect x="148" y="150" width="24" height="5" rx="2" fill={INK} />
            <circle cx="160" cy="165" r="27" fill={`url(#${uid}-sl)`} />
            <ellipse cx="160" cy="165" rx="14" ry="12" fill={mix(c, 25, '#ffc14d')} {...ST} />
            <path d="M147 161H173M147 169H173" {...THIN} opacity=".6" />
            <rect x="152" y="175" width="16" height="4" rx="1.5" fill={INK} />
          </g>
        )}
      </g>
      {[
        [34, 162, 0], [168, 86, 3],
      ].map(([x, y, i]) => (
        <Drift key={i} x={x} y={y} i={i} cls="bce-storm" still={still}>
          <path d={PETAL} fill={c} {...THIN} strokeWidth={1.4} />
        </Drift>
      ))}
      {mk === 3 &&
        [
          [20, 24, 1], [50, 12, 2], [150, 16, 4], [182, 40, 5], [14, 72, 6], [34, 112, 7], [186, 118, 8], [170, 186, 9], [72, 186, 10], [132, 176, 11], [28, 186, 12], [130, 34, 13], [66, 40, 14],
        ].map(([x, y, i]) => (
          <Drift key={i} x={x} y={y} i={i} cls="bce-storm" still={still}>
            <path d={PETAL} transform={`rotate(${i * 53}) scale(${i % 3 === 0 ? 1.25 : 1})`} fill={i % 2 ? c : c2} {...THIN} strokeWidth={1.3} />
          </Drift>
        ))}
    </g>
  );
}

function Floret({ x, y, r, c2 }: { x: number; y: number; r: number; c2: string }) {
  const pts = [[0, 0], [0.62, 0], [-0.62, 0], [0.31, 0.54], [-0.31, 0.54], [0.31, -0.54], [-0.31, -0.54]];
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={c2} {...ST} />
      {pts.map(([a, b], i) => (
        <path key={i} d="M0-3.8Q3-3 3.8 0Q3 3 0 3.8Q-3 3-3.8 0Q-3-3 0-3.8Z" transform={`translate(${a * r} ${b * r}) rotate(45)`} fill={i % 2 ? mix(c2, 60, '#fff') : c2} stroke={mix(c2, 55, '#101a40')} strokeWidth="1" />
      ))}
      {pts.map(([a, b], i) => (
        <circle key={i} cx={a * r} cy={b * r} r=".9" fill="#fff" />
      ))}
    </g>
  );
}

function Teruteru({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const cloth = `${uid}-tc`;
  const shade = `${uid}-ts`;
  const rainbow = ['#ff5a5f', '#ffb13d', '#ffe45c', '#5fd38d', '#4895ef', '#9d6bf0'];
  return (
    <g>
      <defs>
        <radialGradient id={cloth} cx="40%" cy="28%" r="85%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".6" stopColor={mix(c, 45, '#fff')} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
        <linearGradient id={shade} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c} />
          <stop offset=".5" stopColor={mix(c, 45, '#fff')} />
          <stop offset="1" stopColor={mix(c, 25, '#fff')} />
        </linearGradient>
      </defs>
      {mk === 3 && (
        <>
          <Glow id={`${uid}-tg`} c={c2} c2={c2} cy={84} />
          {rainbow.map((col, i) => (
            <path key={col} d={`M${6 + i * 7} 160A${94 - i * 7} ${94 - i * 7} 0 0 1 ${194 - i * 7} 160`} fill="none" stroke={col} strokeWidth="7.5" />
          ))}
          <path d="M2.5 160A97.5 97.5 0 0 1 197.5 160" fill="none" stroke="var(--fg)" strokeWidth="2.6" />
          <path d="M44 160A56 56 0 0 1 156 160" fill="none" stroke="var(--fg)" strokeWidth="2.6" />
          {[24, 176].map((x) => (
            <path key={x} d={`M${x - 24} 172C${x - 28} 160 ${x - 16} 152 ${x - 10} 158C${x - 8} 146 ${x + 10} 146 ${x + 12} 158C${x + 20} 154 ${x + 28} 162 ${x + 24} 172Z`} fill="#fff" {...ST} />
          ))}
        </>
      )}
      <Shadow rx={30} />
      <g className={anim(still, 'bce-swing')}>
        {mk >= 2 && (
          <>
            <path d="M100 -6V36" stroke="var(--fg)" strokeWidth="3" />
            <path d="M100 -6V36" stroke={c2} strokeWidth="1.2" strokeDasharray="3 3" />
          </>
        )}
        {mk < 2 && (
          <>
            <path d="M100 34V20" stroke="var(--fg)" strokeWidth="3" />
            <circle cx="100" cy="16" r="5" fill={c2} {...THIN} className={anim(still, 'i-pulse')} />
          </>
        )}
        {/* the cloth */}
        <path d="M82 96C70 116 52 142 48 164C56 176 66 164 74 172C82 180 92 166 100 174C108 182 118 166 126 172C134 164 144 176 152 164C148 142 130 116 118 96Z" fill={`url(#${shade})`} {...ST} strokeWidth={3.5} />
        <path d="M86 112L72 158M100 112V160M114 112L128 158" fill="none" {...THIN} opacity=".42" />
        <path d="M54 160C62 168 68 160 75 166C83 172 92 160 100 167C108 174 117 160 125 166C132 160 138 168 146 160" fill="none" stroke={c2} strokeWidth="2.4" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="100" cy="68" r="35" fill={`url(#${cloth})`} {...ST} strokeWidth={3.5} />
        <path d="M68 58Q100 44 132 58" fill="none" {...THIN} opacity=".55" />
        <Bolt x={72} y={72} r={2.6} />
        <Bolt x={128} y={72} r={2.6} />
        <circle cx="82" cy="79" r="5.5" fill={c2} opacity=".35" />
        <circle cx="118" cy="79" r="5.5" fill={c2} opacity=".35" />
        <Eyes still={still}>
          {happy ? (
            <path d="M80 72Q88 62 96 72M104 72Q112 62 120 72" fill="none" stroke={INK} strokeWidth="4.6" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="88" cy="68" r="5" fill={INK} />
              <circle cx="112" cy="68" r="5" fill={INK} />
            </>
          )}
        </Eyes>
        <path d={happy ? 'M88 80Q100 94 112 80Z' : 'M90 80Q100 89 110 80'} fill={happy ? INK : 'none'} stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* neck tie */}
        <path d="M82 100Q100 110 118 100L118 108Q100 118 82 108Z" fill={c2} {...ST} />
        <path d="M100 110L84 124L80 110ZM100 110L116 124L120 110Z" fill={c2} {...THIN} />
        <circle cx="100" cy="110" r="4.6" fill={c2} {...THIN} />
        {mk >= 2 && (
          <>
            <Leaf x={52} y={128} r={15} rot={-50} fill={mix(c2, 35, '#2f9e6b')} />
            <Leaf x={148} y={128} r={15} rot={50} fill={mix(c2, 35, '#2f9e6b')} />
            <Floret x={62} y={114} r={19} c2={c2} />
            <Floret x={138} y={114} r={19} c2={c2} />
            <Floret x={100} y={152} r={16} c2={mix(c2, 70, '#d44fd0')} />
          </>
        )}
        {mk === 3 && (
          <g transform="rotate(22 152 46)">
            <path d="M152 46V112" stroke="var(--fg)" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M152 112Q152 120 144 118" fill="none" stroke="var(--fg)" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M104 52C108 22 196 22 200 52C192 46 184 46 176 52C168 46 160 46 152 52C144 46 136 46 128 52C120 46 112 46 104 52Z" fill={c2} {...ST} />
            <path d="M118 42Q152 18 186 42" fill="none" stroke="#fff" strokeWidth="5" opacity=".9" />
            <path d="M128 52Q132 34 152 28M176 52Q172 34 152 28" fill="none" {...THIN} opacity=".5" />
            <circle cx="152" cy="26" r="3.4" fill={c2} {...THIN} />
          </g>
        )}
      </g>
      {mk === 3 &&
        [
          [18, 48], [38, 92], [14, 122], [56, 26], [34, 150], [180, 92], [160, 138], [186, 150], [72, 180], [130, 182],
        ].map(([x, y], i) => (
          <Drift key={i} x={x} y={y} i={i * 0.4} cls="bce-rain" still={still}>
            <path d="M0-7C3-2 5 1 5 3.5A5 5 0 0 1-5 3.5C-5 1-3-2 0-7Z" fill={c2} {...THIN} strokeWidth={1.4} />
          </Drift>
        ))}
    </g>
  );
}

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return <path d={`M0 ${-r}Q${r * 0.18} ${-r * 0.18} ${r} 0Q${r * 0.18} ${r * 0.18} 0 ${r}Q${-r * 0.18} ${r * 0.18} ${-r} 0Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z`} transform={`translate(${x} ${y})`} fill={fill} />;
}

function Magpie({ x, y, rot, flip, wing }: { x: number; y: number; rot: number; flip: boolean; wing: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -0.8 : 0.8} .8)`}>
      <path d="M-4-8C4-14 14-12 16-6L23-3L16-1C14 6 4 9-4 6L-25 11L-23 4L-8 0C-8-3-6-6-4-8Z" fill={INK} {...THIN} strokeWidth={2} />
      <path d="M-2 5C4 7 12 5 14-1C8-1 2 1-2 5Z" fill="#fff" />
      <path d="M2-7L-14-22C-4-24 10-20 11-8Z" fill={wing} {...THIN} strokeWidth={2} />
      <path d="M-4-13L8-11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="11" cy="-7" r="1.5" fill="#fff" />
    </g>
  );
}

function Orihime({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const robe = `${uid}-wr`;
  const skin = mix(c2, 8, '#fff4e6');
  const tanzaku = [
    { x: 40, l: 38, f: c2, r: -3 },
    { x: 60, l: 30, f: '#fff', r: 3 },
    { x: 140, l: 32, f: '#fff', r: -3 },
    { x: 160, l: 40, f: c2, r: 3 },
  ];
  const magpies = [[22, 163, 7], [54, 169, 15], [86, 180, 21]];
  return (
    <g>
      <defs>
        <linearGradient id={robe} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 78, '#fff')} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 70, '#000')} />
        </linearGradient>
      </defs>
      {mk === 3 && <Glow id={`${uid}-wg`} c={c} c2={c2} cy={92} r={98} />}
      {mk >= 2 && (
        <g>
          <path d="M26 26V170M174 26V170" stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
          <path d="M26 26V170M174 26V170" stroke={c2} strokeWidth="4.5" strokeLinecap="round" />
          <g className={anim(still, 'bce-warp')}>
            {[42, 58, 74, 90, 110, 126, 142, 158].map((x) => (
              <path key={x} d={`M${x} 26V168`} stroke={c2} strokeWidth="1.6" opacity=".62" />
            ))}
          </g>
          <path d="M16 24H184" stroke="var(--fg)" strokeWidth="10" strokeLinecap="round" />
          <path d="M16 24H184" stroke={c2} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M18 168H182" stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
          <path d="M18 168H182" stroke={c2} strokeWidth="3" strokeLinecap="round" />
          {tanzaku.map((t) => (
            <g key={t.x} transform={`rotate(${t.r} ${t.x} 28)`}>
              <path d={`M${t.x} 26V34`} stroke="var(--fg)" strokeWidth="1.6" />
              <rect x={t.x - 6} y="34" width="12" height={t.l} rx="1" fill={t.f} {...THIN} />
              <path d={`M${t.x - 2.5} 42h5M${t.x - 2.5} 48h5M${t.x - 2.5} 54h5`} stroke={c} strokeWidth="1.6" />
            </g>
          ))}
        </g>
      )}
      <Shadow rx={46} />
      <g className={anim(still, 'i-hover')}>
        {/* the Milky Way, as a sash */}
        <path d="M20 150C8 90 52 54 100 54C148 54 192 90 180 150" fill="none" stroke="var(--fg)" strokeWidth="13" strokeLinecap="round" />
        <path d="M20 150C8 90 52 54 100 54C148 54 192 90 180 150" fill="none" stroke={mix(c, 52, '#fff')} strokeWidth="8" strokeLinecap="round" />
        <path d="M20 150C8 90 52 54 100 54C148 54 192 90 180 150" fill="none" stroke={c2} strokeWidth="4.2" strokeLinecap="round" strokeDasharray=".5 8" />
        {/* buns */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${100 + d * 4} 40C${100 + d * 14} 18 ${100 + d * 48} 14 ${100 + d * 48} 32C${100 + d * 48} 46 ${100 + d * 22} 50 ${100 + d * 4} 40Z`} fill={c} {...ST} />
            <path d={`M${100 + d * 20} 30C${100 + d * 26} 24 ${100 + d * 34} 22 ${100 + d * 40} 26`} fill="none" stroke={mix(c, 50, '#fff')} strokeWidth="2.8" strokeLinecap="round" />
            <path d={`M${100 + d * 12} 38L${100 + d * 30} 8`} stroke="var(--fg)" strokeWidth="6" strokeLinecap="round" />
            <path d={`M${100 + d * 12} 38L${100 + d * 30} 8`} stroke={c2} strokeWidth="3" strokeLinecap="round" />
            <circle cx={100 + d * 31} cy={7} r="4.2" fill={c2} {...THIN} />
          </g>
        ))}
        {/* robe */}
        <path d="M78 92C66 118 56 146 52 172Q100 182 148 172C144 146 134 118 122 92Z" fill={`url(#${robe})`} {...ST} strokeWidth={3.5} />
        {[[72, 150, 3.5], [88, 164, 3], [116, 160, 3.5], [130, 146, 3], [100, 150, 2.6], [62, 164, 2.6], [138, 166, 2.6]].map(([x, y, r], i) => (
          <Star key={i} x={x} y={y} r={r * 1.6} fill={c2} />
        ))}
        {/* sleeves */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${100 + d * 20} 90C${100 + d * 46} 94 ${100 + d * 58} 112 ${100 + d * 60} 142L${100 + d * 26} 148C${100 + d * 22} 136 ${100 + d * 14} 130 ${100 + d * 2} 128Z`} fill={`url(#${robe})`} {...ST} />
            <path d={`M${100 + d * 60} 142L${100 + d * 26} 148`} stroke={c2} strokeWidth="4" strokeLinecap="round" />
            <circle cx={100 + d * 42} cy={108} r="2.4" fill="var(--surf-2)" {...THIN} strokeWidth={1.2} />
          </g>
        ))}
        {/* collar layers */}
        <path d="M84 88L100 118L116 88Z" fill="#fff" {...THIN} />
        <path d="M89 88L100 110L111 88Z" fill={c2} {...THIN} />
        {/* thread and shuttle */}
        <path d="M78 130H122" stroke={c2} strokeWidth="1.8" />
        <g className={anim(still, 'bce-weave')}>
          <path d="M80 130L92 124H108L120 130L108 136H92Z" fill={c2} {...THIN} strokeWidth={2.4} />
          <path d="M92 130H108" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* head */}
        <path d="M74 66C70 36 130 36 126 66L128 92Q118 98 114 86H86Q82 98 72 92Z" fill={c} {...ST} />
        <ellipse cx="100" cy="66" rx="20" ry="22" fill={skin} {...ST} />
        <path d="M79 62C78 38 122 38 121 62Q112 50 100 48Q88 50 79 62Z" fill={c} {...ST} />
        <path d="M100 48V34" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        <Star x={100} y={32} r={9} fill={c2} />
        <circle cx="87" cy="75" r="3.6" fill={c2} opacity=".5" />
        <circle cx="113" cy="75" r="3.6" fill={c2} opacity=".5" />
        <Eyes still={still}>
          {happy ? (
            <path d="M84 70Q90 62 96 70M104 70Q110 62 116 70" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="90" cy="68" rx="3.6" ry="5" fill={INK} />
              <ellipse cx="110" cy="68" rx="3.6" ry="5" fill={INK} />
              <circle cx="91" cy="66" r="1.2" fill={c2} />
              <circle cx="111" cy="66" r="1.2" fill={c2} />
            </>
          )}
        </Eyes>
        <path d="M97 79Q100 82 103 79" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {[[34, 110], [166, 108]].map(([x, y], i) => (
        <Drift key={i} x={x} y={y} i={i} cls="bce-twinkle" still={still}>
          <Star x={0} y={0} r={8} fill={c2} />
        </Drift>
      ))}
      {mk === 3 && (
        <g>
          <path d="M-2 197Q100 149 202 197" fill="none" stroke="var(--fg)" strokeWidth="8" strokeLinecap="round" />
          <path d="M-2 197Q100 149 202 197" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" />
          {magpies.map(([dx, y, r]) => (
            <g key={dx}>
              <Magpie x={100 - dx} y={y} rot={-r} flip={false} wing={c} />
              <Magpie x={100 + dx} y={y} rot={r} flip wing={c} />
            </g>
          ))}
          {[[12, 12], [52, 8], [150, 8], [190, 14], [10, 70], [190, 66], [50, 74], [150, 72]].map(([x, y], i) => (
            <Drift key={i} x={x} y={y} i={i + 3} cls="bce-twinkle" still={still}>
              <Star x={0} y={0} r={i % 2 ? 5 : 7} fill={i % 3 ? c2 : '#fff'} />
            </Drift>
          ))}
        </g>
      )}
    </g>
  );
}

function Burst({ x, y, r, c, c2, i, still }: { x: number; y: number; r: number; c: string; c2: string; i: number; still: boolean }) {
  const a = Array.from({ length: 12 }, (_, n) => (n * Math.PI) / 6);
  return (
    <Drift x={x} y={y} i={i} cls="bce-burst" still={still}>
      {a.map((t, n) => (
        <g key={n}>
          <path d={`M${Math.cos(t) * r * 0.3} ${Math.sin(t) * r * 0.3}L${Math.cos(t) * r * 0.82} ${Math.sin(t) * r * 0.82}`} stroke={n % 2 ? c : c2} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={Math.cos(t) * r} cy={Math.sin(t) * r} r="2.6" fill={n % 2 ? c2 : c} stroke="var(--fg)" strokeWidth="1" />
        </g>
      ))}
    </Drift>
  );
}

function Kingyo({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const fish = `${uid}-gf`;
  const clip = `${uid}-gc`;
  const bag = 'M92 30C88 42 62 48 50 78C38 114 58 154 100 154C142 154 162 114 150 78C138 48 112 42 108 30Z';
  return (
    <g>
      <defs>
        <radialGradient id={fish} cx="42%" cy="30%" r="80%">
          <stop offset="0" stopColor={mix(c, 75, '#fff')} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 72, '#300')} />
        </radialGradient>
        <clipPath id={clip}>
          <path d={bag} />
        </clipPath>
      </defs>
      {mk === 3 && (
        <>
          <Glow id={`${uid}-gg`} c={c} c2={c2} cy={88} />
          <Burst x={34} y={32} r={26} c={c} c2={c2} i={0} still={still} />
          <Burst x={168} y={34} r={24} c={c2} c2={c} i={1.3} still={still} />
          <Burst x={22} y={138} r={17} c={c2} c2={c} i={2.4} still={still} />
          <Burst x={180} y={132} r={18} c={c} c2={c2} i={3.1} still={still} />
        </>
      )}
      <Shadow rx={40} />
      <g className={anim(still, 'i-hover')}>
        {/* stand */}
        <path d="M78 156V174M122 156V174" stroke="var(--fg)" strokeWidth="11" strokeLinecap="round" />
        <path d="M78 156V174M122 156V174" stroke="var(--surf-2)" strokeWidth="6" strokeLinecap="round" />
        <path d="M64 182Q64 172 72 172H86Q92 172 92 182ZM108 182Q108 172 114 172H128Q136 172 136 182Z" fill={c} {...ST} />
        {mk >= 2 && (
          <g>
            <path d="M64 146L42 128M136 146L158 128" stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
            <path d="M64 146L42 128M136 146L158 128" stroke="var(--surf-2)" strokeWidth="3" strokeLinecap="round" />
            {/* uchiwa fan */}
            <path d="M42 128L34 106" stroke="var(--fg)" strokeWidth="5" strokeLinecap="round" />
            <path d="M34 110C10 108 4 76 20 64C34 54 58 66 58 84C58 96 48 108 34 110Z" fill={c2} {...ST} />
            <path d="M34 108L18 70M34 108L32 62M34 108L50 72" {...THIN} fill="none" opacity=".45" />
            <Tomoe x={32} y={85} r={13} fill={c} />
            {/* poi scoop */}
            <path d="M158 128L172 96" stroke="var(--fg)" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M158 128L172 96" stroke={c} strokeWidth="3" strokeLinecap="round" />
            <circle cx="178" cy="78" r="18" fill="#fff" />
            <path d="M170 68L178 78L173 86L184 82L188 90" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="178" cy="78" r="18" fill="none" stroke="var(--fg)" strokeWidth="7" />
            <circle cx="178" cy="78" r="18" fill="none" stroke={c} strokeWidth="3" />
          </g>
        )}
        <rect x="64" y="150" width="72" height="18" rx="7" fill="var(--surf-2)" {...ST} />
        <Bolt x={76} y={160} r={2.4} />
        <Bolt x={124} y={160} r={2.4} />
        <text x="100" y="165" textAnchor="middle" fontSize="12" fontWeight="800" fill={c}>
          祭
        </text>
        {/* carrying string */}
        <path d="M100 26C78 4 122 4 100 26" fill="none" stroke="var(--fg)" strokeWidth="3" />
        {/* the bag */}
        <path d={bag} fill="#dff4ff" fillOpacity=".2" />
        <g clipPath={`url(#${clip})`}>
          <g className={anim(still, 'bce-water')}>
            <path d="M30 60Q50 52 70 60T110 60T150 60T190 60V170H30Z" fill="#5ec2f7" fillOpacity=".6" />
            <path d="M30 60Q50 52 70 60T110 60T150 60T190 60" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".85" />
          </g>
        </g>
        <g className={anim(still, 'bce-swim')}>
          {/* fan tail */}
          <path d="M90 112C72 118 54 130 56 148C68 140 78 150 88 142C92 148 108 148 112 142C122 150 132 140 144 148C146 130 128 118 110 112Z" fill={`url(#${fish})`} {...ST} />
          <path d="M84 122L72 140M93 124L90 142M107 124L110 142M116 122L128 140" stroke={c2} strokeWidth="2.4" strokeLinecap="round" />
          {/* dorsal and side fins */}
          <path d="M90 66C92 54 106 52 112 58L108 72Z" fill={c} {...ST} />
          <path d="M76 98L54 88L60 110Z" fill={c} {...ST} />
          <path d="M124 98L146 88L140 110Z" fill={c} {...ST} />
          <circle cx="100" cy="92" r="28" fill={`url(#${fish})`} {...ST} strokeWidth={3.5} />
          {/* happi coat */}
          <path d="M73 96Q100 106 127 96L126 106C116 124 84 124 74 106Z" fill={c2} {...ST} />
          <path d="M70 94L81 100L78 112L67 106ZM130 94L119 100L122 112L133 106Z" fill={c2} {...THIN} strokeWidth={2.4} />
          <path d="M77 111C88 121 112 121 123 111" fill="none" stroke={c} strokeWidth="3.4" />
          <path d="M88 100L100 113L112 100" fill="none" stroke="var(--fg)" strokeWidth="7" strokeLinejoin="round" />
          <path d="M88 100L100 113L112 100" fill="none" stroke={c} strokeWidth="3.6" strokeLinejoin="round" />
          {/* bulging eyes on bolts */}
          <circle cx="81" cy="70" r="12" fill="#fff" {...ST} />
          <circle cx="119" cy="70" r="12" fill="#fff" {...ST} />
          <Eyes still={still}>
            {happy ? (
              <path d="M73 72Q81 62 89 72M111 72Q119 62 127 72" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="82" cy="70" r="6.4" fill={INK} />
                <circle cx="118" cy="70" r="6.4" fill={INK} />
                <circle cx="84" cy="68" r="2.1" fill="#fff" />
                <circle cx="120" cy="68" r="2.1" fill="#fff" />
              </>
            )}
          </Eyes>
          <ellipse cx="100" cy="87" rx="6" ry={happy ? 3.6 : 5} fill={mix(c, 55, '#fff')} {...THIN} />
          <ellipse cx="100" cy="87" rx="2.8" ry={happy ? 1.4 : 2.4} fill={INK} />
        </g>
        <path d={bag} fill="none" {...ST} strokeWidth={3.5} />
        <path d="M60 86C54 102 56 118 64 128M70 62C66 66 63 70 61 74" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
        {/* neck and knot */}
        <path d="M88 30L84 18M100 30V16M112 30L116 18" {...THIN} />
        <rect x="88" y="26" width="24" height="8" rx="3" fill={c} {...THIN} strokeWidth={2.4} />
        <Bolt x={100} y={30} r={2.2} />
        {mk === 3 && (
          <g className={anim(still, 'bce-beat')}>
            <circle cx="100" cy="163" r="24" fill={mix(c, 60, '#3a1a10')} {...ST} strokeWidth={3.5} />
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={100 + Math.cos((i * Math.PI) / 6) * 21} cy={163 + Math.sin((i * Math.PI) / 6) * 21} r="1.5" fill={c2} />
            ))}
            <circle cx="100" cy="163" r="17.5" fill="#fff8ec" {...THIN} />
            <Tomoe x={100} y={163} r={15} fill={c} />
          </g>
        )}
      </g>
    </g>
  );
}

function Bat({ c, sw = 1.6 }: { c: string; sw?: number }) {
  return (
    <g>
      <path d="M0-4L2.2-8L3.6-4C8-7 14-6 18-2C14-2 13 1 11 4C8 2 6 3 4 5L0 8L-4 5C-6 3-8 2-11 4C-13 1-14-2-18-2C-14-6-8-7-3.6-4L-2.2-8Z" fill={c} {...THIN} strokeWidth={sw} />
      <circle cx="-1.6" cy="-1" r=".9" fill="#fff" />
      <circle cx="1.6" cy="-1" r=".9" fill="#fff" />
    </g>
  );
}

const FLAME = 'M0 0C-10 0-13-10-7-17C-6-12-4-11-3-13C-4-20 0-26 5-31C4-24 12-18 11-9C10-3 6 0 0 0Z';

function Hyakki({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const pump = `${uid}-hp`;
  const light = `${uid}-hl`;
  const cloak = `${uid}-hc`;
  const fire = '#ffe27a';
  const flames = [
    [18, 182, 1.2], [36, 148, 1.35], [20, 110, 1.15], [34, 70, 1.3], [170, 180, 1.1], [158, 150, 0.9], [186, 150, 1.35], [190, 112, 1],
  ];
  return (
    <g>
      <defs>
        <radialGradient id={pump} cx="42%" cy="30%" r="80%">
          <stop offset="0" stopColor={mix(c, 68, fire)} />
          <stop offset=".65" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 66, '#3a0a00')} />
        </radialGradient>
        <linearGradient id={light} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff6c2" />
          <stop offset="1" stopColor={fire} />
        </linearGradient>
        <linearGradient id={cloak} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c2} />
          <stop offset="1" stopColor={mix(c2, 55, '#100020')} />
        </linearGradient>
      </defs>
      {mk === 3 && <Glow id={`${uid}-hg`} c={c2} c2={c} cy={88} />}
      {mk === 3 &&
        flames.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g className={anim(still, 'bce-flame')} style={still ? undefined : { animationDelay: `${-i * 0.27}s` }}>
              <path d={FLAME} fill={i % 2 ? c : c2} {...THIN} strokeWidth={2} />
              <path d="M0-2C-5-2-6-7-3-11C-1-9 2-14 3-14C3-10 6-8 5-5C4-3 3-2 0-2Z" fill={fire} />
              <circle cx="-2.4" cy="-7" r="1.3" fill={INK} />
              <circle cx="2.4" cy="-7" r="1.3" fill={INK} />
            </g>
          </g>
        ))}
      <Shadow rx={40} />
      <g className={anim(still, 'i-hover')}>
        {/* staff and lantern */}
        <path d="M144 178L156 48" stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
        <path d="M144 178L156 48" stroke={mix(c, 28, '#6d4a2f')} strokeWidth="3" strokeLinecap="round" />
        <path d="M156 50H176" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
        <g className={anim(still, 'bce-sway')}>
          <path d="M174 50V60" stroke="var(--fg)" strokeWidth="2.5" />
          <rect x="165" y="58" width="18" height="5" rx="2" fill={INK} />
          <ellipse cx="174" cy="79" rx="16" ry="19" fill={`url(#${light})`} {...ST} />
          <path d="M159 72H189M159 86H189" {...THIN} opacity=".45" />
          <text x="174" y="85" textAnchor="middle" fontSize="16" fontWeight="800" fill={c}>
            百
          </text>
          <rect x="165" y="95" width="18" height="5" rx="2" fill={INK} />
        </g>
        {/* boots and cloak */}
        <path d="M74 182Q74 170 84 170H94V182ZM106 182V170H116Q126 170 126 182Z" fill="var(--surf-2)" {...ST} />
        <path d="M78 110C66 134 58 154 56 176L70 166L84 178L100 168L116 178L130 166L144 176C142 154 134 134 122 110Z" fill={`url(#${cloak})`} {...ST} strokeWidth={3.5} />
        <path d="M100 118V162" {...THIN} opacity=".55" />
        <Bolt x={92} y={134} r={2.6} />
        <Bolt x={108} y={134} r={2.6} />
        {/* arm to the staff */}
        <path d="M126 128L148 122" stroke="var(--fg)" strokeWidth="10" strokeLinecap="round" />
        <path d="M126 128L148 122" stroke={c2} strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="150" cy="122" r="6.5" fill={c} {...THIN} strokeWidth={2.4} />
        {/* stem antenna */}
        <path d="M94 42C94 30 98 22 106 16L114 22C108 26 106 34 106 42Z" fill={mix(c2, 30, '#40603a')} {...ST} />
        <circle cx="110" cy="17" r="4.6" fill={c2} {...THIN} className={anim(still, 'i-pulse')} />
        {/* pumpkin */}
        <ellipse cx="62" cy="78" rx="23" ry="35" fill={`url(#${pump})`} {...ST} />
        <ellipse cx="138" cy="78" rx="23" ry="35" fill={`url(#${pump})`} {...ST} />
        <ellipse cx="80" cy="77" rx="25" ry="39" fill={`url(#${pump})`} {...ST} />
        <ellipse cx="120" cy="77" rx="25" ry="39" fill={`url(#${pump})`} {...ST} />
        <ellipse cx="100" cy="77" rx="25" ry="41" fill={`url(#${pump})`} {...ST} />
        <Bolt x={48} y={80} r={2.4} />
        <Bolt x={152} y={80} r={2.4} />
        {/* carved face */}
        <g className={anim(still, 'bce-flicker')}>
          <Eyes still={still}>
            {happy ? (
              <>
                <path d="M64 76Q77 54 90 76Q77 68 64 76Z" fill={INK} {...THIN} />
                <path d="M110 76Q123 54 136 76Q123 68 110 76Z" fill={INK} {...THIN} />
                <path d="M69 73Q77 60 85 73Q77 69 69 73Z" fill={`url(#${light})`} />
                <path d="M115 73Q123 60 131 73Q123 69 115 73Z" fill={`url(#${light})`} />
              </>
            ) : (
              <>
                <path d="M78 54L92 78H62Z" fill={INK} {...THIN} />
                <path d="M122 54L138 78H108Z" fill={INK} {...THIN} />
                <path d="M77.5 62L85 75H69Z" fill={`url(#${light})`} />
                <path d="M122.5 62L130 75H115Z" fill={`url(#${light})`} />
              </>
            )}
          </Eyes>
          <path d="M100 78L106 88H94Z" fill={INK} />
          <path d="M60 90L72 96L78 90L88 98L100 90L112 98L122 90L128 96L140 90C138 106 122 112 100 112C78 112 62 106 60 90Z" fill={INK} {...THIN} />
          <path d="M70 100L74 102L78 97L88 104L100 97L112 104L122 97L126 102L130 100C126 106 114 108 100 108C86 108 74 106 70 100Z" fill={`url(#${light})`} />
        </g>
        {mk >= 2 && (
          <g>
            <path d="M86 42C92 26 104 12 126 2C120 14 118 28 118 42Z" fill={`url(#${cloak})`} {...ST} strokeWidth={3.5} />
            <path d="M48 46C72 36 130 36 154 46C132 56 70 56 48 46Z" fill={`url(#${cloak})`} {...ST} strokeWidth={3.5} />
            <path d="M84 40Q102 32 120 40L120 46Q102 40 84 46Z" fill={c} {...THIN} />
            <rect x="96" y="36" width="12" height="10" rx="1.5" fill={fire} {...THIN} />
            <rect x="99.5" y="39" width="5" height="4" fill={c} />
          </g>
        )}
      </g>
      {mk >= 2 &&
        [
          [26, 30, 1], [40, 118, 0.7], [172, 24, 0.85], [16, 74, 0.75],
        ].map(([x, y, s], i) => (
          <Drift key={i} x={x} y={y} i={i * 0.9} cls="bce-flit" still={still}>
            <g transform={`scale(${s})`}>
              <Bat c={c2} />
            </g>
          </Drift>
        ))}
    </g>
  );
}

export const EVENT: BotRegistry = {
  kodama: { Art: Kodama, head: { x: 100, y: 34, s: 1 } },
  yukidaruma: { Art: Yukidaruma, head: { x: 100, y: 32, s: 0.72 } },
  setsubunoni: { Art: Oni, head: { x: 100, y: 36, s: 1.2 } },
  sakurei: { Art: Sakurei, head: { x: 100, y: 42, s: 0.72 } },
  teruteru: { Art: Teruteru, head: { x: 100, y: 33, s: 1.1 } },
  orihime: { Art: Orihime, head: { x: 100, y: 44, s: 0.7 } },
  kingyo: { Art: Kingyo, head: { x: 100, y: 42, s: 0.9 } },
  hyakki: { Art: Hyakki, head: { x: 100, y: 38, s: 1.2 } },
};
