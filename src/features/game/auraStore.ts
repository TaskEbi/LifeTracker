/**
 * The Aura Dial's bridge to the records (domain/game/aura.ts). The save is one `gm_aura` row under
 * the cabinet section. The dial rolls live only while its room is open; the rest of the time (another
 * page, or the app shut) is worked out from the row's time, either when the app is next opened (so a
 * rare aura rolled overnight plays its scene straight away) or when the room is.
 */
import { useEffect } from 'react';
import { navigate, router } from '../../app/router';
import { ltToday } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import { toast } from '../../data/ui';
import type { LtRecord } from '../../data/types';
import {
  AURA_TIERS,
  auraById,
  buyAuraUpgrade,
  buyIncense,
  freshAura,
  normaliseAura,
  oddsText,
  pull,
  SCENE_TIER,
  settleAura,
  upgradeCost,
  watched,
  wear,
  type AuraAway,
  type AuraSave,
  type Batch,
  type Ctx,
} from '../../domain/game/aura';
import { fmt } from '../../domain/game/idle';
import { createStore, useStore } from '../../lib/createStore';
import { GAME_SECTION } from './store';
import { extNow, spendBolts } from './worksStore';

export const AURA_ROW = pairId('gm', 'aura');
const KIND = 'gm_aura';

/** One line of the dial's tape: the rarest thing a turn landed on. */
export interface Hit {
  n: number;
  id: string;
  fresh: boolean;
  hand: boolean;
  /** How many rolls the turn was. */
  of: number;
}

interface Live {
  save: AuraSave;
  /** False until the saved row has been read. */
  ready: boolean;
  away: AuraAway | null;
  tape: Hit[];
  /** Rolled for the first time since the app was opened (scenes say "New"). */
  fresh: string[];
  /** A scene being watched again from the index. */
  replay: string | null;
  /** When the dial can next be pulled by hand. */
  coolUntil: number;
}

export const aura = createStore<Live>({ save: freshAura(Date.now()), ready: false, away: null, tape: [], fresh: [], replay: null, coolUntil: 0 });

let written: { row: LtRecord; at: number } | null = null;
let dirty = false;
let saveTimer: number | null = null;
let hitN = 0;

const ctx = (): Ctx => ({ ext: extNow(), day: ltToday(), rng: Math.random });

const rowOf = (st: DataState) => {
  const r = st.lt_records.get(AURA_ROW);
  return r && !r.deleted_at && r.kind === KIND ? r : null;
};

const inRoom = () => {
  const r = router.get().route;
  return r.name === 'hangar' && r.rest[0] === 'works' && r.rest[1] === 'aura';
};

/** Write the save now (if anything changed and the records are loaded). */
export function persistAura() {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  const st = data.get();
  const live = aura.get();
  if (!dirty || !st.ready || !live.ready) return;
  const t = new Date().toISOString();
  const prev = st.lt_records.get(AURA_ROW);
  const value = { ...live.save } as unknown as Record<string, unknown>;
  const row: LtRecord = prev
    ? { ...prev, kind: KIND, data: value, deleted_at: null, updated_at: t }
    : { id: AURA_ROW, section: GAME_SECTION, kind: KIND, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  written = { row, at: live.save.at };
  dirty = false;
  commit('lt_records', [row]);
}

function put(save: AuraSave, extra: Partial<Live> = {}, soon = false) {
  aura.set({ save, ...extra });
  dirty = true;
  if (soon) {
    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persistAura, 400);
  } else if (saveTimer === null) saveTimer = window.setTimeout(persistAura, 20_000);
}

/** Tell the room (and whoever is looking) about auras rolled for the first time. */
function hail(batch: Batch) {
  const quiet = batch.fresh.map(auraById).filter((a) => a && a.tier < SCENE_TIER);
  if (!quiet.length) return;
  const cogs = quiet.reduce((n, a) => n + AURA_TIERS[a!.tier].cogs, 0);
  toast(quiet.length === 1 ? `New aura: ${quiet[0]!.name} (${oddsText(quiet[0]!)}). +${cogs} gold cog${cogs === 1 ? '' : 's'}.` : `${quiet.length} new auras. +${cogs} gold cogs.`);
}

const hitOf = (batch: Batch, hand: boolean): Hit | null => (batch.best ? { n: ++hitN, id: batch.best, fresh: batch.fresh.includes(batch.best), hand, of: batch.rolls } : null);

