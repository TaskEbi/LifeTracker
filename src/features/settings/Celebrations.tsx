import { useProgress, useAchievements, useBoss, useQuests } from '../../data/lt';
import { TIERS, type Achievement } from '../../domain/progress/achievements';
import { STAGES } from '../../domain/progress/engine';
import { SECTIONS } from '../../domain/sections';
import type { SectionId } from '../../data/types';
import { celebrate, setFxMode, useFxMode, type Celebration, type FxMode } from '../../ui/i/fx/celebrate';

const MODES: { id: FxMode; label: string; hint: string }[] = [
  { id: 'full', label: 'Full', hint: '3D sequences (calm cards if the phone asks for less motion)' },
  { id: 'calm', label: 'Calm', hint: 'a simple card, no 3D' },
  { id: 'off', label: 'Off', hint: 'just the reward box' },
];

/** Settings → Celebrations: how they play on this device, and previews of each one. */
export function Celebrations() {
  const mode = useFxMode();
  const p = useProgress();
  const all = useAchievements();
  const quests = useQuests();
  const boss = useBoss().boss;

  const level = p.overall.level;
  const stage = p.overall.stage;
  const top = SECTIONS.filter((s) => s.id in p.sections).sort((a, b) => p.sections[b.id as SectionId].level - p.sections[a.id as SectionId].level)[0];
  const secLv = top ? p.sections[top.id as SectionId].level : 1;
  const daily = quests.daily.quests;
  // a real achievement of each tier: one you have if any, otherwise the next one
  const ofTier = (t: Achievement['tier']) => all.find((a) => a.tier === t && a.unlockedOn) ?? all.find((a) => a.tier === t);
  const evolveFrom = stage < STAGES.length - 1 ? stage : Math.max(0, stage - 1);

  const previews: { label: string; c: Celebration | null }[] = [
    ...TIERS.map((t) => {
      const a = ofTier(t);
      return { label: `${t[0].toUpperCase()}${t.slice(1)} emblem`, c: a ? ({ kind: 'achievement', achievement: a, preview: true } as const) : null };
    }),
    { label: `Level up · ${level} → ${level + 1}`, c: { kind: 'level', from: level, to: level + 1, preview: true } },
    { label: top ? `${top.name} · LV ${secLv + 1}` : 'Section level', c: top ? { kind: 'section-level', section: top.id, from: secLv, to: secLv + 1, preview: true } : null },
    { label: 'Daily quest', c: daily[0] ? { kind: 'quest', period: 'daily', title: daily[0].title, xp: daily[0].xp, preview: true } : null },
    { label: 'Quest sweep', c: { kind: 'quest', period: 'daily', sweep: true, title: 'All daily quests', titles: daily.map((q) => q.title), preview: true } },
    { label: `Boss · ${boss.name}`, c: { kind: 'boss', name: boss.name, bossId: boss.id, xp: 100, preview: true } },
    { label: `Transformation · ${STAGES[evolveFrom + 1]?.name ?? ''}`, c: { kind: 'evolve', from: evolveFrom, to: evolveFrom + 1, level: STAGES[evolveFrom + 1]?.level, preview: true } },
  ];
  const playable = previews.filter((x): x is { label: string; c: Celebration } => !!x.c);

  return (
    <>
      <div className="i-chips i-chips--wrap" role="group" aria-label="Celebrations · this device">
        {MODES.map((m) => (
          <button key={m.id} type="button" className="i-chip" aria-pressed={mode === m.id} onClick={() => setFxMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="i-note" style={{ marginTop: 8 }}>
        {MODES.find((m) => m.id === mode)?.hint}. Plays when a save earns a quest, a boss, an achievement, a level or a new form; plain XP keeps the quick box.
      </p>

      <div className="i-pnl" style={{ marginTop: 10 }}>
        <p className="i-note" style={{ margin: '0 0 8px' }}>
          Previews use your current level, form, quests, boss and real achievements. They are labelled on screen and add nothing.
        </p>
        <div className="i-chips i-chips--wrap" role="group" aria-label="Preview celebrations">
          {playable.map((x) => (
            <button key={x.label} type="button" className="i-chip" onClick={() => celebrate(x.c)}>
              {x.label}
            </button>
          ))}
          <button type="button" className="i-chip" onClick={() => celebrate(...playable.map((x) => x.c))}>
            Play all
          </button>
        </div>
      </div>
    </>
  );
}
