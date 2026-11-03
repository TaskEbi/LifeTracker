/** 殿堂: your all-time bests as plaques, with how close the last 30 days came to each. */
import { useMemo, type CSSProperties } from 'react';
import { progressInput, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { hallOfRecords } from '../../../domain/hq/hall';
import { shortDay } from '../../../domain/log/dates';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';

export function HallRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const records = useMemo(() => hallOfRecords(progressInput(st, today)), [st, today]);
  const closest = useMemo(() => records.filter((r) => r.chase != null && r.chase < 1 && r.chase >= 0.7).sort((a, b) => b.chase! - a.chase!)[0], [records]);
  return (
    <div>
      <RoomHead room="hall" />
      {closest && (
        <p className="hq-verdict">
          Closest to falling: <b>{closest.label}</b>, {closest.value}. The last 30 days got to {Math.round(closest.chase! * 100)}% of it.
        </p>
      )}
      {records.length ? (
        <div className="hq-plaques">
          {records.map((r) => (
            <article key={r.id} className="hq-plaque" style={accent(r.section)}>
              <span className="hq-plaque__k" aria-hidden="true">
                {r.section ? sectionInfo(r.section).kanji : '王'}
              </span>
              <b className="hq-plaque__v">{r.value}</b>
              <span className="hq-plaque__l">{r.label}</span>
              <small>{shortDay(r.date, today)}</small>
              {r.chase != null && (
                <span className="hq-plaque__chase" role="img" aria-label={`Last 30 days reached ${Math.min(100, Math.round(r.chase * 100))}% of this record`} style={{ '--p': `${Math.min(100, r.chase * 100)}%` } as CSSProperties}>
                  <i />
                </span>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="i-note">The plinths are empty. Log something and it’s the record to beat.</p>
      )}
      <p className="i-note">The bar under each is how close the last 30 days came. Found in your records, so editing a session can change a record.</p>
    </div>
  );
}
