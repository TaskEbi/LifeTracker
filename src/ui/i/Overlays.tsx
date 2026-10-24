import { useEffect, useRef } from 'react';
import { rewardStore, useProgress } from '../../data/lt';
import { dismissToast, ui } from '../../data/ui';
import { STAGES } from '../../domain/progress/engine';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { Drone } from './Drone';

/** Toasts from anywhere (saves, undo). Announced politely to screen readers. */
export function Toasts() {
  const toasts = useStore(ui, (s) => s.toasts);
  return (
    <div className="i-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="i-toast">
          <span>{t.text}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.run();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** What a save earned. Shown only when there is something to show; the numbers are the real difference. */
export function RewardOverlay() {
  const r = useStore(rewardStore, (s) => s.reward);
  const stage = useProgress().overall.stage;
  const ok = useRef<HTMLButtonElement>(null);
  const close = () => rewardStore.set({ reward: null });
  useEffect(() => {
    if (!r) return;
    ok.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [r]);
  if (!r) return null;
  return (
    <div className="i-reward" role="dialog" aria-modal="true" aria-label="What you earned">
      <div className="i-reward__box">
        {r.evolved ? (
          <>
            <div className="i-upgrade">
              <span className="i-upgrade__scan" />
              <div className="i-upgrade__old">
                <Drone stage={r.evolved.from} still label={false} />
              </div>
              <div className="i-upgrade__new">
                <Drone stage={r.evolved.to} still happy />
              </div>
            </div>
            <div className="i-reward__up">
              Transformation · <em>{STAGES[r.evolved.from].name} → {STAGES[r.evolved.to].name}</em>
            </div>
            <p className="i-note">{r.preview ? 'A preview of the next form. Nothing was added.' : `Level ${r.overallUp?.to}. Form ${r.evolved.to + 1} of ${STAGES.length}: new hardware, new colours.`}</p>
          </>
        ) : (
          <div style={{ width: 96, margin: '0 auto' }} className="i-drone">
            <Drone stage={stage} still happy />
          </div>
        )}
        {r.rest ? (
          <>
            <div className="i-reward__up">Rest day logged</div>
            <p className="i-note">Streak held at {r.streak} days. Recovery is part of the system.</p>
          </>
        ) : !r.preview ? (
          <>
            <div className="i-reward__xp">
              +{r.total}
              <small> XP</small>
            </div>
            <ul>
              {r.lines
                .filter((l) => l.section !== 'quests')
                .map((l, i) => (
                  <li key={i}>
                    <span>{l.reason}</span>
                    <b>+{l.xp}</b>
                  </li>
                ))}
            </ul>
            {r.lines
              .filter((l) => l.section === 'quests')
              .map((l, i) => (
                <div key={`q${i}`} className="i-reward__up i-reward__up--quest">
                  {l.reason.replace(/^(Daily|Weekly|Monthly) quest: /, '$1 quest · ')} · <em>+{l.xp} XP</em>
                </div>
              ))}
          </>
        ) : null}
        {r.sectionUps.map((u) => (
          <div key={u.section} className="i-reward__up">
            {sectionInfo(u.section).code} {sectionInfo(u.section).name} · <em>LV {pad2(u.from)} → {pad2(u.to)}</em>
          </div>
        ))}
        {r.overallUp && !r.evolved && (
          <div className="i-reward__up">
            Level up · <em>LV {r.overallUp.to}</em>
          </div>
        )}
        {r.unlocked.map((a) => (
          <div key={a.id}>
            <div className="i-reward__up i-reward__up--ach">
              {a.tier} achievement · <em>{a.title}</em>
            </div>
            <p className="i-note">{a.desc}</p>
          </div>
        ))}
        {r.pain && <p className="i-note i-note--warn" style={{ textAlign: 'left' }}>Pain noted. Consider resting or easing the next session; talk to a coach or physio if it keeps happening.</p>}
        {r.streakUp && <p className="i-mono i-small i-mid">STREAK {String(r.streak).padStart(3, '0')}</p>}
        <button ref={ok} type="button" className="i-btn i-btn--sig i-btn--block" onClick={close}>
          OK
        </button>
      </div>
    </div>
  );
}
