/**
 * 人 People, at /people: birthdays coming up, close people you haven't seen for a while, everyone
 * with their notes; time together (/people/time) and gift ideas (/people/gifts).
 */
import { useMemo } from 'react';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { addDays, shortDay } from '../../domain/log/dates';
import { lastSeen, nextBirthday, overdue, RELATIONS, seenSince, socialDays, upcomingBirthdays, type Gift, type Person } from '../../domain/people/model';
import { useRoute } from '../../app/router';
import { H2, Meter } from '../../ui/i/bits';
import { useMoneyFmt } from '../money/store';
import { Empty, LifePage } from '../life/Frame';
import { usePeople, saveGift, type PeopleState } from './store';
import './sheets';

const when = (days: number) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

/** One line for Home: the next birthday, or who's been a while. */
export function peopleLine(s: PeopleState, today: string): string {
  const b = upcomingBirthdays(s.people, today, 14)[0];
  if (b) return `${b.person.name}’s birthday ${when(b.days)}`;
  if (!s.people.length) return 'Birthdays, gifts and time together';
  const n = socialDays(s.times, today, 7);
  return `${s.people.length} people · with someone ${n} of the last 7 days`;
}

export function PeoplePage() {
  const route = useRoute();
  const tab = route.rest[0] === 'time' ? 'time' : route.rest[0] === 'gifts' ? 'gifts' : '';
  const s = usePeople();
  const today = useToday();
  const open = s.gifts.filter((g) => g.state !== 'Given').length;
  return (
    <LifePage
      id="people"
      line={s.people.length ? peopleLine(s, today) : undefined}
      tabs={[
        { id: '', label: 'People', n: s.people.length },
        { id: 'time', label: 'Time together' },
        { id: 'gifts', label: 'Gifts', n: open },
      ]}
      tab={tab}
    >
      {!s.people.length ? (
        <Empty action="Add someone" onAction={() => openSheet({ type: 'pp-person' })}>
          Keep the people who matter in one place: their birthdays (with a heads-up and gift ideas ready), notes on what they like, and who you spent time with. Mood compares days with people against days without.
        </Empty>
      ) : tab === 'time' ? (
        <TimeTab s={s} today={today} />
      ) : tab === 'gifts' ? (
        <GiftsTab s={s} today={today} />
      ) : (
        <PeopleTab s={s} today={today} />
      )}
    </LifePage>
  );
}

