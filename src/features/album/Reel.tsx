/**
 * The year's reel: a full-screen show made from the album, like a film. A countdown leader, the days
 * on film, every face as a timelapse, then and now, the year month by month in prints, the numbers,
 * the whole year as one mosaic, and the end card (with the faces as a video to keep). Tap to go on,
 * tap the left edge to go back. Opens on 31 Dec; before that it can be watched as a labelled preview.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { addDays, shortDay } from '../../domain/log/dates';
import { daysInYear, frameMs, monthPicks, MONTH_NAMES, stamp, tileOf, yearInPhotos, dayOfYear, type AlbumDay, type Shot } from '../../domain/album/album';
import { photoUrl } from '../../lib/photos';
import { toast } from '../../data/ui';
import { Photo } from './Photo';
import { recordFaces, saveFile, videoType } from './video';

type Scene = { k: 'title' } | { k: 'count' } | { k: 'faces' } | { k: 'thennow' } | { k: 'month'; m: number; picks: Shot[] } | { k: 'numbers' } | { k: 'mosaic' } | { k: 'end' };

const reduced = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** Full-size URLs for the faces, fetched one after another while the opening plays. */
function useUrls(shots: Shot[]) {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let live = true;
    void (async () => {
      for (const s of shots) {
        if (!live) return;
        const u = await photoUrl(s.path);
        if (u && live) setUrls((m) => new Map(m).set(s.id, u));
      }
    })();
    return () => {
      live = false;
    };
  }, [shots]);
  return urls;
}

