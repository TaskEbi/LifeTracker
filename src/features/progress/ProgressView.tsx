import { useMemo, useState } from 'react';
import { navigate, type RouteName } from '../../app/router';
import { takeRestDay, useAchievements, useProgress, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { RULES, STAGES, type XpSection } from '../../domain/progress/engine';
import { SECTIONS, sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Seg } from '../../ui/i/bits';
import { Drone } from '../../ui/i/Drone';
import './progress.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const secName = (s: XpSection) => (s === 'general' ? 'Other topics' : sectionInfo(s).name);

/** How XP is earned, in plain words, from the same numbers the engine uses. */
const RULE_LINES: [string, string][] = [
  ['Any timed session', `1 XP per ${RULES.minutesPerXp} min, up to ${RULES.timeCapPerEntry} per session and ${RULES.timeCapPerDay} per section per day, plus ${RULES.entryLogged} for logging it`],
  ['Gym session finished', `${RULES.gymCompleted} XP, 1 per set done (capped at the plan, max ${RULES.gymSetsCap}), ${RULES.gymCheckIn} for the check-in`],
  ['Weekly targets', `violin ${RULES.violinWeekTarget}, gym ${RULES.gymWeekTarget}, sports ${RULES.sportsWeekTarget} XP when the week's target is met`],
  ['Sleep', `${RULES.nightLogged} XP per night logged, ${RULES.bedtimeKept} more for bed within ${RULES.bedtimeWindow} min of the schedule`],
  ['Screen time', `${RULES.screenLogged} XP for logging the day, ${RULES.screenUnderTarget} more under the target`],
  ['Tasks', `${RULES.taskDone} XP per task completed`],
  ['Cabinet', `${RULES.cabinetItem} XP per item saved, up to ${RULES.cabinetPerDay} a day`],
  ['Rest day', 'No XP; keeps the streak going'],
];

export function ProgressView() {
  const p = useProgress();
  const ach = useAchievements();
  const today = useToday();
  const marks = useStore(data, (s) => s.lt_day_marks);
  const [filter, setFilter] = useState<XpSection | 'all'>('all');
  const restToday = [...marks.values()].some((m) => !m.deleted_at && m.kind === 'rest' && m.date === today);
  const loggedToday = p.events.some((e) => e.date === today);
  const recent = useMemo(() => [...p.events].filter((e) => filter === 'all' || e.section === filter).sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp).slice(0, 25), [p.events, filter]);
  const unlocked = ach.filter((a) => a.unlockedOn).sort((a, b) => b.unlockedOn!.localeCompare(a.unlockedOn!));
  const locked = ach.filter((a) => !a.unlockedOn).sort((a, b) => b.progress / b.goal - a.progress / a.goal);
  const next = STAGES[p.overall.stage + 1];

  return (
    <div className="pg">
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">SYS · progress</span>
          <h1>Progress</h1>
        </div>
        <div className="i-chhead__lv">
          LVL<b>{pad2(p.overall.level)}</b>
          {p.overall.into}/{p.overall.need} XP
        </div>
        <Seg pct={p.overall.pct} label="Overall level progress" />
      </header>

      <div className="pg-hero i-pnl i-pnl--grid">
        <div className="pg-hero__drone i-drone">
          <Drone stage={p.overall.stage} />
        </div>
        <div className="pg-hero__txt">
          <span className="i-lab">Form {p.overall.stage + 1} of {STAGES.length}</span>
          <b className="pg-hero__name">{STAGES[p.overall.stage].name}</b>
          <span className="i-mono i-small">
            {p.total.toLocaleString('en-GB')} XP total · {p.overall.toNext.toLocaleString('en-GB')} to LV {p.overall.level + 1}
            {next ? ` · ${next.name} at LV ${next.level}` : ' · final form'}
          </span>
        </div>
      </div>

      <ol className="pg-forms" aria-label="Forms">
        {STAGES.map((s, i) => (
          <li key={s.name} className={i <= p.overall.stage ? 'is-on' : ''} aria-label={`${s.name}: ${i <= p.overall.stage ? 'reached' : `from level ${s.level}`}`}>
            <span className="pg-forms__d" aria-hidden="true">
              <Drone stage={i} still label={false} />
            </span>
            <b>{s.name}</b>
            <small>LV {s.level}</small>
          </li>
        ))}
      </ol>

      <div className="i-meters" style={{ marginTop: 12 }}>
        <Meter value={<>{p.streak.n}<small>d</small></>} label={`Streak${p.streak.today ? ' · today counted' : ' · log or rest today'}`} />
        <Meter value={unlocked.length} label={`Achievements · of ${ach.length}`} />
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

      <H2>Sections</H2>
      <div className="pg-secs">
        {SECTIONS.map((s) => {
          const lv = p.sections[s.id];
          return (
            <button key={s.id} type="button" className="pg-sec" style={accent(s.id)} onClick={() => navigate(s.id as RouteName)} aria-label={`${s.full}: level ${lv.level}, ${lv.into} of ${lv.need} XP`}>
              <span className="i-mono i-small i-dim">{s.code}</span>
              <b>{s.name}</b>
              <span className="pg-sec__lv i-mono">LV {pad2(lv.level)}</span>
              <Seg pct={lv.pct} n={10} thin />
              <small className="i-mono">{p.bySection[s.id]} XP</small>
            </button>
          );
        })}
      </div>
      {p.bySection.general > 0 && <p className="i-note" style={{ marginTop: 6 }}>{p.bySection.general} XP from Daily Log topics not mapped to a section counts towards the overall level only. Map them in Settings.</p>}

      <div className="i-cols">
        <div>
          <H2 aside={`${unlocked.length}/${ach.length}`}>Achievements</H2>
          <div className="i-pnl i-pnl--flush">
            {[...unlocked, ...locked].map((a) => (
              <div key={a.id} className={`i-row pg-ach${a.unlockedOn ? ' is-on' : ''}`}>
                <span className="i-row__t">
                  <b>{a.title}</b>
                  <small>{a.desc}</small>
                  {!a.unlockedOn && <Seg pct={a.progress / a.goal} n={Math.min(10, a.goal)} thin label={`${a.title} progress`} />}
                </span>
                <span className="i-row__n i-small">{a.unlockedOn ? shortDay(a.unlockedOn) : `${a.progress}/${a.goal}`}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <H2>How XP works</H2>
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
          <p className="i-note" style={{ marginTop: 6 }}>XP is worked out from your records each time, so editing or deleting a session changes it too, and nothing is counted twice.</p>
        </div>
      </div>

      <H2>Recent XP</H2>
      <Chips label="Section" value={filter} onChange={setFilter} options={[{ id: 'all' as const, label: 'All' }, ...SECTIONS.map((s) => ({ id: s.id, label: s.name, c: s.id })), { id: 'general' as const, label: 'Other' }]} />
      <div className="i-pnl i-pnl--flush">
        {recent.length ? (
          recent.map((e) => (
            <div key={e.key} className="i-row" style={e.section === 'general' ? undefined : accent(e.section)}>
              <span className="i-row__t">
                <b>{e.reason}</b>
                <small>{secName(e.section)} · {shortDay(e.date)}</small>
              </span>
              <span className="i-row__n" style={{ color: 'var(--c)' }}>+{e.xp}</span>
            </div>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No XP here yet.</p>
        )}
      </div>
    </div>
  );
}
