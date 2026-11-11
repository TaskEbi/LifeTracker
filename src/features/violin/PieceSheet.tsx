import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { deleteRecord, saveRecord, setArchived } from '../../data/records';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { Picks, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { parseRepertoire, PIECE_STATUSES, pieceOf } from './model';

const YM = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

/** Add or edit a piece or scale: on the stand now, or in the repertoire from before. */
function PieceSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | undefined) ?? null;
  const rec = editId ? data.get().lt_records.get(editId) : undefined;
  const p = rec ? pieceOf(rec) : null;
  const [kind, setKind] = useState<'piece' | 'scale'>(p?.kind ?? ((spec.kind as 'piece' | 'scale') || 'piece'));
  const [title, setTitle] = useState(p?.title ?? '');
  const [composer, setComposer] = useState(p?.composer ?? '');
  const [status, setStatus] = useState(p?.status || (spec.past ? 'Learned' : 'Learning'));
  const [group, setGroup] = useState(p?.group ?? '');
  const [started, setStarted] = useState(p?.started ?? '');
  const [finished, setFinished] = useState(p?.finished ?? '');
  const [level, setLevel] = useState(p?.level ?? '');
  const [note, setNote] = useState(p?.note ?? '');
  const [fav, setFav] = useState(p?.fav ?? false);
  const [past, setPast] = useState(p ? p.archived : spec.past === true);
  const badDate = [started, finished].some((v) => v.trim() && !YM.test(v.trim()));
  const backwards = !badDate && started.trim() && finished.trim() && finished.trim() < started.trim();

  const save = () => {
    if (!title.trim() || badDate || backwards) return;
    // Kind can't change on an existing record (sessions refer to it as a piece or a scale).
    const value: Record<string, unknown> = {
      ...(rec?.data ?? {}),
      title: title.trim().slice(0, 120),
      composer: composer.trim().slice(0, 80),
      status: kind === 'piece' ? status : '',
      group: group.trim().slice(0, 40),
      started: started.trim(),
      finished: finished.trim(),
      level: level.trim().slice(0, 30),
      note: note.trim().slice(0, 600),
      fav,
    };
    for (const k of ['started', 'finished', 'level', 'note']) if (!value[k]) delete value[k];
    if (!fav) delete value.fav;
    const row = rec ? saveRecord('violin', rec.kind, value, rec.id) : saveRecord('violin', kind, value);
    if (past !== !!row.archived_at) setArchived(row.id, past);
    closeSheet();
  };

  return (
    <Sheet
      title={rec ? `Edit ${p!.kind}` : past ? 'Add to the repertoire' : 'Add to the stand'}
      onClose={closeSheet}
      accent="violin"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, `${p!.title} deleted`), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim() || badDate || !!backwards}>
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
          <span style={{ display: 'flex', gap: 8 }}>
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Started · optional</span>
              <input className="i-input" value={started} onChange={(e) => setStarted(e.target.value)} placeholder="2024-09 or 2024" inputMode="numeric" maxLength={7} />
            </label>
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Finished · optional</span>
              <input className="i-input" value={finished} onChange={(e) => setFinished(e.target.value)} placeholder="2025-03 or 2025" inputMode="numeric" maxLength={7} />
            </label>
          </span>
          {badDate && <p className="i-error">Dates as a year (2024) or a year and month (2024-09).</p>}
          {backwards && <p className="i-error">It can’t finish before it started.</p>}
          <span style={{ display: 'flex', gap: 8 }}>
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Level · optional</span>
              <input className="i-input" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Grade 7" maxLength={30} />
            </label>
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Group · optional</span>
              <input className="i-input" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Orchestra, Trio…" maxLength={40} />
            </label>
          </span>
          <label className="i-field">
            <span className="i-lab">Notes · optional</span>
            <textarea className="i-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} placeholder="Who taught it, the tricky bars, what you loved about it" />
          </label>
          <Toggle on={fav} label="A favourite" onChange={setFav} />
        </>
      )}
      <Toggle on={past} label="Past repertoire" hint={past ? 'Finished with: kept in the repertoire list, off the stand' : 'On the stand: sessions can note it'} onChange={setPast} />
    </Sheet>
  );
}

/** Many past pieces at once, one per line. */
function ManySheet() {
  const [text, setText] = useState('');
  const [year, setYear] = useState('');
  const lines = parseRepertoire(text, year.trim());
  const save = () => {
    for (const l of lines) {
      const value: Record<string, unknown> = { title: l.title, composer: l.composer, status: 'Learned', group: '' };
      if (l.year) value.finished = l.year;
      const row = saveRecord('violin', 'piece', value);
      setArchived(row.id, true);
    }
    toast(`${lines.length} ${lines.length === 1 ? 'piece' : 'pieces'} added to the repertoire`);
    closeSheet();
  };
  return (
    <Sheet
      title="Add past pieces"
      onClose={closeSheet}
      accent="violin"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!lines.length || (!!year.trim() && !/^\d{4}$/.test(year.trim()))} onClick={save}>
          Add {lines.length || ''} {lines.length === 1 ? 'piece' : 'pieces'}
        </button>
      }
    >
      <p className="i-note">One piece per line, as “Composer — Title”. A year at the end of a line is when you finished it. You can fill in the rest later.</p>
      <label className="i-field">
        <span className="i-lab">Pieces</span>
        <textarea className="i-textarea" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Vivaldi — Concerto in A minor, I (2021)\nSeitz — Student Concerto No. 2\nBach — Partita No. 2, Gigue 2023'} />
      </label>
      <label className="i-field">
        <span className="i-lab">Year for lines without one · optional</span>
        <input className="i-input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022" maxLength={4} />
      </label>
      {lines.length > 0 && (
        <div className="i-pnl i-pnl--flush" aria-label="Preview">
          {lines.slice(0, 12).map((l, i) => (
            <div key={i} className="i-row">
              <span className="i-row__t">
                <b>{l.title}</b>
                <small>{l.composer || 'No composer'}</small>
              </span>
              <span className="i-row__n">{l.year || '—'}</span>
            </div>
          ))}
          {lines.length > 12 && <p className="i-note">…and {lines.length - 12} more</p>}
        </div>
      )}
    </Sheet>
  );
}

registerSheet('violin-piece', PieceSheet);
registerSheet('violin-pieces', ManySheet);
