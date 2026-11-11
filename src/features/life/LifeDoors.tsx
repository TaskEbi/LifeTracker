/** Home → More: the ways into the life pages, each with a live line. */
import type { CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { useToday } from '../../data/lt';
import { stressName, weatherOf } from '../../domain/hq/checkin';
import { checkInStreak } from '../../domain/mood/patterns';
import { useHq } from '../hq/store';
import { mediaLine } from '../media/MediaPage';
import { useMedia } from '../media/store';
import { moneyLine } from '../money/MoneyPage';
import { useMoney, useMoneyFmt } from '../money/store';
import { peopleLine } from '../people/PeoplePage';
import { usePeople } from '../people/store';
import { placesLine } from '../places/PlacesPage';
import { usePlaces } from '../places/store';
import { stageHomeLine } from '../stage/StagePage';
import { useShows } from '../stage/store';
import { data } from '../../data/store';
import { useStore } from '../../lib/createStore';
import { LIFE, LIFE_IDS, type LifeId } from './Frame';

export function LifeDoors() {
  const today = useToday();
  const hq = useHq();
  const money = useMoney();
  const fmt = useMoneyFmt();
  const people = usePeople();
  const media = useMedia();
  const places = usePlaces();
  const shows = useShows();
  const st = useStore(data, (x) => x);
  const c = hq.checkIns.find((x) => x.date === today);
  const streak = checkInStreak(hq.checkIns, today);
  const lines: Record<LifeId, string> = {
    mood: c ? [`${weatherOf(c.mood).name} today`, c.stress ? `${stressName(c.stress).toLowerCase()} stress` : '', streak > 1 ? `${streak} days running` : ''].filter(Boolean).join(' · ') : 'Not checked in today',
    money: moneyLine(money, today, fmt),
    people: peopleLine(people, today),
    media: mediaLine(media, today),
    places: placesLine(places, today),
    stage: stageHomeLine(st, shows, today),
  };
  return (
    <section className="h-sec" aria-label="Life">
      <div className="lf-doors">
        {LIFE_IDS.map((id) => (
          <button key={id} type="button" className="lf-door" style={{ '--lc': LIFE[id].c } as CSSProperties} onClick={() => navigate(id)}>
            <span className="lf-door__k" aria-hidden="true">
              {LIFE[id].k}
            </span>
            <span className="lf-door__t">
              <b>{LIFE[id].name}</b>
              <small>{lines[id]}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
