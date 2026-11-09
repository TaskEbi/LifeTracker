import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { navigate, useRoute } from '../../app/router';
import { StatusBar } from '../../app/Shell';
import { openSheet } from '../../app/sheets';
import { toggleTask } from '../../data/ltActions';
import { getSleepSchedule, progressInput, useAchievements, useBoss, useLookBack, useProgress, useQuests, useSectionStreaks, useToday } from '../../data/lt';
import { data, liveItems } from '../../data/store';
import type { SectionId } from '../../data/types';
import { conflicts, occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex } from '../../domain/log/dates';
import { activeDays, rankFor, scheduleFor, sectionLevel, STAGES } from '../../domain/progress/engine';
import { SECTIONS, sectionInfo, SYSTEM_KANJI } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent } from '../../ui/i/bits';
import { droneMood, hourIn, seasonOf, timeOfDay, TOD_LABEL } from '../../domain/fun/season';
import { LivingDrone } from './LivingDrone';
import { Purse } from '../game/Purse';
import { useGame } from '../game/store';
import { OmikujiCard } from './Omikuji';
import { Sky } from './Sky';
import { bucketItems } from '../bucket/actions';
import { booksIn, sessionsIn } from '../reading/actions';
import { bookProgress, likelyBook } from '../../domain/reading/model';
import { daysUntil, upcoming } from '../../domain/maths/model';
import { sittingsIn } from '../maths/actions';
import { useFocus } from '../focus/focus';
import { BossCard } from '../progress/BossPanel';
import { Recap } from '../progress/LookBack';
import { useFxPrefs } from '../../ui/i/fx/celebrate';
import { QuestCard } from '../progress/QuestsPanel';
import { PlanToday } from '../plans/PlanToday';
import { BeaconCard, BigThreeCard, BookendCard, NextMoveCard, ShadowCard } from '../hq/HomeCards';
import { HideoutDock } from '../hq/HideoutDock';
import { ROOMS, useRoomStatus, type RoomId } from '../hq/rooms';
import { TodayChecklist } from './TodayChecklist';
import { useHq } from '../hq/store';
import { useAlbum } from '../album/store';
import { albumStreak, daysToReel, reelOpen } from '../../domain/album/album';
import { reviewQueue } from '../../domain/hq/srs';
import { roughToday } from '../../domain/hq/beacon';
import { EPQ_KANJI, epqLine, useEpq } from '../epq/EpqPage';
import './home.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * Home is three pages, so no one page has to hold everything:
 * Today (what to do now), Arena (the game: boss, rival, fortune, purse) and More (every section, room and page).
 */
export type HomeTab = 'today' | 'arena' | 'more';
const TABS: { id: HomeTab; kanji: string; label: string; hint: string }[] = [
  { id: 'today', kanji: '今', label: 'Today', hint: 'What to do now' },
  { id: 'arena', kanji: '戦', label: 'Arena', hint: 'Boss, rival, fortune' },
  { id: 'more', kanji: '他', label: 'More', hint: 'Sections, rooms, pages' },
];
export const homeTabOf = (rest: string[]): HomeTab => (rest[0] === 'arena' || rest[0] === 'more' ? rest[0] : 'today');

/** One section as a 技 technique: kanji, name, level and its streak light. */
function Technique({ id }: { id: SectionId }) {
  const p = useProgress();
  const streak = useSectionStreaks()[id];
  const items = useStore(data, (s) => s.items);
  const info = sectionInfo(id);
  const lv = id === 'cabinet' ? sectionLevel(p.bySection.cabinet) : p.sections[id];
  const saved = id === 'cabinet' ? liveItems(items).filter((i) => !i.is_example).length : 0;
  return (
    <button
      type="button"
      className="h-tech"
      style={accent(id)}
      onClick={() => navigate(id)}
      aria-label={`${info.full}, level ${lv.level}${streak?.n ? `, ${streak.n} ${streak.label}` : ''}${id === 'cabinet' ? `, ${saved} saved` : ''}`}
    >
      <span className="h-tech__k" aria-hidden="true">
        {info.kanji}
      </span>
      <span className="h-tech__name">
        {info.name}
        {streak?.n ? <i className="i-led is-on" /> : null}
      </span>
      <span className="h-tech__lv">LV {pad2(lv.level)}</span>
      <span className="h-tech__bar">
        <i style={{ width: `${Math.round(lv.pct * 100)}%` }} />
      </span>
    </button>
  );
}

