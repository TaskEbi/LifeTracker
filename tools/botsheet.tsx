/**
 * Dev tool: a contact sheet of robot art. /tools/botsheet.html?reg=folklore&theme=dark&only=tanuki
 * Run with `node tools/botsheet.mjs folklore out.png` against a dev server on port 5199.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState, type CSSProperties } from 'react';
import '../src/styles/instrument.css';
import '../src/features/home/living.css';
import type { BotRegistry } from '../src/ui/i/bots/types';
import { HAT_ART, PET_ART, AURA_ART } from '../src/ui/i/bots/gear';
import { CHASSIS, STAGE_COLOURS } from './botsheetData';

const q = new URLSearchParams(location.search);
const reg = q.get('reg') ?? 'forms';
const dark = q.get('theme') !== 'light';
const only = q.get('only')?.split(',');
const animate = q.has('animate');

const vars = (dark
  ? { '--fg': '#f4f1ea', '--surf': '#16161b', '--surf-2': '#1f1f26', '--bg': '#0b0b0d', '--fg-2': '#bab6c3' }
  : { '--fg': '#111111', '--surf': '#ffffff', '--surf-2': '#ebe7de', '--bg': '#f4f1ea', '--fg-2': '#3d3a36' }) as CSSProperties;

const LOAD: Record<string, () => Promise<Record<string, BotRegistry>>> = {
  forms: () => import('../src/ui/i/bots/forms') as never,
  folklore: () => import('../src/ui/i/bots/chassisFolklore') as never,
  toys: () => import('../src/ui/i/bots/chassisToys') as never,
  cosmic: () => import('../src/ui/i/bots/chassisCosmic') as never,
  tribute: () => import('../src/ui/i/bots/chassisTribute') as never,
  event: () => import('../src/ui/i/bots/chassisEvent') as never,
};

const box: CSSProperties = { width: 200, textAlign: 'center', font: '12px sans-serif', color: 'var(--fg)' };
const Svg = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 200 200" width={200} height={200} style={{ overflow: 'visible' }}>{children}</svg>;

function Sheet() {
  const [r, setR] = useState<BotRegistry | null>(null);
  useEffect(() => {
    if (reg in LOAD) LOAD[reg]().then((m) => setR(Object.values(m)[0]));
  }, []);
  const cell = (key: string, label: string, node: React.ReactNode) => (
    <div key={key} style={box}>
      {node}
      <div>{label}</div>
    </div>
  );
  let cells: React.ReactNode[] = [];
  if (reg === 'hats' || reg === 'pets' || reg === 'auras') {
    const map = (reg === 'hats' ? HAT_ART : reg === 'pets' ? PET_ART : AURA_ART) as Record<string, (p: { c: string; c2: string; uid: string; still: boolean }) => React.ReactElement>;
    cells = Object.entries(map).filter(([k]) => !only || only.includes(k)).map(([k, A]) => cell(k, k, (
      <Svg>
        {reg === 'hats' && <><circle cx="100" cy="130" r="30" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="3" /><g transform="translate(100 100) scale(1)"><A c="#ef4444" c2="#fbbf24" uid={`h${k}`} still={!animate} /></g></>}
        {reg === 'pets' && <g transform="translate(100 100) scale(4)"><A c="#ef4444" c2="#fbbf24" uid={`p${k}`} still={!animate} /></g>}
        {reg === 'auras' && <><A c="#ef4444" c2="#fbbf24" uid={`a${k}`} still={!animate} /><circle cx="100" cy="100" r="34" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="3" /></>}
      </Svg>
    )));
  } else if (r) {
    const keys = Object.keys(r).filter((k) => !only || only.includes(k));
    if (reg === 'forms') {
      cells = keys.map((k) => {
        const D = r[k];
        const col = STAGE_COLOURS[k];
        return cell(k, k, <Svg><D.Art c={col?.c ?? '#f00'} c2={col?.c2 ?? '#ff0'} uid={`u${k}`} still={!animate} happy={false} mk={3} /><path d={`M${D.head.x - 8} ${D.head.y} h16`} stroke="#0ff" strokeWidth="2" /></Svg>);
      });
    } else {
      cells = keys.flatMap((k) => {
        const D = r[k];
        const ch = CHASSIS.find((x) => x.id === k);
        return ([1, 2, 3] as const).map((mk) =>
          cell(`${k}${mk}`, `${k} · Mk ${mk}`, <Svg><D.Art c={ch?.c ?? '#f00'} c2={ch?.c2 ?? '#ff0'} uid={`u${k}${mk}`} still={!animate} happy={false} mk={mk} />{mk === 1 && <path d={`M${D.head.x - 8} ${D.head.y} h16`} stroke="#0ff" strokeWidth="2" />}</Svg>),
        );
      });
    }
  }
  return <div id="sheet" style={{ ...vars, background: 'var(--bg)', display: 'grid', gridTemplateColumns: `repeat(${q.get('cols') ?? 6}, 200px)`, gap: 10, padding: 10, width: 'max-content' }}>{cells}</div>;
}
createRoot(document.getElementById('root')!).render(<Sheet />);
