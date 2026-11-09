/** Places sheets: a place, a trip and time outside. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { COUNTRIES } from '../../domain/places/countries';
import type { PlaceState } from '../../domain/places/model';
import { Picks, Toggle } from '../../ui/i/bits';
import { DayPick } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { addBucket } from '../bucket/actions';
import { Field } from '../life/Frame';
import { placesOf, saveOuting, savePlace, saveTrip } from './store';

const COUNTRY_NAMES = new Set(COUNTRIES.map((c) => c[1]));

function PlaceSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const p = placesOf(data.get()).places.find((x) => x.id === spec.editId);
  const [name, setName] = useState(p?.name ?? '');
  const [state, setState] = useState<PlaceState>(p?.state ?? ((spec.state as PlaceState) || 'Been'));
  const [country, setCountry] = useState(p?.country ?? '');
  const [spot, setSpot] = useState<{ lat: number; lng: number } | null>(p?.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null);
  const [first, setFirst] = useState(p?.first ?? '');
  const [note, setNote] = useState(p?.note ?? '');
  const [bucket, setBucket] = useState(false);
  const [locating, setLocating] = useState(false);
  const known = !country || COUNTRY_NAMES.has(country);
  const here = () => {
    if (!navigator.geolocation) return toast('This device can’t share where it is');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSpot({ lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast('Couldn’t get your location');
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };
  const save = () => {
    let bucketId = p?.bucketId ?? null;
    if (state === 'Want' && bucket && !bucketId) bucketId = addBucket([`Go to ${name.trim()}`]).added[0]?.id ?? null;
    savePlace({ name, state, country: known ? country : '', lat: spot?.lat ?? null, lng: spot?.lng ?? null, first: state === 'Been' ? first || null : null, note, bucketId }, p?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={p ? p.name : state === 'Want' ? 'Somewhere to go' : 'Somewhere you’ve been'}
      onClose={closeSheet}
      footer={
        <>
          {p && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(p.id, `${p.name} removed`), closeSheet())}>
              Remove
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!name.trim() || !known} onClick={save}>
            Save place
          </button>
        </>
      }
    >
      <Picks
        label="Been or want"
        value={state}
        onChange={setState}
        options={[
          { id: 'Been', label: 'Been there' },
          { id: 'Want', label: 'Want to go' },
        ]}
      />
      <Field label="Place">
        <input className="i-input" data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Kyoto, Gardens by the Bay" />
      </Field>
      <Field label="Country">
        <input className="i-input" list="pl-countries" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} placeholder="Start typing" />
      </Field>
      <datalist id="pl-countries">
        {COUNTRIES.map((c) => (
          <option key={c[1]} value={c[1]} />
        ))}
      </datalist>
      {!known && <p className="i-note">Pick a country from the list so it shows on the map.</p>}
      <div className="pl-here">
        <button type="button" className="i-btn" onClick={here} disabled={locating}>
          {locating ? 'Finding you…' : spot ? 'Use where I am now (again)' : 'I’m here now: use my location'}
        </button>
        {spot && (
          <small className="i-mono">
            {spot.lat}, {spot.lng}{' '}
            <button type="button" className="i-link" onClick={() => setSpot(null)}>
              clear
            </button>
          </small>
        )}
      </div>
      {state === 'Been' && (
        <Field label="First time there · optional">
          <input className="i-input" type="date" value={first} max={today} onChange={(e) => setFirst(e.target.value)} />
        </Field>
      )}
      <Field label="Notes · optional">
        <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder={state === 'Want' ? 'Why, when, with whom' : 'What you remember'} />
      </Field>
      {state === 'Want' && !p?.bucketId && <Toggle on={bucket} label="Put it on the bucket list too" onChange={setBucket} />}
    </Sheet>
  );
}

function TripSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = placesOf(data.get());
  const t = st.trips.find((x) => x.id === spec.editId);
  const [title, setTitle] = useState(t?.title ?? '');
  const [from, setFrom] = useState(t?.from ?? today);
  const [to, setTo] = useState(t?.to ?? today);
  const [ids, setIds] = useState<string[]>(t?.placeIds ?? []);
  const [note, setNote] = useState(t?.note ?? '');
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const been = st.places.filter((p) => p.state === 'Been');
  return (
    <Sheet
      title={t ? t.title : 'A trip'}
      onClose={closeSheet}
      footer={
        <>
          {t && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(t.id, 'Trip deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim() || !from || to < from} onClick={() => (saveTrip({ title, from, to: to || from, placeIds: ids, note }, t?.id), closeSheet())}>
            Save trip
          </button>
        </>
      }
    >
      <Field label="Trip">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Japan with the family" />
      </Field>
      <span style={{ display: 'flex', gap: 8 }}>
        <Field label="From">
          <input className="i-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input className="i-input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </span>
      {been.length > 0 && (
        <div className="i-field">
          <span className="i-lab">Places on the trip</span>
          <div className="lf-pills" role="group" aria-label="Places on the trip">
            {been.map((p) => (
              <button key={p.id} type="button" className="lf-pill" aria-pressed={ids.includes(p.id)} onClick={() => toggle(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label="Notes · optional">
        <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={4} placeholder="Best food, best moment, what went wrong" />
      </Field>
      <p className="i-note">Photos you add to the Album on these dates show up with the trip.</p>
    </Sheet>
  );
}

const OUT_LENGTHS = ['15', '30', '45', '60', '90', '120', '180'];
const OUT_WHAT = ['Walk', 'Run', 'Park', 'Beach', 'Sport', 'Hike', 'Cycling', 'Just outside'];

function OutingSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const o = placesOf(data.get()).outings.find((x) => x.id === spec.editId);
  const [date, setDate] = useState(o?.date ?? today);
  const [minutes, setMinutes] = useState(String(o?.minutes ?? spec.minutes ?? 30));
  const [what, setWhat] = useState(o?.what ?? 'Walk');
  return (
    <Sheet
      title="Time outside"
      onClose={closeSheet}
      footer={
        <>
          {o && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(o.id, 'Deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => (saveOuting({ date, minutes: Number(minutes), what }, o?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <div className="i-field">
        <span className="i-lab">How long</span>
        <Picks label="How long" value={minutes} onChange={setMinutes} options={OUT_LENGTHS.map((m) => ({ id: m, label: Number(m) >= 60 ? `${Number(m) / 60} h` : `${m} min` }))} />
      </div>
      <div className="i-field">
        <span className="i-lab">Doing what</span>
        <div className="lf-pills" role="group" aria-label="Doing what">
          {OUT_WHAT.map((w) => (
            <button key={w} type="button" className="lf-pill" aria-pressed={what === w} onClick={() => setWhat(w)}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <DayPick value={date} onChange={setDate} today={today} />
    </Sheet>
  );
}

registerSheet('pl-place', PlaceSheet);
registerSheet('pl-trip', TripSheet);
registerSheet('pl-out', OutingSheet);