/** Read the saved row (or start new) and roll for the time away. */
function load() {
  const st = data.get();
  if (!st.ready) return;
  const row = rowOf(st);
  const now = Date.now();
  const { save, away, batch } = settleAura(normaliseAura(row?.data, now), now, ctx());
  written = row ? { row, at: save.at } : null;
  aura.set((s) => ({ ...s, save, ready: true, away: away ?? s.away, fresh: batch ? [...new Set([...s.fresh, ...batch.fresh])] : s.fresh }));
  if (!batch) return;
  dirty = true;
  persistAura();
  if (away && !inRoom()) {
    const news = away.fresh.length ? ` · ${away.fresh.length} new` : '';
    toast(`The Aura Dial made ${fmt(away.rolls)} rolls while you were away${news}.`, { label: 'Open', run: () => navigate('hangar', ['works', 'aura']) });
  }
}

/** A row that isn't ours and is newer than what we last wrote came from another device: take it. */
function onData() {
  const st = data.get();
  if (!st.ready) return;
  if (!aura.get().ready) return load();
  const row = rowOf(st);
  if (!row || row === written?.row) return;
  const at = typeof row.data.at === 'number' ? row.data.at : 0;
  if (at > (written?.at ?? 0)) {
    dirty = false;
    load();
  } else {
    written = written ? { ...written, row } : null;
  }
}

let started = false;

/** Start watching the saved row. Safe to call more than once. */
export function startAura() {
  if (started) return;
  started = true;
  data.subscribe(onData);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && persistAura());
  window.addEventListener('pagehide', persistAura);
  onData();
}

function tick() {
  const live = aura.get();
  if (!live.ready || !live.save.rolls) return;
  const { save, away, batch } = settleAura(live.save, Date.now(), ctx());
  if (save === live.save) return;
  if (!batch) return void aura.set({ save });
  const hit = hitOf(batch, false);
  hail(batch);
  put(save, { tape: hit ? [...live.tape.slice(-7), hit] : live.tape, fresh: batch.fresh.length ? [...live.fresh, ...batch.fresh] : live.fresh, ...(away ? { away } : {}) }, batch.fresh.length > 0 || save.queue !== live.save.queue);
}

/** Roll live while the room is on screen. */
export function useAuraRoom() {
  useEffect(() => {
    startAura();
    tick();
    const timer = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(timer);
      persistAura();
    };
  }, []);
}

export const useAura = () => useStore(aura, (s) => s);

// ─── doing things ───────────────────────────────────────────────────────────

export const PULL_COOLDOWN_MS = 500;

/** Pull the dial yourself. */
export function pullDial(): boolean {
  const live = aura.get();
  const now = Date.now();
  if (!live.ready || now < live.coolUntil) return false;
  // The first pull starts the clock: nothing rolls on its own before it.
  const base = live.save.rolls ? settleAura(live.save, now, ctx()).save : { ...live.save, at: now };
  const batch = pull(base, ctx());
  const hit = hitOf(batch, true);
  hail(batch);
  put(batch.save, { tape: hit ? [...live.tape.slice(-7), hit] : live.tape, fresh: [...live.fresh, ...batch.fresh], coolUntil: now + PULL_COOLDOWN_MS }, batch.fresh.length > 0 || batch.save.queue !== live.save.queue || !live.save.rolls);
  return true;
}

const act = (f: (s: AuraSave) => AuraSave | null): boolean => {
  const live = aura.get();
  if (!live.ready) return false;
  const next = f(settleAura(live.save, Date.now(), ctx()).save);
  if (!next) return false;
  put(next, {}, true);
  return true;
};

export function buyAuraUp(id: string): boolean {
  const live = aura.get();
  const cost = upgradeCost(live.save, id);
  if (cost === null) return false;
  if (id !== 'feed') return act((s) => buyAuraUpgrade(s, id));
  // Bolts come off the factory floor first; the level follows only if they were there.
  if (!spendBolts(cost)) {
    toast(`Not yet: that takes ${fmt(cost)} bolts on the factory floor.`);
    return false;
  }
  return act((s) => buyAuraUpgrade(s, id, cost));
}

export const lightIncense = () => act((s) => buyIncense(s, extNow()));
export const wearAura = (id: string | null) => act((s) => wear(s, id));
export const dismissAuraAway = () => aura.set({ away: null });

/** The scene on screen is over: take it off the list (or stop the replay). */
export function sceneDone() {
  const live = aura.get();
  if (live.replay) return aura.set({ replay: null });
  const id = live.save.queue[0];
  if (id) put(watched(live.save, id), {}, true);
}

/** Skip every scene that's waiting. */
export function skipScenes() {
  const live = aura.get();
  if (live.replay) aura.set({ replay: null });
  if (live.save.queue.length) put({ ...live.save, queue: [] }, {}, true);
}

/** Watch a scene again. Only for an aura you've rolled. */
export function replayScene(id: string) {
  const live = aura.get();
  if (live.ready && live.save.got[id]) aura.set({ replay: id });
}