interface TodayRow {
  key: string;
  when: string;
  title: string;
  section: SectionId | null;
  tag?: string;
  taskId?: string;
  clash?: boolean;
}

function useTodayRows(today: string): TodayRow[] {
  const events = useStore(data, (s) => s.lt_events);
  const todos = useStore(data, (s) => s.todos);
  const prefs = useStore(data, (s) => s.lt_prefs);
  return useMemo(() => {
    const tomorrow = addDays(today, 1);
    const occ = occurrences(events.values(), today, tomorrow).filter((o) => !o.cancelled);
    const clash = conflicts(occ);
    const rows: TodayRow[] = occ.map((o) => ({
      key: o.key,
      when: (o.date === today ? '' : `${DAYS[weekdayIndex(o.date)]} `) + (o.start ?? 'ALL DAY'),
      title: o.event.title,
      section: o.event.section,
      clash: clash.has(o.key),
      tag: o.event.kind === 'exam' ? 'EXAM' : o.event.kind === 'performance' ? 'CONCERT' : o.event.kind === 'competition' ? 'MATCH' : undefined,
    }));
    const sleep = getSleepSchedule();
    if (sleep.reminders) {
      const bed = scheduleFor(tomorrow, sleep).bed;
      const m = (+bed.slice(0, 2) * 60 + +bed.slice(3) - sleep.windDown + 1440) % 1440;
      rows.push({ key: 'winddown', when: `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`, title: 'Wind down for bed', section: 'sleep', tag: 'RMD' });
    }
    rows.sort((a, b) => (a.when.length > 5 ? 1 : 0) - (b.when.length > 5 ? 1 : 0) || a.when.localeCompare(b.when));
    const due = [...todos.values()]
      .filter((t) => !t.deleted_at && !t.done_at && t.due && t.due <= tomorrow)
      .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
      .map<TodayRow>((t) => ({ key: t.id, when: t.due! < today ? 'LATE' : t.due === today ? 'DUE' : `DUE ${DAYS[weekdayIndex(t.due!)]}`, title: t.title, section: t.section ?? null, taskId: t.id }));
    return [...rows, ...due];
  }, [events, todos, prefs, today]);
}

/** A kanji + label heading, with an optional link on the right. */
function Head({ k, children, link }: { k: string; children: ReactNode; link?: { label: string; go: () => void } }) {
  return (
    <div className="h-h2row">
      <h2 className="h-h2">
        <span aria-hidden="true">{k}</span> {children}
      </h2>
      {link && (
        <button type="button" className="i-link" onClick={link.go}>
          {link.label} ▶
        </button>
      )}
    </div>
  );
}

/** One tile in a grid of ways out: kanji, name and a status line. */
function Door({ k, name, sub, go, wide }: { k: string; name: string; sub: ReactNode; go: () => void; wide?: boolean }) {
  return (
    <button type="button" className={`h-sys__btn${wide ? ' h-sys__btn--wide' : ''}`} onClick={go}>
      <span aria-hidden="true">{k}</span>
      <b>{name}</b>
      <small>{sub}</small>
    </button>
  );
}

