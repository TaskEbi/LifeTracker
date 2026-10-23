import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { deleteRecord, saveRecord, setArchived } from '../../data/records';
import { data } from '../../data/store';
import { Picks } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { PIECE_STATUSES, pieceOf } from './model';

/** Add or edit a piece or scale on the stand. */
function PieceSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | undefined) ?? null;
  const rec = editId ? data.get().lt_records.get(editId) : undefined;
  const p = rec ? pieceOf(rec) : null;
  const [kind, setKind] = useState<'piece' | 'scale'>(p?.kind ?? ((spec.kind as 'piece' | 'scale') || 'piece'));
  const [title, setTitle] = useState(p?.title ?? '');
  const [composer, setComposer] = useState(p?.composer ?? '');
  const [status, setStatus] = useState(p?.status || 'Learning');
  const [group, setGroup] = useState(p?.group ?? '');

  const save = () => {
    if (!title.trim()) return;
    // Kind can't change on an existing record (sessions refer to it as a piece or a scale).
    const value = { title: title.trim().slice(0, 120), composer: composer.trim().slice(0, 80), status: kind === 'piece' ? status : '', group: group.trim().slice(0, 40) };
    if (rec) saveRecord('violin', rec.kind, value, rec.id);
    else saveRecord('violin', kind, value);
    closeSheet();
  };

  return (
    <Sheet
      title={rec ? `Edit ${p!.kind}` : 'Add to the stand'}
      onClose={closeSheet}
      accent="violin"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, `${p!.title} deleted`), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>
            Save
          </button>
        </>
      }
    >
      {!rec && <Picks label="Kind" value={kind} onChange={setKind} options={[{ id: 'piece', label: 'Piece' }, { id: 'scale', label: 'Scale or exercise' }]} />}
      <label className="i-field">
        <span className="i-lab">{kind === 'piece' ? 'Title' : 'Name'}</span>
        <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'piece' ? 'Violin Concerto No. 1, I' : 'G melodic minor, 3 octaves'} maxLength={120} />
      </label>
      {kind === 'piece' && (
        <>
          <label className="i-field">
            <span className="i-lab">Composer</span>
            <input className="i-input" value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Bruch" maxLength={80} />
          </label>
          <div className="i-field">
            <span className="i-lab">Status</span>
            <Picks label="Status" value={status} onChange={setStatus} options={PIECE_STATUSES.map((s) => ({ id: s, label: s }))} />
          </div>
          <label className="i-field">
            <span className="i-lab">Group · optional</span>
            <input className="i-input" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Orchestra, Trio…" maxLength={40} />
          </label>
        </>
      )}
      {rec && (
        <button type="button" className="i-btn i-btn--sm" onClick={() => (setArchived(rec.id, !p!.archived), closeSheet())}>
          {p!.archived ? 'Back on the stand' : 'Move to past repertoire'}
        </button>
      )}
    </Sheet>
  );
}

registerSheet('violin-piece', PieceSheet);
