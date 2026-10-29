import { useMemo } from 'react';
import { loadSectionFonts } from '../../app/sectionLook';
import { getSleepSchedule, progressInput, sectionRecords, useAchievements, useBoss, useProgress, useQuests, useTargets, useToday } from '../../data/lt';
import { data } from '../../data/store';
import type { SectionId } from '../../data/types';
import { TIERS, type Achievement } from '../../domain/progress/achievements';
import { activeDays, rankFor, RANKS, STAGES } from '../../domain/progress/engine';
import { SECTIONS } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { Toggle } from '../../ui/i/bits';
import { celebrate, setFxMode, setFxPrefs, useFxMode, useFxPrefs, type Celebration, type FxMode } from '../../ui/i/fx/celebrate';
import { STARTER_TEMPLATES, templateOf } from '../gym/model';

const MODES: { id: FxMode; label: string; hint: string }[] = [
  { id: 'full', label: 'Full', hint: '3D sequences (calm cards if the phone asks for less motion)' },
  { id: 'calm', label: 'Calm', hint: 'a simple card, no 3D' },
  { id: 'off', label: 'Off', hint: 'just the reward box' },
];

interface Preview {
  label: string;
  c: Celebration | null;
  /** Uses made-up values (labelled on the chip). */
  sample?: boolean;
}

const play = (...cs: Celebration[]) => {
  for (const c of cs) if (c.kind === 'section-level' && SECTIONS.some((s) => s.id === c.section)) loadSectionFonts(c.section as SectionId);
  celebrate(...cs);
};

