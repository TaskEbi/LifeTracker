/** Surprise scenes, part three: fifteen about play, power and calm. */
import { A, Bot, City, Confetti, EASE, Embers, Fall, Fill, Finale, Fx, Page, Panel, Say, Speed, Stage, TW, Twinkles, range, type Css, type SurpriseProps } from './kit';
import { BOT, INK, LEFT, RIGHT, TALL, TOP } from './layout';

// ─── rocket ─────────────────────────────────────────────────────────────────

const Rocket = () => (
  <svg viewBox="0 0 60 130">
    <path d="M30 2 Q52 30 50 90 H10 Q8 30 30 2z" fill="#f4f6fb" stroke={INK} strokeWidth="3" />
    <circle cx="30" cy="46" r="10" fill="#60a5fa" stroke={INK} strokeWidth="3" />
    <path d="M10 70 L-2 104 L12 96z M50 70 L62 104 L48 96z" fill="#ef4444" stroke={INK} strokeWidth="2.5" />
    <path d="M14 90 h32 v10 h-32z" fill="#94a3b8" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function RocketS({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#60a5fa" id="rocket">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#0c1a3a, #1e3a6e 60%, #4b5563 60%)" />
          <A l={50} t={56} w="14%" m={TW.rise} d={200} loop="shake" ld={1000}>
            <Rocket />
          </A>
          <A l={50} t={88} w="40%" m={TW.fade} d={1000} p={400} loop="pulse" lp={120}>
            <i className="sv-flame" />
          </A>
          {['3', '2', '1'].map((n, i) => (
            <A key={n} l={20} t={36} m={{ s0: 2.4, s1: 0.6, o0: 0, om: 1, o1: 0 }} d={300 + i * 500} p={500}>
              <span className="sv-countdown">{n}</span>
            </A>
          ))}
          <A l={82} t={74} w="16%" m={TW.fromR} d={300}>
            <Bot />
          </A>
          <Fx text="ゴゴゴゴ" at={1200} l={64} t={22} color="#fde68a" step={60} />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#020617, #1e1b4b)" />
          <Twinkles n={18} seed={3} top={100} />
          <A l={20} t={20} w="16%">
            <i className="sv-planet" />
          </A>
          <A l={50} t={110} w="12%" rot={20} m={{ y1: -420, x1: 140 }} d={2100} p={1300} e={EASE.in}>
            <Rocket />
          </A>
          <A l={56} t={60} w="20%" m={{ s0: 0.4, o0: 0, om: 1 }} d={2400} p={500} loop="float" lp={900}>
            <Bot happy />
          </A>
          <Fx text="ドシュー!" at={2200} l={66} t={22} color="#fff" step={60} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="発" back="#1e3a8a" shout="発射!" chip={chip} title={title} line={line} sparks={['#60a5fa', '#fde68a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── thunder ────────────────────────────────────────────────────────────────

const Bolt = () => (
  <svg viewBox="0 0 40 120">
    <path d="M24 0 L4 60 H18 L10 120 L36 44 H22 L30 0z" fill="#fde047" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function Thunder({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#fde047" id="thunder">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#0f0b24, #2b1d54)" />
          <i className="sv-storm" />
          {range(3).map((i) => (
            <A key={i} l={24 + i * 26} t={22} w="10%" m={{ y0: -40, s0: 0.6, o0: 0, om: 1, o1: 0 }} d={500 + i * 450} p={350}>
              <Bolt />
            </A>
          ))}
          {range(3).map((i) => (
            <i key={i} className="sv-flashp" style={{ '--vd': `${520 + i * 450}ms` } as Css} />
          ))}
          <A l={50} t={66} w="40%" m={{ s0: 0.2, o0: 0, om: 1 }} d={1700} p={700} loop="pulse" lp={200}>
            <i className="sv-aura" />
          </A>
          <A l={50} t={66} w="26%" m={TW.rise} d={300} loop="shake" ld={1700}>
            <Bot />
          </A>
          <Embers n={18} seed={7} colors={['#fde047', '#fff', '#a78bfa']} delay={1800} />
          <Fx text="ゴロゴロ" at={300} l={70} t={12} color="#c4b5fd" step={70} />
          <Fx text="バチバチッ" at={1800} l={30} t={42} color="#fde047" step={55} size="l" />
          <Fx text="はああっ!" at={2500} l={64} t={88} color="#fff" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="覚" back="#713f12" shout="覚醒!" chip={chip} title={title} line={line} sparks={['#fde047', '#a78bfa', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── cranes ─────────────────────────────────────────────────────────────────

const Crane = ({ c }: { c: string }) => (
  <svg viewBox="0 0 80 50">
    <path d="M2 30 L30 24 L40 4 L46 26 L78 18 L52 32 L40 46 L30 32z" fill={c} stroke={INK} strokeWidth="2" />
    <path d="M40 4 L40 46" stroke={INK} strokeWidth="1" opacity="0.4" />
  </svg>
);

export function Cranes({ chip, title, line, hit }: SurpriseProps) {
  const cols = ['#f9a8d4', '#fde68a', '#a5f3fc', '#c4b5fd', '#fca5a5', '#bbf7d0'];
  return (
    <Page tc="#f9a8d4" id="cranes">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#fdf2f8, #f5e1ea)" />
          <A l={50} t={62} w="30%" m={TW.rise} d={200}>
            <i className="sv-sheet" />
          </A>
          <A l={50} t={62} w="30%" m={{ s0: 1, s1: 0.6, r1: 45, o1: 0 }} d={900} p={500}>
            <i className="sv-sheet" />
          </A>
          <A l={50} t={58} w="28%" m={TW.spin} d={1300} p={600}>
            <Crane c="#f9a8d4" />
          </A>
          <A l={84} t={70} w="16%" m={TW.fromR} d={300}>
            <Bot />
          </A>
          <Fx text="オリオリ" at={500} l={24} t={22} color="#db2777" step={70} size="s" />
          <Fx text="できた!" at={1700} l={30} t={84} color="#fff" step={80} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#7dd3fc, #fbcfe8)" />
          {range(14).map((i) => (
            <A key={i} l={-10} t={20 + ((i * 29) % 70)} w={`${10 + (i % 3) * 3}%`} m={{ x1: `${700 + (i % 4) * 60}%`, y1: -40 - (i % 5) * 10, o0: 0, om: 1 }} d={2000 + i * 90} p={1700} e={EASE.lin} loop="bob" lp={300 + (i % 3) * 60}>
              <Crane c={cols[i % cols.length]} />
            </A>
          ))}
          <Fx text="ファサ…" at={2200} l={50} t={84} color="#fff" step={90} />
        </Panel>
      </Stage>
      <Finale kanji="鶴" back="#9d174d" shout="千羽鶴!" chip={chip} title={title} line={line} sparks={cols} at={hit} />
    </Page>
  );
}

// ─── taiko ──────────────────────────────────────────────────────────────────

const Drum = () => (
  <svg viewBox="0 0 120 110">
    <ellipse cx="60" cy="22" rx="52" ry="18" fill="#f6e7c8" stroke={INK} strokeWidth="3" />
    <path d="M8 22 Q2 60 14 96 Q60 116 106 96 Q118 60 112 22" fill="#9a3412" stroke={INK} strokeWidth="3" />
    {range(9).map((i) => (
      <circle key={i} cx={14 + i * 11.5} cy={34 + Math.sin((i / 8) * Math.PI) * 6} r="2.5" fill="#fde68a" />
    ))}
    <path d="M44 22 a16 8 0 1 0 32 0 a16 8 0 1 0 -32 0" fill="none" stroke="#e11d48" strokeWidth="3" />
  </svg>
);
const Bachi = () => (
  <svg viewBox="0 0 12 90">
    <rect x="3" y="0" width="6" height="90" rx="3" fill="#d6a46b" stroke={INK} strokeWidth="2" />
  </svg>
);

export function Taiko({ chip, title, line, hit }: SurpriseProps) {
  const beats = [600, 1000, 1400, 1600, 1800, 2400, 2600, 2800];
  return (
    <Page tc="#ef4444" id="taiko">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="radial-gradient(circle at 50% 60%, #4a0e0e, #120404 80%)" />
          {range(5).map((i) => (
            <A key={i} l={10 + i * 20} t={16} w="10%" loop="sway" lp={800 + i * 100}>
              <i className="sv-lantern" />
            </A>
          ))}
          <A l={50} t={70} w="54%" m={TW.rise} d={200}>
            <Drum />
          </A>
          <A l={50} t={40} w="26%" m={TW.drop} d={300}>
            <Bot />
          </A>
          {beats.map((b, i) => (
            <A key={i} l={i % 2 ? 66 : 34} t={50} w="5%" rot={i % 2 ? 30 : -30} m={{ r0: 0, rm: i % 2 ? -50 : 50, r1: 0 }} d={b - 120} p={240} origin="50% 100%">
              <Bachi />
            </A>
          ))}
          {beats.map((b, i) => (
            <i key={i} className="sv-shock" style={{ left: '50%', top: '64%', '--vd': `${b}ms` } as Css} />
          ))}
          <Fx text="ドン" at={600} l={20} t={36} color="#fde68a" step={80} size="l" />
          <Fx text="ドン" at={1000} l={80} t={36} color="#fde68a" step={80} size="l" />
          <Fx text="カッ" at={1400} l={22} t={58} color="#fff" step={80} />
          <Fx text="ドドドン!" at={2400} l={50} t={92} color="#ef4444" step={60} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="響" back="#7f1d1d" shout="フルコンボ!" chip={chip} title={title} line={line} sparks={['#ef4444', '#fde68a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── bento ──────────────────────────────────────────────────────────────────

const BENTO = [
  { c: 'radial-gradient(circle at 40% 40%, #fff, #f3f4f6)', l: 30, t: 50, w: 34, k: 'rice' },
  { c: 'radial-gradient(circle, #fde047, #f59e0b)', l: 66, t: 34, w: 16, k: 'egg' },
  { c: 'radial-gradient(circle, #f87171, #b91c1c)', l: 84, t: 34, w: 12, k: 'sausage' },
  { c: 'radial-gradient(circle, #86efac, #15803d)', l: 70, t: 66, w: 18, k: 'broccoli' },
  { c: 'radial-gradient(circle, #fdba74, #c2410c)', l: 88, t: 66, w: 12, k: 'karaage' },
];

export function Bento({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#84cc16" id="bento">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#fef3c7, #fde68a)" />
          <A l={58} t={54} w="70%" m={TW.rise} d={200}>
            <i className="sv-box" />
          </A>
          {BENTO.map((b, i) => (
            <A key={b.k} l={(b.l - 50) * 0.7 + 58} t={(b.t - 50) * 0.8 + 54} w={`${b.w * 0.7}%`} m={TW.drop} d={600 + i * 260} p={500}>
              <i className="sv-food" style={{ background: b.c }} />
            </A>
          ))}
          <A l={16} t={64} w="18%" m={TW.fromL} d={300}>
            <Bot />
          </A>
          <Fx text="ポン ポン" at={700} l={60} t={12} color="#65a30d" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle, #ecfccb, #84cc16 80%)" />
          <A l={50} t={50} w="120%" m={TW.fade} d={2100}>
            <i className="sv-ray" />
          </A>
          <A l={50} t={58} w="46%" m={TW.zoom} d={2200} p={500}>
            <span className="sv-bentoface">
              <i className="sv-box" />
              <b className="sv-nori" />
            </span>
          </A>
          <A l={50} t={46} w="20%" m={{ y1: -60, o0: 1, o1: 0, s1: 1.4 }} d={2300} p={500}>
            <i className="sv-lid" />
          </A>
          <Fx text="パカッ" at={2300} l={24} t={20} color="#fff" step={70} />
          <Fx text="いただきます!" at={2800} l={56} t={88} color="#365314" step={55} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="弁" back="#3f6212" shout="いただきます!" chip={chip} title={title} line={line} sparks={['#84cc16', '#fde047', '#f87171']} at={hit} />
    </Page>
  );
}

// ─── station stamp ──────────────────────────────────────────────────────────

const StampBlock = () => (
  <svg viewBox="0 0 60 70">
    <rect x="18" y="0" width="24" height="34" rx="8" fill="#7c2d12" stroke={INK} strokeWidth="2.5" />
    <rect x="4" y="34" width="52" height="16" fill="#a16207" stroke={INK} strokeWidth="2.5" />
    <rect x="6" y="50" width="48" height="16" fill="#0f766e" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function EkiStamp({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#2dd4bf" id="ekistamp">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#cbd5e1, #94a3b8 70%, #475569 70%)" />
          <A l={50} t={20} w="60%" m={TW.drop} d={200}>
            <span className="sv-eki">
              <b>らいふとらっかー</b>
              <i>LIFE TRACKER</i>
            </span>
          </A>
          <A l={50} t={78} w="150%" m={{ x0: '60%', x1: '-60%' }} d={400} p={1600} e={EASE.soft}>
            <i className="sv-carriage" />
          </A>
          <A l={20} t={66} w="16%" m={TW.rise} d={1400}>
            <Bot />
          </A>
          <Fx text="プシュー" at={1600} l={74} t={50} color="#fff" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="#f6f1e7" />
          <A l={50} t={56} w="80%" m={TW.rise} d={2000}>
            <span className="sv-card">
              {range(8).map((i) => (
                <i key={i} className={i < 5 ? 'is-on' : i === 5 ? 'is-new' : ''} />
              ))}
            </span>
          </A>
          <A l={63} t={20} w="16%" m={{ y0: -80, ym: 50, y1: -60, o0: 0, om: 1, o1: 0 }} d={2300} p={900} e={EASE.soft}>
            <StampBlock />
          </A>
          <Fx text="ポンッ" at={2700} l={24} t={20} color="#0f766e" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="印" back="#115e59" shout="スタンプゲット!" chip={chip} title={title} line={line} sparks={['#2dd4bf', '#fde68a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── gacha jackpot ──────────────────────────────────────────────────────────

const Machine = () => (
  <svg viewBox="0 0 100 150">
    <rect x="10" y="70" width="80" height="76" rx="6" fill="#ff2e93" stroke={INK} strokeWidth="3" />
    <circle cx="50" cy="42" r="38" fill="#e0f2fe" fillOpacity="0.7" stroke={INK} strokeWidth="3" />
    {range(7).map((i) => (
      <circle key={i} cx={28 + (i % 4) * 14} cy={30 + Math.floor(i / 4) * 18 + (i % 2) * 6} r="7" fill={['#fde047', '#38bdf8', '#a78bfa', '#4ade80'][i % 4]} stroke={INK} strokeWidth="1.5" />
    ))}
    <rect x="36" y="118" width="28" height="18" rx="3" fill="#1f2937" />
  </svg>
);

export function Gacha({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ff6fae" id="gacha">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#1a0b2e, #3b0f4f)" />
          <A l={44} t={56} w="30%" m={TW.rise} d={200} loop="shake" ld={1000}>
            <Machine />
          </A>
          <A l={44} t={70} w="10%" m={TW.pop} d={500} m2={{ r1: 720 }} d2={900} p2={1000} e2={EASE.soft}>
            <i className="sv-knob" />
          </A>
          <A l={80} t={66} w="18%" m={TW.fromR} d={300}>
            <Bot />
          </A>
          <Fx text="ガラガラ" at={900} l={78} t={20} color="#fbcfe8" step={60} />
          <Fx text="ドキドキ" at={1600} l={20} t={22} color="#fff" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle, #fff, #ff6fae 60%, #3b0f4f)" />
          <A l={50} t={52} w="130%" m={TW.fade} d={2400}>
            <i className="sv-ray sv-ray--rainbow" />
          </A>
          <A l={50} t={60} w="24%" m={{ y0: 60, s0: 0.4, o0: 0, om: 1 }} d={2100} p={500} m2={{ s1: 1.3, r1: 360 }} d2={2500} p2={600} loop="pulse" lp={300}>
            <i className="sv-capsule" />
          </A>
          <Confetti n={26} seed={8} colors={['#f472b6', '#fde047', '#38bdf8', '#a78bfa', '#4ade80']} delay={2600} />
          <Fx text="コロン" at={2200} l={20} t={78} color="#fff" step={70} size="s" />
          <Fx text="虹色!!" at={2700} l={50} t={16} color="#fff" step={80} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="当" back="#9d174d" shout="超激レア!" chip={chip} title={title} line={line} sparks={['#f472b6', '#fde047', '#38bdf8', '#a78bfa']} at={hit} />
    </Page>
  );
}

// ─── sakura storm ───────────────────────────────────────────────────────────

export function Sakura({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#fbcfe8" id="sakura">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#bfdbfe, #fce7f3 70%, #a7f3d0 70%)" />
          <A l={50} t={36} w="100%" m={TW.fade} d={200} p={600} loop="sway" lp={2200}>
            <i className="sv-tree" />
          </A>
          <A l={50} t={78} w="22%" m={TW.rise} d={400} m2={{ r1: -12, y1: -4 }} d2={1700} p2={400}>
            <Bot happy />
          </A>
          <Fall n={18} seed={2} kind="petal" from={300} span={1400} />
          <Fall n={34} seed={6} kind="petal" from={1700} span={1500} />
          <A l={50} t={50} w="120%" m={{ x0: '-80%', x1: '80%', o0: 0, om: 0.7, o1: 0 }} d={1700} p={1300} e={EASE.lin}>
            <i className="sv-wind" />
          </A>
          <Fx text="ヒュウウ" at={1700} l={30} t={56} color="#fff" step={70} size="l" />
          <Fx text="わぁ…" at={2600} l={70} t={70} color="#be185d" step={110} />
        </Panel>
      </Stage>
      <Finale kanji="桜" back="#9d174d" shout="満開!" chip={chip} title={title} line={line} sparks={['#fbcfe8', '#f9a8d4', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── onsen ──────────────────────────────────────────────────────────────────

const Monkey = () => (
  <svg viewBox="0 0 70 60">
    <ellipse cx="35" cy="40" rx="26" ry="20" fill="#9ca3af" stroke={INK} strokeWidth="2.5" />
    <circle cx="35" cy="24" r="18" fill="#9ca3af" stroke={INK} strokeWidth="2.5" />
    <ellipse cx="35" cy="27" rx="12" ry="10" fill="#fb7185" />
    <path d="M28 25 q3 -2 6 0 M37 25 q3 -2 6 0" stroke={INK} strokeWidth="2" fill="none" />
  </svg>
);

export function Onsen({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#fdba74" id="onsen">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#e2e8f0, #cbd5e1)" />
          <Fall n={16} seed={9} kind="snow" from={0} span={2600} />
          <A l={50} t={28} w="44%" m={TW.drop} d={200}>
            <span className="sv-yu">♨ ゆ</span>
          </A>
          <A l={30} t={72} w="18%" m={TW.fromL} d={400} loop="bob" lp={200} amp="3px">
            <Bot />
          </A>
          <Say l={66} t={66} d={1200}>
            寒っ…
          </Say>
          <Fx text="ブルブル" at={900} l={30} t={44} color="#475569" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#475569, #1e293b)" />
          <A l={50} t={76} w="110%">
            <i className="sv-spring" />
          </A>
          <A l={50} t={36} w="60%" m={TW.fade} d={2000} p={800}>
            <span className="sv-steam sv-steam--big">
              <i />
              <i />
              <i />
            </span>
          </A>
          <A l={40} t={70} w="22%" m={{ y0: -40, ym: 10, o0: 0, om: 1 }} d={2100} p={600} loop="float" lp={1400} amp="2px">
            <Bot happy />
          </A>
          <A l={40} t={50} w="9%" m={TW.pop} d={2600}>
            <i className="sv-towel" />
          </A>
          <A l={72} t={70} w="18%" m={TW.rise} d={2400} loop="float" lp={1600} amp="2px">
            <Monkey />
          </A>
          <Fx text="ポカポカ" at={2500} l={50} t={18} color="#fed7aa" step={80} />
          <Fx text="極楽〜" at={3000} l={22} t={40} color="#fff" step={100} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="癒" back="#9a3412" shout="いい湯だな!" chip={chip} title={title} line={line} sparks={['#fdba74', '#fff7ed', '#e2e8f0']} at={hit} />
    </Page>
  );
}

// ─── high score ─────────────────────────────────────────────────────────────

export function HighScore({ chip, title, line, hit }: SurpriseProps) {
  const rows = [
    ['1ST', 'YOU', '999,990'],
    ['2ND', 'AAA', '873,200'],
    ['3RD', 'CPU', '812,450'],
  ];
  return (
    <Page tc="#ff2e93" id="highscore">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="#0b0716" />
          <i className="sv-crt" />
          <A l={50} t={20} m={TW.pop} d={300} loop="pulse" lp={240}>
            <span className="sv-px sv-px--hot">NEW HIGH SCORE!</span>
          </A>
          {rows.map((r, i) => (
            <A key={i} l={50} t={46 + i * 15} w="80%" m={{ x0: i ? 0 : -30, o0: 0 }} d={700 + i * 220} p={200} e={EASE.lin} loop={i === 0 ? 'pulse' : undefined} lp={300}>
              <span className={`sv-px sv-px--row${i === 0 ? ' is-you' : ''}`}>
                <b>{r[0]}</b>
                <span>{r[1]}</span>
                <i>{r[2]}</i>
              </span>
            </A>
          ))}
          <Fx text="ピコーン" at={400} l={84} t={86} color="#21e6ff" step={60} size="s" />
        </Panel>
        <Panel {...LEFT} inAt={1800} outAt={hit - 150} from="left" rz={-2}>
          <Fill bg="radial-gradient(circle, #3b0f4f, #0b0716 80%)" />
          <A l={50} t={60} w="60%" m={TW.rise} d={1900} loop="bob" lp={180} amp="4px">
            <Bot happy />
          </A>
          <Fx text="やった!" at={2200} l={50} t={18} color="#fff" step={70} size="s" />
        </Panel>
        <Panel {...RIGHT} inAt={2100} outAt={hit - 150} rz={2}>
          <Fill bg="#0b0716" />
          <i className="sv-crt" />
          {['Y', 'O', 'U'].map((ch, i) => (
            <A key={i} l={28 + i * 22} t={52} m={{ r0: 90, o0: 0, rm: -10, om: 1 }} d={2300 + i * 220} p={300}>
              <span className="sv-px sv-px--big">{ch}</span>
            </A>
          ))}
          <Fx text="ENTRY!" at={3000} l={50} t={84} color="#21e6ff" step={60} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="新" back="#831843" shout="新記録!" chip={chip} title={title} line={line} sparks={['#ff2e93', '#21e6ff', '#ffe14d']} at={hit} />
    </Page>
  );
}

// ─── paper plane ────────────────────────────────────────────────────────────

const Plane = () => (
  <svg viewBox="0 0 80 40">
    <path d="M2 20 L78 2 L40 38 L34 24z" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <path d="M34 24 L78 2" stroke={INK} strokeWidth="2" />
  </svg>
);

export function PaperPlane({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#7dd3fc" id="paperplane">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#38bdf8, #bae6fd 60%, #e0f2fe)" />
          <i className="sv-clouds" />
          <City seed={13} n={9} layer="far" />
          <A l={20} t={80} w="20%" m={TW.rise} d={300} m2={{ r1: -20, y1: -6 }} d2={900} p2={300}>
            <Bot happy />
          </A>
          <A l={28} t={72} w="22%" m={{ x0: 0, y0: 0, xm: '120%', ym: '-340%', x1: '250%', y1: '-160%', r0: -10, rm: -30, r1: 20 }} d={1100} p={2200} e={EASE.soft} loop="bob" lp={300}>
            <Plane />
          </A>
          {range(5).map((i) => (
            <A key={i} l={30 + i * 13} t={46 - i * 6} m={{ o0: 0, om: 0.8, o1: 0, s0: 0.4, s1: 1.4 }} d={1300 + i * 260} p={900}>
              <i className="sv-puff" />
            </A>
          ))}
          <Fx text="えいっ" at={900} l={30} t={66} color="#fff" step={80} />
          <Fx text="ヒューン" at={1500} l={66} t={24} color="#0c4a6e" step={70} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="飛" back="#075985" shout="どこまでも!" chip={chip} title={title} line={line} sparks={['#7dd3fc', '#ffffff', '#fde68a']} at={hit} />
    </Page>
  );
}

// ─── dragon ride ────────────────────────────────────────────────────────────

const DragonLong = () => (
  <svg viewBox="0 0 300 90">
    <path d="M4 50 Q40 10 80 46 T160 44 T240 40 Q266 36 280 30 L296 22 L288 40 Q270 54 240 54 T160 62 T80 64 Q40 84 4 50z" fill="#10b981" stroke={INK} strokeWidth="3" />
    {range(8).map((i) => (
      <path key={i} d={`M${60 + i * 26} ${48 - (i % 2) * 4} l8 -18 l6 18`} fill="#fde047" stroke={INK} strokeWidth="2" />
    ))}
    <circle cx="276" cy="32" r="3.5" fill="#fde047" stroke={INK} strokeWidth="1.5" />
    <path d="M282 24 Q290 6 300 4 M276 26 Q276 8 284 0" stroke="#fde047" strokeWidth="3" fill="none" />
  </svg>
);

export function DragonRide({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#34d399" id="dragon">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#0c4a6e, #34d399 120%)" />
          <i className="sv-clouds sv-clouds--dark" />
          <Speed />
          <A l={50} t={46} w="150%" m={{ x0: '-70%', x1: '10%', ym: -30 }} d={200} p={2600} e={EASE.soft} loop="bob" lp={600} amp="8px">
            <span className="sv-ride">
              <DragonLong />
              <span className="sv-ride__bot">
                <Bot happy />
              </span>
            </span>
          </A>
          <A l={50} t={84} w="120%" m={{ x0: '20%', x1: '-20%' }} d={0} p={3600} e={EASE.lin}>
            <i className="sv-cloudsea sv-cloudsea--white" />
          </A>
          <Fx text="ゴォォォ" at={800} l={70} t={16} color="#d1fae5" step={60} size="l" />
          <Fx text="ひゃっほー!" at={1900} l={30} t={74} color="#fff" step={60} />
        </Panel>
      </Stage>
      <Finale kanji="龍" back="#065f46" shout="天翔ける!" chip={chip} title={title} line={line} sparks={['#34d399', '#fde047', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── the forge ──────────────────────────────────────────────────────────────

const Hammer = () => (
  <svg viewBox="0 0 60 90">
    <rect x="27" y="20" width="6" height="68" rx="2" fill="#8b5a2b" stroke={INK} strokeWidth="2" />
    <rect x="6" y="4" width="48" height="22" rx="3" fill="#6b7280" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function Forge({ chip, title, line, hit }: SurpriseProps) {
  const strikes = [800, 1400, 2000, 2600];
  return (
    <Page tc="#fb923c" id="forge">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="radial-gradient(circle at 50% 80%, #7c2d12, #1c0a04 75%)" />
          <A l={50} t={80} w="40%" m={TW.rise} d={200}>
            <i className="sv-anvil" />
          </A>
          <A l={50} t={64} w="44%" m={TW.fade} d={400} loop="flicker" lp={300}>
            <i className="sv-blade" />
          </A>
          {strikes.map((s, i) => (
            <A key={i} l={64} t={40} w="12%" m={{ r0: -60, rm: 10, r1: -60, o0: i ? 0 : 1, om: 1, o1: i === 3 ? 1 : 0 }} d={s - 300} p={600} origin="50% 100%">
              <Hammer />
            </A>
          ))}
          {strikes.map((s, i) => (
            <Embers key={i} n={10} seed={20 + i} colors={['#fde047', '#fb923c', '#fff']} delay={s} spread={120} rise={140} />
          ))}
          <A l={86} t={66} w="16%" m={TW.fromR} d={300}>
            <Bot />
          </A>
          <Fx text="カンッ" at={800} l={24} t={30} color="#fde68a" step={60} />
          <Fx text="カンッ" at={1400} l={30} t={52} color="#fde68a" step={60} size="s" />
          <Fx text="カーン!" at={2000} l={20} t={74} color="#fff" step={60} />
        </Panel>
        <Panel {...BOT} inAt={2300} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#1e293b, #0f172a)" />
          <A l={50} t={50} w="90%" m={{ x0: '-40%', o0: 0, om: 1 }} d={2500} p={600} e={EASE.out}>
            <i className="sv-blade sv-blade--done" />
          </A>
          <A l={30} t={50} w="20%" m={{ x1: '400%', o0: 0, om: 1, o1: 0 }} d={3000} p={500} e={EASE.lin}>
            <i className="sv-glint" />
          </A>
          <Fx text="キラン" at={3000} l={80} t={22} color="#fff" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="鍛" back="#7c2d12" shout="業物!" chip={chip} title={title} line={line} sparks={['#fb923c', '#fde047', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── tea ceremony ───────────────────────────────────────────────────────────

const Chawan = () => (
  <svg viewBox="0 0 100 60">
    <path d="M6 10 Q10 56 50 58 Q90 56 94 10z" fill="#3f3f46" stroke={INK} strokeWidth="3" />
    <ellipse cx="50" cy="10" rx="44" ry="8" fill="#65a30d" stroke={INK} strokeWidth="3" />
    <ellipse cx="50" cy="10" rx="30" ry="4" fill="#a3e635" opacity="0.7" />
  </svg>
);
const Chasen = () => (
  <svg viewBox="0 0 30 70">
    <rect x="11" y="0" width="8" height="34" rx="3" fill="#d6c08a" stroke={INK} strokeWidth="2" />
    {range(7).map((i) => (
      <path key={i} d={`M15 34 Q${3 + i * 4} 52 ${2 + i * 4.3} 68`} stroke="#d6c08a" strokeWidth="2" fill="none" />
    ))}
  </svg>
);

export function Matcha({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#86efac" id="matcha">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-0.5}>
          <Fill bg="linear-gradient(#efe6cf, #d9caa4 70%, #9b8a5e 70%)" />
          <i className="sv-shoji" />
          <A l={74} t={64} w="20%" m={TW.fade} d={300} p={900}>
            <Bot />
          </A>
          <A l={36} t={72} w="30%" m={TW.fade} d={700} p={900}>
            <Chawan />
          </A>
          <A l={36} t={52} w="8%" m={TW.drop} d={1300} p={600} loop="drift" lp={110} amp="10px" ld={1700}>
            <Chasen />
          </A>
          <Fx text="シャカシャカ" at={1700} l={40} t={20} color="#365314" step={60} size="s" />
        </Panel>
        <Panel {...BOT} inAt={2200} outAt={hit - 150} rz={1}>
          <Fill bg="radial-gradient(circle at 50% 60%, #f7f2e4, #d9caa4 80%)" />
          <A l={50} t={62} w="44%" m={{ s0: 0.8, o0: 0, om: 1 }} d={2400} p={900} e={EASE.soft}>
            <Chawan />
          </A>
          <A l={50} t={36} w="30%" m={TW.fade} d={2700} p={900}>
            <span className="sv-steam">
              <i />
              <i />
              <i />
            </span>
          </A>
          <A l={50} t={50} w="36%" m={TW.fade} d={3000} p={900}>
            <i className="sv-enso" />
          </A>
          <Fx text="ほっ…" at={3000} l={80} t={80} color="#3f6212" step={140} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="和" back="#365314" shout="一期一会" shoutColor="#ecfccb" chip={chip} title={title} line={line} sparks={['#86efac', '#ecfccb', '#d9caa4']} at={hit} />
    </Page>
  );
}

// ─── moon rabbits ───────────────────────────────────────────────────────────

const Rabbit = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 60 70" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <ellipse cx="30" cy="50" rx="20" ry="16" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <circle cx="36" cy="28" r="12" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <path d="M32 18 Q26 -2 32 2 Q38 6 36 18 M40 18 Q44 0 48 4 Q50 10 42 20" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <circle cx="40" cy="27" r="2" fill="#e11d48" />
  </svg>
);
const Kine = () => (
  <svg viewBox="0 0 60 90">
    <rect x="27" y="20" width="6" height="68" fill="#a16207" stroke={INK} strokeWidth="2" />
    <rect x="4" y="2" width="52" height="22" rx="8" fill="#ca8a04" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function Mochi({ chip, title, line, hit }: SurpriseProps) {
  const hits = [700, 1300, 1900, 2500];
  return (
    <Page tc="#fef08a" id="mochi">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#020617, #1e1b4b)" />
          <i className="sv-stars" />
          <A l={74} t={40} w="40%" m={{ y0: 60, o0: 0, om: 1, s0: 0.8 }} d={200} p={1200} e={EASE.soft}>
            <i className="sv-moon sv-moon--big" />
          </A>
          <A l={24} t={70} w="18%" m={TW.rise} d={400} m2={{ r1: -20 }} d2={1200} p2={400}>
            <Bot happy />
          </A>
          <Say l={30} t={34} d={1400}>
            うさぎ!?
          </Say>
          <Fx text="じーっ" at={900} l={60} t={84} color="#fef9c3" step={100} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1700} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 50% 50%, #fefce8, #fde68a 60%, #ca8a04)" />
          <A l={50} t={78} w="34%" m={TW.rise} d={1800}>
            <i className="sv-usu" />
          </A>
          <A l={26} t={66} w="20%" m={TW.fromL} d={1900}>
            <Rabbit />
          </A>
          <A l={74} t={66} w="20%" m={TW.fromR} d={1900}>
            <Rabbit flip />
          </A>
          {hits.map((h, i) => (
            <A key={i} l={i % 2 ? 62 : 38} t={44} w="12%" rot={i % 2 ? 20 : -20} m={{ r0: i % 2 ? 40 : -40, rm: 0, r1: i % 2 ? 40 : -40, o0: 0, om: 1, o1: i === 3 ? 1 : 0 }} d={1800 + h - 600} p={500} origin="50% 100%">
              <Kine />
            </A>
          ))}
          {hits.map((h, i) => (
            <i key={i} className="sv-shock sv-shock--soft" style={{ left: '50%', top: '72%', '--vd': `${1800 + h - 350}ms` } as Css} />
          ))}
          <Fx text="ペッタン" at={2200} l={50} t={16} color="#a16207" step={70} />
          <Fx text="ペッタン" at={2900} l={50} t={30} color="#ca8a04" step={70} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="月" back="#854d0e" shout="お月見!" chip={chip} title={title} line={line} sparks={['#fef08a', '#ffffff', '#fbcfe8']} at={hit} />
    </Page>
  );
}

