/**
 * 賞, the Rewards tab: the monthly Hangar Pass and a prize for every achievement (rewards.ts).
 * Everything here is claimed by hand, so each prize gets its moment.
 */
import type { CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { ACH_XP, type Chassis } from '../../domain/game/catalog';
import type { Loadout } from '../../domain/game/wallet';
import { ACH_PRIZE, PASS_STEP, PASS_TIERS, SKIN_IDS, SKINS, skinItem, skinLock, type AchTier, type PassState } from '../../domain/game/rewards';
import { lootLines, num, Price, Thumb } from './bits';
import { evolveBot, showReveal } from './revealStore';
import { buySkin, claimAch, claimPass, useRewards, wearSkin, type Bodies, type GameState } from './store';
import './rewards.css';

const TIER_INFO: Record<AchTier, { name: string; color: string; kanji: string }> = {
  bronze: { name: 'Bronze', color: '#d08a4f', kanji: '銅' },
  silver: { name: 'Silver', color: '#c9d3de', kanji: '銀' },
  gold: { name: 'Gold', color: '#ffc23d', kanji: '金' },
  platinum: { name: 'Platinum', color: '#9ef0ff', kanji: '白' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

export function RewardsTab() {
  const r = useRewards();
  return (
    <>
      <p className="i-note">Two more ways to get paid. The pass fills with the XP you earn from your records this month; every achievement you unlock has a prize, with XP in it.</p>
      {r.passes.map((p, i) => (
        <PassCard key={p.month} p={p} last={i > 0} />
      ))}
      <AchPrizes />
    </>
  );
}

function PassCard({ p, last }: { p: PassState; last: boolean }) {
  const ready = p.tiers.filter((t) => t.reached && !t.claimed);
  const next = p.tiers.find((t) => !t.reached);
  const claimAll = () => {
    const gain = claimPass(undefined, p.month);
    if (gain) showReveal({ kind: 'loot', art: 'pass', title: `${monthName(p.month)} pass`, line: `${ready.length} tier${ready.length === 1 ? '' : 's'} claimed`, gain });
  };
  return (
    <section className="gm-pass" aria-label={`${monthName(p.month)} Hangar Pass`}>
      <header className="gm-pass__head">
        <span className="gm-pass__k" aria-hidden="true">
          月
        </span>
        <span className="gm-pass__t">
          <b>Hangar Pass · {monthName(p.month)}</b>
          <small>
            Tier {p.reached} of {PASS_TIERS} · {num(p.xp)} XP this month
            {next ? ` · ${num(PASS_STEP - p.into)} XP to tier ${next.n}` : ' · complete!'}
          </small>
          <span className="gm-bar" role="progressbar" aria-label="Towards the next tier" aria-valuemin={0} aria-valuemax={PASS_STEP} aria-valuenow={next ? p.into : PASS_STEP}>
            <i style={{ width: `${next ? (p.into / PASS_STEP) * 100 : 100}%` }} />
          </span>
        </span>
      </header>
      {ready.length > 0 && (
        <button type="button" className="i-btn i-btn--sig" onClick={claimAll}>
          Claim {ready.length === 1 ? 'tier' : `all ${ready.length} tiers`}
        </button>
      )}
      {last && <p className="i-note">Last month's pass: claim what's left before this month ends.</p>}
      <ol className="gm-pass__track">
        {p.tiers.map((t) => {
          const lines = lootLines(t.gain);
          const big = t.n % 5 === 0;
          const state = t.claimed ? 'is-got' : t.reached ? 'is-ready' : '';
          return (
            <li key={t.n} className={`gm-pass__tier ${state}${big ? ' is-big' : ''}`}>
              <button
                type="button"
                disabled={!t.reached || t.claimed}
                aria-label={`Tier ${t.n}: ${lines.map((l) => l.label).join(', ')}${t.claimed ? ', claimed' : t.reached ? ', ready to claim' : ''}`}
                onClick={() => {
                  const gain = claimPass(t.ref);
                  if (gain) showReveal({ kind: 'loot', art: 'pass', title: `Pass tier ${t.n}`, gain });
                }}
              >
                <span className="gm-pass__n">{t.n}</span>
                <span className="gm-pass__loot">{lines.slice(0, 2).map((l) => <span key={l.key}>{l.node}</span>)}</span>
                {lines.length > 2 && <small>+{lines.length - 2}</small>}
                {t.claimed && <span className="gm-pass__tick" aria-hidden="true">✓</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AchPrizes() {
  const r = useRewards();
  const all = () => {
    const got = claimAch();
    if (got) showReveal({ kind: 'loot', art: 'emblem', title: `${got.n} emblem prize${got.n === 1 ? '' : 's'}`, line: `+${num(got.xp)} XP`, gain: got.gain });
  };
  return (
    <section className="gm-achp" aria-label="Emblem prizes">
      <h3 className="gm-hall__h">
        Emblem prizes <small>{r.ach.length ? `${r.ach.length} waiting` : 'all claimed'}</small>
      </h3>
      <div className="gm-achp__key">
        {(Object.keys(ACH_PRIZE) as AchTier[]).map((t) => (
          <span key={t} style={{ '--a': TIER_INFO[t].color } as CSSProperties}>
            <i aria-hidden="true">{TIER_INFO[t].kanji}</i>
            <b>{TIER_INFO[t].name}</b>
            <small>
              +{ACH_XP[t]} XP · {lootLines(ACH_PRIZE[t]).map((l) => l.label).join(', ')}
            </small>
          </span>
        ))}
      </div>
      {r.ach.length > 1 && (
        <button type="button" className="i-btn i-btn--sig" onClick={all}>
          Claim all {r.ach.length}
        </button>
      )}
      {r.ach.length ? (
        <div className="gm-sets">
          {r.ach.slice(0, 40).map((a) => (
            <div key={a.ref} className="gm-set is-ready" style={{ '--a': TIER_INFO[a.tier].color } as CSSProperties}>
              <span className="gm-set__k" aria-hidden="true">
                {TIER_INFO[a.tier].kanji}
              </span>
              <span className="gm-set__t">
                <b>{a.title}</b>
                <small>
                  {TIER_INFO[a.tier].name} · +{a.xp} XP · {lootLines(a.gain).map((l) => l.label).join(', ')}
                </small>
              </span>
              <span className="gm-set__do">
                <button
                  type="button"
                  className="i-btn i-btn--sm i-btn--sig"
                  onClick={() => {
                    const got = claimAch(a.ref);
                    if (got) showReveal({ kind: 'loot', art: 'emblem', title: a.title, line: `${TIER_INFO[a.tier].name} emblem · +${got.xp} XP`, gain: got.gain });
                  }}
                >
                  Claim
                </button>
              </span>
            </div>
          ))}
          {r.ach.length > 40 && <p className="i-note">And {r.ach.length - 40} more: “Claim all” takes them together.</p>}
        </div>
      ) : (
        <p className="i-note">
          Unlock an emblem and its prize waits here.{' '}
          <button type="button" className="i-link" onClick={() => navigate('progress', ['achievements'])}>
            See the emblems ▶
          </button>
        </p>
      )}
    </section>
  );
}

/** In a body's card: its True Silver and True Gold, to buy and to wear. */
export function SkinPanel({ ch, b, g, look, mk }: { ch: Chassis; b: Bodies; g: GameState; look: Loadout; mk: 1 | 2 | 3 }) {
  const level = b.stats.get(ch.id)?.level ?? 1;
  const worn = look.skins?.[ch.id] ?? null;
  const owns = (it: string) => g.wallet.items.has(it);
  return (
    <div className="gm-skins">
      <h3 className="gm-hall__h">
        True skins <small>body level {SKINS.silver.level} and {SKINS.gold.level}</small>
      </h3>
      <div className="gm-skins__row">
        <button type="button" className="gm-skin" aria-current={!worn} style={{ '--a': 'var(--fg-2)' } as CSSProperties} onClick={() => wearSkin(ch.id, null)}>
          <Thumb look={{ chassis: ch.id }} mk={mk} />
          <b>Standard</b>
          <small>{worn ? 'Wear' : 'Wearing'}</small>
        </button>
        {SKIN_IDS.map((s) => {
          const skin = SKINS[s];
          const have = owns(skinItem(ch.id, s));
          const lock = have ? null : skinLock(s, level, owns, ch.id, mk);
          return (
            <div key={s} className={`gm-skin${!have && lock ? ' is-locked' : ''}`} aria-current={worn === s} style={{ '--a': skin.c2 } as CSSProperties}>
              <Thumb look={{ chassis: ch.id, skins: { [ch.id]: s } }} mk={mk} />
              <b>
                {skin.kanji} {skin.name}
              </b>
              {have ? (
                <button type="button" className="i-btn i-btn--sm" aria-pressed={worn === s} onClick={() => wearSkin(ch.id, worn === s ? null : s)}>
                  {worn === s ? 'Wearing' : 'Wear'}
                </button>
              ) : lock ? (
                <small>{lock}</small>
              ) : (
                <>
                  <Price cost={skin.cost} w={g.wallet} />
                  <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => buySkin(ch.id, s) && evolveBot({ chassis: ch.id, mk, skin: s })}>
                    Cast it
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="i-note">Cast in solid metal, with light that moves across it. A skin replaces paint while it's on; the paint comes back when you take it off.</p>
    </div>
  );
}
