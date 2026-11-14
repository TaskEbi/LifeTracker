/**
 * The Works' bridge to the records (domain/game/idle.ts). The factory runs in memory while its tab
 * is open; the save is one `gm_idle` row under the cabinet section, written a moment after anything
 * changes and when the tab is left. Bolts made while it's shut are worked out from the row's time
 * when it's opened again. Cosmetics bought at the counter are `works` rows in the Hangar's ledger.
 */
import { useEffect, useMemo } from 'react';
import { ltToday, prefValue, progressOf, setPref, useToday } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import { toast } from '../../data/ui';
import { SECTION_IDS, type LtRecord } from '../../data/types';
import {
  buyAllUpgrades,
  buyGen,
  buyPerk,
  buyUpgrade,
  catchCat,
  catStay,
  catWait,
  checkMilestones,
  cogsOf,
  DEFAULT_WORKS_LOOK,
  fmt,
  fresh,
  maxBuy,
  normalise,
  normaliseWorksLook,
  openCrate,
  rateNow,
  rebuild,
  settle,
  tap,
  waiting,
  worksPrice,
  type Away,
  type CatPrize,
  type Ext,
  type IdleSave,
  type Milestone,
  type WorksLook,
} from '../../domain/game/idle';
import { itemName } from '../../domain/game/wallet';
import { createStore, useStore } from '../../lib/createStore';
import { GAME_SECTION, getGame, useGame, write } from './store';

export const WORKS_ROW = pairId('gm', 'idle');
const KIND = 'gm_idle';

// ─── what real life adds ────────────────────────────────────────────────────

let extMemo: { st: DataState; today: string; ext: Ext } | null = null;

export function extOf(st: DataState, today: string): Ext {
  if (extMemo && extMemo.st === st && extMemo.today === today) return extMemo.ext;
  const p = progressOf(st, today);
  const sections = new Set<string>();
  for (const e of p.events) if (e.date === today && e.xp > 0 && (SECTION_IDS as readonly string[]).includes(e.section)) sections.add(e.section);
  const ext: Ext = { sections: sections.size, streak: p.streak.n, level: p.overall.level };
  extMemo = { st, today, ext };
  return ext;
}

export const extNow = () => extOf(data.get(), ltToday());

export function useExt(): Ext {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => extOf(st, today), [st, today]);
}

// ─── the factory, live ──────────────────────────────────────────────────────

export interface Cat {
  n: number;
  /** Where it sits, as fractions of the stage. */
  x: number;
  y: number;
  until: number;
}

export interface Pop {
  id: number;
  text: string;
  crit: boolean;
  /** Offset from the middle of the gear, px. */
  x: number;
}

interface Live {
  save: IdleSave;
  /** False until the saved row has been read. */
  ready: boolean;
  heat: number;
  away: Away | null;
  cat: Cat | null;
  /** The cat's last prize, shown for a few seconds. */
  prize: { text: string; at: number } | null;
  pops: Pop[];
}

export const works = createStore<Live>({ save: fresh(Date.now()), ready: false, heat: 0, away: null, cat: null, prize: null, pops: [] });

/** The save object we last wrote, and the row we wrote it in: anything else in the table came from sync. */
let written: { row: LtRecord; at: number } | null = null;
let dirty = false;
let saveTimer: number | null = null;
let lastTap = 0;
let nextCat = 0;
let catN = 0;
let popN = 0;

const rowOf = (st: DataState) => {
  const r = st.lt_records.get(WORKS_ROW);
  return r && !r.deleted_at && r.kind === KIND ? r : null;
};

function put(save: IdleSave, extra: Partial<Live> = {}) {
  const { save: checked, reached } = checkMilestones(save);
  works.set({ save: checked, ...extra });
  if (reached.length) announce(reached);
  dirty = true;
  if (saveTimer === null) saveTimer = window.setTimeout(persist, 2500);
}

function announce(reached: Milestone[]) {
  const cogs = reached.reduce((n, m) => n + m.cogs, 0);
  toast(reached.length === 1 ? `Milestone: ${reached[0].name}. +${cogs} gold cog${cogs === 1 ? '' : 's'}.` : `${reached.length} milestones. +${cogs} gold cogs.`);
}

