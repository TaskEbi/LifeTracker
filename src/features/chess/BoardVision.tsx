/** /chess/vision: name-the-square against the clock. Seeing the board without counting is trainable. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../../app/router';
import { prefValue, setPref, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { DRILL_SECONDS, isDark, nextSquare, normaliseVision, squareAt, type BoardView } from '../../domain/hq/drills';
import { shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2 } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { ChessArt } from './Art';
import './vision.css';

export function BoardVision() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const scores = useMemo(() => normaliseVision(prefValue(st, 'chess_vision')), [st]);
  const [view, setView] = useState<BoardView>('white');
  const [target, setTarget] = useState<string | null>(null);
  const [left, setLeft] = useState(DRILL_SECONDS);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<{ sq: string; ok: boolean } | null>(null);
  const [finished, setFinished] = useState<{ score: number; misses: number; best: boolean } | null>(null);
  const tally = useRef({ score: 0, misses: 0 });
  const running = target != null;

  const start = () => {
    tally.current = { score: 0, misses: 0 };
    setScore(0);
    setMisses(0);
    setFinished(null);
    setLeft(DRILL_SECONDS);
    setTarget(nextSquare(Math.random(), null));
  };

  useEffect(() => {
    if (!running) return;
    window.scrollTo(0, 0); // the whole board has to be on screen from the first second
    const end = Date.now() + DRILL_SECONDS * 1000;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(t);
        setTarget(null);
        const { score: sc, misses: mi } = tally.current;
        const cur = normaliseVision(prefValue(data.get(), 'chess_vision'));
        const best = sc > cur[view];
        setPref('chess_vision', { ...cur, [view]: Math.max(cur[view], sc), runs: [...cur.runs, { date: today, view, score: sc, misses: mi }].slice(-30) });
        setFinished({ score: sc, misses: mi, best });
      }
    }, 200);
    return () => clearInterval(t);
  }, [running, view, today]);

  const tap = (sq: string) => {
    if (!target) return;
    const ok = sq === target;
    setFlash({ sq, ok });
    window.setTimeout(() => setFlash(null), 180);
    if (ok) {
      tally.current.score++;
      setScore(tally.current.score);
      setTarget(nextSquare(Math.random(), target));
    } else {
      tally.current.misses++;
      setMisses(tally.current.misses);
    }
  };
  const recent = scores.runs.slice(-5).reverse();
  return (
    <div style={accent('chess')}>
      {running ? (
        <h1 className="bv-title">Board vision</h1>
      ) : (
        <>
          <ChannelHead id="chess" sub="board vision" art={<ChessArt />} />
          <button type="button" className="i-link" onClick={() => navigate('chess')}>
            ◀ Back to the column
          </button>
        </>
      )}
      {!running && <Chips label="Play as" value={view} onChange={setView} options={[{ id: 'white' as const, label: `White · best ${scores.white}` }, { id: 'black' as const, label: `Black · best ${scores.black}` }]} />}
      <div className="bv-head" aria-live="polite">
        {running ? (
          <>
            <b className="bv-target">{target}</b>
            <span className="i-mono">
              {left}s · {score} found{misses ? ` · ${misses} missed` : ''}
            </span>
          </>
        ) : finished ? (
          <>
            <b className="bv-target">{finished.score}</b>
            <span>
              in {DRILL_SECONDS} seconds{finished.misses ? `, ${finished.misses} missed` : ', none missed'}.{finished.best ? ' A new best!' : ''}
            </span>
          </>
        ) : (
          <span>Tap each square as it’s named. {DRILL_SECONDS} seconds, as many as you can.</span>
        )}
      </div>
      <div className="bv-board" role={running ? 'group' : 'img'} aria-label={running ? 'Chess board' : `Chess board, seen as ${view}`}>
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const sq = squareAt(view, r, c);
            const cls = `bv-sq ${isDark(sq) ? 'is-dark' : 'is-light'}${flash?.sq === sq ? (flash.ok ? ' is-hit' : ' is-miss') : ''}`;
            return running ? <button key={sq} type="button" className={cls} onClick={() => tap(sq)} aria-label={`Square ${sq}`} /> : <span key={sq} className={cls} />;
          }),
        )}
      </div>
      {!running && (
        <button type="button" className="i-btn i-btn--sig i-btn--block" style={{ marginTop: 10 }} onClick={start}>
          {finished ? 'Again' : 'Start'}
        </button>
      )}
      {recent.length > 0 && !running && (
        <>
          <H2>Lately</H2>
          <div className="i-pnl i-pnl--flush">
            {recent.map((x, i) => (
              <div key={i} className="i-row">
                <span className="i-row__t">
                  As {x.view}
                  <small>
                    {shortDay(x.date, today)}
                    {x.misses ? `, ${x.misses} missed` : ''}
                  </small>
                </span>
                <span className="i-row__n">{x.score}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
