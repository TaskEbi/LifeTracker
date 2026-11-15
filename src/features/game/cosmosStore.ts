/**
 * The Cosmos' bridge to the records (domain/game/cosmos.ts). The game runs in memory while its tab
 * is open; the save is one `gm_cosmos` row under the cabinet section, written a moment after
 * anything changes and when the tab is left. Dust gathered while it's shut is worked out from the
 * row's time when it's opened again. Two devices' copies are merged, never picked between.
 */
import { useEffect, useMemo } from 'react';
import { useToday } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import { toast } from '../../data/ui';
import type { LtRecord } from '../../data/types';
import {
  autoStep,
  bang,
  buyAllBodies,
  buyAsc,
  buyBody,
  buyEveryUp,
  buyEveryVoid,
  buyNode,
  buyRelic,
  buyUp,
  buyVoid,
  check,
  collapse,
  enterChal,
  fmt,
  freshCosmos,
  ignite,
  leaveChal,
  maxBody,
  mergeCosmos,
  normaliseCosmos,
  rateNow,
  setAuto,
  settle,
  tap,
  transcend,
  waiting,
  wearRelic,
  type AutoKey,
  type Away,
  type CosmosSave,
  type Layer,
} from '../../domain/game/cosmos';
import { NO_CLAMP, sameData } from '../../domain/game/saves';
import { createStore, useStore } from '../../lib/createStore';
import { GAME_SECTION } from './store';
import { extNow, extOf } from './worksStore';

export const COSMOS_ROW = pairId('gm', 'cosmos');
const KIND = 'gm_cosmos';

export interface Pop {
  id: number;
  text: string;
  crit: boolean;
  x: number;
}

/** A layer that has just been done, for the full-stage flash. */
export interface Flash {
  n: number;
  layer: Layer;
  text: string;
}

interface Live {
  save: CosmosSave;
  ready: boolean;
  away: Away | null;
  pops: Pop[];
  flash: Flash | null;
  /** Counts taps, so the sky can throw a spark for each. */
  pulse: number;
}

export const cosmos = createStore<Live>({ save: freshCosmos(Date.now()), ready: false, away: null, pops: [], flash: null, pulse: 0 });

/** The row we last wrote: anything else in the table came from sync. */
let written: { row: LtRecord; save: CosmosSave } | null = null;
let dirty = false;
let saveTimer: number | null = null;
let popN = 0;
let flashN = 0;
let lastAuto = 0;

const rowOf = (st: DataState) => {
  const r = st.lt_records.get(COSMOS_ROW);
  return r && !r.deleted_at && r.kind === KIND ? r : null;
};

function schedule(ms: number) {
  if (saveTimer === null) saveTimer = window.setTimeout(persist, ms);
}

/** Take a new save: note achievements and a finished challenge, and save soon. */
function put(next: CosmosSave, extra: Partial<Live> = {}, soon = 2500) {
  const { save, feats, won } = check(next);
  cosmos.set({ save, ...extra });
  if (won) toast(`${won.c.name} tier ${won.tier} done. ${won.c.reward}, for good.`);
  if (feats.length) toast(feats.length === 1 ? `Feat: ${feats[0].name}. Dust +5%.` : `${feats.length} feats. Dust +${Math.round((1.05 ** feats.length - 1) * 100)}%.`);
  dirty = true;
  schedule(soon);
}

/** Write the save now (if anything changed and the records are loaded). */
export function persist() {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  const st = data.get();
  const live = cosmos.get();
  if (!dirty || !st.ready || !live.ready) return;
  const t = new Date().toISOString();
  const prev = st.lt_records.get(COSMOS_ROW);
  const value = { ...live.save } as unknown as Record<string, unknown>;
  const row: LtRecord = prev
    ? { ...prev, kind: KIND, data: value, deleted_at: null, updated_at: t }
    : { id: COSMOS_ROW, section: GAME_SECTION, kind: KIND, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  written = { row, save: live.save };
  dirty = false;
  commit('lt_records', [row]);
}

/** Read the saved row (or start new), and pay for the time away. Waits for the first pull. */
function load() {
  const st = data.get();
  if (!st.ready || !st.sync.pulled) return;
  const row = rowOf(st);
  const now = Date.now();
  const { save, away } = settle(normaliseCosmos(row?.data, now), now, extNow());
  written = row ? { row, save: normaliseCosmos(row.data, NO_CLAMP) } : null;
  cosmos.set({ save, ready: true, pops: [], flash: null, away: away && away.dust >= 1 ? away : null });
  if (away) put(save);
}

/**
 * A row that isn't the one we wrote came from the server (another device, or our own write coming
 * back). Merge it into the save on screen; if it lacks something we wrote, an older copy was pushed
 * over ours, so write the merged save again soon.
 */
function onData() {
  const st = data.get();
  if (!st.ready || !st.sync.pulled) return;
  const live = cosmos.get();
  if (!live.ready) return load();
  const row = rowOf(st);
  if (!row || row === written?.row) return;
  const theirs = normaliseCosmos(row.data, NO_CLAMP);
  const lacking = !!written && !sameData(mergeCosmos(theirs, written.save), theirs);
  written = { row, save: written?.save ?? theirs };
  const merged = mergeCosmos(live.save, theirs);
  if (!sameData(merged, live.save)) cosmos.set({ save: { ...merged, at: Math.min(merged.at, Date.now()) } });
  if (lacking) {
    dirty = true;
    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persist, 1500);
  }
}

const VERB: Record<Layer, string> = { 1: 'Ignite', 2: 'Collapse', 3: 'Big Bang', 4: 'Transcend' };

