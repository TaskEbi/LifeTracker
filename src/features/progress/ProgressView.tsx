import { useMemo, useState, type CSSProperties } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate, useRoute, type RouteName } from '../../app/router';
import { takeRestDay, useAchievements, useProgress, useQuests, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { rankFor, RANKS, RULES, sectionRankFor, STAGES, type XpSection } from '../../domain/progress/engine';
import { BOSS_XP } from '../../domain/progress/boss';
import { QUEST_XP, QUESTS_FROM, SWEEP_XP } from '../../domain/progress/quests';
import { SECTIONS, sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Seg } from '../../ui/i/bits';
import { Drone } from '../../ui/i/Drone';
import { Icon } from '../../ui/i/Icon';
import { AchievementsPanel } from './AchievementsPanel';
import { BossPanel } from './BossPanel';
import { LookBack } from './LookBack';
import { QuestCard, QuestsPanel } from './QuestsPanel';
import './progress.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const secName = (s: XpSection) => (s === 'general' ? 'Other topics' : s === 'quests' ? 'Quests' : sectionInfo(s).name);

/** How XP is earned, in plain words, from the same numbers the engine uses. */
const RULE_LINES: [string, string][] = [
  ['Any timed session', `1 XP per ${RULES.minutesPerXp} min, up to ${RULES.timeCapPerEntry} per session and ${RULES.timeCapPerDay} per section per day, plus ${RULES.entryLogged} for logging it`],
  ['Gym session finished', `${RULES.gymCompleted} XP, 1 per set done (capped at the plan, max ${RULES.gymSetsCap}), ${RULES.gymCheckIn} for the check-in`],
  ['Weekly targets', `violin ${RULES.violinWeekTarget}, gym ${RULES.gymWeekTarget}, sports ${RULES.sportsWeekTarget}, uni prep ${RULES.futureWeekTarget} XP when the week's target is met`],
  ['Sleep', `${RULES.nightLogged} XP per night logged, ${RULES.bedtimeKept} more for bed within ${RULES.bedtimeWindow} min of the schedule`],
  ['Screen time', `${RULES.screenLogged} XP for logging the day, ${RULES.screenUnderTarget} more under the target`],
  ['Tasks', `${RULES.taskDone} XP per task completed`],
  ['Cabinet', `${RULES.cabinetItem} XP per item saved, up to ${RULES.cabinetPerDay} a day`],
  ['Quests', `daily ${QUEST_XP.daily}, weekly ${QUEST_XP.weekly}, monthly ${QUEST_XP.monthly} XP each; clearing all three adds ${SWEEP_XP.daily} / ${SWEEP_XP.weekly} / ${SWEEP_XP.monthly}`],
  ['Weekly boss', `${BOSS_XP} XP for defeating the week's boss (Progress → Raid)`],
  ['Rest day', 'No XP; keeps the streak going'],
];

const TABS = [
  { id: '', label: 'Overview', kanji: '覚' },
  { id: 'quests', label: 'Quests', kanji: '任' },
  { id: 'boss', label: 'Raid', kanji: '討' },
  { id: 'achievements', label: 'Emblems', kanji: '紋' },
] as const;

export function ProgressView() {
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[0] ?? ''))?.id ?? '';
  const p = useProgress();
  const quests = useQuests();
  const ach = useAchievements();
  const openQuests = quests.daily.quests.filter((q) => !q.doneOn).length;
  const unlocked = ach.filter((a) => a.unlockedOn).length;

  return (
    <div className="pg">
      <ChannelBar current="progress" />
      <header className="pg-head">
        <span className="pg-head__kanji" aria-hidden="true">
          覚醒
        </span>
        <div>
          <span className="i-chhead__k">
            {rankFor(p.overall.level)} · LV {p.overall.level}
          </span>
          <h1>Progress</h1>
          <p className="pg-head__sub">Awakening · {STAGES.length} forms</p>
        </div>
        <div className="pg-head__xp">{p.total.toLocaleString('en-GB')} XP</div>
      </header>
      <nav className="pg-tabs" aria-label="Progress sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="pg-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('progress', t.id ? [t.id] : [], { replace: true })}>
            <span className="pg-tab__k" aria-hidden="true">
              {t.kanji}
            </span>
            <span>{t.label}</span>
            {t.id === 'quests' && openQuests > 0 && <i className="pg-tab__n">{openQuests}</i>}
            {t.id === 'achievements' && <i className="pg-tab__n pg-tab__n--dim">{unlocked}</i>}
          </button>
        ))}
      </nav>
      {tab === 'quests' ? <QuestsPanel /> : tab === 'boss' ? <BossPanel /> : tab === 'achievements' ? <AchievementsPanel /> : <Overview />}
    </div>
  );
}

