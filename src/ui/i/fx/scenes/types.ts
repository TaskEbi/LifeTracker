import type { ReactNode } from 'react';
import type { Moment, MomentType } from '../../../../domain/progress/moments';
import type { Timing, Told } from '../kit';

export type MomentOf<T extends MomentType> = Extract<Moment, { type: T }>;

/** One moment's sequence: what it says, how long it runs, the 3D scene and its calm-card art. */
export interface MomentFx<T extends MomentType> {
  tell(m: MomentOf<T>): Told;
  time(m: MomentOf<T>): Timing;
  Scene(p: { m: MomentOf<T> }): ReactNode;
  calm(m: MomentOf<T>): ReactNode;
}

export type MomentFxMap = { [T in MomentType]: MomentFx<T> };

/** The same, with the moment's type erased (the map guarantees each entry matches its type). */
export interface AnyMomentFx {
  tell(m: Moment): Told;
  time(m: Moment): Timing;
  Scene(p: { m: Moment }): ReactNode;
  calm(m: Moment): ReactNode;
}

/** A section's own level-up sequence. */
export interface SectionFx {
  Scene(p: { from: number; to: number }): ReactNode;
  time: Timing;
  /** Calm-card art. */
  calm: ReactNode;
}
