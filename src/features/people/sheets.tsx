/** People sheets: a person, time together and a gift. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { GIFT_STATES, NOTES_MAX, RELATIONS, type GiftState, type Relation } from '../../domain/people/model';
import { Picks, Toggle } from '../../ui/i/bits';
import { DayPick } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { Field } from '../life/Frame';
import { lastSeen } from '../../domain/people/model';
import { peopleOf, saveGift, savePerson, saveTogether } from './store';

function PersonSheet({ spec }: { spec: SheetSpec }) {
  const st = peopleOf(data.get());
  const p = st.people.find((x) => x.id === spec.editId);
  const [name, setName] = useState(p?.name ?? '');
  const [relation, setRelation] = useState<Relation>(p?.relation ?? 'Friend');
  const [birthday, setBirthday] = useState(p?.birthday ? (p.birthday.startsWith('--') ? `2000${p.birthday.slice(1)}` : p.birthday) : '');
  const [noYear, setNoYear] = useState(!!p?.birthday?.startsWith('--'));
  const [close, setClose] = useState(p?.close ?? false);
  const [notes, setNotes] = useState(p?.notes ?? '');
  const seen = p ? lastSeen(st.times).get(p.id) : undefined;
  const ideas = p ? st.gifts.filter((g) => g.personId === p.id && g.state !== 'Given') : [];
  const save = () => {
    savePerson({ name, relation, birthday: birthday ? (noYear ? `--${birthday.slice(5)}` : birthday) : null, notes, close }, p?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={p ? p.name : 'Add a person'}
      onClose={closeSheet}
      footer={
        <>
          {p && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(p.id, `${p.name} removed`), closeSheet())}>
              Remove
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!name.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      {p && (
        <p className="i-note">
          {seen ? `Last together ${shortDay(seen, ltToday())}.` : 'No time together logged yet.'}
          {ideas.length ? ` Gift ideas: ${ideas.map((g) => g.title).join(', ')}.` : ''}
        </p>
      )}
      <Field label="Name">
        <input className="i-input" data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </Field>
      <Picks label="Who they are" value={relation} onChange={setRelation} options={RELATIONS.map((r) => ({ id: r, label: r }))} />
      <Field label="Birthday · optional">
        <input className="i-input" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      </Field>
      {birthday && <Toggle on={noYear} label="I don’t know the year" onChange={setNoYear} />}
      <Toggle on={close} label="Someone close" hint="You’ll get a nudge when it’s been three weeks" onChange={setClose} />
      <Field label="Notes: what they like, sizes, things to remember">
        <textarea className="i-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={NOTES_MAX} rows={4} />
      </Field>
    </Sheet>
  );
}

const LENGTHS = [
  { id: '0', label: 'Not sure' },
  { id: '30', label: '30 min' },
  { id: '60', label: '1 h' },
  { id: '120', label: '2 h' },
  { id: '240', label: '4 h' },
  { id: '480', label: 'All day' },
] as const;

function TimeSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = peopleOf(data.get());
  const t = st.times.find((x) => x.id === spec.editId);
  const [date, setDate] = useState(t?.date ?? today);
  const [ids, setIds] = useState<string[]>(t?.personIds ?? (spec.personId ? [spec.personId as string] : []));
  const [what, setWhat] = useState(t?.what ?? '');
  const [len, setLen] = useState<string>(String(t?.minutes ?? 0));
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  return (
    <Sheet
      title={t ? 'Edit time together' : 'Time together'}
      onClose={closeSheet}
      footer={
        <>
          {t && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(t.id, 'Deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ids.length} onClick={() => (saveTogether({ date, personIds: ids, what, minutes: Number(len) || null }, t?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <div className="i-field">
        <span className="i-lab">Who with</span>
        <div className="lf-pills" role="group" aria-label="Who with">
          {st.people.map((p) => (
            <button key={p.id} type="button" className="lf-pill" aria-pressed={ids.includes(p.id)} onClick={() => toggle(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <Field label="What did you do? · optional">
        <input className="i-input" value={what} onChange={(e) => setWhat(e.target.value)} maxLength={200} placeholder="e.g. Bubble tea after school" />
      </Field>
      <div className="i-field">
        <span className="i-lab">How long</span>
        <Picks label="How long" value={len} onChange={setLen} options={LENGTHS.map((l) => ({ id: l.id, label: l.label }))} />
      </div>
      <DayPick value={date} onChange={setDate} today={today} />
    </Sheet>
  );
}

const OCCASIONS = ['Birthday', 'Christmas', 'Thank you', 'Just because'];

function GiftSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = peopleOf(data.get());
  const g = st.gifts.find((x) => x.id === spec.editId);
  const [personId, setPersonId] = useState<string>(g?.personId ?? (spec.personId as string) ?? '');
  const [title, setTitle] = useState(g?.title ?? '');
  const [occasion, setOccasion] = useState(g?.occasion ?? 'Birthday');
  const [state, setState] = useState<GiftState>(g?.state ?? 'Idea');
  const [price, setPrice] = useState(g?.price != null ? String(g.price) : '');
  const n = Number(price.replace(/[^\d.]/g, ''));
  return (
    <Sheet
      title={g ? 'Edit gift' : 'Gift idea'}
      onClose={closeSheet}
      footer={
        <>
          {g && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(g.id, 'Gift deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button
            type="button"
            className="i-btn i-btn--sig i-btn--block"
            disabled={!title.trim() || !personId}
            onClick={() => (saveGift({ personId, title, occasion, state, price: price.trim() && Number.isFinite(n) ? n : null, date: state === 'Given' ? (g?.date ?? today) : null }, g?.id), closeSheet())}
          >
            Save gift
          </button>
        </>
      }
    >
      <div className="i-field">
        <span className="i-lab">For</span>
        <div className="lf-pills" role="group" aria-label="For">
          {st.people.map((p) => (
            <button key={p.id} type="button" className="lf-pill" aria-pressed={personId === p.id} onClick={() => setPersonId(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <Field label="The gift">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </Field>
      <div className="i-field">
        <span className="i-lab">Occasion</span>
        <Picks label="Occasion" value={OCCASIONS.includes(occasion) ? occasion : null} onChange={setOccasion} options={OCCASIONS.map((o) => ({ id: o, label: o }))} />
      </div>
      <Picks label="Where it’s up to" value={state} onChange={setState} options={GIFT_STATES.map((s) => ({ id: s, label: s }))} />
      <Field label="Price · optional">
        <input className="i-input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} maxLength={10} />
      </Field>
    </Sheet>
  );
}

registerSheet('pp-person', PersonSheet);
registerSheet('pp-time', TimeSheet);
registerSheet('pp-gift', GiftSheet);
