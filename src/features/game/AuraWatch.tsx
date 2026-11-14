/**
 * Mounted once by the shell (through AuraGate): reads the Aura Dial's save when the app opens, rolls
 * for the time away, and plays the scene of anything rare that turned up, wherever you are. While the
 * dial's stage is winding up a rare roll, the scene waits for it to finish.
 */
import { useEffect, useState } from 'react';
import { auraById } from '../../domain/game/aura';
import { AuraScene } from './AuraScene';
import { sceneDone, skipScenes, startAura, useAura } from './auraStore';
import './aura.css';

export default function AuraWatch() {
  useEffect(startAura, []);
  const live = useAura();
  const [, wake] = useState(0);
  const waiting = !live.replay && live.hold > Date.now();
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => wake((n) => n + 1), Math.max(0, live.hold - Date.now()) + 20);
    return () => window.clearTimeout(timer);
  }, [waiting, live.hold]);
  const queue = live.ready ? live.save.queue : [];
  const a = auraById(live.replay ?? queue[0]);
  if (!a || waiting) return null;
  const replay = !!live.replay;
  return <AuraScene key={`${a.id}:${replay ? 'again' : queue.length}`} aura={a} isNew={live.fresh.includes(a.id)} more={replay ? 0 : queue.length - 1} replay={replay} onDone={sceneDone} onSkipAll={skipScenes} />;
}