/** Settings → Celebrations: how they play on this device, and previews of each one. */
export function Celebrations() {
  const mode = useFxMode();
  const prefs = useFxPrefs();
  const p = useProgress();
  const all = useAchievements();
  const quests = useQuests();
  const boss = useBoss().boss;
  const targets = useTargets();
  const today = useToday();
  const st = useStore(data, (s) => s);

  const groups = useMemo(() => {
    const level = p.overall.level;
    const stage = p.overall.stage;
    const lv = (id: SectionId) => p.sections[id]?.level ?? 1;
    const ranked = SECTIONS.filter((s) => s.id in p.sections).sort((a, b) => lv(b.id) - lv(a.id));
    const top = ranked[0];
    const daily = quests.daily.quests;
    const monthly = quests.monthly.quests;
    // a real achievement of each tier: one you have if any, otherwise the next one
    const ofTier = (t: Achievement['tier']) => all.find((a) => a.tier === t && !a.secret && a.unlockedOn) ?? all.find((a) => a.tier === t && !a.secret);
    const secret = all.find((a) => a.secret && a.unlockedOn) ?? all.find((a) => a.secret);
    const evolveFrom = stage < STAGES.length - 1 ? stage : Math.max(0, stage - 1);
    const pv = <T extends Celebration>(c: T) => ({ ...c, preview: true }) as T;
    const moment = (m: Extract<Celebration, { kind: 'moment' }>['moment']): Celebration => ({ kind: 'moment', moment: m, preview: true });

    // a real weighted exercise from your gym templates
    const templates = sectionRecords(st, 'gym', 'gym_template').map(templateOf);
    const realEx = templates.flatMap((t) => t.exercises).find((e) => e.weight > 0);
    const ex = realEx ?? STARTER_TEMPLATES[0].exercises[0];
    const chapter = [...activeDays(progressInput(st, today))].filter((d) => d <= today).length || 1;
    const rank = rankFor(level);
    const nextRank = RANKS.find((r) => r.level > level)?.name ?? 'Legend';
    const bed = getSleepSchedule().weekday.bed;
    const screenTarget = targets.screenDay ?? 180;
    const streak = Math.max(1, p.streak.n);
    const combo = (ranked.length >= 3 ? ranked : SECTIONS).slice(0, 4).map((s) => s.id);

    const out: { name: string; items: Preview[] }[] = [
      {
        name: 'Core',
        items: [
          ...TIERS.map((t) => {
            const a = ofTier(t);
            return { label: `${t[0].toUpperCase()}${t.slice(1)} emblem`, c: a ? pv({ kind: 'achievement', achievement: a }) : null };
          }),
          { label: `Level up · ${level} → ${level + 1}`, c: pv({ kind: 'level', from: level, to: level + 1 }) },
          { label: 'Section cube · general', c: top ? pv({ kind: 'section-level', section: 'general', from: lv(top.id), to: lv(top.id) + 1 }) : null },
          { label: 'Daily quest', c: daily[0] ? pv({ kind: 'quest', period: 'daily', title: daily[0].title, xp: daily[0].xp }) : null },
          { label: 'Quest sweep', c: pv({ kind: 'quest', period: 'daily', sweep: true, title: 'All daily quests', titles: daily.map((q) => q.title) }) },
          { label: `Boss · ${boss.name}`, c: pv({ kind: 'boss', name: boss.name, bossId: boss.id, xp: 100 }) },
          { label: `Transformation · ${STAGES[evolveFrom + 1]?.name ?? ''}`, c: pv({ kind: 'evolve', from: evolveFrom, to: evolveFrom + 1, level: STAGES[evolveFrom + 1]?.level }) },
        ],
      },
      {
        name: 'Section level-ups',
        items: SECTIONS.map((s) => ({ label: `${s.name} · LV ${lv(s.id) + 1}`, c: pv({ kind: 'section-level', section: s.id, from: lv(s.id), to: lv(s.id) + 1 }) })),
      },
      {
        name: 'Records',
        items: [
          { label: `PR lift · ${ex.name}`, sample: !realEx, c: moment({ type: 'pr-lift', exercise: ex.name, weight: ex.weight + 2.5, reps: ex.reps, previous: ex.weight }) },
          { label: 'PR run · 10K', sample: true, c: moment({ type: 'pr-run', distance: '10k', pace: '4:52', previous: '5:03' }) },
          { label: 'Longest run', sample: true, c: moment({ type: 'long-run', km: 24.3, previous: 21.1 }) },
          { label: 'Distance · 500 km', sample: true, c: moment({ type: 'distance', km: 500 }) },
          { label: 'Marathon', sample: true, c: moment({ type: 'race', km: 42.2, time: '3:58:21' }) },
        ],
      },
      {
        name: 'Plans',
        items: [
          { label: 'Plan session', sample: true, c: moment({ type: 'plan-session', plan: 'marathon', title: 'Easy run · 8 km', week: 3 }) },
          { label: 'Plan week', sample: true, c: moment({ type: 'plan-week', plan: 'gym', week: 4, of: 12 }) },
          { label: 'Plan phase', sample: true, c: moment({ type: 'plan-phase', phase: 'Base', next: 'Build' }) },
        ],
      },
      {
        name: 'Days',
        items: [
          { label: `Streak · ${streak} ${streak === 1 ? 'day' : 'days'}`, c: moment({ type: 'streak', days: streak }) },
          { label: `Chapter · 第${chapter}話`, c: moment({ type: 'chapter', n: chapter }) },
          { label: `Combo · ${combo.length} hit`, sample: ranked.length < 3, c: moment({ type: 'combo', sections: combo }) },
          { label: 'Rest day', c: moment({ type: 'rest', streak }) },
          { label: 'Comeback', sample: true, c: moment({ type: 'comeback', gap: 4 }) },
          { label: `Good night · ${bed}`, sample: true, c: moment({ type: 'good-night', bed, streak: 5 }) },
          { label: 'Screen zen', sample: true, c: moment({ type: 'screen-zen', minutes: Math.round(screenTarget * 0.7), target: screenTarget }) },
          { label: 'Tasks clear', sample: true, c: moment({ type: 'tasks-clear', count: 4 }) },
          { label: `Focus · ${top?.name ?? 'Study'}`, sample: true, c: moment({ type: 'focus', section: (top?.id as SectionId) ?? 'study', minutes: 45 }) },
        ],
      },
      {
        name: 'Special',
        items: [
          { label: 'Secret emblem', c: secret ? pv({ kind: 'achievement', achievement: secret }) : null },
          { label: 'Monthly quest', c: monthly[0] ? pv({ kind: 'quest', period: 'monthly', title: monthly[0].title, xp: monthly[0].xp }) : null },
          { label: `Critical hit · ${boss.name}`, sample: true, c: moment({ type: 'boss-crit', damage: 120, boss: boss.name }) },
          { label: `Rank · ${nextRank}`, c: moment({ type: 'rank', from: rank, to: nextRank }) },
        ],
      },
    ];
    return out.map((g) => ({ ...g, items: g.items.filter((x): x is Preview & { c: Celebration } => !!x.c) }));
  }, [p, all, quests, boss, targets, today, st]);

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
        {MODES.find((m) => m.id === mode)?.hint}. Plays when a save earns a quest, a boss, an achievement, a level or a new form, or sets a record; plain XP keeps the quick box.
      </p>

      {mode !== 'off' && (
        <div style={{ marginTop: 8 }}>
          <Toggle on={prefs.chapter} label="Chapter card on the first log of the day" hint="a short 第N話 page turn" onChange={(chapter) => setFxPrefs({ chapter })} />
        </div>
      )}

      <div className="i-pnl" style={{ marginTop: 10 }}>
        <p className="i-note" style={{ margin: '0 0 8px' }}>
          Previews use your level, sections, form, quests, boss, rank and real achievements; chips marked “sample” use made-up numbers. They are labelled on screen and add nothing.
        </p>
        {groups.map((g) => (
          <div key={g.name} style={{ marginTop: 10 }}>
            <p className="i-note" style={{ margin: '0 0 6px', fontWeight: 700 }}>
              {g.name}
            </p>
            <div className="i-chips i-chips--wrap" role="group" aria-label={`Preview celebrations · ${g.name}`}>
              {g.items.map((x) => (
                <button key={x.label} type="button" className="i-chip" onClick={() => play(x.c)}>
                  {x.label}
                  {x.sample ? ' · sample' : ''}
                </button>
              ))}
              <button type="button" className="i-chip" onClick={() => play(...g.items.map((x) => x.c))}>
                Play all
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