function HomeHeader() {
  const today = useToday();
  const p = useProgress();
  const st = useStore(data, (s) => s);
  const input = progressInput(st, today);
  const chapter = useMemo(() => [...activeDays(input)].filter((d) => d <= today).length || 1, [input, today]);
  const stage = STAGES[p.overall.stage];
  return (
    <header className="h-head">
      <div className="h-head__ep" aria-hidden="true">
        第<span className="h-head__num">{chapter}</span>話
      </div>
      <div className="h-head__t">
        <h1>LifeTracker</h1>
        <p>
          Chapter {chapter} · the {stage.name} arc · {shortDay(today)}
        </p>
      </div>
      <div
        className={`h-head__streak${p.streak.held ? ' is-held' : ''}`}
        title={p.streak.held ? 'Yesterday was missed: the buffer is holding the streak. Log something today or it ends.' : 'Days in a row with anything logged. Planned rest days count, and one missed day won’t break it.'}
      >
        <b>{p.streak.n}日</b>
        <span>Streak</span>
        <small className="h-head__shield">{p.streak.held ? '盾 used · log today' : '盾 ready'}</small>
      </div>
    </header>
  );
}

function HomeTabs({ tab }: { tab: HomeTab }) {
  const status = useRoomStatus();
  const alerts = (Object.keys(ROOMS) as RoomId[]).filter((id) => status[id].alert).length;
  const chests = useGame().wallet.chests.length;
  return (
    <nav className="h-tabs" aria-label="Home pages">
      {TABS.map((t) => {
        return (
          <button
            key={t.id}
            type="button"
            className="h-tabs__btn"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => navigate('home', t.id === 'today' ? [] : [t.id], { replace: true })}
            title={t.hint}
          >
            <span className="h-tabs__k" aria-hidden="true">
              {t.kanji}
            </span>
            <span>{t.label}</span>
            {t.id === 'more' && alerts > 0 ? (
              <i className="h-tabs__n" aria-label={`${alerts} ${alerts === 1 ? 'room needs' : 'rooms need'} you`}>
                {alerts}
              </i>
            ) : t.id === 'arena' && chests > 0 ? (
              <i className="h-tabs__n" aria-label={`${chests} ${chests === 1 ? 'chest' : 'chests'} waiting`}>
                {chests}
              </i>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

/** The character: level, form and the power bar. Tap the robot and it talks. */
function Hero({ rows }: { rows: TodayRow[] }) {
  const today = useToday();
  const p = useProgress();
  const st = useStore(data, (s) => s);
  const quests = useQuests();
  const boss = useBoss();
  const [bubble, setBubble] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const input = progressInput(st, today);
  const stage = STAGES[p.overall.stage];
  const next = STAGES[p.overall.stage + 1];
  const daily = quests.daily.quests;
  const dailyDone = daily.filter((q) => q.doneOn).length;
  const hour = hourIn(st.settings.log_timezone);
  const tod = timeOfDay(hour);
  const skyOn = useFxPrefs().sky;

  const poke = () => {
    const violinWeek = input.entries.filter((e) => e.date >= addDays(today, -weekdayIndex(today)) && input.topicSection.get(e.topic_id) === 'violin').reduce((s, e) => s + e.minutes, 0);
    const open = daily.find((q) => !q.doneOn);
    const lines = [
      next ? `${p.overall.toNext} XP to the next level. ${next.name} form at LV ${next.level}!` : 'Final form. Nothing left to unlock, only to keep.',
      p.streak.held
        ? `Missed yesterday, but the buffer held your ${p.streak.n}-day streak. Log today to keep it!`
        : p.streak.n
          ? `${p.streak.n} days in a row. Rest days count, and one missed day won't break it.`
          : 'Log anything today to start a streak.',
      open ? `Next training: ${open.title.toLowerCase()} (${open.progress}/${open.goal}).` : 'All three of today’s training done!',
      `Violin this week: ${violinWeek} of ${input.targets.violinWeek} min.`,
      rows[0] ? `Coming up: ${rows[0].title} at ${rows[0].when}.` : 'Nothing planned. Clear skies.',
      boss.defeatedOn ? `${boss.boss.name} is down. Rest easy… until Monday.` : `${boss.boss.name} has ${Math.max(0, boss.hp - boss.damage)} HP left. It hates ${sectionInfo(boss.boss.weak).name.toLowerCase()}.`,
    ];
    setBubble(lines[n % lines.length]);
    setN(n + 1);
  };

  return (
    <section className="h-hero" style={{ '--c': stage.c, '--c2': stage.c2 } as CSSProperties} aria-label="Your character">
      <div className="h-hero__in">
        <Sky date={today} tod={tod} />
        <span className="h-hero__speed" aria-hidden="true" />
        {skyOn && (
          <span className="h-hero__season" title={seasonOf(today).label} aria-hidden="true">
            {seasonOf(today).kanji} · {TOD_LABEL[tod]}
          </span>
        )}
        <LivingDrone stage={p.overall.stage} mood={droneMood({ hour, streakHeld: p.streak.held, dailyDone: dailyDone === daily.length })} onTalk={poke} onSay={setBubble} />
        <span className="h-hero__lv">
          <span className="h-hero__lvk">LV</span>
          <b>{p.overall.level}</b>
          <span className="h-hero__tag h-hero__tag--rank">{rankFor(p.overall.level)}</span>
          <span className="h-hero__tag h-hero__tag--form">
            Form {p.overall.stage + 1} · {stage.name}
          </span>
        </span>
        <span className="h-hero__sfx" aria-hidden="true">
          ゴゴゴゴ
        </span>
        <span className="h-hero__power">
          <span className="h-hero__powerl">
            <span>Power</span>
            <span>
              {p.overall.into.toLocaleString('en-GB')} / {p.overall.need.toLocaleString('en-GB')}
              {next ? ` · 覚醒 → ${next.name.toUpperCase()} @ LV ${next.level}` : ' · 極 MAX FORM'}
            </span>
          </span>
          <span className="h-hero__bar" role="progressbar" aria-label="Overall level progress" aria-valuenow={Math.round(p.overall.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} className={i < Math.round(p.overall.pct * 24) ? 'is-on' : ''} />
            ))}
          </span>
        </span>
        {bubble && (
          <span className="h-hero__bubble" role="status">
            {bubble}
          </span>
        )}
      </div>
    </section>
  );
}

const MOVE_KEY = 'lt.home.next-move-open';

/** 次の一手 folded into one strip until you want it, so it doesn't push everything down. */
function NextMoveFold() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(MOVE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const flip = () => {
    setOpen(!open);
    try {
      localStorage.setItem(MOVE_KEY, open ? '0' : '1');
    } catch {
      /* stays as it is for this visit */
    }
  };
  return (
    <div className="h-fold">
      <button type="button" className="h-move" aria-expanded={open} onClick={flip}>
        <span className="h-focus__k" aria-hidden="true">
          次
        </span>
        <span className="h-focus__t">
          <b>What should I do now?</b>
          <small>Pick how long you have and how you feel</small>
        </span>
        <span className="h-focus__go" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && <NextMoveCard />}
    </div>
  );
}

function TodayPage() {
  const today = useToday();
  const rows = useTodayRows(today);
  const quests = useQuests();
  const focus = useFocus();
  const daily = quests.daily.quests;
  const dailyDone = daily.filter((q) => q.doneOn).length;
  // The Lighthouse lives on More, but on a rough day it comes to Today.
  const rough = roughToday(useHq().checkIns, today);

  return (
    <div className="h-grid">
      <div>
        <TodayChecklist />
        {rough && (
          <div className="h-sec">
            <BeaconCard />
          </div>
        )}
        <BookendCard morningOnly />
        <Hero rows={rows} />
      </div>

      <div>
        <section className="h-sec" aria-label="Today and tomorrow">
          <Head k="予定" link={{ label: 'Calendar', go: () => navigate('calendar') }}>
            Today / tomorrow
          </Head>
          <button type="button" className="h-focus" onClick={() => openSheet({ type: 'focus' })}>
            <span className="h-focus__k" aria-hidden="true">
              集中
            </span>
            <span className="h-focus__t">
              <b>{focus ? (focus.finishedAt ? 'Focus finished' : 'Focus running') : 'Focus mode'}</b>
              <small>{focus ? (focus.finishedAt ? `${focus.minutes} min waiting to be logged` : `${sectionInfo(focus.section).name} · tap to see the timer`) : 'Start a timer, then log it in one tap'}</small>
            </span>
            <span className="h-focus__go" aria-hidden="true">
              ▶
            </span>
          </button>
          <PlanToday />
          <div className="h-today">
            {rows.length === 0 ? (
              <p className="i-note" style={{ padding: '10px 0' }}>
                Nothing planned or due. Add events in the calendar, or{' '}
                <button type="button" className="i-link" style={{ minHeight: 0 }} onClick={() => openSheet({ type: 'task' })}>
                  add a task
                </button>
                .
              </p>
            ) : (
              rows.slice(0, 7).map((r) => (
                <div key={r.key} className="h-trow" style={accent(r.section)}>
                  <span className="h-trow__t" style={r.when === 'LATE' ? { color: 'var(--warn)' } : undefined}>
                    {r.when}
                  </span>
                  <span className="h-trow__k" aria-hidden="true">
                    {r.section ? sectionInfo(r.section).kanji : '・'}
                  </span>
                  <span className="h-trow__x">{r.title}</span>
                  {r.taskId ? (
                    <button type="button" className="h-ck" onClick={() => toggleTask(r.taskId!)} aria-label={`Complete: ${r.title}`} />
                  ) : (
                    <span className={`h-trow__tag${r.clash ? ' is-warn' : ''}`}>{r.clash ? 'CLASH' : r.tag ?? ''}</span>
                  )}
                </div>
              ))
            )}
            {rows.length > 7 && (
              <button type="button" className="i-link h-today__more" onClick={() => navigate('calendar')}>
                {rows.length - 7} more ▶
              </button>
            )}
          </div>
        </section>

        <section className="h-sec" aria-label="Today's training">
          <Head k="修行" link={{ label: 'All missions', go: () => navigate('progress', ['quests']) }}>
            Training · {dailyDone}/{daily.length}
          </Head>
          <div className="pg-quests">
            {daily.map((q) => (
              <QuestCard key={q.key} q={q} now={q === daily.find((x) => !x.doneOn)} />
            ))}
          </div>
        </section>

        <div className="h-sec">
          <BigThreeCard />
        </div>

        <div className="h-sec">
          <NextMoveFold />
        </div>
      </div>
    </div>
  );
}

function ArenaPage() {
  const p = useProgress();
  const ach = useAchievements();
  const boss = useBoss();
  const { recap } = useLookBack(1);
  const hasRecap = recap.minutes > 0 || recap.activeDays > 0;
  return (
    <div className="h-grid">
      <div>
        <Purse />
        <section className="h-sec" aria-label="Weekly boss">
          <Head k="討伐">Boss raid</Head>
          <BossCard fight={boss} compact />
        </section>
        <div className="h-sec">
          <ShadowCard />
        </div>
      </div>

      <div>
        <div className="h-sec">
          <OmikujiCard />
        </div>
        {hasRecap && (
          <div className="h-sec">
            <Recap recap={recap} />
          </div>
        )}
        <section className="h-sec" aria-label="Your progress">
          <Head k="覚">Progress</Head>
          <div className="h-sys">
            <Door k={SYSTEM_KANJI.hangar} name="Hangar" sub="Shop · capsules · events" go={() => navigate('hangar')} />
            <Door k={SYSTEM_KANJI.progress} name="Awakening" sub={`${STAGES.length} forms · ${rankFor(p.overall.level)}`} go={() => navigate('progress')} />
            <Door k="紋" name="Emblems" sub={`${ach.filter((a) => a.unlockedOn).length}/${ach.length} earned`} go={() => navigate('progress', ['achievements'])} />
            <Door k="任" name="Missions" sub="Daily · weekly · monthly" go={() => navigate('progress', ['quests'])} />
          </div>
        </section>
      </div>
    </div>
  );
}

function MorePage() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const nowReading = useMemo(() => {
    const sessions = sessionsIn(st);
    const book = likelyBook(booksIn(st), sessions);
    return book ? { title: book.title, pct: bookProgress(book, sessions).pct } : null;
  }, [st]);
  const nextContest = useMemo(() => upcoming(sittingsIn(st), today)[0] ?? null, [st, today]);
  const album = useAlbum();
  const albumLine = useMemo(() => {
    const day = album.days.get(today);
    const run = albumStreak(album.days.keys(), today).current;
    const y = Number(today.slice(0, 4));
    const reel = reelOpen(y, today) ? `the ${y} reel is ready` : daysToReel(y, today) <= 31 ? `the reel opens in ${daysToReel(y, today)} days` : null;
    const parts = [day?.face ? 'today’s face is on film' : 'today’s face: not yet', day?.memories.length ? `${day.memories.length} ${day.memories.length === 1 ? 'memory' : 'memories'}` : null, run > 1 ? `${run} days in a row` : null, reel];
    const t = parts.filter(Boolean).join(' · ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }, [album, today]);
  const bucket = useMemo(() => {
    const { open, done } = bucketItems(st);
    return { total: open.length + done.length, done: done.length, next: open[0]?.title };
  }, [st]);
  const epq = useEpq();
  const hq = useHq();
  const dueCards = useMemo(() => reviewQueue(hq.cards, today).length, [hq.cards, today]);
  const contestWhen = nextContest?.date
    ? (() => {
        const d = daysUntil(nextContest.date, today);
        return d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
      })()
    : 'date not set';

  return (
    <div className="h-grid">
      <div>
        <section className="h-sec" aria-label="Techniques: your sections">
          <Head k="技">Sections</Head>
          <div className="h-techs">
            {SECTIONS.map((s) => (
              <Technique key={s.id} id={s.id} />
            ))}
          </div>
        </section>
        <HideoutDock />
      </div>

      <div>
        <section className="h-sec" aria-label="Pages">
          <Head k="頁">Pages</Head>
          <div className="h-sys">
            <Door wide k={EPQ_KANJI} name="EPQ" sub={epqLine(epq, today)} go={() => navigate('study', ['epq'])} />
            {nowReading && <Door wide k={sectionInfo('reading').kanji} name="Now reading" sub={`${nowReading.title} · ${nowReading.pct}%`} go={() => navigate('reading')} />}
            {nextContest && <Door wide k={sectionInfo('maths').kanji} name="Next contest" sub={`${nextContest.label} · ${contestWhen}`} go={() => navigate('maths')} />}
            <Door wide k={SYSTEM_KANJI.album} name="Album" sub={albumLine} go={() => navigate('album')} />
            <Door
              wide
              k={SYSTEM_KANJI.bucket}
              name="Bucket list"
              sub={bucket.total ? `${bucket.done} of ${bucket.total} crossed off${bucket.next ? ` · next: ${bucket.next}` : ''}` : 'Everything you want to do someday'}
              go={() => navigate('bucket')}
            />
            <Door k={SYSTEM_KANJI.base} name="Hideout" sub={dueCards ? `${dueCards} recall ${dueCards === 1 ? 'card' : 'cards'}` : 'All rooms'} go={() => navigate('base')} />
            <Door k={SYSTEM_KANJI.log} name="Activity" sub="The Daily Log" go={() => navigate('log')} />
            <Door k={SYSTEM_KANJI.calendar} name="Calendar" sub="Events · exams" go={() => navigate('calendar')} />
            <Door k={SYSTEM_KANJI.settings} name="Settings" sub="Themes · sync" go={() => navigate('settings')} />
          </div>
        </section>
        <div className="h-sec">
          <BeaconCard />
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const route = useRoute();
  const tab = homeTabOf(route.rest);
  return (
    <div className="h-home">
      <StatusBar />
      <HomeHeader />
      <HomeTabs tab={tab} />
      {tab === 'today' ? <TodayPage /> : tab === 'arena' ? <ArenaPage /> : <MorePage />}
    </div>
  );
}
