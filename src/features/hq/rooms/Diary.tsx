/** 五年日記: one line a day, the same question on the same date every year. */
import { useEffect, useState } from 'react';
import { useToday } from '../../../data/lt';
import { diaryStreak, questionFor, sameDayBefore } from '../../../domain/hq/diary';
import { longDay, shortDay } from '../../../domain/log/dates';
import { H2 } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';
import { saveDiary, useHq } from '../store';

/** Today's question and your line; also used in closing the day. */
export function DiaryLine({ date }: { date: string }) {
  const hq = useHq();
  const entry = hq.diary.find((e) => e.date === date);
  const [text, setText] = useState(entry?.text ?? '');
  useEffect(() => setText(entry?.text ?? ''), [entry?.text]);
  return (
    <label className="dy-line">
      <span className="dy-q">{questionFor(date)}</span>
      <textarea className="i-textarea" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() !== (entry?.text ?? '') && text.trim() && saveDiary(date, text)} placeholder="One line is enough" maxLength={1000} aria-label={questionFor(date)} />
      {entry && text.trim() === entry.text && <small className="dy-saved">Saved</small>}
    </label>
  );
}

export function DiaryRoom() {
  const today = useToday();
  const hq = useHq();
  const before = sameDayBefore(hq.diary, today);
  const recent = hq.diary.filter((e) => e.date < today).slice(0, 14);
  const streak = diaryStreak(hq.diary, today);
  return (
    <div>
      <RoomHead room="diary" />
      <p className="dy-date">{longDay(today)}</p>
      <div className="i-pnl">
        <DiaryLine date={today} />
      </div>
      {before.length > 0 ? (
        <>
          <H2>This day in other years</H2>
          <div className="i-pnl i-pnl--flush">
            {before.map((e) => (
              <div key={e.date} className="dy-past">
                <b className="i-mono">{e.date.slice(0, 4)}</b>
                <p>{e.text}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="i-note" style={{ marginTop: 10 }}>Every date has its own question, and it comes back on the same date every year. A year from today you’ll see what you wrote here, right above the same question. It takes a while to pay off, then it’s the best thing in the app.</p>
      )}
      {recent.length > 0 && (
        <>
          <H2 aside={streak > 1 ? `${streak} days in a row` : undefined}>Lately</H2>
          <div className="i-pnl i-pnl--flush">
            {recent.map((e) => (
              <div key={e.date} className="dy-past">
                <small>
                  {shortDay(e.date, today)} · {questionFor(e.date)}
                </small>
                <p>{e.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
