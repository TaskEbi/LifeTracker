/** 金庫: letters sealed until their day, with who you were then beside who you are now. And on this day. */
import { useEffect, useMemo, useState } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { progressInput, useAchievements, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import type { SectionId } from '../../../data/types';
import { canOpen, capsulePresets, compareSnapshots, daysUntil, onThisDay, type Capsule } from '../../../domain/hq/capsule';
import { dayCount, longDay, shortDay } from '../../../domain/log/dates';
import { sectionInfo, SECTIONS } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { H2, Source } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { CAPSULE_LETTER_MAX, CAPSULE_REPLY_MAX, deadlinesOf, markCapsuleOpened, replyToCapsule, sealCapsule, takeSnapshot, useHq } from '../store';

const PROMPTS = ['What are you worried about right now?', 'What do you hope has changed?', 'What would surprise you to hear?', 'What should you not forget?'];

function SealSheet() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const emblems = useAchievements().filter((a) => a.unlockedOn).length;
  const known = useMemo(() => deadlinesOf(st, today, 900).filter((d) => d.section === 'coding' || d.section === 'sports' || d.section === 'future').slice(0, 5).map((d) => ({ label: d.title, date: d.date })), [st, today]);
  const presets = useMemo(() => capsulePresets(today, known), [today, known]);
  const [title, setTitle] = useState('');
  const [letter, setLetter] = useState('');
  const [opensOn, setOpensOn] = useState(presets[2]?.date ?? presets[0].date);
  const ok = letter.trim().length > 0 && opensOn > today;
  return (
    <Sheet
      title="Seal a time capsule"
      onClose={closeSheet}
      footer={
        <button
          type="button"
          className="i-btn i-btn--sig i-btn--block"
          disabled={!ok}
          onClick={() => {
            sealCapsule({ title, letter, opensOn, snapshot: takeSnapshot(st, today, emblems) }, today);
            closeSheet();
          }}
        >
          Seal until {opensOn > today ? shortDay(opensOn, today) : '…'}
        </button>
      }
    >
      <p className="i-note">Write to the you of that day. Once sealed, the app won’t show it until then. Today’s numbers go in with it.</p>
      <label className="i-field">
        <span className="i-lab">On the envelope (shown while it’s sealed)</span>
        <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="To me, on race morning" maxLength={80} />
      </label>
      <label className="i-field">
        <span className="i-lab">The letter</span>
        <textarea data-autofocus className="i-textarea hq-letter" value={letter} onChange={(e) => setLetter(e.target.value)} placeholder={PROMPTS[new Date().getDate() % PROMPTS.length]} maxLength={CAPSULE_LETTER_MAX} />
      </label>
      <div className="i-field">
        <span className="i-lab">Open on</span>
        <div className="i-chips i-chips--wrap" role="group" aria-label="When to open">
          {presets.map((p) => (
            <button key={p.label + p.date} type="button" className="i-chip" aria-pressed={opensOn === p.date} onClick={() => setOpensOn(p.date)}>
              {p.label}
            </button>
          ))}
        </div>
        <input className="i-input" type="date" min={today} value={opensOn} onChange={(e) => e.target.value && setOpensOn(e.target.value)} aria-label="Another day to open it" />
      </div>
    </Sheet>
  );
}
registerSheet('hq-capsule', SealSheet);

/** The door swings open, then the letter and the two yous side by side. */
function OpenedSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const emblems = useAchievements().filter((a) => a.unlockedOn).length;
  const c = hq.capsules.find((x) => x.id === spec.id);
  const [reply, setReply] = useState(c?.reply ?? '');
  const firstTime = !c?.openedOn;
  useEffect(() => {
    if (c && !c.openedOn && canOpen(c, today)) markCapsuleOpened(c.id, today);
  }, [c?.id]);
  // Only ever shown on or after its day, whatever opened this sheet.
  if (!c || !canOpen(c, today)) {
    return (
      <Sheet title="Time capsule" onClose={closeSheet}>
        <p className="i-note">Not yet.</p>
      </Sheet>
    );
  }
  const now = takeSnapshot(st, today, emblems);
  const rows = c.snapshot ? compareSnapshots(c.snapshot, now) : [];
  const ago = dayCount(c.sealedOn, today) - 1;
  return (
    <Sheet
      title={c.title || `From ${shortDay(c.sealedOn, today)}`}
      onClose={closeSheet}
      footer={
        <>
          <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(c.id, 'Capsule deleted'), closeSheet())}>
            Delete
          </button>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => (replyToCapsule(c.id, reply), closeSheet())}>
            Keep it
          </button>
        </>
      }
    >
      {firstTime && <div className="hq-opendoor" aria-hidden="true" />}
      <p className="i-note">Sealed {longDay(c.sealedOn)}, {ago} days ago.</p>
      <blockquote className="hq-letterview">{c.letter}</blockquote>
      {rows.length > 0 && (
        <div className="i-field">
          <span className="i-lab">Then and now</span>
          <table className="hq-then">
            <thead>
              <tr>
                <th scope="col">&nbsp;</th>
                <th scope="col">Then</th>
                <th scope="col">Now</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.then}</td>
                  <td className={r.delta > 0 ? 'is-up' : ''}>{r.now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <label className="i-field">
        <span className="i-lab">Write back</span>
        <textarea className="i-textarea" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="What would you tell them?" maxLength={CAPSULE_REPLY_MAX} />
      </label>
    </Sheet>
  );
}
registerSheet('hq-capsule-open', OpenedSheet);

