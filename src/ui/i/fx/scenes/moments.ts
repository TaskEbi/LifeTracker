/** Every moment's sequence, by type (the map type makes sure none is missing). */
import { BATTLE_FX } from './battle';
import { BUCKET_FX } from './bucket';
import { DAY_FX } from './days';
import { MATHS_FX } from './maths';
import { PLAN_FX } from './plans';
import { READING_FX } from './reading';
import { RECORD_FX } from './records';
import type { MomentFxMap } from './types';

export const MOMENT_FX: MomentFxMap = { ...RECORD_FX, ...PLAN_FX, ...DAY_FX, ...BATTLE_FX, ...BUCKET_FX, ...READING_FX, ...MATHS_FX };
