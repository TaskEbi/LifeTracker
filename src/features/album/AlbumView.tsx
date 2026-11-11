/**
 * 写 Album: a photo of your face every day and a few memories, kept like prints in a darkroom.
 * /album is today, /album/day/<date> any day before it, /album/sheet the year as contact sheets,
 * /album/reel the year's reel (opens on 31 Dec; a labelled sneak peek before that).
 */
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import {
  albumStreak,
  clipLength,
  coverOf,
  daysInYear,
  daysToReel,
  MEMORIES_PER_DAY,
  MONTH_NAMES,
  VIDEO_MAX_SECONDS,
  onThisDay,
  reelOpen,
  reelOpensOn,
  stamp,
  tileOf,
  yearInPhotos,
  type AlbumDay,
  type Shot,
} from '../../domain/album/album';
import { addDays, daysBetween, isDate, longDay, monthEnd, relativeDay, shortDay, weekdayIndex } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { HomeLink } from '../../ui/i/ChannelHead';
import { AlbumArt } from './Art';
import { FaceCamera } from './Camera';
import { Photo } from './Photo';
import { ReelPlayer } from './Reel';
import { addClip, addShot, useAlbum } from './store';
import { isVideoFile, readClip } from './clip';
import './ShotSheet';
import './album.css';

const TABS = [
  { id: '', label: 'Today', k: '今' },
  { id: 'sheet', label: 'Contact sheet', k: '帳' },
  { id: 'reel', label: 'Reel', k: '映' },
] as const;

/** The last face before a day, for the camera's ghost. */
function lastFaceBefore(days: Map<string, AlbumDay>, date: string): Shot | null {
  let best: Shot | null = null;
  for (const d of days.values()) if (d.face && d.date < date && (!best || d.date > best.date)) best = d.face;
  // on a retake, line up with the day's own face if there's nothing earlier
  return best ?? days.get(date)?.face ?? null;
}

export function AlbumView() {
  const route = useRoute();
  const today = useToday();
  const { days, shots } = useAlbum();
  const tab = route.rest[0] === 'sheet' ? 'sheet' : route.rest[0] === 'reel' ? 'reel' : '';
  const dayParam = route.rest[0] === 'day' && isDate(route.rest[1]) && route.rest[1] <= today ? route.rest[1] : null;
  const streak = useMemo(() => albumStreak(days.keys(), today), [days, today]);
  const year = Number(today.slice(0, 4));
  const filmed = useMemo(() => [...days.values()].filter((d) => d.date.startsWith(`${year}-`) && (d.face || d.memories.length)).length, [days, year]);
  // the latest prints for the drying line in the header
  const prints = useMemo(
    () =>
      [...days.values()]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => coverOf(d) ?? d.face)
        .filter((s): s is Shot => !!s)
        .slice(-5),
    [days],
  );

  return (
    <div className="al">
      <ChannelBar current="album" />
      <header className="i-chhead al-head">
        <AlbumArt prints={prints} />
        <HomeLink />
        <div className="i-chhead__t">
          <span className="i-chhead__k">写 · album</span>
          <h1>Album</h1>
          <p className="i-chhead__sub">
            {filmed} of {daysInYear(year)} days on film{streak.current > 1 ? ` · ${streak.current} days in a row` : ''}
          </p>
        </div>
      </header>

      <nav className="al-tabs" aria-label="Album">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="al-tab" aria-current={tab === t.id && !(t.id === '' && dayParam) ? 'page' : undefined} onClick={() => navigate('album', t.id ? [t.id] : [])}>
            <span aria-hidden="true">{t.k}</span> {t.label}
          </button>
        ))}
      </nav>

      {tab === 'sheet' ? <ContactSheet days={days} today={today} /> : tab === 'reel' ? <ReelPage days={days} today={today} shots={shots} /> : <Day date={dayParam ?? today} today={today} days={days} />}
    </div>
  );
}

// ─── a day ──────────────────────────────────────────────────────────────────