function CountUp({ to, ms = 1400 }: { to: number; ms?: number }) {
  const [n, setN] = useState(reduced() ? to : 0);
  useEffect(() => {
    if (reduced()) return setN(to);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{n}</>;
}

function Faces({ faces, urls, year }: { faces: Shot[]; urls: Map<string, string>; year: number }) {
  const [i, setI] = useState(0);
  const ms = frameMs(faces.length);
  useEffect(() => {
    if (i >= faces.length - 1) return;
    const t = window.setTimeout(() => setI(i + 1), ms);
    return () => window.clearTimeout(t);
  }, [i, ms, faces.length]);
  const cur = faces[i];
  const src = (s: Shot) => urls.get(s.id) ?? s.thumb ?? undefined;
  return (
    <div className="al-rl__faces">
      <img className="al-rl__face" src={src(cur)} alt={`Face on ${shortDay(cur.date)}`} />
      {/* the next few, loaded and decoded ahead so the pace holds */}
      {faces.slice(i + 1, i + 5).map((s) => (
        <img key={s.id} className="al-rl__pre" src={src(s)} alt="" aria-hidden="true" />
      ))}
      <span className="al-rl__stamp">{stamp(cur.date)}</span>
      <span className="al-rl__yearbar" aria-hidden="true">
        <i style={{ width: `${(dayOfYear(cur.date) / daysInYear(year)) * 100}%` }} />
      </span>
      <span className="al-rl__n">
        {i + 1}/{faces.length}
      </span>
    </div>
  );
}

function Mosaic({ days, year }: { days: Map<string, AlbumDay>; year: number }) {
  const total = daysInYear(year);
  const cols = Math.ceil(Math.sqrt(total));
  const cells = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(`${year}-01-01`, i);
    const tile = tileOf(days.get(date));
    const r = Math.floor(i / cols);
    const c = i % cols;
    cells.push(
      <i key={date} className={tile ? 'is-on' : ''} style={{ '--d': `${(r + c) * 34}ms` } as CSSProperties}>
        {tile?.thumb && <img src={tile.thumb} alt="" />}
      </i>,
    );
  }
  return (
    <div className="al-rl__mosaic" style={{ '--cols': cols } as CSSProperties} aria-hidden="true">
      {cells}
    </div>
  );
}

export function ReelPlayer({ days, year, preview, onClose }: { days: Map<string, AlbumDay>; year: number; preview: boolean; onClose: () => void }) {
  const y = useMemo(() => yearInPhotos(days, year), [days, year]);
  const scenes = useMemo<Scene[]>(() => {
    const out: Scene[] = [{ k: 'title' }, { k: 'count' }];
    if (y.faces.length >= 2) out.push({ k: 'faces' }, { k: 'thennow' });
    for (let m = 0; m < 12; m++) {
      const picks = monthPicks(days, year, m, 4);
      if (picks.length) out.push({ k: 'month', m, picks });
    }
    if (y.days) out.push({ k: 'numbers' }, { k: 'mosaic' });
    out.push({ k: 'end' });
    return out;
  }, [days, year, y]);
  const urls = useUrls(y.faces);
  const [at, setAt] = useState(0);
  const [run, setRun] = useState(0);
  const scene = scenes[Math.min(at, scenes.length - 1)];
  const box = useRef<HTMLDivElement>(null);

  const dur = (s: Scene) =>
    s.k === 'title' ? 3800 : s.k === 'count' ? 3000 : s.k === 'faces' ? y.faces.length * frameMs(y.faces.length) + 900 : s.k === 'thennow' ? 3400 : s.k === 'month' ? 2900 : s.k === 'numbers' ? 4200 : s.k === 'mosaic' ? 4600 : 0;

  useEffect(() => {
    if (scene.k === 'end') return;
    const t = window.setTimeout(() => setAt((a) => a + 1), dur(scene));
    return () => window.clearTimeout(t);
  }, [at, run]);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      else if (e.key === 'ArrowRight' || e.key === ' ') setAt((a) => Math.min(scenes.length - 1, a + 1));
      else if (e.key === 'ArrowLeft') setAt((a) => Math.max(0, a - 1));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [scenes.length]);

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button, a')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width * 0.25) setAt((a) => Math.max(0, a - 1));
    else if (scene.k !== 'end') setAt((a) => a + 1);
  };

  // ─── the video ───
  const [making, setMaking] = useState<{ done: number } | null>(null);
  const stop = useRef<AbortController | null>(null);
  useEffect(() => () => stop.current?.abort(), []);
  const canVideo = y.faces.length >= 2 && !!videoType();
  const makeVideo = async () => {
    const ctl = new AbortController();
    stop.current = ctl;
    setMaking({ done: 0 });
    try {
      const { blob, name } = await recordFaces(y.faces, year, { signal: ctl.signal, onProgress: (done) => setMaking({ done }) });
      setMaking(null);
      const how = await saveFile(blob, name);
      toast(how === 'shared' ? 'Video ready' : `Saved ${name}`);
    } catch (e) {
      setMaking(null);
      if ((e as DOMException).name !== 'AbortError') toast(`No video: ${(e as Error).message || 'it couldn’t be made'}`);
    }
  };

  const first = y.faces[0];
  const last = y.faces.at(-1);
  const busiestDay = y.busiest ? days.get(y.busiest.date) : undefined;

  return (
    <div className="al-rl" role="dialog" aria-modal="true" aria-label={`${year} reel`} tabIndex={-1} ref={box} onClick={tap} data-scene={scene.k}>
      <div className="al-rl__bars" aria-hidden="true">
        {scenes.map((s, i) => (
          <i key={i} className={i < at ? 'is-done' : i === at ? 'is-now' : ''} style={i === at && s.k !== 'end' ? ({ '--dur': `${dur(s)}ms` } as CSSProperties) : undefined} />
        ))}
      </div>
      <button type="button" className="al-rl__x" onClick={onClose} aria-label="Close the reel">
        ✕
      </button>
      {preview && <span className="al-rl__peek">Sneak peek · the year so far</span>}
      <i className="al-rl__grain" aria-hidden="true" />

      <div className="al-rl__stage" key={`${at}-${run}`} aria-live="polite">
        {scene.k === 'title' && (
          <div className="al-rl__title">
            <div className="al-rl__leader" aria-hidden="true">
              {[3, 2, 1].map((n, i) => (
                <span key={n} style={{ '--i': i } as CSSProperties}>
                  {n}
                </span>
              ))}
            </div>
            <h2>
              <small>LifeTracker presents</small>
              {year}
              <em>a year on film</em>
            </h2>
          </div>
        )}

        {scene.k === 'count' && (
          <div className="al-rl__count">
            <b>
              <CountUp to={y.days} />
            </b>
            <span>{y.days === 1 ? 'day' : 'days'} on film</span>
            <small>
              {y.faces.length} {y.faces.length === 1 ? 'face' : 'faces'} · {y.memories} {y.memories === 1 ? 'memory' : 'memories'}
            </small>
          </div>
        )}

        {scene.k === 'faces' && <Faces faces={y.faces} urls={urls} year={year} />}

        {scene.k === 'thennow' && first && last && (
          <div className="al-rl__tn">
            <figure style={{ '--i': 0 } as CSSProperties}>
              <Photo shot={first} alt={`First face, ${shortDay(first.date)}`} />
              <figcaption>{shortDay(first.date)}</figcaption>
            </figure>
            <span aria-hidden="true">→</span>
            <figure style={{ '--i': 1 } as CSSProperties}>
              <Photo shot={last} alt={`Latest face, ${shortDay(last.date)}`} />
              <figcaption>{shortDay(last.date)}</figcaption>
            </figure>
            <p>Then and now</p>
          </div>
        )}

        {scene.k === 'month' && (
          <div className="al-rl__month">
            <h2>
              <small>{String(scene.m + 1).padStart(2, '0')}</small>
              {MONTH_NAMES[scene.m]}
            </h2>
            <ul>
              {scene.picks.map((s, i) => (
                <li key={s.id} style={{ '--i': i, '--r': `${((i * 37) % 13) - 6}deg` } as CSSProperties}>
                  <Photo shot={s} alt={s.caption || `Memory, ${shortDay(s.date)}`} />
                  <span>{s.caption || stamp(s.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {scene.k === 'numbers' && (
          <div className="al-rl__nums">
            <h2>The numbers</h2>
            <dl>
              <div style={{ '--i': 0 } as CSSProperties}>
                <dt>Longest run</dt>
                <dd>
                  {y.best} <small>{y.best === 1 ? 'day' : 'days'} in a row</small>
                </dd>
              </div>
              <div style={{ '--i': 1 } as CSSProperties}>
                <dt>Memories</dt>
                <dd>
                  {y.memories} <small>{y.captions ? `${y.captions} with words` : 'pictures'}</small>
                </dd>
              </div>
              {y.topMonth !== null && (
                <div style={{ '--i': 2 } as CSSProperties}>
                  <dt>Most on film</dt>
                  <dd>
                    {MONTH_NAMES[y.topMonth]} <small>{y.memoriesByMonth[y.topMonth]} memories</small>
                  </dd>
                </div>
              )}
              {y.busiest && busiestDay && (
                <div style={{ '--i': 3 } as CSSProperties} className="al-rl__busy">
                  <dt>Biggest day</dt>
                  <dd>
                    {shortDay(y.busiest.date)} <small>{y.busiest.n} memories</small>
                  </dd>
                  {tileOf(busiestDay) && <Photo shot={tileOf(busiestDay)!} small alt="" />}
                </div>
              )}
            </dl>
          </div>
        )}

        {scene.k === 'mosaic' && (
          <div className="al-rl__mos">
            <Mosaic days={days} year={year} />
            <p>
              <b>{year}</b>, every day of it
            </p>
          </div>
        )}

        {scene.k === 'end' && (
          <div className="al-rl__end">
            <h2>
              That was {year}.<small>{preview ? `The full reel opens on 31 Dec.` : `See you in ${year + 1}.`}</small>
            </h2>
            <div className="al-rl__endbtns">
              <button
                type="button"
                className="al-btn al-btn--main"
                onClick={() => {
                  setAt(0);
                  setRun((r) => r + 1);
                }}
              >
                Watch again
              </button>
              {y.faces.length >= 2 &&
                (canVideo ? (
                  making ? (
                    <button type="button" className="al-btn" onClick={() => stop.current?.abort()}>
                      Making the video · {making.done}/{y.faces.length} · Stop
                    </button>
                  ) : (
                    <button type="button" className="al-btn" onClick={() => void makeVideo()}>
                      Save the faces as a video
                    </button>
                  )
                ) : (
                  <p className="al-rl__small">This browser can’t make a video of the faces.</p>
                ))}
              <button type="button" className="al-btn" onClick={onClose}>
                Close
              </button>
            </div>
            {making && <p className="al-rl__small">It records in real time: about {Math.ceil((y.faces.length * Math.max(83, frameMs(y.faces.length)) + 3700) / 1000)} seconds. Keep this screen open.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
