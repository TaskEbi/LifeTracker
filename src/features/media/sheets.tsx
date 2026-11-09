/** The media sheet: add or edit a title. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { DOING, MEDIA_TYPES, NOTE_MAX, STATES, UNIT, type MediaState, type MediaType } from '../../domain/media/model';
import { Picks, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { Field } from '../life/Frame';
import { mediaIn, saveMedia } from './store';

const BY: Record<MediaType, string> = { Film: 'Director', Show: 'Made by', Anime: 'Studio', Manga: 'Author', Album: 'Artist', Song: 'Artist', Game: 'Made by' };

export function Stars({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  return (
    <div className="md-stars" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} type="button" aria-label={`${v} of 5`} aria-pressed={value === v} className={(value ?? 0) >= v ? 'is-on' : ''} onClick={() => onChange(value === v ? null : v)}>
          ★
        </button>
      ))}
    </div>
  );
}

function MediaSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const m = mediaIn(data.get()).find((x) => x.id === spec.editId);
  const [type, setType] = useState<MediaType>(m?.type ?? ((spec.mediaType as MediaType) || 'Anime'));
  const [title, setTitle] = useState(m?.title ?? '');
  const [by, setBy] = useState(m?.by ?? '');
  const [state, setState] = useState<MediaState>(m?.state ?? ((spec.state as MediaState) || 'On it'));
  const [rating, setRating] = useState<number | null>(m?.rating ?? null);
  const [progress, setProgress] = useState(m?.progress != null ? String(m.progress) : '');
  const [total, setTotal] = useState(m?.total != null ? String(m.total) : '');
  const [note, setNote] = useState(m?.note ?? '');
  const [fav, setFav] = useState(m?.fav ?? false);
  const unit = UNIT[type];
  const save = () => {
    const finished = state === 'Done' ? (m?.finished ?? today) : null;
    const started = state === 'Want' ? (m?.started ?? null) : (m?.started ?? today);
    saveMedia({ title, type, by, state, rating, progress: progress.trim() ? Number(progress) || 0 : null, total: total.trim() ? Number(total) || null : null, started, finished, note, fav }, m?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={m ? m.title : 'Add to Media'}
      onClose={closeSheet}
      footer={
        <>
          {m && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(m.id, `${m.title} removed`), closeSheet())}>
              Remove
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Type" value={type} onChange={setType} options={MEDIA_TYPES.map((t) => ({ id: t, label: t }))} />
      <Field label="Title">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      </Field>
      <Field label={`${BY[type]} · optional`}>
        <input className="i-input" value={by} onChange={(e) => setBy(e.target.value)} maxLength={120} />
      </Field>
      <Picks label="Where you are with it" value={state} onChange={setState} options={STATES.map((s) => ({ id: s, label: s === 'On it' ? DOING[type] : s === 'Want' ? (type === 'Game' ? 'Want to play' : type === 'Manga' ? 'Want to read' : type === 'Album' || type === 'Song' ? 'Want to hear' : 'Want to watch') : s }))} />
      {unit && unit !== '%' && state !== 'Want' && (
        <span style={{ display: 'flex', gap: 8 }}>
          <Field label={unit === 'ep' ? 'Episodes seen' : 'Chapters read'}>
            <input className="i-input" inputMode="numeric" value={progress} onChange={(e) => setProgress(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="Out of · optional">
            <input className="i-input" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))} />
          </Field>
        </span>
      )}
      {state !== 'Want' && (
        <div className="i-field">
          <span className="i-lab">What you thought</span>
          <Stars value={rating} onChange={setRating} label="Rating" />
        </div>
      )}
      <Field label="Notes · optional">
        <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} rows={3} placeholder={state === 'Want' ? 'Who recommended it, where to find it' : 'A favourite moment, a line, why it worked'} />
      </Field>
      {state !== 'Want' && <Toggle on={fav} label="An all-time favourite" onChange={setFav} />}
    </Sheet>
  );
}

registerSheet('md-item', MediaSheet);
