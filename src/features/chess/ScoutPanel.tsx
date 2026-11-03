/** The scout report: patterns in your own games, from the same public data as the rest of the page. */
import { useMemo } from 'react';
import { data } from '../../data/store';
import { scout, type Score, type ScoutGame } from '../../domain/hq/chessScout';
import { H2 } from '../../ui/i/bits';

function hourIn(tz: string) {
  const fmt = (() => {
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' });
    } catch {
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23' });
    }
  })();
  return (unix: number) => Number(fmt.format(new Date(unix * 1000)));
}

function ScoreBar({ label, s }: { label: string; s: Score }) {
  return (
    <div className="c-scout" role="img" aria-label={`${label}: ${s.pct}%, ${s.win} wins, ${s.draw} draws, ${s.loss} losses`}>
      <span className="c-scout__l">{label}</span>
      <span className="c-scout__bar" aria-hidden="true">
        <i className="is-w" style={{ flexGrow: s.win }} />
        <i className="is-d" style={{ flexGrow: s.draw }} />
        <i className="is-l" style={{ flexGrow: s.loss }} />
      </span>
      <b className="c-scout__p">{s.pct}%</b>
      <small className="c-scout__n">{s.n}</small>
    </div>
  );
}

export function ScoutPanel({ games }: { games: ScoutGame[] }) {
  const tz = data.get().settings.log_timezone;
  const report = useMemo(() => scout(games, hourIn(tz)), [games, tz]);
  if (!report) return null;
  return (
    <>
      <H2 aside={`${report.games} rated games`}>Scout report</H2>
      <div className="i-pnl i-stack">
        {report.lossRun >= 3 && (
          <p className="c-tilt" role="status">
            停 Stop-loss: {report.lossRun} losses in a row.
          </p>
        )}
        {report.advice.filter((a) => !a.startsWith('You’ve lost')).map((a) => (
          <p key={a} className="i-note">
            {a}
          </p>
        ))}
        <div>
          <span className="i-lab">By colour</span>
          <ScoreBar label="White" s={report.white} />
          <ScoreBar label="Black" s={report.black} />
        </div>
        {report.openings.length > 0 && (
          <div>
            <span className="i-lab">By opening</span>
            {report.openings.slice(0, 8).map((o) => (
              <ScoreBar key={o.name} label={o.name} s={o} />
            ))}
          </div>
        )}
        <div>
          <span className="i-lab">By time of day</span>
          {report.hours.map((h) => (
            <ScoreBar key={h.label} label={h.label} s={h} />
          ))}
        </div>
        {report.afterLoss && report.afterWin && (
          <div>
            <span className="i-lab">In the same sitting</span>
            <ScoreBar label="After a win" s={report.afterWin} />
            <ScoreBar label="After a loss" s={report.afterLoss} />
          </div>
        )}
        <p className="i-note">Scores count a win as 1 and a draw as ½. From your last two months of rated live games.</p>
      </div>
    </>
  );
}
