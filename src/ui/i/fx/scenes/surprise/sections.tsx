/** Surprise scenes that belong to a section: they only follow a save there. */
import { A, Bot, EASE, Fill, Finale, Fx, Page, Panel, Say, Speed, Stage, TW, Twinkles, range, type Css, type SurpriseProps } from './kit';
import { BOT, INK, TOP } from './layout';

// ─── violin: the concert hall ───────────────────────────────────────────────

const Violin = () => (
  <svg viewBox="0 0 40 110">
    <path d="M20 4v30" stroke={INK} strokeWidth="5" />
    <path d="M20 30c-12 0-14 10-9 18-7 4-9 16-4 26 5 10 21 10 26 0 5-10 3-22-4-26 5-8 3-18-9-18z" fill="#b4531c" stroke={INK} strokeWidth="3" />
    <path d="M15 52c1 4 1 8 0 12M25 52c-1 4-1 8 0 12" stroke={INK} strokeWidth="2" fill="none" />
    <path d="M20 34v52" stroke="#f2d39b" strokeWidth="1.5" />
    <rect x="16" y="84" width="8" height="5" fill={INK} />
  </svg>
);
const Bow = () => (
  <svg viewBox="0 0 120 12">
    <path d="M4 8 L116 4" stroke="#f6e7c8" strokeWidth="2" />
    <path d="M4 6 Q60 -4 116 2" stroke={INK} strokeWidth="3" fill="none" />
  </svg>
);
const Crowd = ({ c = '#251b2e' }: { c?: string }) => (
  <svg viewBox="0 0 300 60" preserveAspectRatio="none">
    {range(12).map((i) => (
      <g key={i} transform={`translate(${i * 26 + 4} ${i % 2 ? 8 : 4})`}>
        <circle cx="11" cy="14" r="10" fill={c} stroke={INK} strokeWidth="2" />
        <path d="M-4 60 Q11 22 26 60z" fill={c} stroke={INK} strokeWidth="2" />
      </g>
    ))}
  </svg>
);
const Note = ({ ch, c }: { ch: string; c: string }) => <span className="sv-note" style={{ color: c }}>{ch}</span>;
const Rose = () => (
  <svg viewBox="0 0 30 50">
    <path d="M15 20v28" stroke="#2f8f3a" strokeWidth="3" />
    <circle cx="15" cy="13" r="10" fill="#e23b4e" stroke={INK} strokeWidth="2.5" />
    <path d="M10 12q5-6 10 0q-5 5-10 0" fill="#ff8a96" />
  </svg>
);

