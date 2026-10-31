/**
 * CH10 · Future: university prep and plans, as a station. The board shows every dated thing as a
 * departure; the tabs hold the shortlist (tickets), tests, the profile (grades, activities),
 * essays and the story bank, and the roadmap (timeline, programmes, careers, ages, people).
 */
import { useEffect, useMemo, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { prefValue, sectionEntries, setTargets, useTargets, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { daysToEntry, departures, seasonWeek, BOARD_LABEL } from '../../domain/future/plan';
import { profileOf } from '../../domain/future/model';
import { weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { useStore } from '../../lib/createStore';
import { accent, Meter, Stepper } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { syncAllLinks } from './actions';
import { FutureArt } from './Art';
import { Flap } from './Flap';
import { EssaysTab, ProfileTab, RoadmapTab, TestsTab, UnisTab } from './tabs';
import './sheets';
import './future.css';
import './theme.css';

const TABS = [
  { id: '', label: 'Board' },
  { id: 'unis', label: 'Unis' },
  { id: 'tests', label: 'Tests' },
  { id: 'profile', label: 'Profile' },
  { id: 'essays', label: 'Essays' },
  { id: 'roadmap', label: 'Roadmap' },
] as const;

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const boardDay = (d: string) => `${d.slice(8, 10)} ${MON[Number(d.slice(5, 7)) - 1]}`;
const SHEET = { uni: 'future-uni', test: 'future-test', program: 'future-program', essay: 'future-essay', contact: 'future-contact' } as const;

export function FutureChannel() {
  const today = useToday();
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[0] ?? ''))?.id ?? '';
  const st = useStore(data, (s) => s);
  const records = useMemo(() => [...st.lt_records.values()].filter((r) => r.section === 'future' && !r.deleted_at), [st.lt_records]);
  const profile = profileOf(prefValue(st, 'future_profile'));
  const empty = records.length === 0;
  useEffect(() => syncAllLinks(), [today]);

  return (
    <div style={accent('future')} className="fu">
      <ChannelHead id="future" art={<FutureArt entry={profile.entryYear} />} />
      <nav className="fu-tabs" aria-label="Future sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="fu-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('future', t.id ? [t.id] : [], { replace: true })}>
            {t.label}
          </button>
        ))}
      </nav>
      {empty && tab === '' ? (
        <Welcome entry={profile.entryYear} today={today} />
      ) : tab === 'unis' ? (
        <UnisTab records={records} entry={profile.entryYear} today={today} />
      ) : tab === 'tests' ? (
        <TestsTab records={records} today={today} />
      ) : tab === 'profile' ? (
        <ProfileTab records={records} entry={profile.entryYear} today={today} />
      ) : tab === 'essays' ? (
        <EssaysTab records={records} today={today} />
      ) : tab === 'roadmap' ? (
        <RoadmapTab records={records} entry={profile.entryYear} birthYear={profile.birthYear} today={today} />
      ) : (
        <Board records={records} entry={profile.entryYear} today={today} />
      )}
    </div>
  );
}

function Welcome({ entry, today }: { entry: number; today: string }) {
  return (
    <section className="fu-welcome">
      <Flap text="NO DEPARTURES YET" className="fu-welcome__flap" />
      <p>
        Platform {entry} is {daysToEntry(entry, today)} days away. Set up your plan: universities on the shortlist, the SAT and TMUA with targets, your A-level subjects. Everything stays editable.
      </p>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'future-setup' })}>
        Set up my plan
      </button>
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'future' })}>
        <Icon name="plus" /> Just log prep time
      </button>
    </section>
  );
}

