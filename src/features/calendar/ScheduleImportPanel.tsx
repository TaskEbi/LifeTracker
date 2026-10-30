import { useRef, useState } from 'react';
import { toast } from '../../data/ui';
import { Toggle } from '../../ui/i/bits';
import { applyScheduleImport, planScheduleImport, type SchedulePlan } from './importSchedule';

/** Import from the Schedule app: pick its JSON backup, see what comes across, then add it. */
export function ScheduleImportPanel() {
  const file = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<SchedulePlan | null>(null);
  const [withTasks, setWithTasks] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      setPlan(await planScheduleImport(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
    setBusy(false);
  };

  const add = () => {
    if (!plan) return;
    const r = applyScheduleImport(plan, withTasks);
    setPlan(null);
    toast(`Imported ${r.events} event${r.events === 1 ? '' : 's'}${r.tasks ? ` and ${r.tasks} task${r.tasks === 1 ? '' : 's'}` : ''}`);
  };

  const repeating = plan?.events.filter((e) => e.repeat).length ?? 0;
  return (
    <div className="i-pnl i-stack">
      <p className="i-note">
        From the Schedule app: open it, go to Settings → <b>Export backup</b>, then choose that <code>schedule-backup-….json</code> file here. Repeat rules and changed or cancelled days come across; anything already imported is skipped.
      </p>
      <div className="i-btns">
        <button type="button" className="i-btn i-btn--sm" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? 'Reading…' : 'Import a Schedule backup'}
        </button>
        <input ref={file} type="file" accept=".json,application/json" hidden aria-label="Schedule backup file" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      </div>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      {plan && (
        <div className="i-stack" role="status">
          <p className="i-note">
            Ready: <b>{plan.events.length}</b> event{plan.events.length === 1 ? '' : 's'}
            {repeating ? ` (${repeating} repeating)` : ''}
            {plan.tasks.length ? ` and ${plan.tasks.length} task${plan.tasks.length === 1 ? '' : 's'}` : ''}.{plan.already ? ` ${plan.already} already here, skipped.` : ''}
          </p>
          {plan.warnings.map((w) => (
            <p key={w} className="i-note">
              {w}
            </p>
          ))}
          {plan.tasks.length > 0 && (
            <Toggle on={withTasks} label="Add the tasks to Tasks too" onChange={setWithTasks} />
          )}
          <div className="i-btns">
            <button type="button" className="i-btn i-btn--sig i-btn--sm" disabled={!plan.events.length && !(withTasks && plan.tasks.length)} onClick={add}>
              Add to my calendar
            </button>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