export function Concert({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ffb347" id="concert">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="radial-gradient(60% 70% at 50% 100%, #6b2e1a, #200b14 70%)" />
          <A l={50} t={46} w="40%" m={{ o0: 0, om: 0.5 }} d={500} p={900}>
            <i className="sv-cone" />
          </A>
          <A l={50} t={62} w="22%" m={TW.rise} d={700} p={700} m2={{ r1: 18, rm: 22, y1: 6 }} d2={2300} p2={600} e2={EASE.back}>
            <Bot happy />
          </A>
          <A l={63} t={58} w="7%" rot={18} m={TW.pop} d={900}>
            <Violin />
          </A>
          <A l={60} t={54} w="15%" rot={-24} m={TW.pop} d={1000} loop="wobble" lp={280} origin="100% 50%">
            <Bow />
          </A>
          <A l={20} t={50} w="28%" z={3} m={{ x1: '-95%', xm: '-40%' }} d={250} p={1200} e={EASE.soft}>
            <i className="sv-curtain" />
          </A>
          <A l={80} t={50} w="28%" z={3} m={{ x1: '95%', xm: '40%' }} d={250} p={1200} e={EASE.soft}>
            <i className="sv-curtain sv-curtain--r" />
          </A>
          {['♪', '♫', '♩', '♬', '♪'].map((ch, i) => (
            <A key={i} l={30 + i * 11} t={40} m={{ y0: 30, y1: -70, o0: 0, om: 1, o1: 0, x1: (i % 2 ? 20 : -20) }} d={1100 + i * 260} p={1800} e={EASE.soft}>
              <Note ch={ch} c={['#ffd166', '#fff3c4', '#ff9f43'][i % 3]} />
            </A>
          ))}
          <i className="sv-floor" />
        </Panel>
        <Panel {...BOT} inAt={1700} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#3a1626, #12070d)" />
          <A l={50} t={84} w="104%" loop="bob" lp={260} amp="4px">
            <Crowd />
          </A>
          <A l={50} t={66} w="104%" loop="bob" lp={300} amp="3px" ld={120}>
            <Crowd c="#3b2840" />
          </A>
          {range(5).map((i) => (
            <A key={i} l={15 + i * 18} t={20} w="8%" m={{ y0: -120, y1: 70, r0: -90 * (i % 2 ? 1 : -1), r1: 200, o0: 0, om: 1 }} d={2200 + i * 160} p={900} e={EASE.in}>
              <Rose />
            </A>
          ))}
          <Fx text="パチパチ" at={2000} l={28} t={28} color="#ffe066" step={55} rot={-8} />
          <Fx text="ブラボー" at={2500} l={70} t={40} color="#fff" step={60} rot={6} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="奏" back="#9a3412" shout="アンコール!" chip={chip} title={title} line={line} sparks={['#ffd166', '#fff3c4', '#e23b4e']} at={hit} />
    </Page>
  );
}

// ─── coding: accepted ───────────────────────────────────────────────────────

const CODE = ['#include <bits/stdc++.h>', 'int main() {', '  int n; cin >> n;', '  vector<ll> dp(n + 1);', '  for (int i = 1; i <= n; i++)', '    dp[i] = max(dp[i-1], go(i));', '  cout << dp[n] << "\\n";', '}'];

export function Accepted({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#1fd17a" id="accepted">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="left" rz={-1.5}>
          <Fill bg="linear-gradient(#0b1a12, #050b08)" />
          <i className="sv-term-bar" />
          {CODE.map((c, i) => (
            <A key={i} l={8} t={18 + i * 9.5} m={{ x0: -16, o0: 0 }} d={350 + i * 190} p={220} e={EASE.lin} className="sv-code-a">
              <code className="sv-code">{c}</code>
            </A>
          ))}
          <A l={72} t={70} w="20%" m={TW.fromR} d={400} p={600} loop="shake">
            <Bot />
          </A>
          <Fx text="カタカタ" at={700} l={70} t={30} color="#9dffcb" step={60} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={1.5}>
          <Fill bg="radial-gradient(circle at 50% 40%, #0f4d2c, #04140b 75%)" />
          <A l={30} t={46} w="40%" m={TW.stamp} d={2500} p={500}>
            <span className="sv-ac">AC</span>
          </A>
          {range(5).map((i) => (
            <A key={i} l={64 + (i % 2) * 18} t={22 + Math.floor(i / 2) * 26} m={TW.pop} d={2100 + i * 140} p={300}>
              <span className="sv-tick">✓ #{i + 1}</span>
            </A>
          ))}
          <Fx text="ピコン!" at={2600} l={34} t={82} color="#9dffcb" step={60} />
        </Panel>
      </Stage>
      <Finale kanji="解" back="#065f46" shout="アクセプテッド!" shoutColor="#c9ffe2" chip={chip} title={title} line={line} sparks={['#1fd17a', '#c9ffe2', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── sports: ekiden relay ───────────────────────────────────────────────────

const Sash = () => (
  <svg viewBox="0 0 60 40">
    <path d="M4 4 L56 30 L52 38 L0 12z" fill="#e5383b" stroke={INK} strokeWidth="2.5" />
    <text x="22" y="24" fontSize="9" fill="#fff" transform="rotate(27 28 20)">襷</text>
  </svg>
);
const Flag = ({ c }: { c: string }) => (
  <svg viewBox="0 0 30 40">
    <path d="M3 2v38" stroke={INK} strokeWidth="2.5" />
    <rect x="4" y="3" width="24" height="16" fill="#fff" stroke={INK} strokeWidth="2" />
    <circle cx="16" cy="11" r="5" fill={c} />
  </svg>
);

export function Ekiden({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ff7a2f" id="ekiden">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={1}>
          <Fill bg="linear-gradient(#7cc4ff 0 55%, #3d4552 55% 100%)" />
          <i className="sv-road" />
          <Speed />
          {range(7).map((i) => (
            <A key={i} l={6 + i * 15} t={46} w="7%" loop="wobble" lp={240 + i * 30} ld={i * 50}>
              <Flag c={i % 2 ? '#e5383b' : '#1d4ed8'} />
            </A>
          ))}
          <A l={50} t={70} w="22%" m={{ x0: '-260%', xm: '10%' }} d={300} p={1100} e={EASE.out} loop="bob" lp={150} amp="6px">
            <Bot happy />
          </A>
          <A l={52} t={70} w="16%" z={2} m={{ x0: '-360%', xm: '14%' }} d={300} p={1100} e={EASE.out} loop="bob" lp={150} amp="6px">
            <Sash />
          </A>
          <Fx text="ダダダダ" at={600} l={70} t={22} color="#fff" step={50} rot={-6} />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={-2}>
          <Fill bg="linear-gradient(#ffd4a8, #ff8c42)" />
          <Speed hot />
          <A l={50} t={48} w="96%" m={{ o0: 0, om: 1, s0: 1.1 }} d={1900} p={300}>
            <i className="sv-tape" />
          </A>
          <A l={30} t={48} w="50%" m={{ x1: '-80%', r1: -30, o1: 0, om: 1 }} d={2700} p={700} e={EASE.out}>
            <i className="sv-tape sv-tape--half" />
          </A>
          <A l={70} t={48} w="50%" m={{ x1: '80%', r1: 30, o1: 0, om: 1 }} d={2700} p={700} e={EASE.out}>
            <i className="sv-tape sv-tape--half" />
          </A>
          <A l={50} t={60} w="26%" z={3} m={{ s0: 0.3, sm: 1.3, s1: 1.15, o0: 0, om: 1 }} d={2300} p={600}>
            <Bot happy />
          </A>
          <Fx text="ゴール!" at={2750} l={50} t={20} color="#fff3c4" step={70} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="駆" back="#9a3412" shout="区間賞!" chip={chip} title={title} line={line} sparks={['#ff7a2f', '#ffe0c2', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── gym: the heavy lift ────────────────────────────────────────────────────

const Barbell = () => (
  <svg viewBox="0 0 220 60">
    <rect x="10" y="27" width="200" height="6" rx="3" fill="#cfd6de" stroke={INK} strokeWidth="2" />
    {[18, 34, 168, 184].map((x, i) => (
      <rect key={i} x={x} y={i % 3 ? 10 : 4} width="14" height={i % 3 ? 40 : 52} rx="3" fill={i % 3 ? '#1d4ed8' : '#e5383b'} stroke={INK} strokeWidth="2.5" />
    ))}
  </svg>
);
const Crack = () => (
  <svg viewBox="0 0 200 40">
    <path d="M100 2 L88 14 L98 20 L80 34 M100 2 L114 16 L104 22 L126 38 M100 2 L60 10 L40 6 M100 2 L144 12 L170 8" stroke={INK} strokeWidth="3.5" fill="none" />
  </svg>
);

export function Deadlift({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ff4d4d" id="deadlift">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#2b2f3a, #14161c 70%, #3a2a1c 70%)" />
          <A l={50} t={60} w="24%" m={TW.rise} d={300} p={600} m2={{ y1: -14, ym: -16 }} d2={1500} p2={1200} e2={EASE.soft}>
            <Bot />
          </A>
          <A l={50} t={74} w="78%" m={TW.drop} d={200} p={600} m2={{ y1: -70, ym: -30 }} d2={1500} p2={1300} e2={EASE.soft} loop="shake">
            <Barbell />
          </A>
          <Fx text="ぐぬぬ…" at={900} l={22} t={24} color="#ffd6d6" step={90} size="s" />
          <Fx text="ギギギ" at={1700} l={78} t={28} color="#fff" step={70} rot={8} />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#3a2a1c 60%, #251a10 60%)" />
          <A l={50} t={42} w="80%" m={{ y0: -120, ym: 6, o0: 0, om: 1 }} d={2300} p={350} e={EASE.in}>
            <Barbell />
          </A>
          <A l={50} t={66} w="90%" m={{ s0: 0.1, sm: 1.1, o0: 0, om: 1 }} d={2620} p={300}>
            <Crack />
          </A>
          <i className="sv-shock" style={{ left: '50%', top: '62%', '--vd': '2620ms' } as Css} />
          <i className="sv-dust" style={{ '--vd': '2650ms' } as Css} />
          <Fx text="ズシン!!" at={2650} l={50} t={20} color="#ffe066" step={60} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="剛" back="#7f1d1d" shout="自己ベスト!" chip={chip} title={title} line={line} sparks={['#ff4d4d', '#ffd6d6', '#ffe066']} at={hit} />
    </Page>
  );
}

// ─── study: hanamaru ────────────────────────────────────────────────────────

const Pencil = () => (
  <svg viewBox="0 0 20 110">
    <rect x="4" y="4" width="12" height="80" fill="#ffd23f" stroke={INK} strokeWidth="2.5" />
    <rect x="4" y="4" width="12" height="10" fill="#ff8fab" stroke={INK} strokeWidth="2.5" />
    <path d="M4 84 L10 104 L16 84z" fill="#f6d7b0" stroke={INK} strokeWidth="2.5" />
    <path d="M8 98 L10 104 L12 98z" fill={INK} />
  </svg>
);
const Hanamaru = () => (
  <svg viewBox="0 0 120 120">
    {range(8).map((i) => (
      <ellipse key={i} cx="60" cy="22" rx="14" ry="22" fill="none" stroke="#e11d48" strokeWidth="4" transform={`rotate(${i * 45} 60 60)`} />
    ))}
    <circle cx="60" cy="60" r="26" fill="none" stroke="#e11d48" strokeWidth="5" />
  </svg>
);

export function Hanamaru_({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#60a5fa" id="hanamaru">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="left" rz={-1}>
          <Fill bg="linear-gradient(#8b5e3c, #5c3b22)" />
          <A l={46} t={52} w="56%" rot={-3} m={TW.rise} d={200} p={600}>
            <i className="sv-paper">
              {range(6).map((i) => (
                <i key={i} className="sv-paper__line" style={{ '--vd': `${700 + i * 220}ms` } as Css} />
              ))}
            </i>
          </A>
          <A l={30} t={30} w="5%" rot={30} m={{ x0: 0, y0: 0, xm: 140, ym: 40, x1: 20, y1: 110, o0: 0, om: 1 }} d={600} p={1600} e={EASE.soft}>
            <Pencil />
          </A>
          <A l={86} t={66} w="18%" m={TW.fromR} d={300} p={700} loop="float" lp={900}>
            <Bot />
          </A>
          <Fx text="カリカリ" at={800} l={80} t={22} color="#fff" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="#f6f1e7" />
          <i className="sv-rule" />
          <A l={34} t={50} w="38%" m={TW.spin} d={2200} p={700}>
            <Hanamaru />
          </A>
          <A l={72} t={44} w="40%" rot={-8} m={TW.stamp} d={2700} p={450}>
            <span className="sv-score">100</span>
          </A>
          <Fx text="シャッ" at={2250} l={30} t={16} color="#e11d48" step={60} />
          <Fx text="満点!" at={2800} l={74} t={84} color="#e11d48" step={80} />
        </Panel>
      </Stage>
      <Finale kanji="秀" back="#1e3a8a" shout="はなまる!" chip={chip} title={title} line={line} sparks={['#e11d48', '#ffffff', '#60a5fa']} at={hit} />
    </Page>
  );
}

// ─── chess: checkmate ───────────────────────────────────────────────────────

const Knight = ({ c = '#f6f1e7' }: { c?: string }) => (
  <svg viewBox="0 0 60 80">
    <path d="M14 74h34l-3-12H17z" fill={c} stroke={INK} strokeWidth="3" />
    <path d="M18 62c0-14 6-20 10-26-8 2-14 0-14-6 0-8 12-22 24-24 10 8 12 26 8 56z" fill={c} stroke={INK} strokeWidth="3" />
    <circle cx="30" cy="20" r="2.5" fill={INK} />
  </svg>
);
const King = ({ c = '#1b1b24' }: { c?: string }) => (
  <svg viewBox="0 0 60 100">
    <path d="M30 4v16M22 11h16" stroke={c === '#1b1b24' ? '#f6f1e7' : INK} strokeWidth="4" />
    <path d="M14 94h32l-4-14H18z M20 80c-4-20-12-28-8-40 6-14 30-14 36 0 4 12-4 20-8 40z" fill={c} stroke="#f6f1e7" strokeWidth="2.5" />
  </svg>
);

export function Checkmate({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#c9b48a" id="checkmate">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#1a1712, #0b0a08)" />
          <i className="sv-board" />
          <A l={22} t={58} w="11%" m={TW.drop} d={300} p={500} m2={{ x1: 210, y1: -20, ym: -120, xm: 105 }} d2={1300} p2={800} e2={EASE.soft}>
            <Knight />
          </A>
          <A l={76} t={50} w="10%" m={TW.drop} d={500} p={500} loop="shake" ld={2000}>
            <King />
          </A>
          <A l={50} t={20} m={TW.pop} d={2100} p={300}>
            <span className="sv-chk">CHECK</span>
          </A>
          <Fx text="カッ!" at={2050} l={84} t={26} color="#ffe066" step={60} />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 50% 70%, #3a2f1a, #0b0a08 75%)" />
          <A l={50} t={56} w="16%" m={{ r1: 88, x1: 30, y1: 24, ym: -6, rm: 30 }} d={2400} p={700} e={EASE.in}>
            <King />
          </A>
          <A l={20} t={52} w="18%" m={TW.fromL} d={2200} p={500}>
            <Bot />
          </A>
          <Fx text="コトン" at={3000} l={72} t={74} color="#f6f1e7" step={80} size="s" />
          <Fx text="詰み" at={2900} l={74} t={26} color="#ffe066" step={90} size="l" />
        </Panel>
      </Stage>
      <Finale kanji="詰" back="#5b4520" shout="チェックメイト!" shoutColor="#f6f1e7" chip={chip} title={title} line={line} sparks={['#c9b48a', '#f6f1e7', '#ffe066']} at={hit} />
    </Page>
  );
}

// ─── sleep: counting sheep ──────────────────────────────────────────────────

const Sheep = () => (
  <svg viewBox="0 0 70 50">
    <path d="M18 40v8M28 40v8M44 40v8M54 40v8" stroke={INK} strokeWidth="4" />
    <path d="M14 26c-6-6 2-16 10-12 2-8 14-8 16-2 6-6 18-2 16 6 8 2 8 14 0 16-2 8-14 8-18 4-6 4-16 4-18-2-8 0-10-8-6-10z" fill="#fff" stroke={INK} strokeWidth="3" />
    <ellipse cx="62" cy="22" rx="7" ry="9" fill="#2b2b33" stroke={INK} strokeWidth="2" />
    <circle cx="64" cy="20" r="1.6" fill="#fff" />
  </svg>
);
const Fence = () => (
  <svg viewBox="0 0 100 50">
    <path d="M12 50V8M88 50V8" stroke={INK} strokeWidth="6" />
    <path d="M4 18h92M4 34h92" stroke="#c48a52" strokeWidth="7" />
    <path d="M4 18h92M4 34h92" stroke={INK} strokeWidth="1.5" />
  </svg>
);

export function DreamSheep({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#9b8cff" id="dreamsheep">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#0d0b2a, #251a4a)" />
          <i className="sv-stars" />
          <A l={80} t={24} w="16%" m={{ y0: 40, o0: 0, om: 1 }} d={200} p={1400} e={EASE.soft}>
            <i className="sv-moon" />
          </A>
          <A l={36} t={70} w="46%" m={TW.rise} d={300} p={600}>
            <i className="sv-bed" />
          </A>
          <A l={30} t={58} w="16%" rot={-80} m={TW.fade} d={400} p={600} loop="float" lp={1400} amp="2px">
            <Bot />
          </A>
          {['Z', 'z', 'z'].map((z, i) => (
            <A key={i} l={42 + i * 7} t={40 - i * 8} m={{ y0: 20, y1: -20, o0: 0, om: 1, o1: 0, s0: 0.5, s1: 1.4 }} d={800 + i * 400} p={1600} e={EASE.soft}>
              <span className="sv-z">{z}</span>
            </A>
          ))}
          <Fx text="スヤァ…" at={1300} l={72} t={78} color="#d8d0ff" step={110} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#b8a9ff, #ffd6f0)" />
          <i className="sv-hill" />
          <A l={50} t={66} w="26%">
            <Fence />
          </A>
          {range(3).map((i) => (
            <A key={i} l={10} t={66} w="22%" m={{ x0: -40, xm: '190%', ym: -90, x1: '420%', y1: 0, o0: 0, om: 1, o1: 0 }} d={2000 + i * 500} p={1100} e={EASE.lin}>
              <Sheep />
            </A>
          ))}
          {range(3).map((i) => (
            <A key={i} l={86} t={22} m={{ o0: 0, om: 1, o1: i === 2 ? 1 : 0, s0: 1.6 }} d={2550 + i * 500} p={480}>
              <span className="sv-count">{i + 1}</span>
            </A>
          ))}
          <Fx text="メェ〜" at={2300} l={24} t={24} color="#fff" step={80} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="夢" back="#3b2a8a" shout="おやすみ…" shoutColor="#e6e0ff" chip={chip} title={title} line={line} sparks={['#9b8cff', '#e6e0ff', '#ffd6f0']} at={hit} />
    </Page>
  );
}

// ─── screen: unplugged ──────────────────────────────────────────────────────

const Phone = () => (
  <svg viewBox="0 0 60 110">
    <rect x="4" y="4" width="52" height="102" rx="9" fill="#1c1c26" stroke={INK} strokeWidth="3" />
    <rect x="9" y="12" width="42" height="84" rx="3" fill="#3b82f6" />
    <rect x="22" y="7" width="16" height="3" rx="1.5" fill="#000" />
  </svg>
);
const Plug = () => (
  <svg viewBox="0 0 120 30">
    <path d="M0 15 H70" stroke="#e5e7eb" strokeWidth="6" />
    <rect x="68" y="5" width="30" height="20" rx="4" fill="#d1d5db" stroke={INK} strokeWidth="2.5" />
    <path d="M98 10h16M98 20h16" stroke="#facc15" strokeWidth="4" />
  </svg>
);

export function Unplug({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#38bdf8" id="unplug">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="right" rz={1}>
          <Fill bg="radial-gradient(circle at 50% 50%, #12304a, #050b14 75%)" />
          <A l={50} t={52} w="18%" m={TW.zoom} d={200} p={500} loop="shake" ld={600}>
            <Phone />
          </A>
          {range(7).map((i) => (
            <A key={i} l={i % 2 ? 72 : 28} t={18 + i * 11} m={{ x0: i % 2 ? 40 : -40, s0: 0.4, o0: 0, om: 1 }} d={500 + i * 170} p={300}>
              <span className="sv-notif">{['通知 +3', 'いいね ♥', '新着 1', 'ピコン', '通知 +9', 'DM 2', '📣'][i]}</span>
            </A>
          ))}
          <Fx text="ピロンピロン" at={700} l={50} t={90} color="#ff6fae" step={45} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={-2}>
          <Fill bg="linear-gradient(#9be7ff, #e0f7ff 60%, #8fd18f 60%)" />
          <A l={72} t={28} w="14%" m={TW.pop} d={2700} p={500}>
            <i className="sv-sun" />
          </A>
          <A l={34} t={50} w="56%" m={{ x1: 70 }} d={2200} p={250} e={EASE.out}>
            <Plug />
          </A>
          <A l={62} t={50} w="10%" m={{ s0: 0.2, sm: 1.6, s1: 0.4, o0: 0, om: 1, o1: 0 }} d={2300} p={400}>
            <span className="sv-spark">✦</span>
          </A>
          <A l={22} t={68} w="22%" m={TW.rise} d={2600} p={600} loop="float" lp={1100}>
            <Bot happy />
          </A>
          <Fx text="プツン" at={2250} l={52} t={22} color="#fff" step={80} />
          <Fx text="ふぅ〜" at={2900} l={56} t={82} color="#1d4ed8" step={110} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="離" back="#075985" shout="デジタルデトックス!" shoutColor="#e0f7ff" chip={chip} title={title} line={line} sparks={['#38bdf8', '#e0f7ff', '#8fd18f']} at={hit} />
    </Page>
  );
}

// ─── cabinet: treasure ──────────────────────────────────────────────────────

const Chest = ({ lid }: { lid?: boolean }) =>
  lid ? (
    <svg viewBox="0 0 100 40">
      <path d="M4 38 Q4 4 50 4 Q96 4 96 38z" fill="#8b4a1e" stroke={INK} strokeWidth="3" />
      <path d="M30 6v32M70 6v32" stroke="#e8b84a" strokeWidth="5" />
    </svg>
  ) : (
    <svg viewBox="0 0 100 56">
      <rect x="4" y="2" width="92" height="52" fill="#a85a26" stroke={INK} strokeWidth="3" />
      <path d="M30 2v52M70 2v52" stroke="#e8b84a" strokeWidth="5" />
      <rect x="42" y="10" width="16" height="16" fill="#e8b84a" stroke={INK} strokeWidth="2" />
    </svg>
  );
const Gem = ({ c }: { c: string }) => (
  <svg viewBox="0 0 40 40">
    <path d="M8 14 L20 4 L32 14 L20 36z" fill={c} stroke={INK} strokeWidth="2.5" />
    <path d="M8 14h24M20 4v32" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
  </svg>
);
const Vase = () => (
  <svg viewBox="0 0 40 60">
    <path d="M14 4h12v8c10 6 12 20 8 34-2 8-22 8-24 0-4-14-2-28 8-34z" fill="#e8f1ff" stroke={INK} strokeWidth="2.5" />
    <path d="M10 30c6 4 14 4 20 0" stroke="#1d4ed8" strokeWidth="3" fill="none" />
  </svg>
);

export function Treasure({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ffc23d" id="treasure">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="radial-gradient(70% 80% at 50% 70%, #3a2a18, #0b0805 75%)" />
          <A l={14} t={30} w="10%" loop="flicker" lp={160}>
            <i className="sv-torch" />
          </A>
          <A l={86} t={30} w="10%" loop="flicker" lp={190}>
            <i className="sv-torch" />
          </A>
          <A l={60} t={70} w="30%" m={TW.fade} d={300} p={800}>
            <Chest />
          </A>
          <A l={30} t={66} w="20%" m={{ x0: '-200%' }} d={500} p={1300} e={EASE.soft} loop="bob" lp={220} amp="4px">
            <Bot />
          </A>
          <Say l={34} t={30} d={1700}>
            宝箱だ!
          </Say>
          <Fx text="ゴクリ" at={2000} l={78} t={24} color="#ffe9a8" step={80} size="s" />
        </Panel>
        <Panel {...BOT} inAt={2000} outAt={hit - 150} rz={2}>
          <Fill bg="radial-gradient(circle at 50% 70%, #6b4a10, #0b0805 75%)" />
          <A l={50} t={62} w="100%" m={{ o0: 0, s0: 0.4, om: 1 }} d={2500} p={700}>
            <i className="sv-ray" />
          </A>
          <A l={50} t={78} w="40%">
            <Chest />
          </A>
          <A l={50} t={56} w="40%" m={{ r1: -70, x1: -30, y1: -24, rm: -50 }} d={2350} p={450} e={EASE.back} origin="0% 100%">
            <Chest lid />
          </A>
          {[
            { el: <Gem c="#3df5e0" />, x: -70 },
            { el: <Vase />, x: 0 },
            { el: <Gem c="#ff4d6d" />, x: 70 },
          ].map((g, i) => (
            <A key={i} l={50} t={70} w="12%" m={{ y1: -90 - (i % 2) * 20, x1: g.x, s0: 0.2, o0: 0, om: 1 }} d={2550 + i * 150} p={700} loop="float" lp={900}>
              {g.el}
            </A>
          ))}
          <Fx text="キラーン" at={2600} l={50} t={14} color="#ffe066" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="宝" back="#92400e" shout="お宝ゲット!" chip={chip} title={title} line={line} sparks={['#ffc23d', '#3df5e0', '#ff4d6d']} at={hit} />
    </Page>
  );
}

// ─── future: the bullet train ───────────────────────────────────────────────

const Train = () => (
  <svg viewBox="0 0 320 60">
    <path d="M10 50 H250 Q300 50 316 34 Q290 10 220 10 H10z" fill="#f4f6fb" stroke={INK} strokeWidth="3" />
    <path d="M10 38 H262" stroke="#1d4ed8" strokeWidth="6" />
    <path d="M232 16 Q270 16 290 28 H232z" fill="#1c2340" />
    {range(8).map((i) => (
      <rect key={i} x={20 + i * 26} y="18" width="16" height="10" rx="2" fill="#1c2340" />
    ))}
  </svg>
);

export function Shinkansen({ chip, title, line, hit }: SurpriseProps) {
  const rows = [
    ['のぞみ', 'NOZOMI', '08:00'],
    ['夢', 'YOUR GOAL', 'NEXT'],
    ['未来', 'THE FUTURE', 'ON TIME'],
  ];
  return (
    <Page tc="#00b3a4" id="shinkansen">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#0d1b2a, #050a12)" />
          <A l={50} t={14} m={TW.pop} d={300} p={300}>
            <span className="sv-board-t">出発 DEPARTURES</span>
          </A>
          {rows.map((r, i) => (
            <A key={i} l={50} t={38 + i * 20} w="90%" m={{ r0: 90, rm: -10, o0: 0, om: 1 }} d={500 + i * 300} p={500} e={EASE.back}>
              <span className="sv-dep">
                <b>{r[0]}</b>
                <span>{r[1]}</span>
                <i>{r[2]}</i>
              </span>
            </A>
          ))}
          <Fx text="まもなく" at={1500} l={80} t={88} color="#9ff7ee" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1800} outAt={hit - 150} rz={-2}>
          <Fill bg="linear-gradient(#ffb27a, #ffd9b0 60%, #5b6474 60%)" />
          <i className="sv-fuji" />
          <Speed />
          <A l={50} t={62} w="150%" m={{ x0: '-120%', x1: '90%' }} d={2000} p={1300} e={EASE.lin}>
            <Train />
          </A>
          <A l={84} t={80} w="16%" m={TW.rise} d={1900} p={400} m2={{ r1: -12, x1: 10 }} d2={2200} p2={300}>
            <Bot happy />
          </A>
          <Fx text="ゴォォォ" at={2100} l={36} t={22} color="#fff" step={50} size="l" rot={-4} />
        </Panel>
      </Stage>
      <Finale kanji="翔" back="#115e59" shout="出発進行!" chip={chip} title={title} line={line} sparks={['#00b3a4', '#9ff7ee', '#ffffff']} at={hit} />
    </Page>
  );
}

// ─── reading: into the story ────────────────────────────────────────────────

const Book = () => (
  <svg viewBox="0 0 160 80">
    <path d="M80 14 Q44 0 8 10 V72 Q44 62 80 76z" fill="#fbf4e2" stroke={INK} strokeWidth="3" />
    <path d="M80 14 Q116 0 152 10 V72 Q116 62 80 76z" fill="#f4ead0" stroke={INK} strokeWidth="3" />
    {range(4).map((i) => (
      <path key={i} d={`M18 ${24 + i * 10} Q44 ${18 + i * 10} 70 ${26 + i * 10}`} stroke="#b9a986" strokeWidth="2" fill="none" />
    ))}
  </svg>
);
const Castle = () => (
  <svg viewBox="0 0 120 100">
    <path d="M10 100V50h12v-8h8v8h12V30h8v-8h20v8h8v20h12v-8h8v8h12v50z" fill="#3b2a6b" stroke={INK} strokeWidth="3" />
    <path d="M52 100V74q8-10 16 0v26z" fill="#ffd166" />
    <path d="M58 22V4l14 6-14 6" fill="#e5383b" stroke={INK} strokeWidth="2" />
  </svg>
);
const DragonS = () => (
  <svg viewBox="0 0 120 50">
    <path d="M4 30 Q20 10 40 26 T80 24 Q96 14 112 20 L118 14 L114 26 Q100 30 82 34 T42 36 Q22 44 4 30z" fill="#22c55e" stroke={INK} strokeWidth="2.5" />
    <path d="M50 26 L60 4 L66 26z M74 26 L86 8 L90 26z" fill="#16a34a" stroke={INK} strokeWidth="2" />
  </svg>
);

export function Storybook({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#c084fc" id="storybook">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="left" rz={-1}>
          <Fill bg="radial-gradient(circle at 40% 70%, #4a3220, #120b06 75%)" />
          <A l={60} t={66} w="56%" m={TW.rise} d={300} p={600}>
            <Book />
          </A>
          <A l={18} t={62} w="20%" m={TW.fromL} d={200} p={600} loop="float">
            <Bot />
          </A>
          {range(8).map((i) => (
            <A key={i} l={60} t={60} w="9%" m={{ x1: (i - 3.5) * 40, y1: -110 - (i % 3) * 20, r1: (i % 2 ? 1 : -1) * 260, o0: 0, om: 1, o1: 0 }} d={1100 + i * 110} p={1300} e={EASE.soft}>
              <i className="sv-page" />
            </A>
          ))}
          <Fx text="パラパラ" at={1100} l={58} t={20} color="#fff3c4" step={60} />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#5b21b6, #c084fc 70%, #fbf4e2 70%)" />
          <Twinkles n={14} seed={11} top={60} />
          <A l={50} t={62} w="40%" m={{ y0: 120, ym: -4, o0: 0, om: 1 }} d={2100} p={800}>
            <Castle />
          </A>
          <A l={50} t={30} w="46%" m={{ x0: '-160%', x1: '140%', ym: -30 }} d={2400} p={1300} e={EASE.lin}>
            <DragonS />
          </A>
          <Fx text="ワァ…!" at={2600} l={78} t={84} color="#fff" step={90} size="s" />
        </Panel>
      </Stage>
      <Finale kanji="読" back="#5b21b6" shout="物語の世界へ!" shoutColor="#f3e8ff" chip={chip} title={title} line={line} sparks={['#c084fc', '#fff3c4', '#22c55e']} at={hit} />
    </Page>
  );
}

// ─── maths: Q.E.D. ──────────────────────────────────────────────────────────

const EQS = ['a² + b² = c²', '∑ 1/n² = π²/6', 'e^{iπ} + 1 = 0', '∴ n(n+1)/2'];

export function Qed({ chip, title, line, hit }: SurpriseProps) {
  return (
    <Page tc="#ec4899" id="qed">
      <Stage>
        <Panel {...TOP} inAt={120} outAt={hit - 150} from="below" rz={-1}>
          <Fill bg="linear-gradient(#1f3d2c, #16301f)" />
          <i className="sv-chalkboard" />
          {EQS.map((e, i) => (
            <A key={i} l={38 + (i % 2) * 8} t={20 + i * 18} m={{ x0: -20, o0: 0, om: 0.6 }} d={400 + i * 380} p={500} e={EASE.lin}>
              <span className="sv-chalk">{e}</span>
            </A>
          ))}
          <A l={84} t={66} w="18%" m={TW.fromR} d={300} p={600} m2={{ r1: -10 }} d2={1200} p2={300} loop="bob" lp={500} amp="3px">
            <Bot />
          </A>
          <Fx text="カリカリ" at={600} l={78} t={22} color="#e8f5e9" step={70} size="s" />
        </Panel>
        <Panel {...BOT} inAt={1900} outAt={hit - 150} rz={2}>
          <Fill bg="linear-gradient(#1f3d2c, #0f2418)" />
          <A l={50} t={42} w="80%" m={{ o0: 0, om: 1, x0: -10 }} d={2100} p={400}>
            <span className="sv-chalk sv-chalk--big">∴ Q.E.D.</span>
          </A>
          <A l={84} t={44} w="12%" m={TW.stamp} d={2700} p={400}>
            <i className="sv-tomb" />
          </A>
          <A l={30} t={78} w="8%" m={{ r1: 40, y1: 20, o1: 0.2 }} d={2900} p={400} e={EASE.in}>
            <i className="sv-chalkstick" />
          </A>
          <Fx text="ポキッ" at={2900} l={42} t={78} color="#fff" step={70} size="s" />
          <Fx text="証明終了" at={2750} l={50} t={16} color="#f9a8d4" step={70} />
        </Panel>
      </Stage>
      <Finale kanji="証" back="#9d174d" shout="証明完了!" chip={chip} title={title} line={line} sparks={['#ec4899', '#ffffff', '#86efac']} at={hit} />
    </Page>
  );
}