function PeopleTab({ s, today }: { s: PeopleState; today: string }) {
  const bdays = upcomingBirthdays(s.people, today, 60);
  const due = overdue(s.people, s.times, today);
  const seen = useMemo(() => lastSeen(s.times), [s.times]);
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pp-time' })}>
          + Time together
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'pp-person' })}>
          + Person
        </button>
      </div>

      {bdays.length > 0 && (
        <>
          <H2 aside="next 60 days">Birthdays</H2>
          <div className="i-pnl i-pnl--flush" aria-label="Birthdays coming up">
            {bdays.map((b) => {
              const ideas = s.gifts.filter((g) => g.personId === b.person.id && g.state !== 'Given');
              return (
                <div key={b.person.id} className="i-row">
                  <span className="lf-row-k" aria-hidden="true">
                    {b.days === 0 ? '🎂' : '誕'}
                  </span>
                  <span className="i-row__t">
                    <b>{b.person.name}</b>
                    <small>
                      {b.turns ? `Turns ${b.turns} · ` : ''}
                      {shortDay(b.date, today)} · {ideas.length ? `${ideas.length} gift ${ideas.length === 1 ? 'idea' : 'ideas'}` : 'no gift idea yet'}
                    </small>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="i-row__n">{when(b.days)}</span>
                    {!ideas.length && b.days <= 21 && (
                      <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'pp-gift', personId: b.person.id })} aria-label={`Gift idea for ${b.person.name}`}>
                        + Idea
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {due.length > 0 && (
        <>
          <H2>It’s been a while</H2>
          <div className="i-pnl i-pnl--flush" aria-label="Close people you haven't seen lately">
            {due.slice(0, 5).map((d) => (
              <div key={d.person.id} className="i-row">
                <span className="i-row__t">
                  <b>{d.person.name}</b>
                  <small>{d.gap == null ? 'No time together logged yet' : `${d.gap} days since ${shortDay(d.last!, today)}`}</small>
                </span>
                <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'pp-time', personId: d.person.id })}>
                  Saw them
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {RELATIONS.map((rel) => {
        const list = s.people.filter((p) => p.relation === rel);
        if (!list.length) return null;
        return (
          <section key={rel} aria-label={rel}>
            <H2 aside={String(list.length)}>{rel}</H2>
            <div className="lf-cards">
              {list.map((p) => (
                <PersonCard key={p.id} p={p} seen={seen.get(p.id)} today={today} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function PersonCard({ p, seen, today }: { p: Person; seen?: string; today: string }) {
  const b = p.birthday ? nextBirthday(p.birthday, today) : null;
  return (
    <button type="button" className="lf-card" onClick={() => openSheet({ type: 'pp-person', editId: p.id })}>
      <b>
        {p.name}
        {p.close ? ' ♥' : ''}
      </b>
      <small>{seen ? `Together ${shortDay(seen, today)}` : 'Not seen yet'}</small>
      {b && <em>🎂 {shortDay(b.date, today)}</em>}
      {p.notes && <small className="i-dim">{p.notes.length > 60 ? `${p.notes.slice(0, 60)}…` : p.notes}</small>}
    </button>
  );
}

function TimeTab({ s, today }: { s: PeopleState; today: string }) {
  const names = new Map(s.people.map((p) => [p.id, p.name]));
  const month = seenSince(s.times, addDays(today, -29));
  const week = socialDays(s.times, today, 7);
  const groups = new Map<string, typeof s.times>();
  for (const t of s.times.slice(0, 60)) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pp-time' })}>
          + Time together
        </button>
      </div>
      <div className="i-meters">
        <Meter value={`${week}/7`} label="Days with people this week" />
        <Meter value={month.length} label="People seen in 30 days" />
        <Meter value={s.times.filter((t) => t.date > addDays(today, -30)).length} label="Get-togethers in 30 days" />
      </div>
      {month.length > 0 && (
        <>
          <H2 aside="last 30 days">Most time with</H2>
          <div className="lf-pills" aria-label="Most time with">
            {month.slice(0, 8).map((m) => (
              <span key={m.id} className="lf-pill" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {names.get(m.id)} · {m.n}
              </span>
            ))}
          </div>
        </>
      )}
      <H2>Lately</H2>
      {s.times.length ? (
        <div className="i-pnl i-pnl--flush">
          {[...groups].map(([date, list]) =>
            list.map((t) => (
              <button key={t.id} type="button" className="i-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => openSheet({ type: 'pp-time', editId: t.id })}>
                <span className="i-row__t">
                  <b>{t.personIds.map((id) => names.get(id)).join(', ')}</b>
                  <small>
                    {shortDay(date, today)}
                    {t.what ? ` · ${t.what}` : ''}
                    {t.minutes ? ` · ${t.minutes >= 60 ? `${Math.round(t.minutes / 6) / 10} h` : `${t.minutes} min`}` : ''}
                  </small>
                </span>
              </button>
            )),
          )}
        </div>
      ) : (
        <p className="i-note">Log who you spent time with. It takes ten seconds, and Mood will show how days with people compare.</p>
      )}
    </>
  );
}

function GiftsTab({ s, today }: { s: PeopleState; today: string }) {
  const money = useMoneyFmt();
  const names = new Map(s.people.map((p) => [p.id, p.name]));
  const next: Record<string, Gift['state']> = { Idea: 'Bought', Bought: 'Given' };
  const groups = [
    { state: 'Idea', title: 'Ideas' },
    { state: 'Bought', title: 'Bought, to give' },
    { state: 'Given', title: 'Given' },
  ] as const;
  const year = s.gifts.filter((g) => g.state === 'Given' && g.date?.startsWith(today.slice(0, 4)));
  const spent = year.reduce((a, g) => a + (g.price ?? 0), 0);
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pp-gift' })}>
          + Gift idea
        </button>
      </div>
      {year.length > 0 && <p className="lf-nudge">{`${year.length} ${year.length === 1 ? 'gift' : 'gifts'} given this year${spent ? `, ${money(spent)} in all` : ''}.`}</p>}
      {groups.map((grp) => {
        const list = s.gifts.filter((g) => g.state === grp.state);
        if (!list.length) return null;
        return (
          <section key={grp.state} aria-label={grp.title}>
            <H2 aside={String(list.length)}>{grp.title}</H2>
            <div className="i-pnl i-pnl--flush">
              {list.map((g) => (
                <div key={g.id} className="i-row">
                  <button type="button" className="i-row__t" style={{ textAlign: 'left' }} onClick={() => openSheet({ type: 'pp-gift', editId: g.id })}>
                    <b>{g.title}</b>
                    <small>
                      For {names.get(g.personId)}
                      {g.occasion ? ` · ${g.occasion}` : ''}
                      {g.price != null ? ` · ${money(g.price)}` : ''}
                      {g.date ? ` · ${shortDay(g.date, today)}` : ''}
                    </small>
                  </button>
                  {next[g.state] && (
                    <button type="button" className="i-btn i-btn--sm" onClick={() => saveGift({ ...g, state: next[g.state], date: next[g.state] === 'Given' ? today : g.date }, g.id)}>
                      {next[g.state] === 'Bought' ? 'Bought' : 'Given'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!s.gifts.length && <p className="i-note">Jot down gift ideas as they come to you, so a birthday never sneaks up empty-handed.</p>}
    </>
  );
}
