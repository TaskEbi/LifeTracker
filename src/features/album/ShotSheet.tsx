import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { data } from '../../data/store';
import { CAPTION_MAX, stamp } from '../../domain/album/album';
import { longDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { Sheet } from '../../ui/i/Sheet';
import { Photo } from './Photo';
import { albumOf, removeShot, setCaption, starShot } from './store';

/** One photo: a few words under it, the day's cover, or out of the album. */
function ShotSheet({ spec }: { spec: SheetSpec }) {
  const shot = useStore(data, (s) => albumOf(s).shots.find((x) => x.id === spec.id));
  const [caption, setText] = useState(shot?.caption ?? '');
  if (!shot) {
    return (
      <Sheet title="Photo" onClose={closeSheet}>
        <p className="i-note">That photo has gone.</p>
      </Sheet>
    );
  }
  const face = shot.role === 'face';
  const kind = face ? 'Face' : shot.video ? 'Video' : 'Memory';
  const save = () => {
    if (caption.trim() !== shot.caption) setCaption(shot.id, caption);
    closeSheet();
  };
  return (
    <Sheet
      title={face ? 'Face of the day' : spec.fresh ? `New ${kind.toLowerCase()}` : kind}
      onClose={save}
      footer={
        <>
          <button
            type="button"
            className="i-btn i-btn--danger"
            onClick={() => {
              removeShot(shot.id, `${kind} removed`);
              closeSheet();
            }}
          >
            Delete
          </button>
          <button type="button" className="i-btn i-btn--sig" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <figure className={`al-shot${shot.video ? ' al-shot--video' : ''}`}>
        <Photo shot={shot} play alt={caption || kind} />
        <span className="al-stamp">{stamp(shot.date)}</span>
      </figure>
      <p className="i-note">{longDay(shot.date)}</p>
      <label className="i-field">
        <span className="i-lab">{face ? 'How you were (optional)' : 'What it was (optional)'}</span>
        <textarea className="i-textarea" rows={2} maxLength={CAPTION_MAX} value={caption} onChange={(e) => setText(e.target.value)} placeholder={face ? 'Tired, but the run was good' : 'Sunset from the bridge'} data-autofocus={spec.fresh ? '' : undefined} />
        <small className="i-note">
          {caption.length}/{CAPTION_MAX}
        </small>
      </label>
      {!face && (
        <button type="button" className="i-btn" aria-pressed={shot.star} onClick={() => starShot(shot.id)}>
          {shot.star ? '★ The day’s cover' : '☆ Make it the day’s cover'}
        </button>
      )}
    </Sheet>
  );
}

registerSheet('album-shot', ShotSheet);
