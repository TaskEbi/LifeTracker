import type { ReactNode } from 'react';
import type { Moment, MomentType } from '../../../../domain/progress/moments';
import type { Special, SpecialType } from '../../../../domain/fun/special';
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

export type SpecialOf<T extends SpecialType> = Extract<Special, { type: T }>;

/** One special moment's long scene: same shape as a moment's. */
export interface SpecialFx<T extends SpecialType> {
  tell(m: SpecialOf<T>): Told;
  time(m: SpecialOf<T>): Timing;
  Scene(p: { m: SpecialOf<T> }): ReactNode;
  calm(m: SpecialOf<T>): ReactNode;
}
export type SpecialFxMap = { [T in SpecialType]: SpecialFx<T> };
export interface AnySpecialFx {
  tell(m: Special): Told;
  time(m: Special): Timing;
  Scene(p: { m: Special }): ReactNode;
  calm(m: Special): ReactNode;
}