function Day({ date, today, days }: { date: string; today: string; days: Map<string, AlbumDay> }) {
  const day = days.get(date);
  const [camera, setCamera] = useState(false);
  const [developing, setDeveloping] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const mode = useStore(data, (s) => s.mode);
  const isToday = date === today;
  const memories = day?.memories ?? [];
  const room = MEMORIES_PER_DAY - memories.length;
  const ghost = useMemo(() => lastFaceBefore(days, date), [days, date]);
  const past = isToday ? onThisDay(days, today) : [];

  const addFiles = async (files: File[]) => {
    const take = files.slice(0, Math.max(0, room));
    if (!take.length) return toast(`A day holds ${MEMORIES_PER_DAY} memories`);
    setDeveloping(take.length);
    const added: Shot[] = [];
    let failed = 0;
    let why = '';
    for (const f of take) {
      try {
        added.push(isVideoFile(f) ? await addClip(await readClip(f), date) : await addShot(f, date, 'memory'));
      } catch (e) {
        failed++;
        why = isVideoFile(f) && e instanceof Error ? e.message : 'That photo couldn’t be read';
      }
      setDeveloping((n) => n - 1);
    }
    setDeveloping(0);
    const skipped = files.length - take.length;
    if (failed === 1 && take.length === 1) toast(why);
    else if (failed) toast(`${failed} couldn’t be kept${added.length ? ` · ${added.length} added` : ''} · ${why}`);
    else if (added.length === 1 && !skipped) openSheet({ type: 'album-shot', id: added[0].id, fresh: true });
    else toast(`${added.length} ${added.length === 1 ? 'memory' : 'memories'} added${skipped ? ` · ${skipped} left out (${MEMORIES_PER_DAY} a day)` : ''}`);
  };

  // the fortnight up to today, to hop between days
  const strip = daysBetween(addDays(today, -13), today);

  return (
    <>
      <div className="al-daynav">
        <button type="button" className="al-daynav__b" onClick={() => navigate('album', ['day', addDays(date, -1)])} aria-label="The day before">
          ‹
        </button>
        <h2 className="al-daynav__t">
          <b>{relativeDay(date, today)}</b>
          <small>{longDay(date)}</small>
        </h2>
        <button type="button" className="al-daynav__b" disabled={isToday} onClick={() => navigate('album', addDays(date, 1) === today ? [] : ['day', addDays(date, 1)])} aria-label="The day after">
          ›
        </button>
      </div>

      <section className="al-face" aria-label={isToday ? 'Today’s face' : 'The face of the day'}>
        {day?.face ? (
          <button type="button" className="al-face__print" onClick={() => openSheet({ type: 'album-shot', id: day.face!.id })} aria-label={`Face, ${shortDay(date)}${day.face.caption ? `: ${day.face.caption}` : ''}`}>
            <Photo shot={day.face} />
            <span className="al-stamp">{stamp(date)}</span>
            {day.face.caption && <span className="al-face__cap">{day.face.caption}</span>}
          </button>
        ) : (
          <button type="button" className="al-face__empty" onClick={() => setCamera(true)}>
            <span className="al-face__oval" aria-hidden="true" />
            <b>{isToday ? 'Take today’s face' : 'Add a face for this day'}</b>
            <small>{ghost ? 'Line up with the last one, so the year’s timelapse holds still' : 'One a day, the same way each time: the year’s timelapse is made of these'}</small>
          </button>
        )}
        {day?.face && (
          <button type="button" className="al-btn al-face__retake" onClick={() => setCamera(true)}>
            Retake
          </button>
        )}
      </section>

      <section className="al-mem" aria-labelledby="al-mem-h">
        <div className="al-h2">
          <h2 id="al-mem-h">
            <span aria-hidden="true">憶</span> Memories
          </h2>
          <small>
            {memories.length}/{MEMORIES_PER_DAY}
          </small>
        </div>
        <ul className="al-prints" aria-label={`Memories, ${shortDay(date)}`}>
          {memories.map((m, i) => (
            <li key={m.id} className="al-print" style={{ '--r': `${((i * 41) % 9) - 4}deg` } as CSSProperties}>
              <button type="button" onClick={() => openSheet({ type: 'album-shot', id: m.id })} aria-label={`Memory ${i + 1}${m.video ? `, video${m.dur ? ` ${clipLength(m.dur)}` : ''}` : ''}${m.caption ? `: ${m.caption}` : ''}${m.star ? ' (cover)' : ''}`}>
                <Photo shot={m} />
                <span className="al-print__cap">{m.caption || ' '}</span>
                {m.star && (
                  <span className="al-print__star" aria-hidden="true">
                    ★
                  </span>
                )}
              </button>
            </li>
          ))}
          {Array.from({ length: developing }, (_, i) => (
            <li key={`dev${i}`} className="al-print is-developing" aria-label="Developing">
              <span className="al-print__dev" />
            </li>
          ))}
          {room > 0 && !developing && (
            <li className="al-print al-print--add">
              <button type="button" onClick={() => input.current?.click()}>
                <b aria-hidden="true">+</b>
                <span>{memories.length ? 'Another memory' : 'Add a memory'}</span>
              </button>
            </li>
          )}
        </ul>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          aria-label="Choose memories"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (files.length) void addFiles(files);
          }}
        />
        {!memories.length && (
          <p className="al-hint">
            Whatever you want to remember about {isToday ? 'today' : 'the day'}: the view, who you were with, what you ate, the thing that made you laugh. Photos or short videos (up to {VIDEO_MAX_SECONDS} seconds).
          </p>
        )}
      </section>

      <section className="al-strip" aria-label="The last two weeks">
        <ol>
          {strip.map((d) => {
            const s = tileOf(days.get(d), 'face');
            return (
              <li key={d}>
                <button type="button" aria-current={d === date ? 'date' : undefined} onClick={() => navigate('album', d === today ? [] : ['day', d])} aria-label={`${shortDay(d)}${s ? '' : ', nothing yet'}`}>
                  {s?.thumb ? <img src={s.thumb} alt="" /> : <span className="al-strip__none" />}
                  <small>{d.slice(8)}</small>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {past.length > 0 && (
        <section className="al-otd" aria-labelledby="al-otd-h">
          <div className="al-h2">
            <h2 id="al-otd-h">
              <span aria-hidden="true">昔</span> On this day
            </h2>
          </div>
          <ul>
            {past.map(({ years, day: d }) => {
              const s = tileOf(d, 'face');
              return (
                <li key={d.date}>
                  <button type="button" onClick={() => navigate('album', ['day', d.date])}>
                    {s && <Photo shot={s} small />}
                    <span>
                      <b>{years === 1 ? 'A year ago' : `${years} years ago`}</b>
                      <small>
                        {shortDay(d.date)} · {d.face ? 'face' : ''}
                        {d.face && d.memories.length ? ' + ' : ''}
                        {d.memories.length ? `${d.memories.length} ${d.memories.length === 1 ? 'memory' : 'memories'}` : ''}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ReelTeaser days={days} today={today} />

      <p className="al-note">
        {mode === 'synced'
          ? 'Photos and videos are kept on this phone first, then uploaded to your private storage when it syncs (photos with Curio Cabinet’s, videos in a bucket of their own).'
          : 'Local only: photos and videos stay in this browser on this device and aren’t uploaded anywhere.'}
      </p>

      {camera && (
        <FaceCamera
          date={date}
          ghost={ghost}
          onClose={() => setCamera(false)}
          onShot={async (blob) => {
            await addShot(blob, date, 'face');
            setCamera(false);
            toast(isToday ? 'Today’s face is on film' : `Face added for ${shortDay(date)}`);
          }}
        />
      )}
    </>
  );
}

function ReelTeaser({ days, today }: { days: Map<string, AlbumDay>; today: string }) {
  const year = Number(today.slice(0, 4));
  const open = reelOpen(year, today);
  const n = daysToReel(year, today);
  const y = useMemo(() => yearInPhotos(days, year), [days, year]);
  return (
    <button type="button" className={`al-teaser${open ? ' is-open' : ''}`} onClick={() => navigate('album', ['reel'])}>
      <span className="al-can" aria-hidden="true">
        <i />
      </span>
      <span>
        <b>{open ? `The ${year} reel is ready` : `The ${year} reel`}</b>
        <small>{open ? `${y.days} days, ${y.faces.length} faces, ${y.memories} memories. Press play.` : `Opens on 31 Dec · ${n === 1 ? 'tomorrow' : `in ${n} days`} · ${y.days} ${y.days === 1 ? 'day' : 'days'} on film so far`}</small>
      </span>
    </button>
  );
}

// ─── contact sheet ──────────────────────────────────────────────────────────

function ContactSheet({ days, today }: { days: Map<string, AlbumDay>; today: string }) {
  const thisYear = Number(today.slice(0, 4));
  const years = useMemo(() => [...new Set([thisYear, ...[...days.keys()].map((d) => Number(d.slice(0, 4)))])].sort((a, b) => b - a), [days, thisYear]);
  const [year, setYear] = useState(thisYear);
  const [show, setShow] = useState<'face' | 'memory'>('face');
  const lastMonth = year === thisYear ? Number(today.slice(5, 7)) - 1 : 11;
  const months = Array.from({ length: lastMonth + 1 }, (_, m) => lastMonth - m);
  return (
    <section className="al-sheet" aria-label="Contact sheet">
      <div className="al-sheet__bar">
        {years.length > 1 && (
          <div className="i-chips" role="group" aria-label="Year">
            {years.map((y) => (
              <button key={y} type="button" className="i-chip" aria-pressed={y === year} onClick={() => setYear(y)}>
                {y}
              </button>
            ))}
          </div>
        )}
        <div className="i-chips" role="group" aria-label="Show">
          <button type="button" className="i-chip" aria-pressed={show === 'face'} onClick={() => setShow('face')}>
            Faces
          </button>
          <button type="button" className="i-chip" aria-pressed={show === 'memory'} onClick={() => setShow('memory')}>
            Memories
          </button>
        </div>
      </div>
      {months.map((m) => {
        const first = `${year}-${String(m + 1).padStart(2, '0')}-01`;
        const list = daysBetween(first, monthEnd(first));
        const count = list.filter((d) => days.get(d)?.face || days.get(d)?.memories.length).length;
        return (
          <div key={m} className="al-month">
            <h3>
              {MONTH_NAMES[m]} <small>{count ? `${count} ${count === 1 ? 'day' : 'days'}` : 'nothing yet'}</small>
            </h3>
            <ol className="al-grid" style={{ '--off': weekdayIndex(first) } as CSSProperties} aria-label={`${MONTH_NAMES[m]} ${year}`}>
              {list.map((d) => {
                const day = days.get(d);
                const s = tileOf(day, show);
                const future = d > today;
                return (
                  <li key={d}>
                    <button type="button" disabled={future} onClick={() => navigate('album', d === today ? [] : ['day', d])} aria-label={`${shortDay(d)}${day?.face ? ', face' : ''}${day?.memories.length ? `, ${day.memories.length} ${day.memories.length === 1 ? 'memory' : 'memories'}` : ''}`} className={d === today ? 'is-today' : undefined}>
                      {s?.thumb && <img src={s.thumb} alt="" />}
                      <small>{Number(d.slice(8))}</small>
                      {show === 'face' && !!day?.memories.length && <i className="al-grid__dot" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

// ─── the reel ───────────────────────────────────────────────────────────────

function ReelPage({ days, today, shots }: { days: Map<string, AlbumDay>; today: string; shots: Shot[] }) {
  const route = useRoute();
  const thisYear = Number(today.slice(0, 4));
  const asked = Number(route.rest[1]);
  const years = useMemo(() => [...new Set([thisYear, ...shots.map((s) => Number(s.date.slice(0, 4)))])].sort((a, b) => b - a), [shots, thisYear]);
  const year = years.includes(asked) ? asked : thisYear;
  const open = reelOpen(year, today);
  const y = useMemo(() => yearInPhotos(days, year), [days, year]);
  const [playing, setPlaying] = useState<null | 'full' | 'peek'>(null);
  const n = daysToReel(year, today);
  const sofar = year === thisYear ? daysBetween(`${year}-01-01`, today).length : daysInYear(year);

  return (
    <section className="al-reel" aria-label={`${year} reel`}>
      {years.length > 1 && (
        <div className="i-chips" role="group" aria-label="Year">
          {years.map((yy) => (
            <button key={yy} type="button" className="i-chip" aria-pressed={yy === year} onClick={() => navigate('album', yy === thisYear ? ['reel'] : ['reel', String(yy)])}>
              {yy}
            </button>
          ))}
        </div>
      )}

      <div className={`al-canister${open ? ' is-open' : ''}`}>
        <span className="al-canister__can" aria-hidden="true">
          <i />
          <b>{year}</b>
        </span>
        {open ? (
          <>
            <h2>The {year} reel</h2>
            <p>{y.days ? `${y.days} days on film. Sound off is fine; it’s all pictures.` : `Nothing was filmed in ${year}.`}</p>
            <button type="button" className="al-btn al-btn--main" onClick={() => setPlaying('full')} disabled={!y.days}>
              ▶ Play the reel
            </button>
          </>
        ) : (
          <>
            <h2>Sealed until 31 December</h2>
            <p>
              {n === 1 ? 'Tomorrow' : `${n} days to go`}. Every face and memory from {year} is going into it: a timelapse of your face, the year month by month, the numbers and the whole year as one picture.
            </p>
            <div className="al-canister__meter" role="progressbar" aria-label={`Days on film in ${year}`} aria-valuenow={y.days} aria-valuemin={0} aria-valuemax={daysInYear(year)}>
              <i style={{ width: `${(y.days / daysInYear(year)) * 100}%` }} />
            </div>
            <small>
              {y.days} of {sofar} days so far · opens {shortDay(reelOpensOn(year))}
            </small>
            <button type="button" className="al-btn" onClick={() => setPlaying('peek')}>
              Sneak peek at the year so far
            </button>
          </>
        )}
      </div>

      {(open || y.days > 0) && (
        <dl className="al-facts">
          <div>
            <dt>Days on film</dt>
            <dd>{y.days}</dd>
          </div>
          <div>
            <dt>Faces</dt>
            <dd>{y.faces.length}</dd>
          </div>
          <div>
            <dt>Memories</dt>
            <dd>{y.memories}</dd>
          </div>
          <div>
            <dt>Longest run</dt>
            <dd>{y.best}</dd>
          </div>
        </dl>
      )}

      {open && y.faces.length > 0 && (
        <div className="al-faces">
          <h3>Every face</h3>
          <ol>
            {y.faces.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => navigate('album', ['day', f.date])} aria-label={shortDay(f.date)}>
                  {f.thumb ? <img src={f.thumb} alt="" /> : <span />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {playing && <ReelPlayer days={days} year={year} preview={playing === 'peek'} onClose={() => setPlaying(null)} />}
    </section>
  );
}