function Board({ records, entry, today }: { records: import('../../data/types').LtRecord[]; entry: number; today: string }) {
  const st = useStore(data, (s) => s);
  const rows = useMemo(() => departures(records, today), [records, today]);
  const upcoming = rows.filter((d) => d.status !== 'arrived' && d.status !== 'cancelled');
  const sessions = useMemo(() => sectionEntries(st, 'future'), [st]);
  const monday = weekStart(today);
  const week = sessions.filter((s) => s.entry.date >= monday && s.entry.date <= today).reduce((n, s) => n + s.entry.minutes, 0);
  const target = useTargets().futureWeek;
  const season = seasonWeek(target, records, today);
  const pct = Math.min(1, week / Math.max(1, target));
  const unis = records.filter((r) => r.kind === 'uni');
  const sent = unis.filter((r) => !['researching', 'applying', undefined].includes(r.data.status as string)).length;
  const next = upcoming.find((d) => d.days >= 0);

  return (
    <>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'future' })}>
        <Icon name="plus" /> Log prep
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={`${formatMinutes(week)} / ${formatMinutes(target)}`} label="This week" />
        <Meter value={next ? `${next.days}d` : '—'} label={next ? `To ${next.dest}` : 'Nothing dated'} />
        <Meter value={`${sent}/${unis.length}`} label="Applications sent" />
        <Meter value={`${daysToEntry(entry, today)}d`} label={`To platform ${entry}`} />
      </div>
      <div className="fu-week" style={{ '--p': `${pct * 100}%` } as CSSProperties} aria-hidden="true">
        <i />
      </div>
      {season.reason && (
        <p className="fu-season">
          Deadline season: {season.reason}. Aim for {formatMinutes(season.minutes)} this week (the XP target stays {formatMinutes(target)}).
        </p>
      )}

      <section className="fu-board" aria-labelledby="fu-board-h">
        <div className="fu-board__top">
          <h2 id="fu-board-h">
            <Flap text="DEPARTURES" />
          </h2>
          <span className="fu-board__clock">{today}</span>
        </div>
        <div className="fu-board__cols" aria-hidden="true">
          <span>DATE</span>
          <span>DESTINATION</span>
          <span>STATUS</span>
        </div>
        {upcoming.length ? (
          <ul className="fu-board__list" aria-label="Departures">
            {upcoming.slice(0, 10).map((d, i) => (
              <li key={d.key}>
                <button type="button" className={`fu-dep is-${d.status.replace(' ', '-')}`} onClick={() => openSheet({ type: SHEET[d.kind], editId: d.recordId })} aria-label={`${d.dest}, ${d.via}, ${d.date}: ${BOARD_LABEL[d.status].toLowerCase()}`}>
                  <Flap text={boardDay(d.date)} len={6} delay={i * 60} className="fu-dep__date" />
                  <span className="fu-dep__dest">
                    <Flap text={d.dest} len={12} delay={i * 60 + 120} />
                    <small>
                      {d.via}
                      {d.days >= 0 ? ` · ${d.days === 0 ? 'today' : `in ${d.days}d`}` : ` · ${-d.days}d ago`}
                    </small>
                  </span>
                  <span className="fu-dep__status">{BOARD_LABEL[d.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fu-board__empty">Add a university, a test sitting or a programme with a date and it departs from here.</p>
        )}
      </section>

      <div className="fu-quick">
        <button type="button" className="fu-quick__b" onClick={() => navigate('future', ['unis'], { replace: true })}>
          <b>Unis</b>
          <small>{unis.length} on the list</small>
        </button>
        <button type="button" className="fu-quick__b" onClick={() => navigate('future', ['essays'], { replace: true })}>
          <b>Essays</b>
          <small>{records.filter((r) => r.kind === 'essay').length} started</small>
        </button>
        <button type="button" className="fu-quick__b" onClick={() => navigate('future', ['roadmap'], { replace: true })}>
          <b>Roadmap</b>
          <small>to {entry}</small>
        </button>
      </div>

      <div className="i-pnl fu-target">
        <span>
          Uni prep per week
          <br />
          <span className="i-mono i-small i-dim">applies from this week; past weeks keep theirs</span>
        </span>
        <Stepper value={formatMinutes(target)} label="weekly target" onStep={(s) => setTargets({ futureWeek: Math.max(30, target + 30 * s) })} />
      </div>
      <RelatedTasks section="future" />
      <p className="i-note">Prep time goes into the Daily Log as “Uni prep” and earns XP like any section, with a bonus each week you reach {formatMinutes(target)}. Milestones earn more: an application sent 100, an offer 200, an official test score 50, an essay finished 40.</p>
    </>
  );
}