/** Write the save now (if anything changed and the records are loaded). */
export function persist() {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  const st = data.get();
  const live = works.get();
  if (!dirty || !st.ready || !live.ready) return;
  const t = new Date().toISOString();
  const prev = st.lt_records.get(WORKS_ROW);
  const value = { ...live.save } as unknown as Record<string, unknown>;
  const row: LtRecord = prev
    ? { ...prev, kind: KIND, data: value, deleted_at: null, updated_at: t }
    : { id: WORKS_ROW, section: GAME_SECTION, kind: KIND, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  written = { row, at: live.save.at };
  dirty = false;
  commit('lt_records', [row]);
}

/** Read the saved row (or start new), and pay for the time away. */
function load() {
  const st = data.get();
  if (!st.ready) return;
  const row = rowOf(st);
  const now = Date.now();
  const { save, away } = settle(normalise(row?.data, now), now, extNow());
  written = row ? { row, at: save.at } : null;
  nextCat = now + catWait(save, Math.random()) * 1000;
  works.set({ save, ready: true, heat: 0, cat: null, prize: null, pops: [], away: away && away.gained >= 1 ? away : null });
  if (away) put(save);
}

/** A row that isn't ours and is newer than what we last wrote came from another device: take it. */
function onData() {
  const st = data.get();
  if (!st.ready) return;
  if (!works.get().ready) return load();
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

function tick() {
  const live = works.get();
  if (!live.ready) return;
  const now = Date.now();
  const ext = extNow();
  const { save, away } = settle(live.save, now, ext);
  const heat = now - lastTap > 1200 ? Math.max(0, live.heat - 3) : live.heat;
  let cat = live.cat;
  if (cat && cat.until <= now) {
    cat = null;
    nextCat = now + catWait(save, Math.random()) * 1000;
  } else if (!cat && now >= nextCat) {
    cat = { n: ++catN, x: 0.08 + Math.random() * 0.7, y: 0.12 + Math.random() * 0.5, until: now + catStay(save) * 1000 };
  }
  const prize = live.prize && now - live.prize.at > 5000 ? null : live.prize;
  if (save === live.save && heat === live.heat && cat === live.cat && prize === live.prize && !away) return;
  // Bolts made with the tab open are paid in full, so the saved time has to keep up with them.
  if (save !== live.save) dirty = true;
  const { save: checked, reached } = checkMilestones(save);
  if (reached.length) {
    announce(reached);
    dirty = true;
  }
  works.set({ save: checked, heat, cat, prize, ...(away && away.gained >= 1 ? { away } : {}) });
  if (dirty && saveTimer === null) saveTimer = window.setTimeout(persist, 20_000);
}

let users = 0;
let stop: (() => void) | null = null;

/** Run the factory while something on screen needs it. */
export function useWorksRunning() {
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
        works.set({ ready: false, cat: null, pops: [] });
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

export const useWorks = () => useStore(works, (s) => s);

// ─── doing things ───────────────────────────────────────────────────────────

/** Turn the gear once. */
export function turn() {
  const live = works.get();
  if (!live.ready) return;
  const now = Date.now();
  lastTap = now;
  const { save: settled } = settle(live.save, now, extNow());
  const heat = Math.min(100, live.heat + 4);
  const { save, gain, crit } = tap(settled, now, extNow(), heat, Math.random());
  const pop: Pop = { id: ++popN, text: `+${fmt(gain)}`, crit, x: Math.round((Math.random() - 0.5) * 120) };
  put(save, { heat, pops: [...live.pops.slice(-11), pop] });
}

export const dropPop = (id: number) => works.set((s) => ({ ...s, pops: s.pops.filter((p) => p.id !== id) }));

const act = (f: (s: IdleSave, now: number) => IdleSave | null): boolean => {
  const live = works.get();
  if (!live.ready) return false;
  const now = Date.now();
  const next = f(settle(live.save, now, extNow()).save, now);
  if (!next) return false;
  put(next);
  return true;
};

export const buyMachine = (id: string, n: number | 'max') => act((s) => buyGen(s, id, n === 'max' ? Math.max(1, maxBuy(s, id)) : n));
export const buyWorksUpgrade = (id: string) => act((s) => buyUpgrade(s, id));
export const buyEveryUpgrade = () => act((s) => { const r = buyAllUpgrades(s); return r.n ? r.save : null; });
export const buyWorksPerk = (id: string) => act((s) => buyPerk(s, id));
export const dismissAway = () => works.set({ away: null });

export function rebuildWorks(): boolean {
  const ok = act((s, now) => rebuild(s, now));
  if (ok) persist();
  return ok;
}

export function claimCrate(): boolean {
  const ext = extNow();
  const ok = act((s) => openCrate(s, ltToday(), ext));
  if (ok) persist();
  return ok;
}

const prizeText = (p: CatPrize, cog: boolean) =>
  `${p.kind === 'koban' ? `Koban rain: +${fmt(p.gain)} bolts` : p.kind === 'frenzy' ? `Frenzy: machines ×7 for ${p.seconds} s` : `Tap fever: turns ×15 for ${p.seconds} s`}${cog ? ' · +1 gold cog' : ''}`;

/** Catch the cat that's on the floor. */
export function catchTheCat(): boolean {
  const live = works.get();
  if (!live.ready || !live.cat) return false;
  const now = Date.now();
  const ext = extNow();
  const { save, prize, cog } = catchCat(settle(live.save, now, ext).save, now, ext, ltToday(), Math.random());
  nextCat = now + catWait(save, Math.random()) * 1000;
  put(save, { cat: null, prize: { text: prizeText(prize, cog), at: now } });
  return true;
}

/** Bring the cat out now (the tests call this; in play it comes when it likes). */
export function summonCat() {
  nextCat = 0;
  tick();
}

// ─── the counter: cosmetics for gold cogs ───────────────────────────────────

export const useCogs = (): number => {
  const g = useGame();
  const save = useStore(works, (s) => s.save);
  return useMemo(() => cogsOf(save, g.txs), [save, g.txs]);
};

/** Buy something at the counter. Once each; the row's id is the item, so two devices can't both pay. */
export function buyGood(item: string): boolean {
  const live = works.get();
  const price = worksPrice(item);
  if (!live.ready || price === undefined) return false;
  const g = getGame();
  if (g.wallet.items.has(item)) return false;
  const have = cogsOf(live.save, g.txs);
  if (have < price) {
    toast(`Not yet: ${price - have} more gold cog${price - have === 1 ? '' : 's'}.`);
    return false;
  }
  persist();
  write({ type: 'works', ref: item, cost: {}, gain: { items: [item] } }, pairId('gm:works', item));
  toast(`${itemName(item)} is yours.`);
  return true;
}

export const useWorksLook = (): WorksLook => {
  const raw = useStore(data, (s) => prefValue(s, 'game_works_look'));
  const g = useGame();
  return useMemo(() => normaliseWorksLook(raw, g.wallet.items), [raw, g.wallet.items]);
};

export function setWorksLook(patch: Partial<WorksLook>) {
  const prev = prefValue(data.get(), 'game_works_look');
  setPref('game_works_look', { ...DEFAULT_WORKS_LOOK, ...(prev && typeof prev === 'object' ? prev : {}), ...patch });
}

// ─── for the Home door and the Hangar's tab ─────────────────────────────────

export interface WorksGlance {
  started: boolean;
  /** Bolts a second. */
  rate: number;
  /** Bolts the crew has made since it was last opened. */
  waiting: number;
  crate: boolean;
}

/** A look at the factory without opening it. */
export function useWorksGlance(): WorksGlance {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const live = useStore(works, (s) => (s.ready ? s.save : null));
  return useMemo(() => {
    const now = Date.now();
    const row = rowOf(st);
    const save = live ?? (row ? normalise(row.data, now) : null);
    if (!save) return { started: false, rate: 0, waiting: 0, crate: true };
    const ext = extOf(st, today);
    return { started: save.life > 0 || save.taps > 0, rate: rateNow(save, ext, now), waiting: live ? 0 : waiting(save, now, ext), crate: save.crate < today };
  }, [st, today, live]);
}

export const worksLine = (g: WorksGlance) =>
  !g.started ? 'Turn the gear · machines work while you’re away' : g.waiting >= 1 ? `${fmt(g.waiting)} bolts waiting · ${fmt(g.rate)}/s` : `${fmt(g.rate)} bolts/s${g.crate ? ' · crate ready' : ''}`;
