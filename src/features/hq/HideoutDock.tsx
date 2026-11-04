/** Home's way into the Hideout: rooms that need you first, then the everyday ones, one tap each. */
import type { CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { SYSTEM_KANJI } from '../../domain/sections';
import { ROOMS, useRoomStatus, type RoomId } from './rooms';

/** The rooms most days need, in the order a day uses them. */
const EVERYDAY: RoomId[] = ['forge', 'rituals', 'diary', 'dojo', 'close', 'lighthouse', 'war', 'breath', 'lab'];

export function HideoutDock() {
  const status = useRoomStatus();
  const alerts = (Object.keys(ROOMS) as RoomId[]).filter((id) => status[id].alert);
  const order = [...alerts, ...EVERYDAY.filter((id) => !alerts.includes(id))].slice(0, 9);
  return (
    <section className="h-sec h-dock" aria-label="Hideout rooms">
      <div className="h-h2row">
        <h2 className="h-h2">
          <span aria-hidden="true">{SYSTEM_KANJI.base}</span> Hideout
        </h2>
        <button type="button" className="i-link" onClick={() => navigate('base')}>
          All {Object.keys(ROOMS).length} rooms ▶
        </button>
      </div>
      <div className="h-dock__row">
        {order.map((id) => {
          const r = ROOMS[id];
          const s = status[id];
          return (
            <button key={id} type="button" className={`h-dock__room${s.alert ? ' is-alert' : ''}`} style={{ '--rc': r.c } as CSSProperties} onClick={() => navigate('base', [id])} aria-label={`${r.name}: ${s.text}`}>
              <span className="h-dock__k" aria-hidden="true">
                {r.kanji}
              </span>
              <b>{r.name}</b>
              <small>{s.text}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
