/**
 * 金 Money, at /money: the wallet (pocket money in, spending out), saving goals (/money/goals)
 * and where it goes (/money/spending). The wallet is worked out from the movements.
 */
import { useMemo, type CSSProperties } from 'react';
import { useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { toast } from '../../data/ui';
import { addDays, monthStart, shortDay, weekStart } from '../../domain/log/dates';
import { allowanceDue, byCategory, goalPace, goalSaved, noSpendRun, received, spent, wallet, weekdaySpend, type Tx } from '../../domain/money/model';
import { H2, Meter, Source } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { Empty, LifePage } from '../life/Frame';
import { saveGoal, saveTx, useMoney, useMoneyFmt, type MoneyState } from './store';
import './sheets';
import './money.css';

/** One line for Home. */
export function moneyLine(m: MoneyState, today: string, fmt: (n: number) => string): string {
  if (!m.txs.length) return 'Pocket money, spending and saving goals';
  if (m.allowance) {
    const due = allowanceDue(m.allowance, m.txs, today);
    if (!due.got) return `Pocket money day · ${fmt(wallet(m.txs))} in the wallet`;
  }
  return `${fmt(wallet(m.txs))} in the wallet · ${fmt(spent(m.txs, weekStart(today), today))} spent this week`;
}

export function MoneyPage() {
  const route = useRoute();
  const tab = route.rest[0] === 'goals' ? 'goals' : route.rest[0] === 'spending' ? 'spending' : '';
  const m = useMoney();
  const fmt = useMoneyFmt();
  const today = useToday();
  const open = m.goals.filter((g) => !g.done).length;
  const started = m.txs.length > 0 || m.allowance != null;
  return (
    <LifePage
      id="money"
      tabs={started ? [{ id: '', label: 'Wallet' }, { id: 'goals', label: 'Saving', n: open }, { id: 'spending', label: 'Where it goes' }] : undefined}
      tab={tab}
      aside={
        started ? (
          <span className="lf-head__big">
            <b>{fmt(wallet(m.txs))}</b>
            <span>in the wallet</span>
          </span>
        ) : undefined
      }
    >
      {!started ? (
        <Empty action="Set up" onAction={() => openSheet({ type: 'mn-settings' })}>
          Track pocket money coming in, what you spend it on, and what you’re saving for. Tell it what’s in your wallet now and how much pocket money you get; after that it takes a few seconds a day.
        </Empty>
      ) : tab === 'goals' ? (
        <GoalsTab m={m} fmt={fmt} today={today} />
      ) : tab === 'spending' ? (
        <SpendingTab m={m} fmt={fmt} today={today} />
      ) : (
        <WalletTab m={m} fmt={fmt} today={today} />
      )}
    </LifePage>
  );
}

function TxRow({ t, fmt, today, goals }: { t: Tx; fmt: (n: number) => string; today: string; goals: Map<string, string> }) {
  const sign = t.dir === 'in' ? '+' : t.dir === 'out' ? '−' : t.amount > 0 ? '→' : '←';
  const label = t.dir === 'save' ? `${t.amount > 0 ? 'Into' : 'Out of'} ${goals.get(t.goalId ?? '') ?? 'a goal'}` : t.note || t.category;
  return (
    <button type="button" className={`i-row mn-tx is-${t.dir}`} onClick={() => t.dir !== 'save' && openSheet({ type: 'mn-tx', editId: t.id })} disabled={t.dir === 'save'}>
      <span className="i-row__t">
        <b>{label}</b>
        <small>
          {shortDay(t.date, today)}
          {t.dir !== 'save' && t.note ? ` · ${t.category}` : ''}
        </small>
      </span>
      <span className="i-row__n">
        {sign} {fmt(Math.abs(t.amount))}
      </span>
    </button>
  );
}

function WalletTab({ m, fmt, today }: { m: MoneyState; fmt: (n: number) => string; today: string }) {
  const week = spent(m.txs, weekStart(today), today);
  const run = noSpendRun(m.txs, today);
  const inGoals = m.goals.filter((g) => !g.done).reduce((a, g) => a + goalSaved(g.id, m.txs), 0);
  const due = m.allowance ? allowanceDue(m.allowance, m.txs, today) : null;
  const goals = new Map(m.goals.map((g) => [g.id, g.title]));
  return (
    <>
      {due && !due.got && (
        <div className="lf-nudge mn-due" role="note">
          <span>
            Pocket money day{due.due !== today ? ` (${shortDay(due.due, today)})` : ''}: {fmt(m.allowance!.amount)}
          </span>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => (saveTx({ date: today, dir: 'in', amount: m.allowance!.amount, category: 'Pocket money', note: '', goalId: null }), toast(`${fmt(m.allowance!.amount)} in`))}>
            Got it
          </button>
        </div>
      )}
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'mn-tx', dir: 'out' })}>
          − Spent
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'mn-tx', dir: 'in' })}>
          + Got money
        </button>
      </div>
      <div className="i-meters">
        <Meter value={fmt(week)} label="Spent this week" />
        <Meter value={run} label={run === 1 ? 'Day without spending' : 'Days without spending'} />
        <Meter value={fmt(inGoals)} label="Put aside in goals" />
      </div>
      {m.budget != null && (
        <div className="i-pnl mn-budget">
          <div className="mn-budget__h">
            <b>This week’s budget</b>
            <span className="i-mono">
              {fmt(week)} / {fmt(m.budget)}
            </span>
          </div>
          <span className={`lf-bar${week > m.budget ? ' is-over' : ''}`} style={{ '--p': `${Math.min(100, (week / m.budget) * 100)}%` } as CSSProperties} role="progressbar" aria-label="Weekly budget used" aria-valuenow={Math.round((week / m.budget) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <i />
          </span>
          <small>{week > m.budget ? `${fmt(week - m.budget)} over.` : `${fmt(m.budget - week)} left until Monday.`}</small>
        </div>
      )}
      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'mn-settings' })}>Settings</button>}>Lately</H2>
      <div className="i-pnl i-pnl--flush" aria-label="Money lately">
        {m.txs.slice(0, 30).map((t) => (
          <TxRow key={t.id} t={t} fmt={fmt} today={today} goals={goals} />
        ))}
        {!m.txs.length && <p className="i-note" style={{ padding: 12 }}>Nothing yet. Log the next thing you buy.</p>}
      </div>
    </>
  );
}

