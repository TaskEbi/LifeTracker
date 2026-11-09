/** Surprise scenes, part two: fourteen from Japan's streets, festivals and legends. */
import { A, Bot, City, EASE, Fall, Fill, Finale, Fx, Page, Panel, Say, Speed, Stage, TW, range, type Css, type SurpriseProps } from './kit';
import { BOT, INK, LEFT, RIGHT, TALL, TOP } from './layout';

// ─── ramen ──────────────────────────────────────────────────────────────────

const Bowl = () => (
  <svg viewBox="0 0 160 90">
    <ellipse cx="80" cy="20" rx="74" ry="14" fill="#c7581c" stroke={INK} strokeWidth="3" />
    <ellipse cx="80" cy="20" rx="64" ry="9" fill="#f2b55a" />
    <circle cx="56" cy="18" r="8" fill="#fff" stroke={INK} strokeWidth="2" />
    <circle cx="56" cy="18" r="4" fill="#f59e0b" />
    <rect x="86" y="10" width="26" height="12" rx="3" fill="#7c3f1d" stroke={INK} strokeWidth="2" />
    <path d="M100 14 l10 -2" stroke="#e11d48" strokeWidth="3" />
    <path d="M6 22 Q12 84 80 86 Q148 84 154 22" fill="#fff" stroke={INK} strokeWidth="3" />
    <path d="M30 50 h100" stroke="#e11d48" strokeWidth="4" strokeDasharray="10 8" />
  </svg>
);
const Noodles = () => (
  <svg viewBox="0 0 60 120">
    <path d="M10 0 L28 70 M50 0 L32 70" stroke="#5a3a1a" strokeWidth="5" />
    {range(5).map((i) => (
      <path key={i} d={`M${20 + i * 4} 64 q${i % 2 ? 6 : -6} 18 0 28 q${i % 2 ? -6 : 6} 12 0 26`} stroke="#ffe08a" strokeWidth="3.5" fill="none" />
    ))}
  </svg>
);

