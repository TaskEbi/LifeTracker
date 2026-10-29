/** Every moment's sequence, by type (the map type makes sure none is missing). */
import { BATTLE_FX } from './battle';
import { DAY_FX } from './days';
import { PLAN_FX } from './plans';
import { RECORD_FX } from './records';
import type { MomentFxMap } from './types';

export const MOMENT_FX: MomentFxMap = { ...RECORD_FX, ...PLAN_FX, ...DAY_FX, ...BATTLE_FX };
