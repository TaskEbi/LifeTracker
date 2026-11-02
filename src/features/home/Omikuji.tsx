/**
 * おみくじ on Home. Tap the card, shake the box, a numbered stick slides out and a paper fortune
 * unrolls. It's drawn by date, so it's the same all day and on every device; this device only
 * remembers that you've looked. A bad one can be tied to the branch and left behind, as at a shrine.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { navigate } from '../../app/router';
import { loadSectionFonts } from '../../app/sectionLook';
import { progressInput, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { drawFortune, fortuneNudge } from '../../domain/fun/omikuji';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { playStyle } from '../../ui/i/fx/celebrate';
import './omikuji.css';

const KEY = 'lifetracker-omikuji';
const seenOn = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const remember = (date: string) => {
  try {
    localStorage.setItem(KEY, date);
  } catch {
    /* private mode: the box is shaken again next visit; it's the same fortune */
  }
};

type Step = 'box' | 'shaking' | 'stick' | 'paper' | 'tied';

function Fortune({ date, onClose, start }: { date: string; onClose: () => void; start: Step }) {
  const f = useMemo(() => drawFortune(date), [date]);
  const st = useStore(data, (s) => s);
  const nudge = useMemo(() => fortuneNudge(progressInput(st, date)), [st, date]);
  const [step, setStep] = useState<Step>(start);
  const first = useRef<HTMLButtonElement>(null);
  const full = playStyle() === 'full';

  useEffect(() => {
    loadSectionFonts('bucket');
    first.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (step === 'shaking') {
      const t = window.setTimeout(() => setStep('stick'), 1050);
      return () => window.clearTimeout(t);
    }
    if (step === 'stick') {
      const t = window.setTimeout(() => setStep('paper'), 950);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const shake = () => {
    remember(date);
    setStep(full ? 'shaking' : 'paper');
  };
  const inBox = step === 'box' || step === 'shaking' || step === 'stick';

  return createPortal(
    <div className={`om om--${f.rank.tone} om--${step}${full ? '' : ' om--calm'}`} role="dialog" aria-modal="true" aria-label="Today's fortune">
      <i className="om__bg" aria-hidden="true" />
      <button ref={first} type="button" className="om__close" onClick={onClose}>
        Close
      </button>

      {inBox && (
        <div className="om__stage">
          <p className="om__hint">{step === 'box' ? 'Shake the box. A stick falls out with your number.' : ' '}</p>
          <div className="om__box" aria-hidden="true">
            <i className="om__stick">
              <b>{f.stick}</b>
            </i>
            <svg viewBox="0 0 120 200">
              <path d="M34 8H86L102 24V188L86 196H34L18 188V24Z" fill="#7c2d1f" stroke="#2c0f09" strokeWidth="4" strokeLinejoin="round" />
              <path d="M34 8H86L102 24H18Z" fill="#a23c28" stroke="#2c0f09" strokeWidth="4" strokeLinejoin="round" />
              <ellipse cx="60" cy="16" rx="7" ry="3" fill="#120503" />
              <path d="M18 44H102M18 176H102" stroke="#e6b84d" strokeWidth="3" />
              <text x="60" y="84" textAnchor="middle" fontSize="28" fill="#f7e5b5" fontFamily="'Yuji Syuku', serif">御</text>
              <text x="60" y="118" textAnchor="middle" fontSize="28" fill="#f7e5b5" fontFamily="'Yuji Syuku', serif">神</text>
              <text x="60" y="152" textAnchor="middle" fontSize="28" fill="#f7e5b5" fontFamily="'Yuji Syuku', serif">籤</text>
            </svg>
          </div>
          {step === 'box' && (
            <button type="button" className="i-btn i-btn--sig om__go" onClick={shake}>
              Shake the box
            </button>
          )}
        </div>
      )}

      {step === 'paper' && (
        <div className="om__paper">
          <div className="om__roll om__roll--top" aria-hidden="true" />
          <div className="om__sheet">
            <div className="om__head">
              <span>第 {f.stick} 番</span>
              <span>御神籤</span>
            </div>
            <div className="om__rank">
              <b lang="ja">{f.rank.kanji}</b>
              <h2>{f.rank.name}</h2>
            </div>
            <ul className="om__lines">
              {f.lines.map((l, i) => (
                <li key={l.label} style={{ '--i': i } as CSSProperties}>
                  <span lang="ja" aria-hidden="true">{l.kanji}</span>
                  <div>
                    <small>{l.label}</small>
                    <p>{l.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            {nudge ? (
              <button
                type="button"
                className="om__nudge"
                onClick={() => {
                  onClose();
                  navigate(nudge.section);
                }}
              >
                <span lang="ja" aria-hidden="true">{sectionInfo(nudge.section).kanji}</span>
                <span>
                  <b>Lucky today: {sectionInfo(nudge.section).name}</b>
                  <small>You haven't logged it for {nudge.days} days. That part's real.</small>
                </span>
              </button>
            ) : (
              <p className="om__nudge om__nudge--plain">Nothing's been left waiting. Lucky today: whatever you like.</p>
            )}
            <p className="om__fun">Just for fun. It changes at midnight.</p>
            {f.rank.tone === 'poor' && (
              <button type="button" className="i-btn i-btn--block om__tie" onClick={() => setStep('tied')}>
                Tie it to the branch and leave it behind
              </button>
            )}
          </div>
          <div className="om__roll om__roll--bottom" aria-hidden="true" />
        </div>
      )}

      {step === 'tied' && (
        <div className="om__tied" role="status">
          <svg viewBox="0 0 240 150" aria-hidden="true">
            <path d="M0 62C60 40 170 52 240 34" stroke="#3b2413" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M70 52C84 34 110 30 128 44M160 44C174 26 196 26 214 38" stroke="#3b2413" strokeWidth="3" fill="none" />
            <g className="om__knot">
              <path d="M120 50L108 72L132 72Z" fill="#f4ecd8" stroke="#9c8a63" />
              <path d="M112 72H128L134 128H106Z" fill="#f4ecd8" stroke="#9c8a63" />
              <path d="M112 90H128M110 104H130" stroke="#b3261e" strokeWidth="1.6" />
            </g>
          </svg>
          <h2>Left on the branch.</h2>
          <p>It can't follow you home now.</p>
        </div>
      )}
    </div>,
    document.querySelector('.i-shell') ?? document.body,
  );
}

/** The card on Home. */
export function OmikujiCard() {
  const today = useToday();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => seenOn() === today);
  const f = useMemo(() => drawFortune(today), [today]);
  const looked = seen && seenOn() === today;
  return (
    <>
      <button type="button" className={`om-card${looked ? ' is-seen' : ''}`} onClick={() => setOpen(true)} aria-label={looked ? `Today's fortune: ${f.rank.name}. Open` : "Today's fortune. Shake the box"}>
        <span className="om-card__k" lang="ja" aria-hidden="true">
          {looked ? f.rank.kanji : '御籤'}
        </span>
        <span className="om-card__t">
          <b>{looked ? f.rank.name : "Today's fortune"}</b>
          <small>{looked ? f.lines[0].text : 'Shake the box. A new one every day.'}</small>
        </span>
      </button>
      {open && (
        <Fortune
          date={today}
          start={looked ? 'paper' : 'box'}
          onClose={() => {
            setOpen(false);
            setSeen(seenOn() === today);
          }}
        />
      )}
    </>
  );
}
