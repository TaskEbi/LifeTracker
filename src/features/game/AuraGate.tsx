/**
 * Loads the Aura Dial's watcher (its own chunk) only when there's a dial to watch: a saved row, or
 * the dial's room on screen.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { useRoute } from '../../app/router';
import { pairId } from '../../data/logActions';
import { data } from '../../data/store';
import { useStore } from '../../lib/createStore';

const AuraWatch = lazy(() => import('./AuraWatch'));
const ROW = pairId('gm', 'aura');

export function AuraGate() {
  const route = useRoute();
  const saved = useStore(data, (s) => s.ready && s.lt_records.get(ROW)?.kind === 'gm_aura');
  const inRoom = route.name === 'hangar' && route.rest[0] === 'works' && route.rest[1] === 'aura';
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (saved || inRoom) setOn(true);
  }, [saved, inRoom]);
  return on ? (
    <Suspense fallback={null}>
      <AuraWatch />
    </Suspense>
  ) : null;
}
