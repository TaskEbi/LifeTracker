import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { dayOf } from '../../data/lt';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { Sheet } from '../../ui/i/Sheet';
import { BUCKET_TITLE_MAX, crossOff, removeBucket, uncross, updateBucket } from './actions';

/** Edit one thing on the bucket list: what it is, a note, cross it off or put it back. */
function BucketSheet({ spec }: { spec: SheetSpec }) {
  const prev = data.get().lt_bucket.get(spec.editId as string);
  const [title, setTitle] = useState(prev?.title ?? '');
  const [note, setNote] = useState(prev?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  if (!prev || prev.deleted_at) {
    return (
      <Sheet title="Bucket list" onClose={closeSheet}>
        <p className="i-note">That one has gone.</p>
      </Sheet>
    );
  }

  const save = () => {
    const err = updateBucket(prev.id, { title, note });
    if (err) return setError(err);
    closeSheet();
  };

  return (
    <Sheet
      title={prev.done_at ? 'Crossed off' : 'On the list'}
      onClose={closeSheet}
      footer={
        <>
          <button type="button" className="i-btn i-btn--danger" onClick={() => (removeBucket(prev.id), closeSheet())}>
            Delete
          </button>
          {prev.done_at ? (
            <button type="button" className="i-btn" onClick={() => (uncross(prev.id), closeSheet())}>
              Not done yet
            </button>
          ) : (
            <button
              type="button"
              className="i-btn"
              onClick={() => {
                if (updateBucket(prev.id, { title, note })) return;
                closeSheet();
                crossOff(prev.id);
              }}
            >
              Cross off
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>
            Save
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">What</span>
        <input className="i-input" data-autofocus value={title} maxLength={BUCKET_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), save())} />
      </label>
      <label className="i-field">
        <span className="i-lab">{prev.done_at ? 'How it went · optional' : 'Note · optional'}</span>
        <textarea className="i-input" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={prev.done_at ? 'Where, who with, what it was like…' : 'Where, when, who with…'} />
      </label>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      <p className="i-note">
        {prev.done_at ? `Crossed off ${shortDay(dayOf(prev.done_at))}. ` : ''}Added {shortDay(dayOf(prev.created_at))}.
      </p>
    </Sheet>
  );
}

registerSheet('bucket', BucketSheet);