function tick() {
  const live = cosmos.get();
  if (!live.ready) return;
  const now = Date.now();
  let { save } = settle(live.save, now, extNow());
  if (now - lastAuto >= 500) {
    lastAuto = now;
    save = autoStep(save, now);
  }
  if (save === live.save) return;
  const done = check(save);
  if (done.won || done.feats.length) return put(save, {}, 20_000);
  cosmos.set({ save });
  dirty = true;
  schedule(20_000);
}

let users = 0;
let stop: (() => void) | null = null;

/** Run the game while something on screen needs it. */
export function useCosmosRunning() {
  useEffect(() => {
    if (users++ === 0) {
      load();
      const timer = window.setInterval(tick, 100);
      const unsub = data.subscribe(onData);
      const hide = () => document.visibilityState === 'hidden' && persist();
      document.addEventListener('visibilitychange', hide);
      window.addEventListener('pagehide', persist);
      stop = () => {
        window.clearInterval(timer);
        unsub();
        document.removeEventListener('visibilitychange', hide);
        window.removeEventListener('pagehide', persist);
        persist();
        cosmos.set({ ready: false, pops: [], flash: null });
      };
    }
    return () => {
      if (--users === 0) {
        stop?.();
        stop = null;
      }
    };
  }, []);
}

export const useCosmos = () => useStore(cosmos, (s) => s);

// ─── doing things ───────────────────────────────────────────────────────────

/** Tap the core once. */
export function tapCore() {
  const live = cosmos.get();
  if (!live.ready) return;
  const now = Date.now();
  const ext = extNow();
  const { save, gain, crit } = tap(settle(live.save, now, ext).save, now, ext, Math.random());
  const pop: Pop = { id: ++popN, text: gain > 0 ? `+${fmt(gain)}` : '0', crit, x: Math.round((Math.random() - 0.5) * 110) };
  put(save, { pops: [...live.pops.slice(-9), pop], pulse: live.pulse + 1 });
}

export const dropPop = (id: number) => cosmos.set((s) => ({ ...s, pops: s.pops.filter((p) => p.id !== id) }));
export const dismissAway = () => cosmos.set({ away: null });
export const clearFlash = (n: number) => cosmos.set((s) => (s.flash?.n === n ? { ...s, flash: null } : s));

const act = (f: (s: CosmosSave, now: number) => CosmosSave | null, extra: Partial<Live> = {}): boolean => {
  const live = cosmos.get();
  if (!live.ready) return false;
  const now = Date.now();
  const next = f(settle(live.save, now, extNow()).save, now);
  if (!next) return false;
  put(next, extra);
  return true;
};

export const buyBodies = (id: string, n: number | 'max') => act((s) => buyBody(s, id, n === 'max' ? Math.max(1, maxBody(s, id)) : n));
export const buyEveryBody = () => act((s) => buyAllBodies(s));
export const buyDustUp = (id: string) => act((s) => buyUp(s, id));
export const buyEveryDustUp = () => act((s) => buyEveryUp(s));
export const buyStar = (id: string) => act((s) => buyNode(s, id));
export const buyVoidUp = (id: string) => act((s) => buyVoid(s, id));
export const buyEveryVoidUp = () => act((s) => buyEveryVoid(s));
export const buyRelicLevel = (id: string) => act((s) => buyRelic(s, id));
export const toggleRelic = (id: string) => act((s) => wearRelic(s, id));
export const buyAscension = (id: string) => act((s) => buyAsc(s, id));
export const switchAuto = (k: AutoKey, on: boolean) => act((s) => setAuto(s, k, on));

/** Do a layer by hand: the stage flashes, and the save is written straight away. */
export function prestige(layer: Layer): boolean {
  const before = cosmos.get().save;
  const f = layer === 1 ? ignite : layer === 2 ? collapse : layer === 3 ? bang : transcend;
  const ok = act(f);
  if (!ok) return false;
  const after = cosmos.get().save;
  const gained = layer === 1 ? after.lightAll - before.lightAll : layer === 2 ? after.darkAll - before.darkAll : layer === 3 ? after.galAll - before.galAll : after.eonAll - before.eonAll;
  const coin = layer === 1 ? 'starlight' : layer === 2 ? 'dark matter' : layer === 3 ? (gained === 1 ? 'galaxy' : 'galaxies') : gained === 1 ? 'aeon' : 'aeons';
  cosmos.set({ flash: { n: ++flashN, layer, text: `${VERB[layer]}: +${fmt(gained)} ${coin}` } });
  persist();
  return true;
}

export function startChallenge(id: string): boolean {
  const ok = act((s, now) => enterChal(s, id, now));
  if (ok) persist();
  return ok;
}
export const quitChallenge = () => act((s) => leaveChal(s));

// ─── for the Home door and the Hangar's tab ─────────────────────────────────

export interface CosmosGlance {
  started: boolean;
  rate: number;
  waiting: number;
}

/** A look at the game without opening it. */
export function useCosmosGlance(): CosmosGlance {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const live = useStore(cosmos, (s) => (s.ready ? s.save : null));
  return useMemo(() => {
    const now = Date.now();
    const row = rowOf(st);
    const save = live ?? (row ? normaliseCosmos(row.data, now) : null);
    if (!save) return { started: false, rate: 0, waiting: 0 };
    const ext = extOf(st, today);
    return { started: save.life > 0, rate: rateNow(save, ext, now), waiting: live ? 0 : waiting(save, now, ext) };
  }, [st, today, live]);
}

export const cosmosLine = (g: CosmosGlance) => (!g.started ? 'Gather dust, light a star, and start again four ways' : g.waiting >= 1 ? `${fmt(g.waiting)} dust waiting · ${fmt(g.rate)}/s` : `${fmt(g.rate)} dust/s`);