function Overview() {
  const p = useProgress();
  const ach = useAchievements();
  const quests = useQuests();
  const today = useToday();
  const marks = useStore(data, (s) => s.lt_day_marks);
  const [filter, setFilter] = useState<XpSection | 'all'>('all');
  const [more, setMore] = useState(false);
  const restToday = [...marks.values()].some((m) => !m.deleted_at && m.kind === 'rest' && m.date === today);
  const loggedToday = p.events.some((e) => e.date === today);
  const recent = useMemo(() => [...p.events].filter((e) => filter === 'all' || e.section === filter).sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp), [p.events, filter]);
  const unlocked = ach.filter((a) => a.unlockedOn).length;
  const stage = STAGES[p.overall.stage];
  const next = STAGES[p.overall.stage + 1];
  const nextRank = RANKS.find((r) => r.level > p.overall.level);
  const dailyDone = quests.daily.quests.filter((q) => q.doneOn).length;
  const stageStyle = { '--c': stage.c, '--c2': stage.c2 } as CSSProperties;

  return (
    <>
      <section className="pg-hero" style={stageStyle} aria-label="Your character">
        <div className="pg-hero__drone i-drone">
          <Drone stage={p.overall.stage} />
        </div>
        <div className="pg-hero__txt">
          <span className="pg-hero__form">
            Form {p.overall.stage + 1} of {STAGES.length} · {stage.name}
          </span>
          <b className="pg-hero__rank">{rankFor(p.overall.level)}</b>
          <span className="pg-hero__lv">
            LV <b>{p.overall.level}</b>
          </span>
          <Seg pct={p.overall.pct} label="Overall level progress" />
          <span className="i-mono i-small">
            {p.overall.into.toLocaleString('en-GB')}/{p.overall.need.toLocaleString('en-GB')} XP
          </span>
          <ul className="pg-hero__next">
            <li>
              <Icon name="bolt" size={14} />
              {next ? `${next.name} form at LV ${next.level}` : 'Final form reached'}
            </li>
            {nextRank && (
              <li>
                <Icon name="progress" size={14} />
                {nextRank.name} rank at LV {nextRank.level}
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="i-meters i-meters--4 pg-stats">
        <Meter value={<span className="pg-stat" style={{ '--c': 'var(--sig)' } as CSSProperties}><Icon name="flame" size={18} />{p.streak.n}<small>d</small></span>} label={`Streak${p.streak.today ? ' · today counted' : p.streak.held ? ' · buffer used, log today' : ' · log or rest today'}`} />
        <Meter value={<span className="pg-stat" style={{ '--c': 'var(--acc2)' } as CSSProperties}><Icon name="quest" size={18} />{dailyDone}<small>/3</small></span>} label="Daily quests" onClick={() => navigate('progress', ['quests'], { replace: true })} />
        <Meter value={<span className="pg-stat" style={{ '--c': 'var(--t-gold)' } as CSSProperties}><Icon name="trophy" size={18} />{unlocked}<small>/{ach.length}</small></span>} label="Emblems" onClick={() => navigate('progress', ['achievements'], { replace: true })} />
        <Meter value={<span className="pg-stat" style={{ '--c': 'var(--fg-2)' } as CSSProperties}><Icon name="bolt" size={18} />{p.total.toLocaleString('en-GB')}</span>} label="Total XP" />
      </div>
      <div className="pg-rest">
        {restToday ? (
          <p className="i-note">Today is a rest day. The streak is kept; nothing else is needed.</p>
        ) : loggedToday ? (
          <p className="i-note">Today already counts towards the streak.</p>
        ) : (
          <>
            <button type="button" className="i-btn i-btn--sm" onClick={() => takeRestDay()}>
              Take a rest day
            </button>
            <span className="i-note">Planned rest keeps the streak. No XP, no guilt.</span>
          </>
        )}
      </div>

      <H2
        aside={
          <button type="button" className="i-link" onClick={() => navigate('progress', ['quests'], { replace: true })}>
            All missions ▶
          </button>
        }
      >
        Today's training
      </H2>
      <div className="pg-quests">
        {quests.daily.quests.map((q) => (
          <QuestCard key={q.key} q={q} now={q === quests.daily.quests.find((x) => !x.doneOn)} />
        ))}
      </div>

      <LookBack />

      <H2 aside={`${p.overall.stage + 1} of ${STAGES.length} unsealed`}>Transformations</H2>
      <ol className="pg-forms" aria-label="Forms">
        {STAGES.map((f, i) => {
          const on = i <= p.overall.stage;
          const now = i === p.overall.stage;
          const next = i === p.overall.stage + 1;
          return (
            <li
              key={f.name}
              className={now ? 'is-now' : on ? 'is-on' : next ? 'is-next' : ''}
              style={{ '--c': f.c, '--c2': f.c2, '--i': i } as CSSProperties}
              aria-label={`Form ${i + 1}, ${on || next ? f.name : 'sealed'}: ${now ? 'current form' : on ? 'unlocked' : `from level ${f.level}`}`}
            >
              <span className="pg-forms__n">{pad2(i + 1)}</span>
              <span className="pg-forms__d" aria-hidden="true">
                <Drone stage={i} still label={false} />
              </span>
              <b>{on || next ? f.name : '？？？'}</b>
              <small>{now ? '▶ Now' : on ? 'Unlocked' : `LV ${f.level}`}</small>
            </li>
          );
        })}
      </ol>

      <H2>Sections</H2>
      <div className="pg-secs">
        {SECTIONS.map((s) => {
          const lv = p.sections[s.id];
          return (
            <button key={s.id} type="button" className="pg-sec" style={accent(s.id)} onClick={() => navigate(s.id as RouteName)} aria-label={`${s.full}: level ${lv.level}, ${lv.into} of ${lv.need} XP`}>
              <span className="pg-sec__k" aria-hidden="true">
                {s.kanji}
              </span>
              <span className="pg-sec__top">
                <span className="pg-sec__lv">LV {pad2(lv.level)}</span>
              </span>
              <b>{s.name}</b>
              <small className="pg-sec__rank">{sectionRankFor(lv.level)}</small>
              <Seg pct={lv.pct} n={10} thin />
              <small className="i-mono">{p.bySection[s.id]} XP</small>
            </button>
          );
        })}
      </div>
      {p.bySection.general > 0 && <p className="i-note" style={{ marginTop: 6 }}>{p.bySection.general} XP from Daily Log topics not mapped to a section counts towards the overall level only. Map them in Settings.</p>}

      <H2>Recent XP</H2>
      <Chips
        label="Section"
        value={filter}
        onChange={setFilter}
        options={[{ id: 'all' as const, label: 'All' }, { id: 'quests' as const, label: 'Quests' }, ...SECTIONS.map((s) => ({ id: s.id, label: s.name, c: s.id })), { id: 'general' as const, label: 'Other' }]}
      />
      <div className="i-pnl i-pnl--flush">
        {recent.length ? (
          recent.slice(0, more ? 40 : 8).map((e) => (
            <div key={e.key} className="i-row" style={accent(e.section)}>
              <span className="i-row__t">
                <b>{e.reason}</b>
                <small>
                  {secName(e.section)} · {shortDay(e.date)}
                </small>
              </span>
              <span className="i-row__n pg-xp">+{e.xp}</span>
            </div>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No XP here yet.</p>
        )}
      </div>
      {recent.length > 8 && (
        <button type="button" className="i-link" onClick={() => setMore(!more)}>
          {more ? 'Show fewer' : `Show more (${Math.min(40, recent.length) - 8})`}
        </button>
      )}

      <details className="pg-rules">
        <summary>
          <span className="i-lab">How XP works</span>
        </summary>
        <div className="i-pnl i-pnl--flush">
          {RULE_LINES.map(([k, v]) => (
            <div key={k} className="i-row" style={{ gridTemplateColumns: '1fr' }}>
              <span className="i-row__t">
                <b>{k}</b>
                <small>{v}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="i-note" style={{ marginTop: 6 }}>
          XP is worked out from your records each time, so editing or deleting a session changes it too, and nothing is counted twice. Quests started on {shortDay(QUESTS_FROM)}; earlier days earn no quest XP.
        </p>
      </details>
    </>
  );
}