function CapsuleRow({ c, today }: { c: Capsule; today: string }) {
  const ready = canOpen(c, today);
  const left = daysUntil(c, today);
  const total = Math.max(1, dayCount(c.sealedOn, c.opensOn) - 1);
  return (
    <button
      type="button"
      className={`hq-capsule${ready ? (c.openedOn ? ' is-open' : ' is-ready') : ''}`}
      disabled={!ready}
      onClick={() => openSheet({ type: 'hq-capsule-open', id: c.id })}
      aria-label={ready ? `Open: ${c.title || 'time capsule'}` : `Sealed: ${c.title || 'time capsule'}, ${left} days to go`}
    >
      <span className="hq-capsule__drum" aria-hidden="true">
        <i style={{ height: `${ready ? 100 : Math.round((1 - left / total) * 100)}%` }} />
      </span>
      <span className="hq-capsule__t">
        <b>{c.title || `Sealed ${shortDay(c.sealedOn, today)}`}</b>
        <small>{ready ? (c.openedOn ? `Opened ${shortDay(c.openedOn, today)}` : 'Ready to open') : `Opens ${shortDay(c.opensOn, today)}`}</small>
      </span>
      <span className="hq-capsule__n i-mono">{ready ? (c.openedOn ? 'Read' : 'Open') : `${left}d`}</span>
    </button>
  );
}

export function VaultRoom() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const memories = useMemo(() => onThisDay(progressInput(st, today)), [st, today]);
  const name = (s: string) => (SECTIONS.some((x) => x.id === s) ? sectionInfo(s as SectionId).name : 'Other');
  const ready = hq.capsules.filter((c) => canOpen(c, today) && !c.openedOn);
  const sealed = hq.capsules.filter((c) => !canOpen(c, today));
  const opened = hq.capsules.filter((c) => c.openedOn).reverse();
  return (
    <div>
      <RoomHead room="vault" />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-capsule' })}>
        + Write to future you
      </button>
      {ready.length > 0 && (
        <>
          <H2>Ready to open</H2>
          <div className="hq-capsules">
            {ready.map((c) => (
              <CapsuleRow key={c.id} c={c} today={today} />
            ))}
          </div>
        </>
      )}
      {sealed.length > 0 && (
        <>
          <H2 aside={`${sealed.length} sealed`}>In the vault</H2>
          <div className="hq-capsules">
            {sealed.map((c) => (
              <CapsuleRow key={c.id} c={c} today={today} />
            ))}
          </div>
          <Source kind="off">The letters are hidden by the app and stored like the rest of your data, not encrypted.</Source>
        </>
      )}
      {opened.length > 0 && (
        <>
          <H2>Opened</H2>
          <div className="hq-capsules">
            {opened.map((c) => (
              <CapsuleRow key={c.id} c={c} today={today} />
            ))}
          </div>
        </>
      )}
      {!hq.capsules.length && <p className="i-note" style={{ marginTop: 10 }}>Nothing sealed. Year 12 you won’t be around much longer: tell the you of race morning, of results day, of the first week at university what today is like.</p>}

      <H2>On this day</H2>
      {memories.length ? (
        <div className="i-pnl i-pnl--flush">
          {memories.map((m) => (
            <div key={m.date} className="hq-memory">
              <span className="i-lab">
                {m.ago} · {shortDay(m.date, today)}
              </span>
              {m.lines.map((l, i) => (
                <p key={i}>
                  <b>{name(l.section)}</b> {l.text}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing logged a week, a month or a year ago today. Check back tomorrow.</p>
      )}
    </div>
  );
}
