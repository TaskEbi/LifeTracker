/**
 * /screen/bouncer: stands between you and the scroll. A minute's pause, then a choice, and no guilt
 * either way: most urges pass if you wait. Point an iPhone Shortcuts automation at this page, and
 * opening Instagram opens this first.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { useToday } from '../../data/lt';
import { urgeTotals, URGE_SECONDS } from '../../domain/hq/drills';
import { reviewQueue } from '../../domain/hq/srs';
import { weekStart } from '../../domain/log/dates';
import { accent, H2, Meter } from '../../ui/i/bits';
import { countUrge, useHq } from '../hq/store';
import './bouncer.css';

/** On the Screen page. */
export function BouncerCard() {
  const today = useToday();
  const hq = useHq();
  const t = urgeTotals(hq.urges, weekStart(today));
  return (
    <button type="button" className="bo-card" onClick={() => navigate('screen', ['bouncer'])}>
      <span className="bo-card__k" aria-hidden="true">
        門番
      </span>
      <span>
        <b>About to scroll?</b>
        <small>{t.weekHeld + t.weekGave ? `${t.weekHeld} urges waited out this week` : 'Give it one minute first'}</small>
      </span>
    </button>
  );
}

export function BouncerPage() {
  const today = useToday();
  const hq = useHq();
  const [left, setLeft] = useState(URGE_SECONDS);
  const [said, setSaid] = useState<'held' | 'gave' | null>(null);
  useEffect(() => {
    if (left <= 0) return;
    const end = Date.now() + left * 1000;
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))), 250);
    return () => clearInterval(t);
  }, []);
  const totals = urgeTotals(hq.urges, weekStart(today));
  const due = useMemo(() => reviewQueue(hq.cards, today).length, [hq.cards, today]);
  const answer = (held: boolean) => {
    countUrge(today, held);
    setSaid(held ? 'held' : 'gave');
  };
  const pct = 1 - left / URGE_SECONDS;
  return (
    <div style={accent('screen')}>
      <header className="bo-head">
        <button type="button" className="i-link" onClick={() => navigate('screen')}>
          ◀ Screen time
        </button>
        <h1>
          <span lang="ja" aria-hidden="true">
            門番
          </span>{' '}
          The bouncer
        </h1>
      </header>
      {said ? (
        <section className="i-pnl i-stack" aria-label="Done">
          <p className="bo-big">{said === 'held' ? 'Good. That’s one you got back.' : 'OK. It’s logged, not judged. You still stopped to think.'}</p>
          <button type="button" className="i-btn i-btn--block" onClick={() => navigate('screen')}>
            Back to screen time
          </button>
        </section>
      ) : left > 0 ? (
        <section className="bo-wait" aria-label="One minute">
          <span className="bo-ring" style={{ '--p': `${pct * 360}deg` } as CSSProperties} role="timer" aria-label={`${left} seconds`}>
            <b className="i-mono">{left}</b>
          </span>
          <p className="bo-big">One minute. Just wait.</p>
          <p className="i-note">Urges rise, peak and pass, usually sooner than you’d think. You don’t have to fight it, only let this run.</p>
          <button type="button" className="i-link" onClick={() => setLeft(0)}>
            Skip the wait
          </button>
        </section>
      ) : (
        <section className="i-pnl i-stack" aria-label="Still want to?">
          <p className="bo-big">Still want to?</p>
          <p className="i-note">Instead, you could:</p>
          <div className="i-chips i-chips--wrap">
            {due > 0 && (
              <button type="button" className="i-chip" onClick={() => (answer(true), navigate('base', ['dojo']))}>
                Recall {due} {due === 1 ? 'card' : 'cards'}
              </button>
            )}
            <button type="button" className="i-chip" onClick={() => (answer(true), navigate('reading'))}>
              Read a page
            </button>
            <button type="button" className="i-chip" onClick={() => (answer(true), navigate('base', ['breath']))}>
              Breathe
            </button>
            <button type="button" className="i-chip" onClick={() => (answer(true), navigate('home'))}>
              Next move
            </button>
          </div>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => answer(true)}>
            I’ll stay off it
          </button>
          <button type="button" className="i-btn i-btn--block" onClick={() => answer(false)}>
            I’m going in anyway
          </button>
        </section>
      )}
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={totals.weekHeld} label="Waited out this week" />
        <Meter value={totals.rate != null ? `${Math.round(totals.rate * 100)}%` : '—'} label="Urges waited out, all time" />
      </div>
      <H2>Make it automatic on your iPhone</H2>
      <ol className="bo-steps">
        <li>Open the Shortcuts app, go to Automation, and tap +.</li>
        <li>Choose App, pick Instagram (or whatever you scroll), and “Is Opened”. Set it to run immediately.</li>
        <li>Add the action “Open URLs” with this address:</li>
      </ol>
      <code className="bo-url">{location.origin}/screen/bouncer</code>
      <p className="i-note" style={{ marginTop: 8 }}>Then opening that app sends you here first.</p>
      <p className="i-note">Two catches. It opens in Safari, which on an iPhone keeps its data apart from the Home Screen app, so sign in there once or your count stays in Safari. And it fires every time the app opens, including when you go back in after this, because the automation can’t tell. If that gets in the way, turn it on only for the app you most want to stay out of, or switch the automation off for the day.</p>
    </div>
  );
}