function GoalsTab({ m, fmt, today }: { m: MoneyState; fmt: (n: number) => string; today: string }) {
  const open = m.goals.filter((g) => !g.done);
  const done = m.goals.filter((g) => g.done);
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'mn-goal' })}>
          + Saving for something
        </button>
      </div>
      {open.length ? (
        <div className="mn-goals">
          {open.map((g) => {
            const saved = goalSaved(g.id, m.txs);
            const pace = goalPace(g, saved, today);
            const pct = Math.min(100, (saved / g.target) * 100);
            const reached = saved >= g.target;
            return (
              <article key={g.id} className="i-pnl mn-goal" aria-label={g.title}>
                <div className="mn-goal__h">
                  <button type="button" className="i-link" onClick={() => openSheet({ type: 'mn-goal', editId: g.id })}>
                    <b>{g.title}</b>
                  </button>
                  <span className="i-mono">{Math.floor(pct)}%</span>
                </div>
                <span className="lf-bar" style={{ '--p': `${pct}%` } as CSSProperties} role="progressbar" aria-label={`${g.title} saved`} aria-valuenow={Math.floor(pct)} aria-valuemin={0} aria-valuemax={100}>
                  <i />
                </span>
                <small>
                  {fmt(saved)} of {fmt(g.target)}
                  {reached ? ' · there!' : pace.perWeek != null ? ` · ${fmt(pace.perWeek)} a week to get there by ${shortDay(g.by!, today)}` : ` · ${fmt(pace.left)} to go`}
                </small>
                <div className="mn-goal__acts">
                  <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'mn-save', goalId: g.id })}>
                    Put money in
                  </button>
                  {reached && (
                    <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => (saveGoal({ ...g, done: today }, g.id), toast(`${g.title}: done. Enjoy it.`))}>
                      Got it!
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="i-note">What are you saving for? Give it a price and a date, and you’ll see what to put aside each week.</p>
      )}
      {done.length > 0 && (
        <>
          <H2 aside={String(done.length)}>Reached</H2>
          <div className="i-pnl i-pnl--flush">
            {done.map((g) => (
              <div key={g.id} className="i-row">
                <span className="i-row__t">
                  <b>{g.title}</b>
                  <small>
                    {fmt(g.target)} · {shortDay(g.done!, today)}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SpendingTab({ m, fmt, today }: { m: MoneyState; fmt: (n: number) => string; today: string }) {
  const from = monthStart(today);
  const lastFrom = monthStart(addDays(from, -1));
  const lastTo = addDays(from, -1);
  const now = spent(m.txs, from, today);
  const before = spent(m.txs, lastFrom, lastTo);
  const cats = byCategory(m.txs, from, today);
  const top = cats[0]?.amount ?? 1;
  const first = m.txs.at(-1)?.date ?? today;
  const since = first > addDays(today, -83) ? first : addDays(today, -83);
  const wd = useMemo(() => weekdaySpend(m.txs, since, today), [m.txs, since, today]);
  const big = m.txs.filter((t) => t.dir === 'out' && t.date >= from).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <>
      <div className="i-meters">
        <Meter value={fmt(now)} label="Spent this month" />
        <Meter value={fmt(before)} label="Last month" />
        <Meter value={fmt(received(m.txs, from, today))} label="Came in this month" />
      </div>
      <H2 aside="this month">By what</H2>
      {cats.length ? (
        <div className="i-pnl mn-cats" aria-label="Spending by category this month">
          {cats.map((c) => (
            <div key={c.category} className="mn-cat">
              <div className="mn-budget__h">
                <span>{c.category}</span>
                <span className="i-mono">
                  {fmt(c.amount)} · {c.n}×
                </span>
              </div>
              <span className="lf-bar" style={{ '--p': `${(c.amount / top) * 100}%` } as CSSProperties}>
                <i />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing spent this month yet.</p>
      )}
      {big.length > 0 && (
        <>
          <H2>Biggest this month</H2>
          <div className="i-pnl i-pnl--flush">
            {big.map((t) => (
              <TxRow key={t.id} t={t} fmt={fmt} today={today} goals={new Map()} />
            ))}
          </div>
        </>
      )}
      {m.txs.some((t) => t.dir === 'out') && (
        <>
          <H2 aside="per week, on average">Which days</H2>
          <div className="i-pnl">
            <Bars values={wd} labels={days.map((d) => d.slice(0, 1))} long={days} fmt={(v) => fmt(v)} caption="Average spending per weekday" />
          </div>
        </>
      )}
      <Source kind="live">From what you’ve logged. Anything you didn’t log isn’t here.</Source>
    </>
  );
}
