/**
 * 秘密基地, the Hideout: a cutaway of an underground base, where each lit room is a tool and its lamp
 * says whether it needs you. Everything in it is worked out from your records.
 */
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate, useRoute } from '../../app/router';
import { HomeLink } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { FLOORS, ROOMS, useRoomStatus, type RoomId } from './rooms';
import { HideoutTop, RoomScene } from './Art';
import { ArenaRoom } from './rooms/Arena';
import { BreathRoom } from './rooms/Breath';
import { CinemaRoom } from './rooms/Cinema';
import { CloseDayRoom } from './rooms/CloseDay';
import { DiaryRoom } from './rooms/Diary';
import { ExamRoom } from './rooms/ExamHall';
import { ForgeRoom } from './rooms/Forge';
import { LedgerRoom } from './rooms/Ledger';
import { OathRoom } from './rooms/Oath';
import { ScalesRoom } from './rooms/Scales';
import { ArmouryRoom } from './rooms/Armoury';
import { DojoRoom } from './rooms/Dojo';
import { HallRoom } from './rooms/Hall';
import { InfirmaryRoom } from './rooms/Infirmary';
import { LabRoom } from './rooms/Lab';
import { LighthouseRoom } from './rooms/Lighthouse';
import { ObservatoryRoom } from './rooms/Observatory';
import { OracleRoom } from './rooms/Oracle';
import { RitualsRoom } from './rooms/Rituals';
import { VaultRoom } from './rooms/Vault';
import { WarRoom } from './rooms/War';
import './hq.css';
import './hq2.css';

export { ROOMS, FLOORS, type RoomId } from './rooms';

/** A room's heading: the same way back from every one. */
export function RoomHead({ room, children }: { room: RoomId; children?: ReactNode }) {
  const r = ROOMS[room];
  return (
    <>
      <ChannelBar current="base" />
      <header className="hq-rh" style={{ '--rc': r.c } as CSSProperties}>
        <button type="button" className="i-home" onClick={() => navigate('base')}>
          <Icon name="left" size={18} />
          <span>Hideout</span>
        </button>
        <div className="hq-rh__t">
          <span className="hq-rh__k" aria-hidden="true">
            {r.kanji}
          </span>
          <div>
            <h1>{r.name}</h1>
            <p>{r.blurb}</p>
          </div>
        </div>
        {children}
      </header>
    </>
  );
}

function Hub() {
  const status = useRoomStatus();
  const room = (id: RoomId) => {
    const r = ROOMS[id];
    const s = status[id];
    return (
      <button key={id} type="button" className={`hq-room${id === 'lighthouse' ? ' hq-room--wide' : ''}${s.alert ? ' is-alert' : s.on ? ' is-on' : ''}`} style={{ '--rc': r.c } as CSSProperties} onClick={() => navigate('base', [id])} aria-label={`${r.name}: ${s.text}`}>
        <RoomScene room={id} />
        <span className="hq-room__lamp" aria-hidden="true" />
        <span className="hq-room__sign" aria-hidden="true">
          <b>{r.kanji}</b> {r.name}
        </span>
        <span className="hq-room__status">{s.text}</span>
      </button>
    );
  };

  return (
    <>
      <ChannelBar current="base" />
      <header className="hq-top">
        <HideoutTop />
        <HomeLink />
        <div className="hq-top__t">
          <span className="hq-top__k" aria-hidden="true">
            秘密基地
          </span>
          <h1>Hideout</h1>
          <p>Every room runs on your own records.</p>
        </div>
      </header>
      <div className="hq-base">
        {room('lighthouse')}
        {FLOORS.map((f) => (
          <Fragment key={f.level}>
            <h2 className="hq-floor">
              <b>{f.level}</b> {f.name}
            </h2>
            {f.rooms.map(room)}
          </Fragment>
        ))}
      </div>
      <p className="hq-foot">Nothing down here earns XP, and nothing leaves your own database unless a room says so.</p>
    </>
  );
}

export function HqView() {
  const route = useRoute();
  switch (route.rest[0] as RoomId | undefined) {
    case 'lighthouse':
      return <LighthouseRoom />;
    case 'forge':
      return <ForgeRoom />;
    case 'arena':
      return <ArenaRoom />;
    case 'oath':
      return <OathRoom />;
    case 'close':
      return <CloseDayRoom />;
    case 'exam':
      return <ExamRoom />;
    case 'breath':
      return <BreathRoom />;
    case 'ledger':
      return <LedgerRoom />;
    case 'scales':
      return <ScalesRoom />;
    case 'diary':
      return <DiaryRoom />;
    case 'cinema':
      return <CinemaRoom />;
    case 'war':
      return <WarRoom />;
    case 'dojo':
      return <DojoRoom />;
    case 'lab':
      return <LabRoom />;
    case 'observatory':
      return <ObservatoryRoom />;
    case 'infirmary':
      return <InfirmaryRoom />;
    case 'armoury':
      return <ArmouryRoom />;
    case 'oracle':
      return <OracleRoom />;
    case 'vault':
      return <VaultRoom />;
    case 'rituals':
      return <RitualsRoom />;
    case 'hall':
      return <HallRoom />;
    default:
      return <Hub />;
  }
}
