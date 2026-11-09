/** Money sheets: a movement, a goal, putting money into a goal, and the settings. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { CATEGORIES, fmtMoney, goalSaved, INCOME, wallet, type TxDir } from '../../domain/money/model';
import { Picks } from '../../ui/i/bits';
import { DayPick } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { Field } from '../life/Frame';
import { moneyOf, parseAmount, saveGoal, saveMoneySettings, saveTx } from './store';

function TxSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const m = moneyOf(data.get());
  const t = m.txs.find((x) => x.id === spec.editId);
  const [dir, setDir] = useState<'in' | 'out'>(t?.dir === 'in' ? 'in' : ((spec.dir as 'in' | 'out') ?? 'out'));
  const [amount, setAmount] = useState(t ? String(t.amount) : ((spec.amount as string) ?? ''));
  const [category, setCategory] = useState(t?.category ?? ((spec.category as string) ?? (dir === 'out' ? 'Snacks' : 'Pocket money')));
  const [note, setNote] = useState(t?.note ?? '');
  const [date, setDate] = useState(t?.date ?? today);
  const n = parseAmount(amount);
  const cats: readonly string[] = dir === 'out' ? CATEGORIES : INCOME;
  const flip = (d: 'in' | 'out') => {
    setDir(d);
    setCategory(d === 'out' ? 'Snacks' : 'Pocket money');
  };
  return (
    <Sheet
      title={t ? 'Edit' : dir === 'out' ? 'Spent' : 'Got money'}
      onClose={closeSheet}
      footer={
        <>
          {t && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(t.id, 'Deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={n == null} onClick={() => (saveTx({ date, dir: dir as TxDir, amount: n!, category, note, goalId: null }, t?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      {t?.dir !== 'save' && (
        <Picks
          label="In or out"
          value={dir}
          onChange={flip}
          options={[
            { id: 'out', label: 'Spent' },
            { id: 'in', label: 'Got money' },
          ]}
        />
      )}
      <Field label={`Amount (${m.symbol})`}>
        <input className="i-input mn-amount" data-autofocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={12} placeholder="0.00" />
      </Field>
      <div className="i-field">
        <span className="i-lab">{dir === 'out' ? 'On what' : 'From'}</span>
        <div className="lf-pills" role="group" aria-label={dir === 'out' ? 'On what' : 'From'}>
          {cats.map((c) => (
            <button key={c} type="button" className="lf-pill" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <Field label="Note · optional">
        <input className="i-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={dir === 'out' ? 'e.g. Bubble tea' : ''} />
      </Field>
      <DayPick value={date} onChange={setDate} today={today} />
    </Sheet>
  );
}

function GoalSheet({ spec }: { spec: SheetSpec }) {
  const m = moneyOf(data.get());
  const g = m.goals.find((x) => x.id === spec.editId);
  const [title, setTitle] = useState(g?.title ?? '');
  const [target, setTarget] = useState(g ? String(g.target) : '');
  const [by, setBy] = useState(g?.by ?? '');
  const n = parseAmount(target);
  return (
    <Sheet
      title={g ? 'Edit goal' : 'Saving for something'}
      onClose={closeSheet}
      footer={
        <>
          {g && (
            <button
              type="button"
              className="i-btn i-btn--danger"
              onClick={() => {
                const saved = goalSaved(g.id, m.txs);
                // what's in it goes back to the wallet
                if (saved > 0) saveTx({ date: ltToday(), dir: 'save', amount: -saved, category: 'Saving', note: `${g.title} closed`, goalId: g.id });
                deleteRecord(g.id, 'Goal deleted');
                closeSheet();
              }}
            >
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim() || n == null} onClick={() => (saveGoal({ title, target: n!, by: by || null, done: g?.done ?? null }, g?.id), closeSheet())}>
            Save goal
          </button>
        </>
      }
    >
      <Field label="What for">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. New headphones" />
      </Field>
      <Field label={`How much (${m.symbol})`}>
        <input className="i-input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} maxLength={12} />
      </Field>
      <Field label="Want it by · optional">
        <input className="i-input" type="date" value={by} min={ltToday()} onChange={(e) => setBy(e.target.value)} />
      </Field>
    </Sheet>
  );
}

function SaveSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const m = moneyOf(data.get());
  const g = m.goals.find((x) => x.id === spec.goalId);
  const [way, setWay] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  if (!g) return null;
  const saved = goalSaved(g.id, m.txs);
  const inWallet = wallet(m.txs);
  const n = parseAmount(amount);
  const tooMuch = n != null && (way === 'in' ? n > inWallet : n > saved);
  return (
    <Sheet
      title={g.title}
      onClose={closeSheet}
      footer={
        <button
          type="button"
          className="i-btn i-btn--sig i-btn--block"
          disabled={n == null || tooMuch}
          onClick={() => {
            saveTx({ date: today, dir: 'save', amount: way === 'in' ? n! : -n!, category: 'Saving', note: '', goalId: g.id }, undefined);
            const after = saved + (way === 'in' ? n! : -n!);
            if (way === 'in' && after >= g.target && saved < g.target) toast(`${g.title}: target reached!`);
            closeSheet();
          }}
        >
          {way === 'in' ? 'Put it in' : 'Take it out'}
        </button>
      }
    >
      <p className="i-note">
        {fmtMoney(saved, m.symbol)} of {fmtMoney(g.target, m.symbol)} saved · {fmtMoney(inWallet, m.symbol)} in your wallet
      </p>
      <Picks
        label="Put in or take out"
        value={way}
        onChange={setWay}
        options={[
          { id: 'in', label: 'Put in' },
          { id: 'out', label: 'Take out' },
        ]}
      />
      <Field label={`Amount (${m.symbol})`}>
        <input className="i-input mn-amount" data-autofocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={12} />
      </Field>
      {tooMuch && <p className="i-note">{way === 'in' ? 'That’s more than is in your wallet.' : 'That’s more than is in this goal.'}</p>}
    </Sheet>
  );
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SettingsSheet() {
  const m = moneyOf(data.get());
  const [symbol, setSymbol] = useState(m.symbol);
  const [amount, setAmount] = useState(m.allowance ? String(m.allowance.amount) : '');
  const [every, setEvery] = useState<'week' | 'month'>(m.allowance?.every ?? 'week');
  const [on, setOn] = useState(String(m.allowance?.on ?? 0));
  const [budget, setBudget] = useState(m.budget ? String(m.budget) : '');
  const [start, setStart] = useState('');
  const hasStart = m.txs.some((t) => t.category === 'Starting balance');
  const a = parseAmount(amount);
  const save = () => {
    const onN = Number(on);
    saveMoneySettings({ symbol, allowance: a ? { amount: a, every, on: every === 'week' ? Math.min(6, onN) : Math.min(28, Math.max(1, onN || 1)) } : null, budget: parseAmount(budget) });
    const s = parseAmount(start);
    if (s) saveTx({ date: ltToday(), dir: 'in', amount: s, category: 'Starting balance', note: '', goalId: null });
    closeSheet();
  };
  return (
    <Sheet
      title="Money settings"
      onClose={closeSheet}
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
          Save
        </button>
      }
    >
      {!hasStart && (
        <Field label="What’s in your wallet now · optional">
          <input className="i-input" data-autofocus inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} maxLength={12} />
        </Field>
      )}
      <Field label="Pocket money · optional">
        <input className="i-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={12} />
      </Field>
      {a && (
        <>
          <Picks
            label="How often"
            value={every}
            onChange={(v) => (setEvery(v), setOn(v === 'week' ? '0' : '1'))}
            options={[
              { id: 'week', label: 'Every week' },
              { id: 'month', label: 'Every month' },
            ]}
          />
          {every === 'week' ? (
            <Picks label="On" value={on} onChange={setOn} options={WEEKDAYS.map((d, i) => ({ id: String(i), label: d }))} />
          ) : (
            <Field label="Day of the month">
              <input className="i-input" inputMode="numeric" value={on} onChange={(e) => setOn(e.target.value.replace(/\D/g, '').slice(0, 2))} />
            </Field>
          )}
        </>
      )}
      <Field label="Weekly spending budget · optional">
        <input className="i-input" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} maxLength={12} />
      </Field>
      <Field label="Currency symbol">
        <input className="i-input" value={symbol} onChange={(e) => setSymbol(e.target.value)} maxLength={4} style={{ width: 90 }} />
      </Field>
    </Sheet>
  );
}

registerSheet('mn-tx', TxSheet);
registerSheet('mn-goal', GoalSheet);
registerSheet('mn-save', SaveSheet);
registerSheet('mn-settings', SettingsSheet);