export function Ramen({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ff9f1c" id="ramen">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#2a120a, #120806)" />
          <A l={50} t={20} w="70%" m={TW.drop} d={200} p={600}>
            <span className="sv-noren">
              {['ら', 'ー', 'め', 'ん'].map((c) => (
                <b key={c}>{c}</b>
              ))}
            </span>
          </A>
          {range(3).map((i) => (
            <A key={i} l={18 + i * 32} t={46} w="12%" loop="sway" lp={900 + i * 200} m={TW.drop} d={300 + i * 120}>
              <i className="sv-lantern" />
            </A>
          ))}
          <A l={50} t={80} w="40%" m={TW.rise} d={700} p={600}>
            <Bowl />
          </A>
          <A l={50} t={60} w="24%" m={TW.fade} d={1100} p={500}>
            <span className="sv-steam">
              <i />
              <i />
              <i />
            </span>
          </A>
          <Fx text="へいお待ち!" at={1200} l={74} t={70} color="#fff3c4" step={60} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 50% 60%, #ffcf8a, #c2410c 80%)" />
          <Speed hot />
          <A l={40} t={60} w="34%" m={TW.zoom} d={2000} p={500} loop="bob" lp={200} amp="3px">
            <Bot happy />
          </A>
          <A l={64} t={48} w="14%" m={{ y0: 60, y1: -10, o0: 0, om: 1 }} d={2300} p={600} loop="float" lp={200} amp="5px">
            <Noodles />
          </A>
          <Fx text="ズルズル" at={2400} l={70} t={20} color="#fff" step={70} size="l" rot={-6} />
          <Fx text="うまい!" at={2900} l={26} t={20} color="#ffe066" step={80} />
        </Panel>
      </Stage>
      <Finale kanji="麺" back="#9a3412" shout="ごちそうさま!" chip={chip} title={title} line={line} sparks={['#ff9f1c', '#ffe08a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── the cat post ───────────────────────────────────────────────────────────

const Cat = ({ c = '#f4a261' }: { c?: string }) => (
  <svg viewBox="0 0 90 80">
    <path d="M70 60 Q90 50 84 30" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" />
    <ellipse cx="44" cy="58" rx="30" ry="18" fill={c} stroke={INK} strokeWidth="3" />
    <circle cx="30" cy="34" r="18" fill={c} stroke={INK} strokeWidth="3" />
    <path d="M16 24 L14 6 L28 18z M38 18 L46 4 L46 24z" fill={c} stroke={INK} strokeWidth="2.5" />
    <path d="M22 34 q3 -3 6 0 M34 34 q3 -3 6 0" stroke={INK} strokeWidth="2.5" fill="none" />
    <path d="M28 41 q3 3 6 0" stroke={INK} strokeWidth="2" fill="none" />
  </svg>
);
const Letter = () => (
  <svg viewBox="0 0 60 40">
    <rect x="2" y="2" width="56" height="36" fill="#fff8e7" stroke={INK} strokeWidth="2.5" />
    <path d="M2 2 L30 22 L58 2" stroke={INK} strokeWidth="2.5" fill="none" />
    <circle cx="30" cy="22" r="6" fill="#e11d48" />
  </svg>
);

export function CatPost({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#f4a261" id="catpost">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={1}>
          <Fill bg="linear-gradient(#a7d8f0 0 50%, #e9d8b4 50%)" />
          <City seed={5} n={8} layer="far" />
          <A l={50} t={76} w="30%" m={{ x0: '-260%', x1: '0%', xm: '-40%' }} d={300} p={1500} e={EASE.out} loop="bob" lp={160} amp="5px">
            <Cat />
          </A>
          <A l={56} t={66} w="13%" z={2} m={{ x0: '-600%', x1: '0%', xm: '-90%' }} d={300} p={1500} e={EASE.out} loop="bob" lp={160} amp="5px">
            <Letter />
          </A>
          <Fx text="トコトコ" at={500} l={24} t={30} color="#fff" step={70} />
        </Panel>
        <Panel {...LEFT} inAt={1700} outAt={hit - 150} from="left" rz={-2}>
          <Fill bg="#f6e7c8" />
          <A l={50} t={64} w="64%" m={TW.rise} d={1900}>
            <Bot />
          </A>
          <Say l={50} t={22} d={2200}>
            ニャー
          </Say>
        </Panel>
        <Panel {...RIGHT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle, #fff3c4, #f4a261 80%)" />
          <A l={50} t={56} w="70%" m={TW.stamp} d={2500} p={500}>
            <span className="sv-goldstar">★</span>
          </A>
          <Fx text="パァッ" at={2600} l={50} t={18} color="#fff" step={70} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="猫" back="#9a3412" shout="お届けもの!" chip={chip} title={title} line={line} sparks={['#f4a261', '#ffe066', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── shooting star ──────────────────────────────────────────────────────────

export function WishStar({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#a5b4fc" id="wishstar">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#050720, #1a1f5c 60%, #3b2f6e)" />
          <i className="sv-stars" />
          <i className="sv-stars sv-stars--b" />
          <A l={50} t={82} w="110%">
            <i className="sv-ridge" />
          </A>
          <A l={50} t={74} w="18%" m={TW.rise} d={300} p={700} m2={{ r1: -8 }} d2={1800} p2={400}>
            <Bot />
          </A>
          <A l={20} t={10} w="40%" rot={30} m={{ x0: '-40%', y0: '-60%', x1: '220%', y1: '520%', o0: 0, om: 1, o1: 0 }} d={1300} p={1300} e={EASE.lin}>
            <i className="sv-meteor" />
          </A>
          <A l={30} t={20} w="22%" rot={30} m={{ x0: '-40%', y0: '-60%', x1: '260%', y1: '520%', o0: 0, om: 1, o1: 0 }} d={2100} p={900} e={EASE.lin}>
            <i className="sv-meteor" />
          </A>
          <Say l={56} t={58} d={2300}>
            願いを…
          </Say>
          <Fx text="キラッ" at={1600} l={72} t={30} color="#fff" step={80} />
          <Fx text="ヒュン" at={2200} l={34} t={40} color="#c7d2fe" step={80} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="願" back="#3730a3" shout="叶え!" shoutColor="#e0e7ff" chip={chip} title={title} line={line} sparks={['#a5b4fc', '#ffffff', '#fde68a']} at={hit} />
    </Page>
  );
}

// ─── sumo ───────────────────────────────────────────────────────────────────

const Rikishi = () => (
  <svg viewBox="0 0 120 120">
    <circle cx="60" cy="26" r="16" fill="#f1c9a5" stroke={INK} strokeWidth="3" />
    <path d="M52 10 q8 -8 16 0" stroke={INK} strokeWidth="6" fill="none" />
    <ellipse cx="60" cy="70" rx="44" ry="36" fill="#f1c9a5" stroke={INK} strokeWidth="3" />
    <path d="M18 84 h84 v12 h-84z" fill="#3730a3" stroke={INK} strokeWidth="3" />
    <path d="M36 108 v10 M84 108 v10" stroke={INK} strokeWidth="10" />
    <path d="M54 26 h3 M63 26 h3" stroke={INK} strokeWidth="3" />
  </svg>
);

export function Sumo({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#f97316" id="sumo">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#3a2414, #1a0f08)" />
          <A l={50} t={84} w="96%">
            <i className="sv-dohyo" />
          </A>
          <A l={50} t={10} w="70%" m={TW.drop} d={200}>
            <i className="sv-tsuriyane" />
          </A>
          <A l={30} t={62} w="22%" m={TW.fromL} d={400} p={600} m2={{ x1: 20 }} d2={1600} p2={250} e2={EASE.in}>
            <Bot />
          </A>
          <A l={72} t={58} w="30%" m={TW.fromR} d={400} p={600} m2={{ x1: -20 }} d2={1600} p2={250} e2={EASE.in}>
            <Rikishi />
          </A>
          {range(6).map((i) => (
            <A key={i} l={44 + i * 3} t={48} m={{ y0: 0, y1: -60 - i * 6, x1: (i - 2.5) * 22, o0: 0, om: 1, o1: 0 }} d={700 + i * 60} p={900} e={EASE.soft}>
              <i className="sv-salt" />
            </A>
          ))}
          <Fx text="はっけよい!" at={1100} l={50} t={30} color="#fff" step={60} />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 30% 50%, #fde68a, #f97316 75%)" />
          <Speed hot />
          <A l={34} t={58} w="26%" m={{ x0: -60, x1: 20 }} d={2100} p={400} e={EASE.out}>
            <Bot />
          </A>
          <A l={70} t={52} w="34%" m={{ x1: '180%', y1: -60, r1: 90, ym: -40 }} d={2300} p={900} e={EASE.in}>
            <Rikishi />
          </A>
          <i className="sv-shock" style={{ left: '52%', top: '52%', '--vd': '2300ms' } as Css} />
          <Fx text="ドスコイ!!" at={2300} l={50} t={18} color="#fff" step={60} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="押" back="#9a3412" shout="押し出し!" chip={chip} title={title} line={line} sparks={['#f97316', '#fde68a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── ninja ──────────────────────────────────────────────────────────────────

const Shuriken = () => (
  <svg viewBox="0 0 40 40">
    <path d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15z" fill="#cbd5e1" stroke={INK} strokeWidth="2.5" />
    <circle cx="20" cy="20" r="4" fill={INK} />
  </svg>
);

export function Ninja({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#8b5cf6" id="ninja">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="left" rz={-1}>
          <Fill bg="linear-gradient(#120a2a, #2c1a5c)" />
          <A l={82} t={22} w="14%">
            <i className="sv-moon" />
          </A>
          <A l={50} t={86} w="110%">
            <i className="sv-roofs" />
          </A>
          <A l={10} t={60} w="18%" m={{ x0: 0, y0: 0, xm: '200%', ym: -90, x1: '420%', y1: 0 }} d={300} p={1100} e={EASE.lin} m2={{ x1: '120%', y1: -20 }} d2={1500} p2={500}>
            <Bot />
          </A>
          <Fx text="シュタッ" at={1400} l={70} t={36} color="#fff" step={70} />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#2c1a5c, #0b0618)" />
          {range(3).map((i) => (
            <A key={i} l={10} t={30 + i * 22} w="10%" m={{ x1: '800%', o0: 0, om: 1 }} d={2000 + i * 150} p={600} e={EASE.lin} loop="spin" lp={300}>
              <Shuriken />
            </A>
          ))}
          {range(3).map((i) => (
            <A key={i} l={88} t={30 + i * 22} w="8%" m={TW.pop} d={2600 + i * 150} p={250}>
              <i className="sv-hit" />
            </A>
          ))}
          <A l={40} t={60} w="30%" m={{ s0: 0.3, o0: 0, om: 1, o1: 0, s1: 1.8 }} d={3000} p={600}>
            <i className="sv-smoke" />
          </A>
          <Fx text="シュッ シュッ" at={2000} l={48} t={14} color="#e9d5ff" step={50} size="s" />
          <Fx text="ドロン" at={3000} l={40} t={84} color="#fff" step={80} />
        </Panel>
      </Stage>
      <Finale kanji="忍" back="#4c1d95" shout="任務完了!" shoutColor="#ede9fe" chip={chip} title={title} line={line} sparks={['#8b5cf6', '#ede9fe', '#cbd5e1']} at={hit} />
    </Page>
  );
}

// ─── iai: one cut ───────────────────────────────────────────────────────────

const Katana = () => (
  <svg viewBox="0 0 200 20">
    <path d="M40 10 Q120 2 198 4 Q120 12 40 14z" fill="#e5e7eb" stroke={INK} strokeWidth="2" />
    <rect x="30" y="4" width="8" height="14" fill="#c9a227" stroke={INK} strokeWidth="2" />
    <rect x="2" y="7" width="30" height="8" rx="2" fill="#1f2937" stroke={INK} strokeWidth="2" />
  </svg>
);

export function Iai({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#e5e7eb" id="iai">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={0}>
          <Fill bg="linear-gradient(#f3efe6, #d8cfbf)" />
          <Fall n={10} seed={4} kind="leaf" from={0} span={2500} />
          <A l={30} t={66} w="20%" m={TW.fade} d={200} p={800}>
            <Bot />
          </A>
          <A l={72} t={62} w="10%">
            <i className="sv-bamboo" />
          </A>
          <Say l={30} t={28} d={900}>
            …
          </Say>
          <Fx text="シーン" at={1200} l={72} t={20} color="#6b7280" step={110} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1700} outAt={hit - 150} rz={-1}>
          <Fill bg="#0b0a10" />
          <A l={50} t={50} w="92%" m={{ x0: '-60%', x1: '20%', o0: 0, om: 1, o1: 0 }} d={2100} p={350} e={EASE.out}>
            <Katana />
          </A>
          <i className="sv-cut" style={{ '--vd': '2250ms', '--var': '-14deg' } as Css} />
          <A l={50} t={36} w="14%" m={{ x1: -50, y1: -10, r1: -40, o1: 0.9 }} d={2700} p={700} e={EASE.soft}>
            <i className="sv-bamboo sv-bamboo--top" />
          </A>
          <A l={50} t={70} w="14%">
            <i className="sv-bamboo sv-bamboo--bot" />
          </A>
          <Fx text="ザンッ" at={2280} l={70} t={20} color="#fff" step={60} size="l" />
          <Fx text="チャキ" at={3100} l={24} t={82} color="#e5e7eb" step={70} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="斬" back="#374151" shout="一刀両断!" shoutColor="#f9fafb" chip={chip} title={title} line={line} sparks={['#ffffff', '#e5e7eb', '#ef4444']} at={hit} />
    </Page>
  );
}

// ─── kaiju ──────────────────────────────────────────────────────────────────

/** An original beast: a one-eyed, horned purple oni-crab with shell plates and pincers. */
const Kaiju = () => (
  <svg viewBox="0 0 140 160">
    <path d="M36 152 Q22 104 40 72 Q34 40 70 30 Q106 40 100 72 Q118 104 104 152z" fill="#6d28d9" stroke={INK} strokeWidth="3.5" />
    <path d="M44 80 Q70 66 96 80 M42 100 Q70 86 98 100 M44 122 Q70 108 96 122" stroke="#c4b5fd" strokeWidth="4" fill="none" />
    <path d="M56 34 L48 8 L64 28z M84 34 L92 8 L76 28z" fill="#f97316" stroke={INK} strokeWidth="2.5" />
    <circle cx="70" cy="50" r="11" fill="#fef08a" stroke={INK} strokeWidth="3" />
    <circle cx="72" cy="50" r="5" fill={INK} />
    <path d="M56 64 l6 6 l6 -6 l6 6 l6 -6 l6 6" stroke="#fff" strokeWidth="3" fill="none" />
    <path d="M30 86 Q4 80 6 58 Q20 62 22 52 Q30 70 38 76z M110 86 Q136 80 134 58 Q120 62 118 52 Q110 70 102 76z" fill="#f97316" stroke={INK} strokeWidth="3" />
  </svg>
);

export function KaijuS({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#a78bfa" id="kaiju">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#1a1030, #6b2a5a 70%)" />
          <City seed={9} n={9} layer="far" />
          <A l={66} t={60} w="34%" m={{ y0: 140, ym: -4, o0: 0, om: 1 }} d={300} p={1100} e={EASE.soft} loop="shake" ld={1400}>
            <Kaiju />
          </A>
          <City seed={21} n={8} layer="near" />
          <A l={58} t={30} w="40%" m={{ s0: 0, o0: 0, om: 1, sm: 1.2 }} d={1500} p={500}>
            <i className="sv-beam" />
          </A>
          <Fx text="ガオオオ!" at={1400} l={30} t={22} color="#e9d5ff" step={60} size="l" />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 40% 50%, #fef08a, #f97316 40%, #7c2d12 80%)" />
          <Speed hot />
          <A l={30} t={58} w="34%" m={{ x0: -80, s0: 0.6, x1: 30, s1: 1.2 }} d={2100} p={450} e={EASE.in}>
            <Bot />
          </A>
          <A l={74} t={56} w="30%" m={{ x1: 90, y1: -40, r1: 50, o1: 0.4 }} d={2550} p={700} e={EASE.out}>
            <Kaiju />
          </A>
          <i className="sv-shock" style={{ left: '58%', top: '52%', '--vd': '2550ms' } as Css} />
          <i className="sv-flashp" style={{ '--vd': '2550ms' } as Css} />
          <Fx text="ドカーン!!" at={2560} l={54} t={18} color="#fff" step={55} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="撃" back="#4c1d95" shout="ロボパンチ!" chip={chip} title={title} line={line} sparks={['#a78bfa', '#fef08a', '#f97316']} at={hit} />
    </Page>
  );
}

// ─── hanabi ─────────────────────────────────────────────────────────────────

function Firework({ l, t, d, c, size = 50 }: { l: number; t: number; d: number; c: string; size?: number }) {
  return (
    <>
      <A l={l} t={92} m={{ y1: `-${Math.round((92 - t) * 5.2)}px`, o0: 1, o1: 0 }} d={d} p={600} e={EASE.out}>
        <i className="sv-shell" />
      </A>
      <A l={l} t={t} w={`${size}%`} m={{ s0: 0.05, sm: 1, s1: 1.15, o0: 0, om: 1, o1: 0 }} d={d + 560} p={1500} e={EASE.out}>
        <i className="sv-burst" style={{ '--vc': c } as Css} />
      </A>
    </>
  );
}

export function Hanabi({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#f472b6" id="hanabi">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#060414, #1b1240 70%, #0b1a3a 70%)" />
          <i className="sv-stars" />
          <Firework l={30} t={26} d={500} c="#f472b6" />
          <Firework l={70} t={20} d={1100} c="#fde047" />
          <Firework l={50} t={34} d={1700} c="#38bdf8" size={60} />
          <Firework l={22} t={40} d={2300} c="#a3e635" size={40} />
          <Firework l={78} t={38} d={2700} c="#fb7185" size={44} />
          <A l={50} t={90} w="110%">
            <i className="sv-river" />
          </A>
          <A l={50} t={80} w="16%" m={TW.rise} d={300} loop="float" lp={1400} amp="3px">
            <Bot happy />
          </A>
          <A l={26} t={84} w="9%" loop="sway" lp={1100}>
            <i className="sv-lantern" />
          </A>
          <Fx text="ドーン" at={1060} l={30} t={14} color="#fde047" step={70} />
          <Fx text="パラパラ" at={1700} l={72} t={50} color="#fbcfe8" step={60} size="s" />
          <Fx text="たまやー!" at={2400} l={56} t={64} color="#fff" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="祭" back="#9d174d" shout="たまやー!" chip={chip} title={title} line={line} sparks={['#f472b6', '#fde047', '#38bdf8']} at={hit} />
    </Page>
  );
}

// ─── fuji summit ────────────────────────────────────────────────────────────

const FlagPole = () => (
  <svg viewBox="0 0 50 90">
    <path d="M6 90V4" stroke={INK} strokeWidth="4" />
    <path d="M8 6 h38 v26 h-38z" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <circle cx="27" cy="19" r="8" fill="#e11d48" />
  </svg>
);

export function Fuji({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#fb923c" id="fuji">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#1e1b4b, #7c3aed 50%, #fb923c)" />
          <A l={50} t={70} w="120%">
            <i className="sv-mount" />
          </A>
          <A l={28} t={70} w="12%" m={{ x0: 0, y0: 0, x1: '170%', y1: '-260%' }} d={300} p={2300} e={EASE.soft} loop="bob" lp={260} amp="3px">
            <Bot />
          </A>
          <Fx text="ハァハァ" at={800} l={74} t={70} color="#fff" step={90} size="s" />
          <Fx text="あと少し…" at={1700} l={30} t={22} color="#fde68a" step={80} size="s" />
        </Panel>
        <Panel {...BOT} inAt={2100} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#fde68a, #fb923c 50%, #9a3412)" />
          <A l={50} t={86} w="60%" m={{ y0: 80, o0: 0, om: 1 }} d={2200} p={1200} e={EASE.soft}>
            <i className="sv-sun sv-sun--big" />
          </A>
          <A l={50} t={100} w="120%">
            <i className="sv-cloudsea" />
          </A>
          <A l={42} t={56} w="24%" m={TW.rise} d={2300} p={500}>
            <Bot happy />
          </A>
          <A l={62} t={46} w="14%" m={{ y0: -60, o0: 0, om: 1 }} d={2600} p={300} e={EASE.in}>
            <FlagPole />
          </A>
          <Fx text="ザクッ" at={2850} l={74} t={70} color="#fff" step={70} size="s" />
          <Fx text="ご来光!" at={3000} l={50} t={16} color="#fff7ed" step={80} />
        </Panel>
      </Stage>
      <Finale kanji="頂" back="#9a3412" shout="登頂!" chip={chip} title={title} line={line} sparks={['#fb923c', '#fde68a', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── koi up the waterfall ───────────────────────────────────────────────────

const KoiFish = () => (
  <svg viewBox="0 0 120 50">
    <path d="M10 25 Q30 4 70 12 Q90 16 100 25 L118 10 L112 25 L118 40 L100 25 Q90 34 70 38 Q30 46 10 25z" fill="#fff" stroke={INK} strokeWidth="3" />
    <path d="M30 14 Q46 10 56 22 Q42 30 30 24z M66 30 Q80 26 86 32 Q76 38 66 34z" fill="#ef4444" />
    <circle cx="22" cy="22" r="3" fill={INK} />
  </svg>
);
const DragonHead = () => (
  <svg viewBox="0 0 140 120">
    <path d="M20 110 Q10 60 40 40 Q60 26 90 30 Q126 36 132 60 Q120 64 104 62 Q110 80 96 92 Q70 100 60 120z" fill="#ef4444" stroke={INK} strokeWidth="3.5" />
    <path d="M90 30 Q96 6 120 4 M70 32 Q66 10 80 0" stroke="#fde047" strokeWidth="5" fill="none" />
    <circle cx="96" cy="46" r="6" fill="#fde047" stroke={INK} strokeWidth="2" />
    <path d="M112 62 q14 10 24 4 M108 66 q10 18 26 18" stroke="#fde047" strokeWidth="3" fill="none" />
  </svg>
);

export function Koi({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ef4444" id="koi">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="linear-gradient(#0f3b2a, #1f5f44)" />
          <A l={50} t={50} w="44%">
            <i className="sv-fall" />
          </A>
          <A l={50} t={90} w="110%">
            <i className="sv-pool" />
          </A>
          <A l={18} t={78} w="18%" loop="float">
            <Bot />
          </A>
          {range(3).map((i) => (
            <A key={i} l={50} t={88} w="22%" rot={-90} m={{ x0: 0, y0: 0, ym: -200 - i * 40, y1: i === 2 ? -420 : -60, o0: 0, om: 1, o1: i === 2 ? 1 : 0, x1: (i - 1) * 30 }} d={400 + i * 600} p={1100} e={EASE.out}>
              <KoiFish />
            </A>
          ))}
          <A l={50} t={20} w="60%" m={{ s0: 0.2, sm: 1.2, s1: 1, o0: 0, om: 1 }} d={2500} p={700} loop="float" lp={700}>
            <DragonHead />
          </A>
          <Fx text="ザバァ" at={500} l={70} t={74} color="#bae6fd" step={70} />
          <Fx text="ピチピチ" at={1200} l={74} t={54} color="#fff" step={60} size="s" />
          <Fx text="龍に!" at={2700} l={28} t={36} color="#fde047" step={80} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="昇" back="#991b1b" shout="登竜門!" chip={chip} title={title} line={line} sparks={['#ef4444', '#fde047', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── maneki-neko ────────────────────────────────────────────────────────────

const Maneki = () => (
  <svg viewBox="0 0 100 120">
    <ellipse cx="50" cy="86" rx="34" ry="30" fill="#fff" stroke={INK} strokeWidth="3" />
    <circle cx="50" cy="42" r="28" fill="#fff" stroke={INK} strokeWidth="3" />
    <path d="M26 26 L24 4 L42 18z M74 26 L76 4 L58 18z" fill="#fff" stroke={INK} strokeWidth="2.5" />
    <path d="M28 18 L27 9 L36 16z M72 18 L73 9 L64 16z" fill="#fb7185" />
    <path d="M36 42 q5 -5 10 0 M54 42 q5 -5 10 0" stroke={INK} strokeWidth="3" fill="none" />
    <path d="M30 66 h40" stroke="#e11d48" strokeWidth="6" />
    <circle cx="50" cy="72" r="6" fill="#facc15" stroke={INK} strokeWidth="2" />
    <ellipse cx="50" cy="96" rx="16" ry="12" fill="#facc15" stroke={INK} strokeWidth="2.5" />
    <text x="42" y="101" fontSize="12" fill={INK}>
      福
    </text>
  </svg>
);
const Paw = () => (
  <svg viewBox="0 0 30 50">
    <path d="M6 48 V16 Q6 4 15 4 Q24 4 24 16 V48z" fill="#fff" stroke={INK} strokeWidth="3" />
    <circle cx="15" cy="14" r="4" fill="#fb7185" />
  </svg>
);

export function Maneki_({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#facc15" id="manekineko">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="radial-gradient(circle at 50% 60%, #7f1d1d, #2a0808 75%)" />
          <A l={50} t={50} w="120%" m={TW.fade} d={300} p={800}>
            <i className="sv-ray" />
          </A>
          <A l={50} t={62} w="30%" m={TW.rise} d={200} p={600}>
            <Maneki />
          </A>
          <A l={66} t={34} w="7%" m={TW.pop} d={500} loop="wobble" lp={260} origin="50% 100%">
            <Paw />
          </A>
          <Fx text="おいでおいで" at={900} l={50} t={12} color="#fde68a" step={55} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#7f1d1d, #450a0a)" />
          {range(14).map((i) => (
            <A key={i} l={6 + ((i * 37) % 90)} t={-10} w="9%" m={{ y1: 260 + (i % 4) * 20, r1: 360 * (i % 2 ? 1 : -1), o0: 0, om: 1 }} d={1900 + i * 90} p={900} e={EASE.in}>
              <i className="sv-coin" />
            </A>
          ))}
          <A l={50} t={70} w="24%" m={TW.rise} d={2000} loop="bob" lp={220}>
            <Bot happy />
          </A>
          <Fx text="チャリンチャリン" at={2100} l={50} t={20} color="#fde047" step={45} />
        </Panel>
      </Stage>
      <Finale kanji="福" back="#854d0e" shout="大当たり!" chip={chip} title={title} line={line} sparks={['#facc15', '#fff', '#ef4444']} at={hit} />
    </Page>
  );
}

// ─── daruma ─────────────────────────────────────────────────────────────────

const Daruma = ({ eyes }: { eyes: 1 | 2 }) => (
  <svg viewBox="0 0 100 110">
    <path d="M50 4 Q94 4 96 60 Q96 106 50 106 Q4 106 4 60 Q6 4 50 4z" fill="#dc2626" stroke={INK} strokeWidth="3.5" />
    <ellipse cx="50" cy="48" rx="30" ry="24" fill="#fff6e8" stroke={INK} strokeWidth="2.5" />
    <circle cx="38" cy="44" r="8" fill="#fff" stroke={INK} strokeWidth="2" />
    <circle cx="62" cy="44" r="8" fill="#fff" stroke={INK} strokeWidth="2" />
    <circle cx="38" cy="44" r="5" fill={INK} />
    {eyes === 2 && <circle cx="62" cy="44" r="5" fill={INK} />}
    <path d="M30 34 q8 -6 16 0 M54 34 q8 -6 16 0" stroke={INK} strokeWidth="3" fill="none" />
    <path d="M40 60 q10 6 20 0" stroke={INK} strokeWidth="2.5" fill="none" />
    <path d="M26 80 q24 10 48 0" stroke="#facc15" strokeWidth="4" fill="none" />
  </svg>
);
const Brush = () => (
  <svg viewBox="0 0 20 100">
    <rect x="7" y="0" width="6" height="70" fill="#8b5a2b" stroke={INK} strokeWidth="2" />
    <path d="M5 70 h10 l-3 26 q-2 4 -4 0z" fill={INK} />
  </svg>
);

export function DarumaS({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#dc2626" id="daruma">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#f6efe1, #e7dcc4)" />
          <A l={44} t={58} w="30%" m={TW.drop} d={200} p={700} loop="sway" lp={500}>
            <Daruma eyes={1} />
          </A>
          <A l={78} t={64} w="20%" m={TW.fromR} d={400}>
            <Bot />
          </A>
          <Say l={74} t={22} d={1000} tail="right">
            願い、叶った!
          </Say>
          <Fx text="コロン" at={500} l={20} t={80} color="#dc2626" step={80} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="#f6efe1" />
          <A l={50} t={56} w="44%" m={TW.zoom} d={2000} p={500}>
            <Daruma eyes={1} />
          </A>
          <A l={50} t={56} w="44%" m={TW.fade} d={2800} p={200}>
            <Daruma eyes={2} />
          </A>
          <A l={66} t={30} w="6%" rot={30} m={{ x0: 60, y0: -40, x1: 0, y1: 0, o0: 0, om: 1 }} d={2300} p={500} m2={{ x1: 8, y1: 6 }} d2={2700} p2={200} loop="shake" ld={2700}>
            <Brush />
          </A>
          <Fx text="キュッ" at={2800} l={80} t={70} color={INK} step={80} />
        </Panel>
      </Stage>
      <Finale kanji="達" back="#7f1d1d" shout="開眼!" chip={chip} title={title} line={line} sparks={['#dc2626', '#facc15', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── kendama ────────────────────────────────────────────────────────────────

const Ken = () => (
  <svg viewBox="0 0 60 120">
    <rect x="25" y="20" width="10" height="96" rx="4" fill="#d6a46b" stroke={INK} strokeWidth="2.5" />
    <path d="M30 0 v24" stroke="#c48a52" strokeWidth="6" />
    <path d="M6 40 Q30 60 54 40 v10 Q30 70 6 50z" fill="#d6a46b" stroke={INK} strokeWidth="2.5" />
  </svg>
);

export function Kendama({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#f59e0b" id="kendama">
      <Stage>
        <Panel {...TALL} inAt={120} outAt={hit - 150} from="below">
          <Fill bg="radial-gradient(circle at 50% 60%, #3b2410, #120a04 80%)" />
          <A l={50} t={50} w="120%" m={TW.fade} d={2200} p={600}>
            <i className="sv-ray" />
          </A>
          <A l={50} t={78} w="26%" m={TW.rise} d={200} loop="bob" lp={400} amp="3px">
            <Bot />
          </A>
          <A l={50} t={56} w="10%" m={TW.rise} d={400}>
            <Ken />
          </A>
          <A l={50} t={46} w="12%" m={{ y0: 0, ym: -260, y1: 0, r1: 720, o0: 0, om: 1 }} d={700} p={1500} e={EASE.soft}>
            <i className="sv-tama" />
          </A>
          <Fx text="ヒュッ" at={800} l={76} t={30} color="#fff" step={80} />
          <Fx text="カチッ!" at={2200} l={30} t={40} color="#fde68a" step={70} size="l" />
          <Fx text="とめけん!" at={2600} l={70} t={60} color="#fff" step={70} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="技" back="#92400e" shout="大成功!" chip={chip} title={title} line={line} sparks={['#f59e0b', '#ef4444', '#ffffff']} at={hit} />
    </Page>
  );
}

