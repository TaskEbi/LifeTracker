import { useState, type CSSProperties } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { dayOf, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { BUCKET_SECTIONS, guessSection, isBucketSection, nextStep, targetYear, type BucketSectionId } from '../../domain/bucket/sections';
import { shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { Sheet } from '../../ui/i/Sheet';
import { BUCKET_TITLE_MAX, crossOff, removeBucket, stepToTask, uncross, updateBucket, type BucketPatch } from './actions';

/** Edit one thing on the bucket list: what it is, its section and year, the next step, cross it off or put it back. */
function BucketSheet({ spec }: { spec: SheetSpec }) {
  const prev = data.get().lt_bucket.get(spec.editId as string);
  const year = Number(useToday().slice(0, 4));
  const [title, setTitle] = useState(prev?.title ?? '');
  const [note, setNote] = useState(prev?.note ?? '');
  const [cat, setCat] = useState<BucketSectionId | null>(isBucketSection(prev?.data.cat) ? prev.data.cat : null);
  const [by, setBy] = useState<number | null>(prev ? targetYear(prev) : null);
  const [step, setStep] = useState(prev ? (nextStep(prev) ?? '') : '');
  const [error, setError] = useState<string | null>(null);
  const taskId = useStore(data, (s) => (spec.editId ? s.lt_bucket.get(spec.editId as string)?.data.task : undefined)) as string | undefined;
  const task = useStore(data, (s) => (taskId ? s.todos.get(taskId) : undefined));
  if (!prev || prev.deleted_at) {
    return (
      <Sheet title="Bucket list" onClose={closeSheet}>
        <p className="i-note">That one has gone.</p>
      </Sheet>
    );
  }

  const guess = guessSection(title || prev.title, note);
  const shownCat = cat ?? guess;
  const patch = (): BucketPatch => ({ title, note, cat, by, step });
  const save = () => {
    const err = updateBucket(prev.id, patch());
    if (err) return setError(err);
    closeSheet();
  };
  const toTask = () => {
    const err = updateBucket(prev.id, patch()) ?? stepToTask(prev.id);
    if (err) setError(err);
  };
  const years = [year, year + 1, year + 2, year + 4, year + 9];
  if (by !== null && !years.includes(by)) years.unshift(by);

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
                if (updateBucket(prev.id, patch())) return;
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

      <div className="i-field">
        <span className="i-lab" id="bk-sec-lab">
          Section{cat ? '' : ' · guessed from the words'}
        </span>
        <div className="i-chips i-chips--wrap bk-sheet__secs" role="group" aria-labelledby="bk-sec-lab">
          {BUCKET_SECTIONS.map((s) => (
            <button key={s.id} type="button" className="i-chip" aria-pressed={shownCat === s.id} onClick={() => setCat(s.id === guess ? null : s.id)} style={{ '--c': s.color } as CSSProperties}>
              <span aria-hidden="true">{s.kanji}</span> {s.short}
            </button>
          ))}
        </div>
      </div>

      {!prev.done_at && (
        <>
          <div className="i-field">
            <span className="i-lab" id="bk-by-lab">
              When
            </span>
            <div className="i-chips i-chips--wrap" role="group" aria-labelledby="bk-by-lab">
              <button type="button" className="i-chip" aria-pressed={by === null} onClick={() => setBy(null)}>
                Someday
              </button>
              {years.map((y) => (
                <button key={y} type="button" className="i-chip" aria-pressed={by === y} onClick={() => setBy(y)}>
                  {y === year ? `This year` : y}
                </button>
              ))}
            </div>
          </div>
          <label className="i-field">
            <span className="i-lab">Smallest next step · optional</span>
            <input className="i-input" value={step} maxLength={BUCKET_TITLE_MAX} onChange={(e) => setStep(e.target.value)} placeholder="Look up flights, find a teacher, sign up…" />
          </label>
          {step.trim() &&
            (task && !task.deleted_at ? (
              <p className="i-note bk-sheet__task">{task.done_at ? '✓ That step is done in your tasks.' : `In your tasks: “${task.title}”.`}</p>
            ) : (
              <button type="button" className="i-btn bk-sheet__task" onClick={toTask}>
                Make the step a task
              </button>
            ))}
        </>
      )}

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
