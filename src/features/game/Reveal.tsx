/** The spotlight: chests bursting, capsules cracking, a new body rolling out. Off means straight to the result. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { chassisById, CHESTS, RARITY, type Bag, type ChestTier } from '../../domain/game/catalog';
import { itemKindName, itemName, plus, DEFAULT_LOADOUT } from '../../domain/game/wallet';
import { playStyle } from '../../ui/i/fx/celebrate';
import { Robot } from '../../ui/i/bots/Robot';
import { ItemThumb, lootLines, Rar } from './bits';
import { ChestArt } from './GameView';
import { showReveal, type Reveal } from './revealStore';
import { getGame, openChest } from './store';
import { useProgress } from '../../data/lt';

export function playChest(key: string, tier: ChestTier) {
  const gain = openChest(key, tier);
  if (gain) showReveal({ kind: 'chest', tier, gain });
}

export function playAllChests() {
  const list = getGame().wallet.chests;
  let gain: Bag = {};
  for (const c of list) {
    const g = openChest(c.key, c.tier);
    if (g) gain = plus(gain, g);
  }
  showReveal({ kind: 'chests', count: list.length, gain });
}

export function RevealLayer({ reveal, onClose }: { reveal: Reveal; onClose: () => void }) {
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const label = reveal.kind === 'bot' ? 'New body' : reveal.kind === 'item' ? 'New item' : reveal.kind === 'spin' ? 'Capsules' : reveal.kind === 'loot' ? reveal.title : 'Chest opened';
  return (
    <div className="gm-rv" role="dialog" aria-modal="true" aria-label={label}>
      <div className="gm-rv__box">
        {reveal.kind === 'bot' && <BotReveal chassis={reveal.chassis} mk={reveal.mk} />}
        {reveal.kind === 'item' && <ItemReveal item={reveal.item} />}
        {reveal.kind === 'chest' && <ChestReveal tier={reveal.tier} gain={reveal.gain} okRef={ok} />}
        {reveal.kind === 'chests' && <AllReveal count={reveal.count} gain={reveal.gain} />}
        {reveal.kind === 'spin' && <SpinReveal res={reveal.res} />}
        {reveal.kind === 'loot' && <LootReveal art={reveal.art} title={reveal.title} line={reveal.line} gain={reveal.gain} okRef={ok} />}
        <button ref={ok} type="button" className="i-btn i-btn--sig" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

function BotReveal({ chassis, mk }: { chassis: string; mk: 1 | 2 | 3 }) {
  const ch = chassisById(chassis);
  if (!ch) return null;
  return (
    <div className="gm-rv__bot" style={{ '--c': ch.c, '--c2': ch.c2 } as CSSProperties}>
      <span className="gm-rv__rays" aria-hidden="true" />
      <div className="gm-rv__robot i-drone">
        <Robot stage={0} look={{ ...DEFAULT_LOADOUT, chassis }} mk={mk} happy />
      </div>
      <span className="gm-rv__stamp" aria-hidden="true">
        {mk === 1 ? '完成' : '改造'}
      </span>
      <h2>{ch.name}</h2>
      <p>
        Mk {'I'.repeat(mk)} · {mk === 1 ? ch.blurb : ch.mk[mk - 2]}
      </p>
    </div>
  );
}

function ItemReveal({ item }: { item: string }) {
  const stage = useProgress().overall.stage;
  return (
    <div className="gm-rv__item">
      <ItemThumb item={item} stage={stage} />
      <h2>{itemName(item)}</h2>
      <p>{itemKindName(item)}</p>
    </div>
  );
}

function Lines({ gain }: { gain: Bag }) {
  const stage = useProgress().overall.stage;
  const lines = lootLines(gain);
  return (
    <>
      {!!gain.items?.length && (
        <div className="gm-rv__new">
          {gain.items.map((it) => (
            <div key={it} className="gm-rv__newitem">
              <ItemThumb item={it} stage={stage} />
              <b>{itemName(it)}</b>
              <small>New · {itemKindName(it)}</small>
            </div>
          ))}
        </div>
      )}
      <ul className="gm-rv__loot">
        {lines
          .filter((l) => !l.key.startsWith('i'))
          .map((l, i) => (
            <li key={l.key} style={{ '--i': i } as CSSProperties}>
              {l.node}
              <span>{l.label}</span>
            </li>
          ))}
      </ul>
    </>
  );
}

function ChestReveal({ tier, gain, okRef }: { tier: ChestTier; gain: Bag; okRef: React.RefObject<HTMLButtonElement | null> }) {
  const full = playStyle() === 'full';
  const [open, setOpen] = useState(!full);
  useEffect(() => {
    if (open) {
      okRef.current?.focus();
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 1050);
    return () => window.clearTimeout(t);
  }, [open, okRef]);
  const def = CHESTS[tier];
  return (
    <div className={`gm-rv__chest${open ? ' is-open' : ''}`} style={{ '--a': def.color } as CSSProperties} onClick={() => setOpen(true)}>
      <span className="gm-rv__rays" aria-hidden="true" />
      <div className="gm-rv__box-art">
        <ChestArt tier={tier} />
      </div>
      <h2>{def.name}</h2>
      {open && <Lines gain={gain} />}
    </div>
  );
}

function AllReveal({ count, gain }: { count: number; gain: Bag }) {
  return (
    <div className="gm-rv__chest gm-rv__chest--all is-open" style={{ '--a': '#ffc23d' } as CSSProperties}>
      <h2>
        {count} chest{count === 1 ? '' : 's'} opened
      </h2>
      <Lines gain={gain} />
    </div>
  );
}

function SpinReveal({ res }: { res: Extract<Reveal, { kind: 'spin' }>['res'] }) {
  const stage = useProgress().overall.stage;
  const full = playStyle() === 'full';
  const [shown, setShown] = useState(full ? 0 : res.capsules.length);
  useEffect(() => {
    if (shown >= res.capsules.length) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), res.capsules.length > 1 ? 260 : 700);
    return () => window.clearTimeout(t);
  }, [shown, res.capsules.length]);
  return (
    <div className="gm-rv__spin" onClick={() => setShown(res.capsules.length)}>
      <h2>{res.capsules.length === 1 ? 'A capsule' : `${res.capsules.length} capsules`}</h2>
      <div className={`gm-rv__caps gm-rv__caps--${res.capsules.length === 1 ? 'one' : 'many'}`}>
        {res.capsules.map((c, i) => (
          <div key={i} className={`gm-capres${i < shown ? ' is-open' : ''}${c.dupe ? ' is-dupe' : ''}`} style={{ '--a': RARITY[c.rarity].color } as CSSProperties}>
            {i < shown ? (
              <>
                <ItemThumb item={c.item} stage={stage} />
                <b>{itemName(c.item)}</b>
                <Rar r={c.rarity} />
                <small>{c.dupe ? 'Duplicate → Stardust' : `New · ${itemKindName(c.item)}`}</small>
              </>
            ) : (
              <span className="gm-capres__ball" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      {shown >= res.capsules.length && !!res.gain.dust && <p className="i-note">{res.gain.dust} Stardust from duplicates.</p>}
    </div>
  );
}

const LOOT_COLOR = { bag: '#ff4d6d', stamp: '#ffc23d', set: '#21e6ff', bingo: '#ffe14d', fish: '#4dd6ff' } as const;
const LOOT_SEAL = { stamp: '満', set: '揃', bingo: '当', fish: '魚' } as const;

/** A lucky bag tearing open, a stamp card handed in, a set completed. */
function LootReveal({ art, title, line, gain, okRef }: { art: keyof typeof LOOT_COLOR; title: string; line?: string; gain: Bag; okRef: React.RefObject<HTMLButtonElement | null> }) {
  const full = playStyle() === 'full';
  const [open, setOpen] = useState(!full);
  useEffect(() => {
    if (open) {
      okRef.current?.focus();
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 950);
    return () => window.clearTimeout(t);
  }, [open, okRef]);
  return (
    <div className={`gm-rv__chest gm-rv__chest--${art}${open ? ' is-open' : ''}`} style={{ '--a': LOOT_COLOR[art] } as CSSProperties} onClick={() => setOpen(true)}>
      <span className="gm-rv__rays" aria-hidden="true" />
      <div className="gm-rv__box-art">{art === 'bag' ? <BagArt /> : <span className="gm-rv__seal" aria-hidden="true">{LOOT_SEAL[art]}</span>}</div>
      <h2>{title}</h2>
      {line && <p>{line}</p>}
      {open && <Lines gain={gain} />}
    </div>
  );
}

/** A fukubukuro: a red paper bag, tied with a gold cord. */
export function BagArt() {
  return (
    <svg viewBox="0 0 64 64" className="gm-chestart" aria-hidden="true">
      <path d="M14 22 L50 22 L56 58 L8 58 Z" fill="#d7263d" stroke="#14101e" strokeWidth="3" strokeLinejoin="round" />
      <path d="M20 22 Q20 8 32 8 Q44 8 44 22" fill="none" stroke="#14101e" strokeWidth="3" />
      <path d="M12 30 H52" stroke="#ffd166" strokeWidth="4" />
      <circle cx="32" cy="44" r="10" fill="#fff4d6" stroke="#14101e" strokeWidth="2.5" />
      <text x="32" y="49" textAnchor="middle" fontSize="13" fontWeight="700" fill="#d7263d">福</text>
    </svg>
  );
}
